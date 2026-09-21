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
//   4. A BUTTON BELONGS TO THE LINE ABOVE IT. Held to the right of a
//      360px card, the theories card's OPEN CALCULATOR reads as the
//      end of that line; held to the right of an 84vw one it reads as
//      the edge of the window.
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

  /* A TAP IS THE ONLY HOVER A PHONE HAS.

     THE FIGURE IS LOOKED FOR OVER THE WHOLE WINDOW, not down the left
     margin, AND IN A BOX WIDER THAN IT IS. Both follow from the same
     change: a phone has no margins, so the crowd stands in the
     clearing the page makes for it instead — anywhere across the
     width, and at its full ink rather than faded towards the reading.
     A box narrower than the cloud reads its own width whatever the
     figure does (150 wide gave 141 -> 138 with the figure plainly
     coming home in it), so the box has to hold the whole cloud.
     See WHERE A FIGURE MAY STAND in almost-human.js.

     What is being claimed has not changed: a tap draws a figure
     together. Measured both ways — with the tap it reads 185 -> 153,
     and with no tap at all, waiting exactly as long, 185 -> 187. */
  test("a tap brings a figure home", async ({ page }) => {
    await page.goto("/works/almost-human.html");
    await page.waitForTimeout(2500);

    /** The width of the ink in a box, between its fourth and
        ninety-sixth percentile. The figure is narrow, so its stray is
        most of what decides this. */
    const wide = (box) => page.evaluate((b) => {
      const el = document.querySelector(".human-field");
      const g = el.getContext("2d", { willReadFrequently: true });
      const r = el.width / parseFloat(el.style.width);
      const W = Math.round(b.w * r), H = Math.round(b.h * r);
      const d = g.getImageData(Math.round(b.x * r), Math.round(b.y * r), W, H).data;
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
    }, box);

    // Found rather than assumed: whichever box of the window has the
    // most ink in it has a figure in it.
    const box = await page.evaluate(() => {
      const el = document.querySelector(".human-field");
      const g = el.getContext("2d", { willReadFrequently: true });
      const r = el.width / parseFloat(el.style.width);
      const im = g.getImageData(0, 0, el.width, el.height).data;
      const W = Math.round(300 * r), H = Math.round(240 * r);
      const step = Math.max(1, Math.round(20 * r));
      let best = 0, at = null;
      for (let y = 0; y + H < el.height; y += step) {
        for (let x = 0; x + W < el.width; x += step) {
          let n = 0;
          for (let yy = y; yy < y + H; yy += 4) {
            for (let xx = x; xx < x + W; xx += 3) {
              if (im[(yy * el.width + xx) * 4 + 3] > 10) n += 1;
            }
          }
          if (n > best) { best = n; at = { x: x / r, y: y / r, w: 300, h: 240 }; }
        }
      }
      return at;
    });
    expect(box, "there should be a figure somewhere on the page").toBeTruthy();

    const apart = await wide(box);
    expect(apart, "the figure should be drawn before the tap").toBeGreaterThan(30);
    await page.touchscreen.tap(Math.round(box.x + box.w / 2), Math.round(box.y + box.h / 2));
    await page.waitForTimeout(1400);
    const home = await wide(box);
    expect(home, `a tap should draw it together — ${apart} to ${home}`)
      .toBeLessThan(apart * 0.9);
  });

  /* THE SECOND WAY IN STOOD AWAY FROM THE FIRST. A station carrying a
     calculator gets a boxed OPEN CALCULATOR at the foot of its card,
     put over to the right by `margin-left: auto`. On a wide window the
     card is 360px and that reads as the end of the line above it; on a
     phone the card is 84vw and the box is left with 225px of nothing
     beside it, so it belongs to the edge of the window rather than to
     the line it follows. Below 700px the `auto` goes.

     The station has to be OPENED to be measured: until then its card
     has no box at all, so reading it where it stands gives zeros at
     every width and proves nothing. Which station carries one is found
     rather than assumed, and the road is walked until it is there. */
  test("the calculator button stands under OPEN, not off to the side", async ({ page }) => {
    await serveDependenciesLocally(page);
    await page.goto("/categories/theories.html");
    await page.waitForSelector(".structure-field", { timeout: 20000 });
    await page.waitForFunction(
      () => document.querySelectorAll(".structure-stop:not(.gone)").length > 0,
      null, { timeout: 20000 });
    await page.waitForTimeout(1200);

    const which = await page.evaluate(() => [...document.querySelectorAll(".structure-stop")]
      .findIndex((s) => {
        const c = s.querySelector(".structure-card-calc");
        return c && !c.hidden;
      }));
    expect(which, "one station should carry a calculator").toBeGreaterThanOrEqual(0);

    // It stands at its own depth along the road, so go down it until
    // it is drawn strongly enough to be aimed at.
    let there = false;
    for (let step = 0; step < 40 && !there; step++) {
      there = await page.evaluate((i) => {
        const s = document.querySelectorAll(".structure-stop")[i];
        return !!s && !s.classList.contains("gone") &&
               parseFloat(s.style.opacity || "0") > 0.6;
      }, which);
      if (there) break;
      await page.evaluate(() => window.scrollBy(0, 260));
      await page.waitForTimeout(160);
    }
    expect(there, "the station should come up as the road is walked").toBe(true);

    const box = await page.locator(".structure-stop").nth(which).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1400);
    await expect(page.locator(".structure-stop.open")).toHaveCount(1);

    const at = await page.evaluate(() => {
      const card = document.querySelector(".structure-stop.open .structure-card");
      const calc = card.querySelector(".structure-card-calc");
      const open = card.querySelector(".structure-card-open");
      const l = (e) => e.getBoundingClientRect().left;
      return {
        across: Math.round(l(calc) - l(open)),
        pad: Math.round(l(calc) - card.getBoundingClientRect().left),
        wide: Math.round(calc.getBoundingClientRect().width),
      };
    });

    expect(at.wide, "the box should actually be drawn").toBeGreaterThan(40);
    // Flush with the line above it, rather than shoved across the card.
    expect(Math.abs(at.across),
      `it should start where OPEN does \u2014 ${at.across}px across`).toBeLessThanOrEqual(1);
    // And still inside the card's own padding, not against its rule.
    expect(at.pad, "it should keep the card's left padding").toBeGreaterThan(8);
  });
});
