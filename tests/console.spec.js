// ============================================================
// THE CONSOLE (categories/theories.html)
//
// That category is read the way an instrument is read: the theories
// sorted into channels down the left, the open one on the right, and
// a reading along the foot with one peak per channel. These check
// that the channels are read off the page's own rows rather than
// written into the script, that opening one changes what is on the
// right, that it works from the keyboard as a tab strip should, that
// every entry is still a link to its piece, that the page is one
// screen, and that switching the script off leaves the plain list.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/theories.html";

const openTab = (page) => page.locator(".console-tab.open");
const openPanel = (page) => page.locator(".console-panel.open");

async function waitForConsole(page) {
  await page.waitForSelector(".console-tab.open", { timeout: 15000 });
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the channels are read off the page's own rows", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForConsole(page);

  const read = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-row")];
    // The channels the page itself names, in the order they first turn up.
    const named = [];
    rows.forEach((row) => {
      const on = (row.dataset.channel || "Unsorted").trim();
      if (named.indexOf(on) < 0) named.push(on);
    });
    return {
      named: named,
      tabs: [...document.querySelectorAll(".console-tab .console-name")]
        .map((el) => el.textContent.trim()),
      counts: [...document.querySelectorAll(".console-tab .console-count")]
        .map((el) => Number(el.textContent)),
      perChannel: named.map(
        (on) => rows.filter((row) => (row.dataset.channel || "Unsorted").trim() === on).length
      ),
      entries: document.querySelectorAll(".console-entry").length,
      rows: rows.length,
      consoled: document.body.classList.contains("consoled"),
    };
  });

  expect(read.named.length, "the page should name a few channels").toBeGreaterThan(1);
  expect(read.tabs, "a tab for each, in the order the page names them").toEqual(read.named);
  expect(read.counts, "and each carrying its own count").toEqual(read.perChannel);
  // Every theory ends up on exactly one channel: nothing is left out
  // and nothing is listed twice.
  expect(read.entries).toBe(read.rows);
  expect(read.consoled).toBe(true);
  expect(errors).toEqual([]);
});

test("one channel is open at a time, and opening another changes what is on the right",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);

  expect(await page.locator(".console-tab.open").count(), "one open").toBe(1);
  expect(await page.locator(".console-panel.open").count(), "one panel").toBe(1);
  const first = await openPanel(page).locator("h2").textContent();

  await page.locator(".console-tab").nth(1).click();
  await page.waitForTimeout(600);

  expect(await page.locator(".console-tab.open").count(), "still one open").toBe(1);
  const second = await openPanel(page).locator("h2").textContent();
  expect(second, "a different channel").not.toBe(first);
  // The open panel is the one the open tab points at.
  expect(await openPanel(page).getAttribute("id"))
    .toBe(await openTab(page).getAttribute("aria-controls"));
  // And the rest are out of the page rather than merely faded.
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll(".console-panel:not(.open)")].every((p) => p.hidden)),
    "the channels you are not reading are not on the page"
  ).toBe(true);
});

test("the channels work from the keyboard, the way a strip of tabs should",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);

  // Only the open one is in the tab order: the strip is one control.
  const stops = await page.$$eval(".console-tab", (tabs) =>
    tabs.map((t) => t.tabIndex));
  expect(stops.filter((n) => n === 0).length, "one stop for the whole strip").toBe(1);

  await page.locator(".console-tab.open").focus();
  const first = await openTab(page).locator(".console-name").textContent();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  const second = await openTab(page).locator(".console-name").textContent();
  expect(second, "the arrow keys should move along the strip").not.toBe(first);
  // And it takes the focus with it, or the next press would go
  // somewhere else entirely.
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("console-tab");

  await page.keyboard.press("End");
  await page.waitForTimeout(400);
  const last = await page.locator(".console-tab").last();
  await expect(last).toHaveClass(/open/);
});

test("the reading answers the channel that is open", async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);
  await page.waitForTimeout(700);

  /**
   * How high the reading stands over one point along the foot,
   * measured as pixels above the bottom of the page.
   *
   * Read off the canvas rather than out of the script: the peak is
   * drawn, not written into the DOM, so the only honest way to ask
   * whether it answered is to look at what was drawn. Only the front
   * line counts — the squared paper behind it and the rank standing
   * behind that are drawn far too faint to pass this.
   */
  const standsAt = (share) =>
    page.evaluate((at) => {
      const canvas = document.querySelector(".console-paper");
      const paint = canvas.getContext("2d");
      const ratio = canvas.width / canvas.clientWidth;
      const x = Math.round(canvas.width * at);
      const deep = Math.round(240 * ratio);
      const from = canvas.height - deep;
      const strip = paint.getImageData(x, from, 2, deep).data;
      for (let n = 0; n < strip.length; n += 4) {
        if (strip[n + 3] > 60 && strip[n] < 200) {
          return deep - Math.floor(n / 4 / 2);   // two pixels wide
        }
      }
      return 0;
    }, share);

  // The open channel's peak stands over its own mark on the foot, so
  // there is more of the trace above it than above the others.
  const channels = await page.locator(".console-tab").count();
  const overFirst = await standsAt(0.5 / channels);
  const overSecond = await standsAt(1.5 / channels);
  expect(overFirst, "the open channel should stand tallest")
    .toBeGreaterThan(overSecond * 1.5);

  await page.locator(".console-tab").nth(1).click();
  await page.waitForTimeout(1000);
  expect(
    await standsAt(1.5 / channels),
    "and the reading should follow the one you open"
  ).toBeGreaterThan(overSecond * 1.5);
  expect(
    await standsAt(0.5 / channels),
    "while the one you left settles back"
  ).toBeLessThan(overFirst);
});

test("every entry is still a link to its piece", async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);

  const links = await page.$$eval(".console-entry", (all) =>
    all.map((a) => ({ href: a.getAttribute("href"), name: a.querySelector(".console-entry-name").textContent.trim() }))
  );
  expect(links.length).toBeGreaterThan(2);
  links.forEach((link) => {
    expect(link.href, `${link.name} should point at a piece`).toMatch(/works\//);
    expect(link.name.length).toBeGreaterThan(0);
  });
});

test("the whole console is one screen, with nothing to scroll to", async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);

  const fit = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
  }));
  expect(fit.page, `page is ${fit.page}px in a ${fit.window}px window`)
    .toBeLessThanOrEqual(fit.window + 2);
});

test("the page says what it is, small, beside the Menu", async ({ page }) => {
  await page.goto(PAGE);
  await waitForConsole(page);

  const where = page.locator(".page-where");
  await expect(where).toHaveText("Theories");
  const placed = await page.evaluate(() => {
    const mark = document.querySelector(".page-where").getBoundingClientRect();
    const menu = document.querySelector(".menu-trigger").getBoundingClientRect();
    return { after: mark.left - menu.right, line: Math.abs(mark.top - menu.top) };
  });
  expect(placed.after, "just along from the Menu").toBeGreaterThan(4);
  expect(placed.after, "and not away across the page").toBeLessThan(80);
  expect(placed.line, "on the same line as it").toBeLessThan(4);
});

test("without the script the page is the plain list of theories", async ({ page }) => {
  await page.route("**/console.js", (route) => route.abort());
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => document.body.classList.contains("consoled"))).toBe(false);
  expect(await page.locator(".console").count(), "no console is drawn").toBe(0);
  const rows = page.locator(".work-row");
  expect(await rows.count()).toBeGreaterThan(2);
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".page-content h1")).toBeVisible();
});
