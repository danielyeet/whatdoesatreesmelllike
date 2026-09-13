// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: one big square, a ring of
// pictures under it that can be dragged round, and a description
// underneath. These check the switch between the two views, the ring's
// arithmetic, and that picking a picture fades rather than cuts —
// a cut is the film going past, a fade is you choosing something.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/scent-descriptions.html";

const plateName = (page) =>
  page.locator(".gallery-plate > .sheet-number").textContent();

/** Open Favorites and wait for its ring to fill. */
async function openFavorites(page) {
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForFunction(
    () => {
      const frames = [...document.querySelectorAll(".gallery-frame")];
      return frames.length > 0 && frames.every((f) => f.classList.contains("in-ring"));
    },
    null,
    { timeout: 20000 }
  );
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

test("choosing favorites takes the map away and brings the ring up", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  await openFavorites(page);

  // One view at a time: the map is gone from the page, not merely faded.
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).toBe("none");
  await expect(page.locator(".gallery-frame").first()).toBeVisible();
  await expect(page.locator(".sheet-filter", { hasText: "Favorites" })).toHaveClass(/chosen/);

  // And back again.
  await page.locator(".sheet-filter", { hasText: "Description portfolio" }).click();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display),
      { timeout: 6000 })
    .toBe("none");
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).not.toBe("none");
});

test("the big square flicks through the favourites and ends on the first", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();

  // Sample what the big square is showing, often enough to catch the
  // fast part of the run.
  const seen = [];
  for (let i = 0; i < 40; i++) {
    seen.push(await page.evaluate(() => {
      const mark = document.querySelector(".gallery-plate > .sheet-number");
      return mark ? mark.textContent : "";
    }));
    await page.waitForTimeout(70);
  }
  const distinct = new Set(seen.filter(Boolean));
  expect(distinct.size, `should flick through several, saw ${[...distinct]}`).toBeGreaterThan(2);

  await openFavorites(page);
  expect(await plateName(page), "it lands on the first").toBe("f1");
});

test("the ring stands the pictures round a circle, front to back", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const ring = await page.evaluate(() =>
    [...document.querySelectorAll(".gallery-frame")].map((f) => {
      const r = f.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top, size: r.width, fade: parseFloat(f.style.opacity) };
    })
  );

  expect(ring.length).toBeGreaterThan(4);
  // Spread across the page rather than stacked in one place.
  const xs = ring.map((r) => r.x);
  expect(Math.max(...xs) - Math.min(...xs), "the ring should be wide").toBeGreaterThan(200);
  // The three cues that make a flat circle read as a ring lying away
  // from you: size, height up the page, and how faint it is.
  const sizes = ring.map((r) => r.size);
  expect(Math.max(...sizes) / Math.min(...sizes), "nearer ones drawn larger").toBeGreaterThan(1.4);
  const fades = ring.map((r) => r.fade);
  expect(Math.min(...fades), "further ones drawn fainter").toBeLessThan(0.5);
  // The nearest picture is the lowest on the page, the furthest highest.
  const nearest = ring.reduce((a, b) => (a.size > b.size ? a : b));
  const furthest = ring.reduce((a, b) => (a.size < b.size ? a : b));
  expect(nearest.y, "the nearest should sit lowest").toBeGreaterThan(furthest.y);
});

test("picking one from the ring fades it into the big square", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  expect(await plateName(page)).toBe("f1");

  // Dispatched rather than clicked at a point: the pictures overlap in
  // the ring, so a click at a place could land on the one in front.
  await page.locator(".gallery-frame").nth(4).dispatchEvent("click");

  // Mid-change, both layers are on screen — that is what makes it a
  // fade. A cut would have one at 1 and the other at 0 throughout.
  await page.waitForTimeout(220);
  const layers = await page.evaluate(() =>
    [...document.querySelectorAll(".gallery-layer")].map((l) =>
      parseFloat(getComputedStyle(l).opacity))
  );
  const between = layers.filter((o) => o > 0.05 && o < 0.95);
  expect(between.length, `one should be coming up as the other goes: ${layers}`).toBe(2);

  await expect.poll(() => plateName(page), { timeout: 4000 }).toBe("f5");
  await expect(page.locator(".gallery-chosen-name")).toHaveText("f5");
  await expect(page.locator(".gallery-frame").nth(4)).toHaveClass(/chosen/);
});

test("the ring can be dragged round", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const where = () =>
    page.evaluate(() => {
      const f = document.querySelectorAll(".gallery-frame")[0].getBoundingClientRect();
      return f.left + f.width / 2;
    });

  const before = await where();
  // The ring sits below the fold on a short window, and a press at a
  // point outside the window is not delivered at all.
  await page.locator("#gallery-ring").scrollIntoViewIfNeeded();
  const box = await page.locator("#gallery-ring").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(box.x + box.width / 2 - i * 22, box.y + box.height / 2);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();

  const after = await where();
  expect(Math.abs(after - before), "the ring should have turned").toBeGreaterThan(60);
});

test("there is a description under the ring", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  await expect(page.locator(".gallery-note")).toBeVisible();
  const words = await page.locator(".gallery-note").textContent();
  expect(words.trim().length, "it should actually say something").toBeGreaterThan(80);
});

test("with animation turned off, favorites arrives finished", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(400);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(400);

  const inRing = await page.$$eval(".gallery-frame.in-ring", (els) => els.length);
  const frames = await page.$$eval(".gallery-frame", (els) => els.length);
  expect(inRing, "no flick to sit through").toBe(frames);
  expect(await plateName(page)).toBe("f1");
});
