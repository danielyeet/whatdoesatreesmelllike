// ============================================================
// THE SURVEY (categories/theories.html only)
//
// The theories are not a list on this page. They are a piece of
// country: an island, contoured, seen from the air at an angle,
// with one hill for every theory and its name written on the
// summit. Turning it, tilting it and coming down closer to it is
// how you read it.
//
// Nothing about the ground is drawn by hand. It is grown:
//
//   1. a seeded noise field gives rolling country                (ground)
//   2. every theory in the page adds its own hill to it          (hills)
//   3. the whole thing is pulled down to sea level at the edge, so
//      what is left is an island rather than a square of terrain
//   4. the ground is sampled onto a grid once                    (SAMPLES)
//   5. contours are traced through that grid, once, in map
//      coordinates — they do not depend on where you are standing
//   6. every frame, those contours are put through a camera
//
// Only the last of those happens more than once, which is what
// makes this cheap enough to turn smoothly: the map is worked out
// at load and only ever re-photographed.
//
// Add a theory to the page and the country changes shape around
// it — a new hill rises, the contours re-form round it and the
// coastline moves. There is nothing to hand-place.
//
// WITHOUT THIS FILE the page is the plain list of rows every other
// category uses. The script puts `surveyed` on <body> and takes
// over; every rule that hides the list is written under that
// class, so the fallback cannot inherit it.
// ============================================================
(function () {
  const page = document.querySelector(".theories-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const rows = Array.from(list.querySelectorAll(".work-row"));
  if (!rows.length) return;   // nothing to survey

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // Everything that can be dialled lives here. The two that change
  // the character of the country most are RELIEF (how tall the land
  // is against how wide) and LEVELS (how finely it is contoured).
  // ============================================================
  const SEED = 11;             // the same country on every visit

  const GRID = 150;            // how finely the ground is sampled, per side
  const LEVELS = 18;           // contour lines between the shore and the summit
  const INDEX_EVERY = 5;       // every fifth one is drawn heavier and numbered
  const SHORE = 0.17;          // the height the water comes up to, 0–1
  const SUMMIT_M = 1480;       // what the highest ground is called, in metres

  const RELIEF = 0.62;         // height against width — how steep the country reads
  const HILL_HEIGHT = 0.55;    // how much of that a theory's own hill accounts for
  const HILL_SPREAD = 0.39;    // and how far its skirts reach

  // Where you are standing. TILT is the angle above the ground: 90°
  // would be straight down onto a plan, 0° would be sea level.
  const TILT = 33, TILT_MIN = 12, TILT_MAX = 76;
  const AWAY = 3.1, AWAY_MIN = 1.75, AWAY_MAX = 5.6;
  const TURN_BY = 0.0062;      // radians per pixel of hand movement
  const TILT_BY = 0.0042;
  const ZOOM_BY = 0.0016;
  const DRIFT = 0.028;         // radians a second when nothing is touching it
  const EASE = 0.11;           // how quickly the camera catches up with where it is going

  const FRAME_MS = 16;         // it is redrawn at most this often
  const SPOT_HEIGHTS = 26;     // scattered heights printed on the open ground

  // The shore as a height in the drawing rather than in the country:
  // every z handed to the camera is scaled by RELIEF, and the water
  // has to be scaled with it or the island floats above its own sea.
  const WATER = SHORE * RELIEF;

  const INK = "23,23,15";
  const MUTED = "109,108,98";
  const BRASS = "156,111,53";

  // ============================================================
  // A SEEDED COUNTRY
  //
  // Both the noise and the scatter come from the seed, so the
  // island is the same island every time the page is opened — a map
  // that redrew itself on each visit would read as a fault rather
  // than as a place.
  // ============================================================
  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  /** One fixed number per lattice point, with no table to store. */
  function corner(ix, iy) {
    let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(SEED, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  const soften = (t) => t * t * (3 - 2 * t);

  /** Value noise: the lattice, softened between its corners. */
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = soften(x - ix), fy = soften(y - iy);
    const a = corner(ix, iy), b = corner(ix + 1, iy);
    const c = corner(ix, iy + 1), d = corner(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  // Where each theory's hill stands. A golden-angle spiral, so they
  // spread evenly however many there are rather than bunching into a
  // ring, nudged off it so the arrangement doesn't read as a formula.
  const hills = rows.map((row, i) => {
    const title = row.querySelector(".work-row-title");
    const meta = row.querySelector(".work-row-meta");
    const turn = i * 2.399963;                       // the golden angle, in radians
    const out = 0.22 + 0.52 * Math.sqrt((i + 0.6) / rows.length);
    return {
      row: row,
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      href: row.getAttribute("href"),
      x: Math.cos(turn) * out + (random() - 0.5) * 0.1,
      y: Math.sin(turn) * out + (random() - 0.5) * 0.1,
      // Not all the same size: a country of identical hills reads as
      // a pattern, and the point of a survey is that the ground is
      // uneven.
      height: HILL_HEIGHT * (0.62 + random() * 0.62),
      spread: HILL_SPREAD * (0.72 + random() * 0.5),
    };
  });

  /** The height of the ground at a point, before it is normalised. */
  function ground(x, y) {
    let height = 0, amp = 1, freq = 1.55, total = 0;
    for (let octave = 0; octave < 5; octave++) {
      height += noise(x * freq + octave * 31.7, y * freq - octave * 17.3) * amp;
      total += amp;
      // Each octave is a little over half the one before rather than
      // exactly half, so the fine detail is not quite swamped by the
      // broad shape: it is the fine detail that makes a contour wander
      // rather than run as a smooth oval.
      amp *= 0.57;
      freq *= 2.03;
    }
    height /= total;

    // Pulled down to the water at the edge, so what is left is an
    // island with a shore rather than a square cut out of a country.
    // Steeply, and only near the rim: a gentler falloff pulls the
    // whole interior into one dome, and the contours come out as a set
    // of onion rings with the country's own shape lost inside them.
    const out = Math.hypot(x, y);
    height *= Math.max(0, 1 - Math.pow(Math.min(1, out / 1.1), 4.2));

    // And every theory is a hill standing on it, with the ground
    // dished a little where its skirts run out. The dish is what puts
    // saddles and hollows between one hill and the next: without it
    // they merge into a single ridge and the country loses the shape
    // that says how many theories are standing in it.
    for (let i = 0; i < hills.length; i++) {
      const hill = hills[i];
      const dx = x - hill.x, dy = y - hill.y;
      const reach = hill.spread;
      const off = Math.sqrt(dx * dx + dy * dy);
      height += hill.height * Math.exp(-(off * off) / (reach * reach));
      const ring = (off - reach * 1.55) / (reach * 0.62);
      height -= hill.height * 0.24 * Math.exp(-ring * ring);
    }
    return Math.max(0, height);
  }

  // ============================================================
  // THE GROUND, SAMPLED ONCE
  // ============================================================
  const SAMPLES = new Float32Array(GRID * GRID);
  const at = (i, j) => SAMPLES[j * GRID + i];
  const place = (i) => (i / (GRID - 1)) * 2 - 1;   // grid column to map coordinate

  let tallest = 0;
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const h = ground(place(i), place(j));
      SAMPLES[j * GRID + i] = h;
      if (h > tallest) tallest = h;
    }
  }
  for (let n = 0; n < SAMPLES.length; n++) SAMPLES[n] /= tallest || 1;
  for (const hill of hills) {
    hill.top = Math.min(1, ground(hill.x, hill.y) / (tallest || 1));
    hill.metres = Math.round((hill.top * SUMMIT_M) / 5) * 5;
  }

  // ============================================================
  // CONTOURS
  //
  // Marching squares: every square of the grid is looked at on its
  // own, and where the line for this height crosses the square is
  // worked out from which of its four corners are above it. Each
  // square gives back at most two short pieces of line; drawn one
  // after another they read as the continuous contour they are, and
  // never having to be joined up into loops is what keeps this fast
  // enough to do for twenty-odd heights at once.
  //
  // Held in map coordinates, so turning the country costs nothing
  // but a projection.
  // ============================================================
  function trace(level) {
    const out = [];
    const step = 2 / (GRID - 1);
    for (let j = 0; j < GRID - 1; j++) {
      const y0 = place(j), y1 = y0 + step;
      for (let i = 0; i < GRID - 1; i++) {
        const x0 = place(i), x1 = x0 + step;
        const v0 = at(i, j), v1 = at(i + 1, j);
        const v2 = at(i + 1, j + 1), v3 = at(i, j + 1);
        const code =
          (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) |
          (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
        if (code === 0 || code === 15) continue;

        // Where the line cuts each of the four sides. Worked out in
        // place rather than through four little functions: this runs
        // twenty thousand times per contour, and twenty-odd contours
        // are traced at load.
        const topX = x0 + ((level - v0) / (v1 - v0)) * step;
        const rightY = y0 + ((level - v1) / (v2 - v1)) * step;
        const bottomX = x0 + ((level - v3) / (v2 - v3)) * step;
        const leftY = y0 + ((level - v0) / (v3 - v0)) * step;

        switch (code) {
          case 1: case 14: out.push(x0, leftY, topX, y0); break;
          case 2: case 13: out.push(topX, y0, x1, rightY); break;
          case 3: case 12: out.push(x0, leftY, x1, rightY); break;
          case 4: case 11: out.push(x1, rightY, bottomX, y1); break;
          case 6: case 9: out.push(topX, y0, bottomX, y1); break;
          case 7: case 8: out.push(x0, leftY, bottomX, y1); break;
          // The two saddles, where the square's corners alternate
          // above and below: two separate pieces of line cross it.
          case 5:
            out.push(x0, leftY, topX, y0);
            out.push(x1, rightY, bottomX, y1);
            break;
          case 10:
            out.push(topX, y0, x1, rightY);
            out.push(bottomX, y1, x0, leftY);
            break;
        }
      }
    }
    return { level: level, line: Float32Array.from(out) };
  }

  const contours = [];
  for (let n = 0; n <= LEVELS; n++) {
    const level = SHORE + ((1 - SHORE) * n) / LEVELS;
    const drawn = trace(level);
    drawn.index = n % INDEX_EVERY === 0;
    drawn.shore = n === 0;
    drawn.metres = Math.round((level * SUMMIT_M) / 5) * 5;
    if (drawn.line.length) contours.push(drawn);
  }

  // A handful of places along each heavier contour to write its
  // height, chosen once and spread evenly through the line so the
  // numbers end up scattered over the country rather than clustered.
  contours.forEach((contour) => {
    contour.marks = [];
    if (!contour.index) return;
    const pieces = contour.line.length / 4;
    const wanted = Math.min(6, Math.max(2, Math.round(pieces / 90)));
    for (let k = 0; k < wanted; k++) {
      const piece = Math.floor(((k + 0.5) / wanted) * pieces);
      contour.marks.push(piece * 4);
    }
  });

  // Scattered spot heights on the open ground — the survey's own
  // readings, away from the contours that were drawn from them.
  const spots = [];
  while (spots.length < SPOT_HEIGHTS) {
    const x = (random() - 0.5) * 1.8, y = (random() - 0.5) * 1.8;
    const h = ground(x, y) / (tallest || 1);
    if (h < SHORE + 0.04) continue;
    spots.push({ x: x, y: y, h: h, metres: Math.round((h * SUMMIT_M) / 5) * 5 });
  }

  // ============================================================
  // THE PAGE
  // ============================================================
  document.body.classList.add("surveyed");

  const survey = document.createElement("div");
  survey.className = "survey";
  const canvas = document.createElement("canvas");
  canvas.className = "survey-ground";
  canvas.setAttribute("aria-hidden", "true");
  survey.appendChild(canvas);

  // The names are real links standing over the drawing rather than
  // lettering inside it: that way they can be tabbed to, read out and
  // followed like anything else on the site, and the canvas is left
  // to be a picture.
  const marks = document.createElement("div");
  marks.className = "survey-marks";
  survey.appendChild(marks);

  hills.forEach((hill) => {
    const mark = document.createElement("a");
    mark.className = "survey-peak";
    mark.href = hill.href;
    mark.innerHTML =
      '<span class="survey-reg" aria-hidden="true"></span>' +
      '<span class="survey-name"></span>' +
      '<span class="survey-height"></span>';
    mark.querySelector(".survey-name").textContent = hill.name;
    mark.querySelector(".survey-height").textContent = hill.metres + " m";
    mark.title = hill.meta;
    marks.appendChild(mark);
    hill.mark = mark;
    mark.addEventListener("pointerenter", () => { hill.held = true; });
    mark.addEventListener("pointerleave", () => { hill.held = false; });
    mark.addEventListener("focus", () => { hill.held = true; });
    mark.addEventListener("blur", () => { hill.held = false; });
  });

  // The title block, where a map keeps it: its own corner, ruled off,
  // with what the sheet is and how to read it.
  const block = document.createElement("div");
  block.className = "survey-block";
  block.innerHTML =
    '<h2>Theories</h2>' +
    '<p>Half-formed ideas, written down before I lose them.</p>' +
    '<dl>' +
    '<div><dt>Sheet</dt><dd>' + rows.length + " hills</dd></div>" +
    '<div><dt>Interval</dt><dd>' +
    Math.round(((1 - SHORE) * SUMMIT_M) / LEVELS / 5) * 5 + " m</dd></div>" +
    '<div><dt>Reading</dt><dd>drag to turn · scroll to close in</dd></div>' +
    "</dl>";
  survey.appendChild(block);

  page.insertBefore(survey, page.firstChild);

  const paint = canvas.getContext("2d");

  // ============================================================
  // WHERE YOU ARE STANDING
  // ============================================================
  let turn = -0.5, wantTurn = -0.5;
  let tilt = (TILT * Math.PI) / 180, wantTilt = tilt;
  let away = AWAY, wantAway = AWAY;
  let width = 0, height = 0, reach = 0;
  let dragging = false, dragFrom = null, dragged = 0;
  let last = 0;

  function resize() {
    const box = survey.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    // How large the country is drawn. Set so that the island fills
    // about two thirds of whichever way the window is tighter, at the
    // distance the camera starts at — coming closer then makes it
    // larger of its own accord, because the camera is nearer and not
    // because anything here changed.
    reach = Math.min(width * 0.36, height * 0.42) * AWAY;
  }

  /**
   * A point of the country, photographed.
   *
   * The camera stands `away` from the middle at `tilt` above the
   * ground and looks at the middle, and the country turns under it
   * rather than the camera walking round — which is the same picture
   * and a great deal less arithmetic.
   */
  const seen = { x: 0, y: 0, depth: 1 };
  let spun = 0, leaned = 0;
  function refresh() {
    spun = { c: Math.cos(turn), s: Math.sin(turn) };
    leaned = { c: Math.cos(tilt), s: Math.sin(tilt) };
  }
  function project(x, y, z) {
    const rx = x * spun.c - y * spun.s;
    const ry = x * spun.s + y * spun.c;
    const depth = away + ry * leaned.c - z * leaned.s;
    const up = ry * leaned.s + z * leaned.c;
    const near = reach / Math.max(0.2, depth);
    seen.x = width / 2 + rx * near;
    seen.y = height / 2 - up * near;
    seen.depth = depth;
    return seen;
  }

  /** How strongly a thing at this depth is drawn: near is dark, far is faint. */
  function carry(depth) {
    const across = (depth - (away - 1.2)) / 2.6;
    return Math.max(0.16, Math.min(1, 1.12 - across * 0.86));
  }

  // ============================================================
  // DRAWING
  // ============================================================
  function drawWater() {
    // The sheet the island sits on: the survey's own grid, ruled at
    // sea level. It is what gives the country a floor to stand on —
    // without it the contours hang in the air.
    const lines = 16;
    paint.lineWidth = 1;
    for (let n = 0; n <= lines; n++) {
      const t = (n / lines) * 2 - 1;
      const heavy = n % 4 === 0;
      paint.strokeStyle = "rgba(" + MUTED + "," + (heavy ? 0.2 : 0.09) + ")";
      paint.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = (k / 24) * 2 - 1;
        const p = project(t, u, WATER);
        if (k === 0) paint.moveTo(p.x, p.y); else paint.lineTo(p.x, p.y);
      }
      paint.stroke();
      paint.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = (k / 24) * 2 - 1;
        const p = project(u, t, WATER);
        if (k === 0) paint.moveTo(p.x, p.y); else paint.lineTo(p.x, p.y);
      }
      paint.stroke();
    }
  }

  function drawFootprint() {
    // The island's own outline, laid flat on the water under it. It is
    // the shore contour again with every height taken out of it, and it
    // is what stops the country reading as a drawing hanging in the air
    // over a grid: there is a shape on the sheet that it stands on.
    const shore = contours[0];
    if (!shore) return;
    const line = shore.line;
    paint.lineWidth = 1;
    paint.strokeStyle = "rgba(" + INK + ",0.16)";
    paint.beginPath();
    for (let n = 0; n < line.length; n += 4) {
      const a = project(line[n], line[n + 1], WATER);
      const ax = a.x, ay = a.y;
      const b = project(line[n + 2], line[n + 3], WATER);
      paint.moveTo(ax, ay);
      paint.lineTo(b.x, b.y);
    }
    paint.stroke();
  }

  function drawContours() {
    // Lowest first, so the summits are drawn over the ground they
    // stand on rather than under it.
    for (let c = 0; c < contours.length; c++) {
      const contour = contours[c];
      const line = contour.line;
      const up = (contour.level - SHORE) / (1 - SHORE);
      // Higher ground is drawn darker, which is what makes a page of
      // lines read as something with height in it.
      const ink = contour.shore ? 0.62 : (contour.index ? 0.34 : 0.2) + up * 0.34;
      paint.lineWidth = contour.shore ? 1.5 : contour.index ? 1.1 : 0.75;
      paint.strokeStyle = "rgba(" + INK + "," + ink.toFixed(3) + ")";
      paint.beginPath();
      for (let n = 0; n < line.length; n += 4) {
        const a = project(line[n], line[n + 1], contour.level * RELIEF);
        const ax = a.x, ay = a.y;
        const b = project(line[n + 2], line[n + 3], contour.level * RELIEF);
        paint.moveTo(ax, ay);
        paint.lineTo(b.x, b.y);
      }
      paint.stroke();
    }
  }

  function drawHeights() {
    paint.font = '9px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "middle";

    // The numbers written along the heavier contours, each turned to
    // lie along the line it belongs to, the way a contour is
    // numbered on a real sheet.
    for (const contour of contours) {
      if (!contour.marks.length) continue;
      for (const n of contour.marks) {
        const line = contour.line;
        const a = project(line[n], line[n + 1], contour.level * RELIEF);
        const ax = a.x, ay = a.y, depth = a.depth;
        const b = project(line[n + 2], line[n + 3], contour.level * RELIEF);
        let angle = Math.atan2(b.y - ay, b.x - ax);
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
        const fade = carry(depth);
        if (fade < 0.3) continue;
        paint.save();
        paint.translate(ax, ay);
        paint.rotate(angle);
        // Knocked out of its own line rather than printed over it.
        paint.strokeStyle = "rgba(250,250,249,0.92)";
        paint.lineWidth = 3.5;
        paint.lineJoin = "round";
        paint.strokeText(String(contour.metres), 0, 0);
        paint.fillStyle = "rgba(" + MUTED + "," + (fade * 0.9).toFixed(3) + ")";
        paint.fillText(String(contour.metres), 0, 0);
        paint.restore();
      }
    }

    // And the loose readings between them.
    paint.textAlign = "left";
    for (const spot of spots) {
      const p = project(spot.x, spot.y, spot.h * RELIEF);
      const fade = carry(p.depth);
      if (fade < 0.3) continue;
      paint.fillStyle = "rgba(" + MUTED + "," + (fade * 0.75).toFixed(3) + ")";
      paint.fillRect(p.x - 1, p.y - 1, 2, 2);
      paint.fillText(String(spot.metres), p.x + 5, p.y + 1);
    }
  }

  function drawHeld() {
    // The hill you are pointing at is ringed on the ground, so the
    // name above it has something to belong to.
    for (const hill of hills) {
      if (!hill.held) continue;
      paint.strokeStyle = "rgba(" + BRASS + ",0.75)";
      paint.lineWidth = 1.2;
      paint.beginPath();
      for (let k = 0; k <= 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        const x = hill.x + Math.cos(a) * hill.spread * 0.66;
        const y = hill.y + Math.sin(a) * hill.spread * 0.66;
        const z = Math.min(1, ground(x, y) / (tallest || 1)) * RELIEF;
        const p = project(x, y, z);
        if (k === 0) paint.moveTo(p.x, p.y); else paint.lineTo(p.x, p.y);
      }
      paint.stroke();

      // and a plumb line from the summit down to the water, which is
      // what says how high it actually stands.
      const top = project(hill.x, hill.y, hill.top * RELIEF);
      const topX = top.x, topY = top.y;
      const foot = project(hill.x, hill.y, WATER);
      paint.setLineDash([2, 3]);
      paint.beginPath();
      paint.moveTo(topX, topY);
      paint.lineTo(foot.x, foot.y);
      paint.stroke();
      paint.setLineDash([]);
    }
  }

  function drawCompass() {
    // North turns with the country, the way the needle would.
    const x = width - 54, y = 54, r = 20;
    paint.strokeStyle = "rgba(" + MUTED + ",0.45)";
    paint.lineWidth = 1;
    paint.beginPath();
    paint.arc(x, y, r, 0, Math.PI * 2);
    paint.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      paint.beginPath();
      paint.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
      paint.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      paint.stroke();
    }
    const north = -Math.PI / 2 - turn;
    paint.strokeStyle = "rgba(" + INK + ",0.8)";
    paint.lineWidth = 1.4;
    paint.beginPath();
    paint.moveTo(x - Math.cos(north) * (r - 6), y - Math.sin(north) * (r - 6));
    paint.lineTo(x + Math.cos(north) * (r - 3), y + Math.sin(north) * (r - 3));
    paint.stroke();
    paint.fillStyle = "rgba(" + INK + ",0.8)";
    paint.font = '9px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "middle";
    paint.fillText("N", x + Math.cos(north) * (r + 9), y + Math.sin(north) * (r + 9));

    // What the camera is doing, in the words a map would use.
    const bearing = Math.round((((turn * 180) / Math.PI) % 360 + 360) % 360);
    paint.textAlign = "right";
    paint.fillStyle = "rgba(" + MUTED + ",0.8)";
    paint.fillText(
      "BEARING " + String(bearing).padStart(3, "0") + "°   " +
      "ELEVATION " + Math.round((tilt * 180) / Math.PI) + "°",
      width - 26, 96
    );
  }

  function drawScale() {
    // A bar measured on the ground itself rather than on the page, so
    // it lengthens and shortens as the country comes and goes.
    const a = project(-0.5, 1.06, WATER);
    const ax = a.x, ay = a.y;
    const b = project(0.5, 1.06, WATER);
    const bx = b.x, by = b.y;
    paint.strokeStyle = "rgba(" + MUTED + ",0.6)";
    paint.lineWidth = 1;
    paint.beginPath();
    paint.moveTo(ax, ay);
    paint.lineTo(bx, by);
    paint.stroke();
    for (let k = 0; k <= 4; k++) {
      const p = project(-0.5 + k / 4, 1.06, WATER);
      paint.beginPath();
      paint.moveTo(p.x, p.y - 3);
      paint.lineTo(p.x, p.y + 3);
      paint.stroke();
    }
    paint.font = '9px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "top";
    paint.fillStyle = "rgba(" + MUTED + ",0.8)";
    paint.fillText("2 km", (ax + bx) / 2, (ay + by) / 2 + 7);
  }

  function placeNames() {
    // The names ride on their own summits. Whichever is nearest is
    // drawn over the others, and the far ones step back — the same
    // depth the contours under them are drawn with.
    const seenAt = hills.map((hill) => {
      const p = project(hill.x, hill.y, hill.top * RELIEF);
      return { hill: hill, x: p.x, y: p.y, depth: p.depth };
    });

    // Nearest first, so that where two names would be written on top
    // of each other it is the far one that gives way.
    const order = seenAt.slice().sort((a, b) => a.depth - b.depth);
    const taken = [];
    order.forEach((spotted, rank) => {
      const mark = spotted.hill.mark;
      const fade = carry(spotted.depth);
      const wide = mark.offsetWidth || 120;
      const tall = mark.offsetHeight || 28;

      // Lifted clear of anything already written rather than hidden
      // behind it. A name that simply disappeared would take its hill
      // with it — there would be nothing on the page saying that
      // theory is there — so the map does what a map does and stacks
      // them up the sheet instead.
      let lift = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const top = spotted.y - 7 - lift;
        const clash = taken.some((box) =>
          spotted.x < box.right && spotted.x + wide > box.left &&
          top < box.bottom && top + tall > box.top);
        if (!clash) break;
        lift += tall + 3;
      }
      taken.push({
        left: spotted.x, right: spotted.x + wide,
        top: spotted.y - 7 - lift, bottom: spotted.y - 7 - lift + tall,
      });

      mark.style.transform =
        "translate(" + spotted.x.toFixed(1) + "px," +
        (spotted.y - lift).toFixed(1) + "px)";
      mark.style.opacity = Math.max(0.22, fade).toFixed(3);
      mark.style.zIndex = String(hills.length - rank);
      mark.classList.toggle("far", fade < 0.55);
      // The stalk back down to the summit, for a name that has had to
      // move up the sheet to be read.
      mark.style.setProperty("--stalk", lift > 0 ? lift + "px" : "0px");
    });
  }

  function draw() {
    refresh();
    paint.clearRect(0, 0, width, height);
    drawWater();
    drawFootprint();
    drawContours();
    drawHeld();
    drawHeights();
    drawScale();
    drawCompass();
    placeNames();
  }

  // ============================================================
  // THE LOOP
  //
  // The camera is never moved straight to where it has been asked to
  // go: it catches up with it. A map that snapped to each new bearing
  // read as a slideshow of views rather than as one place being
  // walked round.
  // ============================================================
  let moving = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    const step = Math.min(3, (now - last) / 16.7) || 1;
    last = now;

    if (!dragging && !REDUCE_MOTION && !hills.some((hill) => hill.held)) {
      wantTurn += (DRIFT * step) / 60;
    }
    const ease = Math.min(1, EASE * step);
    const before = turn + tilt + away;
    turn += (wantTurn - turn) * ease;
    tilt += (wantTilt - tilt) * ease;
    away += (wantAway - away) * ease;
    const settled = Math.abs(turn + tilt + away - before) < 0.00002;

    if (!settled || moving) {
      draw();
      moving = !settled;
    }
  }

  // ============================================================
  // READING IT
  // ============================================================
  survey.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".survey-peak")) return;   // that is a link, not the ground
    dragging = true;
    dragged = 0;
    dragFrom = { x: e.clientX, y: e.clientY };
    survey.classList.add("turning");
    survey.setPointerCapture && survey.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging || !dragFrom) return;
    const dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y;
    dragFrom = { x: e.clientX, y: e.clientY };
    dragged += Math.abs(dx) + Math.abs(dy);
    wantTurn -= dx * TURN_BY;
    wantTilt = Math.max(
      (TILT_MIN * Math.PI) / 180,
      Math.min((TILT_MAX * Math.PI) / 180, wantTilt + dy * TILT_BY)
    );
    moving = true;
  });
  function letGo() {
    dragging = false;
    dragFrom = null;
    survey.classList.remove("turning");
  }
  window.addEventListener("pointerup", letGo);
  window.addEventListener("pointercancel", letGo);

  survey.addEventListener("wheel", (e) => {
    e.preventDefault();
    wantAway = Math.max(AWAY_MIN, Math.min(AWAY_MAX, wantAway + e.deltaY * ZOOM_BY));
    moving = true;
  }, { passive: false });

  // The same movements from the keyboard, so the country can be
  // walked round without a mouse.
  survey.tabIndex = 0;
  survey.setAttribute("aria-label",
    "A survey of this category. Use the arrow keys to turn and tilt it, " +
    "plus and minus to come closer and go back.");
  survey.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.28 : 0.09;
    let used = true;
    if (e.key === "ArrowLeft") wantTurn -= step;
    else if (e.key === "ArrowRight") wantTurn += step;
    else if (e.key === "ArrowUp") {
      wantTilt = Math.min((TILT_MAX * Math.PI) / 180, wantTilt + step * 0.6);
    } else if (e.key === "ArrowDown") {
      wantTilt = Math.max((TILT_MIN * Math.PI) / 180, wantTilt - step * 0.6);
    } else if (e.key === "+" || e.key === "=") {
      wantAway = Math.max(AWAY_MIN, wantAway - 0.35);
    } else if (e.key === "-" || e.key === "_") {
      wantAway = Math.min(AWAY_MAX, wantAway + 0.35);
    } else used = false;
    if (used) { e.preventDefault(); moving = true; }
  });

  // Pointing at the ground says how high it is there, the way a
  // finger on a map does.
  const reading = document.createElement("p");
  reading.className = "survey-reading";
  reading.setAttribute("aria-hidden", "true");
  survey.appendChild(reading);
  survey.addEventListener("pointermove", (e) => {
    const box = survey.getBoundingClientRect();
    reading.style.transform =
      "translate(" + (e.clientX - box.left + 16) + "px," +
      (e.clientY - box.top + 16) + "px)";
  });
  survey.addEventListener("pointerleave", () => survey.classList.remove("pointing"));
  survey.addEventListener("pointerenter", () => survey.classList.add("pointing"));

  // The hills answer to the pointer being over their name, and the
  // reading follows whichever one that is.
  hills.forEach((hill) => {
    hill.mark.addEventListener("pointerenter", () => {
      reading.textContent = hill.metres + " m   ·   " + hill.name;
      moving = true;
    });
    hill.mark.addEventListener("pointerleave", () => {
      reading.textContent = "";
      moving = true;
    });
  });

  window.addEventListener("resize", () => { resize(); moving = true; });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { moving = true; });
  }

  resize();
  refresh();
  draw();
  requestAnimationFrame(frame);
})();
