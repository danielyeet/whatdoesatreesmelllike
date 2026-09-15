// ============================================================
// FAVORITES — the other half of a contact sheet page
//
// The page carries two ways of looking at one category, and the two
// buttons above switch between them:
//
//   Description portfolio   the map, drawn by contact-sheet.js
//   Favorites               this: the REGISTER
//
// THE REGISTER. The screen flickers once, and what comes up is a page
// ruled edge to edge with fine horizontal TRACKS. Every favourite in
// the open chapter has a track of its own, running the whole width of
// the page and passing straight through its own row of writing; the
// rest of the page is filled with tracks carrying nothing. A small
// SQUARE travels along each one, trailing behind it, and where two
// squares come near the same place they are joined by a line — so the
// page is never twice the same drawing.
//
// And it GLITCHES. Every few seconds the whole thing tears for a
// moment: slices of it slip sideways, squares double into coloured
// ghosts, a row or two of the writing is thrown out of line, and the
// code in the corner scrambles. It settles as fast as it went. The
// glitch is never in the content — no name, date or number is ever
// shown as anything but itself — only in where things are drawn.
//
// Everything in the menu is read off the page itself: the chapters
// are the different data-chapter values on the entries, in the order
// they first appear, and each entry carries its own date. So adding
// a favourite, or a whole new chapter, is one HTML edit.
//
// This file also owns the switching between the two views, because
// it owns the buttons. It never touches the map's elements and the
// map never touches these: all they share is a class on <body>,
// which style.css reads to take one view out of the page and put the
// other in.
// ============================================================
(function () {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;   // not a page with favorites on it

  const entries = Array.from(gallery.querySelectorAll(".gallery-entry"));
  const buttons = Array.from(document.querySelectorAll(".sheet-filter"));
  if (!entries.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SWITCH_MS = 520;       // how long the view being left takes to go
  const FLICKER_MS = 460;      // and how long the screen takes to settle after it

  // --- the tracks
  const GAUGE = [30, 62];      // how far apart the tracks with nothing on them stand
  const PACE = [22, 104];      // how fast a square travels, pixels a second
  const SQUARE = [3, 8];       // how big one is drawn
  const TRAIL = [46, 180];     // how far behind it its trail reaches
  const STEPS = 6;             // in how many steps that trail is drawn
  const CARS = [1, 3];         // how many squares run on one track
  const JOIN = 62;             // two squares this near in x are joined by a line
  const BANDS = 6;             // how many weights the marks are grouped into to draw
  const RULE = 0.55;           // how heavily an empty track's own rule is drawn
  const RULE_LIT = 0.95;       // and a favourite's own, while it is pointed at

  // --- where the writing stands
  const DIM = 0.2;             // how far a mark is dimmed over the writing
  const SOFT = 30;             // and how far outside it, it comes back
  const PAD = 10;              // how far past the writing the room reaches

  // --- the glitch
  const TEAR_EVERY = [1.9, 5.4];   // seconds between one tear and the next
  const TEAR_FOR = [0.06, 0.17];   // and how long one lasts
  const SLICES = [3, 8];           // how many bands of the drawing slip
  const SLIP = 30;                 // and how far, at most
  const GHOSTS = 0.2;              // how many squares double into a coloured ghost
  const GHOST_OFF = 6;             // and how far off their ghost stands
  const TORN_ROWS = 2;             // how many rows of the writing go with it

  // --- the hand
  const HAND_REACH = 180;      // how near the cursor a mark answers, in pixels
  const HAND_LIFT = 2.2;       // and how much bigger it is drawn there

  const INK = "23,23,15";      // --ink
  const MUTED = "109,108,98";  // --muted
  const BRASS = "156,111,53";  // --brass
  const COOL = "47,95,150";    // the one cool accent the rest of the site keeps

  const numbered = (i) => String(i + 1).padStart(2, "0");
  const between = (pair, t) => pair[0] + (pair[1] - pair[0]) * t;

  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // ============================================================
  // WHAT IS ON THE PAGE
  // ============================================================
  const chapters = [];
  entries.forEach((entry) => {
    const name = (entry.dataset.chapter || "Unsorted").trim();
    let chapter = chapters.find((one) => one.name === name);
    if (!chapter) {
      chapter = { name: name, items: [] };
      chapters.push(chapter);
    }
    const date = (entry.dataset.date || "").trim();
    chapter.items.push({
      name: entry.textContent.trim(),
      date: date,
      href: entry.getAttribute("href"),
      day: Number(date.slice(0, 2)) || 16,
    });
  });

  // HOW EACH CHAPTER RUNS. The chapters are put in the order of the
  // dates their favourites are filed under — earliest in the month
  // first — and the whole range of paces is laid across them in that
  // order, so how fast the register runs says where a chapter stands
  // among the others. The gauge is a reading of how far apart its own
  // dates are: a chapter filed across a month is ruled wide, one filed
  // inside a week is ruled close.
  //
  // Spread by ORDER rather than by the dates themselves, because the
  // dates themselves do not spread: three chapters filed within a
  // fortnight of each other would all run at the same rate, and a
  // reading no one can tell apart is not a reading at all.
  (function () {
    const middles = chapters.map((chapter) => {
      const days = chapter.items.map((item) => item.day);
      const sum = days.reduce((a, b) => a + b, 0);
      chapter.spread = days.length > 1
        ? (Math.max.apply(null, days) - Math.min.apply(null, days)) / 30
        : 0.5;
      return days.length ? sum / days.length : 16;
    });
    const order = chapters.map((chapter, i) => i)
      .sort((a, b) => middles[a] - middles[b] || a - b);
    const last = Math.max(1, chapters.length - 1);
    order.forEach((which, place) => {
      const chapter = chapters[which];
      chapter.run = place / last;                      // 0 slowest, 1 quickest
      chapter.gauge = between(GAUGE, chapter.spread);  // and how wide it is ruled
    });
  })();

  // ============================================================
  // THE VIEW
  // ============================================================
  const view = document.createElement("div");
  view.className = "chapters";

  const field = document.createElement("canvas");
  field.className = "chapters-field";
  field.setAttribute("aria-hidden", "true");
  view.appendChild(field);

  // The head line: what the whole register holds, and a code in the
  // corner that is the thing the glitch scrambles. Nothing anyone
  // reads for meaning is ever scrambled — only this.
  const head = document.createElement("div");
  head.className = "chapters-head";
  head.innerHTML =
    '<p class="chapters-count"></p><p class="chapters-sig" aria-hidden="true"></p>';
  view.appendChild(head);
  const countLine = head.querySelector(".chapters-count");
  const sig = head.querySelector(".chapters-sig");
  countLine.textContent =
    "FAVORITES · " + numbered(chapters.length - 1) + " CHAPTERS · " +
    numbered(entries.length - 1) + " ENTRIES";

  const body = document.createElement("div");
  body.className = "chapters-body";
  view.appendChild(body);

  // --- the index, down the left
  const index = document.createElement("div");
  index.className = "chapters-index";
  body.appendChild(index);

  const rail = document.createElement("div");
  rail.className = "chapters-rail";
  rail.setAttribute("role", "tablist");
  rail.setAttribute("aria-label", "Chapters");
  rail.setAttribute("aria-orientation", "vertical");
  index.appendChild(rail);

  chapters.forEach((chapter, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "chapters-tab";
    tab.setAttribute("role", "tab");
    tab.id = "chapter-tab-" + i;
    tab.setAttribute("aria-controls", "chapter-panel-" + i);
    tab.innerHTML =
      '<span class="chapters-reg" aria-hidden="true"></span>' +
      '<span class="chapters-no"></span>' +
      '<span class="chapters-name"></span>' +
      '<span class="chapters-count-small"></span>';
    tab.querySelector(".chapters-no").textContent = numbered(i);
    tab.querySelector(".chapters-name").textContent = chapter.name;
    tab.querySelector(".chapters-count-small").textContent =
      numbered(chapter.items.length - 1);
    rail.appendChild(tab);
    chapter.tab = tab;
  });

  const spec = document.createElement("dl");
  spec.className = "chapters-spec";
  spec.innerHTML =
    "<div><dt>Entries</dt><dd class=\"chapters-entries\"></dd></div>" +
    "<div><dt>First</dt><dd class=\"chapters-first\"></dd></div>" +
    "<div><dt>Last</dt><dd class=\"chapters-last\"></dd></div>" +
    "<div><dt>Gauge</dt><dd class=\"chapters-gauge\"></dd></div>";
  index.appendChild(spec);

  // --- the log, filling the rest
  const log = document.createElement("div");
  log.className = "chapters-log";
  body.appendChild(log);

  const title = document.createElement("h2");
  title.className = "chapters-title";
  log.appendChild(title);

  const panels = document.createElement("div");
  panels.className = "chapters-panels";
  log.appendChild(panels);

  chapters.forEach((chapter, i) => {
    const panel = document.createElement("section");
    panel.className = "chapters-panel";
    panel.id = "chapter-panel-" + i;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "chapter-tab-" + i);
    chapter.items.forEach((item, n) => {
      const link = document.createElement("a");
      link.className = "chapters-item";
      link.href = item.href;
      // The date stands where the rest of the site would put a number:
      // it is what one favourite is filed under, and the only thing
      // said about it other than its name.
      link.innerHTML =
        '<span class="chapters-item-no" aria-hidden="true"></span>' +
        '<span class="chapters-date"></span>' +
        '<span class="chapters-item-name"></span>' +
        '<span class="chapters-go" aria-hidden="true">→</span>';
      link.querySelector(".chapters-item-no").textContent = numbered(n);
      link.querySelector(".chapters-date").textContent = item.date;
      link.querySelector(".chapters-item-name").textContent = item.name;
      // Pointing at one lights that favourite's own track right across
      // the page, so every entry has a line of the drawing that is its.
      link.addEventListener("pointerenter", () => { hotItem = n; drawing = true; });
      link.addEventListener("pointerleave", () => { hotItem = -1; drawing = true; });
      link.addEventListener("focus", () => { hotItem = n; drawing = true; });
      link.addEventListener("blur", () => { hotItem = -1; drawing = true; });
      panel.appendChild(link);
      item.row = link;
    });
    panels.appendChild(panel);
    chapter.panel = panel;
  });

  gallery.appendChild(view);

  const paint = field.getContext("2d");

  // ============================================================
  // OPENING ONE
  // ============================================================
  let open = 0;
  // These belong to the field further down, but they are declared here
  // because opening a chapter touches all of them and a chapter is
  // opened while the page is still being built. Left where the rest of
  // the field's state is, they do not exist yet at that moment and the
  // whole view falls over before it has drawn anything. This has
  // bitten four times in this repository now.
  let hotItem = -1;
  let drawing = true;
  let remeasure = true;
  let width = 0, height = 0;
  let run = 0;        // how fast the register is running now
  let gauge = 40;     // and how wide it is ruled
  let tracks = [];

  function show(next, andFocus) {
    open = (next + chapters.length) % chapters.length;
    chapters.forEach((chapter, i) => {
      const on = i === open;
      chapter.tab.classList.toggle("open", on);
      chapter.tab.setAttribute("aria-selected", on ? "true" : "false");
      // Only the open chapter's tab is in the tab order: the index is
      // one control, and the arrow keys move within it.
      chapter.tab.tabIndex = on ? 0 : -1;
      chapter.panel.classList.toggle("open", on);
      chapter.panel.hidden = !on;
    });
    const chapter = chapters[open];
    const items = chapter.items;
    title.textContent = chapter.name;
    spec.querySelector(".chapters-entries").textContent = numbered(items.length - 1);
    spec.querySelector(".chapters-first").textContent = items.length ? items[0].date : "—";
    spec.querySelector(".chapters-last").textContent =
      items.length ? items[items.length - 1].date : "—";
    spec.querySelector(".chapters-gauge").textContent =
      String(Math.round(chapter.gauge)).padStart(3, "0");
    // The register carries the chapter you have open, so opening one
    // re-rules the whole page: its own tracks, at its own gauge,
    // running at its own rate. And it tears as it changes — a panel
    // being switched over, not a panel fading.
    hotItem = -1;
    drawing = true;
    remeasure = true;
    runAt(chapter.run, chapter.gauge);
    tear();
    if (andFocus) chapters[open].tab.focus();
  }

  chapters.forEach((chapter, i) => {
    chapter.tab.addEventListener("click", () => show(i));
    // Pointing at a chapter runs the register at ITS rate and gauge
    // without opening it, and tears as it takes it up; taking the
    // pointer away brings the open chapter's back the same way.
    // Tabbing along the index does the same, so it is not only a
    // pointer that can see it.
    const preview = () => { runAt(chapter.run, chapter.gauge); tear(); };
    const back = () => {
      runAt(chapters[open].run, chapters[open].gauge);
      tear();
    };
    chapter.tab.addEventListener("pointerenter", preview);
    chapter.tab.addEventListener("focus", preview);
    chapter.tab.addEventListener("pointerleave", back);
    chapter.tab.addEventListener("blur", back);
  });

  rail.addEventListener("keydown", (e) => {
    let used = true;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") show(open + 1, true);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") show(open - 1, true);
    else if (e.key === "Home") show(0, true);
    else if (e.key === "End") show(chapters.length - 1, true);
    else used = false;
    if (used) e.preventDefault();
  });

  // ============================================================
  // THE REGISTER
  //
  // Tracks run the full width of the page. The first of them are the
  // open chapter's favourites and stand at their own rows' heights —
  // a favourite's track goes straight through its own line of writing,
  // which is what makes it that favourite's and not just another rule.
  // The rest fill the page at the chapter's gauge and carry nothing.
  //
  // A track is a rule, a square travelling along it, and the trail
  // behind the square. What a square does is read off its own track:
  // a favourite's from the date it is filed under, an empty one's from
  // where it stands on the page.
  // ============================================================
  let taken = [];
  let handX = -9999, handY = -9999, hasHand = false;
  // Everything read off the page comes back in the WINDOW's
  // coordinates and everything drawn is in the CANVAS's, whose corner
  // is some way down the page. One subtraction, in one place.
  let originX = 0, originY = 0;

  function runAt(nextRun, nextGauge) {
    run = nextRun;
    gauge = nextGauge;
    remeasure = true;
    drawing = true;
  }

  /** The room the writing takes up, read off the page — the head, the
      index and the open chapter's own rows. Marks are DIMMED inside
      it rather than dropped: a square running along a favourite's own
      track has to pass through that favourite's line of writing, and
      something that vanishes at a straight edge and comes back at
      another reads as a pane of glass standing on the page. */
  function clearing() {
    taken = [];
    const rooms = [head, index, title];
    chapters[open].items.forEach((item) => rooms.push(item.row));
    rooms.forEach((el) => {
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      taken.push({
        left: box.left - originX - PAD, right: box.right - originX + PAD,
        top: box.top - originY - PAD, foot: box.bottom - originY + PAD,
      });
    });
  }

  /** 1 in the clear, falling to DIM where the writing stands. */
  function roomAt(x, y) {
    let lit = 1;
    for (let n = 0; n < taken.length; n++) {
      const room = taken[n];
      const out = Math.max(room.left - x, x - room.right, room.top - y, y - room.foot);
      if (out >= SOFT) continue;
      const close = out <= 0 ? 1 : 1 - out / SOFT;
      lit = Math.min(lit, 1 - (1 - DIM) * close);
    }
    return lit;
  }

  /** A track carries a few squares rather than one, spaced anywhere
      along it: one square a track reads as a diagram of something,
      several read as traffic. They are what the lines between tracks
      are drawn from, and one square a track gives almost none. */
  function carsFor(weight) {
    const many = Math.round(between(CARS, random()));
    const out = [];
    for (let n = 0; n < many; n++) {
      out.push({
        off: random(),
        size: between(SQUARE, Math.min(1, weight * (0.55 + random() * 0.8))),
      });
    }
    return out;
  }

  /** Rules the page: one track per favourite in the open chapter, at
      that favourite's own row, and the rest filling the page at the
      chapter's gauge. Each keeps where its square had got to, so
      re-ruling does not put every square back to the left-hand edge. */
  function rule() {
    const was = {};
    tracks.forEach((track) => { was[track.key] = track.at; });
    tracks = [];
    seed = 7;

    const items = chapters[open].items;
    const mine = [];
    items.forEach((item, n) => {
      const box = item.row.getBoundingClientRect();
      if (!box.height) return;
      const y = Math.round((box.top + box.bottom) / 2 - originY) + 0.5;
      mine.push(y);
      // A favourite's square runs at the pace its own date asks for,
      // and the odd-numbered ones run the other way, so the page reads
      // as a register and not as a queue.
      const own = (item.day % 30) / 30;
      tracks.push({
        key: "e" + n,
        item: n,
        y: y,
        pace: between(PACE, 0.25 + 0.75 * own) * (0.55 + 0.75 * run) * (n % 2 ? -1 : 1),
        trail: between(TRAIL, own),
        at: was["e" + n] !== undefined ? was["e" + n] : own,
        cars: carsFor(0.45 + 0.55 * own),
      });
    });

    // And the rest of the page, ruled at the chapter's gauge. A track
    // that would land on one of the favourites' own is left out, or
    // the two draw one over the other.
    let n = 0;
    for (let y = gauge * 0.5; y < height; y += gauge) {
      const near = mine.some((mineY) => Math.abs(mineY - y) < gauge * 0.55);
      n++;
      if (near) continue;
      const own = random();
      tracks.push({
        key: "f" + n,
        item: -1,
        y: Math.round(y) + 0.5,
        pace: between(PACE, own * 0.7) * (0.4 + 0.9 * run) * (n % 2 ? -1 : 1),
        trail: between(TRAIL, own),
        at: was["f" + n] !== undefined ? was["f" + n] : random(),
        cars: carsFor(own * 0.7),
      });
    }
  }

  // The scratch the tear copies out of — see the note where it is
  // used. Made once, sized with the field.
  const scratch = document.createElement("canvas");
  const scratchPaint = scratch.getContext("2d");
  let ratio = 1;

  function resize() {
    ratio = Math.min(2, window.devicePixelRatio || 1);
    const box = field.getBoundingClientRect();
    originX = box.left;
    originY = box.top;
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    scratch.width = field.width;
    scratch.height = field.height;
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    scratchPaint.setTransform(ratio, 0, 0, ratio, 0, 0);
    remeasure = true;
    drawing = true;
  }

  // ============================================================
  // THE GLITCH
  //
  // A tear is a moment, not a state: slices of the drawing slip
  // sideways, some squares double into a coloured ghost, a row or two
  // of the writing is thrown out of line and the code in the corner
  // scrambles. It is over in a tenth of a second. Nothing anyone reads
  // is ever changed — the writing only MOVES, and the only thing whose
  // characters change is the code, which says nothing.
  // ============================================================
  const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/·—=+*#";
  let torn = 0;             // how long is left of this tear
  let slices = [];
  let nextTear = between(TEAR_EVERY, random());
  let tornRows = [];

  function code() {
    let out = "";
    for (let n = 0; n < 7; n++) {
      out += n === 3 ? "·" : POOL[Math.floor(random() * POOL.length)];
    }
    return out;
  }
  sig.textContent = code();

  function tear() {
    if (REDUCE_MOTION) return;
    torn = between(TEAR_FOR, random());
    slices = [];
    const many = Math.round(between(SLICES, random()));
    for (let n = 0; n < many; n++) {
      slices.push({
        y: random() * height,
        tall: 6 + random() * 46,
        by: Math.round((random() - 0.5) * 2 * SLIP),
      });
    }
    sig.textContent = code();

    // And the writing with it: a row or two thrown out of line, in
    // the page's own elements rather than on the canvas, so what tears
    // is the lettering itself.
    tornRows.forEach((row) => {
      row.classList.remove("torn");
      row.style.removeProperty("--tear");
    });
    tornRows = [];
    const rows = chapters[open].items.map((item) => item.row).concat([title]);
    for (let n = 0; n < TORN_ROWS && rows.length; n++) {
      const row = rows[Math.floor(random() * rows.length)];
      if (tornRows.indexOf(row) >= 0) continue;
      row.style.setProperty("--tear", Math.round((random() - 0.5) * 2 * SLIP) + "px");
      row.classList.add("torn");
      tornRows.push(row);
    }
    drawing = true;
  }

  function mend() {
    tornRows.forEach((row) => {
      row.classList.remove("torn");
      row.style.removeProperty("--tear");
    });
    tornRows = [];
    slices = [];
  }

  // ============================================================
  // DRAWING IT
  // ============================================================
  const rgba = (tone, a) => "rgba(" + tone + "," + Math.max(0, Math.min(1, a)) + ")";

  // The marks are grouped into a few weights and each group is drawn
  // in one pass: a line that needs its own alpha needs its own stroke,
  // and there are a few hundred of them on the page.
  const rules = [];
  const trails = [];
  const dots = [];
  const joins = [];
  const ghosts = [];

  function draw() {
    paint.clearRect(0, 0, width, height);
    for (let b = 0; b < BANDS; b++) {
      rules[b] = rules[b] || []; rules[b].length = 0;
      trails[b] = trails[b] || []; trails[b].length = 0;
      dots[b] = dots[b] || []; dots[b].length = 0;
    }
    joins.length = 0;
    ghosts.length = 0;

    const put = (into, band, ...what) => {
      let b = Math.floor(band * BANDS);
      if (b > BANDS - 1) b = BANDS - 1;
      if (b < 0) b = 0;
      into[b].push.apply(into[b], what);
    };

    for (let n = 0; n < tracks.length; n++) {
      const track = tracks[n];
      const lit = track.item >= 0 && track.item === hotItem;

      // THE RULE. Drawn in a few lengths rather than as one line, so
      // that where it crosses the writing it is drawn back rather than
      // stopping at an edge and starting again at another.
      const ruled = lit ? RULE_LIT : RULE;
      for (let s = 0; s < 14; s++) {
        const x0 = (s / 14) * width, x1 = ((s + 1) / 14) * width;
        const room = roomAt((x0 + x1) / 2, track.y);
        put(rules, ruled * room, x0, track.y, x1, track.y);
      }

      // Pointed at, a favourite's own track is bracketed at both ends
      // — the mark the rest of the site makes on something it is
      // measuring, and what says this line is that favourite's.
      if (lit) {
        [6, width - 6].forEach((at) => {
          put(rules, 0.999, at, track.y - 7, at, track.y + 7);
        });
      }

      const back = track.pace < 0 ? 1 : -1;
      for (let c = 0; c < track.cars.length; c++) {
        const car = track.cars[c];
        let along = track.at + car.off;
        along -= Math.floor(along);
        const x = along * width;
        car.x = x;

        // THE HAND. A square near the cursor is drawn bigger, and so
        // is its trail — the one thing on the page that answers where
        // you are rather than what you are pointing at.
        let size = car.size;
        let warm = lit;
        if (hasHand) {
          const off = Math.hypot(x - handX, track.y - handY);
          if (off < HAND_REACH) {
            const close = 1 - off / HAND_REACH;
            size *= 1 + (HAND_LIFT - 1) * close * close;
            if (close > 0.45) warm = true;
          }
        }

        // THE TRAIL, drawn in steps back from the square so it fades.
        for (let s = 0; s < STEPS; s++) {
          const a0 = x + back * track.trail * (s / STEPS);
          const a1 = x + back * track.trail * ((s + 1) / STEPS);
          const fade = 1 - s / STEPS;
          const room = roomAt((a0 + a1) / 2, track.y);
          put(trails, Math.min(0.999, fade * fade * room * (lit ? 1 : 0.62)),
              a0, track.y, a1, track.y);
        }

        // THE SQUARE. Whole pixels, or a rectangle this small laid
        // across a pixel boundary comes out as a soft blob — and a
        // blob is the one thing these must not look like.
        const room = roomAt(x, track.y);
        const wide = Math.max(2, Math.round(size));
        dots[warm ? BANDS - 1 : Math.max(0, Math.min(BANDS - 1, Math.floor(room * BANDS)))]
          .push(Math.round(x - wide / 2), Math.round(track.y - wide / 2), wide, warm ? 1 : 0);

        // Some of them double into a coloured ghost while it is torn.
        if (torn > 0 && random() < GHOSTS) {
          ghosts.push(Math.round(x - wide / 2) + Math.round((random() - 0.5) * 2 * GHOST_OFF),
                      Math.round(track.y - wide / 2), wide, random() < 0.5 ? 0 : 1);
        }
      }

      // AND THE LINES BETWEEN THEM. Where two squares on neighbouring
      // tracks come near the same place they are joined, so the page
      // keeps drawing and undrawing itself without anything being
      // scripted to happen at any particular moment.
      if (n > 0) {
        const other = tracks[n - 1];
        if (Math.abs(other.y - track.y) >= gauge * 2.4) continue;
        for (let a = 0; a < other.cars.length; a++) {
          for (let b = 0; b < track.cars.length; b++) {
            const ox = other.cars[a].x, x = track.cars[b].x;
            if (ox === undefined || x === undefined) continue;
            const off = Math.abs(ox - x);
            if (off >= JOIN) continue;
            joins.push(ox, other.y, x, track.y, 1 - off / JOIN,
                       roomAt((ox + x) / 2, (other.y + track.y) / 2));
          }
        }
      }
    }

    paint.lineWidth = 1;
    for (let b = 0; b < BANDS; b++) {
      const lit = (b + 0.5) / BANDS;
      if (rules[b].length) {
        paint.strokeStyle = rgba(MUTED, lit * 0.45);
        paint.beginPath();
        for (let n = 0; n < rules[b].length; n += 4) {
          paint.moveTo(rules[b][n], rules[b][n + 1]);
          paint.lineTo(rules[b][n + 2], rules[b][n + 3]);
        }
        paint.stroke();
      }
      if (trails[b].length) {
        paint.strokeStyle = rgba(INK, lit * 0.42);
        paint.beginPath();
        for (let n = 0; n < trails[b].length; n += 4) {
          paint.moveTo(trails[b][n], trails[b][n + 1]);
          paint.lineTo(trails[b][n + 2], trails[b][n + 3]);
        }
        paint.stroke();
      }
      if (dots[b].length) {
        paint.beginPath();
        let any = false;
        for (let n = 0; n < dots[b].length; n += 4) {
          if (dots[b][n + 3]) continue;
          paint.rect(dots[b][n], dots[b][n + 1], dots[b][n + 2], dots[b][n + 2]);
          any = true;
        }
        if (any) { paint.fillStyle = rgba(INK, 0.25 + lit * 0.75); paint.fill(); }
        paint.beginPath();
        any = false;
        for (let n = 0; n < dots[b].length; n += 4) {
          if (!dots[b][n + 3]) continue;
          paint.rect(dots[b][n], dots[b][n + 1], dots[b][n + 2], dots[b][n + 2]);
          any = true;
        }
        if (any) { paint.fillStyle = rgba(BRASS, 0.35 + lit * 0.65); paint.fill(); }
      }
    }

    if (joins.length) {
      for (let n = 0; n < joins.length; n += 6) {
        paint.strokeStyle = rgba(INK, joins[n + 4] * joins[n + 5] * 0.36);
        paint.beginPath();
        paint.moveTo(joins[n], joins[n + 1]);
        paint.lineTo(joins[n + 2], joins[n + 3]);
        paint.stroke();
      }
    }

    if (ghosts.length) {
      for (let n = 0; n < ghosts.length; n += 4) {
        paint.fillStyle = rgba(ghosts[n + 3] ? COOL : BRASS, 0.55);
        paint.fillRect(ghosts[n], ghosts[n + 1], ghosts[n + 2], ghosts[n + 2]);
      }
    }

    // THE TEAR. Done last, and done by copying what has just been
    // drawn back onto the page a little to one side, slice by slice.
    //
    // It has to go through a scratch canvas. Clearing a slice of the
    // page and then copying that same slice back from the page itself
    // copies the hole that was just made — the slices came out empty,
    // which is not a tear, it is a page with bands missing. So the
    // whole drawing is put on the scratch first and the slices are
    // taken from there.
    if (torn > 0 && slices.length) {
      scratchPaint.setTransform(1, 0, 0, 1, 0, 0);
      scratchPaint.clearRect(0, 0, scratch.width, scratch.height);
      scratchPaint.drawImage(field, 0, 0);
      for (let n = 0; n < slices.length; n++) {
        const cut = slices[n];
        paint.clearRect(0, cut.y, width, cut.tall);
        paint.drawImage(scratch,
          0, Math.round(cut.y * ratio), scratch.width, Math.max(1, Math.round(cut.tall * ratio)),
          cut.by, cut.y, width, cut.tall);
      }
    }
  }

  // ============================================================
  // THE CLOCK
  // ============================================================
  let last = 0;
  function tick(at) {
    requestAnimationFrame(tick);
    if (!document.body.classList.contains("view-favorites")) return;
    const dt = Math.min(0.05, (at - last) / 1000) || 0.016;
    last = at;

    if (remeasure) {
      remeasure = false;
      clearing();
      rule();
    }

    if (!REDUCE_MOTION) {
      for (let n = 0; n < tracks.length; n++) {
        const track = tracks[n];
        track.at += (track.pace / Math.max(1, width)) * dt;
        // Wrapped rather than turned round: a register runs one way
        // and comes back round, it does not bounce off the margin.
        track.at -= Math.floor(track.at);
      }
      drawing = true;

      nextTear -= dt;
      if (torn > 0) {
        torn -= dt;
        if (torn <= 0) { mend(); }
      } else if (nextTear <= 0) {
        nextTear = between(TEAR_EVERY, random());
        tear();
      }
    }

    if (drawing) {
      drawing = REDUCE_MOTION ? false : true;
      draw();
    }
  }

  view.addEventListener("pointermove", (e) => {
    handX = e.clientX - originX;
    handY = e.clientY - originY;
    hasHand = true;
    drawing = true;
  });
  view.addEventListener("pointerleave", () => { hasHand = false; drawing = true; });

  show(0);

  // ============================================================
  // ARRIVING AND LEAVING
  //
  // The first time Favorites is opened the screen takes a moment to
  // come up: it flickers once, the way a panel does when it is
  // switched on, and only then does the register arrive. After that it
  // is simply there — the flicker is the thing being turned on, and it
  // is only turned on once.
  // ============================================================
  let arrived = false;
  function arrive() {
    if (arrived) return;
    arrived = true;
    resize();
    requestAnimationFrame(tick);
    if (REDUCE_MOTION) {
      view.classList.add("lit");
      return;
    }
    view.classList.add("flicker");
    setTimeout(() => {
      view.classList.remove("flicker");
      view.classList.add("lit");
    }, FLICKER_MS);
  }

  function choose(what) {
    const wanted = what === "favorites";
    if (document.body.classList.contains("view-favorites") === wanted) return;
    buttons.forEach((button) => {
      button.classList.toggle("chosen", button.dataset.view === what);
    });

    const swap = () => {
      document.body.classList.toggle("view-favorites", wanted);
      if (wanted) arrive();
      // Two frames after the swap: the view arriving has only just been
      // given a size, and something with no size yet has nothing to
      // draw itself into.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove("view-switching");
        if (wanted) { resize(); drawing = true; }
      }));
    };

    // The one being left has to be gone before the other arrives, or
    // for half a second the page is showing two different things.
    document.body.classList.add("view-switching");
    if (REDUCE_MOTION) swap();
    else setTimeout(swap, SWITCH_MS);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.view || "sheet"));
  });

  window.addEventListener("resize", () => { if (arrived) resize(); });
})();
