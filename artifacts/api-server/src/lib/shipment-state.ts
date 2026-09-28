export const SHIPMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> =
  {
    registered: ["pending", "picked_up", "cancelled"],
    pending: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "cancelled"],
    in_transit: [
      "customs",
      "on_hold_customs",
      "arrived_at_port",
      "out_for_delivery",
      "cancelled",
    ],
    customs: ["in_transit", "out_for_delivery", "cancelled"],
    on_hold_customs: ["in_transit", "arrived_at_port", "cancelled"],
    arrived_at_port: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };

export function canTransitionShipment(from: string, to: string): boolean {
  return from === to || Boolean(SHIPMENT_TRANSITIONS[from]?.includes(to));
}
