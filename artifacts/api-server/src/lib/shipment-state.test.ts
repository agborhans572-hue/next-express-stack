import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionShipment } from "./shipment-state";

test("shipment state machine permits the operational happy path", () => {
  assert.equal(canTransitionShipment("pending", "picked_up"), true);
  assert.equal(canTransitionShipment("picked_up", "in_transit"), true);
  assert.equal(canTransitionShipment("in_transit", "customs"), true);
  assert.equal(canTransitionShipment("customs", "out_for_delivery"), true);
  assert.equal(canTransitionShipment("out_for_delivery", "delivered"), true);
});

test("terminal and skipped transitions are rejected", () => {
  assert.equal(canTransitionShipment("pending", "delivered"), false);
  assert.equal(canTransitionShipment("delivered", "in_transit"), false);
  assert.equal(canTransitionShipment("cancelled", "pending"), false);
});
