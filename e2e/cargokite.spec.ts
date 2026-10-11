import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  await page.goto("/news");
  await expect(page.locator(".main h1")).toBeVisible();
  const consent = page.getByRole("button", { name: "Deny", exact: true });
  if (await consent.isVisible()) await consent.click();
});

test("news reveals three entries at a time and retains external article destinations", async ({
  page,
}) => {
  const entries = page.locator(".news-hero__main-item:not(.hidden)");
  await expect(entries).toHaveCount(10);
  await expect(entries.first()).toHaveAttribute("href", /^https:\/\//);
  await expect(entries.first()).toHaveAttribute("target", "_blank");
  for (const count of [13, 16, 19, 22, 25, 27]) {
    await page.locator(".news-hero__load-btn").click();
    await expect(entries).toHaveCount(count);
  }
  await expect(page.locator(".news-hero__load-btn")).toBeHidden();
});

test("cookie preferences support keyboard navigation and persist the selected categories", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.removeItem("cookieChoice"));
  await page.reload();
  const consent = page.getByRole("dialog", { name: "Cookies consent" });
  await expect(consent).toBeVisible();
  await consent.getByRole("button", { name: "Settings", exact: true }).click();
  const preferences = page.getByRole("dialog", { name: "Cookie preferences" });
  await expect(preferences).toBeVisible();
  const necessary = preferences.getByRole("checkbox", {
    name: "Strictly necessary cookies",
    exact: true,
  });
  await expect(necessary).toBeChecked();
  await expect(necessary).toBeDisabled();
  const analytics = preferences.getByRole("checkbox", {
    name: "Performance and Analytics cookies",
    exact: true,
  });
  await analytics.check();
  await preferences
    .getByRole("button", {
      name: "Performance and Analytics cookies",
      exact: true,
    })
    .click();
  await expect(preferences.locator("#c-ac-2")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await preferences.getByRole("button", { name: "Save settings" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    preferences.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    consent.getByRole("button", { name: "Settings", exact: true }),
  ).toBeFocused();
  await consent.getByRole("button", { name: "Settings", exact: true }).click();
  await preferences.getByRole("button", { name: "Save settings" }).click();
  await expect(consent).toBeHidden();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cookiePreferences")!),
    ),
  ).toEqual({ necessary: true, analytics: true, targeting: false });
  await page.reload();
  await expect(page.locator(".main h1")).toBeVisible();
  await expect(consent).toBeHidden();
});

test("contact errors retain values, submission is guarded, and Escape restores focus", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/contact", async (route) => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({
      name: "Replica Visitor",
      email: "visitor@example.com",
      message: "Please tell me more about your vessels.",
    });
    await route.fulfill(
      requests === 1
        ? { status: 500, json: { message: "Persistence failed" } }
        : { status: 201, json: { id: 1, message: "Saved" } },
    );
  });
  const trigger = page.locator(".header__btn");
  await trigger.click();
  const dialog = page.locator(".contact.popup");
  await expect(dialog).toHaveAttribute("aria-hidden", "false");
  await dialog
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Replica Visitor");
  await dialog
    .getByRole("textbox", { name: "Your email", exact: true })
    .fill("VISITOR@example.com");
  await dialog
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Please tell me more about your vessels.");
  await dialog.getByRole("button", { name: /Send message/ }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "Your details have been kept",
  );
  await expect(
    dialog.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Replica Visitor");
  await dialog.getByRole("button", { name: /Send message/ }).click();
  await expect(dialog.locator(".popup__main-form-success")).toBeVisible();
  await expect(dialog.locator("[data-form-name]")).toHaveText(
    "Replica Visitor",
  );
  expect(requests).toBe(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAttribute("aria-hidden", "true");
  await expect(trigger).toBeFocused();
});

test("newsletter waits for persistence and supports retry after rate limiting", async ({
  page,
}) => {
  let requests = 0;
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/newsletter/subscriptions", async (route) => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({
      email: "reader@example.com",
    });
    if (requests === 1)
      await route.fulfill({ status: 429, json: { message: "Rate limited" } });
    else {
      await pending;
      await route.fulfill({ status: 200, json: { subscribed: true } });
    }
  });
  const form = page.locator('[data-ck-form="newsletter"]');
  const email = form.getByRole("textbox");
  await email.fill("Reader@EXAMPLE.com");
  await form.getByRole("button", { name: /Subscribe/ }).click();
  await expect(form.getByRole("status")).toContainText("Too many attempts");
  await expect(email).toHaveValue("Reader@EXAMPLE.com");
  await form.getByRole("button", { name: /Subscribe/ }).click();
  await expect(form.getByRole("button")).toBeDisabled();
  await expect(form.getByRole("status")).toHaveText("Sending…");
  release!();
  await expect(form.getByRole("status")).toContainText("You’re subscribed");
  expect(requests).toBe(2);
});

test("mobile tile navigation, FAQ keyboard controls, and legacy document styles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Low Emission Ocean Transportation",
  );
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".header__nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".header__nav-cta").click();
  await expect(page.locator(".contact.popup")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  const question = page.locator(".faq-item__head").first();
  await question.scrollIntoViewIfNeeded();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator(".faq-item.active .faq-item__body .txt").first(),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await page.goto("/calculator");
  await expect(
    page.getByRole("heading", { name: "Plan your shipment" }),
  ).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/cargokite-document/);
  await expect(page.locator("body")).not.toHaveClass(/cargokite-document/);
});

test("direct routes, hidden careers, event details, and legal anchors remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about#event");
  await expect(page.locator(".abt-job")).toBeHidden();
  await page.locator(".abt-event__item").click();
  const event = page.locator(".event.popup");
  await expect(event).toHaveAttribute("aria-hidden", "false");
  await expect(event).toContainText("Amelie Binder, Jackson Day");
  await expect(event.getByRole("link", { name: "Read more" })).toHaveAttribute(
    "href",
    "https://www.smw.sg/",
  );
  await event.getByRole("button", { name: "Close dialog" }).click();
  for (const route of ["/tech", "/privacy", "/legal"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".header__btn")).toBeAttached();
  }
});

test("team portraits follow desktop focus and mobile profiles trap and restore focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1500, height: 865 });
  await page.goto("/about");
  const rows = page.locator(".abt-team__main-item");
  const first = rows
    .first()
    .getByRole("button", { name: "Amelie Binder", exact: true });
  const second = rows
    .nth(1)
    .getByRole("button", { name: "Tim Linnenweber", exact: true });
  await first.hover();
  await expect(
    page.locator(".abt-team__main-img-item.active img"),
  ).toHaveAttribute("alt", "Amelie Binder");
  await second.focus();
  await expect(
    page.locator(".abt-team__main-img-item.active img"),
  ).toHaveAttribute("alt", "Tim Linnenweber");
  await page.locator(".header__btn").focus();
  await page.locator(".header__btn").hover();
  await expect(page.locator(".abt-team__main-img-item.active")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await first.click();
  const profile = page.getByRole("dialog", {
    name: "Amelie Binder — team profile",
  });
  await expect(profile).toBeVisible();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator(".abt-team__main-img-item.selected img"),
  ).toHaveAttribute("alt", "Amelie Binder");
  const close = profile.getByRole("button", { name: "Close team profile" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  const social = profile.getByRole("link", {
    name: "Amelie Binder on LinkedIn",
  });
  await expect(social).toBeFocused();
  await expect(social).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/amelie-binder-522352214/",
  );
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(profile).toBeHidden();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(profile).toBeVisible();
  await close.click();
  await expect(first).toBeFocused();
  const noSocial = rows.getByRole("button", {
    name: "Gabriel Käll",
    exact: true,
  });
  await noSocial.click();
  const noSocialProfile = page.getByRole("dialog", {
    name: "Gabriel Käll — team profile",
  });
  await expect(noSocialProfile).toBeVisible();
  await expect(
    noSocialProfile.locator(".abt-team__main-img-icon"),
  ).toBeHidden();
  await page.keyboard.press("Tab");
  await expect(
    noSocialProfile.getByRole("button", { name: "Close team profile" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(noSocial).toBeFocused();
  await page.setViewportSize({ width: 820, height: 1180 });
  await second.click();
  await expect(
    page.getByRole("dialog", { name: "Tim Linnenweber — team profile" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1200, height: 865 });
  await expect(page.locator(".abt-team__main-img")).not.toHaveClass(/active/);
  await expect(page.locator(".main")).not.toHaveAttribute("inert", "");
});

test("custom study enquiries use the existing contact API and retain details on errors", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/contact", (route) => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({
      name: "Port Operator",
      email: "operator@example.com",
      message:
        "[CargoKite custom study enquiry]\nRotterdam to Hamburg, two departures per week.",
    });
    return route.fulfill(
      requests === 1
        ? { status: 500, json: { message: "Persistence failed" } }
        : { status: 201, json: { id: 2, message: "Saved" } },
    );
  });
  await page.goto("/tech#study");
  const dialog = page.locator(".download.popup");
  await expect(dialog).toHaveAttribute("aria-hidden", "false");
  await dialog
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Port Operator");
  await dialog
    .getByRole("textbox", { name: "Your email", exact: true })
    .fill("Operator@example.com");
  await dialog
    .getByRole("textbox", { name: "Route & schedule details", exact: true })
    .fill("Rotterdam to Hamburg, two departures per week.");
  await dialog.getByRole("button", { name: /Send message/ }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "Your details have been kept",
  );
  await expect(
    dialog.getByRole("textbox", {
      name: "Route & schedule details",
      exact: true,
    }),
  ).toHaveValue("Rotterdam to Hamburg, two departures per week.");
  await dialog.getByRole("button", { name: /Send message/ }).click();
  await expect(dialog.locator(".popup__main-form-success")).toBeVisible();
  await dialog
    .getByRole("button", { name: "Close the modal", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveAttribute("aria-hidden", "true");
});

test("port search, route preview, map attribution, and pan/zoom controls work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZcWQAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto("/tech");
  const start = page.getByRole("combobox", { name: "Start route" });
  const end = page.getByRole("combobox", { name: "End route" });
  await expect(end).toBeDisabled();
  await start.fill("Rotterdam");
  await page
    .getByRole("option", { name: /Rotterdam/i })
    .first()
    .click();
  await expect(end).toBeEnabled();
  await end.fill("Hamburg");
  await page
    .getByRole("option", { name: /Hamburg/i })
    .first()
    .click();
  await page
    .getByRole("button", { name: "See the route", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(/Rotterdam.*Hamburg/i);
  await expect(
    page.locator(".leaflet-overlay-pane path").first(),
  ).toBeAttached();
  await expect(
    page.getByRole("link", { name: "OpenStreetMap", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Zoom out" }).click();
  await start.fill("Unknown port");
  await expect(end).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "See the route", exact: true }),
  ).toBeDisabled();
});

test("unavailable WebGL keeps the vessel explanation and image fallback usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...options: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(original, this, [type, ...options]);
    } as typeof original;
  });
  await page.goto("/tech");
  await expect(
    page.getByAltText("CargoKite vessel", { exact: true }),
  ).toBeAttached();
  await expect(page.locator(".tech-demo__main-item")).toHaveCount(6);
  await page.locator(".header__btn").click();
  await expect(page.locator(".contact.popup")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});

test("unavailable video retains its poster and page interactions", async ({
  page,
}) => {
  await page.route("**/*.mp4", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".home-hero__bg-vid")).toHaveClass(
    /ck-media-unavailable/,
  );
  await expect(page.locator(".home-hero__bg-ph")).toBeVisible();
  await expect(page.locator(".main h1")).toContainText("Low Emission");
  await page.goto("/tech");
  await page.locator(".tech-vid__play-btn").click();
  await expect(page.locator(".tech-vid__main-inner")).toHaveCSS(
    "background-image",
    /tech-video-poster\.jpg/,
  );
  await expect(page.locator(".tech-vid .ck-video-status")).toContainText(
    "Video is unavailable",
  );
});

test("a failed vessel model request preserves the explanation and contact dialog", async ({
  page,
}) => {
  await page.route("**/*.glb", (route) => route.abort());
  await page.goto("/tech");
  await expect(
    page.getByAltText("CargoKite vessel", { exact: true }),
  ).toBeAttached();
  await expect(page.locator(".tech-demo__main-item")).toHaveCount(6);
  await page.locator(".header__btn").click();
  await expect(page.locator(".contact.popup")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
