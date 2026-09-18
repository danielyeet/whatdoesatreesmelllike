# The chamber

Date: 2026-09-15 (`10eaaca`, *Open a chamber for the favourites*), through many rounds
to `8137578` (*Stop the word blinking, put the specks in front of the menu*) on
2026-09-17. Migrated from CLAUDE.md on 2026-09-17.

Files: `categories/favorites.html`, `chamber.js` (~1,740 lines — the largest file in the
repository), the `chamber-*` block in `style.css`, `tests/chamber.spec.js`

This page has had more rounds of work than anything else on the site. Most of the
paragraphs below are the record of a specific thing that was tried and was wrong; they
are load-bearing, not history.

## What it is

The main menu's **Favourites** category is a **chamber**: two injectors, at opposite
corners of the window — top right and bottom left — firing a fine stream of particles at
a slant across it on white. What the streams join is an **orbit** — tilted well off
square to the window, so it reads as a lens rather than as a circle drawn on the page,
and a **disc** rather than a ring: every particle stands a little way in or out of the
orbit's own line (`DISC`), so what gathers is a band with a thickness to it.

It is [the structure](2026-09-14-the-structure.md)'s world turned inside out — the same
particles and the same instrument marks, printed as ink on white instead of white on
near-black — except that this one spends no accent at all: it is ink on white and
nothing else.

**There is only ever one arrangement here, and the whole of the interaction is that one
arrangement changing size.**

- **Closed**, the word **FAVOURITES** stands alone in the middle of the orbit and the
  orbit turns round it. That word is the whole of the page's chrome, and it is the button
  — so it is dressed as one: four **crop marks** bracket it and a small boxed **cue**
  under it says `EXPAND`, with a chevron pointing the way it will go. Without those it
  read as a heading somebody had centred rather than as something to press.
- **Open**, pressing the word **widens the orbit** until it stands clear round the menu,
  which opens out of the word as it goes (the cue now reading `COLLAPSE`, its chevron
  turned over). It never stops turning. The chapters stand in the column first; opening
  one puts its own favourites in the same column in their place, with a way back. Escape
  steps out one level at a time, and a press anywhere off the writing closes it.

The open state **used to be something else entirely**: the particles were thrown out to
the borders of the window and held there as a rectangle. That put two different things
on one page with a costly step between them, and the step was the most awkward moment on
it. One thing that grows is smooth in both directions for the same reason — there is no
`EDGE`, no seat and no border in this file any more.

## The step

The step itself is a **timed ramp** eased flat at both ends (`OPEN_MS`, 2.2s), not an
exponential chase: a chase starts at its fastest and creeps at the end. It has been
lengthened twice — 1.7s, 1.9s, 2.2s — because the owner has asked for it smoother twice,
and there is nothing uneven left in the drawing to fix: measured, every frame of the step
comes in at 16.7ms and none over 20, so time is what is left to give it.

Five things make that step one movement rather than several, and each of them was once
the thing that made it read as a lurch.

### Nothing that arrives may change the size of the plate

The menu hangs out of the flow (`position: absolute` on `.chamber-panel`, under the
word), and what centres the word and the menu together is `--menu-lift` — how far
`.chamber-plate` stands above the middle of the window, measured by `chamber.js` off the
laid-out boxes and eased by the stylesheet on the step's own curve.

The menu used to be a second thing in the plate's own stack, so the frame it went on to
the page the box grew by the whole height of it and the word was **shoved 143 pixels up
the window in that one frame**, before any of the easing had begun — and the same in
reverse when the menu was taken off the page again. That was a reported bug: *"the word
expand blinks to a position above it and then only is a smooth animation played"*.
`tests/chamber.spec.js` now watches the word every frame through both halves of the step
and fails on any jump.

Three things about the lift are easy to undo:

- It is measured off the MENU alone — its own height plus the gap under the word — and
  not off the plate's laid-out box, which the menu's own arrival shifts by a few pixels
  as it fades: a target that keeps moving restarts the easing under itself every frame,
  and the plate was still short of its place a second after the step had finished.
- It is written to the page **once per step**, when the menu opens or closes, and never
  again while that step is running: re-measuring mid-step is the same moving target by
  another route, and on a screen whose pixels are not whole numbers it came out a
  fraction different every frame, so the word crept up and down by a pixel the whole way.
  That was a reported bug — *"the word favorites (and its corresponding menu) seems to
  blink up and down whenever you expand and collapse"* — and it is why the reading is
  taken in fractions of a pixel rather than from the whole-number `offsetTop` /
  `offsetHeight` it used to use.
- The menu is a **fixed length** (`height` on `.chamber-panel`, with `max-height` in
  `svh` behind it for a short window), so a chapter of three favourites and a chapter of
  thirty stand the word in exactly the same place and the column scrolls inside the panel
  instead. The owner asked for that outright, having more than ten favourites in mind; it
  also means the lift is one number rather than a different one at every level of the
  menu. The test clones thirty rows into an open chapter and checks the panel's box does
  not change.

### The drawing and the writing travel on one curve

`--chamber-step` and `--chamber-step-ms` in `style.css` are the whole of it, and
`chamber.js` solves that same cubic bezier itself (`easing()`, `STEP_EASE`) rather than
easing on one of its own. They used to share only the *length*: the orbit on a
symmetrical S and the word on the site's `--menu-ease`, which sets off quicker and has a
longer tail, so over the same 1.7s the two set off at different speeds and arrived at
different moments. **Change either number in the stylesheet and change `OPEN_MS` /
`STEP_EASE` with it.** The curve is deliberately gentle: the steeper standard curves
cover half the step in a quarter of its length, which on a movement this big is a surge
and then a wait.

### What the orbit is holding is carried out with it, not dragged

As the orbit widens, every particle it has hold of is moved out by however far the orbit
itself moved that frame (`grew`, `carried` in `move()`), in proportion to how firmly it
is held. Leaving that to the radial spring instead is what the step used to be, and a
spring stiff enough to catch a particle arriving at speed is far too stiff to move one
gently: measured, the in-and-out movement of the specks standing in the orbit peaked at
22 times its resting value as the menu opened, and their overall speed — which is what
the length of their tails is drawn from — rose by a third, so the whole ring combed
outward in long streaks and then fell back. Carried, the peak is about six times resting
and the overall speed does not change at all.

### The near specks pass in front of the menu

The owner asked for the particles to move in front of the table, so `.chamber-front` is
simply drawn over the writing and left alone: there is no clip and no veil in this file
any more — no `veil`, no `taken`, no `CLEAR_PAD` — and `clearing()` is now only the
orbit's fit and the lift.

Two earlier answers to the same room are worth not going back to. A **clip** switched on
in the one frame the panel joined the page put a hard-edged rectangle of nothing in the
middle of the drawing two thirds of a second before the panel began to fade in at all,
and the streams stopped dead against it with nothing there to stop them — the same
**invisible pane** the back canvas used to stand in the chamber, except in time rather
than in space, and a reported bug ("the table appears instantly as an object and
obstructs the flow of the particles"). A **veil** replaced it — the menu's box taken back
out of the finished drawing with `destination-out`, by exactly as much as the menu itself
had faded in — and that is what the page carried until the owner asked for the particles
in front. The panel keeps its border and its own ground, so the writing is still writing
with the streams crossing it; the test now checks the opposite of what it used to, that
the drawing does reach inside the menu's box.

### The menu leaves on the step, not in one frame

It used to be taken off the page in the one frame the word was pressed, leaving the orbit
to spend the next two seconds coming back in after it — half of the page's only movement
was a cut. It fades and rises back into the word instead (`shutting` on the plate,
`chamber-shut` in the stylesheet), and `chamber.js` takes it off the page after
`SHUT_MS` (1.25s) rather than at the end of the 2.2s step — it is back inside the word
well before the orbit has finished narrowing, and the room kept clear for it goes with
it, so waiting until the end would drop a panel-sized hole of specks onto the page in one
frame. `SHUT_MS` must stay the length of `chamber-shut` in `style.css`. While it is
going it is `inert`, so there is nothing to press or tab into in something on its way
out.

On the way in the menu waits out the first third of the step (`chamber-open`, 1.45s
after a 0.75s delay), so the lettering has begun coming down before the panel appears
under it.

### The step from the word to the menu is one property moving, once

The word's `font-size` is the whole of what happens to the word — its letter-spacing,
padding, crop marks and the gap either side of its registration marks are all written in
`em`, so they come down with it rather than being animated in their own right. (Where the
word *stands* is the plate's `--menu-lift`, above, and travels on the same curve over the
same length, so the two read as one movement.) They used to be, each with its own
duration and several of them in pixels, and they arrived at slightly different moments —
the word appeared to settle in stages. The panel fades and rises a few pixels and does
nothing else; it used to be squashed flat and stretched out, which draws every line of
writing in it at the wrong height and then corrects it. The one transition to watch is
the crop marks': a duration on a length written in `em` is also a duration on the
lettering shrinking, so it is kept short (0.15s) or the brackets are still closing half a
second after everything else has landed.

## The fall, the catch, and the orbit

- **It is a real fall, not a path.** Every particle is thrown at the orbit and pulled in
  by the middle (`PULL`, softened close in by `SOFT`); within `CATCH_MUL` (2.2) times the
  orbit's own radius the chamber takes hold and does four things at once, and it needs
  all four. It turns it the way the orbit runs, up to the speed that would carry it round
  and no further; it holds it to **its own radius in the band**, not to one line; it
  takes the *radial* part of its travel out of it (`SETTLE`) and never the going-round
  part, which is the difference between an orbit settling and everything grinding to a
  halt; and it presses it flat onto its own leaf of the plane. Writing the curves by hand
  instead gives a pattern, and a pattern is something you can see repeat.
- **It is a DISC, not a ring** (`DISC` 0.14, `DISC_LIFT` 0.05). Every particle is given
  its own place across the band when it is sent — a fraction of whatever radius the orbit
  stands at, in and out, plus a little off the plane — so the orbit has a width and a
  thickness. Held to one exact radius instead, everything the chamber caught piled onto
  the same hairline and what gathered was too dense to read as particles at all: a drawn
  ellipse with a crust on it, which is what the owner asked to be given some leeway from.
  A *fraction* and not a flat distance, because the orbit is five units wide closed and a
  dozen open and a band that reads as a band closed is a hairline again open. Each place
  is rolled from **two** throws rather than one, so the band is crowded along the orbit's
  own line and thins towards its edges; spread evenly it has two hard rims and reads as
  two rings. The band is what `fitOrbit` measures with, too — its outer edge is what must
  fit the window and its inner edge what must stand clear of the menu.
- **How firmly it takes hold comes on over the OUTER FRACTION of the capture band**
  (`CATCH_GRIP`, 0.45), not across the whole of it, and that is what keeps particles from
  going astray. Spread across the whole band the hold came out at about half strength *on*
  the orbit and a fifth of it half a band out, so a particle that arrived a little wide was
  barely pulled in at all and rode round out there for a long time — a couple of dozen of
  them at once, which the owner reported twice. It is a fraction and not a flat distance
  because the band is four units wide closed and nearly ten open. Narrowing the band
  *itself* is the fix that doesn't work: the widening throws particles outward hard, and
  with a narrow band they sail straight out of it and the orbit empties. The same pass
  also takes *excess* going-round speed out (the turn is signed, not just added), because
  too much of it is an orbit that swings wide and comes back — the other half of the same
  complaint.
- **A stream is aimed AT THE ORBIT, not at the middle** — along the **tangent** from
  where it stands to the orbit (`entryFor`, `ENTRY_GRAZE` 0.92), carried forward along the
  way the orbit runs, and carrying most of the orbit's own direction with it as it goes.
  So it comes in at a slant and arrives already going the way the orbit goes. Aimed at the
  middle, every stream dived at the centre and had to be turned through most of a right
  angle to join, which is what read as chaos. The tangent is **worked out, not set**: a
  fixed angle is only right for one place to stand, and with two injectors at opposite
  corners a fixed one pointed the second of them almost straight at the middle — the very
  thing the aim exists to avoid.
- **The two injectors stand at opposite corners** (`CORNERS`: `[0.94, 0.09]` at depth 30
  and `[0.05, 0.93]` at depth 36), and that only works *because* of the aim above: both
  come in on a tangent and go round the same way, so they fall in behind each other. Four,
  one to every corner, fired at each other across the middle and read as a collision. Each
  is placed by working back from the point of the window it is meant to sit at, *at its own
  depth*, so both stay put at any window size while standing at two different depths — which
  is what stops the streams reading as a flat line. **They take turns being the quick one**
  (`PACE`, `PACE_EVERY`), so neither is always the fast one.
- **Both stand beyond the middle of the chamber in depth** (`MID`, 20), and that is not
  decoration. An injector nearer than `MID` is only a short way from the middle *in the
  volume*, however far into the corner of the window it looks — and one inside the distance
  the chamber takes hold at has its stream caught the instant it leaves. That happened: the
  upper injector had no visible stream at all while the lower one had a long one. For the
  same reason the capture distance is **capped** so it can never reach the injectors
  (`CATCH_KEEP` against `nearestSource`): the orbit widens a long way when the menu opens
  and the capture distance with it, and unchecked it swallowed each stream where it left.
- **Both launch speeds are fractions of the speed it would take to go round AT THE
  INJECTOR'S OWN DISTANCE**, not at the orbit's. An injector standing well out is much
  further from the middle than the orbit is, and going round out there is far slower; given
  the orbit's own sideways speed that far out, a stream was thrown off the side of the
  window and never arrived at all. Flat numbers instead had one stream drop straight down
  the hole while the other sailed past it. **And both are kept under the speed it would
  take to leave**, which is root-two times that same going-round speed: taken together they
  used to come to more than it, so a particle the orbit did not catch on its way past was
  not on a long way round — it was gone, and what that looked like was a wide band of
  specks travelling from one corner of the window clean off the far edge of it. That was
  reported ("particles that go sideways and into nowhere"). Under that speed there is
  nowhere else to go: a particle the orbit misses swings round and comes back at it.
  `LIFE` (11–19s) is the other half of the same reading — nearly all of a life is spent
  going round and only the first few seconds of it travelling, so it sets how full the
  orbit is against how much is still out in the streams.
- **Which way the orbit runs is defined once** (`runsAt`), and both the launch and the
  catch ask it. Written out twice they came out pointing opposite ways, and a stream
  entering *against* the orbit is the whole of what "chaotic" looked like.
- **What it catches is pressed flat onto the orbit's own plane** (`FLAT`, `FLAT_V`). The
  radius alone gives a *shell* and not a lens: a particle caught while travelling along the
  axis keeps that travel, and what gathers is a fat doughnut seen obliquely, which is a
  smear and not a ring. So the part of where it stands and the part of how it travels that
  lie **along** the axis are taken out of it, and only those. Measured: without it the ring
  was 1.5–3.3 units thick against a radius of 6.4; with it, under 1.
- **The swirl axis decides how the lens is tipped** (`SWIRL`). A ring turning about an axis
  pointing straight at you is a circle; about an upright one it is a smear seen edge-on.
  This is well off both — a lens with a near side and a far side.
- **Two things keep the streams steady rather than a procession of waves.** Each particle
  is **held at its injector for a random moment before it sets off again** (`HOLD`, 0–4s):
  without it a particle's cycle is exactly its own life, so whatever spread of phases the
  page starts with it keeps for ever — the ones sent off together come back together, and
  between one wave arriving and the next setting off a stream empties completely for
  seconds at a time. And the **first** of them are held back for anything up to a whole
  life, because a short spread is not enough on its own to undo a start that bunched: with
  a few seconds instead, the page fires everything it has in the first instant and then
  stands empty. The cost is that the drawing takes most of a life to reach full density,
  which on a page like this one is no cost at all.

## Where the orbit stands, and the two canvases

- **The orbit's own path is drawn**, faintly (`PATH_INK`), and ticked round every
  thirtieth of a turn — and the ticks are ruled *across the band* rather than either side
  of the middle line, so they say how wide the disc is as well as where it runs. It is
  what makes the drawing legible *as an orbit* in a still frame and at the moment a
  stream is arriving, which is exactly when it is hardest to see. Like everything else
  here it is split at the middle of the chamber — the near half on `.chamber-front`, over
  the writing, the far half behind — so the path itself says which way round the lens is
  tipped.
- **The word is set about as wide as the orbit is, and that is the whole reason for its
  size** — so `RING` (5.0) here and the word's `font-size` in `style.css` are one decision
  and neither moves far alone. Both came down together when the owner asked for a smaller,
  more pressable title; `RING` has since gone back up a little, from 4.7 to 5.0, when the
  owner asked for the orbit expanded, and the word was left where it was because the band
  now straddles the ends of the lettering rather than one line crossing them. The orbit is
  centred on the word, so no much smaller word could ever be crossed by it — an ellipse
  centred on something only crosses it if one of its semi-axes is shorter than the thing
  is. Set to about the same width, the orbit's left and right rims fall **across the ends
  of the lettering**, and because one of those rims is nearer than the middle of the
  chamber and the other further, one is drawn in front of the word and the other passes
  behind it.
- That is why there are **two canvases**: everything nearer than `MID` on
  `.chamber-front`, over the writing, everything further on `.chamber-field`, under it.
  The word is sized against `vmin` because the orbit is, and capped against `vw` as well,
  or on a phone the lettering runs off the sides.
- **How wide the orbit grows, and where it stands, are measured, not set** (`fitOrbit`).
  It is as wide as the window will hold (`OPEN_FILL`, 0.96, capped at `OPEN_MOST`) and
  never so narrow that the writing is not standing inside it (`OPEN_CLEAR`, 46px), found
  by halving the difference through the **real projection** — the near half of the orbit
  stands a long way closer to the eye than the far half and comes out much bigger, so a
  reading taken flat at the middle depth is badly wrong at exactly the edge that runs off
  the bottom of the screen. The same pass **moves the middle of the chamber** (`core`)
  until the drawn ellipse sits on the middle of the WINDOW, in both directions: a tilted
  ring is not drawn symmetrically about its own centre, so an orbit centred on the middle
  of the chamber hangs visibly low and to one side of the thing anyone will measure it
  against. How far it must move depends on how wide it is and how wide it can be depends
  on where it stands, so three passes settle the two together. It is worked out again only
  when the menu or the window changes size, and only while the menu actually has a box:
  the panel is taken off the page the moment the menu is closed, and an orbit sized
  against a box of nothing would snap inward halfway through closing.
- **The back canvas is NOT clipped, and that matters.** It used to be clipped to outside
  the writing's own box, and that was a mistake you could see: the word's box is a wide
  flat rectangle, so the far side of the orbit vanished along a straight line nowhere near
  any lettering and came back along another one — an **invisible pane** standing in the
  chamber. It was never needed either. `.chamber-field` is *under* the plate in the page's
  own stacking order, so the word and the menu occlude it by being drawn on top of it —
  letter by letter, not box by box.

## What the cursor does, and what pointing at a row does

- **What the cursor does is string a WEB between the specks it is near** (`WEB_*`). It is
  drawn on the front canvas, over everything, and it is meant to be *slightly* wrong: each
  link comes and goes on its own clock (`WEB_FLICK`) and is drawn a hair off the two specks
  it joins (`WEB_SKEW`), both worked out from the pair itself so the same two always
  flicker the same way and the net never twitches at random. **Each speck carries at most
  `WEB_EACH` (4) lines, and that cap is the whole difference between a net and a
  scribble** — joining every pair within reach is fine where the specks are loose, but the
  orbit's near rim is a dense line of them, every one within reach of a dozen others, and
  what came out was a solid fan of hundreds of strokes converging on a few points.
- **The web never crosses the open menu.** The specks themselves may — the owner asked for
  the particles in front of the table, and one that has joined the orbit passing over the
  writing is the orbit doing what it does. A LINE is not: it is the cursor's own mark,
  drawn between two specks that may be nowhere near the menu, and strung across the writing
  it reads as scribble over the page rather than as a net in the air. So any link that
  would touch the panel's box is not drawn (`menuBox`, `crossesMenu`), corners included.
- **The cursor is a hand in the volume, not a cursor on a picture**: it is put at each
  particle's own depth before it pushes (`HAND_PX`, `HAND_PUSH`), so what it shoves aside
  is a real hole in a real stream — and the web is strung across whatever is left round it.
- **Pointing at a row READS it off against the orbit** (`READ_SPAN`, `READ_SWELL`), and
  **draws the row's own rule back**. The stretch of orbit level with that row is held a
  little wider, so the orbit swells where the row is, and that is the whole of what the
  drawing does about it. Nothing leaves the orbit — it is a reading, not a reaching.
  **There used to be a leader as well**, run from each end of the row out to the sides of
  the window with a tick where it landed: a pair of full-width horizontal lines drawn
  across the page every time the hand passed over a row. The owner asked for them gone
  ("remove the selection lines … the horizontal line indicating your option") and they were
  removed outright rather than switched off — there is no leader anywhere in this file now
  except the short one drawn at each injector along the way its own stream leaves, and
  `readRow` reads only the row's height off the page, since where it began and ended was
  wanted by nothing else.
  On the page's side, the rule under that row draws back from the right (to `scaleX(0.3)`,
  and further while it is pressed); it is a layer of the row's own rather than its
  `border-bottom`, because a border cannot be shortened without making the row itself
  narrower. That replaced an indent, where the whole row stepped sideways under the
  pointer — both say "this one", but a line getting shorter moves nothing anybody is
  reading. (It used to **cinch**: the sides left the border and leant in towards the row,
  which read as the drawing being pulled out of shape.)
  The row's box is read **once a frame**, not once a particle: asking an element for its
  box is a question the browser lays the page out to answer, and there are hundreds of
  them. What is pointed at is also settled on every pointer move rather than left to
  `pointerout`, because the menu grows out from under the pointer when it opens — a row
  can arrive under a hand that never moved, and would then never be left.

## Nothing here is ever tinted

**Nothing on this page is ever tinted, and nothing is ever drawn heavier.** The page said
what it meant in colour twice (the theories drawing's cool blue, which on white read as a
different site, and then brass) and then in weight, and the owner asked for each of them
gone in turn: there is no `COOL`, no `WARM` and no `MARK_*` in the file, the chamber's own
block in `style.css` spends no `--brass` anywhere, and a speck's colour and weight say
nothing at all. `tests/chamber.spec.js` checks the accent is unspent in all four states.
What is left to answer with is what the drawing is made of — a line drawn, a rule drawn
back, an orbit swelling — plus how big a speck is drawn, how long a tail it trails, and
how fast a stretch of the orbit runs.

## The line under the word

**It counts the whole category** — `FAVOURITES · 03 CHAPTERS · 09 TOTAL ENTRIES`, read
off the page's own entries. It said `ENTRIES` before; the owner asked for "total entries"
in as many words.

A favourite is an `<a class="gallery-entry">` block with a `data-chapter` and a
`data-date`; the chapters are the different `data-chapter` values in the order they first
appear, and the chapters standing in the chamber's column are made from them.

## Removed outright

Particles used to **break up** near the middle and throw fragments outward (`FRAGILE`,
`FRAG_AT`). The owner asked for that gone — it read as fine particles flying in all
directions after colliding with nothing — and it was removed outright rather than left
switched off, so there is no `FRAG_*` in this file any more.

Two things keep it cheap: the specks are grouped into `BANDS` (6) weights with one
`stroke()` and one `fill()` per band, and there is no gradient anywhere in it.

## Without the script

The page is the plain list of favourites, and it holds its own markup back until the
script has taken over the same way the other two replaced pages do — the `js-coming`
class in its own `<head>`.

## How to test it

```bash
npm test -- tests/chamber.spec.js
```

Seventeen tests: the menu being grown from that page's own favourites and carrying
number, date, name and link; the word opening the menu and a chapter opening its own
favourites with Escape stepping back out one level at a time; the two injectors standing
at opposite corners with nothing fired from the other two; the orbit standing round the
word and running on behind it unbroken with its near rim drawn over it; opening the menu
widening that same orbit rather than replacing it and passing in front of the menu; the
menu being a fixed length whatever is in it; the word travelling to its place on that
step rather than jumping there, watched every frame through both halves of it; the orbit
turning on open and closed alike; pointing at a row swelling the orbit level with it with
nothing run out across the page and drawing that row's own rule back; the word saying
what pressing it does and saying the other thing once it is open; the cursor stringing a
web between the specks it is near and letting go again; no part of it ever being drawn in
the site's accent colour; it standing still under `prefers-reduced-motion`; and the plain
list coming back when the script is blocked.

## The burst, and a chapter's own page

Opening a chapter used to put its favourites in the column in the chapters' place. The
owner asked for a page of its own instead, and for the way into it to be the chamber
turning itself inside out. It took two rounds, and the second one is the one to read.

**It is one continuous movement.** The first version ran in steps — the menu shut, a
second passed, the particles wound in, then they were thrown out — and it read, in the
owner's words, as though *"you just collapsed the favorites menu, and then there was the
explosion"*. Nothing waits for anything now. From the press, **every piece of chrome on
the page begins to fade and the particles begin to close, on the same frame**, and the
wind runs straight into the wave.

| | |
|---|---|
| **the wind** (`BURST_WIND`) | The chrome fades — the word, its cue and crop marks, the menu, this page's search, and the drawing's own labels and sights. The particles gather out of the two streams onto one wheel (`BURST_GATHER`), and that wheel closes on the middle, **gaining the whole way** and **turning faster the closer it gets**. |
| **the wave** (`BURST_WAVE`) | They meet, and a shockwave goes out from the point with a ripple of three rings behind it. The chapter is **cut out of the black by that wave** — an expanding `clip-path` circle — rather than faded up underneath it. |

Three things about the wind are the owner's own notes and are worth keeping:

- **It gains as it closes.** The radius falls as `1 - p^n` and the angle turns as `p^n`,
  so both are slow at the start and rushing at the end. A plain exponential does the
  opposite of both — quickest at the start, creeping in at the end — which is what this
  replaced.
- **The spin does not change direction.** Which way it is already turning is read off the
  particles at the moment of the press (`spinNow`), in the plane of the *window*, and
  that sign is what it winds with.
- **Everything fades, the word included.** Not a beat before or after the particles start
  to move.

### Three goes at the wheel, and why it is square to the window

Worth writing down, because two of them looked plausible and were wrong, and the failure
looked the same each time — a **crescent** closing on the middle instead of a wheel.

1. **Winding the arrangement in as it stood.** Most of the particles on this page at any
   moment are in the two streams, which are narrow lines running in from opposite
   corners. Scaling that down keeps it a line. So they are drawn onto a ring first, and
   it is the ring that collapses.
2. **Making that ring the orbit's own.** The orbit's plane is very nearly the x–z one —
   it stands almost **edge-on to the eye** — and a ring lying edge-on cannot be watched
   closing: it comes out as a line sweeping about. Worse, rotating it about the window's
   axis turns it *out of* its own plane. The wheel is square to the window now
   (`BURST_RING`, `BURST_BAND`), which is the only way an implosion reads as one, and by
   then there is nothing left of the orbit to be untrue to.
3. **A particle's brightness is worked out from its age against its life.** Any particle
   that was still waiting to be fired when the press landed has just been given an age of
   nothing, and draws at nothing — so a good half of the chamber took no part in the wind.
   Every particle is **held fully lit** for the length of the burst, and given its ages
   back when the chapter is closed.

### The page it opens

Black, and silver — the chamber is the one page on this site that spends no accent at
all, and this keeps that promise: there is no brass anywhere on it. What it has instead
is `--silver` and `--silver-dim`, on the hairlines, the corner marks and the lettering
that is doing the work. The chapter's name catches the light across itself, which is the
whole of what silver means on a screen.

It carries the chapter's name, the reading over it, **what that chapter is**, and its
favourites as cards. The writing comes off the page's own markup —
`.gallery-chapter[data-chapter]` in `categories/favorites.html`, one block per chapter,
placeholder words that are the owner's to replace. A chapter with nothing written for it
simply shows its cards.

**It stands inside `.chamber`, not loose in the page.** Every direct child of `<body>` is
caught by the rule that dims the page behind the menu, and that rule outranks anything
written for a new element — the note in `style.css` says so and it has caught features
before. In here it is dimmed along with everything else, which is what should happen.

### Two things this took out, and one it put right

- **The second level in the menu is gone**, and with it the back button in the menu head
  and the `open` index: the column only ever holds the chapters now. There is no
  `.chamber-item` and no `chapter.level` in the file.
- **The dates over a chapter read as a range now.** They were written in page order,
  which gave "14.03.2024 – 27.06.2023" — later first, which is not a range. `spanOf`
  sorts them, turning `dd.mm.yyyy` round to compare, and both the menu row and the
  chapter page use it.
- The way out is the chapter's own back, or Escape. Escape steps out of a chapter first
  and out of the menu second, the way it always stepped out one level at a time.

## Known issues / TODO

- **This page spends no accent of its own, but the shared chrome still does** — the Menu
  trigger, the menu overlay's links and the focus ring are all still `--brass` here,
  because they belong to every page at once. That is the one place the owner's "no orange
  on this page" is not yet true, and they know. See [the page
  shell](2026-09-11-the-page-shell-and-menu.md).
- `images/Favorites/` is empty but for its README.
- This page has had more rounds than anything else here and should be treated as a live
  subject.
- **`pointing at a row swells the orbit level with it` is flaky under a loaded full
  run**, and passes on its own every time. It measures how far the orbit has swelled and
  then relaxed, both eased over time, and this is the heaviest page in the site to draw —
  under load the relaxation has not finished by the time it is measured. Nothing about
  the page is wrong when it fails. Re-run `tests/chamber.spec.js` alone before believing
  it.
