import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createOpaqueToken(bytes = 32): { token: string; hash: string } {
  const token = randomBytes(bytes).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeTokenEqual(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isTokenActive(
  expiresAt: Date,
  usedAt: Date | null = null,
  now = new Date(),
): boolean {
  return usedAt === null && expiresAt.getTime() > now.getTime();
}

export function appUrl(path: string): string {
  const origin = (process.env.APP_ORIGIN ?? "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
