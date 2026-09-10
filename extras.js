// ============================================================
// EXTRAS (index.html only)
// Optional furniture drawn around the node map. Nothing in here
// is load-bearing: switch it all off, or delete the file and its
// <script> tag from index.html, and the site is unchanged.
//
// ------------------------------------------------------------
// HOW TO SWITCH THEM
// Change true/false below, save, reload. Any combination works,
// including all three off.
//
//   dimensions     ARCHITECTURE — dimension strings around the rim
//   orthographics  ARCHITECTURE — plan and elevation, in the corners
//   chromatogram   PERFUME — a gas-chromatograph trace along the foot
//
// To compare the two architectural ideas, run one, then the other:
//   dimensions: true,  orthographics: false   <- what you're seeing
//   dimensions: false, orthographics: true
//   dimensions: false, orthographics: false   <- neither
// ------------------------------------------------------------
const EXTRAS = {
  dimensions: false,
  orthographics: true,
  chromatogram: false,
};

(function () {
  if (!EXTRAS.dimensions && !EXTRAS.orthographics && !EXTRAS.chromatogram) return;

  const NS = "http://www.w3.org/2000/svg";
  const INK = "rgba(23,23,15,";

  // --- dimensions
  const DIM_OFFSET = 34;        // how far outside the nodes the strings sit
  const DIM_MIN_SPAN = 120;     // shorter than this on screen and it's left out
  const DIM_MAX = 4;            // never more than this many at once
  const DIM_CLEARANCE = 0.55;   // a string must stay this far out, or it cuts the map in half
  const DIM_UNITS = 1000;       // scene units are arbitrary; this reads as mm

  // --- orthographics
  const ORTHO_SIZE = 132;
  const ORTHO_MARGIN = 42;
  const ORTHO_TOP = 96;         // clears the Menu button

  // --- chromatogram
  const CHROMA_BASE = 52;       // height of the baseline above the foot
  const CHROMA_PEAK = 96;       // how tall the tallest peak can run
  const CHROMA_WIDTH = 42;      // peak width in pixels
  const CHROMA_STEP = 4;        // sampling along the trace

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

  const gDim = el("g", {});
  const gOrtho = el("g", {});
  const gChroma = el("g", {});
  svg.appendChild(gDim);
  svg.appendChild(gOrtho);
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
  // DIMENSION STRINGS
  // Between each pair of nodes that are currently neighbours around
  // the rim. Which pair that is changes as the map turns, but the
  // number on each string doesn't: it's the true distance through
  // the constellation, not the flattened one you happen to see.
  // ============================================================
  // How close a segment passes to a point.
  function segmentDistance(px, py, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    let t = ((px - a.x) * vx + (py - a.y) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + vx * t), py - (a.y + vy * t));
  }

  function drawDimensions(nodes, hubX, hubY) {
    const ordered = nodes
      .map((n, i) => ({ n: n, a: Math.atan2(n.y - hubY, n.x - hubX) }))
      .sort((p, q) => p.a - q.a)
      .map((p) => p.n);

    const pairs = [];
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i], b = ordered[(i + 1) % ordered.length];
      const span = Math.hypot(b.x - a.x, b.y - a.y);
      if (span < DIM_MIN_SPAN) continue;
      // Two nodes can be neighbours by angle and still sit almost
      // opposite each other, in which case the string between them
      // runs straight through the diagram. Keep only the ones whose
      // chord stays out near the rim where the empty space is.
      const rim = Math.min(
        Math.hypot(a.x - hubX, a.y - hubY),
        Math.hypot(b.x - hubX, b.y - hubY));
      if (segmentDistance(hubX, hubY, a, b) < rim * DIM_CLEARANCE) continue;
      pairs.push({ a: a, b: b, span: span });
    }
    pairs.sort((p, q) => q.span - p.span);

    pairs.slice(0, DIM_MAX).forEach((pair) => {
      const a = pair.a, b = pair.b;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      let ox = mx - hubX, oy = my - hubY;
      const olen = Math.hypot(ox, oy) || 1;
      ox = (ox / olen) * DIM_OFFSET; oy = (oy / olen) * DIM_OFFSET;

      const ax = a.x + ox, ay = a.y + oy;
      const bx = b.x + ox, by = b.y + oy;

      // extension lines, back to the nodes themselves
      gDim.appendChild(line(a.x + ox * 0.25, a.y + oy * 0.25, ax + ox * 0.22, ay + oy * 0.22, 0.13));
      gDim.appendChild(line(b.x + ox * 0.25, b.y + oy * 0.25, bx + ox * 0.22, by + oy * 0.22, 0.13));
      gDim.appendChild(line(ax, ay, bx, by, 0.24));

      // the 45-degree ticks a drafter would put at each end
      let tx = bx - ax, ty = by - ay;
      const tlen = Math.hypot(tx, ty) || 1;
      tx /= tlen; ty /= tlen;
      const kx = (tx + -ty) * 5, ky = (ty + tx) * 5;
      gDim.appendChild(line(ax - kx, ay - ky, ax + kx, ay + ky, 0.3));
      gDim.appendChild(line(bx - kx, by - ky, bx + kx, by + ky, 0.3));

      const trueSpan = Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz);
      const label = text(mx + ox * 1.2, my + oy * 1.2 - 3, String(Math.round(trueSpan * DIM_UNITS)), 0.34, 9);
      // keep the number the right way up whichever side of the map it's on
      let angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      label.setAttribute("transform",
        "rotate(" + angle.toFixed(1) + " " + (mx + ox * 1.2).toFixed(1) + " " + (my + oy * 1.2 - 3).toFixed(1) + ")");
      gDim.appendChild(label);
    });
  }

  // ============================================================
  // PLAN AND ELEVATION
  // The same constellation flattened two ways: looked down on, and
  // looked at straight from the front. Both turn with it, because
  // they're drawn from its world positions rather than its own.
  // ============================================================
  function drawOrtho(nodes, radius, boxX, boxY, title, pick) {
    const half = ORTHO_SIZE / 2;
    const cx = boxX + half, cy = boxY + half;
    const scale = (half * 0.78) / (radius || 1);

    gOrtho.appendChild(el("rect", {
      x: boxX, y: boxY, width: ORTHO_SIZE, height: ORTHO_SIZE,
      fill: "none", stroke: INK + "0.16)", "stroke-width": 1,
    }));
    gOrtho.appendChild(text(boxX + 6, boxY - 7, title, 0.3, 8.5, "start"));

    // centre marks, the way a drawing indicates an axis
    gOrtho.appendChild(line(cx - 7, cy, cx + 7, cy, 0.14));
    gOrtho.appendChild(line(cx, cy - 7, cx, cy + 7, 0.14));

    nodes.forEach((n) => {
      const flat = pick(n);
      const px = cx + flat[0] * scale;
      const py = cy - flat[1] * scale;
      gOrtho.appendChild(line(cx, cy, px, py, 0.18));
      gOrtho.appendChild(el("rect", {
        x: (px - 2.5).toFixed(1), y: (py - 2.5).toFixed(1), width: 5, height: 5,
        fill: INK + "0.55)",
      }));
    });
    gOrtho.appendChild(el("rect", {
      x: (cx - 2).toFixed(1), y: (cy - 2).toFixed(1), width: 4, height: 4, fill: INK + "0.8)",
    }));
  }

  // ============================================================
  // CHROMATOGRAM
  // A trace along the foot of the page, the way a gas chromatograph
  // reads out a smell: one peak per node, taller the nearer that
  // node is to you, sliding along as the map turns. It is a reading
  // of the constellation, not decoration laid beside it.
  // ============================================================
  function drawChromatogram(nodes, W, H) {
    const baseY = H - CHROMA_BASE;
    const left = 64, right = W - 64;
    let d = "";
    for (let x = left; x <= right; x += CHROMA_STEP) {
      let y = baseY;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = (x - n.x) / CHROMA_WIDTH;
        if (dx > 4 || dx < -4) continue;
        const height = CHROMA_PEAK * (1 - n.depth) * (1 - n.depth);
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

    const nodes = readout.nodes;
    clear(gDim); clear(gOrtho); clear(gChroma);

    if (EXTRAS.dimensions) drawDimensions(nodes, readout.hubX, readout.hubY);
    if (EXTRAS.orthographics) {
      drawOrtho(nodes, readout.radius, ORTHO_MARGIN, ORTHO_TOP, "PLAN",
        (n) => [n.wx, n.wz]);
      drawOrtho(nodes, readout.radius, W - ORTHO_MARGIN - ORTHO_SIZE, ORTHO_TOP, "ELEVATION",
        (n) => [n.wx, n.wy]);
    }
    if (EXTRAS.chromatogram) drawChromatogram(nodes, W, H);
  }
  requestAnimationFrame(frame);
})();
