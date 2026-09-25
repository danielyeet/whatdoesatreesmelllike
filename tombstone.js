// ============================================================
// TOMBSTONE — houses/tombstone.html
//
// The eighth house, and until 2026-09-25 it had no ground of its own.
// The owner: "give Tombstone some animations. I want it to feel very
// dead and funerary. I want there to be a reflection in the design,
// and I want it to feel ephermeral. I will think of the particulars
// later." So the particulars here are a first answer, meant to be
// changed.
//
// WHAT IT IS: a still, grey floor across the lower part of the window
// — THE HORIZON — and on it, in the margins either side of the
// writing, STONES: a round-topped headstone, a pointed one, a cross, an
// obelisk, each made of specks as the rest of the site's drawings are,
// with two short lines left out of its face where an inscription would
// be cut. And under every one of them its REFLECTION: the same specks
// turned over below the horizon, fainter, broken into the long streaks
// that still water makes of a thing, and trembling (`RIPPLE_*`).
//
// EPHEMERAL, because nothing here stays. A stone GATHERS out of the
// mist along the horizon — its specks rising off the floor into place,
// the foot of it first — STANDS a while, and then GOES as smoke does,
// its specks lifting off it and thinning away; and a little later a
// different one gathers in its place (`STONE_*`). Mist drifts along the
// horizon, and ash falls from above and is gone before it lands.
//
// THE HAND disturbs the floor: under the pointer the reflection rings
// out and shivers, as water does when it is touched, and settles again
// when the pointer goes.
//
// IT LIVES ON THE WINDOW, like the rain on Almost Human and the drift
// on Grande: a floor that scrolled away would stop being a floor. Over
// the writing everything is drawn at QUIET of its strength.
//
// WITHOUT THIS SCRIPT the page is exactly what it was before it: all
// of its writing on its own grey paper.
// ============================================================
(function () {
  const canvas = document.querySelector(".human-field");
  if (!canvas) return;
  const ink = canvas.getContext("2d");
  if (!ink) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 90417;
  const STONE = "44, 45, 49";      // the stones' ink
  const MIST = "96, 98, 104";      // the mist and the ash

  const COLUMN = 940;              // the writing's measure
  const QUIET = 0.3;               // what is left of a speck over it
  const SOFT = 80;                 // how far outside it that eases in
  const PHONE_QUIET = 0.42;        // everything, on a window with no margins

  const HORIZON = 0.76;            // the floor line, down the window
  const PER_SPECK = 10;            // square pixels of stone to one speck

  // A stone's life, in seconds: gathering, standing, going, and the
  // rest before the next gathers in its place.
  const STONE_GATHER = 4.2;
  const STONE_STAND = [11, 17];
  const STONE_GO = 5.5;
  const STONE_REST = [1.5, 4.5];

  const REFLECT = 0.34;            // how strong the reflection is
  const RIPPLE_EVERY = 0.075;      // radians of ripple per pixel below the line
  const RIPPLE_MOST = 3.2;         // px, the tremble at the foot of the window

  const MIST_COUNT = 150;
  const ASH_COUNT = 40;

  const HAND = 180;                // how far the hand's disturbance reaches
  const HAND_RING = 7;             // and how far it throws the reflection

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  let width = 0, height = 0, horizon = 0;
  let slots = [];
  let mist = [];
  let ash = [];

  // ============================================================
  // THE SHAPES, as "is this point inside?", in a box one wide and one
  // tall with the foot at y = 0 and the top at y = -1.
  // ============================================================
  const SHAPES = {
    round: (x, y) => Math.abs(x) <= 0.5 && y <= 0 && (y >= -0.62 || Math.hypot(x / 0.5, (y + 0.62) / 0.38) <= 1),
    pointed: (x, y) => {
      if (Math.abs(x) > 0.5 || y > 0) return false;
      if (y >= -0.58) return true;
      // A gothic arch: the inside of two circles, each centred on the
      // far side, pressed to the stone's height.
      const k = (y + 0.58) / 0.48;
      return Math.hypot(x + 0.5, k) <= 1 && Math.hypot(x - 0.5, k) <= 1;
    },
    cross: (x, y) => (Math.abs(x) <= 0.13 && y >= -1) || (Math.abs(x) <= 0.5 && y >= -0.8 && y <= -0.62) ||
      (Math.abs(x) <= 0.3 && y >= -0.1),
    obelisk: (x, y) => {
      if (y < -1 || y > 0) return false;
      if (y < -0.86) return Math.abs(x) <= 0.26 * (1 - (-0.86 - y) / 0.14);
      return Math.abs(x) <= 0.2 + 0.1 * (1 + y);
    },
  };
  const NAMES = Object.keys(SHAPES);
  // Where the inscription is cut: two short lines across the face, left
  // out of the speck fill.
  const cut = (name, x, y) => name !== "cross" && name !== "obelisk" &&
    Math.abs(x) < 0.3 && ((y > -0.56 && y < -0.52) || (y > -0.45 && y < -0.42 && Math.abs(x) < 0.2));

  /** A new stone for a slot: its shape, its specks, and its clock. */
  function stone(slot, from) {
    const name = NAMES[Math.floor(random() * NAMES.length)];
    const tall = slot.tall * between(0.82, 1.08) * (name === "obelisk" ? 1.25 : name === "cross" ? 1.08 : 1);
    const wide = tall * (name === "obelisk" ? 0.34 : name === "cross" ? 0.62 : between(0.5, 0.6));
    const count = Math.min(1600, Math.round((tall * wide * 0.75) / PER_SPECK));
    const specks = [];
    let guard = 0;
    const inside = SHAPES[name];
    while (specks.length < count && guard++ < count * 10) {
      const x = random() - 0.5, y = -random();
      if (!inside(x, y) || cut(name, x, y)) continue;
      // THE EDGE IS KEPT WHOLE and the face only in part, so a stone
      // reads as a cut shape rather than as a block of noise.
      const edge = !inside(x + 0.04, y) || !inside(x - 0.04, y) || !inside(x, y - 0.025) || (y < -0.03 && !inside(x, y + 0.025));
      if (!edge && random() > 0.42) continue;
      specks.push({
        x: slot.x + x * wide, y: y * tall,
        // Where it rises from in the mist, and where it lifts to as smoke.
        fromX: slot.x + x * wide + between(-40, 40), fromUp: between(-6, 10),
        toX: between(-30, 30), toUp: between(40, 130),
        late: -y * 0.55 + random() * 0.45,
        size: between(0.9, 1.7), tone: edge ? between(0.45, 0.7) : between(0.18, 0.44),
      });
    }
    const stand = between(STONE_STAND[0], STONE_STAND[1]);
    return { name, specks, born: from, stand, end: from + STONE_GATHER + stand + STONE_GO,
      next: from + STONE_GATHER + stand + STONE_GO + between(STONE_REST[0], STONE_REST[1]) };
  }

  /** How much room there is either side of the writing. */
  const margin = () => Math.max(0, (width - COLUMN) / 2);

  function build() {
    seed = SEED;
    horizon = Math.round(height * HORIZON);
    const room = margin();
    slots = [];
    // TWO STONES A SIDE where there are margins to stand them in; on a
    // window without margins, one small one at each edge.
    if (room > 300) {
      const tall = Math.min(room * 0.7, height * 0.34, 240);
      [[0.3, 0.72], [0.28, 0.7]].forEach((xs, side) => xs.forEach((f, i) => {
        const x = side === 0 ? room * f : width - room * (1 - f);
        slots.push({ x, tall: tall * (i ? 0.78 : 1) });
      }));
    } else if (room > 110) {
      // One a side where the margins are narrower.
      const tall = Math.min(room * 1.05, height * 0.34, 220);
      slots.push({ x: room * 0.46, tall }, { x: width - room * 0.46, tall: tall * 0.86 });
    } else {
      const tall = Math.min(height * 0.18, 120);
      slots.push({ x: width * 0.09, tall }, { x: width * 0.91, tall: tall * 0.82 });
    }
    // Staggered, so the scene is never empty and never all in step.
    slots.forEach((slot, i) => { slot.stone = stone(slot, REDUCE_MOTION ? -STONE_GATHER - 1 : -i * 5.5 + between(0, 2)); });
    mist = [];
    for (let i = 0; i < MIST_COUNT; i++) {
      mist.push({ x: random() * width, up: Math.pow(random(), 2) * 34, speed: between(3, 9) * (random() < 0.5 ? -1 : 1),
        size: between(1, 2.2), tone: between(0.12, 0.3), at: random(), life: between(9, 20) });
    }
    ash = [];
    for (let i = 0; i < ASH_COUNT; i++) {
      ash.push({ x: random() * width, fall: between(6, 14), sway: between(4, 14), at: random(),
        size: between(0.9, 1.5), tone: between(0.12, 0.28) });
    }
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
    const same = w === width && h === height;
    width = w; height = h;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  /** What is left of a speck where it stands, against the writing. A
      window narrower than the column keeps a clear strip at each edge
      rather than none, or the stones there would be drawn at nothing. */
  function quiet(x) {
    // A PHONE has no margins at all — the writing runs to within a
    // finger of the edge — so there the whole drawing stands quiet.
    if (width < 700) return PHONE_QUIET;
    const edge = width > COLUMN ? (width - COLUMN) / 2 : width * 0.16;
    const soft = Math.min(SOFT, width * 0.1);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return QUIET + (1 - QUIET) * Math.max(0, 1 - Math.min(1, inside));
  }

  let handX = -99999, handY = -99999, handOn = 0;

  /** Draw one speck standing at (x, y) above the line, and its
      reflection below. */
  function speck(x, y, s, alpha, tone, clock) {
    if (y > horizon + 2) return;
    const q = quiet(x);
    const shown = alpha * q;
    if (shown < 0.006) return;
    ink.fillStyle = "rgba(" + tone + "," + Math.min(1, shown).toFixed(3) + ")";
    ink.fillRect(x, y, s, s);
    // THE REFLECTION: turned over the horizon, fainter the deeper it
    // lies, drawn in streaks (every third line of it missing), and
    // trembling more the further below the line it is.
    const ry = 2 * horizon - y;
    if (ry > height + 2) return;
    const deep = (ry - horizon) / Math.max(1, height - horizon);
    if (Math.floor((ry - horizon) / 2) % 3 === 0) return;
    let dx = RIPPLE_MOST * deep * Math.sin(ry * RIPPLE_EVERY + clock * 1.3 + x * 0.004);
    if (handOn > 0.01) {
      const d = Math.hypot(handX - x, handY - ry);
      if (d < HAND) {
        const into = 1 - d / HAND;
        dx += HAND_RING * into * into * handOn * Math.sin(d * 0.16 - clock * 7);
      }
    }
    ink.fillStyle = "rgba(" + tone + "," + Math.min(1, shown * REFLECT * (1 - deep * 0.6)).toFixed(3) + ")";
    ink.fillRect(x + dx, ry, s * 1.6, Math.max(0.8, s * 0.7));
  }

  function draw(clock) {
    if (!width) return;
    ink.clearRect(0, 0, width, height);
    const want = handX < -9000 ? 0 : 1;
    handOn += (want - handOn) * (REDUCE_MOTION ? 1 : 0.05);

    // THE FLOOR: a hairline at the horizon, faint.
    for (let x = 0; x < width; x += 3) {
      const q = quiet(x);
      ink.fillStyle = "rgba(" + STONE + "," + (0.16 * q).toFixed(3) + ")";
      ink.fillRect(x, horizon, 1.6, 0.8);
    }

    // THE STONES.
    slots.forEach((slot) => {
      let one = slot.stone;
      if (!REDUCE_MOTION && clock >= one.next) { one = slot.stone = stone(slot, clock); }
      const age = REDUCE_MOTION ? STONE_GATHER + 1 : clock - one.born;
      if (age < 0 || clock > one.end && !REDUCE_MOTION) return;
      const going = age - STONE_GATHER - one.stand;
      one.specks.forEach((p) => {
        let x = p.x, y = horizon + p.y, a = p.tone;
        if (age < STONE_GATHER) {
          // GATHERING out of the mist, the foot first.
          const k = ease((age / STONE_GATHER - p.late * 0.6) / 0.4);
          if (k <= 0) return;
          x = p.fromX + (p.x - p.fromX) * k;
          y = horizon - p.fromUp + (p.y + p.fromUp) * k;
          a *= Math.min(1, k * 1.4);
        } else if (going > 0) {
          // GOING as smoke does: lifting off, thinning, the top first.
          const k = ease((going / STONE_GO - (1 - p.late) * 0.5) / 0.5);
          if (k >= 1) return;
          x += p.toX * k + Math.sin(clock * 0.8 + p.late * 9) * 4 * k;
          y -= p.toUp * k;
          a *= 1 - k;
        }
        speck(x, y, p.size, a, STONE, clock);
      });
    });

    // THE MIST along the horizon, drifting and coming and going.
    mist.forEach((m) => {
      const t = REDUCE_MOTION ? m.at : (m.at + clock / m.life) % 1;
      const shade = Math.sin(t * Math.PI);
      let x = m.x + (REDUCE_MOTION ? 0 : clock * m.speed);
      x = ((x % (width + 40)) + width + 40) % (width + 40) - 20;
      speck(x, horizon - m.up - 1, m.size, m.tone * shade, MIST, clock);
    });

    // THE ASH, falling from above and gone before it lands.
    ash.forEach((f) => {
      const t = REDUCE_MOTION ? f.at : (f.at + clock * f.fall / (horizon * 1.1)) % 1;
      const y = t * horizon * 0.95;
      const x = f.x + Math.sin(clock * 0.4 + f.at * 20) * f.sway;
      const shade = Math.sin(Math.min(1, t / 0.9) * Math.PI);
      const q = quiet(x);
      if (shade * f.tone * q < 0.006) return;
      ink.fillStyle = "rgba(" + MIST + "," + (shade * f.tone * q).toFixed(3) + ")";
      ink.fillRect(x, y, f.size, f.size);
    });
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => {
    handX = event.clientX;
    handY = event.clientY;
  };
  window.addEventListener("pointermove", hand, { passive: true });
  // A tap is the only hover a phone has.
  window.addEventListener("pointerdown", hand, { passive: true });
  document.addEventListener("pointerleave", () => { handX = -99999; handY = -99999; });
  window.addEventListener("resize", () => { size(); if (REDUCE_MOTION) draw(0); });

  size();

  if (REDUCE_MOTION) {
    draw(0);
  } else {
    const began = performance.now();
    (function frame(now) {
      draw((now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
