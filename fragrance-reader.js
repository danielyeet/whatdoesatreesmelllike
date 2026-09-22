// ============================================================
// THE FRAGRANCE READER — the Fragrances view of
// categories/scent-descriptions.html
//
// Pressing a fragrance in that table used to LEAVE THE PAGE for
// individual-fragrances/individual-fragrances.html. The owner asked for it not to:
// "i dont want the page for the fragrances in SD to take you to a new
// page when you click a new fragrance. I want the fragrances to open
// in page and one by one."
//
// So it opens in place. The table and everything round it fades away,
// the page goes blank, and that one fragrance comes up on it: its
// PICTURE, its WRITING, and its NOTES, with an arrow at the foot to
// go back.
//
// WHERE THE WRITING COMES FROM, AND WHY IT IS FETCHED. It is not
// copied into this page. `individual-fragrances/individual-fragrances.html` is where a
// fragrance's writing lives, and this view FETCHES that page and lifts
// the part out of it. Two copies of the owner's own words is the one
// thing this site has a standing rule against — the index and the
// houses are "two ways into the same writing rather than two copies of
// it" — and a copy here would go stale the first time they edited the
// other one.
//
// THE NOTES ARE RENDERED BY notes.js, not by this file: `NOTE_PANEL`
// is the same renderer every house page uses. One renderer, or the two
// drift apart and a reader is told different things about the same
// fragrance depending on which door they came in by.
//
// ============================================================
// THE WAY BACK, WHICH IS THE WHOLE OF THE DRAWING
//
// The owner described it: "making everything except the picture fade
// (make the picture a square) and then making it go recede into one of
// the squares (at random) of the background. If there is more than one
// picture, then they all become squares and then move backwards into
// the grid. After being in the grid, make them fade away at once."
//
//   1  THE WRITING GOES.   Everything but the pictures fades out.
//   2  THEY SQUARE UP.     Each picture is taken out of the layout
//                          into a flier of its own, standing exactly
//                          where it stood, and becomes a square.
//   3  THEY RECEDE.        Each flier travels back to a cell of the
//                          GRID — its own cell, picked at random and
//                          never twice the same — shrinking as it
//                          goes.
//   4  THEY GO AT ONCE.    Once they are all home they fade together,
//                          on one clock rather than each on its own.
//
// AND THE TABLE IS ALREADY BACK BEHIND THEM by the time they fade, so
// there is nothing to replay: the owner asked for the way back NOT to
// run the opening again, and this is how it does not. What you see is
// one continuous movement from the fragrance into the grid, with the
// list standing behind it as it goes.
//
// THE GRID IS THE PAGE'S OWN ONE. The contact sheet is already ruled
// into squares — `--grid-cell`, 46px, set on :root and spent in
// `.sheet-page` — and the reader is ruled into the same ones by the
// same declaration. So the squares a picture goes home to are the
// squares that were always there.
//
// AND THE CELLS ARE NOT ELEMENTS. They are worked out: the grid is
// drawn by a pair of gradients, so a cell is a sum rather than a
// thing, and a 1440-wide window would otherwise want six hundred
// spans in the page to be measured and never looked at.
//
// ONLY PART OF IT IS HOME. Every square on the window was fair game
// for one round, and the pictures went wherever the shuffle sent them
// — which made the same movement read differently every time. The
// owner asked for one place, "somewhere in the center, ish and on the
// right side", so `HOME` cuts the grid down to that block before
// anything is dealt out.
//
// IT HAD A GRID OF ITS OWN FOR ONE ROUND, at about 90px, built as a
// lattice of elements. That was written before anyone noticed the page
// was already ruled, and it read as a second grid over the first,
// which is what it was.
//
// WITHOUT THIS SCRIPT every row is still a link to the fragrance on
// its own page, exactly as before. Nothing here is required to read
// anything.
// ============================================================
(function () {
  const view = document.querySelector('.view[data-view="fragrances"]');
  if (!view) return;
  const page = view.querySelector(".index-page");
  if (!page) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const BLANK_MS = 560;         // the page going blank when one is opened
  const COME_MS = 700;          // and the fragrance arriving on it

  const CLEAR_MS = 460;         // the writing going, on the way back
  const SQUARE_MS = 560;        // the picture becoming a square
  const RECEDE_MS = 900;        // and travelling back into the grid
  const GONE_MS = 560;          // then all of them fading, together

  // WHERE THE PICTURES GO HOME TO, as a share of the window: the owner
  // asked for it "somewhere in the center, ish and on the right side"
  // rather than anywhere on the page. Given as fractions rather than
  // pixels so it means the same thing on every screen.
  //
  // THESE ARE PROVISIONAL. The owner said they would send a picture of
  // the grid they want; until it arrives this is a reading of the
  // sentence, and moving it is moving four numbers.
  const HOME = { from: 0.56, to: 0.94, top: 0.24, down: 0.76 };

  const WHERE = "../individual-fragrances/individual-fragrances.html";

  let sheet = null;             // that page, once it has been fetched
  let fetching = null;
  let open = false;
  let busy = false;

  /** The page's own writing for one fragrance, fetched once and kept.
      One request for the whole document, not one per fragrance: it is
      a single page and asking for it seven times would be seven times
      the same answer. */
  function theSheet() {
    if (sheet) return Promise.resolve(sheet);
    if (fetching) return fetching;
    fetching = fetch(WHERE)
      .then((answer) => {
        if (!answer.ok) throw new Error("individual-fragrances.html: " + answer.status);
        return answer.text();
      })
      .then((text) => {
        sheet = new DOMParser().parseFromString(text, "text/html");
        return sheet;
      });
    return fetching;
  }

  // ============================================================
  // THE READER, BUILT ONCE
  // ============================================================
  const reader = document.createElement("div");
  reader.className = "frag-reader";
  reader.hidden = true;
  reader.setAttribute("aria-live", "polite");
  reader.innerHTML =
    '<article class="frag-in">' +
      '<p class="frag-kicker"><span class="frag-no"></span><span class="frag-house"></span></p>' +
      '<h2 class="frag-name"></h2>' +
      '<div class="frag-body">' +
        '<figure class="frag-plate"><div aria-hidden="true"></div></figure>' +
        '<div class="frag-side">' +
          '<div class="frag-text"></div>' +
          '<div class="frag-notes"></div>' +
        "</div>" +
      "</div>" +
      '<button class="frag-back" type="button">' +
        '<span class="frag-arrow" aria-hidden="true">←</span>' +
        '<span>Back to the fragrances</span>' +
      "</button>" +
    "</article>";
  view.appendChild(reader);

  const inside = reader.querySelector(".frag-in");
  const plate = reader.querySelector(".frag-plate");

  /** THE SQUARES, WORKED OUT RATHER THAN BUILT.

      The grid is painted by two gradients at `--grid-cell` starting at
      the window's own corner, so a cell is arithmetic: the nth column
      begins at n × cell. Reading the size off the stylesheet rather
      than writing it here again is the whole point — the page's ground
      and the place a picture lands are then one decision. */
  let cells = [];
  function rule() {
    const wide = window.innerWidth;
    const tall = window.innerHeight;
    const said = getComputedStyle(document.documentElement)
      .getPropertyValue("--grid-cell");
    const cell = parseFloat(said) || 46;

    // ONLY PART OF THE GRID IS HOME. Every square on the window was
    // fair game for one round and the pictures went wherever the
    // shuffle sent them, which made the same movement read differently
    // every time. The owner asked for one place — centre-ish, on the
    // right — so the cells are cut down to that block before anything
    // is dealt out.
    const from = Math.floor((wide * HOME.from) / cell);
    const to = Math.ceil((wide * HOME.to) / cell);
    const top = Math.floor((tall * HOME.top) / cell);
    const down = Math.ceil((tall * HOME.down) / cell);

    cells = [];
    for (let row = top; row < down; row++) {
      for (let col = from; col < to; col++) {
        const left = col * cell;
        const up = row * cell;
        // A square that hangs off the window is not somewhere to land.
        if (left + cell > wide || up + cell > tall) continue;
        cells.push({ left: left, top: up, width: cell, height: cell });
      }
    }
    // A window too small for that block still has to have somewhere to
    // send a picture, so fall back to the middle square of whatever
    // there is.
    if (!cells.length) {
      cells.push({
        left: Math.max(0, Math.floor((wide - cell) / 2 / cell) * cell),
        top: Math.max(0, Math.floor((tall - cell) / 2 / cell) * cell),
        width: cell, height: cell,
      });
    }
  }

  window.addEventListener("resize", () => { if (open) rule(); });

  // ============================================================
  // OPENING ONE
  // ============================================================
  const safe = (t) => String(t).replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function show(no, row) {
    if (busy) return;
    busy = true;
    const named = row.querySelector(".index-what");
    const house = row.querySelector("td:nth-child(3)");
    reader.querySelector(".frag-no").textContent = no;
    reader.querySelector(".frag-house").textContent = house ? house.textContent.trim() : "";
    reader.querySelector(".frag-name").textContent = named ? named.textContent.trim() : "";

    // The picture and the writing, out of the page they live in.
    const text = reader.querySelector(".frag-text");
    text.innerHTML = '<p class="frag-waiting">Fetching the writing…</p>';
    plate.querySelectorAll("img").forEach((img) => img.remove());

    theSheet().then((doc) => {
      const part = doc.getElementById("part-" + no);
      if (!part) {
        text.innerHTML = '<p class="frag-waiting">This one has nothing written yet.</p>';
        return;
      }
      const writing = part.querySelector(".human-text");
      text.innerHTML = writing ? writing.innerHTML : "";
      // The View notes button belongs to that page, not to this one —
      // the notes are already printed below here.
      text.querySelectorAll(".note-open").forEach((b) => b.remove());

      const shot = part.querySelector(".human-plate img");
      if (shot && shot.getAttribute("src")) {
        const img = document.createElement("img");
        // The fetched page's paths are relative to works/, and this
        // page stands in categories/ — same depth, so they resolve the
        // same way. Taken off the attribute rather than off `.src`,
        // which the parser has already made absolute against THIS
        // page's address and would have been right by luck.
        img.src = shot.getAttribute("src");
        img.alt = "";
        // A PICTURE THAT IS NOT THERE YET LEAVES THE HATCHING SHOWING,
        // which is what house.js does on every other page.
        img.addEventListener("error", () => img.remove());
        plate.appendChild(img);
      }
    }).catch(() => {
      text.innerHTML = '<p class="frag-waiting">The writing could not be fetched. ' +
        'It is on <a href="' + WHERE + '#part-' + no + '">its own page</a>.</p>';
    });

    // The notes, by the same renderer every house page uses.
    const notes = reader.querySelector(".frag-notes");
    const all = window.FRAGRANCE_NOTES || {};
    const panel = window.NOTE_PANEL;
    notes.innerHTML = panel
      ? '<p class="frag-notes-head">Notes</p>' +
          panel.html(all["individual:" + no], "frag-notes-" + no)
      : "";

    rule();
    reader.hidden = false;
    open = true;
    page.classList.add("is-going");
    document.body.classList.add("frag-open");

    window.setTimeout(() => {
      page.hidden = true;
      page.classList.remove("is-going");
      reader.classList.add("is-here");
      reader.scrollTop = 0;
      const back = reader.querySelector(".frag-back");
      if (back) back.focus({ preventScroll: true });
      busy = false;
    }, REDUCE_MOTION ? 0 : BLANK_MS);
  }

  // ============================================================
  // THE WAY BACK
  // ============================================================
  function hide() {
    if (busy || !open) return;
    busy = true;

    const done = () => {
      reader.hidden = true;
      reader.classList.remove("is-here", "is-clearing");
      inside.style.opacity = "";
      document.querySelectorAll(".frag-flier").forEach((f) => f.remove());
      open = false;
      busy = false;
      document.body.classList.remove("frag-open");
      const first = page.querySelector(".index-search-field");
      if (first) first.focus({ preventScroll: true });
    };

    if (REDUCE_MOTION) { page.hidden = false; done(); return; }

    // 1 — THE PICTURES COME OUT OF THE LAYOUT FIRST, measured where
    // they actually stand, so nothing moves when the writing goes.
    const shots = [...reader.querySelectorAll(".frag-plate img, .frag-plate > div")]
      .filter((el) => el.offsetWidth > 4);
    const fliers = shots.map((el) => {
      const box = el.getBoundingClientRect();
      const flier = document.createElement("div");
      flier.className = "frag-flier";
      flier.style.left = box.left + "px";
      flier.style.top = box.top + "px";
      flier.style.width = box.width + "px";
      flier.style.height = box.height + "px";
      if (el.tagName === "IMG") {
        const copy = document.createElement("img");
        copy.src = el.src;
        copy.alt = "";
        flier.appendChild(copy);
      } else {
        flier.classList.add("frag-flier-blank");
      }
      document.body.appendChild(flier);
      return flier;
    });

    // 2 — THE WRITING GOES, and the pictures stay where they were.
    reader.classList.add("is-clearing");

    // THE CELLS THEY GO HOME TO, one each and never twice the same:
    // two pictures receding into the same square would read as one
    // picture rather than as two.
    rule();
    const free = cells.map((c, i) => i);
    for (let i = free.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = free[i]; free[i] = free[j]; free[j] = t;
    }

    window.setTimeout(() => {
      // 3 — THEY SQUARE UP AND RECEDE. The square and the travel are
      // one movement rather than two: a picture that squared up,
      // stopped, and then set off would read as two decisions.
      fliers.forEach((flier, n) => {
        const home = cells[free[n % Math.max(1, cells.length)]];
        if (!home) return;
        // ONE EASING FOR THE WHOLE MOVEMENT, and a gentle one. It was
        // two different curves — a sharper one for the travel than for
        // the squaring — and at these longer durations that read as the
        // picture changing its mind half way. A single soft ease in and
        // out is what "smoother" turned out to mean.
        const ease = "cubic-bezier(0.33, 0, 0.18, 1)";
        flier.style.transition =
          "left " + RECEDE_MS + "ms " + ease + "," +
          "top " + RECEDE_MS + "ms " + ease + "," +
          "width " + SQUARE_MS + "ms " + ease + "," +
          "height " + SQUARE_MS + "ms " + ease;
        flier.style.left = home.left + "px";
        flier.style.top = home.top + "px";
        flier.style.width = home.width + "px";
        flier.style.height = home.height + "px";
      });

      // THE LIST IS ALREADY BACK BEHIND THEM, which is the owner's
      // "does not replay the animation": there is nothing to run
      // again, because the page they are receding onto is the page
      // they came from.
      page.hidden = false;
      reader.classList.remove("is-here");

      window.setTimeout(() => {
        // 4 — AND THEY GO AT ONCE, on one clock rather than each on
        // its own.
        fliers.forEach((f) => f.classList.add("is-gone"));
        window.setTimeout(done, GONE_MS + 40);
      }, RECEDE_MS + 40);
    }, CLEAR_MS);
  }

  // ============================================================
  // KEEPING UP
  // ============================================================
  // THE ROW IS STILL A LINK, and that is deliberate: with this script
  // blocked every fragrance still opens on its own page. What changes
  // is only what a PRESS does.
  page.addEventListener("click", (event) => {
    const link = event.target.closest(".index-what a");
    if (!link) return;
    const at = (link.getAttribute("href") || "").match(/#part-(\d+)/);
    if (!at) return;
    const row = link.closest("tr");
    if (!row) return;
    event.preventDefault();
    show(at[1], row);
  });

  reader.addEventListener("click", (event) => {
    if (event.target.closest(".frag-back")) hide();
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape" || event.key === "Esc") hide();
  });

  // Leaving the Fragrances view by its own button closes whatever is
  // open — the two views are one page and the reader belongs to one of
  // them.
  document.addEventListener("click", (event) => {
    if (!open) return;
    if (event.target.closest(".sheet-filter")) {
      page.hidden = false;
      reader.hidden = true;
      reader.classList.remove("is-here", "is-clearing");
      document.querySelectorAll(".frag-flier").forEach((f) => f.remove());
      document.body.classList.remove("frag-open");
      open = false;
      busy = false;
    }
  }, true);
})();
