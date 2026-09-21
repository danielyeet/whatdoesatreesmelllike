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
  /** Whether the picture at this place has a page of its own yet. The
      page says so on the frame; nothing here guesses at it. */
  const unwritten = (i) => !!(frames[i] && frames[i].dataset.open === "no");
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
  // NINE CUTS, AND HALF AGAIN AS LONG AS THEY FIRST WERE. It was 18
  // cuts over about three seconds; halving both was too much of a good
  // thing, and the owner asked for the flashing back up by half. So it
  // is 9 cuts over about a second and a half: the count stays where it
  // was asked to be and each cut is held longer. They slow steeply
  // (FLIP_SLOW), so it still ends by coming to rest rather than
  // stopping.
  // The BEAT BEFORE IT STARTS is not part of what the owner asked to
  // be halved — that was the cycling — and it is what makes the page
  // read as a projector being started. Left where it was.
  const FLIP_HOLD_MS = 250;
  const FLIP_FIRST_MS = 48;
  const FLIP_SLOW = 1.29;
  const FLIP_LAST_MS = 375;

  // The map. Sizes are shares of the sheet's own width, so the whole
  // arrangement scales rather than being pinned to one screen.
  const PLATE_SHARE = 0.38, PLATE_MIN = 250, PLATE_MAX = 430;
  // BIGGER, which the owner asked for: they were a ninth of the sheet
  // across and never more than 152px, which on a wide window is a page
  // of stamps.
  const CHILD_SHARE = 0.175, CHILD_MIN = 130, CHILD_MAX = 236;
  // COMPACT. It was 1.6 with a seventh more room a row, which on a
  // wide window left the sheet more air than pictures — the owner
  // asked for the empty space back.
  const CELL_SPREAD = 1.3;    // how much room each picture is given, as a multiple of itself
  // ...and a little more of it the further down the page it is, so the
  // sheet opens out as it goes rather than bunching up towards the
  // bottom. Gently: at 0.16 the map became a third empty.
  const ROW_OPEN = 0.025;     // each row this much roomier than the one above
  const CELL_JITTER = 0.85;   // how much of the room left over it may wander in
  const SIZE_VARY = 0.2;      // how much the pictures differ in size before depth

  // THE MAP STANDS IN THREE DIMENSIONS. Every picture but the middle
  // window is given a depth of its own and then PROJECTED: what is
  // further back is drawn smaller, fainter and nearer the vanishing
  // point, and what is in front of it is drawn over it. The owner asked
  // for the map to be 3D, with depth, and for the pictures to be
  // different sizes — which this is the same answer to, since how big
  // one is drawn is now mostly how far away it is standing.
  //
  // It is done HERE rather than with a CSS `perspective`, and that is
  // the whole reason it works: the lines between the pictures are drawn
  // on a canvas from these same numbers, so projecting the numbers
  // moves the pictures and their lines together. A transform in the
  // stylesheet would move the pictures and leave every line behind.
  // DEEPER THAN IT WAS. At 430 against a focal length of 1500 the
  // furthest picture was drawn at 78% of the nearest and the owner
  // could not see the volume at all; at 640 against 1050 it is 62%,
  // which is a picture standing plainly further off.
  const DEPTH_MAX = 640;      // how far back a picture may stand
  const FOCAL = 1050;         // how strongly it recedes; lower is stronger
  // ROOM ROUND THE MIDDLE WINDOW. It was raised to 130 for a round, to
  // stop the nearest pictures being projected in so close to the plate
  // that the line between them had a dozen pixels to run in — and that
  // was the wrong end of the problem: on a sheet 1240 across, a plate
  // 430 wide with 130 either side leaves no column clear at all, so
  // the top two rows stood empty and the page opened on a band of
  // nothing. The short lines are refused where they are made now
  // (`farEnough`), and this is back to the space a picture needs.
  const PLATE_CLEAR = 44;     // space kept clear around the middle window

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
  // What stands in for a date on a line reaching a picture that has
  // nothing written behind it yet. The owner wrote thirteen crosses;
  // it is TEN here, which is exactly the length of a date — and that
  // matters more than the count does. Every rule about where a date may
  // be printed, how small it is set on a short line and how far it may
  // be slid to clear a caption is worked out from the ten characters a
  // date comes to, and at thirteen the crosses kept being the one
  // label on the sheet that would not fit anywhere clear.
  const NO_DATE = "xxxxxxxxxx";
  const LABEL_MIN = 26;       // and the shortest line that can carry one at all
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

  /** How long the line between these two would actually be drawn — the
      run left once it has cleared both frames. */
  function runBetween(a, b) {
    const from = edgePoint(a, b), to = edgePoint(b, a);
    return Math.hypot(to.x - from.x, to.y - from.y);
  }

  /** AND LONG ENOUGH TO CARRY ITS DATE. Two pictures standing at
      different depths can come out close together on the window even
      though the scatter kept them in cells of their own — that is what
      depth looks like — and a run of a dozen pixels between them is
      not a line on a map, it is a nick. Every line here carries a date
      and there is a test that says so, so a pair this close is simply
      not joined: one of them links to something further off instead. */
  // The floor is LABEL_MIN with room to spare on top of it: the line
  // is drawn a little shorter than the run measured here, because it
  // stops clear of the tie marks at each end.
  const LINK_MIN = LABEL_MIN + 16;
  const farEnough = (a, b) => runBetween(nodes[a], nodes[b]) >= LINK_MIN;

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
        .filter((candidate) => farEnough(candidate.j, entry.i) &&
                               clearBetween(candidate.j, entry.i));
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
        .filter((candidate) => farEnough(a, candidate.j) &&
                               clearBetween(a, candidate.j));
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
    // SHORTEST FIRST, BUT NOT TOO SHORT. This pass takes whatever joins
    // two parts that cannot otherwise reach each other, and since it
    // works shortest first it is exactly where a run of twenty pixels
    // comes from — which carries no date, and a line without one reads
    // as unfinished beside the ones that have them. So it is made
    // twice: once over the runs long enough to carry a date, and then,
    // only for anything still cut off, once more over all of them. An
    // island joined by a short line is better than an island.
    [true, false].forEach((mind) => {
      pairs.forEach((pair) => {
        if (partOf(pair.i) === partOf(pair.j)) return;
        if (mind && !farEnough(pair.i, pair.j)) return;
        if (!clearBetween(pair.i, pair.j)) return;
        links.push({ a: pair.i, b: pair.j, tree: true });
        sew(pair.i, pair.j);
      });
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
      // And the same rule as the sewing pass: a second line long enough
      // to carry a date first, and any second line at all rather than
      // leave the picture a dead end.
      const pick = (list) => list.filter((entry) => farEnough(entry.j, i));
      const plain = near(-1), crossing = near(i);
      const reachable = pick(plain).length ? pick(plain)
        : (pick(crossing).length ? pick(crossing)
          : (plain.length ? plain : crossing));
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
      //
      // EXCEPT WHERE THERE IS NOTHING BEHIND THE PICTURE YET. A frame
      // marked `data-open="no"` is one with no page of its own, so a
      // date on the line reaching it would be a date about nothing; the
      // owner asked for those to read as crosses instead. The roll
      // still happens either way, so which pictures are written up does
      // not change where anything else on the map ends up.
      const day = 1 + Math.floor(random() * 28);
      const month = 1 + Math.floor(random() * 12);
      const year = 2016 + Math.floor(random() * 10);
      link.date = (unwritten(link.a) || unwritten(link.b))
        ? NO_DATE
        : String(day).padStart(2, "0") + "." + String(month).padStart(2, "0") + "." + year;
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
    // Places per picture: more of them is more of the gaps that make
    // this a scatter rather than a table, and 1.75 was more gap than
    // sheet.
    const rows = Math.ceil((rest.length * 1.4) / cols) + 1;
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
        // THE PLACES BESIDE THE MIDDLE WINDOW ARE TAKEN FIRST. Which
        // squares get used is a shuffle, and left to itself it would
        // often leave the two rows either side of the plate empty —
        // which is a band of nothing across the top of the sheet and
        // most of what the owner meant by "THAT much empty space".
        // Nudging their keys down puts them near the front of the
        // shuffle without fixing the order of anything.
        const beside = r < 2 ? 0.55 : 0;
        if (!clashes) {
          open.push({ x: x, y: rowTop[r], h: rowHeight[r], key: random() - beside });
        }
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

    // THE VANISHING POINT is the middle window's own middle: the plate
    // stands at the front of the volume (depth 0) and everything else
    // recedes towards where it is.
    const vanX = plateX + plateSize / 2;
    const vanY = plateSize / 2;
    /** Where a picture of this size, at this place, standing this far
        back, is actually drawn. */
    function project(x, y, size, z) {
      const k = FOCAL / (FOCAL + z);
      const drawn = Math.max(24, Math.round(size * k));
      const midX = vanX + (x + size / 2 - vanX) * k;
      const midY = vanY + (y + size / 2 - vanY) * k;
      return { x: Math.round(midX - drawn / 2), y: Math.round(midY - drawn / 2),
               size: drawn, k: k };
    }

    nodes = [{
      x: plateX, y: 0, size: plateSize, z: 0,
      cx: plateX + plateSize / 2, cy: plateSize / 2,
    }];
    plate.style.zIndex = "1000";
    plate.style.setProperty("--depth", "0");

    // EVERY PLACE WORKED OUT BEFORE ANY PICTURE IS PUT IN ONE, and then
    // sorted by where it comes out ON THE WINDOW. The owner asked for
    // the pictures to run 01, 02, 03 down the page, and with depth in
    // the map that is no longer the order their cells stand in: a
    // picture standing far back is drawn nearer the vanishing point, so
    // a low cell at depth can come out above a high one at the front.
    // Sorting the PROJECTED places is what keeps the reading order the
    // reading order.
    // NOTHING IS DRAWN OVER ANYTHING ELSE.
    //
    // The grid these places come off cannot overlap: every picture is
    // inside its own square and the room its caption needs is counted
    // into the row. THE DEPTH CAN, though, and that is a different
    // thing — a picture standing far back is drawn smaller and nearer
    // the vanishing point, and on a sheet only two columns wide that
    // pull is most of a column. So a deep picture from a low row lands
    // on top of a shallow one from a high one. On a phone, which is
    // exactly where the sheet comes out two columns wide, that was five
    // pictures printed over each other and their captions written
    // through the frames underneath.
    //
    // So a picture that would land on something already placed is STOOD
    // NEARER, a step at a time, until it is clear. At depth nought it
    // is back in its own square, where nothing can reach it, so this
    // always finishes. It costs some of the volume where there is no
    // room for it and NOTHING AT ALL where there is: measured on a
    // 1280 window, no picture on the sheet moves by a pixel.
    // A REAL OVERLAP, not a touch. Two pictures whose edges meet by a
    // pixel are side by side, and standing one of them nearer to
    // separate them would move a picture on a wide sheet to fix
    // something nobody can see. `TOUCH` is what has to be covered
    // before it counts as one thing printed over another; the caption
    // is part of what a picture takes up, since it is printed in the
    // strip underneath it.
    const TOUCH = 4;
    const DEPTH_STEP = DEPTH_MAX / 14;
    const standing = [{ x: plateX, y: 0, size: plateSize }];
    const clashes = (at) => standing.some((was) => {
      const ox = Math.min(at.x + at.size, was.x + was.size) - Math.max(at.x, was.x);
      const oy = Math.min(at.y + at.size + CAPTION_ROOM, was.y + was.size + CAPTION_ROOM) -
                 Math.max(at.y, was.y);
      return ox > TOUCH && oy > TOUCH;
    });

    const plan = taken.map((spot) => {
      const cellH = spot.h;
      // Pictures differ a little in size, and none of them sits dead
      // centre in its own square — both are what keep the scatter from
      // resolving back into the grid it was built on. (Most of the
      // difference in size is depth now; this is the rest of it.)
      const size = Math.round(childBase * (1 - SIZE_VARY / 2 + random() * SIZE_VARY));
      // Wandering, but never out of its own square: the room left over
      // inside the square is the whole of what it has to wander in.
      const roomX = Math.max(0, (cellW - size) / 2) * CELL_JITTER;
      // Its caption is printed underneath it, so the room it may wander
      // down into is what is left once that is allowed for.
      const roomY = Math.max(0, (cellH - CAPTION_ROOM - size) / 2) * CELL_JITTER;
      const x = Math.round(spot.x + (cellW - size) / 2 + (random() - 0.5) * 2 * roomX);
      const y = Math.round(
        spot.y + (cellH - CAPTION_ROOM - size) / 2 + (random() - 0.5) * 2 * roomY
      );
      // HOW FAR BACK IT STANDS, and everything that follows from it.
      // What is in front is drawn over what is behind (`zIndex`), and
      // what is behind gives up some of its ink (`--depth`, which the
      // stylesheet reads).
      let z = random() * DEPTH_MAX;
      let at = project(x, y, size, z);
      let guard = 0;
      while (z > 0 && guard++ < 20 && clashes(at)) {
        z = Math.max(0, z - DEPTH_STEP);
        at = project(x, y, size, z);
      }
      standing.push(at);
      return { put: at, z: z };
    });
    plan.sort((a, b) => (a.put.y - b.put.y) || (a.put.x - b.put.x));

    rest.forEach((frame, i) => {
      const one = plan[i] || plan[plan.length - 1] ||
        { put: { x: 0, y: 0, size: childBase }, z: 0 };
      const put = one.put;
      const deep = one.z / DEPTH_MAX;
      frame.style.width = (placed ? put.size : plateSize) + "px";
      frame.style.height = (placed ? put.size : plateSize) + "px";
      frame.style.setProperty("--x", (placed ? put.x : plateX) + "px");
      frame.style.setProperty("--y", (placed ? put.y : 0) + "px");
      frame.style.setProperty("--depth", deep.toFixed(3));
      frame.style.zIndex = String(1000 - Math.round(one.z));

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
      const room = put.size * 1.5;   // the same max-width the stylesheet gives it
      const lines = printed ? Math.max(1, Math.ceil((printed.width + 2) / room)) : 2;
      nodes.push({
        x: put.x, y: put.y, size: put.size, z: one.z, deep: deep,
        cx: put.x + put.size / 2, cy: put.y + put.size / 2,
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
      // ...and how many characters it actually is, rather than the ten a
      // date comes to: the crosses that stand in for a date nobody has
      // written yet are thirteen, and at a date's own size two of them
      // no longer fitted the shortest lines on the map.
      const chars = Math.max(10, (link.date || "").length);
      let size = Math.min(DATE_SIZE, (length / 6.9) * (10 / chars));
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
      //
      // AND THE DATE IS HELD TO THE SAME RULE THE LINE IS. A line is
      // refused wherever a caption is in the way (see `clearBetween`),
      // with one exception: the captions of the two pictures it joins,
      // which are exactly the ones a line leaving the bottom of a
      // picture runs into. The date rides on that line, so it can be
      // slid into one of those two — which is what happened the moment
      // a third house was added to the sheet and the scatter changed.
      //
      // So the slide is SEARCHED rather than taken: the random one
      // first, then a spread of others along the same line, and the
      // first that is clear of both ends' captions wins. If none is
      // clear the random one is kept, because a line without a date
      // reads as unfinished beside the ones that have them.
      //
      // `random()` is called exactly once here whatever happens. It is
      // the sheet's own seeded roll, and taking a different number of
      // turns of it would lay the whole sheet out differently.
      const slid = 0.38 + random() * 0.26;
      const half = words / 2;
      const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
      // EVERY caption, not only the two this line joins. A line never
      // crosses a caption — `clearBetween` refuses it — but the
      // lettering is set ABOVE its line (`dy`) and has a height of its
      // own, so a date can poke into a caption its own line cleared by
      // a hair. Node 0's caption is printed inside its frame rather
      // than under it, which is why `clearBetween` skips it too.
      // AND EVERY PICTURE. This used to be captions only, and that was
      // an oversight that a sparse map hid: a line never crosses a
      // picture either, but the lettering is set above its line and has
      // a height of its own, so on a map compact enough for lines to
      // run close to the pictures a date lands on one. The middle
      // window is in this list as well — it is the biggest thing on the
      // sheet and the one a date has most room to land on.
      const pads = nodes.slice(1).map(captionBox).concat(
        nodes.map((one) => ({
          left: one.x, right: one.x + one.size,
          top: one.y, bottom: one.y + one.size,
        })));
      const inBox = (x, y) => pads.some((box) =>
        x > box.left - 1 && x < box.right + 1 &&
        y > box.top - 1 && y < box.bottom + 1);
      /** Whether a date centred `at` along the line stands clear. The
          band is taken wider than the lettering on both sides rather
          than worked out from the baseline: erring outwards only moves
          a date along its own line, and erring inwards prints it on
          somebody's caption. */
      const lifts = [-size * 1.3, -size * 0.6, 0, size * 0.6, size * 1.3];
      const steps = [-half, -half * 0.75, -half / 2, -half / 4, 0,
                     half / 4, half / 2, half * 0.75, half];
      const clearAt = (at) => {
        const cx = a.x + (b.x - a.x) * at, cy = a.y + (b.y - a.y) * at;
        for (const step of steps) {
          for (const lift of lifts) {
            if (inBox(cx + ux * step - uy * lift, cy + uy * step + ux * lift)) {
              return false;
            }
          }
        }
        return true;
      };
      let along = length > words * 2.4 ? slid : 0.5;
      let clear = clearAt(along);
      if (!clear) {
        const tries = [0.5, 0.34, 0.66, 0.26, 0.74, 0.2, 0.8, 0.16, 0.84,
                       0.44, 0.56, 0.3, 0.7, 0.12, 0.88, 0.38, 0.62];
        for (const at of tries) {
          if (clearAt(at)) { along = at; clear = true; break; }
        }
      }
      // AND IF NOTHING ALONG IT IS CLEAR, IT CARRIES NO DATE. A line
      // without one reads as unfinished; a date printed across a
      // picture reads as broken, and of the two that is much the worse.
      // It used to take the random place anyway, which on a sparse map
      // never showed — the map is compact enough now that a line can
      // run the whole of its length beside something.
      // `hidden` is an HTML attribute and does nothing at all to an SVG
      // element, which is a trap worth writing down: the first go set
      // it and the lettering stayed exactly where it was.
      label.style.display = clear ? "" : "none";
      if (!clear) {
        label.classList.remove("shown");
        return;
      }
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
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
                           window.devicePixelRatio || 1);
    specks.width = Math.round(width * ratio);
    specks.height = Math.round(height * ratio);
    specks.style.width = width + "px";
    specks.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintSpecks();
  }

  // ============================================================
  // THE TRACE
  //
  // What joins two pictures on this sheet. It used to be a truss of
  // two or three ragged rails of specks with rungs across them and a
  // knot of specks crowded at each end — and round each picture, a
  // tuft of the same. The owner asked for the connections to be
  // reworked: minimal, futuristic, interesting. This is that.
  //
  //   THE TRACE   One hairline from picture to picture, broken into
  //               even dashes — a measured line off a technical
  //               drawing rather than a drawn one. Straight, because
  //               the geometry of the map is the interesting part and
  //               an elbow would only hide it.
  //   THE PULSE   A short bright run of those dashes travelling the
  //               length of the trace, each on its own clock. This is
  //               the whole of the movement on the page and the reason
  //               the map reads as live rather than printed.
  //   THE TIE     A small open square where a trace meets a picture,
  //               with a stub of line into the edge: the registration
  //               mark the rest of the site uses, doing the job the
  //               knot and the tuft used to.
  //
  // WHY IT IS DRAWN THIS WAY, and what must not come back: the old
  // drawing built every speck of every rail, every frame, and drew the
  // hot picture through `ctx.filter = "blur(...)"`. Canvas blur is a
  // full offscreen pass per call, and there is one call per picture and
  // per line — pointing at a picture dropped the page to a crawl. There
  // is NO ctx.filter here and nothing is rebuilt per frame: a trace is
  // a straight line and a phase, and drawing it is arithmetic. If
  // softness is ever wanted again, it has to come from what is drawn,
  // not from a filter.
  // ============================================================
  const DASH = 5;             // how long one dash of a trace is, in pixels
  const DASH_GAP = 5;         // and the clear page between two of them
  const TRACE_INK = 0.34;     // how heavily a trace is drawn
  const TIE = 6;              // the open square where a trace meets a picture
  const TIE_INK = 0.66;
  const TIE_STUB = 6;         // and the stub of line from it into the edge
  // THE PULSE. Long enough to read as a run of light rather than a
  // single blip, slow enough not to be busy with fourteen of them on
  // the page at once.
  const PULSE_LONG = 44;      // how much of a trace is lit at once, in pixels
  const PULSE_RATE = 46;      // how fast it travels, in pixels a second
  const PULSE_INK = 0.75;     // how bright the lit part is
  const PULSE_HOT = 2.6;      // and how much faster it runs on a hot trace
  // THE PULL. With a picture pointed at, every pulse on the map turns
  // round to run TOWARDS it — into it on the traces tied to it, and
  // towards its end of the line on all the rest — and the whole map
  // runs brighter, longer and faster while it does. The owner asked for
  // the bold run of dashes always to go to the picture under the
  // pointer, "as if there was a pull", and for it to be emphasized.
  const PULL_RATE = 1.7;      // how much faster every pulse runs while one is pointed at
  const PULL_LONG = 2.0;      // how much more of a trace is lit
  const PULL_INK = 1.45;      // and how much brighter
  const HOT_LIFT = 1.5;       // how much more plainly a hot trace is drawn
  const COLD_INK = 0.35;      // and what is left of everything else
  const INK = "23,23,15";     // --ink

  /** One number between 0 and 1 for a given thing, the same every time
      it is asked. What keeps each trace's pulse on its own clock
      without storing anything per trace. */
  function wobble(of, n, salt) {
    let h = ((of + 1) * 374761393 + (n + 1) * 668265263 + salt * 2246822519) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  /** THE TIE. An open square sitting just off the picture's edge where
      a trace leaves it, and a stub of line running from it into the
      edge. Drawn on whole pixels: at this size a square laid across a
      pixel boundary comes out as a soft blob. */
  function drawTie(x, y, towardsX, towardsY, shade) {
    const half = TIE / 2;
    ink.strokeStyle = rgba(TIE_INK * shade);
    ink.lineWidth = 1;
    ink.beginPath();
    ink.rect(Math.round(x - half) + 0.5, Math.round(y - half) + 0.5, TIE, TIE);
    // The stub points back at the picture the trace is leaving.
    const far = Math.hypot(towardsX - x, towardsY - y) || 1;
    const ux = (towardsX - x) / far, uy = (towardsY - y) / far;
    ink.moveTo(Math.round(x - ux * half) + 0.5, Math.round(y - uy * half) + 0.5);
    ink.lineTo(Math.round(x - ux * (half + TIE_STUB)) + 0.5,
               Math.round(y - uy * (half + TIE_STUB)) + 0.5);
    ink.stroke();
  }

  /** ONE TRACE, from a to b, drawn as far as `upTo` pixels along it.
      `lit` is where the pulse has got to along the same line; dashes
      inside it are drawn brighter. Everything here is a loop over the
      length of one line — no arrays are built and nothing is kept. */
  function drawTrace(a, b, of, upTo, shade, weight, lit, long, glow) {
    const runLong = long === undefined ? PULSE_LONG : long;
    const runInk = glow === undefined ? PULSE_INK : glow;
    const far = Math.hypot(b.x - a.x, b.y - a.y);
    if (far < 1) return;
    const ux = (b.x - a.x) / far, uy = (b.y - a.y) / far;
    const step = DASH + DASH_GAP;
    const end = Math.min(far, upTo === undefined ? far : upTo);

    ink.lineWidth = 1;
    // The plain dashes, all in one path — one stroke for the whole
    // trace rather than one per dash.
    ink.strokeStyle = rgba(weight * shade);
    ink.beginPath();
    for (let at = 0; at < end; at += step) {
      const to = Math.min(at + DASH, end);
      if (lit !== undefined && at > lit - runLong && at < lit) continue;
      ink.moveTo(a.x + ux * at, a.y + uy * at);
      ink.lineTo(a.x + ux * to, a.y + uy * to);
    }
    ink.stroke();

    // ...and the lit run, in a second pass at its own weight.
    if (lit === undefined) return;
    ink.strokeStyle = rgba(runInk * shade);
    ink.beginPath();
    for (let at = Math.max(0, Math.floor((lit - runLong) / step) * step); at < end; at += step) {
      if (at <= lit - runLong || at >= lit) continue;
      const to = Math.min(at + DASH, end);
      ink.moveTo(a.x + ux * at, a.y + uy * at);
      ink.lineTo(a.x + ux * to, a.y + uy * to);
    }
    ink.stroke();
  }

  /** How far along its own line each route has been drawn, 0 to 1.
      Set by the arrival and left at 1 afterwards. */
  const reached = new Map();

  /** WHICH PICTURE THE POINTER IS ON, and how far the sheet has stepped
      back behind it — eased, so it gathers and settles rather than
      switching on and off with the hand. `clock` is what the pulses are
      drawn from. */
  let hotNode = -1;
  let heat = 0;
  let clock = 0;

  function paintSpecks() {
    if (!nodes.length) return;
    ink.clearRect(0, 0, specks.width, specks.height);
    if (!placed) return;

    // WHAT IS HOT AND WHAT IS NOT. With a picture pointed at, the
    // traces tied to it are drawn more plainly and their pulses run
    // faster, and everything else steps back — so the one picture is
    // isolated on the page without anything that is being read having
    // moved.
    const cold = heat > 0.01 ? COLD_INK + (1 - COLD_INK) * (1 - heat) : 1;
    const mine = (i) => hotNode >= 0 && i === hotNode;

    links.forEach((link, i) => {
      const got = reached.has(link) ? reached.get(link) : 0;
      if (got <= 0) return;
      const from = nodes[link.a], to = nodes[link.b];
      const a = edgePoint(from, to), b = edgePoint(to, from);
      const far = Math.hypot(b.x - a.x, b.y - a.y);
      const hot = mine(link.a) || mine(link.b);
      const shade = hot ? 1 : cold;
      const upTo = got * far;

      // Each trace's pulse starts somewhere of its own and runs at its
      // own pace, so fourteen of them never fall into step.
      const pulling = hotNode >= 0 ? heat : 0;
      const rate = PULSE_RATE * (0.7 + wobble(i, 1, 3) * 0.6) *
        (hot ? PULSE_HOT : 1) * (1 + (PULL_RATE - 1) * pulling);
      const long = PULSE_LONG * (1 + (PULL_LONG - 1) * pulling);
      const span = far + long;
      const lit = ((clock * rate + wobble(i, 2, 7) * span) % span);

      // WHICH WAY IT RUNS. With nothing pointed at, along the line the
      // way it was drawn. With a picture pointed at, the way that
      // carries it TOWARDS that picture: into it on the traces tied to
      // it, and towards its end of the line on every other one, so the
      // whole map runs at the picture under the hand.
      const toward = hotNode >= 0 &&
        distance(nodes[link.b], nodes[hotNode]) >
        distance(nodes[link.a], nodes[hotNode]);
      const litAt = toward ? far - lit : lit;

      drawTrace(a, b, i, upTo, shade,
        TRACE_INK * (hot ? HOT_LIFT : 1), litAt, long,
        PULSE_INK * (1 + (PULL_INK - 1) * pulling));

      // The ties, once the trace has actually reached them.
      drawTie(a.x, a.y, b.x, b.y, shade);
      if (got > 0.98) drawTie(b.x, b.y, a.x, a.y, shade);
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
    sheet.classList.remove("flicking");
    // THE LINKS ARE PLANNED AGAINST THE SETTLED MAP, not against the one
    // that existed while the pictures were still stacked in the middle
    // window. `planLinks` plans once and then never again — a map that
    // rearranged itself on a resize would read as a fault — and until
    // now that once was the first layout, which runs during the flick.
    // Since the map was given depth that matters: a line refused for
    // being too short to carry its date was being measured against
    // places the pictures had not taken yet. Cleared here and nowhere
    // else, so it is still planned exactly once.
    links = [];
    if (lines) lines.replaceChildren();
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
    // How many cuts there will be, worked out before any of them run.
    let steps = 0;
    for (let held = FLIP_FIRST_MS; held <= FLIP_LAST_MS; held *= FLIP_SLOW) steps++;

    // THE REEL: the order the pictures go past in, worked out in full
    // before the first cut. It is every picture BUT the one it will land
    // on, cycling, and then that one last.
    //
    // THE LANDING PICTURE MUST NOT COME ROUND IN THE MIDDLE OF THE RUN.
    // The reel used to be the whole list cycling by index, so the first
    // picture was shown three times: held at the start, flicked past for
    // about sixty milliseconds somewhere in the middle, and landed on at
    // the end. With a hatch in every frame nobody could tell. With a
    // photograph in the first one the owner saw the page flash it twice
    // on every load, which is exactly what it was doing.
    //
    // Ending the reel ON the landing picture is the other half of it:
    // `settle` shows that same picture, so settling is not a cut and
    // there is no last blink.
    // AND IN NO ORDER. It used to run straight down the list, which on
    // a page whose pictures are mostly hatching read as a counter
    // ticking rather than as a reel; the owner asked for it random.
    // `Math.random` rather than the map's own seeded one, on purpose:
    // the ARRANGEMENT has to come out the same every visit and the reel
    // has to not, and drawing from the seeded run here would shift
    // every picture on the page.
    const reel = [];
    let last = -1;
    for (let n = 0; n < Math.max(1, steps - 1); n++) {
      let pick = 0;
      if (frames.length > 1) {
        // Never twice running: the same picture held for two cuts is a
        // stall, not a cut.
        do {
          pick = 1 + Math.floor(Math.random() * (frames.length - 1));
        } while (pick === last && frames.length > 2);
      }
      last = pick;
      reel.push(pick);
    }
    reel.push(0);

    let at = 0;
    let hold = FLIP_FIRST_MS;
    // NOTHING IS CLICKABLE WHILE IT IS CYCLING. The owner asked for it,
    // and it is the right answer anyway: what is under the pointer
    // changes nine times in a second, so a press lands on whatever
    // happened to be showing. `settle` takes it off again.
    sheet.classList.add("flicking");
    // The picture it will land on, held for a beat — see FLIP_HOLD_MS.
    show(0);

    const step = () => {
      show(reel[at]);
      at++;
      hold *= FLIP_SLOW;
      if (at >= reel.length) {
        setTimeout(settle, Math.round(hold));
        return;
      }
      setTimeout(step, Math.round(hold));
    };
    setTimeout(step, FLIP_HOLD_MS);
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
