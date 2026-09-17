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

  // --- the sigil, which the void shows only under the hand
  const SIGIL = "../images/adar-sigil.jpg";
  const LIGHT_IN = 1.25;         // how far past the void's rim the hand lights it
  const LIGHT_EASE = 3.4;        // and how quickly it comes up and goes again

  // --- the log down the left margin
  const LOG_AT = 0.12;           // where it stands, as a share of the width
  const LOG_EVERY = 46;          // how far apart its ticks are, in pixels
  const LOG_TICK = 7;            // how long one is, and five times that every fifth
  const LOG_INK = 0.13;
  const LOG_CARRY = 0.42;        // how much of the scroll it travels with

  // --- the dust down the left margin
  const DUST = 130;              // how many specks fall there
  const DUST_FROM = 0.05;        // the band it falls in, as a share of the width
  const DUST_TO = 0.19;
  const DUST_FALL = [3, 11];     // how fast one falls, in pixels a second
  const DUST_INK = 0.36;

  const INK = "232,232,238";

  // --- the parts arriving
  const RISE_STEP = 45;
  const OPEN_MS = 760;        // how long a fragrance takes to open
  const SHUT_MS = 620;        // and to close, which is a little quicker
  // A gentle curve, flat at both ends — the same shape the chamber's
  // step uses. The standard ones cover half their travel in a quarter
  // of their length, which on a box this size is a lurch and then a
  // wait.
  const PART_EASE = "cubic-bezier(0.42, 0.02, 0.24, 1)";

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

  /** The dust down the left margin. It is kept in fractions of the
      window rather than in pixels, like everything else here, so a
      resize carries it instead of rolling a different one. */
  let dust = [];

  function build() {
    seed = SEED;
    specks = [];
    dust = [];
    for (let i = 0; i < DUST; i++) {
      dust.push({
        u: DUST_FROM + random() * (DUST_TO - DUST_FROM),
        v: random(),
        fall: DUST_FALL[0] + random() * (DUST_FALL[1] - DUST_FALL[0]),
        size: random() < 0.15 ? 2 : 1,
        ink: 0.25 + random() * 0.75,
        sway: random() * Math.PI * 2,
      });
    }
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

  // THE SIGIL. The house's own mark, which the void shows only while
  // the hand is on it — a spotlight rather than a picture hung on the
  // page. It is drawn INSIDE the hole and nowhere else, so it reads as
  // something the void has rather than something laid over it, and the
  // picture's own black ground melts into the hole's.
  //
  // If the file is not there the void simply stays empty: nothing on
  // this page waits for it.
  const sigil = new Image();
  let sigilReady = false;
  sigil.addEventListener("load", () => { sigilReady = true; });
  sigil.src = SIGIL;

  /** Where the hand is, and how far the sigil has come up for it. */
  let handX = -9999, handY = -9999;
  let spot = 0;
  let spotAt = 0;

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

    // THE LOG down the left margin. The right of the window has the
    // void and the left had nothing at all, which the owner asked to
    // have filled — subtly. So: a hairline ruled down it, ticked like
    // a depth scale and travelling with the page at its own rate, with
    // the dust below falling through it. It is an instrument mark
    // rather than a picture, which is the language the rest of the
    // site is written in, and it is drawn at a tenth of the ink the
    // void's own rings get so that it fills the space without asking
    // to be looked at.
    const logX = Math.round(width * LOG_AT);
    const shift = (down * LOG_CARRY) % LOG_EVERY;
    ink.strokeStyle = rgba(LOG_INK * 0.8);
    ink.lineWidth = 1;
    ink.beginPath();
    ink.moveTo(logX + 0.5, 0);
    ink.lineTo(logX + 0.5, height);
    ink.stroke();
    ink.beginPath();
    // Which tick is which is worked out from where the page IS, so the
    // scale cannot drift away from the page it is measuring.
    const first = Math.floor(down * LOG_CARRY / LOG_EVERY);
    for (let n = -1; n * LOG_EVERY - shift < height + LOG_EVERY; n++) {
      const y = Math.round(n * LOG_EVERY - shift) + 0.5;
      const long = (first + n) % 5 === 0 ? LOG_TICK * 2.6 : LOG_TICK;
      ink.moveTo(logX + 0.5, y);
      ink.lineTo(logX + 0.5 + long, y);
    }
    ink.strokeStyle = rgba(LOG_INK);
    ink.stroke();

    // THE DUST down the left margin, which is the only thing on that
    // side of the page. It is meant to be almost nothing: a slow fall
    // of specks in the empty band between the sounding and the
    // writing, so the left of the page is quiet rather than blank.
    // Where each one stands is worked out from the clock and wrapped,
    // never added up, so it cannot drift away from where it started.
    dust.forEach((mote) => {
      const down = (mote.v * height + clock * mote.fall) % height;
      const y = down < 0 ? down + height : down;
      const x = mote.u * width + Math.sin(clock * 0.15 + mote.sway) * 6;
      ink.fillStyle = rgba(DUST_INK * mote.ink);
      ink.fillRect(Math.round(x), Math.round(y), mote.size, mote.size);
    });

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
    // THE SIGIL, inside the hole and only while the hand is on it.
    // Clipped to the void's own circle, so nothing of it is ever seen
    // outside the hole — which is what makes it read as a spotlight
    // being carried over something already down there.
    if (sigilReady && spot > 0.01) {
      ink.save();
      ink.beginPath();
      ink.arc(cx, cy, r, 0, Math.PI * 2);
      ink.clip();
      ink.globalAlpha = spot;
      // Filled to the circle, keeping the picture's own proportions:
      // a mark squashed to fit is a different mark.
      const wide = sigil.naturalWidth || 1;
      const tall = sigil.naturalHeight || 1;
      const scale = Math.max((r * 2) / wide, (r * 2) / tall);
      ink.drawImage(sigil, cx - (wide * scale) / 2, cy - (tall * scale) / 2,
        wide * scale, tall * scale);
      ink.restore();
    }

    // And the one line that says where its edge is.
    ink.strokeStyle = rgba(0.34);
    ink.lineWidth = 1;
    ink.beginPath();
    ink.arc(cx, cy, r, 0, Math.PI * 2);
    ink.stroke();
  }

  // ============================================================
  // THE PHOTOGRAPHS
  //
  // A picture that is not there yet is taken off the page altogether,
  // which puts the hatched placeholder back under it. The alternative
  // is a browser's own broken-image mark, which reads as a fault
  // rather than as work still to come — and this page is meant to be
  // publishable one photograph at a time.
  // ============================================================
  document.querySelectorAll(".adar-part img").forEach((picture) => {
    picture.addEventListener("error", () => {
      const figure = picture.closest(".adar-plate");
      picture.remove();
      // A second or third picture has no placeholder of its own to
      // fall back to, so the whole figure goes with it.
      if (figure && figure.classList.contains("adar-plate-more")) figure.remove();
    });
  });

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

  const groups = [...document.querySelectorAll(".adar-group")];
  const intro = document.querySelector(".adar-intro");

  /** How much of the WINDOW this thing is filling, in pixels. Nothing
      here asks where something starts: the reading is meant to name
      whatever you are actually looking at, and at the foot of a long
      open fragrance the thing you are looking at began a long way up. */
  function filling(el) {
    const box = el.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
  }

  function mostOf(list) {
    let best = null;
    let most = 0;
    list.forEach((el) => {
      const room = filling(el);
      if (room > most) { most = room; best = el; }
    });
    return { el: best, room: most };
  }

  // How much of the window an open fragrance has to fill before the
  // reading names it as well as its group. Below this it is one thing
  // among several on the screen and the group is the honest answer.
  const NAMES_IT = 0.45;

  /** What a fragrance is called, without the second name some of them
      carry beside it — the reading has one line to say this in. */
  function nameOf(part) {
    const title = part.querySelector(".adar-title").cloneNode(true);
    const sub = title.querySelector(".adar-sub");
    if (sub) sub.remove();
    return title.textContent.trim();
  }

  let said = "";
  function reckon() {
    // The ticks stay a count of what you have been PAST — that is what
    // a scale down the side of a page is for — while the reading below
    // names what is in front of you now.
    const line = window.innerHeight * 0.34;
    let at = -1;
    for (let n = 0; n < parts.length; n++) {
      if (parts[n].getBoundingClientRect().top <= line) at = n; else break;
    }
    tickAt.forEach((tick, n) => tick.classList.toggle("passed", n <= at));

    const part = mostOf(parts);
    const group = mostOf(intro ? groups.concat([intro]) : groups);
    const names = part.el && part.el.open && part.room >= window.innerHeight * NAMES_IT;

    const where = !group.el || group.el === intro
      ? "Introduction"
      : group.el.querySelector("h2").textContent;
    const number = names ? parts.indexOf(part.el) + 1 : at + 1;
    const line2 = names
      ? where + ", " + nameOf(part.el)
      : where;

    const now = number + "|" + line2;
    if (now === said) return;
    said = now;
    readNo.textContent = String(Math.max(0, number)).padStart(2, "0");
    readWhere.textContent = line2;
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

  // ============================================================
  // OPENING AND CLOSING A fragrance
  //
  // A <details> opens and closes in ONE FRAME on its own, which is the
  // right thing for it to do when nothing is watching and completely
  // wrong here: the owner asked for both halves to be "smooth and
  // gradual, not so sudden". So the summary's own click is caught and
  // the element is opened or closed around an animation instead:
  //
  //   OPENING — the element is opened at once (its contents have to be
  //   on the page to be measured), the box is run from nothing to the
  //   height it wants, and the writing comes up a beat later, so the
  //   room is already opening before anything appears in it.
  //
  //   CLOSING — the writing goes FIRST and the box follows it down,
  //   and only when the box has closed is the element really shut. Shut
  //   it first and the browser takes the contents off the page in that
  //   frame, which is the cut this exists to avoid.
  //
  // Nothing here is needed for the page to work: under
  // `prefers-reduced-motion`, and with this script blocked, the
  // <details> opens and closes on its own as it always did.
  // ============================================================
  parts.forEach((part) => {
    const body = part.querySelector(".adar-body");
    const summary = part.querySelector("summary");
    if (!body || !summary) return;
    const cue = part.querySelector(".adar-cue");
    let moving = false;

    const say = () => { if (cue) cue.textContent = part.open ? "Close" : "Open"; };
    part.addEventListener("toggle", say);

    // The box's own padding has to travel with its height, or the last
    // frame of closing is a forty-pixel box with nothing in it that
    // then disappears — a small step at the end of a smooth movement,
    // which is the thing this whole treatment exists to avoid. Read off
    // the stylesheet rather than written here, so the two cannot
    // disagree.
    const padTop = getComputedStyle(body).paddingTop;
    const padBottom = getComputedStyle(body).paddingBottom;

    /** Put the box back in the page's hands once it has arrived. */
    const settle = () => {
      body.style.transition = "";
      body.style.height = "";
      body.style.opacity = "";
      body.style.transform = "";
      body.style.overflow = "";
      body.style.paddingTop = "";
      body.style.paddingBottom = "";
      moving = false;
    };

    summary.addEventListener("click", (event) => {
      if (REDUCE_MOTION) return;
      event.preventDefault();
      if (moving) return;
      moving = true;

      if (!part.open) {
        part.open = true;
        const to = body.scrollHeight;
        body.style.overflow = "hidden";
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(8px)";
        // The frame after, so there is a height of nothing for the box
        // to travel from rather than a height it already had.
        requestAnimationFrame(() => {
          body.style.transition =
            "height " + OPEN_MS + "ms " + PART_EASE + ", " +
            "opacity " + Math.round(OPEN_MS * 0.7) + "ms " + PART_EASE + " " +
              Math.round(OPEN_MS * 0.3) + "ms, " +
            "transform " + Math.round(OPEN_MS * 0.8) + "ms " + PART_EASE + " " +
              Math.round(OPEN_MS * 0.25) + "ms, " +
            "padding " + OPEN_MS + "ms " + PART_EASE;
          body.style.height = to + "px";
          body.style.paddingTop = padTop;
          body.style.paddingBottom = padBottom;
          body.style.opacity = "1";
          body.style.transform = "none";
        });
        window.setTimeout(() => { settle(); reckon(); }, OPEN_MS + 60);
        return;
      }

      const from = body.getBoundingClientRect().height;
      body.style.overflow = "hidden";
      body.style.height = from + "px";
      body.style.paddingTop = padTop;
      body.style.paddingBottom = padBottom;
      body.style.opacity = "1";
      requestAnimationFrame(() => {
        body.style.transition =
          "height " + SHUT_MS + "ms " + PART_EASE + ", " +
          "opacity " + Math.round(SHUT_MS * 0.55) + "ms " + PART_EASE + ", " +
          "transform " + Math.round(SHUT_MS * 0.6) + "ms " + PART_EASE + ", " +
          "padding " + SHUT_MS + "ms " + PART_EASE;
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(6px)";
      });
      window.setTimeout(() => {
        part.open = false;
        settle();
        say();
        reckon();
      }, SHUT_MS + 40);
    });
  });

  // ============================================================
  // ARRIVING FROM A SEARCH
  //
  // A result on the search page links straight at one fragrance —
  // #part-06 — and being shown a closed list with it somewhere inside
  // is not an answer, so the page opens it and takes you to it.
  // `SiteSearch` is only on the pages that load it; without it this
  // does nothing and the link still lands on the right part of the
  // page.
  // ============================================================
  if (window.SiteSearch) window.SiteSearch.openFromHash(".adar-part");

  // ============================================================
  // KEEPING UP
  // ============================================================
  /** How much of the sigil should be showing: all of it while the hand
      is within LIGHT_IN of the void's own rim, none of it otherwise.
      Worked out fresh rather than kept, so it cannot get stuck on. */
  function wanted() {
    if (handX < -9000) return 0;
    const cx = width * VOID_AT[0];
    const cy = height * VOID_AT[1];
    const r = small * VOID_R;
    const away = Math.hypot(handX - cx, handY - cy);
    if (away > r * LIGHT_IN) return 0;
    // Brightest in the middle of the hole and easing off towards its
    // rim, so the light has an edge to it rather than a switch.
    return Math.max(0, Math.min(1, 1.25 - (away / r) * 0.6));
  }

  window.addEventListener("pointermove", (event) => {
    handX = event.clientX;
    handY = event.clientY;
    if (REDUCE_MOTION) {
      spot = wanted();
      draw(window.scrollY, 0);
    }
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    handX = handY = -9999;
    if (REDUCE_MOTION) { spot = 0; draw(window.scrollY, 0); }
  });

  const began = performance.now();
  function frame(now) {
    // The light eases towards where the hand says it should be, so it
    // comes up and goes again rather than switching.
    const step = Math.min(0.2, (now - spotAt) / 1000);
    spotAt = now;
    spot += (wanted() - spot) * Math.min(1, step * LIGHT_EASE);
    draw(window.scrollY, (now - began) / 1000);
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
