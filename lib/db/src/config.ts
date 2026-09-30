export function parsePostgresUrl(name: string, value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:")
    throw new Error(`${name} must use the postgres or postgresql protocol.`);
  return parsed;
}

function requireVerifiedSsl(name: string, parsed: URL): void {
  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode !== "require" && sslMode !== "verify-full")
    throw new Error(`${name} must use sslmode=require or sslmode=verify-full.`);
}

export function validateRuntimeDatabaseEnvironment(
  env: NodeJS.ProcessEnv,
): URL {
  if (!env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );

  const databaseUrl = parsePostgresUrl("DATABASE_URL", env.DATABASE_URL);
  if (!env.VERCEL) return databaseUrl;

  if (env.MIGRATION_DATABASE_URL)
    throw new Error(
      "MIGRATION_DATABASE_URL must not be exposed to the Vercel runtime.",
    );
  if (
    !databaseUrl.hostname.endsWith(".neon.tech") ||
    !databaseUrl.hostname.includes("-pooler.")
  )
    throw new Error(
      "Vercel DATABASE_URL must use a pooled Neon endpoint (-pooler.*.neon.tech).",
    );
  requireVerifiedSsl("DATABASE_URL", databaseUrl);
  return databaseUrl;
}

export function validateMigrationDatabaseUrl(value: string | undefined): void {
  if (!value) return;
  const migrationUrl = parsePostgresUrl("MIGRATION_DATABASE_URL", value);
  if (!migrationUrl.hostname.endsWith(".neon.tech")) return;
  if (migrationUrl.hostname.includes("-pooler."))
    throw new Error(
      "MIGRATION_DATABASE_URL must use the direct Neon endpoint, not the pooled endpoint.",
    );
  requireVerifiedSsl("MIGRATION_DATABASE_URL", migrationUrl);
}
