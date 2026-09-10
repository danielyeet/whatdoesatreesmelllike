// ============================================================
// Behavior specific to index.html's three locked slides: the
// dots on the right, arrow-key navigation, and the "Scroll"
// button on the title slide. Site-wide stuff (the Menu button,
// the frame) lives in nav.js instead, since every other page
// needs that but not this.
// ============================================================

const slides = Array.from(document.querySelectorAll(".slide"));
const dotNav = document.getElementById("dot-nav");

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

let activeIndex = 0;

function setActive(index) {
  activeIndex = index;
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
    });
  },
  { threshold: 0.6 }
);
slides.forEach((slide) => observer.observe(slide));
setActive(0);

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

const scrollCue = document.getElementById("scroll-cue");
if (scrollCue) {
  scrollCue.addEventListener("click", () => {
    slides[1].scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
