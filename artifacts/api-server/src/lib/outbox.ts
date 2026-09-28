import { and, eq } from "drizzle-orm";
import { db, emailOutboxTable, pool } from "@workspace/db";
import { logger } from "./logger";
import { sendRawEmail } from "./email";

let timer: NodeJS.Timeout | undefined;
let running = false;

type ClaimedMessage = {
  id: number;
  toEmail: string;
  subject: string;
  html: string;
  attempts: number;
};

async function claimBatch(): Promise<ClaimedMessage[]> {
  await pool.query(
    "UPDATE email_outbox SET status = 'pending' WHERE status = 'processing' AND next_attempt_at <= now()",
  );
  const result = await pool.query<ClaimedMessage>(`
    WITH candidates AS (
      SELECT id
      FROM email_outbox
      WHERE status = 'pending' AND next_attempt_at <= now()
      ORDER BY id
      FOR UPDATE SKIP LOCKED
      LIMIT 10
    )
    UPDATE email_outbox AS message
    SET status = 'processing', next_attempt_at = now() + interval '5 minutes'
    FROM candidates
    WHERE message.id = candidates.id
    RETURNING message.id, message.to_email AS "toEmail", message.subject,
              message.html, message.attempts
  `);
  return result.rows;
}

export type OutboxBatchResult = {
  claimed: number;
  sent: number;
  failed: number;
  skipped: boolean;
};

export async function processOutboxBatch(): Promise<OutboxBatchResult> {
  if (running) return { claimed: 0, sent: 0, failed: 0, skipped: true };
  running = true;
  const result: OutboxBatchResult = {
    claimed: 0,
    sent: 0,
    failed: 0,
    skipped: false,
  };
  try {
    const messages = await claimBatch();
    result.claimed = messages.length;
    for (const message of messages) {
      try {
        await sendRawEmail(message.toEmail, message.subject, message.html);
        await db
          .update(emailOutboxTable)
          .set({ status: "sent", sentAt: new Date(), lastError: null })
          .where(
            and(
              eq(emailOutboxTable.id, message.id),
              eq(emailOutboxTable.status, "processing"),
            ),
          );
        result.sent += 1;
      } catch (error) {
        result.failed += 1;
        const attempts = message.attempts + 1;
        await db
          .update(emailOutboxTable)
          .set({
            attempts,
            status: attempts >= 5 ? "failed" : "pending",
            lastError:
              error instanceof Error
                ? error.message.slice(0, 500)
                : "Unknown email error",
            nextAttemptAt: new Date(
              Date.now() + Math.min(60, 2 ** attempts) * 60_000,
            ),
          })
          .where(
            and(
              eq(emailOutboxTable.id, message.id),
              eq(emailOutboxTable.status, "processing"),
            ),
          );
        logger.error(
          { outboxId: message.id, attempts, error },
          "Email outbox delivery failed",
        );
      }
    }
    return result;
  } finally {
    running = false;
  }
}

export function startOutboxWorker(): void {
  if (timer) return;
  timer = setInterval(() => void processOutboxBatch(), 15_000);
  timer.unref();
  void processOutboxBatch();
}

export function stopOutboxWorker(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}
