import { expect, test } from "@playwright/test";

const rate = {
  id: 1,
  code: "standard",
  name: "Standard Freight",
  description: "Reliable shipping for everyday cargo",
  baseFeeCents: 2500,
  perKgCents: 500,
  fuelPct: 10,
  minWeightKg: 0.1,
  maxWeightKg: 10000,
  transitDaysMin: 3,
  transitDaysMax: 7,
};
const estimate = {
  rate,
  breakdown: {
    baseFeeCents: 2500,
    weightFeeCents: 5000,
    fuelSurchargeCents: 750,
    totalCents: 8250,
    currency: "USD",
  },
};
const trackingNumber = "SHP-20261011-AB1234";
const shipment = {
  id: 42,
  trackingNumber,
  origin: "Nairobi, Kenya",
  destination: "Mombasa, Kenya",
  status: "in_transit",
  weightKg: 10,
  estimatedDelivery: "2026-10-15",
  createdAt: "2026-10-11T10:00:00Z",
  updatedAt: "2026-10-11T12:00:00Z",
  events: [
    {
      id: 1,
      shipmentId: 42,
      location: "Nairobi Logistics Hub",
      status: "picked_up",
      description: "Collected from sender",
      occurredAt: "2026-10-11T10:00:00Z",
      createdAt: "2026-10-11T10:00:00Z",
    },
    {
      id: 2,
      shipmentId: 42,
      location: "Nairobi, Kenya",
      status: "in_transit",
      description: "Shipment departed the logistics hub",
      occurredAt: "2026-10-11T12:00:00Z",
      createdAt: "2026-10-11T12:00:00Z",
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("cookieChoice", "rejected"),
  );
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  await page.route("**/api/rates", (route) =>
    route.fulfill({ json: { items: [rate] } }),
  );
});

test("original footer links are available on all marketing and shipping pages", async ({
  page,
}) => {
  const links = {
    Home: "/",
    "About Us": "/about",
    Services: "/services",
    "Track Package": "/track",
    "News & Insights": "/news",
    "Air Freight": "/services",
    "Road Freight": "/services",
    "Ocean Freight": "/services",
    "Rate Calculator": "/calculator",
    "Contact Us": "/contact",
    "Privacy Policy": "/privacy",
    "Terms & Conditions": "/terms",
    "Cookie Policy": "/cookies",
    "Shipping Policy": "/shipping-policy",
    "Insurance Policy": "/insurance-policy",
    FAQ: "/faq",
    "Create Account": "/login",
  };
  for (const path of [
    "/",
    "/about",
    "/tech",
    "/news",
    "/privacy",
    "/legal",
    "/track",
    "/calculator",
    "/contact",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const footer = page.locator("footer");
    for (const [name, href] of Object.entries(links))
      await expect(
        footer.getByRole("link", { name, exact: true }),
      ).toHaveAttribute("href", href);
    await expect(
      page.locator('header a[href="/track"]').first(),
    ).toBeAttached();
    await expect(
      page.locator('header a[href="/calculator"]').first(),
    ).toBeAttached();
    await expect(
      page.locator('header a[href="/contact"]').first(),
    ).toBeAttached();
  }
});

test("tracking search, direct URLs, history, and missing shipments retain their workflows", async ({
  page,
}) => {
  await page.route("**/api/track/**", (route) =>
    route.request().url().endsWith(trackingNumber)
      ? route.fulfill({ json: shipment })
      : route.fulfill({ status: 404, json: { message: "Shipment not found" } }),
  );
  await page.goto("/track");
  await page
    .getByLabel("Tracking number", { exact: true })
    .fill(trackingNumber.toLowerCase());
  await expect(page).toHaveURL(/\/track$/);
  await page.getByTestId("button-search-tracking").click();
  await expect(page).toHaveURL(new RegExp(`/track/${trackingNumber}$`));
  await expect(page.getByTestId("tracking-result")).toBeVisible();
  await expect(page.getByTestId("text-tracking-number")).toHaveText(
    trackingNumber,
  );
  await expect(page.getByTestId("badge-shipment-status")).toContainText(
    "En Route",
  );
  await expect(page.getByTestId("tracking-event-2")).toHaveText(
    "Shipment departed the logistics hub",
  );
  await page.reload();
  await expect(page.getByTestId("tracking-result")).toBeVisible();
  await page.getByLabel("Tracking number", { exact: true }).fill("SHP-UNKNOWN");
  await page.getByTestId("button-search-tracking").click();
  await expect(page.getByTestId("tracking-not-found")).toBeVisible();
  await page.getByTestId("button-retry-tracking").click();
  await expect(
    page.getByLabel("Tracking number", { exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Tracking number", { exact: true })).toHaveValue(
    "SHP-UNKNOWN",
  );
});

test("calculator preserves route values, displays current rates, and retries failed quotes", async ({
  page,
}) => {
  let fail = true;
  const requests: unknown[] = [];
  await page.route("**/api/rates/estimate", (route) =>
    route.fulfill({ json: estimate }),
  );
  await page.route("**/api/quotes", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill(
      fail
        ? {
            status: 503,
            json: { message: "Quote service temporarily unavailable" },
          }
        : { status: 201, json: { reference: "Q-TEST-8250" } },
    );
  });
  await page.goto("/calculator?origin=Nairobi&destination=Mombasa&weight=10");
  await expect(page.getByLabel("Origin", { exact: true })).toHaveValue(
    "Nairobi",
  );
  await page
    .getByRole("button", { name: "Calculate estimate", exact: true })
    .click();
  await expect(
    page.getByLabel("Shipping estimate", { exact: true }),
  ).toContainText("$82.50");
  await page.getByLabel("Full name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Email", { exact: true }).fill("customer@example.test");
  await page
    .getByRole("button", { name: "Send quote request", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Quote service temporarily unavailable",
  );
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Test Customer",
  );
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    "customer@example.test",
  );
  fail = false;
  await page
    .getByRole("button", { name: "Send quote request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quote request received", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Q-TEST-8250" }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toMatchObject({
    origin: "Nairobi",
    destination: "Mombasa",
    weightKg: 10,
    serviceCode: "standard",
    contactEmail: "customer@example.test",
  });
});

test("calculator invalidates an old estimate when cargo details change and handles rate failures", async ({
  page,
}) => {
  await page.route("**/api/rates/estimate", (route) =>
    route.fulfill({ json: estimate }),
  );
  await page.goto("/calculator?origin=Nairobi&destination=Mombasa&weight=10");
  await page
    .getByRole("button", { name: "Calculate estimate", exact: true })
    .click();
  await expect(
    page.getByLabel("Shipping estimate", { exact: true }),
  ).toContainText("$82.50");
  await page.getByLabel("Actual weight (kg)", { exact: true }).fill("20");
  await expect(
    page.getByLabel("Shipping estimate", { exact: true }),
  ).not.toContainText("$82.50");
  await expect(
    page.getByRole("button", { name: "Send quote request", exact: true }),
  ).toHaveCount(0);
  await page.route("**/api/rates", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Service rates are temporarily unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Calculate estimate", exact: true }),
  ).toBeDisabled();
});

test("contact validates fields, prevents repeat submission, keeps failed values, and shows confirmed success", async ({
  page,
}) => {
  let fail = true;
  let calls = 0;
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/contact", async (route) => {
    calls++;
    await hold;
    await route.fulfill(
      fail
        ? { status: 429, json: { message: "Too many attempts" } }
        : {
            status: 201,
            json: {
              id: 1,
              ...route.request().postDataJSON(),
              createdAt: "2026-10-11T10:00:00Z",
            },
          },
    );
  });
  await page.goto("/contact");
  await page.getByTestId("button-send-message").click();
  await expect(
    page.getByText("Name must be at least 2 characters"),
  ).toBeVisible();
  expect(calls).toBe(0);
  await page.getByLabel("Full Name", { exact: true }).fill("Test Sender");
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("SENDER@example.test");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Please help plan my shipment to Mombasa.");
  await page.getByTestId("button-send-message").click();
  await expect(page.getByTestId("button-send-message")).toBeDisabled();
  await expect(page.getByTestId("contact-success")).toHaveCount(0);
  release();
  await expect(page.getByRole("alert")).toContainText("Too many attempts");
  await expect(page.getByLabel("Email Address", { exact: true })).toHaveValue(
    "SENDER@example.test",
  );
  fail = false;
  await page.getByTestId("button-send-message").click();
  await expect(page.getByTestId("contact-success")).toContainText(
    "Message sent!",
  );
  expect(calls).toBe(2);
  await page
    .getByRole("button", { name: "Send another message", exact: true })
    .click();
  await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Open Live Chat", exact: true })
    .click();
  await expect(
    page.getByText("Shiprion Support", { exact: true }),
  ).toBeVisible();
  await page.locator(".tool-support-chat button").first().click();
  await expect(
    page.getByText("Shiprion Support", { exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Open Live Chat", exact: true })
    .click();
  await expect(
    page.getByText("Shiprion Support", { exact: true }),
  ).toBeVisible();
});

test("newsletter success follows persistence and failed emails remain available for retry", async ({
  page,
}) => {
  let fail = true;
  let calls = 0;
  await page.route("**/api/newsletter/subscriptions", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({
      email: "newsletter@example.test",
    });
    await route.fulfill(
      fail
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: { subscribed: true } },
    );
  });
  await page.goto("/contact");
  await page
    .getByLabel("Email address for newsletter")
    .fill("NEWSLETTER@example.test");
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(page.locator("footer [role=status]")).toContainText(
    "Your details have been kept",
  );
  await expect(page.getByLabel("Email address for newsletter")).toHaveValue(
    "NEWSLETTER@example.test",
  );
  fail = false;
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Subscribed", exact: true }),
  ).toBeDisabled();
  expect(calls).toBe(2);
});

test("mobile navigation supports keyboard use and document styles clean up between themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/track");
  const toggle = page.getByRole("button", {
    name: "Toggle navigation",
    exact: true,
  });
  await toggle.click();
  const menu = page.getByRole("navigation", {
    name: "Expanded navigation",
    exact: true,
  });
  await expect(menu).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    menu.getByRole("link", { name: "Home.", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    menu.getByRole("link", { name: "Get in touch", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await menu
    .getByRole("link", { name: "Shipping calculator.", exact: true })
    .click();
  await expect(page).toHaveURL(/\/calculator$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Plan your",
  );
  await expect(page.locator("body")).toHaveClass(/shiprion-tools-document/);
  await expect(page.locator("html")).not.toHaveClass(/shiprion-document/);
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Expanded navigation" })
    .getByRole("link", { name: "News & Media.", exact: true })
    .click();
  await expect(page.locator("body")).not.toHaveClass(/shiprion-tools-document/);
  await expect(page.locator("html")).toHaveClass(/shiprion-document/);
  await page.locator('.footer a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("html")).not.toHaveClass(/shiprion-document/);
  await expect(page.locator(".tool-contact-form")).not.toHaveAttribute("inert");
});

test("shipping layouts stay within the viewport at mobile, tablet, desktop, and wide sizes", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1500, 865],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/track", "/calculator", "/contact"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await testInfo.attach(`${path.slice(1)}-${width}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      await expect(page.locator(".tool-transition > div").first()).toHaveCSS(
        "transform",
        "matrix(1, 0, 0, 0, 0, 0)",
      );
    }
  }
});
