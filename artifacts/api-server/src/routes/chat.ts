import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  chatMessagesTable,
  chatSessionsTable,
  db,
  emailOutboxTable,
  notificationsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, requireSupport } from "../middleware/auth";
import { getIO } from "../socket";
import { persistentRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

const CHAT_MSG_MAX_LEN = 2000;
const CHAT_ADMIN_LIST_LIMIT = 200;
const chatSessionLimit = persistentRateLimit("chat-session", 5, 60 * 60_000);

router.get("/chat/sessions", requireAuth, async (req, res): Promise<void> => {
  const isSupport =
    req.session.role === "admin" || req.session.role === "support";

  if (isSupport) {
    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .orderBy(desc(chatSessionsTable.updatedAt))
      .limit(CHAT_ADMIN_LIST_LIMIT);
    res.json(
      sessions.map(({ guestToken: _guestToken, ...session }) => session),
    );
  } else if (req.session.role === "customer") {
    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.userId, req.session.userId!))
      .orderBy(desc(chatSessionsTable.updatedAt));
    res.json(
      sessions.map(({ guestToken: _guestToken, ...session }) => session),
    );
  } else {
    res.status(403).json({
      code: "FORBIDDEN",
      message: "Support access required.",
      requestId: req.id,
    });
  }
});

router.post(
  "/chat/sessions",
  requireAuth,
  chatSessionLimit,
  async (req, res): Promise<void> => {
    const userId = req.session.userId!;
    if (req.session.role !== "customer") {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "Customer access required.",
        requestId: req.id,
      });
      return;
    }

    const [existing] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.userId, userId))
      .orderBy(desc(chatSessionsTable.updatedAt));

    if (existing && existing.status === "open") {
      res.json(existing);
      return;
    }

    const [userRecord] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    const [session] = await db
      .insert(chatSessionsTable)
      .values({
        userId,
        userEmail: userRecord?.email ?? `user-${userId}`,
        status: "open",
      })
      .returning();

    try {
      const io = getIO();
      io.to("staff").emit("chat:new_session", session);
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.status(201).json(session);
  },
);

router.get(
  "/chat/sessions/:id/messages",
  requireAuth,
  async (req, res): Promise<void> => {
    const sessionId = parseInt(String(req.params["id"]), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session id" });
      return;
    }

    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (
      req.session.role !== "admin" &&
      req.session.role !== "support" &&
      session.userId !== req.session.userId
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    res.json(messages);
  },
);

router.post(
  "/chat/sessions/:id/messages",
  requireAuth,
  async (req, res): Promise<void> => {
    const sessionId = parseInt(String(req.params["id"]), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session id" });
      return;
    }

    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }
    if (content.length > CHAT_MSG_MAX_LEN) {
      res.status(400).json({
        error: `Message must be ${CHAT_MSG_MAX_LEN} characters or fewer.`,
      });
      return;
    }

    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (
      req.session.role !== "admin" &&
      req.session.role !== "support" &&
      session.userId !== req.session.userId
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (
      session.status === "closed" &&
      req.session.role !== "admin" &&
      req.session.role !== "support"
    ) {
      res.status(409).json({ error: "Chat session is closed" });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [message] = await tx
        .insert(chatMessagesTable)
        .values({
          sessionId,
          senderId: req.session.userId!,
          senderRole: req.session.role!,
          content: content.trim(),
        })
        .returning();
      await tx
        .update(chatSessionsTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessionsTable.id, sessionId));
      let notification = null;
      const fromSupport =
        req.session.role === "admin" || req.session.role === "support";
      if (fromSupport) {
        if (session.userId)
          [notification] = await tx
            .insert(notificationsTable)
            .values({
              userId: session.userId,
              type: "support_reply",
              title: "New support reply",
              message: "Shiprion Support replied to your conversation.",
              href: "/dashboard?section=support",
            })
            .returning();
        if (session.userEmail.includes("@"))
          await tx.insert(emailOutboxTable).values({
            toEmail: session.userEmail,
            subject: "Shiprion - New support reply",
            html: `<div style="font-family:sans-serif"><h2>New support reply</h2><p>Shiprion Support replied to your conversation. Sign in to view the message.</p></div>`,
          });
      } else {
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
              type: "support_message",
              title: "New support message",
              message: `A customer replied in conversation ${sessionId}.`,
              href: "/admin",
            })),
          );
      }
      return { message: message!, notification };
    });
    const message = result.message;

    try {
      const io = getIO();
      io.to(`chat:${sessionId}`).emit("chat:message", message);
      io.to("staff").emit("chat:message", { ...message, sessionId });
      if (session.userId && result.notification)
        io.to(`user:${session.userId}`).emit(
          "notification:new",
          result.notification,
        );
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.status(201).json(message);
  },
);

router.patch(
  "/chat/sessions/:id/close",
  requireSupport,
  async (req, res): Promise<void> => {
    const sessionId = parseInt(String(req.params["id"]), 10);

    await db
      .update(chatSessionsTable)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(chatSessionsTable.id, sessionId));

    try {
      const io = getIO();
      io.to(`chat:${sessionId}`).emit("chat:closed", { sessionId });
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.json({ success: true });
  },
);

export default router;
