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

  // The grid is there to recede INTO, and it is built off the window
  // rather than typed in, so this only asks that there is one.
  const cells = await page.locator(".frag-cell").count();
  expect(cells, "there should be a grid to go home to").toBeGreaterThan(8);

  const was = await page.locator(".frag-plate img, .frag-plate > div").first()
    .evaluate((el) => el.getBoundingClientRect().width);

  await page.locator(".frag-back").click();
  await page.waitForTimeout(700);

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

  // AND IT ALL CLEARS UP.
  await page.waitForTimeout(1800);
  await expect(page.locator(".frag-flier")).toHaveCount(0);
  await expect(page.locator(".frag-reader")).toBeHidden();
  await expect(page.locator(".index-table")).toBeVisible();
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
