// ============================================================
// ALMOST HUMAN (works/almost-human.html)
//
// The third house: five fragrances on a ground that is a CROWD rather
// than a wood or a void. These check the things that can be wrong
// rather than merely ugly — that the five are really five, that the
// crowd is drawn and stands where the writing is not, that the page
// spends no colour at all, that the rank reads the page from its very
// first pixel, and that none of it is needed to read the writing.
//
// The house's own name is the drawing's behaviour: a figure is nearly
// a person and never quite one, and comes home under the pointer.
// There is a test for that, and it is the one worth keeping — it is
// the whole idea of the page.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const HOUSE = "/works/almost-human.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the house is five fragrances, numbered in its own markup", async ({ page }) => {
  await page.goto(HOUSE);

  await expect(page.locator(".human-part")).toHaveCount(5);

  const numbers = await page.$$eval(".human-no", (all) =>
    all.map((n) => n.textContent.trim()));
  expect(numbers).toEqual(["01", "02", "03", "04", "05"]);

  // The ids are what the Fragrances table links at, so they have to
  // match the numbers that are read.
  const ids = await page.$$eval(".human-part", (all) => all.map((one) => one.id));
  expect(ids).toEqual(["part-01", "part-02", "part-03", "part-04", "part-05"]);
});

test("a fragrance is a title until it is opened", async ({ page }) => {
  await page.goto(HOUSE);
  const first = page.locator(".human-part").first();
  await expect(first.locator(".human-body")).toBeHidden();
  await first.locator("summary").click();
  await expect(first.locator(".human-body")).toBeVisible();
  // And the cue says which way it will go next.
  await expect(first.locator(".human-cue")).toHaveText(/close/i);
});

/* THE PLACEHOLDER IS PUT BACK WHEN A PICTURE IS NOT THERE. None of
   this house's photographs exist yet, and a browser's own broken-image
   mark reads as a fault rather than as work still to come.

   THIS IS A REGRESSION. The first go added an `error` listener and
   nothing else, which never fired: a missing picture has usually
   failed before the script has run at all, and a listener added
   afterwards is never told. Every placeholder stayed hidden behind a
   broken picture. */
test("a photograph that is not there yet leaves the hatch showing",
  async ({ page }) => {
  await page.goto(HOUSE);
  await page.waitForTimeout(600);

  const left = await page.locator(".human-part img").count();
  expect(left, "an <img> whose file is missing should be off the page").toBe(0);

  // And what is under it is the hatch, not nothing.
  const hatched = await page.locator(".human-thumb").first().evaluate((el) =>
    getComputedStyle(el).backgroundImage);
  expect(hatched).toContain("repeating-linear-gradient");
});

test("the crowd is drawn, and it keeps out of the writing's way",
  async ({ page }) => {
  // A 404 for a photograph is work still to come on this house, not a
  // fault: none of its five pictures exist yet, and the page's own
  // answer to that — take the <img> off, leave the hatch — is what the
  // test above watches. Everything else still has to be clean.
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto(HOUSE);
  await page.waitForTimeout(900);
  // Down the page, where the figures stand.
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(700);

  const ink = await page.locator(".human-field").evaluate((el) => {
    const g = el.getContext("2d");
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const ratio = el.width / window.innerWidth;
    // The column the writing stands in — style.css keeps it at 940 —
    // and the two margins either side of it.
    const column = 940 * ratio;
    const edge = Math.max(0, (el.width - column) / 2);
    let inside = 0, outside = 0;
    for (let y = 0; y < el.height; y += 3) {
      for (let x = 0; x < el.width; x += 3) {
        if (im[(y * el.width + x) * 4 + 3] > 10) {
          if (x > edge + 90 && x < el.width - edge - 90) inside++; else outside++;
        }
      }
    }
    return { inside, outside };
  });

  expect(ink.outside, "the margins should be carrying figures").toBeGreaterThan(200);
  expect(ink.inside,
    `the writing's own column should be kept quiet: ${JSON.stringify(ink)}`)
    .toBeLessThan(ink.outside * 0.2);
  expect(errors).toEqual([]);
});

/* THE HOUSE'S NAME, AS A BEHAVIOUR. Every speck stands a little way
   from where it belongs, so a figure is always nearly a person; bring
   the pointer near and they come home. Measured as the SPREAD of the
   ink about its own middle, which is the thing that changes: a figure
   that has resolved is narrower and taller-edged than the same figure
   scattered. */
test("a figure comes home under the pointer and comes apart again",
  async ({ page }) => {
  await page.goto(HOUSE);
  await page.waitForTimeout(1000);

  /** How far the ink in a box is spread about its own middle. */
  const spreadIn = (box) => page.locator(".human-field").evaluate((el, b) => {
    const g = el.getContext("2d");
    const ratio = el.width / window.innerWidth;
    const x0 = Math.round(b.x * ratio), y0 = Math.round(b.y * ratio);
    const w = Math.round(b.w * ratio), h = Math.round(b.h * ratio);
    const im = g.getImageData(x0, y0, w, h).data;
    let n = 0, sx = 0, sy = 0;
    const at = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (im[(y * w + x) * 4 + 3] > 10) { at.push([x, y]); sx += x; sy += y; n++; }
      }
    }
    if (n < 40) return null;
    // HOW WIDE THE INK LIES, taken between its third and ninety-seventh
    // percentile so one far speck cannot decide it.
    //
    // NOT the mean distance from the middle, which was the first go and
    // was nearly useless: a figure two hundred and fifty pixels tall
    // has a spread of about forty whether or not its specks have come
    // home, because its own size swamps the few pixels of stray. Its
    // WIDTH is the other way round — the figure is narrow, so the stray
    // is most of what decides it.
    const xs = at.map((one) => one[0]).sort((a, b) => a - b);
    const lo = xs[Math.floor(xs.length * 0.03)];
    const hi = xs[Math.floor(xs.length * 0.97)];
    return { spread: hi - lo, n: n };
  }, box);

  // The first figure stands in the left margin, a little below the
  // middle of the first window. Found rather than assumed: whichever
  // box of the left margin has the most ink in it is the one with a
  // figure in it.
  const box = await page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d");
    const ratio = el.width / window.innerWidth;
    const im = g.getImageData(0, 0, el.width, el.height).data;
    let best = null, most = 0;
    for (let y = 0; y + 300 * ratio < el.height; y += 40 * ratio) {
      let n = 0;
      for (let yy = y; yy < y + 300 * ratio; yy += 3) {
        for (let x = 0; x < 260 * ratio; x += 3) {
          if (im[(Math.round(yy) * el.width + Math.round(x)) * 4 + 3] > 10) n++;
        }
      }
      if (n > most) { most = n; best = y / ratio; }
    }
    return best === null ? null : { x: 0, y: best, w: 260, h: 300 };
  });
  expect(box, "there should be a figure in the left margin").toBeTruthy();

  const away = await spreadIn(box);
  expect(away, "the figure should be drawn before the pointer arrives").toBeTruthy();

  await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);
  await page.waitForTimeout(1400);
  const near = await spreadIn(box);
  expect(near).toBeTruthy();

  // A MEASURED SHARE, not merely "smaller". The ink also brightens as
  // a figure comes home, which changes which of its faintest specks
  // are drawn at all — so a figure that never resolves still reads a
  // fraction of a percent different, and `toBeLessThan(away.spread)`
  // alone passed with the resolving switched off entirely. What is
  // being claimed is that the crowd visibly draws together.
  expect(near.spread,
    `the figure should draw together under the pointer: ${away.spread.toFixed(1)} -> ${near.spread.toFixed(1)}`)
    .toBeLessThan(away.spread * 0.96);

  // AND IT NEVER FULLY RESOLVES. The house is called Almost Human; a
  // figure that came exactly home would be the wrong drawing.
  expect(near.spread / away.spread,
    "it should still be almost, not exactly").toBeGreaterThan(0.75);

  // And it comes apart again when the pointer goes. Taken to the far
  // corner of the window rather than a little way down the page: this
  // page is short, so "a little way down" can still be within reach of
  // the same figure — and a point outside the window is not a move
  // the browser will make at all.
  const far = await page.evaluate(() => [window.innerWidth - 12, 12]);
  await page.mouse.move(far[0], far[1]);
  await page.waitForTimeout(1600);
  const gone = await spreadIn(box);
  expect(gone.spread,
    `it should come apart again when the pointer goes: ${near.spread.toFixed(1)} -> ${gone.spread.toFixed(1)}`)
    .toBeGreaterThan(near.spread * 1.03);
});

/* THE RANK READS THE PAGE, NOT THE CONTENTS. The owner asked for all
   three houses' scales to start from the very top of the page rather
   than from the first fragrance, and for everything to be counted as
   passed by the foot of it. Pineward and ADAR have the same pair of
   tests. */
test("the rank fills from the first pixel of scroll, and finishes full",
  async ({ page }) => {
  await page.goto(HOUSE);
  await page.waitForTimeout(700);

  const filled = () => page.locator(".human-rank-fill").evaluate((el) => {
    const m = /scaleY\(([\d.]+)\)/.exec(el.style.transform || "");
    return m ? parseFloat(m[1]) : 0;
  });

  expect(await filled()).toBeLessThan(0.02);

  // A little way down — before the first fragrance has been reached.
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(300);
  const early = await filled();
  expect(early, "the fill should move before the first fragrance is passed")
    .toBeGreaterThan(0);
  expect(await page.locator(".human-tick.passed").count(),
    "and no fragrance should be counted yet").toBe(0);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  expect(await filled()).toBeGreaterThan(0.99);
  expect(await page.locator(".human-tick.passed").count(),
    "everything has been passed by the foot of the page").toBe(5);
});

test("nothing on the page is drawn in the accent colour", async ({ page }) => {
  await page.goto(HOUSE);
  await page.waitForTimeout(700);

  // The site's accent, deepened for white — and Pineward's green,
  // which is that page's alone. Neither is spent here.
  const spent = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll(".human-page *").forEach((el) => {
      const s = getComputedStyle(el);
      [s.color, s.backgroundColor, s.borderTopColor, s.borderLeftColor]
        .forEach((one) => {
          if (/156,\s*111,\s*53/.test(one) || /26,\s*74,\s*44/.test(one)) {
            bad.push(el.className + " " + one);
          }
        });
    });
    return bad;
  });
  // The shared chrome — the Menu trigger and the menu overlay — is the
  // known exception, and it is not inside .human-page.
  expect(spent).toEqual([]);
});

test("with animation turned off the crowd stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOUSE);
  await page.waitForTimeout(700);

  const shot = () => page.locator(".human-field").evaluate((el) => {
    const im = el.getContext("2d").getImageData(0, 0, el.width, el.height).data;
    let sum = 0;
    for (let i = 3; i < im.length; i += 4 * 37) sum += im[i];
    return sum;
  });
  const first = await shot();
  await page.waitForTimeout(900);
  expect(await shot()).toBe(first);

  // And every fragrance is on the page rather than waiting to be
  // scrolled to.
  const hidden = await page.$$eval(".human-part", (all) =>
    all.filter((one) => getComputedStyle(one).opacity !== "1").length);
  expect(hidden).toBe(0);
});

test("without the script the page is all of its writing", async ({ page, context }) => {
  await context.route("**/almost-human.js", (route) => route.abort());
  await page.goto(HOUSE);

  await expect(page.locator(".human-part")).toHaveCount(5);
  await expect(page.locator(".human-part").first()).toBeVisible();

  // The <details> still open and close on their own.
  const first = page.locator(".human-part").first();
  await expect(first.locator(".human-body")).toBeHidden();
  await first.locator("summary").click();
  await expect(first.locator(".human-body")).toBeVisible();

  // The drawing carries nothing to read, so nothing is lost with it.
  await expect(page.locator(".human-rank")).toHaveCount(0);
});
