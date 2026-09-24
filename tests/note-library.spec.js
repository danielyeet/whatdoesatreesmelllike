// ============================================================
// THE NOTE LIBRARY — categories/note-library.html, note-library.js
//
// Every note named in a fragrance on the site, shelved by family, each
// with a line on what it is. The page's markup is the catalogue; the
// script stands the records up as books. What these hold:
//
//   - every note the site uses HAS a record (the owner asked for "all
//     the notes that I have used so far"), and none is shelved twice;
//   - the books stand on their shelves without running into each other;
//   - the terminal, the shelf tabs, the order and the card all work,
//     and the card's fragrances link to where they stand;
//   - the site's own search finds a note, by any of its spellings;
//   - and without the script the catalogue is still there to read.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally } = require("./helpers");

const LIBRARY = "/categories/note-library.html";

async function arrive(page, url) {
  await serveDependenciesLocally(page);
  await page.goto(url || LIBRARY);
  await page.waitForFunction(() => document.body.classList.contains("lib-built"));
}

/* EVERY NOTE HAS A RECORD. Read the other way round from the page: the
   page puts anything notes-data.js names and no record carries on a
   returns cart, so the cart must not exist — and every spelling is
   checked against the records directly as well, in case the cart ever
   stops being built. */
test("every note named in a fragrance has a record, and none is shelved twice", async ({ page }) => {
  await arrive(page);
  await expect(page.locator(".lib-returns"), "the returns cart should be empty").toHaveCount(0);
  const out = await page.evaluate(() => {
    const names = new Map();
    const twice = [];
    const bare = [];
    document.querySelectorAll(".lib-record").forEach((el) => {
      const say = el.querySelector(".lib-say").textContent.trim();
      const all = [el.querySelector(".lib-name").textContent.trim()]
        .concat((el.dataset.aka || "").split("|").filter(Boolean));
      if (say.length < 16) bare.push(all[0]);
      all.forEach((n) => {
        const k = n.toLowerCase();
        if (names.has(k)) twice.push(n);
        names.set(k, el.id);
      });
    });
    const missing = [];
    const notes = new Set();
    const N = window.FRAGRANCE_NOTES;
    Object.keys(N).forEach((key) => {
      const e = N[key];
      const lists = [e.top, e.mid, e.base, e.flat];
      if (e.also) lists.push(e.also.top, e.also.mid, e.also.base, e.also.flat);
      lists.filter(Boolean).flat().forEach((n) => {
        if (!names.has(n.toLowerCase())) missing.push(key + " " + n);
        notes.add(n.toLowerCase());
      });
    });
    // ALMOST HUMAN'S OLFACTORY LANDSCAPES ARE NOT NOTES, and the owner
    // asked for them to be reconsidered: nothing that is only ever named
    // in a landscape may stand in the library, as a record or a spelling.
    const landscaped = [];
    Object.keys(N).forEach((key) => {
      const e = N[key];
      if (!e.landscape) return;
      e.landscape.flat.forEach((n) => {
        if (!notes.has(n.toLowerCase()) && names.has(n.toLowerCase())) landscaped.push(n);
      });
    });
    return { missing: missing, twice: twice, bare: bare, landscaped: landscaped,
      records: document.querySelectorAll(".lib-record").length };
  });
  expect(out.missing, "notes with no record").toEqual([]);
  expect(out.landscaped, "landscape impressions shelved as notes").toEqual([]);
  expect(out.twice, "spellings shelved in two records").toEqual([]);
  expect(out.bare, "records with no real explanation").toEqual([]);
  expect(out.records).toBeGreaterThan(300);
});

/* EVERY HOUSE THE NOTES COME FROM HAS A PAGE THE CARD CAN LINK TO. The
   script keeps a small table of where each house's fragrances live; a
   new house in notes-data.js without a line in it would leave its
   fragrances linking nowhere. */
test("every fragrance a card lists links to where it stands in its house", async ({ page }) => {
  await arrive(page);
  // Cedarwood: many houses at once.
  await page.locator("#note-cedarwood").click();
  const card = page.locator(".lib-card");
  await expect(card).toBeVisible();
  await expect(card.locator(".lib-card-name")).toHaveText("Cedarwood");
  await expect(card.locator(".lib-card-call")).toHaveText(/^WOO \d{3}$/);
  const hrefs = await card.locator(".lib-card-list a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(10);
  hrefs.forEach((h) => expect(h, "a fragrance link").toMatch(/^\.\.\/(houses\/[a-z-]+|individual-fragrances\/individual-fragrances)\.html#part-\d\d$/));
  // And every house key in the notes has a page to go to.
  const keys = await page.evaluate(() => [...new Set(Object.keys(window.FRAGRANCE_NOTES).map((k) => k.split(":")[0]))]);
  for (const key of keys) {
    const one = await page.evaluate((house) => {
      const k = Object.keys(window.FRAGRANCE_NOTES).find((x) => x.startsWith(house + ":") &&
        (window.FRAGRANCE_NOTES[x].flat || window.FRAGRANCE_NOTES[x].top || window.FRAGRANCE_NOTES[x].also));
      if (!k) return null;
      const e = window.FRAGRANCE_NOTES[k];
      return (e.flat || e.top || e.also.flat || e.also.top)[0];
    }, key);
    if (!one) continue;
    const id = await page.evaluate((note) => {
      const low = note.toLowerCase();
      const el = [...document.querySelectorAll(".lib-record")].find((r) =>
        [r.querySelector(".lib-name").textContent.trim()].concat((r.dataset.aka || "").split("|"))
          .some((n) => n.toLowerCase() === low));
      return el && el.id;
    }, one);
    await page.locator("#" + id).evaluate((el) => el.click());
    const links = await card.locator(".lib-card-list a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(links.some((h) => h !== "#"), `${key}'s fragrances link somewhere`).toBe(true);
    expect(links.filter((h) => h === "#"), `${key} has no page in HOUSES`).toEqual([]);
  }
});

/* THE FRAGRANCES' NAMES ARE READ OFF THEIR HOUSES' OWN PAGES, so a card
   lists "Holy Bread" under Ataraxia's own name for its first fragrance
   rather than a number alone. */
test("a card names the fragrances that use its note, read off their houses' pages", async ({ page }) => {
  await arrive(page, LIBRARY + "#note-holy-bread");
  const card = page.locator(".lib-card");
  await expect(card, "arriving with a note in the address opens it").toBeVisible();
  await expect(card.locator(".lib-card-name")).toHaveText("Holy Bread");
  const link = card.locator(".lib-card-list a");
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "../houses/ataraxia.html#part-01");
  const title = await page.evaluate(async () => {
    const text = await (await fetch("../houses/ataraxia.html")).text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    return doc.querySelector("#part-01 .human-title").textContent.trim();
  });
  await expect(link.locator(".lib-found-name")).toHaveText(title);
  // The explanation is printed out in full.
  const say = await page.locator("#note-holy-bread .lib-say").textContent();
  await expect(card.locator(".lib-card-say")).toHaveText(say.trim(), { timeout: 3000 });
  // Put back with Escape, and the address forgets it.
  await page.keyboard.press("Escape");
  await expect(card).toBeHidden();
  expect(await page.evaluate(() => window.location.hash)).toBe("");
});

/* THE CARD'S LIST IS SET OUT AS THE OWNER DREW IT: the individual
   fragrances first, by name; then HOUSES, and under it each house named
   and only then its fragrances. There are no bars above it any more. */
test("a card lists the individual fragrances first, then the houses, each house named", async ({ page }) => {
  await arrive(page);
  // A note used both by an individual fragrance and in a house.
  const id = await page.evaluate(() => {
    const N = window.FRAGRANCE_NOTES;
    const houses = new Map();
    Object.keys(N).forEach((k) => {
      const e = N[k];
      [e.top, e.mid, e.base, e.flat, e.also && e.also.top, e.also && e.also.mid, e.also && e.also.base, e.also && e.also.flat]
        .filter(Boolean).flat().forEach((n) => {
          const key = n.toLowerCase();
          if (!houses.has(key)) houses.set(key, new Set());
          houses.get(key).add(k.split(":")[0]);
        });
    });
    const el = [...document.querySelectorAll(".lib-record")].find((r) => {
      const all = new Set();
      [r.querySelector(".lib-name").textContent].concat((r.dataset.aka || "").split("|")).forEach((n) =>
        (houses.get(n.toLowerCase()) || []).forEach((h) => all.add(h)));
      return all.has("individual") && all.size > 2;
    });
    return el.id;
  });
  await page.locator("#" + id).evaluate((el) => el.click());
  const card = page.locator(".lib-card");
  await expect(card).toBeVisible();
  await expect(card.locator(".lib-card-circ, .lib-circ")).toHaveCount(0);
  const heads = await card.locator(".lib-found-head").allTextContents();
  expect(heads).toEqual(["Individual fragrances", "Houses"]);
  // The individual fragrances stand before the houses, and every
  // fragrance under Houses stands under its house's name.
  const order = await card.locator(".lib-card-list").evaluate((list) =>
    [...list.querySelectorAll(".lib-found-head, .lib-found-housename, a")].map((el) =>
      el.matches("a") ? "frag:" + el.dataset.key.split(":")[0] : el.textContent));
  expect(order[0]).toBe("Individual fragrances");
  const housesAt = order.indexOf("Houses");
  order.slice(1, housesAt).forEach((x) => expect(x).toBe("frag:individual"));
  expect(order.slice(housesAt + 1).filter((x) => x === "frag:individual")).toEqual([]);
  expect(order[housesAt + 1].startsWith("frag:"), "a house is named before its fragrances").toBe(false);
});

/* THE BOOKS ARE DIGITAL: each carries a data bar at its head, filled by
   how much it is used, and a barcode of its own over its call number. */
test("every book carries a data bar and a barcode of its own", async ({ page }) => {
  await arrive(page);
  const out = await page.evaluate(() => {
    const books = [...document.querySelectorAll(".lib-record")];
    // The pattern of bars and gaps, without the colour, which differs
    // from book to book anyway.
    const codes = new Set(books.map((b) => b.querySelector(".lib-code").style.background
      .replace(/(hsla?|rgba?)\([^)]*\)/g, "")));
    const fill = (id) => parseFloat(document.getElementById(id).style.getPropertyValue("--fill"));
    return {
      all: books.every((b) => b.querySelector(".lib-bands") && b.querySelector(".lib-code")),
      codes: codes.size, books: books.length,
      often: fill("note-bergamot"), once: fill("note-holy-bread"),
    };
  });
  expect(out.all).toBe(true);
  expect(out.codes, "barcodes are the books' own").toBeGreaterThan(out.books * 0.9);
  expect(out.often).toBeGreaterThan(out.once);
});

/* THE BOOKS STAND ON THEIR SHELVES: each within its shelf, none on top
   of another, and each carrying its shelf's call number. */
test("the books stand on their shelves without running into each other", async ({ page }) => {
  for (const size of [{ width: 1440, height: 900 }, { width: 900, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await arrive(page);
    await page.waitForTimeout(2600);
    const out = await page.evaluate(() => {
      const faults = [];
      document.querySelectorAll(".lib-shelf").forEach((shelf) => {
        const code = shelf.dataset.shelf;
        const holder = shelf.querySelector(".lib-records").getBoundingClientRect();
        const books = [...shelf.querySelectorAll(".lib-record")];
        const boxes = books.map((b) => ({ el: b, r: b.getBoundingClientRect() }));
        boxes.forEach(({ el, r }, i) => {
          if (!el.querySelector(".lib-call").textContent.startsWith(code)) faults.push(el.id + " wrong call number");
          if (r.left < holder.left - 1 || r.right > holder.right + 1) faults.push(el.id + " off its shelf");
          if (el.classList.contains("lib-leans")) return;
          for (let j = i + 1; j < boxes.length; j++) {
            const o = boxes[j];
            if (o.el.classList.contains("lib-leans")) continue;
            const x = Math.min(r.right, o.r.right) - Math.max(r.left, o.r.left);
            const y = Math.min(r.bottom, o.r.bottom) - Math.max(r.top, o.r.top);
            if (x > 1 && y > 1) faults.push(el.id + " on " + o.el.id);
          }
        });
        // Every book in a row stands on the same board.
        const bottoms = new Set(boxes.filter((b) => !b.el.classList.contains("lib-leans")).map((b) => Math.round(b.r.bottom)));
        const rows = new Set(boxes.map((b) => Math.round(b.r.top / 50)));
        if (bottoms.size > rows.size + 1) faults.push(code + " books do not stand on one board");
      });
      return { faults: faults, wide: document.documentElement.scrollWidth - window.innerWidth };
    });
    expect(out.faults, `at ${size.width}px`).toEqual([]);
    expect(out.wide, `the page scrolls sideways at ${size.width}px`).toBeLessThanOrEqual(1);
  }
});

/* A BOOK'S THICKNESS IS HOW MANY FRAGRANCES USE IT. */
test("a note used often is a thicker book than a note used once", async ({ page }) => {
  await arrive(page);
  const w = await page.evaluate(() => {
    const by = (id) => ({ w: document.getElementById(id).getBoundingClientRect().width, n: +document.getElementById(id).dataset.uses });
    return { often: by("note-bergamot"), once: by("note-holy-bread") };
  });
  expect(w.often.n).toBeGreaterThanOrEqual(10);
  expect(w.once.n).toBe(1);
  expect(w.often.w).toBeGreaterThan(w.once.w + 12);
});

/* THE TERMINAL: books that answer light up, the rest go dim, and a shelf
   with nothing on it folds away. It reads other spellings — and DIRECT
   WORDS ONLY, at the owner's word: nothing is found by what a note is
   said to be, and no near miss counts. */
test("the terminal lights the books that answer and folds away the rest", async ({ page }) => {
  await arrive(page);
  const query = page.locator(".lib-query");

  // Another spelling: Blood Cedar is shelved as Cedarwood, and is not
  // in its name or its explanation — only in the spellings folded in.
  await query.fill("blood cedar");
  await expect(page.locator("#note-cedarwood")).toHaveClass(/is-hit/);
  expect(await page.locator("#note-cedarwood .lib-say").textContent()).not.toMatch(/blood/i);
  await expect(page.locator("#note-bergamot")).not.toHaveClass(/is-hit/);
  await expect(page.locator("#shelf-cit")).toBeHidden();
  await expect(page.locator(".lib-count")).toHaveText(/^\d+ \/ \d+$/);

  // A word only in the explanations lights nothing that is not called
  // it: "smoky" is said of a dozen notes and names only a couple.
  await query.fill("smoky");
  const lit = await page.locator(".lib-record.is-hit").evaluateAll((all) =>
    all.map((el) => el.querySelector(".lib-name").textContent + " | " + (el.dataset.aka || "")));
  lit.forEach((names) => expect(names, "lit by a name, not a description").toMatch(/\bsmoky/i));
  const saidSmoky = await page.locator(".lib-say").evaluateAll((all) =>
    all.filter((el) => /smoky/i.test(el.textContent)).length);
  expect(saidSmoky, "there are notes only said to be smoky").toBeGreaterThan(lit.length);

  // A word typed must BE a word in a name: "cedar" finds the cedars and
  // nothing else, half a word finds nothing, and "iris" finds Orris and
  // not Seaweed, whose Irish Sea Moss it used to light.
  await query.fill("cedar");
  const cedars = await page.locator(".lib-record.is-hit .lib-name").allTextContents();
  expect(cedars.length).toBeGreaterThan(2);
  cedars.forEach((n) => expect(n).toMatch(/cedar/i));
  await query.fill("iris");
  await expect(page.locator("#note-orris")).toHaveClass(/is-hit/);
  await expect(page.locator("#note-seaweed")).not.toHaveClass(/is-hit/);
  await query.fill("vetiv");
  await expect(page.locator(".lib-record.is-hit")).toHaveCount(0);
  await query.fill("vetivr");
  await expect(page.locator(".lib-record.is-hit")).toHaveCount(0);

  // Enter opens the best answer.
  await query.fill("vetiver");
  await query.press("Enter");
  await expect(page.locator(".lib-card-name")).toHaveText("Vetiver");

  // And nothing at all hands over to the whole site's search.
  await query.fill("qqqzzzxx");
  await expect(page.locator(".lib-nothing")).toBeVisible();
  await expect(page.locator(".lib-elsewhere")).toHaveAttribute("href", "../search.html?q=qqqzzzxx");
  await query.fill("");
  await expect(page.locator(".lib-record.is-dim")).toHaveCount(0);
});

/* THE INDEX: one tab per shelf. */
test("a shelf tab stands you in front of that shelf alone", async ({ page }) => {
  await arrive(page);
  await expect(page.locator(".lib-tab")).toHaveCount(await page.locator(".lib-shelf").count() + 1);
  await page.locator(".lib-tab[data-shelf='WOO']").click();
  await expect(page.locator("#shelf-woo")).toBeVisible();
  await expect(page.locator("#shelf-cit")).toBeHidden();
  await expect(page.locator(".lib-shelf:visible")).toHaveCount(1);
  await page.locator(".lib-tab[data-shelf='']").click();
  await expect(page.locator("#shelf-cit")).toBeVisible();
});

/* MOST USED reorders a shelf by use, and the call numbers — where a book
   belongs — stay where they were. */
test("ordering by use moves the books and keeps their call numbers", async ({ page }) => {
  await arrive(page);
  const callBefore = await page.locator("#note-cedarwood").getAttribute("data-call");
  await page.locator(".lib-order-by[data-order='uses']").click();
  const order = await page.$$eval("#shelf-woo .lib-record", (all) => all.map((el) => +el.dataset.uses));
  expect(order).toEqual([...order].sort((a, b) => b - a));
  expect(await page.locator("#note-cedarwood").getAttribute("data-call")).toBe(callBefore);
  await page.locator(".lib-order-by[data-order='alpha']").click();
  const names = await page.$$eval("#shelf-woo .lib-name", (all) => all.map((el) => el.textContent.toLowerCase()));
  expect(names).toEqual([...names].sort());
});

/* THE KEYBOARD: one book takes the tab, the arrows walk the shelves, and
   Enter opens the card. */
test("the shelves can be walked and opened with the keyboard", async ({ page }) => {
  await arrive(page);
  await expect(page.locator(".lib-record[tabindex='0']")).toHaveCount(1);
  await page.locator(".lib-record[tabindex='0']").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const id = await page.evaluate(() => document.activeElement.id);
  const third = await page.evaluate(() => document.querySelectorAll(".lib-record")[2].id);
  expect(id).toBe(third);
  await page.keyboard.press("Enter");
  await expect(page.locator(".lib-card")).toBeVisible();
  await expect(page.locator("#" + id)).toHaveClass(/is-out/);
});

/* THE SITE'S OWN SEARCH reads the library off the page like everything
   else, and finds a note by another of its spellings. */
test("the site's search finds a note, by any of its spellings", async ({ page }) => {
  await serveDependenciesLocally(page);
  await page.goto("/search.html?q=iris%20butter");
  const row = page.locator(".find-results a", { hasText: "Orris" }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toHaveAttribute("href", /note-library\.html#note-orris$/);
  await expect(page.locator(".find-filter[data-kind='Note']")).toBeVisible();
});

/* WITH ANIMATION TURNED OFF the stacks are simply there, and the
   readout is already at its figures. */
test.describe("with reduced motion", () => {
  test("the library is there at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await arrive(page);
    await expect(page.locator("body")).not.toHaveClass(/lib-arriving/);
    await expect(page.locator(".lib-scan")).toHaveCount(0);
    const records = await page.locator(".lib-record").count();
    await expect(page.locator(".lib-readout dd").first()).toHaveText(String(records));
  });
});

/* WITHOUT THE SCRIPT the catalogue is the page: every record, readable. */
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the catalogue is a plain list", async ({ page }) => {
    await page.goto(LIBRARY);
    await expect(page.locator(".lib-record").first()).toBeVisible();
    await expect(page.locator("#note-bergamot .lib-say")).toBeVisible();
    expect(await page.locator(".lib-record").count()).toBeGreaterThan(300);
  });
});
