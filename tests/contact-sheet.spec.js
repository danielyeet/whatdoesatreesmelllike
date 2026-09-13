// ============================================================
// THE CONTACT SHEET (categories/scent-descriptions.html)
//
// The page opens white with one square window in the middle, every
// picture flicks through it, it settles on the first, and lines then
// grow down to the rest. These check the parts of that which can be
// wrong rather than merely ugly — above all that no line is drawn
// across a picture on its way to another one, which is what the
// layout is arranged in bands to prevent.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/** Which frame is showing in the middle window right now, or -1. */
const showing = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".sheet-frame")].findIndex(
      (f) => getComputedStyle(f).visibility === "visible"
    )
  );

/** Wait for the whole sequence — flick, settle, every line drawn. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      return frames.length > 1 && frames.slice(1).every((f) => f.classList.contains("landed"));
    },
    null,
    { timeout: 20000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page opens white, with one picture in the middle and nothing else", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(SHEET);

  // Exactly one frame showing, and it is the middle window rather than
  // a grid — the rest are stacked behind it.
  await expect.poll(() => showing(page), { timeout: 4000 }).toBeGreaterThanOrEqual(0);
  const visible = await page.$$eval(".sheet-frame", (frames) =>
    frames.filter((f) => getComputedStyle(f).visibility === "visible").length
  );
  expect(visible, "one picture at a time").toBe(1);

  // The name and the lede are not there yet: they arrive once it settles.
  const head = await page.evaluate(() => ({
    name: parseFloat(getComputedStyle(document.querySelector(".sheet-head h1")).opacity),
    lede: parseFloat(getComputedStyle(document.querySelector(".category-lede")).opacity),
  }));
  expect(head.name, "the name waits for the sheet to settle").toBeLessThan(0.05);
  expect(head.lede).toBeLessThan(0.05);

  expect(errors).toEqual([]);
});

test("the pictures flick through the window, then it settles on the first", async ({ page }) => {
  await page.goto(SHEET);

  // Sample what is showing, often enough to catch the fast part of the
  // run at the start.
  const seen = [];
  for (let i = 0; i < 24; i++) {
    seen.push(await showing(page));
    await page.waitForTimeout(60);
  }
  const distinct = new Set(seen.filter((i) => i >= 0));
  expect(distinct.size, `should flick through several pictures, saw ${[...distinct]}`).toBeGreaterThan(2);

  await waitForSheet(page);
  expect(await showing(page), "it settles on the first picture").toBe(0);
});

test("the picture it settles on stays exactly where it was", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForTimeout(500);
  const before = await page.locator(".sheet-frame").first().boundingBox();

  await waitForSheet(page);
  const after = await page.locator(".sheet-frame").first().boundingBox();

  expect(Math.abs(after.x - before.x), "should not shift sideways").toBeLessThan(1);
  expect(Math.abs(after.y - before.y), "should not shift up or down").toBeLessThan(1);
  expect(Math.abs(after.width - before.width), "and should not resize").toBeLessThan(1);
});

// Regression test: an early version of this page ran every line off one
// band of horizontals under the top picture, so a line reaching a
// picture in the second row was drawn straight across a picture in the
// first. The lines now go at whatever angle they like, so nothing about
// the layout keeps them clear — instead a link that would cut through
// another picture is not made at all, and the picture it would have
// reached is left unlinked.
test("no line is drawn across a picture", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const crossings = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const boxes = [...document.querySelectorAll(".sheet-frame")].map((f) => {
      const r = f.getBoundingClientRect();
      // Pulled in a little, so a line stopping just off a picture's
      // edge is never counted as going through it.
      return {
        left: r.left - base.left + 2, right: r.right - base.left - 2,
        top: r.top - base.top + 2, bottom: r.bottom - base.top - 2,
      };
    });

    // The same clipping test the page itself uses to decide this.
    const cuts = (from, to, box) => {
      const dx = to.x - from.x, dy = to.y - from.y;
      const edges = [
        [-dx, from.x - box.left], [dx, box.right - from.x],
        [-dy, from.y - box.top], [dy, box.bottom - from.y],
      ];
      let near = 0, far = 1;
      for (const [along, room] of edges) {
        if (along === 0) { if (room < 0) return false; continue; }
        const at = room / along;
        if (along < 0) near = Math.max(near, at);
        else far = Math.min(far, at);
        if (near > far) return false;
      }
      return true;
    };

    const found = [];
    [...document.querySelectorAll(".sheet-route")].forEach((route) => {
      const from = { x: +route.getAttribute("x1"), y: +route.getAttribute("y1") };
      const to = { x: +route.getAttribute("x2"), y: +route.getAttribute("y2") };
      const ends = [Number(route.dataset.from), Number(route.dataset.to)];
      boxes.forEach((box, i) => {
        if (ends.indexOf(i) >= 0) return;  // the two it belongs to
        if (cuts(from, to, box)) found.push({ line: ends.join("-"), through: i + 1 });
      });
    });
    return found;
  });

  expect(crossings, `lines crossing pictures: ${JSON.stringify(crossings)}`).toEqual([]);
});

test("every line stops just off the pictures it joins", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const gaps = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const out = [];
    [...document.querySelectorAll(".sheet-route")].forEach((route) => {
      [["x1", "y1", "from"], ["x2", "y2", "to"]].forEach(([xa, ya, which]) => {
        const x = +route.getAttribute(xa), y = +route.getAttribute(ya);
        const r = frames[Number(route.dataset[which])].getBoundingClientRect();
        const left = r.left - base.left, top = r.top - base.top;
        // How far the end of the line is from the picture it belongs to.
        const dx = Math.max(left - x, 0, x - (left + r.width));
        const dy = Math.max(top - y, 0, y - (top + r.height));
        out.push({ line: route.dataset.from + "-" + route.dataset.to, gap: Math.hypot(dx, dy) });
      });
    });
    return out;
  });

  expect(gaps.length, "there should be lines to check").toBeGreaterThan(4);
  gaps.forEach((end) => {
    // It has to reach its picture without touching it: the same clear
    // space at both ends, so the lines read as joining rather than
    // being pinned on.
    expect(end.gap, `line ${end.line} should stop just off its picture`).toBeGreaterThan(3);
    expect(end.gap, `line ${end.line} should not stop short of it`).toBeLessThan(16);
  });
});

test("the name and the lede arrive once it has settled", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  await expect
    .poll(
      () => page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector(".sheet-head h1")).opacity)),
      { timeout: 5000 }
    )
    .toBeGreaterThan(0.9);

  await expect(page.locator(".sheet-head h1")).toHaveText("Scent descriptions");
  expect(
    await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".category-lede")).opacity))
  ).toBeGreaterThan(0.9);
});

test("every picture is still a link to a piece", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const hrefs = await page.$$eval(".sheet-frame", (frames) => frames.map((f) => f.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  hrefs.forEach((href) => expect(href, "a frame with nowhere to go is not a piece").toBeTruthy());
});

// Regression test: the flick used to run to wherever it happened to get
// to and then cut to the first picture once it was over, which was one
// blink too many — the run now ENDS on that picture. Nothing may change
// in the window between the last cut of the flick and the settled page.
test("the flick ends on the picture it keeps, with no last blink", async ({ page }) => {
  await page.goto(SHEET);

  await page.evaluate(() => {
    window.__run = [];
    const sheet = document.getElementById("sheet");
    const tick = () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      window.__run.push({
        showing: frames.findIndex((f) => getComputedStyle(f).visibility === "visible"),
        settled: sheet.classList.contains("settled"),
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await waitForSheet(page);
  const run = await page.evaluate(() => window.__run);

  const lastOfFlick = [...run].reverse().find((f) => !f.settled && f.showing >= 0);
  const firstSettled = run.find((f) => f.settled && f.showing >= 0);
  expect(lastOfFlick, "the flick should have been caught running").toBeTruthy();
  expect(firstSettled, "it should have settled").toBeTruthy();
  expect(
    firstSettled.showing,
    `the flick ended on picture ${lastOfFlick.showing + 1} and the page kept ${firstSettled.showing + 1}`
  ).toBe(lastOfFlick.showing);
});

test("the three buttons arrive with the name, and one is chosen at a time", async ({ page }) => {
  await page.goto(SHEET);

  const filters = page.locator(".sheet-filter");
  await expect(filters).toHaveCount(3);
  await expect(filters).toHaveText(["Houses", "Perfumes", "My favorites"]);

  // Not there while the pictures are still flicking through.
  expect(
    await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".sheet-filters")).opacity))
  ).toBeLessThan(0.05);

  await waitForSheet(page);
  await expect
    .poll(
      () => page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector(".sheet-filters")).opacity)),
      { timeout: 5000 }
    )
    .toBeGreaterThan(0.9);

  await filters.nth(1).click();
  await expect(filters.nth(1)).toHaveClass(/chosen/);
  await expect(filters.nth(0)).not.toHaveClass(/chosen/);
  await expect(filters.nth(2)).not.toHaveClass(/chosen/);
});

test("the search finds a picture by what it is called", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const field = page.locator(".sheet-search-field");
  await expect(field).toBeHidden(); // a button until it is asked for

  await page.locator(".sheet-search-trigger").click();
  await expect(field).toBeVisible();

  await field.fill("history");
  // One picture is called that; everything else steps back.
  const dimmed = await page.$$eval(".sheet-frame.dimmed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(dimmed, "everything that doesn't match should step back").toBe(frames - 1);
  await expect(page.locator(".sheet-frame:not(.dimmed) .sheet-caption")).toHaveText(
    "A short history of vetiver"
  );

  // Escape clears it and puts the sheet back.
  await field.press("Escape");
  expect(await page.$$eval(".sheet-frame.dimmed", (els) => els.length)).toBe(0);
  await expect(field).toBeHidden();
});

test("with animation turned off it goes straight to the finished sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHEET);

  // No flick to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
});
