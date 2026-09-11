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

  // The paper arrives along a duck's wake: a V trailing back from the
  // middle of the page. It has been a left-to-right wipe and a plain
  // circle before now, so the shape is worth pinning down.
  test("arrives along a V trailing back from the middle of the page", async ({ page }) => {
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3", 0.5); // halfway between slide 2 and 3
    await page.waitForTimeout(400);

    const mask = await maskOf(page);

    // Three masks intersected: one that grows, and an arm on each side.
    expect(mask, "something should be growing").toContain("radial-gradient");
    const arms = mask.match(/linear-gradient/g) || [];
    expect(arms.length, "one arm each side of the wake").toBe(2);

    const composite = await page.evaluate(() => {
      const p = document.querySelector(".paper");
      const s = getComputedStyle(p);
      return s.maskComposite || s.webkitMaskComposite;
    });
    expect(composite, "arms must cut the shape down, not add to it").toContain("intersect");

    // The vertex sits at the middle of the page — that's where the bird
    // would be. It used to be up at 18%, which is what "don't start so
    // high up" was about. The browser drops "at 50% 50%" when reporting
    // it back, since that is a radial-gradient's default position, so
    // either spelling of the centre counts; any other position does not.
    const offCentre = /at\s+(?!50%\s+50%)[\d.]+%\s+[\d.]+%/.test(mask);
    expect(offCentre, `wake should be centred on the page, got: ${mask}`).toBe(false);

    // And the arms open at the wake's angle either side of straight down.
    const angles = [...mask.matchAll(/linear-gradient\(([\d.]+)deg/g)].map((m) => Number(m[1]));
    expect(angles.length).toBe(2);
    const half = 18.5;
    expect(angles.sort((a, b) => a - b)).toEqual([90 + half, 270 - half]);
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
