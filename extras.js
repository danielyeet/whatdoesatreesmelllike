// ============================================================
// EXTRAS (index.html only)
// A gas-chromatograph trace along the foot of the third slide,
// the way a real instrument reads out a smell: one peak per node,
// taller the nearer that node is to the camera, sliding along as
// the map turns. It is a reading of the constellation, not
// decoration laid beside it — and the peak for whichever node
// you're currently hovering (or have focused) grows taller still,
// so the trace visibly answers back.
//
// Behind that one line stand several more of it, each a little
// higher, a little smaller and a little fainter than the one in
// front, so they read as the same reading receding into the page
// like hills behind one another. They are not separate traces:
// every one is the same line, so they all answer to exactly the
// same thing at exactly the same moment.
//
// Nothing in here is load-bearing: set SHOW_CHROMATOGRAM to false,
// or delete this file and its <script> tag from index.html, and
// the site is unchanged.
//
// (Two earlier ideas tried here — dimension strings between nodes,
// and a pair of plan/elevation boxes in the corners — were removed
// rather than left toggled off, along with the tuning and drawing
// code that only existed for them.)
// ============================================================
const SHOW_CHROMATOGRAM = true;

(function () {
  if (!SHOW_CHROMATOGRAM) return;

  const NS = "http://www.w3.org/2000/svg";
  const INK = "rgba(23,23,15,";

  const CHROMA_BASE = 52;        // height of the baseline above the foot
  const CHROMA_PEAK = 54;        // how tall the tallest peak can run (was 77, and 96 before)
  const CHROMA_WIDTH = 42;       // peak width in pixels
  const CHROMA_STEP = 4;         // sampling along the trace
  const CHROMA_HOVER_BOOST = 1.45; // how much taller the hovered node's own peak grows

  // How quickly each peak catches up to the height it should be, per
  // frame at 60fps. Everything the trace does goes through this, so it
  // eases into every change instead of snapping: the map turning, a
  // node passing in front of another, and above all hovering one,
  // which used to jump to its full height in a single frame.
  const CHROMA_EASE = 0.1;

  // The ranks standing behind the front line. Each step up the page is
  // a fixed fraction of the one before it (FALLOFF below 1), so they
  // crowd together as they go rather than marching away evenly — which
  // is what makes them read as running back to a horizon rather than as
  // a stack of evenly spaced copies.
  const RIDGE_COUNT = 6;
  const RIDGE_SPAN = 54;      // how far above the front line the furthest sits
  const RIDGE_FALLOFF = 0.72; // below 1: each rank sits closer to the last
  const RIDGE_SHRINK = 0.9;   // each rank's peaks, against the one in front
  const RIDGE_FADE = 0.7;     // and how much of its ink is left
  // Note there is no narrowing to go with the shrinking: a rank is only
  // ever scaled about its own baseline, never sideways. Squeezing it
  // towards the middle of the page would carry every peak with it, and
  // then the same node would read at a different place across the ranks
  // — they have to stand in the same column to be the same reading.

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  const svg = el("svg", { class: "chroma-trace", "aria-hidden": "true" });
  svg.style.position = "fixed";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "6";       // over the map, under the menu
  svg.style.opacity = "0";
  document.body.appendChild(svg);

  function clear(group) { while (group.firstChild) group.removeChild(group.firstChild); }

  function line(x1, y1, x2, y2, alpha, width) {
    return el("line", {
      x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
      stroke: INK + alpha + ")", "stroke-width": width || 1,
    });
  }

  // Everything is built once here and only updated afterwards. The ranks
  // behind the front line are <use> copies of the one path rather than
  // paths of their own, so the shape is worked out once a frame however
  // many of them there are, and none of them can fall out of step with
  // it. Furthest first, so the nearer ones draw over them.
  const ridgeLayer = el("g", {});
  svg.appendChild(ridgeLayer);

  const trace = el("path", {
    id: "chroma-trace-line",
    fill: "none",
    stroke: INK + "0.3)",
    "stroke-width": 1,
    // Without this each copy's transform would squeeze its stroke as
    // well as its shape, and the ranks further back would be drawn in a
    // progressively thinner line instead of the same hairline.
    "vector-effect": "non-scaling-stroke",
  });

  const ridges = [];
  for (let rank = RIDGE_COUNT; rank >= 1; rank--) {
    const copy = el("use", {
      href: "#chroma-trace-line",
      opacity: Math.pow(RIDGE_FADE, rank).toFixed(4),
    });
    ridgeLayer.appendChild(copy);
    ridges.push({ rank: rank, node: copy });
  }

  svg.appendChild(trace);
  const baseLayer = el("g", {});
  svg.appendChild(baseLayer);

  // ============================================================
  // CHROMATOGRAM
  //
  // One peak per node. Where a peak sits across the page and how tall
  // it stands both come from where that node currently is, which
  // changes constantly as the map turns — so nothing here is drawn
  // from those live numbers directly. Each peak keeps its own position
  // and height and eases towards the values it should have, which is
  // what stops the trace twitching as nodes pass each other and what
  // makes hovering one grow its peak smoothly rather than in a jump.
  // ============================================================
  const peaks = []; // one per node: where it is and how tall, smoothed
  let laidOutW = 0, laidOutH = 0;

  function updatePeaks(nodes, activeIndex) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      let target = CHROMA_PEAK * (1 - n.depth) * (1 - n.depth);
      // A flat multiplier alone would be invisible on a node that's
      // currently far away and already reading as barely a bump, so
      // hovering guarantees a real peak (a floor), not just a bigger
      // fraction of whatever was already there.
      if (i === activeIndex) target = Math.max(target * CHROMA_HOVER_BOOST, CHROMA_PEAK * 0.4);

      if (!peaks[i]) {
        // First frame for this peak: start where it belongs rather than
        // easing up from nothing, or the whole trace grows in on arrival.
        peaks[i] = { x: n.x, height: target };
      } else {
        peaks[i].x += (n.x - peaks[i].x) * CHROMA_EASE;
        peaks[i].height += (target - peaks[i].height) * CHROMA_EASE;
      }
    }
    peaks.length = nodes.length;
  }

  // Where each rank stands, and the baseline the front one runs along.
  // Only the size of the window changes any of this, so it is worked out
  // when that changes rather than every frame.
  function layout(W, H) {
    const baseY = H - CHROMA_BASE;
    const centreX = W / 2;

    ridges.forEach((ridge) => {
      const lift = RIDGE_SPAN * (1 - Math.pow(RIDGE_FALLOFF, ridge.rank));
      const shorter = Math.pow(RIDGE_SHRINK, ridge.rank);
      // Shrunk about its own baseline and then lifted, and nothing
      // else: a rank keeps its feet on its own baseline, only its peaks
      // come down, and every peak stays in the column the node it reads
      // is actually in.
      ridge.node.setAttribute(
        "transform",
        "translate(0 " + (baseY - lift).toFixed(1) + ")" +
        " scale(1 " + shorter.toFixed(4) + ")" +
        " translate(0 " + (-baseY).toFixed(1) + ")"
      );
    });

    // The baseline and its ticks belong to the front line alone — the
    // ranks behind are the reading receding, not seven instruments.
    clear(baseLayer);
    baseLayer.appendChild(line(0, baseY, W, baseY, 0.12));
    for (let x = 64; x <= W - 32; x += 64) {
      baseLayer.appendChild(line(x, baseY, x, baseY + 4, 0.12));
    }
  }

  function drawTrace(W, H) {
    const baseY = H - CHROMA_BASE;
    // Edge to edge: the trace is a reading of the whole width of the
    // page, so it shouldn't stop short of either side.
    const left = 0, right = W;
    let d = "";
    for (let x = left; x <= right; x += CHROMA_STEP) {
      let y = baseY;
      for (let i = 0; i < peaks.length; i++) {
        const peak = peaks[i];
        const dx = (x - peak.x) / CHROMA_WIDTH;
        if (dx > 4 || dx < -4) continue;
        y -= peak.height * Math.exp(-dx * dx);
      }
      y -= Math.sin(x * 0.21) * 0.7 + Math.sin(x * 0.07) * 0.5; // instrument noise
      d += (d ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
    }
    trace.setAttribute("d", d);
  }

  // ============================================================
  // LOOP
  // ============================================================
  // Redrawn every frame rather than a few times a second: the peaks
  // are easing towards their targets now, and easing only looks like
  // easing if it's actually drawn at the rate the screen refreshes.
  function frame() {
    requestAnimationFrame(frame);

    const readout = window.__mapReadout;
    if (!readout || !readout.nodes || !readout.nodes.length) return;

    // It belongs to the third slide, gets out of the way entirely
    // while a preview window is open, and is the first thing to go
    // when the map starts collapsing on the way back up.
    const exit = window.__exit || 0;
    // Gone by the time the collapse is a third done, so it clearly
    // leads the way out rather than fading along with everything else.
    const leaving = Math.max(0, 1 - exit * 3);
    const shown = readout.previewOpen
      ? 0
      : Math.max(0, (readout.arrival - 0.45) / 0.55) * leaving;
    svg.style.opacity = shown.toFixed(3);
    if (shown < 0.01) return;

    const W = window.innerWidth, H = window.innerHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    if (W !== laidOutW || H !== laidOutH) {
      laidOutW = W;
      laidOutH = H;
      layout(W, H);
    }

    updatePeaks(readout.nodes, readout.activeIndex);
    drawTrace(W, H);
  }
  requestAnimationFrame(frame);
})();
