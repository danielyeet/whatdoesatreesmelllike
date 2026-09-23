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
    // A THIRD SHAPE, added when the owner asked for one: an entry that
    // was looked up and came back with nothing SAYS SO, in its own
    // words. ADAR prints prose for two of its fragrances and never
    // names a material; one Grande Parfums title could not be found
    // online at all. That is an answer, and a different answer from a
    // fragrance nobody has looked up yet — which is still no key.
    if (one.missing) return one.flat || one.top || one.mid || one.base;
    const pyramid = one.top || one.mid || one.base;
    return (one.flat && pyramid) || (!one.flat && !pyramid);
  });
  expect(wrong, `these entries are neither one shape nor the other: ${wrong.join(", ")}`)
    .toEqual([]);
});

/* AND THE SECOND LIST, WHERE THERE IS ONE, IS THE SAME KIND OF THING.
   Only Haxan has one — the perfumer's own account above, Fragrantica's
   reading of the same fragrance below, which the owner asked for by
   hand. It has to carry a heading, a list and a source of its own, or
   the window shows two lists and no way to tell them apart. */
test("a second list names itself and its own source", () => {
  const all = notes();
  const bad = [];
  Object.keys(all).forEach((k) => {
    const also = all[k].also;
    if (!also) return;
    if (!also.say) bad.push(k + " has no heading");
    // A SECOND LIST IS THE SAME KINDS OF THING AS A FIRST, and the
    // first version of this test said otherwise — it insisted the
    // second was always a flat list, which was true when Haxan was the
    // only one that had one. Ataraxia's five each carry a second list
    // that IS divided, because the fallback divides them, and a
    // division the source makes is one the entry may make.
    const has = Array.isArray(also.flat) && also.flat.length;
    const pyramid = also.top || also.mid || also.base;
    if (!has && !pyramid && !also.missing) bad.push(k + " has no list");
    if (has && pyramid) bad.push(k + " is both shapes at once");
    if (!also.source || !also.source.name || !/^https:\/\//.test(also.source.url || "")) {
      bad.push(k + " has no usable source");
    }
    if (!all[k].say) bad.push(k + " has a second list and no heading on the first");
  });
  expect(bad, bad.join("; ")).toEqual([]);
});

/* EVERY ENTRY SAYS WHERE IT CAME FROM. The owner asked for the source
   under the pyramid by name; an entry without one is a note list
   nobody can check, which on this subject is worse than no entry. */
test("every entry names a source, with a link", () => {
  const all = notes();
  const bad = Object.keys(all).filter((k) => {
    const one = all[k];
    // THE ONE EXEMPTION, and it is narrow: an entry that says the
    // fragrance could not be found AT ALL has no page to point at. One
    // entry is in that state. A `missing` entry that names a source is
    // saying something different and better — "I read the house's page
    // and it does not say" — and both of ADAR's do.
    if (one.missing && !one.source) return false;
    const from = one.source;
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
    // A `missing` entry is not empty — it carries a sentence, and the
    // sentence is the whole of it. An empty one would be.
    if (one.missing) return typeof one.missing !== "string" || !one.missing.trim();
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
    pineward: ["houses/pineward.html", "pine"],
    adar: ["houses/adar.html", "adar"],
    "almost-human": ["houses/almost-human.html", "human"],
    grande: ["houses/grande-parfums.html", "human"],
    ataraxia: ["houses/ataraxia.html", "human"],
    abstraits: ["houses/les-abstraits.html", "human"],
    tale: ["houses/tale-parfums.html", "human"],
    tombstone: ["houses/tombstone.html", "human"],
    qimu: ["houses/qimu-and-musicians.html", "human"],
    individual: ["individual-fragrances/individual-fragrances.html", "human"],
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

  // SIX. It was seven until the owner had the empty fifth slot removed
  // and the ones below it moved up, on 2026-09-22.
  const rows = page.locator('.view[data-view="fragrances"] .index-table tbody tr');
  await expect(rows).toHaveCount(6);

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
  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(700);

  await expect(page.locator(".note-open")).toHaveCount(6);
  await expect(page.locator(".note-panel:not([hidden])")).toHaveCount(0);

  const first = page.locator(".human-part").first();
  await first.locator("summary").click();
  await page.waitForTimeout(1000);
  const button = first.locator(".note-open");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await page.waitForTimeout(700);
  await expect(button).toHaveAttribute("aria-expanded", "true");

  const panel = page.locator("#notes-individual-01");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".note-row")).toHaveCount(3);      // top, mid, base
  await expect(panel.locator(".note-source")).toHaveCount(1);

  // IT IS A WINDOW OVER THE PAGE, which is the owner's second word on
  // it — it opened beside the writing at first. So: on the body rather
  // than inside the fragrance, fixed, centred on the viewport, over a
  // scrim, with the page behind it held still.
  const over = await page.evaluate(() => {
    const el = document.querySelector(".note-panel:not([hidden])");
    const box = el.getBoundingClientRect();
    return {
      onBody: el.parentElement === document.body,
      fixed: getComputedStyle(el).position,
      offX: Math.round(box.left + box.width / 2 - window.innerWidth / 2),
      offY: Math.round(box.top + box.height / 2 - window.innerHeight / 2),
      scrim: !!document.querySelector(".note-scrim.is-on"),
      held: document.body.classList.contains("note-holding"),
      role: el.getAttribute("role"),
    };
  });
  expect(over.onBody, "the window has to live on the body: a fixed thing inside " +
    "an ancestor with a transform is positioned against that ancestor").toBe(true);
  expect(over.fixed).toBe("fixed");
  expect(over.role).toBe("dialog");
  expect(Math.abs(over.offX), `centred across: ${over.offX}px off`).toBeLessThan(3);
  expect(Math.abs(over.offY), `centred down: ${over.offY}px off`).toBeLessThan(3);
  expect(over.scrim, "the page behind should be dimmed").toBe(true);
  expect(over.held, "and should not scroll under it").toBe(true);

  // AND IT SAYS WHICH FRAGRANCE IT BELONGS TO. A window standing over
  // the page has left its fragrance behind, which the column beside the
  // writing never had to worry about.
  await expect(panel.locator(".note-head-of")).toHaveText("CV99");

  // And it closes again. Not on the button, which is behind the scrim
  // now: on the window's own close.
  await panel.locator(".note-shut").click();
  await page.waitForTimeout(600);
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
  await page.goto("/houses/pineward.html");
  await page.waitForTimeout(900);

  const first = page.locator(".pine-part").first();
  await first.locator("summary").click();
  await page.waitForTimeout(1000);
  await first.locator(".note-open").click();
  await page.waitForTimeout(700);

  // The window lives on the body, not inside the fragrance.
  const panel = page.locator("#notes-pineward-01");
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

  // THIS ONE HAS TO BE STAGED NOW, and that is worth writing down: as
  // of 2026-09-22 there is no fragrance anywhere on the site with no
  // entry at all. The empty slot this used to open — the fifth of the
  // individual fragrances, which the owner's own numbering skipped —
  // was removed at their word, and every other part has either notes
  // or an entry that SAYS it found nothing.
  //
  // The path is still real and still reachable the moment a part is
  // added before its notes are, so rather than delete the test the
  // notes are taken away from the page: with none at all, every
  // fragrance should fall back to saying so.
  await page.route("**/notes-data.js", (route) =>
    route.fulfill({ contentType: "application/javascript",
                    body: "window.FRAGRANCE_NOTES = {};" }));

  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(700);

  const first = page.locator("#part-01");
  await first.locator("summary").click();
  await page.waitForTimeout(1000);
  await first.locator(".note-open").click();
  await page.waitForTimeout(700);

  const panel = page.locator("#notes-individual-01");
  await expect(panel.locator(".note-waiting")).toHaveCount(1);
  await expect(panel.locator(".note-waiting"))
    .toHaveText("The notes for this one have not been found yet.");
  await expect(panel.locator(".note-row")).toHaveCount(0);
  await expect(panel.locator(".note-source"),
    "there is no source to name").toHaveCount(0);
});

/* AND THE SIX ARE NUMBERED 01 TO 06, WITH NO GAP. The owner's list
   skipped a fifth and an empty slot was kept for it; on 2026-09-22
   they asked for it removed and the ones below moved up.

   THAT MOVE TOUCHES THREE FILES AT ONCE — the parts, the Fragrances
   table and the keys here — and this is the check that they moved
   together. Getting it wrong is silent: every link still resolves, and
   every fragrance shows somebody else's notes. */
test("the individual fragrances run 01 to 06 with nothing missing", () => {
  const all = notes();
  const page = read("individual-fragrances/individual-fragrances.html");
  const ids = [...page.matchAll(/id="part-(\d+)"/g)].map((m) => m[1]);
  expect(ids, `the parts run: ${ids.join(", ")}`)
    .toEqual(["01", "02", "03", "04", "05", "06"]);

  // No Untitled left, and every one of them has notes.
  expect(page).not.toContain("human-untitled");
  ids.forEach((id) => {
    expect(all["individual:" + id], `individual:${id} has no notes`).toBeTruthy();
  });
  // And no key points past the end.
  const keys = Object.keys(all).filter((k) => k.startsWith("individual:"));
  expect(keys.length).toBe(6);

  // THE TABLE AGREES, name for name and number for number.
  const sheet = read("categories/scent-descriptions.html");
  const view = sheet.slice(sheet.indexOf('data-view="fragrances"'));
  const named = (id) => {
    const at = page.indexOf('id="part-' + id + '"');
    const bit = page.slice(at, page.indexOf("</summary>", at));
    return (bit.match(/class="human-title[^"]*"[^>]*>([^<]*)</) || [])[1].trim();
  };
  ids.forEach((id) => {
    const want = 'individual-fragrances.html#part-' + id + '">' + named(id) + "</a>";
    expect(view, `the table should carry ${want}`).toContain(want);
  });
});

/* WITHOUT THE SCRIPT there is no button and no panel, and the page is
   all of its writing exactly as before. The notes are reference beside
   the reading, not the reading. */
test("without the script there is no button and the writing is untouched",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.route("**/notes.js", (route) => route.abort());
  await page.goto("/houses/pineward.html");
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
  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(700);

  const part = page.locator(".human-part").first();
  const button = part.locator(".note-open");
  const panel = page.locator("#notes-individual-01");

  await part.locator("summary").click();
  await page.waitForTimeout(1100);
  await button.click();
  await page.waitForTimeout(700);
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();

  // COLLAPSE THE FRAGRANCE AND THE WINDOW GOES WITH IT. Done through
  // the element rather than by pressing the summary, because with the
  // window up the page behind it cannot be pressed at all — which is
  // the point of a window. This is the safety net the `toggle`
  // listener exists for: a part closed by anything other than a press.
  await page.evaluate(() => {
    document.querySelector(".human-part").open = false;
  });
  await page.waitForTimeout(500);
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
  expect(await page.evaluate(
    () => document.body.classList.contains("note-holding")),
    "and the page is given back").toBe(false);

  // OPEN THE FRAGRANCE AGAIN: the notes stay shut. This is the one the
  // owner asked for in as many words — they "have to be opened up again
  // independently" — and the easy one to get wrong, because a window
  // that remembered would read as the page deciding for you.
  await part.locator("summary").click();
  await page.waitForTimeout(1200);
  await expect(button, "the notes should have to be asked for again")
    .toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

/* ON A PHONE IT IS THE SAME WINDOW, sized for the screen it is on.
   It was a bottom sheet for a round, while the wide version was still
   a column beside the writing; once the owner asked for a window
   everywhere there was no reason to keep two arrangements. The window
   is sized with `min()` against the viewport rather than by a media
   query, so a phone and a desktop get the same thing at the size each
   has room for. */
test.describe("the notes on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the window fits the screen and stands over the page", async ({ page }) => {
    await serveDependenciesLocally(page);
    const errors = collectPageErrors(page, ["Failed to load resource"]);
    await page.goto("/individual-fragrances/individual-fragrances.html");
    await page.waitForTimeout(900);

    const part = page.locator(".human-part").first();
    await part.locator("summary").click();
    await page.waitForTimeout(1200);
    await page.locator(".note-open").first().click();
    await page.waitForTimeout(700);

    const win = await page.evaluate(() => {
      const el = document.querySelector(".note-panel:not([hidden])");
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return {
        offX: Math.round(box.left + box.width / 2 - window.innerWidth / 2),
        offY: Math.round(box.top + box.height / 2 - window.innerHeight / 2),
        width: Math.round(box.width),
        height: Math.round(box.height),
        window: { w: window.innerWidth, h: window.innerHeight },
        scrim: !!document.querySelector(".note-scrim.is-on"),
        held: document.body.classList.contains("note-holding"),
      };
    });

    expect(win, "there should be a window").toBeTruthy();
    expect(Math.abs(win.offX), `centred across: ${win.offX}px off`).toBeLessThan(3);
    expect(Math.abs(win.offY), `centred down: ${win.offY}px off`).toBeLessThan(3);
    // IT FITS. The whole point of sizing it against the viewport: a
    // 430px window on a 390px screen would hang off both sides.
    expect(win.width, `${win.width} on a ${win.window.w} screen`)
      .toBeLessThanOrEqual(win.window.w);
    expect(win.height, `${win.height} tall in a ${win.window.h} screen`)
      .toBeLessThanOrEqual(win.window.h);
    // And it is not a thin strip either — it uses the width it has.
    expect(win.width).toBeGreaterThan(win.window.w * 0.8);
    expect(win.scrim).toBe(true);
    expect(win.held).toBe(true);

    await expect(page.locator(".note-panel:not([hidden]) .note-row")).toHaveCount(3);

    expect(errors).toEqual([]);
  });

  test("the window closes on the scrim, on escape, and on its own button",
    async ({ page }) => {
    await serveDependenciesLocally(page);
    await page.goto("/individual-fragrances/individual-fragrances.html");
    await page.waitForTimeout(900);

    const part = page.locator(".human-part").first();
    await part.locator("summary").click();
    await page.waitForTimeout(1200);

    const open = async () => {
      await page.locator(".note-open").first().click();
      await page.waitForTimeout(650);
      await expect(page.locator(".note-panel:not([hidden])")).toHaveCount(1);
    };
    const gone = async (how) => {
      await page.waitForTimeout(650);
      await expect(page.locator(".note-panel:not([hidden])"), how).toHaveCount(0);
      await expect(page.locator(".note-open").first()).toHaveAttribute("aria-expanded", "false");
      expect(await page.evaluate(
        () => document.body.classList.contains("note-holding")), how).toBe(false);
    };

    await open();
    // The scrim covers the page, so a press anywhere off the window
    // lands on it.
    await page.locator(".note-scrim").click({ position: { x: 20, y: 40 } });
    await gone("pressing the page behind should close it");

    await open();
    await page.keyboard.press("Escape");
    await gone("escape should close it");

    await open();
    await page.locator(".note-panel:not([hidden]) .note-shut").click();
    await gone("its own close should close it");
  });

});


/* AND IT DOES NOT GLITCH ON THE WAY OUT, which is a bug the owner
   reported in exactly those words: "when you click away, it glitches
   slightly".

   WHAT IT WAS. The window is built on the BODY — it has to be, or a
   `position: fixed` window inside a part's own transformed box is
   fixed to that box instead of to the screen. That made it a direct
   child of body, which is what `body > *:not(...)` matches: the rule
   that dims the page while the Menu is open. Four `:not()` outrank a
   plain `.note-panel`, so the window's own `opacity 300ms, transform
   300ms` was replaced by the menu's `opacity 0.85s` — no transform at
   all, and nearly three times as long. The script meanwhile hid the
   window on a 260ms timer. Measured: the panel and THE SCRIM WITH IT
   went from 0.606 opacity to nothing in one frame, and the scrim is a
   wash over the whole page, so the whole window flashed.

   SO THIS WATCHES THE FADE rather than the end of it. Every frame
   from the click until the scrim is hidden, it keeps the opacity; the
   last one before it goes is what was on screen the instant it
   vanished. Anything but nearly nothing there is a cut. */
test("the window fades all the way out rather than being cut off",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(900);

  const part = page.locator(".human-part").first();
  await part.locator("summary").click();
  await page.waitForTimeout(1200);
  await page.locator(".note-open").first().click();
  await page.waitForTimeout(700);

  const watching = page.evaluate(() => new Promise((done) => {
    const scrim = document.querySelector(".note-scrim");
    const panel = document.querySelector(".note-panel:not([hidden])");
    let lastScrim = 1, lastPanel = 1;
    const began = performance.now();
    (function tick() {
      if (scrim.hidden || panel.hidden) { done({ lastScrim, lastPanel, cut: true }); return; }
      lastScrim = +getComputedStyle(scrim).opacity;
      lastPanel = +getComputedStyle(panel).opacity;
      // Two seconds is far longer than any close should take; if it
      // is still up the window is stuck, which the assertions catch.
      if (performance.now() - began > 2000) { done({ lastScrim, lastPanel, cut: false }); return; }
      requestAnimationFrame(tick);
    })();
  }));
  await page.locator(".note-scrim").click({ position: { x: 20, y: 40 } });
  const saw = await watching;

  expect(saw.cut, "the window should actually go").toBe(true);
  expect(saw.lastScrim,
    `the scrim was still at ${saw.lastScrim} the frame before it vanished`)
    .toBeLessThan(0.05);
  expect(saw.lastPanel,
    `the window was still at ${saw.lastPanel} the frame before it vanished`)
    .toBeLessThan(0.05);
});

/* AND THE WINDOW KEEPS ITS OWN TRANSITION. This is the root of the
   bug above rather than the symptom, and it is the half that will
   come back: anything added as a child of body, or any change to the
   menu's dimming rule, can quietly take the window's arrival away
   again. The window is written to move on opacity AND transform; what
   the menu rule gives it is opacity alone. */
test("the window keeps its own transition, not the menu's", async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(900);

  const part = page.locator(".human-part").first();
  await part.locator("summary").click();
  await page.waitForTimeout(1200);
  await page.locator(".note-open").first().click();
  await page.waitForTimeout(700);

  const how = await page.evaluate(() => {
    const panel = document.querySelector(".note-panel:not([hidden])");
    const scrim = document.querySelector(".note-scrim");
    const ps = getComputedStyle(panel);
    return {
      moves: ps.transitionProperty,
      takes: ps.transitionDuration,
      scrimTakes: getComputedStyle(scrim).transitionDuration,
    };
  });

  expect(how.moves, `the window moves on: ${how.moves}`).toContain("transform");
  expect(how.moves).toContain("opacity");
  // The menu's is 0.85s. The window's own is 0.3s, and a window that
  // takes most of a second to answer a click reads as stuck.
  expect(how.takes, `the window takes ${how.takes}`).not.toContain("0.85");
  expect(how.scrimTakes, `the scrim takes ${how.scrimTakes}`).not.toContain("0.85");
});

/* THE OLFACTORY LANDSCAPE, which the owner asked for by hand: "add an
   olfactory landscape button before the notes. It will be the exact
   same as notes, but it will feature the olfactory landscape listed on
   the almost human website."

   THREE THINGS HAVE TO HOLD and they are easy to break separately: it
   comes BEFORE the notes button, it carries the HOUSE'S landscape
   rather than the fallback's notes, and the two windows are still ONE
   AT A TIME — a fragrance with two buttons is the first thing on this
   site that could have put two windows over the page at once. */
test("Almost Human carries a landscape before its notes", async ({ page }) => {
  await serveDependenciesLocally(page);
  const errors = collectPageErrors(page, ["Failed to load resource"]);
  await page.goto("/houses/almost-human.html");
  await page.waitForTimeout(900);

  const part = page.locator("#part-01");
  await part.locator("summary").click();
  await page.waitForTimeout(1200);

  // IN THAT ORDER. Both buttons stand at the foot of the same writing,
  // so this is the whole of "before".
  const calls = await part.locator(".note-open").allTextContents();
  expect(calls.map((t) => t.trim()), `the buttons read: ${calls}`)
    .toEqual(["Olfactory landscape", "View notes"]);

  await part.locator(".note-open-landscape").click();
  await page.waitForTimeout(700);
  const land = page.locator(".note-panel:not([hidden])");
  await expect(land).toHaveCount(1);
  await expect(land.locator(".note-head-say")).toHaveText("Landscape");
  // The house's own words, and the house as the source.
  await expect(land.locator(".note-row dd"))
    .toHaveText("Burning Silence, Glowing Dust, Cracked Ground, Dry Heat, Clear Light Ahead");
  await expect(land.locator(".note-cite")).toHaveText("Almost Human");
  // A landscape is the house's own, so there is nothing to caution.
  await expect(land.locator(".note-warn"),
    "the house's own words need no caution").toHaveCount(0);

  // ONE AT A TIME, and the second button is the only way on this site
  // to ask for two windows at once. The scrim covers the page while
  // one is up, so a POINTER cannot reach the other button — but the
  // keyboard can still tab to it and press it, and that is the path
  // this takes: activating the notes button while the landscape is
  // still up has to leave exactly one window standing.
  await part.locator(".note-open:not(.note-open-landscape)")
    .dispatchEvent("click");
  await page.waitForTimeout(800);
  await expect(page.locator(".note-panel:not([hidden])"),
    "two windows should never be up together").toHaveCount(1);
  const notes = page.locator(".note-panel:not([hidden])");
  await expect(notes.locator(".note-head-say")).toHaveText("Notes");
  // And the notes beside it are the fallback's, cautioned as ever.
  await expect(notes.locator(".note-cite")).toHaveText("Fragrantica");
  await expect(notes.locator(".note-warn")).toHaveCount(1);

  expect(errors).toEqual([]);
});

/* AND NOTHING ELSE ON THE SITE GREW A SECOND BUTTON. The landscape is
   Almost Human's alone: it is the only house that publishes one, and a
   button on a fragrance with nothing behind it would open an empty
   window. */
test("only the fragrances with a landscape have the button",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/houses/pineward.html");
  await page.waitForTimeout(900);
  await page.locator("#part-01 summary").click();
  await page.waitForTimeout(1200);
  await expect(page.locator("#part-01 .note-open")).toHaveCount(1);
  await expect(page.locator("#part-01 .note-open-landscape")).toHaveCount(0);
});

/* WHICH VERSION THE NOTES BELONG TO, SAID IN THE WINDOW. The owner
   asked for this in as many words — "make sure it is emphasized which
   versions notes youre adding on the website itself" — because several
   Pineward fragrances have been reformulated and the note list changes
   underneath the name.

   IT IS THE FIRST THING IN THE WINDOW, above the notes rather than in
   the aside underneath them, because it qualifies all of them. */
test("a reformulated fragrance says which version, at the top",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/houses/pineward.html");
  await page.waitForTimeout(900);
  await page.locator("#part-47 summary").click();
  await page.waitForTimeout(1200);
  await page.locator("#part-47 .note-open").click();
  await page.waitForTimeout(700);

  const win = page.locator("#notes-pineward-47");
  await expect(win.locator(".note-version")).toHaveCount(1);
  await expect(win.locator(".note-version strong")).toHaveText("2025 revision");

  // ABOVE the notes, not below them.
  const order = await win.evaluate((el) => {
    const bits = [...el.querySelectorAll(".note-version, .note-pyramid, .note-source")];
    return bits.map((b) => b.className.split(" ")[0]);
  });
  expect(order[0], `the window reads: ${order.join(" → ")}`).toBe("note-version");

  // And it is the most recent one, which is the other half of what was
  // asked for: the 2025 rework brought in four materials the 2021 has
  // none of.
  const said = await win.locator(".note-row dd").textContent();
  expect(said).toContain("Mousse de Saxe");
});

/* HAXAN'S TWO HALVES, asked for by hand: "double the size of the notes
   listed, where the upper part is the owners account, and then the
   bottom half is the interpreted notes sourced from fragrantica... No
   note pyramid."

   The interpreted list came off the owner's own screenshot of the
   page rather than out of a search summary — the one entry on the site
   whose fallback list was seen rather than reported. */
test("Haxan carries the perfumer's account and the fallback's reading",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/individual-fragrances/individual-fragrances.html");
  await page.waitForTimeout(900);
  await page.locator("#part-03 summary").click();
  await page.waitForTimeout(1200);
  await page.locator("#part-03 .note-open").click();
  await page.waitForTimeout(700);

  const win = page.locator("#notes-individual-03");
  // TWO LISTS, TWO HEADINGS, TWO SOURCES.
  await expect(win.locator(".note-half")).toHaveCount(2);
  await expect(win.locator(".note-half").first()).toHaveText("The perfumer’s own account");
  await expect(win.locator(".note-half").nth(1)).toHaveText("Interpreted notes");
  await expect(win.locator(".note-pyramid")).toHaveCount(2);
  await expect(win.locator(".note-cite").first()).toHaveText("PRIN (Prin Lomros)");
  await expect(win.locator(".note-cite").nth(1)).toHaveText("Fragrantica");

  // NO PYRAMID, either half — the owner said so and the fragrance is
  // not published as one.
  await expect(win.locator("dt")).toHaveText(["Notes", "Notes"]);

  // The second half is the longer of the two, which is the "double the
  // size" of the ask.
  const lens = await win.locator(".note-row dd").evaluateAll(
    (els) => els.map((e) => e.textContent.split(",").length));
  expect(lens[1], `${lens[0]} above, ${lens[1]} below`).toBeGreaterThan(lens[0]);

  // And only the fallback half is cautioned.
  await expect(win.locator(".note-warn")).toHaveCount(1);
});

/* A SOURCE THAT WAS READ AND SAID NOTHING. The owner asked for two
   different sentences for two different situations — "no information
   as of yet" where ADAR publishes prose and never names a material,
   and "I couldn't find this fragrance online" for a Grande Parfums
   title that is nowhere.

   BOTH ARE ANSWERS, and neither is the same as a fragrance nobody has
   looked up yet — which is still no key at all, and still says the
   notes "have not been found yet". */
test("a fragrance whose source says nothing says so, in its own words",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  // 10 is Lithos Diaphanes, and it is the last ADAR fragrance the
  // house names no material for. Root Code was here until the owner
  // supplied its notes from the house's own page.
  await page.goto("/houses/adar.html");
  await page.waitForTimeout(900);
  await page.locator("#part-10 summary").click();
  await page.waitForTimeout(1200);
  await page.locator("#part-10 .note-open").click();
  await page.waitForTimeout(700);

  const win = page.locator("#notes-adar-10");
  await expect(win.locator(".note-waiting")).toHaveText("No information as of yet.");
  // It still names where that was read, which is the difference
  // between "the house does not say" and "nobody has looked".
  await expect(win.locator(".note-cite")).toHaveText("ADAR Perfumes");
  await expect(win.locator(".note-pyramid"),
    "there is nothing to put in a list").toHaveCount(0);
});

/* THE TWO HOUSES THAT ARE NAMED BUT NOT WRITTEN. The owner gave
   Ataraxia's five and Les Abstraits' four their real names and their
   notes in one round, and kept the writing. So both houses now have a
   full set of entries, and the tests that matter are about SHAPE.

   ATARAXIA'S ARE ALL TWO-PART, which the owner asked for by name
   ("split the exact same way as they were with haxan"): the house's
   own account above and Fragrantica's below. */
test("every Ataraxia fragrance carries both halves", () => {
  const all = notes();
  const keys = Object.keys(all).filter((k) => k.startsWith("ataraxia:"));
  expect(keys.length, "all five should be in").toBe(5);
  const bad = [];
  keys.forEach((k) => {
    const one = all[k];
    if (one.source.name !== "Ataraxia Perfumery") bad.push(k + " does not lead with the house");
    if (!one.also) bad.push(k + " has no second half");
    else if (one.also.source.name !== "Fragrantica") bad.push(k + " does not follow with the fallback");
    if (!one.say) bad.push(k + " has no heading on its first half");
  });
  expect(bad, bad.join("; ")).toEqual([]);

  // AND ONE OF THEM SAYS THE HOUSE HAS NOT SAID, which the owner asked
  // for in as many words: "add 'not disclosed yet' for the dolls
  // makeup actual source; dont just add fragranticas account". It is
  // the only entry on the site whose FIRST half is a `missing` and
  // whose second half is a list.
  const doll = all["ataraxia:03"];
  expect(doll.missing, "the house's half should say so").toMatch(/not disclosed/i);
  expect(doll.also.top, "and the fallback's half should still be there").toBeTruthy();
});

/* LES ABSTRAITS COMES ENTIRELY OFF ITS OWN HOUSE. It is the only house
   on the site where that is true of every fragrance — the house
   publishes a divided list for all four — so the fallback should not
   appear anywhere in it. */
test("every Les Abstraits fragrance comes from the house itself", () => {
  const all = notes();
  const keys = Object.keys(all).filter((k) => k.startsWith("abstraits:"));
  expect(keys.length, "all four should be in").toBe(4);
  keys.forEach((k) => {
    expect(all[k].source.name, `${k} should be the house's own`).toBe("Les Abstraits");
    expect(all[k].top, `${k} should be divided, as the house divides it`).toBeTruthy();
  });

  // AND THEY STAND ALPHABETICALLY, which is what the owner asked for
  // ("add them alphabetically") and is the house page's own order.
  const page = read("houses/les-abstraits.html");
  const named = [...page.matchAll(/<span class="human-title">([^<]+)<\/span>/g)]
    .map((m) => m[1].trim());
  expect(named.length).toBe(4);
  const sorted = [...named].sort((a, b) => a.localeCompare(b, "en"));
  expect(named, `they stand: ${named.join(", ")}`).toEqual(sorted);
});

/* EVERY ADAR FRAGRANCE QUOTES THE HOUSE. The owner asked for this
   after seeing one of them: "i like what you did with [Against All
   Odds] ... I want you to add equivalent text to other adar perfumes
   too, with quotes from the prose."

   ADAR is the house that writes prose instead of note lists, so what
   its own page says about a fragrance is often the only thing it says
   at all — and an entry that drops it keeps the notes and loses the
   house. */
test("every ADAR entry quotes the house's own prose", () => {
  const all = notes();
  const keys = Object.keys(all).filter((k) => k.startsWith("adar:"));
  expect(keys.length, "all eleven should be in").toBe(11);
  const bare = keys.filter((k) => !all[k].note || all[k].note.length < 40);
  expect(bare, `these say nothing about the house: ${bare.join(", ")}`).toEqual([]);
  // And most of them QUOTE the house rather than paraphrasing it — a
  // curly quotation mark is the tell. This is the looser of the two
  // assertions on purpose: the one above is what bites when an aside
  // is thinned out, and it caught five of them when they were.
  const quoted = keys.filter((k) => /[\u201c\u201d]/.test(all[k].note));
  expect(quoted.length, `${quoted.length} of ${keys.length} carry a quotation`)
    .toBeGreaterThan(5);
});

/* THE SOURCE HIERARCHY. The owner set it: "ALWAYS THE SOURCE OF THE
   PERFUME ITSELF and only then fragrantica." So every entry names one
   of the two, the house's own page is preferred wherever the house
   publishes anything, and Fragrantica is what is left.

   This cannot test that the BETTER source was chosen — only a person
   reading the house's page can say that. What it can test is that the
   two kinds are kept apart and labelled honestly, which is the part
   that could rot silently. */
test("every source is either a house's own page or the fallback", () => {
  const all = notes();
  const FALLBACK = "Fragrantica";
  const bad = [];
  // EVERY SOURCE IN THE FILE, not just the one under the pyramid: an
  // entry can carry a second list with a source of its own (Haxan) and
  // an olfactory landscape with a third (Almost Human's five), and a
  // link pasted under the wrong name is exactly as wrong in those.
  const every = [];
  Object.keys(all).forEach((key) => {
    const one = all[key];
    if (one.source) every.push([key, one.source]);
    if (one.also && one.also.source) every.push([key + " (second list)", one.also.source]);
    if (one.landscape && one.landscape.source) every.push([key + " (landscape)", one.landscape.source]);
  });
  every.forEach(([key, from]) => {
    // A house source must point at the house, not at the fallback
    // wearing the house's name. `fragrantica.fr` counts: it is the same
    // crowd-edited list in another language.
    const host = new URL(from.url).hostname;
    const atFragrantica = /(^|\.)fragrantica\.(com|fr)$/i.test(host);
    if (from.name === FALLBACK && !atFragrantica) bad.push(key + " says Fragrantica but does not link there");
    if (from.name !== FALLBACK && atFragrantica) bad.push(key + " links to Fragrantica under another name");
  });
  expect(bad, bad.join("; ")).toEqual([]);

  // And the hierarchy is actually being worked: a good share of them
  // come from the houses themselves. If this ever drops to nothing,
  // somebody has taken the research out.
  const own = every.filter(([, from]) => from.name !== FALLBACK).length;
  expect(own, `${own} of ${every.length} sources are the house's own`)
    .toBeGreaterThan(20);
});

/* AN OLFACTORY LANDSCAPE IS THE HOUSE'S OWN, ALWAYS. It is the thing
   the house publishes INSTEAD of notes, so it can only ever come from
   the house — a landscape on the fallback's authority would be the
   fallback inventing the one thing it does not have. */
test("a landscape comes from the house and nowhere else", () => {
  const all = notes();
  const withLand = Object.keys(all).filter((k) => all[k].landscape);
  expect(withLand.length, "some fragrance should have one").toBeGreaterThan(0);
  const bad = [];
  withLand.forEach((k) => {
    const land = all[k].landscape;
    if (!Array.isArray(land.flat) || !land.flat.length) bad.push(k + " has no landscape");
    if (land.top || land.mid || land.base) bad.push(k + " divides a landscape into a pyramid");
    if (!land.source || land.source.name === "Fragrantica") {
      bad.push(k + " takes its landscape from the fallback");
    }
    // And the notes beside it are a separate claim with a separate
    // source, which is the whole reason there are two windows.
    if (!all[k].source) bad.push(k + " has a landscape and no notes source");
  });
  expect(bad, bad.join("; ")).toEqual([]);
});

/* A VERSION, WHERE ONE IS NAMED, IS NAMED IN THE ENTRY RATHER THAN
   ONLY IN THE ASIDE — the owner asked for it to be said on the page:
   "make sure it is emphasized which versions notes youre adding". The
   aside is prose nobody has to read; the version line is the first
   thing in the window. */
test("a fragrance with more than one version says which one", () => {
  const all = notes();
  const versioned = Object.keys(all).filter((k) => all[k].version);
  expect(versioned.length, "several fragrances have been reformulated")
    .toBeGreaterThan(2);
  const bad = versioned.filter((k) => {
    const v = all[k].version;
    // A version has to say WHEN. "the new one" ages out; a year does
    // not, and a year is what the houses themselves print.
    return typeof v !== "string" || !/\d{4}/.test(v);
  });
  expect(bad, `these versions name no year: ${bad.join(", ")}`).toEqual([]);
});

/* THE WARNING ON THE FALLBACK, which the owner asked for in as many
   words: hovering Fragrantica says its notes are not to be trusted as
   100% fact.

   The assertion that matters is the second one — that a house-sourced
   entry has NO warning. The caution means "this came from the
   fallback"; put it on everything and it means nothing. */
test("the fallback carries a warning and a house source does not",
  async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/houses/pineward.html");
  await page.waitForTimeout(900);

  const show = async (no) => {
    const part = page.locator("#part-" + no);
    await part.locator("summary").click();
    await page.waitForTimeout(1100);
    await part.locator(".note-open").click();
    await page.waitForTimeout(600);
    return page.locator("#notes-pineward-" + no);
  };
  const hide = async (no) => {
    await page.locator("#notes-pineward-" + no + " .note-shut").click();
    await page.waitForTimeout(500);
  };

  // 01 Bindebole comes from Pineward's own Master Scent List.
  const own = await show("01");
  await expect(own.locator(".note-cite")).toHaveText("Pineward, Master Scent List");
  await expect(own.locator(".note-warn"),
    "a house's own page needs no warning").toHaveCount(0);
  await hide("01");

  // 13 Sturbridge is on the fallback, because the house's list could
  // not be had for it.
  const fell = await show("13");
  await expect(fell.locator(".note-cite")).toHaveText("Fragrantica");
  const warn = fell.locator(".note-warn");
  await expect(warn).toHaveCount(1);

  // It is out of the way until the name is hovered.
  await expect(warn).toBeHidden();
  await fell.locator(".note-cite").hover();
  await page.waitForTimeout(400);
  await expect(warn).toBeVisible();
  await expect(warn).toHaveText("Fragrantica\u2019s notes are not to be trusted as 100% fact.");

  // And a screen reader is told it whether or not anything is hovered.
  await expect(fell.locator(".note-cite"))
    .toHaveAttribute("aria-describedby", "notes-pineward-13-warn");
});
