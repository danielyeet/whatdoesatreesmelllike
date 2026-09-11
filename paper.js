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
  const NOISE_PEAK = 0.036;     // how strong the grain gets under the map
  const WASH_PEAK = 0.09;       // the black wash under the map
  // The grain is the one layer the shaped wipe below is not allowed to
  // cut, and it has its own ramp rather than following the rest of the
  // paper. Texture arriving along a moving edge is about the most
  // noticeable thing a page can do — the eye catches the boundary
  // however soft it is made — so the grain simply comes up evenly over
  // the whole window instead, late and slowly, and is the last of the
  // paper to settle.
  const NOISE_START = 0.2;      // where in the scroll it begins to come up
  const NOISE_SPAN = 0.78;      // and how much of the scroll it takes

  // The paper arrives as a wipe running from the top of the page
  // downwards, which runs ahead of itself at the left and right edges
  // so the sides fill in before the middle does. It is deliberately
  // spread over the whole scroll rather than arriving in a rush at one
  // point in it.
  const CURTAIN_FEATHER = 15;    // how soft the leading edge is, in % of the page
  const CURTAIN_START = 0;       // where in the scroll it starts
  const CURTAIN_SIDE_LEAD = 120; // how far down the edges run ahead, in %
  const CURTAIN_MID_LAG = 1.15;  // >1 holds the middle back behind them
  // How far past the bottom of the page the sweep runs by the end. This
  // has to be generous enough that the mask is completely solid well
  // before it is taken off altogether (at c >= 0.995 below): taking off
  // a mask that is still feathering anywhere shows as the paper
  // suddenly arriving in that part of the page. With these numbers the
  // page is fully covered by about four fifths of the way through, and
  // everything after that is opacity alone.
  const CURTAIN_REACH = 170;
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

  // A ring closing on the same point, ahead of the collapse and much
  // faster than it. Unlike the suction, which pulls everywhere at once,
  // this is concentrated in a narrow band at whatever radius it has
  // reached, so it reads as a single wave passing through the grid and
  // dragging it inward as it goes.
  let waveRadius = 0, waveAmount = 0;
  const WAVE_WIDTH = 190;   // how thick the band is, in pixels
  const WAVE_STRENGTH = 74; // how hard it drags the grid as it passes

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
        if (waveAmount > 0.001) {
          const wx = px - suctionX, wy = py - suctionY;
          const wd = Math.sqrt(wx * wx + wy * wy) || 0.0001;
          const band = (wd - waveRadius) / WAVE_WIDTH;
          const inBand = Math.exp(-band * band);
          if (inBand > 0.004) {
            const drag = WAVE_STRENGTH * waveAmount * inBand;
            dx -= (wx / wd) * drag;
            dy -= (wy / wd) * drag;
          }
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

  // `micro` is 0 to 1 rather than on or off. The finest tier is skipped
  // while the grid is still molten — four times the line count for
  // something you can't see through the warp anyway, and that is where
  // the frame budget is tightest — but switching it on at a threshold
  // put a whole tier of lines on screen in one frame, which read as the
  // grid flashing. It fades up instead.
  function drawGrid(micro) {
    gridCtx.clearRect(0, 0, W, H);
    gridCtx.lineWidth = 1;

    const MICRO = GRID_SMALL / GRID_MICRO_EVERY;
    const BLOCK = GRID_SMALL * GRID_MAJOR_EVERY;
    const originX = (W / 2) % BLOCK;
    const originY = (H / 2) % BLOCK;

    // Finest tier first, so the two heavier ones draw over it.
    if (micro > 0.01) {
      gridCtx.strokeStyle = "rgba(23,23,15," + (MICRO_ALPHA * micro).toFixed(5) + ")";
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

  // A wipe from the top of the page downwards, with the left and right
  // edges running ahead of the middle. Still a mask rather than a moving
  // div, so the wash and the grid are cut by the same edge and that edge
  // can be soft. It is set on those two directly rather than on `.paper`
  // around them, which is what keeps the grain out of it.
  //
  // Three masks added together, not intersected: a plain top-to-bottom
  // sweep, plus a lobe growing out of each top corner. The sweep sets
  // how far down the middle has got; the lobes reach further down the
  // sides than it does, so the paper closes in on the middle of the
  // page last. Adding is the point — with intersect the lobes would cut
  // the sweep down instead of running out beyond it.
  const cutLayers = [wash, gridCanvas].filter(Boolean);

  function applyMask(image, composite) {
    cutLayers.forEach((layer) => {
      layer.style.webkitMaskImage = image;
      layer.style.maskImage = image;
      layer.style.webkitMaskComposite = composite;
      layer.style.maskComposite = composite ? "add, add" : "";
    });
  }

  function setCurtain(c) {
    if (Math.abs(c - lastCurtain) < 0.004) return;
    lastCurtain = c;
    if (c >= 0.995) {
      applyMask("none", "");
      return;
    }

    // Softest at the start and tightening as it goes, so the paper
    // gathers rather than switching on behind a hard line.
    const feather = Math.max(3, CURTAIN_FEATHER * (1.5 - c * 0.8));
    // Starts just above the top of the page and finishes just below the
    // bottom, so neither end of the sweep shows as an edge on screen.
    const mid = -14 + CURTAIN_REACH * Math.pow(c, CURTAIN_MID_LAG);
    const lobe = Math.max(0.5, CURTAIN_SIDE_LEAD * Math.pow(c, 0.8));

    const sweep =
      "linear-gradient(to bottom," +
      " #000 " + (mid - feather).toFixed(2) + "%," +
      " rgba(0,0,0,0) " + (mid + feather).toFixed(2) + "%)";

    // "ellipse" with two percentages, not "circle" with one: a circle's
    // size has to be given as a length, and a percentage there is
    // invalid — which silently throws the whole mask away.
    function edge(at) {
      return (
        "radial-gradient(ellipse " + lobe.toFixed(2) + "% " + lobe.toFixed(2) + "% at " + at + "," +
        " #000 0%," +
        " #000 " + Math.max(0, 100 - feather * 1.6).toFixed(2) + "%," +
        " rgba(0,0,0,0) 100%)"
      );
    }

    applyMask([sweep, edge("0% 0%"), edge("100% 0%")].join(", "), "source-over, source-over");
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

  function applyCollapse(readout, paperIn, noiseIn) {
    const pull = readout && readout.collapse ? readout.collapse : 0;

    if (pull <= 0.0005) {
      if (collapsing) {
        // Put everything back exactly as it was, once only.
        collapsing = false;
        suction = 0;
        waveAmount = 0;
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

    // The wave runs on its own, faster clock: it has crossed the whole
    // screen and closed on the centre by the time the collapse itself is
    // only half done, so it arrives as a shock ahead of the pull rather
    // than as part of it.
    const waveT = Math.min(1, pull * 2.1);
    const far = Math.hypot(window.innerWidth, window.innerHeight) * 0.62;
    waveRadius = far * (1 - waveT);
    // Full strength in the middle of its run, nothing at either end, so
    // it neither appears nor vanishes abruptly.
    waveAmount = Math.sin(Math.PI * waveT);

    // The grain can't be bent the same way — it's random dots, there's
    // nothing in it to bend — so it simply leaves.
    noiseCanvas.style.opacity = (NOISE_PEAK * noiseIn * (1 - pull)).toFixed(4);

    // Everything is drawn inward and cleared away, and what's left is
    // the plain white page — the grid and grain are pulled in and faded
    // rather than buried under anything. So the wash simply lifts,
    // taking the slight darkening it normally carries with it.
    if (wash) {
      wash.style.backgroundImage = "";
      wash.style.backgroundColor = "";
      wash.style.opacity = (WASH_PEAK * paperIn * (1 - pull)).toFixed(4);
    }

    // The grid goes the same way as the grain once the pull is well
    // under way, so the page is clear by the end rather than holding a
    // knot of compressed lines at the middle.
    gridCanvas.style.opacity = (paperIn * Math.max(0, 1 - pull * 1.45)).toFixed(3);
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
    // Flat at both ends: the paper has to come up out of nothing and
    // settle into place without either end of it being a moment you can
    // point at. An exponent below 1 was quicker off the mark but started
    // with a step, which is exactly what reads as the paper appearing
    // rather than gathering.
    const paperIn = smoother(clamp(raw / 0.97));
    const curtain = smoother(clamp((raw - CURTAIN_START) / (0.94 - CURTAIN_START)));
    molten = MOLTEN * Math.pow(1 - paperIn, MOLTEN_SETTLE);
    moltenClock = now / 1000;

    // Its own ramp, and a later and gentler one than the rest of the
    // paper: the grain is not cut by the wipe, so all it can do is come
    // up evenly, and it should be the last thing to settle.
    const noiseIn = smoother(clamp((raw - NOISE_START) / NOISE_SPAN));

    setCurtain(curtain);
    gridCanvas.style.opacity = paperIn.toFixed(3);
    noiseCanvas.style.opacity = (NOISE_PEAK * noiseIn).toFixed(4);

    // The grain holds still while a preview window is open. Blurring it
    // (in style.css) softens it, but grain that keeps churning behind
    // the defocus still catches the eye and reads as the page shaking —
    // the only way to stop that is to stop redrawing it.
    const readout = window.__mapReadout;
    const previewOpen = !!(readout && readout.previewOpen);

    applyCollapse(readout, paperIn, noiseIn);

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
    const gridInterval = (molten > 0.5 || suction > 0.001 || waveAmount > 0.001) ? 16 : GRID_MS;
    if (paperIn > 0.004 && now - lastGrid >= gridInterval) {
      lastGrid = now;
      buildField(BEND * paperIn);
      drawGrid(clamp((2.6 - molten) / 1.6));
    }
  }

  sizeCanvases();
  requestAnimationFrame(frame);
  window.addEventListener("resize", sizeCanvases);
})();
