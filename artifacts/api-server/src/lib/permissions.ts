export type ShiprionRole = "customer" | "operator" | "support" | "admin";
export type Capability =
  | "manage_users"
  | "manage_rates"
  | "operate_shipments"
  | "handle_support"
  | "read_owned_records";

const CAPABILITIES: Readonly<Record<ShiprionRole, readonly Capability[]>> = {
  admin: [
    "manage_users",
    "manage_rates",
    "operate_shipments",
    "handle_support",
    "read_owned_records",
  ],
  operator: ["operate_shipments", "read_owned_records"],
  support: ["handle_support", "read_owned_records"],
  customer: ["read_owned_records"],
};

export function hasCapability(
  role: ShiprionRole,
  capability: Capability,
): boolean {
  return CAPABILITIES[role].includes(capability);
}

export function hasAnyRole(
  role: ShiprionRole | undefined,
  allowed: readonly ShiprionRole[],
): boolean {
  return Boolean(role && allowed.includes(role));
}
