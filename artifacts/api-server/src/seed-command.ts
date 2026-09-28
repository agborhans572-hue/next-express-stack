import { migrateDatabase, pool } from "@workspace/db";
import { seedIfEmpty } from "./lib/seed";

if (process.env.SEED_DEVELOPMENT !== "true") {
  throw new Error(
    "Set SEED_DEVELOPMENT=true to confirm opt-in development seeding.",
  );
}

try {
  await migrateDatabase();
  await seedIfEmpty();
} finally {
  await pool.end();
}
