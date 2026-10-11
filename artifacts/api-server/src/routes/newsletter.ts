import { Router, type IRouter } from "express";
import { db, newsletterSubscriptionsTable } from "@workspace/db";
import { newsletterBody } from "../lib/newsletter";
import { persistentRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

router.post(
  "/newsletter/subscriptions",
  persistentRateLimit("newsletter", 5, 60 * 60_000),
  async (req, res): Promise<void> => {
    const parsed = newsletterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Enter a valid email address.",
        requestId: req.id,
      });
      return;
    }
    await db
      .insert(newsletterSubscriptionsTable)
      .values(parsed.data)
      .onConflictDoNothing({ target: newsletterSubscriptionsTable.email });
    res.status(200).json({ subscribed: true });
  },
);

export default router;
