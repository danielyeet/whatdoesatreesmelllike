// ============================================================
// PINEWARD (works/pineward.html)
//
// The first piece in Scent descriptions, and a long one: an
// introduction and fifty-two parts, each of which is a picture and a
// few paragraphs. Fifty-two of anything listed straight down a page is
// a wall, so a part is COMPACTED — only its number, a small picture
// and its title until it is opened — and they are grouped into four
// STRATA of thirteen, a section through a forest read from the light
// down into the ground.
//
// These check that the piece is all there and in that shape, that a
// part opens into its picture and its writing, that the trunk down the
// side has one tick per part and the reading in the corner counts what
// has been passed, that the canopy is drawn and then stands still, and
// that the page is all of its writing without its script.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/works/pineward.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the piece is an introduction and fifty-two parts in four strata",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);

  await expect(page.locator(".pine-head h1")).toContainText("Pineward");
  await expect(page.locator(".pine-head h1")).toContainText("the house that smells like trees");
  await expect(page.locator("#introduction h2")).toHaveText("Introduction");

  const parts = page.locator(".pine-part");
  await expect(parts).toHaveCount(52);

  // Four strata of thirteen, named for a section through a forest.
  const strata = page.locator(".pine-stratum");
  await expect(strata).toHaveCount(4);
  expect(await strata.evaluateAll((all) =>
    all.map((one) => one.querySelector("h2").textContent.trim())))
    .toEqual(["Canopy", "Understorey", "Trunk", "Roots"]);
  expect(await strata.evaluateAll((all) =>
    all.map((one) => one.querySelectorAll(".pine-part").length)))
    .toEqual([13, 13, 13, 13]);

  // Numbered straight through, 01 to 52, in the markup rather than
  // counted — so the numbers are the owner's to renumber.
  expect(await parts.evaluateAll((all) =>
    all.map((one) => one.querySelector(".pine-no").textContent.trim())))
    .toEqual(Array.from({ length: 52 }, (v, n) => String(n + 1).padStart(2, "0")));

  // And every one of them carries a picture and writing, waiting.
  expect(await parts.evaluateAll((all) =>
    all.filter((one) => one.querySelector(".pine-plate") && one.querySelector(".pine-text")).length))
    .toBe(52);

  expect(errors).toEqual([]);
});

test("a part is a title and a small picture until it is opened", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  const part = page.locator(".pine-part").nth(4);
  await part.scrollIntoViewIfNeeded();

  // Closed: the number, the small picture and the title, and none of
  // the writing.
  await expect(part.locator(".pine-no")).toHaveText("05");
  await expect(part.locator("summary .pine-thumb")).toBeVisible();
  await expect(part.locator(".pine-title")).toBeVisible();
  await expect(part.locator(".pine-text")).toBeHidden();
  await expect(part.locator(".pine-plate")).toBeHidden();
  await expect(part.locator(".pine-cue")).toHaveText("Open");

  // Compact enough to be an index rather than a wall: a closed part is
  // no taller than a line of writing with a small picture in it.
  const shut = await part.boundingBox();
  expect(shut.height, "a closed part should be one line of the index").toBeLessThan(110);

  await part.locator("summary").click();
  await page.waitForTimeout(700);

  // Open: the picture at size, and the paragraphs beside it.
  await expect(part.locator(".pine-plate")).toBeVisible();
  await expect(part.locator(".pine-text p").first()).toBeVisible();
  await expect(part.locator(".pine-cue")).toHaveText("Close");
  const open = await part.boundingBox();
  expect(open.height, "and it should open into the piece itself")
    .toBeGreaterThan(shut.height * 2);

  // One part opening does not open any other.
  expect(await page.locator(".pine-part[open]").count()).toBe(1);

  await part.locator("summary").click();
  await page.waitForTimeout(700);
  await expect(part.locator(".pine-text")).toBeHidden();
});

test("the trunk has one tick per part, and the reading counts them",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  await expect(page.locator(".pine-tick")).toHaveCount(52);

  // At the top of the piece nothing has been passed: the reading says
  // where you are in the FIFTY-TWO, not how far down the document you
  // have scrolled.
  const reading = () => page.locator(".pine-readout-no").textContent();
  const where = () => page.locator(".pine-readout-where").textContent();
  expect(await reading()).toBe("00");
  expect(await where()).toBe("Introduction");
  expect(await page.locator(".pine-tick.passed").count()).toBe(0);

  // Down into the third stratum, and it says so. Carried PAST the
  // reading line rather than merely into view: a part that is still
  // coming up the window has not been reached yet, which is the whole
  // point of reading against a line rather than against the scrollbar.
  await page.evaluate(() => {
    const part = document.querySelectorAll("#trunk .pine-part")[1];
    window.scrollTo(0, window.scrollY + part.getBoundingClientRect().top
      - window.innerHeight * 0.2);
  });
  await page.waitForTimeout(600);
  const at = Number(await reading());
  expect(at, "the reading should have counted the parts passed").toBeGreaterThan(20);
  expect(at, "and not run past them").toBeLessThanOrEqual(52);
  expect(await where()).toBe("Trunk");
  const inked = await page.locator(".pine-tick.passed").count();
  expect(inked, "the ticks behind you should be inked in").toBe(at);

  // And back up again: it is a reading, not a tally.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  expect(await reading()).toBe("00");
  expect(await page.locator(".pine-tick.passed").count()).toBe(0);
});

test("the canopy is drawn, and then stands still", async ({ page }) => {
  await page.goto(PAGE);

  const ink = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".pine-canopy");
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0, stamp = 0;
      for (let n = 3; n < shot.length; n += 4) {
        if (!shot[n]) continue;
        ink += shot[n];
        stamp = (stamp * 31 + n + shot[n]) % 2147483647;
      }
      return { ink: ink, stamp: stamp };
    });

  // It grows when the page opens, from the foot of each bough out to
  // the last twig.
  await page.waitForTimeout(400);
  const early = await ink();
  await page.waitForTimeout(2200);
  const grown = await ink();
  expect(early.ink, "something should be drawn early on").toBeGreaterThan(0);
  expect(grown.ink, "and more of it once it has grown").toBeGreaterThan(early.ink * 1.3);

  // And then nothing moves: the drawing is watched being made, and
  // afterwards it is a drawing.
  await page.waitForTimeout(1200);
  const after = await ink();
  expect(after.stamp, "not a speck should change once it has grown").toBe(grown.stamp);

  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(700);
  expect((await ink()).stamp, "nor when the page is scrolled").toBe(grown.stamp);
});

test("with animation turned off the piece is simply there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  // Nothing waits to be scrolled into view: every part is readable at
  // once, wherever it stands.
  const hidden = await page.$$eval(".pine-part", (parts) =>
    parts.filter((one) => parseFloat(getComputedStyle(one).opacity) < 0.9).length);
  expect(hidden, "no part should be waiting to arrive").toBe(0);
});

test("without its script the page is still all of its writing", async ({ page }) => {
  await page.route("**/pineward.js", (route) => route.abort());
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  // The drawings are the script's and are simply not there...
  expect(await page.locator(".pine-trunk").count(), "no trunk without the script").toBe(0);
  expect(await page.locator(".pine-readout").count()).toBe(0);

  // ...and everything anyone came to read is on the page and works:
  // <details> opens and closes on its own.
  await expect(page.locator(".pine-part")).toHaveCount(52);
  const part = page.locator(".pine-part").nth(1);
  await expect(part.locator(".pine-title")).toBeVisible();
  await expect(part.locator(".pine-text")).toBeHidden();
  await part.locator("summary").click();
  await expect(part.locator(".pine-text p").first()).toBeVisible();
  await expect(page.locator("#introduction .pine-text p").first()).toBeVisible();
});

test("the piece is what the sheet's first picture points at", async ({ page }) => {
  await page.goto("/categories/scent-descriptions.html");
  const first = page.locator(".sheet-frame").first();
  await expect(first).toHaveAttribute("href", "../works/pineward.html");
  await expect(first.locator(".sheet-caption"))
    .toHaveText("Pineward: the house that smells like trees");
});
