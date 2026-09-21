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

/* THE NOTES GO WITH THE FRAGRANCE, and have to be asked for again.
   The owner asked for exactly that: the panel "will collapse with the
   fragrance if you collapse the fragrance, and will have to be opened
   up again independently".

   The third assertion is the one that matters and the easy one to get
   wrong: reopening the fragrance must NOT bring the notes back with
   it. A panel that remembers it was open would look like the page
   deciding for you. */
test("the notes collapse with the fragrance, and do not come back with it",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/works/individual-fragrances.html");
  await page.waitForTimeout(700);

  const part = page.locator(".human-part").first();
  const button = part.locator(".note-open");
  const panel = part.locator(".note-panel");

  await part.locator("summary").click();
  await page.waitForTimeout(1100);
  await button.click();
  await page.waitForTimeout(700);
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();

  // Collapse the fragrance: the notes go with it.
  await part.locator("summary").click();
  await page.waitForTimeout(1200);
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
  // And the part is not left wearing the class that narrows its plate.
  await expect(part).not.toHaveClass(/notes-on/);

  // Open the fragrance again: the notes stay shut.
  await part.locator("summary").click();
  await page.waitForTimeout(1200);
  await expect(button, "the notes should have to be asked for again")
    .toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

/* ON A PHONE IT IS A SHEET, NOT A COLUMN. There is no room beside the
   writing at that width — a 252px panel on a 390px screen is most of
   the page — and underneath the writing it was buried at the foot of a
   long fragrance. The owner asked for "a popup window", "adjusted
   properly to the device".

   What this checks is that it is really OVER the page rather than in
   it: fixed to the foot of the WINDOW, as wide as the window, with the
   page behind it held still. */
test.describe("the notes on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the panel comes up as a sheet over the page", async ({ page }) => {
    await serveDependenciesLocally(page);
    const errors = collectPageErrors(page, ["Failed to load resource"]);
    await page.goto("/works/individual-fragrances.html");
    await page.waitForTimeout(900);

    const part = page.locator(".human-part").first();
    await part.locator("summary").click();
    await page.waitForTimeout(1200);
    await page.locator(".note-open").first().click();
    await page.waitForTimeout(800);

    const sheet = await page.evaluate(() => {
      const el = document.querySelector(".note-panel.note-pop");
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return {
        // Moved out to the body: a fixed thing inside an ancestor with
        // a transform is positioned against that ancestor, not the
        // window, and a part's box is given one while it opens.
        onBody: el.parentElement === document.body,
        fixed: getComputedStyle(el).position,
        bottom: Math.round(box.bottom),
        width: Math.round(box.width),
        window: { w: window.innerWidth, h: window.innerHeight },
        scrim: !!document.querySelector(".note-scrim.is-on"),
        held: document.body.classList.contains("note-holding"),
      };
    });

    expect(sheet, "there should be a sheet").toBeTruthy();
    expect(sheet.onBody).toBe(true);
    expect(sheet.fixed).toBe("fixed");
    expect(sheet.width, "it should be as wide as the window")
      .toBeGreaterThanOrEqual(sheet.window.w - 1);
    expect(Math.abs(sheet.bottom - sheet.window.h),
      `it should sit on the foot of the window: ${sheet.bottom} against ${sheet.window.h}`)
      .toBeLessThan(3);
    expect(sheet.scrim, "the page behind it should be dimmed").toBe(true);
    expect(sheet.held, "and should not scroll under it").toBe(true);

    // The notes are readable rather than merely present.
    await expect(page.locator(".note-panel.note-pop .note-row")).toHaveCount(3);

    expect(errors).toEqual([]);
  });

  test("the sheet closes on the scrim, on escape, and on its own button",
    async ({ page }) => {
    await serveDependenciesLocally(page);
    await page.goto("/works/individual-fragrances.html");
    await page.waitForTimeout(900);

    const part = page.locator(".human-part").first();
    await part.locator("summary").click();
    await page.waitForTimeout(1200);

    const open = async () => {
      await page.locator(".note-open").first().click();
      await page.waitForTimeout(700);
      await expect(page.locator(".note-panel.note-pop")).toHaveCount(1);
    };
    const gone = async (how) => {
      await page.waitForTimeout(700);
      await expect(page.locator(".note-panel.note-pop"), how).toHaveCount(0);
      await expect(page.locator(".note-open").first()).toHaveAttribute("aria-expanded", "false");
      expect(await page.evaluate(
        () => document.body.classList.contains("note-holding")), how).toBe(false);
    };

    await open();
    await page.locator(".note-scrim").click({ position: { x: 30, y: 60 } });
    await gone("tapping the scrim should close it");

    await open();
    await page.keyboard.press("Escape");
    await gone("escape should close it");

    await open();
    // Scoped to the sheet that is up: every panel on the page has one.
    await page.locator(".note-panel.note-pop .note-shut").click();
    await gone("its own button should close it");
  });
});
