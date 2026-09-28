import { expect, test, type APIRequestContext } from "@playwright/test";

const fullStack = process.env.E2E_FULL === "true";
const origin = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const stateChangingHeaders = { Origin: origin };

async function json<T>(
  response: Awaited<ReturnType<APIRequestContext["get"]>>,
): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json() as Promise<T>;
}

test("public navigation, quote, tracking, and account screens render without console failures", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Track Order/i }).first(),
  ).toBeVisible();

  await page.goto("/calculator?origin=Nairobi&destination=Mombasa&weight=10");
  await expect(
    page.getByRole("heading", { name: "Plan your shipment" }),
  ).toBeVisible();
  await expect(
    page.locator('input[placeholder="City, country"]').first(),
  ).toHaveValue("Nairobi");

  await page.goto("/track");
  await expect(
    page.getByRole("button", { name: /Track/i }).first(),
  ).toBeVisible();

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("guest quote claim, staff conversion, tracking, notifications, POD, recovery, support, and access revocation", async ({
  browser,
  page,
}) => {
  test.skip(
    !fullStack,
    "Set E2E_FULL=true to run the PostgreSQL-backed lifecycle suite.",
  );

  const unique = `${Date.now()}-${test.info().workerIndex}`;
  const customerEmail = `e2e-${unique}@example.test`;
  const customerPassword = "Customer-Test-Password!1";
  const newPassword = "Customer-New-Password!2";

  await page.goto("/calculator");
  await expect(
    page.getByRole("button", { name: /business days/i }).first(),
  ).toBeVisible();
  const routeInputs = page.locator('input[placeholder="City, country"]');
  await routeInputs.nth(0).fill("Nairobi, Kenya");
  await routeInputs.nth(1).fill("Mombasa, Kenya");
  await page.locator('input[type="number"]').fill("12.5");
  await page.getByRole("button", { name: "Calculate estimate" }).click();
  await expect(page.getByText("Contact and cargo notes")).toBeVisible();
  const formInputs = page.locator("main section input");
  await formInputs.nth(3).fill("E2E Customer");
  await formInputs.nth(4).fill(customerEmail);

  const quoteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/quotes") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send quote request" }).click();
  const quoteResponse = await quoteResponsePromise;
  const submitted = await json<{
    id: number;
    reference: string;
    devClaimToken?: string;
  }>(quoteResponse);
  expect(submitted.devClaimToken).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: "Quote request received" }),
  ).toBeVisible();

  const registration = await page.context().request.post("/api/auth/register", {
    headers: stateChangingHeaders,
    data: {
      email: customerEmail,
      password: customerPassword,
      fullName: "E2E Customer",
    },
  });
  const registrationBody = await json<{ devCode?: string }>(registration);
  expect(registrationBody.devCode).toMatch(/^\d{6}$/);
  await json(
    await page.context().request.post("/api/auth/verify-email", {
      headers: stateChangingHeaders,
      data: { email: customerEmail, code: registrationBody.devCode },
    }),
  );

  await page.goto(
    `/claim-quote?token=${encodeURIComponent(submitted.devClaimToken!)}`,
  );
  await expect(
    page.getByRole("heading", { name: "Quote added to your account" }),
  ).toBeVisible();

  const adminContext = await browser.newContext({ baseURL: origin });
  const admin = adminContext.request;
  await json(
    await admin.post("/api/auth/login", {
      headers: stateChangingHeaders,
      data: {
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.SEED_ADMIN_PASSWORD ?? "Admin-E2E-Password!1",
      },
    }),
  );
  await json(
    await admin.patch(`/api/quotes/${submitted.id}/review`, {
      headers: stateChangingHeaders,
    }),
  );
  await json(
    await admin.post(`/api/quotes/${submitted.id}/offer`, {
      headers: stateChangingHeaders,
      data: { finalPriceCents: 24_500, validDays: 14 },
    }),
  );

  await page.goto("/dashboard?section=quotes");
  await expect(page.getByText(submitted.reference)).toBeVisible();
  await page.getByRole("button", { name: "Accept offer" }).click();
  await expect(page.getByText(/^accepted$/i)).toBeVisible();

  const shipment = await json<{ id: number; trackingNumber: string }>(
    await admin.post(`/api/quotes/${submitted.id}/convert`, {
      headers: stateChangingHeaders,
      data: {
        recipientName: "Receiving Desk",
        recipientEmail: customerEmail,
        recipientAddress: "Mombasa, Kenya",
      },
    }),
  );

  const customerShipments = await json<{ items: Array<{ id: number }> }>(
    await page.context().request.get("/api/shipments"),
  );
  expect(
    customerShipments.items.some((item) => item.id === shipment.id),
  ).toBeTruthy();
  const forbiddenCreate = await page.context().request.post("/api/shipments", {
    headers: stateChangingHeaders,
    data: {},
  });
  expect(forbiddenCreate.status()).toBe(403);
  expect((await page.context().request.get("/api/users")).status()).toBe(403);

  for (const status of [
    "picked_up",
    "in_transit",
    "customs",
    "in_transit",
    "out_for_delivery",
  ]) {
    await json(
      await admin.patch(`/api/shipments/${shipment.id}`, {
        headers: stateChangingHeaders,
        data: { status, location: "Nairobi Logistics Hub" },
      }),
    );
  }

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZcWQAAAAASUVORK5CYII=",
    "base64",
  );
  const presigned = await json<{ objectKey: string; uploadUrl: string }>(
    await admin.post("/api/uploads/presign", {
      headers: stateChangingHeaders,
      data: {
        shipmentId: shipment.id,
        fileName: "delivery.png",
        contentType: "image/png",
        size: png.length,
      },
    }),
  );
  const upload = await admin.put(presigned.uploadUrl, {
    headers: { "Content-Type": "image/png" },
    data: png,
  });
  expect(upload.ok(), await upload.text()).toBeTruthy();
  await json(
    await admin.post(`/api/shipments/${shipment.id}/proof-of-delivery`, {
      headers: stateChangingHeaders,
      data: {
        recipientName: "Receiving Desk",
        deliveredAt: new Date().toISOString(),
        notes: "Received in good condition.",
        objectKey: presigned.objectKey,
        originalFileName: "delivery.png",
        contentType: "image/png",
        fileSize: png.length,
      },
    }),
  );
  const proof = await json<{ downloadUrl: string }>(
    await page
      .context()
      .request.get(`/api/shipments/${shipment.id}/proof-of-delivery`),
  );
  expect(
    (await page.context().request.get(proof.downloadUrl)).ok(),
  ).toBeTruthy();

  const notifications = await json<{ items: Array<{ type: string }> }>(
    await page.context().request.get("/api/notifications?pageSize=100"),
  );
  expect(
    notifications.items.some((item) => item.type === "shipment_delivered"),
  ).toBeTruthy();

  const publicContext = await browser.newContext({ baseURL: origin });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`/track/${shipment.trackingNumber}`);
  await expect(publicPage.getByText(/^delivered$/i).first()).toBeVisible();
  await expect(publicPage.locator("body")).not.toContainText(customerEmail);

  const forgot = await json<{ devResetToken?: string }>(
    await page.context().request.post("/api/auth/forgot-password", {
      headers: stateChangingHeaders,
      data: { email: customerEmail },
    }),
  );
  expect(forgot.devResetToken).toBeTruthy();
  await page.context().request.post("/api/auth/reset-password", {
    headers: stateChangingHeaders,
    data: { token: forgot.devResetToken, password: newPassword },
  });
  await json(
    await page.context().request.post("/api/auth/login", {
      headers: stateChangingHeaders,
      data: { email: customerEmail, password: newPassword },
    }),
  );

  const contact = await json<{ id: number }>(
    await publicPage.context().request.post("/api/contact", {
      headers: stateChangingHeaders,
      data: {
        name: "E2E Contact",
        email: customerEmail,
        message: "Please check this shipment.",
      },
    }),
  );
  const contacts = await json<{ items: Array<{ id: number }> }>(
    await admin.get("/api/contact"),
  );
  expect(contacts.items.some((item) => item.id === contact.id)).toBeTruthy();
  await json(
    await admin.patch(`/api/contact/${contact.id}`, {
      headers: stateChangingHeaders,
      data: { status: "closed" },
    }),
  );

  const guestChat = await json<{
    session: { id: number };
    guestToken: string;
  }>(
    await publicPage.context().request.post("/api/chat/guest-sessions", {
      headers: stateChangingHeaders,
      data: { guestName: "E2E Guest", guestEmail: customerEmail },
    }),
  );
  await json(
    await publicPage
      .context()
      .request.post(
        `/api/chat/guest-sessions/${guestChat.session.id}/messages`,
        {
          headers: {
            ...stateChangingHeaders,
            "X-Guest-Token": guestChat.guestToken,
          },
          data: { content: "I need a delivery update." },
        },
      ),
  );
  const chats = await json<Array<{ id: number }>>(
    await admin.get("/api/chat/sessions"),
  );
  expect(chats.some((chat) => chat.id === guestChat.session.id)).toBeTruthy();
  await json(
    await admin.post(`/api/chat/sessions/${guestChat.session.id}/messages`, {
      headers: stateChangingHeaders,
      data: { content: "Your delivery has been completed." },
    }),
  );

  const me = await json<{ id: number }>(
    await page.context().request.get("/api/auth/me"),
  );
  await json(
    await admin.patch(`/api/users/${me.id}`, {
      headers: stateChangingHeaders,
      data: { status: "banned" },
    }),
  );
  expect((await page.context().request.get("/api/shipments")).status()).toBe(
    401,
  );

  await publicContext.close();
  await adminContext.close();
});
