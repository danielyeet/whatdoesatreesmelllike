// ============================================================
// THE SUN — the ground behind Chapter 1 of Favourites
//
// The owner: "The theme of chapter 1's page should be the sun; I want
// a 3D massive sun in the background made of particles and geometry
// that turns and has a character. I want it to have a glow too."
//
// So: a sphere far bigger than the window, drawn entirely in specks,
// turning on a tilted axis, with a corona round it and prominences
// leaping off its limb. Every part of it is a particle — the geometry
// as much as the surface — because a stroked line and a drawn speck do
// not sit together on a page like this one.
//
//   THE SURFACE   a few thousand specks on a Fibonacci sphere, the
//                 same arrangement the home page's node map stands its
//                 link nodes on: every point the same distance from
//                 its neighbours, which no hand-placed scatter is.
//   THE CHURN     what gives it a character rather than a texture. A
//                 slow three-way wave IN THE SPHERE'S OWN COORDINATES,
//                 so the bright and dark patches are ON the sun and
//                 turn with it instead of crawling across a disc.
//   THE GEOMETRY  three latitude rings and four meridians, in specks,
//                 turning with the sphere — the drawn globe under the
//                 fire — and one REGISTRATION RING standing round the
//                 whole of it, which does not turn, ticked like every
//                 other scale on this site.
//   THE PROMINENCES  arcs of specks that rise off the surface, bow out
//                 past the limb and come back down. Each on its own
//                 clock: one is always going up as another is falling.
//   THE CORONA    one soft gradient behind all of it, and a bloom on
//                 every speck bright enough to earn one.
//   THE WIND      added 2026-09-24, when the owner said the left of the
//                 page "looks empty": the solar wind — strands of warm
//                 specks leaving the sun and streaming away across the
//                 page to the left edge, each strand a gently bent line
//                 that the specks run along, so the empty side of the
//                 page is the side the wind is blowing towards.
//
// LEGIBILITY, WHICH THE OWNER ASKED FOR BY NAME: "I want it to make
// the text legible, so that particles exist in behind the text the
// same way they do in the page for ataraxia (house, SD), i think that
// is good." So it is done exactly that way, and the two numbers are
// the same two:
//
//   THE QUIET   a speck standing over the sheet is drawn at QUIET of
//               its strength, easing in over SOFT pixels outside it so
//               there is no edge where it starts.
//   THE BLOOM GOES FIRST. A speck's core is a pixel or two and costs a
//               paragraph almost nothing; what would wash one out is
//               the bloom round it, which is soft and fourteen times
//               as wide. It is scaled by the cube of the quiet, so it
//               is gone long before the specks are. The sun still
//               passes behind the words; it just stops glowing while
//               it does.
//
// WHERE IT IS REGISTERED: `window.CHAPTER_GROUNDS`, by name, and
// chamber.js starts it when a chapter whose markup says
// `data-ground="sun"` is written onto the page and stops it when
// another is. Nothing here knows anything about the chamber, and
// chamber.js knows nothing about what is drawn here.
//
// WITHOUT THIS SCRIPT a chapter's page is the plain black it always
// was, which is what every other chapter still gets.
// ============================================================
(function () {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 90217;

  // WHERE IT STANDS AND HOW BIG IT IS, and it is a composition rather
  // than a default: off to the right and a little high, with its right
  // side running off the edge of the window. Centred, it would be
  // behind the writing and nothing else; where it is, the reading
  // column is clear of it and the sphere still fills half the page.
  const AT_X = 0.8, AT_Y = 0.36;
  const BIG = 0.34;                // its radius, against the longer side

  const TILT = 0.34;               // the axis, leant over, in radians
  const SPIN = 0.058;              // radians a second — a turn takes about two minutes

  // HOW MANY SPECKS THE SURFACE IS. It is a big number and it has to
  // be: a sphere this size projects into a disc of well over a million
  // pixels, and three thousand specks in that is a scatter rather than
  // a surface — which is exactly how the first pass of this read, a
  // handful of flecks in the corner of the window. At fourteen thousand
  // they stand about a dozen pixels apart and the ball is a ball.
  const SURFACE = [14000, 5200];   // specks on the sphere: a desktop, a phone
  const SIZE = [0.7, 2.0];         // how big one is drawn, in pixels
  const BRIGHT = [0.34, 0.95];

  // THE FAR SIDE IS NOT DRAWN AWAY, it is drawn FAINT. Taking it off
  // altogether leaves a disc with a hard rim, which is a circle rather
  // than a ball; left at a fifth it reads as the atmosphere you can see
  // round the edge of one.
  const BEHIND = 0.2;

  const CHURN = 0.62;              // how far the surface varies about its own strength
  const CHURN_RATE = 0.115;        // and how fast that pattern moves over it
  const CHURN_SCALE = [5.1, 4.3, 6.2];

  const LIMB = 0.55;               // how much brighter the rim of the disc is drawn

  // THE GEOMETRY. Rings of specks rather than strokes: a drawn line and
  // a scattered speck do not sit together on this page.
  const LATS = [-0.52, 0, 0.52];   // where the latitude rings stand
  const LAT_DOTS = 220;
  const MERIDIANS = 4;
  const MER_DOTS = 190;
  const WIRE = 0.6;                // how brightly the geometry is drawn against the surface
  const WIRE_SIZE = 1.15;

  // THE REGISTRATION RING, which does not turn with the sun. It is the
  // same hollow, ticked scale the rest of the site measures things
  // with, laid round the sun at its own angle.
  const REG = 1.21;                // its radius, as a share of the sun's
  const REG_DOTS = 420;
  const REG_TICKS = 36;
  const REG_LIT = 0.42;

  // THE PROMINENCES. Each is an arc from one point on the surface to
  // another near it, bowed out past the limb and back.
  const ARCS = 5;
  const ARC_DOTS = 150;
  const ARC_FOOT = [0.32, 0.72];   // how far apart its two feet stand, in radians
  const ARC_HIGH = [0.16, 0.42];   // how far past the surface it reaches
  const ARC_SPREAD = 0.05;         // how far a speck may stray off the arc
  const ARC_LIFE = [7, 15];        // seconds it takes to rise and fall
  const ARC_WAIT = [4, 14];        // and how long the limb is quiet afterwards
  const ARC_LIT = 1.25;

  // A SPECK BRIGHTER THAN THIS IS ALSO GIVEN A BLOOM, and the number is
  // high on purpose: it is the only expensive draw in the file, and at
  // fourteen thousand specks a low threshold is fourteen thousand
  // gradients a frame. Set here, it is the rim of the disc and the hot
  // patches of the churn that glow, which is where a sun's light is.
  const GLOW_FROM = 0.78;
  const GLOW_WIDE = 14;            // the bloom's radius in pixels, at size 1
  const GLOW_MOST = 0.34;

  // THE CORONA — one gradient, laid down before anything else.
  const CORONA = 3;                // how far out it reaches, as a share of the sun
  const CORONA_LIT = 0.13;         // and the most of it that is ever laid down

  // THE WIND. So many strands, so many specks along them in all (a
  // desktop, a phone), how long a speck takes to cross the page, and
  // how far a strand bends up or down on its way.
  const WIND_STRANDS = 18;
  const WIND = [1100, 420];
  const WIND_CROSS = [16, 34];      // seconds, sun to the left edge
  const WIND_BEND = [0.04, 0.16];   // as a share of the window's height
  const WIND_LIT = 0.62;

  // THE TWO NUMBERS THE READING RESTS ON, and they are Ataraxia's own.
  const QUIET = 0.3;
  const SOFT = 74;

  // The colour. White at the core, falling to a warm white outward —
  // enough to read as a sun rather than as a moon, and nowhere near
  // the site's accent, which this page spends none of.
  const HOT = [255, 252, 244];
  const WARM = [255, 214, 150];

  window.CHAPTER_GROUNDS = window.CHAPTER_GROUNDS || {};

  /** THE BLOOM, DRAWN ONCE. A soft disc on its own little canvas, laid
      down scaled wherever a speck is bright enough to want one.
      Drawing a radial gradient per speck per frame is the same picture
      at a hundred times the cost. Built on the first sun asked for and
      kept, because a chapter can be stepped away from and back to. */
  let glow = null;
  function bloom() {
    if (glow) return glow;
    const SPRITE = 64;
    glow = document.createElement("canvas");
    glow.width = SPRITE;
    glow.height = SPRITE;
    const g = glow.getContext("2d");
    if (!g) return glow;
    const half = SPRITE / 2;
    const fade = g.createRadialGradient(half, half, 0, half, half, half);
    // Three stops rather than two: a straight ramp reads as a disc with
    // an edge, and what is wanted is a core that falls away.
    fade.addColorStop(0, "rgba(255, 246, 228, 0.9)");
    fade.addColorStop(0.28, "rgba(255, 226, 178, 0.32)");
    fade.addColorStop(1, "rgba(255, 210, 150, 0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, SPRITE, SPRITE);
    return glow;
  }

  window.CHAPTER_GROUNDS.sun = function (canvas, opts) {
    const ink = canvas.getContext("2d");
    if (!ink) return null;
    const column = (opts && opts.column) || (() => null);

    let seed = SEED;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const between = (a, b) => a + (b - a) * random();

    let width = 0, height = 0, ratio = 1;
    let surface = [], wires = [], reg = [], arcs = [], wind = [], strands = [];
    let built = 0;                  // how many surface specks the pool was built for
    let running = true;
    let frame = 0;
    let last = 0;
    let clock = 0;

    // ============================================================
    // BUILDING IT, ONCE
    //
    // All of it in the sphere's OWN coordinates — unit vectors about
    // its centre, before the tilt and before the turn. Nothing here
    // knows how big the window is, so nothing here is rebuilt when it
    // changes size: only how many surface specks there are depends on
    // the window, and that is a phone against a desktop rather than a
    // number that moves as you drag an edge.
    // ============================================================
    function build(many) {
      seed = SEED;
      built = many;
      surface = [];
      // A FIBONACCI SPHERE, the same arrangement the node map stands
      // its seven link nodes on: every point about as far from its
      // neighbours as every other, which a rolled scatter never is —
      // rolled, a sphere comes out in clumps and bald patches and reads
      // as a mistake rather than as a surface.
      const GOLD = Math.PI * (3 - Math.sqrt(5));
      for (let n = 0; n < many; n++) {
        const y = 1 - (n / Math.max(1, many - 1)) * 2;
        const ring = Math.sqrt(Math.max(0, 1 - y * y));
        const turn = n * GOLD;
        surface.push({
          x: Math.cos(turn) * ring,
          y: y,
          z: Math.sin(turn) * ring,
          size: between(SIZE[0], SIZE[1]),
          base: between(BRIGHT[0], BRIGHT[1]),
        });
      }

      // THE GEOMETRY: three latitude rings and four meridians, in
      // specks, turning with the sphere.
      wires = [];
      LATS.forEach((y) => {
        const ring = Math.sqrt(Math.max(0, 1 - y * y));
        for (let n = 0; n < LAT_DOTS; n++) {
          const a = (n / LAT_DOTS) * Math.PI * 2;
          wires.push({ x: Math.cos(a) * ring, y: y, z: Math.sin(a) * ring });
        }
      });
      for (let m = 0; m < MERIDIANS; m++) {
        const turn = (m / MERIDIANS) * Math.PI;
        const cos = Math.cos(turn), sin = Math.sin(turn);
        for (let n = 0; n < MER_DOTS; n++) {
          const a = (n / MER_DOTS) * Math.PI * 2;
          const px = Math.cos(a), py = Math.sin(a);
          wires.push({ x: px * cos, y: py, z: px * sin });
        }
      }

      // THE REGISTRATION RING, at its own angle and NOT turning with
      // the sun — so there is one thing in the drawing that holds still
      // while everything inside it moves, which is what makes the turn
      // readable at all.
      reg = [];
      for (let n = 0; n < REG_DOTS; n++) {
        const a = (n / REG_DOTS) * Math.PI * 2;
        const tick = (n % Math.round(REG_DOTS / REG_TICKS)) === 0;
        reg.push({
          x: Math.cos(a) * REG,
          y: Math.sin(a) * REG * 0.34,   // pressed flat onto its own plane
          z: Math.sin(a) * REG * 0.5,
          tick: tick,
        });
      }

      arcs = [];
      for (let n = 0; n < ARCS; n++) arcs.push(newArc(random() * -12));

      // THE WIND: strands leaving the sun at heights spread about its
      // middle, fanning out as they go, and specks strung along them
      // at every stage of the crossing, so the page is full from the
      // first frame rather than filling up.
      strands = [];
      for (let n = 0; n < WIND_STRANDS; n++) {
        strands.push({
          from: between(-0.75, 0.75),          // where it leaves the sun, up or down
          fan: between(-0.9, 0.9),             // how far it spreads by the left edge
          bend: between(WIND_BEND[0], WIND_BEND[1]) * (random() < 0.5 ? -1 : 1),
          waves: between(1.2, 3.2),
          phase: random() * Math.PI * 2,
        });
      }
      wind = [];
      const count = many === SURFACE[0] ? WIND[0] : WIND[1];
      for (let n = 0; n < count; n++) {
        wind.push({
          strand: Math.floor(random() * WIND_STRANDS),
          at: random(),
          cross: between(WIND_CROSS[0], WIND_CROSS[1]),
          off: (random() + random() - 1) * 7,
          size: between(0.6, 1.7),
          base: between(0.3, 1),
          flick: random() * Math.PI * 2,
        });
      }
    }

    /** ONE PROMINENCE: two feet on the surface and a bow between them.
        `at` is when it starts, which is rolled backwards for the ones
        built with the page so the limb is not empty for the first ten
        seconds and then all five at once. */
    function newArc(at) {
      // A foot anywhere on the sphere, and its partner a short way
      // round from it.
      const y = between(-0.85, 0.85);
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const a = random() * Math.PI * 2;
      const foot = between(ARC_FOOT[0], ARC_FOOT[1]);
      const b = a + foot;
      const dots = [];
      for (let n = 0; n < ARC_DOTS; n++) {
        dots.push({
          s: n / (ARC_DOTS - 1),
          off: (random() + random() - 1) * ARC_SPREAD,
          lift: (random() + random() - 1) * ARC_SPREAD,
          size: between(SIZE[0], SIZE[1] * 1.2),
          base: between(BRIGHT[0], BRIGHT[1]),
        });
      }
      return {
        y: y, ring: ring, a: a, b: b,
        high: between(ARC_HIGH[0], ARC_HIGH[1]),
        life: between(ARC_LIFE[0], ARC_LIFE[1]),
        wait: between(ARC_WAIT[0], ARC_WAIT[1]),
        at: at,
        dots: dots,
      };
    }

    // ============================================================
    // THE WINDOW
    // ============================================================
    function size() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // A PHONE DRAWS AT A LOWER RATIO — a little over half the fill,
      // and no difference anybody can see at that size. Nothing above
      // 700px changes at all.
      ratio = Math.min(w < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
      width = w;
      height = h;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ink.setTransform(ratio, 0, 0, ratio, 0, 0);
      const many = w < 700 ? SURFACE[1] : SURFACE[0];
      if (many !== built) build(many);
    }

    /** WHERE THE WRITING STANDS, READ ONCE A FRAME.
        It was read per speck for a round, which is fourteen thousand
        `getBoundingClientRect()` calls a frame — every one of them a
        question the browser has to settle the layout to answer. That
        alone took the page to fifteen frames a second. Nothing about
        the box can change between two specks of the same frame, so it
        is read here and handed down. */
    let box = null;
    let bLeft = 0, bRight = 0, bTop = 0, bBottom = 0, quieting = false;
    function readColumn() {
      box = column();
      quieting = Boolean(box);
      if (!box) return;
      bLeft = box.left; bRight = box.right;
      bTop = box.top; bBottom = box.bottom;
    }

    /** WHAT IS LEFT OF A SPECK STANDING OVER THE WRITING. The sheet's
        own box, eased over SOFT pixels outside it so there is no line
        on the page where the quiet begins. */
    function hush(x, y) {
      if (!quieting) return 1;
      const dx = bLeft - x > x - bRight ? bLeft - x : x - bRight;
      const dy = bTop - y > y - bBottom ? bTop - y : y - bBottom;
      const ax = dx > 0 ? dx : 0;
      const ay = dy > 0 ? dy : 0;
      if (ax >= SOFT || ay >= SOFT) {
        if (ax * ax + ay * ay >= SOFT * SOFT) return 1;
      }
      const d = Math.sqrt(ax * ax + ay * ay);
      if (d >= SOFT) return 1;
      const q = d / SOFT;
      // Eased at both ends, so the edge of the quiet is not a line
      // either — a straight ramp shows as one on a gradient this soft.
      return QUIET + (1 - QUIET) * (q * q * (3 - 2 * q));
    }

    /** THE COLOURS, MIXED ONCE. White at the core falling to a warm
        white outward, in a fixed number of steps — a colour built as a
        string per speck is fourteen thousand strings a frame, and the
        eye cannot tell twenty steps of this ramp from a thousand. */
    const TONES = 20;
    const tone = [];
    for (let n = 0; n < TONES; n++) {
      const mix = n / (TONES - 1);
      tone.push("rgb(" +
        Math.round(HOT[0] + (WARM[0] - HOT[0]) * mix) + "," +
        Math.round(HOT[1] + (WARM[1] - HOT[1]) * mix) + "," +
        Math.round(HOT[2] + (WARM[2] - HOT[2]) * mix) + ")");
    }
    let inked = -1;
    // THE SNAPSHOT, for the morph between chapters (chamber.js). While
    // it is an array every speck drawn is pushed on to it as five
    // numbers — where, how big, how bright, and which tone — and
    // `capture` draws one frame with it set and hands the lot over.
    let caught = null;

    // ============================================================
    // DRAWING IT
    // ============================================================
    /** One speck, at a place on the window, with its depth already
        worked out. `lit` is how brightly, before the quiet. */
    function speck(x, y, lit, wide, warm) {
      if (lit <= 0.006) return;
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
      const quiet = hush(x, y);
      const on = lit * quiet;
      if (on <= 0.006) return;
      // THE BLOOM GOES BEFORE THE SPECK DOES. Scaled by the cube of the
      // quiet, so it is gone well before the core is — the core costs a
      // paragraph nothing and the bloom is the whole of what would wash
      // one out.
      if (lit > GLOW_FROM) {
        const soft = quiet * quiet * quiet;
        if (soft > 0.03) {
          const rad = GLOW_WIDE * wide;
          ink.globalAlpha = Math.min(GLOW_MOST, (lit - GLOW_FROM) * 0.5) * soft;
          ink.drawImage(glow, x - rad, y - rad, rad * 2, rad * 2);
        }
      }
      let step = (warm * (TONES - 1)) | 0;
      if (step < 0) step = 0; else if (step > TONES - 1) step = TONES - 1;
      if (step !== inked) { ink.fillStyle = tone[step]; inked = step; }
      ink.globalAlpha = on < 1 ? on : 1;
      const s = wide > 0.6 ? wide : 0.6;
      ink.fillRect(x - s / 2, y - s / 2, s, s);
      // Kept, when asked for, as it is drawn: see `capture` below.
      if (caught) caught.push(x, y, s, on, step);
    }

    function draw(t) {
      const cx = width * AT_X;
      const cy = height * AT_Y;
      const R = Math.max(width, height) * BIG;

      readColumn();
      bloom();
      inked = -1;
      ink.setTransform(ratio, 0, 0, ratio, 0, 0);
      ink.clearRect(0, 0, width, height);
      ink.globalCompositeOperation = "lighter";

      // THE CORONA, laid down first and kept low: it is a gradient, so
      // it cannot be quietened speck by speck the way everything else
      // here is, and a gradient over a paragraph is the one thing that
      // would cost the reading something it cannot get back.
      const far = R * CORONA;
      const air = ink.createRadialGradient(cx, cy, R * 0.55, cx, cy, far);
      air.addColorStop(0, "rgba(255, 228, 182, " + CORONA_LIT.toFixed(3) + ")");
      air.addColorStop(0.35, "rgba(255, 206, 146, " + (CORONA_LIT * 0.42).toFixed(3) + ")");
      air.addColorStop(1, "rgba(255, 196, 132, 0)");
      ink.globalAlpha = 1;
      ink.fillStyle = air;
      ink.fillRect(cx - far, cy - far, far * 2, far * 2);

      const turn = t * SPIN;
      const cosT = Math.cos(turn), sinT = Math.sin(turn);
      const cosL = Math.cos(TILT), sinL = Math.sin(TILT);

      /** Sphere coordinates to the window: turned about the axis, then
          leant over, then laid flat. `z` comes back as how far towards
          the eye the point is, which is the whole of the depth here. */
      const put = (px, py, pz, out) => {
        // about the axis
        const ax = px * cosT + pz * sinT;
        const az = -px * sinT + pz * cosT;
        // and the axis itself, leant over
        const ay = py * cosL - az * sinL;
        const bz = py * sinL + az * cosL;
        out[0] = cx + ax * R;
        out[1] = cy + ay * R;
        out[2] = bz;
        return out;
      };
      const at = [0, 0, 0];

      // THE SURFACE
      const churn = t * CHURN_RATE;
      for (let n = 0; n < surface.length; n++) {
        const s = surface[n];
        put(s.x, s.y, s.z, at);
        const front = at[2] > 0;
        // THE CHURN, in the sphere's own coordinates, so the bright and
        // dark patches are ON the sun and turn with it. Three waves at
        // three rates: two make a grid you can see, three make weather.
        const cell =
          Math.sin(s.x * CHURN_SCALE[0] + churn) *
          Math.sin(s.y * CHURN_SCALE[1] - churn * 0.8) *
          Math.sin(s.z * CHURN_SCALE[2] + churn * 0.5);
        // THE RIM IS DRAWN BRIGHTER. The specks pile up against the
        // edge of the disc as the surface turns away from the eye, and
        // lifting them there is what gives the ball an edge without a
        // line being drawn anywhere.
        const round = Math.sqrt(Math.max(0, 1 - at[2] * at[2]));
        const lit = s.base * (1 + CHURN * cell) *
          (front ? 1 : BEHIND) * (1 + LIMB * round * round);
        speck(at[0], at[1], lit, s.size * (front ? 1 : 0.8), 0.35 + 0.45 * round);
      }

      // THE WIND, blowing to the left edge. A speck's place along its
      // strand is how far through its crossing it is; it brightens as it
      // gets clear of the sun's glare and fades out at the very edge.
      for (let n = 0; n < wind.length; n++) {
        const w = wind[n];
        const s = strands[w.strand];
        const p = (w.at + t / w.cross) % 1;
        const x0 = cx - R * 0.95;
        const x = x0 + (-24 - x0) * p;
        const lean = s.from * R * 0.8 + s.fan * height * 0.45 * p;
        const y = cy + lean + s.bend * height * Math.sin(p * Math.PI * s.waves + s.phase) + w.off * (0.4 + p);
        const up = p < 0.12 ? p / 0.12 : p > 0.9 ? (1 - p) / 0.1 : 1;
        const lit = w.base * WIND_LIT * up * (0.35 + 0.65 * p) * (0.8 + 0.2 * Math.sin(t * 3 + w.flick));
        speck(x, y, lit, w.size, 0.55 + 0.4 * p);
      }

      // THE GEOMETRY, turning with it
      for (let n = 0; n < wires.length; n++) {
        const w = wires[n];
        put(w.x, w.y, w.z, at);
        const front = at[2] > 0;
        speck(at[0], at[1], WIRE * (front ? 1 : BEHIND * 1.4), WIRE_SIZE, 0.15);
      }

      // THE REGISTRATION RING, which does not turn. Its own plane, laid
      // round the whole of the sun.
      for (let n = 0; n < reg.length; n++) {
        const r = reg[n];
        const x = cx + r.x * R;
        const y = cy + r.y * R;
        speck(x, y, REG_LIT * (r.tick ? 2.1 : 1), r.tick ? 2.2 : 1, 0);
      }

      // THE PROMINENCES
      for (let n = 0; n < arcs.length; n++) {
        const arc = arcs[n];
        const age = t - arc.at;
        if (age > arc.life + arc.wait) { arcs[n] = newArc(t); continue; }
        if (age < 0) continue;
        const p = Math.min(1, age / arc.life);
        // Up and down again, eased at both ends, so it rises out of the
        // surface rather than appearing above it.
        const up = Math.sin(Math.PI * p);
        const strength = up * up;
        if (strength < 0.01) continue;
        for (let d = 0; d < arc.dots.length; d++) {
          const dot = arc.dots[d];
          // The foot it leaves from, swung round to the foot it lands
          // on, and bowed out past the surface on the way.
          const a = arc.a + (arc.b - arc.a) * dot.s;
          const ring = arc.ring;
          const high = 1 + arc.high * Math.sin(Math.PI * dot.s) * up + dot.lift;
          const px = Math.cos(a) * ring * high;
          const pz = Math.sin(a) * ring * high;
          const py = (arc.y + dot.off) * high;
          put(px, py, pz, at);
          const front = at[2] > 0;
          speck(at[0], at[1],
            dot.base * ARC_LIT * strength * (front ? 1 : BEHIND * 2),
            dot.size, 0.8);
        }
      }

      ink.globalAlpha = 1;
      ink.globalCompositeOperation = "source-over";
    }

    // ============================================================
    // RUNNING
    // ============================================================
    let held = false;
    function tick(now) {
      if (!running) return;
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      // Held, it goes on drawing the same moment — see `hold` below.
      if (!held) clock += dt;
      draw(clock);
    }

    const again = () => { size(); if (REDUCE_MOTION) draw(0); };
    window.addEventListener("resize", again);

    size();
    if (REDUCE_MOTION) {
      // A STILL SUN. It is a drawing rather than a movement, so there
      // is a whole picture to stand still — the turn, the churn and the
      // prominences are simply read at one moment and left there.
      draw(0);
    } else {
      frame = requestAnimationFrame(tick);
    }

    return {
      /** Every speck of the frame as it stands now, as the chamber's
          morph wants them: a flat list of x, y, size, brightness and
          tone, and the tones themselves as rgb strings. */
      /** Held still at the moment it stands at, or let go again. The
          chamber holds a drawing while the morph flies into it, so the
          frame the specks land on is the frame that is shown when it
          comes up — it used to go on turning unseen for the whole
          flight, and what came up no longer matched where they landed. */
      hold: function (on) { held = !!on; },
      capture: function () {
        caught = [];
        draw(clock);
        const out = { specks: caught, tones: tone.slice() };
        caught = null;
        return out;
      },
      stop: function () {
        running = false;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        window.removeEventListener("resize", again);
        ink.setTransform(1, 0, 0, 1, 0, 0);
        ink.clearRect(0, 0, canvas.width, canvas.height);
      },
    };
  };
})();
