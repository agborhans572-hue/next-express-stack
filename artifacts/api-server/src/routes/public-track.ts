import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, shipmentsTable, trackingEventsTable } from "@workspace/db";
import { persistentRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

const publicTrackLimiter = persistentRateLimit("public-track", 30, 60_000);

router.get(
  "/track/:trackingNumber",
  publicTrackLimiter,
  async (req, res): Promise<void> => {
    const raw = ((req.params.trackingNumber ?? "") as string).trim();

    if (!raw) {
      res.status(400).json({ error: "Tracking number is required." });
      return;
    }

    const normalized = raw.toUpperCase();

    if (normalized.length > 40 || !/^[A-Z0-9-]+$/.test(normalized)) {
      res.status(400).json({
        error:
          "Invalid tracking number format. Tracking numbers contain only letters, digits, and hyphens.",
      });
      return;
    }

    const [shipment] = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.trackingNumber, normalized));

    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    const rawEvents = await db
      .select({
        id: trackingEventsTable.id,
        shipmentId: trackingEventsTable.shipmentId,
        location: trackingEventsTable.location,
        status: trackingEventsTable.status,
        description: trackingEventsTable.description,
        occurredAt: trackingEventsTable.occurredAt,
        createdAt: trackingEventsTable.createdAt,
      })
      .from(trackingEventsTable)
      .where(eq(trackingEventsTable.shipmentId, shipment.id))
      .orderBy(asc(trackingEventsTable.occurredAt));

    // Statuses where the stored location may contain a recipient's residential
    // address (legacy events predate the city-only location fix). Scrub these
    // to the destination country/city so the public timeline never reveals a
    // precise home address regardless of when the event was created.
    const DELIVERY_STATUSES = new Set(["out_for_delivery", "delivered"]);

    const events = rawEvents.map((e) => ({
      ...e,
      // Coarsen location for delivery-stage events to prevent exposing any
      // historically stored precise recipient addresses.
      location: DELIVERY_STATUSES.has(e.status)
        ? shipment.destination
        : e.location,
    }));

    // Omitted from the public response:
    //   recipientName — links the tracking number to a real person.
    //   latitude/longitude — coordinates would enable physical-location intel;
    //     coarse city/country text in `location` is sufficient for a timeline.
    res.json({
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      weightKg: shipment.weightKg ?? null,
      estimatedDelivery: shipment.estimatedDelivery ?? null,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      events,
    });
  },
);

export default router;
