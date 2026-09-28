import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  auditEventsTable,
  db,
  emailOutboxTable,
  notificationsTable,
  proofDeliveriesTable,
  shipmentsTable,
  trackingEventsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, requireOperations } from "../middleware/auth";
import {
  assertStoredObject,
  createPodDownload,
  createPodUpload,
  validatePodFile,
} from "../lib/storage";
import { appUrl, escapeHtml } from "../lib/security";
import { getIO } from "../socket";
import type { ShipmentRealtimePayload } from "@workspace/api-zod";

const router: IRouter = Router();
const uploadSchema = z.object({
  shipmentId: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  size: z.number().int().positive(),
});

router.post(
  "/uploads/presign",
  requireOperations,
  async (req, res): Promise<void> => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message,
        fieldErrors: parsed.error.flatten().fieldErrors,
        requestId: req.id,
      });
      return;
    }
    try {
      validatePodFile(parsed.data.contentType, parsed.data.size);
    } catch (error) {
      res.status(400).json({
        code: "INVALID_FILE",
        message: error instanceof Error ? error.message : "Invalid file.",
        requestId: req.id,
      });
      return;
    }
    const [shipment] = await db
      .select({ id: shipmentsTable.id })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, parsed.data.shipmentId));
    if (!shipment) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Shipment not found.",
        requestId: req.id,
      });
      return;
    }
    try {
      res.json(
        await createPodUpload(
          shipment.id,
          parsed.data.fileName,
          parsed.data.contentType,
          parsed.data.size,
        ),
      );
    } catch (error) {
      req.log.error({ error }, "Could not create S3 upload URL");
      res.status(503).json({
        code: "STORAGE_UNAVAILABLE",
        message: "Delivery file storage is temporarily unavailable.",
        requestId: req.id,
      });
    }
  },
);

router.post(
  "/shipments/:id/proof-of-delivery",
  requireOperations,
  async (req, res): Promise<void> => {
    const shipmentId = Number(req.params.id);
    const parsed = z
      .object({
        recipientName: z.string().trim().min(2).max(120),
        deliveredAt: z.coerce.date().max(new Date(Date.now() + 5 * 60_000)),
        notes: z.string().trim().max(2000).optional(),
        objectKey: z.string().min(10).max(500),
        originalFileName: z.string().min(1).max(180),
        contentType: z.enum([
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ]),
        fileSize: z.number().int().positive(),
      })
      .safeParse(req.body);
    if (!Number.isInteger(shipmentId) || !parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.success
          ? "Invalid shipment id."
          : parsed.error.issues[0]?.message,
        requestId: req.id,
      });
      return;
    }
    if (!parsed.data.objectKey.startsWith(`pod/${shipmentId}/`)) {
      res.status(400).json({
        code: "INVALID_FILE",
        message: "The uploaded file does not belong to this shipment.",
        requestId: req.id,
      });
      return;
    }
    try {
      validatePodFile(parsed.data.contentType, parsed.data.fileSize);
      await assertStoredObject(parsed.data.objectKey);
    } catch (error) {
      req.log.warn({ error, shipmentId }, "Proof object validation failed");
      res.status(400).json({
        code: "INVALID_FILE",
        message: "The delivery file could not be verified.",
        requestId: req.id,
      });
      return;
    }
    const [shipment] = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, shipmentId));
    if (!shipment) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Shipment not found.",
        requestId: req.id,
      });
      return;
    }
    if (shipment.status !== "out_for_delivery") {
      res.status(409).json({
        code: "INVALID_STATE",
        message:
          "Proof of delivery can only be recorded for an out-for-delivery shipment.",
        requestId: req.id,
      });
      return;
    }
    const [customer] = shipment.customerId
      ? await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, shipment.customerId))
      : [];
    let proof;
    try {
      proof = await db.transaction(async (tx) => {
        const [locked] = await tx
          .update(shipmentsTable)
          .set({ status: "delivered", updatedAt: new Date() })
          .where(
            and(
              eq(shipmentsTable.id, shipmentId),
              eq(shipmentsTable.status, "out_for_delivery"),
            ),
          )
          .returning();
        if (!locked) throw new Error("INVALID_SHIPMENT_STATE");
        const [created] = await tx
          .insert(proofDeliveriesTable)
          .values({
            shipmentId,
            recipientName: parsed.data.recipientName,
            deliveredAt: parsed.data.deliveredAt,
            notes: parsed.data.notes,
            objectKey: parsed.data.objectKey,
            originalFileName: parsed.data.originalFileName,
            contentType: parsed.data.contentType,
            fileSize: parsed.data.fileSize,
            uploadedBy: req.session.userId,
          })
          .returning();
        await tx.insert(trackingEventsTable).values({
          shipmentId,
          location: locked.destination,
          status: "delivered",
          description: `Delivered to ${parsed.data.recipientName}.`,
          occurredAt: parsed.data.deliveredAt,
        });
        if (customer) {
          await tx.insert(notificationsTable).values({
            userId: customer.id,
            type: "shipment_delivered",
            title: "Shipment delivered",
            message: `${shipment.trackingNumber} was delivered successfully.`,
            href: "/dashboard?section=shipments",
          });
          await tx.insert(emailOutboxTable).values({
            toEmail: customer.email,
            subject: `Shiprion — ${shipment.trackingNumber} delivered`,
            html: `<div style="font-family:sans-serif"><h2>Shipment delivered</h2><p>${escapeHtml(shipment.trackingNumber)} was delivered to ${escapeHtml(parsed.data.recipientName)}.</p><p><a href="${escapeHtml(appUrl("/dashboard?section=shipments"))}">View proof of delivery</a></p></div>`,
          });
        }
        await tx.insert(auditEventsTable).values({
          actorId: req.session.userId,
          action: "shipment.delivery_recorded",
          entityType: "shipment",
          entityId: String(shipmentId),
          metadata: { proofId: created!.id },
        });
        return created!;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_SHIPMENT_STATE"
      ) {
        res.status(409).json({
          code: "INVALID_STATE",
          message:
            "Proof of delivery can only be recorded once for an out-for-delivery shipment.",
          requestId: req.id,
        });
        return;
      }
      throw error;
    }
    try {
      const io = getIO();
      const payload: ShipmentRealtimePayload = {
        shipmentId,
        trackingNumber: shipment.trackingNumber,
        status: "delivered",
        trigger: "status_change",
      };
      io.to(`shipment:${shipment.trackingNumber}`).emit(
        "shipmentUpdated",
        payload,
      );
      io.to("staff").emit("shipmentUpdated", payload);
      if (shipment.customerId)
        io.to(`user:${shipment.customerId}`).emit("shipmentUpdated", payload);
    } catch {
      /* best effort */
    }
    res.status(201).json({
      ...proof,
      downloadUrl: await createPodDownload(proof.objectKey),
    });
  },
);

router.get(
  "/shipments/:id/proof-of-delivery",
  requireAuth,
  async (req, res): Promise<void> => {
    const shipmentId = Number(req.params.id);
    const [shipment] = await db
      .select({ customerId: shipmentsTable.customerId })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, shipmentId));
    if (
      !shipment ||
      (req.session.role === "customer" &&
        shipment.customerId !== req.session.userId)
    ) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Proof of delivery not found.",
        requestId: req.id,
      });
      return;
    }
    const [proof] = await db
      .select()
      .from(proofDeliveriesTable)
      .where(eq(proofDeliveriesTable.shipmentId, shipmentId));
    if (!proof) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Proof of delivery not found.",
        requestId: req.id,
      });
      return;
    }
    try {
      res.json({
        ...proof,
        objectKey: undefined,
        downloadUrl: await createPodDownload(proof.objectKey),
        expiresIn: 300,
      });
    } catch (error) {
      req.log.error(
        { error, shipmentId },
        "Could not create proof download URL",
      );
      res.status(503).json({
        code: "STORAGE_UNAVAILABLE",
        message: "The delivery file is temporarily unavailable.",
        requestId: req.id,
      });
    }
  },
);

export default router;
