// ============================================================
// THE 3D NODE MAP (slide 3)
//
// The centrepiece, and the most complicated part of the site.
// Several of these are regression tests: they lock in bugs that
// were found and fixed, so they can't quietly come back.
// ============================================================
const { test, expect } = require("@playwright/test");
const {
  serveDependenciesLocally,
  blockThreeJs,
  collectPageErrors,
  jumpToSlide,
  waitForMapSettled,
} = require("./helpers");

// The labels the map is expected to show, from REAL_NODES.
const EXPECTED_LABELS = [
  "Scent descriptions",
  "Theories",
  "Favorites",
  "Other",
  "Other",
  "Test node",
  "Test node",
];

test.describe("the map itself", () => {
  test.beforeEach(async ({ page }) => {
    await serveDependenciesLocally(page);
  });

  test("draws itself, with one clickable label per node", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3");
    await waitForMapSettled(page);

    await expect(page.locator("#node-canvas")).toBeVisible();
    const labels = await page.$$eval(".node3d-label .node3d-text", (els) =>
      els.map((e) => e.textContent.trim())
    );
    expect(labels).toEqual(EXPECTED_LABELS);

    // Every label is a real link to a page that exists.
    const hrefs = await page.$$eval(".node3d-label", (as) => as.map((a) => a.href));
    for (const href of hrefs) {
      expect((await page.request.get(href)).status()).toBe(200);
    }

    expect(errors).toEqual([]);
  });

  test("hovering a node tells the rest of the page which one is active", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // holds the map still
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3");
    await waitForMapSettled(page);

    expect(await page.evaluate(() => window.__mapReadout.activeIndex)).toBe(-1);

    await page.locator(".node3d-label", { hasText: "Favorites" }).hover({ force: true });
    await expect
      .poll(() => page.evaluate(() => window.__mapReadout.activeIndex))
      .toBe(EXPECTED_LABELS.indexOf("Favorites"));
  });

  // Regression test. Depth used to be read straight off the 3D
  // projection, where every node came out as very nearly the same
  // number — so "how far away is this node" was effectively unknown,
  // and everything that leans on it (label fading, which label sits in
  // front, the trace along the bottom) was working off nothing.
  test("nodes report meaningfully different distances from the camera", async ({ page }) => {
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3");
    await waitForMapSettled(page);

    const depths = await page.evaluate(() =>
      window.__mapReadout.nodes.map((n) => n.depth)
    );
    expect(depths).toHaveLength(EXPECTED_LABELS.length);
    for (const d of depths) {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1);
    }
    // Nodes sit all round a sphere, so near and far should be clearly
    // different, not clustered into a single indistinguishable value.
    expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(0.3);
  });
});

test.describe("the preview window", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await serveDependenciesLocally(page);
    await page.goto("/index.html");
    await jumpToSlide(page, "slide-3");
    await waitForMapSettled(page);
  });

  test("opens from the node that has one, instead of navigating away", async ({ page }) => {
    await page.locator(".node3d-label", { hasText: "Scent descriptions" }).click({ force: true });

    await expect(page.locator(".node-preview-modal")).toBeVisible();
    await expect(page).toHaveURL(/index\.html$/); // did not navigate
    await expect(page.locator(".node-preview-desc")).toContainText("I describe things");
    await expect(page.locator(".node-preview-button")).toHaveAttribute(
      "href",
      "categories/scent-descriptions.html"
    );
  });

  // Regression test for the bug that made the connecting line vanish.
  // Everything about it was drawn correctly, but the sheet it was drawn
  // on had collapsed to a 300x150 box in the corner, so all of it was
  // cut off. It has to cover the whole window.
  test("the line connecting the branch to the window covers the whole screen", async ({ page }) => {
    await page.locator(".node3d-label", { hasText: "Scent descriptions" }).click({ force: true });
    const arm = page.locator(".node-preview-arm-svg");
    await expect(arm).toBeAttached();

    const box = await arm.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width, "connector layer width").toBe(viewport.width);
    expect(box.height, "connector layer height").toBe(viewport.height);

    // And it is actually drawing a shape, not an empty path.
    const d = await page.locator(".node-preview-arm-path").getAttribute("d");
    expect(d && d.length, "connector should have a drawn path").toBeGreaterThan(50);
  });

  test("closes with the Close button and with Escape", async ({ page }) => {
    const label = page.locator(".node3d-label", { hasText: "Scent descriptions" });

    await label.click({ force: true });
    await expect(page.locator(".node-preview-modal")).toBeVisible();
    await page.locator(".node-preview-close").click();
    await expect(page.locator(".node-preview-modal")).toHaveCount(0, { timeout: 5000 });

    await label.click({ force: true });
    await expect(page.locator(".node-preview-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".node-preview-modal")).toHaveCount(0, { timeout: 5000 });
  });
});

// If the 3D library can't be reached, the map is supposed to quietly
// become a plain list of the same links rather than an empty hole.
test("falls back to a plain list of links when the 3D library is unavailable", async ({ page }) => {
  // This test blocks the 3D library on purpose, so the browser
  // complaining that it couldn't fetch it is the expected result, not a
  // fault. Anything else reported is a real problem.
  const errors = collectPageErrors(page, ["ERR_FAILED", "Failed to load resource"]);
  await blockThreeJs(page);
  await page.goto("/index.html");

  await expect(page.locator(".node-fallback-list")).toBeAttached();
  await expect(page.locator("#node-canvas")).toHaveCount(0);

  const labels = await page.$$eval(".node-fallback-list a strong", (els) =>
    els.map((e) => e.textContent.trim())
  );
  expect(labels).toEqual(EXPECTED_LABELS);
  expect(errors).toEqual([]);
});
