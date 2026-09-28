const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export interface ApiProblem {
  code?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public problem: ApiProblem | null,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as
    | (T & ApiProblem)
    | null;
  if (!response.ok)
    throw new ApiRequestError(
      body?.message ?? body?.error ?? `Request failed (${response.status}).`,
      response.status,
      body,
    );
  return body as T;
}

export type UserRole = "customer" | "operator" | "support" | "admin";
export type UserStatus = "active" | "restricted" | "banned";
export interface UserRecord {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  company: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Shipment {
  id: number;
  trackingNumber: string;
  customerId: number | null;
  senderId: number | null;
  sourceQuoteId: number | null;
  priceCents: number | null;
  ownershipNeedsReview: boolean;
  senderName: string | null;
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  origin: string;
  destination: string;
  status: string;
  weightKg: number | null;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Quote {
  id: number;
  reference: string;
  customerId: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  origin: string;
  destination: string;
  cargoType: string;
  weightKg: number;
  serviceRateId: number;
  estimatedPriceCents: number;
  finalPriceCents: number | null;
  currency: string;
  status: string;
  validUntil: string | null;
  convertedShipmentId: number | null;
  createdAt: string;
  updatedAt: string;
}
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
export interface ServiceRate {
  id: number;
  code: string;
  name: string;
  description: string;
  version: number;
  baseFeeCents: number;
  perKgCents: number;
  fuelPct: number;
  minWeightKg: number;
  maxWeightKg: number;
  transitDaysMin: number;
  transitDaysMax: number;
  active: boolean;
  createdAt: string;
}
