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
// own page — Pineward's trees and needles, ADAR's soundings and dust,
// Almost Human's figures that nearly come together and its rain,
// Ataraxia's bands of light, Grande's drift, Les Abstraits' point, line
// and circle, Tale's doodles, Tombstone's names cut
// into the wall and its roots and flowers, and Qimu & Musicians' staves
// with notes coming and going on them.
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
// window.HouseMotifs = { start(key, frame, around), stop(now) } — `around`
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

  // ---------- ADAR: soundings ringing out, dust falling ----------
  function sounding() {
    const at = spot(40);
    if (!at) return null;
    const hole = rand(5, 12);
    return {
      life: rand(4200, 6000),
      draw(c, age, a) {
        // The void: a hole, with a rim of specks round it.
        c.fillStyle = "rgba(" + INK + "," + (0.85 * a) + ")";
        c.beginPath();
        c.arc(at.x, at.y, hole, 0, Math.PI * 2);
        c.fill();
        for (let ring = 0; ring < 3; ring++) {
          const r = hole + ((age / 16 + ring * 46) % 150);
          const fade = 1 - (r - hole) / 150;
          c.strokeStyle = "rgba(" + INK + "," + (0.7 * a * fade) + ")";
          c.lineWidth = 1;
          c.setLineDash([2, 5]);
          c.beginPath();
          c.arc(at.x, at.y, r, 0, Math.PI * 2);
          c.stroke();
        }
        c.setLineDash([]);
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
        c.fillStyle = "rgba(" + INK + "," + (0.7 * a) + ")";
        c.fillRect(at.x + Math.sin(age / 900 + at.y) * 3, at.y + fall * age, size, size);
      },
    };
  }

  // ---------- ALMOST HUMAN: a figure that nearly comes together, rain ----------
  function figure() {
    const h = rand(90, 150);
    const at = spot(h * 0.45, h * 0.5, H - h * 0.5);
    if (!at) return null;
    const specks = [];
    const add = (x, y) => specks.push({ x, y, sx: rand(-1, 1) * h * 0.2, sy: rand(-1, 1) * h * 0.2 });
    const u = h / 100;
    for (let i = 0; i < 26; i++) { const t = (i / 26) * Math.PI * 2; add(Math.cos(t) * 8 * u, -80 * u + Math.sin(t) * 9 * u); }
    for (let i = 0; i < 60; i++) add(rand(-11, 11) * u, rand(-68, -30) * u);
    for (let i = 0; i < 26; i++) { const s = i < 13 ? -1 : 1, k = (i % 13) / 13; add(s * (12 + k * 10) * u, (-64 + k * 34) * u); }
    for (let i = 0; i < 34; i++) { const s = i < 17 ? -1 : 1, k = (i % 17) / 17; add(s * (4 + k * 5) * u, (-30 + k * 30) * u); }
    return {
      life: rand(6000, 8500),
      draw(c, age, a) {
        // It gathers to most of the way home and comes apart again; it
        // never quite arrives, which is the house's name.
        const life = this.life;
        const gather = 0.9 * ease(age / 1500) * (1 - ease((age - (life - 2000)) / 2000));
        c.fillStyle = "rgba(" + INK + "," + (0.8 * a) + ")";
        specks.forEach((s) => {
          c.fillRect(at.x + s.x + s.sx * (1 - gather), at.y + s.y + s.sy * (1 - gather), 1.9, 1.9);
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

  // ---------- ATARAXIA: bands of light crossing, a crest along each ----------
  // EMPHASISED at the owner's word ("emphasize the ataraxia effect"): more
  // bands, their specks denser, heavier and darker, a soft haze laid
  // along each band's length, and a brighter, longer crest travelling
  // along it — so the bands read across the whole page rather than as a
  // few grey threads.
  // FEWER AND MORE SIGNIFICANT, the round after: "slightly less frequent
  // with the streaks, but make the streaks more significant". Under half
  // as many are born and fewer stand at once, but each is half as wide
  // again, denser, darker, lingers longer, and carries a heavier haze and
  // a longer crest.
  function band() {
    const angle = rand(6, 26) * (Math.random() < 0.5 ? -1 : 1) * Math.PI / 180;
    const cy = rand(H * 0.1, H * 0.9);
    const len = Math.hypot(W, H) + 200;
    const wide = rand(22, 34);
    const specks = [];
    for (let s = 0; s < len; s += rand(0.9, 2.2)) specks.push({ s, off: rand(-wide, wide) * Math.random(), size: rand(1.5, 3.6) });
    const speed = rand(0.28, 0.5);
    return {
      life: rand(8500, 12000),
      draw(c, age, a) {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const crest = (age * speed) % (len + 400) - 200;
        // THE HAZE, one soft stroke the length of the band.
        const x0 = -100, y0 = cy - (len / 2) * sin;
        c.strokeStyle = "rgba(52, 53, 58," + (0.1 * a) + ")";
        c.lineWidth = wide * 1.7;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x0 + len * cos, y0 + len * sin);
        c.stroke();
        specks.forEach((p) => {
          const x = x0 + p.s * cos - p.off * sin, y = y0 + p.s * sin + p.off * cos;
          if (!clearOf(x, y, 2)) return;
          const glow = Math.exp(-Math.pow((p.s - crest) / 320, 2));
          c.fillStyle = "rgba(34, 35, 40," + (a * Math.min(1, 0.42 + 0.7 * glow)) + ")";
          const size = p.size * (1 + glow * 0.75);
          c.fillRect(x, y, size, size);
        });
      },
    };
  }

  // ---------- GRANDE PARFUMS: the drift, rising ----------
  function drift() {
    const at = spot(3, H * 0.2, H + 20);
    if (!at) return null;
    const mote = Math.random() < 0.07;
    const rise = rand(0.012, 0.03), size = mote ? rand(2.8, 4) : rand(1.1, 2);
    return {
      life: rand(5000, 9000),
      draw(c, age, a) {
        const breathe = 0.55 + 0.45 * Math.sin(age / 700 + at.x);
        c.fillStyle = "rgba(" + INK + "," + (a * breathe * (mote ? 0.6 : 0.55)) + ")";
        c.fillRect(at.x + Math.sin(age / 1300 + at.y) * 4, at.y - rise * age, size, size);
      },
    };
  }

  // ---------- LES ABSTRAITS: a point, a line and a circle ----------
  // It was smoke off Des Cendres' fire for two rounds, and then abstract
  // compositions — circles, arcs, lines, triangles and dots, several at a
  // time. The owner asked for it "more profound and yet minimalist". So
  // it is ONE composition over the whole page, and three things in it,
  // each coming in its turn — the house's own "Eugen's ideas and Antoine
  // Lie's execution" said as a drawing:
  //
  //   THE POINT    the idea: one small point of the bottles' amber, set
  //                down first, and then breathing, very slowly.
  //   THE LINE     a horizon through it, drawn out from the point to both
  //                edges of the window — a hairline, at the golden
  //                section of the page's height.
  //   THE CIRCLE   the execution: one great circle round the point, laid
  //                down in a single stroke of a brush that starts heavy
  //                and runs dry, and is never quite closed (an ensō).
  //
  // And now and then a ring goes out from the point to the circle and is
  // gone, so the page is never quite still. Nothing else: no scatter of
  // points, no second composition. It all stands BEHIND the houses, so
  // the point is set to one side, where no house stands over it.
  const ABSTRAIT_AMBER = "184, 128, 46";
  const ENSO_SWEEP = Math.PI * 2 * 0.91;   // the gap is the circle's
  const ENSO_MS = 2600;                    // the stroke, from first touch to lifting off
  const RIPPLE_EVERY = 6500;               // ms between one ring and the next
  const RIPPLE_MS = 4200;                  // one ring going out
  function stillness() {
    const y = H * 0.618;
    const r = Math.max(110, Math.min(300, Math.min(W, H) * 0.3));
    // The side of the page the point can be seen on: whichever third has
    // no house standing over it, the right one if both are clear.
    const under = (x) => readAround.some((b) => x > b.left - 24 && x < b.right + 24 && y > b.top - 24 && y < b.bottom + 24);
    const sides = [W * 0.76, W * 0.24];
    const x = sides.find((sx) => !under(sx)) || sides[0];
    // The brush: where it first touches, and the dry streaks it leaves
    // as it runs out of ink — each a little way across the stroke, and
    // starting where that part of the brush gave out.
    const from = -Math.PI / 2 - rand(0.35, 0.75);
    const wobble = rand(0, Math.PI * 2);
    const streaks = [];
    for (let k = 0; k < 5; k++) streaks.push({ across: rand(-0.34, 0.34), start: rand(0.38, 0.8), thin: rand(0.6, 1.3) });
    const WIDE = 12;                                  // px, where the brush lands
    const wideAt = (u) => WIDE * Math.pow(1 - u, 1.25) + 1.2;
    const along = (u, across) => {
      const t = from + ENSO_SWEEP * u;
      const rr = r * (1 + 0.018 * Math.sin(3 * t + wobble)) + across * wideAt(u);
      return [x + Math.cos(t) * rr, y + Math.sin(t) * rr];
    };
    const STEP = 0.003;
    return {
      centre: { x, y },
      draw(c, age, a) {
        c.save();
        c.lineCap = "round";

        // THE CIRCLE, in one stroke of a brush running dry: heavy where
        // it lands, narrowing as it goes round, and split by dry streaks
        // towards its end — cut out of the stroke, as the paper shows
        // through where a brush has run out. Drawn before the line and
        // the point, so the cuts go through nothing of theirs.
        const q = ease((age - 1500) / ENSO_MS);
        if (q > 0) {
          c.fillStyle = "rgba(" + INK + "," + (0.66 * a) + ")";
          c.beginPath();
          for (let u = 0; u <= q; u += STEP) { const [px, py] = along(u, 0.5); if (u === 0) c.moveTo(px, py); else c.lineTo(px, py); }
          for (let u = q; u >= 0; u -= STEP) { const [px, py] = along(u, -0.5); c.lineTo(px, py); }
          c.closePath();
          c.fill();
          // Where it landed, round.
          const [hx, hy] = along(0, 0);
          c.beginPath();
          c.arc(hx, hy, wideAt(0) / 2, 0, Math.PI * 2);
          c.fill();
          c.globalCompositeOperation = "destination-out";
          c.strokeStyle = "rgba(0, 0, 0, 0.9)";
          streaks.forEach((k) => {
            if (q <= k.start) return;
            c.lineWidth = k.thin;
            c.beginPath();
            for (let u = k.start; u <= q; u += STEP) { const [px, py] = along(u, k.across); if (u === k.start) c.moveTo(px, py); else c.lineTo(px, py); }
            c.stroke();
          });
          c.globalCompositeOperation = "source-over";
        }

        // THE LINE, drawn out from the point to both edges.
        const reach = ease((age - 500) / 1900);
        if (reach > 0) {
          c.strokeStyle = "rgba(" + INK + "," + (0.34 * a) + ")";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x - (x + 10) * reach, y);
          c.lineTo(x + (W - x + 10) * reach, y);
          c.stroke();
        }

        // A RING going out from the point to the circle, now and then.
        const since = age - 4400;
        if (since > 0) {
          const k = (since % RIPPLE_EVERY) / RIPPLE_MS;
          if (k < 1) {
            c.strokeStyle = "rgba(" + ABSTRAIT_AMBER + "," + (0.42 * (1 - k) * (1 - k) * a) + ")";
            c.lineWidth = 0.8;
            c.beginPath();
            c.arc(x, y, 6 + (r - 6) * ease(k), 0, Math.PI * 2);
            c.stroke();
          }
        }

        // THE POINT, first of all, and breathing.
        const set = ease(age / 700);
        if (set > 0) {
          const breath = 1 + 0.16 * Math.sin(age / 1400);
          c.fillStyle = "rgba(" + ABSTRAIT_AMBER + "," + (0.92 * a) + ")";
          c.beginPath();
          c.arc(x, y, 4.2 * set * breath, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
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

  // ---------- QIMU & MUSICIANS: staves, and notes that come and go on them ----------
  // The owner: "make it so that it is 5 lines like music sheets, and add
  // ephemeral notes to that." A stave is five lines drawn across the
  // page from left to right; notes appear on its lines and in its
  // spaces, a few at a time, sit there for a moment and are gone.
  //
  // KEPT QUIET, at the owner's word: "make the effect of qimu and
  // musicians more subtle and way less movement". Fainter lines drawn
  // out more slowly, fewer staves and far fewer notes, and the notes
  // stand still where they are put rather than drifting — each simply
  // comes and goes.
  const staves = [];
  const GAP = 9;                         // between one line of a stave and the next
  function stave() {
    // Forget the staves that have gone.
    for (let i = staves.length - 1; i >= 0; i--) if (!things.includes(staves[i])) staves.splice(i, 1);
    // Kept clear of the other staves standing, so two never print over
    // each other.
    let y = null;
    for (let i = 0; i < 10; i++) {
      const tryY = rand(CHROME + 24, H - 70);
      if (staves.every((s) => s.ending || Math.abs(s.y - tryY) > GAP * 9)) { y = tryY; break; }
    }
    if (y === null) return null;
    const x0 = rand(-40, W * 0.25), x1 = rand(W * 0.7, W + 40);
    const bars = [];
    for (let x = x0 + rand(140, 220); x < x1 - 40; x += rand(150, 240)) bars.push(x);
    const one = {
      y, x0, x1, bars,
      life: rand(8000, 11000),
      draw(c, age, a) {
        const reach = x0 + (x1 - x0) * ease(age / 3200);
        c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (0.32 * a) + ")";
        c.lineWidth = 0.9;
        for (let k = 0; k < 5; k++) {
          c.beginPath();
          c.moveTo(x0, y + k * GAP);
          c.lineTo(reach, y + k * GAP);
          c.stroke();
        }
        // The bar lines, as the stave reaches them, and the time at the
        // head of it.
        bars.forEach((bx) => {
          if (bx > reach) return;
          c.beginPath();
          c.moveTo(bx, y);
          c.lineTo(bx, y + 4 * GAP);
          c.stroke();
        });
        if (x0 + 30 < reach) {
          c.fillStyle = "rgba(" + QIMU_BLUE + "," + (0.4 * a) + ")";
          c.font = "bold " + Math.round(GAP * 2) + "px Georgia, serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText("4", Math.max(x0, 0) + 22, y + GAP);
          c.fillText("4", Math.max(x0, 0) + 22, y + GAP * 3);
        }
      },
    };
    staves.push(one);
    return one;
  }
  function note() {
    const live = staves.filter((s) => !s.ending && things.includes(s));
    if (!live.length) return null;
    const s = pick(live);
    const x = rand(Math.max(s.x0, 0) + 50, Math.min(s.x1, W) - 20);
    // A place on the stave: a line or a space, a little above or below.
    const step = Math.floor(rand(-2, 11));
    const y = s.y + 4 * GAP - step * (GAP / 2);
    if (!clearOf(x, y, 14)) return null;
    const up = step < 4;
    const kind = pick(["crotchet", "crotchet", "quaver", "minim", "pair"]);
    return {
      life: rand(3600, 5600),
      draw(c, age, a) {
        const px = x;
        c.fillStyle = c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (0.5 * a) + ")";
        c.lineWidth = 1.2;
        const head = (hx, hy, open) => {
          c.beginPath();
          c.ellipse(hx, hy, GAP * 0.62, GAP * 0.42, -0.35, 0, Math.PI * 2);
          if (open) c.stroke(); else c.fill();
          // Ledger lines, above or below the stave.
          for (let l = s.y - GAP; l >= hy - 1; l -= GAP) { c.beginPath(); c.moveTo(hx - GAP, l); c.lineTo(hx + GAP, l); c.stroke(); }
          for (let l = s.y + 5 * GAP; l <= hy + 1; l += GAP) { c.beginPath(); c.moveTo(hx - GAP, l); c.lineTo(hx + GAP, l); c.stroke(); }
        };
        const stem = (hx, hy) => {
          const sx = up ? hx + GAP * 0.55 : hx - GAP * 0.55;
          c.beginPath();
          c.moveTo(sx, hy);
          c.lineTo(sx, up ? hy - GAP * 3.4 : hy + GAP * 3.4);
          c.stroke();
          return sx;
        };
        if (kind === "pair") {
          const hx2 = px + GAP * 2.6, hy2 = y;
          head(px, y, false); head(hx2, hy2, false);
          const s1 = stem(px, y), s2 = stem(hx2, hy2);
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(s1, up ? y - GAP * 3.4 : y + GAP * 3.4);
          c.lineTo(s2, up ? hy2 - GAP * 3.4 : hy2 + GAP * 3.4);
          c.stroke();
        } else {
          head(px, y, kind === "minim");
          const sx = stem(px, y);
          if (kind === "quaver") {
            const end = up ? y - GAP * 3.4 : y + GAP * 3.4;
            c.beginPath();
            c.moveTo(sx, end);
            c.quadraticCurveTo(sx + GAP * 1.2, end + (up ? GAP * 1.2 : -GAP * 1.2), sx + GAP * 0.7, end + (up ? GAP * 2.4 : -GAP * 2.4));
            c.stroke();
          }
        }
      },
    };
  }

  // How often each is born (per second), and how many may stand at once.
  const HOUSES = {
    pineward: [{ make: tree, rate: 2, most: 16 }, { make: needle, rate: 5, most: 50 }],
    adar: [{ make: sounding, rate: 1.3, most: 8 }, { make: dust, rate: 22, most: 160 }],
    "almost-human": [{ make: figure, rate: 1.3, most: 8 }, { make: rain, rate: 26, most: 80 }],
    ataraxia: [{ make: band, rate: 0.7, most: 6 }],
    grande: [{ make: drift, rate: 45, most: 320 }],
    "les-abstraits": [{ make: stillness, rate: 5, most: 1 }],
    tale: [{ make: doodle, rate: 2.6, most: 20 }],
    tombstone: [{ make: epitaph, rate: 0.9, most: 5 }, { make: roots, rate: 1.6, most: 11 }, { make: soil, rate: 6, most: 40 },
      { make: petal, rate: 2.6, most: 360 }],
    qimu: [{ make: stave, rate: 0.6, most: 3 }, { make: note, rate: 2.2, most: 12 }],
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
    things = things.filter((t) => {
      const age = now - t.born;
      // A thing that has lived its life fades on its own clock; one
      // whose house has been left fades on FADE_OUT_MS from where it had
      // got to.
      if (t.life && age > t.life && !t.ending) t.ending = { at: now, from: t.shown || 0, over: 1100 };
      let alpha = ease(age / FADE_IN_MS);
      if (t.ending) alpha = t.ending.from * (1 - ease((now - t.ending.at) / t.ending.over));
      else t.shown = alpha;
      if (t.ending && now - t.ending.at >= t.ending.over) return false;
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
      owed = new Map((HOUSES[key] || []).map((kind) => [kind, Math.min(kind.most, kind.rate * 0.8)]));
      if (key === "tombstone") epitaphsLeft = EPITAPHS.slice();
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
