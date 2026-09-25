// ============================================================
// THE FRAGRANCES, ALONG A LINE — fragrance-line.js, and the stretch
// between the two views in views.js (categories/scent-descriptions.html)
//
// The owner asked for the Fragrances view to be made again "which takes
// inspiration from the houses page": a horizontal line through the
// page, a double pyramid of particles on it with dimension, the
// fragrances as files — 001 and the name — the house on hover, new ones
// coming as you scroll, twenty of them for the test. And for the old
// view to be kept, exactly as it was. And for a transition from the
// Houses: the axis stretched to the right, the page travelling, the
// stretch gathering into the new line.
//
// These check what can be WRONG: the twenty files and which are real,
// the house only on hover, scrolling actually travelling and bringing
// files in, the pyramid turning with it, a file opening its fragrance in
// the page, the old view kept, and the stretch running in the order it
// was asked for — and not at all with motion turned off.
// ============================================================
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

async function toTheLine(page) {
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet") &&
    document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  // The stretch, and the files coming in after it.
  await page.waitForTimeout(4200);
}

const files = (page) => page.$$eval(".frag-file", (all) => all.map((b) => ({
  no: b.querySelector(".frag-file-no").textContent,
  name: b.querySelector(".frag-file-name").textContent,
  placeholder: b.classList.contains("is-placeholder"),
  seen: parseFloat(getComputedStyle(b).opacity),
  x: b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2,
  front: b.classList.contains("is-front"),
})));

/* TWENTY FILES ON THE LINE, the first seven the owner's. "For this test,
   assume there are 20 fragrances." The seven written are read off the
   old table, in its order; the thirteen after are placeholders,
   numbered on and named nothing. */
test("the Fragrances view is a line of twenty files, the first seven the owner's", async ({ page }) => {
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await toTheLine(page);
  const all = await files(page);
  expect(all.length).toBe(20);
  expect(all.map((f) => f.no)).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(3, "0")));
  expect(all.slice(0, 7).map((f) => f.name)).toEqual(
    ["CV99", "De Profundis", "Haxan", "Tobacolor", "Flamenco EDP", "French Riviera", "Velvet Fog"]);
  expect(all.slice(0, 7).every((f) => !f.placeholder)).toBe(true);
  expect(all.slice(7).every((f) => f.placeholder && f.name === "Untitled")).toBe(true);
  // The first stands in the middle of the window, on the line.
  const first = all[0];
  expect(first.front).toBe(true);
  expect(Math.abs(first.x - 640)).toBeLessThan(4);
  // And the old table is not what is on the window.
  await expect(page.locator(".view[data-view='fragrances'] .index-page")).toBeHidden();
  expect(errors).toEqual([]);
});

/* THE HOUSE, WHEN IT IS POINTED AT: "the house it came from when you
   hover it". */
test("a file says the house it came from only while it is pointed at", async ({ page }) => {
  await toTheLine(page);
  const house = page.locator(".frag-file").first().locator(".frag-file-house");
  await expect(house).toHaveText("Lussur");
  await page.mouse.move(640, 690);
  await page.waitForTimeout(400);
  expect(parseFloat(await house.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.05);
  await page.locator(".frag-file").first().hover();
  await page.waitForTimeout(450);
  expect(parseFloat(await house.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.95);
});

/* SCROLLING TRAVELS ALONG THE LINE, AND NEW FILES COME IN. "I want the
   paage to react to scrolling, so new ones would appear." And the
   pyramid has dimension: "when you scroll, it changes in a given way" —
   it turns a quarter turn for every file travelled. */
test("the wheel travels along the line, new files come in, and the pyramid turns with it", async ({ page }) => {
  await toTheLine(page);
  const before = await files(page);
  expect(before[8].seen, "file 009 is not on the window yet").toBeLessThan(0.05);
  const turned = () => page.evaluate(() => +document.querySelector(".frag-line").dataset.turn);
  const t0 = await turned();
  await page.mouse.move(640, 200);
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
  await page.waitForTimeout(1400);
  const front = +(await page.locator(".frag-line").getAttribute("data-front"));
  expect(front, "it has travelled along").toBeGreaterThan(5);
  const after = await files(page);
  expect(after[8].seen, "and 009 has come in").toBeGreaterThan(0.2);
  expect(after[front - 1].front).toBe(true);
  const t1 = await turned();
  // A quarter turn a file, and a very slow turn of its own besides.
  expect(t1 - t0, "the pyramid turned with it").toBeGreaterThan((front - 1) * Math.PI / 2 - 0.3);
  expect(t1 - t0).toBeLessThan((front - 1) * Math.PI / 2 + 0.6);
  await expect(page.locator(".frag-line-at b")).toHaveText(String(front).padStart(3, "0") + " / 020");
});

/* THE PYRAMID IS DRAWN AROUND THE LINE: specks above the line and below
   it in the middle of the window, reaching up and down towards its two
   apices, and far fewer out at the sides away from the line. */
test("a double pyramid of specks stands on the line, its apices above and below", async ({ page }) => {
  await toTheLine(page);
  const out = await page.evaluate(() => {
    const c = document.querySelector(".frag-line-field");
    const r = c.width / innerWidth;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const lineY = +document.querySelector(".frag-line").dataset.lineY;
    const count = (x1, x2, y1, y2) => {
      let n = 0;
      for (let y = Math.round(y1 * r); y < Math.round(y2 * r); y += 2)
        for (let x = Math.round(x1 * r); x < Math.round(x2 * r); x += 2) if (d[(y * c.width + x) * 4 + 3] > 25) n++;
      return n;
    };
    const W = innerWidth;
    return { above: count(W / 2 - 140, W / 2 + 140, lineY - 230, lineY - 60),
      below: count(W / 2 - 140, W / 2 + 140, lineY + 60, lineY + 230),
      side: count(20, 300, lineY - 230, lineY - 60) };
  });
  expect(out.above, "specks above the line").toBeGreaterThan(80);
  expect(out.below, "and below it").toBeGreaterThan(80);
  expect(out.side, "and much less out to the side").toBeLessThan(out.above / 2);
});

/* A FILE OPENS ITS FRAGRANCE IN THE PAGE: pressing one at the side
   brings it to the middle; pressing the one in the middle opens it in
   the reader, as a row of the table did — without leaving the page. A
   placeholder opens nothing. */
test("pressing a file brings it to the middle, and the middle one opens in the page", async ({ page }) => {
  await toTheLine(page);
  const was = page.url();
  await page.locator(".frag-file").nth(2).click();
  await page.waitForTimeout(1300);
  await expect(page.locator(".frag-line")).toHaveAttribute("data-front", "3");
  await page.locator(".frag-file").nth(2).click();
  await expect(page.locator(".frag-reader.is-here")).toHaveCount(1, { timeout: 5000 });
  expect(page.url()).toBe(was);
  await expect(page.locator(".frag-reader .frag-title, .frag-reader h2").first()).toContainText("Haxan");
  expect(parseFloat(await page.locator(".frag-line").evaluate((el) => getComputedStyle(el).opacity)),
    "the line is off the window while it is read").toBeLessThan(0.05);
  await page.locator(".frag-back").click();
  await expect(page.locator(".frag-reader")).toBeHidden({ timeout: 6000 });
  await page.waitForTimeout(600);
  expect(parseFloat(await page.locator(".frag-line").evaluate((el) => getComputedStyle(el).opacity)),
    "and back after").toBeGreaterThan(0.95);
});

/* THE OLD VIEW IS KEPT: "keep the current copy exactly as it is; and
   save it somewhere in the code. Do not overwrite it." It stands in
   archive/, and it is still the page's own markup — which is what the
   line reads and presses — so with the line's script blocked the page is
   the old view, working as it did. */
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
  await expect(page.locator(".frag-line")).toHaveCount(0);
});

/* THE STRETCH, in the order it was asked for: "the line from houses will
   have a pixel stretch effect to the right side of the page, while
   everything else fades (except the particles). and then the page will
   scroll (so that the left side of the fragrances page has the same
   pixel stretch effect until the middle of the screen), which will then
   unstretch in the middle to form the new center line ... and then the
   rest of the page should load in". Read off the stretch's own canvas
   every frame: first ink on the right of the axis and none on the left;
   then ink on the left of the middle and none on the right; then ink
   gathered at the line's height; and the files only once it is done.
   The houses fade, and their particles do not. */
test("going to the Fragrances stretches the axis right, travels, and gathers into the line", async ({ page }) => {
  test.setTimeout(60000);
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.waitForTimeout(2000);
  const seen = await page.evaluate(() => new Promise((done) => {
    const out = { right: 0, left: 0, gathered: 0, filesEarly: false, housesFaded: false, fieldKept: true };
    const t0 = performance.now();
    const look = () => {
      const t = performance.now() - t0;
      const c = document.querySelector(".view-stretch");
      if (c) {
        const r = c.width / innerWidth, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let L = 0, R = 0, rows = new Set();
        for (let y = 0; y < c.height; y += 6) for (let x = 0; x < c.width; x += 6) {
          if (d[(y * c.width + x) * 4 + 3] < 12) continue;
          if (x / r < innerWidth / 2 - 20) L++; else if (x / r > innerWidth / 2 + 20) R++;
          rows.add(Math.round(y / r / 20));
        }
        if (R > 200 && L < 20) out.right++;
        if (L > 200 && R < 20) out.left++;
        if (rows.size <= 3 && L + R > 40) out.gathered++;
      }
      const frame = document.querySelector(".sheet-frame.front");
      if (t > 500 && t < 700 && frame && parseFloat(getComputedStyle(frame).opacity) < 0.1) out.housesFaded = true;
      const field = document.querySelector(".sheet-field");
      if (t > 500 && t < 700 && field && parseFloat(getComputedStyle(field).opacity) < 0.9) out.fieldKept = false;
      const file = document.querySelector(".frag-file");
      if (c && file && parseFloat(file.style.opacity || "0") > 0.3 && getComputedStyle(document.querySelector(".frag-line")).getPropertyValue("visibility") !== "hidden" &&
        !document.querySelector(".frag-line").classList.contains("waiting")) out.filesEarly = true;
      if (t < 4000) { requestAnimationFrame(look); return; }
      out.overlayLeft = !!document.querySelector(".view-stretch");
      done(out);
    };
    document.querySelector('.sheet-filter[data-view="fragrances"]').click();
    requestAnimationFrame(look);
  }));
  expect(seen.right, "first the axis stretched out to the right").toBeGreaterThan(5);
  expect(seen.left, "then the stretch on the left, up to the middle").toBeGreaterThan(5);
  expect(seen.gathered, "then gathered into the one line").toBeGreaterThan(3);
  expect(seen.housesFaded, "the houses fade").toBe(true);
  expect(seen.fieldKept, "and their particles do not").toBe(true);
  expect(seen.filesEarly, "the files wait for the line").toBe(false);
  expect(seen.overlayLeft, "and nothing is left over the page").toBe(false);
  await expect(page.locator(".frag-file").first()).toHaveCSS("opacity", "1", { timeout: 3000 });

  // AND BACK: the line spreads, the page travels the other way, and the
  // houses come in on their axis.
  await page.locator('.sheet-filter[data-view="houses"]').click();
  await page.waitForTimeout(3200);
  await expect(page.locator('.view[data-view="houses"]')).toBeVisible();
  await expect(page.locator('.view[data-view="fragrances"]')).toBeHidden();
  await expect(page.locator(".view-stretch")).toHaveCount(0);
  await expect(page.locator(".sheet-frame.front")).toHaveCSS("opacity", "1", { timeout: 3000 });
});

/* WITH MOTION TURNED OFF there is no stretch: the views simply change
   over and the line is there, whole. */
test("with motion turned off the views change over at once, the line whole", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await serveDependenciesLocally(page);
  await page.goto(SHEET);
  await page.waitForFunction(() => document.getElementById("sheet").classList.contains("drawn"), null, { timeout: 20000 });
  await page.locator('.sheet-filter[data-view="fragrances"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator(".view-stretch")).toHaveCount(0);
  const all = await files(page);
  expect(all[0].seen).toBeGreaterThan(0.95);
  await context.close();
});

/* ON A PHONE the line is still the page: nothing runs off sideways, the
   file in the middle is whole on the window, and a drag across travels
   along. */
test("on a phone the line fits, and a drag travels along it", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await toTheLine(page);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(wide).toBeLessThanOrEqual(1);
  const box = await page.locator(".frag-file").first().boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.mouse.move(300, 250);
  await page.mouse.down();
  await page.mouse.move(120, 250, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  expect(+(await page.locator(".frag-line").getAttribute("data-front"))).toBeGreaterThan(1);
  await context.close();
});
