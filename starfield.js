// ============================================================
// THE STARFIELD (categories/theories.html only)
//
// The theories are a night sky you travel through. A field of
// particles stands in three dimensions on black; scrolling carries
// you *into* the screen, the near ones sweeping past and new ones
// coming up out of the dark. You cannot turn it or drag it — the
// only thing you can do is go further in, which is the whole of the
// gesture.
//
// Every theory is a CONSTELLATION: a small cluster of brighter
// particles with lines drawn between them, standing at its own
// depth along the road. One comes up out of the dark, brightens as
// you close on it, carries its name, and goes past behind you. The
// constellation itself is what you click.
//
// Two things are worth knowing before changing any of it:
//
//   The travel is the page's own scroll. The canvas is fixed and
//   the page is made tall enough to hold the road, so the scrollbar,
//   the trackpad, the arrow keys, Page Down and a phone's finger all
//   work without a line of code — rather than the wheel being caught
//   and turned into movement, which breaks every one of those.
//
//   The field is endless but the road is not. Particles that go
//   behind you are put back out in front, so there is always sky;
//   the constellations are laid along a road with a beginning and an
//   end, so there is always somewhere to have got to.
//
// WITHOUT THIS FILE the page is the plain list of rows every other
// category uses. The script puts `starred` on <body> and takes over;
// every rule that hides the list is written under that class, so the
// fallback cannot inherit it.
// ============================================================
(function () {
  const page = document.querySelector(".theories-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const rows = Array.from(list.querySelectorAll(".work-row"));
  if (!rows.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 7;              // the same sky every visit

  const DUST = 2400;           // how many particles are in the air at once
  const SPREAD = 26;           // how far out to the sides they are scattered
  const DEEP = 70;             // and how far ahead: one goes back out this far
  const NEAR = 0.8;            // nothing nearer than this is drawn
  const LENS = 1.15;           // the focal length, against the smaller side of the page

  const STOP_EVERY = 30;       // how far apart the constellations stand along the road
  const FIRST_STOP = 16;       // and how far in the first one is
  const RUN_ON = 26;           // how much sky is left past the last of them

  const SPARK = 13;            // how many particles a constellation is made of
  const SPARK_SPREAD = 3.2;    // how wide it stands
  const JOIN = 3;              // how many of its nearest neighbours each one is joined to

  const SHOW_FROM = 34;        // the depth a constellation starts coming up at
  const SHOW_BEST = 11;        // where it is brightest
  const SHOW_TO = 2.4;         // and where it has gone past

  const DRIFT = 0.25;          // how fast the sky creeps on its own, in units a second
  const EASE = 0.12;           // how quickly the travel catches up with the scroll

  const SCREENS = 1.25;        // how many screens of scrolling each stop is worth

  const NIGHT = "#05070d";
  const WHITE = "234,241,255";
  const BLUE = "104,178,255";

  // ============================================================
  // A SEEDED SKY
  // ============================================================
  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // The dust: the sky you travel through. Most of it is faint and
  // white; a few are blue and a little brighter, which is what keeps
  // a field of identical dots from reading as a texture.
  const dust = [];
  for (let n = 0; n < DUST; n++) {
    dust.push({
      x: (random() - 0.5) * 2 * SPREAD,
      y: (random() - 0.5) * 2 * SPREAD,
      z: NEAR + random() * DEEP,
      size: 0.7 + random() * random() * 2.6,
      lit: 0.3 + random() * random() * 0.7,
      blue: random() < 0.3,
      // A few of them carry a glow of their own, which is what keeps a
      // field of hard little squares from reading as a texture.
      glow: random() < 0.09,
    });
  }

  // The constellations: one per theory, standing at its own depth
  // along the road, each a cluster of particles with lines drawn
  // between the nearest of them.
  const stops = rows.map((row, i) => {
    const title = row.querySelector(".work-row-title");
    const meta = row.querySelector(".work-row-meta");
    const away = FIRST_STOP + i * STOP_EVERY;
    // Never dead ahead: a constellation in the middle of the screen is
    // something you fly into, and one off to the side is something you
    // pass. Out here they are placed round a slow spiral so no two of
    // them come up in the same part of the sky.
    const around = i * 2.1 + random() * 0.5;
    const out = 4.4 + random() * 3.6;
    const at = { x: Math.cos(around) * out, y: Math.sin(around) * out * 0.62, z: away };

    const sparks = [];
    for (let n = 0; n < SPARK; n++) {
      sparks.push({
        x: at.x + (random() - 0.5) * 2 * SPARK_SPREAD,
        y: at.y + (random() - 0.5) * 2 * SPARK_SPREAD,
        z: at.z + (random() - 0.5) * 2 * SPARK_SPREAD * 0.7,
        size: 1.1 + random() * 2.2,
        blue: random() < 0.45,
      });
    }

    // The figure: every particle joined to the few nearest it, with
    // each line drawn once. Nearest-neighbour rather than a shape
    // written by hand, so a constellation is always a figure and never
    // a drawing of something.
    const lines = [];
    sparks.forEach((spark, a) => {
      const near = sparks
        .map((other, b) => ({
          b: b,
          d: Math.hypot(other.x - spark.x, other.y - spark.y, other.z - spark.z),
        }))
        .filter((one) => one.b !== a)
        .sort((one, two) => one.d - two.d)
        .slice(0, JOIN);
      near.forEach((one) => {
        if (a < one.b) lines.push([a, one.b]);
      });
    });

    return {
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      href: row.getAttribute("href"),
      at: at,
      sparks: sparks,
      lines: lines,
      number: String(i + 1).padStart(2, "0"),
    };
  });

  const ROAD = FIRST_STOP + (stops.length - 1) * STOP_EVERY + RUN_ON;

  // ============================================================
  // THE PAGE
  // ============================================================
  document.body.classList.add("starred");

  const sky = document.createElement("div");
  sky.className = "sky dark-surface";

  const canvas = document.createElement("canvas");
  canvas.className = "sky-field";
  canvas.setAttribute("aria-hidden", "true");
  sky.appendChild(canvas);

  const where = document.createElement("p");
  where.className = "page-where";
  where.textContent = "Theories";
  sky.appendChild(where);

  const readout = document.createElement("p");
  readout.className = "sky-readout";
  sky.appendChild(readout);

  const cue = document.createElement("p");
  cue.className = "sky-cue";
  cue.innerHTML = '<span class="sky-cue-mark" aria-hidden="true"></span>scroll to travel';
  sky.appendChild(cue);

  // The names are real links standing over the drawing rather than
  // lettering inside it, so they can be tabbed to, read out and
  // followed like anything else on the site. Each one is sized to the
  // constellation it belongs to every frame, so the cluster itself is
  // what you click.
  const marks = document.createElement("div");
  marks.className = "sky-marks";
  sky.appendChild(marks);

  stops.forEach((stop) => {
    const mark = document.createElement("a");
    mark.className = "sky-stop";
    mark.href = stop.href;
    mark.innerHTML =
      '<span class="sky-say"><span class="sky-no"></span>' +
      '<span class="sky-name"></span><span class="sky-meta"></span></span>';
    mark.querySelector(".sky-no").textContent = stop.number;
    mark.querySelector(".sky-name").textContent = stop.name;
    mark.querySelector(".sky-meta").textContent = stop.meta;
    marks.appendChild(mark);
    stop.mark = mark;
  });

  // The road, as something the page can actually scroll down. Doing it
  // this way rather than catching the wheel is what keeps the
  // scrollbar, the arrow keys, Page Down and a finger on a phone all
  // working for free.
  const road = document.createElement("div");
  road.className = "sky-road";
  road.setAttribute("aria-hidden", "true");
  road.style.height = (stops.length * SCREENS * 100).toFixed(0) + "vh";

  page.insertBefore(road, page.firstChild);
  page.insertBefore(sky, page.firstChild);

  const paint = canvas.getContext("2d");

  // ============================================================
  // TRAVELLING
  // ============================================================
  let width = 0, height = 0, lens = 0;
  let travel = 0, wantTravel = 0, drifted = 0;
  let last = 0;

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    lens = Math.min(width, height) * LENS;
  }

  function fromScroll() {
    const room = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const along = Math.min(1, Math.max(0, window.scrollY / room));
    wantTravel = along * ROAD;
  }

  const seen = { x: 0, y: 0, size: 1, on: false };
  function project(x, y, z, size) {
    const ahead = z - travel - drifted;
    if (ahead <= NEAR) { seen.on = false; return seen; }
    const near = lens / ahead;
    seen.x = width / 2 + x * near;
    seen.y = height / 2 + y * near;
    seen.size = size * near * 0.03;
    seen.ahead = ahead;
    seen.on = true;
    return seen;
  }

  /** How near a thing at this depth is to being right in front of you. */
  function carry(ahead) {
    if (ahead <= SHOW_TO || ahead >= SHOW_FROM) return 0;
    if (ahead > SHOW_BEST) return (SHOW_FROM - ahead) / (SHOW_FROM - SHOW_BEST);
    return (ahead - SHOW_TO) / (SHOW_BEST - SHOW_TO);
  }

  // ============================================================
  // DRAWING
  // ============================================================
  function drawDust() {
    for (let n = 0; n < dust.length; n++) {
      const speck = dust[n];
      const p = project(speck.x, speck.y, speck.z, speck.size);
      if (!p.on) {
        // Gone behind you: put it back out at the far end, in a new
        // place, so the sky never runs out and never repeats.
        speck.z += DEEP;
        speck.x = (random() - 0.5) * 2 * SPREAD;
        speck.y = (random() - 0.5) * 2 * SPREAD;
        continue;
      }
      if (p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) continue;
      // Fading in out of the dark rather than switching on at the far
      // end, and never brighter than it should be up close.
      const far = Math.min(1, (DEEP - p.ahead) / (DEEP * 0.45));
      const lit = speck.lit * far * Math.min(1, 16 / p.ahead);
      if (lit < 0.012) continue;
      const tone = speck.blue ? BLUE : WHITE;
      const size = Math.max(0.7, Math.min(5, p.size));
      if (speck.glow && lit > 0.25) {
        const glow = paint.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
        glow.addColorStop(0, "rgba(" + tone + "," + (lit * 0.34).toFixed(3) + ")");
        glow.addColorStop(1, "rgba(" + tone + ",0)");
        paint.fillStyle = glow;
        paint.fillRect(p.x - size * 4, p.y - size * 4, size * 8, size * 8);
      }
      paint.fillStyle = "rgba(" + tone + "," + Math.min(1, lit).toFixed(3) + ")";
      paint.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
  }

  function drawStops() {
    for (const stop of stops) {
      const ahead = stop.at.z - travel - drifted;
      const strength = carry(ahead);
      if (strength <= 0.004) { stop.mark.classList.add("gone"); continue; }

      // Every particle of it, and where each one landed, so the lines
      // can be drawn between the same points.
      let left = Infinity, right = -Infinity, top = Infinity, foot = -Infinity;
      const put = [];
      for (const spark of stop.sparks) {
        const p = project(spark.x, spark.y, spark.z, spark.size);
        if (!p.on) { put.push(null); continue; }
        put.push({ x: p.x, y: p.y, size: p.size });
        if (p.x < left) left = p.x;
        if (p.x > right) right = p.x;
        if (p.y < top) top = p.y;
        if (p.y > foot) foot = p.y;
      }

      // The figure first, under its own particles.
      paint.strokeStyle = "rgba(" + BLUE + "," + (strength * 0.42).toFixed(3) + ")";
      paint.lineWidth = 1;
      paint.beginPath();
      for (const line of stop.lines) {
        const a = put[line[0]], b = put[line[1]];
        if (!a || !b) continue;
        paint.moveTo(a.x, a.y);
        paint.lineTo(b.x, b.y);
      }
      paint.stroke();

      // Then the particles, each with a glow around it — the only
      // things on the page that get one, which is what makes a
      // constellation read as brighter country rather than as more
      // dust.
      for (let n = 0; n < put.length; n++) {
        const at = put[n];
        if (!at) continue;
        const spark = stop.sparks[n];
        const tone = spark.blue ? BLUE : WHITE;
        const size = Math.max(1.2, Math.min(7, at.size));
        const glow = paint.createRadialGradient(at.x, at.y, 0, at.x, at.y, size * 5);
        glow.addColorStop(0, "rgba(" + tone + "," + (strength * 0.68).toFixed(3) + ")");
        glow.addColorStop(1, "rgba(" + tone + ",0)");
        paint.fillStyle = glow;
        paint.fillRect(at.x - size * 5, at.y - size * 5, size * 10, size * 10);
        paint.fillStyle = "rgba(" + tone + "," + Math.min(1, 0.25 + strength * 1.2).toFixed(3) + ")";
        paint.fillRect(at.x - size / 2, at.y - size / 2, size, size);
      }

      // The constellation itself is the thing you click: the link is
      // laid over the cluster rather than beside it.
      if (left === Infinity) { stop.mark.classList.add("gone"); continue; }
      const pad = 26;
      stop.mark.classList.remove("gone");
      stop.mark.style.left = (left - pad).toFixed(1) + "px";
      stop.mark.style.top = (top - pad).toFixed(1) + "px";
      stop.mark.style.width = (right - left + pad * 2).toFixed(1) + "px";
      stop.mark.style.height = (foot - top + pad * 2).toFixed(1) + "px";
      stop.mark.style.opacity = (0.28 + strength * 0.72).toFixed(3);
      stop.mark.classList.toggle("close", strength > 0.55);
    }
  }

  function draw() {
    paint.fillStyle = NIGHT;
    paint.fillRect(0, 0, width, height);
    drawDust();
    drawStops();

    // Which of them you are among, and how far along the road you have
    // come — the only two numbers on the page.
    let nearest = null, best = 0;
    for (const stop of stops) {
      const strength = carry(stop.at.z - travel - drifted);
      if (strength > best) { best = strength; nearest = stop; }
    }
    const along = Math.min(1, (travel + drifted) / ROAD);
    readout.textContent =
      (nearest ? nearest.number : "--") + " / " + String(stops.length).padStart(2, "0") +
      "   ·   " + String(Math.round(along * 100)).padStart(3, "0") + "%";
    cue.classList.toggle("gone", along > 0.02);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const on = Math.min(3, (now - last) / 16.7) || 1;
    last = now;
    // The sky creeps on by itself, so the page is never quite still
    // even when nothing is being done to it.
    if (!REDUCE_MOTION) drifted += (DRIFT * on) / 60;
    travel += (wantTravel - travel) * Math.min(1, EASE * on);
    draw();
  }

  window.addEventListener("scroll", fromScroll, { passive: true });
  window.addEventListener("resize", () => { resize(); fromScroll(); });

  resize();
  fromScroll();
  travel = wantTravel;
  draw();
  requestAnimationFrame(frame);
})();
