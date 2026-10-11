import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  await page.route("**/*.glb", (route) => route.abort());
  await page.addInitScript(() =>
    localStorage.setItem("cookieChoice", "rejected"),
  );
});

async function rows(page: Page) {
  return page.locator(".home-part__marquee-wrapper").evaluateAll((elements) =>
    elements.map((row) => {
      const groups = Array.from(row.children);
      const first = groups[0] as HTMLElement;
      const bounds = groups.map((group) => group.getBoundingClientRect());
      return {
        x: new DOMMatrixReadOnly(getComputedStyle(first).transform).m41,
        width: first.getBoundingClientRect().width,
        left: Math.min(...bounds.map((rect) => rect.left)),
        right: Math.max(...bounds.map((rect) => rect.right)),
        viewport: row.parentElement!.getBoundingClientRect().width,
      };
    }),
  );
}

async function movement(page: Page) {
  const before = await rows(page);
  await page.waitForTimeout(250);
  const after = await rows(page);
  return after.map((row, index) => {
    let delta = row.x - before[index].x;
    if (delta > row.width / 2) delta -= row.width;
    if (delta < -row.width / 2) delta += row.width;
    return delta;
  });
}

function expectCovered(state: Awaited<ReturnType<typeof rows>>) {
  for (const row of state) {
    expect(row.left).toBeLessThanOrEqual(1);
    expect(row.right).toBeGreaterThanOrEqual(row.viewport - 1);
  }
}

test("supporter rows move oppositely, reverse on upward scrolling, and loop without a gap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 865 });
  await page.goto("/");
  await page.locator(".home-part__marquee").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", {
      name: "Trusted by top Partners & Supporters",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".home-part__marquee-item")).toHaveCount(4);
  await expect(page.locator(".home-part__main-item").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await page.waitForTimeout(1800);
  const forward = await movement(page);
  expect(forward[0]).toBeLessThan(-5);
  expect(forward[1]).toBeGreaterThan(5);
  expect(Math.abs(forward[0] + forward[1])).toBeLessThan(2);
  expectCovered(await rows(page));

  await page.mouse.move(1100, 600);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(100);
  const accelerated = await movement(page);
  expect(Math.abs(accelerated[0])).toBeGreaterThan(Math.abs(forward[0]) * 1.25);
  await page.mouse.wheel(0, -320);
  await page.waitForTimeout(1000);
  const reverse = await movement(page);
  expect(reverse[0]).toBeGreaterThan(5);
  expect(reverse[1]).toBeLessThan(-5);

  await page.mouse.wheel(0, 160);
  await page.waitForTimeout(2000);
  const current = (await rows(page))[0];
  const remaining = (1 + current.x / current.width) * 40_000;
  if (remaining < 1500) await page.waitForTimeout(remaining + 1000);
  const phase = (await rows(page))[0];
  await page.waitForTimeout((1 + phase.x / phase.width) * 40_000 - 1000);
  const beforeSeam = await rows(page);
  expect(beforeSeam[0].x).toBeLessThan(-beforeSeam[0].width * 0.9);
  expectCovered(beforeSeam);
  await page.waitForTimeout(2000);
  const afterSeam = await rows(page);
  expect(afterSeam[0].x).toBeGreaterThan(-afterSeam[0].width * 0.1);
  expectCovered(afterSeam);
});

test("supporter tiles resize across desktop, tablet, and phone without duplicate groups or overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  for (const [width, height, columns] of [
    [1500, 865, 6],
    [820, 1180, 5],
    [390, 844, 3],
    [1920, 1080, 6],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator(".home-part__marquee").scrollIntoViewIfNeeded();
    await expect(page.locator(".home-part__marquee-item")).toHaveCount(4);
    await expect(
      page.locator('.home-part__marquee-item[aria-hidden="true"]'),
    ).toHaveCount(2);
    await page.waitForTimeout(1800);
    const sizing = await page.locator(".home-part").evaluate((section) => {
      const container = section.querySelector<HTMLElement>(".container")!;
      const style = getComputedStyle(container);
      return {
        contentWidth:
          container.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
        tileWidth: section
          .querySelector(".home-part__main-item")!
          .getBoundingClientRect().width,
        fits: document.documentElement.scrollWidth <= innerWidth,
      };
    });
    expect(
      Math.abs(sizing.tileWidth - sizing.contentWidth / columns),
    ).toBeLessThan(1);
    expect(sizing.fits).toBe(true);
    expectCovered(await rows(page));
    const delta = await movement(page);
    expect(Math.abs(delta[0])).toBeGreaterThan(2);
    expect(delta[0] * delta[1]).toBeLessThan(0);
    await testInfo.attach(`supporters-${width}`, {
      body: await page.locator(".home-part__marquee").screenshot(),
      contentType: "image/png",
    });
  }
});

test("reduced motion keeps every supporter visible and navigation cleans up animation copies", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-part__marquee-item")).toHaveCount(4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".home-part__marquee").scrollIntoViewIfNeeded();
  await expect(page.locator(".home-part__marquee-item")).toHaveCount(2);
  await expect(page.locator(".home-part__marquee-wrapper.--left")).toBeHidden();
  const group = page.locator(
    ".home-part__marquee-wrapper.--right .home-part__marquee-item",
  );
  await expect(group).toHaveCSS("transform", "none");
  await expect(group.locator("img")).toHaveCount(13);
  await expect(group.locator("img").last()).toBeVisible();
  const before = await rows(page);
  await page.waitForTimeout(300);
  expect(await rows(page)).toEqual(before);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".home-part__marquee-item")).toHaveCount(4);
  const section = await page.locator(".home-part").elementHandle();
  await page.locator('footer a[href="/login"]').click();
  await expect(page.getByTestId("form-login")).toBeVisible();
  expect(
    await section!.evaluate((element) => ({
      connected: element.isConnected,
      groups: element.querySelectorAll(".home-part__marquee-item").length,
      tileSize: (element as HTMLElement).style.getPropertyValue(
        "--ck-supporter-width",
      ),
    })),
  ).toEqual({ connected: false, groups: 2, tileSize: "" });
  await expect(page.locator("html")).not.toHaveClass(/shiprion-document/);
});
