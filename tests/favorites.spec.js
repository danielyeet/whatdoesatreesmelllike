// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: the screen flickers once
// and what comes up is the REGISTER — a page ruled edge to edge with
// fine horizontal tracks, a small square travelling along each one,
// and a glitch that tears the whole thing sideways every few seconds.
//
// These check the switch between the two views, that the chapters and
// their dates are read off the page's own entries rather than written
// into the script, that one chapter is open at a time and the index
// works from the keyboard, that every favourite has a track of its own
// running the full width at its own row, that pointing at one lights
// that track, that the register runs, that how the page is ruled is a
// reading of the chapter you have open with no two chapters ruled the
// same, that it tears but never in what it SAYS, and that the whole
// view fits one screen.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/scent-descriptions.html";

const openTab = (page) => page.locator(".chapters-tab.open");

/** Open Favorites and wait for it to have finished coming up. */
async function openFavorites(page) {
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForFunction(
    () => {
      const view = document.querySelector(".chapters");
      return view && view.classList.contains("lit");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(400);
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page opens on the map, with favorites out of the way", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display)
  ).toBe("none");
  expect(errors).toEqual([]);
});

test("choosing favorites takes the map away and flickers the chapters up",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  // It does not simply appear: the screen catches and drops once
  // before it settles, the way a panel does when it is switched on.
  await page.waitForSelector(".chapters.flicker", { timeout: 8000 });
  await openFavorites(page);

  // One view at a time: the map is gone from the page, not merely faded.
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).toBe("none");
  await expect(page.locator(".chapters-body")).toBeVisible();
  await expect(page.locator(".sheet-filter", { hasText: "Favorites" })).toHaveClass(/chosen/);

  // And the flicker is the thing being switched on, so it happens
  // once: going away and coming back does not do it again.
  await page.locator(".sheet-filter", { hasText: "Description portfolio" }).click();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display),
      { timeout: 6000 })
    .toBe("none");
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(700);
  expect(
    await page.evaluate(() => document.querySelector(".chapters").classList.contains("flicker")),
    "it is only switched on once"
  ).toBe(false);
});

test("the chapters and their dates are read off the page's own entries",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const read = await page.evaluate(() => {
    const entries = [...document.querySelectorAll(".gallery-entry")];
    const named = [];
    entries.forEach((entry) => {
      const on = (entry.dataset.chapter || "Unsorted").trim();
      if (named.indexOf(on) < 0) named.push(on);
    });
    return {
      named: named,
      tabs: [...document.querySelectorAll(".chapters-tab .chapters-name")]
        .map((el) => el.textContent.trim()),
      counts: [...document.querySelectorAll(".chapters-tab .chapters-count-small")]
        .map((el) => Number(el.textContent)),
      perChapter: named.map(
        (on) => entries.filter((e) => (e.dataset.chapter || "Unsorted").trim() === on).length
      ),
      items: document.querySelectorAll(".chapters-item").length,
      entries: entries.length,
      dates: [...document.querySelectorAll(".chapters-date")].map((el) => el.textContent.trim()),
    };
  });

  expect(read.named.length, "the page should name a few chapters").toBeGreaterThan(1);
  expect(read.tabs, "a tab for each, in the order the page names them").toEqual(read.named);
  expect(read.counts, "and each carrying its own count").toEqual(read.perChapter);
  // Every favourite ends up in exactly one chapter.
  expect(read.items).toBe(read.entries);
  // And every one carries a date, which is what it is filed under.
  expect(read.dates.length).toBe(read.entries);
  read.dates.forEach((date) => expect(date).toMatch(/^\d{2}\.\d{2}\.\d{4}$/));
});

test("one chapter is open at a time, and the index works from the keyboard",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  expect(await page.locator(".chapters-tab.open").count(), "one open").toBe(1);
  expect(await page.locator(".chapters-panel.open").count(), "one panel").toBe(1);
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll(".chapters-panel:not(.open)")].every((p) => p.hidden)),
    "the chapters you are not reading are not on the page"
  ).toBe(true);

  // Only the open one is in the tab order: the strip is one control.
  const stops = await page.$$eval(".chapters-tab", (tabs) => tabs.map((t) => t.tabIndex));
  expect(stops.filter((n) => n === 0).length, "one stop for the whole index").toBe(1);

  const first = await openTab(page).locator(".chapters-name").textContent();
  await page.locator(".chapters-tab.open").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  expect(await openTab(page).locator(".chapters-name").textContent(),
    "the arrow keys should move down the index").not.toBe(first);
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("chapters-tab");

  // The log follows whichever is open.
  expect(await page.locator(".chapters-title").textContent())
    .toBe(await openTab(page).locator(".chapters-name").textContent());
});

test("every favourite is a link to its piece", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const links = await page.$$eval(".chapters-item", (all) =>
    all.map((a) => ({
      href: a.getAttribute("href"),
      name: a.querySelector(".chapters-item-name").textContent.trim(),
    }))
  );
  expect(links.length).toBeGreaterThan(1);
  links.forEach((link) => {
    expect(link.href, `${link.name} should point at a piece`).toMatch(/works\//);
    expect(link.name.length).toBeGreaterThan(0);
  });
});

/** How the drawing runs across one horizontal band of the window,
    given in the WINDOW's coordinates: how much ink there is in it, and
    how much of the width has any at all. A track is a line right
    across the page, so `across` is what tells one from a few loose
    marks that happen to be at the same height. */
const bandAt = (page, top, tall) =>
  page.evaluate(([atY, high]) => {
    const canvas = document.querySelector(".chapters-field");
    const box = canvas.getBoundingClientRect();
    const ratio = canvas.width / box.width;
    const y = Math.max(0, Math.round((atY - box.top) * ratio));
    const deep = Math.max(1, Math.round(high * ratio));
    const shot = canvas.getContext("2d")
      .getImageData(0, y, canvas.width, Math.min(deep, canvas.height - y)).data;
    let ink = 0;
    const hit = new Array(canvas.width).fill(0);
    for (let n = 0; n < shot.length; n += 4) {
      if (shot[n + 3] < 10) continue;
      ink += shot[n + 3];
      hit[(n / 4) % canvas.width] = 1;
    }
    return {
      ink: ink,
      across: hit.reduce((a, b) => a + b, 0) / canvas.width,
    };
  }, [top, tall]);

/** Where the drawing has a line right across it, in canvas rows. */
const ruledRows = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector(".chapters-field");
    const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const out = [];
    for (let y = 0; y < canvas.height; y++) {
      let seen = 0;
      for (let x = 0; x < canvas.width; x += 2) {
        if (d[(y * canvas.width + x) * 4 + 3] > 10) seen++;
      }
      if (seen > canvas.width * 0.35) out.push(y);
    }
    return out;
  });

test("every favourite has a track of its own, running right across the page at its row",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.waitForTimeout(900);

  const rows = await page.$$eval(".chapters-panel.open .chapters-item", (all) =>
    all.map((row) => {
      const box = row.getBoundingClientRect();
      return { at: (box.top + box.bottom) / 2, name: row.textContent.trim() };
    })
  );
  expect(rows.length).toBeGreaterThan(1);

  for (const row of rows) {
    const band = await bandAt(page, row.at - 2, 5);
    expect(band.across, `${row.name} should have a line right across the page at its own row`)
      .toBeGreaterThan(0.7);
  }
});

test("pointing at a favourite lights its own track, and lets it go again",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.waitForTimeout(900);

  const rows = page.locator(".chapters-panel.open .chapters-item");
  const box = await rows.nth(1).boundingBox();
  const at = box.y + box.height / 2;
  // Away from the writing, out at the left-hand margin, where only the
  // drawing can put anything.
  const rest = await bandAt(page, at - 2, 5);

  await page.mouse.move(box.x + box.width * 0.75, at);
  await page.waitForTimeout(700);
  const lit = await bandAt(page, at - 2, 5);
  expect(lit.ink, `at rest ${rest.ink}, pointed at ${lit.ink}`)
    .toBeGreaterThan(rest.ink * 1.4);

  await page.mouse.move(10, 10);
  await page.waitForTimeout(800);
  expect((await bandAt(page, at - 2, 5)).ink, "and let go again")
    .toBeLessThan(lit.ink);
});

test("the register runs: the squares travel along their tracks", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.mouse.move(6, 6);

  // Watched below the writing, where nothing but the drawing is: what
  // is there has to keep changing, and keep being there.
  const at = await page.evaluate(() => window.innerHeight - 90);
  const seen = [];
  for (let n = 0; n < 4; n++) {
    seen.push((await bandAt(page, at, 60)).ink);
    await page.waitForTimeout(420);
  }
  const moved = seen.filter((ink, n) => n > 0 && ink !== seen[n - 1]).length;
  expect(moved, `it should keep running: ${seen.join(", ")}`).toBe(3);
  seen.forEach((ink) => expect(ink, "and keep being drawn").toBeGreaterThan(400));
});

test("how the page is ruled is a reading of the chapter you have open, and no two read the same",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.mouse.move(6, 6);

  const tabs = page.locator(".chapters-tab");
  const many = await tabs.count();
  expect(many).toBeGreaterThan(1);

  const read = [];
  for (let n = 0; n < many; n++) {
    await tabs.nth(n).click();
    await page.waitForTimeout(800);
    // The gauge the page says it is ruled at...
    const said = Number(await page.locator(".chapters-gauge").textContent());
    // ...against how far apart the lines actually stand, measured off
    // the drawing itself, below the writing where only the tracks
    // filling the page are.
    const rows = (await ruledRows(page)).filter((y) => y > 0);
    const deep = await page.evaluate(() => {
      const canvas = document.querySelector(".chapters-field");
      const box = canvas.getBoundingClientRect();
      const ratio = canvas.width / box.width;
      const log = document.querySelector(".chapters-panel.open").getBoundingClientRect();
      return { from: (log.bottom - box.top + 30) * ratio, ratio: ratio };
    });
    const low = rows.filter((y) => y > deep.from);
    const gaps = low.slice(1).map((y, i) => (y - low[i]) / deep.ratio).filter((g) => g > 6);
    gaps.sort((a, b) => a - b);
    read.push({ said: said, drawn: gaps[Math.floor(gaps.length / 2)] });
  }

  read.forEach((one, n) => {
    expect(one.drawn, `chapter ${n + 1} says it is ruled at ${one.said}`)
      .toBeGreaterThan(one.said - 4);
    expect(one.drawn).toBeLessThan(one.said + 4);
  });
  // And no two chapters are ruled the same, or the reading says nothing.
  const said = read.map((one) => one.said);
  expect(new Set(said).size, `each chapter should rule it its own way: ${said.join(", ")}`)
    .toBe(read.length);
});

test("it glitches — and never in what it says", async ({ page }) => {
  // Recorded in the page, frame by frame, rather than by catching it:
  // a tear is over in a tenth of a second and nothing outside the page
  // can be relied on to look during one.
  await page.addInitScript(() => {
    window.__seen = { tears: 0, codes: {}, said: {} };
    const look = () => {
      const state = window.__seen;
      if (document.querySelector(".chapters-field")) {
        if (document.querySelectorAll(".torn").length) state.tears++;
        const sig = document.querySelector(".chapters-sig");
        if (sig) state.codes[sig.textContent] = 1;
        document.querySelectorAll(".chapters-panel.open .chapters-item").forEach((row) => {
          const name = row.querySelector(".chapters-item-name").textContent;
          const date = row.querySelector(".chapters-date").textContent;
          state.said[name + " | " + date] = 1;
        });
      }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.mouse.move(6, 6);
  await page.waitForTimeout(9000);

  const seen = await page.evaluate(() => window.__seen);
  expect(seen.tears, "the writing should be thrown out of line now and then").toBeGreaterThan(2);
  expect(Object.keys(seen.codes).length, "and the code in the corner should scramble")
    .toBeGreaterThan(2);
  // But never the content. Every row said exactly one thing for the
  // whole nine seconds: a glitch that changes a date is not a glitch,
  // it is a page telling you something that is not true.
  const rows = await page.locator(".chapters-panel.open .chapters-item").count();
  expect(Object.keys(seen.said).length,
    `each row should have said one thing throughout: ${Object.keys(seen.said).join(" / ")}`)
    .toBe(rows);
});

test("the whole view fits on one screen, with nothing to scroll to", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const over = await page.evaluate(() =>
    document.documentElement.scrollHeight - window.innerHeight);
  expect(over, "nothing should hang below the fold").toBeLessThanOrEqual(1);
});

test("with animation turned off it arrives without the flicker, and never tears",
  async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(900);

  expect(await page.evaluate(() =>
    document.querySelector(".chapters").classList.contains("flicker")),
    "nothing to watch being switched on").toBe(false);
  await expect(page.locator(".chapters-body")).toBeVisible();

  // Ruled once and left: nothing travels and nothing tears.
  const at = await page.evaluate(() => window.innerHeight - 90);
  const before = await bandAt(page, at, 60);
  await page.waitForTimeout(1500);
  expect((await bandAt(page, at, 60)).ink, "nothing should move").toBe(before.ink);
  expect(await page.locator(".torn").count(), "and nothing should tear").toBe(0);
  expect(before.ink, "still drawn, though").toBeGreaterThan(0);
});
