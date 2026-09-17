// ============================================================
// THE SEARCH
//
// One way of looking things up, used in three places:
//
//   THE SEARCH PAGE (search.html) looks over the WHOLE site. It has no
//   list of its own to keep: it fetches the pages named in its own
//   manifest and reads them with the same collector the pages use on
//   themselves, so anything added to a page is findable the moment it
//   is added and nothing has to be written down twice.
//
//   A PAGE'S OWN SEARCH looks over that page only — the contact sheet
//   finds houses and fragrances, the researches find researches — and
//   hands anything it cannot find to the search page.
//
//   AND BOTH ARE FORGIVING. "murkwod" finds Murkwood. What matches is
//   scored rather than tested, so a near miss is still an answer and a
//   worse one sorts below a better one.
//
// WHAT A RESULT IS: a name, where it was found (which is a trail —
// Scent descriptions · Houses · Pineward), and a link that opens the
// thing itself. Where a link carries a #part-06 on the end, the page
// it lands on opens that part: see `openFromHash` at the foot of this
// file, which every page that has parts calls.
//
// WITHOUT THIS SCRIPT nothing on the site stops working: every search
// field is a plain field, and everything a search would have found is
// still reachable by hand.
// ============================================================
(function () {
  const SEARCH_PAGE = "search.html";

  // ============================================================
  // MATCHING
  // ============================================================
  /** Down to bare letters: no case, no accents, no punctuation. Λίθος
      and Lithos are not the same word, but α11 and a11 should be. */
  function norm(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/α/g, "a")
      .replace(/[^a-z0-9Ͱ-Ͽ]+/g, " ")
      .trim();
  }

  /** How many single-letter changes turn one word into another, giving
      up once it is past `most` — which is what keeps this cheap over a
      few hundred entries. */
  function apart(a, b, most) {
    if (Math.abs(a.length - b.length) > most) return most + 1;
    let row = [];
    for (let j = 0; j <= b.length; j++) row.push(j);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      let best = row[0];
      for (let j = 1; j <= b.length; j++) {
        const was = row[j];
        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          prev + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
        prev = was;
        if (row[j] < best) best = row[j];
      }
      if (best > most) return most + 1;
    }
    return row[b.length];
  }

  /** How well one thing matches what was typed. Bigger is better; 0 is
      not a match at all. The order of the tests IS the ranking: an
      exact name beats a name that starts with it, which beats one that
      merely contains it, which beats a near miss. */
  function score(query, text) {
    const q = norm(query);
    const t = norm(text);
    if (!q || !t) return 0;
    if (t === q) return 1000;
    if (t.startsWith(q)) return 900 - t.length * 0.2;
    const at = t.indexOf(q);
    if (at >= 0) return 800 - at * 2 - t.length * 0.2;

    // Every word of the query has to be found in the text, exactly or
    // nearly — "pine murk" should not find Murkwood on its own.
    const words = q.split(" ").filter(Boolean);
    const mine = t.split(" ").filter(Boolean);
    let total = 0;
    for (const word of words) {
      let best = 0;
      for (const other of mine) {
        if (other.startsWith(word)) { best = Math.max(best, 500 - (other.length - word.length)); continue; }
        if (other.indexOf(word) >= 0) { best = Math.max(best, 420); continue; }
        // A slip of the fingers: one change for a short word, two for
        // a long one, three once it is long enough for two of them to
        // still be unmistakable.
        const allow = word.length <= 4 ? 1 : word.length <= 7 ? 2 : 3;
        const off = apart(word, other, allow);
        if (off <= allow) best = Math.max(best, 360 - off * 60 - Math.abs(other.length - word.length) * 4);
      }
      if (!best) return 0;
      total += best;
    }
    return total / words.length;
  }

  // ============================================================
  // WHAT THERE IS TO FIND
  //
  // Read off a page's own markup, by the classes this site already
  // uses for its content. Nothing here is a list of the site's
  // contents: it is the site's contents, read where they live.
  // ============================================================

  /** Everything findable in one document. `base` is where that
      document lives, so the links come out pointing at it. */
  function collect(doc, base, trail) {
    const found = [];
    const at = (href) => new URL(href, base).href;
    const add = (entry) => { if (entry.name) found.push(entry); };
    const words = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

    // A house on the contact sheet.
    doc.querySelectorAll(".sheet-frame").forEach((frame) => {
      const name = words(frame.querySelector(".sheet-caption"));
      if (!name || /^untitled$/i.test(name)) return;
      add({ name: name, kind: "House", where: trail.concat(["Houses"]), href: at(frame.getAttribute("href")) });
    });

    // A fragrance in an index table.
    doc.querySelectorAll(".index-table tbody tr[data-name]").forEach((row) => {
      const link = row.querySelector("a");
      if (!link) return;
      const house = row.dataset.house;
      add({
        name: row.dataset.name,
        kind: house ? "Fragrance" : "Research",
        where: trail.concat(house ? ["Fragrances", house] : []),
        href: at(link.getAttribute("href")),
        date: row.dataset.date || "",
      });
    });

    // A part of a house — one fragrance, written up.
    doc.querySelectorAll(".pine-part, .adar-part").forEach((part) => {
      const title = part.querySelector(".pine-title, .adar-title");
      if (!title) return;
      const name = words(title.cloneNode(true));
      if (!name || /^untitled$/i.test(name)) return;
      const group = part.closest(".pine-stratum, .adar-group");
      add({
        name: name,
        kind: "Fragrance",
        where: trail.concat(group ? [words(group.querySelector("h2"))] : []),
        href: at("#" + part.id),
      });
    });

    // A favourite in the chamber.
    doc.querySelectorAll(".gallery-entry").forEach((entry) => {
      add({
        name: words(entry.querySelector(".gallery-name")) || words(entry),
        kind: "Favourite",
        where: trail.concat(entry.dataset.chapter ? [entry.dataset.chapter] : []),
        href: at(entry.getAttribute("href") || "#"),
        date: entry.dataset.date || "",
      });
    });

    // A row on a plain list — a theory, a piece.
    doc.querySelectorAll(".work-row").forEach((row) => {
      add({
        name: words(row.querySelector(".work-row-title")),
        kind: "Piece",
        where: trail.slice(),
        href: at(row.getAttribute("href")),
      });
    });

    // A section of a long piece.
    doc.querySelectorAll(".essay-section").forEach((section) => {
      const head = section.querySelector("h2");
      if (!head) return;
      const copy = head.cloneNode(true);
      const no = copy.querySelector(".essay-no");
      if (no) no.remove();
      add({
        name: words(copy),
        kind: "Section",
        where: trail.concat([words(doc.querySelector(".essay-head h1")).split("\n")[0]]),
        href: at("#" + section.id),
      });
    });

    return found;
  }

  /** The best answers first, and never two of the same thing.

      What a thing is CALLED is what is searched; where it lives counts
      too, at a discount — "chapter 2" should find the favourites in
      Chapter 2, but never above something actually called that. */
  function rank(query, entries, most) {
    const seen = new Set();
    return entries
      .map((entry) => {
        const own = score(query, entry.name);
        if (own) return { entry: entry, score: own };
        const trail = (entry.where || []).join(" ");
        const near = trail ? score(query, trail) * 0.45 : 0;
        return { entry: entry, score: near };
      })
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
      .filter((hit) => {
        const key = hit.entry.href + "|" + norm(hit.entry.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, most || 40);
  }

  // ============================================================
  // ARRIVING AT SOMETHING THAT WAS FOUND
  //
  // A result's link can carry the id of a part on the end of it. The
  // page it lands on opens that part and takes you to it — being shown
  // a closed list with the thing you asked for somewhere in it is not
  // an answer.
  // ============================================================
  function openFromHash(selector) {
    const go = () => {
      const id = (window.location.hash || "").replace("#", "");
      if (!id) return;
      const part = document.getElementById(id);
      if (!part || !part.matches(selector)) return;
      if (!part.open) {
        // Opened by its own summary, so whatever the page does about
        // opening one gently happens here too.
        const summary = part.querySelector("summary");
        if (summary) summary.click(); else part.open = true;
      }
      // After the box has begun to open, so it is scrolled to where it
      // will be rather than where it was.
      window.setTimeout(() => {
        part.scrollIntoView({ block: "center", behavior: "smooth" });
        part.classList.add("found");
        window.setTimeout(() => part.classList.remove("found"), 2600);
      }, 260);
    };
    go();
    window.addEventListener("hashchange", go);
  }

  /** Where to send a search that a page cannot answer itself. */
  function siteSearchHref(root, query) {
    return (root || "") + SEARCH_PAGE + "?q=" + encodeURIComponent(query);
  }

  window.SiteSearch = {
    norm: norm,
    score: score,
    collect: collect,
    rank: rank,
    openFromHash: openFromHash,
    siteSearchHref: siteSearchHref,
  };
})();
