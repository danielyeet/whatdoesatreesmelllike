// ============================================================
// LEAVING THE MAP (scrolling back up from slide 3)
//
// Going back up isn't a plain scroll. The page is held still while
// the map falls into its own centre, then while a line draws itself
// from that centre to the top of the screen, and only then does it
// move. The order matters more than anything here — if the page
// starts scrolling during either of those, the whole thing is lost.
// ============================================================
const { test, expect } = require("@playwright/test");
const {
  serveDependenciesLocally,
  collectPageErrors,
  jumpToSlide,
  waitForMapSettled,
} = require("./helpers");

const scrollTop = (page) =>
  page.evaluate(() => document.getElementById("scroll-container").scrollTop);
const slideTop = (page, id) =>
  page.evaluate((id) => document.getElementById(id).offsetTop, id);
const stage = (page) =>
  page.evaluate(() => ({ exit: window.__exit || 0, reform: window.__reform || 0 }));

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page holds still through the collapse and the line, then scrolls", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);
  // Put the page's own idea of where it is back in step after jumping.
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);

  const parked = await scrollTop(page);

  // Record all three values together on every frame, inside the page.
  // Reading them one at a time from out here would let the sequence move
  // on between reads on a slow machine, which says nothing about whether
  // the ordering is right.
  await page.evaluate(() => {
    window.__timeline = [];
    const container = document.getElementById("scroll-container");
    const tick = () => {
      window.__timeline.push({
        exit: window.__exit || 0,
        reform: window.__reform || 0,
        scrollTop: container.scrollTop,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.keyboard.press("ArrowUp");
  await expect
    .poll(() => scrollTop(page), { timeout: 15000 })
    .toBe(await slideTop(page, "slide-2"));

  const timeline = await page.evaluate(() => window.__timeline);

  // The sequence actually ran, rather than being skipped.
  expect(Math.max(...timeline.map((f) => f.exit)), "collapse should run").toBeGreaterThan(0.9);
  expect(Math.max(...timeline.map((f) => f.reform)), "line should reform").toBeGreaterThan(0.9);

  // The invariant that matters, measured over the window the sequence
  // was actually running in: from the first frame of the collapse to the
  // frame the line finished on, the page must not have moved at all.
  // Frames after that are the scroll itself, and the reset that follows
  // it, both of which are supposed to move and to put the two values
  // back to 0 — counting those would flag correct behaviour as a fault.
  const started = timeline.findIndex((f) => f.exit > 0);
  const finished = timeline.findIndex((f) => f.reform >= 1);
  expect(started, "collapse should have started").toBeGreaterThanOrEqual(0);
  expect(finished, "line should have finished").toBeGreaterThan(started);

  const duringSequence = timeline.slice(started, finished + 1);
  const movedEarly = duringSequence.filter((f) => f.scrollTop !== parked);
  expect(
    movedEarly.length,
    `page moved during the sequence: ${JSON.stringify(movedEarly.slice(0, 3))}` +
      ` (parked at ${parked})`
  ).toBe(0);

  // And everything is released once it has arrived.
  await expect.poll(async () => (await stage(page)).exit, { timeout: 4000 }).toBe(0);
  expect((await stage(page)).reform).toBe(0);
  expect(errors).toEqual([]);
});

test("going down to the map is a plain scroll, with no collapse", async ({ page }) => {
  await page.goto("/index.html");

  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(1400);
  await page.keyboard.press("ArrowDown");

  // The collapse belongs to the way up only; going down must never
  // trigger it, or arriving at the map would play it backwards.
  const samples = [];
  for (let i = 0; i < 10; i++) {
    samples.push((await stage(page)).exit);
    await page.waitForTimeout(120);
  }
  expect(Math.max(...samples), "no collapse on the way down").toBe(0);
});

test("the map collapses into its centre, and the centre stays put", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); // holds the map still
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);

  const before = await page.evaluate(() => ({
    nodes: window.__mapReadout.nodes.map((n) => ({ x: n.x, y: n.y })),
    hubX: window.__mapReadout.hubX,
    hubY: window.__mapReadout.hubY,
  }));

  // Drive the collapse directly so this doesn't depend on timing.
  await page.evaluate(() => { window.__exit = 1; });
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => ({
    nodes: window.__mapReadout.nodes.map((n) => ({ x: n.x, y: n.y })),
    hubX: window.__mapReadout.hubX,
    hubY: window.__mapReadout.hubY,
    collapse: window.__mapReadout.collapse,
  }));

  expect(after.collapse).toBeGreaterThan(0.99);

  // The centre itself does not move...
  expect(Math.abs(after.hubX - before.hubX)).toBeLessThan(2);
  expect(Math.abs(after.hubY - before.hubY)).toBeLessThan(2);

  // ...and every node ends up far closer to it than it started.
  for (let i = 0; i < before.nodes.length; i++) {
    const was = Math.hypot(before.nodes[i].x - before.hubX, before.nodes[i].y - before.hubY);
    const now = Math.hypot(after.nodes[i].x - before.hubX, after.nodes[i].y - before.hubY);
    expect(now, `node ${i} should be drawn into the centre`).toBeLessThan(was * 0.2);
  }

  await page.evaluate(() => { window.__exit = 0; });
});

test("the trace along the foot is the first thing to go", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);

  const traceOpacity = () =>
    page.evaluate(() => {
      const svgs = document.querySelectorAll("svg");
      const trace = svgs[svgs.length - 1];
      return parseFloat(trace.style.opacity || "0");
    });

  expect(await traceOpacity()).toBeGreaterThan(0.5);

  // A third of the way into the collapse it should already be gone,
  // while the map itself is still very much on screen.
  await page.evaluate(() => { window.__exit = 0.35; });
  await page.waitForTimeout(300);
  expect(await traceOpacity(), "trace should lead the way out").toBeLessThan(0.2);

  await page.evaluate(() => { window.__exit = 0; });
});

test("a line draws itself from the centre up to the top of the screen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);

  const reformLine = page.locator(".thread-reform");
  await expect(reformLine).toBeAttached();
  expect(await reformLine.evaluate((el) => parseFloat(el.style.strokeOpacity || "0"))).toBe(0);

  await page.evaluate(() => { window.__exit = 1; window.__reform = 1; });
  await page.waitForTimeout(300);

  const line = await reformLine.evaluate((el) => ({
    x1: parseFloat(el.getAttribute("x1")),
    y1: parseFloat(el.getAttribute("y1")),
    y2: parseFloat(el.getAttribute("y2")),
    opacity: parseFloat(el.style.strokeOpacity || "0"),
  }));
  const view = await page.evaluate(() => ({
    scrollTop: document.getElementById("scroll-container").scrollTop,
    hubY: window.__mapReadout.hubY,
  }));

  expect(line.opacity, "the line should be visible once reformed").toBeGreaterThan(0.2);
  // It starts at the sphere and ends at the top edge of what's on screen.
  expect(line.y1).toBeGreaterThan(line.y2);
  expect(Math.abs(line.y2 - view.scrollTop), "should reach the top of the view").toBeLessThan(4);

  await page.evaluate(() => { window.__exit = 0; window.__reform = 0; });
});
