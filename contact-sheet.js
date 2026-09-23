// ============================================================
// THE HOUSES — the chain (categories/scent-descriptions.html)
//
// One picture per house, joined one to the next in a single chain that
// runs across the page and back again — left to right along the first
// row, down, right to left along the second, down, and so on, the way
// the owner drew it (2026-09-23): boxes of different sizes, standing a
// little up or down from each other, joined by short bars — some one
// solid stroke, some two hairlines with the paper between them.
//
// It DRAWS ITSELF IN, from the first house to the last: a bar runs out
// of one picture and the next is uncovered from the side the bar came
// in at. Nothing flicks. There used to be a flick — every picture going
// past in a middle window on hard cuts — and a map of scattered pictures
// joined by dated lines; the owner asked for that startup animation gone
// completely and for this in its place, so none of it is in this file.
//
// POINTING AT A HOUSE, AND RESTING THERE, brings that house's own motifs
// up over the page while everything else goes out of focus (motifs.js
// draws them; this file only says which house and when). The wait is
// the point: a pointer crossing the page on its way somewhere else must
// not set off one house after another. Leaving lets them fade rather
// than vanish.
//
// PRESSING A HOUSE does not cut to it. The page steps back, the picture
// comes forward, and only then is the house opened — which then eases in
// on its own side (see THE WAY IN, in style.css).
//
// The pictures are the <a class="sheet-frame"> blocks in the page, in
// the order they stand there, so adding a house is an HTML edit and
// nothing here changes. Delete this file and its <script> tag and the
// page is still a plain, working grid of links.
// ============================================================
(function () {
  const sheet = document.getElementById("sheet");
  if (!sheet) return; // not a page with the chain on it

  const frames = Array.from(sheet.querySelectorAll(".sheet-frame"));
  if (!frames.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  // The chain arrives one house at a time. STEP_MS is from one house
  // starting to arrive to the next; each takes longer than that to be
  // uncovered (WIPE_MS), so two are always on the move at once and the
  // chain reads as one movement rather than as a row of switches.
  const STEP_MS = 260;
  const WIPE_MS = 760;
  // A bar runs out a little ahead of the picture it leads to, and the
  // picture starts to open as the bar reaches it.
  const LINK_MS = 380;
  const LINK_LEAD = 0.72;       // how much of the bar is out before the picture starts
  const FIRST_AFTER_MS = 240;   // a breath of white page before anything

  // How long the pointer has to rest on a house before its motifs come.
  // Long enough that crossing the page on the way to somewhere else sets
  // nothing off; short enough that resting on one reads as asking.
  const HOVER_WAIT_MS = 420;

  // Pressing a house: how long the page takes to step back before the
  // house is opened.
  const LEAVE_MS = 560;

  // THE ROWS. How many houses stand in a row comes off the width of the
  // sheet — the owner's drawing has seven — and each is given a slot of
  // its own, so nothing can ever land on anything else.
  const rowOf = (width) => (width >= 1060 ? 7 : width >= 840 ? 5 : width >= 560 ? 4 : 2);
  // A picture is between these fractions of its slot wide, and between
  // these multiples of its own width tall: uneven on purpose, as drawn.
  const WIDE = [0.58, 0.92];
  const TALL = [0.72, 1.16];
  // The room between one row and the next, which is where the bar that
  // turns the chain round runs.
  const ROW_GAP = 84;
  // A bar is this thick: two hairlines this far apart, or one stroke.
  const DOUBLE_GAP = 6;

  // Seeded, so the chain stands the same way on every visit and a resize
  // moves it rather than re-rolling it into a different arrangement.
  const SEED = 1923;
  let seed = SEED;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  const between = (range) => range[0] + random() * (range[1] - range[0]);

  // ============================================================
  // THE FRAMES
  // ============================================================
  // A frame with no picture in it yet is drawn as hatching, the same
  // way every other placeholder on this site is. The number in the
  // corner is the frame's number on the sheet, and it stays once a real
  // picture is in the frame.
  frames.forEach((frame, i) => {
    frame.style.setProperty("--hatch-angle", (-62 + ((i * 37) % 120)) + "deg");
    frame.style.setProperty("--hatch-gap", (9 + ((i * 5) % 9)) + "px");
    const number = document.createElement("span");
    number.className = "sheet-number";
    number.textContent = String(i + 1).padStart(2, "0");
    frame.appendChild(number);
  });

  // Taking over from the plain grid the page comes with. Done before
  // anything is measured, so nothing is ever laid out twice.
  sheet.classList.add("scripted");
  document.body.classList.add("sheet-scripted");

  // THE BARS. One element each, placed and sized by the layout; which
  // two houses it joins is written on it.
  const bars = document.createElement("div");
  bars.className = "sheet-lines";
  bars.setAttribute("aria-hidden", "true");
  sheet.insertBefore(bars, sheet.firstChild);
  const links = frames.slice(1).map((frame, n) => {
    const bar = document.createElement("span");
    bar.className = "sheet-link";
    bar.dataset.from = String(n);
    bar.dataset.to = String(n + 1);
    bars.appendChild(bar);
    return bar;
  });

  // ============================================================
  // LAYOUT
  // ============================================================
  // Every picture is given a slot in a row, and the rows are read as a
  // snake: even rows left to right, odd rows right to left. So the last
  // house in one row and the first in the next stand in the same column,
  // one above the other, and the bar between them runs straight down.
  let placed = [];
  function layout() {
    seed = SEED;
    const width = sheet.clientWidth;
    const perRow = Math.min(rowOf(width), frames.length);
    const slot = width / perRow;

    // Sizes first, so each row knows how tall its tallest picture is.
    // No box is narrower than the name printed in it: a name cut short
    // ("Grande Pa…") is a name you cannot read.
    const sizes = frames.map((frame) => {
      const name = frame.querySelector(".sheet-name");
      const needs = name ? name.scrollWidth + 30 : 0;
      const w = Math.round(Math.min(slot * 0.96, Math.max(needs, slot * between(WIDE))));
      const h = Math.round(Math.min(slot * 0.98, w * between(TALL)));
      return { w, h, jx: random(), jy: random(), bar: random(), kind: random() };
    });

    const rows = Math.ceil(frames.length / perRow);
    let top = 0;
    placed = [];
    for (let r = 0; r < rows; r++) {
      const members = sizes.slice(r * perRow, (r + 1) * perRow);
      const tallest = Math.max(...members.map((m) => m.h));
      members.forEach((m, c) => {
        const i = r * perRow + c;
        const col = r % 2 === 0 ? c : perRow - 1 - c;
        const room = slot - m.w;
        const x = Math.round(col * slot + room * (0.2 + 0.6 * m.jx));
        // Up or down within the row by up to most of the difference
        // between this picture and the row's tallest — which is what
        // makes the bars between them land at different heights.
        const y = Math.round(top + (tallest - m.h) * m.jy);
        placed[i] = { x, y, w: m.w, h: m.h, row: r, bar: m.bar, kind: m.kind };
      });
      top += tallest + ROW_GAP;
    }
    const height = top - ROW_GAP;

    placed.forEach((one, i) => {
      const frame = frames[i];
      frame.style.setProperty("--x", one.x + "px");
      frame.style.setProperty("--y", one.y + "px");
      frame.style.width = one.w + "px";
      frame.style.height = one.h + "px";
      // Which side it is uncovered from: the side its bar comes in at.
      const before = placed[i - 1];
      const from = !before ? "left"
        : before.row !== one.row ? "top"
        : before.x < one.x ? "left" : "right";
      frame.dataset.enter = from;
      // The line about the house hangs from whichever side keeps it on
      // the page: a house in the right half hangs it leftwards, or the
      // line runs off the edge and the page scrolls sideways.
      frame.dataset.say = one.x + one.w / 2 > width / 2 ? "end" : "start";
    });

    links.forEach((bar, n) => {
      const a = placed[n], b = placed[n + 1];
      // A bar turning the chain round is always the double one, as it is
      // in the drawing; along a row it is either.
      const double = a.row !== b.row || b.kind < 0.55;
      bar.classList.toggle("double", double);
      bar.classList.toggle("solid", !double);
      const thick = double ? DOUBLE_GAP + 3 : 3;
      if (a.row === b.row) {
        // Along the row, at a height both pictures stand at.
        const lo = Math.max(a.y, b.y) + 10;
        const hi = Math.min(a.y + a.h, b.y + b.h) - 10 - thick;
        const y = Math.round(hi > lo ? lo + (hi - lo) * b.bar : (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2);
        const left = a.x < b.x ? a : b, right = a.x < b.x ? b : a;
        place(bar, left.x + left.w, y, right.x - (left.x + left.w), thick);
        bar.dataset.run = a.x < b.x ? "right" : "left";
      } else {
        // Down from one row to the next, somewhere both pictures are
        // above each other — and clear of the name printed in the upper
        // one's bottom left corner.
        const lo = Math.max(a.x, b.x) + Math.min(a.w, b.w) * 0.45;
        const hi = Math.min(a.x + a.w, b.x + b.w) - 12 - thick;
        const x = Math.round(hi > lo ? lo + (hi - lo) * b.bar : (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2);
        place(bar, x, a.y + a.h, thick, b.y - (a.y + a.h));
        bar.dataset.run = "down";
      }
    });

    sheet.style.height = height + "px";
    // Stood in the middle of the window when it is shorter than it,
    // rather than hung from the top with the page empty below it.
    sheet.style.marginTop = Math.max(24, Math.round((window.innerHeight - height) / 2 - 96)) + "px";
  }
  function place(el, x, y, w, h) {
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = Math.max(0, w) + "px";
    el.style.height = Math.max(0, h) + "px";
  }

  // ============================================================
  // THE WAY IN
  // ============================================================
  // From the first house to the last: the bar into a house runs out,
  // and as it reaches the house the picture is uncovered from that side.
  // The chrome — the Menu, the two buttons, the search — comes once the
  // chain is whole, as it always has on this page: the page puts itself
  // together and then hands you the controls.
  function arrive() {
    sheet.classList.add("settled");
    if (REDUCE_MOTION) {
      frames.forEach((frame) => frame.classList.add("landed", "whole"));
      links.forEach((bar) => bar.classList.add("drawn"));
      finish();
      return;
    }
    frames.forEach((frame, i) => {
      const at = FIRST_AFTER_MS + i * STEP_MS;
      if (i > 0) setTimeout(() => links[i - 1].classList.add("drawn"), at - LINK_MS * LINK_LEAD);
      setTimeout(() => frame.classList.add("landed"), at);
      // Once it is uncovered the clip is taken off altogether, so the
      // line about the house can hang below the picture when pointed at.
      setTimeout(() => frame.classList.add("whole"), at + WIPE_MS + 40);
    });
    setTimeout(finish, FIRST_AFTER_MS + (frames.length - 1) * STEP_MS + WIPE_MS);
  }
  function finish() {
    sheet.classList.add("drawn");
    document.body.classList.add("sheet-named");
  }

  // ============================================================
  // RESTING ON A HOUSE
  // ============================================================
  // The house's motifs come up over the page, and everything else goes
  // out of focus behind them. `data-motif` on the frame says whose; with
  // none, or with motifs.js missing, the page still goes out of focus
  // round the house and simply draws nothing over it.
  let waiting = null;
  let resting = null;
  function rest(frame) {
    if (resting === frame) return;
    if (resting) resting.classList.remove("hot");
    resting = frame;
    frame.classList.add("hot");
    sheet.classList.add("musing");
    if (window.HouseMotifs) window.HouseMotifs.start(frame.dataset.motif, frame);
  }
  function leave(frame) {
    clearTimeout(waiting);
    waiting = null;
    if (resting !== frame) return;
    resting = null;
    frame.classList.remove("hot");
    sheet.classList.remove("musing");
    if (window.HouseMotifs) window.HouseMotifs.stop();
  }
  frames.forEach((frame) => {
    frame.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(waiting);
      waiting = setTimeout(() => {
        waiting = null;
        if (!sheet.classList.contains("drawn") || sheet.classList.contains("searching")) return;
        if (document.body.classList.contains("sheet-leaving")) return;
        rest(frame);
      }, HOVER_WAIT_MS);
    });
    frame.addEventListener("pointerleave", () => leave(frame));
    // The keyboard gets the same thing on the same wait.
    frame.addEventListener("focus", () => {
      clearTimeout(waiting);
      waiting = setTimeout(() => { waiting = null; if (sheet.classList.contains("drawn")) rest(frame); }, HOVER_WAIT_MS);
    });
    frame.addEventListener("blur", () => leave(frame));

    // ==========================================================
    // PRESSING A HOUSE
    // ==========================================================
    // The page steps back and the picture comes forward, and only then
    // is the house opened. A press meant for a new tab or window is
    // left to the browser as it is.
    frame.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (REDUCE_MOTION) return;
      e.preventDefault();
      const href = frame.href;
      clearTimeout(waiting);
      frame.classList.add("chosen");
      document.body.classList.add("sheet-leaving");
      setTimeout(() => { window.location.href = href; }, LEAVE_MS);
    });
  });
  // Coming BACK to this page from a house with the browser's back button
  // can bring the page back exactly as it was left — stepped back, with
  // one picture held forward. Put it straight.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    document.body.classList.remove("sheet-leaving");
    frames.forEach((frame) => frame.classList.remove("chosen", "hot"));
    sheet.classList.remove("musing");
    resting = null;
    if (window.HouseMotifs) window.HouseMotifs.stop(true);
  });

  // ============================================================
  // SEARCH
  //
  // This page's own search looks over THIS CATEGORY: the houses on the
  // sheet and every fragrance in them, which are both already in the
  // page (the fragrances view carries the lot). It is forgiving —
  // "murkwod" finds Murkwood — and it says WHERE each answer lives, so
  // a fragrance is an answer you can act on rather than a word.
  //
  // What it cannot answer it hands to the site's own search page with
  // the question in the address, which is where a search that is not
  // about this category belongs.
  // ============================================================
  const search = document.querySelector(".sheet-search");
  if (search) {
    const field = search.querySelector(".sheet-search-field");
    const trigger = search.querySelector(".sheet-search-trigger");
    const found = document.createElement("div");
    found.className = "sheet-found";
    found.setAttribute("aria-live", "polite");
    search.appendChild(found);

    /** Everything this page can answer for, read off the page itself. */
    const mine = () => (window.SiteSearch
      ? window.SiteSearch.collect(document, window.location.href, ["Scent descriptions"])
      : []);
    let everything = null;

    const applySearch = () => {
      const term = field.value.trim();
      sheet.classList.toggle("searching", term.length > 0);
      if (!everything) everything = mine();

      const hits = term && window.SiteSearch
        ? window.SiteSearch.rank(term, everything, 6)
        : [];

      // The pictures dim as they always did — that is the search on
      // the sheet itself — and a picture counts as matching if the
      // search would have found it.
      frames.forEach((frame) => {
        const caption = frame.querySelector(".sheet-caption");
        const text = caption ? caption.textContent : "";
        const match = !term || (window.SiteSearch
          ? window.SiteSearch.score(term, text) > 0
          : text.toLowerCase().indexOf(term.toLowerCase()) >= 0);
        frame.classList.toggle("dimmed", Boolean(term) && !match);
      });

      found.innerHTML = "";
      search.classList.toggle("has-found", hits.length > 0);
      hits.forEach((hit) => {
        const row = document.createElement("a");
        row.className = "sheet-found-row";
        row.href = hit.entry.href;
        const name = document.createElement("span");
        name.className = "sheet-found-what";
        name.textContent = hit.entry.name;
        const where = document.createElement("span");
        where.className = "sheet-found-where";
        where.textContent = hit.entry.where.join(" · ");
        row.append(name, where);
        found.appendChild(row);
      });
      if (term && !hits.length) {
        const none = document.createElement("p");
        none.className = "sheet-found-none";
        none.textContent = "Nothing here by that name — press enter to search the site.";
        found.appendChild(none);
        search.classList.add("has-found");
      }
    };

    trigger.addEventListener("click", () => {
      search.classList.toggle("open");
      if (search.classList.contains("open")) field.focus();
      else { field.value = ""; applySearch(); }
    });
    field.addEventListener("input", applySearch);
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const first = found.querySelector(".sheet-found-row");
        if (first) { window.location.href = first.href; return; }
        const term = field.value.trim();
        if (term && window.SiteSearch) {
          window.location.href = window.SiteSearch.siteSearchHref(window.SITE_ROOT, term);
        }
        return;
      }
      if (e.key !== "Escape") return;
      field.value = "";
      applySearch();
      search.classList.remove("open");
      trigger.focus();
    });
  }

  // The chain is laid out before the page is shown, so what the browser
  // painted before this — the no-script grid of every picture — is never
  // seen; and it is laid out again, never re-run, when the window changes.
  layout();
  document.documentElement.classList.remove("js-coming");
  window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  arrive();
})();
