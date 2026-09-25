// ============================================================
// THE NEWER HOUSES, AND THE SHAPE THEY SHARE
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

/* UNDER A HOUSE'S NAME, ONLY ITS SUBTITLE — AND THE SUBTITLE IN TITLE
   CASE. The owner: "remove the lines that are below the subtitle in the
   houses, so that lines such as 'Replace this line with your own
   standing first paragraph ...' should be removed from all of the
   houses", and "the subtitles like 'The house that smells like trees'
   should have every other word capitalized (like the titles of books in
   the real world)". So no house carries a standfirst, and every
   subtitle — on the house's page and under its picture on the Houses
   view — capitalises every word but the short joining ones. */
const HOUSE_PAGES = ["pineward", "adar", "almost-human", "ataraxia", "grande-parfums",
  "les-abstraits", "tale-parfums", "tombstone", "qimu-and-musicians"];
const SMALL = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "at", "by", "in", "of", "on", "to", "as", "up"]);
const notTitled = (line) => line.split(/\s+/).filter((word, i) => {
  const first = word.replace(/^[^\p{L}\d]+/u, "").charAt(0);
  if (!first || !/\p{L}/u.test(first)) return false;
  if (i > 0 && SMALL.has(word.toLowerCase())) return false;
  return first !== first.toUpperCase();
});
test("no house has a line under its subtitle, and every subtitle is in title case", async ({ page }) => {
  for (const house of HOUSE_PAGES) {
    await page.goto(`/houses/${house}.html`);
    await expect(page.locator(".human-standfirst, .adar-standfirst, .pine-standfirst"), `${house}: a standfirst`).toHaveCount(0);
    const subtitle = await page.locator("h1 em").allTextContents();
    subtitle.forEach((line) => expect(notTitled(line), `${house}: "${line}"`).toEqual([]));
  }
  await page.goto(SHEET);
  const says = await page.locator(".sheet-say").allTextContents();
  expect(says.length).toBe(9);
  says.forEach((line) => expect(notTitled(line), `"${line}"`).toEqual([]));
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
   measures is the ink going UP where the pointer arrives, STAYING up a
   moment after it leaves, and then coming back down.

   IT COUNTS ONE CORNER rather than the whole canvas, because the crest
   travelling along each band changes the total on its own and would
   swamp the reading. */
test("the specks kindle under the pointer, linger a moment, and go out again",
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
  // AND THEY LINGER: "a delay of the particles turning off after you
  // hover them". A moment after the pointer has gone they are still
  // burning; they go out over the next second or two. They used to go
  // out the instant it moved on.
  await page.waitForTimeout(150);
  const after = await ink();
  await page.waitForTimeout(2600);
  const gone = await ink();

  expect(near, `away ${away}, near ${near}`).toBeGreaterThan(away * 1.15);
  expect(after, `a moment after the pointer left: ${after}, against ${away} away`).toBeGreaterThan(away * 1.15);
  expect(gone, `after ${after}, gone ${gone}`).toBeLessThan(after);
  expect(gone, `and back about where it was: away ${away}, gone ${gone}`).toBeLessThan(near * 0.95);
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

/* GRANDE'S PARTICLES BURST. "a particle effect of bubbling (i dont want
   it to seem comical or drawn up like with tale), but particles that
   rise up and pop more or less into a bunch of other smaller
   particles". Read off what the page's canvas is asked to draw over a
   few seconds: the specks themselves, the finer specks of the bursts
   among them, and nothing stroked — no ring, no outline, no bubble. */
test("Grande Parfums' particles rise and burst into finer ones, with no bubble drawn", async ({ page }) => {
  await page.addInitScript(() => {
    window.__grande = { whole: 0, fine: 0, strokes: 0 };
    const P = CanvasRenderingContext2D.prototype;
    const fillRect = P.fillRect, stroke = P.stroke;
    P.fillRect = function (x, y, w) {
      if (this.canvas.classList.contains("human-field")) { if (w < 1) window.__grande.fine++; else window.__grande.whole++; }
      return fillRect.apply(this, arguments);
    };
    P.stroke = function () {
      if (this.canvas.classList.contains("human-field")) window.__grande.strokes++;
      return stroke.apply(this, arguments);
    };
  });
  await page.goto(GRANDE);
  await page.waitForTimeout(3000);
  const seen = await page.evaluate(() => window.__grande);
  expect(seen.whole, "the rising specks").toBeGreaterThan(5000);
  expect(seen.fine, "and the finer ones they burst into").toBeGreaterThan(200);
  expect(seen.strokes, "nothing drawn round them").toBe(0);
});

/* FOUR HOUSES ON PAPER OF THEIR OWN. "feel free to give them some
   colour in the background, the same way you have in the case of
   pineward (green) and tale (some muted orange) ... Qimu should be blue
   though; semi light blue." None of the four is white any more; Qimu's
   is blue — its blue channel well above its red — and still light. */
test("Grande, Les Abstraits, Tombstone and Qimu each have a paper of their own, and Qimu's is blue",
  async ({ page }) => {
  const papers = {};
  for (const url of [GRANDE, ABSTRAITS, TOMBSTONE, QIMU]) {
    await page.goto(url);
    papers[url] = await page.evaluate(() => {
      const m = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number);
      return { r: m[0], g: m[1], b: m[2] };
    });
  }
  Object.entries(papers).forEach(([url, c]) =>
    expect(c.r === 255 && c.g === 255 && c.b === 255, `${url} is still white`).toBe(false));
  const q = papers[QIMU];
  expect(q.b - q.r, `Qimu's paper ${JSON.stringify(q)}`).toBeGreaterThan(12);
  expect(q.r + q.g + q.b, "and light").toBeGreaterThan(600);
  expect(new Set(Object.values(papers).map((c) => `${c.r},${c.g},${c.b}`)).size, "four different papers").toBe(4);
});

/* TOMBSTONE: STONES, AND THEIR REFLECTION. "very dead and funerary ...
   a reflection in the design ... ephermeral". Read off the page's
   canvas: stones in the margins above the horizon, and under it the
   same margins holding their reflection — there, and fainter than
   what it reflects. EPHEMERAL: a stone does not stay — over a long
   wait what stands in the margins comes and goes. */
test("Tombstone's stones stand in the margins with their reflections under them", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(TOMBSTONE);
  const read = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const r = el.width / innerWidth;
    const d = g.getImageData(0, 0, el.width, el.height).data;
    const horizon = Math.round(innerHeight * 0.76);
    const edge = (innerWidth - 940) / 2 - 40;
    let above = 0, aboveInk = 0, below = 0, belowInk = 0;
    for (let y = 0; y < el.height; y += 2) {
      for (let x = 0; x < el.width; x += 2) {
        const cx = x / r, cy = y / r;
        if (cx > edge && cx < innerWidth - edge) continue;
        const a = d[(y * el.width + x) * 4 + 3];
        if (a <= 8) continue;
        if (cy < horizon - 3) { above++; aboveInk += a; }
        else if (cy > horizon + 3) { below++; belowInk += a; }
      }
    }
    return { above, below, aboveMean: aboveInk / Math.max(1, above), belowMean: belowInk / Math.max(1, below) };
  });
  await page.waitForTimeout(9000);
  const now = await read();
  expect(now.above, "stones stand in the margins").toBeGreaterThan(400);
  expect(now.below, "and their reflection lies under them").toBeGreaterThan(now.above * 0.2);
  expect(now.belowMean, `the reflection is fainter: ${now.belowMean.toFixed(0)} under, ${now.aboveMean.toFixed(0)} over`)
    .toBeLessThan(now.aboveMean * 0.8);
  // A stone gathers, stands and goes, and the next is a while coming:
  // over half a minute what stands in the margins waxes and wanes.
  const seen = [];
  for (let i = 0; i < 22; i++) {
    await page.waitForTimeout(1000);
    seen.push((await read()).above);
  }
  expect(Math.min(...seen), `nothing here stays: ${seen.join(" ")}`).toBeLessThan(Math.max(...seen) * 0.7);
});

/* LES ABSTRAITS: THE ARMOIRE, THE DRIP AND THE BEAKER. "an old armoire
   on one of the sides ... has some iris notes in it ... like the perfume
   belle ame ... On the other side ... a dripping effect from the top of
   the page to the bottom" — and then: "the dropping thing ... should go
   all the way down, and should note the scrolling. additionally, I want
   the puddle to be more realistic ... I want it to fall into a beaker,
   once the beaker starts overflowing, let it drip from that too". Read off
   the page's canvas: the armoire in the left margin with the iris's violet
   drawn in it; the drop gathering at the very top of the right margin —
   and gone from there once the page is scrolled, because it is the top of
   the PAGE it hangs from; nothing at the foot of the window while the page
   is at its top; and at the page's own foot a beaker, which fills with the
   drops and then overflows, dropping from its spout. */
test("Les Abstraits has its armoire with iris on one side and a drip down the whole page into a beaker on the other",
  async ({ page }) => {
  test.setTimeout(150000);
  await page.addInitScript(() => {
    window.__iris = false;
    window.__clothes = new Set();
    const P = CanvasRenderingContext2D.prototype;
    const d = Object.getOwnPropertyDescriptor(P, "strokeStyle");
    Object.defineProperty(P, "strokeStyle", {
      get() { return d.get.call(this); },
      set(v) { if (/^rgba\(112,\s*94,\s*156/.test(String(v))) window.__iris = true; d.set.call(this, v); },
    });
    // THE CLOTHES in it — a coat, a dress and a shirt — read off the
    // colours its specks are drawn in.
    const f = Object.getOwnPropertyDescriptor(P, "fillStyle");
    const CLOTHES = { "118, 104, 92": "coat", "154, 132, 168": "dress", "140, 156, 180": "shirt" };
    Object.defineProperty(P, "fillStyle", {
      get() { return f.get.call(this); },
      set(v) {
        const m = /^rgba\((\d+, \d+, \d+),/.exec(String(v));
        if (m && CLOTHES[m[1]]) window.__clothes.add(CLOTHES[m[1]]);
        f.set.call(this, v);
      },
    });
  });
  // ON A CLOCK OF THE TEST'S OWN: the drip is slow now ("make the
  // dripping slower, less filling") — a drop every two or three seconds
  // and sixteen to the brim — so the minute and more it takes to fill is
  // run through rather than waited out.
  await page.clock.install();
  await page.goto(ABSTRAITS);
  const read = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const r = el.width / innerWidth;
    const margin = (innerWidth - 940) / 2;
    const count = (x1, x2, y1, y2) => {
      const d = g.getImageData(Math.round(x1 * r), Math.round(y1 * r), Math.round((x2 - x1) * r), Math.round((y2 - y1) * r)).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 10) n++;
      return n;
    };
    return { armoire: count(0, margin, innerHeight * 0.3, innerHeight),
      top: count(innerWidth - margin, innerWidth, 0, 16),
      foot: count(innerWidth - margin, innerWidth, innerHeight - 160, innerHeight),
      drops: +(el.dataset.drops || 0), spilled: +(el.dataset.spilled || 0) };
  });
  await page.clock.runFor(2600);
  const atTop = await read();
  expect(atTop.armoire, "the armoire in the left margin").toBeGreaterThan(1500);
  expect(await page.evaluate(() => window.__iris), "with iris in it").toBe(true);
  expect(await page.evaluate(() => [...window.__clothes].sort()), "and a coat, a dress and a shirt hung in it")
    .toEqual(["coat", "dress", "shirt"]);
  expect(atTop.top, "the drop gathering at the very top of the page").toBeGreaterThan(10);
  expect(atTop.foot, "and nothing at the foot of the window while the page is at its top").toBeLessThan(20);
  // CARRIED WITH THE PAGE: scrolled, the top of the page — and the bead
  // hanging from it — has gone up off the window.
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.clock.runFor(300);
  expect((await read()).top, "the bead goes up with the page").toBeLessThan(3);
  // THE BEAKER, at the page's own foot: there, filling, and in time
  // overflowing and dropping from its spout.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.clock.runFor(600);
  const early = await read();
  expect(early.foot, "a beaker at the foot of the page").toBeGreaterThan(200);
  await page.clock.runFor(80000);
  const late = await read();
  expect(late.drops, "the drops land in it").toBeGreaterThan(early.drops + 5);
  expect(late.spilled, "and once it is full, it drips over").toBeGreaterThan(0);
  expect(late.foot, `and it fills: ${early.foot} then ${late.foot}`).toBeGreaterThan(early.foot * 1.3 + 30);
});

/* QIMU & MUSICIANS: A SCORE IN THE MARGINS. "add some complex notes;
   and some 5 lines in which they will exist ... nicely animated ...
   dont make them always 4/4 ... make it random (as long as its an
   actual used notation) ... Overall ... subtle". Read off what the
   page's canvas is asked to draw: noteheads, times other than 4/4,
   nothing written but numbers (no dynamics, no ornaments), nothing
   stronger than a little over half — and the staves CARRIED WITH THE
   PAGE: scroll it and every stave is drawn that much higher. */
test("Qimu & Musicians keeps a quiet score in its margins, carried with the page", async ({ page }) => {
  await page.addInitScript(() => {
    window.__q = { heads: 0, texts: new Set(), strongest: 0, tops: [] };
    const P = CanvasRenderingContext2D.prototype;
    const on = (c) => c.canvas.classList.contains("human-field");
    const ellipse = P.ellipse, fillText = P.fillText, translate = P.translate;
    P.ellipse = function () { if (on(this)) window.__q.heads++; return ellipse.apply(this, arguments); };
    P.fillText = function (t) { if (on(this)) window.__q.texts.add(String(t)); return fillText.apply(this, arguments); };
    P.translate = function (x, y) { if (on(this)) window.__q.tops.push(Math.round(y)); return translate.apply(this, arguments); };
    const d = Object.getOwnPropertyDescriptor(P, "fillStyle");
    Object.defineProperty(P, "fillStyle", {
      get() { return d.get.call(this); },
      set(v) {
        if (on(this)) { const m = /,\s*([\d.]+)\)$/.exec(String(v)); if (m) window.__q.strongest = Math.max(window.__q.strongest, +m[1]); }
        d.set.call(this, v);
      },
    });
  });
  await page.goto(QIMU);
  await page.waitForTimeout(3500);
  const seen = await page.evaluate(() => ({ heads: window.__q.heads, texts: [...window.__q.texts], strongest: window.__q.strongest }));
  expect(seen.heads, "notes written").toBeGreaterThan(100);
  const numbers = seen.texts.filter((t) => /^\d+$/.test(t));
  expect(numbers.some((t) => t !== "4"), `times other than 4/4: ${numbers.join(" ")}`).toBe(true);
  expect(seen.texts.filter((t) => !/^\d+$/.test(t)), "nothing written but numbers").toEqual([]);
  expect(seen.strongest, "subtle").toBeLessThanOrEqual(0.6);
  // Carried with the page.
  const before = await page.evaluate(async () => {
    window.__q.tops = [];
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return [...new Set(window.__q.tops)];
  });
  await page.evaluate(() => window.scrollBy(0, 200));
  const after = await page.evaluate(async () => {
    window.__q.tops = [];
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return [...new Set(window.__q.tops)];
  });
  expect(before.length, "staves on the window").toBeGreaterThan(0);
  expect(before.filter((y) => after.includes(y - 200)).length, `before ${before}, after ${after}`).toBeGreaterThan(0);
});

/* WITH MOTION TURNED OFF each of the four still draws its ground, and
   draws it still. */
test("with motion turned off the four new grounds are drawn and stand still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await serveDependenciesLocally(page);
  for (const url of [GRANDE, ABSTRAITS, TOMBSTONE, QIMU]) {
    await page.goto(url);
    await page.waitForTimeout(500);
    const shot = () => page.evaluate(() => {
      const el = document.querySelector(".human-field");
      const d = el.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, el.width, el.height).data;
      let n = 0, sum = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 6) { n++; sum += d[i] * (i % 997); }
      return n + ":" + sum;
    });
    const a = await shot();
    await page.waitForTimeout(700);
    const b = await shot();
    expect(Number(a.split(":")[0]), `${url} draws its ground`).toBeGreaterThan(100);
    expect(b, `${url} stands still`).toBe(a);
  }
  await context.close();
});

/* WITHOUT THE SCRIPTS the writing is still all there and still opens.
   Every drawn page on this site has this test, and it is the one that
   says the drawing is decoration rather than the page. */
test("without the scripts the new houses are all of their writing",
  async ({ page }) => {
  await page.route("**/house.js", (route) => route.abort());
  await page.route("**/ataraxia.js", (route) => route.abort());
  await page.route("**/tale.js", (route) => route.abort());
  for (const ground of ["grande", "abstraits", "tombstone", "qimu"]) {
    await page.route(`**/${ground}.js`, (route) => route.abort());
  }

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
  // on 2026-09-23, Tombstone's and four of Ataraxia's on 2026-09-24 —
  // see their own tests. What is left waiting says so: My Doll's Makeup,
  // on Ataraxia, and only it.
  for (const [url, parts] of [[ATARAXIA, 5]]) {
    await page.goto(url);
    await expect(page.locator(".human-waiting")).toHaveCount(1);
    await expect(page.locator("#part-03 .human-waiting")).toContainText("My Doll");
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
  await expect(page.locator(".human-head h1 em")).toHaveText("A House of Music and Fragrance");
  await expect(page.locator(".human-kicker")).toHaveText("Scent descriptions · 09");
});

/* TOMBSTONE, WRITTEN — 2026-09-24. Three things the owner asked for in
   so many words: "selectively linear" in bold, the house's own site
   linked, and "exclusion zone" given its definition when it is pointed
   at. And 3 Feet 5 says the rest of it will be filled in later. */
/* ATARAXIA, WRITTEN — 2026-09-24. The subtitle, the introduction and
   four of its five in the owner's words, and Spinal Fluid's spoiler:
   "a dropdown paragraph with the button saying 'spoiler alert'. And even
   when you click it, the paragraph should be blurry, covered with the
   words 'are you sure?', which if you click yes, then it will unblur it,
   and if you click no, then it will collapse it". */
test("Ataraxia is written, and Spinal Fluid's spoiler asks before it shows", async ({ page }) => {
  await page.goto(ATARAXIA);
  await expect(page.locator(".human-head h1 em")).toHaveText("A Gothic Avante Garde House");
  await expect(page.locator("#introduction-name + .human-text")).toContainText("this house has no DNA");
  for (const [id, stages, words] of [
    ["#part-01", ["Top", "Middle", "Base"], "jazz bar"],
    ["#part-02", ["Top 1", "Top 2", "Mid", "Dry Down"], "dying god"],
    ["#part-04", ["Top", "Mid", "Dry down"], "0/10, would smell again."],
    ["#part-05", ["Top", "Middle", "Base"], "Басейн Лазурний"],
  ]) {
    expect(await page.locator(id + " .human-stage").allTextContents(), id).toEqual(stages);
    await expect(page.locator(id + " .human-text")).toContainText(words);
  }
  // The request itself was not printed, nor the invisible marks the
  // writing arrived with.
  const text = await page.locator("body").textContent();
  expect(text).not.toContain("dropdown paragraph");
  expect(text).not.toContain("\u200e");

  // THE SPOILER.
  await page.locator("#part-04 > summary").click();
  await page.waitForTimeout(900);
  const spoiler = page.locator("#part-04 .human-spoiler");
  const words = spoiler.locator(".human-spoiler-text");
  await expect(spoiler.locator("summary")).toHaveText(/Spoiler alert/i);
  await expect(words).toBeHidden();
  await spoiler.locator("summary").click();
  await expect(spoiler.locator(".human-spoiler-ask")).toBeVisible();
  await expect(spoiler.locator(".human-spoiler-ask")).toContainText("Are you sure?");
  const blurred = () => words.evaluate((el) => getComputedStyle(el).filter);
  expect(await blurred(), "opened, it is blurred").toMatch(/blur/);
  // No shuts it again.
  await spoiler.locator('button[data-answer="no"]').click();
  await expect(spoiler).not.toHaveAttribute("open", /.*/);
  // Opened again, it asks again; Yes clears it.
  await spoiler.locator("summary").click();
  await expect(spoiler.locator(".human-spoiler-ask")).toBeVisible();
  await spoiler.locator('button[data-answer="yes"]').click();
  await expect(spoiler.locator(".human-spoiler-ask")).toBeHidden();
  await expect.poll(blurred).toBe("none");
  await expect(words).toContainText("Spinal fluid captures the universe really well");
});

/* VESTIBULE'S NOTES, as the owner corrected them. */
test("Vestibule carries the notes the owner corrected", async ({ page }) => {
  await page.goto(ATARAXIA);
  const also = await page.evaluate(() => window.FRAGRANCE_NOTES["ataraxia:05"].also);
  expect(also.top).toEqual(["Chocolate Bar", "Carolina Reaper"]);
  expect(also.mid).toEqual(["Chocolate Cake (Amandină)", "Red Hot Chilli", "Wasabi", "Pollen", "Antique Shop", "Turmeric", "Root Beer"]);
  expect(also.base).toEqual(["Cocoa Pod", "Edamame", "Pistachio", "Old Book", "Halva", "Potato"]);
});

test("Tombstone is written, with its bold, its link and a definition on hover",
  async ({ page }) => {
  await page.goto(TOMBSTONE);
  await expect(page.locator(".human-head h1 em")).toHaveText("A House That Expanded on Death");
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

/* ADDED LATER, 2026-09-24: Des Cendres' dry down at the end of it, and
   Water Me's middle split from a dry down of its own — the owner's words,
   verbatim, "the unchanged" and all. */
test("Des Cendres ends on its dry down, and Water Me has a Mid and a Dry Down", async ({ page }) => {
  await page.goto(ABSTRAITS);
  const last = page.locator(".human-part", { hasText: "Des Cendres" }).first().locator(".human-text > p").last();
  await expect(last).toHaveText("On the dry down, it is quite smoky, with traces of galbanum remaining, The scent profile is more or less the unchanged.");
  await page.goto(TALE);
  const water = page.locator(".human-part", { hasText: "Water Me" }).first();
  expect(await water.locator(".human-stage").allTextContents()).toEqual(["Top", "Mid", "Dry Down"]);
  await expect(water.locator(".human-text > p").last()).toHaveText(
    "As it settles it starts smelling a little like a drowned plant; a flower dying because it was watered too much. It still resembles the middle quite well though.");
});
