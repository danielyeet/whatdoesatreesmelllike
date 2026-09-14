// ============================================================
// THE STRUCTURE (categories/theories.html)
//
// That category is a technical drawing in three dimensions that you
// travel into: a frame of ribs and rails running away into the depth,
// a ruled spine along the floor, and a swarm of particles in the air.
// Every theory is a STATION standing at its own depth along a road;
// the unnamed assemblies between them are FIXTURES, which are
// structure only and not clickable.
//
// These check that the structure is grown from the page's own rows,
// that the travel is the page's own scroll, that going further in
// brings new stations up and leaves the ones behind you off the page,
// that going BACK fills the air again (a bug this page has had), that
// the spine is a wheel, that a station is what you click and nothing
// else on the drawing is, that the palette is white on near-black
// rather than a blue sky, and that switching the script off leaves
// the plain list behind.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/theories.html";

/** Which stations are on the page, and how strongly. */
const drawnNow = (page) =>
  page.evaluate(() => {
    const out = {};
    [...document.querySelectorAll(".structure-stop")].forEach((stop, i) => {
      if (stop.classList.contains("gone")) return;
      const r = stop.getBoundingClientRect();
      out[i] = { lit: parseFloat(stop.style.opacity), width: r.width, x: r.left, y: r.top };
    });
    return out;
  });

/** How much is actually drawn in the air: bright pixels on the
    canvas. The ground is near-black, so anything this light is a
    particle, a rib or a rule rather than the page itself. */
const inkNow = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector(".structure-field");
    const shot = canvas.getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0, neutral = 0, cool = 0;
    for (let n = 0; n < shot.length; n += 4) {
      const light = (shot[n] + shot[n + 1] + shot[n + 2]) / 3;
      if (light <= 60) continue;
      bright++;
      if (Math.abs(shot[n + 2] - shot[n]) <= 22) neutral++;
      else if (shot[n + 2] > shot[n] + 24) cool++;
    }
    return { bright: bright, neutral: neutral, cool: cool };
  });

async function waitForStructure(page) {
  await page.waitForSelector(".structure-field", { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".structure-stop:not(.gone)").length > 0,
    null,
    { timeout: 15000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the structure is grown from the page's own rows", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await waitForStructure(page);

  const built = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".work-row")];
    const stops = [...document.querySelectorAll(".structure-stop")];
    return {
      rows: rows.length,
      stops: stops.length,
      names: stops.map((s) => s.querySelector(".structure-name").textContent.trim()),
      rowNames: rows.map((r) => r.querySelector(".work-row-title").textContent.trim()),
      hrefs: stops.map((s) => s.getAttribute("href")),
      rowHrefs: rows.map((r) => r.getAttribute("href")),
      numbers: stops.map((s) => s.querySelector(".structure-no").textContent.trim()),
      structured: document.body.classList.contains("structured"),
    };
  });

  expect(built.rows, "there should be theories on the page").toBeGreaterThan(2);
  expect(built.stops, "one station for each of them").toBe(built.rows);
  expect(built.names).toEqual(built.rowNames);
  expect(built.hrefs).toEqual(built.rowHrefs);
  expect(built.numbers[0]).toBe("01");
  expect(built.structured).toBe(true);
  expect(errors).toEqual([]);
});

test("the travel is the page's own scroll, so the page is a road", async ({ page }) => {
  await page.goto(PAGE);
  await waitForStructure(page);

  // Made tall enough to hold the road. Doing it this way rather than
  // catching the wheel is what keeps the scrollbar, the arrow keys,
  // Page Down and a finger on a phone all working for free.
  const road = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
    stops: document.querySelectorAll(".structure-stop").length,
  }));
  expect(road.page, "several screens of road").toBeGreaterThan(road.window * road.stops);

  // And the scroll drives it: the readout says which station you are
  // among and how far along you have come. Both are kept.
  const before = await page.locator(".structure-readout").textContent();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await page.waitForTimeout(1200);
  const after = await page.locator(".structure-readout").textContent();
  expect(after, "the readout should follow the scroll").not.toBe(before);
  expect(after, "the n of nine and the percentage").toMatch(/\d\d \/ \d\d.+\d\d\d%/);
});

test("going further in brings new stations up and leaves the old behind",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(600);

  const near = await drawnNow(page);
  expect(Object.keys(near).length, "something should be in the frame").toBeGreaterThan(0);
  const first = Object.keys(near)[0];

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5));
  await page.waitForTimeout(1500);
  const far = await drawnNow(page);

  expect(Object.keys(far).length, "and something further in too").toBeGreaterThan(0);
  // What was in front of you at the start is behind you now, and a
  // station behind you is off the page rather than faded to nothing
  // and still catching the pointer.
  expect(far[first], `station ${first} should have gone past`).toBeUndefined();
  const arrived = Object.keys(far).filter((k) => !near[k]);
  expect(arrived.length, "new ones should have come up out of the dark").toBeGreaterThan(0);
});

test("travelling back fills the air again, as many times as you like",
  async ({ page }) => {
  // A REGRESSION TEST. The swarm used to be carried along: a particle
  // that went behind you was put back out at the far end. Going
  // forward that is invisible, but going *back* nothing is ever put
  // back in front of you, so scrolling up emptied the air and left a
  // bare frame. It now wraps both ways, and this is what says so.
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(700);

  const start = await inkNow(page);
  expect(start.bright, "the air should be full to begin with").toBeGreaterThan(400);

  const at = async (y) => {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(1200);
    return (await inkNow(page)).bright;
  };

  const deep = await at(6000);
  const back = await at(0);
  const middle = await at(2500);
  const deepAgain = await at(6000);

  [["far in", deep], ["back at the start", back],
   ["part way again", middle], ["and far in again", deepAgain]].forEach(([where, ink]) => {
    expect(ink, `the air should still be full ${where}`)
      .toBeGreaterThan(start.bright * 0.4);
  });
});

test("the spine is the wheel: it can be dragged, and pressed", async ({ page }) => {
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(500);

  const wheel = page.locator(".structure-spine");
  await expect(wheel).toHaveAttribute("aria-label", /travel/i);
  const box = await wheel.boundingBox();
  const middle = await page.evaluate(() => window.innerWidth / 2);
  expect(Math.abs(box.x + box.width / 2 - middle), "it runs down the middle")
    .toBeLessThan(4);

  // Dragging it up the screen travels further in, the way dragging a
  // page does — and it does that by writing the page's own scroll, so
  // the rule and the scrollbar can never disagree.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
  await page.mouse.down();
  for (let n = 1; n <= 8; n++) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7 - n * 22);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);
  const dragged = await page.evaluate(() => window.scrollY);
  expect(dragged, "dragging up should travel in").toBeGreaterThan(100);

  // And pressed rather than dragged — which is the only way it can be
  // used from the keyboard — it goes on to the next station.
  await wheel.click({ position: { x: box.width / 2, y: box.height - 30 } });
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.scrollY),
    "pressing it should go on").toBeGreaterThan(dragged);
});

test("a station is the thing you click, and nothing else on the drawing is",
  async ({ page }) => {
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(600);

  const there = page.locator(".structure-stop:not(.gone)").first();
  await expect(there).toHaveAttribute("href", /works\//);

  // The link is laid over the assembly rather than beside it, so what
  // you click is the station and not a caption next to it.
  const box = await there.boundingBox();
  expect(box.width, "wide enough to be the assembly").toBeGreaterThan(40);
  expect(box.height, "and tall enough").toBeGreaterThan(40);

  // The fixtures are drawn the same way and are deliberately NOT
  // clickable: the only links on the drawing are the theories.
  const links = await page.evaluate(() => ({
    all: document.querySelectorAll(".structure a").length,
    stations: document.querySelectorAll(".structure-stop").length,
  }));
  expect(links.all, "only the stations are links").toBe(links.stations);

  await there.focus();
  expect(await page.evaluate(() => document.activeElement.className))
    .toContain("structure-stop");
});

test("it is drawn white on near-black, not blue on a night sky", async ({ page }) => {
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(700);

  // A full-bleed dark region has to carry `dark-surface`, or nav.js's
  // cursor stays dark over it and is invisible.
  await expect(page.locator(".structure")).toHaveClass(/dark-surface/);
  const tone = await page.evaluate(() => {
    const paint = getComputedStyle(document.querySelector(".structure")).backgroundColor;
    const [r, g, b] = paint.match(/\d+/g).map(Number);
    return (r + g + b) / 3;
  });
  expect(tone, "the ground should be near-black").toBeLessThan(30);

  const ink = await inkNow(page);
  expect(ink.bright, "there should be something drawn on it").toBeGreaterThan(400);
  // Mostly white and grey. The cool blue is kept back for the marks
  // that say a station can be opened — the brackets, the crosshair,
  // the ring round a node — so there is some of it on the page, but
  // it is the exception and not the page itself. Drawing a whole
  // station in it filled the screen with blue as you came up on one,
  // and then blue stopped meaning anything.
  expect(ink.neutral / ink.bright, "most of it near-white").toBeGreaterThan(0.65);
  expect(ink.cool, "with a cool accent somewhere on it").toBeGreaterThan(20);
});

test("without the script the page is the plain list of theories", async ({ page }) => {
  await page.route("**/structure.js", (route) => route.abort());
  await page.goto(PAGE);
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => document.body.classList.contains("structured")))
    .toBe(false);
  expect(await page.locator(".structure").count(), "nothing is drawn").toBe(0);
  const rows = page.locator(".work-row");
  expect(await rows.count()).toBeGreaterThan(2);
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".page-content h1")).toBeVisible();
});

test("with animation turned off it does not creep on its own", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await waitForStructure(page);
  await page.waitForTimeout(700);

  const before = await drawnNow(page);
  await page.waitForTimeout(1300);
  const after = await drawnNow(page);
  const both = Object.keys(before).filter((k) => after[k]);
  expect(both.length, "something should be there both times").toBeGreaterThan(0);
  both.forEach((k) => {
    expect(
      Math.hypot(after[k].x - before[k].x, after[k].y - before[k].y),
      "it should stand still until it is travelled through"
    ).toBeLessThan(2);
  });

  // Still fully readable, though: it is held still, not switched off.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await page.waitForTimeout(900);
  expect(await page.locator(".structure-readout").textContent()).toMatch(/\d\d \/ \d\d/);
});
