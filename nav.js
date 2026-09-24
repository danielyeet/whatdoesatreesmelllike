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
  { label: "Explorations & Researches", href: "categories/researches.html" },
  { label: "Favourites", href: "categories/favorites.html" },
  { label: "Note Library", href: "categories/note-library.html" },
  { label: "Photography", href: "categories/other-2.html" },
  { label: "Search", href: "search.html" },
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
  /** A computed background colour as three 0-255 numbers and an alpha,
      or null if there is no colour there.

      IT HAS TO READ `color()` AS WELL AS `rgb()`, and that is not
      fussiness. A background written with `color-mix()` — which is how
      Pineward's ground is mixed — computes to `color(srgb 0.96 0.97
      0.96)`, whose components run 0 to 1 rather than 0 to 255. Pulling
      the numbers out and treating them as 0-255 reads a white page as
      very nearly black, so the cursor went WHITE ON WHITE and could not
      be seen at all. That shipped; this is the fix. */
  function colourOf(computed) {
    const parts = computed && computed.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    const nums = parts.map(Number);
    const scale = /^color\(/.test(computed.trim()) ? 255 : 1;
    return {
      r: nums[0] * scale, g: nums[1] * scale, b: nums[2] * scale,
      a: nums.length > 3 ? nums[3] : 1,
    };
  }

  /* WHAT A PICTURE IS, UNDER THE POINTER. A background colour is not
     the whole of what can be dark: a photograph paints no background at
     all, so over a dark bottle on the contact sheet, or over Haxan's
     pictures, the walk above went straight through the picture to the
     white page behind it and the cursor stayed black ON black. This
     reads the picture itself — a small patch of it round the point, at
     the picture's own resolution, honouring `object-fit` — and returns
     its lightness, or null if it cannot be read (not loaded yet, or from
     another site, which the browser will not let a page read). */
  const probe = document.createElement("canvas");
  probe.width = probe.height = 5;
  const probeCtx = probe.getContext("2d", { willReadFrequently: true });
  function lightOfImage(img, x, y) {
    if (!img.complete || !img.naturalWidth) return null;
    const box = img.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const fit = getComputedStyle(img).objectFit;
    let sx = nw / box.width, sy = nh / box.height, ox = 0, oy = 0;
    if (fit === "cover" || fit === "contain") {
      const s = fit === "cover"
        ? Math.min(nw / box.width, nh / box.height)
        : Math.max(nw / box.width, nh / box.height);
      sx = sy = s;
      ox = (nw - box.width * s) / 2;
      oy = (nh - box.height * s) / 2;
    }
    const px = ox + (x - box.left) * sx, py = oy + (y - box.top) * sy;
    if (px < 0 || py < 0 || px >= nw || py >= nh) return null;
    const half = Math.max(2, 3 * sx);
    try {
      probeCtx.clearRect(0, 0, 5, 5);
      probeCtx.drawImage(img, px - half, py - half, half * 2, half * 2, 0, 0, 5, 5);
      const d = probeCtx.getImageData(0, 0, 5, 5).data;
      let sum = 0, weight = 0;
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255;
        sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * a;
        weight += a;
      }
      // A transparent patch (a logo on nothing) says nothing about the
      // colour; let whatever is behind it answer instead.
      if (weight < 12) return null;
      return sum / weight;
    } catch (err) {
      return null;
    }
  }

  // Everything under the point, from the top down — rather than the
  // top element and its parents — so a picture that stands BEHIND a
  // transparent link or caption is still found and read.
  function isDarkAt(x, y) {
    const stack = document.elementsFromPoint(x, y);
    for (const node of stack) {
      if (node === ring || node === dot) continue;
      if (node.classList && node.classList.contains("dark-surface")) return true;
      if (node.tagName === "IMG") {
        const light = lightOfImage(node, x, y);
        if (light !== null) return light < 115;
      }
      const found = colourOf(getComputedStyle(node).backgroundColor);
      if (found && found.a > 0.5) {
        return 0.2126 * found.r + 0.7152 * found.g + 0.0722 * found.b < 115;
      }
    }
    return false;
  }

  // Re-read when what is underneath changes, or when the pointer has
  // moved far enough to be over a different part of a picture, whose
  // colour changes from one point to the next.
  let readAt = { x: -99, y: -99 };
  function reread(force) {
    const under = document.elementFromPoint(tx, ty);
    const moved = Math.abs(tx - readAt.x) + Math.abs(ty - readAt.y);
    if (!force && under === lastUnder && moved <= 6) return;
    lastUnder = under;
    readAt = { x: tx, y: ty };
    const onDark = isDarkAt(tx, ty);
    ring.classList.toggle("on-dark", onDark);
    dot.classList.toggle("on-dark", onDark);
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
    reread(false);
  }, { passive: true });

  // A page that moves under a still pointer — scrolling, a picture
  // arriving, a drawing opening over the page — changes what is under
  // it without a pointermove, so it is read again every so often too.
  setInterval(() => { if (awake) reread(true); }, 400);

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
