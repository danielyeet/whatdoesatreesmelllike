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
  const CHROMA_PEAK = 96;        // how tall the tallest peak can run
  const CHROMA_WIDTH = 42;       // peak width in pixels
  const CHROMA_STEP = 4;         // sampling along the trace
  const CHROMA_HOVER_BOOST = 1.45; // how much taller the hovered node's own peak grows

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  const svg = el("svg", { "aria-hidden": "true" });
  svg.style.position = "fixed";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "6";       // over the map, under the menu
  svg.style.opacity = "0";
  document.body.appendChild(svg);

  const gChroma = el("g", {});
  svg.appendChild(gChroma);

  function clear(group) { while (group.firstChild) group.removeChild(group.firstChild); }

  function line(x1, y1, x2, y2, alpha, width) {
    return el("line", {
      x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
      stroke: INK + alpha + ")", "stroke-width": width || 1,
    });
  }
  function text(x, y, str, alpha, size, anchor) {
    const t = el("text", {
      x: x.toFixed(1), y: y.toFixed(1), fill: INK + alpha + ")",
      "font-family": '"IBM Plex Mono", ui-monospace, monospace',
      "font-size": size || 9, "letter-spacing": "0.14em",
      "text-anchor": anchor || "middle",
    });
    t.textContent = str;
    return t;
  }

  // ============================================================
  // CHROMATOGRAM
  // ============================================================
  function drawChromatogram(nodes, W, H, activeIndex) {
    const baseY = H - CHROMA_BASE;
    const left = 64, right = W - 64;
    let d = "";
    for (let x = left; x <= right; x += CHROMA_STEP) {
      let y = baseY;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = (x - n.x) / CHROMA_WIDTH;
        if (dx > 4 || dx < -4) continue;
        let height = CHROMA_PEAK * (1 - n.depth) * (1 - n.depth);
        // A flat multiplier alone would be invisible on a node that's
        // currently far away and already reading as barely a bump, so
        // hovering guarantees a real peak (a floor), not just a bigger
        // fraction of whatever was already there.
        if (i === activeIndex) height = Math.max(height * CHROMA_HOVER_BOOST, CHROMA_PEAK * 0.4);
        y -= height * Math.exp(-dx * dx);
      }
      y -= Math.sin(x * 0.21) * 0.7 + Math.sin(x * 0.07) * 0.5; // instrument noise
      d += (d ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
    }
    gChroma.appendChild(el("path", {
      d: d, fill: "none", stroke: INK + "0.3)", "stroke-width": 1,
    }));
    gChroma.appendChild(line(left, baseY, right, baseY, 0.12));
    for (let x = left; x <= right; x += 64) {
      gChroma.appendChild(line(x, baseY, x, baseY + 4, 0.12));
    }
    gChroma.appendChild(text(left, baseY + 18, "RETENTION", 0.26, 8.5, "start"));
    gChroma.appendChild(text(right, baseY + 18, "ABUNDANCE", 0.26, 8.5, "end"));
  }

  // ============================================================
  // LOOP
  // ============================================================
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 50) return;   // 20fps is plenty for something this quiet
    last = now;

    const readout = window.__mapReadout;
    if (!readout || !readout.nodes || !readout.nodes.length) return;

    // It belongs to the third slide, and it gets out of the way
    // entirely while a preview window is open.
    const shown = readout.previewOpen ? 0 : Math.max(0, (readout.arrival - 0.45) / 0.55);
    svg.style.opacity = shown.toFixed(3);
    if (shown < 0.01) return;

    const W = window.innerWidth, H = window.innerHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    clear(gChroma);
    drawChromatogram(readout.nodes, W, H, readout.activeIndex);
  }
  requestAnimationFrame(frame);
})();
