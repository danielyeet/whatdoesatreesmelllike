// ============================================================
// Behavior for index.html's three locked slides: gentle
// scrolling between them (by wheel, keys, or the "Scroll"
// button on the title slide).
//
// Everything here is wrapped in a function that runs itself, so
// none of these names (slides, container, goTo, ease...) escape
// into the page's shared namespace where another script could
// collide with them — every other file on this site does the
// same. Two scripts declaring the same top-level name is not a
// quiet problem: the browser refuses to run the second one at
// all, and whatever it was responsible for silently disappears.
// ============================================================
(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const container = document.getElementById("scroll-container");
  if (!container || !slides.length) return; // not the landing page

  let activeIndex = 0;
  let animating = false;
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // True while the menu or a node's preview window is open over the top
  // of the slides. The arrow keys belong to whatever is in front at that
  // point — scrolling the page around behind it just looks broken.
  function overlayOpen() {
    return document.body.classList.contains("menu-open") ||
           document.body.classList.contains("preview-open");
  }

  // ============================================================
  // LEAVING THE MAP
  //
  // Going back up from the node map is not a plain scroll. The page is
  // held still while the map falls into its own centre, then while a
  // line draws itself from that centre up to the top of the screen, and
  // only then does it move. Two numbers on window carry the state, so
  // the four files that have to take part can each read it without
  // knowing about the others:
  //
  //   window.__exit    0 to 1, the collapse    (node-scene.js, paper.js,
  //                                             extras.js, thread.js)
  //   window.__reform  0 to 1, the line        (thread.js)
  //
  // Both sit at 0 the rest of the time, so nothing else in the site has
  // to care that any of this exists.
  // ============================================================
  const EXIT_MS = 1200;    // how long the map takes to fall inwards
  const REFORM_MS = 750;   // and the line to draw itself back out

  function runPhase(duration, onProgress, onDone) {
    const started = performance.now();
    function step(now) {
      const t = Math.min(1, (now - started) / duration);
      onProgress(t);
      if (t < 1) requestAnimationFrame(step);
      else onDone();
    }
    requestAnimationFrame(step);
  }

  /** The plain scroll, used on its own and as the last step of the exit. */
  function scrollToSlide(index, onDone) {
    const startY = container.scrollTop;
    const endY = slides[index].offsetTop;
    const distance = endY - startY;

    if (distance === 0) {
      activeIndex = index;
      onDone();
      return;
    }

    // IMPORTANT: CSS scroll-snap fights with a hand-animated scrollTop —
    // the browser tries to immediately snap back while we're mid-animation,
    // which is what made this look broken/not-smooth before. Turning snap
    // off for the duration of the animation, then back on once we land
    // exactly on the target slide, fixes that.
    container.style.scrollSnapType = "none";

    // The move onto the node map slide is much longer than the others:
    // the curtain, the grid, the static and the constellation leaving
    // the centre all happen during it, and rushing them turns a sequence
    // into a flicker. This is the number to change if it drags.
    const duration = (index === 2 || activeIndex === 2) ? 2400 : 1100;

    runPhase(
      duration,
      (t) => { container.scrollTop = startY + distance * ease(t); },
      () => {
        activeIndex = index;
        container.style.scrollSnapType = "y mandatory";
        onDone();
      }
    );
  }

  function goTo(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    const endY = slides[index].offsetTop;

    if (REDUCE_MOTION) {
      container.scrollTop = endY;
      activeIndex = index;
      return;
    }
    if (container.scrollTop === endY) return;

    animating = true;

    // Leaving the map upwards: collapse, reform, and only then scroll.
    if (activeIndex === 2 && index < 2) {
      runPhase(EXIT_MS, (t) => { window.__exit = t; }, () => {
        runPhase(REFORM_MS, (t) => { window.__reform = t; }, () => {
          scrollToSlide(index, () => {
            // Released only once the page has arrived, so nothing springs
            // back into place while any of it is still on screen.
            window.__exit = 0;
            window.__reform = 0;
            animating = false;
          });
        });
      });
      return;
    }

    scrollToSlide(index, () => { animating = false; });
  }

  // Keep activeIndex correct if the user scrolls by some other means
  // (scrollbar drag, touch) rather than through goTo().
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animating) activeIndex = slides.indexOf(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  slides.forEach((slide) => observer.observe(slide));

  // --- Wheel / trackpad: one gentle gesture moves exactly one slide.
  let wheelLock = false;
  container.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (wheelLock || animating || overlayOpen()) return;
      wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 1000);
      if (e.deltaY > 0) goTo(activeIndex + 1);
      else if (e.deltaY < 0) goTo(activeIndex - 1);
    },
    { passive: false }
  );

  // --- Keyboard
  window.addEventListener("keydown", (e) => {
    if (overlayOpen()) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); goTo(activeIndex + 1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); goTo(activeIndex - 1); }
  });

  // --- "Scroll" button on the title slide
  const scrollCue = document.getElementById("scroll-cue");
  if (scrollCue) scrollCue.addEventListener("click", () => goTo(1));
})();
