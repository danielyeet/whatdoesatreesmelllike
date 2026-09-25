// ============================================================
// GRANDE PARFUMS — houses/grande-parfums.html
//
// The fifth house, and the quietest ground on the site. The owner
// asked first for "some particles and effects for grande parfums.
// subtle designs please", and then, on 2026-09-25, for "a particle
// effect of bubbling (i dont want it to seem comical or drawn up like
// with tale), but particles that rise up and pop more or less into a
// bunch of other smaller particles".
//
// WHAT IT IS: a slow RISE of fine specks through the page — each speck
// on a clock of its own, fading in as it starts — and about half of
// them, somewhere on the way up, BURST: the speck is gone and in its
// place a small spray of finer specks flies out a few pixels, slows,
// and fades (`BURST_*`). That is the whole of the bubbling: no ring, no
// outline, nothing drawn — only a particle that becomes several smaller
// ones. A few of the specks are MOTES: a little larger and plainer, and
// they burst into more.
//
// WHAT THE HOUSE IS has still not been said, so the colour is only the
// paper turned a hair towards champagne (`.grande-page` in style.css),
// and the drawing is the site's own ink at a strength that reads as
// paper rather than as a picture.
//
// THE HAND, and it is the one thing here that is not weather: bring
// the pointer near and the specks around it are drawn a shade more
// plainly and lean a little towards it. They do not rush it and they
// do not stop; they lean. Eased in and out, so it arrives rather than
// switching on.
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
// the same arrangement Ataraxia uses next door.
//
// THE PAGE'S OWN SHAPE — the parts opening, the rank down the side,
// the pictures — is house.js. This file draws the ground and nothing
// else, and the two never speak to each other.
//
// WITHOUT THIS SCRIPT the page is exactly what it was before it: all
// of its writing on its own paper.
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
  const PER = 3400;
  const MOST = 420;

  const RISE = [11, 34];           // pixels a second, upward
  const SWAY = [0.6, 2.4];         // how far one wanders sideways as it goes
  const SWAY_EVERY = [7, 17];      // seconds for one wander out and back

  const ALPHA = [0.12, 0.3];       // how heavily one is drawn
  const SIZE = 1.3;                // and how big, in pixels

  // A FEW ARE MOTES: bigger, plainer, and the only thing here you
  // would call a shape. One in fourteen or so.
  const MOTE = 0.07;
  const MOTE_SIZE = 2.2;
  const MOTE_ALPHA = [0.18, 0.36];

  // THE BURST. About half of them burst, somewhere between a third and
  // nine tenths of the way up; each into a few finer specks (more for a
  // mote) that fly out BURST_REACH, slow as they go, and fade over
  // BURST_SECONDS.
  const BURSTS = 0.5;
  const BURST_AT = [0.32, 0.9];
  const BURST_BITS = [4, 7];
  const MOTE_BITS = [7, 11];
  const BURST_REACH = [5, 13];
  const BURST_SECONDS = 1.1;
  const BIT_SIZE = 0.8;

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
        burst: null,
      });
      const one = drift[drift.length - 1];
      if (mote || random() < BURSTS) {
        const many = Math.round(mote ? between(MOTE_BITS[0], MOTE_BITS[1]) : between(BURST_BITS[0], BURST_BITS[1]));
        const bits = [];
        for (let b = 0; b < many; b++) {
          bits.push({ a: (b / many) * Math.PI * 2 + between(-0.45, 0.45),
            far: between(BURST_REACH[0], BURST_REACH[1]) * (mote ? 1.5 : 1) });
        }
        // Where in its life it bursts, and how much of its life the
        // burst takes.
        one.burst = { at: between(BURST_AT[0], BURST_AT[1]), long: BURST_SECONDS / one.life, bits: bits };
      }
    }
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

  let handX = -99999, handY = -99999, handOn = 0;

  function draw(clock) {
    if (!width) return;
    ink.clearRect(0, 0, width, height);

    const want = handX < -9000 ? 0 : 1;
    handOn += (want - handOn) * Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : 0.016));

    drift.forEach((one) => {
      // WHERE IT IS IN ITS OWN LIFE, 0 to 1 and round again. With
      // motion turned off it simply stands where it was born.
      const age = REDUCE_MOTION ? one.at : (one.at + clock / one.life) % 1;

      // FADING IN AND OUT AT THE TWO ENDS, so a speck is never seen to
      // appear or to go. A fifth of its life either side.
      const shade = Math.min(1, Math.min(age, 1 - age) / 0.2);
      if (shade < 0.02) return;

      // Past its burst and the burst over, it is gone until it is born
      // again at the foot.
      const burst = one.burst;
      const into = burst ? (age - burst.at) / burst.long : -1;
      if (into >= 1) return;

      // Its life IS the crossing, so this runs from the foot of the
      // window to just off the top of it and starts again.
      let y = (height + 20) - Math.min(age, burst && into >= 0 ? burst.at : 1) * one.rise * one.life;

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
      if (into >= 0) {
        // THE BURST: finer specks flying out and slowing, drifting on
        // up a little, fading.
        const out = 1 - Math.pow(1 - into, 3);
        const left = Math.pow(1 - into, 1.3);
        ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown * 1.15 * left).toFixed(3) + ")";
        burst.bits.forEach((b) => {
          ink.fillRect(x + Math.cos(b.a) * b.far * out, y + Math.sin(b.a) * b.far * out - into * 5, BIT_SIZE, BIT_SIZE);
        });
        return;
      }
      ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown).toFixed(3) + ")";
      ink.fillRect(x, y, one.size, one.size);
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
