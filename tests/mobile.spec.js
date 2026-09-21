// ============================================================
// THE SITE ON A PHONE
//
// These belong to no one feature, the way repository.spec.js doesn't:
// they are about the whole site at a phone's size. The owner asked for
// it to work on a phone "without changing its desktop version", which
// is the standing rule here — anything that would move a wide window
// is out of bounds, and every one of these was measured both ways.
//
// What they cover:
//   1. NO PAGE SCROLLS SIDEWAYS. A page a finger can drag off the edge
//      of is the plainest thing that can be wrong on a phone, and it
//      is caused by one element sticking out, which is easy to do and
//      invisible on a desktop.
//   2. THE DRAWINGS ARE ACTUALLY THERE. Almost Human's crowd was drawn
//      at a twentieth of its ink on any window narrower than the
//      writing's own column — the whole ground of that page was
//      present and invisible.
//   3. A TAP COUNTS AS THE HAND ARRIVING. There is no hovering on a
//      phone: a drag sent `pointermove` and worked, a tap sent
//      `pointerdown` and did nothing.
// ============================================================
const { test, expect, devices } = require("@playwright/test");
const { serveDependenciesLocally } = require("./helpers");

const PHONE = { width: 390, height: 844 };

const PAGES = [
  "/index.html",
  "/categories/scent-descriptions.html",
  "/categories/theories.html",
  "/categories/favorites.html",
  "/categories/researches.html",
  "/categories/other-2.html",
  "/works/pineward.html",
  "/works/adar.html",
  "/works/almost-human.html",
  "/works/theory-03.html",
  "/search.html",
  "/contact.html",
];

test.describe("on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true });

  test("no page can be dragged sideways", async ({ page }) => {
    await serveDependenciesLocally(page);
    const wide = [];
    for (const path of PAGES) {
      await page.goto(path);
      // The contact sheet lays itself out only once it has settled.
      if (path.indexOf("scent-descriptions") >= 0) {
        await page.waitForFunction(() => document.querySelector(".sheet.settled"),
          null, { timeout: 20000 });
      }
      await page.waitForTimeout(1800);
      const over = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        win: window.innerWidth,
      }));
      // A pixel of slack for rounding; anything real is tens of pixels.
      if (over.doc > over.win + 1) wide.push(`${path}: ${over.doc} > ${over.win}`);
    }
    expect(wide, `these pages scroll sideways on a phone: ${wide.join(", ")}`).toEqual([]);
  });

  /* THE GROUND OF THAT PAGE WAS INVISIBLE ON A PHONE. `lit()` takes the
     writing's own column out of the drawing, and it worked that out as
     the room left either side of a 940px column — which on a 390px
     window is none, so the quiet band covered the whole page and every
     figure, every drop of rain and every ray was drawn at a twentieth.
     Below the column it is a quarter of each side now, and above it
     nothing has changed at all. */
  test("Almost Human's crowd is drawn on a phone", async ({ page }) => {
    await page.goto("/works/almost-human.html");
    await page.waitForTimeout(2500);
    const ink = await page.evaluate(() => {
      const el = document.querySelector(".human-field");
      const g = el.getContext("2d", { willReadFrequently: true });
      const im = g.getImageData(0, 0, el.width, el.height).data;
      let n = 0;
      for (let i = 3; i < im.length; i += 4) if (im[i] > 10) n += 1;
      return n;
    });
    // With the column rule it read about 250 pixels of ink on a whole
    // phone screen; it is thousands.
    expect(ink, `the crowd should be drawn — ${ink} pixels of ink`).toBeGreaterThan(2500);
  });

  /* A TAP IS THE ONLY HOVER A PHONE HAS. */
  test("a tap brings a figure home", async ({ page }) => {
    await page.goto("/works/almost-human.html");
    await page.waitForTimeout(2500);

    /** The width of the ink in a strip of the left margin, between its
        fourth and ninety-sixth percentile. */
    const wide = (top) => page.evaluate((from) => {
      const el = document.querySelector(".human-field");
      const g = el.getContext("2d", { willReadFrequently: true });
      const r = el.width / parseFloat(el.style.width);
      const W = Math.round(130 * r), H = Math.round(200 * r);
      const d = g.getImageData(0, Math.round(from * r), W, H).data;
      const cols = new Array(W).fill(0);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) cols[x] += 1;
      }
      const tot = cols.reduce((a, c) => a + c, 0);
      if (!tot) return 0;
      let run = 0, lo = 0, hi = W - 1;
      for (let i = 0; i < W; i++) { run += cols[i]; if (run >= tot * 0.04) { lo = i; break; } }
      run = 0;
      for (let i = W - 1; i >= 0; i--) { run += cols[i]; if (run >= tot * 0.04) { hi = i; break; } }
      return Math.round((hi - lo) / r);
    }, top);

    // Found rather than assumed: whichever strip of the left margin has
    // the most ink in it has a figure in it.
    const top = await page.evaluate(() => {
      const el = document.querySelector(".human-field");
      const g = el.getContext("2d", { willReadFrequently: true });
      const r = el.width / parseFloat(el.style.width);
      const im = g.getImageData(0, 0, el.width, el.height).data;
      let best = 0, at = 0;
      for (let y = 0; y + 200 * r < el.height; y += 20 * r) {
        let n = 0;
        for (let yy = y; yy < y + 200 * r; yy += 4) {
          for (let x = 0; x < 120 * r; x += 3) {
            if (im[(Math.round(yy) * el.width + Math.round(x)) * 4 + 3] > 10) n += 1;
          }
        }
        if (n > best) { best = n; at = y / r; }
      }
      return at;
    });

    const apart = await wide(top);
    expect(apart, "there should be a figure in the left margin").toBeGreaterThan(30);
    await page.touchscreen.tap(60, Math.round(top + 100));
    await page.waitForTimeout(1400);
    const home = await wide(top);
    expect(home, `a tap should draw it together — ${apart} to ${home}`)
      .toBeLessThan(apart * 0.9);
  });
});
