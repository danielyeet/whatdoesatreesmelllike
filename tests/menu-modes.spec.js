// ============================================================
// HOW THE MENU OPENS ON EACH SLIDE (landing page only)
//
// The same menu, presented three different ways depending on
// which slide you are looking at. These check that the right one
// is chosen and that each does the thing that makes it different,
// not how it looks — that stays a matter of taste.
// ============================================================
const { test, expect } = require("@playwright/test");
const {
  serveDependenciesLocally,
  collectPageErrors,
  jumpToSlide,
  waitForMapSettled,
} = require("./helpers");

const overlayClass = (page) =>
  page.evaluate(() => document.getElementById("site-menu-overlay").className);

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("each slide opens the menu its own way", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/index.html");
  await page.waitForTimeout(400);

  // slide 1
  expect(await page.evaluate(() => window.__slide)).toBe(0);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-title");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // slide 2
  await jumpToSlide(page, "slide-2");
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(1);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-side");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // slide 3
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(2);
  await page.locator(".menu-trigger").click();
  await expect.poll(() => overlayClass(page)).toContain("mode-map");

  expect(errors).toEqual([]);
});

test("on the title slide, a strand is drawn to every menu item and the title sinks", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForTimeout(400);

  const title = page.locator(".title-content");
  const before = await title.evaluate((el) => getComputedStyle(el).transform);

  await page.locator(".menu-trigger").click();
  await page.waitForTimeout(900);

  // One strand per menu item, and they have actually been drawn on
  // (their dash offset runs down to zero as they appear).
  const strands = page.locator(".menu-fan-line");
  const itemCount = await page.locator(".menu-list li").count();
  await expect(strands).toHaveCount(itemCount);

  const offsets = await strands.evaluateAll((els) =>
    els.map((el) => parseFloat(el.style.strokeDashoffset || "0"))
  );
  expect(Math.max(...offsets), "strands should be drawn in, not left hidden").toBeLessThan(1);

  // And the title has moved down out of the way.
  const after = await title.evaluate((el) => getComputedStyle(el).transform);
  expect(after).not.toBe(before);
  const shiftedDown = Number(after.split(",").pop().replace(")", ""));
  expect(shiftedDown, "title should sink downwards").toBeGreaterThan(50);
});

// Regression test: switching which mode the menu is in is itself a
// change of transform, so left to animate it ate the whole transition
// travelling to the mode's closed position. The panel then appeared
// where it was supposed to have arrived, on every slide, and none of
// the three modes actually moved.
test("the panel travels into place rather than simply appearing", async ({ page }) => {
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-2");
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(1);

  const frames = await page.evaluate(async () => {
    const overlay = document.getElementById("site-menu-overlay");
    document.querySelector(".menu-trigger").click();
    const out = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      out.push(Number(/matrix\(1, 0, 0, 1, (-?[\d.]+)/.exec(getComputedStyle(overlay).transform)[1]));
    }
    return out;
  });

  expect(frames[0], "it should start off the side of the screen").toBeLessThan(-600);
  expect(frames[frames.length - 1], "and be on its way in").toBeGreaterThan(frames[0]);
});

test("on the title slide the line climbs before the page starts moving", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForTimeout(400);

  const shift = () =>
    page.evaluate(() => {
      const m = /matrix\(1, 0, 0, 1, [-\d.]+, (-?[\d.]+)\)/.exec(
        getComputedStyle(document.querySelector(".title-content")).transform
      );
      return m ? Number(m[1]) : 0;
    });
  // The line's two ends, read off the path it is drawn as.
  const trunk = () =>
    page.evaluate(() => {
      const d = document.querySelector(".menu-fan-trunk").getAttribute("d") || "";
      const nums = d.match(/-?[\d.]+/g);
      return nums ? { foot: Number(nums[1]), tip: Number(nums[nums.length - 1]) } : null;
    });

  await page.evaluate(() => document.querySelector(".menu-trigger").click());
  await page.waitForTimeout(120);

  const early = await trunk();
  expect(early, "a line should already be drawn").not.toBeNull();
  expect(early.tip, "and it should be heading up, out of the title").toBeLessThan(early.foot);
  expect(await shift(), "while the page has not started moving yet").toBeLessThan(24);

  await page.waitForTimeout(700);
  expect(await shift(), "the page then sinks away below it").toBeGreaterThan(100);
});

test("on the intro slide, the line on the page is swept aside", async ({ page }) => {
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-2");
  await expect.poll(() => page.evaluate(() => window.__slide)).toBe(1);

  const acrossBy = () =>
    page.evaluate(() => {
      const m = /matrix\(1, 0, 0, 1, (-?[\d.]+)/.exec(
        getComputedStyle(document.querySelector(".intro-content")).transform
      );
      return m ? Number(m[1]) : 0;
    });

  expect(await acrossBy()).toBe(0);
  await page.locator(".menu-trigger").click();
  await page.waitForTimeout(900);
  expect(await acrossBy(), "it should go the way the panel is travelling").toBeGreaterThan(100);

  await page.keyboard.press("Escape");
  await expect.poll(acrossBy, { timeout: 5000 }).toBe(0);
});

// Lines reaching out to a word cross the words above it on the way. The
// menu's own words are punched out of both line layers so that a line
// passes behind one rather than over it.
for (const [where, slide, layer] of [
  ["title", "slide-1", "menu-fan"],
  ["map", "slide-3", "menu-ray"],
]) {
  test(`on the ${where} slide, no line is drawn across a menu word`, async ({ page }) => {
    await page.goto("/index.html");
    if (slide !== "slide-1") {
      await jumpToSlide(page, slide);
      await waitForMapSettled(page);
    }
    await page.waitForTimeout(300);
    await page.locator(".menu-trigger").click();
    await page.waitForTimeout(1400);

    const words = await page.evaluate((layer) => {
      const overlay = document.getElementById("site-menu-overlay");
      const mask = document.getElementById(layer + "-mask");
      const group = mask.closest("svg").querySelector("g");
      const panel = overlay.getBoundingClientRect();
      // The fan is fixed to the window; the rays sit inside the panel.
      const origin = layer === "menu-fan" ? { left: 0, top: 0 } : panel;
      const holes = Array.from(mask.querySelectorAll('rect[fill="#000"]'));
      return Array.from(overlay.querySelectorAll(".menu-list li a")).map((link, i) => {
        const box = link.getBoundingClientRect();
        const hole = holes[i];
        const at = (name) => Number(hole.getAttribute(name));
        return {
          masked: group.getAttribute("mask") === `url(#${layer}-mask)`,
          clear:
            at("x") <= box.left - origin.left &&
            at("x") + at("width") >= box.right - origin.left &&
            at("y") <= box.top - origin.top &&
            at("y") + at("height") >= box.bottom - origin.top,
        };
      });
    }, layer);

    expect(words).toHaveLength(7);
    words.forEach((word, i) => {
      expect(word.masked, "the lines must be drawn through the knockout").toBe(true);
      expect(word.clear, `word ${i + 1} should be knocked out of the lines`).toBe(true);
    });
  });
}

test("on the map slide, the page inverts and the map falls into its centre", async ({ page }) => {
  await page.goto("/index.html");
  await jumpToSlide(page, "slide-3");
  await waitForMapSettled(page);

  const spread = () =>
    page.evaluate(() => {
      const r = window.__mapReadout;
      return Math.max(
        ...r.nodes.map((n) => Math.hypot(n.x - (r.hubX || 0), n.y - (r.hubY || 0)))
      );
    });

  const before = await spread();
  await page.locator(".menu-trigger").click();
  await page.waitForTimeout(900);

  expect(await page.evaluate(() => document.body.classList.contains("menu-invert"))).toBe(true);
  expect(await page.evaluate(() => window.__menuCollapse)).toBeGreaterThan(0.9);
  expect(await spread(), "nodes should be drawn into the centre").toBeLessThan(before * 0.25);

  // The map is the backdrop here, so it must not be dimmed the way the
  // page is behind the other two menus.
  const mapOpacity = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.getElementById("scroll-container")).opacity)
  );
  expect(mapOpacity, "the map is the menu here, not something behind it").toBeGreaterThan(0.9);

  // Closing puts everything back.
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.__menuCollapse), { timeout: 5000 }).toBe(0);
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains("menu-invert")), { timeout: 5000 })
    .toBe(false);
});

test("the menu still works normally on pages that are not the landing page", async ({ page }) => {
  // menu-modes.js only loads on index.html; everywhere else the plain
  // overlay nav.js builds is the whole of it.
  await page.goto("/contact.html");
  await page.locator(".menu-trigger").click();

  const cls = await overlayClass(page);
  expect(cls).toContain("open");
  expect(cls).not.toContain("mode-");
  await expect(page.locator(".menu-list a")).toHaveCount(7);
});
