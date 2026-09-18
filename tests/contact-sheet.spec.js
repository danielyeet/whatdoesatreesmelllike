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

/** Wait for the whole sequence — flick, settle, every line drawn.
 *
 *  `.drawn` on the sheet and not `.landed` on every frame: the
 *  pictures are all in place a moment before the map is, because a
 *  line that closes a loop lands after the picture at the end of it
 *  already did. The little wait after it is the last picture's own
 *  fade, which is CSS and not the script's. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(600);
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

  // The category's name is not there yet: it arrives once the page has
  // finished drawing itself.
  const named = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector(".sheet-where")).opacity));
  expect(named, "the name waits for the page to finish").toBeLessThan(0.05);

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

  const searchAt = () =>
    page.locator(".sheet-search").evaluate((el) => el.getBoundingClientRect().left);
  const before = await searchAt();

  await waitForSheet(page);
  expect(Math.abs((await searchAt()) - before), "the chrome should not move").toBeLessThan(1);

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

test("the pictures run in order down the page", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // The scatter is which SQUARES are used; the order they are filled
  // in is separate, and the owner asked for it to read downwards —
  // 01 at the top, then 02, 03 and so on to the foot of the page. So
  // each picture must stand no higher than the one before it, give or
  // take the wander inside its own square.
  const down = await page.$$eval(".sheet-frame", (frames) =>
    frames.map((f) => f.getBoundingClientRect().top + window.scrollY));

  let wrong = [];
  for (let n = 1; n < down.length; n++) {
    // A row's worth of slack: two pictures side by side in the same
    // row are in order left to right, and one may sit a little higher
    // in its own square than the other.
    if (down[n] < down[n - 1] - 160) wrong.push(n + 1);
  }
  expect(wrong, `pictures standing above the one before them: ${JSON.stringify(wrong)}`)
    .toEqual([]);

  // And the first is genuinely at the top: it is the one the flick
  // lands on and the one everything else is drawn out from.
  expect(Math.min(...down), "the first picture is the highest").toBe(down[0]);
});

test("the category names itself once the page has drawn itself", async ({ page }) => {
  await page.goto(SHEET);

  // The two buttons are back, and named for what this category is
  // actually two of now: the Houses — the sheet itself — and the
  // Fragrances, an index of everything written up on it.
  // (The REGISTER those buttons used to switch to is still gone: no
  // gallery entries live on this page any more, they are the
  // chamber's.)
  await expect(page.locator(".sheet-filter")).toHaveCount(2);
  await expect(page.locator(".sheet-filter")).toHaveText(["Houses", "Fragrances"]);
  await expect(page.locator(".gallery-entry")).toHaveCount(0);

  const name = page.locator(".sheet-where");
  await expect(name).toHaveText("Scent descriptions");
  const showingName = () =>
    page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".sheet-where")).opacity));

  // Not there while the pictures are still flicking through.
  expect(await showingName()).toBeLessThan(0.05);

  // Nor while the map is still drawing itself.
  await waitForSheet(page);
  await expect.poll(showingName, { timeout: 6000 }).toBeGreaterThan(0.9);

  // It stands up at the top of the page beside the Menu, rather than
  // in the page.
  const where = await page.evaluate(() => {
    const box = document.querySelector(".sheet-where").getBoundingClientRect();
    return { fixed: getComputedStyle(document.querySelector(".sheet-where")).position,
             top: box.top, left: box.left };
  });
  expect(where.fixed).toBe("fixed");
  expect(where.top, "up at the top of the page").toBeLessThan(70);
  expect(where.left, "beside the Menu, on the left").toBeLessThan(220);
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

  await field.fill("adar");
  // One picture is called that; everything else steps back.
  const dimmed = await page.$$eval(".sheet-frame.dimmed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(dimmed, "everything that doesn't match should step back").toBe(frames - 1);
  await expect(page.locator(".sheet-frame:not(.dimmed) .sheet-caption")).toHaveText(
    "ADAR the house that you have never heard of"
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

/** How much ink the canvas has laid down in a square of the SHEET —
    the specks stand in the sheet's own coordinates, which is why they
    do not move when the page is scrolled. */
const speckInk = (page, box) =>
  page.evaluate(([x, y, w, h]) => {
    const canvas = document.querySelector(".sheet-specks");
    const ratio = canvas.width / parseFloat(canvas.style.width);
    const shot = canvas.getContext("2d").getImageData(
      Math.round(x * ratio), Math.round(y * ratio),
      Math.max(1, Math.round(w * ratio)), Math.max(1, Math.round(h * ratio))
    ).data;
    let ink = 0;
    for (let n = 3; n < shot.length; n += 4) ink += shot[n];
    return Math.round(ink / 100);
  }, box);

/** Where a frame stands in the sheet's own coordinates. */
const inSheet = (page, which) =>
  page.evaluate((pick) => {
    const canvas = document.querySelector(".sheet-specks").getBoundingClientRect();
    const box = document.querySelectorAll(".sheet-frame")[pick].getBoundingClientRect();
    return { x: box.left - canvas.left, y: box.top - canvas.top,
             w: box.width, h: box.height };
  }, which);

test("a picture is ruled, with specks only where the map is tied to it",
  async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // The classic border is back — it was taken off for a round, when
  // the chain of specks round a picture was the whole of its edge, and
  // the owner asked for it back with the specks kept only where a line
  // meets one.
  const border = await page.$$eval(".sheet.scripted .sheet-frame.landed", (frames) =>
    frames.map((f) => getComputedStyle(f).borderTopWidth));
  expect(border.length).toBeGreaterThan(3);
  expect(new Set(border), "every picture should be ruled").toEqual(new Set(["1px"]));

  // Where a line is tied to a picture there are specks; where nothing
  // is tied to it there are none.
  const tied = await page.evaluate(() => {
    const canvas = document.querySelector(".sheet-specks");
    const ratio = canvas.width / parseFloat(canvas.style.width);
    const paint = canvas.getContext("2d");
    const ink = (x, y, r) => {
      const shot = paint.getImageData(
        Math.round((x - r) * ratio), Math.round((y - r) * ratio),
        Math.round(2 * r * ratio), Math.round(2 * r * ratio)).data;
      let n = 0;
      for (let i = 3; i < shot.length; i += 4) n += shot[i];
      return Math.round(n / 100);
    };
    // Every point where a route leaves a picture.
    const ends = [];
    document.querySelectorAll(".sheet-route").forEach((route) => {
      ends.push({ x: +route.getAttribute("x1"), y: +route.getAttribute("y1") });
      ends.push({ x: +route.getAttribute("x2"), y: +route.getAttribute("y2") });
    });
    // A frame with at least one line tied to it, and a stretch of its
    // own edge as far from any of them as the frame allows.
    const box = document.querySelector(".sheet-specks").getBoundingClientRect();
    let best = null;
    document.querySelectorAll(".sheet-frame.landed").forEach((frame) => {
      const at = frame.getBoundingClientRect();
      const on = { x: at.left - box.left, y: at.top - box.top, w: at.width, h: at.height };
      // Walk its perimeter and find the point furthest from any tie.
      // The lines tied to THIS picture: a route leaves a frame from
      // just off its own edge, so anything within a few pixels of the
      // box is one of its own.
      const mine = ends.filter((end) =>
        end.x > on.x - 16 && end.x < on.x + on.w + 16 &&
        end.y > on.y - 16 && end.y < on.y + on.h + 16);
      if (!mine.length) return;
      let far = null;
      for (let t = 0; t < 1; t += 1 / 160) {
        const side = Math.floor(t * 4), along = t * 4 - side;
        const p = side === 0 ? { x: on.x + on.w * along, y: on.y }
          : side === 1 ? { x: on.x + on.w, y: on.y + on.h * along }
          : side === 2 ? { x: on.x + on.w * (1 - along), y: on.y + on.h }
          : { x: on.x, y: on.y + on.h * (1 - along) };
        let away = Infinity;
        ends.forEach((end) => {
          away = Math.min(away, Math.hypot(end.x - p.x, end.y - p.y));
        });
        if (!far || away > far.away) far = { p: p, away: away };
      }
      if (far && far.away > 70 && (!best || far.away > best.far.away)) {
        best = { near: { p: mine[0] }, far: far };
      }
    });
    if (!best) return null;
    return {
      atTie: ink(best.near.p.x, best.near.p.y, 22),
      away: ink(best.far.p.x, best.far.p.y, 22),
      apart: Math.round(best.far.away),
    };
  });

  expect(tied, "a picture with a line tied to it and a clear stretch of edge")
    .not.toBeNull();
  // The tuft is deliberately faint — it is an embellishment where the
  // map meets a picture, not a second border — so what is measured is
  // the contrast: something there, and nothing at all along the rest
  // of the edge.
  expect(tied.atTie, `specks where the line is tied: ${JSON.stringify(tied)}`)
    .toBeGreaterThan(40);
  expect(tied.away, `and none along the edge away from it: ${JSON.stringify(tied)}`)
    .toBeLessThan(tied.atTie * 0.25);
});

test("a line between two pictures is a run of specks, not a stroke", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // The route elements are still the map — they say which two pictures
  // each line joins and where it runs, and the dates ride on them —
  // but they are not what is drawn: the specks are.
  const stroke = await page.$$eval(".sheet-route", (routes) =>
    routes.map((r) => getComputedStyle(r).stroke));
  expect(new Set(stroke), "a route is not stroked").toEqual(new Set(["none"]));

  // HOW MANY SEPARATE RUNS OF INK there are along one line's own
  // path. A stroke is one unbroken run from end to end; a line made of
  // specks is dozens of them with clear page between. Counting them is
  // the difference stated exactly — asking merely whether there is ink
  // near each sampled point cannot tell the two apart, since a window
  // wide enough to catch a speck that stands a pixel off the line is
  // wide enough to be filled by a stroke as well.
  const along = await page.evaluate(() => {
    const route = [...document.querySelectorAll(".sheet-route")]
      .map((r) => ({
        x1: +r.getAttribute("x1"), y1: +r.getAttribute("y1"),
        x2: +r.getAttribute("x2"), y2: +r.getAttribute("y2"),
      }))
      .sort((a, b) => Math.hypot(b.x2 - b.x1, b.y2 - b.y1) - Math.hypot(a.x2 - a.x1, a.y2 - a.y1))[0];
    const far = Math.hypot(route.x2 - route.x1, route.y2 - route.y1);
    const canvas = document.querySelector(".sheet-specks");
    const ratio = canvas.width / parseFloat(canvas.style.width);
    const paint = canvas.getContext("2d");
    const ux = (route.x2 - route.x1) / far, uy = (route.y2 - route.y1) / far;
    let runs = 0, inked = 0, was = false, steps = 0;
    for (let at = 0; at <= far; at += 1) {
      const x = route.x1 + ux * at, y = route.y1 + uy * at;
      // A small box ON the sample point, so a speck standing a little
      // off the line still counts as this point being drawn. It has to
      // be CENTRED: it was written as an axis-aligned band pushed out
      // along the perpendicular, which straddles a level line but sits
      // entirely to one side of a steep one — on a diagonal it read a
      // line that is drawn end to end as nine tenths empty. Small, too:
      // a box wide enough to catch the next speck along as well cannot
      // tell a run of specks from a stroke, which is the whole point of
      // this test.
      const box = Math.max(1, Math.round(3 * ratio));
      const shot = paint.getImageData(
        Math.round(x * ratio) - Math.floor(box / 2),
        Math.round(y * ratio) - Math.floor(box / 2),
        box, box).data;
      let ink = 0;
      for (let i = 3; i < shot.length; i += 4) ink += shot[i];
      const now = ink > 90;
      if (now && !was) runs++;
      if (now) inked++;
      was = now;
      steps++;
    }
    return { runs: runs, inked: inked, steps: steps, far: Math.round(far) };
  });
  expect(along.inked, `the line should be drawn: ${JSON.stringify(along)}`)
    .toBeGreaterThan(along.steps * 0.2);
  expect(along.runs, `and in specks rather than stroked: ${JSON.stringify(along)}`)
    .toBeGreaterThan(8);
  expect(along.inked, `with page showing between them: ${JSON.stringify(along)}`)
    .toBeLessThan(along.steps * 0.9);
});

test("the page opens on the picture it will land on, and holds it",
  async ({ page }) => {
  // The flick used to start in the same frame the page did. A beat of
  // the piece itself first reads as a projector being started rather
  // than as a page loading — so the page is watched from the moment
  // the script takes over rather than photographed at a guessed
  // instant, which on a busy machine is most of a second late.
  await page.addInitScript(() => {
    window.__opened = [];
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet && sheet.classList.contains("scripted")) {
        const at = [...document.querySelectorAll(".sheet-frame")]
          .findIndex((f) => getComputedStyle(f).visibility === "visible");
        window.__opened.push([performance.now(), at]);
      }
      if (performance.now() < 4000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await page.waitForTimeout(2500);

  const seen = await page.evaluate(() => window.__opened);
  expect(seen.length, "the opening should have been watched").toBeGreaterThan(20);
  const began = seen[0][0];
  const held = seen.filter(([at]) => at - began < 200);
  expect(held.length, "and watched closely enough").toBeGreaterThan(4);
  expect(held.every(([, at]) => at === 0),
    `the first picture should be held while the page opens: ${JSON.stringify(held.slice(0, 8))}`)
    .toBe(true);

  // And then the cuts start: it does not simply sit there.
  expect(seen.some(([, at]) => at > 0), "the flick should follow it").toBe(true);
});

test("the specks stand still when the page is scrolled", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // What the whole canvas has on it, and where the canvas stands in
  // the page rather than in the window.
  const look = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".sheet-specks");
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0, stamp = 0;
      for (let n = 3; n < shot.length; n += 4) {
        if (!shot[n]) continue;
        ink += shot[n];
        stamp = (stamp * 31 + n + shot[n]) % 2147483647;
      }
      return {
        ink: ink, stamp: stamp,
        down: Math.round(canvas.getBoundingClientRect().top + window.scrollY),
      };
    });

  const before = await look();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(900);
  const after = await look();

  expect(await page.evaluate(() => window.scrollY), "the page should have scrolled")
    .toBeGreaterThan(300);
  expect(after.stamp, "not one speck should have moved").toBe(before.stamp);
  expect(after.ink, "nor been redrawn").toBe(before.ink);
  expect(after.down, "and the drawing travels with the page, not the window")
    .toBe(before.down);
});

test("pointing at a picture isolates it, without moving it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  // The owner asked for the pictures to answer the hand again, in this
  // shape: the specks belonging to the one under the pointer come
  // loose and drift, the rest of the sheet steps back — and THE
  // PICTURE ITSELF DOES NOT MOVE. It used to tip in three dimensions,
  // which is what that last line is guarding against coming back.
  const frame = page.locator(".sheet-frame").nth(3);
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();

  const look = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".sheet-specks");
      const shot = canvas.getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let n = 3; n < shot.length; n += 4) ink += shot[n];
      return {
        ink: ink,
        places: [...document.querySelectorAll(".sheet-frame")]
          .map((f) => getComputedStyle(f).transform).join(" "),
        boxes: [...document.querySelectorAll(".sheet-frame")].map((f) => {
          const at = f.getBoundingClientRect();
          return Math.round(at.x) + "," + Math.round(at.y) + "," + Math.round(at.width);
        }).join(" "),
        holding: document.getElementById("sheet").classList.contains("holding"),
        hot: [...document.querySelectorAll(".sheet-frame")]
          .findIndex((f) => f.classList.contains("hot")),
      };
    });

  const resting = await look();
  expect(resting.holding, "nothing is held back to begin with").toBe(false);
  expect(resting.hot, "and nothing is hot").toBe(-1);

  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(500);
  const held = await look();
  expect(held.hot, "the picture under the pointer is the hot one").toBe(3);
  expect(held.holding, "and the rest of the sheet steps back").toBe(true);

  // The specks move — they are the whole of what answers.
  await page.waitForTimeout(250);
  const later = await look();
  expect(later.ink, "the specks should be drifting").not.toBe(held.ink);

  // And nothing that is being READ has moved: same transform, same box.
  expect(held.places, "no picture may be turned or lifted").toBe(resting.places);
  expect(held.boxes, "nor moved by a pixel").toBe(resting.boxes);

  // Away again, and the sheet comes back to itself.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(900);
  const after = await look();
  expect(after.holding, "the sheet lets go again").toBe(false);
  expect(after.hot).toBe(-1);
  expect(after.places).toBe(resting.places);
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
  // every picture in a plain grid — and then have all of it swept
  // away, which reads as the page blinking its whole contents at you
  // before it starts.
  await page.addInitScript(() => {
    window.__flashed = 0;
    window.__placed = null;
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet) {
        const seen = [...document.querySelectorAll(".sheet-frame")]
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
