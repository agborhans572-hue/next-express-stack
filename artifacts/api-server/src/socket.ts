import { Server } from "socket.io";
import { createAdapter } from "@socket.io/postgres-adapter";
import type { Server as HttpServer } from "node:http";
import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  pool,
  chatSessionsTable,
  shipmentsTable,
  usersTable,
} from "@workspace/db";
import { logger } from "./lib/logger";
import { sessionStore } from "./lib/session-store";
import { hashToken } from "./lib/security";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@workspace/api-zod";

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
let storeRevocationPatched = false;

// How often to sweep connected sockets and verify their sessions are still valid
const SESSION_REVALIDATION_INTERVAL_MS = 60 * 1000; // 60 seconds

type SessionData = { userId?: number; role?: string };

function getSessionData(sessionId: string): Promise<SessionData> {
  return new Promise((resolve) => {
    sessionStore.get(sessionId, (err, data) => {
      if (err || !data) {
        resolve({});
      } else {
        resolve({
          userId: (data as SessionData).userId,
          role: (data as SessionData).role,
        });
      }
    });
  });
}

function disconnectSocketsForSession(sessionId: string): void {
  if (!io) return;
  io.in(`session:${sessionId}`).disconnectSockets(true);
  logger.info("Disconnected sockets for a revoked session");
}

/**
 * Periodically re-validates sessions for all connected sockets.
 * Any socket whose HTTP session has expired or been revoked will be disconnected,
 * which removes it from every room it joined (including `admins` and `chat:*`).
 * This covers session TTL expiry, which does not invoke sessionStore.destroy() and
 * therefore would not be caught by the monkey-patch on destroy alone.
 */
async function revalidateAllSessions(): Promise<void> {
  if (!io) return;

  const sockets = await io.fetchSockets();
  await Promise.all(
    sockets.map(async (socket) => {
      const sessionId = socket.data.sessionId as string | undefined;
      if (!sessionId) return;

      const sessionData = await getSessionData(sessionId);
      if (!sessionData.userId) {
        // Session has expired or was destroyed — disconnect the socket
        logger.info(
          { socketId: socket.id },
          "Disconnecting socket: session expired or no longer valid",
        );
        socket.disconnect(true);
        return;
      }
      const [user] = await db
        .select({ role: usersTable.role, status: usersTable.status })
        .from(usersTable)
        .where(eq(usersTable.id, sessionData.userId));
      if (!user || user.status !== "active" || user.role !== sessionData.role)
        socket.disconnect(true);
    }),
  );
}

export function initSocketIO(
  httpServer: HttpServer,
  sessionMiddleware: RequestHandler,
): Server<ClientToServerEvents, ServerToClientEvents> {
  const allowedOrigins = new Set(
    [
      process.env.APP_ORIGIN,
      ...(process.env.REPLIT_DOMAINS ?? "")
        .split(",")
        .filter(Boolean)
        .map((domain) => `https://${domain.trim()}`),
      ...(process.env.NODE_ENV === "production"
        ? []
        : ["http://localhost:5173", "http://127.0.0.1:5173"]),
    ].filter(Boolean),
  );
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) callback(null, true);
        else callback(new Error("Origin is not allowed"));
      },
      credentials: true,
    },
  });
  io.adapter(createAdapter(pool));

  if (!storeRevocationPatched) {
    storeRevocationPatched = true;
    const originalDestroy = sessionStore.destroy.bind(sessionStore);
    sessionStore.destroy = (
      sid: string,
      callback?: (err?: unknown) => void,
    ): void => {
      disconnectSocketsForSession(sid);
      originalDestroy(sid, callback);
    };
  }

  // Periodic sweep to catch sessions that expire via TTL without an explicit destroy()
  const revalidationTimer = setInterval(() => {
    revalidateAllSessions().catch((err) => {
      logger.error({ err }, "Error during socket session revalidation sweep");
    });
  }, SESSION_REVALIDATION_INTERVAL_MS);
  // Don't prevent process exit
  revalidationTimer.unref();

  io.use((socket, next) => {
    sessionMiddleware(
      socket.request as Parameters<RequestHandler>[0],
      {} as Parameters<RequestHandler>[1],
      next as Parameters<RequestHandler>[2],
    );
  });

  io.on("connection", async (socket) => {
    const req = socket.request as Parameters<RequestHandler>[0] & {
      sessionID?: string;
    };
    const sessionId: string | undefined = req.sessionID;

    logger.info(
      { socketId: socket.id, authenticated: Boolean(sessionId) },
      "Socket.IO client connected",
    );

    // Store sessionId on the socket so the revalidation sweep can check it
    socket.data.sessionId = sessionId;

    if (sessionId) {
      socket.join(`session:${sessionId}`);
      // Authenticated users join their own room so status updates for any of
      // their shipments are delivered without needing to track every number.
      const { userId, role } = await getSessionData(sessionId);
      if (userId) {
        socket.join(`user:${userId}`);
        if (role === "admin" || role === "operator" || role === "support")
          socket.join("staff");
      }
    }

    // join:shipment is intentionally open to any socket that supplies a valid
    // tracking number. Tracking numbers are unguessable (2 uppercase letters +
    // 8 random digits ≈ 67.6 billion combinations) and the corresponding REST
    // endpoint GET /api/track/:trackingNumber is also publicly accessible.
    // The tracking number itself acts as the access token for real-time updates
    // on the public shipment-tracking page, consistent with the existing REST API.
    socket.on("join:shipment", async (trackingNumber: string) => {
      if (!/^[A-Z0-9-]{8,40}$/.test(trackingNumber)) return;
      const [shipment] = await db
        .select({ id: shipmentsTable.id })
        .from(shipmentsTable)
        .where(eq(shipmentsTable.trackingNumber, trackingNumber));
      if (shipment) socket.join(`shipment:${trackingNumber}`);
    });

    socket.on("join:admin", async () => {
      if (!sessionId) {
        logger.warn(
          { socketId: socket.id },
          "Unauthenticated join:admin attempt rejected (no session)",
        );
        return;
      }
      const { role, userId } = await getSessionData(sessionId);
      if (role !== "admin" && role !== "operator" && role !== "support") {
        logger.warn(
          { socketId: socket.id, userId },
          "Unauthorized join:admin attempt rejected",
        );
        return;
      }
      socket.join("staff");
      logger.info({ socketId: socket.id }, "Admin joined admin room");
    });

    socket.on("join:chat", async (chatSessionId: number) => {
      if (!sessionId) {
        logger.warn(
          { socketId: socket.id },
          "Unauthenticated join:chat attempt rejected (no session)",
        );
        return;
      }
      const { userId, role } = await getSessionData(sessionId);
      if (!userId) {
        logger.warn(
          { socketId: socket.id },
          "Unauthenticated join:chat attempt rejected",
        );
        return;
      }

      const [chatSession] = await db
        .select({ userId: chatSessionsTable.userId })
        .from(chatSessionsTable)
        .where(eq(chatSessionsTable.id, chatSessionId));

      if (!chatSession) {
        logger.warn(
          { socketId: socket.id, chatSessionId },
          "join:chat for non-existent session rejected",
        );
        return;
      }

      if (
        role !== "admin" &&
        role !== "support" &&
        chatSession.userId !== userId
      ) {
        logger.warn(
          { socketId: socket.id, userId, chatSessionId },
          "Unauthorized join:chat attempt rejected",
        );
        return;
      }

      socket.join(`chat:${chatSessionId}`);
    });

    socket.on(
      "join:guest-chat",
      async (payload: { sessionId: number; guestToken: string }) => {
        const { sessionId: chatSessionId, guestToken } = payload ?? {};
        if (!chatSessionId || !guestToken) return;

        const [chatSession] = await db
          .select({
            guestToken: chatSessionsTable.guestToken,
            guestTokenExpiresAt: chatSessionsTable.guestTokenExpiresAt,
            userId: chatSessionsTable.userId,
            status: chatSessionsTable.status,
          })
          .from(chatSessionsTable)
          .where(eq(chatSessionsTable.id, chatSessionId));

        if (
          !chatSession ||
          chatSession.userId !== null ||
          chatSession.guestToken !== hashToken(guestToken) ||
          !chatSession.guestTokenExpiresAt ||
          chatSession.guestTokenExpiresAt < new Date() ||
          chatSession.status === "closed"
        ) {
          logger.warn(
            { socketId: socket.id, chatSessionId },
            "Unauthorized join:guest-chat attempt rejected",
          );
          return;
        }

        socket.join(`chat:${chatSessionId}`);
        logger.info(
          { socketId: socket.id, chatSessionId },
          "Guest joined chat room",
        );
      },
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        { socketId: socket.id, reason },
        "Socket.IO client disconnected",
      );
    });
  });

  logger.info("Socket.IO initialized on path /api/socket.io");
  return io;
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initSocketIO() first.",
    );
  }
  return io;
}
