// ============================================================
// FAVORITES — the other half of a contact sheet page
//
// The page carries two ways of looking at one category, and the two
// buttons above switch between them:
//
//   Description portfolio   the map, drawn by contact-sheet.js
//   Favorites               this: the screen flickers once, a menu of
//                           chapters comes up on the right, and a
//                           field of marks settles along the foot
//                           that answers the cursor
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

  // The field of marks. Geometric rather than organic: a lattice on a
  // fixed pitch, every mark the same, and the only two things that are
  // not regular about it are the cursor and the chapter you have open.
  //
  // Fine and close-set rather than large and far apart: it is a ruled
  // ground for the writing to stand on, and the reading it carries is
  // its top edge, which a coarse lattice can only step through. Every
  // fifth mark across and down is the site's own hollow registration
  // square instead of a tick, so the grid counts itself the way a
  // drawing's does.
  const PITCH = 18;            // how far apart the marks stand
  const MARK = 1.7;            // and how big one is at rest
  const EVERY = 5;             // one mark in this many, each way, is a registration square
  const NODE_MARK = 2.6;       // which is drawn this much larger, and hollow
  const FIELD_DEEP = 0.44;     // how much of the page the field lies over at rest
  const REACH = 170;           // how far from the cursor a mark still answers
  const SHOVE = 13;            // how far it is pushed out of the lattice
  const SWELL = 3.2;           // and how much larger it is drawn
  const EASE = 0.14;           // how quickly a mark goes where it is going
  const FADE_IN = 0.55;        // the field is faintest at the top and strongest low

  // THE WRITING KEEPS ITS OWN ROOM. The field is a ground, and a ground
  // printed through the words on top of it is neither: the marks are
  // taken out of the room the two columns of writing actually occupy,
  // measured off the page, and fade out rather than stopping at a line.
  const CLEAR_PAD = 14;        // how far past the writing the room reaches
  const CLEAR_SOFT = 34;       // and how far outside that the field comes back

  // The reading. The open chapter stands one mound in the field for
  // each of its entries, and the field is lifted into them — so the
  // middle of the page carries what you have chosen rather than being
  // the empty space between the writing on either side of it.
  const MOUND_CLEAR = 26;      // how far clear of the writing the mounds keep
  const MOUND_ROOF = 0.14;     // and how near the top of the page one may reach
  const MOUND_UP = 0.38;       // how far one lifts the field, against the page
  const MOUND_WIDE = 0.78;     // how wide one is, against the room it is given
  const MOUND_HOT = 1.4;       // and how much further the one you point at goes

  const INK = "23,23,15";
  const BRASS = "156,111,53";

  const numbered = (i) => String(i + 1).padStart(2, "0");

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
      // How tall this one's mound stands: taken from the day in its
      // own date, so the skyline is a reading of what the chapter is
      // filed under rather than decoration, and so no two chapters
      // come out the same shape. Three mounds of one height is a
      // pattern, not a reading.
      tall: 0.5 + (Number(date.slice(0, 2)) || 16) / 31 * 0.65,
    });
  });

  // ============================================================
  // THE VIEW
  // ============================================================
  const view = document.createElement("div");
  view.className = "chapters";

  const field = document.createElement("canvas");
  field.className = "chapters-field";
  field.setAttribute("aria-hidden", "true");
  view.appendChild(field);

  // The chapter that is open, written large on the left, so the page
  // is not all menu.
  const plate = document.createElement("div");
  plate.className = "chapters-plate";
  // What is open, written large — and then set out underneath it the
  // way the rest of the site sets out a reading: a label, a rule, a
  // figure. It is the left-hand column of the page, so it has to
  // carry some weight of its own.
  plate.innerHTML =
    '<p class="chapters-kicker"></p><h2></h2>' +
    '<dl class="chapters-spec">' +
    '<div><dt>Entries</dt><dd class="chapters-count"></dd></div>' +
    '<div><dt>First</dt><dd class="chapters-first"></dd></div>' +
    '<div><dt>Last</dt><dd class="chapters-last"></dd></div>' +
    "</dl>";
  view.appendChild(plate);

  // --- the menu, on the right
  const menu = document.createElement("div");
  menu.className = "chapters-menu";
  view.appendChild(menu);

  const rail = document.createElement("div");
  rail.className = "chapters-rail";
  rail.setAttribute("role", "tablist");
  rail.setAttribute("aria-label", "Chapters");
  menu.appendChild(rail);

  chapters.forEach((chapter, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "chapters-tab";
    tab.setAttribute("role", "tab");
    tab.id = "chapter-tab-" + i;
    tab.setAttribute("aria-controls", "chapter-panel-" + i);
    tab.innerHTML =
      '<span class="chapters-reg" aria-hidden="true"></span>' +
      '<span class="chapters-name"></span>' +
      '<span class="chapters-count-small"></span>';
    tab.querySelector(".chapters-name").textContent = chapter.name;
    tab.querySelector(".chapters-count-small").textContent = String(chapter.items.length);
    rail.appendChild(tab);
    chapter.tab = tab;
  });

  const panels = document.createElement("div");
  panels.className = "chapters-panels";
  menu.appendChild(panels);

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
        '<span class="chapters-no" aria-hidden="true"></span>' +
        '<span class="chapters-date"></span>' +
        '<span class="chapters-item-name"></span>' +
        '<span class="chapters-go" aria-hidden="true">→</span>';
      link.querySelector(".chapters-no").textContent = numbered(n);
      link.querySelector(".chapters-date").textContent = item.date;
      link.querySelector(".chapters-item-name").textContent = item.name;
      // Pointing at one raises its own mound out of the field, so
      // every entry has somewhere on the page that is its.
      link.addEventListener("pointerenter", () => { hotItem = n; drawing = true; });
      link.addEventListener("pointerleave", () => { hotItem = -1; drawing = true; });
      link.addEventListener("focus", () => { hotItem = n; drawing = true; });
      link.addEventListener("blur", () => { hotItem = -1; drawing = true; });
      panel.appendChild(link);
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
  // These two belong to the field, further down, but they are declared
  // here because opening a chapter touches both and a chapter is
  // opened while the page is still being built. Left where the rest of
  // the field's state is, they do not exist yet at that moment and the
  // whole view falls over before it has drawn anything.
  let hotItem = -1;
  let drawing = true;
  // Same reason: opening a chapter changes the size of both columns of
  // writing, and the room they keep has to be read again afterwards.
  // It is asked for here and done by the next frame, rather than done
  // on the spot, because the browser has not laid the new chapter out
  // yet when this is set — and because at the moment the first chapter
  // is opened the field does not have a size at all.
  let remeasure = true;

  function show(next, andFocus) {
    open = (next + chapters.length) % chapters.length;
    chapters.forEach((chapter, i) => {
      const on = i === open;
      chapter.tab.classList.toggle("open", on);
      chapter.tab.setAttribute("aria-selected", on ? "true" : "false");
      // Only the open chapter's tab is in the tab order: the rail is
      // one control, and the arrow keys move within it.
      chapter.tab.tabIndex = on ? 0 : -1;
      chapter.panel.classList.toggle("open", on);
      chapter.panel.hidden = !on;
    });
    const chapter = chapters[open];
    const items = chapter.items;
    plate.querySelector(".chapters-kicker").textContent = "CHAPTER " + numbered(open);
    plate.querySelector("h2").textContent = chapter.name;
    plate.querySelector(".chapters-count").textContent = numbered(items.length - 1);
    plate.querySelector(".chapters-first").textContent = items.length ? items[0].date : "—";
    plate.querySelector(".chapters-last").textContent =
      items.length ? items[items.length - 1].date : "—";
    // The field carries the chapter you have open, so opening one is
    // the other half of what moves on this page.
    hotItem = -1;
    drawing = true;
    remeasure = true;
    if (andFocus) chapters[open].tab.focus();
  }

  chapters.forEach((chapter, i) => {
    chapter.tab.addEventListener("click", () => show(i));
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

  show(0);

  // ============================================================
  // THE FIELD
  //
  // A lattice of marks along the foot of the page. Everything about
  // it is regular — one pitch, one size, one colour — and only two
  // things disturb it:
  //
  //   THE CURSOR. Near it the marks are shoved out of the lattice and
  //   drawn larger, and they find their way back when it goes.
  //
  //   THE OPEN CHAPTER. Each of its entries stands a mound in the
  //   field, and the lattice is lifted into them — most at the top of
  //   the field and not at all along its foot, so the field's own top
  //   edge becomes the reading and its bottom stays put. Pointing at
  //   an entry raises the mound that is its.
  //
  // Regular on its own and irregular under the hand is the whole of
  // the effect; make the lattice itself uneven and there is nothing
  // left for either of them to disturb.
  // ============================================================
  let width = 0, height = 0, deep = 0;
  let midFrom = 0, midTo = 0, midUp = 1;
  let marks = [];
  let mounds = [];
  let taken = [];
  // What the reading comes to in each column of the lattice, emptied
  // and worked out afresh every frame: the mounds move, and the one
  // being pointed at moves most.
  let lifts = [];
  let heats = [];
  let handX = -9999, handY = -9999, hasHand = false;

  function lattice() {
    marks = [];
    const foot = height + PITCH;
    const across = Math.ceil(width / PITCH) + 1;
    // The lattice is laid over the whole page rather than only along
    // the foot: how much of it you can see is what the open chapter
    // changes, so it has to be there to be uncovered.
    const down = Math.ceil(height / PITCH) + 1;
    for (let j = 0; j < down; j++) {
      for (let i = 0; i < across; i++) {
        const x = i * PITCH + (j % 2 ? PITCH / 2 : 0);
        const y = foot - j * PITCH;
        marks.push({
          x: x, y: y, ox: x, oy: y, size: MARK, show: 0, warm: 0,
          // Counted from the foot, so the registration squares stand in
          // the same places however tall the window is.
          node: i % EVERY === 0 && j % EVERY === 0,
          // Which column of the lattice it stands in — two per step
          // across, since every other row is offset by half a pitch.
          // How high the reading stands depends only on that, so it is
          // worked out once a column a frame rather than once a mark.
          col: i * 2 + (j % 2),
        });
      }
    }
  }

  /** The room the writing takes up, read off the page. Anything the
      field would print through is measured rather than guessed at —
      the plate grows and shrinks with the chapter that is open, and
      the strip and its entries with the chapter's own length.

      It is the WRITING that is measured, not the blocks around it: on
      a narrow window the menu carries a deep skirt of padding under
      the last entry, and taking the menu's own box would knock the
      field out of the one piece of the page that is still clear. */
  function clearing() {
    const box = view.getBoundingClientRect();
    taken = [plate, rail, chapters[open].panel].map((one) => {
      const it = one.getBoundingClientRect();
      return {
        left: it.left - box.left - CLEAR_PAD,
        top: it.top - box.top - CLEAR_PAD,
        right: it.right - box.left + CLEAR_PAD,
        foot: it.bottom - box.top + CLEAR_PAD,
      };
    });
  }

  /** How much of the field belongs at this place: 1 out in the clear,
      0 where the writing is, and eased between the two so the field
      thins out towards the words rather than stopping at a line. */
  function roomAt(x, y) {
    let room = 1;
    for (let n = 0; n < taken.length; n++) {
      const box = taken[n];
      const dx = Math.max(box.left - x, 0, x - box.right);
      const dy = Math.max(box.top - y, 0, y - box.foot);
      const off = Math.sqrt(dx * dx + dy * dy);
      if (off >= CLEAR_SOFT) continue;
      const here = off / CLEAR_SOFT;
      if (here < room) room = here;
    }
    return room;
  }

  /** Where the open chapter's mounds stand, and how high.

      They are kept to the gap the writing actually leaves — measured
      between the plate and the menu rather than taken as a fraction of
      the width, because that fraction is right at one window size and
      wrong at every other: on a narrower screen the two columns close
      in and a mound that was in the clear is suddenly rising up behind
      the entries. Measured here once a layout, it cannot be. */
  function setMounds() {
    const items = chapters[open].items;
    const room = (midTo - midFrom) / items.length;
    const rest = height - deep;
    // They stand in the clear column between the two pieces of
    // writing, so the only ceiling any of them has is the top of the
    // page. Letting them under the plate instead meant every one of
    // them was cut off at the same height — which is a step across
    // the page, not a reading, and no two chapters could differ.
    const roof = height * MOUND_ROOF;
    mounds = items.map((item, n) => ({
      n: n,
      x: midFrom + room * (n + 0.5),
      wide: room * MOUND_WIDE + PITCH,
      high: Math.max(0, Math.min(height * MOUND_UP * midUp * item.tall, rest - roof)),
    }));
  }

  // How far the field is lifted at one place across the page, and
  // whether that place belongs to the entry being pointed at. Written
  // into these rather than returned, because it is asked once per mark
  // per frame and a fresh little object each time is a thousand of
  // them a second for nothing.
  let liftHere = 0, heatHere = 0;
  function liftAt(x) {
    liftHere = 0;
    heatHere = 0;
    for (let m = 0; m < mounds.length; m++) {
      const mound = mounds[m];
      const off = (x - mound.x) / mound.wide;
      if (off <= -1 || off >= 1) continue;
      // A cosine bump rather than a bell: it comes to nothing at a
      // definite place, so a mound has an edge and does not haze off
      // across the whole page.
      const bump = 0.5 * (1 + Math.cos(Math.PI * off));
      const hot = mound.n === hotItem;
      liftHere += bump * mound.high * (hot ? MOUND_HOT : 1);
      if (hot && bump > heatHere) heatHere = bump;
    }
  }

  function resize() {
    const box = view.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    deep = Math.round(height * FIELD_DEEP);

    // The room between the two columns of writing, read off the page
    // itself. On a narrow window they stack instead of standing side
    // by side, and then there is no gap between them — the mounds go
    // down the middle and are kept low, so the entries above them stay
    // readable.
    // The clear column between the two pieces of writing, read off the
    // page itself rather than taken as a fraction of the width: that
    // fraction is right at one window size and wrong at every other.
    // The stylesheet keeps the two columns narrow enough that there is
    // always a column of daylight between them to read this out of.
    const plateBox = plate.getBoundingClientRect();
    const menuBox = menu.getBoundingClientRect();
    const from = plateBox.right - box.left + MOUND_CLEAR;
    const to = menuBox.left - box.left - MOUND_CLEAR;
    if (to - from > PITCH * 4) {
      midFrom = from;
      midTo = to;
      midUp = 1;
    } else {
      // Stacked, on a narrow window: there is no clear column at all,
      // so they go down the middle and are kept low enough to read
      // the entries over them.
      midFrom = width * 0.12;
      midTo = width * 0.88;
      midUp = 0.4;
    }
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    field.style.width = width + "px";
    field.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    lattice();
    clearing();
    setMounds();
    drawing = true;
  }

  function settle() {
    let moving = false;
    const rest = height - deep;        // where the field lies with nothing open
    const edge = PITCH * 1.6;          // how softly it stops at the top
    const step = REDUCE_MOTION ? 1 : EASE;
    setMounds();

    lifts.length = 0;
    heats.length = 0;

    for (let n = 0; n < marks.length; n++) {
      const mark = marks[n];
      let wantX = mark.ox, wantY = mark.oy, wantSize = MARK;

      // The reading. The lattice itself never moves for it — what the
      // open chapter changes is how much of the lattice you can see,
      // so the field's top edge is the reading and everything under it
      // is simply field. Marks are not slid about by it, which leaves
      // being slid about to the cursor alone.
      // The reading is the same the whole way down a column of the
      // lattice, so it is worked out once a column rather than once a
      // mark: there are a couple of hundred columns on the page and
      // several thousand marks.
      if (lifts[mark.col] === undefined) {
        liftAt(mark.ox);
        lifts[mark.col] = liftHere;
        heats[mark.col] = heatHere;
      } else {
        liftHere = lifts[mark.col];
        heatHere = heats[mark.col];
      }
      const under = (mark.oy - (rest - liftHere)) / edge;
      const want = Math.max(0, Math.min(1, under));
      // How much of a mound this mark stands in. A mound is drawn
      // harder than the flat field around it: it is the reading, and
      // the flat field is only what the reading is drawn on.
      mark.rise = Math.min(1, liftHere / (height * MOUND_UP));
      const warm = heatHere * Math.max(0, Math.min(1, 1.6 - under * 0.5));

      if (hasHand) {
        const dx = mark.ox - handX, dy = mark.oy - handY;
        const off = Math.sqrt(dx * dx + dy * dy);
        if (off < REACH) {
          // Falls away smoothly to nothing at the edge of its reach,
          // so there is no ring where the effect stops.
          const near = 1 - off / REACH;
          const push = near * near * SHOVE;
          const away = off < 0.001 ? 0 : 1 / off;
          wantX += dx * away * push;
          wantY += dy * away * push;
          wantSize = MARK * (1 + near * near * (SWELL - 1));
        }
      }

      mark.x += (wantX - mark.x) * step;
      mark.y += (wantY - mark.y) * step;
      mark.size += (wantSize - mark.size) * step;
      mark.show += (want - mark.show) * step;
      mark.warm += (warm - mark.warm) * step;
      if (Math.abs(mark.x - wantX) > 0.05 ||
          Math.abs(mark.size - wantSize) > 0.01 ||
          Math.abs(mark.show - want) > 0.004 ||
          Math.abs(mark.warm - warm) > 0.004) {
        moving = true;
      }
      // Faintest high up the page and strongest low, wherever the top
      // edge happens to be at the time.
      mark.fade = Math.max(0, Math.min(1, (mark.oy - height * 0.2) / (height * 0.8)));
    }
    return moving;
  }

  function draw() {
    paint.clearRect(0, 0, width, height);
    paint.lineWidth = 1;
    for (let n = 0; n < marks.length; n++) {
      const mark = marks[n];
      if (mark.show < 0.01) continue;
      // Where the writing stands, the field is not drawn at all. Read
      // off where the mark actually IS rather than where the lattice
      // put it, so one shoved towards the words by the cursor is taken
      // out too.
      const room = roomAt(mark.x, mark.y);
      if (room <= 0.01) continue;
      const lit = Math.min(1, (mark.size - MARK) / (MARK * (SWELL - 1)));
      // Brass for what the hand is doing, and for the mound belonging
      // to the entry it is pointing at; ink for the reading itself,
      // which is the page's own and not something being done to it.
      const ink = lit > 0.08 || mark.warm > 0.5 ? BRASS : INK;
      // The top edge of the field is the reading, so the marks along
      // it are drawn a little harder than the ones under it: a skyline
      // that fades out is a skyline you have to look for.
      const crest = mark.show * (1 - mark.show) * 4;
      const alpha =
        ((0.1 + mark.fade * 0.26 + (mark.rise || 0) * 0.16 +
          lit * 0.5 + mark.warm * 0.3) * mark.show +
         crest * 0.14) * room;
      const tone = "rgba(" + ink + "," + alpha.toFixed(3) + ")";
      // Squares, not dots: the same shape every other mark on the site
      // is made of — and every fifth one each way is the hollow
      // registration square the site marks a point with, so the grid
      // counts itself rather than being an even wash of ticks.
      const size = mark.size * (1 + mark.warm * 0.35);
      if (mark.node) {
        const wide = size * NODE_MARK;
        paint.strokeStyle = tone;
        paint.strokeRect(
          Math.round(mark.x - wide / 2) + 0.5, Math.round(mark.y - wide / 2) + 0.5,
          Math.round(wide), Math.round(wide)
        );
      } else {
        paint.fillStyle = tone;
        const half = size / 2;
        paint.fillRect(mark.x - half, mark.y - half, size, size);
      }
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    if (remeasure && width) {
      remeasure = false;
      clearing();
      drawing = true;
    }
    const moving = settle();
    if (moving || drawing) {
      draw();
      drawing = moving;
    }
  }

  view.addEventListener("pointermove", (e) => {
    const box = view.getBoundingClientRect();
    handX = e.clientX - box.left;
    handY = e.clientY - box.top;
    hasHand = true;
    drawing = true;
  });
  view.addEventListener("pointerleave", () => { hasHand = false; drawing = true; });

  // ============================================================
  // ARRIVING AND LEAVING
  //
  // The first time Favorites is opened the screen takes a moment to
  // come up: it flickers once, the way a panel does when it is
  // switched on, and only then does the menu arrive. After that it is
  // simply there — the flicker is the thing being turned on, and it is
  // only turned on once.
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
