export interface ShipmentRealtimePayload {
  shipmentId: number;
  trackingNumber: string;
  status?: string;
  trigger?: "status_change" | "tracking_event";
}

export interface NotificationRealtimePayload {
  id?: number;
  type: string;
  title?: string;
  message?: string;
  href?: string | null;
  quoteId?: number;
  readAt?: Date | string | null;
  createdAt?: Date | string;
}

export interface ChatMessageRealtimePayload {
  id: number;
  sessionId: number;
  senderId: number | null;
  senderRole: string;
  content: string;
  createdAt: Date | string;
}

export interface ChatSessionRealtimePayload {
  id: number;
  userId: number | null;
  userEmail: string;
  guestName?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ServerToClientEvents {
  shipmentUpdated: (payload: ShipmentRealtimePayload) => void;
  shipmentCreated: (payload: ShipmentRealtimePayload) => void;
  shipmentDeleted: (payload: { shipmentId: number }) => void;
  "notification:new": (payload: NotificationRealtimePayload) => void;
  "quote:created": (payload: { id: number; reference: string }) => void;
  "quote:accepted": (payload: { id: number; reference: string }) => void;
  "chat:new_session": (payload: ChatSessionRealtimePayload) => void;
  "chat:message": (payload: ChatMessageRealtimePayload) => void;
  "chat:closed": (payload: { sessionId: number }) => void;
  contactMessageCreated: (payload: { id: number }) => void;
  usersUpdated: (payload: { id: number }) => void;
}

export interface ClientToServerEvents {
  "join:shipment": (trackingNumber: string) => void;
  "join:admin": () => void;
  "join:chat": (chatSessionId: number) => void;
  "join:guest-chat": (payload: {
    sessionId: number;
    guestToken: string;
  }) => void;
}
