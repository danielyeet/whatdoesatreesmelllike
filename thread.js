// ============================================================
// THE THREAD + THE PAPER (index.html only)
//
// One straight line runs down the middle of the landing page: it
// leaves the title, meets the second slide's sentence, and picks
// up again below it to end on the centre of the node map. It is
// simply there — it does not draw itself as you scroll.
//
// What DOES change is its character. On the last leg, as the
// squared paper and the static fade in for the node map, the line
// breaks into a fine dashed rule on the same rhythm as the grid
// and starts to shimmer with the static, so it belongs to that
// page rather than arriving from a different one.
//
// This file also runs the television static on the paper, and
// sets window.__p23 — the 0-to-1 progress between slide 2 and 3 —
// which node-scene.js reads to fade the map in alongside it.
// ============================================================

(function () {
  const container = document.getElementById("scroll-container");
  if (!container) return;

  const slides = Array.from(container.querySelectorAll(".slide"));
  const titleEl = document.querySelector(".title-content");
  const introEl = document.querySelector(".intro-lede");
  if (slides.length < 3 || !titleEl || !introEl) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  const GAP = 26;         // breathing room between the line and the text it leaves
  const GRID_STEP = 16;   // matches --grid-small, so the dashes land on the grid
  const FRAME_MS = 33;    // the static and the shimmer both run at about 30fps

  // ============================================================
  // THE LINE
  // ============================================================
  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  const svg = svgEl("svg", { class: "thread", "aria-hidden": "true" });
  const toText = svgEl("line", { class: "thread-line" });
  const toNode = svgEl("line", { class: "thread-line" });
  svg.appendChild(toText);
  svg.appendChild(toNode);
  container.insertBefore(svg, container.firstChild);

  function measure() {
    const width = container.clientWidth;
    const total = container.scrollHeight;
    if (!width || !total) return;

    svg.setAttribute("viewBox", "0 0 " + width + " " + total);
    svg.style.height = total + "px";

    const base = container.getBoundingClientRect();
    const scrolled = container.scrollTop;
    function place(element) {
      const r = element.getBoundingClientRect();
      return { top: r.top - base.top + scrolled, bottom: r.bottom - base.top + scrolled };
    }

    // Everything it connects is centred, so the line is a single
    // straight drop down the middle.
    const x = Math.round(width / 2);
    const title = place(titleEl);
    const intro = place(introEl);
    const centreY = slides[2].offsetTop + slides[2].offsetHeight / 2;

    toText.setAttribute("x1", x);
    toText.setAttribute("x2", x);
    toText.setAttribute("y1", title.bottom + GAP);
    toText.setAttribute("y2", intro.top - GAP);

    toNode.setAttribute("x1", x);
    toNode.setAttribute("x2", x);
    toNode.setAttribute("y1", intro.bottom + GAP);
    toNode.setAttribute("y2", centreY);
  }

  // ============================================================
  // THE STATIC
  // Real television static means every pixel changing, which is far
  // too much random number generation to do per frame. Instead a
  // handful of noise tiles are built once, and each frame paints one
  // of them at a random offset — the eye reads the switching as the
  // picture boiling.
  // ============================================================
  const noiseCanvas = document.querySelector(".paper-noise");
  const ctx = noiseCanvas ? noiseCanvas.getContext("2d") : null;
  const TILE = 256;
  const TILE_COUNT = 9;
  let patterns = [];

  function buildTiles() {
    if (!ctx) return;
    patterns = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = document.createElement("canvas");
      tile.width = tile.height = TILE;
      const tileCtx = tile.getContext("2d");
      const image = tileCtx.createImageData(TILE, TILE);
      const data = image.data;
      for (let k = 0; k < data.length; k += 4) {
        // Grey rather than black: on the washed background the light
        // specks matter as much as the dark ones.
        const v = (Math.random() * 255) | 0;
        data[k] = data[k + 1] = data[k + 2] = v;
        data[k + 3] = 255;
      }
      tileCtx.putImageData(image, 0, 0);
      patterns.push(ctx.createPattern(tile, "repeat"));
    }
  }

  function sizeCanvas() {
    if (!noiseCanvas) return;
    // Deliberately 1:1 with CSS pixels rather than device pixels —
    // static wants to be coarse, and it keeps the repaint cheap.
    noiseCanvas.width = Math.ceil(window.innerWidth);
    noiseCanvas.height = Math.ceil(window.innerHeight);
    buildTiles();
  }

  function paintStatic() {
    if (!ctx || !patterns.length) return;
    const dx = (Math.random() * TILE) | 0;
    const dy = (Math.random() * TILE) | 0;
    ctx.setTransform(1, 0, 0, 1, -dx, -dy);
    ctx.fillStyle = patterns[(Math.random() * patterns.length) | 0];
    ctx.fillRect(0, 0, noiseCanvas.width + TILE, noiseCanvas.height + TILE);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ============================================================
  // THE LOOP
  // ============================================================
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => v * v * (3 - 2 * v);

  let lastTick = 0;
  let painted = false;

  function frame(now) {
    requestAnimationFrame(frame);

    const top = container.scrollTop;
    const secondLeg = (slides[2].offsetTop - slides[1].offsetTop) || 1;
    const p2 = clamp((top - slides[1].offsetTop) / secondLeg);
    const eased = smooth(p2);

    document.documentElement.style.setProperty("--paper-in", eased.toFixed(3));
    window.__p23 = eased;

    if (now - lastTick < FRAME_MS) return;
    lastTick = now;

    if (eased > 0.01) {
      if (!REDUCE_MOTION || !painted) { paintStatic(); painted = true; }
    }

    // The last leg of the line joins the page it's arriving on: it
    // breaks into a dashed rule on the grid's rhythm, and flickers
    // on the same beat as the static.
    if (eased > 0.005) {
      const gap = GRID_STEP * 0.34 * eased;
      toNode.style.strokeDasharray = (GRID_STEP - gap).toFixed(2) + " " + gap.toFixed(2);
      if (!REDUCE_MOTION) {
        const flicker = 1 - eased * (0.12 + Math.random() * 0.3);
        toNode.style.strokeOpacity = (0.26 * flicker).toFixed(3);
        const waver = eased * (Math.random() - 0.5) * 1.1;
        toNode.style.transform = "translateX(" + waver.toFixed(2) + "px)";
      }
    } else {
      toNode.style.strokeDasharray = "none";
      toNode.style.strokeOpacity = "";
      toNode.style.transform = "";
    }
  }

  measure();
  sizeCanvas();
  requestAnimationFrame(frame);

  window.addEventListener("resize", () => { measure(); sizeCanvas(); });
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
