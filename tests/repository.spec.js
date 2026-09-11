// ============================================================
// CHECKS ON THE FILES THEMSELVES
//
// These don't open a browser. They read the site's files the way
// you would if you were checking them by hand: does every link
// point at something that exists, and has anything that looks
// like a password or key been committed by accident.
// ============================================================
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/** Every .html file in the site, ignoring installed packages. */
function htmlFiles(dir = ROOT, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" ||
        entry.name === "test-results" || entry.name === "playwright-report") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, found);
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}

/** Strip HTML comments, so example markup inside them isn't treated as real. */
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

test("every link between pages points at a file that exists", async () => {
  const problems = [];

  for (const file of htmlFiles()) {
    const html = withoutComments(fs.readFileSync(file, "utf8"));
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

    for (const href of hrefs) {
      // Skip anything that isn't a file in this repo.
      if (/^(https?:)?\/\//.test(href)) continue;
      if (href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("data:")) continue;

      const target = path.resolve(path.dirname(file), href.split("#")[0].split("?")[0]);
      if (!fs.existsSync(target)) {
        problems.push(`${path.relative(ROOT, file)} -> ${href}`);
      }
    }
  }

  expect(problems, "links pointing at files that don't exist").toEqual([]);
});

test("the links defined in JavaScript point at pages that exist", async () => {
  // The menu (SITE_LINKS in nav.js) and the map (REAL_NODES in
  // node-scene.js) define their links in code rather than in HTML, so
  // the check above can't see them.
  const problems = [];
  const sources = ["nav.js", "node-scene.js"];

  for (const name of sources) {
    const src = fs.readFileSync(path.join(ROOT, name), "utf8");
    const hrefs = [...src.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length, `${name} should define some links`).toBeGreaterThan(0);

    for (const href of hrefs) {
      // These are written relative to the site root.
      if (!fs.existsSync(path.join(ROOT, href))) problems.push(`${name} -> ${href}`);
    }
  }

  expect(problems, "links in code pointing at pages that don't exist").toEqual([]);
});

test("no passwords, keys or tokens have been committed", async () => {
  // The site has no accounts, no forms and talks to no services, so
  // there should never be a credential anywhere in it. This is a guard
  // against one being pasted in later and quietly published — every
  // file here is public the moment it's pushed.
  const patterns = [
    /AKIA[0-9A-Z]{16}/,                   // AWS access key
    /ghp_[0-9A-Za-z]{20,}/,               // GitHub token
    /xox[baprs]-[0-9A-Za-z-]{10,}/,       // Slack token
    /AIza[0-9A-Za-z_-]{20,}/,             // Google API key
    /sk-[A-Za-z0-9]{20,}/,                // OpenAI-style key
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, // private key file
    /(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*["'][^"'\s]{6,}["']/i,
  ];

  const checked = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "test-results", "playwright-report", "images"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|js|css|json|md|txt)$/.test(entry.name)) checked.push(full);
    }
  }
  walk(ROOT);

  const findings = [];
  for (const file of checked) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of patterns) {
      const hit = pattern.exec(text);
      if (hit) findings.push(`${path.relative(ROOT, file)}: ${hit[0].slice(0, 24)}...`);
    }
  }

  expect(checked.length, "should have files to check").toBeGreaterThan(5);
  expect(findings, "possible credentials committed to the repository").toEqual([]);
});

test("the site needs no build step to publish", async () => {
  // GitHub Pages serves these files exactly as they are. If index.html
  // ever starts pointing at files that only exist after a build, the
  // published site breaks — so it must only reference files in the repo.
  const html = withoutComments(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"));
  const localScripts = [...html.matchAll(/<script src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => !/^https?:\/\//.test(src));

  expect(localScripts.length).toBeGreaterThan(0);
  for (const src of localScripts) {
    expect(fs.existsSync(path.join(ROOT, src)), `${src} should exist in the repo`).toBe(true);
  }
});
