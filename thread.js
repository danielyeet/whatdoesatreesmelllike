// ============================================================
// THE THREAD (index.html only)
// One straight line down the middle of the landing page: it
// leaves the title, meets the second slide's sentence, and picks
// up again below it to end on the centre of the node map. It is
// simply there — it does not draw itself as you scroll.
//
// What changes is its character on the last leg, and there are
// two versions of that. Change the line below and reload to
// compare them:
//
//   "dissolve"  the line breaks into dots on the same rhythm as
//               the map's own trails while progressively losing
//               lock, drifting and jittering like a trace coming
//               off frequency, then snapping still at the centre.
//
//   "fork"      the line stays clean and splits: one strand
//               becomes two, four, seven, fanning out and landing
//               on the centre from every side, so it turns into
//               the diagram's structure just before it arrives.
// ============================================================

const TRANSITION = "dissolve";

(function () {
  const container = document.getElementById("scroll-container");
  if (!container) return;

  const slides = Array.from(container.querySelectorAll(".slide"));
  const titleEl = document.querySelector(".title-content");
  const introEl = document.querySelector(".intro-lede");
  if (slides.length < 3 || !titleEl || !introEl) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  const GAP = 26;
  const FRAME_MS = 33;

  // "dissolve"
  const DOT_PITCH = 5.5;    // spacing once it has broken into dots
  const DRIFT = 10;         // how far off true it wanders at its worst
  const SAMPLE = 9;         // how finely the wandering leg is subdivided

  // "fork"
  const STRANDS = 7;
  const SPREAD = 190;       // how wide the fan opens
  const SPLIT_AT = 0.46;    // where down the leg it starts dividing
  const ORDER = [3, 2, 4, 1, 5, 0, 6]; // centre outward, so it opens symmetrically

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  const svg = svgEl("svg", { class: "thread", "aria-hidden": "true" });
  const toText = svgEl("line", { class: "thread-line" });
  svg.appendChild(toText);

  const forking = TRANSITION === "fork";
  const trunk = forking ? svgEl("line", { class: "thread-line" }) : null;
  const strands = [];
  const wander = forking ? null : svgEl("path", { class: "thread-line thread-wander" });

  if (forking) {
    svg.appendChild(trunk);
    for (let i = 0; i < STRANDS; i++) {
      const strand = svgEl("path", { class: "thread-line" });
      svg.appendChild(strand);
      strands.push(strand);
    }
  } else {
    svg.appendChild(wander);
  }

  // The line that reforms on the way back up. Once the map has fallen
  // into its centre, this grows from that sphere to the top of the
  // screen — drawing the way out before the page takes it.
  const reformLine = svgEl("line", { class: "thread-line thread-reform" });
  reformLine.style.strokeOpacity = "0";
  svg.appendChild(reformLine);

  container.insertBefore(svg, container.firstChild);

  let top0 = 0, bottom0 = 0, centreX = 0, centreY = 0;

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
    centreX = Math.round(width / 2);
    const title = place(titleEl);
    const intro = place(introEl);
    centreY = slides[2].offsetTop + slides[2].offsetHeight / 2;
    top0 = intro.bottom + GAP;
    bottom0 = centreY;

    toText.setAttribute("x1", centreX);
    toText.setAttribute("x2", centreX);
    toText.setAttribute("y1", title.bottom + GAP);
    toText.setAttribute("y2", intro.top - GAP);

    if (forking) {
      const splitY = top0 + (bottom0 - top0) * SPLIT_AT;
      trunk.setAttribute("x1", centreX);
      trunk.setAttribute("x2", centreX);
      trunk.setAttribute("y1", top0);
      trunk.setAttribute("y2", splitY);
    }
  }

  // ============================================================
  // "dissolve" — losing lock on the way down
  // ============================================================
  function drawWander(p, t) {
    const span = bottom0 - top0;
    let d = "M " + centreX + " " + top0;
    for (let y = top0 + SAMPLE; y <= bottom0; y += SAMPLE) {
      const depth = Math.min(1, (y - top0) / span);
      // Grows the further it gets from the sentence above, then goes
      // to nothing right at the end — it arrives dead centre.
      const settle = Math.min(1, (1 - depth) / 0.1);
      const envelope = Math.pow(depth, 1.3) * settle * p;
      const wave = Math.sin(depth * 41 + t * 7.5) * 0.55 + Math.sin(depth * 113 - t * 4) * 0.2;
      const noise = REDUCE_MOTION ? 0 : (Math.random() - 0.5) * 0.9;
      d += " L " + (centreX + envelope * DRIFT * (wave + noise)).toFixed(2) + " " + y.toFixed(1);
    }
    d += " L " + centreX + " " + bottom0.toFixed(1);
    wander.setAttribute("d", d);

    // and breaks into dots on the map's own rhythm as it goes
    const gap = DOT_PITCH * p;
    wander.style.strokeDasharray = Math.max(0.01, DOT_PITCH - gap).toFixed(2) + " " + gap.toFixed(2);
    wander.style.strokeOpacity = (0.26 * (1 - p * (0.1 + Math.random() * 0.22))).toFixed(3);
  }

  // ============================================================
  // "fork" — one strand becomes seven
  // ============================================================
  function drawFork(p) {
    const splitY = top0 + (bottom0 - top0) * SPLIT_AT;
    const span = bottom0 - splitY;
    const spread = SPREAD * Math.min(1, p / 0.85);

    for (let rank = 0; rank < STRANDS; rank++) {
      const i = ORDER[rank];
      const strand = strands[i];
      const lateral = ((i - (STRANDS - 1) / 2) / ((STRANDS - 1) / 2)) * spread;

      strand.setAttribute("d",
        "M " + centreX + " " + splitY.toFixed(1) +
        " C " + (centreX + lateral * 0.35).toFixed(1) + " " + (splitY + span * 0.34).toFixed(1) +
        ", " + (centreX + lateral).toFixed(1) + " " + (bottom0 - span * 0.42).toFixed(1) +
        ", " + centreX + " " + bottom0.toFixed(1));

      // The centre strand is the line itself and is always there; the
      // rest arrive in pairs outward from it.
      const appearsAt = rank === 0 ? -1 : 0.3 + rank * 0.085;
      const shown = rank === 0 ? 1 : Math.max(0, Math.min(1, (p - appearsAt) / 0.13));
      strand.style.strokeOpacity = (0.26 * shown).toFixed(3);
    }
  }

  // ============================================================
  // LOOP
  // ============================================================
  let last = 0;
  let clock = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    clock += (now - last) / 1000;
    last = now;

    const p = window.__p23 === undefined ? 0 : window.__p23;
    if (forking) drawFork(p);
    else drawWander(p, clock);
    drawReform();
  }

  // ============================================================
  // THE WAY BACK UP
  //
  // While the map collapses, the line that runs down into it goes with
  // it. Then this one draws itself from the sphere up to the top of the
  // screen, and only once it has arrived does landing.js scroll.
  // ============================================================
  function drawReform() {
    const collapse = (window.__mapReadout && window.__mapReadout.collapse) || 0;
    const reform = window.__reform || 0;

    // The legs above fade out as the collapse takes hold, so the
    // reforming line is the only one left by the time it appears.
    const fade = 1 - collapse;
    toText.style.strokeOpacity = (0.26 * fade).toFixed(3);
    if (!forking && wander) wander.style.opacity = fade.toFixed(3);
    if (forking) strands.forEach((s) => { s.style.opacity = fade.toFixed(3); });

    if (reform <= 0.001) {
      reformLine.style.strokeOpacity = "0";
      return;
    }

    const readout = window.__mapReadout;
    if (!readout || readout.hubX === undefined) return;

    // hubX/hubY are measured from the corner of the window; this SVG is
    // as tall as the whole scrolling page, so the scroll position has to
    // be added back to land in its coordinates.
    const base = container.getBoundingClientRect();
    const hubX = readout.hubX - base.left;
    const hubY = readout.hubY - base.top + container.scrollTop;
    const topY = container.scrollTop; // the top edge of what's on screen

    // It draws to the top of the screen while the page is still held on
    // the map — that is the whole point of it, the way out drawn before
    // the page takes it. But the page then scrolls up to the sentence,
    // and the line must not carry on past that: `top0` is where the leg
    // going the other way starts, just below the sentence, so stopping
    // there lands it on the same point and it reads as connecting to the
    // words rather than running across them.
    const endY = Math.max(top0, topY);

    reformLine.setAttribute("x1", hubX.toFixed(1));
    reformLine.setAttribute("x2", hubX.toFixed(1));
    reformLine.setAttribute("y1", hubY.toFixed(1));
    reformLine.setAttribute("y2", (hubY + (endY - hubY) * reform).toFixed(1));
    reformLine.style.strokeOpacity = (0.5 * Math.min(1, reform * 3)).toFixed(3);
  }

  measure();
  requestAnimationFrame(frame);

  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
