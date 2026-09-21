// ============================================================
// ATARAXIA — works/ataraxia.html
//
// The fourth house in Scent descriptions, and the house's own theme is
// ANGEL STATUES AND CROSSES. So the page stands in a churchyard:
// figures and crosses down both margins the whole length of it, every
// one of them cut out of specks, standing on a plinth of its own.
//
//   AN ANGEL   a plinth, a robe falling from the shoulders, a head,
//              and two wings sweeping up and back from behind the
//              shoulders.
//   A CROSS    a plinth, an upright and a crossbar — and a LEAN of a
//              degree or two, its own, because a churchyard's crosses
//              have all been standing a long time and none of them is
//              quite straight any more.
//
// NOTHING HERE MOVES, AND THAT IS THE DRAWING. Ataraxia is the old
// word for a mind with nothing troubling it, and this page is the
// exact opposite of Almost Human next door: there every speck knows
// where it belongs and stands somewhere else, and the figure is never
// quite a person. Here every speck stands EXACTLY where it belongs and
// never leaves — no stray, no drift, no idle. The margins are as still
// as stone, because stone is what they are.
//
// TWO THINGS HAPPEN ANYWAY, and both come from outside the statues:
//
//   THE LIGHT   a soft band crossing slowly down the window, about
//               one pass every half minute. What it falls on is drawn
//               more plainly. It is the only clock on the page.
//   THE HALO    bring the pointer near a standing and a fine ring
//               comes up over it — over the head of an angel, at the
//               crossing of a cross — and the standing itself is drawn
//               a little more plainly with it. Eased in and out, so it
//               arrives rather than switching on.
//
// THE PAGE'S OWN SHAPE — the parts opening, the rank down the side,
// the pictures — is house.js, which every house from this one on
// shares. This file draws the ground and nothing else, and the two
// never speak to each other.
//
// WHERE YOU ARE IS ALWAYS THE SCROLL. A standing is anchored in the
// DOCUMENT, not in the window, and where it lands on the screen is
// worked out from `scrollY` every frame rather than stepped along — so
// scrolling back gets you the same churchyard you left.
//
// WITHOUT THIS SCRIPT the page is all of its writing on the site's own
// paper, and the margins are simply empty.
// ============================================================
(function () {
  const canvas = document.querySelector(".human-field");
  if (!canvas) return;
  const ink = canvas.getContext("2d");
  if (!ink) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const SEED = 40711;
  const INK = "26, 25, 22";        // the site's own ink, as an rgb triple

  const COLUMN = 940;              // the writing's measure, kept clear
  // HOW FAR OUTSIDE THE COLUMN THE QUIET STARTS, and it is narrow here
  // on purpose. Almost Human next door uses 80, because its figures
  // are big and a wide soft edge is what keeps them off the reading.
  // A CHURCHYARD IS DIFFERENT: a standing is a single object with a
  // shape you are meant to read, and half an angel drawn at a
  // twentieth is not a soft edge, it is a missing wing. So the band is
  // narrow, and `build` keeps every standing clear of it entirely —
  // the two numbers are one decision and have to move together.
  const EASED_IN = 34;             // how far outside it the quiet starts
  const EDGE_LEAST = 0.26;         // the share of each side always left

  const EVERY = [300, 430];        // how far apart two standings are, down the page
  const TALL = [190, 330];         // how tall one WANTS to be, before the margin has its say
  const WIDE_OF = 0.62;            // how wide one is, as a share of its height
  const SPECKS = [980, 1500];      // how many specks one is cut from
  const STONE = [0.3, 0.55];       // and how heavily they are drawn

  const LIGHT_EVERY = 31;          // seconds for one pass of the light
  const LIGHT_WIDE = 0.34;         // how much of the window it covers
  const LIGHT_LIFT = 1.55;         // how much more plainly it draws

  const HAND = 150;                // how far the halo reaches, in pixels
  const HAND_EASE = 3.2;           // how fast it arrives and leaves
  const HALO_SPECKS = 150;
  const HALO_LIFT = 1.7;           // how much more plainly a held standing is drawn

  let seed = SEED;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const between = (a, b) => a + (b - a) * random();
  const rgba = (a) => "rgba(" + INK + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";

  // ============================================================
  // WHAT A STANDING IS, IN A BOX ONE UNIT WIDE AND ONE UNIT TALL
  //
  // y runs DOWN, so 0 is the top of the statue and 1 is the ground it
  // stands on. Everything below is written in that box and multiplied
  // up when it is drawn, so a standing can be any size without a
  // single number here changing.
  //
  // THE BOX IS SQUARE in the sense that matters: x and y are scaled by
  // the SAME number, so the proportions written here are the
  // proportions that come out.
  // ============================================================

  /** A point somewhere inside a rectangle. */
  function inBox(x0, y0, x1, y1) {
    return [x0 + (x1 - x0) * random(), y0 + (y1 - y0) * random()];
  }

  /** A point somewhere inside a disc. Square-rooted, or they all pile
      into the middle: area grows with the square of the radius. */
  function inDisc(cx, cy, r) {
    const a = random() * Math.PI * 2;
    const d = Math.sqrt(random()) * r;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  }

  /** A point on a quadratic curve from a to c bending through b, pushed
      off the curve by up to `thick` — which TAPERS along it, so a wing
      is broad where it leaves the shoulder and comes to a point. */
  function alongWing(ax, ay, bx, by, cx, cy, thick) {
    const t = random();
    const u = 1 - t;
    const x = u * u * ax + 2 * u * t * bx + t * t * cx;
    const y = u * u * ay + 2 * u * t * by + t * t * cy;
    const wide = thick * (1 - t) * (0.35 + 0.65 * (1 - t));
    return [x + (random() - 0.5) * 2 * wide, y + (random() - 0.5) * 2 * wide];
  }

  /** AN ANGEL. The robe is the whole of the body: it falls from the
      shoulders and widens to the hem, which is why there are no legs
      and no arms to draw — a statue in robes has neither. */
  function angel(count) {
    const specks = [];
    for (let n = 0; n < count; n++) {
      const which = random();
      let at;
      if (which < 0.11) {
        at = inBox(0.30, 0.885, 0.70, 1.0);            // the plinth
      } else if (which < 0.20) {
        at = inDisc(0.5, 0.232, 0.052);                 // the head
      } else if (which < 0.58) {
        // THE ROBE, widening as it falls. The half-width is worked out
        // from how far down the robe the speck sits, so the outline is
        // a curve rather than a wedge.
        const t = random();
        const y = 0.30 + t * 0.585;
        const half = 0.058 + 0.145 * Math.pow(t, 1.35);
        at = [0.5 + (random() - 0.5) * 2 * half, y];
      } else if (which < 0.79) {
        at = alongWing(0.425, 0.340, 0.230, 0.195, 0.095, 0.030, 0.060);
      } else {
        at = alongWing(0.575, 0.340, 0.770, 0.195, 0.905, 0.030, 0.060);
      }
      specks.push(at);
    }
    return { specks: specks, halo: [0.5, 0.128, 0.086] };
  }

  /** A CROSS, with a lean of its own. The lean is applied here rather
      than when it is drawn, so it costs nothing per frame and so two
      crosses never lean the same way. */
  function cross(count) {
    const tilt = (random() - 0.5) * 0.085;
    const sin = Math.sin(tilt), cos = Math.cos(tilt);
    // It leans about the TOP OF ITS PLINTH, the way a settling stone
    // does, not about its own middle.
    const px = 0.5, py = 0.9;
    const lean = (p) => {
      const dx = p[0] - px, dy = p[1] - py;
      return [px + dx * cos - dy * sin, py + dx * sin + dy * cos];
    };
    const specks = [];
    for (let n = 0; n < count; n++) {
      const which = random();
      if (which < 0.13) {
        specks.push(inBox(0.33, 0.9, 0.67, 1.0));       // the plinth, upright
        continue;
      }
      let at;
      if (which < 0.66) at = inBox(0.462, 0.10, 0.538, 0.90);   // the upright
      else at = inBox(0.225, 0.298, 0.775, 0.368);              // the crossbar
      specks.push(lean(at));
    }
    return { specks: specks, halo: lean([0.5, 0.333])
      .concat([0.165]) };
  }

  // ============================================================
  // THE CHURCHYARD, BUILT ONCE
  //
  // In DOCUMENT space, and rebuilt only when the page's own height or
  // width changes — a standing belongs to a place in the writing, not
  // to a place on the screen.
  // ============================================================
  let width = 0, height = 0, docTall = 0;
  let yard = [];

  function build() {
    seed = SEED;
    yard = [];
    if (!width || !docTall) return;
    const edge = width > COLUMN ? (width - COLUMN) / 2 : width * EDGE_LEAST;
    // THE ROOM A STANDING HAS IS THE CLEAR PART OF THE MARGIN, not the
    // whole of it: everything within EASED_IN of the column is being
    // quietened, and a statue drawn there loses that side of itself.
    const room = Math.max(46, edge - EASED_IN);
    let y = 210;
    let n = 0;
    let wasAngel = false, run = 0;
    while (y < docTall - 120) {
      const side = n % 2;                      // left, right, left, right
      // A STANDING HAS TO FIT IN THE MARGIN, and that is what decides
      // how big it is — not the other way round. The first go picked a
      // height and let the width fall out of it, which on a 1280
      // window made every statue 186px wide in a 170px margin: the
      // inner half of each one was over the writing, where `lit` draws
      // at a twentieth. Half of every angel was invisible, and the
      // half that was left read as a smear rather than as a figure.
      const wide = Math.min(TALL[1] * WIDE_OF, room);
      const tall = Math.min(between(TALL[0], TALL[1]), wide / WIDE_OF);
      const mid = side === 0
        ? wide * 0.5 + random() * Math.max(0, room - wide)
        : width - wide * 0.5 - random() * Math.max(0, room - wide);
      const many = Math.round(between(SPECKS[0], SPECKS[1]));
      // ANGELS AND CROSSES, and NOT strictly in turn. Rolled with a
      // memory of the last one, so two of a kind can stand together
      // but four cannot — a churchyard where the left side is all
      // angels and the right side is all crosses is a pattern you read
      // off in two seconds and stop looking at.
      const isAngel = run >= 2 ? !wasAngel : random() < 0.5;
      run = isAngel === wasAngel ? run + 1 : 1;
      wasAngel = isAngel;
      const made = isAngel ? angel(many) : cross(many);
      yard.push({
        y: y,
        mid: mid,
        tall: tall,
        wide: wide,
        angel: isAngel,
        stone: between(STONE[0], STONE[1]),
        specks: made.specks,
        halo: made.halo,
        near: 0,
      });
      y += between(EVERY[0], EVERY[1]);
      n += 1;
    }
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tall = Math.max(document.documentElement.scrollHeight, h);
    // A PHONE DRAWS AT A LOWER RATIO — half again the fill of two
    // device pixels to one, and no difference anybody can see at that
    // size. Nothing above 700 changes at all.
    const ratio = Math.min(window.innerWidth < 700 ? 1.5 : 2,
      window.devicePixelRatio || 1);
    const same = w === width && h === height && Math.abs(tall - docTall) < 40;
    width = w; height = h; docTall = tall;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!same) build();
  }

  /** How much of a speck is left where it stands over the writing.
      Asked of the COLUMN rather than of a share of the window, so the
      quiet band is exactly where the reading is however wide the
      window happens to be — WITH A FLOOR, because on a window narrower
      than the column there is no margin to take out and this would
      otherwise take the whole page out with it. */
  function lit(x) {
    const edge = width > COLUMN ? (width - COLUMN) / 2 : width * EDGE_LEAST;
    const soft = Math.min(EASED_IN, width * 0.12);
    const from = edge - soft, to = width - edge + soft;
    if (x <= from || x >= to) return 1;
    const inside = Math.min(x - from, to - x) / soft;
    return 0.05 + 0.95 * Math.max(0, 1 - Math.min(1, inside));
  }

  let handX = -99999, handY = -99999;

  /** HOW NEAR THE HAND IS to the box this standing actually occupies,
      rather than to a point in the middle of it. Inside the box is all
      the way there; outside it eases off over HAND pixels. */
  function reach(one, top) {
    if (handX < -9000) return 0;
    const dx = Math.max(0, Math.abs(handX - one.mid) - one.wide * 0.5);
    const dy = Math.max(0, Math.abs(handY - (top + one.tall * 0.5)) - one.tall * 0.5);
    return Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / HAND));
  }

  function draw(down, clock) {
    if (!width) return;
    ink.clearRect(0, 0, width, height);

    // THE LIGHT, crossing down the window. It is worked out once a
    // frame rather than per speck: where its middle is, and how wide
    // the band around that is.
    const pass = REDUCE_MOTION ? 0.34 : (clock / LIGHT_EVERY) % 1;
    const lightAt = -0.2 + pass * 1.4;
    const lightHalf = LIGHT_WIDE * 0.5;

    const ease = Math.min(1, HAND_EASE * (REDUCE_MOTION ? 1 : 0.016));

    yard.forEach((one) => {
      const top = one.y - down;
      if (top > height + 80 || top + one.tall < -80) { one.near = 0; return; }

      one.near += (reach(one, top) - one.near) * ease;
      const held = one.near;
      const left = one.mid - one.wide * 0.5;

      one.specks.forEach((at) => {
        const x = left + at[0] * one.wide;
        const y = top + at[1] * one.tall;
        if (y < -4 || y > height + 4) return;
        // How far this speck is from the middle of the light, as a
        // share of the window's height.
        const off = Math.abs(y / height - lightAt);
        const inLight = off > lightHalf ? 0
          : Math.pow(1 - off / lightHalf, 1.6);
        const shown = one.stone * lit(x) *
          (1 + (LIGHT_LIFT - 1) * inLight) *
          (1 + (HALO_LIFT - 1) * held);
        if (shown < 0.012) return;
        ink.fillStyle = rgba(shown);
        ink.fillRect(Math.round(x), Math.round(y), 1, 1);
      });

      // THE HALO. Drawn only when there is a hand to draw it for, and
      // built from the standing's own numbers so it stands over the
      // head of an angel and at the crossing of a cross.
      if (held <= 0.01) return;
      const hx = left + one.halo[0] * one.wide;
      const hy = top + one.halo[1] * one.tall;
      const r = one.halo[2] * one.wide;
      for (let k = 0; k < HALO_SPECKS; k++) {
        const a = (k / HALO_SPECKS) * Math.PI * 2;
        // Pressed flat, so it reads as a ring seen a little from below
        // rather than as a circle drawn on the window.
        const x = hx + Math.cos(a) * r;
        const y = hy + Math.sin(a) * r * 0.34;
        if (y < -4 || y > height + 4) continue;
        const shown = 0.5 * held * lit(x);
        if (shown < 0.012) continue;
        ink.fillStyle = rgba(shown);
        ink.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    });
  }

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
  // hovering: a drag sends `pointermove` and works already, but a TAP
  // sends `pointerdown` and may send nothing else at all.
  window.addEventListener("pointerdown", hand, { passive: true });
  window.addEventListener("pointerleave", () => {
    handX = -99999; handY = -99999;
  });

  window.addEventListener("resize", size);

  size();

  if (REDUCE_MOTION) {
    draw(window.scrollY, 0);
    window.addEventListener("scroll", () => draw(window.scrollY, 0), { passive: true });
  } else {
    const began = performance.now();
    (function frame(now) {
      // The page grows as parts are opened, so the churchyard is asked
      // to grow with it — but only when it actually has.
      if (Math.abs(document.documentElement.scrollHeight - docTall) > 40) size();
      draw(window.scrollY, (now - began) / 1000);
      requestAnimationFrame(frame);
    })(performance.now());
  }
})();
