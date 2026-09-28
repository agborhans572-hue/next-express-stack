import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

export type ShipmentUpdatedPayload = {
  shipmentId: number;
  trackingNumber: string;
  status: string;
  trigger: "status_change" | "tracking_event";
};

/**
 * Subscribes to real-time `shipmentUpdated` Socket.IO events.
 *
 * When `trackingNumber` is provided the hook also emits `join:shipment` so the
 * client enters the room the server broadcasts to. Without it the hook still
 * listens globally (useful for the admin / dashboard views that handle many
 * shipments at once via the "admins" room).
 *
 * Pass a stable callback (wrap with useCallback if needed) to avoid
 * re-subscribing on every render.
 */
export function useShipmentUpdates(
  onUpdate: (payload: ShipmentUpdatedPayload) => void,
  trackingNumber?: string,
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!__SOCKET_IO_ENABLED__) return;
    const socket = getSocket();

    if (trackingNumber) {
      socket.emit("join:shipment", trackingNumber);
    }

    function handleUpdate(payload: ShipmentUpdatedPayload) {
      callbackRef.current(payload);
    }

    socket.on("shipmentUpdated", handleUpdate);

    return () => {
      socket.off("shipmentUpdated", handleUpdate);
    };
  }, [trackingNumber]);
}
