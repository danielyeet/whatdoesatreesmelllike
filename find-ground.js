// ============================================================
// THE SEARCH PAGE'S GROUND — search.html
//
// The page used to be near-white with a squared plan painted on it in
// CSS and a corner sight at each end. The sight in the top left landed
// on the Menu, which read as a stray square, and the plan itself was a
// pattern behind the page rather than anything to do with searching.
//
// This draws the ground instead, on one canvas, and ties all of it to
// the search:
//
//   THE PLAN   a squared ground, faint. The row of squares the field
//              stands on lights up as you type, and each answer rules
//              its own line across the plan as it arrives, so the page
//              is ruled BY the search rather than behind it.
//   THE SPECKS a column of black flecks down each margin, drifting.
//              They lean in towards the field while you are typing and
//              settle back when you stop. Black on dark grey, so they
//              read as texture rather than as stars.
//
// WHAT IT READS: the field's value and the rows in `.find-results`,
// both off the DOM. It knows nothing about what a search found, and
// search-page.js knows nothing about this — the two never talk.
//
// WITHOUT THIS SCRIPT the page is the same page: the stylesheet gives
// it its dark ground and every word on it is still there. This only
// draws on top of it.
// ============================================================
(function () {
  const canvas = document.querySelector(".find-ground");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const field = document.querySelector(".find-field");
  const form = document.querySelector(".find-form");
  const results = document.querySelector(".find-results");

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- tuning ------------------------------------------------
  const CELL = 46;              // the squares of the plan
  const PLAN_ALPHA = 0.055;     // its resting weight
  const PLAN_LIT = 0.3;         // and the weight of a lit line
  const MAJOR_EVERY = 6;        // every sixth line is drawn heavier
  const BAND = 150;             // how far from the field the lighting reaches
  const SPECK_PER_SIDE = 85;    // black flecks down each margin
  const MARGIN = 0.14;          // how much of the width each column takes
  const DRIFT = 5;              // pixels a second a speck falls
  const LEAN = 26;              // how far they lean in while typing

  let w = 0, h = 0, dpr = 1;
  let specks = [];
  let charge = 0;               // eased 0-1: is the page being searched
  let rows = [];                // y of each answer, in page space
  let formY = 0;

  function measure() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    place();
  }

  // A speck belongs to one margin and keeps its own place in it, so the
  // two columns stay columns however the window is resized.
  function build() {
    specks = [];
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < SPECK_PER_SIDE; i++) {
        specks.push({
          side: side,
          across: Math.random(),          // 0-1 within its own margin
          down: Math.random(),            // 0-1 down the window
          size: 0.7 + Math.random() * 2.3,
          dark: 0.5 + Math.random() * 0.5,
          rate: 0.5 + Math.random(),
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // Where the field sits, and where the answers sit, both in window
  // space — this is the whole of what the drawing knows about the page.
  function place() {
    formY = form ? form.getBoundingClientRect().bottom : h * 0.4;
    rows = [];
    if (!results) return;
    const found = results.querySelectorAll(".find-row");
    for (let i = 0; i < found.length && i < 24; i++) {
      const r = found[i].getBoundingClientRect();
      if (r.bottom < -40 || r.top > h + 40) continue;
      rows.push(r.bottom);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    const want = field && field.value.trim() ? 1 : 0;
    charge += (want - charge) * (still ? 1 : 0.06);
    const breath = still ? 0 : Math.sin(t * 0.0004) * 0.5 + 0.5;

    // ---- the plan --------------------------------------------
    // Verticals first, then horizontals, so the lit horizontals read as
    // lying on top of the squares rather than being part of them.
    ctx.lineWidth = 1;
    const cols = Math.ceil(w / CELL) + 1;
    for (let i = 0; i < cols; i++) {
      const x = Math.round(i * CELL) + 0.5;
      const major = i % MAJOR_EVERY === 0;
      // A vertical lights by how near it is to the middle of the field,
      // which is what makes the plan gather round what you are typing.
      const near = 1 - Math.min(1, Math.abs(x - w / 2) / (w * 0.5));
      const a = PLAN_ALPHA * (major ? 1.9 : 1) + charge * near * near * 0.08;
      ctx.strokeStyle = "rgba(226, 228, 234, " + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const lines = Math.ceil(h / CELL) + 1;
    for (let i = 0; i < lines; i++) {
      const y = Math.round(i * CELL) + 0.5;
      const major = i % MAJOR_EVERY === 0;
      // ...and a horizontal lights by how near it is to the field's own
      // line. This is the band that travels as the page scrolls.
      const d = Math.abs(y - formY);
      const lit = d < BAND ? (1 - d / BAND) * charge : 0;
      const a = PLAN_ALPHA * (major ? 1.9 : 1) + lit * lit * PLAN_LIT * (0.7 + breath * 0.3);
      ctx.strokeStyle = "rgba(226, 228, 234, " + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // ---- an answer rules its own line -------------------------
    for (let i = 0; i < rows.length; i++) {
      const y = Math.round(rows[i]) + 0.5;
      const a = 0.12 * charge;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(226, 228, 234, 0)");
      grad.addColorStop(0.5, "rgba(226, 228, 234, " + a.toFixed(3) + ")");
      grad.addColorStop(1, "rgba(226, 228, 234, 0)");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // ---- the specks -------------------------------------------
    // Drawn last and in black, so they sit in front of the plan and
    // take a bite out of it rather than glowing over it.
    const span = w * MARGIN;
    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      if (!still) {
        s.down += (DRIFT * s.rate) / Math.max(h, 1) * 0.016;
        if (s.down > 1) s.down -= 1;
      }
      const lean = charge * LEAN * Math.sin(s.phase + t * 0.0006);
      const base = s.side === 0 ? s.across * span : w - s.across * span;
      const x = base + (s.side === 0 ? lean : -lean);
      const y = s.down * h;
      ctx.fillStyle = "rgba(0, 0, 0, " + (s.dark * (0.6 + charge * 0.4)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let raf = null;
  function frame(t) {
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  measure();
  if (still) {
    draw(0);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", measure);
  window.addEventListener("scroll", place, { passive: true });
  if (field) field.addEventListener("input", () => {
    // The rows are rewritten a beat after the keystroke, so read them
    // on the next frame rather than this one.
    requestAnimationFrame(place);
  });
  // The rows also arrive on their own — the first search has to wait for
  // the site to be read — so watch the box they land in.
  if (results && window.MutationObserver) {
    new MutationObserver(() => requestAnimationFrame(place))
      .observe(results, { childList: true });
  }
})();
