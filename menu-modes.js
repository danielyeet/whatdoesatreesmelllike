// ============================================================
// HOW THE MENU OPENS, PER SLIDE (index.html only)
//
// nav.js builds one menu and uses it everywhere on the site. On
// the landing page it opens differently depending on which of the
// three slides you are looking at, and this file is the whole of
// that difference. Delete it and its <script> tag and the menu
// falls back to the plain overlay nav.js provides.
//
//   slide 1 (title)    a line is drawn just above the title and
//                      climbs; the page then sinks away below it,
//                      stretching the line rather than moving it;
//                      at the top the line turns aside and frays
//                      into one strand per menu item
//   slide 2 (the line) the menu arrives from the side, pushing the
//                      line on that slide across ahead of it
//   slide 3 (the map)  the page turns inside out, the map falls
//                      into its centre, and the menu items come
//                      back out of it
//
// It works by putting a class on the overlay nav.js already made
// (mode-title / mode-side / mode-map) and letting style.css do the
// movement, plus the drawing and the map's part, which need JS.
//
// Nothing drawn here is ever laid over a menu word: both line
// layers are masked, with the words themselves punched out, so a
// line that would cross one passes behind it instead.
// ============================================================
(function () {
  const overlay = document.getElementById("site-menu-overlay");
  const container = document.getElementById("scroll-container");
  if (!overlay || !container) return; // not the landing page

  const list = overlay.querySelector(".menu-list");
  const items = Array.from(list.querySelectorAll("li"));
  if (!items.length) return;

  const titleContent = document.querySelector(".title-content");
  const titleHeading = titleContent ? titleContent.querySelector("h1") || titleContent : null;
  // Everything on the title slide that sinks as the page is drawn down.
  const titleSinkers = [
    titleContent,
    document.querySelector(".title-block"),
    document.getElementById("scroll-cue"),
  ].filter(Boolean);
  const introContent = document.querySelector(".intro-content");
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The title and the corner block arrive with a keyframe animation
  // whose fill is "both", so it keeps hold of transform and opacity for
  // the life of the element. That has to be let go of before either can
  // sink, and let go of a moment beforehand: dropped in the same breath
  // as setting where they sink to, there is nothing to move away from
  // and they jump there instead. So this runs them to their end and
  // detaches them, and the caller reads the page back before setting
  // the sink itself.
  function settleRise(el) {
    if (el.getAnimations) el.getAnimations().forEach((a) => a.finish());
    el.classList.add("rise-done");
  }

  const MODES = ["mode-title", "mode-side", "mode-map"];
  const NS = "http://www.w3.org/2000/svg";

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = (v) => 1 - Math.pow(1 - v, 3);

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  /** The x/y translation an element is currently carrying, in pixels. */
  function translateOf(el) {
    const value = getComputedStyle(el).transform;
    if (!value || value === "none") return { x: 0, y: 0 };
    const flat = value.match(/^matrix\(([^)]+)\)$/);
    if (flat) {
      const p = flat[1].split(",").map(Number);
      return { x: p[4] || 0, y: p[5] || 0 };
    }
    const deep = value.match(/^matrix3d\(([^)]+)\)$/);
    if (deep) {
      const p = deep[1].split(",").map(Number);
      return { x: p[12] || 0, y: p[13] || 0 };
    }
    return { x: 0, y: 0 };
  }

  // ============================================================
  // THE WORDS
  //
  // Where each menu word sits in the overlay's own coordinates —
  // which are the window's, since the panel covers it exactly.
  // "resting" measures through whatever transform the word and the
  // panel are part-way through, so it can be asked at any moment and
  // still answer where the word is going to end up; "live" is simply
  // where it is right now.
  // ============================================================
  function wordBoxes(resting) {
    const panel = overlay.getBoundingClientRect();
    return items.map((li) => {
      const box = li.querySelector("a").getBoundingClientRect();
      const shift = resting ? translateOf(li) : { x: 0, y: 0 };
      return {
        x: box.left - panel.left - shift.x,
        y: box.top - panel.top - shift.y,
        w: box.width,
        h: box.height,
      };
    });
  }

  // The clearance left around a word when it is punched out of a line
  // layer, so lines stop short of the letters rather than touching them.
  const WORD_PAD_X = 12;
  const WORD_PAD_Y = 5;

  /**
   * Wraps an SVG's drawing in a mask with every menu word knocked out
   * of it. Returns the group to draw into and the knockout rectangles,
   * which the caller keeps in step with the words as they move.
   */
  function maskedLayer(svg, id) {
    const region = { x: "-20%", y: "-20%", width: "140%", height: "140%" };
    const defs = svgEl("defs", {});
    const mask = svgEl("mask", Object.assign({ id: id, maskUnits: "userSpaceOnUse" }, region));
    mask.appendChild(svgEl("rect", Object.assign({ fill: "#fff" }, region)));
    const holes = items.map(() => {
      const hole = svgEl("rect", { fill: "#000" });
      mask.appendChild(hole);
      return hole;
    });
    defs.appendChild(mask);
    svg.appendChild(defs);
    const group = svgEl("g", { mask: "url(#" + id + ")" });
    svg.appendChild(group);
    return { holes: holes, group: group };
  }

  function setHoles(holes, boxes) {
    holes.forEach((hole, i) => {
      const box = boxes[i];
      hole.setAttribute("x", (box.x - WORD_PAD_X).toFixed(1));
      hole.setAttribute("y", (box.y - WORD_PAD_Y).toFixed(1));
      hole.setAttribute("width", (box.w + WORD_PAD_X * 2).toFixed(1));
      hole.setAttribute("height", (box.h + WORD_PAD_Y * 2).toFixed(1));
    });
  }

  // ============================================================
  // SLIDE 1 — the line that climbs, stretches, and frays
  //
  // One line, drawn a little above the title, growing upwards. The
  // page then sinks away below it: the foot of the line stays with
  // the title, so the line lengthens instead of travelling, which is
  // what makes the page look as though it is being drawn downwards
  // past a line that is standing still. At the top the line turns
  // aside into the margin and splits into one strand per menu item,
  // each dropping down its own lane to its word.
  //
  // The layer is fixed to the window rather than living inside the
  // panel: the panel spends this whole sequence sliding down from
  // above the window, so anything inside it would still be off the
  // top of the screen while the line is supposed to be climbing.
  // ============================================================
  const GAP = 14;           // between the title and the foot of the line
  const RISE_MS = 230;      // the climb
  const ARM_AT = 200;       // when the top of it turns aside
  const ARM_MS = 240;
  const SPLIT_AT = 380;     // when the strands start running down
  const SPLIT_MS = 280;
  const SPLIT_STAGGER = 30; // one after the next, not all at once
  const FOOT_AT = 520;      // when the foot follows the page off the bottom
  const FOOT_MS = 340;
  const FAN_MS = Math.max(
    SPLIT_AT + SPLIT_STAGGER * (items.length - 1) + SPLIT_MS,
    FOOT_AT + FOOT_MS
  );
  const FADE_MS = 340;      // how long it takes to leave, on closing
  // The words arrive on their own staggered transitions, so they are
  // still moving well after the lines have finished. Both layers keep
  // their knockouts in step with them until then, or a word would spend
  // its arrival a little below the gap left for it.
  const SETTLE_MS = 1600;

  const fan = svgEl("svg", { class: "menu-fan", "aria-hidden": "true" });
  const fanLayer = maskedLayer(fan, "menu-fan-mask");
  const trunk = svgEl("path", { class: "menu-fan-trunk" });
  fanLayer.group.appendChild(trunk);
  const fanPaths = items.map(() => {
    const path = svgEl("path", { class: "menu-fan-line" });
    fanLayer.group.appendChild(path);
    return path;
  });
  document.body.appendChild(fan);

  let fanGeo = null;
  let fanFrame = 0;
  let fanStart = 0;
  let fanClear = 0;

  function measureFan() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    fan.setAttribute("viewBox", "0 0 " + W + " " + H);

    const boxes = wordBoxes(true);
    const lefts = boxes.map((b) => b.x);
    const endX = Math.min.apply(null, lefts) - 14;
    const firstTop = Math.min.apply(null, boxes.map((b) => b.y));

    const head = titleHeading ? titleHeading.getBoundingClientRect() : null;
    const cx = head ? head.left + head.width / 2 : W / 2;
    const titleTop = head ? head.top : H * 0.44;

    // Where the line turns aside. Kept above the first word by a clear
    // margin, so neither the turn nor the strands' run down the margin
    // has to cross anything.
    const splitY = Math.max(H * 0.06, Math.min(titleTop - H * 0.22, firstTop - 34));

    // Each strand drops down its own lane in the margin beside the
    // words. On a narrow window there is less margin to share out, so
    // the lanes close up rather than running off the edge.
    const laneStep = Math.max(1.5, Math.min(5, (endX - 8) / items.length));
    const laneBase = endX - 4;

    fanGeo = { W: W, H: H, cx: cx, splitY: splitY, laneBase: laneBase };

    boxes.forEach((box, i) => {
      const laneX = Math.max(3, laneBase - i * laneStep);
      const cy = box.y + box.h / 2;
      const turnY = Math.min(splitY + 20, cy - 16);
      const corner = Math.max(0, Math.min(9, (endX - laneX) * 0.6, (cy - turnY) * 0.5));

      let d =
        "M " + laneBase.toFixed(1) + " " + splitY.toFixed(1) +
        " C " + laneBase.toFixed(1) + " " + (splitY + 10).toFixed(1) +
        ", " + laneX.toFixed(1) + " " + (splitY + 6).toFixed(1) +
        ", " + laneX.toFixed(1) + " " + turnY.toFixed(1);
      if (corner > 0.5) {
        d +=
          " L " + laneX.toFixed(1) + " " + (cy - corner).toFixed(1) +
          " Q " + laneX.toFixed(1) + " " + cy.toFixed(1) +
          " " + (laneX + corner).toFixed(1) + " " + cy.toFixed(1) +
          " L " + endX.toFixed(1) + " " + cy.toFixed(1);
      } else {
        d +=
          " L " + laneX.toFixed(1) + " " + cy.toFixed(1) +
          " L " + endX.toFixed(1) + " " + cy.toFixed(1);
      }

      fanPaths[i].setAttribute("d", d);
      // Drawn on by dashing each strand with its own length and sliding
      // the dash into place — the classic trick, driven frame by frame
      // here rather than by a transition, so the strands can be held
      // back until the line above them has finished turning aside.
      const length = fanPaths[i].getTotalLength();
      fanPaths[i].style.strokeDasharray = length + " " + length;
      fanPaths[i].style.strokeDashoffset = String(length);
    });
  }

  function drawTrunk(t) {
    const geo = fanGeo;
    const head = titleHeading ? titleHeading.getBoundingClientRect() : null;
    // Read live, so the foot of the line goes on following the title
    // down for as long as the title is sinking — and then off the bottom
    // of the window with it, rather than stopping in mid-air at
    // whatever height the title happened to leave from.
    const held = (head ? head.top : geo.H * 0.44) - GAP;
    const gone = ease(clamp01((t - FOOT_AT) / FOOT_MS));
    const rootY = held + (geo.H + 24 - held) * gone;
    const tipY = rootY + (geo.splitY - rootY) * ease(clamp01(t / RISE_MS));
    const armAt = ease(clamp01((t - ARM_AT) / ARM_MS));
    const armX = geo.cx + (geo.laneBase - geo.cx) * armAt;
    const corner = Math.max(0, Math.min(14, (geo.cx - armX) * 0.5, (rootY - geo.splitY) * 0.5));

    let d = "M " + geo.cx.toFixed(1) + " " + rootY.toFixed(1);
    if (corner < 1) {
      d += " L " + geo.cx.toFixed(1) + " " + tipY.toFixed(1);
    } else {
      d +=
        " L " + geo.cx.toFixed(1) + " " + (geo.splitY + corner).toFixed(1) +
        " Q " + geo.cx.toFixed(1) + " " + geo.splitY.toFixed(1) +
        " " + (geo.cx - corner).toFixed(1) + " " + geo.splitY.toFixed(1) +
        " L " + armX.toFixed(1) + " " + geo.splitY.toFixed(1);
    }
    trunk.setAttribute("d", d);
  }

  function drawStrands(t) {
    fanPaths.forEach((path, i) => {
      const own = ease(clamp01((t - SPLIT_AT - i * SPLIT_STAGGER) / SPLIT_MS));
      const length = parseFloat(path.style.strokeDasharray) || 0;
      path.style.strokeDashoffset = (length * (1 - own)).toFixed(2);
    });
  }

  function stepFan(now) {
    const t = Math.min(now - fanStart, FAN_MS);
    drawTrunk(t);
    drawStrands(t);
    setHoles(fanLayer.holes, wordBoxes(false));
    if (now - fanStart < SETTLE_MS) fanFrame = requestAnimationFrame(stepFan);
  }

  function runFan() {
    cancelAnimationFrame(fanFrame);
    clearTimeout(fanClear);
    measureFan();
    fan.classList.add("lit");
    fanStart = performance.now();
    fanFrame = requestAnimationFrame(stepFan);
  }

  function stopFan() {
    cancelAnimationFrame(fanFrame);
    clearTimeout(fanClear);
    fan.classList.remove("lit");
    // Emptied only once it has faded, so it doesn't blink out while it
    // is still on screen.
    fanClear = setTimeout(() => {
      trunk.setAttribute("d", "M 0 -10");
      fanPaths.forEach((path) => {
        path.style.strokeDashoffset = String(parseFloat(path.style.strokeDasharray) || 0);
      });
    }, FADE_MS);
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
  const rayLayer = maskedLayer(rays, "menu-ray-mask");
  const rayLines = items.map(() => {
    const line = svgEl("line", { class: "menu-ray" });
    rayLayer.group.appendChild(line);
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
    const panel = overlay.getBoundingClientRect();
    const originX = hubX - panel.left;
    const originY = hubY - panel.top;

    const boxes = wordBoxes(false);
    boxes.forEach((box, i) => {
      // Land on the left edge of the word, halfway up it.
      const endX = box.x - 14;
      const endY = box.y + box.h / 2;
      // Each one reaches out of the centre in turn rather than all
      // seven arriving at once.
      const own = Math.max(0, Math.min(1, amount * items.length - i * 0.55));
      rayLines[i].setAttribute("x1", originX.toFixed(1));
      rayLines[i].setAttribute("y1", originY.toFixed(1));
      rayLines[i].setAttribute("x2", (originX + (endX - originX) * own).toFixed(1));
      rayLines[i].setAttribute("y2", (originY + (endY - originY) * own).toFixed(1));
      rayLines[i].style.strokeOpacity = (0.5 * Math.min(1, own * 2)).toFixed(3);
    });
    // A ray on its way out to one word crosses the words above it. The
    // knockout is what keeps it off them: it passes behind each one and
    // comes out the other side.
    setHoles(rayLayer.holes, boxes);
  }

  let rayFrame = 0;
  let rayStart = 0;
  const RAY_MS = 700;

  function runRays(forward) {
    cancelAnimationFrame(rayFrame);
    rayStart = performance.now();
    // Going out, it keeps running after the rays have landed, to hold
    // the knockouts against the words while they are still arriving.
    const until = forward ? SETTLE_MS : RAY_MS;
    const step = (now) => {
      const t = Math.min(1, (now - rayStart) / RAY_MS);
      drawRays(forward ? t : 1 - t);
      if (now - rayStart < until) rayFrame = requestAnimationFrame(step);
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

    // The panel's arrival is a transition between its closed and open
    // positions, and those differ per mode — so the mode has to be on
    // the element, and settled there, before "open" goes back on.
    // Switching mode is itself a change of transform, though, so it has
    // to be made with transitions off and then read back: left to
    // animate, it would eat the whole transition travelling to the
    // closed position, and the panel would appear where it was supposed
    // to have arrived rather than arriving at all.
    overlay.classList.add("no-anim");
    overlay.classList.remove("open");
    MODES.forEach((m) => overlay.classList.remove(m));
    document.body.classList.remove("menu-invert");
    overlay.classList.add(mode);
    if (mode === "mode-title") titleSinkers.forEach(settleRise);
    // One read of the page settles both: the panel into this mode's
    // closed position, and the title slide into its resting one.
    void overlay.offsetHeight;
    overlay.classList.remove("no-anim");
    overlay.classList.add("open");

    if (mode === "mode-title") {
      titleSinkers.forEach((el) => el.classList.add("title-sinking"));
      runFan();
    }

    if (mode === "mode-side" && introContent) introContent.classList.add("intro-shifting");

    if (mode === "mode-map") {
      document.body.classList.add("menu-invert");
      runMapCollapse(true, 620);
      setTimeout(() => runRays(true), 380);
    }
  }

  function close() {
    titleSinkers.forEach((el) => el.classList.remove("title-sinking"));
    if (introContent) introContent.classList.remove("intro-shifting");
    if (overlay.classList.contains("mode-map")) {
      runMapCollapse(false, 620);
      runRays(false);
      // Held until the panel itself has faded, so the page doesn't snap
      // back to white underneath a menu that is still on screen.
      setTimeout(() => document.body.classList.remove("menu-invert"), 620);
    }
    stopFan();
  }

  window.addEventListener("menu:open", open);
  window.addEventListener("menu:close", close);
  window.addEventListener("resize", () => {
    if (!overlay.classList.contains("open")) return;
    if (!overlay.classList.contains("mode-title")) return;
    // Redrawn where the window now is, already finished — there is
    // nothing to be gained from replaying it mid-resize.
    cancelAnimationFrame(fanFrame);
    measureFan();
    drawTrunk(FAN_MS);
    drawStrands(FAN_MS);
    setHoles(fanLayer.holes, wordBoxes(false));
  });
})();
