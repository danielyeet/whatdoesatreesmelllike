// ============================================================
// THE CONTACT SHEET (categories/scent-descriptions.html)
//
// The page opens white with one square window in the middle, every
// picture flicks through it, it settles on the first, and lines then
// grow down to the rest. These check the parts of that which can be
// wrong rather than merely ugly — above all that no line is drawn
// across a picture on its way to another one, which is what the
// layout is arranged in bands to prevent.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/**
 * Which frame is showing in the middle window right now, or -1.
 *
 * "Showing" means you can actually see it. Asking only whether it is
 * visible by the `visibility` property is not enough and once cost a
 * real bug: a rule written for the pictures' arrival left every frame
 * at zero opacity during the flick, so the window was blank for three
 * seconds while this still reported a picture in it.
 */
const showing = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".sheet-frame")].findIndex((f) => {
      const style = getComputedStyle(f);
      return style.visibility === "visible" && parseFloat(style.opacity) > 0.5;
    })
  );

/** Wait for the whole sequence — flick, settle, every line drawn. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      return frames.length > 1 && frames.slice(1).every((f) => f.classList.contains("landed"));
    },
    null,
    { timeout: 20000 }
  );
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the page opens white, with one picture in the middle and nothing else", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(SHEET);

  // Exactly one frame showing, and it is the middle window rather than
  // a grid — the rest are stacked behind it.
  await expect.poll(() => showing(page), { timeout: 4000 }).toBeGreaterThanOrEqual(0);
  const visible = await page.$$eval(".sheet-frame", (frames) =>
    frames.filter((f) => getComputedStyle(f).visibility === "visible").length
  );
  expect(visible, "one picture at a time").toBe(1);

  // The two buttons are not there yet: they arrive once the page has
  // finished drawing itself.
  const buttons = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector(".sheet-filters")).opacity));
  expect(buttons, "the buttons wait for the page to finish").toBeLessThan(0.05);

  expect(errors).toEqual([]);
});

test("the pictures flick through the window, then it settles on the first", async ({ page }) => {
  await page.goto(SHEET);

  // Sample what is showing, often enough to catch the fast part of the
  // run at the start.
  const seen = [];
  for (let i = 0; i < 24; i++) {
    seen.push(await showing(page));
    await page.waitForTimeout(60);
  }
  const distinct = new Set(seen.filter((i) => i >= 0));
  expect(distinct.size, `should flick through several pictures, saw ${[...distinct]}`).toBeGreaterThan(2);

  await waitForSheet(page);
  expect(await showing(page), "it settles on the first picture").toBe(0);
});

test("the picture it settles on stays exactly where it was", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForTimeout(500);
  const before = await page.locator(".sheet-frame").first().boundingBox();

  await waitForSheet(page);
  const after = await page.locator(".sheet-frame").first().boundingBox();

  expect(Math.abs(after.x - before.x), "should not shift sideways").toBeLessThan(1);
  expect(Math.abs(after.y - before.y), "should not shift up or down").toBeLessThan(1);
  expect(Math.abs(after.width - before.width), "and should not resize").toBeLessThan(1);
});

// Regression test: an early version of this page ran every line off one
// band of horizontals under the top picture, so a line reaching a
// picture in the second row was drawn straight across a picture in the
// first. The lines now go at whatever angle they like, so nothing about
// the layout keeps them clear — instead a link that would cut through
// another picture is not made at all, and the picture it would have
// reached is left unlinked.
test("no line is drawn across a picture", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const crossings = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const boxes = [...document.querySelectorAll(".sheet-frame")].map((f) => {
      const r = f.getBoundingClientRect();
      // Pulled in a little, so a line stopping just off a picture's
      // edge is never counted as going through it.
      return {
        left: r.left - base.left + 2, right: r.right - base.left - 2,
        top: r.top - base.top + 2, bottom: r.bottom - base.top - 2,
      };
    });

    // The same clipping test the page itself uses to decide this.
    const cuts = (from, to, box) => {
      const dx = to.x - from.x, dy = to.y - from.y;
      const edges = [
        [-dx, from.x - box.left], [dx, box.right - from.x],
        [-dy, from.y - box.top], [dy, box.bottom - from.y],
      ];
      let near = 0, far = 1;
      for (const [along, room] of edges) {
        if (along === 0) { if (room < 0) return false; continue; }
        const at = room / along;
        if (along < 0) near = Math.max(near, at);
        else far = Math.min(far, at);
        if (near > far) return false;
      }
      return true;
    };

    const found = [];
    [...document.querySelectorAll(".sheet-route")].forEach((route) => {
      const from = { x: +route.getAttribute("x1"), y: +route.getAttribute("y1") };
      const to = { x: +route.getAttribute("x2"), y: +route.getAttribute("y2") };
      const ends = [Number(route.dataset.from), Number(route.dataset.to)];
      boxes.forEach((box, i) => {
        if (ends.indexOf(i) >= 0) return;  // the two it belongs to
        if (cuts(from, to, box)) found.push({ line: ends.join("-"), through: i + 1 });
      });
    });
    return found;
  });

  expect(crossings, `lines crossing pictures: ${JSON.stringify(crossings)}`).toEqual([]);
});

test("every line stops just off the pictures it joins", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const gaps = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const out = [];
    [...document.querySelectorAll(".sheet-route")].forEach((route) => {
      [["x1", "y1", "from"], ["x2", "y2", "to"]].forEach(([xa, ya, which]) => {
        const x = +route.getAttribute(xa), y = +route.getAttribute(ya);
        const r = frames[Number(route.dataset[which])].getBoundingClientRect();
        const left = r.left - base.left, top = r.top - base.top;
        // How far the end of the line is from the picture it belongs to.
        const dx = Math.max(left - x, 0, x - (left + r.width));
        const dy = Math.max(top - y, 0, y - (top + r.height));
        out.push({ line: route.dataset.from + "-" + route.dataset.to, gap: Math.hypot(dx, dy) });
      });
    });
    return out;
  });

  expect(gaps.length, "there should be lines to check").toBeGreaterThan(4);
  gaps.forEach((end) => {
    // It has to reach its picture without touching it: the same clear
    // space at both ends, so the lines read as joining rather than
    // being pinned on.
    expect(end.gap, `line ${end.line} should stop just off its picture`).toBeGreaterThan(3);
    expect(end.gap, `line ${end.line} should not stop short of it`).toBeLessThan(16);
  });
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
// page sideways at exactly the moment the flick stopped — the whole
// thing looked like it twitched. Room is kept for the scrollbar from
// the start, so nothing moves.
test("nothing shifts sideways when the page grows", async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForTimeout(400);

  const buttonsAt = () =>
    page.locator(".sheet-filters").evaluate((el) => el.getBoundingClientRect().left);
  const before = await buttonsAt();

  await waitForSheet(page);
  expect(Math.abs((await buttonsAt()) - before), "the buttons should not move").toBeLessThan(1);

  const gutter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollbarGutter);
  expect(gutter, "the room for the scrollbar is what keeps them still").toContain("stable");
});

// The map is meant to be watched drawing itself: a line travels to a
// picture, the picture comes up, and only then do its own lines set
// off. Everything arriving together is the one thing it must not do.
test("the pictures arrive one after another, spreading outwards", async ({ page }) => {
  await page.goto(SHEET);

  await page.evaluate(() => {
    window.__arrivals = [];
    const seen = new Set();
    const started = performance.now();
    const tick = () => {
      document.querySelectorAll(".sheet-frame.landed").forEach((frame) => {
        const name = frame.querySelector(".sheet-number").textContent;
        if (seen.has(name)) return;
        seen.add(name);
        window.__arrivals.push(Math.round(performance.now() - started));
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await waitForSheet(page);
  const arrivals = await page.evaluate(() => window.__arrivals);

  expect(arrivals.length).toBeGreaterThan(8);
  const spread = arrivals[arrivals.length - 1] - arrivals[1];
  expect(spread, "the map should take its time about it").toBeGreaterThan(1800);

  // No two pictures land in the same instant. A little tolerance: two
  // lines can finish within a frame or two of each other.
  // Two can happen to land close together — that reads as a map being
  // drawn, not as a fault. What matters is the pace of the whole run,
  // so this measures the middle gap between one picture and the next
  // rather than the closest pair: a map that drew itself in bursts
  // would have a middle gap near zero.
  const gaps = arrivals.slice(2).map((at, i) => at - arrivals[i + 1]).sort((a, b) => a - b);
  const middle = gaps[Math.floor(gaps.length / 2)];
  expect(middle, `pictures arrived at ${arrivals.join(", ")}`).toBeGreaterThan(80);
});

test("every picture is still a link to a piece", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const hrefs = await page.$$eval(".sheet-frame", (frames) => frames.map((f) => f.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  hrefs.forEach((href) => expect(href, "a frame with nowhere to go is not a piece").toBeTruthy());
});

// Regression test: the flick used to run to wherever it happened to get
// to and then cut to the first picture once it was over, which was one
// blink too many — the run now ENDS on that picture. Nothing may change
// in the window between the last cut of the flick and the settled page.
test("the flick ends on the picture it keeps, with no last blink", async ({ page }) => {
  await page.goto(SHEET);

  await page.evaluate(() => {
    window.__run = [];
    const sheet = document.getElementById("sheet");
    const tick = () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      window.__run.push({
        showing: frames.findIndex((f) => getComputedStyle(f).visibility === "visible"),
        settled: sheet.classList.contains("settled"),
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await waitForSheet(page);
  const run = await page.evaluate(() => window.__run);

  const lastOfFlick = [...run].reverse().find((f) => !f.settled && f.showing >= 0);
  const firstSettled = run.find((f) => f.settled && f.showing >= 0);
  expect(lastOfFlick, "the flick should have been caught running").toBeTruthy();
  expect(firstSettled, "it should have settled").toBeTruthy();
  expect(
    firstSettled.showing,
    `the flick ended on picture ${lastOfFlick.showing + 1} and the page kept ${firstSettled.showing + 1}`
  ).toBe(lastOfFlick.showing);
});

test("the two buttons arrive once the page has drawn itself", async ({ page }) => {
  await page.goto(SHEET);

  const buttons = page.locator(".sheet-filter");
  await expect(buttons).toHaveCount(2);
  await expect(buttons).toHaveText(["Description portfolio", "Favorites"]);

  const showingButtons = () =>
    page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".sheet-filters")).opacity));

  // Not there while the pictures are still flicking through.
  expect(await showingButtons()).toBeLessThan(0.05);

  // Nor while the map is still drawing itself.
  await waitForSheet(page);
  await expect.poll(showingButtons, { timeout: 6000 }).toBeGreaterThan(0.9);

  // They sit across the top of the page rather than in it, between the
  // Menu on the left and the Search on the right.
  const where = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".sheet-filters"));
    const box = document.querySelector(".sheet-filters").getBoundingClientRect();
    return { fixed: style.position, top: box.top, middle: box.left + box.width / 2 };
  });
  expect(where.fixed).toBe("fixed");
  expect(where.top, "up at the top of the page").toBeLessThan(70);
  expect(Math.abs(where.middle - 640), "across the middle of it").toBeLessThan(40);

  // The page opens on the map, and says so.
  await expect(buttons.nth(0)).toHaveClass(/chosen/);
  await expect(buttons.nth(1)).not.toHaveClass(/chosen/);
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

// Every picture is joined to something. Dropping links is what keeps the
// map from being one tidy fan out of the middle, but a picture with no
// line at all reads as forgotten rather than as loosely joined.
test("the whole map is one network, with no picture and no island left out",
  async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const map = await page.evaluate(() => {
    const count = document.querySelectorAll(".sheet-frame").length;
    const joins = [...document.querySelectorAll(".sheet-route")].map((route) => [
      Number(route.dataset.from), Number(route.dataset.to),
    ]);
    // Which pictures can reach which, following the lines.
    const part = [...Array(count).keys()];
    const partOf = (i) => { while (part[i] !== i) { part[i] = part[part[i]]; i = part[i]; } return i; };
    joins.forEach(([a, b]) => { part[partOf(a)] = partOf(b); });
    const parts = {};
    for (let i = 0; i < count; i++) (parts[partOf(i)] = parts[partOf(i)] || []).push(i + 1);
    const lines = new Array(count).fill(0);
    joins.forEach(([a, b]) => { lines[a]++; lines[b]++; });
    return {
      count: count,
      parts: Object.values(parts),
      alone: lines.map((n, i) => (n === 0 ? i + 1 : 0)).filter(Boolean),
      ends: lines.map((n, i) => (n === 1 ? i + 1 : 0)).filter(Boolean),
    };
  });

  expect(map.count, "there should be pictures on the sheet").toBeGreaterThan(4);
  // A picture with no line at all reads as forgotten...
  expect(map.alone, `pictures with nothing joined to them: ${map.alone}`).toEqual([]);
  // ...and one on the end of a single line is a dead end: the map stops
  // there rather than carrying on. Every picture is a place the route
  // goes through, not a stub.
  expect(
    map.ends,
    `pictures with only one line: ${JSON.stringify(map.ends)}`
  ).toEqual([]);
  // ...and two joined only to each other, with no way back to the rest,
  // read the same way. The whole sheet has to be one network.
  expect(
    map.parts.length,
    `the map falls into ${map.parts.length} parts: ${JSON.stringify(map.parts)}`
  ).toBe(1);
});

test("the search finds a picture by what it is called", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const field = page.locator(".sheet-search-field");
  await expect(field).toBeHidden(); // a button until it is asked for

  await page.locator(".sheet-search-trigger").click();
  await expect(field).toBeVisible();

  await field.fill("history");
  // One picture is called that; everything else steps back.
  const dimmed = await page.$$eval(".sheet-frame.dimmed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(dimmed, "everything that doesn't match should step back").toBe(frames - 1);
  await expect(page.locator(".sheet-frame:not(.dimmed) .sheet-caption")).toHaveText(
    "A short history of vetiver"
  );

  // Escape clears it and puts the sheet back.
  await field.press("Escape");
  expect(await page.$$eval(".sheet-frame.dimmed", (els) => els.length)).toBe(0);
  await expect(field).toBeHidden();
});

test("with animation turned off it goes straight to the finished sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHEET);

  // No flick to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
});

test("pointing at a picture lifts it out of the page without moving it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const frame = page.locator(".sheet-frame").nth(3);
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  const look = () =>
    frame.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        centre: [r.left + r.width / 2, r.top + r.height / 2],
        turn: getComputedStyle(el).transform,
      };
    });

  const resting = await look();

  // Pointed at near one corner...
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.15);
  await page.waitForTimeout(500);
  const tipped = await look();

  expect(tipped.turn, "it should leave its plane").toMatch(/^matrix3d/);
  expect(tipped.turn).not.toBe(resting.turn);

  // ...but turned about its own middle, which stays where the picture
  // was laid out. The exact statement of that is that the moving part
  // of its transform — the last two numbers, where on the sheet it
  // has been put — is untouched by the pointer.
  const where = (matrix) => matrix.slice(9, -1).split(",").slice(12, 14).map(Number);
  expect(where(tipped.turn), "it should not be moved, only turned")
    .toEqual(where(resting.turn));
  // Which leaves the picture drawn all but exactly where it was: a
  // turned square seen in perspective is a little wider on the near
  // side, so its outline shifts by a pixel or two even though what it
  // is turning about has not moved at all.
  expect(
    Math.hypot(tipped.centre[0] - resting.centre[0], tipped.centre[1] - resting.centre[1]),
    "and should stay where it was drawn"
  ).toBeLessThan(4);

  // The rest of the page steps back while it is held.
  const others = await page.evaluate(() =>
    [...document.querySelectorAll(".sheet-frame")]
      .filter((f) => !f.matches(":hover"))
      .map((f) => parseFloat(getComputedStyle(f).opacity))
  );
  // Dimmed, but only just: the map has to stay readable behind the one
  // being held.
  expect(Math.max(...others), "everything else should dim").toBeLessThan(0.8);
  expect(Math.max(...others), "but not go away").toBeGreaterThan(0.4);

  // It follows the cursor rather than striking one pose.
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.85);
  await page.waitForTimeout(500);
  const other = await look();
  expect(other.turn, "it should follow the pointer").not.toBe(tipped.turn);

  // And everything comes back when the pointer leaves.
  await page.mouse.move(middle.x, box.y - 80);
  await page.waitForTimeout(600);
  const back = await page.evaluate(() =>
    [...document.querySelectorAll(".sheet-frame")].map((f) =>
      parseFloat(getComputedStyle(f).opacity))
  );
  expect(Math.min(...back), "and come back afterwards").toBeGreaterThan(0.9);
});

test("a date is written along its line rather than switched on", async ({ page }) => {
  await page.goto(SHEET);

  // Watch the dates arrive. Written on, in this page, means the
  // lettering is uncovered from its left end rather than faded up
  // whole — so there have to be moments where a date is half written.
  // A date that simply appeared would go from covered to uncovered
  // with nothing in between, and none of these samples would catch it.
  const run = await page.evaluate(
    () =>
      new Promise((done) => {
        const seen = [];
        const until = performance.now() + 12000;
        const look = () => {
          const dates = [...document.querySelectorAll(".sheet-date")];
          for (const date of dates) {
            const clip = getComputedStyle(date).clipPath;
            // Part written: a width the browser is still working out,
            // rather than either end of the journey.
            if (clip.includes("calc(") && !/calc\(\s*0%/.test(clip) && !clip.includes("100%")) {
              seen.push(clip);
            }
          }
          const finished =
            dates.length > 0 && dates.every((d) => d.classList.contains("shown"));
          if ((finished && performance.now() > 2000) || performance.now() > until) {
            done({ seen, count: dates.length });
            return;
          }
          requestAnimationFrame(look);
        };
        look();
      })
  );

  expect(run.count, "there should be dates on the lines").toBeGreaterThan(2);
  expect(run.seen.length, "one should be caught half written").toBeGreaterThan(3);

  // And every one ends up written in full.
  await waitForSheet(page);
  await page.waitForTimeout(900);
  const ends = await page.$$eval(".sheet-date", (els) =>
    els.map((el) => getComputedStyle(el).clipPath));
  expect(ends.every((clip) => /calc\(\s*0%|(^|\s)-2px/.test(clip)),
    `all written in full: ${ends.join(" | ")}`).toBe(true);
});

test("the page never shows its own contents before the sheet takes over",
  async ({ page }) => {
  // A REGRESSION TEST, and a deterministic one: the page records what
  // it looked like on every frame rather than the test trying to catch
  // the right moment. Between the first paint and contact-sheet.js
  // taking over, the browser used to show the page as it is written —
  // every picture in a plain grid and the favourites listed under them
  // — and then have all of it swept away, which reads as the page
  // blinking its whole contents at you before it starts.
  await page.addInitScript(() => {
    window.__flashed = 0;
    window.__placed = null;
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet) {
        const seen = [...document.querySelectorAll(".sheet-frame, .gallery-entry")]
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

test("nothing on the sheet answers the pointer until it has settled", async ({ page }) => {
  // Recorded by the page itself on every frame rather than the test
  // trying to photograph the right moment: the flick takes about three
  // seconds from the moment the script runs, and on a busy machine the
  // page can be most of the way through it before a test could look.
  await page.addInitScript(() => {
    window.__answered = { tipped: 0, peeked: 0, frames: 0 };
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet && sheet.classList.contains("scripted") &&
          !sheet.classList.contains("settled")) {
        window.__answered.frames++;
        if (sheet.classList.contains("peeking")) window.__answered.peeked++;
        [...document.querySelectorAll(".sheet-frame")].forEach((frame) => {
          const turn = frame.style.getPropertyValue("--turn-y");
          if (turn && parseFloat(turn) !== 0) window.__answered.tipped++;
        });
      }
      if (performance.now() < 8000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  // The pointer is put where the middle window will be BEFORE the page
  // is opened, so it is over a picture for the whole of the flick.
  await page.mouse.move(640, 300);
  await page.goto(SHEET);
  await waitForSheet(page);

  const seen = await page.evaluate(() => window.__answered);
  expect(seen.frames, "the flick should have been watched").toBeGreaterThan(10);
  expect(seen.tipped, "nothing should be tipped while the page is still drawing itself")
    .toBe(0);
  expect(seen.peeked, "and nothing held").toBe(0);

  // Non-vacuous: that really is a place where a picture ends up, so
  // the pointer was over one the whole time.
  const plate = await page.locator(".sheet-frame.is-plate").boundingBox();
  expect(640 > plate.x && 640 < plate.x + plate.width &&
         300 > plate.y && 300 < plate.y + plate.height,
    `the pointer at 640,300 should be over the plate at ${JSON.stringify(plate)}`).toBe(true);

  // Once the page has drawn itself, the same pointer does work.
  const frame = page.locator(".sheet-frame").nth(2);
  await frame.scrollIntoViewIfNeeded();
  const on = await frame.boundingBox();
  await page.mouse.move(on.x + on.width * 0.25, on.y + on.height * 0.25);
  await expect
    .poll(() => frame.evaluate((el) => el.style.getPropertyValue("--turn-y")),
      { timeout: 3000 })
    .not.toBe("");
});

test("every line carries a date, and no date lands on a picture", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // The last lines drawn are the ones that close loops: they only set
  // off once both of the pictures they join have arrived, so the sheet
  // can be finished while a couple of dates are still being written.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.querySelectorAll(".sheet-date.shown").length -
            document.querySelectorAll(".sheet-route").length
        ),
      { timeout: 12000 }
    )
    .toBe(0);

  const read = await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const base = sheet.getBoundingClientRect();
    const rel = (el, pad) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - base.left + pad, right: r.right - base.left - pad,
        top: r.top - base.top + pad, bottom: r.bottom - base.top - pad,
      };
    };
    const frames = [...document.querySelectorAll(".sheet-frame")];
    const dates = [...document.querySelectorAll(".sheet-date")];

    // A date's own turned rectangle, not the upright box around it: a
    // date written along a diagonal fills a fraction of that box, and
    // testing the box calls a perfectly clear date a collision.
    const quadOf = (text) => {
      const b = text.getBBox();
      const m = /translate\(([-\d.]+),([-\d.]+)\)\s*rotate\(([-\d.]+)\)/
        .exec(text.getAttribute("transform"));
      const turn = (+m[3]) * Math.PI / 180, cx = +m[1], cy = +m[2];
      const co = Math.cos(turn), si = Math.sin(turn);
      return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height],
              [b.x, b.y + b.height]]
        .map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]);
    };
    // Two shapes are clear of each other if some line can be drawn
    // between them; it is enough to try the ones along their own edges.
    const overlaps = (quad, box) => {
      const other = [[box.left, box.top], [box.right, box.top],
                     [box.right, box.bottom], [box.left, box.bottom]];
      const edges = (poly) => poly.map((p, i) => {
        const q = poly[(i + 1) % poly.length];
        return [-(q[1] - p[1]), q[0] - p[0]];
      });
      for (const axis of [...edges(quad), ...edges(other)]) {
        const span = (poly) => poly.reduce((acc, p) => {
          const at = p[0] * axis[0] + p[1] * axis[1];
          return [Math.min(acc[0], at), Math.max(acc[1], at)];
        }, [Infinity, -Infinity]);
        const one = span(quad), two = span(other);
        if (one[1] < two[0] || two[1] < one[0]) return false;
      }
      return true;
    };

    const over = [];
    dates.forEach((date) => {
      const quad = quadOf(date);
      frames.forEach((frame, i) => {
        if (overlaps(quad, rel(frame, 2))) over.push(`${date.textContent} on picture ${i + 1}`);
        const caption = frame.querySelector(".sheet-caption");
        if (caption && i > 0 && overlaps(quad, rel(caption, 1))) {
          over.push(`${date.textContent} on caption ${i + 1}`);
        }
      });
    });

    return {
      lines: document.querySelectorAll(".sheet-route").length,
      dates: dates.length,
      written: dates.filter((d) => d.classList.contains("shown")).length,
      over: over,
    };
  });

  expect(read.lines, "there should be lines to check").toBeGreaterThan(4);
  // A line without a date reads as unfinished beside the ones that have
  // them, so every one of them carries one...
  expect(read.dates, "every line should carry a date").toBe(read.lines);
  expect(read.written, "and every date should have been written").toBe(read.dates);
  // ...and a short line is written smaller rather than left bare, so no
  // date reaches past the end of its own line onto what it joins.
  expect(read.over, `dates landing on the pictures: ${read.over.join(", ")}`).toEqual([]);
});
