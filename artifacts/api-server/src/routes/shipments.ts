import { Router, type IRouter } from "express";
import { eq, and, or, isNull, count, desc } from "drizzle-orm";
import {
  auditEventsTable,
  db,
  emailOutboxTable,
  notificationsTable,
  pool,
  shipmentsTable,
  trackingEventsTable,
  usersTable,
} from "@workspace/db";
import { getIO } from "../socket";
import { geocodeLocation } from "../lib/geocode";
import {
  CreateShipmentBody,
  UpdateShipmentBody,
  GetShipmentParams,
  UpdateShipmentParams,
  DeleteShipmentParams,
  GetShipmentResponse,
  UpdateShipmentResponse,
  type ShipmentRealtimePayload,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireAdmin,
  requireOperations,
} from "../middleware/auth";
import { persistentRateLimit } from "../lib/rate-limit";
import { generateTrackingNumber } from "../lib/pricing";
import { canTransitionShipment } from "../lib/shipment-state";
import { appUrl, escapeHtml } from "../lib/security";
import { z } from "zod";
import { redactShipmentForSupport } from "../lib/pii";
import { shipmentStatusNotification } from "../lib/notification-content";

const router: IRouter = Router();
const shipmentCreateLimit = persistentRateLimit(
  "shipment-create",
  30,
  60 * 60_000,
);

/**
 * Generates a unique tracking number in the canonical SHP-YYYYMMDD-XXXXXX format.
 *
 * Uniqueness is guaranteed by checking the database before returning.
 * The 67.6 billion possible combinations make collisions extremely rare.
 */
async function generateUniqueTrackingNumber(): Promise<string> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const trackingNumber = generateTrackingNumber();

    const existing = await db
      .select({ id: shipmentsTable.id })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.trackingNumber, trackingNumber))
      .limit(1);

    if (existing.length === 0) {
      return trackingNumber;
    }
  }

  throw new Error(
    "Failed to generate a unique tracking number after maximum attempts",
  );
}

function serializeShipment(row: typeof shipmentsTable.$inferSelect) {
  return {
    ...row,
    senderPhone: row.senderPhone ?? null,
    senderAddress: row.senderAddress ?? null,
    senderStreetAddress: row.senderStreetAddress ?? null,
    senderHomeAddress: row.senderHomeAddress ?? null,
    senderCity: row.senderCity ?? null,
    senderPostalCode: row.senderPostalCode ?? null,
    recipientPhone: row.recipientPhone ?? null,
    recipientAddress: row.recipientAddress ?? null,
    recipientStreetAddress: row.recipientStreetAddress ?? null,
    recipientHomeAddress: row.recipientHomeAddress ?? null,
    recipientCity: row.recipientCity ?? null,
    recipientPostalCode: row.recipientPostalCode ?? null,
    estimatedDelivery: row.estimatedDelivery ?? null,
  };
}

router.get("/shipments", requireAuth, async (req, res): Promise<void> => {
  const isStaff = req.session.role !== "customer";
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const where = isStaff
    ? undefined
    : or(
        eq(shipmentsTable.customerId, req.session.userId!),
        and(
          eq(shipmentsTable.senderId, req.session.userId!),
          isNull(shipmentsTable.customerId),
        ),
      );

  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(shipmentsTable)
      .where(where)
      .orderBy(desc(shipmentsTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(shipmentsTable).where(where),
  ]);

  const items = rows.map((row) => {
    const serialized = serializeShipment(row);
    return req.session.role === "support"
      ? redactShipmentForSupport(serialized)
      : serialized;
  });
  res.json({ items, page, pageSize, total: totals[0]?.count ?? 0 });
});

router.post(
  "/shipments",
  requireOperations,
  shipmentCreateLimit,
  async (req, res): Promise<void> => {
    const parsed = CreateShipmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const {
      senderName,
      senderPhone,
      senderAddress,
      senderStreetAddress,
      senderHomeAddress,
      senderCity,
      senderPostalCode,
      recipientName,
      recipientEmail,
      recipientPhone,
      recipientAddress,
      recipientStreetAddress,
      recipientHomeAddress,
      recipientCity,
      recipientPostalCode,
      origin,
      destination,
      weightKg,
      estimatedDelivery,
      adminNote,
    } = parsed.data;

    const customerId = Number(req.body.customerId);
    if (!Number.isInteger(customerId)) {
      res.status(400).json({
        code: "CUSTOMER_REQUIRED",
        message: "Select a registered customer for this shipment.",
        requestId: req.id,
      });
      return;
    }
    const [customer] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, customerId),
          eq(usersTable.role, "customer"),
          eq(usersTable.status, "active"),
        ),
      );
    if (!customer) {
      res.status(400).json({
        code: "CUSTOMER_INVALID",
        message: "The selected customer is not active.",
        requestId: req.id,
      });
      return;
    }

    const trackingNumber = await generateUniqueTrackingNumber();
    const shipment = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(shipmentsTable)
        .values({
          trackingNumber,
          senderId: customer.id,
          customerId: customer.id,
          senderName: senderName ?? null,
          senderPhone: senderPhone ?? null,
          senderAddress: senderAddress ?? null,
          senderStreetAddress: senderStreetAddress ?? null,
          senderHomeAddress: senderHomeAddress ?? null,
          senderCity: senderCity ?? null,
          senderPostalCode: senderPostalCode ?? null,
          recipientName,
          recipientEmail: recipientEmail ?? null,
          recipientPhone: recipientPhone ?? null,
          recipientAddress: recipientAddress ?? null,
          recipientStreetAddress: recipientStreetAddress ?? null,
          recipientHomeAddress: recipientHomeAddress ?? null,
          recipientCity: recipientCity ?? null,
          recipientPostalCode: recipientPostalCode ?? null,
          origin,
          destination,
          weightKg: weightKg ?? null,
          estimatedDelivery: estimatedDelivery
            ? new Date(estimatedDelivery).toISOString().slice(0, 10)
            : null,
          status: "pending",
        })
        .returning();
      await tx.insert(trackingEventsTable).values({
        shipmentId: created!.id,
        location: origin,
        status: "pending",
        description: "Shipment registered with Shiprion.",
      });
      await tx.insert(notificationsTable).values({
        userId: customer.id,
        type: "shipment_created",
        title: "Shipment created",
        message: `${created!.trackingNumber} has been assigned to your account.`,
        href: "/dashboard?section=shipments",
      });
      const trackingUrl = appUrl(`/track/${created!.trackingNumber}`);
      await tx.insert(emailOutboxTable).values({
        toEmail: customer.email,
        subject: `Shiprion - Shipment ${created!.trackingNumber} created`,
        html: `<div style="font-family:sans-serif"><h2>Your shipment is ready to track</h2><p>${escapeHtml(created!.trackingNumber)} has been assigned to your account.</p><p><a href="${escapeHtml(trackingUrl)}">Track shipment</a></p></div>`,
      });
      if (
        recipientEmail &&
        recipientEmail.toLowerCase() !== customer.email.toLowerCase()
      ) {
        await tx.insert(emailOutboxTable).values({
          toEmail: recipientEmail,
          subject: `Shiprion - Shipment ${created!.trackingNumber} created`,
          html: `<div style="font-family:sans-serif"><h2>A shipment is on its way</h2><p>Hello ${escapeHtml(recipientName)}, a shipment from ${escapeHtml(origin)} to ${escapeHtml(destination)} has been created.</p><p><a href="${escapeHtml(trackingUrl)}">Track shipment</a></p></div>`,
        });
      }
      await tx.insert(auditEventsTable).values({
        actorId: req.session.userId,
        action: "shipment.created",
        entityType: "shipment",
        entityId: String(created!.id),
        metadata: {
          trackingNumber: created!.trackingNumber,
          customerId: customer.id,
          adminNote: adminNote ?? null,
        },
      });
      return created!;
    });

    try {
      const io = getIO();
      io.to("staff").emit("shipmentCreated", {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      });
      // Notify the sender's dashboard too (in case they're watching)
      io.to(`user:${customer.id}`).emit("shipmentCreated", {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      });
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res
      .status(201)
      .json(GetShipmentResponse.parse(serializeShipment(shipment)));
  },
);

router.patch(
  "/shipments/:id/assign",
  requireOperations,
  async (req, res): Promise<void> => {
    const shipmentId = Number(req.params.id);
    const parsed = z
      .object({ customerId: z.number().int().positive() })
      .safeParse(req.body);
    if (!Number.isInteger(shipmentId) || !parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Select a valid customer.",
        requestId: req.id,
      });
      return;
    }
    const [customer] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, parsed.data.customerId),
          eq(usersTable.role, "customer"),
          eq(usersTable.status, "active"),
        ),
      );
    if (!customer) {
      res.status(400).json({
        code: "CUSTOMER_INVALID",
        message: "The selected customer is not active.",
        requestId: req.id,
      });
      return;
    }
    const shipment = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(shipmentsTable)
        .set({
          customerId: customer.id,
          senderId: customer.id,
          ownershipNeedsReview: false,
          updatedAt: new Date(),
        })
        .where(eq(shipmentsTable.id, shipmentId))
        .returning();
      if (!updated) return null;
      await tx.insert(notificationsTable).values({
        userId: customer.id,
        type: "shipment_assigned",
        title: "Shipment assigned",
        message: `${updated.trackingNumber} has been assigned to your account.`,
        href: "/dashboard?section=shipments",
      });
      await tx.insert(emailOutboxTable).values({
        toEmail: customer.email,
        subject: `Shiprion - ${updated.trackingNumber} assigned`,
        html: `<div style="font-family:sans-serif"><h2>Shipment assigned</h2><p>${escapeHtml(updated.trackingNumber)} is now available in your account.</p></div>`,
      });
      await tx.insert(auditEventsTable).values({
        actorId: req.session.userId,
        action: "shipment.customer_assigned",
        entityType: "shipment",
        entityId: String(shipmentId),
        metadata: { customerId: customer.id },
      });
      return updated;
    });
    if (!shipment) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Shipment not found.",
        requestId: req.id,
      });
      return;
    }
    try {
      const io = getIO();
      io.to(`user:${customer.id}`).emit("shipmentUpdated", {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
      });
      io.to("staff").emit("shipmentUpdated", {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
      });
    } catch {
      /* best effort */
    }
    res.json(GetShipmentResponse.parse(serializeShipment(shipment)));
  },
);

router.get(
  "/shipments/map",
  requireOperations,
  async (_req, res): Promise<void> => {
    const result = await pool.query(`
    SELECT s.id, s.tracking_number AS "trackingNumber", s.status, s.origin, s.destination,
           latest.latitude, latest.longitude, latest.location, latest.occurred_at AS "occurredAt"
    FROM shipments s
    LEFT JOIN LATERAL (
      SELECT latitude, longitude, location, occurred_at
      FROM tracking_events
      WHERE shipment_id = s.id AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY occurred_at DESC LIMIT 1
    ) latest ON true
    WHERE s.status NOT IN ('delivered','cancelled')
    ORDER BY s.updated_at DESC
    LIMIT 500
  `);
    res.json({ items: result.rows });
  },
);

router.get("/shipments/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetShipmentParams.safeParse({ id: req.params["id"] });
  if (!params.success) {
    res.status(400).json({ error: "Invalid shipment id" });
    return;
  }

  const isStaff = req.session.role !== "customer";

  const conditions = isStaff
    ? eq(shipmentsTable.id, params.data.id)
    : and(
        eq(shipmentsTable.id, params.data.id),
        or(
          eq(shipmentsTable.customerId, req.session.userId!),
          eq(shipmentsTable.senderId, req.session.userId!),
        )!,
      );

  const [shipment] = await db.select().from(shipmentsTable).where(conditions);

  if (!shipment) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }

  const serialized = serializeShipment(shipment);
  res.json(
    GetShipmentResponse.parse(
      req.session.role === "support"
        ? redactShipmentForSupport(serialized)
        : serialized,
    ),
  );
});

router.patch(
  "/shipments/:id",
  requireOperations,
  async (req, res): Promise<void> => {
    const params = UpdateShipmentParams.safeParse({ id: req.params["id"] });
    if (!params.success) {
      res.status(400).json({ error: "Invalid shipment id" });
      return;
    }

    const body = UpdateShipmentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const conditions = eq(shipmentsTable.id, params.data.id);

    const { estimatedDelivery, adminNote, ...rest } = body.data;

    const updateValues: Partial<typeof shipmentsTable.$inferInsert> = {
      ...rest,
      updatedAt: new Date(),
    };

    if (estimatedDelivery !== undefined) {
      updateValues.estimatedDelivery = estimatedDelivery
        ? (estimatedDelivery as Date).toISOString().slice(0, 10)
        : null;
    }

    const [existing] = await db
      .select()
      .from(shipmentsTable)
      .where(conditions)
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    const previousStatus = existing.status;

    if (
      body.data.status &&
      !canTransitionShipment(previousStatus, body.data.status)
    ) {
      res.status(409).json({
        code: "INVALID_STATE",
        message: `Shipment cannot move from ${previousStatus} to ${body.data.status}.`,
        requestId: req.id,
      });
      return;
    }

    const newStatus = body.data.status ?? previousStatus;
    let pendingEvent: {
      location: string;
      description: string;
      latitude: number | null;
      longitude: number | null;
    } | null = null;
    if (body.data.status && newStatus !== previousStatus) {
      const STATUS_EVENTS: Record<
        string,
        {
          description: string;
          locationMode: "origin" | "destination" | "recipient_home";
        }
      > = {
        registered: {
          description:
            "Shipment has been registered and is being prepared for pickup.",
          locationMode: "origin",
        },
        pending: {
          description: "Shipment is awaiting pickup.",
          locationMode: "origin",
        },
        picked_up: {
          description: "Shipment has been picked up.",
          locationMode: "origin",
        },
        in_transit: {
          description:
            "Shipment has been picked up and is in transit by sea or air.",
          locationMode: "origin",
        },
        customs: {
          description: "Shipment is undergoing customs processing.",
          locationMode: "destination",
        },
        on_hold_customs: {
          description: "Package is held at customs pending clearance.",
          locationMode: "destination",
        },
        arrived_at_port: {
          description: "Package has arrived at the destination port.",
          locationMode: "destination",
        },
        out_for_delivery: {
          description: "Package is out for delivery and will arrive today.",
          locationMode: "recipient_home",
        },
        delivered: {
          description: "Package has been delivered successfully.",
          locationMode: "recipient_home",
        },
        cancelled: {
          description: "Shipment has been cancelled.",
          locationMode: "origin",
        },
      };

      const eventDef = STATUS_EVENTS[newStatus];
      if (eventDef) {
        let eventLocation: string;
        if (eventDef.locationMode === "recipient_home") {
          // Use city-level precision only — the recipient's street address and
          // postal code must never be stored in tracking events because those
          // events are returned by the unauthenticated public tracking endpoint.
          // Pinning to the destination city still gives a meaningful map marker
          // without disclosing the recipient's residential location.
          eventLocation =
            (rest.recipientCity ?? existing.recipientCity)
              ? `${rest.recipientCity ?? existing.recipientCity}, ${rest.destination ?? existing.destination}`
              : (rest.destination ?? existing.destination);
        } else if (eventDef.locationMode === "destination") {
          eventLocation = rest.destination ?? existing.destination;
        } else {
          eventLocation = rest.origin ?? existing.origin;
        }

        const geo = await geocodeLocation(eventLocation);
        pendingEvent = {
          location: eventLocation,
          description: eventDef.description,
          latitude: geo?.lat ?? null,
          longitude: geo?.lng ?? null,
        };
      }
    }

    let transactionResult;
    try {
      transactionResult = await db.transaction(async (tx) => {
        const [locked] = await tx
          .select()
          .from(shipmentsTable)
          .where(conditions)
          .limit(1)
          .for("update");
        if (!locked) throw new Error("SHIPMENT_NOT_FOUND");
        if (
          body.data.status &&
          !canTransitionShipment(locked.status, body.data.status)
        )
          throw new Error("INVALID_SHIPMENT_TRANSITION");
        const [updated] = await tx
          .update(shipmentsTable)
          .set(updateValues)
          .where(conditions)
          .returning();
        let notification = null;
        if (body.data.status && updated!.status !== locked.status) {
          if (pendingEvent)
            await tx.insert(trackingEventsTable).values({
              shipmentId: updated!.id,
              status: updated!.status,
              occurredAt: new Date(),
              ...pendingEvent,
            });
          const ownerId = updated!.customerId ?? updated!.senderId;
          if (ownerId) {
            [notification] = await tx
              .insert(notificationsTable)
              .values({
                userId: ownerId,
                ...shipmentStatusNotification(
                  updated!.trackingNumber,
                  updated!.status,
                ),
              })
              .returning();
            const [owner] = await tx
              .select({ email: usersTable.email })
              .from(usersTable)
              .where(eq(usersTable.id, ownerId));
            if (owner)
              await tx.insert(emailOutboxTable).values({
                toEmail: owner.email,
                subject: `Shiprion - ${updated!.trackingNumber} status update`,
                html: `<div style="font-family:sans-serif"><h2>Shipment status updated</h2><p>${escapeHtml(updated!.trackingNumber)} is now ${escapeHtml(updated!.status.replaceAll("_", " "))}.</p><p><a href="${escapeHtml(appUrl(`/track/${updated!.trackingNumber}`))}">View tracking</a></p></div>`,
              });
          }
          await tx.insert(auditEventsTable).values({
            actorId: req.session.userId,
            action: "shipment.status_changed",
            entityType: "shipment",
            entityId: String(updated!.id),
            metadata: {
              from: locked.status,
              to: updated!.status,
              adminNote: adminNote ?? null,
            },
          });
        }
        return { updated: updated!, notification };
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_SHIPMENT_TRANSITION"
      ) {
        res.status(409).json({
          code: "INVALID_STATE",
          message:
            "The shipment changed while this update was being processed. Refresh and try again.",
          requestId: req.id,
        });
        return;
      }
      throw error;
    }
    const updated = transactionResult.updated;

    try {
      const payload: ShipmentRealtimePayload = {
        shipmentId: updated.id,
        trackingNumber: updated.trackingNumber,
        status: updated.status,
        trigger:
          body.data.status && newStatus !== previousStatus
            ? "status_change"
            : "tracking_event",
      };
      const io = getIO();
      io.to(`shipment:${updated.trackingNumber}`).emit(
        "shipmentUpdated",
        payload,
      );
      io.to("staff").emit("shipmentUpdated", payload);
      // Notify the shipment owner so their dashboard stats refresh in real-time
      if (updated.customerId ?? updated.senderId) {
        const ownerRoom = `user:${updated.customerId ?? updated.senderId}`;
        io.to(ownerRoom).emit("shipmentUpdated", payload);
        if (transactionResult.notification)
          io.to(ownerRoom).emit(
            "notification:new",
            transactionResult.notification,
          );
      }
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.json(UpdateShipmentResponse.parse(serializeShipment(updated)));
  },
);

router.delete(
  "/shipments/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteShipmentParams.safeParse({ id: req.params["id"] });
    if (!params.success) {
      res.status(400).json({ error: "Invalid shipment id" });
      return;
    }

    const [deleted] = await db
      .delete(shipmentsTable)
      .where(eq(shipmentsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    try {
      getIO()
        .to("staff")
        .emit("shipmentDeleted", { shipmentId: params.data.id });
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.sendStatus(204);
  },
);

export default router;
