import { createServer } from "node:http";
import { migrateDatabase, pool } from "@workspace/db";
import app, { sessionMiddleware } from "./app";
import { initSocketIO } from "./socket";
import { logger } from "./lib/logger";
import { verifyTransporter } from "./lib/email";
import { startOutboxWorker, stopOutboxWorker } from "./lib/outbox";

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0)
  throw new Error(
    `PORT must be a positive integer; received "${process.env.PORT ?? ""}".`,
  );
const httpServer = createServer(app);

async function start(): Promise<void> {
  await migrateDatabase();
  initSocketIO(httpServer, sessionMiddleware);
  await verifyTransporter();
  startOutboxWorker();
  httpServer.listen(port, () => logger.info({ port }, "Server listening"));
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Graceful shutdown started");
  stopOutboxWorker();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
httpServer.on("error", (err) => logger.error({ err }, "HTTP server error"));

void start().catch((err) => {
  logger.fatal({ err }, "Server startup failed");
  process.exit(1);
});
