import { db, emailOutboxTable, notificationsTable } from "@workspace/db";
import { getIO } from "../socket";
import { escapeHtml } from "./security";

export async function notifyUser(input: {
  userId: number;
  email?: string | null;
  type: string;
  title: string;
  message: string;
  href?: string;
}): Promise<void> {
  const [notification] = await db
    .insert(notificationsTable)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
    })
    .returning();
  if (input.email) {
    await db.insert(emailOutboxTable).values({
      toEmail: input.email,
      subject: `Shiprion — ${input.title}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px"><h2>${escapeHtml(input.title)}</h2><p>${escapeHtml(input.message)}</p>${input.href ? `<p><a href="${escapeHtml(input.href)}">View in Shiprion</a></p>` : ""}</div>`,
    });
  }
  try {
    getIO().to(`user:${input.userId}`).emit("notification:new", notification);
  } catch {
    /* persisted delivery remains available */
  }
}
