// ============================================================
// PINEWARD (houses/pineward.html)
//
// The first piece in Scent descriptions, and a long one: an
// introduction and forty-seven parts, each of which is a fragrance: a picture and a
// few paragraphs. Fifty-two of anything listed straight down a page is
// a wall, so a part is COMPACTED — only its number, a small picture
// and its title until it is opened — and they are grouped into four
// STRATA — fourteen, fourteen, thirteen, thirteen — a section through
// a forest read from the light
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

const PAGE = "/houses/pineward.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the piece is an introduction and forty-seven parts in five groups",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);

  await expect(page.locator(".pine-head h1")).toContainText("Pineward");
  await expect(page.locator(".pine-head h1")).toContainText("The House That Smells Like Trees");
  await expect(page.locator("#introduction h2")).toHaveText("Introduction");

  const parts = page.locator(".pine-part");
  await expect(parts).toHaveCount(47);

  // FIVE GROUPINGS, AND THEY ARE THE OWNER'S OWN. They were Canopy,
  // Understorey, Trunk and Roots — a section through a forest, which
  // was a made-up arrangement — until the owner sent a spreadsheet
  // saying which fragrance belongs where. The counts are uneven because
  // they are however many happen to smell of that.
  const strata = page.locator(".pine-stratum");
  await expect(strata).toHaveCount(5);
  expect(await strata.evaluateAll((all) =>
    all.map((one) => one.querySelector("h2").textContent.trim())))
    .toEqual(["Foresty", "Hay-y", "Wine/Christmas", "Sea", "Others"]);
  expect(await strata.evaluateAll((all) =>
    all.map((one) => one.querySelectorAll(".pine-part").length)))
    .toEqual([14, 6, 4, 4, 19]);

  // AND WHAT HAS NOT BEEN SMELLED IS A NAME, NOT A PART. No number, no
  // picture, no writing — there is nothing yet to number, show or
  // write. It must not be a .pine-part, or the trunk would tick for it.
  const waiting = page.locator(".pine-waiting-list li");
  await expect(waiting).toHaveCount(8);
  expect(await page.locator(".pine-waiting").evaluate((el) =>
    el.querySelectorAll("img, .pine-part").length),
    "the waiting list carries no pictures and no parts").toBe(0);

  // Numbered straight through, 01 to 47, in the markup rather than
  // counted — so the numbers are the owner's to renumber.
  expect(await parts.evaluateAll((all) =>
    all.map((one) => one.querySelector(".pine-no").textContent.trim())))
    .toEqual(Array.from({ length: 47 }, (v, n) => String(n + 1).padStart(2, "0")));

  // And every one of them carries its picture and its writing. The
  // pictures arrived with the owner's own upload of the house's
  // fragrances, so a part with a hatched placeholder is now a part
  // whose picture went missing rather than one still waiting.
  expect(await parts.evaluateAll((all) =>
    all.filter((one) => one.querySelector(".pine-plate img") &&
                        one.querySelector(".pine-thumb img") &&
                        one.querySelector(".pine-text")).length))
    .toBe(47);

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

  await expect(page.locator(".pine-tick")).toHaveCount(47);

  // At the top of the piece nothing has been passed: the reading says
  // where you are in the FORTY-SEVEN, not how far down the document you
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
    // The groups are numbered rather than named now — they carry the
    // owner's own names, which are theirs to change, so the id cannot
    // be one of them.
    const part = document.querySelectorAll("#stratum-5 .pine-part")[1];
    window.scrollTo(0, window.scrollY + part.getBoundingClientRect().top
      - window.innerHeight * 0.2);
  });
  await page.waitForTimeout(600);
  const at = Number(await reading());
  expect(at, "the reading should have counted the parts passed").toBeGreaterThan(20);
  expect(at, "and not run past them").toBeLessThanOrEqual(47);
  expect(await where()).toBe("Others");
  const inked = await page.locator(".pine-tick.passed").count();
  expect(inked, "the ticks behind you should be inked in").toBe(at);

  // And back up again: it is a reading, not a tally.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  expect(await reading()).toBe("00");
  expect(await page.locator(".pine-tick.passed").count()).toBe(0);
});

test("the wood runs the length of the piece, and is grown", async ({ page }) => {
  await page.goto(PAGE);

  const ink = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".pine-canopy");
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let n = 3; n < shot.length; n += 4) ink += shot[n];
      return ink;
    });

  // It grows when the page opens, from the foot of each tree out to
  // the last twig.
  // Early enough to catch it part-grown: the whole wood is up in
  // GROW_MS, and most of the ink is on the page well before the end of
  // that.
  await page.waitForTimeout(150);
  const early = await ink();
  await page.waitForTimeout(2600);
  const grown = await ink();
  expect(early, "something should be drawn early on").toBeGreaterThan(0);
  expect(grown, "and more of it once it has grown").toBeGreaterThan(early * 1.3);

  // AND IT RUNS THE WHOLE LENGTH OF THE PIECE. The owner asked for the
  // trees to go through the entire page rather than standing behind
  // the title, so there is a wood at the foot of it as well as at the
  // head — and the canvas is fixed to the window, so that is not the
  // same pixels scrolling past.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  expect(await ink(), "there should be trees at the foot of the piece too")
    .toBeGreaterThan(grown * 0.3);

  // And it is drawn out at the sides, where the writing is not: the
  // middle of the page is kept quiet.
  const across = await page.evaluate(() => {
    const canvas = document.querySelector(".pine-canopy");
    const ratio = canvas.width / canvas.clientWidth;
    const shot = canvas.getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let middle = 0, sides = 0;
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const a = shot[(y * canvas.width + x) * 4 + 3];
        if (!a) continue;
        const at = x / ratio / canvas.clientWidth;
        if (at > 0.32 && at < 0.68) middle += a; else sides += a;
      }
    }
    return { middle: middle, sides: sides };
  });
  expect(across.sides, "the trees stand out at the sides").toBeGreaterThan(0);
  expect(across.middle, `and the writing's own column is kept quiet: ${JSON.stringify(across)}`)
    .toBeLessThan(across.sides * 0.3);
});

test("the wood idles where it stands, and blooms under the hand",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3200);

  const inkAt = (x, y, r) =>
    page.evaluate(([x, y, r]) => {
      const canvas = document.querySelector(".pine-canopy");
      const ratio = canvas.width / canvas.clientWidth;
      const shot = canvas.getContext("2d").getImageData(
        Math.round((x - r) * ratio), Math.round((y - r) * ratio),
        Math.round(2 * r * ratio), Math.round(2 * r * ratio)).data;
      let ink = 0;
      for (let n = 3; n < shot.length; n += 4) ink += shot[n];
      return ink;
    }, [x, y, r]);

  // The busiest patch of the right-hand margin: somewhere there is
  // actually a tree to bloom.
  const spot = await page.evaluate(() => {
    const canvas = document.querySelector(".pine-canopy");
    const ratio = canvas.width / canvas.clientWidth;
    const paint = canvas.getContext("2d");
    let best = null;
    for (let x = canvas.clientWidth - 240; x < canvas.clientWidth - 30; x += 40) {
      for (let y = 120; y < canvas.clientHeight - 120; y += 40) {
        const shot = paint.getImageData(Math.round((x - 40) * ratio),
          Math.round((y - 40) * ratio), Math.round(80 * ratio), Math.round(80 * ratio)).data;
        let ink = 0;
        for (let n = 3; n < shot.length; n += 4) ink += shot[n];
        if (!best || ink > best.ink) best = { x: x, y: y, ink: ink };
      }
    }
    return best;
  });
  expect(spot.ink, "there should be a tree to point at").toBeGreaterThan(0);

  // POINTED AT, IT BLOOMS: what is near the hand is drawn more fully
  // and puts out needles. Nothing moves towards the pointer — the
  // owner was plain that this is not interactive — so what is measured
  // is how much more is drawn in the same place.
  const resting = await inkAt(spot.x, spot.y, 80);
  await page.mouse.move(spot.x, spot.y);
  await page.waitForTimeout(1100);
  const bloomed = await inkAt(spot.x, spot.y, 80);
  expect(bloomed, `it should bloom under the hand: ${resting} -> ${bloomed}`)
    .toBeGreaterThan(resting * 1.5);

  // And let go again when the hand leaves.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1400);
  const after = await inkAt(spot.x, spot.y, 80);
  expect(after, `and let go again: ${bloomed} -> ${after}`).toBeLessThan(bloomed * 0.7);

  // The tree does not FOLLOW the hand: where its trunk stands is the
  // same before and after being pointed at.
  const trunkNow = await inkAt(spot.x, spot.y, 80);
  expect(Math.abs(trunkNow - resting) / Math.max(1, resting),
    "and stand exactly where it stood").toBeLessThan(0.35);
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
  await expect(page.locator(".pine-part")).toHaveCount(47);
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
  await expect(first).toHaveAttribute("href", "../houses/pineward.html");
  await expect(first.locator(".sheet-caption"))
    .toHaveText("Pineward The House That Smells Like Trees");
  // The name is what is printed; the line about it waits to be pointed
  // at — see the contact sheet's report.
  await expect(first.locator(".sheet-name")).toHaveText("Pineward");
  await expect(first.locator(".sheet-say"))
    .toHaveText("The House That Smells Like Trees");
});

/* AND THE BLOOM DOES NOT SNAP OFF. The owner asked for "a delay to the
   effects of the pineward trees, so that when you hover a tree, the
   effect lasts about 0.25 seconds after your cursor leaves".

   THE FAULT THIS IS FOR is subtler than it sounds. Leaving the PAGE
   already faded, because `handAt` eased down; what snapped was moving
   the pointer somewhere else ON the page, because the bloom is worked
   out from how near the hand is to each speck and the hand was
   suddenly far. So this measures exactly that: the pointer goes from
   the tree to another part of the same window, and the tree should
   still be lit a moment later.

   The hold is per speck now — each one takes a brighter bloom at once,
   holds what it has for BLOOM_HOLD, and only then eases out. */
test("a tree stays lit for a moment after the pointer leaves it",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3200);

  const inkAt = (x, y, r) =>
    page.evaluate(([x, y, r]) => {
      const canvas = document.querySelector(".pine-canopy");
      const ratio = canvas.width / canvas.clientWidth;
      const shot = canvas.getContext("2d").getImageData(
        Math.round((x - r) * ratio), Math.round((y - r) * ratio),
        Math.round(2 * r * ratio), Math.round(2 * r * ratio)).data;
      let ink = 0;
      for (let n = 3; n < shot.length; n += 4) ink += shot[n];
      return ink;
    }, [x, y, r]);

  const spot = await page.evaluate(() => {
    const canvas = document.querySelector(".pine-canopy");
    const ratio = canvas.width / canvas.clientWidth;
    const paint = canvas.getContext("2d");
    let best = null;
    for (let x = canvas.clientWidth - 240; x < canvas.clientWidth - 30; x += 40) {
      for (let y = 120; y < canvas.clientHeight - 120; y += 40) {
        const shot = paint.getImageData(Math.round((x - 40) * ratio),
          Math.round((y - 40) * ratio), Math.round(80 * ratio), Math.round(80 * ratio)).data;
        let ink = 0;
        for (let n = 3; n < shot.length; n += 4) ink += shot[n];
        if (!best || ink > best.ink) best = { x: x, y: y, ink: ink };
      }
    }
    return best;
  });

  const resting = await inkAt(spot.x, spot.y, 80);
  await page.mouse.move(spot.x, spot.y);
  await page.waitForTimeout(1100);
  const lit = await inkAt(spot.x, spot.y, 80);
  expect(lit, "it should bloom first").toBeGreaterThan(resting * 1.5);

  // THE POINTER GOES SOMEWHERE ELSE ON THE PAGE, not off it — into the
  // middle, where the writing is and no tree stands.
  await page.mouse.move(Math.round(spot.x / 2), spot.y);
  await page.waitForTimeout(120);
  const held = await inkAt(spot.x, spot.y, 80);

  // Still most of the way lit a tenth of a second later. Without the
  // hold this is back to resting in a frame.
  const kept = (held - resting) / Math.max(1, lit - resting);
  expect(kept, `a tenth of a second after leaving it kept ${(kept * 100).toFixed(0)}%`)
    .toBeGreaterThan(0.55);

  // And gone a second after that, so it is a delay and not a smear
  // that never clears.
  await page.waitForTimeout(1200);
  const gone = await inkAt(spot.x, spot.y, 80);
  const left = (gone - resting) / Math.max(1, lit - resting);
  expect(left, `a second later it kept ${(left * 100).toFixed(0)}%`).toBeLessThan(0.25);
});
