// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: the screen flickers
// once, a menu of chapters comes up on the right, and a ruled field
// settles behind it. These check the switch between the two views,
// that the chapters and their dates are read off the page's own
// entries rather than written into the script, that one chapter is
// open at a time and the strip works from the keyboard, that the
// field answers the cursor and settles again when it goes, that the
// way it LIES is a reading of the chapter — the one you have open,
// and the one you are merely pointing at — that pointing at a
// favourite knots it beside that entry, and that the whole view fits
// one screen.
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
  await expect(page.locator(".chapters-menu")).toBeVisible();
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

test("one chapter is open at a time, and the strip works from the keyboard",
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
  expect(stops.filter((n) => n === 0).length, "one stop for the whole strip").toBe(1);

  const first = await openTab(page).locator(".chapters-name").textContent();
  await page.locator(".chapters-tab.open").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  expect(await openTab(page).locator(".chapters-name").textContent(),
    "the arrow keys should move along the strip").not.toBe(first);
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("chapters-tab");

  // The plate on the left follows whichever is open.
  expect(await page.locator(".chapters-plate h2").textContent())
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

test("the field answers the cursor, and settles again when it goes",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  /** What is drawn in one square of the field. */
  const inkAt = (x, y) =>
    page.evaluate(([px, py]) => {
      const canvas = document.querySelector(".chapters-field");
      const paint = canvas.getContext("2d");
      const ratio = canvas.width / canvas.clientWidth;
      const strip = paint.getImageData(
        Math.round(px * ratio), Math.round(py * ratio),
        Math.round(90 * ratio), Math.round(90 * ratio)
      ).data;
      let ink = 0;
      for (let n = 3; n < strip.length; n += 4) ink += strip[n];
      return ink;
    }, [x, y]);

  const box = await page.locator(".chapters").boundingBox();
  const low = box.height - 150;
  const away = await inkAt(120, low);
  expect(away, "there should be marks along the foot").toBeGreaterThan(0);

  // Put the cursor in the middle of a square of it: the marks near it
  // are shoved out of the lattice and drawn larger, so there is more
  // ink there than there was.
  await page.mouse.move(box.x + 165, box.y + low + 45);
  await page.waitForTimeout(700);
  const under = await inkAt(120, low);
  expect(under, "the field should answer the cursor").toBeGreaterThan(away * 1.15);

  // And find its way back when the cursor goes.
  await page.mouse.move(box.x + box.width - 40, box.y + 30);
  await page.waitForTimeout(900);
  expect(await inkAt(120, low), "and settle again afterwards")
    .toBeLessThan(under);
});

/** WHICH WAY THE FIELD LIES over a patch of the page, in degrees,
    read off the drawing itself rather than off the script: the
    structure tensor of the ink there — the direction the ink changes
    fastest in is across the strokes, so the strokes lie a quarter turn
    from it. Returned modulo 180, because a stroke is a line and not an
    arrow: lying at 179 degrees and at 1 degree is very nearly the same
    thing. */
const grain = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector(".chapters-field");
    const paint = canvas.getContext("2d");
    // A patch low on the left, which is clear of both columns of
    // writing at every window size the tests run at.
    const x0 = Math.round(canvas.width * 0.02), y0 = Math.round(canvas.height * 0.6);
    const w = Math.round(canvas.width * 0.45), h = Math.round(canvas.height * 0.35);
    const shot = paint.getImageData(x0, y0, w, h).data;
    const at = (x, y) => shot[(y * w + x) * 4 + 3];
    let xx = 0, yy = 0, xy = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const gx = at(x + 1, y) - at(x - 1, y);
        const gy = at(x, y + 1) - at(x, y - 1);
        xx += gx * gx; yy += gy * gy; xy += gx * gy;
      }
    }
    const across = 0.5 * Math.atan2(2 * xy, xx - yy);
    return (((across * 180) / Math.PI + 90) % 180 + 180) % 180;
  });

/** How far apart two directions are, the short way round. */
const apart = (a, b) => {
  const off = Math.abs(a - b) % 180;
  return Math.min(off, 180 - off);
};

/** How much ink there is in one square of the field. */
const inkIn = (page, x, y, side) =>
  page.evaluate(([px, py, wide]) => {
    const canvas = document.querySelector(".chapters-field");
    const paint = canvas.getContext("2d");
    const ratio = canvas.width / canvas.clientWidth;
    const shot = paint.getImageData(
      Math.round(px * ratio), Math.round(py * ratio),
      Math.round(wide * ratio), Math.round(wide * ratio)
    ).data;
    let ink = 0;
    for (let n = 3; n < shot.length; n += 4) ink += shot[n];
    return ink;
  }, [x, y, side]);

test("the way the field lies is a reading of the chapter you have open",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  // The pointer is parked well away from the field: it answers the
  // hand too, and that is a different test.
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1400);

  const first = await grain(page);
  // Left alone it is perfectly still — it is a ruled ground, not a
  // thing that wanders.
  await page.waitForTimeout(900);
  expect(apart(first, await grain(page)), "it should be still when nothing is touching it")
    .toBeLessThan(3);

  // Open a different chapter and the whole field turns: each chapter
  // lies at its own angle, taken from where the dates it is filed
  // under stand among the other chapters'.
  await page.locator(".chapters-tab").nth(1).click();
  await page.waitForTimeout(1800);
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1200);
  const second = await grain(page);
  expect(apart(first, second), `chapter 1 lay at ${first.toFixed(0)}°, chapter 2 at ${second.toFixed(0)}°`)
    .toBeGreaterThan(20);

  await page.locator(".chapters-tab").nth(2).click();
  await page.waitForTimeout(1800);
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1200);
  const third = await grain(page);
  expect(apart(second, third), "and so does the third").toBeGreaterThan(20);
  expect(apart(first, third), "no two of them read the same").toBeGreaterThan(20);
});

test("pointing at a chapter lays the field its way, and lets it back",
  async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1400);
  const open = await grain(page);

  // Merely pointing at another chapter's tab — not opening it — sends
  // that chapter's angle out across the page.
  const tab = await page.locator(".chapters-tab").nth(1).boundingBox();
  await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
  await page.waitForTimeout(1600);
  const pointed = await grain(page);
  expect(apart(open, pointed), "the field should answer the chapter under the pointer")
    .toBeGreaterThan(20);
  // And it is only a preview: the open chapter has not changed.
  expect(await openTab(page).locator(".chapters-name").textContent())
    .toBe(await page.locator(".chapters-plate h2").textContent());

  // Take the pointer away and the open chapter's own angle comes back.
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1700);
  expect(apart(open, await grain(page)), "and come back when the pointer goes")
    .toBeLessThan(8);
});

test("pointing at a favourite knots the field beside it", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1400);

  // The knot stands in the clear column between the two columns of
  // writing, at the height of the entry's own row.
  const where = await page.evaluate(() => {
    const box = document.querySelector(".chapters").getBoundingClientRect();
    const plate = document.querySelector(".chapters-plate").getBoundingClientRect();
    const menu = document.querySelector(".chapters-menu").getBoundingClientRect();
    const row = document.querySelectorAll(".chapters-panel.open .chapters-item")[1]
      .getBoundingClientRect();
    return {
      x: (plate.right + menu.left) / 2 - box.left,
      y: (row.top + row.bottom) / 2 - box.top,
    };
  });
  const side = 150;
  const before = await inkIn(page, where.x - side / 2, where.y - side / 2, side);
  expect(before, "there should be field there to disturb").toBeGreaterThan(0);

  const row = await page.locator(".chapters-panel.open .chapters-item").nth(1).boundingBox();
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.waitForTimeout(1100);
  const knotted = await inkIn(page, where.x - side / 2, where.y - side / 2, side);
  expect(knotted, "the field should gather where that entry's own place is")
    .toBeGreaterThan(before * 1.15);

  // And let go of it again.
  await page.mouse.move(6, 6);
  await page.waitForTimeout(1400);
  expect(await inkIn(page, where.x - side / 2, where.y - side / 2, side),
    "and settle back when the pointer goes").toBeLessThan(knotted);
});

test("the whole view fits on one screen, with nothing to scroll to", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const fit = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
  }));
  expect(fit.page, `page is ${fit.page}px in a ${fit.window}px window`)
    .toBeLessThanOrEqual(fit.window + 2);
});

test("with animation turned off it arrives without the flicker", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(400);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(500);

  const view = page.locator(".chapters");
  await expect(view).toHaveClass(/lit/);
  await expect(view).not.toHaveClass(/flicker/);
  await expect(page.locator(".chapters-tab.open")).toHaveCount(1);
});
