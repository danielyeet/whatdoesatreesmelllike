// ============================================================
// LES ABSTRAITS — houses/les-abstraits.html
//
// The sixth house, and until 2026-09-25 it had no ground of its own.
// The owner: "i want there to be an old armoire on one of the sides,
// which feels old, and has some iris notes in it. I want it to feel
// like the perfume belle ame ... On the other side, i want there to be
// a dripping effect from the top of the page to the bottom, where there
// will be a puddle. This puddle should start off as nonexistent and as
// the thing drips from the top of the page, then the puddle becomes
// larger and larger (capping at a specific size)".
//
// Belle Âme, in the owner's own writing on this page, is iris and iris
// butter, smooth and calming, a museum piece, "good night and sweet
// dreams", drying down to a powdery cacao. So:
//
// THE ARMOIRE stands in the left margin on the floor of the window,
// drawn in specks along its lines in an old walnut — a crown with a
// broken pediment and a finial, carved scrolls, two panelled doors (one
// arched), a drawer with its knobs, bun feet, and a key in the lock —
// a few of its specks worn away and the whole of it leaning a hair. It
// BUILDS itself up from the floor as the page opens. Its right door
// stands ajar, and in the dark behind it stand THREE IRISES — three
// falls hanging and three standards up, each with its touch of gold —
// and ORRIS POWDER, the iris's own butter, drifts out of the gap: a
// speck at a time, violet-grey, slowing and rising and gone. It drifts
// out a little faster while the pointer is near.
//
// THE DRIP is in the right margin: a bead gathers at the very top of
// the window, swells, lets go and falls the whole height of it, and
// lands in THE PUDDLE on the floor with a ring and a small splash. The
// puddle is nothing when the page opens; every drop makes it larger,
// eased as it spreads, and it stops at `PUDDLE_MOST`.
//
// IT LIVES ON THE WINDOW: the armoire stands in the room, and the page
// scrolls over it. Over the writing everything is drawn at QUIET.
//
// WITHOUT THIS SCRIPT the page is exactly what it was before it.
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
  const WALNUT = "88, 62, 44";
  const DARK = "30, 24, 22";
  const IRIS = "112, 94, 156";
  const ORRIS = "150, 136, 176";
  const STEM = "96, 112, 88";
  const GOLD = "184, 128, 46";
  const DRIP = "104, 92, 132";

  const COLUMN = 940;
  const QUIET = 0.28;
  const SOFT = 70;

  const BUILD = 2.2;               // seconds, the armoire drawn up from the floor
  const BLOOM = 1.6;               // and its irises opening after
  const PUFF_EVERY = 0.075;        // seconds between one speck of powder and the next
  const PUFF_NEAR = 0.03;          // and while the pointer is near
  const DRIP_EVERY = [1.3, 2.2];   // seconds from one drop to the next
  const DRIP_FALL = 0.95;          // seconds to fall the height of the window
  const PUDDLE_MOST = 104;         // px, half the puddle's width at its largest
  const PUDDLE_GROW = 9;           // drops to about two thirds of it

  let seed = 52231;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  let width = 0, height = 0;
  let wood = [], inside = [], irises = [], frame = null;
  let powder = [], drops = [], ripples = [], splashes = [];
  let landed = 0, puddle = 0, nextDrop = 0.6, lastPuff = 0;
  let dripX = 0, floor = 0;

  const margin = () => Math.max(0, (width - COLUMN) / 2);

  function quiet(x) {
    const edge = width > COLUMN ? (width - COLUMN) / 2 : width * 0.16;
    const soft = Math.min(SOFT, width * 0.1);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return QUIET + (1 - QUIET) * Math.max(0, 1 - Math.min(1, inside));
  }

  // ============================================================
  // THE ARMOIRE, in its own frame: x from 0 to `wide`, y from 0 at the
  // floor up to -tall. Built once per size of window.
  // ============================================================
  function along(points, gap, out, tall) {
    for (let i = 0; i + 1 < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / gap));
      for (let k = 0; k < n; k++) {
        if (random() < 0.07) continue;
        const t = k / n;
        out.push({ x: x1 + (x2 - x1) * t + between(-0.4, 0.4), y: y1 + (y2 - y1) * t + between(-0.4, 0.4),
          up: -(y1 + (y2 - y1) * t) / tall, s: between(0.9, 1.7), tone: between(0.35, 0.68) });
      }
    }
  }
  const arc = (cx, cy, r, from, to, n) => Array.from({ length: n + 1 }, (_, i) => {
    const t = from + (to - from) * (i / n);
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
  });
  const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

  function build() {
    seed = 52231;
    const room = margin();
    // Sized to the margin it stands in; on a window without margins, a
    // small one in the corner, quiet behind the writing.
    const wide = room > 120 ? Math.min(room - 34, 210) : Math.min(width * 0.26, 110);
    const tall = wide * 2.05;
    const left = room > 120 ? (room - wide) / 2 : 8;
    const baseY = height - Math.max(12, height * 0.03);
    const lean = between(-0.006, 0.006);
    wood = [];
    const put = (pts, gap) => along(pts, gap || Math.max(1.8, wide / 90), wood, tall);
    const foot = tall * 0.05, body = tall * 0.8, crown = tall * 0.06;
    const top = -(foot + body), mid = wide / 2;
    const drawerH = body * 0.13, doorTop = top + body * 0.02, doorBot = -foot - drawerH - 6;
    [wide * 0.1, wide * 0.9].forEach((fx) => put(arc(fx, -foot / 2, foot / 2, 0, Math.PI * 2, 14), 1.6));
    put(box(0, top, wide, body));
    put([[-4, -foot], [wide + 4, -foot]]);
    put([[-4, -foot - 5], [wide + 4, -foot - 5]]);
    put(box(8, -foot - drawerH - 1, wide - 16, drawerH - 4));
    [wide * 0.3, wide * 0.7].forEach((kx) => put(arc(kx, -foot - drawerH / 2 - 3, 2.4, 0, Math.PI * 2, 8), 1.3));
    put([[-6, top], [-10, top - crown * 0.4], [wide + 10, top - crown * 0.4], [wide + 6, top]]);
    put([[-12, top - crown * 0.4], [-12, top - crown], [wide + 12, top - crown], [wide + 12, top - crown * 0.4]]);
    const ped = top - crown;
    put(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [-8 + t * (mid - 18), ped - Math.sin(t * Math.PI * 0.62) * tall * 0.09]; }));
    put(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [wide + 8 - t * (mid - 18), ped - Math.sin(t * Math.PI * 0.62) * tall * 0.09]; }));
    put(arc(mid, ped - tall * 0.07, 5, 0, Math.PI * 2, 12), 1.5);
    put([[mid, ped - tall * 0.07 + 5], [mid, ped]]);
    [-1, 1].forEach((sd) => put(Array.from({ length: 16 }, (_, i) => {
      const t = (i / 15) * Math.PI * 2.4, r = 7 * (1 - i / 18);
      return [mid + sd * 22 + sd * Math.cos(t) * r, ped - tall * 0.035 + Math.sin(t) * r];
    }), 1.5));
    const dl = 8, dr = mid - 2;
    put(box(dl, doorTop, dr - dl, doorBot - doorTop));
    const pw = dr - dl - 16, pTop = doorTop + 14, pBot = doorTop + (doorBot - doorTop) * 0.62;
    put([[dl + 8, pBot], [dl + 8, pTop + pw / 2]].concat(arc(dl + 8 + pw / 2, pTop + pw / 2, pw / 2, Math.PI, Math.PI * 2, 12), [[dl + 8 + pw, pBot], [dl + 8, pBot]]));
    put(box(dl + 8, pBot + 12, pw, doorBot - pBot - 24));
    const keyY = (doorTop + doorBot) / 2;
    put(arc(dr - 7, keyY, 2.1, 0, Math.PI * 2, 8), 1.1);
    put([[dr - 7, keyY + 2], [dr - 7, keyY + 12]], 1.3);
    put(arc(dr - 7, keyY + 16, 3.4, 0, Math.PI * 2, 10), 1.3);
    // The right door, ajar, swung out on its hinge.
    const hinge = wide - 8, openW = (hinge - mid - 2) * 0.46, skew = tall * 0.035;
    put([[hinge, doorTop], [hinge + openW, doorTop - skew], [hinge + openW, doorBot + skew], [hinge, doorBot]]);
    put([[hinge + openW * 0.22, doorTop + 10 - skew * 0.22], [hinge + openW * 0.22, doorBot - 10 + skew * 0.22]], 2.4);
    inside = [];
    const many = Math.round((hinge - mid) * (doorBot - doorTop) / 26);
    for (let i = 0; i < many; i++) {
      const y = between(doorTop + 2, doorBot - 2);
      inside.push({ x: between(mid + 2, hinge), y, up: -y / tall, s: between(0.9, 1.4), tone: between(0.05, 0.14) });
    }
    irises = [0.3, 0.55, 0.78].map((k, i) => ({
      x: mid + 2 + (hinge - mid - 2) * k,
      top: doorBot - (doorBot - doorTop) * [0.52, 0.66, 0.59][i],
      turn: between(-0.2, 0.2),
    }));
    frame = { left, baseY, lean, wide, tall, hinge, doorTop, doorBot, near: false };
    // THE DRIP, in the other margin.
    dripX = room > 120 ? width - room / 2 : width - 14;
    // The floor is the very foot of the window, under the reading in
    // its corner.
    floor = height - 9;
  }

  const place = (x, y) => [frame.left + x + y * frame.lean, frame.baseY + y];

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
    const same = w === width && h === height;
    width = w; height = h;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  let handX = -99999, handY = -99999;

  const fill = (tone, a, x) => { ink.fillStyle = "rgba(" + tone + "," + Math.max(0, Math.min(1, a * quiet(x))).toFixed(3) + ")"; };

  function drawIris(f, bloom) {
    const [bx, by] = place(f.x, frame.doorBot - 4);
    const [tx, ty] = place(f.x + f.turn * 20, f.top);
    const q = quiet(tx);
    ink.lineWidth = 1;
    ink.strokeStyle = "rgba(" + STEM + "," + (0.5 * bloom * q).toFixed(3) + ")";
    ink.beginPath(); ink.moveTo(bx, by); ink.quadraticCurveTo(bx + f.turn * 10, (by + ty) / 2, tx, ty); ink.stroke();
    ink.beginPath(); ink.moveTo(bx, by); ink.quadraticCurveTo(bx - 6, by - 26, bx - 3 + f.turn * 8, by - 48 * bloom); ink.stroke();
    const r = Math.min(12, frame.wide * 0.07) * bloom;
    ink.strokeStyle = "rgba(" + IRIS + "," + (0.62 * bloom * q).toFixed(3) + ")";
    ink.fillStyle = "rgba(" + IRIS + "," + (0.16 * bloom * q).toFixed(3) + ")";
    const petal = (ang, long, fat) => {
      ink.beginPath();
      ink.moveTo(tx, ty);
      ink.quadraticCurveTo(tx + Math.cos(ang - fat) * r * long * 0.8, ty + Math.sin(ang - fat) * r * long * 0.8, tx + Math.cos(ang) * r * long, ty + Math.sin(ang) * r * long);
      ink.quadraticCurveTo(tx + Math.cos(ang + fat) * r * long * 0.8, ty + Math.sin(ang + fat) * r * long * 0.8, tx, ty);
      ink.fill(); ink.stroke();
    };
    [-1.05, 0, 1.05].forEach((k) => petal(Math.PI / 2 + k + f.turn, k ? 1.55 : 1.2, 0.42));
    [-0.38, 0, 0.38].forEach((k) => petal(-Math.PI / 2 + k + f.turn, k ? 1.2 : 1.35, 0.3));
    ink.fillStyle = "rgba(" + GOLD + "," + (0.5 * bloom * q).toFixed(3) + ")";
    [-1.05, 0, 1.05].forEach((k) => {
      const ang = Math.PI / 2 + k + f.turn;
      ink.fillRect(tx + Math.cos(ang) * r * 0.45 - 0.7, ty + Math.sin(ang) * r * 0.45 - 0.7, 1.4, 1.4);
    });
  }

  function draw(clock, dt) {
    if (!width) return;
    ink.clearRect(0, 0, width, height);

    // THE ARMOIRE, built up from the floor.
    const built = REDUCE_MOTION ? 1 : ease(clock / BUILD);
    [wood, inside].forEach((list, which) => list.forEach((p) => {
      if (p.up > built * 1.05) return;
      const [x, y] = place(p.x, p.y);
      fill(which ? DARK : WALNUT, p.tone, x);
      ink.fillRect(x, y, p.s, p.s);
    }));
    const bloom = REDUCE_MOTION ? 1 : ease((clock - BUILD * 0.85) / BLOOM);
    if (bloom > 0) irises.forEach((f) => drawIris(f, bloom));

    // THE ORRIS POWDER, out of the gap, faster while the hand is near.
    const [gx] = place(frame.hinge, 0);
    const near = Math.hypot(handX - gx, handY - (frame.baseY - frame.tall * 0.5)) < frame.tall * 0.7;
    if (!REDUCE_MOTION && bloom > 0.5 && clock - lastPuff > (near ? PUFF_NEAR : PUFF_EVERY)) {
      lastPuff = clock;
      powder.push({ x: frame.hinge + between(0, 4), y: between(frame.doorTop + 20, frame.doorBot - 20), born: clock,
        vx: between(8, 30), vy: -between(4, 16), s: between(0.9, 1.8), life: between(3, 5.4) });
    }
    for (let i = powder.length - 1; i >= 0; i--) {
      const p = powder[i], t = clock - p.born;
      if (t > p.life) { powder.splice(i, 1); continue; }
      const k = 1 - Math.exp(-t / 1.6);
      const [x, y] = place(p.x + p.vx * 1.6 * k * 3 + Math.sin(t * 1.6 + p.y) * 3, p.y + p.vy * 1.6 * k * 3);
      fill(ORRIS, 0.72 * Math.min(1, t / 0.4) * (1 - t / p.life), x);
      ink.fillRect(x, y, p.s, p.s);
    }
    if (REDUCE_MOTION) {
      // Still: a little powder standing in the air by the gap.
      for (let i = 0; i < 24; i++) {
        const [x, y] = place(frame.hinge + 6 + (i * 37) % 40, frame.doorTop + 30 + ((i * 53) % Math.max(1, frame.doorBot - frame.doorTop - 60)));
        fill(ORRIS, 0.4, x);
        ink.fillRect(x, y, 1.2, 1.2);
      }
    }

    // THE DRIP.
    const g = (2 * (floor - 12)) / (DRIP_FALL * DRIP_FALL);
    if (!REDUCE_MOTION && clock >= nextDrop) {
      drops.push({ born: clock, hang: between(0.5, 0.8) });
      nextDrop = clock + between(DRIP_EVERY[0], DRIP_EVERY[1]);
    }
    const q = quiet(dripX);
    const wet = (a) => "rgba(" + DRIP + "," + Math.min(1, a * q).toFixed(3) + ")";
    ink.fillStyle = wet(0.42);
    ink.beginPath(); ink.ellipse(dripX, 0, 6, 3, 0, 0, Math.PI * 2); ink.fill();
    ink.fillRect(dripX - 0.6, 0, 1.2, 9);
    if (REDUCE_MOTION) {
      ink.fillStyle = wet(0.5);
      ink.beginPath(); ink.ellipse(dripX, 12, 2.2, 2.8, 0, 0, Math.PI * 2); ink.fill();
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i], t = clock - d.born;
      if (t < d.hang) {
        const r = 1 + 2.4 * ease(t / d.hang);
        ink.fillStyle = wet(0.5);
        ink.beginPath(); ink.ellipse(dripX, 9 + r, r * 0.85, r * 1.1, 0, 0, Math.PI * 2); ink.fill();
        continue;
      }
      const f = t - d.hang;
      const y = 12 + 0.5 * g * f * f;
      if (y >= floor) {
        drops.splice(i, 1);
        landed++;
        ripples.push({ born: clock });
        for (let k = 0; k < 5; k++) splashes.push({ born: clock, vx: between(-60, 60), vy: -between(50, 110), s: between(0.8, 1.4) });
        continue;
      }
      const v = g * f / 1000;
      ink.fillStyle = wet(0.55);
      ink.beginPath(); ink.ellipse(dripX, y, 2.3, 3 + Math.min(4, v * 3), 0, 0, Math.PI * 2); ink.fill();
      ink.fillStyle = wet(0.22);
      for (let k = 1; k < 5; k++) ink.fillRect(dripX - 0.5, y - k * (4 + v * 6), 1, 1);
    }

    // THE PUDDLE: nothing until the first drop, then larger with each,
    // eased as it spreads, up to its most.
    const most = Math.min(PUDDLE_MOST, Math.max(40, margin() * 0.42));
    const want = REDUCE_MOTION ? most * 0.6 : most * (1 - Math.exp(-landed / PUDDLE_GROW));
    puddle += (want - puddle) * Math.min(1, dt * 3);
    const rx = puddle, ry = Math.max(0.5, rx * 0.15);
    if (rx > 0.5) {
      ink.fillStyle = wet(0.15);
      ink.beginPath(); ink.ellipse(dripX, floor, rx, ry, 0, 0, Math.PI * 2); ink.fill();
      ink.strokeStyle = wet(0.36);
      ink.lineWidth = 1;
      ink.beginPath(); ink.ellipse(dripX, floor, rx, ry, 0, 0, Math.PI * 2); ink.stroke();
      ink.strokeStyle = wet(0.18);
      ink.beginPath(); ink.ellipse(dripX - rx * 0.12, floor - ry * 0.2, rx * 0.55, ry * 0.45, 0, Math.PI * 1.1, Math.PI * 1.7); ink.stroke();
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const k = (clock - ripples[i].born) / 0.9;
      if (k >= 1) { ripples.splice(i, 1); continue; }
      const r = 4 + k * Math.max(16, rx * 0.8);
      ink.strokeStyle = wet(0.38 * (1 - k));
      ink.beginPath(); ink.ellipse(dripX, floor, r, r * 0.15, 0, 0, Math.PI * 2); ink.stroke();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i], t = clock - s.born;
      if (t > 0.42) { splashes.splice(i, 1); continue; }
      ink.fillStyle = wet(0.45 * (1 - t / 0.42));
      ink.fillRect(dripX + s.vx * t, floor + s.vy * t + 600 * t * t, s.s, s.s);
    }
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => { handX = event.clientX; handY = event.clientY; };
  window.addEventListener("pointermove", hand, { passive: true });
  window.addEventListener("pointerdown", hand, { passive: true });
  document.addEventListener("pointerleave", () => { handX = -99999; handY = -99999; });
  window.addEventListener("resize", () => { size(); if (REDUCE_MOTION) draw(0, 0); });

  size();

  if (REDUCE_MOTION) {
    draw(0, 0);
  } else {
    const began = performance.now();
    let last = began;
    (function tick(now) {
      draw((now - began) / 1000, Math.min(0.1, (now - last) / 1000));
      last = now;
      requestAnimationFrame(tick);
    })(performance.now());
  }
})();
