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
  await page.goto("/works/pineward.html");
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
  await page.goto("/works/individual-fragrances.html");
  await page.waitForTimeout(700);

  // 05 is the slot the owner's own list skipped.
  const fifth = page.locator("#part-05");
  await fifth.locator("summary").click();
  await page.waitForTimeout(1000);
  await fifth.locator(".note-open").click();
  await page.waitForTimeout(700);

  const panel = page.locator("#notes-individual-05");
  await expect(panel.locator(".note-waiting")).toHaveCount(1);
  await expect(panel.locator(".note-row")).toHaveCount(0);
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
    await page.goto("/works/individual-fragrances.html");
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
    await page.goto("/works/individual-fragrances.html");
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
  await page.goto("/works/individual-fragrances.html");
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
  await page.goto("/works/individual-fragrances.html");
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
  Object.keys(all).forEach((key) => {
    const from = all[key].source;
    // A house source must point at the house, not at the fallback
    // wearing the house's name.
    const atFragrantica = /(^|\.)fragrantica\.com/i.test(new URL(from.url).hostname);
    if (from.name === FALLBACK && !atFragrantica) bad.push(key + " says Fragrantica but does not link there");
    if (from.name !== FALLBACK && atFragrantica) bad.push(key + " links to Fragrantica under another name");
  });
  expect(bad, bad.join("; ")).toEqual([]);

  // And the hierarchy is actually being worked: a good share of them
  // come from the houses themselves. If this ever drops to nothing,
  // somebody has taken the research out.
  const own = Object.keys(all).filter((k) => all[k].source.name !== FALLBACK).length;
  expect(own, `${own} of ${Object.keys(all).length} come from the house itself`)
    .toBeGreaterThan(20);
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
  await page.goto("/works/pineward.html");
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
