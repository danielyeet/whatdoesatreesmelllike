// ============================================================
// THE HOUSES — the chain (categories/scent-descriptions.html)
//
// One picture per house, joined one to the next in a single chain that
// runs left to right, down, right to left — the owner's drawing of
// 2026-09-23 — drawing itself in from the first house to the last.
// Resting on a house brings that house's own motifs up over the page
// while the rest goes out of focus; leaving lets them fade. Pressing a
// house steps the page back before opening it.
//
// These check what can be WRONG rather than merely ugly: the chain
// being one chain in the right order, nothing standing on anything,
// the motifs waiting before they come and fading when they go, and the
// old startup flick being gone for good.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/** Wait for the chain to have finished drawing itself in. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(600);
}

/** Every house's box on the window, and every bar's, in order. */
const chain = (page) =>
  page.evaluate(() => ({
    frames: [...document.querySelectorAll(".sheet-frame")].map((f) => {
      const r = f.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height };
    }),
    bars: [...document.querySelectorAll(".sheet-link")].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        from: Number(b.dataset.from), to: Number(b.dataset.to), run: b.dataset.run,
        kind: b.classList.contains("double") ? "double" : "solid",
        left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      };
    }),
  }));

/** How much the motifs' canvas has drawn, in pixels with any ink. */
const motifInk = (page) =>
  page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    if (!c) return -1;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n;
  });

/** Move the pointer onto the middle of a house. */
async function pointAt(page, which) {
  const box = await page.locator(".sheet-frame").nth(which).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* THE CHAIN, AS DRAWN. Along the first row left to right, down, along
   the second right to left: every house joined to the next by exactly
   one bar, and nothing else joined to anything. */
test("the houses stand in one chain, left to right and back again", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const { frames, bars } = await chain(page);

  expect(frames.length).toBe(9);
  expect(bars.length, "one bar between each house and the next").toBe(frames.length - 1);

  const mid = (f) => ({ x: (f.left + f.right) / 2, y: (f.top + f.bottom) / 2 });
  let row = 0, rows = [[0]];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    const bar = bars[i - 1];
    expect([bar.from, bar.to], "the bars go in order").toEqual([i - 1, i]);
    const turned = b.top > a.bottom;
    if (turned) {
      row++;
      rows.push([i]);
      // Straight down: the two stand one over the other, and the bar
      // runs between them.
      expect(Math.min(a.right, b.right) - Math.max(a.left, b.left),
        `house ${i + 1} should stand under house ${i}`).toBeGreaterThan(10);
      expect(bar.run).toBe("down");
      expect(Math.abs(bar.top - a.bottom), "the bar leaves the upper house").toBeLessThan(1.5);
      expect(Math.abs(bar.bottom - b.top), "and reaches the lower one").toBeLessThan(1.5);
      expect(bar.left).toBeGreaterThanOrEqual(Math.max(a.left, b.left) - 0.5);
      expect(bar.right).toBeLessThanOrEqual(Math.min(a.right, b.right) + 0.5);
    } else {
      rows[row].push(i);
      // Along the row, the way this row runs: even rows rightwards,
      // odd rows leftwards.
      const rightwards = row % 2 === 0;
      expect(rightwards ? mid(b).x > mid(a).x : mid(b).x < mid(a).x,
        `house ${i + 1} should be to the ${rightwards ? "right" : "left"} of house ${i}`).toBe(true);
      const near = rightwards ? a.right : a.left, far = rightwards ? b.left : b.right;
      expect(Math.abs((rightwards ? bar.left : bar.right) - near), "the bar leaves one house").toBeLessThan(1.5);
      expect(Math.abs((rightwards ? bar.right : bar.left) - far), "and reaches the next").toBeLessThan(1.5);
      // At a height both houses stand at.
      expect(bar.top).toBeGreaterThanOrEqual(Math.max(a.top, b.top) - 0.5);
      expect(bar.bottom).toBeLessThanOrEqual(Math.min(a.bottom, b.bottom) + 0.5);
    }
  }
  expect(rows.length, "nine houses at this width make two rows").toBe(2);
  expect(rows[0].length, "seven to the first, as drawn").toBe(7);
});

/* NOTHING STANDS ON ANYTHING, and no bar runs over a picture it is not
   joining. The same check that has always been this page's first rule. */
test("no two houses overlap, and no bar crosses a house", async ({ page }) => {
  for (const width of [1440, 1024, 800, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(SHEET);
    await waitForSheet(page);
    const { frames, bars } = await chain(page);
    const hit = (a, b, pad = 0) =>
      a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        expect(hit(frames[i], frames[j]), `at ${width}px houses ${i + 1} and ${j + 1} overlap`).toBe(false);
      }
    }
    bars.forEach((bar) => {
      frames.forEach((f, k) => {
        if (k === bar.from || k === bar.to) return;
        expect(hit(bar, f, 0.5), `at ${width}px the bar ${bar.from + 1}–${bar.to + 1} crosses house ${k + 1}`).toBe(false);
      });
    });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(wide, `at ${width}px the page should not scroll sideways`).toBeLessThanOrEqual(0);
  }
});

/* AS DRAWN: boxes of different sizes, standing a little up or down from
   one another, and both kinds of bar — one solid stroke, and two
   hairlines with the paper between them. A chain of identical squares
   on one line would be a different drawing. */
test("the boxes are uneven and both kinds of bar are used", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const { frames, bars } = await chain(page);
  const widths = new Set(frames.map((f) => Math.round(f.w / 6)));
  const heights = new Set(frames.map((f) => Math.round(f.h / 6)));
  expect(widths.size, "the boxes are not all one width").toBeGreaterThan(3);
  expect(heights.size, "nor all one height").toBeGreaterThan(3);
  const tops = new Set(frames.slice(0, 7).map((f) => Math.round(f.top / 4)));
  expect(tops.size, "and they do not all stand on one line").toBeGreaterThan(3);
  const kinds = new Set(bars.map((b) => b.kind));
  expect([...kinds].sort()).toEqual(["double", "solid"]);
  // A name is never cut short to fit its box.
  const cut = await page.$$eval(".sheet-name", (all) =>
    all.filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent));
  expect(cut, "no name should be cut short").toEqual([]);
});

/* IT DRAWS ITSELF IN, from the first house to the last — each one
   uncovered over several frames rather than switched on, the bar into
   it running out first. */
test("the chain draws itself in, house by house, in order", async ({ page }) => {
  await page.addInitScript(() => {
    window.__landed = [];
    window.__clips = new Set();
    window.__barBefore = [];
    const t0 = performance.now();
    const watch = () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      frames.forEach((f, i) => {
        if (f.classList.contains("landed") && window.__landed[i] === undefined) {
          window.__landed[i] = performance.now() - t0;
          const bar = document.querySelector(`.sheet-link[data-to="${i}"]`);
          window.__barBefore[i] = !bar || bar.classList.contains("drawn");
        }
      });
      if (frames[4]) window.__clips.add(getComputedStyle(frames[4]).clipPath);
      if (performance.now() - t0 < 6000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  const seen = await page.evaluate(() => ({
    landed: window.__landed, clips: [...window.__clips], bars: window.__barBefore,
  }));
  expect(seen.landed.length).toBe(9);
  for (let i = 1; i < seen.landed.length; i++) {
    expect(seen.landed[i] - seen.landed[i - 1],
      `house ${i + 1} should arrive after house ${i}`).toBeGreaterThan(120);
    expect(seen.bars[i], `the bar into house ${i + 1} should be out before it opens`).toBe(true);
  }
  expect(seen.clips.length, "a house is uncovered over several frames").toBeGreaterThan(4);
});

/* THE STARTUP FLICK IS GONE, completely, as the owner asked: no house
   is ever shown anywhere but in its own place in the chain, and nothing
   on the sheet is ever made unpressable while pictures cycle. */
test("the old startup flick is gone", async ({ page }) => {
  await page.addInitScript(() => {
    window.__moved = 0;
    window.__flicking = false;
    let first = null;
    const t0 = performance.now();
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet && sheet.classList.contains("flicking")) window.__flicking = true;
      const frames = [...document.querySelectorAll(".sheet-frame")];
      if (sheet && sheet.classList.contains("scripted") && frames.length) {
        const at = frames.map((f) => getComputedStyle(f).transform);
        if (!first) first = at;
        else at.forEach((t, i) => { if (t !== first[i]) window.__moved++; });
      }
      if (performance.now() - t0 < 4500) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  expect(await page.evaluate(() => window.__flicking), "nothing flicks").toBe(false);
  expect(await page.evaluate(() => window.__moved),
    "every house is placed where it stays, and never shown anywhere else").toBe(0);
});

/* RESTING ON A HOUSE, AND ONLY RESTING. "I also want the effect to start
   not instantly, but after momentarily hovering, so that when you go
   with your mouse from one part of the screen to another, it doesnt
   cause chaos." Nothing in the first moment; then the rest of the page
   out of focus and the house's own motifs drawn over it. */
test("resting on a house brings its motifs after a moment, and blurs the rest",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 0);

  await page.waitForTimeout(150);
  expect(await page.locator("#sheet.musing").count(), "not at once").toBe(0);
  expect(await motifInk(page), "nothing drawn yet").toBe(0);

  await page.waitForTimeout(1600);
  await expect(page.locator("#sheet.musing")).toHaveCount(1);
  await expect(page.locator(".sheet-frame").first()).toHaveClass(/hot/);
  expect(await motifInk(page), "the house's motifs are drawn").toBeGreaterThan(40);
  const looks = await page.evaluate(() => {
    const frames = [...document.querySelectorAll(".sheet-frame")];
    return { rested: getComputedStyle(frames[0]).filter, other: getComputedStyle(frames[3]).filter };
  });
  expect(looks.rested, "the house itself stays sharp").toBe("none");
  expect(looks.other, "everything else goes out of focus").toMatch(/blur/);
  expect(errors).toEqual([]);
});

/* CROSSING THE PAGE SETS NOTHING OFF. The pointer passing over house
   after house on its way somewhere else must not start any of them. */
test("passing over the houses does not set their motifs off", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.evaluate(() => {
    window.__mused = false;
    new MutationObserver(() => {
      if (document.getElementById("sheet").classList.contains("musing")) window.__mused = true;
    }).observe(document.getElementById("sheet"), { attributes: true });
  });
  const boxes = await page.$$eval(".sheet-frame", (all) => all.slice(0, 7).map((f) => {
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }));
  await page.mouse.move(boxes[0].x - 150, boxes[0].y);
  for (const b of boxes) {
    await page.mouse.move(b.x, b.y, { steps: 3 });
    await page.waitForTimeout(90);
  }
  await page.mouse.move(boxes[6].x, boxes[6].y + 300, { steps: 3 });
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__mused), "no house should have been set off").toBe(false);
});

/* THEY FADE, THEY DO NOT VANISH. "when you unhover, the motifs fade
   gradually, they dont disappear." A moment after leaving there is
   still some of them; a little later there is none. */
test("leaving a house lets its motifs fade rather than vanish", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 4);
  await page.waitForTimeout(2600);
  const full = await motifInk(page);
  expect(full, "something to fade").toBeGreaterThan(40);

  await page.mouse.move(8, 880, { steps: 2 });
  await page.waitForTimeout(350);
  expect(await page.locator("#sheet.musing").count(), "the page comes back into focus").toBe(0);
  const fading = await motifInk(page);
  expect(fading, "a moment after leaving, the motifs are still there").toBeGreaterThan(10);
  await page.waitForTimeout(2600);
  expect(await motifInk(page), "and a little later they have gone").toBe(0);
});

/* EVERY HOUSE HAS MOTIFS OF ITS OWN, and each of them draws. */
test("every house on the chain has motifs of its own, and they draw", async ({ page }) => {
  test.setTimeout(90000);
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  const keys = await page.$$eval(".sheet-frame", (all) => all.map((f) => f.dataset.motif));
  expect(new Set(keys).size, "a different set for every house").toBe(keys.length);
  for (let i = 0; i < keys.length; i++) {
    await page.mouse.move(4, 890);
    await page.waitForTimeout(1900);
    await pointAt(page, i);
    await page.waitForTimeout(2200);
    expect(await motifInk(page), `${keys[i]} should draw something`).toBeGreaterThan(20);
  }
  expect(errors).toEqual([]);
});

/* PRESSING A HOUSE does not cut to it: the page steps back first, and
   only then is the house opened. */
test("pressing a house steps the page back before opening it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const target = page.locator(".sheet-frame").nth(7);
  await target.click();
  await expect(page.locator("body.sheet-leaving")).toHaveCount(1);
  await page.waitForTimeout(200);
  expect(page.url(), "still here a moment after the press").toMatch(/scent-descriptions/);
  const leaving = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelectorAll(".sheet-frame")[2]).opacity));
  expect(leaving, "the rest of the page is on its way out").toBeLessThan(0.9);
  await page.waitForURL(/houses\/tombstone\.html/, { timeout: 4000 });
});

// The page carries no title any more; the heading stays in the markup
// for anything reading the page rather than looking at it.
test("the heading is there for a reader, and out of sight for a looker", async ({ page }) => {
  await page.goto(SHEET);
  await expect(page.locator(".sheet-head h1")).toHaveText("Scent descriptions");
  const box = await page.locator(".sheet-head h1").boundingBox();
  expect(box.width, "it should not be taking up the page").toBeLessThan(3);
});

// Regression test: the page grows a lot taller the moment the sheet
// lands. On a browser with ordinary scrollbars that made one appear,
// which took 15px off the width and shifted everything centred on the
// page sideways at exactly the moment the sheet landed — the whole
// thing looked like it twitched. Room is kept for the scrollbar from
// the start, so nothing moves.
test("nothing shifts sideways when the page grows", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForTimeout(400);

  const searchAt = () =>
    page.locator(".sheet-search").evaluate((el) => el.getBoundingClientRect().left);
  const before = await searchAt();

  await waitForSheet(page);
  expect(Math.abs((await searchAt()) - before), "the chrome should not move").toBeLessThan(1);

  const gutter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollbarGutter);
  expect(gutter, "the room for the scrollbar is what keeps them still").toContain("stable");
});


test("every picture is still a link to a piece", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const hrefs = await page.$$eval(".sheet-frame", (frames) => frames.map((f) => f.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  hrefs.forEach((href) => expect(href, "a frame with nowhere to go is not a piece").toBeTruthy());
});


test("the category names itself once the page has drawn itself", async ({ page }) => {
  await page.goto(SHEET);

  // The two buttons are back, and named for what this category is
  // actually two of now: the Houses — the sheet itself — and the
  // Fragrances, an index of everything written up on it.
  // (The REGISTER those buttons used to switch to is still gone: no
  // gallery entries live on this page any more, they are the
  // chamber's.)
  await expect(page.locator(".sheet-filter")).toHaveCount(2);
  await expect(page.locator(".sheet-filter")).toHaveText(["Houses", "Fragrances"]);
  await expect(page.locator(".gallery-entry")).toHaveCount(0);

  const name = page.locator(".sheet-where");
  await expect(name).toHaveText("Scent descriptions");
  const showingName = () =>
    page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".sheet-where")).opacity));

  // Not there while the chain is still drawing itself.
  expect(await showingName()).toBeLessThan(0.05);

  await waitForSheet(page);
  await expect.poll(showingName, { timeout: 6000 }).toBeGreaterThan(0.9);

  // It stands up at the top of the page beside the Menu, rather than
  // in the page.
  const where = await page.evaluate(() => {
    const box = document.querySelector(".sheet-where").getBoundingClientRect();
    return { fixed: getComputedStyle(document.querySelector(".sheet-where")).position,
             top: box.top, left: box.left };
  });
  expect(where.fixed).toBe("fixed");
  expect(where.top, "up at the top of the page").toBeLessThan(70);
  expect(where.left, "beside the Menu, on the left").toBeLessThan(220);
});

// The number in the corner belongs to the frame, not to the placeholder
// drawn inside it: putting a real picture in takes the hatching away and
// must leave the number where it is.
test("a frame keeps its number once it has a picture in it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const numbered = await page.evaluate(() => {
    const frame = document.querySelectorAll(".sheet-frame")[2];
    const picture = document.createElement("img");
    // A one-pixel picture, so nothing has to be fetched for this.
    picture.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    frame.insertBefore(picture, frame.firstChild);
    const mark = frame.querySelector(".sheet-number");
    const style = getComputedStyle(frame);
    return {
      text: mark.textContent,
      showing: getComputedStyle(mark).visibility !== "hidden" &&
               parseFloat(getComputedStyle(mark).opacity) > 0.5,
      hatchingGone: style.backgroundImage === "none",
    };
  });

  expect(numbered.text, "the number should still say which frame this is").toBe("03");
  expect(numbered.showing, "and should still be visible over the picture").toBe(true);
  expect(numbered.hatchingGone, "the placeholder hatching should be gone").toBe(true);
});


test("the search finds a picture by what it is called", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const field = page.locator(".sheet-search-field");
  await expect(field).toBeHidden(); // a button until it is asked for

  await page.locator(".sheet-search-trigger").click();
  await expect(field).toBeVisible();

  await field.fill("adar");
  // One picture is called that; everything else steps back.
  const dimmed = await page.$$eval(".sheet-frame.dimmed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(dimmed, "everything that doesn't match should step back").toBe(frames - 1);
  await expect(page.locator(".sheet-frame:not(.dimmed) .sheet-caption")).toHaveText(
    "ADAR the house that you have never heard of"
  );

  // Escape clears it and puts the sheet back.
  await field.press("Escape");
  expect(await page.$$eval(".sheet-frame.dimmed", (els) => els.length)).toBe(0);
  await expect(field).toBeHidden();
});

test("with animation turned off it goes straight to the finished sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHEET);

  // Nothing to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
});


test("the page never shows its own contents before the sheet takes over",
  async ({ page }) => {
  // A REGRESSION TEST, and a deterministic one: the page records what
  // it looked like on every frame rather than the test trying to catch
  // the right moment. Between the first paint and contact-sheet.js
  // taking over, the browser used to show the page as it is written —
  // every picture in a plain grid — and then have all of it swept
  // away, which reads as the page blinking its whole contents at you
  // before it starts.
  await page.addInitScript(() => {
    window.__flashed = 0;
    window.__placed = null;
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet) {
        const seen = [...document.querySelectorAll(".sheet-frame")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.width > 4 && box.height > 4 &&
                   getComputedStyle(el).visibility === "visible" &&
                   parseFloat(getComputedStyle(el).opacity) > 0.02;
          });
        if (!sheet.classList.contains("scripted")) {
          if (seen.length > window.__flashed) window.__flashed = seen.length;
        } else if (window.__placed === null) {
          // Where the picture it lands on was on the very first frame
          // the script had drawn: that is where it should stay.
          const plate = document.querySelector(".sheet-frame");
          window.__placed = plate ? plate.getBoundingClientRect().x : null;
        }
      }
      if (performance.now() < 5000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  await page.goto(SHEET);
  await waitForSheet(page);

  expect(await page.evaluate(() => window.__flashed),
    "nothing of the page's own contents should be shown before the script has laid it out")
    .toBe(0);

  // And the pictures are PLACED by that first layout rather than
  // sliding into place from the corner of the sheet, which is what the
  // transition that moves them did to every one of them on arrival.
  const placed = await page.evaluate(() => window.__placed);
  const settled = (await page.locator(".sheet-frame").first().boundingBox()).x;
  expect(Math.abs(placed - settled),
    `the plate was first drawn at ${placed} and settled at ${settled}`).toBeLessThan(12);
});

test("without its script the page is still the plain grid of pictures",
  async ({ page }) => {
  // The holding-back above must not be able to hide the page for good:
  // with the script blocked, what is written in the page IS the page,
  // and it comes back as soon as everything else has loaded.
  await page.route("**/contact-sheet.js", (route) => route.abort());
  await page.goto(SHEET);
  const frames = page.locator(".sheet-frame");
  await expect(frames.first()).toBeVisible({ timeout: 6000 });
  expect(await frames.count()).toBeGreaterThan(4);
  await expect(page.locator(".sheet-head h1")).toHaveText("Scent descriptions");
});

