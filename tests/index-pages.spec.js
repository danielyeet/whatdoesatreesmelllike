// ============================================================
// THE INDEX PAGES
//
// Two places are laid out as an index rather than as a drawing: the
// Researches category, and the Fragrances view of the
// contact sheet page. They share a stylesheet block and a script, so
// these check both — and above all the three things the owner asked
// for, which are the things a plain table does not do on its own:
// the headings stay stuck to the top while the rows scroll under
// them, every heading sorts by its own column, and the field above
// searches.
// ============================================================
const { test, expect } = require("@playwright/test");
const { serveDependenciesLocally, collectPageErrors } = require("./helpers");

const RESEARCHES = "/categories/researches.html";
const SHEET = "/categories/scent-descriptions.html";

/** The rows showing right now, read off what each row SAYS it is
 *  rather than off its lettering — the same thing the sorting reads. */
const showing = (page) =>
  page.$$eval(".index-table tbody tr:not([hidden])", (rows) =>
    rows.map((row) => ({
      no: Number(row.dataset.no),
      name: row.dataset.name,
      house: row.dataset.house || "",
      date: row.dataset.date || "",
    }))
  );

/** Switch the contact sheet page over to the fragrances view and wait
 *  for the sheet to have finished first — the buttons are not there
 *  until the page has drawn itself. */
async function toFragrances(page) {
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );
  await page.click('.sheet-filter[data-view="fragrances"]');
  await page.waitForTimeout(600);
}

/* THE OLD FRAGRANCES VIEW. Since 2026-09-25 the Fragrances view is a
   line of files (fragrance-line.js, tests/fragrance-line.spec.js), and
   the table these check is kept in the page underneath it, unchanged, at
   the owner's word. Blocking the line's script is how the page is the
   old view again — the table, its sorting and search, and the fade and
   the swipe between the views — so that is what these run against. */
test.beforeEach(async ({ page }) => {
  await page.route("**/fragrance-line.js", (route) => route.abort());
  await serveDependenciesLocally(page);
});

test("the researches are a numbered, dated table, and the first one opens",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(RESEARCHES);

  const rows = await showing(page);
  expect(rows.length, "the table should have rows").toBeGreaterThan(1);
  // 000 STANDS FIRST, at the owner's word — "make it 000. It should be
  // the first result." It was Resins in Perfumery until 2026-09-23.
  expect(rows[0].name, "000 is the first result").toBe("My Personal Introduction to Perfume");
  expect(rows[0].no, "and it is numbered nought").toBe(0);
  expect(rows[1].name, "the first research is the owner's own").toBe("Resins in Perfumery");

  // Four columns, in the order asked for: the number, the work, which
  // KIND of work it is, and the date it was made. The third was added
  // when Researches became Works and the page started carrying
  // explorations beside the researches.
  await expect(page.locator(".index-table thead th")).toHaveText([
    "No.", "Work", "Research/Exploration", "Date",
  ]);

  // And the kind is on the row rather than only in the lettering, so
  // the column sorts on it like every other.
  const kinds = await page.$$eval(".index-table tbody tr",
    (all) => all.map((row) => row.dataset.kind));
  expect(kinds.filter((k) => k === "Research").length,
    "Resins in Perfumery is a research").toBeGreaterThan(0);
  // ASKED AS "AT LEAST", not as a count. This used to be `.toBe(2)`
  // and broke the moment the owner added a third exploration, which is
  // a thing they will keep doing — what the test is really about is
  // that the KIND is on the row so the column can sort on it, not how
  // many of each there happen to be today.
  expect(kinds.filter((k) => k === "Exploration").length,
    "the explorations are marked as explorations").toBeGreaterThanOrEqual(2);
  // And nothing carries a kind that is not one of the two, or empty
  // for a piece that is neither yet.
  const allowed = ["Research", "Exploration", ""];
  expect(kinds.filter((k) => !allowed.includes(k)),
    "a row's kind is Research, Exploration, or not decided yet").toEqual([]);

  // And the first one is a link to a page that is really there.
  const href = await page.locator(".index-table tbody tr a").first().getAttribute("href");
  expect(href).toContain("my-personal-introduction-to-perfume.html");
  const opened = await page.request.get(new URL(href, page.url()).toString());
  expect(opened.status(), "the research it points at should be served").toBe(200);

  expect(errors, "no console errors").toEqual([]);
});

test("the headings sort the table, and pressing one again turns it round",
  async ({ page }) => {
  await page.goto(SHEET);
  await toFragrances(page);

  // As written: by number.
  const written = await showing(page);
  // ENOUGH ROWS TO SORT, rather than a count of the site's fragrances.
  // This asked for more than twenty until the Fragrances view stopped
  // being an index of every fragrance on the site and became its own
  // review page — what the test is about is the sorting, not how many
  // perfumes the owner has written about.
  expect(written.length, "enough rows to sort").toBeGreaterThan(4);
  expect(written.map((r) => r.no)).toEqual(written.map((r, i) => i + 1));

  // By name, both ways.
  await page.click('.index-sort[data-key="name"]');
  const byName = (await showing(page)).map((r) => r.name.toLowerCase());
  expect(byName, "sorted by what a fragrance is called")
    .toEqual(byName.slice().sort());
  await page.click('.index-sort[data-key="name"]');
  const back = (await showing(page)).map((r) => r.name.toLowerCase());
  expect(back, "and the other way round the second time")
    .toEqual(byName.slice().reverse());

  // By house, alphabetically.
  await page.click('.index-sort[data-key="house"]');
  const byHouse = (await showing(page)).map((r) => r.house.toLowerCase());
  expect(byHouse).toEqual(byHouse.slice().sort());

  // By date, which is a date and not the lettering it is printed as:
  // "10.05.2025" sorts before "04.06.2025" although it reads larger.
  await page.click('.index-sort[data-key="date"]');
  const byDate = (await showing(page)).map((r) => r.date);
  expect(byDate).toEqual(byDate.slice().sort());

  // A row's NUMBER is its own and does not change when the table is
  // sorted: sorting says where things stand, not what they are called.
  const numbered = await page.$$eval(".index-table tbody tr:not([hidden])", (rows) =>
    rows.map((row) => [row.dataset.no, row.querySelector(".index-no").textContent.trim()]));
  numbered.forEach(([carried, printed]) => {
    expect(printed, "a row keeps its own number").toBe(String(carried).padStart(3, "0"));
  });
});

test("the field above the table searches it", async ({ page }) => {
  await page.goto(SHEET);
  await toFragrances(page);

  const all = (await showing(page)).length;
  await page.fill(".index-search-field", "haxan");
  await page.waitForTimeout(150);
  const found = await showing(page);
  expect(found.length, "one fragrance is called that").toBe(1);
  expect(found[0].name).toBe("Haxan");
  await expect(page.locator(".index-count")).toContainText("001");

  // And it gives the rest back.
  await page.fill(".index-search-field", "");
  await page.waitForTimeout(150);
  expect((await showing(page)).length).toBe(all);
});

test("the headings stay where they are while the rows scroll under them",
  async ({ page }) => {
  // THE TABLE IS MADE LONG HERE RATHER THAN FOUND LONG. Until the
  // Fragrances view became its own review page it carried sixty-three
  // rows and overflowed its box on its own; it carries eight now, and
  // neither index on the site is long enough to scroll. What is being
  // checked is the LAYOUT — that a heading stays put while rows go
  // under it — and that has to hold whatever the table happens to
  // hold, so the rows are cloned until there are enough of them.
  await page.goto(SHEET);
  await toFragrances(page);

  const stayed = await page.evaluate(() => {
    const body = document.querySelector(".index-table tbody");
    const seed = [...body.querySelectorAll("tr")];
    while (body.querySelectorAll("tr").length < 60) {
      seed.forEach((row) => body.appendChild(row.cloneNode(true)));
    }
    const box = document.querySelector(".index-scroll");
    const head = document.querySelector(".index-table thead th");
    const before = head.getBoundingClientRect().top;
    const firstBefore = document.querySelector(".index-table tbody tr").getBoundingClientRect().top;
    box.scrollTop = box.scrollHeight;
    const after = head.getBoundingClientRect().top;
    const firstAfter = document.querySelector(".index-table tbody tr").getBoundingClientRect().top;
    return { before, after, moved: firstBefore - firstAfter };
  });
  expect(stayed.moved, "the rows should have scrolled").toBeGreaterThan(10);
  expect(Math.abs(stayed.after - stayed.before), "and the heading should not have")
    .toBeLessThan(2);
});

test("the whole index comes out on one screen, whatever is in the table",
  async ({ page }) => {
  // The table has its own box to scroll inside precisely so that the
  // page around it does not grow: the owner has a great many more
  // fragrances to add to it.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHEET);
  await toFragrances(page);

  // As above: the rows are cloned until there are far more than would
  // ever fit, because "whatever is in the table" is the whole claim and
  // the real table is eight rows long today.
  const fits = await page.evaluate(() => {
    const body = document.querySelector(".index-table tbody");
    const seed = [...body.querySelectorAll("tr")];
    while (body.querySelectorAll("tr").length < 80) {
      seed.forEach((row) => body.appendChild(row.cloneNode(true)));
    }
    return {
      page: document.documentElement.scrollHeight,
      window: window.innerHeight,
      rows: body.querySelectorAll("tr").length,
    };
  });
  expect(fits.rows, "there are more rows than would ever fit").toBeGreaterThan(30);
  expect(fits.page, "and the page is still one screen").toBeLessThanOrEqual(fits.window + 2);
});

test("the first switch swaps the views over; after that the page swipes",
  async ({ page }) => {
  await page.goto(SHEET);
  await page.waitForFunction(
    () => {
      const sheet = document.getElementById("sheet");
      return sheet && sheet.classList.contains("drawn");
    },
    null,
    { timeout: 20000 }
  );

  // Watched every frame through each switch. TWO THINGS ARE BEING
  // GUARDED, and they are different things:
  //   `both`    — frames with both views showing at once.
  //   `overlap` — frames where those two actually stood on top of one
  //               another. Fading through each other in the same place
  //               is the thing this must never look like; travelling
  //               side by side is what the owner asked for.
  await page.evaluate(() => {
    window.__both = 0;
    window.__overlap = 0;
    window.__watching = true;
    window.__reset = () => { window.__both = 0; window.__overlap = 0; };
    const watch = () => {
      const on = [...document.querySelectorAll(".view")].filter((v) => {
        if (v.hidden) return false;
        const style = getComputedStyle(v);
        return style.display !== "none" && parseFloat(style.opacity) > 0.05;
      });
      if (on.length > 1) {
        window.__both++;
        const a = on[0].getBoundingClientRect();
        const b = on[1].getBoundingClientRect();
        // How much of the window they share. Travelling side by side
        // this is zero: one's right edge is the other's left edge.
        const shared = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        if (shared > 1) window.__overlap++;
      }
      if (window.__watching) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  // THE FIRST TIME a view is opened there is no swipe: the one being
  // left goes, and the other arrives after it has gone.
  await page.click('.sheet-filter[data-view="fragrances"]');
  await page.waitForTimeout(1200);
  const first = await page.evaluate(() => ({ both: window.__both, overlap: window.__overlap }));
  expect(first.both, "the first switch swaps them over, one at a time").toBe(0);

  // AND AFTER THAT IT SWIPES, because both have now been opened: the
  // two travel across the window together, side by side, never one over
  // the other.
  await page.evaluate(() => window.__reset());
  await page.click('.sheet-filter[data-view="houses"]');
  await page.waitForTimeout(1400);
  const back = await page.evaluate(() => {
    window.__watching = false;
    return { both: window.__both, overlap: window.__overlap };
  });
  expect(back.both, "the second switch swipes, so both are on the page")
    .toBeGreaterThan(0);
  expect(back.overlap, "but never in the same place as each other").toBe(0);

  // The chrome does not travel with them: the category's name and the
  // Menu are outside the box that slides.
  const held = await page.evaluate(() => ({
    where: Math.round(document.querySelector(".sheet-where").getBoundingClientRect().left),
    menu: Math.round(document.querySelector(".menu-trigger").getBoundingClientRect().left),
  }));
  expect(held.menu, "the Menu stays where it is").toBeLessThan(80);
  expect(held.where, "and so does the category's name").toBeLessThan(200);

  // And the sheet is still the sheet when you come back to it.
  await expect(page.locator('.view[data-view="houses"]')).toBeVisible();
  await expect(page.locator(".sheet-frame").first()).toBeVisible();

  // Nothing is left lying across the page afterwards.
  const after = await page.evaluate(() => ({
    sliding: document.querySelectorAll(".view.sliding").length,
    swiping: document.querySelector(".views").classList.contains("swiping"),
    height: document.querySelector(".views").style.height,
  }));
  expect(after.sliding, "the views are put back in the flow").toBe(0);
  expect(after.swiping).toBe(false);
  expect(after.height, "and the box's held height is let go of").toBe("");
});

test("without the script the table is still the table", async ({ page }) => {
  // index-page.js only sorts and searches. Everything it works on is
  // written in the page, so a blocked script costs the sorting and
  // nothing else.
  await page.route("**/index-page.js", (route) => route.abort());
  const errors = collectPageErrors(page, ["ERR_FAILED", "Failed to load resource"]);
  await page.goto(RESEARCHES);

  const rows = await showing(page);
  expect(rows.length, "the rows are the page's own").toBeGreaterThan(1);
  // As written in the page: 000 first, since 2026-09-23.
  expect(rows[0].name).toBe("My Personal Introduction to Perfume");
  await expect(page.locator(".index-table tbody tr a").first()).toBeVisible();
  expect(errors, "no errors beyond the blocked file").toEqual([]);
});

/* A VIEW'S OWN LAYOUT BELONGS TO THE VIEW, NOT TO THE PAGE IT STANDS
   ON. The fragrances index lays itself out one way as this page's
   view — one centred column, the table given the room — and another
   as the Researches page, with readings across the top and a plates
   column down the right. That used to be asked of
   `body.view-fragrances`, which is toggled the moment a swipe starts:
   going from this view back to the sheet took its layout away while it
   was still on screen travelling off, so for half a second it was
   drawn in the Researches layout instead, with a plate the size of the
   window. The owner photographed it. */
test("the fragrances view keeps its own layout all the way through a swipe",
  async ({ page }) => {
  await page.goto("/categories/scent-descriptions.html");
  await page.waitForFunction(() => document.querySelector(".sheet.settled"),
    null, { timeout: 20000 });

  const go = async (which) => {
    await page.locator(".sheet-filter", { hasText: which }).click();
  };
  // The swipe waits for both views to have been opened at least once.
  await go("Fragrances");
  await page.waitForTimeout(1200);
  await go("Houses");
  await page.waitForTimeout(1800);
  await go("Fragrances");
  await page.waitForTimeout(1400);

  // The plates column is the tell: it is the one thing this view hides
  // and the Researches layout shows, and it is what carried the plate
  // the size of the window.
  const plates = () => page.evaluate(() => {
    const view = document.querySelector('.view[data-view="fragrances"]');
    const right = view ? view.querySelector(".index-right") : null;
    return right ? getComputedStyle(right).display : "gone";
  });
  expect(await plates(), "hidden while the view is simply showing").toBe("none");

  // And now the swipe back, watched while it runs.
  await go("Houses");
  for (let n = 0; n < 4; n++) {
    await page.waitForTimeout(110);
    expect(await plates(), "and hidden all the way through the swipe").toBe("none");
  }
});

/* ============================================================
   EXPLORATIONS & RESEARCHES, LAID OUT AGAIN (2026-09-26). The owner:
   "put this paragraph ... under the title RE, not under introduction.
   the introductiont hing delete it. Delete the right side of the page,
   and move the table upwards, so that it takes up abour 3/5ths of the
   page on the left ... On the right side, I want you to make something
   extravagant with the particles that reacts ot the thing being hovered
   on the left (in the table). Make it reactive and on theme."
   ============================================================ */

/** What the field's canvas has drawn, as how its ink is spread over a
 *  grid — enough to tell one form from another. */
const fieldInk = (page) => page.evaluate(() => {
  const c = document.querySelector(".re-canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const G = 24, cells = new Array(G * G).fill(0);
  let ink = 0;
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
    if (d[(y * c.width + x) * 4 + 3] > 40) {
      ink++;
      cells[Math.floor((y / c.height) * G) * G + Math.floor((x / c.width) * G)]++;
    }
  }
  return { ink, cells: cells.map((n) => n / Math.max(1, ink)) };
});
/** How differently two drawings spread their ink, 0 (the same) to 100
 *  (nothing in common). */
const apart = (a, b) => Math.round(a.cells.reduce((n, v, i) => n + Math.abs(v - b.cells[i]), 0) * 50);

test("Explorations & Researches: the paragraph under the name, the table on the left three fifths, the field on the right",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(RESEARCHES);
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const box = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
    return {
      gone: [".index-col", ".index-right", ".index-plate", ".index-line"].filter((s) => document.querySelector(s)),
      name: box(".index-name"), say: box(".index-say"), board: box(".index-board"), field: box(".re-field"),
      lede: document.querySelector(".index-say-lede").textContent.replace(/\s+/g, " ").trim(),
      width: innerWidth, height: innerHeight,
      sideways: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(out.gone, "the Information heading, the line and the plates are gone").toEqual([]);
  expect(out.lede).toBe("Here you will find my researches and my explorations. Researches are where I look into stuff " +
    "from primary or secondary sources. Explorations are pieces of work where I myself am the primary source.");
  // The paragraph stands under the name, in the same column.
  expect(out.say.top, "the paragraph under the name").toBeGreaterThanOrEqual(out.name.bottom - 1);
  expect(Math.abs(out.say.left - out.name.left), "and lined up with it").toBeLessThan(2);
  // The table, moved up, the left three fifths or so.
  expect(out.board.top, "the table moved up, under the paragraph").toBeLessThan(out.height * 0.45);
  expect(out.board.top).toBeGreaterThan(out.say.bottom);
  const share = out.board.width / out.width;
  expect(share, `the table takes about three fifths of the page (${share.toFixed(2)})`).toBeGreaterThan(0.5);
  expect(share).toBeLessThan(0.66);
  // The field on the right, the height of the page.
  expect(out.field.left, "the field stands to the right of the table").toBeGreaterThan(out.board.right);
  expect(out.field.height, "most of the window's height").toBeGreaterThan(out.height * 0.7);
  expect(out.sideways).toBe(false);

  // On a phone: one column, the field a band above the table.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const phone = await page.evaluate(() => ({
    field: document.querySelector(".re-field").getBoundingClientRect().toJSON(),
    board: document.querySelector(".index-board").getBoundingClientRect().toJSON(),
    sideways: document.documentElement.scrollWidth > innerWidth,
  }));
  expect(phone.field.bottom, "the field above the table on a phone").toBeLessThanOrEqual(phone.board.top);
  expect(phone.field.height).toBeGreaterThan(200);
  expect(phone.sideways).toBe(false);
  expect(errors).toEqual([]);
});

/* THE FIELD IS ABSTRACT. It first drew a figure for each work — a
   pyramid, a tear of resin, a bottle, two smokes — and the owner: "REmove
   the research specific stuff; and make it more so a general abstract
   geometric particulate thing. The closest thing to waht i like is the
   cloud when you hover the untitled researches/Explorations (and when you
   hover nothing). re-interpret it and do that please." So every row is a
   cloud gathered round an abstract form, given by its number; an Untitled
   row is the plain cloud; nothing pointed at is the ring. Nothing on a row
   names a figure any more, and nothing is written into the drawing. */
test("pointing at a row gathers the field into an abstract form, and leaving the table brings the ring back",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.addInitScript(() => {
    window.__words = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t) {
      if (this.canvas.classList.contains("re-canvas")) window.__words.push(String(t));
      return fillText.apply(this, arguments);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(RESEARCHES);
  expect(await page.locator(".index-table tbody tr[data-figure]").count(), "no row names a figure").toBe(0);
  const field = page.locator(".re-field");
  await expect(field).toHaveAttribute("data-figure", "ring");
  await page.waitForTimeout(2200);
  const ring = await fieldInk(page);
  expect(ring.ink, "the ring is drawn").toBeGreaterThan(400);
  await expect(page.locator(".re-caption-name")).toHaveText("Explorations & Researches");

  // Each row its own form, by its number, and its caption.
  const forms = { 0: "sphere", 1: "knot", 2: "torus", 3: "helix", 4: "disc", 5: "lattice" };
  const seen = [ring];
  const seenNames = ["ring"];
  for (const [no, name] of Object.entries(forms)) {
    const row = page.locator(`.index-table tbody tr[data-no="${no}"]`);
    await row.hover();
    await expect(field).toHaveAttribute("data-figure", name);
    await expect(page.locator(".re-caption-name")).toHaveText(await row.getAttribute("data-name"));
    if (no > 3) continue;
    await page.waitForTimeout(2000);
    const now = await fieldInk(page);
    expect(now.ink, `${name} is drawn`).toBeGreaterThan(300);
    // Measured: a form against itself a moment later, turned, 14–25; one
    // form against another, 37 and up (the helix and the tipped torus,
    // both tall, at their closest).
    seen.forEach((before, k) => expect(apart(now, before), `${name} is a different drawing from the ${seenNames[k]}`).toBeGreaterThan(30));
    seen.push(now);
    seenNames.push(name);
  }
  // An Untitled row is the plain cloud.
  await page.locator('.index-table tbody tr[data-no="7"]').hover();
  await expect(field, "an Untitled row is the cloud").toHaveAttribute("data-figure", "cloud");

  // Off the table, the ring comes back — a moment later.
  await page.mouse.move(200, 100);
  await page.waitForTimeout(250);
  await expect(field, "not at once").toHaveAttribute("data-figure", "cloud");
  await expect(field).toHaveAttribute("data-figure", "ring", { timeout: 3000 });

  // From the keyboard too: a row's link focused is pointed at.
  await page.locator('.index-table tbody tr[data-no="1"] a').focus();
  await expect(field).toHaveAttribute("data-figure", "knot");
  await expect(page.locator('.index-table tbody tr[data-no="1"]')).toHaveClass(/is-shown/);

  // A row added later takes the next form round, with nothing written on it.
  await page.evaluate(() => {
    const row = document.querySelector('tr[data-no="9"]');
    row.dataset.name = "Something new"; row.dataset.kind = "Research"; row.dataset.no = "10";
  });
  await page.locator('.index-table tbody tr[data-no="10"]').hover();
  await expect(field, "the forms go round again").toHaveAttribute("data-figure", "sphere");
  expect(await page.evaluate(() => window.__words), "nothing is written into the drawing").toEqual([]);
  expect(errors).toEqual([]);
});

test("the field answers the pointer over it",
  async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(RESEARCHES);
  await page.waitForTimeout(2200);
  // THE POINTER PARTS THE SPECKS: the ring's own band, with the pointer
  // held on it, has less ink right under the pointer than it had.
  const spot = await page.evaluate(() => {
    const r = document.querySelector(".re-canvas").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.47 + Math.min(r.width * 0.42, r.height * 0.36) * 0.33 };
  });
  const under = () => page.evaluate(({ x, y }) => {
    const c = document.querySelector(".re-canvas"), r = c.getBoundingClientRect(), k = c.width / r.width;
    const d = c.getContext("2d").getImageData(Math.round((x - r.left - 18) * k), Math.round((y - r.top - 18) * k), Math.round(36 * k), Math.round(36 * k)).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  }, spot);
  const before = await under();
  await page.mouse.move(spot.x, spot.y);
  await page.mouse.move(spot.x + 1, spot.y, { steps: 2 });
  await page.waitForTimeout(900);
  const parted = await under();
  expect(before, "the ring's band has ink where the pointer goes").toBeGreaterThan(10);
  expect(parted, "and the pointer parts it").toBeLessThan(before * 0.6);
  expect(errors).toEqual([]);
});

test.describe("the field with animation turned off", () => {
  test("each figure is simply there, and nothing moves", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(RESEARCHES);
    await page.waitForTimeout(500);
    const a = await fieldInk(page);
    expect(a.ink, "the ring is drawn at once").toBeGreaterThan(400);
    await page.waitForTimeout(700);
    const b = await fieldInk(page);
    expect(apart(a, b), "and stands still").toBe(0);
    await page.locator('.index-table tbody tr[data-no="0"]').hover();
    const c = await fieldInk(page);
    expect(apart(c, a), "a row pointed at is drawn at once").toBeGreaterThan(40);
    expect(errors).toEqual([]);
  });
});
