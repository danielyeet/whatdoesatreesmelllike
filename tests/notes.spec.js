// ============================================================
// VIEW NOTES, AND THE FRAGRANCES VIEW IT LIVES ON
//
// Two things that arrived together: the Fragrances view of Scent
// descriptions stopped being an index of every fragrance on the site
// and became its own review page for the ones that belong to no house,
// and every fragrance everywhere grew a VIEW NOTES button.
//
// THE MOST IMPORTANT TESTS HERE ARE THE DATA ONES, and they do not
// open a browser at all. `notes-data.js` is ninety-odd hand-gathered
// entries, and the ways it can be quietly wrong — a pyramid invented
// where the source gave a flat list, a source with no link, a key
// pointing at a fragrance that is not there — are exactly the ways
// nobody would notice.
// ============================================================
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const ROOT = path.join(__dirname, "..");

/** The notes, read the way a page reads them. */
function notes() {
  const jail = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function("window", fs.readFileSync(path.join(ROOT, "notes-data.js"), "utf8"))(jail.window);
  return jail.window.FRAGRANCE_NOTES;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

/* THE ONE RULE THE DATA HAS. An entry is a pyramid OR a flat list and
   never both, because the two say different things: a pyramid claims
   the source divided the notes, and a flat list claims it did not.
   An entry carrying both would be claiming both. */
test("no entry is both a pyramid and a flat list", () => {
  const all = notes();
  const wrong = Object.keys(all).filter((k) => {
    const one = all[k];
    const pyramid = one.top || one.mid || one.base;
    return (one.flat && pyramid) || (!one.flat && !pyramid);
  });
  expect(wrong, `these entries are neither one shape nor the other: ${wrong.join(", ")}`)
    .toEqual([]);
});

/* EVERY ENTRY SAYS WHERE IT CAME FROM. The owner asked for the source
   under the pyramid by name; an entry without one is a note list
   nobody can check, which on this subject is worse than no entry. */
test("every entry names a source, with a link", () => {
  const all = notes();
  const bad = Object.keys(all).filter((k) => {
    const from = all[k].source;
    return !from || !from.name || !from.url || !/^https:\/\//.test(from.url);
  });
  expect(bad, `these entries have no usable source: ${bad.join(", ")}`).toEqual([]);
});

/* AND NO ENTRY IS EMPTY. A key with nothing in it would show a panel
   with a heading and nothing under it, which reads as broken rather
   than as missing — missing is what NO key means, and that is handled
   on the page. */
test("no entry is empty", () => {
  const all = notes();
  const empty = Object.keys(all).filter((k) => {
    const one = all[k];
    const lists = [one.flat, one.top, one.mid, one.base].filter(Boolean);
    return !lists.length || lists.some((l) => !Array.isArray(l) || !l.length);
  });
  expect(empty, `these entries carry no notes: ${empty.join(", ")}`).toEqual([]);
});

/* EVERY KEY POINTS AT A FRAGRANCE THAT EXISTS. The key is the page's
   own `window.HOUSE_NOTES` and the part's number, so renumbering a
   house silently re-points every note in it at the wrong fragrance —
   the same fault the Fragrances table has, and it has a test for it in
   repository.spec.js. This is the notes' end of that. */
test("every key points at a part that is really on its page", () => {
  const all = notes();
  const PAGES = {
    pineward: ["works/pineward.html", "pine"],
    adar: ["works/adar.html", "adar"],
    "almost-human": ["works/almost-human.html", "human"],
    grande: ["works/grande-parfums.html", "human"],
    individual: ["works/individual-fragrances.html", "human"],
  };
  const missing = [];
  Object.keys(all).forEach((key) => {
    const [house, no] = key.split(":");
    const where = PAGES[house];
    expect(where, `no page is registered for the key "${key}"`).toBeTruthy();
    const html = read(where[0]);
    if (html.indexOf('<details class="' + where[1] + '-part" id="part-' + no + '">') < 0) {
      missing.push(key);
    }
  });
  expect(missing, `these notes point at parts that do not exist: ${missing.join(", ")}`)
    .toEqual([]);
});

/* THE FRAGRANCES VIEW IS NOT THE SITE'S INDEX ANY MORE. It listed
   every fragrance on the whole site and pointed at the houses; the
   owner asked for it to become "an independent fragrance review page
   where I put information about perfumes that do not belong in any
   house on the houses tab". So: nothing in it points at a house. */
test("the Fragrances view is its own page, not an index of the houses",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/categories/scent-descriptions.html");
  await page.click('.sheet-filter[data-view="fragrances"]');
  await page.waitForTimeout(900);

  const rows = page.locator('.view[data-view="fragrances"] .index-table tbody tr');
  await expect(rows).toHaveCount(7);

  const hrefs = await page.$$eval(
    '.view[data-view="fragrances"] .index-table tbody a',
    (all) => all.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  hrefs.forEach((href) => {
    expect(href, `${href} should point at the individual fragrances page`)
      .toContain("individual-fragrances.html");
  });
  // And none of the old ones survived.
  ["pineward.html", "adar.html", "almost-human.html", "grande-parfums.html"]
    .forEach((house) => {
      expect(hrefs.join(" "), `${house} should not be linked from this view`)
        .not.toContain(house);
    });

  // The houses they DID come from are still named, because that is the
  // one thing this page has that a house page does not.
  const houses = await page.$$eval(
    '.view[data-view="fragrances"] .index-table tbody .index-of',
    (all) => all.map((td) => td.textContent.trim()));
  expect(houses).toContain("Serge Lutens");
  expect(houses).toContain("Mancera");
});

/* THE BUTTON IS ON EVERY WRITTEN FRAGRANCE, and it opens something.
   Run over a house with notes and one without, because the panel has
   to say the right thing either way. */
test("every fragrance gets a View notes button, and it opens a panel",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto("/works/individual-fragrances.html");
  await page.waitForTimeout(700);

  await expect(page.locator(".note-open")).toHaveCount(7);
  await expect(page.locator(".note-panel:not([hidden])")).toHaveCount(0);

  const first = page.locator(".human-part").first();
  await first.locator("summary").click();
  await page.waitForTimeout(1000);
  const button = first.locator(".note-open");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await page.waitForTimeout(700);
  await expect(button).toHaveAttribute("aria-expanded", "true");

  const panel = first.locator(".note-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".note-row")).toHaveCount(3);      // top, mid, base
  await expect(panel.locator(".note-source")).toHaveCount(1);
  // The panel is BESIDE the writing, not under it — which is what the
  // owner asked for and the one thing a stylesheet change could undo.
  const [text, notes] = await Promise.all([
    first.locator(".human-text").boundingBox(),
    panel.boundingBox(),
  ]);
  expect(notes.x, "the panel should start to the right of the writing")
    .toBeGreaterThan(text.x + text.width - 4);

  // And it closes again.
  await button.click();
  await page.waitForTimeout(700);
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();

  expect(errors).toEqual([]);
});

/* A FLAT LIST SAYS IT IS FLAT. Pineward publishes no pyramids at all,
   and setting one of its fragrances out as Top / Mid / Base would be
   three claims nobody made — so the panel says the source gave one
   undivided list, and shows one row rather than three. */
test("a fragrance whose source gives no division says so", async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/works/pineward.html");
  await page.waitForTimeout(900);

  const first = page.locator(".pine-part").first();
  await first.locator("summary").click();
  await page.waitForTimeout(1000);
  await first.locator(".note-open").click();
  await page.waitForTimeout(700);

  const panel = first.locator(".note-panel");
  await expect(panel.locator(".note-undivided")).toHaveCount(1);
  await expect(panel.locator(".note-row")).toHaveCount(1);
  await expect(panel.locator(".note-row dt")).toHaveText("Notes");
});

/* AND A FRAGRANCE WHOSE NOTES ARE NOT FOUND SAYS THAT. The button is
   still there: a house with half its notes missing should look
   unfinished rather than finished. */
test("a fragrance with no notes yet says they have not been found",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/works/individual-fragrances.html");
  await page.waitForTimeout(700);

  // 05 is the slot the owner's own list skipped.
  const fifth = page.locator("#part-05");
  await fifth.locator("summary").click();
  await page.waitForTimeout(1000);
  await fifth.locator(".note-open").click();
  await page.waitForTimeout(700);

  await expect(fifth.locator(".note-waiting")).toHaveCount(1);
  await expect(fifth.locator(".note-row")).toHaveCount(0);
});

/* WITHOUT THE SCRIPT there is no button and no panel, and the page is
   all of its writing exactly as before. The notes are reference beside
   the reading, not the reading. */
test("without the script there is no button and the writing is untouched",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.route("**/notes.js", (route) => route.abort());
  await page.goto("/works/pineward.html");
  await page.waitForTimeout(600);

  await expect(page.locator(".note-open")).toHaveCount(0);
  await expect(page.locator(".note-panel")).toHaveCount(0);
  await expect(page.locator(".pine-part")).toHaveCount(47);
});
