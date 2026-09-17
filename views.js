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

  // The order the views stand in, which is the order of the buttons: it
  // is what decides which way the page travels. Going to a view further
  // along sends the page left, and coming back sends it right.
  const order = buttons.map((b) => b.dataset.view);
  /** Which views have been opened. The swipe waits for both. */
  const opened = new Set();

  const viewOf = (name) => views.find((view) => view.dataset.view === name);
  let showing = buttons.find((b) => b.classList.contains("is-on"));
  showing = showing ? showing.dataset.view : views[0].dataset.view;
  let moving = false;

  views.forEach((view) => {
    if (view.dataset.view !== showing) view.hidden = true;
  });
  opened.add(showing);
  document.body.classList.toggle("view-fragrances", showing === "fragrances");

  /** THE SWIPE. Both views are stood on top of one another for the
      length of it, so the box has to be held at the height it already
      has — let go of, it would collapse to nothing the moment they are
      taken out of the flow, and the page would jump under the pointer.

      Which way round the two are placed is the whole of the effect: the
      one being left goes off towards `-way`, and the one arriving is put
      that far out on the other side and brought in to nothing. */
  function swipe(going, coming, name, way) {
    const held = box.getBoundingClientRect().height;
    box.style.height = held + "px";
    box.classList.add("swiping");

    document.body.classList.toggle("view-fragrances", name === "fragrances");
    coming.hidden = false;
    going.classList.add("sliding");
    coming.classList.add("sliding");
    coming.style.transform = "translateX(" + (way * 100) + "%)";

    // A frame for the browser to take both of those as where they are
    // starting from. Without it the transition has nothing to travel
    // from and both simply appear in their finished places.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        going.classList.add("travelling");
        coming.classList.add("travelling");
        going.style.transform = "translateX(" + (-way * 100) + "%)";
        going.style.opacity = "0";
        coming.style.transform = "translateX(0)";

        setTimeout(() => {
          [going, coming].forEach((view) => {
            view.classList.remove("sliding", "travelling");
            view.style.transform = "";
            view.style.opacity = "";
          });
          going.hidden = true;
          box.classList.remove("swiping");
          box.style.height = "";
          moving = false;
        }, SWIPE_MS);
      });
    });
  }

  function show(name) {
    if (moving || name === showing) return;
    const going = viewOf(showing);
    const coming = viewOf(name);
    if (!going || !coming) return;
    moving = true;
    const was = showing;
    showing = name;

    buttons.forEach((b) => b.classList.toggle("is-on", b.dataset.view === name));
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));

    // BOTH OPENED AT LEAST ONCE, AND ONLY THEN. `was` is on the page, so
    // it has been opened by definition; the question is only whether the
    // one being gone to ever has been.
    const swiping = opened.has(name) && box && SWIPE_MS > 0;
    opened.add(was);
    opened.add(name);
    if (swiping) {
      const way = order.indexOf(name) > order.indexOf(was) ? 1 : -1;
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
        });
      });
    }, FADE_MS);
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.view === showing));
    button.addEventListener("click", () => show(button.dataset.view));
  });
})();
