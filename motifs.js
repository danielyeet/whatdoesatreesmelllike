// ============================================================
// THE MOTIFS — what comes up over the Houses view while you rest
// on a house (categories/scent-descriptions.html)
//
// The owner, 2026-09-23: "whenever you hover one of them, motifs from
// that page start occuring and appearing on the SD Houses page, while
// everything else kinda blurs out, and when you unhover, the motifs
// fade gradually, they dont disappear."
//
// So each house has a small set of things of its own, taken from its
// own page — Pineward's trees and needles, ADAR's black holes and dust,
// Almost Human's clouded figures glitching into being and its rain,
// Ataraxia's bands of particles running as waves and shaking the air
// round them, Grande's particles rising and bursting, Les Abstraits'
// old armoire drawn in lines with irises at its feet and a drip
// filling a puddle, Tale's doodles, Tombstone's names cut into the
// wall and its roots and flowers, and Qimu & Musicians' music, written
// out on short staves and loose on the page.
//
// THEY GATHER RATHER THAN APPEAR. Nothing is there the moment a house
// is rested on: things are born one at a time and each comes up over
// its own second or so, so the page fills rather than switches.
// THEY FADE RATHER THAN VANISH. Leaving a house stops anything new
// being born and lets everything already there fade out over
// `FADE_OUT_MS` — each from wherever it had got to.
//
// contact-sheet.js decides WHEN (after the pointer has rested) and
// WHICH (the frame's `data-motif`); this file only draws. It keeps
// clear of the house being rested on, so its picture is never drawn
// over.
//
// window.HouseMotifs = { start(key, frame, around), stop(now), census() } — `around`
// is the boxes of the houses on the page, which writing is kept off.
// ============================================================
(function () {
  const stage = document.querySelector(".sheet-stage");
  if (!stage) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const FADE_IN_MS = 900;      // how long one thing takes to come up
  const FADE_OUT_MS = 1700;    // how long everything takes to go, on leaving
  const CLEAR = 26;            // how far everything keeps off the house itself

  // The house's own colours, where it has any. Pineward's pair is the
  // one pineward.js and the stylesheet keep; Tale's are its labels'.
  const INK = "23, 23, 15";
  const PINE_GREEN = "26, 74, 44";
  const PINE_BARK = "74, 52, 34";
  const TALE_GREEN = "207, 227, 194";
  const TALE_PEACH = "246, 201, 168";
  const PETAL = "155, 43, 43";
  const QIMU_BLUE = "44, 62, 99";

  const canvas = document.createElement("canvas");
  canvas.className = "sheet-motifs";
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0;
  function size() {
    // A little over half the fill below 700px, as every canvas on the
    // site draws there.
    const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // The house being rested on, as a box on the window, grown by CLEAR.
  let avoid = null;
  function clearOf(x, y, r) {
    if (!avoid) return true;
    return x + r < avoid.left || x - r > avoid.right || y + r < avoid.top || y - r > avoid.bottom;
  }
  /** A point on the window that is not on the house, tried a few times. */
  // Nothing is placed in the band across the top where the Menu, the
  // two buttons and the search stand — only things that fall in from
  // above the window (which say so with a fromY below nought) start there.
  const CHROME = 64;
  function spot(r, fromY, toY) {
    for (let i = 0; i < 12; i++) {
      const low = fromY == null ? CHROME + r : fromY < 0 ? fromY : Math.max(fromY, CHROME + r);
      const x = rand(0, W), y = rand(low, toY == null ? H : toY);
      if (clearOf(x, y, r)) return { x, y };
    }
    return null;
  }

  // ============================================================
  // THE HOUSES
  // Each is a list of kinds; a kind is how often one is born, how many
  // may stand at once, and how to make one. A thing made is an object
  // with a `life` in ms (or none, to live until the house is left) and a
  // `draw(ctx, age, alpha)`.
  // ============================================================

  // ---------- PINEWARD: trees growing, needles falling ----------
  function tree() {
    const h = rand(70, 170);
    const at = spot(h * 0.4, H * 0.3, H + h * 0.2);
    if (!at) return null;
    const tiers = Math.round(h / 9);
    const lean = rand(-0.05, 0.05);
    const needles = [];
    for (let t = 0; t < tiers; t++) {
      const up = (t + 1) / (tiers + 1);
      const reach = (1 - up) * h * 0.36 + 5;
      [-1, 1].forEach((side) => {
        const n = Math.round(reach / 3);
        for (let k = 1; k <= n; k++) needles.push({ t, side, k: k / n, reach, up, j: rand(-1.4, 1.4) });
      });
    }
    return {
      life: rand(5200, 8200),
      draw(c, age, a) {
        const grow = ease(age / 1900);
        const x0 = at.x, y0 = at.y;
        c.strokeStyle = "rgba(" + PINE_BARK + "," + (0.55 * a) + ")";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x0 + lean * h * grow, y0 - h * grow);
        c.stroke();
        needles.forEach((nd) => {
          if (nd.up > grow) return;
          const bx = x0 + lean * h * nd.up, by = y0 - h * nd.up;
          const px = bx + nd.side * nd.reach * nd.k;
          const py = by + nd.reach * nd.k * 0.42 + nd.j;
          const mix = nd.k;
          c.fillStyle = "rgba(" + (mix > 0.3 ? PINE_GREEN : PINE_BARK) + "," + (0.85 * a) + ")";
          c.fillRect(px - 1.1, py - 1.1, 2.2, 2.2);
        });
      },
    };
  }
  function needle() {
    const at = spot(4, -20, H * 0.7);
    if (!at) return null;
    const turn = rand(-0.002, 0.002), drift = rand(-0.012, 0.012), fall = rand(0.018, 0.04);
    let angle = rand(0, Math.PI);
    return {
      life: rand(4000, 7000),
      draw(c, age, a) {
        const x = at.x + drift * age + Math.sin(age / 600) * 6, y = at.y + fall * age;
        angle += turn * 16;
        c.strokeStyle = "rgba(" + PINE_GREEN + "," + (0.6 * a) + ")";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - Math.cos(angle) * 5, y - Math.sin(angle) * 5);
        c.lineTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5);
        c.stroke();
      },
    };
  }

  // ---------- ADAR: black holes, their waves, and dust ----------
  // The void off its own page, rung round with soundings, and dust
  // falling — and then, the night of 2026-09-25: "make the waves of the
  // dots that form from the hover of adar larger, and distortive of the
  // page. Where they appear, let them have a black hole effect on
  // anything they touch."
  //
  // So each void is A WELL now. It forms over a second and a half: a
  // hole of ink, a thin ring hugging it and a dotted one further out,
  // drawn as a diagram draws them, and a disk of specks tipped towards
  // you, turning round it — faster the nearer they are — and spiralling
  // in, the back half behind the hole and the front half across it.
  // Out of it, WAVES OF DOTS ring out much further than the soundings
  // did (`WELL_REACH` of the window), and as each passes it bends what
  // it crosses — a ripple that pushes out ahead of it and draws in
  // behind it.
  //
  // AND IT PULLS. Every well puts itself on `wells`, and
  // `HouseMotifs.bend()` hands contact-sheet.js the field they make
  // together, which the Houses view draws itself through: the axis
  // bends, the helix, the dust and the tethers are drawn in towards the
  // hole, turned round it, shrunk as they near it and gone at its edge,
  // and the houses lean in, turn and shrink after them — all but the one
  // being rested on, which is under the pointer and has to stay there.
  // The page's own squares bend in with them (`spacetime`), darker the
  // more they are pulled — a well drawn as the diagram of one is drawn.
  // Nothing of it reaches past its own reach, so the page is whole again
  // the moment it has gone.
  const WELL_REACH = 0.44;           // of the window's shorter side, how far a well reaches
  const WELL_REACH_MOST = 380;       // px
  const WELL_FORM = 1500;            // ms to form
  const WELL_PULL = 0.82;            // how far in (of the way to the hole) a point near it is drawn
  const WELL_SWIRL = 1.15;           // radians a point near it is turned
  const RING_SPEED = 0.085;          // px a ms, how fast the waves ring out
  const RING_COUNT = 4;
  const RING_PUSH = 13;              // px, how far a wave pushes what it crosses
  const RING_BAND = 17;              // px, and over how wide a band
  const DISK_SPECKS = 120;
  const wells = [];
  const smooth = (a, b, x) => ease((x - a) / (b - a));
  const bent = { x: 0, y: 0, s: 1, a: 1, turn: 0, cover: 0 };
  /** Where a point on the window is drawn once every well has had it:
      moved, scaled, faded and turned. The one object, reused. */
  function bendPoint(x, y) {
    let sc = 1, al = 1, turn = 0, cover = 0;
    for (let i = 0; i < wells.length; i++) {
      const w = wells[i];
      let dx = x - w.x, dy = y - w.y;
      const d = Math.hypot(dx, dy);
      if (d > w.R || d < 0.001 || w.s < 0.002) continue;
      const win = 1 - smooth(w.R * 0.55, w.R, d);
      cover = Math.max(cover, win * Math.min(1, w.s * 2));
      const k = w.s * Math.exp(-d / (w.R * 0.34)) * win;
      let r = d - k * WELL_PULL * Math.max(0, d - w.h * 0.45);
      // The waves: out ahead of each, in behind it.
      let mag = 1;
      for (let j = 0; j < w.rings.length; j++) {
        const g = w.rings[j], u = (d - g.r) / RING_BAND;
        if (u > 3 || u < -3) continue;
        const e = Math.exp(-u * u);
        r += RING_PUSH * w.s * g.f * u * e * 2.33 * win;
        mag += 0.4 * w.s * g.f * e * win;
      }
      const spin = WELL_SWIRL * w.s * Math.exp(-d / (w.R * 0.26)) * win;
      const c = Math.cos(spin), sn = Math.sin(spin);
      const ux = dx / d, uy = dy / d;
      const rx = ux * c - uy * sn, ry = ux * sn + uy * c;
      x = w.x + rx * r;
      y = w.y + ry * r;
      sc *= Math.pow(Math.max(0.05, r / d), 0.85) * mag;
      al *= smooth(w.h * 0.8, w.h * 2, r);
      turn += spin;
    }
    bent.x = x; bent.y = y; bent.s = sc; bent.a = al; bent.turn = turn; bent.cover = cover;
    return bent;
  }
  /** THE PAGE'S SQUARES, bent. Inside a well's reach the page's own grid
      is covered over in the page's colour and drawn again through the
      field — exactly as faint as the page's where it is barely moved,
      darker the further it is pulled — so the squares themselves are
      seen to bend, rather than a second grid over the first. Drawn once
      for all of them, so two wells side by side bend one grid. */
  const CELL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--grid-cell")) || 46;
  const PAPER = (() => {
    const hex = getComputedStyle(document.body).getPropertyValue("--bg").trim();
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    return m ? [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)).join(", ") : "255, 255, 255";
  })();
  const GRID_INK = 0.035;                // the page's own grid, as style.css draws it
  const GRID_DARK = 0.2;                 // and at its darkest, pulled furthest
  function spacetime(c) {
    if (!wells.length) return;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    wells.forEach((w) => {
      l = Math.min(l, w.x - w.R); r = Math.max(r, w.x + w.R); t = Math.min(t, w.y - w.R); b = Math.max(b, w.y + w.R);
      // The cover, fading out as the field does.
      const k = Math.min(1, w.s * 2);
      if (k < 0.01) return;
      const g = c.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.R);
      [[0, 1], [0.55, 1], [0.6625, 0.844], [0.775, 0.5], [0.8875, 0.156], [1, 0]].forEach(([at, v]) =>
        g.addColorStop(at, "rgba(" + PAPER + "," + v * k + ")"));
      c.fillStyle = g;
      c.fillRect(w.x - w.R, w.y - w.R, w.R * 2, w.R * 2);
    });
    l = Math.max(0, l); t = Math.max(0, t); r = Math.min(W, r); b = Math.min(H, b);
    const LEVELS = 12, paths = Array.from({ length: LEVELS }, () => []);
    const run = (x0, y0, x1, y1) => {
      const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 7));
      let px = 0, py = 0;
      for (let i = 0; i <= n; i++) {
        const q = i / n, ox = x0 + (x1 - x0) * q, oy = y0 + (y1 - y0) * q;
        const p = bendPoint(ox, oy);
        const moved = Math.min(1, Math.hypot(p.x - ox, p.y - oy) / 26);
        const k = (GRID_INK * p.cover + (GRID_DARK - GRID_INK) * moved * moved) * p.a;
        const lvl = Math.round((k / GRID_DARK) * (LEVELS - 1));
        if (i && lvl > 0) paths[Math.min(LEVELS - 1, lvl)].push(px, py, p.x, p.y);
        px = p.x; py = p.y;
      }
    };
    for (let x = Math.ceil(l / CELL) * CELL + 0.5; x < r; x += CELL) run(x, t, x, b);
    for (let y = Math.ceil(t / CELL) * CELL + 0.5; y < b; y += CELL) run(l, y, r, y);
    c.lineWidth = 1;
    paths.forEach((segs, lvl) => {
      if (!segs.length) return;
      c.strokeStyle = "rgba(" + INK + "," + (GRID_DARK * lvl) / (LEVELS - 1) + ")";
      c.beginPath();
      for (let i = 0; i < segs.length; i += 4) { c.moveTo(segs[i], segs[i + 1]); c.lineTo(segs[i + 2], segs[i + 3]); }
      c.stroke();
    });
  }
  /** A place for a well: clear of every house on the page if it can be,
      so its hole is not hidden behind one. */
  function wellSpot(R) {
    for (let i = 0; i < 16; i++) {
      // Not under the way round, at the right of a wide window.
      const x = rand(R * 0.3, W - (W > 700 ? Math.max(R * 0.3, 200) : R * 0.3)), y = rand(CHROME + 40, H - 40);
      if (readAround.every((b) => x < b.left - 60 || x > b.right + 60 || y < b.top - 60 || y > b.bottom + 60)) return { x, y };
    }
    return spot(40);
  }
  function sounding() {
    const R = Math.min(WELL_REACH_MOST, Math.min(W, H) * WELL_REACH);
    const at = wellSpot(R);
    if (!at) return null;
    const hole = rand(13, 19) * Math.max(0.7, R / WELL_REACH_MOST);
    const tilt = rand(-0.45, 0.45), flat = rand(0.24, 0.36);
    const disk = Array.from({ length: DISK_SPECKS }, () => ({ q: Math.random(), a: rand(0, Math.PI * 2), size: rand(0.8, 2), lit: rand(0.4, 1) }));
    const well = { x: at.x, y: at.y, R, h: 0, s: 0, rings: [], seen: 0 };
    let lastAge = 0;
    return {
      life: rand(6500, 8500),
      well,
      draw(c, age, a) {
        const dt = Math.min(64, age - lastAge);
        lastAge = age;
        const s = a * ease(age / WELL_FORM);
        const h = hole * Math.sqrt(s);
        well.s = s; well.h = h; well.seen = performance.now();
        well.rings = Array.from({ length: RING_COUNT }, (_, k) => {
          const r = h + ((age * RING_SPEED + (k * R) / RING_COUNT) % R);
          return { r, f: (1 - r / R) * smooth(h, h * 5, r) };
        });
        if (!wells.includes(well)) wells.push(well);

        // THE WAVES, in dots, each bent by the field it makes.
        c.fillStyle = "rgb(" + INK + ")";
        well.rings.forEach((g) => {
          if (g.f < 0.01) return;
          const n = Math.max(12, Math.round((Math.PI * 2 * g.r) / 8));
          for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2 + age / 4000;
            const p = bendPoint(well.x + Math.cos(t) * g.r, well.y + Math.sin(t) * g.r);
            const k = 0.7 * a * g.f * p.a;
            if (k < 0.01) continue;
            const z = 1.3 + 1.1 * g.f;
            c.globalAlpha = Math.min(1, k);
            c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
          }
        });
        c.globalAlpha = 1;

        // THE DISK: specks turning round the hole, tipped towards you,
        // spiralling in. The half behind the hole is drawn before it.
        const inner = h * 1.25, outer = h * 5.2;
        const speck = (p, front) => {
          const rho = inner + (outer - inner) * p.q;
          const ex = Math.cos(p.a) * rho, ey = Math.sin(p.a) * rho * flat;
          if ((ey > 0) !== front) return;
          const x = well.x + ex * Math.cos(tilt) - ey * Math.sin(tilt);
          const y = well.y + ex * Math.sin(tilt) + ey * Math.cos(tilt);
          const k = s * p.lit * (0.35 + 0.65 * (1 - p.q)) * smooth(0, 0.08, p.q);
          c.fillStyle = "rgba(" + INK + "," + k + ")";
          c.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
        };
        disk.forEach((p) => {
          p.a += (dt / 1000) * 3.2 / Math.pow(0.25 + p.q, 1.5);
          p.q -= (dt / 1000) * 0.06;
          if (p.q < 0) { p.q = 1; p.a = rand(0, Math.PI * 2); }
          speck(p, false);
        });
        // The hole, the thin ring hugging it, and a dotted one further out.
        c.fillStyle = "rgba(" + INK + "," + (0.92 * s) + ")";
        c.beginPath(); c.arc(well.x, well.y, h, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "rgba(" + INK + "," + (0.55 * s) + ")";
        c.lineWidth = 0.8;
        c.beginPath(); c.arc(well.x, well.y, h * 1.45, 0, Math.PI * 2); c.stroke();
        c.setLineDash([1.5, 4]);
        c.strokeStyle = "rgba(" + INK + "," + (0.4 * s) + ")";
        c.beginPath(); c.arc(well.x, well.y, h * 3, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        disk.forEach((p) => speck(p, true));
      },
    };
  }
  function dust() {
    const at = spot(2, -10, H);
    if (!at) return null;
    const fall = rand(0.01, 0.03), size = rand(1.2, 2.4);
    return {
      life: rand(4000, 7000),
      draw(c, age, a) {
        // Falling, and drawn in by any well it comes near.
        const p = bendPoint(at.x + Math.sin(age / 900 + at.y) * 3, at.y + fall * age);
        const z = size * p.s;
        c.fillStyle = "rgba(" + INK + "," + (0.7 * a * p.a) + ")";
        c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
      },
    };
  }

  // ---------- ALMOST HUMAN: clouded figures glitching into being, rain ----------
  // Two rounds of this before. First a figure gathered most of the way
  // into a person and came apart again; then, asked for "humans
  // glitching into existence and then after a brief delay glitching
  // out", it was a figure cut into bands thrown sideways — which the
  // owner called a "mid glitch effect". And they asked for the figure
  // itself to be "made of particles, and not look exactly like a human
  // ... the look of a cloudy human (unclear and blurry), that kinda
  // glitches then appears".
  //
  // THE CLOUD. A figure is not traced: it is volumes — a head, a torso,
  // two arms and two legs, each a capsule, posed a little differently
  // every time — filled with specks, and every speck then thrown off its
  // place by a soft random amount (`FIG_BLUR`) and a few by a great deal.
  // Dense in the middle of a limb, thin at its edges, no outline
  // anywhere: a person seen through frosted glass, breathing slightly.
  //
  // THE GLITCH IN is a broken signal finding itself, in three of the
  // things a real one does rather than in slices:
  //   STUTTER     it flickers — there on one step, gone on the next — the
  //               steps coming more often there than not as it settles;
  //   SPLIT       its colour comes apart: a red copy to one side and a
  //               cyan one to the other, closing on the figure as it
  //               arrives (a colour channel out of register);
  //   SMEAR       a band of it is dragged sideways into streaks, as a
  //               frame's rows are when the data under them breaks;
  //   INTERLACE   every other line of it missing, alternating each step.
  // Then it STANDS, whole and blurred. Then it GOES as an old screen
  // turned off does: pressed into a bright line across and then to a
  // point, gone (`FIG_OUT`).
  const FIG_SPECKS = 560;
  const FIG_BLUR = 2.3;                  // the soft throw, in the figure's own hundredths
  const FIG_IN = 950;                    // ms, glitching in
  const FIG_HOLD = [1500, 2600];         // ms, standing
  const FIG_OUT = 480;                   // ms, going out
  const FIG_STEP = 65;                   // ms from one glitch frame to the next
  const SPLIT_RED = "210, 48, 70";
  const SPLIT_CYAN = "0, 150, 196";
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 0.58;
  function figure() {
    const h = rand(110, 170);
    const at = spot(h * 0.4, h * 0.55, H - h * 0.45);
    if (!at) return null;
    const u = h / 100;
    // The volumes, in hundredths of the figure's height from its feet:
    // [x1, y1, x2, y2, radius]. The arms and the stance are its own.
    // Shoulders wider than the hips, the head clear of them on its neck,
    // the arms held a little off the body and the legs a little apart,
    // so that even blurred the shape is a person's.
    const armL = rand(0.18, 0.55), armR = rand(0.18, 0.55), stance = rand(7, 12);
    const parts = [
      [0, -90, 0, -88, 7.4],
      [0, -80, 0, -76, 2.6],
      [-12, -71, 12, -71, 3.6],
      [0, -68, 0, -46, 8.6],
      [-14, -70, -14 - 31 * Math.sin(armL), -70 + 31 * Math.cos(armL), 3.1],
      [14, -70, 14 + 31 * Math.sin(armR), -70 + 31 * Math.cos(armR), 3.1],
      [-5, -44, -stance, 0, 3.8],
      [5, -44, stance, 0, 3.8],
    ];
    const weight = parts.map((p) => Math.hypot(p[2] - p[0], p[3] - p[1]) * p[4] * 2 + Math.PI * p[4] * p[4]);
    const total = weight.reduce((a, b) => a + b, 0);
    const specks = [];
    for (let i = 0; i < FIG_SPECKS; i++) {
      let r = Math.random() * total, k = 0;
      while (r > weight[k] && k < parts.length - 1) r -= weight[k++];
      const p = parts[k], t = Math.random();
      const ang = rand(0, Math.PI * 2), rad = Math.sqrt(Math.random()) * p[4];
      const far = Math.random() < 0.08 ? 3 : 1;
      const x = (p[0] + (p[2] - p[0]) * t + Math.cos(ang) * rad + gauss() * FIG_BLUR * far) * u;
      const y = (p[1] + (p[3] - p[1]) * t + Math.sin(ang) * rad + gauss() * FIG_BLUR * far) * u;
      specks.push({ x, y, s: rand(1.1, 2.1), tone: far > 1 ? rand(0.12, 0.3) : rand(0.3, 0.72), ph: rand(0, 6.3) });
    }
    const middle = -45 * u;
    const hold = rand(FIG_HOLD[0], FIG_HOLD[1]);
    const life = FIG_IN + hold + FIG_OUT;
    let stepAt = -1, g = null;
    return {
      life: life,
      sharp: true,
      draw(c, age, a) {
        if (age >= life) return;
        const step = Math.floor(age / FIG_STEP);
        const going = age > FIG_IN + hold;
        // How broken: all the way at the first step, nothing once it
        // stands.
        const broken = going ? 0 : 1 - ease(age / FIG_IN);
        if (step !== stepAt) {
          stepAt = step;
          g = {
            on: Math.random() < 0.3 + 0.7 * (1 - broken),
            split: broken * rand(4, 13) * (Math.random() < 0.5 ? -1 : 1),
            smearFrom: rand(-100, -10) * u, smearTall: rand(8, 22) * u, smear: broken * rand(8, 34),
            jump: Math.random() < 0.2 * broken ? rand(-6, 6) : 0,
            odd: step % 2,
          };
        }
        const breathe = (sp) => Math.sin(age / 700 + sp.ph) * 0.7;
        // GOING: pressed flat into a line, and the line to a point.
        if (going) {
          const q = (age - FIG_IN - hold) / FIG_OUT;
          const flat = q < 0.6 ? 1 - ease(q / 0.6) * 0.97 : 0.03;
          const thin = q < 0.6 ? 1 + q * 0.5 : (1.3) * (1 - ease((q - 0.6) / 0.4));
          const bright = q < 0.6 ? 1 : 1 - ease((q - 0.6) / 0.4);
          c.fillStyle = "rgba(" + INK + "," + (0.75 * a * bright) + ")";
          specks.forEach((sp) => c.fillRect(at.x + sp.x * thin, at.y + middle + (sp.y - middle) * flat, sp.s, sp.s));
          if (q < 0.35) {
            c.fillStyle = "rgba(" + SPLIT_RED + "," + (0.3 * a) + ")";
            specks.forEach((sp) => c.fillRect(at.x + sp.x * thin - 5, at.y + middle + (sp.y - middle) * flat, sp.s, sp.s));
            c.fillStyle = "rgba(" + SPLIT_CYAN + "," + (0.3 * a) + ")";
            specks.forEach((sp) => c.fillRect(at.x + sp.x * thin + 5, at.y + middle + (sp.y - middle) * flat, sp.s, sp.s));
          }
          return;
        }
        if (!g.on) return;
        const y0 = at.y + g.jump;
        if (broken > 0.04 && Math.abs(g.split) > 0.6) {
          c.fillStyle = "rgba(" + SPLIT_RED + "," + (0.42 * broken * a) + ")";
          specks.forEach((sp) => c.fillRect(at.x + sp.x - g.split, y0 + sp.y, sp.s, sp.s));
          c.fillStyle = "rgba(" + SPLIT_CYAN + "," + (0.42 * broken * a) + ")";
          specks.forEach((sp) => c.fillRect(at.x + sp.x + g.split, y0 + sp.y, sp.s, sp.s));
        }
        specks.forEach((sp) => {
          // INTERLACE, while it is still mostly broken.
          if (broken > 0.35 && Math.floor((sp.y + 200) / 3) % 2 === g.odd) return;
          const tone = sp.tone * (1 - broken * 0.35);
          c.fillStyle = "rgba(" + INK + "," + (tone * a) + ")";
          const inSmear = broken > 0.05 && sp.y > g.smearFrom && sp.y < g.smearFrom + g.smearTall;
          if (inSmear) c.fillRect(at.x + sp.x, y0 + sp.y, sp.s + g.smear * (0.4 + (sp.ph % 1)), 1);
          else c.fillRect(at.x + sp.x, y0 + sp.y + breathe(sp), sp.s, sp.s);
        });
      },
    };
  }
  function rain() {
    const at = spot(3, -40, H * 0.6);
    if (!at) return null;
    const speed = rand(0.25, 0.42);
    return {
      life: rand(1600, 2600),
      draw(c, age, a) {
        c.fillStyle = "rgba(" + INK + "," + (0.55 * a) + ")";
        for (let k = 0; k < 5; k++) c.fillRect(at.x, at.y + speed * age - k * 4, 1.2, 1.6);
      },
    };
  }

  // ---------- ATARAXIA: bands of particles on a wave, shaking the air round them ----------
  // The house's own page is crossed by bands of light. Here they were
  // first too faint, then carried a grey haze (a "random beam"), then
  // cast a soft shadow from every particle — which the owner found
  // "really ugly" and asked to have undone: "maybe give them a wavelike
  // quality, where they cause vibrations around them. Make the particles
  // just particles otherwise, quite uncomplicated."
  //
  // So a band is plain square specks, one ink, and it MOVES AS A WAVE: a
  // travelling ripple runs along its length, swelling where a crest
  // passes (`WAVE_*`), and the band's specks ride it across the band.
  // And the air either side of it — a looser scatter of fainter specks —
  // is SHAKEN by it: each of those trembles quickly about its own place,
  // hardest where the crest is and nearest the band, still further out
  // and away from it. No shadow, no mote, no haze, no stroke.
  const WAVE_LENGTH = [240, 420];        // px from one ripple to the next
  const WAVE_HEIGHT = [5, 9];            // px either side, at a crest
  const WAVE_SPEED = [0.08, 0.13];       // px per ms, the ripple along the band
  const CREST_SPEED = [0.26, 0.4];       // px per ms, the swell along it
  const SHAKE_REACH = 3.2;               // the shaken air, in band-widths either side
  function band() {
    const angle = rand(6, 22) * (Math.random() < 0.5 ? -1 : 1) * Math.PI / 180;
    const cy = rand(H * 0.12, H * 0.88);
    const len = Math.hypot(W, H) + 200;
    const wide = rand(10, 15);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const x0 = -100, y0 = cy - (len / 2) * sin;
    const lambda = rand(WAVE_LENGTH[0], WAVE_LENGTH[1]);
    const height = rand(WAVE_HEIGHT[0], WAVE_HEIGHT[1]);
    const omega = (Math.PI * 2 * rand(WAVE_SPEED[0], WAVE_SPEED[1])) / lambda;
    const crestSpeed = rand(CREST_SPEED[0], CREST_SPEED[1]);
    const specks = [];
    for (let s = 0; s < len; s += rand(0.7, 1.5)) {
      specks.push({ s, off: gauss() * wide * 0.55, size: rand(1.3, 2.3), tone: rand(0.55, 0.9) });
    }
    const air = [];
    for (let s = 0; s < len; s += rand(2.2, 4.5)) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const out = wide * (0.9 + Math.pow(Math.random(), 1.6) * SHAKE_REACH);
      air.push({ s, off: side * out, size: rand(1, 1.7), tone: rand(0.2, 0.44),
        rate: rand(0.018, 0.04), ph: rand(0, 6.3), fall: Math.exp(-(out - wide) / (wide * 1.6)) });
    }
    return {
      life: rand(8500, 12000),
      draw(c, age, a) {
        const crest = (age * crestSpeed) % (len + 600) - 300;
        const swell = (s) => 0.4 + 0.6 * Math.exp(-Math.pow((s - crest) / 260, 2));
        const at = (s, off) => [x0 + s * cos - off * sin, y0 + s * sin + off * cos];
        specks.forEach((p) => {
          const lift = height * swell(p.s) * Math.sin((Math.PI * 2 * p.s) / lambda - age * omega);
          const [x, y] = at(p.s, p.off + lift);
          if (!clearOf(x, y, 2)) return;
          c.fillStyle = "rgba(30, 31, 36," + (a * p.tone) + ")";
          c.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
        });
        air.forEach((p) => {
          const sw = swell(p.s);
          const lift = height * sw * Math.sin((Math.PI * 2 * p.s) / lambda - age * omega) * p.fall;
          const shake = height * 0.55 * sw * p.fall * Math.sin(age * p.rate + p.ph);
          const [x, y] = at(p.s + shake * 0.3, p.off + lift + shake);
          if (!clearOf(x, y, 2)) return;
          c.fillStyle = "rgba(30, 31, 36," + (a * p.tone * (0.6 + 0.4 * sw)) + ")";
          c.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
        });
      },
    };
  }

  // ---------- GRANDE PARFUMS: particles, rising and bursting ----------
  // It was the house's own drift, and then — asked for "the particles
  // that come up to sort of bubble", twice as many — rings that rose and
  // popped. The owner then asked for "particles, not bubbles bubbles":
  // so each is a plain speck again, rising with a little sway, and at the
  // top of its rise it BURSTS into a small spray of finer specks that fly
  // out, slow, and fade — the same thing the house's own page does now.
  const BURST_MS = 900;
  function rise() {
    const at = spot(3, H * 0.2, H + 20);
    if (!at) return null;
    const big = Math.random() < 0.1;
    const size = big ? rand(2.3, 3.2) : rand(1.1, 2.1);
    const up = rand(0.018, 0.042);
    const sway = rand(2, 6), swayRate = rand(380, 720), phase = rand(0, Math.PI * 2);
    const burstAt = rand(4200, 8200);
    const bits = [];
    const n = big ? 7 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) bits.push({ a: (i / n) * Math.PI * 2 + rand(-0.4, 0.4), far: rand(7, 16) * (big ? 1.6 : 1), s: rand(0.55, 1) });
    return {
      life: burstAt + BURST_MS,
      draw(c, age, a) {
        const t = Math.min(age, burstAt);
        const x = at.x + Math.sin(t / swayRate + phase) * sway;
        const y = at.y - up * t;
        if (age < burstAt) {
          c.fillStyle = "rgba(" + INK + "," + (0.5 * a) + ")";
          c.fillRect(x - size / 2, y - size / 2, size, size);
          return;
        }
        const q = (age - burstAt) / BURST_MS;
        if (q >= 1) return;
        const out = 1 - Math.pow(1 - q, 3);
        c.fillStyle = "rgba(" + INK + "," + (0.5 * Math.pow(1 - q, 1.4) * a) + ")";
        bits.forEach((b) => c.fillRect(x + Math.cos(b.a) * b.far * out - b.s / 2,
          y + Math.sin(b.a) * b.far * out - q * 6 - b.s / 2, b.s, b.s));
      },
    };
  }

  // ---------- LES ABSTRAITS: an old armoire with irises at its feet, and a drip ----------
  // Four rounds before this — smoke, compositions, a point and a line,
  // and droplets gathering into the house's own logo, which set solid.
  // The owner did not want it "to ever turn into the actual picture",
  // and asked for the hover to follow the house's own page instead: "an
  // old armoire on one of the sides, which feels old, and has some iris
  // notes in it ... like the perfume belle ame ... On the other side ...
  // a dripping effect from the top of the page to the bottom, where there
  // will be a puddle ... start off as nonexistent ... larger and larger
  // (capping at a specific size)".
  //
  // THEN (2026-09-25, night): "I want that to be less particular dense,
  // and more geometric (and the violets should be more natural, anbd
  // coming out from the legs of it, like real flowers would)" — and asked
  // which, they kept the flowers IRISES, Belle Âme's orris. So:
  //
  // THE ARMOIRE is plain geometry in walnut hairlines, where it was
  // thousands of specks: a carcass on four tapered legs (two in front,
  // two seen behind them) with a shallow V of an apron, a drawer with two
  // knobs, a shut left door with its panels and a diamond set in the
  // upper one, a stepped cornice, a broken pediment in two straight rakes
  // with a diamond finial. Its right door stands ajar, and through the
  // gap the inside is drawn in perspective — the back set in, the corners
  // run to it, two shelves — on a faint tone. Specks are only ACCENTS: one
  // at every joint, and the orris powder, about half as much as before,
  // drifting out of the gap. It DRAWS ITSELF UP FROM THE FLOOR, every line
  // growing from its lower end.
  // THE IRISES grow at its feet, a clump at each front leg, as they would
  // come up round the legs of a piece of furniture left in a garden: a
  // fan of sword leaves, some bending over, and a stem or two rising past
  // them, leaning out, each opening into three falls hanging down and out
  // with the gold beard on them and three standards cupped upright — and
  // one bud in each clump left shut. The leaves come up first, then the
  // stems, then the flowers open, and all of it sways a little from the
  // ground.
  // THE DRIP is on the other side: a bead gathering at the very top of
  // the window, swelling, falling the whole height, and landing — since
  // the night of 2026-09-25 — in A BEAKER standing on a short bench at the
  // foot of the window, where the puddle was: "I want the puddle to be
  // more realistic, not just a circle of water. I want it to fall into a
  // beaker, once the beaker starts overflowing, let it drip from that
  // too." It is drawn by beaker.js, as a diagram — the same beaker as the
  // house's own page — filling with every drop (`BEAKER_FILL` to its
  // brim) and then overflowing from its spout onto the bench.
  const WALNUT = "88, 62, 44";
  const IRIS = "112, 94, 156";
  const ORRIS = "150, 136, 176";
  const STEM = "96, 112, 88";
  const BEARD = "184, 128, 46";
  const LEAF_TONES = ["96, 112, 88", "84, 104, 76", "110, 124, 96", "92, 108, 70", "104, 116, 84"];
  const DRY = "152, 132, 98";            // a leaf's browned tip, and old leaf on the ground
  const SOIL = "98, 86, 72";
  const DRIP_INK = "104, 92, 132";
  const ARMOIRE_BUILD = 1800;            // ms, drawn up from the floor
  const IRIS_FROM = 600;                 // ms, the leaves start once the legs stand
  const IRIS_STEMS_AFTER = 700;          // ms after the leaves, the stems
  const IRIS_OPEN_AFTER = 1900;          // ms after the leaves, the flowers open
  const IRIS_SWAY = 2.4;                 // px at the top of a stem, either way
  const POWDER_EVERY = 100;              // ms between specks of orris powder
  // Slower, and filling less, at the owner's word (2026-09-25, night):
  // a drop every one and a half to two and a half seconds, gathering
  // longer, falling for over a second, and twelve to the brim.
  const DRIP_EVERY = [1500, 2400];       // ms from one drop to the next
  const DRIP_HANG = [650, 950];          // ms a drop gathers before it lets go
  const DRIP_FALL = 1150;                // ms, the whole height of the window
  const BEAKER_FILL = 12;                // drops to fill the beaker to its brim
  const BEAKER_SPILL_MOST = 44;          // px, half the spill's length at most
  let abstraitSide = -1;                 // where the armoire stands: -1 left, 1 right

  const arcPts = (cx, cy, r, from, to, n) => Array.from({ length: n + 1 }, (_, i) => {
    const t = from + (to - from) * (i / n);
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
  });

  function armoire() {
    // On the left: the way round stands at the right of the window, and
    // the armoire is too large to stand behind it.
    abstraitSide = -1;
    const tall = Math.max(220, Math.min(H * 0.56, 420));
    const wide = tall * 0.5;
    const baseY = H - Math.max(18, H * 0.04);
    const left = abstraitSide < 0 ? Math.max(14, W * 0.1 - wide / 2) : Math.min(W - wide - 14, W * 0.9 - wide / 2);
    const lean = rand(-0.004, 0.004);
    // In the armoire's own frame: x from 0 to `wide`, y from 0 at the
    // floor up to -tall.
    const legH = tall * 0.13, body = tall * 0.72, crown = tall * 0.05;
    const bottom = -legH, top = -(legH + body), mid = wide / 2;
    const drawerH = body * 0.13;
    const doorTop = top + 8, doorBot = bottom - drawerH - 5;

    // EVERY LINE, with how far up the armoire it starts and ends, so it
    // can be drawn from the floor up.
    const lines = [];
    const put = (pts, weight, bare) => {
      let len = 0;
      const at = [0];
      for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        at.push(len);
      }
      const ys = pts.map((p) => -p[1] / tall);
      lines.push({ pts, at, len: Math.max(0.01, len), from: Math.min(...ys), to: Math.max(...ys), weight: weight || 1, bare: !!bare });
    };
    // A box as four lines: its sides rising from its foot, then across.
    const box = (x1, y1, x2, y2, weight) => {
      put([[x1, y2], [x1, y1]], weight); put([[x2, y2], [x2, y1]], weight);
      put([[x1, y2], [x2, y2]], weight); put([[x1, y1], [x2, y1]], weight);
    };
    const diamond = (cx, cy, rx, ry, weight) => put([[cx, cy + ry], [cx + rx, cy], [cx, cy - ry], [cx - rx, cy], [cx, cy + ry]], weight);

    // THE LEGS: two in front, tapering to the floor, and two behind them,
    // set in and standing a little higher, as the far pair would.
    const legAt = [wide * 0.07, wide * 0.93];
    legAt.forEach((lx) => {
      put([[lx - 2.5, 0], [lx - 6, bottom]]);
      put([[lx + 2.5, 0], [lx + 6, bottom]]);
      put([[lx - 2.5, 0], [lx + 2.5, 0]]);
    });
    [wide * 0.22, wide * 0.78].forEach((lx) => put([[lx, -5], [lx, bottom + 8]], 0.5));
    // The apron: a shallow V under the carcass between the front legs.
    put([[legAt[0] + 6, bottom], [mid - wide * 0.16, bottom + 6], [mid, bottom + 10], [mid + wide * 0.16, bottom + 6], [legAt[1] - 6, bottom]]);
    // The carcass, and a plinth line along its foot.
    box(0, top, wide, bottom);
    put([[-3, bottom - 4], [wide + 3, bottom - 4]], 0.7);
    // The drawer, and its two knobs.
    box(8, bottom - drawerH, wide - 8, bottom - 8, 0.8);
    [wide * 0.3, wide * 0.7].forEach((kx) => put(arcPts(kx, bottom - 8 - (drawerH - 8) / 2, 2.4, 0, Math.PI * 2, 10), 0.8, true));
    // The left door, shut: an upper panel with a diamond set in it, a
    // lower one, and the keyhole.
    const dl = 8, dr = mid - 2;
    box(dl, doorTop, dr, doorBot);
    const pMid = doorTop + (doorBot - doorTop) * 0.58;
    box(dl + 9, doorTop + 12, dr - 9, pMid, 0.7);
    diamond((dl + dr) / 2, (doorTop + 12 + pMid) / 2, (dr - dl - 18) * 0.32, (pMid - doorTop - 12) * 0.3, 0.7);
    box(dl + 9, pMid + 10, dr - 9, doorBot - 10, 0.7);
    put(arcPts(dr - 7, pMid + 5, 1.8, 0, Math.PI * 2, 8), 0.8, true);
    put([[dr - 7, pMid + 7], [dr - 7, pMid + 12]], 0.8);
    // THE RIGHT DOOR, ajar: swung out on its hinge at the right edge, so
    // it is seen narrow and in perspective beyond the carcass.
    const hinge = wide - 8;
    const openW = (hinge - mid - 2) * 0.46, skew = tall * 0.035;
    put([[hinge, doorBot], [hinge + openW, doorBot + skew]]);
    put([[hinge + openW, doorBot + skew], [hinge + openW, doorTop - skew]]);
    put([[hinge, doorTop], [hinge + openW, doorTop - skew]]);
    put([[hinge + openW * 0.3, doorBot + skew * 0.3 - 10], [hinge + openW * 0.3, doorTop - skew * 0.3 + 10]], 0.6);
    // Through the gap, the inside in perspective: its back set in, the
    // corners run back to it, a hanging rail across the top and one shelf
    // below it — "put folded clothes and hangers with something on it in
    // the armoire" (2026-09-25, night).
    const inL = mid + 2, inR = hinge, bL = inL + 10, bR = inR - 5, bT = doorTop + 10, bB = doorBot - 7;
    box(bL, bT, bR, bB, 0.45);
    put([[inL, doorBot], [bL, bB]], 0.45); put([[inR, doorBot], [bR, bB]], 0.45);
    put([[inL, doorTop], [bL, bT]], 0.45); put([[inR, doorTop], [bR, bT]], 0.45);
    const shelfY = bT + (bB - bT) * 0.7;
    put([[inL, shelfY + 6], [bL, shelfY]], 0.45);
    put([[bL, shelfY], [bR, shelfY]], 0.45);
    put([[bR, shelfY], [inR, shelfY + 6]], 0.45);
    // THE RAIL, half way back, on a small bracket at either wall.
    const railY = (doorTop + bT) / 2 + 12, railL = (inL + bL) / 2, railR = (inR + bR) / 2;
    put([[railL, railY], [railR, railY]], 0.9);
    put([[railL, railY - 5], [railL, railY + 3]], 0.7); put([[railR, railY - 5], [railR, railY + 3]], 0.7);
    put(arcPts(railL + 2, railY, 1.6, 0, Math.PI * 2, 8), 0.7, true);
    put(arcPts(railR - 2, railY, 1.6, 0, Math.PI * 2, 8), 0.7, true);
    // The crown: a cornice in two steps, and a broken pediment — two
    // straight rakes stopping short of the middle — with a diamond finial.
    const c1 = top - crown * 0.45, c2 = top - crown;
    put([[-5, top], [-5, c1]], 0.9); put([[wide + 5, top], [wide + 5, c1]], 0.9);
    put([[-5, top], [wide + 5, top]], 0.9);
    put([[-10, c1], [-10, c2]]); put([[wide + 10, c1], [wide + 10, c2]]);
    put([[-10, c1], [wide + 10, c1]]); put([[-10, c2], [wide + 10, c2]]);
    const rise = tall * 0.1, gapHalf = 14;
    const rake = (x) => c2 - rise * (1 - Math.abs(x - mid) / (mid + 10));
    put([[-10, c2], [mid - gapHalf, rake(mid - gapHalf)]]);
    put([[wide + 10, c2], [mid + gapHalf, rake(mid + gapHalf)]]);
    put([[4, c2], [mid - gapHalf, rake(mid - gapHalf) + 7]], 0.55);
    put([[wide - 4, c2], [mid + gapHalf, rake(mid + gapHalf) + 7]], 0.55);
    put([[mid, c2], [mid, c2 - rise * 0.5]], 0.8);
    diamond(mid, c2 - rise * 0.5 - 7, 6, 7, 0.9);

    // THE JOINTS, one speck each — the only specks the armoire has.
    const joints = [];
    const seen = new Set();
    lines.forEach((l) => l.pts.forEach((p, i) => {
      const key = Math.round(p[0]) + "," + Math.round(p[1]);
      if (seen.has(key) || l.weight < 0.6 || l.bare) return;
      seen.add(key);
      joints.push({ x: p[0], y: p[1], l, at: l.at[i] });
    }));

    // THE IRISES: a TUFT at each front leg — "less regular, i want them to
    // appear almost real. especially the base, I want it to be like a
    // tuft, rather than emerging from a horizontal line". So every leaf
    // comes out of one small crown, a hair above or below its neighbours,
    // and nothing about one leaf is quite what the next one is: its lean,
    // its length, its breadth, how it bends through the middle and again
    // towards the tip, its green; a few flop over part of the way up, some
    // are browned at the tip, some show a paler midrib, a few are short
    // new ones still. Round the crown: soil, a few blades of grass and a
    // dry bit of old leaf lying on the ground.
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const clumps = [
      { x: legAt[0] + 3, out: -0.5, big: 1, stems: 3 },
      { x: legAt[1] - 2, out: 1, big: 0.88, stems: 2 },
    ].map((cl) => {
      const n = 9 + Math.floor(Math.random() * 4);
      const fan = Array.from({ length: n }, () => rand(-1, 1)).sort((p, q) => p - q);
      const leaves = fan.map((f) => {
        const young = Math.random() < 0.22;
        return {
          x: cl.x + f * 3 + rand(-1.2, 1.2),
          y: -rand(0, 4),
          tilt: f * rand(0.35, 0.6) + cl.out * 0.08 + rand(-0.1, 0.1),
          long: tall * (0.3 - Math.abs(f) * 0.12) * rand(0.65, 1.15) * cl.big * (young ? 0.4 : 1),
          broad: rand(3.4, 6.8),
          c1: f * rand(0.1, 0.35) + rand(-0.15, 0.15),
          c2: f * rand(0.2, 0.6) + rand(-0.25, 0.25),
          flop: !young && Math.random() < 0.2 ? { at: rand(0.5, 0.78), by: Math.sign(f || cl.out) * rand(0.9, 1.7) } : null,
          tone: pick(LEAF_TONES),
          dry: !young && Math.random() < 0.3 ? rand(0.08, 0.22) : 0,
          rib: Math.random() < 0.45,
          shade: rand(0.22, 0.36),
          delay: Math.abs(f) * 380 + rand(0, 160),
          phase: rand(0, 6.3),
        };
      });
      const grass = Array.from({ length: 5 }, () => ({ x: cl.x + rand(-13, 13), long: rand(6, 16), tilt: rand(-0.6, 0.6), bend: rand(-0.5, 0.5) }));
      const soil = Array.from({ length: 16 }, () => {
        const u = rand(-1, 1);
        return { x: cl.x + u * 13, y: -Math.max(0, (1 - u * u) * rand(0, 3.2)), s: rand(0.8, 1.8), k: rand(0.25, 0.6) };
      });
      const litter = Array.from({ length: 2 }, () => ({ x: cl.x + rand(-15, 15), long: rand(6, 11), ang: rand(-0.3, 0.3), curl: rand(-3, 3) }));
      // STEMS rising past the leaves, each its own height and lean; the
      // last in each tuft stays a bud. Every petal is its own size and
      // angle, so no flower is drawn twice.
      const stems = Array.from({ length: cl.stems }, (_, i) => ({
        x: cl.x + rand(-3, 3) + cl.out * 3,
        tilt: cl.out * rand(0.08, 0.28) + rand(-0.08, 0.08),
        long: tall * (i === 0 ? rand(0.33, 0.4) : rand(0.22, 0.32)) * cl.big,
        bend: rand(-0.14, 0.14),
        bract: rand(0.38, 0.58),
        bud: i === cl.stems - 1,
        size: rand(14, 18) * cl.big,
        turn: rand(-0.22, 0.22),
        falls: [-1, 0, 1].map((k) => ({ k, ang: rand(-0.14, 0.14), long: rand(0.85, 1.15), fat: rand(0.42, 0.56), wave: rand(-1.5, 2) })),
        stds: [-1, 0, 1].map((k) => ({ k, ang: rand(-0.1, 0.1), long: rand(0.85, 1.12), fat: rand(0.26, 0.34) })),
        delay: i * rand(220, 520),
        phase: rand(0, 6.3),
      }));
      return { x: cl.x, leaves, grass, soil, litter, stems };
    });

    // THE CLOTHES. Three hangers on the rail — a long coat at the back, a
    // dress, and a shirt in front — each on a wire hanger with its hook
    // over the rail, swaying a hair about it; and folded clothes in stacks
    // on the shelf and on the floor of the inside, every fold its own
    // width, its own colour, set a little off the one under it. Drawn as
    // the rest of it is — hairlines, a flat tone — in front of the inside,
    // and they come in from the floor up once the door is drawn.
    const room = railR - railL, gs = room / 84;
    // As long as they can hang and still clear the folded stacks on the shelf.
    const hangLong = shelfY - railY - 11 * gs - 34;
    const CLOTH = ["206, 196, 178", "150, 136, 176", "118, 128, 142", "176, 150, 120", "224, 220, 212", "104, 112, 96", "168, 120, 112"];
    const garments = [
      { kind: "coat", x: railL + room * 0.24, tone: "112, 100, 90", long: hangLong * rand(0.94, 1), at: 1650 },
      { kind: "dress", x: railL + room * 0.76, tone: "150, 136, 176", long: hangLong * rand(0.84, 0.92), at: 1800 },
      { kind: "shirt", x: railL + room * 0.5, tone: "214, 220, 228", long: hangLong * rand(0.52, 0.6), at: 1950 },
    ].map((g) => ({ ...g, phase: rand(0, 6.3), sway: rand(0.008, 0.014) }));
    const fold = (x, base, width, n, at) => {
      const out = [];
      let y = base;
      for (let i = 0; i < n; i++) {
        const h = rand(5, 7.5) * Math.max(0.7, gs), w = width * rand(0.86, 1), off = rand(-2.2, 2.2);
        out.push({ x: x + off + (width - w) / 2, y, w, h, tone: CLOTH[Math.floor(Math.random() * CLOTH.length)], at: at + i * 90, open: Math.random() < 0.5 ? -1 : 1 });
        y -= h;
      }
      return out;
    };
    const stackW = Math.min(40, room * 0.42);
    const folded = [
      ...fold(bL + 3, shelfY + 3, stackW, 3 + Math.floor(Math.random() * 2), 1350),
      ...fold(bR - 3 - stackW * 0.92, shelfY + 3, stackW * 0.92, 2 + Math.floor(Math.random() * 2), 1420),
      ...fold(bL + 6, doorBot - 3, stackW * 1.1, 4 + Math.floor(Math.random() * 2), 1200),
    ];

    /** A quadratic curve, as points. */
    const qb = (a0, a1, a2, n) => Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, u = 1 - t;
      return [u * u * a0[0] + 2 * u * t * a1[0] + t * t * a2[0], u * u * a0[1] + 2 * u * t * a1[1] + t * t * a2[1]];
    });

    /** One garment on its hanger: the outline, filled — the paper first,
        so what is behind it is behind it — and its seams. */
    function garment(c, g, k, age, a) {
      const drop = (1 - k) * -6;
      const ang = Math.sin(age / 2600 + g.phase) * g.sway;
      const cs = Math.cos(ang), sn = Math.sin(ang), hx = g.x, hy = railY;
      const at = (p) => {
        const dx = p[0] - hx, dy = p[1] - hy;
        return [hx + dx * cs - dy * sn, hy + drop + dx * sn + dy * cs];
      };
      const tw = (p) => toWindow(...at(p));
      const path = (pts, close) => {
        c.beginPath();
        pts.forEach((p, i) => { const [x, y] = tw(p); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
        if (close) c.closePath();
      };
      const sw = 15 * gs, top = hy + 11 * gs, L = g.long;
      let body = [], seams = [], dots = [];
      if (g.kind === "shirt") {
        body = [
          [hx - 4 * gs, hy + 6 * gs], [hx - sw, top],
          ...qb([hx - sw, top], [hx - sw - 4 * gs, top + L * 0.4], [hx - sw - 2 * gs, top + L * 0.62], 6).slice(1),
          [hx - sw + 4 * gs, top + L * 0.64], [hx - sw + 5 * gs, top + L * 0.22],
          ...qb([hx - sw + 5 * gs, top + L * 0.3], [hx - sw + 3 * gs, top + L * 0.7], [hx - sw + 4 * gs, top + L], 5).slice(1),
          ...qb([hx - sw + 4 * gs, top + L], [hx, top + L + 6 * gs], [hx + sw - 4 * gs, top + L], 6).slice(1),
          ...qb([hx + sw - 4 * gs, top + L], [hx + sw - 3 * gs, top + L * 0.7], [hx + sw - 5 * gs, top + L * 0.3], 5).slice(1),
          [hx + sw - 5 * gs, top + L * 0.22], [hx + sw - 4 * gs, top + L * 0.64],
          ...qb([hx + sw + 2 * gs, top + L * 0.62], [hx + sw + 4 * gs, top + L * 0.4], [hx + sw, top], 6),
          [hx + 4 * gs, hy + 6 * gs], [hx, hy + 15 * gs],
        ];
        // The collar's two points, the placket and its buttons, a pocket.
        seams = [
          [[hx - 4 * gs, hy + 6 * gs], [hx - 3 * gs, hy + 17 * gs], [hx, hy + 15 * gs]],
          [[hx + 4 * gs, hy + 6 * gs], [hx + 3 * gs, hy + 17 * gs], [hx, hy + 15 * gs]],
          [[hx, hy + 15 * gs], [hx, top + L + 5 * gs]],
          [[hx - sw + 7 * gs, top + L * 0.16], [hx - 4 * gs, top + L * 0.16], [hx - 4 * gs, top + L * 0.3], [hx - sw + 7 * gs, top + L * 0.3], [hx - sw + 7 * gs, top + L * 0.16]],
        ];
        for (let d = 0.12; d < 0.95; d += 0.2) dots.push([hx + 1.6 * gs, top + L * d]);
      } else if (g.kind === "dress") {
        const waist = top + L * 0.34, hemW = sw * 1.45;
        body = [
          [hx - 5 * gs, hy + 7 * gs], [hx - sw * 0.7, top],
          ...qb([hx - sw * 0.7, top], [hx - sw * 0.5, top + L * 0.2], [hx - sw * 0.55, waist], 5).slice(1),
          ...qb([hx - sw * 0.55, waist], [hx - hemW * 0.8, top + L * 0.7], [hx - hemW, top + L], 6).slice(1),
          ...qb([hx - hemW, top + L], [hx, top + L + 5 * gs], [hx + hemW, top + L], 8).slice(1),
          ...qb([hx + hemW, top + L], [hx + hemW * 0.8, top + L * 0.7], [hx + sw * 0.55, waist], 6).slice(1),
          ...qb([hx + sw * 0.55, waist], [hx + sw * 0.5, top + L * 0.2], [hx + sw * 0.7, top], 5).slice(1),
          [hx + 5 * gs, hy + 7 * gs],
          ...qb([hx + 5 * gs, hy + 7 * gs], [hx, hy + 18 * gs], [hx - 5 * gs, hy + 7 * gs], 5).slice(1),
        ];
        // The waist seam, and the pleats falling from it.
        seams = [
          qb([hx - sw * 0.55, waist], [hx, waist + 2.5 * gs], [hx + sw * 0.55, waist], 5),
          ...[-0.5, -0.15, 0.2, 0.55].map((f) => qb([hx + f * sw * 0.9, waist + 2 * gs], [hx + f * sw * 1.3, top + L * 0.7], [hx + f * hemW * 1.2, top + L + 3 * gs], 5)),
        ];
      } else {
        const lap = top + L * 0.3, belt = top + L * 0.4;
        body = [
          [hx - 4 * gs, hy + 6 * gs], [hx - sw - 2 * gs, top],
          ...qb([hx - sw - 2 * gs, top], [hx - sw - 5 * gs, top + L * 0.35], [hx - sw - 3 * gs, top + L * 0.58], 5).slice(1),
          [hx - sw + 2 * gs, top + L * 0.6], [hx - sw + 3 * gs, top + L * 0.26],
          [hx - sw + 2 * gs, top + L], [hx + sw - 2 * gs, top + L],
          [hx + sw - 3 * gs, top + L * 0.26], [hx + sw - 2 * gs, top + L * 0.6],
          ...qb([hx + sw + 3 * gs, top + L * 0.58], [hx + sw + 5 * gs, top + L * 0.35], [hx + sw + 2 * gs, top], 5),
          [hx + 4 * gs, hy + 6 * gs],
        ];
        // The lapels, the front edge, the belt with its buckle, pockets.
        seams = [
          [[hx - 4 * gs, hy + 6 * gs], [hx - 8 * gs, top + 4 * gs], [hx - 1 * gs, lap]],
          [[hx + 4 * gs, hy + 6 * gs], [hx + 8 * gs, top + 4 * gs], [hx + 1 * gs, lap]],
          [[hx + 1 * gs, lap], [hx + 1 * gs, top + L]],
          [[hx - sw + 2.4 * gs, belt], [hx + sw - 2.4 * gs, belt]],
          [[hx - sw + 2.4 * gs, belt + 3 * gs], [hx + sw - 2.4 * gs, belt + 3 * gs]],
          [[hx - 3 * gs, belt - 1 * gs], [hx + 3 * gs, belt - 1 * gs], [hx + 3 * gs, belt + 4 * gs], [hx - 3 * gs, belt + 4 * gs], [hx - 3 * gs, belt - 1 * gs]],
          [[hx - sw + 5 * gs, top + L * 0.62], [hx - 4 * gs, top + L * 0.6]],
          [[hx + 4 * gs, top + L * 0.6], [hx + sw - 5 * gs, top + L * 0.62]],
        ];
      }
      c.lineJoin = "round";
      path(body, true);
      c.fillStyle = "rgba(250, 248, 244," + 0.94 * k * a + ")";
      c.fill();
      c.fillStyle = "rgba(" + g.tone + "," + 0.42 * k * a + ")";
      c.fill();
      c.strokeStyle = "rgba(" + WALNUT + "," + 0.6 * k * a + ")";
      c.lineWidth = 0.8;
      c.stroke();
      c.strokeStyle = "rgba(" + WALNUT + "," + 0.34 * k * a + ")";
      c.lineWidth = 0.6;
      seams.forEach((s) => { path(s); c.stroke(); });
      c.fillStyle = "rgba(" + WALNUT + "," + 0.6 * k * a + ")";
      dots.forEach((d) => { const [x, y] = tw(d); c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); });
      // THE HANGER, over all of it: its hook over the rail, its two
      // shoulders and the bar between them.
      c.strokeStyle = "rgba(" + WALNUT + "," + 0.78 * k * a + ")";
      c.lineWidth = 0.9;
      const hw = sw * 0.92;
      path([[hx - hw, hy + 12 * gs], [hx, hy + 4 * gs], [hx + hw, hy + 12 * gs], [hx - hw, hy + 12 * gs]]);
      c.stroke();
      const [kx, ky] = tw([hx, hy + 4 * gs]), [ox, oy] = tw([hx, hy - 3]);
      c.beginPath(); c.moveTo(kx, ky); c.lineTo(ox, oy + 1.5); c.arc(ox + 2.4, oy + 1.5, 2.4, Math.PI, Math.PI * 2.1); c.stroke();
    }

    /** One folded thing: a flat block with its folded edge rounded at one
        end, and the fold across it. */
    function folded1(c, f, k, a) {
      const drop = (1 - k) * -5;
      const [x1, y1] = toWindow(f.x, f.y - f.h + drop), [x2, y2] = toWindow(f.x + f.w, f.y + drop);
      const L = Math.min(x1, x2), R = Math.max(x1, x2), r = Math.min(3, f.h / 2);
      c.beginPath();
      if (f.open < 0) { c.moveTo(L + r, y1); c.lineTo(R, y1); c.lineTo(R, y2); c.lineTo(L + r, y2); c.arc(L + r, (y1 + y2) / 2, (y2 - y1) / 2, Math.PI / 2, Math.PI * 1.5); }
      else { c.moveTo(R - r, y1); c.lineTo(L, y1); c.lineTo(L, y2); c.lineTo(R - r, y2); c.arc(R - r, (y1 + y2) / 2, (y2 - y1) / 2, Math.PI / 2, -Math.PI / 2, true); }
      c.closePath();
      c.fillStyle = "rgba(250, 248, 244," + 0.94 * k * a + ")";
      c.fill();
      c.fillStyle = "rgba(" + f.tone + "," + 0.5 * k * a + ")";
      c.fill();
      c.strokeStyle = "rgba(" + WALNUT + "," + 0.56 * k * a + ")";
      c.lineWidth = 0.7;
      c.stroke();
      // The fold: a line along the middle from the folded edge.
      c.strokeStyle = "rgba(" + WALNUT + "," + 0.26 * k * a + ")";
      c.beginPath();
      const my = (y1 + y2) / 2 + 0.5;
      if (f.open < 0) { c.moveTo(L + r + 2, my); c.lineTo(L + (R - L) * 0.62, my); }
      else { c.moveTo(R - r - 2, my); c.lineTo(R - (R - L) * 0.62, my); }
      c.stroke();
    }

    const powder = [];
    let lastPuff = 0;
    // On the right of the window it is drawn the other way round, so its
    // open door always faces into the page.
    const toWindow = (x, y) => [left + (abstraitSide < 0 ? x : wide - x) + (y * lean), baseY + y];
    const sway = (age, phase, up) => Math.sin(age / 2100 + phase) * IRIS_SWAY * up;
    const rgba = (tone, k) => "rgba(" + tone + "," + k + ")";

    /** The ground a tuft stands in: a little shadow, soil, grass, and a
        dry bit of old leaf. */
    function ground(c, cl, grown, a) {
      if (grown <= 0) return;
      const [cx, cy] = toWindow(cl.x, 0);
      c.fillStyle = rgba("58, 56, 44", 0.16 * grown * a);
      c.beginPath(); c.ellipse(cx, cy, 12, 2.4, 0, 0, Math.PI * 2); c.fill();
      cl.soil.forEach((p) => {
        const [x, y] = toWindow(p.x, p.y);
        c.fillStyle = rgba(SOIL, p.k * grown * a);
        c.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
      });
      c.lineWidth = 0.7;
      c.strokeStyle = rgba(DRY, 0.5 * grown * a);
      cl.litter.forEach((l) => {
        const [x1, y1] = toWindow(l.x, -0.5);
        const [x2, y2] = toWindow(l.x + Math.cos(l.ang) * l.long, -0.5 + Math.sin(l.ang) * l.long * 0.3);
        c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + l.curl, x2, y2); c.stroke();
      });
      c.strokeStyle = rgba(STEM, 0.42 * grown * a);
      c.lineWidth = 0.6;
      cl.grass.forEach((g) => {
        const len = g.long * grown;
        const [x1, y1] = toWindow(g.x, 0);
        const [x2, y2] = toWindow(g.x + Math.sin(g.tilt) * len + g.bend * len * 0.4, -Math.cos(g.tilt) * len);
        const [mx, my] = toWindow(g.x + Math.sin(g.tilt) * len * 0.5 + g.bend * len * 0.3, -Math.cos(g.tilt) * len * 0.5);
        c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
      });
    }

    /** A sword leaf out of the crown: a centre line bending twice (and
        flopping over, for some), a blade narrow at the base, broad a
        little way up and tapering to the tip, browned at the tip for
        some, a paler midrib for others. */
    function leaf(c, lf, grown, age, a) {
      const len = lf.long * grown;
      if (len < 2) return;
      const N = 12, sw = Math.sin(age / 2100 + lf.phase) * 0.035;
      const pts = [[lf.x, lf.y, lf.tilt]];
      let x = lf.x, y = lf.y;
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        let ang = lf.tilt + lf.c1 * t + lf.c2 * t * t + sw * t;
        if (lf.flop && t > lf.flop.at) ang += lf.flop.by * ease(((t - lf.flop.at) / (1 - lf.flop.at)) * 1.6);
        x += (Math.sin(ang) * len) / N;
        y -= (Math.cos(ang) * len) / N;
        pts.push([x, y, ang]);
      }
      const half = (t) => (lf.broad * (0.3 + 0.7 * Math.min(1, t / 0.18)) * Math.pow(1 - t, 0.75)) / 2;
      const L = [], R = [];
      pts.forEach(([px, py, ang], i) => {
        const w = half(i / N), nx = Math.cos(ang), ny = Math.sin(ang);
        L.push(toWindow(px - nx * w, py - ny * w));
        R.push(toWindow(px + nx * w, py + ny * w));
      });
      const outline = (from) => {
        c.beginPath();
        c.moveTo(L[from][0], L[from][1]);
        for (let i = from + 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]);
        for (let i = N; i >= from; i--) c.lineTo(R[i][0], R[i][1]);
        c.closePath();
      };
      outline(0);
      c.fillStyle = rgba(lf.tone, lf.shade * a);
      c.fill();
      c.strokeStyle = rgba(lf.tone, (lf.shade + 0.3) * a);
      c.lineWidth = 0.7;
      c.stroke();
      if (lf.dry && grown > 0.9) {
        outline(Math.round(N * (1 - lf.dry)));
        c.fillStyle = rgba(DRY, 0.5 * a);
        c.fill();
      }
      if (lf.rib) {
        c.strokeStyle = rgba("196, 204, 176", 0.3 * a);
        c.lineWidth = 0.6;
        c.beginPath();
        for (let i = 1; i < N - 1; i++) {
          const [px, py] = toWindow(pts[i][0], pts[i][1]);
          if (i === 1) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.stroke();
      }
    }

    /** One petal from the heart of the flower: broad a little way out,
        its end a little waved. */
    function petal(c, x, y, ang, long, fat, wave) {
      const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca, w = long * fat;
      const tip = [x + ca * long, y + sa * long];
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + ca * long * 0.45 + px * w, y + sa * long * 0.45 + py * w, tip[0] + px * w * 0.45, tip[1] + py * w * 0.45);
      c.quadraticCurveTo(tip[0] + ca * (w * 0.35 + wave), tip[1] + sa * (w * 0.35 + wave), tip[0] - px * w * 0.45, tip[1] - py * w * 0.45);
      c.quadraticCurveTo(x + ca * long * 0.45 - px * w, y + sa * long * 0.45 - py * w, x, y);
      c.fill();
      c.stroke();
    }

    /** A stem rising past the leaves, a bract part way up it, and what is
        at the top of it. */
    function stem(c, st, grown, open, age, a) {
      const len = st.long * grown;
      if (len < 2) return;
      const s = sway(age, st.phase, len / (tall * 0.3));
      const dx = Math.sin(st.tilt), dy = -Math.cos(st.tilt);
      const at = (t) => toWindow(st.x + dx * len * t + st.bend * len * 0.3 * Math.sin(t * Math.PI * 0.9) + s * t * t, dy * len * t);
      const [bx, by] = at(0), [cx2, cy2] = at(0.5), [tx, ty] = at(1);
      c.strokeStyle = rgba(STEM, 0.62 * a);
      c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx2 * 2 - (bx + tx) / 2, cy2 * 2 - (by + ty) / 2, tx, ty); c.stroke();
      // The bract, clasping the stem part way up.
      if (grown > st.bract) {
        const [kx, ky] = at(st.bract);
        const side = st.tilt >= 0 ? 1 : -1;
        c.fillStyle = rgba(STEM, 0.3 * a);
        c.beginPath(); c.moveTo(kx, ky + 6); c.quadraticCurveTo(kx + side * 5, ky - 4, kx + side * 3, ky - 14); c.quadraticCurveTo(kx + side * 1, ky - 3, kx, ky + 6); c.fill(); c.stroke();
      }
      if (grown < 0.98) return;
      // The spathe: a small sheath where the flower leaves the stem.
      c.fillStyle = rgba(STEM, 0.4 * a);
      c.beginPath(); c.moveTo(tx - 2, ty + 9); c.lineTo(tx + 1.5, ty - 2); c.lineTo(tx + 3.5, ty + 7); c.closePath(); c.fill(); c.stroke();
      const r = st.size;
      if (st.bud || open < 0.35) {
        // SHUT: a furled bud, pointing up, a little twisted.
        const h = r * (0.9 + (st.bud ? 0 : open * 0.6));
        c.fillStyle = rgba(IRIS, 0.34 * a);
        c.strokeStyle = rgba(IRIS, 0.7 * a);
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(tx, ty);
        c.quadraticCurveTo(tx - r * 0.34, ty - h * 0.5, tx + st.turn * 6, ty - h);
        c.quadraticCurveTo(tx + r * 0.3, ty - h * 0.45, tx, ty);
        c.fill(); c.stroke();
        c.strokeStyle = rgba(IRIS, 0.4 * a);
        c.beginPath(); c.moveTo(tx + 0.5, ty - 2); c.quadraticCurveTo(tx + r * 0.12, ty - h * 0.5, tx + st.turn * 6, ty - h); c.stroke();
        return;
      }
      // OPEN: three falls hanging down and out, veined, the gold beard
      // on each and a pale style arm over it; three standards cupped
      // upright. Each its own length and angle.
      const o = (open - 0.35) / 0.65;
      const fx = tx, fy = ty - r * 0.35;
      c.lineWidth = 0.9;
      st.falls.forEach((f) => {
        const ang = Math.PI / 2 + f.k * (0.55 + 0.45 * o) + st.turn + f.ang;
        const long = r * (f.k ? 1.35 : 1.05) * f.long * (0.5 + 0.5 * o);
        c.fillStyle = rgba(IRIS, 0.3 * a);
        c.strokeStyle = rgba(IRIS, 0.72 * a);
        petal(c, fx, fy, ang, long, f.fat, f.wave);
        // Veins, and the beard.
        c.strokeStyle = rgba(IRIS, 0.42 * a * o);
        c.lineWidth = 0.5;
        [-0.16, 0, 0.16].forEach((v) => {
          c.beginPath(); c.moveTo(fx + Math.cos(ang) * long * 0.2, fy + Math.sin(ang) * long * 0.2);
          c.lineTo(fx + Math.cos(ang + v) * long * 0.62, fy + Math.sin(ang + v) * long * 0.62); c.stroke();
        });
        c.lineWidth = 0.9;
        c.fillStyle = rgba(BEARD, 0.6 * a * o);
        for (let d = 0.16; d < 0.5; d += 0.07) {
          const j = Math.sin(d * 97 + f.ang * 40) * 0.8;
          c.fillRect(fx + Math.cos(ang) * long * d - 0.6 + j, fy + Math.sin(ang) * long * d - 0.6 - j, 1.2, 1.2);
        }
        c.fillStyle = rgba("214, 206, 230", 0.4 * a * o);
        c.strokeStyle = rgba(IRIS, 0.4 * a * o);
        petal(c, fx, fy, ang, long * 0.5, 0.22, 0);
      });
      st.stds.forEach((f) => {
        const ang = -Math.PI / 2 + f.k * 0.32 * o + st.turn + f.ang;
        c.fillStyle = rgba(IRIS, 0.2 * a);
        c.strokeStyle = rgba(IRIS, 0.66 * a);
        petal(c, fx, fy, ang, r * (f.k ? 1.05 : 1.25) * f.long * (0.6 + 0.4 * o), f.fat, -0.5);
      });
    }

    return {
      box: { left: left - 30, right: left + wide + 40, top: baseY - tall - 40, bottom: baseY },
      draw(c, age, a) {
        c.save();
        const built = ease(age / ARMOIRE_BUILD);
        const reach = built * 1.15;
        // THE ARMOIRE, each line grown from its lower end as far as the
        // build has reached.
        c.lineCap = "round";
        lines.forEach((l) => {
          const k = Math.max(0, Math.min(1, (reach - l.from) / Math.max(0.06, l.to - l.from)));
          l.k = k;
          if (k <= 0) return;
          const upTo = l.len * k;
          c.strokeStyle = "rgba(" + WALNUT + "," + (0.66 * l.weight * a) + ")";
          c.lineWidth = 1.1;
          c.beginPath();
          let [x, y] = toWindow(l.pts[0][0], l.pts[0][1]);
          c.moveTo(x, y);
          for (let i = 1; i < l.pts.length; i++) {
            const seg = l.at[i] - l.at[i - 1];
            if (l.at[i] <= upTo || seg <= 0) {
              [x, y] = toWindow(l.pts[i][0], l.pts[i][1]);
              c.lineTo(x, y);
              continue;
            }
            const t = (upTo - l.at[i - 1]) / seg;
            [x, y] = toWindow(l.pts[i - 1][0] + (l.pts[i][0] - l.pts[i - 1][0]) * t, l.pts[i - 1][1] + (l.pts[i][1] - l.pts[i - 1][1]) * t);
            c.lineTo(x, y);
            break;
          }
          c.stroke();
        });
        // The inside, a faint tone once the door has been drawn.
        const door = ease((reach - (-doorBot / tall)) / 0.3);
        if (door > 0) {
          const [x1, y1] = toWindow(inL, doorTop), [x2, y2] = toWindow(inR, doorBot);
          c.fillStyle = "rgba(20, 16, 14," + (0.05 * door * a) + ")";
          c.fillRect(x1, y1, x2 - x1, y2 - y1);
          // THE CLOTHES, the folded ones from the floor up, then the three
          // hangers, back to front.
          folded.forEach((f) => { const k = ease((age - f.at) / 450); if (k > 0) folded1(c, f, k, a * door); });
          garments.forEach((g) => { const k = ease((age - g.at) / 550); if (k > 0) garment(c, g, k, age, a * door); });
        }
        // A speck at every joint the lines have reached.
        c.fillStyle = "rgba(" + WALNUT + "," + (0.85 * a) + ")";
        joints.forEach((j) => {
          if (j.l.k <= 0 || j.at > j.l.len * j.l.k + 0.01) return;
          const [x, y] = toWindow(j.x, j.y);
          c.fillRect(x - 1, y - 1, 2, 2);
        });

        // THE IRISES: the ground, the leaves, then the stems, then the
        // flowers opening.
        const since = age - IRIS_FROM;
        if (since > 0) clumps.forEach((cl) => {
          ground(c, cl, ease(since / 700), a);
          cl.leaves.forEach((lf) => leaf(c, lf, ease((since - lf.delay) / 1500), age, a));
          cl.stems.forEach((st) => stem(c, st,
            ease((since - IRIS_STEMS_AFTER - st.delay) / 1500),
            ease((since - IRIS_OPEN_AFTER - st.delay) / 1400), age, a));
        });

        // THE ORRIS POWDER, out of the gap: a speck at a time, drifting
        // out and up, slowing, fading.
        if (door > 0.8 && age - lastPuff > POWDER_EVERY) {
          lastPuff = age;
          const gy = rand(doorTop + 20, doorBot - 20);
          powder.push({ x: hinge + rand(0, 4), y: gy, born: age, vx: rand(0.008, 0.03), vy: -rand(0.004, 0.016), s: rand(0.9, 1.8), life: rand(3000, 5200) });
        }
        for (let i = powder.length - 1; i >= 0; i--) {
          const p = powder[i], t = age - p.born;
          if (t > p.life) { powder.splice(i, 1); continue; }
          const k = 1 - Math.exp(-t / 1600);
          const [x, y] = toWindow(p.x + p.vx * 1600 * k * 3 + Math.sin(t / 600 + p.y) * 3, p.y + p.vy * 1600 * k * 3);
          const q = t / p.life;
          c.fillStyle = "rgba(" + ORRIS + "," + (0.72 * a * Math.min(1, t / 400) * (1 - q)) + ")";
          c.fillRect(x, y, p.s, p.s);
        }
        c.restore();
      },
    };
  }

  function drip() {
    const x = (abstraitSide < 0 ? W * 0.86 : W * 0.14) + rand(-12, 12);
    // THE BEAKER at the foot of the window — the same one, drawn by the
    // same script (beaker.js), as the house's own page has at the foot of
    // its drip.
    const floor = H - Math.max(26, H * 0.05);
    const beaker = window.Beaker ? window.Beaker.make({ width: Math.max(44, Math.min(66, W * 0.045)), fill: BEAKER_FILL, spillMost: BEAKER_SPILL_MOST, wet: DRIP_INK }) : null;
    const top = beaker ? floor - beaker.height : floor;
    const g = (2 * (top - 12)) / (DRIP_FALL * DRIP_FALL);
    const drops = [];
    let next = 500;
    return {
      draw(c, age, a) {
        const wet = (k) => "rgba(" + DRIP_INK + "," + (k * a) + ")";
        // A drop is born at the top every so often: it gathers, then
        // lets go.
        if (age >= next) {
          drops.push({ born: age, hang: rand(DRIP_HANG[0], DRIP_HANG[1]) });
          next = age + rand(DRIP_EVERY[0], DRIP_EVERY[1]);
        }
        // What clings along the top edge, always.
        c.fillStyle = wet(0.4);
        c.beginPath(); c.ellipse(x, 0, 6, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 0.6, 0, 1.2, 9);
        const surface = beaker ? beaker.surface(floor) : floor;
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i], t = age - d.born;
          if (t < d.hang) {
            const r = 1 + 2.6 * ease(t / d.hang);
            c.fillStyle = wet(0.5);
            c.beginPath(); c.ellipse(x, 9 + r, r * 0.85, r * 1.1, 0, 0, Math.PI * 2); c.fill();
            continue;
          }
          const f = t - d.hang;
          const y = 12 + 0.5 * g * f * f;
          if (y >= surface) {
            drops.splice(i, 1);
            if (beaker) beaker.land(age);
            continue;
          }
          if (window.Beaker) window.Beaker.drop(c, x, y, a, g * f * 6, 1, DRIP_INK);
        }
        if (beaker) beaker.draw(c, x, floor, age, a, 1);
      },
    };
  }

  // ---------- TALE PARFUMS: doodles, drawing themselves in ----------
  const DOODLES = {
    star: () => { const p = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 20 : 48; const t = -Math.PI / 2 + (i * Math.PI) / 5; p.push([50 + Math.cos(t) * r, 52 + Math.sin(t) * r]); } return [p]; },
    heart: () => { const p = []; for (let i = 0; i <= 28; i++) { const t = (i / 28) * Math.PI * 2; p.push([50 + 16 * Math.pow(Math.sin(t), 3) * 2.4, 48 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.4]); } return [p]; },
    moon: () => { const p = []; for (let i = 0; i <= 20; i++) { const t = -Math.PI / 2 + (i / 20) * Math.PI; p.push([50 + Math.cos(t) * 40, 50 + Math.sin(t) * 40]); } for (let i = 20; i >= 0; i--) { const t = -Math.PI / 2 + (i / 20) * Math.PI; p.push([40 + Math.cos(t) * 26, 50 + Math.sin(t) * 40]); } return [p]; },
    spiral: () => { const p = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 5; const r = 4 + i * 1.05; p.push([50 + Math.cos(t) * r, 50 + Math.sin(t) * r]); } return [p]; },
    flower: () => { const s = []; for (let k = 0; k < 5; k++) { const p = []; const c = (k / 5) * Math.PI * 2; for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI * 2; const x = 18 + Math.cos(t) * 16, y = Math.sin(t) * 9; p.push([50 + Math.cos(c) * x - Math.sin(c) * y, 50 + Math.sin(c) * x + Math.cos(c) * y]); } s.push(p); } return s; },
    sparkle: () => [[[50, 8], [50, 92]], [[8, 50], [92, 50]], [[24, 24], [76, 76]], [[76, 24], [24, 76]]],
    drop: () => { const p = [[50, 10]]; for (let i = 0; i <= 16; i++) { const t = Math.PI * (i / 16); p.push([50 + Math.cos(t) * 24, 62 + Math.sin(t) * 24]); } p.push([50, 10]); return [p]; },
  };
  function doodle() {
    const size = rand(34, 64);
    const at = spot(size * 0.6);
    if (!at) return null;
    const name = pick(Object.keys(DOODLES));
    const strokes = DOODLES[name]().map((line) => line.map(([x, y]) => [x + rand(-2.4, 2.4), y + rand(-2.4, 2.4)]));
    const fill = name === "heart" ? TALE_PEACH : name === "flower" || name === "drop" ? TALE_GREEN : null;
    const tilt = rand(-0.3, 0.3);
    return {
      life: rand(5000, 7500),
      draw(c, age, a) {
        const drawn = ease(age / 1100);
        c.save();
        c.translate(at.x, at.y);
        c.rotate(tilt);
        c.scale(size / 100, size / 100);
        c.translate(-50, -50);
        if (fill) {
          c.fillStyle = "rgba(" + fill + "," + (0.8 * a * drawn) + ")";
          strokes.forEach((line) => { c.beginPath(); line.forEach(([x, y], k) => (k ? c.lineTo(x + 3, y + 3) : c.moveTo(x + 3, y + 3))); c.fill(); });
        }
        c.strokeStyle = "rgba(43, 38, 34," + (0.8 * a) + ")";
        c.lineWidth = 2.6 * 100 / size;
        c.lineCap = "round";
        c.lineJoin = "round";
        strokes.forEach((line) => {
          const upto = Math.max(1, Math.round(line.length * drawn));
          c.beginPath();
          for (let k = 0; k < upto; k++) (k ? c.lineTo : c.moveTo).call(c, line[k][0], line[k][1]);
          c.stroke();
        });
        c.restore();
      },
    };
  }

  // ---------- TOMBSTONE: epitaphs chiselled and weathering, roots, flowers ----------
  // It was stones standing up out of mist for a round; the owner asked
  // for "something different". So: the house's own five names cut into
  // the wall letter by letter, as an epitaph is, and worn away again;
  // and roots creeping in from the edges of the page with small red
  // flowers opening at their tips — the house's card for Evergrow,
  // "Fade and flourish, forever growing".
  //
  // EACH NAME IS CUT ONCE, in the house's own order, and never twice while
  // the house is rested on — the owner's "the writing of each of the
  // fragrances once, not at random ... i dont want duplicate names". They
  // were picked at random for a round, and the same name stood on the
  // wall twice. `epitaphsLeft` is filled again every time the house is
  // rested on afresh (see `start`).
  const NAME_APART = 40;         // px, the least room between two names on the wall
  const EPITAPHS = ["3 Feet 5", "Evergrow", "No Need to Come By", "Sing at My Funeral", "Sweet Coffin"];
  let epitaphsLeft = EPITAPHS.slice();
  let readAround = [];
  function epitaph() {
    // Never a name that is still on the wall, even fading from a moment
    // ago when the house was last rested on.
    const words = epitaphsLeft.find((n) => !things.some((t) => t.words === n));
    if (!words) return null;
    const big = rand(22, 36);
    const wide = words.length * big * 0.56;
    // A NAME IS KEPT OFF THE HOUSES, although everything else here may
    // pass behind them: a name half hidden behind a picture has not been
    // written. `readAround` is the boxes of the houses on the page, handed
    // in by the page that asked for the motifs.
    let at = null, placed = null;
    for (let i = 0; i < 24 && !at; i++) {
      const tryAt = spot(Math.max(wide / 2, 30));
      if (!tryAt || tryAt.x - wide / 2 < 8 || tryAt.x + wide / 2 > W - 8) continue;
      const box = { left: tryAt.x - wide / 2 - 12, right: tryAt.x + wide / 2 + 12, top: tryAt.y - big, bottom: tryAt.y + big };
      if (readAround.some((r) => box.left < r.right && box.right > r.left && box.top < r.bottom && box.bottom > r.top)) continue;
      // AND OFF EVERY OTHER NAME, by a clear margin — the owner sent a
      // picture of "Evergrow" written into "No Need to Come By". Every
      // name standing, fading ones included, keeps NAME_APART round it.
      const near = things.some((t) => t.words && t.box &&
        box.left < t.box.right + NAME_APART && box.right > t.box.left - NAME_APART &&
        box.top < t.box.bottom + NAME_APART && box.bottom > t.box.top - NAME_APART);
      if (near) continue;
      at = tryAt;
      placed = box;
    }
    if (!at) return null;
    // Only taken off the list once it has found somewhere to stand.
    epitaphsLeft.splice(epitaphsLeft.indexOf(words), 1);
    const rule = Math.random() < 0.6;
    return {
      words: words,
      box: placed,
      life: rand(5200, 7600),
      draw(c, age, a) {
        // Cut in a letter at a time, and worn away evenly at the end.
        const cut = Math.min(words.length, Math.floor(age / 85));
        const shown = words.slice(0, cut);
        c.save();
        c.font = "italic " + big.toFixed(0) + "px Georgia, 'Times New Roman', serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        // The cut: a dark stroke with a pale edge under it, which is how
        // letters cut into stone read.
        c.fillStyle = "rgba(255,255,255," + (0.8 * a) + ")";
        c.fillText(shown, at.x + 0.8, at.y + 1);
        c.fillStyle = "rgba(" + INK + "," + (0.62 * a) + ")";
        c.fillText(shown, at.x, at.y);
        if (rule && cut === words.length) {
          const half = Math.min(wide / 2, 90) * ease((age - words.length * 85) / 600);
          c.strokeStyle = "rgba(" + INK + "," + (0.35 * a) + ")";
          c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(at.x - half, at.y + big * 0.8);
          c.lineTo(at.x + half, at.y + big * 0.8);
          c.stroke();
        }
        c.restore();
      },
    };
  }
  function roots() {
    // In from one of the four edges, mostly the bottom.
    const edge = Math.random() < 0.55 ? "bottom" : pick(["left", "right", "top"]);
    let x, y, dir;
    if (edge === "bottom") { x = rand(0, W); y = H + 4; dir = -Math.PI / 2; }
    // From the top, from the very top edge of the window — the owner's
    // picture showed them starting below it, where the chrome's band ends.
    else if (edge === "top") { x = rand(0, W); y = -4; dir = Math.PI / 2; }
    else if (edge === "left") { x = -4; y = rand(CHROME, H); dir = 0; }
    else { x = W + 4; y = rand(CHROME, H); dir = Math.PI; }
    // The whole root is worked out at birth, as segments with the time
    // each is reached; drawing it is drawing the segments reached so far.
    const segs = [];
    const tips = [];
    const grow = (px, py, d, len, width, at, depth) => {
      let cx = px, cy = py, t = at;
      const steps = Math.round(len / 7);
      for (let s = 0; s < steps; s++) {
        d += (Math.random() - 0.5) * 0.5;
        const nx = cx + Math.cos(d) * 7, ny = cy + Math.sin(d) * 7;
        segs.push({ x0: cx, y0: cy, x1: nx, y1: ny, t, w: width * (1 - s / steps * 0.7) });
        cx = nx; cy = ny; t += 38;
        if (depth < 3 && Math.random() < 0.09) {
          grow(cx, cy, d + (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.1), len * rand(0.35, 0.6), width * 0.6, t, depth + 1);
        }
      }
      tips.push({ x: cx, y: cy, t, bloom: Math.random() < 0.55 });
    };
    grow(x, y, dir, rand(140, 300), rand(1.6, 2.6), 0, 0);
    return {
      flowers: tips,   // where its petals fall from — see petal()
      life: rand(7000, 9500),
      draw(c, age, a) {
        c.lineCap = "round";
        for (const s of segs) {
          if (s.t > age) continue;
          if (!clearOf((s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, 2)) continue;
          c.strokeStyle = "rgba(92, 70, 52," + (0.7 * a) + ")";
          c.lineWidth = s.w;
          c.beginPath();
          c.moveTo(s.x0, s.y0);
          c.lineTo(s.x1, s.y1);
          c.stroke();
        }
        for (const tip of tips) {
          if (!tip.bloom || tip.t > age || !clearOf(tip.x, tip.y, 6)) continue;
          const open = ease((age - tip.t) / 900);
          for (let k = 0; k < 5; k++) {
            const pa = (k / 5) * Math.PI * 2 + tip.x;
            c.fillStyle = "rgba(" + PETAL + "," + (0.78 * a) + ")";
            c.beginPath();
            c.ellipse(tip.x + Math.cos(pa) * 3 * open, tip.y + Math.sin(pa) * 3 * open, 2.8 * open, 1.6 * open, pa, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = "rgba(60, 30, 20," + (0.8 * a) + ")";
          c.fillRect(tip.x - 1, tip.y - 1, 2, 2);
        }
      },
    };
  }
  // PETALS, falling from the flowers and gathering on the ground. The
  // owner: "I want some of the red petals to fall, and then not be removed
  // Unless hovered away, so that if you keep hovering tombstone, then the
  // red petals will eventually be collected on the ground." So a petal has
  // no life of its own: it leaves an open flower, tumbles down, and once
  // it has landed it lies there until the house is left. `heap` is how
  // high the pile already stands every few pixels across, so a petal
  // lands ON the ones before it and the pile grows into a drift along the
  // foot of the window.
  const HEAP_STEP = 6;
  let heap = [];
  function petal() {
    const now = performance.now();
    const open = [];
    things.forEach((t) => {
      if (!t.flowers || t.ending) return;
      t.flowers.forEach((tip) => { if (tip.bloom && now - t.born > tip.t + 900 && tip.y < H) open.push(tip); });
    });
    if (!open.length) return null;
    const from = pick(open);
    const fall = rand(40, 70), sway = rand(8, 20), spin = rand(1.5, 3.5), phase = rand(0, 6.28);
    const tilt = rand(0, Math.PI);
    let landed = null;
    return {
      petal: true,
      draw(c, age, a) {
        let x, y, turn, flat;
        if (landed) {
          ({ x, y, turn } = landed);
          flat = 1;
        } else {
          const s = age / 1000;
          y = Math.max(from.y, 0) + s * fall;
          x = Math.min(W - 2, Math.max(2, from.x + Math.sin(s * 1.6 + phase) * sway));
          turn = tilt + s * spin;
          flat = Math.abs(Math.cos(s * spin * 1.3 + phase));
          const b = Math.floor(x / HEAP_STEP);
          const ground = H - 3 - (heap[b] || 0);
          if (y >= ground) {
            // It lands on the pile, and the pile rises there — a little
            // to either side as well, so it heaps rather than stacks.
            heap[b] = (heap[b] || 0) + 1.2;
            heap[b - 1] = (heap[b - 1] || 0) + 0.45;
            heap[b + 1] = (heap[b + 1] || 0) + 0.45;
            landed = { x, y: ground, turn: rand(-0.6, 0.6) };
            ({ x, y, turn } = landed);
            flat = 1;
          }
        }
        c.fillStyle = "rgba(" + PETAL + "," + ((landed ? 0.72 : 0.82) * a) + ")";
        c.beginPath();
        c.ellipse(x, y, 3.1, 1.8 * Math.max(0.22, flat), turn, 0, Math.PI * 2);
        c.fill();
      },
    };
  }
  function soil() {
    const at = spot(2, H * 0.3, H);
    if (!at) return null;
    return {
      life: rand(3000, 5000),
      draw(c, age, a) {
        c.fillStyle = "rgba(92, 70, 52," + (0.45 * a) + ")";
        c.fillRect(at.x + Math.sin(age / 600 + at.y) * 3, at.y - age * 0.006, 1.6, 1.6);
      },
    };
  }

  // ---------- QIMU & MUSICIANS: music, written out on short staves and loose on the page ----------
  // The owner, first: "make it so that it is 5 lines like music sheets,
  // and add ephemeral notes to that"; then "more subtle and way less
  // movement"; then "make it complex ... sometimes they are in the 5 line
  // grid, while othertimes it is just complex notes popping up
  // spontaneously". And then, of the staves that ran the width of the
  // window with every marking a score can carry: "make it shorter lines,
  // so it dosnt span across the entire page ... more subtle ... not so in
  // your face. also remove all the dynamic elements of the compositions,
  // such as the trills and whatnot." So:
  //
  //   THE STAVES are short — a phrase, a few bars, never more than about
  //   a third of the window — and written out left to right as a score is
  //   read: a clef, a key signature, and a TIME SIGNATURE picked from the
  //   ones music actually uses (`TIMES` — 4/4 among them, but only among
  //   them), changing at a bar now and then. In the bars, the texture that
  //   makes it look complex: beamed runs of semiquavers and
  //   demisemiquavers, tuplets of three, five, six and seven, chords with
  //   their accidentals, clusters, rests, a slur over a run. Now and then
  //   two staves braced — a piano's grand staff.
  //   NO EXPRESSION MARKS: no dynamics or hairpins, no trills, no grace
  //   notes, no accents or staccato, no fermatas, no rolled chords, no
  //   tempo words. The notes, their rhythm, and the lines they stand on.
  //   THE LOOSE MUSIC is a run, a flurry of small notes or a few chords
  //   with no staff, popping up on the page and gone again.
  //   THE TWO TAKE TURNS (`QIMU_STAVES_MS`, `QIMU_LOOSE_MS`).
  //
  // All of it faint (`QIMU_LINE`, `QIMU_INK`) and still: a thing is
  // written where it stands and stays there until it goes. All of it
  // drawn here in paths, because a music font cannot be counted on.
  const staves = [];
  const GAP = 7;                         // between one line of a stave and the next
  const QIMU_STAVES_MS = 9000;
  const QIMU_LOOSE_MS = 6000;
  const QIMU_WRITE_MS = 2600;            // a stave written out, end to end
  const QIMU_LINE = 0.18;                // how strong a stave's lines are
  const QIMU_INK = 0.3;                  // and what is written on it
  const QIMU_LONG = [0.2, 0.32];         // a stave's length, of the window's width
  let qimuSince = 0;
  const qimuMode = () => ((performance.now() - qimuSince) % (QIMU_STAVES_MS + QIMU_LOOSE_MS)) < QIMU_STAVES_MS ? "staves" : "loose";

  // THE ENGRAVER'S STROKES
  const RX = GAP * 0.6, RY = GAP * 0.42;
  const yAt = (top, p) => top + 4 * GAP - p * GAP / 2;   // p: 0 the bottom line, 8 the top
  const mLine = (c, x1, y1, x2, y2, w) => { c.lineWidth = w || 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  function mHead(c, x, y, open, k) {
    k = k || 1;
    c.beginPath();
    c.ellipse(x, y, RX * k, RY * k, -0.35, 0, Math.PI * 2);
    if (open) { c.lineWidth = 1; c.stroke(); } else c.fill();
  }
  function mBeam(c, x1, y1, x2, y2, n, up, k) {
    k = k || 1;
    for (let i = 0; i < n; i++) {
      const d = (up ? 1 : -1) * i * GAP * 0.55 * k, h = 1.1 * k;
      c.beginPath();
      c.moveTo(x1, y1 + d - h); c.lineTo(x2, y2 + d - h); c.lineTo(x2, y2 + d + h); c.lineTo(x1, y1 + d + h);
      c.closePath();
      c.fill();
    }
  }
  function mFlag(c, x, y, up, n) {
    c.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const y0 = y + (up ? 1 : -1) * i * GAP * 0.6;
      c.beginPath();
      c.moveTo(x, y0);
      c.bezierCurveTo(x + GAP * 0.9, y0 + (up ? 1 : -1) * GAP * 0.8, x + GAP * 0.9, y0 + (up ? 1 : -1) * GAP * 1.6, x + GAP * 0.5, y0 + (up ? 1 : -1) * GAP * 2.2);
      c.stroke();
    }
  }
  function mSharp(c, x, y) {
    mLine(c, x - 1.3, y - GAP * 1.2, x - 1.3, y + GAP * 1.3, 0.8);
    mLine(c, x + 1.3, y - GAP * 1.35, x + 1.3, y + GAP * 1.15, 0.8);
    mLine(c, x - 2.6, y - GAP * 0.35 + 0.9, x + 2.6, y - GAP * 0.35 - 0.9, 1.6);
    mLine(c, x - 2.6, y + GAP * 0.4 + 0.9, x + 2.6, y + GAP * 0.4 - 0.9, 1.6);
  }
  function mFlat(c, x, y) {
    mLine(c, x - 1.6, y - GAP * 1.8, x - 1.6, y + GAP * 0.5, 0.9);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x - 1.6, y + GAP * 0.5);
    c.bezierCurveTo(x + 4, y - GAP * 0.1, x + 2.2, y - GAP * 0.9, x - 1.6, y - GAP * 0.1);
    c.stroke();
  }
  function mNatural(c, x, y) {
    mLine(c, x - 1.4, y - GAP * 1.3, x - 1.4, y + GAP * 0.5, 0.8);
    mLine(c, x + 1.4, y - GAP * 0.5, x + 1.4, y + GAP * 1.3, 0.8);
    mLine(c, x - 1.4, y - GAP * 0.3 + 0.7, x + 1.4, y - GAP * 0.3 - 0.7, 1.5);
    mLine(c, x - 1.4, y + GAP * 0.35 + 0.7, x + 1.4, y + GAP * 0.35 - 0.7, 1.5);
  }
  const ACCIDENTAL = [mSharp, mFlat, mNatural];
  function mRest(c, x, top, kind) {
    const y = top + GAP * 2;
    if (kind === "q") {
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x - 1.3, y - GAP * 1.5); c.lineTo(x + 1.9, y - GAP * 0.7); c.lineTo(x - 1.3, y + GAP * 0.1);
      c.lineTo(x + 1.9, y + GAP * 0.8); c.quadraticCurveTo(x - 2.6, y + GAP * 0.9, x, y + GAP * 1.6);
      c.stroke();
    } else if (kind === "h") {
      c.fillRect(x - 3.5, y - GAP * 0.5, 7, GAP * 0.45);
    } else {
      const dots = kind === "s" ? 2 : 1;
      for (let i = 0; i < dots; i++) {
        c.beginPath(); c.arc(x - 1.3 + i * 1.1, y - GAP * 0.5 + i * GAP * 0.8, 1.4, 0, Math.PI * 2); c.fill();
      }
      mLine(c, x + 2.3, y - GAP * 0.7, x - 0.9, y + GAP * 1.2 + (dots - 1) * GAP * 0.7, 1);
    }
  }
  function mSlur(c, x1, y1, x2, y2, below) {
    const lift = (below ? 1 : -1) * Math.min(GAP * 1.6, 4 + (x2 - x1) * 0.12);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x1, y1);
    c.bezierCurveTo(x1 + (x2 - x1) * 0.25, y1 + lift, x1 + (x2 - x1) * 0.75, y2 + lift, x2, y2);
    c.stroke();
  }
  function mText(c, t, x, y, px, style) {
    c.font = (style || "bold") + " " + px + "px Georgia, 'Times New Roman', serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(t, x, y);
  }
  function mTuplet(c, x1, x2, y, label, up) {
    const d = up ? 3 : -3, mid = (x1 + x2) / 2;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x1, y + d); c.lineTo(x1, y); c.lineTo(mid - 5, y);
    c.moveTo(mid + 5, y); c.lineTo(x2, y); c.lineTo(x2, y + d);
    c.stroke();
    mText(c, label, mid, y, 9, "italic");
  }
  function mTime(c, t, x, top) {
    mText(c, t[0], x, top + GAP, GAP * 2.1);
    mText(c, t[1], x, top + GAP * 3, GAP * 2.1);
  }
  function mTreble(c, x, top) {
    const G = GAP;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x - 0.35 * G, top + 5.4 * G);
    c.quadraticCurveTo(x + 0.4 * G, top + 5.8 * G, x + 0.2 * G, top + 4.6 * G);
    c.lineTo(x - 0.05 * G, top - 1.2 * G);
    c.bezierCurveTo(x + 0.1 * G, top - 2.2 * G, x + 0.9 * G, top - 1.4 * G, x + 0.3 * G, top - 0.2 * G);
    c.bezierCurveTo(x - 0.4 * G, top + 1.0 * G, x - 1.0 * G, top + 1.9 * G, x - 0.9 * G, top + 2.9 * G);
    c.bezierCurveTo(x - 0.8 * G, top + 4.0 * G, x + 0.9 * G, top + 4.0 * G, x + 0.9 * G, top + 3.0 * G);
    c.bezierCurveTo(x + 0.9 * G, top + 2.1 * G, x - 0.3 * G, top + 2.0 * G, x - 0.25 * G, top + 2.9 * G);
    c.stroke();
    c.beginPath(); c.arc(x - 0.35 * G, top + 5.3 * G, 0.3 * G, 0, Math.PI * 2); c.fill();
  }
  function mBass(c, x, top) {
    const G = GAP;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(x - 0.5 * G, top + 1.0 * G);
    c.bezierCurveTo(x - 0.5 * G, top - 0.1 * G, x + 1.1 * G, top - 0.2 * G, x + 1.0 * G, top + 1.2 * G);
    c.bezierCurveTo(x + 0.9 * G, top + 2.4 * G, x, top + 3.2 * G, x - 0.7 * G, top + 3.6 * G);
    c.stroke();
    c.beginPath(); c.arc(x - 0.45 * G, top + 1.0 * G, 0.32 * G, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 1.5 * G, top + 0.5 * G, 1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 1.5 * G, top + 1.5 * G, 1, 0, Math.PI * 2); c.fill();
  }

  // THE COMPOSER. Every mark is put down with the x it stands at, so a
  // stave can be written out left to right: a mark is drawn once the pen
  // has reached it. `staff` false is loose music, which has no lines to
  // stand on and so no ledger lines either.
  function writer(top, staff, k) {
    k = k || 1;
    const marks = [];
    const put = (x, fn) => marks.push({ x: x, fn: fn });
    const ledger = (x, p) => {
      if (!staff) return;
      for (let q = -2; q >= p; q -= 2) { const y = yAt(top, q); put(x, (c) => mLine(c, x - RX * 1.7, y, x + RX * 1.7, y, 0.8)); }
      for (let q = 10; q <= p; q += 2) { const y = yAt(top, q); put(x, (c) => mLine(c, x - RX * 1.7, y, x + RX * 1.7, y, 0.8)); }
    };
    const clampP = (p) => Math.max(staff ? -3 : -3, Math.min(staff ? 11 : 11, p));

    // A BEAMED RUN, stepping and leaping, in semiquavers or quicker.
    function run(x, n, beams, p0) {
      const dx = GAP * 1.75 * k;
      const ps = [];
      let p = p0;
      for (let i = 0; i < n; i++) {
        ps.push(p);
        p = clampP(p + pick([-1, -1, 1, 1, 1, -2, 2, 3, -3, 1, -1, 4]));
      }
      const up = ps.reduce((a, b) => a + b, 0) / n < 4;
      const xs = [], ys = ps.map((q) => yAt(top, q));
      let at = x;
      ps.forEach((q, i) => {
        if (Math.random() < 0.15) {
          const acc = pick(ACCIDENTAL), ax = at + 2, ay = ys[i];
          put(ax, (c) => acc(c, ax, ay));
          at += 7;
        }
        xs.push(at + RX);
        at += dx;
      });
      const L = GAP * 3.3 * k;
      const sx = xs.map((hx) => hx + (up ? RX * 0.92 : -RX * 0.92) * k);
      let b1 = up ? ys[0] - L : ys[0] + L, b2 = up ? ys[n - 1] - L : ys[n - 1] + L;
      if (Math.abs(b2 - b1) > GAP) b2 = b1 + Math.sign(b2 - b1) * GAP;
      const beamY = (vx) => b1 + (b2 - b1) * (vx - sx[0]) / Math.max(1, sx[n - 1] - sx[0]);
      let shift = 0;
      sx.forEach((vx, i) => {
        const room = up ? beamY(vx) - (ys[i] - L * 0.8) : (ys[i] + L * 0.8) - beamY(vx);
        if (room > shift) shift = room;
      });
      b1 += up ? -shift : shift; b2 += up ? -shift : shift;
      xs.forEach((hx, i) => {
        const hy = ys[i], vx = sx[i];
        ledger(hx, ps[i]);
        put(hx, (c) => { mHead(c, hx, hy, false, k); mLine(c, vx, hy, vx, beamY(vx), 0.9); });
      });
      const last = xs[n - 1];
      put(last, (c) => mBeam(c, sx[0], beamY(sx[0]), sx[n - 1], beamY(sx[n - 1]), beams, up, k));
      const odd = n % 2 === 1 || n === 6;
      if (odd || Math.random() < 0.2) {
        const ty = beamY((sx[0] + sx[n - 1]) / 2) + (up ? -GAP * (1.4 + beams * 0.5) : GAP * (1.4 + beams * 0.5));
        put(last, (c) => mTuplet(c, sx[0], sx[n - 1], ty, String(n), up));
      }
      if (Math.random() < 0.4) {
        const sy = Math.max(...ys) + GAP * 1.5, uy = Math.min(...ys) - GAP * 1.5;
        put(last, (c) => mSlur(c, xs[0], up ? sy : uy, last, up ? sy : uy, up));
      }
      return at + GAP * 0.6;
    }
    // A CHORD, three or four notes deep, with its accidentals stacked
    // before it.
    function chord(x, p0) {
      const n = 3 + (Math.random() < 0.5 ? 1 : 0);
      const ps = [];
      let p = clampP(p0);
      for (let i = 0; i < n; i++) { ps.push(p); p = clampP(p + pick([2, 2, 3, 1])); }
      const open = Math.random() < 0.3;
      let at = x;
      ps.filter(() => Math.random() < 0.3).forEach((q) => {
        const acc = pick(ACCIDENTAL), ax = at + 2, ay = yAt(top, q);
        put(ax, (c) => acc(c, ax, ay));
        at += 6;
      });
      const hx = at + RX;
      const up = ps.reduce((a, b) => a + b, 0) / n < 4;
      const lo = yAt(top, ps[0]), hi = yAt(top, ps[n - 1]);
      const vx = hx + (up ? RX * 0.92 : -RX * 0.92);
      const tip = up ? hi - GAP * 3.3 : lo + GAP * 3.3;
      ps.forEach((q, i) => {
        // A second in the chord stands its head on the other side of
        // the stem, as it is engraved.
        const nx = i && q - ps[i - 1] === 1 ? hx + (up ? RX * 1.85 : -RX * 1.85) : hx;
        ledger(nx, q);
        put(hx, (c) => mHead(c, nx, yAt(top, q), open));
      });
      put(hx, (c) => mLine(c, vx, up ? lo : hi, vx, tip, 0.9));
      if (!open && Math.random() < 0.35) put(hx, (c) => mFlag(c, vx, tip, up, pick([1, 2])));
      return hx + GAP * 3 + (open ? GAP : 0);
    }
    function rest(x) {
      const kind = pick(["q", "e", "s", "h"]);
      put(x + 3, (c) => mRest(c, x + 3, top, kind));
      return x + GAP * 2;
    }
    // A CLUSTER: seconds piled up, heads either side of the stem.
    function cluster(x, p0) {
      const n = 4 + Math.floor(Math.random() * 3);
      const hx = x + RX * 2;
      for (let i = 0; i < n; i++) {
        const q = p0 + i, nx = i % 2 ? hx + RX * 1.85 : hx;
        put(hx, (c) => mHead(c, nx, yAt(top, q), false));
      }
      const vx = hx + RX * 0.92;
      put(hx, (c) => mLine(c, vx, yAt(top, p0), vx, yAt(top, p0 + n - 1) - GAP * 3, 0.9));
      return hx + GAP * 3.5;
    }
    return { marks, put, run, chord, rest, cluster };
  }

  // A STAVE, or a grand staff: short, with a clef, a key, a time that
  // changes now and then, and bars of texture.
  // Time signatures music actually uses, simple and compound, regular
  // and not — 4/4 is one of them and no more likely than any other.
  const TIMES = [["4", "4"], ["3", "4"], ["2", "4"], ["5", "4"], ["6", "8"], ["7", "8"], ["9", "8"], ["12", "8"],
    ["5", "8"], ["3", "8"], ["2", "2"], ["7", "4"], ["6", "4"], ["3", "2"]];
  function stave() {
    if (qimuMode() !== "staves") return null;
    // Forget the staves that have gone.
    for (let i = staves.length - 1; i >= 0; i--) if (!things.includes(staves[i])) staves.splice(i, 1);
    const grand = Math.random() < 0.3;
    const tall = grand ? GAP * 14 : GAP * 4;
    const long = Math.max(170, Math.min(460, W * rand(QIMU_LONG[0], QIMU_LONG[1])));
    // Kept clear of the other staves standing, so two never print over
    // each other.
    let y = null, x0 = 0;
    for (let i = 0; i < 16; i++) {
      const tryY = rand(CHROME + 30, H - 40 - tall), tryX = rand(10, Math.max(20, W - long - 10));
      if (staves.every((s) => s.ending || tryY > s.y + s.tall + GAP * 7 || tryY + tall + GAP * 7 < s.y ||
        tryX > s.x1 + 30 || tryX + long + 30 < s.x0)) { y = tryY; x0 = tryX; break; }
    }
    if (y === null) return null;
    const x1 = x0 + long;
    const tops = grand ? [y, y + GAP * 10] : [y];
    const writers = tops.map((top) => writer(top, true));
    // The head of it: clef, key, time.
    const head = x0 + 10;
    const key = Math.floor(Math.random() * 5), sharps = Math.random() < 0.5;
    const time = pick(TIMES);
    tops.forEach((top, i) => {
      const w = writers[i];
      const bass = grand && i === 1;
      w.put(head, (c) => (bass ? mBass(c, head + 4, top) : mTreble(c, head + 5, top)));
      const order = sharps ? [8, 5, 9, 6, 3] : [4, 7, 3, 6, 2];
      for (let k = 0; k < key; k++) {
        const kx = head + 20 + k * 6, ky = yAt(top, order[k] - (bass ? 2 : 0));
        w.put(kx, (c) => (sharps ? mSharp(c, kx, ky) : mFlat(c, kx, ky)));
      }
      const tx = head + 25 + key * 6;
      w.put(tx, (c) => mTime(c, time, tx, top));
    });
    const start = head + 36 + key * 6;
    // THE BARS, the same for every stave of it.
    const bars = [];
    for (let bx = start + rand(90, 140); bx < x1 - 30; bx += rand(95, 150)) bars.push(bx);
    const edges = [start].concat(bars, [x1 - 10]);
    for (let m = 0; m < edges.length - 1; m++) {
      const from = edges[m] + 8, to = edges[m + 1] - 8;
      // A time that changes at the bar, now and then — the same in every
      // stave of a grand staff, as it is written.
      const change = m && Math.random() < 0.22 ? pick(TIMES) : null;
      tops.forEach((top, i) => {
        const w = writers[i];
        const low = grand && i === 1;
        let x = from;
        if (change) {
          const tx = x + 5;
          w.put(tx, (c) => mTime(c, change, tx, top));
          x += 16;
        }
        let guard = 0;
        while (x < to - 20 && guard++ < 24) {
          const room = to - x, r = Math.random();
          const p0 = low ? Math.floor(rand(-2, 5)) : Math.floor(rand(1, 9));
          if (r < 0.5 && room > GAP * 7) {
            const n = Math.min(pick([4, 5, 6, 7, 8, 3]), Math.floor(room / (GAP * 1.9)));
            if (n >= 3) { x = w.run(x, n, pick([2, 2, 3, 1]), p0); continue; }
          }
          if (r < 0.78 && room > GAP * 5) { x = w.chord(x, low ? p0 - 2 : p0 - 1); continue; }
          if (r < 0.86 && room > GAP * 5) { x = w.cluster(x, low ? p0 - 2 : p0); continue; }
          if (room > GAP * 2.5) { x = w.rest(x); continue; }
          break;
        }
      });
    }
    const marks = writers.reduce((all, w) => all.concat(w.marks), []);
    const one = {
      y: y, tall: tall, x0: x0, x1: x1,
      life: rand(8000, 11000),
      draw(c, age, a) {
        const reach = x0 + (x1 - x0) * ease(age / QIMU_WRITE_MS);
        c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (QIMU_LINE * a) + ")";
        tops.forEach((top) => {
          for (let k = 0; k < 5; k++) mLine(c, x0, top + k * GAP, reach, top + k * GAP, 0.8);
        });
        // The bars, through both staves of a grand staff, and the brace
        // that holds the two together; a double bar at the end.
        const foot = tops[tops.length - 1] + 4 * GAP;
        bars.forEach((bx) => { if (bx <= reach) mLine(c, bx, y, bx, foot, 0.8); });
        if (grand && reach > head) {
          mLine(c, x0, y, x0, foot, 0.8);
          c.lineWidth = 1.4;
          c.beginPath();
          const bx = x0 - 5, mid = (y + foot) / 2;
          c.moveTo(bx + 3, y);
          c.bezierCurveTo(bx - 3, y + 8, bx + 3, mid - 10, bx - 3, mid);
          c.bezierCurveTo(bx + 3, mid + 10, bx - 3, foot - 8, bx + 3, foot);
          c.stroke();
        }
        if (reach >= x1 - 10) {
          mLine(c, x1 - 10, y, x1 - 10, foot, 0.8);
          mLine(c, x1 - 6, y, x1 - 6, foot, 2.4);
        }
        c.fillStyle = c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (QIMU_INK * a) + ")";
        marks.forEach((m) => { if (m.x <= reach) m.fn(c); });
      },
    };
    staves.push(one);
    return one;
  }

  // LOOSE MUSIC: a passage with no staff, popping up on the page and gone.
  function passage() {
    if (qimuMode() !== "loose") return null;
    const at = spot(50, CHROME + 50, H - 50);
    if (!at) return null;
    const top = at.y - GAP * 2;
    const w = writer(top, false);
    const kind = pick(["run", "run", "flurry", "cluster", "chords"]);
    let x = at.x - GAP * 5;
    if (kind === "run") {
      x = w.run(x, pick([5, 6, 7, 9]), pick([2, 3]), Math.floor(rand(0, 7)));
    } else if (kind === "flurry") {
      // Small notes, many, under one beam.
      const small = writer(top, false, 0.62);
      small.run(x, pick([9, 10, 12]), 3, Math.floor(rand(0, 6)));
      w.marks.push(...small.marks);
    } else if (kind === "cluster") {
      w.cluster(x, Math.floor(rand(0, 4)));
    } else {
      for (let i = 0; i < 3; i++) x = w.chord(x, Math.floor(rand(-1, 6)));
    }
    const marks = w.marks;
    return {
      life: rand(3000, 4800),
      sharp: true,
      draw(c, age, a) {
        // It POPS UP rather than fading slowly in, and it stays where it
        // was put.
        const shown = a * ease(age / 220);
        c.fillStyle = c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (QIMU_INK * shown) + ")";
        marks.forEach((m) => m.fn(c));
      },
    };
  }

  // How often each is born (per second), and how many may stand at once.
  const HOUSES = {
    pineward: [{ make: tree, rate: 2, most: 16 }, { make: needle, rate: 5, most: 50 }],
    // Fewer wells than there were soundings, and much larger.
    adar: [{ make: sounding, rate: 0.45, most: 3, first: 1 }, { make: dust, rate: 22, most: 160 }],
    "almost-human": [{ make: figure, rate: 1.2, most: 6 }, { make: rain, rate: 26, most: 80 }],
    ataraxia: [{ make: band, rate: 0.75, most: 6, first: 2 }],
    grande: [{ make: rise, rate: 90, most: 640 }],
    // One armoire and one drip, standing until the house is left; the
    // armoire first, since the drip stands on whichever side it does not.
    "les-abstraits": [{ make: armoire, rate: 5, most: 1, first: 1 }, { make: drip, rate: 5, most: 1, first: 1 }],
    tale: [{ make: doodle, rate: 2.6, most: 20 }],
    tombstone: [{ make: epitaph, rate: 0.9, most: 5 }, { make: roots, rate: 1.6, most: 11 }, { make: soil, rate: 6, most: 40 },
      { make: petal, rate: 2.6, most: 360 }],
    // `first`: how many are there at once when the house is rested on.
    qimu: [{ make: stave, rate: 0.6, most: 4, first: 2 }, { make: passage, rate: 0.9, most: 4 }],
  };

  // ============================================================
  // THE LOOP — it runs only while there is something to draw
  // ============================================================
  let things = [];
  let house = null;
  let owed = new Map();
  let last = 0;
  let running = false;

  function frame(now) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (house && HOUSES[house]) {
      HOUSES[house].forEach((kind) => {
        const due = (owed.get(kind) || 0) + (kind.rate * dt) / 1000;
        let n = Math.floor(due);
        owed.set(kind, due - n);
        const standing = things.filter((t) => t.kind === kind && !t.ending).length;
        n = Math.min(n, kind.most - standing);
        for (let k = 0; k < n; k++) {
          const one = kind.make();
          if (one) { one.kind = kind; one.born = now; things.push(one); }
        }
      });
    }

    ctx.clearRect(0, 0, W, H);
    // A well not drawn for a moment has gone.
    for (let i = wells.length - 1; i >= 0; i--) if (now - wells[i].seen > 150) wells.splice(i, 1);
    spacetime(ctx);
    things = things.filter((t) => {
      const age = now - t.born;
      // A thing that has lived its life fades on its own clock; one
      // whose house has been left fades on FADE_OUT_MS from where it had
      // got to.
      if (t.life && age > t.life && !t.ending) t.ending = { at: now, from: t.shown || 0, over: 1100 };
      // A thing that arrives by its own means (`sharp`: Almost Human's
      // figures glitch in) is not faded up as well.
      let alpha = t.sharp ? 1 : ease(age / FADE_IN_MS);
      if (t.ending) alpha = t.ending.from * (1 - ease((now - t.ending.at) / t.ending.over));
      else t.shown = alpha;
      if (t.ending && now - t.ending.at >= t.ending.over) {
        if (t.well && wells.includes(t.well)) wells.splice(wells.indexOf(t.well), 1);
        return false;
      }
      if (alpha > 0.002) t.draw(ctx, age, alpha);
      return true;
    });

    if (things.length || house) requestAnimationFrame(frame);
    else { running = false; last = 0; }
  }
  function run() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  window.HouseMotifs = {
    start(key, el, around) {
      if (REDUCE_MOTION) return;
      house = HOUSES[key] ? key : null;
      // A first handful straight away — each still comes up on its own
      // FADE_IN_MS — so the page is not empty for the first second.
      owed = new Map((HOUSES[key] || []).map((kind) => [kind, Math.min(kind.most, Math.max(kind.first || 0, kind.rate * 0.8))]));
      if (key === "tombstone") epitaphsLeft = EPITAPHS.slice();
      // Qimu's music starts on its staves, every time it is rested on.
      if (key === "qimu") qimuSince = performance.now();
      // The pile starts again from the ground once the last one has gone.
      if (!things.some((t) => t.petal)) heap = [];
      readAround = around || [];
      // Handed the house, the motifs keep clear of it; handed nothing,
      // they have the whole page — which is how the Houses view asks for
      // them now that they stand BEHIND the houses rather than over them.
      if (el) {
        const r = el.getBoundingClientRect();
        avoid = { left: r.left - CLEAR, right: r.right + CLEAR, top: r.top - CLEAR, bottom: r.bottom + CLEAR };
      } else {
        avoid = null;
      }
      // What was still fading from another house keeps fading; this
      // house's own come up among it.
      if (house) run();
    },
    // What is standing on the page, by kind — for anything that needs to
    // know (the tests), since the drawing itself cannot be asked.
    census() {
      const out = {};
      things.forEach((t) => { if (!t.ending && t.kind) out[t.kind.make.name] = (out[t.kind.make.name] || 0) + 1; });
      return out;
    },
    // THE FIELD the wells make together, for contact-sheet.js to draw the
    // Houses view through: a function from a point on the window to where
    // it is drawn (`x`, `y`), how big (`s`), how strongly (`a`) and how
    // far turned (`turn`, radians) — or null while there is no well.
    bend() {
      return wells.length ? bendPoint : null;
    },
    stop(now) {
      house = null;
      const t = performance.now();
      things.forEach((one) => {
        if (!one.ending) one.ending = { at: t, from: one.shown || 0, over: now ? 1 : FADE_OUT_MS };
      });
      if (things.length) run();
    },
  };
})();
