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

## The little jump when a chapter opened

The owner: *"In favourites when you click on chapter one; there is a tiny jump of the page.
Asides from that its perfect, so just fix the little jump."* It was **185 pixels in one
frame**, and it was one property of CSS.

`transition` is a single property, and writing a new one replaces the whole list. The
plate carries `transition: transform ...` — its transform is what `--menu-lift` rides on,
how far it stands above the middle of the window so that the word and the menu are centred
together — and `.favorites-page.bursting .chamber-plate` wrote a new transition for the
fade. That took the transform transition off on the frame the class landed.

Opening a chapter closes the menu, which writes a new lift on that same frame. With the
transform transition gone the plate **snapped down the whole height of the menu**, in full
view, before any of the burst had begun. Both transitions are named in the `bursting` rule
now, so the plate eases down while it fades.

Measured, at 390 × 844: the one-frame jump of 185px is gone, and the largest step anywhere
in the same stretch is 3px, which is the ease doing its work.

**This is the second time a change of `--menu-lift` has been visible as a jump**, and the
first is written up under `.chamber-plate` in the stylesheet: the menu used to be in the
plate's own flow, so putting it on the page grew the box and shoved the word 143px up the
window in one frame. Anything that writes a new lift has to be able to travel on.

## How to test it

```bash
npm test -- tests/chamber.spec.js
```

Twenty tests: the menu being grown from that page's own favourites and carrying
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

Four of them are about the burst, and two of those are regressions for faults the owner
reported:

- **`the ring closes as a ring while the loose particles fall in after it`** — one pass
  down the wind answering two questions at once, because both answers live inside the same
  two seconds and a scan looking for the first consumes the window the second needed. It
  keeps the frame where the *smaller* of "near the middle" and "far out" is largest (the
  two populations drawn together), and separately the frame where "near" is fullest (they
  all met). Scanned rather than sampled at fixed moments: which frame shows what now moves
  with how full the chamber was when the press landed.
- **`the near half of the disc is still drawn while the ring winds in`** — the owner's
  *"half of the disk turns invisible on the collapse"*. It takes **two** readings, and it
  needs both: the near half's share of the ink (is it being drawn) and the front canvas's
  own computed opacity (is it being shown). The second is the one that catches this: see
  failure 6 above for why a canvas read alone cannot.
- **`the explosion is an ellipse lying in the ring's plane, not a circle`** — measures the
  bounding box of what is actually **inked on the mesh's canvas**. A circle's box is
  square; this one must not be. It used to read the polygon the page was cut out with;
  there is no cut any more, so it reads the drawing instead — the same claim about the
  same shape. The reading is kept only while the mesh is still comfortably inside the
  window, because once it has covered everything its bounding box is the window's and
  says nothing about its shape.
- **`the chapter page is never cut open, it is laid under the mesh`** — a regression for
  this round's removal. It watches `.chapter-page` frame by frame from the press until it
  is shown and fails on any `clip-path`, inline or computed; then it checks the mesh has
  the **top of the window** black by the time the page arrives, so the test cannot pass by
  the page simply never being laid.

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
| **the wind** (`BURST_WIND`) | The chrome fades — the word, its cue and crop marks, the menu, this page's search, and the drawing's own labels and sights. The chamber's **two populations** close on the middle, each in its own way (below). |
| **the mesh** (`BURST_WEB`) | They meet, and a **lattice** goes out from that point in the orbit's own plane, with the home page's own halo shells riding out with it. The cells of that lattice — its **panels** — darken behind the front until they are the chapter page's own black, and the page is laid underneath once they have the window. |

### Two populations, and why they are not one

The owner's second note: the ring should *"converge while it is still in its ring form,
with all the particles that are present in the ring"*, and the rest should *"become
independent particles that would only join independently once there is the implosion"*.
So the chamber is told apart at the press, by how near the orbit a particle is standing,
measured in the orbit's own plane (`RING_NEAR`):

- **The ring** — what the orbit already has hold of. It comes in **as a ring**: every
  particle keeps the place on the orbit it already had, and the ring itself narrows and
  turns along its own plane. Nothing is marshalled into position first, and nothing is
  re-spread: it is the ellipse you were already looking at, closing.
- **The loose** — everything still crossing the window in the two streams. These stay
  their own particles, and each falls on a clock of its own: its own moment to start
  (`LOOSE_LAG`) and its own length of fall (`LOOSE_SPAN`). The ring is joined by
  particles arriving one after another rather than by a marshalled crowd.

**And a loose one falls on a CURVE, not down its own radius.** For a round it was drawn
straight at the middle, which is the one path a thing crossing a room never takes. The
owner: *"they dont have to take a direct path, so i want you to find out their direction
as you press the button, and then continue that path as if there is a center of gravity
at the center of the screen, along with acceleration matching the particles of the
ring."* So a particle's velocity is kept at the press along with its place, and its path
is two terms multiplied:

```
pos = (where it would have coasted to)  ×  (how much of the way out it still has)
```

The second falls as `1 - q^n`. Multiplied rather than blended, and that is what makes it
a curve: at `q = 0` the pull's slope is zero, so the particle leaves at **exactly** the
velocity it had — no kink at the press — and the middle only tells later, by which time
it has already swung wide of its own radius. `n` is `BURST_CLOSE`, the same power the
ring narrows on, which is the owner's *"acceleration matching the particles of the
ring"*. They still arrive independently: what differs between two of them is when they
set off and how long they take, not how they gather.

**The arrivals were synchronised for a round, and the owner caught it.** The starts were
staggered from the beginning, but every loose particle was scaled to reach the middle on
the same frame as the ring — so however differently they set off, they all landed
together, and a crowd landing together is the thing that reads as marshalled. Each one is
now given its own span as well as its own wait, and the wait is drawn from what is left
after the span so that nothing is still falling when the wave goes out. Measured: the
first arrives about 0.7s into a 2.3s wind and the last at about 2.2s, spread right across
it rather than piling up at the end.

Midway through the wind there is therefore ink near the middle **and** ink far out at the
corners, in the same frame. That is the whole effect, and it is what the test pins.

**The ring rides the orbit in as the menu shuts.** The menu is open when a chapter is
pressed, so the orbit is at its widest — wide enough that a good part of the ring stands
behind the eye and is clipped away, which came out as the top of an arc and nothing else.
Following the orbit's own closing (`burst.orbit0`) carries it back inside the window
before the winding has to do anything, and costs nothing: the menu was shutting anyway.

**Both the narrowing and the turn gain as they go** — the radius falls as `1 - p^n` and
the angle turns as `p^n`, so it barely moves at first and rushes at the end, turning
fastest when it is tightest. A plain exponential does the opposite of both, and that is
what this replaced.

**The turn starts at the rate the orbit was already turning at**, which is the owner's
own note: *"the particles will begin the animation at the rotational speed they were
rotating when orbing the page... this way the transition is seamless"*. A power of `p` is
**nothing at all** at `p = 0`, so for a round the ring came to a dead stop on the frame
the chapter was pressed and then got going again — a seam exactly where there must not be
one. `spinNow` now reads the ring's angular velocity off the particles in radians a
second, and `windIn` adds the two together:

```
turn = rate · WIND · p   +   way · TURNS · 2π · p^SPIN
```

The first term is the orbit's own rate carried straight through the press — differentiate
it at `p = 0` and you get exactly `rate` — and the second is the burst's own winding, laid
on top. Measured across a press: **−0.652 rad/s** before, **−0.649** carried in, **−0.709**
on the first frame after, accelerating smoothly to −2.46 by 900ms.

Two things about that reading. It is taken **only from the particles standing on the
orbit** (the same `RING_NEAR` test): one still crossing the window in a stream is
travelling fast and not round anything, and a few hundred of those drown out what the ring
is doing. And it is **clamped and floored** (`SPIN_MOST`, `SPIN_ELSE`) — a chamber only
just filled can have no ring to read at all.

### The wave is the home page's centre

The owner asked for the shockwave to be *"the same effect as the central node in the home
page... spread throughout the entire page"*. That centre is three things, and the numbers
are taken straight from `node-scene.js`:

| | |
|---|---|
| **the core** | a solid near-black sphere, `#1c1c14` |
| **the inner shell** | 2.37× its radius, `#8d8a80` at 0.24 |
| **the outer shell** | 5.15× its radius, `#8d8a80` at 0.09 |

Here the **core is the chapter's own black**, opened out by the wave — it is the page's
own `clip-path` rather than an element, so the page *is* the core rather than something
drawn underneath it.

**The hub goes out BEFORE the black, and that took moving it.** The owner asked twice for
*"the effect from the central node on the background emitted just before the black
explosion"*, and for a round it could not be, for a reason that is worth keeping: the
shells lived **inside** `.chapter-page`, and that page is cut open from nothing — so
whatever the shells did in their first moments was clipped away along with everything
else, and the two could only ever arrive together. The wave is its own element over the
window now (`z-index` 3, under the page and over the drawing), `castWave()` casts it, and
the black follows it by `WAVE_LEAD` — a third of the wave, about 560ms — cut with the
same ellipse.

**And the black is smoother**, which was the third note. It is longer (`BURST_WAVE` 1.15s
→ 1.65s), it opens on **smootherstep** rather than a cubic ease-out — flat at *both* ends,
so it neither jumps away from the middle nor stops dead at the edge of the window — and
the polygon it is cut with has 96 corners rather than 56. The two shells go out ahead of it and fade as they widen, drawn as
soft-edged bands rather than hairlines, because a shell is a sphere seen through and what
passes is a thickness. A **seed** — a small dark disc at the point they meet — is the core
before it has anywhere to go; without it the wave starts from nothing visible and the
meeting has no moment to it.

**One thing this needs that is not obvious.** The shells are CSS animations on elements
built once, so they only play once — reopening a chapter showed the page with no wave at
all until the wave's contents were replaced to start them again.

### The wave lies in the ring's plane

The owner's note: *"let the expansion also be in the way that the ring is made, with that
dimension. i dont want it to be a circle parallel to the dimension of the screen, i want
that explosion to be parallel to the ring."*

The orbit is a circle standing at a tilt, so what you actually see of it is an **ellipse**
— at a particular angle, and a particular flatness. The wave now goes out in that ellipse
rather than as a circle square to the screen, which means it looks like the ring blowing
open rather than like a ring being replaced by something unrelated.

**The shape is measured, not worked out.** `ringOnScreen()` samples the orbit 72 times
round, projects each point onto the window, and takes the spread of those points; the long
and short axes of that spread are the ellipse's own axes, which for a two-by-two comes out
in closed form. It costs one pass, once, at the moment the wave goes out, and it comes out
right whatever the tilt is and wherever the middle of the chamber has been moved to —
neither of which is a constant in this file. It yields four numbers, handed to the CSS as
custom properties: `--wave-x`, `--wave-y` (where the middle of the orbit lands on the
window), `--wave-turn` (the angle) and `--wave-flat` (how flat). Typical reading on a
1280×860 window: **−0.23 rad, 0.50 flat** — half as tall as it is wide, tilted about 13°.

- **The shells and the seed** take it as a transform: `rotate() scale() scaleY()`, in that
  order, turns their circle into that ellipse. The flatness is floored at 0.16 so a ring
  seen almost edge-on still leaves something to look at.
- **The page itself is cut out with the same ellipse**, and that one could not be done in
  CSS. `clip-path: ellipse()` **cannot be turned**, and this one is turned by definition —
  it is whatever angle the orbit is standing at. So `clipTo()` writes the cut out as a
  56-corner polygon, frame by frame, driven from the burst's own clock. The CSS
  `clip-path` transition that used to open the page is gone with it.

The cut grows until its **short** axis clears the furthest corner of the window — it is
the short one that decides when the window is covered.

That change also removed the second of the two non-obvious things this used to need: the
page came off `display: none` with no previous value for the browser to transition from,
so it jumped straight to the finished state and the wave looked instant however long it
was given. Driving the cut by hand each frame has no start state to settle, so there is no
forced reflow any more.

### The wave is distortion, and it is geometric

Two more notes on it, and they pull in the same direction.

**"Not colour."** The owner: *"remove that first explosion colour (gray or black with
reduced opacity. idk what it is but remove it), i wanted it to have that effect of causing
distortion like the central node of the main page, not colour."* For two rounds each shell
was a soft grey fill at a fraction of an opacity — a thing **painted over** the page
rather than a thing the page is seen **through**. Nothing in the wave has a colour any
more. Each shell is a `backdrop-filter` — nearly all blur, a touch of contrast — so what
passes over the window bends what is behind it the way the map's translucent shells bend
what is behind them.

**And it passes OVER the page, not under it.** This is the part that made the difference,
and it is not obvious: a backdrop-filter bends what is *behind* it, and what is behind a
wave sitting under the chapter page is a white window with nothing left on it — the
particles have met in the middle and the chrome has gone. The filter bit on nothing and
the wave was invisible for the half of its travel that mattered. At `z-index: 5`, above
the page's 4, it passes over the black coming open and over the silver on it, and there
the bend reads. It is `pointer-events: none`, so nothing is harder to press for it being
there.

An earlier go had `brightness()` in the filter as well, which on a near-white ground came
out as a pale **wash** travelling over the page — a colour by another name, and the one
thing that was asked to go. Blur bends; it does not paint.

**"More geometrical... more mechanical."** Every edge in the wave is a **twelve-sided
figure** now, not a circle: the two shells, the hairline that leads them, and the cut the
page is opened with (`CLIP_ROUND`, 96 → 12). At this size twelve sides read as facets
rather than as a circle, which is the difference between a ripple and a machine. The
timing is unchanged — it still opens on smootherstep — because *smooth* was about the
travel and *geometric* is about the shape, and the two notes are not in conflict.

The hairline edge (`.chapter-core`, which was the dark seed) is the one thing here that is
drawn rather than distorted. It is silver once the black is under it (`.chapter-open`) and
ink before that, because the wave crosses from one ground to the other halfway through its
travel.

### The menu is drawn into the burst, not shut

The owner: *"when you click on any chapter, I want the table to disappear in a smoother
way, and in a way that agrees with the transition itself, not just goes down and fades
away."*

Closing the menu and pressing a chapter had been the same movement — the panel rising
back into the word (`chamber-shut`). That is right for closing, and wrong for this: the
burst is everything closing on the middle, and the menu was the one thing going up.

`drawMenuIn()` measures each row's distance from the middle of the panel and writes two
custom properties on it — `--pull`, how far it has to travel to get there, and `--mid`,
how near the middle it already is. The stylesheet then collapses the rows **inwards from
the outside in**: the top and bottom rows go first, the middle one last, each shrinking
and tightening its letter-spacing as it goes. It is the implosion, said in writing.

Measured in the script because it is a measurement: a stylesheet cannot ask how tall a
panel came out.

### The wave, redone as a train

The owner looked at the first go and said the idea was right and the execution was not:
*"make the explosion more complex. It looked pretty bad right now... especially keep the
dimensions of the explosion and implosion, those are perfect (as in the angle)."* So the
plane, the tilt and the sizes are untouched — `ringOnScreen()` is the same measurement —
and what changed is what is drawn in them.

**One ring going out on its own reads as a ripple in a pond**, which is the opposite of
mechanical. What is there now is a **train**: seven faceted figures set off one behind
another (`RING_MANY`, `RING_LAG`), each stood a little off the one before so their corners
never line up (`RING_TURN`), with twelve **spokes** struck through them from the middle and
a **tick at every corner** of the leading one — the instrument mark the rest of this site
measures things with.

It is drawn on a **canvas**, not built out of elements, for two reasons: seven turned
polygons with a rotation each is seven transforms and seven repaints a frame, and the
spokes run *between* the figures, which no arrangement of boxes can do.

**And the shells are pure blur now.** They had `contrast()` in them, which on a near-white
ground pushed the page to white inside the band — a pale wash travelling over the window,
which is a colour however it is made, and a colour is the one thing the owner asked the
wave not to have. Blur alone shows nothing where there is nothing and bends what there is.

### The menu is sucked into the middle

*"make the window disappearance smoother and actually somehow apply it to suit the
transition. if it gets distorted and sucked into the middle, and it looks good then do
that."* It does. `drawMenuIn()` measures how far the panel's own middle is from the point
everything else is closing on — the orbit's centre, projected onto the window — and writes
it as `--suck-x` / `--suck-y`. The panel travels there, shrinking to a fifth and blurring
as it goes, while its rows collapse inwards inside it. Two movements, one direction: the
writing goes where the drawing goes.

The blur is what makes it read as being *pulled* rather than merely moved — a thing going
that fast should not stay sharp — and it is the same blur the wave's shells bend the page
with, so the whole burst distorts in one language.

### The chamber goes on filling while the tab is away

The owner asked for the page to keep working when they are looking at something else. A
browser stops calling `requestAnimationFrame` in a tab that is not in front, and there is
nothing a page can do about that — nor should there be; drawing to a window nobody is
looking at is work for no one. But **filling is not drawing**.

So the time is paid back. `dt` is capped at a twentieth of a second (it has to be, or one
long gap flings every particle across the window in a single step), which meant a tab left
for a minute came back exactly as it was left. On becoming visible again, the seconds that
passed are run through the physics in ordinary-sized steps, all at once, before the first
frame is drawn. You come back to the chamber as full as if you had watched it fill.
Capped at `CATCH_MOST` — twenty seconds — because the chamber settles well inside that, so
a tab left for an hour and one left for twenty seconds come back the same.

### The wave is a lattice, and the cut is smooth

*"make it smoother, less choppy, and make the geometry part of it contain way more
nodes/particles and lines or whatever. make it complex AND SMOOTH!"* Those two are not in
conflict once you see which half is which: **the geometry is the ink, and the cut is what
the black arrives on.**

**The ink got denser.** Seven figures became **fourteen**, twelve facets became
**twenty-four**, and every corner of every figure now carries a **node** — 336 of them on
the window at once — with every fifth figure tied corner-to-corner to the one behind it,
which is what turns a set of rings into a lattice. Twenty-four spokes are struck through
the whole train from the middle.

**And it got smoother at the same time**, which is the part worth writing down. A
twenty-four-sided polygon reads as a *lumpy circle* — worse than twelve, not better — so
the figures are drawn as a **spline through their corners** rather than as straight runs
between them: the midpoint of two corners is the on-curve point and the corner itself is
the control. That is the cheapest way there is to round a polygon without rounding away
its facets. Each figure's sides also **bow** slightly (`RING_BOW`), so no two of the
fourteen are the same outline.

**The chop was the cut, not the rings.** `CLIP_ROUND` was 12, and twelve straight sides
opening across a whole window is a stepping edge. It is **48** now: still not a circle —
the facets are there if you look for them — but nothing in it steps. The mechanical
character moved into the ink, where it can be complex without being coarse.

### The page writes itself in AFTER the drawing, not underneath it

The owner asked for the handover at the end of the burst to be smoother, and what was
wrong with it was measurable. The page has to be laid under the mesh before the mesh
goes — at `PAGE_LAID`, or the chamber's white shows through for a frame — but its
**writing** used to start there too. Measured: the page was laid at t+6967ms and the
canvas was not cleared until t+7457ms, and by then the first card was already at 0.48
opacity. So the whole of the page's arrival was spent behind a black canvas, and what you
finally saw was a page already part built, with its heading simply present.

There are two states now. **`laid`** is the page standing under the mesh — black under
black, with nothing on it — and **`here`** is the mesh gone; everything on the sheet
comes in on `here`, one behind the other on a `--i` counted per visible child (counted in
the script rather than with `nth-child`, because the note is not always there).

Two smaller things went in with it:

- **The mesh is handed over rather than switched off.** From `MESH_HAND` the canvas's own
  opacity eases to nothing before it is cleared. On a good frame this shows nothing — by
  then the window is the drawing's black and the page under it is the same black — and it
  is there for the bad one, where a dropped frame or two near the end leaves a panel short
  of black and clearing the canvas in one go would show the step.
- Under `prefers-reduced-motion` both classes go on at once, so the page is simply there.

**The test is `the chapter page's writing waits for the drawing to be taken off`**, and it
watches the handover frame by frame from inside the page — sampling it over the wire is
far too coarse for something this short. It checks the page really does stand under the
mesh for a while, that nothing on the sheet is above 0.02 opacity while it does, and that
everything arrives afterwards. Proved against the old behaviour: the cards read 0.785
under the drawing.

### The black is gone, and the mesh turns the window over

*"the table disappears in a not so smooth fashion. i think it needs to be distorted into
the center during the transition. then the actual geometry and stuff, I want it to be
complete, instead of now — where it just goes through half of the page before the black
part of the explosion takes place. Id like to remove the black part, and then make the
whole page more weblike emphasizing the first part of the explosion. and then the panels
will start turning blacker and blacker until they match the colour of the page that
results at the end of the explosion."*

Four notes, and the last one is the design. **The drawing does not get covered up by the
page any more; the drawing becomes the page.**

**What went.** `clipTo()`, `CLIP_ROUND`, `WAVE_LEAD`, `BURST_WAVE` and the `clip-path` on
`.chapter-page` are all out of the code. For several rounds the burst had been two things
arriving one behind the other — a train of rings travelling out, and a black ellipse cut
open from the same point a beat later — and the second was eating the first. That is why
the geometry only ever got half way across the window: it was still travelling when the
black caught it up.

**What replaced it.** A **standing lattice** in the orbit's plane — `MESH_RINGS` rings
crossed by `MESH_SIDES` spokes, 19 by 40 — with a **front** travelling outward through it.
Ahead of the front there is nothing; the front itself is the brightest of it; behind the
front every **panel** it has passed darkens on a clock slightly its own until it is `#000`,
which is exactly what `.chapter-page` is. The page is laid underneath at `PAGE_LAID`,
by which time the panels have the window covered, and the canvas is taken away at the
end — both are black by then, so there is nothing to see in the swap.

Why a *standing* lattice rather than the travelling train: **a travelling ring has no
inside and no outside to fill.** A standing lattice has cells, and cells can be filled one
at a time, which is the whole of what the owner asked for. It is turned bodily as it goes
(`MESH_SPIN`) so it is not a fixed thing merely being lit up.

**The first part is the emphasis, and that is a power.** A panel's weight is taken to
`1 + MESH_HELD × (1 − 1.55p)`, which starts at about three and comes back to one: for the
first half of the burst the lattice is **lines on white with the panels barely there**,
and the black gathers in the second half. It still ends flat black, because the power ends
at one and `MESH_SETTLE` carries the last of it — from 86% through, every panel finishes
together whatever its own clock said, so the window is certainly one colour at the end.
Then `MESH_GO` fades the lattice's own lines off that black over the last quarter, so the
silver web dissolves into the page rather than being switched off with the canvas.

**A line is never drawn in a colour the ground cannot show.** The lattice crosses a window
that is white at one end of the burst and black at the other, so every line and node takes
its colour from `toneAt()` — mixed between the chamber's ink `23,23,15` and the chapter
page's silver `200,204,212` by **how dark the panel under it has gone**. The same line is
dark on white as the front reaches it and silver on black behind it.

#### Three things that were wrong on the way, and are worth not repeating

- **`reach = full / flat` overshoots sideways by the whole of `1/flat`.** The old rings
  used a circle of that radius under a `scale(1, flat)` context, which at a flat ring is
  six times further out than the window needs — so the lattice was nowhere near arriving
  when the burst was already half over. It is measured off the **four corners** now: turn
  each one into the ellipse's own frame and ask how big an ellipse of that shape has to be
  to hold it.
- **`scale(1, flat)` on the context squashes the strokes too.** Every line came out
  thinner across the ring than along it. The flattening is done point by point instead.
- **A spoke drawn whole runs ahead of the front that is drawing it**, because a band is
  lit as soon as its *inner* ring is passed. Each spoke is cut at the front.

And one that cost an hour: **`drawWeb` was already taken.** Renaming the new burst
drawing to `drawWeb` quietly renamed the cursor's own web as well, and because function
declarations hoist, the *later* definition won — so the burst was calling the cursor's
function, which ignores its argument and draws nothing. The canvas came up completely
empty with no error of any kind. The burst's one is `drawMesh` and the cursor's is
`drawWeb`; do not let those two names meet again.

### It spins about its own axis, not on the window

*"I do not want the geometric shapes to rotate around like that, I want them to spin on
their axis of the donut/ring/ellipse instead."*

The spin was being added to `ring.turn` — the angle the whole canvas is turned by before
anything is drawn. That turns the **figure on the window**: the flattened ellipse's own
long axis swings away from the angle the orbit is standing at, and the mesh reads as
tumbling.

It is an offset on the **angle round the disc** now. The ellipse stands exactly where the
orbit stands, and the pattern — the spokes, the nodes, the bow in every ring — turns
inside it. That is what spinning about the axis through the middle of a ring looks like
from where you are standing, and it let the spin be raised (`MESH_SPIN` 0.17 → 0.3)
because it no longer fights the shape.

### And the shells were most of why it was not smooth

The two halo shells are `backdrop-filter` elements, and **a backdrop-filter costs the
whole of its own box however little of it is on screen**. They were 150vmax and 326vmax —
the outer one three windows across — which is why the first frames of every burst were
spent compositing two enormous blurred layers and the whole thing started at a crawl.

They are 116vmax and 252vmax now, which keeps the pair's ratio (5.15/2.37, as on the map)
at a size that crosses the window and stops.

### The menu is distorted into the middle, not shrunk

Same note, first clause: *"the table disappears in a not so smooth fashion. i think it
needs to be distorted into the center."* It had been travelling to the suck point and
scaling to 0.18 with a blur, which is a **shrink** — the shape stayed the same shape the
whole way. Three things make it a distortion instead, and none of them alone is enough:

- it is **tipped** into a vanishing point (`perspective()` as the first function of its own
  transform, with a `rotate3d`), so the near edge grows as the far edge goes;
- it is **drawn out** along the way it is going before it is let go — `scaleX` runs a
  little over one while `scaleY` is already well under it;
- the **blur is late and hard** rather than even, so it reads as speed and not as a fade.

**And it takes as long as the wind does.** It ran for 0.92s against a wind of 2.3, so the
menu had been gone for a second and a half before anything met in the middle — which is
the other half of why it never read as being pulled in by it. It is 2.1s now, with the
rows given 1.2s and a stagger of 0.55s, and the rows are squeezed sideways as well as up
so the table narrows to a line.

### Both scales read the page, not the contents

The owner asked for Pineward's trunk and ADAR's sounding to *"start scrolling from the
very top of the page, not just contents"*.

Pineward's rule used to fill off the **count of parts passed**, on the reasoning that a
part running long should not read as more of the piece than a part running short. The
reasoning is sound and it was the wrong call: it left the rule at nothing for the whole of
the title and the introduction, so you could scroll a screen or two with no sign of it
moving. A bar that does not move while you are scrolling is a broken bar whatever it is
measuring.

So the **fill** is the page's own scroll and the **ticks** are still the parts passed. They
say two different things on purpose: how far down you are, and how many you have been
past. ADAR's sounding had no fill at all — ticks only — so it gained one, in silver, and
the two pages are in step again.

### What was tried and was wrong

Seven goes, and the failures are worth keeping because most of them looked plausible and
two produced the *same* wrong picture — a crescent closing on the middle instead of a ring.

1. **Winding the arrangement in as it stood.** Most of the particles are in the two
   streams, which are narrow lines running in from opposite corners; scaling that down
   keeps it a line.
2. **Gathering everything onto one ring first.** It worked, and it was wrong for a
   different reason: it marshalled the streams into the ring, which is exactly what the
   owner then asked not to happen.
3. **Turning the ring about the WINDOW's axis.** The orbit's plane is nearly the x–z one,
   so it stands almost edge-on; rotating it about the window's axis tips it out of its own
   plane and sweeps it edge-on. The turn has to be taken **along the orbit** — by asking
   where on the orbit a particle's own place has got to.
4. **A particle's brightness is worked out from its age against its life.** Any particle
   still waiting to be fired when the press landed has just been given an age of nothing,
   and draws at nothing — so a good half of the chamber took no part in the wind. Every
   particle is **held fully lit** for the length of the burst, and given its ages back
   when the chapter is closed.

5. **Replacing the wave's `innerHTML` with a canvas inside it.** The shells are CSS
   animations on elements built once, so they are restarted by replacing their box's
   contents — and replacing contents *replaces elements*. With the rings' canvas in that
   box it was destroyed and rebuilt on every burst, while the script went on drawing to
   the detached one it first got hold of. The rings were drawn perfectly, onto a canvas
   that was no longer in the page, and the wave came up empty. The shells have a box of
   their own now (`.chapter-shells`) and only that is replaced.
6. **Fading the front canvas to take the labels with the chrome.** The owner's report:
   *"half of the disk turns invisible on the collapse"* — and it was exactly that. One CSS
   rule, `.chamber.bursting .chamber-front { opacity: 0 }`, put in so the drawing's own
   labels and the near half of the orbit's path would fade with the word and the menu. But
   **the front canvas is not only chrome**: everything nearer than the middle of the
   chamber is drawn on it (see "Where the orbit stands, and the two canvases"), which is
   half the disc. So the near half of the ring faded away over the first 1.25s of every
   wind and what closed was a crescent — for the third time, by a completely different
   route. The chrome is faded in `chamber.js` now, inside `draw`, where a particle can be
   told apart from a label: `MARKS_FADE` runs a plain alpha down over `drawMarks` alone
   and the canvas is left alone.
7. **A canvas read cannot see that fault, and for a round no test could.** `getImageData`
   returns what was *drawn*, and a canvas sitting at `opacity: 0` still has every pixel of
   it — `chamber.js` was drawing the near half perfectly the whole time. The first version
   of the regression test measured the near half's share of the ink and **passed with the
   bug deliberately put back**. It reads the canvas's own computed opacity as well now,
   which is the reading the eye takes, and fails with the rule restored (0.78 → 0.37 →
   0.13 → 0). The same blind spot was in `spread()`, the helper the older burst test uses:
   it read only the back canvas, so it could not have caught this either. It reads both.

One more thing that is not a bug but will look like one: **how much of the chamber is a
ring depends on how long the page has been open.** Particles are fired from the injectors
and take a few seconds to reach the orbit, so pressing a chapter a second after the page
loads winds in mostly loose particles and a thin ring. That is honest, and the wind copes
with it; the test lets the chamber fill first because it is testing the settled state.

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
