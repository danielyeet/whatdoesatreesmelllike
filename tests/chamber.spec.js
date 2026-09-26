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
    // AND A CHAPTER THAT IS WRITTEN UP BUT HAS NOTHING FILED UNDER IT
    // IS STILL A CHAPTER. The chapters used to be read off the
    // favourites alone, which is no use for one that has been named and
    // not filled — Chapter 2 is exactly that.
    document.querySelectorAll(".gallery-chapter[data-chapter]").forEach((block) => {
      const on = (block.dataset.chapter || "").trim();
      if (on && named.indexOf(on) < 0) named.push(on);
    });
    return {
      named: named,
      perChapter: named.map(
        (on) => entries.filter((e) => (e.dataset.chapter || "Unsorted").trim() === on).length
      ),
      rows: [...document.querySelectorAll(".chamber-chapter .chamber-name")]
        .map((el) => el.textContent.trim()),
      reads: [...document.querySelectorAll(".chamber-chapter .chamber-of")]
        .map((el) => el.textContent.trim()),
      entries: entries.length,
      chambered: document.body.classList.contains("chambered"),
    };
  });

  expect(built.entries, "the page should carry some favourites").toBeGreaterThan(2);
  expect(built.named.length, "filed under a few chapters").toBeGreaterThan(1);
  expect(built.rows, "a row for each, in the order the page names them").toEqual(built.named);
  // Each row reads how many are in it — and an empty chapter says so in
  // words rather than counting to nothing.
  built.reads.forEach((read, n) => {
    const many = built.perChapter[n];
    if (many) expect(Number(read.split(" ")[0]), built.named[n]).toBe(many);
    else expect(read, built.named[n] + " has nothing in it yet").toMatch(/NO ENTRIES/i);
  });
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

test("the ring closes as a ring while the loose particles fall in after it",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  // LET THE CHAMBER FILL FIRST. How much of it is a ring and how much is
  // still crossing the window depends on how long the page has been
  // open — particles are fired from the injectors and take a few seconds
  // to reach the orbit. Pressing a chapter a second after the page loads
  // is a real thing a reader can do, and the wind copes with it, but it
  // is not the state this test is about.
  await page.waitForTimeout(3000);
  await openMenu(page);

  /** Where the drawn particles stand, as shares of the half-diagonal:
      how much is near the middle, how much is still far out, and the
      average. Shares rather than a single distance, because the whole
      point of the wind is that there are TWO populations doing two
      different things at the same time.

      BOTH CANVASES, and that matters: this read only the back one for a
      round, and the bug it therefore could not see was the front one
      being faded to nothing for the length of the burst — taking half
      the disc with it, since everything nearer than the middle of the
      chamber is drawn there. Anything asking what the drawing looks
      like has to ask both. */
  const spread = () =>
    page.evaluate(() => {
      const both = [".chamber-field", ".chamber-front"]
        .map((pick) => document.querySelector(pick));
      const canvas = both[0];
      const shots = both.map((c) =>
        c.getContext("2d").getImageData(0, 0, c.width, c.height).data);
      const midX = canvas.width / 2, midY = canvas.height / 2;
      const ref = Math.hypot(midX, midY);
      let ink = 0, sum = 0, near = 0, far = 0;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const at = (y * canvas.width + x) * 4 + 3;
          if (shots[0][at] < 40 && shots[1][at] < 40) continue;
          const r = Math.hypot(x - midX, y - midY) / ref;
          ink++; sum += r;
          if (r < 0.3) near++;
          if (r > 0.6) far++;
        }
      }
      return {
        ink: ink,
        mean: sum / Math.max(1, ink),
        near: near / Math.max(1, ink),
        far: far / Math.max(1, ink),
      };
    });

  const before = await spread();
  expect(before.ink, "there are particles to begin with").toBeGreaterThan(300);

  await page.locator(".chamber-chapter").first().click();

  // NOTHING WAITS FOR ANYTHING: the chrome starts fading and the
  // particles start closing on the same frame the press lands.
  await page.waitForTimeout(900);
  const fading = await page.locator(".chamber-plate").evaluate((el) =>
    parseFloat(getComputedStyle(el).opacity));
  expect(fading, "the word fades from the press, not after it").toBeLessThan(0.95);

  // ONE PASS DOWN THE WIND, ANSWERING TWO QUESTIONS — and it has to be
  // one pass, because both answers are somewhere inside the same two
  // seconds and a scan looking for the first consumes the window the
  // second needed.
  //
  //   BOTH POPULATIONS AT ONCE   what the orbit already had hold of is
  //     closing on the middle AS a ring, while what was still crossing
  //     the window in the two streams is out at the corners waiting its
  //     own turn — so there is ink near the middle and ink far out in
  //     the SAME frame. The frame where the SMALLER of those two
  //     readings is largest is the one that proves it.
  //   AND THEY ALL MEET      by the end of the wind everything is in
  //     the middle. The FULLEST near reading is the one kept.
  //
  // SCANNED, NOT SAMPLED AT FIXED MOMENTS, for both. Each loose
  // particle now has its own moment to start, its own length of fall
  // and its own rate of gaining, so they arrive spread right across the
  // wind rather than all landing at the end — which frame shows what
  // therefore moves with how full the chamber was when the press
  // landed. A fixed wait picks a different part of the picture every
  // run, and on a slow one lands after the wave has started, by which
  // time the particles are being taken off the page.
  let both = await spread();
  let seen = Math.min(both.near, both.far);
  let met = both;
  for (let n = 0; n < 24; n++) {
    await page.waitForTimeout(90);
    if (!(await page.locator(".chapter-page").isHidden())) break;
    const now = await spread();
    const at = Math.min(now.near, now.far);
    if (at > seen) { seen = at; both = now; }
    if (now.near > met.near) met = now;
  }
  expect(seen, `the ring and the loose ones should be drawn at once: ${JSON.stringify(both)}`)
    .toBeGreaterThan(0.12);
  expect(met.near, `everything should have met in the middle: ${JSON.stringify(met)}`)
    .toBeGreaterThan(0.6);
  expect(met.mean, `and nothing left out at the edges: ${met.mean} vs ${before.mean}`)
    .toBeLessThan(before.mean * 0.65);

  // Then the wave goes out and cuts the chapter out of the black.
  await expect(page.locator(".chapter-page")).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const open = await page.locator(".chapter-page").evaluate((el) =>
    getComputedStyle(el).clipPath);
  expect(open, `the wave should have opened the page right out: ${open}`)
    .not.toMatch(/circle\(0%|circle\(0px/);

  // The wave is the home page's own centre: a dark core with two
  // translucent halo shells. Both shells have to be there, or it is a
  // plain circle wipe again.
  expect(await page.locator(".chapter-shell-in").count()).toBe(1);
  expect(await page.locator(".chapter-shell-out").count()).toBe(1);
});

/* THE NEAR HALF OF THE DISC IS STILL DRAWN WHILE IT WINDS IN.
   A regression, and the owner's own report: "half of the disk turns
   invisible on the collapse". Everything nearer than the middle of the
   chamber is drawn on `.chamber-front`, and that canvas was being faded
   to nothing for the length of the burst so that the drawing's labels
   would go with the rest of the chrome. The labels went; so did half the
   ring. What fades now is the marks, faded in `chamber.js` where a
   particle can be told from a label, and the canvas is left alone. */
test("the near half of the disc is still drawn while the ring winds in",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(3000);
  await openMenu(page);

  const whole = [0, 0, 1280, 720];
  expect((await inkOn(page, ".chamber-front", whole)).ink,
    "there is a near half to begin with").toBeGreaterThan(0);

  await page.locator(".chamber-chapter").first().click();

  // TWO READINGS, AND IT NEEDS BOTH, because neither one alone can see
  // this fault.
  //
  //   WHAT IS DRAWN     the near half's SHARE of all the ink, rather
  //     than how much it has of its own: its own falls the whole way in
  //     because the ring is closing, and away to nothing at the end when
  //     everything has met, both of which are right.
  //   WHAT IS SHOWN     the front canvas's own opacity. THE FAULT WAS
  //     NEVER IN THE DRAWING. `chamber.js` went on drawing the near half
  //     perfectly; a CSS rule faded the canvas it was drawn on. Asking
  //     the canvas for its pixels cannot see that — `getImageData`
  //     returns what was drawn, and a canvas at `opacity: 0` still has
  //     every pixel of it. The reading that catches it is the one the
  //     eye takes: is the canvas carrying half the disc being shown at
  //     all. (This was checked by putting the rule back: with only the
  //     ink reading, the test passed with the bug in place.)
  const run = [];
  for (let n = 0; n < 18; n++) {
    await page.waitForTimeout(100);
    if (!(await page.locator(".chapter-page").isHidden())) break;
    const back = await inkOn(page, ".chamber-field", whole);
    const front = await inkOn(page, ".chamber-front", whole);
    const shown = await page.locator(".chamber-front")
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    run.push({ back: back.ink, front: front.ink, shown: shown });
  }
  expect(run.length, "the wind should have been caught").toBeGreaterThan(4);

  // Only the wind proper: the last readings are the particles meeting,
  // and both canvases empty together there, which is right.
  const most = Math.max.apply(null, run.map((one) => one.back));
  const winding = run.filter((one) => one.back > most * 0.4);

  const shares = winding.map((one) => one.front / (one.front + one.back));
  expect(Math.min.apply(null, shares),
    `the near half stopped being drawn: ${JSON.stringify(shares.map((one) => +one.toFixed(3)))}`)
    .toBeGreaterThan(0.1);

  const shown = winding.map((one) => one.shown);
  expect(Math.min.apply(null, shown),
    `the canvas carrying the near half was faded out: ${JSON.stringify(shown)}`)
    .toBeGreaterThan(0.9);
});

/* THE EXPLOSION GOES OUT IN THE RING'S OWN PLANE. The owner asked for
   it to be "parallel to the ring" rather than a circle square to the
   screen, so the mesh is a family of ellipses at the orbit's own angle
   and flatness. Measured off the INK: a circle's bounding box is
   square, and this one must not be.

   IT USED TO BE MEASURED OFF THE CUT — the page was opened out of
   black with a polygon clip-path, and this test read that polygon's
   corners. The owner then asked for the black part of the explosion to
   be removed, so there is no clip-path and no `clipTo` any more: what
   turns the window over is the mesh's own panels darkening. So the
   reading is taken from the canvas the mesh is drawn on, which is the
   same claim about the same shape. */
test("the explosion is an ellipse lying in the ring's plane, not a circle",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(3000);
  await openMenu(page);
  await page.locator(".chamber-chapter").first().click();

  // THE BOUNDING BOX OF WHAT IS ACTUALLY INKED on the mesh's canvas.
  // Sampled on a coarse grid because this runs ninety times and reading
  // every pixel of a full-window canvas ninety times is the test, not
  // the page.
  const inkBox = async () => page.locator(".chapter-rings").evaluate((el) => {
    const g = el.getContext("2d");
    if (!el.width || !el.height) return null;
    const im = g.getImageData(0, 0, el.width, el.height).data;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, seen = 0;
    const step = 4;
    for (let y = 0; y < el.height; y += step) {
      for (let x = 0; x < el.width; x += step) {
        if (im[(y * el.width + x) * 4 + 3] > 8) {
          seen++;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return seen < 40 ? null : { wide: x1 - x0, tall: y1 - y0 };
  });

  // CAUGHT WHILE IT IS STILL INSIDE THE WINDOW. The mesh starts at
  // nothing and ends by covering everything, and once it has covered
  // everything its bounding box is the window's and says nothing about
  // its shape. So the widest reading that is still comfortably inside
  // the window is the one kept.
  const win = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  let box = null;
  for (let n = 0; n < 90; n++) {
    await page.waitForTimeout(60);
    const now = await inkBox();
    if (!now) continue;
    if (now.wide > win[0] * 0.92 || now.tall > win[1] * 0.92) break;
    if (!box || now.wide > box.wide) box = now;
  }
  expect(box, "the mesh should have inked its canvas").toBeTruthy();
  expect(box.wide, "the mesh should have opened far enough to have a shape")
    .toBeGreaterThan(120);
  expect(Math.min(box.wide, box.tall) / Math.max(box.wide, box.tall),
    `a circle would come out square: ${Math.round(box.wide)}x${Math.round(box.tall)}`)
    .toBeLessThan(0.9);

  // And the flatness it was given is the orbit's own, not a made-up one.
  // Read off the WAVE, which stands outside the page it opens so that
  // its shells can bend the chamber underneath.
  const flat = await page.locator(".chapter-wave")
    .evaluate((el) => parseFloat(el.style.getPropertyValue("--wave-flat")));
  expect(flat).toBeGreaterThan(0.15);
  expect(flat).toBeLessThan(0.95);
});

/* AND NOTHING CUTS THE PAGE OPEN ANY MORE. The owner asked for the
   black part of the explosion to be removed: the mesh's panels darken
   to the chapter page's own black instead, and the page is laid under
   them once they have the window. A clip-path back on .chapter-page
   would be the old behaviour returning. */
test("the chapter page is never cut open, it is laid under the mesh",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(3000);
  await openMenu(page);

  // WATCHED FROM INSIDE THE PAGE, FRAME BY FRAME, and set going before
  // the press. It used to poll over the wire every 80ms and then read
  // the mesh once the page had appeared — which is a sample taken at a
  // time rather than at a state, and a heavy frame moves it. It flaked
  // under a loaded full run for that reason, and once the sun was
  // drawing behind the page as well it began failing outright: by the
  // time the poll noticed the page, the mesh had finished and cleared.
  //
  // This reads the mesh ON THE FRAME the page is first shown, which is
  // the moment the claim is actually about.
  await page.evaluate(() => {
    window.__cut = [];
    window.__onArrival = null;
    const tick = () => {
      const pg = document.querySelector(".chapter-page");
      if (pg) {
        const shown = !pg.hidden;
        window.__cut.push({
          inline: pg.style.clipPath || "",
          used: getComputedStyle(pg).clipPath,
          shown: shown,
        });
        if (shown && window.__onArrival === null) {
          const rings = document.querySelector(".chapter-rings");
          window.__onArrival = rings && rings.width > 8
            ? rings.getContext("2d").getImageData(
                Math.round(rings.width / 2), Math.round(rings.height * 0.08), 1, 1).data[3] / 255
            : -1;
        }
      }
      if (window.__cut.length < 1200) requestAnimationFrame(tick);
    };
    tick();
  });

  await page.locator(".chamber-chapter").first().click();
  await page.waitForSelector(".chapter-page.here", { timeout: 20000 });

  const seen = await page.evaluate(() => ({
    cuts: window.__cut, arrival: window.__onArrival,
  }));
  const cut = seen.cuts.find((one) => one.inline.indexOf("polygon") === 0 ||
    (one.used && one.used !== "none"));
  expect(cut, `the page was cut open: ${JSON.stringify(cut)}`).toBeFalsy();
  expect(seen.cuts.some((one) => one.shown), "the page should have arrived").toBe(true);

  // And when it does arrive, the mesh has the window covered — so there
  // is nothing to see in the swap. Read on the arrival frame itself,
  // not a moment later.
  expect(seen.arrival, "the mesh should have been drawing when the page arrived")
    .toBeGreaterThan(-1);
  expect(seen.arrival, "the mesh should have the top of the window covered by then")
    .toBeGreaterThan(0.75);
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

  const cards = await page.$$eval(".chapter-card-shell", (all) =>
    all.map((shell) => ({
      no: shell.querySelector(".chapter-card-no").textContent.trim(),
      house: shell.querySelector(".chapter-card-house").textContent.trim(),
      name: shell.querySelector(".chapter-card-name").textContent.trim(),
      href: shell.querySelector(".fav-link-go").getAttribute("href"),
      dated: /\d{2}\.\d{2}\.\d{4}/.test(shell.textContent),
    }))
  );
  expect(cards.length).toBeGreaterThan(1);
  cards.forEach((card, n) => {
    expect(card.no, "numbered in order").toBe(String(n + 1).padStart(2, "0"));
    // THE HOUSE THE PERFUME COMES FROM, WHERE THE DATE USED TO STAND.
    // The owner asked for the dates off the favourites and for the
    // house in their place, so there must be no date anywhere on a card.
    expect(card.house.length, `${card.name} should say a house or say nothing`)
      .toBeGreaterThan(0);
    expect(card.dated, `${card.name} should carry no date at all`).toBe(false);
    expect(card.name.length).toBeGreaterThan(0);
    // A PAGE ON THIS SITE, not a named folder. These said `works/` until
    // the houses moved out of it into `houses/`, which broke a test that
    // was never really about where a house file sits — that a link
    // resolves to a real file is `repository.spec.js`'s job, site-wide.
    // What matters here is that the card carries a way on at all.
    expect(card.href, `${card.name} should point at a piece`)
      .toMatch(/^\.\.\/[\w-]+\/[\w-]+\.html(#[\w-]+)?$/);
  });
  expect(cards.some((c) => c.house !== "\u2014"),
    "at least one favourite names its house").toBe(true);

  // The reading over them. It used to carry the range of dates the
  // chapter covered; there are none on this page any more.
  const spec = await page.locator(".chapter-spec").textContent();
  expect(spec).toMatch(/\d{2} ENTRIES/);
  expect(spec, "and no dates in it either").not.toMatch(/\d{2}\.\d{2}\.\d{4}/);
});

/** Press a chapter and wait until its page has the window and its
    writing has come in — `here` rather than merely `hidden = false`,
    which happens a few hundred milliseconds earlier while the mesh is
    still over it. */
async function openChapterFully(page, which) {
  await page.locator(".chamber-chapter").nth(which || 0).click();
  await page.waitForSelector(".chapter-page.here", { timeout: 20000 });
  await page.waitForTimeout(900);
}

/* A CHAPTER NEED NOT HAVE ANYTHING IN IT.
   The chapters were read off the favourites alone, so a chapter with no
   favourites was not a chapter at all — which is no use for one that
   has been named and not filled yet. The owner emptied Chapter 2 and
   gave it a description in the same round, and both have to survive. */
test("a chapter with nothing filed under it is still a chapter, and says so",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);

  const written = await page.$$eval(".gallery-chapter[data-chapter]", (all) =>
    all.map((b) => ({
      name: (b.dataset.chapter || "").trim(),
      says: b.textContent.trim().length,
      filed: document.querySelectorAll(
        '.gallery-entry[data-chapter="' + (b.dataset.chapter || "") + '"]').length,
    })));
  const empty = written.filter((c) => c.filed === 0);
  expect(empty.length, "the page should carry a chapter with nothing in it")
    .toBeGreaterThan(0);

  const rows = await page.$$eval(".chamber-chapter .chamber-name",
    (all) => all.map((el) => el.textContent.trim()));
  empty.forEach((c) => {
    expect(rows, c.name + " should still stand in the menu").toContain(c.name);
  });

  await openMenu(page);
  const which = rows.indexOf(empty[0].name);
  await openChapterFully(page, which);

  const state = await page.evaluate(() => ({
    name: document.querySelector(".chapter-name").textContent.trim(),
    spec: document.querySelector(".chapter-spec").textContent.trim(),
    note: document.querySelector(".chapter-note").textContent.trim(),
    cards: document.querySelectorAll(".chapter-card").length,
    // An empty grid under the writing reads as something that failed to
    // load, so the whole of it is taken off the page.
    grid: getComputedStyle(document.querySelector(".chapter-cards")).display,
  }));
  expect(state.name).toBe(empty[0].name);
  expect(state.cards, "and nothing in it").toBe(0);
  expect(state.grid, "with its empty grid off the page").toBe("none");
  expect(state.note.length, "but its writing on it").toBeGreaterThan(3);
  expect(state.spec, "and a reading that says so in words").toMatch(/NO ENTRIES/i);
  expect(errors).toEqual([]);
});

/* THE ARROWS EITHER SIDE OF THE NAME.
   The owner: "an arrow near the right side and left of the word
   chapter, that you can cycle through the page in order to acceess
   chapter 2 and 3 and 1 again etc." So they step one along and wrap,
   and none of the burst is replayed — the page you are standing on is
   rewritten under you. */
test("the arrows step through the chapters and wrap round", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  const names = await page.$$eval(".chamber-chapter .chamber-name",
    (all) => all.map((el) => el.textContent.trim()));
  expect(names.length, "this needs more than one chapter to be worth testing")
    .toBeGreaterThan(1);

  await openMenu(page);
  await openChapterFully(page, 0);
  await expect(page.locator(".chapter-name")).toHaveText(names[0]);

  // Forward through every one of them and round to the first again.
  for (let n = 1; n <= names.length; n++) {
    await page.locator(".chapter-step-on").click();
    await page.waitForTimeout(900);
    await expect(page.locator(".chapter-name")).toHaveText(names[n % names.length]);
    // And the chamber is never come back to on the way: stepping is not
    // leaving, so the page must still have the window throughout.
    expect(await page.locator(".chapter-page").isVisible()).toBe(true);
  }

  // And backwards, which wraps the other way.
  await page.locator(".chapter-step-back").click();
  await page.waitForTimeout(900);
  await expect(page.locator(".chapter-name")).toHaveText(names[names.length - 1]);
  expect(errors).toEqual([]);
});

/* LEAVING A CHAPTER IS NOT A CUT, AND THIS IS THE REGRESSION FOR IT.
   Pressing "← Favourites" used to take the black off the window on the
   frame it was pressed — and what was underneath was a white page with
   no chrome on it, because the burst had faded the menu and the
   particles out on the way in. So leaving a chapter was a flash of an
   empty white page before the chamber faded back. The owner asked for
   it "way smoother".

   What it must never do is show any part of the chamber before the
   chamber has its chrome back. Watched frame by frame from inside the
   page, because sampling this over the wire is far too coarse. */
test("leaving a chapter never shows the chamber without its chrome",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(2500);
  await openMenu(page);
  await openChapterFully(page, 0);

  await page.evaluate(() => {
    window.__out = [];
    const t0 = performance.now();
    const tick = () => {
      const pg = document.querySelector(".chapter-page");
      const sheet = document.querySelector(".chapter-sheet");
      window.__out.push({
        hid: pg.hidden,
        page: Number(getComputedStyle(pg).opacity),
        sheet: Number(getComputedStyle(sheet).opacity),
        plate: Number(getComputedStyle(document.querySelector(".chamber-plate")).opacity),
      });
      if (performance.now() - t0 < 2600) requestAnimationFrame(tick);
    };
    tick();
  });
  await page.locator(".chapter-back").click();
  await page.waitForTimeout(3000);

  const seen = await page.evaluate(() => window.__out);
  const live = seen.filter((f) => !f.hid);
  expect(live.length, "the page should still have been watched while it was up")
    .toBeGreaterThan(10);

  // 1. It fades rather than being cut: there is a run of frames part
  //    way through, not one frame at 1 and the next gone.
  const steps = new Set(live.map((f) => f.page.toFixed(2)));
  expect(steps.size, "the black should fade, not be cut").toBeGreaterThan(4);

  // 2. And nothing of the chamber is ever seen through it before the
  //    chamber has its chrome back. This is the fault itself.
  const bare = live.filter((f) => f.page < 0.9 && f.plate < 0.9);
  expect(bare.length,
    "the chamber was shown through the fading black before its chrome was back")
    .toBe(0);

  // 3. The writing goes first, and the black afterwards.
  const wroteOff = live.findIndex((f) => f.sheet < 0.2);
  const blackOff = live.findIndex((f) => f.page < 0.9);
  expect(wroteOff).toBeGreaterThan(-1);
  expect(blackOff).toBeGreaterThan(wroteOff);

  // And it really does come back to the chamber.
  await expect(page.locator(".chapter-page")).toBeHidden();
  await expect(page.locator(".chamber-panel")).toBeVisible();
});

/* A FAVOURITE OPENS A DRAWER UNDER ITS ROW.
   The owner first: "when you click a given fragrance... the other
   favorite fragrances will go down and the square in which Des Cendres
   is will expand revealing the window of the fragrance". Then, of the
   card taking the whole width of the grid: "it is too techy and leaves
   an awkward space (especially if its slot in the second or third
   column of a row). can you change it somehow so it looks good." So a
   card opens a drawer under the row it stands in: the card stays where
   it is, nothing in its row moves, and the rows after it go down. */
test("a favourite opens a drawer under its row: the card stays put, the rows after it go down",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);

  // Measured against the grid, not the window: pressing a card low on
  // the window carries the page up to show its drawer, which moves
  // everything on the window and nothing in the grid.
  const boxes = () => page.$$eval(".chapter-card-shell", (all) => {
    const grid = document.querySelector(".chapter-cards").getBoundingClientRect();
    return all.map((s) => {
      const r = s.getBoundingClientRect();
      return { top: r.top - grid.top, left: r.left - grid.left, width: r.width, height: r.height,
        open: s.classList.contains("is-open") };
    });
  });
  const before = await boxes();
  expect(before.length, "this wants more than one row of favourites").toBeGreaterThan(3);
  const perRow = before.filter((b) => Math.abs(b.top - before[0].top) < 2).length;
  expect(perRow, "several to a row on a wide window").toBeGreaterThanOrEqual(2);

  // THE SECOND IN ITS ROW — the case the owner named.
  await page.locator(".chapter-card").nth(1).click();
  await page.waitForTimeout(900);
  const after = await boxes();
  expect(after[1].open, "the one pressed is the one that is open").toBe(true);
  for (let n = 0; n < perRow; n++) {
    expect(Math.abs(after[n].top - before[n].top), `card ${n + 1} of the row stays where it was`).toBeLessThan(2);
    expect(Math.abs(after[n].left - before[n].left), `card ${n + 1} does not move across`).toBeLessThan(2);
    expect(Math.abs(after[n].width - before[n].width), `card ${n + 1} keeps its size`).toBeLessThan(2);
  }
  const drawer = await page.evaluate(() => {
    const d = document.querySelector(".fav-drawer");
    if (!d) return null;
    const r = d.getBoundingClientRect();
    const grid = document.querySelector(".chapter-cards").getBoundingClientRect();
    const shells = [...document.querySelectorAll(".chapter-card-shell")];
    return {
      count: document.querySelectorAll(".fav-drawer").length,
      top: r.top - grid.top, height: r.height,
      spans: Math.abs(r.width - grid.width) < 2 && Math.abs(r.left - grid.left) < 2,
      after: shells.indexOf(d.previousElementSibling),
      said: d.querySelectorAll(".fav-writing p").length,
      name: (d.querySelector(".fav-name") || {}).textContent,
      go: d.querySelector(".fav-link-go") ? d.querySelector(".fav-link-go").getAttribute("href") : null,
      notes: Boolean(d.querySelector(".fav-link-notes")),
    };
  });
  expect(drawer, "a drawer should have opened").not.toBeNull();
  expect(drawer.count).toBe(1);
  expect(drawer.after, "under the whole of the card's row, after its last card").toBe(perRow - 1);
  expect(drawer.spans, "the full width of the grid").toBe(true);
  expect(drawer.top, "below the row").toBeGreaterThan(after[0].top + after[0].height);
  expect(drawer.height, "opened on a measured height").toBeGreaterThan(160);
  expect(after[perRow].top, "the rows after it go down, by the drawer's height")
    .toBeGreaterThan(before[perRow].top + drawer.height - 4);
  expect(drawer.name).toBe(await page.locator(".chapter-card-name").nth(1).textContent());
  expect(drawer.said, "something to read").toBeGreaterThanOrEqual(1);
  expect(drawer.go, "and a way on to wherever that fragrance lives")
    .toMatch(/^\.\.\/[\w-]+\/[\w-]+\.html(#[\w-]+)?$/);
  expect(drawer.notes).toBe(true);

  // ANOTHER IN THE SAME ROW: the drawer stays and carries the new one.
  await page.locator(".chapter-card").nth(perRow - 1).click();
  await page.waitForTimeout(900);
  expect(await page.locator(".chapter-card-shell.is-open").count(), "one at a time").toBe(1);
  expect(await page.locator(".chapter-card-shell").nth(perRow - 1)
    .evaluate((s) => s.classList.contains("is-open"))).toBe(true);
  expect(await page.locator(".fav-drawer").count()).toBe(1);
  expect(await page.locator(".fav-drawer .fav-name").textContent())
    .toBe(await page.locator(".chapter-card-name").nth(perRow - 1).textContent());

  // ONE IN THE NEXT ROW: this drawer goes and one opens under that row.
  await page.locator(".chapter-card").nth(perRow).click();
  await page.waitForTimeout(1000);
  expect(await page.locator(".fav-drawer").count(), "the old drawer is gone").toBe(1);
  const moved = await page.evaluate(() => {
    const d = document.querySelector(".fav-drawer");
    return [...document.querySelectorAll(".chapter-card-shell")].indexOf(d.previousElementSibling);
  });
  expect(moved, "under the next row now").toBe(Math.min(before.length - 1, perRow * 2 - 1));
  // AND THE PAGE CARRIED TO IT, NOT PAST IT. The drawer shutting above
  // lifts the card pressed by the whole of its height while the page is
  // carried up to show the new one; the two together sent the card off
  // the top of the window. Settled, both are on it.
  const seen = await page.evaluate(() => {
    const card = document.querySelector(".chapter-card-shell.is-open").getBoundingClientRect();
    const d = document.querySelector(".fav-drawer").getBoundingClientRect();
    return { card: card.top, drawer: d.top, room: innerHeight };
  });
  expect(seen.card, "the card pressed is still on the window").toBeGreaterThanOrEqual(0);
  expect(seen.drawer, "and its drawer opens on the window").toBeLessThan(seen.room - 60);

  // AND SHUT: pressing the open card again takes the drawer away.
  await page.locator(".chapter-card-shell.is-open .chapter-card").click();
  await page.waitForTimeout(900);
  expect(await page.locator(".fav-drawer").count()).toBe(0);
  expect(await page.locator(".chapter-card-shell.is-open").count()).toBe(0);
  expect(errors).toEqual([]);
});

/* WHAT AN OPENED FAVOURITE SAYS. The owner, first: "reword the way
   that the favorite perfumes open when you click them. also add images
   if you have them based on the name from the repository. I want you to
   make it less techy, more minimalist and geometric." And of the picture
   — whole in a circle over a blurred copy of itself — "it looks tacky":
   so it fills an upright frame edge to edge, with nothing behind it,
   placed so the bottle stands in the middle. Then (2026-09-26) they wrote
   what each favourite is on the list for — "add the following
   descriptions to the favorites page. Remove the current descriptions" —
   and asked for Notes and "Read the whole entry" the other way round. So
   an opened favourite says the owner's own words, EXACTLY, and nothing
   read off its entry any more. */
test("an opened favourite says what the owner wrote about it, beside its picture in a frame, credited",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);

  const entries = await page.$$eval(".gallery-entry", (all) => all.map((e) => ({
    name: e.textContent.trim(),
    chapter: e.dataset.chapter,
    image: e.dataset.image || "",
    credit: e.dataset.credit || "",
    href: e.getAttribute("href"),
  })));
  const here = entries.filter((e) => e.chapter === entries[0].chapter);
  // EVERY FAVOURITE HAS A PICTURE NOW, and says where it came from.
  here.forEach((e) => {
    expect(e.image, `${e.name} should name its picture`).toMatch(/^\.\.\/images\//);
    expect(e.credit, `${e.name}'s picture should be credited`).not.toBe("");
  });

  // THE OWNER'S WORDS, as the page carries them: one block per
  // favourite, every one of Chapter 1's ten written, matched by name —
  // and none of the invisible marks a paste leaves behind.
  const written = await page.$$eval(".gallery-writing", (all) => all.map((w) => ({
    name: (w.dataset.favourite || "").trim(),
    paras: [...w.querySelectorAll("p")].map((p) => p.textContent.replace(/\s+/g, " ").trim()),
    raw: w.textContent,
  })));
  expect(written.map((w) => w.name).sort(), "a block for every favourite, and no other")
    .toEqual(here.map((e) => e.name).sort());
  written.forEach((w) => {
    expect(w.paras.length, `${w.name} is written`).toBeGreaterThan(0);
    expect(/[‎‏​﻿]/.test(w.raw), `${w.name} carries no invisible marks`).toBe(false);
  });
  expect(await page.$$eval(".gallery-waiting", (all) => all.length), "no placeholders left").toBe(0);

  // Every card carries its picture and its credit, shut or open — one
  // picture, with no blurred copy laid behind it.
  const plates = await page.$$eval(".chapter-card-shell", (all) => all.map((shell) => ({
    name: shell.querySelector(".chapter-card-name").textContent.trim(),
    src: (shell.querySelector(".fav-print-shot") || {}).getAttribute
      ? shell.querySelector(".fav-print-shot").getAttribute("src") : null,
    pictures: shell.querySelectorAll(".fav-print img").length,
    credit: (shell.querySelector(".fav-credit") || { textContent: "" }).textContent.trim(),
    sign: shell.querySelector(".chapter-card-go").textContent.trim(),
  })));
  plates.forEach((d, n) => {
    expect(d.src, `${d.name} carries its picture`).toBe(here[n].image);
    expect(d.pictures, `${d.name}'s picture is laid down once`).toBe(1);
    expect(d.credit, `${d.name} says whose picture it is`).toBe("Picture: " + here[n].credit);
    // Less technical: the card is opened by a drawn sign, not OPEN ↓.
    expect(d.sign, `${d.name}'s card says nothing in capitals`).toBe("");
  });

  // And every one of those pictures is really there: named by a file
  // in the repository, not a hope. (repository.spec.js lets a missing
  // picture under images/ through on purpose, so this is the check.)
  await expect.poll(() => page.$$eval(".fav-print-shot", (all) => all
    .filter((img) => !(img.complete && img.naturalWidth > 0))
    .map((img) => img.getAttribute("src"))), { timeout: 8000 }).toEqual([]);

  // EACH ONE, OPENED: its writing is the owner's block, word for word.
  for (let n = 0; n < here.length; n++) {
    await page.locator(".chapter-card").nth(n).click();
    await page.waitForFunction((name) => {
      const d = document.querySelector(".fav-drawer");
      return d && d.classList.contains("is-shown") &&
        d.querySelector(".fav-name") && d.querySelector(".fav-name").textContent === name;
    }, here[n].name, { timeout: 5000 });
    const said = await page.$$eval(".fav-drawer .fav-writing p",
      (all) => all.map((p) => p.textContent.replace(/\s+/g, " ").trim()));
    const own = written.find((w) => w.name === here[n].name).paras;
    expect(said, `${here[n].name} says what the owner wrote, exactly`).toEqual(own);
  }

  // THE FIRST, OPENED AGAIN, for its picture and its links.
  await page.locator(".chapter-card").first().click();
  await page.waitForFunction((name) => {
    const d = document.querySelector(".fav-drawer");
    return d && d.querySelector(".fav-name") && d.querySelector(".fav-name").textContent === name &&
      d.querySelector(".fav-print-face.is-placed");
  }, here[0].name, { timeout: 5000 });
  const read = await page.evaluate(() => {
    const drawer = document.querySelector(".fav-drawer");
    const shot = drawer.querySelector(".fav-print-shot");
    const face = drawer.querySelector(".fav-print-face");
    const f = face.getBoundingClientRect(), r = shot.getBoundingClientRect();
    const st = getComputedStyle(shot);
    const sub = (face.dataset.subject || "").split(" ").map(Number);
    const mid = sub.length === 4
      ? { x: r.left + (sub[0] + sub[2]) / 2 * r.width, y: r.top + (sub[1] + sub[3]) / 2 * r.height } : null;
    const links = [...drawer.querySelectorAll(".fav-link")].map((a) => ({
      say: a.textContent.trim(), font: getComputedStyle(a).fontFamily, href: a.getAttribute("href") }));
    return {
      shape: f.width / f.height,
      round: parseFloat(getComputedStyle(face).borderTopLeftRadius) || 0,
      plain: st.filter === "none" && st.mixBlendMode === "normal" && st.maskImage === "none",
      covers: r.left <= f.left + 1 && r.right >= f.right - 1 && r.top <= f.top + 1 && r.bottom >= f.bottom - 1,
      // Drawn back on a clean ground, the frame is that ground's colour.
      carried: face.style.backgroundColor !== "" && getComputedStyle(face).backgroundColor === face.style.backgroundColor,
      placed: face.classList.contains("is-placed"),
      onBottle: mid ? mid.x > f.left && mid.x < f.right && mid.y > f.top && mid.y < f.bottom : null,
      links,
    };
  });

  expect(read.shape, "the picture stands in an upright frame").toBeCloseTo(4 / 5, 1);
  expect(read.round, "square-cornered, not a circle").toBe(0);
  expect(read.plain, "the picture as it is: no blur, no blending, no feathering").toBe(true);
  expect(read.placed, "placed on its bottle").toBe(true);
  expect(read.covers || read.carried,
    "filling the frame edge to edge, or carrying its own clean ground on to the frame's").toBe(true);
  if (read.onBottle !== null) expect(read.onBottle, "with the bottle in the frame").toBe(true);

  // NOTES FIRST, then the way on to the whole entry.
  expect(read.links.map((l) => l.say)).toEqual(["Notes", "Read the whole entry"]);
  expect(read.links[1].href, "and that goes to the favourite's own entry").toBe(here[0].href);
  read.links.forEach((l) => expect(l.font, `${l.say} is not set in the mono`).not.toMatch(/mono/i));
  expect(errors).toEqual([]);
});

/* THE ONES THAT NEARLY MADE IT. The owner: "at the end of the list, I
   would like you to add: Aetherealism, Amber Zero and Incantu from Adar's
   Aegis collection could have all made it here too ..." It is written in
   Chapter 1's own block (`.gallery-after`), set apart from the description
   above the cards, and stands UNDER the last card — the end of the list —
   with each of the three linked to where it stands in ADAR. */
test("Chapter 1 ends with the three that could have made it, under the last card",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);

  const end = await page.evaluate(() => {
    const after = document.querySelector(".chapter-after");
    const cards = [...document.querySelectorAll(".chapter-card-shell")];
    const last = cards[cards.length - 1].getBoundingClientRect();
    const a = after.getBoundingClientRect();
    return {
      shown: !after.hidden && a.height > 0,
      say: after.textContent.replace(/\s+/g, " ").trim(),
      links: [...after.querySelectorAll("a")].map((l) => ({
        say: l.textContent.trim(), href: l.getAttribute("href") })),
      below: a.top >= last.bottom - 1,
      // Not in the description over the cards as well.
      twice: document.querySelector(".chapter-sheet").textContent.split("Adar's Aegis collection").length - 1,
    };
  });
  expect(end.shown, "it stands on the page").toBe(true);
  expect(end.say).toBe("Aetherealism, Amber Zero and Incantu from Adar's Aegis collection could have all " +
    "made it here too, though I have smelled them only once, and so would feel it unjust to everything " +
    "else on the list.");
  expect(end.below, "at the end of the list").toBe(true);
  expect(end.twice, "and only there").toBe(1);
  expect(end.links.map((l) => l.say)).toEqual(["Aetherealism", "Amber Zero", "Incantu"]);
  end.links.forEach((l) => expect(l.href, `${l.say} goes to ADAR`).toMatch(/^\.\.\/houses\/adar\.html#part-\d{2}$/));

  // Each link lands on that fragrance, by name, in ADAR's own page.
  const names = await page.evaluate(async (links) => {
    const doc = new DOMParser().parseFromString(
      await (await fetch("../houses/adar.html")).text(), "text/html");
    return links.map((l) => {
      const part = doc.getElementById(l.href.split("#")[1]);
      return part ? part.querySelector("summary").textContent.replace(/\s+/g, " ") : "";
    });
  }, end.links);
  // The owner spells the first "Aetherealism" and ADAR's page
  // "Aetherialism". The owner's line is theirs and stays as written, so
  // the two are matched on their consonants.
  const bare = (text) => text.toLowerCase().replace(/[^a-z]/g, "").replace(/[aeiouy]/g, "");
  end.links.forEach((l, n) => expect(bare(names[n]), `${l.say} is where its link says`).toContain(bare(l.say)));

  // Chapter 2 has nothing of the kind, and nothing is left standing for it.
  await page.locator(".chapter-step-on").click();
  await expect.poll(() => page.evaluate(() => {
    const after = document.querySelector(".chapter-after");
    return document.querySelector(".chapter-name").textContent.trim() + "|" + after.hidden;
  }), { timeout: 8000 }).toBe("Chapter 2|true");
  expect(errors).toEqual([]);
});

/* AND THE SUN ANSWERS IT. The owner: "Make it somehow react with the
   sun too." An opened favourite tells the sun where its picture's frame
   stands, and the sun answers it: a fine line of its own specks run round
   the frame, lit from the sun's side, a registration mark at each corner,
   and the surface near it brightened. Shut it, and the sun lets go. (It
   was a glowing ring round a circle for one round.) */
test("the sun answers an opened favourite's picture, and lets go when it is shut",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  // Keep hold of the sun the page makes, to ask it how far it has turned
  // to the picture.
  await page.evaluate(() => {
    const make = window.CHAPTER_GROUNDS.sun;
    window.CHAPTER_GROUNDS.sun = function (canvas, opts) {
      const made = make(canvas, opts);
      window.__sun = made;
      window.__sunCanvas = canvas;
      return made;
    };
  });
  await openMenu(page);
  await openChapterFully(page, 0);
  expect(await page.evaluate(() => window.__sun && window.__sun.facing()), "nothing open, nothing answered").toBe(0);

  // Ink in a band just outside the frame, on the sun's own canvas — read
  // at one place on the window, so the same band can be read again with
  // the card shut.
  const frame = () => page.evaluate(() => {
    const f = document.querySelector(".fav-drawer .fav-print-face").getBoundingClientRect();
    return { x: f.left, y: f.top, w: f.width, h: f.height };
  });
  const band = (at) => page.evaluate((at) => {
    const c = window.__sunCanvas;
    const k = c.width / c.clientWidth;
    const all = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let sum = 0, n = 0;
    const read = (x, y) => {
      const px = Math.round(x * k), py = Math.round(y * k);
      if (px < 0 || py < 0 || px >= c.width || py >= c.height) return;
      const i = (py * c.width + px) * 4;
      sum += (all[i] + all[i + 1] + all[i + 2]) / 3 * (all[i + 3] / 255);
      n++;
    };
    for (let d = 6; d <= 24; d += 1) {
      for (let x = at.x - d; x <= at.x + at.w + d; x += 1) { read(x, at.y - d); read(x, at.y + at.h + d); }
      for (let y = at.y - d; y <= at.y + at.h + d; y += 1) { read(at.x - d, y); read(at.x + at.w + d, y); }
    }
    return n ? sum / n : 0;
  }, at);

  await page.locator(".chapter-card").first().click();
  await expect.poll(() => page.evaluate(() => window.__sun.facing()), { timeout: 5000 })
    .toBeGreaterThan(0.95);
  // The drawer opens under the card's row, and the page is carried up to
  // show it: read once it has come to rest, with the frame on the window.
  await page.waitForTimeout(700);
  const at = await frame();
  expect(at.y + at.h, "the opened picture is on the window").toBeLessThan(page.viewportSize().height);
  const lit = await band(at);

  await page.locator(".chapter-card-shell.is-open .chapter-card").click();
  await expect.poll(() => page.evaluate(() => window.__sun.facing()), { timeout: 5000 })
    .toBe(0);
  // The same place with the card shut again — the line was the sun's
  // answer, not the sun already standing bright there.
  const before = await band(at);
  expect(lit, "the sun's line is drawn round the picture").toBeGreaterThan(before * 1.4 + 3);
  expect(errors).toEqual([]);
});

/* AND ITS NOTES ARE THE SITE'S OWN NOTES.
   The owner: "Notes will do the exact same thing everywhere else. Since
   perfume number 1 already has a notes window somewhere, just copy the
   information but adjust the theme." So the window is written by the
   one renderer in notes.js off the one file of notes, and what differs
   is the colour. */
test("a favourite's notes are the site's own, in this page's colours",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);

  // The favourite that names a notes key, whichever it is.
  const keyed = await page.evaluate(() => {
    const all = [...document.querySelectorAll(".gallery-entry")];
    const n = all.findIndex((e) => (e.dataset.notes || "").trim());
    return n < 0 ? null : { at: n, key: all[n].dataset.notes.trim(),
      name: all[n].textContent.trim() };
  });
  expect(keyed, "one favourite should point at its notes").not.toBeNull();

  await page.locator(".chapter-card").nth(keyed.at).click();
  await page.waitForTimeout(800);
  // The button in the drawer that was opened, not the first on the
  // page: every card carries one, shut.
  await page.locator(".fav-drawer .fav-link-notes").click();
  await page.waitForTimeout(700);

  const win = await page.evaluate((key) => {
    const w = document.querySelector(".fav-note");
    const style = getComputedStyle(w);
    const entry = (window.FRAGRANCE_NOTES || {})[key] || {};
    const list = [].concat(entry.flat || [], entry.top || [], entry.mid || [], entry.base || []);
    const said = w.querySelector(".note-in").textContent;
    return {
      up: !w.hidden && w.classList.contains("is-up"),
      of: w.querySelector(".note-head-of").textContent.trim(),
      missing: list.filter((note) => said.indexOf(note) < 0),
      wanted: list.length,
      ground: style.backgroundColor,
      ink: style.color,
      source: Boolean(w.querySelector(".note-source")),
    };
  }, keyed.key);

  expect(win.up, "the window should be up").toBe(true);
  expect(win.of, "and say which fragrance it belongs to").toBe(keyed.name);
  expect(win.wanted, "that fragrance should have notes to show").toBeGreaterThan(0);
  expect(win.missing, "every note in the file should be in the window").toEqual([]);
  expect(win.source, "and it names where they came from").toBe(true);

  // THE THEME, ADJUSTED. Dark ground, light lettering — the window is
  // turned over by redefining its five colour tokens rather than by a
  // second set of rules, so this is the one thing worth pinning.
  const dark = win.ground.match(/\d+/g).slice(0, 3).map(Number);
  const light = win.ink.match(/\d+/g).slice(0, 3).map(Number);
  expect(Math.max(...dark), "the window stands on this page's black")
    .toBeLessThan(60);
  expect(Math.min(...light), "and is read in its silver").toBeGreaterThan(120);

  // Escape steps out of the window first, and leaves the chapter alone.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await expect(page.locator(".fav-note")).toBeHidden();
  await expect(page.locator(".chapter-page")).toBeVisible();
  expect(errors).toEqual([]);
});

/* THE SUN AND THE MOON.
   The owner: "The theme of chapter 1's page should be the sun; I want a
   3D massive sun in the background made of particles and geometry that
   turns and has a character." And a round later: "make chapter 2 from
   favorites have a moon spin the same way that the sun is spinning."
   Each is asked for in the page's own markup — `data-ground` on the
   chapter's block — and a chapter that asks for none would get the plain
   black every chapter used to get. */
test("the sun stands behind Chapter 1 and the moon behind Chapter 2, and both keep the writing legible",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);

  const asked = await page.$$eval(".gallery-chapter[data-chapter]", (all) =>
    all.map((b) => ({
      name: (b.dataset.chapter || "").trim(),
      ground: (b.dataset.ground || "").trim(),
    })));
  expect(asked.map((c) => c.name + ":" + c.ground)).toEqual(["Chapter 1:sun", "Chapter 2:moon"]);
  const withOne = 0;

  const rows = await page.$$eval(".chamber-chapter .chamber-name",
    (all) => all.map((el) => el.textContent.trim()));

  await openMenu(page);
  await openChapterFully(page, rows.indexOf(asked[withOne].name));
  // Let it turn for a moment: the first frame of a sun is a sun.
  await page.waitForTimeout(1200);

  const drawn = await page.evaluate(() => {
    const c = document.querySelector(".chapter-ground");
    if (!c || c.hidden) return { hidden: true };
    const shot = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let n = 3; n < shot.length; n += 4) if (shot[n] > 8) lit += 1;
    return {
      hidden: false,
      lit: lit,
      of: (c.width * c.height) || 1,
      sized: c.width > 100 && c.height > 100,
      // It must not be in the way of the writing.
      clicks: getComputedStyle(c).pointerEvents,
    };
  });
  expect(drawn.hidden, "the drawing should be on the page").toBe(false);
  expect(drawn.sized, "and sized to the window").toBe(true);
  expect(drawn.lit / drawn.of, "and actually drawing something")
    .toBeGreaterThan(0.004);
  expect(drawn.clicks, "without ever being the thing you press").toBe("none");

  // AND THE READING STAYS LEGIBLE. A speck over the writing is drawn at
  // a fraction of its strength — the same way Ataraxia's bands are
  // quietened over their column, which is what the owner asked for by
  // name — so the page is markedly darker behind the words than beside
  // them.
  // MEASURED OVER THE WHOLE CANVAS, in two regions: everything well
  // inside the sheet's own box and everything well outside it, with the
  // `SOFT` ramp the quiet eases in over left out of both. It is the
  // mean that counts rather than any one pixel: the drawing turns, so
  // which patch of it is bright at a given moment does not hold still,
  // but how much light there is over a hundred thousand pixels does.
  //
  // PROVED AGAINST THE FAULT, which is the rule here: with `QUIET` set
  // to 1 in sun.js — the quiet removed and nothing else changed — this
  // page reads 46.3 inside against 36.8 outside, a ratio of 1.26. With
  // the quiet as it stands it reads 22.6 against 37.0, a ratio of 0.61.
  // The threshold sits between the two with room either side.
  const both = await page.evaluate(() => {
    const c = document.querySelector(".chapter-ground");
    const ratio = c.width / c.clientWidth;
    const box = document.querySelector(".chapter-sheet").getBoundingClientRect();
    const shot = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const SOFT = 74;               // the ramp in sun.js
    let inSum = 0, inN = 0, outSum = 0, outN = 0;
    for (let y = 0; y < c.height; y += 2) {
      for (let x = 0; x < c.width; x += 2) {
        const a = shot[(y * c.width + x) * 4 + 3];
        const px = x / ratio, py = y / ratio;
        if (px > box.left + SOFT && px < box.right - SOFT &&
            py > box.top + SOFT && py < box.bottom - SOFT) { inSum += a; inN += 1; }
        else if (px < box.left - SOFT || px > box.right + SOFT ||
                 py < box.top - SOFT || py > box.bottom + SOFT) { outSum += a; outN += 1; }
      }
    }
    return { in: inSum / Math.max(1, inN), out: outSum / Math.max(1, outN),
      inN: inN, outN: outN };
  });
  expect(both.inN, "there should be some window inside the writing").toBeGreaterThan(1000);
  expect(both.outN, "and some beside it").toBeGreaterThan(1000);
  expect(both.out, "the drawing should reach past the writing at all")
    .toBeGreaterThan(6);
  expect(both.in / both.out,
    "a speck over the writing is drawn at a fraction of its strength")
    .toBeLessThan(0.8);

  // THE MOON, stepped to rather than opened afresh — which also says
  // one drawing is taken off and the other put on.
  await page.locator(".chapter-step-on").click();
  await page.waitForTimeout(2200);
  await expect(page.locator(".chapter-name")).toHaveText("Chapter 2");
  const moon = await page.evaluate(() => {
    const c = document.querySelector(".chapter-ground");
    if (!c || c.hidden) return { hidden: true };
    const ratio = c.width / c.clientWidth;
    const box = document.querySelector(".chapter-sheet").getBoundingClientRect();
    const shot = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const SOFT = 74;
    // Compared ON THE MOON'S OWN DISC, behind the writing and beside it:
    // the moon stands half behind the sheet, and the sky round it is
    // nearly empty, so the whole window would compare a moon with a sky.
    const W = innerWidth, H = innerHeight;
    const mx = W * 0.8, my = H * 0.36, mr = Math.max(W, H) * 0.34 * 0.9;
    let lit = 0, inSum = 0, inN = 0, outSum = 0, outN = 0;
    for (let y = 0; y < c.height; y += 2) {
      for (let x = 0; x < c.width; x += 2) {
        const a = shot[(y * c.width + x) * 4 + 3];
        if (a > 8) lit++;
        const px = x / ratio, py = y / ratio;
        if ((px - mx) * (px - mx) + (py - my) * (py - my) > mr * mr) continue;
        if (px > box.left + SOFT && px < box.right - SOFT && py > box.top + SOFT && py < box.bottom - SOFT) { inSum += a; inN++; }
        else if (px < box.left - SOFT || px > box.right + SOFT || py < box.top - SOFT || py > box.bottom + SOFT) { outSum += a; outN++; }
      }
    }
    return { hidden: false, lit: lit * 4 / (c.width * c.height), in: inSum / Math.max(1, inN), out: outSum / Math.max(1, outN) };
  });
  expect(moon.hidden, "Chapter 2 should have its drawing").toBe(false);
  expect(moon.lit, "and it should draw something").toBeGreaterThan(0.004);
  // PROVED AGAINST THE FAULT: with `QUIET` set to 1 in moon.js this
  // reads 1.91; as it stands, 0.87. The side of the disc beside the
  // writing is also the side turned from the light, which is why the
  // quiet one is not lower still.
  expect(moon.in / moon.out, "and quieten itself over the writing too").toBeLessThan(1.3);
  expect(errors).toEqual([]);
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

  // TEN READINGS RATHER THAN FIVE, AND A THRESHOLD OF THIRTY RATHER
  // THAN FIFTY, and the reason is the page rather than the drawing.
  //
  // The swell is measured as how much further right the orbit reaches
  // in a stripe level with the row. That reading depends on WHERE THE
  // ROW STANDS: near the top or bottom of the menu the orbit's rim is
  // well inside its widest, so a swell there buys a lot of horizontal
  // reach; level with the middle of the window the rim is already close
  // to its widest and the same swell buys much less.
  //
  // This test takes the LAST row. When the owner removed Chapter 3 the
  // menu went from three rows to two, and the last row moved from y=429
  // to y=361 — the middle of the window. Measured on the same commit,
  // pointing at the last row: with three chapters the reach went
  // 516 -> 599, 512 -> 603, 497 -> 598 (a swell of 83 to 101); with two
  // it goes 575 -> 623, 568 -> 617, 572 -> 625 (a swell of 42 to 65).
  // Nothing about the swell changed. The old threshold was calibrated
  // against a three-chapter menu and no longer fits a two-chapter one.
  //
  // PROVED AGAINST THE FAULT: pointing INSIDE the menu but not at a row
  // — so no row is hot and there must be no swell at all — the same
  // reading moves by -5 and -7. Thirty sits well clear of that, and
  // well below the real thing.
  const TIMES = 10;
  const SWELL = 30;

  const restGap = await inkSeen(page, gap);
  const restReach = await reachOverTime(page, band, TIMES);

  await page.mouse.move(row.x + row.width / 2, mid);
  await page.waitForTimeout(1400);
  const readGap = await inkSeen(page, gap);
  const readReach = await reachOverTime(page, band, TIMES);

  expect(readReach.right,
    `the orbit level with it should swell: ${restReach.right} \u2192 ${readReach.right}` +
    ` (${restReach.seen.join(",")} against ${readReach.seen.join(",")})`)
    .toBeGreaterThan(restReach.right + SWELL);
  expect(readGap.ink - restGap.ink,
    `and nothing run out across the page: ${restGap.ink} \u2192 ${readGap.ink}`)
    .toBeLessThan(4000);

  await page.mouse.move(4, 4);
  await page.waitForTimeout(2200);
  const goneReach = await reachOverTime(page, band, TIMES);
  expect(goneReach.right, `and let go again: ${readReach.right} \u2192 ${goneReach.right}`)
    .toBeLessThan(readReach.right - SWELL);
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

/* THE PAGE WRITES ITSELF IN AFTER THE DRAWING, NOT UNDERNEATH IT.
   The page has to be laid under the mesh before the mesh goes — or the
   chamber's white shows through for a frame — but its writing used to
   start there too, four hundred-odd milliseconds early. By the time you
   could see anything the heading was simply present and the cards were
   half way in, so the end of the burst read as a cut to a page already
   part built. That is what the owner meant by the handover not being
   smooth, and this is the regression for it. */
test("the chapter page's writing waits for the drawing to be taken off",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  await page.waitForTimeout(3000);
  await openMenu(page);

  // Watched frame by frame from inside the page: sampling it over the
  // wire is far too coarse for a handover this short.
  await page.evaluate(() => {
    window.__seen = [];
    const tick = () => {
      const sheet = document.querySelector(".chapter-page");
      const wave = document.querySelector(".chapter-wave");
      const name = document.querySelector(".chapter-name");
      const card = document.querySelector(".chapter-card");
      if (sheet && !sheet.hidden) {
        window.__seen.push({
          laid: sheet.classList.contains("laid"),
          here: sheet.classList.contains("here"),
          over: wave ? !wave.hidden : false,
          name: name ? Number(getComputedStyle(name).opacity) : 0,
          card: card ? Number(getComputedStyle(card).opacity) : 0,
        });
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  await page.locator(".chamber-chapter").first().click();
  await expect(page.locator(".chapter-page")).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2200);
  const seen = await page.evaluate(() => window.__seen);

  // It really is laid under the drawing first.
  const under = seen.filter((one) => one.over);
  expect(under.length, "the page should stand under the mesh for a while")
    .toBeGreaterThan(3);
  under.forEach((one) => {
    expect(one.laid, "and be `laid` rather than `here` while it is").toBe(true);
  });

  // NOTHING IS WRITTEN ON IT WHILE THE DRAWING IS STILL THERE. This is
  // the assertion: with the old behaviour the cards were already past
  // half way by the last of these frames.
  const most = Math.max.apply(null, under.map((one) => Math.max(one.name, one.card)));
  expect(most, "nothing on the sheet should arrive under the drawing").toBeLessThan(0.02);

  // And afterwards it does arrive.
  const after = seen.filter((one) => one.here);
  expect(after.length).toBeGreaterThan(3);
  expect(Math.max.apply(null, after.map((one) => one.name)),
    "the heading comes in once the drawing is off").toBeGreaterThan(0.9);
  expect(Math.max.apply(null, after.map((one) => one.card)),
    "and so do the cards").toBeGreaterThan(0.9);
});

/* THE MOON TURNS THE SAME WAY AS THE SUN — "a moon spin the same way
   that the sun is spinning". The same tilt of axis, the same rate, the
   same way round: read off the two scripts, which are the only place
   either number lives. */
test("the moon turns on the sun's own axis, at the sun's own rate", () => {
  const fs = require("fs");
  const path = require("path");
  const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  const num = (src, name) => {
    const m = new RegExp("const " + name + " = (-?[\\d.]+);").exec(src);
    return m ? Number(m[1]) : NaN;
  };
  const sun = read("sun.js"), moon = read("moon.js");
  expect(num(moon, "TILT"), "the same tilt").toBe(num(sun, "TILT"));
  expect(num(moon, "SPIN"), "the same rate, the same way round").toBe(num(sun, "SPIN"));
  expect(num(sun, "SPIN")).toBeGreaterThan(0);
});

/* NEITHER CHAPTER'S PAGE IS EMPTY DOWN THE LEFT. "put some particles on
   the left hand side of the page, it looks empty (favorites, chapters 1
   and 2)". The sun blows its wind that way and the moon has its stars
   there; measured in the strip between the window's left edge and the
   writing. */
test("both chapters have something drawn down the left of the page", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);
  const strip = () => page.evaluate(() => {
    const c = document.querySelector(".chapter-ground");
    const ratio = c.width / c.clientWidth;
    const box = document.querySelector(".chapter-sheet").getBoundingClientRect();
    const right = Math.max(40, box.left - 80);
    const shot = c.getContext("2d").getImageData(0, 0, Math.round(right * ratio), c.height).data;
    let lit = 0;
    for (let i = 3; i < shot.length; i += 4) if (shot[i] > 10) lit++;
    return lit / (shot.length / 4);
  });
  await page.waitForTimeout(1500);
  const one = await strip();
  await page.locator(".chapter-step-on").click();
  await page.waitForTimeout(2200);
  const two = await strip();
  expect(one, "Chapter 1's left side has the sun's wind in it").toBeGreaterThan(0.004);
  expect(two, "Chapter 2's left side has the moon's stars in it").toBeGreaterThan(0.004);
  expect(errors).toEqual([]);
});

/* THE ARROWS MORPH THE ONE DRAWING INTO THE OTHER. "introduce a
   transition when flipping from chapter 1 favorites to chapter 2 ...
   make it so that the particles change and morph from sun to moon (and
   vice versa), while the text fades out and in." It was a cut: the sun
   stopped and the moon started in one frame. Read here, while it runs:
   the flown specks on a canvas of their own, the new drawing held under
   a veil until they are nearly home, and the writing gone and back. */
test("stepping between chapters morphs the sun into the moon and back, as the writing fades",
  async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);
  await page.waitForTimeout(800);

  for (const [from, to] of [["Chapter 1", "Chapter 2"], ["Chapter 2", "Chapter 1"]]) {
    await expect(page.locator(".chapter-name")).toHaveText(from);
    // Sample the whole turn from inside the page, every frame.
    const seen = await page.evaluate(() => new Promise((done) => {
      const morph = document.querySelector(".chapter-morph");
      const ground = document.querySelector(".chapter-ground");
      const sheet = document.querySelector(".chapter-sheet");
      const out = { flying: 0, inked: 0, veiled: 1, sheetLow: 1, sheetEnd: 0, groundEnd: 0, morphEnd: true };
      const t0 = performance.now();
      const look = () => {
        const t = performance.now() - t0;
        if (!morph.hidden) {
          out.flying++;
          if (t > 300 && t < 1200 && out.inked === 0) {
            const g = morph.getContext("2d");
            const im = g.getImageData(0, 0, morph.width, morph.height).data;
            let n = 0;
            for (let i = 3; i < im.length; i += 64) if (im[i] > 20) n++;
            out.inked = n;
          }
          if (t > 200 && t < 1000) out.veiled = Math.min(out.veiled, +getComputedStyle(ground).opacity);
        }
        out.sheetLow = Math.min(out.sheetLow, +getComputedStyle(sheet).opacity);
        if (t < 4200) { requestAnimationFrame(look); return; }
        out.sheetEnd = +getComputedStyle(sheet).opacity;
        out.groundEnd = +getComputedStyle(ground).opacity;
        out.morphEnd = morph.hidden;
        done(out);
      };
      document.querySelector(".chapter-step-on").click();
      requestAnimationFrame(look);
    }));
    await expect(page.locator(".chapter-name")).toHaveText(to);
    expect(seen.flying, `${from} → ${to}: the specks are flown`).toBeGreaterThan(20);
    expect(seen.inked, "and there is something on the flight's canvas").toBeGreaterThan(200);
    expect(seen.veiled, "the new drawing is held back while they fly").toBeLessThan(0.2);
    expect(seen.sheetLow, "the writing fades out").toBeLessThan(0.1);
    expect(seen.sheetEnd, "and back in").toBeGreaterThan(0.95);
    expect(seen.groundEnd, "the new drawing is up at the end").toBeGreaterThan(0.95);
    expect(seen.morphEnd, "and the flight's canvas is put away").toBe(true);
  }
  expect(errors).toEqual([]);
});

/* THE MORPH HAPPENS IN ONE PLACE. "the moon and sun transition is
   pretty weak, as they change into the other and then morph afterwards.
   this is choppy because they are in different places on the page".
   The moon stood lower and smaller than the sun, and the flight paired
   specks by their distance from each drawing's brightest middle, so the
   cloud swept across the window. Now both drawings say where their
   sphere stands when they are captured for the morph, and it is the
   same sphere — which is what lets every speck fly only to its nearest
   twin. Asked of the two drawings themselves, each made on a canvas of
   its own. */
test("the sun and the moon stand on the same sphere, so one turns into the other where it stands",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  const spheres = await page.evaluate(() => {
    const out = {};
    for (const name of ["sun", "moon"]) {
      const c = document.createElement("canvas");
      c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;opacity:0";
      document.body.appendChild(c);
      const made = window.CHAPTER_GROUNDS[name](c, { column: () => null });
      const shot = made.capture();
      out[name] = { centre: shot.centre || null, radius: shot.radius || null, specks: shot.specks.length / 5 };
      made.stop();
      c.remove();
    }
    return out;
  });
  expect(spheres.sun.centre, "the sun says where it stands").not.toBeNull();
  expect(spheres.moon.centre, "and so does the moon").not.toBeNull();
  expect(spheres.moon.centre[0]).toBeCloseTo(spheres.sun.centre[0], 0);
  expect(spheres.moon.centre[1]).toBeCloseTo(spheres.sun.centre[1], 0);
  expect(spheres.moon.radius).toBeCloseTo(spheres.sun.radius, 0);
  expect(spheres.sun.specks, "and both are drawn in specks").toBeGreaterThan(1000);
  expect(spheres.moon.specks).toBeGreaterThan(1000);
});

/* AND THE MORPH LANDS ON WHAT COMES UP — no cut at either end. "It kinda
   transitions and then cuts to the other page." The new drawing went on
   turning, unseen, for the whole flight, so the frame it came up on no
   longer matched where the specks had landed; and the old drawing's glow
   dropped in the first frame. Now the new drawing is HELD at the frame
   the flight is aimed at until the flight is home, and the old one, glow
   and all, fades into its own specks. Read off the canvases themselves:
   the new drawing as the flight is aimed at it, as it comes up, and
   again once it has been let go (which shows it does move, so that the
   first two matching means something); and the old drawing against the
   flight's first frame. */
test("the morph lands on the very frame that comes up, and leaves the old drawing without a blink",
  async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);
  await page.waitForTimeout(1200);

  for (const [from, to] of [["Chapter 1", "Chapter 2"], ["Chapter 2", "Chapter 1"]]) {
    await expect(page.locator(".chapter-name")).toHaveText(from);
    const seen = await page.evaluate(() => new Promise((done) => {
      const morph = document.querySelector(".chapter-morph");
      const ground = document.querySelector(".chapter-ground");
      // A coarse reading of a canvas: light in every eighth pixel of
      // every eighth row. The drawings quieten themselves behind the
      // writing, and the writing is rewritten half way through the
      // flight, so the frame is compared OUTSIDE where either chapter's
      // writing stands (`away`) — that part is the drawing's alone.
      const sheet = () => document.querySelector(".chapter-sheet").getBoundingClientRect();
      const away = [];
      const read = (c, skip) => {
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        const ratio = c.width / window.innerWidth;
        const out = [];
        for (let y = 0; y < c.height; y += 8) for (let x = 0; x < c.width; x += 8) {
          const i = (y * c.width + x) * 4;
          const px = x / ratio, py = y / ratio;
          const hid = skip && away.some((r) => px > r.left - 60 && px < r.right + 60 && py > r.top - 60 && py < r.bottom + 60);
          out.push(hid ? 0 : (d[i] + d[i + 1] + d[i + 2]) * d[i + 3] / 255);
        }
        return out;
      };
      const apart = (a, b) => {
        let n = 0, m = 0;
        for (let i = 0; i < a.length; i++) { n += Math.abs(a[i] - b[i]); m += a[i] + b[i]; }
        return m ? n / m : 0;
      };
      const light = (a) => a.reduce((s, v) => s + v, 0);
      away.push(sheet());
      const before = read(ground);
      document.querySelector(".chapter-step-on").click();
      // The flight is set up on the frame after the press (the press is
      // answered at once, and the setting up waits a frame), so it is
      // read then: the flight's first frame, and the new drawing as the
      // flight is aimed at it.
      let first = null;
      const aimedShot = document.createElement("canvas");
      aimedShot.width = ground.width;
      aimedShot.height = ground.height;
      requestAnimationFrame(() => {
        first = read(morph);
        aimedShot.getContext("2d").drawImage(ground, 0, 0);
        requestAnimationFrame(wait);
      });
      const ground0 = ground;
      const wait = () => {
        if (!morph.hidden) { requestAnimationFrame(wait); return; }
        away.push(sheet());
        const aimedNow = read(aimedShot, true);
        const landed = read(ground0, true);
        setTimeout(() => {
          const later = read(ground0, true);
          done({
            held: apart(aimedNow, landed),
            moves: apart(landed, later),
            kept: light(first) / Math.max(1, light(before)),
          });
        }, 2300);
      };
    }));
    await expect(page.locator(".chapter-name")).toHaveText(to);
    expect(seen.moves, `${to}'s drawing turns once it is let go`).toBeGreaterThan(0.05);
    expect(seen.held, `${from} → ${to}: it comes up on the frame the flight landed on`)
      .toBeLessThan(seen.moves * 0.35);
    expect(seen.kept, "the old drawing is all there in the flight's first frame").toBeGreaterThan(0.85);
    await page.waitForTimeout(600);
  }
  expect(errors).toEqual([]);
});

/* SMOOTHER: "whenever you transitoon from chapter 1 to chapter 2 or
   back, its quite laggy, so make it smoother." Two things made it lag,
   and both are held here. THE PRESS IS ANSWERED AT ONCE — the writing
   starts to go in the same moment (`turning`), and the second or so of
   setting the flight up waits for the next frame rather than holding the
   press up. And THE NEW DRAWING IS NOT REDRAWN UNSEEN: held still under
   its veil for most of the flight, it used to draw the same frame over
   and over, as heavy as the flight itself; now nothing is drawn on it
   between its first held frame and the veil lifting. */
test("stepping chapters answers the press at once, and nothing is drawn unseen under the veil",
  async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__groundRects = 0;
    const fillRect = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function () {
      if (this.canvas.classList.contains("chapter-ground")) window.__groundRects++;
      return fillRect.apply(this, arguments);
    };
  });
  await page.goto(PAGE);
  await waitForChamber(page);
  await openMenu(page);
  await openChapterFully(page, 0);
  await page.waitForTimeout(1200);
  const seen = await page.evaluate(() => new Promise((done) => {
    const pageEl = document.querySelector(".chapter-page");
    const ground = document.querySelector(".chapter-ground");
    const t0 = performance.now();
    document.querySelector(".chapter-step-on").click();
    const out = { answered: pageEl.classList.contains("turning"), took: performance.now() - t0, veiledRects: 0, veiledFrames: 0 };
    let from = -1;
    const look = () => {
      const t = performance.now() - t0;
      const veiled = ground.style.opacity !== "" && parseFloat(ground.style.opacity) === 0;
      // From a few frames in (the new drawing's first held frame is
      // drawn once) until the veil starts to lift.
      if (veiled && t > 200) {
        if (from < 0) from = window.__groundRects;
        out.veiledFrames++;
        out.veiledRects = window.__groundRects - from;
      }
      if (t < 1600) { requestAnimationFrame(look); return; }
      done(out);
    };
    requestAnimationFrame(look);
  }));
  expect(seen.answered, "the writing starts to go on the press itself").toBe(true);
  expect(seen.took, "and the press is not held up").toBeLessThan(30);
  expect(seen.veiledFrames, "the new drawing was under its veil for a while").toBeGreaterThan(5);
  expect(seen.veiledRects, "and nothing was drawn on it there").toBe(0);
});

/* THE SPIN PICKS UP: "i want the spinning to start gradually after the
   transiton. to pick up speed and accelerate into the speed that it is
   currently spinning at. make that SLIGHTLY gradual." Read off each
   drawing's own clock (`at`): held, it stands; let go, it moves on
   slowly at first, and a second and a half later it is going at its
   full rate. */
test("let go after the morph, the sun and the moon pick up speed rather than setting off at full", async ({ page }) => {
  await page.goto(PAGE);
  await waitForChamber(page);
  const out = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const res = {};
    for (const name of ["sun", "moon"]) {
      const c = document.createElement("canvas");
      c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;opacity:0.01";
      document.body.appendChild(c);
      const g = window.CHAPTER_GROUNDS[name](c, { column: () => null });
      g.hold(true);
      await wait(200);
      const a0 = g.at();
      await wait(250);
      const still = g.at() - a0;
      g.hold(false);
      const b0 = g.at();
      await wait(300);
      const first = g.at() - b0;
      await wait(1500);
      const c0 = g.at();
      await wait(300);
      const later = g.at() - c0;
      g.stop();
      c.remove();
      res[name] = { still, first, later };
    }
    return res;
  });
  for (const name of ["sun", "moon"]) {
    const r = out[name];
    expect(r.still, `${name}: held, it stands`).toBe(0);
    expect(r.first, `${name}: let go, it sets off slowly`).toBeLessThan(r.later * 0.4);
    expect(r.later, `${name}: and is soon at its full rate`).toBeGreaterThan(0.2);
  }
});
