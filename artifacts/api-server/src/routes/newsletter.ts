import { Router, type IRouter } from "express";
import {
  db,
  newsletterSubscriptionsTable,
  emailOutboxTable,
} from "@workspace/db";
import { newsletterBody } from "../lib/newsletter";
import { persistentRateLimit } from "../lib/rate-limit";
import { companyInboxEmail } from "../lib/company-inbox";
import { dispatchQueuedEmails } from "../lib/outbox";

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
    const emailIds = await db.transaction(async (tx) => {
      const [subscription] = await tx
        .insert(newsletterSubscriptionsTable)
        .values(parsed.data)
        .onConflictDoNothing({ target: newsletterSubscriptionsTable.email })
        .returning();
      if (!subscription) return [];
      const [notification] = await tx
        .insert(emailOutboxTable)
        .values(
          companyInboxEmail("New newsletter signup", {
            Email: subscription.email,
          }),
        )
        .returning({ id: emailOutboxTable.id });
      return [notification!.id];
    });
    await dispatchQueuedEmails(emailIds);
    res.status(200).json({ subscribed: true });
  },
);

export default router;
