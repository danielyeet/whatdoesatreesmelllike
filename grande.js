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
// AND THEN, the night of 2026-09-25: "Intensify the particles in grande
// parfums particle page (make it like the hover in SD)". So the page is
// now drawn as the Houses view's hover for this house is (motifs.js,
// `rise`): up to 640 specks at once, half again as dark as they were and
// a size each, every one of them BORN somewhere in the lower four fifths
// of the window, RISING for four to eight seconds, and then BURSTING —
// and born again somewhere else. What follows is how it was before that,
// kept for the reasoning; the numbers in TUNING are the new ones.
//
// WHAT IT WAS: a slow RISE of fine specks through the page — each speck
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
  // not emptier than a short one — capped at what the hover stands at
  // once (640).
  const PER = 2000;
  const MOST = 640;

  // EACH SPECK, as the hover's are: born anywhere from a fifth of the way
  // down to just below the foot, rising RISE pixels a second with a small
  // sway, for LIVE seconds, then bursting over BURST_SECONDS into BITS
  // finer specks that fly out REACH and fade — and born again elsewhere.
  const RISE = [18, 42];           // pixels a second, upward
  const SWAY = [2, 6];             // pixels either way
  const SWAY_EVERY = [0.38, 0.72]; // seconds a radian, as the hover's
  const LIVE = [4.2, 8.2];         // seconds before it bursts
  const FADE_IN = 0.9;             // seconds to come up, as the hover's
  const ALPHA = 0.5;               // how heavily one is drawn, as the hover's
  const SIZE = [1.1, 2.1];
  const MOTE = 0.1;                // one in ten is a mote, larger
  const MOTE_SIZE = [2.3, 3.2];
  const BURST_BITS = [3, 5];
  const MOTE_BITS = [7, 10];
  const BURST_REACH = [7, 16];
  const BURST_SECONDS = 0.9;
  const BIT_SIZE = [0.55, 1];

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
      const live = between(LIVE[0], LIVE[1]);
      const count = Math.round(mote ? between(MOTE_BITS[0], MOTE_BITS[1]) : between(BURST_BITS[0], BURST_BITS[1]));
      const bits = [];
      for (let b = 0; b < count; b++) {
        bits.push({ a: (b / count) * Math.PI * 2 + between(-0.4, 0.4),
          far: between(BURST_REACH[0], BURST_REACH[1]) * (mote ? 1.6 : 1),
          s: between(BIT_SIZE[0], BIT_SIZE[1]) });
      }
      drift.push({
        n: n,
        live: live,
        period: live + BURST_SECONDS,
        // Where in its round it is when the page opens, so the page does
        // not begin with every speck being born at once.
        offset: random() * (live + BURST_SECONDS),
        rise: between(RISE[0], RISE[1]),
        sway: between(SWAY[0], SWAY[1]),
        swayEvery: between(SWAY_EVERY[0], SWAY_EVERY[1]),
        phase: random() * Math.PI * 2,
        size: mote ? between(MOTE_SIZE[0], MOTE_SIZE[1]) : between(SIZE[0], SIZE[1]),
        bits: bits,
      });
    }
  }

  /** Where a speck is born on its `round`th time: the same every visit,
      somewhere new every round. */
  const born = (n, round, k) => {
    let h = (n * 374761393 + round * 668265263 + k * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

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
      // WHICH ROUND IT IS ON, and how far into it. With motion turned off
      // it simply stands part way up its first.
      const clock2 = REDUCE_MOTION ? one.offset * 0.5 : clock + one.offset;
      const round = Math.floor(clock2 / one.period);
      const age = clock2 - round * one.period;
      const x0 = born(one.n, round, 1) * width;
      const y0 = height * 0.2 + born(one.n, round, 2) * (height * 0.8 + 20);
      const t = Math.min(age, one.live);
      let x = x0 + (REDUCE_MOTION ? 0 : Math.sin(t / one.swayEvery + one.phase) * one.sway);
      let y = y0 - one.rise * t;

      // THE HAND. It leans a speck towards the pointer rather than
      // pulling it there — the drift is weather and weather does not
      // take orders.
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
      if (x < -20 || x > width + 20 || y < -30) return;

      const up = REDUCE_MOTION ? 1 : Math.min(1, age / FADE_IN);
      const shown = ALPHA * up * lift * quiet(x);
      if (shown < 0.008) return;
      if (age >= one.live) {
        // THE BURST: finer specks flying out and slowing, drifting on up
        // a little, fading.
        const q = (age - one.live) / BURST_SECONDS;
        const out = 1 - Math.pow(1 - q, 3);
        ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown * Math.pow(1 - q, 1.4)).toFixed(3) + ")";
        one.bits.forEach((b) => {
          ink.fillRect(x + Math.cos(b.a) * b.far * out - b.s / 2, y + Math.sin(b.a) * b.far * out - q * 6 - b.s / 2, b.s, b.s);
        });
        return;
      }
      ink.fillStyle = "rgba(" + INK + "," + Math.min(1, shown).toFixed(3) + ")";
      ink.fillRect(x - one.size / 2, y - one.size / 2, one.size, one.size);
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
