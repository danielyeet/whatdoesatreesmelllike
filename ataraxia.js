// ============================================================
// ATARAXIA — works/ataraxia.html
//
// The fourth house in Scent descriptions. The page is DARK GRAY, and
// what crosses it is BANDS OF GLOWING WHITE PARTICLES — each band a
// long drift of specks running from one side of the window to the
// other at an angle of its own.
//
//   A BAND      a spine crossing the window at its own angle, with
//               specks scattered about it — thick along the middle of
//               it and thinning to nothing either side, so a band has
//               a bright core and no edge you can point at.
//   THE CREST   a swell of brightness travelling along a band's own
//               length on its own slow clock. THE SPECKS NEVER MOVE;
//               what moves is where the light is. That is the whole of
//               the glow, and it is why the page reads as lit rather
//               than as printed.
//   THE KINDLE  what answers the hand: the specks within reach of the
//               pointer burn brighter, eased in and out so it arrives
//               rather than switching on.
//
// THIS REPLACED A CHURCHYARD. Angels and crosses stood down both
// margins here for one round, every one of them cut out of specks and
// perfectly still. The owner asked for them gone and for this in their
// place, so none of it is in this file any more — no angel, no cross,
// no plinth, no lean, no halo, no light crossing the window.
//
// READABILITY, WHICH THE OWNER ASKED FOR IN AS MANY WORDS: "I want
// them to go behind the text. Idk how but make it so that the
// readability is good."
//
// So the bands are NOT kept out of the middle of the page — they cross
// the whole of it, behind the writing, which is what was asked for.
// What keeps the reading clear is two things instead:
//
//   THE QUIET   a speck standing over the column is drawn at QUIET of
//               its strength, easing in over SOFT pixels either side
//               so there is no line down the page where it starts.
//   THE BLOOM STOPS AT THE COLUMN. A speck's core is one or two
//               pixels and costs the reading almost nothing even at
//               full strength; what would wash out a paragraph is the
//               BLOOM around it, which is soft and wide. So a speck
//               over the writing keeps its core and is given no bloom
//               at all, however bright it is. The band still passes
//               behind the words; it just stops glowing while it does.
//
// HOW THE GLOW IS DRAWN. Every speck is a core — one `fillRect`, and
// cheap. Only a speck brighter than GLOW_FROM is also given a bloom,
// which is one pre-drawn sprite scaled to size. That is deliberate
// twice over: it keeps the count of expensive draws in the hundreds
// rather than the thousands, and because it is the CREST that pushes a
// speck over that line, the bloom travels along the band with it.
// The whole frame is composited with `lighter` — light adds — so where
// two bands cross, the crossing is brighter than either.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. A band is anchored in the
// DOCUMENT, not in the window, and where it lands on the screen is
// worked out from `scrollY` every frame rather than stepped along — so
// scrolling back gets you the same bands you left.
//
// THE PAGE'S OWN SHAPE — the parts opening, the rank down the side,
// the pictures — is house.js, which every house from this one on
// shares. This file draws the ground and nothing else, and the two
// never speak to each other.
//
// WITHOUT THIS SCRIPT the page is all of its writing on its own dark
// gray, and the ground is simply empty.
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
  const SEED = 40711;

  const COLUMN = 940;              // the writing's measure
  // WHAT IS LEFT OF A SPECK STANDING OVER THE WRITING. The bands go
  // behind the text rather than round it, so this is the number the
  // reading actually rests on. It is low on purpose: a band crossing a
  // paragraph should read as a band you can see through the words, not
  // as something competing with them.
  const QUIET = 0.26;
  const SOFT = 96;                 // how far outside the column it eases in over

  const EVERY = [250, 430];        // how far apart two bands are, down the document
  // HOW FAR OFF FLAT A BAND LEANS, in degrees, and the sign is rolled
  // separately so they lean both ways. The owner asked for "various
  // angles"; the ceiling is what keeps them reading as bands going
  // SIDE TO SIDE rather than as streaks falling down the page. At 26°
  // a band rises about six hundred pixels crossing a wide window,
  // which is plainly a slant and still plainly a crossing.
  const ANGLE = [6, 26];
  const THICK = [24, 66];          // how far a speck may stray from the spine
  const SPECKS = [820, 1500];
  const BRIGHT = [0.26, 0.72];     // how heavily one is drawn at rest
  const SIZE = [0.8, 2.2];         // and how big its core is, in pixels

  // A BAND IS DRAWN LONGER THAN THE WINDOW IS WIDE, and that is not
  // waste. A band fades out at its two ends, or it would stop dead in
  // mid-air; drawn exactly window-wide, that fade lands ON the window
  // and every band appears to shy away from the edges. At 1.6 the
  // fades are off the screen entirely and the bands run off both
  // sides, which is what "from side to side" means.
  const LONGER = 1.6;
  const ENDS = 0.12;               // the share of each end that fades

  const CREST_EVERY = [11, 23];    // seconds for one pass of the crest along a band
  const CREST_WIDE = 0.3;          // how much of a band it lights at once
  const CREST_LIFT = 2.4;          // and how much brighter it draws it

  const TWINKLE = 0.2;             // how much a speck breathes about its own strength
  const TWINKLE_EVERY = [3.5, 11]; // seconds for one breath

  const GLOW_FROM = 0.2;           // a speck brighter than this is also given a bloom
  const GLOW_WIDE = 14;            // the bloom's radius in pixels, at size 1
  const GLOW_MOST = 0.4;           // and the most of it that is ever laid down

  const HAND = 200;                // how far the kindle reaches, in pixels
  const HAND_LIFT = 2.1;           // how much brighter it burns
  const HAND_EASE = 2.8;           // how fast it arrives and leaves

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();

  // ============================================================
  // THE BLOOM, DRAWN ONCE
  //
  // A soft white disc on its own little canvas, laid down scaled
  // wherever a speck is bright enough to need one. Drawing a radial
  // gradient per speck per frame would be the same picture at a
  // hundred times the cost.
  // ============================================================
  const SPRITE = 64;
  const glow = document.createElement("canvas");
  glow.width = SPRITE;
  glow.height = SPRITE;
  (function () {
    const g = glow.getContext("2d");
    if (!g) return;
    const half = SPRITE / 2;
    const fade = g.createRadialGradient(half, half, 0, half, half, half);
    // Three stops rather than two: a straight ramp reads as a disc
    // with an edge, and what is wanted is a core that falls away.
    fade.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    fade.addColorStop(0.28, "rgba(255, 255, 255, 0.34)");
    fade.addColorStop(1, "rgba(255, 255, 255, 0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, SPRITE, SPRITE);
  })();

  // ============================================================
  // THE BANDS, BUILT ONCE
  //
  // In DOCUMENT space, and rebuilt only when the page's own height or
  // width changes — a band belongs to a place in the writing, not to a
  // place on the screen.
  // ============================================================
  let width = 0, height = 0, docTall = 0;
  let bands = [];

  function build() {
    seed = SEED;
    bands = [];
    if (!width || !docTall) return;
    let y = 120;
    let leaned = 0;                 // which way the last one leaned
    while (y < docTall - 60) {
      // THE SIGN IS ROLLED WITH A MEMORY of the last band, so two can
      // lean the same way but three cannot. Rolled freely, a run of
      // four bands all leaning left reads as a pattern rather than as
      // weather, and the page stops looking scattered.
      const way = Math.abs(leaned) >= 2 ? -Math.sign(leaned)
        : (random() < 0.5 ? -1 : 1);
      leaned = Math.sign(leaned) === way ? leaned + way : way;
      const ang = between(ANGLE[0], ANGLE[1]) * (Math.PI / 180) * way;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const len = (width / Math.max(0.4, Math.abs(cos))) * LONGER;
      const thick = between(THICK[0], THICK[1]);
      const many = Math.round(between(SPECKS[0], SPECKS[1]));
      const specks = [];
      for (let n = 0; n < many; n++) {
        specks.push({
          t: random(),
          // THREE ROLLS AVERAGED, not one. A flat roll scatters specks
          // evenly between the two edges, which draws a band with a
          // hard side to it; averaged, they heap towards the middle
          // and the band has a spine.
          off: (random() + random() + random() - 1.5) / 1.5,
          size: between(SIZE[0], SIZE[1]),
          base: between(BRIGHT[0], BRIGHT[1]),
          phase: random(),
          rate: 1 / between(TWINKLE_EVERY[0], TWINKLE_EVERY[1]),
        });
      }
      bands.push({
        y: y,
        cos: cos,
        sin: sin,
        len: len,
        thick: thick,
        // How far up and down the page this band reaches, worked out
        // once so a band that is nowhere near the window can be
        // dropped without touching a single speck of it.
        reach: Math.abs(sin) * len * 0.5 + thick + 4,
        every: between(CREST_EVERY[0], CREST_EVERY[1]),
        at: random(),               // where its crest starts
        specks: specks,
      });
      y += between(EVERY[0], EVERY[1]);
    }
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tall = Math.max(document.documentElement.scrollHeight, h);
    // A PHONE DRAWS AT A LOWER RATIO — half again the fill of two
    // device pixels to one, and no difference anybody can see at that
    // size. Nothing above 700 changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
      window.devicePixelRatio || 1);
    const same = w === width && h === height && Math.abs(tall - docTall) < 40;
    width = w; height = h; docTall = tall;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  /** How much of a speck is left where it stands over the writing.
      Asked of the COLUMN rather than of a share of the window, so the
      quiet is exactly where the reading is however wide the window
      happens to be.

      ON A WINDOW NARROWER THAN THE COLUMN there is no margin at all,
      so this returns QUIET everywhere and the page keeps a faint
      dusting rather than a drawing. That is the right answer on a
      phone: the writing is the whole width, and a band at full
      strength behind every line of it is exactly the thing the owner
      asked to be avoided. */
  function quiet(x) {
    const edge = width > COLUMN ? (width - COLUMN) / 2 : 0;
    const soft = Math.min(SOFT, width * 0.14);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return QUIET + (1 - QUIET) * Math.max(0, 1 - Math.min(1, inside));
  }

  let handX = -99999, handY = -99999, handOn = 0;

  function draw(down, clock) {
    if (!width) return;
    // The clear has to be an ordinary paint; everything after it adds.
    ink.globalCompositeOperation = "source-over";
    ink.globalAlpha = 1;
    ink.clearRect(0, 0, width, height);
    ink.globalCompositeOperation = "lighter";
    ink.fillStyle = "#ffffff";

    const want = handX < -9000 ? 0 : 1;
    handOn += (want - handOn) * Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : 0.016));

    bands.forEach((band) => {
      const mid = band.y - down;
      if (mid - band.reach > height || mid + band.reach < 0) return;

      const crest = REDUCE_MOTION ? 0.5 : (clock / band.every + band.at) % 1;

      band.specks.forEach((sp) => {
        const along = (sp.t - 0.5) * band.len;
        const across = sp.off * band.thick;
        const x = width * 0.5 + along * band.cos - across * band.sin;
        if (x < -20 || x > width + 20) return;
        const y = mid + along * band.sin + across * band.cos;
        if (y < -20 || y > height + 20) return;

        // THE BODY OF THE BAND: fading out at the two ends, and away
        // from the spine. Squared across, so the middle of a band is
        // plainly its middle.
        const ends = Math.min(1, Math.min(sp.t, 1 - sp.t) / ENDS);
        const near = 1 - Math.abs(sp.off);
        const body = ends * near * near;
        if (body < 0.02) return;

        // THE CREST, travelling along it. The distance is taken the
        // short way round, so the crest runs off one end and back on
        // at the other instead of stopping.
        let lift = 1;
        const gap = Math.abs(sp.t - crest);
        const off = Math.min(gap, 1 - gap);
        if (off < CREST_WIDE) {
          const into = 1 - off / CREST_WIDE;
          lift += (CREST_LIFT - 1) * into * into;
        }

        const flick = REDUCE_MOTION ? 1
          : 1 + TWINKLE * Math.sin((clock * sp.rate + sp.phase) * Math.PI * 2);

        // THE KINDLE. Taken from where the speck actually lands on the
        // window, so it follows the hand rather than the band.
        let hot = 1;
        if (handOn > 0.004) {
          const d = Math.hypot(x - handX, y - handY);
          if (d < HAND) hot += (HAND_LIFT - 1) * handOn * Math.pow(1 - d / HAND, 1.6);
        }

        const hush = quiet(x);
        const shown = sp.base * body * lift * flick * hot * hush;
        if (shown < 0.014) return;

        // THE BLOOM, AND IT IS WHAT COMES OFF OVER THE READING. A
        // speck's core is a pixel or two and costs a paragraph almost
        // nothing; the bloom is soft and fourteen times as wide, and
        // that is the thing that would wash out a line of text.
        //
        // IT IS CUBED, NOT CUT OFF. The first go simply refused to
        // draw a bloom anywhere `hush` was under 1, which stops it
        // dead at a line down the page you cannot see but can
        // absolutely tell is there — and on a 1440 window that line
        // is only 154px from each edge, so the bands glowed in two
        // narrow strips and were a grey dust everywhere else. Cubed,
        // the glow falls away as it comes in towards the column and
        // is gone long before the writing.
        const bloom = hush * hush * hush;
        if (shown > GLOW_FROM && bloom > 0.02) {
          const r = GLOW_WIDE * sp.size * (0.75 + 0.45 * (lift - 1));
          ink.globalAlpha = Math.min(GLOW_MOST, (shown - GLOW_FROM) * 0.75) * bloom;
          ink.drawImage(glow, x - r, y - r, r * 2, r * 2);
        }

        ink.globalAlpha = Math.min(1, shown);
        const s = Math.max(1, Math.round(sp.size));
        ink.fillRect(Math.round(x), Math.round(y), s, s);
      });
    });

    ink.globalAlpha = 1;
    ink.globalCompositeOperation = "source-over";
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => {
    handX = event.clientX;
    handY = event.clientY;
    if (REDUCE_MOTION) draw(window.scrollY, 0);
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
    draw(window.scrollY, 0);
    window.addEventListener("scroll", () => draw(window.scrollY, 0), { passive: true });
  } else {
    const began = performance.now();
    (function frame(now) {
      // The page grows as parts are opened, so the bands are asked to
      // grow with it — but only when it actually has.
      if (Math.abs(document.documentElement.scrollHeight - docTall) > 40) size();
      draw(window.scrollY, (now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
