// ============================================================
// THE CHAMBER (categories/favorites.html only)
//
// The favourites are a menu standing in the middle of a CHAMBER: four
// injectors, one at each corner of the window, firing a fine stream of
// particles inward. The streams fall towards the middle, are swung
// round by whatever is there, and either settle into an orbit or break
// up and scatter. It is the theories drawing's world turned inside
// out — the same particles, the same instrument marks, the same one
// cool accent kept for the things you can open — printed as ink on
// white instead of white on near-black.
//
// Four things are worth knowing before changing any of it:
//
//   It is a real fall, not a path. Every particle is pulled towards
//   the middle by an inverse-square force and carries its own sideways
//   speed, so the orbits, the slingshots and the ones that fall
//   straight in are all the same three lines of arithmetic. Writing
//   the curves by hand instead gives a pattern, and a pattern is
//   something you can see repeat.
//
//   The corners are the corners of the WINDOW. Each injector is placed
//   by working back from the screen corner it is meant to sit in at
//   its own depth, so all four stay in their corners at any window
//   size while standing at four different depths in the volume — which
//   is what keeps the streams from reading as a flat X.
//
//   Nothing is ever drawn where the writing stands. The menu's own box
//   is measured off the page and the particles behind it are dropped,
//   so the orbit passes behind the writing rather than through it.
//
//   The cursor is a hand in the volume, not a cursor on a picture: it
//   is put at each particle's own depth before it pushes, so what it
//   shoves aside is a real hole in a real stream.
//
// WITHOUT THIS FILE the page is the plain list of favourites every
// other category uses. The script puts `chambered` on <body> and takes
// over; every rule that hides the list is written under that class.
// ============================================================
(function () {
  const page = document.querySelector(".favorites-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const entries = Array.from(list.querySelectorAll(".gallery-entry"));
  if (!entries.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 11;             // the same chamber every visit

  // --- the volume
  const LENS = 1.2;            // the focal length, against the smaller side
  const MID = 20;              // the depth the middle of the chamber stands at
  const NEAR = 3.5;            // nothing nearer than this is drawn
  const FAR = 52;              // and nothing further

  // --- the four injectors, one to a corner. Each has its own depth,
  // so the streams dive through the volume rather than sliding across
  // it, and its own place on the window, worked back from that depth.
  const CORNERS = [
    { at: [0.07, 0.10], z: 13 },
    { at: [0.93, 0.13], z: 24 },
    { at: [0.94, 0.89], z: 16 },
    { at: [0.06, 0.92], z: 27 },
  ];
  const PER_STREAM = 180;      // particles in the air from each of them

  // --- the fall
  //
  // Every particle is drawn towards the middle and carries some speed
  // ACROSS that fall, and the two together are the whole of the
  // behaviour: too little across and they drop straight in, too much
  // and they sail past. What makes it read as one thing rather than as
  // four sprays is that the across-speed is the same way round for all
  // of them — every stream swirls about one axis — so the four jets
  // wind into a single orbiting disc instead of crossing in the middle.
  // A particle is SHOT at the middle, caught by a swirl as it gets
  // near, and either settles into the ring or breaks up. Four forces,
  // and each does one legible thing:
  //
  //   PULL     draws it in, harder the nearer it is
  //   SPIN     turns it, but only once it is close — which is what
  //            makes the streams read as straight until they arrive
  //   CORE     keeps the very middle clear, so what gathers is a RING
  //            standing round the writing rather than a blob behind it
  //   DRAG     takes the energy out, so they gather rather than
  //            swinging straight back out to the corner they came from
  //
  // Both launch speeds are fractions of what it would take to go round
  // in a circle at that injector's own distance, rather than flat
  // numbers: the four corners stand at four different depths and so at
  // four different distances, and flat numbers had one stream drop
  // straight down the hole while another sailed past it.
  const PULL = 320;            // how hard the middle draws a particle in
  const SOFT = 2.6;            // and how close in that pull stops growing
  const FALL = [0.95, 1.35];   // how fast one is shot at the middle
  const SWING = [0.04, 0.20];  // and how little of that is across the aim
  const CATCH = 11;            // how near the middle the chamber takes hold
  // The axis the whole chamber turns about. It points nearly at you on
  // purpose: a ring turning about an upright axis is seen edge-on from
  // here and reads as a smear across the middle rather than as a ring.
  // Tilted a little off straight, it comes out as an ellipse, which is
  // the only way a ring says which way up it is.
  const SWIRL = [0.34, 0.22, 1];
  const RING = 6.4;            // the ring it settles what it catches into
  const RING_K = 34;           // how firmly it is held there
  const SETTLE = 3.2;          // and how quickly the fall is taken out of it
  const DRAG = 0.05;           // a little drag everywhere, so nothing runs away
  const MAX_V = 15;            // nothing travels faster than this
  const LIFE = [7, 14];        // seconds in the air before it is sent again
  const SPREAD = 0.55;         // how wide a stream is where it leaves

  // --- breaking up
  const FRAGILE = 0.34;        // how many of them break up rather than orbit
  const FRAG_AT = 7.6;         // how near the middle that happens — outside
                               // the ring, where it can actually be seen
  const FRAG_KICK = [3, 8];    // how hard the pieces are thrown outward
  const FRAG_FOR = 1.5;        // and how long they last afterwards

  // --- the hand
  const HAND_PX = 150;         // how near the cursor a particle answers, in pixels
  const HAND_PUSH = 34;        // and how hard it is shoved aside

  // --- how it is drawn
  const SPECK = 0.07;          // a particle's size, in units of the volume
  const TAIL = 0.03;           // how much of its own speed it trails behind it
  const BANDS = 6;             // how many weights the specks are grouped into to draw
  const CLEAR_PAD = 18;        // how far past the writing the clear room reaches

  const INK = "23,23,15";      // --ink
  const STEEL = "109,108,98";  // --muted
  const COOL = "47,95,150";    // the theories page's accent, brought down onto white
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (pair) => pair[0] + random() * (pair[1] - pair[0]);
  const numbered = (i) => String(i + 1).padStart(2, "0");

  // ============================================================
  // WHAT IS ON THE PAGE
  //
  // The same reading the contact sheet's Favorites view takes off its
  // own entries: the chapters are the different data-chapter values in
  // the order they first appear, and each favourite carries the date it
  // is filed under. Naming them, ordering them and adding to them are
  // all HTML edits.
  // ============================================================
  const chapters = [];
  entries.forEach((entry) => {
    const name = (entry.dataset.chapter || "Unsorted").trim();
    let chapter = chapters.find((one) => one.name === name);
    if (!chapter) {
      chapter = { name: name, items: [] };
      chapters.push(chapter);
    }
    chapter.items.push({
      name: entry.textContent.trim(),
      date: (entry.dataset.date || "").trim(),
      href: entry.getAttribute("href"),
    });
  });

  // ============================================================
  // THE PAGE
  // ============================================================
  document.body.classList.add("chambered");

  const shell = document.createElement("div");
  shell.className = "chamber";

  const canvas = document.createElement("canvas");
  canvas.className = "chamber-field";
  canvas.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);

  const where = document.createElement("p");
  where.className = "page-where";
  where.textContent = "Favorites";
  shell.appendChild(where);

  // The menu. It carries what the contact sheet's Favorites menu
  // carries — the chapters, their counts, and every favourite with its
  // number, its date and its name — and stands it in one narrow column
  // down the middle of the chamber instead of in two columns down the
  // sides, so the streams close on the writing from every corner.
  const plate = document.createElement("div");
  plate.className = "chamber-plate";
  shell.appendChild(plate);

  const rail = document.createElement("div");
  rail.className = "chamber-rail";
  rail.setAttribute("role", "tablist");
  rail.setAttribute("aria-label", "Chapters");
  plate.appendChild(rail);

  chapters.forEach((chapter, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "chamber-tab";
    tab.setAttribute("role", "tab");
    tab.id = "chamber-tab-" + i;
    tab.setAttribute("aria-controls", "chamber-panel-" + i);
    tab.innerHTML =
      '<span class="chamber-reg" aria-hidden="true"></span>' +
      '<span class="chamber-tab-name"></span>' +
      '<span class="chamber-tab-count"></span>';
    tab.querySelector(".chamber-tab-name").textContent = chapter.name;
    tab.querySelector(".chamber-tab-count").textContent = String(chapter.items.length);
    rail.appendChild(tab);
    chapter.tab = tab;
  });

  const spec = document.createElement("p");
  spec.className = "chamber-spec";
  plate.appendChild(spec);

  const sheets = document.createElement("div");
  sheets.className = "chamber-sheets";
  plate.appendChild(sheets);

  chapters.forEach((chapter, i) => {
    const panel = document.createElement("section");
    panel.className = "chamber-panel";
    panel.id = "chamber-panel-" + i;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "chamber-tab-" + i);
    chapter.items.forEach((item, n) => {
      const link = document.createElement("a");
      link.className = "chamber-item";
      link.href = item.href;
      // The number and the date above, the name under them: the same
      // things the sheet's rows say, set as a stack rather than as a
      // row of columns.
      link.innerHTML =
        '<span class="chamber-file"><span class="chamber-no"></span>' +
        '<span class="chamber-date"></span></span>' +
        '<span class="chamber-name"></span>' +
        '<span class="chamber-go" aria-hidden="true">&#8594;</span>';
      link.querySelector(".chamber-no").textContent = numbered(n);
      link.querySelector(".chamber-date").textContent = item.date;
      link.querySelector(".chamber-name").textContent = item.name;
      panel.appendChild(link);
    });
    sheets.appendChild(panel);
    chapter.panel = panel;
  });

  page.insertBefore(shell, page.firstChild);
  // The list the chamber replaces need not be held back any longer —
  // see the note in this page's <head>.
  document.documentElement.classList.remove("js-coming");

  const paint = canvas.getContext("2d");

  // ============================================================
  // OPENING ONE
  // ============================================================
  let open = 0;
  // Declared up here, not with the rest of the chamber's state: a
  // chapter is opened while the page is still being built, and opening
  // one asks for the room the writing takes up to be read again. Left
  // where it belongs it does not exist yet at that moment. (The contact
  // sheet's Favorites view has been bitten by exactly this four times.)
  let remeasure = true;

  function show(next, andFocus) {
    open = (next + chapters.length) % chapters.length;
    chapters.forEach((chapter, i) => {
      const on = i === open;
      chapter.tab.classList.toggle("open", on);
      chapter.tab.setAttribute("aria-selected", on ? "true" : "false");
      // Only the open chapter's tab is in the tab order: the strip is
      // one control, and the arrow keys move within it.
      chapter.tab.tabIndex = on ? 0 : -1;
      chapter.panel.classList.toggle("open", on);
      chapter.panel.hidden = !on;
    });
    const items = chapters[open].items;
    spec.textContent =
      "ENTRIES " + numbered(items.length - 1) +
      "   ·   FIRST " + (items.length ? items[0].date : "—") +
      "   ·   LAST " + (items.length ? items[items.length - 1].date : "—");
    remeasure = true;
    if (andFocus) chapters[open].tab.focus();
  }

  chapters.forEach((chapter, i) => {
    chapter.tab.addEventListener("click", () => show(i));
  });

  rail.addEventListener("keydown", (e) => {
    let used = true;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") show(open + 1, true);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") show(open - 1, true);
    else if (e.key === "Home") show(0, true);
    else if (e.key === "End") show(chapters.length - 1, true);
    else used = false;
    if (used) e.preventDefault();
  });

  show(0);

  // ============================================================
  // THE CHAMBER
  // ============================================================
  let width = 0, height = 0, lens = 0, midX = 0, midY = 0;
  let clock = 0, last = 0;
  let taken = null;
  let handX = -9999, handY = -9999, hasHand = false;

  const stream = CORNERS.map((corner) => ({ at: corner.at, z: corner.z, x: 0, y: 0 }));

  /** Where a point in the volume lands on the window. `k` is what one
      unit at that depth is worth in pixels, which is the only thing
      anything needs to size itself by. */
  function to(x, y, z) {
    if (z <= NEAR) return null;
    const k = lens / z;
    return { x: midX + x * k, y: midY + y * k, k: k };
  }

  const specks = [];
  for (let s = 0; s < stream.length; s++) {
    for (let n = 0; n < PER_STREAM; n++) {
      specks.push({
        from: s,
        x: 0, y: 0, z: MID, vx: 0, vy: 0, vz: 0,
        px: 0, py: 0, pk: 0,
        age: 0,
        life: between(LIFE),
        size: 0.55 + random() * random() * 1.5,
        fragile: random() < FRAGILE,
        burst: 0,
        // Staggered so the streams are already full when the page
        // opens rather than arriving in four clumps.
        wait: random() * between(LIFE),
        warm: 0,
      });
    }
  }

  /** Sends one particle off from its injector, aimed at the middle
      with a little of its speed across the aim — which is the whole
      difference between one that falls straight in and one that swings
      round and stays. */
  function launch(speck) {
    const from = stream[speck.from];
    const spread = SPREAD;
    speck.x = from.x + (random() - 0.5) * 2 * spread;
    speck.y = from.y + (random() - 0.5) * 2 * spread;
    speck.z = from.z + (random() - 0.5) * 2 * spread;

    const dx = -speck.x, dy = -speck.y, dz = MID - speck.z;
    const far = Math.hypot(dx, dy, dz) || 1;
    const round = Math.sqrt(PULL / far);   // what going round at this distance takes
    const aim = round * between(FALL);
    speck.vx = (dx / far) * aim;
    speck.vy = (dy / far) * aim;
    speck.vz = (dz / far) * aim;

    // A little across the aim, turned the same way round for every
    // particle in the chamber, so that what the swirl catches is
    // already leaning the way it turns.
    const side = round * between(SWING);
    let tx = SWIRL[1] * (dz / far) - SWIRL[2] * (dy / far);
    let ty = SWIRL[2] * (dx / far) - SWIRL[0] * (dz / far);
    let tz = SWIRL[0] * (dy / far) - SWIRL[1] * (dx / far);
    const tn = Math.hypot(tx, ty, tz) || 1;
    speck.vx += (tx / tn) * side;
    speck.vy += (ty / tn) * side;
    speck.vz += (tz / tn) * side;

    speck.age = 0;
    speck.life = between(LIFE);
    speck.burst = 0;
    speck.warm = 0;
  }

  specks.forEach(launch);

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    midX = width / 2;
    midY = height / 2;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    lens = Math.min(width, height) * LENS;

    // Each injector is worked back from the corner of the window it is
    // meant to stand in, at its own depth — so all four keep their
    // corners whatever the window is doing.
    stream.forEach((one) => {
      const k = lens / one.z;
      one.x = (one.at[0] * width - midX) / k;
      one.y = (one.at[1] * height - midY) / k;
    });
    remeasure = true;
  }

  /** The room the writing takes up, read off the page rather than
      guessed at: the menu grows and shrinks with the chapter that is
      open. Nothing is drawn inside it, so the orbit passes behind the
      writing rather than through it. */
  function clearing() {
    const box = plate.getBoundingClientRect();
    taken = {
      left: box.left - CLEAR_PAD,
      top: box.top - CLEAR_PAD,
      right: box.right + CLEAR_PAD,
      foot: box.bottom + CLEAR_PAD,
    };
  }

  const clear = (x, y) =>
    !taken || x < taken.left || x > taken.right || y < taken.top || y > taken.foot;

  // ============================================================
  // THE FALL
  // ============================================================
  function move(dt) {
    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];

      if (speck.wait > 0) { speck.wait -= dt; continue; }

      speck.age += dt;
      if (speck.burst > 0) {
        speck.burst -= dt;
        if (speck.burst <= 0) { launch(speck); continue; }
      } else if (speck.age > speck.life) {
        launch(speck);
        continue;
      }

      // Drawn towards the middle, harder the nearer it is — softened
      // close in, or a particle that passes through the very middle is
      // thrown out at a speed nothing else on the page is moving at.
      const dx = -speck.x, dy = -speck.y, dz = MID - speck.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      const pull = (PULL / (r2 + SOFT * SOFT)) * dt;
      speck.vx += (dx / (r || 1)) * pull;
      speck.vy += (dy / (r || 1)) * pull;
      speck.vz += (dz / (r || 1)) * pull;

      // CAUGHT. Out in the dark a particle simply falls, which is what
      // keeps the four streams reading as streams; within CATCH of the
      // middle the chamber takes hold of it and does three things at
      // once, and it needs all three. It turns it the way the chamber
      // turns, up to the speed that would carry it round and no
      // further; it holds it to the ring, so what gathers stands
      // AROUND the writing rather than piling up behind it; and it
      // takes the fall out of it — the radial part of its travel only,
      // never the going-round part, which is the difference between an
      // orbit settling and everything grinding to a halt.
      if (r < CATCH && speck.burst <= 0) {
        const hold = 1 - r / CATCH;
        const ux = dx / (r || 1), uy = dy / (r || 1), uz = dz / (r || 1);

        let tx = SWIRL[1] * uz - SWIRL[2] * uy;
        let ty = SWIRL[2] * ux - SWIRL[0] * uz;
        let tz = SWIRL[0] * uy - SWIRL[1] * ux;
        const tn = Math.hypot(tx, ty, tz) || 1;
        tx /= tn; ty /= tn; tz /= tn;

        const round = Math.sqrt(PULL / Math.max(1, r));
        const going = speck.vx * tx + speck.vy * ty + speck.vz * tz;
        if (going < round) {
          const turn = Math.min(round - going, round * hold * dt * 3.2);
          speck.vx += tx * turn;
          speck.vy += ty * turn;
          speck.vz += tz * turn;
        }

        // Held to the ring: outward when it is inside it, inward when
        // it is outside, so there is one place for it to end up.
        const off = (r - RING) * RING_K * hold * dt;
        speck.vx += ux * off;
        speck.vy += uy * off;
        speck.vz += uz * off;

        // And the falling taken out of it, leaving the going-round.
        const fall = speck.vx * ux + speck.vy * uy + speck.vz * uz;
        const ease = Math.min(0.9, SETTLE * hold * dt);
        speck.vx -= ux * fall * ease;
        speck.vy -= uy * fall * ease;
        speck.vz -= uz * fall * ease;
      }

      // The hand, put at this particle's own depth so that what it
      // pushes aside is a hole in the stream and not a circle drawn on
      // the picture.
      if (hasHand && speck.burst <= 0) {
        const k = lens / Math.max(NEAR, speck.z);
        const reach = HAND_PX / k;
        const hx = speck.x - (handX - midX) / k;
        const hy = speck.y - (handY - midY) / k;
        const off = Math.hypot(hx, hy);
        if (off < reach) {
          const hold = 1 - off / reach;
          const shove = (HAND_PUSH * hold * hold * dt) / (off || 1);
          speck.vx += hx * shove;
          speck.vy += hy * shove;
          speck.warm = Math.max(speck.warm, hold);
        }
      }
      speck.warm *= 1 - Math.min(1, dt * 2.2);

      // Breaking up: a fragile one that reaches the middle is thrown
      // apart there and gone soon after.
      if (speck.fragile && speck.burst <= 0 && r < FRAG_AT) {
        const kick = between(FRAG_KICK);
        const a = random() * Math.PI * 2, b = (random() - 0.5) * Math.PI;
        speck.vx = Math.cos(a) * Math.cos(b) * kick;
        speck.vy = Math.sin(b) * kick;
        speck.vz = Math.sin(a) * Math.cos(b) * kick;
        speck.burst = FRAG_FOR;
      }

      if (speck.burst <= 0) {
        const slow = 1 - Math.min(0.5, DRAG * dt);
        speck.vx *= slow; speck.vy *= slow; speck.vz *= slow;
      }

      const fast = Math.hypot(speck.vx, speck.vy, speck.vz);
      if (fast > MAX_V) {
        const hold = MAX_V / fast;
        speck.vx *= hold; speck.vy *= hold; speck.vz *= hold;
      }

      speck.x += speck.vx * dt;
      speck.y += speck.vy * dt;
      speck.z += speck.vz * dt;

      // Out of the volume altogether: sent again rather than left to
      // sail away for ever.
      if (speck.z < NEAR + 0.5 || speck.z > FAR ||
          Math.abs(speck.x) > 60 || Math.abs(speck.y) > 60) {
        launch(speck);
      }
    }
  }

  // ============================================================
  // DRAWING
  // ============================================================
  const rgba = (tone, a) => "rgba(" + tone + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  function drawMarks() {
    // The ranging circles, the same marks the theories drawing puts on
    // something it is measuring. There is no crosshair at the middle:
    // the menu stands on it, and a mark that can never be seen is a
    // mark that should not be drawn.
    const centre = to(0, 0, MID);
    if (centre) {
      paint.lineWidth = 1;
      for (let n = 0; n < 2; n++) {
        const r = RING * (1 + n * 0.62) * centre.k;
        paint.strokeStyle = rgba(STEEL, n ? 0.08 : 0.13);
        paint.beginPath();
        paint.arc(centre.x, centre.y, r, 0, Math.PI * 2);
        paint.stroke();
      }
    }

    // The injectors: a registration square in each corner, a leader
    // aimed at the middle, and the depth it stands at.
    stream.forEach((one, i) => {
      const p = to(one.x, one.y, one.z);
      if (!p) return;
      const size = 9;
      paint.lineWidth = 1;
      paint.strokeStyle = rgba(COOL, 0.5);
      paint.strokeRect(Math.round(p.x - size / 2) + 0.5, Math.round(p.y - size / 2) + 0.5, size, size);

      if (centre) {
        const dx = centre.x - p.x, dy = centre.y - p.y;
        const far = Math.hypot(dx, dy) || 1;
        paint.strokeStyle = rgba(STEEL, 0.18);
        paint.beginPath();
        paint.moveTo(p.x + (dx / far) * 12, p.y + (dy / far) * 12);
        paint.lineTo(p.x + (dx / far) * 44, p.y + (dy / far) * 44);
        paint.stroke();
      }

      paint.font = "10px " + MONO;
      paint.fillStyle = rgba(STEEL, 0.6);
      const label = "S-" + numbered(i) + " · " + String(Math.round(one.z)).padStart(3, "0");
      const wide = paint.measureText(label).width;
      paint.fillText(label, one.at[0] > 0.5 ? p.x - wide - 12 : p.x + 12, p.y + 3.5);
    });
  }

  // The specks are grouped into a few weights and each group is drawn
  // in one pass — a tail that needs its own alpha needs its own stroke,
  // and there are a thousand of them. Two colours: the ink of the page,
  // and the cool accent for whatever the hand is pushing.
  const bands = [];
  for (let b = 0; b < BANDS * 2; b++) bands.push({ tails: [], dots: [] });

  function draw() {
    paint.clearRect(0, 0, width, height);

    // Everything is drawn OUTSIDE the writing — the marks and the
    // trails behind the particles as well as the particles themselves,
    // which a check on each particle's own place cannot do: a speck
    // just clear of the menu can still trail a line across it. One
    // clip with a hole in it catches all three.
    paint.save();
    if (taken) {
      paint.beginPath();
      paint.rect(0, 0, width, height);
      paint.rect(taken.left, taken.top, taken.right - taken.left, taken.foot - taken.top);
      paint.clip("evenodd");
    }

    drawMarks();
    for (let b = 0; b < bands.length; b++) {
      bands[b].tails.length = 0;
      bands[b].dots.length = 0;
    }

    for (let n = 0; n < specks.length; n++) {
      const speck = specks[n];
      if (speck.wait > 0) continue;
      const p = to(speck.x, speck.y, speck.z);
      if (!p) continue;
      if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) {
        speck.pk = 0;
        continue;
      }
      // Behind the writing: not drawn at all, so the menu reads as a
      // card standing in front of the chamber and the disc passes
      // behind it.
      if (!clear(p.x, p.y)) { speck.pk = 0; continue; }

      // In over its first moment and out over its last, so nothing is
      // ever switched on or off where you can see it happen.
      const life = speck.burst > 0
        ? Math.min(1, speck.burst / (FRAG_FOR * 0.6))
        : Math.min(1, speck.age / 0.6) * Math.min(1, (speck.life - speck.age) / 1.6);
      const near = Math.min(1, 26 / speck.z);
      const lit = life * near * (0.4 + speck.warm * 0.6);
      if (lit < 0.02) { speck.pk = 0; continue; }

      const size = Math.max(0.7, Math.min(5, speck.size * p.k * SPECK));
      const warm = speck.warm > 0.12;
      let band = Math.floor(lit * BANDS);
      if (band > BANDS - 1) band = BANDS - 1;
      if (band < 0) band = 0;
      const into = bands[band + (warm ? BANDS : 0)];

      // The tail: where it was a moment ago along its own travel, so a
      // stream reads as something going somewhere rather than as a line
      // of dots that happens to be there.
      if (speck.pk) into.tails.push(speck.px, speck.py, p.x, p.y);
      into.dots.push(p.x - size / 2, p.y - size / 2, size);

      const back = to(speck.x - speck.vx * TAIL, speck.y - speck.vy * TAIL,
                      Math.max(NEAR + 0.1, speck.z - speck.vz * TAIL));
      speck.px = back ? back.x : p.x;
      speck.py = back ? back.y : p.y;
      speck.pk = p.k;
    }

    for (let b = 0; b < bands.length; b++) {
      const band = bands[b];
      if (!band.tails.length && !band.dots.length) continue;
      const lit = ((b % BANDS) + 0.5) / BANDS;
      const tone = b >= BANDS ? COOL : INK;
      if (band.tails.length) {
        paint.strokeStyle = rgba(tone, lit * 0.42);
        paint.lineWidth = 1;
        paint.beginPath();
        for (let n = 0; n < band.tails.length; n += 4) {
          paint.moveTo(band.tails[n], band.tails[n + 1]);
          paint.lineTo(band.tails[n + 2], band.tails[n + 3]);
        }
        paint.stroke();
      }
      if (band.dots.length) {
        paint.fillStyle = rgba(tone, lit);
        paint.beginPath();
        for (let n = 0; n < band.dots.length; n += 3) {
          paint.rect(band.dots[n], band.dots[n + 1], band.dots[n + 2], band.dots[n + 2]);
        }
        paint.fill();
      }
    }
    paint.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    if (remeasure) { remeasure = false; clearing(); }
    if (!REDUCE_MOTION) {
      clock += dt;
      move(dt);
    }
    draw();
  }

  window.addEventListener("pointermove", (e) => {
    handX = e.clientX;
    handY = e.clientY;
    hasHand = true;
  });
  window.addEventListener("pointerleave", () => { hasHand = false; });
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", () => { remeasure = true; }, { passive: true });

  resize();
  // With animation turned off there is nothing to watch happening, so
  // the chamber is settled once, into the shape it would have had, and
  // then left exactly as it is.
  if (REDUCE_MOTION) {
    for (let n = 0; n < 240; n++) move(1 / 30);
  }
  draw();
  requestAnimationFrame(frame);
})();
