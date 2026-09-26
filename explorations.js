// ============================================================
// THE FIELD — categories/researches.html (Explorations & Researches)
//
// The owner, 2026-09-26: "Delete the right side of the page, and move
// the table upwards, so that it takes up abour 3/5ths of the page on the
// left ... On the right side, I want you to make something extravagant
// with the particles that reacts ot the thing being hovered on the left
// (in the table). Make it reactive and on theme."
//
// So the right two fifths of the page are one drawing in specks, and the
// table on the left conducts it. With nothing pointed at, the specks turn
// in THE RING — the slow orbit this page's first plate carried, printed
// small, until the plates went. Point at a row and the specks are thrown
// out from the middle and gather into THAT WORK'S FIGURE, each on a clock
// of its own, so the change sweeps through the field rather than snapping:
//
//   pyramid   the primer's own pyramid — a triangle cut into top, heart
//             and base — its top lifting off as a top note does
//   resin     a tear of resin, full, with bubbles caught in it
//   bottle    a bottle, the liquid in it moving, a mist from its cap
//   smoke     two sticks of incense: a cold plume that stands straight
//             and thin, and a warm one that billows
//   forest    firs
//   rain      rain, ringing where it lands
//   cloud     specks with nowhere to be yet
//
// A ROW NAMES ITS FIGURE in `data-figure`. A row that names none is given
// one by its KIND: a Research is a MOLECULE — rings of atoms joined by
// bonds, a material at a time — and an Exploration a TERRAIN, contour
// lines with a route across them; both are worked out from the row's own
// name, so no two are alike. A row that is neither yet is the cloud. A row
// with nothing behind it (data-open="no") is drawn quieter. Under the
// drawing, its CAPTION: the number, the name, the kind.
//
// The pointer answers over the field too: the specks near it part and
// darken. On a screen with no hovering the figures take turns on their
// own, and a tap on a row shows that one. With reduced motion there is no
// flight: each figure is simply there, drawn once.
// ============================================================
(function () {
  const field = document.querySelector(".re-field");
  const canvas = field && field.querySelector(".re-canvas");
  const body = document.querySelector(".index-table tbody");
  if (!canvas || !body) return;
  const g = canvas.getContext("2d");
  if (!g) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const INK = "23, 23, 15";            // --ink
  const TAU = Math.PI * 2;

  const COUNT = () => (window.innerWidth < 700 ? 1300 : 2400);
  const SPRING = 0.045;                // how hard a speck is drawn to its place
  const DAMP = 0.84;                   // and how much of its way it keeps
  const SPREAD = 520;                  // ms over which a change reaches every speck
  const KICK = 5.5;                    // px a frame, thrown out from the middle on a change
  const LINES_IN = 700;                // ms for a figure's hairlines to come up once it gathers
  const IDLE_AFTER = 650;              // ms off the table before the ring comes back
  const TURNS = 5200;                  // ms each figure stands, taking turns without a pointer
  const PART = 74;                     // px the pointer parts the specks within

  // ============================================================
  // SEEDED NUMBERS. Every speck has four of its own, fixed, so a figure
  // is the same figure every time it is gathered; a figure worked out
  // from a name is seeded by that name.
  // ============================================================
  const hash = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const stream = (seed) => {
    let s = seed || 1;
    return () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  let N = 0, X, Y, VX, VY, R1, R2, R3, R4, GO;
  // What each speck was last told — how strongly to be drawn, how big,
  // and whether as a stroke — kept from moving it to drawing it, so its
  // figure is asked once a frame and not twice.
  let A, Z, K;
  function make(n) {
    N = n;
    X = new Float32Array(n); Y = new Float32Array(n);
    VX = new Float32Array(n); VY = new Float32Array(n);
    R1 = new Float32Array(n); R2 = new Float32Array(n);
    R3 = new Float32Array(n); R4 = new Float32Array(n);
    GO = new Float64Array(n);
    A = new Float32Array(n); Z = new Float32Array(n); K = new Uint8Array(n);
    const rnd = stream(907);
    for (let i = 0; i < n; i++) {
      R1[i] = rnd(); R2[i] = rnd(); R3[i] = rnd(); R4[i] = rnd();
      // They arrive from everywhere on the field.
      X[i] = rnd() * W; Y[i] = rnd() * H;
    }
  }

  // ============================================================
  // THE FIGURES. Each places speck `i` at time `t` in the figure's own
  // square, x and y from -1 to 1 (y down): o[0], o[1], how strongly it
  // is drawn (o[2], 0–1) and how big (o[3]). `lines` draws its hairlines,
  // and `streak` draws its specks as short falling strokes.
  // ============================================================
  const at = (o, x, y, a, s) => { o[0] = x; o[1] = y; o[2] = a; o[3] = s == null ? 1 : s; };

  function ring() {
    const tilt = -0.2, c = Math.cos(tilt), s = Math.sin(tilt);
    return {
      at(i, t, o) {
        if (R2[i] < 0.84) {
          const a = R1[i] * TAU + t * 0.00009;
          const r = 0.8 + (R3[i] - 0.5) * 0.14;
          const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.42 + (R4[i] - 0.5) * 0.04;
          at(o, x * c - y * s, x * s + y * c, 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a)));
        } else {
          const d = Math.sqrt(R3[i]) * 0.5, b = R4[i] * TAU + t * 0.00004;
          at(o, Math.cos(b) * d, Math.sin(b) * d * 0.7, 0.3, 0.8);
        }
      },
      lines(k, line) {
        const pts = [];
        for (let j = 0; j <= 96; j++) {
          const a = (j / 96) * TAU, x = Math.cos(a) * 0.8, y = Math.sin(a) * 0.336;
          pts.push([x * c - y * s, x * s + y * c]);
        }
        line(pts, 0.14 * k);
      },
    };
  }

  function pyramid() {
    const top = -0.86, bottom = 0.74, half = 0.86;
    const cut1 = -0.3, cut2 = 0.22;
    const width = (y) => ((y - top) / (bottom - top)) * half;
    // A point in a slice of the triangle, as dense at its wide end as
    // its narrow one.
    const inSlice = (y0, y1, u, v) => {
      const w0 = width(y0), w1 = width(y1);
      const q = w1 === w0 ? u : (Math.sqrt(w0 * w0 + u * (w1 * w1 - w0 * w0)) - w0) / (w1 - w0);
      const y = y0 + (y1 - y0) * q;
      return [(v * 2 - 1) * width(y), y];
    };
    return {
      at(i, t, o) {
        const tier = R2[i];
        if (tier < 0.16) {
          // THE TOP, lifting off and thinning as a top note does.
          const [x, y] = inSlice(top + 0.02, cut1, R3[i], R4[i]);
          const lift = (t * 0.00007 + R1[i]) % 1;
          at(o, x * (1 + lift * 0.9), y - lift * 0.42, 0.95 * (1 - lift), 0.9);
        } else if (tier < 0.46) {
          const [x, y] = inSlice(cut1, cut2, R3[i], R4[i]);
          at(o, x + Math.sin(t * 0.0011 + R1[i] * 6) * 0.012, y, 0.7);
        } else {
          const [x, y] = inSlice(cut2, bottom, R3[i], R4[i]);
          at(o, x, y, 0.85, 1.1);
        }
      },
      lines(k, line, label) {
        line([[0, top], [-half, bottom], [half, bottom], [0, top]], 0.5 * k);
        line([[-width(cut1), cut1], [width(cut1), cut1]], 0.35 * k);
        line([[-width(cut2), cut2], [width(cut2), cut2]], 0.35 * k);
        label("TOP", width((top + cut1) / 2) + 0.14, (top + cut1) / 2, k);
        label("HEART", width((cut1 + cut2) / 2) + 0.14, (cut1 + cut2) / 2, k);
        label("BASE", width((cut2 + bottom) / 2) + 0.14, (cut2 + bottom) / 2, k);
      },
    };
  }

  function resin() {
    const b = 0.88, cx = 0, cy = 0.3;
    const edge = (th) => [0.66 * Math.sin(th) * Math.sin(th / 2), -b * Math.cos(th)];
    const bubbles = [[-0.14, 0.18, 0.08], [0.18, 0.46, 0.06], [0.02, 0.62, 0.045], [0.12, -0.06, 0.035]];
    return {
      at(i, t, o) {
        if (R2[i] < 0.3) {
          const [x, y] = edge(R1[i] * TAU);
          at(o, x, y, 0.85);
          return;
        }
        // The fill, turning very slowly inside the tear.
        const th = R1[i] * TAU + Math.sin(t * 0.00025 + R4[i] * 6) * 0.08;
        const [ex, ey] = edge(th);
        const q = Math.sqrt(R3[i]) * 0.94;
        let x = cx + (ex - cx) * q, y = cy + (ey - cy) * q;
        // Caught against a bubble, a speck stands on its rim.
        for (const [bx, by, br] of bubbles) {
          const dx = x - bx, dy = y - by, d = Math.hypot(dx, dy);
          if (d < br) {
            const f = d > 0.0001 ? br / d : 1;
            x = bx + dx * f; y = by + (d > 0.0001 ? dy * f : br);
            at(o, x, y, 0.9, 0.9);
            return;
          }
        }
        at(o, x, y, 0.35 + 0.5 * q, 0.85);
      },
      lines(k, line) {
        const pts = [];
        for (let j = 0; j <= 80; j++) pts.push(edge((j / 80) * TAU));
        line(pts, 0.4 * k);
        bubbles.forEach(([bx, by, br]) => {
          const ring = [];
          for (let j = 0; j <= 24; j++) ring.push([bx + Math.cos((j / 24) * TAU) * br, by + Math.sin((j / 24) * TAU) * br]);
          line(ring, 0.28 * k);
        });
      },
    };
  }

  function bottle() {
    // Its outline, clockwise from the top of the cap.
    const outline = [
      [-0.2, -0.62], [0.2, -0.62], [0.2, -0.32], [0.12, -0.32], [0.12, -0.18],
      [0.46, -0.1], [0.5, -0.02], [0.5, 0.84], [-0.5, 0.84], [-0.5, -0.02], [-0.46, -0.1],
      [-0.12, -0.18], [-0.12, -0.32], [-0.2, -0.32], [-0.2, -0.62],
    ];
    const lengths = [0];
    for (let j = 1; j < outline.length; j++) {
      lengths.push(lengths[j - 1] + Math.hypot(outline[j][0] - outline[j - 1][0], outline[j][1] - outline[j - 1][1]));
    }
    const total = lengths[lengths.length - 1];
    const along = (u) => {
      const d = u * total;
      let j = 1;
      while (j < lengths.length - 1 && lengths[j] < d) j++;
      const q = (d - lengths[j - 1]) / (lengths[j] - lengths[j - 1] || 1);
      return [outline[j - 1][0] + (outline[j][0] - outline[j - 1][0]) * q, outline[j - 1][1] + (outline[j][1] - outline[j - 1][1]) * q];
    };
    const level = (x, t) => 0.3 + Math.sin(x * 3.2 + t * 0.0014) * 0.03;
    return {
      at(i, t, o) {
        const part = R2[i];
        if (part < 0.46) {
          const [x, y] = along(R1[i]);
          at(o, x, y, 0.9);
        } else if (part < 0.8) {
          // THE LIQUID, its surface moving.
          const x = -0.46 + R1[i] * 0.92;
          const top = level(x, t);
          at(o, x, top + R3[i] * (0.82 - top), 0.45 + 0.35 * R4[i], 0.9);
        } else {
          // THE MIST from its cap, rising and opening out.
          const s = (t * 0.00011 + R1[i]) % 1;
          const x = (R3[i] - 0.5) * 0.1 + (R4[i] - 0.5) * s * 0.9 + Math.sin(s * 5 + R4[i] * 6) * 0.05;
          at(o, x, -0.66 - s * 0.5, 0.8 * (1 - s), 0.8);
        }
      },
      lines(k, line) {
        line(outline, 0.5 * k);
        line([[-0.3, 0.12], [0.3, 0.12], [0.3, 0.46], [-0.3, 0.46], [-0.3, 0.12]], 0.3 * k);
      },
    };
  }

  function smoke() {
    const L = -0.36, R = 0.36, tip = 0.3, foot = 0.86;
    return {
      at(i, t, o) {
        const part = R2[i];
        if (part < 0.06) {
          const x = part < 0.03 ? L : R;
          at(o, x + (R3[i] - 0.5) * 0.008, tip + R1[i] * (foot - tip), 0.9, 0.9);
        } else if (part < 0.44) {
          // THE COLD PLUME: straight and thin, barely moving, opening a
          // little only at its very top.
          const s = (t * 0.00014 + R1[i]) % 1;
          const x = L + Math.sin(s * 7 + t * 0.0005) * 0.035 * s + (R3[i] - 0.5) * (0.018 + 0.1 * s * s * s);
          at(o, x, tip - 0.02 - s * 1.12, 0.9 * Math.pow(1 - s, 1.1), 0.8);
        } else {
          // THE WARM ONE: billowing, curling, opening out as it rises.
          const s = (t * 0.00011 + R1[i]) % 1;
          const curl = Math.sin(s * 4.2 + t * 0.001 + R4[i] * 0.9) * 0.24 * s;
          const x = R + curl + (R3[i] - 0.5) * 0.3 * s * (1 + s) + (R2[i] - 0.72) * 0.05;
          at(o, x, tip - 0.02 - s * 1.1 + Math.sin(s * 9 + t * 0.0008 + R3[i] * 2) * 0.03, 0.9 * Math.pow(1 - s, 0.8), 1.15);
        }
      },
      lines(k, line, label) {
        line([[L, tip], [L, foot]], 0.55 * k);
        line([[R, tip], [R, foot]], 0.55 * k);
        line([[L - 0.1, foot], [L + 0.1, foot]], 0.4 * k);
        line([[R - 0.1, foot], [R + 0.1, foot]], 0.4 * k);
        label("COLD", L - 0.06, foot + 0.1, k);
        label("WARM", R - 0.06, foot + 0.1, k);
      },
    };
  }

  function forest() {
    const firs = [[-0.52, 0.8, 1.15], [0.04, 0.8, 1.5], [0.56, 0.8, 1.05]];
    const tiers = (f) => {
      const [x, base, tall] = f, out = [];
      for (let k = 0; k < 3; k++) {
        const y0 = base - tall * (0.18 + k * 0.26), top = y0 - tall * 0.42, w = tall * (0.3 - k * 0.06);
        out.push([[x - w, y0], [x, top], [x + w, y0]]);
      }
      return out;
    };
    const all = firs.map(tiers);
    return {
      at(i, t, o) {
        const f = Math.floor(R1[i] * 3), tri = all[f][Math.floor(R2[i] * 3)];
        const sway = Math.sin(t * 0.0007 + f) * 0.012;
        if (R3[i] < 0.12) {
          const [x, base, tall] = firs[f];
          at(o, x + (R4[i] - 0.5) * 0.02, base - R4[i] * tall * 0.2, 0.8);
          return;
        }
        if (R3[i] < 0.5) {
          // Its edges, where the needles stand off it a little.
          const side = R4[i] < 0.5 ? 0 : 1;
          const [p, q] = side ? [tri[1], tri[2]] : [tri[0], tri[1]];
          const u = (R3[i] - 0.12) / 0.38;
          at(o, p[0] + (q[0] - p[0]) * u + sway * (1 - u), p[1] + (q[1] - p[1]) * u + (R2[i] * 3 % 1 - 0.5) * 0.03, 0.8);
          return;
        }
        // And filled, thinner towards the middle of each tier.
        let u = R4[i], v = (R3[i] - 0.5) * 2;
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const [a, b, c] = tri;
        const x = a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v;
        const y = a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v;
        at(o, x + sway * 0.5, y, 0.4, 0.85);
      },
      lines(k, line) { all.forEach((fir) => fir.forEach((tri) => line(tri, 0.3 * k))); },
    };
  }

  function rain() {
    const floor = 0.8;
    const puddles = [[-0.5, 0], [-0.1, 0.33], [0.3, 0.66], [0.6, 0.15], [-0.7, 0.5]];
    return {
      streak: true,
      at(i, t, o) {
        if (R2[i] < 0.66) {
          const s = (t * 0.00045 * (0.8 + R3[i] * 0.4) + R4[i]) % 1;
          at(o, (R1[i] * 2 - 1) * 0.9, -0.95 + s * (floor + 0.95), 0.7, 1);
        } else {
          const [px, ph] = puddles[Math.floor(R1[i] * puddles.length)];
          const s = (t * 0.00035 + ph) % 1;
          const a = R3[i] * TAU, r = 0.04 + s * 0.24;
          at(o, px + Math.cos(a) * r, floor + Math.sin(a) * r * 0.24, 0.8 * (1 - s), 0.8);
          o[4] = 1;
        }
      },
      lines(k, line) { line([[-0.95, floor], [0.95, floor]], 0.3 * k); },
    };
  }

  function cloud() {
    return {
      at(i, t, o) {
        // Round and soft: a direction and a distance, most of them near
        // the middle, each drifting on its own.
        const a = R1[i] * TAU + t * 0.00003 * (R3[i] - 0.5);
        const d = (R2[i] * R2[i] * 0.55 + R3[i] * 0.35) * 0.9;
        const x = Math.cos(a) * d + Math.sin(t * 0.0003 + R4[i] * 6) * 0.04;
        const y = Math.sin(a) * d * 0.72 + Math.cos(t * 0.00025 + R1[i] * 6) * 0.03;
        at(o, x, y, 0.45 - d * 0.25, 0.9);
      },
      lines: null,
    };
  }

  // A MOLECULE for a research, worked out from its name: two to four
  // six-sided rings fused in a chain, a side chain or two, its atoms
  // gathered specks and its bonds hairlines.
  function molecule(name) {
    const rnd = stream(hash(name) || 3);
    const rings = 2 + Math.floor(rnd() * 3), side = 0.2;
    const atoms = [], bonds = [];
    const key = (p) => p[0].toFixed(3) + "," + p[1].toFixed(3);
    const index = new Map();
    const atom = (p) => {
      const k = key(p);
      if (!index.has(k)) { index.set(k, atoms.length); atoms.push(p); }
      return index.get(k);
    };
    let cx = 0, cy = 0, turn = 0;
    for (let r = 0; r < rings; r++) {
      const ids = [];
      for (let j = 0; j < 6; j++) {
        const a = turn + (j / 6) * TAU;
        ids.push(atom([cx + Math.cos(a) * side, cy + Math.sin(a) * side]));
      }
      for (let j = 0; j < 6; j++) bonds.push([ids[j], ids[(j + 1) % 6], rnd() < 0.3]);
      const step = rnd() < 0.5 ? 0 : 1;
      const a = turn + (step ? TAU / 12 : -TAU / 12);
      cx += Math.cos(a) * side * Math.sqrt(3);
      cy += Math.sin(a) * side * Math.sqrt(3);
    }
    const chains = 1 + Math.floor(rnd() * 2);
    for (let c = 0; c < chains; c++) {
      let from = Math.floor(rnd() * atoms.length);
      let p = atoms[from], a = rnd() * TAU;
      for (let s = 0; s < 2; s++) {
        const q = [p[0] + Math.cos(a) * side, p[1] + Math.sin(a) * side];
        const to = atom(q);
        bonds.push([from, to, false]);
        from = to; p = q; a += (rnd() - 0.5) * 1.6;
      }
    }
    // Centred and scaled to the square.
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    atoms.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const k = 1.5 / Math.max(x1 - x0, y1 - y0, 0.5), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    atoms.forEach((p) => { p[0] = (p[0] - mx) * k; p[1] = (p[1] - my) * k; });
    return {
      at(i, t, o) {
        const jig = Math.sin(t * 0.004 + R4[i] * 30) * 0.006;
        if (R2[i] < 0.62) {
          const p = atoms[i % atoms.length];
          const a = R3[i] * TAU, d = Math.sqrt(R1[i]) * 0.05;
          at(o, p[0] + Math.cos(a) * d + jig, p[1] + Math.sin(a) * d, 0.95, 1.05);
        } else {
          const [a, b] = bonds[i % bonds.length];
          const u = R1[i];
          at(o, atoms[a][0] + (atoms[b][0] - atoms[a][0]) * u, atoms[a][1] + (atoms[b][1] - atoms[a][1]) * u + jig, 0.55, 0.8);
        }
      },
      lines(k, line) {
        bonds.forEach(([a, b, double]) => {
          line([atoms[a], atoms[b]], 0.45 * k);
          if (double) {
            const dx = atoms[b][0] - atoms[a][0], dy = atoms[b][1] - atoms[a][1], d = Math.hypot(dx, dy) || 1;
            const nx = -dy / d * 0.03, ny = dx / d * 0.03;
            line([[atoms[a][0] + nx, atoms[a][1] + ny], [atoms[b][0] + nx, atoms[b][1] + ny]], 0.3 * k);
          }
        });
      },
    };
  }

  // A TERRAIN for an exploration, worked out from its name: two or three
  // rises, each drawn as rings of contour, and a route across them.
  function terrain(name) {
    const rnd = stream(hash(name + "terrain") || 7);
    const peaks = [];
    const n = 2 + Math.floor(rnd() * 2);
    for (let p = 0; p < n; p++) {
      peaks.push({ x: (rnd() - 0.5) * 1.1, y: (rnd() - 0.5) * 0.9, r: 0.32 + rnd() * 0.28, f: rnd() * TAU, g: rnd() * TAU });
    }
    const route = [];
    const start = [-0.9, (rnd() - 0.5) * 1.2], end = [0.9, (rnd() - 0.5) * 1.2];
    const bend = [(rnd() - 0.5) * 0.6, (rnd() - 0.5) * 1.4];
    for (let j = 0; j <= 40; j++) {
      const u = j / 40, v = 1 - u;
      route.push([v * v * start[0] + 2 * u * v * bend[0] + u * u * end[0], v * v * start[1] + 2 * u * v * bend[1] + u * u * end[1]]);
    }
    const contour = (p, lv, th) => {
      const r = p.r * lv * (1 + 0.16 * Math.sin(3 * th + p.f) + 0.07 * Math.sin(5 * th + p.g));
      return [p.x + Math.cos(th) * r, p.y + Math.sin(th) * r * 0.8];
    };
    return {
      at(i, t, o) {
        if (R2[i] < 0.12) {
          const p = route[Math.floor(R1[i] * route.length)];
          at(o, p[0], p[1], 0.9, 1.1);
          return;
        }
        const p = peaks[i % peaks.length], lv = (Math.floor(R3[i] * 5) + 1) / 5;
        const [x, y] = contour(p, lv, R1[i] * TAU + t * 0.00002 * (lv - 0.5));
        at(o, x, y, 0.3 + 0.5 * (1 - lv), 0.85);
      },
      lines(k, line) {
        const dashes = [];
        for (let j = 0; j < route.length - 1; j += 2) dashes.push([route[j], route[j + 1]]);
        dashes.forEach((d) => line(d, 0.55 * k));
        line([[start[0] - 0.03, start[1] - 0.03], [start[0] + 0.03, start[1] + 0.03]], 0.6 * k);
        line([[end[0] - 0.03, end[1] + 0.03], [end[0] + 0.03, end[1] - 0.03]], 0.6 * k);
        line([[end[0] - 0.03, end[1] - 0.03], [end[0] + 0.03, end[1] + 0.03]], 0.6 * k);
      },
    };
  }

  const NAMED = { pyramid, resin, bottle, smoke, forest, rain, cloud };
  const made = new Map();
  /** The figure a row asks for, made once and kept. */
  function figureOf(row) {
    if (!row) return idle;
    if (made.has(row)) return made.get(row);
    const asked = (row.dataset.figure || "").trim();
    const kind = (row.dataset.kind || "").trim();
    const name = (row.dataset.name || "").trim();
    let fig;
    if (NAMED[asked]) fig = NAMED[asked]();
    else if (kind === "Research") fig = molecule(name);
    else if (kind === "Exploration") fig = terrain(name);
    else fig = cloud();
    fig.quiet = row.dataset.open === "no";
    made.set(row, fig);
    return fig;
  }
  const idle = ring();

  // ============================================================
  // THE CAPTION under the drawing.
  // ============================================================
  const capNo = field.querySelector(".re-caption-no");
  const capName = field.querySelector(".re-caption-name");
  const capKind = field.querySelector(".re-caption-kind");
  const rows = () => [...body.querySelectorAll("tr")];
  function caption(row) {
    if (!capName) return;
    if (!row) {
      const all = rows();
      capNo.textContent = "000–" + String(all.length - 1).padStart(3, "0");
      capName.textContent = "Explorations & Researches";
      capKind.textContent = all.length + " works";
      return;
    }
    const no = row.querySelector(".index-no");
    capNo.textContent = no ? no.textContent.trim() : "";
    capName.textContent = (row.dataset.name || "").trim() || "Untitled";
    const kind = (row.dataset.kind || "").trim();
    capKind.textContent = (kind || "Not decided yet") + (row.dataset.open === "no" ? " · not written yet" : "");
  }

  // ============================================================
  // WHAT IT IS SHOWING, and the change from one to the next.
  // ============================================================
  let current = idle, previous = idle, changed = -1e9, shownRow = null;
  let W = 0, H = 0, ratio = 1, S = 1, CX = 0, CY = 0;

  function show(row) {
    if (row === shownRow && (row || current === idle)) return;
    shownRow = row;
    rows().forEach((r) => r.classList.toggle("is-shown", r === row));
    field.dataset.showing = row ? (row.dataset.no || "") : "";
    field.dataset.figure = row ? (row.dataset.figure || (row.dataset.kind === "Research" ? "molecule" : row.dataset.kind === "Exploration" ? "terrain" : "cloud")) : "ring";
    previous = current;
    current = figureOf(row);
    caption(row);
    const now = performance.now();
    changed = now;
    if (still) { settle(); draw(0); return; }
    // Thrown out from the middle, each on a clock of its own.
    for (let i = 0; i < N; i++) {
      GO[i] = now + R4[i] * SPREAD;
      const dx = X[i] - CX, dy = Y[i] - CY, d = Math.hypot(dx, dy) || 1;
      const kick = KICK * (0.4 + R2[i]);
      VX[i] += (dx / d) * kick;
      VY[i] += (dy / d) * kick;
    }
    wake();
  }

  const o = new Float32Array(5);
  const quiet = (f) => (f.quiet ? 0.5 : 1);
  function keep(i, fig) {
    A[i] = o[2] * quiet(fig);
    Z[i] = o[3];
    K[i] = fig.streak && !o[4] ? 1 : 0;
  }
  /** Every speck straight to its place: the still drawing — always at
      the same moment of its figure, so a still drawing never changes
      unless what it shows does. */
  function settle() {
    const t = 0;
    for (let i = 0; i < N; i++) {
      o[4] = 0;
      current.at(i, t, o);
      X[i] = CX + o[0] * S; Y[i] = CY + o[1] * S;
      VX[i] = 0; VY[i] = 0;
      keep(i, current);
    }
  }

  // ============================================================
  // THE POINTER over the field parts the specks.
  // ============================================================
  let px = -1e4, py = -1e4;
  field.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    wake();
  });
  field.addEventListener("pointerleave", () => { px = -1e4; py = -1e4; });

  // ============================================================
  // DRAWING
  // ============================================================
  function size() {
    const r = field.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const first = !N;
    const was = [W, H];
    W = w; H = h;
    ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    S = Math.min(W * 0.42, H * 0.36);
    CX = W / 2; CY = H * 0.47;
    if (first) make(COUNT());
    else if (was[0] && was[1]) {
      for (let i = 0; i < N; i++) { X[i] *= W / was[0]; Y[i] *= H / was[1]; }
    }
    if (still) settle();
    draw(still ? 0 : performance.now());
  }

  function line(pts, a) {
    if (a <= 0.004 || pts.length < 2) return;
    g.strokeStyle = "rgba(" + INK + "," + a.toFixed(3) + ")";
    g.lineWidth = 1 / ratio;
    g.beginPath();
    pts.forEach(([x, y], j) => {
      const sx = CX + x * S, sy = CY + y * S;
      if (j) g.lineTo(sx, sy); else g.moveTo(sx, sy);
    });
    g.stroke();
  }
  let mono = "";
  function label(text, x, y, a) {
    if (a <= 0.02) return;
    if (!mono) mono = getComputedStyle(document.body).getPropertyValue("--mono").trim() || "monospace";
    g.fillStyle = "rgba(" + INK + "," + (0.7 * a).toFixed(3) + ")";
    g.font = "500 10px " + mono;
    g.textBaseline = "middle";
    const sx = CX + x * S, sy = CY + y * S;
    g.fillRect(sx - 12, sy, 8, 1 / ratio);
    g.fillText(text, sx, sy);
  }

  function draw(t) {
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, W, H);
    // The figure's hairlines, coming up once its specks have gathered;
    // the last one's going as they leave.
    const since = t - changed;
    const up = still ? 1 : Math.max(0, Math.min(1, (since - SPREAD * 0.6) / LINES_IN));
    const down = still ? 0 : Math.max(0, 1 - since / 260);
    if (previous !== current && previous.lines && down > 0) previous.lines(down * quiet(previous), line, label);
    if (current.lines) current.lines(up * quiet(current), line, label);
    // The specks, as they were last told.
    g.fillStyle = "rgb(" + INK + ")";
    for (let i = 0; i < N; i++) {
      let a = A[i];
      const x = X[i], y = Y[i];
      const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
      if (d2 < PART * PART) a = Math.min(1, a + (1 - Math.sqrt(d2) / PART) * 0.5);
      if (a <= 0.01) continue;
      g.globalAlpha = Math.min(1, a * 0.78);
      const s = 1.25 * Z[i];
      if (K[i]) g.fillRect(x - s / 2, y - s * 3.5, s * 0.8, s * 4);
      else g.fillRect(x - s / 2, y - s / 2, s, s);
    }
    g.globalAlpha = 1;
  }

  function step(t) {
    for (let i = 0; i < N; i++) {
      const fig = t >= GO[i] ? current : previous;
      o[4] = 0;
      fig.at(i, t, o);
      keep(i, fig);
      const tx = CX + o[0] * S, ty = CY + o[1] * S;
      const k = SPRING * (0.7 + 0.6 * R3[i]);
      VX[i] = (VX[i] + (tx - X[i]) * k) * DAMP;
      VY[i] = (VY[i] + (ty - Y[i]) * k) * DAMP;
      // The pointer parts them.
      const dx = X[i] - px, dy = Y[i] - py, d2 = dx * dx + dy * dy;
      if (d2 < PART * PART && d2 > 0.01) {
        const d = Math.sqrt(d2), f = (1 - d / PART) * 1.8;
        VX[i] += (dx / d) * f; VY[i] += (dy / d) * f;
      }
      X[i] += VX[i]; Y[i] += VY[i];
    }
  }

  let frame = 0, seen = true;
  function loop(t) {
    frame = 0;
    if (!seen) return;
    step(t);
    draw(t);
    frame = requestAnimationFrame(loop);
  }
  function wake() {
    if (still || frame || !seen) return;
    frame = requestAnimationFrame(loop);
  }
  // Only while it is on the window.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      seen = entries[entries.length - 1].isIntersecting;
      if (seen) wake();
    }).observe(field);
  }
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(field);
  else window.addEventListener("resize", size);

  // ============================================================
  // THE TABLE CONDUCTS IT. Pointing at a row, focusing its link, or
  // tapping it shows its figure; leaving the table brings the ring back
  // a moment later, so passing from one row to the next never does.
  // ============================================================
  let leaving = 0;
  const rowOf = (target) => (target && target.closest ? target.closest("tbody tr") : null);
  body.addEventListener("pointerover", (e) => {
    const row = rowOf(e.target);
    if (!row) return;
    clearTimeout(leaving);
    stopTurns();
    show(row);
  });
  body.addEventListener("pointerdown", (e) => {
    const row = rowOf(e.target);
    if (row) { clearTimeout(leaving); stopTurns(); show(row); }
  });
  body.addEventListener("pointerleave", (e) => {
    clearTimeout(leaving);
    // A finger lifted is not a pointer gone: what it tapped stays up
    // until the turns come round again.
    if (e.pointerType === "touch") { leaving = setTimeout(startTurns, TURNS); return; }
    leaving = setTimeout(() => { show(null); startTurns(); }, IDLE_AFTER);
  });
  body.addEventListener("focusin", (e) => {
    const row = rowOf(e.target);
    if (row) { clearTimeout(leaving); stopTurns(); show(row); }
  });
  body.addEventListener("focusout", () => {
    clearTimeout(leaving);
    leaving = setTimeout(() => {
      if (!body.contains(document.activeElement)) { show(null); startTurns(); }
    }, IDLE_AFTER);
  });

  // WITHOUT A POINTER THAT HOVERS, the written works take turns.
  let turns = 0, turn = -1;
  function startTurns() {
    if (!noHover || still || turns) return;
    turns = setInterval(() => {
      const written = rows().filter((r) => r.dataset.open !== "no" && !r.hidden);
      if (!written.length) return;
      turn = (turn + 1) % written.length;
      show(written[turn]);
    }, TURNS);
  }
  function stopTurns() { clearInterval(turns); turns = 0; }

  size();
  caption(null);
  field.dataset.figure = "ring";
  field.classList.add("is-drawn");
  if (still) { settle(); draw(0); }
  else wake();
  startTurns();
})();
