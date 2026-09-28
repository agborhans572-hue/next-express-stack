export function shipmentStatusNotification(
  trackingNumber: string,
  status: string,
) {
  return {
    type: "shipment_status",
    title: "Shipment status updated",
    message: `${trackingNumber} is now ${status.replaceAll("_", " ")}.`,
    href: `/track/${trackingNumber}`,
  } as const;
}
