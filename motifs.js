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
// Ataraxia's bands of light, Grande's drift, Les Abstraits' smoke and
// embers off Des Cendres' fire, Tale's doodles, Tombstone's stones in
// the mist, and Qimu & Musicians' notes, records and a line of sound.
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
// window.HouseMotifs = { start(key, frame), stop(now) }
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
  const EMBER = "196, 86, 31";
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
  function band() {
    const angle = rand(6, 26) * (Math.random() < 0.5 ? -1 : 1) * Math.PI / 180;
    const cy = rand(H * 0.1, H * 0.9);
    const len = Math.hypot(W, H) + 200;
    const specks = [];
    for (let s = 0; s < len; s += rand(2, 5)) specks.push({ s, off: rand(-12, 12), size: rand(1, 2.6) });
    const speed = rand(0.25, 0.45);
    return {
      life: rand(6000, 9000),
      draw(c, age, a) {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const crest = (age * speed) % (len + 400) - 200;
        specks.forEach((p) => {
          const x = -100 + p.s * cos - p.off * sin, y = cy - (len / 2) * sin + p.s * sin + p.off * cos;
          if (!clearOf(x, y, 2)) return;
          const glow = Math.exp(-Math.pow((p.s - crest) / 140, 2));
          c.fillStyle = "rgba(52, 53, 58," + (a * (0.2 + 0.75 * glow)) + ")";
          c.fillRect(x, y, p.size, p.size);
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

  // ---------- LES ABSTRAITS: smoke off Des Cendres' fire, embers, ash ----------
  function smoke() {
    const at = spot(30, H * 0.45, H + 10);
    if (!at) return null;
    const sway = rand(10, 26), tall = rand(160, 320), phase = rand(0, 6);
    return {
      life: rand(5500, 8000),
      draw(c, age, a) {
        const up = tall * ease(age / 3000);
        c.strokeStyle = "rgba(80, 78, 74," + (0.45 * a) + ")";
        c.lineWidth = 1.3;
        for (let strand = 0; strand < 3; strand++) {
          c.beginPath();
          for (let k = 0; k <= 24; k++) {
            const f = k / 24;
            const x = at.x + strand * 3 + Math.sin(f * 5 + phase + age / 900 + strand) * sway * f;
            const y = at.y - up * f;
            if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.stroke();
        }
      },
    };
  }
  function ember() {
    const at = spot(3, H * 0.4, H);
    if (!at) return null;
    const rise = rand(0.03, 0.07);
    return {
      life: rand(1800, 3400),
      draw(c, age, a) {
        const flick = 0.5 + 0.5 * Math.sin(age / 60 + at.x);
        c.fillStyle = "rgba(" + EMBER + "," + (a * (0.35 + 0.55 * flick)) + ")";
        c.fillRect(at.x + Math.sin(age / 300) * 5, at.y - rise * age, 2.4, 2.4);
      },
    };
  }
  function ash() {
    const at = spot(3, -10, H * 0.6);
    if (!at) return null;
    return {
      life: rand(4000, 7000),
      draw(c, age, a) {
        c.fillStyle = "rgba(110, 108, 104," + (0.45 * a) + ")";
        c.fillRect(at.x + Math.sin(age / 500 + at.y) * 8, at.y + age * 0.018, 2.2, 1.2);
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

  // ---------- TOMBSTONE: stones standing up out of the mist, petals ----------
  function stone() {
    const w = rand(26, 54), h = w * rand(1.3, 2.1);
    const at = spot(h * 0.6, H * 0.35, H - 10);
    if (!at) return null;
    const round = Math.random() < 0.5;
    const tone = Math.round(rand(96, 170));
    return {
      life: rand(6000, 9000),
      draw(c, age, a) {
        const rise = (1 - ease(age / 2400)) * 18;
        const x = at.x - w / 2, y = at.y - h + rise;
        c.beginPath();
        if (round) {
          c.moveTo(x, at.y + rise);
          c.lineTo(x, y + w / 2);
          c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
          c.lineTo(x + w, at.y + rise);
        } else {
          c.rect(x, y, w, h);
        }
        c.closePath();
        c.fillStyle = "rgba(" + tone + "," + tone + "," + (tone + 2) + "," + (0.55 * a) + ")";
        c.fill();
        c.strokeStyle = "rgba(" + INK + "," + (0.6 * a) + ")";
        c.lineWidth = 1.1;
        c.stroke();
        // The mist at its foot.
        const g = c.createLinearGradient(0, at.y - 22, 0, at.y + 4);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(255,255,255," + (0.95 * a) + ")");
        c.fillStyle = g;
        c.fillRect(x - 12, at.y - 22, w + 24, 30);
      },
    };
  }
  function mist() {
    const at = spot(10, H * 0.2, H);
    if (!at) return null;
    const wide = rand(160, 380), tall = rand(20, 46), drift = rand(-0.012, 0.012);
    return {
      life: rand(6000, 9000),
      draw(c, age, a) {
        const x = at.x + drift * age;
        const g = c.createRadialGradient(x, at.y, 0, x, at.y, wide / 2);
        g.addColorStop(0, "rgba(150,152,154," + (0.16 * a) + ")");
        g.addColorStop(1, "rgba(150,152,154,0)");
        c.save();
        c.translate(x, at.y);
        c.scale(1, tall / wide);
        c.translate(-x, -at.y);
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, at.y, wide / 2, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }
  function petal() {
    const at = spot(3, -10, H * 0.7);
    if (!at) return null;
    let spin = rand(0, 6);
    return {
      life: rand(3500, 6000),
      draw(c, age, a) {
        spin += 0.03;
        c.fillStyle = "rgba(" + PETAL + "," + (0.7 * a) + ")";
        c.save();
        c.translate(at.x + Math.sin(age / 700) * 14, at.y + age * 0.028);
        c.rotate(spin);
        c.beginPath();
        c.ellipse(0, 0, 3.4, 1.7, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // ---------- QIMU & MUSICIANS: notes rising, a record turning, a line of sound ----------
  function note() {
    const at = spot(14, H * 0.3, H + 10);
    if (!at) return null;
    const two = Math.random() < 0.4, size = rand(12, 20), rise = rand(0.02, 0.045), sway = rand(8, 18);
    return {
      life: rand(4000, 6500),
      draw(c, age, a) {
        const x = at.x + Math.sin(age / 500) * sway, y = at.y - rise * age;
        c.fillStyle = c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (0.75 * a) + ")";
        c.lineWidth = 1.4;
        const heads = two ? [[0, 0], [size * 0.9, -size * 0.25]] : [[0, 0]];
        heads.forEach(([hx, hy]) => {
          c.beginPath();
          c.ellipse(x + hx, y + hy, size * 0.3, size * 0.21, -0.35, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.moveTo(x + hx + size * 0.27, y + hy - 1);
          c.lineTo(x + hx + size * 0.27, y + hy - size * 1.2);
          c.stroke();
        });
        c.beginPath();
        if (two) {
          c.lineWidth = 3;
          c.moveTo(x + size * 0.27, y - size * 1.2);
          c.lineTo(x + size * 1.17, y - size * 1.45);
        } else {
          c.moveTo(x + size * 0.27, y - size * 1.2);
          c.quadraticCurveTo(x + size * 0.8, y - size * 0.9, x + size * 0.6, y - size * 0.45);
        }
        c.stroke();
      },
    };
  }
  function record() {
    const r = rand(34, 60);
    const at = spot(r + 6);
    if (!at) return null;
    const turn = rand(0.0025, 0.004);
    return {
      life: rand(5000, 7000),
      draw(c, age, a) {
        c.fillStyle = "rgba(" + INK + "," + (0.7 * a) + ")";
        c.beginPath();
        c.arc(at.x, at.y, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(255,255,255," + (0.18 * a) + ")";
        c.lineWidth = 0.6;
        for (let g = r * 0.42; g < r - 2; g += 3.2) {
          c.beginPath();
          c.arc(at.x, at.y, g, 0, Math.PI * 2);
          c.stroke();
        }
        // The light catching the grooves goes round with it.
        const spin = age * turn;
        c.strokeStyle = "rgba(255,255,255," + (0.5 * a) + ")";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(at.x, at.y, r * 0.72, spin, spin + 0.5);
        c.stroke();
        c.fillStyle = "rgba(240, 238, 230," + a + ")";
        c.beginPath();
        c.arc(at.x, at.y, r * 0.32, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(" + QIMU_BLUE + "," + a + ")";
        c.beginPath();
        c.arc(at.x, at.y, 2.2, 0, Math.PI * 2);
        c.fill();
      },
    };
  }
  function wave() {
    const y0 = rand(H * 0.15, H * 0.9);
    const freq = rand(0.012, 0.03), amp = rand(10, 26);
    return {
      life: rand(4000, 6000),
      draw(c, age, a) {
        c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (0.4 * a) + ")";
        c.lineWidth = 1;
        c.beginPath();
        let open = false;
        for (let x = 0; x <= W; x += 4) {
          const env = Math.sin((x / W) * Math.PI);
          const y = y0 + Math.sin(x * freq + age / 180) * amp * env * Math.sin(x * freq * 0.37 + age / 400);
          if (!clearOf(x, y, 3)) { open = false; continue; }
          if (!open) { c.moveTo(x, y); open = true; } else c.lineTo(x, y);
        }
        c.stroke();
      },
    };
  }

  // How often each is born (per second), and how many may stand at once.
  const HOUSES = {
    pineward: [{ make: tree, rate: 2, most: 16 }, { make: needle, rate: 5, most: 50 }],
    adar: [{ make: sounding, rate: 1.3, most: 8 }, { make: dust, rate: 22, most: 160 }],
    "almost-human": [{ make: figure, rate: 1.3, most: 8 }, { make: rain, rate: 26, most: 80 }],
    ataraxia: [{ make: band, rate: 1.1, most: 7 }],
    grande: [{ make: drift, rate: 45, most: 320 }],
    "les-abstraits": [{ make: smoke, rate: 1.4, most: 9 }, { make: ember, rate: 12, most: 50 }, { make: ash, rate: 8, most: 50 }],
    tale: [{ make: doodle, rate: 2.6, most: 20 }],
    tombstone: [{ make: stone, rate: 1.8, most: 14 }, { make: mist, rate: 1, most: 8 }, { make: petal, rate: 3, most: 20 }],
    qimu: [{ make: note, rate: 2.4, most: 18 }, { make: record, rate: 0.35, most: 2 }, { make: wave, rate: 0.5, most: 3 }],
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
    start(key, el) {
      if (REDUCE_MOTION) return;
      house = HOUSES[key] ? key : null;
      // A first handful straight away — each still comes up on its own
      // FADE_IN_MS — so the page is not empty for the first second.
      owed = new Map((HOUSES[key] || []).map((kind) => [kind, Math.min(kind.most, kind.rate * 0.8)]));
      if (el) {
        const r = el.getBoundingClientRect();
        avoid = { left: r.left - CLEAR, right: r.right + CLEAR, top: r.top - CLEAR, bottom: r.bottom + CLEAR };
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
