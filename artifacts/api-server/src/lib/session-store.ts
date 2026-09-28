import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const PgStore = connectPgSimple(session);

export const sessionStore = new PgStore({
  pool,
  tableName: "user_sessions",
  ttl: 3 * 60 * 60,
  createTableIfMissing: false,
});
