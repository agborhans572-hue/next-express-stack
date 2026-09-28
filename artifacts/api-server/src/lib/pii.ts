export function redactShipmentForSupport<T extends Record<string, unknown>>(
  shipment: T,
): T {
  return {
    ...shipment,
    senderName: null,
    senderPhone: null,
    senderAddress: null,
    senderStreetAddress: null,
    senderHomeAddress: null,
    senderPostalCode: null,
    recipientName: "Restricted",
    recipientEmail: null,
    recipientPhone: null,
    recipientAddress: null,
    recipientStreetAddress: null,
    recipientHomeAddress: null,
    recipientPostalCode: null,
  };
}
