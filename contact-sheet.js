// ============================================================
// THE CONTACT SHEET (categories/ pages that carry one)
//
// A contact sheet is the strip of every frame on a roll of film,
// printed together so you can pick one. This is that idea as the
// way into a body of work:
//
//   1. the page opens white, with one square window in the middle
//   2. every picture in the category flicks through that window,
//      hard cuts, no fading — fast at first, then slowing, the way
//      a wheel comes to rest
//   3. it settles on the first picture, which stays where it is
//   4. lines then grow downwards out of it, turning along a grid,
//      and each of the other pictures appears as its line arrives
//
// The pictures are the <a class="sheet-frame"> blocks in the page
// itself, so adding one is an HTML edit and nothing here changes.
// The first block is the one it settles on — reorder them to
// feature a different picture.
//
// Delete this file and its <script> tag and the page is still a
// plain, working list of links: everything below only moves things
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
  // The flick. It holds the first frame for FLIP_FIRST_MS, then each
  // one a little longer than the last, and stops once a frame would be
  // held longer than FLIP_LAST_MS — so the whole run takes about two
  // and a half seconds however many pictures there are.
  const FLIP_FIRST_MS = 42;
  const FLIP_SLOW = 1.14;
  const FLIP_LAST_MS = 430;

  const NAME_AFTER_MS = 420;    // pause between it settling and the name arriving
  const ROUTE_AFTER_MS = 820;   // and before the lines start growing
  const ROUTE_STAGGER_MS = 150; // one line after another, not all at once
  const ROUTE_MS_PER_PX = 0.85; // how fast a line draws itself

  const BUS_GAP = 15;           // gap between one horizontal run and the next
  const BUS_DROP = 34;          // clear space above the first run in a band
  const BUS_TAIL = 40;          // and below the last one, before the pictures
  const CAPTION_SPACE = 36;     // room under a row of pictures for their captions
  const SEED = 7;               // change for a different arrangement of the grid

  // A seeded random number generator, so the grid is scattered but
  // comes out the same every visit — a layout that rearranged itself on
  // every reload would read as a fault rather than as a design.
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

  const routes = rest.map(() => {
    const line = document.createElementNS(NS, "polyline");
    line.setAttribute("class", "sheet-route");
    lines.appendChild(line);
    return line;
  });

  // ============================================================
  // LAYOUT
  //
  // Worked out here rather than left to the browser because the lines
  // have to land on the pictures exactly: the same numbers that place a
  // picture route the line that reaches it.
  //
  // The sheet reads down in bands — a band of horizontal runs, then the
  // row of pictures they drop onto, then the next band below that row.
  // Keeping each band under the row before it is what stops a line ever
  // being drawn across a picture on its way to another one.
  // ============================================================
  let placed = false;  // true once the pictures have left the middle window

  function layout() {
    const width = sheet.clientWidth;
    if (!width) return;
    // Back to the start of the sequence every time, so resizing the
    // window rearranges nothing: the same cells come out of it.
    seed = SEED;

    const plateSize = Math.max(190, Math.min(330, width * 0.31));
    const childSize = Math.max(86, Math.min(148, width * 0.135));
    const plateX = (width - plateSize) / 2;
    const plateBottom = plateSize;

    plate.style.width = plateSize + "px";
    plate.style.height = plateSize + "px";
    plate.style.transform = "translate(" + plateX + "px,0px)";

    // An even number of columns puts the trunk down the middle of the
    // sheet on a boundary between two columns rather than through the
    // middle of one — so it never runs into a picture.
    let cols = Math.round(width / (childSize * 1.55));
    cols = Math.max(2, cols - (cols % 2));
    const cellWidth = width / cols;

    // Scatter the pictures over a grid with gaps left in it. Filling
    // whole rows would read as a table; the gaps are what make the
    // lines reaching them look routed rather than ruled.
    const rowCount = Math.ceil(rest.length / Math.max(1, cols - 1)) + 1;
    const cells = [];
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < cols; c++) cells.push({ r: r, c: c, key: random() });
    }
    cells.sort((a, b) => a.key - b.key);
    const chosen = cells.slice(0, rest.length);
    chosen.sort((a, b) => (a.r - b.r) || (a.c - b.c));

    const fromX = Math.round(plateX + plateSize / 2);
    const spots = new Array(rest.length);
    const wires = new Array(rest.length);
    const usedRows = [];
    chosen.forEach((cell) => { if (usedRows.indexOf(cell.r) < 0) usedRows.push(cell.r); });

    let bandFrom = plateBottom;
    usedRows.forEach((row) => {
      const inRow = [];
      chosen.forEach((cell, i) => {
        if (cell.r !== row) return;
        const x = cell.c * cellWidth + (cellWidth - childSize) / 2;
        inRow.push({ i: i, x: x, dx: Math.abs(x + childSize / 2 - fromX) });
      });
      // The pictures nearest the middle turn off the trunk first, so the
      // runs stack outwards instead of crossing one another.
      inRow.sort((a, b) => a.dx - b.dx);

      const bandTop = bandFrom + BUS_DROP;
      const rowY = Math.round(bandTop + (inRow.length - 1) * BUS_GAP + BUS_TAIL);
      inRow.forEach((entry, k) => {
        spots[entry.i] = { x: entry.x, y: rowY };
        wires[entry.i] = {
          busY: Math.round(bandTop + k * BUS_GAP),
          toX: Math.round(entry.x + childSize / 2),
          rowY: rowY,
        };
      });
      bandFrom = rowY + childSize + CAPTION_SPACE;
    });

    rest.forEach((frame, i) => {
      const size = placed ? childSize : plateSize;
      frame.style.width = size + "px";
      frame.style.height = size + "px";
      frame.style.transform = placed
        ? "translate(" + spots[i].x + "px," + spots[i].y + "px)"
        : "translate(" + plateX + "px,0px)";

      // Down the trunk, along its own run, then down onto the top edge
      // of the picture. Square corners throughout: these are routed, not
      // drawn by hand.
      const wire = wires[i];
      routes[i].setAttribute("points", [
        fromX + "," + plateBottom,
        fromX + "," + wire.busY,
        wire.toX + "," + wire.busY,
        wire.toX + "," + wire.rowY,
      ].join(" "));
      const length =
        (wire.busY - plateBottom) + Math.abs(wire.toX - fromX) + (wire.rowY - wire.busY);
      routes[i].dataset.length = String(length);
      // A line that has already drawn itself keeps its new length fully
      // drawn; one that hasn't stays wound up ready to go.
      routes[i].style.strokeDasharray = length + " " + length;
      routes[i].style.strokeDashoffset =
        routes[i].classList.contains("drawn") ? "0" : String(length);
    });

    // One after another down the sheet, so the drawing order reads the
    // same way the layout does.
    rest
      .map((frame, i) => ({ i: i, busY: wires[i].busY, dx: Math.abs(wires[i].toX - fromX) }))
      .sort((a, b) => (a.busY - b.busY) || (a.dx - b.dx))
      .forEach((entry, rank) => { routes[entry.i].dataset.rank = String(rank); });

    const height = placed ? bandFrom : plateBottom;
    sheet.style.height = height + "px";
    lines.setAttribute("viewBox", "0 0 " + width + " " + height);
    lines.setAttribute("width", width);
    lines.setAttribute("height", height);
  }

  // ============================================================
  // THE FLICK
  // ============================================================
  function show(index) {
    frames.forEach((frame, i) => { frame.style.visibility = i === index ? "visible" : "hidden"; });
  }

  function settle() {
    show(0);
    placed = true;
    // The picture it settled on keeps its own caption, above it rather
    // than below: underneath is where the lines leave from.
    plate.classList.add("landed");
    sheet.classList.add("settled");
    layout();

    setTimeout(
      () => document.body.classList.add("sheet-named"),
      REDUCE_MOTION ? 0 : NAME_AFTER_MS
    );

    // Each line grows down to its picture, and the picture appears as it
    // arrives — appears, not fades: the same hard cut the flick is made
    // of, so the whole page is drawn in one language.
    routes.forEach((route, i) => {
      const length = Number(route.dataset.length) || 0;
      const rank = Number(route.dataset.rank) || 0;
      const draw = Math.max(220, length * ROUTE_MS_PER_PX);
      const wait = ROUTE_AFTER_MS + rank * ROUTE_STAGGER_MS;
      if (REDUCE_MOTION) {
        route.classList.add("drawn");
        route.style.strokeDashoffset = "0";
        rest[i].style.visibility = "visible";
        rest[i].classList.add("landed");
        return;
      }
      setTimeout(() => {
        route.classList.add("drawn");
        route.style.transition = "stroke-dashoffset " + draw + "ms linear";
        route.style.strokeDashoffset = "0";
        setTimeout(() => {
          rest[i].style.visibility = "visible";
          rest[i].classList.add("landed");
        }, draw);
      }, wait);
    });
  }

  function flick() {
    let index = 0;
    let hold = FLIP_FIRST_MS;
    show(0);
    const step = () => {
      index = (index + 1) % frames.length;
      show(index);
      hold *= FLIP_SLOW;
      if (hold > FLIP_LAST_MS) {
        // It stops on the first picture wherever the flick had got to,
        // so the page always settles on the one the author put first.
        setTimeout(settle, Math.round(hold));
        return;
      }
      setTimeout(step, Math.round(hold));
    };
    setTimeout(step, Math.round(hold));
  }

  layout();
  window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  if (REDUCE_MOTION || frames.length < 2) settle();
  else flick();
})();
