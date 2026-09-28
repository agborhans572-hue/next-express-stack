import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePrice,
  generateQuoteReference,
  generateTrackingNumber,
} from "./pricing";

test("pricing uses integer cents for base, weight, and fuel", () => {
  assert.deepEqual(
    calculatePrice(
      {
        baseFeeCents: 599,
        perKgCents: 250,
        fuelPct: 8,
        minWeightKg: 0.1,
        maxWeightKg: 100,
      },
      2,
    ),
    {
      baseFeeCents: 599,
      weightFeeCents: 500,
      fuelSurchargeCents: 88,
      totalCents: 1187,
      currency: "USD",
    },
  );
});

test("pricing rejects unsupported weights", () => {
  assert.throws(
    () =>
      calculatePrice(
        {
          baseFeeCents: 0,
          perKgCents: 0,
          fuelPct: 0,
          minWeightKg: 1,
          maxWeightKg: 5,
        },
        0.5,
      ),
    RangeError,
  );
});

test("references use canonical formats", () => {
  const date = new Date("2026-09-28T00:00:00Z");
  assert.equal(generateTrackingNumber(date, "abc123"), "SHP-20260928-ABC123");
  assert.equal(generateQuoteReference(date, "def456"), "Q-20260928-DEF456");
});
