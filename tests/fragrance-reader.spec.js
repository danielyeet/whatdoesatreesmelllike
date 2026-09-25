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

/** Get to the Fragrances view, which is not what the page opens as —
    AS THE OLD TABLE, which is kept under the line at the owner's word
    and is still what a file on the line presses (tests/fragrance-line
    .spec.js opens the reader from the line itself). */
async function toTheList(page) {
  await page.route("**/fragrance-line.js", (route) => route.abort());
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

  // THE NOTES, BEHIND A CLICK since 2026-09-23 — the owner asked for
  // them to be "also click to open", like on every house page. So there
  // is a VIEW NOTES button and nothing printed out, and pressing it opens
  // the same window, with Haxan's two halves, two headings, two sources.
  await expect(reader.locator(".frag-notes .note-half")).toHaveCount(0);
  const button = reader.locator(".frag-notes .note-open");
  await expect(button).toHaveCount(1);
  await button.click();
  await page.waitForTimeout(600);
  const shown = page.locator(".note-panel:not([hidden])");
  await expect(shown).toHaveCount(1);
  await expect(shown.locator(".note-half")).toHaveCount(2);
  await expect(shown.locator(".note-cite")).toHaveCount(2);
  await expect(shown.locator(".note-row")).toHaveCount(2);
});

/* ESCAPE SHUTS THE NOTES FIRST, and only then the fragrance. The notes
   window and the reader both answer the key; pressed once with the
   window up, it must not take the reader away from under it. And a
   fragrance opened after another carries its OWN window, not a pile of
   every window opened so far. */
test("escape shuts the notes before the fragrance, and windows do not pile up",
  async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(1600);
  await page.locator(".frag-notes .note-open").click();
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);
  await expect(page.locator(".note-panel:not([hidden])")).toHaveCount(0);
  await expect(page.locator(".frag-reader.is-here"), "the fragrance stays").toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(4200);
  await expect(page.locator(".frag-reader")).toBeHidden();

  await page.locator('.index-what a[href*="part-01"]').click();
  await page.waitForTimeout(1600);
  await expect(page.locator(".note-panel")).toHaveCount(1);
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

  // Whichever of the two is showing: the picture, or the hatched square
  // left where a picture has not arrived (hidden while there is one).
  const was = await page.evaluate(() => Math.max(...[...document.querySelectorAll(".frag-plate img, .frag-plate > div")]
    .map((el) => el.getBoundingClientRect().width)));

  await page.locator(".frag-back").click();
  // Past the writing's 640ms and some way into the 1500ms travel.
  await page.waitForTimeout(1300);

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
  // Long enough for the recede to have finished — it is 1500ms after a
  // 640ms clearing, and the owner has asked twice for all of it to be
  // slower — and before the 1200ms fade has finished taking it away.
  await page.waitForTimeout(1050);
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
  await page.waitForTimeout(1900);
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
    // Landed: 640ms of clearing and 1500ms of travel.
    await page.waitForTimeout(2350);
    const at = await page.evaluate(() => {
      const f = document.querySelector(".frag-flier");
      if (!f) return null;
      const box = f.getBoundingClientRect();
      return { x: box.left, y: box.top, w: window.innerWidth, h: window.innerHeight };
    });
    expect(at, `part ${no} should still be landing`).toBeTruthy();
    landings.push(at);
    await page.waitForTimeout(1700);
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

/* IN A STRAIGHT LINE. The owner: "I want it not to do any turning but
   rather a straight path from the place the picture of the fragrance
   is on the screen to the square in which it will fade away."

   IT TURNED because its size ran on a shorter clock than its place: it
   shrank towards its own corner faster than it travelled, so its middle
   first went UP AND AWAY from the square it was headed for and then
   swung round towards it — measured, 37px off the line on a still page
   and 59px with the wheel going.

   SO THIS WATCHES EVERY PICTURE'S MIDDLE, every frame, and asks two
   things: that it never strays from the line between where it started
   and where it landed, and that it never takes a step backwards along
   it. Haxan, because it has three pictures and every one of them has
   to go straight. */
test("every picture goes home in a straight line", async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(1800);

  const watching = page.evaluate(() => new Promise((done) => {
    const seen = [];
    const began = performance.now();
    (function tick() {
      document.querySelectorAll(".frag-flier").forEach((f, k) => {
        const b = f.getBoundingClientRect();
        (seen[k] = seen[k] || []).push({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      });
      if (performance.now() - began < 2600) requestAnimationFrame(tick);
      else done(seen);
    })();
  }));
  await page.locator(".frag-back").click();
  const paths = await watching;

  expect(paths.length, "Haxan's three pictures should all fly").toBe(3);
  paths.forEach((path, k) => {
    const a = path[0];
    const z = path[path.length - 1];
    const dx = z.x - a.x;
    const dy = z.y - a.y;
    const long = Math.hypot(dx, dy);
    expect(long, `picture ${k} should travel`).toBeGreaterThan(60);
    let worst = 0;
    let backwards = 0;
    path.forEach((p, i) => {
      worst = Math.max(worst, Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / long);
      if (i && ((p.x - path[i - 1].x) * dx + (p.y - path[i - 1].y) * dy) / long < -0.5) backwards += 1;
    });
    expect(worst, `picture ${k} strayed ${worst.toFixed(1)}px off its line`).toBeLessThan(2);
    expect(backwards, `picture ${k} stepped backwards ${backwards} times`).toBe(0);
  });
});

/* AND WHATEVER THE WHEEL DOES. "Make it so that this happens
   independently of scrolling please, because when you scroll the whole
   page glitches out."

   What the wheel did was scroll the reader, which was still standing
   over the page and invisible, so the fading article slid about under
   the pictures — and once the list was back, the table under them.
   So this turns the wheel the whole way through the way back and asks
   that NOTHING moved: not the reader, not the table, not the window,
   and not the picture off its line. And then that the wheel works again
   afterwards, because holding it for good would be a worse fault. */
test("scrolling during the way back moves nothing, and is let go after",
  async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(1800);
  await page.mouse.move(700, 450);
  // Down to the arrow, which is at the foot of the writing.
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(40); }
  await page.waitForTimeout(400);

  const before = await page.evaluate(() => ({
    reader: document.querySelector(".frag-reader").scrollTop,
    win: window.scrollY,
  }));
  expect(before.reader, "the reader should have been scrolled to its arrow").toBeGreaterThan(0);

  const watching = page.evaluate(() => new Promise((done) => {
    const seen = [];
    const began = performance.now();
    (function tick() {
      seen.push({
        reader: document.querySelector(".frag-reader").scrollTop,
        list: document.querySelector(".index-scroll").scrollTop,
        win: window.scrollY,
      });
      if (performance.now() - began < 3000) requestAnimationFrame(tick);
      else done(seen);
    })();
  }));
  await page.locator(".frag-back").click();
  for (let i = 0; i < 24; i++) {
    await page.mouse.wheel(0, i % 2 ? -260 : 260);
    await page.waitForTimeout(60);
  }
  const seen = await watching;

  const readers = [...new Set(seen.map((s) => s.reader))];
  const lists = [...new Set(seen.map((s) => s.list))];
  const wins = [...new Set(seen.map((s) => s.win))];
  expect(readers, "the reader should not scroll under the pictures").toEqual([before.reader]);
  expect(lists, "nor the table").toEqual([0]);
  expect(wins, "nor the window").toEqual([before.win]);

  // Let go afterwards: a wheel on the page is an ordinary wheel again.
  await page.waitForTimeout(1500);
  await expect(page.locator(".frag-reader")).toBeHidden();
  const stopped = await page.evaluate(() => {
    const e = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
    document.querySelector(".index-scroll").dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(stopped, "the wheel should be let go once the way back is over").toBe(false);
});

/* HAXAN CARRIES THREE PICTURES, at the owner's word: "For Haxan please
   also add the other two pictures." On its own page they stand one over
   a row of two, and the reader carries all three — they are what
   "if there is more than one picture, then they all become squares"
   was written for. Every one of them has to have actually loaded. */
test("Haxan carries all three of its pictures, here and on its own page",
  async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-03"]').click();
  await page.waitForTimeout(2000);
  const here = await page.$$eval(".frag-plate img",
    (all) => all.map((img) => ({ src: img.getAttribute("src"), w: img.naturalWidth })));
  expect(here.length, "the reader should carry three").toBe(3);
  here.forEach((one) => expect(one.w, `${one.src} should have loaded`).toBeGreaterThan(0));

  await page.goto("/individual-fragrances/individual-fragrances.html#part-03");
  await page.waitForTimeout(800);
  const there = await page.$$eval("#part-03 .human-plate img",
    (all) => all.map((img) => ({ src: img.getAttribute("src"), w: img.naturalWidth })));
  expect(there.length).toBe(3);
  there.forEach((one) => {
    expect(one.w, `${one.src} should have loaded`).toBeGreaterThan(0);
    // THE WEB COPIES, never the 5152 x 7728 originals.
    expect(one.src).toContain("/web/");
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

/* THE CREDIT COMES WITH THE PICTURE. A picture is credited wherever it is
   used, and the reader uses the individual fragrances' pictures — so
   the credit under each on its own page is carried into the reader,
   under the picture. House of Ellixirz, the eighth, opened from the
   list: its picture, and "Picture: Matca" with the link under it. */
test("the reader carries the picture's credit under it", async ({ page }) => {
  await toTheList(page);
  await page.locator('.index-what a[href*="part-08"]').click();
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator(".frag-reader h2").first()).toHaveText("House of Ellixirz");
  const credit = page.locator(".frag-plate .frag-plate-credit");
  await expect(credit).toHaveText("Picture: Matca", { timeout: 5000 });
  await expect(credit.locator("a")).toHaveAttribute("href", "https://www.matcanaturals.com/en-eu/products/house-of-ellixirz");
  await expect.poll(() => page.locator(".frag-plate img").first().evaluate((img) => img.naturalWidth), { timeout: 5000 })
    .toBeGreaterThan(0);
  // Back, and on to another: the first one's credit does not stay behind.
  await page.locator(".frag-back").click();
  await page.waitForTimeout(2600);
  await page.locator('.index-what a[href*="part-03"]').click();
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1, { timeout: 5000 });
  await page.waitForTimeout(800);
  await expect(page.locator(".frag-plate .frag-plate-credit"), "Haxan's has none").toHaveCount(0);
});
