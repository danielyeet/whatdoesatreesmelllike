// ============================================================
// THE SHARED MENU
//
// nav.js builds the same menu on every page from one list
// (SITE_LINKS). These check that it opens, closes, knows which
// page you're on, and that its links are actually wired up.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await serveDependenciesLocally(page);
});

test("menu opens and closes by the button", async ({ page }) => {
  await page.goto("/index.html");

  const overlay = page.locator(".menu-overlay");
  const trigger = page.locator(".menu-trigger");

  await expect(overlay).not.toHaveClass(/open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  await expect(overlay).toHaveClass(/open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  await trigger.click();
  await expect(overlay).not.toHaveClass(/open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("Escape closes the menu", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator(".menu-trigger").click();
  await expect(page.locator(".menu-overlay")).toHaveClass(/open/);

  await page.keyboard.press("Escape");
  await expect(page.locator(".menu-overlay")).not.toHaveClass(/open/);
});

test("clicking a menu link closes the menu", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator(".menu-trigger").click();
  await expect(page.locator(".menu-overlay")).toHaveClass(/open/);

  await page.locator(".menu-list a", { hasText: "Contact" }).click();
  await expect(page).toHaveURL(/contact\.html$/);
});

// Visiting the site at its bare address ("/") is the normal case, and
// the page served for it is index.html. The menu used to fail to mark
// Home as current in exactly that case, because there is no filename
// in the address to compare against.
test("the page you are on is marked in the menu, including at the bare site address", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".menu-list a.menu-current")).toHaveText("Home");

  await page.goto("/index.html");
  await expect(page.locator(".menu-list a.menu-current")).toHaveText("Home");

  await page.goto("/categories/theories.html");
  await expect(page.locator(".menu-list a.menu-current")).toHaveText("Theories");

  await page.goto("/contact.html");
  await expect(page.locator(".menu-list a.menu-current")).toHaveText("Contact");
});

test("menu lists every page in SITE_LINKS, in order", async ({ page }) => {
  await page.goto("/index.html");
  const labels = await page.$$eval(".menu-list a", (as) => as.map((a) => a.textContent.trim()));
  expect(labels).toEqual([
    "Home",
    "Scent descriptions",
    "Theories",
    "Favorites",
    "Other",
    "Other",
    "Contact",
  ]);
});

test("menu links from a nested page resolve correctly, not relative to the folder", async ({ page }) => {
  // A page inside /categories/ sets SITE_ROOT to "../". If that is
  // wrong, links come out as /categories/categories/... and 404.
  await page.goto("/categories/theories.html");
  const hrefs = await page.$$eval(".menu-list a", (as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toContain("../index.html");
  expect(hrefs).toContain("../categories/favorites.html");
  expect(hrefs).toContain("../contact.html");
});
