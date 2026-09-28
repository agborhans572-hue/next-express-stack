import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { processOutboxBatch } from "../lib/outbox";

const router: IRouter = Router();

function isAuthorized(value: string | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16 || !value) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(value);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

router.get("/internal/cron/email-outbox", async (req, res): Promise<void> => {
  if (!isAuthorized(req.get("authorization"))) {
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Cron authorization failed.",
      requestId: req.id,
    });
    return;
  }

  const result = await processOutboxBatch();
  res.json({ ok: true, ...result });
});

export default router;
