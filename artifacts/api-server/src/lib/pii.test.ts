import assert from "node:assert/strict";
import test from "node:test";
import { redactShipmentForSupport } from "./pii";

test("support shipment summaries redact customer and recipient PII", () => {
  const result = redactShipmentForSupport({
    id: 1,
    trackingNumber: "SHP-20260928-ABC123",
    senderName: "Sender",
    senderPhone: "+1",
    recipientName: "Recipient",
    recipientEmail: "recipient@example.com",
    destination: "Nairobi",
  });
  assert.equal(result.senderName, null);
  assert.equal(result.senderPhone, null);
  assert.equal(result.recipientName, "Restricted");
  assert.equal(result.recipientEmail, null);
  assert.equal(result.destination, "Nairobi");
});
