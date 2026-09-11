// ============================================================
// THE LANDING PAGE
//
// index.html is three full-screen panels ("slides") that you move
// between with the wheel, the arrow keys, or the Scroll button.
// The moving is hand-written rather than left to the browser, so
// it is worth checking it actually lands where it should.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const scrollTop = (page) =>
  page.evaluate(() => document.getElementById("scroll-container").scrollTop);
const slideTop = (page, id) =>
  page.evaluate((id) => document.getElementById(id).offsetTop, id);

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the landing page has exactly three slides", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator(".slide")).toHaveCount(3);
  await expect(page.locator("#slide-1")).toBeVisible();
});

test("the Scroll button moves to the second slide", async ({ page }) => {
  await page.goto("/index.html");
  expect(await scrollTop(page)).toBe(0);

  await page.locator("#scroll-cue").click();
  const target = await slideTop(page, "slide-2");
  await expect.poll(() => scrollTop(page), { timeout: 8000 }).toBe(target);
});

test("arrow keys move one slide at a time, and stop at the ends", async ({ page }) => {
  await page.goto("/index.html");

  await page.keyboard.press("ArrowDown");
  await expect.poll(() => scrollTop(page), { timeout: 8000 }).toBe(await slideTop(page, "slide-2"));

  await page.keyboard.press("ArrowUp");
  await expect.poll(() => scrollTop(page), { timeout: 8000 }).toBe(0);

  // Already at the top — pressing up again should not go anywhere odd.
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(500);
  expect(await scrollTop(page)).toBe(0);
});

// Regression test: the arrow keys used to keep driving the slides while
// the menu was open over the top of them, so the page scrolled around
// behind whatever you were actually looking at.
test("arrow keys do nothing while the menu is open, and work again once it closes", async ({ page }) => {
  await page.goto("/index.html");
  const start = await scrollTop(page);

  await page.locator(".menu-trigger").click();
  await expect(page.locator(".menu-overlay")).toHaveClass(/open/);

  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(900);
  expect(await scrollTop(page), "page must not move behind the open menu").toBe(start);

  await page.keyboard.press("Escape");
  await expect(page.locator(".menu-overlay")).not.toHaveClass(/open/);

  await page.keyboard.press("ArrowDown");
  await expect.poll(() => scrollTop(page), { timeout: 8000 }).toBe(await slideTop(page, "slide-2"));
});

// The "A portfolio / 2026 edition" block leaves on its own as you go
// down and comes back as you return, tracking the scroll rather than
// playing a fixed animation — so it reverses the moment you turn round.
test("the title block fades out on the way down and back in on the way up", async ({ page }) => {
  await page.goto("/index.html");

  const shown = () =>
    page.locator(".title-block").evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  // It arrives with an animation of its own, which holds on to opacity
  // until it has finished playing; the scroll only takes over after that.
  await page.waitForTimeout(1600);
  expect(await shown(), "should be there to begin with").toBeGreaterThan(0.9);

  // Park the page partway down by hand, rather than waiting out the
  // site's own long scroll, and check it responds to where the page is.
  const park = (fraction) =>
    page.evaluate((f) => {
      const container = document.getElementById("scroll-container");
      container.style.scrollSnapType = "none";
      container.scrollTop = document.getElementById("slide-2").offsetTop * f;
    }, fraction);

  await park(0.2);
  await page.waitForTimeout(150);
  const partway = await shown();
  expect(partway, "should already be going").toBeLessThan(0.7);
  expect(partway, "but not gone yet").toBeGreaterThan(0);

  await park(0.5);
  await page.waitForTimeout(150);
  expect(await shown(), "gone well before the second slide").toBeLessThan(0.05);

  await park(0);
  await page.waitForTimeout(150);
  expect(await shown(), "and back again on the way up").toBeGreaterThan(0.9);
});

test("the page still works with animations turned off in the operating system", async ({ page }) => {
  // Some people set "reduce motion" system-wide. The site is supposed to
  // go straight to its destination instead of animating, not break.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = collectPageErrors(page);
  await page.goto("/index.html");

  await page.locator("#scroll-cue").click();
  await expect.poll(() => scrollTop(page), { timeout: 8000 }).toBe(await slideTop(page, "slide-2"));

  expect(errors).toEqual([]);
});
