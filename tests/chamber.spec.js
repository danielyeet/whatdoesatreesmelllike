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
// orbit level with it swell outward, and that is the whole of it.
//
// Two injectors, at opposite corners — top right and bottom left.
// Four, one to every corner, read as a collision rather than as an
// orbit; two survive being opposite only because a stream is aimed at
// the ORBIT rather than at the middle, so both come in on a tangent
// and go round the same way.
//
// These check that the menu is grown from the page's own favourites
// and carries the number, date, name and link of every favourite, that
// the word opens it and a chapter opens its own favourites with a way
// back, that the injectors stand where they should and nothing comes
// from anywhere else, that the orbit stands round the writing and runs on
// behind it unbroken with its near rim drawn over it, that opening the
// menu widens that same orbit
// rather than replacing it, that the word travels to its place on that
// step rather than jumping there, that it keeps turning either way, that
// pointing at a row swells the orbit level with it and does nothing
// else — the leaders that used to be run out across the page are gone
// —
// that the cursor strings a web between the specks it is near, that it
// holds still when animation is turned off, and
// that the plain list comes back when the script is blocked.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/favorites.html";

/** How much ink one canvas of the drawing has laid down in a square of
    the window. `which` is ".chamber-field" (everything further than
    the middle of the chamber, drawn under the writing) or
    ".chamber-front" (everything nearer, drawn over it).

    Ink, and not colour: nothing on this page is ever tinted, so there
    is nothing to count by hue. What it does when it is answering you
    is draw — a swell in the orbit, a web strung between whatever the
    cursor is near. */
const inkOn = (page, which, box) =>
  page.evaluate(([pick, x, y, w, h]) => {
    const canvas = document.querySelector(pick);
    const paint = canvas.getContext("2d");
    const ratio = canvas.width / canvas.clientWidth;
    const shot = paint.getImageData(
      Math.round(x * ratio), Math.round(y * ratio),
      Math.max(1, Math.round(w * ratio)), Math.max(1, Math.round(h * ratio))
    ).data;
    let ink = 0;
    for (let n = 3; n < shot.length; n += 4) {
      if (shot[n] >= 12) ink += shot[n];
    }
    return { ink: ink };
  }, [which, ...box]);

const inkIn = (page, box) => inkOn(page, ".chamber-field", box);

/** Both canvases together — what is actually on the screen. */
async function inkSeen(page, box) {
  const back = await inkOn(page, ".chamber-field", box);
  const ahead = await inkOn(page, ".chamber-front", box);
  return { ink: back.ink + ahead.ink };
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
    () => document.querySelectorAll(".chamber-chapter").length > 0,
    null,
    { timeout: 15000 }
  );
}

/** Press the word and let the orbit finish widening. */
async function openMenu(page) {
  await page.locator(".chamber-word").click();
  await expect(page.locator(".chamber-panel")).toBeVisible();
  await page.waitForTimeout(3100);
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the menu is a fixed length, whatever is in it", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  // Closed, the menu is not on the page at all. It has a display of
  // its own now — it is a column with the rows scrolling inside it —
  // and a display of one's own outranks the browser's own rule for
  // `[hidden]`, which once left it standing open from the moment the
  // page loaded.
  await expect(page.locator(".chamber-panel")).toBeHidden();

  await openMenu(page);
  const was = await page.locator(".chamber-panel").boundingBox();

  // The owner asked for the table to stay the same size as favourites
  // are added to the page — which is what a fixed length is FOR, since
  // how wide the orbit grows and how far the plate is lifted both hang
  // off this box. So the page is given a great many more rows than it
  // has, and the box may not move.
  await page.evaluate(() => {
    const level = document.querySelector(".chamber-level:not([hidden])");
    const row = level.querySelector(".chamber-row");
    for (let n = 0; n < 30; n++) level.appendChild(row.cloneNode(true));
  });
  await page.waitForTimeout(500);

  const now = await page.locator(".chamber-panel").boundingBox();
  expect(now.height, "the menu should be the same length with thirty more rows in it")
    .toBeCloseTo(was.height, 0);
  expect(now.y, "and stand in the same place").toBeCloseTo(was.y, 0);

  // Which means the rows are what scrolls.
  const column = await page.locator(".chamber-column").evaluate((el) => ({
    scrolls: getComputedStyle(el).overflowY,
    over: el.scrollHeight > el.clientHeight + 4,
  }));
  expect(column.scrolls, "the rows are what scrolls").toMatch(/auto|scroll/);
  expect(column.over, "and there is more of them than the box holds").toBe(true);
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

/** Press a chapter and sit through the burst: the menu shutting, the
    still second, the winding in, and the throw. */
async function openChapter(page, which) {
  await page.locator(".chamber-chapter").nth(which || 0).click();
  await expect(page.locator(".chapter-page")).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(700);
}

test("the word opens the menu, and a chapter opens a page of its own",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  // Closed, the word is the whole of the page's chrome.
  await expect(page.locator(".chamber-panel")).toBeHidden();
  await expect(page.locator(".chamber-word")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".chapter-page")).toBeHidden();

  await openMenu(page);
  await expect(page.locator(".chamber-word")).toHaveAttribute("aria-expanded", "true");
  // The chapters stand in the column, and nothing else does: one
  // central column, and no second level of favourites inside it any
  // more — a chapter opens a page now.
  const chapters = page.locator(".chamber-level:not([hidden]) .chamber-chapter");
  expect(await chapters.count()).toBeGreaterThan(1);
  expect(await page.locator(".chamber-item").count(),
    "a chapter's favourites are not a level in the menu any more").toBe(0);

  const name = (await chapters.first().locator(".chamber-name").textContent()).trim();
  await openChapter(page, 0);

  // THE CHAPTER IS STANDING ON A BLACK PAGE, and it is that chapter.
  await expect(page.locator(".chapter-name")).toHaveText(name);
  const ground = await page.locator(".chapter-page").evaluate((el) =>
    getComputedStyle(el).backgroundColor);
  expect(ground, "the chapter stands on black").toMatch(/rgba?\(0, 0, 0/);
  // A full-bleed dark region has to say so, or the cursor is invisible
  // over it.
  await expect(page.locator(".chapter-page")).toHaveClass(/dark-surface/);

  // And the way back puts the chamber back, with the menu open at the
  // chapters again.
  await page.locator(".chapter-back").click();
  await expect(page.locator(".chapter-page")).toBeHidden();
  await expect(page.locator(".chamber-level:not([hidden]) .chamber-chapter").first())
    .toBeVisible();

  // Escape does the same from inside a chapter.
  await openChapter(page, 0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".chapter-page")).toBeHidden();
});

test("the burst gathers the particles into a wheel and winds it into the middle",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);

  /** How far the drawn particles stand from the middle of the window,
      and how much is drawn at all. The wind gathers them onto one wheel
      and closes that wheel on the middle, so the distance is what says
      it is working — a box in the middle would read empty for most of
      it, because a closing ring is hollow until the last moment. */
  const readRing = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".chamber-field");
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      const midX = canvas.width / 2, midY = canvas.height / 2;
      let sum = 0, ink = 0;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          if (shot[(y * canvas.width + x) * 4 + 3] < 40) continue;
          sum += Math.hypot(x - midX, y - midY);
          ink++;
        }
      }
      return { far: ink ? sum / ink : 0, ink: ink };
    });

  const before = await readRing();
  expect(before.ink, "there are particles to begin with").toBeGreaterThan(300);

  await page.locator(".chamber-chapter").first().click();

  // NOTHING WAITS FOR ANYTHING: the chrome starts fading and the
  // particles start closing on the same frame the press lands. A
  // second in, the word should already be going.
  await page.waitForTimeout(800);
  const fading = await page.locator(".chamber-plate").evaluate((el) =>
    parseFloat(getComputedStyle(el).opacity));
  expect(fading, "the word fades from the press, not after it").toBeLessThan(0.95);

  // ...and near the end of the wind the wheel is well inside where the
  // particles began.
  await page.waitForTimeout(1000);
  const wound = await readRing();
  expect(wound.ink, "the particles are still drawn as they close").toBeGreaterThan(200);
  expect(wound.far,
    `the wheel should have closed on the middle: ${Math.round(before.far)} -> ${Math.round(wound.far)}`)
    .toBeLessThan(before.far * 0.75);

  // And then the wave goes out, and the chapter is cut out of the black.
  await expect(page.locator(".chapter-page")).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1200);
  const open = await page.locator(".chapter-page").evaluate((el) =>
    getComputedStyle(el).clipPath);
  expect(open, `the wave should have opened the page right out: ${open}`)
    .not.toMatch(/circle\(0%|circle\(0px/);
});

test("a chapter's page carries its writing, and its favourites as cards",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapter(page, 0);

  // What the chapter is, taken off the page's own markup.
  await expect(page.locator(".chapter-note")).toBeVisible();
  expect((await page.locator(".chapter-note").textContent()).trim().length)
    .toBeGreaterThan(20);

  const cards = await page.$$eval(".chapter-card", (all) =>
    all.map((card) => ({
      no: card.querySelector(".chapter-card-no").textContent.trim(),
      date: card.querySelector(".chapter-card-date").textContent.trim(),
      name: card.querySelector(".chapter-card-name").textContent.trim(),
      href: card.getAttribute("href"),
    }))
  );
  expect(cards.length).toBeGreaterThan(1);
  cards.forEach((card, n) => {
    expect(card.no, "numbered in order").toBe(String(n + 1).padStart(2, "0"));
    expect(card.date, `${card.name} should carry the date it is filed under`)
      .toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    expect(card.name.length).toBeGreaterThan(0);
    expect(card.href, `${card.name} should point at a piece`).toMatch(/works\//);
  });

  // The reading over them, and its dates the right way round: read in
  // page order this came out latest-first, which is not a range.
  const spec = await page.locator(".chapter-spec").textContent();
  expect(spec).toMatch(/ENTRIES.+\d{2}\.\d{2}\.\d{4} – \d{2}\.\d{2}\.\d{4}/);
  const [from, to] = spec.match(/\d{2}\.\d{2}\.\d{4}/g);
  const key = (d) => d.split(".").reverse().join("");
  expect(key(from) <= key(to), `the range should read earliest first: ${spec}`).toBe(true);
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

  // The orbit itself still stands clear round the menu — it is fitted
  // to that box — but what is NEARER than the middle of the chamber
  // passes in FRONT of the menu, the way it already passed in front of
  // the word. The room the menu takes used to be cleared of it; the
  // owner asked for the particles to be in front of the table.
  const menu = await page.locator(".chamber-panel").boundingBox();
  expect((await inkOn(page, ".chamber-front", [
    menu.x + 8, menu.y + 8, menu.width - 16, menu.height - 16,
  ])).ink, "the near specks should cross the menu").toBeGreaterThan(400);
});

/** Where the word stands, every frame, while `act` is being done to
    the page — its top edge on the window, against the clock.

    This is the reading that says whether the step is a movement or a
    cut: a jump does not show up in what the page looks like before and
    after, only in the one frame between them. */
const travelOfWord = async (page, act, ms) => {
  const watching = page.evaluate((span) => new Promise((done) => {
    const word = document.querySelector(".chamber-word");
    const seen = [];
    const t0 = performance.now();
    const tick = () => {
      seen.push([performance.now() - t0, word.getBoundingClientRect().top]);
      if (performance.now() - t0 < span) requestAnimationFrame(tick); else done(seen);
    };
    requestAnimationFrame(tick);
  }), ms);
  await act();
  return watching;
};

test("the word travels to its place on the step rather than jumping there",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(6000);

  // THE STEP IS 1.9 SECONDS EASED FLAT AT BOTH ENDS, and the steepest
  // that curve ever gets is about twice the average — so in any one
  // frame the word cannot honestly have moved more than twice its
  // whole travel times that frame's share of the step. Anything past
  // that is not easing, it is a cut.
  //
  // The menu used to be stacked under the word in the same box, so the
  // frame it went on to the page the word was shoved 143 pixels up the
  // window — further, in one frame, than the whole journey it then
  // eased through. The owner reported it. It goes the other way when
  // the menu is taken off the page again, so both halves are watched.
  const OPEN_MS = 2200;
  const honest = (seen, what) => {
    const travel = Math.abs(seen[seen.length - 1][1] - seen[0][1]);
    expect(travel, `${what}: the word should travel at all`).toBeGreaterThan(40);
    // The frame that came closest to moving more than it could have.
    let over = -Infinity, worst = 0, worstAt = 0, worstGap = 1;
    for (let n = 1; n < seen.length; n++) {
      const moved = Math.abs(seen[n][1] - seen[n - 1][1]);
      const gap = seen[n][0] - seen[n - 1][0];
      const could = (travel * 2.2 * gap) / OPEN_MS + 6;
      if (moved - could > over) {
        over = moved - could;
        worst = moved; worstGap = could; worstAt = seen[n][0];
      }
    }
    expect(worst, `${what}: it jumped ${Math.round(worst)}px at ${Math.round(worstAt)}ms, ` +
      `where the step could carry it ${Math.round(worstGap)}px — travel was ${Math.round(travel)}px`)
      .toBeLessThan(worstGap);
  };

  honest(await travelOfWord(page, () => page.locator(".chamber-word").click(), 2900), "opening");
  await page.waitForTimeout(900);
  honest(await travelOfWord(page, () => page.locator(".chamber-word").click(), 2900), "closing");
});

/** How far out the drawing stands in a band of the window: the
    outermost ink on each side, as a distance from the middle of the
    window in CSS pixels. Where the orbit swells, it reaches further.

    This is the reading and not the ink in a box, because the orbit is
    turning the whole time: how much ink stands in any one square of
    the window goes up and down by a fifth on its own as the specks
    carry round it, which is the same order as the swell being
    measured.

    ONE READING OF IT IS NOT ENOUGH ON ITS OWN, though — see
    `reachOverTime` below. */
const reachOfOrbit = (page, top, deep) =>
  page.evaluate(([t, d]) => {
    let left = 1e9, right = -1e9;
    ["chamber-field", "chamber-front"].forEach((which) => {
      const canvas = document.querySelector("." + which);
      const ratio = canvas.width / canvas.clientWidth;
      const y0 = Math.round(t * ratio), h = Math.max(1, Math.round(d * ratio));
      const shot = canvas.getContext("2d").getImageData(0, y0, canvas.width, h).data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (shot[(y * canvas.width + x) * 4 + 3] < 40) continue;
          if (x / ratio < left) left = x / ratio;
          if (x / ratio > right) right = x / ratio;
        }
      }
    });
    const mid = window.innerWidth / 2;
    return { left: Math.round(mid - left), right: Math.round(right - mid) };
  }, [top, deep]);

/** The same reading, taken several times over a second and averaged.
    The orbit is a BAND now and not a line, so how far out the
    outermost speck in a given stripe of the window happens to stand
    swings by sixty-odd pixels on its own as the specks carry round it
    — measured: 364 to 497 across six readings of the same resting
    orbit. Averaged, resting and read-off are far apart and steady
    (about 430 against about 545). A single reading of each is the same
    test with a quarter of the evidence, and it fails about one run in
    five. */
async function reachOverTime(page, band, times) {
  const seen = [];
  for (let n = 0; n < (times || 5); n++) {
    seen.push((await reachOfOrbit(page, ...band)).right);
    await page.waitForTimeout(220);
  }
  return { right: Math.round(seen.reduce((a, b) => a + b, 0) / seen.length), seen: seen };
}

test("pointing at a row swells the orbit level with it, and nothing else",
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
  // A band level with that row, out where the orbit's right-hand rim
  // runs: where the row is being read off, the orbit stands further
  // out than it does anywhere else.
  const band = [mid - 12, 46];
  // And the open ground between the menu and the orbit, level with the
  // row, where NOTHING may be drawn. A leader used to be run out from
  // each end of the row to the sides of the window — a pair of
  // full-width horizontal lines across the page every time the hand
  // passed over a row — and the owner asked for them gone. The orbit
  // answers, and nothing else does.
  const gap = [190, mid - 22, 220, 44];

  const restGap = await inkSeen(page, gap);
  const restReach = await reachOverTime(page, band);

  await page.mouse.move(row.x + row.width / 2, mid);
  await page.waitForTimeout(1400);
  const readGap = await inkSeen(page, gap);
  const readReach = await reachOverTime(page, band);

  expect(readReach.right,
    `the orbit level with it should swell: ${restReach.right} \u2192 ${readReach.right}` +
    ` (${restReach.seen.join(",")} against ${readReach.seen.join(",")})`)
    .toBeGreaterThan(restReach.right + 50);
  expect(readGap.ink - restGap.ink,
    `and nothing run out across the page: ${restGap.ink} \u2192 ${readGap.ink}`)
    .toBeLessThan(4000);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(2200);
  const goneReach = await reachOverTime(page, band);
  expect(goneReach.right, `and let go again: ${readReach.right} \u2192 ${goneReach.right}`)
    .toBeLessThan(readReach.right - 50);
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

test("pointing at a row draws its own rule back", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  // Off the menu first: it grows out from under the pointer, so the
  // press that opened it leaves the hand standing on the first row.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(800);

  // The rows are ruled off from each other edge to edge, and the rule
  // is what answers the hand: point at a row and its own rule draws
  // back from the right. It is drawn as a layer of the row's own
  // rather than as a border, because a border cannot be shortened
  // without making the row narrower.
  const rule = (row) => row.evaluate(
    (el) => getComputedStyle(el, "::after").transform
  );
  // How much of its width a rule is standing at, out of the matrix the
  // browser hands back: "none" is all of it, matrix(a, ...) is a.
  const across = (t) => (t === "none" ? 1 : parseFloat(t.slice(t.indexOf("(") + 1)));

  const row = page.locator(".chamber-level:not([hidden]) .chamber-chapter").first();
  const rest = across(await rule(row));
  expect(rest, "at rest it should run right across the row").toBeCloseTo(1, 2);

  await row.hover();
  await page.waitForTimeout(700);
  const read = across(await rule(row));
  expect(read, `and draw back under the pointer: ${rest} \u2192 ${read}`)
    .toBeLessThan(0.5);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(700);
  expect(across(await rule(row)), "and come back when it is let go")
    .toBeGreaterThan(0.9);
});

test("nothing on the page is drawn in the accent colour", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);

  // The site keeps one accent colour, and this page does not spend it.
  // It said what it meant in colour twice — the theories drawing's
  // cool blue, which on white read as a different site, and then the
  // brass — and the owner asked for neither: what answers you here is
  // a line drawn, a rule drawn back, an orbit swelling. The canvas has
  // no colour in it at all; this is the writing over it.
  const brass = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue("--brass").trim()
  );
  expect(brass, "the site should still have an accent to not be spending").toBeTruthy();

  // Read as the browser gives it back, so "#9c6f35" and "rgb(...)"
  // cannot disagree.
  const asRGB = await page.evaluate((hex) => {
    const probe = document.createElement("span");
    probe.style.color = hex;
    document.body.appendChild(probe);
    const said = getComputedStyle(probe).color;
    probe.remove();
    return said;
  }, brass);

  const spent = async (what) => page.evaluate((accent) => {
    const found = [];
    document.querySelectorAll(".chamber-plate, .chamber-plate *").forEach((el) => {
      const cs = getComputedStyle(el);
      // Not the outline: the focus ring is the whole site's and is
      // written once for every page, not by this one.
      ["color", "backgroundColor", "borderTopColor", "borderRightColor",
       "borderBottomColor", "borderLeftColor"].forEach((which) => {
        if (cs[which] === accent) found.push(el.className + " " + which);
      });
      ["::before", "::after"].forEach((part) => {
        const ps = getComputedStyle(el, part);
        if (ps.content === "none") return;
        ["color", "backgroundColor", "borderBottomColor"].forEach((which) => {
          if (ps[which] === accent) found.push(el.className + part + " " + which);
        });
      });
    });
    return found;
  }, asRGB).then((found) => {
    expect(found, `${what}: ${found.join(", ")}`).toEqual([]);
  });

  await spent("closed");
  await page.locator(".chamber-word").hover();
  await page.waitForTimeout(600);
  await spent("with the hand on the word");
  await openMenu(page);
  await spent("open");
  await page.locator(".chamber-level:not([hidden]) .chamber-chapter").first().hover();
  await page.waitForTimeout(700);
  await spent("with the hand on a row");
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

/** How much of a square of the window the drawing has TOUCHED at all
    — pixels with any ink in them, rather than how black they are. A
    line strung between two specks covers ground that was empty; a
    speck drawn heavier or tinted covers none. */
const groundCovered = (page, box) =>
  page.evaluate(([x, y, w, h]) => {
    let on = 0;
    ["chamber-field", "chamber-front"].forEach((which) => {
      const canvas = document.querySelector("." + which);
      const ratio = canvas.width / canvas.clientWidth;
      const shot = canvas.getContext("2d").getImageData(
        Math.round(x * ratio), Math.round(y * ratio),
        Math.max(1, Math.round(w * ratio)), Math.max(1, Math.round(h * ratio))
      ).data;
      for (let n = 3; n < shot.length; n += 4) if (shot[n] >= 12) on++;
    });
    return on;
  }, box);

test("the cursor strings a web between the specks it is near", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(12000);

  const word = await page.locator(".chamber-word").boundingBox();
  // On the orbit, below the lettering, where the near rim runs.
  const at = { x: word.x + word.width / 2, y: word.y + word.height + 95 };
  const box = [at.x - 130, at.y - 130, 260, 260];

  // Measured as GROUND COVERED rather than as ink, because what the
  // hand does here is draw LINES between the specks it is near: a line
  // covers ground that was empty, which is the one reading that tells
  // it apart from a speck simply being drawn heavier. The page has
  // answered in weight and in colour in turn and the owner asked for
  // neither; there is nothing tinted or emboldened left to count.
  // Taken as the most of several readings a second apart rather than
  // as one. Every link in the web comes and goes on its own clock, and
  // the orbit is turning under the hand the whole time, so any single
  // frame is worth a fifth either way on its own — the same order as
  // what is being measured.
  const most = async (span) => {
    let best = 0;
    for (let n = 0; n < 4; n++) {
      best = Math.max(best, await groundCovered(page, box));
      await page.waitForTimeout(span);
    }
    return best;
  };

  const before = await most(300);
  await page.mouse.move(at.x, at.y);
  await page.waitForTimeout(900);
  const under = await most(300);

  expect(under, `before ${before}, under the hand ${under}`)
    .toBeGreaterThan(before * 1.1);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(1600);
  const after = await most(300);
  expect(after, `and let go of them again: ${under} \u2192 ${after}`)
    .toBeLessThan(under * 0.9);
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
