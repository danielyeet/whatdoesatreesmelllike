// ============================================================
// THE TWO VIEWS — categories/scent-descriptions.html
//
// That category can be looked at two ways, and the two buttons across
// the top of the page are the whole of the switch:
//
//   HOUSES — the contact sheet: every house scattered over the page
//   and joined by dated lines. This is what the page opens on.
//
//   INDIVIDUAL FRAGRANCES — an index of every fragrance written up
//   anywhere on this site, with the house it belongs to and the date
//   it was written about, sortable and searchable.
//
// ONLY ONE OF THEM IS EVER ON THE PAGE (afterwards). The leaving view
// is taken off the page altogether (`hidden`), so nothing behind is
// still tabbable.
//
// THERE ARE TWO WAYS OF GETTING FROM ONE TO THE OTHER, and which one is
// used depends on whether you have been there before:
//
//   THE FADE   The first time a view is opened. The one being left
//              fades away FIRST and the other arrives after it has
//              gone — two things fading through each other in the same
//              place is the one thing that switch must not look like.
//   THE SWIPE  Once BOTH views have been opened at least once. The page
//              travels sideways: what you are leaving goes off one edge
//              while what you are going to comes in from the other, as
//              though the two stood side by side all along.
//
// The owner asked for it in that order — "AFTER BOTH OF THESE HAVE BEEN
// OPENED, only then is there an animation of swiping" — and it is worth
// keeping. A swipe says "these two things are side by side", which is
// only worth saying to somebody who knows what is on both sides; the
// first time, it would be a flourish over a page you have not seen.
//
// THE CHROME DOES NOT TRAVEL. The Menu, the category's name beside it,
// the two buttons and the search all live outside `.views`, so sliding
// what is inside it leaves every one of them exactly where it is. That
// is the whole of how the owner's "all elements apart from the top left"
// is done — by what is in the box, not by a list of exceptions.
//
// AND A THIRD, WHICH REPLACES BOTH WHILE THE FRAGRANCES ARE DRAWN BY
// fragrance-line.js (it puts `.frag-stage` in the view): THE CROSSING.
// The owner, the night of 2026-09-25: "change the transition too please,
// so that the pixel stretch is not used. I want something simple, so that
// you can freely change between the houses and fragrances page. Make the
// two pages connected somehow too."
//
//   SIMPLE      the view being left fades a little way off to one side as
//               the other fades in from the other, both at once, in
//               `CROSS_MS` — no beats, nothing held back.
//   FREE        a press while it is running is taken AT ONCE, not
//               remembered for later: the crossing simply turns round
//               from wherever it has got to, both views still pinned, so
//               you can go back and forth as fast as you like.
//   CONNECTED   by THE THREAD: one line, the height of the window, that
//               stands where the houses' axis stands and travels, as the
//               views cross, to where the Fragrances view's divider stands
//               between its aside and its table (and back). The axis
//               becomes the divider; the two pages are one line apart.
//               And each view carries a way to the other in itself — any
//               element with `data-view-go="houses"` or `"fragrances"` is
//               a button to that view.
//
// THE STRETCH that came before it (the axis smeared into pixel streaks,
// the page travelling a window, the streaks gathering into the table's
// rules) was taken out whole at the owner's word; nothing of it is left
// here or in the stylesheet.
//
// NEITHER VIEW KNOWS ABOUT THE OTHER. contact-sheet.js draws one and
// index-page.js runs the other; this file only shows and hides them,
// and never touches anything inside either.
//
// WITHOUT THIS SCRIPT both views are simply on the page, one under the
// other, and everything on them is reachable.
// ============================================================
(function () {
  const buttons = [...document.querySelectorAll(".sheet-filter")];
  const views = [...document.querySelectorAll(".view")];
  if (!buttons.length || !views.length) return;

  const box = document.querySelector(".views");

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // As long as the fade written on `.view` in the stylesheet. Longer
  // here than there and the page stands empty for a moment; shorter
  // and the two views are both on it.
  const FADE_MS = REDUCE_MOTION ? 0 : 340;
  // And as long as the swipe written there. With animation turned off
  // there is no travel at all — the views simply change over.
  const SWIPE_MS = REDUCE_MOTION ? 0 : 520;
  // THE CROSSING: how long, and how far each view travels as it fades.
  const CROSS_MS = 380;
  const CROSS_SHIFT = 26;

  // The order the views stand in, which is the order of the buttons: it
  // is what decides which way the page travels. Going to a view further
  // along sends the page left, and coming back sends it right.
  const order = buttons.map((b) => b.dataset.view);
  /** Which views have been opened. The swipe waits for both. */
  const opened = new Set();
  /** A view asked for while one was still arriving, to be gone to next. */
  let wanted = null;

  /** Do whatever was asked for while the last change was running. */
  function drain() {
    if (!wanted) return;
    const next = wanted;
    wanted = null;
    show(next);
  }

  const viewOf = (name) => views.find((view) => view.dataset.view === name);
  let showing = buttons.find((b) => b.classList.contains("is-on"));
  showing = showing ? showing.dataset.view : views[0].dataset.view;
  let moving = false;

  views.forEach((view) => {
    if (view.dataset.view !== showing) view.hidden = true;
  });
  opened.add(showing);
  document.body.classList.toggle("view-fragrances", showing === "fragrances");

  /** THE SWIPE. Both views travel across the window together, and the
      whole of the difficulty is that they must travel in the WINDOW's
      coordinates rather than the page's.

      WHY. The two views are wildly different heights — the sheet is
      several screens of scattered pictures, the index is exactly one —
      and the buttons that switch them are fixed, so a switch can happen
      from anywhere down the page. Taken out of the flow and left at the
      top of the box, as the first version did, the arriving view was
      anchored to the top of the DOCUMENT: switch while scrolled 700px
      down and it came in 700px above the window, so what slid in was its
      bottom edge and empty page. Then the document changed height as the
      views swapped, the browser clamped the scroll, and the page lurched.
      That was the owner's "things appear on the upper side of the page
      or blink".

      SO: the one being left is pinned exactly where it appears at this
      moment, so it does not move a pixel vertically as it goes; the one
      arriving is put at its own top, which is where the page will be
      scrolled to when this is over; and the box is held at its height
      throughout so the document never changes size mid-travel. The
      scroll is set to the top at the very end, while both are still
      pinned to the window and nothing on screen can move. */
  function swipe(going, coming, name, way) {
    const y = window.scrollY || window.pageYOffset || 0;
    const at = box.getBoundingClientRect();
    const boxTop = Math.round(at.top + y);

    box.style.height = Math.round(at.height) + "px";
    box.classList.add("swiping");
    // The views are pinned to the window, so the box's own overflow
    // cannot clip them: one of them a full width off to the side would
    // be a horizontal scrollbar for half a second. Clipped at the root
    // instead, and only while this is running.
    document.documentElement.classList.add("view-swiping");

    document.body.classList.toggle("view-fragrances", name === "fragrances");

    // `sliding` goes on BEFORE the view is shown, and that order matters:
    // index-page.js watches its own view for being un-hidden so it can
    // play the arrival it has when you switch to it normally, and reads
    // this class to know not to. The swipe is the arrival.
    going.classList.add("sliding");
    coming.classList.add("sliding");
    coming.hidden = false;

    going.style.top = (boxTop - y) + "px";
    coming.style.top = boxTop + "px";
    coming.style.transform = "translateX(" + (way * 100) + "%)";

    // A frame for the browser to take both of those as where they are
    // starting from. Without it the transition has nothing to travel
    // from and both simply appear in their finished places.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        going.classList.add("travelling");
        coming.classList.add("travelling");
        going.style.transform = "translateX(" + (-way * 100) + "%)";
        coming.style.transform = "translateX(0)";

        setTimeout(() => {
          // The page goes to the top before anything is put back, so the
          // view that has arrived is in the same place afterwards as it
          // was during the travel. Both are still pinned to the window
          // here, so nothing on screen moves when the scroll changes.
          window.scrollTo(0, 0);
          [going, coming].forEach((view) => {
            view.classList.remove("sliding", "travelling");
            view.style.transform = "";
            view.style.top = "";
          });
          going.hidden = true;
          box.classList.remove("swiping");
          box.style.height = "";
          document.documentElement.classList.remove("view-swiping");
          moving = false;
          drain();
        }, SWIPE_MS);
      });
    });
  }

  /** THE CROSSING — see the note at the head of this file. `way` is 1
      going on to the Fragrances and -1 coming back to the Houses. */
  let crossing = null;
  const thread = document.createElement("div");
  thread.className = "views-thread";
  thread.setAttribute("aria-hidden", "true");
  // IN THE BOX, NOT ON THE BODY: a child of the body falls under the
  // Menu's dimming rule (`body > *:not(...)`), whose 0.85s opacity
  // outranks the thread's own transitions — the trap the notes window
  // fell into. The box itself never moves, so the thread is still fixed
  // to the window.
  (box || document.body).appendChild(thread);
  /** Where the thread stands on each view: the houses' axis, and the
      divider the Fragrances view publishes on its stage. */
  function anchorOf(name) {
    if (name === "fragrances") {
      const stage = document.querySelector(".frag-stage");
      return stage && stage.dataset.divider ? +stage.dataset.divider : null;
    }
    const sheet = document.getElementById("sheet");
    const r = sheet ? sheet.getBoundingClientRect() : null;
    if (!r || !r.width) return window.innerWidth / 2;
    // WHERE THE AXIS STANDS AT REST, not where it is while its view is
    // still drifting in: read mid-crossing, the Houses view is still 26px
    // off to the side, and the line used to land that far from the axis
    // (the owner, 2026-09-25: "go completely where the center line is").
    const holder = sheet.closest(".view");
    const moved = holder ? getComputedStyle(holder).transform : "none";
    const off = moved && moved !== "none" ? new DOMMatrix(moved).m41 : 0;
    return r.left - off + r.width / 2;
  }
  function placeThread(x, shown, moving) {
    // SET DOWN, it is there at once, on the axis it stands over — it
    // used to fade up as it set off, so on a slow frame it was first seen
    // part way across rather than leaving from the axis.
    const at = shown && !moving;
    if (at) thread.style.transition = "none";
    thread.classList.toggle("moving", !!moving);
    if (x != null) thread.style.transform = "translateX(" + Math.round(x) + "px)";
    thread.style.opacity = shown ? "1" : "0";
    if (at) { void thread.offsetWidth; thread.style.transition = ""; }
  }

  function cross(going, coming, name, way) {
    if (!crossing) {
      // PINNED, as the swipe pins them: the one being left exactly where
      // it stands; the one arriving at its own top, where the page will be
      // scrolled to when this is over. A view holding the table is pinned
      // to the window's own top, its stage being fixed to the window.
      const y = window.scrollY || window.pageYOffset || 0;
      const at = box.getBoundingClientRect();
      const boxTop = Math.round(at.top + y);
      box.style.height = Math.round(at.height) + "px";
      box.classList.add("swiping");
      document.documentElement.classList.add("view-swiping");
      const pin = (view, top) => {
        view.classList.add("sliding");
        view.style.top = (view.classList.contains("table-on") ? 0 : top) + "px";
        if (view.classList.contains("table-on")) view.style.height = window.innerHeight + "px";
      };
      pin(going, boxTop - y);
      pin(coming, boxTop);
      coming.style.opacity = "0";
      coming.style.transform = "translateX(" + way * CROSS_SHIFT + "px)";
      // The thread starts where the view being left has it.
      placeThread(anchorOf(nameOf(going)), true, false);
      crossing = { from: going };
    } else {
      window.clearTimeout(crossing.timer);
    }
    document.body.classList.toggle("view-fragrances", name === "fragrances");
    // The table is there at once, whole — the crossing is its arrival.
    if (coming.classList.contains("table-on")) coming.dataset.arrive = "now";
    coming.hidden = false;
    void coming.offsetWidth;
    [going, coming].forEach((view) => view.classList.add("crossing"));
    coming.style.opacity = "1";
    coming.style.transform = "translateX(0)";
    going.style.opacity = "0";
    going.style.transform = "translateX(" + -way * CROSS_SHIFT + "px)";
    // THE THREAD travels to where the arriving view has it; where it has
    // none (a phone, whose table has no divider), it goes as it travels.
    requestAnimationFrame(() => {
      const to = anchorOf(name);
      placeThread(to == null ? (way > 0 ? 0 : window.innerWidth / 2) : to, to != null, true);
    });
    crossing.going = going;
    crossing.coming = coming;
    crossing.timer = window.setTimeout(() => {
      const done = crossing;
      crossing = null;
      window.scrollTo(0, 0);
      [done.going, done.coming].forEach((view) => {
        view.classList.remove("sliding", "crossing");
        view.style.transform = "";
        view.style.opacity = "";
        view.style.top = "";
        view.style.height = "";
      });
      done.going.hidden = true;
      box.classList.remove("swiping");
      box.style.height = "";
      document.documentElement.classList.remove("view-swiping");
      // On the Fragrances the thread stays, as the divider's own line
      // until the stage's is there; on the Houses the axis has it.
      placeThread(null, false, false);
    }, CROSS_MS + 30);
  }
  const nameOf = (view) => view.dataset.view;

  function show(name) {
    // A PRESS THAT LANDS MID-TRAVEL IS REMEMBERED, NOT DROPPED — the
    // same rule the two houses follow for opening a part. This used to
    // return and do nothing, so pressing the other button while a swipe
    // was running swallowed it. Only the latest is kept: pressing three
    // buttons during one swipe goes to the last one asked for, not
    // through all of them.
    // MID-CROSSING, A PRESS IS TAKEN AT ONCE: the crossing turns round
    // from wherever it has got to.
    if (crossing) {
      if (name === showing) return;
      const back = viewOf(name), from = viewOf(showing);
      const way = order.indexOf(name) > order.indexOf(showing) ? 1 : -1;
      showing = name;
      buttons.forEach((b) => b.classList.toggle("is-on", b.dataset.view === name));
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
      opened.add(name);
      cross(from, back, name, way);
      return;
    }
    if (moving) {
      wanted = name === showing ? null : name;
      return;
    }
    if (name === showing) return;
    const going = viewOf(showing);
    const coming = viewOf(name);
    if (!going || !coming) return;
    moving = true;
    const before = showing;
    showing = name;

    buttons.forEach((b) => b.classList.toggle("is-on", b.dataset.view === name));
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));

    // BOTH OPENED AT LEAST ONCE, AND ONLY THEN. `before` is on the page, so
    // it has been opened by definition; the question is only whether the
    // one being gone to ever has been.
    const swiping = opened.has(name) && box && SWIPE_MS > 0;
    opened.add(before);
    opened.add(name);
    // THE CROSSING, whenever the Fragrances are fragrance-line.js's.
    if (box && !REDUCE_MOTION && document.querySelector(".view.table-on .frag-stage")) {
      moving = false;
      cross(going, coming, name, order.indexOf(name) > order.indexOf(before) ? 1 : -1);
      return;
    }
    if (swiping) {
      const way = order.indexOf(name) > order.indexOf(before) ? 1 : -1;
      swipe(going, coming, name, way);
      return;
    }

    going.classList.add("leaving");
    setTimeout(() => {
      going.hidden = true;
      going.classList.remove("leaving");
      // The page's own class goes with the view that is arriving, so
      // anything the stylesheet hangs off it changes at the moment the
      // page is empty rather than while something is still fading.
      document.body.classList.toggle("view-fragrances", name === "fragrances");
      coming.hidden = false;
      coming.classList.add("leaving");
      // The frame after it has joined the page, so there is something
      // for the fade to travel from.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          coming.classList.remove("leaving");
          moving = false;
          drain();
        });
      });
    }, FADE_MS);
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.view === showing));
    button.addEventListener("click", () => show(button.dataset.view));
  });
  // A WAY TO THE OTHER VIEW from inside either one: anything carrying
  // `data-view-go` goes to the view it names.
  document.addEventListener("click", (event) => {
    const go = event.target.closest && event.target.closest("[data-view-go]");
    if (!go || !viewOf(go.dataset.viewGo)) return;
    event.preventDefault();
    show(go.dataset.viewGo);
  });
})();
