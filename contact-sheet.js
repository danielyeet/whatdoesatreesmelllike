// ============================================================
// THE HOUSES — the hang (categories/scent-descriptions.html)
//
// The owner, 2026-09-24: "lets redisign that page entirely. I want it to
// be completly differnet. I want to keep their numbering; I want it to
// be a gallery like view so not a table or anything of that sort, I want
// it to be creative, you can feel free to make it as complex as
// neccessary. Keep the elements that come up when you hover one of them;
// maybe make the delay before they come up smaller."
//
// So the houses are HUNG, the way pictures are hung on a gallery wall:
//
//   THE RAIL      a picture rail runs across the wall, and every house
//                 hangs from it on a hook.
//   THE HANG      alternately HIGH and LOW — a salon hang. A high picture
//                 hangs close under the rail on two wires; a low one on a
//                 long cord that drops between the two high pictures
//                 either side of it and opens into two wires just above
//                 it. So nine pictures stand in two tiers on one rail, in
//                 their order, 01 to 09, left to right.
//   THE LABEL     under every picture, the way a museum labels its wall:
//                 the number, large, and the house's name. The numbering
//                 is the owner's and is the first thing on the label.
//   THE HANGING   is how the page arrives: the rail is drawn across the
//                 wall, and then each picture is lowered on to its hook
//                 in order, arriving with a swing that dies away.
//   THE SWING     a picture is a pendulum on its hook. Brush past one
//                 with the pointer and it swings, a long cord more slowly
//                 than a short one, and settles again. Nothing moves that
//                 nothing has touched.
//
// RESTING ON A HOUSE — kept, as asked, with a shorter wait (HOVER_WAIT_MS)
// — brings its motifs up over the wall while everything else goes out of
// focus (motifs.js). PRESSING ONE steps the page back and opens the house.
//
// The pictures are the <a class="sheet-frame"> blocks in the page, in
// order, so adding a house is an HTML edit and nothing here changes.
// Delete this file and its <script> tag and the page is still a plain,
// working grid of links.
// ============================================================
(function () {
  const sheet = document.getElementById("sheet");
  if (!sheet) return; // not a page with the hang on it

  const frames = Array.from(sheet.querySelectorAll(".sheet-frame"));
  if (!frames.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ============================================================
  // TUNING
  // ============================================================
  // THE HANGING. The rail is drawn across first; then each picture is
  // lowered on to its hook STEP_MS after the one before, taking DROP_MS
  // to come down from DROP_FROM pixels above where it hangs.
  const RAIL_MS = 700;
  const STEP_MS = 150;
  const DROP_MS = 760;
  const DROP_FROM = 70;
  const ARRIVE_SWING = 0.075;       // radians it arrives swinging by

  // How long the pointer has to rest on a house before its motifs come.
  // It was 420ms and the owner found it "too long"; this is still long
  // enough that crossing the wall sets nothing off.
  const HOVER_WAIT_MS = 200;

  // Pressing a house: how long the page takes to step back before the
  // house is opened.
  const LEAVE_MS = 560;

  // HOW MANY TO A RAIL, off the wall's width. Nine to one rail on a wide
  // window; on a narrower one the houses are shared out over more rails,
  // as evenly as they go.
  const perRail = (width) => (width >= 1060 ? 9 : width >= 820 ? 5 : width >= 560 ? 4 : 3);

  // A PICTURE'S SIZE. Its width is a share of the most it may have —
  // which is what keeps a high picture clear of the cords either side of
  // it — and its height a multiple of its width, so the hang is a mix of
  // upright and wide pictures, as a salon hang is.
  const WIDE = [0.62, 0.94];
  const TALL = [0.72, 1.3];
  const TALLEST = 250;              // no picture is taller than this
  const LABEL = 54;                 // the room the label takes under a picture
  const HIGH_DROP = [30, 64];       // a high picture's wires, hook to frame
  const LOW_GAP = 30;               // a low picture's cord opens this far above it
  const RAIL_GAP = 84;              // between one rail's hang and the next rail

  // THE SWING. A pendulum on its hook: the longer the wire, the slower it
  // swings. The pointer brushing past gives it a push in the way it was
  // going; it can never swing further than MOST.
  const STIFF = 2600;               // how hard it swings back, for a 100px wire
  const DAMP = 3.0;                 // how fast a swing dies away
  const PUSH = 0.0011;              // how much a pixel of pointer pushes it
  const MOST = 0.07;                // radians

  // Seeded, so the hang is the same on every visit and a resize moves it
  // rather than re-rolling it.
  const SEED = 2409;
  let seed = SEED;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  const between = (range) => range[0] + random() * (range[1] - range[0]);

  // ============================================================
  // THE FRAMES AND THEIR LABELS
  // ============================================================
  // The number goes into the label, first — the numbering is the
  // owner's. It is the frame's number on the wall and stays there once
  // a real picture is in it.
  frames.forEach((frame, i) => {
    frame.style.setProperty("--hatch-angle", (-62 + ((i * 37) % 120)) + "deg");
    frame.style.setProperty("--hatch-gap", (9 + ((i * 5) % 9)) + "px");
    // The number stands at the head of the label but is not written INTO
    // the caption: the page's own search reads the caption, and "02ADAR"
    // is not a word anyone searches for.
    const number = document.createElement("span");
    number.className = "sheet-number";
    number.textContent = String(i + 1).padStart(2, "0");
    frame.appendChild(number);
  });

  sheet.classList.add("scripted");
  document.body.classList.add("sheet-scripted");

  // THE WIRES, THE HOOKS AND THE RAIL, drawn in one SVG laid over the
  // wall under the pictures.
  const lines = document.createElementNS(NS, "svg");
  lines.setAttribute("class", "sheet-lines");
  lines.setAttribute("aria-hidden", "true");
  sheet.insertBefore(lines, sheet.firstChild);

  // ============================================================
  // LAYOUT
  // ============================================================
  /** How wide the longest word of a house's name is set, in the label's
      own face — measured rather than guessed, because it depends on a
      font this page does not choose. */
  const ruler = document.createElement("canvas").getContext("2d");
  function longestWord(frame) {
    const name = frame.querySelector(".sheet-name");
    if (!name || !ruler) return 0;
    const cs = getComputedStyle(name);
    ruler.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const spacing = parseFloat(cs.letterSpacing) || 0;
    return Math.max(0, ...name.textContent.trim().split(/\s+/).map((word) =>
      ruler.measureText(word).width + spacing * word.length));
  }
  let hung = [];          // one per picture: where it hangs and how it swings
  let rails = [];         // one per rail: its height and its ends
  let wallWidth = 0;
  function layout() {
    seed = SEED;
    const width = sheet.clientWidth;
    wallWidth = width;
    const most = perRail(width);
    const railCount = Math.ceil(frames.length / most);
    const each = Math.ceil(frames.length / railCount);

    const before = hung;
    hung = [];
    rails = [];
    let top = 12;
    for (let r = 0; r < railCount; r++) {
      const members = frames.slice(r * each, (r + 1) * each);
      const m = members.length;
      const step = width / Math.max(m, 2);
      // A picture may be no wider than two steps less a margin, or it
      // would reach the cords of the low pictures either side of it.
      const widest = Math.min(step * 2 - 30, 300);
      const centre = (j) => (m === 1 ? width / 2 : (j + 0.5) * (width / m));
      const sizes = members.map((frame, j) => {
        // No narrower than the longest WORD of its name, with the number
        // before it: a name may go on to a second line between its
        // words, never in the middle of one ("Pinewar / d").
        const needs = longestWord(frame) + 48;
        // And no wider than the room between its middle and the nearer
        // edge of the wall, or the ones at the ends hang off the page.
        const room = Math.min(widest, 2 * Math.min(centre(j), width - centre(j)) - 6);
        const w = Math.round(Math.min(room, Math.max(needs, widest * between(WIDE))));
        const h = Math.round(Math.min(TALLEST, w * between(TALL)));
        return { w, h, drop: between(HIGH_DROP), lean: random() };
      });
      const railY = top;
      const highBottom = [];
      members.forEach((frame, j) => {
        const s = sizes[j];
        const cx = centre(j);
        if (j % 2 === 0) {
          const y = railY + s.drop;
          highBottom[j] = y + s.h + LABEL;
          hung.push({ frame, cx, x: cx - s.w / 2, y, w: s.w, h: s.h, hookY: railY, high: true, rail: r });
        } else {
          hung.push({ frame, cx, x: cx - s.w / 2, y: 0, w: s.w, h: s.h, hookY: railY, high: false, rail: r, j });
        }
      });
      // The low pictures hang below the lower of the two high pictures
      // either side of them, so their cords pass between those two.
      let deepest = railY;
      hung.filter((one) => one.rail === r).forEach((one, j) => {
        if (!one.high) {
          const left = highBottom[j - 1] || railY, right = highBottom[j + 1] || railY;
          one.y = Math.max(left, right) + LOW_GAP + 14 + Math.round(sizes[j].lean * 24);
        }
        deepest = Math.max(deepest, one.y + one.h + LABEL);
      });
      rails.push({ y: railY, from: 0, to: width });
      top = deepest + RAIL_GAP;
    }
    const height = top - RAIL_GAP + 20;
    sheet.style.height = height + "px";
    sheet.style.marginTop = Math.max(24, Math.round((window.innerHeight - height) / 2 - 96)) + "px";
    lines.setAttribute("width", width);
    lines.setAttribute("height", height);
    lines.setAttribute("viewBox", "0 0 " + width + " " + height);

    // A picture keeps its swing across a layout; only where it hangs moves.
    hung.forEach((one, i) => {
      const was = before[i];
      one.angle = was ? was.angle : 0;
      one.spin = was ? was.spin : 0;
      one.dropAt = was ? was.dropAt : null;
      one.wire = one.y - one.hookY;
      one.frame.style.width = one.w + "px";
      one.frame.style.height = one.h + "px";
      // The line about the house hangs from whichever side keeps it on
      // the page.
      one.frame.dataset.say = one.cx > width / 2 ? "end" : "start";
      one.frame.dataset.tier = one.high ? "high" : "low";
    });
    buildLines();
    place(performance.now());
  }

  // ============================================================
  // THE RAIL, THE HOOKS AND THE WIRES
  // ============================================================
  let railEls = [], wireEls = [];
  let railDrawn = false;          // a later layout keeps the rail drawn
  function buildLines() {
    while (lines.firstChild) lines.removeChild(lines.firstChild);
    railEls = rails.map((rail) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "sheet-rail");
      // A picture rail is a moulding: two lines close together, and a
      // bracket at each end.
      [0, 5].forEach((dy) => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", rail.from); l.setAttribute("x2", rail.to);
        l.setAttribute("y1", rail.y + dy); l.setAttribute("y2", rail.y + dy);
        g.appendChild(l);
      });
      if (railDrawn) g.classList.add("drawn");
      lines.appendChild(g);
      return g;
    });
    wireEls = hung.map((one) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "sheet-wire");
      g.dataset.for = String(hung.indexOf(one));
      const hook = document.createElementNS(NS, "circle");
      hook.setAttribute("class", "sheet-hook");
      hook.setAttribute("cx", one.cx); hook.setAttribute("cy", one.hookY + 2.5);
      hook.setAttribute("r", 3.2);
      const path = document.createElementNS(NS, "path");
      g.appendChild(path);
      g.appendChild(hook);
      lines.appendChild(g);
      return { g, path };
    });
  }

  /** Where a point of a picture is on the wall, the picture hanging at
      `angle` about its hook and lowered by `dy`. */
  function swung(one, px, py, dy) {
    const ox = one.cx, oy = one.hookY + dy;
    const c = Math.cos(one.angle), s = Math.sin(one.angle);
    const rx = px - one.cx, ry = py + dy - oy;
    return [ox + rx * c - ry * s, oy + rx * s + ry * c];
  }

  /** Put every picture where it hangs this moment, and draw its wires
      to where its corners are. */
  function place(now) {
    hung.forEach((one, i) => {
      let dy = 0, shown = 1;
      if (one.dropAt !== null && one.dropAt !== undefined) {
        const p = Math.min(1, Math.max(0, (now - one.dropAt) / DROP_MS));
        const eased = 1 - Math.pow(1 - p, 3);
        dy = -DROP_FROM * (1 - eased);
        shown = Math.min(1, p * 2.4);
      } else if (!REDUCE_MOTION && !one.frame.classList.contains("landed")) {
        shown = 0;
      }
      one.dy = dy;
      const f = one.frame;
      f.style.transformOrigin = (one.cx - one.x) + "px " + (one.hookY - one.y) + "px";
      f.style.transform = "translate(" + one.x.toFixed(1) + "px," + (one.y + dy).toFixed(1) + "px) rotate(" + one.angle.toFixed(4) + "rad)";
      f.style.setProperty("--shown", shown.toFixed(3));

      // The wires: to two points on the picture's top edge, from the
      // hook for a high picture, and from the end of a long cord for a
      // low one.
      const inset = one.w * 0.16;
      const A = swung(one, one.x + inset, one.y, dy);
      const B = swung(one, one.x + one.w - inset, one.y, dy);
      let d;
      if (one.high) {
        d = "M" + A[0].toFixed(1) + " " + A[1].toFixed(1) + " L" + one.cx + " " + (one.hookY + 2.5) +
            " L" + B[0].toFixed(1) + " " + B[1].toFixed(1);
      } else {
        const P = swung(one, one.cx, one.y - LOW_GAP, dy);
        d = "M" + one.cx + " " + (one.hookY + 2.5) + " L" + P[0].toFixed(1) + " " + P[1].toFixed(1) +
            " M" + A[0].toFixed(1) + " " + A[1].toFixed(1) + " L" + P[0].toFixed(1) + " " + P[1].toFixed(1) +
            " L" + B[0].toFixed(1) + " " + B[1].toFixed(1);
      }
      const w = wireEls[i];
      if (w) {
        w.path.setAttribute("d", d);
        w.g.style.opacity = String(shown);
      }
    });
  }

  // ============================================================
  // THE SWING — a pendulum per picture, run only while one is moving
  // ============================================================
  let running = false, lastTick = 0;
  function moving() {
    const now = performance.now();
    return hung.some((one) =>
      Math.abs(one.angle) > 0.0004 || Math.abs(one.spin) > 0.0004 ||
      (one.dropAt !== null && one.dropAt !== undefined && now - one.dropAt < DROP_MS));
  }
  function tick(now) {
    const dt = Math.min(0.034, (now - (lastTick || now)) / 1000);
    lastTick = now;
    hung.forEach((one) => {
      // A longer wire swings more slowly: stiffness falls with its length.
      const k = STIFF / Math.max(40, one.wire + one.h * 0.5);
      one.spin += (-k * one.angle - DAMP * one.spin) * dt;
      one.angle += one.spin * dt;
      if (one.angle > MOST) { one.angle = MOST; one.spin *= -0.3; }
      if (one.angle < -MOST) { one.angle = -MOST; one.spin *= -0.3; }
    });
    place(now);
    if (moving()) requestAnimationFrame(tick);
    else {
      hung.forEach((one) => { one.angle = 0; one.spin = 0; });
      place(now);
      running = false;
      lastTick = 0;
    }
  }
  function swing() {
    if (running || REDUCE_MOTION) return;
    running = true;
    lastTick = 0;
    requestAnimationFrame(tick);
  }

  // THE POINTER BRUSHING PAST: a picture it moves across is pushed the
  // way it is going. Read off the wall rather than off each picture, so
  // the push is the same however the picture is turned.
  let lastX = null, lastY = null;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || REDUCE_MOTION || !sheet.classList.contains("drawn")) {
      lastX = null;
      return;
    }
    if (lastX !== null) {
      const dx = e.clientX - lastX;
      const box = sheet.getBoundingClientRect();
      const x = e.clientX - box.left, y = e.clientY - box.top;
      let pushed = false;
      hung.forEach((one) => {
        if (one.frame.classList.contains("hot")) return;
        if (x < one.x - 6 || x > one.x + one.w + 6 || y < one.y - 6 || y > one.y + one.h + 6) return;
        // Pushed harder the lower down it is caught, as a picture is.
        const lever = (y - one.hookY) / Math.max(1, one.wire + one.h);
        one.spin += dx * PUSH * (0.4 + lever) * 60 / Math.max(60, one.wire + one.h * 0.5);
        pushed = true;
      });
      if (pushed) swing();
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }, { passive: true });

  // ============================================================
  // THE HANGING — how the page arrives
  // ============================================================
  // The rail is drawn across the wall, and then the pictures are lowered
  // on to their hooks one after another, each arriving with a swing. The
  // chrome — the Menu, the two buttons, the search — comes once every
  // picture is hung.
  function arrive() {
    sheet.classList.add("settled");
    if (REDUCE_MOTION) {
      frames.forEach((frame) => frame.classList.add("landed", "whole"));
      railDrawn = true;
      railEls.forEach((g) => g.classList.add("drawn"));
      finish();
      return;
    }
    requestAnimationFrame(() => {
      railDrawn = true;
      railEls.forEach((g) => g.classList.add("drawn"));
    });
    hung.forEach((one, i) => {
      setTimeout(() => {
        one.dropAt = performance.now();
        one.angle = 0;
        one.spin = (i % 2 ? -1 : 1) * ARRIVE_SWING * 3.4;
        one.frame.classList.add("landed");
        swing();
      }, RAIL_MS * 0.6 + i * STEP_MS);
      setTimeout(() => one.frame.classList.add("whole"), RAIL_MS * 0.6 + i * STEP_MS + DROP_MS);
    });
    setTimeout(finish, RAIL_MS * 0.6 + (hung.length - 1) * STEP_MS + DROP_MS);
  }
  function finish() {
    sheet.classList.add("drawn");
    document.body.classList.add("sheet-named");
  }

  // ============================================================
  // RESTING ON A HOUSE
  // ============================================================
  let waiting = null;
  let resting = null;
  function rest(frame) {
    if (resting === frame) return;
    if (resting) resting.classList.remove("hot");
    resting = frame;
    frame.classList.add("hot");
    sheet.classList.add("musing");
    if (window.HouseMotifs) window.HouseMotifs.start(frame.dataset.motif, frame);
  }
  function leave(frame) {
    clearTimeout(waiting);
    waiting = null;
    if (resting !== frame) return;
    resting = null;
    frame.classList.remove("hot");
    sheet.classList.remove("musing");
    if (window.HouseMotifs) window.HouseMotifs.stop();
  }
  frames.forEach((frame) => {
    frame.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(waiting);
      waiting = setTimeout(() => {
        waiting = null;
        if (!sheet.classList.contains("drawn") || sheet.classList.contains("searching")) return;
        if (document.body.classList.contains("sheet-leaving")) return;
        rest(frame);
      }, HOVER_WAIT_MS);
    });
    frame.addEventListener("pointerleave", () => leave(frame));
    frame.addEventListener("focus", () => {
      clearTimeout(waiting);
      waiting = setTimeout(() => { waiting = null; if (sheet.classList.contains("drawn")) rest(frame); }, HOVER_WAIT_MS);
    });
    frame.addEventListener("blur", () => leave(frame));

    // PRESSING A HOUSE: the page steps back and the picture comes
    // forward, and only then is the house opened.
    frame.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (REDUCE_MOTION) return;
      e.preventDefault();
      const href = frame.href;
      clearTimeout(waiting);
      frame.classList.add("chosen");
      document.body.classList.add("sheet-leaving");
      setTimeout(() => { window.location.href = href; }, LEAVE_MS);
    });
  });
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    document.body.classList.remove("sheet-leaving");
    frames.forEach((frame) => frame.classList.remove("chosen", "hot"));
    sheet.classList.remove("musing");
    resting = null;
    if (window.HouseMotifs) window.HouseMotifs.stop(true);
  });

  // ============================================================
  // SEARCH
  //
  // This page's own search looks over THIS CATEGORY: the houses on the
  // sheet and every fragrance in them, which are both already in the
  // page (the fragrances view carries the lot). It is forgiving —
  // "murkwod" finds Murkwood — and it says WHERE each answer lives, so
  // a fragrance is an answer you can act on rather than a word.
  //
  // What it cannot answer it hands to the site's own search page with
  // the question in the address, which is where a search that is not
  // about this category belongs.
  // ============================================================
  const search = document.querySelector(".sheet-search");
  if (search) {
    const field = search.querySelector(".sheet-search-field");
    const trigger = search.querySelector(".sheet-search-trigger");
    const found = document.createElement("div");
    found.className = "sheet-found";
    found.setAttribute("aria-live", "polite");
    search.appendChild(found);

    /** Everything this page can answer for, read off the page itself. */
    const mine = () => (window.SiteSearch
      ? window.SiteSearch.collect(document, window.location.href, ["Scent descriptions"])
      : []);
    let everything = null;

    const applySearch = () => {
      const term = field.value.trim();
      sheet.classList.toggle("searching", term.length > 0);
      if (!everything) everything = mine();

      const hits = term && window.SiteSearch
        ? window.SiteSearch.rank(term, everything, 6)
        : [];

      // The pictures dim as they always did — that is the search on
      // the sheet itself — and a picture counts as matching if the
      // search would have found it.
      frames.forEach((frame) => {
        const caption = frame.querySelector(".sheet-caption");
        const text = caption ? caption.textContent : "";
        const match = !term || (window.SiteSearch
          ? window.SiteSearch.score(term, text) > 0
          : text.toLowerCase().indexOf(term.toLowerCase()) >= 0);
        frame.classList.toggle("dimmed", Boolean(term) && !match);
      });

      found.innerHTML = "";
      search.classList.toggle("has-found", hits.length > 0);
      hits.forEach((hit) => {
        const row = document.createElement("a");
        row.className = "sheet-found-row";
        row.href = hit.entry.href;
        const name = document.createElement("span");
        name.className = "sheet-found-what";
        name.textContent = hit.entry.name;
        const where = document.createElement("span");
        where.className = "sheet-found-where";
        where.textContent = hit.entry.where.join(" · ");
        row.append(name, where);
        found.appendChild(row);
      });
      if (term && !hits.length) {
        const none = document.createElement("p");
        none.className = "sheet-found-none";
        none.textContent = "Nothing here by that name — press enter to search the site.";
        found.appendChild(none);
        search.classList.add("has-found");
      }
    };

    trigger.addEventListener("click", () => {
      search.classList.toggle("open");
      if (search.classList.contains("open")) field.focus();
      else { field.value = ""; applySearch(); }
    });
    field.addEventListener("input", applySearch);
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const first = found.querySelector(".sheet-found-row");
        if (first) { window.location.href = first.href; return; }
        const term = field.value.trim();
        if (term && window.SiteSearch) {
          window.location.href = window.SiteSearch.siteSearchHref(window.SITE_ROOT, term);
        }
        return;
      }
      if (e.key !== "Escape") return;
      field.value = "";
      applySearch();
      search.classList.remove("open");
      trigger.focus();
    });
  }

  // The hang is laid out before the page is shown, so what the browser
  // painted before this — the no-script grid of every picture — is never
  // seen; and it is laid out again, never re-run, when the window changes.
  // AND IT IS HUNG ONCE THE PAGE'S FACES ARE IN — for at most FONTS_MS —
  // because a name's width decides how wide its picture may be, and a
  // wall laid out again when the faces arrive moved pictures that were
  // already on their way down to their hooks.
  const FONTS_MS = 1200;
  layout();
  document.documentElement.classList.remove("js-coming");
  window.addEventListener("resize", layout);
  let hangingStarted = false;
  const startHanging = () => {
    if (hangingStarted) return;
    hangingStarted = true;
    layout();
    arrive();
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(startHanging, startHanging);
  setTimeout(startHanging, FONTS_MS);
})();
