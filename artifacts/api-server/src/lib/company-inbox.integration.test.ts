import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

test(
  "contact, guest chat, quotes, and newsletter signup reach the info inbox durably",
  {
    skip: !process.env.DATABASE_URL,
  },
  async (t) => {
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET =
      "inbox-test-session-secret-at-least-32-characters";
    process.env.APP_ORIGIN = "http://127.0.0.1:5173";
    process.env.SMTP_USER = "local-test-only";
    process.env.SMTP_PASS = "local-test-only";
    process.env.FROM_EMAIL = "info@shiprion.com";
    process.env.SUPPORT_EMAIL = "obsolete@example.com";
    process.env.LOG_LEVEL = "silent";
    type Mail = { to: string; subject: string; html: string; replyTo: string };
    const delivered: Mail[] = [];
    let rejectSmtp = false;
    t.mock.method(
      nodemailer,
      "createTransport",
      (_options: unknown, defaults: Partial<Mail>) => ({
        sendMail: async (mail: Mail) => {
          if (rejectSmtp) throw new Error("Simulated SMTP outage");
          delivered.push({ ...defaults, ...mail });
        },
      }),
    );
    const { migrateDatabase, pool } = await import("@workspace/db");
    await migrateDatabase();
    const { default: app } = await import("../app");
    const { sessionStore } = await import("./session-store");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const suffix = `inbox-${Date.now()}`;
    const email = `${suffix}@example.com`;
    const retryEmail = `retry-${email}`;
    let chatId: number | undefined;
    let rateId: number | undefined;
    let customerId: number | undefined;
    const rateKeys = [
      "newsletter",
      "contact",
      "guest-chat-session",
      "guest-chat-message",
      "quote-submit",
    ].map((name) =>
      createHash("sha256").update(`${name}:ip:127.0.0.2`).digest("hex"),
    );
    const post = (path: string, body: unknown, extraHeaders = {}) =>
      fetch(base + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: process.env.APP_ORIGIN!,
          "x-forwarded-for": "127.0.0.2",
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      });
    try {
      await pool.query("DELETE FROM rate_limits WHERE key=ANY($1::text[])", [
        rateKeys,
      ]);
      const contact = await post("/contact", {
        name: "Inbox test",
        email,
        message: `${suffix} <script>test</script>`,
      });
      assert.equal(contact.status, 201);
      const contactMail = delivered.find(
        (mail) =>
          mail.to === "info@shiprion.com" &&
          mail.subject.includes("Contact request"),
      );
      assert.ok(contactMail?.html.includes("&lt;script&gt;"));
      assert.ok(
        delivered.some(
          (mail) =>
            mail.to === email && mail.subject.includes("received your message"),
        ),
      );
      const signup = await post("/newsletter/subscriptions", { email });
      assert.equal(signup.status, 200);
      assert.equal(
        (await post("/newsletter/subscriptions", { email })).status,
        200,
      );
      assert.equal(
        delivered.filter(
          (mail) =>
            mail.subject.includes("newsletter signup") &&
            mail.html.includes(email),
        ).length,
        1,
      );

      const guestResponse = await post("/chat/guest-sessions", {
        guestName: "Inbox guest",
        guestEmail: email,
      });
      assert.equal(guestResponse.status, 201);
      const guest = (await guestResponse.json()) as {
        session: { id: number };
        guestToken: string;
      };
      chatId = guest.session.id;
      assert.equal(
        (
          await post(
            `/chat/guest-sessions/${chatId}/messages`,
            { content: `${suffix} guest message` },
            { "x-guest-token": guest.guestToken },
          )
        ).status,
        201,
      );
      assert.ok(
        delivered.some(
          (mail) =>
            mail.to === "info@shiprion.com" &&
            mail.subject.includes("Guest message"),
        ),
      );

      const password = "Inbox-Test-Password!123";
      const customer = await pool.query<{ id: number }>(
        "INSERT INTO users(email,password_hash,email_verified) VALUES($1,$2,true) RETURNING id",
        [`customer-${email}`, await bcrypt.hash(password, 4)],
      );
      customerId = customer.rows[0]!.id;
      const login = await post("/auth/login", {
        email: `customer-${email}`,
        password,
      });
      assert.equal(login.status, 200);
      const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
      const conversation = await post("/chat/sessions", {}, { cookie });
      assert.equal(conversation.status, 201);
      const conversationBody = (await conversation.json()) as { id: number };
      const customerMessage = await post(
        `/chat/sessions/${conversationBody.id}/messages`,
        { content: `${suffix} customer message` },
        { cookie },
      );
      assert.equal(customerMessage.status, 201);
      assert.ok(
        delivered.some(
          (mail) =>
            mail.to === "info@shiprion.com" &&
            mail.html.includes("customer message"),
        ),
      );

      const rate = await pool.query<{ id: number }>(
        "INSERT INTO service_rates(code,name,base_fee_cents,per_kg_cents) VALUES($1,$1,100,100) RETURNING id",
        [suffix],
      );
      rateId = rate.rows[0]!.id;
      const quote = await post("/quotes", {
        serviceCode: suffix,
        contactName: "Inbox quote",
        contactEmail: email,
        origin: "Nairobi",
        destination: "Mombasa",
        cargoType: "Parcel",
        weightKg: 2,
        notes: `${suffix} quote notes`,
      });
      assert.equal(quote.status, 201);
      assert.ok(
        delivered.some(
          (mail) =>
            mail.to === "info@shiprion.com" &&
            mail.subject.includes("New quote request") &&
            mail.html.includes("quote notes"),
        ),
      );
      assert.ok(
        delivered.every((mail) => mail.replyTo === "info@shiprion.com"),
      );

      // Saving the subscription and queueing its notice must succeed together.
      await pool.query(
        `ALTER TABLE email_outbox ADD CONSTRAINT inbox_test_reject CHECK (html NOT LIKE '%${retryEmail}%')`,
      );
      assert.equal(
        (await post("/newsletter/subscriptions", { email: retryEmail })).status,
        500,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT id FROM newsletter_subscriptions WHERE email=$1",
            [retryEmail],
          )
        ).rowCount,
        0,
      );
      await pool.query(
        "ALTER TABLE email_outbox DROP CONSTRAINT inbox_test_reject",
      );
      rejectSmtp = true;
      assert.equal(
        (await post("/newsletter/subscriptions", { email: retryEmail })).status,
        200,
      );
      const queued = await pool.query<{
        to_email: string;
        status: string;
        attempts: number;
      }>(
        "SELECT to_email,status,attempts FROM email_outbox WHERE html LIKE $1",
        [`%${retryEmail}%`],
      );
      assert.equal(queued.rows.length, 1);
      assert.equal(queued.rows[0]!.to_email, "info@shiprion.com");
      assert.equal(queued.rows[0]!.status, "pending");
      assert.equal(queued.rows[0]!.attempts, 1);
    } finally {
      await pool.query(
        "ALTER TABLE email_outbox DROP CONSTRAINT IF EXISTS inbox_test_reject",
      );
      await pool.query(
        "DELETE FROM email_outbox WHERE html LIKE $1 OR to_email=$2",
        [`%${suffix}%`, email],
      );
      await pool.query(
        "DELETE FROM newsletter_subscriptions WHERE email=ANY($1::text[])",
        [[email, retryEmail]],
      );
      await pool.query("DELETE FROM contact_messages WHERE email=$1", [email]);
      if (chatId)
        await pool.query("DELETE FROM chat_sessions WHERE id=$1", [chatId]);
      await pool.query("DELETE FROM auth_tokens WHERE email=$1", [email]);
      await pool.query("DELETE FROM quotes WHERE contact_email=$1", [email]);
      if (rateId)
        await pool.query("DELETE FROM service_rates WHERE id=$1", [rateId]);
      if (customerId)
        await pool.query("DELETE FROM users WHERE id=$1", [customerId]);
      await pool.query("DELETE FROM rate_limits WHERE key=ANY($1::text[])", [
        rateKeys,
      ]);
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await sessionStore.close();
      await pool.end();
    }
  },
);
