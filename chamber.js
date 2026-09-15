// ============================================================
// THE CHAMBER (categories/favorites.html only)
//
// The favourites live inside a CHAMBER: two injectors, both on the
// left-hand side of the window, firing a fine stream of particles at a
// slant across it on white. What the streams join is an ORBIT — tilted
// well off square to the window, so it reads as a lens rather than as
// a circle drawn on the page. It is the theories drawing's world
// turned inside out: the same particles, the same instrument marks,
// one accent kept for what answers you — brass here, where that
// drawing keeps a cool blue — printed as ink on white instead of white
// on near-black.
//
// THERE IS ONLY EVER ONE ARRANGEMENT HERE, and the whole of the
// interaction is that one arrangement changing size:
//
//   CLOSED   the word FAVORITES stands alone in the middle of the
//            orbit, and the orbit turns round it. The word is set a
//            little WIDER than the orbit, so the orbit's left and
//            right rims fall across the ends of the lettering — one of
//            them in front of the word and the other behind, which is
//            what makes the word sit inside the volume rather than on
//            top of a picture of one, and why there are two canvases.
//
//   OPEN     pressing the word widens the orbit until it stands clear
//            round the menu, which opens out of the word as it goes.
//            It never stops turning. Pointing at a row makes the
//            stretch of orbit level with it take the cool accent and
//            swell outward, with a leader run out to each side — a
//            reading of that row against the orbit, not a reaching for
//            it.
//
// The open state used to be something else entirely: the particles
// were thrown out to the borders of the window and held there as a
// rectangle. That put two different things on one page with a costly
// step between them, and the step was the most awkward moment on it.
// One thing that grows is smooth in both directions for the same
// reason, and there is no `EDGE`, no seat and no border in this file
// any more.
//
// Six things are worth knowing before changing any of it:
//
//   It is a real fall, not a path. Every particle is thrown at the
//   orbit and pulled in by the middle; the chamber takes hold of it
//   only once it is near. Writing the curves by hand instead gives a
//   pattern, and a pattern is something you can see repeat.
//
//   A stream is aimed AT THE ORBIT, not at the middle (`ENTRY_LEAD`).
//   Where the injector stands round the orbit is carried forward along
//   the way the orbit runs, and the stream is fired at there — so it
//   comes in at a slant and arrives already going the way the orbit
//   goes. Aimed at the middle, every stream dived at the centre and
//   had to be turned through most of a right angle to join, which is
//   what read as chaos.
//
//   Both injectors are on the SAME SIDE. Four, one to a corner, fired
//   at each other across the middle; two entering from one side, one
//   above and one below, go round the same way and fall in behind each
//   other. They are placed by working back from the point of the
//   window they are meant to sit at, at their own depths, so they stay
//   put at any window size — and they take turns being the quick one
//   (`PACE`), so neither is always the fast one.
//
//   What it catches is pressed flat onto the orbit's own plane (FLAT).
//   Holding a particle at the orbit's radius alone gives a shell and
//   not a lens, and a fat shell seen obliquely is a smear.
//
//   The orbit's own path is drawn, faintly, split at the middle of the
//   chamber like everything else. It is what makes the drawing legible
//   AS an orbit in a still frame, and at the moment a stream is
//   arriving.
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

  // --- THE INJECTORS. Two of them, and both on the LEFT of the window.
  // Four, one to a corner, fired at each other across the middle and
  // the result read as a collision rather than as an orbit: two
  // streams entering from the same side, one above and one below, go
  // round the same way and fall in behind each other.
  // ONE AT THE TOP RIGHT, ONE AT THE BOTTOM LEFT — opposite corners,
  // which is only survivable because a stream is aimed at the ORBIT
  // rather than at the middle: both come in on a tangent and go round
  // the same way, so they fall in behind each other instead of meeting
  // head-on. Aimed at the middle, opposite corners is a collision.
  //
  // Both stand BEYOND the middle of the chamber in depth. An injector
  // nearer than that is only a short way from the middle in the
  // volume, however far into the corner of the window it looks — and
  // one inside the distance the chamber takes hold at has its stream
  // caught the instant it leaves, so there is no stream to see at all.
  // That happened: one had no visible stream whatever while the other
  // had a long one.
  const CORNERS = [
    { at: [0.94, 0.09], z: 30 },
    { at: [0.05, 0.93], z: 36 },
  ];
  const PER_STREAM = 340;      // particles in the air from each of them
  // They take turns being the quick one rather than one always running
  // faster than the other: each injector's speed breathes on its own
  // slow clock, and the two clocks are deliberately out of step.
  const PACE = 0.3;            // how much quicker and slower they get
  const PACE_EVERY = [11, 19]; // and how many seconds one of those turns takes

  // --- the fall
  //
  //   PULL       draws a particle in, harder the nearer it is
  //   CATCH_MUL  the distance the chamber takes hold at, as a multiple
  //              of the orbit's own radius, so the streams read as
  //              straight until they arrive
  //   SETTLE     how fast the falling is taken out of it — the radial
  //              part of its travel only, never the going-round part
  const PULL = 320;            // how hard the middle draws a particle in
  const SOFT = 2.6;            // and how close in that pull stops growing
  // A STREAM IS AIMED AT THE ORBIT, NOT AT THE MIDDLE. Where the
  // injector stands round the orbit is worked out, that place is
  // carried FORWARD along the way the orbit runs, and the stream is
  // fired at *there* — so it comes in at a slant and meets the orbit
  // already going the way the orbit goes. Aimed at the middle instead,
  // every stream dived at the centre and had to be turned through most
  // of a right angle to join, which is what read as chaos.
  // HOW FAR FORWARD IT IS AIMED: along the TANGENT from where it
  // stands to the orbit, worked out rather than set, because a fixed
  // angle is only right for one place to stand. With two injectors at
  // opposite corners a fixed one pointed the second of them almost
  // straight at the middle — the very thing the aim exists to avoid.
  // 1 grazes the orbit exactly; a little under that so it arrives
  // rather than skims past.
  const ENTRY_GRAZE = 0.92;
  // BOTH SPEEDS ARE FRACTIONS OF THE SPEED IT WOULD TAKE TO GO ROUND
  // AT THE INJECTOR'S OWN DISTANCE, not at the orbit's. An injector
  // standing well out is much further from the middle than the orbit
  // is, and going round out there is far slower; given the orbit's own
  // sideways speed that far out, a stream was simply thrown off the
  // side of the window and never arrived at all.
  const FALL = [1.25, 1.55];   // how hard it is sent at the orbit
  const SWING = [0.55, 0.75];  // and how much sideways it leaves with
  const CATCH_MUL = 1.9;       // how near the orbit the chamber takes hold
  const CATCH_KEEP = 0.92;     // but never nearer the injectors than this much
                               // of the way to them — see `takes` in move()
  // THE AXIS THE CHAMBER TURNS ABOUT, and so the way the orbit is
  // tilted: the orbit lies square across it, and how much of the axis
  // points at you is exactly how squashed it comes out. Straight at
  // you is a circle; upright is a smear seen edge-on. This is well off
  // both — a lens, tipped away from you, with a near side and a far
  // side.
  const SWIRL = [0.2, 0.86, 0.46];
  const RING = 4.7;            // the orbit, closed
  const RING_K = 40;           // how firmly a particle is held to it
  const SETTLE = 3.6;          // and how quickly the fall is taken out of it
  // HOW THIN THE LENS IS. Holding a particle at the orbit's radius
  // alone gives a shell and not a lens — a particle caught while
  // travelling along the axis keeps that travel, and what gathers is a
  // fat doughnut seen obliquely, which reads as a smear rather than as
  // a ring with a near side and a far side. So the part of where it
  // stands and the part of how it travels that lie ALONG the axis are
  // taken out of it, and only those: everything in the plane is the
  // going-round the orbit is made of and is never touched.
  const FLAT = 30;             // how hard it is drawn onto the orbit's own plane
  const FLAT_V = 3.8;          // and how quickly its drift along the axis goes
  const DRAG = 0.05;           // a little drag everywhere, so nothing runs away
  const MAX_V = 15;            // nothing travels faster than this
  const LIFE = [9, 17];        // seconds in the air before it is sent again
  // AND HOW LONG IT IS HELD AT THE INJECTOR before it sets off again,
  // which is what keeps the streams steady rather than a procession of
  // waves. Without it a particle's cycle is exactly its own life, so
  // whatever spread of phases the page starts with it keeps for ever:
  // the ones sent off together come back together, and between one
  // wave arriving and the next setting off a stream empties completely
  // for seconds at a time. A random hold gives every cycle its own
  // independent nudge, so the whole population spreads itself out
  // within a turn or two however it started.
  const HOLD = [0, 4];
  const SPREAD = 0.42;         // how wide a stream is where it leaves

  // --- OPENING THE MENU: the orbit WIDENS.
  //
  // It used to be thrown out to the borders of the window and held
  // there as a rectangle. That meant two different things on one page —
  // an orbit and a frame — with a costly step between them, and the
  // step was the most awkward moment on the page. Now there is one
  // thing, and opening the menu is that one thing getting bigger: the
  // orbit grows until it stands clear round the writing, and never
  // stops turning. Closing it is the same in reverse, which is why
  // both directions are smooth for the same reason.
  //
  // The step is a TIMED ramp eased flat at both ends, not an
  // exponential chase: a chase starts at its fastest and creeps at the
  // end. Flat at both ends there is no moment you can point at where
  // it starts or where it stops, and it can simply be told how long to
  // take.
  const OPEN_MS = 1700;        // how long the step between the two states takes
  const OPEN_CLEAR = 46;       // how far outside the writing the orbit stands
  const OPEN_FILL = 0.96;      // how much of the window it is allowed to fill
  const OPEN_MOST = 22;        // and how wide it is ever allowed to grow

  // --- WHAT ANSWERING YOU LOOKS LIKE: a MARK and a SWELL, and no
  //     change of colour at all.
  //
  // A particle the page is answering with is RANGED — a fine hollow
  // square drawn round it, the mark the rest of the site makes on
  // something it is measuring. The colour of a speck says nothing here
  // any more: this page is ink on white, and what it says when you
  // point at something it says in the drawing's own language rather
  // than by tinting things.
  const MARK_AT = 0.28;        // how far it has to be answering before it is ranged
  const MARK_OFF = 3.4;        // how far outside the speck the square is drawn
  const MARK_INK = 0.55;       // and how heavily

  // --- and what pointing at a row does to the orbit
  //
  // It used to CINCH: the sides left the border and leant in towards
  // the row. That read as the drawing being pulled out of shape. What
  // it does now is READ the row off against the orbit — the stretch of
  // orbit level with it is ranged and swells outward, and is called
  // out with a leader to each side. Nothing leaves the orbit.
  const READ_SPAN = 150;       // how much of the orbit is read off, in pixels
  const READ_SWELL = 1.05;     // and how far that stretch swells, in units

  // --- the hand
  const HAND_PX = 150;         // how near the cursor a particle answers, in pixels
  const HAND_PUSH = 34;        // and how hard it is shoved aside

  // --- how it is drawn
  const SPECK = 0.07;          // a particle's size, in units of the volume
  const TAIL = 0.03;           // how much of its own speed it trails behind it
  const BANDS = 6;             // how many weights the specks are grouped into to draw
  const PATH_INK = 0.2;        // how plainly the orbit's own path is drawn
  const CLEAR_PAD = 18;        // how far past the writing the clear room reaches

  const INK = "23,23,15";      // --ink
  const STEEL = "109,108,98";  // --muted

  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  // The swirl axis as a unit vector, worked out once: everything that
  // turns about it or measures against it wants it that way.
  const AXIS = (function () {
    const n = Math.hypot(SWIRL[0], SWIRL[1], SWIRL[2]) || 1;
    return [SWIRL[0] / n, SWIRL[1] / n, SWIRL[2] / n];
  })();

  // And a pair of directions across it, so a place on the orbit can be
  // named by one angle. Going from U towards W is the way the orbit
  // runs, which is the direction everything here calls FORWARD.
  const PLANE = (function () {
    const off = Math.abs(AXIS[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [
      AXIS[1] * off[2] - AXIS[2] * off[1],
      AXIS[2] * off[0] - AXIS[0] * off[2],
      AXIS[0] * off[1] - AXIS[1] * off[0],
    ];
    const n = Math.hypot(u[0], u[1], u[2]) || 1;
    u = [u[0] / n, u[1] / n, u[2] / n];
    const w = [
      AXIS[1] * u[2] - AXIS[2] * u[1],
      AXIS[2] * u[0] - AXIS[0] * u[2],
      AXIS[0] * u[1] - AXIS[1] * u[0],
    ];
    return { u: u, w: w };
  })();

  /** Which way the orbit RUNS at a place on it, given that place's
      direction out from the middle. One definition, used both by the
      launch and by the catch: written out twice they came out pointing
      opposite ways, and a stream entering against the orbit is the
      whole of what "chaotic" looked like.

      Going FORWARD is `at` DECREASING, which is why every lead in this
      file is subtracted. */
  function runsAt(rx, ry, rz, out) {
    out[0] = -(AXIS[1] * rz - AXIS[2] * ry);
    out[1] = -(AXIS[2] * rx - AXIS[0] * rz);
    out[2] = -(AXIS[0] * ry - AXIS[1] * rx);
    return out;
  }

  /** WHERE THE MIDDLE OF THE CHAMBER STANDS in the volume — the
      orbit's centre, and the point everything is pulled towards. The
      middle of the window when the page is closed, and moved off it
      when the menu is open.

      It has to move, because a tilted ring is not drawn symmetrically
      about its own centre: the near half of it stands much closer to
      the eye, so it comes out bigger and further down and across the
      window than the far half. An orbit centred on the middle of the
      chamber therefore hangs visibly below and to one side of the
      middle of the WINDOW, which is what anyone looking at it will
      measure it against. So fitOrbit measures where the drawn ellipse
      actually sits and moves the chamber by the difference. */
  const core = [0, 0, MID];         // now, eased with the menu opening
  const coreOpen = [0, 0, MID];     // and where it stands once open

  /** Where something standing at `v` (measured from the middle of the
      chamber) should aim to join an orbit of radius `r`: the place on
      the orbit its own tangent touches, carried forward along the way
      the orbit runs. Written into `out` as a point in the volume. */
  function entryFor(v, r, out) {
    const along = v[0] * AXIS[0] + v[1] * AXIS[1] + v[2] * AXIS[2];
    const px = v[0] - along * AXIS[0];
    const py = v[1] - along * AXIS[1];
    const pz = v[2] - along * AXIS[2];
    const at = Math.atan2(
      px * PLANE.w[0] + py * PLANE.w[1] + pz * PLANE.w[2],
      px * PLANE.u[0] + py * PLANE.u[1] + pz * PLANE.u[2]
    );
    const out0 = Math.hypot(px, py, pz) || 1;
    const graze = Math.acos(Math.max(-1, Math.min(1, r / out0))) * ENTRY_GRAZE;
    return onOrbit(at - graze, r, out);
  }

  /** A point on the orbit of radius `r`, at angle `at` round it. Where
      the middle stands is passed in rather than read, so that fitOrbit
      can try one out before settling on it. */
  function onOrbit(at, r, out, from) {
    const c = Math.cos(at), s = Math.sin(at);
    const at0 = from || core;
    out[0] = at0[0] + r * (c * PLANE.u[0] + s * PLANE.w[0]);
    out[1] = at0[1] + r * (c * PLANE.u[1] + s * PLANE.w[1]);
    out[2] = at0[2] + r * (c * PLANE.u[2] + s * PLANE.w[2]);
    return out;
  }

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
  // How wide the orbit grows when the menu is open. Worked out from
  // the menu's own box in clearing(), not set here.
  let openRing = RING * 1.9;
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
        wait: random() * between(LIFE),
        warm: 0,
      });
    }
  }

  /** Where the orbit stands now — RING closed, wider once the menu is
      open, and eased between the two. Everything that measures against
      the orbit asks for it here. */
  function orbitNow() {
    return RING + (openRing - RING) * spread;
  }

  /** Sends one particle off from its injector, AIMED AT THE ORBIT.

      Where the injector itself stands round the orbit is worked out,
      that place is carried forward along the way the orbit runs
      (`ENTRY_LEAD`), and the particle is fired at *there* — carrying
      most of the orbit's own speed along it as it goes. So it comes in
      at a slant and arrives already going the way the orbit goes,
      instead of diving at the middle and having to be turned through
      most of a right angle to join.

      Both speeds are fractions of the orbit's own, not flat numbers:
      the two injectors stand at two different depths, and with flat
      numbers one stream dropped straight down the hole while the other
      sailed past it. Both carry that injector's pace, so the two take
      turns being quick. */
  const spot = [0, 0, 0];
  const way = [0, 0, 0];
  const stand = [0, 0, 0];
  function launch(speck) {
    const from = stream[speck.from];
    speck.x = from.x + (random() - 0.5) * 2 * SPREAD;
    speck.y = from.y + (random() - 0.5) * 2 * SPREAD;
    speck.z = from.z + (random() - 0.5) * 2 * SPREAD;

    // Where it stands, and where it is going to join the orbit — both
    // measured from the chamber's middle, which moves off the middle
    // of the window when the menu is open (see `core`).
    stand[0] = speck.x - core[0];
    stand[1] = speck.y - core[1];
    stand[2] = speck.z - core[2];
    const r = orbitNow();
    entryFor(stand, r, spot);

    const out = Math.hypot(stand[0], stand[1], stand[2]) || 1;
    const spin = Math.sqrt(PULL / out) * from.pace;

    const dx = spot[0] - speck.x, dy = spot[1] - speck.y, dz = spot[2] - speck.z;
    const far = Math.hypot(dx, dy, dz) || 1;
    const drop = spin * between(FALL);
    speck.vx = (dx / far) * drop;
    speck.vy = (dy / far) * drop;
    speck.vz = (dz / far) * drop;

    // And already going the way the orbit goes: the tangent where it
    // stands, so the stream leans over into the turn rather than being
    // turned into it once it gets there.
    runsAt(stand[0] / out, stand[1] / out, stand[2] / out, way);
    const round = spin * between(SWING);
    speck.vx += way[0] * round;
    speck.vy += way[1] * round;
    speck.vz += way[2] * round;

    speck.age = 0;
    speck.life = between(LIFE);
    speck.wait = between(HOLD);
    speck.warm = 0;
  }

  specks.forEach(launch);
  specks.forEach((speck) => { speck.wait = random() * between(LIFE); });
  // The first of them are held back for anything up to a whole life.
  // Over a few seconds instead and the page fires everything it has in
  // the first instant, and then stands completely empty for several
  // seconds while the whole lot of them come round again — which is
  // exactly what HOLD exists to stop, and a short spread is not enough
  // on its own to undo a start that bunched.

  // How far off the middle the nearest injector stands, worked out
  // whenever the window changes. The chamber is never allowed to take
  // hold that far out — see `takes` in move().
  let nearestSource = 99;

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

    nearestSource = 99;
    stream.forEach((one) => {
      const k = lens / one.z;
      one.x = (one.at[0] * width - midX) / k;
      one.y = (one.at[1] * height - midY) / k;
      nearestSource = Math.min(nearestSource,
        Math.hypot(one.x - core[0], one.y - core[1], one.z - core[2]));
    });
  }

  /** The room the writing takes up, read off the page every frame: the
      menu grows out of the word and back into it, so its box is never
      the same two frames running while that is happening.

      The same pass hands the menu's own box to `fitOrbit`, which works
      out how wide the orbit has to grow — so it is right at any window
      size rather than being a number that happens to clear the menu on
      a laptop. It is only asked while the menu actually has a box: the
      panel is taken off the page the moment the menu is closed, and an
      orbit sized against a box of nothing would snap inward halfway
      through closing. */
  function clearing() {
    const box = (opened ? panel : word).getBoundingClientRect();
    taken = {
      left: box.left - CLEAR_PAD,
      top: box.top - CLEAR_PAD,
      right: box.right + CLEAR_PAD,
      foot: box.bottom + CLEAR_PAD,
    };

    const menu = panel.getBoundingClientRect();
    if (menu.width > 8 && menu.height > 8) fitOrbit(menu);
  }

  /** How far the orbit of radius `r` reaches from the middle of the
      window, ON the window. Sampled through the real projection rather
      than worked out on paper: the near half of the orbit stands a
      long way closer to the eye than the far half and comes out much
      bigger, so a reading taken flat at the middle depth is badly
      wrong at the near edge — which is the edge that runs off the
      bottom of the screen. */
  const reach = [0, 0, 0];
  function reachOf(r, from) {
    let top = 1e9, foot = -1e9, left = 1e9, right = -1e9;
    // Finely enough sampled that the edges of the ellipse are actually
    // found: at 32 the outermost points fell between two samples often
    // enough to leave the orbit sitting tens of pixels off the middle
    // of the window.
    for (let n = 0; n < 96; n++) {
      onOrbit((n / 96) * Math.PI * 2, r, reach, from);
      const p = to(reach[0], reach[1], reach[2]);
      if (!p) continue;
      if (p.y < top) top = p.y;
      if (p.y > foot) foot = p.y;
      if (p.x < left) left = p.x;
      if (p.x > right) right = p.x;
    }
    const wide = Math.max(Math.abs(left - midX), Math.abs(right - midX));
    const tall = Math.max(Math.abs(top - midY), Math.abs(foot - midY));
    return {
      wide: wide,
      tall: tall,
      // Where the drawn ellipse actually sits on the window, which is
      // not where the middle of the chamber is — see `core`.
      sitsX: (left + right) / 2,
      sitsY: (top + foot) / 2,
      fills: Math.max(wide / Math.max(1, midX), tall / Math.max(1, midY)),
    };
  }

  /** How wide the orbit grows when the menu is open: as wide as the
      window will hold, and never so narrow that the writing is not
      standing inside it. Found by halving the difference rather than
      by a formula, because the projection is not linear in the radius;
      and worked out again only when the menu or the window changes
      size, because that is the only time the answer can change. */
  let fitKey = "";
  function fitOrbit(box) {
    const key = [Math.round(box.width), Math.round(box.height), width, height].join(",");
    if (key === fitKey) return;
    fitKey = key;
    const needW = box.width / 2 + OPEN_CLEAR;
    const needH = box.height / 2 + OPEN_CLEAR;

    // How wide it is and where it has to stand are one question: how
    // far it must be moved depends on how wide it is, and how wide it
    // can be depends on where it stands. Three passes settle it.
    let want = RING * 1.2;
    const from = [coreOpen[0], coreOpen[1], MID];
    for (let pass = 0; pass < 3; pass++) {
      // The largest that still fits the window...
      let low = RING * 1.1, high = OPEN_MOST;
      for (let n = 0; n < 16; n++) {
        const mid = (low + high) / 2;
        if (reachOf(mid, from).fills > OPEN_FILL) high = mid; else low = mid;
      }
      want = low;

      // ...and if that is not enough to stand clear round the writing,
      // the smallest that is. Clearing the writing wins: an orbit a
      // little off the edge of the window still reads as an orbit, one
      // crossing the menu does not.
      const held = reachOf(want, from);
      if (held.wide < needW || held.tall < needH) {
        low = want; high = OPEN_MOST;
        for (let n = 0; n < 16; n++) {
          const mid = (low + high) / 2;
          const got = reachOf(mid, from);
          if (got.wide < needW || got.tall < needH) low = mid; else high = mid;
        }
        want = high;
      }
      want = Math.max(RING * 1.2, Math.min(OPEN_MOST, want));

      // And then moved by however far it is sitting off the middle.
      const sits = reachOf(want, from);
      const k = lens / MID;
      from[0] -= (sits.sitsX - midX) / k;
      from[1] -= (sits.sitsY - midY) / k;
    }
    openRing = want;
    coreOpen[0] = from[0];
    coreOpen[1] = from[1];
  }

  // ============================================================
  // THE FALL, AND THE HOLD
  // ============================================================
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

    // ONE ORBIT, WHATEVER STATE THE PAGE IS IN. Opening the menu makes
    // it wider and closing it makes it narrower, and that is the whole
    // of the difference — there is no second arrangement to be thrown
    // into and no step between two of them, which is what makes both
    // directions smooth for the same reason.
    const orbit = orbitNow();
    // How near the orbit the chamber takes hold — and never so far out
    // that it reaches the injectors themselves. The orbit widens a
    // long way when the menu opens, and with it the distance it takes
    // hold at; unchecked, that swallowed each stream where it left and
    // there was nothing between the corner and the orbit to look at.
    const takes = Math.min(orbit * CATCH_MUL, nearestSource * CATCH_KEEP);

    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];

      if (speck.wait > 0) { speck.wait -= dt; continue; }
      speck.age += dt;
      if (speck.age > speck.life) { launch(speck); continue; }

      // Drawn towards the middle, harder the nearer it is — softened
      // close in, or a particle passing through the very middle is
      // thrown out at a speed nothing else on the page is moving at.
      const dx = core[0] - speck.x, dy = core[1] - speck.y, dz = core[2] - speck.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      const pull = (PULL / (r2 + SOFT * SOFT)) * dt;
      speck.vx += (dx / (r || 1)) * pull;
      speck.vy += (dy / (r || 1)) * pull;
      speck.vz += (dz / (r || 1)) * pull;

      // THE ROW BEING POINTED AT, read off against the orbit: the
      // stretch of it level with that row takes the cool accent and is
      // held a little wider, so the orbit swells where the row is.
      // Nothing leaves the orbit — it is a reading, not a reaching.
      let read = 0;
      if (drawTo && speck.z > NEAR) {
        const sy = midY + speck.y * (lens / speck.z);
        read = 1 - Math.min(1, Math.abs(sy - drawTo.y) / READ_SPAN);
        if (read > 0) {
          read *= read;
          speck.warm = Math.max(speck.warm, read);
        } else read = 0;
      }

      // CAUGHT. Out in the dark a particle simply falls, which is what
      // keeps the two streams reading as streams; within reach of the
      // orbit the chamber takes hold and does four things at once, and
      // it needs all four. It turns it the way the orbit runs, up to
      // the speed that would carry it round and no further; it holds
      // it to the orbit's radius, so what gathers stands AROUND the
      // writing rather than piling up behind it; it takes the fall out
      // of it — the radial part of its travel only, never the
      // going-round part, which is the difference between an orbit
      // settling and everything grinding to a halt; and it presses it
      // flat onto the orbit's own plane.
      if (r < takes) {
        const hold = 1 - r / takes;
        const ux = dx / (r || 1), uy = dy / (r || 1), uz = dz / (r || 1);

        runsAt(-ux, -uy, -uz, way);
        const tn = Math.hypot(way[0], way[1], way[2]) || 1;
        const tx = way[0] / tn, ty = way[1] / tn, tz = way[2] / tn;

        const round = Math.sqrt(PULL / Math.max(1, r));
        const going = speck.vx * tx + speck.vy * ty + speck.vz * tz;
        if (going < round) {
          const turn = Math.min(round - going, round * hold * dt * 3.6);
          speck.vx += tx * turn;
          speck.vy += ty * turn;
          speck.vz += tz * turn;
        }

        const want = orbit + READ_SWELL * read;
        const off = (r - want) * RING_K * hold * dt;
        speck.vx += ux * off;
        speck.vy += uy * off;
        speck.vz += uz * off;

        const fall = speck.vx * ux + speck.vy * uy + speck.vz * uz;
        const ease = Math.min(0.9, SETTLE * hold * dt);
        speck.vx -= ux * fall * ease;
        speck.vy -= uy * fall * ease;
        speck.vz -= uz * fall * ease;

        // And flattened onto the orbit's own plane — see FLAT.
        const along = (speck.x - core[0]) * AXIS[0] + (speck.y - core[1]) * AXIS[1] +
                      (speck.z - core[2]) * AXIS[2];
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
      if (hasHand) {
        const k = lens / Math.max(NEAR, speck.z);
        const reach = HAND_PX / k;
        const hx = speck.x - (handX - midX) / k;
        const hy = speck.y - (handY - midY) / k;
        const off = Math.hypot(hx, hy);
        if (off < reach) {
          const close = 1 - off / reach;
          const shove = (HAND_PUSH * close * close * dt) / (off || 1);
          speck.vx += hx * shove;
          speck.vy += hy * shove;
          speck.warm = Math.max(speck.warm, close);
        }
      }
      speck.warm *= 1 - Math.min(1, dt * 1.6);

      const slow = 1 - Math.min(0.5, DRAG * dt);
      speck.vx *= slow; speck.vy *= slow; speck.vz *= slow;

      const fast = Math.hypot(speck.vx, speck.vy, speck.vz);
      if (fast > MAX_V) {
        const cap = MAX_V / fast;
        speck.vx *= cap; speck.vy *= cap; speck.vz *= cap;
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
    const orbit = orbitNow();

    // THE ORBIT'S OWN PATH. The particles are the orbit, but a fine
    // line through where they are going is what makes it legible AS an
    // orbit rather than as a drift — in a still frame, and at the
    // moment a stream is arriving, which is exactly when it is hardest
    // to see. It is split at the middle of the chamber like everything
    // else here: the near half is drawn on the front canvas, over the
    // writing, and the far half behind it, so the path itself says
    // which way round the lens is tipped.
    const ROUND = 128;
    let ink = null, was = null;
    for (let n = 0; n <= ROUND; n++) {
      const at = (n / ROUND) * Math.PI * 2;
      onOrbit(at, orbit, spot);
      const p = to(spot[0], spot[1], spot[2]);
      if (!p) { if (ink) { ink.stroke(); ink = null; } was = null; continue; }
      const on = spot[2] < MID ? paintFront : paint;
      if (on !== ink) {
        if (ink) ink.stroke();
        ink = on;
        ink.beginPath();
        ink.lineWidth = 1;
        ink.strokeStyle = rgba(STEEL, PATH_INK);
        ink.moveTo(was ? was.x : p.x, was ? was.y : p.y);
      }
      ink.lineTo(p.x, p.y);
      was = p;
    }
    if (ink) ink.stroke();

    // Ticked round it every thirtieth of a turn, the way the rest of
    // the site rules something it is measuring.
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, PATH_INK * 0.85);
    paint.beginPath();
    for (let n = 0; n < 30; n++) {
      const at = (n / 30) * Math.PI * 2;
      onOrbit(at, orbit * 0.975, spot);
      const a = to(spot[0], spot[1], spot[2]);
      onOrbit(at, orbit * 1.025, spot);
      const b = to(spot[0], spot[1], spot[2]);
      if (!a || !b) continue;
      paint.moveTo(a.x, a.y);
      paint.lineTo(b.x, b.y);
    }
    paint.stroke();

    // THE ROW BEING POINTED AT, called out against the orbit: a leader
    // from each end of it running out to the window, with a tick where
    // it lands. The stretch of orbit level with it has already taken
    // the cool accent and swelled — this is what says which row it is
    // reading.
    if (drawTo && spread > 0.4) {
      const lit = 0.55 * spread;
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(INK, lit);
      const y = Math.round(drawTo.y) + 0.5;
      [[drawTo.left - 18, 28], [drawTo.right + 18, width - 28]].forEach((run) => {
        paint.beginPath();
        paint.moveTo(run[0], y);
        paint.lineTo(run[1], y);
        paint.moveTo(run[1], y - 6);
        paint.lineTo(run[1], y + 6);
        paint.stroke();
      });
    }

    // The injectors: a registration square at each, and a leader along
    // the way its own stream leaves — aimed at the place on the orbit
    // that stream is fired at, not at the middle, because that is
    // where it is actually going.
    stream.forEach((one, i) => {
      const p = to(one.x, one.y, one.z);
      if (!p) return;
      const size = 9;
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(STEEL, 0.5);
      paint.strokeRect(Math.round(p.x - size / 2) + 0.5, Math.round(p.y - size / 2) + 0.5, size, size);

      stand[0] = one.x - core[0];
      stand[1] = one.y - core[1];
      stand[2] = one.z - core[2];
      entryFor(stand, orbit, spot);
      const join = to(spot[0], spot[1], spot[2]);
      if (join) {
        const dx = join.x - p.x, dy = join.y - p.y;
        const far = Math.hypot(dx, dy) || 1;
        paint.strokeStyle = rgba(STEEL, 0.16);
        paint.beginPath();
        paint.moveTo(p.x + (dx / far) * 12, p.y + (dy / far) * 12);
        paint.lineTo(p.x + (dx / far) * Math.min(far - 8, 64), p.y + (dy / far) * Math.min(far - 8, 64));
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
    for (let b = 0; b < BANDS; b++) out.push({ tails: [], dots: [] });
    return out;
  }
  const behind = makeBands();
  const ahead = makeBands();
  // The ranging squares round whatever the page is answering with.
  // They are strokes rather than fills and they all want the same
  // weight, so they are kept out of the bands and drawn in one pass.
  const rangedBehind = [];
  const rangedAhead = [];

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
      if (speck.wait > 0) continue;
      const p = to(speck.x, speck.y, speck.z);
      if (!p) continue;
      if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) {
        speck.pk = 0;
        continue;
      }

      const life = Math.min(1, speck.age / 0.9) * Math.min(1, (speck.life - speck.age) / 2.2);
      const near = Math.min(1, 26 / speck.z);
      const lit = life * near * (0.4 + speck.warm * 0.6);
      if (lit < 0.02) { speck.pk = 0; continue; }

      // Nearer than the middle of the chamber goes on the front
      // canvas, over the writing; further away goes behind it.
      const nearer = speck.z < MID;
      const bands = nearer ? ahead : behind;
      let band = Math.floor(lit * BANDS);
      if (band > BANDS - 1) band = BANDS - 1;
      if (band < 0) band = 0;
      const into = bands[band];

      // Squares, drawn on whole pixels so they stay squares: at this
      // size a rectangle laid across a pixel boundary comes out as a
      // soft blob, which is the one thing these must not look like.
      const size = Math.max(1, Math.round(Math.min(6, speck.size * p.k * SPECK)));
      const x = Math.round(p.x - size / 2), y = Math.round(p.y - size / 2);
      if (speck.pk) into.tails.push(speck.px, speck.py, p.x, p.y);
      into.dots.push(x, y, size);

      // And ranged, if the page is answering with it. Half a pixel off
      // the whole ones, which is where a one-pixel stroke comes out
      // sharp rather than as two grey ones.
      if (speck.warm > MARK_AT) {
        const wide = size + MARK_OFF * 2;
        (nearer ? rangedAhead : rangedBehind).push(
          Math.round(x - MARK_OFF) + 0.5, Math.round(y - MARK_OFF) + 0.5, wide);
      }

      const back = to(speck.x - speck.vx * TAIL, speck.y - speck.vy * TAIL,
                      Math.max(NEAR + 0.1, speck.z - speck.vz * TAIL));
      speck.px = back ? back.x : p.x;
      speck.py = back ? back.y : p.y;
      speck.pk = p.k;
    }

    [[behind, paint, rangedBehind], [ahead, paintFront, rangedAhead]]
      .forEach(([bands, ink, ranged]) => {
      for (let b = 0; b < bands.length; b++) {
        const band = bands[b];
        if (!band.tails.length && !band.dots.length) continue;
        const lit = (b + 0.5) / BANDS;
        const tone = INK;
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

      if (ranged.length) {
        ink.strokeStyle = rgba(INK, MARK_INK);
        ink.lineWidth = 1;
        ink.beginPath();
        for (let n = 0; n < ranged.length; n += 3) {
          ink.rect(ranged[n], ranged[n + 1], ranged[n + 2], ranged[n + 2]);
        }
        ink.stroke();
        ranged.length = 0;
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
    if (REDUCE_MOTION) {
      // Nothing is watched happening: the orbit is settled once into
      // whichever size the page is now asking for, and then left
      // exactly as it is.
      const want = opened ? 1 : 0;
      if (spread !== want) {
        spread = want;
        core[0] = coreOpen[0] * spread;
        core[1] = coreOpen[1] * spread;
        for (let n = 0; n < 240; n++) move(1 / 30);
      }
    } else {
      if (stepAt >= 0) {
        const gone = Math.min(1, (now - stepAt) / OPEN_MS);
        spread = stepFrom + (stepTo - stepFrom) * smoother(gone);
        if (gone >= 1) { spread = stepTo; stepAt = -1; }
      }
      clock += dt;
      core[0] = coreOpen[0] * spread;
      core[1] = coreOpen[1] * spread;
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
