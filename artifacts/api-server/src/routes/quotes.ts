import { Router, type IRouter } from "express";
import { and, count, desc, eq, gt, inArray, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import {
  auditEventsTable,
  authTokensTable,
  db,
  emailOutboxTable,
  notificationsTable,
  quotesTable,
  serviceRatesTable,
  shipmentsTable,
  trackingEventsTable,
  usersTable,
} from "@workspace/db";
import {
  calculatePrice,
  generateQuoteReference,
  generateTrackingNumber,
} from "../lib/pricing";
import {
  appUrl,
  createOpaqueToken,
  escapeHtml,
  hashToken,
} from "../lib/security";
import { persistentRateLimit } from "../lib/rate-limit";
import {
  requireAuth,
  requireOperations,
  requireRoles,
} from "../middleware/auth";
import { getIO } from "../socket";

const router: IRouter = Router();
const requireQuoteReader = requireRoles("admin", "operator", "customer");
const submitLimit = persistentRateLimit("quote-submit", 10, 60 * 60_000);
const quoteInput = z.object({
  serviceCode: z.string().trim().min(1).max(40),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  contactPhone: z.string().trim().max(40).optional(),
  origin: z.string().trim().min(2).max(200),
  destination: z.string().trim().min(2).max(200),
  cargoType: z.string().trim().min(2).max(100),
  weightKg: z.number().positive().max(50_000),
  lengthCm: z.number().positive().max(10_000).optional(),
  widthCm: z.number().positive().max(10_000).optional(),
  heightCm: z.number().positive().max(10_000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

async function activeRate(code: string) {
  const [rate] = await db
    .select()
    .from(serviceRatesTable)
    .where(
      and(eq(serviceRatesTable.code, code), eq(serviceRatesTable.active, true)),
    )
    .orderBy(desc(serviceRatesTable.version))
    .limit(1);
  return rate;
}

async function expireOffers(): Promise<void> {
  await db
    .update(quotesTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(quotesTable.status, "offered"),
        lt(quotesTable.validUntil, new Date()),
      ),
    );
}

function canRead(
  role: string,
  customerId: number | null,
  userId: number,
): boolean {
  return role !== "customer" || customerId === userId;
}

router.post("/quotes", submitLimit, async (req, res): Promise<void> => {
  const parsed = quoteInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message,
      fieldErrors: parsed.error.flatten().fieldErrors,
      requestId: req.id,
    });
    return;
  }
  const rate = await activeRate(parsed.data.serviceCode);
  if (!rate) {
    res.status(404).json({
      code: "RATE_NOT_FOUND",
      message: "The selected service is unavailable.",
      requestId: req.id,
    });
    return;
  }
  let breakdown;
  try {
    breakdown = calculatePrice(rate, parsed.data.weightKg);
  } catch (error) {
    res.status(400).json({
      code: "WEIGHT_OUT_OF_RANGE",
      message: error instanceof Error ? error.message : "Unsupported weight.",
      requestId: req.id,
    });
    return;
  }
  let customerId: number | null = null;
  if (req.session.userId) {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!));
    if (user?.role === "customer" && user.email === parsed.data.contactEmail)
      customerId = user.id;
  }
  let developmentClaimToken: string | undefined;
  const result = await db.transaction(async (tx) => {
    const [quote] = await tx
      .insert(quotesTable)
      .values({
        ...parsed.data,
        reference: generateQuoteReference(),
        customerId,
        serviceRateId: rate.id,
        rateSnapshot: {
          code: rate.code,
          name: rate.name,
          version: rate.version,
          baseFeeCents: rate.baseFeeCents,
          perKgCents: rate.perKgCents,
          fuelPct: rate.fuelPct,
          weightKg: parsed.data.weightKg,
        },
        estimatedPriceCents: breakdown.totalCents,
      })
      .returning();
    if (customerId) {
      await tx.insert(notificationsTable).values({
        userId: customerId,
        type: "quote_submitted",
        title: "Quote request received",
        message: `${quote!.reference} is awaiting review.`,
        href: "/dashboard?section=quotes",
      });
    } else {
      const { token, hash } = createOpaqueToken();
      if (
        process.env.NODE_ENV === "development" &&
        !process.env.SMTP_USER &&
        !process.env.SMTP_PASS
      ) {
        developmentClaimToken = token;
      }
      await tx.insert(authTokensTable).values({
        quoteId: quote!.id,
        email: quote!.contactEmail,
        type: "quote_claim",
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      });
      const claimUrl = appUrl(
        `/claim-quote?token=${encodeURIComponent(token)}`,
      );
      await tx.insert(emailOutboxTable).values({
        toEmail: quote!.contactEmail,
        subject: `Shiprion — Claim quote ${quote!.reference}`,
        html: `<div style="font-family:sans-serif"><h2>Your quote request was received</h2><p>Create or verify your Shiprion account to follow and accept this quote.</p><p><a href="${escapeHtml(claimUrl)}">Claim ${escapeHtml(quote!.reference)}</a></p><p>This link expires in 24 hours.</p></div>`,
      });
    }
    return quote!;
  });
  try {
    getIO()
      .to("staff")
      .emit("quote:created", { id: result.id, reference: result.reference });
  } catch {
    /* best effort */
  }
  res.status(201).json({
    ...result,
    breakdown,
    ...(developmentClaimToken ? { devClaimToken: developmentClaimToken } : {}),
  });
});

router.post("/quotes/claim", requireAuth, async (req, res): Promise<void> => {
  const parsed = z
    .object({ token: z.string().min(20).max(200) })
    .safeParse(req.body);
  if (!parsed.success || req.session.role !== "customer") {
    res.status(400).json({
      code: "INVALID_TOKEN",
      message: "The claim link is invalid or expired.",
      requestId: req.id,
    });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));
  const [token] = await db
    .select()
    .from(authTokensTable)
    .where(
      and(
        eq(authTokensTable.type, "quote_claim"),
        eq(authTokensTable.tokenHash, hashToken(parsed.data.token)),
        isNull(authTokensTable.usedAt),
        gt(authTokensTable.expiresAt, new Date()),
      ),
    );
  if (!user || !token?.quoteId || user.email !== token.email) {
    res.status(400).json({
      code: "INVALID_TOKEN",
      message: "Sign in with the invited email address.",
      requestId: req.id,
    });
    return;
  }
  const quote = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(quotesTable)
      .set({ customerId: user.id, updatedAt: new Date() })
      .where(
        and(eq(quotesTable.id, token.quoteId!), isNull(quotesTable.customerId)),
      )
      .returning();
    if (!claimed) return null;
    await tx
      .update(authTokensTable)
      .set({ usedAt: new Date(), userId: user.id })
      .where(eq(authTokensTable.id, token.id));
    await tx.insert(notificationsTable).values({
      userId: user.id,
      type: "quote_claimed",
      title: "Quote added to your account",
      message: `${claimed.reference} is now available in your dashboard.`,
      href: "/dashboard?section=quotes",
    });
    return claimed;
  });
  if (!quote) {
    res.status(409).json({
      code: "ALREADY_CLAIMED",
      message: "This quote has already been claimed.",
      requestId: req.id,
    });
    return;
  }
  res.json(quote);
});

router.get("/quotes", requireQuoteReader, async (req, res): Promise<void> => {
  await expireOffers();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const where =
    req.session.role === "customer"
      ? eq(quotesTable.customerId, req.session.userId!)
      : undefined;
  const [items, totals] = await Promise.all([
    db
      .select()
      .from(quotesTable)
      .where(where)
      .orderBy(desc(quotesTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(quotesTable).where(where),
  ]);
  res.json({ items, page, pageSize, total: totals[0]?.count ?? 0 });
});

router.get(
  "/quotes/:id",
  requireQuoteReader,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const [quote] = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, id));
    if (
      !quote ||
      !canRead(req.session.role!, quote.customerId, req.session.userId!)
    ) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Quote not found.",
        requestId: req.id,
      });
      return;
    }
    res.json(quote);
  },
);

router.patch(
  "/quotes/:id/review",
  requireOperations,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const [quote] = await db
      .update(quotesTable)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(and(eq(quotesTable.id, id), eq(quotesTable.status, "submitted")))
      .returning();
    if (!quote) {
      res.status(409).json({
        code: "INVALID_STATE",
        message: "Only submitted quotes can enter review.",
        requestId: req.id,
      });
      return;
    }
    res.json(quote);
  },
);

router.post(
  "/quotes/:id/offer",
  requireOperations,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const parsed = z
      .object({
        finalPriceCents: z.number().int().min(0),
        validDays: z.number().int().min(1).max(90).default(14),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message,
        requestId: req.id,
      });
      return;
    }
    const validUntil = new Date(
      Date.now() + parsed.data.validDays * 86_400_000,
    );
    let quote;
    try {
      quote = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(quotesTable)
          .where(eq(quotesTable.id, id))
          .for("update");
        if (
          !existing ||
          !["submitted", "under_review", "offered"].includes(existing.status)
        )
          throw new Error("INVALID_QUOTE_STATE");
        const [updated] = await tx
          .update(quotesTable)
          .set({
            status: "offered",
            finalPriceCents: parsed.data.finalPriceCents,
            validUntil,
            offeredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(quotesTable.id, id),
              inArray(quotesTable.status, [
                "submitted",
                "under_review",
                "offered",
              ]),
            ),
          )
          .returning();
        if (!updated) throw new Error("INVALID_QUOTE_STATE");
        const message = `${updated.reference} is ready for review at $${(parsed.data.finalPriceCents / 100).toFixed(2)}.`;
        if (updated.customerId)
          await tx.insert(notificationsTable).values({
            userId: updated.customerId,
            type: "quote_offered",
            title: "Your quote is ready",
            message,
            href: "/dashboard?section=quotes",
          });
        await tx.insert(emailOutboxTable).values({
          toEmail: updated.contactEmail,
          subject: `Shiprion - Quote ${updated.reference} is ready`,
          html: `<div style="font-family:sans-serif"><h2>Your Shiprion quote is ready</h2><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(appUrl("/dashboard?section=quotes"))}">Review quote</a></p><p>Valid until ${validUntil.toLocaleDateString("en-US")}.</p></div>`,
        });
        await tx.insert(auditEventsTable).values({
          actorId: req.session.userId,
          action: "quote.offered",
          entityType: "quote",
          entityId: String(id),
          metadata: {
            finalPriceCents: parsed.data.finalPriceCents,
            validUntil: validUntil.toISOString(),
          },
        });
        return updated;
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_QUOTE_STATE") {
        res.status(409).json({
          code: "INVALID_STATE",
          message: "This quote cannot be offered.",
          requestId: req.id,
        });
        return;
      }
      throw error;
    }
    try {
      if (quote.customerId)
        getIO().to(`user:${quote.customerId}`).emit("notification:new", {
          type: "quote_offered",
          quoteId: quote.id,
        });
    } catch {
      /* best effort */
    }
    res.json(quote);
  },
);

router.post(
  "/quotes/:id/accept",
  requireAuth,
  async (req, res): Promise<void> => {
    if (req.session.role !== "customer") {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "Only customers can accept quotes.",
        requestId: req.id,
      });
      return;
    }
    const id = Number(req.params.id);
    const quote = await db.transaction(async (tx) => {
      const [accepted] = await tx
        .update(quotesTable)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quotesTable.id, id),
            eq(quotesTable.customerId, req.session.userId!),
            eq(quotesTable.status, "offered"),
            gt(quotesTable.validUntil, new Date()),
          ),
        )
        .returning();
      if (!accepted) return null;
      await tx.insert(notificationsTable).values({
        userId: req.session.userId!,
        type: "quote_accepted",
        title: "Quote accepted",
        message: `${accepted.reference} has been accepted and is ready for shipment scheduling.`,
        href: "/dashboard?section=quotes",
      });
      await tx.insert(emailOutboxTable).values({
        toEmail: accepted.contactEmail,
        subject: `Shiprion - Quote ${accepted.reference} accepted`,
        html: `<div style="font-family:sans-serif"><h2>Quote accepted</h2><p>${escapeHtml(accepted.reference)} has been accepted. Our operations team will prepare the shipment.</p></div>`,
      });
      const staff = await tx
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            inArray(usersTable.role, ["admin", "operator"]),
            eq(usersTable.status, "active"),
          ),
        );
      if (staff.length)
        await tx.insert(notificationsTable).values(
          staff.map(({ id: userId }) => ({
            userId,
            type: "quote_accepted",
            title: "Quote accepted",
            message: `${accepted.reference} was accepted and is ready to convert.`,
            href: "/admin",
          })),
        );
      await tx.insert(auditEventsTable).values({
        actorId: req.session.userId,
        action: "quote.accepted",
        entityType: "quote",
        entityId: String(id),
        metadata: {},
      });
      return accepted;
    });
    if (!quote) {
      res.status(409).json({
        code: "INVALID_STATE",
        message: "This quote is unavailable or expired.",
        requestId: req.id,
      });
      return;
    }
    try {
      getIO()
        .to("staff")
        .emit("quote:accepted", { id: quote.id, reference: quote.reference });
    } catch {
      /* best effort */
    }
    res.json(quote);
  },
);

router.post(
  "/quotes/:id/reject",
  requireAuth,
  async (req, res): Promise<void> => {
    if (req.session.role !== "customer") {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "Only customers can reject quotes.",
        requestId: req.id,
      });
      return;
    }
    const id = Number(req.params.id);
    const quote = await db.transaction(async (tx) => {
      const [rejected] = await tx
        .update(quotesTable)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(
          and(
            eq(quotesTable.id, id),
            eq(quotesTable.customerId, req.session.userId!),
            eq(quotesTable.status, "offered"),
          ),
        )
        .returning();
      if (!rejected) return null;
      await tx.insert(auditEventsTable).values({
        actorId: req.session.userId,
        action: "quote.rejected",
        entityType: "quote",
        entityId: String(id),
        metadata: {},
      });
      return rejected;
    });
    if (!quote) {
      res.status(409).json({
        code: "INVALID_STATE",
        message: "This quote cannot be rejected.",
        requestId: req.id,
      });
      return;
    }
    res.json(quote);
  },
);

router.post(
  "/quotes/:id/convert",
  requireOperations,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const parsed = z
      .object({
        recipientName: z.string().trim().min(2).max(120),
        recipientEmail: z.string().email().optional(),
        recipientPhone: z.string().max(40).optional(),
        recipientAddress: z.string().min(2).max(300),
        estimatedDelivery: z.string().date().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message,
        fieldErrors: parsed.error.flatten().fieldErrors,
        requestId: req.id,
      });
      return;
    }
    let result;
    try {
      result = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(quotesTable)
          .where(eq(quotesTable.id, id))
          .for("update");
        if (
          !existing ||
          existing.status !== "accepted" ||
          !existing.customerId ||
          existing.convertedShipmentId
        )
          throw new Error("INVALID_QUOTE_STATE");
        const [customer] = await tx
          .select()
          .from(usersTable)
          .where(
            and(
              eq(usersTable.id, existing.customerId),
              eq(usersTable.role, "customer"),
              eq(usersTable.status, "active"),
            ),
          );
        if (!customer) throw new Error("CUSTOMER_MISSING");
        const [created] = await tx
          .insert(shipmentsTable)
          .values({
            trackingNumber: generateTrackingNumber(),
            customerId: customer.id,
            senderId: customer.id,
            sourceQuoteId: existing.id,
            priceCents: existing.finalPriceCents,
            senderName: customer.fullName ?? existing.contactName,
            senderPhone: customer.phone ?? existing.contactPhone,
            senderAddress: existing.origin,
            recipientName: parsed.data.recipientName,
            recipientEmail: parsed.data.recipientEmail,
            recipientPhone: parsed.data.recipientPhone,
            recipientAddress: parsed.data.recipientAddress,
            origin: existing.origin,
            destination: existing.destination,
            weightKg: existing.weightKg,
            estimatedDelivery: parsed.data.estimatedDelivery,
            status: "pending",
          })
          .returning();
        await tx.insert(trackingEventsTable).values({
          shipmentId: created!.id,
          location: existing.origin,
          status: "pending",
          description: "Shipment registered with Shiprion.",
        });
        await tx
          .update(quotesTable)
          .set({
            status: "converted",
            convertedAt: new Date(),
            convertedShipmentId: created!.id,
            updatedAt: new Date(),
          })
          .where(eq(quotesTable.id, id));
        await tx.insert(notificationsTable).values({
          userId: customer.id,
          type: "shipment_created",
          title: "Shipment created",
          message: `${created!.trackingNumber} was created from quote ${existing.reference}.`,
          href: "/dashboard?section=shipments",
        });
        await tx.insert(emailOutboxTable).values({
          toEmail: customer.email,
          subject: `Shiprion - Shipment ${created!.trackingNumber} created`,
          html: `<div style="font-family:sans-serif"><h2>Your shipment is ready to track</h2><p>Tracking number: <strong>${escapeHtml(created!.trackingNumber)}</strong></p><p><a href="${escapeHtml(appUrl(`/track/${created!.trackingNumber}`))}">Track shipment</a></p></div>`,
        });
        await tx.insert(auditEventsTable).values({
          actorId: req.session.userId,
          action: "quote.converted",
          entityType: "quote",
          entityId: String(id),
          metadata: { shipmentId: created!.id },
        });
        return { shipment: created!, customerId: customer.id };
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_QUOTE_STATE") {
        res.status(409).json({
          code: "INVALID_STATE",
          message:
            "Only an accepted, customer-owned quote can be converted once.",
          requestId: req.id,
        });
        return;
      }
      if (error instanceof Error && error.message === "CUSTOMER_MISSING") {
        res.status(409).json({
          code: "CUSTOMER_MISSING",
          message: "The quote customer is no longer active.",
          requestId: req.id,
        });
        return;
      }
      throw error;
    }
    const shipment = result.shipment;
    try {
      const io = getIO();
      io.to(`user:${result.customerId}`).emit("shipmentUpdated", {
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
    res.status(201).json(shipment);
  },
);

export default router;
