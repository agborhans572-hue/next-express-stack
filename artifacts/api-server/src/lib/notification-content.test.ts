import assert from "node:assert/strict";
import test from "node:test";
import { shipmentStatusNotification } from "./notification-content";

test("shipment status notifications contain a safe tracking link and readable status", () => {
  assert.deepEqual(
    shipmentStatusNotification("SHP-20260928-ABC123", "out_for_delivery"),
    {
      type: "shipment_status",
      title: "Shipment status updated",
      message: "SHP-20260928-ABC123 is now out for delivery.",
      href: "/track/SHP-20260928-ABC123",
    },
  );
});
