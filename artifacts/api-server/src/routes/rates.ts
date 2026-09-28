import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditEventsTable, db, serviceRatesTable } from "@workspace/db";
import { calculatePrice } from "../lib/pricing";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
const rateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{2,40}$/),
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(300).default(""),
    baseFeeCents: z.number().int().min(0).max(100_000_000),
    perKgCents: z.number().int().min(0).max(10_000_000),
    fuelPct: z.number().min(0).max(100),
    minWeightKg: z.number().positive(),
    maxWeightKg: z.number().positive(),
    transitDaysMin: z.number().int().min(0).max(365),
    transitDaysMax: z.number().int().min(0).max(365),
  })
  .refine(
    (data) =>
      data.maxWeightKg >= data.minWeightKg &&
      data.transitDaysMax >= data.transitDaysMin,
    { message: "Maximum values must be greater than minimum values." },
  );

router.get("/rates", async (_req, res): Promise<void> => {
  const rates = await db
    .select()
    .from(serviceRatesTable)
    .where(eq(serviceRatesTable.active, true))
    .orderBy(serviceRatesTable.name);
  res.json({ items: rates });
});

router.post("/rates/estimate", async (req, res): Promise<void> => {
  const parsed = z
    .object({ serviceCode: z.string().min(1), weightKg: z.number().positive() })
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
  const [rate] = await db
    .select()
    .from(serviceRatesTable)
    .where(
      and(
        eq(serviceRatesTable.code, parsed.data.serviceCode),
        eq(serviceRatesTable.active, true),
      ),
    )
    .orderBy(desc(serviceRatesTable.version))
    .limit(1);
  if (!rate) {
    res.status(404).json({
      code: "RATE_NOT_FOUND",
      message: "The selected service is unavailable.",
      requestId: req.id,
    });
    return;
  }
  try {
    res.json({ rate, breakdown: calculatePrice(rate, parsed.data.weightKg) });
  } catch (error) {
    res.status(400).json({
      code: "WEIGHT_OUT_OF_RANGE",
      message: error instanceof Error ? error.message : "Unsupported weight.",
      requestId: req.id,
    });
  }
});

router.get("/admin/rates", requireAdmin, async (_req, res): Promise<void> => {
  const rates = await db
    .select()
    .from(serviceRatesTable)
    .orderBy(serviceRatesTable.code, desc(serviceRatesTable.version));
  res.json({ items: rates });
});

router.post("/admin/rates", requireAdmin, async (req, res): Promise<void> => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message,
      fieldErrors: parsed.error.flatten().fieldErrors,
      requestId: req.id,
    });
    return;
  }
  const created = await db.transaction(async (tx) => {
    const [latest] = await tx
      .select()
      .from(serviceRatesTable)
      .where(eq(serviceRatesTable.code, parsed.data.code))
      .orderBy(desc(serviceRatesTable.version))
      .limit(1);
    await tx
      .update(serviceRatesTable)
      .set({ active: false, retiredAt: new Date() })
      .where(
        and(
          eq(serviceRatesTable.code, parsed.data.code),
          eq(serviceRatesTable.active, true),
        ),
      );
    const [rate] = await tx
      .insert(serviceRatesTable)
      .values({
        ...parsed.data,
        version: (latest?.version ?? 0) + 1,
        active: true,
        createdBy: req.session.userId,
      })
      .returning();
    await tx.insert(auditEventsTable).values({
      actorId: req.session.userId,
      action: "rate.version_created",
      entityType: "service_rate",
      entityId: String(rate!.id),
      metadata: { code: rate!.code, version: rate!.version },
    });
    return rate!;
  });
  res.status(201).json(created);
});

router.patch(
  "/admin/rates/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const parsed = z.object({ active: z.boolean() }).safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "A valid rate and active flag are required.",
        requestId: req.id,
      });
      return;
    }
    const [rate] = await db
      .update(serviceRatesTable)
      .set({
        active: parsed.data.active,
        retiredAt: parsed.data.active ? null : new Date(),
      })
      .where(eq(serviceRatesTable.id, id))
      .returning();
    if (!rate) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Rate not found.",
        requestId: req.id,
      });
      return;
    }
    await db.insert(auditEventsTable).values({
      actorId: req.session.userId,
      action: "rate.activation_changed",
      entityType: "service_rate",
      entityId: String(id),
      metadata: { active: parsed.data.active },
    });
    res.json(rate);
  },
);

export default router;
