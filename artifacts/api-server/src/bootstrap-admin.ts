import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, migrateDatabase, pool, usersTable } from "@workspace/db";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!email || !/^\S+@\S+\.\S+$/.test(email))
  throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
if (!password || password.length < 12)
  throw new Error(
    "BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters.",
  );

try {
  await migrateDatabase();
  const [existing] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    if (existing.role !== "admin")
      throw new Error(
        "That email already belongs to a non-admin account; promote it from an existing admin session instead.",
      );
    console.log("The requested admin account already exists; no changes made.");
  } else {
    await db.insert(usersTable).values({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
      status: "active",
      emailVerified: true,
    });
    console.log("Initial admin account created.");
  }
} finally {
  await pool.end();
}
