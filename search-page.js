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
  const filters = [...document.querySelectorAll(".find-filter")];
  const nothing = document.querySelector(".find-nothing");
  const saying = document.querySelector(".find-saying");

  const PAGES = [
    { url: "categories/scent-descriptions.html", trail: ["Scent descriptions"] },
    { url: "houses/pineward.html", trail: ["Scent descriptions", "Houses", "Pineward"] },
    { url: "houses/adar.html", trail: ["Scent descriptions", "Houses", "ADAR"] },
    { url: "houses/almost-human.html", trail: ["Scent descriptions", "Houses", "Almost Human"] },
    { url: "houses/ataraxia.html", trail: ["Scent descriptions", "Houses", "Ataraxia"] },
    { url: "houses/grande-parfums.html", trail: ["Scent descriptions", "Houses", "Grande Parfums"] },
    { url: "houses/les-abstraits.html", trail: ["Scent descriptions", "Houses", "Les Abstraits"] },
    { url: "houses/tale-parfums.html", trail: ["Scent descriptions", "Houses", "Tale Parfums"] },
    { url: "houses/tombstone.html", trail: ["Scent descriptions", "Houses", "Tombstone"] },
    { url: "houses/qimu-and-musicians.html", trail: ["Scent descriptions", "Houses", "Qimu & Musicians"] },
    { url: "individual-fragrances/individual-fragrances.html", trail: ["Scent descriptions", "Fragrances"] },
    { url: "categories/theories.html", trail: ["Theories"] },
    { url: "works/theory-01.html", trail: ["Theories", "The Architecture of Sunscreen"] },
    { url: "works/theory-02.html", trail: ["Theories", "The Architecture of Sweat"] },
    { url: "works/theory-03.html", trail: ["Theories", "The Note Dissemination Framework"] },
    { url: "categories/favorites.html", trail: ["Favourites"] },
    { url: "categories/researches.html", trail: ["Explorations & Researches"] },
    { url: "works/my-personal-introduction-to-perfume.html", trail: ["Explorations & Researches", "My Personal Introduction to Perfume"] },
    { url: "works/resins-in-perfumery.html", trail: ["Explorations & Researches", "Resins in Perfumery"] },
    { url: "works/buying-a-perfume.html", trail: ["Explorations & Researches", "Buying A Perfume"] },
    { url: "works/cold-vs-warm-incense.html", trail: ["Explorations & Researches", "Cold vs Warm Incense"] },
    { url: "categories/note-library.html", trail: ["Note Library"] },
    { url: "categories/other-2.html", trail: ["Photography"] },
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

  // ============================================================
  // FILTERING BY KIND
  //
  // The site is made of houses, fragrances, researches, favourites,
  // pieces and sections, and `search.js` already says which of those
  // each answer is. So a filter is one word compared, and the buttons
  // carry that word in `data-kind` — there is no second list of the
  // site's categories anywhere, which is the same rule the search
  // itself is built on.
  //
  // WHAT IS FILTERED IS THE ANSWER, NOT THE SEARCH. The query is run
  // once and its hits kept; pressing a filter re-draws from those. So
  // the counts on the buttons are true — each says how many of *this*
  // search's answers are of that kind — and switching filters never
  // re-reads the site.
  // ============================================================
  let only = "";
  let held = [];
  let heldQuery = "";

  function render() {
    const hits = only ? held.filter((hit) => hit.entry.kind === only) : held;
    // Each button says how many it would give, and one that would give
    // nothing is put beyond use rather than left to be pressed for an
    // empty page.
    filters.forEach((button) => {
      const kind = button.dataset.kind;
      const many = kind ? held.filter((hit) => hit.entry.kind === kind).length : held.length;
      const tally = button.querySelector(".find-filter-no");
      if (tally) tally.textContent = heldQuery ? String(many) : "";
      button.classList.toggle("is-on", kind === only);
      button.disabled = Boolean(heldQuery) && many === 0 && kind !== "";
      button.setAttribute("aria-pressed", String(kind === only));
    });
    draw(heldQuery, hits);
  }

  function draw(query, hits) {
    results.innerHTML = "";
    if (saying) saying.textContent = query ? "“" + query + "”" : "";
    if (count) count.textContent = String(hits.length).padStart(3, "0");
    document.body.classList.toggle("find-empty", Boolean(query) && !hits.length);
    document.body.classList.toggle("find-asked", Boolean(query));
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
    if (!query.trim()) { held = []; heldQuery = ""; render(); return; }
    readSite().then((all) => {
      // Something else was typed while the site was being read.
      if (asked !== query) return;
      held = window.SiteSearch.rank(query, all, 60);
      heldQuery = query;
      // A filter that the new answers have nothing of would show an
      // empty page with no way of telling why, so it is let go of.
      if (only && !held.some((hit) => hit.entry.kind === only)) only = "";
      render();
    });
  }

  filters.forEach((button) => {
    // The tally each button carries. Built here rather than written into
    // the markup, so the button reads as one word until there is a
    // search for it to count.
    const tally = document.createElement("span");
    tally.className = "find-filter-no";
    tally.setAttribute("aria-hidden", "true");
    button.appendChild(tally);
    button.addEventListener("click", () => {
      only = button.dataset.kind === only ? "" : button.dataset.kind;
      render();
    });
  });

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
