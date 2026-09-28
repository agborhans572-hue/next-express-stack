import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { type z } from "zod/v4";
import { shipmentsTable } from "./shipments";

export const trackingEventsTable = pgTable(
  "tracking_events",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id")
      .notNull()
      .references(() => shipmentsTable.id, { onDelete: "cascade" }),
    location: text("location").notNull(),
    status: text("status").notNull(),
    description: text("description").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tracking_events_shipment_time_idx").on(
      table.shipmentId,
      table.occurredAt,
    ),
  ],
);

export const insertTrackingEventSchema = createInsertSchema(
  trackingEventsTable,
).omit({ id: true, createdAt: true });

export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEventsTable.$inferSelect;
