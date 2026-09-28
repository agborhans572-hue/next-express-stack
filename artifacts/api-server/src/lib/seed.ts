import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  shipmentsTable,
  trackingEventsTable,
} from "@workspace/db";
import { logger } from "./logger";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function seedIfEmpty(): Promise<void> {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!customerPassword || !adminPassword) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD and SEED_ADMIN_PASSWORD are required for development seeding.",
    );
  }
  const allUsers = await db.select().from(usersTable).orderBy(usersTable.id);
  let user = allUsers.find((candidate) => candidate.role === "customer");
  let admin = allUsers.find((candidate) => candidate.role === "admin");

  if (!user) {
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com",
        passwordHash: await bcrypt.hash(customerPassword, 12),
        role: "customer",
        emailVerified: true,
      })
      .returning();
    user = inserted;
  }

  if (!admin) {
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "admin",
        emailVerified: true,
      })
      .returning();
    admin = inserted;
  }

  if (!user || !admin)
    throw new Error("Development accounts could not be seeded.");
  logger.info("Development customer and admin accounts are available.");

  const [existingShipment] = await db
    .select({ id: shipmentsTable.id })
    .from(shipmentsTable)
    .limit(1);

  if (existingShipment) {
    logger.info("Shipments already seeded — skipping.");
    return;
  }

  logger.info("Seeding sample shipments...");

  const shipmentRows = await db
    .insert(shipmentsTable)
    .values([
      {
        trackingNumber: "SHP-20260101-AA1111",
        senderId: user!.id,
        customerId: user!.id,
        recipientName: "Alice Johnson",
        recipientEmail: "alice@example.com",
        origin: "New York, NY",
        destination: "Los Angeles, CA",
        status: "delivered",
        weightKg: 2.5,
        estimatedDelivery: toDateStr(daysAgo(2)),
        createdAt: daysAgo(10),
        updatedAt: daysAgo(2),
      },
      {
        trackingNumber: "SHP-20260101-BB2222",
        senderId: user!.id,
        customerId: user!.id,
        recipientName: "Bob Martinez",
        recipientEmail: "bob@example.com",
        origin: "Chicago, IL",
        destination: "Houston, TX",
        status: "in_transit",
        weightKg: 5.0,
        estimatedDelivery: daysFromNow(3),
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      },
      {
        trackingNumber: "SHP-20260101-CC3333",
        senderId: user!.id,
        customerId: user!.id,
        recipientName: "Carol White",
        recipientEmail: "carol@example.com",
        origin: "Seattle, WA",
        destination: "Denver, CO",
        status: "pending",
        weightKg: 1.2,
        estimatedDelivery: daysFromNow(7),
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        trackingNumber: "SHP-20260101-DD4444",
        senderId: admin!.id,
        recipientName: "David Chen",
        recipientEmail: "david@example.com",
        origin: "Miami, FL",
        destination: "Boston, MA",
        status: "out_for_delivery",
        weightKg: 3.8,
        estimatedDelivery: daysFromNow(0),
        createdAt: daysAgo(5),
        updatedAt: daysAgo(0),
      },
      {
        trackingNumber: "SHP-20260101-EE5555",
        senderId: admin!.id,
        recipientName: "Eva Brown",
        recipientEmail: "eva@example.com",
        origin: "Phoenix, AZ",
        destination: "Philadelphia, PA",
        status: "cancelled",
        weightKg: 0.8,
        estimatedDelivery: null,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6),
      },
    ])
    .returning();

  logger.info(`Seeded ${shipmentRows.length} shipments`);

  logger.info("Seeding tracking events...");

  const [s1, s2, s3, s4] = shipmentRows;

  await db.insert(trackingEventsTable).values([
    {
      shipmentId: s1!.id,
      location: "New York, NY",
      status: "picked_up",
      description: "Package picked up from sender",
      occurredAt: daysAgo(10),
    },
    {
      shipmentId: s1!.id,
      location: "Pittsburgh, PA",
      status: "in_transit",
      description: "In transit to sorting facility",
      occurredAt: daysAgo(8),
    },
    {
      shipmentId: s1!.id,
      location: "Las Vegas, NV",
      status: "in_transit",
      description: "Arrived at regional hub",
      occurredAt: daysAgo(5),
    },
    {
      shipmentId: s1!.id,
      location: "Los Angeles, CA",
      status: "delivered",
      description: "Package delivered — signed by recipient",
      occurredAt: daysAgo(2),
    },
    {
      shipmentId: s2!.id,
      location: "Chicago, IL",
      status: "picked_up",
      description: "Package picked up from sender",
      occurredAt: daysAgo(3),
    },
    {
      shipmentId: s2!.id,
      location: "St. Louis, MO",
      status: "in_transit",
      description: "Departed sorting facility",
      occurredAt: daysAgo(2),
    },
    {
      shipmentId: s2!.id,
      location: "Dallas, TX",
      status: "in_transit",
      description: "Arrived at regional hub, awaiting onward dispatch",
      occurredAt: daysAgo(1),
    },
    {
      shipmentId: s3!.id,
      location: "Seattle, WA",
      status: "pending",
      description: "Label created — awaiting pickup",
      occurredAt: daysAgo(1),
    },
    {
      shipmentId: s4!.id,
      location: "Miami, FL",
      status: "picked_up",
      description: "Package picked up from sender",
      occurredAt: daysAgo(5),
    },
    {
      shipmentId: s4!.id,
      location: "Atlanta, GA",
      status: "in_transit",
      description: "In transit",
      occurredAt: daysAgo(4),
    },
    {
      shipmentId: s4!.id,
      location: "Boston, MA",
      status: "out_for_delivery",
      description: "Out for delivery — expected by end of day",
      occurredAt: new Date(),
    },
  ]);

  logger.info("Seeding complete.");
}
