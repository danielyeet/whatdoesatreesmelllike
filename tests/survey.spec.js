// ============================================================
// THE SURVEY (categories/theories.html)
//
// That category is drawn as a piece of country rather than as a
// list: an island, contoured, with one hill for every theory.
// These check that the country is actually grown from the page's
// own rows, that every hill is still a link to its piece, that it
// can be turned and closed in on with the hand and with the
// keyboard, that it is one screen with nothing to scroll to, and
// that switching the script off leaves the plain list behind.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/theories.html";

/** Where every name on the map is, and how far apart they are spread. */
const namesAt = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".survey-peak")].map((peak) => {
      const r = peak.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })
  );

const spread = (places) => {
  const xs = places.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
};

async function waitForSurvey(page) {
  await page.waitForSelector(".survey-ground", { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const peak = document.querySelector(".survey-peak");
      return peak && peak.style.transform !== "";
    },
    null,
    { timeout: 15000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the country is grown from the page's own rows", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForSurvey(page);

  const survey = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-row")];
    const peaks = [...document.querySelectorAll(".survey-peak")];
    return {
      rows: rows.length,
      peaks: peaks.length,
      // Every hill carries the name of the row it grew from, and goes
      // to the same piece.
      names: peaks.map((p) => p.querySelector(".survey-name").textContent.trim()),
      rowNames: rows.map((r) => r.querySelector(".work-row-title").textContent.trim()),
      hrefs: peaks.map((p) => p.getAttribute("href")),
      rowHrefs: rows.map((r) => r.getAttribute("href")),
      heights: peaks.map((p) => p.querySelector(".survey-height").textContent.trim()),
      surveyed: document.body.classList.contains("surveyed"),
    };
  });

  expect(survey.rows, "there should be theories on the page").toBeGreaterThan(2);
  expect(survey.peaks, "one hill for every one of them").toBe(survey.rows);
  expect(survey.names).toEqual(survey.rowNames);
  expect(survey.hrefs).toEqual(survey.rowHrefs);
  expect(survey.surveyed).toBe(true);
  // Each is given its own height, so the country is uneven rather than
  // a set of identical mounds.
  expect(new Set(survey.heights).size, `heights: ${survey.heights}`).toBeGreaterThan(3);
  survey.heights.forEach((h) => expect(h).toMatch(/^\d+ m$/));

  expect(errors).toEqual([]);
});

test("the list is still there for a reader, and out of sight for a looker", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  // It is the survey's own index: everything on the map is in the
  // page as words as well.
  await expect(page.locator(".work-list")).toBeAttached();
  const shown = await page.evaluate(() => {
    const box = document.querySelector(".work-list").getBoundingClientRect();
    return { w: box.width, h: box.height };
  });
  expect(shown.w, "not drawn").toBeLessThan(3);
  expect(shown.h, "not drawn").toBeLessThan(3);
});

test("the country can be turned with the hand", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const before = await namesAt(page);
  const box = await page.locator(".survey").boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(box.x + box.width * 0.5 - i * 20, box.y + box.height * 0.55);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(700);
  const after = await namesAt(page);

  // Turning moves every name, because the country has turned under
  // all of them — not one of them has been moved on its own.
  const moved = after.map((p, i) => Math.hypot(p.x - before[i].x, p.y - before[i].y));
  expect(Math.min(...moved), "all of them should have travelled").toBeGreaterThan(20);
});

test("scrolling brings the country closer", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const box = await page.locator(".survey").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = spread(await namesAt(page));
  await page.mouse.wheel(0, -700);
  await page.waitForTimeout(900);
  const closer = spread(await namesAt(page));
  expect(closer, "the hills should stand further apart").toBeGreaterThan(before * 1.15);

  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(900);
  const further = spread(await namesAt(page));
  expect(further, "and back together again").toBeLessThan(closer);
});

test("it can be walked round from the keyboard", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  await page.locator(".survey").focus();
  const before = await namesAt(page);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
  const after = await namesAt(page);
  const moved = after.map((p, i) => Math.hypot(p.x - before[i].x, p.y - before[i].y));
  expect(Math.max(...moved), "the arrow keys should turn it").toBeGreaterThan(20);
});

test("a hill is a link to its piece, and can be tabbed to", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const first = page.locator(".survey-peak").first();
  await expect(first).toHaveAttribute("href", /works\//);
  await first.focus();
  expect(
    await page.evaluate(() => document.activeElement.className),
    "a name should take focus"
  ).toContain("survey-peak");
});

test("the whole survey is one screen, with nothing to scroll to", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const fit = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
  }));
  expect(fit.page, `page is ${fit.page}px in a ${fit.window}px window`)
    .toBeLessThanOrEqual(fit.window + 2);
});

test("without the script the page is the plain list of theories", async ({ page }) => {
  await page.route("**/topo-map.js", (route) => route.abort());
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => document.body.classList.contains("surveyed"))).toBe(false);
  expect(await page.locator(".survey").count(), "no survey is drawn").toBe(0);
  // And everything is reachable as a plain page.
  const rows = page.locator(".work-row");
  expect(await rows.count()).toBeGreaterThan(2);
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".page-content h1")).toBeVisible();
});

test("with animation turned off it does not drift on its own", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await waitForSurvey(page);

  const before = await namesAt(page);
  await page.waitForTimeout(1200);
  const after = await namesAt(page);
  const moved = after.map((p, i) => Math.hypot(p.x - before[i].x, p.y - before[i].y));
  expect(Math.max(...moved), "it should stand still until it is moved").toBeLessThan(2);

  // Still fully readable, though: it is held still, not switched off.
  await page.locator(".survey").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const turned = await namesAt(page);
  expect(
    Math.max(...turned.map((p, i) => Math.hypot(p.x - after[i].x, p.y - after[i].y))),
    "and still turn when it is asked to"
  ).toBeGreaterThan(2);
});
