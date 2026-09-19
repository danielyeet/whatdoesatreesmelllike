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
      if (fs.existsSync(target)) continue;

      // A PICTURE THAT IS NOT THERE YET IS NOT A BROKEN LINK. The
      // pages name the photograph they want for each piece — ADAR's
      // eleven are listed in images/README.txt — and show it the
      // moment the file is added, taking the <img> off the page until
      // then. The owner adds those one at a time. Everything else
      // pointing at something missing is still a fault: a page, a
      // script, a stylesheet, or a picture anywhere but in images/.
      const missingPicture = /^\.{0,2}\/?(\.\.\/)?images\//.test(href) &&
        /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(href);
      if (missingPicture) continue;

      problems.push(`${path.relative(ROOT, file)} -> ${href}`);
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

test("every link into a fragrance lands on that fragrance", async () => {
  // THE INDEX AND THE HOUSES ARE TWO WAYS INTO THE SAME WRITING, which
  // means the Fragrances table links at a part of a house's own page by
  // its anchor: ../works/pineward.html#part-37. Nothing checks those.
  // The link test above only asks whether pineward.html exists — it
  // cannot see the "#part-37" on the end of it.
  //
  // THIS IS A REGRESSION, and for a real one. Two fragrances were
  // removed from Pineward and the remaining fifty-two renumbered
  // straight through behind them; the part numbers are in the markup
  // rather than counted, deliberately, because they are the owner's.
  // Every anchor in the index went on pointing at the number the
  // fragrance USED to have, so following "Murkwood" from the search
  // opened Noki. Only one test caught it, and only by accident.
  //
  // What this checks is the thing that actually has to be true: the
  // part an anchor points at is the part whose title the link is
  // written with.
  const plain = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const houses = ["works/pineward.html", "works/adar.html"];
  const parts = {};      // "works/pineward.html" -> { "part-37": "Murkwood" }

  for (const house of houses) {
    const src = fs.readFileSync(path.join(ROOT, house), "utf8");
    parts[house] = {};
    const block = /<details class="(?:pine|adar)-part" id="(part-\d+)">((?:(?!<details ).)*?)<\/details>/gs;
    for (const found of src.matchAll(block)) {
      // ADAR's titles carry a second name inside them
      // (<span class="adar-sub">), so the tags come out and the
      // whitespace is collapsed before anything is compared.
      const title = /<span class="(?:pine|adar)-title">([\s\S]*?)<\/span>\s*(?:<span class="(?:pine|adar)-cue")/.exec(found[2])
        || /<span class="(?:pine|adar)-title">([\s\S]*?)<\/span>/.exec(found[2]);
      if (title) parts[house][found[1]] = plain(title[1]);
    }
    expect(Object.keys(parts[house]).length,
      `${house} should have parts to point at`).toBeGreaterThan(5);
  }

  const wrong = [];
  for (const page of htmlFiles()) {
    const src = withoutComments(fs.readFileSync(page, "utf8"));
    const link = /<a href="[^"]*?(works\/(?:pineward|adar)\.html)#(part-\d+)"[^>]*>([^<]*)<\/a>/g;
    for (const found of src.matchAll(link)) {
      const [, house, anchor, words] = found;
      const title = parts[house][anchor];
      const from = path.relative(ROOT, page);
      const said = plain(words);
      if (!title) wrong.push(`${from}: #${anchor} is not a part of ${house}`);
      // Starts with, rather than equals: a link may carry the first of
      // a fragrance's two names where the part carries both.
      else if (!title.startsWith(said)) {
        wrong.push(`${from}: "${said}" points at #${anchor}, which is "${title}"`);
      }
    }
  }

  expect(wrong, "links pointing at the wrong fragrance").toEqual([]);
});
