import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  chatMessagesTable,
  chatSessionsTable,
  db,
  notificationsTable,
  usersTable,
} from "@workspace/db";
import { getIO } from "../socket";
import { persistentRateLimit } from "../lib/rate-limit";
import { hashToken, isTokenActive } from "../lib/security";
import { z } from "zod";

const router: IRouter = Router();

const CHAT_MSG_MAX_LEN = 2000;
const GUEST_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const guestSessionLimiter = persistentRateLimit(
  "guest-chat-session",
  3,
  60 * 60_000,
);
const guestMessageLimiter = persistentRateLimit(
  "guest-chat-message",
  10,
  60_000,
);

function generateGuestToken(): string {
  return randomBytes(32).toString("hex");
}

function verifyGuestToken(
  session: { guestToken: string | null; guestTokenExpiresAt: Date | null },
  token: string | undefined,
): boolean {
  if (!session.guestToken || !token) return false;
  if (session.guestToken !== hashToken(token)) return false;
  if (
    !session.guestTokenExpiresAt ||
    !isTokenActive(session.guestTokenExpiresAt)
  )
    return false;
  return true;
}

router.post(
  "/chat/guest-sessions",
  guestSessionLimiter,
  async (req, res): Promise<void> => {
    const parsed = z
      .object({
        guestName: z.string().trim().min(2).max(100),
        guestEmail: z
          .string()
          .trim()
          .email()
          .max(200)
          .transform((value) => value.toLowerCase()),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message,
        requestId: req.id,
      });
      return;
    }
    const { guestName: name, guestEmail: email } = parsed.data;

    const guestToken = generateGuestToken();
    const guestTokenExpiresAt = new Date(Date.now() + GUEST_TOKEN_TTL_MS);

    const session = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(chatSessionsTable)
        .values({
          userId: null,
          userEmail: email,
          guestName: name,
          guestToken: hashToken(guestToken),
          guestTokenExpiresAt,
          status: "open",
        })
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
            type: "support_session",
            title: "New guest conversation",
            message: `${name} opened a support conversation.`,
            href: "/admin",
          })),
        );
      return created!;
    });

    const { guestToken: _storedToken, ...publicSession } = session;
    try {
      const io = getIO();
      io.to("staff").emit("chat:new_session", publicSession);
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.status(201).json({
      session: publicSession,
      guestToken,
      guestTokenExpiresAt: guestTokenExpiresAt.toISOString(),
    });
  },
);

router.get(
  "/chat/guest-sessions/:id/messages",
  async (req, res): Promise<void> => {
    const sessionId = parseInt(String(req.params["id"]), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session id" });
      return;
    }

    const token = req.headers["x-guest-token"] as string | undefined;

    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId));

    if (!session || session.userId !== null) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (!verifyGuestToken(session, token)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (session.status === "closed") {
      res.status(410).json({ error: "Chat session is closed" });
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
  "/chat/guest-sessions/:id/messages",
  guestMessageLimiter,
  async (req, res): Promise<void> => {
    const sessionId = parseInt(String(req.params["id"]), 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session id" });
      return;
    }

    const token = req.headers["x-guest-token"] as string | undefined;
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

    if (!session || session.userId !== null) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (!verifyGuestToken(session, token)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (session.status === "closed") {
      res.status(409).json({ error: "Chat session is closed" });
      return;
    }

    const message = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(chatMessagesTable)
        .values({
          sessionId,
          senderId: null,
          senderRole: "guest",
          content: content.trim(),
        })
        .returning();
      await tx
        .update(chatSessionsTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessionsTable.id, sessionId));
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
            title: "New guest message",
            message: `A guest replied in conversation ${sessionId}.`,
            href: "/admin",
          })),
        );
      return created!;
    });

    try {
      const io = getIO();
      io.to(`chat:${sessionId}`).emit("chat:message", message);
      io.to("staff").emit("chat:message", { ...message, sessionId });
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.status(201).json(message);
  },
);

export default router;
