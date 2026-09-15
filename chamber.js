// ============================================================
// THE CHAMBER (categories/favorites.html only)
//
// The favourites live inside a CHAMBER: four injectors, one at each
// corner of the window, firing a fine stream of square particles
// inward on white. The streams fall towards the middle, are caught
// there, and settle into a ring — tilted well off square to the
// window, so it reads as a lens rather than as a circle drawn on the
// page. It is the theories drawing's world turned inside out: the same
// particles, the same instrument marks, the same one cool accent kept
// for what answers you, printed as ink on white instead of white on
// near-black.
//
// THE PAGE HAS TWO STATES, and the whole of the interaction is the
// step between them:
//
//   CLOSED   the word FAVORITES stands alone in the middle of the
//            ring, and the ring turns round it. The word is set a
//            little WIDER than the ring, so the ring's left and right
//            rims fall across the ends of the lettering — one of them
//            in front of the word and the other behind, which is what
//            makes the word sit inside the volume rather than on top
//            of a picture of one, and why there are two canvases.
//
//   OPEN     clicking the word throws the ring outward: every particle
//            runs to its own place on the border of the window and
//            holds there, near enough to frozen but never quite, while
//            the word opens out into the menu. Pointing at a row makes
//            the particles along the sides TRY to converge on it —
//            they lean in towards that row and are stopped by the edge
//            of the writing, which is what makes it read as an
//            attempt rather than as an animation.
//
// Five things are worth knowing before changing any of it:
//
//   It is a real fall, not a path. Every particle is shot at the
//   middle and pulled in; the chamber takes hold of it only once it is
//   near. Writing the curves by hand instead gives a pattern, and a
//   pattern is something you can see repeat.
//
//   What it catches is pressed flat onto the ring's own plane (FLAT).
//   Holding a particle at RING alone gives a shell and not a lens, and
//   a fat shell seen obliquely is a smear.
//
//   The corners are the corners of the WINDOW. Each injector is placed
//   by working back from the screen corner it is meant to sit in at
//   its own depth, so all four stay in their corners at any window
//   size while standing at four different depths. They also take turns
//   being the quick one (`PACE`), so no corner is always the fast one.
//
//   Nothing is ever drawn where the writing stands. The menu's own box
//   is measured off the page and both canvases are clipped around it.
//
//   The cursor is a hand in the volume, not a cursor on a picture: it
//   is put at each particle's own depth before it pushes.
//
// WITHOUT THIS FILE the page is the plain list of favourites every
// other category uses. The script puts `chambered` on <body> and takes
// over; every rule that hides the list is written under that class.
// ============================================================
(function () {
  const page = document.querySelector(".favorites-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const entries = Array.from(list.querySelectorAll(".gallery-entry"));
  if (!entries.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 11;             // the same chamber every visit

  // --- the volume
  const LENS = 1.2;            // the focal length, against the smaller side
  const MID = 20;              // the depth the middle of the chamber stands at
  const NEAR = 3.5;            // nothing nearer than this is drawn
  const FAR = 52;              // and nothing further

  // --- the four injectors, one to a corner, each at its own depth so
  // the streams dive through the volume rather than sliding across it.
  const CORNERS = [
    { at: [0.07, 0.10], z: 13 },
    { at: [0.93, 0.13], z: 24 },
    { at: [0.94, 0.89], z: 16 },
    { at: [0.06, 0.92], z: 27 },
  ];
  const PER_STREAM = 180;      // particles in the air from each of them
  // They take turns being the quick one rather than one corner always
  // running faster than the others: each injector's speed breathes on
  // its own slow clock, and the four clocks are deliberately out of
  // step with each other.
  const PACE = 0.42;           // how much quicker and slower they get
  const PACE_EVERY = [9, 17];  // and how many seconds one of those turns takes

  // --- the fall
  //
  //   PULL     draws a particle in, harder the nearer it is
  //   CATCH    the distance at which the chamber takes hold of it, so
  //            the streams read as straight until they arrive
  //   RING     where it settles what it catches
  //   SETTLE   how fast the falling is taken out of it — the radial
  //            part of its travel only, never the going-round part
  const PULL = 320;            // how hard the middle draws a particle in
  const SOFT = 2.6;            // and how close in that pull stops growing
  const FALL = [0.95, 1.35];   // how fast one is shot at the middle
  const SWING = [0.04, 0.20];  // and how little of that is across the aim
  const CATCH = 11;            // how near the middle the chamber takes hold
  // THE AXIS THE CHAMBER TURNS ABOUT, and so the way the ring is
  // tilted: the ring lies square across it, and how much of the axis
  // points at you is exactly how squashed the ring comes out. Straight
  // at you is a circle; upright is a smear seen edge-on. This is well
  // off both — a lens, tipped away from you, with a near side and a
  // far side.
  const SWIRL = [0.2, 0.86, 0.46];
  const RING = 6.4;            // the ring it settles what it catches into
  const RING_K = 34;           // how firmly it is held there
  const SETTLE = 3.2;          // and how quickly the fall is taken out of it
  // HOW THIN THE LENS IS. Holding a particle at RING alone gives a
  // shell and not a lens — a particle caught while travelling along
  // the axis keeps that travel, and what gathers is a fat doughnut
  // seen obliquely, which reads as a smear rather than as a ring with
  // a near side and a far side. So the part of where it stands and the
  // part of how it travels that lie ALONG the axis are taken out of
  // it, and only those: everything in the plane is the going-round the
  // ring is made of and is never touched.
  const FLAT = 26;             // how hard it is drawn onto the ring's own plane
  const FLAT_V = 3.4;          // and how quickly its drift along the axis goes
  const DRAG = 0.05;           // a little drag everywhere, so nothing runs away
  const MAX_V = 15;            // nothing travels faster than this
  const LIFE = [7, 14];        // seconds in the air before it is sent again
  const SPREAD = 0.55;         // how wide a stream is where it leaves

  // --- breaking up
  const FRAGILE = 0.34;        // how many of them break up rather than orbit
  const FRAG_AT = 7.6;         // how near the middle that happens — outside
                               // the ring, where it can actually be seen
  const FRAG_KICK = [3, 8];    // how hard the pieces are thrown outward
  const FRAG_FOR = 1.5;        // and how long they last afterwards

  // --- opening the menu: the ring thrown out to the borders, and kept
  //     travelling once it is there.
  //
  // The step between the two states is a TIMED ramp eased flat at both
  // ends, not the exponential chase it used to be: a chase starts at
  // its fastest and creeps at the end, so the ring leapt away from the
  // middle and then dawdled into the border. Flat at both ends there
  // is no moment you can point at where it starts or where it stops,
  // and it can simply be told how long to take.
  const OPEN_MS = 1500;        // how long the step between the two states takes
  const EDGE = 54;             // how far inside the window they hold
  const HOLD_EASE = 4.2;       // how hard each one is held to its place
  // HELD IS NOT STOPPED. Every particle keeps its seat on the border
  // but the whole frame TRAVELS round it, each at its own rate, so
  // what stands round the menu is a current and not a printed dotted
  // line. This is the movement the open state has; the wander below is
  // only the life on top of it.
  const FLOW = 0.021;          // laps of the border a second
  const FLOW_VARY = 0.7;       // how differently the light and heavy ones travel
  const ALIVE = 9;             // how far one wanders off its seat, in pixels
  const ALIVE_EVERY = [3, 9];  // over this many seconds

  // --- and what pointing at a row does to them
  //
  // It used to CINCH: the sides left the border and leant in towards
  // the row. That read as the frame being pulled out of shape. What it
  // does now is READ the row off against the frame — the stretch of
  // border level with it takes the cool accent, thickens, and is
  // called out with a leader to each side. Nothing leaves the border.
  const READ_SPAN = 170;       // how much of the border is read off, in pixels
  const READ_OPEN = 26;        // how far that stretch thickens inward

  // --- the hand
  const HAND_PX = 150;         // how near the cursor a particle answers, in pixels
  const HAND_PUSH = 34;        // and how hard it is shoved aside

  // --- how it is drawn
  const SPECK = 0.07;          // a particle's size, in units of the volume
  const TAIL = 0.03;           // how much of its own speed it trails behind it
  const BANDS = 6;             // how many weights the specks are grouped into to draw
  const CLEAR_PAD = 18;        // how far past the writing the clear room reaches

  const INK = "23,23,15";      // --ink
  const STEEL = "109,108,98";  // --muted
  const COOL = "47,95,150";    // the theories page's accent, brought down onto white
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  // The swirl axis as a unit vector, worked out once: everything that
  // turns about it or measures against it wants it that way.
  const AXIS = (function () {
    const n = Math.hypot(SWIRL[0], SWIRL[1], SWIRL[2]) || 1;
    return [SWIRL[0] / n, SWIRL[1] / n, SWIRL[2] / n];
  })();

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (pair) => pair[0] + random() * (pair[1] - pair[0]);
  const numbered = (i) => String(i + 1).padStart(2, "0");

  // ============================================================
  // WHAT IS ON THE PAGE
  //
  // The same reading the contact sheet's Favorites view takes off its
  // own entries: the chapters are the different data-chapter values in
  // the order they first appear, and each favourite carries the date
  // it is filed under. Naming them, ordering them and adding to them
  // are all HTML edits.
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
  // THE PAGE
  // ============================================================
  document.body.classList.add("chambered");

  const shell = document.createElement("div");
  shell.className = "chamber";

  // Two canvases, and it needs both: everything further away than the
  // middle of the chamber is drawn on the first, under the writing,
  // and everything nearer on the second, over it. That is what lets
  // the near half of the ring pass in FRONT of the word standing in
  // the middle of it — the one thing that makes the word read as being
  // inside the volume rather than printed on a picture of one.
  const canvas = document.createElement("canvas");
  canvas.className = "chamber-field";
  canvas.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);

  const where = document.createElement("p");
  where.className = "page-where";
  where.textContent = "Favorites";
  shell.appendChild(where);

  const plate = document.createElement("div");
  plate.className = "chamber-plate";
  shell.appendChild(plate);

  // THE WORD. Closed, this is the whole of the page's chrome: one
  // technical word standing in the middle of the ring. Pressing it is
  // what opens the menu out of it.
  const word = document.createElement("button");
  word.type = "button";
  word.className = "chamber-word";
  word.setAttribute("aria-expanded", "false");
  // Bracketed like a title block on a drawing, with a pressable cue
  // under it saying what it does: closed it is the only thing on the
  // page, so it has to read as something you press and not as a
  // heading somebody centred.
  word.innerHTML =
    '<span class="chamber-word-line">' +
    '<span class="chamber-reg" aria-hidden="true"></span>' +
    '<span class="chamber-word-name">Favorites</span>' +
    '<span class="chamber-reg" aria-hidden="true"></span>' +
    "</span>" +
    '<span class="chamber-cue"><span class="chamber-cue-name">Expand</span>' +
    '<span class="chamber-cue-mark" aria-hidden="true"></span></span>' +
    '<span class="chamber-crop tl" aria-hidden="true"></span>' +
    '<span class="chamber-crop tr" aria-hidden="true"></span>' +
    '<span class="chamber-crop bl" aria-hidden="true"></span>' +
    '<span class="chamber-crop br" aria-hidden="true"></span>';
  const cue = word.querySelector(".chamber-cue-name");
  plate.appendChild(word);

  // THE MENU it opens into. One central column and no strip across the
  // top: the chapters stand in the column first, and opening one puts
  // its favourites in the same column in their place.
  const panel = document.createElement("div");
  panel.className = "chamber-panel";
  panel.hidden = true;
  plate.appendChild(panel);

  const head = document.createElement("div");
  head.className = "chamber-head";
  head.innerHTML =
    '<button type="button" class="chamber-back">' +
    '<span aria-hidden="true">&#8592;</span> <span class="chamber-back-name"></span>' +
    "</button>" +
    '<p class="chamber-spec"></p>';
  panel.appendChild(head);
  const back = head.querySelector(".chamber-back");
  const spec = head.querySelector(".chamber-spec");

  const column = document.createElement("div");
  column.className = "chamber-column";
  panel.appendChild(column);

  // The chapters, in the column.
  const chapterList = document.createElement("div");
  chapterList.className = "chamber-level";
  column.appendChild(chapterList);

  chapters.forEach((chapter, i) => {
    const dates = chapter.items.map((item) => item.date).filter(Boolean);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "chamber-row chamber-chapter";
    row.innerHTML =
      '<span class="chamber-file"><span class="chamber-no"></span>' +
      '<span class="chamber-of"></span></span>' +
      '<span class="chamber-name"></span>' +
      '<span class="chamber-go" aria-hidden="true">&#8594;</span>';
    row.querySelector(".chamber-no").textContent = numbered(i);
    row.querySelector(".chamber-of").textContent =
      numbered(chapter.items.length - 1) + " ENTRIES" +
      (dates.length ? "   ·   " + dates[0] + " – " + dates[dates.length - 1] : "");
    row.querySelector(".chamber-name").textContent = chapter.name;
    chapterList.appendChild(row);
    chapter.row = row;

    // And that chapter's own favourites, in the same column, shown in
    // the chapters' place once one is opened.
    const level = document.createElement("div");
    level.className = "chamber-level";
    level.hidden = true;
    chapter.items.forEach((item, n) => {
      const link = document.createElement("a");
      link.className = "chamber-row chamber-item";
      link.href = item.href;
      link.innerHTML =
        '<span class="chamber-file"><span class="chamber-no"></span>' +
        '<span class="chamber-date"></span></span>' +
        '<span class="chamber-name"></span>' +
        '<span class="chamber-go" aria-hidden="true">&#8594;</span>';
      link.querySelector(".chamber-no").textContent = numbered(n);
      link.querySelector(".chamber-date").textContent = item.date;
      link.querySelector(".chamber-name").textContent = item.name;
      level.appendChild(link);
    });
    column.appendChild(level);
    chapter.level = level;
  });

  const front = document.createElement("canvas");
  front.className = "chamber-front";
  front.setAttribute("aria-hidden", "true");
  shell.appendChild(front);

  page.insertBefore(shell, page.firstChild);
  // The list the chamber replaces need not be held back any longer —
  // see the note in this page's <head>.
  document.documentElement.classList.remove("js-coming");

  const paint = canvas.getContext("2d");
  const paintFront = front.getContext("2d");

  // ============================================================
  // THE TWO STATES, AND THE STEP BETWEEN THEM
  // ============================================================
  // Declared above everything that touches them: opening a chapter
  // happens while the page is still being built, and it reaches both.
  let opened = false;          // is the menu open at all
  let spread = 0;              // 0 the ring turning, 1 held at the borders
  let open = -1;               // which chapter is showing, or -1 for the list
  let hotRow = null;           // the row under the pointer, if any
  // The timed step between the two states — see OPEN_MS.
  let stepFrom = 0, stepTo = 0, stepAt = -1;
  const now = () =>
    (window.performance && window.performance.now ? window.performance.now() : Date.now());
  /** Eased flat at both ends, the same curve the paper's arrival uses. */
  const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  function showLevel() {
    chapterList.hidden = open >= 0;
    chapters.forEach((chapter, i) => { chapter.level.hidden = i !== open; });
    const inside = open >= 0 ? chapters[open] : null;
    back.hidden = !inside;
    if (inside) {
      const dates = inside.items.map((item) => item.date).filter(Boolean);
      back.querySelector(".chamber-back-name").textContent = "Favorites";
      spec.textContent =
        inside.name.toUpperCase() + "   ·   " + numbered(inside.items.length - 1) + " ENTRIES" +
        (dates.length ? "   ·   " + dates[0] + " – " + dates[dates.length - 1] : "");
    } else {
      spec.textContent =
        "FAVORITES   ·   " + numbered(chapters.length - 1) + " CHAPTERS   ·   " +
        numbered(entries.length - 1) + " ENTRIES";
    }
    hotRow = null;
  }

  function setOpen(next, andFocus) {
    if (opened === next) return;
    opened = next;
    word.setAttribute("aria-expanded", String(opened));
    cue.textContent = opened ? "Collapse" : "Expand";
    panel.hidden = !opened;
    plate.classList.toggle("open", opened);
    stepFrom = spread;
    stepTo = opened ? 1 : 0;
    stepAt = now();
    if (!opened) {
      open = -1;
      hotRow = null;
      showLevel();
      if (andFocus) word.focus();
    } else {
      showLevel();
      if (andFocus) {
        const first = column.querySelector(".chamber-level:not([hidden]) .chamber-row");
        if (first) first.focus();
      }
    }
  }

  word.addEventListener("click", () => setOpen(!opened, true));
  back.addEventListener("click", () => {
    open = -1;
    showLevel();
    const row = chapters[0] && chapters[0].row;
    if (row) row.focus();
  });
  chapters.forEach((chapter, i) => {
    chapter.row.addEventListener("click", () => {
      open = i;
      showLevel();
      const first = chapter.level.querySelector(".chamber-row");
      if (first) first.focus();
    });
  });

  // Every row in the column answers the pointer the same way, whether
  // it is a chapter or a favourite: the particles along the sides lean
  // in towards it. Read off the row itself rather than remembered, so
  // it is right after any scroll or resize.
  column.addEventListener("pointerover", (e) => {
    const row = e.target.closest && e.target.closest(".chamber-row");
    if (row) hotRow = row;
  });
  column.addEventListener("pointerout", (e) => {
    const row = e.target.closest && e.target.closest(".chamber-row");
    if (row && row === hotRow) hotRow = null;
  });
  column.addEventListener("focusin", (e) => {
    const row = e.target.closest && e.target.closest(".chamber-row");
    if (row) hotRow = row;
  });
  column.addEventListener("focusout", () => { hotRow = null; });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !opened) return;
    if (open >= 0) { open = -1; showLevel(); }
    else setOpen(false, true);
  });

  // Anywhere off the writing puts it back, the same way the theories
  // drawing puts a set-out station back — the ring is the rest of the
  // page and pressing it is how you leave the menu.
  document.addEventListener("pointerdown", (e) => {
    if (!opened) return;
    if (plate.contains(e.target)) return;
    if (e.target.closest && e.target.closest(".menu-trigger, .menu-overlay")) return;
    setOpen(false, false);
  });

  showLevel();

  // ============================================================
  // THE CHAMBER
  // ============================================================
  let width = 0, height = 0, lens = 0, midX = 0, midY = 0;
  let clock = 0, last = 0;
  let taken = null;
  let handX = -9999, handY = -9999, hasHand = false;

  const stream = CORNERS.map((corner, i) => ({
    at: corner.at, z: corner.z, x: 0, y: 0,
    // Its own clock for taking a turn at being the quick one.
    every: between(PACE_EVERY),
    phase: random() * Math.PI * 2,
    pace: 1,
  }));

  /** Where a point in the volume lands on the window. `k` is what one
      unit at that depth is worth in pixels, which is the only thing
      anything needs to size itself by. */
  function to(x, y, z) {
    if (z <= NEAR) return null;
    const k = lens / z;
    return { x: midX + x * k, y: midY + y * k, k: k };
  }

  const specks = [];
  for (let s = 0; s < stream.length; s++) {
    for (let n = 0; n < PER_STREAM; n++) {
      specks.push({
        from: s,
        x: 0, y: 0, z: MID, vx: 0, vy: 0, vz: 0,
        px: 0, py: 0, pk: 0,
        age: 0,
        life: between(LIFE),
        size: 0.55 + random() * random() * 1.5,
        fragile: random() < FRAGILE,
        burst: 0,
        wait: random() * between(LIFE),
        warm: 0,
        // Where it holds when the menu is open, and the small life it
        // keeps while it is there.
        homeX: 0, homeY: 0, homeZ: MID, placed: false,
        stir: between(ALIVE_EVERY),
        turn: random() * Math.PI * 2,
      });
    }
  }

  /** Sends one particle off from its injector, aimed at the middle
      with a little of its speed across the aim. Both speeds are
      fractions of what going round at that injector's own distance
      would take — the four corners stand at four different distances,
      and flat numbers had one stream drop straight down the hole while
      another sailed past it — and both carry that injector's pace, so
      the corners take turns being quick. */
  function launch(speck) {
    const from = stream[speck.from];
    speck.x = from.x + (random() - 0.5) * 2 * SPREAD;
    speck.y = from.y + (random() - 0.5) * 2 * SPREAD;
    speck.z = from.z + (random() - 0.5) * 2 * SPREAD;

    const dx = -speck.x, dy = -speck.y, dz = MID - speck.z;
    const far = Math.hypot(dx, dy, dz) || 1;
    const round = Math.sqrt(PULL / far) * from.pace;
    const aim = round * between(FALL);
    speck.vx = (dx / far) * aim;
    speck.vy = (dy / far) * aim;
    speck.vz = (dz / far) * aim;

    const side = round * between(SWING);
    let tx = SWIRL[1] * (dz / far) - SWIRL[2] * (dy / far);
    let ty = SWIRL[2] * (dx / far) - SWIRL[0] * (dz / far);
    let tz = SWIRL[0] * (dy / far) - SWIRL[1] * (dx / far);
    const tn = Math.hypot(tx, ty, tz) || 1;
    speck.vx += (tx / tn) * side;
    speck.vy += (ty / tn) * side;
    speck.vz += (tz / tn) * side;

    speck.age = 0;
    speck.life = between(LIFE);
    speck.burst = 0;
    speck.warm = 0;
    speck.placed = false;
  }

  specks.forEach(launch);

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    midX = width / 2;
    midY = height / 2;
    [canvas, front].forEach((one) => {
      one.width = Math.round(width * ratio);
      one.height = Math.round(height * ratio);
      one.style.width = width + "px";
      one.style.height = height + "px";
    });
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintFront.setTransform(ratio, 0, 0, ratio, 0, 0);
    lens = Math.min(width, height) * LENS;

    stream.forEach((one) => {
      const k = lens / one.z;
      one.x = (one.at[0] * width - midX) / k;
      one.y = (one.at[1] * height - midY) / k;
    });
    // Where they hold is worked out from the window, so it has to be
    // worked out again when the window changes.
    specks.forEach((speck) => { speck.placed = false; });
  }

  /** The room the writing takes up, read off the page every frame: the
      menu grows out of the word and back into it, so its box is never
      the same two frames running while that is happening. */
  function clearing() {
    const box = (opened ? panel : word).getBoundingClientRect();
    taken = {
      left: box.left - CLEAR_PAD,
      top: box.top - CLEAR_PAD,
      right: box.right + CLEAR_PAD,
      foot: box.bottom + CLEAR_PAD,
    };
  }

  // ============================================================
  // THE FALL, AND THE HOLD
  // ============================================================
  /** A place from 0 to 1 round the border of the window, walked from
      the middle of the right-hand edge clockwise, written into `out`.
      Everything the open state does is a reading of this one line. */
  const spot = { x: 0, y: 0, wide: 0, tall: 0 };
  function onBorder(along, out) {
    const wide = Math.max(20, midX - EDGE), tall = Math.max(20, midY - EDGE);
    const round = 4 * wide + 4 * tall;
    let s = (along - Math.floor(along)) * round;
    let x, y;
    if (s < tall) { x = wide; y = s; }
    else if ((s -= tall) < 2 * wide) { x = wide - s; y = tall; }
    else if ((s -= 2 * wide) < 2 * tall) { x = -wide; y = tall - s; }
    else if ((s -= 2 * tall) < 2 * wide) { x = -wide + s; y = -tall; }
    else { x = wide; y = -tall + (s - 2 * wide); }
    out.x = x; out.y = y; out.wide = wide; out.tall = tall;
  }

  /** Which seat on the border each particle takes when the menu opens.

      They are given seats IN THE ORDER THEY ALREADY LIE in the ring —
      sorted by the way they stand round the middle, then spaced evenly
      round the border from the same starting point — so the ring
      UNROLLS outward into a frame rather than being replaced by one,
      and the frame comes out even. Taking each particle straight
      outward instead leaves the frame in clumps wherever the ring
      happened to be crowded, which on a ring seen this obliquely is
      most of it. Each also gets its own rate to travel at, so the
      frame is a current rather than a belt. */
  function seatAll() {
    const order = [];
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      const p = to(speck.x, speck.y, speck.z);
      order.push({
        n: n,
        a: p ? Math.atan2(p.y - midY, p.x - midX) : (n / specks.length) * 6.283 - 3.14,
      });
    }
    order.sort((one, two) => one.a - two.a);

    order.forEach((one, place) => {
      const speck = specks[one.n];
      speck.seat = (place + 0.5) / order.length;
      speck.drift = 1 + (speck.size - 1.05) * FLOW_VARY;
      speck.homeZ = Math.max(NEAR + 1, Math.min(FAR - 2, speck.z));
      speck.placed = true;
    });
  }

  /** The row under the pointer, read ONCE A FRAME rather than once a
      particle: asking an element for its box is a question the browser
      has to stop and lay the page out to answer, and there are
      hundreds of particles. */
  let drawTo = null;
  function readRow() {
    if (!hotRow || spread < 0.5) { drawTo = null; return; }
    const box = hotRow.getBoundingClientRect();
    drawTo = { left: box.left, right: box.right, y: (box.top + box.bottom) / 2 };
  }

  function move(dt) {
    // The injectors' turns at being quick.
    for (let s = 0; s < stream.length; s++) {
      const one = stream[s];
      one.pace = 1 + PACE * Math.sin((clock * Math.PI * 2) / one.every + one.phase);
    }

    readRow();
    const held = spread > 0.004;
    if (held && !specks[0].placed) seatAll();

    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];

      // HELD. Nothing is launched, nothing ages, nothing breaks up:
      // the chamber is stopped, and every particle is running to its
      // own place on the border and staying there. It keeps a little
      // life of its own so that it reads as held rather than as a
      // picture of itself.
      if (held) {
        // Its seat, carried round the border on its own rate. The
        // whole frame is travelling; nothing is standing still.
        const flow = REDUCE_MOTION ? 0 : clock * FLOW * speck.drift;
        onBorder(speck.seat + flow, spot);

        // A hair of scatter inward, so the frame has a thickness to it
        // rather than reading as a printed dotted line — and level
        // with the row being pointed at, that thickness OPENS, which
        // is the whole of the reaction now that nothing leaves the
        // border.
        let off = (speck.size - 0.55) * 7;
        const homeY = midY + spot.y;
        if (drawTo) {
          const read = 1 - Math.min(1, Math.abs(homeY - drawTo.y) / READ_SPAN);
          if (read > 0) {
            off += READ_OPEN * read * read * (0.35 + 0.65 * (speck.size - 0.55) / 1.5);
            speck.warm = Math.max(speck.warm, read * read);
          }
        }

        const stir = REDUCE_MOTION ? 0 : ALIVE;
        const wobX = Math.sin((clock * Math.PI * 2) / speck.stir + speck.turn) * stir;
        const wobY = Math.cos((clock * Math.PI * 2) / speck.stir * 0.8 + speck.turn) * stir;
        const wantX = midX + spot.x * (1 - off / Math.max(1, spot.wide));
        const wantY = midY + spot.y * (1 - off / Math.max(1, spot.tall));
        const k = lens / speck.homeZ;
        const toX = (wantX + wobX - midX) / k;
        const toY = (wantY + wobY - midY) / k;
        const ease = Math.min(1, HOLD_EASE * spread * dt);
        speck.x += (toX - speck.x) * ease;
        speck.y += (toY - speck.y) * ease;
        speck.z += (speck.homeZ - speck.z) * ease;
        speck.vx *= 1 - ease; speck.vy *= 1 - ease; speck.vz *= 1 - ease;
        speck.warm *= 1 - Math.min(1, dt * 1.2);
        continue;
      }

      speck.placed = false;
      if (speck.wait > 0) { speck.wait -= dt; continue; }

      speck.age += dt;
      if (speck.burst > 0) {
        speck.burst -= dt;
        if (speck.burst <= 0) { launch(speck); continue; }
      } else if (speck.age > speck.life) {
        launch(speck);
        continue;
      }

      // Drawn towards the middle, harder the nearer it is — softened
      // close in, or a particle passing through the very middle is
      // thrown out at a speed nothing else on the page is moving at.
      const dx = -speck.x, dy = -speck.y, dz = MID - speck.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      const pull = (PULL / (r2 + SOFT * SOFT)) * dt;
      speck.vx += (dx / (r || 1)) * pull;
      speck.vy += (dy / (r || 1)) * pull;
      speck.vz += (dz / (r || 1)) * pull;

      // CAUGHT. Out in the dark a particle simply falls, which is what
      // keeps the four streams reading as streams; within CATCH of the
      // middle the chamber takes hold and does three things at once,
      // and it needs all three. It turns it the way the chamber turns,
      // up to the speed that would carry it round and no further; it
      // holds it to the ring, so what gathers stands AROUND the word
      // rather than piling up behind it; and it takes the fall out of
      // it — the radial part of its travel only, never the going-round
      // part, which is the difference between an orbit settling and
      // everything grinding to a halt.
      if (r < CATCH && speck.burst <= 0) {
        const hold = 1 - r / CATCH;
        const ux = dx / (r || 1), uy = dy / (r || 1), uz = dz / (r || 1);

        let tx = SWIRL[1] * uz - SWIRL[2] * uy;
        let ty = SWIRL[2] * ux - SWIRL[0] * uz;
        let tz = SWIRL[0] * uy - SWIRL[1] * ux;
        const tn = Math.hypot(tx, ty, tz) || 1;
        tx /= tn; ty /= tn; tz /= tn;

        const round = Math.sqrt(PULL / Math.max(1, r));
        const going = speck.vx * tx + speck.vy * ty + speck.vz * tz;
        if (going < round) {
          const turn = Math.min(round - going, round * hold * dt * 3.2);
          speck.vx += tx * turn;
          speck.vy += ty * turn;
          speck.vz += tz * turn;
        }

        const off = (r - RING) * RING_K * hold * dt;
        speck.vx += ux * off;
        speck.vy += uy * off;
        speck.vz += uz * off;

        const fall = speck.vx * ux + speck.vy * uy + speck.vz * uz;
        const ease = Math.min(0.9, SETTLE * hold * dt);
        speck.vx -= ux * fall * ease;
        speck.vy -= uy * fall * ease;
        speck.vz -= uz * fall * ease;

        // And flattened onto the ring's own plane — see FLAT.
        const along =
          speck.x * AXIS[0] + speck.y * AXIS[1] + (speck.z - MID) * AXIS[2];
        const press = FLAT * hold * dt;
        speck.vx -= AXIS[0] * along * press;
        speck.vy -= AXIS[1] * along * press;
        speck.vz -= AXIS[2] * along * press;

        const drift =
          speck.vx * AXIS[0] + speck.vy * AXIS[1] + speck.vz * AXIS[2];
        const calm = Math.min(0.9, FLAT_V * hold * dt);
        speck.vx -= AXIS[0] * drift * calm;
        speck.vy -= AXIS[1] * drift * calm;
        speck.vz -= AXIS[2] * drift * calm;
      }

      // The hand, put at this particle's own depth so that what it
      // pushes aside is a hole in the stream and not a circle drawn on
      // the picture.
      if (hasHand && speck.burst <= 0) {
        const k = lens / Math.max(NEAR, speck.z);
        const reach = HAND_PX / k;
        const hx = speck.x - (handX - midX) / k;
        const hy = speck.y - (handY - midY) / k;
        const off = Math.hypot(hx, hy);
        if (off < reach) {
          const hold = 1 - off / reach;
          const shove = (HAND_PUSH * hold * hold * dt) / (off || 1);
          speck.vx += hx * shove;
          speck.vy += hy * shove;
          speck.warm = Math.max(speck.warm, hold);
        }
      }
      speck.warm *= 1 - Math.min(1, dt * 2.2);

      // Breaking up: a fragile one that reaches the middle is thrown
      // apart there and gone soon after.
      if (speck.fragile && speck.burst <= 0 && r < FRAG_AT) {
        const kick = between(FRAG_KICK);
        const a = random() * Math.PI * 2, b = (random() - 0.5) * Math.PI;
        speck.vx = Math.cos(a) * Math.cos(b) * kick;
        speck.vy = Math.sin(b) * kick;
        speck.vz = Math.sin(a) * Math.cos(b) * kick;
        speck.burst = FRAG_FOR;
      }

      if (speck.burst <= 0) {
        const slow = 1 - Math.min(0.5, DRAG * dt);
        speck.vx *= slow; speck.vy *= slow; speck.vz *= slow;
      }

      const fast = Math.hypot(speck.vx, speck.vy, speck.vz);
      if (fast > MAX_V) {
        const hold = MAX_V / fast;
        speck.vx *= hold; speck.vy *= hold; speck.vz *= hold;
      }

      speck.x += speck.vx * dt;
      speck.y += speck.vy * dt;
      speck.z += speck.vz * dt;

      if (speck.z < NEAR + 0.5 || speck.z > FAR ||
          Math.abs(speck.x) > 60 || Math.abs(speck.y) > 60) {
        launch(speck);
      }
    }
  }

  // ============================================================
  // DRAWING
  // ============================================================
  const rgba = (tone, a) => "rgba(" + tone + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  function drawMarks() {
    // The ranging circles, the same marks the theories drawing puts on
    // something it is measuring. They are drawn square to the window
    // rather than tilted with the ring: they are the instrument's
    // marks, not part of what is being measured. They go as the menu
    // opens — what is left then is the frame of held particles.
    const centre = to(0, 0, MID);
    if (centre) {
      paint.lineWidth = 1;
      for (let n = 0; n < 2; n++) {
        const r = RING * (1 + n * 0.62) * centre.k;
        paint.strokeStyle = rgba(STEEL, (n ? 0.08 : 0.13) * (1 - spread));
        paint.beginPath();
        paint.arc(centre.x, centre.y, r, 0, Math.PI * 2);
        paint.stroke();
      }
    }

    // THE ROW BEING POINTED AT, called out against the frame: a
    // leader from each end of it running out to the border, with a
    // tick where it lands. The particles level with it have already
    // taken the cool accent and opened out — this is what says which
    // row they are reading.
    if (drawTo && spread > 0.5) {
      const lit = 0.55 * spread;
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(COOL, lit);
      const y = Math.round(drawTo.y) + 0.5;
      [[drawTo.left - 18, EDGE + 6], [drawTo.right + 18, width - EDGE - 6]].forEach((run) => {
        paint.beginPath();
        paint.moveTo(run[0], y);
        paint.lineTo(run[1], y);
        paint.moveTo(run[1], y - 6);
        paint.lineTo(run[1], y + 6);
        paint.stroke();
      });
    }

    // The injectors: a registration square in each corner, a leader
    // aimed at the middle, and the depth it stands at.
    stream.forEach((one, i) => {
      const p = to(one.x, one.y, one.z);
      if (!p) return;
      const size = 9;
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(COOL, 0.5);
      paint.strokeRect(Math.round(p.x - size / 2) + 0.5, Math.round(p.y - size / 2) + 0.5, size, size);

      if (centre) {
        const dx = centre.x - p.x, dy = centre.y - p.y;
        const far = Math.hypot(dx, dy) || 1;
        paint.strokeStyle = rgba(STEEL, 0.18);
        paint.beginPath();
        paint.moveTo(p.x + (dx / far) * 12, p.y + (dy / far) * 12);
        paint.lineTo(p.x + (dx / far) * 44, p.y + (dy / far) * 44);
        paint.stroke();
      }

      paint.font = "10px " + MONO;
      paint.fillStyle = rgba(STEEL, 0.6);
      const label = "S-" + numbered(i) + " · " + String(Math.round(one.z)).padStart(3, "0");
      const wide = paint.measureText(label).width;
      paint.fillText(label, one.at[0] > 0.5 ? p.x - wide - 12 : p.x + 12, p.y + 3.5);
    });
  }

  // The specks are grouped into a few weights and each group is drawn
  // in one pass — a tail that needs its own alpha needs its own
  // stroke, and there are hundreds of them. Two sets of bands, because
  // there are two canvases: what is behind the writing and what is in
  // front of it.
  function makeBands() {
    const out = [];
    for (let b = 0; b < BANDS * 2; b++) out.push({ tails: [], dots: [] });
    return out;
  }
  const behind = makeBands();
  const ahead = makeBands();

  function draw() {
    paint.clearRect(0, 0, width, height);
    paintFront.clearRect(0, 0, width, height);

    // WHAT IS CLIPPED, AND WHAT IS NOT — and the back canvas is NOT,
    // which matters.
    //
    // It used to be clipped to outside the writing's own box, and that
    // was a mistake you could see: the word's box is a wide, flat
    // rectangle, so the far side of the ring vanished along a straight
    // line nowhere near any lettering and came back along another one.
    // It read as an invisible pane standing in the chamber. It was
    // never needed either — this canvas is UNDER the plate in the
    // page's own stacking order, so the word and the menu occlude it
    // by simply being drawn on top of it, letter by letter and not box
    // by box. The far rim now threads between the letters and is hidden
    // behind the strokes, which is what it should have done all along.
    //
    // The front canvas is another matter. Closed it is not clipped
    // either: the nearer half of the ring is meant to pass over the
    // word, and that crossing is the whole of what makes the word sit
    // inside the chamber rather than on top of a picture of it. Opened
    // it IS clipped, to the menu's box — which is a panel with a
    // border and a ground of its own, so the edge the particles stop
    // at is an edge you can see.
    paint.save();
    paintFront.save();
    if (taken && opened) {
      paintFront.beginPath();
      paintFront.rect(0, 0, width, height);
      paintFront.rect(taken.left, taken.top,
                      taken.right - taken.left, taken.foot - taken.top);
      paintFront.clip("evenodd");
    }

    drawMarks();
    for (let b = 0; b < behind.length; b++) {
      behind[b].tails.length = 0; behind[b].dots.length = 0;
      ahead[b].tails.length = 0; ahead[b].dots.length = 0;
    }

    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      if (speck.wait > 0 && spread <= 0.004) continue;
      const p = to(speck.x, speck.y, speck.z);
      if (!p) continue;
      if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) {
        speck.pk = 0;
        continue;
      }

      const life = speck.burst > 0
        ? Math.min(1, speck.burst / (FRAG_FOR * 0.6))
        : Math.min(1, speck.age / 0.6) * Math.min(1, (speck.life - speck.age) / 1.6);
      const near = Math.min(1, 26 / speck.z);
      // Held, they are all of them plainly there: no one is halfway
      // through arriving or leaving while the chamber is stopped.
      const lit = (spread > 0.004 ? near : life * near) * (0.4 + speck.warm * 0.6);
      if (lit < 0.02) { speck.pk = 0; continue; }

      // Nearer than the middle of the chamber goes on the front
      // canvas, over the writing; further away goes behind it.
      const bands = speck.z < MID ? ahead : behind;
      const warm = speck.warm > 0.12;
      let band = Math.floor(lit * BANDS);
      if (band > BANDS - 1) band = BANDS - 1;
      if (band < 0) band = 0;
      const into = bands[band + (warm ? BANDS : 0)];

      // Squares, drawn on whole pixels so they stay squares: at this
      // size a rectangle laid across a pixel boundary comes out as a
      // soft blob, which is the one thing these must not look like.
      const size = Math.max(1, Math.round(Math.min(6, speck.size * p.k * SPECK)));
      const x = Math.round(p.x - size / 2), y = Math.round(p.y - size / 2);
      if (speck.pk) into.tails.push(speck.px, speck.py, p.x, p.y);
      into.dots.push(x, y, size);

      const back = to(speck.x - speck.vx * TAIL, speck.y - speck.vy * TAIL,
                      Math.max(NEAR + 0.1, speck.z - speck.vz * TAIL));
      speck.px = back ? back.x : p.x;
      speck.py = back ? back.y : p.y;
      speck.pk = p.k;
    }

    [[behind, paint], [ahead, paintFront]].forEach(([bands, ink]) => {
      for (let b = 0; b < bands.length; b++) {
        const band = bands[b];
        if (!band.tails.length && !band.dots.length) continue;
        const lit = ((b % BANDS) + 0.5) / BANDS;
        const tone = b >= BANDS ? COOL : INK;
        if (band.tails.length) {
          ink.strokeStyle = rgba(tone, lit * 0.42);
          ink.lineWidth = 1;
          ink.beginPath();
          for (let n = 0; n < band.tails.length; n += 4) {
            ink.moveTo(band.tails[n], band.tails[n + 1]);
            ink.lineTo(band.tails[n + 2], band.tails[n + 3]);
          }
          ink.stroke();
        }
        if (band.dots.length) {
          ink.fillStyle = rgba(tone, lit);
          ink.beginPath();
          for (let n = 0; n < band.dots.length; n += 3) {
            ink.rect(band.dots[n], band.dots[n + 1], band.dots[n + 2], band.dots[n + 2]);
          }
          ink.fill();
        }
      }
    });

    paint.restore();
    paintFront.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    clearing();
    if (REDUCE_MOTION) spread = opened ? 1 : 0;
    else if (stepAt >= 0) {
      const gone = Math.min(1, (now - stepAt) / OPEN_MS);
      spread = stepFrom + (stepTo - stepFrom) * smoother(gone);
      if (gone >= 1) { spread = stepTo; stepAt = -1; }
    }
    if (!REDUCE_MOTION) {
      clock += dt;
      move(dt);
    } else if (spread > 0.5) {
      // Held: still put where they belong, just not watched getting
      // there — the same one step the rest of the site takes when
      // animation is turned off.
      move(dt);
    }
    draw();
  }

  window.addEventListener("pointermove", (e) => {
    handX = e.clientX;
    handY = e.clientY;
    hasHand = true;
    // And the row under it, settled here rather than left to
    // pointerout alone: the menu grows out from under the pointer when
    // it opens, so a row can arrive under a hand that never moved and
    // then never be left. Asked on every move, what is pointed at is
    // whatever is actually pointed at.
    if (hotRow && !(e.target.closest && e.target.closest(".chamber-row"))) hotRow = null;
  });
  window.addEventListener("pointerleave", () => { hasHand = false; hotRow = null; });
  window.addEventListener("resize", resize);

  resize();
  clearing();
  // With animation turned off there is nothing to watch happening, so
  // the chamber is settled once, into the shape it would have had, and
  // then left exactly as it is.
  if (REDUCE_MOTION) {
    for (let n = 0; n < 240; n++) move(1 / 30);
  }
  draw();
  requestAnimationFrame(frame);
})();
