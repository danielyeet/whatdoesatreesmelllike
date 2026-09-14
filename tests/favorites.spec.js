// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: the screen flickers
// once, a menu of chapters comes up on the right, and a field of
// marks settles along the foot that answers the cursor. These check
// the switch between the two views, that the chapters and their
// dates are read off the page's own entries rather than written
// into the script, that one chapter is open at a time and the strip
// works from the keyboard, that the field answers the cursor and is
// regular when nothing is touching it, and that the whole view fits
// one screen.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/scent-descriptions.html";

const openTab = (page) => page.locator(".chapters-tab.open");

/** Open Favorites and wait for it to have finished coming up. */
async function openFavorites(page) {
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForFunction(
    () => {
      const view = document.querySelector(".chapters");
      return view && view.classList.contains("lit");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(400);
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page opens on the map, with favorites out of the way", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display)
  ).toBe("none");
  expect(errors).toEqual([]);
});

test("choosing favorites takes the map away and flickers the chapters up",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  // It does not simply appear: the screen catches and drops once
  // before it settles, the way a panel does when it is switched on.
  await page.waitForSelector(".chapters.flicker", { timeout: 8000 });
  await openFavorites(page);

  // One view at a time: the map is gone from the page, not merely faded.
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).toBe("none");
  await expect(page.locator(".chapters-menu")).toBeVisible();
  await expect(page.locator(".sheet-filter", { hasText: "Favorites" })).toHaveClass(/chosen/);

  // And the flicker is the thing being switched on, so it happens
  // once: going away and coming back does not do it again.
  await page.locator(".sheet-filter", { hasText: "Description portfolio" }).click();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display),
      { timeout: 6000 })
    .toBe("none");
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(700);
  expect(
    await page.evaluate(() => document.querySelector(".chapters").classList.contains("flicker")),
    "it is only switched on once"
  ).toBe(false);
});

test("the chapters and their dates are read off the page's own entries",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const read = await page.evaluate(() => {
    const entries = [...document.querySelectorAll(".gallery-entry")];
    const named = [];
    entries.forEach((entry) => {
      const on = (entry.dataset.chapter || "Unsorted").trim();
      if (named.indexOf(on) < 0) named.push(on);
    });
    return {
      named: named,
      tabs: [...document.querySelectorAll(".chapters-tab .chapters-name")]
        .map((el) => el.textContent.trim()),
      counts: [...document.querySelectorAll(".chapters-tab .chapters-count-small")]
        .map((el) => Number(el.textContent)),
      perChapter: named.map(
        (on) => entries.filter((e) => (e.dataset.chapter || "Unsorted").trim() === on).length
      ),
      items: document.querySelectorAll(".chapters-item").length,
      entries: entries.length,
      dates: [...document.querySelectorAll(".chapters-date")].map((el) => el.textContent.trim()),
    };
  });

  expect(read.named.length, "the page should name a few chapters").toBeGreaterThan(1);
  expect(read.tabs, "a tab for each, in the order the page names them").toEqual(read.named);
  expect(read.counts, "and each carrying its own count").toEqual(read.perChapter);
  // Every favourite ends up in exactly one chapter.
  expect(read.items).toBe(read.entries);
  // And every one carries a date, which is what it is filed under.
  expect(read.dates.length).toBe(read.entries);
  read.dates.forEach((date) => expect(date).toMatch(/^\d{2}\.\d{2}\.\d{4}$/));
});

test("one chapter is open at a time, and the strip works from the keyboard",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  expect(await page.locator(".chapters-tab.open").count(), "one open").toBe(1);
  expect(await page.locator(".chapters-panel.open").count(), "one panel").toBe(1);
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll(".chapters-panel:not(.open)")].every((p) => p.hidden)),
    "the chapters you are not reading are not on the page"
  ).toBe(true);

  // Only the open one is in the tab order: the strip is one control.
  const stops = await page.$$eval(".chapters-tab", (tabs) => tabs.map((t) => t.tabIndex));
  expect(stops.filter((n) => n === 0).length, "one stop for the whole strip").toBe(1);

  const first = await openTab(page).locator(".chapters-name").textContent();
  await page.locator(".chapters-tab.open").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  expect(await openTab(page).locator(".chapters-name").textContent(),
    "the arrow keys should move along the strip").not.toBe(first);
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("chapters-tab");

  // The plate on the left follows whichever is open.
  expect(await page.locator(".chapters-plate h2").textContent())
    .toBe(await openTab(page).locator(".chapters-name").textContent());
});

test("every favourite is a link to its piece", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const links = await page.$$eval(".chapters-item", (all) =>
    all.map((a) => ({
      href: a.getAttribute("href"),
      name: a.querySelector(".chapters-item-name").textContent.trim(),
    }))
  );
  expect(links.length).toBeGreaterThan(1);
  links.forEach((link) => {
    expect(link.href, `${link.name} should point at a piece`).toMatch(/works\//);
    expect(link.name.length).toBeGreaterThan(0);
  });
});

test("the field along the foot is a lattice until the cursor disturbs it",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  /** What is drawn in one square of the field. */
  const inkAt = (x, y) =>
    page.evaluate(([px, py]) => {
      const canvas = document.querySelector(".chapters-field");
      const paint = canvas.getContext("2d");
      const ratio = canvas.width / canvas.clientWidth;
      const strip = paint.getImageData(
        Math.round(px * ratio), Math.round(py * ratio),
        Math.round(90 * ratio), Math.round(90 * ratio)
      ).data;
      let ink = 0;
      for (let n = 3; n < strip.length; n += 4) ink += strip[n];
      return ink;
    }, [x, y]);

  const box = await page.locator(".chapters").boundingBox();
  const low = box.height - 150;
  const away = await inkAt(120, low);
  expect(away, "there should be marks along the foot").toBeGreaterThan(0);

  // Put the cursor in the middle of a square of it: the marks near it
  // are shoved out of the lattice and drawn larger, so there is more
  // ink there than there was.
  await page.mouse.move(box.x + 165, box.y + low + 45);
  await page.waitForTimeout(700);
  const under = await inkAt(120, low);
  expect(under, "the field should answer the cursor").toBeGreaterThan(away * 1.15);

  // And find its way back when the cursor goes.
  await page.mouse.move(box.x + box.width - 40, box.y + 30);
  await page.waitForTimeout(900);
  expect(await inkAt(120, low), "and settle again afterwards")
    .toBeLessThan(under);
});

test("the whole view fits on one screen, with nothing to scroll to", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const fit = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
  }));
  expect(fit.page, `page is ${fit.page}px in a ${fit.window}px window`)
    .toBeLessThanOrEqual(fit.window + 2);
});

test("with animation turned off it arrives without the flicker", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(400);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(500);

  const view = page.locator(".chapters");
  await expect(view).toHaveClass(/lit/);
  await expect(view).not.toHaveClass(/flicker/);
  await expect(page.locator(".chapters-tab.open")).toHaveCount(1);
});
