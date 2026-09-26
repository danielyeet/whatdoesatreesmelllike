// ============================================================
// THE NOTE LIBRARY — categories/note-library.html
//
// The page's markup is the catalogue: one <article class="lib-record">
// per note, standing in the <section class="lib-shelf"> of its family —
// its ACCORD, as the page calls it (the owner's word for what was
// "shelves"; the code still says shelf). This stands every record up as
// a FOLDER on its shelf and puts a catalogue terminal in front of the
// stacks:
//
//   THE BOOKS       every book's thickness is how many fragrances on
//                   the site use that note, and its height is its own
//                   (seeded, so the stacks stand the same way every
//                   visit). Its name runs down its spine and its CALL
//                   NUMBER is at the foot — the accord's code and its
//                   place in it, counted alphabetically. The spine is
//                   DRAWN IN HAIRLINES on a small canvas of its own — its
//                   outline, its bands, a panel on some and its label —
//                   and its accord's colour is ONE small mark, the band
//                   across its head (`HUE`, the same colour as the
//                   accord's tab). It was cloth, drawn in specks and then
//                   in flat shapes, until the owner asked for the books
//                   "more skeletal/geometric" with "a minimalist approach
//                   with the colour coding" (2026-09-26); and before that
//                   folders — "digital files" — which were "3-bit".
//   THE TERMINAL    one field over the whole catalogue. Books that
//                   answer light up and everything else goes dim; a
//                   shelf with nothing on it folds away. It reads names
//                   and every other spelling folded into a record, by
//                   DIRECT WORDS only: whole words, no near misses, and
//                   nothing found by what a note is said to be.
//   THE INDEX       a tab per accord, to stand in front of that one.
//   THE CARD        pressing a book pulls it off the shelf and opens its
//                   catalogue card beside the stacks: the call number,
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

  // Each shelf's colour, as a hue. The books are dark and only tinted:
  // the room is a library at night, and sixteen loud colours would be a
  // sweet shop.
  const HUE = {
    CIT: 50, ARO: 150, GRN: 100, FLO: 335, FRU: 8, SPI: 22, GOU: 36, BRW: 26,
    WOO: 30, CON: 135, RES: 40, ANI: 14, EAR: 75, AIR: 200, SMK: 220, IMP: 268, RET: 0,
  };

  // THE BOOKS
  const THICK_MIN = 20;    // px, a note used once
  const THICK_PER = 7;     // px per square root of the fragrances using it
  const THICK_MAX = 58;
  const THICK_JITTER = 9;  // px, so books used equally are not all one thickness
  const TALL_MIN = 140;    // px
  const TALL_MAX = 204;    // and every row of the shelf is --row (214px) high
  const TALL_PER_LETTER = 7.4; // the name has to fit down the spine
  const TALL_SPARE = 74;   // the band at the head, and the band and call number at the foot

  // THE BOOKS ARE DRAWN IN THE PAGE'S WHITE, at these strengths, and
  // their accord's colour is one mark: the band across the head, in the
  // same colour as the accord's tab (`HUE`, at `MARK_SAT` and
  // `MARK_LIGHT`). The returns cart's books have no colour at all.
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
  // STANDING THE BOOKS UP
  // ============================================================
  let bookNo = 0;
  records.forEach((r) => {
    const el = r.el;
    const n = Math.max(1, r.keys.size);
    const thick = Math.min(THICK_MAX,
      Math.round(THICK_MIN + THICK_PER * Math.sqrt(n) + hash(r.name + "w") * THICK_JITTER));
    const want = r.name.length * TALL_PER_LETTER + TALL_SPARE;
    const tall = Math.round(Math.min(TALL_MAX,
      Math.max(TALL_MIN + hash(r.name) * (TALL_MAX - TALL_MIN) * 0.8, want)));
    const hue = (HUE[r.code] || 0) + (hash(r.name + "h") - 0.5) * 16;
    el.style.setProperty("--w", thick + "px");
    el.style.setProperty("--h", tall + "px");
    el.style.setProperty("--hue", hue.toFixed(1));
    el.style.setProperty("--tone", (hash(r.name + "t") * 7 - 3.5).toFixed(2) + "%");
    el.style.setProperty("--band", String(Math.floor(hash(r.name + "b") * 3)));
    el.dataset.uses = String(r.keys.size);
    el.dataset.call = r.call;

    const label = document.createElement("span");
    label.className = "lib-call";
    label.setAttribute("aria-hidden", "true");
    label.innerHTML = "<b></b><i></i>";
    label.firstChild.textContent = r.code;
    label.lastChild.textContent = r.call.slice(4);
    el.appendChild(label);

    // THE SPINE, in specks, drawn when it first comes near the window.
    const spine = document.createElement("canvas");
    spine.className = "lib-spine";
    spine.setAttribute("aria-hidden", "true");
    spine.width = 1; spine.height = 1;
    el.insertBefore(spine, el.firstChild);
    r.spine = { canvas: spine, w: thick, h: tall };

    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-label", r.name + ", " + r.call + ". " +
      (r.keys.size === 1 ? "In one fragrance." : "In " + r.keys.size + " fragrances."));
    // The arrival: shelf by shelf, book by book, and quick about it.
    el.style.setProperty("--in", Math.min(900, shelves.indexOf(r.shelf) * 70 + r.alpha * 9) + "ms");
    bookNo++;
  });
  // ============================================================
  // DRAWING A SPINE — A SKELETON. The owner, 2026-09-26: "take a
  // minimalist approach with the colour coding of the books and make it
  // so that they themselves are more skeletal/geometric; matching the
  // rest of the website (the accords still should be colour coded, that
  // part can stay)". So a spine is drawn the way the rest of the site
  // draws things — in hairlines, on the dark: its OUTLINE, the two
  // BANDS across it near its head and its foot (on some doubled), on
  // about a third a TITLE PANEL where the name runs and on a few a
  // RULE down one side instead, and at its foot the LABEL, a hairline
  // box its call number is printed in. The only colour on it is the
  // accord's, and only once: THE BAND ACROSS ITS HEAD. Seeded by the
  // note's name, so every book is its own and the same every visit.
  //
  // It was cloth — drawn in thousands of specks for a round, then in
  // flat shapes ("not granular ... more of a geometric character") — in
  // a shade of its accord's colour from head to foot, with gilt.
  // ============================================================
  function drawSpine(r) {
    const { canvas: c, w, h } = r.spine;
    const ratio = drawRatio();
    c.width = Math.round(w * ratio);
    c.height = Math.round(h * ratio);
    const g = c.getContext("2d");
    if (!g) return;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    let seed = Math.floor(hash(r.name + "spine") * 4294967295) || 3;
    const rnd = () => {
      seed ^= seed << 13; seed >>>= 0;
      seed ^= seed >>> 17;
      seed ^= seed << 5; seed >>>= 0;
      return seed / 4294967296;
    };
    const line = (a) => "rgba(" + LINE + "," + a + ")";
    // A hairline on the pixel grid, so it stays one pixel and sharp.
    const across = (y, x0, x1, a) => { g.fillStyle = line(a); g.fillRect(x0, y, x1 - x0, 1 / ratio); };
    const down = (x, y0, y1, a) => { g.fillStyle = line(a); g.fillRect(x, y0, 1 / ratio, y1 - y0); };
    const frame = (x, y, bw, bh, a) => {
      across(y, x, x + bw, a); across(y + bh - 1 / ratio, x, x + bw, a);
      down(x, y, y + bh, a); down(x + bw - 1 / ratio, y, y + bh, a);
    };
    const head = 13, foot = h - 37;
    g.clearRect(0, 0, w, h);
    // THE BODY: the faintest ground, so the book is a volume and not a
    // wire, and its OUTLINE.
    g.fillStyle = line(0.028);
    g.fillRect(0, 0, w, h);
    frame(0, 0, w, h, 0.5);
    // THE ACCORD'S MARK, the only colour: a band across its head.
    g.fillStyle = markColour(r.code);
    g.fillRect(0, 0, w, 3);
    // THE BANDS, near the head and the foot; on some, doubled.
    const doubled = rnd() < 0.45;
    [head, foot].forEach((y) => {
      across(y, 0, w, 0.34);
      if (doubled) across(y + 3, 0, w, 0.2);
    });
    // A TITLE PANEL for some, where the name runs; a RULE down one side
    // for a few instead.
    const kind = rnd();
    if (kind < 0.34) {
      const px = Math.max(3, Math.round(w * 0.16)), top = head + (doubled ? 9 : 7), bottom = foot - 6;
      frame(px, top, w - px * 2, bottom - top, 0.2);
    } else if (kind < 0.46) {
      down(Math.round(w * 0.76), head + 5, foot - 4, 0.22);
    }
    // THE LABEL at the foot: a hairline box its call number is printed in.
    frame(3, h - 29, w - 6, 22, 0.36);
    r.spine.drawn = true;
  }
  // Drawn as they come near the window rather than all at once: three
  // hundred and more canvases on arrival would hold the page up.
  const seeSpine = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const r = recOf.get(e.target);
      if (r && !r.spine.drawn) drawSpine(r);
      seeSpine.unobserve(e.target);
    });
  }, { rootMargin: "700px 0px" }) : null;

  // Every shelf ends on a book leaning against the one before it.
  shelves.forEach((shelf) => {
    const last = [...shelf.querySelectorAll(".lib-record")].pop();
    if (last && shelf.querySelectorAll(".lib-record").length > 3) last.classList.add("lib-leans");
  });
  const recOf = new Map(records.map((r) => [r.el, r]));
  records.forEach((r) => { if (seeSpine) seeSpine.observe(r.el); else drawSpine(r); });

  // ============================================================
  // THE SHELVES — a board under every row, and nothing else, drawn as
  // the books are: IN HAIRLINES.
  //
  // For one round each accord stood in a bookcase drawn in specks —
  // uprights, a crown, a back of boards, a plinth — which the owner then
  // asked to have redesigned without its frame: "remove the bezel of the
  // bookshelves" (2026-09-25, night). The boards that were left were
  // flat walnut, lit and shadowed; with the page turned black and white
  // and the books made skeletons (2026-09-26), a board is a plank DRAWN
  // AS A DIAGRAM: its back edge, the arris where its top meets its front,
  // the foot of its front, closed at both ends — a ruler of ticks along
  // its foot — and on its front, near the left, a LABEL in a hairline box
  // giving the call numbers standing on that row (CIT 001–013), as a
  // library's shelves carry. It runs a little past the row either side
  // and stops.
  //
  // Drawn behind the books on a canvas of its own (`.lib-boards`), when
  // it first comes near the window, and again whenever the rows change —
  // the width, or the order the books stand in.
  // ============================================================
  const BOARD_OUT = 10;     // px the board runs past the row either side
  const BOARD_TOP = 7;      // px of its top, seen from above
  const BOARD_FACE = 11;    // px of its front edge
  const BOARD_TICKS = 24;   // px between the ticks along its foot
  function drawBoards(holder) {
    const c = holder.querySelector(".lib-boards");
    if (!c || !holder.offsetParent) return;
    const cs = getComputedStyle(holder);
    const rowH = parseFloat(cs.getPropertyValue("--row")) || 214;
    const gap = parseFloat(cs.getPropertyValue("--gap")) || 52;
    const books = [...holder.querySelectorAll(".lib-record")];
    // Which row each book stands on, read off where it stands.
    const rows = [];
    books.forEach((b) => {
      const k = Math.max(0, Math.round((b.offsetTop + b.offsetHeight - rowH) / (rowH + gap)));
      (rows[k] = rows[k] || []).push(recOf.get(b));
    });
    const n = Math.max(1, rows.length);
    const out = window.innerWidth < 700 ? 4 : BOARD_OUT;
    const w = holder.clientWidth + out * 2;
    const h = (n - 1) * (rowH + gap) + rowH + BOARD_TOP + BOARD_FACE + 6;
    c.style.left = -out + "px";
    c.style.top = "0px";
    c.style.width = w + "px";
    c.style.height = h + "px";
    const ratio = drawRatio();
    c.width = Math.round(w * ratio);
    c.height = Math.round(h * ratio);
    const g = c.getContext("2d");
    if (!g) return;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, w, h);
    const code = holder.closest(".lib-shelf").dataset.shelf;
    const line = (a) => "rgba(" + LINE + "," + a + ")";
    const hair = 1 / ratio;
    const mono = getComputedStyle(document.body).getPropertyValue("--mono").trim() || "monospace";
    for (let k = 0; k < n; k++) {
      const top = k * (rowH + gap) + rowH;
      const arris = top + BOARD_TOP, base = arris + BOARD_FACE;
      // The faintest ground to its front, then its edges.
      g.fillStyle = line(0.03);
      g.fillRect(0, arris, w, BOARD_FACE);
      g.fillStyle = line(0.3); g.fillRect(0, top, w, hair);
      g.fillStyle = line(0.62); g.fillRect(0, arris, w, hair);
      g.fillStyle = line(0.4); g.fillRect(0, base - hair, w, hair);
      g.fillStyle = line(0.4);
      g.fillRect(0, top, hair, BOARD_TOP + BOARD_FACE);
      g.fillRect(w - hair, top, hair, BOARD_TOP + BOARD_FACE);
      // A ruler of ticks along its foot.
      g.fillStyle = line(0.22);
      for (let x = BOARD_TICKS; x < w - 4; x += BOARD_TICKS) g.fillRect(x, base, hair, 4);
      // The label, if the row holds anything.
      const row = rows[k];
      if (!row || !row.length) continue;
      const nums = row.map((r) => parseInt(r.call.slice(4), 10)).sort((p, q) => p - q);
      const text = code + " " + String(nums[0]).padStart(3, "0") + (nums.length > 1 ? "–" + String(nums[nums.length - 1]).padStart(3, "0") : "");
      const lw = 88, lh = 9, lx = out + 14, ly = arris + (BOARD_FACE - lh) / 2;
      g.fillStyle = "rgb(11, 11, 12)";
      g.fillRect(lx, ly, lw, lh);
      g.strokeStyle = line(0.45);
      g.lineWidth = hair;
      g.strokeRect(lx + hair / 2, ly + hair / 2, lw - hair, lh - hair);
      g.fillStyle = line(0.8);
      g.font = "500 7px " + mono;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, lx + lw / 2, ly + lh / 2 + 0.5);
    }
    holder.dataset.rows = String(n);
    c.dataset.drawn = "1";
  }
  const holders = shelves.map((s) => s.querySelector(".lib-records")).filter(Boolean);
  holders.forEach((holder) => {
    const c = document.createElement("canvas");
    c.className = "lib-boards";
    c.setAttribute("aria-hidden", "true");
    c.width = 1; c.height = 1;
    holder.insertBefore(c, holder.firstChild);
  });
  /** Redraw the cases that have been drawn (and any near the window). */
  function drawAllBoards() {
    holders.forEach((holder) => {
      const c = holder.querySelector(".lib-boards");
      // One folded away by the terminal is drawn again when it comes back.
      if (!holder.offsetParent) c.dataset.stale = "1";
      else if (c.dataset.drawn || !seeBoards) drawBoards(holder);
    });
  }
  const seeBoards = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const c = e.target.querySelector(".lib-boards");
      if (!e.isIntersecting || (c.dataset.drawn && !c.dataset.stale)) return;
      delete c.dataset.stale;
      drawBoards(e.target);
    });
  }, { rootMargin: "700px 0px" }) : null;
  if (seeBoards) holders.forEach((holder) => seeBoards.observe(holder));
  else drawAllBoards();
  // AGAIN WHEN THE ROWS CHANGE: the width (and so where they wrap).
  let boardsWidth = window.innerWidth, boardsTimer = 0;
  window.addEventListener("resize", () => {
    if (window.innerWidth === boardsWidth) return;
    boardsWidth = window.innerWidth;
    clearTimeout(boardsTimer);
    boardsTimer = setTimeout(drawAllBoards, 160);
  });
  // The monospace the labels are printed in may arrive after the first
  // drawing.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAllBoards);

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
    ["Records", shelved.length],
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
    '</form>' +
    '<div class="lib-tools">' +
      '<div class="lib-order" role="group" aria-label="Order the accords">' +
        '<button type="button" class="lib-order-by is-on" data-order="alpha">A–Z</button>' +
        '<button type="button" class="lib-order-by" data-order="uses">Most used</button>' +
      '</div>' +
      '<button type="button" class="lib-random">Pull a random book</button>' +
    '</div>' +
    '<p class="lib-nothing" hidden>No record answers that. <a class="lib-elsewhere" href="#">Search the whole site →</a></p>';

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
  shelves.forEach((s) => {
    const n = s.querySelectorAll(".lib-record").length;
    const plate = s.querySelector(".lib-plate");
    const count = document.createElement("p");
    count.className = "lib-shelf-count";
    count.textContent = n === 1 ? "1 record" : n + " records";
    s.style.setProperty("--hue", String(HUE[s.dataset.shelf] || 0));
    plate.appendChild(count);
    stacks.appendChild(s);
  });

  // The slip that names a book in full while it is pointed at: a name
  // down a thin spine is cut short, and this is where it is read.
  const slip = document.createElement("div");
  slip.className = "lib-slip";
  slip.setAttribute("aria-hidden", "true");
  library.appendChild(slip);

  // The lamp stands over the stacks in the window.
  const lamp = document.createElement("div");
  lamp.className = "lib-lamp";
  lamp.setAttribute("aria-hidden", "true");
  library.appendChild(lamp);

  // THE CARD
  const card = document.createElement("aside");
  card.className = "lib-card";
  card.hidden = true;
  card.setAttribute("aria-label", "Catalogue card");
  card.innerHTML =
    '<div class="lib-card-top">' +
      '<span class="lib-card-call"></span>' +
      '<button type="button" class="lib-card-close" aria-label="Put the book back">×</button>' +
    '</div>' +
    '<canvas class="lib-card-mark" aria-hidden="true"></canvas>' +
    '<p class="lib-card-shelf"></p>' +
    '<h2 class="lib-card-name" tabindex="-1"></h2>' +
    '<p class="lib-card-say"></p>' +
    '<details class="lib-card-aka lib-drop" data-drop="aka"><summary><span class="lib-drop-name">Also catalogued as</span>' +
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
  const nothing = desk.querySelector(".lib-nothing");
  const elsewhere = desk.querySelector(".lib-elsewhere");
  let onShelf = "";
  let hits = [];

  // DIRECT WORDS ONLY — the owner's rule. A book answers when every
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
    nothing.hidden = !q || hits.length > 0;
    elsewhere.href = S ? S.siteSearchHref(root, q) : root + "search.html";
    rove();
  }

  query.addEventListener("input", show);
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

  // THE ORDER a shelf's books stand in. The call numbers do not change:
  // they are where a book belongs, not where it happens to be standing.
  desk.querySelectorAll(".lib-order-by").forEach((b) => b.addEventListener("click", () => {
    desk.querySelectorAll(".lib-order-by").forEach((x) => x.classList.toggle("is-on", x === b));
    const byUse = b.dataset.order === "uses";
    shelves.forEach((s) => {
      const holder = s.querySelector(".lib-records");
      const mine = records.filter((r) => r.shelf === s);
      mine.sort((a, c) => byUse ? (c.keys.size - a.keys.size || a.alpha - c.alpha) : a.alpha - c.alpha);
      mine.forEach((r) => { r.el.classList.remove("lib-leans"); holder.appendChild(r.el); });
      if (mine.length > 3) mine[mine.length - 1].el.classList.add("lib-leans");
    });
    // The rows hold other books now, and the labels say so.
    drawAllBoards();
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
  // FINDING YOUR WAY ALONG THE SHELVES BY KEYBOARD — one book in the
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

  // THE SLIP, over whatever book is pointed at or focused
  function slipOver(el) {
    if (!el) { slip.classList.remove("is-on"); return; }
    const r = recOf.get(el);
    const box = el.getBoundingClientRect();
    const lib = library.getBoundingClientRect();
    slip.textContent = "";
    const b = document.createElement("b");
    b.textContent = r.name;
    const small = document.createElement("small");
    small.textContent = r.call + " · " + (r.keys.size === 1 ? "1 fragrance" : r.keys.size + " fragrances");
    slip.append(b, small);
    slip.style.setProperty("--hue", el.style.getPropertyValue("--hue"));
    const left = box.left + box.width / 2 - lib.left;
    slip.style.left = Math.max(80, Math.min(lib.width - 80, left)) + "px";
    slip.style.top = (box.top - lib.top) + "px";
    slip.classList.add("is-on");
  }
  stacks.addEventListener("pointerover", (event) => {
    const el = event.target.closest(".lib-record");
    if (el && event.pointerType !== "touch") slipOver(el);
  });
  stacks.addEventListener("pointerleave", () => slipOver(null));
  stacks.addEventListener("focusin", (event) => {
    const el = event.target.closest(".lib-record");
    if (el) slipOver(el);
  });
  stacks.addEventListener("focusout", () => slipOver(null));

  // ============================================================
  // THE CARD
  // ============================================================
  let current = null;
  let typing = 0;
  const cardCall = card.querySelector(".lib-card-call");
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
    // alone — one for every fragrance — as a book carries it only on its
    // head (2026-09-26, black and white).
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
    h3.textContent = r.keys.size === 1 ? "Found in 1 fragrance" : "Found in " + r.keys.size + " fragrances";
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
