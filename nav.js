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
  const currentPath = window.location.pathname.split("/").pop();

  const trigger = document.createElement("button");
  trigger.className = "menu-trigger";
  trigger.type = "button";
  trigger.textContent = "Menu";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "site-menu-overlay");

  const overlay = document.createElement("div");
  overlay.className = "menu-overlay";
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

  function setOpen(open) {
    overlay.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    trigger.textContent = open ? "Close" : "Menu";
    trigger.setAttribute("aria-expanded", String(open));
  }

  trigger.addEventListener("click", () => setOpen(!overlay.classList.contains("open")));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  list.addEventListener("click", (e) => { if (e.target.tagName === "A") setOpen(false); });
})();
