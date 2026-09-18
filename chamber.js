// ============================================================
// THE CHAMBER (categories/favorites.html only)
//
// The favourites live inside a CHAMBER: two injectors, at OPPOSITE
// CORNERS of the window — top right and bottom left — firing a fine
// stream of particles at a slant across it on white. What the streams join is an ORBIT — tilted
// well off square to the window, so it reads as a lens rather than as
// a circle drawn on the page. It is the theories drawing's world
// turned inside out: the same particles and the same instrument marks,
// printed as ink on white instead of white on near-black — except that
// this one spends no accent at all. It said what it meant in colour
// twice (that drawing's cool blue, then brass) and then in weight, and
// each of them was asked for gone: what it answers with now is a LINE
// DRAWN — a web strung between whatever the cursor is near — and the
// orbit swelling where a row is being read.
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
//            stretch of orbit level with it swell outward — a reading
//            of that row against the orbit, not a reaching for it, and
//            the whole of what the drawing does about it. There used
//            to be a leader run out to each side of the window as
//            well; the owner asked for those gone.
//
// The open state used to be something else entirely: the particles
// were thrown out to the borders of the window and held there as a
// rectangle. That put two different things on one page with a costly
// step between them, and the step was the most awkward moment on it.
// One thing that grows is smooth in both directions for the same
// reason, and there is no `EDGE`, no seat and no border in this file
// any more.
//
// A few things are worth knowing before changing any of it:
//
//   It is a real fall, not a path. Every particle is thrown at the
//   orbit and pulled in by the middle; the chamber takes hold of it
//   only once it is near. Writing the curves by hand instead gives a
//   pattern, and a pattern is something you can see repeat. Neither
//   launch speed is ever enough to LEAVE, so a particle the orbit
//   misses comes back at it instead of crossing the window and going
//   out of it for good.
//
//   What it holds is a DISC and not a ring: each particle stands at
//   its own radius within `DISC` of the orbit's own line, and a little
//   off its plane, so the orbit has a width and a thickness. Held to
//   one exact radius they all pile onto the same hairline, which is
//   too dense to read as particles at all.
//
//   A stream is aimed AT THE ORBIT, not at the middle (`ENTRY_GRAZE`).
//   Where the injector stands round the orbit is carried forward along
//   the way the orbit runs, and the stream is fired at there — so it
//   comes in at a slant and arrives already going the way the orbit
//   goes. Aimed at the middle, every stream dived at the centre and
//   had to be turned through most of a right angle to join, which is
//   what read as chaos.
//
//   The two injectors stand at OPPOSITE CORNERS — top right and
//   bottom left. Four, one to every corner, fired at each other across
//   the middle and read as a collision; two survive being opposite
//   only because a stream is aimed at the orbit rather than at the
//   middle, so both come in on a tangent and go round the same way and
//   fall in behind each other. They are placed by working back from
//   the point of the window they are meant to sit at, at their own
//   depths, so they stay put at any window size — and they take turns
//   being the quick one (`PACE`), so neither is always the fast one.
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
//   The step between the two states is ONE MOVEMENT. The drawing and
//   the writing are eased on one curve of one length, written in
//   `style.css` as `--chamber-step` and solved here (`STEP_EASE`);
//   what the orbit is holding is CARRIED out with it rather than
//   dragged out by the spring; and the menu goes back into the word on
//   the same step rather than being taken off the page in one frame.
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

  // --- THE INJECTORS. Two of them, at OPPOSITE CORNERS of the window.
  // Four, one to a corner, fired at each other across the middle and
  // the result read as a collision rather than as an orbit.
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
  const PER_STREAM = 400;      // particles in the air from each of them
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
  // AND BOTH ARE KEPT UNDER THE SPEED IT WOULD TAKE TO LEAVE, which
  // is what stops a stream sailing past the orbit and off across the
  // window into nothing. Getting away from the middle for good takes
  // root-two times the speed of going round at the same distance, and
  // the two of these together used to come to more than that: a
  // particle that was not caught on its way past was not on a long
  // way round, it was gone, and what that looked like was a wide band
  // of specks travelling from one corner of the window to the far
  // edge and out of it. Under that speed there is nowhere else to go:
  // a particle the orbit misses swings round and comes back at it.
  const FALL = [0.95, 1.15];   // how hard it is sent at the orbit
  const SWING = [0.45, 0.62];  // and how much sideways it leaves with
  const CATCH_MUL = 2.2;       // how near the orbit the chamber takes hold
  const CATCH_KEEP = 0.92;     // but never nearer the injectors than this much
                               // of the way to them — see `takes` in move()
  // HOW WIDE THE GRIP IS, as a FRACTION of the capture band: the
  // outermost stretch of it, over which the hold comes on from nothing
  // to full. Anything nearer the orbit than that is held at full
  // strength.
  //
  // Spreading the hold across the whole band instead is what the
  // strays were: a particle a little wide of the orbit was barely
  // being pulled at all and rode round out there for a long time.
  // Narrowing the band ITSELF does fix that and breaks something else
  // — the widening throws particles outward hard, and with a narrow
  // band they sail straight out of it and the orbit empties. So the
  // reach stays wide and only the ramp is narrowed.
  //
  // A fraction of the band and not a flat distance in units, because
  // the band is four units wide closed and nearly ten open: written
  // flat at 5 the hold never reached full strength at all in the
  // closed state — it was 0.84 ON the orbit, where it wants to be 1.
  const CATCH_GRIP = 0.45;
  // THE AXIS THE CHAMBER TURNS ABOUT, and so the way the orbit is
  // tilted: the orbit lies square across it, and how much of the axis
  // points at you is exactly how squashed it comes out. Straight at
  // you is a circle; upright is a smear seen edge-on. This is well off
  // both — a lens, tipped away from you, with a near side and a far
  // side.
  const SWIRL = [0.2, 0.86, 0.46];
  const RING = 5.0;            // the orbit, closed — where the MIDDLE of the band stands
  const RING_K = 40;           // how firmly a particle is held to it
  // HOW MUCH LEEWAY A PARTICLE HAS FROM THE ORBIT'S OWN LINE, in and
  // out, as a fraction of whatever radius the orbit stands at — so it
  // is a DISC with a thickness to it and not a wire. Held to one exact
  // radius instead, every speck the chamber caught piled onto the same
  // hairline and what gathered was too dense to read as particles at
  // all: a drawn ellipse with a crust on it.
  //
  // A fraction and not a flat distance, because the orbit is five
  // units wide closed and a dozen open, and a band that reads as a
  // band closed is a hairline again once the menu is open.
  //
  // Each particle's own place in the band is rolled when it is sent,
  // and rolled from TWO throws rather than one, so the band is
  // crowded along the orbit's own line and thins towards its edges —
  // spread evenly instead, the disc has two hard rims and reads as
  // two rings.
  const DISC = 0.14;           // how far in and out of the orbit a particle may stand
  const DISC_LIFT = 0.05;      // and how far off its plane, so the disc has a thickness
  const SETTLE = 4.6;          // and how quickly the fall is taken out of it
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
  // AND HOW LONG IT LIVES. Most of a life is spent going round and
  // only the first few seconds of it travelling, so this is really
  // how full the orbit is against how much is still in the streams:
  // at nine seconds a quarter of everything the page had was in the
  // air between a corner and the orbit at any moment.
  const LIFE = [11, 19];       // seconds in the air before it is sent again
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
  //
  // THIS LENGTH AND THAT CURVE ARE ALSO THE STYLESHEET'S. The word's
  // font-size and the menu's own arrival and leaving are written
  // against `--chamber-step-ms` and `--chamber-step` in `style.css`,
  // and `STEP_EASE` below is that same bezier solved here. Change one
  // and change the other, or the drawing and the writing set off at
  // different speeds and arrive at different moments — which is what
  // they used to do, and no amount of tuning either on its own made
  // that read as one movement.
  //
  // Taken at a walk, and lengthened twice for it: 1.7s, then 1.9s,
  // now this. A movement this big reads as smoother the longer it is
  // given, up to the point where it reads as slow — the owner has
  // asked for smoother twice and the drawing itself is already even
  // (measured: every frame of the step comes in at 16.7ms, none over
  // 20), so time is what is left to give it.
  const OPEN_MS = 2200;        // how long the step between the two states takes
  // AND HOW LONG THE MENU ITSELF TAKES TO GO, which is less: it is
  // back inside the word well before the orbit has finished narrowing.
  // It is taken off the page at the end of that rather than at the end
  // of the step, and it has to be, because the room kept clear for it
  // goes with it — left until the end, the orbit would by then have
  // come in far enough to have specks standing inside that room, and
  // they would all appear in the one frame it was dropped. This must
  // stay the length of `chamber-shut` in `style.css`.
  const SHUT_MS = 1250;
  const OPEN_CLEAR = 46;       // how far outside the writing the orbit stands
  const OPEN_FILL = 0.96;      // how much of the window it is allowed to fill
  const OPEN_MOST = 22;        // and how wide it is ever allowed to grow

  // --- THE WEB: what the cursor does.
  //
  // Wherever the hand is, the specks near it are JOINED UP — a small
  // net drawn between whichever of them happen to be near each other,
  // over and above the hole it pushes in them. It is deliberately not
  // steady: each link comes and goes on its own clock and is drawn a
  // hair off the specks it joins, so the net is always a slightly
  // different net and never reads as a figure somebody drew.
  //
  // Each speck carries at most WEB_EACH lines, and that cap is the
  // whole difference between a net and a scribble. Joining every pair
  // within reach instead is fine where the specks are loose, but the
  // near rim of the orbit is a dense line of them: every one there is
  // within reach of a dozen others, and what came out was a solid fan
  // of hundreds of strokes converging on a few points.
  //
  // Nothing is drawn heavier or tinted anywhere on this page any more.
  // The page said what it meant by weight and by colour in turn and
  // neither held up; this is the drawing answering in lines, which is
  // what the drawing is made of.
  const WEB_REACH = 165;       // how near the hand a speck joins the web, in pixels
  const WEB_LINK = 58;         // and how near each other two of them are joined
  const WEB_MOST = 96;         // the most that are ever taken into it
  const WEB_EACH = 4;          // the most lines any ONE of them carries
  const WEB_FLICK = [1.6, 5];  // how fast a link comes and goes
  const WEB_SKEW = 2.6;        // how far off the specks a line is drawn
  const WEB_INK = 0.4;         // and how heavily

  // --- and what pointing at a row does to the orbit
  //
  // It used to CINCH: the sides left the border and leant in towards
  // the row. That read as the drawing being pulled out of shape. What
  // it does now is READ the row off against the orbit — the stretch of
  // orbit level with it swells outward, and nothing else happens.
  // Nothing leaves the orbit. (On the page's own side of it, the rule
  // under that row draws back from the right; that is in `style.css`.)
  //
  // It used to be called out with a LEADER as well — a line run from
  // each end of the row out to the side of the window with a tick
  // where it landed. The owner asked for those gone, so they are gone
  // rather than switched off: the swell is the reading now.
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
  // The same reading the contact sheet's removed Favorites view took off its
  // own entries: the chapters are the different data-chapter values in
  // the order they first appear, and each favourite carries the date
  // it is filed under. Naming them, ordering them and adding to them
  // are all HTML edits.
  // ============================================================
  /** The dates a chapter covers, earliest first. They are written
      dd.mm.yyyy, which does not sort as text, so they are turned round
      to compare. Read in page order the range came out backwards —
      "14.03.2024 – 27.06.2023" — which is not a range at all. */
  function spanOf(items) {
    const dates = items.map((item) => item.date).filter(Boolean).slice();
    const key = (d) => d.split(".").reverse().join("");
    dates.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    return dates.length ? dates[0] + " – " + dates[dates.length - 1] : "";
  }

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

  // WHAT EACH CHAPTER IS, in the page's own markup — one block per
  // chapter, matched by `data-chapter`. A chapter with nothing written
  // for it simply shows its cards, so this is optional and the page
  // works without any of it.
  const notes = {};
  document.querySelectorAll(".gallery-chapter[data-chapter]").forEach((block) => {
    notes[(block.dataset.chapter || "").trim()] = block.innerHTML.trim();
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
  where.textContent = "Favourites";
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
    '<span class="chamber-word-name">Favourites</span>' +
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
  // The column only ever holds the chapters now — opening one opens a
  // page of its own rather than a second level in here — so there is
  // nothing in this menu to step back FROM, and no back button in it.
  head.innerHTML = '<p class="chamber-spec"></p>';
  panel.appendChild(head);
  const spec = head.querySelector(".chamber-spec");

  const column = document.createElement("div");
  column.className = "chamber-column";
  panel.appendChild(column);

  // The chapters, in the column.
  const chapterList = document.createElement("div");
  chapterList.className = "chamber-level";
  column.appendChild(chapterList);

  chapters.forEach((chapter, i) => {
    const span = spanOf(chapter.items);
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
      (span ? "   ·   " + span : "");
    row.querySelector(".chamber-name").textContent = chapter.name;
    chapterList.appendChild(row);
    chapter.row = row;

  });

  // A CHAPTER'S OWN PAGE. Built once and empty; `layChapter` fills it.
  // It stands over the whole window rather than inside the chamber, so
  // the black it brings is the page's and the chamber underneath is
  // left exactly as it was to come back to.
  const chapterPage = document.createElement("div");
  chapterPage.className = "chapter-page dark-surface";
  chapterPage.hidden = true;
  chapterPage.innerHTML =
    '<div class="chapter-sheet">' +
      '<button type="button" class="chapter-back">' +
        '<span aria-hidden="true">&#8592;</span> Favourites' +
      "</button>" +
      '<p class="chapter-kicker">Favourites</p>' +
      '<h2 class="chapter-name"></h2>' +
      '<p class="chapter-spec"></p>' +
      '<div class="chapter-note"></div>' +
      '<div class="chapter-cards"></div>' +
    "</div>";
  const chapterName = chapterPage.querySelector(".chapter-name");
  const chapterSpec = chapterPage.querySelector(".chapter-spec");
  const chapterNote = chapterPage.querySelector(".chapter-note");
  const chapterCards = chapterPage.querySelector(".chapter-cards");
  chapterPage.querySelector(".chapter-back")
    .addEventListener("click", () => closeChapter());
  // Inside the chamber rather than loose in the page. Every direct child
  // of <body> is caught by the rule that dims the page behind the menu,
  // which outranks anything written for a new element — the note in
  // style.css says so and it has caught features before. In here it is
  // dimmed with the rest of the page, which is what should happen.
  shell.appendChild(chapterPage);

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
  let hotRow = null;           // the row under the pointer, if any
  // The timed step between the two states — see OPEN_MS.
  let stepFrom = 0, stepTo = 0, stepAt = -1;
  // How wide the orbit grows when the menu is open. Worked out from
  // the menu's own box in clearing(), not set here.
  let openRing = RING * 1.9;
  // And where it stood last frame, so that what it is holding can be
  // carried out with it as it widens rather than dragged — see
  // `carried` in move().
  let wasOrbit = RING;
  // How far the plate is standing above the middle of the window, and
  // which state it was written for — see `clearing()`. Kept so that it
  // is written once per step and then held.
  let lifted = 0;
  let liftFor = null;
  /** The gap the stylesheet leaves between the word and the menu,
      asked for rather than written here as well. */
  function gapUnderWord() {
    const said = window.getComputedStyle(panel).marginTop;
    const gap = parseFloat(said);
    return isNaN(gap) ? 10 : gap;
  }
  const now = () =>
    (window.performance && window.performance.now ? window.performance.now() : Date.now());
  /** THE CURVE THE STEP IS EASED ON — and the very one the stylesheet
      eases the lettering and the menu on, solved here so that the
      particles travel on it too.

      They used to be eased on two different curves of the same length:
      the drawing on a symmetrical S and the writing on the site's own
      `--menu-ease`, which is quicker off the mark and has a long tail.
      Over the same 1.7 seconds that is two things setting off at
      different speeds and arriving at different moments, and no amount
      of tuning either one on its own could make that read as one
      movement. So there is one curve now, written once in CSS as
      `--chamber-step` and solved here from the same four numbers: flat
      at both ends, with a long settle, so there is no moment you can
      point at where the step starts or where it stops.

      Cubic beziers are given as x against t, so what x is worth has to
      be solved for. Newton from x itself gets there in a few goes
      over a curve this gentle. */
  function easing(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const alongX = (t) => ((ax * t + bx) * t + cx) * t;
    const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let n = 0; n < 8; n++) {
        const off = alongX(t) - x;
        if (Math.abs(off) < 1e-6) break;
        const d = slopeX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= off / d;
      }
      return ((ay * t + by) * t + cy) * t;
    };
  }
  // Gentle on purpose. The steeper standard curves cover half the
  // step in a quarter of its length, which on a movement this big and
  // this slow is a surge and then a wait; this one is nearly even
  // through the middle, with the settle a little longer than the
  // setting off.
  const STEP_EASE = easing(0.45, 0, 0.45, 1);   // = --chamber-step in style.css

  function showLevel() {
    chapterList.hidden = false;
    spec.textContent =
      "FAVOURITES   ·   " + numbered(chapters.length - 1) + " CHAPTERS   ·   " +
      numbered(entries.length - 1) + " TOTAL ENTRIES";
    hotRow = null;
  }

  // ============================================================
  // THE BURST, AND A CHAPTER'S OWN PAGE
  //
  // Opening a chapter used to put its favourites in the column in the
  // chapters' place. The owner asked for a page of its own, and for the
  // way into it to be the chamber turning itself inside out:
  //
  //   the menu shuts, a second passes, the particles wind in towards
  //   the middle — turning faster the closer they get — meet there,
  //   and are thrown out again. The page is black behind them, and the
  //   chapter is standing on it.
  //
  // WHY IT IS DRIVEN BY THE CLOCK AND NOT BY THE PHYSICS. Every other
  // movement on this page comes out of `move()`, which holds particles
  // on the orbit with a spring. A spring cannot be made to meet at a
  // point — that is what it exists to prevent — so for the length of
  // the burst `move()` is not called at all and the particles are
  // placed outright. They are put back in the physics' hands when the
  // chapter is closed, by being launched again from the injectors.
  // ============================================================
  const BURST_WAIT = 1.0;      // the still second after the menu has gone
  const BURST_IN = 1.5;        // winding in to the middle
  const BURST_MET = 0.14;      // met there, for an instant
  const BURST_OUT = 0.62;      // and thrown out again
  const BURST_SPIN = 2.6;      // how much it turns as it winds in
  const BURST_CLOSE = 0.01;    // how much of its distance is left at the end of that
  const BURST_THROW = 42;      // how far it is thrown

  /** Null, or the burst that is running / the chapter that is open. */
  let burst = null;
  const chapterShowing = () => Boolean(burst);

  function openChapter(i) {
    if (burst) return;
    burst = { chapter: i, phase: "shut", at: 0 };
    shell.classList.add("bursting");
    // The menu goes first, on its own step, and the second of stillness
    // the owner asked for is counted from the end of THAT rather than
    // from the press — so it is a second of a still page, which is what
    // makes it read as a pause rather than as a wait.
    if (opened) setOpen(false, false);
    if (REDUCE_MOTION) { burst.phase = "open"; layChapter(i); return; }
  }

  function closeChapter() {
    if (!burst) return;
    const was = burst;
    burst = null;
    shell.classList.remove("bursting", "burst-out");
    page.classList.remove("chapter-open");
    chapterPage.hidden = true;
    // Back into the physics' hands: every particle is fired again from
    // its own injector, staggered, so the chamber fills the way it does
    // when the page opens rather than snapping back into a finished
    // ring.
    specks.forEach((speck) => {
      launch(speck);
      speck.wait = random() * between(LIFE);
    });
    const row = chapters[was.chapter] && chapters[was.chapter].row;
    if (row) { setOpen(true, false); row.focus(); }
  }

  /** Winding in: turning about the middle and closing on it, and
      turning faster the nearer it gets — `p` runs 0 to 1. */
  function burstIn(dt, p) {
    const shrink = Math.pow(BURST_CLOSE, dt / BURST_IN);
    const turn = BURST_SPIN * dt * (0.3 + p * p * 2.4);
    const cos = Math.cos(turn), sin = Math.sin(turn);
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      // A particle still waiting to be fired joins this one rather than
      // arriving in the middle of it.
      if (speck.wait > 0) { speck.wait = 0; launch(speck); speck.wait = 0; }
      const x = speck.x - core[0], y = speck.y - core[1], z = speck.z - core[2];
      speck.x = core[0] + (x * cos - y * sin) * shrink;
      speck.y = core[1] + (x * sin + y * cos) * shrink;
      speck.z = core[2] + z * shrink;
      speck.vx = 0; speck.vy = 0; speck.vz = 0;
    }
  }

  /** Thrown out: every particle along its own line out of the middle,
      which is rolled once when they meet so that what comes apart is
      not the pattern that went in. */
  function burstOut(p) {
    const far = BURST_THROW * (1 - Math.pow(1 - p, 2.2));
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      if (!speck.out) continue;
      speck.x = core[0] + speck.out[0] * far;
      speck.y = core[1] + speck.out[1] * far;
      speck.z = core[2] + speck.out[2] * far;
    }
  }

  function throwLines() {
    for (let n = 0; n < specks.length; n++) {
      const a = random() * Math.PI * 2;
      const b = Math.acos(2 * random() - 1);
      specks[n].out = [
        Math.sin(b) * Math.cos(a),
        Math.sin(b) * Math.sin(a),
        Math.cos(b) * 0.55,
      ];
    }
  }

  /** The chapter, on the page. Built from the page's own markup every
      time, so a chapter renamed or re-filed in the HTML is right here
      without anything else being touched. */
  function layChapter(i) {
    const chapter = chapters[i];
    const span = spanOf(chapter.items);
    chapterName.textContent = chapter.name;
    chapterSpec.textContent =
      numbered(chapter.items.length - 1) + " ENTRIES" + (span ? "   ·   " + span : "");

    const note = notes[chapter.name];
    chapterNote.innerHTML = "";
    if (note) chapterNote.innerHTML = note;
    chapterNote.hidden = !note;

    chapterCards.innerHTML = "";
    chapter.items.forEach((item, n) => {
      const card = document.createElement("a");
      card.className = "chapter-card";
      card.href = item.href;
      card.innerHTML =
        '<span class="chapter-card-no"></span>' +
        '<span class="chapter-card-name"></span>' +
        '<span class="chapter-card-date"></span>' +
        '<span class="chapter-card-go" aria-hidden="true">OPEN &#8594;</span>';
      card.querySelector(".chapter-card-no").textContent = numbered(n);
      card.querySelector(".chapter-card-name").textContent = item.name;
      card.querySelector(".chapter-card-date").textContent = item.date;
      card.style.setProperty("--n", String(n));
      chapterCards.appendChild(card);
    });

    chapterPage.hidden = false;
    page.classList.add("chapter-open");
    // The frame after it joins the page, so the cards have something to
    // arrive from.
    requestAnimationFrame(() => chapterPage.classList.add("here"));
  }

  /** One step of the burst. Returns true while it is running the
      particles itself, so `frame` knows to leave `move` alone. */
  function stepBurst(dt) {
    if (!burst || burst.phase === "open") return Boolean(burst);
    burst.at += dt;
    if (burst.phase === "shut") {
      // As long as the menu takes to fade back into the word.
      if (burst.at >= SHUT_MS / 1000) { burst.phase = "wait"; burst.at = 0; }
      return false;
    }
    if (burst.phase === "wait") {
      if (burst.at >= BURST_WAIT) { burst.phase = "in"; burst.at = 0; }
      return false;
    }
    if (burst.phase === "in") {
      const p = Math.min(1, burst.at / BURST_IN);
      burstIn(dt, p);
      if (p >= 1) { burst.phase = "met"; burst.at = 0; throwLines(); }
      return true;
    }
    if (burst.phase === "met") {
      if (burst.at >= BURST_MET) {
        burst.phase = "out";
        burst.at = 0;
        shell.classList.add("burst-out");
        layChapter(burst.chapter);
      }
      return true;
    }
    // out
    const p = Math.min(1, burst.at / BURST_OUT);
    burstOut(p);
    if (p >= 1) { burst.phase = "open"; burst.at = 0; }
    return true;
  }

  // The menu is not taken off the page the moment it is closed — it
  // fades back into the word first, and goes at the end of that (see
  // `setOpen` and `SHUT_MS`). This is that wait, kept so that pressing
  // the word again half way through simply turns the step round rather
  // than leaving a panel to disappear on its own a moment later.
  let shutting = 0;

  function setOpen(next, andFocus) {
    if (opened === next) return;
    opened = next;
    word.setAttribute("aria-expanded", String(opened));
    cue.textContent = opened ? "Collapse" : "Expand";
    plate.classList.toggle("open", opened);
    if (shutting) { window.clearTimeout(shutting); shutting = 0; }
    stepFrom = spread;
    stepTo = opened ? 1 : 0;
    stepAt = now();
    hotRow = null;
    if (!opened) {
      // THE MENU LEAVES ON THE SAME STEP THE ORBIT NARROWS ON. It used
      // to be taken off the page in the one frame the word was
      // pressed, so the writing went instantly and the orbit then
      // spent nearly two seconds coming back in after it — the one
      // half of this page's only movement that was a cut. It fades and
      // rises back into the word instead, and is taken off the page at
      // the end of THAT (`SHUT_MS`) — while the orbit is still
      // narrowing, and while it is still wide enough that dropping the
      // room kept clear for the menu uncovers nothing.
      //
      // It answers nothing while it is going: inert to the hand and to
      // the keyboard alike, so there is nothing to press or tab into
      // in something that is on its way out.
      //
      // With animation turned off there is nothing to watch it go, so
      // it simply goes: held on the page for a moment it would only be
      // sitting in a room the orbit has already narrowed inside of.
      const off = () => {
        shutting = 0;
        plate.classList.remove("shutting");
        panel.hidden = true;
        showLevel();
      };
      panel.inert = true;
      panel.setAttribute("aria-hidden", "true");
      if (REDUCE_MOTION) off();
      else {
        plate.classList.add("shutting");
        shutting = window.setTimeout(off, SHUT_MS);
      }
      if (andFocus) word.focus();
    } else {
      plate.classList.remove("shutting");
      panel.inert = false;
      panel.removeAttribute("aria-hidden");
      panel.hidden = false;
      showLevel();
      if (andFocus) {
        const first = column.querySelector(".chamber-level:not([hidden]) .chamber-row");
        if (first) first.focus();
      }
    }
  }

  word.addEventListener("click", () => setOpen(!opened, true));
  chapters.forEach((chapter, i) => {
    // OPENING A CHAPTER IS THE BURST. It used to put that chapter's
    // favourites in the column in place of the chapters; the owner
    // asked for a page of its own instead, arrived at by the chamber
    // imploding and exploding. See "THE BURST" below.
    chapter.row.addEventListener("click", () => openChapter(i));
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
    if (e.key !== "Escape") return;
    // Out of a chapter first, then out of the menu.
    if (chapterShowing()) { closeChapter(); return; }
    if (!opened) return;
    setOpen(false, true);
  });

  // Anywhere off the writing puts it back, the same way the theories
  // drawing puts a set-out station back — the ring is the rest of the
  // page and pressing it is how you leave the menu.
  document.addEventListener("pointerdown", (e) => {
    // Nothing off the writing closes anything while a chapter is being
    // arrived at or is standing open — the page belongs to the chapter
    // then, and the way out of it is its own way back.
    if (burst) return;
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
        band: 0, lift: 0,
        age: 0,
        life: between(LIFE),
        size: 0.55 + random() * random() * 1.5,
        wait: random() * between(LIFE),
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
    // And where in the band it will stand once the chamber has hold
    // of it — its own, so the disc is a crowd of particles each going
    // round at its own radius rather than a queue along one line. Two
    // throws and not one: that crowds them along the orbit's own line
    // and thins them towards the edges of the band.
    speck.band = random() + random() - 1;
    speck.lift = (random() + random() - 1) * DISC_LIFT;
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
      through closing. (The panel stays on the page a little longer
      than the menu is open — it fades back into the word first — and
      it is its box that is asked for the whole of that time.) */
  function clearing() {
    const menu = panel.getBoundingClientRect();
    if (menu.width > 8 && menu.height > 8) fitOrbit(menu);

    // HOW FAR THE PLATE STANDS ABOVE THE MIDDLE OF THE WINDOW. The
    // menu hangs out of the flow under the word, so it is the word
    // alone that the plate centres — and lifting the plate by half of
    // what hangs below it is what centres the WORD AND THE MENU
    // TOGETHER, which is what anyone looks at once it is open.
    //
    // MEASURED OFF THE MENU ALONE, AND IN WHOLE FRACTIONS OF A PIXEL.
    // It used to be read as `panel.offsetTop + panel.offsetHeight -
    // plate.offsetHeight`, and all three of those are rounded to whole
    // pixels: the word's size is travelling the whole time the step
    // runs, so the plate's height changes every frame, and the two
    // roundings drifted against each other by a pixel. Every time they
    // did, this wrote a new lift, and every new lift restarted the
    // stylesheet's two-second ease from wherever the plate had got to
    // — so the word crept up and down under itself while it travelled.
    // The owner reported it on another machine: it is worse the
    // further a display's scaling is from whole pixels, which is why
    // it can be invisible on the machine it was written on.
    //
    // The menu's own height carries none of that: the panel's box is
    // the same however big the word is, and `getBoundingClientRect` is
    // not rounded. The gap is read from the stylesheet rather than
    // written here twice.
    const lift = opened && menu.height > 8
      ? Math.max(0, (menu.height + gapUnderWord()) / 2)
      : 0;
    // AND IT IS WRITTEN ONCE PER STEP, not whenever it has drifted.
    //
    // Opening or closing writes it immediately — that write is what
    // the plate travels on — and then it is HELD until the step is
    // over, however the page is measured in the meantime. The
    // stylesheet eases the plate over two seconds, and every new value
    // written into that restarts the ease from wherever the plate has
    // got to: a target that moves under a running ease is a word that
    // creeps up and down while it travels, which is what the owner
    // reported seeing on another machine. Anything that can move the
    // menu's box mid-step — a font arriving, a phone's address bar
    // sliding away, a scrollbar — did exactly that.
    //
    // Standing still, a change of more than a pixel is taken: that is
    // a window being resized or a chapter being opened, and the page
    // should follow it. Under a pixel is the page's own rounding.
    const forNow = opened;
    if (forNow !== liftFor || (stepAt < 0 && Math.abs(lift - lifted) > 1)) {
      liftFor = forNow;
      lifted = lift;
      plate.style.setProperty("--menu-lift", lift.toFixed(1) + "px");
    }
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
      // The largest that still fits the window — measured at the
      // OUTER edge of the band, since that is what actually runs off
      // the screen, and the clearance below at the inner one.
      let low = RING * 1.1, high = OPEN_MOST;
      for (let n = 0; n < 16; n++) {
        const mid = (low + high) / 2;
        if (reachOf(mid * (1 + DISC), from).fills > OPEN_FILL) high = mid; else low = mid;
      }
      want = low;

      // ...and if that is not enough to stand clear round the writing,
      // the smallest that is. Clearing the writing wins: an orbit a
      // little off the edge of the window still reads as an orbit, one
      // crossing the menu does not.
      const held = reachOf(want * (1 - DISC), from);
      if (held.wide < needW || held.tall < needH) {
        low = want; high = OPEN_MOST;
        for (let n = 0; n < 16; n++) {
          const mid = (low + high) / 2;
          const got = reachOf(mid * (1 - DISC), from);
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
    // Its height on the window, and nothing else: where the row
    // begins and ends was only ever wanted by the leaders that used to
    // be run out from it, and those are gone.
    drawTo = { y: (box.top + box.bottom) / 2 };
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
    // HOW FAR THE ORBIT ITSELF MOVED THIS FRAME. Whatever it is
    // holding is carried out with it by that much, and the radial
    // spring is left with nothing to do but the fine work — see
    // `carried` below.
    const grew = orbit - wasOrbit;
    wasOrbit = orbit;
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
        read = read > 0 ? read * read : 0;
      }

      // CAUGHT. Out in the dark a particle simply falls, which is what
      // keeps the two streams reading as streams; within reach of the
      // orbit the chamber takes hold and does four things at once, and
      // it needs all four. It turns it the way the orbit runs, up to
      // the speed that would carry it round and no further; it holds
      // it to its own radius in the band, so what gathers stands
      // AROUND the writing rather than piling up behind it; it takes
      // the fall out of it — the radial part of its travel only,
      // never the going-round part, which is the difference between an
      // orbit settling and everything grinding to a halt; and it
      // presses it flat onto its own leaf of the orbit's plane.
      if (r < takes) {
        // HOW FIRMLY IT IS HELD: nothing at the outer edge of the
        // band, coming on to full over `CATCH_GRIP` and staying there
        // all the way in. It used to be `1 - r / takes`, measured from
        // the middle of the chamber, which came out at only about half
        // strength ON the orbit and a fifth of it half a band out — so
        // a particle that arrived a little wide was barely pulled in
        // at all and rode round out there for a long time. That is
        // what the strays were.
        const grip = Math.max(0.5, (takes - orbit) * CATCH_GRIP);
        const hold = Math.min(1, (takes - r) / grip);
        const ux = dx / (r || 1), uy = dy / (r || 1), uz = dz / (r || 1);

        runsAt(-ux, -uy, -uz, way);
        const tn = Math.hypot(way[0], way[1], way[2]) || 1;
        const tx = way[0] / tn, ty = way[1] / tn, tz = way[2] / tn;

        // Turned the way the orbit runs, TO the speed that would carry
        // it round — not merely up to it. Only ever adding, a particle
        // that arrived carrying more than that kept it, and too much
        // going-round is an orbit that swings wide and comes back: the
        // other half of what the strays were.
        const round = Math.sqrt(PULL / Math.max(1, r));
        const going = speck.vx * tx + speck.vy * ty + speck.vz * tz;
        const turn = going < round
          ? Math.min(round - going, round * hold * dt * 3.6)
          : -Math.min(going - round, round * hold * dt * 2.2);
        speck.vx += tx * turn;
        speck.vy += ty * turn;
        speck.vz += tz * turn;

        // ITS OWN PLACE IN THE BAND, not the orbit's own line: every
        // particle the chamber catches stands a little way in or out
        // of it, which is what makes the orbit a disc with a
        // thickness rather than a wire with a crust on it.
        const mine = 1 + speck.band * DISC;
        const want = orbit * mine + READ_SWELL * read;

        // CARRIED OUT WITH IT while the orbit is changing size, and
        // not dragged. A spring stiff enough to catch a particle
        // arriving at speed is far too stiff to move one gently, so
        // leaving the widening to it threw the whole disc outward in
        // long streaks and then let it fall back — the one moment on
        // this page that was a step rather than a movement. The orbit
        // takes what it is already holding with it instead, and the
        // spring is left doing what it is for.
        if (grew) {
          const carried = grew * mine * hold;
          speck.x -= ux * carried;
          speck.y -= uy * carried;
          speck.z -= uz * carried;
        }

        const off = (r - want) * RING_K * hold * dt;
        speck.vx += ux * off;
        speck.vy += uy * off;
        speck.vz += uz * off;

        const fall = speck.vx * ux + speck.vy * uy + speck.vz * uz;
        const ease = Math.min(0.9, SETTLE * hold * dt);
        speck.vx -= ux * fall * ease;
        speck.vy -= uy * fall * ease;
        speck.vz -= uz * fall * ease;

        // And flattened onto the orbit's own plane — see FLAT — or
        // rather onto its own leaf of it: a particle is pressed
        // towards where IT stands across the disc (`lift`) and not
        // towards the one plane, so the disc has a thickness to it
        // from the side as well as a width from above. Everything
        // still lands on the same lens; it is a lens with a body.
        const along = (speck.x - core[0]) * AXIS[0] + (speck.y - core[1]) * AXIS[1] +
                      (speck.z - core[2]) * AXIS[2] - speck.lift * orbit;
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
        }
      }

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
    // the site rules something it is measuring — and ruled ACROSS the
    // band, from its inner edge to its outer one, so the ticks say how
    // wide the disc is rather than merely where its middle line runs.
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, PATH_INK * 0.85);
    paint.beginPath();
    for (let n = 0; n < 30; n++) {
      const at = (n / 30) * Math.PI * 2;
      onOrbit(at, orbit * (1 - DISC * 0.7), spot);
      const a = to(spot[0], spot[1], spot[2]);
      onOrbit(at, orbit * (1 + DISC * 0.7), spot);
      const b = to(spot[0], spot[1], spot[2]);
      if (!a || !b) continue;
      paint.moveTo(a.x, a.y);
      paint.lineTo(b.x, b.y);
    }
    paint.stroke();

    // THE ROW BEING POINTED AT is answered by the ORBIT ALONE — the
    // stretch of it level with the row swells outward, and that is the
    // whole of it. There used to be a leader run from each end of the
    // row out to the sides of the window as well, with a tick where it
    // landed: a pair of full-width horizontal lines drawn across the
    // page every time the hand passed over a row. The owner asked for
    // them gone, and they are gone rather than switched off — a
    // reading against the orbit is what this page answers with.

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
  // Whatever is near the hand, kept as it is found so the web can be
  // strung between them once everything has been placed.
  const near = [];

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
    // The front canvas is not either, and that is the owner's own
    // call: WHAT IS NEARER THAN THE MIDDLE OF THE CHAMBER PASSES IN
    // FRONT OF THE MENU, the way it already passed in front of the
    // word. The room the menu stands in used to be cleared of it —
    // first with a clip switched on in the frame the panel joined the
    // page, then with a fade that came on exactly as the menu itself
    // arrived. Neither is here any more: there is no `veil` and no
    // `CLEAR_PAD` in this file, and what the front canvas draws is
    // left exactly as it is drawn.
    paint.save();
    paintFront.save();

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
      const lit = life * Math.min(1, 26 / speck.z);
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

      // And kept if the hand is near it, for the web.
      if (hasHand && near.length < WEB_MOST * 3 &&
          Math.abs(p.x - handX) < WEB_REACH && Math.abs(p.y - handY) < WEB_REACH) {
        near.push(p.x, p.y, n);
      }

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
    });

    drawWeb();
    near.length = 0;

    paint.restore();
    paintFront.restore();
  }

  /** THE WEB. Whatever the hand is near, joined up — drawn on the
      front canvas so it lies over everything under the cursor, which
      is where the hand is.

      Each link comes and goes on its own clock and is drawn a hair off
      the two specks it joins, both worked out from the pair itself so
      that the same two specks always flicker the same way and the net
      never reads as something twitching at random. The whole thing is
      one path and one stroke. */
  const webCount = [];

  /** The menu's own box while it is open, in window coordinates, or
      null. Read once a drawing rather than once a line: asking an
      element for its box is a question the browser lays the page out to
      answer, and there can be a hundred lines. */
  function menuBox() {
    if (!panel || panel.hidden) return null;
    const box = panel.getBoundingClientRect();
    if (box.width < 8 || box.height < 8) return null;
    return box;
  }

  /** Does this line cross the menu? A line with either end inside it
      counts, and so does one that only passes over a corner. */
  function crossesMenu(box, ax, ay, bx, by) {
    if (!box) return false;
    const inside = (x, y) =>
      x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    if (inside(ax, ay) || inside(bx, by)) return true;
    // Both ends outside: the line crosses only if it cuts one of the
    // four sides.
    const cuts = (x1, y1, x2, y2) => {
      const side = (px, py, qx, qy, rx, ry) =>
        (qx - px) * (ry - py) - (qy - py) * (rx - px);
      const d1 = side(ax, ay, bx, by, x1, y1);
      const d2 = side(ax, ay, bx, by, x2, y2);
      const d3 = side(x1, y1, x2, y2, ax, ay);
      const d4 = side(x1, y1, x2, y2, bx, by);
      return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
    };
    return cuts(box.left, box.top, box.right, box.top) ||
      cuts(box.right, box.top, box.right, box.bottom) ||
      cuts(box.right, box.bottom, box.left, box.bottom) ||
      cuts(box.left, box.bottom, box.left, box.top);
  }

  function drawWeb() {
    if (!hasHand || near.length < 6) return;
    // THE WEB NEVER CROSSES THE OPEN MENU. The specks themselves may —
    // the owner asked for the particles in front of the table, and one
    // that has joined the orbit passing over the writing is the orbit
    // doing what it does. A LINE is not: it is the cursor's own mark,
    // it is drawn between two specks that may be nowhere near the menu,
    // and strung across the writing it reads as scribble over the page
    // rather than as a net in the air. So any link that would touch the
    // menu's box is simply not drawn.
    const menu = menuBox();
    const many = Math.min(WEB_MOST, near.length / 3);
    webCount.length = 0;
    for (let i = 0; i < many; i++) webCount.push(0);
    paintFront.beginPath();
    let drawn = 0;
    for (let a = 0; a < many; a++) {
      if (webCount[a] >= WEB_EACH) continue;
      const ax = near[a * 3], ay = near[a * 3 + 1], an = near[a * 3 + 2];
      for (let b = a + 1; b < many; b++) {
        if (webCount[a] >= WEB_EACH) break;
        if (webCount[b] >= WEB_EACH) continue;
        const bx = near[b * 3], by = near[b * 3 + 1], bn = near[b * 3 + 2];
        const dx = bx - ax, dy = by - ay;
        const off = Math.hypot(dx, dy);
        if (off > WEB_LINK || off < 1) continue;
        // One number per pair, standing in for a roll of the dice that
        // comes out the same every time it is asked.
        const own = ((an * 73856093) ^ (bn * 19349663)) >>> 0;
        const rate = WEB_FLICK[0] +
          ((own % 1000) / 1000) * (WEB_FLICK[1] - WEB_FLICK[0]);
        const flick = Math.sin(clock * rate + (own % 6283) / 1000);
        if (flick < -0.4) continue;
        const skew = ((own >>> 11) % 100) / 100 - 0.5;
        const nx = (-dy / off) * WEB_SKEW * skew, ny = (dx / off) * WEB_SKEW * skew;
        if (crossesMenu(menu, ax + nx, ay + ny, bx + nx, by + ny)) continue;
        paintFront.moveTo(ax + nx, ay + ny);
        paintFront.lineTo(bx + nx, by + ny);
        webCount[a]++; webCount[b]++;
        drawn++;
      }
    }
    if (!drawn) return;
    paintFront.lineWidth = 1;
    paintFront.strokeStyle = rgba(INK, WEB_INK);
    paintFront.stroke();
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
        spread = stepFrom + (stepTo - stepFrom) * STEP_EASE(gone);
        if (gone >= 1) { spread = stepTo; stepAt = -1; }
      }
      clock += dt;
      core[0] = coreOpen[0] * spread;
      core[1] = coreOpen[1] * spread;
      // While the burst has the particles, `move` is left alone — see
      // the note above `stepBurst`.
      if (!stepBurst(dt)) move(dt);
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
