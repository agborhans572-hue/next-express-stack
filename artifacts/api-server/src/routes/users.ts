import { Router, type IRouter } from "express";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import {
  auditEventsTable,
  db,
  pool,
  usersTable,
  USER_ROLES,
  USER_STATUSES,
} from "@workspace/db";
import { requireAdmin, requireOperations } from "../middleware/auth";
import { getIO } from "../socket";

const router: IRouter = Router();
const fields = {
  id: usersTable.id,
  email: usersTable.email,
  fullName: usersTable.fullName,
  phone: usersTable.phone,
  company: usersTable.company,
  role: usersTable.role,
  status: usersTable.status,
  emailVerified: usersTable.emailVerified,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

router.get(
  "/customers",
  requireOperations,
  async (_req, res): Promise<void> => {
    const items = await db
      .select(fields)
      .from(usersTable)
      .where(eq(usersTable.role, "customer"))
      .orderBy(usersTable.email);
    res.json({ items });
  },
);

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
  const [items, total] = await Promise.all([
    db
      .select(fields)
      .from(usersTable)
      .orderBy(usersTable.id)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(usersTable),
  ]);
  res.json({ items, page, pageSize, total: total[0]?.count ?? 0 });
});

router.get("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [user] = await db
    .select(fields)
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({
      code: "NOT_FOUND",
      message: "User not found.",
      requestId: req.id,
    });
    return;
  }
  res.json(user);
});

router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = z
    .object({
      role: z.enum(USER_ROLES).optional(),
      status: z.enum(USER_STATUSES).optional(),
    })
    .refine((body) => body.role !== undefined || body.status !== undefined)
    .safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "A valid role or status is required.",
      requestId: req.id,
    });
    return;
  }
  if (id === req.session.userId) {
    res.status(403).json({
      code: "SELF_MANAGEMENT",
      message: "Use account settings to manage your own account.",
      requestId: req.id,
    });
    return;
  }
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!existing) {
    res.status(404).json({
      code: "NOT_FOUND",
      message: "User not found.",
      requestId: req.id,
    });
    return;
  }
  if (
    existing.role === "admin" &&
    parsed.data.role &&
    parsed.data.role !== "admin"
  ) {
    const admins = await db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));
    if ((admins[0]?.count ?? 0) <= 1) {
      res.status(409).json({
        code: "LAST_ADMIN",
        message: "The final administrator cannot be demoted.",
        requestId: req.id,
      });
      return;
    }
  }
  const [updated] = await db.transaction(async (tx) => {
    const changed = await tx
      .update(usersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning(fields);
    await tx.insert(auditEventsTable).values({
      actorId: req.session.userId,
      action: "user.access_changed",
      entityType: "user",
      entityId: String(id),
      metadata: parsed.data,
    });
    return changed;
  });
  await pool.query(
    "DELETE FROM user_sessions WHERE (sess->>'userId')::int = $1",
    [id],
  );
  try {
    getIO().to(`user:${id}`).disconnectSockets(true);
    getIO().to("staff").emit("usersUpdated", { id });
  } catch {
    /* best effort */
  }
  res.json(updated);
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id === req.session.userId) {
    res.status(403).json({
      code: "FORBIDDEN",
      message: "You cannot delete this account.",
      requestId: req.id,
    });
    return;
  }
  const [existing] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!existing) {
    res.status(404).json({
      code: "NOT_FOUND",
      message: "User not found.",
      requestId: req.id,
    });
    return;
  }
  if (existing.role === "admin") {
    res.status(409).json({
      code: "ADMIN_DELETE_BLOCKED",
      message: "Demote the administrator before deletion.",
      requestId: req.id,
    });
    return;
  }
  await db.transaction(async (tx) => {
    await tx.insert(auditEventsTable).values({
      actorId: req.session.userId,
      action: "user.deleted",
      entityType: "user",
      entityId: String(id),
      metadata: {},
    });
    await tx.delete(usersTable).where(eq(usersTable.id, id));
  });
  await pool.query(
    "DELETE FROM user_sessions WHERE (sess->>'userId')::int = $1",
    [id],
  );
  res.sendStatus(204);
});

export default router;
