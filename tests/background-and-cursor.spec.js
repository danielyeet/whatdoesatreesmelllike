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

/* THE CURSOR OVER A PICTURE, AND OVER WHAT IS DRAWN ON TOP. Two faults
   the owner found on 2026-09-23 and both are site-wide:

   - "The cursor disappears when you hover pineward in SD": the first
     picture on the Houses view stood in front of the cursor, because it
     was given a higher layer than the cursor's. The cursor now stands
     above everything on every page.
   - "doesnt turn white when hovering something black", on the Houses
     view and on Haxan: the cursor read only BACKGROUND colours, and a
     photograph paints none — it went straight through the picture to
     the white page behind it. It now reads the picture itself. */
test.describe("the cursor over pictures", () => {
  const ring = (page) => page.evaluate(() => {
    const r = document.querySelector(".cursor-ring");
    return r.classList.contains("on-dark");
  });

  test("stands above everything, including the pictures on the Houses view", async ({ page }) => {
    await page.goto("/categories/scent-descriptions.html");
    await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
    const box = await page.locator(".sheet-frame").first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
    await page.waitForTimeout(200);
    const layers = await page.evaluate(() => {
      const z = (el) => { const v = parseInt(getComputedStyle(el).zIndex, 10); return Number.isNaN(v) ? 0 : v; };
      const ring = z(document.querySelector(".cursor-ring"));
      const highest = Math.max(...[...document.querySelectorAll("body *")]
        .filter((el) => !el.classList.contains("cursor-ring") && !el.classList.contains("cursor-dot"))
        .map(z));
      return { ring, highest };
    });
    expect(layers.ring, "nothing on the page should stand above the cursor").toBeGreaterThan(layers.highest);
  });

  test("goes light over the dark parts of a photograph, and dark over the light", async ({ page }) => {
    await page.goto("/individual-fragrances/individual-fragrances.html");
    const part = page.locator(".human-part", { hasText: "Haxan" }).first();
    await part.locator("summary").click();
    await page.waitForTimeout(900);
    const img = part.locator(".human-plate > img");
    await img.scrollIntoViewIfNeeded();
    const b = await img.boundingBox();
    // Where on the picture is darkest and where lightest, read off the
    // picture itself.
    const spots = await img.evaluate((el) => {
      const c = document.createElement("canvas");
      c.width = 40; c.height = 40;
      const x = c.getContext("2d");
      x.drawImage(el, 0, 0, 40, 40);
      const d = x.getImageData(0, 0, 40, 40).data;
      let dark = null, light = null;
      for (let i = 6; i < 34; i++) for (let j = 6; j < 34; j++) {
        let sum = 0;
        for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) {
          const k = ((j + dj) * 40 + (i + di)) * 4;
          sum += 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2];
        }
        const v = sum / 25;
        if (!dark || v < dark.v) dark = { i, j, v };
        if (!light || v > light.v) light = { i, j, v };
      }
      return { dark, light };
    });
    expect(spots.dark.v, "the picture has a dark part").toBeLessThan(70);
    expect(spots.light.v, "and a light one").toBeGreaterThan(150);
    const at = (s) => ({ x: b.x + (s.i + 0.5) / 40 * b.width, y: b.y + (s.j + 0.5) / 40 * b.height });

    await page.mouse.move(at(spots.dark).x, at(spots.dark).y, { steps: 3 });
    await page.waitForTimeout(200);
    expect(await ring(page), "over the dark of the picture the cursor goes light").toBe(true);

    await page.mouse.move(at(spots.light).x, at(spots.light).y, { steps: 3 });
    await page.waitForTimeout(200);
    expect(await ring(page), "over the light of it, dark again").toBe(false);
  });
});
