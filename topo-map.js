// ============================================================
// THE SURVEY (categories/theories.html only)
//
// The theories are not a list on this page, and they are not an
// object standing in the middle of it either. The page *is*
// country: you are in it, a little above it, and it runs out to a
// haze in every direction. Turning, tilting and coming down
// closer is how you read it.
//
// Nothing about the ground is drawn by hand. It is grown, and the
// order of it matters:
//
//   1. the sampling point is pushed about by a slow noise field
//      before anything else — the DOMAIN WARP. This one step is
//      most of what makes the lines read as country rather than as
//      blobs: it bends whole regions sideways, so ridges run and
//      valleys curve instead of every rise being a round lump.
//   2. octaves of noise are summed at wherever the point ended up,
//      each one damped where the ground is already steep — a
//      standing-in for EROSION, which is what puts clean crests on
//      ridges and leaves the flats broad and open.
//   3. every theory in the page lifts a region into high country.
//      It does not lay a cone on top: it raises the ground *and*
//      scales the detail already on it, so a theory reads as a
//      massif with its own texture rather than as a bump.
//   4. that is sampled onto a grid once, and contoured once, in
//      map coordinates
//   5. every frame, those contours are put through a camera
//
// Only the last of those happens more than once. The country is
// worked out at load and thereafter only re-photographed.
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
  // ============================================================
  const SEED = 11;             // the same country on every visit

  // How much country there is and how finely it is read. REACH is a
  // radius in map units; the haze is set to run out well inside it, so
  // there is never an edge of the world on the screen.
  const REACH = 3.7;
  const GRID = 430;            // samples across the whole of that
  const LEVELS = 28;           // contour lines from the lowest ground to the highest
  const INDEX_EVERY = 5;       // every fifth is heavier, numbered, and drawn far out
  const SUMMIT_M = 2240;       // what the highest ground is called, in metres

  const WARP = 1.15;           // how far the sampling point is pushed about
  const WARP_SCALE = 0.42;     // and how broadly — low is whole regions, high is fuzz
  const OCTAVES = 7;
  const ROUGH = 0.52;          // how much of each octave the next one keeps
  const EROSION = 0.85;        // how hard steep ground damps the detail on top of it
  const RELIEF = 0.34;         // height against width — how steep the country reads

  const MASSIF_LIFT = 0.62;    // how far a theory raises the ground under it
  const MASSIF_SPREAD = 0.52;  // and how wide that country is
  const MASSIF_OUT = 2.15;     // how far out from the middle they are scattered

  // Where you are standing. TILT is the angle above the ground.
  const TILT = 21, TILT_MIN = 7, TILT_MAX = 62;
  const AWAY = 2.2, AWAY_MIN = 1.1, AWAY_MAX = 4.2;
  const TURN_BY = 0.0042;      // radians per pixel of hand movement
  const TILT_BY = 0.0026;
  const ZOOM_BY = 0.0013;
  const DRIFT = 0.021;         // radians a second when nothing is touching it
  const EASE = 0.1;            // how quickly the camera catches up

  const NEAR = 0.42;           // nothing nearer than this is drawn at all
  const HAZE_FROM = 1.9;       // where the country starts going into the haze
  const HAZE_TO = 4.7;         // and where it has gone
  const FINE_TO = 2.2;         // past here only the heavier contours are drawn

  const FRAME_MS = 16;
  const SPOT_HEIGHTS = 70;

  // The country is dark and the lines on it are light: a survey read
  // off a screen rather than off paper.
  const GROUND = "11,11,10";
  const LINE = "228,226,215";
  const FAINT = "138,136,124";
  const MARK = "196,146,72";

  // ============================================================
  // A SEEDED COUNTRY
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

  /**
   * Value noise, and the slope of it at the same point.
   *
   * The slope is what the erosion is built on: an octave is added in
   * proportion to how flat the ground under it already is, so detail
   * collects in the bottoms and the crests stay clean. Working it out
   * here is nearly free, because everything it needs has already been
   * fetched to work out the height.
   */
  const slope = { v: 0, dx: 0, dy: 0 };
  function noised(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const tx = x - ix, ty = y - iy;
    const ux = tx * tx * (3 - 2 * tx), uy = ty * ty * (3 - 2 * ty);
    const gx = 6 * tx * (1 - tx), gy = 6 * ty * (1 - ty);
    const a = corner(ix, iy), b = corner(ix + 1, iy);
    const c = corner(ix, iy + 1), d = corner(ix + 1, iy + 1);
    const k1 = b - a, k2 = c - a, k3 = a - b - c + d;
    slope.v = a + k1 * ux + k2 * uy + k3 * ux * uy;
    slope.dx = (k1 + k3 * uy) * gx;
    slope.dy = (k2 + k3 * ux) * gy;
    return slope;
  }

  const flat = (x, y) => noised(x, y).v;

  // Where each theory's high country stands. A golden-angle spiral so
  // they spread evenly however many there are, nudged off it so the
  // arrangement doesn't read as a formula.
  const hills = rows.map((row, i) => {
    const title = row.querySelector(".work-row-title");
    const meta = row.querySelector(".work-row-meta");
    const around = i * 2.399963;                  // the golden angle, in radians
    const out = MASSIF_OUT * (0.28 + 0.72 * Math.sqrt((i + 0.5) / rows.length));
    return {
      row: row,
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      href: row.getAttribute("href"),
      x: Math.cos(around) * out + (random() - 0.5) * 0.5,
      y: Math.sin(around) * out + (random() - 0.5) * 0.5,
      lift: MASSIF_LIFT * (0.6 + random() * 0.7),
      spread: MASSIF_SPREAD * (0.7 + random() * 0.7),
    };
  });

  /**
   * The height of the ground at a point, before it is normalised.
   *
   * The three steps go in this order and not another. Lifting the
   * theories before the warp smears them; warping each octave on its
   * own gives fuzz instead of country; laying the massifs on top as
   * smooth cones gives something that looks like noise with hills in
   * it rather than like ground.
   */
  function ground(x, y) {
    // 1. the warp.
    const wx = flat(x * WARP_SCALE + 11.3, y * WARP_SCALE - 4.7) - 0.5;
    const wy = flat(x * WARP_SCALE - 7.1, y * WARP_SCALE + 19.4) - 0.5;
    const px = x + wx * WARP, py = y + wy * WARP;

    // 2. the country, each octave damped by how steep the ones under
    //    it have already made the ground.
    let height = 0, amp = 1, freq = 0.62, total = 0, dx = 0, dy = 0;
    for (let octave = 0; octave < OCTAVES; octave++) {
      const n = noised(px * freq + octave * 37.1, py * freq - octave * 23.9);
      dx += n.dx * freq;
      dy += n.dy * freq;
      height += (amp * n.v) / (1 + EROSION * (dx * dx + dy * dy));
      total += amp;
      amp *= ROUGH;
      freq *= 2.04;
    }
    height /= total;

    // 3. high country where the theories are.
    let lift = 0;
    for (let i = 0; i < hills.length; i++) {
      const hill = hills[i];
      const ax = x - hill.x, ay = y - hill.y;
      const reach = hill.spread;
      lift += hill.lift * Math.exp(-(ax * ax + ay * ay) / (reach * reach));
    }
    return height * (0.72 + lift * 1.5) + lift * 0.5;
  }

  // ============================================================
  // THE GROUND, SAMPLED ONCE
  // ============================================================
  const SAMPLES = new Float32Array(GRID * GRID);
  const at = (i, j) => SAMPLES[j * GRID + i];
  const place = (i) => (i / (GRID - 1)) * 2 * REACH - REACH;

  let lowest = Infinity, tallest = -Infinity;
  for (let j = 0; j < GRID; j++) {
    const y = place(j);
    for (let i = 0; i < GRID; i++) {
      const h = ground(place(i), y);
      SAMPLES[j * GRID + i] = h;
      if (h > tallest) tallest = h;
      if (h < lowest) lowest = h;
    }
  }
  const span = tallest - lowest || 1;
  for (let n = 0; n < SAMPLES.length; n++) SAMPLES[n] = (SAMPLES[n] - lowest) / span;

  const asHeight = (raw) => Math.max(0, Math.min(1, (raw - lowest) / span));
  const metresOf = (h) => Math.round((h * SUMMIT_M) / 10) * 10;
  for (const hill of hills) {
    hill.top = asHeight(ground(hill.x, hill.y));
    hill.metres = metresOf(hill.top);
  }

  // ============================================================
  // CONTOURS
  //
  // Marching squares, turned inside out: the squares are walked once
  // and each is asked which heights cross it, rather than every height
  // being walked across the whole grid. A square of gentle ground is
  // crossed by one contour or none, so this does a couple of tests
  // where the other way round does twenty-eight — the difference
  // between a page that opens and one that hangs while it thinks.
  //
  // The pieces of line are left loose rather than joined into loops.
  // Drawn one after another they read as the continuous contour they
  // are, and not having to join them is most of why this is cheap.
  // ============================================================
  const step = (2 * REACH) / (GRID - 1);
  const gap = 1 / LEVELS;
  const heaped = [];
  for (let n = 0; n <= LEVELS; n++) heaped.push([]);

  for (let j = 0; j < GRID - 1; j++) {
    const y0 = place(j), y1 = y0 + step;
    for (let i = 0; i < GRID - 1; i++) {
      const v0 = at(i, j), v1 = at(i + 1, j);
      const v2 = at(i + 1, j + 1), v3 = at(i, j + 1);
      const low = Math.min(v0, v1, v2, v3);
      const high = Math.max(v0, v1, v2, v3);
      let from = Math.ceil(low / gap), to = Math.floor(high / gap);
      if (from > to) continue;
      if (from < 0) from = 0;
      if (to > LEVELS) to = LEVELS;
      const x0 = place(i), x1 = x0 + step;

      for (let n = from; n <= to; n++) {
        const level = n * gap;
        const code =
          (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) |
          (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
        if (code === 0 || code === 15) continue;
        const out = heaped[n];
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
  }

  const contours = [];
  for (let n = 0; n <= LEVELS; n++) {
    if (!heaped[n] || !heaped[n].length) continue;
    contours.push({
      level: n * gap,
      line: Float32Array.from(heaped[n]),
      index: n % INDEX_EVERY === 0,
      metres: metresOf(n * gap),
      marks: [],
    });
    heaped[n] = null;
  }

  // A few places along each heavier contour to write its height,
  // chosen once and spread evenly through the line so the numbers end
  // up scattered over the country rather than clustered.
  contours.forEach((contour) => {
    if (!contour.index) return;
    const pieces = contour.line.length / 4;
    const wanted = Math.min(16, Math.max(2, Math.round(pieces / 240)));
    for (let k = 0; k < wanted; k++) {
      contour.marks.push(Math.floor(((k + 0.5) / wanted) * pieces) * 4);
    }
  });

  // Loose readings on the open ground, away from the lines that were
  // drawn from them.
  const spots = [];
  while (spots.length < SPOT_HEIGHTS) {
    const x = (random() - 0.5) * 2 * REACH * 0.9;
    const y = (random() - 0.5) * 2 * REACH * 0.9;
    const h = asHeight(ground(x, y));
    spots.push({ x: x, y: y, h: h, metres: metresOf(h) });
  }

  // ============================================================
  // THE PAGE
  // ============================================================
  document.body.classList.add("surveyed");

  // `dark-surface` is how the rest of the site says "the cursor has to
  // go light over this" — nav.js reads it on every move.
  const survey = document.createElement("div");
  survey.className = "survey dark-surface";
  const canvas = document.createElement("canvas");
  canvas.className = "survey-ground";
  canvas.setAttribute("aria-hidden", "true");
  survey.appendChild(canvas);

  const marks = document.createElement("div");
  marks.className = "survey-marks";
  survey.appendChild(marks);

  let moving = true;

  // A theory is a mark on the country, not a caption written across
  // it: the same hollow square with a dot in it that the cursor is
  // drawn as, and nothing else until you point at one.
  hills.forEach((hill) => {
    const mark = document.createElement("a");
    mark.className = "survey-peak";
    mark.href = hill.href;
    mark.innerHTML =
      '<span class="survey-reg" aria-hidden="true"></span>' +
      '<span class="survey-say"><span class="survey-name"></span>' +
      '<span class="survey-height"></span></span>';
    mark.querySelector(".survey-name").textContent = hill.name;
    mark.querySelector(".survey-height").textContent = hill.metres + " m";
    marks.appendChild(mark);
    hill.mark = mark;
    const hold = (held) => () => { hill.held = held; moving = true; };
    mark.addEventListener("pointerenter", hold(true));
    mark.addEventListener("pointerleave", hold(false));
    mark.addEventListener("focus", hold(true));
    mark.addEventListener("blur", hold(false));
  });

  const block = document.createElement("div");
  block.className = "survey-block";
  block.innerHTML =
    "<h2>Theories</h2>" +
    "<p>Half-formed ideas, written down before I lose them.</p>" +
    "<dl>" +
    "<div><dt>Marks</dt><dd>" + rows.length + "</dd></div>" +
    "<div><dt>Interval</dt><dd>" + Math.round(SUMMIT_M / LEVELS / 10) * 10 + " m</dd></div>" +
    "<div><dt>Reading</dt><dd>drag to turn · scroll to close in</dd></div>" +
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
  let width = 0, height = 0, scale = 0;
  let dragging = false, dragFrom = null;
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
    // Long rather than wide: a short focal length throws the horizon
    // off the top of the page and spreads the far country so thin that
    // the haze is all that is left of it.
    scale = Math.max(width, height) * 0.78;
  }

  const seen = { x: 0, y: 0, depth: 1 };
  let spun = { c: 1, s: 0 }, leaned = { c: 1, s: 0 };
  function refresh() {
    spun = { c: Math.cos(turn), s: Math.sin(turn) };
    leaned = { c: Math.cos(tilt), s: Math.sin(tilt) };
  }

  /**
   * A point of the country, photographed.
   *
   * The camera stands `away` back from the middle at `tilt` above the
   * ground and looks at it, and the country turns under the camera
   * rather than the camera walking round it — the same picture, and a
   * great deal less arithmetic.
   *
   * It hands back one shared object. Two points in a row means copying
   * the first one's numbers out before asking for the second.
   */
  function project(x, y, z) {
    const rx = x * spun.c - y * spun.s;
    const ry = x * spun.s + y * spun.c;
    const depth = away + ry * leaned.c - z * leaned.s;
    const up = ry * leaned.s + z * leaned.c;
    const near = scale / (depth > 0.02 ? depth : 0.02);
    seen.x = width / 2 + rx * near;
    seen.y = height * 0.56 - up * near;
    seen.depth = depth;
    return seen;
  }

  /** How much of a thing survives the haze at this distance: 1 near, 0 gone. */
  function carry(depth) {
    if (depth <= HAZE_FROM) return 1;
    if (depth >= HAZE_TO) return 0;
    const across = (depth - HAZE_FROM) / (HAZE_TO - HAZE_FROM);
    return (1 - across) * (1 - across);
  }

  // The bands of distance the contours are drawn in. A stroke can only
  // carry one colour, and setting a colour is the expensive part — so
  // the haze is done a band at a time rather than a piece of line at a
  // time. Near bands are narrow, because that is where it changes
  // quickest.
  const BANDS = [];
  (function bandUp() {
    let edge = NEAR;
    while (edge < HAZE_TO) {
      const wide = 0.2 + (edge - NEAR) * 0.42;
      BANDS.push([edge, Math.min(HAZE_TO, edge + wide)]);
      edge += wide;
    }
  })();

  // ============================================================
  // DRAWING
  // ============================================================
  function drawContours() {
    // Lowest first, so high country is drawn over the ground it stands
    // on rather than under it.
    for (let c = 0; c < contours.length; c++) {
      const contour = contours[c];
      const line = contour.line;
      const z = contour.level * RELIEF;
      // Higher ground is drawn brighter, which is what makes a page of
      // lines read as something with height in it.
      const ink = (contour.index ? 0.66 : 0.34) + contour.level * 0.34;
      paint.lineWidth = contour.index ? 1.1 : 0.7;
      for (let band = 0; band < BANDS.length; band++) {
        const from = BANDS[band][0], to = BANDS[band][1];
        // The far country is drawn in heavier contours only. Every one
        // of them out there would be a grey wash, which is what
        // distance does to a map anyway.
        if (!contour.index && from >= FINE_TO) break;
        const fade = carry((from + to) / 2);
        if (fade <= 0.02) break;
        paint.strokeStyle = "rgba(" + LINE + "," + (ink * fade).toFixed(3) + ")";
        paint.beginPath();
        let drew = false;
        for (let n = 0; n < line.length; n += 4) {
          const a = project(line[n], line[n + 1], z);
          if (a.depth < from || a.depth >= to) continue;
          const ax = a.x, ay = a.y;
          const b = project(line[n + 2], line[n + 3], z);
          paint.moveTo(ax, ay);
          paint.lineTo(b.x, b.y);
          drew = true;
        }
        if (drew) paint.stroke();
      }
    }
  }

  function drawHeights() {
    paint.font = '9px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "middle";

    for (const contour of contours) {
      if (!contour.marks.length) continue;
      const z = contour.level * RELIEF;
      for (const n of contour.marks) {
        const line = contour.line;
        const a = project(line[n], line[n + 1], z);
        const ax = a.x, ay = a.y, fade = carry(a.depth);
        if (fade < 0.35 || a.depth < NEAR) continue;
        const b = project(line[n + 2], line[n + 3], z);
        let angle = Math.atan2(b.y - ay, b.x - ax);
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
        paint.save();
        paint.translate(ax, ay);
        paint.rotate(angle);
        // Knocked out of its own line rather than printed over it.
        paint.strokeStyle = "rgba(" + GROUND + ",0.95)";
        paint.lineWidth = 3.5;
        paint.lineJoin = "round";
        paint.strokeText(String(contour.metres), 0, 0);
        paint.fillStyle = "rgba(" + FAINT + "," + (fade * 0.95).toFixed(3) + ")";
        paint.fillText(String(contour.metres), 0, 0);
        paint.restore();
      }
    }

    paint.textAlign = "left";
    for (const spot of spots) {
      const p = project(spot.x, spot.y, spot.h * RELIEF);
      const fade = carry(p.depth);
      if (fade < 0.35 || p.depth < NEAR) continue;
      paint.fillStyle = "rgba(" + FAINT + "," + (fade * 0.7).toFixed(3) + ")";
      paint.fillRect(p.x - 1, p.y - 1, 2, 2);
      paint.fillText(String(spot.metres), p.x + 5, p.y + 1);
    }
  }

  function drawHeld() {
    // The country a theory stands on, ringed, so the mark above it has
    // something to belong to.
    for (const hill of hills) {
      if (!hill.held) continue;
      paint.strokeStyle = "rgba(" + MARK + ",0.85)";
      paint.lineWidth = 1.1;
      paint.beginPath();
      let started = false;
      for (let k = 0; k <= 96; k++) {
        const a = (k / 96) * Math.PI * 2;
        const x = hill.x + Math.cos(a) * hill.spread * 0.8;
        const y = hill.y + Math.sin(a) * hill.spread * 0.8;
        const p = project(x, y, asHeight(ground(x, y)) * RELIEF);
        if (p.depth < NEAR) { started = false; continue; }
        if (!started) { paint.moveTo(p.x, p.y); started = true; }
        else paint.lineTo(p.x, p.y);
      }
      paint.stroke();
    }
  }

  function drawCompass() {
    const x = width - 56, y = 56, r = 19;
    paint.strokeStyle = "rgba(" + FAINT + ",0.5)";
    paint.lineWidth = 1;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      paint.beginPath();
      paint.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
      paint.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      paint.stroke();
    }
    const north = -Math.PI / 2 - turn;
    paint.strokeStyle = "rgba(" + LINE + ",0.85)";
    paint.lineWidth = 1.3;
    paint.beginPath();
    paint.moveTo(x - Math.cos(north) * (r - 6), y - Math.sin(north) * (r - 6));
    paint.lineTo(x + Math.cos(north) * (r - 2), y + Math.sin(north) * (r - 2));
    paint.stroke();
    paint.font = '9px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "middle";
    paint.fillStyle = "rgba(" + LINE + ",0.85)";
    paint.fillText("N", x + Math.cos(north) * (r + 9), y + Math.sin(north) * (r + 9));

    const bearing = Math.round((((turn * 180) / Math.PI) % 360 + 360) % 360);
    paint.textAlign = "right";
    paint.fillStyle = "rgba(" + FAINT + ",0.85)";
    paint.fillText(
      "BEARING " + String(bearing).padStart(3, "0") + "°   ELEVATION " +
      Math.round((tilt * 180) / Math.PI) + "°",
      width - 28, 96
    );
  }

  function placeNames() {
    const order = hills
      .map((hill) => {
        const p = project(hill.x, hill.y, hill.top * RELIEF);
        return { hill: hill, x: p.x, y: p.y, depth: p.depth };
      })
      .sort((a, b) => b.depth - a.depth);

    order.forEach((spotted, rank) => {
      const mark = spotted.hill.mark;
      const fade = carry(spotted.depth);
      // A mark behind you, or gone into the haze, is not on the page at
      // all — not faded to nothing and still catching the pointer.
      const there = spotted.depth > NEAR && fade > 0.08;
      mark.classList.toggle("gone", !there);
      if (!there) return;
      mark.style.transform =
        "translate(" + spotted.x.toFixed(1) + "px," + spotted.y.toFixed(1) + "px)";
      mark.style.opacity = Math.max(0.3, fade).toFixed(3);
      mark.style.zIndex = String(rank + 1);
    });
  }

  function drawHaze() {
    // The far country is eaten by the haze before it ever reaches the
    // true horizon, which leaves a band of nothing across the top of
    // the page. This is what the haze itself looks like: a thin lift
    // in the dark where the ground has gone, so the emptiness up there
    // reads as distance rather than as the drawing stopping.
    const line = height * 0.56 - scale * Math.tan(tilt);
    const wash = paint.createLinearGradient(0, line - height * 0.34, 0, line + height * 0.3);
    wash.addColorStop(0, "rgba(" + LINE + ",0)");
    wash.addColorStop(0.62, "rgba(" + LINE + ",0.055)");
    wash.addColorStop(1, "rgba(" + LINE + ",0)");
    paint.fillStyle = wash;
    paint.fillRect(0, 0, width, height);
  }

  function draw() {
    refresh();
    paint.fillStyle = "rgb(" + GROUND + ")";
    paint.fillRect(0, 0, width, height);
    drawHaze();
    drawContours();
    drawHeld();
    drawHeights();
    drawCompass();
    placeNames();
  }

  // ============================================================
  // THE LOOP
  //
  // The camera is never moved straight to where it has been asked to
  // go: it catches up with it. A map that snapped to each new bearing
  // read as a slideshow of views rather than as one place being walked
  // round.
  // ============================================================
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    const on = Math.min(3, (now - last) / 16.7) || 1;
    last = now;

    if (!dragging && !REDUCE_MOTION && !hills.some((hill) => hill.held)) {
      wantTurn += (DRIFT * on) / 60;
    }
    const ease = Math.min(1, EASE * on);
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
    dragFrom = { x: e.clientX, y: e.clientY };
    survey.classList.add("turning");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging || !dragFrom) return;
    const dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y;
    dragFrom = { x: e.clientX, y: e.clientY };
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

  survey.tabIndex = 0;
  survey.setAttribute("aria-label",
    "A survey of this category. Use the arrow keys to turn and tilt it, " +
    "plus and minus to come closer and go back.");
  survey.addEventListener("keydown", (e) => {
    const by = e.shiftKey ? 0.28 : 0.09;
    let used = true;
    if (e.key === "ArrowLeft") wantTurn -= by;
    else if (e.key === "ArrowRight") wantTurn += by;
    else if (e.key === "ArrowUp") {
      wantTilt = Math.min((TILT_MAX * Math.PI) / 180, wantTilt + by * 0.6);
    } else if (e.key === "ArrowDown") {
      wantTilt = Math.max((TILT_MIN * Math.PI) / 180, wantTilt - by * 0.6);
    } else if (e.key === "+" || e.key === "=") {
      wantAway = Math.max(AWAY_MIN, wantAway - 0.3);
    } else if (e.key === "-" || e.key === "_") {
      wantAway = Math.min(AWAY_MAX, wantAway + 0.3);
    } else used = false;
    if (used) { e.preventDefault(); moving = true; }
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
