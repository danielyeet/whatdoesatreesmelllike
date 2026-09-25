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
//                 is joined to the axis by a SPOKE — a tube of particles
//                 standing in the helix's own space, turning with it.
//   THE FRONT     the house you are on: four corners of specks mark it,
//                 and pressing it opens the house. Pressing any other
//                 brings IT to the front. Its line about the house shows
//                 only while it is pointed at, as every house's does.
//   TRAVELLING    by the wheel, by dragging (a finger on a phone), by
//                 the arrow keys, by the numbers on the axis, and by the
//                 two buttons at the side with where you are between
//                 them — the owner's "navigatable".
//   THE ARRIVAL   one thing after another, at the owner's word: first the
//                 axis, drawn out from the middle to the top and the foot
//                 of the window; then the helix, winding out along it;
//                 and only then the houses, 01 first and the rest in
//                 order after it, quickly, each on a burst of specks.
//
// THE WHOLE WINDOW IS THE HOUSES' — the axis runs from its very top to
// its very foot, between the two buttons across the top, and a house
// turned away above or below goes off the window's own edge rather than
// being cut off partway across the white.
//
// RESTING ON A HOUSE still brings its motifs over the page (motifs.js),
// and PRESSING the front one still steps the page back and opens it.
// Specks the pointer passes over stay lit for a moment after it has
// gone, and only then go out.
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
  const SMALLEST = 0.4;            // the scale of a house right behind the axis
  const SIDE_FALL = 2.6;           // how quickly a house shrinks as it turns away:
                                   // at 2.6, the ones either side are two thirds of the front
  // AND FADES as it turns away: the front house — the one the page rests
  // on — whole, the ones either side at about two thirds, the ones beyond
  // at under a third. "fade and make smaller the non-selected house (not
  // hovered, but the one on which the page rests)" (2026-09-25, night);
  // they were three quarters the size and four fifths as strong.
  const SIDE_FADE = 0.25;          // how faint a house right behind the axis is
  const SIDE_FADE_FALL = 1.8;

  // TRAVELLING. The wheel moves the helix by a fraction of a house per
  // pixel; it comes to rest on the nearest house once the wheel stops.
  const WHEEL = 1 / 320;           // houses per pixel of wheel
  const SNAP_MS = 170;             // how long after the last movement it settles
  const EASE = 7.5;                // how quickly it follows where it is sent

  // THE ARRIVAL, one thing after another: "first the central line, then
  // the spiral of particles and only then the images ... chronologically
  // yet relatively quickly". It used to bring the houses out while the
  // axis was still being drawn, and the helix with the axis.
  const AXIS_MS = 700;             // the axis drawn out from the middle to both ends
  const HELIX_MS = 900;            // then the helix winding out along it
  const EMERGE_MS = 560;           // then a house coming out of the axis
  const EMERGE_STEP = 85;          // and the next, in order, 01 first

  // THE PARTICLES
  const FALL = 46;                 // px a second down the axis
  const AXIS_SPECKS = 460;
  // THE AXIS IS THE SPINE of the whole drawing, drawn as one: a faint
  // column of light either side of it, a line, and now and then a pulse
  // running down it. It was made heavier at the owner's word (2026-09-24)
  // and then QUIETER at it (2026-09-25, night: "de emphasize the black
  // line in the middle ... especially with the shadow around it"): the
  // line thinner and half as dark, the light either side a third as
  // strong and narrower, the pulses and the specks falling down it softer.
  const AXIS_GLOW = 12;            // px either side of the line
  const AXIS_GLOW_LIT = 0.035;     // how strong that light is at the line
  const AXIS_LINE = 1.2;           // px, the line
  const AXIS_LINE_LIT = 0.55;      // and how dark
  const AXIS_PULSES = 3;           // running down it at once
  const PULSE_SPEED = 150;         // px a second
  const PULSE_LEN = 90;            // px, the pulse's tail
  const PULSE_LIT = 0.35;
  const STRAND_STEP = 0.022;       // houses between strand specks
  // THE SPOKES from the axis to every house, since the night of 2026-09-25
  // — "connect the fragrances to the spiral in a 3d way, so that the
  // conenctions of the fragrances to the central line will move in a 3rd
  // dimension along with the fragrances ... make the connecting line
  // particular": each is a loose tube of particles standing in the
  // helix's own space, from the axis out to where its house stands, so it
  // turns with the house as the helix turns — nearer specks larger and
  // stronger, the half behind the axis drawn behind it — the particles
  // flowing outward along it and the tube twisting slowly about itself.
  const SPOKE_PARTS = 130;         // particles to a spoke
  const SPOKE_WIDTH = 5;           // px, the tube's reach either side of its line
  const SPOKE_TWIST = 0.25;        // radians a second the tube turns about itself
  const DUST = 520;                // specks turning round the axis (fewer on a phone)
  const DUST_SPIN = 0.07;          // radians a second
  // THE CORNERS: four brackets of specks standing just outside the front
  // house and its label, as a registration mark stands outside what it
  // registers. They replaced a ring of specks turning round the house,
  // which ran under the picture's corners and was mostly hidden by it.
  const CORNER_LEG = 26;           // px each arm reaches
  const CORNER_STEP = 3.2;         // px between its specks
  const CORNER_OUT = 16;           // px outside the picture and its label

  // THE HAND'S AFTERGLOW: specks the pointer has passed over stay lit a
  // moment after it has gone, and only then go out — the owner asked for
  // "a delay of the particles turning off after you hover them". They
  // used to go out the instant the pointer left them.
  const HAND_REACH = 140;          // px, how far round the pointer specks are lit
  const GLOW_HOLD = 0.45;          // s they stay at full once it has gone
  const GLOW_FADE = 1.1;           // s they then take to go out

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
      '<span aria-hidden="true">&#8595;</span></button>' +
    // AND THE WAY OVER to the fragrances — views.js takes anything carrying
    // `data-view-go`; the Fragrances view carries its twin back.
    '<button type="button" class="sheet-to-fragrances" data-view-go="fragrances">' +
      'The fragrances <span aria-hidden="true">&#8594;</span></button>';
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
  // THE ROOM the helix is laid out in: the window below the chrome, as it
  // always was, so the front house stands exactly where it did.
  let roomTop = 0, room = 0;
  function layout() {
    // THE HOUSES HAVE THE WHOLE WINDOW, top to bottom. The owner asked
    // for the axis to go "all the way up" and "all the way down", and for
    // a house turned away above or below not to "disappear midway through
    // the white" — which it did, cut off by the edge of a sheet that
    // began under the chrome and ended short of the foot. So the sheet is
    // pulled up to the window's top edge (a negative margin as tall as
    // the room the chrome takes) and runs to its foot; everything drawn
    // and everything clipped reaches the window's own edges; and the
    // helix itself is still laid out in the room below the chrome. The
    // page still does not scroll: it is exactly the window.
    sheet.style.marginTop = "";
    roomTop = sheet.getBoundingClientRect().top + window.scrollY;
    room = Math.max(420, Math.round(window.innerHeight - roomTop - 8));
    H = Math.round(roomTop + room + 8);
    sheet.style.marginTop = (-roomTop).toFixed(1) + "px";
    sheet.style.height = H + "px";
    // The way round stands at the middle of the room, where it stood.
    sheet.style.setProperty("--room-middle", (roomTop + room / 2).toFixed(1) + "px");
    W = sheet.clientWidth;
    cx = W / 2;
    cy = roomTop + room * 0.47;
    span = room * (W < NARROW ? SPAN_NARROW : SPAN);
    R = Math.min(W * RADIUS, RADIUS_MOST);
    frontH = Math.max(FRONT_FEWEST, Math.min(FRONT_MOST, room * FRONT, (W - 40) / SHAPE * 0.72));
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
  // THE FIELD ADAR'S WELLS MAKE (motifs.js), read once a frame in draw():
  // null while there are none, and otherwise where each point is drawn.
  let bend = null;
  const shown = frames.map(() => (REDUCE_MOTION ? 1 : 0));   // each house's arrival, 0 to 1
  let axisShown = REDUCE_MOTION ? 1 : 0;
  let helixShown = REDUCE_MOTION ? 1 : 0;
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
      // Faint the further round it is — and NOT faded as it nears the top
      // or the foot: it goes off the window's own edge. It used to fade
      // from partway down and was then cut off by the sheet's edge, under
      // the chrome, which is what "disappearing midway through the white"
      // was. Only once it is wholly off the window is it let go of.
      const half = frontH * s / 2 + 30;   // and its label under it
      const gone = p.y + half < 0 || p.y - half > H;
      let seen = gone ? 0 : come * (SIDE_FADE + (1 - SIDE_FADE) * Math.pow((p.z + 1) / 2, SIDE_FADE_FALL));
      // DRAWN IN BY ADAR'S WELLS (motifs.js): leaning towards the hole,
      // turned round it and shrunk — gently, a house being a house, and
      // never the one being rested on, which is under the pointer.
      let fx = x, fy = p.y, fs = s, fr = 0;
      if (bend && !frame.classList.contains("hot")) {
        const w = bend(x, p.y);
        fx = x + (w.x - x) * 0.7; fy = p.y + (w.y - p.y) * 0.7;
        fs = s * Math.max(0.5, 1 - (1 - w.s) * 0.7);
        fr = w.turn * 0.5;
        seen *= 0.35 + 0.65 * w.a;
      }
      frame.style.transform = "translate(" + (fx - frontW / 2).toFixed(1) + "px," +
        (fy - frontH / 2).toFixed(1) + "px) scale(" + fs.toFixed(4) + ")" + (fr ? " rotate(" + (fr * 57.3).toFixed(2) + "deg)" : "");
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
      let markSeen = Math.max(0, 1 - Math.abs(my - cy) / (room * 0.55)) * axisShown;
      let mx = cx + 12, mY = my - 9;
      if (bend) {
        const w = bend(cx + 20, my);
        mx += w.x - (cx + 20); mY += w.y - my;
        markSeen *= w.a;
      }
      mark.style.transform = "translate(" + mx.toFixed(1) + "px," + mY.toFixed(1) + "px)";
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
    // Gathered on the line and thinning away from it.
    axisSpecks.push({ y: random(), off: (random() + random() + random() - 1.5) * 7, size: 0.7 + random() * 1.5, lit: 0.3 + random() * 0.6 });
  }
  // THE DUST: a column of specks turning slowly round the axis, each at
  // its own height and reach, and turning with the helix as you travel —
  // which is what makes travelling read as the whole thing turning.
  const dust = [];
  for (let n = 0; n < DUST; n++) {
    dust.push({ a: random() * Math.PI * 2, y: random() * 2 - 1, r: 0.12 + 0.98 * Math.pow(random(), 0.7),
      size: 0.6 + random() * 1.3, lit: 0.3 + random() * 0.7 });
  }
  const spokes = frames.map(() => Array.from({ length: SPOKE_PARTS }, () => ({
    q: random(), r: Math.pow(random(), 0.6) * SPOKE_WIDTH, phi: random() * Math.PI * 2,
    v: 0.04 + random() * 0.09, size: 0.7 + random() * 0.9, lit: 0.45 + random() * 0.55,
  })));
  const flow = [];    // bright specks riding the strands
  for (let n = 0; n < 60; n++) flow.push({ u: random() * (N + 4) - 2, v: 0.06 + random() * 0.12, strand: n % 2 });
  const bursts = [];  // specks thrown out as a house arrives
  let corners = null; // where the corners stand, eased
  let px = -9999, py = -9999;
  // WHERE THE POINTER HAS BEEN, for the afterglow: points along its way,
  // each with the moment it was last there. `lit` is the ones still
  // glowing this frame, each with how much.
  const trail = [];
  let lit = [];
  const glowOf = (age) => age <= GLOW_HOLD ? 1
    : Math.max(0, 1 - (age - GLOW_HOLD) / GLOW_FADE) ** 2;

  const INK = getComputedStyle(document.body).getPropertyValue("--ink-rgb").trim() || "23, 23, 15";
  function speck(x, y, size, a) {
    if (bend) {
      const w = bend(x, y);
      x = w.x; y = w.y; size *= w.s; a *= w.a;
    }
    if (a <= 0.01 || x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
    // Specks near the pointer are drawn plainer — and so, for a moment,
    // are the ones it has just passed over.
    let near = Math.max(0, 1 - Math.hypot(x - px, y - py) / HAND_REACH);
    for (let k = 0; k < lit.length; k++) {
      const p = lit[k];
      const dx = x - p.x, dy = y - p.y;
      if (dx > HAND_REACH || dx < -HAND_REACH || dy > HAND_REACH || dy < -HAND_REACH) continue;
      const here = (1 - Math.sqrt(dx * dx + dy * dy) / HAND_REACH) * p.glow;
      if (here > near) near = here;
    }
    ink.globalAlpha = Math.min(1, a * (1 + near * 1.4));
    const s = size * (1 + near * 0.5);
    ink.fillRect(x - s / 2, y - s / 2, s, s);
  }

  /** THE SPOKES — see SPOKE_* above. Drawn in two passes, so the half of
      each that stands behind the axis is drawn behind it: `behind` says
      which half this pass draws. A house arriving comes out along its
      spoke, the spoke growing with it. */
  function spokesPass(t, behind) {
    frames.forEach((frame, i) => {
      const d = i - pos;
      if (Math.abs(d) > 2.6 || !shown[i]) return;
      const a = d * TURN, sa = Math.sin(a), ca = Math.cos(a);
      const y0 = cy + d * span;
      const reach = R * shown[i];
      const fade = Math.pow(Math.max(0, 1 - Math.abs(d) / 2.6), 0.7) * shown[i] * helixShown;
      const pulse = REDUCE_MOTION ? -1 : (t * 0.8 + i * 0.17) % 1;
      const twist = REDUCE_MOTION ? 0 : t * SPOKE_TWIST;
      spokes[i].forEach((s) => {
        const q = REDUCE_MOTION ? s.q : (s.q + t * s.v) % 1;
        // Along the spoke in the helix's own space, then off it on a ring
        // round it — thin at the axis, fullest part way out.
        const rad = s.r * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, q * 1.15)));
        const phi = s.phi + twist;
        const z = q * reach * ca - rad * Math.sin(phi) * sa;
        if ((z < 0) !== behind) return;
        const x = cx + q * reach * sa + rad * Math.sin(phi) * ca;
        const y = y0 + rad * Math.cos(phi);
        const near = Math.max(0, Math.min(1, (z / R + 1) / 2));
        const hot = pulse >= 0 ? Math.max(0, 1 - Math.abs(q - pulse) * 9) : 0;
        speck(x, y, s.size * (0.7 + 1.0 * near) + hot * 1.2, (0.2 + 0.65 * near + hot * 0.35) * s.lit * fade);
      });
    });
  }

  function draw(now) {
    if (!ink || !W) return;
    const t = now / 1000;
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.clearRect(0, 0, W, H);
    ink.fillStyle = "rgb(" + INK + ")";
    bend = window.HouseMotifs && window.HouseMotifs.bend ? window.HouseMotifs.bend() : null;
    /** The axis from one height to another, as a line through the field. */
    const bentAxis = (from, to) => {
      ink.beginPath();
      for (let y = from, first = true; ; y = Math.min(to, y + 6), first = false) {
        const w = bend(cx, y);
        if (first) ink.moveTo(w.x, w.y); else ink.lineTo(w.x, w.y);
        if (y >= to) break;
      }
    };

    // Which of the places the pointer has passed are still glowing.
    const clock = now / 1000;
    while (trail.length && glowOf(clock - trail[0].at) <= 0) trail.shift();
    lit = REDUCE_MOTION ? [] : trail.map((p) => ({ x: p.x, y: p.y, glow: glowOf(clock - p.at) }));

    // THE AXIS, from the very top of the window to its very foot: drawn
    // out from the middle to both ends as the page arrives — its light,
    // its line, and the pulses running down it.
    const top = cy - (cy + 20) * axisShown;
    const foot = cy + (H - cy + 20) * axisShown;
    // The half of every spoke that stands behind the axis, before it.
    spokesPass(t, true);
    const glow = ink.createLinearGradient(cx - AXIS_GLOW, 0, cx + AXIS_GLOW, 0);
    glow.addColorStop(0, "rgba(" + INK + ", 0)");
    glow.addColorStop(0.5, "rgba(" + INK + ", " + AXIS_GLOW_LIT + ")");
    glow.addColorStop(1, "rgba(" + INK + ", 0)");
    ink.globalAlpha = axisShown;
    ink.fillStyle = glow;
    ink.fillRect(cx - AXIS_GLOW, top, AXIS_GLOW * 2, foot - top);
    if (!REDUCE_MOTION) {
      const lap = H + 40 + PULSE_LEN;
      for (let k = 0; k < AXIS_PULSES; k++) {
        const y = -20 + ((t * PULSE_SPEED + k * lap / AXIS_PULSES) % lap);
        const tail = ink.createLinearGradient(0, y - PULSE_LEN, 0, y);
        tail.addColorStop(0, "rgba(" + INK + ", 0)");
        tail.addColorStop(1, "rgba(" + INK + ", " + PULSE_LIT + ")");
        ink.fillStyle = tail;
        const from = Math.max(top, y - PULSE_LEN), to = Math.min(foot, y);
        if (to > from && bend) {
          ink.strokeStyle = tail; ink.lineWidth = 2;
          bentAxis(from, to); ink.stroke();
        } else if (to > from) ink.fillRect(cx - 1, from, 2, to - from);
      }
    }
    ink.fillStyle = "rgb(" + INK + ")";
    ink.globalAlpha = AXIS_LINE_LIT * axisShown;
    if (bend) {
      ink.strokeStyle = "rgb(" + INK + ")"; ink.lineWidth = AXIS_LINE;
      bentAxis(top, foot); ink.stroke();
    } else ink.fillRect(cx - AXIS_LINE / 2, top, AXIS_LINE, foot - top);
    // Its ticks travel with you: one every quarter house, a long one at
    // each house.
    const quarter = span / 4;
    const shift = pos * span;
    for (let k = Math.ceil((top - cy + shift) / quarter); k <= Math.floor((foot - cy + shift) / quarter); k++) {
      const y = cy + k * quarter - shift;
      const long = ((k % 4) + 4) % 4 === 0;
      ink.globalAlpha = (long ? 0.7 : 0.34) * axisShown;
      if (bend) {
        const w = bend(cx, y), half = (long ? 9 : 4.5) * w.s;
        ink.globalAlpha *= w.a;
        ink.fillRect(w.x - half, w.y, half * 2, 1);
      } else ink.fillRect(cx - (long ? 9 : 4.5), y, long ? 18 : 9, 1);
    }
    // Specks falling down it, always.
    for (const a of axisSpecks) {
      const y = ((a.y * H + (REDUCE_MOTION ? 0 : t * FALL * (0.6 + a.lit))) % H + H) % H;
      if (y < top || y > foot) continue;
      const bright = 1 - Math.abs(y - cy) / (H * 0.7);
      speck(cx + a.off, y, a.size, a.lit * (0.25 + bright) * 0.55 * axisShown);
    }

    // THE HELIX comes second, once the axis is drawn: its strands wind
    // out along the axis from the middle, up and down at once, the dust
    // gathering round it as they go (`helixShown`).
    const wound = helixShown * 3;

    // THE DUST, behind and in front of the axis alike.
    const many = W < 700 ? Math.round(DUST * 0.45) : DUST;
    const column = H * 1.4;
    for (let n = 0; n < many; n++) {
      const d = dust[n];
      const a = d.a + (REDUCE_MOTION ? 0 : t * DUST_SPIN) + pos * TURN * 0.5;
      const y = cy + ((((d.y * column / 2 - pos * span * 0.6) % column) + column * 1.5) % column) - column / 2;
      const z = Math.cos(a);
      const depth = (z + 1) / 2;
      speck(cx + R * 1.1 * d.r * Math.sin(a), y, d.size * (0.6 + depth * 0.8), d.lit * (0.07 + 0.28 * depth) * helixShown);
    }

    // THE HELIX: two strands, one either side of the axis, winding
    // through where the houses stand.
    const from = pos - Math.min(3, wound), to = pos + Math.min(3, wound);
    for (let u = Math.floor(from / STRAND_STEP) * STRAND_STEP; u < to; u += STRAND_STEP) {
      const d = u - pos;
      // The growing ends are drawn brighter, so the strands are seen to
      // wind out rather than simply fade up.
      const tip = helixShown < 1 ? Math.max(0, 1 - (wound - Math.abs(d)) * 4) : 0;
      for (let strand = 0; strand < 2; strand++) {
        const a = d * TURN + strand * Math.PI;
        const z = Math.cos(a);
        const x = cx + R * Math.sin(a);
        const y = cy + d * span;
        const depth = (z + 1) / 2;
        const fade = Math.max(0, 1 - Math.abs(d) / 2.6);
        // A little stronger since the night of 2026-09-25 — "slightly
        // emphasizing the spiral line guiding the houses".
        speck(x, y, 1.1 + depth * 1.8 + tip * 1.4, ((0.22 + 0.72 * depth) * fade + tip * 0.5) * (strand ? 0.7 : 1));
      }
    }
    // Bright specks travelling along the strands.
    for (const f of flow) {
      if (!REDUCE_MOTION) f.u += f.v * 0.016;
      if (f.u > N + 2) f.u = -2;
      const d = f.u - pos;
      if (Math.abs(d) > 2.6 || Math.abs(d) > wound) continue;
      const a = d * TURN + f.strand * Math.PI;
      const z = Math.cos(a);
      speck(cx + R * Math.sin(a), cy + d * span, 1.6 + z, (0.35 + 0.5 * (z + 1) / 2) * (1 - Math.abs(d) / 2.6) * helixShown);
    }

    // THE SPOKES, the half of each standing in front of the axis.
    spokesPass(t, false);

    // THE CORNERS, round the front house and its label. Where they stand
    // is read off the page (the label grows a line when the house is
    // rested on) and eased, so they follow rather than jump.
    const f = Math.round(pos);
    if (Math.abs(f - pos) < 0.35 && shown[f] > 0.5) {
      const settle = (1 - Math.abs(f - pos) / 0.35) * shown[f];
      const fr = frames[f];
      const at = ink.canvas.getBoundingClientRect();
      let l = Infinity, tp = Infinity, r = -Infinity, b = -Infinity;
      for (const el of [fr, fr.querySelector(".sheet-caption"), fr.querySelector(".sheet-number")]) {
        const q = el && el.getBoundingClientRect();
        if (!q || !q.width) continue;
        l = Math.min(l, q.left); tp = Math.min(tp, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      }
      const want = { l: l - at.left, t: tp - at.top, r: r - at.left, b: b - at.top };
      if (!corners || corners.f !== f || REDUCE_MOTION) corners = { f, ...want };
      else for (const k of ["l", "t", "r", "b"]) corners[k] += (want[k] - corners[k]) * 0.18;
      const out = CORNER_OUT + (REDUCE_MOTION ? 0 : Math.sin(t * 1.4) * 2);
      const grow = 1 - Math.pow(1 - settle, 3);
      [[corners.l - out, corners.t - out, 1, 1], [corners.r + out, corners.t - out, -1, 1],
        [corners.l - out, corners.b + out, 1, -1], [corners.r + out, corners.b + out, -1, -1]]
        .forEach(([x, y, sx, sy], k) => {
          // A light runs out along both arms, each corner on its own beat.
          const run = REDUCE_MOTION ? -1 : (t * 0.55 + k * 0.25) % 1;
          speck(x, y, 2.6, 0.85 * settle);
          for (let d = CORNER_STEP; d <= CORNER_LEG * grow; d += CORNER_STEP) {
            const q = d / CORNER_LEG;
            const hot = run >= 0 ? Math.max(0, 1 - Math.abs(q - run) * 6) : 0;
            const a = (0.78 - 0.34 * q + hot * 0.3) * settle;
            speck(x + sx * d, y, 1.4 + hot, a);
            speck(x, y + sy * d, 1.4 + hot, a);
          }
        });
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
  /** Leave where the pointer was on its trail, to go on glowing a
      moment after it has moved on. Points are kept a little apart, and
      one the pointer is still standing on is simply kept fresh. */
  function mark(x, y) {
    if (REDUCE_MOTION || x < -999) return;
    const at = performance.now() / 1000;
    const last = trail[trail.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < 14) { last.x = x; last.y = y; last.at = at; return; }
    trail.push({ x: x, y: y, at: at });
    if (trail.length > 160) trail.shift();
  }
  window.addEventListener("pointermove", (e) => {
    const box = sheet.getBoundingClientRect();
    mark(px, py);
    px = e.clientX - box.left;
    py = e.clientY - box.top;
    mark(px, py);
    if (!dragging || e.pointerId !== dragId) return;
    const dy = e.clientY - dragFrom;
    if (Math.abs(dy) > 6) dragged = true;
    if (!dragged) return;
    target = Math.max(-0.35, Math.min(N - 1 + 0.35, dragTarget - dy / span));
    wake();
  }, { passive: true });
  // The pointer leaving the window leaves its glow behind it, going out.
  document.addEventListener("pointerleave", () => { mark(px, py); px = -9999; py = -9999; wake(); });
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
    // First the axis, then the helix, and only then the houses — in
    // order, 01 first, which is also the one at the front.
    const startOf = (i) => AXIS_MS + HELIX_MS + i * EMERGE_STEP;
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
      axisShown = 1 - Math.pow(1 - Math.min(1, t / AXIS_MS), 3);
      helixShown = 1 - Math.pow(1 - Math.max(0, Math.min(1, (t - AXIS_MS) / HELIX_MS)), 2);
      let all = true;
      frames.forEach((frame, i) => {
        const q = Math.max(0, Math.min(1, (t - startOf(i)) / EMERGE_MS));
        if (q > 0 && !burstDone[i]) { burstDone[i] = true; burst(i); frame.classList.add("landed"); }
        shown[i] = 1 - Math.pow(1 - q, 3);
        if (q < 1) all = false;
      });
      if (!all || t < AXIS_MS + HELIX_MS) { requestAnimationFrame(step); return; }
      finish();
    };
    requestAnimationFrame(step);
    wake();
  }
  function finish() {
    axisShown = 1;
    helixShown = 1;
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
    // Each house with its label under it, which stands outside the
    // picture's own box.
    const around = frames.filter((f) => f.style.visibility !== "hidden" && parseFloat(f.style.getPropertyValue("--shown") || "0") > 0.1)
      .map((f) => [f, f.querySelector(".sheet-caption"), f.querySelector(".sheet-number")].filter(Boolean)
        .map((el) => el.getBoundingClientRect())
        .reduce((u, r) => ({ left: Math.min(u.left, r.left), right: Math.max(u.right, r.right),
          top: Math.min(u.top, r.top), bottom: Math.max(u.bottom, r.bottom) })));
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
