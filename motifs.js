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
// Almost Human's figures glitching into being and out and its rain,
// Ataraxia's bands of particles and their shadows, Grande's bubbles,
// Les Abstraits' droplets gathering into its mark, Tale's doodles,
// Tombstone's names cut into the wall and its roots and flowers, and
// Qimu & Musicians' music, written out on staves and loose on the page.
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

  // ---------- ALMOST HUMAN: figures glitching into being and out again, rain ----------
  // A figure used to gather most of the way into a person and come apart
  // again, never quite arriving. The owner asked for it "more like
  // humans glitching into existence and then after a brief delay
  // glitching out" (and said they may want it reversed, so the three
  // beats are three numbers). So a figure — a person drawn in specks, as
  // the house's own page draws them — arrives the way a broken signal
  // does: cut into bands across, each band thrown sideways by its own
  // amount and re-thrown every few frames, some of them missing, a
  // ghost of the whole a few pixels off to one side, all of it settling
  // into place over GLITCH_IN; then it simply STANDS for a moment; then
  // it tears apart the same way over GLITCH_OUT and is gone.
  const GLITCH_IN = 650;       // ms, coming into existence
  const GLITCH_HOLD = [1100, 2000];  // ms, standing
  const GLITCH_OUT = 520;      // ms, going
  const GLITCH_STEP = 55;      // ms between one throw of the bands and the next
  function figure() {
    const h = rand(90, 150);
    const at = spot(h * 0.45, h * 0.5, H - h * 0.5);
    if (!at) return null;
    const specks = [];
    const add = (x, y) => specks.push({ x, y });
    const u = h / 100;
    for (let i = 0; i < 26; i++) { const t = (i / 26) * Math.PI * 2; add(Math.cos(t) * 8 * u, -80 * u + Math.sin(t) * 9 * u); }
    for (let i = 0; i < 60; i++) add(rand(-11, 11) * u, rand(-68, -30) * u);
    for (let i = 0; i < 26; i++) { const s = i < 13 ? -1 : 1, k = (i % 13) / 13; add(s * (12 + k * 10) * u, (-64 + k * 34) * u); }
    for (let i = 0; i < 34; i++) { const s = i < 17 ? -1 : 1, k = (i % 17) / 17; add(s * (4 + k * 5) * u, (-30 + k * 30) * u); }
    const BANDS = 9;
    const bandOf = (y) => Math.max(0, Math.min(BANDS - 1, Math.floor((y / u + 90) / 90 * BANDS)));
    specks.forEach((sp) => { sp.band = bandOf(sp.y); });
    const hold = rand(GLITCH_HOLD[0], GLITCH_HOLD[1]);
    const life = GLITCH_IN + hold + GLITCH_OUT;
    let throwAt = -1, throws = null, ghost = 0;
    return {
      life: life,
      sharp: true,
      draw(c, age, a) {
        // How broken it is: all the way at the start, nothing while it
        // stands, all the way again at the end.
        const broken = age < GLITCH_IN ? 1 - ease(age / GLITCH_IN)
          : age > GLITCH_IN + hold ? ease((age - GLITCH_IN - hold) / GLITCH_OUT) : 0;
        if (age >= life) return;
        // The bands are thrown again every GLITCH_STEP, in steps rather
        // than smoothly, as a signal breaks.
        const step = Math.floor(age / GLITCH_STEP);
        if (step !== throwAt) {
          throwAt = step;
          throws = [];
          for (let b = 0; b < BANDS; b++) {
            throws.push({ dx: rand(-1, 1) * h * 0.45, gone: Math.random() < 0.35 });
          }
          ghost = rand(-1, 1) * 7;
        }
        const ink = "rgba(" + INK + ",";
        // The ghost of the whole, a few pixels off, only while broken.
        if (broken > 0.05) {
          c.fillStyle = ink + (0.22 * broken * a) + ")";
          specks.forEach((sp) => c.fillRect(at.x + sp.x + ghost * broken, at.y + sp.y, 1.7, 1.7));
        }
        c.fillStyle = ink + (0.8 * a) + ")";
        specks.forEach((sp) => {
          const t = throws[sp.band];
          if (broken > 0.04 && t.gone && broken > 0.25) return;
          c.fillRect(at.x + sp.x + t.dx * broken * broken, at.y + sp.y, 1.9, 1.9);
        });
        // A thin scan line across the figure while it is breaking.
        if (broken > 0.1) {
          const band = Math.floor(Math.random() * BANDS);
          const y0 = at.y + (band / BANDS * 90 - 90) * u;
          c.fillStyle = ink + (0.35 * broken * a) + ")";
          c.fillRect(at.x - h * 0.35 + throws[band].dx * broken, y0, h * 0.7, 1);
        }
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

  // ---------- ATARAXIA: bands of particles crossing, each casting its shadow ----------
  // EMPHASISED at the owner's word ("emphasize the ataraxia effect"), and
  // then FEWER AND MORE SIGNIFICANT ("slightly less frequent with the
  // streaks, but make the streaks more significant"): at most six at
  // once, each wide, dense and long-lived, with a crest travelling along.
  //
  // THE HAZE IS GONE. For two rounds each band laid one soft grey stroke
  // along its whole length under its specks, and the owner saw it for
  // what it was: "a random beam where they are ... the gray rectangle".
  // They had meant the PARTICLES emphasised — "in a way of particles and
  // shadows". So a band is its particles and nothing else: darker and
  // heavier than they were, a few of them large round motes, the crest
  // swelling them as it passes — and every one casting a soft SHADOW on
  // the page below and to the right, as a particle standing a little off
  // the paper would. The shadow is laid down once, when the band is
  // born, on a small canvas of its own (`shade`, half the window's size
  // and blurred), since the particles never move; each frame only draws
  // it back at the band's strength.
  const SHADE_DROP = 5;                 // px, how far below and right a shadow falls
  function band() {
    const angle = rand(6, 26) * (Math.random() < 0.5 ? -1 : 1) * Math.PI / 180;
    const cy = rand(H * 0.1, H * 0.9);
    const len = Math.hypot(W, H) + 200;
    const wide = rand(22, 34);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const x0 = -100, y0 = cy - (len / 2) * sin;
    const specks = [];
    for (let s = 0; s < len; s += rand(0.8, 1.9)) {
      // Heaped towards the band's spine, so it has a body rather than an
      // edge; about one in thirty a MOTE, larger and round.
      const off = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * wide;
      const mote = Math.random() < 0.035;
      const p = { s, off, mote, size: mote ? rand(3.6, 6) : rand(1.5, 3.4) };
      p.x = x0 + s * cos - off * sin;
      p.y = y0 + s * sin + off * cos;
      specks.push(p);
    }
    // THE SHADOWS, once.
    const shade = document.createElement("canvas");
    shade.dataset.band = "shadow";
    shade.dataset.wide = String(Math.round(wide * 2));
    shade.width = Math.max(1, Math.round(W / 2));
    shade.height = Math.max(1, Math.round(H / 2));
    const sh = shade.getContext("2d");
    if (sh) {
      sh.filter = "blur(2.5px)";
      sh.fillStyle = "rgba(20, 21, 26, 0.8)";
      specks.forEach((p) => {
        if (!clearOf(p.x, p.y, 2)) return;
        const r = (p.mote ? p.size : p.size * 0.85) / 2;
        sh.beginPath();
        sh.arc((p.x + SHADE_DROP) / 2, (p.y + SHADE_DROP * 1.3) / 2, Math.max(0.7, r), 0, Math.PI * 2);
        sh.fill();
      });
    }
    const speed = rand(0.28, 0.5);
    return {
      life: rand(8500, 12000),
      draw(c, age, a) {
        const crest = (age * speed) % (len + 400) - 200;
        c.globalAlpha = Math.min(1, a * 1.15);
        c.drawImage(shade, 0, 0, W, H);
        c.globalAlpha = 1;
        specks.forEach((p) => {
          if (!clearOf(p.x, p.y, 2)) return;
          const glow = Math.exp(-Math.pow((p.s - crest) / 320, 2));
          const strength = a * Math.min(1, 0.5 + 0.42 * glow);
          const size = p.size * (1 + glow * 0.55);
          c.fillStyle = "rgba(30, 31, 36," + strength + ")";
          if (p.mote) {
            c.beginPath();
            c.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
            c.fill();
          } else {
            c.fillRect(p.x - size / 2, p.y - size / 2, size, size);
          }
        });
      },
    };
  }

  // ---------- GRANDE PARFUMS: bubbles, rising and popping ----------
  // It was the house's own drift — specks rising, fading in and out. The
  // owner asked for "the particles that come up to sort of bubble", and
  // for twice as many, twice as often: so each is a BUBBLE now — a ring
  // rather than a speck, wobbling from side to side as it rises, growing
  // a little as it goes (as a bubble does, rising), with a thicker edge
  // on its lower side where the light bends — and at the end of its rise
  // it POPS: a quick broken ring thrown out and a few droplets, gone. A
  // few are only specks, the smallest bubbles, which simply rise.
  function drift() {
    const at = spot(3, H * 0.2, H + 20);
    if (!at) return null;
    const big = Math.random() < 0.09;
    const r0 = big ? rand(3.4, 5.6) : rand(1.1, 2.8);
    const rise = rand(0.018, 0.04);
    const sway = rand(2, 7), swayRate = rand(380, 720), phase = rand(0, Math.PI * 2);
    const popAt = rand(5000, 8800);
    const POP = 260;
    const bits = [0, 1, 2, 3].map((k) => ({ a: k * Math.PI / 2 + rand(-0.5, 0.5), d: rand(1.8, 3) }));
    return {
      life: popAt + POP,
      draw(c, age, a) {
        const t = Math.min(age, popAt);
        const x = at.x + Math.sin(t / swayRate + phase) * sway;
        const y = at.y - rise * t;
        const r = r0 * (1 + 0.45 * t / popAt);
        const ink = "rgba(" + INK + ",";
        if (age < popAt) {
          if (r < 1.6) {
            c.fillStyle = ink + (0.5 * a) + ")";
            c.fillRect(x - r / 2, y - r / 2, r, r);
            return;
          }
          c.strokeStyle = ink + (0.42 * a) + ")";
          c.lineWidth = 0.8;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.stroke();
          // The edge the light bends through, heavier on the lower side.
          c.lineWidth = 1.4;
          c.strokeStyle = ink + (0.34 * a) + ")";
          c.beginPath();
          c.arc(x, y, r, Math.PI * 0.15, Math.PI * 0.85);
          c.stroke();
          return;
        }
        // THE POP.
        const q = (age - popAt) / POP;
        if (q >= 1) return;
        c.strokeStyle = ink + (0.45 * (1 - q) * a) + ")";
        c.lineWidth = 0.8;
        c.setLineDash([2, 3]);
        c.beginPath();
        c.arc(x, y, r * (1 + q * 1.4), 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = ink + (0.5 * (1 - q) * a) + ")";
        bits.forEach((b) => c.fillRect(x + Math.cos(b.a) * r * b.d * (0.6 + q) - 0.7, y + Math.sin(b.a) * r * b.d * (0.6 + q) - 0.7, 1.4, 1.4));
      },
    };
  }

  // ---------- LES ABSTRAITS: droplets, concentrating into the house's mark ----------
  // Three rounds before this: smoke off Des Cendres' fire, then abstract
  // compositions, then a point, a line and a brush-stroke circle. The
  // owner asked for "something to do with droplets, and concentrations
  // (the chemical act of concentrating) OR EVEN BETTER, MAKE SOMETHING
  // USING THEIR LOGO" — and sent the logo. This does both:
  //
  //   THE SOLUTION   droplets scattered thin across the whole page, pale,
  //                  in the amber of the house's bottles — dilute;
  //   CONCENTRATING  they draw in, each on a curve of its own and a
  //                  moment of its own, darkening from amber to ink as
  //                  they close — the solution becoming stronger as it
  //                  becomes less — until every one has found its place
  //                  in THE MARK: the house's own four-lobed ring, read
  //                  off the owner's picture (its white is where a drop
  //                  may land);
  //   THE CONCENTRATE the mark then sets solid, in ink, the drops sinking
  //                  into it;
  //   A DROP         and now and then one gathers at its foot, hangs,
  //                  falls, and lands with a small ring.
  //
  // It stands behind the houses, so the mark is set on whichever side
  // of the window has no house over it. It lasts until the house is
  // left, and fades with everything else.
  const ABSTRAIT_AMBER = [184, 128, 46];
  const ABSTRAIT_INK = [23, 23, 15];
  const LOGO_SRC = "images/Les-Abstraits/les-abstraits-logo.png";
  const LOGO_DROPS = 900;               // droplets in the solution
  const GATHER_FROM = 1400;             // ms over which they set off
  const GATHER_MS = [1700, 2600];       // and how long one takes to arrive
  const SET_MS = 900;                   // the mark setting solid after
  const DRIP_EVERY = 2400;              // ms between one drop and the next
  // THE MARK, read once off the owner's picture: where its white is, as
  // points in a unit square, and the shape itself as ink on nothing.
  let logo = null;
  (function () {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const read = document.createElement("canvas");
      read.width = w; read.height = h;
      const rc = read.getContext("2d", { willReadFrequently: true });
      if (!rc) return;
      rc.drawImage(img, 0, 0);
      const d = rc.getImageData(0, 0, w, h).data;
      let l = w, r = 0, t = h, b = 0;
      const white = (x, y) => d[(y * w + x) * 4] > 128;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (white(x, y)) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
      if (r <= l || b <= t) return;
      const size = Math.max(r - l, b - t);
      const cx = (l + r) / 2, cy = (t + b) / 2;
      const points = [];
      for (let y = t; y <= b; y += 2) for (let x = l; x <= r; x += 2) if (white(x, y)) points.push([(x - cx) / size, (y - cy) / size]);
      // The shape as ink, 400px across, to be drawn at whatever size.
      const S = 400;
      const shape = document.createElement("canvas");
      shape.width = S; shape.height = S;
      const sc = shape.getContext("2d");
      const out = sc.createImageData(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const ix = Math.round(cx + (x / S - 0.5) * size), iy = Math.round(cy + (y / S - 0.5) * size);
        if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
        const v = d[(iy * w + ix) * 4];
        const k = (y * S + x) * 4;
        out.data[k] = ABSTRAIT_INK[0]; out.data[k + 1] = ABSTRAIT_INK[1]; out.data[k + 2] = ABSTRAIT_INK[2];
        out.data[k + 3] = Math.max(0, Math.min(255, (v - 40) * 1.3));
      }
      sc.putImageData(out, 0, 0);
      // The lowest points of the mark, where a drop gathers.
      const low = points.reduce((m, p) => Math.max(m, p[1]), -1);
      const feet = points.filter((p) => p[1] > low - 0.02);
      logo = { points: points, shape: shape, feet: feet, wide: (r - l) / size, tall: (b - t) / size };
    };
    img.src = (typeof window.SITE_ROOT === "string" ? window.SITE_ROOT : "") + LOGO_SRC;
  })();
  const mix = (k) => ABSTRAIT_AMBER.map((v, i) => Math.round(v + (ABSTRAIT_INK[i] - v) * k)).join(",");

  function concentrate() {
    if (!logo) return null;
    const D = Math.max(180, Math.min(340, Math.min(W, H) * 0.38));
    // Where the mark can best be seen: of a few places about the page,
    // the one the houses stand over least.
    const over = (px, py) => readAround.reduce((sum, b) => sum +
      Math.max(0, Math.min(px + D / 2, b.right) - Math.max(px - D / 2, b.left)) *
      Math.max(0, Math.min(py + D / 2, b.bottom) - Math.max(py - D / 2, b.top)), 0);
    let x = W * 0.76, y = H * 0.56, least = Infinity;
    [0.78, 0.22, 0.5].forEach((fx) => [0.56, 0.36, 0.74].forEach((fy) => {
      const px = W * fx, py = Math.max(CHROME + D / 2, Math.min(H - D / 2, H * fy));
      const o = over(px, py);
      if (o < least - 1) { least = o; x = px; y = py; }
    }));
    const drops = [];
    for (let i = 0; i < LOGO_DROPS; i++) {
      const p = logo.points[Math.floor(Math.random() * logo.points.length)];
      const tx = x + p[0] * D + rand(-0.8, 0.8), ty = y + p[1] * D + rand(-0.8, 0.8);
      // Where it starts: anywhere on the page, the solution being thin.
      const sx = rand(-20, W + 20), sy = rand(CHROME, H + 20);
      drops.push({
        sx: sx, sy: sy, tx: tx, ty: ty,
        // A curve of its own: a point to one side of the straight way in.
        bend: rand(-0.35, 0.35),
        at: rand(0, GATHER_FROM), long: rand(GATHER_MS[0], GATHER_MS[1]),
        r: rand(0.8, 2.1),
      });
    }
    const settled = GATHER_FROM + GATHER_MS[1];
    const feet = logo.feet.map((p) => [x + p[0] * D, y + p[1] * D]);
    const box = { left: x - D / 2, right: x + D / 2, top: y - D / 2, bottom: y + D / 2 };
    return {
      centre: { x: x, y: y },
      box: box,
      draw(c, age, a) {
        // THE CONCENTRATE: the mark setting solid once the drops are in.
        const set = ease((age - settled) / SET_MS);
        if (set > 0) {
          c.globalAlpha = 0.7 * set * a;
          c.drawImage(logo.shape, x - D / 2, y - D / 2, D, D);
          c.globalAlpha = 1;
        }
        // THE DROPS, closing in and darkening as they come; sinking into
        // the mark as it sets.
        const sink = 1 - set;
        if (sink > 0.01) {
          for (const d of drops) {
            const q = ease((age - d.at) / d.long);
            const mx = (d.sx + d.tx) / 2 - (d.ty - d.sy) * d.bend, my = (d.sy + d.ty) / 2 + (d.tx - d.sx) * d.bend;
            const u = 1 - q;
            const px = u * u * d.sx + 2 * u * q * mx + q * q * d.tx;
            const py = u * u * d.sy + 2 * u * q * my + q * q * d.ty;
            c.fillStyle = "rgba(" + mix(q) + "," + ((0.32 + 0.45 * q) * a * sink) + ")";
            c.beginPath();
            c.arc(px, py, d.r * (1.4 - 0.45 * q), 0, Math.PI * 2);
            c.fill();
          }
        }
        // A DROP gathering at the mark's foot, falling, and landing.
        if (set >= 1 && feet.length) {
          const since = age - settled - SET_MS;
          const n = Math.floor(since / DRIP_EVERY), q = (since % DRIP_EVERY) / DRIP_EVERY;
          const foot = feet[(n * 7919) % feet.length];
          const ink = "rgba(" + mix(1) + ",";
          if (q < 0.45) {
            // Swelling where it hangs.
            const r = 1 + 3 * ease(q / 0.45);
            c.fillStyle = ink + (0.6 * a) + ")";
            c.beginPath();
            c.ellipse(foot[0], foot[1] + r * 0.8, r * 0.8, r, 0, 0, Math.PI * 2);
            c.fill();
          } else if (q < 0.8) {
            const f = (q - 0.45) / 0.35;
            const fy = foot[1] + 4 + f * f * 150;
            c.fillStyle = ink + (0.6 * a) + ")";
            c.beginPath();
            c.ellipse(foot[0], fy, 2.6, 3.6 + f * 2, 0, 0, Math.PI * 2);
            c.fill();
          } else {
            const f = (q - 0.8) / 0.2;
            c.strokeStyle = ink + (0.45 * (1 - f) * a) + ")";
            c.lineWidth = 0.9;
            c.beginPath();
            c.ellipse(foot[0], foot[1] + 154, 3 + f * 22, 1 + f * 5, 0, 0, Math.PI * 2);
            c.stroke();
          }
        }
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

  // ---------- QIMU & MUSICIANS: music, written out on staves and loose on the page ----------
  // The owner, first: "make it so that it is 5 lines like music sheets,
  // and add ephemeral notes to that"; then "more subtle and way less
  // movement" — so it is faint, and nothing drifts: a thing is written
  // where it stands and stays there until it goes.
  //
  // AND THEN "make it complex, I dont want it to be just a simple 4/4
  // rhythm with a note here and there, i want it to resemble proper
  // complex compositions. and then make it that sometimes they are in
  // the 5 line grid, while other times it is just complex notes popping
  // up spontaneously." So:
  //
  //   THE STAVES are written out, left to right, as a score is read: a
  //   clef, a key signature, a time signature that is rarely 4/4 and
  //   changes at a bar now and then, a tempo marking — and then bars of
  //   real texture: beamed runs of semiquavers and demisemiquavers,
  //   tuplets of three, five, six and seven, chords with their
  //   accidentals, arpeggiated chords, grace notes, trills, rests,
  //   slurs, staccato, accents, and the dynamics and hairpins under it.
  //   Now and then two staves braced together — a piano's grand staff,
  //   with a bass line under the melody, bar for bar.
  //   THE LOOSE MUSIC is passages with no staff at all popping up on the
  //   page and gone again — a run under its tuplet and slur, a cadenza of
  //   small notes ending on a fermata, a hammered cluster, a few chords.
  //   THE TWO TAKE TURNS (`QIMU_STAVES_MS`, `QIMU_LOOSE_MS`): a while of
  //   staves being written, then a while of music on its own — the staves
  //   already written staying out their time as it starts.
  //
  // All of it is drawn here in paths, because a music font cannot be
  // counted on: a clef, a sharp or a rest is a few strokes of the pen.
  const staves = [];
  const GAP = 9;                         // between one line of a stave and the next
  const QIMU_STAVES_MS = 9000;
  const QIMU_LOOSE_MS = 7000;
  const QIMU_WRITE_MS = 3600;            // a stave written out, end to end
  const QIMU_LINE = 0.3;                 // how strong a stave's lines are
  const QIMU_INK = 0.46;                 // and what is written on it; never over half
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
    if (open) { c.lineWidth = 1.1; c.stroke(); } else c.fill();
  }
  function mBeam(c, x1, y1, x2, y2, n, up, k) {
    k = k || 1;
    for (let i = 0; i < n; i++) {
      const d = (up ? 1 : -1) * i * GAP * 0.55 * k, h = 1.3 * k;
      c.beginPath();
      c.moveTo(x1, y1 + d - h); c.lineTo(x2, y2 + d - h); c.lineTo(x2, y2 + d + h); c.lineTo(x1, y1 + d + h);
      c.closePath();
      c.fill();
    }
  }
  function mFlag(c, x, y, up, n) {
    c.lineWidth = 1.2;
    for (let i = 0; i < n; i++) {
      const y0 = y + (up ? 1 : -1) * i * GAP * 0.6;
      c.beginPath();
      c.moveTo(x, y0);
      c.bezierCurveTo(x + GAP * 0.9, y0 + (up ? 1 : -1) * GAP * 0.8, x + GAP * 0.9, y0 + (up ? 1 : -1) * GAP * 1.6, x + GAP * 0.5, y0 + (up ? 1 : -1) * GAP * 2.2);
      c.stroke();
    }
  }
  function mSharp(c, x, y) {
    mLine(c, x - 1.5, y - GAP * 1.2, x - 1.5, y + GAP * 1.3, 0.9);
    mLine(c, x + 1.5, y - GAP * 1.35, x + 1.5, y + GAP * 1.15, 0.9);
    mLine(c, x - 3, y - GAP * 0.35 + 1, x + 3, y - GAP * 0.35 - 1, 2);
    mLine(c, x - 3, y + GAP * 0.4 + 1, x + 3, y + GAP * 0.4 - 1, 2);
  }
  function mFlat(c, x, y) {
    mLine(c, x - 1.8, y - GAP * 1.8, x - 1.8, y + GAP * 0.5, 1);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x - 1.8, y + GAP * 0.5);
    c.bezierCurveTo(x + 4.5, y - GAP * 0.1, x + 2.5, y - GAP * 0.9, x - 1.8, y - GAP * 0.1);
    c.stroke();
  }
  function mNatural(c, x, y) {
    mLine(c, x - 1.6, y - GAP * 1.3, x - 1.6, y + GAP * 0.5, 0.9);
    mLine(c, x + 1.6, y - GAP * 0.5, x + 1.6, y + GAP * 1.3, 0.9);
    mLine(c, x - 1.6, y - GAP * 0.3 + 0.8, x + 1.6, y - GAP * 0.3 - 0.8, 1.8);
    mLine(c, x - 1.6, y + GAP * 0.35 + 0.8, x + 1.6, y + GAP * 0.35 - 0.8, 1.8);
  }
  const ACCIDENTAL = [mSharp, mFlat, mNatural];
  function mRest(c, x, top, kind) {
    const y = top + GAP * 2;
    if (kind === "q") {
      c.lineWidth = 1.7;
      c.beginPath();
      c.moveTo(x - 1.5, y - GAP * 1.5); c.lineTo(x + 2.2, y - GAP * 0.7); c.lineTo(x - 1.5, y + GAP * 0.1);
      c.lineTo(x + 2.2, y + GAP * 0.8); c.quadraticCurveTo(x - 3, y + GAP * 0.9, x, y + GAP * 1.6);
      c.stroke();
    } else if (kind === "h") {
      c.fillRect(x - 4, y - GAP * 0.5, 8, GAP * 0.45);
    } else {
      const dots = kind === "s" ? 2 : 1;
      for (let i = 0; i < dots; i++) {
        c.beginPath(); c.arc(x - 1.5 + i * 1.2, y - GAP * 0.5 + i * GAP * 0.8, 1.6, 0, Math.PI * 2); c.fill();
      }
      mLine(c, x + 2.6, y - GAP * 0.7, x - 1, y + GAP * 1.2 + (dots - 1) * GAP * 0.7, 1.1);
    }
  }
  function mSlur(c, x1, y1, x2, y2, below) {
    const lift = (below ? 1 : -1) * Math.min(GAP * 1.6, 4 + (x2 - x1) * 0.12);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x1, y1);
    c.bezierCurveTo(x1 + (x2 - x1) * 0.25, y1 + lift, x1 + (x2 - x1) * 0.75, y2 + lift, x2, y2);
    c.stroke();
  }
  function mText(c, t, x, y, px, style) {
    c.font = (style || "italic bold") + " " + px + "px Georgia, 'Times New Roman', serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(t, x, y);
  }
  function mTuplet(c, x1, x2, y, label, up) {
    const d = up ? 3 : -3, mid = (x1 + x2) / 2;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x1, y + d); c.lineTo(x1, y); c.lineTo(mid - 6, y);
    c.moveTo(mid + 6, y); c.lineTo(x2, y); c.lineTo(x2, y + d);
    c.stroke();
    mText(c, label, mid, y, 10);
  }
  function mHairpin(c, x1, x2, y, opening) {
    const a = opening ? 0 : 3.5, b = opening ? 3.5 : 0;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x1, y - a); c.lineTo(x2, y - b);
    c.moveTo(x1, y + a); c.lineTo(x2, y + b);
    c.stroke();
  }
  function mWave(c, x1, y1, x2, y2) {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 5));
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = i / n, side = (i % 2 ? 1 : -1) * 2;
      const vx = x1 + (x2 - x1) * t, vy = y1 + (y2 - y1) * t;
      if (x1 === x2) { if (i) c.lineTo(vx + side, vy); else c.moveTo(vx + side, vy); }
      else if (i) c.lineTo(vx, vy + side); else c.moveTo(vx, vy + side);
    }
    c.stroke();
  }
  function mFermata(c, x, y) {
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(x, y, GAP * 0.9, Math.PI, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x, y - 1.5, 1.4, 0, Math.PI * 2); c.fill();
  }
  function mTreble(c, x, top) {
    const G = GAP;
    c.lineWidth = 1.3;
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
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x - 0.5 * G, top + 1.0 * G);
    c.bezierCurveTo(x - 0.5 * G, top - 0.1 * G, x + 1.1 * G, top - 0.2 * G, x + 1.0 * G, top + 1.2 * G);
    c.bezierCurveTo(x + 0.9 * G, top + 2.4 * G, x, top + 3.2 * G, x - 0.7 * G, top + 3.6 * G);
    c.stroke();
    c.beginPath(); c.arc(x - 0.45 * G, top + 1.0 * G, 0.32 * G, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 1.5 * G, top + 0.5 * G, 1.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 1.5 * G, top + 1.5 * G, 1.2, 0, Math.PI * 2); c.fill();
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
      for (let q = -2; q >= p; q -= 2) { const y = yAt(top, q); put(x, (c) => mLine(c, x - RX * 1.7, y, x + RX * 1.7, y, 0.9)); }
      for (let q = 10; q <= p; q += 2) { const y = yAt(top, q); put(x, (c) => mLine(c, x - RX * 1.7, y, x + RX * 1.7, y, 0.9)); }
    };
    const clampP = (p) => Math.max(staff ? -4 : -3, Math.min(staff ? 12 : 11, p));
    const dyn = (x) => { const d = pick(["pp", "p", "mp", "mf", "f", "ff", "sfz", "fp", "ppp"]); put(x, (c) => mText(c, d, x, top + GAP * 7.2, 12)); };

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
        if (Math.random() < 0.18) {
          const acc = pick(ACCIDENTAL), ax = at + 2, ay = ys[i];
          put(ax, (c) => acc(c, ax, ay));
          at += 8;
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
        put(hx, (c) => { mHead(c, hx, hy, false, k); mLine(c, vx, hy, vx, beamY(vx), 1); });
        if (Math.random() < 0.22) put(hx, (c) => { c.beginPath(); c.arc(hx, hy + (up ? 1 : -1) * GAP * 1.2, 1.1, 0, Math.PI * 2); c.fill(); });
      });
      const last = xs[n - 1];
      put(last, (c) => mBeam(c, sx[0], beamY(sx[0]), sx[n - 1], beamY(sx[n - 1]), beams, up, k));
      const odd = n % 2 === 1 || n === 6;
      if (odd || Math.random() < 0.2) {
        const ty = beamY((sx[0] + sx[n - 1]) / 2) + (up ? -GAP * (1.4 + beams * 0.5) : GAP * (1.4 + beams * 0.5));
        put(last, (c) => mTuplet(c, sx[0], sx[n - 1], ty, String(n), up));
      }
      if (Math.random() < 0.55) {
        const sy = Math.max(...ys) + GAP * 1.5, uy = Math.min(...ys) - GAP * 1.5;
        put(last, (c) => mSlur(c, xs[0], up ? sy : uy, last, up ? sy : uy, up));
      }
      if (staff && Math.random() < 0.35) put(last, (c) => mHairpin(c, xs[0], last, top + GAP * 7.2, Math.random() < 0.5));
      return at + GAP * 0.6;
    }
    // A CHORD, three or four notes deep, with its accidentals stacked
    // before it, sometimes rolled, sometimes held.
    function chord(x, p0) {
      const n = 3 + (Math.random() < 0.5 ? 1 : 0);
      const ps = [];
      let p = clampP(p0);
      for (let i = 0; i < n; i++) { ps.push(p); p = clampP(p + pick([2, 2, 3, 1])); }
      const open = Math.random() < 0.3;
      let at = x;
      const accs = ps.filter(() => Math.random() < 0.3);
      accs.forEach((q, i) => {
        const acc = pick(ACCIDENTAL), ax = at + 2, ay = yAt(top, q);
        put(ax, (c) => acc(c, ax, ay));
        at += 7;
      });
      if (Math.random() < 0.25) {
        const wx = at + 1, y1 = yAt(top, ps[n - 1]) - 4, y2 = yAt(top, ps[0]) + 4;
        put(wx, (c) => mWave(c, wx, y1, wx, y2));
        at += 7;
      }
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
      put(hx, (c) => mLine(c, vx, up ? lo : hi, vx, tip, 1));
      if (!open && Math.random() < 0.35) put(hx, (c) => mFlag(c, vx, tip, up, pick([1, 2])));
      if (Math.random() < 0.3) put(hx, (c) => mText(c, ">", hx, up ? tip - GAP : hi - GAP * 1.5, 11, "bold"));
      if (Math.random() < 0.35) dyn(hx);
      return hx + GAP * 3 + (open ? GAP : 0);
    }
    // A GRACE NOTE, slashed, before the note it leans on.
    function grace(x, p0) {
      const gx = x + 4, gy = yAt(top, p0 + 1), vx = gx + RX * 0.6;
      put(gx, (c) => { mHead(c, gx, gy, false, 0.6); mLine(c, vx, gy, vx, gy - GAP * 2.2, 0.8); mFlag(c, vx, gy - GAP * 2.2, true, 1); mLine(c, vx - 4, gy - GAP * 0.9, vx + 4, gy - GAP * 1.9, 0.8); });
      const hx = gx + GAP * 1.8, hy = yAt(top, p0);
      ledger(hx, p0);
      put(hx, (c) => { mSlur(c, gx, gy + 5, hx - 2, hy + 5, true); mHead(c, hx, hy, false); mLine(c, hx + RX * 0.92, hy, hx + RX * 0.92, hy - GAP * 3.3, 1); });
      return hx + GAP * 2.4;
    }
    // A TRILL on a held note.
    function trill(x, p0) {
      const hx = x + RX, hy = yAt(top, p0), end = hx + GAP * 5;
      ledger(hx, p0);
      put(hx, (c) => { mHead(c, hx, hy, true); mLine(c, hx - RX * 0.92, hy, hx - RX * 0.92, hy + GAP * 3.3, 1); });
      put(hx, (c) => { mText(c, "tr", hx, top - GAP * 1.8, 12); mWave(c, hx + 8, top - GAP * 1.8, end, top - GAP * 1.8); });
      return end + GAP;
    }
    function rest(x) {
      const kind = pick(["q", "e", "s", "h"]);
      put(x + 3, (c) => mRest(c, x + 3, top, kind));
      return x + GAP * 2;
    }
    // A HAMMERED CLUSTER: seconds piled up, heads either side of the stem.
    function cluster(x, p0) {
      const n = 5 + Math.floor(Math.random() * 3);
      const hx = x + RX * 2;
      for (let i = 0; i < n; i++) {
        const q = p0 + i, nx = i % 2 ? hx + RX * 1.85 : hx;
        put(hx, (c) => mHead(c, nx, yAt(top, q), false));
      }
      const vx = hx + RX * 0.92;
      put(hx, (c) => mLine(c, vx, yAt(top, p0), vx, yAt(top, p0 + n - 1) - GAP * 3, 1));
      put(hx, (c) => { mFermata(c, hx + RX, yAt(top, p0 + n - 1) - GAP * 4); mText(c, "sfz", hx + RX, yAt(top, p0) + GAP * 2.4, 12); });
      return hx + GAP * 4;
    }
    return { marks, put, run, chord, grace, trill, rest, cluster, dyn };
  }

  // A STAVE, or a grand staff: one stave or two braced, a clef, a key,
  // a time that changes, a tempo, and bars of texture.
  const TEMPI = ["Allegro con fuoco", "Presto agitato", "Andante sostenuto", "Lento, rubato", "Vivace", "Moderato misterioso", "Adagio espressivo", "Scherzando"];
  const TIMES = [["7", "8"], ["5", "4"], ["6", "8"], ["9", "8"], ["3", "4"], ["12", "8"], ["5", "8"], ["11", "16"]];
  function stave() {
    if (qimuMode() !== "staves") return null;
    // Forget the staves that have gone.
    for (let i = staves.length - 1; i >= 0; i--) if (!things.includes(staves[i])) staves.splice(i, 1);
    const grand = Math.random() < 0.45;
    const tall = grand ? GAP * 14 : GAP * 4;
    // Kept clear of the other staves standing, so two never print over
    // each other.
    let y = null;
    for (let i = 0; i < 10; i++) {
      const tryY = rand(CHROME + 34, H - 70 - tall);
      if (staves.every((s) => s.ending || tryY > s.y + s.tall + GAP * 8 || tryY + tall + GAP * 8 < s.y)) { y = tryY; break; }
    }
    if (y === null) return null;
    const x0 = rand(-40, W * 0.25), x1 = rand(W * 0.7, W + 40);
    const tops = grand ? [y, y + GAP * 10] : [y];
    const writers = tops.map((top, i) => writer(top, true));
    // The head of it: clef, key, time, tempo.
    const head = Math.max(x0, 0) + 12;
    const key = Math.floor(Math.random() * 5), sharps = Math.random() < 0.5;
    const time = pick(TIMES);
    tops.forEach((top, i) => {
      const w = writers[i];
      const bass = grand && i === 1;
      w.put(head, (c) => (bass ? mBass(c, head + 4, top) : mTreble(c, head + 6, top)));
      const order = sharps ? [8, 5, 9, 6, 3] : [4, 7, 3, 6, 2];
      for (let k = 0; k < key; k++) {
        const kx = head + 24 + k * 7, ky = yAt(top, order[k] - (bass ? 2 : 0));
        w.put(kx, (c) => (sharps ? mSharp(c, kx, ky) : mFlat(c, kx, ky)));
      }
      const tx = head + 30 + key * 7;
      w.put(tx, (c) => { mText(c, time[0], tx, top + GAP, GAP * 2.1, "bold"); mText(c, time[1], tx, top + GAP * 3, GAP * 2.1, "bold"); });
    });
    const tempo = pick(TEMPI);
    writers[0].put(head, (c) => { c.save(); c.font = "italic bold 11px Georgia, 'Times New Roman', serif"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(tempo, head, y - GAP * 3.2); c.restore(); });
    const start = head + 46 + key * 7;
    // THE BARS, the same for every stave of it.
    const bars = [];
    for (let bx = start + rand(150, 230); bx < x1 - 40; bx += rand(160, 250)) bars.push(bx);
    const edges = [start].concat(bars, [x1 - 14]);
    for (let m = 0; m < edges.length - 1; m++) {
      const from = edges[m] + 10, to = edges[m + 1] - 10;
      tops.forEach((top, i) => {
        const w = writers[i];
        const low = grand && i === 1;
        let x = from;
        // A time that changes at the bar, now and then.
        if (m && Math.random() < 0.18) {
          const t = pick(TIMES), tx = x + 6;
          w.put(tx, (c) => { mText(c, t[0], tx, top + GAP, GAP * 2.1, "bold"); mText(c, t[1], tx, top + GAP * 3, GAP * 2.1, "bold"); });
          x += 20;
        }
        let guard = 0;
        while (x < to - 26 && guard++ < 30) {
          const room = to - x, r = Math.random();
          const p0 = low ? Math.floor(rand(-2, 5)) : Math.floor(rand(1, 9));
          if (r < 0.42 && room > GAP * 7) {
            const n = Math.min(pick([4, 5, 6, 7, 8, 3]), Math.floor(room / (GAP * 1.9)));
            if (n >= 3) { x = w.run(x, n, pick([2, 2, 3, 1]), p0); continue; }
          }
          if (r < 0.62 && room > GAP * 5) { x = w.chord(x, low ? p0 - 2 : p0 - 1); continue; }
          if (!low && r < 0.72 && room > GAP * 5) { x = w.grace(x, p0); continue; }
          if (!low && r < 0.78 && room > GAP * 7) { x = w.trill(x, p0); continue; }
          if (room > GAP * 2.5) { x = w.rest(x); continue; }
          break;
        }
        if (Math.random() < 0.3) w.dyn(from + 10);
      });
    }
    const marks = writers.reduce((all, w) => all.concat(w.marks), []);
    const one = {
      y: y, tall: tall, x0: x0, x1: x1,
      life: rand(9000, 12000),
      draw(c, age, a) {
        const reach = x0 + (x1 - x0) * ease(age / QIMU_WRITE_MS);
        c.strokeStyle = "rgba(" + QIMU_BLUE + "," + (QIMU_LINE * a) + ")";
        tops.forEach((top) => {
          for (let k = 0; k < 5; k++) mLine(c, x0, top + k * GAP, reach, top + k * GAP, 0.9);
        });
        // The bars, through both staves of a grand staff, and the brace
        // that holds the two together; a double bar at the end.
        const foot = tops[tops.length - 1] + 4 * GAP;
        bars.forEach((bx) => { if (bx <= reach) mLine(c, bx, y, bx, foot, 0.9); });
        if (grand && reach > head) {
          mLine(c, head - 6, y, head - 6, foot, 0.9);
          c.lineWidth = 1.6;
          c.beginPath();
          const bx = head - 11, mid = (y + foot) / 2;
          c.moveTo(bx + 3, y);
          c.bezierCurveTo(bx - 3, y + 8, bx + 3, mid - 10, bx - 3, mid);
          c.bezierCurveTo(bx + 3, mid + 10, bx - 3, foot - 8, bx + 3, foot);
          c.stroke();
        }
        if (reach >= x1 - 14) {
          mLine(c, x1 - 14, y, x1 - 14, foot, 0.9);
          mLine(c, x1 - 9, y, x1 - 9, foot, 3);
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
    const at = spot(60, CHROME + 50, H - 60);
    if (!at) return null;
    const top = at.y - GAP * 2;
    const w = writer(top, false);
    const kind = pick(["run", "run", "cadenza", "cluster", "chords"]);
    let x = at.x - GAP * 6;
    if (kind === "run") {
      x = w.run(x, pick([5, 6, 7, 9, 11]), pick([2, 3]), Math.floor(rand(0, 7)));
      w.dyn(at.x - GAP * 4);
    } else if (kind === "cadenza") {
      // Small notes, many, under one slur, and a pause at the end.
      const small = writer(top, false, 0.62);
      x = small.run(x, pick([10, 12, 14]), 3, Math.floor(rand(0, 6)));
      small.put(x, (c) => mFermata(c, x, top - GAP * 2.5));
      w.marks.push(...small.marks);
    } else if (kind === "cluster") {
      x = w.cluster(x, Math.floor(rand(0, 4)));
    } else {
      for (let i = 0; i < 3; i++) x = w.chord(x, Math.floor(rand(-1, 6)));
    }
    const marks = w.marks;
    return {
      life: rand(3200, 5200),
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
    adar: [{ make: sounding, rate: 1.3, most: 8 }, { make: dust, rate: 22, most: 160 }],
    "almost-human": [{ make: figure, rate: 1.3, most: 8 }, { make: rain, rate: 26, most: 80 }],
    ataraxia: [{ make: band, rate: 0.7, most: 6 }],
    grande: [{ make: drift, rate: 90, most: 640 }],
    "les-abstraits": [{ make: concentrate, rate: 5, most: 1 }],
    tale: [{ make: doodle, rate: 2.6, most: 20 }],
    tombstone: [{ make: epitaph, rate: 0.9, most: 5 }, { make: roots, rate: 1.6, most: 11 }, { make: soil, rate: 6, most: 40 },
      { make: petal, rate: 2.6, most: 360 }],
    // `first`: how many are there at once when the house is rested on.
    qimu: [{ make: stave, rate: 0.5, most: 3, first: 1 }, { make: passage, rate: 1.3, most: 7 }],
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
      // A thing that arrives by its own means (`sharp`: Almost Human's
      // figures glitch in) is not faded up as well.
      let alpha = t.sharp ? 1 : ease(age / FADE_IN_MS);
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
