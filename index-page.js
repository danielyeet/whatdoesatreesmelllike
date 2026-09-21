// ============================================================
// THE INDEX PAGES
//
// Two places on this site are laid out as an INDEX: a plain,
// directory-like page with a few readings across the top, a plate or
// two on the right, and a long TABLE standing in the bottom left
// corner of the window.
//
//   categories/researches.html — the researches, numbered, titled and
//   dated.
//
//   the Individual fragrances view of the contact sheet page — every
//   fragrance written up anywhere on this site, with the house it
//   belongs to and the date it was written about.
//
// This file is what makes such a table a table you can use rather
// than one you can only read:
//
//   IT SORTS. Every heading is a button. Pressing one sorts the rows
//   by that column and pressing it again turns the sort round. What it
//   sorts on is written on the row itself (`data-no`, `data-name`,
//   `data-house`, `data-kind`, `data-date`) rather than read off the
//   lettering, so
//   a date reading "14.03.2026" still sorts as a date and a number
//   still sorts as a number.
//
//   IT SEARCHES. The field above the table matches anything written on
//   a row and takes the rest out.
//
//   THE HEADINGS STAY. That is the stylesheet's doing rather than this
//   file's (`position: sticky`), but it is the same decision: the
//   table scrolls inside its own box and its headings do not go with
//   it.
//
// A ROW'S NUMBER IS ITS OWN, not its place in the list — sorting by
// date does not renumber anything. The number is what the piece is
// called; where it stands is what you just changed.
//
// WITHOUT THIS SCRIPT the table is the same table, in the order it is
// written in the page, and every row is still a link. Nothing here is
// the only way to reach anything.
// ============================================================
(function () {
  const boards = [...document.querySelectorAll(".index-board")];
  if (!boards.length) return;

  boards.forEach((board) => {
    const table = board.querySelector(".index-table");
    if (!table) return;
    const body = table.querySelector("tbody");
    const rows = [...body.querySelectorAll("tr")];
    const field = board.querySelector(".index-search-field");
    const count = board.querySelector(".index-count");

    // How a column is read off a row. A row carries what it IS on
    // itself; the lettering in the cells is only how it is shown.
    const readings = {
      no: (row) => Number(row.dataset.no || 0),
      name: (row) => (row.dataset.name || "").toLowerCase(),
      house: (row) => (row.dataset.house || "").toLowerCase(),
      // Research or Exploration, on the Works page. A row that is
      // neither yet sorts to the END, the same way an unwritten date
      // does and for the same reason.
      kind: (row) => (row.dataset.kind || "zzz").toLowerCase(),
      // A row with no date is one that hasn't been written yet. It
      // sorts to the END rather than the beginning, because an empty
      // string is the earliest thing there is and nothing unwritten
      // should head a list ordered by when things were written.
      date: (row) => row.dataset.date || "9999",
    };

    let sortKey = "no";
    let sortWay = 1;

    function order() {
      const read = readings[sortKey] || readings.no;
      const sorted = rows.slice().sort((a, b) => {
        const ra = read(a);
        const rb = read(b);
        if (ra < rb) return -sortWay;
        if (ra > rb) return sortWay;
        // Two rows that read the same keep the order they were written
        // in, so a sort never shuffles anything it had no opinion about.
        return readings.no(a) - readings.no(b);
      });
      sorted.forEach((row) => body.appendChild(row));
    }

    function sift() {
      const looking = (field ? field.value : "").trim();
      let showing = 0;
      rows.forEach((row) => {
        // Forgiving, where the site's matcher is on the page: a name
        // typed with a letter out of place is still that name. The
        // plain test is what is left without it.
        const matches = !looking || (window.SiteSearch
          ? window.SiteSearch.score(looking, row.dataset.name || row.textContent) > 0 ||
            row.textContent.toLowerCase().includes(looking.toLowerCase())
          : row.textContent.toLowerCase().includes(looking.toLowerCase()));
        row.hidden = !matches;
        if (matches) showing++;
      });
      board.classList.toggle("index-nothing", Boolean(looking) && !showing);
      if (count) {
        count.textContent =
          showing === rows.length
            ? String(rows.length).padStart(3, "0")
            : String(showing).padStart(3, "0") + " / " + String(rows.length).padStart(3, "0");
      }
    }

    table.querySelectorAll(".index-sort").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.key;
        if (key === sortKey) {
          sortWay = -sortWay;
        } else {
          sortKey = key;
          sortWay = 1;
        }
        table.querySelectorAll(".index-sort").forEach((other) => {
          const on = other === button;
          other.classList.toggle("sorted", on);
          other.classList.toggle("up", on && sortWay < 0);
          // Said out loud as well as drawn, since the mark is a
          // triangle and a triangle says nothing to a screen reader.
          const cell = other.closest("th");
          if (cell) {
            if (on) cell.setAttribute("aria-sort", sortWay > 0 ? "ascending" : "descending");
            else cell.removeAttribute("aria-sort");
          }
        });
        order();
      });
    });

    if (field) {
      field.addEventListener("input", sift);
      // A search field's own clear button fires `search`, not `input`,
      // in some browsers.
      field.addEventListener("search", sift);
      // What this table cannot answer goes to the site's own search
      // page, with the question in the address.
      field.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const showing = rows.filter((row) => !row.hidden);
        const term = field.value.trim();
        if (showing.length) {
          const link = showing[0].querySelector("a");
          if (link) { window.location.href = link.href; return; }
        }
        if (term && window.SiteSearch) {
          window.location.href = window.SiteSearch.siteSearchHref(window.SITE_ROOT, term);
        }
      });
    }

    order();
    sift();

    // AND IT ARRIVES. Switched to, the index does not simply appear:
    // the readings come up, the plates fade in and the rows land one
    // after another — the same way the map on the other view draws
    // itself outwards. A table that snaps into place reads as a
    // document being swapped; this reads as one being laid out.
    //
    // Which rows are staggered is capped in the stylesheet, or the
    // sixty-fifth row would arrive two seconds after the first.
    const view = board.closest(".view");
    const page = board.closest(".index-page");
    if (view && page) {
      const arrive = () => {
        // NOT WHEN IT IS BEING SWIPED IN. views.js puts `sliding` on the
        // view before it un-hides it, and a view arriving that way is
        // already being animated across the window — playing this on top
        // of it is two movements at once, which is what the owner saw as
        // the swipe blinking. The swipe is the arrival.
        if (view.classList.contains("sliding")) return;
        page.classList.remove("index-arriving");
        // The frame after, so the animation starts from nothing rather
        // than from wherever the last one left it.
        requestAnimationFrame(() => page.classList.add("index-arriving"));
        window.setTimeout(() => page.classList.remove("index-arriving"), 1800);
      };
      new MutationObserver((changes) => {
        changes.forEach((change) => {
          if (change.attributeName === "hidden" && !view.hidden) arrive();
        });
      }).observe(view, { attributes: true, attributeFilter: ["hidden"] });
      if (!view.hidden) arrive();
    }
  });
})();

// ============================================================
// THE MARK
//
// One plate on an index page is DRAWN rather than photographed: a
// slow ring of specks with lines strung between the near ones, on the
// page's own white. It is there so an index page still belongs to a
// site whose other pages are drawings — the chamber's orbit, printed
// small and standing still enough to be looked past.
//
// It is only ever as big as the plate it stands in, it is worked out
// from the clock rather than stepped along, and under
// `prefers-reduced-motion` it is drawn once and left.
// ============================================================
(function () {
  const canvas = document.querySelector(".index-mark");
  if (!canvas) return;
  const ink = canvas.getContext("2d");
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SPECKS = 150;
  const TILT = 0.42;          // how far the ring is turned out of the page
  const BAND = 0.11;          // how wide the band of specks is
  const TURN = 0.02;          // how far round it goes in a second
  const WEB_REACH = 26;
  const WEB_EACH = 2;
  const INK = "23,23,15";     // --ink

  let seed = 907;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const ring = [];
  for (let i = 0; i < SPECKS; i++) {
    ring.push({
      turn: random() * Math.PI * 2,
      out: 1 + (random() + random() - 1) * BAND,
      lift: (random() - 0.5) * BAND,
      size: random() < 0.22 ? 2 : 1,
      rate: 0.7 + random() * 0.6,
    });
  }

  let wide = 0;
  function size() {
    const box = canvas.getBoundingClientRect();
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
                           window.devicePixelRatio || 1);
    wide = Math.max(1, Math.round(box.width));
    canvas.width = Math.round(wide * ratio);
    canvas.height = Math.round(wide * ratio);
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(clock) {
    ink.clearRect(0, 0, wide, wide);
    const cx = wide / 2;
    const cy = wide / 2;
    const r = wide * 0.33;
    const seen = ring.map((s) => {
      const way = s.turn + clock * TURN * s.rate * Math.PI * 2;
      return {
        x: cx + Math.cos(way) * r * s.out,
        y: cy + Math.sin(way) * r * s.out * TILT + s.lift * r,
        // The far half of the ring is drawn fainter, which is the whole
        // of what says which way it is tipped.
        ink: 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(way)),
        size: s.size,
      };
    });

    ink.strokeStyle = "rgba(" + INK + ",0.12)";
    ink.lineWidth = 1;
    ink.beginPath();
    const carried = new Array(seen.length).fill(0);
    for (let i = 0; i < seen.length; i++) {
      if (carried[i] >= WEB_EACH) continue;
      for (let j = i + 1; j < seen.length; j++) {
        if (carried[i] >= WEB_EACH) break;
        if (carried[j] >= WEB_EACH) continue;
        const dx = seen[i].x - seen[j].x;
        const dy = seen[i].y - seen[j].y;
        if (Math.hypot(dx, dy) > WEB_REACH) continue;
        ink.moveTo(seen[i].x, seen[i].y);
        ink.lineTo(seen[j].x, seen[j].y);
        carried[i]++;
        carried[j]++;
      }
    }
    ink.stroke();

    seen.forEach((p) => {
      ink.fillStyle = "rgba(" + INK + "," + p.ink.toFixed(3) + ")";
      ink.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
  }

  const began = performance.now();
  function frame(now) {
    draw((now - began) / 1000);
    requestAnimationFrame(frame);
  }

  size();
  if (REDUCE_MOTION) draw(0);
  else requestAnimationFrame(frame);
  window.addEventListener("resize", () => { size(); if (REDUCE_MOTION) draw(0); });
})();
