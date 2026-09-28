import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  contactMessagesTable,
  db,
  emailOutboxTable,
  notificationsTable,
  usersTable,
} from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";
import { requireSupport } from "../middleware/auth";
import { getIO } from "../socket";
import { persistentRateLimit } from "../lib/rate-limit";
import { z } from "zod";
import { escapeHtml } from "../lib/security";

const router: IRouter = Router();
const CONTACT_PAGE_SIZE = 50;
const contactLimit = persistentRateLimit("contact", 5, 60 * 60_000);

router.get("/contact", requireSupport, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const offset = (page - 1) * CONTACT_PAGE_SIZE;
  const paged = await db
    .select()
    .from(contactMessagesTable)
    .orderBy(desc(contactMessagesTable.createdAt))
    .limit(CONTACT_PAGE_SIZE)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactMessagesTable);

  res.json({
    items: paged,
    page,
    pageSize: CONTACT_PAGE_SIZE,
    total: Number(count),
  });
});

router.patch(
  "/contact/:id",
  requireSupport,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const parsed = z
      .object({ status: z.enum(["new", "read", "replied", "closed"]) })
      .safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid contact status.",
        requestId: req.id,
      });
      return;
    }
    const [message] = await db
      .update(contactMessagesTable)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(contactMessagesTable.id, id))
      .returning();
    if (!message) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Contact message not found.",
        requestId: req.id,
      });
      return;
    }
    res.json(message);
  },
);

router.post("/contact", contactLimit, async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, message } = parsed.data;

  const saved = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(contactMessagesTable)
      .values({ name, email, message })
      .returning();
    const staff = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          inArray(usersTable.role, ["admin", "support"]),
          eq(usersTable.status, "active"),
        ),
      );
    if (staff.length)
      await tx.insert(notificationsTable).values(
        staff.map(({ id: userId }) => ({
          userId,
          type: "support_contact",
          title: "New contact message",
          message: `${name} submitted a support request.`,
          href: "/admin",
        })),
      );
    await tx.insert(emailOutboxTable).values({
      toEmail: email,
      subject: "Shiprion - We received your message",
      html: `<div style="font-family:sans-serif"><h2>We received your message</h2><p>Hi ${escapeHtml(name)}, our support team will get back to you as soon as possible.</p></div>`,
    });
    if (process.env.SUPPORT_EMAIL)
      await tx.insert(emailOutboxTable).values({
        toEmail: process.env.SUPPORT_EMAIL,
        subject: `Shiprion - Contact request ${created!.id}`,
        html: `<div style="font-family:sans-serif"><h2>New contact request</h2><p>From: ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message)}</p></div>`,
      });
    return created!;
  });

  req.log.info({ id: saved.id }, "Contact message received");

  try {
    getIO().to("staff").emit("contactMessageCreated", { id: saved.id });
  } catch {
    // Socket.IO not yet initialized — non-fatal
  }

  res.status(201).json({
    id: saved.id,
    message:
      "Thank you for reaching out! We'll get back to you within 24 hours.",
  });
});

export default router;
