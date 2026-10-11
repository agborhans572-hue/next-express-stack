import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

test("Shiprion vessel and consent visual audit", async ({ page }) => {
  test.skip(process.env.CK_VISUAL_AUDIT !== "true", "Opt-in screenshot audit");
  test.setTimeout(300_000);
  const destination = path.resolve(".cache/shiprion/visual-updated");
  await mkdir(destination, { recursive: true });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  for (const viewport of [
    { width: 1500, height: 865 },
    { width: 390, height: 844 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/news");
    await page.evaluate(() => localStorage.removeItem("cookieChoice"));
    await page.reload();
    const consent = page.getByRole("dialog", { name: "Cookies consent" });
    await expect(consent).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(destination, `${viewport.width}-consent.png`),
    });
    await consent
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Cookie preferences" }),
    ).toBeVisible();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(destination, `${viewport.width}-preferences.png`),
    });
    await page.getByRole("button", { name: "Reject all", exact: true }).click();
    await page.goto("/");
    await expect(page.locator(".home-hero__canvas canvas")).toBeVisible();
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(destination, `${viewport.width}-hero.png`),
    });
    await page.goto("/tech");
    await expect(
      page.locator(".tech-demo__canvas-inner canvas"),
    ).toBeAttached();
    const stage = page.locator(".tech-demo__main-outer");
    for (const progress of [0.02, 0.2, 0.37, 0.54, 0.71, 0.88]) {
      await stage.evaluate((element, value) => {
        const wrapper = document.querySelector<HTMLElement>(".wrapper")!;
        const mobile = matchMedia("(max-width: 767px)").matches;
        const top =
          element.getBoundingClientRect().top +
          (mobile ? wrapper.scrollTop : scrollY);
        const y =
          top + (element.getBoundingClientRect().height - innerHeight) * value;
        if (mobile) wrapper.scrollTo(0, y);
        else window.scrollTo(0, y);
      }, progress);
      await page.waitForTimeout(1700);
      await page.screenshot({
        path: path.join(
          destination,
          `${viewport.width}-vessel-${progress}.png`,
        ),
      });
    }
  }
});

test("Shiprion viewport and scroll-stage visual audit", async ({ page }) => {
  test.skip(process.env.CK_VISUAL_AUDIT !== "true", "Opt-in screenshot audit");
  test.setTimeout(420_000);
  page.setDefaultTimeout(15_000);
  const destination = path.resolve(
    process.env.CK_VISUAL_DIR ?? ".cache/shiprion/visual",
  );
  await mkdir(destination, { recursive: true });
  await page.addInitScript(() =>
    localStorage.setItem("cookieChoice", "rejected"),
  );
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Not signed in" } }),
  );
  const report: unknown[] = [];
  for (const viewport of [
    { width: 1500, height: 865 },
    { width: 390, height: 844 },
    { width: 820, height: 1180 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of [
      "/",
      "/about",
      "/tech",
      "/news",
      "/privacy",
      "/legal",
    ]) {
      await page.goto(route);
      await expect(page.locator(".main h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1050);
      await page
        .locator("video")
        .evaluateAll((videos) =>
          videos.forEach((video) => (video as HTMLVideoElement).pause()),
        );
      const prefix = `${viewport.width}-${route === "/" ? "home" : route.slice(1)}`;
      await page.screenshot({
        path: path.join(destination, `${prefix}-initial.png`),
      });
      const sections = page.locator(".main section, footer");
      const count = await sections.count();
      for (let index = 0; index < count; index++) {
        const section = sections.nth(index);
        if (!(await section.isVisible())) continue;
        const className =
          (await section.getAttribute("class"))
            ?.split(" ")
            .find((value) => /^(home|abt|tech|news|priv)/.test(value)) ??
          "footer";
        await section.evaluate((element) => {
          const wrapper = document.querySelector<HTMLElement>(".wrapper")!;
          const mobile = matchMedia("(max-width: 767px)").matches;
          const top =
            element.getBoundingClientRect().top +
            (mobile ? wrapper.scrollTop : scrollY);
          if (mobile) wrapper.scrollTo(0, top);
          else window.scrollTo(0, top);
        });
        await page.waitForTimeout(700);
        await page
          .locator("video")
          .evaluateAll((videos) =>
            videos.forEach((video) => (video as HTMLVideoElement).pause()),
          );
        await page.screenshot({
          path: path.join(destination, `${prefix}-${index}-${className}.png`),
        });
        if (/home-shift|abt-mil|tech-demo/.test(className)) {
          const stage =
            className === "tech-demo"
              ? section.locator(".tech-demo__main-outer")
              : section;
          const stages =
            className === "tech-demo"
              ? [0.02, 0.2, 0.37, 0.54, 0.71, 0.88]
              : [0.3, 0.65, 0.95];
          for (const progress of stages) {
            await stage.evaluate((element, value) => {
              const wrapper = document.querySelector<HTMLElement>(".wrapper")!;
              const mobile = matchMedia("(max-width: 767px)").matches;
              const top =
                element.getBoundingClientRect().top +
                (mobile ? wrapper.scrollTop : scrollY);
              const y =
                top +
                (element.getBoundingClientRect().height - innerHeight) * value;
              if (mobile) wrapper.scrollTo(0, y);
              else window.scrollTo(0, y);
            }, progress);
            await page.waitForTimeout(750);
            await page.screenshot({
              path: path.join(
                destination,
                `${prefix}-${className}-${progress}.png`,
              ),
            });
          }
        } else if (
          (await section.boundingBox())!.height >
          viewport.height * 2
        ) {
          for (const progress of [0.3, 0.65]) {
            await section.evaluate((element, value) => {
              const wrapper = document.querySelector<HTMLElement>(".wrapper")!;
              const mobile = matchMedia("(max-width: 767px)").matches;
              const top =
                element.getBoundingClientRect().top +
                (mobile ? wrapper.scrollTop : scrollY);
              const y =
                top +
                (element.getBoundingClientRect().height - innerHeight) * value;
              if (mobile) wrapper.scrollTo(0, y);
              else window.scrollTo(0, y);
            }, progress);
            await page.waitForTimeout(500);
            await page.screenshot({
              path: path.join(
                destination,
                `${prefix}-${className}-${progress}.png`,
              ),
            });
          }
        }
      }
      const trigger = page.locator(".header__btn");
      if (await trigger.isVisible()) {
        await trigger.click();
        await expect(page.locator(".contact.popup")).toHaveAttribute(
          "aria-hidden",
          "false",
        );
        await page.waitForTimeout(700);
        await page.screenshot({
          path: path.join(destination, `${prefix}-contact.png`),
        });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(700);
      }
      if (viewport.width <= 991) {
        await page.getByRole("button", { name: "Toggle navigation" }).click();
        await page.waitForTimeout(900);
        await page.screenshot({
          path: path.join(destination, `${prefix}-menu.png`),
        });
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "Toggle navigation" }),
        ).toHaveAttribute("aria-expanded", "false");
        await page.waitForTimeout(1200);
      }
      if (route === "/about") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/about#event");
        await page.locator(".abt-event__item").click();
        await expect(page.locator(".event.popup")).toHaveAttribute(
          "aria-hidden",
          "false",
        );
        await page.waitForTimeout(700);
        await page.screenshot({
          path: path.join(destination, `${prefix}-event.png`),
        });
        await page.keyboard.press("Escape");
      }
      if (route === "/tech") {
        await page.goto("/tech#study");
        await expect(page.locator(".download.popup")).toHaveAttribute(
          "aria-hidden",
          "false",
        );
        await page.waitForTimeout(700);
        await page.screenshot({
          path: path.join(destination, `${prefix}-study.png`),
        });
        await page.keyboard.press("Escape");
      }
      if (route === "/") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/");
        await page.locator(".faq-item__head").first().click();
        await page.screenshot({
          path: path.join(destination, `${prefix}-faq-open.png`),
        });
      }
      await page.emulateMedia({ reducedMotion: "no-preference" });
      report.push({
        viewport,
        route,
        sections: count,
        ...(await page.evaluate(() => ({
          brokenImages: [...document.images]
            .filter((image) => image.complete && !image.naturalWidth)
            .map((image) => image.src),
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
        }))),
      });
    }
  }
  await writeFile(
    path.join(destination, "report.json"),
    JSON.stringify(report, null, 2),
  );
});
