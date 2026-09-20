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
   over a denominator; `±` sets the plus and the minus into one glyph
   and they touch. */
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

  // The sign is three glyphs with air between them, not one.
  const pm = page.locator('.calc-term[data-say="SIGN"] .calc-pm');
  await expect(pm).toBeVisible();
  expect((await pm.innerText()).replace(/\s+/g, "")).toBe("+/\u2212");

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
