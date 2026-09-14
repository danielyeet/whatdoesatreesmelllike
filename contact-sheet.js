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
  const PLATE_SHARE = 0.44, PLATE_MIN = 270, PLATE_MAX = 500;
  const CHILD_SHARE = 0.125, CHILD_MIN = 92, CHILD_MAX = 152;
  const CELL_SPREAD = 1.6;    // how much room each picture is given, as a multiple of itself
  // ...and a little more of it the further down the page it is, so the
  // sheet opens out as it goes rather than bunching up towards the
  // bottom. Gently: at 0.16 the map became a third empty.
  const ROW_OPEN = 0.07;      // each row this much roomier than the one above
  const CELL_JITTER = 0.85;   // how much of the room left over it may wander in
  const SIZE_VARY = 0.34;     // how much the pictures differ in size
  const PLATE_CLEAR = 34;     // space kept clear around the middle window

  // How the pictures are joined up. Not everything reaches back to the
  // middle: each picture links to one of its nearer neighbours, some
  // links are dropped so a few pictures stand on their own, and a few
  // extra ones are added across the map so it reads as a network rather
  // than as a family tree.
  const LINK_NEAREST = 3;     // how many near neighbours are candidates
  const LINK_DROP = 0.24;     // share of pictures left unlinked
  const LINK_EXTRA = 3;       // cross links added back
  const LINE_GAP = 8;         // clear space between a line and the pictures it joins
  const DATE_SIZE = 10;       // how big a date is set on a line with room for it
  const LABEL_MIN = 34;       // and the shortest line that can carry one at all
  const CAPTION_ROOM = 30;    // the strip under a picture its caption is printed on

  // The map draws itself outwards from the middle, and is meant to be
  // watched doing it: a line travels to a picture, the picture comes
  // up, and only then do its own lines set off. These four numbers are
  // the whole of that pace — raise them and it spreads more slowly.
  const NAME_AFTER_MS = 420;    // pause between the page finishing and the buttons arriving
  const ROUTE_AFTER_MS = 760;   // and before the first lines set off
  const ROUTE_MS_PER_PX = 1.35; // how long a line takes per pixel of its own length
  const LINK_DELAY_MS = 150;    // the pause at a picture before its own lines carry on
  const OUT_STAGGER_MS = 240;   // and between one line leaving a picture and the next
  const TIE_SPREAD_MS = 340;    // a little unevenness, so no two land in the same instant
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
  /** The white patch a picture's caption prints on, under its frame. */
  function captionBox(n) {
    return {
      left: n.x,
      top: n.y + n.size + 2,
      right: n.x + (n.captionW || Math.min(n.size * 1.5, 168)),
      bottom: n.y + n.size + 2 + (n.captionH || CAPTION_ROOM),
    };
  }

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
      if (crosses(from, to, captionBox(n))) return false;
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

    // Nothing is left floating, and nothing is left on an island.
    // Dropping links above is what keeps the map from being one tidy
    // fan out of the middle, but it leaves two kinds of orphan behind:
    // a picture with no line at all, and — less obvious and just as
    // wrong — a pair or a huddle joined only to each other, off on
    // their own with no way back to the rest of the sheet. Both read as
    // forgotten rather than as loosely joined.
    //
    // So the parts are counted and then sewn together: keep track of
    // which pictures can already reach which, and go through every
    // possible line shortest first, taking any that joins two parts
    // that could not reach each other and has a clear run. What is left
    // is one network — still sparse, still looping, but all of a piece.
    const part = nodes.map((unused, i) => i);
    const partOf = (i) => {
      while (part[i] !== i) { part[i] = part[part[i]]; i = part[i]; }
      return i;
    };
    const sew = (i, j) => {
      const one = partOf(i), other = partOf(j);
      if (one === other) return false;
      part[one] = other;
      return true;
    };
    links.forEach((link) => sew(link.a, link.b));

    const pairs = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        pairs.push({ i: i, j: j, d: distance(nodes[i], nodes[j]) });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    pairs.forEach((pair) => {
      if (partOf(pair.i) === partOf(pair.j)) return;
      if (!clearBetween(pair.i, pair.j)) return;
      links.push({ a: pair.i, b: pair.j, tree: true });
      sew(pair.i, pair.j);
    });

    // And nothing is left hanging off the end of a single line either.
    // A picture with one line is a dead end — the map stops there
    // rather than carrying on — and with four of the thirteen like that
    // it read as a handful of stubs rather than as a route you could
    // follow. So a picture with only one line is given a second, to the
    // nearest picture it has a clear run to and is not already joined
    // to. It is not a tree link: both ends are already on the map by
    // then, so it closes a loop rather than carrying the spread, which
    // is what keeps the map arriving outwards in order.
    nodes.forEach((node, i) => {
      const joined = links.filter((link) => link.a === i || link.b === i);
      if (joined.length !== 1) return;
      const already = joined.map((link) => (link.a === i ? link.b : link.a));
      const reachable = nodes
        .map((other, j) => ({ j: j, d: distance(other, node) }))
        .filter((entry) =>
          entry.j !== i && already.indexOf(entry.j) < 0 && clearBetween(entry.j, i))
        .sort((a, b) => a.d - b.d);
      if (reachable.length) links.push({ a: reachable[0].j, b: i, tree: false });
    });

    // Which way round a line is written decides which end of it the map
    // grows from: the spread travels outwards from the middle along the
    // tree links, and each of them has to name the end nearer the
    // middle first. A line sewn on above can easily have been made the
    // other way round, so they are turned to face outwards here.
    const reached = new Set([0]);
    for (let pass = 0; pass < nodes.length; pass++) {
      let grew = false;
      links.forEach((link) => {
        if (!link.tree) return;
        if (reached.has(link.a) === reached.has(link.b)) return;
        if (!reached.has(link.a)) {
          const swap = link.a; link.a = link.b; link.b = swap;
        }
        reached.add(link.b);
        grew = true;
      });
      if (!grew) break;
    }

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
      // Lines leaving different pictures can still happen to finish at
      // the same moment, and two pictures landing together is the one
      // thing the spread is meant not to do. A fixed nudge each, rolled
      // once, is enough to keep them apart.
      link.jitter = random() * TIE_SPREAD_MS;
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
    // Where a picture sits is kept in its own properties rather than
    // written straight into a transform, so that pointing at one can
    // add a tilt to it in the stylesheet without needing to know where
    // on the sheet it is.
    plate.style.setProperty("--x", plateX + "px");
    plate.style.setProperty("--y", "0px");

    const cell = childBase * CELL_SPREAD;
    const cols = Math.max(2, Math.round(width / cell));
    const cellW = width / cols;

    // Each row is given more room than the one above it, so the sheet
    // opens out as it goes down instead of bunching up towards the
    // bottom — which means where a row starts has to be counted rather
    // than multiplied out. The room a picture's caption needs is part
    // of the row, so nothing is ever printed over anything.
    const rows = Math.ceil((rest.length * 1.75) / cols) + 1;
    const rowTop = [];
    const rowHeight = [];
    let down = 0;
    for (let r = 0; r < rows; r++) {
      rowTop.push(down);
      rowHeight.push(cell * (1 + r * ROW_OPEN) + CAPTION_ROOM);
      down += rowHeight[r];
    }

    // Every place on the grid, minus the ones the middle window is
    // standing on, shuffled. Having more places than pictures is what
    // leaves the gaps that make this a scatter rather than a table.
    const open = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const clashes =
          x < plateX + plateSize + PLATE_CLEAR && x + cellW > plateX - PLATE_CLEAR &&
          rowTop[r] < plateSize + PLATE_CLEAR;
        if (!clashes) open.push({ x: x, y: rowTop[r], h: rowHeight[r], key: random() });
      }
    }
    open.sort((a, b) => a.key - b.key);

    nodes = [{
      x: plateX, y: 0, size: plateSize,
      cx: plateX + plateSize / 2, cy: plateSize / 2,
    }];

    rest.forEach((frame, i) => {
      const spot = open[i] || { x: 0, y: 0, h: cell + CAPTION_ROOM };
      const cellH = spot.h;
      // Pictures differ a little in size, and none of them sits dead
      // centre in its own square — both are what keep the scatter from
      // resolving back into the grid it was built on.
      const size = Math.round(childBase * (1 - SIZE_VARY / 2 + random() * SIZE_VARY));
      // Wandering, but never out of its own square: the room left over
      // inside the square is the whole of what it has to wander in, so
      // two pictures can never end up on top of each other however far
      // the scatter throws them.
      const roomX = Math.max(0, (cellW - size) / 2) * CELL_JITTER;
      // Its caption is printed underneath it, so the room it may wander
      // down into is what is left once that is allowed for.
      const roomY = Math.max(0, (cellH - CAPTION_ROOM - size) / 2) * CELL_JITTER;
      const x = Math.round(spot.x + (cellW - size) / 2 + (random() - 0.5) * 2 * roomX);
      const y = Math.round(
        spot.y + (cellH - CAPTION_ROOM - size) / 2 + (random() - 0.5) * 2 * roomY
      );
      frame.style.width = (placed ? size : plateSize) + "px";
      frame.style.height = (placed ? size : plateSize) + "px";
      frame.style.setProperty("--x", (placed ? x : plateX) + "px");
      frame.style.setProperty("--y", (placed ? y : 0) + "px");

      // How much room its caption actually takes up, measured off the
      // page rather than guessed at. A guess had to allow for the
      // longest caption there might be, and "Untitled" prints a third
      // of that — on a crowded page that is the difference between a
      // map that joins up and one that falls into islands, since a line
      // is refused wherever a caption is in the way.
      //
      // It has to be read *after* the frame has been given its width,
      // and that is not a detail: a frame with no width yet shrinks to
      // nothing, its caption's max-width with it, and every caption on
      // the page measures five pixels across. Links are planned on the
      // first layout, so measuring a moment too early plans the whole
      // map against captions that are not there.
      //
      // What is read is the width of the words set on one line — the
      // pictures are all the width of the middle window at this point,
      // so nothing has wrapped yet — and how many lines that will come
      // to once the picture is its own size.
      const words = frame.querySelector(".sheet-caption");
      const printed = words ? words.getBoundingClientRect() : null;
      const room = size * 1.5;    // the same max-width the stylesheet gives it
      const lines = printed ? Math.max(1, Math.ceil((printed.width + 2) / room)) : 2;
      nodes.push({
        x: x, y: y, size: size, cx: x + size / 2, cy: y + size / 2,
        captionW: printed ? Math.min(printed.width + 2, room) : room,
        captionH: printed ? lines * printed.height + 4 : CAPTION_ROOM,
      });
    });

    planLinks();

    // Where each line runs, and how long it is.
    links.forEach((link) => {
      const from = nodes[link.a], to = nodes[link.b];
      const a = edgePoint(from, to), b = edgePoint(to, from);
      const length = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      link.line.setAttribute("x1", a.x.toFixed(1));
      link.line.setAttribute("y1", a.y.toFixed(1));
      link.line.setAttribute("x2", b.x.toFixed(1));
      link.line.setAttribute("y2", b.y.toFixed(1));
      link.length = length;
      link.draw = Math.max(260, length * ROUTE_MS_PER_PX);
      link.start = 0;

      link.line.style.strokeDasharray = length + " " + length;
      link.line.style.strokeDashoffset =
        link.line.classList.contains("drawn") ? "0" : String(length);

      // The date rides along its own line, kept upright, and is knocked
      // out of it rather than printed over it. Every line carries one:
      // a line without a date reads as unfinished beside the ones that
      // have them.
      if (length < LABEL_MIN) {
        if (link.label) { link.label.remove(); link.label = null; }
        return;
      }
      let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;

      // The one this link already has, moved — not a new one. A fresh
      // element on every layout leaves the old one behind in the
      // drawing, still covered over and never written, and starts the
      // writing again from nothing when the window is only resized.
      let label = link.label;
      if (!label) {
        label = document.createElementNS(NS, "text");
        label.setAttribute("class", "sheet-date");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dy", "-5");
        label.textContent = link.date;
        lines.appendChild(label);
        link.label = label;
      }

      // Set to fit the run it rides on. A date is about ten characters,
      // and ten characters of the ordinary size do not fit on a short
      // line — the lettering would reach past the end of its own line
      // and land on the picture there. So a short line is written
      // smaller rather than left bare, and how wide the words actually
      // come out is measured rather than guessed at: that depends on
      // the font, and the font is not ours to predict.
      let size = Math.min(DATE_SIZE, length / 6.9);
      label.style.fontSize = size.toFixed(1) + "px";
      const room = length * 0.84;
      const written = label.getComputedTextLength ? label.getComputedTextLength() : 0;
      if (written > room && written > 0) {
        size = Math.max(6.5, size * (room / written));
        label.style.fontSize = size.toFixed(1) + "px";
      }
      const words = Math.min(written || room, room);

      // Not always at the halfway point: two lines crossing near their
      // middles would print their dates on top of each other. Sliding
      // each one along its own line by a different amount is enough to
      // keep them apart without having to work out where they all are.
      // A line with barely room for its date is the exception — there
      // is nowhere to slide it to, so it goes in the middle.
      const slid = 0.38 + random() * 0.26;
      const along = length > words * 2.4 ? slid : 0.5;
      label.setAttribute(
        "transform",
        "translate(" + (a.x + (b.x - a.x) * along).toFixed(1) + "," +
        (a.y + (b.y - a.y) * along).toFixed(1) + ") " +
        "rotate(" + angle.toFixed(1) + ")"
      );
      // The white halo that knocks the line out behind the lettering is
      // scaled with it, or a small date sits in a patch cut for a
      // large one.
      label.style.strokeWidth = (size * 0.4).toFixed(1) + "px";
    });

    // When each one sets off. A picture is only reached once the line to
    // it has arrived, and its own lines leave after a pause, so the map
    // spreads outwards from the middle — a wipe rather than a switch.
    //
    // Worked out by going over the links until nothing changes rather
    // than in one pass: a link's start depends on when the picture it
    // leaves from was reached, and the links are not necessarily in an
    // order where that is already known.
    // Lines leaving the same picture set off one after another rather
    // than together. Without this the five that leave the middle all go
    // at once and five pictures appear in the same instant, which is
    // the one thing the spread is meant not to do.
    const leaving = new Array(nodes.length).fill(0);
    links.forEach((link) => { if (link.tree) link.order = leaving[link.a]++; });

    const arriveAt = new Array(nodes.length).fill(null);
    arriveAt[0] = 0;
    for (let pass = 0; pass < nodes.length; pass++) {
      let moved = false;
      links.forEach((link) => {
        if (!link.tree || arriveAt[link.a] === null) return;
        const start =
          arriveAt[link.a] + LINK_DELAY_MS + link.order * OUT_STAGGER_MS + (link.jitter || 0);
        if (link.start === start && arriveAt[link.b] !== null) return;
        link.start = start;
        arriveAt[link.b] = start + link.draw;
        moved = true;
      });
      if (!moved) break;
    }

    // Anything still unreached arrives as though a line had travelled
    // out to it, so it keeps step with the rest of the spread.
    nodes.forEach((node, i) => {
      if (arriveAt[i] === null) {
        arriveAt[i] = LINK_DELAY_MS + distance(node, nodes[0]) * ROUTE_MS_PER_PX;
      }
      node.arriveAt = arriveAt[i];
    });
    // A line that only closes a loop waits for both of its ends to be
    // there before it is drawn.
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

    // The two buttons above the page arrive once it has finished
    // drawing itself, not when the flick stops: the page puts itself
    // together, and then hands you the controls.
    const drawnAt = nodes.reduce((m, n) => Math.max(m, n.arriveAt || 0), 0);
    setTimeout(
      () => document.body.classList.add("sheet-named"),
      REDUCE_MOTION ? 0 : ROUTE_AFTER_MS + drawnAt + NAME_AFTER_MS
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
        // Eased rather than at a constant rate: a line that sets off
        // and settles reads as being drawn, one at a steady speed as
        // being played back.
        link.line.style.transition =
          "stroke-dashoffset " + Math.round(link.draw) + "ms cubic-bezier(0.22, 0.61, 0.36, 1)";
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
  // POINTING AT A PICTURE
  //
  // The rest of the sheet steps back a little and the one under the
  // pointer leaves the flat plane of the page: it turns to face
  // wherever the cursor is, as though it were lying under glass and
  // being tipped. Its middle stays exactly where the picture was — it
  // is turning, not moving — so nothing else on the map has to shift
  // around it. It is meant to be barely there: a picture that answers
  // the hand, not a picture that jumps.
  //
  // None of it is live until the page has finished putting itself
  // together. A picture is only answering the pointer once it has
  // settled where it belongs — during the flick every one of them is
  // taking its turn in the middle window, and tipping whatever the
  // cursor happens to be over while that is going on is nonsense.
  // ============================================================
  const TIP = 6;           // degrees at the far corner of a picture
  const LIFT = 1.02;       // and how much bigger it is drawn while tipped

  /** Has this picture finished arriving? Nothing answers before then. */
  const ready = (frame) =>
    sheet.classList.contains("settled") && frame.classList.contains("landed");

  function tip(frame, event) {
    const box = frame.getBoundingClientRect();
    const acrossX = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
    const acrossY = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
    const hold = Math.max(-1, Math.min(1, acrossX));
    const rise = Math.max(-1, Math.min(1, acrossY));
    if (!ready(frame)) return;
    frame.style.setProperty("--turn-y", (hold * TIP).toFixed(2) + "deg");
    frame.style.setProperty("--turn-x", (-rise * TIP).toFixed(2) + "deg");
    frame.style.setProperty("--lift", String(LIFT));
  }

  function untip(frame) {
    frame.style.setProperty("--turn-y", "0deg");
    frame.style.setProperty("--turn-x", "0deg");
    frame.style.setProperty("--lift", "1");
  }

  frames.forEach((frame) => {
    frame.addEventListener("pointerenter", () => {
      if (ready(frame)) sheet.classList.add("peeking");
    });
    frame.addEventListener("pointermove", (e) => tip(frame, e));
    frame.addEventListener("pointerleave", () => {
      sheet.classList.remove("peeking");
      untip(frame);
    });
  });

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
