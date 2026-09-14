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

  // The field of marks along the foot. Geometric rather than organic:
  // a lattice on a fixed pitch, every mark the same, and what the
  // cursor does to it is the only thing that is not regular.
  const PITCH = 30;            // how far apart the marks stand
  const MARK = 3.4;            // and how big one is at rest
  const FIELD_DEEP = 0.46;     // how much of the page's height the field takes
  const REACH = 190;           // how far from the cursor a mark still answers
  const SHOVE = 16;            // how far it is pushed out of the lattice
  const SWELL = 2.6;           // and how much larger it is drawn
  const EASE = 0.14;           // how quickly a mark goes where it is going
  const FADE_IN = 0.55;        // the field is faintest at the top and strongest low

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
    chapter.items.push({
      name: entry.textContent.trim(),
      date: (entry.dataset.date || "").trim(),
      href: entry.getAttribute("href"),
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
  plate.innerHTML = '<p class="chapters-kicker"></p><h2></h2><p class="chapters-count"></p>';
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
    chapter.items.forEach((item) => {
      const link = document.createElement("a");
      link.className = "chapters-item";
      link.href = item.href;
      // The date stands where the rest of the site would put a number:
      // it is what one favourite is filed under, and the only thing
      // said about it other than its name.
      link.innerHTML =
        '<span class="chapters-date"></span>' +
        '<span class="chapters-item-name"></span>' +
        '<span class="chapters-go" aria-hidden="true">→</span>';
      link.querySelector(".chapters-date").textContent = item.date;
      link.querySelector(".chapters-item-name").textContent = item.name;
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
    plate.querySelector(".chapters-kicker").textContent =
      "CHAPTER " + numbered(open) + "  ·  " + chapter.items.length +
      (chapter.items.length === 1 ? " ENTRY" : " ENTRIES");
    plate.querySelector("h2").textContent = chapter.name;
    plate.querySelector(".chapters-count").textContent =
      chapter.items.length ? chapter.items[0].date + " — " +
        chapter.items[chapter.items.length - 1].date : "";
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
  // it is regular — one pitch, one size, one colour — and the cursor
  // is the only thing that is not: near it the marks are shoved out
  // of the lattice and drawn larger, and they find their way back
  // when it goes. Regular on its own and irregular under the hand is
  // the whole of the effect; make the lattice itself uneven and there
  // is nothing left for the cursor to disturb.
  // ============================================================
  let width = 0, height = 0, deep = 0;
  let marks = [];
  let handX = -9999, handY = -9999, hasHand = false;
  let drawing = true;

  function lattice() {
    marks = [];
    const top = height - deep;
    const across = Math.ceil(width / PITCH) + 1;
    const down = Math.ceil(deep / PITCH) + 1;
    for (let j = 0; j < down; j++) {
      for (let i = 0; i < across; i++) {
        const x = i * PITCH + (j % 2 ? PITCH / 2 : 0);
        const y = top + j * PITCH;
        marks.push({ x: x, y: y, ox: x, oy: y, size: MARK, wantSize: MARK });
      }
    }
  }

  function resize() {
    const box = view.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    deep = Math.round(height * FIELD_DEEP);
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    field.style.width = width + "px";
    field.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    lattice();
    drawing = true;
  }

  function settle() {
    let moving = false;
    const top = height - deep;
    for (let n = 0; n < marks.length; n++) {
      const mark = marks[n];
      let wantX = mark.ox, wantY = mark.oy, wantSize = MARK;
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
      const step = REDUCE_MOTION ? 1 : EASE;
      mark.x += (wantX - mark.x) * step;
      mark.y += (wantY - mark.y) * step;
      mark.size += (wantSize - mark.size) * step;
      if (Math.abs(mark.x - wantX) > 0.05 || Math.abs(mark.size - wantSize) > 0.01) {
        moving = true;
      }
      mark.fade = Math.min(1, (mark.oy - top) / deep + FADE_IN * 0.5);
    }
    return moving;
  }

  function draw() {
    paint.clearRect(0, 0, width, height);
    for (let n = 0; n < marks.length; n++) {
      const mark = marks[n];
      const lit = Math.min(1, (mark.size - MARK) / (MARK * (SWELL - 1)));
      const ink = lit > 0.08 ? BRASS : INK;
      paint.fillStyle =
        "rgba(" + ink + "," + (0.1 + mark.fade * 0.26 + lit * 0.5).toFixed(3) + ")";
      // Squares, not dots: the same shape every other mark on the site
      // is made of.
      const half = mark.size / 2;
      paint.fillRect(mark.x - half, mark.y - half, mark.size, mark.size);
    }
  }

  function tick() {
    requestAnimationFrame(tick);
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
