import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@workspace/api-zod";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Returns the shared Socket.IO client instance, creating it on first call.
 *
 * Connects to the API server via the /api/socket.io path so the request is
 * routed through the same proxy as all other /api calls.
 */
export function getSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  if (!socket) {
    socket = io({
      path: "/api/socket.io",
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

/**
 * Disconnects and disposes the shared socket instance.
 * Call this on logout or app teardown.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
