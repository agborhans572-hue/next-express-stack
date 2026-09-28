import type { ServiceRate } from "@workspace/db";

export interface PriceBreakdown {
  baseFeeCents: number;
  weightFeeCents: number;
  fuelSurchargeCents: number;
  totalCents: number;
  currency: "USD";
}

export function calculatePrice(
  rate: Pick<
    ServiceRate,
    "baseFeeCents" | "perKgCents" | "fuelPct" | "minWeightKg" | "maxWeightKg"
  >,
  weightKg: number,
): PriceBreakdown {
  if (
    !Number.isFinite(weightKg) ||
    weightKg < rate.minWeightKg ||
    weightKg > rate.maxWeightKg
  ) {
    throw new RangeError(
      `Weight must be between ${rate.minWeightKg} kg and ${rate.maxWeightKg} kg.`,
    );
  }
  const weightFeeCents = Math.round(rate.perKgCents * weightKg);
  const subtotal = rate.baseFeeCents + weightFeeCents;
  const fuelSurchargeCents = Math.round(subtotal * (rate.fuelPct / 100));
  return {
    baseFeeCents: rate.baseFeeCents,
    weightFeeCents,
    fuelSurchargeCents,
    totalCents: subtotal + fuelSurchargeCents,
    currency: "USD",
  };
}

export function generateQuoteReference(
  now = new Date(),
  entropy = crypto.randomUUID().slice(0, 6),
): string {
  return `Q-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${entropy.toUpperCase()}`;
}

export function generateTrackingNumber(
  now = new Date(),
  entropy = crypto.randomUUID().replaceAll("-", "").slice(0, 6),
): string {
  return `SHP-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${entropy.toUpperCase()}`;
}
