// ============================================================
// FAVORITES — the other half of a contact sheet page
//
// The page carries two ways of looking at one category, and the two
// buttons above the middle window switch between them:
//
//   Description portfolio   the map, drawn by contact-sheet.js
//   Favorites               this: one big square in the middle of the
//                           page with the rest of the pictures on a
//                           ring going round it in three dimensions
//
// Switching fades the one you are leaving away before the other
// arrives. Coming into Favorites the big square flicks through every
// picture the way the sheet does — the same accelerating-hold run,
// ending on the first rather than cutting to it — and then the rest
// take their places on the ring.
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
  const scene = document.getElementById("gallery-scene");
  const space = document.getElementById("gallery-space");
  const plate = document.getElementById("gallery-plate");
  if (!gallery || !scene || !space || !plate) return; // not a favorites page

  const frames = Array.from(space.querySelectorAll(".gallery-frame"));
  if (!frames.length) return;

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

  // The ring in space. Nothing here is in pixels across the page: the
  // ring is measured against the big square it goes round, so the whole
  // scene scales together.
  const RING_SIZE = 0.34;      // a picture on the ring, as a share of the square
  const RING_SIZE_MIN = 64, RING_SIZE_MAX = 170;
  const RING_REACH = 1.02;     // how far out the ring stands, as a share of the square
  const BASE_TILT = 26;        // how far the ring is tipped, in degrees: you look
                               // down on it a little, so its near side passes below
                               // the middle of the square and its far side above
  const LEAN_TILT = 8;         // and how much further the pointer can tip it
  const LEAN_TURN = 0.14;      // how far the pointer swings it round, in radians
  const LEAN_SHIFT = 80;       // how far the pointer moves your eye, in pixels
  const SCROLL_TURN = 0.00022; // how far a notch of scroll turns it — anticlockwise
  const DRAG_TURN = 0.0052;    // how far it turns for a movement of the hand
  const SPIN_MAX = 0.06;       // the fastest it will turn however hard it is pushed
  const SPIN_DRAG = 0.93;      // how quickly a push runs down
  const BOB = 4;               // how far a picture rises and falls where it floats
  const DIM_FAR = 0.58;        // how far the back of the ring washes out
  const CLICK_SLOP = 6;        // movement past which a drag is not also a click

  // ============================================================
  // THE PICTURES
  // ============================================================
  // The same hatching every other placeholder on this site is drawn
  // with, one angle per picture so that flicking through them reads as
  // different pictures going past. The name in the corner is not part
  // of the placeholder: it stays once a real picture is in the frame.
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
    frames.forEach((frame, i) => frame.classList.toggle("chosen", i === index));
  }

  // ============================================================
  // THE ORBIT
  //
  // The pictures stand on a ring in three dimensions with the big
  // square at the middle of it, so they pass in front of the square and
  // behind it. Everything is in one 3D space, which is what lets the
  // browser work out for itself what is in front of what.
  //
  // Nothing here turns the space itself. Each picture is *placed* —
  // moved to its own point on the ring and then turned about the
  // upright only, so it faces out from the middle:
  //
  //     translate3d(x, y, z) rotateY(its angle round the ring)
  //
  // which is why they stand upright however far the ring is tipped.
  // Tipping the space instead leans every picture over with it, and a
  // leaning picture is drawn as a sheared parallelogram — it reads as a
  // mistake rather than as a photograph standing in space. So the tip
  // is in the arithmetic: it is the ring's near side being *lower* than
  // its far side, nothing more.
  //
  // A picture faces outwards, so the far side of the ring shows you its
  // back — which is why each is built as a card with a face on both
  // sides carrying the same picture.
  //
  // The big square sits at the middle at z = 0, and needs no undoing of
  // anything: it is the one thing in the scene that is not turned.
  //
  // It does not turn on its own. Scrolling turns it, dragging swings it
  // round, and moving the pointer moves your eye — the scene's
  // perspective-origin — so everything with any depth to it shifts and
  // the square, being flat on at zero depth, does not.
  // ============================================================
  let turn = 0;           // where the ring has been turned to
  let spin = 0;           // and how fast it is turning
  let leanX = 0, leanY = 0;       // where the pointer has it leaning
  let wantLeanX = 0, wantLeanY = 0;
  let leanShiftX = 0, leanShiftY = 0;   // and where it has moved your eye to
  let wantShiftX = 0, wantShiftY = 0;
  let dragging = false;
  let dragFrom = 0, dragMoved = 0;
  let clock = 0;
  let homing = false;

  /** Two faces, so the same picture is there from either side. */
  function buildFaces(frame, index) {
    const picture = frame.querySelector("img");
    const number = frame.querySelector(".sheet-number");
    [0, 180].forEach((side) => {
      const face = document.createElement("span");
      face.className = "gallery-face";
      // A hair of thickness between the two. Left in the same plane
      // they fight over which is in front and the card flickers.
      face.style.transform = "rotateY(" + side + "deg) translateZ(0.6px)";
      face.style.setProperty("--hatch-angle", (-55 + ((index * 41) % 130)) + "deg");
      face.style.setProperty("--hatch-gap", (9 + ((index * 7) % 10)) + "px");
      if (picture) face.appendChild(picture.cloneNode());
      if (number) face.appendChild(number.cloneNode(true));
      // What it is called, in its own corner, for when it is pointed
      // at — the same as the big square's, in miniature.
      const says = document.createElement("span");
      says.className = "gallery-hover-name";
      says.textContent = titleOf(index);
      face.appendChild(says);
      frame.appendChild(face);
    });
    if (picture) picture.remove();
    if (number) number.remove();
  }

  frames.forEach(buildFaces);

  function placeRing() {
    const width = scene.clientWidth;
    if (!width) return;
    const plateSize = plate.getBoundingClientRect().width || width * 0.32;
    const size = Math.max(RING_SIZE_MIN, Math.min(RING_SIZE_MAX, plateSize * RING_SIZE));
    // Far enough out to clear the square, but never so far that the
    // ring runs off the sides of the page — on a narrow screen the
    // second of these is the one that decides it.
    const radius = Math.min(
      Math.max(plateSize * RING_REACH, plateSize / 2 + size * 1.1),
      width / 2 - size * 0.8
    );
    const drop = Math.sin(((BASE_TILT + leanY) * Math.PI) / 180) * radius;

    // Where you are looking from. The pointer moves your eye rather
    // than the ring, so everything with depth shifts against everything
    // else — and the big square, flat on at no depth at all, does not
    // move by so much as a pixel whatever the pointer does.
    scene.style.perspectiveOrigin =
      "calc(50% + " + (-leanShiftX).toFixed(1) + "px) " +
      "calc(50% + " + (-leanShiftY).toFixed(1) + "px)";

    frames.forEach((frame, i) => {
      const angle = turn + leanX + (i / frames.length) * Math.PI * 2;
      // A little unevenness up and down, so the ring reads as a ring in
      // space rather than as a row of pictures on a wire.
      const rise = Math.sin(i * 2.3) * size * 0.14;
      const bob = REDUCE_MOTION ? 0 : Math.sin(clock * 0.8 + i * 1.7) * BOB;
      const across = Math.sin(angle), along = Math.cos(angle);
      // How near the front of the ring this one has come round to,
      // 1 at the front and 0 at the back. Perspective already draws
      // the far ones smaller; washing them out as well is what makes
      // the ring read as lying away from you rather than as a circle
      // drawn on the page.
      frame.style.setProperty("--dim", (((1 - along) / 2) * DIM_FAR).toFixed(3));
      frame.style.width = size + "px";
      frame.style.height = size + "px";
      frame.style.marginLeft = -size / 2 + "px";
      frame.style.marginTop = -size / 2 + "px";
      frame.style.transform =
        "translate3d(" + (across * radius).toFixed(1) + "px, " +
        (along * drop + rise + bob).toFixed(1) + "px, " +
        (along * radius).toFixed(1) + "px) " +
        "rotateY(" + ((angle * 180) / Math.PI).toFixed(2) + "deg)";
    });
  }

  let turning = 0;
  function turnOrbit(now) {
    turning = requestAnimationFrame(turnOrbit);
    const step = Math.min(3, (now - (turnOrbit.last || now)) / 16.7) || 1;
    turnOrbit.last = now;
    clock += step / 60;

    if (!dragging && !homing) {
      // What is left of a scroll or a throw, running itself down. There
      // is no drift underneath it: this ring only moves when it is
      // moved.
      spin *= Math.pow(SPIN_DRAG, step);
      if (Math.abs(spin) < 0.00002) spin = 0;
      turn += spin * step;
    }
    const ease = Math.min(1, 0.08 * step);
    leanX += (wantLeanX - leanX) * ease;
    leanY += (wantLeanY - leanY) * ease;
    leanShiftX += (wantShiftX - leanShiftX) * ease;
    leanShiftY += (wantShiftY - leanShiftY) * ease;
    placeRing();
  }

  // --- the pointer leans it
  scene.addEventListener("pointermove", (e) => {
    const box = scene.getBoundingClientRect();
    const acrossX = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
    const acrossY = (e.clientY - (box.top + box.height / 2)) / (box.height / 2);
    const hold = Math.max(-1, Math.min(1, acrossX));
    const rise = Math.max(-1, Math.min(1, acrossY));
    wantLeanX = hold * LEAN_TURN;
    wantLeanY = rise * LEAN_TILT;
    wantShiftX = hold * LEAN_SHIFT;
    wantShiftY = rise * LEAN_SHIFT * 0.5;
  });
  scene.addEventListener("pointerleave", () => {
    wantLeanX = 0; wantLeanY = 0; wantShiftX = 0; wantShiftY = 0;
  });

  // --- scrolling turns it, the same way every time
  scene.addEventListener("wheel", (e) => {
    const by = (e.deltaY || 0) * SCROLL_TURN;
    spin += by;
    spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, spin));
    homing = false;
  }, { passive: true });

  // --- and dragging, for anything without a wheel
  scene.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragMoved = 0;
    dragFrom = e.clientX;
    scene.classList.add("grabbing");
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
    scene.classList.remove("grabbing");
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

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
    const from = turn, started = performance.now(), span = 620;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    if (REDUCE_MOTION) { turn = want; return; }
    spin = 0;
    homing = true;
    const step = (now) => {
      const t = Math.min(1, (now - started) / span);
      turn = from + delta * ease(t);
      if (t < 1 && !dragging) requestAnimationFrame(step);
      else homing = false;
    };
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
    turning = requestAnimationFrame(turnOrbit);

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
