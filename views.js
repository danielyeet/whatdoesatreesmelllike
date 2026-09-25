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
// AND NOW A THIRD, WHICH REPLACES BOTH WHILE THE FRAGRANCES ARE DRAWN BY
// fragrance-line.js.
// The owner, 2026-09-25: "the line from houses will have a pixel stretch
// effect to the right side of the page, while everything else fades
// (except the particles). and then the page will scroll (so that the
// left side of the fragrances page has the same pixel stretch effect
// until the middle of the screen), which will then unstretch in the
// middle to form the new center line ... and then the rest of the page
// should load in to completion. It should be minimal and geometric."
//
//   THE STRETCH (`stretch`), every time, both ways, once the Fragrances
//   view is fragrance-line.js's (it puts `.frag-stage` in it):
//   1  STRETCH  everything on the Houses view but its particles fades,
//               and its axis is smeared out to the right as a pixel
//               column is when it is stretched — a streak for every row
//               of it, each its own length and weight, reaching across
//               the window and on past its edge;
//   2  TRAVEL   the page travels a whole window to the left, the
//               houses going off one edge and the (still empty)
//               fragrances coming in from the other, so the streaks now
//               run from the left edge to the middle of the window;
//   3  GATHER   there, they unstretch: the streaks come in, in order,
//               to the RULES of the table — the rule under its sort bar
//               and the line under every row in the window (a box's top
//               and foot, in the boxes and the cards), which the view
//               publishes as `data-rules` on its stage — and pull in to
//               the table's own width, so the stretched column of pixels
//               becomes the table's ruling. (Until the night of
//               2026-09-25 they became ONE LINE across the window, which
//               the Fragrances view then stood on; the owner had the line
//               taken out.)
//   4  ARRIVE   and what is written in the table comes in on its ruling
//               (`data-arrive="ruled"`).
//   Back to the Houses is the same run the other way: the ruling spreads
//   into its streaks, the page travels right, and the streaks draw back
//   into the axis before the houses come in on it.
//   The fade and the swipe above are what the page still does whenever
//   the Fragrances view is the old table (fragrance-line.js blocked).
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
  // THE STRETCH's four beats.
  const STRETCH_OUT_MS = 640;
  const STRETCH_TRAVEL_MS = 780;
  const STRETCH_GATHER_MS = 640;
  const STRETCH_HAND_MS = 280;

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

  /** THE STRETCH — see the note at the head of this file. `way` is 1
      going on to the Fragrances and -1 coming back to the Houses. The
      streaks are drawn on a canvas of their own over both views; the
      views themselves are pinned to the window for the length of it, as
      the swipe pins them, and travel by transform. */
  function stretch(going, coming, name, way) {
    const W = window.innerWidth, H = window.innerHeight;
    const y = window.scrollY || window.pageYOffset || 0;
    const at = box.getBoundingClientRect();
    const boxTop = Math.round(at.top + y);
    const sheet = document.getElementById("sheet");
    const table = document.querySelector(".frag-stage");
    const sheetBox = sheet ? sheet.getBoundingClientRect() : null;
    const axisX = sheetBox && sheetBox.width ? sheetBox.left + sheetBox.width / 2 : W / 2;
    // WHERE THE TABLE'S RULES STAND, read the first time the streaks
    // gather — going on, the view is only just on the page by then, and
    // it measures itself as it arrives.
    let ruling = null;
    const rules = () => {
      if (ruling) return ruling;
      const ys = table && table.dataset.rules
        ? table.dataset.rules.split(",").map(Number).filter((n) => isFinite(n) && n >= 0 && n <= H)
        : [];
      const l = table && table.dataset.ruleL ? +table.dataset.ruleL : 0;
      const r = table && table.dataset.ruleR ? +table.dataset.ruleR : W;
      ruling = { ys: ys.length ? ys : [Math.round(H * 0.53)], l: Math.max(0, l), r: Math.min(W, r > l ? r : W) };
      return ruling;
    };
    const INK = getComputedStyle(document.body).getPropertyValue("--ink-rgb").trim() || "23, 23, 15";
    const houses = way > 0 ? going : coming;
    const fragrances = way > 0 ? coming : going;

    // THE STREAKS, one for every few pixels down the axis: each with its
    // own weight (mostly the axis's faint light, now and then one of its
    // darker specks) and its own reach, a few falling well short, which
    // is what makes it read as a stretched column of pixels rather than
    // as a ruled field.
    let seed = 9091;
    const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const rows = [];
    for (let ry = 0; ry < H; ry += 3) {
      const dark = random() < 0.16;
      rows.push({
        y: ry + random() * 2, th: random() < 0.5 ? 2 : 3,
        a: dark ? 0.45 + random() * 0.35 : 0.07 + random() * 0.2,
        f: random() < 0.12 ? 0.35 + random() * 0.45 : 0.86 + random() * 0.14,
      });
    }
    const canvas = document.createElement("canvas");
    canvas.className = "view-stretch";
    canvas.setAttribute("aria-hidden", "true");
    const ratio = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    document.body.appendChild(canvas);
    // SIZED BY ITS OWN BOX, not by the window: the page keeps a gutter for
    // its scrollbar (`scrollbar-gutter: stable`), so a canvas fixed to the
    // window is that much narrower than `innerWidth`, and drawn at the
    // window's width it was squeezed by a hair — which did not show while
    // the streaks became a line across the whole window, and did once they
    // had to land on the table's own rules.
    const wide = Math.round(canvas.getBoundingClientRect().width) || W;
    canvas.width = Math.round(wide * ratio);
    canvas.height = Math.round(H * ratio);
    const g = canvas.getContext("2d");
    const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

    /** A streak from x1 to x2 at height ry, fading along its length the
        way a smear does. */
    function streak(x1, x2, ry, th, a) {
      if (x2 < x1) [x1, x2] = [x2, x1];
      const from = Math.max(-2, x1), to = Math.min(W + 2, x2);
      if (to <= from || a < 0.004) return;
      const grad = g.createLinearGradient(x1, 0, x2, 0);
      grad.addColorStop(0, "rgba(" + INK + "," + a.toFixed(3) + ")");
      grad.addColorStop(1, "rgba(" + INK + "," + (a * 0.35).toFixed(3) + ")");
      g.fillStyle = grad;
      g.fillRect(from, ry - th / 2, to - from, th);
    }
    /** The table's ruling, coming up as the streaks become it: a
        hairline at every rule, the table's own width. */
    function newRules(a) {
      if (a <= 0) return;
      const R = rules();
      g.fillStyle = "rgba(" + INK + "," + (0.42 * a).toFixed(3) + ")";
      R.ys.forEach((ry) => g.fillRect(R.l, ry - 0.5, R.r - R.l, 1));
    }

    // Where each streak stands, in the Houses view's own coordinates,
    // at a point `p` of the whole run (0 the axis, 1 the ruling):
    //   stretched  from the axis out to its reach, a window along
    //   gathered   at the height of its rule, across the table's width —
    //              the streaks taken in order, so the top of the column
    //              becomes the top rule and its foot the last
    function frameAt(stage, k, shift) {
      g.setTransform(ratio, 0, 0, ratio, 0, 0);
      g.clearRect(0, 0, W, H);
      const R = stage === "gather" ? rules() : null;
      rows.forEach((r, i) => {
        const reach = axisX + r.f * W;          // how far the stretched streak runs
        let x1 = axisX, x2 = axisX, ry = r.y, th = r.th, a = r.a;
        if (stage === "out") { x2 = axisX + (reach - axisX) * k; }
        else if (stage === "travel") { x2 = reach; }
        else if (stage === "gather") {
          const to = R.ys[Math.min(R.ys.length - 1, Math.floor(i * R.ys.length / rows.length))];
          x1 = axisX + (R.l - shift - axisX) * k;
          x2 = reach + (R.r - shift - reach) * k;
          ry = r.y + (to - r.y) * k;
          th = r.th + (1 - r.th) * k;
          a = r.a * (1 - k * 0.85);
        }
        streak(x1 + shift, x2 + shift, ry, th, a);
      });
      if (stage === "gather") newRules(k);
    }

    // PINNED, as the swipe pins them. A view holding the table is pinned
    // to the window's own top, since its stage is fixed to the window and
    // a transform makes the view that stage's frame for the length of it.
    box.style.height = Math.round(at.height) + "px";
    box.classList.add("stretching");
    document.documentElement.classList.add("view-swiping");
    const pin = (view, x) => {
      view.classList.add("sliding");
      view.style.top = (view.classList.contains("table-on") ? 0 : boxTop - y) + "px";
      if (view.classList.contains("table-on")) view.style.height = H + "px";
      view.style.transform = "translateX(" + x + "px)";
    };
    pin(going, 0);
    going.classList.add("stretch-hide");
    if (way < 0) { coming.classList.add("stretch-hide"); }
    else { coming.dataset.arrive = "wait"; }

    const t0 = performance.now();
    const A = STRETCH_OUT_MS, B = STRETCH_TRAVEL_MS, C = STRETCH_GATHER_MS, D = STRETCH_HAND_MS;
    let shownComing = false;
    const step = (now) => {
      const t = now - t0;
      if (way > 0) {
        // ON TO THE FRAGRANCES.
        if (t < A) frameAt("out", smooth(t / A), 0);
        else if (t < A + B) {
          if (!shownComing) {
            shownComing = true;
            document.body.classList.toggle("view-fragrances", name === "fragrances");
            coming.hidden = false;
            pin(coming, W);
          }
          const u = smooth((t - A) / B);
          going.style.transform = "translateX(" + (-W * u).toFixed(1) + "px)";
          coming.style.transform = "translateX(" + (W * (1 - u)).toFixed(1) + "px)";
          frameAt("travel", 1, -W * u);
        } else if (t < A + B + C) {
          coming.style.transform = "translateX(0px)";
          going.style.transform = "translateX(" + (-W) + "px)";
          frameAt("gather", smooth((t - A - B) / C), -W);
        } else if (t < A + B + C + D) {
          if (coming.dataset.arrive === "wait") coming.dataset.arrive = "ruled";
          frameAt("gather", 1, -W);
          canvas.style.opacity = String(1 - (t - A - B - C) / D);
        } else { finish(); return; }
      } else {
        // BACK TO THE HOUSES: the same run backwards, the page travelling
        // the other way, and the streaks drawing back into the axis.
        const back = A + B + C;
        if (t < C) {
          frameAt("gather", 1 - smooth(t / C), -W);
        } else if (t < C + B) {
          if (!shownComing) {
            shownComing = true;
            document.body.classList.toggle("view-fragrances", name === "fragrances");
            coming.hidden = false;
            pin(coming, -W);
          }
          const u = smooth((t - C) / B);
          going.style.transform = "translateX(" + (W * u).toFixed(1) + "px)";
          coming.style.transform = "translateX(" + (-W * (1 - u)).toFixed(1) + "px)";
          frameAt("travel", 1, -W * (1 - u));
        } else if (t < back) {
          coming.style.transform = "translateX(0px)";
          going.style.transform = "translateX(" + W + "px)";
          frameAt("out", 1 - smooth((t - C - B) / A), 0);
        } else if (t < back + D) {
          if (houses.classList.contains("stretch-hide")) {
            houses.classList.remove("stretch-hide");
            houses.classList.add("stretch-in");
          }
          g.clearRect(0, 0, W, H);
        } else { finish(); return; }
      }
      requestAnimationFrame(step);
    };
    function finish() {
      window.scrollTo(0, 0);
      [going, coming].forEach((view) => {
        view.classList.remove("sliding", "stretch-hide");
        view.style.transform = "";
        view.style.top = "";
        view.style.height = "";
      });
      going.hidden = true;
      if (fragrances.dataset.arrive === "wait") fragrances.dataset.arrive = "ruled";
      box.classList.remove("stretching");
      box.style.height = "";
      document.documentElement.classList.remove("view-swiping");
      canvas.remove();
      window.setTimeout(() => houses.classList.remove("stretch-in"), 760);
      moving = false;
      drain();
    }
    requestAnimationFrame(step);
  }

  function show(name) {
    // A PRESS THAT LANDS MID-TRAVEL IS REMEMBERED, NOT DROPPED — the
    // same rule the two houses follow for opening a part. This used to
    // return and do nothing, so pressing the other button while a swipe
    // was running swallowed it. Only the latest is kept: pressing three
    // buttons during one swipe goes to the last one asked for, not
    // through all of them.
    if (moving) {
      wanted = name === showing ? null : name;
      return;
    }
    if (name === showing) return;
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
    // THE STRETCH, whenever the Fragrances are fragrance-line.js's.
    if (box && !REDUCE_MOTION && document.querySelector(".view.table-on .frag-stage")) {
      stretch(going, coming, name, order.indexOf(name) > order.indexOf(was) ? 1 : -1);
      return;
    }
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
          drain();
        });
      });
    }, FADE_MS);
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.view === showing));
    button.addEventListener("click", () => show(button.dataset.view));
  });
})();
