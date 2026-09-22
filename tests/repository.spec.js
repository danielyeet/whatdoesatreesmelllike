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
  // its anchor: ../houses/pineward.html#part-37. Nothing checks those.
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
  const houses = ["houses/pineward.html", "houses/adar.html"];
  const parts = {};      // "houses/pineward.html" -> { "part-37": "Murkwood" }

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
  let looked = 0;
  for (const page of htmlFiles()) {
    const src = withoutComments(fs.readFileSync(page, "utf8"));
    const link = /<a href="[^"]*?(houses\/(?:pineward|adar)\.html)#(part-\d+)"[^>]*>([^<]*)<\/a>/g;
    for (const found of src.matchAll(link)) {
      looked += 1;
      const [, house, anchor, words] = found;
      const title = parts[house][anchor];
      const from = path.relative(ROOT, page);
      const said = plain(words);
      if (!title) wrong.push(`${from}: #${anchor} is not a part of ${house}`);
      // EITHER MAY BE THE LONGER, and both happen here:
      //   the link is SHORTER when it carries the first of a
      //   fragrance's two names and the part carries both;
      //   the link is LONGER when it names the house as well, which is
      //   how a link reads inside a sentence — theory-03 says "Amber
      //   Zero by ADAR" of a part titled "Amber Zero".
      // Only the shorter being a prefix of the longer is required, so a
      // link saying "Murkwood" that lands on "Noki" still fails, which
      // is the fault this whole test exists for.
      else if (!title.startsWith(said) && !said.startsWith(title)) {
        wrong.push(`${from}: "${said}" points at #${anchor}, which is "${title}"`);
      }
    }
  }

  expect(wrong, "links pointing at the wrong fragrance").toEqual([]);
  // AND IT MUST ACTUALLY HAVE LOOKED AT SOMETHING. This regex names the
  // house pages by path, and when they moved out of `works/` into
  // `houses/` it went on matching nothing at all — passing while
  // checking nothing, which is worse than failing outright. A test that
  // can quietly stop testing should say so.
  //
  // GREATER THAN NOTHING, and not a count: that is precisely the
  // failure being guarded against, and a number would fail the day the
  // owner rewrites a sentence. For the record there are three today,
  // all of them ADAR fragrances named in theory-03's prose. The
  // Fragrances table used to be the bulk of these and stopped pointing
  // into the houses on 2026-09-21, when it became the way in to the
  // individual fragrances instead.
  expect(looked, "no links into a fragrance were found to check at all")
    .toBeGreaterThan(0);
});

/* THE SEVEN FORWARDING PAGES.
   The houses moved out of `works/` into `houses/` on 2026-09-22, and
   the individual fragrances into a folder of their own, so that the
   repository sorts by what a thing IS. That changed their public web
   addresses, and anything already linked or bookmarked at an old one
   still has to work — so a signpost was left at each.

   What this pins is the part that is easy to get wrong: a signpost must
   carry THE ANCHOR across. The Fragrances table links at a part of a
   house by its anchor, and a plain <meta refresh> drops everything
   after the `#`. So each one has to forward with a script as well, and
   that script has to append `location.hash`. */
test("every old address still forwards, and carries its anchor", () => {
  const moved = {
    "works/pineward.html": "../houses/pineward.html",
    "works/adar.html": "../houses/adar.html",
    "works/almost-human.html": "../houses/almost-human.html",
    "works/ataraxia.html": "../houses/ataraxia.html",
    "works/grande-parfums.html": "../houses/grande-parfums.html",
    "works/les-abstraits.html": "../houses/les-abstraits.html",
    "works/individual-fragrances.html":
      "../individual-fragrances/individual-fragrances.html",
  };

  const wrong = [];
  for (const [from, to] of Object.entries(moved)) {
    const at = path.join(ROOT, from);
    if (!fs.existsSync(at)) { wrong.push(`${from} is missing entirely`); continue; }
    const html = fs.readFileSync(at, "utf8");

    // The page it points at has to be a real file.
    const lands = path.join(ROOT, "works", to);
    if (!fs.existsSync(lands)) wrong.push(`${from} forwards to ${to}, which does not exist`);

    // The script, carrying the anchor. This is the one that matters.
    if (!/location\.replace\(\s*"([^"]+)"\s*\+\s*location\.hash\s*\)/.test(html)) {
      wrong.push(`${from} does not forward by script with the anchor kept`);
    } else {
      const said = /location\.replace\(\s*"([^"]+)"\s*\+/.exec(html)[1];
      if (said !== to) wrong.push(`${from} forwards by script to ${said}, not ${to}`);
    }

    // And the no-JavaScript fallback.
    if (!new RegExp(`http-equiv="refresh"[^>]*url=${to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
      .test(html)) {
      wrong.push(`${from} has no <meta refresh> fallback to ${to}`);
    }
  }
  expect(wrong, "forwarding pages that do not forward").toEqual([]);
});

/* AND NOTHING INSIDE THE SITE LINKS AT ONE.
   A signpost is for links that already exist out in the world. Every
   link the site writes for itself should go straight to the real page —
   a signpost in the middle of a journey is a redirect nobody asked
   for, and it would quietly hide a path that had gone stale. */
test("nothing inside the site links at a forwarding page", () => {
  const stale = [
    "works/pineward.html", "works/adar.html", "works/almost-human.html",
    "works/ataraxia.html", "works/grande-parfums.html", "works/les-abstraits.html",
    "works/individual-fragrances.html",
  ];
  const found = [];
  for (const page of htmlFiles()) {
    const from = path.relative(ROOT, page).split(path.sep).join("/");
    if (stale.includes(from)) continue;            // the signposts themselves
    const src = withoutComments(fs.readFileSync(page, "utf8"));
    for (const old of stale) {
      const leaf = old.replace("works/", "");
      const re = new RegExp(`(?:href|src)="[^"]*works/${leaf.replace(".", "\\.")}`, "g");
      if (re.test(src)) found.push(`${from} links at ${old}`);
    }
  }
  expect(found, "links pointing at a forwarding page instead of the real one").toEqual([]);
});

/* A PICTURE IS CREDITED WHERE IT IS USED.
   The owner asked for it in as many words: "I also want you to give
   credits when pictures are used." So a house that shows photographs
   carries one line at its foot saying where they came from.

   It is worth a test rather than a habit because the credit is the
   easiest thing on the page to forget when a house gains its pictures,
   and because it is not decoration — Grande Parfums' photographs came
   from two retailers rather than from the house, which is precisely the
   kind of thing that stops being recorded anywhere once the line is
   missing. */
test("a house that shows photographs says where they came from", () => {
  const wrong = [];
  let credited = 0;
  for (const page of htmlFiles()) {
    const from = path.relative(ROOT, page).split(path.sep).join("/");
    if (!from.startsWith("houses/")) continue;
    const src = withoutComments(fs.readFileSync(page, "utf8"));

    // Only the pictures that are really there count: a house whose
    // <img> tags all point at files that have not arrived yet is not
    // yet using anything to credit.
    const real = [...src.matchAll(/<img[^>]*src="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((s) => !s.startsWith("http"))
      .filter((s) => fs.existsSync(path.join(ROOT, "houses", decodeURIComponent(s))));
    if (!real.length) continue;

    const credit = /<p class="house-credit">([\s\S]*?)<\/p>/.exec(src);
    if (!credit) {
      wrong.push(`${from} shows ${real.length} pictures and credits none of them`);
      continue;
    }
    const said = credit[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    // A credit has to name something. "Pictures" on its own is a label,
    // not a source.
    if (said.replace(/^Pictures\s*/i, "").length < 20) {
      wrong.push(`${from}: the credit names no source — "${said}"`);
    }
    credited += 1;
  }
  expect(wrong, "houses using pictures without crediting them").toEqual([]);
  expect(credited, "no house was found using pictures at all").toBeGreaterThan(0);
});
