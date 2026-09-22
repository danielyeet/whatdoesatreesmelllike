# The structure

Date: 2026-09-14 (`0dde7c8`, *Make theories a structure you travel through*), last
worked on in `5d5df1d` (*Let the road be travelled back, and open a station where you
click it*) the same day, with its scan removed and its traverses put on random bearings
in `e3def5f` on 2026-09-15. Migrated from CLAUDE.md on 2026-09-17.

Files: `categories/theories.html`, `structure.js` (~1,360 lines), the `structure-*`
block in `style.css`, `tests/structure.spec.js`

## What it is

`categories/theories.html` is a **technical drawing in three dimensions that you travel
into**, not a night sky — a frame of ribs and rails running away into the depth on
near-black, a ruled **spine** along the floor of it, and a fine **swarm** of particles
hanging in the air (`SWARM`, 2200). Scrolling carries you *into* the screen, the near
work sweeping past and new work coming up out of the dark. You cannot turn it or drag it
sideways — going further in is the whole of the gesture.

It replaced an earlier night-sky treatment ("the starfield"), and none of that is in the
code any more.

Two kinds of assembly stand in that frame, and the difference is the point:

- a **station** is one theory: bracketed, crosshaired, numbered, named, and clickable.
  There are nine, one per `<a class="work-row">` in the page.
- a **fixture** is structure only (`FIXTURES`, 30): the same kind of figure, unnamed,
  unbracketed, fainter, and **not** clickable. They are there so the frame is full of
  work rather than holding nine lit things in an empty volume — and so that being
  bracketed *means* something.

## The travel

- **The travel is the page's own scroll.** The canvas is `position: fixed` and a spacer
  (`.structure-road`) gives the page a height, so the scrollbar, the trackpad, the arrow
  keys, Page Down and a finger on a phone all drive it without a line of code. Catching
  the wheel and turning it into movement breaks every one of those.
- **Every bit of the travel is reversible.** The page is never quite still — it creeps —
  but that creep is a **breath** in and out of a fixed place (`CREEP`, `CREEP_EVERY`),
  written from the clock rather than added up. It used to be added up frame after frame,
  so where you were was the scroll *plus* however long the page had been open: leave it a
  minute and the start of the road was a minute behind you, and scrolling back to the top
  of the page no longer got you to the beginning of it. That was a reported bug. Anything
  new that moves the eye has to be something a scroll can undo.
- **The reading is the scroll, not the eye.** The percentage in the corner is worked out
  from `travel` — where the scroll has brought you — and not from `eye`, which also
  carries the breath. A number that ticks up and down on its own while nothing is being
  touched reads as drift however small it is; the drawing may move, the reading may not.
  That was a reported bug too.
- **The frame does not wrap.** Ribs (`RIB_EVERY`), rails, stations (`STOP_EVERY`,
  `FIRST_STOP`, `RUN_ON`) and fixtures stand at fixed depths along a road with a
  beginning and an end, so there is always somewhere to have got to. Ribs alternate: a
  full rectangle, then a narrower set of corner brackets between.
- **The spine is a second way to drive the same scroll.** It is drawn on the canvas as a
  ruler running along the floor to the vanishing point, ticked at every whole depth and
  numbered every ten, so the ticks stream towards you as you travel — the detents of a
  wheel. `.structure-spine` is the piece of screen that answers the hand, and dragging it
  **writes `window.scrollY`** (`GEAR` page pixels per pixel dragged) rather than keeping
  a travel of its own, so it and the scrollbar can never disagree. It is a real
  `<button>`: pressed rather than dragged — the only way it can be used from a keyboard —
  it goes on to the next station.

## The swarm

- **The swarm wraps in BOTH directions.** A speck keeps no position along the road at
  all: its depth is taken modulo `DEEP` each frame and *which lap* it is on decides where
  it stands across the frame, so it is somewhere new each time round and the air is full
  whichever way you are going. It used to be carried along — a speck that went behind you
  was moved out to the far end — which is invisible going forward and empties the air
  completely going back. That was a reported bug; it cannot come back in this shape, and
  `tests/structure.spec.js` travels back and forth and counts what is drawn.
- **Both wraps are hidden by a fade at each end of a lap**, near and far (`NEAR`,
  `FADE_NEAR`). Without the near one a speck about to wrap is hugely magnified and pops
  in the middle of the screen.

## The opening

**The page sets itself up when it opens** (`INTRO_*`, `built`): the rails shoot out to
the vanishing point, the ribs come up out of the depth one after another towards you, the
rule writes itself along the floor, the air fills, the stations come up, and the corner
sights snap in last. `built` runs 0→1 off the wall clock over `INTRO_MS` (1.5s) — not off
frames, so it takes the same moment on any machine — and every drawing function reads it.
Under `prefers-reduced-motion` it starts at 1: there is nothing to watch being set up.
The chrome comes with it: `structure.js` adds `lit` to the shell when the opening is over
and the stylesheet fades the readout, the category mark and the cue in on that.

**The page's own markup is never shown on the way in.** `theories.html` carries a line in
its `<head>` that marks the document `js-coming`, which paints the ground dark and holds
the plain list out of sight; `structure.js` clears it the moment the drawing is on the
page. Without it the browser paints the light page with its heading and rows first and
then has it replaced, which is a flash of a different page in front of the opening. It
clears itself on `window.load` as well, so a blocked or broken script still leaves the
plain list as the page rather than hiding it for good.

## A station, and the set-out

- **An assembly's figure is nearest-neighbour** (`NODES` 11, `JOIN` 3), not a shape
  written by hand. Some of its lines are *provisional* and come and go on their own
  clock; the rest are always there.
- **The station is what you click.** The link is sized to that station's own box on the
  screen every frame and laid over it, with the name below — so nothing in the stylesheet
  may give `.structure-stop` a size or a transform of its own. The box is **capped** at
  about half the window and taken off the page once it is carried clear of the window: a
  station you are nearly inside would otherwise be an invisible link the size of the
  screen, where clicking anywhere at all goes somewhere.
- **A station behind you or still out in the dark is `display: none`**, not faded to
  nothing — faded, it would still catch the pointer where there is nothing to point at.
  The window one is shown for (`SHOW_FROM` 41 … `SHOW_TO` 2) is deliberately wider than
  `STOP_EVERY` (30), so the next is coming up before the last has gone.
- **Clicking one sets it out; the click after that opens the theory.** The first click
  takes the station out of the frame: it comes forward, turns as it comes (`OPEN_TURN`),
  and its parts go out to arm's length on a **ring** (`OPEN_RING`) — the same figure with
  the same lines between the same parts, opened out and squared up the way a drawing of a
  part is set out to be read, with a scale ruled under it. The rest of the frame goes
  back behind one wash (`OPEN_VEIL`), and a **card** writes itself in beside it once the
  figure has landed. Five things about it:
  - It is a **click**, not a hover. Travelling past nine stations should not keep taking
    the page apart, so nothing here answers the pointer merely passing over one.
  - The card lives **inside the station's own `<a>`**, which is what keeps "a station is
    the only thing on this drawing you can click" true: the card is more of the station
    rather than a second thing to aim at, and clicking either follows the link. It also
    means the same two steps work from the keyboard, where Enter is a click.
  - Which place each part takes on the ring is worked out **once, at load** (`order`),
    read off round the figure as it already stands — so opening it is the parts moving
    out to arm's length, and nothing crosses anything.
  - Where the parts go is worked out in **screen** space, so an opened station stands
    perfectly still even though the drawing behind it does not.
  - Escape, a click anywhere else, and **travelling** all put it back. Going further in
    is the whole of this page's gesture and is never the thing that is blocked, so the
    travel is not held, locked or frozen while one is open.
  - The card carries the station's name, so the copy under the figure goes while it is
    open — one name, one place, the same rule [the node
    map](2026-09-11-the-node-map.md)'s preview follows. An optional `data-note` on the
    row is shown as a line of the owner's own; without one the card carries what the page
    already says plus the readings the drawing has. (No row carries one at the time of
    writing.)

## Colour, and the cursor

- **Blue means "you can open this", and nothing else.** The palette is white and
  near-white on gray-black; the cool accent is spent only on a station's brackets,
  crosshair, node rings and ranging squares. The figure itself, the frame, the spine and
  the travelling carriage are all white or steel. Drawing a whole station in blue filled
  the screen with it as you came up on one, and then blue stopped meaning anything.
- **The drawing carries `dark-surface`**, which is how the rest of the site says "the
  cursor has to go light over this". Without it `nav.js` leaves a dark cursor on a dark
  page.

## What moves while you stand still

**The moving parts are on their own clocks, not on the travel**, so the page has
something happening in it while you are standing still: the specks wobble about their own
places (`WOBBLE`), provisional lines come and go, beads run along the lines of whatever
station you are among, a **carriage** runs down the frame at you and lights each rib as
it passes, and **traverses** streak across it on **random bearings** (`TRAVERSES`,
`TRAVERSE_EVERY`).

Each traverse is given a direction anywhere round the circle, started off the frame on
the far side of that direction and run until both its head and its tail are outside the
box; they used to go only straight across or straight down, which read as a grid being
drawn rather than as falling stars, and the owner asked for them in random directions.

Under `prefers-reduced-motion` none of it moves: the clock stops, so the wobble, the
beads, the ranging squares and the traverses are all gone and the carriage simply stands
where it is — held still rather than switched off.

The carriage makes **one pass every `CARRIAGE_EVERY` seconds** (6.7) and is not drawn at
all in between. Its place is worked out from the clock rather than stepped along frame by
frame, so the rest between passes is one number to change; `CARRIAGE_FIRST` keeps it away
until the drawing has finished setting itself up. The owner has tuned this twice: from the
four-and-a-bit seconds it originally ran at, out to ten, and then back in by half again to
its present rate.

A faint **scan** used to pass down the whole window every nine seconds. The owner asked
for it gone; it was removed outright rather than left switched off, so there is no
`SCAN_*` and no `drawScan()` any more.

## Drawing it cheaply

- **Glows are stamped, not generated.** One radial gradient is drawn once into a small
  offscreen canvas per colour and then `drawImage`d wherever a glow is needed. Asking for
  a fresh `createRadialGradient` per speck per frame is the one thing that will not hold
  sixty frames a second here.
- **A grain tile is laid over the whole drawing.** It is not texture for its own sake: a
  wide, shallow vignette over a near-black ground comes out in visible steps, and
  something uneven laid over it is what breaks them.

## On a window taller than it is wide

A station is placed at a fixed distance from the middle of the frame, in the frame's own
units, and **how much of the window that distance turns out to be depends on the lens —
which is taken off the SHORTER side**. On a wide window a station comes out where it was
drawn to: out to the side, whole, with its name under it. On a window taller than it is
wide the same station is thrown half off the edge. The owner saw it on a phone: *"The
architecture if sunscreen is not fully on screen on the phone version"*.

Two things were wrong there, and they are separate:

- **The station.** They are drawn in towards the middle by however much narrower this
  window's own view is than a wide one's (`pull`, `SIDE_REF`), and it is a **shift rather
  than a squeeze** — the whole assembly moves in together, so a constellation is never
  drawn narrower than it was built. It is a minimum with 1, and **nothing on a wide window
  moves at all**: 1280 × 800 works out at 1.02 and 1920 × 1080 at 1.14, and both come back
  as 1. A phone in the hand is 0.62 whatever size it is, since the lens and the half-width
  are both taken off the width there.
- **The lettering.** The name hangs off the bottom left corner of the bracket and does not
  wrap, so it is slid back along by exactly how far it is over the edge, and never the
  other way (`--say-shift`, set every frame; `SAY_EDGE`). Its width is measured **once**,
  the first time the station is drawn, and thrown away on a resize or when the webfont
  lands: reading `offsetWidth` in a frame forces the browser to lay the page out again, and
  this runs sixty times a second.

**It is the NAME that is measured, not the whole say.** The line under it is only ever read
on a hover and is much the longest of the three, and sliding the lettering by that width
put the name off the *other* side of the window — the first go printed "of Sunscreen". Each
line in the say is its own width now (`width: max-content`) so the name can be asked how
wide it is without being told how wide the line under it is, and below 860px that line
wraps rather than running off the side.

## How to test it

```bash
npm test -- tests/structure.spec.js
```

Thirteen tests: the drawing setting itself up when the page opens without ever showing
the plain list it replaces; it being grown from the page's own rows with one station per
theory; the travel being the page's own scroll down a road several screens long; going
further in bringing new stations up and leaving the ones behind you off the page;
travelling *back* filling the air again as many times as you like; travelling back also
coming all the way back to the beginning after the page has been left alone; the reading
holding still wherever you stop; the spine working as a wheel both dragged and pressed; a
station being the thing you click and the only thing on the drawing that is one; clicking
one setting it out on the window and writing its card while pointing at one does nothing;
the click after that being the one that opens the theory, and escape or travelling
putting it back; it being drawn mostly white on near-black with the cool accent kept for
the marks that say a station can be opened; it saying `dark-surface` to the cursor; it not
creeping on its own under `prefers-reduced-motion`; and the plain list coming back when
the script is blocked.

## The swarm is the size and the shape of the window

The owner asked for "the stars to be related to the dimensions of that page". They were
not: a fixed 2,200 specks scattered through a **square** cross-section, whatever the page
was being looked at on. So the air was thin on a wide screen and crowded on a small one,
and on a wide window the corners stood empty while a square of sky in the middle was
full. Both come off the window now, in `resize`:

- **How many** — `SWARM_PER` specks per million pixels of window, between `SWARM_LEAST`
  and `SWARM_MOST`, so the air is the same thickness whatever it is shown on. It is
  calibrated so that a 1280×720 window draws about what the fixed 2,200 always did; a
  smaller window gets fewer and a larger one more.
- **What shape** — the cross-section is stretched to the page's aspect ratio
  (`spreadX`, `spreadY`), keeping its area about the same. Widening the window widens the
  volume rather than magnifying what is in it.

**The pool is still built whole, and first, and this is the part not to undo.** The
specks that are *drawn* are the first `inAir` of a pool of `SWARM_POOL`; the pool itself
is always built at full size. That is not an optimisation. `random()` is the one seeded
stream this entire drawing is built from, and the stations are built *after* the swarm —
so building a different number of specks consumes a different number of random values and
**moves every station on the page**. The first version of this change built the swarm to
fit the window, and did exactly that: it silently re-rolled the whole structure, and the
regression test that says a station stays where it is while you stand still began to fail,
because the new layout happened to put a station close enough to the eye for the breath to
swing it more than the test's tolerance.

A window larger than the pool is served by `growPool`, which extends it — **from a
stream of numbers of its own (`morePool`), and only after everything else has been
built**, so that not one value of `random()` is spent and no station moves.

The lesson generalises to anything added to this file: **take specks off the end of the
pool, or add them with `morePool` after the build; never change how many values
`random()` is asked for before the stations are laid out.**

One more thing this cost, worth knowing: drawing fewer specks at the test's own viewport
made `it is drawn white on near-black` marginal, because that test counts lit pixels and
the count had quietly dropped by a quarter. It passed alone and failed in a loaded full
run. If a swarm change ever makes that test flaky, this is why — look at how many specks
are actually being drawn before looking anywhere else.

**It went again on 2026-09-22**, in the full run of the round that moved the houses into
`houses/`, and it is worth writing down how that was ruled out rather than assumed: every
file this page loads — `categories/theories.html`, `structure.js`, `style.css`, `nav.js`,
`search.js` and `page-search.js` — was byte-identical to the commit before that round, so
there was no mechanism by which the move could reach this drawing at all. It passed alone
in 3.5s and passed 13 of 13 in its own spec under load. **Check the six files first next
time**: if they are unchanged, the failure is this, and re-running proves nothing the
comparison has not already settled.

## A second way in, at the foot of a card

`data-calc` on a row is an address the card puts a boxed **OPEN CALCULATOR** at its foot,
over to the right, for a piece that carries something of its own worth going straight to.
Only `works/theory-03.html` has one. It is read off the page like `data-note` and
`data-plate`, so a theory without one simply does not get the button.

**It is not an anchor**, and it cannot be: the whole card already stands inside the
station's own `<a>`, and an anchor cannot stand inside an anchor. It is a `<span>` with a
link's role, a link's keys (Enter and Space) and a link's middle-click and
ctrl/cmd-click, and it stops the click from reaching the station — which by then is open,
so that click would otherwise be the one that opens the theory. The trade for doing it
that way is that the station stays **the only real link on the drawing**, which the
fixtures depend on and which there is a test for.

**The Note Dissemination Framework's card no longer shows the summary plate.** The owner
asked for the picture off that card; the plate still stands at the top of the piece
itself. `data-plate` and the machinery behind it are untouched — it is a content
convention any row may use — and no row uses it at the moment.

## Known issues / TODO

- The three theory pages the stations point at are **templates** — real structure,
  placeholder writing. See [the essay pages](2026-09-17-the-essay-pages.md).
- `images/Theories/` is empty but for its README, so this page's plates have nothing to
  show yet.
- The look of this page is a live subject; the owner has asked for several rounds on it
  and may ask for more.
