// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: one big square in the
// middle with the rest of the pictures on a ring going round it in
// three dimensions. These check the switch between the two views, the
// ring's arithmetic and the depth cues that make it read as a ring
// rather than as a circle drawn on the page, that the pictures are
// there from both sides, which way scrolling turns them, that moving
// the pointer moves everything except the big square, and that picking
// a picture fades rather than cuts — a cut is the film going past, a
// fade is you choosing something.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PAGE = "/categories/scent-descriptions.html";

const plateName = (page) =>
  page.locator(".gallery-plate > .sheet-number").textContent();

/** Open Favorites and wait for its ring to fill. */
async function openFavorites(page) {
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForFunction(
    () => {
      const frames = [...document.querySelectorAll(".gallery-frame")];
      return frames.length > 0 && frames.every((f) => f.classList.contains("in-ring"));
    },
    null,
    { timeout: 20000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page opens on the map, with favorites out of the way", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display)
  ).toBe("none");
  expect(errors).toEqual([]);
});

test("choosing favorites takes the map away and brings the ring up", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  await openFavorites(page);

  // One view at a time: the map is gone from the page, not merely faded.
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).toBe("none");
  await expect(page.locator(".gallery-frame").first()).toBeVisible();
  await expect(page.locator(".sheet-filter", { hasText: "Favorites" })).toHaveClass(/chosen/);

  // And back again.
  await page.locator(".sheet-filter", { hasText: "Description portfolio" }).click();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.getElementById("gallery")).display),
      { timeout: 6000 })
    .toBe("none");
  expect(
    await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).display)
  ).not.toBe("none");
});

test("the big square flicks through the favourites and ends on the first", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();

  // Sample what the big square is showing, often enough to catch the
  // fast part of the run.
  const seen = [];
  for (let i = 0; i < 40; i++) {
    seen.push(await page.evaluate(() => {
      const mark = document.querySelector(".gallery-plate > .sheet-number");
      return mark ? mark.textContent : "";
    }));
    await page.waitForTimeout(70);
  }
  const distinct = new Set(seen.filter(Boolean));
  expect(distinct.size, `should flick through several, saw ${[...distinct]}`).toBeGreaterThan(2);

  await openFavorites(page);
  expect(await plateName(page), "it lands on the first").toBe("f1");
});

test("the ring stands the pictures round the square, front to back", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const ring = await page.evaluate(() => {
    const plate = document.getElementById("gallery-plate").getBoundingClientRect();
    return {
      plate: { x: plate.left + plate.width / 2, y: plate.top + plate.height / 2 },
      cards: [...document.querySelectorAll(".gallery-frame")].map((f) => {
        const r = f.getBoundingClientRect();
        return {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          size: r.width,
          dim: parseFloat(f.style.getPropertyValue("--dim")),
        };
      }),
    };
  });

  expect(ring.cards.length).toBeGreaterThan(4);
  // It goes round the big square: pictures out past both of its sides.
  const xs = ring.cards.map((c) => c.x);
  expect(Math.min(...xs), "some should stand left of the square").toBeLessThan(ring.plate.x - 100);
  expect(Math.max(...xs), "and some to the right").toBeGreaterThan(ring.plate.x + 100);

  // The three cues that make a circle read as a ring lying away from
  // you: the near ones are drawn larger, lower down the page, and the
  // far ones are washed out towards the colour of the paper.
  //
  // Which is nearest is taken from how far round the ring each one has
  // come, not from how wide it is drawn: a picture at the side of the
  // ring is turned edge-on to you and is the narrowest thing on the
  // page while being no further away than the square itself.
  const nearest = ring.cards.reduce((a, b) => (a.dim < b.dim ? a : b));
  const furthest = ring.cards.reduce((a, b) => (a.dim > b.dim ? a : b));
  expect(furthest.dim, "the furthest should be washed out").toBeGreaterThan(0.4);
  expect(nearest.dim, "the nearest should not be").toBeLessThan(0.1);
  expect(nearest.size / furthest.size, "the nearest drawn larger").toBeGreaterThan(1.4);
  expect(nearest.y, "the nearest should sit lowest").toBeGreaterThan(furthest.y);

  // The near side passes in front of the square and the far side
  // behind it — which is the whole point of putting them in one space.
  expect(nearest.y, "the near side passes below the middle").toBeGreaterThan(ring.plate.y);
  expect(furthest.y, "the far side above it").toBeLessThan(ring.plate.y);
});

test("every picture on the ring has a face on both sides", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const cards = await page.evaluate(() =>
    [...document.querySelectorAll(".gallery-frame")].map((f) => ({
      faces: [...f.querySelectorAll(".gallery-face")].map((s) => s.style.transform),
      // The same picture on both, not a blank back.
      same: new Set([...f.querySelectorAll(".gallery-face")].map((s) =>
        s.style.getPropertyValue("--hatch-angle") + "|" + (s.querySelector("img") || {}).src
      )).size,
      hidden: [...f.querySelectorAll(".gallery-face")].map((s) =>
        getComputedStyle(s).backfaceVisibility),
    }))
  );

  for (const card of cards) {
    expect(card.faces.length, "two faces").toBe(2);
    expect(card.faces.some((t) => /rotateY\(0deg\)/.test(t)), "one facing out").toBe(true);
    expect(card.faces.some((t) => /rotateY\(180deg\)/.test(t)), "one facing back").toBe(true);
    expect(card.same, "the same picture on both").toBe(1);
    // Without this you see through the near face to the far one.
    expect(new Set(card.hidden)).toEqual(new Set(["hidden"]));
  }
});

test("scrolling turns the ring anticlockwise, and nothing turns on its own", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  // Where the picture at the front of the ring is.
  const front = () =>
    page.evaluate(() => {
      const r = document.querySelectorAll(".gallery-frame")[0].getBoundingClientRect();
      return r.left + r.width / 2;
    });

  // Left alone it stands still: this ring only moves when it is moved.
  const settled = await front();
  await page.waitForTimeout(900);
  expect(Math.abs((await front()) - settled), "it should not drift").toBeLessThan(3);

  const plate = await page.locator(".gallery-plate").boundingBox();
  await page.mouse.move(plate.x + plate.width / 2, plate.y + plate.height / 2);
  const before = await front();
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(600);
  const after = await front();

  // Anticlockwise seen from above is the near side of the ring
  // travelling to the right.
  expect(after - before, "scrolling down should carry the front to the right")
    .toBeGreaterThan(40);
});

test("moving the pointer moves everything but the big square", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const scene = await page.locator("#gallery-scene").boundingBox();
  const look = () =>
    page.evaluate(() => {
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      };
      return {
        plate: box(document.getElementById("gallery-plate")),
        cards: [...document.querySelectorAll(".gallery-frame")].map(box),
      };
    });

  await page.mouse.move(scene.x + scene.width / 2, scene.y + scene.height / 2);
  await page.waitForTimeout(500);
  const still = await look();
  await page.mouse.move(scene.x + scene.width * 0.9, scene.y + scene.height * 0.8);
  await page.waitForTimeout(700);
  const leaning = await look();

  const moved = leaning.cards.map((c, i) =>
    Math.hypot(c[0] - still.cards[i][0], c[1] - still.cards[i][1]));
  expect(Math.max(...moved), "the ring should answer the pointer").toBeGreaterThan(20);
  expect(
    Math.hypot(leaning.plate[0] - still.plate[0], leaning.plate[1] - still.plate[1]),
    "the big square should not move at all"
  ).toBeLessThan(1.5);
});

test("picking one from the ring fades it into the big square", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);
  expect(await plateName(page)).toBe("f1");

  // Dispatched rather than clicked at a point: the pictures overlap in
  // the ring, so a click at a place could land on the one in front.
  await page.locator(".gallery-frame").nth(4).dispatchEvent("click");

  // Mid-change, both layers are on screen — that is what makes it a
  // fade. A cut would have one at 1 and the other at 0 throughout.
  await page.waitForTimeout(220);
  const layers = await page.evaluate(() =>
    [...document.querySelectorAll(".gallery-layer")].map((l) =>
      parseFloat(getComputedStyle(l).opacity))
  );
  const between = layers.filter((o) => o > 0.05 && o < 0.95);
  expect(between.length, `one should be coming up as the other goes: ${layers}`).toBe(2);

  await expect.poll(() => plateName(page), { timeout: 4000 }).toBe("f5");
  await expect(page.locator(".gallery-frame").nth(4)).toHaveClass(/chosen/);
});

test("the ring can be dragged round", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const where = () =>
    page.evaluate(() => {
      const f = document.querySelectorAll(".gallery-frame")[0].getBoundingClientRect();
      return f.left + f.width / 2;
    });

  const before = await where();
  // A press at a point outside the window is not delivered at all.
  await page.locator("#gallery-scene").scrollIntoViewIfNeeded();
  const box = await page.locator("#gallery-scene").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.12);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(box.x + box.width / 2 - i * 22, box.y + box.height * 0.12);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();

  const after = await where();
  expect(Math.abs(after - before), "the ring should have turned").toBeGreaterThan(60);
});

test("the whole view fits on one screen, with nothing to scroll to", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const fit = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    window: window.innerHeight,
  }));
  expect(fit.page, `page is ${fit.page}px in a ${fit.window}px window`)
    .toBeLessThanOrEqual(fit.window + 2);
});

test("pointing at the big square brings up the name of what is in it", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const name = page.locator(".gallery-plate .gallery-hover-name");
  await expect(name).toHaveText("Placeholder 1");
  expect(
    await name.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
    "not there until it is pointed at"
  ).toBeLessThan(0.05);

  const box = await page.locator(".gallery-plate").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  await expect
    .poll(() => name.evaluate((el) => parseFloat(getComputedStyle(el).opacity)), { timeout: 3000 })
    .toBeGreaterThan(0.9);
  // ...on a darkened corner, so it can be read over the picture.
  const shade = await page.locator(".gallery-plate").evaluate((el) =>
    parseFloat(getComputedStyle(el, "::after").opacity));
  expect(shade, "the corner should darken under it").toBeGreaterThan(0.9);

  // The pictures on the ring each carry one of their own, one at a
  // time — they are not all written at once.
  const onRing = page.locator(".gallery-frame .gallery-hover-name");
  expect(await onRing.count()).toBeGreaterThan(0);
  expect(
    await onRing.evaluateAll((els) =>
      els.filter((el) => parseFloat(getComputedStyle(el).opacity) > 0.05).length),
    "none of the ring's names until one is pointed at"
  ).toBe(0);

  // And the big square's follows whatever is showing in it.
  await page.locator(".gallery-frame").nth(4).dispatchEvent("click");
  await expect(name).toHaveText("Placeholder 5");
});

test("with animation turned off, favorites arrives finished", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await page.waitForTimeout(400);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();
  await page.waitForTimeout(400);

  const inRing = await page.$$eval(".gallery-frame.in-ring", (els) => els.length);
  const frames = await page.$$eval(".gallery-frame", (els) => els.length);
  expect(inRing, "no flick to sit through").toBe(frames);
  expect(await plateName(page)).toBe("f1");
});
