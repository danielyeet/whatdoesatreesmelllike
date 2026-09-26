// ============================================================
// THE HOUSES — the axis (categories/scent-descriptions.html)
//
// The houses stand on a helix of particles round a central axis: one
// at the front, on the axis, large and sharp, and the ones before and
// after it turned away round the axis above and below. You travel along
// it by the wheel, a drag, the keys, the numbers on the axis and the
// two buttons at the side. Resting on a house brings that house's
// motifs up over the page while the rest goes out of focus; pressing a
// house at the side brings it to the front, and pressing the front one
// steps the page back before opening it.
//
// These check what can be WRONG rather than merely ugly: the front house
// really on the axis and the rest in order round it, every way of
// travelling actually travelling, the particles moving, the page
// arriving one thing after another, the axis reaching both ends of the
// window, nothing cut off short of the window's edge, the motifs waiting
// before they come and fading when they go, and the old startup flick
// staying gone.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/** Wait for the wall to have been hung and every swing to have died. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(2600);
}

/** Where every house stands on the window, which is at the front, and
    what the way round says. */
const axis = (page) =>
  page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
        x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, w: r.width };
    };
    const sheet = document.getElementById("sheet");
    return {
      width: innerWidth,
      middle: (sheet.getBoundingClientRect().left + sheet.getBoundingClientRect().right) / 2,
      frames: [...document.querySelectorAll(".sheet-frame")].map((f) => ({
        ...box(f), front: f.classList.contains("front"), z: Number(f.style.zIndex || 0),
        seen: getComputedStyle(f).visibility !== "hidden" && parseFloat(getComputedStyle(f).opacity) > 0.05,
      })),
      marks: [...document.querySelectorAll(".sheet-axis-no")].map((m) => ({ ...box(m), text: m.textContent, on: m.classList.contains("is-on") })),
      at: document.querySelector(".sheet-nav-at b").textContent,
      front: sheet.dataset.front,
    };
  });

/** Travel to house `which` with the keys, out of the pointer's way, and
    wait for the helix to come to rest. */
async function bringToFront(page, which) {
  await page.mouse.move(4, 4);
  await page.keyboard.press("Home");
  for (let i = 0; i < which; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator("#sheet")).toHaveAttribute("data-front", String(which + 1));
  await page.waitForTimeout(1300);
}

/** How much the motifs' canvas has drawn, in pixels with any ink. */
const motifInk = (page) =>
  page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    if (!c) return -1;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n;
  });

/** Bring a house to the front, then move the pointer onto its middle. */
async function pointAt(page, which) {
  await bringToFront(page, which);
  const box = await page.locator(".sheet-frame").nth(which).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* THE AXIS. One house at the front, on the axis — the first, to begin
   with — and the largest; the next turned away round the axis to one
   side and below it, and so on; every house's number standing on the
   axis where it is. */
test("the houses stand on a helix round a central axis, one at the front", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const a = await axis(page);
  expect(a.frames.length).toBe(9);
  const fronts = a.frames.filter((f) => f.front);
  expect(fronts.length, "one house at the front").toBe(1);
  expect(a.frames[0].front, "and it is the first").toBe(true);
  expect(Math.abs(a.frames[0].x - a.middle), "standing on the axis").toBeLessThan(3);
  a.frames.slice(1).forEach((f, i) =>
    expect(f.w, `house ${i + 2} is smaller than the front one`).toBeLessThan(a.frames[0].w));
  // The next one is turned away round the axis and stands below.
  expect(Math.abs(a.frames[1].x - a.middle), "the next house is off the axis").toBeGreaterThan(100);
  expect(a.frames[1].y, "and below the front one").toBeGreaterThan(a.frames[0].y + 40);
  expect(a.frames[0].z, "the front one stands in front of it").toBeGreaterThan(a.frames[1].z);
  // The numbers, on the axis, in order down it.
  expect(a.marks.map((m) => m.text)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  a.marks.forEach((m) => expect(Math.abs(m.left - a.middle), `${m.text} stands on the axis`).toBeLessThan(40));
  for (let i = 1; i < a.marks.length; i++) expect(a.marks[i].y).toBeGreaterThan(a.marks[i - 1].y);
  expect(a.marks[0].on).toBe(true);
  expect(a.at).toBe("01 / 09");
  // And the axis itself is drawn: a column of ink down the middle of the
  // particles' canvas.
  const drawn = await page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const ratio = c.width / c.clientWidth;
    const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    // A hairline a pixel wide, so a pixel either side of where it is
    // asked for is read as well.
    const col = (x) => {
      let n = 0;
      const at = Math.round(x * ratio);
      for (let y = 0; y < c.height; y++) {
        if ([-1, 0, 1].some((d) => g[(y * c.width + at + d) * 4 + 3] > 20)) n++;
      }
      return n / c.height;
    };
    return { axis: col(c.clientWidth / 2), aside: col(c.clientWidth / 2 + 60) };
  });
  expect(drawn.axis, "the axis runs down the middle").toBeGreaterThan(0.5);
  expect(drawn.axis).toBeGreaterThan(drawn.aside * 3);
});

/* TRAVELLING — the owner's "navigatable". Every way there is of going
   along the helix actually goes, and the way round at the side says
   where you are. */
test("the wheel, the keys, the numbers, the buttons and a drag all travel along the helix",
  async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const at = () => page.locator("#sheet").getAttribute("data-front");
  const settle = () => page.waitForTimeout(900);

  // The wheel, over empty page.
  await page.mouse.move(60, 500);
  await page.mouse.wheel(0, 330);
  await settle();
  expect(await at(), "the wheel").toBe("2");
  await expect(page.locator(".sheet-nav-at b")).toHaveText("02 / 09");
  await expect(page.locator(".sheet-nav-at span")).toHaveText("ADAR");

  await page.keyboard.press("ArrowDown");
  await settle();
  expect(await at(), "the arrow keys").toBe("3");

  await page.locator('.sheet-nav-step[data-step="-1"]').click();
  await settle();
  expect(await at(), "the button at the side").toBe("2");

  await page.locator(".sheet-axis-no").nth(5).click();
  await settle();
  expect(await at(), "a number on the axis").toBe("6");
  await expect(page.locator(".sheet-axis-no").nth(5)).toHaveClass(/is-on/);

  await page.keyboard.press("End");
  await settle();
  expect(await at(), "End").toBe("9");
  await page.keyboard.press("Home");
  await settle();
  expect(await at(), "Home").toBe("1");

  // A drag upwards, over empty page, carries you on to the next.
  await page.mouse.move(60, 600);
  await page.mouse.down();
  await page.mouse.move(60, 520, { steps: 4 });
  await page.mouse.move(60, 360, { steps: 6 });
  await page.mouse.up();
  await settle();
  expect(await at(), "a drag").toBe("2");
  // And the page itself never scrolled under any of it.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

/* PRESSING a house at the side does not open it: it brings it round to
   the front. */
test("pressing a house at the side brings it to the front", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const b = await page.locator(".sheet-frame").nth(1).boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(1000);
  expect(page.url(), "nothing was opened").toMatch(/scent-descriptions/);
  await expect(page.locator("#sheet")).toHaveAttribute("data-front", "2");
  await expect(page.locator(".sheet-frame").nth(1)).toHaveClass(/front/);
});

/* ONE THING AFTER ANOTHER as the page arrives: "the animation should be
   sequential, so you first have the central line, then the spiral of
   particles and only then the images. the images should load
   chronologically yet relatively quickly." Watched in the page itself,
   a few times a second: when the axis is first drawn down the middle of
   the particles' canvas, when there is first ink anywhere off it (the
   helix and the dust round it), and when each house first shows. It
   used to bring the houses out while the axis was still being drawn,
   with the helix coming up alongside it. */
test("first the axis, then the helix, and only then the houses, in order", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cameAt = [];
    window.__axisAt = null;
    window.__helixAt = null;
    const t0 = performance.now();
    let frame = 0;
    const watch = () => {
      const now = performance.now() - t0;
      document.querySelectorAll(".sheet-frame").forEach((f, i) => {
        if (window.__cameAt[i] == null && parseFloat(getComputedStyle(f).getPropertyValue("--shown") || "0") > 0.05) {
          window.__cameAt[i] = now;
        }
      });
      const c = document.querySelector(".sheet-field");
      if (c && c.width && frame++ % 3 === 0 && (window.__axisAt == null || window.__helixAt == null)) {
        const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        const ratio = c.width / c.clientWidth;
        const mid = Math.round(c.width / 2), keep = Math.round(40 * ratio);
        let axis = 0, rows = 0, off = 0;
        for (let y = 0; y < c.height; y += 4) {
          rows++;
          if (g[(y * c.width + mid) * 4 + 3] > 60 || g[(y * c.width + mid - 1) * 4 + 3] > 60) axis++;
          for (let x = 0; x < c.width; x += 3) {
            if (Math.abs(x - mid) > keep && g[(y * c.width + x) * 4 + 3] > 20) off++;
          }
        }
        if (window.__axisAt == null && axis / rows > 0.3) window.__axisAt = now;
        if (window.__helixAt == null && off > 120) window.__helixAt = now;
      }
      if (now < 6000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  const t = await page.evaluate(() => ({ axis: window.__axisAt, helix: window.__helixAt, came: window.__cameAt }));
  expect(t.axis, "the axis is drawn").not.toBeNull();
  expect(t.helix, "and then the helix").not.toBeNull();
  expect(t.helix, "the helix comes after the axis").toBeGreaterThan(t.axis + 150);
  expect(t.came[0], "the first house comes after the helix").toBeGreaterThan(t.helix + 250);
  // The houses in order, 01 first — and quickly, one after another
  // rather than all at once.
  expect(t.came[0], "01 first").toBeLessThan(t.came[1]);
  expect(t.came[1], "then 02").toBeLessThan(t.came[2]);
  expect(t.came[2] - t.came[0], "not at once").toBeGreaterThan(80);
  expect(t.came[2] - t.came[0], "but quickly").toBeLessThan(800);
});

/* THE AXIS RUNS THE WHOLE HEIGHT OF THE WINDOW, "all the way up" and "all
   the way down": ink at the axis in the top rows of the window and in
   the bottom ones, where it used to stop short at both ends — and it
   runs up BETWEEN the two words across the top, which are set apart
   either side of it and a little larger than they were. */
test("the axis runs from the top of the window to its foot, between Houses and Fragrances", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const at = c.getBoundingClientRect();
    const ratio = c.width / c.clientWidth;
    const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const mid = Math.round((c.clientWidth / 2) * ratio);
    // How many of the rows between two heights on the window have the
    // axis drawn in them.
    const inked = (from, to) => {
      let n = 0, rows = 0;
      for (let y = Math.round((from - at.top) * ratio); y < Math.round((to - at.top) * ratio); y++) {
        if (y < 0 || y >= c.height) continue;
        rows++;
        if ([-1, 0, 1].some((d) => g[(y * c.width + mid + d) * 4 + 3] > 120)) n++;
      }
      return rows ? n / rows : 0;
    };
    const houses = document.querySelector(".sheet-filter[data-view='houses']").getBoundingClientRect();
    const frags = document.querySelector(".sheet-filter[data-view='fragrances']").getBoundingClientRect();
    return {
      axisX: at.left + c.clientWidth / 2,
      top: inked(0, 40), foot: inked(innerHeight - 40, innerHeight),
      houses: { left: houses.left, right: houses.right },
      frags: { left: frags.left, right: frags.right },
      size: parseFloat(getComputedStyle(document.querySelector(".sheet-filter")).fontSize),
    };
  });
  expect(out.top, "the axis reaches the top of the window").toBeGreaterThan(0.9);
  expect(out.foot, "and its foot").toBeGreaterThan(0.9);
  expect(out.houses.right, "Houses stands to the left of the axis").toBeLessThan(out.axisX - 20);
  expect(out.frags.left, "Fragrances to the right of it").toBeGreaterThan(out.axisX + 20);
  // Split evenly about it.
  expect(Math.abs((out.axisX - out.houses.right) - (out.frags.left - out.axisX)), "evenly either side").toBeLessThan(6);
  expect(out.size, "and larger than the 11px they were").toBeGreaterThan(11.5);
});

/* A HOUSE TURNED AWAY ABOVE OR BELOW IS NOT CUT OFF partway down the
   window: "I also dont want the houses to disappear midway through the
   white (2nd house to the left of current one, so if im hovering 5, then
   3 is weirdly disappearing) ... do this for the bottom of the page
   too." The sheet that clips them is the whole window now, so house 3
   reaches up to the window's top edge and house 7 down to its foot, and
   both are still there to be seen. They used to be cut off by the edge
   of a sheet that began 80px down, under the chrome. */
test("a house two away from the front runs off the window's edge rather than stopping short of it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await bringToFront(page, 4);
  const out = await page.evaluate(() => {
    const sheet = document.getElementById("sheet").getBoundingClientRect();
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const look = (f) => {
      const r = f.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, seen: getComputedStyle(f).visibility !== "hidden" &&
        parseFloat(getComputedStyle(f).opacity) > 0.05 };
    };
    return { sheetTop: sheet.top, sheetBottom: sheet.bottom, above: look(frames[2]), below: look(frames[6]),
      tall: innerHeight, scroll: document.documentElement.scrollHeight - innerHeight };
  });
  expect(out.sheetTop, "the houses' sheet begins at the top of the window").toBeLessThanOrEqual(0.5);
  expect(out.sheetBottom, "and ends at its foot").toBeGreaterThanOrEqual(out.tall - 0.5);
  expect(out.above.seen, "house 3 is still there to be seen").toBe(true);
  expect(out.above.top, "and runs up off the top of the window").toBeLessThan(40);
  expect(out.below.seen, "house 7 is still there to be seen").toBe(true);
  expect(out.below.bottom, "and runs off its foot").toBeGreaterThan(out.tall - 20);
  expect(out.scroll, "the page itself still does not scroll").toBeLessThanOrEqual(1);
});

/* THE SPECKS THE POINTER PASSES OVER STAY LIT A MOMENT: "make there to be
   a delay of the particles turning off after you hover them". Read off
   the particles' canvas round a stretch of the axis with nothing in
   front of it: brighter with the pointer there, STILL brighter a moment
   after it has gone, and back as it was a couple of seconds later. They
   used to go out the instant the pointer left. */
test("the specks the pointer passes over stay lit a moment after it has gone", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  // Away is a corner INSIDE the window: a pointer sent outside it may
  // never be heard of again, and a speck left lit by a pointer the page
  // still thinks is there proves nothing.
  const { spot, far } = await page.evaluate(() => {
    const r = document.querySelector(".sheet-field").getBoundingClientRect();
    return { spot: { x: r.left + r.width / 2 + 30, y: 180 }, far: { x: 8, y: innerHeight - 8 } };
  });
  await page.mouse.move(far.x, far.y);
  const ink = () => page.evaluate(({ x, y }) => {
    const c = document.querySelector(".sheet-field");
    const at = c.getBoundingClientRect();
    const ratio = c.width / c.clientWidth;
    const half = Math.round(110 * ratio);
    const d = c.getContext("2d").getImageData(Math.round((x - at.left) * ratio) - half,
      Math.round((y - at.top) * ratio) - half, half * 2, half * 2).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) n += d[i];
    return n;
  }, spot);
  await page.waitForTimeout(2200);
  const away = await ink();
  await page.mouse.move(spot.x, spot.y, { steps: 3 });
  await page.waitForTimeout(500);
  const near = await ink();
  await page.mouse.move(far.x, far.y, { steps: 2 });
  await page.waitForTimeout(150);
  const after = await ink();
  await page.waitForTimeout(2600);
  const later = await ink();
  expect(near, `away ${away}, near ${near}`).toBeGreaterThan(away * 1.1);
  expect(after, `a moment after leaving: ${after}, against ${away} with the pointer away`).toBeGreaterThan(away * 1.1);
  expect(later, `and gone out again: ${later}`).toBeLessThan(after);
});

/* THE PARTICLES MOVE: specks fall down the axis and the dust turns round
   it whether or not anything is touched. */
test("the particles move on their own", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const shot = () => page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    return Array.from(c.getContext("2d").getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 === 3));
  });
  const one = await shot();
  await page.waitForTimeout(500);
  const two = await shot();
  let changed = 0;
  for (let i = 0; i < one.length; i++) if (Math.abs(one[i] - two[i]) > 30) changed++;
  expect(changed, "specks have moved between two looks").toBeGreaterThan(300);
});

/* NOTHING LEAVES THE WINDOW: at four widths down to a phone, the page
   never scrolls sideways, the front house stands whole inside the
   window, and the way round is not printed over it. */
test("the front house and the way round stay inside the window at every width", async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [1440, 1024, 800, 390]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto(SHEET);
    await waitForSheet(page);
    const out = await page.evaluate(() => {
      const f = document.querySelector(".sheet-frame.front").getBoundingClientRect();
      const n = document.querySelector(".sheet-nav").getBoundingClientRect();
      const inside = (r) => r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      const overlap = Math.min(f.right, n.right) - Math.max(f.left, n.left) > 0 &&
        Math.min(f.bottom, n.bottom) - Math.max(f.top, n.top) > 0;
      return { wide: document.documentElement.scrollWidth - innerWidth, frontInside: inside(f), navInside: inside(n), overlap };
    });
    expect(out.wide, `sideways scroll at ${width}px`).toBeLessThanOrEqual(1);
    expect(out.frontInside, `the front house at ${width}px`).toBe(true);
    expect(out.navInside, `the way round at ${width}px`).toBe(true);
    expect(out.overlap, `the way round is printed over the front house at ${width}px`).toBe(false);
  }
});

/* THE OLD STARTUP FLICK IS GONE, and so is the hang: no house is ever
   seen anywhere but on its own line out from the axis. */
test("the old startup flick is gone", async ({ page }) => {
  await page.addInitScript(() => {
    window.__flicking = false;
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet && sheet.classList.contains("flicking")) window.__flicking = true;
      if (performance.now() < 5000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  expect(await page.evaluate(() => window.__flicking), "nothing flicks").toBe(false);
  await expect(page.locator(".sheet-rail, .sheet-wire, .sheet-lines")).toHaveCount(0);
});

/* RESTING ON A HOUSE, AND ONLY RESTING — and sooner than it was. The
   owner found the wait "too long"; it is a fifth of a second now. Nothing
   in the first moment; then, within half a second, the house's own
   motifs coming up. AND NOTHING IS BLURRED, and the motifs stand BEHIND
   the houses: the owner asked for the effects not to blur anything, to
   read as the page itself answering, and to happen behind the boxes.
   For two rounds the rest of the page went out of focus. */
test("resting on a house brings its motifs after a moment, behind the houses, blurring nothing",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  // Timed in the page itself, from the pointer arriving on the house to
  // the wall going out of focus round it.
  await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const frame = document.querySelector(".sheet-frame");
    window.__entered = null;
    window.__mused = null;
    frame.addEventListener("pointerenter", () => { if (window.__entered === null) window.__entered = performance.now(); });
    new MutationObserver(() => {
      if (window.__mused === null && sheet.classList.contains("musing")) window.__mused = performance.now();
    }).observe(sheet, { attributes: true });
  });
  await pointAt(page, 0);

  await page.waitForTimeout(40);
  expect(await motifInk(page), "nothing drawn at once").toBe(0);
  await expect(page.locator("#sheet.musing")).toHaveCount(1, { timeout: 2000 });
  const waited = await page.evaluate(() => window.__mused - window.__entered);
  expect(waited, "it waits a moment").toBeGreaterThan(120);
  expect(waited, "but not long — it was 420ms and the owner found that too long").toBeLessThan(320);
  await page.waitForTimeout(1400);
  await expect(page.locator(".sheet-frame").first()).toHaveClass(/hot/);
  expect(await motifInk(page), "the house's motifs are drawn").toBeGreaterThan(40);
  const looks = await page.evaluate(() => {
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const z = (el) => { const v = parseInt(getComputedStyle(el).zIndex, 10); return Number.isNaN(v) ? 0 : v; };
    return {
      // The house beside it on the helix, which is not turned away behind
      // the axis: sharp, and as bright as it was.
      rested: getComputedStyle(frames[0]).filter, other: getComputedStyle(frames[1]).filter,
      otherShown: parseFloat(getComputedStyle(frames[1]).opacity),
      field: getComputedStyle(document.querySelector(".sheet-field")).filter,
      motifs: z(document.querySelector(".sheet-motifs")),
      lowestHouse: Math.min(...frames.map(z)),
    };
  });
  expect(looks.rested, "the house itself stays sharp").toBe("none");
  expect(looks.other, "and so does everything else").toBe("none");
  expect(looks.field, "the particles too").toBe("none");
  expect(looks.otherShown, "nothing is dimmed").toBeGreaterThan(0.6);
  expect(looks.motifs, "the motifs stand behind every house").toBeLessThan(looks.lowestHouse);
  expect(errors).toEqual([]);
});

/* THE WAY ROUND STANDS STILL while the house changes: the name under the
   count used to wrap on "Qimu & Musicians" and push the button below it
   down, and a shorter name narrowed the column. */
test("the way round does not move as the house changes", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const at = async () => ({
    up: await page.locator(".sheet-nav-step").first().boundingBox(),
    down: await page.locator(".sheet-nav-step").last().boundingBox(),
  });
  const seen = [];
  for (const key of ["Home", "ArrowDown", "ArrowDown", "End", "ArrowUp"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(900);
    seen.push(await at());
  }
  seen.forEach((one, i) => {
    for (const k of ["up", "down"]) {
      expect(Math.abs(one[k].x - seen[0][k].x), `${k} button, step ${i}`).toBeLessThan(0.5);
      expect(Math.abs(one[k].y - seen[0][k].y), `${k} button, step ${i}`).toBeLessThan(0.5);
    }
  });
});

/* THE HOUSES EITHER SIDE ARE SMALLER than the front one by more than
   depth alone — "6 and 8 to be a little smaller" — and since the night of
   2026-09-25 smaller again and FAINTER: "fade and make smaller the
   non-selected house (not hovered, but the one on which the page rests)".
   The front house is whole; the ones either side about two thirds as big
   and as strong. A house's line about itself shows only while it is
   pointed at, the front one's too. */
test("the houses either side are smaller and fainter, and a description shows only on hover", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(1200);
  const w = await page.$$eval(".sheet-frame", (all) => all.map((f) => f.getBoundingClientRect().width));
  expect(w[0] / w[1], "the one before").toBeLessThan(0.72);
  expect(w[2] / w[1], "the one after").toBeLessThan(0.72);
  expect(w[0] / w[1], "but not by much").toBeGreaterThan(0.6);
  const faint = await page.$$eval(".sheet-frame", (all) => all.slice(0, 3).map((f) => parseFloat(getComputedStyle(f).opacity)));
  expect(faint[1], "the front house whole").toBeGreaterThan(0.97);
  expect(faint[0], "the one before faded").toBeLessThan(0.75);
  expect(faint[2], "the one after faded").toBeLessThan(0.75);
  expect(faint[0], "but still there").toBeGreaterThan(0.5);
  const say = page.locator(".sheet-frame").nth(1).locator(".sheet-say");
  const shown = () => say.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(await shown(), "the front house's description is not shown on its own").toBeLessThan(0.05);
  const b = await page.locator(".sheet-frame").nth(1).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 });
  await expect.poll(shown).toBeGreaterThan(0.95);
});

/* TOMBSTONE WRITES NO NAMES. For three rounds its five names were cut into
   the wall while it was rested on — each once, off the houses and apart
   from each other. The owner, the night of 2026-09-25: "Remove the names
   of the fragrances that pop up with the tombstone hover". Read off every
   word the motifs' canvas is asked to write while Tombstone is rested on:
   none — and its roots and flowers still come. */
test("Tombstone's motifs write no names, and still grow their roots", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__written = [];
    const own = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text) {
      if (this.canvas.classList.contains("sheet-motifs")) window.__written.push(String(text));
      return own.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 7);
  await page.waitForTimeout(5000);
  const out = await page.evaluate(() => ({ written: window.__written.slice(0, 5), census: window.HouseMotifs.census() }));
  expect(out.written, "nothing written on the wall").toEqual([]);
  expect(out.census.epitaph, "no epitaphs").toBeUndefined();
  expect(out.census.roots, "the roots still come").toBeGreaterThan(0);
});

/* ATARAXIA'S BANDS, EMPHASISED: "emphasize the ataraxia effect". Read off
   the motifs' canvas once the bands have gathered — before, a few grey
   threads put ink on about half a percent of it. */
test("Ataraxia's bands cross the page strongly", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 3);
  await page.waitForTimeout(3500);
  const ink = await page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0, dark = 0;
    for (let i = 3; i < d.length; i += 4) { if (d[i] > 20) n++; if (d[i] > 120) dark++; }
    return { share: n / (d.length / 4), dark: dark / (d.length / 4) };
  });
  expect(ink.share, "ink across the page").toBeGreaterThan(0.02);
  expect(ink.dark, "and a good deal of it strong").toBeGreaterThan(0.005);
});

/* ATARAXIA'S BANDS ARE PLAIN PARTICLES ON A WAVE. "the shadows of the
   particles look really ugly, please undo that. maybe give them a
   wavelike quality, where they cause vibrations around them. Make the
   particles just particles otherwise, quite uncomplicated." Read off
   what the motifs' canvas is asked to draw: no shadow laid down (the
   shadows were a canvas drawn back once per band), no round motes, no
   stroke at all, and every speck a small square; the bands few at once;
   and the specks MOVING — a band that stood still with only its light
   travelling would draw its specks in the same places frame after
   frame. */
test("Ataraxia's bands are plain particles on a wave, with no shadows", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__watch = false;
    window.__seen = { images: 0, arcs: 0, strokes: 0, rects: 0, biggest: 0 };
    window.__frames = [];
    const P = CanvasRenderingContext2D.prototype;
    const on = (c) => window.__watch && c.canvas.classList.contains("sheet-motifs");
    const drawImage = P.drawImage, arc = P.arc, stroke = P.stroke, fillRect = P.fillRect;
    P.drawImage = function () { if (on(this)) window.__seen.images++; return drawImage.apply(this, arguments); };
    P.arc = function () { if (on(this)) window.__seen.arcs++; return arc.apply(this, arguments); };
    P.stroke = function () { if (on(this)) window.__seen.strokes++; return stroke.apply(this, arguments); };
    P.fillRect = function (x, y, w) {
      if (on(this)) {
        window.__seen.rects++;
        window.__seen.biggest = Math.max(window.__seen.biggest, w);
        const f = window.__frames[window.__frames.length - 1];
        if (f && f.length < 400) f.push(Math.round(x * 10) + "," + Math.round(y * 10));
      }
      return fillRect.apply(this, arguments);
    };
    const tick = () => { if (window.__watch) window.__frames.push([]); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 3);
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__watch = true; });
  let most = 0;
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(500);
    most = Math.max(most, (await page.evaluate(() => window.HouseMotifs.census().band || 0)));
  }
  const out = await page.evaluate(() => {
    window.__watch = false;
    const full = window.__frames.filter((f) => f.length === 400);
    // Of the first specks drawn in one frame, how many are drawn in the
    // same place in the next.
    let same = 0, pairs = 0;
    for (let i = 1; i < full.length; i++) {
      const before = new Set(full[i - 1]);
      full[i].forEach((p) => { pairs++; if (before.has(p)) same++; });
    }
    return { ...window.__seen, still: same / Math.max(1, pairs), frames: full.length };
  });
  expect(out.rects, "specks were drawn").toBeGreaterThan(10000);
  expect(out.images, "no shadow laid down").toBe(0);
  expect(out.arcs, "no round motes").toBe(0);
  expect(out.strokes, "nothing stroked").toBe(0);
  expect(out.biggest, "every speck a small square").toBeLessThanOrEqual(3);
  expect(most, "bands on the page at once").toBeLessThanOrEqual(7);
  expect(most, "but more than two").toBeGreaterThan(2);
  expect(out.frames, "frames read").toBeGreaterThan(30);
  expect(out.still, "specks drawn where they were the frame before").toBeLessThan(0.5);
});

/* TOMBSTONE'S PETALS FALL AND GATHER. "I want some of the red petals to
   fall, and then not be removed Unless hovered away, so that if you keep
   hovering tombstone, then the red petals will eventually be collected
   on the ground." And "make the things truly grow from the top top": a
   root from the top starts at the window's very edge, not under the
   chrome's band. Read off the motifs' canvas: the red petals drawn along
   its foot, the same ones still there later, all of them gone once the
   house is left; and where the roots begin. */
test("Tombstone's petals fall and gather on the ground until the house is left, and roots grow from the very top", async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.__frame = 0;
    window.__petals = {};
    window.__rootTop = Infinity;
    const tick = () => { window.__frame++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const P = CanvasRenderingContext2D.prototype;
    const ellipse = P.ellipse;
    // A fallen petal is drawn 3.1px across; the petals of a flower at a
    // root's tip are 2.8 at most, and come and go with their root.
    P.ellipse = function (x, y, across) {
      if (this.canvas.classList.contains("sheet-motifs") && across > 2.9 && /155, ?43, ?43|#9b2b2b/.test(this.fillStyle)) {
        (window.__petals[window.__frame] = window.__petals[window.__frame] || []).push([x, y]);
      }
      return ellipse.apply(this, arguments);
    };
    // A root is drawn a segment at a time, moveTo then lineTo. One coming
    // in from the top has a segment AT the top edge heading DOWN into the
    // window — a root from the side that wanders up past the edge is
    // heading the other way.
    const moveTo = P.moveTo, lineTo = P.lineTo;
    let from = null;
    P.moveTo = function (x, y) {
      from = [x, y];
      return moveTo.apply(this, arguments);
    };
    P.lineTo = function (x, y) {
      if (from && from[1] < 1 && y > from[1] && this.canvas.classList.contains("sheet-motifs") &&
          /92, ?70, ?52|#5c4634/.test(this.strokeStyle)) {
        window.__rootTop = Math.min(window.__rootTop, from[1]);
      }
      return lineTo.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 7);
  // What lies along the foot of the window in the latest frame drawn.
  const grounded = () => page.evaluate(() => {
    const keys = Object.keys(window.__petals).map(Number);
    const last = window.__petals[Math.max(...keys)] || [];
    return last.filter(([, y]) => y > innerHeight - 24).length;
  });
  await page.waitForTimeout(22000);
  const first = await grounded();
  await page.waitForTimeout(6000);
  const later = await grounded();
  const top = await page.evaluate(() => window.__rootTop);
  expect(first, "petals lying on the ground").toBeGreaterThan(12);
  expect(later, "and still there, with more come").toBeGreaterThanOrEqual(first + 5);
  expect(top, "a root grows down from the very top of the window").toBeLessThan(1);
  // Left, and they go with everything else.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(2600);
  const after = await page.evaluate(() => {
    const now = window.__frame;
    return (window.__petals[now] || window.__petals[now - 1] || []).length;
  });
  expect(after, "gone once the house is left").toBe(0);
});

/* THE FRONT HOUSE'S CORNERS. "there is a spinning particle circle behind
   the house being shown, that is not a really aesthetic as it is hidden
   behind the square. I want you to replace it with something." A ring
   round a box runs under the box's corners; four brackets of specks
   standing just outside the picture AND its label are never under
   anything. Read off the particles' canvas at the four corners, against
   the same point further out. */
test("the front house is marked by four corners standing clear of it and its label", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(600);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const at = c.getBoundingClientRect();
    const ratio = c.width / c.clientWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const front = document.querySelector(".sheet-frame.front");
    const box = [front, front.querySelector(".sheet-caption"), front.querySelector(".sheet-number")]
      .map((el) => el.getBoundingClientRect())
      .reduce((u, r) => ({ l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) }),
        { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity });
    // Ink in a small square round a point on the window.
    const ink = (x, y) => {
      let n = 0;
      for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
        const px = Math.round((x - at.left + dx) * ratio), py = Math.round((y - at.top + dy) * ratio);
        if (px < 0 || py < 0 || px >= c.width || py >= c.height) continue;
        if (d[(py * c.width + px) * 4 + 3] > 60) n++;
      }
      return n;
    };
    const corners = [[box.l, box.t, -1, -1], [box.r, box.t, 1, -1], [box.l, box.b, -1, 1], [box.r, box.b, 1, 1]];
    return corners.map(([x, y, sx, sy]) => ({ on: ink(x + sx * 16, y + sy * 16), off: ink(x + sx * 60, y + sy * 60) }));
  });
  out.forEach((one, i) => {
    expect(one.on, `corner ${i + 1} is drawn`).toBeGreaterThan(8);
    expect(one.on, `and is more than the ground around it`).toBeGreaterThan(one.off * 2);
  });
});

/* THE AXIS, QUIETER. It was made a firm line with a soft light either side
   at "emphasize the middle part of the particles" (2026-09-24), and then
   "de emphasize the black line in the middle in SD. (especially with the
   shadow around it)" (2026-09-25, night). Read off the particles' canvas
   down the middle of the window: the line is still there the whole way
   down, but no longer dark — and next to nothing lies beside it. */
test("the axis is a quiet line, with hardly any light either side", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const ratio = c.width / c.clientWidth;
    const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const mid = Math.round((c.clientWidth / 2) * ratio);
    const alpha = (x, y) => g[(y * c.width + x) * 4 + 3];
    let there = 0, dark = 0, lit = 0, rows = 0;
    for (let y = 0; y < c.height; y += 2) {
      rows++;
      const a = Math.max(alpha(mid - 1, y), alpha(mid, y), alpha(mid + 1, y));
      if (a > 90) there++;
      if (a > 200) dark++;
      if (alpha(mid + Math.round(10 * ratio), y) > 8) lit++;
    }
    return { there: there / rows, dark: dark / rows, lit: lit / rows };
  });
  expect(out.there, "the line runs down the window").toBeGreaterThan(0.85);
  expect(out.dark, "and is no longer dark").toBeLessThan(0.2);
  expect(out.lit, "with next to nothing beside it").toBeLessThan(0.3);
});

/* THE SPOKES: "connect the fragrances to the spiral in a 3d way, so that
   the conenctions of the fragrances to the central line will move in a
   3rd dimension along with the fragrances ... make the connecting line
   particular". Read off the particles' canvas between the axis and the
   house after the front one, at that house's height: a BAND of particles
   several pixels deep rather than one dotted line, stronger towards the
   house — which stands nearer the eye than the axis does — than towards
   the axis. */
test("each house is joined to the axis by a spoke of particles standing in the helix's depth", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const read = () => page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const at = c.getBoundingClientRect();
    const ratio = c.width / c.clientWidth;
    const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const house = document.querySelectorAll(".sheet-frame")[1].getBoundingClientRect();
    const midX = at.left + c.clientWidth / 2, y0 = house.top + house.height / 2;
    const x1 = Math.min(house.left, house.right) > midX ? house.left : house.right;
    const from = Math.min(midX, x1) + 16, to = Math.max(midX, x1) - 16;
    const rowsWithInk = new Set();
    let nearHouse = 0, nearAxis = 0;
    for (let y = y0 - 14; y <= y0 + 14; y++) {
      for (let x = from; x < to; x += 1) {
        const px = Math.round((x - at.left) * ratio), py = Math.round((y - at.top) * ratio);
        const a = g[(py * c.width + px) * 4 + 3];
        if (a < 25) continue;
        rowsWithInk.add(Math.round(y));
        const q = (x - from) / (to - from);
        const towardsHouse = x1 > midX ? q : 1 - q;
        if (towardsHouse > 0.66) nearHouse += a; else if (towardsHouse < 0.34) nearAxis += a;
      }
    }
    return { rows: rowsWithInk.size, nearHouse, nearAxis, span: to - from };
  });
  const out = await read();
  expect(out.span, "room between the axis and the house").toBeGreaterThan(80);
  expect(out.rows, "a band of particles, not one line").toBeGreaterThanOrEqual(5);
  expect(out.nearHouse, "stronger towards the house, which is nearer").toBeGreaterThan(out.nearAxis);
});

/* ADAR'S WELLS KEEP APART: "make the frequency of the black hole a less by
   1/3. Also create a minimum distance of were the black holes cannot spawn
   next to each other". Watched for a while as they come and go: no two
   ever stand nearer than the least distance allowed. */
test("ADAR's wells never stand next to each other", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 1);
  let nearest = Infinity, most = 0;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    const wells = await page.evaluate(() => window.HouseMotifs.wellsAt());
    most = Math.max(most, wells.length);
    for (let a = 0; a < wells.length; a++) for (let b = a + 1; b < wells.length; b++)
      nearest = Math.min(nearest, Math.hypot(wells[a].x - wells[b].x, wells[a].y - wells[b].y));
  }
  const least = await page.evaluate(() => Math.min(innerWidth, innerHeight) * 0.55);
  expect(most, "wells came").toBeGreaterThan(0);
  expect(most, "never more than three").toBeLessThanOrEqual(3);
  if (Number.isFinite(nearest)) expect(nearest, "the nearest two ever stood").toBeGreaterThanOrEqual(least - 1);
});

/* LES ABSTRAITS: AN OLD ARMOIRE WITH IRIS AT ITS FEET, AND A DRIP. "i
   dont want it to ever turn into the actual picture ... make it something
   according to the page": an old armoire on one side with iris, feeling
   like Belle Âme, and on the other a drip from the top of the window into
   what was a puddle and is now a beaker ("I want it to fall into a beaker,
   once the beaker starts overflowing, let it drip from that too"). Read
   off the motifs' canvas: the logo never asked for and nothing drawn from
   a picture; ink on both sides of the window; something at the very top
   of it on the drip's side; the iris's violet among the colours; and the
   foot of the window on the drip's side filling while the house is rested
   on. */
test("Les Abstraits' armoire stands on one side and a drip fills a beaker on the other, and the logo never appears", async ({ page }) => {
  test.setTimeout(90000);
  const logo = [];
  page.on("request", (r) => { if (/les-abstraits-logo\.png$/.test(r.url())) logo.push(r.url()); });
  await page.addInitScript(() => {
    window.__colours = new Set();
    window.__images = 0;
    window.__words = new Set();
    const P = CanvasRenderingContext2D.prototype;
    const fillText = P.fillText;
    P.fillText = function (t) {
      if (this.canvas.classList.contains("sheet-motifs")) window.__words.add(String(t));
      return fillText.apply(this, arguments);
    };
    const drawImage = P.drawImage;
    P.drawImage = function () {
      if (this.canvas.classList.contains("sheet-motifs")) window.__images++;
      return drawImage.apply(this, arguments);
    };
    for (const key of ["fillStyle", "strokeStyle"]) {
      const d = Object.getOwnPropertyDescriptor(P, key);
      Object.defineProperty(P, key, {
        get() { return d.get.call(this); },
        set(v) {
          if (this.canvas.classList.contains("sheet-motifs")) window.__colours.add(String(v).replace(/\s+/g, "").replace(/,[\d.]+\)$/, ")"));
          d.set.call(this, v);
        },
      });
    }
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  const read = () => page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / innerWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const inkIn = (x1, x2, y1, y2) => {
      let n = 0;
      for (let y = Math.round(y1 * ratio); y < Math.round(y2 * ratio); y += 2)
        for (let x = Math.round(x1 * ratio); x < Math.round(x2 * ratio); x += 2) if (d[(y * c.width + x) * 4 + 3] > 20) n++;
      return n;
    };
    const W = innerWidth, H = innerHeight;
    // The foot: the whole height of the beaker standing there, so what is
    // measured is the liquid rising in it and spilling, not only its base.
    return { left: inkIn(0, W * 0.3, 0, H), right: inkIn(W * 0.7, W, 0, H),
      top: inkIn(W * 0.7, W, 0, 14), foot: inkIn(W * 0.7, W, H - 120, H) };
  });
  await pointAt(page, 5);
  await page.waitForTimeout(2600);
  const early = await read();
  // HALF AS FAST since the night of 2026-09-25 ("half the filling
  // speed"): twenty-four drops to the brim, so it is given longer.
  await page.waitForTimeout(18000);
  const late = await read();
  expect(logo, "the house's logo is never asked for").toEqual([]);
  expect(await page.evaluate(() => window.__images), "and no picture is drawn").toBe(0);
  expect(late.left, "the armoire on one side").toBeGreaterThan(400);
  expect(late.top, "the drip hangs from the very top of the window").toBeGreaterThan(3);
  expect(late.foot, "the beaker fills").toBeGreaterThan(early.foot * 1.3 + 20);
  // NO READING: the pointer at the surface and its number in ml were taken
  // off ("remove the triangle showing the level, and ... the number
  // displaying the volume"); the only words are the scale's own.
  const words = await page.evaluate(() => [...window.__words]);
  expect(words.filter((w) => !["50", "100", "150", "200", "ml"].includes(w)), "nothing written but the graduations").toEqual([]);
  const colours = await page.evaluate(() => [...window.__colours]);
  expect(colours.some((c) => c.startsWith("rgba(112,94,156")), `the iris, among ${colours.join(" ")}`).toBe(true);
});

/* THE ARMOIRE IN LINES, THE IRISES AT ITS FEET: "I want that to be less
   particular dense, and more geometric (and the violets should be more
   natural, anbd coming out from the legs of it, like real flowers
   would)" — and they stayed irises, Belle Âme's. It was thousands of
   specks a frame; drawn in hairlines, with a speck only at each joint and
   the orris powder, it is a couple of hundred at most, drip and all. And
   the iris's violet is at the foot of the window, where the flowers grow
   up round the legs — none of it high up, where they used to stand
   inside the open door. */
test("Les Abstraits' armoire is drawn in lines rather than specks, with irises growing at its feet", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__rects = 0;
    window.__frames = 0;
    const P = CanvasRenderingContext2D.prototype;
    const fillRect = P.fillRect;
    P.fillRect = function () {
      if (this.canvas.classList.contains("sheet-motifs")) window.__rects++;
      return fillRect.apply(this, arguments);
    };
    const tick = () => { window.__frames++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 5);
  // Built, grown and open.
  await page.waitForTimeout(6500);
  const r0 = await page.evaluate(() => [window.__rects, window.__frames]);
  await page.waitForTimeout(1000);
  const r1 = await page.evaluate(() => [window.__rects, window.__frames]);
  const perFrame = (r1[0] - r0[0]) / Math.max(1, r1[1] - r0[1]);
  expect(perFrame, "specks drawn a frame").toBeLessThan(400);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / c.getBoundingClientRect().width;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const W = innerWidth, H = innerHeight;
    const tall = Math.max(220, Math.min(H * 0.56, 420));
    // THE IRIS'S OWN COLOUR, NEARLY EXACTLY. Its petals are drawn in one
    // colour, 112, 94, 156, at different strengths, so on the motifs'
    // own transparent canvas they read back as that colour to within a
    // few units. The window was once ±30, which let in a MIX: a fading
    // speck of orris powder (150, 136, 176) swaying back over the
    // armoire's faint inside tone at the door's edge blends to about
    // (112, 101, 128) — and failed this test one run in five, on a
    // single pixel up by the door, with no iris there at all.
    const iris = (y1, y2) => {
      let n = 0;
      for (let y = Math.round(y1 * ratio); y < Math.round(y2 * ratio); y++)
        for (let x = 0; x < Math.round(W * 0.35 * ratio); x++) {
          const i = (y * c.width + x) * 4;
          if (d[i + 3] > 40 && Math.abs(d[i] - 112) < 14 && Math.abs(d[i + 1] - 94) < 14 && Math.abs(d[i + 2] - 156) < 14 && d[i + 2] > d[i] + 30) n++;
        }
      return n;
    };
    return { low: iris(H * 0.72, H), high: iris(H - tall, H - tall * 0.62) };
  });
  expect(out.low, "irises at the foot of the window").toBeGreaterThan(20);
  expect(out.high, "and none up where the door is").toBe(0);
});

/* THE ARMOIRE HAS CLOTHES IN IT: "also put folded clothes and hangers
   with something on it in the armoire" (2026-09-25, night). Read off the
   motifs' canvas inside the open half of the armoire, which was a faint
   tone and a few hairlines: the clothes are drawn solid over it — hung
   from the rail in the upper part, and folded on the shelf and the floor
   of it below. */
test("Les Abstraits' armoire has clothes on hangers and folded on its shelf", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 5);
  await page.waitForTimeout(4500);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / c.getBoundingClientRect().width;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const W = innerWidth, H = innerHeight;
    // Where armoire() stands it, in the same numbers.
    const tall = Math.max(220, Math.min(H * 0.56, 420)), wide = tall * 0.5;
    const baseY = H - Math.max(18, H * 0.04), left = Math.max(14, W * 0.1 - wide / 2);
    const legH = tall * 0.13, body = tall * 0.72, drawerH = body * 0.13;
    const doorTop = -(legH + body) + 8, doorBot = -legH - drawerH - 5;
    const bT = doorTop + 10, bB = doorBot - 7, shelfY = bT + (bB - bT) * 0.7;
    const x1 = left + wide / 2 + 14, x2 = left + wide - 14;
    const solid = (ya, yb) => {
      let n = 0;
      for (let y = Math.round((baseY + ya) * ratio); y < Math.round((baseY + yb) * ratio); y++)
        for (let x = Math.round(x1 * ratio); x < Math.round(x2 * ratio); x++) if (d[(y * c.width + x) * 4 + 3] > 200) n++;
      return n / (ratio * ratio);
    };
    return { hung: solid(doorTop + 30, shelfY - 40), folded: solid(shelfY - 26, doorBot) };
  });
  expect(out.hung, "clothes hung from the rail").toBeGreaterThan(1200);
  expect(out.folded, "and folded on the shelf and the floor of it").toBeGreaterThan(500);
});

/* ADAR'S BLACK HOLES: "make the waves of the dots that form from the
   hover of adar larger, and distortive of the page. Where they appear,
   let them have a black hole effect on anything they touch." While ADAR
   is rested on, the motifs hand the Houses view a field it draws itself
   through: somewhere on the window a point is drawn well in towards a
   hole, and the field reaches much further than the soundings' 150px
   rings did. A house a well comes near is turned in it; the one under
   the pointer is left exactly where it is. And leaving ADAR puts the
   page back as it was. */
test("ADAR's wells bend the page towards them, and let it go again", async ({ page }) => {
  test.setTimeout(90000);
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 1);
  await page.waitForTimeout(3200);
  const out = await page.evaluate(() => {
    const bend = window.HouseMotifs.bend();
    if (!bend) return null;
    let most = 0, mx = 0, my = 0;
    const moved = [];
    for (let y = 80; y < innerHeight; y += 16) for (let x = 0; x < innerWidth; x += 16) {
      const p = bend(x, y);
      const m = Math.hypot(p.x - x, p.y - y);
      if (m > 1.5) moved.push([x, y]);
      if (m > most) { most = m; mx = x; my = y; }
    }
    const reach = Math.max(0, ...moved.map(([x, y]) => Math.hypot(x - mx, y - my)));
    return { most, reach };
  });
  expect(out, "a field while ADAR is rested on").not.toBeNull();
  expect(out.most, "something drawn well in towards a hole").toBeGreaterThan(20);
  expect(out.reach, "and reaching far past where the soundings rang").toBeGreaterThan(200);
  // THE HOUSES. A well lands where it will, and one far from every house
  // touches none — so this watches for a while, until one has come near
  // a house: every house the field reaches is turned in it, and the one
  // under the pointer never is.
  let turned = 0, hotTurned = false;
  for (let i = 0; i < 30 && !turned; i++) {
    const r = await page.evaluate(() => {
      const bend = window.HouseMotifs.bend();
      const hot = document.querySelector(".sheet-frame.hot");
      let n = 0;
      [...document.querySelectorAll(".sheet-frame:not(.hot)")].forEach((f) => {
        if (/rotate/.test(f.style.transform)) n++;
      });
      return { n, hot: /rotate/.test(hot.style.transform), any: !!bend };
    });
    turned = r.n;
    hotTurned = hotTurned || r.hot;
    if (!turned) await page.waitForTimeout(400);
  }
  expect(turned, "the houses round a well turned in it").toBeGreaterThan(0);
  expect(hotTurned, "and never the one under the pointer").toBe(false);
  await page.mouse.move(5, 300, { steps: 3 });
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({ bend: !!window.HouseMotifs.bend(),
    turned: [...document.querySelectorAll(".sheet-frame")].filter((f) => /rotate/.test(f.style.transform)).length }));
  expect(after.bend, "no field once ADAR has been left").toBe(false);
  expect(after.turned, "and every house as it was").toBe(0);
  expect(errors).toEqual([]);
});

/* QIMU & MUSICIANS KEPT QUIET: "more subtle and way less movement".
   Read off what the motifs' canvas is asked to draw: nothing in a colour
   stronger than half its strength, and every note head drawn where it
   was put — a note that drifted was drawn somewhere new every frame. */
test("Qimu & Musicians' motifs are faint and their notes stay where they are put", async ({ page }) => {
  await page.addInitScript(() => {
    window.__heads = [];
    window.__strongest = 0;
    window.__watch = false;
    const P = CanvasRenderingContext2D.prototype;
    const ellipse = P.ellipse;
    P.ellipse = function (x, y) {
      if (window.__watch && this.canvas.classList.contains("sheet-motifs")) window.__heads.push([x, y]);
      return ellipse.apply(this, arguments);
    };
    for (const key of ["fillStyle", "strokeStyle"]) {
      const d = Object.getOwnPropertyDescriptor(P, key);
      Object.defineProperty(P, key, {
        get() { return d.get.call(this); },
        set(v) {
          if (window.__watch && this.canvas.classList.contains("sheet-motifs")) {
            const m = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(String(v));
            if (m) window.__strongest = Math.max(window.__strongest, parseFloat(m[1]));
          }
          d.set.call(this, v);
        },
      });
    }
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 8);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__watch = true; });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    window.__watch = false;
    const places = new Set(window.__heads.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)));
    return { heads: window.__heads.length, places: places.size, strongest: window.__strongest };
  });
  expect(out.heads, "notes are drawn").toBeGreaterThan(20);
  expect(out.strongest, "nothing drawn stronger than a third").toBeLessThanOrEqual(0.32);
  // A few new notes arrive in a second and a half; a drifting note would
  // add a new place on every frame it is drawn.
  expect(out.places, `${out.places} places for ${out.heads} heads drawn`).toBeLessThan(out.heads / 5);
});

/* GRANDE PARFUMS' PARTICLES RISE AND BURST. It was bubbles — rings that
   rose and popped — and the owner asked for "particles, not bubbles
   bubbles": particles "that rise up and pop more or less into a bunch
   of other smaller particles". Read off the motifs' canvas: no ring
   stroked at all, twice as many particles standing as the old drift's
   320, and the smaller specks of the bursts among them. */
test("Grande Parfums' particles rise and burst into smaller ones, twice as many as the drift", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__strokes = 0;
    window.__small = 0;
    window.__whole = 0;
    const P = CanvasRenderingContext2D.prototype;
    const stroke = P.stroke, fillRect = P.fillRect;
    P.stroke = function () {
      if (this.canvas.classList.contains("sheet-motifs")) window.__strokes++;
      return stroke.apply(this, arguments);
    };
    P.fillRect = function (x, y, w) {
      if (this.canvas.classList.contains("sheet-motifs")) { if (w <= 1.0) window.__small++; else window.__whole++; }
      return fillRect.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 4);
  await page.waitForTimeout(8500);
  const out = await page.evaluate(() => ({ standing: (window.HouseMotifs.census().rise || 0),
    strokes: window.__strokes, small: window.__small, whole: window.__whole }));
  expect(out.standing, "particles on the page at once — the drift was 320 at most").toBeGreaterThan(420);
  expect(out.strokes, "no ring drawn: particles, not bubbles").toBe(0);
  expect(out.whole, "the particles").toBeGreaterThan(10000);
  expect(out.small, "and the smaller ones they burst into").toBeGreaterThan(1000);
});

/* ALMOST HUMAN'S FIGURES ARE CLOUDS THAT GLITCH INTO BEING. First they
   were asked to glitch "into existence and then after a brief delay
   glitching out"; then the band-slicing glitch that did it was "mid",
   and the figure itself should be "made of particles ... the look of a
   cloudy human (unclear and blurry), that kinda glitches then appears".
   Read off what the motifs' canvas is asked to draw: each figure is
   hundreds of specks; while it glitches in, a red and a cyan copy of it
   stand to either side (its colour out of register) — and once it has
   arrived they are gone, so over a long rest the split is some of what
   is drawn and never most of it. */
test("Almost Human's figures are clouds of specks that glitch in and then stand", async ({ page }) => {
  await page.addInitScript(() => {
    window.__frame = 0;
    window.__fig = {};
    const tick = () => { window.__frame++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const P = CanvasRenderingContext2D.prototype;
    const d = Object.getOwnPropertyDescriptor(P, "fillStyle");
    Object.defineProperty(P, "fillStyle", {
      get() { return d.get.call(this); },
      set(v) { if (this.canvas.classList.contains("sheet-motifs")) this.__tone = String(v).replace(/\s+/g, ""); d.set.call(this, v); },
    });
    const fillRect = P.fillRect;
    P.fillRect = function (x, y, w, h) {
      if (this.canvas.classList.contains("sheet-motifs") && this.__tone && w > 1.05 && w === h) {
        const f = (window.__fig[window.__frame] = window.__fig[window.__frame] || { body: 0, split: 0 });
        if (/^rgba\(210,48,70|^rgba\(0,150,196/.test(this.__tone)) f.split++;
        else if (/^rgba\(23,23,15/.test(this.__tone)) f.body++;
      }
      return fillRect.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 2);
  await page.waitForTimeout(7000);
  const out = await page.evaluate(() => {
    const frames = Object.values(window.__fig).filter((f) => f.body > 0);
    const body = frames.reduce((n, f) => n + f.body, 0), split = frames.reduce((n, f) => n + f.split, 0);
    return { frames: frames.length, share: split / Math.max(1, body), perFrame: body / Math.max(1, frames.length),
      figures: window.HouseMotifs.census().figure || 0 };
  });
  expect(out.frames, "figures were drawn").toBeGreaterThan(60);
  expect(out.perFrame, "each figure a cloud of hundreds of specks").toBeGreaterThan(300);
  expect(out.share, "their colour comes apart as they glitch in").toBeGreaterThan(0.04);
  expect(out.share, "and they stand whole once they have").toBeLessThan(0.9);
});

/* QIMU & MUSICIANS IS COMPLEX, AND PLAIN. First "make it complex, I
   dont want it to be just a simple 4/4 rhythm with a note here and
   there ... sometimes they are in the 5 line grid, while othertimes it
   is just complex notes popping up spontaneously"; then "remove all the
   dynamic elements of the compositions, such as the trills and
   whatnot". Read off everything the motifs' canvas is asked to write:
   times other than 4/4, and NOTHING written but numbers — no dynamics,
   no "tr", no tempo words; dozens of noteheads at once; staves first
   and no loose music; and later, loose passages popping up with no
   stave of their own. */
test("Qimu & Musicians' music is complex, with no dynamics or ornaments, on staves and then loose", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__frame = 0;
    window.__texts = new Set();
    window.__heads = {};
    const tick = () => { window.__frame++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const P = CanvasRenderingContext2D.prototype;
    const fillText = P.fillText, ellipse = P.ellipse;
    P.fillText = function (t) {
      if (this.canvas.classList.contains("sheet-motifs")) window.__texts.add(String(t));
      return fillText.apply(this, arguments);
    };
    P.ellipse = function () {
      if (this.canvas.classList.contains("sheet-motifs")) window.__heads[window.__frame] = (window.__heads[window.__frame] || 0) + 1;
      return ellipse.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 8);
  await page.waitForTimeout(4500);
  const first = await page.evaluate(() => ({
    texts: [...window.__texts], most: Math.max(0, ...Object.values(window.__heads)), census: window.HouseMotifs.census(),
  }));
  const times = first.texts.filter((t) => /^\d+$/.test(t));
  expect(times.some((t) => t !== "4" && t !== "3" && t !== "6"), `times other than 4/4: ${times.join(" ")}`).toBe(true);
  expect(first.texts.filter((t) => !/^\d+$/.test(t)), "nothing written but numbers").toEqual([]);
  expect(first.most, "dozens of noteheads written at once").toBeGreaterThan(24);
  expect(first.census.stave || 0, "staves first").toBeGreaterThan(0);
  expect(first.census.passage || 0, "and no loose music yet").toBe(0);
  await page.waitForTimeout(7000);
  const later = await page.evaluate(() => window.HouseMotifs.census());
  expect(later.passage || 0, "then music popping up with no stave").toBeGreaterThan(0);
});

/* CROSSING THE WALL SETS NOTHING OFF. The pointer passing over house
   after house on its way somewhere else must not start any of them.

   HOW LONG THE POINTER WAS ACTUALLY ON EACH HOUSE IS MEASURED IN THE
   PAGE, not assumed. This test used to sweep and then ask only whether
   anything had been set off at all — and on a busy machine the sweep
   itself sometimes stayed on a house for more than the 200ms wait, so
   the page did exactly what it should and the test failed. It could
   not tell a slow sweep from a page that sets houses off too soon. Now
   every visit is timed from its pointerenter to its pointerleave, and
   the rule is: a visit shorter than the wait never sets anything off.
   A visit longer than it may, because that is a rest. The sweep has to
   produce enough short visits for that to mean something. */
test("passing over the houses does not set their motifs off", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    window.__visits = [];
    let open = null;
    document.querySelectorAll(".sheet-frame").forEach((frame, i) => {
      frame.addEventListener("pointerenter", () => {
        open = { i: i, from: performance.now(), to: null, mused: false };
        window.__visits.push(open);
      });
      frame.addEventListener("pointerleave", () => { if (open && open.i === i) { open.to = performance.now(); open = null; } });
    });
    new MutationObserver(() => {
      if (sheet.classList.contains("musing") && open) open.mused = true;
    }).observe(sheet, { attributes: true });
  });
  // Only the houses that can be seen — on the helix most of them are
  // turned away or off the window — crossed back and forth three times.
  const boxes = await page.$$eval(".sheet-frame", (all) => all.filter((f) =>
    getComputedStyle(f).visibility !== "hidden" && parseFloat(getComputedStyle(f).opacity) > 0.3).map((f) => {
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: Math.min(innerHeight - 20, Math.max(80, r.top + r.height / 2)) };
  }));
  await page.mouse.move(8, 880);
  for (let pass = 0; pass < 3; pass++) {
    for (const b of (pass % 2 ? [...boxes].reverse() : boxes)) await page.mouse.move(b.x, b.y);
    await page.mouse.move(8, 880);
  }
  await page.waitForTimeout(700);
  const visits = await page.evaluate(() => window.__visits.map((v) => ({
    house: v.i + 1, long: v.to === null ? Infinity : Math.round(v.to - v.from), mused: v.mused,
  })));
  const short = visits.filter((v) => v.long < 180);
  expect(short.length, `the sweep should cross most houses quickly: ${JSON.stringify(visits)}`)
    .toBeGreaterThanOrEqual(5);
  expect(short.filter((v) => v.mused), "no house passed over quickly should have been set off").toEqual([]);
  expect(await page.locator("#sheet.musing").count(), "and nothing is left set off").toBe(0);
});

/* THEY FADE, THEY DO NOT VANISH. "when you unhover, the motifs fade
   gradually, they dont disappear." A moment after leaving there is
   still some of them; a little later there is none. */
test("leaving a house lets its motifs fade rather than vanish", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 4);
  await page.waitForTimeout(2600);
  const full = await motifInk(page);
  expect(full, "something to fade").toBeGreaterThan(40);

  await page.mouse.move(8, 880, { steps: 2 });
  await page.waitForTimeout(350);
  expect(await page.locator("#sheet.musing").count(), "the page comes back into focus").toBe(0);
  const fading = await motifInk(page);
  expect(fading, "a moment after leaving, the motifs are still there").toBeGreaterThan(10);
  await page.waitForTimeout(2600);
  expect(await motifInk(page), "and a little later they have gone").toBe(0);
});

/* EVERY HOUSE HAS MOTIFS OF ITS OWN, and each of them draws. */
test("every house on the wall has motifs of its own, and they draw", async ({ page }) => {
  test.setTimeout(90000);
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  const keys = await page.$$eval(".sheet-frame", (all) => all.map((f) => f.dataset.motif));
  expect(new Set(keys).size, "a different set for every house").toBe(keys.length);
  for (let i = 0; i < keys.length; i++) {
    await page.mouse.move(4, 890);
    await page.waitForTimeout(1900);
    await pointAt(page, i);
    await page.waitForTimeout(2200);
    expect(await motifInk(page), `${keys[i]} should draw something`).toBeGreaterThan(20);
  }
  expect(errors).toEqual([]);
});

/* QIMU & MUSICIANS IS STAVES, SHORT ONES. "make it so that it is 5 lines
   like music sheets, and add ephemeral notes to that" — and then "make
   it shorter lines, so it dosnt span across the entire page". Read off
   the motifs' own canvas: somewhere on it there are five level lines,
   evenly spaced — a stave — and ink that is not those lines, which is
   the notes; and no line anywhere on it runs half the window's width. */
test("Qimu & Musicians' motifs are short five-line staves with notes on them", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 8);
  await page.waitForTimeout(3200);
  // Read until a stave has been written out — under a loaded machine the
  // first ones can still be on their way at any one moment.
  const look = () => page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / innerWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const w = c.width;
    const long = [];
    let longest = 0;
    for (let y = 0; y < c.height; y++) {
      let run = 0, best = 0;
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 12) { run++; if (run > best) best = run; } else run = 0;
      }
      longest = Math.max(longest, best);
      if (best > 140 * ratio) long.push(Math.round(y / ratio));
    }
    // Rows next to each other are one line drawn a pixel thick.
    const lines = long.filter((y, i) => i === 0 || y - long[i - 1] > 2);
    let staves = 0;
    for (let i = 0; i + 4 < lines.length; i++) {
      const gaps = [1, 2, 3, 4].map((k) => lines[i + k] - lines[i + k - 1]);
      if (gaps.every((g) => Math.abs(g - gaps[0]) <= 1.5 && g > 4 && g < 14)) staves++;
    }
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 12) ink++;
    return { staves, ink, lineInk: long.length * 140 * ratio, longest: longest / ratio, width: innerWidth };
  });
  let read = await look();
  for (let i = 0; i < 12 && !read.staves; i++) { await page.waitForTimeout(400); read = await look(); }
  expect(read.staves, "at least one stave of five even lines").toBeGreaterThan(0);
  expect(read.ink, "and notes on it besides the lines").toBeGreaterThan(read.lineInk);
  expect(read.longest, "no line across half the window").toBeLessThan(read.width * 0.5);
});

/* PRESSING A HOUSE does not cut to it: the page steps back first, and
   only then is the house opened. */
test("pressing a house steps the page back before opening it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  // Brought to the front first: a house at the side is brought round
  // rather than opened.
  await bringToFront(page, 7);
  const target = page.locator(".sheet-frame").nth(7);
  const b = await target.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator("body.sheet-leaving")).toHaveCount(1);
  await page.waitForTimeout(200);
  expect(page.url(), "still here a moment after the press").toMatch(/scent-descriptions/);
  const leaving = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelectorAll(".sheet-frame")[6]).opacity));
  expect(leaving, "the rest of the page is on its way out").toBeLessThan(0.9);
  await page.waitForURL(/houses\/tombstone\.html/, { timeout: 4000 });
});

// The page carries no title any more; the heading stays in the markup
// for anything reading the page rather than looking at it.
test("the heading is there for a reader, and out of sight for a looker", async ({ page }) => {
  await page.goto(SHEET);
  await expect(page.locator(".sheet-head h1")).toHaveText("Scent descriptions");
  const box = await page.locator(".sheet-head h1").boundingBox();
  expect(box.width, "it should not be taking up the page").toBeLessThan(3);
});

// Regression test: the page grows a lot taller the moment the sheet
// lands. On a browser with ordinary scrollbars that made one appear,
// which took 15px off the width and shifted everything centred on the
// page sideways at exactly the moment the sheet landed — the whole
// thing looked like it twitched. Room is kept for the scrollbar from
// the start, so nothing moves.
test("nothing shifts sideways when the page grows", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForTimeout(400);

  const searchAt = () =>
    page.locator(".sheet-search").evaluate((el) => el.getBoundingClientRect().left);
  const before = await searchAt();

  await waitForSheet(page);
  expect(Math.abs((await searchAt()) - before), "the chrome should not move").toBeLessThan(1);

  const gutter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollbarGutter);
  expect(gutter, "the room for the scrollbar is what keeps them still").toContain("stable");
});


test("every picture is still a link to a piece", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const hrefs = await page.$$eval(".sheet-frame", (frames) => frames.map((f) => f.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  hrefs.forEach((href) => expect(href, "a frame with nowhere to go is not a piece").toBeTruthy());
});


test("the category names itself once the page has drawn itself", async ({ page }) => {
  await page.goto(SHEET);

  // The two buttons are back, and named for what this category is
  // actually two of now: the Houses — the sheet itself — and the
  // Fragrances, an index of everything written up on it.
  // (The REGISTER those buttons used to switch to is still gone: no
  // gallery entries live on this page any more, they are the
  // chamber's.)
  await expect(page.locator(".sheet-filter")).toHaveCount(2);
  await expect(page.locator(".sheet-filter")).toHaveText(["Houses", "Fragrances"]);
  await expect(page.locator(".gallery-entry")).toHaveCount(0);

  const name = page.locator(".sheet-where");
  await expect(name).toHaveText("Scent descriptions");
  const showingName = () =>
    page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".sheet-where")).opacity));

  // Not there while the chain is still drawing itself.
  expect(await showingName()).toBeLessThan(0.05);

  await waitForSheet(page);
  await expect.poll(showingName, { timeout: 6000 }).toBeGreaterThan(0.9);

  // It stands up at the top of the page beside the Menu, rather than
  // in the page.
  const where = await page.evaluate(() => {
    const box = document.querySelector(".sheet-where").getBoundingClientRect();
    return { fixed: getComputedStyle(document.querySelector(".sheet-where")).position,
             top: box.top, left: box.left };
  });
  expect(where.fixed).toBe("fixed");
  expect(where.top, "up at the top of the page").toBeLessThan(70);
  expect(where.left, "beside the Menu, on the left").toBeLessThan(220);
});

// The number in the corner belongs to the frame, not to the placeholder
// drawn inside it: putting a real picture in takes the hatching away and
// must leave the number where it is.
test("a frame keeps its number once it has a picture in it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const numbered = await page.evaluate(() => {
    const frame = document.querySelectorAll(".sheet-frame")[2];
    const picture = document.createElement("img");
    // A one-pixel picture, so nothing has to be fetched for this.
    picture.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    frame.insertBefore(picture, frame.firstChild);
    const mark = frame.querySelector(".sheet-number");
    const style = getComputedStyle(frame);
    return {
      text: mark.textContent,
      showing: getComputedStyle(mark).visibility !== "hidden" &&
               parseFloat(getComputedStyle(mark).opacity) > 0.5,
      hatchingGone: style.backgroundImage === "none",
    };
  });

  expect(numbered.text, "the number should still say which frame this is").toBe("03");
  expect(numbered.showing, "and should still be visible over the picture").toBe(true);
  expect(numbered.hatchingGone, "the placeholder hatching should be gone").toBe(true);
});


test("the search finds a picture by what it is called", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const field = page.locator(".sheet-search-field");
  await expect(field).toBeHidden(); // a button until it is asked for

  await page.locator(".sheet-search-trigger").click();
  await expect(field).toBeVisible();

  await field.fill("adar");
  // One picture is called that; everything else steps back.
  const dimmed = await page.$$eval(".sheet-frame.dimmed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(dimmed, "everything that doesn't match should step back").toBe(frames - 1);
  await expect(page.locator(".sheet-frame:not(.dimmed) .sheet-caption")).toHaveText(
    "ADAR The House That You Have Never Heard Of"
  );

  // Escape clears it and puts the sheet back.
  await field.press("Escape");
  expect(await page.$$eval(".sheet-frame.dimmed", (els) => els.length)).toBe(0);
  await expect(field).toBeHidden();
});

test("with animation turned off it goes straight to the finished sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHEET);

  // Nothing to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
});


test("the page never shows its own contents before the sheet takes over",
  async ({ page }) => {
  // A REGRESSION TEST, and a deterministic one: the page records what
  // it looked like on every frame rather than the test trying to catch
  // the right moment. Between the first paint and contact-sheet.js
  // taking over, the browser used to show the page as it is written —
  // every picture in a plain grid — and then have all of it swept
  // away, which reads as the page blinking its whole contents at you
  // before it starts.
  await page.addInitScript(() => {
    window.__flashed = 0;
    window.__placed = null;
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet) {
        const seen = [...document.querySelectorAll(".sheet-frame")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.width > 4 && box.height > 4 &&
                   getComputedStyle(el).visibility === "visible" &&
                   parseFloat(getComputedStyle(el).opacity) > 0.02;
          });
        if (!sheet.classList.contains("scripted")) {
          if (seen.length > window.__flashed) window.__flashed = seen.length;
        } else if (window.__placed === null) {
          // Where the picture it lands on was on the very first frame
          // the script had drawn: that is where it should stay.
          const plate = document.querySelector(".sheet-frame");
          window.__placed = plate ? plate.getBoundingClientRect().x : null;
        }
      }
      if (performance.now() < 5000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  await page.goto(SHEET);
  await waitForSheet(page);

  expect(await page.evaluate(() => window.__flashed),
    "nothing of the page's own contents should be shown before the script has laid it out")
    .toBe(0);

  // And the pictures are PLACED by that first layout rather than
  // sliding into place from the corner of the sheet, which is what the
  // transition that moves them did to every one of them on arrival.
  const placed = await page.evaluate(() => window.__placed);
  const settled = (await page.locator(".sheet-frame").first().boundingBox()).x;
  expect(Math.abs(placed - settled),
    `the plate was first drawn at ${placed} and settled at ${settled}`).toBeLessThan(12);
});

test("without its script the page is still the plain grid of pictures",
  async ({ page }) => {
  // The holding-back above must not be able to hide the page for good:
  // with the script blocked, what is written in the page IS the page,
  // and it comes back as soon as everything else has loaded.
  await page.route("**/contact-sheet.js", (route) => route.abort());
  await page.goto(SHEET);
  const frames = page.locator(".sheet-frame");
  await expect(frames.first()).toBeVisible({ timeout: 6000 });
  expect(await frames.count()).toBeGreaterThan(4);
  await expect(page.locator(".sheet-head h1")).toHaveText("Scent descriptions");
});

