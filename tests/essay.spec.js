// ============================================================
// THE ESSAY PAGES (works/theory-*.html, works/resins-in-perfumery.html)
//
// A long piece of writing on the theories drawing's ground: a swarm
// of particles standing in the air behind it, and the RULE down the
// left — one tick per section, filled in as far as you have read,
// with the section you are in named under it.
//
// The two things worth guarding here are the two this site keeps
// getting wrong elsewhere: that the rule is built from the page's own
// sections rather than written out twice, and that WHERE YOU ARE IS
// THE SCROLL — travel down and back and you are where you were, with
// the same drawing behind you.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const THEORY = "/works/theory-01.html";
const RESINS = "/works/resins-in-perfumery.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the rule is built from the piece's own sections", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(RESINS);
  await page.waitForTimeout(400);

  const read = await page.evaluate(() => ({
    sections: [...document.querySelectorAll(".essay-section h2")].map((h) => {
      const copy = h.cloneNode(true);
      const no = copy.querySelector(".essay-no");
      if (no) no.remove();
      return copy.textContent.trim();
    }),
    ticks: [...document.querySelectorAll(".essay-mark-name")].map((n) => n.textContent.trim()),
    links: [...document.querySelectorAll(".essay-mark")].map((a) => a.getAttribute("href")),
  }));

  expect(read.sections.length, "the piece has sections").toBeGreaterThan(5);
  // One tick per section, named for it — and NOT carrying the section
  // number as part of the name, which is what reading the heading
  // whole gave: "01WHAT A RESIN IS".
  expect(read.ticks).toEqual(read.sections);
  // Every tick is a link to its own section, so the rule is a way of
  // getting about and not only a readout.
  read.links.forEach((href) => expect(href).toMatch(/^#section-\d+$/));

  expect(errors, "no console errors").toEqual([]);
});

test("the reading is the scroll, and comes back when you do", async ({ page }) => {
  await page.goto(RESINS);
  await page.waitForTimeout(400);

  const reading = () => page.locator(".essay-read").textContent();
  const here = () => page.locator(".essay-here").textContent();

  expect(await reading()).toBe("00%");
  const first = await here();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
  await page.waitForTimeout(400);
  const through = parseInt(await reading(), 10);
  expect(through, "the reading should have counted up").toBeGreaterThan(30);
  expect(await here(), "and should be naming a different section").not.toBe(first);

  // Standing still is standing still: nothing on this page adds itself
  // up, so a page left alone reads the same a second later.
  await page.waitForTimeout(900);
  expect(parseInt(await reading(), 10), "and not drift while nothing is touched")
    .toBe(through);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  expect(await reading(), "and come all the way back").toBe("00%");
  expect(await here()).toBe(first);
});

test("travelling back gives the same drawing", async ({ page }) => {
  // The field is written from `scrollY` rather than carried along, so
  // going down and back up is not a different sky. The structure
  // drawing learnt this the hard way; the same rule holds here.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(RESINS);
  await page.waitForTimeout(500);

  const shot = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".essay-field");
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      return sum;
    });

  const atTop = await shot();
  expect(atTop, "the air should have something in it").toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(400);
  const down = await shot();
  expect(down, "and the drawing should have moved with the page").not.toBe(atTop);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  expect(await shot(), "and come back to exactly what it was").toBe(atTop);
});

test("with animation turned off the field stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(THEORY);
  await page.waitForTimeout(500);

  const shot = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".essay-field");
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      return sum;
    });
  const before = await shot();
  await page.waitForTimeout(900);
  expect(await shot(), "nothing should have drifted").toBe(before);
});

test("without its script the page is still all of its writing", async ({ page }) => {
  await page.route("**/essay.js", (route) => route.abort());
  const errors = collectPageErrors(page, ["ERR_FAILED", "Failed to load resource"]);
  await page.goto(RESINS);

  // The writing is the page's own; only the field and the rule are the
  // script's, and neither of them carries anything to read.
  await expect(page.locator(".essay-section")).not.toHaveCount(0);
  await expect(page.locator(".essay-section h2").first()).toBeVisible();
  await expect(page.locator(".essay-section p").first()).toBeVisible();
  await expect(page.locator(".essay-rule")).toHaveCount(0);
  expect(errors, "no errors beyond the blocked file").toEqual([]);
});

test("the theories and the researches reach their own pieces", async ({ page }) => {
  await page.goto("/categories/theories.html");
  const first = page.locator(".work-row").first();
  await expect(first).toHaveAttribute("href", "../works/theory-01.html");

  await page.goto("/categories/researches.html");
  await expect(page.locator(".index-table tbody a").first())
    .toHaveAttribute("href", "../works/resins-in-perfumery.html");

  // And the research carries the owner's own writing rather than a
  // placeholder.
  await page.goto(RESINS);
  await expect(page.locator(".essay-section").first()).toContainText("insoluble in water");
  await expect(page.locator(".essay-section").nth(1)).toContainText("turpentine");
});

/* THE RULE MUST NOT MOVE. It is a fixed column centred on its own
   height, and the name under it wraps to a second line when a section
   is called something long — so going from a one-line name to a
   two-line one shifted the whole ladder, hairline and all, half a line
   up the window and back down again at the next section.

   THIS IS A REGRESSION. The owner found it on The Architecture of
   Sweat, between "Applying the Framework" and "Every Combination": a
   jump of exactly 8px, measured. `holdName()` reserves the room the
   tallest name the page actually has needs. */
test("the rule stands still all the way down a piece, whatever a section is called",
  async ({ page }) => {
  await page.goto("/works/theory-02.html");
  await page.waitForTimeout(700);
  await expect(page.locator(".essay-rule")).toBeVisible();

  const room = await page.evaluate(() =>
    document.documentElement.scrollHeight - window.innerHeight);
  const seen = new Set();
  const names = new Set();
  for (let f = 0; f <= 1.0001; f += 0.04) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(room * f));
    await page.waitForTimeout(70);
    const read = await page.evaluate(() => ({
      top: Math.round(document.querySelector(".essay-rule-line").getBoundingClientRect().top),
      name: document.querySelector(".essay-here").textContent,
    }));
    seen.add(read.top);
    names.add(read.name);
  }

  // The reading has to have changed, or this would pass by never
  // having asked the rule to do anything.
  expect(names.size, "the rule should have named several sections")
    .toBeGreaterThan(3);
  expect([...seen], `the rule moved down the page: ${[...seen].join(", ")}`)
    .toHaveLength(1);
});
