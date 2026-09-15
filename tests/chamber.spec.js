// ============================================================
// THE CHAMBER (categories/favorites.html)
//
// That category is a chamber: four injectors, one at each corner of
// the window, firing a fine stream of particles inward on white. The
// streams fall towards the middle, are caught, and settle into a ring
// standing round the menu of favourites — the theories drawing's world
// turned inside out, ink on white instead of white on near-black.
//
// These check that the menu is grown from the page's own favourites
// and carries what the contact sheet's Favorites menu carries, that
// one chapter is open at a time and the strip works from the keyboard,
// that there really is an injector in each corner, that the ring
// stands round the writing and nothing is drawn behind it, that the
// streams answer the cursor, that it holds still when animation is
// turned off, and that the plain list comes back when the script is
// blocked.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/favorites.html";

/** How much ink there is in one square of the drawing, and how much of
    it is the cool accent the cursor leaves behind. */
const inkIn = (page, box) =>
  page.evaluate(([x, y, w, h]) => {
    const canvas = document.querySelector(".chamber-field");
    const paint = canvas.getContext("2d");
    const ratio = canvas.width / canvas.clientWidth;
    const shot = paint.getImageData(
      Math.round(x * ratio), Math.round(y * ratio),
      Math.max(1, Math.round(w * ratio)), Math.max(1, Math.round(h * ratio))
    ).data;
    let ink = 0, cool = 0;
    for (let n = 0; n < shot.length; n += 4) {
      if (shot[n + 3] < 12) continue;
      ink += shot[n + 3];
      if (shot[n + 2] > shot[n] + 24) cool += shot[n + 3];
    }
    return { ink: ink, cool: cool };
  }, box);

async function waitForChamber(page) {
  await page.waitForSelector(".chamber-field", { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".chamber-item").length > 0,
    null,
    { timeout: 15000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the menu is grown from the page's own favourites", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);

  const built = await page.evaluate(() => {
    const entries = [...document.querySelectorAll(".gallery-entry")];
    const named = [];
    entries.forEach((entry) => {
      const on = (entry.dataset.chapter || "Unsorted").trim();
      if (named.indexOf(on) < 0) named.push(on);
    });
    return {
      named: named,
      perChapter: named.map(
        (on) => entries.filter((e) => (e.dataset.chapter || "Unsorted").trim() === on).length
      ),
      tabs: [...document.querySelectorAll(".chamber-tab-name")].map((el) => el.textContent.trim()),
      counts: [...document.querySelectorAll(".chamber-tab-count")].map((el) => Number(el.textContent)),
      entries: entries.length,
      chambered: document.body.classList.contains("chambered"),
    };
  });

  expect(built.entries, "the page should carry some favourites").toBeGreaterThan(2);
  expect(built.named.length, "filed under a few chapters").toBeGreaterThan(1);
  expect(built.tabs, "a tab for each, in the order the page names them").toEqual(built.named);
  expect(built.counts, "and each carrying its own count").toEqual(built.perChapter);
  expect(built.chambered).toBe(true);
  expect(errors).toEqual([]);
});

test("it carries what the sheet's Favorites menu carries: number, date, name, link",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  const rows = await page.$$eval(".chamber-panel.open .chamber-item", (all) =>
    all.map((row) => ({
      no: row.querySelector(".chamber-no").textContent.trim(),
      date: row.querySelector(".chamber-date").textContent.trim(),
      name: row.querySelector(".chamber-name").textContent.trim(),
      href: row.getAttribute("href"),
    }))
  );
  expect(rows.length).toBeGreaterThan(1);
  rows.forEach((row, n) => {
    expect(row.no, "numbered in order").toBe(String(n + 1).padStart(2, "0"));
    expect(row.date, `${row.name} should carry the date it is filed under`)
      .toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    expect(row.name.length).toBeGreaterThan(0);
    expect(row.href, `${row.name} should point at a piece`).toMatch(/works\//);
  });

  // And the spec line the sheet's plate carries, set as one line.
  expect(await page.locator(".chamber-spec").textContent())
    .toMatch(/ENTRIES \d\d.+FIRST \d{2}\.\d{2}\.\d{4}.+LAST \d{2}\.\d{2}\.\d{4}/);
});

test("one chapter is open at a time, and the strip works from the keyboard",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  expect(await page.locator(".chamber-tab.open").count(), "one open").toBe(1);
  expect(await page.locator(".chamber-panel:not([hidden])").count(), "one panel").toBe(1);

  // Only the open one is in the tab order: the strip is one control.
  const stops = await page.$$eval(".chamber-tab", (tabs) => tabs.map((t) => t.tabIndex));
  expect(stops.filter((n) => n === 0).length, "one stop for the whole strip").toBe(1);

  const first = await page.locator(".chamber-tab.open .chamber-tab-name").textContent();
  await page.locator(".chamber-tab.open").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  expect(await page.locator(".chamber-tab.open .chamber-tab-name").textContent(),
    "the arrow keys should move along the strip").not.toBe(first);
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("chamber-tab");
});

test("there is an injector in each corner, firing inward", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(6000);

  const box = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const side = Math.round(Math.min(box.w, box.h) * 0.3);
  const corners = [
    ["top left", [0, 0, side, side]],
    ["top right", [box.w - side, 0, side, side]],
    ["bottom right", [box.w - side, box.h - side, side, side]],
    ["bottom left", [0, box.h - side, side, side]],
  ];
  for (const [where, at] of corners) {
    const seen = await inkIn(page, at);
    expect(seen.ink, `there should be an injector and its stream in the ${where} corner`)
      .toBeGreaterThan(400);
  }
});

test("what it catches stands in a ring round the writing, not behind it",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(14000);

  const plate = await page.locator(".chamber-plate").boundingBox();
  // Nothing at all is drawn where the menu stands: the ring passes
  // behind it, so the writing is never printed through.
  const behind = await inkIn(page, [
    plate.x + 20, plate.y + 20, plate.width - 40, plate.height - 40,
  ]);
  expect(behind.ink, "nothing should be drawn behind the writing").toBe(0);

  // And there is plenty of it just outside, on both sides — which is
  // what makes it a ring rather than a drift to one side.
  const band = 150;
  const left = await inkIn(page, [
    Math.max(0, plate.x - band - 10), plate.y, band, plate.height,
  ]);
  const right = await inkIn(page, [plate.x + plate.width + 10, plate.y, band, plate.height]);
  expect(left.ink, "the ring should stand to the left of the writing").toBeGreaterThan(800);
  expect(right.ink, "and to the right of it").toBeGreaterThan(800);
});

test("the streams answer the cursor", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  const plate = await page.locator(".chamber-plate").boundingBox();
  // In the ring, off to one side of the writing.
  const at = { x: plate.x + plate.width + 90, y: plate.y + plate.height / 2 };
  const side = 260;
  const box = [at.x - side / 2, at.y - side / 2, side, side];

  const before = await inkIn(page, box);
  await page.mouse.move(at.x, at.y);
  await page.waitForTimeout(900);
  const under = await inkIn(page, box);

  // What the hand does is turn what it is pushing to the cool accent —
  // the same one the theories drawing keeps for the marks that mean
  // something, brought down onto white.
  expect(under.cool, `before ${before.cool}, under the hand ${under.cool}`)
    .toBeGreaterThan(before.cool + 400);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(1500);
  expect((await inkIn(page, box)).cool, "and let go of them again")
    .toBeLessThan(under.cool);
});

test("with animation turned off it stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(800);

  const shot = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".chamber-field");
      const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let n = 3; n < d.length; n += 4) ink += d[n];
      return ink;
    });
  const before = await shot();
  await page.waitForTimeout(1400);
  expect(await shot(), "nothing should move").toBe(before);
  // Still drawn, though: held still rather than switched off.
  expect(before).toBeGreaterThan(0);
  await expect(page.locator(".chamber-item").first()).toBeVisible();
});

test("without the script the page is the plain list of favourites", async ({ page }) => {
  await page.route("**/chamber.js", (route) => route.abort());
  await page.goto(PAGE);

  const entries = page.locator(".gallery-entry");
  await expect(entries.first()).toBeVisible({ timeout: 6000 });
  expect(await entries.count()).toBeGreaterThan(2);
  expect(await page.evaluate(() => document.body.classList.contains("chambered"))).toBe(false);
  expect(await page.locator(".chamber").count(), "nothing is drawn").toBe(0);
  await expect(page.locator(".page-content h1")).toBeVisible();
});
