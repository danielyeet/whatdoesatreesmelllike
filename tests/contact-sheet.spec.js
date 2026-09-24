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
// travelling actually travelling, the particles moving, nothing leaving
// the window, the motifs waiting before they come and fading when they
// go, and the old startup flick staying gone.
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

/* THE HOUSES COME OUT OF THE AXIS as the page arrives, the front one
   first and the rest after it, nearest first — not all at once. */
test("the houses come out of the axis one after another, nearest first", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cameAt = [];
    const t0 = performance.now();
    const watch = () => {
      document.querySelectorAll(".sheet-frame").forEach((f, i) => {
        if (window.__cameAt[i] == null && parseFloat(getComputedStyle(f).getPropertyValue("--shown") || "0") > 0.05) {
          window.__cameAt[i] = performance.now() - t0;
        }
      });
      if (performance.now() - t0 < 6000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  const came = await page.evaluate(() => window.__cameAt);
  // The front house and the two either side of it along the helix — the
  // ones seen at the start — in order of how far they are from it.
  expect(came[0], "the front house").toBeLessThan(came[1]);
  expect(came[1], "then the next").toBeLessThan(came[2]);
  expect(came[2] - came[0], "and not at once").toBeGreaterThan(120);
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
   depth alone — "6 and 8 to be a little smaller" — and a house's line
   about itself shows only while it is pointed at, the front one's too. */
test("the houses either side are a little smaller, and a description shows only on hover", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(1200);
  const w = await page.$$eval(".sheet-frame", (all) => all.map((f) => f.getBoundingClientRect().width));
  expect(w[0] / w[1], "the one before").toBeLessThan(0.8);
  expect(w[2] / w[1], "the one after").toBeLessThan(0.8);
  expect(w[0] / w[1], "but not by much").toBeGreaterThan(0.6);
  const say = page.locator(".sheet-frame").nth(1).locator(".sheet-say");
  const shown = () => say.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(await shown(), "the front house's description is not shown on its own").toBeLessThan(0.05);
  const b = await page.locator(".sheet-frame").nth(1).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 });
  await expect.poll(shown).toBeGreaterThan(0.95);
});

const TOMB_SEED = 11;

/* TOMBSTONE WRITES EACH OF ITS FIVE NAMES ONCE — "not at random as it
   currently is (i dont want duplicate names)" — and none of them behind a
   house. Read off every word the motifs' canvas is asked to write. */
test("Tombstone's motifs write each name once, never twice and never behind a house", async ({ page }) => {
  test.setTimeout(60000);
  // WHERE A NAME LANDS IS CHANCE, so the chance is fixed: a seeded
  // Math.random, and a window small enough that names have to be placed
  // with care. With it left to chance, a name written into another or on
  // to a label happened on only some runs, and a test that passes when
  // the page is wrong on most of them proves nothing.
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.addInitScript((seed) => {
    let s = seed;
    Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }, Number(process.env.TOMB_SEED || TOMB_SEED));
  await page.addInitScript(() => {
    window.__written = [];
    const own = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
      if (this.canvas.classList.contains("sheet-motifs")) {
        const size = parseFloat((/(\d+(?:\.\d+)?)px/.exec(this.font) || [0, 20])[1]);
        window.__written.push({ text: String(text), x: x, y: y, w: this.measureText(String(text)).width, h: size });
      }
      return own.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 7);
  await page.waitForTimeout(9000);
  const out = await page.evaluate(() => {
    const names = ["3 Feet 5", "Evergrow", "No Need to Come By", "Sing at My Funeral", "Sweet Coffin"];
    // A name is written twice where it stands — its pale cut edge a
    // pixel off, then the letters — so places within a few pixels of
    // each other are one place.
    const places = {};
    window.__written.filter((w) => names.includes(w.text)).forEach((w) => {
      places[w.text] = places[w.text] || [];
      if (!places[w.text].some((p) => Math.abs(p.x - w.x) < 4 && Math.abs(p.y - w.y) < 4)) places[w.text].push(w);
    });
    // Each house with its label, which stands under the picture's box.
    const houses = [...document.querySelectorAll(".sheet-frame")].filter((f) =>
      f.style.visibility !== "hidden" && parseFloat(f.style.getPropertyValue("--shown") || "0") > 0.1)
      .map((f) => [f, f.querySelector(".sheet-caption"), f.querySelector(".sheet-number")].map((el) => el.getBoundingClientRect())
        .reduce((u, r) => ({ left: Math.min(u.left, r.left), right: Math.max(u.right, r.right), top: Math.min(u.top, r.top), bottom: Math.max(u.bottom, r.bottom) })));
    // Where each whole name stood, as a box.
    const boxes = Object.values(places).map((v) => v[0]).map((w) =>
      ({ text: w.text, left: w.x - w.w / 2, right: w.x + w.w / 2, top: w.y - w.h / 2, bottom: w.y + w.h / 2 }));
    const hits = (a, r) => a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top;
    const behind = boxes.filter((b) => houses.some((r) => hits(b, r))).map((b) => b.text);
    // And how near any two names came, edge to edge.
    let nearest = Infinity;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const gx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const gy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      nearest = Math.min(nearest, Math.max(gx, gy));
    }
    return { counts: Object.fromEntries(Object.entries(places).map(([k, v]) => [k, v.length])), behind: behind, nearest: nearest };
  });
  expect(Object.keys(out.counts).length, `names written: ${JSON.stringify(out.counts)}`).toBeGreaterThanOrEqual(4);
  Object.entries(out.counts).forEach(([name, n]) => expect(n, `${name} written in ${n} places`).toBe(1));
  expect(out.behind, "names written over a house or its label").toEqual([]);
  // "i want you to have a minimum distance away from the texts" — sent
  // with a picture of Evergrow written into No Need to Come By.
  expect(out.nearest, "the least room between two names").toBeGreaterThanOrEqual(24);
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

/* ATARAXIA'S STREAKS, FEWER AND MORE SIGNIFICANT: "make ataraxias effect
   slightly less frequent with the streaks, but make the streaks more
   significant." Every band lays one soft haze along its length each
   frame, so the hazes drawn in a frame are the bands on the page: read
   over a long rest, never more than seven at once — six standing and one
   fading as the next comes (it was ten and one) — and every one half as
   wide again as the widest used to be. */
test("Ataraxia's bands are fewer at once, and each wider", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__frame = 0;
    window.__hazes = {};
    const tick = () => { window.__frame++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const P = CanvasRenderingContext2D.prototype;
    const stroke = P.stroke;
    P.stroke = function () {
      if (this.canvas.classList.contains("sheet-motifs") && /52, ?53, ?58|#34353a/.test(this.strokeStyle)) {
        (window.__hazes[window.__frame] = window.__hazes[window.__frame] || []).push(this.lineWidth);
      }
      return stroke.apply(this, arguments);
    };
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 3);
  await page.waitForTimeout(16000);
  const seen = await page.evaluate(() => {
    const frames = Object.values(window.__hazes);
    return {
      frames: frames.length,
      most: Math.max(0, ...frames.map((f) => f.length)),
      thinnest: Math.min(...frames.flat()),
    };
  });
  expect(seen.frames, "bands were drawn").toBeGreaterThan(100);
  expect(seen.most, "bands on the page at once").toBeLessThanOrEqual(7);
  expect(seen.most, "but more than one").toBeGreaterThan(2);
  expect(seen.thinnest, "each band's haze, in px").toBeGreaterThan(36);
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

/* THE AXIS, EMPHASISED: "emphasize the middle part of the particles, the
   one around which the houses rotate." A firm line rather than a
   hairline — dark in the middle of the canvas down most of the window —
   and a soft light either side of it. */
test("the axis is drawn as a firm line with a light either side", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.mouse.move(4, 4);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".sheet-field");
    const ratio = c.width / c.clientWidth;
    const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const mid = Math.round((c.clientWidth / 2) * ratio);
    const alpha = (x, y) => g[(y * c.width + x) * 4 + 3];
    let firm = 0, lit = 0, rows = 0;
    for (let y = 0; y < c.height; y += 2) {
      rows++;
      if (alpha(mid, y) > 170 || alpha(mid - 1, y) > 170) firm++;
      if (alpha(mid + Math.round(10 * ratio), y) > 8) lit++;
    }
    return { firm: firm / rows, lit: lit / rows };
  });
  expect(out.firm, "the line is dark down most of the window").toBeGreaterThan(0.5);
  expect(out.lit, "and has a light beside it").toBeGreaterThan(0.5);
});

/* LES ABSTRAITS' EFFECT, CHANGED: abstract compositions — circles, arcs,
   lines, triangles and dots, drawn in by a pen line, in ink and the amber
   of the house's bottles — in place of the smoke, embers and ash off Des
   Cendres' fire. Read off what the motifs' canvas is asked to draw. */
test("Les Abstraits' motifs are abstract compositions, not smoke and embers", async ({ page }) => {
  await page.addInitScript(() => {
    window.__arcs = 0;
    window.__colours = new Set();
    const P = CanvasRenderingContext2D.prototype;
    const arc = P.arc;
    P.arc = function () {
      if (this.canvas.classList.contains("sheet-motifs")) window.__arcs++;
      return arc.apply(this, arguments);
    };
    for (const key of ["fillStyle", "strokeStyle"]) {
      const d = Object.getOwnPropertyDescriptor(P, key);
      Object.defineProperty(P, key, {
        get() { return d.get.call(this); },
        set(v) {
          if (this.canvas.classList.contains("sheet-motifs")) window.__colours.add(String(v).replace(/,\s*[\d.]+\)$/, ")"));
          d.set.call(this, v);
        },
      });
    }
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 5);
  await page.waitForTimeout(4000);
  const seen = await page.evaluate(() => ({ arcs: window.__arcs, colours: [...window.__colours] }));
  expect(seen.arcs, "circles and arcs are drawn").toBeGreaterThan(20);
  expect(seen.colours.some((c) => c.startsWith("rgba(184, 128, 46")), "in the bottles' amber").toBe(true);
  expect(seen.colours.some((c) => c.startsWith("rgba(196, 86, 31") || c.startsWith("rgba(80, 78, 74")),
    "and no embers or smoke").toBe(false);
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
  expect(out.strongest, "nothing drawn stronger than half").toBeLessThanOrEqual(0.5);
  // A few new notes arrive in a second and a half; a drifting note would
  // add a new place on every frame it is drawn.
  expect(out.places, `${out.places} places for ${out.heads} heads drawn`).toBeLessThan(out.heads / 5);
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

/* QIMU & MUSICIANS IS STAVES. "make it so that it is 5 lines like music
   sheets, and add ephemeral notes to that." Read off the motifs' own
   canvas: somewhere on it there are five long level lines, evenly spaced
   — a stave — and ink that is not those lines, which is the notes. */
test("Qimu & Musicians' motifs are five-line staves with notes on them", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 8);
  await page.waitForTimeout(3200);
  const read = await page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / innerWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const w = c.width;
    const long = [];
    for (let y = 0; y < c.height; y++) {
      let run = 0, best = 0;
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) { run++; if (run > best) best = run; } else run = 0;
      }
      if (best > w * 0.35) long.push(Math.round(y / ratio));
    }
    // Rows next to each other are one line drawn a pixel thick.
    const lines = long.filter((y, i) => i === 0 || y - long[i - 1] > 2);
    let staves = 0;
    for (let i = 0; i + 4 < lines.length; i++) {
      const gaps = [1, 2, 3, 4].map((k) => lines[i + k] - lines[i + k - 1]);
      if (gaps.every((g) => Math.abs(g - gaps[0]) <= 1.5 && g > 5 && g < 14)) staves++;
    }
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 20) ink++;
    return { staves, ink, lineInk: long.length * w * 0.35 };
  });
  expect(read.staves, "at least one stave of five even lines").toBeGreaterThan(0);
  expect(read.ink, "and notes on it besides the lines").toBeGreaterThan(read.lineInk);
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

