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
| Les Abstraits | smoke rising in strands off Des Cendres' fire, embers, and falling ash |
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
