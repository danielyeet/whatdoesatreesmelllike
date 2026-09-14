// ============================================================
// FAVORITES (the other half of categories/scent-descriptions.html)
//
// The second of the two views on that page: one big square in the
// middle with the rest of the pictures on a wide level ring going
// round it in three dimensions. These check the switch between the two
// views, the ring standing its pictures on one horizontal line with the
// near side in front of the square and the far side behind it, that the
// pictures are there from both sides, that the wheel is the only thing
// that turns them, that nothing is named until the flick has landed,
// and that picking a picture fades rather than cuts — a cut is the film
// going past, a fade is you choosing something.
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

test("the ring stands the pictures on one level line round the square", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  const ring = await page.evaluate(() => {
    const plate = document.getElementById("gallery-plate").getBoundingClientRect();
    return {
      plate: {
        x: plate.left + plate.width / 2,
        y: plate.top + plate.height / 2,
        bottom: plate.bottom,
        width: plate.width,
      },
      cards: [...document.querySelectorAll(".gallery-frame")].map((f) => {
        const r = f.getBoundingClientRect();
        return {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          size: r.width,
          // Its own shape, not the shape it is drawn as: a card turned
          // away from you is drawn narrower than it is, so the rendered
          // box says nothing about how it was cut.
          wide: f.offsetWidth,
          tall: f.offsetHeight,
          dim: parseFloat(f.style.getPropertyValue("--dim")),
        };
      }),
    };
  });

  expect(ring.cards.length).toBeGreaterThan(4);

  // One line, and a level one. A picture standing even slightly off eye
  // height is thrown further from the middle of the page the nearer it
  // is, and the line bows instead of running straight — so this is a
  // pixel or two, not "roughly".
  const ys = ring.cards.map((c) => c.y);
  expect(Math.max(...ys) - Math.min(...ys), `they should share one line: ${ys}`)
    .toBeLessThan(2);

  // It goes round the big square and stands close in to it: out past
  // both of its sides, but not away across the page with a gulf in
  // between where there is nothing at all.
  const xs = ring.cards.map((c) => c.x);
  const out = Math.max(...xs.map((x) => Math.abs(x - ring.plate.x)));
  expect(out, "some should stand out past the square's edge")
    .toBeGreaterThan(ring.plate.width * 0.5);
  expect(out, "and not away across the page from it")
    .toBeLessThan(ring.plate.width * 1.15);

  // A picture on the ring is a ninth of the big square: a third of its
  // height and a third of its width, so nine of them would tile it.
  ring.cards.forEach((card) => {
    expect(card.wide / ring.plate.width, "a third of the square across")
      .toBeCloseTo(1 / 3, 1);
    expect(card.tall / ring.plate.width, "and a third of it down")
      .toBeCloseTo(1 / 3, 1);
  });

  // Which way round the ring a picture has come is said by how big and
  // how strong it is drawn, since none of them is higher than another.
  const nearest = ring.cards.reduce((a, b) => (a.dim < b.dim ? a : b));
  const furthest = ring.cards.reduce((a, b) => (a.dim > b.dim ? a : b));
  expect(furthest.dim, "the furthest should be washed out").toBeGreaterThan(0.4);
  expect(nearest.dim, "the nearest should not be").toBeLessThan(0.1);
  expect(nearest.size / furthest.size, "the nearest drawn larger").toBeGreaterThan(1.4);

  // The ring and the square share a centre: the line runs straight
  // through the middle of the picture, and the near side of the ring
  // passes in front of it.
  expect(Math.abs(nearest.y - ring.plate.y), "level with the middle of the square")
    .toBeLessThan(2);
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

test("the wheel is the only thing that turns the ring", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await openFavorites(page);

  // Where the picture at the front of the ring is.
  const front = () =>
    page.evaluate(() => {
      const r = document.querySelectorAll(".gallery-frame")[0].getBoundingClientRect();
      return r.left + r.width / 2;
    });
  const places = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".gallery-frame")].map((f) => {
        const r = f.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      })
    );

  // Left alone it stands still: this ring only moves when it is moved.
  const settled = await front();
  await page.waitForTimeout(900);
  expect(Math.abs((await front()) - settled), "it should not drift").toBeLessThan(3);

  // Moving the pointer across it does nothing at all — not a lean, not
  // a turn, not a shift of where you are looking from.
  const scene = await page.locator("#gallery-scene").boundingBox();
  const before = await places();
  await page.mouse.move(scene.x + scene.width * 0.9, scene.y + scene.height * 0.85);
  await page.waitForTimeout(700);
  const after = await places();
  const moved = after.map((c, i) => Math.hypot(c[0] - before[i][0], c[1] - before[i][1]));
  expect(Math.max(...moved), "the pointer should leave the ring alone").toBeLessThan(1.5);

  // Dragging is not a way of turning it either.
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(scene.x + scene.width * 0.9 - i * 26, scene.y + scene.height * 0.85);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(Math.abs((await front()) - settled), "dragging should not turn it")
    .toBeLessThan(3);

  // The wheel does. Anticlockwise seen from above is the near side of
  // the ring travelling to the right.
  const plate = await page.locator(".gallery-plate").boundingBox();
  await page.mouse.move(plate.x + plate.width / 2, plate.y + plate.height / 2);
  const stood = await front();
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(600);
  expect((await front()) - stood, "scrolling down should carry the front to the right")
    .toBeGreaterThan(40);
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

  // Pointed at towards the corner the name is written in. Not dead
  // centre: the picture at the front of the ring stands there, and it
  // is a thing in its own right — the pointer is on it, not on the
  // square behind it.
  const box = await page.locator(".gallery-plate").boundingBox();
  await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.78);

  await expect
    .poll(() => name.evaluate((el) => parseFloat(getComputedStyle(el).opacity)), { timeout: 3000 })
    .toBeGreaterThan(0.9);
  // ...on a darkened corner, so it can be read over the picture.
  const shade = await page.locator(".gallery-plate").evaluate((el) =>
    parseFloat(getComputedStyle(el, "::after").opacity));
  expect(shade, "the corner should darken under it").toBeGreaterThan(0.9);

  // The pictures on the ring carry no name of their own: they are small
  // and they go past, and anything that lit up as the cursor crossed
  // them made the ring twitch rather than read.
  expect(await page.locator(".gallery-frame .gallery-hover-name").count()).toBe(0);

  // And the big square's name follows whatever is showing in it.
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

test("nothing on the big square answers the pointer until the flick lands", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();

  // Mid-flick every picture is taking its turn in the square, so naming
  // whichever one the cursor happens to catch is nonsense.
  await page.waitForSelector(".gallery-plate", { state: "visible" });
  const box = await page.locator(".gallery-plate").boundingBox();
  await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.78);
  await page.waitForTimeout(500);

  const flicking = await page.evaluate(() => ({
    landed: document.getElementById("gallery").classList.contains("landed"),
    shade: parseFloat(
      getComputedStyle(document.querySelector(".gallery-plate"), "::after").opacity),
    name: parseFloat(
      getComputedStyle(document.querySelector(".gallery-hover-name")).opacity),
  }));
  expect(flicking.landed, "the flick should still be running").toBe(false);
  expect(flicking.shade, "no shade while it is still flicking").toBeLessThan(0.05);
  expect(flicking.name, "and no name").toBeLessThan(0.05);

  // Once it has landed, with the pointer still where it was.
  await openFavorites(page);
  await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.78 + 1);
  await expect
    .poll(() => page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".gallery-hover-name")).opacity)),
      { timeout: 3000 })
    .toBeGreaterThan(0.9);
});

test("pointing at a picture on the ring brings it forward", async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await page.locator(".sheet-filter", { hasText: "Favorites" }).click();

  /**
   * A picture on the ring the pointer can actually reach, other than
   * the one at the front. Taken in order of how near the front of the
   * ring each one has come, and each one checked against what is
   * actually under that point: the far half of the ring is behind the
   * big square, so the widest one on the screen is quite often one you
   * could not point at if you tried.
   */
  const pickable = () =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll(".gallery-frame")];
      const nearest = cards
        .map((card, i) => ({ card: card, at: i, dim: parseFloat(card.style.getPropertyValue("--dim")) }))
        .filter((one) => one.at > 0)
        .sort((a, b) => a.dim - b.dim);
      for (const one of nearest) {
        const r = one.card.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const under = document.elementFromPoint(x, y);
        if (under && one.card.contains(under)) {
          return { at: one.at, x: x, y: y, width: r.width };
        }
      }
      return null;
    });
  const look = (at) =>
    page.evaluate((i) => {
      const card = document.querySelectorAll(".gallery-frame")[i];
      const face = card.querySelector(".gallery-face");
      return {
        grown: getComputedStyle(face).transform,
        edge: getComputedStyle(face).borderTopColor,
        wash: parseFloat(getComputedStyle(face, "::before").opacity),
      };
    }, at);

  // Nothing answers while the flick is still running.
  await page.waitForSelector(".gallery-frame", { state: "attached" });
  await page.waitForFunction(
    () => document.querySelectorAll(".gallery-frame.in-ring").length > 2,
    null,
    { timeout: 20000 }
  );
  const mid = await pickable();
  await page.mouse.move(mid.x, mid.y);
  await page.waitForTimeout(400);
  if (!(await page.evaluate(() => document.getElementById("gallery").classList.contains("landed")))) {
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.querySelector(".gallery-frame")).getPropertyValue("--pick").trim()),
      "nothing picked out while it is still flicking"
    ).toBe("");
  }

  await openFavorites(page);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);

  const card = await pickable();
  const resting = await look(card.at);
  await page.mouse.move(card.x, card.y);
  await page.waitForTimeout(600);
  const held = await look(card.at);

  // It grows, it comes out from under the wash that places it in the
  // ring, and it takes the darker edge.
  expect(held.grown, "it should be drawn larger").not.toBe(resting.grown);
  expect(held.grown).toMatch(/^matrix3d\(1\.1/);
  expect(held.wash, "and come out from under the wash").toBeLessThan(0.02);
  expect(held.edge, "and take the darker edge").not.toBe(resting.edge);

  // And no shade drawn across it, and no name written on it. The shade
  // is asked about by whether it is drawn at all rather than by how
  // faint it is: a pseudo-element with no content of its own is not
  // there, and reports an opacity of 1 while drawing nothing.
  expect(await page.locator(".gallery-frame .gallery-hover-name").count()).toBe(0);
  expect(
    await page.evaluate((i) =>
      getComputedStyle(
        document.querySelectorAll(".gallery-frame")[i].querySelector(".gallery-face"),
        "::after").content, card.at),
    "no shade over a picture on the ring"
  ).toBe("none");
});
