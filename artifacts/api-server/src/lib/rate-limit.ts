import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";
import { createHash } from "node:crypto";

export function persistentRateLimit(
  name: string,
  limit: number,
  windowMs: number,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const identity = req.session?.userId
      ? `user:${req.session.userId}`
      : `ip:${req.ip ?? "unknown"}`;
    const key = createHash("sha256")
      .update(`${name}:${identity}`)
      .digest("hex");
    const result = await pool.query<{ count: number; expires_at: Date }>(
      `INSERT INTO rate_limits (key, count, window_started_at, expires_at)
       VALUES ($1, 1, now(), $2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.expires_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
         window_started_at = CASE WHEN rate_limits.expires_at <= now() THEN now() ELSE rate_limits.window_started_at END,
         expires_at = CASE WHEN rate_limits.expires_at <= now() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END
       RETURNING count, expires_at`,
      [key, new Date(Date.now() + windowMs)],
    );
    const row = result.rows[0]!;
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, limit - row.count)),
    );
    res.setHeader(
      "RateLimit-Reset",
      String(Math.ceil(new Date(row.expires_at).getTime() / 1000)),
    );
    if (row.count > limit) {
      res.status(429).json({
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        requestId: req.id,
      });
      return;
    }
    next();
  };
}
