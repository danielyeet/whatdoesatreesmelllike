// ============================================================
// HOW THE MENU OPENS ON EACH SLIDE (landing page only)
//
// The same menu, presented three different ways depending on
// which slide you are looking at. These check that the right one
// is chosen and that each does the thing that makes it different,
// not how it looks — that stays a matter of taste.
// ============================================================
const { test, expect } = require("@playwright/test");
const {
  serveDependenciesLocally,
  collectPageErrors,
  jumpToSlide,
  waitForMapSettled,
} = require("./helpers");

const overlayClass = (page) =>
  page.evaluate(() => document.getElementById("site-menu-overlay").className);

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("each slide opens the menu its own way", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/index.html");
  await page.waitForTimeout(400);

  // slide 1
  expect(await page.evaluate(() => window.__slide)).toBe(0);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-title");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // slide 2
  await jumpToSlide(page, "slide-2");
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(1);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-side");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // slide 3
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(2);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-map");

  expect(errors).toEqual([]);
});

test("on the title slide, a strand is drawn to every menu item and the title sinks", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForTimeout(400);

  const title = page.locator(".title-content");
  const before = await title.evaluate((el) => getComputedStyle(el).transform);

  await page.locator(".menu-trigger").click();
  await page.waitForTimeout(900);

  // One strand per menu item, and they have actually been drawn on
  // (their dash offset runs down to zero as they appear).
  const strands = page.locator(".menu-fan-line");
  const itemCount = await page.locator(".menu-list li").count();
  await expect(strands).toHaveCount(itemCount);

  const offsets = await strands.evaluateAll((els) =>
    els.map((el) => parseFloat(el.style.strokeDashoffset || "0"))
  );
  expect(Math.max(...offsets), "strands should be drawn in, not left hidden").toBeLessThan(1);

  // And the title has moved down out of the way.
  const after = await title.evaluate((el) => getComputedStyle(el).transform);
  expect(after).not.toBe(before);
  const shiftedDown = Number(after.split(",").pop().replace(")", ""));
  expect(shiftedDown, "title should sink downwards").toBeGreaterThan(50);
});

test("on the map slide, the page inverts and the map falls into its centre", async ({ page }) => {
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);

  const spread = () =>
    page.evaluate(() => {
      const r = window.__mapReadout;
      return Math.max(
        ...r.nodes.map((n) => Math.hypot(n.x - (r.hubX || 0), n.y - (r.hubY || 0)))
      );
    });

  const before = await spread();
  await page.locator(".menu-trigger").click();
  await page.waitForTimeout(900);

  expect(await page.evaluate(() => document.body.classList.contains("menu-invert"))).toBe(true);
  expect(await page.evaluate(() => window.__menuCollapse)).toBeGreaterThan(0.9);
  expect(await spread(), "nodes should be drawn into the centre").toBeLessThan(before * 0.25);

  // The map is the backdrop here, so it must not be dimmed the way the
  // page is behind the other two menus.
  const mapOpacity = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.getElementById("scroll-container")).opacity)
  );
  expect(mapOpacity, "the map is the menu here, not something behind it").toBeGreaterThan(0.9);

  // Closing puts everything back.
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.__menuCollapse), { timeout: 5000 }).toBe(0);
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains("menu-invert")), { timeout: 5000 })
    .toBe(false);
});

test("the menu still works normally on pages that are not the landing page", async ({ page }) => {
  // menu-modes.js only loads on index.html; everywhere else the plain
  // overlay nav.js builds is the whole of it.
  await page.goto("/contact.html");
  await page.locator(".menu-trigger").click();

  const cls = await overlayClass(page);
  expect(cls).toContain("open");
  expect(cls).not.toContain("mode-");
  await expect(page.locator(".menu-list a")).toHaveCount(7);
});
