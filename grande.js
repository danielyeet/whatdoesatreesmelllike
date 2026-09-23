// ============================================================
// GRANDE PARFUMS — houses/grande-parfums.html
//
// The fifth house, and the quietest ground on the site. The owner
// asked for "some particles and effects for grande parfums. subtle
// designs please", and the second half of that is the whole brief.
//
// WHAT IT IS: a slow RISE of fine specks through the page — a drift
// upward, each speck on a clock of its own, fading in as it starts and
// out as it goes, so nothing on this page ever appears or disappears.
// A few of them are MOTES: a little larger and a little plainer, so
// the drift has something to catch the eye without anything in it
// being bright.
//
// AND IT SAYS NOTHING ABOUT THE HOUSE, deliberately. Every other
// drawing here is its house said as a behaviour — Pineward is a wood,
// ADAR is a void, Almost Human is a crowd that never quite resolves.
// THIS HOUSE HAS NO THEME YET: the owner's words are "Idk the theme to
// be honest", and inventing one and drawing it would be putting words
// in their mouth. So this is a ground rather than a statement — the
// site's own vocabulary, specks and a low ink, at a strength that
// reads as paper rather than as a picture. When the owner says what
// the house is, this is the file to replace.
//
// THE HAND, and it is the one thing here that is not weather: bring
// the pointer near and the specks around it are drawn a shade more
// plainly and lean a little towards it. They do not rush it and they
// do not stop; they lean. Eased in and out, so it arrives rather than
// switching on.
//
// AND THE CIRCLES, which the owner asked for: "circles that get bigger
// when you hover them, and when you hover them they also gain
// particles on an outer perimiter." A handful of faint rings standing
// about the window, each wandering a few pixels around its own place
// so none of them is ever quite still. Bring the pointer on to one —
// anywhere on it or inside it — and it SWELLS, brightens, and grows a
// ring of specks just outside its rim, turning slowly. Take the
// pointer away and all of that eases back off; at rest a circle is a
// hairline and has no perimeter at all.
//
// The circles do NOT rise with the drift, and that is deliberate
// twice over: a thing you are meant to hover has to be findable, and
// the rise is the drift's own job. They breathe in place instead, so
// the page still has nothing in it that is perfectly still.
//
// THIS IS STILL NOT A THEME. The owner has said what they want the
// page to DO, not what the house IS — the note below stands.
//
// IT LIVES ON THE WINDOW, NOT DOWN THE DOCUMENT, which is the opposite
// of the wood on Pineward and the bands on Ataraxia and is right for
// the same reason Almost Human's rain is: a thing that is FALLING or
// RISING reads as weather in the room you are in. Anchored to the
// document it would slide down as you scrolled and up as it rose, and
// the two would fight.
//
// READABILITY. The specks cross the whole window, the writing
// included, and are drawn at QUIET of their strength over the column —
// the same arrangement Ataraxia uses next door. At this ink that is
// belt and braces rather than a necessity, but the writing is the
// point of the page and the drawing is not.
//
// THE PAGE'S OWN SHAPE — the parts opening, the rank down the side,
// the pictures — is house.js. This file draws the ground and nothing
// else, and the two never speak to each other.
//
// WITHOUT THIS SCRIPT the page is exactly what it was before it: all
// of its writing on the site's own paper.
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
  const SEED = 21174;
  const INK = "23, 23, 15";        // the site's own ink, as an rgb triple

  const COLUMN = 940;              // the writing's measure
  const QUIET = 0.34;              // what is left of a speck over it
  const SOFT = 90;                 // how far outside it that eases in

  // HOW MANY, AND IT COMES OFF THE WINDOW rather than being a number
  // typed in: a speck every so many square pixels, so a tall window is
  // not emptier than a short one. The cap is there because the count
  // is the whole of this drawing's cost.
  const PER = 4200;
  const MOST = 420;

  const RISE = [11, 34];           // pixels a second, upward
  const SWAY = [0.6, 2.4];         // how far one wanders sideways as it goes
  const SWAY_EVERY = [7, 17];      // seconds for one wander out and back

  const ALPHA = [0.07, 0.21];      // how heavily one is drawn
  const SIZE = 1;                  // and how big, in pixels

  // A FEW ARE MOTES: bigger, plainer, and the only thing here you
  // would call a shape. One in fourteen or so.
  const MOTE = 0.07;
  const MOTE_SIZE = 2;
  const MOTE_ALPHA = [0.16, 0.34];

  // ---- THE CIRCLES ------------------------------------------------
  // HOW MANY comes off the window like everything else here, held
  // between a floor and a ceiling: too few and the page looks like it
  // forgot them, too many and a quiet ground becomes a pattern.
  const RING_PER = 210000;         // one circle per so many square pixels
  const RING_LEAST = 4;
  const RING_MOST = 9;
  const RING_R = [46, 148];        // their radii, in pixels
  const RING_LINE = [0.05, 0.10];  // how heavily the hairline is drawn at rest
  const RING_LIT = 4.2;            // and how much brighter under the hand
  const RING_FILL = 0.035;         // the barely-there wash inside a lit one
  const RING_SWELL = 0.22;         // how much bigger it gets, as a share of itself
  const RING_REACH = 84;           // how far outside the rim the hand still counts
  const RING_EASE = 3.6;           // how fast it swells, and how fast it lets go
  // Each wanders a little around its own place, on its own clock, so
  // that nothing on this page is ever perfectly still.
  const RING_DRIFT = [4, 13];
  const RING_DRIFT_EVERY = [15, 31];

  // THE PERIMETER: the specks a circle gains while it is held. They
  // stand just outside the rim, scattered rather than spaced, and the
  // whole ring of them turns slowly on its own.
  const PERIM = [26, 52];          // how many
  const PERIM_GAP = [3, 19];       // how far outside the rim they stand
  const PERIM_SIZE = [1, 2];
  const PERIM_ALPHA = [0.26, 0.55];
  const PERIM_TURN = [0.05, 0.15]; // radians a second, either way
  // They arrive a little after the swell rather than with it, so the
  // circle grows and THEN gathers its specks — two beats, which reads
  // as a thing waking up rather than a state being switched.
  const PERIM_LAG = 0.35;

  const HAND = 170;                // how far the lean reaches, in pixels
  const HAND_LEAN = 9;             // and how far it draws one over, in pixels
  const HAND_LIFT = 1.8;           // how much more plainly it draws one
  const HAND_EASE = 2.6;           // how fast it arrives and leaves

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();

  // ============================================================
  // THE DRIFT, BUILT ONCE
  //
  // Every speck carries where it starts, how fast it goes, how long it
  // lasts and where it is in that life — the last of those rolled at
  // the start so the page does not open with every speck being born at
  // the same moment.
  // ============================================================
  let width = 0, height = 0;
  let drift = [];
  let rings = [];

  /** THE CIRCLES, built with the drift and from the same rolled
      numbers, so the page comes out the same way every time it is
      opened at a given size.

      THEY ARE PLACED WITH ELBOW ROOM. Rolled freely, two of them land
      on top of each other often enough to notice, and a pair of
      concentric-looking rings reads as a mistake rather than as a
      scatter. Each one is offered a few places and takes the first
      that is not sitting on a circle already; if none of them is, it
      takes the last one offered rather than not existing — a floor,
      because a rule that can refuse to place anything is a rule that
      can empty the page. */
  function buildRings() {
    rings = [];
    if (!width || !height) return;
    const many = Math.max(RING_LEAST,
      Math.min(RING_MOST, Math.round((width * height) / RING_PER)));
    for (let n = 0; n < many; n++) {
      const r = between(RING_R[0], RING_R[1]);
      let x = 0, y = 0;
      for (let go = 0; go < 6; go++) {
        // Allowed to hang off the edge by up to a third of itself: a
        // circle cut by the window edge says the drawing carries on
        // past it, which a page full of whole circles does not.
        x = between(-r / 3, width + r / 3);
        y = between(-r / 3, height + r / 3);
        const clear = rings.every((o) =>
          Math.hypot(o.x - x, o.y - y) > (o.r + r) * 0.62);
        if (clear) break;
      }
      const count = Math.round(between(PERIM[0], PERIM[1]));
      const perim = [];
      for (let m = 0; m < count; m++) {
        perim.push({
          // Scattered round the rim rather than spaced along it —
          // evenly spaced they read as a dial, and this is weather.
          a: random() * Math.PI * 2,
          gap: between(PERIM_GAP[0], PERIM_GAP[1]),
          size: between(PERIM_SIZE[0], PERIM_SIZE[1]) < 1.5 ? 1 : 2,
          base: between(PERIM_ALPHA[0], PERIM_ALPHA[1]),
          // Each fades in at its own moment across the first part of
          // the swell, so the perimeter gathers rather than appears.
          when: random() * 0.55,
        });
      }
      rings.push({
        x: x, y: y, r: r,
        line: between(RING_LINE[0], RING_LINE[1]),
        drift: between(RING_DRIFT[0], RING_DRIFT[1]),
        every: between(RING_DRIFT_EVERY[0], RING_DRIFT_EVERY[1]),
        at: random(),
        turn: between(PERIM_TURN[0], PERIM_TURN[1]) * (random() < 0.5 ? -1 : 1),
        spun: random() * Math.PI * 2,
        perim: perim,
        on: 0,              // how far it is woken, 0 to 1, eased
      });
    }
  }

  function build() {
    seed = SEED;
    drift = [];
    if (!width || !height) return;
    const many = Math.min(MOST, Math.round((width * height) / PER));
    for (let n = 0; n < many; n++) {
      const mote = random() < MOTE;
      const rise = between(RISE[0], RISE[1]);
      drift.push({
        x: random() * width,
        rise: rise,
        // HOW LONG IT LIVES IS NOT ROLLED, IT IS WORKED OUT: a speck
        // lives exactly as long as it takes to rise the height of the
        // window, so every one of them crosses the whole of it and
        // dies where it leaves the top.
        //
        // Rolled independently — which is what this did first, between
        // nine and twenty-three seconds — a slow speck lived and died
        // in THIRTY-SIX PIXELS. Every one of them was born at the foot
        // of the window and went out again before it had got anywhere,
        // so the drift was a smudge along the bottom edge of the page
        // and the other nine-tenths of it was empty. That is exactly
        // what it looked like.
        life: (height + 40) / rise,
        // How far through its life it is when the page opens, so the
        // page does not begin with every speck being born at once.
        at: random(),
        sway: between(SWAY[0], SWAY[1]),
        swayEvery: between(SWAY_EVERY[0], SWAY_EVERY[1]),
        swayAt: random(),
        mote: mote,
        size: mote ? MOTE_SIZE : SIZE,
        base: mote ? between(MOTE_ALPHA[0], MOTE_ALPHA[1])
          : between(ALPHA[0], ALPHA[1]),
      });
    }
    // AFTER the drift, and never before it: the circles take their
    // numbers from the same run of `random()`, so asking for them
    // first would move every speck on the page.
    buildRings();
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // A PHONE DRAWS AT A LOWER RATIO — half again the fill of two
    // device pixels to one, and no difference anybody can see at that
    // size. Nothing above 700 changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
      window.devicePixelRatio || 1);
    const same = w === width && h === height;
    width = w; height = h;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  /** How much of a speck is left where it stands over the writing.
      Asked of the COLUMN rather than of a share of the window, so the
      quiet is where the reading is however wide the window is. On a
      window narrower than the column there is no margin at all and
      this is QUIET everywhere, which at this ink is a dusting. */
  function quiet(x) {
    const edge = width > COLUMN ? (width - COLUMN) / 2 : 0;
    const soft = Math.min(SOFT, width * 0.14);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return QUIET + (1 - QUIET) * Math.max(0, 1 - Math.min(1, inside));
  }

  /** THE QUIET, AS A GRADIENT ACROSS THE WINDOW.

      A speck is a point, so `quiet()` above answers for it exactly. A
      CIRCLE is not: a ring 300 pixels across can have one side out in
      the margin at full strength and the other over the writing, and
      one alpha for the whole stroke is wrong at both ends.

      Drawing it in sixty-odd separate arcs would answer that and cost
      sixty-odd strokes a ring a frame. A gradient laid across the
      window costs one object and says exactly the same thing: its
      stops ARE `quiet()`, at the same four boundaries. */
  function quietStroke(alpha) {
    const edge = width > COLUMN ? (width - COLUMN) / 2 : 0;
    const soft = Math.min(SOFT, width * 0.14);
    const from = Math.max(0, edge - soft), to = Math.min(width, width - edge + soft);
    const full = "rgba(" + INK + "," + Math.min(1, alpha).toFixed(3) + ")";
    const hush = "rgba(" + INK + "," + Math.min(1, alpha * QUIET).toFixed(3) + ")";
    const g = ink.createLinearGradient(0, 0, width, 0);
    g.addColorStop(0, full);
    if (from > 0) g.addColorStop(from / width, full);
    g.addColorStop(Math.min(1, (from + soft) / width), hush);
    g.addColorStop(Math.max(0, (to - soft) / width), hush);
    if (to < width) g.addColorStop(to / width, full);
    g.addColorStop(1, full);
    return g;
  }

  let handX = -99999, handY = -99999, handOn = 0;
  let last = 0;

  /** Eased at both ends, so nothing here starts or stops abruptly. */
  const ease = (q) => q * q * (3 - 2 * q);

  /** THE CIRCLES. Drawn under the drift, so the weather passes in
      front of them rather than the other way round. */
  function drawRings(clock, dt) {
    for (let n = 0; n < rings.length; n++) {
      const ring = rings[n];

      // Its own slow wander, which is the whole of its movement at
      // rest. Two waves at different rates so it does not pace.
      const t = REDUCE_MOTION ? ring.at : ring.at + clock / ring.every;
      const wander = REDUCE_MOTION ? 0 : ring.drift;
      const cx = ring.x + Math.cos(t * Math.PI * 2) * wander;
      const cy = ring.y + Math.sin(t * Math.PI * 2 * 0.73) * wander;

      // HOW FAR THE HAND IS ON TO IT. Anywhere on the circle or inside
      // it counts fully; outside, it falls away over RING_REACH. The
      // owner asked for hovering the circle, and the inside of a
      // circle is part of the circle.
      let want = 0;
      // WITH MOTION TURNED OFF A CIRCLE IS JUST A CIRCLE. It does not
      // swell, it grows no perimeter, and it does not wander — the
      // whole of this is movement, so the still version of it is the
      // hairline on its own. Every other drawing here degrades the
      // same way.
      if (!REDUCE_MOTION && handX > -9000) {
        const d = Math.hypot(handX - cx, handY - cy);
        want = d <= ring.r ? 1
          : Math.max(0, 1 - (d - ring.r) / RING_REACH);
      }
      // Eased towards what it wants rather than set to it, which is
      // the whole of "smooth" here. Framerate-independent, so it takes
      // the same time to swell on a slow machine as on a fast one.
      ring.on += (want - ring.on) * Math.min(1, RING_EASE * dt);
      const on = ease(Math.max(0, Math.min(1, ring.on)));

      const r = ring.r * (1 + RING_SWELL * on);
      if (cx + r < -10 || cx - r > width + 10) continue;

      // The wash inside, which only exists while it is held.
      if (on > 0.01 && RING_FILL > 0) {
        ink.beginPath();
        ink.arc(cx, cy, r, 0, Math.PI * 2);
        ink.fillStyle = quietStroke(RING_FILL * on);
        ink.fill();
      }

      ink.beginPath();
      ink.arc(cx, cy, r, 0, Math.PI * 2);
      ink.lineWidth = 1;
      ink.strokeStyle = quietStroke(ring.line * (1 + (RING_LIT - 1) * on));
      ink.stroke();

      // THE PERIMETER, which a circle has only while it is held. It
      // comes in behind the swell (PERIM_LAG) and each speck at its
      // own moment, so the ring gathers rather than switching on.
      if (on <= PERIM_LAG) continue;
      const gathered = (on - PERIM_LAG) / (1 - PERIM_LAG);
      ring.spun += ring.turn * dt;
      for (let m = 0; m < ring.perim.length; m++) {
        const one = ring.perim[m];
        if (gathered <= one.when) continue;
        const up = Math.min(1, (gathered - one.when) / (1 - one.when));
        const a = one.a + ring.spun;
        const at = r + one.gap * up;      // and they stand out as they arrive
        const px = cx + Math.cos(a) * at;
        const py = cy + Math.sin(a) * at;
        if (px < -4 || px > width + 4 || py < -4 || py > height + 4) continue;
        const shown = one.base * ease(up) * quiet(px);
        if (shown < 0.008) continue;
        ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown).toFixed(3) + ")";
        ink.fillRect(Math.round(px), Math.round(py), one.size, one.size);
      }
    }
  }

  function draw(clock) {
    if (!width) return;
    // Seconds since the last frame, held to a sane maximum so a tab
    // coming back from the background does not jump everything.
    const dt = REDUCE_MOTION ? 0 : Math.min(0.05, Math.max(0, clock - last));
    last = clock;
    ink.clearRect(0, 0, width, height);

    drawRings(clock, dt);

    const want = handX < -9000 ? 0 : 1;
    // THE REAL TIME SINCE THE LAST FRAME, now that there is one. This
    // was a hard-coded 0.016 — one sixtieth — which is right only on a
    // machine actually managing sixty frames a second, and made the
    // lean arrive at different speeds on different screens.
    handOn += (want - handOn) * Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : dt));

    drift.forEach((one) => {
      // WHERE IT IS IN ITS OWN LIFE, 0 to 1 and round again. With
      // motion turned off it simply stands where it was born.
      const age = REDUCE_MOTION ? one.at : (one.at + clock / one.life) % 1;

      // FADING IN AND OUT AT THE TWO ENDS, so a speck is never seen to
      // appear or to go. A fifth of its life either side.
      const shade = Math.min(1, Math.min(age, 1 - age) / 0.2);
      if (shade < 0.02) return;

      // Its life IS the crossing, so this runs from the foot of the
      // window to just off the top of it and starts again.
      let y = (height + 20) - age * one.rise * one.life;

      const wander = REDUCE_MOTION ? 0
        : Math.sin((one.swayAt + clock / one.swayEvery) * Math.PI * 2) * one.sway;
      let x = one.x + wander;

      // THE HAND. It leans a speck towards the pointer rather than
      // pulling it there — the drift is weather and weather does not
      // take orders. And it is taken from where the speck actually is,
      // so it follows the hand round the window.
      let lift = 1;
      if (handOn > 0.004) {
        const dx = handX - x, dy = handY - y;
        const d = Math.hypot(dx, dy);
        if (d < HAND && d > 0.001) {
          const into = 1 - d / HAND;
          const pull = into * into * handOn;
          x += (dx / d) * HAND_LEAN * pull;
          y += (dy / d) * HAND_LEAN * pull;
          lift += (HAND_LIFT - 1) * pull;
        }
      }
      if (x < -20 || x > width + 20) return;

      const shown = one.base * shade * lift * quiet(x);
      if (shown < 0.008) return;
      ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown).toFixed(3) + ")";
      ink.fillRect(Math.round(x), Math.round(y), one.size, one.size);
    });
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => {
    handX = event.clientX;
    handY = event.clientY;
    if (REDUCE_MOTION) draw(0);
  };
  window.addEventListener("pointermove", hand, { passive: true });
  // AND A TAP COUNTS AS THE HAND ARRIVING. On a phone there is no
  // hovering: a drag sends `pointermove` and works already, but a TAP
  // sends `pointerdown` and may send nothing else at all.
  window.addEventListener("pointerdown", hand, { passive: true });
  window.addEventListener("pointerleave", () => {
    handX = -99999; handY = -99999;
  });

  window.addEventListener("resize", size);

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
