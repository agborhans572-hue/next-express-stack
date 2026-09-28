import { Router, type IRouter } from "express";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const where = eq(notificationsTable.userId, req.session.userId!);
  const [items, totals, unread] = await Promise.all([
    db
      .select()
      .from(notificationsTable)
      .where(where)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(notificationsTable).where(where),
    db
      .select({ count: count() })
      .from(notificationsTable)
      .where(and(where, isNull(notificationsTable.readAt))),
  ]);
  res.json({
    items,
    page,
    pageSize,
    total: totals[0]?.count ?? 0,
    unread: unread[0]?.count ?? 0,
  });
});

router.patch(
  "/notifications/:id/read",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid notification id.",
        requestId: req.id,
      });
      return;
    }
    const [updated] = await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, req.session.userId!),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Notification not found.",
        requestId: req.id,
      });
      return;
    }
    res.json(updated);
  },
);

router.post(
  "/notifications/read-all",
  requireAuth,
  async (req, res): Promise<void> => {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, req.session.userId!),
          isNull(notificationsTable.readAt),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
