// ============================================================
// This file does three small things:
//   1. Builds the row of dots on the right and highlights the
//      one for whatever slide is currently in view.
//   2. Lets the Up/Down arrow keys move a page at a time.
//   3. Updates the small "plate 02 / 06" text and rotates the
//      compass mark in the frame to match the active slide.
// You shouldn't need to edit this file when adding your own
// projects — adding a new <section class="slide"> in index.html
// is picked up automatically.
// ============================================================

const slides = Array.from(document.querySelectorAll(".slide"));
const dotNav = document.getElementById("dot-nav");
const frameIndex = document.getElementById("frame-index");
const frameCompass = document.getElementById("frame-compass");

// --- Build the dots -------------------------------------------------
slides.forEach((slide, i) => {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.setAttribute("aria-label", "Go to section " + (i + 1) + " of " + slides.length);
  dot.addEventListener("click", () => {
    slide.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  dotNav.appendChild(dot);
});
const dots = Array.from(document.querySelectorAll(".dot"));

// --- Track which slide is active ------------------------------------
let activeIndex = 0;

function setActive(index) {
  activeIndex = index;
  dots.forEach((d, i) => d.classList.toggle("active", i === index));

  const label = String(index + 1).padStart(2, "0");
  const total = String(slides.length).padStart(2, "0");
  frameIndex.textContent = "plate " + label + " / " + total;

  const angle = slides[index].dataset.orientation || "0";
  frameCompass.style.transform = "rotate(" + angle + "deg)";
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActive(slides.indexOf(entry.target));
      }
    });
  },
  { threshold: 0.6 }
);
slides.forEach((slide) => observer.observe(slide));

setActive(0); // initial state on load

// --- Keyboard navigation (Up/Down arrows, Page Up/Down) -------------
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault();
    const next = Math.min(activeIndex + 1, slides.length - 1);
    slides[next].scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    const prev = Math.max(activeIndex - 1, 0);
    slides[prev].scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

// --- "Scroll" button on the title slide ------------------------------
const scrollCue = document.getElementById("scroll-cue");
if (scrollCue) {
  scrollCue.addEventListener("click", () => {
    slides[1].scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
