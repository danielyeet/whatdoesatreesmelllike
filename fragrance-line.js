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
  // ITS NAME: "Individual" over "Fragrances", smaller — the owner's, the
  // night of 2026-09-25, when the line under it ("The ones with no house
  // here", read off the old view's head) was taken off. The old view
  // underneath keeps its own head as it was.
  stage.innerHTML =
    '<aside class="frag-aside">' +
      '<p class="frag-aside-kicker">Individual</p>' +
      '<p class="frag-aside-name">Fragrances</p>' +
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
    if (mode === "cards" || mode === "boxes") pictures();
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

  // THE PICTURES, for the cards and the boxes: taken off the page the
  // fragrances live on, the first time either is asked for, so the list
  // never pays for them. A picture that is not there yet leaves the
  // hatching and the number showing, which is what every house page does.
  //
  // EACH FILLS ITS FRAME, AND IS PLACED ON THE BOTTLE (2026-09-26, later):
  // "i dont want any background to be visible, just make the image itself
  // fit into the box. Ideally make the fragrance fit, but with stuff like
  // flamenco or haxan, no need. The point is simply for the fragrance to
  // be visible." So nothing stands behind a picture — the blurred copy it
  // stood on for a round is gone — and the picture covers its frame edge
  // to edge. Where the bottle is in it is read off the picture itself
  // (`readPicture`), and the picture is moved so the bottle stands in the
  // middle of the frame and, where it is small in a large ground, brought
  // closer until it fills most of the frame (`placeIn`). A scene — a
  // bottle in bark, on a bank of flowers — is simply filled and centred:
  // its bottle is where the photographer put it.
  const FILL = 0.8;         // the bottle's larger side, as a share of the frame's
  const CLOSEST = 2.4;      // and never more than this much past just covering it
  const SHAPES = { b: 1, c: 4 / 5 };   // the boxes' pictures are square, the cards' upright

  /** WHAT A PICTURE IS, read off a small copy of it: any BORDER printed
      into it (`inner`, the share of each side that is a strip of plain
      white or black), WHERE ITS BOTTLE IS (`bottle`: its extent { x0, y0,
      x1, y1 } and its weight's middle { cx, cy }, as fractions of the
      whole picture), and, where its ground is clean enough to be carried
      on past its edges, THAT COLOUR (`clean`). A bottle is only looked
      for ON A PLAIN GROUND, where the picture's own edge is nearly all
      one colour (a bottle on white, on black): there it is what is not
      that colour. A scene has none, and is centred. */
  function readPicture(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return null;
    const S = 72;
    const cw = w >= h ? S : Math.max(12, Math.round(S * w / h));
    const ch = w >= h ? Math.max(12, Math.round(S * h / w)) : S;
    let d;
    try {
      const c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, cw, ch);
      d = g.getImageData(0, 0, cw, ch).data;
    } catch (e) { return null; }
    const at = (x, y) => (y * cw + x) * 4;
    const lum = (i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;

    // ITS GROUND: the middle colour of its own edge — or, once any
    // border is off, of what is left's.
    let L = 0, R = 0, T = 0, B = 0;
    const edgeOf = () => {
      const e = [];
      for (let x = L; x < cw - R; x++) e.push(at(x, T), at(x, ch - 1 - B));
      for (let y = T + 1; y < ch - 1 - B; y++) e.push(at(L, y), at(cw - 1 - R, y));
      return e;
    };
    const groundOf = (e) => [0, 1, 2].map((k) => {
      const v = e.map((i) => d[i + k]).sort((a, b) => a - b);
      return v[v.length >> 1];
    });
    let edge = edgeOf();
    let ground = groundOf(edge);
    const off = (i) => Math.max(Math.abs(d[i] - ground[0]), Math.abs(d[i + 1] - ground[1]), Math.abs(d[i + 2] - ground[2]));
    // A CLEAN GROUND — pure white, pure black, nearly every speck of its
    // edge the same — can be carried on past the picture's own edges
    // without a seam, so a bottle on one may be drawn back to fit.
    const clean = edge.filter((i) => off(i) < 9).length / edge.length > 0.92;
    if (!clean) {
      // A BORDER — a strip of pure white or black printed down an edge of
      // the picture itself, a mat round a photograph whose own ground is
      // another colour — is not the picture, and is trimmed off, with one
      // speck more since a small copy blurs its edge. (Velvet Fog carries
      // one down each side: 255 against its own 245.)
      const plainLine = (count, pick) => {
        let white = 0, black = 0;
        for (let n = 0; n < count; n++) {
          const l = lum(pick(n));
          if (l > 251) white++; else if (l < 5) black++;
        }
        return white >= count * 0.95 || black >= count * 0.95;
      };
      const most = (n) => Math.floor(n * 0.15);
      while (L < most(cw) && plainLine(ch, (n) => at(L, n))) L++;
      while (R < most(cw) && plainLine(ch, (n) => at(cw - 1 - R, n))) R++;
      while (T < most(ch) && plainLine(cw, (n) => at(n, T))) T++;
      while (B < most(ch) && plainLine(cw, (n) => at(n, ch - 1 - B))) B++;
      if (L) L++; if (R) R++; if (T) T++; if (B) B++;
      edge = edgeOf();
      ground = groundOf(edge);
    }
    const inner = { l: L / cw, r: R / cw, t: T / ch, b: B / ch };
    // A SCENE — no one ground — has no bottle found in it: it is left
    // where the photographer put it, which is near the middle.
    if (edge.filter((i) => off(i) < 24).length / edge.length <= 0.7) {
      return { inner: inner, bottle: null, clean: "" };
    }
    // Its EXTENT is every speck that is not the ground — faint glass too,
    // on a clean one. The MIDDLE OF ITS WEIGHT is weighed by the square
    // of how far each speck is from the ground, so a black cap or amber
    // glass counts for far more than a pale stand under the bottle.
    const faint = clean ? 14 : 34;
    const cols = new Float64Array(cw), rows = new Float64Array(ch);
    const colW = new Float64Array(cw), rowW = new Float64Array(ch);
    for (let y = T; y < ch - B; y++) for (let x = L; x < cw - R; x++) {
      const o = off(at(x, y));
      if (o > faint) { cols[x]++; rows[y]++; }
      if (o > 34) { colW[x] += o * o; rowW[y] += o * o; }
    }
    const span = (arr, weight) => {
      const total = arr.reduce((a, b) => a + b, 0);
      const heavy = weight.reduce((a, b) => a + b, 0);
      if (!total) return null;
      let a = 0, b = arr.length - 1, run = 0, mid = 0;
      weight.forEach((v, i) => { mid += v * (i + 0.5); });
      while (a < b && run + arr[a] <= total * 0.01) run += arr[a++];
      run = 0;
      while (b > a && run + arr[b] <= total * 0.01) run += arr[b--];
      return [a / arr.length, (b + 1) / arr.length, heavy ? mid / heavy / arr.length : (a + b + 1) / 2 / arr.length];
    };
    const sx = span(cols, colW), sy = span(rows, rowW);
    return {
      inner: inner,
      bottle: sx && sy ? { x0: sx[0], x1: sx[1], y0: sy[0], y1: sy[1], cx: sx[2], cy: sy[2] } : null,
      clean: clean ? "rgb(" + ground.join(", ") + ")" : "",
    };
  }

  /** WHERE A PICTURE STANDS IN A FRAME of the given shape (width over
      height), as percentages of the frame: just covering it, brought
      closer until its bottle fills `fill` of it where there is room to
      (never more than `closest` times closer), then moved so the bottle
      is in the middle. On a CLEAN ground it may also be drawn back until
      the whole bottle fits — never further than the whole picture — the
      frame taking the ground's own colour, so no edge shows. */
  function placeIn(read, ratio, shape, fill, closest) {
    // The picture inside any border it carries, and its bottle in it.
    const inr = read ? read.inner : { l: 0, t: 0, r: 0, b: 0 };
    const iw = 1 - inr.l - inr.r, ih = 1 - inr.t - inr.b;
    const own = ratio * iw / ih;
    const b = read && read.bottle;
    const sub = b ? {
      x0: (b.x0 - inr.l) / iw, x1: (b.x1 - inr.l) / iw, cx: (b.cx - inr.l) / iw,
      y0: (b.y0 - inr.t) / ih, y1: (b.y1 - inr.t) / ih, cy: (b.cy - inr.t) / ih,
    } : null;
    const cover = Math.max(1, own / shape);    // just covering the frame
    const whole = Math.min(1, own / shape);    // the whole picture in it
    let k = cover;                   // its width, in frame widths
    if (sub) {
      const sw = Math.max(0.02, sub.x1 - sub.x0), sh = Math.max(0.02, sub.y1 - sub.y0);
      const fit = Math.min(fill / sw, fill * own / (shape * sh));
      k = Math.min(Math.max(read.clean ? whole : cover, fit), cover * closest);
    }
    const tall = k * shape / own;    // its height, in frame heights
    // The middle of the whole bottle where all of it fits; where it does
    // not, the middle of its weight, so the cap and the glass stay in.
    let cx = 0.5, cy = 0.5;
    if (sub) {
      cx = (sub.x1 - sub.x0) * k <= 1 ? (sub.x0 + sub.x1) / 2 : sub.cx;
      cy = (sub.y1 - sub.y0) * tall <= 1 ? (sub.y0 + sub.y1) / 2 : sub.cy;
    }
    // Where the picture covers the frame it may not leave an edge inside
    // it; where it is drawn back on a clean ground, that ground fills the
    // rest and the bottle is simply put in the middle.
    const at = (size, c) => {
      const want = 0.5 - c * size;
      return size >= 1 ? Math.min(0, Math.max(1 - size, want)) : want;
    };
    const x = at(k, cx), y = at(tall, cy);
    // Back to the whole picture, its border running off the frame.
    const W = k / iw, H = tall / ih;
    const pc = (v) => (v * 100).toFixed(3) + "%";
    return { w: pc(W), h: pc(H), x: pc(x - inr.l * W), y: pc(y - inr.t * H) };
  }

  /** The picture, placed for both the boxes and the cards at once, so a
      change of layout needs nothing done: the stylesheet takes whichever
      it is showing (`--b-*`, `--c-*`). The bottle found is left on the
      frame (`data-subject`) for anyone who wants to check it. */
  function seat(pic, shot) {
    const ratio = shot.naturalWidth / shot.naturalHeight;
    if (!ratio) return;
    const read = readPicture(shot);
    Object.keys(SHAPES).forEach((key) => {
      const p = placeIn(read, ratio, SHAPES[key], FILL, CLOSEST);
      pic.style.setProperty("--" + key + "-w", p.w);
      pic.style.setProperty("--" + key + "-h", p.h);
      pic.style.setProperty("--" + key + "-x", p.x);
      pic.style.setProperty("--" + key + "-y", p.y);
    });
    const sub = read && read.bottle;
    if (sub) pic.dataset.subject = [sub.x0, sub.y0, sub.x1, sub.y1].map((v) => v.toFixed(3)).join(" ");
    if (read && read.clean) pic.style.backgroundColor = read.clean;
    pic.classList.add("is-placed");
  }

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
        img.className = "frag-t-shot";
        img.alt = "";
        img.decoding = "async";
        img.addEventListener("load", () => { f.pic.classList.add("has-picture"); seat(f.pic, img); });
        img.addEventListener("error", () => { img.remove(); });
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
