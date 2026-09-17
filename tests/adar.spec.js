// ============================================================
// ADAR (works/adar.html)
//
// The house nobody has heard of: eleven fragrances in four groups, on
// a ground that is a VOID rather than a wood. These check the things
// that can be wrong rather than merely ugly — that the eleven are
// really eleven, that a fragrance is a title until it is opened, that
// the void is drawn and is actually a hole, that the page spends no
// colour at all, and that none of it is needed to read the writing.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const ADAR = "/works/adar.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

// The photographs are the owner's to add: the page names the file it
// wants for each fragrance and works without it, taking the <img> off
// the page and leaving the hatched placeholder. So a picture that is
// not there yet is an expected 404 here rather than a fault, and
// `tests/adar.spec.js` says so in one place.
const MISSING_PICTURES = ["404 (File not found)"];

test("the house is eleven fragrances in four groups", async ({ page }) => {
  const errors = collectPageErrors(page, MISSING_PICTURES);
  await page.goto(ADAR);

  const parts = page.locator(".adar-part");
  await expect(parts).toHaveCount(11);

  // Four groups — the three trilogies and the two that stand outside
  // them — named in the page's own markup rather than worked out.
  const groups = await page.$$eval(".adar-group", (all) =>
    all.map((g) => [g.querySelector("h2").textContent.trim(),
                    g.querySelectorAll(".adar-part").length]));
  expect(groups.map((g) => g[0])).toEqual([
    "Aegis Trilogy", "Équilibre Précaire Trilogy", "Introspection Trilogy", "Others",
  ]);
  expect(groups.map((g) => g[1])).toEqual([3, 3, 3, 2]);

  // Numbered straight through, 01 to 11, in the markup.
  const numbers = await page.$$eval(".adar-no", (all) => all.map((n) => n.textContent.trim()));
  expect(numbers).toEqual(Array.from({ length: 11 }, (v, n) => String(n + 1).padStart(2, "0")));

  expect(errors, "no console errors").toEqual([]);
});

test("a fragrance is a title until it is opened", async ({ page }) => {
  await page.goto(ADAR);
  const part = page.locator("#part-01");
  // Not the stage label above it — "Top", "Base", a sidenote — which
  // is a paragraph too.
  const writing = part.locator(".adar-text p:not(.adar-stage)").first();

  await expect(part.locator(".adar-title")).toContainText("Amber Zero");
  await expect(writing).toBeHidden();
  await expect(part.locator(".adar-cue")).toHaveText("Open");

  await part.locator("summary").click();
  await expect(writing).toBeVisible();
  await expect(part.locator(".adar-cue")).toHaveText("Close");
  // The owner's own writing, not a placeholder.
  await expect(writing).toContainText("romanticize drowning");

  await part.locator("summary").click();
  await expect(writing).toBeHidden();
});

test("the sounding counts the eleven off as they are passed", async ({ page }) => {
  await page.goto(ADAR);
  await expect(page.locator(".adar-tick")).toHaveCount(11);
  await expect(page.locator(".adar-readout-no")).toHaveText("00");
  await expect(page.locator(".adar-readout-where")).toHaveText("Introduction");

  await page.locator("#part-05").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const at = await page.locator(".adar-readout-no").textContent();
  expect(Number(at), "the reading should have counted up").toBeGreaterThanOrEqual(4);
  await expect(page.locator(".adar-readout-where")).not.toHaveText("Introduction");
  const passed = await page.locator(".adar-tick.passed").count();
  expect(passed, "and inked in that many ticks").toBeGreaterThanOrEqual(4);
});

test("the void is a hole, with the drawing standing round it", async ({ page }) => {
  await page.goto(ADAR);
  await page.waitForTimeout(1200);

  // Nothing at all inside the hole, and something drawn just outside
  // it. A disc painted over the drawing would fail the first of these,
  // because the drawing would still be under it.
  const read = await page.evaluate(() => {
    const canvas = document.querySelector(".adar-void");
    const paint = canvas.getContext("2d");
    const ratio = canvas.width / parseFloat(canvas.style.width);
    const wide = parseFloat(canvas.style.width);
    const tall = parseFloat(canvas.style.height);
    const small = Math.min(wide, tall);
    const cx = wide * 0.8, cy = tall * 0.46, r = small * 0.13;
    const ink = (x, y, box) => {
      const shot = paint.getImageData(
        Math.round((x - box / 2) * ratio), Math.round((y - box / 2) * ratio),
        Math.round(box * ratio), Math.round(box * ratio)).data;
      let sum = 0;
      for (let i = 3; i < shot.length; i += 4) sum += shot[i];
      return sum;
    };
    return { inside: ink(cx, cy, r), around: ink(cx, cy - r * 1.6, r * 0.6) };
  });
  expect(read.inside, "nothing is drawn inside the void").toBe(0);
  expect(read.around, "and the drawing stands round it").toBeGreaterThan(0);
});

test("nothing on the page is drawn in the site's accent colour", async ({ page }) => {
  // The chamber spends no accent; this page spends none either. It is
  // white on black and nothing else — which is what "void" means here.
  await page.goto(ADAR);
  await page.waitForTimeout(1000);

  const tinted = await page.evaluate(() => {
    const canvas = document.querySelector(".adar-void");
    const paint = canvas.getContext("2d");
    const shot = paint.getImageData(0, 0, canvas.width, canvas.height).data;
    let coloured = 0;
    // Only where there is enough ink to read a colour off at all: a
    // canvas keeps what it is given multiplied by its own alpha, so a
    // mark drawn at two hundredths comes back rounded to something
    // that can look tinted without anything having been tinted.
    for (let i = 0; i < shot.length; i += 4) {
      if (shot[i + 3] < 60) continue;
      const r = shot[i], g = shot[i + 1], b = shot[i + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) > 20) coloured++;
    }
    return coloured;
  });
  expect(tinted, "every mark on the drawing is grey").toBe(0);

  // And nothing in the writing over it is the site's accent either.
  const brass = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--brass").trim());
  const asRGB = await page.evaluate((hex) => {
    const probe = document.createElement("span");
    probe.style.color = hex;
    document.body.appendChild(probe);
    const said = getComputedStyle(probe).color;
    probe.remove();
    return said;
  }, brass);
  const spent = await page.evaluate((accent) => {
    const found = [];
    document.querySelectorAll(".adar-page *").forEach((el) => {
      const cs = getComputedStyle(el);
      ["color", "backgroundColor", "borderTopColor", "borderBottomColor"].forEach((which) => {
        if (cs[which] === accent) found.push(el.className + " " + which);
      });
    });
    return found;
  }, asRGB);
  expect(spent, "the accent is unspent on this page").toEqual([]);
});

test("with animation turned off the void stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ADAR);
  await page.waitForTimeout(600);

  const shot = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".adar-void");
      const paint = canvas.getContext("2d");
      const data = paint.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      return sum;
    });
  const before = await shot();
  await page.waitForTimeout(900);
  expect(await shot(), "the drawing should not have moved").toBe(before);

  // And every fragrance is simply there, rather than waiting to arrive.
  const shown = await page.$$eval(".adar-part", (parts) =>
    parts.filter((p) => parseFloat(getComputedStyle(p).opacity) > 0.9).length);
  expect(shown).toBe(11);
});

test("without its script the page is still all of its writing", async ({ page }) => {
  await page.route("**/adar.js", (route) => route.abort());
  const errors = collectPageErrors(page, ["ERR_FAILED", "Failed to load resource"]);
  await page.goto(ADAR);

  await expect(page.locator(".adar-part")).toHaveCount(11);
  const part = page.locator("#part-06");
  await part.locator("summary").click();
  await expect(part.locator(".adar-text p").first()).toBeVisible();
  // Nothing is left hidden by a class the script never came to remove.
  const hidden = await page.$$eval(".adar-part", (parts) =>
    parts.filter((p) => parseFloat(getComputedStyle(p).opacity) < 0.9).length);
  expect(hidden, "every fragrance is on the page").toBe(0);
  expect(errors, "no errors beyond the blocked file").toEqual([]);
});

test("the house is what the sheet's second picture points at", async ({ page }) => {
  await page.goto("/categories/scent-descriptions.html");
  const second = page.locator(".sheet-frame").nth(1);
  await expect(second).toHaveAttribute("href", "../works/adar.html");
  await expect(second.locator(".sheet-caption"))
    .toHaveText("ADAR: the house that you have never heard of");
});
