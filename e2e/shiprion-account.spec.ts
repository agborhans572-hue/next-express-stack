import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("cookieChoice", "rejected"),
  );
});

test("login and registration fit desktop and mobile and retain details when registration fails", async ({
  page,
}, testInfo) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1500, 865],
  ]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/login", "/login?tab=register"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        page
          .getByRole("link", { name: "Shiprion home", exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await testInfo.attach(
        `account-${width}-${path.includes("register") ? "signup" : "login"}`,
        {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        },
      );
    }
  }
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 429,
      json: { error: "Too many attempts. Please try again later." },
    }),
  );
  const form = page.getByTestId("form-register");
  await form.getByPlaceholder("you@example.com").fill("signup@example.test");
  await form
    .getByPlaceholder("Create a strong password")
    .fill("Account-Test-Password!1");
  await form
    .getByPlaceholder("Repeat your password")
    .fill("Account-Test-Password!1");
  await form
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(form).toContainText("You must agree to the Terms of Service");
  await form.getByRole("checkbox").check();
  await form
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(form).toContainText("Too many attempts");
  await expect(form.getByPlaceholder("you@example.com")).toHaveValue(
    "signup@example.test",
  );
  await expect(form.getByPlaceholder("Create a strong password")).toHaveValue(
    "Account-Test-Password!1",
  );
  await expect(form.getByRole("checkbox")).toBeChecked();
});

test("sign up, email verification, and login reach the existing account dashboard", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_FULL !== "true",
    "Requires the isolated PostgreSQL test server",
  );
  const email = `signup-ui-${Date.now()}@example.test`;
  const password = "Account-Test-Password!1";
  await page.goto("/login?tab=register");
  const form = page.getByTestId("form-register");
  await form.getByPlaceholder("you@example.com").fill(email);
  await form.getByPlaceholder("Create a strong password").fill(password);
  await form.getByPlaceholder("Repeat your password").fill(password);
  await form.getByRole("checkbox").check();
  const registration = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/register") &&
      response.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  const response = await registration;
  expect(response.ok()).toBe(true);
  const { devCode } = await response.json();
  expect(devCode).toMatch(/^\d{6}$/);
  await expect(
    page.getByRole("heading", { name: "Check your email", exact: true }),
  ).toBeVisible();
  await page.locator('input[autocomplete="one-time-code"]').fill(devCode);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
  const logout = await page.context().request.post("/api/auth/logout", {
    headers: { Origin: new URL(page.url()).origin },
  });
  expect(logout.ok()).toBe(true);
  await page.goto("/login");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page
    .getByTestId("form-login")
    .getByRole("button", { name: "Sign In", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
});
