// ============================================================
// PINEWARD (works/pineward.html only)
//
// A long piece — an introduction and fifty-two parts — drawn the way
// the rest of this site draws: hairlines, specks, and the lines
// between them. Three things are added to the page here, and the page
// is a working page without any of them.
//
//   THE CANOPY   A still drawing standing behind the title: specks
//                strung between a few branching runs, thinning as it
//                goes down the page. It is drawn once and then left —
//                nothing on this page drifts on its own clock.
//
//   THE TRUNK    A rule down the side of the parts with one tick per
//                part, numbered at every stratum. It is the piece's
//                own scale: how far down the fifty-two you have come
//                is where the reading in the corner comes from, and
//                the ticks behind you are inked in as you pass them.
//
//   THE PARTS    Each one comes up as it is reached, and opens and
//                closes on a height that is measured rather than
//                guessed at, so a part with three paragraphs in it
//                takes exactly as long to open as it needs.
//
// WITHOUT THIS FILE the page is all of its writing, one part after
// another: `<details>` opens and closes by itself, and the drawings
// are simply not there. That is why none of them carry anything to
// read.
//
// The four strata — Canopy, Understorey, Trunk, Roots — are a section
// through a forest read from the light down into the ground. They are
// in the page's own markup, not here.
// ============================================================
(function () {
  const page = document.querySelector(".pineward-page");
  if (!page) return;

  const parts = Array.from(document.querySelectorAll(".pine-part"));
  if (!parts.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 31;

// --- the forest
  //
  // A STAND OF CONIFERS DOWN BOTH SIDES OF THE WHOLE PAGE, not a
  // canopy behind the title. The owner asked for it to run the length
  // of the piece and to be more coniferous — so a tree here is a
  // straight leader with side branches that shorten towards the top
  // and droop as they go out, which is a fir seen from the side, and
  // there are as many of them as the page is long.
  //
  // It is drawn in PAGE coordinates on a canvas fixed to the window,
  // and only the part of it that is on the screen is drawn. That is
  // what lets it be six thousand pixels tall without a canvas that
  // size.
  //
  // THE WOOD STANDS IN TWO STRIPS AND NOWHERE ELSE. Three things share
  // this page's width: the reading tree in the left gutter, the writing
  // in a column 940px wide down the middle, and the wood. What is left
  // for the wood is the strip between the gutter and the column on each
  // side, and every tree is placed inside its strip — that is what
  // keeps the drawing off the writing, off the reading tree, and off
  // the ends of the page. A strip too narrow to hold a tree carries
  // none at all rather than a squashed one.
  const COLUMN = 940;          // the writing's own column, from the stylesheet
  const COLUMN_PAD = 46;       // how far into that column's own padding the wood may come
  const GUTTER_LEFT = 88;      // kept clear for the reading tree
  const GUTTER_RIGHT = 18;     // and a hair kept off the right edge
  const BAND_MIN = 76;         // a strip narrower than this carries no wood
  const PAGE_PAD = 96;         // nothing is drawn within this of either end of the page
  const TREE_TALL = [170, 300];// how tall one tree is
  const TREE_GAP = [46, 140];  // and the clear air between it and the next one down
  const TREE_SPREAD = 0.5;     // how wide it may get, against the strip it stands in
  const EDGE_FADE = 130;       // how far from the window's top and foot the wood fades out
  const WHORLS = [9, 15];      // how many rounds of branches one carries
  const BRANCH_OUT = [0.34, 0.86]; // how far out a branch reaches, against its tree
  const BRANCH_DROOP = 0.42;   // and how far it falls as it goes
  const TWIG_EVERY = 11;       // how far apart the specks along a branch stand
  const SPECK_MIN = 1;         // how big a speck is drawn, in pixels
  const SPECK_MAX = 2.4;
  const TREE_INK = 0.31;       // how heavily a speck is drawn
  const BOUGH_INK = 0.085;     // the branch it stands on
  const WEB_INK = 0.1;         // and a line between two specks
  const WEB_REACH = 26;        // two specks nearer than this are joined
  const WEB_EACH = 2;          // and no speck carries more lines than this
  const CLEAR_MID = 0.42;      // the share of the width kept quiet for the writing
  const GROW_MS = 2100;        // how long the forest takes to grow when the page opens
  const INK = "23,23,15";      // --ink
  // THE HOUSE'S GREEN. The owner asked for dark green accents on this
  // page, and for the wood to answer the hand by turning green as well
  // as by the bloom it already had. Kept in step with --pine-green in
  // the stylesheet; nothing else on the site spends it.
  const GREEN = [26, 74, 44];
  const INK_RGB = [23, 23, 15];

  // --- and what it does while it stands there
  //
  // NOTHING FOLLOWS THE POINTER and nothing is dragged about by it —
  // the owner was plain about that. What there is: every speck idles a
  // hair about its own place, which is a tree in air rather than a
  // diagram of one; and wherever the hand rests, the needles near it
  // BLOOM — the specks there brighten and put out fine needles of
  // their own, and more of them are netted together. The tree does not
  // move to meet the hand; it is only more itself where the hand is.
  const IDLE = 0.9;            // how far a speck drifts from its own place, in pixels
  const IDLE_RATE = [0.12, 0.5]; // and how slowly, in turns a second
  const BLOOM_REACH = 104;     // how near the hand a speck blooms, in pixels
  const BLOOM_INK = 0.5;       // how much more plainly it is drawn
  const BLOOM_NEEDLES = 3;     // how many needles it puts out
  const BLOOM_LONG = 7;        // and how long they are, in pixels
  const BLOOM_EASE = 3.4;      // how quickly the bloom comes and goes
  const GREEN_LIFT = 0.85;     // how far towards the house's green a bloomed speck goes


  // --- the parts arriving
  const RISE_MS = 620;         // how long one takes to come up
  const RISE_STEP = 45;        // and the pause between two that arrive together
  const OPEN_MS = 760;        // how long a part takes to open
  const SHUT_MS = 620;        // and to close, which is a little quicker
  // A gentle curve, flat at both ends — the same shape the chamber's
  // step uses. The standard ones cover half their travel in a quarter
  // of their length, which on a box this size is a lurch and then a
  // wait.
  const PART_EASE = "cubic-bezier(0.42, 0.02, 0.24, 1)";

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (pair) => pair[0] + random() * (pair[1] - pair[0]);
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  /** Ink, carried `green` of the way towards the house's green. What the
      bloom uses: a speck under the hand is drawn more plainly AND more
      green, and both come and go together. */
  const rgbaGreen = (a, green) => {
    const t = Math.max(0, Math.min(1, green));
    const r = Math.round(INK_RGB[0] + (GREEN[0] - INK_RGB[0]) * t);
    const g = Math.round(INK_RGB[1] + (GREEN[1] - INK_RGB[1]) * t);
    const b = Math.round(INK_RGB[2] + (GREEN[2] - INK_RGB[2]) * t);
    return "rgba(" + r + "," + g + "," + b + "," +
      Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  };

  // ============================================================
  // THE FOREST
  //
  // Conifers down both sides of the page, the whole length of it. One
  // tree is a straight leader with whorls of branches coming off it,
  // shortening towards the top and drooping as they reach out — which
  // is a fir seen from the side, and is what makes this read as a wood
  // rather than as a net of lines.
  //
  // It is worked out ONCE, in the page's own coordinates, and only the
  // part of it that is on the screen is ever drawn. The canvas is
  // fixed to the window, so a page six thousand pixels long does not
  // need a canvas six thousand pixels tall.
  // ============================================================
  const canopy = document.querySelector(".pine-canopy");
  const ink = canopy ? canopy.getContext("2d") : null;

  /** Every speck of the forest, and every branch they stand on, in
      page coordinates. Rebuilt only when the page changes size. */
  let wood = null;
  /** How much of it is standing: 1 once it has grown. */
  let grown = REDUCE_MOTION ? 1 : 0;
  /** Where the hand is, in the window. Nothing follows it; what is
      near it blooms. */
  let handX = -9999, handY = -9999;
  let handAt = 0;

  /** One branch of one tree: a run out from the leader, drooping as it
      goes, with the specks strung along it. */
  function branchOf(x, y, side, len, droop, specks, runs, from) {
    const many = Math.max(2, Math.round(len / TWIG_EVERY));
    let was = { x: x, y: y };
    for (let n = 1; n <= many; n++) {
      const at = n / many;
      // Out and down: a conifer's branch leaves the trunk level and
      // falls away, and the fall grows as it goes.
      const to = {
        x: x + side * len * at,
        y: y + droop * len * at * at,
      };
      runs.push({ x1: was.x, y1: was.y, x2: to.x, y2: to.y, from: from + len * (at - 1 / many), to: from + len * at });
      specks.push({
        x: to.x + (random() - 0.5) * 2.2,
        y: to.y + (random() - 0.5) * 2.2,
        size: SPECK_MIN + random() * (SPECK_MAX - SPECK_MIN) * (1 - at * 0.5),
        at: from + len * at,
        rate: IDLE_RATE[0] + random() * (IDLE_RATE[1] - IDLE_RATE[0]),
        phase: random() * Math.PI * 2,
      });
      was = to;
    }
  }

  /** One tree, from its foot up. `spread` is the furthest a branch of
      it may reach to either side — the tree is grown to fit the strip
      it stands in rather than to fit its own height, which is what
      stops it reaching across the writing. */
  function treeAt(x, foot, tall, spread, specks, runs) {
    const whorls = Math.round(WHORLS[0] + random() * (WHORLS[1] - WHORLS[0]));
    // The leader: dead straight, which is what a fir has and what
    // keeps the drawing taut.
    runs.push({ x1: x, y1: foot, x2: x, y2: foot - tall, from: 0, to: tall, leader: true });
    for (let n = 0; n <= tall; n += TWIG_EVERY) {
      specks.push({
        x: x + (random() - 0.5) * 1.6,
        y: foot - n,
        size: SPECK_MIN + random() * (SPECK_MAX - SPECK_MIN),
        at: n,
        rate: IDLE_RATE[0] + random() * (IDLE_RATE[1] - IDLE_RATE[0]),
        phase: random() * Math.PI * 2,
      });
    }
    for (let w = 0; w < whorls; w++) {
      // Up the tree, and shorter as it goes: the whorls of a conifer
      // are a triangle seen from the side.
      const up = (w + 0.6) / whorls;
      const y = foot - tall * up;
      const left = spread * (BRANCH_OUT[0] + random() * (BRANCH_OUT[1] - BRANCH_OUT[0])) *
        (1 - up * 0.75);
      const droop = BRANCH_DROOP * (0.6 + random() * 0.8);
      branchOf(x, y, -1, left, droop, specks, runs, tall * up);
      branchOf(x, y, 1, left * (0.75 + random() * 0.5), droop, specks, runs, tall * up);
    }
  }

  /** The whole stand, worked out for the page as it now is. */
  function growWood() {
    if (!canopy) return;
    const wide = window.innerWidth;
    const tall = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );
    seed = SEED;
    const specks = [], runs = [];
    // The two strips the wood may stand in: between the reading tree's
    // gutter and the writing's column on the left, and the mirror of
    // that on the right.
    const col = Math.min(COLUMN, wide);
    const edge = (wide - col) / 2 + COLUMN_PAD;
    const bands = [
      { from: GUTTER_LEFT, to: edge },
      { from: wide - edge, to: wide - GUTTER_RIGHT },
    ];
    // DOWN EACH STRIP, ONE TREE AT A TIME, each one starting below the
    // last one's lowest branch. Walking down like this — rather than
    // dropping a tree every so many pixels and hoping — is what makes
    // it impossible for two of them to grow through one another, and
    // keeping the walk inside PAGE_PAD is what stops one hanging off
    // the top or the foot of the page.
    bands.forEach((band, side) => {
      const room = band.to - band.from;
      if (room < BAND_MIN) return;
      let y = PAGE_PAD + (side ? between(TREE_GAP) : 0);
      let guard = 0;
      while (y < tall - PAGE_PAD && guard++ < 600) {
        const high = between(TREE_TALL);
        // A tree is grown to fit its strip: never wider than half of
        // it, and never so wide for its height that it reads as a bush.
        const spread = Math.min(room * TREE_SPREAD, high * 0.4);
        // The lowest branches droop below the foot, so that fall is
        // part of the room the tree takes up.
        const droopRoom = spread * BRANCH_DROOP * 1.4;
        const foot = y + high;
        if (foot + droopRoom > tall - PAGE_PAD) break;
        const x = band.from + spread + random() * Math.max(0, room - spread * 2);
        treeAt(x, foot, high, spread, specks, runs);
        y = foot + droopRoom + between(TREE_GAP);
      }
    });
    // Bucketed by where they stand down the page, so that drawing only
    // what is on the screen is a lookup rather than a search through
    // every speck in the wood.
    const rows = new Map();
    const ROW = 400;
    specks.forEach((one) => {
      const row = Math.floor(one.y / ROW);
      if (!rows.has(row)) rows.set(row, { specks: [], runs: [] });
      rows.get(row).specks.push(one);
    });
    runs.forEach((one) => {
      const row = Math.floor(Math.min(one.y1, one.y2) / ROW);
      if (!rows.has(row)) rows.set(row, { specks: [], runs: [] });
      rows.get(row).runs.push(one);
    });
    wood = { rows: rows, ROW: ROW, wide: wide, tall: tall, reach: 0 };
    wood.reach = specks.reduce((m, one) => Math.max(m, one.at), 1);
  }

  /** What is on the screen, in page coordinates. */
  function inView(from, to) {
    const out = { specks: [], runs: [] };
    if (!wood) return out;
    for (let row = Math.floor(from / wood.ROW); row <= Math.floor(to / wood.ROW); row++) {
      const has = wood.rows.get(row);
      if (!has) continue;
      out.specks = out.specks.concat(has.specks);
      out.runs = out.runs.concat(has.runs);
    }
    return out;
  }

  function paintWood() {
    if (!ink || !wood) return;
    const wide = canopy.clientWidth, tall = canopy.clientHeight;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canopy.width !== Math.round(wide * ratio)) {
      canopy.width = Math.round(wide * ratio);
      canopy.height = Math.round(tall * ratio);
      ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    ink.clearRect(0, 0, wide, tall);

    const down = window.scrollY || window.pageYOffset || 0;
    const seen = inView(down - wood.ROW, down + tall + wood.ROW);
    const upTo = wood.reach * grown;

    /** How plainly anything is drawn. Two things quieten it:
        ACROSS — the middle of the page, where the writing is. A branch
        that reaches in over the writing is something you only notice if
        you go looking for it.
        DOWN — the top and the foot of the WINDOW. Without this a tree
        that happens to straddle the edge of the screen is cut off by it
        in a hard line, which is what read as the wood running off the
        page. Faded, a tree dissolves into the margin instead, and
        nothing is ever seen sliced. */
    const lit = (x, y) => {
      const off = Math.min(1, Math.abs(x - wide / 2) / (wide * CLEAR_MID));
      const across = 0.04 + 0.96 * off * off;
      if (y === undefined) return across;
      const edge = Math.min(y, tall - y) / EDGE_FADE;
      return across * Math.max(0, Math.min(1, edge));
    };

    // The branches, faintly: what the specks are strung along.
    seen.runs.forEach((run) => {
      if (run.from > upTo) return;
      const at = lit((run.x1 + run.x2) / 2, (run.y1 + run.y2) / 2 - down) *
        BOUGH_INK * (run.leader ? 1.4 : 1);
      if (at < 0.012) return;
      const part = Math.min(1, (upTo - run.from) / Math.max(1, run.to - run.from));
      ink.beginPath();
      ink.moveTo(run.x1, run.y1 - down);
      ink.lineTo(run.x1 + (run.x2 - run.x1) * part, (run.y1 + (run.y2 - run.y1) * part) - down);
      ink.lineWidth = 1;
      ink.strokeStyle = rgba(at);
      ink.stroke();
    });

    // Where each speck actually stands this frame: its own place, plus
    // the hair it idles by. The idle is written from the clock rather
    // than added up, so it drifts about its place instead of away
    // from it — the taut character the owner asked to keep.
    const now = window.performance && window.performance.now
      ? window.performance.now() / 1000 : Date.now() / 1000;
    const placed = [];
    seen.specks.forEach((one) => {
      if (one.at > upTo) return;
      const x = one.x + (REDUCE_MOTION ? 0 : Math.sin(now * one.rate * 6.28 + one.phase) * IDLE);
      const y = one.y - down +
        (REDUCE_MOTION ? 0 : Math.cos(now * one.rate * 5.1 + one.phase) * IDLE * 0.7);
      if (y < -40 || y > tall + 40) return;
      // THE BLOOM: how near the hand this speck is. Nothing moves
      // towards it — what is near is simply drawn more fully.
      const bloom = handAt > 0
        ? handAt * Math.max(0, 1 - Math.hypot(x - handX, y - handY) / BLOOM_REACH)
        : 0;
      placed.push({ x: x, y: y, size: one.size, bloom: bloom, of: one, lit: lit(one.x, y) });
    });

    // The web between near neighbours, and never more than `WEB_EACH`
    // from any one of them.
    const carried = placed.map(() => 0);
    ink.lineWidth = 1;
    for (let a = 0; a < placed.length; a++) {
      if (carried[a] >= WEB_EACH) continue;
      for (let b = a + 1; b < placed.length; b++) {
        if (carried[a] >= WEB_EACH) break;
        if (carried[b] >= WEB_EACH) continue;
        const one = placed[a], two = placed[b];
        const off = Math.hypot(two.x - one.x, two.y - one.y);
        const bloom = Math.max(one.bloom, two.bloom);
        if (off > WEB_REACH * (1 + bloom) || off < 4) continue;
        const at = (WEB_INK + bloom * WEB_INK * 2) * Math.min(one.lit, two.lit);
        if (at < 0.012) continue;
        ink.beginPath();
        ink.moveTo(one.x, one.y);
        ink.lineTo(two.x, two.y);
        ink.strokeStyle = rgba(at);
        ink.stroke();
        carried[a]++; carried[b]++;
      }
    }

    // The specks themselves — squares on whole pixels, like every
    // speck on this site — and the needles the bloomed ones put out.
    placed.forEach((one) => {
      const at = one.lit * (TREE_INK + one.bloom * BLOOM_INK);
      if (at < 0.02) return;
      const size = Math.max(1, Math.round(one.size + one.bloom * 1.6));
      // Green where the hand is, and only there. `GREEN_LIFT` is how far
      // towards the house's green a fully bloomed speck is carried — not
      // all the way, or the wood reads as a different drawing under the
      // pointer rather than the same one answering.
      ink.fillStyle = rgbaGreen(at, one.bloom * GREEN_LIFT);
      ink.fillRect(Math.round(one.x - size / 2), Math.round(one.y - size / 2), size, size);
      if (one.bloom < 0.08) return;
      // NEEDLES. A conifer blooming is not a flower opening: it is the
      // needles standing out from the twig, so that is what is drawn.
      ink.strokeStyle = rgbaGreen(at * 0.7, one.bloom * GREEN_LIFT);
      ink.beginPath();
      for (let n = 0; n < BLOOM_NEEDLES; n++) {
        const way = one.of.phase + (n / BLOOM_NEEDLES) * Math.PI * 2;
        const long = BLOOM_LONG * one.bloom;
        ink.moveTo(one.x, one.y);
        ink.lineTo(one.x + Math.cos(way) * long, one.y + Math.sin(way) * long);
      }
      ink.stroke();
    });
  }


  // ============================================================
  // THE TRUNK
  //
  // One tick per part down the side of the page, and the reading in
  // the corner that counts them. Both are the piece's own scale: where
  // you are in the fifty-two, rather than how far down the document
  // you have scrolled — a part that runs long should not read as more
  // of the piece than a part that runs short.
  // ============================================================
  // THE SCALE. One tick per part down the side of the page, on a
  // hairline ruled the length of it, with the passed part of that rule
  // inked in behind them in the house's green.
  //
  // For one round this was the house's own mark — the fir off the
  // Pineward bottle, filling from the ground up. The owner asked for it
  // scrapped ("remove the tree on the left, scrap that idea"), so it is
  // out of the file rather than turned off: there is no firPath and no
  // FIR_* here any more.
  const trunk = document.createElement("div");
  trunk.className = "pine-trunk";
  trunk.setAttribute("aria-hidden", "true");
  trunk.innerHTML =
    '<span class="pine-trunk-line"><span class="pine-trunk-fill"></span></span>';
  const ticks = document.createElement("div");
  ticks.className = "pine-ticks";
  parts.forEach(() => {
    const tick = document.createElement("span");
    tick.className = "pine-tick";
    ticks.appendChild(tick);
  });
  trunk.appendChild(ticks);
  page.appendChild(trunk);

  const readout = document.createElement("p");
  readout.className = "pine-readout";
  readout.innerHTML =
    '<span class="pine-readout-no">00</span>' +
    '<span class="pine-readout-of"> / ' + String(parts.length).padStart(2, "0") + '</span>' +
    '<span class="pine-readout-where">Introduction</span>';
  page.appendChild(readout);

  const tickAt = Array.from(ticks.children);
  const trunkFill = trunk.querySelector(".pine-trunk-fill");
  const readNo = readout.querySelector(".pine-readout-no");
  const readWhere = readout.querySelector(".pine-readout-where");

  const strata = [...document.querySelectorAll(".pine-stratum")];
  const intro = document.querySelector(".pine-intro");

  /** How much of the WINDOW this thing is filling, in pixels. The
      reading names whatever you are actually looking at, which at the
      foot of a long open part is something that began a long way up —
      so what matters is how much of the screen it has, not where it
      started. */
  function filling(el) {
    const box = el.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
  }

  function mostOf(list) {
    let best = null;
    let most = 0;
    list.forEach((el) => {
      const room = filling(el);
      if (room > most) { most = room; best = el; }
    });
    return { el: best, room: most };
  }

  // How much of the window an open part has to fill before the reading
  // names it as well as its stratum.
  const NAMES_IT = 0.45;

  /** Which part is being read. The ticks count what you have been PAST;
      the reading below names what is in front of you now. */
  let said = "";
  function reckon() {
    const line = window.innerHeight * 0.34;
    let at = -1;
    for (let n = 0; n < parts.length; n++) {
      if (parts[n].getBoundingClientRect().top <= line) at = n; else break;
    }
    // AT THE FOOT OF THE PAGE, EVERYTHING HAS BEEN PASSED.
    // A part counts as passed when its top crosses a line a third of the
    // way down the window — but the last few parts never get that far up
    // the screen, because the page runs out before they can. So scrolling
    // all the way down used to leave the reading short of the full count
    // and the rule short of its end, which is exactly what the owner
    // reported. Once the page itself has been passed, so has everything
    // on it.
    const down = window.scrollY || window.pageYOffset || 0;
    const room = Math.max(0,
      document.documentElement.scrollHeight - window.innerHeight);
    if (room > 0 && down >= room - 2) at = parts.length - 1;
    tickAt.forEach((tick, n) => tick.classList.toggle("passed", n <= at));

    // The rule fills behind the ticks off the same count: the parts
    // passed, not the scrollbar, so a part that runs long does not read
    // as more of the piece than a part that runs short.
    if (trunkFill) {
      const filled = Math.max(0, Math.min(1, (at + 1) / parts.length));
      trunkFill.style.transform = "scaleY(" + filled.toFixed(4) + ")";
    }

    const part = mostOf(parts);
    const stratum = mostOf(intro ? strata.concat([intro]) : strata);
    const names = part.el && part.el.open && part.room >= window.innerHeight * NAMES_IT;
    const where = !stratum.el || stratum.el === intro
      ? "Introduction"
      : stratum.el.querySelector("h2").textContent;
    const number = names ? parts.indexOf(part.el) + 1 : at + 1;
    const saying = names
      ? where + ", " + part.el.querySelector(".pine-title").textContent.trim()
      : where;

    const now = number + "|" + saying;
    if (now === said) return;
    said = now;
    readNo.textContent = String(Math.max(0, number)).padStart(2, "0");
    readWhere.textContent = saying;
  }

  // ============================================================
  // THE PARTS
  //
  // Coming up as they are reached, and opening on a height that is
  // measured. A `<details>` element opens instantly on its own, which
  // is the right thing for it to do when nothing is watching; here the
  // height is taken before and after and the difference is travelled,
  // so the page does not jump under whatever you are reading.
  // ============================================================
  if (!REDUCE_MOTION && "IntersectionObserver" in window) {
    let due = 0;
    const watcher = new IntersectionObserver(
      (seen) => {
        const now = window.performance && window.performance.now
          ? window.performance.now() : Date.now();
        if (now > due) due = now;
        seen.forEach((one) => {
          if (!one.isIntersecting) return;
          const wait = Math.max(0, due - now);
          due += RISE_STEP;
          setTimeout(() => one.target.classList.add("arrived"), wait);
          watcher.unobserve(one.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    parts.forEach((part) => watcher.observe(part));
    document.querySelectorAll(".pine-stratum-head, .pine-intro").forEach((one) => {
      one.classList.add("pine-rises");
      watcher.observe(one);
    });
  } else {
    parts.forEach((part) => part.classList.add("arrived"));
  }

  // ============================================================
  // OPENING AND CLOSING A part
  //
  // A <details> opens and closes in ONE FRAME on its own, which is the
  // right thing for it to do when nothing is watching and completely
  // wrong here: the owner asked for both halves to be "smooth and
  // gradual, not so sudden". So the summary's own click is caught and
  // the element is opened or closed around an animation instead:
  //
  //   OPENING — the element is opened at once (its contents have to be
  //   on the page to be measured), the box is run from nothing to the
  //   height it wants, and the writing comes up a beat later, so the
  //   room is already opening before anything appears in it.
  //
  //   CLOSING — the writing goes FIRST and the box follows it down,
  //   and only when the box has closed is the element really shut. Shut
  //   it first and the browser takes the contents off the page in that
  //   frame, which is the cut this exists to avoid.
  //
  // Nothing here is needed for the page to work: under
  // `prefers-reduced-motion`, and with this script blocked, the
  // <details> opens and closes on its own as it always did.
  // ============================================================
  parts.forEach((part) => {
    const body = part.querySelector(".pine-body");
    const summary = part.querySelector("summary");
    if (!body || !summary) return;
    const cue = part.querySelector(".pine-cue");
    let moving = false;

    const say = () => { if (cue) cue.textContent = part.open ? "Close" : "Open"; };
    part.addEventListener("toggle", say);

    // The box's own padding has to travel with its height, or the last
    // frame of closing is a forty-pixel box with nothing in it that
    // then disappears — a small step at the end of a smooth movement,
    // which is the thing this whole treatment exists to avoid. Read off
    // the stylesheet rather than written here, so the two cannot
    // disagree.
    const padTop = getComputedStyle(body).paddingTop;
    const padBottom = getComputedStyle(body).paddingBottom;

    /** Put the box back in the page's hands once it has arrived. */
    const settle = () => {
      body.style.transition = "";
      body.style.height = "";
      body.style.opacity = "";
      body.style.transform = "";
      body.style.overflow = "";
      body.style.paddingTop = "";
      body.style.paddingBottom = "";
      moving = false;
    };

    /** Whether a click arrived while the last one was still running. */
    let pending = false;
    /** Everything a click does, so that a remembered one can do it too. */
    const act = () => {
      moving = true;

      if (!part.open) {
        part.open = true;
        const to = body.scrollHeight;
        body.style.overflow = "hidden";
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(8px)";
        // The frame after, so there is a height of nothing for the box
        // to travel from rather than a height it already had.
        requestAnimationFrame(() => {
          body.style.transition =
            "height " + OPEN_MS + "ms " + PART_EASE + ", " +
            "opacity " + Math.round(OPEN_MS * 0.7) + "ms " + PART_EASE + " " +
              Math.round(OPEN_MS * 0.3) + "ms, " +
            "transform " + Math.round(OPEN_MS * 0.8) + "ms " + PART_EASE + " " +
              Math.round(OPEN_MS * 0.25) + "ms, " +
            "padding " + OPEN_MS + "ms " + PART_EASE;
          body.style.height = to + "px";
          body.style.paddingTop = padTop;
          body.style.paddingBottom = padBottom;
          body.style.opacity = "1";
          body.style.transform = "none";
        });
        window.setTimeout(() => { settle(); reckon(); drain(); }, OPEN_MS + 60);
        return;
      }

      const from = body.getBoundingClientRect().height;
      body.style.overflow = "hidden";
      body.style.height = from + "px";
      body.style.paddingTop = padTop;
      body.style.paddingBottom = padBottom;
      body.style.opacity = "1";
      requestAnimationFrame(() => {
        body.style.transition =
          "height " + SHUT_MS + "ms " + PART_EASE + ", " +
          "opacity " + Math.round(SHUT_MS * 0.55) + "ms " + PART_EASE + ", " +
          "transform " + Math.round(SHUT_MS * 0.6) + "ms " + PART_EASE + ", " +
          "padding " + SHUT_MS + "ms " + PART_EASE;
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(6px)";
      });
      window.setTimeout(() => {
        part.open = false;
        settle();
        say();
        reckon();
        drain();
      }, SHUT_MS + 40);
    };

    /** Do the click that was remembered, if there was one. */
    const drain = () => {
      if (!pending) return;
      pending = false;
      act();
    };

    summary.addEventListener("click", (event) => {
      if (REDUCE_MOTION) return;
      event.preventDefault();
      // A CLICK THAT LANDS WHILE THE BOX IS STILL MOVING IS REMEMBERED,
      // NOT DROPPED. This used to return and do nothing at all, so
      // opening a part and changing your mind inside the next
      // three-quarters of a second swallowed the second click and you
      // had to click again. Only ONE is kept, so hammering the summary
      // does at most one more thing rather than queueing up a pile.
      if (moving) { pending = true; return; }
      act();
    });
  });

  // ============================================================
  // ARRIVING FROM A SEARCH
  //
  // A result on the search page links straight at one fragrance —
  // #part-06 — and being shown a closed list with it somewhere inside
  // is not an answer, so the page opens it and takes you to it.
  // `SiteSearch` is only on the pages that load it; without it this
  // does nothing and the link still lands on the right part of the
  // page.
  // ============================================================
  if (window.SiteSearch) window.SiteSearch.openFromHash(".pine-part");

  // ============================================================
  // KEEPING UP
  // ============================================================
  let waiting = false;
  function onScroll() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => { waiting = false; reckon(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  let sized = null;
  function onResize() {
    // Only when the window itself has changed, not when the page has
    // grown a little because a part was opened: a whole wood is worked
    // out again here, and opening a part should not cost that.
    const now = window.innerWidth + "x" + window.innerHeight;
    if (now !== sized) { sized = now; growWood(); }
    reckon();
  }
  window.addEventListener("resize", onResize);

  // WHERE THE HAND IS, and nothing more than that: what is near it
  // blooms where it stands. Nothing is dragged towards it and nothing
  // follows it, which is what the owner asked for — the wood is not
  // interactive, it is only more itself where somebody is looking.
  window.addEventListener("pointermove", (e) => {
    handX = e.clientX;
    handY = e.clientY;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { handX = -9999; handY = -9999; });

  page.classList.add("pine-ready");
  sized = window.innerWidth + "x" + window.innerHeight;
  growWood();
  reckon();

  // THE WOOD GROWS WHEN THE PAGE OPENS, from the foot of each tree out
  // to the last twig, and then stands there: the specks idle a hair
  // about their own places and bloom where the hand rests, and nothing
  // else moves. With animation turned off it is simply already grown
  // and perfectly still.
  if (REDUCE_MOTION) {
    paintWood();
  } else {
    const began = window.performance && window.performance.now
      ? window.performance.now() : Date.now();
    const settled = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = (now - began) / GROW_MS;
      grown = t >= 1 ? 1 : settled(t);
      // The bloom comes up and goes down rather than switching: the
      // hand arriving somewhere should not light the wood in one
      // frame.
      const wanted = handX > -9000 ? 1 : 0;
      const step = Math.min(1, BLOOM_EASE / 60);
      handAt += (wanted - handAt) * step;
      paintWood();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // A part opening makes the page longer, so the wood has to reach
  // further down it. Worked out again a moment after, rather than on
  // every frame of the opening.
  let regrow = 0;
  parts.forEach((part) => {
    part.addEventListener("toggle", () => {
      window.clearTimeout(regrow);
      regrow = window.setTimeout(growWood, 520);
    });
  });
})();
