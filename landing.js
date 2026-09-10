// ============================================================
// Behavior for index.html's three locked slides: the dots on
// the right, gentle scrolling between slides (by wheel, keys,
// dots, or the "Scroll" button), and syncing which dot is lit.
// ============================================================

const slides = Array.from(document.querySelectorAll(".slide"));
const dotNav = document.getElementById("dot-nav");
const container = document.getElementById("scroll-container");

slides.forEach((slide, i) => {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.setAttribute("aria-label", "Go to section " + (i + 1) + " of " + slides.length);
  dot.addEventListener("click", () => goTo(i));
  dotNav.appendChild(dot);
});
const dots = Array.from(document.querySelectorAll(".dot"));

let activeIndex = 0;
let animating = false;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setActiveDot(index) {
  activeIndex = index;
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
}

// --- A slow, gentle ease — this is what makes the transition between
// slides feel soft rather than snappy. easeInOutCubic.
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function goTo(index) {
  index = Math.max(0, Math.min(slides.length - 1, index));
  if (index === activeIndex && !animating) { /* still fine to re-run */ }
  const startY = container.scrollTop;
  const endY = slides[index].offsetTop;
  const distance = endY - startY;

  if (REDUCE_MOTION || distance === 0) {
    container.scrollTop = endY;
    setActiveDot(index);
    return;
  }

  const duration = 1100; // ms — slower and gentler than the old default
  const startTime = performance.now();
  animating = true;

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    container.scrollTop = startY + distance * ease(t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      animating = false;
      setActiveDot(index);
    }
  }
  requestAnimationFrame(step);
}

// Keep the dots in sync if the user drags the scrollbar directly.
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !animating) setActiveDot(slides.indexOf(entry.target));
    });
  },
  { threshold: 0.6 }
);
slides.forEach((slide) => observer.observe(slide));
setActiveDot(0);

// --- Wheel / trackpad: one gentle gesture moves exactly one slide,
// instead of the browser's native (often abrupt) snap jump.
let wheelLock = false;
container.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (wheelLock || animating) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 700);
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
