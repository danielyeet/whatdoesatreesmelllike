// ============================================================
// THE FRAGRANCES, A WHOLE-PAGE TABLE — the Fragrances view of
// categories/scent-descriptions.html
//
// (The file keeps the name it was given when this view was a LINE, as
// contact-sheet.js keeps its name and draws the axis: renaming it would
// only move every reference to it for nothing.)
//
// THREE ROUNDS ON ONE DAY (2026-09-25):
//   morning   the fragrances as FILES travelling along a horizontal line
//             through a double pyramid of specks;
//   evening   a compact table standing over the line and the pyramid —
//             "it needs to fit more on the screen at once. I do
//             essentially need it to be a list or a table";
//   night     "the thing in the back is downright ugly; lets change tht
//             entirely. I want you to remove the horizontal line, remove
//             the pyramid thing, and make it an almost whole page table,
//             with some space and stylisting elements on the left. I want
//             you to be able to scroll, and change the view of the table
//             so it is either as currently, or into small boxes or into
//             cards. These options should be on the right of the table."
//
// So there is NOTHING DRAWN BEHIND IT any more — the page's own squared
// paper is the whole of its ground — and the view is three columns:
//
//   THE ASIDE     on the left, space and a few things to look at: the
//                 name, the count large, a handful of READINGS worked out
//                 from the rows, THE SCALE — a hairline with one tick per
//                 fragrance, filled as far as you have scrolled, the ticks
//                 of the ones in view inked — and THE MARK, a small ring of
//                 specks turning slowly with one larger speck for every
//                 fragrance, which lights while that fragrance is pointed
//                 at. The mark is the only thing on the view that moves.
//   THE ITEMS     in the middle, nearly the whole page: every fragrance —
//                 its number in three digits, its name, its house, the date
//                 it was written about — sortable, searched, and scrolling
//                 in their own box (the wheel scrolls it from anywhere on
//                 the view). Shown one of THREE WAYS:
//                   LIST    as the table was, a compact ruled row each;
//                   BOXES   small squares, many to a row;
//                   CARDS   larger, each with the fragrance's picture
//                           (fetched from the page the fragrances live
//                           on; the hatching and its number until the
//                           picture is there).
//                 An item opens its fragrance in the page
//                 (fragrance-reader.js), as the old table's rows did.
//   THE OPTIONS   on the right: List, Boxes, Cards. The choice is kept
//                 for the next visit, in this browser only.
//
// THE OLD VIEW IS KEPT, and nothing here changes it. Its table is still
// in the page, exactly as it was — this reads the fragrances from it and
// presses its links to open them — and a copy of the whole view stands in
// archive/fragrances-view-2026-09-24.html. This only lays the new one over
// it and hides it while it does (`.view.table-on`). Block this script and
// the page is the old view.
//
// COMING IN FROM THE HOUSES, views.js crosses the two views over and
// runs THE THREAD — the houses' axis — across to THE DIVIDER, the line
// this view stands between its aside and its table, the height of the
// window; where the divider stands is published as `data-divider` on the
// stage. `data-arrive="now"` says the crossing is the arrival: the view is
// there at once, whole. Opened any other way, it comes in by itself. The
// aside also carries a way back to the Houses (`data-view-go`). (Until the
// night of 2026-09-25 views.js stretched the axis into this view's rules,
// which this published as `data-rules`; the owner had the stretch taken
// out.)
// ============================================================
(function () {
  const view = document.querySelector('.view[data-view="fragrances"]');
  if (!view) return;
  const source = view.querySelector(".index-table tbody");
  if (!source) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const MODES = ["list", "boxes", "cards"];
  const KEEP = "taste-of-aldehydes:fragrances-view";
  const SWITCH_MS = 150;           // the items going out before a new layout
  const ASIDE_FIRST_MS = 380;      // the aside and the rule, before the items

  // THE MARK
  const MARK_SPECKS = 150;
  const MARK_TILT = 0.42;          // how far the ring is turned out of the page
  const MARK_BAND = 0.11;          // how wide the band of specks is
  const MARK_TURN = 0.018;         // turns a second
  const MARK_WEB_REACH = 24;
  const MARK_WEB_EACH = 2;

  let seed = 2509;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const three = (n) => String(n).padStart(3, "0");

  // ============================================================
  // THE FRAGRANCES, read off the old table
  // ============================================================
  const fragrances = [...source.querySelectorAll("tr")].map((row) => {
    const link = row.querySelector(".index-what a");
    const date = row.querySelector(".index-date");
    return {
      no: +row.dataset.no || 0,
      name: row.dataset.name || (link ? link.textContent.trim() : ""),
      house: row.dataset.house || "",
      date: row.dataset.date || "",
      shown: date ? date.textContent.trim() : "",
      link: link,
    };
  });

  // ============================================================
  // THE STAGE: the aside, the items, the options
  // ============================================================
  const stage = document.createElement("div");
  stage.className = "frag-stage is-list";
  const oldHead = view.querySelector(".index-col");
  stage.innerHTML =
    '<aside class="frag-aside">' +
      '<p class="frag-aside-name">Fragrances</p>' +
      '<p class="frag-aside-say"></p>' +
      '<p class="frag-aside-count"><span class="frag-aside-big"></span><span class="frag-aside-unit">written up</span></p>' +
      '<dl class="frag-readings">' +
        '<div><dt>Houses</dt><dd class="frag-read-houses"></dd></div>' +
        '<div><dt>Last written</dt><dd class="frag-read-last"></dd></div>' +
        '<div><dt>Sorted by</dt><dd class="frag-read-sort"></dd></div>' +
        '<div><dt>Shown as</dt><dd class="frag-read-mode"></dd></div>' +
      '</dl>' +
      '<div class="frag-scale" aria-hidden="true">' +
        '<span class="frag-scale-end frag-scale-first"></span>' +
        '<span class="frag-scale-rule"><span class="frag-scale-fill"></span></span>' +
        '<span class="frag-scale-end frag-scale-last"></span>' +
      '</div>' +
      '<canvas class="frag-mark" aria-hidden="true"></canvas>' +
      '<button class="frag-to-houses" type="button" data-view-go="houses"><span aria-hidden="true">←</span> The houses</button>' +
    '</aside>' +
    '<span class="frag-divider" aria-hidden="true"></span>' +
    '<div class="frag-main">' +
      '<div class="frag-list-head">' +
        '<label class="frag-list-search"><span class="frag-list-mark" aria-hidden="true"></span>' +
          '<input class="frag-list-field" type="search" placeholder="Search fragrances" aria-label="Search the fragrances"></label>' +
        '<span class="frag-list-count" aria-live="polite"></span>' +
      '</div>' +
      '<div class="frag-list-scroll" tabindex="0">' +
        '<div class="frag-sortbar" role="group" aria-label="Sort the fragrances">' +
          '<span class="frag-sort-say" aria-hidden="true">Sort</span>' +
          '<button class="frag-sort is-sorted" type="button" data-key="no">No.</button>' +
          '<button class="frag-sort" type="button" data-key="name">Fragrance</button>' +
          '<button class="frag-sort" type="button" data-key="house">House</button>' +
          '<button class="frag-sort" type="button" data-key="date">Date</button>' +
        '</div>' +
        '<ol class="frag-items" aria-label="Fragrances"></ol>' +
      '</div>' +
    '</div>' +
    '<div class="frag-options" role="group" aria-label="Show the fragrances as">' +
      '<p class="frag-options-say" aria-hidden="true">View</p>' +
      MODES.map((m) => {
        const word = m.charAt(0).toUpperCase() + m.slice(1);
        // Named on the button itself: on a phone the word under the icon
        // is not shown, and the button must still say what it is.
        return '<button class="frag-mode" type="button" data-mode="' + m + '" aria-label="' + word + '" aria-pressed="false">' +
          '<span class="frag-mode-icon frag-mode-' + m + '" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
          '<span class="frag-mode-word" aria-hidden="true">' + word + '</span>' +
        '</button>';
      }).join("") +
    '</div>';
  stage.querySelector(".frag-aside-say").textContent = oldHead ? oldHead.textContent.trim() : "";
  const aside = stage.querySelector(".frag-aside");
  const list = stage.querySelector(".frag-items");
  const scroller = stage.querySelector(".frag-list-scroll");
  const sortbar = stage.querySelector(".frag-sortbar");
  const search = stage.querySelector(".frag-list-field");
  const count = stage.querySelector(".frag-list-count");
  const scale = stage.querySelector(".frag-scale-rule");
  const fill = stage.querySelector(".frag-scale-fill");
  const mark = stage.querySelector(".frag-mark");
  const modeButtons = [...stage.querySelectorAll(".frag-mode")];

  fragrances.forEach((f) => {
    const li = document.createElement("li");
    li.className = "frag-item";
    li.innerHTML =
      '<span class="frag-t-pic" aria-hidden="true"><span class="frag-t-pic-no"></span></span>' +
      '<span class="frag-t-no"></span>' +
      '<span class="frag-t-name"><a></a></span>' +
      '<span class="frag-t-house"></span>' +
      '<span class="frag-t-date"></span>';
    li.querySelector(".frag-t-pic-no").textContent = three(f.no);
    li.querySelector(".frag-t-no").textContent = three(f.no);
    const a = li.querySelector("a");
    a.textContent = f.name;
    if (f.link) a.href = f.link.getAttribute("href");
    li.querySelector(".frag-t-house").textContent = f.house;
    li.querySelector(".frag-t-date").textContent = f.shown;
    // A press opens it in the page — by pressing the old table's own
    // link, so the reader opens it exactly as it always has. Anywhere on
    // the item will do; a press meant for a new tab keeps the real link.
    const open = (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
      event.preventDefault();
      if (f.link) f.link.click();
    };
    a.addEventListener("click", (event) => { event.stopPropagation(); open(event); });
    li.addEventListener("click", open);
    li.addEventListener("pointerenter", () => { lit = f; wake(); });
    li.addEventListener("pointerleave", () => { if (lit === f) { lit = null; wake(); } });
    f.item = li;
    f.pic = li.querySelector(".frag-t-pic");
    f.tick = document.createElement("span");
    f.tick.className = "frag-scale-tick";
    scale.appendChild(f.tick);
    list.appendChild(li);
  });
  view.insertBefore(stage, view.firstChild);
  view.classList.add("table-on");
  document.body.classList.add("frag-stage-on");

  // THE READINGS that do not change.
  const houses = new Set(fragrances.map((f) => f.house).filter(Boolean));
  const latest = fragrances.reduce((best, f) => (!best || f.date > best.date ? f : best), null);
  stage.querySelector(".frag-aside-big").textContent = three(fragrances.length);
  stage.querySelector(".frag-read-houses").textContent = three(houses.size);
  stage.querySelector(".frag-read-last").textContent = latest ? latest.shown : "—";

  // ============================================================
  // SORTING AND SEARCHING — the old board's two, over the same rows
  // ============================================================
  let sortKey = "no", sortWay = 1;
  const sortNames = { no: "No.", name: "Fragrance", house: "House", date: "Date" };
  let shown = fragrances.slice();
  function order() {
    const val = (f) => (sortKey === "no" ? f.no : String(f[sortKey] || "").toLowerCase());
    fragrances.slice().sort((a, b) => {
      const x = val(a), y = val(b);
      if (x === y) return a.no - b.no;
      // An empty one sorts to the end whichever way round.
      if (x === "") return 1;
      if (y === "") return -1;
      return (x < y ? -1 : 1) * sortWay;
    }).forEach((f) => list.appendChild(f.item));
    stage.querySelectorAll(".frag-sort").forEach((b) => {
      const on = b.dataset.key === sortKey;
      b.classList.toggle("is-sorted", on);
      b.classList.toggle("is-reversed", on && sortWay < 0);
      b.setAttribute("aria-pressed", String(on));
    });
    stage.querySelector(".frag-read-sort").textContent = sortNames[sortKey] + (sortWay > 0 ? " ↓" : " ↑");
    settle();
  }
  stage.querySelectorAll(".frag-sort").forEach((b) => b.addEventListener("click", () => {
    if (sortKey === b.dataset.key) sortWay = -sortWay;
    else { sortKey = b.dataset.key; sortWay = 1; }
    order();
  }));
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function filter() {
    const words = norm(search.value).split(/\s+/).filter(Boolean);
    let n = 0;
    fragrances.forEach((f) => {
      const text = norm([three(f.no), f.name, f.house, f.shown].join(" "));
      const hit = words.every((w) => text.includes(w));
      f.item.hidden = !hit;
      if (hit) n++;
    });
    count.textContent = three(n);
    settle();
  }
  search.addEventListener("input", filter);

  /** After anything that changes which items stand where: the order
      they come in, the scale's ticks, and the divider. */
  function settle() {
    shown = [...list.children].map((li) => fragrances.find((f) => f.item === li)).filter((f) => f && !f.item.hidden);
    shown.forEach((f, i) => f.item.style.setProperty("--i", String(Math.min(i, 16))));
    const n = shown.length;
    fragrances.forEach((f) => { f.tick.hidden = f.item.hidden; });
    shown.forEach((f, i) => { f.tick.style.top = (n > 1 ? (i / (n - 1)) * 100 : 50) + "%"; });
    stage.querySelector(".frag-scale-first").textContent = n ? three(shown[0].no) : "";
    stage.querySelector(".frag-scale-last").textContent = n ? three(shown[n - 1].no) : "";
    reading();
    measure();
    wake();
  }

  // ============================================================
  // THE THREE WAYS OF SHOWING THEM
  // ============================================================
  let mode = "list";
  try {
    const kept = window.localStorage.getItem(KEEP);
    if (MODES.includes(kept)) mode = kept;
  } catch (e) { /* no storage: the list it is */ }
  let switching = 0;
  function paint() {
    MODES.forEach((m) => stage.classList.toggle("is-" + m, m === mode));
    modeButtons.forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stage.querySelector(".frag-read-mode").textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    if (mode === "cards") pictures();
  }
  function setMode(next) {
    if (!MODES.includes(next) || next === mode) return;
    mode = next;
    try { window.localStorage.setItem(KEEP, mode); } catch (e) { /* kept for this visit only */ }
    if (REDUCE_MOTION) { paint(); settle(); return; }
    // The items go, the layout changes under them, and they come back in
    // one after another — rather than jumping from one shape to the next.
    const id = ++switching;
    stage.classList.add("switching");
    window.setTimeout(() => {
      if (id !== switching) return;
      paint();
      stage.classList.remove("rows-in");
      settle();
      void stage.offsetWidth;
      stage.classList.remove("switching");
      requestAnimationFrame(() => { if (id === switching) stage.classList.add("rows-in"); });
    }, SWITCH_MS);
  }
  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  // THE PICTURES, for the cards: taken off the page the fragrances live
  // on, the first time the cards are asked for, so the list never pays
  // for them. A picture that is not there yet leaves the hatching and the
  // number showing, which is what every house page does.
  let pictured = false;
  function pictures() {
    if (pictured) return;
    pictured = true;
    const first = fragrances.find((f) => f.link);
    if (!first || !window.fetch) return;
    const where = new URL(first.link.getAttribute("href"), location.href);
    where.hash = "";
    fetch(where.href).then((r) => (r.ok ? r.text() : Promise.reject(r.status))).then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      fragrances.forEach((f) => {
        if (!f.link) return;
        const id = new URL(f.link.getAttribute("href"), location.href).hash.slice(1);
        const part = id && doc.getElementById(id);
        if (!part) return;
        const shot = part.querySelector(".human-plate img") || part.querySelector("summary img");
        const src = shot && shot.getAttribute("src");
        if (!src) return;
        const img = document.createElement("img");
        img.alt = "";
        img.decoding = "async";
        img.addEventListener("load", () => f.pic.classList.add("has-picture"));
        img.addEventListener("error", () => img.remove());
        img.src = new URL(src, where).href;
        f.pic.appendChild(img);
      });
    }).catch(() => { /* the hatching stays */ });
  }

  // ============================================================
  // WHERE EVERYTHING STANDS
  // ============================================================
  let W = 0, H = 0;
  /** THE DIVIDER, where the thread from the houses' axis lands: halfway
      across the gap between the aside and the table, measured against the
      stage itself so the view travelling does not move it. None where the
      aside stands over the table rather than beside it (a phone). */
  const divider = stage.querySelector(".frag-divider");
  function measure() {
    if (view.hidden) return;
    W = window.innerWidth;
    H = window.innerHeight;
    const s = stage.getBoundingClientRect();
    const side = aside.getBoundingClientRect(), main = stage.querySelector(".frag-main").getBoundingClientRect();
    if (!main.width) return;
    if (side.width && side.right <= main.left + 1) {
      const x = Math.round((side.right + main.left) / 2 - s.left);
      stage.dataset.divider = String(x);
      divider.style.left = x + "px";
      divider.hidden = false;
    } else {
      delete stage.dataset.divider;
      divider.hidden = true;
    }
  }

  /** THE SCALE: filled as far as the box has been seen through, and the
      ticks of the items in view inked. */
  function reading() {
    const most = scroller.scrollHeight - scroller.clientHeight;
    const seen = most > 1 ? (scroller.scrollTop + scroller.clientHeight) / scroller.scrollHeight : 1;
    fill.style.transform = "scaleY(" + Math.max(0, Math.min(1, seen)).toFixed(4) + ")";
    const box = scroller.getBoundingClientRect();
    shown.forEach((f) => {
      const r = f.item.getBoundingClientRect();
      f.tick.classList.toggle("in-view", r.bottom > box.top + 8 && r.top < box.bottom - 8);
    });
  }

  // ============================================================
  // THE MARK — a ring of specks, one larger for every fragrance
  // ============================================================
  const ink = mark.getContext("2d");
  const INK = getComputedStyle(document.body).getPropertyValue("--ink-rgb").trim() || "23, 23, 15";
  const ring = [];
  for (let i = 0; i < MARK_SPECKS; i++) {
    ring.push({
      turn: random() * Math.PI * 2,
      out: 1 + (random() + random() - 1) * MARK_BAND,
      lift: (random() - 0.5) * MARK_BAND,
      size: random() < 0.22 ? 2 : 1,
      rate: 0.7 + random() * 0.6,
    });
  }
  let lit = null;
  let markWide = 0, markRatio = 1;
  function sizeMark() {
    const wide = Math.round(mark.getBoundingClientRect().width);
    if (!wide) { markWide = 0; return; }
    markRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
    markWide = wide;
    mark.width = Math.round(wide * markRatio);
    mark.height = Math.round(wide * markRatio);
  }
  function drawMark(clock) {
    if (!markWide || !ink) return;
    ink.setTransform(markRatio, 0, 0, markRatio, 0, 0);
    ink.clearRect(0, 0, markWide, markWide);
    const c = markWide / 2, r = markWide * 0.4;
    const spin = REDUCE_MOTION ? 0 : clock * MARK_TURN * Math.PI * 2;
    const seen = ring.map((s) => {
      const way = s.turn + spin * s.rate;
      return {
        x: c + Math.cos(way) * r * s.out,
        y: c + Math.sin(way) * r * s.out * MARK_TILT + s.lift * r,
        a: 0.2 + 0.28 * (0.5 + 0.5 * Math.sin(way)),
        size: s.size,
      };
    });
    ink.strokeStyle = "rgba(" + INK + ",0.11)";
    ink.lineWidth = 1;
    ink.beginPath();
    const carried = new Array(seen.length).fill(0);
    for (let i = 0; i < seen.length; i++) {
      if (carried[i] >= MARK_WEB_EACH) continue;
      for (let j = i + 1; j < seen.length; j++) {
        if (carried[i] >= MARK_WEB_EACH) break;
        if (carried[j] >= MARK_WEB_EACH) continue;
        if (Math.hypot(seen[i].x - seen[j].x, seen[i].y - seen[j].y) > MARK_WEB_REACH) continue;
        ink.moveTo(seen[i].x, seen[i].y);
        ink.lineTo(seen[j].x, seen[j].y);
        carried[i]++;
        carried[j]++;
      }
    }
    ink.stroke();
    seen.forEach((p) => {
      ink.fillStyle = "rgba(" + INK + "," + p.a.toFixed(3) + ")";
      ink.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
    // ONE FOR EVERY FRAGRANCE, evenly round the ring and turning with it,
    // in the order they are shown; the one pointed at stands out, boxed.
    const n = shown.length;
    shown.forEach((f, k) => {
      const at = k / Math.max(1, n) * Math.PI * 2 + spin;
      const x = c + Math.cos(at) * r, y = c + Math.sin(at) * r * MARK_TILT;
      const front = 0.5 + 0.5 * Math.sin(at);
      const on = f === lit;
      const size = on ? 4 : 3;
      ink.fillStyle = "rgba(" + INK + "," + (on ? 1 : 0.36 + 0.4 * front).toFixed(3) + ")";
      ink.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      if (on) {
        ink.strokeStyle = "rgba(" + INK + ",0.8)";
        ink.strokeRect(Math.round(x) - 5.5, Math.round(y) - 5.5, 11, 11);
        ink.strokeStyle = "rgba(" + INK + ",0.28)";
        ink.beginPath();
        ink.moveTo(c, c);
        ink.lineTo(x, y);
        ink.stroke();
      }
    });
    // A registration cross at its centre.
    ink.fillStyle = "rgba(" + INK + ",0.45)";
    ink.fillRect(c - 4, c - 0.5, 8, 1);
    ink.fillRect(c - 0.5, c - 4, 1, 8);
  }

  // ============================================================
  // RUNNING — only while the view is on the page, and only the mark
  // ============================================================
  let looping = false;
  const onPage = () => !view.hidden && !document.body.classList.contains("frag-open");
  const began = performance.now();
  function loop(now) {
    if (!onPage()) { looping = false; return; }
    drawMark((now - began) / 1000);
    if (REDUCE_MOTION) { looping = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() {
    if (looping) return;
    looping = true;
    requestAnimationFrame(loop);
  }

  // ============================================================
  // THE ARRIVAL: the aside and the sort bar's rule, then the items.
  // ============================================================
  let arrival = 0;
  function arrive(now) {
    sizeMark();
    measure();
    reading();
    const id = ++arrival;
    if (REDUCE_MOTION || now) {
      // THERE AT ONCE: the crossing is the arrival (or motion is off).
      stage.classList.add("instant", "here", "rows-in");
      requestAnimationFrame(() => requestAnimationFrame(() => { if (id === arrival) stage.classList.remove("instant"); }));
      wake();
      return;
    }
    stage.classList.remove("rows-in", "here");
    void stage.offsetWidth;
    stage.classList.add("here");
    window.setTimeout(() => { if (id === arrival) stage.classList.add("rows-in"); }, ASIDE_FIRST_MS);
    wake();
  }

  // What views.js asks for, on the view itself.
  let wasHidden = view.hidden;
  new MutationObserver(() => {
    if (view.dataset.arrive === "now") { delete view.dataset.arrive; if (!view.hidden) { arrive(true); wasHidden = false; } }
    else if (wasHidden && !view.hidden) arrive(false);
    if (!view.hidden) { sizeMark(); measure(); }
    wasHidden = view.hidden;
    if (onPage()) wake();
  }).observe(view, { attributes: true, attributeFilter: ["hidden", "data-arrive"] });
  // Back from the reader.
  new MutationObserver(() => { if (onPage()) { measure(); wake(); } }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // ============================================================
  // THE WHEEL SCROLLS THE ITEMS, from anywhere on the view
  // ============================================================
  stage.addEventListener("wheel", (e) => {
    if (scroller.contains(e.target)) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? scroller.clientHeight : 1;
    scroller.scrollTop += d * unit;
    e.preventDefault();
  }, { passive: false });
  scroller.addEventListener("scroll", () => { reading(); }, { passive: true });
  window.addEventListener("resize", () => { sizeMark(); measure(); reading(); wake(); });

  paint();
  order();
  filter();
  if (!view.hidden) arrive(false);
})();
