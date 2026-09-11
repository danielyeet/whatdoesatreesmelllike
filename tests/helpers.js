// ============================================================
// SHARED TEST HELPERS
//
// The site pulls two things off the internet: the 3D library
// (three.js) and the web fonts. Tests shouldn't depend on the
// internet being reachable — they'd fail for reasons that have
// nothing to do with the site being broken, and some sandboxes
// and build machines block those addresses outright.
//
// So the helpers below intercept both requests and answer them
// locally: three.js comes from the copy pinned in package.json at
// exactly the version index.html asks for, and the font stylesheet
// is answered with an empty one (the pages already name fallback
// fonts, so nothing depends on the real files arriving).
// ============================================================
const fs = require("fs");
const path = require("path");

const THREE_PATH = path.join(__dirname, "..", "node_modules", "three", "build", "three.min.js");
const THREE_SRC = fs.readFileSync(THREE_PATH, "utf8");

// The exact URL index.html asks for.
const THREE_URL = "**/cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js";
const FONTS_URL = "**/fonts.googleapis.com/**";

/**
 * Serve three.js and the fonts locally for this page.
 * Call this before page.goto() in any test that loads index.html.
 */
async function serveDependenciesLocally(page) {
  await page.route(THREE_URL, (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: THREE_SRC })
  );
  await page.route(FONTS_URL, (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
}

/**
 * Load index.html with three.js blocked, so the 3D map can't start.
 * Used to check the plain-list fallback that stands in for it.
 */
async function blockThreeJs(page) {
  await page.route(THREE_URL, (route) => route.abort());
  await page.route(FONTS_URL, (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
}

/**
 * Collect anything the page reports as an error while a test runs.
 * Returns an array that fills up as the page runs; check it at the end.
 *
 * Two warnings are ignored by default: both come from this machine
 * drawing 3D in software because there's no graphics card available,
 * which says nothing about the site. Pass `alsoIgnore` for anything a
 * particular test is deliberately causing — a test that blocks a file
 * on purpose shouldn't then fail over that file failing to load.
 */
function collectPageErrors(page, alsoIgnore = []) {
  const ignore = ["GroupMarkerNotSet", "GL Driver", ...alsoIgnore];
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignore.some((pattern) => text.includes(pattern))) return;
    errors.push(text);
  });
  return errors;
}

/**
 * Scroll straight to a slide without waiting out the page's own long
 * scroll animation.
 *
 * The site's CSS "snaps" the page to whole slides, which fights any
 * attempt to park it partway. Switching snapping off first is exactly
 * what the site's own scrolling code does while it animates.
 */
async function jumpToSlide(page, slideId, fraction) {
  await page.evaluate(
    ({ slideId, fraction }) => {
      const container = document.getElementById("scroll-container");
      container.style.scrollSnapType = "none";
      const target = document.getElementById(slideId);
      if (fraction === undefined) {
        container.scrollTop = target.offsetTop;
      } else {
        const from = document.getElementById("slide-2").offsetTop;
        const to = document.getElementById("slide-3").offsetTop;
        container.scrollTop = from + (to - from) * fraction;
      }
    },
    { slideId, fraction }
  );
}

/** Wait for the 3D map to finish arriving and settle. */
async function waitForMapSettled(page) {
  await page.waitForFunction(
    () => window.__mapReadout && window.__mapReadout.arrival > 0.98,
    null,
    { timeout: 15000 }
  );
}

module.exports = {
  serveDependenciesLocally,
  blockThreeJs,
  collectPageErrors,
  jumpToSlide,
  waitForMapSettled,
  THREE_URL,
};
