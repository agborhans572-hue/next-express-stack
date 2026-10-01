import { Router, type IRouter, type Request } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  authTokensTable,
  db,
  emailOutboxTable,
  pool,
  usersTable,
  type User,
} from "@workspace/db";
import {
  appUrl,
  createOpaqueToken,
  escapeHtml,
  hashToken,
} from "../lib/security";
import { persistentRateLimit } from "../lib/rate-limit";
import { processOutboxMessage } from "../lib/outbox";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();
const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(8).max(128);
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120).optional(),
});
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  company: z.string().trim().max(160).nullable().optional(),
});

const authLimit = persistentRateLimit("auth", 20, 15 * 60_000);
const registerLimit = persistentRateLimit("register", 5, 60 * 60_000);
const forgotPasswordLimit = persistentRateLimit(
  "forgot-password",
  5,
  60 * 60_000,
);
const resetPasswordLimit = persistentRateLimit(
  "reset-password",
  10,
  60 * 60_000,
);

function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    fullName: user.fullName,
    phone: user.phone,
    company: user.company,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) =>
    req.session.regenerate((error) => (error ? reject(error) : resolve())),
  );
}

async function createVerificationToken(
  userId: number,
  email: string,
): Promise<string> {
  const code = String(randomInt(100000, 1000000));
  const outboxId = await db.transaction(async (tx) => {
    await tx
      .delete(authTokensTable)
      .where(
        and(
          eq(authTokensTable.userId, userId),
          eq(authTokensTable.type, "email_verification"),
        ),
      );
    await tx
      .delete(emailOutboxTable)
      .where(
        and(
          eq(emailOutboxTable.toEmail, email),
          eq(emailOutboxTable.subject, "Shiprion - Verify your email"),
          eq(emailOutboxTable.status, "pending"),
        ),
      );
    await tx.insert(authTokensTable).values({
      userId,
      email,
      type: "email_verification",
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    const [message] = await tx
      .insert(emailOutboxTable)
      .values({
        toEmail: email,
        subject: "Shiprion - Verify your email",
        html: `<div style="font-family:sans-serif"><h2>Verify your email address</h2><p>Enter this code in Shiprion:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${escapeHtml(code)}</p><p>This code expires in 10 minutes.</p></div>`,
      })
      .returning({ id: emailOutboxTable.id });
    return message!.id;
  });
  await processOutboxMessage(outboxId);
  return code;
}

function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

router.post(
  "/auth/register",
  registerLimit,
  async (req, res): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message,
        fieldErrors: parsed.error.flatten().fieldErrors,
        requestId: req.id,
      });
      return;
    }
    const { email, password, fullName } = parsed.data;
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing) {
      // Registration is intentionally idempotent. A customer may retry after
      // an SMTP or deployment problem, so issue a fresh code for an existing
      // unverified account while keeping the same enumeration-safe response.
      if (!existing.emailVerified) {
        await createVerificationToken(existing.id, existing.email);
      }
      res.status(201).json({
        message:
          "If this address can be registered, a verification email has been sent.",
        email,
      });
      return;
    }
    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        passwordHash: await bcrypt.hash(password, 12),
        fullName,
        role: "customer",
        emailVerified: false,
      })
      .returning();
    const code = await createVerificationToken(user!.id, email);
    res.status(201).json({
      message: "Account created. Check your email for a verification code.",
      email,
      ...(process.env.NODE_ENV === "development" && !emailConfigured()
        ? { devCode: code }
        : {}),
    });
  },
);

router.post(
  "/auth/verify-email",
  authLimit,
  async (req, res): Promise<void> => {
    const parsed = z
      .object({ email: emailSchema, code: z.string().regex(/^\d{6}$/) })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "INVALID_TOKEN",
        message: "Invalid or expired verification code.",
        requestId: req.id,
      });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email));
    if (!user) {
      res.status(400).json({
        code: "INVALID_TOKEN",
        message: "Invalid or expired verification code.",
        requestId: req.id,
      });
      return;
    }
    const [token] = await db
      .select()
      .from(authTokensTable)
      .where(
        and(
          eq(authTokensTable.userId, user.id),
          eq(authTokensTable.type, "email_verification"),
          eq(authTokensTable.tokenHash, hashToken(parsed.data.code)),
          isNull(authTokensTable.usedAt),
          gt(authTokensTable.expiresAt, new Date()),
        ),
      );
    if (!token) {
      res.status(400).json({
        code: "INVALID_TOKEN",
        message: "Invalid or expired verification code.",
        requestId: req.id,
      });
      return;
    }
    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(usersTable.id, user.id));
      await tx
        .update(authTokensTable)
        .set({ usedAt: new Date() })
        .where(eq(authTokensTable.id, token.id));
    });
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({
      ...serializeUser({ ...user, emailVerified: true, updatedAt: new Date() }),
      message: "Email verified.",
    });
  },
);

router.post(
  "/auth/resend-verification",
  authLimit,
  async (req, res): Promise<void> => {
    const parsed = z.object({ email: emailSchema }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "A valid email is required.",
        requestId: req.id,
      });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email));
    let code: string | undefined;
    if (user && !user.emailVerified) {
      code = await createVerificationToken(user.id, user.email);
    }
    res.json({
      message:
        "If the account exists and is unverified, a new code has been sent.",
      ...(code && process.env.NODE_ENV === "development" && !emailConfigured()
        ? { devCode: code }
        : {}),
    });
  },
);

router.post("/auth/login", authLimit, async (req, res): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid login request.",
      requestId: req.id,
    });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));
  const fallbackHash =
    "$2b$12$u9bcQWfM8JHGDR9aJ9B5quHoC8jP9BiyPJWVgJ1JjQqV2z8Ooqj5e";
  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? fallbackHash,
  );
  if (!user || !valid || !user.emailVerified) {
    res.status(401).json({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
      requestId: req.id,
    });
    return;
  }
  if (user.status !== "active") {
    res.status(403).json({
      code: "ACCOUNT_DISABLED",
      message: "This account is not active. Contact support.",
      requestId: req.id,
    });
    return;
  }
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json(serializeUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({
        code: "LOGOUT_FAILED",
        message: "Logout failed.",
        requestId: req.id,
      });
      return;
    }
    res.clearCookie("shiprion.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    res.sendStatus(204);
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({
      code: "AUTH_REQUIRED",
      message: "Authentication is required.",
      requestId: req.id,
    });
    return;
  }
  res.json(serializeUser(user));
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid profile.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      requestId: req.id,
    });
    return;
  }
  const [user] = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, req.session.userId!))
    .returning();
  res.json(serializeUser(user!));
});

router.post(
  "/auth/change-password",
  requireAuth,
  authLimit,
  async (req, res): Promise<void> => {
    const parsed = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: passwordSchema,
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
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!));
    if (
      !user ||
      !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))
    ) {
      res.status(400).json({
        code: "INVALID_PASSWORD",
        message: "Current password is incorrect.",
        requestId: req.id,
      });
      return;
    }
    await db
      .update(usersTable)
      .set({
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));
    await pool.query(
      "DELETE FROM user_sessions WHERE (sess->>'userId')::int = $1 AND sid <> $2",
      [user.id, req.sessionID],
    );
    res.sendStatus(204);
  },
);

router.post(
  "/auth/forgot-password",
  forgotPasswordLimit,
  async (req, res): Promise<void> => {
    const parsed = z.object({ email: emailSchema }).safeParse(req.body);
    let developmentResetToken: string | undefined;
    if (parsed.success) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, parsed.data.email));
      if (user && user.emailVerified && user.status === "active") {
        const { token, hash } = createOpaqueToken();
        if (
          process.env.NODE_ENV === "development" &&
          !process.env.SMTP_USER &&
          !process.env.SMTP_PASS
        ) {
          developmentResetToken = token;
        }
        const url = appUrl(
          `/reset-password?token=${encodeURIComponent(token)}`,
        );
        const outboxId = await db.transaction(async (tx) => {
          await tx
            .delete(authTokensTable)
            .where(
              and(
                eq(authTokensTable.userId, user.id),
                eq(authTokensTable.type, "password_reset"),
              ),
            );
          await tx
            .delete(emailOutboxTable)
            .where(
              and(
                eq(emailOutboxTable.toEmail, user.email),
                eq(emailOutboxTable.subject, "Shiprion - Reset your password"),
                eq(emailOutboxTable.status, "pending"),
              ),
            );
          await tx.insert(authTokensTable).values({
            userId: user.id,
            email: user.email,
            type: "password_reset",
            tokenHash: hash,
            expiresAt: new Date(Date.now() + 30 * 60_000),
          });
          const [message] = await tx
            .insert(emailOutboxTable)
            .values({
              toEmail: user.email,
              subject: "Shiprion - Reset your password",
              html: `<div style="font-family:sans-serif"><h2>Reset your password</h2><p>This link expires in 30 minutes.</p><p><a href="${escapeHtml(url)}">Reset password</a></p></div>`,
            })
            .returning({ id: emailOutboxTable.id });
          return message!.id;
        });
        await processOutboxMessage(outboxId);
      }
    }
    res.json({
      message:
        "If an eligible account exists, a password reset link has been sent.",
      ...(developmentResetToken
        ? { devResetToken: developmentResetToken }
        : {}),
    });
  },
);

router.post(
  "/auth/reset-password",
  resetPasswordLimit,
  async (req, res): Promise<void> => {
    const parsed = z
      .object({ token: z.string().min(20).max(200), password: passwordSchema })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "INVALID_TOKEN",
        message: "The reset link is invalid or expired.",
        requestId: req.id,
      });
      return;
    }
    const [token] = await db
      .select()
      .from(authTokensTable)
      .where(
        and(
          eq(authTokensTable.type, "password_reset"),
          eq(authTokensTable.tokenHash, hashToken(parsed.data.token)),
          isNull(authTokensTable.usedAt),
          gt(authTokensTable.expiresAt, new Date()),
        ),
      );
    if (!token?.userId) {
      res.status(400).json({
        code: "INVALID_TOKEN",
        message: "The reset link is invalid or expired.",
        requestId: req.id,
      });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(usersTable.id, token.userId!));
      await tx
        .update(authTokensTable)
        .set({ usedAt: new Date() })
        .where(eq(authTokensTable.id, token.id));
    });
    await pool.query(
      "DELETE FROM user_sessions WHERE (sess->>'userId')::int = $1",
      [token.userId],
    );
    res.sendStatus(204);
  },
);

router.get("/auth/sessions", requireAuth, async (req, res): Promise<void> => {
  const result = await pool.query<{ sid: string; expire: Date }>(
    "SELECT sid, expire FROM user_sessions WHERE (sess->>'userId')::int = $1 ORDER BY expire DESC",
    [req.session.userId],
  );
  res.json({
    items: result.rows.map((row) => ({
      id: row.sid,
      current: row.sid === req.sessionID,
      expiresAt: row.expire,
    })),
  });
});

router.delete(
  "/auth/sessions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    await pool.query(
      "DELETE FROM user_sessions WHERE sid = $1 AND (sess->>'userId')::int = $2",
      [req.params.id, req.session.userId],
    );
    res.sendStatus(204);
  },
);

export default router;
