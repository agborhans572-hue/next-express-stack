import assert from "node:assert/strict";
import test from "node:test";
import { newsletterBody } from "./newsletter";

test("newsletter addresses are normalized before uniqueness is enforced", () => {
  assert.deepEqual(newsletterBody.parse({ email: "  Reader@Example.COM  " }), {
    email: "reader@example.com",
  });
});

test("newsletter rejects malformed, missing, and oversized addresses", () => {
  for (const body of [
    {},
    { email: "" },
    { email: "invalid" },
    { email: "a".repeat(255) + "@example.com" },
  ]) {
    assert.equal(newsletterBody.safeParse(body).success, false);
  }
});
