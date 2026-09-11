// ============================================================
// THE BACKGROUND AND THE CURSOR
//
// The squared-paper background arrives as the page scrolls from
// slide 2 to slide 3, and the custom cursor follows the pointer
// with a lag. Both are decoration, but both have had real bugs,
// so the shape of what they do is worth pinning down.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, jumpToSlide } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test.describe("the paper background", () => {
  // The wipe is set on the wash and the grid themselves, not on .paper
  // around them — the grain is deliberately left out of it.
  const maskOf = (page) =>
    page.evaluate(() => {
      const grid = document.querySelector(".paper-grid");
      return getComputedStyle(grid).maskImage || getComputedStyle(grid).webkitMaskImage;
    });

  // Regression test: grain arriving along a moving edge is one of the
  // most noticeable things a page can do, however soft that edge is
  // made. It is kept out of the wipe entirely and comes up evenly over
  // the whole window instead.
  test("the grain is never cut by the wipe, only faded up", async ({ page }) => {
    await page.goto("/index.html");

    for (const fraction of [0.2, 0.45, 0.7]) {
      await jumpToSlide(page, "slide-3", fraction);
      await page.waitForTimeout(200);
      const layers = await page.evaluate(() => {
        const maskOn = (selector) => {
          const s = getComputedStyle(document.querySelector(selector));
          const mask = s.maskImage || s.webkitMaskImage;
          return !!mask && mask !== "none";
        };
        return {
          grain: maskOn(".paper-noise"),
          grid: maskOn(".paper-grid"),
          wash: maskOn(".paper-wash"),
        };
      });
      expect(layers.grain, `at ${fraction}: the grain must not be masked`).toBe(false);
      expect(layers.grid, `at ${fraction}: the grid is`).toBe(true);
      expect(layers.wash, `at ${fraction}: and so is the wash`).toBe(true);
    }

    // And it comes up gradually rather than switching on.
    const steps = [];
    for (let f = 0; f <= 1.0001; f += 0.05) {
      await jumpToSlide(page, "slide-3", f);
      await page.waitForTimeout(80);
      steps.push(
        await page.evaluate(() =>
          parseFloat(getComputedStyle(document.querySelector(".paper-noise")).opacity)
        )
      );
    }
    const biggest = Math.max(...steps.slice(1).map((v, i) => Math.abs(v - steps[i])));
    expect(steps[steps.length - 1], "it should have arrived by the end").toBeGreaterThan(0.02);
    expect(biggest, "and never in one jump").toBeLessThan(0.01);
  });

  // The paper wipes in from the top of the page downwards, with the two
  // edges running ahead of the middle. It has been a left-to-right wipe,
  // a plain circle and a duck's wake before now, so the shape is worth
  // pinning down.
  test("wipes in from the top, with the sides ahead of the middle", async ({ page }) => {
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3", 0.5); // halfway between slide 2 and 3
    await page.waitForTimeout(400);

    const mask = await maskOf(page);

    // One sweep down the page, and a lobe growing out of each top corner.
    // Note the browser hands the mask back normalised — "to bottom" and
    // "ellipse" are both a gradient's default and are dropped from it —
    // so downwards is checked as the absence of any other direction.
    const sweeps = mask.match(/linear-gradient/g) || [];
    expect(sweeps.length, "one sweep down the page").toBe(1);
    expect(mask, "the sweep must run downwards").not.toMatch(/linear-gradient\(\s*(to |[-\d.]+deg)/);
    const lobes = mask.match(/radial-gradient/g) || [];
    expect(lobes.length, "one lobe at each top corner").toBe(2);

    const composite = await page.evaluate(() => {
      const p = document.querySelector(".paper-grid");
      const s = getComputedStyle(p);
      return s.maskComposite || s.webkitMaskComposite;
    });
    // The lobes have to reach out past the sweep, not cut it down — with
    // intersect they would hold the sides back instead of running ahead.
    expect(composite, "the lobes must add to the sweep").toMatch(/add|source-over/);

    // And they sit in the top two corners, which is what puts the sides
    // ahead of the middle rather than the other way round.
    const at = [...mask.matchAll(/at\s+([\d.]+)%\s+([\d.]+)%/g)].map((m) => [+m[1], +m[2]]);
    expect(at, `lobes should be in the top corners, got: ${mask}`).toEqual([
      [0, 0],
      [100, 0],
    ]);
  });

  test("the middle of the page is the last part of it to fill in", async ({ page }) => {
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3", 0.45);
    await page.waitForTimeout(400);

    // How far each part of the page has got is written into the mask
    // itself: the lobes' radius is how far down the sides have reached,
    // and the sweep's solid stop is how far the middle has.
    const reach = await page.evaluate(() => {
      const mask = getComputedStyle(document.querySelector(".paper-grid")).maskImage;
      const lobe = /radial-gradient\(([\d.]+)%/.exec(mask);
      const sweep = /linear-gradient\(rgb\([^)]*\)\s*([-\d.]+)%/.exec(mask);
      return { sides: lobe && +lobe[1], middle: sweep && +sweep[1] };
    });

    expect(reach.sides, "the sides should be well down the page by now").toBeGreaterThan(20);
    expect(reach.middle, "and the middle should be behind them").toBeLessThan(reach.sides);
  });

  // Regression test: the mask is dropped altogether once the paper has
  // arrived. If it is still feathering anywhere at that moment, dropping
  // it fills that part of the page in one frame — which is exactly the
  // sudden flash the wipe is supposed to avoid. So the sweep has to
  // reach past the bottom of the page well before the mask comes off.
  test("the page is completely covered before the mask is taken off", async ({ page }) => {
    await page.goto("/index.html");

    let lastMasked = null;
    for (let f = 0.5; f <= 1.0001; f += 0.02) {
      await jumpToSlide(page, "slide-3", f);
      await page.waitForTimeout(90);
      const state = await page.evaluate(() => {
        const mask = getComputedStyle(document.querySelector(".paper-grid")).maskImage;
        if (!mask || mask === "none") return null;
        // The sweep's first stop is how far down the page is solid.
        const solid = /linear-gradient\(rgb\([^)]*\)\s*([-\d.]+)%/.exec(mask);
        return solid ? +solid[1] : null;
      });
      if (state !== null) lastMasked = state;
    }

    expect(lastMasked, "the mask should still have been on part-way through").not.toBeNull();
    expect(
      lastMasked,
      "the last masked frame must already cover the whole page, top to bottom"
    ).toBeGreaterThanOrEqual(100);
  });

  test("is fully revealed by the time the map has arrived", async ({ page }) => {
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3");
    await page.waitForTimeout(800);

    const mask = await maskOf(page);
    // Once it has fully arrived the mask is removed altogether, so the
    // background is simply all there.
    expect(mask === "none" || mask === "" || mask == null).toBeTruthy();
  });

  test("the map and the thread are not masked by the background's arrival", async ({ page }) => {
    // The circle is only supposed to cut the background. The map and the
    // line down the middle fade in on their own and must not be clipped.
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3", 0.5);
    await page.waitForTimeout(300);

    const masks = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = getComputedStyle(el);
        return s.maskImage || s.webkitMaskImage || "none";
      };
      return { scene: pick("#node-scene"), thread: pick(".thread") };
    });
    expect(masks.scene === "none" || masks.scene === null).toBeTruthy();
    expect(masks.thread === "none" || masks.thread === null).toBeTruthy();
  });
});

test.describe("the custom cursor", () => {
  // Regression test: when the pointer stopped, the stretched ring used
  // to snap its angle back to zero in one frame while still visibly
  // stretched, which showed as a flick at the moment it settled. The
  // angle should hold while the stretch relaxes away.
  test("does not flick its angle when the pointer stops", async ({ page }) => {
    await page.goto("/index.html");

    const angleOf = (t) => {
      const m = /rotate\((-?[\d.]+)deg\)/.exec(t || "");
      return m ? parseFloat(m[1]) : null;
    };
    const scaleXOf = (t) => {
      const m = /scale\((-?[\d.]+)/.exec(t || "");
      return m ? parseFloat(m[1]) : null;
    };

    // Move far and fast, so the ring is dragged out of shape...
    await page.mouse.move(200, 200);
    await page.mouse.move(800, 560, { steps: 6 });

    // ...then stop, and watch it settle.
    const samples = await page.evaluate(async () => {
      const ring = document.querySelector(".cursor-ring");
      const out = [];
      for (let i = 0; i < 18; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        out.push(ring.style.transform);
      }
      return out;
    });

    const angles = samples.map(angleOf).filter((a) => a !== null);
    const scales = samples.map(scaleXOf).filter((s) => s !== null);
    expect(angles.length).toBeGreaterThan(5);

    // The stretch must relax back towards round...
    expect(scales[scales.length - 1]).toBeLessThan(scales[0]);
    // ...without the angle ever jumping. A snap back to 0 from a real
    // angle was the bug; small drift while still moving is fine.
    const biggestJump = Math.max(
      ...angles.slice(1).map((a, i) => Math.abs(a - angles[i]))
    );
    expect(biggestJump, "cursor angle should not jump as it settles").toBeLessThan(20);
  });

  test("is only set up for mouse pointers, not touch screens", async ({ page }) => {
    // There is nothing to replace on a touch screen, and the site checks
    // for a fine pointer before building the cursor at all.
    await page.goto("/index.html");
    await expect(page.locator(".cursor-ring")).toBeAttached();
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("has-cursor")
    );
    expect(hasClass).toBe(true);
  });
});
