// ============================================================
// FAVORITES — the other half of a contact sheet page
//
// The page carries two ways of looking at one category, and the two
// buttons above the middle window switch between them:
//
//   Description portfolio   the map, drawn by contact-sheet.js
//   Favorites               this: one big square, a ring of pictures
//                           under it that can be dragged round, and a
//                           description underneath
//
// Switching fades the one you are leaving away before the other
// arrives. Coming into Favorites the big square flicks through every
// picture the way the sheet does — the same accelerating-hold run,
// ending on the first rather than cutting to it — and then the rest
// take their places in the ring.
//
// Picking one fades it into the big square. Fades, not the hard cuts
// the flick is made of: a cut is the film going past, a fade is you
// choosing something, and they should not look the same.
//
// The pictures are the <button class="gallery-frame"> blocks in the
// page. This file never touches the map's own elements, and the map
// never touches these — the only thing they share is a class on
// <body>, which style.css reads to fade one out and the other in.
// ============================================================
(function () {
  const gallery = document.getElementById("gallery");
  const ring = document.getElementById("gallery-ring");
  const plate = document.getElementById("gallery-plate");
  if (!gallery || !ring || !plate) return; // not a page with favorites on it

  const frames = Array.from(ring.querySelectorAll(".gallery-frame"));
  if (!frames.length) return;

  const chosenName = document.getElementById("gallery-chosen-name");
  const buttons = Array.from(document.querySelectorAll(".sheet-filter"));
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  // The flick, on the same footing as the contact sheet's — see the
  // note there for why it is set up to END on the first picture.
  const FLIP_FIRST_MS = 42;
  const FLIP_SLOW = 1.14;
  const FLIP_LAST_MS = 430;

  const SWITCH_MS = 520;       // how long the view being left takes to go
  const RING_AFTER_MS = 260;   // pause between the flick landing and the ring arriving
  const RING_STAGGER_MS = 70;  // one picture into the ring after another

  const RING_WIDE = 0.36;      // how far across the page the ring reaches
  const RING_DEEP = 74;        // and how far up and down — a ring seen almost edge on
  const RING_SIZE = 0.105;     // a picture in the ring, as a share of the width
  const RING_SIZE_MIN = 78, RING_SIZE_MAX = 124;
  const RING_SIZE_TALL = 0.13; // and never more than this share of the window's height
  // The three cues that make a flat circle read as a ring lying away
  // from you: the ones at the back sit higher, are drawn smaller, and
  // are fainter. Weaken any of them and it goes back to being a row of
  // squares overlapping each other.
  const RING_BACK = 0.52;      // how small one at the back is drawn
  const RING_FADE = 0.24;      // and how faint
  const DRAG_TURN = 0.0052;    // how far the ring turns for a movement of the hand
  const SPIN_MAX = 0.075;      // the fastest it will turn however hard it is thrown
  const SPIN_DRAG = 0.94;      // how quickly a throw runs down
  const IDLE_SPIN = 0.0007;    // the drift it keeps when nothing is touching it
  const BOB = 3.5;             // how far a picture rises and falls where it floats
  const CLICK_SLOP = 6;        // movement past which a drag is not also a click

  // ============================================================
  // THE PICTURES
  // ============================================================
  // The same hatching every other placeholder on this site is drawn
  // with, one angle per picture so that flicking through them reads as
  // different pictures going past. The name in the corner is not part
  // of the placeholder: it stays once a real picture is in the frame.
  frames.forEach((frame, i) => {
    frame.style.setProperty("--hatch-angle", (-55 + ((i * 41) % 130)) + "deg");
    frame.style.setProperty("--hatch-gap", (9 + ((i * 7) % 10)) + "px");
  });

  // What a picture is called. Placeholder names for placeholder
  // pictures; the real one will be whatever each piece is called, and
  // would be read off the frame in the page rather than counted here.
  const titleOf = (index) => "Placeholder " + (index + 1);

  const nameOf = (frame) => {
    const mark = frame.querySelector(".sheet-number");
    return mark ? mark.textContent.trim() : "";
  };

  // ============================================================
  // THE BIG SQUARE
  //
  // Two layers, one on top of the other. Showing a picture paints it
  // onto whichever layer is underneath and then fades that one up, so
  // one picture becomes another rather than replacing it. The flick
  // asks for cuts instead, and gets them by turning the fade off.
  // ============================================================
  const layers = [document.createElement("div"), document.createElement("div")];
  layers.forEach((layer) => {
    layer.className = "gallery-layer";
    plate.appendChild(layer);
  });
  const plateName = document.createElement("span");
  plateName.className = "sheet-number";
  plate.appendChild(plateName);
  // Pointing at the big square darkens its bottom corner and brings up
  // the name of whatever is showing in it.
  const hoverName = document.createElement("span");
  hoverName.className = "gallery-hover-name";
  plate.appendChild(hoverName);
  let front = 0;
  let showingIndex = -1;

  function paint(layer, index) {
    const frame = frames[index];
    layer.style.setProperty("--hatch-angle", frame.style.getPropertyValue("--hatch-angle"));
    layer.style.setProperty("--hatch-gap", frame.style.getPropertyValue("--hatch-gap"));
    // A real picture, once there is one, is copied across rather than
    // re-pointed at: the frame in the ring keeps its own.
    layer.textContent = "";
    const picture = frame.querySelector("img");
    if (picture) layer.appendChild(picture.cloneNode());
    layer.classList.toggle("has-picture", !!picture);
  }

  function show(index, cut) {
    if (index === showingIndex && !cut) return;
    showingIndex = index;
    const back = 1 - front;
    paint(layers[back], index);
    layers[back].classList.toggle("no-fade", !!cut);
    layers[front].classList.toggle("no-fade", !!cut);
    layers[back].classList.add("shown");
    layers[front].classList.remove("shown");
    front = back;
    plateName.textContent = nameOf(frames[index]);
    hoverName.textContent = titleOf(index);
    if (chosenName) chosenName.textContent = nameOf(frames[index]);
    frames.forEach((frame, i) => frame.classList.toggle("chosen", i === index));
  }

  // ============================================================
  // THE RING
  //
  // The pictures stand on a circle lying almost flat, so the one at the
  // front is lowest and largest and the one at the back is highest,
  // smallest and faintest. Dragging turns the circle; letting go leaves
  // it turning and running down, the way the map on the landing page
  // behaves. Everything here is worked out from one angle.
  // ============================================================
  let turn = 0;           // where the ring has been turned to
  let spin = IDLE_SPIN;   // and how fast it is turning
  let dragging = false;
  let pointerOn = false;
  let dragFrom = 0, dragMoved = 0;
  let homing = false;   // turning itself to bring a chosen picture to the front
  let clock = 0;

  function placeRing() {
    const width = ring.clientWidth;
    if (!width) return;
    // Against the height as well as the width: the ring has to fit
    // under the big square on one screen, without scrolling.
    const size = Math.max(
      RING_SIZE_MIN,
      Math.min(RING_SIZE_MAX, width * RING_SIZE, window.innerHeight * RING_SIZE_TALL)
    );
    const wide = width * RING_WIDE;
    const middle = width / 2;
    const deep = Math.min(RING_DEEP, size * 0.55);
    ring.style.height = Math.round(size * 1.2 + deep * 2) + "px";
    const floor = deep + size * 0.1;

    frames.forEach((frame, i) => {
      const angle = turn + (i / frames.length) * Math.PI * 2;
      const front = (Math.cos(angle) + 1) / 2;          // 1 at the front, 0 at the back
      const scale = RING_BACK + front * (1 - RING_BACK);
      const bob = REDUCE_MOTION ? 0 : Math.sin(clock * 0.9 + i * 1.7) * BOB;
      const x = middle + Math.sin(angle) * wide - size / 2;
      const y = floor + Math.cos(angle) * deep + bob;
      frame.style.width = size + "px";
      frame.style.height = size + "px";
      frame.style.transform =
        "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
      frame.style.opacity = (RING_FADE + front * (1 - RING_FADE)).toFixed(3);
      frame.style.zIndex = String(Math.round(front * 100));
    });
  }

  let turning = 0;
  function turnRing(now) {
    turning = requestAnimationFrame(turnRing);
    const step = Math.min(3, (now - (turnRing.last || now)) / 16.7) || 1;
    turnRing.last = now;
    clock += step / 60;

    if (!dragging && !homing) {
      // Left turning after a throw, running down to the drift it keeps
      // when nothing is touching it. Holding still under the pointer is
      // the same courtesy the map on the landing page shows.
      const idle = pointerOn || REDUCE_MOTION ? 0 : IDLE_SPIN;
      spin = idle + (spin - idle) * Math.pow(SPIN_DRAG, step);
      turn += spin * step;
    }
    placeRing();
  }

  ring.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragMoved = 0;
    dragFrom = e.clientX;
    ring.classList.add("grabbing");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragFrom;
    dragFrom = e.clientX;
    dragMoved += Math.abs(dx);
    spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, dx * DRAG_TURN));
    turn += spin;
  });
  function endDrag() {
    dragging = false;
    ring.classList.remove("grabbing");
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  ring.addEventListener("pointerenter", () => { pointerOn = true; });
  ring.addEventListener("pointerleave", () => { pointerOn = false; });

  frames.forEach((frame, i) => {
    frame.addEventListener("click", (e) => {
      // A drag that ends on a picture is still a drag.
      if (e.detail !== 0 && dragMoved > CLICK_SLOP) return;
      show(i);
      bringToFront(i);
    });
  });

  /** Turn the ring the short way round until this picture is at the front. */
  function bringToFront(index) {
    const want = -(index / frames.length) * Math.PI * 2;
    const full = Math.PI * 2;
    let delta = (want - turn) % full;
    if (delta > Math.PI) delta -= full;
    if (delta < -Math.PI) delta += full;
    const from = turn, started = performance.now(), span = 520;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - started) / span);
      turn = from + delta * ease(t);
      if (t < 1 && !dragging) requestAnimationFrame(step);
      else homing = false;   // the drift takes it from here
    };
    if (REDUCE_MOTION) { turn = want; return; }
    spin = 0;
    homing = true;
    requestAnimationFrame(step);
  }

  // ============================================================
  // ARRIVING AND LEAVING
  // ============================================================
  function flick(onDone) {
    // The same arithmetic the contact sheet's flick uses: count the
    // cuts first, then start at whichever picture makes the last one
    // land on the first. It has to stop, not cut one last time.
    let steps = 0;
    for (let held = FLIP_FIRST_MS; held <= FLIP_LAST_MS; held *= FLIP_SLOW) steps++;
    let index = ((-steps % frames.length) + frames.length) % frames.length;
    let hold = FLIP_FIRST_MS;
    show(index, true);

    const step = () => {
      index = (index + 1) % frames.length;
      show(index, true);
      hold *= FLIP_SLOW;
      if (hold > FLIP_LAST_MS) { setTimeout(onDone, Math.round(hold)); return; }
      setTimeout(step, Math.round(hold));
    };
    setTimeout(step, Math.round(hold));
  }

  let arrived = false;
  function arrive() {
    if (arrived) return;
    arrived = true;
    placeRing();
    turning = requestAnimationFrame(turnRing);

    const land = () => {
      gallery.classList.add("landed");
      frames.forEach((frame, i) => {
        setTimeout(
          () => frame.classList.add("in-ring"),
          REDUCE_MOTION ? 0 : RING_AFTER_MS + i * RING_STAGGER_MS
        );
      });
    };

    // It lands on the first picture, so the ring starts with that one
    // at the front rather than wherever the circle happened to begin.
    turn = 0;
    if (REDUCE_MOTION) { show(0, true); land(); return; }
    flick(land);
  }

  function choose(view) {
    const wanted = view === "favorites";
    if (document.body.classList.contains("view-favorites") === wanted) return;
    buttons.forEach((button) => {
      button.classList.toggle("chosen", button.dataset.view === view);
    });

    const swap = () => {
      document.body.classList.toggle("view-favorites", wanted);
      if (wanted) arrive();
      // Two frames after the swap: the view arriving has only just been
      // given a size, and something with no size yet has nothing to
      // fade up from.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove("view-switching");
      }));
    };

    // The one being left has to be gone before the other arrives, or
    // for half a second the page is showing two different things.
    document.body.classList.add("view-switching");
    if (REDUCE_MOTION) swap();
    else setTimeout(swap, SWITCH_MS);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.view || "sheet"));
  });

  window.addEventListener("resize", placeRing);
  placeRing();
})();
