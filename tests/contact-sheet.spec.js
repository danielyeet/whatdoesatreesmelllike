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

// Regression test: the first version of this ran every line off one
// band of horizontals under the top picture, so a line reaching a
// picture in the second row was drawn straight across a picture in the
// first. The layout now works down the page in bands, one under each
// row, which is what keeps the lines clear of everything they are not
// pointing at.
test("no line is drawn across a picture", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const crossings = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const boxes = frames.map((f) => {
      const r = f.getBoundingClientRect();
      // Pulled in a little: a line is supposed to stop ON the top edge
      // of the picture it belongs to, and that must not count as
      // crossing it.
      return {
        left: r.left - base.left + 2, right: r.right - base.left - 2,
        top: r.top - base.top + 2, bottom: r.bottom - base.top - 2,
      };
    });

    const found = [];
    [...document.querySelectorAll(".sheet-route")].forEach((route, routeIndex) => {
      const points = route.getAttribute("points").trim().split(/\s+/)
        .map((pair) => pair.split(",").map(Number));
      for (let p = 0; p < points.length - 1; p++) {
        const [x1, y1] = points[p];
        const [x2, y2] = points[p + 1];
        const loX = Math.min(x1, x2), hiX = Math.max(x1, x2);
        const loY = Math.min(y1, y2), hiY = Math.max(y1, y2);
        boxes.forEach((box, frameIndex) => {
          // Its own picture is at the end of it; the top picture is
          // where every line starts.
          if (frameIndex === 0 || frameIndex === routeIndex + 1) return;
          if (hiX > box.left && loX < box.right && hiY > box.top && loY < box.bottom) {
            found.push({ route: routeIndex + 1, frame: frameIndex + 1 });
          }
        });
      }
    });
    return found;
  });

  expect(crossings, `lines crossing pictures: ${JSON.stringify(crossings)}`).toEqual([]);
});

test("every line lands on the top edge of its own picture", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const landings = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const frames = [...document.querySelectorAll(".sheet-frame")];
    return [...document.querySelectorAll(".sheet-route")].map((route, i) => {
      const points = route.getAttribute("points").trim().split(/\s+/)
        .map((pair) => pair.split(",").map(Number));
      const end = points[points.length - 1];
      const r = frames[i + 1].getBoundingClientRect();
      return {
        offX: end[0] - (r.left - base.left + r.width / 2),
        offY: end[1] - (r.top - base.top),
      };
    });
  });

  landings.forEach((landing, i) => {
    expect(Math.abs(landing.offX), `line ${i + 1} should meet the middle of its picture`).toBeLessThan(2);
    expect(Math.abs(landing.offY), `line ${i + 1} should stop on its top edge`).toBeLessThan(2);
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

test("with animation turned off it goes straight to the finished sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHEET);

  // No flick to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
});
