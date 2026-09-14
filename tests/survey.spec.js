// ============================================================
// THE SURVEY (categories/theories.html)
//
// That category is drawn as a piece of country rather than as a
// list: the whole page is contoured ground running out to a haze,
// with one mark on it for every theory. These check that the
// country is grown from the page's own rows, that every mark is
// still a link to its piece and can be tabbed to, that a theory is
// a mark until it is pointed at and a name only then, that it can
// be turned and closed in on with the hand and with the keyboard,
// that the ground is dark and says so to the cursor, that it is
// one screen with nothing to scroll to, and that switching the
// script off leaves the plain list behind.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/theories.html";

/**
 * Where each mark that is actually on the country is standing, keyed
 * by which theory it is. A mark behind you or gone into the haze is
 * taken off the page altogether, so this is a handful of them rather
 * than all of them, and which handful changes as it turns.
 */
const marksAt = (page) =>
  page.evaluate(() => {
    const out = {};
    [...document.querySelectorAll(".survey-peak")].forEach((peak, i) => {
      if (peak.classList.contains("gone")) return;
      const r = peak.getBoundingClientRect();
      out[i] = [r.left, r.top];
    });
    return out;
  });

/** How far the two furthest apart of a set of marks are. */
const widest = (places, only) => {
  const keys = only || Object.keys(places);
  let most = 0;
  for (const a of keys) {
    for (const b of keys) {
      most = Math.max(most, Math.hypot(places[a][0] - places[b][0], places[a][1] - places[b][1]));
    }
  }
  return most;
};

/** How far each mark travelled, for the ones on the page both times. */
const travelled = (before, after) =>
  Object.keys(before)
    .filter((k) => after[k])
    .map((k) => Math.hypot(after[k][0] - before[k][0], after[k][1] - before[k][1]));

async function waitForSurvey(page) {
  await page.waitForSelector(".survey-ground", { timeout: 15000 });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".survey-peak")]
        .some((peak) => !peak.classList.contains("gone") && peak.style.transform !== ""),
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

  const before = await marksAt(page);
  const box = await page.locator(".survey").boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(box.x + box.width * 0.5 - i * 20, box.y + box.height * 0.55);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(700);
  const after = await marksAt(page);

  // Turning moves every mark, because the country has turned under all
  // of them — not one of them has been moved on its own.
  const moved = travelled(before, after);
  expect(moved.length, "some marks should be on the page both times").toBeGreaterThan(0);
  expect(Math.min(...moved), "all of them should have travelled").toBeGreaterThan(20);
});

test("scrolling brings the country closer", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const box = await page.locator(".survey").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = await marksAt(page);
  await page.mouse.wheel(0, -700);
  await page.waitForTimeout(900);
  const closer = await marksAt(page);

  // Measured over the marks that are on the page both times: coming
  // closer spreads the country, so any two of them stand further
  // apart than they did.
  const both = Object.keys(before).filter((k) => closer[k]);
  expect(both.length, "some marks should be there both times").toBeGreaterThan(1);
  expect(widest(closer, both), "the country should have opened out")
    .toBeGreaterThan(widest(before, both) * 1.15);

  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(900);
  const back = await marksAt(page);
  const still = both.filter((k) => back[k]);
  expect(widest(back, still), "and closed up again")
    .toBeLessThan(widest(closer, still));
});

test("it can be walked round from the keyboard", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  await page.locator(".survey").focus();
  const before = await marksAt(page);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
  const after = await marksAt(page);
  const moved = travelled(before, after);
  expect(Math.max(...moved), "the arrow keys should turn it").toBeGreaterThan(20);
});

test("a hill is a link to its piece, and can be tabbed to", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const there = page.locator(".survey-peak:not(.gone)").first();
  await expect(there).toHaveAttribute("href", /works\//);
  await there.focus();
  expect(
    await page.evaluate(() => document.activeElement.className),
    "a mark should take focus"
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

  const before = await marksAt(page);
  await page.waitForTimeout(1200);
  const after = await marksAt(page);
  expect(Math.max(...travelled(before, after)), "it should stand still until it is moved")
    .toBeLessThan(2);

  // Still fully readable, though: it is held still, not switched off.
  await page.locator(".survey").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const turned = await marksAt(page);
  expect(
    Math.max(...travelled(after, turned)),
    "and still turn when it is asked to"
  ).toBeGreaterThan(2);
});

test("a theory is a mark until it is pointed at, and then it is a name", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  const mark = page.locator(".survey-peak:not(.gone)").first();
  const says = mark.locator(".survey-say");

  // The name is in the page — it has to be, for anything reading
  // rather than looking — but it is not written on the country.
  await expect(says).toHaveCount(1);
  expect(
    await says.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
    "nothing written until it is pointed at"
  ).toBeLessThan(0.05);

  const box = await mark.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect
    .poll(() => says.evaluate((el) => parseFloat(getComputedStyle(el).opacity)), { timeout: 3000 })
    .toBeGreaterThan(0.9);
  await expect(mark.locator(".survey-name")).not.toHaveText("");
});

test("the country is dark, and says so to the cursor", async ({ page }) => {
  await page.goto(PAGE);
  await waitForSurvey(page);

  // A full-bleed dark region has to carry `dark-surface`, or nav.js's
  // cursor stays dark over it and is invisible.
  await expect(page.locator(".survey")).toHaveClass(/dark-surface/);
  const tone = await page.evaluate(() => {
    const paint = getComputedStyle(document.querySelector(".survey")).backgroundColor;
    const [r, g, b] = paint.match(/\d+/g).map(Number);
    return (r + g + b) / 3;
  });
  expect(tone, "the ground should be nearly black").toBeLessThan(40);
});
