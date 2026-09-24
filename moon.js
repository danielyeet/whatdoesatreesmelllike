// ============================================================
// THE MOON — the ground behind Chapter 2 of Favourites
//
// The owner, 2026-09-24: "make chapter 2 from favorites have a moon
// spin the same way that the sun is spinning. Make it complex and look
// cool please" — and, for both chapters, "put some particles on the
// left hand side of the page, it looks empty".
//
// So it is the sun's own construction, turned to night. The same
// Fibonacci sphere of specks, on the SAME TILT turning the SAME WAY at
// the same rate (TILT and SPIN are the sun's numbers), standing in the
// same place — so stepping from Chapter 1 to Chapter 2 with the arrows
// swaps one body for another in the same sky. What it has that the sun
// does not:
//
//   THE LIGHT     a moon is lit, not lit up. One side is bright and the
//                 other is in shadow, with a soft TERMINATOR between
//                 them, and the light swings slowly across it — THE
//                 PHASES, full to a thick crescent and back in about a
//                 minute and a half (never to a new moon, which would be
//                 a black page for a quarter of the time). The dark
//                 side is not black: it keeps a faint EARTHSHINE, which
//                 is what keeps it a ball rather than a crescent.
//   THE CRATERS   rings of specks on the surface, each with a bright
//                 rim, a darker floor and a little peak in the middle,
//                 and some with RAYS thrown out across the surface.
//                 In the sphere's own coordinates, so they turn with it
//                 and ride over the limb like the real thing.
//   THE MARIA     the dark seas: broad low patches, fixed on the
//                 surface rather than churning, because the moon's face
//                 does not change and that is the point of it.
//   THE GEOMETRY  the sun's rings and meridians, the same count, so the
//                 two drawings are plainly one family.
//   THE RING      a thin tilted belt of debris orbiting it, turning
//                 faster than it does, passing in front of the disc on
//                 one side and behind it on the other.
//   THE REGISTRATION RING, which does not turn — the sun's, the site's.
//   THE SKY       down the LEFT of the page, where the owner saw
//                 nothing: a field of stars at three depths, each
//                 twinkling on its own clock, with dust drifting through
//                 it and now and then a shooting star.
//
// LEGIBILITY is the sun's (and Ataraxia's): a speck over the writing is
// drawn at QUIET of its strength, eased in over SOFT pixels, and its
// bloom goes first.
//
// Registered on `window.CHAPTER_GROUNDS` as "moon"; chamber.js starts it
// for a chapter whose block says `data-ground="moon"`.
// ============================================================
(function () {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 51023;

  // Where it stands: where the sun stands, so the two chapters are one
  // sky. A little smaller than the sun, as a moon should be.
  const AT_X = 0.8, AT_Y = 0.38;
  const BIG = 0.29;

  // THE SUN'S OWN NUMBERS — the owner asked for it to spin the same way.
  const TILT = 0.34;
  const SPIN = 0.058;

  const SURFACE = [13000, 5000];
  const SIZE = [0.7, 1.9];
  const BRIGHT = [0.5, 1.05];
  const BEHIND = 0.16;

  // THE LIGHT. Where it comes from goes round the moon once in PHASE
  // seconds; the dark side keeps EARTHSHINE of its strength, and the
  // terminator is SOFT wide (as a share of the radius).
  const PHASE = 96;
  const EARTHSHINE = 0.16;
  const TERMINATOR = 0.22;

  // THE CRATERS
  const CRATERS = 46;
  const CRATER_R = [0.04, 0.2];     // radius, in radians of arc on the sphere
  const CRATER_RAYED = 0.18;        // how many of them throw rays
  const RIM_DOTS = 70;
  const RAYS = 9;
  const RAY_DOTS = 26;

  // THE MARIA — broad, dark, fixed.
  const MARIA = [
    { x: 0.5, y: 0.35, z: 0.79, r: 0.55 },
    { x: -0.3, y: 0.2, z: 0.93, r: 0.42 },
    { x: 0.2, y: -0.45, z: 0.87, r: 0.38 },
    { x: -0.7, y: -0.2, z: -0.68, r: 0.5 },
    { x: 0.6, y: -0.1, z: -0.79, r: 0.36 },
  ];
  const MARE_DARK = 0.34;

  const LATS = [-0.52, 0, 0.52];
  const LAT_DOTS = 200;
  const MERIDIANS = 4;
  const MER_DOTS = 170;
  const WIRE = 0.42;
  const WIRE_SIZE = 1.1;

  const REG = 1.24;
  const REG_DOTS = 420;
  const REG_TICKS = 36;
  const REG_LIT = 0.4;

  // THE RING OF DEBRIS
  const RING_DOTS = 2200;
  const RING_R = [1.42, 1.78];
  const RING_TILT = 0.42;           // leant further over than the moon
  const RING_TURN = 0.13;           // radians a second — faster than the moon
  const RING_LIT = 0.8;

  // THE SKY, down the left
  const STARS = [620, 260];
  const STAR_REACH = 0.52;          // how far across the window they thin out to
  const DUST = [160, 60];
  const SHOOT_EVERY = [5, 11];      // seconds between shooting stars

  const GLOW_FROM = 0.8;
  const GLOW_WIDE = 12;
  const GLOW_MOST = 0.3;

  const HALO = 2.4;
  const HALO_LIT = 0.09;

  const QUIET = 0.3;
  const SOFT = 74;

  // Cold silver at the lit core, falling to a blue-grey outward.
  const COLD = [236, 241, 250];
  const BLUE = [150, 168, 200];

  window.CHAPTER_GROUNDS = window.CHAPTER_GROUNDS || {};

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
    fade.addColorStop(0, "rgba(236, 242, 255, 0.9)");
    fade.addColorStop(0.3, "rgba(190, 206, 236, 0.3)");
    fade.addColorStop(1, "rgba(160, 180, 220, 0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, SPRITE, SPRITE);
    return glow;
  }

  window.CHAPTER_GROUNDS.moon = function (canvas, opts) {
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
    let surface = [], wires = [], reg = [], ring = [], craterDots = [], stars = [], dust = [];
    let built = 0;
    let running = true;
    let frame = 0, last = 0, clock = 0;
    let shooting = null, nextShot = 3;

    // ============================================================
    // BUILDING IT, ONCE — in the sphere's own coordinates
    // ============================================================
    function unitAt(lat, lon) {
      const c = Math.cos(lat);
      return { x: c * Math.cos(lon), y: Math.sin(lat), z: c * Math.sin(lon) };
    }
    /** A point `d` radians of arc from `o`, in the direction `a` round
        it — how a crater's rim and its rays are laid on the sphere. */
    function around(o, d, a) {
      // Two directions at right angles to o.
      let ux = -o.z, uy = 0, uz = o.x;
      let ul = Math.hypot(ux, uy, uz);
      if (ul < 1e-4) { ux = 1; uy = 0; uz = 0; ul = 1; }
      ux /= ul; uy /= ul; uz /= ul;
      const vx = o.y * uz - o.z * uy, vy = o.z * ux - o.x * uz, vz = o.x * uy - o.y * ux;
      const cd = Math.cos(d), sd = Math.sin(d), ca = Math.cos(a), sa = Math.sin(a);
      return {
        x: o.x * cd + (ux * ca + vx * sa) * sd,
        y: o.y * cd + (uy * ca + vy * sa) * sd,
        z: o.z * cd + (uz * ca + vz * sa) * sd,
      };
    }
    const dot3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

    let craters = [];
    function build(many, sky) {
      seed = SEED;
      built = many;

      craters = [];
      for (let n = 0; n < CRATERS; n++) {
        const o = unitAt(Math.asin(between(-0.95, 0.95)), random() * Math.PI * 2);
        craters.push({ o, r: Math.pow(random(), 1.8) * (CRATER_R[1] - CRATER_R[0]) + CRATER_R[0], rayed: random() < CRATER_RAYED });
      }
      const maria = MARIA.map((m) => {
        const l = Math.hypot(m.x, m.y, m.z);
        return { x: m.x / l, y: m.y / l, z: m.z / l, r: m.r };
      });

      // THE SURFACE: a Fibonacci sphere, each speck told how dark the
      // ground it stands on is — in a sea, in a crater's floor, on a rim.
      surface = [];
      const GOLD = Math.PI * (3 - Math.sqrt(5));
      for (let n = 0; n < many; n++) {
        const y = 1 - (n / Math.max(1, many - 1)) * 2;
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        const t = n * GOLD;
        const p = { x: Math.cos(t) * rr, y, z: Math.sin(t) * rr };
        let albedo = 1;
        maria.forEach((m) => {
          const d = Math.acos(Math.max(-1, Math.min(1, dot3(p, m))));
          if (d < m.r) albedo *= 1 - MARE_DARK * Math.pow(1 - d / m.r, 0.7);
        });
        craters.forEach((c) => {
          const d = Math.acos(Math.max(-1, Math.min(1, dot3(p, c.o))));
          if (d < c.r * 0.85) albedo *= 0.62 + 0.3 * (d / c.r);
          else if (d < c.r * 1.15) albedo *= 1.35;
        });
        surface.push({ x: p.x, y: p.y, z: p.z, size: between(SIZE[0], SIZE[1]), base: between(BRIGHT[0], BRIGHT[1]) * albedo });
      }

      // THE CRATERS' OWN SPECKS: a rim, a central peak, and rays.
      craterDots = [];
      craters.forEach((c) => {
        for (let k = 0; k < RIM_DOTS; k++) {
          const a = (k / RIM_DOTS) * Math.PI * 2;
          const p = around(c.o, c.r * (1 + (random() - 0.5) * 0.08), a);
          craterDots.push({ x: p.x, y: p.y, z: p.z, lit: 0.95, size: 1.1 });
        }
        if (c.r > 0.09) {
          for (let k = 0; k < 8; k++) {
            const p = around(c.o, random() * c.r * 0.12, random() * Math.PI * 2);
            craterDots.push({ x: p.x, y: p.y, z: p.z, lit: 0.9, size: 1.3 });
          }
        }
        if (c.rayed) {
          for (let k = 0; k < RAYS; k++) {
            const a = random() * Math.PI * 2;
            const reach = c.r * between(2.2, 4.2);
            for (let j = 0; j < RAY_DOTS; j++) {
              const s = j / RAY_DOTS;
              const p = around(c.o, c.r + s * reach, a + (random() - 0.5) * 0.05);
              craterDots.push({ x: p.x, y: p.y, z: p.z, lit: 0.7 * (1 - s), size: 0.9 });
            }
          }
        }
      });

      wires = [];
      LATS.forEach((y) => {
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        for (let n = 0; n < LAT_DOTS; n++) {
          const a = (n / LAT_DOTS) * Math.PI * 2;
          wires.push({ x: Math.cos(a) * rr, y, z: Math.sin(a) * rr });
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

      reg = [];
      for (let n = 0; n < REG_DOTS; n++) {
        const a = (n / REG_DOTS) * Math.PI * 2;
        reg.push({ x: Math.cos(a) * REG, y: Math.sin(a) * REG * 0.34, tick: n % Math.round(REG_DOTS / REG_TICKS) === 0 });
      }

      ring = [];
      for (let n = 0; n < RING_DOTS; n++) {
        const u = random();
        ring.push({
          a: random() * Math.PI * 2,
          r: RING_R[0] + (RING_R[1] - RING_R[0]) * (u * u * 0.5 + u * 0.5),
          lift: (random() - 0.5) * 0.03,
          size: between(0.6, 1.6),
          base: between(0.25, 0.9),
          lag: between(0.85, 1.15),
        });
      }

      // THE SKY: three depths of stars, thinning out across the window
      // from the left edge, so the side the owner saw empty is the side
      // that is full.
      stars = [];
      for (let n = 0; n < sky[0]; n++) {
        const depth = Math.floor(random() * 3);
        stars.push({
          u: Math.pow(random(), 1.7) * STAR_REACH,
          v: random(),
          depth,
          size: [0.7, 1.1, 1.7][depth] * between(0.8, 1.2),
          base: [0.28, 0.5, 0.85][depth] * between(0.7, 1),
          rate: between(0.6, 2.4),
          phase: random() * Math.PI * 2,
        });
      }
      dust = [];
      for (let n = 0; n < sky[1]; n++) {
        dust.push({ u: Math.pow(random(), 1.4) * STAR_REACH, v: random(), speed: between(0.004, 0.012), size: between(0.6, 1.4), base: between(0.15, 0.4), sway: random() * 6 });
      }
    }

    function size() {
      const w = window.innerWidth, h = window.innerHeight;
      ratio = Math.min(w < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
      width = w; height = h;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ink.setTransform(ratio, 0, 0, ratio, 0, 0);
      const phone = w < 700;
      const many = phone ? SURFACE[1] : SURFACE[0];
      if (many !== built) build(many, phone ? [STARS[1], DUST[1]] : [STARS[0], DUST[0]]);
    }

    let quieting = false, bLeft = 0, bRight = 0, bTop = 0, bBottom = 0;
    function readColumn() {
      const box = column();
      quieting = Boolean(box);
      if (!box) return;
      bLeft = box.left; bRight = box.right; bTop = box.top; bBottom = box.bottom;
    }
    function hush(x, y) {
      if (!quieting) return 1;
      const dx = bLeft - x > x - bRight ? bLeft - x : x - bRight;
      const dy = bTop - y > y - bBottom ? bTop - y : y - bBottom;
      const ax = dx > 0 ? dx : 0, ay = dy > 0 ? dy : 0;
      const d = Math.sqrt(ax * ax + ay * ay);
      if (d >= SOFT) return 1;
      const q = d / SOFT;
      return QUIET + (1 - QUIET) * (q * q * (3 - 2 * q));
    }

    const TONES = 20;
    const tone = [];
    for (let n = 0; n < TONES; n++) {
      const mix = n / (TONES - 1);
      tone.push("rgb(" +
        Math.round(COLD[0] + (BLUE[0] - COLD[0]) * mix) + "," +
        Math.round(COLD[1] + (BLUE[1] - COLD[1]) * mix) + "," +
        Math.round(COLD[2] + (BLUE[2] - COLD[2]) * mix) + ")");
    }
    let inked = -1;
    // THE SNAPSHOT, for the morph between chapters (chamber.js). While
    // it is an array every speck drawn is pushed on to it as five
    // numbers — where, how big, how bright, and which tone — and
    // `capture` draws one frame with it set and hands the lot over.
    let caught = null;

    function speck(x, y, lit, wide, cool) {
      if (lit <= 0.006) return;
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
      const quiet = hush(x, y);
      const on = lit * quiet;
      if (on <= 0.006) return;
      if (lit > GLOW_FROM) {
        const soft = quiet * quiet * quiet;
        if (soft > 0.03) {
          const rad = GLOW_WIDE * wide;
          ink.globalAlpha = Math.min(GLOW_MOST, (lit - GLOW_FROM) * 0.5) * soft;
          ink.drawImage(glow, x - rad, y - rad, rad * 2, rad * 2);
        }
      }
      let step = (cool * (TONES - 1)) | 0;
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

      // ---------- THE SKY, down the left ----------
      for (let n = 0; n < stars.length; n++) {
        const s = stars[n];
        const tw = 0.55 + 0.45 * Math.sin(t * s.rate + s.phase);
        // The nearer stars drift very slightly, so the field has depth.
        const x = s.u * width + Math.sin(t * 0.05 + s.phase) * s.depth * 1.5;
        const y = s.v * height;
        speck(x, y, s.base * tw, s.size, 0.3 + 0.2 * (2 - s.depth));
      }
      for (let n = 0; n < dust.length; n++) {
        const d = dust[n];
        const v = (d.v + t * d.speed) % 1;
        const x = d.u * width + Math.sin(t * 0.3 + d.sway) * 6;
        speck(x, v * height, d.base * Math.sin(Math.PI * v), d.size, 0.6);
      }
      // A SHOOTING STAR, now and then, across the left of the page.
      if (!REDUCE_MOTION) {
        if (!shooting && t > nextShot) {
          const x0 = width * between(0.04, STAR_REACH * 0.8), y0 = height * between(0.05, 0.5);
          shooting = { x0, y0, a: between(0.35, 0.75), len: between(120, 260), at: t, life: between(0.7, 1.2) };
          nextShot = t + between(SHOOT_EVERY[0], SHOOT_EVERY[1]);
        }
        if (shooting) {
          const p = (t - shooting.at) / shooting.life;
          if (p >= 1) shooting = null;
          else {
            const head = p * shooting.len * 1.6;
            for (let k = 0; k < 40; k++) {
              const back = k * (shooting.len / 40) * 0.6;
              const d = head - back;
              if (d < 0) continue;
              const x = shooting.x0 + Math.cos(shooting.a) * d;
              const y = shooting.y0 + Math.sin(shooting.a) * d;
              speck(x, y, (1 - k / 40) * Math.sin(Math.PI * p) * 1.1, 1.3 - k / 60, 0.1);
            }
          }
        }
      }

      // ---------- THE HALO ----------
      const far = R * HALO;
      const air = ink.createRadialGradient(cx, cy, R * 0.8, cx, cy, far);
      air.addColorStop(0, "rgba(190, 206, 236, " + HALO_LIT + ")");
      air.addColorStop(1, "rgba(160, 180, 220, 0)");
      ink.globalAlpha = 1;
      ink.fillStyle = air;
      ink.fillRect(cx - far, cy - far, far * 2, far * 2);

      const turn = t * SPIN;
      const cosT = Math.cos(turn), sinT = Math.sin(turn);
      const cosL = Math.cos(TILT), sinL = Math.sin(TILT);
      // The sun's own projection: turned about the axis, then leant.
      const put = (px, py, pz, out) => {
        const ax = px * cosT + pz * sinT;
        const az = -px * sinT + pz * cosT;
        const ay = py * cosL - az * sinL;
        const bz = py * sinL + az * cosL;
        out[0] = cx + ax * R; out[1] = cy + ay * R; out[2] = bz;
        out[3] = ax; out[4] = ay;
        return out;
      };
      const at = [0, 0, 0, 0, 0];

      // THE LIGHT, in the window's frame: it swings to and fro over
      // PHASE seconds, from nearly behind the eye (a full moon) round to
      // the side (a thick crescent) and back, so the terminator sweeps
      // across the face of the disc. It never goes all the way round:
      // a new moon is a black page for a quarter of every cycle.
      const la = Math.PI / 2 + 0.2 + 1.15 * Math.sin((t / PHASE) * Math.PI * 2 + 0.6);
      const Lx = Math.cos(la) * 0.94, Ly = -0.34, Lz = Math.sin(la) * 0.94;
      const lightAt = (sx, sy, sz) => {
        const d = sx * Lx + sy * Ly + sz * Lz;
        // Soft across the terminator, and never quite dark.
        const lit = Math.max(0, Math.min(1, (d + TERMINATOR) / (TERMINATOR * 2)));
        return EARTHSHINE + (1 - EARTHSHINE) * lit * lit * (3 - 2 * lit);
      };

      // ---------- THE RING, far half first ----------
      const rt = t * RING_TURN;
      const cR = Math.cos(RING_TILT), sR = Math.sin(RING_TILT);
      const ringPos = (r, out) => {
        const a = r.a + rt * r.lag;
        const px = Math.cos(a) * r.r, pz = Math.sin(a) * r.r, py = r.lift;
        const y = py * cR - pz * sR, z = py * sR + pz * cR;
        out[0] = cx + px * R; out[1] = cy + y * R; out[2] = z;
        return out;
      };
      for (let n = 0; n < ring.length; n++) {
        ringPos(ring[n], at);
        if (at[2] >= 0) continue;
        speck(at[0], at[1], ring[n].base * RING_LIT * 0.7, ring[n].size, 0.55);
      }

      // ---------- THE SURFACE ----------
      for (let n = 0; n < surface.length; n++) {
        const s = surface[n];
        put(s.x, s.y, s.z, at);
        const front = at[2] > 0;
        const lit = lightAt(at[3], at[4], at[2]);
        const round = Math.sqrt(Math.max(0, 1 - at[2] * at[2]));
        speck(at[0], at[1], s.base * lit * (front ? 1 : BEHIND) * (1 + 0.35 * round * round),
          s.size * (front ? 1 : 0.8), 0.15 + 0.6 * (1 - lit));
      }
      // ---------- THE CRATERS' RIMS, PEAKS AND RAYS ----------
      for (let n = 0; n < craterDots.length; n++) {
        const c = craterDots[n];
        put(c.x, c.y, c.z, at);
        if (at[2] <= 0) continue;
        const lit = lightAt(at[3], at[4], at[2]);
        speck(at[0], at[1], c.lit * lit, c.size, 0.1 + 0.5 * (1 - lit));
      }
      // ---------- THE GEOMETRY ----------
      for (let n = 0; n < wires.length; n++) {
        const w = wires[n];
        put(w.x, w.y, w.z, at);
        speck(at[0], at[1], WIRE * (at[2] > 0 ? 1 : BEHIND * 1.4), WIRE_SIZE, 0.4);
      }
      // ---------- THE REGISTRATION RING, still ----------
      for (let n = 0; n < reg.length; n++) {
        const r = reg[n];
        speck(cx + r.x * R, cy + r.y * R, REG_LIT * (r.tick ? 2.1 : 1), r.tick ? 2.2 : 1, 0.3);
      }
      // ---------- THE RING, near half, over the moon ----------
      for (let n = 0; n < ring.length; n++) {
        ringPos(ring[n], at);
        if (at[2] < 0) continue;
        speck(at[0], at[1], ring[n].base * RING_LIT, ring[n].size, 0.35);
      }

      ink.globalAlpha = 1;
      ink.globalCompositeOperation = "source-over";
    }

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

    const again = () => { size(); if (REDUCE_MOTION) draw(20); };
    window.addEventListener("resize", again);

    size();
    if (REDUCE_MOTION) draw(20);
    else frame = requestAnimationFrame(tick);

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
