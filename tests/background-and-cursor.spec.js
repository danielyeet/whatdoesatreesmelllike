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
  const maskOf = (page) =>
    page.evaluate(() => {
      const paper = document.querySelector(".paper");
      return getComputedStyle(paper).maskImage || getComputedStyle(paper).webkitMaskImage;
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
      const p = document.querySelector(".paper");
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
      const mask = getComputedStyle(document.querySelector(".paper")).maskImage;
      const lobe = /radial-gradient\(([\d.]+)%/.exec(mask);
      const sweep = /linear-gradient\(rgb\([^)]*\)\s*([-\d.]+)%/.exec(mask);
      return { sides: lobe && +lobe[1], middle: sweep && +sweep[1] };
    });

    expect(reach.sides, "the sides should be well down the page by now").toBeGreaterThan(20);
    expect(reach.middle, "and the middle should be behind them").toBeLessThan(reach.sides);
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
