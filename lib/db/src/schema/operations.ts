import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { shipmentsTable } from "./shipments";

export const QUOTE_STATUSES = [
  "submitted",
  "under_review",
  "offered",
  "accepted",
  "rejected",
  "expired",
  "converted",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export interface RateSnapshot {
  code: string;
  name: string;
  version: number;
  baseFeeCents: number;
  perKgCents: number;
  fuelPct: number;
  weightKg: number;
}

export const serviceRatesTable = pgTable(
  "service_rates",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    version: integer("version").notNull().default(1),
    baseFeeCents: integer("base_fee_cents").notNull(),
    perKgCents: integer("per_kg_cents").notNull(),
    fuelPct: real("fuel_pct").notNull().default(0),
    minWeightKg: real("min_weight_kg").notNull().default(0.1),
    maxWeightKg: real("max_weight_kg").notNull().default(1000),
    transitDaysMin: integer("transit_days_min").notNull().default(1),
    transitDaysMax: integer("transit_days_max").notNull().default(5),
    active: boolean("active").notNull().default(true),
    createdBy: integer("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("service_rates_code_version_uq").on(table.code, table.version),
    index("service_rates_active_idx").on(table.active),
  ],
);

export const quotesTable = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull().unique(),
    customerId: integer("customer_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    cargoType: text("cargo_type").notNull(),
    weightKg: real("weight_kg").notNull(),
    lengthCm: real("length_cm"),
    widthCm: real("width_cm"),
    heightCm: real("height_cm"),
    notes: text("notes"),
    serviceRateId: integer("service_rate_id")
      .notNull()
      .references(() => serviceRatesTable.id),
    rateSnapshot: jsonb("rate_snapshot").$type<RateSnapshot>().notNull(),
    estimatedPriceCents: integer("estimated_price_cents").notNull(),
    finalPriceCents: integer("final_price_cents"),
    currency: text("currency").notNull().default("USD"),
    status: text("status").$type<QuoteStatus>().notNull().default("submitted"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    offeredAt: timestamp("offered_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    convertedShipmentId: integer("converted_shipment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quotes_customer_idx").on(table.customerId),
    index("quotes_email_idx").on(table.contactEmail),
    index("quotes_status_idx").on(table.status),
    uniqueIndex("quotes_converted_shipment_uq").on(table.convertedShipmentId),
  ],
);

export const authTokensTable = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    quoteId: integer("quote_id").references(() => quotesTable.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    type: text("type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("auth_tokens_lookup_idx").on(table.type, table.email)],
);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
  ],
);

export const emailOutboxTable = pgTable(
  "email_outbox",
  {
    id: serial("id").primaryKey(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("email_outbox_pending_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const proofDeliveriesTable = pgTable("proof_deliveries", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id")
    .notNull()
    .references(() => shipmentsTable.id, { onDelete: "cascade" })
    .unique(),
  recipientName: text("recipient_name").notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  objectKey: text("object_key").notNull(),
  originalFileName: text("original_file_name").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditEventsTable = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_entity_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);

export const rateLimitsTable = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_expiry_idx").on(table.expiresAt)],
);

export type ServiceRate = typeof serviceRatesTable.$inferSelect;
export type Quote = typeof quotesTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type ProofDelivery = typeof proofDeliveriesTable.$inferSelect;
