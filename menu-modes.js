// ============================================================
// HOW THE MENU OPENS, PER SLIDE (index.html only)
//
// nav.js builds one menu and uses it everywhere on the site. On
// the landing page it opens differently depending on which of the
// three slides you are looking at, and this file is the whole of
// that difference. Delete it and its <script> tag and the menu
// falls back to the plain overlay nav.js provides.
//
//   slide 1 (title)    a line rises out of the title and splits
//                      into one strand per menu item, while the
//                      title itself sinks away below
//   slide 2 (the line) the menu arrives from the side
//   slide 3 (the map)  the page turns inside out, the map falls
//                      into its centre, and the menu items come
//                      back out of it
//
// It works by putting a class on the overlay nav.js already made
// (mode-title / mode-side / mode-map) and letting style.css do the
// movement, plus the drawing and the map's part, which need JS.
// ============================================================
(function () {
  const overlay = document.getElementById("site-menu-overlay");
  const container = document.getElementById("scroll-container");
  if (!overlay || !container) return; // not the landing page

  const list = overlay.querySelector(".menu-list");
  const items = Array.from(list.querySelectorAll("li"));
  const titleContent = document.querySelector(".title-content");
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MODES = ["mode-title", "mode-side", "mode-map"];
  const NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  // ============================================================
  // SLIDE 1 — the line that splits
  //
  // One strand leaves the title going up, then divides once per
  // menu item and each branch runs to its own. The same idea as
  // the map on slide 3, flattened right down: no depth, no
  // turning, just a line that forks.
  // ============================================================
  const fan = svgEl("svg", { class: "menu-fan", "aria-hidden": "true" });
  const fanPaths = items.map(() => {
    const path = svgEl("path", { class: "menu-fan-line" });
    fan.appendChild(path);
    return path;
  });
  overlay.insertBefore(fan, overlay.firstChild);

  function drawFan() {
    const width = overlay.clientWidth;
    const height = overlay.clientHeight;
    fan.setAttribute("viewBox", "0 0 " + width + " " + height);

    // Where the strand arrives from: the bottom of the panel, on the
    // centre line, which is where the title's own line was heading.
    const rootX = width / 2;
    const rootY = height;
    // Where it starts dividing. Above that point it is one line.
    const splitY = height * 0.62;

    items.forEach((li, i) => {
      const link = li.querySelector("a");
      const box = link.getBoundingClientRect();
      const overlayBox = overlay.getBoundingClientRect();
      // Land on the left edge of the word, halfway up it.
      const endX = box.left - overlayBox.left - 14;
      const endY = box.top - overlayBox.top + box.height / 2;

      // Straight up the middle, then a single curve out to the word,
      // so every strand leaves the trunk at the same place.
      fanPaths[i].setAttribute(
        "d",
        "M " + rootX.toFixed(1) + " " + rootY.toFixed(1) +
        " L " + rootX.toFixed(1) + " " + splitY.toFixed(1) +
        " C " + rootX.toFixed(1) + " " + (splitY - (splitY - endY) * 0.45).toFixed(1) +
        ", " + (endX + (rootX - endX) * 0.35).toFixed(1) + " " + endY.toFixed(1) +
        ", " + endX.toFixed(1) + " " + endY.toFixed(1)
      );
      // Each strand draws itself on, one after the next, using the
      // classic trick of dashing the line with its own length and
      // sliding the dash into place.
      const length = fanPaths[i].getTotalLength();
      fanPaths[i].style.strokeDasharray = length + " " + length;
      fanPaths[i].style.strokeDashoffset = String(length);
      fanPaths[i].style.transitionDelay = (0.12 + i * 0.05).toFixed(2) + "s";
    });
  }

  function releaseFan() {
    fanPaths.forEach((path) => { path.style.strokeDashoffset = "0"; });
  }

  function resetFan() {
    fanPaths.forEach((path) => {
      const length = path.getTotalLength ? path.getTotalLength() : 0;
      path.style.strokeDashoffset = String(length);
    });
  }

  // ============================================================
  // SLIDE 3 — the map turns inside out
  //
  // node-scene.js does the work: __menuCollapse pulls the map into
  // its centre exactly the way leaving the page does, and inverts
  // its colours on the way. What's added here is the seven items
  // coming back out of that centre, drawn as plain lines so this
  // stays a flat, simple echo of the map rather than a second one.
  // ============================================================
  const rays = svgEl("svg", { class: "menu-rays", "aria-hidden": "true" });
  const rayLines = items.map(() => {
    const line = svgEl("line", { class: "menu-ray" });
    rays.appendChild(line);
    return line;
  });
  overlay.insertBefore(rays, overlay.firstChild);

  function drawRays(amount) {
    const width = overlay.clientWidth;
    const height = overlay.clientHeight;
    rays.setAttribute("viewBox", "0 0 " + width + " " + height);

    const readout = window.__mapReadout;
    const hubX = readout && readout.hubX !== undefined ? readout.hubX : width / 2;
    const hubY = readout && readout.hubY !== undefined ? readout.hubY : height / 2;
    const overlayBox = overlay.getBoundingClientRect();
    const originX = hubX - overlayBox.left;
    const originY = hubY - overlayBox.top;

    items.forEach((li, i) => {
      const link = li.querySelector("a");
      const box = link.getBoundingClientRect();
      const endX = box.left - overlayBox.left - 14;
      const endY = box.top - overlayBox.top + box.height / 2;
      // Each one reaches out of the centre in turn rather than all
      // seven arriving at once.
      const own = Math.max(0, Math.min(1, amount * items.length - i * 0.55));
      rayLines[i].setAttribute("x1", originX.toFixed(1));
      rayLines[i].setAttribute("y1", originY.toFixed(1));
      rayLines[i].setAttribute("x2", (originX + (endX - originX) * own).toFixed(1));
      rayLines[i].setAttribute("y2", (originY + (endY - originY) * own).toFixed(1));
      rayLines[i].style.strokeOpacity = (0.5 * Math.min(1, own * 2)).toFixed(3);
    });
  }

  let rayFrame = 0;
  let rayStart = 0;
  const RAY_MS = 700;

  function runRays(forward) {
    cancelAnimationFrame(rayFrame);
    rayStart = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - rayStart) / RAY_MS);
      drawRays(forward ? t : 1 - t);
      if (t < 1) rayFrame = requestAnimationFrame(step);
    };
    rayFrame = requestAnimationFrame(step);
  }

  // The map's own part of this: the same collapse the page uses on the
  // way out, driven from here instead, plus the colour inversion.
  let mapFrame = 0;
  function runMapCollapse(forward, duration) {
    cancelAnimationFrame(mapFrame);
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / duration);
      window.__menuCollapse = forward ? t : 1 - t;
      if (t < 1) mapFrame = requestAnimationFrame(step);
      else if (!forward) window.__menuCollapse = 0;
    };
    mapFrame = requestAnimationFrame(step);
  }

  // ============================================================
  // OPENING AND CLOSING
  // ============================================================
  function modeFor(slide) {
    if (slide === 2) return "mode-map";
    if (slide === 1) return "mode-side";
    return "mode-title";
  }

  function open() {
    const slide = window.__slide || 0;
    const mode = REDUCE_MOTION ? "mode-side" : modeFor(slide);

    MODES.forEach((m) => overlay.classList.remove(m));
    document.body.classList.remove("menu-invert");
    overlay.classList.add(mode);

    if (mode === "mode-title") {
      if (titleContent) titleContent.classList.add("title-sinking");
      // Measured after the overlay has been told to open, so the links
      // are where they will finally be rather than where they started.
      requestAnimationFrame(() => {
        drawFan();
        requestAnimationFrame(releaseFan);
      });
    }

    if (mode === "mode-map") {
      document.body.classList.add("menu-invert");
      runMapCollapse(true, 620);
      setTimeout(() => runRays(true), 380);
    }
  }

  function close() {
    if (titleContent) titleContent.classList.remove("title-sinking");
    if (overlay.classList.contains("mode-map")) {
      runMapCollapse(false, 620);
      runRays(false);
      // Held until the panel itself has faded, so the page doesn't snap
      // back to white underneath a menu that is still on screen.
      setTimeout(() => document.body.classList.remove("menu-invert"), 620);
    }
    resetFan();
  }

  window.addEventListener("menu:open", open);
  window.addEventListener("menu:close", close);
  window.addEventListener("resize", () => {
    if (!overlay.classList.contains("open")) return;
    if (overlay.classList.contains("mode-title")) { drawFan(); releaseFan(); }
  });
})();
