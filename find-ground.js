// ============================================================
// THE SEARCH PAGE'S GROUND — search.html
//
// The page was near-white with a squared plan painted on it in CSS and
// a corner sight at each end. The sight in the top left landed on the
// Menu and read as a stray square; the plan was a pattern behind the
// page rather than anything to do with searching.
//
// It was redrawn once as a canvas plan that answered the field, and the
// owner then asked for the grid gone altogether and for the specks to
// carry the page on their own. So this is a FIELD OF SPECKS and nothing
// else:
//
//   THE FIELD  Specks hung across the whole window, each drifting a
//              little about its own place on its own clock. They are
//              drawn in a range from near-black to pale, so the ground
//              has depth in it rather than being one even dusting.
//   THE WEB    Fine lines between near neighbours, capped per speck.
//              The same net the chamber's cursor strings, which is the
//              site's own way of making a scatter read as a thing.
//   THE ANSWER While something is being typed the specks lean towards
//              the field's own line and brighten there, so the page
//              gathers round what is being asked.
//
// WHAT IT READS: the field's value, off the DOM, and where the form
// sits. It knows nothing about what a search found, and search-page.js
// knows nothing about this — the two never talk.
//
// WITHOUT THIS SCRIPT the page is the same page: the stylesheet gives
// it its dark ground and every word on it is still there.
// ============================================================
(function () {
  const canvas = document.querySelector(".find-ground");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const field = document.querySelector(".find-field");
  const form = document.querySelector(".find-form");

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- tuning ------------------------------------------------
  const PER_AREA = 190;        // specks per million pixels of window
  const LEAST = 90;            // and never fewer than this
  const MOST = 460;            // nor more
  const SIZE = [0.6, 2.6];     // how big one is drawn
  const DRIFT = 7;             // how far it wanders from its place, in pixels
  const RATE = [0.04, 0.16];   // and how slowly, in turns a second
  // THE WEB IS SHORT AND CAPPED, and it has to stay that way. Joining
  // everything within a long reach — the first version used 96px — came
  // out as long lines striking clear across the page and closing into
  // triangles: a net thrown over the writing rather than a ground behind
  // it. Pineward's wood learned the same lesson; see its report.
  const WEB_REACH = 44;        // two specks nearer than this are joined
  const WEB_EACH = 1;          // and no speck carries more lines than this
  const WEB_INK = 0.075;       // how heavily that line is drawn
  const PALE = "226, 228, 234";// the light the page is written in
  const DARK = "0, 0, 0";      // and the black specks among them
  const GATHER = 34;           // how far a speck leans towards the field when typing
  const BAND = 260;            // how near the field's line a speck answers from

  let w = 0, h = 0;
  let specks = [];
  let charge = 0;              // eased 0-1: is the page being searched
  let formY = 0;

  function measure() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const dpr = Math.min(window.devicePixelRatio || 1,
                         window.innerWidth < 700 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    place();
  }

  // A speck keeps its place as a share of the window, so a resize moves
  // the field with the page rather than re-rolling it into a different
  // scatter.
  function build() {
    const many = Math.round(Math.max(LEAST, Math.min(MOST,
      PER_AREA * (w * h) / 1000000)));
    while (specks.length > many) specks.pop();
    while (specks.length < many) {
      specks.push({
        ax: Math.random(),
        ay: Math.random(),
        size: SIZE[0] + Math.random() * Math.random() * (SIZE[1] - SIZE[0]),
        lit: 0.18 + Math.random() * Math.random() * 0.7,
        dark: Math.random() < 0.34,
        rate: RATE[0] + Math.random() * (RATE[1] - RATE[0]),
        phase: Math.random() * Math.PI * 2,
        swing: 0.5 + Math.random(),
      });
    }
  }

  function place() {
    formY = form ? form.getBoundingClientRect().bottom : h * 0.4;
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    const want = field && field.value.trim() ? 1 : 0;
    charge += (want - charge) * (still ? 1 : 0.055);

    // Where every speck stands this frame, worked out once and then
    // used twice — for the web and for the specks themselves.
    const at = [];
    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      const turn = still ? 0 : t * 0.001 * s.rate * Math.PI * 2 + s.phase;
      let x = s.ax * w + (still ? 0 : Math.cos(turn) * DRIFT * s.swing);
      let y = s.ay * h + (still ? 0 : Math.sin(turn * 0.8) * DRIFT * s.swing);

      // THE ANSWER: while something is being typed, a speck near the
      // field's line leans towards it and is drawn more plainly. The
      // page gathers round the question rather than round the pointer —
      // nothing here follows the hand at all.
      const off = Math.abs(y - formY);
      const near = off < BAND ? 1 - off / BAND : 0;
      const pull = charge * near * near;
      y += (formY - y) * pull * (GATHER / Math.max(BAND, 1));
      at.push({ x: x, y: y, s: s, lift: pull });
    }

    // THE WEB. Near neighbours joined, each speck carrying no more than
    // WEB_EACH of them, so the net stays a net rather than closing into
    // a mesh.
    const carried = new Array(at.length).fill(0);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let a = 0; a < at.length; a++) {
      if (carried[a] >= WEB_EACH) continue;
      for (let b = a + 1; b < at.length; b++) {
        if (carried[a] >= WEB_EACH) break;
        if (carried[b] >= WEB_EACH) continue;
        const one = at[a], two = at[b];
        const far = Math.hypot(two.x - one.x, two.y - one.y);
        if (far > WEB_REACH || far < 6) continue;
        ctx.moveTo(one.x, one.y);
        ctx.lineTo(two.x, two.y);
        carried[a]++; carried[b]++;
      }
    }
    ctx.strokeStyle = "rgba(" + PALE + ", " + (WEB_INK * (0.7 + charge * 0.5)).toFixed(3) + ")";
    ctx.stroke();

    // THE SPECKS, over the web.
    for (let i = 0; i < at.length; i++) {
      const one = at[i], s = one.s;
      const lit = Math.min(1, s.lit * (1 + one.lift * 1.6));
      ctx.fillStyle = "rgba(" + (s.dark ? DARK : PALE) + ", " +
        (s.dark ? lit * 0.85 : lit).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(one.x, one.y, s.size * (1 + one.lift * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t) {
    draw(t);
    requestAnimationFrame(frame);
  }

  measure();
  if (still) draw(0);
  else requestAnimationFrame(frame);

  window.addEventListener("resize", measure);
  window.addEventListener("scroll", place, { passive: true });
})();
