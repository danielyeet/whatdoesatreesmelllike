// ============================================================
// THE FRAGRANCE READER
//
// Pressing a fragrance in the Fragrances view of the contact sheet
// page used to LEAVE THE PAGE. The owner asked for it not to: "i dont
// want the page for the fragrances in SD to take you to a new page
// when you click a new fragrance. I want the fragrances to open in
// page and one by one."
//
// So these are about four things, and the first is the whole point:
// the address does not change.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/** Get to the Fragrances view, which is not what the page opens as. */
async function toTheList(page) {
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForTimeout(1600);
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  await page.waitForTimeout(1300);
}

/* IT OPENS IN PLACE. The address is what this is really about: a
   fragrance that opened by navigating would pass every other check
   here and still be the thing the owner asked to be rid of. */
test("a fragrance opens in the page, without leaving it", async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await toTheList(page);
  const was = page.url();

  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(1500);

  expect(page.url(), "it should not have gone anywhere").toBe(was);
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1);
  // And the list it came from is gone, which is the "page turns blank".
  expect(await page.evaluate(
    () => document.querySelector(".index-page").hidden), "the table should be gone")
    .toBe(true);

  expect(errors).toEqual([]);
});

/* AND IT CARRIES THE THREE THINGS THE OWNER ASKED FOR: "a picture, and
   a descripion, as well as the notes of that fragrance".

   THE WRITING IS FETCHED rather than copied. works/individual-
   fragrances.html is where a fragrance's writing lives, and this view
   lifts the part out of that page — two copies of the owner's own
   words is the one thing this site has a standing rule against. So
   what this really tests is that the fetch worked. */
test("it carries the picture, the writing and the notes", async ({ page }) => {
  await toTheList(page);
  // 03 is Haxan, whose notes are the two-part kind — the most a window
  // on this site has to render.
  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(1600);

  const reader = page.locator(".frag-reader");
  await expect(reader.locator(".frag-name")).toHaveText("Haxan");
  await expect(reader.locator(".frag-house")).toHaveText("Prissana");

  // A PICTURE, or the hatched placeholder standing in for one that is
  // not there yet — which is what every other page on this site does.
  await expect(reader.locator(".frag-plate")).toHaveCount(1);
  const plate = await reader.locator(".frag-plate").evaluate(
    (el) => ({ img: !!el.querySelector("img"), hatch: !!el.querySelector("div") }));
  expect(plate.img || plate.hatch, "there should be a picture or its placeholder").toBe(true);

  // THE WRITING, off the other page. Its text is not in this page's
  // own markup, so its being here at all is the fetch.
  const said = await reader.locator(".frag-text").textContent();
  expect(said.trim().length, "the writing should have been fetched").toBeGreaterThan(20);
  expect(said, "and it should not still be waiting on the fetch").not.toContain("Fetching");

  // THE NOTES, by the same renderer a house page uses — Haxan's two
  // halves, two headings, two sources.
  await expect(reader.locator(".frag-notes .note-half")).toHaveCount(2);
  await expect(reader.locator(".frag-notes .note-cite")).toHaveCount(2);
  await expect(reader.locator(".frag-notes .note-row")).toHaveCount(2);
});

/* THE WAY BACK, which the owner described in full: "making everything
   except the picture fade (make the picture a square) and then making
   it go recede into one of the squares (at random) of the background
   ... After being in the grid, make them fade away at once."

   THREE THINGS: the picture is taken out of the article and put on the
   window as a FLIER, it SQUARES UP on its way to a cell of the grid,
   and the list is already back behind it before it fades — which is
   the owner's "does not replay the animation". */
test("going back sends the picture into the grid, and the list is behind it",
  async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-01"]').click();
  await page.waitForTimeout(1500);

  // THE GRID IS THE PAGE'S OWN, and the reader is ruled into the same
  // squares by the same declaration — which is not a nicety, because a
  // picture recedes into ONE OF THEM and would otherwise land on
  // nothing. The two being the same number is the whole of it.
  const ruled = await page.evaluate(() => ({
    cell: getComputedStyle(document.documentElement)
      .getPropertyValue("--grid-cell").trim(),
    sheet: getComputedStyle(document.body).backgroundSize.split(",")[0].trim(),
    reader: getComputedStyle(document.querySelector(".frag-reader"))
      .backgroundSize.split(",")[0].trim(),
  }));
  expect(ruled.reader, `the sheet is ${ruled.sheet}, the reader ${ruled.reader}`)
    .toBe(ruled.sheet);
  expect(ruled.sheet).toBe(ruled.cell + " " + ruled.cell);

  const was = await page.locator(".frag-plate img, .frag-plate > div").first()
    .evaluate((el) => el.getBoundingClientRect().width);

  await page.locator(".frag-back").click();
  await page.waitForTimeout(900);

  // MID-FLIGHT. The picture is out of the article and on the window.
  const flying = await page.evaluate(() => {
    const f = document.querySelector(".frag-flier");
    if (!f) return null;
    const box = f.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      fixed: getComputedStyle(f).position === "fixed",
      listBack: !document.querySelector(".index-page").hidden,
      writingGone: +getComputedStyle(document.querySelector(".frag-in")).opacity < 0.5,
    };
  });
  expect(flying, "the picture should be flying").toBeTruthy();
  expect(flying.fixed, "it should be on the window, not in the article").toBe(true);
  // IT IS SMALLER THAN IT WAS, because it is receding.
  expect(flying.width, `${was} → ${flying.width}`).toBeLessThan(was);
  // AND IT IS A SQUARE, or on its way to being one.
  expect(Math.abs(flying.width - flying.height),
    `${flying.width} × ${flying.height}`).toBeLessThan(flying.width * 0.4);
  // AND THE LIST IS ALREADY BACK behind it — nothing to replay.
  expect(flying.listBack, "the list should be back before the picture has gone").toBe(true);
  expect(flying.writingGone, "everything but the picture should have faded").toBe(true);

  // AND IT COMES TO REST ON A SQUARE OF THAT GRID, which is the whole
  // of "recede into one of the squares of the background": both its
  // corners land on a multiple of the cell, and it is one cell big.
  // Long enough for the recede to have finished — it is 900ms after a
  // 460ms clearing, and the owner asked for all of it to be slower.
  await page.waitForTimeout(700);
  const cell = parseFloat(ruled.cell);
  const home = await page.evaluate(() => {
    const f = document.querySelector(".frag-flier");
    if (!f) return null;
    const box = f.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height };
  });
  expect(home, "it should still be there to look at").toBeTruthy();
  expect(Math.abs(home.width - cell),
    `${home.width} against a ${cell} cell`).toBeLessThan(2);
  expect(home.left % cell, `left ${home.left} is not on the grid`).toBeLessThan(1.5);
  expect(home.top % cell, `top ${home.top} is not on the grid`).toBeLessThan(1.5);

  // AND IT ALL CLEARS UP.
  await page.waitForTimeout(1600);
  await expect(page.locator(".frag-flier")).toHaveCount(0);
  await expect(page.locator(".frag-reader")).toBeHidden();
  await expect(page.locator(".index-table")).toBeVisible();
});

/* IT DOES NOT FLASH THE TABLE BACK ON THE WAY IN, which is a bug the
   owner reported in exactly those words: "there is a lag where the
   thing in the back (the original fragrances text) appear and it looks
   choppy (before the perfume specific page fades in, the one that
   faded away reappears)".

   WHAT IT WAS. The script fades the table out, then sets `hidden` on
   it and takes the fading class off in the same breath. `hidden` is an
   attribute, and the browser's own `[hidden] { display: none }` lives
   in the user-agent stylesheet, which any author rule outranks — and
   this page gives `.index-page` a display twice over. So `hidden` did
   nothing, and taking the class off snapped the table back to FULL
   STRENGTH, where it sat until the reader had faded in over it.

   SO THIS WATCHES THE TABLE ITSELF, every frame, and asks one thing:
   once it has started to fade it never gets brighter again. That is
   the whole of "choppy", and it is measurable. */
test("the table fades out and stays out, without flashing back",
  async ({ page }) => {
  await toTheList(page);

  const watching = page.evaluate(() => new Promise((done) => {
    const table = document.querySelector(".index-page");
    const seen = [];
    const began = performance.now();
    (function tick() {
      const cs = getComputedStyle(table);
      // Gone is gone: display:none counts as nought rather than as
      // whatever opacity it happened to be left at.
      seen.push(cs.display === "none" ? 0 : +cs.opacity);
      if (performance.now() - began < 2000) requestAnimationFrame(tick);
      else done(seen);
    })();
  }));
  await page.locator('.index-what a[href*="part-03"]').click();
  const seen = await watching;

  // It did fade.
  expect(Math.min(...seen), "the table should fade away").toBeLessThan(0.02);

  // AND IT NEVER CAME BACK, which is the owner's complaint and so goes
  // first: walked forwards, the lowest it has been so far can never be
  // beaten upwards by more than a rounding wobble.
  let lowest = 1;
  let rebound = 0;
  let when = -1;
  seen.forEach((now, i) => {
    if (now < lowest) lowest = now;
    if (now - lowest > rebound) { rebound = now - lowest; when = i; }
  });
  expect(rebound,
    `the table climbed back ${rebound.toFixed(3)} at frame ${when} of ${seen.length}`)
    .toBeLessThan(0.05);

  expect(seen[seen.length - 1], "and it is still gone at the end").toBe(0);
});

/* AND THE PICTURES GO HOME TO ONE PART OF THE GRID, which the owner
   asked for after seeing them go anywhere: "i want the grid that the
   fragrances can go to to be somewhere in the center, ish and on the
   right side".

   Every square on the window was fair game before, so the same
   movement read differently every time. This checks SEVERAL
   fragrances, because one landing in the right place proves nothing
   about a shuffle. */
test("a picture goes home to the right of centre, every time",
  async ({ page }) => {
  await toTheList(page);

  const landings = [];
  for (const no of ["01", "02", "03", "04"]) {
    await page.locator('.index-what a[href*="part-' + no + '"]').click();
    await page.waitForTimeout(1500);
    await page.locator(".frag-back").click();
    await page.waitForTimeout(1500);
    const at = await page.evaluate(() => {
      const f = document.querySelector(".frag-flier");
      if (!f) return null;
      const box = f.getBoundingClientRect();
      return { x: box.left, y: box.top, w: window.innerWidth, h: window.innerHeight };
    });
    expect(at, `part ${no} should still be landing`).toBeTruthy();
    landings.push(at);
    await page.waitForTimeout(1300);
  }

  landings.forEach((at, i) => {
    // RIGHT OF CENTRE, with a little room for the block's own left edge.
    expect(at.x, `landing ${i} at x=${Math.round(at.x)} of ${at.w}`)
      .toBeGreaterThan(at.w * 0.5);
    // AND CENTRE-ISH DOWN, rather than at the very top or bottom.
    expect(at.y, `landing ${i} at y=${Math.round(at.y)} of ${at.h}`)
      .toBeGreaterThan(at.h * 0.18);
    expect(at.y).toBeLessThan(at.h * 0.82);
  });
});

/* WITHOUT THE SCRIPT every row is still a link to the fragrance on its
   own page. This is the site's standing rule and the reason the rows
   were left as anchors rather than turned into buttons: the reader
   changes what a PRESS does, not what the page is. */
test("without the reader the rows are still links to the other page",
  async ({ page }) => {
  await page.route("**/fragrance-reader.js", (route) => route.abort());
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForTimeout(1600);
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  await page.waitForTimeout(1300);

  await expect(page.locator(".frag-reader")).toHaveCount(0);
  const where = await page.locator('.index-what a[href*="part-03"]').getAttribute("href");
  expect(where).toContain("individual-fragrances.html#part-03");
});
