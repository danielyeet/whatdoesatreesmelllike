// ============================================================
// THE FRAGRANCES, A WHOLE-PAGE TABLE — fragrance-line.js, and the crossing
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
// was. And the pixel stretch between the two views is gone — "I want
// something simple, so that you can freely change between the houses and
// fragrances page. Make the two pages connected somehow too" — for THE
// CROSSING: the two fading through each other a little way to either
// side, turning round at once when pressed again, and the houses' axis
// travelling across to become the table's divider.
//
// These check what can be WRONG: the rows and their columns, nothing left
// drawn behind them, the page's three columns, a screen holding a good
// many rows, the wheel scrolling them from anywhere, the three ways of
// showing them and the choice being kept, sorting and searching, an item
// opening its fragrance in the page, the old view kept, and the crossing:
// quick, free to turn round, joined by the line, and each view carrying
// the way to the other — and none of it with motion turned off.
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
  // The crossing, and a moment for the table to settle.
  await page.waitForTimeout(1500);
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
    for (let i = 9; i < 9 + n; i++) {
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
   yesterdays)". Eight rows, in number order, the first seven dated
   24.09.2026 and House of Ellixirz, written the day after, 25.09.2026;
   the old table itself not on the window. */
test("the Fragrances view is a table: number, name, house and date, each dated the day it was written", async ({ page }) => {
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
    ["008", "House of Ellixirz", "Matca", "25.09.2026"],
  ]);
  await expect(page.locator(".frag-list-count")).toHaveText("008");
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
  expect([out.big, out.houses, out.last]).toEqual(["008", "008", "25.09.2026"]);
  expect(out.ticks, "a tick for every fragrance").toBe(8);
  expect(out.mark, "the mark").toBeGreaterThan(100);
  await expect(page.locator(".frag-mode")).toHaveText(["List", "Boxes", "Cards"]);
  await expect(page.locator(".frag-mode[data-mode='list']")).toHaveAttribute("aria-pressed", "true");
});

/* THE ASIDE'S NAME — 2026-09-25: "remove the text "The ones with no
   house here" and add "Individual" above the word fragrances (make it
   smaller than the actual word "fragrances")". */
test("the aside is headed Individual, smaller, over Fragrances, and says nothing else under them", async ({ page }) => {
  await toTheTable(page);
  const out = await page.evaluate(() => {
    const k = document.querySelector(".frag-aside-kicker"), n = document.querySelector(".frag-aside-name");
    return { kicker: k.textContent.trim(), name: n.textContent.trim(),
      above: k.getBoundingClientRect().bottom <= n.getBoundingClientRect().top + 1,
      smaller: parseFloat(getComputedStyle(k).fontSize) < parseFloat(getComputedStyle(n).fontSize) * 0.6,
      say: !!document.querySelector(".frag-aside-say"),
      aside: document.querySelector(".frag-aside").textContent };
  });
  expect([out.kicker, out.name]).toEqual(["Individual", "Fragrances"]);
  expect(out.above, "Individual stands above Fragrances").toBe(true);
  expect(out.smaller, "and is set smaller than it").toBe(true);
  expect(out.say).toBe(false);
  expect(out.aside).not.toContain("The ones with no house here");
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
  expect(out.rows).toBe(68);
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
   its picture — and the hatching with the number for one whose picture
   has not arrived. Every fragrance's picture has arrived since 2026-09-25,
   so CV99's is taken away here (it answers 404) to see the hatching still
   comes; De Profundis' and Haxan's show. And back to the list. */
test("the options show the table as a list, as small boxes or as cards", async ({ page }) => {
  await page.route(/001(%20| )CV99\.jpg$/, (route) => route.fulfill({ status: 404, body: "" }));
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
  const haxan = page.locator(".frag-item", { hasText: "Haxan" }).locator(".frag-t-pic .frag-t-shot");
  await expect(haxan).toHaveCount(1, { timeout: 5000 });
  await expect.poll(() => haxan.evaluate((img) => img.naturalWidth), { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.locator(".frag-item", { hasText: "Haxan" }).locator(".frag-t-pic")).toHaveClass(/has-picture/);
  await expect(page.locator(".frag-item", { hasText: "De Profundis" }).locator(".frag-t-pic")).toHaveClass(/has-picture/, { timeout: 5000 });
  const cv = page.locator(".frag-item", { hasText: "CV99" }).locator(".frag-t-pic");
  await expect(cv).not.toHaveClass(/has-picture/);
  await expect(cv.locator(".frag-t-pic-no")).toHaveText("001");
  await expect(cv.locator(".frag-t-pic-no")).toBeVisible();

  await page.locator(".frag-mode[data-mode='list']").click();
  await page.waitForTimeout(900);
  await expect(page.locator(".frag-stage")).toHaveClass(/is-list/);
  expect((await page.locator(".frag-item").first().boundingBox()).height).toBeLessThanOrEqual(38);
});

/* THE WHOLE BOTTLE, OVER A BLUR OF ITSELF. The owner: "add a blurred
   version of the pictures in the boxes view ... MAKE IT SO THAT THE
   PICTURES IN THE CARDS AND IN THE BOXES MENU ARE ZOOMED OUT AND YOU CAN
   SEE THE ENTIRE FRAGRANCE!" Every picture that arrives stands whole —
   `contain`, never cropped — inside its box, over a blurred copy of the
   same file filling the rest; and a studio shot on white is set on
   white, so it has no rectangle round it. Boxes carry pictures now as
   well as cards. */
test("boxes and cards show each fragrance whole, over a blurred copy of its picture", async ({ page }) => {
  await toTheTable(page);
  for (const mode of ["boxes", "cards"]) {
    await page.locator(`.frag-mode[data-mode='${mode}']`).click();
    await page.waitForTimeout(900);
    await expect(page.locator(".frag-item", { hasText: "Haxan" }).locator(".frag-t-pic"))
      .toHaveClass(/has-picture/, { timeout: 5000 });
    await expect.poll(() => page.$$eval(".frag-t-pic.has-picture", (all) =>
      all.filter((p) => /is-(studio|scene)/.test(p.className)).length), { timeout: 5000 })
      .toBeGreaterThanOrEqual(5);
    const seen = await page.$$eval(".frag-item:not([hidden])", (all) => all.map((li) => {
      const pic = li.querySelector(".frag-t-pic");
      if (!pic.classList.contains("has-picture")) return null;
      const haze = pic.querySelector(".frag-t-haze");
      const shot = pic.querySelector(".frag-t-shot");
      const box = li.getBoundingClientRect();
      const s = shot.getBoundingClientRect();
      const hs = getComputedStyle(haze);
      return {
        name: li.querySelector(".frag-t-name").textContent.trim(),
        same: haze.getAttribute("src") === shot.getAttribute("src"),
        blurred: /blur\(/.test(hs.filter),
        hazeShown: hs.display !== "none" && Number(hs.opacity) > 0.3,
        fit: getComputedStyle(shot).objectFit,
        inside: s.left >= box.left - 1 && s.right <= box.right + 1 && s.top >= box.top - 1 && s.bottom <= box.bottom + 1,
        drawn: shot.naturalWidth > 0 && s.width > 20 && s.height > 20,
        studio: pic.classList.contains("is-studio"),
        scene: pic.classList.contains("is-scene"),
      };
    }).filter(Boolean));
    expect(seen.length, `${mode}: pictures arrive`).toBeGreaterThanOrEqual(5);
    for (const one of seen) {
      expect(one.same, `${mode}: ${one.name}'s blur is its own picture`).toBe(true);
      expect(one.blurred, `${mode}: ${one.name}'s copy is blurred`).toBe(true);
      expect(one.fit, `${mode}: ${one.name} is shown whole, never cropped`).toBe("contain");
      expect(one.inside, `${mode}: ${one.name} stands inside its own box`).toBe(true);
      expect(one.drawn, `${mode}: ${one.name} is drawn`).toBe(true);
      expect(one.studio || one.scene, `${mode}: ${one.name} is read as one kind or the other`).toBe(true);
      // A scene keeps its blur round it; a studio shot stands on white.
      if (one.scene) expect(one.hazeShown, `${mode}: ${one.name}'s blur fills round it`).toBe(true);
    }
    const haxan = seen.find((one) => one.name === "Haxan");
    expect(haxan && haxan.scene, "Haxan, on bark, is a scene with its blur round it").toBe(true);
  }
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
    ["CV99", "De Profundis", "Flamenco EDP", "French Riviera", "Haxan", "House of Ellixirz", "Tobacolor", "Velvet Fog"]);
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
  // What has changed in the page since is what the owner asked for:
  // the dates on 001 to 007, in the same breath, and a fragrance added
  // after them — 008, House of Ellixirz, on 2026-09-25 — with the count
  // over the table that goes with it. A row the archive never had is
  // taken out before comparing; every row it did have must be the same.
  const undated = (html) => html.replace(/data-date="[^"]*"/g, 'data-date=""').replace(/<td class="index-date">[^<]*<\/td>/g, '<td class="index-date"></td>')
    .replace(/\s*<tr data-no="(?:[89]|\d{2,})"[\s\S]*?<\/tr>/g, "")
    .replace(/(<span class="index-count" aria-hidden="true">)\d+(<\/span>)/, "$1$2");
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

/* THE CROSSING — "change the transition too please, so that the pixel
   stretch is not used. I want something simple, so that you can freely
   change between the houses and fragrances page. Make the two pages
   connected somehow too."
   SIMPLE: both views are on the window at once for a moment, one fading
   as the other comes, and it is over in well under a second; nothing of
   the stretch's canvas is ever made. CONNECTED: one line runs from where
   the houses' axis stands to where the table's divider stands, and the
   divider is there when it lands. */
test("going to the Fragrances is a quick crossing, and the axis travels across to be the table's divider", async ({ page }) => {
  test.setTimeout(60000);
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const seen = await page.evaluate(() => new Promise((done) => {
    const houses = document.querySelector('.view[data-view="houses"]');
    const frags = document.querySelector('.view[data-view="fragrances"]');
    const thread = document.querySelector(".views-thread");
    const sheet = document.getElementById("sheet").getBoundingClientRect();
    const out = { both: 0, stretch: false, xs: [], axis: sheet.left + sheet.width / 2, overAt: null };
    const t0 = performance.now();
    const look = () => {
      const t = performance.now() - t0;
      if (document.querySelector(".view-stretch")) out.stretch = true;
      const a = parseFloat(getComputedStyle(houses).opacity), b = parseFloat(getComputedStyle(frags).opacity);
      if (!houses.hidden && !frags.hidden && a > 0.1 && a < 0.9 && b > 0.1 && b < 0.9) out.both++;
      const cs = getComputedStyle(thread);
      if (parseFloat(cs.opacity) > 0.3) out.xs.push(new DOMMatrix(cs.transform).m41);
      if (out.overAt === null && houses.hidden && !frags.hidden) out.overAt = t;
      if (t < 1200) { requestAnimationFrame(look); return; }
      out.divider = +document.querySelector(".frag-stage").dataset.divider;
      const d = document.querySelector(".frag-divider").getBoundingClientRect();
      out.dividerAt = d.left;
      done(out);
    };
    document.querySelector('.sheet-filter[data-view="fragrances"]').click();
    requestAnimationFrame(look);
  }));
  expect(seen.stretch, "no pixel stretch").toBe(false);
  expect(seen.both, "the two fade through each other").toBeGreaterThan(2);
  expect(seen.overAt, "and it is over quickly").not.toBeNull();
  expect(seen.overAt).toBeLessThan(700);
  expect(seen.xs.length, "the line was seen travelling").toBeGreaterThan(3);
  expect(Math.abs(seen.xs[0] - seen.axis), "it leaves from the axis").toBeLessThan(80);
  expect(Math.abs(seen.xs[seen.xs.length - 1] - seen.divider), "and lands on the divider").toBeLessThan(3);
  expect(Math.abs(seen.dividerAt - seen.divider), "which stands there").toBeLessThan(2);
  expect(seen.divider, "between the aside and the table").toBeLessThan((await page.locator(".frag-main").boundingBox()).x);
  await expect(page.locator(".frag-aside")).toHaveCSS("opacity", "1");
  await expect(page.locator(".frag-item").last().locator(".frag-t-name")).toHaveCSS("opacity", "1");
  await expect(page.locator(".views")).not.toHaveClass(/swiping/);
});

/* AND BACK, ALL THE WAY TO THE AXIS — 2026-09-25: "when going in SD
   from fragrances to houses, i want the line that moves to go completely
   where the center line is in houses (and then disappears exactly in the
   middle of the page)". It used to land where the axis was while the
   Houses view was still sliding in, some twenty pixels short. So: the
   last place the line is seen is the axis as it stands once the houses
   have settled, which is the middle of the page, and then it is gone. */
test("coming back, the line travels all the way to the axis in the middle of the page, and goes there", async ({ page }) => {
  test.setTimeout(60000);
  await toTheTable(page);
  const seen = await page.evaluate(() => new Promise((done) => {
    const thread = document.querySelector(".views-thread");
    const out = { xs: [] };
    const t0 = performance.now();
    const look = () => {
      const cs = getComputedStyle(thread);
      if (parseFloat(cs.opacity) > 0.3) out.xs.push(new DOMMatrix(cs.transform).m41);
      if (performance.now() - t0 < 1500) { requestAnimationFrame(look); return; }
      const sheet = document.getElementById("sheet").getBoundingClientRect();
      out.axis = sheet.left + sheet.width / 2;
      // The page's own middle: the body's, which leaves the scrollbar's
      // gutter out of it.
      const body = document.body.getBoundingClientRect();
      out.middle = body.left + body.width / 2;
      out.after = parseFloat(getComputedStyle(thread).opacity);
      done(out);
    };
    document.querySelector('.sheet-filter[data-view="houses"]').click();
    requestAnimationFrame(look);
  }));
  expect(seen.xs.length, "the line was seen travelling").toBeGreaterThan(3);
  const last = seen.xs[seen.xs.length - 1];
  expect(Math.abs(last - seen.axis), `it lands at ${last}, the axis at ${seen.axis}`).toBeLessThan(3);
  expect(Math.abs(seen.axis - seen.middle), "which is the middle of the page").toBeLessThan(3);
  expect(seen.after, "and then it is gone").toBeLessThan(0.05);
});

/* FREE: a press while the crossing is running is taken AT ONCE — it
   turns round from where it has got to rather than finishing first — so
   the two can be gone between as fast as the buttons are pressed, and
   nothing is left half done. And each view carries the way to the other
   in itself: "The fragrances →" under the way round, "← The houses" at
   the foot of the aside. */
test("the views can be gone between freely, and each carries the way to the other", async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectPageErrors(page);
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  // Back and forth, faster than any one crossing takes.
  const at = await page.evaluate(() => new Promise((done) => {
    const press = (v) => document.querySelector('.sheet-filter[data-view="' + v + '"]').click();
    press("fragrances");
    setTimeout(() => press("houses"), 120);
    setTimeout(() => press("fragrances"), 220);
    setTimeout(() => press("houses"), 300);
    // Turned round at once: the last press is where it lands, and soon.
    const t0 = performance.now();
    const look = () => {
      const h = document.querySelector('.view[data-view="houses"]'), f = document.querySelector('.view[data-view="fragrances"]');
      if (performance.now() - t0 > 300 && !h.hidden && f.hidden) { done(performance.now() - t0); return; }
      if (performance.now() - t0 > 3000) { done(-1); return; }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  }));
  expect(at, "it lands on the last one pressed").toBeGreaterThan(0);
  expect(at, "without finishing the ones before first").toBeLessThan(900);
  await expect(page.locator('.sheet-filter[data-view="houses"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".views")).not.toHaveClass(/swiping/);
  await expect(page.locator('.view[data-view="houses"]')).toHaveAttribute("style", /^$|^\s*$/);

  // THE WAY OVER, from inside each view.
  await page.locator(".sheet-to-fragrances").click();
  await expect(page.locator('.view[data-view="fragrances"]')).toBeVisible();
  await expect(page.locator('.view[data-view="houses"]')).toBeHidden({ timeout: 2000 });
  await expect(page.locator('.sheet-filter[data-view="fragrances"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator(".frag-to-houses").click();
  await expect(page.locator('.view[data-view="houses"]')).toBeVisible();
  await expect(page.locator('.view[data-view="fragrances"]')).toBeHidden({ timeout: 2000 });
  expect(errors).toEqual([]);
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
