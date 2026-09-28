import assert from "node:assert/strict";
import test from "node:test";

test(
  "PostgreSQL production invariants",
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const { migrateDatabase, pool } = await import("@workspace/db");
    await migrateDatabase();
    const client = await pool.connect();
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      await t.test("migrations create the operational tables", async () => {
        const result = await client.query<{ tableName: string | null }>(
          "SELECT to_regclass('public.quotes')::text AS \"tableName\"",
        );
        assert.equal(result.rows[0]?.tableName, "quotes");
        const socketTable = await client.query<{ tableName: string | null }>(
          "SELECT to_regclass('public.socket_io_attachments')::text AS \"tableName\"",
        );
        assert.equal(socketTable.rows[0]?.tableName, "socket_io_attachments");
      });

      await client.query("BEGIN");
      const userA = await client.query<{ id: number }>(
        "INSERT INTO users(email,password_hash,role,status,email_verified) VALUES ($1,'hash','customer','active',true) RETURNING id",
        [`a-${suffix}@example.com`],
      );
      const userB = await client.query<{ id: number }>(
        "INSERT INTO users(email,password_hash,role,status,email_verified) VALUES ($1,'hash','customer','active',true) RETURNING id",
        [`b-${suffix}@example.com`],
      );
      const a = userA.rows[0]!.id;
      const b = userB.rows[0]!.id;
      const rate = await client.query<{ id: number }>(
        "INSERT INTO service_rates(code,name,description,version,base_fee_cents,per_kg_cents,fuel_pct,min_weight_kg,max_weight_kg,transit_days_min,transit_days_max,active) VALUES ($1,'Test','','1',100,10,0,0.1,100,1,2,true) RETURNING id",
        [`test-${suffix}`],
      );
      const quote = await client.query<{ id: number }>(
        "INSERT INTO quotes(reference,customer_id,contact_name,contact_email,origin,destination,cargo_type,weight_kg,service_rate_id,rate_snapshot,estimated_price_cents,status) VALUES ($1,$2,'A',$3,'Nairobi','Mombasa','General',1,$4,$5,110,'accepted') RETURNING id",
        [
          `Q-${suffix}`,
          a,
          `a-${suffix}@example.com`,
          rate.rows[0]!.id,
          JSON.stringify({
            code: "test",
            name: "Test",
            version: 1,
            baseFeeCents: 100,
            perKgCents: 10,
            fuelPct: 0,
            weightKg: 1,
          }),
        ],
      );
      const sourceQuoteId = quote.rows[0]!.id;
      const shipmentA = await client.query<{ id: number }>(
        "INSERT INTO shipments(tracking_number,sender_id,customer_id,source_quote_id,recipient_name,origin,destination,status) VALUES ($1,$2,$2,$3,'Recipient','Nairobi','Mombasa','pending') RETURNING id",
        [`SHP-TEST-${suffix}-A`, a, sourceQuoteId],
      );
      await client.query(
        "INSERT INTO shipments(tracking_number,sender_id,customer_id,recipient_name,origin,destination,status) VALUES ($1,$2,$2,'Recipient','Kisumu','Nakuru','pending')",
        [`SHP-TEST-${suffix}-B`, b],
      );

      await t.test("customer ownership queries are isolated", async () => {
        const owned = await client.query<{ customerId: number }>(
          'SELECT customer_id AS "customerId" FROM shipments WHERE customer_id = $1',
          [a],
        );
        assert.ok(owned.rows.length >= 1);
        assert.ok(owned.rows.every((row) => row.customerId === a));
      });

      await t.test(
        "quote conversion is unique and idempotent at the database boundary",
        async () => {
          await client.query("SAVEPOINT duplicate_conversion");
          await assert.rejects(
            client.query(
              "INSERT INTO shipments(tracking_number,customer_id,source_quote_id,recipient_name,origin,destination,status) VALUES ($1,$2,$3,'Recipient','Nairobi','Mombasa','pending')",
              [`SHP-TEST-${suffix}-DUP`, a, sourceQuoteId],
            ),
            (error: unknown) =>
              Boolean(
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "23505",
              ),
          );
          await client.query("ROLLBACK TO SAVEPOINT duplicate_conversion");
        },
      );

      await t.test(
        "status, tracking, and notification writes commit together",
        async () => {
          await client.query("SAVEPOINT status_update");
          await client.query(
            "UPDATE shipments SET status = 'picked_up' WHERE id = $1",
            [shipmentA.rows[0]!.id],
          );
          await client.query(
            "INSERT INTO tracking_events(shipment_id,location,status,description) VALUES ($1,'Nairobi','picked_up','Collected')",
            [shipmentA.rows[0]!.id],
          );
          await client.query(
            "INSERT INTO notifications(user_id,type,title,message) VALUES ($1,'shipment_status','Updated','Collected')",
            [a],
          );
          const result = await client.query<{
            events: number;
            notifications: number;
          }>(
            "SELECT (SELECT count(*)::int FROM tracking_events WHERE shipment_id = $1) AS events, (SELECT count(*)::int FROM notifications WHERE user_id = $2) AS notifications",
            [shipmentA.rows[0]!.id, a],
          );
          assert.equal(result.rows[0]!.events, 1);
          assert.equal(result.rows[0]!.notifications, 1);
          await client.query("ROLLBACK TO SAVEPOINT status_update");
        },
      );

      await t.test(
        "pagination and session revocation are database-backed",
        async () => {
          const page = await client.query(
            "SELECT id FROM shipments WHERE customer_id IN ($1,$2) ORDER BY id LIMIT 1 OFFSET 0",
            [a, b],
          );
          assert.equal(page.rows.length, 1);
          await client.query(
            "INSERT INTO user_sessions(sid,sess,expire) VALUES ($1,$2,now() + interval '1 hour')",
            [`sid-${suffix}`, JSON.stringify({ userId: a })],
          );
          await client.query(
            "DELETE FROM user_sessions WHERE (sess->>'userId')::int = $1",
            [a],
          );
          const sessions = await client.query<{ count: number }>(
            "SELECT count(*)::int AS count FROM user_sessions WHERE sid = $1",
            [`sid-${suffix}`],
          );
          assert.equal(sessions.rows[0]!.count, 0);
        },
      );
      await client.query("ROLLBACK");

      await t.test(
        "outbox workers can claim different rows with SKIP LOCKED",
        async () => {
          const inserted = await pool.query<{ id: number }>(
            "INSERT INTO email_outbox(to_email,subject,html) VALUES ($1,'test','test'),($2,'test','test') RETURNING id",
            [
              `outbox-a-${suffix}@example.com`,
              `outbox-b-${suffix}@example.com`,
            ],
          );
          const first = await pool.connect();
          const second = await pool.connect();
          try {
            await first.query("BEGIN");
            const locked = await first.query<{ id: number }>(
              "SELECT id FROM email_outbox WHERE id = $1 FOR UPDATE",
              [inserted.rows[0]!.id],
            );
            assert.equal(locked.rows.length, 1);
            await second.query("BEGIN");
            const available = await second.query<{ id: number }>(
              "SELECT id FROM email_outbox WHERE id = ANY($1::int[]) FOR UPDATE SKIP LOCKED",
              [inserted.rows.map((row) => row.id)],
            );
            assert.deepEqual(
              available.rows.map((row) => row.id),
              [inserted.rows[1]!.id],
            );
            await second.query("ROLLBACK");
            await first.query("ROLLBACK");
          } finally {
            first.release();
            second.release();
            await pool.query(
              "DELETE FROM email_outbox WHERE id = ANY($1::int[])",
              [inserted.rows.map((row) => row.id)],
            );
          }
        },
      );
    } finally {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* already closed */
      }
      client.release();
      await pool.end();
    }
  },
);
