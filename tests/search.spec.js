// ============================================================
// THE SEARCH
//
// One matcher, three places: the search page, which looks over the
// whole site; a page's own search, which looks over that page only;
// and what happens when a page cannot answer — it hands the question
// on rather than shrugging.
//
// The two things worth guarding: it is FORGIVING (a name typed with a
// letter missing is still that name), and an answer OPENS THE THING
// ITSELF — being taken to a page with the fragrance you asked for
// closed somewhere inside it is not an answer.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const SHEET = "/categories/scent-descriptions.html";

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("the search page finds a fragrance misspelt, and says where it lives",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/search.html?q=murkwod");

  const first = page.locator(".find-row").first();
  await expect(first.locator(".find-what")).toHaveText("Murkwood", { timeout: 15000 });
  await expect(first.locator(".find-kind")).toHaveText("Fragrance");
  // The trail says where it is, which is the whole point of an answer
  // on a site with houses inside categories.
  await expect(first.locator(".find-where")).toContainText("Pineward");
  await expect(first).toHaveAttribute("href", /pineward\.html#part-\d+$/);

  expect(errors, "no console errors").toEqual([]);
});

test("following an answer opens the thing itself", async ({ page }) => {
  await page.goto("/search.html?q=murkwood");
  const first = page.locator(".find-row").first();
  await expect(first).toBeVisible({ timeout: 15000 });
  await first.click();

  await expect(page).toHaveURL(/pineward\.html#part-\d+$/);
  // Open, and not merely scrolled to.
  await expect.poll(async () =>
    page.evaluate(() => {
      const part = document.getElementById(location.hash.replace("#", ""));
      return part ? part.open : null;
    }), { timeout: 8000 }).toBe(true);
  await expect(page.locator(".pine-part[open] .pine-title").first()).toHaveText("Murkwood");
});

test("a search with no answers says so", async ({ page }) => {
  await page.goto("/search.html?q=zzzznothing");
  await expect(page.locator(".find-nothing")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".find-row")).toHaveCount(0);
  await expect(page.locator(".find-count")).toHaveText("000");
});

test("a page's own search looks over that page, and hands on what it cannot answer",
  async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );

  // A PAGE'S OWN SEARCH LOOKS OVER THAT PAGE ONLY, so what it can find
  // here changed when the Fragrances view stopped listing every
  // fragrance on the site. It used to be asked for "murkwod" and
  // answer Murkwood, which lives on the Pineward page and is not on
  // this one any more. Haxan is — and the misspelling is kept, because
  // matching a word somebody has typed badly is half of what this is
  // for.
  await page.locator(".sheet-search-trigger").click();
  await page.locator(".sheet-search-field").fill("haxen");
  const answer = page.locator(".sheet-found-row").first();
  await expect(answer.locator(".sheet-found-what")).toHaveText("Haxan");

  // Something this category knows nothing about goes to the site's own
  // search page, with the question carried in the address.
  await page.locator(".sheet-search-field").fill("qqzzvv");
  await expect(page.locator(".sheet-found-none")).toBeVisible();
  await page.locator(".sheet-search-field").press("Enter");
  await expect(page).toHaveURL(/search\.html\?q=qqzzvv$/);
  await expect(page.locator(".find-nothing")).toBeVisible({ timeout: 15000 });
});

test("the theories page searches theories and nothing else", async ({ page }) => {
  await page.goto("/categories/theories.html");
  await page.waitForTimeout(1200);
  await page.locator(".page-find-trigger").click();
  await page.locator(".page-find-field").fill("sweat");

  const rows = page.locator(".page-find-row");
  await expect(rows.first().locator(".page-find-what"))
    .toHaveText("The Architecture of Sweat");
  const wheres = await page.$$eval(".page-find-where", (all) => all.map((w) => w.textContent));
  wheres.forEach((where) => expect(where).toContain("Theories"));
});

test("the menu carries the search, above Contact", async ({ page }) => {
  await page.goto("/index.html");
  const labels = await page.$$eval(".menu-list a", (as) => as.map((a) => a.textContent.trim()));
  expect(labels).toContain("Search");
  expect(labels.indexOf("Search")).toBe(labels.indexOf("Contact") - 1);
});
