import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  date,
  index,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { type z } from "zod/v4";
import { usersTable } from "./users";

export const SHIPMENT_STATUSES = [
  "pending",
  "registered",
  "picked_up",
  "in_transit",
  "customs",
  "on_hold_customs",
  "arrived_at_port",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const shipmentsTable = pgTable(
  "shipments",
  {
    id: serial("id").primaryKey(),
    trackingNumber: text("tracking_number").notNull().unique(),
    senderId: integer("sender_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    customerId: integer("customer_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    sourceQuoteId: integer("source_quote_id"),
    priceCents: integer("price_cents"),
    ownershipNeedsReview: boolean("ownership_needs_review")
      .notNull()
      .default(false),
    senderName: text("sender_name"),
    senderPhone: text("sender_phone"),
    senderAddress: text("sender_address"),
    senderStreetAddress: text("sender_street_address"),
    senderHomeAddress: text("sender_home_address"),
    senderCity: text("sender_city"),
    senderPostalCode: text("sender_postal_code"),
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email"),
    recipientPhone: text("recipient_phone"),
    recipientAddress: text("recipient_address"),
    recipientStreetAddress: text("recipient_street_address"),
    recipientHomeAddress: text("recipient_home_address"),
    recipientCity: text("recipient_city"),
    recipientPostalCode: text("recipient_postal_code"),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    status: text("status").$type<ShipmentStatus>().notNull().default("pending"),
    weightKg: real("weight_kg"),
    estimatedDelivery: date("estimated_delivery"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shipments_customer_idx").on(table.customerId),
    index("shipments_status_idx").on(table.status),
    uniqueIndex("shipments_source_quote_uq").on(table.sourceQuoteId),
  ],
);

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({
  id: true,
  trackingNumber: true,
  sourceQuoteId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipmentsTable.$inferSelect;
