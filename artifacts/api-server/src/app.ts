import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import cors from "cors";
import compression from "compression";
import session from "express-session";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionStore } from "./lib/session-store";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { validateVercelR2Environment } from "./lib/storage";

const app: Express = express();

app.set("trust proxy", 1);

app.use(compression());

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id =
        typeof incoming === "string" && incoming.length <= 100
          ? incoming
          : randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = new Set(
  [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    ...(process.env.REPLIT_DOMAINS ?? "")
      .split(",")
      .filter(Boolean)
      .map((domain) => `https://${domain.trim()}`),
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\/$/, "")),
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, "")))
        callback(null, true);
      else callback(new Error("Origin is not allowed"));
    },
  }),
);

app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
  throw new Error("SESSION_SECRET must contain at least 32 characters.");

if (process.env.NODE_ENV === "production") {
  const required = [
    "APP_ORIGIN",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "SUPPORT_EMAIL",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_FORCE_PATH_STYLE",
    ...(process.env.VERCEL ? ["CRON_SECRET"] : []),
  ] as const;
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length)
    throw new Error(
      `Missing required production configuration: ${missing.join(", ")}`,
    );

  const origin = new URL(process.env.APP_ORIGIN!);
  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error(
      "APP_ORIGIN must be an HTTPS origin without a path, query, or hash.",
    );
  if (process.env.VERCEL && process.env.CRON_SECRET!.length < 16)
    throw new Error("CRON_SECRET must contain at least 16 characters.");

  validateVercelR2Environment(process.env);
}

export const sessionMiddleware: RequestHandler = session({
  name: "shiprion.sid",
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 3 * 60 * 60 * 1000,
  },
});

app.use(sessionMiddleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  const candidate = req.get("origin") ?? req.get("referer");
  if (!candidate && !req.session.userId) {
    next();
    return;
  }
  try {
    if (candidate && allowedOrigins.has(new URL(candidate).origin)) {
      next();
      return;
    }
  } catch {
    /* rejected below */
  }
  res.status(403).json({
    code: "CSRF_REJECTED",
    message: "Cross-site request rejected.",
    requestId: req.id,
  });
});

app.use("/api", router);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: "API endpoint not found.",
    requestId: res.req.id,
  });
});

if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const frontendDir = path.resolve(
    process.env.FRONTEND_DIST_DIR ??
      path.join(process.cwd(), "artifacts", "frontend", "dist", "public"),
  );
  app.use(express.static(frontendDir, { index: false, maxAge: "1h" }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    res.sendFile(path.join(frontendDir, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(
    { err, method: req.method, url: req.url.split("?")[0] },
    "Unhandled server error",
  );
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred. Please try again later.",
    requestId: req.id,
  });
});

export default app;
