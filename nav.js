// ============================================================
// SHARED SITE NAVIGATION
// Builds the "Menu" button and overlay that appears the same
// way on every page. Include it like this, near the top of
// <body>, on every page you create:
//
//   <script>window.SITE_ROOT = "../";</script>
//   <script src="../nav.js"></script>
//
// SITE_ROOT tells this script how many folders deep the current
// page is, so links work correctly wherever the page lives:
//   - on index.html (at the root itself), use ""
//   - on a page inside /categories/ or /works/, use "../"
//
// To add or rename a page in the menu, edit the SITE_LINKS list
// below — that's the only place it needs to change.
// ============================================================

const SITE_LINKS = [
  { label: "Home", href: "index.html" },
  { label: "Scent descriptions", href: "categories/scent-descriptions.html" },
  { label: "Theories", href: "categories/theories.html" },
  { label: "Favorites", href: "categories/favorites.html" },
  { label: "Other", href: "categories/other-1.html" },
  { label: "Other", href: "categories/other-2.html" },
  { label: "Contact", href: "contact.html" },
];

(function () {
  const root = typeof window.SITE_ROOT === "string" ? window.SITE_ROOT : "";
  // A URL ending in "/" — which is how the site root is normally visited —
  // has no filename on the end of it, and the server quietly serves
  // index.html for it. Without treating that empty case as index.html, the
  // Home link never gets marked as the page you're currently on.
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  const trigger = document.createElement("button");
  trigger.className = "menu-trigger";
  trigger.type = "button";
  trigger.textContent = "Menu";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "site-menu-overlay");

  const overlay = document.createElement("div");
  overlay.className = "menu-overlay dark-surface";
  overlay.id = "site-menu-overlay";

  const list = document.createElement("ul");
  list.className = "menu-list";

  SITE_LINKS.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = root + link.href;
    a.textContent = link.label;
    const linkFile = link.href.split("/").pop();
    if (linkFile === currentPath) a.classList.add("menu-current");
    li.appendChild(a);
    list.appendChild(li);
  });

  overlay.appendChild(list);
  document.body.appendChild(trigger);
  document.body.appendChild(overlay);

  // The trigger's word changes mid-transition rather than the instant
  // you click, and fades out and back in as it does — swapping the text
  // instantly is the one thing that still read as abrupt.
  let labelTimer = null;
  function setLabel(text) {
    clearTimeout(labelTimer);
    trigger.classList.add("label-swap");
    labelTimer = setTimeout(function () {
      trigger.textContent = text;
      trigger.classList.remove("label-swap");
    }, 200);
  }

  function setOpen(open) {
    overlay.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    setLabel(open ? "Close" : "Menu");
    trigger.setAttribute("aria-expanded", String(open));
    // Announced so a page can present the menu its own way. The landing
    // page listens for this (menu-modes.js) and opens it differently
    // depending on which slide you are on; everywhere else nothing is
    // listening and the plain overlay above is the whole of it.
    window.dispatchEvent(new CustomEvent(open ? "menu:open" : "menu:close", {
      detail: { overlay: overlay, list: list },
    }));
  }

  trigger.addEventListener("click", () => setOpen(!overlay.classList.contains("open")));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  list.addEventListener("click", (e) => { if (e.target.tagName === "A") setOpen(false); });
})();

// ============================================================
// THE CURSOR
// Lives here rather than in its own file purely so it reaches
// every page without a script tag on each one — nav.js is
// already the shared site chrome.
//
// A hollow square with a dot in the middle. The dot is exactly
// where the pointer is; the square follows a beat behind, which
// is what makes it stretch when you move quickly and settle
// square when you stop. Over anything clickable it closes in and
// the dot opens up.
// ============================================================
(function () {
  // Nothing to replace on a touch screen, and no way to track it.
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;

  const LAG = 0.16;        // how far behind the square runs
  const STRETCH = 0.055;   // how much speed pulls it out of square

  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.documentElement.classList.add("has-cursor");

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let rx = tx, ry = ty;
  let awake = false;
  let lastUnder = null;

  // Rather than trusting a .dark-surface class to have been put on
  // everything dark, this reads the actual colour underneath: walk up
  // from whatever is under the pointer until something is painting an
  // opaque background, and go light if that colour is dark. The class
  // is still honoured, as a shortcut for panels whose own background
  // is transparent. Only re-checked when the element underneath
  // changes, so getComputedStyle isn't called on every mouse move.
  function isDark(el) {
    let node = el;
    while (node && node.nodeType === 1) {
      if (node.classList && node.classList.contains("dark-surface")) return true;
      const colour = getComputedStyle(node).backgroundColor;
      const parts = colour && colour.match(/[\d.]+/g);
      if (parts && parts.length >= 3) {
        const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
        if (alpha > 0.5) {
          const luminance = 0.2126 * +parts[0] + 0.7152 * +parts[1] + 0.0722 * +parts[2];
          return luminance < 115;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX;
    ty = e.clientY;
    if (!awake) {
      awake = true;
      rx = tx; ry = ty;
      document.documentElement.classList.add("cursor-awake");
    }
    dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";

    // pointer-events:none on the ring/dot means elementFromPoint sees
    // straight through them to whatever's actually underneath.
    const under = document.elementFromPoint(tx, ty);
    if (under !== lastUnder) {
      lastUnder = under;
      const onDark = isDark(under);
      ring.classList.toggle("on-dark", onDark);
      dot.classList.toggle("on-dark", onDark);
    }
  }, { passive: true });

  document.addEventListener("mouseleave", () => document.documentElement.classList.remove("cursor-awake"));
  document.addEventListener("mouseenter", () => { if (awake) document.documentElement.classList.add("cursor-awake"); });

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest && e.target.closest("a, button, [role='button'], input, textarea, select");
    ring.classList.toggle("near", !!target);
    dot.classList.toggle("near", !!target);
  });

  // Held rather than reset to 0 below the speed threshold: the ring is
  // still visibly stretched at that point (pull isn't quite zero yet),
  // so snapping the angle back to 0 there showed as a little flick
  // right as the cursor settled. Holding the last real direction lets
  // the stretch relax away to nothing before its angle stops mattering.
  let ringAngle = 0;

  function follow() {
    requestAnimationFrame(follow);
    const dx = tx - rx;
    const dy = ty - ry;
    rx += dx * LAG;
    ry += dy * LAG;

    // Pulled along its own direction of travel, by however far it is
    // currently behind.
    const speed = Math.min(60, Math.hypot(dx, dy));
    if (speed > 1) ringAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const pull = speed * STRETCH;
    ring.style.transform =
      "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)" +
      " rotate(" + ringAngle.toFixed(1) + "deg) scale(" + (1 + pull * 0.16).toFixed(3) + "," + (1 - pull * 0.1).toFixed(3) + ")";
  }
  requestAnimationFrame(follow);
})();
