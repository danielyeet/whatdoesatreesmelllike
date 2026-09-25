# The Houses view as a chain, and each house's motifs

Date: 2026-09-23

Files touched: `contact-sheet.js` (rewritten, ~430 lines, down from ~1,570), `motifs.js`
(new, ~650 lines), the `sheet-*` rules in `style.css` (the old map's rules replaced by the
chain's), `categories/scent-descriptions.html` (a `data-motif` on every frame, frames 08
and 09, the new script), `tests/contact-sheet.spec.js` (rewritten).

> **The chain lasted one round.** On 2026-09-24 the owner asked for the page "completly
> differnet … a gallery like view", and the Houses view is now [a gallery
> hang](2026-09-24-the-hang.md). What this report says about the **motifs**, the
> **resting** (whose wait is shorter now), **pressing a house** and **the way in to a
> house** all still holds, except that Tombstone's and Qimu & Musicians' motifs were
> replaced. The chain itself and its bars are gone from the code.

## What changed

The Houses view of Scent descriptions is no longer a map of pictures scattered across the
page and joined by dated lines. It is **one chain**, drawn the way the owner drew it:
the houses in order, left to right along the first row, down, right to left along the
second, each joined to the next by a short bar. It **draws itself in** from the first
house to the last. **Resting** the pointer on a house brings that house's own **motifs**
up over the page while everything else goes out of focus, and leaving lets them fade.
**Pressing** a house steps the page back before the house opens, and the house then
**eases in** instead of blinking on.

## The brief

> You know what, remove the animation for the SD page. I want you to completly remove
> that startup animatiob. Instead, I want you to create something like image 1 in this
> messaage. I want you to nicely animaate it too. and smoothly so. Make sure the
> transitions between houses and perfumes remains the same. Keep houses only up to 9,
> so so far so good. Additionally, whenever you hover one of them, motifs from that page
> start occuring and appearing on the SD Houses page, while everything else kinda blurs
> out, and when you unhover, the motifs fade gradually, they dont disappear. I also want
> the effect to start not instantly, but after momentarily hovering, so that when you go
> with your mouse from one part of the screen to another, it doesnt cause chaos.

Image 1 was a hand drawing: boxes of different sizes in a snake — seven along the top
labelled p, a, ah, ata, gra, LA, tale, then down on the right and back along a second
row, and down again on the left into a third — joined by short bars, some a single thick
stroke and some two hairlines with the paper between them.

## Why it is built this way

**Everything the old sheet was is gone, not switched off.** The flick through the middle
window, the scatter, the depth, the specks, the dated lines, the traces, the pulses, the
pull, the ties, the "hot" drawing round a picture: none of it is in `contact-sheet.js` any
more, and none of its styles are in `style.css`. The owner asked for the startup animation
removed completely and for this in its place. The [contact sheet's
report](2026-09-13-the-contact-sheet.md) is kept for why each of those things was the way
it was, and says at its head that it describes a page that no longer exists.

**Kept as it was**: the two views and the swipe between them (`views.js` was not
touched), the page's own search, the number chip in each frame's corner, the chrome
arriving once the page has drawn itself, the `js-coming` hold that stops the plain grid
flashing on the way in, the plain grid itself when the script is blocked, and the grid of
46px squares the page is ruled into — which the fragrance reader's pictures still fly
home to.

### The chain

- **A row is as many houses as the width allows** — seven on a wide window, as drawn,
  then five, four, and two on a phone (`rowOf`). Each house gets a slot in its row, so
  nothing can land on anything else.
- **The rows are a snake.** Even rows run left to right and odd rows right to left, so the
  last house in one row and the first in the next stand in the same column, and the bar
  between them runs straight down.
- **Every box is its own size** (`WIDE`, `TALL`) and stands a little up or down in its row,
  which is what puts the bars at different heights, as in the drawing. **No box is
  narrower than its name**: the first version cut "Grande Parfums" to "Grande Pa…".
- **The bars are one of two kinds**: a solid stroke, or two hairlines with the paper
  between them. A bar that turns the chain round is always the double one, as drawn.
  They are plain elements (`.sheet-link`), not a canvas, so each can be run out with a
  transform.
- **The name is printed inside the box**, bottom left, on its own chip — where the owner
  wrote the names in the drawing. The line about the house (the **say**) still hangs
  under the picture when it is pointed at; a house in the right half hangs it leftwards,
  because Tale's ran off the edge of the window and the page scrolled sideways by 82px.
- **Seeded**, so the chain stands the same way every visit, and a resize lays it out again
  rather than re-running it.
- **It stands in the middle of the window** when it is shorter than the window, rather
  than hanging from the top with the page empty under it.
- **The owner's first box was filled green** in the drawing. That was read as the owner
  marking where the chain starts, not as a colour for Pineward's box, and nothing is
  filled; worth asking.

### The way in

From the first house to the last, `STEP_MS` (260ms) apart: the bar into a house runs out
from the house before it, and as it reaches the house the picture is **uncovered from the
side the bar came in at** (`data-enter`, a `clip-path` wipe over 760ms). Two houses are
always on the move at once, so it reads as one movement rather than a row of switches.
Once a house is uncovered its clip is taken off altogether (`whole`), or the say could not
hang below it. The whole chain takes about three seconds, and the chrome arrives when it
is done. With reduced motion everything is there at once.

### Resting on a house

- **It waits.** `HOVER_WAIT_MS`, 420ms, of the pointer resting on one house before
  anything happens. Crossing the page from one side to the other passes over house after
  house and sets none of them off, which is the owner's "so that when you go with your
  mouse from one part of the screen to another, it doesnt cause chaos". The keyboard gets
  the same on focus.
- **The rest of the page goes out of focus** — every other house and every bar blurred
  and faded (`musing` on the sheet) — and the house itself stays sharp and in front.
  Coming back into focus is slower than going out of it.
- **The motifs gather rather than appear.** Nothing is there the moment a house is rested
  on: things are born one at a time, and each comes up over its own `FADE_IN_MS`. A first
  handful is owed straight away so the page is not empty for the first second.
- **They fade rather than vanish.** Leaving stops anything new being born and fades what is
  there over `FADE_OUT_MS` (1.7s), each from wherever it had got to. Moving straight to
  another house lets the first house's motifs finish fading while the second's come up.
- **They keep off the house being rested on**, and out of the band across the top where
  the Menu, the two buttons and the search stand. Things that fall in from above (rain,
  needles, petals) are the exception.
- **The canvas runs only while there is something on it.**

### Each house's motifs (`motifs.js`)

Taken from each house's own page. `data-motif` on the frame names which set.

| house | motifs |
|---|---|
| Pineward | conifers growing up from the lower page, drawn in specks in the house's bark and green, and needles falling |
| ADAR | the void — a hole with soundings ringing out from it — and dust falling |
| Almost Human | figures of specks that gather most of the way into a person and come apart again, never quite arriving; and rain |
| Ataraxia | bands of specks crossing the window at their own angles, with a crest of light travelling along each |
| Grande Parfums | the drift, rising, with a few larger motes — the quietest, as the house's own ground is |
| Les Abstraits | smoke rising in strands off Des Cendres' fire, embers, and falling ash (then abstract compositions; since 2026-09-24, night, one point, one line and one circle — see the foot) |
| Tale Parfums | doodles drawing themselves in — stars, hearts, moons, spirals, flowers, sparkles, drops — the heart and the flowers coloured in with the labels' peach and green |
| Tombstone | stones standing up out of mist, drifting mist, and red petals |
| Qimu & Musicians | notes rising, a record turning, and a line of sound across the page |

The two newest houses have no ground of their own on their own pages yet; their motifs
were made from the houses themselves — Tombstone's bottles are stones, and Qimu's picture
is a record sleeve.

### Pressing a house

The page steps back — the chrome, the other houses and the bars fade and go out of focus,
and the house pressed comes forward a little and fades — and **only then**, 560ms later,
is the house opened. A press meant for a new tab or window is left to the browser. Coming
back with the browser's back button can restore the page as it was left, stepped back, so
`pageshow` puts it straight.

### The way in to a house

The other half of "it just kinda blinks on the screen", and on every house, however it
was reached: the page's contents come up over nearly a second, the head rising a little
with them. It is an animation on `body`, because **fading the body does not fade the
page's ground** — the body's background is the window's — so ADAR and Ataraxia are dark
from the very first frame and never flash white. Nothing is given a transform but the
head, because a transform on anything holding the page's fixed chrome would carry that
chrome off the window with it. Tale is left out on purpose: it has its own way in, piece
by piece, and two on top of each other would be one too many. With reduced motion a house
is simply there. The rules are at the foot of `style.css`, under THE WAY IN.

## How to test it

```bash
npm test -- tests/contact-sheet.spec.js
```

Nineteen tests. The chain's own, each proved against the fault it guards:

- **`the houses stand in one chain, left to right and back again`**: nine houses, one bar
  between each and the next, each bar leaving one house and reaching the next, rows
  alternating direction, seven to the first row. It fails against the old sheet.
- **`no two houses overlap, and no bar crosses a house`**, at four widths down to a phone,
  and the page never scrolling sideways. That last check found the say running off the
  edge.
- **`the boxes are uneven and both kinds of bar are used`**, and no name cut short.
- **`the chain draws itself in, house by house, in order`**: fails with every house
  arriving at once.
- **`the old startup flick is gone`**: no house is ever shown anywhere but in its own
  place. Fails against the old sheet.
- **`resting on a house brings its motifs after a moment, and blurs the rest`** and
  **`passing over the houses does not set their motifs off`**: both fail with the wait
  set to nothing.
- **`leaving a house lets its motifs fade rather than vanish`**: fails with the fade set
  to nothing.
- **`every house on the chain has motifs of its own, and they draw`**.
- **`pressing a house steps the page back before opening it`**: fails when the press cuts
  straight to the house.

The rest carry over from the old sheet: the heading, nothing shifting sideways, every
picture a link, the chrome arriving once drawn, the number chip, the search, reduced
motion, nothing shown before the script takes over, and the plain grid without it.

The way in to a house is in `tests/houses.spec.js`: `every house eases in rather than
blinking on` (fails with the animation removed), `a dark house keeps its dark ground while
it eases in` (fails if the ground fades with the page), and `with animation turned off a
house does not fade in` — which caught the rule that turns it off being weaker than the
rule that turns it on.

By hand: `npm run serve`, open `http://localhost:8123/categories/scent-descriptions.html`,
watch the chain draw in, rest on each house, cross the page quickly, press one.

## Known issues / TODO

- **The green first box** in the owner's drawing was not copied (see above).
- **Nine houses make a short second row** of two, because the chain follows the drawing
  and the drawing's first row is seven. A tenth house carries on along it.
- **The motifs were made here, not asked for one by one.** They are taken from each
  house's own page, but the owner has not seen them yet, and Tombstone's and Qimu's are
  guesses at houses with no drawing of their own.
- **On a phone there is no resting**, since there is no hovering; a tap opens the house.

## 2026-09-24 — the motifs behind the houses, Tombstone's names once, Qimu quieter

(Tombstone's epitaphs and Qimu & Musicians' staves themselves are described in [the
hang's report](2026-09-24-the-hang.md), where they were made.)

- **Behind the houses, over the whole page, blurring nothing.** On the Houses view the
  motifs' canvas stands under every house and under the particles, and `start()` is handed
  no house to keep clear of — handed none, it now clears the old one (`avoid = null`)
  rather than keeping it from the last house rested on. Nothing else on the page is
  blurred or dimmed while they come any more. See [the axis](2026-09-24-the-axis.md).
- **Tombstone writes each of its five names once**, in the house's order — "not at random
  as it currently is (i dont want duplicate names)". `epitaphsLeft` is filled afresh each
  time the house is rested on, a name is taken off it only once it has found somewhere to
  stand, and a name still on the wall (fading from a moment ago) is never written again
  beside itself. The names are kept off every house that can be seen (`around`, handed in
  by the page): the roots and flowers may run behind a picture, but a name half hidden
  behind one has not been written.
- **Qimu & Musicians is quieter** — "more subtle and way less movement": the staves are
  drawn in at a third of the strength they were and out over three seconds rather than one
  and a bit; there are at most three of them and a dozen notes rather than five and forty;
  the notes are drawn at half strength, stay three to five seconds, and **stand still where
  they are put** — they used to drift to the left.

Tested in `tests/contact-sheet.spec.js`: `Tombstone's motifs write each name once, never
twice and never behind a house` (reads every word the canvas is asked to write; fails with
the names picked at random, and with them allowed behind a house) and `Qimu & Musicians'
motifs are faint and their notes stay where they are put` (reads every colour and every
note head the canvas is asked for; fails with the old strengths, and with the drift put
back).

## 2026-09-24, last — names kept apart, Ataraxia stronger, Les Abstraits changed

> also, i want you to have a minimum distance away from the texts that pop up when you
> hover over tombstone fragrances (i dont want whats in picture 1). Also emphasize the
> ataraxia effect. Also, i want you to change the les abstraits effect

- **Tombstone's names keep their distance.** Picture 1 was *Evergrow* written into *No
  Need to Come By*. Every name now carries the box it stands in, and a new one is only
  placed `NAME_APART` (40px) clear of every name still on the page, fading ones included
  — and clear of the houses **with their labels**, which stand under the picture's own box
  (*Sing at My Funeral* had been written across "09 Qimu & Musicians"). It tries 24 places
  before giving up; a name that finds none simply waits for room.
- **Ataraxia's bands are emphasised**: ten at most rather than seven, born more often,
  their specks about twice as dense, heavier and darker, a soft haze laid along each band's
  length, and a brighter, longer crest travelling along it. Measured on the canvas they put
  ink on about seven times as much of the page as before.
- **Les Abstraits' effect is new: abstract compositions.** The smoke off Des Cendres' fire,
  the embers and the ash are gone from the code (`smoke`, `ember`, `ash`, `EMBER`). The
  house is *the abstracts*, so its effect is a few forms at a time laid out round one point
  as a composition is — a circle, an arc, a line cutting across, a triangle, a small solid
  disc, a row of dots — each **drawn in by a pen line** over about a second, one after
  another, holding, and let go; in the page's ink and the **amber of the house's bottles**
  (`ABSTRAIT_AMBER`), with loose points drifting very slowly between them. Compositions
  keep well clear of each other. The owner said only "change"; this is a guess at what
  suits the house, and worth checking with them.

Tested in `tests/contact-sheet.spec.js`: the Tombstone test now also measures the least
room between any two names (at least 24px, edge to edge) and keeps them off the houses'
labels. **It fixes the page's chance**: a seeded `Math.random` and a smaller window
(`TOMB_SEED`), because with where a name lands left to chance the crowding happened on
only some runs and the test passed with the protection taken out — seeded, it fails 3 of 3
with either protection removed. `Ataraxia's bands cross the page strongly` (fails with the
old number of bands) and `Les Abstraits' motifs are abstract compositions, not smoke and
embers` (reads the arcs and colours the canvas is asked for; fails against the old
motifs).

## 2026-09-24, later still — Ataraxia fewer and stronger, Tombstone's petals and roots

> Also make ataraxias effect slightly less frequent with the streaks, but make the streaks
> more significant. with tombstone, I want some of the red petals to fall, and then not be
> removed Unless hovered away, so that if you keep hovering tombstone, then the red petals
> will eventually be collected on the ground. also make the things truly grow from the top
> top, as shown in the picture 1.

- **Ataraxia: fewer bands, each more of a band.** Born at 0.7 a second rather than 1.6, at
  most six standing rather than ten (seven can be on the page for a moment, one fading as
  the next comes), and each lives longer (8.5–12s). Each is half as wide again (22–34px
  either side of its line rather than 14–22), its specks denser, a little larger and darker,
  its haze heavier and wider, and its crest longer.
- **Tombstone's petals fall and gather** (`petal()`). A petal leaves one of the open
  flowers at a root's tip, tumbles down with a sway — drawn narrow and wide by turns, as a
  petal turning over is — and lands. **It has no life of its own**: once landed it lies
  there until the house is left, when it fades with everything else. `heap` is how high
  the pile already stands every `HEAP_STEP` px across, and a petal lands ON it and raises
  it there (a little to either side too), so resting long enough grows a drift of red along
  the foot of the window. At most 360 at once; the pile starts again from the ground once
  the last petal has gone. A root carries its flowers as `flowers` so a petal knows where
  it can fall from.
- **Roots from the top start at the very top.** A root coming in from the top edge started
  at `CHROME` (64px down, under the band the Menu and the buttons stand in) — the owner's
  picture showed exactly that. It starts at −4 now, above the window.

Tested in `tests/contact-sheet.spec.js`: `Ataraxia's bands are fewer at once, and each
wider` (counts the hazes drawn in each frame over sixteen seconds and reads their widths;
fails with the old number of bands, and with the old width), and `Tombstone's petals fall
and gather on the ground until the house is left, and roots grow from the very top` (reads
the fallen petals drawn along the foot of the window — told from a flower's petals by
their size — twice, six seconds apart, and requires more the second time; then that
they are gone once the house is left; and looks for a root at the top edge heading DOWN
into the window, since a root from the side can wander up past the edge. Fails with no
petals, with petals given a life of four seconds, and — three runs of three — with the
roots starting under the chrome again). The Tombstone names test still passes seeded:
adding the petals changes what the seeded chance draws, and it was run again.


## 2026-09-24, night — Les Abstraits, profound and minimal

> I want you to change the hover effect of les abstraits, i want it to be somehow more
> profound and yet minimalist.

The abstract compositions — several at once, each three to five circles, arcs, lines,
triangles, discs and rows of dots, with a scatter of loose points between them — are gone
(`composition`, `point`). In their place, `stillness()`: **one composition over the whole
page, of three things, each coming in its turn** — the house's own *Eugen's ideas and
Antoine Lie's execution* said as a drawing:

- **The point** — the idea: one small solid point of the bottles' amber
  (`ABSTRAIT_AMBER`), set down first, then breathing very slowly.
- **The line** — a horizon through it, a hairline at the golden section of the window's
  height (0.618), drawn out from the point to both edges.
- **The circle** — the execution: one great circle round the point, laid down in **a
  single stroke of a brush** (an *ensō*) over `ENSO_MS`: heavy and round where the brush
  lands, narrowing as it goes, never quite closed (`ENSO_SWEEP`, 91% of a turn), and split
  by **dry streaks** towards its end. The stroke is one filled shape of changing width; the
  streaks are cut out of it (`destination-out`), which is how paper shows through where a
  brush has run dry. It is drawn before the line and the point so the cuts go through
  nothing of theirs.
- And now and then (`RIPPLE_EVERY`) a hairline **ring** of amber goes out from the point to
  the circle and is gone, so the page is never quite still.

Everything stands behind the houses, so **the point is set on whichever side of the
window has no house standing over it** at the horizon (read off `readAround`, the boxes
the Houses view hands over), the right third if both are clear. It has no life of its
own: it stays whole until the house is left, and then fades with everything else.

Tested in `tests/contact-sheet.spec.js`: **`Les Abstraits' motif is one point, one line and
one circle`** replaces *abstract compositions, not smoke and embers*. It reads what the
motifs' canvas is asked to draw once it has all come: never more than twelve things
filled or stroked in a frame (the compositions drew dozens — it fails there against the
old code), the amber there, a stroke one pixel high across more than 90% of the window
(the horizon), a filled shape more than 200px each way (the circle's stroke), and no
embers or smoke.


## 2026-09-24, late night — five houses' motifs made over

> Please undo whatever it is you did with ataraxia, I meant that the particles should be
> more emphasized, not make a random beam where they are. please undo and make it
> emphasized in a way of particles and shadows rather than the gray rectangle. — With
> grande parfums, i want the particles that come up to sort of bubble. ALso double their
> frequency and quantity. — For les abstraits, make something to do with droplets, and
> concentrations (the chemical act of concentrating) OR EVEN BETTER, MAKE SOMETHING USING
> THEIR LOGO — for QImu and musicians, make it complex, I dont want it to be just a simple
> 4/4 rhythm with a note here and there, i want it to resemble proper complex compostions.
> and then make it that sometimes they are in the 5 line grid, while othertimes it is just
> complex notes popping up spontaneously. — make the amost human hover effect be more like
> humans glitching into existence and then after a brief delay glitching out (i may want
> to reverse this but lets try)

- **Ataraxia: the haze is gone; particles and shadows instead.** Each band used to lay
  one soft grey stroke 40-odd pixels wide along its whole length under its specks — the
  owner's "random beam" and "gray rectangle". It is taken out. A band is its particles
  now: darker, heaped towards its spine so it has a body, about one in thirty a larger
  round **mote**, the crest swelling them as it passes — and every one **casting a soft
  shadow** below and to the right, as a particle standing a little off the paper would.
  The shadows are laid down once when the band is born, on a canvas of their own at half
  the window's size and blurred (`shade`), since the particles never move; each frame
  only draws it back at the band's strength. **The Ataraxia page itself was not touched**
  — its darker ground and its lingering kindle from the round before stand.
- **Grande Parfums: bubbles, twice as many.** The drift's specks are **bubbles** now
  (`drift()` keeps its name): a ring rather than a speck, wobbling side to side as it
  rises, growing a little as it goes, heavier on its lower edge where the light bends —
  and at the top of its rise it **pops**, a broken ring thrown out and four droplets. The
  smallest stay specks. Born at 90 a second rather than 45, up to 640 at once rather than
  320, over the same lives: twice the frequency and twice the quantity.
- **Les Abstraits: droplets concentrating into the house's mark** (`concentrate()`),
  replacing the point, line and circle of earlier the same night. The owner sent the
  logo (`images/Les-Abstraits/les-abstraits-logo.png`, white on black), and its white is
  read once, when the page opens, as the places a drop may land and as the shape itself
  (`logo`). A composition is: **the solution** — 900 droplets scattered thin across the
  whole page, pale, in the bottles' amber; **concentrating** — each drawing in on a curve
  and a moment of its own, darkening from amber to ink as it closes; **the concentrate** —
  once all are in, the mark sets solid in ink and the drops sink into it; and **a drop**
  now and then gathering at the mark's foot, hanging, falling and landing with a small
  ring. The mark stands wherever of nine places about the page the houses cover least.
- **Qimu & Musicians: proper music, on staves and loose.** The staves were four-four with
  a note here and there. Now a stave is **written out, left to right**, as a score is read
  (`QIMU_WRITE_MS`): a clef, a key signature, a time that is rarely 4/4 and changes at a
  bar now and then, a tempo marking — then bars of real texture from a small composer
  (`writer()`): beamed runs of semiquavers and demisemiquavers, tuplets of three, five,
  six and seven, chords with their accidentals stacked before them and seconds set either
  side of the stem, rolled chords, grace notes, trills, rests, slurs, staccato and accents,
  and dynamics and hairpins under it. Nearly half are a **grand staff** — two staves braced,
  a bass line under the melody, bar for bar. Then **loose music** (`passage()`): no staff
  at all — a run under its tuplet and slur, a cadenza of small notes ending on a fermata,
  a hammered cluster, a few chords — popping up on the page and gone. **The two take
  turns**: nine seconds of staves being written, seven of loose music (`QIMU_STAVES_MS`,
  `QIMU_LOOSE_MS`), the staves already written staying out their time. Everything is
  drawn in paths, because a music font cannot be counted on. Still faint (nothing over
  half strength) and still nothing drifts. The first stave is there the moment the house
  is rested on (`first` on a kind).
- **Almost Human: figures glitch into being, stand, and glitch out.** A figure used to
  gather most of the way into a person and come apart. Now it arrives as a broken signal
  does — cut into nine bands across, each thrown sideways by its own amount and
  re-thrown every 55ms (`GLITCH_STEP`), some missing, a ghost of the whole a few pixels
  off, all settling into place over `GLITCH_IN` — then **stands** for a moment
  (`GLITCH_HOLD`), then tears apart the same way over `GLITCH_OUT` and is gone. It is not
  faded in as well (`sharp`). The owner said they may want it reversed; the three beats
  are three numbers.

`window.HouseMotifs.census()` says what is standing on the page, by kind — the tests
count bubbles and staves with it.

Tested in `tests/contact-sheet.spec.js`, every one failing against the page before:

- **`Ataraxia's bands are particles with shadows, few at once, and no grey haze`**
  replaces *fewer at once, and each wider*: over a sixteen-second rest nothing wider than
  6px is stroked on the motifs' canvas (the haze was 37px and more), every band draws its
  shadow (which is how the bands are counted — never more than seven, more than two), and
  each band is over 40px wide.
- **`Grande Parfums' particles are bubbles that pop, twice as many as the drift`** — over
  420 standing at once after eight seconds (the drift was 320 at most), drawn as rings,
  and popping.
- **`Les Abstraits' droplets gather out of the page into the house's mark`** replaces the
  point-line-circle test: the owner's logo file is fetched; a moment after resting the
  ink spans more than 60% of the window's width, in amber; six seconds later it spans
  less than 420px and less than half what it did.
- **`Almost Human's figures glitch in, stand a moment, and glitch out`** — frame by frame,
  some frames catch a figure with its ghost (glitching) and some catch every figure whole
  (standing).
- **`Qimu & Musicians' music is complex, on staves and then loose on the page`** — times
  other than 4/4 written, dynamics written, over forty noteheads in a frame, staves and no
  loose music at first, and loose music later.

## 2026-09-25 — five houses' motifs made over again

> Now redo the ataraxia streaks, the shadows of the particles look really ugly, please
> undo that. maybe give them a wavelike quality, where they cause vibrations around them.
> Make the particles just particles otherwise, quite uncomplicated. — With grande parfums,
> i want it to be particles, not bubbles bubbles. — for les abstraits, i dont want it to
> ever turn into the actual picture (pic 1). I want the animation changed again actually,
> make it something according tot he page — Qimu and musicians, make it shorter lines, so
> it dosnt span across the entire page. I want it to be more subre as well plase, not so
> in your face. also remove all the dynamic elements of the compositions, such as the
> trills and whatnot. — almost human humans glitching, i want them to be made of
> particles, and not look exactly like a human wood, I want it to have the look of a
> cloudy human (unclear and blurry), that kinda glitches then appears. feel free to get
> your glitch animations from somewhere else ... because i dont want this mid glitch
> effect you used

- **Ataraxia: plain particles on a wave, shaking the air round them.** The shadows are
  out of the code (no `shade` canvas, no `SHADE_DROP`), and so are the round motes. A band
  is small square specks in one ink, and it **moves as a wave**: a ripple runs along its
  length (`WAVE_LENGTH`, `WAVE_SPEED`), swelling where a crest travels (`CREST_SPEED`),
  and the band's specks ride it across the band. Either side of it a looser scatter of
  fainter specks — **the air** — is **shaken** by it: each trembles quickly about its own
  place, hardest where the crest is and nearest the band (`SHAKE_REACH`). Nothing is
  stroked and nothing is drawn from a picture. Six at most, two there at once when the
  house is rested on.
- **Grande Parfums: particles that rise and burst** (`rise()`, which replaced `drift()`).
  Plain specks again, rising with a little sway, and at the top of each one's rise it
  **bursts** into a small spray of finer specks that fly out, slow and fade (`BURST_MS`) —
  a particle becoming several smaller ones, which is what the house's own page does now
  too. No rings. Still up to 640 at once.
- **Les Abstraits: an old armoire with iris in it, and a drip** (`armoire()`, `drip()`),
  following the house's own page, which the owner asked for in the same message (see
  [the newer houses](2026-09-21-the-newer-houses.md)). The logo motif is out of the code
  entirely — nothing reads `les-abstraits-logo.png` any more, and nothing draws a picture.
  **The armoire** stands on the floor of the window on the left (the way round stands on
  the right, and the armoire is too big to stand behind it), drawn in walnut specks along
  its lines: bun feet, a plinth, a drawer with two knobs, two panelled doors (one arched),
  a key in the lock, a cornice and a broken pediment with a finial and carved scrolls,
  a few specks worn away and the whole leaning a hair. It **builds up from the floor**
  (`ARMOIRE_BUILD`). Its right door stands ajar on a dark inside, and in it **three
  irises** open — three falls hanging, three standards up, a touch of gold on each fall —
  and **orris powder** drifts out of the gap, violet-grey, slowing and rising and gone:
  Belle Âme's iris butter. **The drip** is on the other side: a bead gathering at the
  very top of the window, swelling, falling the whole height and landing in **the
  puddle** with a ring and a small splash; the puddle is nothing at first and grows with
  every drop, eased, up to `PUDDLE_MOST`.
- **Qimu & Musicians: short staves, fainter, and no expression marks.** A stave is now a
  phrase — a fifth to a third of the window (`QIMU_LONG`), 170 to 460px — placed anywhere
  on the page clear of the others, with a narrower line gap (`GAP` 7). Fainter
  (`QIMU_LINE` 0.18, `QIMU_INK` 0.3), four at most. **Taken out of the composer**: dynamics
  and hairpins, trills, grace notes, accents, staccato dots, fermatas, rolled chords and
  tempo words (`mHairpin`, `mWave`, `mFermata`, `grace`, `trill`, `dyn` and `TEMPI` are
  gone). **Kept**, because they are the rhythm and the notes rather than the expression:
  beamed runs, tuplets, chords with their accidentals, clusters, rests, slurs, clefs, key
  signatures, and the time signatures — picked from fourteen that music actually uses
  (`TIMES`, 4/4 among them) and changing at a bar now and then, the same in both staves of
  a grand staff. Loose passages are a run, a flurry of small notes under a beam, a
  cluster or a few chords.
- **Almost Human: clouded figures, glitching in with a better glitch.** The banded
  slicing is out of the code (`BANDS`, `GLITCH_*`). **The figure** is volumes rather than
  a trace — a head, a neck, shoulders, a torso, two arms held a little off the body, two
  legs a little apart, each a capsule, posed a little differently every time — filled
  with 560 specks, each thrown off its place by a soft random amount (`FIG_BLUR`) and a
  few by a great deal: dense in a limb, thin at its edges, no outline, breathing. **The
  glitch in** (`FIG_IN`) is a broken signal finding itself, taken from what real ones do:
  **stutter** (there on one step, gone on the next, `FIG_STEP`), **a colour split** (a red
  copy to one side and a cyan one to the other, closing on the figure), **a smear** (a
  band of it dragged sideways into streaks) and **interlace** (every other line missing).
  It then **stands** (`FIG_HOLD`), and **goes as an old screen turned off does** —
  pressed into a bright line across, the line to a point (`FIG_OUT`).

Tested in `tests/contact-sheet.spec.js`, each replacing the test for what it replaced and
each failing against the page before:

- **`Ataraxia's bands are plain particles on a wave, with no shadows`** — no picture drawn
  on the motifs' canvas (the shadows were one), no round mote, nothing stroked, every
  speck a square of 3px or less, never more than seven bands and more than two over a long
  rest, and the specks MOVING: of the first four hundred drawn in one frame, fewer than
  half are drawn in the same place the next.
- **`Grande Parfums' particles rise and burst into smaller ones, twice as many as the
  drift`** — over 420 standing, nothing stroked, and specks under 1px (the bursts) among
  the whole ones.
- **`Les Abstraits' armoire stands on one side and a drip fills a puddle on the other, and
  the logo never appears`** — the logo is never asked for and no picture is drawn; ink in
  the left third; something at the very top of the right third (the drop gathering); the
  foot of the right third growing over six seconds; the iris's violet among the colours.
- **`Almost Human's figures are clouds of specks that glitch in and then stand`** — each
  figure hundreds of specks; the red and cyan copies a share of what is drawn over a long
  rest, and never most of it.
- **`Qimu & Musicians' music is complex, with no dynamics or ornaments, on staves and
  then loose`** — times other than 4/4, NOTHING written but numbers, dozens of noteheads,
  staves first and loose music later; **`...motifs are short five-line staves with notes
  on them`** — a stave of five even lines, notes besides, and no line on the canvas half
  the window long; and the quiet test now holds everything to a third of full strength.

`images/Les-Abstraits/README.txt` says the logo is used nowhere now, and is kept because
it is the owner's.

## 2026-09-25, night — Les Abstraits' armoire in lines, and irises at its feet

> I also want you to change the armoire that comes up when you hover les abstraits. I want
> that to be less particular dense, and more geometric (and the violets should be more
> natural, anbd coming out from the legs of it, like real flowers would)

Asked whether they meant violets or the irises that were there, the owner said **irises** —
Belle Âme's orris. Only the hover changed: the armoire on Les Abstraits' own page
(`abstraits.js`) is as it was, at their word.

- **The armoire is geometry in walnut hairlines** (`armoire()` in `motifs.js`), where it was
  thousands of specks along its lines and a fill of 520 more inside. It stands on **four
  tapered legs** — two in front, two seen behind them standing a little higher — in place of
  the bun feet, with a shallow V of an apron between the front pair; a plinth line; a drawer
  with two knobs; the shut left door with an upper panel carrying **a diamond** and a lower
  one, and its keyhole; a cornice in two straight steps; a **broken pediment** in two straight
  rakes (an inner line under each) with a **diamond finial** on a short post. The carved
  scrolls and the arched panel are gone: every line is straight but the knobs and the keyhole.
- **The right door still stands ajar**, a parallelogram seen beyond the carcass, and through
  the gap **the inside is drawn in perspective** — its back set in, the four corners run back to
  it, two shelves — on a faint flat tone.
- **Specks are accents only**: one at every joint of the heavier lines (`joints`; the knobs and
  the keyhole carry none, or their circles read as dots), and the orris powder from the gap at
  half the rate it was (`POWDER_EVERY`, 100ms). A couple of hundred a frame, drip included.
- **It draws itself up from the floor**, as it built itself before: each line grows from its
  lower end once the build has reached its height (`put` records how far up each starts and
  ends), the legs first and the finial last.
- **The irises grow at its front legs** instead of standing in the cupboard: a clump at each,
  **a fan of sword leaves** as an iris grows — the middle ones tallest, the outer ones arching
  away, now and then a tip flopped over — then **two stems** rising past the leaves and leaning
  out from the leg, each with a small spathe, one opening into **three falls hanging down and
  out** with the gold beard on them and **three standards cupped upright**, and the other left
  **a shut bud**. Leaves first (`IRIS_FROM`, once the legs stand), stems after
  (`IRIS_STEMS_AFTER`), flowers opening last (`IRIS_OPEN_AFTER`), and all of it swaying a
  little from the ground (`IRIS_SWAY`). The colours are the ones it had: `STEM`, `IRIS`, and
  the beard's gold (`BEARD`).
- **The drip and the puddle are unchanged.**

Tested in `tests/contact-sheet.spec.js`:

- **`Les Abstraits' armoire is drawn in lines rather than specks, with irises growing at its
  feet`** — while the house is rested on and everything has grown, fewer than 400 specks a
  frame are drawn on the motifs' canvas (it was thousands); the iris's violet is at the foot of
  the window on the armoire's side; and none of it is up in the band where the irises used to
  stand inside the door.
- The test before it (the armoire on one side, the drip and the puddle on the other, the logo
  never asked for, the iris among the colours) is unchanged and still passes.
