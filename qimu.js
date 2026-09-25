// ============================================================
// QIMU & MUSICIANS — houses/qimu-and-musicians.html
//
// The ninth house, a house of music, and until 2026-09-25 it had no
// ground of its own. The owner: "add some complex notes; and some 5
// lines in which they will exist. I dont wan tit to be sloppy or out of
// place, and I want them to be nicely animated. When there are 5
// lines, dont make them always 4/4, i want that to vary, make it random
// (as long as its an actual used notation). I want it to look complex.
// Overall the Qimu and musicians effect should be subtle though, I dont
// want it to take over the page." And the page is blue: "semi light
// blue" (`.qimu-page` in style.css).
//
// WHAT IT IS: short STAVES standing in the margins either side of the
// writing, one under another down the whole length of the page — a
// score kept in the margins — each engraved properly: a clef (treble,
// or bass on the lower of a braced pair), a key signature, a TIME
// SIGNATURE picked from the ones music actually uses (`TIMES` — 4/4 is
// one of fourteen), now and then a change of time at a bar, and bars of
// real texture: beamed runs of semiquavers and demisemiquavers,
// tuplets, chords with their accidentals, clusters, rests, slurs. No
// dynamics and no ornaments, as on the Houses view.
//
// NICELY ANIMATED, and quietly:
//   WRITTEN IN  a stave is written left to right, as a pen would, the
//               first time it comes into the window;
//   PLAYED      then a faint playhead passes along it, bar after bar, at
//               a tempo of its own, and each note it reaches LIFTS — a
//               little stronger, for a moment — as a note sounds and
//               dies away. The staves play one after another rather
//               than all at once;
//   THE HAND    and the notes near the pointer stand a shade stronger.
//
// IT LIVES DOWN THE DOCUMENT, not on the window: a score is read down
// the page, and staves that stayed put while the writing scrolled past
// them would read as a screen rather than as music. So the canvas is
// fixed and the staves are carried in the page's own coordinates, as
// Pineward's wood is. On a window without margins the staves are drawn
// across it at QUIET, behind the writing.
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
  const BLUE = "44, 62, 99";
  const LINE = 0.2;                // how strong a stave's lines are
  const NOTE = 0.34;               // and what is written on it
  const PLAYED = 0.22;             // how much a note lifts as it is played
  const HANDED = 0.14;             // and near the pointer
  const COLUMN = 940;
  const QUIET = 0.24;              // what is left over the writing, where there are no margins

  const GAP = 6;                   // between one line of a stave and the next
  const EVERY = 210;               // px down the page from one stave to the next
  const WRITE = 1.8;               // seconds, a stave written end to end
  const BAR_SECONDS = [2.2, 3.6];  // how long the playhead takes over one bar
  const RING = 0.9;                // seconds a played note takes to die away
  const HAND = 90;

  let seed = 77013;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const pick = (list) => list[Math.floor(random() * list.length)];
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // ============================================================
  // THE ENGRAVER'S STROKES — the same as the Houses view's, kept here
  // because no page script knows about another.
  // ============================================================
  const RX = GAP * 0.6, RY = GAP * 0.42;
  const yAt = (top, p) => top + 4 * GAP - p * GAP / 2;
  const line = (x1, y1, x2, y2, w) => { ink.lineWidth = w || 0.9; ink.beginPath(); ink.moveTo(x1, y1); ink.lineTo(x2, y2); ink.stroke(); };
  function head(x, y, open) {
    ink.beginPath();
    ink.ellipse(x, y, RX, RY, -0.35, 0, Math.PI * 2);
    if (open) { ink.lineWidth = 0.9; ink.stroke(); } else ink.fill();
  }
  function beam(x1, y1, x2, y2, n, up) {
    for (let i = 0; i < n; i++) {
      const d = (up ? 1 : -1) * i * GAP * 0.55;
      ink.beginPath();
      ink.moveTo(x1, y1 + d - 1); ink.lineTo(x2, y2 + d - 1); ink.lineTo(x2, y2 + d + 1); ink.lineTo(x1, y1 + d + 1);
      ink.closePath();
      ink.fill();
    }
  }
  function sharp(x, y) {
    line(x - 1.2, y - GAP * 1.2, x - 1.2, y + GAP * 1.3, 0.7);
    line(x + 1.2, y - GAP * 1.35, x + 1.2, y + GAP * 1.15, 0.7);
    line(x - 2.4, y - GAP * 0.35 + 0.8, x + 2.4, y - GAP * 0.35 - 0.8, 1.4);
    line(x - 2.4, y + GAP * 0.4 + 0.8, x + 2.4, y + GAP * 0.4 - 0.8, 1.4);
  }
  function flat(x, y) {
    line(x - 1.4, y - GAP * 1.8, x - 1.4, y + GAP * 0.5, 0.8);
    ink.lineWidth = 1.1;
    ink.beginPath();
    ink.moveTo(x - 1.4, y + GAP * 0.5);
    ink.bezierCurveTo(x + 3.6, y - GAP * 0.1, x + 2, y - GAP * 0.9, x - 1.4, y - GAP * 0.1);
    ink.stroke();
  }
  function natural(x, y) {
    line(x - 1.2, y - GAP * 1.3, x - 1.2, y + GAP * 0.5, 0.7);
    line(x + 1.2, y - GAP * 0.5, x + 1.2, y + GAP * 1.3, 0.7);
    line(x - 1.2, y - GAP * 0.3 + 0.6, x + 1.2, y - GAP * 0.3 - 0.6, 1.3);
    line(x - 1.2, y + GAP * 0.35 + 0.6, x + 1.2, y + GAP * 0.35 - 0.6, 1.3);
  }
  const ACCIDENTALS = [sharp, flat, natural];
  function rest(x, top, kind) {
    const y = top + GAP * 2;
    if (kind === "q") {
      ink.lineWidth = 1.2;
      ink.beginPath();
      ink.moveTo(x - 1.2, y - GAP * 1.5); ink.lineTo(x + 1.7, y - GAP * 0.7); ink.lineTo(x - 1.2, y + GAP * 0.1);
      ink.lineTo(x + 1.7, y + GAP * 0.8); ink.quadraticCurveTo(x - 2.3, y + GAP * 0.9, x, y + GAP * 1.6);
      ink.stroke();
    } else if (kind === "h") {
      ink.fillRect(x - 3, y - GAP * 0.5, 6, GAP * 0.45);
    } else {
      ink.beginPath(); ink.arc(x - 1.2, y - GAP * 0.5, 1.2, 0, Math.PI * 2); ink.fill();
      line(x + 2, y - GAP * 0.7, x - 0.8, y + GAP * 1.2, 0.9);
    }
  }
  function slur(x1, y1, x2, y2, below) {
    const lift = (below ? 1 : -1) * Math.min(GAP * 1.6, 4 + (x2 - x1) * 0.12);
    ink.lineWidth = 0.8;
    ink.beginPath();
    ink.moveTo(x1, y1);
    ink.bezierCurveTo(x1 + (x2 - x1) * 0.25, y1 + lift, x1 + (x2 - x1) * 0.75, y2 + lift, x2, y2);
    ink.stroke();
  }
  function text(t, x, y, px, style) {
    ink.font = (style || "bold") + " " + px + "px Georgia, 'Times New Roman', serif";
    ink.textAlign = "center";
    ink.textBaseline = "middle";
    ink.fillText(t, x, y);
  }
  function tuplet(x1, x2, y, label, up) {
    const d = up ? 3 : -3, mid = (x1 + x2) / 2;
    ink.lineWidth = 0.6;
    ink.beginPath();
    ink.moveTo(x1, y + d); ink.lineTo(x1, y); ink.lineTo(mid - 4, y);
    ink.moveTo(mid + 4, y); ink.lineTo(x2, y); ink.lineTo(x2, y + d);
    ink.stroke();
    text(label, mid, y, 8, "italic");
  }
  function time(t, x, top) {
    text(t[0], x, top + GAP, GAP * 2.1);
    text(t[1], x, top + GAP * 3, GAP * 2.1);
  }
  function treble(x, top) {
    const G = GAP;
    ink.lineWidth = 1;
    ink.beginPath();
    ink.moveTo(x - 0.35 * G, top + 5.4 * G);
    ink.quadraticCurveTo(x + 0.4 * G, top + 5.8 * G, x + 0.2 * G, top + 4.6 * G);
    ink.lineTo(x - 0.05 * G, top - 1.2 * G);
    ink.bezierCurveTo(x + 0.1 * G, top - 2.2 * G, x + 0.9 * G, top - 1.4 * G, x + 0.3 * G, top - 0.2 * G);
    ink.bezierCurveTo(x - 0.4 * G, top + 1.0 * G, x - 1.0 * G, top + 1.9 * G, x - 0.9 * G, top + 2.9 * G);
    ink.bezierCurveTo(x - 0.8 * G, top + 4.0 * G, x + 0.9 * G, top + 4.0 * G, x + 0.9 * G, top + 3.0 * G);
    ink.bezierCurveTo(x + 0.9 * G, top + 2.1 * G, x - 0.3 * G, top + 2.0 * G, x - 0.25 * G, top + 2.9 * G);
    ink.stroke();
    ink.beginPath(); ink.arc(x - 0.35 * G, top + 5.3 * G, 0.3 * G, 0, Math.PI * 2); ink.fill();
  }
  function bass(x, top) {
    const G = GAP;
    ink.lineWidth = 1.2;
    ink.beginPath();
    ink.moveTo(x - 0.5 * G, top + 1.0 * G);
    ink.bezierCurveTo(x - 0.5 * G, top - 0.1 * G, x + 1.1 * G, top - 0.2 * G, x + 1.0 * G, top + 1.2 * G);
    ink.bezierCurveTo(x + 0.9 * G, top + 2.4 * G, x, top + 3.2 * G, x - 0.7 * G, top + 3.6 * G);
    ink.stroke();
    ink.beginPath(); ink.arc(x - 0.45 * G, top + 1.0 * G, 0.32 * G, 0, Math.PI * 2); ink.fill();
    ink.beginPath(); ink.arc(x + 1.5 * G, top + 0.5 * G, 0.9, 0, Math.PI * 2); ink.fill();
    ink.beginPath(); ink.arc(x + 1.5 * G, top + 1.5 * G, 0.9, 0, Math.PI * 2); ink.fill();
  }

  // ============================================================
  // THE COMPOSER. A mark is a thing drawn at an x, relative to its
  // stave's own left edge and top; a NOTE is a mark that sounds, so the
  // playhead can light it.
  // ============================================================
  function compose(long, grand) {
    const marks = [];
    const tops = grand ? [0, GAP * 10] : [0];
    const put = (x, fn, note) => marks.push({ x, fn, note: !!note });
    const clampP = (p) => Math.max(-3, Math.min(11, p));
    const ledger = (top, x, p) => {
      for (let q = -2; q >= p; q -= 2) { const y = yAt(top, q); put(x, () => line(x - RX * 1.7, y, x + RX * 1.7, y, 0.7)); }
      for (let q = 10; q <= p; q += 2) { const y = yAt(top, q); put(x, () => line(x - RX * 1.7, y, x + RX * 1.7, y, 0.7)); }
    };
    function run(top, x, n, beams, p0) {
      const ps = [];
      let p = p0;
      for (let i = 0; i < n; i++) { ps.push(p); p = clampP(p + pick([-1, -1, 1, 1, 1, -2, 2, 3, -3, 1, -1, 4])); }
      const up = ps.reduce((a, b) => a + b, 0) / n < 4;
      const xs = [], ys = ps.map((q) => yAt(top, q));
      let at = x;
      ps.forEach((q, i) => {
        if (random() < 0.14) { const acc = pick(ACCIDENTALS), ax = at + 2, ay = ys[i]; put(ax, () => acc(ax, ay)); at += 6; }
        xs.push(at + RX);
        at += GAP * 1.75;
      });
      const L = GAP * 3.3;
      const sx = xs.map((hx) => hx + (up ? RX * 0.92 : -RX * 0.92));
      let b1 = up ? ys[0] - L : ys[0] + L, b2 = up ? ys[n - 1] - L : ys[n - 1] + L;
      if (Math.abs(b2 - b1) > GAP) b2 = b1 + Math.sign(b2 - b1) * GAP;
      const beamY = (vx) => b1 + (b2 - b1) * (vx - sx[0]) / Math.max(1, sx[n - 1] - sx[0]);
      let shift = 0;
      sx.forEach((vx, i) => { const room = up ? beamY(vx) - (ys[i] - L * 0.8) : (ys[i] + L * 0.8) - beamY(vx); if (room > shift) shift = room; });
      b1 += up ? -shift : shift; b2 += up ? -shift : shift;
      xs.forEach((hx, i) => {
        const hy = ys[i], vx = sx[i];
        ledger(top, hx, ps[i]);
        put(hx, () => { head(hx, hy, false); line(vx, hy, vx, beamY(vx), 0.8); }, true);
      });
      const last = xs[n - 1];
      put(last, () => beam(sx[0], beamY(sx[0]), sx[n - 1], beamY(sx[n - 1]), beams, up));
      if (n % 2 === 1 || n === 6) {
        const ty = beamY((sx[0] + sx[n - 1]) / 2) + (up ? -GAP * (1.4 + beams * 0.5) : GAP * (1.4 + beams * 0.5));
        put(last, () => tuplet(sx[0], sx[n - 1], ty, String(n), up));
      }
      if (random() < 0.4) {
        const sy = Math.max(...ys) + GAP * 1.5, uy = Math.min(...ys) - GAP * 1.5;
        put(last, () => slur(xs[0], up ? sy : uy, last, up ? sy : uy, up));
      }
      return at + GAP * 0.6;
    }
    function chord(top, x, p0) {
      const n = 3 + (random() < 0.5 ? 1 : 0);
      const ps = [];
      let p = clampP(p0);
      for (let i = 0; i < n; i++) { ps.push(p); p = clampP(p + pick([2, 2, 3, 1])); }
      const open = random() < 0.3;
      let at = x;
      ps.filter(() => random() < 0.3).forEach((q) => { const acc = pick(ACCIDENTALS), ax = at + 2, ay = yAt(top, q); put(ax, () => acc(ax, ay)); at += 5; });
      const hx = at + RX;
      const up = ps.reduce((a, b) => a + b, 0) / n < 4;
      const lo = yAt(top, ps[0]), hi = yAt(top, ps[n - 1]);
      const vx = hx + (up ? RX * 0.92 : -RX * 0.92);
      const tip = up ? hi - GAP * 3.3 : lo + GAP * 3.3;
      ps.forEach((q, i) => {
        const nx = i && q - ps[i - 1] === 1 ? hx + (up ? RX * 1.85 : -RX * 1.85) : hx;
        ledger(top, nx, q);
        put(hx, () => head(nx, yAt(top, q), open), true);
      });
      put(hx, () => line(vx, up ? lo : hi, vx, tip, 0.8));
      return hx + GAP * 3 + (open ? GAP : 0);
    }
    function cluster(top, x, p0) {
      const n = 4 + Math.floor(random() * 3);
      const hx = x + RX * 2;
      for (let i = 0; i < n; i++) { const q = p0 + i, nx = i % 2 ? hx + RX * 1.85 : hx; put(hx, () => head(nx, yAt(top, q), false), true); }
      const vx = hx + RX * 0.92;
      put(hx, () => line(vx, yAt(top, p0), vx, yAt(top, p0 + n - 1) - GAP * 3, 0.8));
      return hx + GAP * 3.5;
    }
    // The head of it: clef, key, time.
    const key = Math.floor(random() * 5), sharps = random() < 0.5;
    const t0 = pick(TIMES);
    tops.forEach((top, i) => {
      const low = grand && i === 1;
      put(6, () => (low ? bass(8, top) : treble(9, top)));
      const order = sharps ? [8, 5, 9, 6, 3] : [4, 7, 3, 6, 2];
      for (let k = 0; k < key; k++) {
        const kx = 22 + k * 5, ky = yAt(top, order[k] - (low ? 2 : 0));
        put(kx, () => (sharps ? sharp(kx, ky) : flat(kx, ky)));
      }
      const tx = 26 + key * 5;
      put(tx, () => time(t0, tx, top));
    });
    const start = 36 + key * 5;
    const bars = [];
    for (let bx = start + between(80, 120); bx < long - 26; bx += between(85, 130)) bars.push(bx);
    const edges = [start].concat(bars, [long - 8]);
    for (let m = 0; m < edges.length - 1; m++) {
      const from = edges[m] + 7, to = edges[m + 1] - 7;
      const change = m && random() < 0.22 ? pick(TIMES) : null;
      tops.forEach((top, i) => {
        const low = grand && i === 1;
        let x = from;
        if (change) { const tx = x + 4; put(tx, () => time(change, tx, top)); x += 14; }
        let guard = 0;
        while (x < to - 16 && guard++ < 20) {
          const room = to - x, r = random();
          const p0 = low ? Math.floor(between(-2, 5)) : Math.floor(between(1, 9));
          if (r < 0.5 && room > GAP * 7) {
            const n = Math.min(pick([4, 5, 6, 7, 8, 3]), Math.floor(room / (GAP * 1.9)));
            if (n >= 3) { x = run(top, x, n, pick([2, 2, 3, 1]), p0); continue; }
          }
          if (r < 0.78 && room > GAP * 5) { x = chord(top, x, low ? p0 - 2 : p0 - 1); continue; }
          if (r < 0.86 && room > GAP * 5) { x = cluster(top, x, low ? p0 - 2 : p0); continue; }
          if (room > GAP * 2.5) { const rx = x + 3, kind = pick(["q", "e", "h"]); put(rx, () => rest(rx, top, kind)); x += GAP * 2; continue; }
          break;
        }
      });
    }
    return { marks, tops, bars, edges, tall: grand ? GAP * 14 : GAP * 4 };
  }
  const TIMES = [["4", "4"], ["3", "4"], ["2", "4"], ["5", "4"], ["6", "8"], ["7", "8"], ["9", "8"], ["12", "8"],
    ["5", "8"], ["3", "8"], ["2", "2"], ["7", "4"], ["6", "4"], ["3", "2"]];

  // ============================================================
  // THE SCORE: staves down the page, in the page's own coordinates,
  // made as far down as the page reaches.
  // ============================================================
  let width = 0, height = 0;
  let staves = [];
  let madeTo = 0;
  let order = 0;

  const margin = () => Math.max(0, (width - COLUMN) / 2);

  function more(to) {
    const room = margin();
    const wide = room > 150;
    while (madeTo < to) {
      const y = madeTo + between(-20, 20);
      // Further apart where they stand behind the writing.
      madeTo += wide ? EVERY : EVERY * 1.7;
      // In the margins, left and right in turn; across the window,
      // quietly, where there are none.
      const side = order % 2;
      const long = wide ? Math.min(room - 40, 300) : Math.min(width - 32, 420);
      const x0 = wide ? (side ? width - room + (room - long) / 2 : (room - long) / 2) : (width - long) / 2;
      const grand = random() < 0.28;
      const score = compose(long, grand);
      staves.push({ x0, y, long, ...score, seen: null, bar: between(BAR_SECONDS[0], BAR_SECONDS[1]),
        quiet: wide ? 1 : QUIET, turn: order });
      order++;
    }
  }

  function build() {
    seed = 77013;
    staves = [];
    madeTo = 260;
    order = 0;
    more(document.documentElement.scrollHeight + EVERY);
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
    const same = w === width;
    width = w; height = h;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  let handX = -99999, handY = -99999;

  function draw(clock) {
    if (!width) return;
    ink.clearRect(0, 0, width, height);
    const scroll = window.scrollY;
    // The page grows as parts are opened; the score keeps up.
    if (document.documentElement.scrollHeight + EVERY > madeTo) more(document.documentElement.scrollHeight + EVERY);
    staves.forEach((s) => {
      const top = s.y - scroll;
      if (top > height + 40 || top + s.tall < -60) return;
      if (s.seen === null) s.seen = REDUCE_MOTION ? -99 : clock;
      const since = clock - s.seen;
      const reach = REDUCE_MOTION ? s.long : s.long * ease(since / WRITE);
      // THE PLAYHEAD: once written, along the stave bar by bar, the
      // staves taking turns so only a few are playing at once.
      const playing = since - WRITE - (s.turn % 3) * 1.4;
      const length = s.bar * (s.edges.length - 1);
      let head = -1;
      if (!REDUCE_MOTION && playing > 0) {
        const t = playing % (length + 3);
        if (t < length) {
          const bar = Math.floor(t / s.bar), k = (t % s.bar) / s.bar;
          head = s.edges[bar] + (s.edges[bar + 1] - s.edges[bar]) * k;
        }
      }
      const q = s.quiet;
      ink.strokeStyle = "rgba(" + BLUE + "," + (LINE * q).toFixed(3) + ")";
      s.tops.forEach((t) => {
        for (let k = 0; k < 5; k++) line(s.x0, top + t + k * GAP, s.x0 + reach, top + t + k * GAP, 0.7);
      });
      const foot = top + s.tops[s.tops.length - 1] + 4 * GAP;
      s.bars.forEach((bx) => { if (bx <= reach) line(s.x0 + bx, top, s.x0 + bx, foot, 0.7); });
      if (s.tops.length > 1 && reach > 8) {
        line(s.x0, top, s.x0, foot, 0.7);
        ink.lineWidth = 1.2;
        ink.beginPath();
        const bx = s.x0 - 5, mid = (top + foot) / 2;
        ink.moveTo(bx + 3, top);
        ink.bezierCurveTo(bx - 3, top + 8, bx + 3, mid - 10, bx - 3, mid);
        ink.bezierCurveTo(bx + 3, mid + 10, bx - 3, foot - 8, bx + 3, foot);
        ink.stroke();
      }
      if (reach >= s.long - 8) {
        line(s.x0 + s.long - 8, top, s.x0 + s.long - 8, foot, 0.7);
        line(s.x0 + s.long - 5, top, s.x0 + s.long - 5, foot, 2);
      }
      // The playhead itself, a hairline.
      if (head >= 0) {
        ink.strokeStyle = "rgba(" + BLUE + "," + (0.12 * q).toFixed(3) + ")";
        line(s.x0 + head, top - GAP * 2, s.x0 + head, foot + GAP * 2, 0.8);
      }
      ink.save();
      ink.translate(s.x0, top);
      s.marks.forEach((m) => {
        if (m.x > reach) return;
        let a = NOTE;
        if (m.note && head >= 0 && m.x <= head) {
          // Played: a lift that dies away as the playhead moves on.
          const ago = (head - m.x) / ((s.edges[1] - s.edges[0]) / s.bar);
          if (ago < RING) a += PLAYED * (1 - ago / RING);
        }
        if (m.note && handX > -9000) {
          const d = Math.hypot(handX - (s.x0 + m.x), handY - (top + s.tall / 2));
          if (d < HAND) a += HANDED * (1 - d / HAND);
        }
        ink.fillStyle = ink.strokeStyle = "rgba(" + BLUE + "," + Math.min(1, a * q).toFixed(3) + ")";
        m.fn();
      });
      ink.restore();
    });
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => { handX = event.clientX; handY = event.clientY; if (REDUCE_MOTION) draw(0); };
  window.addEventListener("pointermove", hand, { passive: true });
  window.addEventListener("pointerdown", hand, { passive: true });
  document.addEventListener("pointerleave", () => { handX = -99999; handY = -99999; });
  window.addEventListener("resize", () => { size(); if (REDUCE_MOTION) draw(0); });
  if (REDUCE_MOTION) window.addEventListener("scroll", () => draw(0), { passive: true });

  size();

  if (REDUCE_MOTION) {
    draw(0);
  } else {
    const began = performance.now();
    (function frame(now) {
      draw((now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
