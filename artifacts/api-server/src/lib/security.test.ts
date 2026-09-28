import assert from "node:assert/strict";
import test from "node:test";
import {
  createOpaqueToken,
  hashToken,
  isTokenActive,
  safeTokenEqual,
} from "./security";

test("opaque tokens are stored and compared as hashes", () => {
  const { token, hash } = createOpaqueToken();
  assert.notEqual(token, hash);
  assert.equal(hash, hashToken(token));
  assert.equal(safeTokenEqual(token, hash), true);
  assert.equal(safeTokenEqual(`${token}x`, hash), false);
});

test("token activity rejects used and expired tokens", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  assert.equal(
    isTokenActive(new Date("2026-09-28T12:01:00Z"), null, now),
    true,
  );
  assert.equal(
    isTokenActive(new Date("2026-09-28T11:59:00Z"), null, now),
    false,
  );
  assert.equal(
    isTokenActive(new Date("2026-09-28T12:01:00Z"), now, now),
    false,
  );
});
