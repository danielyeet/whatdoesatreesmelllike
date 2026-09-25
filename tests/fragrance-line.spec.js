// ============================================================
// THE FRAGRANCES, A WHOLE-PAGE TABLE — fragrance-line.js, and the stretch
// between the two views in views.js (categories/scent-descriptions.html)
//
// The Fragrances view has been three things in one day: files travelling
// along a line through a double pyramid of specks; a table standing over
// the line and the pyramid; and now, at the owner's word — "the thing in
// the back is downright ugly; lets change tht entirely. I want you to
// remove the horizontal line, remove the pyramid thing, and make it an
// almost whole page table, with some space and stylisting elements on the
// left. I want you to be able to scroll, and change the view of the table
// so it is either as currently, or into small boxes or into cards. These
// options should be on the right of the table" — a table that is nearly
// the whole page, with an aside on the left and the three ways of showing
// it on the right. The content is what it was: "3 digit number, then name,
// then house, then date of writing". The old view is kept, exactly as it
// was. And the stretch from the Houses now gathers into the table's own
// rules rather than into a line.
//
// These check what can be WRONG: the rows and their columns, nothing left
// drawn behind them, the page's three columns, a screen holding a good
// many rows, the wheel scrolling them from anywhere, the three ways of
// showing them and the choice being kept, sorting and searching, an item
// opening its fragrance in the page, the old view kept, and the stretch
// running in the order it was asked for — and not at all with motion
// turned off.
// ============================================================
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

async function toTheTable(page) {
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet") &&
    document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  // The stretch, and the table coming in after it.
  await page.waitForTimeout(4200);
}

const rowsOf = (page) => page.$$eval(".frag-item:not([hidden])", (all) => all.map((li) =>
  [".frag-t-no", ".frag-t-name", ".frag-t-house", ".frag-t-date"].map((s) => li.querySelector(s).textContent.trim())));

/** How many items stand in the first row of the grid. */
const acrossOf = (page) => page.$$eval(".frag-item:not([hidden])", (all) => {
  const top = Math.round(all[0].getBoundingClientRect().top);
  return all.filter((li) => Math.abs(li.getBoundingClientRect().top - top) < 2).length;
});

/** The page with `n` more fragrances in its table than it has — the
    "large amount of fragrances" the owner is building it for. */
async function withMany(page, n) {
  await page.route("**/categories/scent-descriptions.html", async (route) => {
    const res = await route.fetch();
    let html = await res.text();
    let extra = "";
    for (let i = 8; i < 8 + n; i++) {
      const no = String(i).padStart(3, "0");
      extra += `<tr data-no="${i}" data-name="Test ${no}" data-house="House ${i % 9}" data-date="2026-09-24">` +
        `<td class="index-no">${no}</td><td class="index-what"><a href="../individual-fragrances/individual-fragrances.html#part-01">Test ${no}</a></td>` +
        `<td class="index-of">House ${i % 9}</td><td class="index-date">24.09.2026</td></tr>`;
    }
    const at = html.indexOf("</tbody>", html.indexOf('data-view="fragrances"'));
    html = html.slice(0, at) + extra + html.slice(at);
    await route.fulfill({ response: res, body: html });
  });
}

/* A TABLE, WITH WHAT THE OLD ONE HAD. "the content of the table should
   be the same as before: 3 digit number, then name, then house, then
   date of writing (all of the fragrances at the moment should be
   yesterdays)". Seven rows, in number order, every one dated 24.09.2026;
   the old table itself not on the window. */
test("the Fragrances view is a table: number, name, house and date, all seven dated yesterday", async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await toTheTable(page);
  await expect(page.locator(".frag-sort")).toHaveText(["No.", "Fragrance", "House", "Date"]);
  expect(await rowsOf(page)).toEqual([
    ["001", "CV99", "Lussur", "24.09.2026"],
    ["002", "De Profundis", "Serge Lutens", "24.09.2026"],
    ["003", "Haxan", "Prissana", "24.09.2026"],
    ["004", "Tobacolor", "Dior", "24.09.2026"],
    ["005", "Flamenco EDP", "Ramon Monegal", "24.09.2026"],
    ["006", "French Riviera", "Mancera", "24.09.2026"],
    ["007", "Velvet Fog", "Casa Goa", "24.09.2026"],
  ]);
  await expect(page.locator(".frag-list-count")).toHaveText("007");
  await expect(page.locator(".view[data-view='fragrances'] .index-page")).toBeHidden();
  expect(errors).toEqual([]);
});

/* THE LINE AND THE PYRAMID ARE GONE: "remove the horizontal line, remove
   the pyramid thing". Nothing is drawn behind the table any more — the
   one canvas on the view is the small mark in the aside — and nothing
   of the line is published for anything to read. */
test("nothing is drawn behind the table: no line, no pyramid", async ({ page }) => {
  await toTheTable(page);
  const out = await page.evaluate(() => {
    const stage = document.querySelector(".frag-stage");
    const canvases = [...stage.querySelectorAll("canvas")];
    return {
      canvases: canvases.map((c) => [c.className, !!c.closest(".frag-aside"), Math.round(c.getBoundingClientRect().width)]),
      line: document.querySelectorAll(".frag-line, .frag-line-field").length,
      turn: "turn" in stage.dataset, lineY: "lineY" in stage.dataset,
    };
  });
  expect(out.line, "no line").toBe(0);
  expect(out.turn || out.lineY, "nothing of the pyramid or the line").toBe(false);
  expect(out.canvases.length, "one canvas, the mark").toBeLessThanOrEqual(1);
  out.canvases.forEach(([name, inAside, wide]) => {
    expect(name).toBe("frag-mark");
    expect(inAside, "standing in the aside").toBe(true);
    expect(wide, "and small").toBeLessThanOrEqual(200);
  });
});

/* AN ALMOST WHOLE PAGE TABLE, "with some space and stylisting elements on
   the left" and the options "on the right of the table". At 1440 by 900:
   the table more than half the window wide, the aside wholly to its left
   carrying the count, its readings, a scale with one tick for every
   fragrance and the mark, and the three options wholly to its right. */
test("the table is nearly the page, with the aside on its left and the options on its right", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await toTheTable(page);
  const out = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return { table: r(".frag-list-scroll"), aside: r(".frag-aside"), options: r(".frag-options"),
      big: document.querySelector(".frag-aside-big").textContent,
      houses: document.querySelector(".frag-read-houses").textContent,
      last: document.querySelector(".frag-read-last").textContent,
      ticks: document.querySelectorAll(".frag-scale-tick:not([hidden])").length,
      mark: r(".frag-mark").width, W: innerWidth };
  });
  expect(out.table.width, "the table, more than half the window").toBeGreaterThan(out.W * 0.55);
  expect(out.aside.right, "the aside to its left").toBeLessThanOrEqual(out.table.left);
  expect(out.options.left, "the options to its right").toBeGreaterThanOrEqual(out.table.right);
  expect(out.options.right).toBeLessThanOrEqual(out.W);
  expect([out.big, out.houses, out.last]).toEqual(["007", "007", "24.09.2026"]);
  expect(out.ticks, "a tick for every fragrance").toBe(7);
  expect(out.mark, "the mark").toBeGreaterThan(100);
  await expect(page.locator(".frag-mode")).toHaveText(["List", "Boxes", "Cards"]);
  await expect(page.locator(".frag-mode[data-mode='list']")).toHaveAttribute("aria-pressed", "true");
});

/* IT FITS A GOOD MANY ON THE SCREEN, AND SCROLLS. With sixty-odd
   fragrances in it, the table's own box shows a good many rows at once on
   an ordinary window and scrolls inside itself; the page never does. */
test("a screen holds a good many rows, and the table scrolls in its own box", async ({ page }) => {
  await withMany(page, 60);
  await toTheTable(page);
  const out = await page.evaluate(() => {
    const box = document.querySelector(".frag-list-scroll");
    const items = [...document.querySelectorAll(".frag-item")];
    const top = box.getBoundingClientRect();
    const seen = items.filter((li) => {
      const r = li.getBoundingClientRect();
      return r.top >= top.top && r.bottom <= top.bottom + 1;
    }).length;
    return { rows: items.length, row: items[0].offsetHeight, seen,
      scrolls: box.scrollHeight > box.clientHeight, page: document.documentElement.scrollHeight - innerHeight };
  });
  expect(out.rows).toBe(67);
  expect(out.row, "a compact row").toBeLessThanOrEqual(38);
  expect(out.seen, "rows on the screen at once, at 1280 by 720").toBeGreaterThanOrEqual(14);
  expect(out.scrolls, "the table scrolls in its own box").toBe(true);
  expect(out.page, "and the page does not").toBeLessThanOrEqual(1);
});

/* "I want you to be able to scroll": the wheel scrolls the table from
   anywhere on the view — over the aside too — and the scale down the
   aside fills as it does. */
test("the wheel scrolls the table from anywhere, and the scale fills with it", async ({ page }) => {
  await withMany(page, 60);
  await toTheTable(page);
  const read = () => page.evaluate(() => {
    const m = getComputedStyle(document.querySelector(".frag-scale-fill")).transform.match(/matrix\(([^)]+)\)/);
    return { top: document.querySelector(".frag-list-scroll").scrollTop, fill: m ? +m[1].split(",")[3] : 1 };
  });
  const before = await read();
  // Over the aside, well to the side of the table.
  await page.mouse.move(100, 420);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
  await page.waitForTimeout(700);
  const after = await read();
  expect(after.top, "the table scrolled").toBeGreaterThan(before.top + 400);
  expect(after.fill, "the scale filled further").toBeGreaterThan(before.fill + 0.1);
});

/* "change the view of the table so it is either as currently, or into
   small boxes or into cards". The three options change it: boxes are
   squares, several to a row; cards are larger, fewer to a row, each with
   its picture — Haxan's photograph, and the hatching with the number for
   one whose picture has not arrived. And back to the list. */
test("the options show the table as a list, as small boxes or as cards", async ({ page }) => {
  await toTheTable(page);
  await page.locator(".frag-mode[data-mode='boxes']").click();
  await page.waitForTimeout(900);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-boxes/);
  await expect(page.locator(".frag-mode[data-mode='boxes']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".frag-mode[data-mode='list']")).toHaveAttribute("aria-pressed", "false");
  const boxes = await acrossOf(page);
  expect(boxes, "several boxes to a row").toBeGreaterThanOrEqual(4);
  const square = await page.locator(".frag-item").first().boundingBox();
  expect(Math.abs(square.width - square.height), "a box is square").toBeLessThanOrEqual(2);
  expect(square.width, "and small").toBeLessThan(220);
  await expect(page.locator(".frag-item").last()).toHaveCSS("opacity", "1");

  await page.locator(".frag-mode[data-mode='cards']").click();
  await page.waitForTimeout(900);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-cards/);
  const cards = await acrossOf(page);
  expect(cards, "fewer cards to a row than boxes").toBeLessThan(boxes);
  const haxan = page.locator(".frag-item", { hasText: "Haxan" }).locator(".frag-t-pic img");
  await expect(haxan).toHaveCount(1, { timeout: 5000 });
  await expect.poll(() => haxan.evaluate((img) => img.naturalWidth), { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.locator(".frag-item", { hasText: "Haxan" }).locator(".frag-t-pic")).toHaveClass(/has-picture/);
  const cv = page.locator(".frag-item", { hasText: "CV99" }).locator(".frag-t-pic");
  await expect(cv).not.toHaveClass(/has-picture/);
  await expect(cv.locator(".frag-t-pic-no")).toHaveText("001");
  await expect(cv.locator(".frag-t-pic-no")).toBeVisible();

  await page.locator(".frag-mode[data-mode='list']").click();
  await page.waitForTimeout(900);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-list/);
  expect((await page.locator(".frag-item").first().boundingBox()).height).toBeLessThanOrEqual(38);
});

/* THE CHOICE IS KEPT for the next visit, in this browser. */
test("the way of showing the table is kept for the next visit", async ({ page }) => {
  await toTheTable(page);
  await page.locator(".frag-mode[data-mode='boxes']").click();
  await page.waitForTimeout(500);
  await toTheTable(page);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-boxes/);
  await expect(page.locator(".frag-mode[data-mode='boxes']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".frag-read-mode")).toHaveText("Boxes");
});

/* SORTED BY ANY HEADING, AND SEARCHED — the old board's two, in the list
   and in the boxes alike. */
test("the headings sort the table and the field searches it, in any of the three", async ({ page }) => {
  await toTheTable(page);
  await page.locator(".frag-sort[data-key='name']").click();
  expect((await rowsOf(page)).map((r) => r[1])).toEqual(
    ["CV99", "De Profundis", "Flamenco EDP", "French Riviera", "Haxan", "Tobacolor", "Velvet Fog"]);
  await page.locator(".frag-sort[data-key='name']").click();
  expect((await rowsOf(page))[0][1], "pressed again, turned round").toBe("Velvet Fog");
  await expect(page.locator(".frag-read-sort")).toHaveText("Fragrance ↑");
  await page.locator(".frag-mode[data-mode='boxes']").click();
  await page.waitForTimeout(600);
  await page.locator(".frag-sort[data-key='house']").click();
  expect((await rowsOf(page))[0][2]).toBe("Casa Goa");
  await page.locator(".frag-list-field").fill("serge");
  expect((await rowsOf(page)).map((r) => r[1])).toEqual(["De Profundis"]);
  await expect(page.locator(".frag-list-count")).toHaveText("001");
  await expect(page.locator(".frag-scale-tick:not([hidden])")).toHaveCount(1);
});

/* AN ITEM OPENS ITS FRAGRANCE IN THE PAGE, as a row of the old table did
   — without leaving it — whether it is a row or a card. */
test("pressing a row or a card opens its fragrance in the page", async ({ page }) => {
  await toTheTable(page);
  const was = page.url();
  await page.locator(".frag-item", { hasText: "Haxan" }).click();
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1, { timeout: 5000 });
  expect(page.url()).toBe(was);
  await expect(page.locator(".frag-reader h2").first()).toContainText("Haxan");
  expect(parseFloat(await page.locator(".frag-stage").evaluate((el) => getComputedStyle(el).opacity)),
    "the table is off the window while it is read").toBeLessThan(0.05);
  await page.locator(".frag-back").click();
  await expect(page.locator(".frag-reader")).toBeHidden({ timeout: 6000 });
  await page.waitForTimeout(600);
  expect(parseFloat(await page.locator(".frag-stage").evaluate((el) => getComputedStyle(el).opacity)),
    "and back after").toBeGreaterThan(0.95);

  await page.locator(".frag-mode[data-mode='cards']").click();
  await page.waitForTimeout(900);
  await page.locator(".frag-item", { hasText: "French Riviera" }).click();
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator(".frag-reader h2").first()).toContainText("French Riviera");
});

/* THE OLD VIEW IS KEPT: "keep the current copy exactly as it is; and
   save it somewhere in the code. Do not overwrite it." It stands in
   archive/, and it is still the page's own markup — which is what the
   table reads and presses — so with this script blocked the page is the
   old view, working as it did. */
test("the old Fragrances view is kept, in the archive and in the page", async ({ page }) => {
  const root = path.join(__dirname, "..");
  const kept = fs.readFileSync(path.join(root, "archive", "fragrances-view-2026-09-24.html"), "utf8");
  const live = fs.readFileSync(path.join(root, "categories", "scent-descriptions.html"), "utf8");
  const section = (html) => html.slice(html.indexOf('<section class="view" data-view="fragrances"'),
    html.indexOf("</section>", html.indexOf('<section class="view" data-view="fragrances"')) + 10);
  // The one thing that has changed in the page since is what the owner
  // asked for in the same breath: the dates on 001 to 007.
  const undated = (html) => html.replace(/data-date="[^"]*"/g, 'data-date=""').replace(/<td class="index-date">[^<]*<\/td>/g, '<td class="index-date"></td>');
  expect(section(kept).length).toBeGreaterThan(1000);
  expect(undated(section(live)), "the page still carries the old view, unchanged but for its dates").toBe(undated(section(kept)));

  await page.route("**/fragrance-line.js", (route) => route.abort());
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  await page.waitForTimeout(1200);
  await expect(page.locator(".view[data-view='fragrances'] .index-table")).toBeVisible();
  await expect(page.locator(".frag-stage")).toHaveCount(0);
});

/* THE STRETCH, in the order it was asked for: "the line from houses will
   have a pixel stretch effect to the right side of the page, while
   everything else fades (except the particles). and then the page will
   scroll (so that the left side of the fragrances page has the same
   pixel stretch effect until the middle of the screen), which will then
   unstretch in the middle ... and then the rest of the page should load
   in". With the line gone, what the streaks unstretch INTO is the table's
   own ruling. Read off the stretch's own canvas every frame: first ink on
   the right of the axis and none on the left; then ink on the left of the
   middle and none on the right; then the ink gathered onto the table's
   rules, across the table's own width; and the table only once it has
   gathered. The houses fade, and their particles do not. */
test("going to the Fragrances stretches the axis right, travels, and gathers into the table's rules", async ({ page }) => {
  test.setTimeout(60000);
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(2000);
  const seen = await page.evaluate(() => new Promise((done) => {
    const out = { right: 0, left: 0, gathered: 0, tableEarly: false, housesFaded: false, fieldKept: true, rules: "" };
    const t0 = performance.now();
    const look = () => {
      const t = performance.now() - t0;
      const c = document.querySelector(".view-stretch");
      const stage = document.querySelector(".frag-stage");
      if (c) {
        const r = c.width / c.getBoundingClientRect().width, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        const ys = stage && stage.dataset.rules ? stage.dataset.rules.split(",").map(Number) : [];
        const l = stage ? +stage.dataset.ruleL : 0, rr = stage ? +stage.dataset.ruleR : innerWidth;
        let L = 0, R = 0, on = 0, all = 0;
        for (let y = 0; y < c.height; y += 3) for (let x = 0; x < c.width; x += 6) {
          if (d[(y * c.width + x) * 4 + 3] < 12) continue;
          const cx = x / r, cy = y / r;
          if (cx < innerWidth / 2 - 20) L++; else if (cx > innerWidth / 2 + 20) R++;
          all++;
          if (ys.some((ry) => Math.abs(ry - cy) <= 3) && cx >= l - 6 && cx <= rr + 6) on++;
        }
        if (R > 200 && L < 20) out.right++;
        if (L > 200 && R < 20) out.left++;
        if (all > 40 && on / all > 0.9) out.gathered++;
      }
      // The table may not come in before the streaks have gathered.
      if (c && stage && !stage.classList.contains("waiting") && !out.gathered && t > 100) out.tableEarly = true;
      const frame = document.querySelector(".sheet-frame.front");
      if (t > 500 && t < 700 && frame && parseFloat(getComputedStyle(frame).opacity) < 0.1) out.housesFaded = true;
      const field = document.querySelector(".sheet-field");
      if (t > 500 && t < 700 && field && parseFloat(getComputedStyle(field).opacity) < 0.9) out.fieldKept = false;
      if (t < 4000) { requestAnimationFrame(look); return; }
      out.overlayLeft = !!document.querySelector(".view-stretch");
      out.rules = stage ? stage.dataset.rules : "";
      done(out);
    };
    document.querySelector('.sheet-filter[data-view="fragrances"]').click();
    requestAnimationFrame(look);
  }));
  expect(seen.right, "first the axis stretched out to the right").toBeGreaterThan(5);
  expect(seen.left, "then the stretch on the left, up to the middle").toBeGreaterThan(5);
  expect(seen.gathered, "then gathered onto the table's rules").toBeGreaterThan(3);
  expect(seen.housesFaded, "the houses fade").toBe(true);
  expect(seen.fieldKept, "and their particles do not").toBe(true);
  expect(seen.tableEarly, "the table waits for the ruling").toBe(false);
  expect(seen.overlayLeft, "and nothing is left over the page").toBe(false);
  expect(seen.rules.split(",").length, "the rule under the sort bar and one under each of the seven rows").toBe(8);
  await expect(page.locator(".frag-aside")).toHaveCSS("opacity", "1", { timeout: 3000 });
  await expect(page.locator(".frag-item").last().locator(".frag-t-name")).toHaveCSS("opacity", "1", { timeout: 3000 });

  // AND BACK: the ruling spreads, the page travels the other way, and the
  // houses come in on their axis.
  await page.locator('.sheet-filter[data-view="houses"]').click();
  await page.waitForTimeout(3200);
  await expect(page.locator('.view[data-view="houses"]')).toBeVisible();
  await expect(page.locator('.view[data-view="fragrances"]')).toBeHidden();
  await expect(page.locator(".view-stretch")).toHaveCount(0);
  await expect(page.locator(".sheet-frame.front")).toHaveCSS("opacity", "1", { timeout: 3000 });
});

/* WITH MOTION TURNED OFF there is no stretch: the views simply change
   over and the table is there, whole. */
test("with motion turned off the views change over at once, the table whole", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator(".view-stretch")).toHaveCount(0);
  await expect(page.locator(".frag-aside")).toHaveCSS("opacity", "1");
  await expect(page.locator(".frag-item").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".frag-item").first().locator(".frag-t-name")).toHaveCSS("opacity", "1");
  await page.locator(".frag-mode[data-mode='boxes']").click();
  await expect(page.locator(".frag-stage")).toHaveClass(/is-boxes/);
  await expect(page.locator(".frag-item").first()).toHaveCSS("opacity", "1");
  await context.close();
});

/* ON A PHONE the table is still the page: nothing runs off sideways, the
   three options stand at the right of the head, all four columns of a row
   are on the window, and the boxes still come. */
test("on a phone the table fits the window, with the options beside its name", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await toTheTable(page);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(wide).toBeLessThanOrEqual(1);
  const cells = await page.$$eval(".frag-item:first-child > span:not(.frag-t-pic)", (all) => all.map((s) => {
    const r = s.getBoundingClientRect();
    return { left: r.left, right: r.right, text: s.textContent.trim() };
  }));
  expect(cells.map((c) => c.text)).toEqual(["001", "CV99", "Lussur", "24.09.2026"]);
  cells.forEach((c) => { expect(c.left).toBeGreaterThanOrEqual(0); expect(c.right).toBeLessThanOrEqual(390); });
  for (const m of ["list", "boxes", "cards"]) {
    const b = await page.locator(`.frag-mode[data-mode='${m}']`).boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(390);
    expect(b.y + b.height, "above the table").toBeLessThanOrEqual((await page.locator(".frag-list-scroll").boundingBox()).y);
  }
  await page.locator(".frag-mode[data-mode='boxes']").tap();
  await page.waitForTimeout(900);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-boxes/);
  expect(await acrossOf(page), "boxes several to a row on a phone too").toBeGreaterThanOrEqual(2);
  await context.close();
});
