// ============================================================
// Behavior for index.html's three locked slides: gentle
// scrolling between them (by wheel, keys, or the "Scroll"
// button on the title slide).
// ============================================================

const slides = Array.from(document.querySelectorAll(".slide"));
const container = document.getElementById("scroll-container");

let activeIndex = 0;
let animating = false;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function goTo(index) {
  index = Math.max(0, Math.min(slides.length - 1, index));
  const startY = container.scrollTop;
  const endY = slides[index].offsetTop;
  const distance = endY - startY;

  if (REDUCE_MOTION || distance === 0) {
    container.scrollTop = endY;
    activeIndex = index;
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
  const startTime = performance.now();
  animating = true;

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    container.scrollTop = startY + distance * ease(t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      animating = false;
      activeIndex = index;
      container.style.scrollSnapType = "y mandatory";
    }
  }
  requestAnimationFrame(step);
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
    if (wheelLock || animating) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 1000);
    if (e.deltaY > 0) goTo(activeIndex + 1);
    else if (e.deltaY < 0) goTo(activeIndex - 1);
  },
  { passive: false }
);

// --- Keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); goTo(activeIndex + 1); }
  else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); goTo(activeIndex - 1); }
});

// --- "Scroll" button on the title slide
const scrollCue = document.getElementById("scroll-cue");
if (scrollCue) scrollCue.addEventListener("click", () => goTo(1));
