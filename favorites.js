// ============================================================
// FAVORITES — the other half of a contact sheet page
//
// The page carries two ways of looking at one category, and the two
// buttons above switch between them:
//
//   Description portfolio   the map, drawn by contact-sheet.js
//   Favorites               this: the screen flickers once, a menu of
//                           chapters comes up on the right, and a
//                           ruled field settles behind it that lies
//                           whichever way the chapter you are pointing
//                           at is filed
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

  // THE FIELD. A ruled ground of fine strokes — an engraver's hatch,
  // not a scatter of dots. Every stroke is the same length and the same
  // weight and they stand on a fixed pitch: what the field says is
  // which WAY it lies, and turning is the whole of what it does.
  const PITCH = 21;            // how far apart the strokes stand
  const STROKE = 12;           // and how long one is at rest
  const EASE = 0.16;           // how quickly a stroke goes where it is going
  const FIELD_TOP = 0.16;      // the ground starts this far down the page
  const BANDS = 6;             // how many weights the strokes are grouped into to draw
  const ALPHA_TOP = 0.62;      // and the heaviest a stroke is drawn

  // The reading: each chapter lies at its own angle, taken from the
  // dates its favourites are filed under, and is drawn at its own
  // weight, taken from how far apart those dates are. The angles are
  // spread across the whole sweep so that no two chapters can come out
  // reading the same — which is the one thing the reading must not do.
  const ANGLE_SPAN = 1.15;     // how far either side of flat a chapter may lie, in radians
  const WEIGHT_SPAN = 0.45;    // and how much longer the loosest chapter's strokes are

  // Pointing at a chapter sends its angle across the page as a wave.
  const SWEEP_SPEED = 2600;    // how fast the front crosses, pixels a second
  const SWEEP_WIDE = 230;      // how wide the front is
  const LEAD = 2.1;            // and how much longer a stroke is drawn inside it

  // Pointing at a favourite knots the field about that entry's own place.
  const KNOT_REACH = 210;      // how far from it the strokes still turn
  const KNOT_LIFT = 1.5;       // and how much longer they are drawn there

  // And the hand: the strokes near the cursor turn to face it.
  const HAND_REACH = 150;
  const HAND_LIFT = 1.9;

  // THE WRITING KEEPS ITS OWN ROOM. The field is a ground, and a ground
  // printed through the words on top of it is neither: the strokes are
  // taken out of the room the writing actually occupies, measured off
  // the page, and fade out rather than stopping at a line.
  const CLEAR_PAD = 14;        // how far past the writing the room reaches
  const CLEAR_SOFT = 34;       // and how far outside that the field comes back

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
      day: Number(date.slice(0, 2)) || 16,
    });
  });

  // WHICH WAY EACH CHAPTER LIES. The chapters are put in the order of
  // the dates their favourites are filed under — earliest in the month
  // first — and laid across the whole sweep in that order, so the
  // angle says where a chapter stands among the others. The weight is
  // a reading of how far apart its own dates are, so a chapter filed
  // across a month is drawn looser than one filed inside a week.
  //
  // Spread by ORDER rather than by the dates themselves, because the
  // dates themselves do not spread: three chapters filed within a
  // fortnight of each other would all lie within a few degrees, and a
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
      chapter.angle = -ANGLE_SPAN + 2 * ANGLE_SPAN * (place / last);
      chapter.weight = 1 + chapter.spread * WEIGHT_SPAN;
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
  // And the same again for the field's own reading: opening a chapter
  // lays the field at that chapter's angle, so every piece of state
  // that says which way it lies has to exist by the time the first one
  // is opened, which is while the page is still being built.
  let width = 0, height = 0;
  let lie = 0;        // which way the field lies now
  let sweep = null;   // and the wave carrying it to a new angle, if one is running
  let weight = 1;     // how long this chapter's strokes are drawn

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
    // the other half of what moves on this page: its angle goes out
    // across the page from the tab that was pressed.
    hotItem = -1;
    drawing = true;
    remeasure = true;
    weight = chapter.weight;
    if (width) layAt(chapter.angle, chapter.tab);
    else lie = chapter.angle;
    if (andFocus) chapters[open].tab.focus();
  }

  chapters.forEach((chapter, i) => {
    chapter.tab.addEventListener("click", () => show(i));
    // Pointing at a chapter lays the field at ITS angle without opening
    // it — the reading arrives as a wave out of the tab under your
    // hand, and goes back to the open chapter's when you take it away.
    // Tabbing along the strip does the same, so it is not only a
    // pointer that can see it.
    const show_ = () => { weight = chapter.weight; layAt(chapter.angle, chapter.tab); };
    const back = () => {
      weight = chapters[open].weight;
      layAt(chapters[open].angle, chapters[open].tab);
    };
    chapter.tab.addEventListener("pointerenter", show_);
    chapter.tab.addEventListener("focus", show_);
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

  show(0);

  // ============================================================
  // THE FIELD
  //
  // A ruled ground of fine strokes — an engraver's hatch rather than a
  // scatter of dots. Every stroke is the same length and the same
  // weight, and they stand on a fixed pitch; what the field says is
  // which WAY it lies.
  //
  //   THE OPEN CHAPTER lays the whole field at its own angle, read off
  //   the dates its favourites are filed under, and draws it at its
  //   own weight, read off how far apart those dates are.
  //
  //   POINTING AT A CHAPTER sends that chapter's angle across the page
  //   as a WAVE, out from the tab under the pointer: the grain turns as
  //   the front goes by, and the strokes caught in the front are drawn
  //   longer and in brass, so the reading is something you watch
  //   arrive. Take the pointer off and the open chapter's angle comes
  //   back the same way. This is the view's whole reactivity and it is
  //   meant to be unmissable.
  //
  //   POINTING AT A FAVOURITE knots the field about that entry's own
  //   place on the page: the strokes near it turn to circle it.
  //
  //   THE CURSOR turns the strokes near it to face the hand.
  //
  // Make the hatch itself uneven and there is nothing left for any of
  // those to disturb. And nothing is ever drawn where the writing
  // stands — see `clearing()` below.
  // ============================================================
  let strokes = [];
  let taken = [];
  let knots = [];
  let handX = -9999, handY = -9999, hasHand = false;

  function hatch() {
    strokes = [];
    const across = Math.ceil(width / PITCH) + 2;
    const down = Math.ceil(height / PITCH) + 2;
    for (let j = 0; j < down; j++) {
      for (let i = 0; i < across; i++) {
        const x = i * PITCH + (j % 2 ? PITCH / 2 : 0);
        const y = j * PITCH;
        strokes.push({
          x: x, y: y,
          a: lie, len: STROKE, warm: 0,
          // Faint at the top of the page and stronger low down, so the
          // writing at the top is standing on clear paper and the
          // ground gathers under it.
          fade: Math.max(0, Math.min(1, (y - height * FIELD_TOP) / (height * 0.55))),
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
      field out of the one piece of the page that is still clear.

      The same pass works out where each favourite's KNOT stands: in
      the clear column between the two columns of writing, at the
      height of its own row, so the field answers beside the entry you
      are pointing at rather than somewhere unrelated to it. */
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

    const plateBox = plate.getBoundingClientRect();
    const menuBox = menu.getBoundingClientRect();
    const from = plateBox.right - box.left;
    const to = menuBox.left - box.left;
    // On a narrow window the two columns are stacked and there is no
    // clear column between them; the knots go down the middle instead.
    const wide = to - from > KNOT_REACH;
    const mid = wide ? (from + to) / 2 : width * 0.5;
    knots = [...chapters[open].panel.querySelectorAll(".chapters-item")].map((row) => {
      const it = row.getBoundingClientRect();
      return { x: mid, y: (it.top + it.bottom) / 2 - box.top };
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

  /** Send the field to an angle, as a wave out from a place on the
      page. Everything that changes the reading goes through here: a
      chapter opened, a chapter pointed at, a pointer taken away. */
  function layAt(angle, fromEl) {
    if (Math.abs(angle - (sweep ? sweep.to : lie)) < 0.004) return;
    let x = width / 2, y = height / 2;
    if (fromEl) {
      const box = view.getBoundingClientRect();
      const it = fromEl.getBoundingClientRect();
      x = (it.left + it.right) / 2 - box.left;
      y = (it.top + it.bottom) / 2 - box.top;
    }
    // Carrying on from wherever the last wave had got to, so pointing
    // quickly along the strip reads as one field being turned rather
    // than as several fields fighting.
    sweep = { x: x, y: y, r: 0, from: sweep ? sweep.to : lie, to: angle };
    drawing = true;
  }

  function resize() {
    const box = view.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    field.style.width = width + "px";
    field.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    hatch();
    clearing();
    drawing = true;
  }

  /** Where one stroke wants to be pointing, how long it wants to be
      drawn, and how warm — written into these rather than returned,
      because it is asked thousands of times a frame. */
  let wantA = 0, wantLen = 0, wantWarm = 0;
  function wantedAt(x, y) {
    wantA = lie;
    wantLen = STROKE * weight;
    wantWarm = 0;

    // The wave. Behind its front the field has already been turned;
    // ahead of it, it has not been reached yet.
    if (sweep) {
      const off = Math.hypot(x - sweep.x, y - sweep.y);
      const past = (sweep.r - off) / SWEEP_WIDE;
      const turned = Math.max(0, Math.min(1, past));
      wantA = sweep.from + (sweep.to - sweep.from) * turned;
      // In the front itself: drawn longer and in brass, so the reading
      // is visibly travelling rather than simply being different now.
      const infront = Math.max(0, 1 - Math.abs(past - 0.5) * 2.2);
      wantLen *= 1 + infront * (LEAD - 1);
      wantWarm = infront;
    }

    // A favourite being pointed at: the field circles its own place.
    if (hotItem >= 0 && knots[hotItem]) {
      const knot = knots[hotItem];
      const dx = x - knot.x, dy = y - knot.y;
      const off = Math.hypot(dx, dy);
      if (off < KNOT_REACH) {
        const hold = 1 - off / KNOT_REACH;
        const round = Math.atan2(dy, dx) + Math.PI / 2;
        wantA = turnTo(wantA, round, hold * hold);
        wantLen *= 1 + hold * (KNOT_LIFT - 1);
        wantWarm = Math.max(wantWarm, hold);
      }
    }

    // And the hand: the strokes near it face it.
    if (hasHand) {
      const dx = x - handX, dy = y - handY;
      const off = Math.hypot(dx, dy);
      if (off < HAND_REACH) {
        const hold = 1 - off / HAND_REACH;
        wantA = turnTo(wantA, Math.atan2(dy, dx), hold * hold);
        wantLen *= 1 + hold * (HAND_LIFT - 1);
        wantWarm = Math.max(wantWarm, hold * 0.8);
      }
    }
  }

  /** Blending one direction into another the short way round. A stroke
      is a line, not an arrow: half a turn is no turn at all, so the two
      are compared modulo half a circle or a stroke lying at 89 degrees
      would swing the long way round to reach -89. */
  function turnTo(from, to, by) {
    let step = (to - from) % Math.PI;
    if (step > Math.PI / 2) step -= Math.PI;
    if (step < -Math.PI / 2) step += Math.PI;
    return from + step * by;
  }

  function settle() {
    let moving = false;
    const step = REDUCE_MOTION ? 1 : EASE;

    if (sweep) {
      if (REDUCE_MOTION) {
        lie = sweep.to;
        sweep = null;
      } else {
        sweep.r += SWEEP_SPEED / 60;
        moving = true;
        // Gone once the front has left the far corner of the page.
        const far = Math.max(
          Math.hypot(sweep.x, sweep.y),
          Math.hypot(width - sweep.x, sweep.y),
          Math.hypot(sweep.x, height - sweep.y),
          Math.hypot(width - sweep.x, height - sweep.y)
        );
        if (sweep.r > far + SWEEP_WIDE) { lie = sweep.to; sweep = null; }
      }
    }

    for (let n = 0; n < strokes.length; n++) {
      const stroke = strokes[n];
      wantedAt(stroke.x, stroke.y);
      stroke.a = turnTo(stroke.a, wantA, step);
      stroke.len += (wantLen - stroke.len) * step;
      stroke.warm += (wantWarm - stroke.warm) * step;
      if (Math.abs(stroke.len - wantLen) > 0.06 ||
          Math.abs(stroke.warm - wantWarm) > 0.01 ||
          Math.abs(turnTo(stroke.a, wantA, 1) - stroke.a) > 0.004) {
        moving = true;
      }
    }
    return moving;
  }

  function draw() {
    paint.clearRect(0, 0, width, height);
    paint.lineCap = "round";
    paint.lineWidth = 1;
    // Grouped into a few weights and drawn a band at a time: a stroke
    // that needs its own alpha needs its own stroke() call, and there
    // are thousands of them.
    const bands = [];
    for (let b = 0; b < BANDS * 2; b++) bands.push(null);

    for (let n = 0; n < strokes.length; n++) {
      const stroke = strokes[n];
      const room = roomAt(stroke.x, stroke.y);
      if (room <= 0.02) continue;
      const alpha = (0.06 + stroke.fade * 0.3 + stroke.warm * 0.55) * room;
      if (alpha < 0.012) continue;
      const warm = stroke.warm > 0.22;
      let band = Math.min(BANDS - 1, Math.floor(alpha / ALPHA_TOP * BANDS));
      if (band < 0) band = 0;
      const at = band + (warm ? BANDS : 0);
      if (!bands[at]) bands[at] = [];
      const half = stroke.len / 2;
      const dx = Math.cos(stroke.a) * half, dy = Math.sin(stroke.a) * half;
      bands[at].push(stroke.x - dx, stroke.y - dy, stroke.x + dx, stroke.y + dy);
    }

    for (let at = 0; at < bands.length; at++) {
      const band = bands[at];
      if (!band) continue;
      const alpha = ((at % BANDS) + 0.5) / BANDS * ALPHA_TOP;
      paint.strokeStyle = "rgba(" + (at >= BANDS ? BRASS : INK) + "," + alpha.toFixed(3) + ")";
      paint.beginPath();
      for (let n = 0; n < band.length; n += 4) {
        paint.moveTo(band[n], band[n + 1]);
        paint.lineTo(band[n + 2], band[n + 3]);
      }
      paint.stroke();
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
