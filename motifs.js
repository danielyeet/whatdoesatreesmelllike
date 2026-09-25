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
// Almost Human's clouded figures glitching into being and its rain,
// Ataraxia's bands of particles running as waves and shaking the air
// round them, Grande's particles rising and bursting, Les Abstraits'
// old armoire with iris in it and a drip filling a puddle, Tale's
// doodles, Tombstone's names cut into the wall and its roots and
// flowers, and Qimu & Musicians' music, written out on short staves and
// loose on the page.
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

  // ---------- LES ABSTRAITS: an old armoire with iris in it, and a drip ----------
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
  // THE ARMOIRE is drawn in specks along its lines, in an old walnut —
  // crown, broken pediment, two panelled doors, a drawer, bun feet, a key
  // — building itself up from the floor, a few specks worn away and the
  // whole leaning a hair. Its right door stands ajar, and in the dark
  // behind it three irises stand, and ORRIS POWDER — Belle Âme's iris
  // butter, powdery and old — drifts out of the gap.
  // THE DRIP is on the other side: a bead gathering at the very top of
  // the window, swelling, falling the whole height, and landing in THE
  // PUDDLE, which is nothing at first and grows with every drop up to
  // `PUDDLE_MOST`.
  const WALNUT = "88, 62, 44";
  const IRIS = "112, 94, 156";
  const ORRIS = "150, 136, 176";
  const STEM = "96, 112, 88";
  const DRIP_INK = "104, 92, 132";
  const ARMOIRE_BUILD = 1800;            // ms, drawn up from the floor
  const DRIP_EVERY = [900, 1300];        // ms from one drop to the next
  const DRIP_FALL = 760;                 // ms, the whole height of the window
  const PUDDLE_MOST = 118;               // px, half the puddle's width at most
  const PUDDLE_GROW = 7;                 // drops to reach about two thirds of it
  let abstraitSide = -1;                 // where the armoire stands: -1 left, 1 right

  /** Specks along a polyline, `gap` apart, each carrying how far up the
      armoire it is so it can be built from the floor. */
  function specksAlong(points, gap, out, tall) {
    for (let i = 0; i + 1 < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / gap));
      for (let k = 0; k < n; k++) {
        if (Math.random() < 0.07) continue;
        const t = k / n;
        const x = x1 + (x2 - x1) * t + rand(-0.4, 0.4), y = y1 + (y2 - y1) * t + rand(-0.4, 0.4);
        out.push({ x, y, up: -y / tall, s: rand(1, 1.8), tone: rand(0.35, 0.7) });
      }
    }
  }
  const arcPts = (cx, cy, r, from, to, n) => Array.from({ length: n + 1 }, (_, i) => {
    const t = from + (to - from) * (i / n);
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
  });
  const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

  function armoire() {
    // On the left: the way round stands at the right of the window, and
    // the armoire is too large to stand behind it.
    abstraitSide = -1;
    const tall = Math.max(220, Math.min(H * 0.56, 420));
    const wide = tall * 0.5;
    const baseY = H - Math.max(18, H * 0.04);
    const left = abstraitSide < 0 ? Math.max(14, W * 0.1 - wide / 2) : Math.min(W - wide - 14, W * 0.9 - wide / 2);
    const lean = rand(-0.006, 0.006);
    // In the armoire's own frame: x from 0 to `wide`, y from 0 at the
    // floor up to -tall.
    const specks = [];
    const put = (pts, gap) => specksAlong(pts, gap || 2.3, specks, tall);
    const foot = tall * 0.05, body = tall * 0.8, crown = tall * 0.06;
    const top = -(foot + body), mid = wide / 2;
    const drawerH = body * 0.13, doorTop = top + body * 0.02, doorBot = -foot - drawerH - 6;
    // Feet: four buns, two seen.
    [wide * 0.1, wide * 0.9].forEach((fx) => put(arcPts(fx, -foot / 2, foot / 2, 0, Math.PI * 2, 14), 1.8));
    // The carcass, with a plinth moulding at its foot.
    put(rectPts(0, top, wide, body));
    put([[-4, -foot], [wide + 4, -foot]]);
    put([[-4, -foot - 5], [wide + 4, -foot - 5]]);
    // The drawer, and its two knobs.
    put(rectPts(8, -foot - drawerH - 1, wide - 16, drawerH - 4));
    [wide * 0.3, wide * 0.7].forEach((kx) => put(arcPts(kx, -foot - drawerH / 2 - 3, 2.6, 0, Math.PI * 2, 8), 1.4));
    // The crown: a cornice stepping out, and a broken pediment with a
    // finial between its two halves.
    put([[-6, top], [-10, top - crown * 0.4], [wide + 10, top - crown * 0.4], [wide + 6, top]]);
    put([[-12, top - crown * 0.4], [-12, top - crown], [wide + 12, top - crown], [wide + 12, top - crown * 0.4]]);
    const ped = top - crown;
    put(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [-8 + t * (mid - 18), ped - Math.sin(t * Math.PI * 0.62) * tall * 0.09]; }));
    put(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [wide + 8 - t * (mid - 18), ped - Math.sin(t * Math.PI * 0.62) * tall * 0.09]; }));
    put(arcPts(mid, ped - tall * 0.07, 5, 0, Math.PI * 2, 12), 1.6);
    put([[mid, ped - tall * 0.07 + 5], [mid, ped]]);
    // A carved scroll either side of the finial.
    [-1, 1].forEach((sd) => put(Array.from({ length: 16 }, (_, i) => {
      const t = i / 15 * Math.PI * 2.4, r = 7 * (1 - i / 18);
      return [mid + sd * 22 + sd * Math.cos(t) * r, ped - tall * 0.035 + Math.sin(t) * r];
    }), 1.6));
    // The left door, shut: an arched upper panel and a lower one.
    const dl = 8, dr = mid - 2;
    put(rectPts(dl, doorTop, dr - dl, doorBot - doorTop));
    const pw = dr - dl - 16, pTop = doorTop + 14, pBot = doorTop + (doorBot - doorTop) * 0.62;
    put([[dl + 8, pBot], [dl + 8, pTop + pw / 2]].concat(arcPts(dl + 8 + pw / 2, pTop + pw / 2, pw / 2, Math.PI, Math.PI * 2, 12), [[dl + 8 + pw, pBot], [dl + 8, pBot]]));
    put(rectPts(dl + 8, pBot + 12, pw, doorBot - pBot - 24));
    // The keyhole, and its key.
    put(arcPts(dr - 7, (doorTop + doorBot) / 2, 2.2, 0, Math.PI * 2, 8), 1.2);
    put([[dr - 7, (doorTop + doorBot) / 2 + 2], [dr - 7, (doorTop + doorBot) / 2 + 12]], 1.4);
    put(arcPts(dr - 7, (doorTop + doorBot) / 2 + 16, 3.6, 0, Math.PI * 2, 10), 1.4);
    // The right door, ajar: swung out on its hinge at the right edge, so
    // it is seen narrow and in perspective beyond the carcass.
    const hinge = wide - 8, swing = (mid + 2 - hinge);
    const openW = Math.abs(swing) * 0.46, skew = tall * 0.035;
    put([[hinge, doorTop], [hinge + openW, doorTop - skew], [hinge + openW, doorBot + skew], [hinge, doorBot]]);
    put([[hinge + openW * 0.22, doorTop + 10 - skew * 0.22], [hinge + openW * 0.22, doorBot - 10 + skew * 0.22]], 2.6);
    // The dark inside, where the door has left it: a loose fill.
    const inside = [];
    for (let i = 0; i < 520; i++) {
      const x = rand(mid + 2, hinge), y = rand(doorTop + 2, doorBot - 2);
      inside.push({ x, y, up: -y / tall, s: rand(0.9, 1.5), tone: rand(0.06, 0.16) });
    }
    // Three irises standing in it, of three heights.
    const irises = [0.3, 0.55, 0.78].map((k, i) => ({
      x: mid + 2 + (hinge - mid - 2) * k, top: doorBot - (doorBot - doorTop) * (0.52 + 0.14 * ((i * 7) % 3) / 2), turn: rand(-0.2, 0.2),
    }));
    const powder = [];
    let lastPuff = 0;
    // On the right of the window it is drawn the other way round, so its
    // open door always faces into the page.
    const toWindow = (x, y) => [left + (abstraitSide < 0 ? x : wide - x) + (y * lean), baseY + y];
    return {
      box: { left: left - 20, right: left + wide + 20, top: baseY - tall - 40, bottom: baseY },
      draw(c, age, a) {
        const built = ease(age / ARMOIRE_BUILD);
        const all = [specks, inside];
        all.forEach((list, which) => list.forEach((p) => {
          if (p.up > built * 1.05) return;
          const [x, y] = toWindow(p.x, p.y);
          c.fillStyle = "rgba(" + (which ? "20, 16, 14" : WALNUT) + "," + (p.tone * a) + ")";
          c.fillRect(x, y, p.s, p.s);
        }));
        // THE IRISES, once it is built: a stem, three falls and three
        // standards, in a fine line.
        const bloom = ease((age - ARMOIRE_BUILD * 0.8) / 1400);
        if (bloom > 0) irises.forEach((f) => {
          const [bx, by] = toWindow(f.x, doorBot - 4);
          const [tx, ty] = toWindow(f.x + f.turn * 20, f.top);
          c.strokeStyle = "rgba(" + STEM + "," + (0.5 * a * bloom) + ")";
          c.lineWidth = 1;
          c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + f.turn * 10, (by + ty) / 2, tx, ty); c.stroke();
          // A blade of a leaf.
          c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 6, by - 26, bx - 3 + f.turn * 8, by - 48 * bloom); c.stroke();
          const r = 12 * bloom;
          c.strokeStyle = "rgba(" + IRIS + "," + (0.62 * a * bloom) + ")";
          c.fillStyle = "rgba(" + IRIS + "," + (0.16 * a * bloom) + ")";
          const petal = (ang, long, fat) => {
            c.beginPath();
            c.moveTo(tx, ty);
            c.quadraticCurveTo(tx + Math.cos(ang - fat) * r * long * 0.8, ty + Math.sin(ang - fat) * r * long * 0.8, tx + Math.cos(ang) * r * long, ty + Math.sin(ang) * r * long);
            c.quadraticCurveTo(tx + Math.cos(ang + fat) * r * long * 0.8, ty + Math.sin(ang + fat) * r * long * 0.8, tx, ty);
            c.fill(); c.stroke();
          };
          // Three FALLS, hanging down and out, and three STANDARDS, up
          // and folded in — an iris, not any flower.
          [-1.05, 0, 1.05].forEach((k) => petal(Math.PI / 2 + k + f.turn, k ? 1.55 : 1.2, 0.42));
          [-0.38, 0, 0.38].forEach((k) => petal(-Math.PI / 2 + k + f.turn, k ? 1.2 : 1.35, 0.3));
          // The beard on each fall, a touch of gold.
          c.fillStyle = "rgba(184, 128, 46," + (0.5 * a * bloom) + ")";
          [-1.05, 0, 1.05].forEach((k) => {
            const ang = Math.PI / 2 + k + f.turn;
            c.fillRect(tx + Math.cos(ang) * r * 0.45 - 0.7, ty + Math.sin(ang) * r * 0.45 - 0.7, 1.4, 1.4);
          });
        });
        // THE ORRIS POWDER, out of the gap: a speck at a time, drifting
        // out and up, slowing, fading.
        if (bloom > 0.5 && age - lastPuff > 50) {
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
      },
    };
  }

  function drip() {
    const x = (abstraitSide < 0 ? W * 0.86 : W * 0.14) + rand(-12, 12);
    const floor = H - Math.max(22, H * 0.045);
    const drops = [];
    let landed = 0, next = 500;
    const ripples = [];
    const splashes = [];
    const g = (2 * (floor - 12)) / (DRIP_FALL * DRIP_FALL);
    return {
      draw(c, age, a) {
        const ink = (k) => "rgba(" + DRIP_INK + "," + (k * a) + ")";
        // A drop is born at the top every so often: it gathers, then
        // lets go.
        if (age >= next) {
          drops.push({ born: age, hang: rand(420, 620) });
          next = age + rand(DRIP_EVERY[0], DRIP_EVERY[1]);
        }
        // What clings along the top edge, always.
        c.fillStyle = ink(0.4);
        c.beginPath(); c.ellipse(x, 0, 6, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 0.6, 0, 1.2, 9);
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i], t = age - d.born;
          if (t < d.hang) {
            // Swelling where it hangs.
            const r = 1 + 2.6 * ease(t / d.hang);
            c.fillStyle = ink(0.5);
            c.beginPath(); c.ellipse(x, 9 + r, r * 0.85, r * 1.1, 0, 0, Math.PI * 2); c.fill();
            continue;
          }
          const f = t - d.hang;
          const y = 12 + 0.5 * g * f * f;
          if (y >= floor) {
            drops.splice(i, 1);
            landed++;
            ripples.push({ born: age });
            for (let k = 0; k < 5; k++) splashes.push({ born: age, vx: rand(-0.06, 0.06), vy: -rand(0.05, 0.11), s: rand(0.8, 1.4) });
            continue;
          }
          // Falling: a bead drawn out a little by its own speed, with a
          // few specks trailing.
          const v = g * f;
          c.fillStyle = ink(0.55);
          c.beginPath(); c.ellipse(x, y, 2.4, 3 + Math.min(4, v * 3), 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = ink(0.25);
          for (let k = 1; k < 5; k++) c.fillRect(x - 0.5, y - k * (4 + v * 6), 1, 1);
        }
        // THE PUDDLE: nothing until the first drop, then larger with each,
        // up to PUDDLE_MOST, eased as it spreads.
        const want = PUDDLE_MOST * (1 - Math.exp(-landed / PUDDLE_GROW));
        this.puddle = (this.puddle || 0) + (want - (this.puddle || 0)) * 0.06;
        const rx = this.puddle, ry = Math.max(0.5, rx * 0.16);
        if (rx > 0.5) {
          c.fillStyle = ink(0.16);
          c.beginPath(); c.ellipse(x, floor, rx, ry, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = ink(0.38);
          c.lineWidth = 1;
          c.beginPath(); c.ellipse(x, floor, rx, ry, 0, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = ink(0.2);
          c.beginPath(); c.ellipse(x - rx * 0.12, floor - ry * 0.2, rx * 0.55, ry * 0.45, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const q = (age - ripples[i].born) / 900;
          if (q >= 1) { ripples.splice(i, 1); continue; }
          const r = 4 + q * Math.max(18, rx * 0.8);
          c.strokeStyle = ink(0.4 * (1 - q));
          c.beginPath(); c.ellipse(x, floor, r, r * 0.16, 0, 0, Math.PI * 2); c.stroke();
        }
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i], t = age - s.born;
          if (t > 420) { splashes.splice(i, 1); continue; }
          c.fillStyle = ink(0.45 * (1 - t / 420));
          c.fillRect(x + s.vx * t, floor + s.vy * t + 0.0006 * t * t, s.s, s.s);
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
    adar: [{ make: sounding, rate: 1.3, most: 8 }, { make: dust, rate: 22, most: 160 }],
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
