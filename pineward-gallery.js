// ============================================================
// THE PINEWARD GALLERY — houses/pineward.html only
//
// The pictures the owner took for that page, standing at the foot of
// it: a strip of small squares that cycles on its own, and a VIEWER
// that opens any of them over a darkened page.
//
// WHAT IT IS, in the owner's own words: the pictures are "small, and
// square"; the strip cycles by itself "unless hovered"; pressing one
// darkens "the whole page" and stands that picture "in the middle of
// the screen", with "its number on the top right of that picture,
// which should correspond to nothing but the number of this image in
// the presentation chronologically"; and both the strip and the viewer
// carry arrows either side.
//
// THE NUMBER IS THE POSITION, NOT THE FILE. `pineward-40.jpg` is the
// twenty-fourth picture in the strip and is shown as 24. That is what
// "chronologically" means here — where it stands in the presentation —
// and it is why nothing reads the number out of the filename.
//
// WITHOUT THIS SCRIPT the strip is a plain row of pictures, each one a
// link to its own full-size copy. Everything below is added to that
// rather than replacing it: the links keep their `href`, and the
// viewer only opens because the press is caught first.
// ============================================================
(function () {
  const gallery = document.querySelector(".pine-gallery");
  if (!gallery) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reel = gallery.querySelector(".pine-reel");
  const run = gallery.querySelector(".pine-run");
  const shots = [...gallery.querySelectorAll(".pine-shot")];
  if (!reel || !run || !shots.length) return;

  const CYCLE_EVERY = 2600;   // how long a picture stands before the strip moves on
  const SETTLE = 90;          // a resize is measured once it has stopped happening

  // ============================================================
  // THE STRIP
  //
  // It travels by whole pictures rather than by pixels, and how many
  // are on the window at once is whatever fits — so the same strip is
  // six pictures wide on a desktop and two on a phone without anything
  // being told which it is. `step()` measures that off the page rather
  // than working it out from the stylesheet, because the stylesheet is
  // where the sizes live and there should not be two copies of them.
  // ============================================================
  let at = 0;

  /** How far one picture is, in pixels, gap included. Measured off two
      real neighbours: reading a width and adding a gap means knowing
      what the gap is, and it is a clamp(). */
  function step() {
    if (shots.length < 2) return shots[0] ? shots[0].getBoundingClientRect().width : 0;
    const one = shots[0].getBoundingClientRect();
    const two = shots[1].getBoundingClientRect();
    return Math.max(1, two.left - one.left);
  }

  /** How many whole pictures the window holds. */
  function room() {
    const wide = reel.getBoundingClientRect().width;
    return Math.max(1, Math.round(wide / step()));
  }

  /** The last place the strip can stand and still be full. Stopping
      there rather than running on to the last picture means the strip
      never ends on a stretch of nothing. */
  function last() {
    return Math.max(0, shots.length - room());
  }

  function place(travel) {
    at = Math.max(0, Math.min(last(), at));
    run.style.transition = travel && !REDUCE_MOTION
      ? "transform 0.62s cubic-bezier(0.22, 0.61, 0.24, 1)"
      : "none";
    run.style.transform = "translate3d(" + -Math.round(at * step()) + "px,0,0)";
    back.disabled = at <= 0;
    on.disabled = at >= last();
  }

  const back = gallery.querySelector(".pine-arrow-back");
  const on = gallery.querySelector(".pine-arrow-on");

  function go(by, travel) {
    at += by;
    // Round the ends rather than stopping at them: the strip is
    // cycling on its own, and a carousel that runs to the end and sits
    // there has stopped cycling.
    if (at > last()) at = 0;
    if (at < 0) at = last();
    place(travel !== false);
  }

  if (back) back.addEventListener("click", () => { go(-1); hold(); });
  if (on) on.addEventListener("click", () => { go(1); hold(); });

  // ============================================================
  // CYCLING ON ITS OWN, AND STOPPING WHEN IT IS BEING LOOKED AT
  //
  // "unless hovered" is the whole of the rule, and three more things
  // count as being looked at for the same reason: the keyboard being
  // in the strip, the viewer being open over it, and the tab not being
  // the one in front. A carousel that advances while you are reading
  // one of its pictures — or while you are not in the room — is the
  // thing this is avoiding.
  // ============================================================
  let clock = 0;

  function running() {
    return !REDUCE_MOTION && !held && !viewing && !document.hidden;
  }

  let held = false;

  function tick() {
    if (running()) go(1);
  }

  function start() {
    if (clock) return;
    if (REDUCE_MOTION) return;
    clock = window.setInterval(tick, CYCLE_EVERY);
  }

  function stop() {
    if (!clock) return;
    window.clearInterval(clock);
    clock = 0;
  }

  /** Put the clock back to the top. Pressing an arrow should give you
      the full stand on the picture you asked for, not whatever was
      left of the one before it. */
  function hold() {
    stop();
    start();
  }

  ["pointerenter", "focusin"].forEach((what) =>
    gallery.addEventListener(what, () => { held = true; }));
  ["pointerleave", "focusout"].forEach((what) =>
    gallery.addEventListener(what, () => {
      held = gallery.contains(document.activeElement);
    }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) hold(); });

  // ============================================================
  // THE VIEWER
  //
  // Built once, and kept: it is one picture, one number and two
  // arrows, and rebuilding that on every press would mean the picture
  // is fetched again every time.
  // ============================================================
  const viewer = document.createElement("div");
  viewer.className = "pine-viewer";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "The Pineward gallery");
  viewer.innerHTML =
    '<button class="pine-viewer-shut" type="button" aria-label="Close">' +
      '<span aria-hidden="true">&#215;</span></button>' +
    '<button class="pine-viewer-arrow pine-viewer-back" type="button" aria-label="Previous picture">' +
      '<span aria-hidden="true">&#8592;</span></button>' +
    '<figure class="pine-viewer-plate">' +
      // TWO LAYERS, NOT ONE. See `show()`.
      '<img class="pine-viewer-img is-on" alt="">' +
      '<img class="pine-viewer-img" alt="" aria-hidden="true">' +
      '<span class="pine-viewer-no" aria-hidden="true"></span>' +
    '</figure>' +
    '<button class="pine-viewer-arrow pine-viewer-on" type="button" aria-label="Next picture">' +
      '<span aria-hidden="true">&#8594;</span></button>';
  document.body.appendChild(viewer);

  const layers = [...viewer.querySelectorAll(".pine-viewer-img")];
  const number = viewer.querySelector(".pine-viewer-no");
  const plate = viewer.querySelector(".pine-viewer-plate");
  let viewing = false;
  let showing = 0;
  let wasOn = null;
  let front = 0;       // which of the two layers is the one on show
  let swapping = null; // the change in flight, so a fast press cancels it

  const numbered = (n) => String(n).padStart(2, "0");
  const fullOf = (shot) => shot.dataset.full || shot.getAttribute("href");

  /** PUT THE NUMBER ON THE PICTURE'S OWN CORNER, not on the window's.
      The owner asked for it "on the top right of that picture", and the
      plate is a fixed window now — wider than an upright photograph — so
      the two corners are not the same corner. Where the picture
      actually lands inside that window is worked out the way
      `object-fit: contain` works it out, and the number is put there. */
  function markNumber() {
    const img = layers[front];
    const box = plate.getBoundingClientRect();
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh || !box.width) { number.style.right = ""; number.style.top = ""; return; }
    const fit = Math.min(box.width / nw, box.height / nh);
    number.style.right = Math.round((box.width - nw * fit) / 2 + 10) + "px";
    number.style.top = Math.round((box.height - nh * fit) / 2 + 10) + "px";
  }

  /** Have the browser fetch and DECODE a picture before anything has to
      draw it. This is the whole of the difference between the change
      the owner called choppy and the one that is here now: setting an
      `src` and animating in the same breath asks the browser to decode
      a two-megapixel photograph inside the first frame of the movement,
      and it simply does not — it drops frames until the picture is
      ready. Decoding first means the animation has nothing left to do
      but move something that is already there. */
  function ready(src) {
    const img = new Image();
    img.src = src;
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  }

  /** The two either side, fetched quietly, so stepping through the
      gallery at speed never waits for a decode at all. */
  function warm(n) {
    [n - 1, n + 1].forEach((at) => {
      const shot = shots[(at + shots.length) % shots.length];
      if (shot) ready(fullOf(shot));
    });
  }

  /** Show picture `n`, travelling `way` (-1 back, 1 on, 0 arriving).

      TWO LAYERS, CROSS-SLID. One picture goes out the way you are
      going while the next comes in from the other side, both in the
      same movement and both already decoded. The version before this
      had ONE layer and did it in two halves — slide out, swap the
      `src`, slide in — which meant a gap in the middle where the plate
      held nothing at all, and a decode landing inside it. That gap is
      what read as choppy.

      A cross-FADE is still not what this is: two photographs dissolved
      through each other are a moment of mud. They slide. */
  function show(n, way) {
    showing = (n + shots.length) % shots.length;
    const full = fullOf(shots[showing]);
    const going = REDUCE_MOTION ? 0 : (way || 0);
    number.textContent = numbered(showing + 1);

    if (!going) {
      layers[front].src = full;
      layers[front].classList.add("is-on");
      layers[1 - front].classList.remove("is-on");
      layers[1 - front].removeAttribute("src");
      ready(full).then(() => { markNumber(); warm(showing); });
      return;
    }

    const mine = {};
    swapping = mine;
    const out = layers[front], into = layers[1 - front];
    into.src = full;
    ready(full).then(() => {
      // A press that landed while this one was being decoded wins.
      if (swapping !== mine || !viewing) return;
      front = 1 - front;
      into.classList.remove("from-back", "from-on");
      into.classList.add(going > 0 ? "from-on" : "from-back");
      void into.offsetWidth;
      into.classList.add("is-on");
      into.classList.remove("from-back", "from-on");
      markNumber();
      out.classList.remove("is-on");
      out.classList.add(going > 0 ? "to-back" : "to-on");
      window.setTimeout(() => {
        if (swapping !== mine) return;
        out.classList.remove("to-back", "to-on");
        out.removeAttribute("src");
        warm(showing);
      }, 420);
    });
  }

  function open(n, from) {
    wasOn = from || null;
    viewing = true;
    viewer.hidden = false;
    document.documentElement.classList.add("pine-viewing");
    void viewer.offsetWidth;
    viewer.classList.add("here");
    show(n, 0);
    viewer.querySelector(".pine-viewer-shut").focus();
  }

  function shut() {
    if (!viewing) return;
    viewing = false;
    viewer.classList.remove("here");
    document.documentElement.classList.remove("pine-viewing");
    const done = () => { viewer.hidden = true; };
    if (REDUCE_MOTION) done();
    else window.setTimeout(done, 260);
    if (wasOn && document.contains(wasOn)) wasOn.focus();
    wasOn = null;
    hold();
  }

  shots.forEach((shot, n) => {
    shot.addEventListener("click", (event) => {
      // Let a modified press through: somebody asking for a new tab is
      // asking for the picture's own file, which is what the href is.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(n, shot);
    });
  });

  viewer.querySelector(".pine-viewer-back")
    .addEventListener("click", () => show(showing - 1, -1));
  viewer.querySelector(".pine-viewer-on")
    .addEventListener("click", () => show(showing + 1, 1));
  viewer.querySelector(".pine-viewer-shut").addEventListener("click", shut);
  // Pressing the ground behind the picture closes it; pressing the
  // picture itself does not.
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) shut();
  });

  window.addEventListener("keydown", (event) => {
    if (!viewing) return;
    if (event.key === "Escape") { shut(); return; }
    if (event.key === "ArrowLeft") { show(showing - 1, -1); event.preventDefault(); }
    if (event.key === "ArrowRight") { show(showing + 1, 1); event.preventDefault(); }
  });

  // ============================================================
  // Measuring, and re-measuring
  // ============================================================
  let sizing = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(sizing);
    sizing = window.setTimeout(() => {
      place(false);
      if (viewing) markNumber();
    }, SETTLE);
  });

  place(false);
  start();
})();
