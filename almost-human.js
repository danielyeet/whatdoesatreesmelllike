// ============================================================
// ALMOST HUMAN — works/almost-human.html
//
// The third house in Scent descriptions. Pineward's page is a wood and
// ADAR's is a void; this one is a CROWD.
//
// What is on the page that the markup does not carry:
//
//   THE FIGURES — people, standing down both margins the whole length
//   of the piece, and every one of them drawn entirely in specks. They
//   are built out of capsules — a head, a neck, a torso, two arms, two
//   legs — and the specks are scattered through those, so a figure is
//   a shape a crowd of particles happens to be making rather than an
//   outline with dots on it.
//
//   THE STRAY — and this is the house's own name, made into a
//   behaviour. Every speck knows exactly where it belongs and STANDS
//   SOMEWHERE ELSE: a fixed offset of its own, up to STRAY pixels, so
//   the figure is always nearly a person and never quite one. Bring
//   the hand near and the specks come home — the figure resolves under
//   your hand and comes apart again when you leave. Almost human until
//   you look at it.
//
//   THE RANK — the scale down the side: one tick per fragrance, inked
//   in as it is passed, filled from the very top of the page by the
//   scroll, with the reading in the corner counting them. Pineward's
//   trunk and ADAR's sounding by a third name, and it reads the page
//   the same way both of those do.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. A figure is anchored in the
// DOCUMENT, not in the window, and where it lands on the screen is
// worked out from `scrollY` every frame rather than stepped along — so
// scrolling back gets you the same crowd you left. Under
// `prefers-reduced-motion` the drift stops and the figures simply
// stand there, still at their own stray.
//
// THIS PAGE SPENDS NO ACCENT COLOUR AT ALL. Pineward has its green and
// ADAR its silver; this one is ink on the page's own paper, and what it
// spends instead is density. Nothing here is tinted.
//
// WITHOUT THIS SCRIPT the page is all of its writing: the parts are
// real <details> elements, and the drawing carries nothing to read.
// ============================================================
(function () {
  const page = document.querySelector(".human-page");
  if (!page) return;
  const parts = [...document.querySelectorAll(".human-part")];
  if (!parts.length) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 90312;

  // --- the figures
  //
  // THEY STAND IN THE MARGINS THE WRITING LEAVES, and the page's own
  // measure is what decides where that is: the head, the introduction
  // and the parts are all one column `COLUMN` wide, so what is left
  // either side of it is where a figure belongs. On a window too narrow
  // to have margins they stand behind the writing instead and `lit()`
  // takes them down to almost nothing there.
  const COLUMN = 940;         // the writing's own measure — style.css keeps the same
  const FIG_EVERY = 330;      // how far apart they stand down the page, in pixels
  const FIG_TALL = [170, 290];   // how tall one is drawn, in pixels
  const FIG_SPECKS = [760, 1080]; // how many specks one is made of
  const EDGE = 0.085;         // where they stand when there is no margin to stand in
  const SPECK = [1, 2.2];     // how big a speck is drawn
  const INK_MIN = 0.16;       // how plainly one is drawn at its faintest
  const INK_MAX = 0.5;        // and at its plainest
  // DENSER, AND A LITTLE LIGHTER EACH. The owner asked for more
  // particles; at the old weight nearly twice as many of them came out
  // as a heavier figure rather than a fuller one, so a speck carries a
  // little less of the ink and the figure weighs about the same.
  const FIG_INK = [0.60, 1.0];   // and a weight of its own for the whole figure
  const IDLE = 1.3;           // the pixel or so of drift each keeps about its place
  const IDLE_EVERY = [5, 17]; // and how long it takes over it, in seconds

  // --- the stray, which is the whole idea
  //
  // IT IS A SHARE OF THE FIGURE'S OWN HEIGHT and not a number of
  // pixels: a fixed twenty-six pixels is a soft edge on a tall figure
  // and a cloud with no shape at all on a short one, which is what the
  // first go looked like.
  //
  // AND IT IS FAR BIGGER THAN IT WAS. At a twentieth of the height a
  // figure standing on its own still read as a person, and the owner
  // asked for the opposite: the crowd should "indicate in no way shape
  // or form that they are going to converge on a humanoid body" until
  // the hand arrives. At a fifth of the height it is a cloud, and the
  // person is entirely the pointer's doing.
  const STRAY = 0.2;          // how far from home a speck stands, as a share of the height
  const STRAY_VARY = [0.75, 1.3]; // and a figure's own share of that
  const STRAY_NEAR = 0.1;     // what is kept even when fully resolved
  const HAND = 160;           // how far OUTSIDE a figure the hand still reaches
  const HAND_EASE = 2.6;      // how quickly a figure comes home and comes apart again

  // --- and what is wrong with each of them
  //
  // EVERY FIGURE HAS SOMETHING THE MATTER WITH IT, and it only shows
  // once the figure has been HELD together for a moment: the owner
  // asked for the glitching to start after a short delay of being fully
  // formed, so it reads as something failing in a thing that had just
  // worked rather than as noise.
  //
  // The four faults run in order down the page, so no two neighbours
  // have the same one:
  //
  //   head    the head comes apart and re-forms in slices
  //   torso   the torso loses specks as well as slipping
  //   arm     one arm, and nothing else
  //   all     every part of it, each on a clock of its own
  const FAULTS = ["head", "torso", "arm", "all"];
  const HELD_FOR = 0.55;      // how long it must stand formed first, in seconds
  // IT COMES AND GOES RATHER THAN RUNNING ON. The owner asked for
  // "1 second glitched, and 5 seconds not" instead of a fault that,
  // once it arrived, simply stayed. So it is a beat on a clock of its
  // own, counted from the moment the figure has been held long enough,
  // and the figure stands whole in between.
  const GLITCH_CYCLE = 6;     // seconds from the start of one fault to the next
  const GLITCH_FOR = 1;       // how long one lasts, in seconds
  const GLITCH_EDGE = 0.2;    // and how long it takes to come up and go again
  const GLITCH_RATE = 8;      // how many times a second it re-rolls
  const GLITCH_BAND = 0.045;  // how tall a slipped slice is, as a share of the figure
  // AND IT IS SUBTLE. Every one of these was roughly twice what it is
  // now; the owner asked for the faults to be gentler as well as rarer.
  const GLITCH_PUSH = 0.14;   // how far a slice slips, as a share of the figure's width
  const GLITCH_DROP = 0.12;   // and the share of slices that go missing outright
  const GLITCH_LOSE = 0.15;   // what the torso loses on top of that
  const GLITCH_LIFT = 3;      // how far a slice slips up or down, in pixels

  // --- the ground
  const INK = "26,26,24";

  // --- the parts arriving
  const RISE_STEP = 55;
  const OPEN_MS = 760;
  const SHUT_MS = 620;
  const PART_EASE = "cubic-bezier(0.42, 0.02, 0.24, 1)";

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // AND THE THING THAT IS NOT PEOPLE
  //
  // One thing now, and it is weather. THE RAIN: falling the whole
  // length of the page, each drop a short string of specks rather
  // than a line. It lives in WINDOW space rather than down the
  // document — it is weather, not something standing in the writing
  // — and goes quiet over the reading like everything else here.
  //
  // THREE THINGS STOOD HERE AND ARE GONE. A sun and an empty chair
  // went in one round, when the owner asked for both of them gone
  // and for the rain to stay; RAYS — "particle rays that blast from
  // here and there" — went in the next, once they had seen them.
  // Nothing of any of the three is in this file.
  // ============================================================
  const RAIN_DROPS = 170;        // how many are falling at once
  const RAIN_BEADS = 5;          // the specks one drop is strung from
  const RAIN_FALL = [230, 520];  // how fast one falls, in pixels a second
  const RAIN_LONG = [24, 64];    // how long one is, in pixels
  const RAIN_SLANT = 0.16;       // how far it leans as it falls
  const RAIN_INK = [0.13, 0.34];

  // ============================================================
  // THE HOUSE'S MARK, IN THE GLITCH
  //
  // The owner asked for their logo to be part of what goes wrong with
  // a figure: "maybe make 1/3 of the glitches of the guys face be
  // replaced with the logo or something". So on about a third of the
  // beats, a figure whose HEAD is the faulty part loses its face and
  // the specks that were the head stand as the mark instead — which is
  // the house's name said one more way: the thing that is almost a
  // person, and then for a second is a brand.
  //
  // The mark is READ OFF THE OWNER'S OWN FILE rather than drawn here
  // from a guess at its geometry: the image is put on a small offscreen
  // canvas once and every dark pixel becomes a place a speck may stand.
  // It is their logo, so it should be their logo.
  // ============================================================
  // The 800px copy rather than the 3125px original, and the same file
  // the head of the page shows — so the mark is fetched once and used
  // twice. It is read on a 116 grid, so 800 is far more than enough.
  const LOGO_FILE = "../images/Almost-Human/house-web/ah-logo.webp";
  const LOGO_GRID = 116;      // how finely the mark is read off the file
  const LOGO_DARK = 140;      // and how dark a pixel has to be to count
  const LOGO_SPOTS = 900;     // how many places are kept
  const LOGO_ODDS = 0.34;     // the share of beats a head goes to the mark
  const LOGO_BIG = 2.1;       // how much bigger than the head it is drawn
  const LOGO_INK = 1.9;       // and how much more plainly

  // WHERE THE HEAD STANDS in a figure's own unit box, taken off BODY
  // above: the head capsule runs 0.065 to 0.105 with a radius of 0.052,
  // so it is 0.144 tall and its middle is at 0.085.
  const HEAD_AT = 0.085, HEAD_TALL = 0.144;

  /** The mark, as places a speck may stand. Empty until the file has
      arrived, which is the whole of the guard this needs: until then a
      head simply glitches the way it always did. */
  let LOGO = [];
  (function readMark() {
    const picture = new Image();
    picture.addEventListener("load", () => {
      try {
        const sheet = document.createElement("canvas");
        sheet.width = LOGO_GRID;
        sheet.height = LOGO_GRID;
        const paint = sheet.getContext("2d", { willReadFrequently: true });
        paint.drawImage(picture, 0, 0, LOGO_GRID, LOGO_GRID);
        const seen = paint.getImageData(0, 0, LOGO_GRID, LOGO_GRID).data;
        const spots = [];
        for (let y = 0; y < LOGO_GRID; y++) {
          for (let x = 0; x < LOGO_GRID; x++) {
            const at = (y * LOGO_GRID + x) * 4;
            // THE GROUND OF THE FILE IS TRANSPARENT, not white — the
            // page shows the same file and its paper is #fafaf9, so a
            // white square would stand a shade brighter than the page.
            // Both tests are kept: what counts is a pixel that is
            // there AND dark, which is true of the old opaque file as
            // well as of this one.
            if (seen[at + 3] < 40) continue;
            const dark = (seen[at] + seen[at + 1] + seen[at + 2]) / 3;
            if (dark <= LOGO_DARK) {
              spots.push([x / (LOGO_GRID - 1), y / (LOGO_GRID - 1)]);
            }
          }
        }
        // Shuffled once, so a head taking the first hundred of them
        // takes a hundred spread over the whole mark rather than its
        // top few rows. Its own roll, not the crowd's seeded one.
        for (let i = spots.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const keep = spots[i]; spots[i] = spots[j]; spots[j] = keep;
        }
        LOGO = spots.slice(0, LOGO_SPOTS);
      } catch (whatever) {
        // A canvas that will not be read is not worth a broken page.
        LOGO = [];
      }
    });
    picture.src = LOGO_FILE;
  })();
  // ============================================================
  // WHAT A PERSON IS, AS A HANDFUL OF CAPSULES
  //
  // Each one is a line with a thickness, given in a box one unit wide
  // and one unit tall with y running down — so a figure can be drawn at
  // any size by multiplying. A speck is put at a random point along a
  // capsule and then pushed off it by a random amount within its
  // radius, which fills the limb rather than outlining it.
  //
  // The parts are weighted by roughly how much of a person they are, so
  // the torso gets its share of the specks and the neck does not get
  // the same as a leg.
  // ============================================================
  // THE UNIT BOX IS SQUARE. A point's x and y are scaled by the SAME
  // number when a figure is drawn, so the proportions written here are
  // the proportions that come out. (The first go scaled x by 0.46 of
  // the height, which halved every width in the figure and turned the
  // whole thing into a vertical smear.)
  //
  // The parts do not overlap where a person's do not: the torso's top
  // stops at the shoulders rather than reaching up through the head,
  // and there is a neck between them. Without that the head, neck and
  // chest come out as one blob and nothing reads as a person at all.
  const BODY = [
    { a: [0.500, 0.065], b: [0.500, 0.105], r: 0.052, of: 15 },               // head
    { a: [0.500, 0.155], b: [0.500, 0.185], r: 0.017, of: 3 },                // neck
    { a: [0.500, 0.250], b: [0.500, 0.470], r: 0.082, of: 32 },               // torso
    { a: [0.435, 0.245], b: [0.345, 0.520], r: 0.027, of: 10, swings: true }, // left arm
    { a: [0.565, 0.245], b: [0.655, 0.520], r: 0.027, of: 10, swings: true }, // right arm
    { a: [0.462, 0.500], b: [0.442, 0.930], r: 0.037, of: 15, swings: true }, // left leg
    { a: [0.538, 0.500], b: [0.558, 0.930], r: 0.037, of: 15, swings: true }, // right leg
  ];
  const BODY_TOTAL = BODY.reduce((sum, one) => sum + one.of, 0);

  /** One figure's worth of specks, in its own unit box. `lean` tips the
      arms and legs a little so no two people stand exactly alike.

      Each speck comes back as [x, y, part] — WHICH PART OF A PERSON IT
      BELONGS TO, which is the whole of what the faults need: a head
      that comes apart is the specks whose part is the head, and nothing
      else on the figure moves. */
  function makeBody(lean, howMany) {
    return sample(BODY, BODY_TOTAL, howMany, lean);
  }

  /** The same for any set of capsules, so the chair is built the way a
      person is. `lean` swings the parts marked `swings`; nothing on a
      chair does. */
  function sample(capsules, total, howMany, lean) {
    const out = [];
    for (let n = 0; n < howMany; n++) {
      let pick = random() * total;
      let limb = capsules[capsules.length - 1];
      let part = capsules.length - 1;
      for (let i = 0; i < capsules.length; i++) {
        pick -= capsules[i].of;
        if (pick <= 0) { limb = capsules[i]; part = i; break; }
      }
      // Arms and legs swing about their own top end; the head, neck and
      // torso are the part of a person that does not.
      let bx = limb.b[0], by = limb.b[1];
      if (limb.swings) {
        const ax = limb.a[0], ay = limb.a[1];
        const dx = bx - ax, dy = by - ay;
        const turn = lean * (limb.b[0] < 0.5 ? -1 : 1);
        bx = ax + dx * Math.cos(turn) - dy * Math.sin(turn);
        by = ay + dx * Math.sin(turn) + dy * Math.cos(turn);
      }
      const t = random();
      const away = Math.sqrt(random()) * limb.r;
      const turn = random() * Math.PI * 2;
      out.push([
        limb.a[0] + (bx - limb.a[0]) * t + Math.cos(turn) * away,
        limb.a[1] + (by - limb.a[1]) * t + Math.sin(turn) * away,
        part,
      ]);
    }
    return out;
  }

  // ============================================================
  // THE CROWD
  //
  // Built once, in DOCUMENT space, and rebuilt only when the page's own
  // height or width changes — a figure belongs to a place in the
  // writing, not to a place on the screen.
  // ============================================================
  const canvas = document.querySelector(".human-field");
  const ink = canvas ? canvas.getContext("2d") : null;
  let width = 0, height = 0, docTall = 0;
  let crowd = [];
  let rain = [];

  /** One cloud of specks standing somewhere down the page. Every
      figure in the crowd is built through here, so they all stray,
      come home under the hand and go quiet over the reading alike. */
  function cloud(points, at, tall, mid, wander, weight) {
    let half = 0;
    const specks = points.map((one) => {
      const hx = mid + (one[0] - 0.5) * tall / width;
      half = Math.max(half, Math.abs(hx - mid) * width);
      return {
        hx: hx,
        hy: at + one[1] * tall,
        sx: between(-wander, wander) * tall,
        sy: between(-wander, wander) * tall,
        size: Math.max(1, Math.round(between(SPECK[0], SPECK[1]))),
        ink: between(INK_MIN, INK_MAX) * weight,
        every: between(IDLE_EVERY[0], IDLE_EVERY[1]),
        phase: random() * Math.PI * 2,
        part: one[2],
        down: one[1],
        // Its own place in the house's mark, for the beats a head goes
        // to the logo. Fixed, so the mark holds still while it is up.
        mark: Math.floor(random() * 99991),
      };
    });
    // HOW WIDE IT ACTUALLY STANDS, measured off the specks themselves
    // rather than guessed. The hand is answered against this box, so a
    // figure that leans hard is reached at its elbow like any other.
    return { y: at, tall: tall, mid: mid, half: half, specks: specks, home: 0 };
  }

  function build() {
    seed = SEED;
    crowd = [];
    if (!width || !docTall) return;
    // The middle of each margin, or the edge of the window when the
    // window is too narrow to have one.
    const free = Math.max(0, (width - COLUMN) / 2);
    const stand = free > 150 ? (free / 2) / width : EDGE;
    const top = window.innerHeight * 0.5;
    for (let y = top; y < docTall - 60; y += FIG_EVERY * between(0.84, 1.16)) {
      // Left and right alternately, each a little way in or out of its
      // own margin so the two columns are not a pair of railings.
      const side = crowd.length % 2 === 0 ? 0 : 1;
      const tall = between(FIG_TALL[0], FIG_TALL[1]);
      const mid = side === 0
        ? stand + between(-0.022, 0.026)
        : 1 - stand + between(-0.026, 0.022);
      // NO TWO OF THEM ARE THE SAME CROWD. Height, pose, how many
      // specks, how heavily they are drawn and how far they stray are
      // all their own, so the margin reads as a row of different people
      // rather than one person printed over and over.
      const howMany = Math.round(between(FIG_SPECKS[0], FIG_SPECKS[1]));
      const weight = between(FIG_INK[0], FIG_INK[1]);
      const wander = STRAY * between(STRAY_VARY[0], STRAY_VARY[1]);
      const fault = FAULTS[crowd.length % FAULTS.length];
      // For the "arm" fault, which arm — left (3) or right (4).
      const armPart = random() < 0.5 ? 3 : 4;
      // AND WHERE EACH SPECK ACTUALLY STANDS is fixed for the life of
      // the figure (`wander`, inside `cloud`), so the crowd is always
      // wrong in the same way — a stray that re-rolled would read as a
      // fizz rather than as a shape that has not settled.
      const body = makeBody(between(-0.22, 0.22), howMany);
      crowd.push(Object.assign(cloud(body, y, tall, mid, wander, weight), {
        held: 0, glitch: 0,
        fault: fault, armPart: armPart,
        // Its own place in the fault's clock, so two figures with the
        // same fault never come apart on the same frame.
        seed: Math.floor(random() * 9973),
      }));
    }

  }


  /** THE RAIN. It falls on the WINDOW rather than down the document —
      it is weather, not something standing in the writing — so it is
      built with the canvas and wraps at the foot of the screen. Each
      drop is a short string of specks rather than a line, because
      everything on this page is specks. */
  let drip = 7741;
  const roll = () => {
    drip = (drip * 1103515245 + 12345) % 2147483648;
    return drip / 2147483648;
  };
  const among = (pair) => pair[0] + (pair[1] - pair[0]) * roll();

  function buildRain() {
    rain = [];
    if (!width || !height) return;
    for (let n = 0; n < RAIN_DROPS; n++) {
      const long = among(RAIN_LONG);
      const beads = [];
      for (let k = 0; k < RAIN_BEADS; k++) beads.push(roll());
      beads.sort((a, b) => a - b);
      rain.push({
        x: roll() * width,
        y: roll() * (height + long * 2) - long,
        fall: among(RAIN_FALL),
        long: long,
        lean: RAIN_SLANT * 0.6 + RAIN_SLANT * 0.8 * roll(),
        ink: among(RAIN_INK),
        beads: beads,
      });
    }
  }

  function size() {
    if (!canvas) return;
    // A PHONE DRAWS AT A LOWER RATIO. Every canvas here is capped at
    // two device pixels to one CSS pixel, which on a desktop is
    // right and on a phone at three is still a million-odd pixels to
    // fill sixty times a second on a fraction of the power. Narrow
    // screens get 1.5, which is a little over half the fill and no
    // difference anybody can see at that size. Nothing above 700
    // changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
                           window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tall = document.documentElement.scrollHeight;
    const same = w === width && h === height && Math.abs(tall - docTall) < 40;
    width = w; height = h; docTall = tall;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) { build(); buildRain(); }
  }

  let handX = -99999, handY = -99999;

  /** How much of a speck is left where it stands over the writing: the
      column's own room, kept quiet without being kept empty. Asked of
      the COLUMN rather than of a share of the window, so the quiet
      band is exactly where the reading is however wide the window
      happens to be. */
  const EASED_IN = 80;        // how far outside the column it starts going quiet
  const EDGE_LEAST = 0.26;    // the share of each side always left to stand in
  function lit(x) {
    // ON A WINDOW NARROWER THAN THE COLUMN THERE IS NO MARGIN TO TAKE
    // OUT, and this used to take the whole page out with it: `edge`
    // came to nought, the quiet band covered the window, and every
    // every figure and every drop of rain was drawn at a
    // twentieth. On a phone this page had no ground at all — the whole
    // drawing was there and invisible.
    //
    // So a quarter of each side is always left, which is where the
    // figures are put (`EDGE`) when there is no margin to put them in.
    // The soft edge comes in with it, or on a narrow window the fade
    // is most of the page.
    //
    // AND ONLY BELOW THE COLUMN. Taking the wider of the two would move
    // the quiet band on a desktop as well — at 1280 across, a quarter
    // of each side is 333px where the margin is 170 — and a wide window
    // is not what is being fixed here.
    const edge = width > COLUMN ? (width - COLUMN) / 2 : width * EDGE_LEAST;
    const soft = Math.min(EASED_IN, width * 0.12);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return 0.05 + 0.95 * Math.max(0, 1 - Math.min(1, inside));
  }

  /** A stable number between 0 and 1 for a whole handful of integers.
      The same slice of the same figure on the same tick always answers
      the same way, which is what makes a fault a PATTERN that holds for
      a frame rather than a fizz that changes under itself. */
  function hash(a, b, c) {
    const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
    return v - Math.floor(v);
  }

  /** HOW FAR HOME A THING HAS COME, and it is asked of the box the
      thing actually stands in rather than of a point in the middle of
      it. It used to be a circle drawn round the figure's own middle,
      which meant the hand resolved it fully at the navel and only part
      way at the head or the feet — the owner asked to be able to
      "hover anywhere on them". Inside the box is all the way home;
      outside it eases off over HAND pixels. */
  function reach(thing, top) {
    if (handX < -9000) return 0;
    const cx = thing.mid * width;
    const dx = Math.max(0, Math.abs(handX - cx) - thing.half);
    const dy = Math.max(0, Math.abs(handY - (top + thing.tall * 0.5)) - thing.tall * 0.5);
    return Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / HAND));
  }

  let wasAt = 0;

  function draw(down, clock) {
    if (!ink || !width) return;
    ink.clearRect(0, 0, width, height);
    const idle = REDUCE_MOTION ? 0 : IDLE;
    const tick = Math.floor(clock * GLITCH_RATE);
    const step = REDUCE_MOTION ? 0 : 0.016;
    const ease = Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : 0.016));
    // Seconds since the last frame, for the one thing here that travels.
    const dt = REDUCE_MOTION ? 0 : Math.max(0, Math.min(0.05, clock - wasAt));
    wasAt = clock;

    drawRain(dt);

    crowd.forEach((figure) => {
      const top = figure.y - down;
      if (top > height + 60 || top + figure.tall < -60) return;

      // Eased towards rather than set, so it comes home and comes apart
      // again at a pace rather than snapping between the two.
      figure.home += (reach(figure, top) - figure.home) * ease;
      const held = STRAY_NEAR + (1 - STRAY_NEAR) * (1 - figure.home);

      // HOW LONG IT HAS STOOD FORMED, and from that where it is in its
      // fault's own clock. The owner asked for the glitching to start
      // "after a short delay of being fully formed" — so it is the
      // HOLDING that is counted, and letting go of a figure puts the
      // count straight back to nothing along with the fault.
      //
      // AND THE FAULT COMES AND GOES. It used to arrive and then simply
      // stay for as long as you kept your hand there. The owner asked
      // for "1 second glitched, and 5 seconds not": so from the moment
      // it has been held long enough there is a beat of GLITCH_FOR in
      // every GLITCH_CYCLE, easing in and out over GLITCH_EDGE at each
      // end, and the figure stands whole in between.
      if (figure.home > 0.82) figure.held += step; else figure.held = 0;
      const since = figure.held - HELD_FOR;
      let wantGlitch = 0;
      if (!REDUCE_MOTION && since > 0) {
        const at = since % GLITCH_CYCLE;
        if (at < GLITCH_FOR) {
          wantGlitch = Math.max(0, Math.min(1,
            Math.min(at, GLITCH_FOR - at) / GLITCH_EDGE));
        }
      }
      figure.glitch += (wantGlitch - figure.glitch) * (step === 0 ? 1 : 0.22);

      /** Whether this part of this figure is the part that is wrong. */
      const faulty = (part) => {
        if (figure.fault === "all") return true;
        if (figure.fault === "head") return part === 0 || part === 1;
        if (figure.fault === "torso") return part === 2;
        return part === figure.armPart;
      };
      const wide = figure.tall * GLITCH_PUSH;

      // AND ON ABOUT A THIRD OF THE BEATS, A HEAD GOES TO THE MARK.
      // Rolled once per beat rather than per frame, off the beat's own
      // number and the figure's own seed, so it holds for the whole of
      // that second instead of flickering in and out of it — and so the
      // same figure does not go to the logo every time.
      const beatNo = Math.floor(Math.max(0, since) / GLITCH_CYCLE);
      const headIsFaulty = figure.fault === "head" || figure.fault === "all";
      const toMark = LOGO.length > 0 && headIsFaulty && figure.glitch > 0.02 &&
        hash(7, beatNo, figure.seed + 313) < LOGO_ODDS;
      // Where the mark stands and how big: on the head, a little wider
      // than it, so it reads at all.
      const markSize = figure.tall * HEAD_TALL * LOGO_BIG;
      const markX = figure.mid * width;
      const markY = top + figure.tall * HEAD_AT;

      figure.specks.forEach((one) => {
        const wander = idle === 0 ? 0 : idle *
          Math.sin((clock / one.every) * Math.PI * 2 + one.phase);
        let x = one.hx * width + one.sx * held + wander;
        let y = one.hy - down + one.sy * held + wander * 0.7;
        let shown = one.ink * (0.78 + 0.34 * figure.home) * lit(x);

        // THE FAULT. A slice of the figure — a band of it a fortieth of
        // its height tall — is pushed sideways, and some slices are not
        // drawn at all. Each part keeps its own place in the clock, so
        // on the figure whose fault is "all" the head, the arms and the
        // legs come apart at different moments rather than together.
        // THE HEAD, GONE TO THE MARK. The speck does not slip or drop
        // — it stands somewhere on the logo instead, in its own fixed
        // place on it, and is drawn a little more plainly so the mark
        // is a mark rather than a smudge where a head was.
        if (toMark && (one.part === 0 || one.part === 1)) {
          const spot = LOGO[one.mark % LOGO.length];
          const held2 = figure.glitch;
          const wasX = x, wasY = y;
          x = wasX + ((markX + (spot[0] - 0.5) * markSize) - wasX) * held2;
          y = wasY + ((markY + (spot[1] - 0.5) * markSize) - wasY) * held2;
          shown *= 1 + (LOGO_INK - 1) * held2;
          if (y < -8 || y > height + 8) return;
          if (shown < 0.012) return;
          // Drawn two pixels square whatever the speck's own size is:
          // a hundred and fifty specks strung round a ring only read as
          // a ring if they nearly touch.
          ink.fillStyle = rgba(shown);
          ink.fillRect(Math.round(x), Math.round(y), 2, 2);
          return;
        }

        if (figure.glitch > 0.02 && faulty(one.part)) {
          const band = Math.floor(one.down / GLITCH_BAND);
          const beat = tick + (figure.fault === "all" ? one.part * 3 : 0);
          const roll = hash(band, beat, figure.seed);
          if (roll < GLITCH_DROP * figure.glitch) return;
          x += (hash(band, beat, figure.seed + 41) - 0.5) * 2 * wide * figure.glitch;
          y += (hash(band, beat, figure.seed + 97) - 0.5) * 2 *
               GLITCH_LIFT * figure.glitch;
          // The torso does not only slip, it LOSES specks — the owner
          // asked for one with particles missing from it.
          if (figure.fault === "torso" &&
              hash(band, beat, figure.seed + 7) < GLITCH_LOSE * figure.glitch) return;
          shown *= 0.72 + 0.5 * roll;
        }

        if (y < -8 || y > height + 8) return;
        if (shown < 0.012) return;
        ink.fillStyle = rgba(shown);
        ink.fillRect(Math.round(x), Math.round(y), one.size, one.size);
      });
    });
  }

  /** THE RAIN, falling. It is the one thing on this page that travels
      of its own accord rather than standing and straying, and it goes
      quiet over the reading like everything else. Under
      `prefers-reduced-motion` it is drawn where it stands and does not
      fall. */
  function drawRain(dt) {
    rain.forEach((drop) => {
      if (dt > 0) {
        drop.y += drop.fall * dt;
        // Wrapped rather than re-rolled: re-rolling here would take
        // numbers out of the seeded run the crowd is built from.
        if (drop.y - drop.long > height) drop.y = -drop.long;
      }
      const shown = drop.ink * lit(drop.x);
      if (shown < 0.012) return;
      ink.fillStyle = rgba(shown);
      drop.beads.forEach((at) => {
        const y = drop.y - drop.long * at;
        if (y < -4 || y > height + 4) return;
        ink.fillRect(Math.round(drop.x + drop.long * at * drop.lean),
                     Math.round(y), 1, 1 + (at < 0.25 ? 1 : 0));
      });
    });
  }

  // ============================================================
  // THE PHOTOGRAPHS
  //
  // A picture that is not there yet is taken off the page altogether,
  // which puts the hatched placeholder back under it — a browser's own
  // broken-image mark reads as a fault rather than as work still to
  // come, and this house is meant to be publishable one photograph at
  // a time.
  // ============================================================
  document.querySelectorAll(".human-part img").forEach((picture) => {
    picture.addEventListener("error", () => picture.remove());
    // AND THE ONES THAT HAVE ALREADY FAILED BY NOW. A picture whose
    // file is missing usually errors before this script has run at all,
    // and an `error` listener added afterwards never hears about it —
    // so on a house with no photographs yet every placeholder stayed
    // hidden behind a broken picture. `complete` with no width is a
    // picture the browser has finished with and got nothing from.
    if (picture.complete && !picture.naturalWidth) picture.remove();
  });

  // ============================================================
  // THE RANK — the scale down the side, and the reading
  //
  // Pineward's trunk and ADAR's sounding by a third name, and it says
  // the same two things they do, separately: the FILL is how far down
  // the page you are, from its very first pixel, and the TICKS are how
  // many fragrances you have been past.
  // ============================================================
  const rank = document.createElement("div");
  rank.className = "human-rank";
  rank.setAttribute("aria-hidden", "true");
  rank.innerHTML =
    '<span class="human-rank-line"><span class="human-rank-fill"></span></span>';
  const ticks = document.createElement("div");
  ticks.className = "human-ticks";
  parts.forEach(() => {
    const tick = document.createElement("span");
    tick.className = "human-tick";
    ticks.appendChild(tick);
  });
  rank.appendChild(ticks);
  page.appendChild(rank);

  const readout = document.createElement("p");
  readout.className = "human-readout";
  readout.innerHTML =
    '<span class="human-readout-no">00</span>' +
    '<span class="human-readout-of"> / ' +
      String(parts.length).padStart(2, "0") + "</span>" +
    '<span class="human-readout-where">Introduction</span>';
  page.appendChild(readout);

  const tickAt = Array.from(ticks.children);
  const rankFill = rank.querySelector(".human-rank-fill");
  const readNo = readout.querySelector(".human-readout-no");
  const readWhere = readout.querySelector(".human-readout-where");

  /** How much of the WINDOW this thing is filling, in pixels. */
  function filling(el) {
    const box = el.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
  }

  const NAMES_IT = 0.45;

  function nameOf(part) {
    const title = part.querySelector(".human-title");
    return title ? title.textContent.trim() : "";
  }

  let said = "";
  function reckon() {
    const line = window.innerHeight * 0.34;
    let at = -1;
    for (let n = 0; n < parts.length; n++) {
      if (parts[n].getBoundingClientRect().top <= line) at = n; else break;
    }
    const down = window.scrollY || window.pageYOffset || 0;
    const room = Math.max(0,
      document.documentElement.scrollHeight - window.innerHeight);
    // AT THE FOOT OF THE PAGE, EVERYTHING HAS BEEN PASSED. The last
    // fragrances never reach a line a third of the way down the window,
    // because the page runs out before they can. Pineward and ADAR both
    // had that fault and both have this rule; the three are worth
    // keeping in step.
    if (room > 0 && down >= room - 2) at = parts.length - 1;
    tickAt.forEach((tick, n) => tick.classList.toggle("passed", n <= at));

    if (rankFill) {
      const filled = room > 0 ? Math.max(0, Math.min(1, down / room)) : 0;
      rankFill.style.transform = "scaleY(" + filled.toFixed(4) + ")";
    }

    let most = 0, biggest = null;
    parts.forEach((part) => {
      const got = filling(part);
      if (got > most) { most = got; biggest = part; }
    });
    // WHAT YOU ARE LOOKING AT. An open fragrance filling enough of the
    // window names itself; otherwise the answer is the introduction
    // until you have passed the first fragrance, and the house after
    // that. Asked of the COUNT rather than of what is filling the
    // window, because this page is short enough that the introduction
    // is still on screen at the foot of it — which had the reading
    // saying "05 / 05 · Introduction".
    const names = biggest && biggest.open && most >= window.innerHeight * NAMES_IT;
    const where = names ? nameOf(biggest) : (at < 0 ? "Introduction" : "The house");
    const now = String(at + 1) + "|" + where;
    if (now === said) return;
    said = now;
    readNo.textContent = String(Math.max(0, at + 1)).padStart(2, "0");
    readWhere.textContent = where;
  }

  // ============================================================
  // THE PARTS — coming up as they are reached, and opening on a
  // measured height so the page does not jump under what is being
  // read. The same two moves Pineward and ADAR make, for the same
  // reasons the owner gave for them: "smooth and gradual, not so
  // sudden".
  // ============================================================
  if (!REDUCE_MOTION && "IntersectionObserver" in window) {
    // PUT ON BEFORE ANYTHING IS WATCHED, because this is the class that
    // holds the parts back. Nothing is hidden until the script says it
    // is watching, so a blocked script leaves every one of them on the
    // page — and putting it on late would show them and then take them
    // away again.
    page.classList.add("human-ready");
    let due = 0;
    const watcher = new IntersectionObserver(
      (seen) => {
        const now = performance.now();
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
    document.querySelectorAll(".human-intro").forEach((one) => {
      one.classList.add("human-rises");
      watcher.observe(one);
    });
  } else {
    parts.forEach((part) => part.classList.add("arrived"));
  }

  parts.forEach((part) => {
    const body = part.querySelector(".human-body");
    const summary = part.querySelector("summary");
    if (!body || !summary) return;
    const cue = part.querySelector(".human-cue");
    let moving = false;
    let pending = false;

    const say = () => { if (cue) cue.textContent = part.open ? "Close" : "Open"; };
    part.addEventListener("toggle", say);

    // Read off the stylesheet rather than written here, so the two
    // cannot disagree: the padding has to travel with the height, or
    // the last frame of closing is an empty box that then disappears.
    const padTop = getComputedStyle(body).paddingTop;
    const padBottom = getComputedStyle(body).paddingBottom;

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

    const drain = () => {
      if (!pending) return;
      pending = false;
      act();
    };

    function act() {
      moving = true;

      if (!part.open) {
        // Opened at once, because its contents have to be on the page
        // to be measured, and then run from nothing to the height they
        // want.
        part.open = true;
        const to = body.scrollHeight;
        body.style.overflow = "hidden";
        body.style.height = "0px";
        body.style.paddingTop = "0px";
        body.style.paddingBottom = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(8px)";
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
        window.setTimeout(() => { settle(); size(); reckon(); drain(); }, OPEN_MS + 60);
        return;
      }

      // Closing, the writing goes first and the box follows it down —
      // shut the element first and the browser takes the contents off
      // the page in that frame, which is the cut this exists to avoid.
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
        size();
        reckon();
        drain();
      }, SHUT_MS + 40);
    }

    summary.addEventListener("click", (event) => {
      if (REDUCE_MOTION) return;
      event.preventDefault();
      // A click that lands while the box is still moving is REMEMBERED,
      // not dropped — and only one is kept, so hammering the summary
      // does at most one more thing rather than queueing up a pile.
      if (moving) { pending = true; return; }
      act();
    });
  });

  // A result on the search page links straight at one fragrance, and
  // being shown a closed list with it somewhere inside is not an
  // answer. `SiteSearch` is only on the pages that load it; without it
  // this does nothing and the link still lands on the right part of the
  // page.
  if (window.SiteSearch) window.SiteSearch.openFromHash(".human-part");

  // ============================================================
  // KEEPING UP
  // ============================================================
  const hand = (event) => {
    handX = event.clientX;
    handY = event.clientY;
    if (REDUCE_MOTION) draw(window.scrollY, 0);
  };
  window.addEventListener("pointermove", hand, { passive: true });
  // AND A TAP COUNTS AS THE HAND ARRIVING. On a phone there is no
  // hovering: a drag sends `pointermove` and works already, but a
  // TAP sends `pointerdown` and may send nothing else at all, so
  // without this a touch on a figure did nothing. Same handler,
  // same numbers — a mouse simply sets the same place twice.
  window.addEventListener("pointerdown", hand, { passive: true });
  window.addEventListener("pointerleave", () => {
    handX = -99999; handY = -99999;
  });

  window.addEventListener("resize", () => { size(); reckon(); });
  window.addEventListener("scroll", reckon, { passive: true });

  size();
  reckon();

  if (REDUCE_MOTION) {
    draw(window.scrollY, 0);
    window.addEventListener("scroll", () => draw(window.scrollY, 0), { passive: true });
  } else {
    const began = performance.now();
    (function frame(now) {
      draw(window.scrollY, (now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
