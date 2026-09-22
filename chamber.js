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
  const PER_STREAM = 620;      // particles in the air from each of them
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
  /** THE READING OVER A CHAPTER. It used to be the count and the range
      of dates the chapter covered; the owner asked for the dates to
      come off the favourites and for the perfume HOUSE to stand where
      they did, so there are no dates on this page at all any more and
      no range to read. `spanOf`, which sorted them into order, has
      gone with them. */
  function specOf(items) {
    return items.length ? numbered(items.length - 1) + " ENTRIES" : "NO ENTRIES YET";
  }

  const chapters = [];
  /** A chapter by name, made if it is not there yet. Order is the
      order they are first asked for. */
  function chapterOf(name) {
    let chapter = chapters.find((one) => one.name === name);
    if (!chapter) {
      chapter = { name: name, items: [] };
      chapters.push(chapter);
    }
    return chapter;
  }

  entries.forEach((entry) => {
    chapterOf((entry.dataset.chapter || "Unsorted").trim()).items.push({
      name: entry.textContent.trim(),
      // THE HOUSE THE PERFUME COMES FROM, where the date used to be.
      house: (entry.dataset.house || "").trim(),
      // And, optionally, the key its notes are filed under in
      // notes-data.js — which is what puts a NOTES button in the card
      // when it is opened.
      notes: (entry.dataset.notes || "").trim(),
      href: entry.getAttribute("href"),
    });
  });

  // WHAT EACH CHAPTER IS, in the page's own markup — one block per
  // chapter, matched by `data-chapter`. A chapter with nothing written
  // for it simply shows its cards, so this is optional and the page
  // works without any of it.
  //
  // AND A CHAPTER WRITTEN UP HERE EXISTS EVEN WITH NOTHING FILED UNDER
  // IT. The chapters used to be read off the favourites alone, so a
  // chapter with no favourites was not a chapter — which is no use for
  // one that has been named and not filled. Chapter 2 is exactly that:
  // "To be determined...", and nothing in it yet. It still stands in
  // the menu and you can still arrow into it.
  //
  // `data-ground` is the drawing that stands behind that chapter's
  // page, if it asks for one. Chapter 1 asks for the sun.
  const notes = {};
  const grounds = {};
  document.querySelectorAll(".gallery-chapter[data-chapter]").forEach((block) => {
    const name = (block.dataset.chapter || "").trim();
    if (!name) return;
    notes[name] = block.innerHTML.trim();
    if (block.dataset.ground) grounds[name] = block.dataset.ground.trim();
    chapterOf(name);
  });

  // WHAT A FAVOURITE SAYS WHEN ITS CARD IS OPENED — one block per
  // favourite, matched by name. The owner asked for a description and
  // a paragraph of commentary; what is actually carried through is
  // whatever the block holds, so the shape is theirs to change.
  const writings = {};
  document.querySelectorAll(".gallery-writing[data-favourite]").forEach((block) => {
    writings[(block.dataset.favourite || "").trim()] = block.innerHTML.trim();
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
    const row = document.createElement("button");
    row.type = "button";
    row.className = "chamber-row chamber-chapter";
    row.innerHTML =
      '<span class="chamber-file"><span class="chamber-no"></span>' +
      '<span class="chamber-of"></span></span>' +
      '<span class="chamber-name"></span>' +
      '<span class="chamber-go" aria-hidden="true">&#8594;</span>';
    row.querySelector(".chamber-no").textContent = numbered(i);
    row.querySelector(".chamber-of").textContent = specOf(chapter.items);
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
  // THE ARROWS EITHER SIDE OF THE NAME are the owner's: "an arrow near
  // the right side and left of the word chapter, that you can cycle
  // through". They step one chapter at a time and wrap round, so with
  // two chapters it is 1 → 2 → 1. Nothing about the burst is replayed —
  // the page you are standing on is simply rewritten under you.
  //
  // THE GROUND is the drawing behind the page, if that chapter asks for
  // one. It is a canvas outside the sheet so the writing can fade for a
  // turn without the drawing behind it flickering.
  chapterPage.innerHTML =
    '<canvas class="chapter-ground" aria-hidden="true" hidden></canvas>' +
    '<div class="chapter-sheet">' +
      '<button type="button" class="chapter-back">' +
        '<span aria-hidden="true">&#8592;</span> Favourites' +
      "</button>" +
      '<p class="chapter-kicker">Favourites</p>' +
      '<div class="chapter-title">' +
        '<button type="button" class="chapter-step chapter-step-back" ' +
          'aria-label="The chapter before this one">' +
          '<span aria-hidden="true">&#8592;</span></button>' +
        '<h2 class="chapter-name"></h2>' +
        '<button type="button" class="chapter-step chapter-step-on" ' +
          'aria-label="The next chapter">' +
          '<span aria-hidden="true">&#8594;</span></button>' +
      "</div>" +
      '<p class="chapter-spec"></p>' +
      '<div class="chapter-note"></div>' +
      '<div class="chapter-cards"></div>' +
    "</div>";
  const chapterName = chapterPage.querySelector(".chapter-name");
  const chapterSpec = chapterPage.querySelector(".chapter-spec");
  const chapterNote = chapterPage.querySelector(".chapter-note");
  const chapterCards = chapterPage.querySelector(".chapter-cards");
  const chapterGround = chapterPage.querySelector(".chapter-ground");
  chapterPage.querySelector(".chapter-back")
    .addEventListener("click", () => closeChapter());
  chapterPage.querySelector(".chapter-step-back")
    .addEventListener("click", () => stepChapter(-1));
  chapterPage.querySelector(".chapter-step-on")
    .addEventListener("click", () => stepChapter(1));

  // A FAVOURITE'S NOTES, IN THIS PAGE'S OWN COLOURS.
  //
  // It is the SAME WINDOW the rest of the site uses — `.note-panel`,
  // its bar, its close, and a body written by the one renderer in
  // notes.js — so a reader is told the same thing about a fragrance
  // whichever door they came in by. What is different is the colour,
  // and that is five tokens redefined on the window itself rather than
  // a second set of rules for everything inside it: every rule the
  // window already draws in reads them. See the note in style.css.
  //
  // It stands INSIDE the chapter page, not on the body: the chapter
  // page is fixed over the window and carries no transform, so a fixed
  // thing in here is fixed to the window — and every direct child of
  // <body> is caught by the rule that dims the page behind the Menu.
  const favScrim = document.createElement("div");
  favScrim.className = "note-scrim fav-note-scrim";
  favScrim.hidden = true;
  chapterPage.appendChild(favScrim);

  const favNote = document.createElement("div");
  favNote.className = "note-panel fav-note";
  favNote.id = "fav-note";
  favNote.hidden = true;
  favNote.setAttribute("role", "dialog");
  favNote.setAttribute("aria-modal", "true");
  favNote.setAttribute("aria-labelledby", "fav-note-head");
  favNote.innerHTML =
    '<div class="note-bar">' +
      '<p class="note-head" id="fav-note-head">' +
        '<span class="note-head-say">Notes</span>' +
        '<span class="note-head-of"></span>' +
      "</p>" +
      '<button class="note-shut" type="button" aria-label="Close this">' +
        '<span aria-hidden="true">\u00d7</span></button>' +
    "</div>" +
    '<div class="note-in"></div>';
  chapterPage.appendChild(favNote);

  // Inside the chamber rather than loose in the page. Every direct child
  // of <body> is caught by the rule that dims the page behind the menu,
  // which outranks anything written for a new element — the note in
  // style.css says so and it has caught features before. In here it is
  // dimmed with the rest of the page, which is what should happen.
  shell.appendChild(chapterPage);

  // THE HUB, GOING OUT — AND IT STANDS OUTSIDE THE PAGE IT OPENS.
  //
  // The owner asked for the shockwave to be the centre of the home
  // page's map spread across the whole window, and that centre is three
  // things: a solid near-black core with two translucent halo shells
  // round it, at 2.37 and 5.15 times its radius and at a quarter and a
  // tenth of its weight (see the node map's report). Here the core is
  // the chapter's own black, opened out by the wave, and these two are
  // the shells going out ahead of it.
  //
  // OUTSIDE THE PAGE is the point, and it is why this is its own element
  // rather than the first thing inside `chapterPage`. It has to bend
  // the CHAMBER — the white page, its word and its orbit — which it
  // cannot do from inside a page laid over the top of all that.
  //
  // (It was also what made the shells possible at all when the page was
  // still cut open out of black: inside `chapterPage` everything they
  // did in the first moments was clipped away with the rest of it. That
  // cut is gone now — see the note above the mesh constants — but out
  // here is still where they belong.)
  const chapterWave = document.createElement("div");
  chapterWave.className = "chapter-wave";
  chapterWave.setAttribute("aria-hidden", "true");
  chapterWave.hidden = true;
  // THE SHELLS ARE IN A BOX OF THEIR OWN, and the canvas is outside it.
  // `castWave` restarts the shells by replacing their box's contents —
  // a CSS animation on an element built once only plays once — and
  // replacing contents REPLACES ELEMENTS. With the canvas in there it
  // was destroyed and rebuilt on every burst, while the script went on
  // drawing to the detached one it first got hold of: the rings were
  // drawn perfectly, onto a canvas that was no longer in the page.
  chapterWave.innerHTML =
    '<div class="chapter-shells">' +
      '<span class="chapter-shell-in"></span>' +
      '<span class="chapter-shell-out"></span>' +
    "</div>" +
    '<canvas class="chapter-rings" aria-hidden="true"></canvas>';
  shell.appendChild(chapterWave);
  const shells = chapterWave.querySelector(".chapter-shells");
  const rings = chapterWave.querySelector(".chapter-rings");
  const paintRings = rings.getContext("2d");

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
  // way into it to be the chamber turning itself inside out.
  //
  // IT IS ONE CONTINUOUS MOVEMENT, and that is the whole of the second
  // round's note on it. The first version ran in steps — the menu shut,
  // a second passed, then the particles wound in, then they were thrown
  // out — and it read, in the owner's words, as though "you just
  // collapsed the favorites menu, and then there was the explosion".
  // Nothing waits for anything now: from the press, every piece of
  // chrome on the page begins to fade AND the particles begin to wind
  // in, together, and the wind runs straight into the wave.
  //
  //   THE WIND   Everything fades. The particles close on the middle,
  //              gaining on it the whole way — slow at first and rushing
  //              at the end — and turning faster as they close, THE WAY
  //              THE ORBIT WAS ALREADY TURNING.
  //   THE WAVE   They meet, and a shockwave goes out from the point with
  //              a ripple behind it. The chapter is cut out of the black
  //              by that wave rather than faded up underneath it.
  //
  // WHY IT IS DRIVEN BY THE CLOCK AND NOT BY THE PHYSICS. Every other
  // movement on this page comes out of `move()`, which holds particles
  // on the orbit with a spring. A spring cannot be made to meet at a
  // point — that is what it exists to prevent — so for the length of the
  // burst `move()` is not called at all and the particles are placed
  // outright, from where each one stood when the press landed. They are
  // put back in the physics' hands when the chapter is closed, by being
  // launched again from the injectors.
  // ============================================================
  const BURST_WIND = 2.3;      // closing on the middle, and fading with it
  const BURST_WEB = 2.45;      // and the web going out, which is the whole rest of it
  const BURST_CLOSE = 2.6;     // how sharply it gains on the middle (a power)
  const BURST_TURNS = 1.15;    // turns the ring ADDS on the way in, over its own
  const BURST_SPIN = 2.5;      // and how much of that is saved for the end (a power)
  const RING_NEAR = 0.3;       // how near the orbit a particle counts as part of the ring
  const SPIN_MOST = 3.4;       // the fastest a read-off turn is believed (radians a second)
  const SPIN_ELSE = -0.55;     // and what is used when there is no ring to read
  const LOOSE_LAG = 0.5;       // the share of the wind a loose one may wait before falling
  const LOOSE_SPAN = [0.3, 0.62];  // and how long its own fall then takes
  const LOOSE_COAST = 0.55;    // how long it keeps going the way it was, in seconds
  const MARKS_FADE = 1.25;     // the drawing's own chrome going, with the rest of it

  // ============================================================
  // THE MESH — AND THERE IS NO BLACK BEHIND IT ANY MORE
  //
  // The explosion used to be two things arriving one after the other: a
  // train of rings travelling out, and a black ellipse cut open from
  // the same point a beat later (`WAVE_LEAD`, `clipTo`, `CLIP_ROUND`).
  // The owner asked for the black to go, for the geometry to be
  // COMPLETE rather than covered over half way across the window, and
  // for the panels of the drawing itself to "start turning blacker and
  // blacker until they match the colour of the page that results at the
  // end of the explosion".
  //
  // So the two are one thing now. What goes out is a LATTICE standing
  // in the orbit's plane — rings crossed by spokes, the cells between
  // them its PANELS — and a front travelling outward through it. Ahead
  // of the front the lattice is not there at all; the front itself is
  // the brightest of it; and behind the front every panel it has passed
  // darkens on a clock of its own until it is the chapter page's own
  // black. The drawing does not get covered up by the page: the drawing
  // BECOMES the page.
  //
  // That is why nothing here clips anything. The chapter page is laid
  // underneath once the panels have the window covered (`PAGE_LAID`),
  // and the canvas is simply taken away at the end — both are black by
  // then, so there is nothing to see in the swap.
  //
  // WHY THE LATTICE STANDS STILL AND THE FRONT MOVES THROUGH IT. A
  // travelling ring has no inside and no outside to fill; a standing
  // lattice has cells that can be filled one at a time, which is the
  // whole of what the owner asked for. It is turned bodily as it goes
  // (`WEB_SPIN`) so it is not a fixed thing being lit up.
  // ============================================================
  const MESH_RINGS = 19;        // rings in the lattice, out to the corner
  const MESH_SIDES = 40;        // spokes, and so the facets of every ring
  const MESH_OVER = 1.52;       // how far past the corner the front runs, so nothing is left pale
  const MESH_SOFT = 0.33;       // how long a panel takes to go black, as a share of the reach
  const MESH_VARY = 0.15;       // how much a panel's own clock differs from its neighbours'
  const MESH_SETTLE = 0.86;     // and from here every panel finishes together, whatever its clock
  const MESH_GO = 0.74;         // and from here the lattice itself fades off the black
  const MESH_LEAD = 4;          // faceted figures travelling at the front
  const MESH_LAG = 0.055;       // how far behind one another they run
  const MESH_LIT = 1;           // how brightly the lattice is struck as the front crosses it
  const MESH_KEEP = 0.34;       // and how much of it is kept once the front is past
  const MESH_HELD = 2.1;        // how far the panels are held back early on (a power)
  const MESH_NODE = 1.7;        // a mark at every crossing, in pixels
  const MESH_BOW = 0.05;        // how far a ring bows off true, as a share of it
  const MESH_SPIN = 0.3;        // turns the lattice makes ABOUT ITS OWN AXIS on the way out
  const MESH_HAND = 0.92;       // where the drawing starts being handed to the page under it
  const MESH_STEPS = 24;        // panels are filled in this many bands of one weight
  const PAGE_LAID = 0.82;      // when the chapter page goes under the web
  // The two ends the panels travel between: the chamber's own ink on
  // its white, and the silver of the page the burst opens. A line is
  // mixed between them by how black the panel under it has gone, so the
  // lattice is never drawn in a colour the ground cannot show.
  const MESH_INK = [23, 23, 15];
  const MESH_SILVER = [200, 204, 212];

  /** Null, or the burst that is running / the chapter that is open. */
  let burst = null;
  /** The timer running the way out of a chapter, or 0. It outlives
      `burst` — the chamber is given back to itself half way through the
      leaving, while the black is still over it — so it is what keeps a
      second press from starting the whole thing again. */
  let leaving = 0;
  const chapterShowing = () => Boolean(burst) || Boolean(leaving);
  /** THE WAY OUT, IN MILLISECONDS. The writing goes first, then the
      chamber is handed back under a black that is still solid, and only
      then does the black clear. Both are written in the stylesheet as
      well; change one and change the other. */
  const LEAVE_WRITING = 340;
  const LEAVE_CLEAR = 620;

  /** HOW FAST THE RING IS TURNING, AND WHICH WAY — read off the
      particles rather than worked out from the geometry, because what
      it is doing now is the only thing the wind can be made to carry
      on from. Radians a second, signed.

      IT IS THE RATE, NOT ONLY THE DIRECTION, and that is the whole
      point of it. The wind used to turn as a power of how far through
      it was, which is nothing at all at the start — so the ring came
      to a dead stop on the frame the chapter was pressed and then got
      going again. `windIn` starts it at exactly this rate instead, and
      adds its own turn on top, so the press does not show.

      Asked of the particles standing ON the orbit and no others: one
      still crossing the window in a stream is travelling fast and not
      round anything, and a few hundred of those drown out the ring.
      And asked IN THE ORBIT'S OWN PLANE, because that is the plane it
      turns in — `PLANE.u` and `PLANE.w` are the two directions it is
      drawn along. */
  function spinNow(orbit) {
    const u = PLANE.u, w = PLANE.w;
    let sum = 0, count = 0;
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      if (speck.wait > 0) continue;
      const x = speck.x - core[0], y = speck.y - core[1], z = speck.z - core[2];
      const pu = x * u[0] + y * u[1] + z * u[2];
      const pw = x * w[0] + y * w[1] + z * w[2];
      const r2 = pu * pu + pw * pw;
      if (r2 < 0.25) continue;
      if (Math.abs(Math.sqrt(r2) - orbit) > orbit * RING_NEAR) continue;
      const vu = speck.vx * u[0] + speck.vy * u[1] + speck.vz * u[2];
      const vw = speck.vx * w[0] + speck.vy * w[1] + speck.vz * w[2];
      sum += (pu * vw - pw * vu) / r2;
      count++;
    }
    // A chamber only just filled can have no ring to read at all, and
    // one caught mid-arrival can read a good deal faster than it looks.
    const rate = count > 8 ? sum / count : 0;
    if (!(Math.abs(rate) > 0.02)) return SPIN_ELSE;
    return Math.max(-SPIN_MOST, Math.min(SPIN_MOST, rate));
  }

  /** THE RING'S OWN SHAPE ON THE WINDOW — where its middle lands, which
      way its long axis lies, and how flat it is drawn.

      The orbit is a circle standing at a tilt, so what you actually see
      of it is an ellipse, and the owner asked for the explosion to go
      out in THAT rather than as a circle square to the screen. This is
      what tells the wave what shape to be.

      Measured rather than worked out: the orbit is sampled the whole
      way round, each point projected onto the window, and the spread of
      those points taken. The long and short axes of that spread are the
      ellipse's own axes. Doing it this way costs one pass of 72 points,
      once, and comes out right whatever the tilt is and wherever the
      middle of the chamber has been moved to — neither of which is a
      constant in this file. */
  function ringOnScreen() {
    const at0 = to(core[0], core[1], core[2]);
    const out = { x: at0 ? at0.x : midX, y: at0 ? at0.y : midY, turn: 0, flat: 1 };
    const r = Math.max(0.6, burst && burst.orbit0 ? burst.orbit0 : orbitNow());
    const xs = [], ys = [];
    for (let n = 0; n < 72; n++) {
      onOrbit((n / 72) * Math.PI * 2, r, spot);
      const p = to(spot[0], spot[1], spot[2]);
      if (p) { xs.push(p.x); ys.push(p.y); }
    }
    if (xs.length < 12) return out;
    let cx = 0, cy = 0;
    for (let n = 0; n < xs.length; n++) { cx += xs[n]; cy += ys[n]; }
    cx /= xs.length; cy /= xs.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (let n = 0; n < xs.length; n++) {
      const dx = xs[n] - cx, dy = ys[n] - cy;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    sxx /= xs.length; syy /= xs.length; sxy /= xs.length;
    // The two axes of that spread. For a two-by-two this is closed form.
    const half = (sxx + syy) / 2;
    const gap = Math.sqrt(Math.max(0, (sxx - syy) * (sxx - syy) / 4 + sxy * sxy));
    const big = half + gap, small = Math.max(1e-6, half - gap);
    out.turn = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    // Floored, because a ring seen exactly edge-on would give a wave
    // with no width at all and nothing to look at.
    out.flat = Math.max(0.16, Math.min(1, Math.sqrt(small / big)));
    return out;
  }

  /** THE MESH, DRAWN. `p` runs 0 to 1 across the whole of the explosion.

      (It is the MESH and not the web: `drawWeb` further down is the
      cursor's own lines, which this page has had all along.)

      One canvas, one movement, three things on it:

        THE PANELS   the cells of the lattice, each going from nothing
                     to the chapter page's black once the front has
                     passed it, every one on a clock slightly its own so
                     the black arrives cell by cell rather than as a
                     ring. This is what the owner asked for in place of
                     the black that used to be cut open underneath.
        THE LINES    the rings and the spokes, struck brightly as the
                     front crosses them and then kept faintly. Their
                     colour is mixed from the chamber's ink to the
                     page's silver by how dark the panel beneath them
                     has gone, so a line is always visible on whatever
                     is under it at that moment.
        THE FRONT    the leading figures, drawn as splines through their
                     own corners — the explosion proper, and the part
                     the owner asked to have emphasised.

      Drawn rather than built out of elements because there are four
      hundred panels and as many crossings on the window at once, and
      because the spokes run between the rings, which no arrangement of
      boxes can do. */
  function drawMesh(p) {
    const ring = burst.ring;
    if (!ring || !width || !height) return;
    // No setTransform here: `size()` sets this canvas's scale with every
    // other one's and it persists, and `ratio` is that function's own.
    paintRings.clearRect(0, 0, width, height);
    if (p <= 0) return;

    // HOW FAR THE LATTICE HAS TO GO TO COVER THE WINDOW, in its own
    // plane. It is a family of ellipses lying at `ring.turn` and
    // pressed to `ring.flat`, so this is asked of the four corners
    // directly: turn each one into the ellipse's own frame and ask how
    // big an ellipse of that shape has to be to hold it. Taking a
    // circle of `full / flat` instead — which is what the old rings
    // did — overshoots sideways by the whole of 1/flat, and at a flat
    // ring that is six times further than the window needs, which is
    // why the lattice used to be a long way from arriving when the
    // burst was already half over.
    const cw = Math.cos(ring.turn), sw = Math.sin(ring.turn);
    let need = 0;
    for (let i = 0; i < 4; i++) {
      const dx = (i & 1 ? width : 0) - ring.x;
      const dy = (i & 2 ? height : 0) - ring.y;
      const u = dx * cw + dy * sw;
      const v = -dx * sw + dy * cw;
      need = Math.max(need, Math.hypot(u, v / ring.flat));
    }
    const reach = need * 1.04 + 24;
    const eased = ease(p);
    const front = reach * eased * MESH_OVER;
    // From MESH_SETTLE on, every panel finishes together whatever its own
    // clock said — so the window is certainly one flat black at the end,
    // which is what the page underneath is.
    const settle = Math.max(0, (p - MESH_SETTLE) / (1 - MESH_SETTLE));
    // THE LATTICE GOES, AND THE BLACK STAYS. Once the panels have the
    // window the lines are silver on black, which is the chapter page's
    // own pair — so they are taken off gently over the last of the
    // burst rather than being switched off with the canvas at the end
    // of it. The panels are not touched by this: they are the page.
    const lines = 1 - Math.max(0, Math.min(1, (p - MESH_GO) / (1 - MESH_GO)));

    // TURNED, BUT NOT SQUASHED. The flattening is done point by point
    // below rather than with `scale(1, flat)` on the context: a scaled
    // context squashes the STROKES too, so every line came out thinner
    // across the ring than along it.
    //
    // AND THE SPIN IS NOT IN HERE. It used to be added to `ring.turn`
    // on this line, which turns the whole FIGURE on the window — the
    // flattened ellipse's own long axis swinging away from the angle
    // the orbit is standing at. The owner saw that for what it was:
    // "I do not want the geometric shapes to rotate around like that,
    // I want them to spin on their axis of the donut/ring/ellipse
    // instead." So the spin is an offset on the ANGLE ROUND THE DISC
    // (see `spin` below): the ellipse stands exactly where the orbit
    // stands and the pattern turns inside it, which is what spinning
    // about the axis through the middle of a ring looks like from
    // where you are standing.
    paintRings.save();
    paintRings.translate(ring.x, ring.y);
    paintRings.rotate(ring.turn);
    paintRings.lineJoin = "round";
    paintRings.lineCap = "round";

    // THE LATTICE ITSELF. The rings stand at fixed radii and the bow is
    // a function of the ANGLE alone, so two neighbouring rings share
    // their corners exactly and the cells between them tile with no
    // seams — which they would not if each ring bowed on its own.
    const flat = ring.flat;
    const bow = (a) => 1 + Math.sin(a * 3) * MESH_BOW;
    // THE SPIN, as an angle round the disc. Eased rather than linear so
    // it arrives and leaves without a step, like everything else here.
    const spin = burst.way * eased * MESH_SPIN * Math.PI * 2;
    const cosA = [], sinA = [], bowA = [];
    for (let k = 0; k <= MESH_SIDES; k++) {
      const a = (k / MESH_SIDES) * Math.PI * 2 + spin;
      cosA.push(Math.cos(a)); sinA.push(Math.sin(a)); bowA.push(bow(a));
    }
    const rAt = [];
    for (let i = 0; i <= MESH_RINGS; i++) {
      // A shade compressed outwards, so a cell near the rim is not four
      // times the cell at the middle — and the first ring stands a
      // little way out rather than at nothing, or the innermost cells
      // are forty long splinters meeting at a point.
      rAt.push(reach * (0.035 + 0.965 * Math.pow(i / MESH_RINGS, 0.86)));
    }
    const at = (i, k) => {
      const r = rAt[i] * bowA[k];
      return [cosA[k] * r, sinA[k] * r * flat];
    };

    // HOW BLACK A PANEL HAS GONE. Its own clock is a stable scatter off
    // its place in the lattice — the same cell answers the same way
    // every time, so the filling-in has a pattern rather than a fizz.
    const soft = reach * MESH_SOFT;
    const clock = (i, k) => {
      const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    // AND THEY ARE HELD BACK EARLY ON. The owner asked for the first
    // part of the explosion to be the emphasis and for the black to
    // arrive afterwards, so a panel's weight is taken to a power that
    // starts high and comes back to one: for the first half of the
    // burst the lattice is lines on white with the panels barely there,
    // and the black gathers in the second half. It still ends at a flat
    // black, because the power ends at one and `settle` carries the
    // last of it.
    const held = 1 + MESH_HELD * Math.max(0, 1 - p * 1.55);
    const darkAt = (i, k) => {
      const rm = (rAt[i] + rAt[i + 1]) / 2;
      const own = (front - rm) / soft - clock(i, k) * MESH_VARY;
      const d = Math.max(0, Math.min(1, own));
      return Math.max(settle, Math.pow(d, held));
    };

    // THE PANELS, in bands of one weight. Four hundred separate fills a
    // frame is four hundred paths; gathered into MESH_STEPS weights it is
    // at most twenty-six, and at a twenty-sixth of black nobody can see
    // the step.
    const bands = [];
    for (let n = 0; n <= MESH_STEPS; n++) bands.push(null);
    for (let i = 0; i < MESH_RINGS; i++) {
      for (let k = 0; k < MESH_SIDES; k++) {
        const d = darkAt(i, k);
        if (d <= 0.004) continue;
        const n = Math.min(MESH_STEPS, Math.round(d * MESH_STEPS));
        if (!bands[n]) bands[n] = new Path2D();
        const c0 = at(i, k), c1 = at(i, k + 1);
        const c2 = at(i + 1, k + 1), c3 = at(i + 1, k);
        const path = bands[n];
        path.moveTo(c0[0], c0[1]);
        path.lineTo(c1[0], c1[1]);
        path.lineTo(c2[0], c2[1]);
        path.lineTo(c3[0], c3[1]);
        path.closePath();
      }
    }
    paintRings.fillStyle = "#000";
    for (let n = 1; n <= MESH_STEPS; n++) {
      if (!bands[n]) continue;
      paintRings.globalAlpha = n / MESH_STEPS;
      paintRings.fill(bands[n]);
    }

    // AND THE MIDDLE OF IT. The first ring stands a little way out from
    // nothing (see rAt), so without this there is a small clear hole
    // left at the point the whole burst came from — which is the one
    // place on the window that should certainly be black.
    const core0 = darkAt(0, 0);
    if (core0 > 0.004) {
      paintRings.globalAlpha = core0;
      paintRings.beginPath();
      paintRings.ellipse(0, 0, rAt[0] * 1.06, rAt[0] * 1.06 * flat, 0, 0, Math.PI * 2);
      paintRings.fill();
    }

    // HOW BRIGHTLY A RING IS STRUCK, and in what colour — both read off
    // the front and off the black beneath it.
    const strike = (r) => {
      const t = (front - r) / (reach * 0.3);
      if (t <= 0) return 0;
      return MESH_LIT * Math.exp(-t * 1.9) + MESH_KEEP * Math.min(1, t * 2);
    };
    const toneAt = (d) => {
      const r = Math.round(MESH_INK[0] + (MESH_SILVER[0] - MESH_INK[0]) * d);
      const g = Math.round(MESH_INK[1] + (MESH_SILVER[1] - MESH_INK[1]) * d);
      const b = Math.round(MESH_INK[2] + (MESH_SILVER[2] - MESH_INK[2]) * d);
      return "rgb(" + r + "," + g + "," + b + ")";
    };
    const darkOn = (i) => {
      const rm = rAt[Math.min(MESH_RINGS - 1, i)];
      return Math.max(settle, Math.max(0, Math.min(1, (front - rm) / soft)));
    };

    // THE SPOKES, struck from the middle out as far as the front has
    // got. Drawn in short runs so each run takes the colour of the
    // ground it is actually lying on.
    paintRings.lineWidth = 1;
    for (let i = 0; i < MESH_RINGS; i++) {
      const lit = strike(rAt[i]);
      if (lit <= 0.01) continue;
      // A spoke stops where the front has got to, and no further: a
      // band is lit as soon as its INNER ring is passed, so drawing it
      // whole put lines out ahead of the thing drawing them.
      const stop = Math.min(rAt[i + 1], front);
      if (stop <= rAt[i]) continue;
      const cut = (rAt[i + 1] - rAt[i]) > 0
        ? (stop - rAt[i]) / (rAt[i + 1] - rAt[i]) : 0;
      // Forty spokes meeting at a point is a starburst rather than a
      // web, so the innermost bands are drawn quietly and the lattice
      // only comes up to weight once there is room between them.
      const near = Math.min(1, rAt[i] / (reach * 0.2));
      paintRings.globalAlpha = Math.min(1, lit * 0.62 * (0.22 + 0.78 * near)) * lines;
      paintRings.strokeStyle = toneAt(darkOn(i));
      paintRings.beginPath();
      for (let k = 0; k < MESH_SIDES; k++) {
        const a = at(i, k), b2 = at(i + 1, k);
        paintRings.moveTo(a[0], a[1]);
        paintRings.lineTo(a[0] + (b2[0] - a[0]) * cut, a[1] + (b2[1] - a[1]) * cut);
      }
      paintRings.stroke();
    }

    // THE RINGS, each a smooth curve THROUGH its own crossings rather
    // than straight runs between them — at thirty-two sides a polygon
    // reads as a slightly lumpy circle, and a spline through the same
    // points reads as a shape.
    for (let i = 1; i <= MESH_RINGS; i++) {
      const lit = strike(rAt[i]);
      if (lit <= 0.01) continue;
      paintRings.globalAlpha = Math.min(1, lit) * lines;
      paintRings.strokeStyle = toneAt(darkOn(i));
      paintRings.lineWidth = 1;
      paintRings.beginPath();
      let was = at(i, MESH_SIDES - 1), here = at(i, 0);
      paintRings.moveTo((was[0] + here[0]) / 2, (was[1] + here[1]) / 2);
      for (let k = 0; k < MESH_SIDES; k++) {
        here = at(i, k);
        const next = at(i, k + 1);
        paintRings.quadraticCurveTo(here[0], here[1],
          (here[0] + next[0]) / 2, (here[1] + next[1]) / 2);
      }
      paintRings.stroke();

      // A MARK AT EVERY CROSSING. Thirteen rings of thirty-two is four
      // hundred and sixteen of them, which is most of what the owner
      // meant by weblike.
      paintRings.globalAlpha = Math.min(1, lit * 1.3) * lines;
      paintRings.fillStyle = toneAt(darkOn(i));
      paintRings.beginPath();
      for (let k = 0; k < MESH_SIDES; k++) {
        const c = at(i, k);
        paintRings.moveTo(c[0] + MESH_NODE, c[1]);
        paintRings.arc(c[0], c[1], MESH_NODE, 0, Math.PI * 2);
      }
      paintRings.fill();
    }

    // THE FRONT — the figures actually travelling, drawn over the
    // lattice they are lighting. This is the part of it the owner asked
    // to have emphasised, so it is the one thing here drawn at full
    // weight, and it runs the whole width of the window rather than
    // being cut off half way.
    for (let n = 0; n < MESH_LEAD; n++) {
      const own = eased - n * MESH_LAG;
      if (own <= 0) continue;
      const r = reach * own * MESH_OVER;
      if (r < 6) continue;
      const d = Math.max(settle, Math.max(0, Math.min(1, (front - r) / soft + 0.35)));
      paintRings.globalAlpha = Math.max(0, (1 - n / (MESH_LEAD + 1)) * (1 - eased * 0.55)) * lines;
      paintRings.strokeStyle = toneAt(d);
      paintRings.lineWidth = n === 0 ? 1.6 : 1;
      paintRings.beginPath();
      const edge = (k) => [cosA[k] * r * bowA[k], sinA[k] * r * bowA[k] * flat];
      let was = edge(MESH_SIDES - 1);
      let here = edge(0);
      paintRings.moveTo((was[0] + here[0]) / 2, (was[1] + here[1]) / 2);
      for (let k = 0; k < MESH_SIDES; k++) {
        here = edge(k);
        const next = edge(k + 1);
        paintRings.quadraticCurveTo(here[0], here[1],
          (here[0] + next[0]) / 2, (here[1] + next[1]) / 2);
      }
      paintRings.stroke();

      // And a tick out past every corner of the leading figure — the
      // instrument mark the rest of this site measures things with.
      if (n === 0) {
        paintRings.globalAlpha *= 0.85;
        paintRings.lineWidth = 1;
        paintRings.beginPath();
        for (let k = 0; k < MESH_SIDES; k++) {
          const c = edge(k);
          const far = Math.hypot(c[0], c[1]) || 1;
          paintRings.moveTo(c[0], c[1]);
          paintRings.lineTo(c[0] * (1 + 10 / far), c[1] * (1 + 10 / far));
        }
        paintRings.stroke();
      }
    }

    paintRings.restore();
    paintRings.globalAlpha = 1;
  }

  /** Flat at both ends — the same shape the black opens on, so the ink
      and the cut travel together rather than merely at once. */
  function ease(q) {
    return q * q * q * (q * (q * 6 - 15) + 10);
  }

  function openChapter(i) {
    // Nor while the last one is still being left — the chamber is
    // handed back to itself half way through that, under a black that
    // is still solid, and starting a second burst into it would wind in
    // a chamber that has only just been refired.
    if (burst || leaving) return;
    const orbit0 = orbitNow();
    const rate = spinNow(orbit0);
    burst = {
      chapter: i, phase: "wind", at: 0, since: 0, spot: [0, 0, 0],
      orbit0: orbit0,
      rate: rate,                      // radians a second, as it is turning now
      way: rate >= 0 ? 1 : -1,         // and which way that is
      ring: null,                      // the shape of it on the window, at the wave
    };

    // THE CHAMBER IS IN TWO PARTS WHEN THE PRESS LANDS, and the owner
    // asked for them to behave as two:
    //
    //   THE RING   what the orbit already has hold of. It comes in AS a
    //              ring — every particle keeps the place on the orbit it
    //              already had, and the ring itself narrows and turns.
    //              Nothing is marshalled into position first.
    //   THE LOOSE  everything still crossing the window in the two
    //              streams. These stay their own particles: they fall in
    //              towards the middle independently, each after a wait of
    //              its own, and join what is there when they arrive.
    //
    // Told apart by how near the orbit a particle is standing, measured
    // in the orbit's own plane.
    const u = PLANE.u, w = PLANE.w;
    const orbit = orbit0;
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      if (speck.wait > 0) { launch(speck); speck.wait = 0; }
      // Every particle is held fully lit for the length of the burst.
      // How brightly one is drawn is worked out from its age against its
      // life, and one just fired has an age of nothing, which draws at
      // nothing — left alone, a good half of the chamber took no part in
      // the wind at all. Ages start again when the chapter is closed.
      speck.age = 1;
      speck.life = 60;

      const x = speck.x - core[0], y = speck.y - core[1], z = speck.z - core[2];
      const pu = x * u[0] + y * u[1] + z * u[2];
      const pw = x * w[0] + y * w[1] + z * w[2];
      const round = Math.hypot(pu, pw);
      speck.onRing = Math.abs(round - orbit) < orbit * RING_NEAR;

      if (speck.onRing) {
        // Its own place on the orbit, kept exactly as it stands.
        speck.rA = Math.atan2(pw, pu);
        speck.rR = round;
        speck.rOff = x * AXIS[0] + y * AXIS[1] + z * AXIS[2];
      } else {
        // EACH LOOSE ONE FALLS ON ITS OWN CLOCK ENTIRELY: its own moment
        // to start, its own length of fall, and its own rate of gaining.
        // A shared start was never there, but a shared ARRIVAL was —
        // every one of them was scaled to reach the middle on the same
        // frame as the ring — and a crowd landing together is the thing
        // that reads as marshalled. The span is drawn first and the wait
        // fitted inside what is left, so nothing is still falling when
        // the wave goes out.
        speck.wx = x; speck.wy = y; speck.wz = z;
        // AND THE WAY IT WAS ALREADY GOING. A loose particle is in the
        // middle of crossing the window when the press lands, and the
        // owner asked for it to keep going that way — "they dont have to
        // take a direct path... find out their direction as you press
        // the button, and then continue that path as if there is a
        // center of gravity at the center of the screen".
        speck.wvx = speck.vx; speck.wvy = speck.vy; speck.wvz = speck.vz;
        speck.span = between(LOOSE_SPAN);
        speck.lag = random() * Math.max(0.05, Math.min(LOOSE_LAG, 0.97 - speck.span));
      }
    }

    // THE CHROME GOES WITH IT, ALL OF IT — the word, the cue, the crop
    // marks, the menu, the drawing's own labels and corner sights, and
    // this page's search. The owner asked for everything to fade,
    // "including the favorites text", and the fade starts on the same
    // frame the winding does.
    shell.classList.add("bursting");
    page.classList.add("bursting");
    drawMenuIn();
    if (opened) setOpen(false, false);
    if (REDUCE_MOTION) { burst.phase = "open"; layChapter(i); }
  }

  /** THE MENU IS DRAWN INTO THE BURST RATHER THAN SHUT.
      Closing the menu is a step back to the word and rises into it;
      pressing a chapter is the start of everything closing on the
      middle, and the owner said the menu leaving looked like neither.
      Each row is given how far it stands from the MIDDLE of the column
      and how far it has to travel to get there, and the stylesheet
      collapses them inwards from the outside in. Measured here because
      it is a measurement — a stylesheet cannot ask how tall a panel
      came out. */
  function drawMenuIn() {
    const rows = [...column.querySelectorAll(".chamber-row")];
    if (!rows.length) return;
    const box = panel.getBoundingClientRect();
    const mid = box.top + box.height / 2;

    // AND THE PANEL ITSELF IS PULLED INTO THE MIDDLE OF THE CHAMBER.
    // The owner: "if it gets distorted and sucked into the middle, and
    // it looks good then do that." It does. `--suck-x` and `--suck-y`
    // are how far the panel's own middle is from the point everything
    // else is closing on — the orbit's centre, projected onto the
    // window — so the writing goes where the particles go rather than
    // merely going away.
    const at = to(core[0], core[1], core[2]);
    if (at) {
      panel.style.setProperty("--suck-x", Math.round(at.x - (box.left + box.width / 2)) + "px");
      panel.style.setProperty("--suck-y", Math.round(at.y - mid) + "px");
    }

    rows.forEach((row, n) => {
      const own = row.getBoundingClientRect();
      row.style.setProperty("--pull", Math.round(own.top + own.height / 2 - mid) + "px");
      // 1 at the middle of the column, 0 at either end: the outermost
      // rows go first and the middle one last.
      const half = Math.max(1, (rows.length - 1) / 2);
      row.style.setProperty("--mid",
        (1 - Math.abs(n - (rows.length - 1) / 2) / half).toFixed(3));
    });
    plate.classList.add("drawn-in");
  }

  /** THE WAY OUT, IN THREE BEATS RATHER THAN IN ONE FRAME.

      It used to be a cut. Pressing "← Favourites" took the black off
      the window on the frame it was pressed, and what was underneath
      was a white page with no chrome on it — the menu and the
      particles both faded out by the burst — which then faded back in
      afterwards. So leaving a chapter was a flash of an empty white
      page, and that is what the owner meant by wanting it "way
      smoother".

      What happens now, in order, and none of it is a cut:

        1  THE WRITING GOES.   The sheet fades where it stands.
        2  THE CHAMBER COMES BACK UNDER THE BLACK, which is still
           solid: the particles are handed back to the physics, the
           menu is reopened and the chrome begins to fade in. Nothing
           of this is seen, and that is the point — by the time the
           black goes there is a page behind it.
        3  THE BLACK CLEARS. */
  function closeChapter() {
    if (!burst || leaving) return;
    const was = burst;
    if (REDUCE_MOTION) { giveBack(was); clearChapter(); return; }
    chapterPage.classList.add("going");
    leaving = window.setTimeout(() => {
      giveBack(was);
      chapterPage.classList.add("clearing");
      leaving = window.setTimeout(() => {
        leaving = 0;
        clearChapter();
      }, LEAVE_CLEAR);
    }, LEAVE_WRITING);
  }

  /** The chamber, handed back to itself. Run while the black is still
      over it, so none of it is watched happening. */
  function giveBack(was) {
    burst = null;
    shell.classList.remove("bursting", "burst-wave");
    page.classList.remove("bursting", "chapter-open");
    plate.classList.remove("drawn-in");
    panel.style.removeProperty("--suck-x");
    panel.style.removeProperty("--suck-y");
    column.querySelectorAll(".chamber-row").forEach((row) => {
      row.style.removeProperty("--pull");
      row.style.removeProperty("--mid");
    });
    // Back into the physics' hands: every particle is fired again from
    // its own injector, staggered, so the chamber fills the way it does
    // when the page opens rather than snapping back into a finished ring.
    specks.forEach((speck) => {
      speck.onRing = false;
      launch(speck);
      speck.wait = random() * between(LIFE);
    });
    const row = chapters[was.chapter] && chapters[was.chapter].row;
    if (row) { setOpen(true, false); row.focus({ preventScroll: true }); }
  }

  /** The chapter page, off the window and back to nothing. */
  function clearChapter() {
    if (leaving) { window.clearTimeout(leaving); leaving = 0; }
    settleNote();
    noteFrom = null;
    openCard = null;
    if (ground) { ground.stop(); ground = null; }
    chapterGround.hidden = true;
    chapterPage.classList.remove("here", "laid", "going", "clearing", "turning");
    chapterPage.hidden = true;
    chapterWave.hidden = true;
  }

  /** Winding in. `p` runs 0 to 1 across the whole wind.

      THE RING NARROWS AS A RING. Each of its particles keeps the angle
      it already had on the orbit and is put back on the orbit at a
      smaller radius, so what closes is the ellipse you were already
      looking at rather than a new shape assembled out of it. Turning it
      about the WINDOW's axis instead — which two earlier goes did — tips
      it out of its own plane and sweeps it edge-on, and that came out as
      a crescent both times.

      BOTH THE NARROWING AND THE TURN GAIN AS THEY GO: the radius falls
      as `1 - p^n` and the angle turns as `p^n`, so it barely moves at
      first and rushes at the end, turning fastest when it is tightest. A
      plain exponential does the opposite of both. */
  function windIn(p) {
    // THE RING FOLLOWS THE ORBIT IN AS THE MENU SHUTS, and then narrows
    // on top of that. The menu is open when a chapter is pressed, so the
    // orbit is at its widest — wide enough that a good part of the ring
    // stands behind the eye and is clipped away, which came out as the
    // top of an arc and nothing else. Riding the orbit's own closing
    // carries it back inside the window before the winding has to do
    // anything, and costs nothing: the menu was shutting anyway.
    const shrink = burst.orbit0 > 0 ? orbitNow() / burst.orbit0 : 1;
    const held = Math.max(0, 1 - Math.pow(p, BURST_CLOSE));
    // THE TURN PICKS UP EXACTLY WHERE THE ORBIT LEFT OFF. The first term
    // is the ring's own rate, carried straight through the press — at
    // p = 0 the whole turn is moving at precisely that, so there is no
    // seam to see. The second is the burst's own winding, which starts
    // at nothing and rushes at the end, added on top of it.
    const turn = burst.rate * BURST_WIND * p +
                 burst.way * BURST_TURNS * Math.PI * 2 * Math.pow(p, BURST_SPIN);
    const spot = burst.spot;
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];

      if (speck.onRing) {
        onOrbit(speck.rA + turn, speck.rR * shrink * held, spot, core);
        const off = speck.rOff * shrink * held;
        speck.x = spot[0] + AXIS[0] * off;
        speck.y = spot[1] + AXIS[1] * off;
        speck.z = spot[2] + AXIS[2] * off;
      } else if (speck.wx !== undefined) {
        // A LOOSE ONE FALLS IN ON ITS OWN, AND ON A CURVE.
        //
        // It used to be drawn straight down its own radius, which is the
        // one path a thing crossing a room never takes. What it does now
        // is carry on the way it was already going and be bent out of it
        // by the middle — two terms, multiplied:
        //
        //   COAST   where it would have got to on the heading it had
        //           when the press landed, had nothing pulled at it.
        //   LEFT    how much of the way out it still has, falling as
        //           `1 - q^n` — flat at the start and rushing at the
        //           end, which is a thing gathering speed as it nears
        //           a centre of gravity.
        //
        // Multiplied rather than blended, and that is what makes the
        // path a curve: at q = 0 `left` is 1 and its slope is 0, so the
        // particle leaves at EXACTLY the velocity it had — no kink at
        // the press — and the pull only tells later, by which time it
        // has already swung wide of its own radius.
        //
        // `n` is BURST_CLOSE, the same power the ring narrows on, which
        // is the owner's "acceleration matching the particles of the
        // ring". They still arrive independently: what differs between
        // two of them is when they set off and how long they take, not
        // how they gather.
        const q = Math.max(0, Math.min(1, (p - speck.lag) / speck.span));
        const left = 1 - Math.pow(q, BURST_CLOSE);
        const coast = LOOSE_COAST * q;
        speck.x = core[0] + (speck.wx + speck.wvx * coast) * left;
        speck.y = core[1] + (speck.wy + speck.wvy * coast) * left;
        speck.z = core[2] + (speck.wz + speck.wvz * coast) * left;
      }
      speck.vx = 0; speck.vy = 0; speck.vz = 0;
    }
  }

  // ============================================================
  // A CHAPTER'S OWN PAGE
  //
  // Three things happen on it that did not before, and all three are
  // the owner's:
  //
  //   THE ARROWS   either side of the name, stepping one chapter along
  //                and wrapping round. Nothing about the burst is
  //                replayed: the page you are standing on is rewritten
  //                under you.
  //   THE GROUND   a drawing behind the page, if that chapter asks for
  //                one. Chapter 1 asks for the sun.
  //   A CARD OPENS WHERE IT STANDS, taking the whole width of the grid
  //                so the favourites after it go down a row, and
  //                carrying what is written about that fragrance and
  //                the two ways on from it.
  // ============================================================

  /** The card that is open, or null. One at a time: a second would
      have the first still standing above it saying the same things. */
  let openCard = null;
  /** The drawing standing behind the chapter that is showing, or null. */
  let ground = null;
  /** The timer turning the page to another chapter, if one is running. */
  let turning = 0;
  /** How long the writing takes to go before the page is rewritten. */
  const TURN_MS = 340;
  /** How long a card takes to open, and to shut. */
  const CARD_MS = 420;

  /** The chapter, written onto the page. Built from the page's own
      markup every time, so a chapter renamed or re-filed in the HTML is
      right here without anything else being touched.

      IT IS SPLIT FROM `layChapter` because the arrows rewrite the page
      without laying it. Laying it is the end of the burst — the page
      going under the mesh — and stepping from one chapter to the next
      must not play any of that again. */
  function writeChapter(i) {
    const chapter = chapters[i];
    shutNote(true);
    openCard = null;
    chapterName.textContent = chapter.name;
    chapterSpec.textContent = specOf(chapter.items);

    const note = notes[chapter.name];
    chapterNote.innerHTML = note || "";
    chapterNote.hidden = !note;

    // The arrows say nothing when there is only one chapter to be on.
    [...chapterPage.querySelectorAll(".chapter-step")].forEach((step) => {
      step.hidden = chapters.length < 2;
    });

    chapterCards.innerHTML = "";
    chapter.items.forEach((item, n) => chapterCards.appendChild(makeCard(item, n)));
    // A CHAPTER CAN HAVE NOTHING IN IT. Chapter 2 is named and written
    // up and has no favourites yet, and an empty grid would leave a
    // gap under the writing that reads as something failing to load.
    chapterCards.hidden = !chapter.items.length;

    setGround(grounds[chapter.name] || "");

    // One number per thing on the sheet, so they come in one behind the
    // other. Counted here rather than in CSS because the note is not
    // always there.
    let place = 0;
    [...chapterPage.querySelectorAll(".chapter-sheet > *")].forEach((one) => {
      if (one.hidden) return;
      one.style.setProperty("--i", String(place));
      place += 1;
    });
  }

  /** ONE FAVOURITE, AS A CARD THAT OPENS WHERE IT STANDS.

      It used to be a link straight to the piece. The owner asked for it
      to open in place instead — "the other favorite fragrances will go
      down and the square in which Des Cendres is will expand revealing
      the window of the fragrance" — and what it opens into carries the
      link on from it, so the card itself cannot be one: a link inside a
      link is not a thing the browser will build. It is a button. */
  function makeCard(item, n) {
    const shell = document.createElement("div");
    shell.className = "chapter-card-shell";
    shell.style.setProperty("--n", String(n));

    const card = document.createElement("button");
    card.type = "button";
    card.className = "chapter-card";
    card.setAttribute("aria-expanded", "false");
    card.innerHTML =
      '<span class="chapter-card-no"></span>' +
      '<span class="chapter-card-name"></span>' +
      '<span class="chapter-card-house"></span>' +
      '<span class="chapter-card-go" aria-hidden="true">OPEN \u2193</span>';
    card.querySelector(".chapter-card-no").textContent = numbered(n);
    card.querySelector(".chapter-card-name").textContent = item.name;
    // THE HOUSE THE PERFUME COMES FROM, where the date used to stand.
    // A favourite that has not been told its house says so with a rule
    // rather than with nothing, so the card keeps its shape.
    card.querySelector(".chapter-card-house").textContent = item.house || "—";
    shell.appendChild(card);

    const body = document.createElement("div");
    body.className = "chapter-card-body";
    body.hidden = true;
    body.innerHTML =
      '<div class="fav-writing">' +
        (writings[item.name] ||
          '<p class="gallery-waiting">Nothing has been written about this one yet.</p>') +
      "</div>" +
      '<p class="fav-links">' +
        '<a class="fav-link fav-link-go" href="' + (item.href || "#") + '">' +
          '<span class="fav-link-say">Go to fragrance</span>' +
          '<span class="fav-link-mark" aria-hidden="true">→</span></a>' +
        '<button type="button" class="fav-link fav-link-notes" ' +
          'aria-haspopup="dialog" aria-controls="fav-note">' +
          '<span class="fav-link-say">Notes</span>' +
          '<span class="fav-link-mark" aria-hidden="true">↗</span></button>' +
      "</p>";
    shell.appendChild(body);

    card.addEventListener("click", () => turnCard(shell));
    body.querySelector(".fav-link-notes")
      .addEventListener("click", (e) => showNote(item, e.currentTarget));
    return shell;
  }

  /** Open it if it is shut, shut it if it is open. */
  function turnCard(shell) {
    if (openCard === shell) { shutCard(shell); return; }
    if (openCard) shutCard(openCard);
    const card = shell.querySelector(".chapter-card");
    const body = shell.querySelector(".chapter-card-body");
    // WHERE EVERY OTHER CARD STANDS BEFORE THIS ONE TAKES THE ROW.
    // Widening a card re-lays the whole grid in one frame, so the ones
    // after it would JUMP down rather than travel — and the owner asked
    // for them to go down. Their places are read first, given back to
    // them as a transform once the grid has moved, and then released,
    // so each one travels from where it was to where it now is.
    const others = [...chapterCards.children].filter((one) => one !== shell);
    const was = others.map((one) => one.getBoundingClientRect());

    openCard = shell;
    shell.classList.add("is-open");
    card.setAttribute("aria-expanded", "true");
    card.querySelector(".chapter-card-go").textContent = "CLOSE \u2191";
    body.hidden = false;
    if (REDUCE_MOTION) { body.style.height = "auto"; return; }
    travel(others, was);
    // Opened on a measured height, the way a part of a house opens:
    // `auto` is not a height the browser will ease to.
    const tall = body.scrollHeight;
    body.style.height = "0px";
    body.getBoundingClientRect();
    body.style.height = tall + "px";
    after(body, () => { body.style.height = "auto"; });
  }

  function shutCard(shell) {
    const card = shell.querySelector(".chapter-card");
    const body = shell.querySelector(".chapter-card-body");
    card.setAttribute("aria-expanded", "false");
    card.querySelector(".chapter-card-go").textContent = "OPEN \u2193";
    if (openCard === shell) openCard = null;
    if (REDUCE_MOTION) {
      shell.classList.remove("is-open");
      body.hidden = true;
      body.style.height = "";
      return;
    }
    const others = [...chapterCards.children].filter((one) => one !== shell);
    const was = others.map((one) => one.getBoundingClientRect());
    body.style.height = body.scrollHeight + "px";
    body.getBoundingClientRect();
    shell.classList.remove("is-open");
    body.style.height = "0px";
    travel(others, was);
    after(body, () => { body.hidden = true; body.style.height = ""; });
  }

  /** Wait for a height to finish easing, with a backstop for the case
      where the transition never runs at all — a background tab, or a
      browser that has been told not to animate. */
  function after(body, done) {
    let timer = 0;
    const end = (e) => {
      if (e && (e.target !== body || e.propertyName !== "height")) return;
      body.removeEventListener("transitionend", end);
      window.clearTimeout(timer);
      done();
    };
    body.addEventListener("transitionend", end);
    timer = window.setTimeout(() => end(null), CARD_MS + 120);
  }

  /** FLIP: put them back where they were and let them go. The transform
      is written on the SHELL and the entrance animation runs on the
      card inside it, which is not an accident — a CSS animation with a
      fill outranks an inline style, so an entrance that finished on
      `transform: none` would simply ignore this. */
  function travel(nodes, was) {
    nodes.forEach((one, n) => {
      const now = one.getBoundingClientRect();
      const dx = was[n].left - now.left;
      const dy = was[n].top - now.top;
      if (!dx && !dy) return;
      one.style.transition = "none";
      one.style.transform = "translate(" + dx + "px, " + dy + "px)";
      one.getBoundingClientRect();
      one.style.transition = "transform " + CARD_MS + "ms var(--menu-ease)";
      one.style.transform = "";
      window.setTimeout(() => {
        one.style.transition = "";
        one.style.transform = "";
      }, CARD_MS + 60);
    });
  }

  // ============================================================
  // A FAVOURITE'S NOTES
  //
  // The same window as everywhere else on the site, written by the one
  // renderer in notes.js, in this page's own colours. The owner: "Notes
  // will do the exact same thing everywhere else... just copy the
  // information but adjust the theme."
  // ============================================================
  /** What to give the keyboard back to when the window shuts. */
  let noteFrom = null;
  let noteEnding = null;
  let noteTimer = 0;

  function showNote(item, from) {
    const panel = window.NOTE_PANEL;
    if (!panel) return;
    settleNote();
    noteFrom = from || null;
    favNote.querySelector(".note-head-of").textContent = item.name;
    favNote.querySelector(".note-in").innerHTML =
      panel.html((window.FRAGRANCE_NOTES || {})[item.notes], "fav-note");
    favScrim.hidden = false;
    favNote.hidden = false;
    if (REDUCE_MOTION) {
      favScrim.classList.add("is-on");
      favNote.classList.add("is-up");
    } else {
      // Two frames: one for the browser to take the window as being
      // where it starts from, one to move it.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        favScrim.classList.add("is-on");
        favNote.classList.add("is-up");
      }));
    }
    const shut = favNote.querySelector(".note-shut");
    if (shut) shut.focus({ preventScroll: true });
  }

  /** Off the page, and everything that was waiting for it stopped. */
  function settleNote() {
    window.clearTimeout(noteTimer);
    noteTimer = 0;
    if (noteEnding) {
      favNote.removeEventListener("transitionend", noteEnding);
      noteEnding = null;
    }
    favNote.hidden = true;
    favNote.classList.remove("is-up");
    favScrim.hidden = true;
    favScrim.classList.remove("is-on");
  }

  /** THE FADE ITSELF SAYS WHEN IT IS DONE, and the number is only the
      backstop. Cutting a window and its scrim on a timer is the bug
      that shipped once already on the house pages — see the note in
      style.css — and it is not repeated here. */
  function shutNote(atOnce) {
    if (favNote.hidden) {
      if (noteFrom) noteFrom = null;
      return;
    }
    favNote.classList.remove("is-up");
    favScrim.classList.remove("is-on");
    const back = noteFrom;
    noteFrom = null;
    if (atOnce || REDUCE_MOTION) { settleNote(); }
    else {
      noteEnding = (e) => {
        if (e.target !== favNote || e.propertyName !== "opacity") return;
        settleNote();
      };
      favNote.addEventListener("transitionend", noteEnding);
      noteTimer = window.setTimeout(settleNote, 900);
    }
    if (back && !atOnce) back.focus({ preventScroll: true });
  }

  favScrim.addEventListener("click", () => shutNote(false));
  favNote.querySelector(".note-shut").addEventListener("click", () => shutNote(false));
  const noteShowing = () => !favNote.hidden;

  // ============================================================
  // THE DRAWING BEHIND A CHAPTER'S PAGE
  //
  // A ground registers itself on `window.CHAPTER_GROUNDS` from its own
  // script — `sun.js` is the one there is — and is handed the canvas
  // and a way of asking where the writing stands, so it can quieten
  // itself behind it the way Ataraxia's bands are quietened over their
  // column. A chapter with no ground is black, as it always was.
  // ============================================================
  function setGround(name) {
    if (ground && ground.name === name) return;
    if (ground) { ground.stop(); ground = null; }
    chapterGround.hidden = true;
    const make = name && (window.CHAPTER_GROUNDS || {})[name];
    if (!make) return;
    chapterGround.hidden = false;
    const made = make(chapterGround, {
      column: () => {
        const sheet = chapterPage.querySelector(".chapter-sheet");
        return sheet ? sheet.getBoundingClientRect() : null;
      },
    });
    if (made && made.stop) ground = { name: name, stop: made.stop };
    else chapterGround.hidden = true;
  }

  /** THE ARROWS. One chapter along, wrapping round — the owner's
      "cycle through the page in order to acceess chapter 2 and 3 and 1
      again". The writing goes, the page is rewritten under it, and its
      entrance is run again, so stepping to a chapter reads like
      arriving at one rather than like a table being refilled. */
  function stepChapter(way) {
    if (!burst || burst.phase !== "open" || leaving || turning) return;
    if (chapters.length < 2) return;
    const to = (burst.chapter + way + chapters.length) % chapters.length;
    if (to === burst.chapter) return;
    burst.chapter = to;
    shutNote(true);
    if (REDUCE_MOTION) { writeChapter(to); chapterPage.scrollTop = 0; return; }
    chapterPage.classList.add("turning");
    turning = window.setTimeout(() => {
      turning = 0;
      writeChapter(to);
      chapterPage.scrollTop = 0;
      chapterPage.classList.remove("here");
      void chapterPage.offsetWidth;          // so the entrance plays again
      chapterPage.classList.add("here");
      chapterPage.classList.remove("turning");
    }, TURN_MS);
  }

  /** The chapter, laid under the mesh at the end of the burst.

      NOTHING IS CLIPPED. The page used to be cut open from the point
      the particles met, and the whole of that — `clipTo`, CLIP_ROUND,
      the clip-path on .chapter-page — is gone: the owner asked for the
      black part of the explosion removed, and the web's own panels
      turn black in its place. So the page is simply laid under the web
      once the web has the window covered, and by then both are black.

      AND ITS WRITING WAITS FOR THE DRAWING TO GO. `laid` is the page
      standing under the mesh — black under black, with nothing on it
      yet — and `here` is the mesh gone. Everything on the sheet comes
      in on `here`.

      It used to arrive underneath: the page was laid at PAGE_LAID and
      its cards started their entrance there, four hundred-odd
      milliseconds before the drawing was taken off. By the time you
      could see anything the heading was simply there and the cards
      were half way in, so the end of the burst read as a cut to a page
      already part built. That is what the owner meant by the handover
      not being smooth. */
  function layChapter(i) {
    writeChapter(i);
    chapterPage.hidden = false;
    chapterPage.scrollTop = 0;
    page.classList.add("chapter-open");
    chapterPage.classList.add("laid");
    if (REDUCE_MOTION) settleChapter();
  }

  /** The drawing is off: the page has the window, and its writing can
      come in. */
  function settleChapter() {
    chapterPage.classList.remove("laid");
    chapterPage.classList.add("here");
  }

  /** THE HUB, CAST OUT FROM THE POINT THEY MET — the first thing out,
      and the web goes with it.

      IN THE RING'S OWN PLANE, not square to the screen: the shape is
      measured off the orbit as it stands (`ringOnScreen`) and handed to
      the stylesheet as four numbers — where its middle is on the window,
      which way its long axis lies, and how flat it is drawn. The shells
      are turned and pressed to match, and `drawMesh` lays its lattice
      out in the same plane afterwards. */
  function castWave() {
    if (REDUCE_MOTION) return;
    if (burst && !burst.ring) burst.ring = ringOnScreen();
    const ring = (burst && burst.ring) || ringOnScreen();
    chapterWave.style.setProperty("--wave-x", ring.x.toFixed(1) + "px");
    chapterWave.style.setProperty("--wave-y", ring.y.toFixed(1) + "px");
    chapterWave.style.setProperty("--wave-turn", ring.turn.toFixed(4) + "rad");
    chapterWave.style.setProperty("--wave-flat", ring.flat.toFixed(4));
    // The shells ride out with the web rather than on a length of their
    // own written into the stylesheet, so changing BURST_WEB moves all
    // of it together.
    chapterWave.style.setProperty("--wave-ms", (BURST_WEB * 1000).toFixed(0) + "ms");
    chapterWave.hidden = false;
    // THE WAVE IS RE-CUT EVERY TIME. Its shells are CSS animations on
    // elements that are built once, and an animation only plays once
    // unless it is given back to the browser as new — so reopening a
    // chapter showed the page with no wave at all. Replacing their
    // box's contents is what starts them again. It is `shells` and not
    // `chapterWave`, so the canvas beside them is left where it is —
    // see the note where they are built.
    shells.innerHTML = shells.innerHTML;
  }

  /** One step of the burst. Returns true while it is running the
      particles itself, so `frame` knows to leave `move` alone. */
  function stepBurst(dt) {
    if (!burst) return false;
    burst.since += dt;
    if (burst.phase === "open") return true;
    burst.at += dt;

    if (burst.phase === "wind") {
      const p = Math.min(1, burst.at / BURST_WIND);
      windIn(p);
      if (p >= 1) {
        burst.phase = "web";
        burst.at = 0;
        // The web goes out from the point they met, and it is the whole
        // of the rest of the burst — there is no second beat behind it
        // any more.
        burst.ring = ringOnScreen();
        shell.classList.add("burst-wave");
        castWave();
      }
      return true;
    }

    // THE WEB, AND NOTHING FOLLOWING IT.
    //
    // It used to be two beats: the hub going out over the chamber's
    // white, and then the black cut open behind it (`WAVE_LEAD`). The
    // owner asked for the black gone, for the geometry to run the whole
    // way rather than half of it, and for the drawing's own panels to
    // darken to the colour of the page instead. So there is one
    // movement now, and the page is laid under it only once the panels
    // have the window covered.
    const p = Math.min(1, burst.at / BURST_WEB);
    drawMesh(p);
    if (p >= PAGE_LAID && chapterPage.hidden) layChapter(burst.chapter);
    // THE DRAWING IS HANDED OVER RATHER THAN SWITCHED OFF. By here the
    // whole window is the drawing's own black and the page under it is
    // the same black, so this shows nothing on a good frame — it is
    // there for the bad one, where a dropped frame or two near the end
    // leaves a panel short of black and clearing the canvas would show
    // the step. Fading it costs nothing and cannot.
    rings.style.opacity = p >= MESH_HAND
      ? (1 - (p - MESH_HAND) / (1 - MESH_HAND)).toFixed(3) : "";
    if (burst.at >= BURST_WEB) {
      if (chapterPage.hidden) layChapter(burst.chapter);
      burst.phase = "open";
      burst.at = 0;
      chapterWave.hidden = true;
      rings.style.opacity = "";
      paintRings.clearRect(0, 0, width, height);
      // And only now does the page write itself in.
      settleChapter();
    }
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
    // Out of a notes window first, then out of a chapter, then out of
    // the menu — one level at a time, the way it always stepped out.
    if (noteShowing()) { shutNote(false); return; }
    if (chapterShowing()) { closeChapter(); return; }
    if (!opened) return;
    setOpen(false, true);
  });

  // Anywhere off the writing puts it back, the same way the theories
  // drawing puts a set-out station back — the ring is the rest of the
  // page and pressing it is how you leave the menu.
  document.addEventListener("pointerdown", (e) => {
    // Nothing off the writing closes anything while a chapter is being
    // arrived at, is standing open, or is being left — the page belongs
    // to the chapter then, and the way out of it is its own way back.
    if (chapterShowing()) return;
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
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
                           window.devicePixelRatio || 1);
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
    rings.width = Math.round(width * ratio);
    rings.height = Math.round(height * ratio);
    rings.style.width = width + "px";
    rings.style.height = height + "px";
    paintRings.setTransform(ratio, 0, 0, ratio, 0, 0);
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

    // THE DRAWING'S OWN CHROME FADES HERE, not by fading the canvas it
    // is on. For one round the front canvas was taken to nothing for
    // the length of the burst — and the front canvas is not only
    // chrome: everything nearer than the middle of the chamber is drawn
    // on it, which is HALF THE DISC. The near half of the ring went
    // invisible on the way in, and what closed was a crescent again.
    // What fades is what is chrome — the orbit's path, its ticks, the
    // injectors and their leaders and labels — and every particle is
    // left alone.
    const marks = burst ? Math.max(0, 1 - burst.since / MARKS_FADE) : 1;
    if (marks > 0.01) {
      paint.globalAlpha = marks;
      paintFront.globalAlpha = marks;
      drawMarks();
      paint.globalAlpha = 1;
      paintFront.globalAlpha = 1;
    }
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

    // The web is the cursor's answer, and there is nothing to answer
    // once the chamber is on its way out.
    if (!burst) drawWeb();
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
    paintFront.strokeStyle = rgba(INK, MESH_INK);
    paintFront.stroke();
  }

  // ============================================================
  // WHILE THE TAB IS AWAY
  //
  // A browser stops calling requestAnimationFrame in a tab that is not
  // in front — there is nothing a page can do about that, and nothing
  // it should: drawing to a window nobody is looking at is work for
  // no one. But the owner asked for the chamber to go on FILLING while
  // they are elsewhere, and that is a different thing from drawing.
  //
  // So the time is paid back. `dt` is capped at a twentieth of a second
  // — it has to be, or one long gap would fling every particle across
  // the window in a single step — which means a tab left for a minute
  // comes back exactly as it was left. Instead the seconds that passed
  // are run through the physics in ordinary-sized steps, all at once,
  // before the first frame is drawn. You come back to the chamber as
  // full as if you had watched it fill.
  //
  // Capped at CATCH_MOST because there is no point past it: the
  // chamber reaches its settled state in well under that, so a tab left
  // for an hour and a tab left for twenty seconds come back the same.
  const CATCH_STEP = 1 / 40;   // the size of a caught-up step, in seconds
  const CATCH_MOST = 20;       // and the most that is ever paid back
  let wentAway = 0;

  document.addEventListener("visibilitychange", () => {
    if (REDUCE_MOTION) return;
    if (document.hidden) { wentAway = now(); return; }
    if (!wentAway) return;
    let owed = Math.min(CATCH_MOST, (now() - wentAway) / 1000);
    wentAway = 0;
    while (owed > 0) {
      const step = Math.min(CATCH_STEP, owed);
      if (!stepBurst(step)) move(step);
      owed -= step;
      clock += step;
    }
    // And the next frame measures from NOW, not from whenever the last
    // one was drawn — otherwise it pays the same time twice.
    last = window.performance && window.performance.now
      ? window.performance.now() : Date.now();
  });

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
