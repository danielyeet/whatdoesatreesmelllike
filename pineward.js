// ============================================================
// PINEWARD (works/pineward.html only)
//
// A long piece — an introduction and fifty-two parts — drawn the way
// the rest of this site draws: hairlines, specks, and the lines
// between them. Three things are added to the page here, and the page
// is a working page without any of them.
//
//   THE CANOPY   A still drawing standing behind the title: specks
//                strung between a few branching runs, thinning as it
//                goes down the page. It is drawn once and then left —
//                nothing on this page drifts on its own clock.
//
//   THE TRUNK    A rule down the side of the parts with one tick per
//                part, numbered at every stratum. It is the piece's
//                own scale: how far down the fifty-two you have come
//                is where the reading in the corner comes from, and
//                the ticks behind you are inked in as you pass them.
//
//   THE PARTS    Each one comes up as it is reached, and opens and
//                closes on a height that is measured rather than
//                guessed at, so a part with three paragraphs in it
//                takes exactly as long to open as it needs.
//
// WITHOUT THIS FILE the page is all of its writing, one part after
// another: `<details>` opens and closes by itself, and the drawings
// are simply not there. That is why none of them carry anything to
// read.
//
// The four strata — Canopy, Understorey, Trunk, Roots — are a section
// through a forest read from the light down into the ground. They are
// in the page's own markup, not here.
// ============================================================
(function () {
  const page = document.querySelector(".pineward-page");
  if (!page) return;

  const parts = Array.from(document.querySelectorAll(".pine-part"));
  if (!parts.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 31;

  // --- the canopy
  //
  // A CANOPY, not a constellation. Every speck joined to whatever was
  // within reach of it came out as long lines striking across the page
  // and closing into triangles — a net thrown over the title rather
  // than something growing behind it. What is drawn now is branching:
  // a few boughs rise from the foot of it and split, and split again,
  // thinning as they go, with the specks strung along them and only
  // their near neighbours joined.
  const BOUGHS = 5;            // how many rise from the foot of the drawing
  const SPLITS = 4;            // and how many times each one divides
  const BOUGH_LEN = 0.3;       // the first run, as a share of the drawing's height
  const BOUGH_KEEP = 0.72;     // and how much of its length the next one keeps
  const BOUGH_OUT = [0.32, 0.62]; // how far a split leans off its parent, in radians
  const SPECK_EVERY = 13;      // how far apart the specks along a run stand
  const WEB_REACH = 30;        // two specks nearer than this are joined
  const WEB_EACH = 2;          // and no speck carries more lines than this
  const SPECK_MIN = 1;         // how big a speck is drawn, in pixels
  const SPECK_MAX = 2.6;
  const CANOPY_INK = 0.46;     // how heavily a speck is drawn
  const BOUGH_INK = 0.13;      // the run it stands on
  const WEB_INK = 0.13;        // and a line between two specks
  const CLEAR_MID = 0.34;      // the share of the width kept quiet for the writing
  const GROW_MS = 1900;        // how long the canopy takes to grow when the page opens
  const INK = "23,23,15";      // --ink

  // --- the parts arriving
  const RISE_MS = 620;         // how long one takes to come up
  const RISE_STEP = 45;        // and the pause between two that arrive together
  const OPEN_MS = 420;         // how long a part takes to open

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (pair) => pair[0] + random() * (pair[1] - pair[0]);
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // THE CANOPY
  //
  // Not a picture of a tree — a few runs of specks that branch as they
  // climb, and the loose ones caught between them. It is drawn once,
  // at the size the page is, and again only if the window changes: the
  // owner asked for the drawings on the contact sheet to stand still,
  // and this page keeps the same rule.
  // ============================================================
  const canopy = document.querySelector(".pine-canopy");
  const ink = canopy ? canopy.getContext("2d") : null;

  /** One run of a bough, and then the ones that grow out of its end.
      Written as a walk rather than as a shape: every branch is the
      same walk with less left of it, which is what makes the thing
      read as grown rather than drawn. */
  function grow(x, y, angle, len, left, specks, runs, from) {
    const toX = x + Math.cos(angle) * len;
    const toY = y + Math.sin(angle) * len;
    // HOW FAR ALONG THE TREE this is, measured from the foot of it —
    // which is what the canopy is grown BY when the page opens, so a
    // branch can never come up before the branch it grows out of.
    runs.push({ x1: x, y1: y, x2: toX, y2: toY, left: left, from: from, to: from + len });
    const many = Math.max(1, Math.round(len / SPECK_EVERY));
    for (let n = 0; n <= many; n++) {
      const at = n / many;
      // The specks wander a hair off their own run, or the bough reads
      // as a ruled line with beads on it.
      const off = (random() - 0.5) * 2.4;
      specks.push({
        x: x + (toX - x) * at - Math.sin(angle) * off,
        y: y + (toY - y) * at + Math.cos(angle) * off,
        size: SPECK_MIN + random() * (SPECK_MAX - SPECK_MIN) * (left / SPLITS),
        left: left,
        at: from + len * at,
      });
    }
    if (left <= 0) return;
    const spread = between(BOUGH_OUT);
    grow(toX, toY, angle - spread, len * BOUGH_KEEP, left - 1, specks, runs, from + len);
    grow(toX, toY, angle + spread * (0.6 + random() * 0.8), len * BOUGH_KEEP * (0.8 + random() * 0.3),
         left - 1, specks, runs, from + len);
  }

  /** How much of the tree is standing: 1 once it has grown. */
  let grown = REDUCE_MOTION ? 1 : 0;
  /** And what was worked out to draw, kept so that growing it is only
      a repaint rather than the whole tree being grown again. */
  let boughs = null;

  function drawCanopy() {
    if (!ink) return;
    const wide = canopy.clientWidth;
    const tall = canopy.clientHeight;
    if (!wide || !tall) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canopy.width = Math.round(wide * ratio);
    canopy.height = Math.round(tall * ratio);
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.clearRect(0, 0, wide, tall);

    seed = SEED;
    const specks = [];
    const runs = [];
    for (let b = 0; b < BOUGHS; b++) {
      // Out at the sides rather than evenly across: the middle of the
      // page is where the title stands.
      const at = (b + 0.5) / BOUGHS;
      const side = at < 0.5 ? at * 0.62 : 1 - (1 - at) * 0.62;
      grow(
        wide * side,
        tall * (1.02 + random() * 0.06),
        -Math.PI / 2 + (side - 0.5) * 0.5,
        tall * BOUGH_LEN * (0.85 + random() * 0.4),
        SPLITS, specks, runs, 0
      );
    }

    boughs = {
      specks: specks,
      runs: runs,
      wide: wide,
      tall: tall,
      reach: specks.reduce((m, one) => Math.max(m, one.at), 1),
      /** How plainly anything at (x, y) is drawn: thinning down the
          page so the writing is never fought, and again across the
          middle of it where the title stands. */
      seen: (x, y) => {
        const down = 1 - Math.min(1, (y / tall) * 0.9);
        const off = Math.min(1, Math.abs(x - wide / 2) / (wide * CLEAR_MID));
        return down * (0.22 + 0.78 * off);
      },
    };
    paintCanopy();
  }

  /** As much of the tree as has grown. */
  function paintCanopy() {
    if (!ink || !boughs) return;
    const specks = boughs.specks, runs = boughs.runs, seen = boughs.seen;
    const upTo = boughs.reach * grown;
    ink.clearRect(0, 0, boughs.wide, boughs.tall);

    // The runs themselves, faintly: what the specks are strung along.
    runs.forEach((run) => {
      if (run.from > upTo) return;
      const lit = BOUGH_INK * seen((run.x1 + run.x2) / 2, (run.y1 + run.y2) / 2) *
        (0.4 + (run.left / SPLITS) * 0.6);
      if (lit < 0.012) return;
      // Drawn only as far as it has grown, so a bough reaches out
      // rather than appearing whole.
      const part = Math.min(1, (upTo - run.from) / Math.max(1, run.to - run.from));
      ink.beginPath();
      ink.moveTo(run.x1, run.y1);
      ink.lineTo(run.x1 + (run.x2 - run.x1) * part, run.y1 + (run.y2 - run.y1) * part);
      ink.lineWidth = 1;
      ink.strokeStyle = rgba(lit);
      ink.stroke();
    });

    // The web between the specks, near neighbours only and never more
    // than `WEB_EACH` from any one of them — the difference between a
    // net and a scribble, which is the chamber's own lesson.
    const carried = specks.map(() => 0);
    for (let a = 0; a < specks.length; a++) {
      if (carried[a] >= WEB_EACH) continue;
      for (let b = a + 1; b < specks.length; b++) {
        if (carried[a] >= WEB_EACH) break;
        if (carried[b] >= WEB_EACH) continue;
        const one = specks[a], two = specks[b];
        if (one.at > upTo || two.at > upTo) continue;
        const off = Math.hypot(two.x - one.x, two.y - one.y);
        if (off > WEB_REACH || off < 5) continue;
        const lit = WEB_INK * seen((one.x + two.x) / 2, (one.y + two.y) / 2);
        if (lit < 0.012) continue;
        ink.beginPath();
        ink.moveTo(one.x, one.y);
        ink.lineTo(two.x, two.y);
        ink.lineWidth = 1;
        ink.strokeStyle = rgba(lit);
        ink.stroke();
        carried[a]++; carried[b]++;
      }
    }

    // Squares on whole pixels, like every speck on this site: at this
    // size a rectangle laid across a pixel boundary is a soft blob.
    specks.forEach((speck) => {
      if (speck.at > upTo) return;
      const lit = CANOPY_INK * seen(speck.x, speck.y);
      if (lit < 0.02) return;
      const size = Math.max(1, Math.round(speck.size));
      ink.fillStyle = rgba(lit);
      ink.fillRect(Math.round(speck.x - size / 2), Math.round(speck.y - size / 2), size, size);
    });
  }

  // ============================================================
  // THE TRUNK
  //
  // One tick per part down the side of the page, and the reading in
  // the corner that counts them. Both are the piece's own scale: where
  // you are in the fifty-two, rather than how far down the document
  // you have scrolled — a part that runs long should not read as more
  // of the piece than a part that runs short.
  // ============================================================
  const trunk = document.createElement("div");
  trunk.className = "pine-trunk";
  trunk.setAttribute("aria-hidden", "true");
  trunk.innerHTML = '<span class="pine-trunk-line"></span>';
  const ticks = document.createElement("div");
  ticks.className = "pine-ticks";
  parts.forEach(() => {
    const tick = document.createElement("span");
    tick.className = "pine-tick";
    ticks.appendChild(tick);
  });
  trunk.appendChild(ticks);
  page.appendChild(trunk);

  const readout = document.createElement("p");
  readout.className = "pine-readout";
  readout.innerHTML =
    '<span class="pine-readout-no">00</span>' +
    '<span class="pine-readout-of"> / ' + String(parts.length).padStart(2, "0") + '</span>' +
    '<span class="pine-readout-where">Introduction</span>';
  page.appendChild(readout);

  const tickAt = Array.from(ticks.children);
  const readNo = readout.querySelector(".pine-readout-no");
  const readWhere = readout.querySelector(".pine-readout-where");

  /** Which part is being read: the last one whose top edge has passed
      the reading line a third of the way down the window. */
  let shown = -1;
  function reckon() {
    const line = window.innerHeight * 0.34;
    let at = -1;
    for (let n = 0; n < parts.length; n++) {
      if (parts[n].getBoundingClientRect().top <= line) at = n; else break;
    }
    if (at === shown) return;
    shown = at;
    tickAt.forEach((tick, n) => tick.classList.toggle("passed", n <= at));
    readNo.textContent = String(at + 1).padStart(2, "0");
    const stratum = at < 0
      ? null
      : parts[at].closest(".pine-stratum");
    readWhere.textContent = stratum
      ? stratum.querySelector("h2").textContent
      : "Introduction";
  }

  // ============================================================
  // THE PARTS
  //
  // Coming up as they are reached, and opening on a height that is
  // measured. A `<details>` element opens instantly on its own, which
  // is the right thing for it to do when nothing is watching; here the
  // height is taken before and after and the difference is travelled,
  // so the page does not jump under whatever you are reading.
  // ============================================================
  if (!REDUCE_MOTION && "IntersectionObserver" in window) {
    let due = 0;
    const watcher = new IntersectionObserver(
      (seen) => {
        const now = window.performance && window.performance.now
          ? window.performance.now() : Date.now();
        if (now > due) due = now;
        seen.forEach((one) => {
          if (!one.isIntersecting) return;
          const wait = Math.max(0, due - now);
          due += RISE_STEP;
          setTimeout(() => one.target.classList.add("arrived"), wait);
          watcher.unobserve(one.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    parts.forEach((part) => watcher.observe(part));
    document.querySelectorAll(".pine-stratum-head, .pine-intro").forEach((one) => {
      one.classList.add("pine-rises");
      watcher.observe(one);
    });
  } else {
    parts.forEach((part) => part.classList.add("arrived"));
  }

  parts.forEach((part) => {
    const body = part.querySelector(".pine-body");
    if (!body) return;
    part.addEventListener("toggle", () => {
      part.querySelector(".pine-cue").textContent = part.open ? "Close" : "Open";
      if (REDUCE_MOTION) return;
      // Where it is going, measured on the page as it now stands.
      const to = part.open ? body.scrollHeight : 0;
      const from = part.open ? 0 : body.scrollHeight;
      body.style.height = from + "px";
      body.style.overflow = "hidden";
      // The frame after, so the height it is leaving has been taken.
      requestAnimationFrame(() => {
        body.style.transition = "height " + OPEN_MS + "ms var(--menu-ease)";
        body.style.height = to + "px";
      });
      const done = () => {
        body.style.transition = "";
        body.style.height = "";
        body.style.overflow = "";
        body.removeEventListener("transitionend", done);
      };
      body.addEventListener("transitionend", done);
    });
  });

  // ============================================================
  // KEEPING UP
  // ============================================================
  let waiting = false;
  function onScroll() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => { waiting = false; reckon(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { drawCanopy(); reckon(); });

  page.classList.add("pine-ready");
  drawCanopy();
  reckon();

  // THE TREE GROWS WHEN THE PAGE OPENS, from the foot of each bough
  // out to the last twig, and then stands still — the same rule the
  // contact sheet this piece is reached from keeps: a drawing is
  // watched being made, and afterwards it is a drawing. With animation
  // turned off it is simply already grown.
  if (!REDUCE_MOTION) {
    const began = window.performance && window.performance.now
      ? window.performance.now() : Date.now();
    const settled = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = (now - began) / GROW_MS;
      grown = t >= 1 ? 1 : settled(t);
      paintCanopy();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
