// ============================================================
// TALE PARFUMS — the doodles. houses/tale-parfums.html
//
// The owner's brief: "Design the page in a simple and very 'drawn by
// hand' way. I want it to be simple and almost childish. I want there
// to be handdrawn designs and such. you can use inspirations from the
// pictures that come with the number 2."
//
// The number-2 pictures are the drawings on the house's four labels,
// and those four are this page's EMBLEMS, drawn again here in a pen
// line rather than copied:
//
//   THE LILY      six pointed petals with an EYE where the heart of
//                 the flower should be — Bad Lily
//   THE SWEET     a heart pressed into a square sweet on a stick —
//                 Fleurt
//   THE ROSE      a rose on a thorny stem with two leaves — Rouse
//   THE SPROUT    a plant in a pot, its roots showing through — Water
//                 Me
//
// and round them the small things a person doodles in the margin of
// their notes: stars, a crescent moon (Bad Lily is "lit up by the
// moonlight"), drops (its "morning dew", and Water Me's "after the
// rain"), a little sun, a heart, a swirl, a cloud raining, a sparkle,
// a flower, a leaf.
//
// HOW A LINE IS MADE TO LOOK DRAWN. Every doodle is a handful of
// strokes through points in a 100 × 100 box. Each point is nudged a
// little off true and the stroke is drawn as a smooth curve through
// them, so no line is straight and no circle closes quite where it
// began. The pen is the same width at every size — a big lily is not
// drawn with a fatter pen than a small star.
//
// AND THE COLOUR IS COLOURED IN, NOT FILLED. The two colours are the
// labels' own — the pale green of the lily's eye and the peach of the
// heart — and each is laid a little off the line that holds it, the
// way a crayon never quite stays inside the lines.
//
// WHAT IT DOES, in time:
//
//   IT DRAWS ITSELF IN.  A doodle is drawn stroke by stroke the first
//                        time it comes into view, as a pen would.
//   IT BOILS.            Bring the pointer near one and its line is
//                        redrawn a few times a second, each time a
//                        little differently — which is how a drawing
//                        moves in hand-drawn animation, where every
//                        frame is drawn again. Take the pointer away
//                        and it holds still.
//
// WHERE THEY STAND. The margins either side of the writing, all the
// way down the page, anchored to the page rather than the window:
// they are drawn ON the paper and scroll with it. On a window with no
// margins to speak of — a phone, a narrow laptop — there is only the
// lily at the head of the page, which is where the house's mark
// belongs anyway.
//
// IT ALSO BRINGS THE PAGE IN — see THE ENTRANCE below.
//
// WITHOUT THIS SCRIPT the page is all of its writing, and everything
// else that looks drawn — the pictures' corners, tilt and tape, the
// loops round the numbers — is the stylesheet's and is still there.
// ============================================================
(function () {
  const page = document.querySelector(".tale-page");
  if (!page) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG = "http://www.w3.org/2000/svg";

  // ============================================================
  // TUNING
  // ============================================================
  const INK = "#1f1d18";
  const GREEN = "#cddcaa";        // the lily's eye, off Bad Lily's label
  const PEACH = "#efb392";        // the heart, off Fleurt's label
  const PEN = 1.9;                // the pen, in screen pixels, at any size
  const WOBBLE = 1.7;             // how far a point may stray, in box units
  const BOIL_EVERY = 140;         // ms between two drawings of a boiling doodle
  const BOIL_NEAR = 170;          // how near the pointer has to be, in px
  const DRAW_MS = 1100;           // drawing one doodle in
  const COLUMN = 940;             // the writing's measure, as in style.css
  const ROOM_AT_LEAST = 78;       // a margin narrower than this gets nothing

  // ============================================================
  // A SEEDED HAND. Every doodle is drawn from its own seed, so the
  // page lays out the same way every time it is opened and a doodle
  // redrawn after a resize is the same doodle.
  // ============================================================
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ============================================================
  // SHAPES, as points in a 100 × 100 box
  // ============================================================
  const TAU = Math.PI * 2;

  /** A round thing drawn by a hand: it runs a little past where it
      started, so the join shows. */
  function ring(cx, cy, rx, ry, n, over, from) {
    const pts = [];
    const start = from || 0;
    const sweep = TAU * (1 + (over || 0.06));
    for (let i = 0; i <= n; i++) {
      const a = start + (sweep * i) / n;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  /** A pointed leaf or petal from one point to another, `wide` across
      at its widest. */
  function leaf(x1, y1, x2, y2, wide) {
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const at = (t, w) => [x1 + dx * t + nx * w, y1 + dy * t + ny * w];
    return [
      at(0, 0), at(0.25, wide * 0.75), at(0.55, wide), at(0.82, wide * 0.6), at(1, 0),
      at(0.82, -wide * 0.6), at(0.55, -wide), at(0.25, -wide * 0.75), at(0, 0),
    ];
  }

  function heartPts(cx, cy, s) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = (TAU * i) / 24;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([cx + (x * s) / 16, cy - (y * s) / 16]);
    }
    return pts;
  }

  function starPts(cx, cy, r, inner, n) {
    const pts = [];
    for (let i = 0; i <= n * 2; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / n;
      const rr = i % 2 ? r * inner : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }

  function spiral(cx, cy, r, turns, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * turns * TAU;
      pts.push([cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t]);
    }
    return pts;
  }

  /** A stroke: points, and whether it is filled with the paper (so it
      covers what is under it) or coloured in. */
  const S = (pts, extra) => Object.assign({ pts: pts }, extra || {});

  const DOODLES = {
    // ---------------------------------------------------- the emblems
    lily() {
      const out = [S([[50, 58], [47, 72], [45, 86], [47, 98]])];
      out.push(S(leaf(47, 86, 72, 70, 7), { paper: true }));
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 6 + 0.2;
        out.push(S(leaf(50 + Math.cos(a) * 6, 40 + Math.sin(a) * 6,
          50 + Math.cos(a) * 45, 40 + Math.sin(a) * 42, 11), { paper: true }));
      }
      // THE EYE, where the flower's heart should be.
      out.push(S([[33, 40], [41, 33], [50, 31], [59, 33], [67, 40], [59, 47], [50, 49], [41, 47], [33, 40]], { paper: true }));
      out.push(S(ring(50, 40, 7.5, 7.5, 12, 0.02), { colour: GREEN }));
      out.push(S(ring(50, 40, 2.6, 2.6, 8, 0), { ink: true }));
      // lashes
      out.push(S([[41, 32], [39, 27]]), S([[50, 30], [50, 25]]), S([[59, 32], [61, 27]]));
      return out;
    },
    sweet() {
      const out = [];
      out.push(S([[50, 62], [51, 80], [50, 99]]));
      out.push(S([[48, 62], [49, 80], [48, 99]]));
      out.push(S([[22, 16], [50, 12], [78, 15], [82, 38], [80, 62], [50, 66], [20, 63], [18, 40], [22, 16]], { paper: true }));
      out.push(S(heartPts(50, 38, 19), { colour: PEACH }));
      for (let i = 0; i < 7; i++) {
        const x = 26 + ((i * 37) % 50), y = 20 + ((i * 23) % 40);
        out.push(S([[x, y], [x + 1.2, y + 0.8]]));
      }
      return out;
    },
    rose() {
      const out = [];
      out.push(S([[55, 44], [53, 62], [50, 80], [49, 99]]));
      out.push(S([[53, 60], [49, 57], [53, 55]]), S([[50, 76], [55, 74], [50, 71]]), S([[50, 88], [45, 86], [50, 83]]));
      out.push(S(leaf(52, 66, 28, 58, 8), { paper: true }));
      out.push(S(leaf(50, 82, 74, 74, 7.5), { paper: true }));
      out.push(S([[34, 24], [36, 38], [46, 46], [55, 47], [65, 45], [74, 37], [76, 23]], { paper: true }));
      out.push(S([[36, 26], [44, 16], [55, 13], [67, 16], [75, 25]]));
      out.push(S(spiral(55, 26, 15, 2.1, 30), { colour: PEACH }));
      return out;
    },
    sprout() {
      const out = [];
      out.push(S([[50, 66], [49, 50], [51, 34], [50, 18]]));
      [[50, 55, 28, 48], [50, 48, 72, 40], [50, 38, 30, 30], [51, 30, 70, 22], [50, 20, 48, 6]].forEach((l) =>
        out.push(S(leaf(l[0], l[1], l[2], l[3], 6.5), { paper: true })));
      out.push(S([[30, 72], [70, 72], [65, 98], [35, 98], [30, 72]], { paper: true }));
      out.push(S([[26, 64], [74, 64], [74, 72], [26, 72], [26, 64]], { paper: true }));
      // the roots, showing through the pot as they do on the label
      out.push(S([[50, 74], [46, 80], [49, 86], [44, 93]]));
      out.push(S([[50, 74], [55, 82], [52, 88], [57, 94]]));
      out.push(S([[48, 78], [41, 83], [40, 90]]));
      return out;
    },
    // ---------------------------------------------------- the small ones
    star() { return [S(starPts(50, 52, 40, 0.45, 5))]; },
    moon() {
      const outer = [], inner = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI * 0.35 + (Math.PI * 1.3 * i) / 14;
        outer.push([50 + Math.cos(a) * 34, 50 + Math.sin(a) * 34]);
      }
      for (let i = 14; i >= 0; i--) {
        const a = Math.PI * 0.45 + (Math.PI * 1.1 * i) / 14;
        inner.push([62 + Math.cos(a) * 28, 50 + Math.sin(a) * 28]);
      }
      return [S(outer.concat(inner, [outer[0]]))];
    },
    drop() {
      return [S([[50, 12], [60, 32], [70, 52], [68, 72], [50, 86], [32, 72], [30, 52], [40, 32], [50, 12]]),
        S([[40, 60], [41, 70], [47, 76]])];
    },
    sun() {
      const out = [S(ring(50, 50, 18, 18, 14))];
      for (let i = 0; i < 9; i++) {
        const a = (i * TAU) / 9 + 0.2;
        out.push(S([[50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26], [50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40]]));
      }
      return out;
    },
    heart() { return [S(heartPts(50, 50, 34), { colour: PEACH })]; },
    swirl() { return [S(spiral(50, 50, 38, 2.6, 40))]; },
    cloud() {
      const out = [S([[20, 52], [16, 40], [26, 30], [38, 32], [44, 20], [60, 18], [68, 30], [80, 30], [86, 42], [80, 54], [20, 52]])];
      for (let i = 0; i < 4; i++) out.push(S([[28 + i * 15, 62], [24 + i * 15, 76]]));
      return out;
    },
    sparkle() { return [S(starPts(50, 50, 38, 0.18, 4))]; },
    flower() {
      const out = [S([[50, 58], [52, 76], [50, 96]])];
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5 - Math.PI / 2;
        out.push(S(ring(50 + Math.cos(a) * 14, 38 + Math.sin(a) * 14, 10, 10, 10, 0.04), { paper: true }));
      }
      out.push(S(ring(50, 38, 6, 6, 10, 0.02), { colour: GREEN }));
      return out;
    },
    sprig() { return [S(leaf(22, 80, 80, 20, 14), { paper: true }), S([[24, 78], [50, 51], [76, 24]])]; },
  };

  const EMBLEMS = ["lily", "sweet", "rose", "sprout"];
  const SMALL = ["star", "moon", "drop", "sun", "heart", "swirl", "cloud", "sparkle", "flower", "sprig", "star", "drop", "sparkle"];

  // ============================================================
  // DRAWING A STROKE BY HAND
  // ============================================================
  /** Nudge every point a little, then draw one smooth curve through
      them (Catmull-Rom, written out as cubic Béziers). */
  function hand(pts, rand, amp) {
    const p = pts.map((q) => [q[0] + (rand() - 0.5) * 2 * amp, q[1] + (rand() - 0.5) * 2 * amp]);
    if (p.length === 2) {
      const m = [(p[0][0] + p[1][0]) / 2 + (rand() - 0.5) * amp, (p[0][1] + p[1][1]) / 2 + (rand() - 0.5) * amp];
      return "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1) +
        "Q" + m[0].toFixed(1) + " " + m[1].toFixed(1) + " " + p[1][0].toFixed(1) + " " + p[1][1].toFixed(1);
    }
    let d = "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += "C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) +
        " " + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) +
        " " + c[0].toFixed(1) + " " + c[1].toFixed(1);
    }
    return d;
  }

  const FRAMES = 3;   // how many different drawings a boiling doodle has

  /** One doodle, built as an <svg>: every stroke drawn FRAMES times,
      the first of them shown. */
  function build(kind, seed, size) {
    const rand = rng(seed);
    const strokes = DOODLES[kind]();
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "-6 -6 112 112");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.classList.add("tale-doodle");
    svg.dataset.kind = kind;
    const paths = [];
    strokes.forEach((stroke, n) => {
      const frames = [];
      for (let f = 0; f < FRAMES; f++) frames.push(hand(stroke.pts, rand, WOBBLE));
      // COLOURED IN, a little off the line: a crayon rather than a fill.
      if (stroke.colour) {
        const off = [(rand() - 0.5) * 7, (rand() - 0.5) * 7];
        const tint = document.createElementNS(SVG, "path");
        tint.setAttribute("d", hand(stroke.pts.map((q) => [q[0] + off[0], q[1] + off[1]]), rand, WOBBLE * 1.4));
        tint.setAttribute("fill", stroke.colour);
        tint.setAttribute("stroke", "none");
        tint.classList.add("tale-tint");
        svg.appendChild(tint);
      }
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", frames[0]);
      path.setAttribute("fill", stroke.ink ? INK : "none");
      // The paper, so a petal hides the stem behind it. Through `style`
      // because a presentation attribute cannot read a custom property.
      if (stroke.paper) path.style.fill = "var(--bg)";
      path.setAttribute("stroke", INK);
      // THE SAME PEN AT EVERY SIZE, worked out rather than asked of the
      // browser: `vector-effect: non-scaling-stroke` does the same thing
      // and also throws off the dash each stroke is drawn in with, which
      // left the big lily's petals open.
      path.setAttribute("stroke-width", (PEN * 112 / size).toFixed(3));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      // So every stroke can be drawn in over the same clock, whatever
      // its length: the whole of it is "1".
      path.setAttribute("pathLength", "1");
      path.style.setProperty("--n", n);
      path.__frames = frames;
      svg.appendChild(path);
      paths.push(path);
    });
    svg.__paths = paths;
    svg.__frame = 0;
    return svg;
  }

  // ============================================================
  // THE ENTRANCE
  //
  // The page is held back from its first paint (`tale-coming`, set in
  // its own <head>) until its faces are in, and then brought in piece by
  // piece. The owner saw it "randomly flick into the handwritten ...
  // page" and asked for it animated in instead; the handwriting itself
  // was taken off a round later, and the way in stayed.
  //
  // The doodles wait for it too: `entered` is what `show` waits on, so
  // nothing starts drawing itself on a page nobody can see yet.
  // ============================================================
  const ENTER_STEP = 130;      // ms between one piece coming in and the next
  const FACES_AT_MOST = 1500;  // never wait longer than this for the faces

  // The page is set in the site's own faces now (the handwriting faces
  // were taken off at the owner's word), and it still waits for them,
  // so it never comes in in a stand-in face and changes as it arrives.
  const facesIn = new Promise((done) => {
    window.setTimeout(done, FACES_AT_MOST);
    if (!document.fonts || !document.fonts.ready) { done(); return; }
    document.fonts.ready.then(done, done);
  });

  const entered = facesIn.then(() => new Promise((done) => {
    const root = document.documentElement;
    if (REDUCE_MOTION) { root.classList.remove("tale-coming"); done(); return; }
    const pieces = [
      ...document.querySelectorAll(".human-head > *"),
      document.querySelector(".human-intro"),
      document.querySelector(".human-parts"),
      document.querySelector(".house-credit"),
      document.querySelector(".human-foot"),
    ].filter(Boolean);
    // The fixed chrome and the doodles' layer only fade: the chrome is
    // placed with a transform of its own, and the layer spans the page.
    const fades = [...document.querySelectorAll(".human-rank, .human-readout, .tale-doodles")];
    pieces.forEach((el) => el.classList.add("tale-enter"));
    fades.forEach((el) => el.classList.add("tale-enter-fade"));
    root.classList.remove("tale-coming");
    // A frame for the browser to take them as hidden, then in they come.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pieces.forEach((el, n) => {
        el.style.transitionDelay = (n * ENTER_STEP) + "ms";
        el.classList.add("tale-entered");
      });
      fades.forEach((el) => {
        el.style.transitionDelay = (2 * ENTER_STEP) + "ms";
        el.classList.add("tale-entered");
      });
      const end = (pieces.length + 1) * ENTER_STEP + 1000;
      window.setTimeout(() => {
        // Taken off again once it is over, so nothing is left holding a
        // transition or a delay that the page's own rules did not ask for.
        [...pieces, ...fades].forEach((el) => {
          el.classList.remove("tale-enter", "tale-enter-fade", "tale-entered");
          el.style.transitionDelay = "";
        });
      }, end);
      // The doodles start drawing as the head arrives, not after the foot.
      window.setTimeout(done, 3 * ENTER_STEP);
    }));
  }));

  // ============================================================
  // DRAWN IN AS THEY ARRIVE
  // ============================================================
  const watcher = !REDUCE_MOTION && "IntersectionObserver" in window
    ? new IntersectionObserver((seen) => {
        seen.forEach((one) => {
          if (!one.isIntersecting) return;
          watcher.unobserve(one.target);
          drawIn(one.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.2 })
    : null;

  function drawIn(svg) {
    svg.classList.add("tale-drawn");
  }

  function show(svg) {
    if (watcher) {
      svg.classList.add("tale-to-draw");
      svg.style.setProperty("--draw", DRAW_MS + "ms");
      entered.then(() => watcher.observe(svg));
    } else {
      svg.classList.add("tale-drawn");
    }
  }

  // ============================================================
  // THE HEAD: the house's mark, the lily, with a few stars round it.
  // ============================================================
  const head = document.querySelector(".tale-head-doodle");
  if (head) {
    const lily = build("lily", 7, 170);
    lily.classList.add("tale-mark");
    head.appendChild(lily);
    show(lily);
    [["star", 11, "tale-by-1"], ["sparkle", 12, "tale-by-2"], ["star", 13, "tale-by-3"]].forEach((one) => {
      const small = build(one[0], one[1], 30);
      small.classList.add("tale-by", one[2]);
      head.appendChild(small);
      show(small);
    });
  }

  // ============================================================
  // THE MARGINS
  // ============================================================
  const layer = document.createElement("div");
  layer.className = "tale-doodles";
  layer.setAttribute("aria-hidden", "true");
  page.insertBefore(layer, page.firstChild);

  let laidFor = -1;        // the width the margins were laid out for
  let reached = 0;         // how far down the page they have been laid
  let placed = [];         // { svg, x, y, size }

  /** How much room there is either side of the writing. */
  function margin() {
    return (window.innerWidth - COLUMN) / 2 + 36;
  }

  function lay() {
    const wide = window.innerWidth;
    if (wide !== laidFor) {
      layer.innerHTML = "";
      placed = [];
      reached = 0;
      laidFor = wide;
    }
    const room = margin();
    // Measured with the layer folded away first: measured with it in,
    // the page is at least as tall as the layer, and the layer is as
    // tall as the page was — so it could grow and never shrink.
    layer.style.height = "0px";
    const tall = document.documentElement.scrollHeight;
    layer.style.height = tall + "px";
    placed.forEach((one) => { one.svg.style.display = one.y + one.size > tall - 40 ? "none" : ""; });
    if (room < ROOM_AT_LEAST) return;

    // WALK DOWN THE PAGE, a doodle every so often, on alternating sides
    // with the odd one on the same side twice — a hand that went back
    // and forth every time would be a pattern rather than a hand.
    const rand = rng(1901 + Math.round(wide / 40));
    // The seeded hand is walked from the top every time, so the part of
    // the page that was already laid out comes out the same.
    // Starting under the head, which has the lily of its own.
    const intro = document.querySelector(".human-intro");
    let y = intro ? intro.getBoundingClientRect().top + window.scrollY + 40 : 520;
    let side = 1;
    let n = 1;
    let emblems = 0;
    while (y < tall - 160) {
      // Every other doodle is an emblem until the three that are not at
      // the head have all been drawn, and every third after that — so
      // all four are on the page however short it is. (Set in the
      // site's own face the page is shorter than it was in the
      // handwriting, and the sprout, which used to be the ninth, fell
      // off the foot.)
      const emblem = emblems < 3 ? n % 2 === 0 : n % 3 === 0;
      const kind = emblem ? EMBLEMS[(emblems + 1) % EMBLEMS.length] : SMALL[Math.floor(rand() * SMALL.length)];
      if (emblem) emblems += 1;
      const most = Math.min(room - 30, emblem ? 150 : 66);
      const size = Math.max(34, emblem ? most * (0.82 + rand() * 0.18) : most * (0.55 + rand() * 0.45));
      if (rand() < 0.78) side = -side;
      const x = side < 0
        ? 18 + rand() * Math.max(0, room - size - 36)
        : wide - room + 18 + rand() * Math.max(0, room - size - 36);
      const tilt = (rand() - 0.5) * 24;
      const seed = 3000 + n;
      if (y >= reached) {
        const svg = build(kind, seed, Math.round(size));
        svg.style.left = Math.round(x) + "px";
        svg.style.top = Math.round(y) + "px";
        svg.style.transform = "rotate(" + tilt.toFixed(1) + "deg)";
        layer.appendChild(svg);
        placed.push({ svg: svg, x: x, y: y, size: size });
        show(svg);
      }
      y += size + 70 + rand() * 150;
      n += 1;
    }
    reached = Math.max(reached, y);
  }

  lay();
  // THE PAGE GROWS as a fragrance is opened and shrinks as it is shut,
  // so the margins are laid again whenever its height changes — new
  // doodles further down, and the ones past the foot put away.
  let pending = 0;
  const again = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; lay(); });
  };
  if ("ResizeObserver" in window) new ResizeObserver(again).observe(document.body);
  window.addEventListener("resize", again);

  // ============================================================
  // THE BOIL
  // ============================================================
  if (REDUCE_MOTION) return;

  let px = -1e4, py = -1e4;
  let boiling = [];
  let timer = 0;

  function everyDoodle() {
    return [...document.querySelectorAll(".tale-doodle.tale-done")];
  }

  function near() {
    return everyDoodle().filter((svg) => {
      const box = svg.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      return Math.hypot(cx - px, cy - py) < BOIL_NEAR + box.width / 2;
    });
  }

  function tick() {
    boiling = near();
    if (!boiling.length) { clearInterval(timer); timer = 0; return; }
    boiling.forEach((svg) => {
      svg.__frame = (svg.__frame + 1) % FRAMES;
      svg.__paths.forEach((path) => path.setAttribute("d", path.__frames[svg.__frame]));
    });
  }

  function feel(event) {
    px = event.clientX;
    py = event.clientY;
    if (!timer && near().length) timer = setInterval(tick, BOIL_EVERY);
  }
  window.addEventListener("pointermove", feel, { passive: true });
  // There is no hovering on a phone: a tap is the hand arriving.
  window.addEventListener("pointerdown", feel, { passive: true });

  // A doodle only boils once it has finished drawing itself in: the
  // drawing-in and the boil are two different hands.
  document.addEventListener("transitionend", (event) => {
    const svg = event.target.closest && event.target.closest(".tale-doodle");
    if (svg) svg.classList.add("tale-done");
  });
  document.querySelectorAll(".tale-doodle:not(.tale-to-draw)").forEach((svg) => svg.classList.add("tale-done"));
})();
