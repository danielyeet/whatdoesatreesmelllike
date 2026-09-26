// ============================================================
// THE FIELD — categories/researches.html (Explorations & Researches)
//
// The owner, 2026-09-26: "Delete the right side of the page, and move
// the table upwards, so that it takes up abour 3/5ths of the page on the
// left ... On the right side, I want you to make something extravagant
// with the particles that reacts ot the thing being hovered on the left
// (in the table)." And then, of the first answer — a figure for each
// work, a pyramid, a bottle, two smokes — "REmove the research specific
// stuff; and make it more so a general abstract geometric particulate
// thing. The closest thing to waht i like is the cloud when you hover the
// untitled researches/Explorations (and when you hover nothing).
// re-interpret it and do that please."
//
// So everything the field draws is A CLOUD: a soft haze of specks,
// gathered round a GEOMETRIC FORM, standing in three dimensions and
// turning slowly about a tilted axis — the nearer specks larger and
// darker, the further ones fainter — with a faint WEB of hairlines strung
// between a few of them where they come near each other. With nothing
// pointed at it is THE RING, a band of specks turning round the middle;
// point at a row and the specks are thrown out and gather into that row's
// form, each on a clock of its own, so the change sweeps through the field
// rather than snapping. The forms are abstract and belong to no work in
// particular:
//
//   sphere     a shell               torus      a ring of a tube, tipped
//   knot       a trefoil             helix      two strands wound together
//   disc       a spiral of arms      lattice    the edges of a cube
//   gyre       three rings crossed   saddle     a surface curving two ways
//   shells     three, nested         hourglass  two cones, point to point
//
// A row is given a form by its NUMBER, in that order and round again, so
// every row keeps its own and the ones next to each other differ; a row
// with no name and no kind yet (Untitled) is THE CLOUD, the one form with
// no shape in it. A row with nothing behind it (data-open="no") is drawn
// at half strength. Under the drawing, its CAPTION: the number, the name,
// the kind.
//
// The pointer answers over the field as well: the specks near it part
// and darken. On a screen with no hovering the written works take turns,
// and a tap on a row shows that one. With reduced motion nothing moves:
// each form is simply there, drawn once, turned to the same angle.
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
  const IDLE_AFTER = 650;              // ms off the table before the ring comes back
  const TURNS = 5200;                  // ms each form stands, taking turns without a pointer
  const PART = 74;                     // px the pointer parts the specks within
  const SPIN = 0.00012;                // radians a millisecond the whole field turns
  const TILT = 0.38;                   // radians its axis leans towards you
  const FOCAL = 3.2;                   // the perspective: larger is flatter
  const HAZE = 0.12;                   // share of every form's specks left loose round it
  const WEB = 90;                      // specks the web is strung between
  const WEB_REACH = 58;                // px within which two of them are joined

  // ============================================================
  // SEEDED NUMBERS. Every speck has four of its own, fixed, so a form is
  // the same form every time it is gathered.
  // ============================================================
  const stream = (seed) => {
    let s = seed || 1;
    return () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  let N = 0, X, Y, VX, VY, R1, R2, R3, R4, GO, A, Z;
  // The specks the web is strung between: picked at random from the whole
  // cloud, since a form places its specks in order and the first few of a
  // sphere, say, all stand at one pole.
  let STRUNG = [];
  function make(n) {
    N = n;
    X = new Float32Array(n); Y = new Float32Array(n);
    VX = new Float32Array(n); VY = new Float32Array(n);
    R1 = new Float32Array(n); R2 = new Float32Array(n);
    R3 = new Float32Array(n); R4 = new Float32Array(n);
    GO = new Float64Array(n);
    // How strongly each speck was last drawn, and how big — its depth.
    A = new Float32Array(n); Z = new Float32Array(n);
    const rnd = stream(907);
    for (let i = 0; i < n; i++) {
      R1[i] = rnd(); R2[i] = rnd(); R3[i] = rnd(); R4[i] = rnd();
      // They arrive from everywhere on the field.
      X[i] = rnd() * W; Y[i] = rnd() * H;
    }
    const picked = new Set();
    while (picked.size < Math.min(WEB, n)) picked.add(Math.floor(rnd() * n));
    STRUNG = [...picked];
  }

  // ============================================================
  // THE FORMS. Each gives speck `i` a place in three dimensions, in a box
  // from -1 to 1 each way, worked out once and kept. A share of every form
  // (`HAZE`) is left loose round it as a faint cloud, and every place is
  // blurred a little (`fuzz`), so each form is a cloud with a shape in it
  // rather than a hard figure.
  // ============================================================
  const gauss = (u, v) => Math.sqrt(-2 * Math.log(Math.max(1e-6, u))) * Math.cos(TAU * v);
  const fib = (k, n) => {
    const y = 1 - (2 * (k + 0.5)) / n, r = Math.sqrt(Math.max(0, 1 - y * y)), th = Math.PI * (3 - Math.sqrt(5)) * k;
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  };
  const SHAPES = {
    ring: { fuzz: 0.035, place(i) {
      if (R2[i] < 0.16) {
        const d = Math.sqrt(R3[i]) * 0.48, a = R1[i] * TAU;
        return [Math.cos(a) * d, (R4[i] - 0.5) * 0.12, Math.sin(a) * d];
      }
      const a = R1[i] * TAU, r = 0.8 + (R3[i] - 0.5) * 0.12;
      return [Math.cos(a) * r, (R4[i] - 0.5) * 0.05, Math.sin(a) * r];
    } },
    cloud: { fuzz: 0, place(i) {
      const s = 0.36;
      return [gauss(R1[i], R2[i]) * s, gauss(R2[i], R3[i]) * s * 0.8, gauss(R3[i], R4[i]) * s];
    } },
    sphere: { fuzz: 0.03, place(i) {
      const [x, y, z] = fib(i, N);
      const r = R2[i] < 0.1 ? 0.3 * Math.cbrt(R3[i]) : 0.78;
      return [x * r, y * r, z * r];
    } },
    // Tipped over at an angle, so it is neither the ring lying down nor,
    // turned edge on, a band standing up like the helix.
    torus: { fuzz: 0.03, place(i) {
      const u = R1[i] * TAU, v = R2[i] * TAU, R = 0.56, r = 0.24, tip = 0.95;
      const x = (R + r * Math.cos(v)) * Math.cos(u), y = r * Math.sin(v), z = (R + r * Math.cos(v)) * Math.sin(u);
      return [x, y * Math.cos(tip) - z * Math.sin(tip), y * Math.sin(tip) + z * Math.cos(tip)];
    } },
    knot: { fuzz: 0.05, place(i) {
      const t = R1[i] * TAU, k = 0.25;
      return [(Math.sin(t) + 2 * Math.sin(2 * t)) * k, (Math.cos(t) - 2 * Math.cos(2 * t)) * k, -Math.sin(3 * t) * k * 1.4];
    } },
    helix: { fuzz: 0.03, place(i) {
      const s = R1[i], strand = i % 2;
      if (R2[i] < 0.12) {
        // A rung across, now and then.
        const s2 = Math.round(s * 18) / 18, a = s2 * TAU * 2.5, u = R3[i];
        const x0 = Math.cos(a) * 0.42, z0 = Math.sin(a) * 0.42;
        return [x0 * (1 - 2 * u), (s2 - 0.5) * 1.6, z0 * (1 - 2 * u)];
      }
      const a = s * TAU * 2.5 + strand * Math.PI;
      return [Math.cos(a) * 0.42, (s - 0.5) * 1.6, Math.sin(a) * 0.42];
    } },
    disc: { fuzz: 0.02, place(i) {
      if (R2[i] < 0.14) {
        const d = Math.cbrt(R3[i]) * 0.18, [x, y, z] = fib(i, N);
        return [x * d, y * d * 0.6, z * d];
      }
      const arm = i % 3, r = 0.1 + Math.pow(R1[i], 0.7) * 0.8;
      const a = (arm / 3) * TAU + r * 4.2 + gauss(R3[i], R4[i]) * 0.22 / (r + 0.3);
      return [Math.cos(a) * r, gauss(R4[i], R3[i]) * 0.03 * (1 - r), Math.sin(a) * r];
    } },
    lattice: { fuzz: 0.018, place(i) {
      const h = 0.52, e = i % 12, u = R1[i] * 2 - 1;
      const ax = Math.floor(e / 4), c1 = e % 2 ? h : -h, c2 = (e >> 1) % 2 ? h : -h;
      const p = [0, 0, 0];
      p[ax] = u * h; p[(ax + 1) % 3] = c1; p[(ax + 2) % 3] = c2;
      return p;
    } },
    gyre: { fuzz: 0.025, place(i) {
      const a = R1[i] * TAU, r = 0.74, k = i % 3;
      const c = Math.cos(a) * r, s = Math.sin(a) * r;
      return k === 0 ? [c, s, 0] : k === 1 ? [c, 0, s] : [0, c, s];
    } },
    saddle: { fuzz: 0.02, place(i) {
      const a = R1[i] * TAU, d = Math.sqrt(R2[i]) * 0.78;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      return [x, (x * x - z * z) * 1.1, z];
    } },
    shells: { fuzz: 0.025, place(i) {
      const k = i % 3, [x, y, z] = fib(Math.floor(i / 3), Math.ceil(N / 3));
      const r = [0.3, 0.56, 0.82][k];
      return [x * r, y * r, z * r];
    } },
    hourglass: { fuzz: 0.025, place(i) {
      const h = R1[i] * 2 - 1, r = Math.abs(h) * 0.58, a = R2[i] * TAU;
      return [Math.cos(a) * r, h * 0.78, Math.sin(a) * r];
    } },
  };
  // The forms the rows take, by number, in turn.
  const ORDER = ["sphere", "knot", "torus", "helix", "disc", "lattice", "gyre", "saddle", "shells", "hourglass"];

  const made = new Map();
  /** A form's places, worked out once and kept: three numbers a speck. */
  function formOf(name) {
    if (made.has(name)) return made.get(name);
    const shape = SHAPES[name];
    const P = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let p;
      if (name !== "cloud" && name !== "ring" && R4[i] < HAZE) {
        // The haze round every form: the cloud, wider and fainter.
        const s = 0.5;
        p = [gauss(R1[i], R3[i]) * s, gauss(R3[i], R2[i]) * s * 0.8, gauss(R2[i], R1[i]) * s];
      } else {
        p = shape.place(i);
        if (shape.fuzz) {
          p[0] += gauss(R3[i], R4[i]) * shape.fuzz;
          p[1] += gauss(R4[i], R1[i]) * shape.fuzz;
          p[2] += gauss(R1[i], R4[i]) * shape.fuzz;
        }
      }
      P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2];
    }
    const form = { name, P, drift: name === "cloud" || name === "ring" };
    made.set(name, form);
    return form;
  }

  /** The form a row takes. */
  const nameOf = (row) => {
    if (!row) return "ring";
    const kind = (row.dataset.kind || "").trim();
    const named = (row.dataset.name || "").trim();
    if (!kind && (!named || named === "Untitled")) return "cloud";
    const no = parseInt(row.dataset.no, 10);
    return ORDER[((isNaN(no) ? 0 : no) % ORDER.length + ORDER.length) % ORDER.length];
  };

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
  let current = null, previous = null, currentQuiet = 1, previousQuiet = 1;
  let shownRow = null;
  let W = 0, H = 0, ratio = 1, S = 1, CX = 0, CY = 0;

  function show(row) {
    const name = nameOf(row);
    if (row === shownRow && current && current.name === name) return;
    shownRow = row;
    rows().forEach((r) => r.classList.toggle("is-shown", r === row));
    field.dataset.showing = row ? (row.dataset.no || "") : "";
    field.dataset.figure = name;
    previous = current;
    previousQuiet = currentQuiet;
    current = formOf(name);
    currentQuiet = row && row.dataset.open === "no" ? 0.5 : 1;
    caption(row);
    if (still) { settle(); draw(); return; }
    // Thrown out from the middle, each on a clock of its own.
    const now = performance.now();
    for (let i = 0; i < N; i++) {
      GO[i] = now + R4[i] * SPREAD;
      const dx = X[i] - CX, dy = Y[i] - CY, d = Math.hypot(dx, dy) || 1;
      const kick = KICK * (0.4 + R2[i]);
      VX[i] += (dx / d) * kick;
      VY[i] += (dy / d) * kick;
    }
    wake();
  }

  // ============================================================
  // TURNING AND SEEING: a place in the form, turned about the tilted
  // axis by the clock, and seen in perspective. Out: where on the field,
  // and how near (0 far, 1 near).
  // ============================================================
  const out = new Float32Array(3);
  let cosA = 1, sinA = 0;
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  function turnTo(t) {
    const a = still ? 0.6 : t * SPIN;
    cosA = Math.cos(a); sinA = Math.sin(a);
  }
  function see(form, i, t) {
    let x = form.P[i * 3], y = form.P[i * 3 + 1], z = form.P[i * 3 + 2];
    if (form.drift && !still) {
      // The ring and the cloud drift a little about their places.
      x += Math.sin(t * 0.0003 + R4[i] * 6) * 0.03;
      y += Math.cos(t * 0.00025 + R1[i] * 6) * 0.025;
    }
    // About the upright axis, then leaning towards you.
    const x1 = x * cosA + z * sinA, z1 = -x * sinA + z * cosA;
    const y2 = y * cosT - z1 * sinT, z2 = y * sinT + z1 * cosT;
    const k = FOCAL / (FOCAL + z2);
    out[0] = CX + x1 * S * k;
    out[1] = CY + y2 * S * k;
    out[2] = Math.max(0, Math.min(1, 0.5 - z2 * 0.55));
  }

  /** Every speck straight to its place: the still drawing. */
  function settle() {
    turnTo(0);
    for (let i = 0; i < N; i++) {
      see(current, i, 0);
      X[i] = out[0]; Y[i] = out[1];
      VX[i] = 0; VY[i] = 0;
      keep(i, out[2], currentQuiet);
    }
  }
  function keep(i, near, quiet) {
    A[i] = (0.28 + 0.72 * near) * quiet;
    Z[i] = 0.75 + near * 0.9;
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
    S = Math.min(W * 0.42, H * 0.34);
    CX = W / 2; CY = H * 0.47;
    if (first) {
      make(COUNT());
      current = formOf("ring");
    } else if (was[0] && was[1]) {
      for (let i = 0; i < N; i++) { X[i] *= W / was[0]; Y[i] *= H / was[1]; }
    }
    if (still) settle();
    draw();
  }

  function draw() {
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, W, H);
    // THE WEB: hairlines between a few specks wherever two of them come
    // near each other, fainter the further apart and the
    // further back.
    g.lineWidth = 1 / ratio;
    const reach2 = WEB_REACH * WEB_REACH;
    for (let j = 0; j < STRUNG.length; j++) {
      const a = STRUNG[j];
      for (let m = j + 1; m < STRUNG.length; m++) {
        const b = STRUNG[m];
        const dx = X[a] - X[b], dy = Y[a] - Y[b], d2 = dx * dx + dy * dy;
        if (d2 > reach2) continue;
        const k = (1 - Math.sqrt(d2) / WEB_REACH) * Math.min(A[a], A[b]) * 0.3;
        if (k < 0.01) continue;
        g.strokeStyle = "rgba(" + INK + "," + k.toFixed(3) + ")";
        g.beginPath(); g.moveTo(X[a], Y[a]); g.lineTo(X[b], Y[b]); g.stroke();
      }
    }
    // THE SPECKS, as they were last told.
    g.fillStyle = "rgb(" + INK + ")";
    for (let i = 0; i < N; i++) {
      let a = A[i];
      const x = X[i], y = Y[i];
      const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
      if (d2 < PART * PART) a = Math.min(1, a + (1 - Math.sqrt(d2) / PART) * 0.5);
      if (a <= 0.01) continue;
      g.globalAlpha = Math.min(1, a * 0.8);
      const s = 1.2 * Z[i];
      g.fillRect(x - s / 2, y - s / 2, s, s);
    }
    g.globalAlpha = 1;
  }

  function step(t) {
    turnTo(t);
    for (let i = 0; i < N; i++) {
      const next = t >= GO[i] || !previous;
      see(next ? current : previous, i, t);
      keep(i, out[2], next ? currentQuiet : previousQuiet);
      const k = SPRING * (0.7 + 0.6 * R3[i]);
      VX[i] = (VX[i] + (out[0] - X[i]) * k) * DAMP;
      VY[i] = (VY[i] + (out[1] - Y[i]) * k) * DAMP;
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
    draw();
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
  // tapping it shows its form; leaving the table brings the ring back a
  // moment later, so passing from one row to the next never does.
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
  if (still) { settle(); draw(); }
  else wake();
  startTurns();
})();
