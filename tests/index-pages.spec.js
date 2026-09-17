// ============================================================
// THE INDEX PAGES
//
// Two places are laid out as an index rather than as a drawing: the
// Researches category, and the Fragrances view of the
// contact sheet page. They share a stylesheet block and a script, so
// these check both — and above all the three things the owner asked
// for, which are the things a plain table does not do on its own:
// the headings stay stuck to the top while the rows scroll under
// them, every heading sorts by its own column, and the field above
// searches.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const RESEARCHES = "/categories/researches.html";
const SHEET = "/categories/scent-descriptions.html";

/** The rows showing right now, read off what each row SAYS it is
 *  rather than off its lettering — the same thing the sorting reads. */
const showing = (page) =>
  page.$$eval(".index-table tbody tr:not([hidden])", (rows) =>
    rows.map((row) => ({
      no: Number(row.dataset.no),
      name: row.dataset.name,
      house: row.dataset.house || "",
      date: row.dataset.date || "",
    }))
  );

/** Switch the contact sheet page over to the fragrances view and wait
 *  for the sheet to have finished first — the buttons are not there
 *  until the page has drawn itself. */
async function toFragrances(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.click('.sheet-filter[data-view="fragrances"]');
  await page.waitForTimeout(600);
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the researches are a numbered, dated table, and the first one opens",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(RESEARCHES);

  const rows = await showing(page);
  expect(rows.length, "the table should have rows").toBeGreaterThan(1);
  expect(rows[0].name, "the first research is the owner's own").toBe("Resins in Perfumery");

  // Three columns, in the order asked for: the number, the research,
  // and the date it was made.
  await expect(page.locator(".index-table thead th")).toHaveText([
    "No.", "Research", "Date",
  ]);

  // And the first one is a link to a page that is really there.
  const href = await page.locator(".index-table tbody tr a").first().getAttribute("href");
  expect(href).toContain("resins-in-perfumery.html");
  const opened = await page.request.get(new URL(href, page.url()).toString());
  expect(opened.status(), "the research it points at should be served").toBe(200);

  expect(errors, "no console errors").toEqual([]);
});

test("the headings sort the table, and pressing one again turns it round",
  async ({ page }) => {
  await page.goto(SHEET);
  await toFragrances(page);

  // As written: by number.
  const written = await showing(page);
  expect(written.length, "every fragrance on the site").toBeGreaterThan(20);
  expect(written.map((r) => r.no)).toEqual(written.map((r, i) => i + 1));

  // By name, both ways.
  await page.click('.index-sort[data-key="name"]');
  const byName = (await showing(page)).map((r) => r.name.toLowerCase());
  expect(byName, "sorted by what a fragrance is called")
    .toEqual(byName.slice().sort());
  await page.click('.index-sort[data-key="name"]');
  const back = (await showing(page)).map((r) => r.name.toLowerCase());
  expect(back, "and the other way round the second time")
    .toEqual(byName.slice().reverse());

  // By house, alphabetically.
  await page.click('.index-sort[data-key="house"]');
  const byHouse = (await showing(page)).map((r) => r.house.toLowerCase());
  expect(byHouse).toEqual(byHouse.slice().sort());

  // By date, which is a date and not the lettering it is printed as:
  // "10.05.2025" sorts before "04.06.2025" although it reads larger.
  await page.click('.index-sort[data-key="date"]');
  const byDate = (await showing(page)).map((r) => r.date);
  expect(byDate).toEqual(byDate.slice().sort());

  // A row's NUMBER is its own and does not change when the table is
  // sorted: sorting says where things stand, not what they are called.
  const numbered = await page.$$eval(".index-table tbody tr:not([hidden])", (rows) =>
    rows.map((row) => [row.dataset.no, row.querySelector(".index-no").textContent.trim()]));
  numbered.forEach(([carried, printed]) => {
    expect(printed, "a row keeps its own number").toBe(String(carried).padStart(3, "0"));
  });
});

test("the field above the table searches it", async ({ page }) => {
  await page.goto(SHEET);
  await toFragrances(page);

  const all = (await showing(page)).length;
  await page.fill(".index-search-field", "murkwood");
  await page.waitForTimeout(150);
  const found = await showing(page);
  expect(found.length, "one fragrance is called that").toBe(1);
  expect(found[0].name).toBe("Murkwood");
  await expect(page.locator(".index-count")).toContainText("001");

  // And it gives the rest back.
  await page.fill(".index-search-field", "");
  await page.waitForTimeout(150);
  expect((await showing(page)).length).toBe(all);
});

test("the headings stay where they are while the rows scroll under them",
  async ({ page }) => {
  // On the fragrances table, which has far more rows than its box: the
  // researches are only half a dozen so far and do not fill theirs.
  await page.goto(SHEET);
  await toFragrances(page);

  const stayed = await page.evaluate(() => {
    const box = document.querySelector(".index-scroll");
    const head = document.querySelector(".index-table thead th");
    const before = head.getBoundingClientRect().top;
    const firstBefore = document.querySelector(".index-table tbody tr").getBoundingClientRect().top;
    box.scrollTop = box.scrollHeight;
    const after = head.getBoundingClientRect().top;
    const firstAfter = document.querySelector(".index-table tbody tr").getBoundingClientRect().top;
    return { before, after, moved: firstBefore - firstAfter };
  });
  expect(stayed.moved, "the rows should have scrolled").toBeGreaterThan(10);
  expect(Math.abs(stayed.after - stayed.before), "and the heading should not have")
    .toBeLessThan(2);
});

test("the whole index comes out on one screen, whatever is in the table",
  async ({ page }) => {
  // The table has its own box to scroll inside precisely so that the
  // page around it does not grow: the owner has a great many more
  // fragrances to add to it.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHEET);
  await toFragrances(page);

  const fits = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
    rows: document.querySelectorAll(".index-table tbody tr").length,
  }));
  expect(fits.rows, "there are more rows than would ever fit").toBeGreaterThan(30);
  expect(fits.page, "and the page is still one screen").toBeLessThanOrEqual(fits.window + 2);
});

test("switching views takes one away before the other arrives", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );

  // Watched every frame through the switch: there must never be a
  // frame with both views showing. Two things fading through each
  // other in the same place is the one thing this must not look like.
  await page.evaluate(() => {
    window.__bothAtOnce = 0;
    window.__watching = true;
    const watch = () => {
      const on = [...document.querySelectorAll(".view")].filter((v) => {
        if (v.hidden) return false;
        const style = getComputedStyle(v);
        return style.display !== "none" && parseFloat(style.opacity) > 0.05;
      });
      if (on.length > 1) window.__bothAtOnce++;
      if (window.__watching) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  await page.click('.sheet-filter[data-view="fragrances"]');
  await page.waitForTimeout(1200);
  await page.click('.sheet-filter[data-view="houses"]');
  await page.waitForTimeout(1200);
  const both = await page.evaluate(() => {
    window.__watching = false;
    return window.__bothAtOnce;
  });
  expect(both, "the two views should never be on the page together").toBe(0);

  // And the sheet is still the sheet when you come back to it.
  await expect(page.locator('.view[data-view="houses"]')).toBeVisible();
  await expect(page.locator(".sheet-frame").first()).toBeVisible();
});

test("without the script the table is still the table", async ({ page }) => {
  // index-page.js only sorts and searches. Everything it works on is
  // written in the page, so a blocked script costs the sorting and
  // nothing else.
  await page.route("**/index-page.js", (route) => route.abort());
  const errors = collectPageErrors(page, ["ERR_FAILED", "Failed to load resource"]);
  await page.goto(RESEARCHES);

  const rows = await showing(page);
  expect(rows.length, "the rows are the page's own").toBeGreaterThan(1);
  expect(rows[0].name).toBe("Resins in Perfumery");
  await expect(page.locator(".index-table tbody tr a").first()).toBeVisible();
  expect(errors, "no errors beyond the blocked file").toEqual([]);
});
