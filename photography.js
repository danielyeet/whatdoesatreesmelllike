// ============================================================
// PHOTOGRAPHY — categories/other-2.html only
//
// The page is laid out in its own markup and is complete without this
// file. What this adds is the two things a sheet of photographs wants
// and a stylesheet cannot do on its own:
//
//   THE FRAMES ARRIVE as you reach them, a set at a time, each one a
//     beat behind the one before it. A photographer's sheet is read
//     down rather than taken in at once, and this is the page reading
//     at the pace you scroll rather than being switched on.
//   A FRAME OPENS into a plate over the darkened page, with its
//     reading under it and an arrow either side.
//
// A frame whose <img> is still commented out has nothing to open, so
// it is left as it is: it comes up with its set and does nothing when
// pressed. That is deliberate — the page is meant to be usable while
// it is still mostly placeholders.
// ============================================================
(function () {
  const page = document.querySelector(".photo-page");
  if (!page) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frames = [...page.querySelectorAll(".photo-frame")];
  if (!frames.length) return;

  /** The frames that actually carry a picture. Everything below works
      on these; the placeholders are along for the layout. */
  const real = frames.filter((frame) => frame.querySelector("img"));

  // ============================================================
  // ARRIVING
  //
  // Each set is staggered within itself rather than the whole page
  // being staggered from the top: a set is the unit that is read, and
  // a frame's wait should be its place in ITS set, not its place in a
  // page that may be three sets long by then.
  // ============================================================
  page.querySelectorAll(".photo-set").forEach((set) => {
    [...set.querySelectorAll(".photo-frame")].forEach((frame, n) => {
      frame.style.setProperty("--n", String(n));
    });
  });

  if (REDUCE_MOTION || !("IntersectionObserver" in window)) {
    frames.forEach((frame) => frame.classList.add("here"));
  } else {
    page.classList.add("photo-waiting");
    const watch = new IntersectionObserver((seen) => {
      seen.forEach((one) => {
        if (!one.isIntersecting) return;
        one.target.classList.add("here");
        watch.unobserve(one.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    frames.forEach((frame) => watch.observe(frame));
    // Anything already on the window when the page loads should not
    // wait to be scrolled to — it has been reached already.
    window.requestAnimationFrame(() => {
      frames.forEach((frame) => {
        const box = frame.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.9) frame.classList.add("here");
      });
    });
  }

  if (!real.length) return;

  // ============================================================
  // THE VIEWER
  // ============================================================
  const viewer = document.createElement("div");
  viewer.className = "photo-viewer";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Photograph");
  viewer.innerHTML =
    '<button class="photo-viewer-shut" type="button" aria-label="Close">' +
      '<span aria-hidden="true">&#215;</span></button>' +
    '<button class="photo-viewer-arrow photo-viewer-back" type="button" aria-label="Previous photograph">' +
      '<span aria-hidden="true">&#8592;</span></button>' +
    '<figure class="photo-viewer-plate">' +
      '<img class="photo-viewer-img" alt="">' +
      '<figcaption class="photo-viewer-read">' +
        '<span class="photo-viewer-no"></span>' +
        '<span class="photo-viewer-say"></span>' +
        '<span class="photo-viewer-meta"></span>' +
      "</figcaption>" +
    "</figure>" +
    '<button class="photo-viewer-arrow photo-viewer-on" type="button" aria-label="Next photograph">' +
      '<span aria-hidden="true">&#8594;</span></button>';
  document.body.appendChild(viewer);

  const shown = viewer.querySelector(".photo-viewer-img");
  const plate = viewer.querySelector(".photo-viewer-plate");
  const readNo = viewer.querySelector(".photo-viewer-no");
  const readSay = viewer.querySelector(".photo-viewer-say");
  const readMeta = viewer.querySelector(".photo-viewer-meta");
  let viewing = false;
  let showing = 0;
  let wasOn = null;

  const words = (frame, pick) => {
    const one = frame.querySelector(pick);
    return one ? one.textContent.trim() : "";
  };

  /** Show the `n`th picture, travelling `way`. Out the way it is going
      and in from the other side — short both halves, so it reads as one
      movement rather than as a transition to sit through. */
  function show(n, way) {
    showing = (n + real.length) % real.length;
    const frame = real[showing];
    const img = frame.querySelector("img");
    const going = REDUCE_MOTION ? 0 : (way || 0);

    const paint = () => {
      shown.src = img.getAttribute("src");
      shown.alt = img.getAttribute("alt") || "";
      readNo.textContent = words(frame, ".photo-no");
      readSay.textContent = words(frame, ".photo-say");
      readMeta.textContent = words(frame, ".photo-meta");
      plate.classList.remove("going-back", "going-on");
      void plate.offsetWidth;
      if (going < 0) plate.classList.add("going-back");
      if (going > 0) plate.classList.add("going-on");
    };

    if (!going) { paint(); return; }
    plate.classList.add(going > 0 ? "leaving-on" : "leaving-back");
    window.setTimeout(() => {
      plate.classList.remove("leaving-on", "leaving-back");
      paint();
    }, 150);
  }

  function open(n, from) {
    wasOn = from || null;
    viewing = true;
    viewer.hidden = false;
    document.documentElement.classList.add("photo-viewing");
    void viewer.offsetWidth;
    viewer.classList.add("here");
    show(n, 0);
    viewer.querySelector(".photo-viewer-shut").focus();
  }

  function shut() {
    if (!viewing) return;
    viewing = false;
    viewer.classList.remove("here");
    document.documentElement.classList.remove("photo-viewing");
    if (REDUCE_MOTION) viewer.hidden = true;
    else window.setTimeout(() => { viewer.hidden = true; }, 260);
    if (wasOn && document.contains(wasOn)) wasOn.focus();
    wasOn = null;
  }

  real.forEach((frame, n) => {
    const link = frame.querySelector(".photo-plate");
    if (!link) return;
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(n, link);
    });
  });

  viewer.querySelector(".photo-viewer-back")
    .addEventListener("click", () => show(showing - 1, -1));
  viewer.querySelector(".photo-viewer-on")
    .addEventListener("click", () => show(showing + 1, 1));
  viewer.querySelector(".photo-viewer-shut").addEventListener("click", shut);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) shut();
  });

  window.addEventListener("keydown", (event) => {
    if (!viewing) return;
    if (event.key === "Escape") { shut(); return; }
    if (event.key === "ArrowLeft") { show(showing - 1, -1); event.preventDefault(); }
    if (event.key === "ArrowRight") { show(showing + 1, 1); event.preventDefault(); }
  });
})();
