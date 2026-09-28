import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { existsSync } from "node:fs";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function parsePoolMaximum(): number {
  const raw =
    process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? "1" : "10");
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 50.");
  }
  return value;
}

/**
 * Vercel instances must keep their local pool deliberately small. Supabase's
 * transaction pooler performs the cross-instance pooling; opening a large pg
 * pool in every function instance would multiply connections during scale-out.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parsePoolMaximum(),
  idleTimeoutMillis: process.env.VERCEL ? 5_000 : 30_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});
export const db = drizzle(pool, { schema });

function defaultMigrationsFolder(): string {
  const candidates = [
    path.resolve(process.cwd(), "lib", "db", "migrations"),
    path.resolve(process.cwd(), "migrations"),
    path.resolve(process.cwd(), "..", "..", "lib", "db", "migrations"),
    path.resolve(import.meta.dirname, "..", "migrations"),
  ];
  const found = candidates.find((candidate) =>
    existsSync(path.join(candidate, "meta", "_journal.json")),
  );
  if (!found)
    throw new Error(
      "Could not locate committed database migrations from the current runtime.",
    );
  return found;
}

export async function migrateDatabase(
  migrationsFolder = defaultMigrationsFolder(),
  connectionString = process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL,
): Promise<void> {
  if (!connectionString)
    throw new Error("A migration database URL is required.");

  if (connectionString === process.env.DATABASE_URL) {
    await migrate(db, { migrationsFolder });
    return;
  }

  const migrationPool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: true,
  });
  try {
    await migrate(drizzle(migrationPool), { migrationsFolder });
  } finally {
    await migrationPool.end();
  }
}

export * from "./schema";
