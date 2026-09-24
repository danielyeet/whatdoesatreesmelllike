// ============================================================
// THE HOUSES — the hang (categories/scent-descriptions.html)
//
// Every house hangs from a picture rail on a hook, high and low in
// turn — a salon hang — with a museum label under it carrying its
// number and name. The wall is hung picture by picture as the page
// arrives, a picture swings when the pointer brushes it, and resting on
// one brings that house's motifs up over the wall while the rest goes
// out of focus. Pressing a house steps the page back before opening it.
//
// These check what can be WRONG rather than merely ugly: the pictures
// in their order and each really hanging from its hook, nothing
// standing on anything, the numbers on the labels, the motifs waiting
// before they come and fading when they go, and the old startup flick
// staying gone.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

/** Wait for the wall to have been hung and every swing to have died. */
async function waitForSheet(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(2600);
}

/** The angle a picture is hanging at, off its own transform. */
const angleOf = (transform) => {
  const m = /rotate\((-?[\d.e-]+)rad\)/.exec(transform || "");
  return m ? parseFloat(m[1]) : 0;
};

/** Every picture's box and label on the window, every wire's points, and
    the rail. */
const hang = (page) =>
  page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const svg = document.querySelector(".sheet-lines");
    const at = svg.getBoundingClientRect();
    return {
      frames: [...document.querySelectorAll(".sheet-frame")].map((f) => ({
        ...box(f),
        tier: f.dataset.tier,
        label: box(f.querySelector(".sheet-caption")),
        number: (f.querySelector(".sheet-number") || {}).textContent,
        transform: f.style.transform,
      })),
      wires: [...document.querySelectorAll(".sheet-wire")].map((g) => {
        const nums = (g.querySelector("path").getAttribute("d") || "").match(/-?[\d.]+/g).map(Number);
        const pts = [];
        for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i] + at.left, nums[i + 1] + at.top]);
        const hook = g.querySelector(".sheet-hook");
        return {
          for: Number(g.dataset.for),
          pts,
          hook: [Number(hook.getAttribute("cx")) + at.left, Number(hook.getAttribute("cy")) + at.top],
        };
      }),
      rails: [...document.querySelectorAll(".sheet-rail line")].map((l) => Number(l.getAttribute("y1")) + at.top),
    };
  });

/** How much the motifs' canvas has drawn, in pixels with any ink. */
const motifInk = (page) =>
  page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    if (!c) return -1;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n;
  });

/** Move the pointer onto the middle of a house. */
async function pointAt(page, which) {
  const box = await page.locator(".sheet-frame").nth(which).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
}

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* THE HANG. Nine pictures, in their order from left to right, high and
   low in turn, every one hanging from a hook on the rail: its wires run
   from that hook to its own top edge. */
test("the houses hang from the rail in their order, high and low in turn", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const { frames, wires, rails } = await hang(page);
  expect(frames.length).toBe(9);
  expect(wires.length, "one hanging per picture").toBe(9);

  const mids = frames.map((f) => (f.left + f.right) / 2);
  for (let i = 1; i < mids.length; i++) {
    expect(mids[i], `house ${i + 1} should hang to the right of house ${i}`).toBeGreaterThan(mids[i - 1]);
  }
  frames.forEach((f, i) => expect(f.tier, `house ${i + 1}`).toBe(i % 2 === 0 ? "high" : "low"));
  // The low ones really are lower.
  const highTop = Math.max(...frames.filter((f) => f.tier === "high").map((f) => f.top));
  const lowTop = Math.min(...frames.filter((f) => f.tier === "low").map((f) => f.top));
  expect(lowTop, "the low tier hangs below the high one").toBeGreaterThan(highTop);

  const railY = rails[0];
  wires.forEach((w) => {
    const f = frames[w.for];
    expect(Math.abs(w.hook[1] - railY), `house ${w.for + 1}'s hook is on the rail`).toBeLessThan(5);
    expect(Math.abs(w.hook[0] - (f.left + f.right) / 2), `and above the middle of it`).toBeLessThan(3);
    // Every wire ends on the picture's top edge, and starts at the hook
    // or at the foot of the cord that comes down from it.
    const onTop = w.pts.filter((p) => Math.abs(p[1] - f.top) < 4 && p[0] > f.left && p[0] < f.right);
    expect(onTop.length, `house ${w.for + 1}'s wires reach its top edge`).toBeGreaterThanOrEqual(2);
    const fromHook = w.pts.some((p) => Math.abs(p[0] - w.hook[0]) < 1.5 && Math.abs(p[1] - w.hook[1]) < 1.5);
    expect(fromHook, `house ${w.for + 1} hangs from its hook`).toBe(true);
  });
});

/* NOTHING STANDS ON ANYTHING, and no wire runs across another picture —
   the low pictures' cords pass BETWEEN the high ones. At four widths,
   down to a phone, and the page never scrolls sideways. */
test("no picture or label overlaps another, and no wire crosses another picture", async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [1440, 1024, 800, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(SHEET);
    await waitForSheet(page);
    const { frames, wires } = await hang(page);
    const hit = (a, b, pad = 0) =>
      a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
    const whole = frames.map((f) => ({ left: Math.min(f.left, f.label.left), right: Math.max(f.right, f.label.right), top: f.top, bottom: f.label.bottom }));
    for (let i = 0; i < whole.length; i++) {
      for (let j = i + 1; j < whole.length; j++) {
        expect(hit(whole[i], whole[j]), `at ${width}px houses ${i + 1} and ${j + 1} overlap`).toBe(false);
      }
    }
    // A wire is a run of straight segments; sample along each.
    wires.forEach((w) => {
      for (let s = 0; s + 1 < w.pts.length; s++) {
        const [a, b] = [w.pts[s], w.pts[s + 1]];
        for (let t = 0.05; t < 1; t += 0.05) {
          const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          whole.forEach((f, k) => {
            if (k === w.for) return;
            const inside = x > f.left + 1 && x < f.right - 1 && y > f.top + 1 && y < f.bottom - 1;
            expect(inside, `at ${width}px house ${w.for + 1}'s wire crosses house ${k + 1}`).toBe(false);
          });
        }
      }
    });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(wide, `at ${width}px the page should not scroll sideways`).toBeLessThanOrEqual(0);
  }
});

/* THE NUMBERING IS KEPT — the owner asked for it by name — and it is the
   first thing on every label, with the house's name after it, never cut
   short. And it is a salon hang: the pictures are not all one size. */
test("every label carries the house's number and name, and the pictures are of many sizes",
  async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const { frames } = await hang(page);
  expect(frames.map((f) => f.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  const labels = await page.$$eval(".sheet-frame", (all) => all.map((f) => {
    const n = f.querySelector(".sheet-number").getBoundingClientRect();
    const name = f.querySelector(".sheet-name");
    const r = name.getBoundingClientRect();
    return {
      before: n.right <= r.left + 1,
      level: Math.abs((n.top + n.bottom) / 2 - (r.top + r.bottom) / 2) < 16,
      under: n.top >= f.getBoundingClientRect().bottom,
      cut: name.scrollWidth > name.clientWidth + 1,
    };
  }));
  labels.forEach((l, i) => {
    expect(l.under, `house ${i + 1}'s number is on the label under it`).toBe(true);
    expect(l.before && l.level, `house ${i + 1}'s label starts with its number`).toBe(true);
    expect(l.cut, `house ${i + 1}'s name is not cut short`).toBe(false);
  });
  const sizes = new Set(frames.map((f) => Math.round((f.right - f.left) / 8) + "x" + Math.round((f.bottom - f.top) / 8)));
  expect(sizes.size, "the pictures are not all one size").toBeGreaterThan(5);
});

/* THE WALL IS HUNG, picture by picture, in order: each is lowered on to
   its hook — seen partway down, and partway faded in — after the one
   before it. */
test("the wall is hung picture by picture, in order", async ({ page }) => {
  await page.addInitScript(() => {
    window.__landed = [];
    window.__between = 0;
    const t0 = performance.now();
    const watch = () => {
      const frames = [...document.querySelectorAll(".sheet-frame")];
      frames.forEach((f, i) => {
        if (f.classList.contains("landed") && window.__landed[i] === undefined) window.__landed[i] = performance.now() - t0;
        const o = parseFloat(getComputedStyle(f).opacity);
        if (i === 4 && o > 0.05 && o < 0.95) window.__between++;
      });
      if (performance.now() - t0 < 6000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  const seen = await page.evaluate(() => ({ landed: window.__landed, between: window.__between }));
  expect(seen.landed.length).toBe(9);
  for (let i = 1; i < 9; i++) {
    expect(seen.landed[i] - seen.landed[i - 1], `house ${i + 1} is hung after house ${i}`).toBeGreaterThan(90);
  }
  expect(seen.between, "a picture comes up over several frames").toBeGreaterThan(3);
});

/* A PICTURE SWINGS. Brush one with the pointer and it swings on its hook
   — and settles again, and a picture nothing touched does not move. */
test("a picture brushed by the pointer swings on its hook, and settles", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  // The arrival's own swing dies away first.
  await expect.poll(async () => (await hang(page)).frames.filter((f) => angleOf(f.transform) !== 0).length,
    { timeout: 8000, message: "every picture comes to hang still" }).toBe(0);

  const b = await page.locator(".sheet-frame").nth(2).boundingBox();
  await page.mouse.move(b.x - 30, b.y + b.height * 0.8);
  await page.mouse.move(b.x + b.width + 30, b.y + b.height * 0.8, { steps: 6 });
  await page.waitForTimeout(120);
  const swinging = await hang(page);
  expect(Math.abs(angleOf(swinging.frames[2].transform)), "the brushed picture swings").toBeGreaterThan(0.004);
  expect(angleOf(swinging.frames[7].transform), "one far away does not").toBe(0);

  await page.mouse.move(5, 890);
  await page.waitForTimeout(5500);
  const settled = await hang(page);
  expect(angleOf(settled.frames[2].transform), "and it settles").toBe(0);
});

/* THE STARTUP FLICK IS GONE, completely, as the owner asked: nothing on
   the sheet ever flicks, and a picture is only ever seen where it hangs —
   coming down on to its own hook, never anywhere else on the page. */
test("the old startup flick is gone", async ({ page }) => {
  await page.addInitScript(() => {
    window.__flicking = false;
    window.__stray = 0;
    const t0 = performance.now();
    const watch = () => {
      const sheet = document.getElementById("sheet");
      if (sheet && sheet.classList.contains("flicking")) window.__flicking = true;
      if (sheet && sheet.classList.contains("scripted")) {
        [...document.querySelectorAll(".sheet-frame")].forEach((f) => {
          if (parseFloat(getComputedStyle(f).opacity) < 0.3) return;
          const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(f.style.transform);
          if (!m) return;
          f.__seen = f.__seen || [];
          f.__seen.push([parseFloat(m[1]), parseFloat(m[2])]);
        });
      }
      if (performance.now() - t0 < 5000) requestAnimationFrame(watch);
      else {
        [...document.querySelectorAll(".sheet-frame")].forEach((f) => {
          const seen = f.__seen || [];
          if (!seen.length) return;
          const [fx, fy] = seen[seen.length - 1];
          seen.forEach(([x, y]) => { if (Math.abs(x - fx) > 1 || y > fy + 1 || y < fy - 75) window.__stray++; });
        });
      }
    };
    requestAnimationFrame(watch);
  });
  await page.goto(SHEET);
  await waitForSheet(page);
  expect(await page.evaluate(() => window.__flicking), "nothing flicks").toBe(false);
  expect(await page.evaluate(() => window.__stray),
    "a picture is only ever seen coming down on to its own hook").toBe(0);
});

/* RESTING ON A HOUSE, AND ONLY RESTING — and sooner than it was. The
   owner found the wait "too long"; it is a fifth of a second now. Nothing
   in the first moment; then, within half a second, the rest of the wall
   out of focus and the house's own motifs over it. */
test("resting on a house brings its motifs after a moment, and blurs the rest",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  // Timed in the page itself, from the pointer arriving on the house to
  // the wall going out of focus round it.
  await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    const frame = document.querySelector(".sheet-frame");
    window.__entered = null;
    window.__mused = null;
    frame.addEventListener("pointerenter", () => { if (window.__entered === null) window.__entered = performance.now(); });
    new MutationObserver(() => {
      if (window.__mused === null && sheet.classList.contains("musing")) window.__mused = performance.now();
    }).observe(sheet, { attributes: true });
  });
  await pointAt(page, 0);

  await page.waitForTimeout(40);
  expect(await motifInk(page), "nothing drawn at once").toBe(0);
  await expect(page.locator("#sheet.musing")).toHaveCount(1, { timeout: 2000 });
  const waited = await page.evaluate(() => window.__mused - window.__entered);
  expect(waited, "it waits a moment").toBeGreaterThan(120);
  expect(waited, "but not long — it was 420ms and the owner found that too long").toBeLessThan(320);
  await page.waitForTimeout(1400);
  await expect(page.locator(".sheet-frame").first()).toHaveClass(/hot/);
  expect(await motifInk(page), "the house's motifs are drawn").toBeGreaterThan(40);
  const looks = await page.evaluate(() => {
    const frames = [...document.querySelectorAll(".sheet-frame")];
    return { rested: getComputedStyle(frames[0]).filter, other: getComputedStyle(frames[3]).filter };
  });
  expect(looks.rested, "the house itself stays sharp").toBe("none");
  expect(looks.other, "everything else goes out of focus").toMatch(/blur/);
  expect(errors).toEqual([]);
});

/* CROSSING THE WALL SETS NOTHING OFF. The pointer passing over house
   after house on its way somewhere else must not start any of them.

   HOW LONG THE POINTER WAS ACTUALLY ON EACH HOUSE IS MEASURED IN THE
   PAGE, not assumed. This test used to sweep and then ask only whether
   anything had been set off at all — and on a busy machine the sweep
   itself sometimes stayed on a house for more than the 200ms wait, so
   the page did exactly what it should and the test failed. It could
   not tell a slow sweep from a page that sets houses off too soon. Now
   every visit is timed from its pointerenter to its pointerleave, and
   the rule is: a visit shorter than the wait never sets anything off.
   A visit longer than it may, because that is a rest. The sweep has to
   produce enough short visits for that to mean something. */
test("passing over the houses does not set their motifs off", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await page.evaluate(() => {
    const sheet = document.getElementById("sheet");
    window.__visits = [];
    let open = null;
    document.querySelectorAll(".sheet-frame").forEach((frame, i) => {
      frame.addEventListener("pointerenter", () => {
        open = { i: i, from: performance.now(), to: null, mused: false };
        window.__visits.push(open);
      });
      frame.addEventListener("pointerleave", () => { if (open && open.i === i) { open.to = performance.now(); open = null; } });
    });
    new MutationObserver(() => {
      if (sheet.classList.contains("musing") && open) open.mused = true;
    }).observe(sheet, { attributes: true });
  });
  const boxes = await page.$$eval(".sheet-frame", (all) => all.map((f) => {
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }));
  await page.mouse.move(boxes[0].x - 150, boxes[0].y);
  for (const b of boxes) await page.mouse.move(b.x, b.y);
  await page.mouse.move(boxes[8].x, boxes[8].y + 400);
  await page.waitForTimeout(700);
  const visits = await page.evaluate(() => window.__visits.map((v) => ({
    house: v.i + 1, long: v.to === null ? Infinity : Math.round(v.to - v.from), mused: v.mused,
  })));
  const short = visits.filter((v) => v.long < 180);
  expect(short.length, `the sweep should cross most houses quickly: ${JSON.stringify(visits)}`)
    .toBeGreaterThanOrEqual(5);
  expect(short.filter((v) => v.mused), "no house passed over quickly should have been set off").toEqual([]);
  expect(await page.locator("#sheet.musing").count(), "and nothing is left set off").toBe(0);
});

/* THEY FADE, THEY DO NOT VANISH. "when you unhover, the motifs fade
   gradually, they dont disappear." A moment after leaving there is
   still some of them; a little later there is none. */
test("leaving a house lets its motifs fade rather than vanish", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 4);
  await page.waitForTimeout(2600);
  const full = await motifInk(page);
  expect(full, "something to fade").toBeGreaterThan(40);

  await page.mouse.move(8, 880, { steps: 2 });
  await page.waitForTimeout(350);
  expect(await page.locator("#sheet.musing").count(), "the page comes back into focus").toBe(0);
  const fading = await motifInk(page);
  expect(fading, "a moment after leaving, the motifs are still there").toBeGreaterThan(10);
  await page.waitForTimeout(2600);
  expect(await motifInk(page), "and a little later they have gone").toBe(0);
});

/* EVERY HOUSE HAS MOTIFS OF ITS OWN, and each of them draws. */
test("every house on the wall has motifs of its own, and they draw", async ({ page }) => {
  test.setTimeout(90000);
  const errors = collectPageErrors(page);
  await page.goto(SHEET);
  await waitForSheet(page);
  const keys = await page.$$eval(".sheet-frame", (all) => all.map((f) => f.dataset.motif));
  expect(new Set(keys).size, "a different set for every house").toBe(keys.length);
  for (let i = 0; i < keys.length; i++) {
    await page.mouse.move(4, 890);
    await page.waitForTimeout(1900);
    await pointAt(page, i);
    await page.waitForTimeout(2200);
    expect(await motifInk(page), `${keys[i]} should draw something`).toBeGreaterThan(20);
  }
  expect(errors).toEqual([]);
});

/* QIMU & MUSICIANS IS STAVES. "make it so that it is 5 lines like music
   sheets, and add ephemeral notes to that." Read off the motifs' own
   canvas: somewhere on it there are five long level lines, evenly spaced
   — a stave — and ink that is not those lines, which is the notes. */
test("Qimu & Musicians' motifs are five-line staves with notes on them", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  await pointAt(page, 8);
  await page.waitForTimeout(3200);
  const read = await page.evaluate(() => {
    const c = document.querySelector(".sheet-motifs");
    const ratio = c.width / innerWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const w = c.width;
    const long = [];
    for (let y = 0; y < c.height; y++) {
      let run = 0, best = 0;
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) { run++; if (run > best) best = run; } else run = 0;
      }
      if (best > w * 0.35) long.push(Math.round(y / ratio));
    }
    // Rows next to each other are one line drawn a pixel thick.
    const lines = long.filter((y, i) => i === 0 || y - long[i - 1] > 2);
    let staves = 0;
    for (let i = 0; i + 4 < lines.length; i++) {
      const gaps = [1, 2, 3, 4].map((k) => lines[i + k] - lines[i + k - 1]);
      if (gaps.every((g) => Math.abs(g - gaps[0]) <= 1.5 && g > 5 && g < 14)) staves++;
    }
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 20) ink++;
    return { staves, ink, lineInk: long.length * w * 0.35 };
  });
  expect(read.staves, "at least one stave of five even lines").toBeGreaterThan(0);
  expect(read.ink, "and notes on it besides the lines").toBeGreaterThan(read.lineInk);
});

/* PRESSING A HOUSE does not cut to it: the page steps back first, and
   only then is the house opened. */
test("pressing a house steps the page back before opening it", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);
  const target = page.locator(".sheet-frame").nth(7);
  const b = await target.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator("body.sheet-leaving")).toHaveCount(1);
  await page.waitForTimeout(200);
  expect(page.url(), "still here a moment after the press").toMatch(/scent-descriptions/);
  const leaving = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelectorAll(".sheet-frame")[2]).opacity));
  expect(leaving, "the rest of the page is on its way out").toBeLessThan(0.9);
  await page.waitForURL(/houses\/tombstone\.html/, { timeout: 4000 });
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
// page sideways at exactly the moment the sheet landed — the whole
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


test("every picture is still a link to a piece", async ({ page }) => {
  await page.goto(SHEET);
  await waitForSheet(page);

  const hrefs = await page.$$eval(".sheet-frame", (frames) => frames.map((f) => f.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  hrefs.forEach((href) => expect(href, "a frame with nowhere to go is not a piece").toBeTruthy());
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

  // Not there while the chain is still drawing itself.
  expect(await showingName()).toBeLessThan(0.05);

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

  // Nothing to sit through: everything is placed at once.
  await page.waitForTimeout(400);
  const landed = await page.$$eval(".sheet-frame.landed", (els) => els.length);
  const frames = await page.$$eval(".sheet-frame", (els) => els.length);
  expect(landed, "every picture should already be in place").toBe(frames);
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

