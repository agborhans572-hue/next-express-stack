import assert from "node:assert/strict";
import test from "node:test";
import { hasCapability, hasAnyRole } from "./permissions";

test("roles expose only their documented capabilities", () => {
  assert.equal(hasCapability("admin", "manage_users"), true);
  assert.equal(hasCapability("operator", "operate_shipments"), true);
  assert.equal(hasCapability("operator", "manage_rates"), false);
  assert.equal(hasCapability("support", "handle_support"), true);
  assert.equal(hasCapability("support", "operate_shipments"), false);
  assert.equal(hasCapability("customer", "read_owned_records"), true);
  assert.equal(hasCapability("customer", "handle_support"), false);
  assert.equal(hasAnyRole("operator", ["admin", "operator"]), true);
});
