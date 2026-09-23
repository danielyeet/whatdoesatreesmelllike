// ============================================================
// THE THREE NEWER HOUSES, AND THE SHAPE THEY SHARE
//
// Ataraxia (04), Grande Parfums (05) and Les Abstraits (06) arrived
// together, and together they are the reason house.js exists: the
// older three each carry their own copy of the part-opening and the
// rank, and three more copies would have been six places to fix one
// bug. These check the shared shape works on all three, and then the
// things that are true of one house only.
//
// WHAT IS NOT CHECKED HERE is what the drawings look like. The suite
// checks that things work, not that they look right.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const ATARAXIA = "/houses/ataraxia.html";
const GRANDE = "/houses/grande-parfums.html";
const ABSTRAITS = "/houses/les-abstraits.html";
const SHEET = "/categories/scent-descriptions.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* SIX HOUSES, IN THE ORDER THEY ARE NUMBERED. The sheet is the way in
   to all of them, and a house that is not on it cannot be reached from
   the category at all. The ORDER matters as much as the names: the
   contact sheet's report says the pictures run in order down the page,
   and every house's own kicker says which number it is. */
test("all six houses stand on the contact sheet, in their own order",
  async ({ page }) => {
  await page.goto(SHEET);

  const names = await page.$$eval(".sheet-name", (all) =>
    all.map((n) => n.textContent.trim()));
  expect(names).toEqual([
    "Pineward", "ADAR", "Almost Human", "Ataraxia", "Grande Parfums", "Les Abstraits",
  ]);

  // And every one of them is a link to a page that opens.
  const hrefs = await page.$$eval(".sheet-frame:not([data-open='no'])", (all) =>
    all.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual([
    "../houses/pineward.html",
    "../houses/adar.html",
    "../houses/almost-human.html",
    "../houses/ataraxia.html",
    "../houses/grande-parfums.html",
    "../houses/les-abstraits.html",
  ]);
});

/* THE ORDER THE OWNER ASKED FOR, in as many words: "Ill ask that you
   arrange them alphabetically, as I will input them non-
   alphabetically". They sent fifteen write-ups in no order at all, so
   this is the one thing about this house that could quietly be wrong
   and look fine.

   Compared with the list SORTED, rather than against a list written
   out again here: a list written out again is the same mistake twice
   if it was made once. */
test("Grande Parfums is in alphabetical order, and numbered in its markup",
  async ({ page }) => {
  await page.goto(GRANDE);

  await expect(page.locator(".human-part")).toHaveCount(15);

  const names = await page.$$eval(".human-part .human-title", (all) =>
    all.map((n) => n.textContent.trim()));
  const sorted = [...names].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
  expect(names).toEqual(sorted);
  // A number sorts before a letter, so the anniversary is first.
  expect(names[0]).toMatch(/^5 Years Anniversary/);

  const numbers = await page.$$eval(".human-part .human-no", (all) =>
    all.map((n) => n.textContent.trim()));
  expect(numbers).toEqual(names.map((_, i) => String(i + 1).padStart(2, "0")));

  // The ids are what the Fragrances table links at, so they have to
  // match the numbers that are read. repository.spec.js checks the
  // table's end of that; this is the house's end.
  const ids = await page.$$eval(".human-part", (all) => all.map((one) => one.id));
  expect(ids).toEqual(numbers.map((n) => "part-" + n));
});

/* AND THE TWO THAT HAVE NOT BEEN SMELLED are names at the foot with
   nothing behind them, the way Pineward's eight are — NOT parts with
   empty writing. A fragrance nobody has smelled has nothing to open. */
test("the two unsmelled Grande fragrances are names at the foot, not parts",
  async ({ page }) => {
  await page.goto(GRANDE);

  const waiting = await page.$$eval(".house-waiting-name", (all) =>
    all.map((n) => n.textContent.trim()));
  expect(waiting).toEqual(["Genesys", "Lounge Leather"]);

  // Neither of them is also a part, which would be the house counting
  // itself twice.
  const parts = await page.$$eval(".human-part .human-title", (all) =>
    all.map((n) => n.textContent.trim()));
  waiting.forEach((name) => expect(parts).not.toContain(name));
});

/* THE STANDOUT MARK IS DRAWN, NOT TYPED. The owner asked for "a
   handdrawn star", which a typed star character is not — and a typed
   one would be indistinguishable from this in a screenshot while being
   exactly the thing they did not ask for. So: an SVG path, on Vintage
   Memoir and on nothing else.

   The path is checked for CURVES. A star drawn with straight lines is
   a star a computer worked out; the bowed edges are the whole of what
   makes it look drawn. */
test("the standout star is a drawn path, and only Vintage Memoir has one",
  async ({ page }) => {
  await page.goto(GRANDE);

  await expect(page.locator(".human-part .human-star")).toHaveCount(1);

  const on = await page.$eval(".human-star", (star) =>
    star.closest(".human-part").querySelector(".human-title").textContent.trim());
  expect(on).toBe("Vintage Memoir");

  const d = await page.$eval(".human-star svg path", (p) => p.getAttribute("d"));
  // Quadratic curves, one per edge of a five-pointed star.
  expect((d.match(/Q/g) || []).length).toBeGreaterThanOrEqual(10);
  // And nothing in it is a straight line.
  expect(d).not.toContain("L");
});

/* THE SHARED SHAPE, ON ALL THREE. house.js gives each of them the same
   two things the older houses have their own copies of: a part that
   opens on a measured height, and the rank down the side. Run over
   every new house rather than over one, because the whole point of a
   shared script is that it is the same everywhere. */
for (const [name, url, parts] of [
  ["Ataraxia", ATARAXIA, 5],
  ["Grande Parfums", GRANDE, 15],
  ["Les Abstraits", ABSTRAITS, 4],
]) {
  test(`${name} opens a fragrance and carries a rank of ${parts}`, async ({ page }) => {
    // NOT ONE OF THESE HOUSES HAS ITS PHOTOGRAPHS YET, and every part
    // asks for the file it wants by name so it shows the moment that
    // file is there — so a 404 per picture is what a working page
    // looks like today. The same allowance Almost Human's spec makes.
    const errors = collectPageErrors(page, ["Failed to load resource"]);
    await page.goto(url);
    await page.waitForTimeout(500);

    await expect(page.locator(".human-part")).toHaveCount(parts);
    // One tick per fragrance, built by house.js rather than written in
    // the markup.
    await expect(page.locator(".human-tick")).toHaveCount(parts);
    await expect(page.locator(".human-rank")).toHaveCount(1);

    const first = page.locator(".human-part").first();
    await expect(first).not.toHaveAttribute("open", /.*/);
    await first.locator("summary").click();
    // It opens on a measured height, so it is not open in the same
    // frame it was clicked in — waited out rather than asserted at once.
    await page.waitForTimeout(1100);
    await expect(first).toHaveAttribute("open", /.*/);
    const tall = await first.locator(".human-body").evaluate(
      (el) => el.getBoundingClientRect().height);
    expect(tall, "an opened fragrance should have a height").toBeGreaterThan(40);

    expect(errors, `${name} should throw nothing`).toEqual([]);
  });
}

/* THE RANK READS THE PAGE FROM ITS VERY FIRST PIXEL, which is the one
   thing about it the owner reported as wrong on the older houses: it
   used to start at the first fragrance, so the whole introduction
   scrolled past an empty line. And it FINISHES FULL at the foot. */
test("the rank fills from the first pixel of scroll, and finishes full",
  async ({ page }) => {
  await page.goto(GRANDE);
  await page.waitForTimeout(400);

  const filled = () => page.$eval(".human-rank-fill", (el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.d;
  });

  expect(await filled()).toBeLessThan(0.02);

  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);
  const part = await filled();
  expect(part, "it should have moved off nought well before the first fragrance")
    .toBeGreaterThan(0.01);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  expect(await filled()).toBeGreaterThan(0.98);
});

/* ATARAXIA'S BANDS ARE DRAWN, AND THEY CROSS THE WHOLE WINDOW.

   This replaced a churchyard of angel statues and crosses standing
   down the two margins, and the invariant has turned over with it. The
   churchyard's rule was that NO INK may land where the reading is —
   a statue with half of it in the quiet band read as a smear rather
   than as a figure, which is the fault that test existed for.

   THE BANDS ARE THE OPPOSITE, and the owner asked for it in as many
   words: "I want them to go behind the text. Idk how but make it so
   that the readability is good." A band that stopped at the column and
   started again on the other side would not be a band. So there MUST
   be ink over the writing — and it must be much fainter there than in
   the margins, which is the whole of how the reading is kept.

   SO THIS MEASURES BOTH, and the second is the one that matters. It
   samples down the whole page rather than the first screen: which
   bands happen to be on screen at any one moment is the seed's
   business, and the quiet is a property of every one of them. */
test("the bands cross the whole window, and go quiet over the writing",
  async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto(ATARAXIA);
  await page.waitForTimeout(1400);

  // THREE ZONES, and the middle one is thrown away. The quieting eases
  // in over SOFT pixels either side of the column, so the band between
  // `edge - SOFT` and `edge` is neither full strength nor quiet and
  // says nothing either way. What is measured is the CLEAR MARGIN
  // outside it and the COLUMN PROPER inside it — where the reading
  // actually is, and where `quiet()` is at exactly its floor.
  const sample = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const ratio = el.width / window.innerWidth;
    const edge = (window.innerWidth - 940) / 2;   // COLUMN in ataraxia.js
    const soft = 96;                              // SOFT in ataraxia.js
    let clearInk = 0, clearOn = 0, quietInk = 0, quietOn = 0;
    for (let i = 0; i < im.length; i += 4) {
      const a = im[i + 3];
      if (a <= 4) continue;
      const x = ((i / 4) % el.width) / ratio;
      if (x > edge && x < window.innerWidth - edge) { quietInk += a; quietOn += 1; }
      else if (x < edge - soft || x > window.innerWidth - edge + soft) {
        clearInk += a; clearOn += 1;
      }
    }
    return { clearInk, clearOn, quietInk, quietOn };
  });

  let clearInk = 0, clearOn = 0, quietInk = 0, quietOn = 0;
  for (let n = 0; n < 8; n++) {
    await page.evaluate((y) => window.scrollTo(0, y), n * 640);
    await page.waitForTimeout(320);
    const got = await sample();
    clearInk += got.clearInk; clearOn += got.clearOn;
    quietInk += got.quietInk; quietOn += got.quietOn;
  }

  expect(clearOn, "there should be bands at all").toBeGreaterThan(4000);
  // THEY GO BEHIND THE WRITING. A drawing kept out of the middle of
  // the page is the thing that was asked NOT to happen.
  expect(quietOn, "the bands should pass behind the writing, not round it")
    .toBeGreaterThan(400);

  // AND THIS IS THE READING'S OWN GUARANTEE: what is over the writing
  // is far fainter than what is beside it. Measured as the average
  // weight of a lit pixel rather than as a count, because a count says
  // how many and this has to say how loud.
  const clear = clearInk / clearOn;
  const quiet = quietInk / quietOn;
  expect(quiet, `over the writing ${quiet.toFixed(1)}, beside it ${clear.toFixed(1)}`)
    .toBeLessThan(clear * 0.6);

  expect(errors).toEqual([]);
});

/* AND THE PAGE IS DARK GRAY, with the writing light on it. The owner
   asked for dark gray specifically, which is not ADAR's near-black
   next door, and the bands are white and additive — they need a ground
   dark enough to read as light.

   THE CONTRAST IS THE POINT of measuring it rather than the hex: a
   page turned over by redefining its five tokens can be turned
   halfway over by mistake, and light-on-light is what that looks
   like. */
test("Ataraxia is dark gray, and its writing is light on it", async ({ page }) => {
  await page.goto(ATARAXIA);
  await page.waitForTimeout(900);

  const seen = await page.evaluate(() => {
    const lum = (css) => {
      const n = css.match(/[\d.]+/g).map(Number);
      return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
    };
    return {
      ground: lum(getComputedStyle(document.body).backgroundColor),
      heading: lum(getComputedStyle(document.querySelector("h1")).color),
      reading: lum(getComputedStyle(document.querySelector(".human-text p")).color),
      dark: document.body.classList.contains("dark-surface"),
    };
  });

  // Dark, and gray rather than black: ADAR's ground is about 7.
  expect(seen.ground, `the ground reads ${seen.ground.toFixed(1)}`)
    .toBeGreaterThan(20);
  expect(seen.ground).toBeLessThan(70);
  expect(seen.heading, "the heading has to be light on it")
    .toBeGreaterThan(seen.ground + 120);
  expect(seen.reading, "and so has the reading")
    .toBeGreaterThan(seen.ground + 90);
  // A dark page has to say so, or the cursor cannot be seen on it.
  expect(seen.dark, "a dark page carries dark-surface").toBe(true);
});

/* THE KINDLE — the one thing on that page that answers the hand. The
   specks within reach of the pointer burn brighter, so what this
   measures is the ink going UP where the pointer arrives and back down
   when it leaves.

   IT COUNTS ONE CORNER rather than the whole canvas, because the crest
   travelling along each band changes the total on its own and would
   swamp the reading. */
test("the specks kindle under the pointer, and go out again",
  async ({ page }) => {
  await page.goto(ATARAXIA);
  await page.waitForTimeout(1500);

  const ink = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const ratio = el.width / window.innerWidth;
    // A box round where the pointer will be put, in canvas pixels.
    const x0 = Math.round(40 * ratio), y0 = Math.round(220 * ratio);
    const w = Math.round(320 * ratio), h = Math.round(320 * ratio);
    const im = g.getImageData(x0, y0, w, h).data;
    let n = 0;
    for (let i = 3; i < im.length; i += 4) n += im[i];
    return n;
  });

  await page.mouse.move(900, 700);
  await page.waitForTimeout(700);
  const away = await ink();
  await page.mouse.move(200, 380);
  await page.waitForTimeout(700);
  const near = await ink();
  await page.mouse.move(900, 700);
  await page.waitForTimeout(900);
  const gone = await ink();

  expect(near, `away ${away}, near ${near}`).toBeGreaterThan(away * 1.15);
  expect(gone, `near ${near}, gone ${gone}`).toBeLessThan(near);
});

/* GRANDE PARFUMS HAS A GROUND NOW, and it is the quietest one on the
   site: the owner asked for "some particles and effects... subtle
   designs please". So what is checked is that it is THERE and that it
   is SUBTLE, which are two different failures — a drift nobody can see
   is as wrong as one that fights the writing.

   The page is on the site's own paper and the specks are drawn in its
   ink, so "subtle" here means a low weight per lit pixel. */
test("Grande Parfums has a drift, and it is a quiet one", async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto(GRANDE);
  await page.waitForTimeout(1600);

  const seen = await page.evaluate(() => {
    const el = document.querySelector(".human-field");
    if (!el) return null;
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const ratio = el.width / window.innerWidth;
    let on = 0, weight = 0, top = 0, bottom = 0;
    for (let i = 0; i < im.length; i += 4) {
      const a = im[i + 3];
      if (a <= 4) continue;
      on += 1;
      weight += a;
      const y = Math.floor((i / 4) / el.width) / ratio;
      if (y < window.innerHeight / 2) top += 1; else bottom += 1;
    }
    return { on, mean: on ? weight / on : 0, top, bottom };
  });

  expect(seen, "the page should have a canvas").toBeTruthy();
  expect(seen.on, "there should be a drift at all").toBeGreaterThan(60);

  // SUBTLE. 255 is solid ink; this is dust on paper.
  expect(seen.mean, `the average speck weighs ${seen.mean.toFixed(1)} of 255`)
    .toBeLessThan(90);

  // AND IT IS SPREAD OVER THE PAGE. The first version rolled each
  // speck's lifetime apart from its speed, so a slow one lived and
  // died in thirty-six pixels and the whole drift was a smudge along
  // the bottom edge. A lifetime is worked out from the speed now.
  expect(seen.top, `${seen.top} specks in the top half, ${seen.bottom} in the bottom`)
    .toBeGreaterThan(seen.on * 0.2);

  expect(errors).toEqual([]);
});

/* WITHOUT THE SCRIPTS the writing is still all there and still opens.
   Every drawn page on this site has this test, and it is the one that
   says the drawing is decoration rather than the page. */
test("without the scripts the new houses are all of their writing",
  async ({ page }) => {
  await page.route("**/house.js", (route) => route.abort());
  await page.route("**/ataraxia.js", (route) => route.abort());

  for (const [url, parts] of [[ATARAXIA, 5], [GRANDE, 15], [ABSTRAITS, 4]]) {
    await page.goto(url);
    await expect(page.locator(".human-part")).toHaveCount(parts);
    // Nothing is hidden: the class that holds the parts back is put on
    // by house.js, and a blocked script never puts it on.
    await expect(page.locator(".human-page.human-ready")).toHaveCount(0);
    const first = page.locator(".human-part").first();
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", /.*/);
  }
});

/* A FRAGRANCE THAT IS NOT WRITTEN YET SAYS SO, in a dashed box, rather
   than standing in as prose. Two houses arrived with no writing at all
   and the temptation was to invent some; this is the guard on not
   having. */
test("an unwritten fragrance says it is unwritten", async ({ page }) => {
  // NAMED IS NOT WRITTEN, and the two came apart on 2026-09-22: the
  // owner gave Ataraxia and Les Abstraits their fragrances' names and
  // their notes, and kept the WRITING. So neither page has an Untitled
  // on it any more, and both still say on every part that the writing
  // has not arrived — which is the state this test now guards.
  for (const [url, parts] of [[ATARAXIA, 5], [ABSTRAITS, 4]]) {
    await page.goto(url);
    // Every part, and the introduction as well.
    await expect(page.locator(".human-waiting")).toHaveCount(parts + 1);
    await expect(page.locator(".human-part .human-untitled"),
      "these are named now").toHaveCount(0);
    // And every one of them is named with something that is not the
    // word the placeholder used.
    const names = await page.locator(".human-part .human-title").allTextContents();
    expect(names.length).toBe(parts);
    names.forEach((name) => {
      expect(name.trim().length, `"${name}" is not a name`).toBeGreaterThan(2);
      expect(name.trim()).not.toBe("Untitled");
    });
  }

  // And the written house has neither.
  await page.goto(GRANDE);
  await expect(page.locator(".human-waiting")).toHaveCount(0);
  await expect(page.locator(".human-untitled")).toHaveCount(0);
});

/* GRANDE'S CIRCLES.
   The owner: "i would ike you to add some animation; like circles that
   get bigger when you hoer them, and when you hover them they also gain
   particles on an outer perimiter."

   Three claims, and the third is the one that would rot quietly: the
   circles are THERE at rest, they SWELL and brighten under the hand,
   and they LET GO again. A drawing that lights up and never releases
   looks fine in a screenshot and wrong in use. */
test("a circle swells under the hand, gains a perimeter, and lets go again",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(GRANDE);
  await page.waitForSelector(".human-field");
  await page.waitForTimeout(2200);

  /** How much ink is on the ground, sampled rather than counted whole:
      this is asked thirty-odd times below and the canvas is millions of
      pixels. Every fourth pixel says the same thing far cheaper. */
  const inked = () => page.evaluate(() => {
    const c = document.querySelector(".human-field");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let n = 3; n < d.length; n += 16) if (d[n] > 6) lit += 1;
    return lit;
  });

  await page.mouse.move(2, 2);
  await page.waitForTimeout(900);
  const rest = await inked();
  expect(rest, "the circles should be drawn even at rest").toBeGreaterThan(20);

  // FIND ONE. Nothing in the page says where the circles are — they are
  // rolled from the window's own size — so the hand is walked over a
  // coarse grid and the brightest place it finds is a circle.
  const box = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  let best = null;
  for (let x = 60; x < box.w; x += Math.round(box.w / 7)) {
    for (let y = 70; y < box.h; y += Math.round(box.h / 6)) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(70);
      const now = await inked();
      if (!best || now > best.lit) best = { x, y, lit: now };
    }
  }

  await page.mouse.move(best.x, best.y);
  await page.waitForTimeout(1300);
  const held = await inked();

  // IT SWELLS AND GATHERS. Half as much ink again is a low bar on
  // purpose — what is being pinned is that something plainly happens,
  // not a number that a nudge to the tuning would break.
  expect(held, `the hand should wake a circle: ${rest} → ${held}`)
    .toBeGreaterThan(rest * 1.5);

  // AND IT LETS GO. Back towards where it started, not merely "less".
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1600);
  const gone = await inked();
  expect(gone, `and let go again: ${held} → ${gone}`).toBeLessThan(held * 0.75);

  expect(errors).toEqual([]);
});
