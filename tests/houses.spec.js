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

const ATARAXIA = "/works/ataraxia.html";
const GRANDE = "/works/grande-parfums.html";
const ABSTRAITS = "/works/les-abstraits.html";
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
    "../works/pineward.html",
    "../works/adar.html",
    "../works/almost-human.html",
    "../works/ataraxia.html",
    "../works/grande-parfums.html",
    "../works/les-abstraits.html",
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

/* ATARAXIA'S CHURCHYARD IS DRAWN, AND EVERY STANDING FITS THE MARGIN.

   The fault this exists for is the one it was built with. A standing
   was sized first and put in the margin afterwards, so on a 1280
   window every statue was up to 205px wide in a margin 170px across:
   its inner side fell in the band where the column rule quietens
   everything down to a twentieth, and half of every angel simply was
   not drawn. It read as a smear rather than as a figure.

   SO THE INVARIANT IS EXACT: a standing fits in the CLEAR part of the
   margin, and no ink of it lands in the quiet band at all. The
   drawing's own two numbers say where that band is, and they are one
   decision — EASED_IN is how wide it is, and `build` hands a standing
   the margin less EASED_IN.

   IT SAMPLES DOWN THE WHOLE PAGE rather than the first screen. Only
   two standings are on screen at once and how wide those two happen to
   be is the seed's business: measured on the first screen alone the
   fault shows nothing at all. Over eight screens it is unmissable —
   532 pixels of ink in the band with the fault, and 0 with it fixed. */
test("the churchyard is drawn, and every standing fits its margin",
  async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto(ATARAXIA);
  await page.waitForTimeout(1400);

  const sample = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const ratio = el.width / window.innerWidth;
    const edge = (window.innerWidth - 940) / 2;   // COLUMN in ataraxia.js
    const from = edge - 34, to = window.innerWidth - edge + 34;  // EASED_IN
    let clear = 0, quiet = 0;
    for (let i = 0; i < im.length; i += 4) {
      if (im[i + 3] <= 10) continue;
      const x = ((i / 4) % el.width) / ratio;
      if (x > from && x < to) quiet += 1; else clear += 1;
    }
    return [clear, quiet];
  });

  let clear = 0, quiet = 0;
  for (let n = 0; n < 8; n++) {
    await page.evaluate((y) => window.scrollTo(0, y), n * 700);
    await page.waitForTimeout(320);
    const [c, q] = await sample();
    clear += c;
    quiet += q;
  }

  expect(clear, "there should be a churchyard at all").toBeGreaterThan(6000);
  expect(quiet, `ink in the quiet band: ${quiet}`).toBeLessThan(60);

  expect(errors).toEqual([]);
});

/* AND NOTHING IN IT MOVES, which is the house's name said as a
   behaviour. Ataraxia is the old word for a mind with nothing
   troubling it: Almost Human's crowd keeps a pixel of drift so it is
   never quite still, and this page deliberately keeps none.

   Measured with the pointer away, so the halo is not what is being
   counted. The light crossing the window changes how PLAINLY things
   are drawn, which moves the count a little; a speck that wandered
   would move it far more. */
test("nothing in the churchyard drifts", async ({ page }) => {
  await page.goto(ATARAXIA);
  await page.waitForTimeout(1400);

  const shot = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const on = [];
    for (let i = 3; i < im.length; i += 4) if (im[i] > 10) on.push(i);
    return on;
  });

  const first = await shot();
  await page.waitForTimeout(900);
  const then = await shot();

  const was = new Set(first);
  const still = then.filter((i) => was.has(i)).length;
  const share = still / Math.max(1, Math.max(first.length, then.length));
  // A stone that has not moved is the same pixels a second later. The
  // light only changes how darkly they are drawn, and a speck has to
  // fall under the floor entirely to leave this count.
  expect(share, `${(share * 100).toFixed(1)}% of the ink stayed put`)
    .toBeGreaterThan(0.93);
});

/* THE HALO — the one thing on that page that answers the hand. It
   comes up over the nearest standing and nowhere else, so what this
   measures is the ink in the margin going UP when the pointer arrives
   there and back down when it leaves. */
test("a halo comes up under the pointer, and goes again", async ({ page }) => {
  await page.goto(ATARAXIA);
  await page.waitForTimeout(1500);

  const ink = () => page.evaluate(() => {
    const el = document.querySelector(".human-field");
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    let n = 0;
    for (let i = 3; i < im.length; i += 4) if (im[i] > 10) n += 1;
    return n;
  });

  // Somewhere a statue actually stands, read off the drawing's own
  // numbers rather than guessed: the first standing on the page.
  const away = await ink();
  await page.mouse.move(70, 300);
  await page.waitForTimeout(700);
  const near = await ink();
  await page.mouse.move(640, 700);
  await page.waitForTimeout(900);
  const gone = await ink();

  expect(near, `away ${away}, near ${near}`).toBeGreaterThan(away);
  expect(gone, `near ${near}, gone ${gone}`).toBeLessThan(near);
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
  for (const [url, parts] of [[ATARAXIA, 5], [ABSTRAITS, 4]]) {
    await page.goto(url);
    // Every part, and the introduction as well.
    await expect(page.locator(".human-waiting")).toHaveCount(parts + 1);
    await expect(page.locator(".human-part .human-untitled")).toHaveCount(parts);
  }

  // And the written house has none of either.
  await page.goto(GRANDE);
  await expect(page.locator(".human-waiting")).toHaveCount(0);
  await expect(page.locator(".human-untitled")).toHaveCount(0);
});
