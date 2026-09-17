// ============================================================
// ADAR — works/adar.html
//
// The second piece in Scent descriptions, and the house nobody has
// heard of. Pineward's page is a wood; this one is a VOID: a dark
// ground with a hole standing in it, rings sounding outward from that
// hole, and specks falling round it. Everything is white on black and
// nothing is ever tinted — the page is meant to read as somewhere you
// cannot see the far side of.
//
// What is on the page that the markup does not carry:
//
//   THE VOID — a disc nothing is drawn inside, standing off to one
//   side of the window, with a rim of specks crowding round it. What
//   is near it is drawn as a short arc rather than a square, because
//   what is falling round a hole is not standing still.
//
//   THE RINGS — soundings out from the void, ticked, fainter as they
//   go. They are the instrument marks the rest of the site uses, bent
//   round a centre.
//
//   THE SOUNDING — the scale down the side of the page: one tick per
//   fragrance, inked in as it is passed, with the reading in the
//   corner counting them and naming the group you are in.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. The field turns on the clock and
// the rings are carried by `scrollY`, both worked out fresh every
// frame rather than added up, so scrolling back gets you back to the
// same drawing. Under `prefers-reduced-motion` the clock stops and the
// void simply stands there.
//
// WITHOUT THIS SCRIPT the page is all of its writing: the parts are
// real <details> elements, and the drawing carries nothing to read.
// ============================================================
(function () {
  const page = document.querySelector(".adar-page");
  if (!page) return;
  const parts = [...document.querySelectorAll(".adar-part")];
  if (!parts.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 4177;

  // --- the void
  const VOID_AT = [0.8, 0.46];   // where it stands in the window, as a fraction
  const VOID_R = 0.13;           // how wide it is, against the smaller side
  const RIM = 0.055;             // how far past it the crowding reaches
  const RINGS = 7;               // how many soundings are drawn out from it
  const RING_STEP = 0.085;       // and how far apart they stand
  const RING_INK = 0.2;          // how plainly the nearest is drawn
  const RING_TICKS = 36;         // how many ticks one carries
  const RING_DRIFT = 0.04;       // how far a screenful of scroll turns them

  // --- what falls round it
  const SPECKS = 700;
  const REACH = 0.92;            // how far out from the void they are thrown
  const SPECK_MIN = 1;
  const SPECK_MAX = 2.4;
  const SPECK_INK = 0.62;
  const FALL = [0.008, 0.05];    // how fast one goes round, in turns a second
  const STREAK = 16;             // how long a near one is drawn, in pixels
  const FADE_EVERY = [7, 23];    // one comes and goes on its own clock, in seconds

  // --- the writing's own room
  const CLEAR_MID = 0.52;        // the share of the width kept quiet for it
  const CLEAR_INK = 0.1;         // and how much is left of a speck standing in it

  const HALO = 0.1;              // how plainly the haze round the void is drawn
  const HALO_OUT = 2.3;          // and how far past it it reaches

  const INK = "232,232,238";

  // --- the parts arriving
  const RISE_STEP = 45;
  const OPEN_MS = 420;

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // THE FIELD
  //
  // Every speck is kept as an ANGLE and a DISTANCE from the void
  // rather than as a place on the window, which is what makes the
  // whole thing turn by adding one number, and what lets a resize
  // carry it rather than roll a different one.
  // ============================================================
  const canvas = document.querySelector(".adar-void");
  const ink = canvas ? canvas.getContext("2d") : null;
  let width = 0, height = 0, small = 0;
  let specks = [];

  function build() {
    seed = SEED;
    specks = [];
    for (let i = 0; i < SPECKS; i++) {
      // The square root is what spreads them evenly over the area
      // rather than crowding them all near the middle — and then the
      // rim gets its crowd back deliberately, below.
      const out = VOID_R + RIM * 0.4 + Math.sqrt(random()) * (REACH - VOID_R);
      specks.push({
        turn: random() * Math.PI * 2,
        out: out,
        // Nearer the void is faster, the way anything falling is.
        rate: FALL[1] - (FALL[1] - FALL[0]) * Math.min(1, (out - VOID_R) / REACH),
        size: SPECK_MIN + random() * (SPECK_MAX - SPECK_MIN),
        every: FADE_EVERY[0] + random() * (FADE_EVERY[1] - FADE_EVERY[0]),
        phase: random() * Math.PI * 2,
        way: random() < 0.5 ? -1 : 1,
      });
    }
  }

  // THE HALO is stamped once into a canvas of its own and then drawn
  // wherever it is wanted, rather than asked for as a fresh gradient
  // every frame — the one thing that will not hold sixty frames a
  // second. It is what gives the void an edge to be a hole in: the
  // ground and the inside of the void are the same near-black, so
  // without a haze round it there is nothing for the hole to be
  // darker than.
  let halo = null;
  function stampHalo(r) {
    const size = Math.round(r * HALO_OUT * 2);
    if (halo && halo.width === size) return;
    halo = document.createElement("canvas");
    halo.width = halo.height = size;
    const on = halo.getContext("2d");
    const fade = on.createRadialGradient(size / 2, size / 2, r * 0.9, size / 2, size / 2, size / 2);
    fade.addColorStop(0, "rgba(" + INK + "," + HALO + ")");
    fade.addColorStop(0.35, "rgba(" + INK + "," + (HALO * 0.4).toFixed(3) + ")");
    fade.addColorStop(1, "rgba(" + INK + ",0)");
    on.fillStyle = fade;
    on.fillRect(0, 0, size, size);
  }

  function resize() {
    if (!canvas) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    small = Math.min(width, height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /** How much of a speck standing here is drawn. The middle of the
      window is where the writing is, and a speck standing in it is
      left at a tenth — taken out altogether there would be a visible
      column of nothing, which is the invisible pane the chamber
      learnt not to stand in its own drawing. */
  function lit(x) {
    const off = Math.abs(x - width / 2) / (width / 2);
    const edge = CLEAR_MID / 2;
    if (off >= edge * 2) return 1;
    const through = Math.max(0, off - edge) / edge;
    return CLEAR_INK + (1 - CLEAR_INK) * through * through;
  }

  function draw(down, clock) {
    if (!ink) return;
    ink.clearRect(0, 0, width, height);

    const cx = width * VOID_AT[0];
    const cy = height * VOID_AT[1];
    const r = small * VOID_R;
    // The soundings are carried by the scroll — worked out from where
    // the scroll IS, never added to, so travelling back undoes it.
    const carried = (down / Math.max(1, height)) * RING_DRIFT * Math.PI * 2;

    // THE HAZE the void stands in, stamped rather than generated.
    stampHalo(r);
    if (halo) ink.drawImage(halo, cx - halo.width / 2, cy - halo.height / 2);

    // THE RINGS, out from the void and fainter as they go.
    for (let n = 0; n < RINGS; n++) {
      const at = r + small * RING_STEP * (n + 1);
      const fade = RING_INK * (1 - n / RINGS);
      ink.strokeStyle = rgba(fade);
      ink.lineWidth = 1;
      ink.beginPath();
      ink.arc(cx, cy, at, 0, Math.PI * 2);
      ink.stroke();
      // Ticks across the ring, turned a little further on each one, so
      // the soundings read as a instrument being turned rather than as
      // circles drawn on a page.
      ink.strokeStyle = rgba(fade * 1.4);
      ink.beginPath();
      for (let t = 0; t < RING_TICKS; t++) {
        const way = (t / RING_TICKS) * Math.PI * 2 + carried * (n + 1) * 0.35;
        const long = t % 6 === 0 ? 7 : 3;
        ink.moveTo(cx + Math.cos(way) * (at - long), cy + Math.sin(way) * (at - long));
        ink.lineTo(cx + Math.cos(way) * at, cy + Math.sin(way) * at);
      }
      ink.stroke();
    }

    // WHAT FALLS ROUND IT.
    specks.forEach((s) => {
      const way = s.turn + s.way * clock * s.rate * Math.PI * 2 + carried;
      const at = s.out * small;
      const x = cx + Math.cos(way) * at;
      const y = cy + Math.sin(way) * at;
      if (x < -STREAK || x > width + STREAK || y < -STREAK || y > height + STREAK) return;
      // Coming and going on its own clock: at any moment some of the
      // field is not there, which is what keeps it from reading as a
      // pattern printed on the page.
      const shown = REDUCE_MOTION
        ? 0.75
        : 0.5 + 0.5 * Math.sin((clock / s.every) * Math.PI * 2 + s.phase);
      // The rim: the crowd just outside the void is drawn plainest, and
      // everything fades away again as it goes out.
      const from = (s.out - VOID_R) / (REACH - VOID_R);
      const rim = Math.exp(-Math.pow((s.out - VOID_R - RIM * 0.5) / RIM, 2));
      const ahead = SPECK_INK * (0.35 + 0.65 * rim) * (1 - from * 0.55) * shown * lit(x);
      if (ahead < 0.015) return;
      ink.fillStyle = rgba(ahead);
      // Near the void a speck is drawn as the short arc it is
      // travelling along; further out it is a square like every other
      // speck on this site.
      if (rim > 0.35) {
        const long = (STREAK * rim) / at;
        ink.strokeStyle = rgba(ahead);
        ink.lineWidth = Math.max(1, s.size - 0.6);
        ink.beginPath();
        ink.arc(cx, cy, at, way - long * s.way, way);
        ink.stroke();
      } else {
        const size = Math.max(1, Math.round(s.size));
        ink.fillRect(Math.round(x), Math.round(y), size, size);
      }
    });

    // THE VOID ITSELF, taken back out of the drawing: anything that
    // strayed inside it is cleared, so the hole is a hole rather than a
    // disc painted over the top of one.
    ink.save();
    ink.globalCompositeOperation = "destination-out";
    // Solid, and that is not a detail: with `destination-out` it is the
    // ALPHA of the fill that says how much is taken out, and whatever
    // was last used to draw a speck is a few hundredths of one. Left as
    // it was, the hole came out as a smudge with the drawing still
    // faintly in it — which a test now watches for.
    ink.fillStyle = "#000";
    ink.beginPath();
    ink.arc(cx, cy, r, 0, Math.PI * 2);
    ink.fill();
    ink.restore();
    // And the one line that says where its edge is.
    ink.strokeStyle = rgba(0.34);
    ink.lineWidth = 1;
    ink.beginPath();
    ink.arc(cx, cy, r, 0, Math.PI * 2);
    ink.stroke();
  }

  // ============================================================
  // THE SOUNDING — the scale down the side, and the reading
  // ============================================================
  const sounding = document.createElement("div");
  sounding.className = "adar-sounding";
  sounding.setAttribute("aria-hidden", "true");
  sounding.innerHTML = '<span class="adar-sounding-line"></span>';
  const ticks = document.createElement("div");
  ticks.className = "adar-ticks";
  parts.forEach(() => {
    const tick = document.createElement("span");
    tick.className = "adar-tick";
    ticks.appendChild(tick);
  });
  sounding.appendChild(ticks);
  page.appendChild(sounding);

  const readout = document.createElement("p");
  readout.className = "adar-readout";
  readout.innerHTML =
    '<span class="adar-readout-no">00</span>' +
    '<span class="adar-readout-of"> / ' + String(parts.length).padStart(2, "0") + "</span>" +
    '<span class="adar-readout-where">Introduction</span>';
  page.appendChild(readout);

  const tickAt = Array.from(ticks.children);
  const readNo = readout.querySelector(".adar-readout-no");
  const readWhere = readout.querySelector(".adar-readout-where");

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
    const group = at < 0 ? null : parts[at].closest(".adar-group");
    readWhere.textContent = group ? group.querySelector("h2").textContent : "Introduction";
  }

  // ============================================================
  // THE PARTS — coming up as they are reached, opening on a measured
  // height so the page does not jump under what is being read. The
  // same two moves Pineward makes, for the same reasons.
  // ============================================================
  if (!REDUCE_MOTION && "IntersectionObserver" in window) {
    let due = 0;
    const watcher = new IntersectionObserver(
      (seen) => {
        const now = performance.now();
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
    document.querySelectorAll(".adar-group-head, .adar-intro").forEach((one) => {
      one.classList.add("adar-rises");
      watcher.observe(one);
    });
  } else {
    parts.forEach((part) => part.classList.add("arrived"));
  }

  parts.forEach((part) => {
    const body = part.querySelector(".adar-body");
    if (!body) return;
    part.addEventListener("toggle", () => {
      const cue = part.querySelector(".adar-cue");
      if (cue) cue.textContent = part.open ? "Close" : "Open";
      if (REDUCE_MOTION) return;
      const to = part.open ? body.scrollHeight : 0;
      const from = part.open ? 0 : body.scrollHeight;
      body.style.height = from + "px";
      body.style.overflow = "hidden";
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
  const began = performance.now();
  function frame(now) {
    draw(window.scrollY, REDUCE_MOTION ? 0 : (now - began) / 1000);
    requestAnimationFrame(frame);
  }

  build();
  resize();
  page.classList.add("adar-ready");
  reckon();
  if (REDUCE_MOTION) {
    draw(window.scrollY, 0);
    window.addEventListener("scroll", () => draw(window.scrollY, 0), { passive: true });
  } else {
    requestAnimationFrame(frame);
  }

  let waiting = false;
  window.addEventListener("scroll", () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => { waiting = false; reckon(); });
  }, { passive: true });

  window.addEventListener("resize", () => {
    resize();
    if (REDUCE_MOTION) draw(window.scrollY, 0);
    reckon();
  });
})();
