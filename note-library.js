// ============================================================
// THE NOTE LIBRARY — categories/note-library.html
//
// The page's markup is the catalogue: one <article class="lib-record">
// per note, standing in the <section class="lib-shelf"> of its family —
// its ACCORD, as the page calls it (the owner's word for what was
// "shelves"; the code still says shelf). This files every record as a
// FILE in its accord's BOX, and puts a catalogue terminal in front of
// the archive — the owner, 2026-09-26: "redisgn the whole page of the
// note library, and I want it to be like files in boxes rather than a
// library libvrary. im thinking of movies and spy stuff. I want oyu to
// keep it on theme and geometric":
//
//   THE BOXES       an accord is an archive box: its LID is its label —
//                   the box's number, the accord's code in its colour,
//                   its name and line, how many files it holds — and a
//                   hand-hole is cut in its front. (The CSS draws it.)
//   THE FILES       a note is a file folder standing in its box, its TAB
//                   staggered as a drawer's are and carrying its FILE
//                   NUMBER — the accord's code and its place in it,
//                   counted alphabetically — along an edge in the
//                   accord's colour; its name on its face; and at its
//                   foot a small square for every fragrance on the site
//                   that uses it, so a note used often is a thicker file.
//                   They were books on shelves for four rounds (cloth,
//                   specks, flat shapes, skeletons) and before that
//                   folders again, "digital" ones, which were "3-bit".
//   THE TERMINAL    one field over the whole catalogue, with a × at its
//                   right to clear it. Files that answer light up and
//                   everything else goes dim; a box with nothing in it
//                   folds away. It reads names
//                   and every other spelling folded into a record, by
//                   DIRECT WORDS only: whole words, no near misses, and
//                   nothing found by what a note is said to be.
//   THE INDEX       a tab per accord, to stand in front of that one.
//   THE CARD        pressing a file pulls it up out of its box and opens
//                   its CASE FILE beside the archive — a stamp, SUBJECT,
//                   SUMMARY, ALIASES and KNOWN APPEARANCES in typed
//                   capitals, and the mark clipped in as an EXHIBIT: the call number,
//                   the explanation, the other spellings, and every
//                   fragrance on the site that uses it, linked to where
//                   it stands in its house. Drawn as the rest of the
//                   site is — hairlines, corner marks, and at its head
//                   THE MARK: a ring of specks, one for every fragrance
//                   that uses the note, joined up and turning slowly in
//                   a cloud of its accord's dust. It was a glowing glass
//                   panel, which the owner found "too futuristic".
//   THE ROOM        a lamp that follows the hand over the stacks, and
//                   dust in the air — both white, as the whole page is
//                   black and white since 2026-09-26: its turquoise went at
//                   the owner's "change the theme ... from that turqoise to
//                   black/white (to match the rest of the website". The
//                   accords keep their colours, and nothing else has one.
//
// WHICH FRAGRANCES USE A NOTE comes from notes-data.js, read here each
// time the page opens. A fragrance's NAME is read off its own house's
// page when a card first asks for it, so it is never written twice.
//
// WITHOUT THIS SCRIPT the page is the plain catalogue: every shelf and
// every record, readable top to bottom.
// ============================================================
(function () {
  const library = document.querySelector(".library");
  if (!library) return;
  const shelves = [...library.querySelectorAll(".lib-shelf")];
  if (!shelves.length) return;

  const root = typeof window.SITE_ROOT === "string" ? window.SITE_ROOT : "";
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = window.SiteSearch;
  const norm = S ? S.norm : (t) => String(t || "").toLowerCase().trim();

  // ============================================================
  // WHERE EACH HOUSE'S FRAGRANCES LIVE. The key is the page's own
  // window.HOUSE_NOTES — the part of a notes-data.js key before the
  // colon. A new house wanting its notes counted here needs a line;
  // there is a test that every key in notes-data.js has one.
  // ============================================================
  const HOUSES = {
    pineward: { name: "Pineward", href: "houses/pineward.html" },
    adar: { name: "ADAR", href: "houses/adar.html" },
    "almost-human": { name: "Almost Human", href: "houses/almost-human.html" },
    ataraxia: { name: "Ataraxia", href: "houses/ataraxia.html" },
    grande: { name: "Grande Parfums", href: "houses/grande-parfums.html" },
    abstraits: { name: "Les Abstraits", href: "houses/les-abstraits.html" },
    tale: { name: "Tale Parfums", href: "houses/tale-parfums.html" },
    tombstone: { name: "Tombstone", href: "houses/tombstone.html" },
    qimu: { name: "Qimu & Musicians", href: "houses/qimu-and-musicians.html" },
    individual: { name: "Individual fragrances", href: "individual-fragrances/individual-fragrances.html" },
  };

  // Each accord's colour, as a hue: the only colour on the page, on its
  // tab, its box's lid and its files' tabs.
  const HUE = {
    CIT: 50, ARO: 150, GRN: 100, FLO: 335, FRU: 8, SPI: 22, GOU: 36, BRW: 26,
    WOO: 30, CON: 135, RES: 40, ANI: 14, EAR: 75, AIR: 200, SMK: 220, IMP: 268, RET: 0,
  };

  // THE FILES: one square at a file's foot for every fragrance using it,
  // up to this many, and a plus after that.
  const MARKS_MOST = 18;

  // THE PAGE'S WHITE, and each accord's colour (`HUE`, at `MARK_SAT` and
  // `MARK_LIGHT`) as the card's mark spends it. The returns cart has no
  // colour at all.
  const LINE = "236, 236, 236";
  const MARK_SAT = 45, MARK_LIGHT = 58;
  const markColour = (code) => code === "RET" || HUE[code] == null
    ? "hsl(0, 0%, 62%)" : "hsl(" + HUE[code] + ", " + MARK_SAT + "%, " + MARK_LIGHT + "%)";
  // A canvas draws at a lower ratio below 700px, as every drawing here does.
  const drawRatio = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);

  // ============================================================
  // WHAT THE SITE USES — every note in notes-data.js, and which
  // fragrances name it.
  // ============================================================
  const uses = new Map();          // lower-cased spelling -> Set of keys
  const spellings = new Set();
  const fragrances = new Set();
  const NOTES = window.FRAGRANCE_NOTES || {};
  Object.keys(NOTES).forEach((key) => {
    const e = NOTES[key];
    const lists = [e.top, e.mid, e.base, e.flat];
    if (e.also) lists.push(e.also.top, e.also.mid, e.also.base, e.also.flat);
    // Not `landscape`: Almost Human's olfactory landscapes are
    // impressions the house publishes instead of notes, and this is a
    // library of notes.
    lists.filter(Boolean).forEach((list) => list.forEach((note) => {
      spellings.add(note);
      fragrances.add(key);
      const k = note.toLowerCase();
      if (!uses.has(k)) uses.set(k, new Set());
      uses.get(k).add(key);
    }));
  });

  // ============================================================
  // THE RECORDS, read off the page
  // ============================================================
  const records = [];
  const byName = new Map();
  shelves.forEach((shelf) => readShelf(shelf));

  function readShelf(shelf) {
    const code = shelf.dataset.shelf;
    const plate = shelf.querySelector(".lib-shelf-name");
    const shelfName = plate ? plate.textContent.replace(code, "").trim() : code;
    const mine = [...shelf.querySelectorAll(".lib-record")];
    mine.forEach((el, i) => {
      const name = el.querySelector(".lib-name").textContent.trim();
      const say = el.querySelector(".lib-say");
      const aka = (el.dataset.aka || "").split("|").map((s) => s.trim()).filter(Boolean);
      const keys = new Set();
      [name].concat(aka).forEach((n) => {
        byName.set(n.toLowerCase(), el);
        (uses.get(n.toLowerCase()) || []).forEach((k) => keys.add(k));
      });
      records.push({
        el: el,
        shelf: shelf,
        code: code,
        shelfName: shelfName,
        name: name,
        aka: aka,
        say: say ? say.textContent.trim() : "",
        keys: keys,
        call: code + " " + String(i + 1).padStart(3, "0"),
        alpha: i,
      });
    });
  }

  // THE RETURNS CART: a note a fragrance names that no record carries.
  const loose = [...spellings].filter((n) => !byName.has(n.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
  if (loose.length) {
    const cart = document.createElement("section");
    cart.className = "lib-shelf lib-returns";
    cart.id = "shelf-ret";
    cart.dataset.shelf = "RET";
    cart.innerHTML =
      '<header class="lib-plate"><h2 class="lib-shelf-name"><span class="lib-shelf-code">RET</span> Returns cart</h2>' +
      '<p class="lib-shelf-say">Named in a fragrance on this site and not shelved yet.</p></header>' +
      '<div class="lib-records"></div>';
    const holder = cart.querySelector(".lib-records");
    loose.forEach((n) => {
      const el = document.createElement("article");
      el.className = "lib-record";
      el.innerHTML = '<h3 class="lib-name"></h3><p class="lib-say">Not catalogued yet.</p>';
      el.querySelector(".lib-name").textContent = n;
      holder.appendChild(el);
    });
    shelves[shelves.length - 1].after(cart);
    shelves.push(cart);
    readShelf(cart);
  }

  // ============================================================
  // SEEDED, so the stacks stand the same way every visit
  // ============================================================
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }

  // ============================================================
  // FILING THE RECORDS: every record a file folder in its accord's box.
  // Its TAB stands in one of three places across its top, in turn, as
  // the tabs of a drawer's folders do; the tab carries its file number,
  // and its edge the accord's colour. At its foot, a small square for
  // every fragrance using the note.
  // ============================================================
  records.forEach((r) => {
    const el = r.el;
    el.style.setProperty("--hue", String(HUE[r.code] != null ? HUE[r.code] : 0));
    el.style.setProperty("--tab", String(r.alpha % 3));
    el.dataset.uses = String(r.keys.size);
    el.dataset.call = r.call;
    if (r.code === "RET") el.classList.add("lib-grey");

    const label = document.createElement("span");
    label.className = "lib-call";
    label.setAttribute("aria-hidden", "true");
    label.innerHTML = "<b></b><i></i>";
    label.firstChild.textContent = r.code;
    label.lastChild.textContent = r.call.slice(4);
    el.insertBefore(label, el.firstChild);

    const marks = document.createElement("span");
    marks.className = "lib-marks";
    marks.setAttribute("aria-hidden", "true");
    const n = r.keys.size;
    marks.style.setProperty("--n", String(Math.min(MARKS_MOST, n)));
    marks.dataset.more = n > MARKS_MOST ? "+" + (n - MARKS_MOST) : "";
    el.appendChild(marks);

    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-label", r.name + ", file " + r.call + ". " +
      (r.keys.size === 1 ? "In one fragrance." : "In " + r.keys.size + " fragrances."));
    // The arrival: box by box, file by file, and quick about it.
    el.style.setProperty("--in", Math.min(900, shelves.indexOf(r.shelf) * 70 + r.alpha * 9) + "ms");
  });
  const recOf = new Map(records.map((r) => [r.el, r]));

  // ============================================================
  // THE CHROME IN FRONT OF THE STACKS
  // ============================================================
  const head = library.querySelector(".lib-head");

  const readout = document.createElement("dl");
  readout.className = "lib-readout";
  // THE FIGURES. "Names as written" — every different way a note is
  // spelled in the site's notes — was taken off at the owner's word, and
  // "Shelves" is "Accords" now. In its place, the note the site leans on
  // most, and in how many fragrances.
  const shelved = records.filter((r) => r.code !== "RET");
  const most = shelved.reduce((a, b) => (b.keys.size > a.keys.size ? b : a), shelved[0]);
  const figures = [
    ["Files", shelved.length],
    ["Accords", shelves.filter((s) => s.dataset.shelf !== "RET").length],
    ["Fragrances", fragrances.size],
    ["Most used", most ? most.name : "—", most ? "in " + most.keys.size + " fragrances" : ""],
  ];
  figures.forEach(([word, n, small]) => {
    const box = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = word;
    const dd = document.createElement("dd");
    if (typeof n === "number") {
      dd.dataset.to = String(n);
      dd.textContent = still ? String(n) : "0";
    } else {
      // A word rather than a figure: set as it is, with what it counts
      // under it.
      dd.className = "lib-readout-word";
      dd.textContent = n;
      if (small) {
        const s = document.createElement("small");
        s.textContent = small;
        dd.appendChild(s);
      }
    }
    box.append(dt, dd);
    readout.appendChild(box);
  });

  const desk = document.createElement("div");
  desk.className = "lib-desk";
  desk.innerHTML =
    '<form class="lib-terminal" role="search">' +
      '<label class="lib-prompt" for="lib-query">query&gt;</label>' +
      '<input class="lib-query" id="lib-query" type="search" autocomplete="off" spellcheck="false"' +
      ' placeholder="type a note, like cedar or tonka" aria-label="Search the Note Library">' +
      '<output class="lib-count" aria-live="polite"></output>' +
      // THE ×, to clear the search at once — the owner's "a little X to
      // reset the search on the right side of the bar".
      '<button type="button" class="lib-clear" aria-label="Clear the search" disabled>' +
        '<span aria-hidden="true"></span></button>' +
    '</form>' +
    '<div class="lib-tools">' +
      '<div class="lib-order" role="group" aria-label="Order the accords">' +
        '<button type="button" class="lib-order-by is-on" data-order="alpha">A–Z</button>' +
        '<button type="button" class="lib-order-by" data-order="uses">Most used</button>' +
      '</div>' +
      '<button type="button" class="lib-random">Pull a random file</button>' +
    '</div>' +
    '<p class="lib-nothing" hidden>No file answers that. <a class="lib-elsewhere" href="#">Search the whole site →</a></p>';

  const index = document.createElement("nav");
  index.className = "lib-index";
  index.setAttribute("aria-label", "Accords");
  const tabs = [];
  makeTab("", "All", records.length, "Every accord");
  shelves.forEach((shelf) => {
    const code = shelf.dataset.shelf;
    const r = records.find((x) => x.shelf === shelf);
    makeTab(code, code, shelf.querySelectorAll(".lib-record").length, r ? r.shelfName : code);
  });
  function makeTab(code, word, n, title) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lib-tab" + (code ? "" : " is-on");
    b.dataset.shelf = code;
    b.title = title;
    b.innerHTML = "<span></span><small></small>";
    b.firstChild.textContent = word;
    b.lastChild.textContent = String(n);
    if (code) b.style.setProperty("--hue", String(HUE[code] || 0));
    index.appendChild(b);
    tabs.push(b);
    return b;
  }

  head.after(readout);
  readout.after(desk);
  desk.after(index);

  const stacks = document.createElement("div");
  stacks.className = "lib-stacks";
  index.after(stacks);
  // THE BOX'S LID carries its number and how many files are in it.
  shelves.forEach((s, k) => {
    const n = s.querySelectorAll(".lib-record").length;
    const plate = s.querySelector(".lib-plate");
    const box = document.createElement("p");
    box.className = "lib-box-no";
    box.textContent = "Box " + String(k + 1).padStart(2, "0");
    const count = document.createElement("p");
    count.className = "lib-shelf-count";
    count.textContent = n === 1 ? "1 file" : n + " files";
    s.style.setProperty("--hue", String(HUE[s.dataset.shelf] != null ? HUE[s.dataset.shelf] : 0));
    if (s.dataset.shelf === "RET") s.classList.add("lib-grey");
    plate.prepend(box);
    plate.appendChild(count);
    stacks.appendChild(s);
  });

  // The lamp stands over the stacks in the window.
  const lamp = document.createElement("div");
  lamp.className = "lib-lamp";
  lamp.setAttribute("aria-hidden", "true");
  library.appendChild(lamp);

  // THE CARD
  const card = document.createElement("aside");
  card.className = "lib-card";
  card.hidden = true;
  card.setAttribute("aria-label", "Case file");
  // A CASE FILE: typed headings, a stamp across its head, and the mark
  // clipped in as the exhibit.
  card.innerHTML =
    '<div class="lib-card-top">' +
      '<span class="lib-card-kind">Case file</span>' +
      '<span class="lib-card-call"></span>' +
      '<button type="button" class="lib-card-close" aria-label="Put the file back">×</button>' +
    '</div>' +
    '<p class="lib-card-stamp" aria-hidden="true">Declassified</p>' +
    '<figure class="lib-card-exhibit">' +
      '<span class="lib-card-clip" aria-hidden="true"></span>' +
      '<canvas class="lib-card-mark" aria-hidden="true"></canvas>' +
      '<figcaption class="lib-card-caption"></figcaption>' +
    '</figure>' +
    '<p class="lib-card-label">Subject</p>' +
    '<h2 class="lib-card-name" tabindex="-1"></h2>' +
    '<p class="lib-card-shelf"></p>' +
    '<p class="lib-card-label">Summary</p>' +
    '<p class="lib-card-say"></p>' +
    '<details class="lib-card-aka lib-drop" data-drop="aka"><summary><span class="lib-drop-name">Aliases</span>' +
      '<span class="lib-found-count"></span></summary><ul></ul></details>' +
    '<div class="lib-card-found"><h3></h3><div class="lib-card-list"></div></div>' +
    '<div class="lib-card-steps">' +
      '<button type="button" class="lib-card-step" data-step="-1"></button>' +
      '<button type="button" class="lib-card-step" data-step="1"></button>' +
    '</div>';
  library.appendChild(card);

  const canvas = document.createElement("canvas");
  canvas.className = "lib-ground";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  document.body.classList.add("lib-built");
  document.documentElement.classList.remove("js-coming");
  if (!still) {
    document.body.classList.add("lib-arriving");
    window.setTimeout(() => document.body.classList.remove("lib-arriving"), 2400);
    tick();
  }

  function tick() {
    const dds = [...readout.querySelectorAll("dd[data-to]")];
    const t0 = performance.now();
    const LONG = 1300;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / LONG);
      const e = 1 - Math.pow(1 - t, 3);
      dds.forEach((dd) => { dd.textContent = String(Math.round(+dd.dataset.to * e)); });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ============================================================
  // WHAT IS SHOWN — the index tab and the terminal, together
  // ============================================================
  const query = desk.querySelector(".lib-query");
  const count = desk.querySelector(".lib-count");
  const clear = desk.querySelector(".lib-clear");
  const nothing = desk.querySelector(".lib-nothing");
  const elsewhere = desk.querySelector(".lib-elsewhere");
  let onShelf = "";
  let hits = [];

  // DIRECT WORDS ONLY — the owner's rule. A file answers when every
  // word typed IS a word in its name or in one of the other spellings
  // folded into it (a plural counts as the word): "cedar" finds Cedar
  // Leaf and Cedarwood, which is also spelled Cedar; "tonka" finds Tonka.
  // Half a word finds nothing yet, nothing is found by what a note is
  // SAID to be, and no near miss counts. A first version lit everything
  // described as smoky, and "iris" lit Seaweed — by "Irish" Sea Moss.
  function words(text) { return norm(text).split(" ").filter(Boolean); }
  function same(a, b) {
    return a === b || a === b + "s" || b === a + "s" || a === b + "es" || b === a + "es";
  }
  function answer(r, q) {
    const asked = words(q);
    if (!asked.length) return 0;
    let best = 0;
    [r.name].concat(r.aka).forEach((n, i) => {
      const mine = words(n);
      if (!asked.every((w) => mine.some((m) => same(m, w)))) return;
      // A name that is exactly what was typed first, then a name that
      // begins with it, then any; the record's own name a hair above its
      // other spellings.
      const whole = mine.length === asked.length ? 3 : same(mine[0], asked[0]) ? 2 : 1;
      best = Math.max(best, whole - (i ? 0.1 : 0));
    });
    return best;
  }

  function show() {
    const q = query.value.trim();
    const pool = records.filter((r) => !onShelf || r.code === onShelf);
    hits = [];
    if (q) {
      hits = pool.map((r) => ({ r: r, s: answer(r, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name))
        .map((x) => x.r);
    }
    const lit = new Set(hits);
    records.forEach((r) => {
      const inShelf = !onShelf || r.code === onShelf;
      r.el.classList.toggle("is-hit", !!q && lit.has(r));
      r.el.classList.toggle("is-dim", !!q && inShelf && !lit.has(r));
    });
    shelves.forEach((s) => {
      const code = s.dataset.shelf;
      const away = (onShelf && code !== onShelf) ||
        (q && !records.some((r) => r.shelf === s && lit.has(r)));
      s.classList.toggle("is-away", !!away);
    });
    const total = pool.length;
    count.textContent = q ? hits.length + " / " + total : total + " records";
    clear.disabled = !query.value;
    nothing.hidden = !q || hits.length > 0;
    elsewhere.href = S ? S.siteSearchHref(root, q) : root + "search.html";
    rove();
  }

  query.addEventListener("input", show);
  clear.addEventListener("click", () => {
    query.value = "";
    show();
    query.focus();
  });
  desk.querySelector(".lib-terminal").addEventListener("submit", (event) => {
    event.preventDefault();
    if (hits[0]) open(hits[0], true);
  });
  query.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && query.value) {
      query.value = "";
      show();
    }
  });

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    onShelf = tab.dataset.shelf;
    tabs.forEach((t) => t.classList.toggle("is-on", t === tab));
    show();
    if (onShelf) {
      const shelf = shelves.find((s) => s.dataset.shelf === onShelf);
      const y = stacks.getBoundingClientRect().top + window.scrollY - 90;
      if (shelf && window.scrollY > y) window.scrollTo({ top: y, behavior: still ? "auto" : "smooth" });
    }
  }));

  // THE ORDER a box's files stand in. The file numbers do not change:
  // they are where a file belongs, not where it happens to be standing.
  desk.querySelectorAll(".lib-order-by").forEach((b) => b.addEventListener("click", () => {
    desk.querySelectorAll(".lib-order-by").forEach((x) => x.classList.toggle("is-on", x === b));
    const byUse = b.dataset.order === "uses";
    shelves.forEach((s) => {
      const holder = s.querySelector(".lib-records");
      const mine = records.filter((r) => r.shelf === s);
      mine.sort((a, c) => byUse ? (c.keys.size - a.keys.size || a.alpha - c.alpha) : a.alpha - c.alpha);
      mine.forEach((r) => holder.appendChild(r.el));
    });
    rove();
  }));

  desk.querySelector(".lib-random").addEventListener("click", () => {
    const pool = records.filter((r) => !r.shelf.classList.contains("is-away") && !r.el.classList.contains("is-dim"));
    if (!pool.length) return;
    const r = pool[Math.floor(Math.random() * pool.length)];
    r.el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    window.setTimeout(() => open(r, false), still ? 0 : 520);
  });

  // ============================================================
  // FINDING YOUR WAY THROUGH THE BOXES BY KEYBOARD — one file in the
  // whole stacks takes the tab, and the arrows walk along them.
  // ============================================================
  function visible() {
    return [...stacks.querySelectorAll(".lib-shelf:not(.is-away) .lib-record:not(.is-dim)")];
  }
  let roving = null;
  function rove(to) {
    const books = visible();
    if (to) roving = to;
    if (!roving || books.indexOf(roving) < 0) roving = books[0] || null;
    records.forEach((r) => r.el.setAttribute("tabindex", r.el === roving ? "0" : "-1"));
  }
  stacks.addEventListener("keydown", (event) => {
    const el = event.target.closest(".lib-record");
    if (!el) return;
    const books = visible();
    const at = books.indexOf(el);
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = books[at + 1];
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = books[at - 1];
    else if (event.key === "Home") next = books[0];
    else if (event.key === "End") next = books[books.length - 1];
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(recOf.get(el), true);
      return;
    }
    if (next) {
      event.preventDefault();
      rove(next);
      next.focus();
    }
  });
  stacks.addEventListener("click", (event) => {
    const el = event.target.closest(".lib-record");
    if (!el) return;
    rove(el);
    open(recOf.get(el), false);
  });

  // ============================================================
  // THE CARD
  // ============================================================
  let current = null;
  let typing = 0;
  const cardCall = card.querySelector(".lib-card-call");
  const cardCaption = card.querySelector(".lib-card-caption");
  const cardShelf = card.querySelector(".lib-card-shelf");
  const cardName = card.querySelector(".lib-card-name");
  const cardSay = card.querySelector(".lib-card-say");
  const cardAka = card.querySelector(".lib-card-aka");
  const cardFound = card.querySelector(".lib-card-found");
  const steps = [...card.querySelectorAll(".lib-card-step")];

  // THE MARK at the head of the card: a ring of specks, one for every
  // fragrance on the site that uses the note, joined one to the next by
  // hairlines, turning slowly in a cloud of dust in its accord's colour,
  // with a rule run in to it from either side and ticked. Particles and
  // geometry, as the rest of the site is drawn — the owner found the
  // glass card "too futuristic".
  const mark = card.querySelector(".lib-card-mark");
  const MARK_TALL = 92;
  let markFrame = 0;
  let markOf = null;
  function markFor(r) {
    const n = Math.max(1, Math.min(48, r.keys.size));
    let seed = Math.floor(hash(r.name + "mark") * 4294967295) || 5;
    const rnd = () => {
      seed ^= seed << 13; seed >>>= 0;
      seed ^= seed >>> 17;
      seed ^= seed << 5; seed >>>= 0;
      return seed / 4294967296;
    };
    const ring = [];
    for (let i = 0; i < n; i++) ring.push({ a: (i / n) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI / n) * 0.6, r: 1 + (rnd() - 0.5) * 0.12 });
    const dust = [];
    for (let i = 0; i < 110; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 1.35;
      dust.push({ a, d, s: 0.7 + rnd() * 0.9, o: 0.12 + rnd() * 0.35, w: (rnd() - 0.5) * 0.4 });
    }
    // In the page's white, with the accord's colour on the ring's specks
    // alone — one for every fragrance — as a file carries it only on its
    // tab (2026-09-26, black and white).
    return { ring, dust, colour: markColour(r.code) };
  }
  function drawMark(t) {
    if (!markOf) return;
    const w = mark.clientWidth;
    if (!w) return;
    const ratio = drawRatio();
    if (mark.width !== Math.round(w * ratio)) { mark.width = Math.round(w * ratio); mark.height = Math.round(MARK_TALL * ratio); }
    const g = mark.getContext("2d");
    if (!g) return;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, w, MARK_TALL);
    const cx = w / 2, cy = MARK_TALL / 2, R = 30;
    const turn = still ? 0 : t * 0.00011;
    const white = (a) => "rgba(" + LINE + "," + a + ")";
    // The rule in from either side, ticked, and stopping short of the ring.
    g.fillStyle = "rgba(" + getComputedStyle(document.body).getPropertyValue("--ink-rgb") + ",0.2)";
    g.fillRect(0, cy, cx - R - 14, 0.8);
    g.fillRect(cx + R + 14, cy, w - cx - R - 14, 0.8);
    for (let x = 0; x < cx - R - 14; x += 12) g.fillRect(x, cy - (x % 48 ? 2 : 4), 0.8, x % 48 ? 4 : 8);
    for (let x = w; x > cx + R + 14; x -= 12) g.fillRect(x, cy - ((w - x) % 48 ? 2 : 4), 0.8, (w - x) % 48 ? 4 : 8);
    // The dust, turning a little slower than the ring.
    markOf.dust.forEach((d) => {
      const a = d.a + turn * (0.6 + d.w);
      g.fillStyle = white(d.o * 0.85);
      g.fillRect(cx + Math.cos(a) * d.d * R, cy + Math.sin(a) * d.d * R * 0.92, d.s, d.s);
    });
    // The ring: joined, then its specks.
    const pts = markOf.ring.map((p) => [cx + Math.cos(p.a + turn) * R * p.r, cy + Math.sin(p.a + turn) * R * p.r]);
    if (pts.length > 1) {
      g.strokeStyle = white(0.28);
      g.lineWidth = 0.7;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.stroke();
    }
    g.fillStyle = markOf.colour;
    pts.forEach(([x, y]) => g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4));
    // The centre, a registration cross.
    g.fillStyle = white(0.55);
    g.fillRect(cx - 4, cy - 0.4, 8, 0.8);
    g.fillRect(cx - 0.4, cy - 4, 0.8, 8);
  }
  function markLoop(t) {
    drawMark(t);
    markFrame = markOf && !still ? requestAnimationFrame(markLoop) : 0;
  }

  function open(r, focus) {
    if (!r) return;
    if (current) current.el.classList.remove("is-out");
    current = r;
    r.el.classList.add("is-out");
    card.style.setProperty("--hue", r.el.style.getPropertyValue("--hue"));

    cardCall.textContent = r.call;
    cardCaption.textContent = "Exhibit A · " + (r.keys.size === 1 ? "1 appearance" : r.keys.size + " appearances");
    markOf = markFor(r);
    if (!markFrame) markFrame = requestAnimationFrame(markLoop);
    cardShelf.textContent = "Accord " + r.code + " — " + r.shelfName;
    cardName.textContent = r.name;
    type(cardSay, r.say);

    const ul = cardAka.querySelector("ul");
    ul.textContent = "";
    r.aka.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a;
      ul.appendChild(li);
    });
    cardAka.hidden = !r.aka.length;
    cardAka.querySelector(".lib-found-count").textContent = String(r.aka.length);
    cardAka.open = opened.has("aka");

    found(r);

    const mine = records.filter((x) => x.shelf === r.shelf).sort((a, b) => a.alpha - b.alpha);
    const at = mine.indexOf(r);
    [mine[at - 1], mine[at + 1]].forEach((x, i) => {
      steps[i].hidden = !x;
      steps[i].textContent = x ? (i ? x.name + " →" : "← " + x.name) : "";
      steps[i].onclick = x ? () => open(x, true) : null;
    });

    const was = card.hidden;
    card.hidden = false;
    if (was && !still) {
      card.classList.remove("is-in");
      void card.offsetWidth;
    }
    card.classList.add("is-in");
    document.body.classList.add("lib-reading");
    if (r.el.id && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + r.el.id);
    }
    if (focus) cardName.focus({ preventScroll: true });
  }

  function close() {
    if (!current) return;
    const el = current.el;
    current.el.classList.remove("is-out");
    current = null;
    markOf = null;
    card.hidden = true;
    card.classList.remove("is-in");
    document.body.classList.remove("lib-reading");
    if (window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (card.contains(document.activeElement)) { rove(el); el.focus(); }
  }
  card.querySelector(".lib-card-close").addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current && document.activeElement !== query &&
        !document.body.classList.contains("menu-open")) close();
  });

  // The explanation comes up as if printed out at the terminal: fast,
  // and the whole sentence is there for anyone reading it aloud.
  function type(el, text) {
    window.cancelAnimationFrame(typing);
    el.setAttribute("aria-label", text);
    if (still) { el.textContent = text; return; }
    const t0 = performance.now();
    const LONG = Math.min(900, 220 + text.length * 5);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / LONG);
      el.textContent = text.slice(0, Math.round(text.length * t));
      if (t < 1) typing = requestAnimationFrame(step);
    };
    el.textContent = "";
    typing = requestAnimationFrame(step);
  }

  // FOUND IN: every fragrance on the site naming this note, set out the
  // way the owner asked — the individual fragrances first, by name, and
  // then HOUSES, each house named and only then its fragrances. It had a
  // bar per house above the list for one round; the list says it.
  //
  // AND EVERY PART OF IT IS A DROPDOWN, at the owner's word: "a dropdown
  // list of houses, then of pineward and then only see the individual
  // fragrances ... that way it would be a lot less chaotic". So the card
  // opens with only the groups showing, each with how many are in it —
  // Individual fragrances, Houses — and Houses opens onto the houses,
  // each of which opens onto its own fragrances. They are real
  // <details>, so they open by keyboard too. What was left open stays
  // open when the card turns over to the next note (`opened`), so going
  // through the stacks does not mean opening the same things every time.
  const opened = new Set();
  card.addEventListener("toggle", (event) => {
    const d = event.target;
    if (!d.dataset || !d.dataset.drop) return;
    if (d.open) opened.add(d.dataset.drop); else opened.delete(d.dataset.drop);
  }, true);
  function drop(title, n, cls, headCls, key) {
    const box = document.createElement("details");
    box.className = cls + " lib-drop";
    box.dataset.drop = key;
    const summary = document.createElement("summary");
    const head = document.createElement("span");
    head.className = headCls + " lib-drop-name";
    head.textContent = title;
    const count = document.createElement("span");
    count.className = "lib-found-count";
    count.textContent = String(n);
    summary.append(head, count);
    box.appendChild(summary);
    box.open = opened.has(key);
    return box;
  }

  function found(r) {
    const byHouse = new Map();
    [...r.keys].forEach((key) => {
      const [house, no] = key.split(":");
      if (!byHouse.has(house)) byHouse.set(house, []);
      byHouse.get(house).push(no);
    });
    byHouse.forEach((nos) => nos.sort());
    const h3 = cardFound.querySelector("h3");
    h3.textContent = "Known appearances · " + String(r.keys.size).padStart(2, "0");
    const list = cardFound.querySelector(".lib-card-list");
    list.textContent = "";
    cardFound.hidden = !r.keys.size;

    // In the order the houses stand in, whatever order the keys came in.
    const order = Object.keys(HOUSES).filter((h) => byHouse.has(h))
      .concat([...byHouse.keys()].filter((h) => !HOUSES[h]));
    const houses = order.filter((h) => h !== "individual");

    if (byHouse.has("individual")) {
      const nos = byHouse.get("individual");
      list.appendChild(drop("Individual fragrances", nos.length, "lib-found-section lib-found-individual", "lib-found-head", "individual"))
        .appendChild(fragrancesOf("individual", nos));
    }
    if (houses.length) {
      const block = list.appendChild(drop("Houses", houses.length === 1 ? "1 house" : houses.length + " houses",
        "lib-found-section lib-found-houses", "lib-found-head", "houses"));
      houses.forEach((house) => {
        const where = HOUSES[house] || { name: house };
        const nos = byHouse.get(house);
        const group = drop(where.name, nos.length, "lib-found-house", "lib-found-housename", "house:" + house);
        group.appendChild(fragrancesOf(house, nos));
        block.appendChild(group);
      });
    }
  }
  function fragrancesOf(house, nos) {
    const where = HOUSES[house] || { name: house, href: "" };
    const ul = document.createElement("ul");
    nos.forEach((no) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = where.href ? root + where.href + "#part-" + no : "#";
      a.dataset.key = house + ":" + no;
      const n = document.createElement("span");
      n.className = "lib-found-no";
      n.textContent = no;
      const t = document.createElement("span");
      t.className = "lib-found-name";
      t.textContent = titleOf(house, no) || "";
      a.append(n, t);
      li.appendChild(a);
      ul.appendChild(li);
    });
    if (where.href) learn(house, where.href);
    return ul;
  }

  // THE NAMES OF THE FRAGRANCES, read off each house's own page the
  // first time a card needs them, and kept.
  const titles = new Map();
  const asked = new Set();
  function titleOf(house, no) {
    return titles.get(house + ":" + no);
  }
  function learn(house, href) {
    if (asked.has(house)) return;
    asked.add(house);
    fetch(root + href).then((res) => res.ok ? res.text() : "").then((text) => {
      if (!text) return;
      const doc = new DOMParser().parseFromString(text, "text/html");
      doc.querySelectorAll("details[id^='part-']").forEach((part) => {
        const t = part.querySelector(".human-title, .pine-title, .adar-title");
        if (!t) return;
        titles.set(house + ":" + part.id.slice(5), t.textContent.replace(/\s+/g, " ").trim());
      });
      card.querySelectorAll(".lib-card-list a[data-key]").forEach((a) => {
        const name = titles.get(a.dataset.key);
        if (name) a.querySelector(".lib-found-name").textContent = name;
      });
    }).catch(() => {});
  }

  show();

  // ARRIVING WITH A RECORD IN THE ADDRESS opens it: the site's search
  // sends people to #note-cedar.
  function fromHash() {
    const id = (window.location.hash || "").slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    const r = el && recOf.get(el);
    if (!r) return;
    el.scrollIntoView({ block: "center" });
    open(r, false);
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);

  // ============================================================
  // THE ROOM — the lamp over the stacks, and the dust in the air
  // ============================================================
  // THE LAMP RUNS A BEAT BEHIND THE HAND, as the cursor's square does
  // (the same LAG as nav.js): each frame it closes that share of the way
  // to the pointer. It used to be set straight to the pointer on every
  // move, which the owner found "mechanical". With animation turned
  // off it simply stands where the pointer is.
  const LAMP_LAG = 0.16;
  let lampX = null, lampY = null, lampTo = [0, 0], lampFrame = 0;
  const placeLamp = () => {
    lamp.style.setProperty("--lx", lampX.toFixed(1) + "px");
    lamp.style.setProperty("--ly", lampY.toFixed(1) + "px");
  };
  const easeLamp = () => {
    lampFrame = 0;
    const dx = lampTo[0] - lampX, dy = lampTo[1] - lampY;
    lampX += dx * LAMP_LAG;
    lampY += dy * LAMP_LAG;
    if (Math.hypot(dx, dy) < 0.3) { lampX = lampTo[0]; lampY = lampTo[1]; }
    placeLamp();
    if (lampX !== lampTo[0] || lampY !== lampTo[1]) lampFrame = requestAnimationFrame(easeLamp);
  };
  window.addEventListener("pointermove", (event) => {
    lampTo = [event.clientX, event.clientY];
    if (lampX === null || still) {
      lampX = event.clientX;
      lampY = event.clientY;
      placeLamp();
    } else if (!lampFrame) {
      lampFrame = requestAnimationFrame(easeLamp);
    }
    lamp.classList.add("is-on");
  }, { passive: true });
  document.addEventListener("pointerleave", () => lamp.classList.remove("is-on"));

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const DUST_PER = 11000;  // px² of window per speck
  let W = 0, H = 0, ratio = 1, dust = [];
  let px = -9999, py = -9999;
  function size() {
    ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const n = Math.round((W * H) / DUST_PER);
    dust = [];
    for (let i = 0; i < n; i++) {
      dust.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.1,
        v: 0.04 + Math.random() * 0.12,
        sway: Math.random() * Math.PI * 2,
        glow: Math.random(),
      });
    }
    if (still) draw(0);
  }
  window.addEventListener("pointermove", (event) => { px = event.clientX; py = event.clientY; }, { passive: true });

  function draw(now) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const d of dust) {
      if (!still) {
        d.y -= d.v;
        d.x += Math.sin(now * 0.0004 + d.sway) * 0.08;
        if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
      }
      // Dust is seen where the lamp is.
      const dx = d.x - px, dy = d.y - py;
      const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 240);
      const a = 0.08 + 0.18 * d.glow * (0.6 + 0.4 * Math.sin(now * 0.001 + d.sway)) + near * 0.5;
      ctx.fillStyle = "rgba(236, 236, 236, " + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + near * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function loop(now) {
    draw(now);
    requestAnimationFrame(loop);
  }
  size();
  window.addEventListener("resize", size);
  if (!still) requestAnimationFrame(loop);
})();
