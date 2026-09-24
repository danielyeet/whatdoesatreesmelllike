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
const TALE = "/houses/tale-parfums.html";
const TOMBSTONE = "/houses/tombstone.html";
const QIMU = "/houses/qimu-and-musicians.html";
const SHEET = "/categories/scent-descriptions.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* NINE HOUSES, IN THE ORDER THEY ARE NUMBERED. Tale Parfums is the
   seventh, Tombstone the eighth and Qimu & Musicians the ninth — and the
   chain stops at nine for now, at the owner's word. The sheet is the way in
   to all of them, and a house that is not on it cannot be reached from
   the category at all. The ORDER matters as much as the names: the
   contact sheet's report says the pictures run in order down the page,
   and every house's own kicker says which number it is. */
test("all nine houses stand on the contact sheet, in their own order",
  async ({ page }) => {
  await page.goto(SHEET);

  const names = await page.$$eval(".sheet-name", (all) =>
    all.map((n) => n.textContent.trim()));
  expect(names).toEqual([
    "Pineward", "ADAR", "Almost Human", "Ataraxia", "Grande Parfums", "Les Abstraits",
    "Tale Parfums", "Tombstone", "Qimu & Musicians",
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
    "../houses/tale-parfums.html",
    "../houses/tombstone.html",
    "../houses/qimu-and-musicians.html",
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
  ["Tale Parfums", TALE, 4],
  ["Tombstone", TOMBSTONE, 5],
  ["Qimu & Musicians", QIMU, 4],
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
  await page.route("**/tale.js", (route) => route.abort());

  for (const [url, parts] of [[ATARAXIA, 5], [GRANDE, 15], [ABSTRAITS, 4], [TALE, 4], [TOMBSTONE, 5], [QIMU, 4]]) {
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
  // their notes, and kept the WRITING. Les Abstraits' writing arrived
  // on 2026-09-23, so it is Ataraxia alone that still says on every
  // part that the writing has not arrived. Tombstone arrived the same
  // way on 2026-09-23 and was written on 2026-09-24 — see its own test.
  for (const [url, parts] of [[ATARAXIA, 5]]) {
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

  // And the written houses have neither.
  for (const url of [GRANDE, ABSTRAITS]) {
    await page.goto(url);
    await expect(page.locator(".human-waiting"), url).toHaveCount(0);
    await expect(page.locator(".human-untitled"), url).toHaveCount(0);
  }
});

// ============================================================
// LES ABSTRAITS, WRITTEN — 2026-09-23
// ============================================================

/* THE LAST WORD OPENS A NEW WINDOW. The owner asked for it in capitals:
   "CLAUDE MAKE THIS OPEN A NEW WINDOW". So the link to Antoine Lie's
   own paragraph is checked for the thing that makes that true — a
   target of its own — and for the `noopener` a link into a new window
   should always carry. */
test("Les Abstraits ends with Antoine Lie's paragraph, in a new window",
  async ({ page }) => {
  await page.goto(ABSTRAITS);
  const link = page.locator(".human-after a");
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "https://lesabstraits.com/pages/about");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  // It is the LAST thing written on the page: after every fragrance.
  const after = await page.evaluate(() => {
    const parts = document.querySelectorAll(".human-part");
    const last = parts[parts.length - 1];
    return !!(last.compareDocumentPosition(document.querySelector(".human-after"))
      & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(after, "the paragraph should come after the fragrances").toBe(true);
});

/* THE DRAWING IN DES CENDRES. The owner wrote "(claude, maybe try to
   generate a picture of this)" in the middle of the writing. That was a
   note to whoever built the page, not something for the reader — so it
   must NOT be printed, and the drawing must stand where it was, and have
   actually loaded. */
test("Des Cendres carries its drawing, and not the note that asked for it",
  async ({ page }) => {
  await page.goto(ABSTRAITS + "#part-02");
  await page.waitForTimeout(600);
  const text = await page.locator("#part-02").textContent();
  expect(text.toLowerCase()).not.toContain("claude");
  const scene = page.locator("#part-02 .human-scene img");
  await expect(scene).toHaveCount(1);
  const loaded = await scene.evaluate((img) => img.complete && img.naturalWidth > 0);
  expect(loaded, "the drawing should load").toBe(true);
  // Straight after the scenario it draws, and before the notes of it.
  const before = await page.evaluate(() => {
    const fig = document.querySelector("#part-02 .human-scene");
    return fig.previousElementSibling.textContent.trim().endsWith("That is what this smells like.");
  });
  expect(before, "it should stand after the paragraph it pictures").toBe(true);
});

// ============================================================
// TALE PARFUMS — 2026-09-23
// ============================================================

/* ALPHABETICAL, which the owner asked for: "Order them alphabetically."
   Compared with the list SORTED rather than a list written out again,
   for the reason Grande Parfums' test gives. And the four the owner
   named, no more and no fewer. */
test("Tale Parfums carries its four, in alphabetical order", async ({ page }) => {
  await page.goto(TALE);
  const names = await page.$$eval(".human-part .human-title",
    (all) => all.map((n) => n.textContent.trim()));
  expect([...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })))
    .toEqual(names);
  expect([...names].sort()).toEqual(["Bad Lily", "Fleurt", "Rouse", "Water Me"]);
  const numbers = await page.$$eval(".human-part .human-no", (all) => all.map((n) => n.textContent.trim()));
  expect(numbers).toEqual(["01", "02", "03", "04"]);
  // Bad Lily's dry down is a heading with nothing under it yet, and it
  // says so rather than being left blank or being filled in.
  await expect(page.locator("#part-01 .human-waiting")).toHaveCount(1);
  await expect(page.locator(".human-part .human-waiting")).toHaveCount(1);
});

/* EVERY PICTURE IS THERE: three to a fragrance, the house's own, and
   the drawing on the label as the small square in the list. And NOT the
   one the owner marked "dont use". */
test("Tale Parfums shows all twelve of its pictures, and not the one marked don't use",
  async ({ page }) => {
  await page.goto(TALE);
  await page.waitForTimeout(600);
  const plates = await page.$$eval(".human-plate img", (all) =>
    all.map((img) => ({ src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 })));
  expect(plates.length).toBe(12);
  plates.forEach((one) => expect(one.ok, `${one.src} should load`).toBe(true));
  const thumbs = await page.$$eval(".human-thumb img", (all) => all.map((img) => img.getAttribute("src")));
  thumbs.forEach((src) => expect(src, "the list shows each label's drawing").toMatch(/ 2\.webp$/));
  const every = await page.$$eval("img", (all) => all.map((img) => img.getAttribute("src")));
  every.forEach((src) => expect(src).not.toContain("dont use"));
});

/* THE PAGE IS DRAWN BY HAND. "simple and very 'drawn by hand' ...
   almost childish", after the label drawings.

   What is checked is what can be: that the doodles are THERE, that all
   four emblems are among them, that each one is drawn with curves and
   not with straight lines (a straight line is a line a computer drew),
   and that NONE OF THEM STANDS OVER THE WRITING — they are in the
   margins, where a person doodles. */
test("the doodles are in the margins, curved, and all four emblems are there",
  async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await page.goto(TALE);
  await page.waitForTimeout(800);

  const seen = await page.evaluate(() => {
    const column = document.querySelector(".human-parts").getBoundingClientRect();
    const textLeft = column.left + 64, textRight = column.right - 64;
    const all = [...document.querySelectorAll(".tale-doodles .tale-doodle")];
    return {
      // The lily is the house's mark and stands at the head, so the
      // four are counted across the head and the margins together.
      kinds: [...new Set([...document.querySelectorAll(".tale-doodle")].map((svg) => svg.dataset.kind))],
      count: all.length,
      over: all.filter((svg) => {
        const b = svg.getBoundingClientRect();
        return b.right > textLeft && b.left < textRight;
      }).length,
      straight: all.filter((svg) =>
        [...svg.querySelectorAll("path")].some((p) => /L/.test(p.getAttribute("d")))).length,
      head: document.querySelectorAll(".tale-head-doodle .tale-doodle[data-kind='lily']").length,
    };
  });
  expect(seen.count, "there should be doodles down the margins").toBeGreaterThan(6);
  ["sweet", "rose", "sprout", "lily"].forEach((k) =>
    expect(seen.kinds, `the ${k} should be among them`).toContain(k));
  expect(seen.over, "no doodle may stand over the writing").toBe(0);
  expect(seen.straight, "every line is drawn curved").toBe(0);
  expect(seen.head, "the house's lily stands at the head").toBe(1);
  expect(errors).toEqual([]);
});

/* THEY DRAW THEMSELVES IN, and they BOIL under the hand: a doodle near
   the pointer is redrawn a few times a second, each time a little
   differently, and holds still again once the pointer has gone. */
test("a doodle draws itself in, and boils under the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(TALE);
  await page.waitForTimeout(2600);

  const mark = page.locator(".tale-mark");
  await expect(mark).toHaveClass(/tale-drawn/);
  const dash = await mark.locator("path").first().evaluate((p) => getComputedStyle(p).strokeDashoffset);
  expect(parseFloat(dash), "drawn all the way in").toBeLessThan(0.01);

  const box = await mark.boundingBox();
  const shape = () => mark.locator("path").nth(1).getAttribute("d");
  await page.mouse.move(40, 880);
  await page.waitForTimeout(400);
  const still = await shape();
  await page.waitForTimeout(400);
  expect(await shape(), "away from the pointer it holds still").toBe(still);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const seen = new Set();
  for (let i = 0; i < 8; i++) { seen.add(await shape()); await page.waitForTimeout(90); }
  expect(seen.size, "near the pointer it is drawn again and again").toBeGreaterThan(1);

  await page.mouse.move(40, 880);
  await page.waitForTimeout(500);
  const settled = await shape();
  await page.waitForTimeout(500);
  expect(await shape(), "and holds still once the pointer has gone").toBe(settled);
});

/* ON A PHONE there are no margins, so there are no margin doodles —
   and the house's lily still stands at the head, clear of the name. */
test("on a phone Tale keeps its lily and nothing stands over the writing",
  async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(TALE);
  await page.waitForTimeout(900);
  await expect(page.locator(".tale-doodles .tale-doodle")).toHaveCount(0);
  const clear = await page.evaluate(() => {
    const lily = document.querySelector(".tale-mark").getBoundingClientRect();
    const name = document.querySelector(".human-head h1").getBoundingClientRect();
    const kicker = document.querySelector(".human-kicker").getBoundingClientRect();
    const apart = (a, b) => a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right;
    return { name: apart(lily, name), kicker: apart(lily, kicker), wide: document.documentElement.scrollWidth - innerWidth };
  });
  expect(clear.name, "the lily should not stand over the name").toBe(true);
  expect(clear.kicker, "nor over the line above it").toBe(true);
  expect(clear.wide, "and the page should not scroll sideways").toBe(0);
});

/* THE LINES ARE STRAIGHT. The owner, on the first version: "not make it
   as hand drawn as you did it ... make the lines straight and keep the
   images as they are." Every rule on the page was a drawn wave; none
   may be now. The pictures keep their uneven corners and their tape. */
test("Tale's rules are straight, and its pictures are still pinned on", async ({ page }) => {
  await page.goto(TALE);
  const seen = await page.evaluate(() => {
    const wavy = [...document.querySelectorAll(".tale-page *")].filter((el) => {
      const cs = getComputedStyle(el);
      return /svg\+xml/.test(cs.backgroundImage) && !el.matches(".human-no, .human-section-mark");
    }).map((el) => el.className);
    const part = getComputedStyle(document.querySelector(".human-part"));
    const img = getComputedStyle(document.querySelector(".human-plate > img"));
    const tape = getComputedStyle(document.querySelector(".human-plate"), "::before");
    return { wavy, rule: part.borderBottomStyle, tilt: img.transform, tape: tape.content };
  });
  expect(seen.wavy, "no drawn waves left").toEqual([]);
  expect(seen.rule, "each fragrance is ruled off with a straight line").toBe("solid");
  expect(seen.tilt, "the pictures keep their tilt").not.toBe("none");
  expect(seen.tape, "and their tape").toBe('""');
});

/* IT COMES IN, IT DOES NOT FLICK. "fix the page so that it doesnt just
   randomly flick into the handwritten ... page; I want it to be animated
   in." It used to be drawn in the site's own face and then jump when the
   handwriting arrived. So: the name is not visible at all until the
   page's script has brought it in, and it fades rather than appearing. */
test("Tale comes in rather than flicking into being", async ({ page }) => {
  await page.addInitScript(() => {
    window.__seen = [];
    const t0 = performance.now();
    (function tick() {
      const h1 = document.querySelector(".human-head h1");
      if (h1) {
        let o = 1;
        for (let el = h1; el && el.nodeType === 1; el = el.parentElement) {
          o *= parseFloat(getComputedStyle(el).opacity);
        }
        window.__seen.push({ o, held: document.documentElement.classList.contains("tale-coming") });
      }
      if (performance.now() - t0 < 3500) requestAnimationFrame(tick);
    })();
  });
  await page.goto(TALE);
  await page.waitForTimeout(3800);
  const seen = await page.evaluate(() => window.__seen);
  expect(seen.filter((s) => s.held && s.o > 0.01).length,
    "nothing is shown while the page is held back").toBe(0);
  const between = seen.filter((s) => s.o > 0.05 && s.o < 0.95).length;
  expect(between, "it fades in over several frames rather than appearing").toBeGreaterThan(3);
  expect(seen[seen.length - 1].o, "and ends fully there").toBeGreaterThan(0.99);
});

// ============================================================
// TALE, IN THE SITE'S OWN FACE — 2026-09-23, later
// ============================================================

/* "for the tale parfums, make the font the same as normal please. the
   other stuff keep." Every line of type on the page is set exactly as
   on Les Abstraits, the page no longer asks for either handwriting
   face — and the doodles, the tape and the loops are all still there. */
test("Tale is set in the site's own face, and keeps its drawings", async ({ page }) => {
  const faces = async (url) => {
    await page.goto(url);
    await page.waitForTimeout(2600);
    return page.evaluate(() => {
      const of = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).fontFamily + " " + getComputedStyle(el).fontSize : null;
      };
      return {
        h1: of(".human-head h1"), title: of(".human-title"), text: of(".human-intro .human-text p"),
        no: of(".human-no"), kicker: of(".human-kicker"),
        asked: [...document.querySelectorAll('link[href*="fonts.googleapis"]')].map((l) => l.href).join(" "),
      };
    });
  };
  const normal = await faces(ABSTRAITS);
  const tale = await faces(TALE);
  expect(tale.asked, "no handwriting face is loaded").not.toMatch(/Gochi|Patrick/);
  for (const key of ["h1", "title", "text", "no", "kicker"]) {
    expect(tale[key], `Tale's ${key} should be set as it is everywhere else`).toBe(normal[key]);
  }
  await expect(page.locator(".tale-doodle").first()).toBeAttached();
  const kept = await page.evaluate(() => ({
    tape: getComputedStyle(document.querySelector(".human-plate"), "::before").content,
    loop: getComputedStyle(document.querySelector(".human-no")).backgroundImage,
  }));
  expect(kept.tape, "the tape stays").toBe('""');
  expect(kept.loop, "and the loop round each number").toMatch(/svg/);
});

// ============================================================
// TOMBSTONE AND QIMU & MUSICIANS — 2026-09-23
// ============================================================

/* TOMBSTONE: five, in alphabetical order, each with the owner's two
   pictures — the bottle, and the house's card for it — every one of
   which loads. */
test("Tombstone carries its five, in alphabetical order, with both pictures each",
  async ({ page }) => {
  await page.goto(TOMBSTONE);
  await page.waitForTimeout(700);
  const names = await page.locator(".human-part .human-title").allTextContents();
  expect(names).toEqual(["3 Feet 5", "Evergrow", "No Need to Come By", "Sing at My Funeral", "Sweet Coffin"]);
  const plates = await page.$$eval(".human-plate img", (all) =>
    all.map((img) => ({ src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 })));
  expect(plates.length, "two pictures to a fragrance").toBe(10);
  plates.forEach((one) => expect(one.ok, `${one.src} should load`).toBe(true));
  await expect(page.locator(".human-kicker")).toHaveText("Scent descriptions · 08");
});

/* QIMU & MUSICIANS: four, in the order the owner numbered them. Guitarist and
   Vocal were written on 2026-09-24 in three stages each; Drummer still
   says exactly what the owner asked it to, and Bassist is theirs to
   write. The introduction says, in the owner's words, that it will be
   written later. */
test("Qimu & Musicians carries its four: two written, one coming soon, one waiting",
  async ({ page }) => {
  await page.goto(QIMU);
  await page.waitForTimeout(700);
  const names = await page.locator(".human-part .human-title").allTextContents();
  expect(names).toEqual(["Guitarist", "Vocal", "Bassist", "Drummer"]);
  const plates = await page.$$eval(".human-plate img", (all) =>
    all.map((img) => ({ src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 })));
  expect(plates.length).toBe(4);
  plates.forEach((one) => expect(one.ok, `${one.src} should load`).toBe(true));
  for (const n of [0, 1]) {
    const stages = await page.locator(".human-part").nth(n).locator(".human-stage").allTextContents();
    expect(stages, names[n]).toEqual(["Top", "Mid", "Dry Down"]);
  }
  await expect(page.locator(".human-part").nth(0).locator(".human-text")).toContainText("my top fig leaf fragrance");
  await expect(page.locator(".human-part").nth(1).locator(".human-text")).toContainText("the scene after a concert");
  const bassist = (await page.locator(".human-part").nth(2).locator(".human-text p").first().textContent()).trim();
  expect(bassist, "Bassist is the owner's to write").toMatch(/has not arrived yet/);
  const drummer = (await page.locator(".human-part").nth(3).locator(".human-text p").first().textContent()).trim();
  expect(drummer).toBe("Description coming soon.");
  await expect(page.locator("#introduction-name + .human-text")).toHaveText("I will write it later.");
  await expect(page.locator(".human-head h1 em")).toHaveText("A house of music and fragrance");
  await expect(page.locator(".human-kicker")).toHaveText("Scent descriptions · 09");
});

/* TOMBSTONE, WRITTEN — 2026-09-24. Three things the owner asked for in
   so many words: "selectively linear" in bold, the house's own site
   linked, and "exclusion zone" given its definition when it is pointed
   at. And 3 Feet 5 says the rest of it will be filled in later. */
test("Tombstone is written, with its bold, its link and a definition on hover",
  async ({ page }) => {
  await page.goto(TOMBSTONE);
  await expect(page.locator(".human-head h1 em")).toHaveText("A house that expanded on death");
  await expect(page.locator(".human-intro strong, #introduction-name ~ .human-text strong").first())
    .toHaveText("selectively linear");
  const site = page.locator("a[href='https://tombstonefragrances.shop']");
  await expect(site).toHaveCount(1);
  await expect(site).toHaveAttribute("target", "_blank");
  await expect(site).toHaveAttribute("rel", /noopener/);

  // Only 3 Feet 5 still waits, and it says what for.
  await expect(page.locator(".human-part .human-waiting")).toHaveCount(1);
  await expect(page.locator("#part-01 .human-waiting")).toContainText("filled in later");
  for (const id of ["#part-02", "#part-03", "#part-04", "#part-05"]) {
    expect((await page.locator(id + " .human-text").textContent()).trim().length, id).toBeGreaterThan(400);
  }

  // The definition: there when pointed at, and not before.
  const part = page.locator("#part-02");
  await part.locator("summary").click();
  const term = part.locator(".human-define");
  await expect(term).toHaveText("exclusion zone");
  await expect(term).toHaveAttribute("data-define", /closed off/);
  const shown = () => term.evaluate((el) => +getComputedStyle(el, "::after").opacity);
  await page.mouse.move(5, 5);
  expect(await shown()).toBeLessThan(0.05);
  await term.scrollIntoViewIfNeeded();
  await term.hover();
  await expect.poll(shown).toBeGreaterThan(0.95);
  // The request itself was not printed.
  expect(await page.locator("body").textContent()).not.toContain("give the definition");
});

/* THE WAY ON, FROM HOUSE TO HOUSE: every house's last link points at the
   next one, and the ninth wraps round to the first. */
test("the houses are chained one to the next, and the last wraps round", async ({ page }) => {
  const order = ["pineward", "adar", "almost-human", "ataraxia", "grande-parfums",
    "les-abstraits", "tale-parfums", "tombstone", "qimu-and-musicians"];
  for (let i = 0; i < order.length; i++) {
    await page.goto(`/houses/${order[i]}.html`);
    const on = page.locator(".human-on, .pine-on, .adar-on").last();
    const href = await on.getAttribute("href");
    expect(href, `${order[i]} leads on`).toBe(`${order[(i + 1) % order.length]}.html`);
  }
});

// ============================================================
// THE WAY IN — every house, 2026-09-23
// ============================================================

/* "It just kinda blinks on the screen and then thats it." Every house
   now eases in: its contents come up over several frames, from nothing
   to whole — and its GROUND is there from the first frame, so the dark
   houses never flash white on the way. */
test("every house eases in rather than blinking on", async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.__seen = [];
    const t0 = performance.now();
    (function tick() {
      if (document.body) window.__seen.push(parseFloat(getComputedStyle(document.body).opacity));
      if (performance.now() - t0 < 1800) requestAnimationFrame(tick);
    })();
  });
  for (const url of ["/houses/pineward.html", "/houses/adar.html", "/houses/almost-human.html",
    ATARAXIA, GRANDE, ABSTRAITS, TOMBSTONE, QIMU, "/individual-fragrances/individual-fragrances.html"]) {
    await page.goto(url);
    await page.waitForTimeout(2000);
    const seen = await page.evaluate(() => window.__seen);
    expect(Math.min(...seen), `${url} should start faint`).toBeLessThan(0.3);
    expect(seen.filter((o) => o > 0.1 && o < 0.9).length,
      `${url} should come up over several frames`).toBeGreaterThan(3);
    expect(seen[seen.length - 1], `${url} should end whole`).toBe(1);
  }
});

test("a dark house keeps its dark ground while it eases in", async ({ page }) => {
  // The fade is slowed right down so the test can look at it: the body
  // is all but invisible, and what shows is the ground.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "body { animation-duration: 60s !important; }";
      document.head.appendChild(style);
    });
  });
  await page.goto("/houses/adar.html");
  await page.waitForTimeout(800);
  const shot = await page.screenshot();
  const light = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = "data:image/png;base64," + data;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
    return sum / (d.length / 4);
  }, shot.toString("base64"));
  expect(light, "the window should be ADAR's dark, not white").toBeLessThan(40);
});

/* WITH ANIMATION TURNED OFF, a house is simply there. */
test("with animation turned off a house does not fade in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(TOMBSTONE);
  const o = await page.evaluate(() => getComputedStyle(document.body).opacity);
  expect(o).toBe("1");
});
