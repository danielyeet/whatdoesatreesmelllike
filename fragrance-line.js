// ============================================================
// THE FRAGRANCES, ALONG A LINE — the Fragrances view of
// categories/scent-descriptions.html
//
// The owner, 2026-09-25: "keep the current copy exactly as it is; and
// save it somewhere in the code ... create a new design for that page;
// which takes inspiration from the houses page. I want there to be a
// central horizental line, which will go through the page, and there
// should be particles around this line, like a double pyramid attatched
// at the base (the two apices being at the top and bottom). this should
// have a dimension, so when you scroll, it changes in a given way. I
// want this to display the files of 001 and the name of the fragrance;
// and the house it came from when you hover it. I want the paage to
// react to scrolling, so new ones would appear. For this test, assume
// there are 20 fragrances."
//
// So, the Houses view turned on its side:
//
//   THE LINE      a horizontal line through the whole window, drawn as
//                 the houses' axis is — a soft band of light, a firm
//                 line (two hairlines here, where the axis is one), and
//                 pulses running along it — ticked every quarter of a
//                 file, the ticks travelling as you do, specks drifting
//                 along it.
//   THE PYRAMID   a double pyramid of specks standing on the line in the
//                 middle of the window: a square base lying in the line,
//                 one apex straight above it and one straight below, its
//                 edges drawn close and its faces loosely, tipped a
//                 little towards you so its base reads as a diamond. IT
//                 HAS DIMENSION: travelling along the line turns it, a
//                 quarter turn for every file, and left alone it turns
//                 very slowly on its own.
//   THE FILES     every fragrance a FILE on the line — its number, 001,
//                 large, and its name under it — the one in the middle
//                 inside the pyramid and the largest, the rest going off
//                 along the line either side, smaller and fainter the
//                 further away. POINTED AT, a file says the house it
//                 came from. The file in the middle opens the fragrance
//                 in the page (fragrance-reader.js, as the table did);
//                 any other brings itself to the middle.
//   TRAVELLING    by the wheel — which is the owner's "react to
//                 scrolling, so new ones would appear": files come in
//                 from the edge of the window as you go — by a drag, by
//                 the arrow keys, and by the way along at the foot.
//   TWENTY        there are seven fragrances written; the owner asked
//                 for the test to assume twenty, so thirteen more stand
//                 on the line as PLACEHOLDERS: numbered, Untitled, with
//                 no house and nothing to open. `TEST_COUNT` is the one
//                 number to take out when the real ones arrive.
//
// THE OLD VIEW IS KEPT, and nothing here changes it. The table is still
// in the page, exactly as it was — it is where this reads the
// fragrances from, and what a press on a file actually presses — and a
// copy of it stands in archive/fragrances-view-2026-09-24.html. This
// only lays the line over it and hides the table while it does
// (`.view.line-on`). Block this script and the page is the old view.
//
// COMING IN FROM THE HOUSES, views.js stretches the houses' axis into
// this line (see there); while it does, `data-arrive="wait"` on the view
// holds everything here back, and `data-arrive="line"` then says the
// line is already drawn — so only the pyramid and the files come in.
// Opened any other way, the line draws itself out first.
// ============================================================
(function () {
  const view = document.querySelector('.view[data-view="fragrances"]');
  if (!view) return;
  const body = view.querySelector(".index-table tbody");
  if (!body) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const TEST_COUNT = 20;           // "For this test, assume there are 20 fragrances."
  const LINE_AT = 0.53;            // the line, down the window
  const SPAN_OF = 0.21;            // of the window's width, file to file
  const SPAN_LEAST = 150;
  const SPAN_MOST = 290;
  const SPAN_NARROW = 0.46;        // on a phone, so the ones either side are only edges
  const NARROW = 700;
  const SEEN = 3.6;                // files either side before they are gone
  const SMALLER = 0.13;            // how much smaller each file along is
  const WHEEL = 1 / 300;           // files per pixel of wheel
  const SNAP_MS = 170;
  const EASE = 7.5;

  // THE PYRAMID
  const PY_WIDE = 0.15, PY_WIDE_MOST = 200;   // half its base, of the window's width
  const PY_TALL = 0.31, PY_TALL_MOST = 250;   // apex to base, of the window's height
  const PY_TURN = Math.PI / 2;     // radians it turns for every file travelled
  const PY_SPIN = 0.05;            // radians a second on its own
  const PY_PITCH = 0.3;            // tipped towards you
  const EDGE_SPECKS = 48;
  const FACE_SPECKS = 70;
  const DUST = 300;

  // THE LINE
  const LINE_GLOW = 16;            // px either side
  const PULSES = 3;
  const PULSE_SPEED = 170;         // px a second, rightwards
  const PULSE_LEN = 120;
  const DRIFT = 220;               // specks drifting along it

  // THE ARRIVAL, one thing after another, as the houses' is.
  const LINE_MS = 620;
  const PYRAMID_MS = 820;
  const FILE_MS = 460;
  const FILE_STEP = 60;

  const HAND_REACH = 130;

  let seed = 2509;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));

  // ============================================================
  // THE FRAGRANCES, read off the table
  // ============================================================
  const rows = [...body.querySelectorAll("tr")].sort((a, b) => (+a.dataset.no || 0) - (+b.dataset.no || 0));
  const files = rows.map((row) => ({
    no: +row.dataset.no,
    name: row.dataset.name || row.querySelector(".index-what").textContent.trim(),
    house: row.dataset.house || "",
    link: row.querySelector(".index-what a"),
  }));
  for (let n = files.length + 1; n <= Math.max(TEST_COUNT, files.length); n++) {
    files.push({ no: n, name: "Untitled", house: "", link: null, placeholder: true });
  }
  const N = files.length;

  // ============================================================
  // THE STAGE
  // ============================================================
  const stage = document.createElement("div");
  stage.className = "frag-line";
  const field = document.createElement("canvas");
  field.className = "frag-line-field";
  field.setAttribute("aria-hidden", "true");
  const list = document.createElement("ol");
  list.className = "frag-line-files";
  list.setAttribute("aria-label", "Fragrances");
  const buttons = files.map((f, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "frag-file" + (f.placeholder ? " is-placeholder" : "");
    b.dataset.i = String(i);
    b.innerHTML = '<span class="frag-file-no"></span><span class="frag-file-name"></span><span class="frag-file-house"></span>';
    b.querySelector(".frag-file-no").textContent = String(f.no).padStart(3, "0");
    b.querySelector(".frag-file-name").textContent = f.name;
    b.querySelector(".frag-file-house").textContent = f.placeholder ? "Placeholder" : f.house;
    b.setAttribute("aria-label", String(f.no).padStart(3, "0") + ", " + f.name +
      (f.placeholder ? ", a placeholder" : ", " + f.house));
    b.addEventListener("click", () => press(i));
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });
  const nav = document.createElement("div");
  nav.className = "frag-line-nav";
  nav.innerHTML =
    '<button type="button" class="frag-line-step" data-step="-1" aria-label="The fragrance before"><span aria-hidden="true">&#8592;</span></button>' +
    '<p class="frag-line-at" aria-live="polite"><b></b><span></span></p>' +
    '<button type="button" class="frag-line-step" data-step="1" aria-label="The next fragrance"><span aria-hidden="true">&#8594;</span></button>';
  const navAt = nav.querySelector(".frag-line-at b");
  const navName = nav.querySelector(".frag-line-at span");
  nav.querySelectorAll(".frag-line-step").forEach((b) =>
    b.addEventListener("click", () => go(Math.round(target) + Number(b.dataset.step))));
  stage.append(field, list, nav);
  view.insertBefore(stage, view.firstChild);
  view.classList.add("line-on");
  document.body.classList.add("frag-line-on");
  const ink = field.getContext("2d");
  const INK = getComputedStyle(document.body).getPropertyValue("--ink-rgb").trim() || "23, 23, 15";

  // ============================================================
  // WHERE EVERYTHING STANDS
  // ============================================================
  let W = 0, H = 0, ratio = 1, cx = 0, cy = 0, span = 0, pw = 0, ph = 0;
  function layout() {
    W = window.innerWidth;
    H = window.innerHeight;
    cx = W / 2;
    cy = Math.round(H * LINE_AT);
    span = W < NARROW ? W * SPAN_NARROW : Math.max(SPAN_LEAST, Math.min(SPAN_MOST, W * SPAN_OF));
    pw = Math.min(W * PY_WIDE, PY_WIDE_MOST) * (W < NARROW ? 1.3 : 1);
    ph = Math.min(H * PY_TALL, PY_TALL_MOST);
    ratio = Math.min(window.devicePixelRatio || 1, W < NARROW ? 1.5 : 2);
    field.width = Math.round(W * ratio);
    field.height = Math.round(H * ratio);
    // Where the line is, for views.js to stretch the houses' axis into.
    stage.dataset.lineY = String(cy);
    stage.style.setProperty("--line-y", cy + "px");
  }

  // ============================================================
  // THE SPECKS: the pyramid's, in its own frame; the line's; the dust's
  // ============================================================
  // The pyramid's six corners: the four of its base (in the line), and
  // the two apices. In units of its half-width across and of its height
  // up and down.
  const corner = [[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0], [0, 1, 0]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [1, 5], [2, 5], [3, 5]];
  const faces = [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 0, 5]];
  const pyramid = [];
  edges.forEach(([a, b], e) => {
    for (let k = 0; k < EDGE_SPECKS; k++) {
      const t = (k + random()) / EDGE_SPECKS;
      const p = corner[a].map((v, i) => v + (corner[b][i] - v) * t);
      pyramid.push({ p, size: 0.8 + random() * 1.2, lit: 0.5 + random() * 0.45, edge: true, order: e / edges.length * 0.6 + t * 0.4 });
    }
  });
  faces.forEach(([a, b, c]) => {
    for (let k = 0; k < FACE_SPECKS; k++) {
      let u = random(), v = random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const p = corner[a].map((x, i) => x + (corner[b][i] - x) * u + (corner[c][i] - x) * v);
      pyramid.push({ p, size: 0.6 + random() * 0.9, lit: 0.14 + random() * 0.3, edge: false, order: 0.5 + random() * 0.5 });
    }
  });
  const dust = [];
  for (let n = 0; n < DUST; n++) {
    const a = random() * Math.PI * 2, r = 0.2 + Math.pow(random(), 0.6) * 1.5, y = (random() * 2 - 1) * 1.15;
    dust.push({ a, r, y, size: 0.5 + random() * 1.2, lit: 0.1 + random() * 0.35 });
  }
  const drift = [];
  for (let n = 0; n < DRIFT; n++) {
    drift.push({ x: random(), off: (random() + random() + random() - 1.5) * 6, v: 14 + random() * 30, size: 0.6 + random() * 1.3, lit: 0.25 + random() * 0.55 });
  }
  const bursts = [];

  let pos = 0, target = 0;
  const shown = files.map(() => (REDUCE_MOTION ? 1 : 0));
  let lineShown = REDUCE_MOTION ? 1 : 0;
  let pyramidShown = REDUCE_MOTION ? 1 : 0;
  let waiting = false;
  let px = -9999, py = -9999;
  let front = -1;
  let turn = 0;

  function speck(x, y, size, a) {
    if (a <= 0.01 || x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
    const near = Math.max(0, 1 - Math.hypot(x - px, y - py) / HAND_REACH);
    ink.globalAlpha = Math.min(1, a * (1 + near * 1.3));
    const s = size * (1 + near * 0.4);
    ink.fillRect(x - s / 2, y - s / 2, s, s);
  }

  /** A point of the pyramid's own frame, turned and tipped, on the window. */
  function project(p) {
    const x0 = p[0] * pw, y0 = p[1] * ph, z0 = p[2] * pw;
    const c = Math.cos(turn), s = Math.sin(turn);
    const x1 = x0 * c + z0 * s, z1 = -x0 * s + z0 * c;
    const cp = Math.cos(PY_PITCH), sp = Math.sin(PY_PITCH);
    const y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp;
    const f = 900 / (900 + z2);
    return { x: cx + x1 * f, y: cy + y2 * f, z: z2 / pw };
  }

  function draw(now) {
    if (!ink || !W) return;
    const t = now / 1000;
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.clearRect(0, 0, W, H);
    if (waiting) return;
    ink.fillStyle = "rgb(" + INK + ")";

    // THE LINE, from the middle out to both edges as it arrives.
    const from = cx - (cx + 20) * lineShown, to = cx + (W - cx + 20) * lineShown;
    const glow = ink.createLinearGradient(0, cy - LINE_GLOW, 0, cy + LINE_GLOW);
    glow.addColorStop(0, "rgba(" + INK + ", 0)");
    glow.addColorStop(0.5, "rgba(" + INK + ", 0.09)");
    glow.addColorStop(1, "rgba(" + INK + ", 0)");
    ink.globalAlpha = lineShown;
    ink.fillStyle = glow;
    ink.fillRect(from, cy - LINE_GLOW, to - from, LINE_GLOW * 2);
    if (!REDUCE_MOTION) {
      const lap = W + 40 + PULSE_LEN;
      for (let k = 0; k < PULSES; k++) {
        const x = -20 + ((t * PULSE_SPEED + k * lap / PULSES) % lap);
        const tail = ink.createLinearGradient(x - PULSE_LEN, 0, x, 0);
        tail.addColorStop(0, "rgba(" + INK + ", 0)");
        tail.addColorStop(1, "rgba(" + INK + ", 0.7)");
        ink.fillStyle = tail;
        const a = Math.max(from, x - PULSE_LEN), b = Math.min(to, x);
        if (b > a) ink.fillRect(a, cy - 1.5, b - a, 3);
      }
    }
    // Two hairlines, where the houses' axis is one firm line.
    ink.fillStyle = "rgb(" + INK + ")";
    ink.globalAlpha = 0.72 * lineShown;
    ink.fillRect(from, cy - 1.6, to - from, 0.9);
    ink.fillRect(from, cy + 0.7, to - from, 0.9);
    // Ticks travelling with you: every quarter of a file, long at each.
    const quarter = span / 4, shift = pos * span;
    for (let k = Math.ceil((from - cx + shift) / quarter); k <= Math.floor((to - cx + shift) / quarter); k++) {
      const x = cx + k * quarter - shift;
      const long = ((k % 4) + 4) % 4 === 0;
      ink.globalAlpha = (long ? 0.66 : 0.3) * lineShown;
      ink.fillRect(x, cy - (long ? 9 : 4.5), 1, long ? 18 : 9);
    }
    // Specks drifting along it.
    for (const d of drift) {
      const x = ((d.x * W + (REDUCE_MOTION ? 0 : t * d.v)) % (W + 20) + W + 20) % (W + 20) - 10;
      if (x < from || x > to) continue;
      speck(x, cy + d.off, d.size, d.lit * 0.8 * lineShown);
    }

    // THE PYRAMID, its edges first as it arrives, turning as you go.
    turn = pos * PY_TURN + (REDUCE_MOTION ? 0.35 : t * PY_SPIN);
    stage.dataset.turn = turn.toFixed(3);
    if (pyramidShown > 0) {
      for (const d of dust) {
        const a = d.a + turn * 0.6;
        const x = cx + Math.cos(a) * d.r * pw, z = Math.sin(a) * d.r;
        const y = cy + d.y * ph * (1 - Math.min(1, Math.abs(d.r) / 1.8) * 0.4);
        speck(x, y, d.size * (0.7 + (z + 1.5) * 0.2), d.lit * (0.5 + 0.25 * z) * pyramidShown);
      }
      for (const s of pyramid) {
        const k = Math.max(0, Math.min(1, (pyramidShown - s.order * 0.7) / 0.3));
        if (k <= 0) continue;
        const q = project(s.p);
        const depth = (1 - q.z) / 2;           // 1 in front, 0 behind
        speck(q.x, q.y, s.size * (0.75 + depth * 0.5), s.lit * (0.35 + 0.65 * depth) * k);
      }
    }

    // A burst of specks where a file has just come in.
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      const k = (now - b.at) / 520;
      if (k >= 1) { bursts.splice(i, 1); continue; }
      const x = cx + (b.i - pos) * span;
      for (let n = 0; n < 14; n++) {
        const a = (n / 14) * Math.PI * 2 + b.i;
        speck(x + Math.cos(a) * (10 + k * 34), cy + Math.sin(a) * (6 + k * 20), 1.2, 0.6 * (1 - k));
      }
    }
    ink.globalAlpha = 1;
  }

  /** The files on the line: where each stands, how large, how seen. */
  function place() {
    buttons.forEach((b, i) => {
      const d = i - pos;
      const come = shown[i];
      const far = Math.abs(d);
      const s = Math.max(0.5, 1 - SMALLER * Math.min(far, 3.5)) * (0.9 + 0.1 * come);
      const x = cx + d * span * (0.35 + 0.65 * come);
      const seen = far > SEEN ? 0 : come * Math.max(0, 1 - Math.pow(far / SEEN, 1.6) * 0.95);
      b.style.transform = "translate(" + (x).toFixed(1) + "px," + cy + "px) translate(-50%, -50%) scale(" + s.toFixed(4) + ")";
      b.style.opacity = seen.toFixed(3);
      b.style.visibility = seen < 0.02 ? "hidden" : "";
      b.style.zIndex = String(10 - Math.round(far));
      b.tabIndex = seen < 0.02 ? -1 : 0;
      b.classList.toggle("is-front", far < 0.5);
    });
    const now = Math.min(N - 1, Math.max(0, Math.round(pos)));
    if (now !== front) {
      // A file that has just come into the window arrives on a burst.
      if (front >= 0 && !REDUCE_MOTION) {
        const edge = now + Math.sign(now - front) * 3;
        if (edge >= 0 && edge < N) bursts.push({ i: edge, at: performance.now() });
      }
      front = now;
      navAt.textContent = String(files[now].no).padStart(3, "0") + " / " + String(N).padStart(3, "0");
      navName.textContent = files[now].name;
      stage.dataset.front = String(now + 1);
    }
    // The way along comes in with the files, not before them.
    nav.style.opacity = shown[now].toFixed(3);
  }

  // ============================================================
  // RUNNING — only while the view is on the page
  // ============================================================
  let last = 0, snapAt = 0, looping = false;
  const onPage = () => !view.hidden && !document.body.classList.contains("frag-open");
  function loop(now) {
    if (!onPage()) { looping = false; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (snapAt && now > snapAt && !dragging) { snapAt = 0; target = Math.round(target); }
    if (REDUCE_MOTION) pos = target;
    else pos += (target - pos) * (1 - Math.exp(-dt * EASE));
    if (Math.abs(target - pos) < 0.0005) pos = target;
    place();
    draw(now);
    if (REDUCE_MOTION && pos === target && !snapAt) { looping = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() {
    if (looping) return;
    looping = true;
    last = 0;
    requestAnimationFrame(loop);
  }
  function go(i) {
    target = Math.max(0, Math.min(N - 1, i));
    snapAt = 0;
    wake();
  }
  function press(i) {
    if (Math.abs(i - pos) >= 0.5) { go(i); return; }
    const f = files[i];
    // The middle file opens its fragrance, by pressing its row in the
    // table — so the reader opens it exactly as it always has.
    if (f.link) f.link.click();
  }

  // ============================================================
  // THE ARRIVAL: the line, then the pyramid, then the files in order.
  // ============================================================
  let arrival = 0;
  function arrive(lineDrawn) {
    waiting = false;
    stage.classList.remove("waiting");
    if (REDUCE_MOTION) {
      lineShown = pyramidShown = 1;
      shown.fill(1);
      place();
      wake();
      return;
    }
    const t0 = performance.now();
    const lineFor = lineDrawn ? 0 : LINE_MS;
    lineShown = lineDrawn ? 1 : 0;
    pyramidShown = 0;
    shown.fill(0);
    const id = ++arrival;
    const step = (now) => {
      if (id !== arrival) return;
      const t = now - t0;
      if (!lineDrawn) lineShown = ease(t / LINE_MS);
      pyramidShown = Math.max(0, Math.min(1, (t - lineFor) / PYRAMID_MS));
      let all = true;
      files.forEach((f, i) => {
        // In order out from the middle: the one in front first.
        const order = Math.abs(i - Math.round(target));
        const k = ease((t - lineFor - PYRAMID_MS * 0.6 - order * FILE_STEP) / FILE_MS);
        shown[i] = k;
        if (k < 1) all = false;
      });
      if (!all || t < lineFor + PYRAMID_MS) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    wake();
  }
  function hold() {
    arrival++;
    waiting = true;
    stage.classList.add("waiting");
    lineShown = pyramidShown = 0;
    shown.fill(0);
    place();
    draw(performance.now());
  }

  // What views.js asks for, on the view itself.
  let wasHidden = view.hidden;
  new MutationObserver(() => {
    const ask = view.dataset.arrive;
    if (ask === "wait") { if (!waiting) hold(); }
    else if (ask === "line") { delete view.dataset.arrive; arrive(true); }
    else if (wasHidden && !view.hidden) arrive(false);
    wasHidden = view.hidden;
    if (onPage()) wake();
  }).observe(view, { attributes: true, attributeFilter: ["hidden", "data-arrive"] });
  // Back from the reader.
  new MutationObserver(() => { if (onPage()) wake(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // ============================================================
  // TRAVELLING
  // ============================================================
  stage.addEventListener("wheel", (e) => {
    if (waiting) return;
    e.preventDefault();
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? W : 1;
    target = Math.max(-0.35, Math.min(N - 1 + 0.35, target + d * scale * WHEEL));
    snapAt = performance.now() + SNAP_MS;
    wake();
  }, { passive: false });

  let dragging = false, dragFrom = 0, dragTarget = 0, dragged = false, dragId = null, dragAxis = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (waiting || e.button !== 0 || e.target.closest(".frag-line-nav")) return;
    dragging = true;
    dragged = false;
    dragFrom = [e.clientX, e.clientY];
    dragTarget = target;
    dragId = e.pointerId;
    dragAxis = 0;
  });
  window.addEventListener("pointermove", (e) => {
    px = e.clientX;
    py = e.clientY;
    if (!dragging || e.pointerId !== dragId) return;
    const dx = e.clientX - dragFrom[0], dy = e.clientY - dragFrom[1];
    if (!dragged && Math.hypot(dx, dy) > 6) { dragged = true; dragAxis = Math.abs(dx) >= Math.abs(dy) ? 0 : 1; }
    if (!dragged) return;
    // Across or down, whichever the drag set off along.
    const along = dragAxis ? dy : dx;
    target = Math.max(-0.35, Math.min(N - 1 + 0.35, dragTarget - along / span));
    wake();
  }, { passive: true });
  document.addEventListener("pointerleave", () => { px = -9999; py = -9999; });
  const letGo = (e) => {
    if (!dragging || (e && e.pointerId !== dragId)) return;
    dragging = false;
    if (dragged) { snapAt = performance.now(); wake(); }
  };
  window.addEventListener("pointerup", letGo);
  window.addEventListener("pointercancel", letGo);
  // A drag is not a press.
  stage.addEventListener("click", (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);

  document.addEventListener("keydown", (e) => {
    if (!onPage() || waiting) return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (document.body.classList.contains("menu-open")) return;
    const at = Math.round(target);
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") to = at + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") to = at - 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = N - 1;
    if (to === null) return;
    e.preventDefault();
    go(to);
  });

  window.addEventListener("resize", () => { layout(); place(); draw(performance.now()); });

  layout();
  place();
  if (!view.hidden) arrive(false);
})();
