// ============================================================
// MY PERSONAL INTRODUCTION TO PERFUME — Explorations 000
// works/my-personal-introduction-to-perfume.html
//
// The owner's guide to perfume, laid out as an essay page with a
// ground of its own (THE MIST, primer.js) and the diagrams they asked
// for. What is checked is what they asked for in words: it is 000 and
// the first result, it is an exploration, the table of notes and
// accords, the two pyramids, the dropdown, the motto, and the footnotes.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const PRIMER = "/works/my-personal-introduction-to-perfume.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/* 000, FIRST, AN EXPLORATION — "make it 000. It should be the first
   result. It should be an exploration." And first however the table is
   sorted by number: turned round, it is last, and turned back it is
   first again. */
test("it is 000, the first result, and an exploration", async ({ page }) => {
  await page.goto("/categories/researches.html");
  const first = page.locator(".index-table tbody tr").first();
  await expect(first.locator(".index-no")).toHaveText("000");
  await expect(first.locator(".index-kind")).toHaveText("Exploration");
  await expect(first).toHaveAttribute("data-kind", "Exploration");
  await expect(first.locator("a")).toHaveAttribute("href", "../works/my-personal-introduction-to-perfume.html");

  const number = page.locator('.index-sort[data-key="no"]');
  await number.click();
  await expect(page.locator(".index-table tbody tr").last().locator(".index-no")).toHaveText("000");
  await number.click();
  await expect(page.locator(".index-table tbody tr").first().locator(".index-no")).toHaveText("000");
});

/* THE PAGE: twelve sections, the rule built from them, and nothing
   thrown. */
test("the piece opens with its twelve sections and the rule", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRIMER);
  await page.waitForTimeout(600);
  await expect(page.locator(".essay-section")).toHaveCount(12);
  await expect(page.locator(".essay-mark")).toHaveCount(12);
  await expect(page.locator("h1")).toContainText("My Personal Introduction");
  expect(errors).toEqual([]);
});

/* THE TABLE THE OWNER DESCRIBED: "Notes" over the first column and
   "Accord" over the second, several rows of notes making up one accord
   — and "Avoid amber please." */
test("the accords table: notes grouped under each accord, and no amber", async ({ page }) => {
  await page.goto(PRIMER);
  const table = page.locator(".primer-accords");
  await expect(table.locator("thead th")).toHaveText(["Notes", "Accord"]);
  const accords = await table.locator("tbody th").evaluateAll((all) =>
    all.map((th) => ({ name: th.textContent.trim(), rows: Number(th.getAttribute("rowspan")) })));
  expect(accords.length).toBeGreaterThanOrEqual(5);
  accords.forEach((a) => expect(a.rows, `${a.name} should span several notes`).toBeGreaterThan(1));
  const notes = await table.locator("tbody td").count();
  expect(notes).toBe(accords.reduce((n, a) => n + a.rows, 0));
  const text = (await table.textContent()).toLowerCase();
  expect(text).not.toContain("amber");
});

/* TWO PYRAMIDS: one empty — top, mid, base and nothing else — and one
   with citruses at the top, woods in the middle and musks at the base. */
test("an empty pyramid, then citruses over woods over musks", async ({ page }) => {
  await page.goto(PRIMER);
  const pyramids = page.locator("#section-07 .primer-pyramid");
  await expect(pyramids).toHaveCount(2);
  await expect(pyramids.nth(0).locator(".pd-tier-name")).toHaveText(["Top", "Mid", "Base"]);
  await expect(pyramids.nth(0).locator(".pd-tier-note")).toHaveCount(0);
  await expect(pyramids.nth(1).locator(".pd-tier-note")).toHaveText(["Citruses", "Woods", "Musks"]);
  // In that order DOWN the drawing, which is what makes it a pyramid.
  const ys = await pyramids.nth(1).locator(".pd-tier-note").evaluateAll((all) =>
    all.map((t) => t.getBoundingClientRect().top));
  expect(ys[0]).toBeLessThan(ys[1]);
  expect(ys[1]).toBeLessThan(ys[2]);
});

/* THE DROPDOWN: "MAKE THIS A DROPDOWN". Shut to begin with, and a real
   <details>, so it opens with or without the script. */
test("the nuances are a dropdown, shut until it is opened", async ({ page }) => {
  await page.goto(PRIMER);
  const more = page.locator("details.primer-more");
  await expect(more).toHaveCount(1);
  await expect(more).not.toHaveAttribute("open", /.*/);
  await expect(more.locator(".primer-more-body")).toBeHidden();
  await more.locator("summary").click();
  await expect(more).toHaveAttribute("open", /.*/);
  await expect(more.locator(".primer-more-body")).toContainText("rule of thumb");
});

/* THE LAST WORDS: the takeaway sentence in bold, and "Wear what you
   like" in the middle of the page, in italics, and set large. */
test("the takeaway is bold, and the motto stands in the middle in italics",
  async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRIMER);
  await expect(page.locator(".primer-close strong"))
    .toHaveText("you can wear anything you want, whenever you want, however you want.");
  const motto = await page.locator(".primer-motto").evaluate((p) => {
    const em = p.querySelector("em");
    const box = em.getBoundingClientRect();
    return {
      text: em.textContent.trim(),
      italic: getComputedStyle(em).fontStyle,
      size: parseFloat(getComputedStyle(p).fontSize),
      middle: box.left + box.width / 2,
      body: parseFloat(getComputedStyle(document.querySelector(".essay-section p")).fontSize),
    };
  });
  // With its full stop, at the owner's word.
  expect(motto.text).toBe("Wear what you like.");
  expect(motto.italic).toBe("italic");
  expect(motto.size, "emphasized: far bigger than the writing").toBeGreaterThan(motto.body * 2);
  const column = await page.locator(".essay-body").evaluate((b) => {
    const r = b.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(b).paddingLeft);
    return r.left + pad + (r.width - pad * 2) / 2;
  });
  expect(Math.abs(motto.middle - column), "in the middle of the column").toBeLessThan(8);
});

/* THE FOOTNOTES: three numbers in the writing, three notes at the foot,
   each number a link to its note and each note a link back. Pointed at,
   a number shows its note beside it — and SOLIDLY. The pop-up is built
   on the body, which is the trap the notes window fell into: the menu's
   dimming rule gave it an 0.85s fade and it was read see-through. */
test("each footnote number reaches its note, and shows it solidly beside it",
  async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRIMER);
  await expect(page.locator(".primer-fn a")).toHaveCount(3);
  await expect(page.locator(".primer-footnotes li")).toHaveCount(3);
  for (const n of [1, 2, 3]) {
    await expect(page.locator(`#fnref-${n}`)).toHaveAttribute("href", `#fn-${n}`);
    await expect(page.locator(`#fn-${n} .primer-back`)).toHaveAttribute("href", `#fnref-${n}`);
  }
  await page.locator("#fnref-2").scrollIntoViewIfNeeded();
  await page.hover("#fnref-2");
  await page.waitForTimeout(350);
  const tip = await page.locator(".primer-tip").evaluate((t) => ({
    shown: !t.hidden,
    opacity: parseFloat(getComputedStyle(t).opacity),
    text: t.textContent,
  }));
  expect(tip.shown).toBe(true);
  expect(tip.text).toContain("nuclear");
  expect(tip.opacity, "the note should be solid, not half faded in").toBeGreaterThan(0.95);
});

/* THE MIST IS THERE, AND IT IS QUIET OVER THE WRITING. A drop over the
   column is drawn at a fraction of its strength, so the ground never
   glows through the words. */
test("the mist rises behind the page, and is quieter over the writing",
  async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRIMER);
  await page.waitForTimeout(1500);
  const seen = await page.evaluate(() => {
    const el = document.querySelector(".primer-mist");
    const g = el.getContext("2d", { willReadFrequently: true });
    const im = g.getImageData(0, 0, el.width, el.height).data;
    const ratio = el.width / window.innerWidth;
    const edge = (window.innerWidth - 940) / 2 + 40;
    let side = 0, sideOn = 0, mid = 0, midOn = 0;
    for (let i = 0; i < im.length; i += 4) {
      const a = im[i + 3];
      if (a <= 3) continue;
      const x = ((i / 4) % el.width) / ratio;
      if (x > edge && x < window.innerWidth - edge) { mid += a; midOn += 1; }
      else if (x < edge - 90 || x > window.innerWidth - edge + 90) { side += a; sideOn += 1; }
    }
    return { sideOn, mid: midOn ? mid / midOn : 0, side: sideOn ? side / sideOn : 0 };
  });
  expect(seen.sideOn, "there should be a mist at all").toBeGreaterThan(40);
  expect(seen.mid, `over the writing ${seen.mid.toFixed(1)}, beside it ${seen.side.toFixed(1)}`)
    .toBeLessThan(seen.side * 0.7);
});

/* THE PERFUME HOLDS THE OIL AND THE ALCOHOL TOGETHER. The owner: "make
   the third diagram's volume be the sum of the first two diagrams'". The
   three are the same vial, so the levels add as heights. */
test("the perfume holds exactly the oil and the alcohol together", async ({ page }) => {
  await page.goto(PRIMER);
  const h = await page.evaluate(() => ["oil", "alcohol", "perfume"].map((k) => {
    const b = document.querySelector("#section-02 .pd-" + k).getBBox();
    return { h: b.height, w: b.width };
  }));
  expect(h[0].w).toBe(h[1].w);
  expect(h[1].w).toBe(h[2].w);
  expect(h[2].h, `${h[0].h} + ${h[1].h} should be ${h[2].h}`).toBeCloseTo(h[0].h + h[1].h, 1);
});

/* THE CONCENTRATIONS ARE THE OWNER'S TABLE, and they overlap — which is
   the whole point of the paragraph under them. The source opens in a
   new window, like every other outside link on the site. */
test("the concentrations are the owner's ranges, and they overlap", async ({ page }) => {
  await page.goto(PRIMER);
  const bars = await page.$$eval("#section-03 .primer-bar", (all) => all.map((b) => ({
    name: b.querySelector(".primer-bar-name").textContent.trim(),
    say: b.querySelector(".primer-bar-say").textContent.trim(),
    box: b.querySelector(".primer-bar-fill").getBoundingClientRect(),
  })));
  expect(bars.map((b) => b.say)).toEqual(["15–30%", "10–20%", "5–15%", "2–5%", "1–3%"]);
  expect(bars[0].name).toContain("Extrait");
  // Each band reaches the one above it: 2–5% and 5–15% meet at 5%, the
  // rest overlap outright.
  for (let i = 1; i < 5; i++) {
    expect(bars[i].box.right, `${bars[i].name} reaches ${bars[i - 1].name}`)
      .toBeGreaterThanOrEqual(bars[i - 1].box.left - 0.5);
  }
  const source = page.locator("#section-03 figcaption a");
  await expect(source).toHaveAttribute("href", /premierepeau\.com/);
  await expect(source).toHaveAttribute("target", "_blank");
  await expect(page.locator("#section-03")).toContainText("Epic 56");
});

/* THE LIQUID-TO-GAS DRAWING IS GONE, at the owner's word, and the words
   it stood beside are still there. */
test("From liquid to gas is words only now", async ({ page }) => {
  await page.goto(PRIMER);
  await expect(page.locator("#section-04 figure")).toHaveCount(0);
  await expect(page.locator("#section-04 p")).toContainText("it needs to be a gas");
});

/* A REGULAR TRIANGLE. "make the pyramid look like a regular triangle
   please, why is it weird" — its base band flared out at a steeper slope
   than the two above it, so its sides kinked. Every corner down each
   side must now lie on one straight line from the apex. */
test("the pyramids are true triangles: their sides do not bend", async ({ page }) => {
  await page.goto(PRIMER);
  const bends = await page.$$eval("#section-07 .primer-pyramid svg", (svgs) => svgs.map((svg) => {
    const pts = [...svg.querySelectorAll(".pd-tier")].flatMap((p) =>
      p.getAttribute("d").match(/-?[\d.]+ -?[\d.]+/g).map((xy) => xy.split(" ").map(Number)));
    const apex = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    // Every corner left of the apex on one line; every one right of it on another.
    let worst = 0;
    for (const side of [-1, 1]) {
      const on = pts.filter((p) => Math.sign(p[0] - apex[0]) === side);
      const far = on.reduce((a, b) => (b[1] > a[1] ? b : a));
      on.forEach((p) => {
        const off = Math.abs((far[0] - apex[0]) * (p[1] - apex[1]) - (far[1] - apex[1]) * (p[0] - apex[0])) /
          Math.hypot(far[0] - apex[0], far[1] - apex[1]);
        worst = Math.max(worst, off);
      });
    }
    return worst;
  }));
  expect(bends.length).toBe(2);
  bends.forEach((b) => expect(b, "a side bends by " + b.toFixed(2)).toBeLessThan(0.5));
});

/* THE RULE NAMES WHERE YOU ARE AT THE END. Reading the motto, the
   footnotes and the sources, no section is on the window, and the rule
   used to fall back to the FIRST one — "Introduction" three screens from
   the end. It names the last section passed. */
test("past the last section the rule names it, not the introduction", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRIMER);
  // The motto at the top of the window: the last section is off it, and
  // the page is not yet at its very foot (where the last section wins
  // anyway).
  await page.locator(".primer-motto").evaluate((e) => e.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(500);
  const where = await page.evaluate(() => ({
    lastOff: document.querySelector("#section-12").getBoundingClientRect().bottom < 0,
    atFoot: window.scrollY >= document.documentElement.scrollHeight - innerHeight - 4,
  }));
  expect(where.lastOff, "the last section should be off the window").toBe(true);
  expect(where.atFoot, "and the page not at its very foot").toBe(false);
  await expect(page.locator(".essay-here")).toHaveText(/common myths/i);
});
