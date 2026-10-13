import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("cookieChoice", "rejected"),
  );
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
});

for (const width of [390, 1500]) {
  test(`public pages share the updated design at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of [
      "/services",
      "/terms",
      "/cookies",
      "/faq",
      "/shipping-policy",
      "/insurance-policy",
      "/forgot-password",
      "/reset-password",
      "/claim-quote",
      "/news/shiprion-opens-dallas-hub",
      "/news/missing-article",
      "/missing-page",
    ]) {
      await page.goto(path);
      await expect(page.locator(".tool-header")).toBeVisible();
      await expect(page.locator(".tool-footer")).toHaveCount(1);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(
        page.locator(".tool-footer a[href='/services']").first(),
      ).toHaveText("Services");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (path === "/services" || path === "/terms") {
        if (path === "/terms") {
          await expect(
            page.getByRole("heading", { name: "1. Acceptance of Terms" }),
          ).toBeVisible();
        }
        await page.screenshot({
          path: `.cache/shiprion/public-pages/${path.slice(1)}-${width}.png`,
        });
      }
    }
  });
}

test("services FAQ, quote links, and mobile navigation work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/services");
  await expect(page.locator(".services-card")).toHaveCount(6);
  await expect(page.locator(".services-card a").first()).toHaveAttribute(
    "href",
    "/calculator",
  );
  const question = page.getByRole("button", {
    name: "How do I get a price for my shipment?",
  });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#service-answer-0")).toBeVisible();
  await question.click();
  await expect(page.locator("#service-answer-0")).toBeHidden();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Expanded navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Expanded navigation" })
    .getByRole("link", { name: "Services." })
    .click();
  await expect(page.locator("h1")).toContainText("Every shipping solution.");
});

test("original logistics search description is restored", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(
    "Shiprion | Global Logistics Platform — Air, Road & Ocean Freight",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Ship smarter with Shiprion — enterprise logistics across 180\+ countries/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /Ship smarter with Shiprion/,
  );
  await expect(page.locator(".home-intro__richtext-p").first()).toContainText(
    "Since 2012, Shiprion has connected businesses and consumers",
  );
  await expect(
    page.locator(".home-intro__richtext-p").first(),
  ).not.toContainText("Munich");
});

test("password recovery and FAQ search retain their workflows", async ({
  page,
}) => {
  await page.route("**/api/auth/forgot-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "customer@example.com",
    });
    await route.fulfill({ json: { success: true } });
  });
  await page.goto("/forgot-password");
  await page
    .locator('.tool-public-page input[type="email"]')
    .fill("customer@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText("If an eligible account exists", { exact: false }),
  ).toBeVisible();
  await page.goto("/faq");
  await page.getByPlaceholder("Search questions...").fill("P.O. Boxes");
  await expect(
    page.getByRole("button", {
      name: "Do you deliver to P.O. Boxes or military addresses?",
    }),
  ).toBeVisible();
});
