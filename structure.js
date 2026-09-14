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
  const SWARM = 2200;          // how many are in the volume at once
  const SPREAD = 26;           // how far out to the sides they are scattered
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
  const DRIFT = 0.25;          // how fast the travel creeps on its own
  const EASE = 0.12;           // how quickly it catches up with the scroll
  const SCREENS = 1.25;        // how many screens of scrolling a station is worth

  // --- the moving parts
  const CARRIAGE_FROM = 58;    // where the travelling gantry starts back
  const CARRIAGE_SPEED = 13;   // and how fast it comes at you, units a second
  const TRAVERSE_EVERY = 2.3;  // seconds between things running across the frame
  const TRAVERSES = 4;         // how many can be in the air at once
  const SCAN_EVERY = 9;        // seconds between one pass of the scan
  const SCAN_FOR = 0.3;        // and how much of that it takes to cross

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
  for (let n = 0; n < SWARM; n++) {
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
    return Object.assign(built, {
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      href: row.getAttribute("href"),
      number: String(i + 1).padStart(2, "0"),
      ring: random() * 6.283,
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
    mark.innerHTML =
      '<span class="structure-say"><span class="structure-no"></span>' +
      '<span class="structure-name"></span><span class="structure-meta"></span></span>';
    mark.querySelector(".structure-no").textContent = stop.number;
    mark.querySelector(".structure-name").textContent = stop.name;
    mark.querySelector(".structure-meta").textContent = stop.meta;
    marks.appendChild(mark);
    stop.mark = mark;
  });

  // The road, as something the page can actually scroll down.
  const road = document.createElement("div");
  road.className = "structure-road";
  road.setAttribute("aria-hidden", "true");
  road.style.height = (stops.length * SCREENS * 100).toFixed(0) + "vh";

  page.insertBefore(road, page.firstChild);
  page.insertBefore(shell, page.firstChild);

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
  let travel = 0, wantTravel = 0, drifted = 0, eye = 0;
  let clock = 0, last = 0;
  let vignette = null;

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
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
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, 0.1);
    paint.beginPath();
    corners.forEach((c) => {
      const a = to(c[0], c[1], eye + 3.2);
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
      const fade = Math.min(1, (FRAME_SHOW - p.ahead) / (FRAME_SHOW * 0.45)) *
                   Math.min(1, p.ahead / 6);
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
    const a = to(0, FLOOR, eye + 1.7);
    const b = to(0, FLOOR, eye + SPINE_SHOW);
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
    for (let z = first; z - eye < SPINE_SHOW; z++) {
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
    for (let n = 0; n < swarm.length; n++) {
      const speck = swarm[n];
      const depth = speck.z - eye;
      const lap = Math.floor((depth - NEAR) / DEEP);
      const ahead = depth - lap * DEEP;
      const k = lens / ahead;

      const wob = REDUCE_MOTION ? 0 : WOBBLE;
      const x = (hash2(speck.id, lap * 2 + 1) - 0.5) * 2 * SPREAD +
        Math.sin(clock * speck.rate + speck.phase) * wob;
      const y = (hash2(speck.id, lap * 2 + 7) - 0.5) * 2 * SPREAD +
        Math.cos(clock * speck.rate * 0.8 + speck.phase) * wob;

      const px = midX + x * k, py = midY + y * k;
      if (px < -40 || px > width + 40 || py < -40 || py > height + 40) continue;

      // Out at both ends of its lap, so neither wrap can be seen.
      const far = Math.min(1, (NEAR + DEEP - ahead) / (DEEP * 0.5));
      const close = Math.min(1, (ahead - NEAR) / FADE_NEAR);
      const lit = speck.lit * far * close * Math.min(1, 16 / ahead);
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
      figure. Returns the bounding box, or null if none of it landed. */
  function drawAssembly(thing, strength, accent) {
    const put = [];
    let left = Infinity, right = -Infinity, top = Infinity, foot = -Infinity;
    for (const node of thing.nodes) {
      const wob = REDUCE_MOTION ? 0 : WOBBLE * 1.6;
      const p = to(
        node.x + Math.sin(clock * node.rate + node.phase) * wob,
        node.y + Math.cos(clock * node.rate * 0.7 + node.phase) * wob,
        node.z
      );
      if (!p) { put.push(null); continue; }
      put.push({ x: p.x, y: p.y, size: node.size * p.k * 0.03 });
      if (p.x < left) left = p.x;
      if (p.x > right) right = p.x;
      if (p.y < top) top = p.y;
      if (p.y > foot) foot = p.y;
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
      const strength = fade * fixture.faint;
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

  function drawStops(nearest) {
    for (const stop of stops) {
      const ahead = stop.at.z - eye;
      const strength = carry(ahead);
      if (strength <= 0.004) { stop.mark.classList.add("gone"); continue; }
      const box = drawAssembly(stop, strength, true);
      if (!box) { stop.mark.classList.add("gone"); continue; }

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
      // the middle of it, on the site's own registration mark.
      if (!REDUCE_MOTION && stop === nearest) {
        for (let r = 0; r < 2; r++) {
          const beat = ((clock * 0.42 + stop.ring + r * 0.5) % 1);
          const grow = 0.5 + beat * 1.4;
          const w = (right - left) * grow, h = (foot - top) * grow;
          paint.strokeStyle = rgba(ACCENT, strength * 0.3 * (1 - beat) * (1 - beat));
          paint.strokeRect(cx - w / 2, cy - h / 2, w, h);
        }
      }

      // Carried right off the window as you pass through it: taken
      // out of the page rather than left there invisible.
      if (right < 0 || left > width || foot < 0 || top > height) {
        stop.mark.classList.add("gone");
        continue;
      }
      stop.mark.classList.remove("gone");
      stop.mark.style.left = left.toFixed(1) + "px";
      stop.mark.style.top = top.toFixed(1) + "px";
      stop.mark.style.width = (right - left).toFixed(1) + "px";
      stop.mark.style.height = (foot - top).toFixed(1) + "px";
      stop.mark.style.opacity = (0.28 + strength * 0.72).toFixed(3);
      stop.mark.classList.toggle("close", strength > 0.55);
    }
  }

  // ============================================================
  // THE MOVING PARTS
  //
  // A gantry running down the frame at you, and things crossing it.
  // Both are on their own clocks rather than on the travel, so the
  // page has something happening in it while you are standing still.
  // ============================================================
  let carriage = CARRIAGE_FROM;

  function drawCarriage(on) {
    const p = to(0, 0, eye + carriage);
    if (!p) return;
    const fade = Math.min(1, carriage / 14) * Math.min(1, (CARRIAGE_FROM - carriage) / 8 + 0.2);
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
    if (on) carriage -= CARRIAGE_SPEED * on / 60;
    if (carriage < 2.4) carriage = CARRIAGE_FROM;
  }

  const traverses = [];
  let nextTraverse = 1.2;
  function drawTraverses(on) {
    if (!REDUCE_MOTION && clock > nextTraverse && traverses.length < TRAVERSES) {
      nextTraverse = clock + TRAVERSE_EVERY * (0.5 + random());
      const across = random() < 0.68;
      traverses.push({
        z: eye + 7 + random() * 26,
        along: -RIB_X * 1.1,
        at: (random() - 0.5) * 2 * (across ? RIB_Y : RIB_X) * 0.8,
        across: across,
        way: random() < 0.5 ? 1 : -1,
        speed: 9 + random() * 13,
        trail: 1.4 + random() * 2.2,
      });
    }
    for (let n = traverses.length - 1; n >= 0; n--) {
      const one = traverses[n];
      const reach = (one.across ? RIB_X : RIB_Y) * 1.1;
      const from = one.along - one.trail;
      const head = one.across
        ? to(one.along * one.way, one.at, one.z)
        : to(one.at, one.along * one.way, one.z);
      const tail = one.across
        ? to(from * one.way, one.at, one.z)
        : to(one.at, from * one.way, one.z);
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
      if (one.along - one.trail > reach || one.z - eye < NEAR) traverses.splice(n, 1);
    }
  }

  /** A line passing down the whole window every so often, the way a
      screen showing a reading refreshes it. It is deliberately almost
      too faint to see: it is meant to be noticed the second time. */
  function drawScan() {
    const beat = (clock % SCAN_EVERY) / SCAN_EVERY;
    if (beat > SCAN_FOR) return;
    const y = (beat / SCAN_FOR) * (height + 180) - 90;
    const band = paint.createLinearGradient(0, y - 80, 0, y + 12);
    band.addColorStop(0, rgba(COOL, 0));
    band.addColorStop(0.82, rgba(COOL, 0.045));
    band.addColorStop(1, rgba(COOL, 0));
    paint.fillStyle = band;
    paint.fillRect(0, y - 80, width, 92);
    paint.fillStyle = rgba(WHITE, 0.05);
    paint.fillRect(0, y, width, 1);
  }

  /** The drafting marks: a sight in each corner of the screen and a
      crosshair dead centre, where you are going. They belong to the
      window rather than to the frame, so they never move. */
  function drawSights() {
    const arm = 18, gap = 46;
    paint.lineWidth = 1;
    paint.strokeStyle = rgba(STEEL, 0.28);
    paint.beginPath();
    [[gap, gap, 1, 1], [width - gap, gap, -1, 1],
     [width - gap, height - gap, -1, -1], [gap, height - gap, 1, -1]].forEach((c) => {
      paint.moveTo(c[0] + c[2] * arm, c[1]);
      paint.lineTo(c[0], c[1]);
      paint.lineTo(c[0], c[1] + c[3] * arm);
    });
    paint.stroke();
    paint.strokeStyle = rgba(WHITE, 0.2);
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
    drawCarriage(on);
    drawTraverses(on);

    paint.fillStyle = vignette;
    paint.fillRect(0, 0, width, height);
    if (grain) {
      paint.fillStyle = grain;
      paint.fillRect(0, 0, width, height);
    }
    if (!REDUCE_MOTION) drawScan();
    drawSights();

    const along = Math.min(1, eye / ROAD);
    readout.textContent =
      (nearest ? nearest.number : "--") + " / " + String(stops.length).padStart(2, "0") +
      "   ·   " + String(Math.round(along * 100)).padStart(3, "0") + "%";
    cue.classList.toggle("gone", along > 0.02);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const on = Math.min(3, (now - last) / 16.7) || 1;
    last = now;
    if (!REDUCE_MOTION) {
      clock += on / 60;
      // The travel creeps on by itself, so the page is never quite
      // still even when nothing is being done to it.
      drifted += (DRIFT * on) / 60;
    }
    travel += (wantTravel - travel) * Math.min(1, EASE * on);
    spineHot += (spineWant - spineHot) * Math.min(1, 0.16 * on);
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

  window.addEventListener("scroll", fromScroll, { passive: true });
  window.addEventListener("resize", () => { resize(); fromScroll(); });

  resize();
  fromScroll();
  travel = wantTravel;
  draw(1);
  requestAnimationFrame(frame);
})();
