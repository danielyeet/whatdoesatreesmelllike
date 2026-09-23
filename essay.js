// ============================================================
// THE ESSAY PAGES — works/theory-*.html, works/resins-in-perfumery.html
//
// A page for a long piece of writing, drawn in the language of the
// theories drawing rather than the contact sheet's: white and
// near-white on gray-black, a fine swarm of particles standing in the
// air behind the writing, and instrument marks at the corners.
//
// Two things are on the page that the markup does not carry:
//
//   THE FIELD — the particles. They stand at their own depths and
//   drift a little on their own clock. Scrolling carries them, each
//   depth at its own rate, so the writing travels over something with
//   a distance to it rather than over a flat picture.
//
//   THE RULE — the scroll indicator down the left: a hairline with one
//   tick per section of the piece, filled in as far as you have read,
//   the section you are in named at the bottom of it and a percentage
//   under that. Every tick is a link to its own section, so the rule
//   is a way of getting about and not only a readout.
//
// WITHOUT THIS SCRIPT the page is all of its writing: the field is
// decoration and the rule is a second way to reach headings that are
// already in the page.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. Nothing here adds anything up
// frame by frame — the drift is written from the clock and the travel
// is read from `scrollY` — so scrolling back to the top of the page
// always gets you back to exactly the drawing you started with. The
// theories drawing learnt that the hard way: see the note about the
// breath in CLAUDE.md.
// ============================================================
(function () {
  const field = document.querySelector(".essay-field");
  const body = document.querySelector(".essay-body");
  if (!body) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 8123;

  const SPECKS = 220;          // how many stand in the air
  const NEAR = 0.35;           // the nearest depth one may stand at
  const FAR = 1;               // and the furthest
  const SPECK_MIN = 0.7;       // how big a near speck is drawn, in pixels
  const SPECK_MAX = 2.6;
  const SPECK_INK = 0.5;       // and how plainly
  const PARALLAX = 320;        // how far a near speck is carried by a screenful
  const DRIFT = 7;             // how far one wanders from its own place
  const DRIFT_RATE = [0.02, 0.07]; // and how slowly, in turns a second

  // Two specks nearer than this are joined, and no speck carries more
  // lines than WEB_EACH. Both are small on purpose: at a longer reach
  // the field came out as long lines striking across the page and
  // closing into triangles — a net thrown over the writing rather than
  // air standing behind it. Pineward's canopy made exactly the same
  // mistake first.
  const WEB_REACH = 58;
  const WEB_EACH = 2;
  const WEB_INK = 0.09;

  const SIGHT = 26;            // how long a corner sight's arms are
  const SIGHT_IN = 34;         // and how far in from the corner it stands
  // EXCEPT THE TOP LEFT ONE, which stands further in because the Menu
  // is there. At 34 its arms ran straight through the word — the owner
  // asked for them not to — and the Menu is not something to move: it
  // is in the same place on every page of the site.
  const SIGHT_IN_MENU = 76;

  const WHITE = "238,241,246";
  const STEEL = "150,160,176";
  const ACCENT = "142,180,226";

  // ============================================================
  // A SEEDED FIELD
  // The same page comes up the same way every time, and a resize
  // moves the field rather than rolling a different one.
  // ============================================================
  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // ============================================================
  // THE FIELD
  // ============================================================
  let paint = null;
  let width = 0;
  let height = 0;
  let specks = [];

  function build() {
    seed = SEED;
    specks = [];
    for (let i = 0; i < SPECKS; i++) {
      // A speck's place is kept as a FRACTION of the window rather than
      // in pixels, so a resize carries it with the window instead of
      // leaving half of them outside it.
      specks.push({
        u: random(),
        v: random(),
        // Deeper specks are commoner than near ones, which is what
        // gives the field a distance: the cube keeps most of them back.
        z: NEAR + (FAR - NEAR) * Math.pow(random(), 0.55),
        turn: random() * Math.PI * 2,
        rate: DRIFT_RATE[0] + random() * (DRIFT_RATE[1] - DRIFT_RATE[0]),
        lean: random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    if (!field) return;
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
                           window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    field.width = Math.round(width * ratio);
    field.height = Math.round(height * ratio);
    field.style.width = width + "px";
    field.style.height = height + "px";
    paint = field.getContext("2d");
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Where a speck stands on the window right now: its own place,
  // carried up by the scroll at its own depth's rate, wrapped round the
  // window so the air is full however far you have read. Both the
  // carrying and the wrap are worked out from `scrollY` every frame
  // rather than stepped along, so travelling back fills the air again
  // exactly as it was.
  function placeOf(s, down, clock) {
    const carry = (down / Math.max(1, height)) * PARALLAX * (1 - s.z + 0.2);
    const wander = REDUCE_MOTION ? 0 : DRIFT * (1 - s.z * 0.6);
    const turned = clock * s.rate * Math.PI * 2 + s.turn;
    let y = (s.v * height - carry) % height;
    if (y < 0) y += height;
    return {
      x: s.u * width + Math.cos(turned) * wander,
      y: y + Math.sin(turned + s.lean) * wander * 0.7,
      size: SPECK_MIN + (SPECK_MAX - SPECK_MIN) * (1 - (s.z - NEAR) / (FAR - NEAR)),
      ink: SPECK_INK * (1.1 - (s.z - NEAR) / (FAR - NEAR) * 0.75),
    };
  }

  function drawField(down, clock) {
    if (!paint) return;
    paint.clearRect(0, 0, width, height);

    const seen = specks.map((s) => placeOf(s, down, clock));

    // The lines first, so the specks are drawn over their own ends.
    // Each speck carries at most WEB_EACH of them: joining every pair
    // within reach turns a field into a scribble wherever the specks
    // happen to crowd.
    paint.strokeStyle = "rgba(" + STEEL + "," + WEB_INK + ")";
    paint.lineWidth = 1;
    paint.beginPath();
    const carried = new Array(seen.length).fill(0);
    for (let i = 0; i < seen.length; i++) {
      if (carried[i] >= WEB_EACH) continue;
      for (let j = i + 1; j < seen.length; j++) {
        if (carried[i] >= WEB_EACH) break;
        if (carried[j] >= WEB_EACH) continue;
        const dx = seen[i].x - seen[j].x;
        const dy = seen[i].y - seen[j].y;
        if (Math.abs(dx) > WEB_REACH || Math.abs(dy) > WEB_REACH) continue;
        if (Math.hypot(dx, dy) > WEB_REACH) continue;
        paint.moveTo(seen[i].x, seen[i].y);
        paint.lineTo(seen[j].x, seen[j].y);
        carried[i]++;
        carried[j]++;
      }
    }
    paint.stroke();

    // The specks themselves, grouped into a few weights with one fill
    // each — one fill per speck is the thing that will not hold sixty
    // frames a second.
    const BANDS = 4;
    for (let b = 0; b < BANDS; b++) {
      const ink = (SPECK_INK * (b + 1)) / BANDS;
      paint.fillStyle = "rgba(" + WHITE + "," + ink.toFixed(3) + ")";
      paint.beginPath();
      seen.forEach((p) => {
        const band = Math.min(BANDS - 1, Math.floor((p.ink / SPECK_INK) * BANDS));
        if (band !== b) return;
        const size = Math.max(1, Math.round(p.size));
        paint.rect(Math.round(p.x), Math.round(p.y), size, size);
      });
      paint.fill();
    }

    drawSights();
  }

  // The corner sights: the instrument marks the theories drawing ends
  // its opening with, kept here so an essay page reads as the same
  // instrument and not as a dark page with dots on it.
  function drawSights() {
    paint.strokeStyle = "rgba(" + ACCENT + ",0.5)";
    paint.lineWidth = 1;
    paint.beginPath();
    [[SIGHT_IN_MENU, SIGHT_IN_MENU, 1, 1], [width - SIGHT_IN, SIGHT_IN, -1, 1],
     [SIGHT_IN, height - SIGHT_IN, 1, -1], [width - SIGHT_IN, height - SIGHT_IN, -1, -1]]
      .forEach(([x, y, ax, ay]) => {
        paint.moveTo(x + ax * SIGHT, y);
        paint.lineTo(x, y);
        paint.lineTo(x, y + ay * SIGHT);
      });
    paint.stroke();
  }

  // ============================================================
  // THE RULE — the scroll indicator down the left
  //
  // It is built from the page's OWN sections: every <section
  // class="essay-section"> with a heading becomes a tick, in the order
  // they stand in. Nothing here is a list written twice.
  // ============================================================
  const sections = [...body.querySelectorAll(".essay-section")].filter((s) => s.querySelector("h2"));
  let rule = null;
  let run = null;
  let readout = null;
  let hereName = null;
  let ticks = [];

  // What a section is CALLED. Its heading carries the section's number
  // in a span of its own, and the number is not part of the name — read
  // whole, every tick on the rule came out as "01PREMISE".
  function nameOf(section) {
    const head = section.querySelector("h2").cloneNode(true);
    const no = head.querySelector(".essay-no");
    if (no) no.remove();
    return head.textContent.trim();
  }

  function buildRule() {
    if (!sections.length) return;
    rule = document.createElement("nav");
    rule.className = "essay-rule";
    rule.setAttribute("aria-label", "Sections of this piece");

    const line = document.createElement("div");
    line.className = "essay-rule-line";
    run = document.createElement("span");
    run.className = "essay-rule-run";
    line.appendChild(run);

    const list = document.createElement("ol");
    list.className = "essay-marks";
    sections.forEach((section, i) => {
      if (!section.id) section.id = "section-" + String(i + 1).padStart(2, "0");
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + section.id;
      link.className = "essay-mark";
      const tick = document.createElement("span");
      tick.className = "essay-mark-tick";
      const name = document.createElement("span");
      name.className = "essay-mark-name";
      name.textContent = nameOf(section);
      link.append(tick, name);
      // Pressed, this section names itself until you scroll away from
      // where the press took you — see readingAt().
      link.addEventListener("click", () => {
        pinned = i;
        pinnedAt = null;
      });
      item.appendChild(link);
      list.appendChild(item);
      ticks.push(link);
    });

    hereName = document.createElement("p");
    hereName.className = "essay-here";
    readout = document.createElement("p");
    readout.className = "essay-read";

    rule.append(line, list, hereName, readout);
    document.body.appendChild(rule);
    holdName();
  }

  // THE RULE MUST NOT MOVE WHEN THE NAME UNDER IT CHANGES.
  //
  // The rule is a fixed column standing in the middle of the window, so
  // it is centred on its OWN height — and the name under it wraps to a
  // second line when a section is called something long. A name going
  // from one line to two used to make the whole ladder, the hairline
  // and everything on it, hop half a line up the window, and back down
  // again at the next section. On The Architecture of Sweat that was a
  // visible jump between "Applying the Framework" and "Every
  // Combination", which is where the owner found it.
  //
  // So the room is reserved once, and it is the room the TALLEST name
  // this page actually has needs — measured off the page rather than
  // guessed at, so a long heading is never clipped and the rule never
  // moves whatever the piece is called. It is measured again when the
  // window changes width, since that is what changes the wrapping.
  function holdName() {
    if (!hereName || !sections.length) return;
    const was = hereName.textContent;
    hereName.style.height = "auto";
    let tallest = 0;
    sections.forEach((section) => {
      hereName.textContent = nameOf(section);
      tallest = Math.max(tallest, hereName.getBoundingClientRect().height);
    });
    hereName.textContent = was;
    hereName.style.height = Math.ceil(tallest) + "px";
  }

  // WHICH SECTION IS BEING READ.
  //
  // The honest answer most of the time is whichever one is filling the
  // most of the window — a short section between two long ones is not
  // what you are reading when a line of it is on screen and half a page
  // of the next one is. But two things have to come before that, and
  // both were asked for:
  //
  //   A SECTION YOU HAVE JUST ARRIVED AT names itself. While a
  //   heading is in the top part of the window you have just got to it,
  //   whatever else is on screen — so every section, however short,
  //   has a window in which it is the subject rather than being
  //   skipped over entirely.
  //
  //   A SECTION YOU HAVE JUST ASKED FOR names itself, from the frame
  //   you press its tick until you scroll away from where that took
  //   you. Pressing "Myrrh" and being told you are in Camphor because
  //   Camphor is longer is a readout arguing with you.
  //
  // And at the very bottom of the page the last section wins outright:
  // there is nowhere further to go, so that is what you are looking at.
  const ARRIVED_BAND = 0.45;   // the share of the window a heading is "just reached" in
  const PIN_FREE = 60;         // how far you must scroll to let a pressed tick go
  let pinned = -1;
  let pinnedAt = null;

  function filling(el) {
    const box = el.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
  }

  function readingAt(down) {
    const room = document.documentElement.scrollHeight - window.innerHeight;
    if (room > 0 && down >= room - 4) return sections.length - 1;

    if (pinned >= 0) {
      if (pinnedAt === null) pinnedAt = down;
      if (Math.abs(down - pinnedAt) <= PIN_FREE) return pinned;
      pinned = -1;
      pinnedAt = null;
    }

    const band = window.innerHeight * ARRIVED_BAND;
    let arrived = -1;
    let most = 0;
    let biggest = 0;
    sections.forEach((section, i) => {
      const top = section.getBoundingClientRect().top;
      if (top <= band && top >= -24) arrived = i;
      const room2 = filling(section);
      if (room2 > most) { most = room2; biggest = i; }
    });
    if (arrived >= 0) return arrived;
    // NO SECTION ON THE WINDOW AT ALL — past the last one, reading what
    // stands after it (the perfume primer's last word, its footnotes and
    // its sources). It used to fall through to the first section, so the
    // rule said "Introduction" three screens from the end. The last
    // section you have passed is where you are.
    if (most === 0) {
      let passed = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top < 0) passed = i;
      });
      return passed;
    }
    return biggest;
  }

  // How far through the piece the reading is. It is the SCROLL and
  // nothing else — the field may drift, the reading may not.
  function readRule(down) {
    if (!rule) return;
    const room = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const through = Math.max(0, Math.min(1, down / room));
    run.style.height = (through * 100).toFixed(2) + "%";
    readout.textContent = String(Math.round(through * 100)).padStart(2, "0") + "%";

    const at = readingAt(down);
    ticks.forEach((tick, i) => tick.classList.toggle("here", i === at));
    hereName.textContent = nameOf(sections[at]);
  }

  // ============================================================
  // THE LOOP
  // The drawing is only redrawn when something about it has changed —
  // the scroll, the window, or the clock when the page is allowed to
  // move — but the rule is read every frame, since it is cheap and it
  // is the thing anyone is actually watching.
  // ============================================================
  let last = -1;
  const began = performance.now();

  function frame(now) {
    const down = window.scrollY;
    const clock = REDUCE_MOTION ? 0 : (now - began) / 1000;
    if (!REDUCE_MOTION || down !== last) drawField(down, clock);
    last = down;
    readRule(down);
    requestAnimationFrame(frame);
  }

  build();
  resize();
  buildRule();
  document.body.classList.add("essay-lit");
  requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    resize();
    holdName();
    drawField(window.scrollY, REDUCE_MOTION ? 0 : (performance.now() - began) / 1000);
  });

  // The page's own face arrives after the page does, and it wraps the
  // names differently from the one the browser starts with, so the room
  // is measured again once it is actually in.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(holdName).catch(() => {});
  }
})();
