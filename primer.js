// ============================================================
// MY PERSONAL INTRODUCTION TO PERFUME — the mist, and the footnotes.
// works/my-personal-introduction-to-perfume.html
//
// The page is an essay page: essay.js gives it the rule down the left.
// This file gives it the two things that are its own.
//
// THE MIST. Drops of perfume rising slowly up the window in the warm
// gold of perfume in a bottle, and as each one rises it COMES APART
// INTO VAPOUR — the drop shrinks, and a little cloud of finer specks
// loosens off it and drifts away sideways, thinning to nothing. It is
// the piece's own "From liquid to gas", said as a drawing: in the
// bottle and on the skin a perfume is a liquid, and only once it
// becomes a gas can it be smelled.
//
//   THE HAND WARMS IT. A drop near the pointer goes to vapour sooner,
//   the way a perfume on warm skin evaporates faster — the piece says
//   so in its nuances. Nothing is pushed or pulled; it simply turns
//   to gas earlier where the hand is.
//
//   THE WRITING STAYS READABLE. Over the column a drop is drawn at a
//   fraction of its strength (QUIET), easing in either side, so the
//   mist rises behind the words without glowing through them —
//   Ataraxia's rule for the same problem.
//
// It lives on the WINDOW, not down the document: rising things read
// as weather in the room you are in, and Grande Parfums' drift is
// the same for the same reason.
//
// THE FOOTNOTES. Each number in the writing is an ordinary link to its
// note at the foot. Pointed at, or focused, the note is also shown
// beside it, so reading one does not mean losing your place.
//
// WITHOUT THIS SCRIPT the page is all of its writing, and the numbers
// still take you to the notes.
// ============================================================
(function () {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // THE FOOTNOTES
  // ============================================================
  const tip = document.createElement("div");
  tip.className = "primer-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  let showingFor = null;
  function showNote(link) {
    const note = document.querySelector(link.getAttribute("href"));
    if (!note) return;
    const copy = note.cloneNode(true);
    copy.querySelectorAll(".primer-back").forEach((b) => b.remove());
    tip.innerHTML = '<span class="primer-tip-no">' + link.textContent + "</span>" + copy.innerHTML;
    tip.hidden = false;
    const box = link.getBoundingClientRect();
    const wide = Math.min(360, window.innerWidth - 32);
    tip.style.width = wide + "px";
    const left = Math.max(16, Math.min(window.innerWidth - wide - 16, box.left + box.width / 2 - wide / 2));
    tip.style.left = left + "px";
    // Above the number when there is room, below it when there is not.
    const tall = tip.offsetHeight;
    const above = box.top - tall - 12;
    tip.style.top = (above > 12 ? above : box.bottom + 12) + "px";
    tip.classList.add("is-on");
    showingFor = link;
  }
  function hideNote() {
    tip.classList.remove("is-on");
    tip.hidden = true;
    showingFor = null;
  }
  document.querySelectorAll(".primer-fn a").forEach((link) => {
    link.addEventListener("pointerenter", () => showNote(link));
    link.addEventListener("pointerleave", hideNote);
    link.addEventListener("focus", () => showNote(link));
    link.addEventListener("blur", hideNote);
  });
  window.addEventListener("scroll", () => { if (showingFor) hideNote(); }, { passive: true });

  // ============================================================
  // THE MIST
  // ============================================================
  const field = document.querySelector(".primer-mist");
  if (!field) return;
  const paint = field.getContext("2d");

  // ------------------------------------------------------------ tuning
  const GOLD = "224,182,114";      // perfume in a bottle
  const PALE = "236,226,206";      // the vapour, paler than the drop
  const DROPS = 46;                // on a wide window; fewer on a narrow one
  const RISE = [9, 22];            // pixels a second
  const DROP_R = [1.6, 4.2];       // a drop's size when it starts
  const TURN = [0.35, 0.75];       // how far up the window it has turned to gas
  const PUFFS = 7;                 // how many specks of vapour a drop gives off
  const WARM_NEAR = 170;           // how near the hand warms a drop
  const COLUMN = 940;              // the writing's measure, as in style.css
  const QUIET = 0.3;               // what a drop over the writing is drawn at
  const SOFT = 90;                 // over how many pixels the quiet eases in

  let width = 0, height = 0, ratio = 1;
  let drops = [];
  let hx = -1e4, hy = -1e4;

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    field.style.width = width + "px";
    field.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    const want = Math.round(DROPS * Math.min(1, width / 1280));
    while (drops.length < want) drops.push(born(true));
    drops.length = want;
  }

  /** A new drop, at the foot of the window — or, when the page is
      first drawn, anywhere up it, so the window is not empty while the
      first ones climb. */
  function born(anywhere) {
    const r = rand(DROP_R[0], DROP_R[1]);
    return {
      x: rand(0, width),
      y: anywhere ? rand(0, height) : height + r * 4,
      r: r,
      rise: rand(RISE[0], RISE[1]) * (0.7 + r / DROP_R[1] * 0.5),
      sway: rand(0, Math.PI * 2),
      swayRate: rand(0.2, 0.5),
      turnAt: rand(TURN[0], TURN[1]),
      warmth: 0,
      puffs: Array.from({ length: PUFFS }, () => ({
        a: rand(0, Math.PI * 2),
        d: rand(0.6, 1.4),
        s: rand(0.5, 1.2),
      })),
    };
  }

  /** How loud anything may be at this x: quiet over the writing,
      easing up to full strength in the margins. */
  function hushAt(x) {
    const edge = Math.max(0, (width - COLUMN) / 2 + 40);
    const inside = Math.min(x - edge, width - edge - x);
    if (edge <= 0) return QUIET;
    if (inside <= -SOFT) return 1;
    if (inside >= 0) return QUIET;
    const t = -inside / SOFT;
    return QUIET + (1 - QUIET) * t * t * (3 - 2 * t);
  }

  function step(dt, clock) {
    paint.clearRect(0, 0, width, height);
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y -= d.rise * dt;
      const x = d.x + Math.sin(d.sway + clock * d.swayRate) * 6;

      // THE HAND WARMS IT: near the pointer a drop turns to gas sooner.
      const near = Math.max(0, 1 - Math.hypot(x - hx, d.y - hy) / WARM_NEAR);
      d.warmth += (near - d.warmth) * Math.min(1, dt * 3);

      // How far along it is from liquid to gas: 0 a whole drop, 1 all
      // vapour and nearly gone.
      const up = 1 - d.y / height;
      const gas = Math.max(0, Math.min(1, (up - d.turnAt * (1 - d.warmth * 0.7)) / 0.32));
      if (gas >= 1 || d.y < -40) { drops[i] = born(false); continue; }

      const hush = hushAt(x);
      const fade = Math.min(1, (height - d.y) / 60);   // coming in at the foot

      // THE DROP: shrinking as it goes to gas, with a highlight.
      const r = d.r * (1 - gas * 0.9);
      if (r > 0.3) {
        paint.fillStyle = "rgba(" + GOLD + "," + (0.55 * (1 - gas) * hush * fade).toFixed(3) + ")";
        paint.beginPath();
        paint.arc(x, d.y, r, 0, Math.PI * 2);
        paint.fill();
        if (r > 1.6) {
          paint.fillStyle = "rgba(255,248,232," + (0.5 * (1 - gas) * hush * fade).toFixed(3) + ")";
          paint.beginPath();
          paint.arc(x - r * 0.35, d.y - r * 0.35, r * 0.28, 0, Math.PI * 2);
          paint.fill();
        }
      }

      // THE VAPOUR: finer specks loosening off it and drifting away,
      // spreading and thinning as the drop goes.
      if (gas > 0) {
        const spread = 4 + gas * 26 * d.r / DROP_R[1] + gas * 10;
        for (const p of d.puffs) {
          const px = x + Math.cos(p.a + clock * 0.3) * spread * p.d;
          const py = d.y - gas * 14 * p.d + Math.sin(p.a) * spread * 0.5 * p.d;
          const ink = 0.42 * Math.sin(Math.PI * Math.min(1, gas * 1.1)) * hushAt(px) * fade;
          paint.fillStyle = "rgba(" + PALE + "," + ink.toFixed(3) + ")";
          paint.beginPath();
          paint.arc(px, py, 0.6 + p.s * (0.6 + gas), 0, Math.PI * 2);
          paint.fill();
        }
      }
    }
  }

  resize();
  window.addEventListener("resize", resize);
  const feel = (e) => { hx = e.clientX; hy = e.clientY; };
  window.addEventListener("pointermove", feel, { passive: true });
  // There is no hovering on a phone: a tap is the hand arriving.
  window.addEventListener("pointerdown", feel, { passive: true });
  document.addEventListener("pointerleave", () => { hx = -1e4; hy = -1e4; });

  if (REDUCE_MOTION) {
    // STILL: the mist as it stands, drawn once, and redrawn on resize.
    step(0, 0);
    window.addEventListener("resize", () => step(0, 0));
    return;
  }

  let last = performance.now();
  const began = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) step(dt, (now - began) / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
