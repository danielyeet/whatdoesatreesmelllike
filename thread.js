// ============================================================
// THE THREAD (index.html only)
// One line runs the whole length of the landing page: it leaves
// the title, drops into the second slide's sentence, comes out
// the other side, and finally arrives at the centre of the node
// map. It draws itself as you scroll, so the three slides read
// as one continuous descent rather than three separate screens.
//
// This file also drives two things that belong to the same
// transition:
//   - the paper background (grid + grain) fading in for slide 3
//   - window.__p23, the 0-to-1 progress between slide 2 and 3,
//     which node-scene.js reads to fade the map in alongside it
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

  const GAP = 26;          // breathing room between the line and the text it leaves
  const RIPPLE_MS = 1150;  // how long the arrival bloom lasts
  const LEAD = 1.15;       // the line finishes slightly before the scroll settles

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  const svg = svgEl("svg", { class: "thread", "aria-hidden": "true" });
  const lineToText = svgEl("path", { class: "thread-line" });
  const lineToNode = svgEl("path", { class: "thread-line" });
  const rippleOuter = svgEl("circle", { class: "thread-ripple", r: 0 });
  const rippleInner = svgEl("circle", { class: "thread-ripple", r: 0 });
  const sparkGlow = svgEl("circle", { class: "thread-spark-glow", r: 8 });
  const spark = svgEl("circle", { class: "thread-spark", r: 2.4 });

  svg.appendChild(lineToText);
  svg.appendChild(lineToNode);
  svg.appendChild(rippleOuter);
  svg.appendChild(rippleInner);
  svg.appendChild(sparkGlow);
  svg.appendChild(spark);
  container.insertBefore(svg, container.firstChild);

  let lenText = 0, lenNode = 0;
  let centre = { x: 0, y: 0 };

  // ============================================================
  // MEASURING — the path is rebuilt from where the text actually
  // sits, so it survives a resize, a longer sentence, or a
  // different font loading in late.
  // ============================================================
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
      return {
        cx: r.left - base.left + r.width / 2,
        top: r.top - base.top + scrolled,
        bottom: r.bottom - base.top + scrolled,
      };
    }

    const title = place(titleEl);
    const intro = place(introEl);
    const start = { x: title.cx, y: title.bottom + GAP };
    const textIn = { x: intro.cx, y: intro.top - GAP };
    const textOut = { x: intro.cx, y: intro.bottom + GAP };
    centre = { x: width / 2, y: slides[2].offsetTop + slides[2].offsetHeight / 2 };

    // A shallow S on each leg — enough to read as drawn rather than
    // ruled, not enough to draw attention to itself.
    const bow = Math.min(150, width * 0.13);
    const legA = textIn.y - start.y;
    const legB = centre.y - textOut.y;

    lineToText.setAttribute("d",
      "M " + start.x + " " + start.y +
      " C " + (start.x + bow) + " " + (start.y + legA * 0.36) +
      ", " + (textIn.x - bow) + " " + (textIn.y - legA * 0.36) +
      ", " + textIn.x + " " + textIn.y);

    lineToNode.setAttribute("d",
      "M " + textOut.x + " " + textOut.y +
      " C " + (textOut.x - bow) + " " + (textOut.y + legB * 0.32) +
      ", " + (centre.x + bow * 0.9) + " " + (centre.y - legB * 0.38) +
      ", " + centre.x + " " + centre.y);

    lenText = lineToText.getTotalLength();
    lenNode = lineToNode.getTotalLength();
    lineToText.style.strokeDasharray = lenText;
    lineToNode.style.strokeDasharray = lenNode;

    rippleOuter.setAttribute("cx", centre.x);
    rippleOuter.setAttribute("cy", centre.y);
    rippleInner.setAttribute("cx", centre.x);
    rippleInner.setAttribute("cy", centre.y);
  }

  // ============================================================
  // THE LOOP
  // ============================================================
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => v * v * (3 - 2 * v);

  // A short stub of line is already showing under the title before
  // you touch anything — otherwise the first slide looks like it
  // has a stray mark under the heading rather than the start of
  // something. It grows in on load.
  let stub = 0;
  const stubTarget = 0.075;
  let started = null;

  let rippleAt = -1;
  let armed = true;
  let lastFrame = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(64, now - lastFrame);
    lastFrame = now;

    if (started === null) started = now;
    if (stub < stubTarget) {
      stub = REDUCE_MOTION ? stubTarget : stubTarget * clamp((now - started - 250) / 900);
    }

    const top = container.scrollTop;
    const firstLeg = slides[1].offsetTop || 1;
    const secondLeg = (slides[2].offsetTop - slides[1].offsetTop) || 1;
    const p1 = clamp(top / firstLeg);
    const p2 = clamp((top - slides[1].offsetTop) / secondLeg);

    const drawA = Math.max(stub, clamp(p1 * LEAD));
    const drawB = clamp(p2 * LEAD);

    lineToText.style.strokeDashoffset = lenText * (1 - drawA);
    lineToNode.style.strokeDashoffset = lenNode * (1 - drawB);

    // The paper and the map itself come in on the same curve as the
    // line, so nothing appears independently of anything else.
    const eased = smooth(p2);
    document.documentElement.style.setProperty("--paper-in", eased.toFixed(3));
    window.__p23 = eased;

    // A point of light travelling the last leg, ahead of the line.
    if (drawB > 0.002 && drawB < 0.999 && lenNode) {
      const at = lineToNode.getPointAtLength(lenNode * drawB);
      const fade = Math.min(1, drawB * 6) * Math.min(1, (1 - drawB) * 6);
      spark.setAttribute("cx", at.x);
      spark.setAttribute("cy", at.y);
      sparkGlow.setAttribute("cx", at.x);
      sparkGlow.setAttribute("cy", at.y);
      spark.style.opacity = 0.75 * fade;
      sparkGlow.style.opacity = 0.16 * fade;
    } else {
      spark.style.opacity = 0;
      sparkGlow.style.opacity = 0;
    }

    // Arrival: the line reaches the centre and the node takes it.
    if (drawB > 0.998 && armed) {
      armed = false;
      rippleAt = 0;
      if (typeof window.__nodeScenePulse === "function") window.__nodeScenePulse();
    }
    if (p2 < 0.55) armed = true;

    if (rippleAt >= 0 && !REDUCE_MOTION) {
      rippleAt += dt;
      const t = rippleAt / RIPPLE_MS;
      if (t >= 1) {
        rippleAt = -1;
        rippleOuter.style.opacity = 0;
        rippleInner.style.opacity = 0;
      } else {
        const out = 1 - Math.pow(1 - t, 3);
        rippleOuter.setAttribute("r", 6 + out * 96);
        rippleOuter.style.opacity = 0.3 * (1 - t);
        const lag = Math.max(0, (t - 0.14) / 0.86);
        rippleInner.setAttribute("r", 6 + (1 - Math.pow(1 - lag, 3)) * 58);
        rippleInner.style.opacity = 0.34 * (1 - lag);
      }
    }
  }

  measure();
  requestAnimationFrame(frame);

  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
