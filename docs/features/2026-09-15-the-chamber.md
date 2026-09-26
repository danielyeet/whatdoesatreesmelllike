# The chamber

Date: 2026-09-15 (`10eaaca`, *Open a chamber for the favourites*), through many rounds
to `8137578` (*Stop the word blinking, put the specks in front of the menu*) on
2026-09-17. Migrated from CLAUDE.md on 2026-09-17. **The chapter page was reworked on
2026-09-22** — the arrows, the empty chapter, the house on a card, a favourite opening
where it stands, the way out, and the sun; see the sections under "The burst, and a
chapter's own page".

Files: `categories/favorites.html`, `chamber.js` (the largest file in the repository),
`sun.js`, the `chamber-*` and `chapter-*` blocks in `style.css`, `tests/chamber.spec.js`

The page also loads `notes-data.js` and `notes.js` now — not for a house of its own, which
it has none of, but for the renderer they hand out as `window.NOTE_PANEL`, which is what
writes a favourite's notes window.

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

Twenty-eight tests: the menu being grown from that page's own favourites — and from any
chapter written up with nothing in it — carrying number, house, name and link; the word opening the menu and a chapter opening its own
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

Six more are about the chapter page as the owner reworked it on 2026-09-22, and two of
those are regressions for faults they reported:

- **`a chapter with nothing filed under it is still a chapter, and says so`** — reads the
  chapter blocks out of the page's own markup, finds the ones nothing is filed under, and
  requires each to stand in the menu, to open with its writing on it, to read NO ENTRIES
  YET, and to have its empty grid taken off the page with a computed `display` of `none`
  rather than merely a `hidden` attribute that a `display: grid` would outrank.
- **`a chapter's page carries its writing, and its favourites as cards`** — the same test
  as before, asking a different thing: every card carries the house it comes from and
  **no date anywhere on it**, at least one names a real house, and the reading over the
  cards has no date range in it either.
- **`the arrows step through the chapters and wrap round`** — forward through every
  chapter and round to the first again, then one back, which wraps the other way. It also
  checks the chapter page still has the window at every step: stepping is not leaving.
- **`leaving a chapter never shows the chamber without its chrome`** — the regression for
  the cut. Watched frame by frame from inside the page, because sampling a handover this
  short over the wire is far too coarse. Three claims: the black **fades** (more than four
  distinct opacities part way through, not one frame at 1 and the next gone); **no frame
  at all** has the black part gone with the chamber's chrome not yet back, which is the
  fault itself; and the writing goes before the black does.
- **`a favourite opens where it stands, and the ones after it go down`** — the boxes of
  every card before and after, so the opened one must gain the width of the grid and the
  next one must actually move down. Then what is inside it: a measured height, at least
  two paragraphs, a link at `works/`, a notes button — and that opening a second closes
  the first.
- **`a favourite's notes are the site's own, in this page's colours`** — takes the
  favourite that names a `data-notes` key, opens its window, and requires **every note in
  `notes-data.js` for that key to be in the window**, so the two can never drift. Then the
  theme: the window's computed background must be this page's black and its lettering its
  silver, which is what pins the five tokens being redefined rather than a second set of
  rules being written.
- **`the sun stands behind the chapter that asks for it, and nowhere else`** — the ground
  is drawn and sized, is never the thing you press, and is taken off again on the chapter
  that does not ask for one. And the quiet: a strip just inside the sheet's edge against
  a strip just outside it at the same height, **measured across the edge rather than at
  two places picked by hand**, so the test says nothing about where the sun happens to
  stand. Move the sun and it still holds; take the quiet out and it fails.

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

It carries the chapter's name **with an arrow either side of it**, the reading over it,
**what that chapter is**, and its favourites as cards. The writing comes off the page's
own markup — `.gallery-chapter[data-chapter]` in `categories/favorites.html`, one block
per chapter. A chapter with nothing written for it simply shows its cards.

**It stands inside `.chamber`, not loose in the page.** Every direct child of `<body>` is
caught by the rule that dims the page behind the menu, and that rule outranks anything
written for a new element — the note in `style.css` says so and it has caught features
before. In here it is dimmed along with everything else, which is what should happen.

#### A chapter can now have nothing in it

The chapters were read off the favourites and nowhere else — the different `data-chapter`
values in the order they first appear — so **a chapter with no favourites was not a
chapter at all.** That is no use for one that has been named and not filled, and the owner
made exactly that in one round: they emptied Chapter 2 and wrote *"To be determined..."*
for it in the same message.

So `chapterOf(name)` makes a chapter by name if there is not one, and the chapter blocks
are read as well as the entries. The order is unchanged for everything already there:
entries first, in the order they appear, then any chapter that is only written up. The
menu row for an empty one reads **NO ENTRIES YET** rather than counting to nothing, its
page shows its writing, and its empty grid is taken off the page altogether — an empty
grid under a paragraph reads as something that failed to load.

`.chapter-cards[hidden]` is written out in the stylesheet on purpose: `.chapter-cards` has
a `display: grid` of its own and the browser's own rule for `hidden` lives in the
user-agent stylesheet, which any author rule outranks. This is the trap CLAUDE.md warns
about, and it has shipped once before.

#### The house, where the date used to be

The owner: *"I want you to remove the date from the first second and third favoirtes
themselves. Instead, there will be the perfume house."* So a favourite carries
`data-house` instead of `data-date`, the card reads it, and **there is no date anywhere on
this page any more** — which took `spanOf` with it, since it existed only to sort the
dates into a range. Both readings, the menu row's and the chapter page's, are now
`specOf`: the count, or the words for none.

A favourite that has not been told its house prints an em dash rather than nothing, so
the card keeps its shape. Two of the three in Chapter 1 are still the placeholder
favourites and have no house to name.

#### A favourite opens where it stands

The owner: *"when you click a given fragrance... the other favorite fragrances will go
down and the square in which Des Cendres is will expand revealing the window of the
fragrance. There will be a description, anothe rparagraph for commentary, and then 2
links: Go to fragrance : Notes."*

So a card is no longer a link to the piece. **It cannot be**, because what it opens into
carries a link, and a link inside a link is not a thing the browser will build. The grid
item is a `.chapter-card-shell` holding a `<button class="chapter-card">` and the
`.chapter-card-body` it opens; the open shell takes `grid-column: 1 / -1`, which is what
sends the favourites after it down a row; and the body opens on a **measured height**, the
same way a part of a house opens, because `auto` is not a height a browser will ease to.

**The ones after it travel rather than jumping**, and that takes a FLIP: their boxes are
read before the class lands, given back to them as a transform once the grid has re-laid
itself, and then released. The transform goes on the SHELL and the entrance animation
stays on the card inside it, and that is not an accident — **a CSS animation with a fill
outranks an inline style**, so a transform written on the card, whose entrance finishes on
`transform: none`, would simply be ignored.

Only one card is open at a time. A second would leave the first standing above it saying
the same things.

What a favourite says is in the page's own markup, in a `.gallery-writing[data-favourite]`
block matched **by name** — so a favourite renamed in one place is renamed in both. Des
Cendres' two paragraphs are marked as placeholders (`gallery-waiting`). **Since 2026-09-26 a
favourite with no block, or only placeholders, opens with the start of its own entry
instead**, read off the page it links to — see *2026-09-26 — an opened favourite, reworked,
and the sun answering it* at the foot of this report. What it opens into — the layout, the
links, the picture — is described there too; the paragraphs above are still how it opens.

#### Its notes are the site's own notes, in this page's colours

The owner: *"Notes will do the exact same thing everywhere else. Since perfume number 1
already has a notes window somewhere, just copy the information but adjust the theme."*

So the window is the same `.note-panel` every house page opens, with the same bar, the
same close, and a body written by the one renderer in `notes.js` — one renderer, or the
two drift apart and a reader is told different things about the same fragrance depending
on which door they came in by. A favourite points at its entry with `data-notes`
(`"abstraits:02"` for Des Cendres); a favourite with none gets the button anyway and a
window saying the notes have not been found yet, which is what every other page does.

**The theme is five tokens.** `--bg`, `--bg-2`, `--line`, `--ink` and `--muted` are
redefined on `.fav-note` itself, so every rule the window already draws in turns over at
once and nothing anywhere else is touched. `--ink-rgb` is there for the same reason it
exists at all — `rgba()` cannot take a hex, and the handful of rules that spend the ink at
an alpha would otherwise have stayed black on black. This is the trick `.find-page`,
`.sheet-page` and `.ataraxia-page` are built on.

The window stands **inside the chapter page**, not on the body: the chapter page is fixed
over the window and carries no transform, so a fixed thing in here is fixed to the window
— and every direct child of `<body>` is caught by the rule that dims the page behind the
Menu. It closes on its scrim, on its own close, and on Escape, which now steps out of the
window first, the chapter second and the menu third.

### The arrows either side of the name

The owner: *"I want the title itself to have an arrow near the right side and left of the
word chapter, that you can cycle through the page in order to acceess chapter 2 and 3 and
1 again etc."*

They step one chapter along and wrap round, and **none of the burst is replayed** — the
page you are standing on is rewritten under you. That is why `layChapter` is split in two:
`writeChapter` fills the page, and `layChapter` is what puts it under the mesh at the end
of a burst. Stepping calls only the first.

What it looks like is the sheet fading out on its own opacity (`turning`, 300ms), the page
being rewritten under it, and **the sheet's entrance being run again** — `here` removed,
a reflow forced, `here` put back, which is what makes a CSS animation play a second time.
So stepping to a chapter reads like arriving at one rather than like a table being
refilled. The arrows are taken off the page altogether when there is only one chapter to
be on.

### Leaving a chapter, in three beats rather than in one frame

Pressing "← Favourites" used to be a cut. The black came off the window on the frame it
was pressed — and what was underneath was a **white page with no chrome on it**, because
the burst had faded the menu, the word and the particles out on the way in. So leaving a
chapter was a flash of an empty white page and then the chamber fading back into it. The
owner: *"I also want the transition to be way smoother when it comes to clicking the word
&lt;-- favorites."*

Nothing about it is a cut now:

| | |
|---|---|
| 1. **the writing goes** | The sheet fades where it stands (`going`, `LEAVE_WRITING`). |
| 2. **the chamber comes back under the black** | `giveBack` hands every particle to the physics again, reopens the menu and drops the classes that had the chrome faded out — all of it while the black is still fully opaque. None of it is watched happening, and that is the point. |
| 3. **the black clears** | `clearing`, `LEAVE_CLEAR`, and by then there is a page behind it. |

`leaving` outlives `burst`, because `burst` is set to null in the middle of the second
beat; it is what keeps a second press, an Escape or a new chapter from starting the whole
thing again half way through. `chapterShowing()` is both of them together, and the
pointerdown that closes the menu reads it rather than `burst` alone.

Measured on the way out: the sheet reaches nothing at about 580ms, the chamber's plate is
back at 1 by about 770ms with the page still fully black, and the black is down to 0.04 by
1110ms. **No frame at all shows the black part-gone with the chrome not yet back**, which
is the fault itself and is what the regression pins.

### The sun

The owner: *"The theme of chapter 1's page should be the sun; I want a 3D massive sun in
the background made of particles and geometry that turns and has a character. I want it to
have a glow too. I want it to make the text legible, so that that particles exist in
behind the text the same way they do in the page for ataraxia (house, SD), i think that is
good."*

`sun.js`, and it is **registered rather than wired in**: a ground puts itself on
`window.CHAPTER_GROUNDS` by name, and a chapter asks for one in the page's own markup —
`data-ground="sun"` on its block. `chamber.js` starts it when that chapter is written onto
the page and stops it when another is. Neither file knows anything about the other, which
is the same arrangement every house's ground has with `house.js`.

What is drawn, all of it in specks:

| | |
|---|---|
| **the surface** | Fourteen thousand specks on a **Fibonacci sphere** — the same arrangement the home page's node map stands its seven link nodes on: every point about as far from its neighbours as every other, which a rolled scatter never is. Rolled, a sphere comes out in clumps and bald patches and reads as a mistake. |
| **the churn** | What gives it a character rather than a texture: a slow three-way wave **in the sphere's own coordinates**, so the bright and dark patches are ON the sun and turn with it instead of crawling across a disc. Two waves make a grid you can see; three make weather. |
| **the geometry** | Three latitude rings and four meridians, in specks, turning with the sphere — the drawn globe under the fire — and one **registration ring** standing round the whole of it, at its own angle, ticked like every other scale on this site. That one does not turn, which is what makes the turn readable at all. |
| **the prominences** | Five arcs that rise off the surface, bow out past the limb and fall back, each on its own clock so one is always going up as another is coming down. |
| **the corona** | One soft gradient behind all of it, and a bloom on every speck bright enough to earn one. |

**The far side is drawn faint rather than not drawn.** Taking it off leaves a disc with a
hard rim, which is a circle rather than a ball; left at a fifth it reads as the atmosphere
you see round the edge of one. And the rim of the disc is drawn **brighter**: the specks
pile up there as the surface turns away from the eye, and lifting them is what gives the
ball an edge without a line being drawn anywhere.

**Legibility is Ataraxia's, by name, and it is the same two mechanisms** — at this page's
own values, because the sheet here is wider than Ataraxia's column and the drawing behind
it is denser. A speck standing over the sheet is drawn at `QUIET` (0.3, against Ataraxia's
0.26) of its strength, eased in over `SOFT` (74 pixels, against 96) outside the sheet's
own box so there is no line on the page where the quiet begins. And
**the bloom goes first**: it is scaled by the cube of the quiet, so it is gone long before
the cores are. A speck's core is a pixel or two and costs a paragraph almost nothing; what
would wash one out is the bloom, which is soft and fourteen times as wide. The sun still
passes behind the words; it just stops glowing while it does.

The one thing that cannot be quietened speck by speck is the **corona**, because it is a
gradient. It is kept low (`CORONA_LIT` 0.13) for exactly that reason.

#### Two things that were wrong on the way

- **It was a scatter, not a surface.** The first pass put three thousand specks on a sphere
  whose disc covers well over a million pixels — about one speck per six hundred of them —
  and what came out was a handful of flecks in the corner of the window. Fourteen thousand
  puts them about a dozen pixels apart and the ball is a ball. The number is high and it
  has to be.
- **It ran at fifteen frames a second**, and the whole of that was one line: `hush()` asked
  the page where the writing stood, and it was called once per speck. Fourteen thousand
  `getBoundingClientRect()` calls a frame is fourteen thousand questions the browser has to
  settle the layout to answer. Nothing about the box can change between two specks of the
  same frame, so it is read once at the top of the frame and handed down — 15fps to 49fps
  in headless, and that with the colour ramp quantised into twenty steps at the same time
  so a colour is not built as a string per speck per frame.

**Where it stands is a composition, not a default.** It is off to the right and a little
high, with its right side running off the edge of the window — `AT_X`, `AT_Y` and `BIG`.
Centred, it would be behind the writing and nothing else; where it is, the reading column
is clear of it and the sphere still fills half the page.

It degrades to a still sun under `prefers-reduced-motion`: it is a drawing rather than a
movement, so there is a whole picture to stand still.

### Two things this took out, and one it put right

- **The second level in the menu is gone**, and with it the back button in the menu head
  and the `open` index: the column only ever holds the chapters now. There is no
  `.chamber-item` and no `chapter.level` in the file.
- **The dates are gone, and `spanOf` with them.** They used to read as a range over a
  chapter — sorted, because written in page order they came out "14.03.2024 – 27.06.2023",
  which is not a range at all. The owner asked for the date off a favourite and the house
  in its place, so there is no `data-date` on this page and nothing left to sort. If they
  use the word, that is what it was.
- The way out is the chapter's own back, or Escape. Escape steps out of a notes window
  first, out of a chapter second and out of the menu third, the way it always stepped out
  one level at a time.

## Known issues / TODO

- ~~**`the chapter page is never cut open, it is laid under the mesh` flakes under
  load.**~~ **Fixed on 2026-09-22, the way this section said it should be.** It polled the
  page over the wire every 80ms and then read the mesh once the page had appeared, which
  is a sample taken at a *time* rather than at a *state* — a slow frame moved the thing it
  was measuring. Once the sun was drawing behind the chapter page as well it stopped
  flaking and simply failed: by the time the poll noticed the page, the mesh had finished
  and cleared, and the reading came back 0. It now watches frame by frame from inside the
  page, set going before the press, and reads the mesh **on the frame the page is first
  shown** — the moment the claim is actually about. Nothing it asks for was loosened.

- **This page spends no accent of its own, but the shared chrome still does** — the Menu
  trigger, the menu overlay's links and the focus ring are all still `--brass` here,
  because they belong to every page at once. That is the one place the owner's "no orange
  on this page" is not yet true, and they know. See [the page
  shell](2026-09-11-the-page-shell-and-menu.md).
- `images/Favorites/` is empty but for its README.
- This page has had more rounds than anything else here and should be treated as a live
  subject.
- ~~**`pointing at a row swells the orbit level with it` is flaky under a loaded full
  run**, and passes on its own every time.~~ **Recalibrated on 2026-09-22, and the cause
  was not load.** It failed on its own as well once Chapter 3 was removed, by a margin of
  nothing at all — the swell has to beat a fixed fifty pixels and it came in at exactly
  fifty.

  **What it measures depends on where the row stands.** The reading is how much further
  right the orbit reaches in a stripe level with the row, and the test takes the LAST row.
  Near the top or bottom of the menu the orbit's rim is well inside its widest, so a swell
  there buys a lot of horizontal reach; level with the middle of the window the rim is
  already close to its widest and the same swell buys much less. Dropping from three
  chapters to two moved the last row from y=429 to y=361 — the middle of the window.

  Measured on one commit, pointing at the last row, with three chapters against two:
  516 → 599, 512 → 603, 497 → 598 (a swell of 83 to 101) against 575 → 623, 568 → 617,
  572 → 625 (42 to 65). **Nothing about the swell changed**; the threshold was calibrated
  against a three-chapter menu. It now takes ten readings rather than five and asks for
  thirty rather than fifty, and thirty is proved against the fault: pointing inside the
  menu but NOT at a row — so no row is hot and there can be no swell — moves the same
  reading by −5 and −7.

## 2026-09-24 — the moon, and something down the left

> make chapter 2 from favorites have a moon spin the same way that the sun is spinning.
> Make it complex and look cool please
>
> also put some particles on the left hand side of the page, it looks empty (favorites,
> chapters 1 and 2)

**Chapter 2 has a ground now: the moon** (`moon.js`, `data-ground="moon"` on its block).
It is built exactly as the sun is — a Fibonacci sphere of specks, rings and meridians
turning with it, a registration ring that does not — and it turns **on the sun's own
tilt, at the sun's own rate, the same way round**: `TILT` and `SPIN` are the same numbers
in both files, and a test reads them out of both. It stands where the sun stands, a
little smaller, so stepping between the two chapters with the arrows swaps one body for
another in the same sky. What it has that the sun does not:

- **The light and the phases.** A moon is lit, not lit up: one side bright, the other in
  shadow with a faint earthshine, a soft terminator between them — and the light swings
  slowly to and fro over about a minute and a half, **from full to a thick crescent and
  back**. It never goes to a new moon: the first version went all the way round, and for a
  quarter of every cycle the page was black.
- **Craters** — rings of specks with a bright rim, a darker floor and a central peak, some
  throwing **rays** across the surface — and **maria**, the dark seas, fixed on the
  surface. All in the sphere's own coordinates, so they turn with it and ride over the
  limb.
- **A ring of debris**, tilted further over than the moon and turning faster than it, its
  far half drawn behind the disc and its near half in front.

**Down the left of both chapter pages** — the side the owner saw empty:

- **Chapter 1: the solar wind** (`WIND_*` in `sun.js`). Eighteen strands leaving the
  sun's left limb and fanning out across the page to the left edge, with specks running
  along them at every stage of the crossing, brightening as they get clear of the sun
  and fading at the very edge.
- **Chapter 2: the sky** (`STARS`, `DUST` in `moon.js`). Stars at three depths, thinning
  out across the window from the left edge, each twinkling on its own clock; fine dust
  drifting down through them; and now and then a **shooting star** across the left of the
  page.

Both are quietened behind the writing exactly as everything else on these pages is
(`QUIET`, `SOFT`, the bloom going first).

Tested in `tests/chamber.spec.js`: `the sun stands behind Chapter 1 and the moon behind
Chapter 2, and both keep the writing legible` (the moon's quiet is measured on its own
disc, behind the writing against beside it; 0.87 as it stands, 1.91 with the quiet taken
out), `the moon turns on the sun's own axis, at the sun's own rate` (fails with the moon
turned the other way), and `both chapters have something drawn down the left of the
page` (fails with the wind and the stars taken out).

## 2026-09-24, later — the sun becomes the moon

> also introduce a transition when flipping from chapter 1 favorites to chapter 2. make it
> smooth; and make it so that the particles change and morph from sun to moon (and vice
> versa), while the text fades out and in.

**It was a cut.** Pressing an arrow faded the writing for a third of a second and, in the
same frame as the page was rewritten, stopped the sun and started the moon.

**Now the one becomes the other** (`morph` in `chamber.js`, `MORPH_*`):

- **Both grounds hand over their specks.** `sun.js` and `moon.js` each gained `capture()`:
  it draws one frame with a flag set that makes `speck()` push every speck it draws —
  where, how big, how bright after the quiet, and which tone — and returns the lot with the
  tones. Nothing else about either drawing changed.
- **The arrow takes the sun's specks as they stand**, starts the moon **under a veil**
  (its canvas held at opacity 0 by an inline style) and takes the moon's first frame the
  same way. Those are where the flight leaves from and lands.
- **The flight** is on a canvas of its own (`.chapter-morph`) laid over the ground. The
  two lists are brought to one count and **paired by how far each speck stands from its
  own drawing's middle** — core to core, limb to limb, the solar wind to the starfield —
  so a shape turns into a shape rather than spraying. Each speck flies on a spiral about
  the moving middle, swinging a little extra turn, bulging outward half way
  (`MORPH_SWELL`), leaving on a clock of its own (`MORPH_STAGGER`) and burning brighter
  in the air (`MORPH_FLARE`); its colour goes from the sun's warm tones to the moon's cold
  ones. A soft **haze** at the moving middle goes warm to cold with it, and the brightest
  specks carry a bloom — the first version had neither, and flew only a third of the
  specks, and the middle of the flight read as a dim scatter rather than as a sun.
- **The writing** fades out at once, is rewritten, and comes back in half way through the
  flight (`MORPH_WRITING`).
- **The handover**: over the last fifth (`MORPH_HAND`) the flown specks fade as the new
  drawing's own canvas comes up under them; then the flight's canvas is put away.
- The first frame of the flight is drawn at once, not on the next frame: the old drawing
  has already been stopped and cleared, and a frame of black between would read as a
  blink.
- **Leaving the chapter mid-flight** stops the morph (`stopMorph` in `clearChapter`). The
  arrows did nothing while one was running — until 2026-09-24, late night; see the foot. With reduced motion there is no flight: the
  chapter is simply rewritten, as before.

Tested in `tests/chamber.spec.js`: `stepping between chapters morphs the sun into the moon
and back, as the writing fades` — sampled every frame from inside the page, both ways
round: the specks flown on their own canvas with ink on it, the new drawing held under the
veil while they fly, the writing gone and back, the new drawing up at the end and the
flight's canvas put away. It fails with the morph taken out (the old cut).

## 2026-09-24, last — the morph without the cut

> make it so that the transition of the particles is smoother when transitioning from
> favorites chapter 1 to 2. It kinda transitions and then cuts to the other page. Fix it

Two cuts, one at each end, and both measured before they were fixed:

- **At the end, the drawing that came up was not the one the specks had flown to.** The
  moon was started under its veil, its first frame taken as where the flight lands — and
  then it went on **turning, unseen, for the whole 2.3 seconds**. When it came up it had
  moved on, so the flown specks faded out in one place while the moon faded in in another.
  Read off the canvas outside the writing, the frame that came up differed from the frame
  aimed at by 24%. Now both grounds have **`hold(on)`**: held, a drawing goes on drawing
  every frame but at the same moment (its clock does not advance), and the chamber holds
  the new drawing from before its first frame is taken until the flight is home, then lets
  it go (`stopMorph`). It turns on from the very frame it was held at. The difference is
  now nothing.
- **At the start, the old drawing lost its glow in one frame.** The flight starts from the
  sun's specks, but the sun as drawn is more than its specks — its bloom and corona — and
  all of that went the moment the morph began: the flight's first frame carried 70% of the
  light the sun had had. Now the old drawing **as it looks** is copied off its canvas
  before it is stopped, and over the first fifth of the flight (`MORPH_LEAVE`) that copy
  fades as its own specks come up over it and take off. The haze follows the same ramp.

What it still does not do: a drawing quietens itself behind the writing, and the writing
is rewritten half way through the flight, so behind the new chapter's writing the frame
that comes up is quietened slightly differently from the one captured. It is under the
writing as the writing fades in, and the test measures outside it.

Tested in `tests/chamber.spec.js`: `the morph lands on the very frame that comes up, and
leaves the old drawing without a blink` — both ways round, reading the new drawing as the
flight is aimed at it, as it comes up, and 2.3 seconds after it has been let go (which
shows it does move, so that the first two matching means something), and the flight's
first frame against the old drawing just before the press. Fails against the old code on
both counts, with the moon not held, and with the old drawing's copy left out.


## 2026-09-24, late night — a press during the morph is remembered

The arrows used to **do nothing while a morph was running** (2.3 seconds) — so pressing
the arrow twice to go two chapters along went one, and the second press was lost without a
sign. The site's own rule elsewhere is that a press landing mid-travel is remembered, not
dropped (the two views keep it, and the houses opening a part), and the arrows keep it now:
a press while a step or a morph is running is held (`wantStep`, only the latest) and taken
the moment the running step is done (`takeWanted`, at the end of the turn and at the end of
the flight). Leaving the chapter forgets it.

It was found by `the arrows step through the chapters and wrap round`, which presses the
next arrow 900ms after the last and began failing — on the code before this round as well —
once the sun-to-moon flight ran on this machine for its full length: the second press
landed mid-flight and was swallowed. The test is unchanged; it passes because the press is
now taken when the flight lands.


## 2026-09-25 — the sun and the moon on one sphere, and nine more favourites

> in the favorites page, the moon and sun transition is pretty weak, as they change into
> the other and then morph afterwards. this is choppy because they are in different places
> on the page, and it feels weird. Fix it, smoothen it.

**What was wrong, seen frame by frame.** The moon stood lower and smaller than the sun
(`AT_Y` 0.38 against 0.36, `BIG` 0.29 against 0.34). The flight paired specks by how far
each stood from **its own drawing's brightness-weighted middle** — the sun's lit limb on
one side, the moon's crescent on the other — so the whole cloud swept across the window
from one middle to the other; and every speck was given an **extra part-turn that never
came back** (`da + MORPH_SWING`), so the flight landed nearly a radian off where the
moon's specks really were. The moon then came up where it actually was, which is the
owner's "change into the other and then morph afterwards".

**Now:**

- **One sphere.** `moon.js` stands exactly where `sun.js` does, exactly as large
  (`AT_X` 0.8, `AT_Y` 0.36, `BIG` 0.34). A moon "a little smaller than the sun, as a moon
  should be" was the one reason it was not; the owner's note outranks it.
- **Each drawing says where its sphere is.** `capture()` hands back `centre` and `radius`
  as well as its specks, and the morph uses them — the brightness-weighted middle is only
  the fallback now.
- **Paired by place.** Every speck of the larger drawing is paired with **the nearest
  speck of the other**, measured on the sphere as a share of its radius (a grid of cells,
  `CELL`, searched outward ring by ring, taken in turn so a denser patch is shared out).
  The sun's limb becomes the moon's limb where it stands, its face the moon's face, its
  wind the moon's sky — nothing crosses the window.
- **The turn comes back.** The swing is `MORPH_SWING · sin(πu)` — a part-turn out and back
  (0.28 rad, and the swell 0.05) — so every speck lands exactly on its twin, which is the
  frame the new drawing comes up on.

Tested in `tests/chamber.spec.js`: **`the sun and the moon stand on the same sphere, so one
turns into the other where it stands`** — both drawings made on canvases of their own and
captured: each says where it stands, the two centres and radii agree, and both are drawn in
specks. Fails against the code before (no centre at all, and the moon lower and smaller).
The moon's legibility test reads the moon's disc at its new place. The morph tests all
still hold.

**Nine more favourites in Chapter 1**, at the owner's word, as nine `gallery-entry` blocks
after Des Cendres: Haxan, De Profundis, Evergrow, Sing at My Funeral, Tobacolour, Bad Lily,
French Riviera, Amaretto Jazz in the Melting Room and Belle Âme (named as the site names
them: Tobacolor, Belle Âme) — each pointing at where that fragrance lives on the site and
carrying its house and its notes key, but for Bad Lily, whose notes (Tale's) have not been
found yet. Nothing is written
for them in `.gallery-writings` yet, so each opens onto its two links. "Second favourite"
and "Third favourite", the two placeholders, are left as they were — the owner's to fill or
take off.

**Later the same day** the owner asked for the two placeholders to go — "Second favourite"
and "Third favourite", which pointed at the two templates — and they are out of the page.
Chapter 1 is ten favourites: Des Cendres and the nine above.

## 2026-09-25, night — the morph made smoother, and the spin picking up

> whenever you transitoon from chapter 1 to chapter 2 or back, its quite laggy, so make it
> smoother. and i want the spinning to start gradually after the transiton. to pick up speed
> and accelerate into the speed that it is currently spinning at. make that SLIGHTLY gradual.

**Where the lag was**, measured rather than guessed (a CPU profile of one step, and every
frame's length): the flight ran at about twenty frames a second where the sun alone runs at
thirty in the same test browser, and the press held everything up for a tenth of a second.
Three causes, each taken out:

- **The new drawing was drawn unseen.** It is held still under its veil for most of the flight
  — and was drawing the same frame over and over, fourteen thousand specks and their glow, as
  heavy as the flight itself. **Held, a drawing now draws once**, and again only while the veil
  is off it (`sun.js` and `moon.js`, `tick`: `heldDrawn`, and a look at the canvas's own
  opacity).
- **Every speck set its own colour.** The flight set a new colour string for each of its
  fourteen thousand specks every frame. It is **batched** now: the flights are rows of numbers
  (typed arrays) rather than objects; every colour a speck can be is made once
  (`MORPH_HUES` steps between each pair of tones); and each frame the specks are sorted by
  colour and brightness (`MORPH_LEVELS`) and every batch is **one fill**. **The bloom** under the
  brightest is stamped under at most `MORPH_GLOW_MOST` (500) of them, chosen once.
- **The press waited for the setting up.** The two snapshots and the pairing of every speck
  with its twin take about a tenth of a second; they are done **on the frame after the press**
  now, and the press itself only starts the writing going (`turning`), so it answers at once.

After all three the flight runs at the page's own rate, as fast as the sun or the moon standing
still. It looks the same: the specks, colours, blooms and timing are as they were.

**The spin picks up.** Let go after the morph, the drawing no longer sets off at full speed: its
clock runs at a rate that rises from nothing to its full rate over `SPIN_UP_MS` (1.4 seconds),
smoothly at both ends — slightly gradual, as asked — and everything on it (the turn, the
prominences, the wind, the moon's phases and its sky) eases in together with it. Both drawings
carry `at()`, their own clock, for the test.

Tested in `tests/chamber.spec.js`:

- **`stepping chapters answers the press at once, and nothing is drawn unseen under the veil`** —
  the writing is going on the press itself, the press takes under 30ms, and while the new
  drawing is under its veil not one speck is drawn on it.
- **`let go after the morph, the sun and the moon pick up speed rather than setting off at
  full`** — each drawing made on a canvas of its own: held, its clock stands; in the first 300ms
  after it is let go it moves on less than 40% as far as it does in 300ms a second and a half
  later.
- `the morph lands on the very frame that comes up, and leaves the old drawing without a blink`
  reads the flight's first frame one frame after the press now, which is when the flight is set
  up.


## 2026-09-26 — an opened favourite, reworked, and the sun answering it

> i also ask that you reword the way that the favorite perfumes open when you click them.
> also add images if you have them based on the name from the repository. I want you to make
> it less techy, more minimalist and geometric. Make it somehow react with the sun too.

**Less technical.** The card said `OPEN ↓` and `CLOSE ↑` in capitals in the mono; it carries a
drawn **sign** now (`.chapter-card-sign`) — a small circle with a cross of hairlines in it,
whose upright turns flat as the card opens, a plus becoming a minus. The house under the name
is set in the plain face rather than the mono, and the open card loses its corner ticks: its
head is one line, number, name, house and the sign. Opened, it is **two columns**
(`.fav-open`): on the left the reading — a short rule, the writing, a hairline, and two plain
links, **Read the whole entry ⟶** (the favourite's own `href`, which was GO TO FRAGRANCE) and
**○ Notes** (the same notes window as before), in the site's own face with a line drawn under
them on hover — and on the right **the picture, in a circle**, credited under it. Nothing in it
is set in capitals or the mono any more. On a phone it is one column, the circle first.

**What it says.** Where the owner has written a block for the favourite on this page — not
placeholders — that block, as before. Otherwise **the start of its own entry**: the page its
`href` points at is fetched (once, and kept: `fetched`, `pageOf`), the part found by its anchor,
and its first paragraphs taken from `.human-text`, `.pine-text` or `.adar-text`, passing over
stage labels, waiting boxes, notes to the reader and spoilers (`openingOf`). Whole paragraphs
until there are about 240 characters or two of them (`FROM_ENOUGH`); a paragraph that would
run past 560 (`FROM_MOST`) is stopped at a sentence's end with an ellipsis. **Their words,
never edited** — the script writes none of them, and copies none into this page: there is
still one copy of each. `data-from` on the writing says which it came to: `page`, `nothing`
(the page has nothing written yet, and the card says so) or `away` (the page could not be
read, and the card points at it).

**A picture for every favourite, found in the repository by name.** `data-image` on each
favourite, with **`data-credit`** and **`data-credit-href`** saying where the picture came from
— the same sources its own page credits:

| favourite | picture | credit |
|---|---|---|
| Des Cendres | `images/Les-Abstraits/Perfumes/Des cendres 1.jpg` | Les Abstraits |
| Haxan | `images/Individual Fragrances/Haxan/web/1.webp` | my own |
| De Profundis | `images/Individual Fragrances/002 De Profundis.jpg` | Sillyage |
| Evergrow | `images/Tombstone/Fragrances/Evergrow.webp` | Tombstone |
| Sing at My Funeral | `images/Tombstone/Fragrances/Sing at my funeral.webp` | Tombstone |
| Tobacolor | `images/Individual Fragrances/004 Tobacolour.webp` | Dior |
| Bad Lily | `images/Tale/Perfumes/Bad Lily 1.webp` | TALE Parfum |
| French Riviera | `images/Individual Fragrances/006 French Riviera.webp` | Vivantis |
| Amaretto Jazz in the Melting Room | `images/Ataraxia/Perfumes/Amaretto Jazz.webp` | Ataraxia |
| Belle Âme | `images/Les-Abstraits/Perfumes/Belle Ame.webp` | Les Abstraits |

**The circle** (`.fav-disc-face`) shows the picture **whole** — `object-fit: contain`, in the
middle two thirds of it — over a blurred copy of the same file filling the circle
(`.fav-disc-haze`). Pictures are two kinds, told apart once each has loaded (`seat`): drawn to
a 24 × 24 canvas and its four corners and four edge midpoints read. **A studio shot** — six of
the eight near white and colourless — turns the circle the pale of paper (`#ece9e3`), hides
the blur and **multiplies** the picture onto it, so its white ground disappears and the bottle
stands on its own rather than in a white rectangle. **A scene** — a bottle on bark, on flowers,
on black — keeps its blur round it, and the picture is sized to its own shape and **feathered**
at its edges into that blur (a mask, 9%), so it has no hard edge either.

**The sun answers it.** Once the card has finished opening, the chamber tells the chapter's
drawing where the circle stands (`attendTo` → the drawing's `attend(get)`, asked again every
frame so the answer follows the page as it scrolls) and, when the card is shut, that nothing
is open (`attend(null)`). The sun turns towards it over `ANSWER_IN` (1.1s) and away over
`ANSWER_OUT` (0.55s) — `facing`, eased — and answers in three ways (`sun.js`, "THE ANSWER"):

- **a ring** of its own specks round the circle (`RING_SPECKS`, 220): one round at
  `RING_OUT` (16px) outside it and every second speck again at `RING_IN` (6px), turning slowly
  (`RING_TURN`), **lit most on the side that faces the sun's own centre** (`RING_LIT`) and
  drawn past the quiet the writing is otherwise kept in (the `loud` in `speck`) — it is the
  only thing the sun draws over the sheet at full strength. As it comes in it is drawn round
  from the sun's side both ways, and it goes the same way back;
- **ticks** off it (`RING_TICKS`, 36), short radial strokes of two or three specks, a
  registration mark in the sun's own specks;
- and **the surface near the circle brightened** (`HALO` → `HALO_LIT`), with the **corona**
  swelling a little (`CORONA_SWELL`). The moon has no `attend` and is simply not told —
  Chapter 2 has no favourites.

With reduced motion the answer is there at once (and drawn again as the page scrolls, since
nothing else redraws a still sun).

**A stale paint, found on the way.** Haxan opened with the left of its head blank — name,
number and all — while its box was exactly where it should be. The card's entrance
(`chapter-card-in`, filled `both`) had finished but kept the card on a layer of its own, and a
card opened out of the middle of a row onto a row of its own was left half painted on it. The
entrance is **retired once it has run** (`animationend` → `.is-in`: `animation: none;
opacity: 1`). The FLIP of the others still goes on the shell, as above.

### What was tried and was wrong

- **`mix-blend-mode: darken`** on the picture, so a white ground would drop out against the
  dark: it washed every bottle out to grey. The studio and scene reading replaced it.
- **A dark shadow round the circle** hid the sun's ring where it was meant to be seen; taken
  off, and the ring lit harder.
- **The halo at full strength** lit the sun behind the credit so brightly the credit could not
  be read; `HALO` is 0.5 and the credit stands 42px under the circle.
- **The first excerpt** stopped only the first paragraph and let the rest run on, so Des
  Cendres opened into half its entry; the room is counted across paragraphs now.

### How to test it

(Both tests below were reworked, and renamed, with the picture itself — see *2026-09-26,
later* under this section.)

- **`an opened favourite reads the start of its own entry, beside its picture in a circle,
  credited`** — every favourite names a picture under `images/` and a credit; every card
  carries the circle with that picture and its blur, and *Picture: …* under it, and no
  lettering where OPEN ↓ was; Des Cendres opened reads from its page (`data-from="page"`), one
  or two paragraphs each exactly the owner's or the start of one stopped with an ellipsis, under
  700 characters; the circle round, the picture `contain` and inside it, read as one kind or the
  other; the two links *Read the whole entry* and *Notes*, neither in the mono.
- **`the sun rings an opened favourite's picture, and lets go when it is shut`** — the sun the
  page makes is kept hold of: nothing open, `facing()` is 0; opened, it rises past 0.95, and
  the band just outside the circle on the sun's own canvas is at least half as bright again as
  the same band once the card is shut and `facing()` is back to 0.
- `a favourite opens where it stands, and the ones after it go down` waits for the writing to
  have come and asks for something to read, rather than for two paragraphs.

### Known issues / TODO

- The excerpts are fetched when the chapter's cards are made — the five pages Chapter 1's
  favourites live on, each once; they are small, but on a slow connection a card opened at
  once shows a blank line for a moment until its page lands.
- Only the sun answers. If Chapter 2 is given favourites, the moon wants an `attend` of its own.


## 2026-09-26, later — the picture fills an upright frame, and the sun answers the frame

> Additionally fix the images in the favorites tab, it looks tacky.

And, in the same message, about the Fragrances view of Scent descriptions: *"i dont want any
background to be visible, just make the image itself fit into the box. Ideally make the
fragrance fit ... The point is simply for the fragrance to be visible."* The circle had exactly
what that note objects to — the picture shrunk into the middle of it over a blurred copy of
itself, a studio shot multiplied onto a pale disc, a scene feathered into its blur — and then a
glowing ring round the lot. So the favourites take the same answer as the Fragrances view.

**The picture fills an upright frame — the print** (`.fav-print-face`, 4 : 5,
`clamp(200px, 19vw, 250px)` wide, one hairline round it), edge to edge, with nothing behind it
and nothing done to it — no blur, no blending, no mask — and **it is placed on the bottle**
(`seat`, `readPicture`, `placeIn`) exactly as the Fragrances view places its pictures, which
[its report](2026-09-25-the-fragrance-line.md) sets out under *2026-09-26, later*. In short:
- on a plain ground, the bottle is found (what is not the ground) and brought to the middle;
- where it is small, it is brought closer until it fills 80% of the frame;
- on a clean white or black ground it may be drawn back until all of it fits, with the frame
  taking that colour;
- a printed border is trimmed off;
- a scene is filled and centred.

The two scripts carry the same reading; the pages share no script. Des Cendres and Bad Lily
stand whole on their own white, Belle Âme and Tobacolor fill theirs placed on the bottle, the
Tombstone pair are brought close on their black, and the scenes — Haxan, De Profundis, French
Riviera, Amaretto Jazz — are filled and centred. The bottle found is left on the frame as
`data-subject`. The credit stands under it as before; on a phone the print comes first. It is
called **the print** and not the plate, because *the plate* on this page is already the chamber's
word and menu.

**The sun answers the frame** (`sun.js`, "THE ANSWER"): a fine line of its own specks
(`EDGE_*`) run round the frame 11px outside it, a speck every 4px, lit brightest on the side
facing the sun and drawn round from there both ways as the answer comes in, as the ring was; a
**registration mark** at each corner (`CORNER_*`), two short arms of brighter specks; and its
surface a little brighter round the frame (`HALO` 0.3 of the frame's shorter side, `HALO_LIT`
0.5), the corona swelling less (`CORONA_SWELL` 0.2). The corner nearest the sun flared at a
first strength and was brought down (`CORNER_LIT` 0.95). The ring, its ticks, the finer ring inside
it and the stronger burn are gone. Shut, the line closes up **where the frame stood**
(`lastAim`), rather than vanishing in one frame, which it did for a moment in the round before.

### What was tried and was wrong

- **The circle**, and everything that came with it: the whole picture shrunk into the middle of
  a round frame over a blur of itself, the pale disc behind a studio shot, the feathering, and a
  glowing ring round it — "tacky". None of it (`.fav-disc*`, `is-studio`, `is-scene`,
  `RING_*`) is in the code.

### How to test it

- **`an opened favourite reads the start of its own entry, beside its picture in a frame,
  credited`** — as before for the writing, the links and the credits, and now: one picture per
  card with nothing laid behind it; opened, its frame upright (4 : 5) and square-cornered, the
  picture with no filter, blend or mask, placed, filling the frame edge to edge or carrying its
  clean ground on to the frame's colour, and the middle of the bottle found in it inside the frame.
- **`the sun answers an opened favourite's picture, and lets go when it is shut`** — the band
  6–24px outside the frame on the sun's own canvas is brighter by 40% and more with the card open
  than the same band once it is shut and `facing()` is back to 0.
