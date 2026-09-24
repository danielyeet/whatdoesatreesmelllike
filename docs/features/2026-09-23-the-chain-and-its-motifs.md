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
