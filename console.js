// ============================================================
// THE CONSOLE (categories/theories.html only)
//
// A category read the way an instrument is read. The theories are
// sorted into a few CHANNELS down the left; opening one brings its
// own entries up on the right. Along the foot runs a READING with
// one peak per channel, the open one standing tallest — the same
// gas-chromatograph trace the third slide of the home page carries,
// so the two pages are recognisably the same instrument.
//
// Everything on the page is read off the page itself:
//
//   the channels   the different data-channel values on the rows,
//                  in the order they first appear
//   the entries    the rows themselves
//   the counts     however many of each there are
//
// So adding a theory, or a whole new channel, is one HTML edit and
// nothing here changes.
//
// WITHOUT THIS FILE the page is the plain list of rows every other
// category uses. The script puts `consoled` on <body> and takes
// over; every rule that hides the list is written under that class,
// so the fallback cannot inherit it.
// ============================================================
(function () {
  const page = document.querySelector(".theories-page");
  const list = page && page.querySelector(".work-list");
  if (!page || !list) return;

  const rows = Array.from(list.querySelectorAll(".work-row"));
  if (!rows.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const GRID_MM = 34;          // the squared paper behind it, in pixels
  const GRID_INK = 0.055;      // and how faintly it is ruled

  const TRACE_BASE = 58;       // the reading's baseline, above the foot
  const TRACE_PEAK = 112;      // how tall the open channel's peak stands
  const TRACE_REST = 26;       // and how tall the others are left
  const TRACE_WIDTH = 74;      // how wide a peak is, in pixels
  const TRACE_EASE = 0.12;     // how quickly a peak grows or settles
  const RANK_BACK = 22;        // one rank of the reading standing behind it
  const RANK_SHRINK = 0.72;

  const INK = "23,23,15";
  const MUTED = "109,108,98";
  const BRASS = "156,111,53";

  // ============================================================
  // WHAT IS ON THE PAGE
  //
  // The channels are whatever the rows say they are, in the order
  // they first turn up — so the author decides both what they are
  // called and what order they come in, by writing them in the page.
  // ============================================================
  const channels = [];
  rows.forEach((row) => {
    const name = (row.dataset.channel || "Unsorted").trim();
    let channel = channels.find((one) => one.name === name);
    if (!channel) {
      channel = { name: name, entries: [], height: TRACE_REST, want: TRACE_REST };
      channels.push(channel);
    }
    const title = row.querySelector(".work-row-title");
    const meta = row.querySelector(".work-row-meta");
    channel.entries.push({
      name: title ? title.textContent.trim() : "Untitled",
      meta: meta ? meta.textContent.trim() : "",
      href: row.getAttribute("href"),
    });
  });

  const count = (n, one, many) => n + " " + (n === 1 ? one : many);
  const numbered = (i) => String(i + 1).padStart(2, "0");

  // ============================================================
  // THE PAGE
  // ============================================================
  // Declared up here because opening the first channel asks for a
  // redraw, and that happens while the page is still being built.
  let drawing = true;

  document.body.classList.add("consoled");

  const shell = document.createElement("div");
  shell.className = "console";

  const paper = document.createElement("canvas");
  paper.className = "console-paper";
  paper.setAttribute("aria-hidden", "true");
  shell.appendChild(paper);

  // What this page is, written small beside the Menu — the same mark
  // the contact sheet carries.
  const where = document.createElement("p");
  where.className = "page-where";
  where.textContent = "Theories";
  shell.appendChild(where);

  const readout = document.createElement("p");
  readout.className = "console-readout";
  readout.textContent =
    count(channels.length, "channel", "channels").toUpperCase() + "  ·  " +
    count(rows.length, "entry", "entries").toUpperCase();
  shell.appendChild(readout);

  const frame = document.createElement("div");
  frame.className = "console-frame";
  shell.appendChild(frame);

  // --- the channels, down the left
  const rail = document.createElement("div");
  rail.className = "console-rail";
  rail.setAttribute("role", "tablist");
  rail.setAttribute("aria-label", "Channels");
  frame.appendChild(rail);

  channels.forEach((channel, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "console-tab";
    tab.setAttribute("role", "tab");
    tab.id = "channel-tab-" + i;
    tab.setAttribute("aria-controls", "channel-panel-" + i);
    tab.innerHTML =
      '<span class="console-reg" aria-hidden="true"></span>' +
      '<span class="console-no" aria-hidden="true"></span>' +
      '<span class="console-name"></span>' +
      '<span class="console-count"></span>';
    tab.querySelector(".console-no").textContent = numbered(i);
    tab.querySelector(".console-name").textContent = channel.name;
    tab.querySelector(".console-count").textContent = String(channel.entries.length);
    rail.appendChild(tab);
    channel.tab = tab;
  });

  // --- the open channel, on the right
  const panels = document.createElement("div");
  panels.className = "console-panels";
  frame.appendChild(panels);

  channels.forEach((channel, i) => {
    const panel = document.createElement("section");
    panel.className = "console-panel";
    panel.id = "channel-panel-" + i;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "channel-tab-" + i);

    const head = document.createElement("header");
    head.className = "console-head";
    head.innerHTML =
      '<p class="console-kicker"></p><h2></h2>';
    head.querySelector(".console-kicker").textContent =
      "CHANNEL " + numbered(i) + "  ·  " +
      count(channel.entries.length, "entry", "entries").toUpperCase();
    head.querySelector("h2").textContent = channel.name;
    panel.appendChild(head);

    const holds = document.createElement("div");
    holds.className = "console-entries";
    channel.entries.forEach((entry) => {
      const link = document.createElement("a");
      link.className = "console-entry";
      link.href = entry.href;
      link.innerHTML =
        '<span class="console-reg" aria-hidden="true"></span>' +
        '<span class="console-entry-body"><span class="console-entry-name"></span>' +
        '<span class="console-entry-meta"></span></span>' +
        '<span class="console-go" aria-hidden="true">→</span>';
      link.querySelector(".console-entry-name").textContent = entry.name;
      link.querySelector(".console-entry-meta").textContent = entry.meta;
      holds.appendChild(link);
    });
    panel.appendChild(holds);
    panels.appendChild(panel);
    channel.panel = panel;
  });

  page.insertBefore(shell, page.firstChild);
  const paint = paper.getContext("2d");

  // ============================================================
  // OPENING ONE
  // ============================================================
  let open = 0;

  function show(next, andFocus) {
    open = (next + channels.length) % channels.length;
    channels.forEach((channel, i) => {
      const on = i === open;
      channel.tab.classList.toggle("open", on);
      channel.tab.setAttribute("aria-selected", on ? "true" : "false");
      // Only the open channel's tab is in the tab order: the rail is
      // one control, and the arrow keys move within it.
      channel.tab.tabIndex = on ? 0 : -1;
      channel.panel.classList.toggle("open", on);
      channel.panel.hidden = !on;
      channel.want = on ? TRACE_PEAK : TRACE_REST;
    });
    if (andFocus) channels[open].tab.focus();
    drawing = true;
  }

  channels.forEach((channel, i) => {
    channel.tab.addEventListener("click", () => show(i));
    channel.tab.addEventListener("pointerenter", () => {
      // Pointing at a channel lifts its peak part of the way, so the
      // reading answers before you have committed to anything.
      if (i !== open) channel.want = (TRACE_PEAK + TRACE_REST) / 2;
      drawing = true;
    });
    channel.tab.addEventListener("pointerleave", () => {
      if (i !== open) channel.want = TRACE_REST;
      drawing = true;
    });
  });

  rail.addEventListener("keydown", (e) => {
    let used = true;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") show(open + 1, true);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") show(open - 1, true);
    else if (e.key === "Home") show(0, true);
    else if (e.key === "End") show(channels.length - 1, true);
    else used = false;
    if (used) e.preventDefault();
  });

  show(0);

  // ============================================================
  // THE READING
  //
  // One peak per channel, along the foot. It is the same instrument
  // the landing page's third slide carries, and it is read the same
  // way: every peak keeps its own eased height rather than being
  // drawn from live values, which is what makes a channel opening
  // look like a needle answering rather than a number changing.
  // ============================================================
  let width = 0, height = 0;

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(shell.clientWidth));
    height = Math.max(1, Math.round(shell.clientHeight));
    paper.width = Math.round(width * ratio);
    paper.height = Math.round(height * ratio);
    paper.style.width = width + "px";
    paper.style.height = height + "px";
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawing = true;
  }

  /** The height of the reading at a point along it. */
  function readingAt(x) {
    let sum = 0;
    for (let i = 0; i < channels.length; i++) {
      const at = ((i + 0.5) / channels.length) * width;
      const off = (x - at) / TRACE_WIDTH;
      sum += channels[i].height * Math.exp(-off * off);
    }
    return sum;
  }

  function drawPaper() {
    // The squared paper the landing page is drawn on, ruled faintly.
    paint.strokeStyle = "rgba(" + MUTED + "," + GRID_INK + ")";
    paint.lineWidth = 1;
    paint.beginPath();
    for (let x = GRID_MM; x < width; x += GRID_MM) {
      paint.moveTo(x + 0.5, 0);
      paint.lineTo(x + 0.5, height);
    }
    for (let y = GRID_MM; y < height; y += GRID_MM) {
      paint.moveTo(0, y + 0.5);
      paint.lineTo(width, y + 0.5);
    }
    paint.stroke();
  }

  function drawReading() {
    const foot = height - TRACE_BASE;

    // One rank of it standing behind, higher up and fainter, the way
    // the landing page's reading recedes.
    for (const rank of [1, 0]) {
      const lift = rank * RANK_BACK;
      const squash = rank ? RANK_SHRINK : 1;
      paint.strokeStyle = "rgba(" + INK + "," + (rank ? 0.1 : 0.34) + ")";
      paint.lineWidth = rank ? 1 : 1.2;
      paint.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const y = foot - lift - readingAt(x) * squash;
        if (x === 0) paint.moveTo(x, y); else paint.lineTo(x, y);
      }
      paint.stroke();
    }

    // The baseline it is read against, and a tick under every channel.
    paint.strokeStyle = "rgba(" + MUTED + ",0.3)";
    paint.lineWidth = 1;
    paint.beginPath();
    paint.moveTo(0, foot + 0.5);
    paint.lineTo(width, foot + 0.5);
    paint.stroke();

    paint.font = '10px ui-monospace, "IBM Plex Mono", monospace';
    paint.textAlign = "center";
    paint.textBaseline = "top";
    channels.forEach((channel, i) => {
      const at = ((i + 0.5) / channels.length) * width;
      const on = i === open;
      paint.strokeStyle = "rgba(" + (on ? BRASS : MUTED) + "," + (on ? 0.8 : 0.35) + ")";
      paint.beginPath();
      paint.moveTo(at + 0.5, foot - 4);
      paint.lineTo(at + 0.5, foot + 7);
      paint.stroke();
      paint.fillStyle = "rgba(" + (on ? BRASS : MUTED) + "," + (on ? 0.9 : 0.5) + ")";
      paint.fillText(numbered(i), at, foot + 12);
    });
  }

  function draw() {
    paint.clearRect(0, 0, width, height);
    drawPaper();
    drawReading();
  }

  function tick(now) {
    requestAnimationFrame(tick);
    let settled = true;
    const ease = REDUCE_MOTION ? 1 : TRACE_EASE;
    for (const channel of channels) {
      const before = channel.height;
      channel.height += (channel.want - channel.height) * ease;
      if (Math.abs(channel.height - before) > 0.02) settled = false;
    }
    if (!settled || drawing) {
      draw();
      drawing = !settled;
    }
  }

  window.addEventListener("resize", resize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { drawing = true; });
  }

  resize();
  draw();
  requestAnimationFrame(tick);
})();
