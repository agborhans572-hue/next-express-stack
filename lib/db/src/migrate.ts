import { migrateDatabase, pool } from "./index";

try {
  await migrateDatabase();
  console.log("Database migrations completed.");
} finally {
  await pool.end();
}
