// ============================================================
// A PAGE'S OWN SEARCH — categories/theories.html, categories/favorites.html
//
// The contact sheet and the index pages already carry a search of
// their own. This builds the same thing for the two pages that do not:
// a small mark in the top right that opens into a field, looking over
// THAT PAGE ONLY. Searching in Theories gives you theories; searching
// in Favourites gives you favourites. What a page cannot answer it
// hands to the site's own search page, with the question in the
// address.
//
// What there is to find is read off the page's own markup by
// `SiteSearch.collect` — the same reading the search page takes of it
// — so nothing here knows what is on the page it is standing on.
//
// WITHOUT THIS SCRIPT the page is exactly as it was: this adds a way
// of getting about, not a way of reading anything.
// ============================================================
(function () {
  if (!window.SiteSearch) return;
  const where = document.body.dataset.find;
  if (!where) return;

  const trail = where.split("/").filter(Boolean);

  const box = document.createElement("div");
  box.className = "page-find";

  const trigger = document.createElement("button");
  trigger.className = "page-find-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", "Search " + trail[trail.length - 1]);
  const mark = document.createElement("span");
  mark.className = "page-find-mark";
  mark.setAttribute("aria-hidden", "true");
  const word = document.createElement("span");
  word.className = "page-find-word";
  word.textContent = "Search";
  trigger.append(mark, word);

  const field = document.createElement("input");
  field.className = "page-find-field";
  field.type = "search";
  field.placeholder = "Search " + trail[trail.length - 1].toLowerCase();
  field.setAttribute("aria-label", "Search this page");

  const found = document.createElement("div");
  found.className = "page-find-out";
  found.setAttribute("aria-live", "polite");

  box.append(field, trigger, found);
  document.body.appendChild(box);

  let everything = null;
  function look() {
    const term = field.value.trim();
    if (!everything) {
      everything = window.SiteSearch.collect(document, window.location.href, trail);
    }
    const hits = term ? window.SiteSearch.rank(term, everything, 6) : [];
    found.innerHTML = "";
    box.classList.toggle("has-found", Boolean(term));
    hits.forEach((hit) => {
      const row = document.createElement("a");
      row.className = "page-find-row";
      row.href = hit.entry.href;
      const name = document.createElement("span");
      name.className = "page-find-what";
      name.textContent = hit.entry.name;
      const trailSaid = document.createElement("span");
      trailSaid.className = "page-find-where";
      trailSaid.textContent = hit.entry.where.join(" · ");
      row.append(name, trailSaid);
      found.appendChild(row);
    });
    if (term && !hits.length) {
      const none = document.createElement("p");
      none.className = "page-find-none";
      none.textContent = "Nothing here by that name — press enter to search the site.";
      found.appendChild(none);
    }
  }

  trigger.addEventListener("click", () => {
    box.classList.toggle("open");
    if (box.classList.contains("open")) field.focus();
    else { field.value = ""; look(); }
  });
  field.addEventListener("input", look);
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = found.querySelector(".page-find-row");
      if (first) { window.location.href = first.href; return; }
      const term = field.value.trim();
      if (term) {
        window.location.href = window.SiteSearch.siteSearchHref(window.SITE_ROOT, term);
      }
      return;
    }
    if (event.key !== "Escape") return;
    field.value = "";
    look();
    box.classList.remove("open");
    trigger.focus();
  });
})();
