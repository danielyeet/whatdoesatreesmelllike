// ============================================================
// THE NOTE DISSEMINATION CALCULATOR (works/theory-03.html)
//
// The theory's own arithmetic, done for you. These check the two
// things that can be quietly wrong — the maths, and the change-over
// between the reading and the calculator — rather than how it looks.
//
// IT IS THE SAME PAGE. The owner asked for the field of stars behind
// the theory to "remain where they are and on screen", so there is no
// second page and no reload; the reading is taken off and the
// calculator put in its place. There is a test for that below, and it
// is the one worth keeping.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const THEORY = "/works/theory-03.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

/** Open the calculator from the page's own button. */
async function open(page) {
  await page.goto(THEORY);
  await page.waitForTimeout(500);
  await page.locator("#calc-enter").scrollIntoViewIfNeeded();
  await page.locator("#calc-enter").click();
  await expect(page.locator(".calc")).toBeVisible();
}

async function put(page, id, value) {
  const field = page.locator("#" + id);
  await field.fill(String(value));
  await page.waitForTimeout(120);
}

test("the button opens the calculator, and it is the same page",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(THEORY);
  await page.waitForTimeout(600);

  // The field is drawn before, and the SAME canvas is drawn after: a
  // second page would throw it away and roll another one.
  const before = await page.locator(".essay-field").evaluate((el) => el.width + "x" + el.height);
  await page.locator("#calc-enter").scrollIntoViewIfNeeded();
  await page.locator("#calc-enter").click();
  await page.waitForTimeout(900);

  await expect(page.locator(".calc")).toBeVisible();
  await expect(page.locator(".essay-body")).toBeHidden();
  await expect(page.locator(".essay-rule")).toBeHidden();
  const after = await page.locator(".essay-field").evaluate((el) => el.width + "x" + el.height);
  expect(after, "the field should be the one that was already there").toBe(before);
  expect(page.url(), "and it should not have navigated anywhere").toContain("theory-03.html");

  // And back again.
  await page.locator(".calc-back").click();
  await page.waitForTimeout(700);
  await expect(page.locator(".calc")).toBeHidden();
  await expect(page.locator(".essay-body")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the default model is IC over BC, read against the thresholds",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="plain"]').click();
  await page.waitForTimeout(400);

  await put(page, "ic-One", 10);
  await put(page, "bc-One", 90);
  // The Xerjoff of the piece: 0.1/0.9.
  await expect(page.locator(".calc-result-value")).toHaveText("0.111");
  await expect(page.locator(".calc-verdict")).toContainText("difficult to distinguish");

  await put(page, "ic-One", 90);
  await put(page, "bc-One", 10);
  await expect(page.locator(".calc-result-value")).toHaveText("9");
  await expect(page.locator(".calc-verdict")).toContainText("relatively easy");

  // Ten notes, and no heads: the default model has no direction to show.
  expect(await page.locator(".calc-stage-zone .zone-arrow").count()).toBe(10);
  expect(await page.locator(".calc-stage-zone .zone-head").count()).toBe(0);
});

test("the first variation works the piece's own Amber Zero example",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);

  await put(page, "n-all", 13);
  await put(page, "ic-Top", 15);
  await put(page, "bc-Top", 85);
  await put(page, "ic-Mid", 40);
  await put(page, "bc-Mid", 60);
  await put(page, "ic-DryDown", 85);
  await put(page, "bc-DryDown", 15);

  // The three readings the piece works out by hand: 0.136, 0.513, 4.36.
  const values = await page.$$eval(".calc-result-value", (all) =>
    all.map((one) => one.textContent.trim()));
  expect(values.length).toBe(3);
  expect(parseFloat(values[0].replace("+", ""))).toBeCloseTo(0.136, 2);
  expect(parseFloat(values[1].replace("+", ""))).toBeCloseTo(0.513, 2);
  expect(parseFloat(values[2].replace("+", ""))).toBeCloseTo(4.359, 2);
  values.forEach((v) => expect(v.startsWith("+")).toBe(true));

  // One note per n, and the heads point OUT while the sign is +.
  expect(await page.locator(".calc-stage-zone .zone-arrow").count()).toBe(39);
  expect(await page.locator(".calc-stage-zone .zone-head").count()).toBe(39);

  const rows = await page.$$eval(".calc-table tbody tr", (all) =>
    all.map((r) => r.innerText.replace(/\s+/g, " ")));
  expect(rows.length).toBe(3);
  expect(rows[0]).toContain("< 0.5");
  expect(rows[2]).toContain("> 2");
});

/* THE SIGN IS NOT PART OF THE ARITHMETIC. It says which way the notes
   are going, and every comparison with a threshold is made on the
   ABSOLUTE value — which is what the owner asked the bars to mean.
   Turning the sign over must move nothing but the sign. */
test("turning the sign over changes the sign and nothing else",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  await put(page, "n-all", 5);
  await put(page, "ic-Top", 90);
  await put(page, "bc-Top", 10);

  const readRow = () => page.$$eval(".calc-table tbody tr", (all) =>
    all[0].innerText.replace(/\s+/g, " "));

  const plus = await readRow();
  expect(plus).toContain("+18");
  expect(plus).toContain("> 2");
  const headsOut = await page.locator(".calc-stage-zone .zone-head").count();

  await page.locator('.calc-sign-pick[data-sign="-1"]').click();
  await page.waitForTimeout(250);
  const minus = await readRow();
  expect(minus).toContain("−18");
  expect(minus, "the threshold is read off the absolute value").toContain("> 2");
  // The heads turn round; there are still as many of them.
  expect(await page.locator(".calc-stage-zone .zone-head").count()).toBe(headsOut);
});

test("the second variation uses the stage's own n against the whole fragrance's x",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v2"]').click();
  await page.waitForTimeout(400);

  // The owner's caveat has to be readable before the rest of it.
  await expect(page.locator(".calc-caveat")).toBeVisible();
  await expect(page.locator(".calc-caveat")).toContainText("grain of salt");

  await put(page, "x-all", 20);
  await put(page, "n-Top", 5);
  await put(page, "ic-Top", 50);
  await put(page, "bc-Top", 50);
  // (0.5/0.5) x 20/5 = 4.
  const first = await page.locator(".calc-result-value").first().textContent();
  expect(parseFloat(first.replace("+", ""))).toBeCloseTo(4, 3);
  // And the diagram follows THAT stage's own n.
  const arrows = await page.locator('.calc-stage[data-stage="Top"] .zone-arrow').count();
  expect(arrows).toBe(5);
});

test("the review window carries complication 3, and closes", async ({ page }) => {
  await open(page);
  await expect(page.locator(".calc-modal")).toBeHidden();
  await page.locator(".calc-review").click();
  await expect(page.locator(".calc-modal")).toBeVisible();
  await expect(page.locator(".calc-modal-sheet")).toContainText("Complication 3");
  await expect(page.locator(".calc-modal-sheet")).toContainText("maximum theoretical complexity");
  await page.locator(".calc-modal-shut").click();
  await expect(page.locator(".calc-modal")).toBeHidden();
});

test("pointing at a term in the equation says what it is", async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  const say = page.locator(".calc-say");
  await expect(say).toContainText("Point at any part");
  await page.locator('.calc-term[data-say="IC"]').hover();
  await expect(say).toContainText("Individual Character");
  await page.locator('.calc-term[data-say="SIGN"]').hover();
  await expect(say).toContainText("more recognizable");
});

test("without the script the theory is unharmed", async ({ page, context }) => {
  await context.route("**/calculator.js", (route) => route.abort());
  await page.goto(THEORY);
  await expect(page.locator(".essay-body")).toBeVisible();
  await expect(page.locator(".essay-section")).toHaveCount(10);
  // The button is in the page, and does nothing — there is no
  // half-built calculator left stranded behind it.
  await expect(page.locator("#calc-enter")).toBeVisible();
  await expect(page.locator(".calc")).toHaveCount(0);
});

/* IC AND BC ARE TWO HALVES OF ONE HUNDRED. They are the share of a note
   outside the zone and the share inside it, so they cannot disagree —
   the owner asked for changing one to set the other to what is left,
   always.

   THIS IS A REGRESSION IN THE MAKING: the first go at it was written
   and then lost when the patch that carried it failed on a later line,
   so the pairing silently was not there at all and both fields kept
   their own value. */
test("IC and BC are two halves of one hundred, whichever one is typed in",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);

  const pair = () => page.evaluate(() => [
    document.querySelector("#ic-Top").value,
    document.querySelector("#bc-Top").value,
  ]);

  await put(page, "ic-Top", 15);
  expect(await pair()).toEqual(["15", "85"]);
  await put(page, "bc-Top", 40);
  expect(await pair(), "and the other way round too").toEqual(["60", "40"]);
  await put(page, "ic-Top", 0);
  expect(await pair()).toEqual(["0", "100"]);

  // On the default model as well, which has only the one pair.
  await page.locator('.calc-model[data-model="plain"]').click();
  await page.waitForTimeout(400);
  await put(page, "ic-One", 25);
  expect(await page.evaluate(() => [
    document.querySelector("#ic-One").value,
    document.querySelector("#bc-One").value,
  ])).toEqual(["25", "75"]);
});

/* EVERY FRACTION IS A VERTICAL ONE, and the sign's two halves stand
   apart — both asked for by name. A fraction is a numerator over a rule
   over a denominator; the plus-or-minus is a `+` set over a `−` with
   air between them, because the single `±` character welds its bar to
   the underside of the plus in the face this page is set in. */
test("the fractions are stacked and the sign's halves are separate",
  async ({ page }) => {
  await open(page);

  await page.locator('.calc-model[data-model="plain"]').click();
  await page.waitForTimeout(400);
  expect(await page.locator(".calc-equation .frac").count(),
    "IC over BC").toBe(1);

  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  expect(await page.locator(".calc-equation .frac").count(),
    "IC over BC, and 10 over n").toBe(2);
  // The rule is the numerator's own bottom border, so it is always
  // exactly as wide as the fraction.
  const ruled = await page.locator(".calc-equation .frac-n").first()
    .evaluate((el) => getComputedStyle(el).borderBottomWidth);
  expect(ruled).not.toBe("0px");
  // And the numerator really is above the denominator.
  const stacked = await page.locator(".calc-equation .frac").first().evaluate((el) => {
    const n = el.querySelector(".frac-n").getBoundingClientRect();
    const d = el.querySelector(".frac-d").getBoundingClientRect();
    return d.top >= n.bottom - 1;
  });
  expect(stacked, "the denominator should sit under the numerator").toBe(true);

  // The sign is two characters of its own, not the welded glyph.
  const pm = page.locator('.calc-term[data-say="SIGN"] .calc-pm');
  await expect(pm).toBeVisible();
  const halves = pm.locator(".calc-pm-half");
  await expect(halves).toHaveCount(2);
  expect((await halves.nth(0).innerText()).trim()).toBe("+");
  expect((await halves.nth(1).innerText()).trim()).toBe("\u2212");
  expect((await pm.innerText()).indexOf("\u00b1"),
    "and not the single \u00b1, whose halves touch").toBe(-1);
  // And they stand apart: the bar's middle sits a good way below the
  // plus's, measured against the size the sign is set at.
  const apart = await pm.evaluate((el) => {
    const two = [...el.querySelectorAll(".calc-pm-half")];
    const A = two[0].getBoundingClientRect(), B = two[1].getBoundingClientRect();
    const size = parseFloat(getComputedStyle(el).fontSize);
    return ((B.top + B.height / 2) - (A.top + A.height / 2)) / size;
  });
  expect(apart, "the bar should sit clear of the plus").toBeGreaterThan(0.45);

  // The working behind an answer is stacked too.
  expect(await page.locator(".calc-steps .frac").count()).toBeGreaterThan(3);
});

/* THE NUMBER FIELDS HAVE NO STEPPERS. IC and BC move together, so
   stepping one of them a percent at a time reads as though they were
   independent. */
test("the number fields carry no up-and-down arrows", async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  const look = await page.locator(".calc-input").first()
    .evaluate((el) => getComputedStyle(el).appearance || getComputedStyle(el).MozAppearance);
  expect(look).toBe("textfield");
});

/* NO NUMBERS UNTIL THEY ARE TYPED, AND NOTHING ABOVE A HUNDRED. Both
   asked for by name: the calculator opens with every field blank, and
   no field will take a number past 100.

   `max` on a number input only marks it invalid — the browser still
   lets a bigger number be typed — so the ceiling is held in the
   script as well, and that is the half of it worth a test. */
test("the fields start empty, and nothing above a hundred can be set",
  async ({ page }) => {
  await open(page);

  for (const model of ["plain", "v1", "v2"]) {
    await page.locator('.calc-model[data-model="' + model + '"]').click();
    await page.waitForTimeout(400);
    const where = model + ": ";

    const values = await page.$$eval(".calc-input", (all) => all.map((e) => e.value));
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((v) => v === ""), where + "every field starts blank").toBe(true);
    // And nothing stands in for a number that has not been given.
    const holding = await page.$$eval(".calc-input", (all) => all.map((e) => e.placeholder));
    expect(holding.every((v) => !v), where + "no placeholder number either").toBe(true);
    // Nor is anything claimed of the readings.
    const read = await page.$$eval(".calc-result-value",
      (all) => all.map((e) => e.textContent.trim()));
    expect(read.every((v) => v === "\u2014"), where + "every reading is a dash").toBe(true);
    // The zone is drawn on its own rather than filled with a made-up
    // count — except on the default model, where ten notes is the
    // piece's own illustration rather than anything typed.
    expect(await page.locator(".calc-stage-zone .zone-arrow").count(), where + "arrows")
      .toBe(model === "plain" ? 10 : 0);
    // Every field says its own ceiling as well.
    const caps = await page.$$eval(".calc-input", (all) => all.map((e) => e.max));
    expect(caps.every((m) => m === "100"), where + "max=100").toBe(true);
  }

  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  await put(page, "ic-Top", 450);
  expect(await page.evaluate(() => [
    document.querySelector("#ic-Top").value,
    document.querySelector("#bc-Top").value,
  ]), "450 is held at 100, and its other half falls to 0").toEqual(["100", "0"]);
  await put(page, "n-all", 900);
  expect(await page.evaluate(() => document.querySelector("#n-all").value),
    "the count is capped too").toBe("100");
  await put(page, "ic-Mid", -40);
  expect(await page.evaluate(() => document.querySelector("#ic-Mid").value),
    "and nothing goes below nought").toBe("0");
});

/* THE RESET puts the calculator back to how it opens: every field
   blank and the sign on +. It goes dim when there is nothing to clear,
   and the half of that easiest to get wrong is the sign — it is not a
   field, so a check that looked only at the fields would leave the
   button dim with the calculator sitting on −. */
test("the reset clears the fields and the sign, and dims when there is nothing to clear",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);

  const reset = page.locator(".calc-reset");
  await expect(reset).toBeVisible();
  await expect(reset, "nothing has been typed yet").toBeDisabled();

  await put(page, "n-all", 13);
  await put(page, "ic-Top", 15);
  await page.locator('.calc-sign-pick[data-sign="-1"]').click();
  await page.waitForTimeout(250);
  await expect(reset).toBeEnabled();
  // There really is something in there to clear.
  expect(await page.locator(".calc-stage-zone .zone-arrow").count()).toBe(39);

  await reset.click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    fields: [...document.querySelectorAll(".calc-input")].map((e) => e.value),
    sign: document.querySelector(".calc-sign-pick.chosen").getAttribute("data-sign"),
    reads: [...document.querySelectorAll(".calc-result-value")].map(
      (e) => e.textContent.trim()),
  }));
  expect(after.fields.every((v) => v === ""), "every field is blank again").toBe(true);
  expect(after.sign, "and the sign is back on +").toBe("1");
  expect(after.reads.every((v) => v === "—"), "and nothing is claimed").toBe(true);
  expect(await page.locator(".calc-stage-zone .zone-arrow").count(),
    "and the diagrams are empty again").toBe(0);
  await expect(reset).toBeDisabled();
  // It clears the numbers, not the choice of model.
  await expect(page.locator('.calc-model[data-model="v1"]')).toHaveClass(/chosen/);

  // The sign on its own is something to clear.
  await page.locator('.calc-sign-pick[data-sign="-1"]').click();
  await page.waitForTimeout(250);
  await expect(reset, "the sign alone counts as typed").toBeEnabled();

  // And the default model, which has no sign at all, still has one.
  await page.locator('.calc-model[data-model="plain"]').click();
  await page.waitForTimeout(400);
  await expect(page.locator(".calc-reset")).toBeDisabled();
  await put(page, "ic-One", 40);
  await expect(page.locator(".calc-reset")).toBeEnabled();
  await page.locator(".calc-reset").click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => [
    document.querySelector("#ic-One").value,
    document.querySelector("#bc-One").value,
  ])).toEqual(["", ""]);
});

/* THE LOG SCALE, asked for by name. It matters here because the
   thresholds are 0.5 and 2 while a reading can be 18: on a linear axis
   the whole of the part you read against is squashed into the bottom of
   the picture.

   The graph selectors are scoped to `.calc-graph` throughout — the
   piece's own writing carries a graph of its own in the same markup,
   and it is still in the page behind the calculator. */
test("the graph has a logarithmic version, and a reading of 0 is left off it",
  async ({ page }) => {
  await open(page);
  await page.locator('.calc-model[data-model="v1"]').click();
  await page.waitForTimeout(400);
  await put(page, "n-all", 13);
  await put(page, "ic-Top", 15);
  await put(page, "ic-Mid", 40);
  await put(page, "ic-DryDown", 85);

  const toggle = page.locator(".calc-scale");
  const ticks = () => page.$$eval(".calc-graph .graph-tick",
    (all) => all.map((e) => e.textContent));
  // `innerText` is not a thing on an SVG text node.
  const axisName = () => page.locator(".calc-graph .graph-axis-name").last()
    .evaluate((e) => e.textContent);

  // Linear to begin with: whole numbers up the side, no decade lines.
  await expect(toggle).toBeVisible();
  // The owner named both of these; they are not ours to reword.
  await expect(toggle).toHaveText(/Logarithmic Scale/i);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await axisName()).toBe("Modified IBR (var. 1)");
  expect(await ticks()).toContain("3");
  expect(await page.locator(".calc-graph .graph-grid-fine").count(),
    "a linear axis has no decades in it").toBe(0);

  await toggle.click();
  await page.waitForTimeout(300);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await axisName(), "the whole name goes inside a Log(\u2026)")
    .toBe("Log(Modified IBR [var. 1])");
  const up = await ticks();
  ["0.1", "1", "10"].forEach((one) =>
    expect(up, "powers of ten up the side").toContain(one));
  expect(up, "and nothing in between them").not.toContain("3");
  expect(await page.locator(".calc-graph .graph-grid-fine").count(),
    "with the nine lines inside each decade").toBeGreaterThan(8);

  /* AND IT REALLY IS LOGARITHMIC, not a relabelled linear axis. The
     three readings are 0.136, 0.513 and 4.359 — ratios of 3.8 and 8.5,
     so in logs they are within about 1.6 of evenly spaced, where on a
     linear axis the first two sit almost on top of one another (gaps of
     0.38 and 3.85, a ratio of ten). */
  const ys = await page.$$eval(".calc-graph .graph-dot",
    (all) => all.map((e) => Number(e.getAttribute("cy"))));
  expect(ys.length).toBe(3);
  const gapA = ys[0] - ys[1], gapB = ys[1] - ys[2];
  expect(gapA, "the readings climb up the picture").toBeGreaterThan(0);
  expect(gapB).toBeGreaterThan(0);
  expect(Math.max(gapA, gapB) / Math.min(gapA, gapB),
    "no reading is squashed up against another").toBeLessThan(2.2);

  // A reading of 0 has no logarithm, so it is left off rather than
  // pinned to the floor — and the picture says so.
  await put(page, "ic-Mid", 0);
  await expect(page.locator(".calc-graph-note")).toBeVisible();
  await expect(page.locator(".calc-graph-note")).toContainText("no logarithm");
  expect(await page.locator(".calc-graph .graph-dot").count(),
    "the one that cannot be drawn is left off").toBe(2);

  // Back to linear and it is drawn again, with nothing to explain.
  await toggle.click();
  await page.waitForTimeout(300);
  await expect(page.locator(".calc-graph-note")).toHaveCount(0);
  expect(await page.locator(".calc-graph .graph-dot").count()).toBe(3);

  // The scale is a way of looking rather than an input, so it survives
  // a change of model.
  await toggle.click();
  await page.waitForTimeout(250);
  await page.locator('.calc-model[data-model="v2"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator(".calc-scale")).toHaveAttribute("aria-pressed", "true");
});
