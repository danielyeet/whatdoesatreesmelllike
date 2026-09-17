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
  // The page opens ON the picture it will land on and holds it for a
  // beat before the flicking starts. Going straight into the cuts from
  // a blank page is a jolt; a moment of the piece itself first reads
  // as a projector being started rather than as a page loading.
  const FLIP_HOLD_MS = 250;
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
  const ROUTE_MS_PER_PX = 1.9;  // how long a line takes per pixel of its own length
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

  // AND THE CANVAS EVERYTHING IS DRAWN ON. The SVG above says where
  // the map runs and carries the dates, which are the one thing a
  // canvas is the wrong place for; the specks are drawn here. See
  // "THE SPECKS" below.
  const specks = document.createElement("canvas");
  specks.className = "sheet-specks";
  specks.setAttribute("aria-hidden", "true");
  sheet.insertBefore(specks, sheet.firstChild);
  const ink = specks.getContext("2d");

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

  function clearBetween(a, b, mayCross) {
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
      // `mayCross` is one picture whose own caption this line is
      // allowed to pass over. It is never passed except by the rule
      // below that saves a picture from being left on the end of a
      // single line — see the note there.
      if (i === mayCross) continue;
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
    //
    // A picture standing in a corner of the sheet with a long caption
    // can have NO clear run at all: everything below it is behind its
    // own caption and there is nothing above it. So the search is made
    // twice — once properly, and then, only if that found nothing, once
    // more allowing the line to pass over THAT PICTURE'S OWN caption.
    // A stroke running out from under a picture's own words still reads
    // as belonging to it; a picture with one line reads as the map
    // having given up. Of the two, this is the better fault, and it is
    // the only place on the sheet where a caption may be crossed at
    // all.
    nodes.forEach((node, i) => {
      const joined = links.filter((link) => link.a === i || link.b === i);
      if (joined.length !== 1) return;
      const already = joined.map((link) => (link.a === i ? link.b : link.a));
      const near = (mayCross) => nodes
        .map((other, j) => ({ j: j, d: distance(other, node) }))
        .filter((entry) =>
          entry.j !== i && already.indexOf(entry.j) < 0 &&
          clearBetween(entry.j, i, mayCross))
        .sort((a, b) => a.d - b.d);
      const reachable = near(-1).length ? near(-1) : near(i);
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

    // WHICH squares get used is the scatter; the ORDER they are filled
    // in is a separate question, and the answer is straight down the
    // page. The shuffle above picks the squares — which is what leaves
    // the gaps that keep this from being a table — and then the ones
    // picked are put back into reading order, so the second picture in
    // the page is the one nearest the top, the third the one after it,
    // and so on to the bottom. The owner asked for the pictures to run
    // 1 to 13 down the page without the look of the scatter changing,
    // and this is exactly that: the same squares, filled in a different
    // order.
    const taken = open.slice(0, rest.length);
    taken.sort((a, b) => (a.y - b.y) || (a.x - b.x));

    nodes = [{
      x: plateX, y: 0, size: plateSize,
      cx: plateX + plateSize / 2, cy: plateSize / 2,
    }];

    rest.forEach((frame, i) => {
      const spot = taken[i] || { x: 0, y: 0, h: cell + CAPTION_ROOM };
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

    // The canvas covers the whole sheet and stands in the sheet's own
    // coordinates, so it is carried up and down with the page: the
    // specks stay exactly where the map put them however far you have
    // scrolled.
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    specks.width = Math.round(width * ratio);
    specks.height = Math.round(height * ratio);
    specks.style.width = width + "px";
    specks.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintSpecks();
  }

  // ============================================================
  // THE SPECKS
  //
  // Every edge on this sheet is a chain of them: a picture is bounded
  // by specks joined with fine lines rather than by a ruled border,
  // and a line between two pictures is a run of them rather than a
  // stroke. The owner asked for both, after the web the chamber's
  // cursor strings between whatever it is near.
  //
  // THEY ARE STILL. Where a speck stands is worked out from what it
  // belongs to and its number along it, through `wobble` below, so the
  // same speck is in the same place on every redraw — a resize moves
  // the map and the specks go with it rather than being re-rolled into
  // a different pattern. Nothing here is on a clock: the canvas is
  // drawn while the map is arriving and then left exactly as it is.
  // ============================================================
  const EDGE_EVERY = 7;       // how far apart the specks round a picture stand
  const EDGE_WANDER = 1.6;    // and how far off its edge they may stand
  // THE RUN ALONG A LINE BETWEEN TWO PICTURES: dense, and well off the
  // line. The owner asked for the connections to read as geometric
  // rather than as simple lines, and what does that is a crowd of
  // specks scattered about the run and netted to each other rather
  // than a few threaded along it.
  // A RUN IS SEVERAL PARALLEL LINES, NOT ONE. Two or three of them,
  // evenly spaced along their own length and standing a fixed distance
  // apart, with rungs across them every so often and the whole thing
  // drawing together to a point at each end. That is what makes a
  // connection read as built rather than drawn: a truss between two
  // pictures. A single scattered line of specks read as a smudge.
  const ROUTE_EVERY = 3.6;    // how far apart the specks along one rail stand
  const RAILS = [2, 3];       // how many rails a run carries
  const RAIL_GAP = 6;         // how far apart they stand at the middle
  const RAIL_OFF = 0.8;       // and how far off its own rail a speck may stand
  const RUNG_EVERY = 6;       // a rung across the rails every so many specks
  // AND THE ENDS ARE KNOTS. Where a run meets a picture the rails come
  // together and the specks crowd: the owner asked for the places a
  // line connects to a box to be emphasised and compacted, and a crowd
  // at a point is what that is.
  const KNOT = 10;            // how many specks are added at each end
  const KNOT_SPREAD = 6;      // and how far they are scattered round it
  const SPECK_MIN = 1;        // how big a speck is drawn, in pixels
  const SPECK_MAX = 2.7;
  const WEB_REACH = 15;       // two specks nearer than this are joined
  const WEB_MISS = 0.22;      // and this share of those joins are left out
  const EDGE_INK = 0.7;       // how heavily a speck round a picture is drawn
  const ROUTE_INK = 0.5;      // and one on a line between two
  const WEB_INK = 0.3;        // and the join between two of them
  // WHAT POINTING AT A PICTURE DOES. The specks belonging to it come
  // loose and drift about their own places, and are drawn a little
  // soft, while the rest of the sheet steps back — so the picture is
  // isolated on the page without anything moving that anybody is
  // reading. This page answered nothing at all for two rounds; the
  // owner has asked for it back, in this shape.
  const HOT_DRIFT = 2.4;      // how far a speck comes off its place, in pixels
  const HOT_RATE = [0.18, 0.5]; // and how slowly, in turns a second
  const HOT_BLUR = 1.1;       // how soft one is drawn, in pixels
  const HOT_LIFT = 1.35;      // and how much more plainly
  const COLD_INK = 0.4;       // what is left of everything else
  // AND THE ONES STANDING OFF THE CHAIN. A run of specks at even
  // spacing with a line through them is a dashed border; what makes it
  // read as the chamber's web instead is the few that stand a little
  // off it and are joined back in.
  //
  // WHICH ones has to be uneven. Every fourth speck pushed out was
  // worse than none at all: an even rhythm of them all standing the
  // same way out came out as a saw-tooth frill round each picture
  // rather than as a net. So it is a roll against this, and how far
  // out is rolled too.
  const LOOSE_ODDS = 0.18;
  const LOOSE_OUT = [2.5, 6];
  // HOW FAR ALONG THE EDGE A TUFT REACHES from the point a line is
  // tied to the picture. The pictures are ruled again, so this is an
  // embellishment where the map meets one rather than a border in its
  // own right.
  const TUFT_REACH = 42;
  const INK = "23,23,15";     // --ink

  /** One number between 0 and 1 for a given speck of a given thing,
      the same every time it is asked. What makes the drawing steady:
      re-rolled on each redraw instead, every resize would come out as
      a different scatter. */
  function wobble(of, n, salt) {
    let h = ((of + 1) * 374761393 + (n + 1) * 668265263 + salt * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  /** The chain of specks round one picture — but only WHERE SOMETHING
      IS TIED TO IT. The pictures carry their own ruled border again
      (the owner asked for the classic one back), so a chain all the
      way round would be the same edge drawn twice; what is left is a
      tuft of specks where each line meets the picture, thinning out
      along the edge either side of it. Corners are still landed on
      exactly where a tuft reaches one — a square whose corners are
      guessed at reads as a blob. */
  function edgeChain(node, of, ties) {
    const out = [];
    const sides = Math.max(2, Math.round(node.size / EDGE_EVERY));
    const many = sides * 4;
    for (let n = 0; n < many; n++) {
      const t = (n / many) * 4;
      const side = Math.floor(t), along = t - side;
      let x, y, nx, ny;
      if (side === 0) { x = node.x + node.size * along; y = node.y; nx = 0; ny = -1; }
      else if (side === 1) { x = node.x + node.size; y = node.y + node.size * along; nx = 1; ny = 0; }
      else if (side === 2) { x = node.x + node.size * (1 - along); y = node.y + node.size; nx = 0; ny = 1; }
      else { x = node.x; y = node.y + node.size * (1 - along); nx = -1; ny = 0; }
      const corner = along < 0.001;
      const off = corner ? 0 : (wobble(of, n, 1) - 0.5) * 2 * EDGE_WANDER;
      const drift = corner ? 0 : (wobble(of, n, 2) - 0.5) * EDGE_EVERY * 0.5;
      const loose = !corner && wobble(of, n, 7) < LOOSE_ODDS
        ? LOOSE_OUT[0] + wobble(of, n, 8) * (LOOSE_OUT[1] - LOOSE_OUT[0])
        : 0;
      // How near this speck is to something tied to the picture here.
      // Nothing is drawn where nothing is tied.
      let near = Infinity;
      for (let t = 0; t < ties.length; t++) {
        const away = Math.hypot(x - ties[t].x, y - ties[t].y);
        if (away < near) near = away;
      }
      if (near > TUFT_REACH) continue;
      out.push({
        x: x + nx * (off + loose) + ny * drift,
        y: y + ny * (off + loose) - nx * drift,
        size: SPECK_MIN + wobble(of, n, 3) * (SPECK_MAX - SPECK_MIN) + (corner ? 0.6 : 0),
        loose: loose > 0,
        // Thinning out along the edge away from what is tied there.
        fade: 1 - Math.pow(near / TUFT_REACH, 1.15),
      });
    }
    return out;
  }

  /** And the run of them along one line between two pictures: two or
      three parallel rails of specks, evenly spaced along their length,
      with rungs across them and both ends drawn together into a knot
      where the run meets the picture.

      Evenly spaced and parallel ON PURPOSE. Scattered about the line,
      a run reads as a smudge between two pictures; ruled like this it
      reads as something built, which is what the owner asked for —
      "denser in particles and slightly more dispersed, so that it
      looks more like geometric connections rather than simple lines".

      The rails PINCH at both ends: they are furthest apart in the
      middle and meet at the two points the line is tied to, so a run
      leaves a picture from one place rather than from a smear along
      its edge. */
  function routeRun(a, b, of) {
    const out = [];
    out.rungs = [];
    const far = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / far, uy = (b.y - a.y) / far;
    const rails = RAILS[0] + Math.floor(wobble(of, 0, 11) * (RAILS[1] - RAILS[0] + 1));
    const many = Math.max(2, Math.round(far / ROUTE_EVERY));
    // A run's own spacing varies a little from its neighbours', or a
    // sheet of them reads as one drawing repeated.
    const gap = RAIL_GAP * (0.8 + wobble(of, 0, 12) * 0.5);

    /** Where a speck on rail `r` stands at `t` along the run. */
    const place = (r, t, n) => {
      const spread = rails === 1 ? 0 : (r - (rails - 1) / 2) * gap;
      // Sine: nothing at the two ends, everything in the middle.
      const pinch = Math.sin(Math.PI * t);
      const off = spread * pinch +
        (wobble(of, n * 7 + r, 4) - 0.5) * 2 * RAIL_OFF;
      const at = t * far;
      return {
        x: a.x + ux * at - uy * off,
        y: a.y + uy * at + ux * off,
        size: SPECK_MIN + wobble(of, n * 3 + r, 5) * (SPECK_MAX - SPECK_MIN),
        at: at,
      };
    };

    for (let r = 0; r < rails; r++) {
      for (let n = 0; n <= many; n++) out.push(place(r, n / many, n));
    }

    // THE RUNGS. Every so many specks, one rail is tied across to the
    // next — regular, because what is being drawn is a structure.
    for (let n = RUNG_EVERY; n < many; n += RUNG_EVERY) {
      for (let r = 0; r + 1 < rails; r++) {
        const one = place(r, n / many, n);
        const two = place(r + 1, n / many, n);
        out.rungs.push({ x1: one.x, y1: one.y, x2: two.x, y2: two.y, at: one.at });
      }
    }

    // THE KNOTS at each end.
    [0, 1].forEach((end) => {
      const at = end ? far : 0;
      const px = end ? b.x : a.x, py = end ? b.y : a.y;
      for (let k = 0; k < KNOT; k++) {
        const turn = wobble(of, k + end * 40, 13) * Math.PI * 2;
        const out2 = wobble(of, k + end * 40, 14) * KNOT_SPREAD;
        out.push({
          // Kept on the picture's side of the tie point, so the crowd
          // gathers where the line lands rather than spilling across
          // the picture it is landing on.
          x: px + Math.cos(turn) * out2 + ux * (end ? -out2 : out2) * 0.5,
          y: py + Math.sin(turn) * out2 + uy * (end ? -out2 : out2) * 0.5,
          size: SPECK_MIN + wobble(of, k + end * 40, 15) * (SPECK_MAX - SPECK_MIN) + 0.4,
          at: at,
        });
      }
    });
    return out;
  }

  /** A chain drawn: the specks themselves, and the fine lines between
      the ones that are near each other. Squares on whole pixels, like
      every other speck on this site — at this size a rectangle laid
      across a pixel boundary comes out as a soft blob. */
  function drawChain(run, of, weight, upTo, state) {
    const move = state && state.move ? state.move : 0;
    const shade = state && state.ink !== undefined ? state.ink : 1;

    /** Where a speck is drawn right now. Standing still is the whole
        character of this drawing, so this is zero for everything
        except the picture the pointer is on. */
    const at = (speck, n, salt) => {
      if (!move) return speck;
      const rate = HOT_RATE[0] + wobble(of, n, salt) * (HOT_RATE[1] - HOT_RATE[0]);
      const turn = clock * rate * Math.PI * 2 + wobble(of, n, salt + 1) * Math.PI * 2;
      const out = HOT_DRIFT * move * (0.4 + wobble(of, n, salt + 2) * 0.6);
      return { x: speck.x + Math.cos(turn) * out, y: speck.y + Math.sin(turn) * out };
    };

    ink.save();
    if (move) ink.filter = "blur(" + (HOT_BLUR * move).toFixed(2) + "px)";

    ink.beginPath();
    // THE RUNGS ACROSS THE RAILS, where a run carries them.
    if (run.rungs) {
      run.rungs.forEach((rung, n) => {
        if (upTo !== undefined && rung.at > upTo) return;
        const one = at({ x: rung.x1, y: rung.y1 }, n, 21);
        const two = at({ x: rung.x2, y: rung.y2 }, n, 24);
        ink.moveTo(one.x, one.y);
        ink.lineTo(two.x, two.y);
      });
    }
    for (let n = 1; n < run.length; n++) {
      if (upTo !== undefined && run[n].at > upTo) break;
      const one = run[n - 1], two = run[n];
      // A speck standing off the chain is always joined back to the
      // one before it, or it reads as dirt on the page rather than as
      // part of the edge.
      const held = one.loose || two.loose;
      if (!held && wobble(of, n, 6) < WEB_MISS) continue;
      if (Math.hypot(two.x - one.x, two.y - one.y) > WEB_REACH + (held ? LOOSE_OUT[1] : 0)) continue;
      const from = at(one, n - 1, 31), to = at(two, n, 31);
      ink.moveTo(from.x, from.y);
      ink.lineTo(to.x, to.y);
      // And on to the next one as well, so it hangs in a net rather
      // than on a thread.
      if (two.loose && run[n + 1] && (upTo === undefined || run[n + 1].at <= upTo)) {
        const on = at(run[n + 1], n + 1, 31);
        ink.moveTo(to.x, to.y);
        ink.lineTo(on.x, on.y);
      }
    }
    ink.strokeStyle = rgba(WEB_INK * shade);
    ink.lineWidth = 1;
    ink.stroke();

    // Drawn in one pass where every speck is the same weight, and one
    // at a time where they are not: a tuft fades out along the edge,
    // and an alpha is a property of the brush rather than of a shape.
    const evenly = run.every((speck) => speck.fade === undefined);
    if (evenly) ink.fillStyle = rgba(weight * shade);
    if (evenly) ink.beginPath();
    run.forEach((speck, n) => {
      if (upTo !== undefined && speck.at > upTo) return;
      const where = at(speck, n, 31);
      const size = Math.max(1, Math.round(speck.size));
      const x = Math.round(where.x - size / 2), y = Math.round(where.y - size / 2);
      if (evenly) { ink.rect(x, y, size, size); return; }
      const lit = weight * shade * (speck.fade === undefined ? 1 : speck.fade);
      if (lit < 0.03) return;
      ink.fillStyle = rgba(lit);
      ink.fillRect(x, y, size, size);
    });
    if (evenly) ink.fill();
    ink.restore();
  }

  /** How far along its own line each route has been drawn, 0 to 1.
      Set by the arrival and left at 1 afterwards. */
  const reached = new Map();

  /** WHICH PICTURE THE POINTER IS ON, and how far its specks have come
      loose — eased, so they gather and settle rather than switching on
      and off with the hand. `clock` is what everything that moves here
      is drawn from; it only runs while something is hot. */
  let hotNode = -1;
  let heat = 0;
  let clock = 0;

  function paintSpecks() {
    if (!nodes.length) return;
    ink.clearRect(0, 0, specks.width, specks.height);
    if (!placed) return;

    // Where each line is tied to each picture, worked out first: the
    // tufts are drawn round those points and nowhere else.
    const tied = nodes.map(() => []);
    links.forEach((link) => {
      const got = reached.has(link) ? reached.get(link) : 0;
      if (got <= 0) return;
      const from = nodes[link.a], to = nodes[link.b];
      tied[link.a].push(edgePoint(from, to));
      // The far end is only tied once the line has reached it.
      if (got > 0.98) tied[link.b].push(edgePoint(to, from));
    });

    // WHAT IS HOT AND WHAT IS NOT. With a picture pointed at, its own
    // specks and the runs tied to it come loose and are drawn a little
    // soft and a little heavier, and everything else steps back — so
    // the one picture is isolated on the page without anything that is
    // being read having moved.
    const cold = heat > 0.01 ? COLD_INK + (1 - COLD_INK) * (1 - heat) : 1;
    const mine = (i) => hotNode >= 0 && i === hotNode;

    nodes.forEach((node, i) => {
      if (i > 0 && !rest[i - 1].classList.contains("landed")) return;
      if (!tied[i].length) return;
      const hot = mine(i);
      drawChain(edgeChain(node, i, tied[i]), i,
        EDGE_INK * (hot ? HOT_LIFT : 1),
        undefined,
        { move: hot ? heat : 0, ink: hot ? 1 : cold });
    });

    links.forEach((link, i) => {
      const got = reached.has(link) ? reached.get(link) : 0;
      if (got <= 0) return;
      const from = nodes[link.a], to = nodes[link.b];
      const a = edgePoint(from, to), b = edgePoint(to, from);
      const run = routeRun(a, b, 100 + i);
      const hot = mine(link.a) || mine(link.b);
      drawChain(run, 100 + i,
        ROUTE_INK * (hot ? HOT_LIFT : 1),
        got * Math.hypot(b.x - a.x, b.y - a.y),
        { move: hot ? heat * 0.7 : 0, ink: hot ? 1 : cold });
    });
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
        reached.set(link, 1);
        if (link.label) link.label.classList.add("shown");
      });
      rest.forEach((frame, i) => land(i + 1));
      paintSpecks();
      sheet.classList.add("drawn");
      return;
    }

    // Each line reaches out, and the picture at the far end of it
    // appears as it lands — appears, not fades: the same hard cut the
    // flick is made of, so the whole page is drawn in one language.
    //
    // A line reaching out is its specks being laid down one after
    // another from the picture it leaves. It used to be a stroke with
    // its own dash offset eased by the stylesheet; the run of specks
    // is drawn on the canvas, so how far each line has got is kept
    // here (`reached`) and the whole sheet is repainted while any of
    // them is still travelling. Once the last has landed the loop
    // stops and the canvas is left exactly as it is — nothing on this
    // page moves again.
    links.forEach((link) => {
      setTimeout(() => {
        link.line.classList.add("drawn");
        setTimeout(() => { if (link.label) link.label.classList.add("shown"); }, link.draw);
      }, ROUTE_AFTER_MS + link.start);
    });
    nodes.forEach((node, i) => {
      if (i === 0) return;
      setTimeout(() => land(i), ROUTE_AFTER_MS + node.arriveAt);
    });
    drawOut();
  }

  /** The map being drawn: every line's own share of it worked out from
      the clock, so a slow machine draws the same map more coarsely
      rather than a different one. Eased rather than run at a steady
      rate — a line that sets off and settles reads as being drawn, one
      at a constant speed as being played back. */
  function drawOut() {
    const began = window.performance && window.performance.now
      ? window.performance.now() : Date.now();
    // Eased flat at BOTH ends now rather than only at the finish. A
    // line used to leave its picture at its fastest and settle at the
    // far end; taken away gently as well, there is no moment in the
    // whole spread you can point at where something starts.
    const settled = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    // The last thing to happen, whichever it is: the end of the last
    // line, or the last picture appearing. A picture appears on a
    // timer of its own, so stopping the moment the lines are done can
    // leave the last chain of specks undrawn until something else asks
    // for a repaint.
    const done = links.reduce((m, l) => Math.max(m, l.start + l.draw), 0);
    const lands = nodes.reduce((m, n) => Math.max(m, n.arriveAt || 0), 0);
    const over = ROUTE_AFTER_MS + Math.max(done, lands) + 120;
    const tick = (now) => {
      const gone = now - began;
      links.forEach((link) => {
        const t = (gone - ROUTE_AFTER_MS - link.start) / link.draw;
        reached.set(link, t <= 0 ? 0 : t >= 1 ? 1 : settled(t));
      });
      paintSpecks();
      if (gone < over) requestAnimationFrame(tick);
      // AND THE PAGE SAYS WHEN IT HAS FINISHED DRAWING ITSELF. The
      // pictures are all in place a moment before the map is: a line
      // that closes a loop lands after the picture at the end of it
      // did, so `.landed` on every frame is not the end of it.
      else sheet.classList.add("drawn");
    };
    requestAnimationFrame(tick);
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
    // The picture it will land on, held for a beat — see FLIP_HOLD_MS.
    show(0);

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
    setTimeout(() => {
      show(index);
      setTimeout(step, Math.round(hold));
    }, FLIP_HOLD_MS);
  }

  // ============================================================
  // WHAT POINTING AT A PICTURE DOES
  //
  // The specks belonging to it come loose: they drift about their own
  // places, are drawn a little softer and a little heavier, and the
  // rest of the sheet steps back behind them. The picture is isolated
  // on the page — which is what the owner asked for — WITHOUT ANYTHING
  // THAT IS BEING READ MOVING. The picture itself does not tip, lift,
  // or shift by a pixel; only what is drawn round it does.
  //
  // A picture used to tip in three dimensions towards the cursor
  // instead (`perspective()`, `--turn-x`, `--turn-y`, `.peeking`).
  // That was taken out when the owner asked for no reactivity at all,
  // and this is what they asked for in its place. The frame's own
  // transform is still only the `translate()` that places it.
  //
  // NOTHING MOVES UNTIL SOMETHING IS POINTED AT. The canvas is drawn
  // once and left; the loop below runs only while a picture is hot or
  // cooling, and stops again.
  // ============================================================
  let warming = false;
  let beat = 0;

  function warm(now) {
    const step = Math.min(0.05, (now - beat) / 1000) || 0.016;
    beat = now;
    clock += step;
    const want = hotNode >= 0 ? 1 : 0;
    heat += (want - heat) * Math.min(1, step * 6);
    paintSpecks();
    if (hotNode >= 0 || heat > 0.01) requestAnimationFrame(warm);
    else { heat = 0; warming = false; paintSpecks(); }
  }

  function heatUp() {
    if (warming || REDUCE_MOTION) {
      if (REDUCE_MOTION) { heat = hotNode >= 0 ? 1 : 0; paintSpecks(); }
      return;
    }
    warming = true;
    beat = window.performance && window.performance.now
      ? window.performance.now() : Date.now();
    requestAnimationFrame(warm);
  }

  frames.forEach((frame, i) => {
    frame.addEventListener("pointerenter", () => {
      // Not while the sheet is still drawing itself: every picture
      // takes its turn in the middle window during the flick, so
      // answering whatever the pointer happens to be over then is
      // nonsense.
      if (!sheet.classList.contains("drawn")) return;
      hotNode = i;
      frame.classList.add("hot");
      sheet.classList.add("holding");
      heatUp();
    });
    frame.addEventListener("pointerleave", () => {
      if (hotNode !== i) return;
      hotNode = -1;
      frame.classList.remove("hot");
      sheet.classList.remove("holding");
      heatUp();
    });
  });
  // ============================================================

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

  // The first layout is where every picture STARTS. `placing` holds off
  // the transition that places them for that one frame, or each of them
  // slides in from the corner of the sheet as the page opens; and the
  // page is only shown once they are where they belong, so what the
  // browser painted before this — the no-script grid of every picture
  // — is never seen. Both are undone on the next frame.
  sheet.classList.add("placing");
  layout();
  document.documentElement.classList.remove("js-coming");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sheet.classList.remove("placing");
  }));
  window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  if (REDUCE_MOTION || frames.length < 2) settle();
  else flick();
})();
