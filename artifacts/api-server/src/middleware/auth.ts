import type { Request, Response, NextFunction } from "express";
import { db, usersTable, type UserRole } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hasAnyRole } from "../lib/permissions";

function deny(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ code, message, requestId: res.req.id });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.session.userId) {
    deny(res, 401, "AUTH_REQUIRED", "Authentication is required.");
    return;
  }
  const [user] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      status: usersTable.status,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));
  if (!user || user.status !== "active") {
    req.session.destroy(() => undefined);
    deny(res, 401, "SESSION_REVOKED", "This session is no longer valid.");
    return;
  }
  req.session.role = user.role;
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await requireAuth(req, res, () => {
      if (!hasAnyRole(req.session.role, roles)) {
        deny(
          res,
          403,
          "FORBIDDEN",
          "You do not have permission to perform this action.",
        );
        return;
      }
      next();
    });
  };
}

export const requireAdmin = requireRoles("admin");
export const requireOperations = requireRoles("admin", "operator");
export const requireSupport = requireRoles("admin", "support");
export const requireStaff = requireRoles("admin", "operator", "support");
