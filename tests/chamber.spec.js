// ============================================================
// THE CHAMBER (categories/favorites.html)
//
// That category is a chamber: two injectors firing a fine stream of
// particles at a slant across the window on white. What the streams
// join is a tilted ORBIT — the theories drawing's world turned inside
// out, ink on white instead of white on near-black.
//
// There is only ever ONE arrangement here, and the whole of the
// interaction is that arrangement changing size. CLOSED: the word
// FAVORITES stands in the middle of the orbit, set wider than the
// orbit is so that its rims cross the ends of the lettering — one in
// front of it and one behind, which is what gives the word a place in
// the volume. OPEN: the orbit widens until it stands clear round the
// menu and never stops turning; pointing at a row makes the stretch of
// orbit level with it take the brass accent and swell.
//
// Two injectors, at opposite corners — top right and bottom left.
// Four, one to every corner, read as a collision rather than as an
// orbit; two survive being opposite only because a stream is aimed at
// the ORBIT rather than at the middle, so both come in on a tangent
// and go round the same way.
//
// These check that the menu is grown from the page's own favourites
// and carries what the contact sheet's Favorites menu carries, that
// the word opens it and a chapter opens its own favourites with a way
// back, that the injectors stand where they should and nothing comes
// from anywhere else, that the orbit stands round the writing and runs on
// behind it unbroken with its near rim drawn over it, that opening the
// menu widens that same orbit
// rather than replacing it, that it keeps turning either way, that
// pointing at a row reads it off against the orbit, that the streams
// answer the cursor, that it holds still when animation is turned off, and
// that the plain list comes back when the script is blocked.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/favorites.html";

/** How much ink one canvas of the drawing has laid down in a square of
    the window, and how much of it is the BRASS the hand leaves behind
    — the site's own accent, and what everything on this page turns to
    when it is answering you. `which` is ".chamber-field" (everything
    further than the middle of the chamber, drawn under the writing) or
    ".chamber-front" (everything nearer, drawn over it). */
const inkOn = (page, which, box) =>
  page.evaluate(([pick, x, y, w, h]) => {
    const canvas = document.querySelector(pick);
    const paint = canvas.getContext("2d");
    const ratio = canvas.width / canvas.clientWidth;
    const shot = paint.getImageData(
      Math.round(x * ratio), Math.round(y * ratio),
      Math.max(1, Math.round(w * ratio)), Math.max(1, Math.round(h * ratio))
    ).data;
    let ink = 0, warm = 0;
    for (let n = 0; n < shot.length; n += 4) {
      if (shot[n + 3] < 12) continue;
      ink += shot[n + 3];
      if (shot[n] > shot[n + 2] + 24) warm += shot[n + 3];
    }
    return { ink: ink, warm: warm };
  }, [which, ...box]);

const inkIn = (page, box) => inkOn(page, ".chamber-field", box);

/** Both canvases together — what is actually on the screen. */
async function inkSeen(page, box) {
  const back = await inkOn(page, ".chamber-field", box);
  const ahead = await inkOn(page, ".chamber-front", box);
  return { ink: back.ink + ahead.ink, warm: back.warm + ahead.warm };
}

/** How far out from the middle of the window the drawing stands, as
    the ink-weighted mean distance over both canvases. It is the one
    reading that says whether the orbit is the narrow one or the wide
    one without having to know where either of them is. */
const spreadOfInk = (page) =>
  page.evaluate(() => {
    let ink = 0, sum = 0;
    ["chamber-field", "chamber-front"].forEach((which) => {
      const canvas = document.querySelector("." + which);
      const ratio = canvas.width / canvas.clientWidth;
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      const mx = canvas.width / 2, my = canvas.height / 2;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const a = shot[(y * canvas.width + x) * 4 + 3];
          if (a < 12) continue;
          ink += a;
          sum += (a * Math.hypot(x - mx, y - my)) / ratio;
        }
      }
    });
    return { mean: Math.round(sum / Math.max(1, ink)), ink: ink };
  });

async function waitForChamber(page) {
  await page.waitForSelector(".chamber-field", { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".chamber-item").length > 0,
    null,
    { timeout: 15000 }
  );
}

/** Press the word and let the orbit finish widening. */
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

test("the two injectors stand at opposite corners, and nothing is fired from the other two",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(13000);

  const box = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const side = Math.round(Math.min(box.w, box.h) * 0.3);

  // Two injectors, at OPPOSITE corners — top right and bottom left —
  // so the other two must have nothing in them. Four, one to every
  // corner, read as a collision rather than as an orbit.
  for (const [where, at] of [
    ["top right", [box.w - side, 0, side, side]],
    ["bottom left", [0, box.h - side, side, side]],
  ]) {
    expect((await inkSeen(page, at)).ink, `an injector and its stream in the ${where} corner`)
      .toBeGreaterThan(2000);
  }
  for (const [where, at] of [
    ["top left", [0, 0, side, side]],
    ["bottom right", [box.w - side, box.h - side, side, side]],
  ]) {
    expect((await inkSeen(page, at)).ink, `nothing should be fired from the ${where} corner`)
      .toBeLessThan(400);
  }

  // A stream is also AIMED AT THE ORBIT rather than at the middle —
  // fired along its own tangent to it, so it comes in at a slant and
  // joins going the way the orbit goes. That is not asserted here, and
  // deliberately: every way of reading it off the pixels comes down to
  // the bearing of a thin line of specks that is thick in one moment
  // and thin in the next, and the reading swung by ten degrees between
  // runs of the same page. A test that fails one run in four is worse
  // than no test. What the aim is FOR is covered by what it produces —
  // one orbit, turning, with the streams falling into it — which the
  // tests below do measure.
});

test("what it catches stands in a ring round the word, and runs behind it unbroken",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(14000);

  const word = await page.locator(".chamber-word").boundingBox();
  // The far half of the ring RUNS ON where the word stands rather than
  // being cut out round it. The back canvas used to be clipped to
  // outside the word's box, and since that box is a wide flat
  // rectangle the rim vanished along a straight line nowhere near any
  // lettering: an invisible pane standing in the chamber. It was never
  // needed — this canvas is under the writing in the page's own
  // stacking order, so the letters occlude it themselves, letter by
  // letter. So there must be ink here, not none.
  const behind = await inkOn(page, ".chamber-field", [
    word.x + 6, word.y + 6, word.width - 12, word.height - 12,
  ]);
  expect(behind.ink, "the ring should carry on behind the word").toBeGreaterThan(300);

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

test("opening the menu widens the same orbit rather than replacing it",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  const closed = await spreadOfInk(page);
  await openMenu(page);
  const open = await spreadOfInk(page);

  // There is ONE arrangement on this page and opening the menu is that
  // arrangement getting bigger. It used to be thrown out to the
  // borders of the window and held there as a rectangle, which put two
  // different things on one page with a costly step between them. So
  // what must change is how far out the drawing stands, and not what
  // the drawing is.
  expect(open.mean, `the orbit should widen: ${closed.mean}px out closed, ${open.mean}px open`)
    .toBeGreaterThan(closed.mean * 1.25);
  expect(open.ink, "and it should still be the same drawing, not a thinner one")
    .toBeGreaterThan(closed.ink * 0.5);

  // And it stands clear round the menu rather than crossing it.
  const menu = await page.locator(".chamber-panel").boundingBox();
  expect((await inkOn(page, ".chamber-front", [
    menu.x + 8, menu.y + 8, menu.width - 16, menu.height - 16,
  ])).ink, "nothing should be drawn over the menu").toBe(0);
});

test("pointing at a row reads it off against the frame, without pulling the frame out of shape",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);
  await openMenu(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1600);

  const rows = page.locator(".chamber-level:not([hidden]) .chamber-chapter");
  const row = await rows.nth(await rows.count() - 1).boundingBox();
  const mid = row.y + row.height / 2;
  // Open ground between the menu and the border, level with that row:
  // nothing stands here, so a leader run out to the side is the only
  // thing that can put the brass accent in it.
  const gap = [190, mid - 22, 220, 44];
  // And a strip hard against the left border, where the frame is.
  const border = [0, mid - 70, 120, 140];

  const restGap = await inkSeen(page, gap);
  const restBorder = await inkSeen(page, border);

  await page.mouse.move(row.x + row.width / 2, mid);
  await page.waitForTimeout(1400);
  const readGap = await inkSeen(page, gap);
  const readBorder = await inkSeen(page, border);

  expect(readGap.warm, `it should be called out: ${restGap.warm} → ${readGap.warm}`)
    .toBeGreaterThan(restGap.warm + 600);
  expect(readBorder.warm, "and the orbit level with it should take the accent")
    .toBeGreaterThan(restBorder.warm + 400);
  // But it must NOT cinch: the particles stay on the border rather
  // than leaving it and leaning in towards the writing. The ground
  // between the two is the leader and nothing else.
  expect(readGap.ink - readGap.warm,
    "no particles should leave the border for the writing")
    .toBeLessThan(restGap.ink + 2500);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(1800);
  expect((await inkSeen(page, gap)).warm, "and let go again")
    .toBeLessThan(readGap.warm);
});

test("the orbit keeps turning, open and closed alike", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  // A patch of the orbit is a different patch of the orbit a moment
  // later — closed, and once the menu is open too. Nothing on this
  // page is ever held still.
  const watch = async (what) => {
    const seen = [];
    for (let n = 0; n < 4; n++) {
      seen.push((await spreadOfInk(page)).ink);
      await page.waitForTimeout(450);
    }
    const moved = seen.filter((ink, n) => n > 0 && ink !== seen[n - 1]).length;
    expect(moved, `${what}: it should keep turning — ${seen.join(", ")}`).toBe(3);
    seen.forEach((ink) => expect(ink, `${what}: and keep being drawn`).toBeGreaterThan(2000));
  };
  await watch("closed");
  await openMenu(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(900);
  await watch("open");
});

test("the word says what pressing it does, and says the other thing once it is open",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  const cue = page.locator(".chamber-cue-name");
  await expect(cue).toHaveText(/expand/i);
  await openMenu(page);
  await expect(cue).toHaveText(/collapse/i);
  await page.keyboard.press("Escape");
  await expect(cue).toHaveText(/expand/i);
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

  // What the hand does is turn what it is pushing to BRASS — the
  // site's own accent, and what everything else on the site turns to
  // when the hand is on it. This page used to borrow the theories
  // drawing's cool blue, which on white read as a different site.
  expect(under.warm, `before ${before.warm}, under the hand ${under.warm}`)
    .toBeGreaterThan(before.warm + 400);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(1500);
  expect((await inkSeen(page, box)).warm, "and let go of them again")
    .toBeLessThan(under.warm);
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
