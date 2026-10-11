import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

test(
  "newsletter HTTP validation, persistence, retries, origins, and rate limiting",
  { skip: !process.env.DATABASE_URL },
  async () => {
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET ??=
      "newsletter-integration-session-secret-longer-than-32";
    process.env.APP_ORIGIN ??= "http://127.0.0.1:5173";
    const { migrateDatabase, pool } = await import("@workspace/db");
    await migrateDatabase();
    const { default: app } = await import("../app");
    const { sessionStore } = await import("./session-store");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const endpoint = `http://127.0.0.1:${address.port}/api/newsletter/subscriptions`;
    const email = `newsletter-http-${Date.now()}@example.com`;
    const failureEmail = `newsletter-failure-${Date.now()}@example.com`;
    const constraint = `newsletter_test_failure_${Date.now()}`;
    const post = (body: unknown, origin = process.env.APP_ORIGIN!) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify(body),
      });
    // Scope cleanup to the test IP's newsletter bucket; other rate limits stay intact.
    const { createHash } = await import("node:crypto");
    const key = createHash("sha256")
      .update("newsletter:ip:127.0.0.1")
      .digest("hex");
    try {
      await pool.query("DELETE FROM rate_limits WHERE key=$1", [key]);
      const invalid = await post({ email: "invalid" });
      assert.equal(invalid.status, 400);
      const crossOrigin = await post({ email }, "https://untrusted.example");
      assert.equal(crossOrigin.ok, false);
      const first = await post({ email: `  ${email.toUpperCase()}  ` });
      assert.equal(first.status, 200);
      assert.deepEqual(await first.json(), { subscribed: true });
      const duplicate = await post({ email });
      assert.equal(duplicate.status, 200);
      const saved = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM newsletter_subscriptions WHERE email=$1",
        [email],
      );
      assert.equal(saved.rows[0]?.count, "1");
      await post({ email });
      await post({ email });
      const limited = await post({ email: `blocked-${email}` });
      assert.equal(limited.status, 429);
      assert.equal(limited.headers.get("ratelimit-remaining"), "0");
      const blocked = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM newsletter_subscriptions WHERE email=$1",
        [`blocked-${email}`],
      );
      assert.equal(blocked.rows[0]?.count, "0");
      await pool.query("DELETE FROM rate_limits WHERE key=$1", [key]);
      // A narrowly scoped database rejection proves that HTTP success follows persistence.
      await pool.query(
        `ALTER TABLE newsletter_subscriptions ADD CONSTRAINT ${constraint} CHECK (email <> '${failureEmail}')`,
      );
      const failure = await post({ email: failureEmail });
      assert.equal(failure.status, 500);
      const unsaved = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM newsletter_subscriptions WHERE email=$1",
        [failureEmail],
      );
      assert.equal(unsaved.rows[0]?.count, "0");
      await pool.query(
        `ALTER TABLE newsletter_subscriptions DROP CONSTRAINT ${constraint}`,
      );
      const retry = await post({ email: failureEmail });
      assert.equal(retry.status, 200);
    } finally {
      await pool.query(
        `ALTER TABLE newsletter_subscriptions DROP CONSTRAINT IF EXISTS ${constraint}`,
      );
      await pool.query(
        "DELETE FROM newsletter_subscriptions WHERE email=ANY($1::text[])",
        [[email, failureEmail]],
      );
      await pool.query("DELETE FROM rate_limits WHERE key=$1", [key]);
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await sessionStore.close();
      await pool.end();
    }
  },
);
