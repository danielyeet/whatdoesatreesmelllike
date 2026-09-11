// ============================================================
// EVERY PAGE LOADS
//
// The plainest thing that can go wrong with a site like this: a
// page that errors, loses its stylesheet, or loses the shared menu
// because the little SITE_ROOT line at the bottom of it is wrong.
// That last one is the documented footgun of this codebase — get it
// wrong on a new page and the whole menu breaks, not just one link.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

// Every page on the site, and how deep it sits, which is what
// SITE_ROOT has to match.
const PAGES = [
  { url: "/index.html", root: "", title: /Portfolio/ },
  { url: "/contact.html", root: "", title: /Contact/ },
  { url: "/categories/scent-descriptions.html", root: "../", title: /Scent descriptions/ },
  { url: "/categories/theories.html", root: "../", title: /Theories/ },
  { url: "/categories/favorites.html", root: "../", title: /Favorites/ },
  { url: "/categories/other-1.html", root: "../", title: /Other/ },
  { url: "/categories/other-2.html", root: "../", title: /Other/ },
  { url: "/works/example-gallery-work.html", root: "../", title: /Vetiver/ },
  { url: "/works/example-article-work.html", root: "../", title: /vetiver/ },
  { url: "/works/test-node-a.html", root: "../", title: /Test node/ },
  { url: "/works/test-node-b.html", root: "../", title: /Test node/ },
];

for (const page_ of PAGES) {
  test(`${page_.url} loads cleanly`, async ({ page }) => {
    const errors = collectPageErrors(page);
    await serveDependenciesLocally(page);

    const response = await page.goto(page_.url);
    expect(response.status(), "page should be served, not missing").toBe(200);
    await expect(page).toHaveTitle(page_.title);

    // The stylesheet is shared by every page; if its path is wrong the
    // page still "works" but looks like an unstyled document.
    const styledBody = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily
    );
    expect(styledBody, "style.css should be applied").toContain("Archivo");

    // SITE_ROOT is what tells the menu how deep this page is.
    const siteRoot = await page.evaluate(() => window.SITE_ROOT);
    expect(siteRoot, `SITE_ROOT on ${page_.url}`).toBe(page_.root);

    // The menu is built by nav.js on every page.
    await expect(page.locator(".menu-trigger")).toBeVisible();
    expect(await page.locator(".menu-list li").count()).toBeGreaterThan(0);

    expect(errors, `no errors on ${page_.url}`).toEqual([]);
  });
}

test("every menu link on every page points at a page that exists", async ({ page }) => {
  await serveDependenciesLocally(page);

  for (const page_ of PAGES) {
    await page.goto(page_.url);
    const hrefs = await page.$$eval(".menu-list a", (as) => as.map((a) => a.href));
    expect(hrefs.length, `menu links on ${page_.url}`).toBeGreaterThan(0);

    for (const href of hrefs) {
      const res = await page.request.get(href);
      expect(res.status(), `${href} linked from ${page_.url}`).toBe(200);
    }
  }
});
