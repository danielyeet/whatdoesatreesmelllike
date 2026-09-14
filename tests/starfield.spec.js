// ============================================================
// THE STARFIELD (categories/theories.html)
//
// That category is a night sky you travel through: a field of
// particles in three dimensions, one constellation per theory
// standing at its own depth along a road. These check that the sky
// is grown from the page's own rows, that the travel is the page's
// own scroll rather than the wheel being caught, that going further
// in brings different constellations up and leaves the ones behind
// you off the page, that a constellation is the thing you click,
// that the sky is dark and says so to the cursor, and that
// switching the script off leaves the plain list behind.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/theories.html";

/** Which constellations are on the page, and how strongly. */
const skyNow = (page) =>
  page.evaluate(() => {
    const out = {};
    [...document.querySelectorAll(".sky-stop")].forEach((stop, i) => {
      if (stop.classList.contains("gone")) return;
      const r = stop.getBoundingClientRect();
      out[i] = { lit: parseFloat(stop.style.opacity), width: r.width, x: r.left, y: r.top };
    });
    return out;
  });

async function waitForSky(page) {
  await page.waitForSelector(".sky-field", { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".sky-stop:not(.gone)").length > 0,
    null,
    { timeout: 15000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the sky is grown from the page's own rows", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForSky(page);

  const sky = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-row")];
    const stops = [...document.querySelectorAll(".sky-stop")];
    return {
      rows: rows.length,
      stops: stops.length,
      names: stops.map((s) => s.querySelector(".sky-name").textContent.trim()),
      rowNames: rows.map((r) => r.querySelector(".work-row-title").textContent.trim()),
      hrefs: stops.map((s) => s.getAttribute("href")),
      rowHrefs: rows.map((r) => r.getAttribute("href")),
      numbers: stops.map((s) => s.querySelector(".sky-no").textContent.trim()),
      starred: document.body.classList.contains("starred"),
    };
  });

  expect(sky.rows, "there should be theories on the page").toBeGreaterThan(2);
  expect(sky.stops, "one constellation for each of them").toBe(sky.rows);
  expect(sky.names).toEqual(sky.rowNames);
  expect(sky.hrefs).toEqual(sky.rowHrefs);
  expect(sky.numbers[0]).toBe("01");
  expect(sky.starred).toBe(true);
  expect(errors).toEqual([]);
});

test("the travel is the page's own scroll, so the page is a road", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSky(page);

  // Made tall enough to hold the road. Doing it this way rather than
  // catching the wheel is what keeps the scrollbar, the arrow keys,
  // Page Down and a finger on a phone all working for free.
  const road = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
    stops: document.querySelectorAll(".sky-stop").length,
  }));
  expect(road.page, "several screens of road").toBeGreaterThan(road.window * road.stops);

  // And the scroll drives it: the readout says how far along you are.
  const before = await page.locator(".sky-readout").textContent();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await page.waitForTimeout(1200);
  const after = await page.locator(".sky-readout").textContent();
  expect(after, "the readout should follow the scroll").not.toBe(before);
  expect(after).toMatch(/\d\d \/ \d\d/);
});

test("going further in brings new constellations up and leaves the old behind",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForSky(page);
  await page.waitForTimeout(600);

  const near = await skyNow(page);
  expect(Object.keys(near).length, "something should be in the sky").toBeGreaterThan(0);
  const first = Object.keys(near)[0];

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5));
  await page.waitForTimeout(1500);
  const far = await skyNow(page);

  expect(Object.keys(far).length, "and something further in too").toBeGreaterThan(0);
  // What was in front of you at the start is behind you now, and a
  // constellation behind you is off the page rather than faded to
  // nothing and still catching the pointer.
  expect(far[first], `constellation ${first} should have gone past`).toBeUndefined();
  const arrived = Object.keys(far).filter((k) => !near[k]);
  expect(arrived.length, "new ones should have come up out of the dark").toBeGreaterThan(0);
});

test("a constellation is the thing you click, and it can be tabbed to",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForSky(page);
  await page.waitForTimeout(600);

  const there = page.locator(".sky-stop:not(.gone)").first();
  await expect(there).toHaveAttribute("href", /works\//);

  // The link is laid over the cluster rather than beside it, so what
  // you click is the constellation and not a caption next to it.
  const box = await there.boundingBox();
  expect(box.width, "wide enough to be the cluster").toBeGreaterThan(40);
  expect(box.height, "and tall enough").toBeGreaterThan(40);

  await there.focus();
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("sky-stop");
});

test("the sky is dark, and says so to the cursor", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSky(page);

  // A full-bleed dark region has to carry `dark-surface`, or nav.js's
  // cursor stays dark over it and is invisible.
  await expect(page.locator(".sky")).toHaveClass(/dark-surface/);
  const tone = await page.evaluate(() => {
    const paint = getComputedStyle(document.querySelector(".sky")).backgroundColor;
    const [r, g, b] = paint.match(/\d+/g).map(Number);
    return (r + g + b) / 3;
  });
  expect(tone, "the sky should be nearly black").toBeLessThan(30);

  // And there are particles drawn on it, white and blue.
  const lit = await page.evaluate(() => {
    const canvas = document.querySelector(".sky-field");
    const paint = canvas.getContext("2d");
    const shot = paint.getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0, blue = 0;
    for (let n = 0; n < shot.length; n += 4) {
      const light = (shot[n] + shot[n + 1] + shot[n + 2]) / 3;
      if (light > 60) bright++;
      if (shot[n + 2] > shot[n] + 24) blue++;
    }
    return { bright: bright, blue: blue };
  });
  expect(lit.bright, "there should be stars").toBeGreaterThan(200);
  expect(lit.blue, "and some of them blue").toBeGreaterThan(50);
});

test("without the script the page is the plain list of theories", async ({ page }) => {
  await page.route("**/starfield.js", (route) => route.abort());
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => document.body.classList.contains("starred"))).toBe(false);
  expect(await page.locator(".sky").count(), "no sky is drawn").toBe(0);
  const rows = page.locator(".work-row");
  expect(await rows.count()).toBeGreaterThan(2);
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".page-content h1")).toBeVisible();
});

test("with animation turned off the sky does not creep on its own", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await waitForSky(page);
  await page.waitForTimeout(700);

  const before = await skyNow(page);
  await page.waitForTimeout(1300);
  const after = await skyNow(page);
  const both = Object.keys(before).filter((k) => after[k]);
  expect(both.length, "something should be there both times").toBeGreaterThan(0);
  both.forEach((k) => {
    expect(
      Math.hypot(after[k].x - before[k].x, after[k].y - before[k].y),
      "it should stand still until it is travelled through"
    ).toBeLessThan(2);
  });

  // Still fully readable, though: it is held still, not switched off.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await page.waitForTimeout(900);
  expect(await page.locator(".sky-readout").textContent()).toMatch(/\d\d \/ \d\d/);
});
