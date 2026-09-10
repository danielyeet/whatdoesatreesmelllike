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
  const GRID_SMALL = 13;        // the small squares
  const GRID_MAJOR_EVERY = 4;   // a stronger line every fourth one
  const MINOR_ALPHA = 0.03;
  const MAJOR_ALPHA = 0.075;

  const NOISE_FLOOR = 0.016;    // grain everywhere, including slides 1 and 2
  const NOISE_PEAK = 0.058;     // and how strong it gets under the map
  const WASH_PEAK = 0.09;       // the black wash under the map

  const BEND = 1.0;             // how hard the map refracts the grid
  const GRID_MS = 50;           // the grid redraws at about 20fps
  const NOISE_MS = 33;          // the static at about 30

  const SAMPLE = 14;            // how finely a bent grid line is subdivided
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

    // The static is deliberately 1:1 with CSS pixels — it wants to be
    // coarse, and it keeps the repaint cheap.
    noiseCanvas.width = W;
    noiseCanvas.height = H;
    buildTiles();

    cols = Math.ceil(W / CELL) + 2;
    rows = Math.ceil(H / CELL) + 2;
    fieldX = new Float32Array(cols * rows);
    fieldY = new Float32Array(cols * rows);
  }

  // The displacement is computed on a coarse lattice and read back
  // with bilinear interpolation. Doing it per grid vertex instead
  // would mean a few hundred thousand distance checks a frame.
  function buildField(strength) {
    const masses = window.__mapField;
    fieldX.fill(0);
    fieldY.fill(0);
    if (!masses || !masses.length || strength <= 0.001) return;

    for (let r = 0; r < rows; r++) {
      const py = r * CELL;
      for (let c = 0; c < cols; c++) {
        const px = c * CELL;
        let dx = 0, dy = 0;
        for (let m = 0; m < masses.length; m++) {
          const mass = masses[m];
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
  }

  function drawGrid() {
    gridCtx.clearRect(0, 0, W, H);
    gridCtx.lineWidth = 1;

    const originX = (W / 2) % (GRID_SMALL * GRID_MAJOR_EVERY);
    const originY = (H / 2) % (GRID_SMALL * GRID_MAJOR_EVERY);

    for (let pass = 0; pass < 2; pass++) {
      const major = pass === 1;
      gridCtx.strokeStyle = "rgba(23,23,15," + (major ? MAJOR_ALPHA : MINOR_ALPHA) + ")";
      gridCtx.beginPath();

      let index = 0;
      for (let x = originX - GRID_SMALL * GRID_MAJOR_EVERY; x < W + GRID_SMALL; x += GRID_SMALL, index++) {
        if ((index % GRID_MAJOR_EVERY === 0) !== major) continue;
        for (let y = -SAMPLE; y <= H + SAMPLE; y += SAMPLE) {
          sampleField(x, y);
          if (y <= -SAMPLE) gridCtx.moveTo(x + sx, y + sy);
          else gridCtx.lineTo(x + sx, y + sy);
        }
      }
      index = 0;
      for (let y = originY - GRID_SMALL * GRID_MAJOR_EVERY; y < H + GRID_SMALL; y += GRID_SMALL, index++) {
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

  let lastGrid = 0, lastNoise = 0;
  let paintedOnce = false;

  function frame(now) {
    requestAnimationFrame(frame);

    const top = container.scrollTop;
    const leg = (slides[2].offsetTop - slides[1].offsetTop) || 1;
    const raw = clamp((top - slides[1].offsetTop) / leg);

    // The map arrives on the plain progress; the paper comes in later
    // and over a longer stretch, so you never catch it switching on.
    window.__p23 = smooth(raw);
    const paperIn = smooth(clamp((raw - 0.12) / 0.78));

    if (wash) wash.style.opacity = (WASH_PEAK * paperIn).toFixed(4);
    gridCanvas.style.opacity = paperIn.toFixed(3);
    noiseCanvas.style.opacity = (NOISE_FLOOR + (NOISE_PEAK - NOISE_FLOOR) * paperIn).toFixed(4);

    if (now - lastNoise >= NOISE_MS) {
      lastNoise = now;
      if (!REDUCE_MOTION || !paintedOnce) { paintStatic(); paintedOnce = true; }
    }

    if (paperIn > 0.01 && now - lastGrid >= GRID_MS) {
      lastGrid = now;
      buildField(BEND * paperIn);
      drawGrid();
    }
  }

  sizeCanvases();
  requestAnimationFrame(frame);
  window.addEventListener("resize", sizeCanvases);
})();
