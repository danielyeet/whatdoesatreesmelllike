// ============================================================
// THE CONTACT SHEET (categories/ pages that carry one)
//
// A contact sheet is the strip of every frame on a roll of film,
// printed together so you can pick one. This is that idea as the
// way into a body of work, and then as a map of it:
//
//   1. the page opens white, with one square window in the middle
//   2. every picture in the category flicks through that window,
//      hard cuts, no fading — fast at first, then slowing, the way
//      a wheel comes to rest
//   3. it LANDS on the first picture and simply stops there. The run
//      is set up to end on that picture rather than cutting to it
//      once the flicking is over, which was one blink too many
//   4. the buttons above it appear, and the name arrives
//   5. lines then reach out across the page at whatever angle they
//      need — some picture to picture rather than all back to the
//      middle, each carrying a date — and each of the other pictures
//      appears as its line lands on it
//
// The pictures are the <a class="sheet-frame"> blocks in the page
// itself, so adding one is an HTML edit and nothing here changes.
// The first block is the one it settles on — reorder them to
// feature a different picture.
//
// Delete this file and its <script> tag and the page is still a
// plain, working grid of links: everything below only moves things
// that are already there.
// ============================================================
(function () {
  const sheet = document.getElementById("sheet");
  if (!sheet) return; // not a page with a contact sheet on it

  const frames = Array.from(sheet.querySelectorAll(".sheet-frame"));
  if (!frames.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ============================================================
  // TUNING
  // ============================================================
  // The flick. It holds the first picture for FLIP_FIRST_MS, then each
  // one a little longer than the last, and stops once one would be held
  // longer than FLIP_LAST_MS — so the whole run takes about three
  // seconds however many pictures there are.
  const FLIP_FIRST_MS = 42;
  const FLIP_SLOW = 1.14;
  const FLIP_LAST_MS = 430;

  // The map. Sizes are shares of the sheet's own width, so the whole
  // arrangement scales rather than being pinned to one screen.
  const PLATE_SHARE = 0.42, PLATE_MIN = 260, PLATE_MAX = 470;
  const CHILD_SHARE = 0.125, CHILD_MIN = 92, CHILD_MAX = 152;
  const CELL_SPREAD = 1.58;   // how much room each picture is given, as a multiple of itself
  const CELL_JITTER = 0.85;   // how much of the room left over it may wander in
  const SIZE_VARY = 0.34;     // how much the pictures differ in size
  const PLATE_CLEAR = 30;     // space kept clear around the middle window

  // How the pictures are joined up. Not everything reaches back to the
  // middle: each picture links to one of its nearer neighbours, some
  // links are dropped so a few pictures stand on their own, and a few
  // extra ones are added across the map so it reads as a network rather
  // than as a family tree.
  const LINK_NEAREST = 3;     // how many near neighbours are candidates
  const LINK_DROP = 0.24;     // share of pictures left unlinked
  const LINK_EXTRA = 3;       // cross links added back
  const LINE_GAP = 8;         // clear space between a line and the pictures it joins
  const LABEL_MIN = 96;       // a line shorter than this carries no date
  const CAPTION_ROOM = 30;    // the strip under a picture its caption is printed on

  const NAME_AFTER_MS = 380;    // pause between it settling and the name arriving
  const ROUTE_AFTER_MS = 720;   // and before the lines start reaching out
  const ROUTE_MS_PER_PX = 0.9;  // how fast a line draws itself
  const LINK_DELAY_MS = 110;    // pause at a picture before its own lines carry on
  const SEED = 7;               // change for a different arrangement of the map

  // A seeded random number generator, so the map is scattered but comes
  // out the same every visit — a layout that rearranged itself on every
  // reload would read as a fault rather than as a design.
  let seed = SEED;
  function random() {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  }

  // ============================================================
  // THE FRAMES
  // ============================================================
  // A frame with no picture in it yet is drawn as hatching, the same
  // way every other placeholder on this site is. Each gets its own
  // angle and spacing so that flicking through them reads as different
  // pictures going past rather than as one still image.
  // The number in the corner is NOT part of the placeholder: it is the
  // frame's number on the sheet and stays there once a real picture is
  // in the frame, printed on its own white chip so it reads over
  // whatever is behind it. Only the hatching goes when a picture
  // arrives.
  frames.forEach((frame, i) => {
    frame.style.setProperty("--hatch-angle", (-62 + ((i * 37) % 120)) + "deg");
    frame.style.setProperty("--hatch-gap", (9 + ((i * 5) % 9)) + "px");
    const number = document.createElement("span");
    number.className = "sheet-number";
    number.textContent = String(i + 1).padStart(2, "0");
    frame.appendChild(number);
  });

  // Taking over from the plain grid the page comes with. Done before
  // anything is measured, so nothing is ever laid out twice.
  sheet.classList.add("scripted");
  document.body.classList.add("sheet-scripted");

  const plate = frames[0];
  const rest = frames.slice(1);
  plate.classList.add("is-plate");

  const lines = document.createElementNS(NS, "svg");
  lines.setAttribute("class", "sheet-lines");
  lines.setAttribute("aria-hidden", "true");
  sheet.insertBefore(lines, sheet.firstChild);

  // ============================================================
  // THE MAP
  //
  // Worked out here rather than left to the browser because the lines
  // have to meet the pictures exactly: the same numbers that place a
  // picture aim the line that reaches it.
  //
  // The pictures are scattered over a grid with far more places on it
  // than there are pictures, each one nudged off its own spot, so they
  // land irregularly without ever overlapping. The middle window's own
  // ground is taken out of that grid first, which is what lets pictures
  // sit beside it as well as below it.
  // ============================================================
  let placed = false;   // true once the pictures have left the middle window
  let nodes = [];       // the middle window first, then every other picture
  let links = [];

  /** Where a line from `from` towards `to` should leave `from`'s frame. */
  function edgePoint(from, to) {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const half = from.size / 2 + LINE_GAP;
    // Whichever side of the square it crosses first.
    const scale = Math.min(
      Math.abs(dx) > 0.001 ? half / Math.abs(dx) : Infinity,
      Math.abs(dy) > 0.001 ? half / Math.abs(dy) : Infinity
    );
    return { x: from.cx + dx * scale, y: from.cy + dy * scale };
  }

  function distance(a, b) { return Math.hypot(a.cx - b.cx, a.cy - b.cy); }

  /**
   * Does a straight line between these two points cut through the box?
   * The standard clipping test: walk in from each of the four sides in
   * turn and see whether anything of the line is left.
   */
  function crosses(from, to, box) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const edges = [
      [-dx, from.x - box.left], [dx, box.right - from.x],
      [-dy, from.y - box.top], [dy, box.bottom - from.y],
    ];
    let near = 0, far = 1;
    for (let i = 0; i < edges.length; i++) {
      const along = edges[i][0], room = edges[i][1];
      if (along === 0) {
        if (room < 0) return false;   // parallel to this side, and outside it
        continue;
      }
      const at = room / along;
      if (along < 0) near = Math.max(near, at);
      else far = Math.min(far, at);
      if (near > far) return false;
    }
    return true;
  }

  /**
   * True if nothing stands in the way between these two pictures.
   * Lines go at whatever angle they like now, so nothing about the
   * layout keeps them clear of anything — this does, by refusing to
   * make the link at all. A picture whose every candidate is blocked
   * simply goes unlinked, which is already something the map does on
   * purpose.
   *
   * Captions count. A caption is printed on white, so a line behind one
   * is knocked out where it crosses and pokes out the other side as a
   * stray stroke beside the word — which reads as a mistake in the
   * lettering rather than as a line passing behind it. That includes
   * the captions of the two pictures being joined: those are exactly
   * the ones a line leaving the bottom of a picture runs into.
   */
  function clearBetween(a, b) {
    const from = edgePoint(nodes[a], nodes[b]);
    const to = edgePoint(nodes[b], nodes[a]);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (i !== a && i !== b) {
        const box = {
          left: n.x - 3, top: n.y - 3,
          right: n.x + n.size + 3, bottom: n.y + n.size + 3,
        };
        if (crosses(from, to, box)) return false;
      }
      // The middle window's caption is printed inside it, not under it.
      if (i === 0) continue;
      const caption = {
        left: n.x, top: n.y + n.size + 2,
        right: n.x + Math.min(n.size * 1.5, 168), bottom: n.y + n.size + CAPTION_ROOM,
      };
      if (crosses(from, to, caption)) return false;
    }
    return true;
  }

  // Which picture joins which. Worked out ONCE, on the first layout,
  // and then left alone: a later layout (a resize, or the fonts
  // arriving) only moves the lines it already has. Rebuilding them
  // would throw away the elements that are mid-draw — which is exactly
  // what stopped any line at all from appearing the first time this
  // was written.
  function planLinks() {
    if (links.length) return;

    // Nearest first, measured from the middle: the map grows outwards.
    const order = nodes
      .map((node, i) => ({ i: i, d: distance(node, nodes[0]) }))
      .slice(1)
      .sort((a, b) => a.d - b.d);

    const linked = [0];
    order.forEach((entry) => {
      if (random() < LINK_DROP) return; // left standing on its own
      const node = nodes[entry.i];
      const near = linked
        .map((j) => ({ j: j, d: distance(nodes[j], node) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, LINK_NEAREST)
        .filter((candidate) => clearBetween(candidate.j, entry.i));
      if (!near.length) return;  // everything near it is behind something else
      links.push({ a: near[Math.floor(random() * near.length)].j, b: entry.i, tree: true });
      linked.push(entry.i);
    });

    // A few links across the map between pictures that are already
    // there. These are what stop it reading as a tree: they close
    // loops, which is something a map has and a diagram of descent
    // doesn't.
    for (let n = 0; n < LINK_EXTRA && linked.length > 3; n++) {
      const a = linked[Math.floor(random() * linked.length)];
      const near = linked
        .filter((j) => j !== a &&
          !links.some((l) => (l.a === a && l.b === j) || (l.a === j && l.b === a)))
        .map((j) => ({ j: j, d: distance(nodes[j], nodes[a]) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, LINK_NEAREST)
        .filter((candidate) => clearBetween(a, candidate.j));
      if (!near.length) continue;
      links.push({ a: a, b: near[Math.floor(random() * near.length)].j, tree: false });
    }

    // Nothing is left floating. Dropping links above is what keeps the
    // map from being one tidy fan out of the middle, but a picture with
    // no line at all reads as forgotten rather than as loosely joined —
    // so anything still on its own is joined to the nearest picture it
    // has a clear run to, wherever that is on the sheet. The result is
    // the same sparse, looping network, with no island in it.
    nodes.forEach((node, i) => {
      if (i === 0) return;
      if (links.some((l) => l.a === i || l.b === i)) return;
      const reachable = nodes
        .map((other, j) => ({ j: j, d: distance(other, node) }))
        .filter((entry) => entry.j !== i && clearBetween(entry.j, i))
        .sort((a, b) => a.d - b.d);
      if (reachable.length) links.push({ a: reachable[0].j, b: i, tree: true });
    });

    links.forEach((link) => {
      link.line = document.createElementNS(NS, "line");
      link.line.setAttribute("class", "sheet-route");
      // Which two pictures this joins, written where anything looking
      // at the page can read it — the tests use these to know which
      // two frames a line is allowed to touch.
      link.line.dataset.from = String(link.a);
      link.line.dataset.to = String(link.b);
      lines.appendChild(link.line);
      // A date on the line, the way a road on a map carries its number.
      // Random for now: real ones would be written onto the frames in
      // the page and read from there instead.
      const day = 1 + Math.floor(random() * 28);
      const month = 1 + Math.floor(random() * 12);
      const year = 2016 + Math.floor(random() * 10);
      link.date =
        String(day).padStart(2, "0") + "." + String(month).padStart(2, "0") + "." + year;
    });
  }

  function layout() {
    const width = sheet.clientWidth;
    if (!width) return;
    // Back to the start of the sequence every time, so resizing the
    // window rearranges nothing: the same places come out of it.
    seed = SEED;

    const plateSize = Math.round(Math.max(PLATE_MIN, Math.min(PLATE_MAX, width * PLATE_SHARE)));
    const childBase = Math.max(CHILD_MIN, Math.min(CHILD_MAX, width * CHILD_SHARE));
    const plateX = Math.round((width - plateSize) / 2);

    plate.style.width = plateSize + "px";
    plate.style.height = plateSize + "px";
    plate.style.transform = "translate(" + plateX + "px,0px)";

    const cell = childBase * CELL_SPREAD;
    const cols = Math.max(2, Math.round(width / cell));
    const cellW = width / cols;
    const cellH = cell;

    // Every place on the grid, minus the ones the middle window is
    // standing on, shuffled. Having more places than pictures is what
    // leaves the gaps that make this a scatter rather than a table.
    const rows = Math.ceil((rest.length * 1.9) / cols) + 1;
    const open = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;
        const clashes =
          x < plateX + plateSize + PLATE_CLEAR && x + cellW > plateX - PLATE_CLEAR &&
          y < plateSize + PLATE_CLEAR;
        if (!clashes) open.push({ x: x, y: y, key: random() });
      }
    }
    open.sort((a, b) => a.key - b.key);

    nodes = [{
      x: plateX, y: 0, size: plateSize,
      cx: plateX + plateSize / 2, cy: plateSize / 2,
    }];

    rest.forEach((frame, i) => {
      const spot = open[i] || { x: 0, y: 0 };
      // Pictures differ a little in size, and none of them sits dead
      // centre in its own square — both are what keep the scatter from
      // resolving back into the grid it was built on.
      const size = Math.round(childBase * (1 - SIZE_VARY / 2 + random() * SIZE_VARY));
      // Wandering, but never out of its own square: the room left over
      // inside the square is the whole of what it has to wander in, so
      // two pictures can never end up on top of each other however far
      // the scatter throws them.
      const roomX = Math.max(0, (cellW - size) / 2) * CELL_JITTER;
      const roomY = Math.max(0, (cellH - size) / 2) * CELL_JITTER;
      const x = Math.round(spot.x + (cellW - size) / 2 + (random() - 0.5) * 2 * roomX);
      const y = Math.round(spot.y + (cellH - size) / 2 + (random() - 0.5) * 2 * roomY);
      nodes.push({ x: x, y: y, size: size, cx: x + size / 2, cy: y + size / 2 });

      frame.style.width = (placed ? size : plateSize) + "px";
      frame.style.height = (placed ? size : plateSize) + "px";
      frame.style.transform = placed
        ? "translate(" + x + "px," + y + "px)"
        : "translate(" + plateX + "px,0px)";
    });

    planLinks();

    // When each line sets out, and how long it takes. A picture is only
    // reached once the line to it has arrived, and its own lines leave
    // shortly after that, so the map spreads outwards from the middle
    // rather than everything happening at once.
    const arriveAt = new Array(nodes.length).fill(null);
    arriveAt[0] = 0;
    links.forEach((link) => {
      const from = nodes[link.a], to = nodes[link.b];
      const a = edgePoint(from, to), b = edgePoint(to, from);
      const length = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      link.line.setAttribute("x1", a.x.toFixed(1));
      link.line.setAttribute("y1", a.y.toFixed(1));
      link.line.setAttribute("x2", b.x.toFixed(1));
      link.line.setAttribute("y2", b.y.toFixed(1));
      link.length = length;
      link.draw = Math.max(220, length * ROUTE_MS_PER_PX);
      link.start = (arriveAt[link.a] || 0) + LINK_DELAY_MS;
      if (link.tree && arriveAt[link.b] === null) arriveAt[link.b] = link.start + link.draw;

      link.line.style.strokeDasharray = length + " " + length;
      link.line.style.strokeDashoffset =
        link.line.classList.contains("drawn") ? "0" : String(length);

      // The date rides along its own line, kept upright, and is knocked
      // out of it rather than printed over it.
      if (length < LABEL_MIN) return;
      let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      const label = document.createElementNS(NS, "text");
      label.setAttribute("class", "sheet-date");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dy", "-5");
      // Not always at the halfway point: two lines crossing near their
      // middles would print their dates on top of each other. Sliding
      // each one along its own line by a different amount is enough to
      // keep them apart without having to work out where they all are.
      const along = 0.38 + random() * 0.26;
      label.setAttribute(
        "transform",
        "translate(" + (a.x + (b.x - a.x) * along).toFixed(1) + "," +
        (a.y + (b.y - a.y) * along).toFixed(1) + ") " +
        "rotate(" + angle.toFixed(1) + ")"
      );
      label.textContent = link.date;
      lines.appendChild(label);
      link.label = label;
    });

    // Anything left unlinked still has to arrive. It does so as though a
    // line had travelled out to it, so it keeps step with the rest.
    nodes.forEach((node, i) => {
      if (arriveAt[i] === null) {
        arriveAt[i] = LINK_DELAY_MS + distance(node, nodes[0]) * ROUTE_MS_PER_PX;
      }
      node.arriveAt = arriveAt[i];
    });
    links.forEach((link) => {
      if (!link.tree) link.start = Math.max(arriveAt[link.a], arriveAt[link.b]) + LINK_DELAY_MS;
    });

    const height = placed
      ? nodes.reduce((m, n) => Math.max(m, n.y + n.size), 0) + 54
      : plateSize;
    sheet.style.height = height + "px";
    lines.setAttribute("viewBox", "0 0 " + width + " " + height);
    lines.setAttribute("width", width);
    lines.setAttribute("height", height);
  }

  // ============================================================
  // THE FLICK, AND WHAT FOLLOWS IT
  // ============================================================
  function show(index) {
    frames.forEach((frame, i) => { frame.style.visibility = i === index ? "visible" : "hidden"; });
  }

  function land(index) {
    rest[index - 1].style.visibility = "visible";
    rest[index - 1].classList.add("landed");
  }

  function settle() {
    show(0);
    placed = true;
    // The picture it settled on keeps its own caption, printed in its
    // bottom corner the way a caption is written on a print.
    plate.classList.add("landed");
    layout();
    sheet.classList.add("settled");

    setTimeout(
      () => document.body.classList.add("sheet-named"),
      REDUCE_MOTION ? 0 : NAME_AFTER_MS
    );

    if (REDUCE_MOTION) {
      links.forEach((link) => {
        link.line.classList.add("drawn");
        link.line.style.strokeDashoffset = "0";
        if (link.label) link.label.classList.add("shown");
      });
      rest.forEach((frame, i) => land(i + 1));
      return;
    }

    // Each line reaches out, and the picture at the far end of it
    // appears as it lands — appears, not fades: the same hard cut the
    // flick is made of, so the whole page is drawn in one language.
    links.forEach((link) => {
      setTimeout(() => {
        link.line.classList.add("drawn");
        link.line.style.transition = "stroke-dashoffset " + Math.round(link.draw) + "ms linear";
        link.line.style.strokeDashoffset = "0";
        setTimeout(() => { if (link.label) link.label.classList.add("shown"); }, link.draw);
      }, ROUTE_AFTER_MS + link.start);
    });
    nodes.forEach((node, i) => {
      if (i === 0) return;
      setTimeout(() => land(i), ROUTE_AFTER_MS + node.arriveAt);
    });
  }

  function flick() {
    // How many cuts there will be, worked out before any of them run,
    // so the flick can be STARTED at whichever picture makes it END on
    // the first one. Cutting to that picture after the flicking has
    // finished is one blink too many: it has to simply stop.
    let steps = 0;
    for (let held = FLIP_FIRST_MS; held <= FLIP_LAST_MS; held *= FLIP_SLOW) steps++;
    let index = ((-steps % frames.length) + frames.length) % frames.length;
    let hold = FLIP_FIRST_MS;
    show(index);

    const step = () => {
      index = (index + 1) % frames.length;
      show(index);
      hold *= FLIP_SLOW;
      if (hold > FLIP_LAST_MS) {
        setTimeout(settle, Math.round(hold));
        return;
      }
      setTimeout(step, Math.round(hold));
    };
    setTimeout(step, Math.round(hold));
  }

  // ============================================================
  // SEARCH
  //
  // A placeholder, but a working one: it matches what a picture is
  // called and dims everything that doesn't match, so the shape of a
  // search is here and behaving while there is nothing real to
  // search yet.
  // ============================================================
  const search = document.querySelector(".sheet-search");
  if (search) {
    const field = search.querySelector(".sheet-search-field");
    const trigger = search.querySelector(".sheet-search-trigger");

    const applySearch = () => {
      const term = field.value.trim().toLowerCase();
      sheet.classList.toggle("searching", term.length > 0);
      frames.forEach((frame) => {
        const caption = frame.querySelector(".sheet-caption");
        const text = (caption ? caption.textContent : "").toLowerCase();
        frame.classList.toggle("dimmed", term.length > 0 && text.indexOf(term) < 0);
      });
    };

    trigger.addEventListener("click", () => {
      search.classList.toggle("open");
      if (search.classList.contains("open")) field.focus();
      else { field.value = ""; applySearch(); }
    });
    field.addEventListener("input", applySearch);
    field.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      field.value = "";
      applySearch();
      search.classList.remove("open");
      trigger.focus();
    });
  }

  layout();
  window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  if (REDUCE_MOTION || frames.length < 2) settle();
  else flick();
})();
