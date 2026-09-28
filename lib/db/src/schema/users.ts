import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { type z } from "zod/v4";

export const USER_ROLES = ["customer", "operator", "support", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "restricted", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("customer"),
    status: text("status").$type<UserStatus>().notNull().default("active"),
    fullName: text("full_name"),
    phone: text("phone"),
    company: text("company"),
    emailVerified: boolean("email_verified").notNull().default(false),
    // Kept for a backwards-compatible migration. New verification and recovery
    // flows use hashed, single-use rows in auth_tokens.
    verificationCode: text("verification_code"),
    verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
