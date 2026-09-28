import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import {
  auditEventsTable,
  db,
  emailOutboxTable,
  notificationsTable,
  SHIPMENT_STATUSES,
  shipmentsTable,
  trackingEventsTable,
  usersTable,
} from "@workspace/db";
import { getIO } from "../socket";
import {
  ListTrackingEventsParams,
  CreateTrackingEventParams,
  CreateTrackingEventBody,
  ListTrackingEventsResponse,
  ListTrackingEventsResponseItem,
  type ShipmentRealtimePayload,
} from "@workspace/api-zod";
import { requireAuth, requireOperations } from "../middleware/auth";
import { geocodeLocation } from "../lib/geocode";
import { canTransitionShipment } from "../lib/shipment-state";
import { appUrl, escapeHtml } from "../lib/security";
import { shipmentStatusNotification } from "../lib/notification-content";

const router: IRouter = Router();

router.get(
  "/shipments/:id/tracking",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListTrackingEventsParams.safeParse({ id: req.params["id"] });
    if (!params.success) {
      res.status(400).json({ error: "Invalid shipment id" });
      return;
    }

    const isStaff = req.session.role !== "customer";

    const [shipment] = await db
      .select({
        id: shipmentsTable.id,
        senderId: shipmentsTable.senderId,
        customerId: shipmentsTable.customerId,
      })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, params.data.id));

    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    if (
      !isStaff &&
      (shipment.customerId ?? shipment.senderId) !== req.session.userId
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const events = await db
      .select()
      .from(trackingEventsTable)
      .where(eq(trackingEventsTable.shipmentId, params.data.id))
      .orderBy(asc(trackingEventsTable.occurredAt));

    res.json(ListTrackingEventsResponse.parse(events));
  },
);

router.post(
  "/shipments/:id/tracking",
  requireOperations,
  async (req, res): Promise<void> => {
    const params = CreateTrackingEventParams.safeParse({
      id: req.params["id"],
    });
    if (!params.success) {
      res.status(400).json({ error: "Invalid shipment id" });
      return;
    }

    const body = CreateTrackingEventBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    if (
      !SHIPMENT_STATUSES.includes(
        body.data.status as (typeof SHIPMENT_STATUSES)[number],
      )
    ) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid shipment status.",
        requestId: req.id,
      });
      return;
    }

    const [shipment] = await db
      .select({
        id: shipmentsTable.id,
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        senderId: shipmentsTable.senderId,
        customerId: shipmentsTable.customerId,
      })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, params.data.id));

    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }
    if (!canTransitionShipment(shipment.status, body.data.status)) {
      res.status(409).json({
        code: "INVALID_STATE",
        message: `Shipment cannot move from ${shipment.status} to ${body.data.status}.`,
        requestId: req.id,
      });
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;
    const geo = await geocodeLocation(body.data.location);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }

    let result;
    try {
      result = await db.transaction(async (tx) => {
        const [locked] = await tx
          .select()
          .from(shipmentsTable)
          .where(eq(shipmentsTable.id, params.data.id))
          .for("update");
        if (!locked) throw new Error("SHIPMENT_NOT_FOUND");
        if (!canTransitionShipment(locked.status, body.data.status))
          throw new Error("INVALID_SHIPMENT_TRANSITION");
        const [event] = await tx
          .insert(trackingEventsTable)
          .values({
            shipmentId: params.data.id,
            location: body.data.location,
            status: body.data.status,
            description: body.data.description,
            latitude: lat,
            longitude: lng,
            occurredAt: body.data.occurredAt ?? new Date(),
          })
          .returning();
        let notification = null;
        if (body.data.status !== locked.status) {
          await tx
            .update(shipmentsTable)
            .set({
              status: body.data.status as (typeof SHIPMENT_STATUSES)[number],
              updatedAt: new Date(),
            })
            .where(eq(shipmentsTable.id, locked.id));
          const ownerId = locked.customerId ?? locked.senderId;
          if (ownerId) {
            [notification] = await tx
              .insert(notificationsTable)
              .values({
                userId: ownerId,
                ...shipmentStatusNotification(
                  locked.trackingNumber,
                  body.data.status,
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
                subject: `Shiprion - ${locked.trackingNumber} status update`,
                html: `<div style="font-family:sans-serif"><h2>Shipment status updated</h2><p>${escapeHtml(locked.trackingNumber)} is now ${escapeHtml(body.data.status.replaceAll("_", " "))}.</p><p><a href="${escapeHtml(appUrl(`/track/${locked.trackingNumber}`))}">View tracking</a></p></div>`,
              });
          }
          await tx.insert(auditEventsTable).values({
            actorId: req.session.userId,
            action: "shipment.status_changed",
            entityType: "shipment",
            entityId: String(locked.id),
            metadata: {
              from: locked.status,
              to: body.data.status,
              source: "tracking_event",
            },
          });
        }
        return { event: event!, notification };
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_SHIPMENT_TRANSITION"
      ) {
        res.status(409).json({
          code: "INVALID_STATE",
          message:
            "The shipment changed while this event was being processed. Refresh and try again.",
          requestId: req.id,
        });
        return;
      }
      throw error;
    }

    try {
      const payload: ShipmentRealtimePayload = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: body.data.status,
        trigger:
          body.data.status === shipment.status
            ? "tracking_event"
            : "status_change",
      };
      const io = getIO();
      io.to(`shipment:${shipment.trackingNumber}`).emit(
        "shipmentUpdated",
        payload,
      );
      io.to("staff").emit("shipmentUpdated", payload);
      // Notify the shipment owner so their dashboard stats refresh in real-time
      if (shipment.customerId ?? shipment.senderId) {
        const ownerRoom = `user:${shipment.customerId ?? shipment.senderId}`;
        io.to(ownerRoom).emit("shipmentUpdated", payload);
        if (result.notification)
          io.to(ownerRoom).emit("notification:new", result.notification);
      }
    } catch {
      // Socket.IO not yet initialized — non-fatal
    }

    res.status(201).json(ListTrackingEventsResponseItem.parse(result.event));
  },
);

export default router;
