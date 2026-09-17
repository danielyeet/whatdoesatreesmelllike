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
// ONLY ONE OF THEM IS EVER ON THE PAGE. The one being left fades away
// FIRST, and the other arrives after it has gone: two things fading
// through each other in the same place is the one thing this switch
// must not look like. The leaving view is then taken off the page
// altogether (`hidden`), so nothing behind is still tabbable.
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

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // As long as the fade written on `.view` in the stylesheet. Longer
  // here than there and the page stands empty for a moment; shorter
  // and the two views are both on it.
  const FADE_MS = REDUCE_MOTION ? 0 : 340;

  const viewOf = (name) => views.find((view) => view.dataset.view === name);
  let showing = buttons.find((b) => b.classList.contains("is-on"));
  showing = showing ? showing.dataset.view : views[0].dataset.view;
  let moving = false;

  views.forEach((view) => {
    if (view.dataset.view !== showing) view.hidden = true;
  });
  document.body.classList.toggle("view-fragrances", showing === "fragrances");

  function show(name) {
    if (moving || name === showing) return;
    const going = viewOf(showing);
    const coming = viewOf(name);
    if (!going || !coming) return;
    moving = true;
    showing = name;

    buttons.forEach((b) => b.classList.toggle("is-on", b.dataset.view === name));
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));

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
