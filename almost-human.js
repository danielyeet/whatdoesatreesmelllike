// ============================================================
// ALMOST HUMAN — works/almost-human.html
//
// The third house in Scent descriptions. Pineward's page is a wood and
// ADAR's is a void; this one is a CROWD.
//
// What is on the page that the markup does not carry:
//
//   THE FIGURES — people, standing down both margins the whole length
//   of the piece, and every one of them drawn entirely in specks. They
//   are built out of capsules — a head, a neck, a torso, two arms, two
//   legs — and the specks are scattered through those, so a figure is
//   a shape a crowd of particles happens to be making rather than an
//   outline with dots on it.
//
//   THE STRAY — and this is the house's own name, made into a
//   behaviour. Every speck knows exactly where it belongs and STANDS
//   SOMEWHERE ELSE: a fixed offset of its own, up to STRAY pixels, so
//   the figure is always nearly a person and never quite one. Bring
//   the hand near and the specks come home — the figure resolves under
//   your hand and comes apart again when you leave. Almost human until
//   you look at it.
//
//   THE RANK — the scale down the side: one tick per fragrance, inked
//   in as it is passed, filled from the very top of the page by the
//   scroll, with the reading in the corner counting them. Pineward's
//   trunk and ADAR's sounding by a third name, and it reads the page
//   the same way both of those do.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. A figure is anchored in the
// DOCUMENT, not in the window, and where it lands on the screen is
// worked out from `scrollY` every frame rather than stepped along — so
// scrolling back gets you the same crowd you left. Under
// `prefers-reduced-motion` the drift stops and the figures simply
// stand there, still at their own stray.
//
// THIS PAGE SPENDS NO ACCENT COLOUR AT ALL. Pineward has its green and
// ADAR its silver; this one is ink on the page's own paper, and what it
// spends instead is density. Nothing here is tinted.
//
// WITHOUT THIS SCRIPT the page is all of its writing: the parts are
// real <details> elements, and the drawing carries nothing to read.
// ============================================================
(function () {
  const page = document.querySelector(".human-page");
  if (!page) return;
  const parts = [...document.querySelectorAll(".human-part")];
  if (!parts.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 90312;

  // --- the figures
  //
  // THEY STAND IN THE MARGINS THE WRITING LEAVES, and the page's own
  // measure is what decides where that is: the head, the introduction
  // and the parts are all one column `COLUMN` wide, so what is left
  // either side of it is where a figure belongs. On a window too narrow
  // to have margins they stand behind the writing instead and `lit()`
  // takes them down to almost nothing there.
  const COLUMN = 940;         // the writing's own measure — style.css keeps the same
  const FIG_EVERY = 330;      // how far apart they stand down the page, in pixels
  const FIG_TALL = [170, 290];   // how tall one is drawn, in pixels
  const FIG_SPECKS = 340;     // how many specks one is made of
  const EDGE = 0.085;         // where they stand when there is no margin to stand in
  const SPECK = [1, 2.2];     // how big a speck is drawn
  const INK_MIN = 0.2;        // how plainly one is drawn at its faintest
  const INK_MAX = 0.55;       // and at its plainest
  const IDLE = 1.3;           // the pixel or so of drift each keeps about its place
  const IDLE_EVERY = [5, 17]; // and how long it takes over it, in seconds

  // --- the stray, which is the whole idea
  //
  // IT IS A SHARE OF THE FIGURE'S OWN HEIGHT and not a number of
  // pixels: a fixed twenty-six pixels is a soft edge on a tall figure
  // and a cloud with no shape at all on a short one, which is what the
  // first go looked like. At a twentieth of its height a figure is
  // plainly a person who has not quite settled.
  const STRAY = 0.052;        // how far from home a speck stands, as a share of the height
  const STRAY_NEAR = 0.12;    // and the share of it kept even when fully resolved
  const HAND = 210;           // how near the hand has to be to resolve a figure
  const HAND_EASE = 2.6;      // how quickly a figure comes home and comes apart again

  // --- the ground
  const INK = "26,26,24";

  // --- the parts arriving
  const RISE_STEP = 55;
  const OPEN_MS = 760;
  const SHUT_MS = 620;
  const PART_EASE = "cubic-bezier(0.42, 0.02, 0.24, 1)";

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // WHAT A PERSON IS, AS A HANDFUL OF CAPSULES
  //
  // Each one is a line with a thickness, given in a box one unit wide
  // and one unit tall with y running down — so a figure can be drawn at
  // any size by multiplying. A speck is put at a random point along a
  // capsule and then pushed off it by a random amount within its
  // radius, which fills the limb rather than outlining it.
  //
  // The parts are weighted by roughly how much of a person they are, so
  // the torso gets its share of the specks and the neck does not get
  // the same as a leg.
  // ============================================================
  // THE UNIT BOX IS SQUARE. A point's x and y are scaled by the SAME
  // number when a figure is drawn, so the proportions written here are
  // the proportions that come out. (The first go scaled x by 0.46 of
  // the height, which halved every width in the figure and turned the
  // whole thing into a vertical smear.)
  //
  // The parts do not overlap where a person's do not: the torso's top
  // stops at the shoulders rather than reaching up through the head,
  // and there is a neck between them. Without that the head, neck and
  // chest come out as one blob and nothing reads as a person at all.
  const BODY = [
    { a: [0.500, 0.065], b: [0.500, 0.105], r: 0.052, of: 15 },               // head
    { a: [0.500, 0.155], b: [0.500, 0.185], r: 0.017, of: 3 },                // neck
    { a: [0.500, 0.250], b: [0.500, 0.470], r: 0.082, of: 32 },               // torso
    { a: [0.435, 0.245], b: [0.345, 0.520], r: 0.027, of: 10, swings: true }, // left arm
    { a: [0.565, 0.245], b: [0.655, 0.520], r: 0.027, of: 10, swings: true }, // right arm
    { a: [0.462, 0.500], b: [0.442, 0.930], r: 0.037, of: 15, swings: true }, // left leg
    { a: [0.538, 0.500], b: [0.558, 0.930], r: 0.037, of: 15, swings: true }, // right leg
  ];
  const BODY_TOTAL = BODY.reduce((sum, one) => sum + one.of, 0);

  /** One figure's worth of specks, in its own unit box. `lean` tips the
      arms and legs a little so no two people stand exactly alike. */
  function makeBody(lean) {
    const out = [];
    for (let n = 0; n < FIG_SPECKS; n++) {
      let pick = random() * BODY_TOTAL;
      let limb = BODY[BODY.length - 1];
      for (let i = 0; i < BODY.length; i++) {
        pick -= BODY[i].of;
        if (pick <= 0) { limb = BODY[i]; break; }
      }
      // Arms and legs swing about their own top end; the head, neck and
      // torso are the part of a person that does not.
      let bx = limb.b[0], by = limb.b[1];
      if (limb.swings) {
        const ax = limb.a[0], ay = limb.a[1];
        const dx = bx - ax, dy = by - ay;
        const turn = lean * (limb.b[0] < 0.5 ? -1 : 1);
        bx = ax + dx * Math.cos(turn) - dy * Math.sin(turn);
        by = ay + dx * Math.sin(turn) + dy * Math.cos(turn);
      }
      const t = random();
      const away = Math.sqrt(random()) * limb.r;
      const turn = random() * Math.PI * 2;
      out.push([
        limb.a[0] + (bx - limb.a[0]) * t + Math.cos(turn) * away,
        limb.a[1] + (by - limb.a[1]) * t + Math.sin(turn) * away,
      ]);
    }
    return out;
  }

  // ============================================================
  // THE CROWD
  //
  // Built once, in DOCUMENT space, and rebuilt only when the page's own
  // height or width changes — a figure belongs to a place in the
  // writing, not to a place on the screen.
  // ============================================================
  const canvas = document.querySelector(".human-field");
  const ink = canvas ? canvas.getContext("2d") : null;
  let width = 0, height = 0, docTall = 0;
  let crowd = [];

  function build() {
    seed = SEED;
    crowd = [];
    if (!width || !docTall) return;
    // The middle of each margin, or the edge of the window when the
    // window is too narrow to have one.
    const free = Math.max(0, (width - COLUMN) / 2);
    const stand = free > 150 ? (free / 2) / width : EDGE;
    const top = window.innerHeight * 0.5;
    for (let y = top; y < docTall - 60; y += FIG_EVERY * between(0.84, 1.16)) {
      // Left and right alternately, each a little way in or out of its
      // own margin so the two columns are not a pair of railings.
      const side = crowd.length % 2 === 0 ? 0 : 1;
      const tall = between(FIG_TALL[0], FIG_TALL[1]);
      const mid = side === 0
        ? stand + between(-0.022, 0.026)
        : 1 - stand + between(-0.026, 0.022);
      const body = makeBody(between(-0.22, 0.22));
      const specks = body.map((one) => ({
        // Where it belongs, as a share of the width across and pixels
        // down the document.
        hx: mid + (one[0] - 0.5) * tall / width,
        hy: y + one[1] * tall,
        // AND WHERE IT ACTUALLY STANDS. Fixed for the life of the
        // figure, so the crowd is always wrong in the same way — a
        // stray that re-rolled would read as a fizz rather than as a
        // shape that has not settled.
        sx: between(-STRAY, STRAY) * tall,
        sy: between(-STRAY, STRAY) * tall,
        size: Math.max(1, Math.round(between(SPECK[0], SPECK[1]))),
        ink: between(INK_MIN, INK_MAX),
        every: between(IDLE_EVERY[0], IDLE_EVERY[1]),
        phase: random() * Math.PI * 2,
      }));
      crowd.push({ y: y, tall: tall, mid: mid, specks: specks, home: 0 });
    }
  }

  function size() {
    if (!canvas) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tall = document.documentElement.scrollHeight;
    const same = w === width && h === height && Math.abs(tall - docTall) < 40;
    width = w; height = h; docTall = tall;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  let handX = -99999, handY = -99999;

  /** How much of a speck is left where it stands over the writing: the
      column's own room, kept quiet without being kept empty. Asked of
      the COLUMN rather than of a share of the window, so the quiet
      band is exactly where the reading is however wide the window
      happens to be. */
  const EASED_IN = 80;        // how far outside the column it starts going quiet
  function lit(x) {
    const edge = Math.max(0, (width - COLUMN) / 2);
    const from = edge - EASED_IN, to = width - edge + EASED_IN;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / EASED_IN;
    return 0.05 + 0.95 * Math.max(0, 1 - Math.min(1, inside));
  }

  function draw(down, clock) {
    if (!ink || !width) return;
    ink.clearRect(0, 0, width, height);
    const idle = REDUCE_MOTION ? 0 : IDLE;

    crowd.forEach((figure) => {
      const top = figure.y - down;
      if (top > height + 60 || top + figure.tall < -60) return;

      // HOW FAR HOME THIS ONE HAS COME. Asked of the figure's own
      // middle rather than of each speck, so a figure resolves as a
      // person — which is the point of it — instead of a patch of one
      // sharpening under the pointer.
      const cx = figure.mid * width;
      const cy = top + figure.tall * 0.45;
      const away = Math.hypot(handX - cx, handY - cy);
      const want = handX < -9000
        ? 0
        : Math.max(0, Math.min(1, 1 - away / (HAND + figure.tall * 0.5)));
      // Eased towards rather than set, so it comes home and comes apart
      // again at a pace rather than snapping between the two.
      figure.home += (want - figure.home) *
        Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : 0.016));
      const held = STRAY_NEAR + (1 - STRAY_NEAR) * (1 - figure.home);

      figure.specks.forEach((one) => {
        const wander = idle === 0 ? 0 : idle *
          Math.sin((clock / one.every) * Math.PI * 2 + one.phase);
        const x = one.hx * width + one.sx * held + wander;
        const y = one.hy - down + one.sy * held + wander * 0.7;
        if (y < -8 || y > height + 8) return;
        // A speck that has come home is drawn a shade more plainly than
        // one still out in the scatter: resolving is something you can
        // see as well as something you can make out.
        const shown = one.ink * (0.78 + 0.34 * figure.home) * lit(x);
        if (shown < 0.012) return;
        ink.fillStyle = rgba(shown);
        ink.fillRect(Math.round(x), Math.round(y), one.size, one.size);
      });
    });
  }

  // ============================================================
  // THE PHOTOGRAPHS
  //
  // A picture that is not there yet is taken off the page altogether,
  // which puts the hatched placeholder back under it — a browser's own
  // broken-image mark reads as a fault rather than as work still to
  // come, and this house is meant to be publishable one photograph at
  // a time.
  // ============================================================
  document.querySelectorAll(".human-part img").forEach((picture) => {
    picture.addEventListener("error", () => picture.remove());
    // AND THE ONES THAT HAVE ALREADY FAILED BY NOW. A picture whose
    // file is missing usually errors before this script has run at all,
    // and an `error` listener added afterwards never hears about it —
    // so on a house with no photographs yet every placeholder stayed
    // hidden behind a broken picture. `complete` with no width is a
    // picture the browser has finished with and got nothing from.
    if (picture.complete && !picture.naturalWidth) picture.remove();
  });

  // ============================================================
  // THE RANK — the scale down the side, and the reading
  //
  // Pineward's trunk and ADAR's sounding by a third name, and it says
  // the same two things they do, separately: the FILL is how far down
  // the page you are, from its very first pixel, and the TICKS are how
  // many fragrances you have been past.
  // ============================================================
  const rank = document.createElement("div");
  rank.className = "human-rank";
  rank.setAttribute("aria-hidden", "true");
  rank.innerHTML =
    '<span class="human-rank-line"><span class="human-rank-fill"></span></span>';
  const ticks = document.createElement("div");
  ticks.className = "human-ticks";
  parts.forEach(() => {
    const tick = document.createElement("span");
    tick.className = "human-tick";
    ticks.appendChild(tick);
  });
  rank.appendChild(ticks);
  page.appendChild(rank);

  const readout = document.createElement("p");
  readout.className = "human-readout";
  readout.innerHTML =
    '<span class="human-readout-no">00</span>' +
    '<span class="human-readout-of"> / ' +
      String(parts.length).padStart(2, "0") + "</span>" +
    '<span class="human-readout-where">Introduction</span>';
  page.appendChild(readout);

  const tickAt = Array.from(ticks.children);
  const rankFill = rank.querySelector(".human-rank-fill");
  const readNo = readout.querySelector(".human-readout-no");
  const readWhere = readout.querySelector(".human-readout-where");

  /** How much of the WINDOW this thing is filling, in pixels. */
  function filling(el) {
    const box = el.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
  }

  const NAMES_IT = 0.45;

  function nameOf(part) {
    const title = part.querySelector(".human-title");
    return title ? title.textContent.trim() : "";
  }

  let said = "";
  function reckon() {
    const line = window.innerHeight * 0.34;
    let at = -1;
    for (let n = 0; n < parts.length; n++) {
      if (parts[n].getBoundingClientRect().top <= line) at = n; else break;
    }
    const down = window.scrollY || window.pageYOffset || 0;
    const room = Math.max(0,
      document.documentElement.scrollHeight - window.innerHeight);
    // AT THE FOOT OF THE PAGE, EVERYTHING HAS BEEN PASSED. The last
    // fragrances never reach a line a third of the way down the window,
    // because the page runs out before they can. Pineward and ADAR both
    // had that fault and both have this rule; the three are worth
    // keeping in step.
    if (room > 0 && down >= room - 2) at = parts.length - 1;
    tickAt.forEach((tick, n) => tick.classList.toggle("passed", n <= at));

    if (rankFill) {
      const filled = room > 0 ? Math.max(0, Math.min(1, down / room)) : 0;
      rankFill.style.transform = "scaleY(" + filled.toFixed(4) + ")";
    }

    let most = 0, biggest = null;
    parts.forEach((part) => {
      const got = filling(part);
      if (got > most) { most = got; biggest = part; }
    });
    // WHAT YOU ARE LOOKING AT. An open fragrance filling enough of the
    // window names itself; otherwise the answer is the introduction
    // until you have passed the first fragrance, and the house after
    // that. Asked of the COUNT rather than of what is filling the
    // window, because this page is short enough that the introduction
    // is still on screen at the foot of it — which had the reading
    // saying "05 / 05 · Introduction".
    const names = biggest && biggest.open && most >= window.innerHeight * NAMES_IT;
    const where = names ? nameOf(biggest) : (at < 0 ? "Introduction" : "The house");
    const now = String(at + 1) + "|" + where;
    if (now === said) return;
    said = now;
    readNo.textContent = String(Math.max(0, at + 1)).padStart(2, "0");
    readWhere.textContent = where;
  }

  // ============================================================
  // THE PARTS — coming up as they are reached, and opening on a
  // measured height so the page does not jump under what is being
  // read. The same two moves Pineward and ADAR make, for the same
  // reasons the owner gave for them: "smooth and gradual, not so
  // sudden".
  // ============================================================
  if (!REDUCE_MOTION && "IntersectionObserver" in window) {
    // PUT ON BEFORE ANYTHING IS WATCHED, because this is the class that
    // holds the parts back. Nothing is hidden until the script says it
    // is watching, so a blocked script leaves every one of them on the
    // page — and putting it on late would show them and then take them
    // away again.
    page.classList.add("human-ready");
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
    document.querySelectorAll(".human-intro").forEach((one) => {
      one.classList.add("human-rises");
      watcher.observe(one);
    });
  } else {
    parts.forEach((part) => part.classList.add("arrived"));
  }

  parts.forEach((part) => {
    const body = part.querySelector(".human-body");
    const summary = part.querySelector("summary");
    if (!body || !summary) return;
    const cue = part.querySelector(".human-cue");
    let moving = false;
    let pending = false;

    const say = () => { if (cue) cue.textContent = part.open ? "Close" : "Open"; };
    part.addEventListener("toggle", say);

    // Read off the stylesheet rather than written here, so the two
    // cannot disagree: the padding has to travel with the height, or
    // the last frame of closing is an empty box that then disappears.
    const padTop = getComputedStyle(body).paddingTop;
    const padBottom = getComputedStyle(body).paddingBottom;

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

    const drain = () => {
      if (!pending) return;
      pending = false;
      act();
    };

    function act() {
      moving = true;

      if (!part.open) {
        // Opened at once, because its contents have to be on the page
        // to be measured, and then run from nothing to the height they
        // want.
        part.open = true;
        const to = body.scrollHeight;
        body.style.overflow = "hidden";
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(8px)";
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
        window.setTimeout(() => { settle(); size(); reckon(); drain(); }, OPEN_MS + 60);
        return;
      }

      // Closing, the writing goes first and the box follows it down —
      // shut the element first and the browser takes the contents off
      // the page in that frame, which is the cut this exists to avoid.
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
        size();
        reckon();
        drain();
      }, SHUT_MS + 40);
    }

    summary.addEventListener("click", (event) => {
      if (REDUCE_MOTION) return;
      event.preventDefault();
      // A click that lands while the box is still moving is REMEMBERED,
      // not dropped — and only one is kept, so hammering the summary
      // does at most one more thing rather than queueing up a pile.
      if (moving) { pending = true; return; }
      act();
    });
  });

  // A result on the search page links straight at one fragrance, and
  // being shown a closed list with it somewhere inside is not an
  // answer. `SiteSearch` is only on the pages that load it; without it
  // this does nothing and the link still lands on the right part of the
  // page.
  if (window.SiteSearch) window.SiteSearch.openFromHash(".human-part");

  // ============================================================
  // KEEPING UP
  // ============================================================
  window.addEventListener("pointermove", (event) => {
    handX = event.clientX;
    handY = event.clientY;
    if (REDUCE_MOTION) draw(window.scrollY, 0);
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    handX = -99999; handY = -99999;
  });

  window.addEventListener("resize", () => { size(); reckon(); });
  window.addEventListener("scroll", reckon, { passive: true });

  size();
  reckon();

  if (REDUCE_MOTION) {
    draw(window.scrollY, 0);
    window.addEventListener("scroll", () => draw(window.scrollY, 0), { passive: true });
  } else {
    const began = performance.now();
    (function frame(now) {
      draw(window.scrollY, (now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
