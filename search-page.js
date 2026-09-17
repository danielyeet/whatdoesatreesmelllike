// ============================================================
// THE SEARCH PAGE — search.html
//
// The one place that looks over the whole site. It keeps NO LIST of
// what is on the site: it fetches the pages below and reads each of
// them with the same collector every page uses on itself
// (`SiteSearch.collect`), so a fragrance added to a house is findable
// the moment it is added, without anything being written down twice.
//
// THE PAGES IT LOOKS IN are the only thing here to keep up to date,
// one line each, with the trail that says where a thing found in it
// lives. A new page means a new line.
//
// Everything is fetched once, on the first search, and kept.
// ============================================================
(function () {
  const field = document.querySelector(".find-field");
  const results = document.querySelector(".find-results");
  if (!field || !results || !window.SiteSearch) return;

  const count = document.querySelector(".find-count");
  const nothing = document.querySelector(".find-nothing");
  const saying = document.querySelector(".find-saying");

  const PAGES = [
    { url: "categories/scent-descriptions.html", trail: ["Scent descriptions"] },
    { url: "works/pineward.html", trail: ["Scent descriptions", "Houses", "Pineward"] },
    { url: "works/adar.html", trail: ["Scent descriptions", "Houses", "ADAR"] },
    { url: "categories/theories.html", trail: ["Theories"] },
    { url: "works/theory-01.html", trail: ["Theories", "First theory"] },
    { url: "works/theory-02.html", trail: ["Theories", "Second theory"] },
    { url: "works/theory-03.html", trail: ["Theories", "Third theory"] },
    { url: "categories/favorites.html", trail: ["Favourites"] },
    { url: "categories/researches.html", trail: ["Researches"] },
    { url: "works/resins-in-perfumery.html", trail: ["Researches", "Resins in Perfumery"] },
    { url: "categories/other-2.html", trail: ["Other"] },
  ];

  let everything = null;
  let reading = null;

  /** Everything on the site, read once. A page that cannot be reached
      is skipped rather than fatal: the rest of the search still works.
      The pages are read in the browser's own parser, which is what
      makes this the same reading the page itself would give. */
  function readSite() {
    if (everything) return Promise.resolve(everything);
    if (reading) return reading;
    document.body.classList.add("find-reading");
    reading = Promise.all(PAGES.map((page) =>
      fetch(page.url, { credentials: "same-origin" })
        .then((answer) => (answer.ok ? answer.text() : ""))
        .then((html) => {
          if (!html) return [];
          const doc = new DOMParser().parseFromString(html, "text/html");
          return window.SiteSearch.collect(doc, new URL(page.url, window.location.href).href, page.trail);
        })
        .catch(() => [])
    )).then((lots) => {
      everything = [].concat.apply([], lots);
      document.body.classList.remove("find-reading");
      return everything;
    });
    return reading;
  }

  function draw(query, hits) {
    results.innerHTML = "";
    if (saying) saying.textContent = query ? "“" + query + "”" : "";
    if (count) count.textContent = String(hits.length).padStart(3, "0");
    document.body.classList.toggle("find-empty", Boolean(query) && !hits.length);
    if (nothing) nothing.hidden = !(query && !hits.length);

    hits.forEach((hit, n) => {
      const row = document.createElement("a");
      row.className = "find-row";
      row.href = hit.entry.href;
      row.style.setProperty("--n", String(Math.min(n, 18)));

      const no = document.createElement("span");
      no.className = "find-no";
      no.textContent = String(n + 1).padStart(3, "0");

      const name = document.createElement("span");
      name.className = "find-what";
      name.textContent = hit.entry.name;

      const kind = document.createElement("span");
      kind.className = "find-kind";
      kind.textContent = hit.entry.kind;

      const where = document.createElement("span");
      where.className = "find-where";
      where.textContent = hit.entry.where.join(" · ");

      row.append(no, name, kind, where);
      results.appendChild(row);
    });
  }

  let asked = "";
  function look(query) {
    asked = query;
    if (!query.trim()) { draw("", []); return; }
    readSite().then((all) => {
      // Something else was typed while the site was being read.
      if (asked !== query) return;
      draw(query, window.SiteSearch.rank(query, all, 60));
    });
  }

  let waiting = null;
  field.addEventListener("input", () => {
    window.clearTimeout(waiting);
    waiting = window.setTimeout(() => look(field.value), 120);
  });
  const form = document.querySelector(".find-form");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    look(field.value);
  });

  // What was asked for on the way in, if anything — this is where a
  // page's own search sends a question it could not answer.
  const asking = new URLSearchParams(window.location.search).get("q");
  if (asking) {
    field.value = asking;
    look(asking);
  }
  field.focus();
})();
