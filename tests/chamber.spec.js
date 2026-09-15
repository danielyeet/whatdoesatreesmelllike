// ============================================================
// THE CHAMBER (categories/favorites.html)
//
// That category is a chamber: four injectors, one at each corner of
// the window, firing a fine stream of square particles inward on
// white. The streams fall towards the middle, are caught, and settle
// into a tilted ring — the theories drawing's world turned inside out,
// ink on white instead of white on near-black.
//
// The page has two states and the whole of the interaction is the step
// between them. CLOSED: the word FAVORITES stands in the middle of the
// ring, set wider than the ring is so that the ring's rims cross the
// ends of the lettering — one in front of it and one behind, which is
// what gives the word a place in the volume. OPEN: pressing the word
// throws the ring out to the borders of the window and holds it there
// while the word opens out into the menu; pointing at a row makes the
// particles along the sides lean in towards it.
//
// These check that the menu is grown from the page's own favourites
// and carries what the contact sheet's Favorites menu carries, that
// the word opens it and a chapter opens its own favourites with a way
// back, that there really is an injector in each corner, that the ring
// stands round the writing with nothing drawn behind it and its near
// rim drawn over it, that opening throws it out to the borders, that
// pointing at a row draws them in towards it, that the streams answer
// the cursor, that it holds still when animation is turned off, and
// that the plain list comes back when the script is blocked.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/favorites.html";

/** How much ink one canvas of the drawing has laid down in a square of
    the window, and how much of it is the cool accent the cursor leaves
    behind. `which` is ".chamber-field" (everything further than the
    middle of the chamber, drawn under the writing) or ".chamber-front"
    (everything nearer, drawn over it). */
const inkOn = (page, which, box) =>
  page.evaluate(([pick, x, y, w, h]) => {
    const canvas = document.querySelector(pick);
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
  }, [which, ...box]);

const inkIn = (page, box) => inkOn(page, ".chamber-field", box);

/** Both canvases together — what is actually on the screen. */
async function inkSeen(page, box) {
  const back = await inkOn(page, ".chamber-field", box);
  const ahead = await inkOn(page, ".chamber-front", box);
  return { ink: back.ink + ahead.ink, cool: back.cool + ahead.cool };
}

async function waitForChamber(page) {
  await page.waitForSelector(".chamber-field", { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".chamber-item").length > 0,
    null,
    { timeout: 15000 }
  );
}

/** Press the word and let the ring get out to the borders. */
async function openMenu(page) {
  await page.locator(".chamber-word").click();
  await expect(page.locator(".chamber-panel")).toBeVisible();
  await page.waitForTimeout(2600);
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
      rows: [...document.querySelectorAll(".chamber-chapter .chamber-name")]
        .map((el) => el.textContent.trim()),
      counts: [...document.querySelectorAll(".chamber-chapter .chamber-of")]
        .map((el) => Number(el.textContent.trim().split(" ")[0])),
      entries: entries.length,
      chambered: document.body.classList.contains("chambered"),
    };
  });

  expect(built.entries, "the page should carry some favourites").toBeGreaterThan(2);
  expect(built.named.length, "filed under a few chapters").toBeGreaterThan(1);
  expect(built.rows, "a row for each, in the order the page names them").toEqual(built.named);
  expect(built.counts, "and each carrying its own count").toEqual(built.perChapter);
  expect(built.chambered).toBe(true);
  expect(errors).toEqual([]);
});

test("the word opens the menu, a chapter opens its own favourites, and there is a way back",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  // Closed, the word is the whole of the page's chrome.
  await expect(page.locator(".chamber-panel")).toBeHidden();
  await expect(page.locator(".chamber-word")).toHaveAttribute("aria-expanded", "false");

  await openMenu(page);
  await expect(page.locator(".chamber-word")).toHaveAttribute("aria-expanded", "true");
  // The chapters stand in the column, and nothing else does: no strip
  // across the top, one central column.
  const chapters = page.locator(".chamber-level:not([hidden]) .chamber-chapter");
  expect(await chapters.count()).toBeGreaterThan(1);
  expect(await page.locator(".chamber-level:not([hidden]) .chamber-item").count(),
    "the favourites are not shown until a chapter is opened").toBe(0);
  await expect(page.locator(".chamber-back")).toBeHidden();

  const name = (await chapters.first().locator(".chamber-name").textContent()).trim();
  await chapters.first().click();
  await expect(page.locator(".chamber-level:not([hidden]) .chamber-chapter")).toHaveCount(0);
  expect(await page.locator(".chamber-level:not([hidden]) .chamber-item").count(),
    "that chapter's favourites take their place in the same column").toBeGreaterThan(0);
  await expect(page.locator(".chamber-spec")).toContainText(name.toUpperCase());

  // Escape steps back out one level at a time: the chapter first, then
  // the menu itself.
  await page.keyboard.press("Escape");
  expect(await page.locator(".chamber-level:not([hidden]) .chamber-chapter").count())
    .toBeGreaterThan(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".chamber-panel")).toBeHidden();
  await expect(page.locator(".chamber-word")).toHaveAttribute("aria-expanded", "false");
});

test("it carries what the sheet's Favorites menu carries: number, date, name, link",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await page.locator(".chamber-chapter").first().click();

  const rows = await page.$$eval(".chamber-level:not([hidden]) .chamber-item", (all) =>
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

  // And the reading the sheet's plate carries, set as one line.
  expect(await page.locator(".chamber-spec").textContent())
    .toMatch(/ENTRIES.+\d{2}\.\d{2}\.\d{4} – \d{2}\.\d{2}\.\d{4}/);
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

test("what it catches stands in a ring round the word, and nothing is drawn behind it",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(14000);

  const word = await page.locator(".chamber-word").boundingBox();
  // Nothing further away than the middle of the chamber is drawn where
  // the word stands: the far half of the ring passes behind it, so the
  // lettering is never printed through.
  const behind = await inkOn(page, ".chamber-field", [
    word.x + 6, word.y + 6, word.width - 12, word.height - 12,
  ]);
  expect(behind.ink, "nothing should be drawn behind the word").toBe(0);

  // And the ring stands round it: the far rim above the lettering and
  // the near rim below, both on the word's own column.
  const band = Math.round(word.width * 0.5);
  const above = await inkSeen(page, [word.x + word.width / 2 - band / 2, word.y - 210, band, 170]);
  const below = await inkSeen(page, [word.x + word.width / 2 - band / 2, word.y + word.height + 40, band, 170]);
  expect(above.ink, "the far rim should stand above the word").toBeGreaterThan(800);
  expect(below.ink, "and the near rim below it").toBeGreaterThan(800);
});

test("its near rim is drawn over the word, not round it", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(14000);

  // The word is set wider than the ring, so the ring's rims fall
  // across the ends of the lettering rather than clearing it — and the
  // nearer of the two is drawn on the front canvas, over the word.
  // Without that the word is a caption printed on a picture of a ring
  // rather than something standing inside one.
  const word = await page.locator(".chamber-word").boundingBox();
  const ahead = await inkOn(page, ".chamber-front", [
    word.x, word.y, word.width, word.height,
  ]);
  expect(ahead.ink, "the near half of the ring should cross the word")
    .toBeGreaterThan(1500);
});

test("opening the menu throws the ring out to the borders and holds it there",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  const box = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const middle = [box.w * 0.28, box.h * 0.1, box.w * 0.44, box.h * 0.22];
  const before = await inkSeen(page, middle);
  expect(before.ink, "there is something in the middle of the window to begin with")
    .toBeGreaterThan(400);

  await openMenu(page);
  const after = await inkSeen(page, middle);
  const top = await inkSeen(page, [0, 0, box.w, 96]);
  const foot = await inkSeen(page, [0, box.h - 96, box.w, 96]);

  expect(after.ink, `the middle should be cleared: ${before.ink} before, ${after.ink} after`)
    .toBeLessThan(before.ink / 4);
  expect(top.ink, "and they should be held along the top border").toBeGreaterThan(3000);
  expect(foot.ink, "and along the bottom one").toBeGreaterThan(3000);

  // Held, not stopped: they keep a little life of their own.
  const shot = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".chamber-front");
      const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let n = 3; n < d.length; n += 4) ink += d[n];
      return ink;
    });
  const one = await shot();
  await page.waitForTimeout(900);
  expect(await shot(), "they should not be frozen outright").not.toBe(one);
});

test("pointing at a row draws the particles in towards it", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);
  await openMenu(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1200);

  const rows = page.locator(".chamber-level:not([hidden]) .chamber-chapter");
  const row = await rows.nth(await rows.count() - 1).boundingBox();
  // Well inside the border on the left, level with that row: empty
  // while nothing is pointed at, and leant into once something is.
  const watch = [150, row.y - 60, 200, 120];

  const before = await inkSeen(page, watch);
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.waitForTimeout(1600);
  const under = await inkSeen(page, watch);
  expect(under.ink, `before ${before.ink}, pointed at ${under.ink}`)
    .toBeGreaterThan(before.ink + 2000);

  // And they fall back to the border when it is let go of.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(2000);
  expect((await inkSeen(page, watch)).ink, "and let go again").toBeLessThan(under.ink);
});

test("the streams answer the cursor", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  const word = await page.locator(".chamber-word").boundingBox();
  // In the ring, below the lettering, where the near rim runs.
  const at = { x: word.x + word.width / 2, y: word.y + word.height + 120 };
  const side = 260;
  const box = [at.x - side / 2, at.y - side / 2, side, side];

  const before = await inkSeen(page, box);
  await page.mouse.move(at.x, at.y);
  await page.waitForTimeout(900);
  const under = await inkSeen(page, box);

  // What the hand does is turn what it is pushing to the cool accent —
  // the same one the theories drawing keeps for the marks that mean
  // something, brought down onto white.
  expect(under.cool, `before ${before.cool}, under the hand ${under.cool}`)
    .toBeGreaterThan(before.cool + 400);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(1500);
  expect((await inkSeen(page, box)).cool, "and let go of them again")
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
  await expect(page.locator(".chamber-word")).toBeVisible();
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
