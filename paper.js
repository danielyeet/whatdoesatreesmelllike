// ============================================================
// THE PAPER (index.html only)
// Three layers behind the node map: a flat wash, squared paper,
// and television static.
//
// The grid is drawn on a canvas rather than with CSS, because it
// bends. node-scene.js publishes window.__mapField each frame —
// where the centre and the nodes currently sit on screen and how
// much mass each has — and the grid is pushed outward around
// them, so the diagram appears to refract the paper behind it.
//
// This file also owns window.__p23, the 0-to-1 progress between
// slide 2 and slide 3, which thread.js and node-scene.js read.
// ============================================================

(function () {
  const container = document.getElementById("scroll-container");
  const paper = document.querySelector(".paper");
  const wash = document.querySelector(".paper-wash");
  const gridCanvas = document.querySelector(".paper-grid");
  const noiseCanvas = document.querySelector(".paper-noise");
  if (!container || !gridCanvas || !noiseCanvas) return;

  const slides = Array.from(container.querySelectorAll(".slide"));
  if (slides.length < 3) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  // Three tiers now: a big square every fourth small one, and each
  // small square divided 4x4 again. The finest tier is meant to read
  // as a faint tone rather than as lines you can count.
  const GRID_SMALL = 13;        // the small squares
  const GRID_MAJOR_EVERY = 4;   // a stronger line every fourth one
  const GRID_MICRO_EVERY = 4;   // and each small square split this many ways
  const MICRO_ALPHA = 0.009;  // was 0.012 — the grid asked to be a touch less prominent
  const MINOR_ALPHA = 0.017;  // was 0.022
  const MAJOR_ALPHA = 0.042;  // was 0.056

  // The static is drawn at a fraction of screen resolution and scaled
  // up, so each grain is this many CSS pixels across. 1 is the finest
  // it goes; larger reads coarser, like a worse signal.
  const NOISE_SCALE = 2;
  const NOISE_FLOOR = 0.016;    // grain everywhere, including slides 1 and 2
  const NOISE_PEAK = 0.058;     // and how strong it gets under the map
  const WASH_PEAK = 0.09;       // the black wash under the map

  // The paper arrives as a curtain: it is already there at the left
  // and right edges when you start scrolling, and the gap up the
  // middle closes as you go.
  const CURTAIN_FEATHER = 9;    // how soft the closing edges are, in % of width
  const CURTAIN_START = 0.02;   // where in the scroll the gap starts closing
  const BEND = 1.0;             // how hard the map refracts the grid
  const MOLTEN = 46;            // how far the grid is still running when it arrives
  const MOLTEN_SETTLE = 1.6;    // >1 means it firms up early and holds still
  const GRID_MS = 50;           // the grid redraws at about 20fps
  const NOISE_MS = 33;          // the static at about 30

  const CURSOR_REACH = 88;      // was 130 — the cursor's own dent in the grid, pulled in
  const CURSOR_STRENGTH = 3.6;  // was 9 — and made much shallower

  const SAMPLE = 14;            // how finely a bent grid line is subdivided
  const SAMPLE_MICRO = 30;      // the finest tier can afford to be coarser
  const CELL = 40;              // resolution of the displacement field

  // ============================================================
  // STATIC
  // Every pixel changing is far too much random number generation
  // to do per frame. A handful of tiles are built once, and each
  // frame paints one at a random offset — the eye reads the
  // switching as the picture boiling.
  // ============================================================
  const noiseCtx = noiseCanvas.getContext("2d");
  const TILE = 256;
  const TILE_COUNT = 9;
  let patterns = [];

  function buildTiles() {
    patterns = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = document.createElement("canvas");
      tile.width = tile.height = TILE;
      const tileCtx = tile.getContext("2d");
      const image = tileCtx.createImageData(TILE, TILE);
      const data = image.data;
      for (let k = 0; k < data.length; k += 4) {
        const v = (Math.random() * 255) | 0;
        data[k] = data[k + 1] = data[k + 2] = v;
        data[k + 3] = 255;
      }
      tileCtx.putImageData(image, 0, 0);
      patterns.push(noiseCtx.createPattern(tile, "repeat"));
    }
  }

  function paintStatic() {
    if (!patterns.length) return;
    const dx = (Math.random() * TILE) | 0;
    const dy = (Math.random() * TILE) | 0;
    noiseCtx.setTransform(1, 0, 0, 1, -dx, -dy);
    noiseCtx.fillStyle = patterns[(Math.random() * patterns.length) | 0];
    noiseCtx.fillRect(0, 0, noiseCanvas.width + TILE, noiseCanvas.height + TILE);
    noiseCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ============================================================
  // GRID
  // ============================================================
  const gridCtx = gridCanvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  let cols = 0, rows = 0;
  let fieldX = new Float32Array(0);
  let fieldY = new Float32Array(0);

  function sizeCanvases() {
    W = Math.ceil(window.innerWidth);
    H = Math.ceil(window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    gridCanvas.width = Math.ceil(W * dpr);
    gridCanvas.height = Math.ceil(H * dpr);
    gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Drawn small and stretched to fit, which is what makes the grain
    // chunky; nearest-neighbour keeps each one a hard square instead of
    // a smudge.
    noiseCanvas.width = Math.ceil(W / NOISE_SCALE);
    noiseCanvas.height = Math.ceil(H / NOISE_SCALE);
    noiseCanvas.style.imageRendering = "pixelated";
    buildTiles();

    cols = Math.ceil(W / CELL) + 2;
    rows = Math.ceil(H / CELL) + 2;
    fieldX = new Float32Array(cols * rows);
    fieldY = new Float32Array(cols * rows);
  }

  let cursorX = -9999, cursorY = -9999, cursorLive = false;
  window.addEventListener("pointermove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorLive = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { cursorLive = false; });

  // The displacement is computed on a coarse lattice and read back
  // with bilinear interpolation. Doing it per grid vertex instead
  // would mean a few hundred thousand distance checks a frame.
  // Set while the map is collapsing on the way back up to slide 2: an
  // even pull of the whole grid towards a point, proportional to how far
  // each part of it is from there, so the grid implodes rather than just
  // dimpling near the middle the way the node masses do.
  let suction = 0, suctionX = 0, suctionY = 0;

  function buildField(strength) {
    const masses = window.__mapField;
    fieldX.fill(0);
    fieldY.fill(0);
    const list = masses ? masses.slice() : [];
    if (cursorLive) list.push({ x: cursorX, y: cursorY, r: CURSOR_REACH, s: CURSOR_STRENGTH });
    if ((!list.length && suction <= 0.001) || strength <= 0.001) return;

    for (let r = 0; r < rows; r++) {
      const py = r * CELL;
      for (let c = 0; c < cols; c++) {
        const px = c * CELL;
        let dx = 0, dy = 0;
        if (suction > 0.001) {
          dx -= (px - suctionX) * suction;
          dy -= (py - suctionY) * suction;
        }
        for (let m = 0; m < list.length; m++) {
          const mass = list[m];
          const ax = px - mass.x;
          const ay = py - mass.y;
          const d2 = ax * ax + ay * ay;
          if (d2 > mass.r * mass.r) continue;
          const d = Math.sqrt(d2) || 0.0001;
          const k = 1 - d / mass.r;
          const push = mass.s * k * k * strength;
          dx += (ax / d) * push;
          dy += (ay / d) * push;
        }
        const i = r * cols + c;
        fieldX[i] = dx;
        fieldY[i] = dy;
      }
    }
  }

  // While the paper is arriving, the whole grid is still liquid: a
  // slow large-scale wobble that relaxes to nothing by the time you
  // land, so the white doesn't switch into ruled paper — it sets into
  // it. Same idea as the refraction around the centre, just bigger
  // and going away.
  let molten = 0;
  let moltenClock = 0;

  let sx = 0, sy = 0;
  function sampleField(x, y) {
    const fx = x / CELL, fy = y / CELL;
    let c0 = fx | 0, r0 = fy | 0;
    if (c0 < 0) c0 = 0; else if (c0 > cols - 2) c0 = cols - 2;
    if (r0 < 0) r0 = 0; else if (r0 > rows - 2) r0 = rows - 2;
    const tx = fx - c0, ty = fy - r0;
    const i00 = r0 * cols + c0, i10 = i00 + 1;
    const i01 = i00 + cols, i11 = i01 + 1;
    const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty, w11 = tx * ty;
    sx = fieldX[i00] * w00 + fieldX[i10] * w10 + fieldX[i01] * w01 + fieldX[i11] * w11;
    sy = fieldY[i00] * w00 + fieldY[i10] * w10 + fieldY[i01] * w01 + fieldY[i11] * w11;

    if (molten > 0.04) {
      const t = moltenClock;
      sx += (Math.sin(y * 0.0105 + t * 0.55) + Math.sin(y * 0.0265 - t * 0.83) * 0.45) * molten;
      sy += (Math.sin(x * 0.0092 - t * 0.62) * 0.8 + Math.cos(x * 0.0208 + t * 0.4) * 0.35) * molten;
    }
  }

  function drawGrid(withMicro) {
    gridCtx.clearRect(0, 0, W, H);
    gridCtx.lineWidth = 1;

    const MICRO = GRID_SMALL / GRID_MICRO_EVERY;
    const BLOCK = GRID_SMALL * GRID_MAJOR_EVERY;
    const originX = (W / 2) % BLOCK;
    const originY = (H / 2) % BLOCK;

    // Finest tier first, so the two heavier ones draw over it.
    if (withMicro) {
      gridCtx.strokeStyle = "rgba(23,23,15," + MICRO_ALPHA + ")";
      gridCtx.beginPath();
      let index = 0;
      for (let x = originX - BLOCK; x < W + MICRO; x += MICRO, index++) {
        if (index % GRID_MICRO_EVERY === 0) continue; // that one belongs to the tier above
        for (let y = -SAMPLE_MICRO; y <= H + SAMPLE_MICRO; y += SAMPLE_MICRO) {
          sampleField(x, y);
          if (y <= -SAMPLE_MICRO) gridCtx.moveTo(x + sx, y + sy);
          else gridCtx.lineTo(x + sx, y + sy);
        }
      }
      index = 0;
      for (let y = originY - BLOCK; y < H + MICRO; y += MICRO, index++) {
        if (index % GRID_MICRO_EVERY === 0) continue;
        for (let x = -SAMPLE_MICRO; x <= W + SAMPLE_MICRO; x += SAMPLE_MICRO) {
          sampleField(x, y);
          if (x <= -SAMPLE_MICRO) gridCtx.moveTo(x + sx, y + sy);
          else gridCtx.lineTo(x + sx, y + sy);
        }
      }
      gridCtx.stroke();
    }

    for (let pass = 0; pass < 2; pass++) {
      const major = pass === 1;
      gridCtx.strokeStyle = "rgba(23,23,15," + (major ? MAJOR_ALPHA : MINOR_ALPHA) + ")";
      gridCtx.beginPath();

      let index = 0;
      for (let x = originX - BLOCK; x < W + GRID_SMALL; x += GRID_SMALL, index++) {
        if ((index % GRID_MAJOR_EVERY === 0) !== major) continue;
        for (let y = -SAMPLE; y <= H + SAMPLE; y += SAMPLE) {
          sampleField(x, y);
          if (y <= -SAMPLE) gridCtx.moveTo(x + sx, y + sy);
          else gridCtx.lineTo(x + sx, y + sy);
        }
      }
      index = 0;
      for (let y = originY - BLOCK; y < H + GRID_SMALL; y += GRID_SMALL, index++) {
        if ((index % GRID_MAJOR_EVERY === 0) !== major) continue;
        for (let x = -SAMPLE; x <= W + SAMPLE; x += SAMPLE) {
          sampleField(x, y);
          if (x <= -SAMPLE) gridCtx.moveTo(x + sx, y + sy);
          else gridCtx.lineTo(x + sx, y + sy);
        }
      }
      gridCtx.stroke();
    }
  }

  // ============================================================
  // LOOP
  // ============================================================
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  // Flat at both ends, so neither the start nor the finish of the
  // paper coming in has an edge you can catch.
  const smoother = (v) => v * v * v * (v * (v * 6 - 15) + 10);

  let lastGrid = 0, lastNoise = 0;
  let paintedOnce = false;
  let lastCurtain = -1;

  // A soft disc growing from the centre outward, in place of the old
  // two-panel curtain sliding in from the left and right edges. Still
  // a mask rather than a moving div, so the wash, the grid and the
  // static are all cut by the same edge, and that edge can be soft —
  // but a circle reads as the paper materializing around the map's
  // own centre (where the branches themselves grow from) rather than
  // as two hard edges sliding together, which is what made it feel
  // like a strictly left-right effect instead of a single arrival.
  function setCurtain(c) {
    if (!paper) return;
    if (Math.abs(c - lastCurtain) < 0.004) return;
    lastCurtain = c;
    if (c >= 0.995) {
      paper.style.webkitMaskImage = "none";
      paper.style.maskImage = "none";
      return;
    }
    // Biased downward: the shape starts high on the page and is taller
    // than it is wide, so its lower edge sweeps down the screen much
    // further and faster than its upper edge climbs. It reads as the
    // paper spreading downwards rather than opening evenly in all
    // directions, while still being a soft shape rather than a wipe.
    //
    // Sized in % of the page's own width and height, generously enough
    // that by the time the mask is dropped altogether (just above) it
    // has covered the corners — otherwise the last of it would pop.
    const rx = 105 * c;
    const ry = 150 * c;
    const feather = Math.max(2, CURTAIN_FEATHER * (1.4 - c * 0.9));
    const gradient =
      "radial-gradient(ellipse " + rx.toFixed(2) + "% " + ry.toFixed(2) + "% at 50% 18%," +
      " #000 0%," +
      " #000 " + (100 - feather).toFixed(2) + "%," +
      " rgba(0,0,0,0) 100%)";
    paper.style.webkitMaskImage = gradient;
    paper.style.maskImage = gradient;
  }

  // ============================================================
  // THE COLLAPSE (on the way back up to slide 2)
  //
  // node-scene.js pulls the map itself into its centre; this is the
  // paper's half of the same movement. The grid and the grain are
  // scaled down towards wherever that centre is on screen, so they
  // are drawn into it rather than simply fading, and the wash turns
  // into darkness closing in around the same point.
  //
  // The wash is deliberately left out of the scaling: it has to stay
  // covering the whole window while it darkens, or the black would
  // shrink into a dot instead of swallowing the page.
  // ============================================================
  let collapsing = false;

  function applyCollapse(readout, paperIn) {
    const pull = readout && readout.collapse ? readout.collapse : 0;

    if (pull <= 0.0005) {
      if (collapsing) {
        // Put everything back exactly as it was, once only.
        collapsing = false;
        suction = 0;
        if (wash) {
          wash.style.backgroundImage = "";
          wash.style.backgroundColor = "";
        }
      }
      if (wash) wash.style.opacity = (WASH_PEAK * paperIn).toFixed(4);
      return;
    }
    collapsing = true;

    const hubX = readout.hubX === undefined ? window.innerWidth / 2 : readout.hubX;
    const hubY = readout.hubY === undefined ? window.innerHeight / 2 : readout.hubY;

    // The grid is drawn through a displacement field, so the implosion
    // can be done by pulling every point of that field towards the
    // centre — the lines bend inward and converge while the canvas they
    // are drawn on never moves. Scaling the canvas instead would drag
    // its own edges into view as a hard rectangle.
    suction = 0.97 * pull;
    suctionX = hubX;
    suctionY = hubY;

    // The grain can't be bent the same way — it's random dots, there's
    // nothing in it to bend — so it simply leaves.
    noiseCanvas.style.opacity = (
      (NOISE_FLOOR + (NOISE_PEAK - NOISE_FLOOR) * paperIn) * (1 - pull)
    ).toFixed(4);

    if (wash) {
      // Dark closing in on the centre: a clear hole over the sphere that
      // shrinks as the collapse finishes, so the last thing left on the
      // page is the sphere itself with everything else gone to black.
      //
      // The flat black this element normally carries has to be turned
      // off while that runs, or it sits behind the gradient and fills
      // the clear hole straight back in.
      wash.style.backgroundColor = "transparent";
      // The clear hole closes completely by the end, so the page is
      // genuinely black and the only things left showing are the sphere
      // and the line rising out of it — both of which turn pale as this
      // runs (see node-scene.js and .thread-reform) so they read against
      // it instead of disappearing into it.
      const hole = Math.max(0, 92 * (1 - pull) - 6) * (1 - pull);
      const edge = hole + (10 + 30 * (1 - pull));
      wash.style.backgroundImage =
        "radial-gradient(circle at " + hubX.toFixed(1) + "px " + hubY.toFixed(1) + "px," +
        " rgba(0,0,0,0) 0%," +
        " rgba(0,0,0,0) " + hole.toFixed(1) + "%," +
        " #000 " + edge.toFixed(1) + "%)";
      wash.style.opacity = Math.min(1, WASH_PEAK * paperIn + pull * 1.2).toFixed(4);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);

    const top = container.scrollTop;
    const leg = (slides[2].offsetTop - slides[1].offsetTop) || 1;
    const raw = clamp((top - slides[1].offsetTop) / leg);

    // The map arrives on the plain progress. The paper is deliberately
    // ahead of it now: the exponent below is less than 1, so it is
    // already faintly present the moment you start scrolling and
    // spends the whole leg building rather than appearing near the
    // end. What holds it back from the middle of the screen is the
    // curtain, not its opacity.
    window.__p23 = smooth(raw);
    const paperIn = Math.pow(clamp(raw / 0.95), 0.7);
    const curtain = smoother(clamp((raw - CURTAIN_START) / (0.94 - CURTAIN_START)));
    molten = MOLTEN * Math.pow(1 - paperIn, MOLTEN_SETTLE);
    moltenClock = now / 1000;

    setCurtain(curtain);
    gridCanvas.style.opacity = paperIn.toFixed(3);
    noiseCanvas.style.opacity = (NOISE_FLOOR + (NOISE_PEAK - NOISE_FLOOR) * paperIn).toFixed(4);

    // The grain holds still while a preview window is open. Blurring it
    // (in style.css) softens it, but grain that keeps churning behind
    // the defocus still catches the eye and reads as the page shaking —
    // the only way to stop that is to stop redrawing it.
    const readout = window.__mapReadout;
    const previewOpen = !!(readout && readout.previewOpen);

    applyCollapse(readout, paperIn);

    if (!previewOpen && now - lastNoise >= NOISE_MS) {
      lastNoise = now;
      if (!REDUCE_MOTION || !paintedOnce) { paintStatic(); paintedOnce = true; }
    }

    // While it's still moving there's more to redraw per frame, so it
    // gets the full rate; once it has set, it only needs to keep up
    // with the map turning behind it.
    // Full rate while it's still molten on arrival, and while it's
    // imploding on the way out — both are fast movements that look
    // stepped at the slower resting rate.
    const gridInterval = (molten > 0.5 || suction > 0.001) ? 33 : GRID_MS;
    if (paperIn > 0.004 && now - lastGrid >= gridInterval) {
      lastGrid = now;
      buildField(BEND * paperIn);
      // The finest tier is skipped while the grid is still molten: it
      // is four times the line count for something you can't see
      // through the warp anyway, and that is where the frame budget
      // is tightest.
      drawGrid(molten < 1.5);
    }
  }

  sizeCanvases();
  requestAnimationFrame(frame);
  window.addEventListener("resize", sizeCanvases);
})();
