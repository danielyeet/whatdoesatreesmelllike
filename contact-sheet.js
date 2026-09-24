// ============================================================
// THE HOUSES — the axis (categories/scent-descriptions.html)
//
// The owner, 2026-09-24, the second time that day: "I also want you to
// redisign the houses part again. I want it to be something to do with
// aprticles. give it a central axis too; and make it look impressive,
// and navigatable."
//
// So the houses stand on a HELIX round a CENTRAL AXIS, drawn in
// particles, and you travel along it:
//
//   THE AXIS      a vertical line of specks down the middle of the page,
//                 always falling, ruled with ticks that travel as you
//                 do, and carrying each house's NUMBER where that house
//                 stands on it. The numbers are buttons.
//   THE HELIX     two strands of specks winding round the axis, and the
//                 houses riding on them: one house at the front, on the
//                 axis, large and sharp; the ones before and after it
//                 turned away round the axis, above and below, smaller
//                 and fainter the further round they are. Every house
//                 is joined to the axis by a TETHER of specks.
//   THE FRONT     the house you are on: a ring of specks turns round it,
//                 and pressing it opens the house. Pressing any other
//                 brings IT to the front. Its line about the house shows
//                 only while it is pointed at, as every house's does.
//   TRAVELLING    by the wheel, by dragging (a finger on a phone), by
//                 the arrow keys, by the numbers on the axis, and by the
//                 two buttons at the side with where you are between
//                 them — the owner's "navigatable".
//   THE ARRIVAL   the axis is drawn out from the middle of the page, and
//                 the houses come out of it one after another, nearest
//                 first, on a burst of specks.
//
// RESTING ON A HOUSE still brings its motifs over the page while the
// rest goes out of focus (motifs.js), and PRESSING the front one still
// steps the page back and opens it.
//
// The houses are the <a class="sheet-frame"> blocks in the page, in
// order, so adding a house is an HTML edit and nothing here changes.
// Delete this file and its <script> tag and the page is still a plain,
// working grid of links.
// ============================================================
(function () {
  const sheet = document.getElementById("sheet");
  if (!sheet) return; // not a page with the houses on it

  const frames = Array.from(sheet.querySelectorAll(".sheet-frame"));
  if (!frames.length) return;
  const N = frames.length;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  // THE HELIX. A house is SPAN of the page's height below the one before
  // it, and TURN radians further round the axis. The front house stands
  // on the axis; the next is turned 62 degrees round to the right and a
  // little down, the one after that nearly behind it.
  const SPAN = 0.25;               // of the page's height, house to house
  // ON A PHONE the houses before and after the front one would stand on
  // it, the helix having no width to turn them away in; so they stand
  // further apart, and only their edges are seen above and below. Keyed
  // to the width, as every phone fix on this site is.
  const SPAN_NARROW = 0.36;
  const NARROW = 700;
  const TURN = 1.08;               // radians round the axis, house to house
  const RADIUS = 0.34;             // of the page's width, the helix's reach
  const RADIUS_MOST = 560;         // px
  const FRONT = 0.4;               // the front house's height, of the page's
  const FRONT_MOST = 360;          // px
  const FRONT_FEWEST = 150;        // px
  const SHAPE = 0.86;              // a house is this wide for its height
  const SMALLEST = 0.46;           // the scale of a house right behind the axis
  const SIDE_FALL = 2;             // how quickly a house shrinks as it turns away:
                                   // at 2, the ones either side are three quarters of the front

  // TRAVELLING. The wheel moves the helix by a fraction of a house per
  // pixel; it comes to rest on the nearest house once the wheel stops.
  const WHEEL = 1 / 320;           // houses per pixel of wheel
  const SNAP_MS = 170;             // how long after the last movement it settles
  const EASE = 7.5;                // how quickly it follows where it is sent

  // THE ARRIVAL
  const AXIS_MS = 760;             // the axis drawn out from the middle
  const EMERGE_MS = 820;           // a house coming out of it
  const EMERGE_STEP = 110;         // between one house and the next

  // THE PARTICLES
  const FALL = 46;                 // px a second down the axis
  const AXIS_SPECKS = 280;
  const STRAND_STEP = 0.022;       // houses between strand specks
  const TETHER_SPECKS = 30;
  const DUST = 520;                // specks turning round the axis (fewer on a phone)
  const DUST_SPIN = 0.07;          // radians a second
  const HALO_SPECKS = 64;

  // How long the pointer has to rest on a house before its motifs come.
  // It was 420ms and the owner found it "too long".
  const HOVER_WAIT_MS = 200;

  // Pressing a house: how long the page takes to step back before the
  // house is opened.
  const LEAVE_MS = 560;

  // Seeded, so the specks stand the same way every visit.
  let seed = 2409;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // ============================================================
  // THE FRAMES, THEIR NUMBERS, THE AXIS AND THE WAY ROUND
  // ============================================================
  frames.forEach((frame, i) => {
    frame.style.setProperty("--hatch-angle", (-62 + ((i * 37) % 120)) + "deg");
    frame.style.setProperty("--hatch-gap", (9 + ((i * 5) % 9)) + "px");
    // The number stands at the head of the label but is not written INTO
    // the caption: the page's own search reads the caption, and "02ADAR"
    // is not a word anyone searches for.
    const number = document.createElement("span");
    number.className = "sheet-number";
    number.textContent = String(i + 1).padStart(2, "0");
    frame.appendChild(number);
  });
  const nameOf = (frame) => {
    const n = frame.querySelector(".sheet-name");
    return n ? n.textContent.trim() : "";
  };

  sheet.classList.add("scripted");
  document.body.classList.add("sheet-scripted");

  // The particles: one canvas, standing between the houses turned away
  // behind the axis and the ones in front of it.
  const field = document.createElement("canvas");
  field.className = "sheet-field";
  field.setAttribute("aria-hidden", "true");
  sheet.insertBefore(field, sheet.firstChild);
  const ink = field.getContext("2d");

  // THE NUMBERS ON THE AXIS, one per house, where it stands.
  const marks = frames.map((frame, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sheet-axis-no";
    b.textContent = String(i + 1).padStart(2, "0");
    b.setAttribute("aria-label", "Go to " + nameOf(frame));
    b.addEventListener("click", () => go(i));
    sheet.appendChild(b);
    return b;
  });

  // THE WAY ROUND, at the side: before, where you are, after.
  const nav = document.createElement("div");
  nav.className = "sheet-nav";
  nav.innerHTML =
    '<button type="button" class="sheet-nav-step" data-step="-1" aria-label="The house before">' +
      '<span aria-hidden="true">&#8593;</span></button>' +
    '<p class="sheet-nav-at" aria-live="polite"><b></b><span></span></p>' +
    '<button type="button" class="sheet-nav-step" data-step="1" aria-label="The next house">' +
      '<span aria-hidden="true">&#8595;</span></button>';
  sheet.appendChild(nav);
  const navAt = nav.querySelector(".sheet-nav-at b");
  const navName = nav.querySelector(".sheet-nav-at span");
  nav.querySelectorAll(".sheet-nav-step").forEach((b) =>
    b.addEventListener("click", () => go(Math.round(target) + Number(b.dataset.step))));

  // ============================================================
  // WHERE EVERYTHING STANDS
  // ============================================================
  let W = 0, H = 0, ratio = 1;
  let cx = 0, cy = 0, R = 0, span = 0, frontH = 0, frontW = 0;
  function layout() {
    // The houses have the window below the chrome, and no more: the
    // page does not scroll under them, it travels along the helix.
    const top = sheet.getBoundingClientRect().top + window.scrollY;
    W = sheet.clientWidth;
    H = Math.max(420, Math.round(window.innerHeight - top - 8));
    sheet.style.height = H + "px";
    cx = W / 2;
    cy = H * 0.47;
    span = H * (W < NARROW ? SPAN_NARROW : SPAN);
    R = Math.min(W * RADIUS, RADIUS_MOST);
    frontH = Math.max(FRONT_FEWEST, Math.min(FRONT_MOST, H * FRONT, (W - 40) / SHAPE * 0.72));
    frontW = frontH * SHAPE;
    ratio = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    field.width = Math.round(W * ratio);
    field.height = Math.round(H * ratio);
    field.style.width = W + "px";
    field.style.height = H + "px";
    frames.forEach((frame) => {
      frame.style.width = frontW.toFixed(1) + "px";
      frame.style.height = frontH.toFixed(1) + "px";
    });
    place();
    draw(performance.now());
  }

  /** Where a house `d` houses from the front stands: on the window,
      how near the eye (1 in front, -1 right behind the axis), and how
      big it is drawn. */
  function spot(d) {
    const a = d * TURN;
    const z = Math.cos(a);
    return {
      x: cx + R * Math.sin(a),
      y: cy + d * span,
      z: z,
      // The front house as it is; the ones either side of it a little
      // smaller than a straight line through depth would draw them — the
      // owner asked for 06 and 08 "a little smaller" round 07 — and the
      // ones behind the axis smaller still.
      s: SMALLEST + (1 - SMALLEST) * Math.pow((z + 1) / 2, SIDE_FALL),
    };
  }

  // Where along the helix you are (`pos`) and where you are going
  // (`target`), in houses: 0 is the first house at the front.
  let pos = 0, target = 0;
  const shown = frames.map(() => (REDUCE_MOTION ? 1 : 0));   // each house's arrival, 0 to 1
  let axisShown = REDUCE_MOTION ? 1 : 0;
  let front = -1;

  function place() {
    frames.forEach((frame, i) => {
      const d = i - pos;
      const p = spot(d);
      const come = shown[i];
      // A house coming out of the axis starts ON the axis, level with
      // where it will stand, and travels out to its place along its
      // tether, fading up and growing only a little as it comes — the
      // front house is already where it stands, and must not be seen to
      // slide in from anywhere.
      const x = cx + (p.x - cx) * come;
      const s = p.s * (0.94 + 0.06 * come);
      // Faint the further round it is, and gone a little way off the
      // page's top and bottom.
      const off = Math.max(0, Math.abs(p.y - cy) - H * 0.42) / (H * 0.2);
      const seen = come * Math.max(0, 1 - off) * (0.3 + 0.7 * (p.z + 1) / 2);
      frame.style.transform = "translate(" + (x - frontW / 2).toFixed(1) + "px," +
        (p.y - frontH / 2).toFixed(1) + "px) scale(" + s.toFixed(4) + ")";
      frame.style.setProperty("--shown", seen.toFixed(3));
      // In front of the particles or behind them, and the front house
      // above the others in front.
      const atFront = Math.abs(d) < 0.5;
      frame.style.zIndex = p.z < 0 ? "1" : atFront ? "4" : "3";
      frame.classList.toggle("behind", p.z < -0.05);
      frame.classList.toggle("front", atFront);
      frame.style.visibility = seen < 0.02 ? "hidden" : "";
      frame.tabIndex = seen < 0.02 ? -1 : 0;

      const mark = marks[i];
      const my = p.y;
      const markSeen = Math.max(0, 1 - Math.abs(my - cy) / (H * 0.55)) * axisShown;
      mark.style.transform = "translate(" + (cx + 12).toFixed(1) + "px," + (my - 9).toFixed(1) + "px)";
      mark.style.opacity = markSeen.toFixed(3);
      mark.classList.toggle("is-on", atFront);
      mark.tabIndex = markSeen < 0.05 ? -1 : 0;
    });
    const now = Math.min(N - 1, Math.max(0, Math.round(pos)));
    if (now !== front) {
      front = now;
      navAt.textContent = String(now + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0");
      navName.textContent = nameOf(frames[now]);
      sheet.dataset.front = String(now + 1);
    }
  }

  // ============================================================
  // THE PARTICLES
  // ============================================================
  const axisSpecks = [];
  for (let n = 0; n < AXIS_SPECKS; n++) {
    axisSpecks.push({ y: random(), off: (random() - 0.5) * 5, size: 0.7 + random() * 1.4, lit: 0.25 + random() * 0.6 });
  }
  // THE DUST: a column of specks turning slowly round the axis, each at
  // its own height and reach, and turning with the helix as you travel —
  // which is what makes travelling read as the whole thing turning.
  const dust = [];
  for (let n = 0; n < DUST; n++) {
    dust.push({ a: random() * Math.PI * 2, y: random() * 2 - 1, r: 0.12 + 0.98 * Math.pow(random(), 0.7),
      size: 0.6 + random() * 1.3, lit: 0.3 + random() * 0.7 });
  }
  const flow = [];    // bright specks riding the strands
  for (let n = 0; n < 60; n++) flow.push({ u: random() * (N + 4) - 2, v: 0.06 + random() * 0.12, strand: n % 2 });
  const bursts = [];  // specks thrown out as a house arrives
  let px = -9999, py = -9999;

  const INK = getComputedStyle(document.body).getPropertyValue("--ink-rgb").trim() || "23, 23, 15";
  function speck(x, y, size, a) {
    if (a <= 0.01 || x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
    // Specks near the pointer are drawn plainer.
    const near = Math.max(0, 1 - Math.hypot(x - px, y - py) / 140);
    ink.globalAlpha = Math.min(1, a * (1 + near * 1.4));
    const s = size * (1 + near * 0.5);
    ink.fillRect(x - s / 2, y - s / 2, s, s);
  }

  function draw(now) {
    if (!ink || !W) return;
    const t = now / 1000;
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.clearRect(0, 0, W, H);
    ink.fillStyle = "rgb(" + INK + ")";

    // THE AXIS: drawn out from the middle as the page arrives.
    const reach = (H / 2 + 20) * axisShown;
    ink.globalAlpha = 0.45 * axisShown;
    ink.fillRect(cx - 0.5, cy - reach, 1, reach * 2);
    // Its ticks travel with you: one every quarter house, a long one at
    // each house.
    const quarter = span / 4;
    const lead = Math.ceil(reach / quarter) + 1;
    const base = Math.round(pos * 4);
    for (let k = base - lead; k <= base + lead; k++) {
      const y = cy + k * quarter - pos * span;
      if (Math.abs(y - cy) > reach) continue;
      const long = ((k % 4) + 4) % 4 === 0;
      ink.globalAlpha = (long ? 0.5 : 0.22) * axisShown;
      ink.fillRect(cx - (long ? 7 : 3.5), y, long ? 14 : 7, 1);
    }
    // Specks falling down it, always.
    for (const a of axisSpecks) {
      const y = ((a.y * H + (REDUCE_MOTION ? 0 : t * FALL * (0.6 + a.lit))) % H + H) % H;
      if (Math.abs(y - cy) > reach) continue;
      const bright = 1 - Math.abs(y - cy) / (H * 0.7);
      speck(cx + a.off, y, a.size, a.lit * (0.25 + bright) * 0.85 * axisShown);
    }

    // THE DUST, behind and in front of the axis alike.
    const many = W < 700 ? Math.round(DUST * 0.45) : DUST;
    const band = H * 1.4;
    for (let n = 0; n < many; n++) {
      const d = dust[n];
      const a = d.a + (REDUCE_MOTION ? 0 : t * DUST_SPIN) + pos * TURN * 0.5;
      const y = cy + ((((d.y * band / 2 - pos * span * 0.6) % band) + band * 1.5) % band) - band / 2;
      const z = Math.cos(a);
      const depth = (z + 1) / 2;
      speck(cx + R * 1.1 * d.r * Math.sin(a), y, d.size * (0.6 + depth * 0.8), d.lit * (0.07 + 0.28 * depth) * axisShown);
    }

    // THE HELIX: two strands, one either side of the axis, winding
    // through where the houses stand.
    const from = pos - 3, to = pos + 3;
    for (let u = Math.floor(from / STRAND_STEP) * STRAND_STEP; u < to; u += STRAND_STEP) {
      const d = u - pos;
      for (let strand = 0; strand < 2; strand++) {
        const a = d * TURN + strand * Math.PI;
        const z = Math.cos(a);
        const x = cx + R * Math.sin(a);
        const y = cy + d * span;
        const depth = (z + 1) / 2;
        const fade = Math.max(0, 1 - Math.abs(d) / 2.6);
        speck(x, y, 0.9 + depth * 1.6, (0.16 + 0.62 * depth) * fade * axisShown * (strand ? 0.6 : 1));
      }
    }
    // Bright specks travelling along the strands.
    for (const f of flow) {
      if (!REDUCE_MOTION) f.u += f.v * 0.016;
      if (f.u > N + 2) f.u = -2;
      const d = f.u - pos;
      if (Math.abs(d) > 2.6) continue;
      const a = d * TURN + f.strand * Math.PI;
      const z = Math.cos(a);
      speck(cx + R * Math.sin(a), cy + d * span, 1.6 + z, (0.35 + 0.5 * (z + 1) / 2) * (1 - Math.abs(d) / 2.6) * axisShown);
    }

    // THE TETHERS: from the axis to every house, a line of specks with
    // a pulse running outward along it.
    frames.forEach((frame, i) => {
      const d = i - pos;
      if (Math.abs(d) > 2.6 || !shown[i]) return;
      const p = spot(d);
      const x1 = cx + (p.x - cx) * shown[i];
      const fade = Math.max(0, 1 - Math.abs(d) / 2.6) * shown[i];
      const pulse = REDUCE_MOTION ? -1 : (t * 0.8 + i * 0.17) % 1;
      for (let k = 0; k <= TETHER_SPECKS; k++) {
        const q = k / TETHER_SPECKS;
        const hot = pulse >= 0 ? Math.max(0, 1 - Math.abs(q - pulse) * 9) : 0;
        speck(cx + (x1 - cx) * q, p.y, 1.1 + hot * 1.6, (0.22 + 0.35 * (p.z + 1) / 2 + hot * 0.5) * fade);
      }
    });

    // THE HALO, turning round the front house.
    const f = Math.round(pos);
    if (Math.abs(f - pos) < 0.35 && shown[f] > 0.5) {
      const settle = (1 - Math.abs(f - pos) / 0.35) * shown[f];
      const rx = frontW * 0.5 + 34, ry = frontH * 0.5 + 44;
      for (let k = 0; k < HALO_SPECKS; k++) {
        const a = (k / HALO_SPECKS) * Math.PI * 2 + (REDUCE_MOTION ? 0 : t * 0.35);
        const wob = 1 + 0.03 * Math.sin(a * 5 + t * 1.3);
        speck(cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob, k % 8 === 0 ? 2.4 : 1.3, (k % 8 === 0 ? 0.75 : 0.42) * settle);
      }
    }

    // THE BURSTS, from houses arriving.
    for (let k = bursts.length - 1; k >= 0; k--) {
      const b = bursts[k];
      const age = (now - b.at) / 1000;
      if (age > b.life) { bursts.splice(k, 1); continue; }
      const q = age / b.life;
      const e = 1 - Math.pow(1 - q, 3);
      speck(b.x + b.dx * e, b.y + b.dy * e, b.size, (1 - q) * 0.7);
    }
    ink.globalAlpha = 1;
  }

  // ============================================================
  // RUNNING — while the Houses view is on the page
  // ============================================================
  let last = 0, snapAt = 0, looping = false;
  function loop(now) {
    if (!sheet.offsetParent) { looping = false; return; }   // the other view is showing
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (snapAt && now > snapAt && !dragging) {
      snapAt = 0;
      target = Math.round(target);
    }
    if (REDUCE_MOTION) pos = target;
    else pos += (target - pos) * (1 - Math.exp(-dt * EASE));
    if (Math.abs(target - pos) < 0.0005) pos = target;
    place();
    draw(now);
    if (REDUCE_MOTION && pos === target && !snapAt && !bursts.length) { looping = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() {
    if (looping) return;
    looping = true;
    last = 0;
    requestAnimationFrame(loop);
  }
  // Coming back to the Houses view from the other one.
  new MutationObserver(wake).observe(sheet.closest(".view") || sheet, { attributes: true, attributeFilter: ["hidden", "class"] });

  /** Travel to house `i`, the nearest end if it is off either end. */
  function go(i) {
    target = Math.max(0, Math.min(N - 1, i));
    snapAt = 0;
    wake();
  }

  // ============================================================
  // TRAVELLING
  // ============================================================
  // THE WHEEL: along the helix, not down the page.
  sheet.addEventListener("wheel", (e) => {
    if (!sheet.classList.contains("drawn")) return;
    e.preventDefault();
    const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? H : 1;
    target = Math.max(-0.35, Math.min(N - 1 + 0.35, target + dy * scale * WHEEL));
    snapAt = performance.now() + SNAP_MS;
    wake();
  }, { passive: false });

  // DRAGGING, with a finger or the mouse: the helix follows the hand.
  let dragging = false, dragFrom = 0, dragTarget = 0, dragged = false, dragId = null;
  sheet.addEventListener("pointerdown", (e) => {
    if (!sheet.classList.contains("drawn") || e.button !== 0) return;
    if (e.target.closest(".sheet-nav, .sheet-axis-no")) return;
    dragging = true;
    dragged = false;
    dragFrom = e.clientY;
    dragTarget = target;
    dragId = e.pointerId;
  });
  window.addEventListener("pointermove", (e) => {
    px = e.clientX - (sheet.getBoundingClientRect().left);
    py = e.clientY - (sheet.getBoundingClientRect().top);
    if (!dragging || e.pointerId !== dragId) return;
    const dy = e.clientY - dragFrom;
    if (Math.abs(dy) > 6) dragged = true;
    if (!dragged) return;
    target = Math.max(-0.35, Math.min(N - 1 + 0.35, dragTarget - dy / span));
    wake();
  }, { passive: true });
  const letGo = (e) => {
    if (!dragging || (e && e.pointerId !== dragId)) return;
    dragging = false;
    if (dragged) { snapAt = performance.now(); wake(); }
  };
  window.addEventListener("pointerup", letGo);
  window.addEventListener("pointercancel", letGo);

  // THE KEYS, while nothing that takes typing has them.
  document.addEventListener("keydown", (e) => {
    if (!sheet.offsetParent || !sheet.classList.contains("drawn")) return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (document.body.classList.contains("menu-open")) return;
    const at = Math.round(target);
    let to = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") to = at + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") to = at - 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = N - 1;
    if (to === null) return;
    e.preventDefault();
    go(to);
  });

  // ============================================================
  // THE ARRIVAL — the axis drawn out, and the houses coming out of it
  // ============================================================
  function arrive() {
    sheet.classList.add("settled");
    if (REDUCE_MOTION) {
      frames.forEach((frame) => frame.classList.add("landed"));
      finish();
      wake();
      return;
    }
    const t0 = performance.now();
    // Nearest the front first.
    const order = frames.map((_, i) => i).sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
    const startOf = (i) => AXIS_MS * 0.55 + order.indexOf(i) * EMERGE_STEP;
    const burst = (i) => {
      const p = spot(i - pos);
      for (let k = 0; k < 26; k++) {
        const a = random() * Math.PI * 2, far = 30 + random() * 90;
        bursts.push({ x: cx, y: p.y, dx: (p.x - cx) * 0.8 + Math.cos(a) * far, dy: Math.sin(a) * far * 0.7,
          size: 1 + random() * 1.6, at: performance.now(), life: 0.7 + random() * 0.6 });
      }
    };
    const burstDone = frames.map(() => false);
    const step = (now) => {
      const t = now - t0;
      axisShown = Math.min(1, t / AXIS_MS);
      axisShown = 1 - Math.pow(1 - axisShown, 3);
      let all = true;
      frames.forEach((frame, i) => {
        const q = Math.max(0, Math.min(1, (t - startOf(i)) / EMERGE_MS));
        if (q > 0 && !burstDone[i]) { burstDone[i] = true; burst(i); frame.classList.add("landed"); }
        shown[i] = 1 - Math.pow(1 - q, 3);
        if (q < 1) all = false;
      });
      if (!all || t < AXIS_MS) { requestAnimationFrame(step); return; }
      finish();
    };
    requestAnimationFrame(step);
    wake();
  }
  function finish() {
    axisShown = 1;
    shown.fill(1);
    sheet.classList.add("drawn");
    document.body.classList.add("sheet-named");
    wake();
  }

  // ============================================================
  // RESTING ON A HOUSE
  // ============================================================
  let waiting = null;
  let resting = null;
  function rest(frame) {
    if (resting === frame) return;
    if (resting) resting.classList.remove("hot");
    resting = frame;
    frame.classList.add("hot");
    sheet.classList.add("musing");
    // THE WHOLE PAGE, not round the house: the motifs are handed no
    // house to keep clear of, and they stand BEHIND the houses (the
    // stylesheet puts their canvas under everything) — so they read as
    // the page itself answering, rather than as something hovering over
    // it. Nothing else on the page is blurred or dimmed while they come.
    // The houses that can be seen are handed over all the same, so that
    // anything WRITTEN — Tombstone's names — is kept off them.
    const around = frames.filter((f) => f.style.visibility !== "hidden" && parseFloat(f.style.getPropertyValue("--shown") || "0") > 0.1)
      .map((f) => f.getBoundingClientRect());
    if (window.HouseMotifs) window.HouseMotifs.start(frame.dataset.motif, null, around);
  }
  function leave(frame) {
    clearTimeout(waiting);
    waiting = null;
    if (resting !== frame) return;
    resting = null;
    frame.classList.remove("hot");
    sheet.classList.remove("musing");
    if (window.HouseMotifs) window.HouseMotifs.stop();
  }
  frames.forEach((frame, i) => {
    frame.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || dragging) return;
      clearTimeout(waiting);
      waiting = setTimeout(() => {
        waiting = null;
        if (!sheet.classList.contains("drawn") || sheet.classList.contains("searching")) return;
        if (document.body.classList.contains("sheet-leaving")) return;
        rest(frame);
      }, HOVER_WAIT_MS);
    });
    frame.addEventListener("pointerleave", () => leave(frame));
    // Tabbing to a house brings it to the front, and rests on it.
    frame.addEventListener("focus", () => {
      if (Math.round(target) !== i) go(i);
      clearTimeout(waiting);
      waiting = setTimeout(() => { waiting = null; if (sheet.classList.contains("drawn")) rest(frame); }, HOVER_WAIT_MS);
    });
    frame.addEventListener("blur", () => leave(frame));

    // PRESSING A HOUSE. A house not at the front is brought there; the
    // one at the front steps the page back and is opened. A press that
    // was the end of a drag is neither.
    frame.addEventListener("click", (e) => {
      if (dragged) { e.preventDefault(); dragged = false; return; }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (Math.round(pos) !== i || Math.abs(pos - i) > 0.2) {
        e.preventDefault();
        go(i);
        return;
      }
      if (REDUCE_MOTION) return;
      e.preventDefault();
      const href = frame.href;
      clearTimeout(waiting);
      frame.classList.add("chosen");
      document.body.classList.add("sheet-leaving");
      setTimeout(() => { window.location.href = href; }, LEAVE_MS);
    });
  });
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    document.body.classList.remove("sheet-leaving");
    frames.forEach((frame) => frame.classList.remove("chosen", "hot"));
    sheet.classList.remove("musing");
    resting = null;
    if (window.HouseMotifs) window.HouseMotifs.stop(true);
  });

  // ============================================================
  // SEARCH
  //
  // This page's own search looks over THIS CATEGORY: the houses and
  // every fragrance in them, which are both already in the page (the
  // fragrances view carries the lot). It is forgiving — "murkwod" finds
  // Murkwood — and it says WHERE each answer lives. A house it finds is
  // brought round to the front of the helix.
  //
  // What it cannot answer it hands to the site's own search page with
  // the question in the address.
  // ============================================================
  const search = document.querySelector(".sheet-search");
  if (search) {
    const fieldIn = search.querySelector(".sheet-search-field");
    const trigger = search.querySelector(".sheet-search-trigger");
    const found = document.createElement("div");
    found.className = "sheet-found";
    found.setAttribute("aria-live", "polite");
    search.appendChild(found);

    /** Everything this page can answer for, read off the page itself. */
    const mine = () => (window.SiteSearch
      ? window.SiteSearch.collect(document, window.location.href, ["Scent descriptions"])
      : []);
    let everything = null;

    const applySearch = () => {
      const term = fieldIn.value.trim();
      sheet.classList.toggle("searching", term.length > 0);
      if (!everything) everything = mine();

      const hits = term && window.SiteSearch
        ? window.SiteSearch.rank(term, everything, 6)
        : [];

      // The houses that do not answer step back, and the first one that
      // does is brought round to the front.
      let firstMatch = -1;
      frames.forEach((frame, i) => {
        const caption = frame.querySelector(".sheet-caption");
        const text = caption ? caption.textContent : "";
        const match = !term || (window.SiteSearch
          ? window.SiteSearch.score(term, text) > 0
          : text.toLowerCase().indexOf(term.toLowerCase()) >= 0);
        frame.classList.toggle("dimmed", Boolean(term) && !match);
        if (term && match && firstMatch < 0) firstMatch = i;
      });
      if (firstMatch >= 0) go(firstMatch);

      found.innerHTML = "";
      search.classList.toggle("has-found", hits.length > 0);
      hits.forEach((hit) => {
        const row = document.createElement("a");
        row.className = "sheet-found-row";
        row.href = hit.entry.href;
        const name = document.createElement("span");
        name.className = "sheet-found-what";
        name.textContent = hit.entry.name;
        const where = document.createElement("span");
        where.className = "sheet-found-where";
        where.textContent = hit.entry.where.join(" · ");
        row.append(name, where);
        found.appendChild(row);
      });
      if (term && !hits.length) {
        const none = document.createElement("p");
        none.className = "sheet-found-none";
        none.textContent = "Nothing here by that name — press enter to search the site.";
        found.appendChild(none);
        search.classList.add("has-found");
      }
    };

    trigger.addEventListener("click", () => {
      search.classList.toggle("open");
      if (search.classList.contains("open")) fieldIn.focus();
      else { fieldIn.value = ""; applySearch(); }
    });
    fieldIn.addEventListener("input", applySearch);
    fieldIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const first = found.querySelector(".sheet-found-row");
        if (first) { window.location.href = first.href; return; }
        const term = fieldIn.value.trim();
        if (term && window.SiteSearch) {
          window.location.href = window.SiteSearch.siteSearchHref(window.SITE_ROOT, term);
        }
        return;
      }
      if (e.key !== "Escape") return;
      fieldIn.value = "";
      applySearch();
      search.classList.remove("open");
      trigger.focus();
    });
  }

  // Laid out before the page is shown, so what the browser painted
  // before this — the no-script grid of every picture — is never seen;
  // and laid out again, never re-run, when the window changes. The
  // arrival waits for the page's faces, for at most FONTS_MS, so the
  // labels do not change size under houses already on their way out.
  const FONTS_MS = 1200;
  layout();
  document.documentElement.classList.remove("js-coming");
  window.addEventListener("resize", layout);
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    layout();
    arrive();
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
  setTimeout(start, FONTS_MS);
})();
