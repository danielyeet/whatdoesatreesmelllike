// ============================================================
// THE STRUCTURE (categories/theories.html only)
//
// The theories are a STRUCTURE you travel through — read as a
// technical drawing rather than as a night sky. A frame of ribs and
// rails runs away from you into the depth, a ruled spine runs along
// the floor of it, and a fine swarm of particles hangs in the air
// between. Scrolling carries you *into* the screen, the near work
// sweeping past and new work coming up out of the dark. You cannot
// turn it or drag it sideways — the only thing you can do is go
// further in, which is the whole of the gesture.
//
// Two kinds of assembly stand in that frame, and the difference
// matters:
//
//   A STATION is one theory. It is bracketed, crosshaired, numbered
//   and named, and it is the thing you click.
//
//   A FIXTURE is only structure: the same kind of figure, unnamed,
//   unbracketed, fainter, and not clickable. They are there so the
//   frame is full of work rather than holding nine lit things in an
//   empty volume — and so that being bracketed *means* something.
//
// Four things are worth knowing before changing any of it:
//
//   The travel is the page's own scroll. The canvas is fixed and the
//   page is made tall enough to hold the road, so the scrollbar, the
//   trackpad, the arrow keys, Page Down and a finger on a phone all
//   work without a line of code — rather than the wheel being caught
//   and turned into movement, which breaks every one of those.
//
//   The spine is a second way to drive that same scroll. Dragging it
//   writes the page's scroll position, so it is a jog wheel for the
//   travel and not a separate idea of where you are.
//
//   The swarm wraps in BOTH directions. Its depth is taken modulo
//   DEEP each frame rather than a speck being moved along when it
//   goes past, so going back up the road fills the air again exactly
//   as coming down it does. Moving them along is what made the air
//   empty out when you scrolled back, and it cannot come back in this
//   shape.
//
//   The frame itself does not wrap: ribs, rails, stations and
//   fixtures stand at fixed depths along a road with a beginning and
//   an end, so there is always somewhere to have got to.
//
// WITHOUT THIS FILE the page is the plain list of rows every other
// category uses. The script puts `structured` on <body> and takes
// over; every rule that hides the list is written under that class,
// so the fallback cannot inherit it.
// ============================================================
(function () {
  const page = document.querySelector(".theories-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const rows = Array.from(list.querySelectorAll(".work-row"));
  if (!rows.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 7;              // the same structure every visit

  // --- the swarm: the particles hanging in the air
  //
  // THE SWARM IS THE SHAPE AND THE SIZE OF THE WINDOW. It used to be a
  // fixed two thousand specks scattered through a square cross-section,
  // which meant the air was thin on a wide screen and crowded on a small
  // one, and the corners of a wide window stood empty while a square of
  // sky in the middle was full. Both come off the page's own dimensions
  // now: how many are drawn from its area, so the air is the same
  // thickness whatever it is shown on, and the cross-section stretched
  // to its aspect ratio, so the volume you travel through is the shape
  // of the hole you are looking through.
  //
  // THE POOL IS STILL BUILT WHOLE, AND FIRST, and the window only says
  // how much of it to draw. That is not an optimisation — `random()` is
  // the one seeded stream this whole drawing is built from, and the
  // stations are built after the swarm. Building a different number of
  // specks moves every station on the page, which is how this was first
  // written and how it broke the test that says a station stays where it
  // is. Take specks off the end; never build a different number of them.
  const SWARM_POOL = 2200;     // how many are built with the drawing
  const SWARM_PER = 2400;      // how many are drawn, per million pixels of window
  const SWARM_LEAST = 900;     // never fewer than this
  const SWARM_MOST = 3400;     // and never more, however large the window
  const SPREAD = 26;           // how far out they are scattered, before the window's shape
  const DEEP = 74;             // the depth they wrap over
  const NEAR = 0.9;            // nothing nearer than this is drawn
  const FADE_NEAR = 4.5;       // and a speck is already out before it wraps
  const LENS = 1.15;           // the focal length, against the smaller side
  const WOBBLE = 0.09;         // how far a speck drifts about its own place

  // --- the frame: ribs across the way, rails along it
  const RIB_EVERY = 9;         // how far apart the ribs stand
  const RIB_X = 13;            // half the width of one
  const RIB_Y = 8;             // and half its height
  const FRAME_SHOW = 64;       // how far ahead the frame is drawn

  // --- the spine: the ruled line along the floor, which is the wheel
  const FLOOR = 2.45;          // how far below the eye it runs
  const SPINE_SHOW = 46;       // how far ahead it is ruled
  const GEAR = 2.4;            // page pixels of scroll per pixel dragged

  // --- what stands in the frame
  const STOP_EVERY = 30;       // how far apart the stations stand
  const FIRST_STOP = 16;       // and how far in the first one is
  const RUN_ON = 26;           // how much road is left past the last of them
  const NODES = 11;            // how many particles a station is made of
  const NODE_SPREAD = 3.0;     // how wide it stands
  const JOIN = 3;              // how many neighbours each is joined to
  const FIXTURES = 30;         // how many unnamed assemblies are scattered about

  // The window a station is on the page for. It is deliberately wider
  // than STOP_EVERY: the next one has to be coming up out of the dark
  // before the last has gone, or there are stretches of the road with
  // nothing named on them at all.
  const SHOW_FROM = 41;        // the depth a station starts coming up at
  const SHOW_BEST = 12;        // where it is brightest
  const SHOW_TO = 2;           // and where it has gone past

  // --- movement
  //
  // The travel is never quite still, but it always comes back: the
  // creep is a slow BREATH in and out of a fixed place, not a drift
  // that keeps going. It used to be added up frame after frame, so
  // where you were was the scroll plus however long the page had been
  // open — leave it a minute and the start of the road was a minute
  // behind you, and scrolling all the way back to the top of the page
  // no longer got you to the beginning of it. Anything here that
  // decides where the eye is has to be something a scroll can undo.
  const CREEP = 0.5;           // how far the travel breathes, in units of the road
  const CREEP_EVERY = 24;      // and how many seconds one breath takes
  const EASE = 0.12;           // how quickly it catches up with the scroll
  const SCREENS = 1.25;        // how many screens of scrolling a station is worth

  // --- the opening
  //
  // The page does not simply appear: the drawing is SET UP. The rails
  // shoot out to the vanishing point, the ribs come up out of the
  // depth one after another towards you, the rule writes itself along
  // the floor, the air fills, and the corner sights snap in last —
  // the instrument being made ready, and then handed to you.
  //
  // It is short on purpose. An opening you have to sit through is a
  // door you have to wait at, and this one is in front of the only
  // thing on the page.
  const INTRO_MS = 1500;       // how long the drawing takes to set itself up
  const INTRO_AIR = 0.3;       // the air is full by this far into it
  const INTRO_RAILS = 0.45;    // the rails have reached you by here
  const INTRO_RIBS = 0.55;     // the last rib arrives by here
  const INTRO_SIGHTS = 0.72;   // and the sights snap in after this

  // --- opening one
  //
  // Clicking a station does not go to it: it takes it out of the
  // frame, lays it out for reading, and writes a card beside it. The
  // theory is one click further on, from the card or the figure.
  const OPEN_EASE = 0.09;      // how quickly it comes forward and squares up
  const OPEN_TURN = 0.8;       // how far the figure turns as it comes, in radians
  const OPEN_RING = 0.15;      // how wide it is laid out, against the smaller side
  const OPEN_PART = 3.6;       // every part of it drawn the same size, being a set-out
  const OPEN_VEIL = 0.82;      // how far the rest of the frame is taken back behind it
  const OPEN_AT = [0.32, 0.5]; // where on the window it is laid out, side on
  const OPEN_OVER = [0.5, 0.3]; // and where when the card has to go under it

  // --- the moving parts
  const CARRIAGE_FROM = 58;    // where the travelling gantry starts back
  const CARRIAGE_SPEED = 13;   // and how fast it comes at you, units a second
  const CARRIAGE_EVERY = 6.7;  // and how many seconds from one pass to the next
  const CARRIAGE_FIRST = 2.6;  // nothing runs until the drawing has set itself up
  const TRAVERSE_EVERY = 2.3;  // seconds between things running across the frame
  const TRAVERSES = 4;         // how many can be in the air at once

  // The palette is a drawing office, not a sky: white and near-white
  // on gray-black, with one cool blue kept back for the things you
  // can actually click.
  const DARK = "#0a0b0e";
  const WHITE = "238,241,246";
  const COOL = "213,222,234";
  const ACCENT = "142,180,226";
  const STEEL = "150,160,176";

  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  // ============================================================
  // A SEEDED STRUCTURE
  // ============================================================
  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  /** A stable number from two whole numbers — no state, so it can be
      asked the same question twice and answer the same way. */
  function hash2(a, b) {
    let h = Math.imul((a | 0) + 0x9e3779b9, 0x27d4eb2d) ^
            Math.imul((b | 0) + 0x85ebca6b, 0x165667b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2545f491);
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  }

  // The swarm. A speck keeps no position along the road at all: its
  // place is worked out from which lap of the volume it is on, so it
  // wraps both ways for free and nothing has to be moved along.
  const swarm = [];
  for (let n = 0; n < SWARM_POOL; n++) {
    swarm.push({
      id: n * 2654435761 % 2147483647,
      z: random() * DEEP,
      size: 0.7 + random() * random() * 2.4,
      lit: 0.3 + random() * random() * 0.8,
      cool: random() < 0.24,
      glow: random() < 0.07,
      rate: 0.4 + random() * 1.5,
      phase: random() * 6.283,
    });
  }

  // A LARGE WINDOW MAY ASK FOR MORE SPECKS THAN THE POOL HOLDS, and the
  // pool can be extended for it — but only from a stream of numbers of
  // its own, and only after everything else has been built. `random()`
  // is what the stations are built from; drawing a single value from it
  // here would move them. See the note on the pool above.
  let poolSeed = 20260917;
  const morePool = () => {
    poolSeed = (poolSeed * 1664525 + 1013904223) % 4294967296;
    return poolSeed / 4294967296;
  };
  function growPool(many) {
    while (swarm.length < many) {
      const n = swarm.length;
      swarm.push({
        id: n * 2654435761 % 2147483647,
        z: morePool() * DEEP,
        size: 0.7 + morePool() * morePool() * 2.4,
        lit: 0.3 + morePool() * morePool() * 0.8,
        cool: morePool() < 0.24,
        glow: morePool() < 0.07,
        rate: 0.4 + morePool() * 1.5,
        phase: morePool() * 6.283,
      });
    }
  }

  /** The figure inside an assembly: every particle joined to the few
      nearest it, each line once. Some of the lines are provisional —
      they come and go on their own clock, which is what keeps a
      figure from reading as a printed diagram. */
  function figureOf(nodes) {
    const lines = [];
    nodes.forEach((node, a) => {
      nodes
        .map((other, b) => ({
          b: b,
          d: Math.hypot(other.x - node.x, other.y - node.y, other.z - node.z),
        }))
        .filter((one) => one.b !== a)
        .sort((one, two) => one.d - two.d)
        .slice(0, JOIN)
        .forEach((one) => {
          if (a < one.b) {
            const loose = random() < 0.4;
            lines.push({
              a: a,
              b: one.b,
              loose: loose,
              rate: 0.25 + random() * 0.5,
              phase: random() * 6.283,
              bead: random() < 0.45,
              beadRate: 0.16 + random() * 0.24,
              beadPhase: random(),
            });
          }
        });
    });
    return lines;
  }

  function assemble(at, count, spread, sizeFrom, sizeTo) {
    const nodes = [];
    for (let n = 0; n < count; n++) {
      nodes.push({
        x: at.x + (random() - 0.5) * 2 * spread,
        y: at.y + (random() - 0.5) * 2 * spread,
        // Flatter than it is wide, so an assembly reads as a plate
        // standing in the frame rather than as a ball of dots.
        z: at.z + (random() - 0.5) * 2 * spread * 0.45,
        size: sizeFrom + random() * (sizeTo - sizeFrom),
        cool: random() < 0.3,
        rate: 0.5 + random() * 1.4,
        phase: random() * 6.283,
      });
    }
    return { at: at, nodes: nodes, lines: figureOf(nodes) };
  }

  // The stations: one per theory, each at its own depth, placed round
  // a slow spiral so no two come up in the same part of the frame.
  // Never dead ahead — one in the middle of the screen is something
  // you fly into, and one off to the side is something you pass.
  const stops = rows.map((row, i) => {
    const title = row.querySelector(".work-row-title");
    const meta = row.querySelector(".work-row-meta");
    const around = i * 2.1 + random() * 0.5;
    const out = 4.4 + random() * 3.4;
    const at = {
      x: Math.cos(around) * out,
      y: Math.sin(around) * out * 0.62,
      z: FIRST_STOP + i * STOP_EVERY,
    };
    const built = assemble(at, NODES, NODE_SPREAD, 1.1, 3.1);

    // Which place on the ring each part takes when the station is
    // opened out. They are read off round the figure as it already
    // stands, so opening it is the parts moving out to arm's length
    // rather than the figure being shuffled: nothing crosses anything.
    const round = built.nodes
      .map((node, n) => ({ n: n, a: Math.atan2(node.y - at.y, node.x - at.x) }))
      .sort((one, two) => one.a - two.a);
    const order = new Array(built.nodes.length);
    round.forEach((one, place) => { order[one.n] = place; });

    return Object.assign(built, {
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      note: (row.dataset.note || "").trim(),
      // A PLATE, when the piece has one: `data-plate` on the row is a
      // picture summing the theory up, and the card shows it above the
      // writing. It is the row's own and read off the page like
      // everything else here, so a theory that has no picture yet
      // simply does not get one.
      plate: (row.dataset.plate || "").trim(),
      plateSay: (row.dataset.plateAlt || "").trim(),
      // A SECOND WAY IN, for a piece that carries something of its own
      // worth going straight to: `data-calc` on the row is that
      // address, and the card puts it at its foot. Read off the page
      // like everything else here, so a theory without one simply does
      // not get the button.
      calc: (row.dataset.calc || "").trim(),
      href: row.getAttribute("href"),
      number: String(i + 1).padStart(2, "0"),
      ring: random() * 6.283,
      order: order,
    });
  });

  const ROAD = FIRST_STOP + (stops.length - 1) * STOP_EVERY + RUN_ON;

  // The fixtures: assemblies that are only assemblies. They stand
  // further out to the sides than the stations and are drawn fainter
  // and smaller, and they carry a code rather than a name.
  const fixtures = [];
  for (let n = 0; n < FIXTURES; n++) {
    const around = random() * 6.283;
    const out = 7 + random() * 11;
    const at = {
      x: Math.cos(around) * out,
      y: Math.sin(around) * out * 0.7,
      z: 5 + random() * (ROAD - 8),
    };
    const built = assemble(at, 5 + Math.floor(random() * 5), 1.6 + random() * 1.6, 0.8, 1.9);
    built.code =
      String.fromCharCode(65 + Math.floor(random() * 6)) + "-" +
      String(Math.floor(random() * 900) + 100);
    built.faint = 0.34 + random() * 0.3;
    fixtures.push(built);
  }

  // ============================================================
  // THE PAGE
  // ============================================================
  document.body.classList.add("structured");

  const shell = document.createElement("div");
  shell.className = "structure dark-surface";

  const canvas = document.createElement("canvas");
  canvas.className = "structure-field";
  canvas.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);

  const where = document.createElement("p");
  where.className = "page-where";
  where.textContent = "Theories";
  shell.appendChild(where);

  const readout = document.createElement("p");
  readout.className = "structure-readout";
  shell.appendChild(readout);

  const cue = document.createElement("p");
  cue.className = "structure-cue";
  cue.innerHTML =
    '<span class="structure-cue-mark" aria-hidden="true"></span>' +
    "scroll to travel — or drag the rule";
  shell.appendChild(cue);

  // Said only while a station is open, in the same place and the same
  // voice as the cue above: the one click further on, and the way back.
  const hint = document.createElement("p");
  hint.className = "structure-cue structure-hint gone";
  hint.innerHTML =
    '<span class="structure-cue-mark" aria-hidden="true"></span>' +
    "click again to open — esc to go back";
  shell.appendChild(hint);

  // The wheel. The rule itself is drawn on the canvas; this is the
  // part of the screen that answers the hand, laid over the near end
  // of it where the rule is widest and easiest to catch.
  const spine = document.createElement("button");
  spine.type = "button";
  spine.className = "structure-spine";
  spine.setAttribute("aria-label", "Drag to travel along the road, or press to go to the next theory");
  shell.appendChild(spine);

  // The names are real links standing over the drawing rather than
  // lettering inside it, so they can be tabbed to, read out and
  // followed like anything else on the site. Each is sized to the
  // station it belongs to every frame, so the assembly itself is what
  // you click. These go in after the spine so that where the two
  // overlap the link wins.
  const marks = document.createElement("div");
  marks.className = "structure-marks";
  shell.appendChild(marks);

  stops.forEach((stop) => {
    const mark = document.createElement("a");
    mark.className = "structure-stop";
    mark.href = stop.href;
    // The card is INSIDE the link on purpose. A station is the only
    // thing on this drawing you can click, and putting the card in the
    // same element keeps that true: the card is more of the station
    // rather than a second thing to aim at, and clicking either of
    // them is the one click that opens the theory.
    mark.innerHTML =
      '<span class="structure-say"><span class="structure-no"></span>' +
      '<span class="structure-name"></span><span class="structure-meta"></span></span>' +
      '<span class="structure-card">' +
      '<span class="structure-card-kicker" aria-hidden="true"></span>' +
      '<span class="structure-card-plate"><img alt=""></span>' +
      // The name and the line under it are said once: they are already
      // in the mark's own lettering above, which stays in the page when
      // the card takes over the showing of them.
      '<span class="structure-card-name" aria-hidden="true"></span>' +
      '<span class="structure-card-meta" aria-hidden="true"></span>' +
      '<span class="structure-card-note"></span>' +
      '<span class="structure-card-spec" aria-hidden="true"></span>' +
      '<span class="structure-card-open">Open<span aria-hidden="true"> \u2192</span></span>' +
      // NOT AN ANCHOR, because the whole card is already inside the
      // station's own one and an anchor cannot stand inside an anchor.
      // It is given a link's role, a link's keys and a link's
      // middle-click below, and the station stays the only real link
      // on the drawing.
      '<span class="structure-card-calc" role="link" tabindex="0">' +
        'Open calculator<span aria-hidden="true"> \u2192</span></span>' +
      "</span>";
    mark.querySelector(".structure-no").textContent = stop.number;
    mark.querySelector(".structure-name").textContent = stop.name;
    mark.querySelector(".structure-meta").textContent = stop.meta;
    mark.querySelector(".structure-card-kicker").textContent =
      "STATION " + stop.number + " / " + String(stops.length).padStart(2, "0");
    mark.querySelector(".structure-card-name").textContent = stop.name;
    mark.querySelector(".structure-card-meta").textContent = stop.meta;
    // An optional line of the owner's own on the row (data-note) is a
    // proper preview of the piece; without one the card carries what
    // the page already says about it and the readings below.
    const note = mark.querySelector(".structure-card-note");
    note.textContent = stop.note;
    if (!stop.note) note.hidden = true;
    const plate = mark.querySelector(".structure-card-plate");
    if (stop.plate) {
      const picture = plate.querySelector("img");
      picture.src = stop.plate;
      picture.alt = stop.plateSay;
      // A picture that is not there is taken off rather than left as a
      // browser's own broken-image mark, the way every other plate on
      // this site behaves.
      picture.addEventListener("error", () => { plate.hidden = true; });
    } else {
      plate.hidden = true;
    }
    const calc = mark.querySelector(".structure-card-calc");
    if (stop.calc) {
      calc.dataset.href = stop.calc;
      const go = (e, away) => {
        // The station is open by the time this can be pressed, so the
        // click that reaches the card would otherwise be the one the
        // link is waiting for and it would open the piece instead.
        e.preventDefault();
        e.stopPropagation();
        if (away) window.open(stop.calc, "_blank", "noopener");
        else window.location.href = stop.calc;
      };
      calc.addEventListener("click", (e) => go(e, e.ctrlKey || e.metaKey || e.shiftKey));
      calc.addEventListener("auxclick", (e) => { if (e.button === 1) go(e, true); });
      calc.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") go(e, false);
      });
    } else {
      calc.hidden = true;
      calc.removeAttribute("tabindex");
    }
    mark.querySelector(".structure-card-spec").textContent =
      "DEPTH " + String(Math.round(stop.at.z)).padStart(3, "0") + "   \u00b7   " +
      String(Math.round((stop.at.z / ROAD) * 100)).padStart(3, "0") + "% ALONG";
    marks.appendChild(mark);
    stop.mark = mark;
    // The name alone, not the whole of the say: the line under it is
    // only read on a hover and is much the longest of the three, and
    // sliding the lettering by that would take the name off the other
    // side of the window.
    stop.say = mark.querySelector(".structure-name");
  });

  // The road, as something the page can actually scroll down.
  const road = document.createElement("div");
  road.className = "structure-road";
  road.setAttribute("aria-hidden", "true");
  road.style.height = (stops.length * SCREENS * 100).toFixed(0) + "vh";

  page.insertBefore(road, page.firstChild);
  page.insertBefore(shell, page.firstChild);
  // The drawing is on the page now, so the plain list it replaces need
  // not be held back any longer — see the note in this page's <head>.
  document.documentElement.classList.remove("js-coming");

  const paint = canvas.getContext("2d");

  // One glow, drawn once into a little canvas of its own and then
  // stamped wherever it is needed. Asking for a fresh gradient per
  // speck per frame is the one thing that will not hold sixty frames
  // a second here.
  function glowStamp(tone) {
    const size = 64;
    const off = document.createElement("canvas");
    off.width = off.height = size;
    const ink = off.getContext("2d");
    const grad = ink.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(" + tone + ",1)");
    grad.addColorStop(0.45, "rgba(" + tone + ",0.28)");
    grad.addColorStop(1, "rgba(" + tone + ",0)");
    ink.fillStyle = grad;
    ink.fillRect(0, 0, size, size);
    return off;
  }
  function grainTile() {
    const size = 128;
    const off = document.createElement("canvas");
    off.width = off.height = size;
    const ink = off.getContext("2d");
    const shot = ink.createImageData(size, size);
    for (let n = 0; n < shot.data.length; n += 4) {
      const v = Math.floor(Math.random() * 255);
      shot.data[n] = shot.data[n + 1] = shot.data[n + 2] = v;
      shot.data[n + 3] = 10;
    }
    ink.putImageData(shot, 0, 0);
    return off;
  }
  /** A narrow window is a phone, and a phone is asked for less: see
      the ratio in `resize` and the grain in `draw`. Read once rather
      than per frame — a window that changes width that far is a
      rotation, and the page is laid out again for it anyway. */
  const SMALL = window.innerWidth < 700;
  let grain = null;

  const stampWhite = glowStamp(WHITE);
  const stampCool = glowStamp(COOL);
  const stampAccent = glowStamp(ACCENT);

  function stamp(sprite, x, y, r, alpha) {
    if (alpha <= 0.004) return;
    paint.globalAlpha = Math.min(1, alpha);
    paint.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    paint.globalAlpha = 1;
  }

  // ============================================================
  // TRAVELLING
  // ============================================================
  let width = 0, height = 0, lens = 0, midX = 0, midY = 0;

  // HOW FAR OUT TO THE SIDES THE STATIONS ARE ACTUALLY DRAWN.
  //
  // A station is placed at a fixed distance from the middle of the
  // frame, in the frame's own units. How much of the WINDOW that
  // distance turns out to be depends on the lens, and the lens is taken
  // off the SHORTER side of the window — so on a wide one a station
  // comes out where it was drawn to, out to the side and whole, with
  // its name under it, and on a window taller than it is wide the same
  // station is thrown half off the edge. That is what the owner saw on
  // a phone: "The architecture of sunscreen is not fully on screen".
  //
  // So they are drawn in towards the middle by however much narrower
  // this window's own view is than a wide one's. A phone in the hand
  // comes out at 0.62 whatever size it is, since the lens and the
  // half-width are both taken off the width there.
  //
  // It is a SHIFT, not a squeeze: the whole assembly moves in together,
  // so a constellation is never drawn narrower than it was built.
  //
  // THE WIDTH DECIDES WHETHER IT APPLIES, THE SHAPE HOW MUCH. By the
  // measure alone it would be worth having on any window squarer than
  // about 3:2 — a 1100 x 1000 one throws a station off the edge for
  // exactly the same reason a phone does, and 1280 x 800 and
  // 1920 x 1080 would work out at 1 and be untouched anyway. But
  // "squarer than 3:2" is not a phone, and the standing rule here is
  // that NOTHING ABOVE 700px MAY CHANGE. So above 700 it is flatly 1
  // and the drawing is the drawing it always was; the narrow-desktop
  // window keeps the fault, knowingly.
  const SIDE_NARROW = 700;     // the widest window this applies to, INCLUSIVE —
                               // the same 700 the stylesheet's `max-width` uses,
                               // so the two agree on 700 as well as either side
  const SIDE_REF = 0.68;       // the view a wide window has, as an angle
  let pull = 1;
  /** The swarm's cross-section, and how many of the pool are in the air.
      Both are worked out from the window, in `resize`. */
  let spreadX = SPREAD, spreadY = SPREAD, inAir = SWARM_POOL;
  let travel = 0, wantTravel = 0, drifted = 0, eye = 0;
  let clock = 0, last = 0;
  // How far the drawing has set itself up: 0 nothing, 1 finished. With
  // animation turned off there is no setting up to watch, so it starts
  // finished.
  let built = REDUCE_MOTION ? 1 : 0;
  let began = 0;
  let vignette = null;

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
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    lens = Math.min(width, height) * LENS;
    pull = width > SIDE_NARROW
      ? 1
      : Math.min(1, ((width / 2) / lens) / SIDE_REF);

    // HOW MANY, AND WHAT SHAPE — both off the window. The spreads are
    // the square cross-section stretched to the page's aspect ratio,
    // keeping its area about the same, so widening the window widens the
    // volume rather than magnifying what is in it.
    const shape = width / Math.max(1, height);
    spreadX = SPREAD * Math.sqrt(Math.max(1, shape));
    spreadY = SPREAD * Math.sqrt(Math.max(1, 1 / shape));
    inAir = Math.round(Math.max(SWARM_LEAST, Math.min(SWARM_MOST,
      SWARM_PER * (width * height) / 1000000)));
    growPool(inAir);
    if (!grain) grain = paint.createPattern(grainTile(), "repeat");
    vignette = paint.createRadialGradient(
      midX, midY, Math.min(width, height) * 0.32,
      midX, midY, Math.max(width, height) * 0.78
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.34)");
  }

  function fromScroll() {
    const room = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const along = Math.min(1, Math.max(0, window.scrollY / room));
    wantTravel = along * ROAD;
  }

  /** Where a point in the frame lands on the screen. `k` is what one
      unit at that depth is worth in pixels, which is the only thing
      anything needs to size itself. */
  function to(x, y, z) {
    const ahead = z - eye;
    if (ahead <= NEAR) return null;
    const k = lens / ahead;
    return { x: midX + x * k, y: midY + y * k, k: k, ahead: ahead };
  }

  /** How near a thing at this depth is to being right in front of you. */
  function carry(ahead) {
    if (ahead <= SHOW_TO || ahead >= SHOW_FROM) return 0;
    if (ahead > SHOW_BEST) return (SHOW_FROM - ahead) / (SHOW_FROM - SHOW_BEST);
    return (ahead - SHOW_TO) / (SHOW_BEST - SHOW_TO);
  }

  const rgba = (tone, a) => "rgba(" + tone + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // THE FRAME — ribs across the way, rails along it
  // ============================================================
  function drawFrame() {
    const firstRib = Math.max(0, Math.ceil((eye + NEAR + 1.2) / RIB_EVERY));
    const lastRib = Math.floor((eye + FRAME_SHOW) / RIB_EVERY);

    // The rails: four long lines the length of the frame. A straight
    // line in the world is a straight line on the screen, so each one
    // is two points and a stroke however far it runs.
    const corners = [[-RIB_X, -RIB_Y], [RIB_X, -RIB_Y], [RIB_X, RIB_Y], [-RIB_X, RIB_Y]];
    // Setting up, a rail is drawn from the vanishing point towards you
    // rather than all at once: the frame arrives out of the depth, the
    // way everything else on this page does.
    const reached = Math.min(1, built / INTRO_RAILS);
    const nearEnd = FRAME_SHOW + (3.2 - FRAME_SHOW) * reached;
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, 0.1);
    paint.beginPath();
    corners.forEach((c) => {
      const a = to(c[0], c[1], eye + nearEnd);
      const b = to(c[0], c[1], eye + FRAME_SHOW);
      if (!a || !b) return;
      paint.moveTo(a.x, a.y);
      paint.lineTo(b.x, b.y);
    });
    paint.stroke();

    for (let i = firstRib; i <= lastRib; i++) {
      const z = i * RIB_EVERY;
      const p = to(0, 0, z);
      if (!p) continue;
      let fade = Math.min(1, (FRAME_SHOW - p.ahead) / (FRAME_SHOW * 0.45)) *
                 Math.min(1, p.ahead / 6);
      // Setting up, the ribs arrive one after another from the far end
      // towards you — the deepest first, so the frame is built in front
      // of you rather than around you.
      if (built < 1) {
        const far = Math.min(1, Math.max(0, p.ahead / FRAME_SHOW));
        fade *= Math.min(1, Math.max(0, (built - (1 - far) * INTRO_RIBS) / 0.18));
      }
      if (fade <= 0.02) continue;
      // Lit as the carriage goes by it. A gantry that passes through
      // the frame without the frame answering is a gantry drawn on
      // top of it rather than running in it.
      const flash = REDUCE_MOTION
        ? 0
        : Math.max(0, 1 - Math.abs(p.ahead - carriage) / 2.6);
      const inner = i % 2 !== 0;
      const w = RIB_X * (inner ? 0.62 : 1) * p.k;
      const h = RIB_Y * (inner ? 0.62 : 1) * p.k;
      const left = p.x - w, right = p.x + w, top = p.y - h, foot = p.y + h;

      // The rib itself, faint, and its corner brackets a little
      // stronger — brackets are what make a rectangle read as a drawn
      // part rather than as a box.
      if (!inner) {
        paint.strokeStyle = rgba(STEEL, (0.09 + flash * 0.3) * fade);
        paint.strokeRect(left, top, w * 2, h * 2);
      }

      const arm = Math.max(4, Math.min(48, w * 0.14));
      paint.strokeStyle = rgba(COOL, (0.2 + flash * 0.45) * fade);
      paint.beginPath();
      [[left, top, 1, 1], [right, top, -1, 1], [right, foot, -1, -1], [left, foot, 1, -1]]
        .forEach((c) => {
          paint.moveTo(c[0] + c[2] * arm, c[1]);
          paint.lineTo(c[0], c[1]);
          paint.lineTo(c[0], c[1] + c[3] * arm);
        });
      paint.stroke();

      // Every third one says how far in it is. A frame that counts is
      // a frame you can be somewhere in.
      if (!inner && i % 6 === 0 && p.ahead > 5 && p.ahead < 40) {
        const type = Math.max(8, Math.min(13, 0.09 * p.k));
        paint.font = type + "px " + MONO;
        paint.fillStyle = rgba(STEEL, 0.34 * fade);
        paint.fillText(String(z).padStart(3, "0"), left + 6, top - 6);
      }
    }
  }

  // ============================================================
  // THE SPINE — the rule along the floor, and the wheel
  // ============================================================
  let spineHot = 0, spineWant = 0;

  function drawSpine() {
    // Setting up, the rule writes itself from under you out to the
    // vanishing point, and the ticks only exist as far as it has got.
    const ruled = 1.7 + (SPINE_SHOW - 1.7) * Math.min(1, Math.max(0, (built - 0.12) / 0.5));
    if (ruled <= 2) return;
    const a = to(0, FLOOR, eye + 1.7);
    const b = to(0, FLOOR, eye + ruled);
    if (!a || !b) return;

    paint.lineWidth = 1;
    paint.strokeStyle = rgba(WHITE, 0.16 + spineHot * 0.22);
    paint.beginPath();
    paint.moveTo(a.x, a.y);
    paint.lineTo(b.x, b.y);
    paint.stroke();

    // The ticks. They stand at whole depths, so they stream towards
    // you as you travel and away as you go back — the detents of a
    // wheel, which is what the rule is.
    const first = Math.ceil(eye + 1.7);
    const lit = 0.3 + spineHot * 0.4;
    for (let z = first; z - eye < ruled; z++) {
      const p = to(0, FLOOR, z);
      if (!p) continue;
      const fade = Math.min(1, (SPINE_SHOW - p.ahead) / (SPINE_SHOW * 0.5));
      const big = z % 5 === 0;
      const len = (big ? 0.26 : 0.1) * p.k;
      if (len < 0.8) continue;
      paint.strokeStyle = rgba(big ? WHITE : STEEL, (big ? lit : lit * 0.55) * fade);
      paint.beginPath();
      paint.moveTo(p.x - len, p.y);
      paint.lineTo(p.x + len, p.y);
      paint.stroke();
      if (z % 10 === 0 && p.ahead > 3 && p.ahead < 34) {
        const type = Math.max(8, Math.min(14, 0.1 * p.k));
        paint.font = type + "px " + MONO;
        paint.fillStyle = rgba(WHITE, 0.4 * fade);
        paint.fillText(String(z).padStart(3, "0"), p.x + len + 6, p.y + type * 0.36);
      }
    }
  }

  // ============================================================
  // THE SWARM
  //
  // The depth is taken modulo DEEP rather than a speck being carried
  // along when it goes past, so the air is full whichever way you are
  // going. Which lap of the volume a speck is on also decides where
  // it stands across the frame, so it is somewhere new each time
  // round rather than the same volume repeating.
  // ============================================================
  function drawSwarm() {
    // The air is the first thing there: it fills over the opening
    // frames and everything else is drawn into it.
    const air = Math.min(1, built / INTRO_AIR);
    const many = Math.min(inAir, swarm.length);
    for (let n = 0; n < many; n++) {
      const speck = swarm[n];
      const depth = speck.z - eye;
      const lap = Math.floor((depth - NEAR) / DEEP);
      const ahead = depth - lap * DEEP;
      const k = lens / ahead;

      const wob = REDUCE_MOTION ? 0 : WOBBLE;
      const x = (hash2(speck.id, lap * 2 + 1) - 0.5) * 2 * spreadX +
        Math.sin(clock * speck.rate + speck.phase) * wob;
      const y = (hash2(speck.id, lap * 2 + 7) - 0.5) * 2 * spreadY +
        Math.cos(clock * speck.rate * 0.8 + speck.phase) * wob;

      const px = midX + x * k, py = midY + y * k;
      if (px < -40 || px > width + 40 || py < -40 || py > height + 40) continue;

      // Out at both ends of its lap, so neither wrap can be seen.
      const far = Math.min(1, (NEAR + DEEP - ahead) / (DEEP * 0.5));
      const close = Math.min(1, (ahead - NEAR) / FADE_NEAR);
      const lit = speck.lit * far * close * Math.min(1, 16 / ahead) * air;
      if (lit < 0.012) continue;

      const tone = speck.cool ? COOL : WHITE;
      const size = Math.max(0.6, Math.min(4.2, speck.size * k * 0.028));
      if (speck.glow && lit > 0.22) {
        stamp(speck.cool ? stampCool : stampWhite, px, py, size * 3.4, lit * 0.5);
      }
      paint.fillStyle = rgba(tone, lit);
      paint.fillRect(px - size / 2, py - size / 2, size, size);
    }
  }

  // ============================================================
  // ASSEMBLIES — stations and fixtures
  // ============================================================
  /** Puts every node of an assembly on the screen and draws its
      figure. Returns the bounding box, or null if none of it landed.

      `lay` is how an opened station is set out: it carries how far
      open it is and where on the window it is being laid out, and
      every part is drawn that far between where it stands in the
      frame and its own place on the ring. The figure is unchanged —
      the same lines between the same parts — so what you watch is one
      thing being opened out, not one thing being swapped for another. */
  function drawAssembly(thing, strength, accent, lay) {
    const put = [];
    // Drawn in towards the middle on a window too narrow to hold it out
    // at the side — see `pull`. Nought on a wide one.
    const aside = thing.at ? thing.at.x * (pull - 1) : 0;
    for (const node of thing.nodes) {
      const wob = REDUCE_MOTION ? 0 : WOBBLE * 1.6;
      const p = to(
        node.x + aside + Math.sin(clock * node.rate + node.phase) * wob,
        node.y + Math.cos(clock * node.rate * 0.7 + node.phase) * wob,
        node.z
      );
      put.push(p ? { x: p.x, y: p.y, size: node.size * p.k * 0.03 } : null);
    }

    if (lay) {
      const count = put.length;
      for (let n = 0; n < count; n++) {
        const turn = (lay.order[n] / count) * Math.PI * 2 - Math.PI / 2 +
                     (1 - lay.mix) * OPEN_TURN;
        const wantX = lay.x + Math.cos(turn) * lay.r;
        const wantY = lay.y + Math.sin(turn) * lay.r;
        // A part that is behind you as it opens comes out of the middle
        // of the set-out rather than not being drawn at all.
        const at = put[n] || { x: lay.x, y: lay.y, size: 0 };
        at.x += (wantX - at.x) * lay.mix;
        at.y += (wantY - at.y) * lay.mix;
        at.size += (OPEN_PART - at.size) * lay.mix;
        put[n] = at;
      }
    }

    let left = Infinity, right = -Infinity, top = Infinity, foot = -Infinity;
    for (const at of put) {
      if (!at) continue;
      if (at.x < left) left = at.x;
      if (at.x > right) right = at.x;
      if (at.y < top) top = at.y;
      if (at.y > foot) foot = at.y;
    }
    if (left === Infinity) return null;

    // The figure, under its own nodes. A provisional line comes and
    // goes on its own clock; a fixed one is always there. Both are
    // drawn in one pass per weight, since changing the colour is what
    // a stroke actually costs.
    paint.lineWidth = 1;
    let fixed = null, loose = null;
    for (const line of thing.lines) {
      const a = put[line.a], b = put[line.b];
      if (!a || !b) continue;
      if (line.loose) {
        const wave = REDUCE_MOTION
          ? 0.5
          : Math.max(0, Math.sin(clock * line.rate + line.phase));
        if (wave < 0.06) continue;
        if (!loose) { loose = []; }
        loose.push([a, b, wave]);
      } else {
        if (!fixed) { fixed = []; }
        fixed.push([a, b]);
      }
    }
    if (fixed) {
      paint.strokeStyle = rgba(accent ? COOL : STEEL, strength * (accent ? 0.5 : 0.34));
      paint.beginPath();
      fixed.forEach((l) => { paint.moveTo(l[0].x, l[0].y); paint.lineTo(l[1].x, l[1].y); });
      paint.stroke();
    }
    if (loose) {
      // Grouped in three bands rather than one stroke each: a line
      // that fades needs its own alpha, and a stroke carries one.
      for (let band = 0; band < 3; band++) {
        const lo = band / 3, hi = (band + 1) / 3;
        let any = false;
        paint.beginPath();
        loose.forEach((l) => {
          if (l[2] < lo || l[2] >= hi) return;
          any = true;
          paint.moveTo(l[0].x, l[0].y);
          paint.lineTo(l[1].x, l[1].y);
        });
        if (!any) continue;
        paint.strokeStyle = rgba(accent ? COOL : STEEL,
          strength * (accent ? 0.42 : 0.26) * ((lo + hi) / 2));
        paint.stroke();
      }
    }

    // The beads: something actually running in the wires, and only on
    // the assemblies you are among.
    if (!REDUCE_MOTION && strength > 0.4) {
      for (const line of thing.lines) {
        if (!line.bead) continue;
        const a = put[line.a], b = put[line.b];
        if (!a || !b) continue;
        const along = (clock * line.beadRate + line.beadPhase) % 1;
        const bx = a.x + (b.x - a.x) * along, by = a.y + (b.y - a.y) * along;
        const r = accent ? 1.6 : 1.2;
        stamp(accent ? stampAccent : stampCool, bx, by, r * 4, strength * 0.5);
        paint.fillStyle = rgba(accent ? ACCENT : COOL, strength * 0.9);
        paint.fillRect(bx - r / 2, by - r / 2, r, r);
      }
    }

    for (let n = 0; n < put.length; n++) {
      const at = put[n];
      if (!at) continue;
      const node = thing.nodes[n];
      const tone = accent ? (node.cool ? COOL : WHITE) : (node.cool ? COOL : STEEL);
      const size = Math.max(1.1, Math.min(7, at.size));
      stamp(accent ? stampWhite : stampCool,
        at.x, at.y, size * 3, strength * (accent ? 0.42 : 0.26));
      paint.fillStyle = rgba(tone, accent ? 0.2 + strength * 1.1 : strength * 0.8);
      paint.fillRect(at.x - size / 2, at.y - size / 2, size, size);
      // The biggest few of a station's nodes are ringed, in the hollow
      // square the rest of the site marks a point with — which is what
      // keeps them reading as parts rather than as lights.
      if (accent && size > 3.4 && strength > 0.3) {
        paint.lineWidth = 1;
        paint.strokeStyle = rgba(ACCENT, strength * 0.5);
        const ring = size + 5;
        paint.strokeRect(at.x - ring / 2, at.y - ring / 2, ring, ring);
      }
    }

    return { left: left, right: right, top: top, foot: foot };
  }

  function drawFixtures() {
    for (const fixture of fixtures) {
      const ahead = fixture.at.z - eye;
      if (ahead <= NEAR || ahead > FRAME_SHOW) continue;
      const fade = Math.min(1, (FRAME_SHOW - ahead) / (FRAME_SHOW * 0.4)) *
                   Math.min(1, (ahead - NEAR) / 5);
      const strength = fade * fixture.faint * built;
      if (strength <= 0.01) continue;
      const box = drawAssembly(fixture, strength, false);
      // A code, not a name: it is plant, and plant is labelled but not
      // announced. Nothing here is clickable, which is the point.
      if (box && ahead < 30 && strength > 0.18) {
        const type = Math.max(8, Math.min(11, 0.06 * (lens / ahead)));
        paint.font = type + "px " + MONO;
        paint.fillStyle = rgba(STEEL, strength * 0.7);
        paint.fillText(fixture.code, box.left, box.top - 7);
      }
    }
  }

  /** One station: its figure, the marks that say it can be opened, and
      the link laid over it. `lay` is only passed for the one that has
      been opened — see THE SET-OUT below. */
  const SAY_EDGE = 12;         // the air a station's name keeps from the window's side

  function drawStop(stop, strength, ranged, lay) {
    const box = drawAssembly(stop, strength, true, lay);
    if (!box) { stop.mark.classList.add("gone"); return; }

    // Bracketed, crosshaired and numbered: the marks that say this
    // one is a thing you can open.
    //
    // The bracket is kept to a size, about the middle of the
    // assembly. A station you are nearly inside covers the whole
    // window, and an invisible link the size of the window is a
    // page where clicking anywhere at all goes somewhere — as well
    // as brackets you can no longer see the corners of.
    const pad = 26;
    const cx = (box.left + box.right) / 2, cy = (box.top + box.foot) / 2;
    const wide = Math.min(box.right - box.left + pad * 2, width * 0.52) / 2;
    const tall = Math.min(box.foot - box.top + pad * 2, height * 0.52) / 2;
    const left = cx - wide, right = cx + wide;
    const top = cy - tall, foot = cy + tall;
    if (strength > 0.18) {
      const arm = Math.max(7, Math.min(34, (right - left) * 0.16));
      paint.lineWidth = 1.4;
      paint.strokeStyle = rgba(ACCENT, strength * 0.75);
      paint.beginPath();
      [[left, top, 1, 1], [right, top, -1, 1], [right, foot, -1, -1], [left, foot, 1, -1]]
        .forEach((c) => {
          paint.moveTo(c[0] + c[2] * arm, c[1]);
          paint.lineTo(c[0], c[1]);
          paint.lineTo(c[0], c[1] + c[3] * arm);
        });
      paint.stroke();

      paint.lineWidth = 1;
      paint.strokeStyle = rgba(ACCENT, strength * 0.3);
      paint.beginPath();
      paint.moveTo(cx - 7, cy); paint.lineTo(cx + 7, cy);
      paint.moveTo(cx, cy - 7); paint.lineTo(cx, cy + 7);
      paint.stroke();
    }

    // The one you are among is ranged: squares opening outward from
    // the middle of it, on the site's own registration mark. An
    // opened one is not — it is being read rather than found, and it
    // has a scale under it instead.
    if (!REDUCE_MOTION && ranged) {
      for (let r = 0; r < 2; r++) {
        const beat = ((clock * 0.42 + stop.ring + r * 0.5) % 1);
        const grow = 0.5 + beat * 1.4;
        const w = (right - left) * grow, h = (foot - top) * grow;
        paint.strokeStyle = rgba(ACCENT, strength * 0.3 * (1 - beat) * (1 - beat));
        paint.strokeRect(cx - w / 2, cy - h / 2, w, h);
      }
    }

    // The scale under an opened one: it has been taken out of the
    // frame and set out to be read, and a set-out carries a rule.
    if (lay && lay.mix > 0.15) {
      const ruleY = foot + 16;
      const step = Math.max(9, (right - left) / 24);
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(WHITE, lay.mix * 0.3);
      paint.beginPath();
      paint.moveTo(left, ruleY);
      paint.lineTo(left + (right - left) * lay.mix, ruleY);
      for (let x = left, n = 0; x <= right; x += step, n++) {
        if (x > left + (right - left) * lay.mix) break;
        const len = n % 5 === 0 ? 7 : 3;
        paint.moveTo(x, ruleY);
        paint.lineTo(x, ruleY - len);
      }
      paint.stroke();
    }

    // Carried right off the window as you pass through it: taken
    // out of the page rather than left there invisible.
    if (right < 0 || left > width || foot < 0 || top > height) {
      stop.mark.classList.add("gone");
      return;
    }
    stop.mark.classList.remove("gone");
    stop.mark.style.left = left.toFixed(1) + "px";
    stop.mark.style.top = top.toFixed(1) + "px";
    stop.mark.style.width = (right - left).toFixed(1) + "px";
    stop.mark.style.height = (foot - top).toFixed(1) + "px";
    stop.mark.style.opacity = (0.28 + strength * 0.72).toFixed(3);
    stop.mark.classList.toggle("close", strength > 0.55);

    // AND THE LETTERING IS KEPT ON THE WINDOW. The station's name hangs
    // off the bottom left corner of its bracket and does not wrap, so a
    // station standing out to the right writes its name off the side of
    // the screen — which on a phone is most of them, and is what the
    // owner saw: "The architecture of sunscreen is not fully on screen".
    // It is slid back along by exactly how far it is over, and never
    // the other way, so on a wide window nothing moves at all.
    //
    // Its width is measured ONCE, the first time the station is drawn,
    // and thrown away on a resize or when the webfont lands: reading
    // `offsetWidth` in a frame forces the browser to lay the page out
    // again, and this runs sixty times a second.
    // ON A PHONE ONLY, and the stylesheet agrees: above 700px the shift
    // is not applied, each line of the say is the width it always was,
    // and there is nothing to measure — so nothing is measured, which
    // also spares a wide window a forced layout every frame.
    if (width > SIDE_NARROW) {
      stop.mark.style.setProperty("--say-shift", "0px");
    } else {
      if (!stop.sayWide) stop.sayWide = stop.say.offsetWidth;
      const over = Math.min(0, width - SAY_EDGE - (left + stop.sayWide));
      const under = Math.max(0, SAY_EDGE - left);
      stop.mark.style.setProperty("--say-shift",
        (over + under).toFixed(1) + "px");
    }
  }

  function drawStops(nearest) {
    for (const stop of stops) {
      // The opened one is drawn after the veil that takes the rest of
      // the frame back, not with them.
      if (stop === shown) continue;
      const strength = carry(stop.at.z - eye) * (1 - opened * OPEN_VEIL) * built;
      if (strength <= 0.004) { stop.mark.classList.add("gone"); continue; }
      drawStop(stop, strength, stop === nearest && !shown, null);
    }
  }

  // ============================================================
  // THE SET-OUT
  //
  // Clicking a station takes it out of the frame: it comes forward,
  // turns as it comes, and its parts go out to arm's length on a ring
  // — the same figure, the same lines, opened out and squared up the
  // way a drawing of a part is set out to be read. The frame behind it
  // goes back, and a card writes itself in beside it. The theory
  // itself is one click further on, from the card or from the figure.
  //
  // It is a CLICK. Nothing here answers the pointer simply passing
  // over a station: travelling past nine of them should not keep
  // taking the page apart.
  // ============================================================
  let opening = null;   // the station that has been clicked, if any
  let shown = null;     // the one being drawn open, which lingers as it closes
  let opened = 0;       // 0 in the frame, 1 laid out

  function setOut() {
    if (!shown) return;
    const side = width > 860 && width > height * 0.95;
    const at = side ? OPEN_AT : OPEN_OVER;
    drawStop(shown, Math.max(carry(shown.at.z - eye), opened), false, {
      mix: opened,
      x: width * at[0],
      y: height * at[1],
      r: Math.min(width, height) * OPEN_RING,
      order: shown.order,
    });
  }

  // ============================================================
  // THE MOVING PARTS
  //
  // A gantry running down the frame at you, and things crossing it.
  // Both are on their own clocks rather than on the travel, so the
  // page has something happening in it while you are standing still.
  // ============================================================
  // Where the gantry is, or -1 for the stretch between passes when it
  // is not on the drawing at all. It is worked out from the clock
  // rather than stepped along frame by frame, so one pass takes the
  // same time whatever the frame rate is doing — and so that the rest
  // between passes is a plain number to change rather than a state to
  // keep. Set at the top of every frame, because the ribs light as it
  // goes by and they are drawn before it is.
  const CARRIAGE_RUN = (CARRIAGE_FROM - 2.4) / CARRIAGE_SPEED;
  let carriage = CARRIAGE_FROM;

  function placeCarriage() {
    // Held still rather than switched off, like the rest of the moving
    // parts: with animation turned off it simply stands in the frame.
    if (REDUCE_MOTION) { carriage = CARRIAGE_FROM * 0.45; return; }
    const since = clock - CARRIAGE_FIRST;
    if (since < 0) { carriage = -1; return; }
    const phase = since % CARRIAGE_EVERY;
    carriage = phase > CARRIAGE_RUN ? -1 : CARRIAGE_FROM - phase * CARRIAGE_SPEED;
  }

  function drawCarriage() {
    if (carriage < 0) return;
    const p = to(0, 0, eye + carriage);
    if (!p) return;
    // Coming on at the far end rather than simply being there: it is
    // away for most of the time now, so its arrival is something you
    // could otherwise catch.
    const started = Math.min(1, (CARRIAGE_FROM - carriage) / 5);
    const fade = started * Math.min(1, carriage / 14) *
                 Math.min(1, (CARRIAGE_FROM - carriage) / 8 + 0.2);
    const w = RIB_X * 0.82 * p.k, h = RIB_Y * 0.82 * p.k;
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, 0.34 * fade);
    paint.strokeRect(p.x - w, p.y - h, w * 2, h * 2);
    // A hair inside it, so it reads as a part with a thickness.
    paint.strokeStyle = rgba(STEEL, 0.14 * fade);
    paint.strokeRect(p.x - w * 0.97, p.y - h * 0.97, w * 1.94, h * 1.94);
    const arm = Math.max(5, Math.min(40, w * 0.1));
    paint.strokeStyle = rgba(WHITE, 0.5 * fade);
    paint.beginPath();
    [[p.x - w, p.y - h, 1, 1], [p.x + w, p.y - h, -1, 1],
     [p.x + w, p.y + h, -1, -1], [p.x - w, p.y + h, 1, -1]].forEach((c) => {
      paint.moveTo(c[0] + c[2] * arm, c[1]);
      paint.lineTo(c[0], c[1]);
      paint.lineTo(c[0], c[1] + c[3] * arm);
    });
    paint.stroke();
  }

  const traverses = [];
  let nextTraverse = 1.2;
  function drawTraverses(on) {
    if (!REDUCE_MOTION && clock > nextTraverse && traverses.length < TRAVERSES) {
      nextTraverse = clock + TRAVERSE_EVERY * (0.5 + random());
      // ANY DIRECTION, not along the frame. A streak used to run
      // either across the frame or up and down it, which read as two
      // kinds of rule being drawn rather than as something crossing
      // the air; the owner asked for them to go any way at all. Each
      // one is given a bearing, started from outside the frame on the
      // side it is coming from, and run along that bearing.
      const bearing = random() * Math.PI * 2;
      const goX = Math.cos(bearing), goY = Math.sin(bearing);
      traverses.push({
        z: eye + 7 + random() * 26,
        along: 0,
        // Where it enters: back along its own bearing, far enough out
        // to be off the frame, and offset across it so that two on the
        // same bearing do not run down the same line.
        fromX: -goX * RIB_X * 1.5 - goY * (random() - 0.5) * RIB_Y * 1.6,
        fromY: -goY * RIB_Y * 1.5 + goX * (random() - 0.5) * RIB_X * 1.6,
        goX: goX,
        goY: goY,
        speed: 9 + random() * 13,
        trail: 1.4 + random() * 2.2,
      });
    }
    for (let n = traverses.length - 1; n >= 0; n--) {
      const one = traverses[n];
      const from = Math.max(0, one.along - one.trail);
      const headX = one.fromX + one.goX * one.along;
      const headY = one.fromY + one.goY * one.along;
      const head = to(headX, headY, one.z);
      const tail = to(one.fromX + one.goX * from, one.fromY + one.goY * from, one.z);
      if (head && tail) {
        // A streak is a line that gets brighter towards its head, so
        // it is drawn as a gradient rather than as a flat stroke: a
        // flat one reads as a scratch on the screen.
        const run = paint.createLinearGradient(tail.x, tail.y, head.x, head.y);
        run.addColorStop(0, rgba(WHITE, 0));
        run.addColorStop(1, rgba(WHITE, 0.5));
        paint.strokeStyle = run;
        paint.lineWidth = 1.2;
        paint.beginPath();
        paint.moveTo(tail.x, tail.y);
        paint.lineTo(head.x, head.y);
        paint.stroke();
        stamp(stampWhite, head.x, head.y, 7, 0.5);
      }
      one.along += one.speed * on / 60;
      // Gone once the whole streak, tail and all, is off the frame —
      // which on a bearing means out of the box rather than past one
      // edge of it.
      const tailX = one.fromX + one.goX * from;
      const tailY = one.fromY + one.goY * from;
      if ((Math.abs(tailX) > RIB_X * 1.8 && Math.abs(headX) > RIB_X * 1.8) ||
          (Math.abs(tailY) > RIB_Y * 1.8 && Math.abs(headY) > RIB_Y * 1.8) ||
          one.along > (RIB_X + RIB_Y) * 3.2 ||
          one.z - eye < NEAR) {
        traverses.splice(n, 1);
      }
    }
  }

  /** The drafting marks: a sight in each corner of the screen and a
      crosshair dead centre, where you are going. They belong to the
      window rather than to the frame, so they never move. */
  function drawSights() {
    // Last of all: the instrument is ready, and then it is yours.
    const ready = Math.min(1, Math.max(0, (built - INTRO_SIGHTS) / (1 - INTRO_SIGHTS)));
    if (ready <= 0.01) return;
    const arm = 18, gap = 46;
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, 0.28 * ready);
    paint.beginPath();
    [[gap, gap, 1, 1], [width - gap, gap, -1, 1],
     [width - gap, height - gap, -1, -1], [gap, height - gap, 1, -1]].forEach((c) => {
      paint.moveTo(c[0] + c[2] * arm, c[1]);
      paint.lineTo(c[0], c[1]);
      paint.lineTo(c[0], c[1] + c[3] * arm);
    });
    paint.stroke();
    paint.strokeStyle = rgba(WHITE, 0.2 * ready);
    paint.beginPath();
    paint.moveTo(midX - 11, midY); paint.lineTo(midX - 4, midY);
    paint.moveTo(midX + 4, midY); paint.lineTo(midX + 11, midY);
    paint.moveTo(midX, midY - 11); paint.lineTo(midX, midY - 4);
    paint.moveTo(midX, midY + 4); paint.lineTo(midX, midY + 11);
    paint.stroke();
  }

  // ============================================================
  // DRAWING
  // ============================================================
  function draw(on) {
    eye = travel + drifted;
    placeCarriage();
    paint.fillStyle = DARK;
    paint.fillRect(0, 0, width, height);

    drawFrame();
    drawSpine();
    drawSwarm();
    drawFixtures();

    // Which station you are among, and how far along the road you
    // have come — the only two numbers on the page.
    let nearest = null, best = 0;
    for (const stop of stops) {
      const strength = carry(stop.at.z - eye);
      if (strength > best) { best = strength; nearest = stop; }
    }
    drawStops(nearest);
    drawCarriage();
    drawTraverses(on);

    // The frame goes back behind an opened station — the whole of it,
    // in one wash, so that what is left lit is the one thing being
    // read. Then that one is drawn over the top of it.
    if (opened > 0.002) {
      paint.fillStyle = "rgba(10,11,14," + (opened * OPEN_VEIL).toFixed(3) + ")";
      paint.fillRect(0, 0, width, height);
      setOut();
    }

    paint.fillStyle = vignette;
    paint.fillRect(0, 0, width, height);
    // THE GRAIN IS SKIPPED ON A PHONE. It is a repeating pattern painted
    // over the whole canvas on every frame, which is the single most
    // expensive thing this drawing does and the one nobody can see at
    // that size. The vignette stays — it is a gradient made once in
    // `resize` and it is what gives the frame its depth.
    if (grain && !SMALL) {
      paint.fillStyle = grain;
      paint.fillRect(0, 0, width, height);
    }
    drawSights();

    // How far along the road you have come — read off the SCROLL, not
    // off the eye. The eye also carries the breath, and a number that
    // ticks up and down on its own while nothing is being touched
    // reads as drift however small it is. The drawing may move; the
    // reading is where you have got to.
    const along = Math.min(1, Math.max(0, travel / ROAD));
    readout.textContent =
      (shown ? shown.number : nearest ? nearest.number : "--") +
      " / " + String(stops.length).padStart(2, "0") +
      "   ·   " + String(Math.round(along * 100)).padStart(3, "0") + "%";
    cue.classList.toggle("gone", along > 0.02 || opened > 0.02);
    hint.classList.toggle("gone", opened < 0.6);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const on = Math.min(3, (now - last) / 16.7) || 1;
    last = now;
    if (!REDUCE_MOTION) {
      clock += on / 60;
      // Setting up. Timed off the wall clock rather than counted in
      // frames, so the opening takes the same moment on any machine.
      if (built < 1) {
        if (!began) began = now;
        const t = Math.min(1, (now - began) / INTRO_MS);
        built = t * t * (3 - 2 * t);
        if (t >= 1) { built = 1; shell.classList.add("lit"); }
      }
      // The page is never quite still even when nothing is being done
      // to it — but the creep is a breath rather than a drift: it
      // leaves and comes back, so it can never carry the road out from
      // under the scrollbar. Written from the clock rather than added
      // up, so there is nothing for it to accumulate in.
      drifted = (1 - Math.cos((clock * Math.PI * 2) / CREEP_EVERY)) / 2 * CREEP;
    }
    travel += (wantTravel - travel) * Math.min(1, EASE * on);
    spineHot += (spineWant - spineHot) * Math.min(1, 0.16 * on);

    const wantOpen = opening ? 1 : 0;
    if (REDUCE_MOTION) opened = wantOpen;
    else opened += (wantOpen - opened) * Math.min(1, OPEN_EASE * on);
    // Kept until it has finished going back into the frame, so closing
    // one is the same movement run the other way rather than the card
    // and the figure simply disappearing.
    if (!opening && opened < 0.004) { opened = 0; shown = null; }

    draw(REDUCE_MOTION ? 0 : on);
  }

  // ============================================================
  // THE WHEEL
  //
  // Dragging the rule writes the page's own scroll position rather
  // than keeping a travel of its own, so the rule, the scrollbar, the
  // keys and a finger are all the same one control and can never
  // disagree about where you are.
  // ============================================================
  let holding = false, heldAt = 0, heldFrom = 0, dragged = 0;

  /** How much of the page there is to scroll: the travel written back
      as a scroll position. */
  const room = () =>
    Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  function travelTo(units) {
    window.scrollTo(0, Math.max(0, Math.min(1, units / ROAD)) * room());
  }

  spine.addEventListener("pointerenter", () => { spineWant = 0.5; });
  spine.addEventListener("pointerleave", () => { if (!holding) spineWant = 0; });
  spine.addEventListener("pointerdown", (e) => {
    holding = true;
    dragged = 0;
    heldAt = e.clientY;
    heldFrom = window.scrollY;
    spineWant = 1;
    spine.classList.add("held");
    if (spine.setPointerCapture) spine.setPointerCapture(e.pointerId);
    // Deliberately no preventDefault here: that would stop the click
    // this button is still meant to send when it is pressed rather
    // than dragged.
  });
  spine.addEventListener("pointermove", (e) => {
    if (!holding) return;
    dragged = Math.max(dragged, Math.abs(e.clientY - heldAt));
    // Up the screen is further in, the way dragging a page is.
    window.scrollTo(0, Math.max(0, heldFrom + (heldAt - e.clientY) * GEAR));
    e.preventDefault();
  });
  const letGo = () => {
    if (!holding) return;
    holding = false;
    spineWant = 0;
    spine.classList.remove("held");
  };
  spine.addEventListener("pointerup", letGo);
  spine.addEventListener("pointercancel", letGo);

  // Pressed rather than dragged — and that includes from the keyboard,
  // which is the only way the wheel can be used without a hand — it
  // goes on to the next station, and round to the first from the end.
  spine.addEventListener("click", () => {
    if (dragged > 6) return;
    const want = stops.find((stop) => stop.at.z - eye > SHOW_BEST + 1.5) || stops[0];
    travelTo(want.at.z - SHOW_BEST - drifted);
  });

  // ============================================================
  // OPENING A STATION
  //
  // The first click lays it out; the second one — on the figure or on
  // the card, which is part of the same link — goes to the theory.
  // That holds for the keyboard too: the mark is a link, so Enter is a
  // click, and pressing it twice is the same two steps.
  // ============================================================
  let heldScroll = 0;

  function openStation(stop) {
    if (opening === stop) return;
    // Going straight from one to another: the new one comes forward
    // from where it stands in the frame, rather than arriving already
    // laid out because the one before it had got that far.
    if (shown && shown !== stop) opened = 0;
    opening = stop;
    shown = stop;
    heldScroll = window.scrollY;
    stops.forEach((one) => one.mark.classList.toggle("open", one === stop));
    marks.classList.add("holding");
  }

  function closeStation() {
    if (!opening) return;
    opening = null;
    stops.forEach((one) => one.mark.classList.remove("open"));
    marks.classList.remove("holding");
  }

  stops.forEach((stop) => {
    stop.mark.addEventListener("click", (e) => {
      // Already open: this click is the one that opens the theory, so
      // the link is left to do what a link does.
      if (opening === stop) return;
      e.preventDefault();
      openStation(stop);
    });
  });

  // Anywhere else on the page puts it back: the drawing, the spine,
  // another station. Travelling does too — going further in is what
  // this page is, and it should never be the thing that is blocked.
  document.addEventListener("pointerdown", (e) => {
    if (!opening) return;
    if (e.target.closest && e.target.closest(".structure-stop.open")) return;
    closeStation();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && opening) {
      const back = opening.mark;
      closeStation();
      back.focus();
    }
  });

  window.addEventListener("scroll", () => {
    if (opening && Math.abs(window.scrollY - heldScroll) > 12) closeStation();
    fromScroll();
  }, { passive: true });
  /** The names have to be measured again when the type they are set in
      changes under them, or when the window does. */
  function forgetSays() { stops.forEach((stop) => { stop.sayWide = 0; }); }
  window.addEventListener("resize", () => { resize(); forgetSays(); fromScroll(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(forgetSays).catch(() => {});
  }

  resize();
  fromScroll();
  travel = wantTravel;
  // Nothing to watch being set up when animation is turned off: the
  // drawing and its chrome are simply there.
  if (REDUCE_MOTION) shell.classList.add("lit");
  draw(1);
  requestAnimationFrame(frame);
})();
