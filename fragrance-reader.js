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
// THE NOTES ARE notes.js's, not this file's: `NOTE_PANEL` hands out the
// same renderer AND the same VIEW NOTES button and window every house
// page uses, so a fragrance's notes open on a click here too. One renderer, or the two
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
// IN A STRAIGHT LINE. The owner: "I want it not to do any turning but
// rather a straight path from the place the picture of the fragrance
// is on the screen to the square in which it will fade away." It used
// to turn, because its SIZE ran on a shorter clock than its PLACE —
// the picture shrank towards its own corner faster than it travelled,
// so its middle first went up and away from the square it was headed
// for and then swung round towards it. Its place, its size and its
// squaring are one clock now, so its middle cannot leave the line.
//
// AND WHATEVER THE WHEEL DOES. "Make it so that this happens
// independently of scrolling please, because when you scroll the
// whole page glitches out." The reader was still standing over the
// page, invisible, catching the wheel — so scrolling during the way
// back scrolled the fading article about underneath the picture, and
// the table came back wherever it happened to be. Scrolling is held
// for the length of it now, and the page comes back exactly where it
// was left.
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

  // THE WAY BACK, slower again at the owner's word — "make it a bit
  // slower too", and "the fading away can be made slower too".
  const CLEAR_MS = 640;         // the writing going
  const TRAVEL_MS = 1500;       // squaring up and travelling home: ONE clock
  const REST_MS = 220;          // sitting in its square for a moment
  const GONE_MS = 1200;         // then all of them fading, together
  const LEAVE_MS = 1000;        // the reader's own ground going, under them

  // ONE EASE FOR THE WHOLE MOVEMENT, soft at both ends. It is the
  // reason the path is straight: the place, the size and the squaring
  // all read the same progress, so the middle of the picture moves
  // along one line from where it stood to where it lands.
  const EASE = "cubic-bezier(0.45, 0.05, 0.2, 1)";
  // How finely the picture's inside is worked out along the way. The
  // outside is a straight line and needs two; the inside is a ratio of
  // two straight lines, which is not one, and needs to be sampled.
  const STEPS = 40;

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
  // The table's own scrolling box. Taking the page off the screen
  // loses where it had been scrolled to, so it is written down first.
  const scroller = page.querySelector(".index-scroll");

  /** WHERE THE PAGE WAS when a fragrance was opened: the window's own
      scroll and the table's. Hiding the list shortens the page, and the
      browser pulls the window back to the top to fit — so without this
      the list came back somewhere other than where it was left, which
      is one of the ways "the whole page glitches out" on a phone. */
  let left = { y: 0, list: 0 };

  function cellSize() {
    const said = getComputedStyle(document.documentElement)
      .getPropertyValue("--grid-cell");
    return parseFloat(said) || 46;
  }

  /** THE SQUARES, WORKED OUT RATHER THAN BUILT.

      The grid is painted by two gradients at `--grid-cell`, so a cell is
      arithmetic: the nth column begins at n × cell. Reading the size off
      the stylesheet rather than writing it here again is the whole
      point — the page's ground and the place a picture lands are then
      one decision.

      AND THEY ARE THE PAGE'S SQUARES WHEREVER IT IS SCROLLED TO. The
      page's grid scrolls with the page and the reader's is pinned to the
      window, so on a page scrolled a part-square down — a phone, where
      the list is longer than the screen — the two disagreed by that
      part, and a picture landed in the reader's square and was then left
      straddling two of the page's. The reader's grid is shifted by the
      same part (`shift`), and so are the squares it deals out. */
  let cells = [];
  let shift = 0;
  function rule() {
    const wide = window.innerWidth;
    const tall = window.innerHeight;
    const cell = cellSize();

    // ONLY PART OF THE GRID IS HOME. Every square on the window was
    // fair game for one round and the pictures went wherever the
    // shuffle sent them, which made the same movement read differently
    // every time. The owner asked for one place — centre-ish, on the
    // right — so the cells are cut down to that block before anything
    // is dealt out.
    const from = Math.floor((wide * HOME.from) / cell);
    const to = Math.ceil((wide * HOME.to) / cell);
    const top = Math.floor((tall * HOME.top) / cell);
    const down = Math.ceil((tall * HOME.down) / cell) + 1;

    cells = [];
    for (let row = top; row < down; row++) {
      for (let col = from; col < to; col++) {
        const at = col * cell;
        const up = row * cell - shift;
        // A square that hangs off the window is not somewhere to land.
        if (up < 0 || at + cell > wide || up + cell > tall) continue;
        cells.push({ left: at, top: up, width: cell, height: cell });
      }
    }
    // A window too small for that block still has to have somewhere to
    // send a picture, so fall back to the middle square of whatever
    // there is.
    if (!cells.length) {
      let up = Math.floor(((tall - cell) / 2 + shift) / cell) * cell - shift;
      if (up < 0) up += cell;
      cells.push({
        left: Math.max(0, Math.floor((wide - cell) / 2 / cell) * cell),
        top: up, width: cell, height: cell,
      });
    }
  }

  window.addEventListener("resize", () => { if (open) rule(); });

  // ============================================================
  // SCROLLING IS HELD WHILE ANYTHING IS MOVING
  //
  // The owner: "Make it so that this happens independently of
  // scrolling please, because when you scroll the whole page glitches
  // out." What the wheel did during the way back was scroll the reader
  // — still standing over the page, invisible — so the fading article
  // slid about under the pictures, and once the list was back it
  // scrolled the table under them too. For the few seconds a
  // transition takes, the wheel, a drag and the scrolling keys do
  // nothing at all, and everything is let go again the moment it ends.
  // ============================================================
  const SCROLL_KEYS = new Set([" ", "Spacebar", "PageUp", "PageDown", "Home", "End",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  const still = (event) => { if (event.cancelable) event.preventDefault(); };
  const stillKeys = (event) => {
    if (SCROLL_KEYS.has(event.key) && event.cancelable) event.preventDefault();
  };
  let held = false;
  function hold(on) {
    if (on === held) return;
    held = on;
    const how = on ? "addEventListener" : "removeEventListener";
    window[how]("wheel", still, { passive: false, capture: true });
    window[how]("touchmove", still, { passive: false, capture: true });
    window[how]("keydown", stillKeys, { capture: true });
    document.documentElement.classList.toggle("frag-still", on);
  }

  // ============================================================
  // OPENING ONE
  // ============================================================
  /** The notes windows standing for the fragrance that is open. */
  let windows = [];
  function notesOff() {
    windows.forEach((w) => w.remove());
    windows = [];
  }

  function show(no, row) {
    if (busy) return;
    busy = true;
    hold(true);
    const named = row.querySelector(".index-what");
    const house = row.querySelector("td:nth-child(3)");
    reader.querySelector(".frag-no").textContent = no;
    reader.querySelector(".frag-house").textContent = house ? house.textContent.trim() : "";
    reader.querySelector(".frag-name").textContent = named ? named.textContent.trim() : "";

    // The picture and the writing, out of the page they live in.
    const text = reader.querySelector(".frag-text");
    text.innerHTML = '<p class="frag-waiting">Fetching the writing…</p>';
    plate.querySelectorAll("img, .frag-plate-more").forEach((el) => el.remove());

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

      // EVERY PICTURE THE PART HAS, not only the first. Haxan carries
      // three, and the owner's own description of the way back already
      // allowed for it: "If there is more than one picture, then they
      // all become squares and then move backwards into the grid." The
      // first stands full width; the rest stand in a row under it, the
      // way they do on the page they came from.
      const shots = [...part.querySelectorAll(".human-plate img")]
        .filter((shot) => shot.getAttribute("src"));
      let more = null;
      shots.forEach((shot, n) => {
        const img = document.createElement("img");
        // The fetched page's paths are relative to its own folder, and
        // this page stands in categories/ — the same depth, so they
        // resolve the same way. Taken off the attribute rather than off
        // `.src`, which the parser has already made absolute against
        // THIS page's address and would have been right by luck.
        img.src = shot.getAttribute("src");
        img.alt = shot.getAttribute("alt") || "";
        // A PICTURE THAT IS NOT THERE YET LEAVES THE HATCHING SHOWING,
        // which is what house.js does on every other page.
        img.addEventListener("error", () => img.remove());
        if (n === 0) { plate.insertBefore(img, plate.children[1] || null); return; }
        if (!more) {
          more = document.createElement("span");
          more.className = "frag-plate-more";
          plate.appendChild(more);
        }
        more.appendChild(img);
      });
    }).catch(() => {
      text.innerHTML = '<p class="frag-waiting">The writing could not be fetched. ' +
        'It is on <a href="' + WHERE + '#part-' + no + '">its own page</a>.</p>';
    });

    // THE NOTES, BEHIND A BUTTON — the same VIEW NOTES and the same
    // window every house page has, by the same script. They used to be
    // printed out in full under the writing; the owner asked for them
    // to be "also click to open", like everywhere else on the site.
    notesOff();
    const notes = reader.querySelector(".frag-notes");
    const all = window.FRAGRANCE_NOTES || {};
    const panel = window.NOTE_PANEL;
    if (panel && panel.button) {
      const entry = all["individual:" + no];
      const id = "frag-notes-" + no;
      const name = named ? named.textContent.trim() : "";
      if (entry && entry.landscape) {
        windows.push(panel.button({
          text: notes, id: id + "-landscape", extra: "note-open-landscape",
          calls: "Olfactory landscape", titled: "Landscape", name: name,
          body: panel.landscape(entry.landscape, id + "-landscape"),
        }));
      }
      windows.push(panel.button({
        text: notes, id: id, calls: "View notes", titled: "Notes", name: name,
        body: panel.html(entry, id),
      }));
    }

    left = {
      y: window.scrollY || window.pageYOffset || 0,
      list: scroller ? scroller.scrollTop : 0,
    };
    const cell = cellSize();
    shift = left.y % cell;
    reader.style.backgroundPosition = shift ? "0 " + (-shift) + "px" : "";

    rule();
    reader.hidden = false;
    reader.classList.remove("is-leaving");
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
      hold(false);
    }, REDUCE_MOTION ? 0 : BLANK_MS);
  }

  /** The list, back exactly where it was left. */
  function restore() {
    page.hidden = false;
    window.scrollTo(0, left.y);
    if (scroller) scroller.scrollTop = left.list;
  }

  // ============================================================
  // THE WAY BACK
  // ============================================================

  /** ONE PICTURE, SENT HOME IN A STRAIGHT LINE.

      The flier is the picture's own box, and it travels by TRANSFORM
      alone — a move and a scale — so the browser can run it apart from
      the page, and nothing the page is doing at the same moment can
      make it stutter.

      ITS MIDDLE MOVES ALONG ONE LINE because its place and its size are
      read off one progress: at every moment it has gone the same share
      of the way AND shrunk the same share of the way. It used to shrink
      on a shorter clock than it travelled, which is what swung it off
      the line — "turning", in the owner's word.

      SQUARING UP without squashing the photograph: the box is scaled
      unevenly into a square, and the picture inside it is scaled back
      the other way, so it is only ever cropped — the long side is cut
      down to the short one, from both ends — and never stretched. */
  function send(flier, face, from, home) {
    const W = from.width, H = from.height, S = home.width;
    const dx = (home.left + S / 2) - (from.left + W / 2);
    const dy = (home.top + S / 2) - (from.top + H / 2);
    const ax = S / W, ay = S / H, u = S / Math.min(W, H);

    const outside = [];
    const within = [];
    for (let i = 0; i <= STEPS; i++) {
      const p = i / STEPS;
      const sx = 1 + (ax - 1) * p;
      const sy = 1 + (ay - 1) * p;
      const su = 1 + (u - 1) * p;
      outside.push({
        offset: p,
        transform: "translate(" + (dx * p).toFixed(2) + "px," + (dy * p).toFixed(2) + "px) " +
          "scale(" + sx.toFixed(5) + "," + sy.toFixed(5) + ")",
      });
      within.push({
        offset: p,
        transform: "scale(" + (su / sx).toFixed(5) + "," + (su / sy).toFixed(5) + ")",
      });
    }
    const timing = { duration: TRAVEL_MS, easing: EASE, fill: "forwards" };
    const going = flier.animate(outside, timing);
    face.animate(within, timing);
    return going.finished.then(() => {
      // AT REST IT IS SIMPLY A SQUARE IN A SQUARE: the moving parts are
      // taken off and the box is set to exactly the cell. It looks the
      // same — the photograph cropped to its middle — and it sits on
      // whole pixels rather than on wherever the arithmetic came to.
      flier.style.left = home.left + "px";
      flier.style.top = home.top + "px";
      flier.style.width = S + "px";
      flier.style.height = S + "px";
      flier.getAnimations().forEach((a) => a.cancel());
      face.getAnimations().forEach((a) => a.cancel());
    });
  }

  function hide() {
    if (busy || !open) return;
    busy = true;
    hold(true);
    // A notes window left up would stand over the way back.
    windows.forEach((w) => w.close(true));

    const done = () => {
      reader.hidden = true;
      reader.classList.remove("is-here", "is-clearing", "is-leaving");
      reader.style.backgroundPosition = "";
      inside.style.opacity = "";
      notesOff();
      document.querySelectorAll(".frag-flier").forEach((f) => f.remove());
      open = false;
      busy = false;
      document.body.classList.remove("frag-open");
      hold(false);
      const first = page.querySelector(".index-search-field");
      if (first) first.focus({ preventScroll: true });
    };

    if (REDUCE_MOTION) { restore(); done(); return; }

    // 1 — THE PICTURES COME OUT OF THE LAYOUT FIRST, measured where
    // they actually stand, so nothing moves when the writing goes.
    const shots = [...reader.querySelectorAll(".frag-plate img, .frag-plate > div")]
      .filter((el) => el.offsetWidth > 4 && el.offsetHeight > 4);
    const flying = shots.map((el) => {
      const box = el.getBoundingClientRect();
      const flier = document.createElement("div");
      flier.className = "frag-flier";
      flier.style.left = box.left + "px";
      flier.style.top = box.top + "px";
      flier.style.width = box.width + "px";
      flier.style.height = box.height + "px";
      let face;
      if (el.tagName === "IMG") {
        face = document.createElement("img");
        // The very picture that is on the screen, already decoded — not
        // the original it was copied from. A 5152 × 7728 photograph
        // being opened half way through the movement is what used to
        // stop it dead for most of a second.
        face.src = el.currentSrc || el.src;
        face.alt = "";
      } else {
        face = document.createElement("span");
        face.className = "frag-flier-blank";
      }
      face.classList.add("frag-flier-face");
      flier.appendChild(face);
      document.body.appendChild(flier);
      return { flier, face, box };
    });

    // 2 — THE WRITING GOES, and the pictures stay where they were.
    reader.classList.add("is-clearing", "is-leaving");

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
      // THE LIST IS ALREADY BACK BEHIND THEM, which is the owner's
      // "does not replay the animation": there is nothing to run
      // again, because the page they are receding onto is the page
      // they came from. It comes back under a reader that is still
      // standing, exactly where it was left.
      restore();
      reader.classList.remove("is-here");

      // 3 — THEY SQUARE UP AND RECEDE, in one movement each.
      const landed = flying.map((one, n) => {
        const home = cells[free[n % Math.max(1, cells.length)]];
        return home ? send(one.flier, one.face, one.box, home) : Promise.resolve();
      });

      Promise.all(landed).then(() => {
        window.setTimeout(() => {
          // 4 — AND THEY GO AT ONCE, on one clock rather than each on
          // its own.
          const fading = flying.map((one) => one.flier.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: GONE_MS, easing: "ease-in-out", fill: "forwards" }).finished);
          Promise.all(fading).then(done, done);
        }, REST_MS);
      }, done);
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

  // Whether a notes window was up when the key went down, read in the
  // capturing phase — before notes.js has had the chance to shut it.
  let notesUp = false;
  document.addEventListener("keydown", () => {
    notesUp = !!document.querySelector(".note-panel:not([hidden])");
  }, true);
  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key !== "Escape" && event.key !== "Esc") return;
    // Escape shuts a notes window first; only with none up does it take
    // you back to the list.
    if (notesUp) return;
    hide();
  });

  // Leaving the Fragrances view by its own button closes whatever is
  // open — the two views are one page and the reader belongs to one of
  // them.
  document.addEventListener("click", (event) => {
    if (!open) return;
    if (event.target.closest(".sheet-filter")) {
      page.hidden = false;
      reader.hidden = true;
      reader.classList.remove("is-here", "is-clearing", "is-leaving");
      reader.style.backgroundPosition = "";
      document.querySelectorAll(".frag-flier").forEach((f) => f.remove());
      notesOff();
      document.body.classList.remove("frag-open");
      open = false;
      busy = false;
      hold(false);
    }
  }, true);
})();
