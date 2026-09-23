# Tale Parfums — the seventh house, drawn by hand

Date: 2026-09-23

Files touched: `houses/tale-parfums.html` (new), `tale.js` (~480 lines, new), the
`TALE PARFUMS` block at the foot of `style.css`, `images/Tale/README.txt` (new), the
seventh frame in `categories/scent-descriptions.html`, a line in `PAGES` in
`search-page.js`, the footer chain through `houses/les-abstraits.html`, and tests in
`tests/houses.spec.js`, `tests/mobile.spec.js` and `tests/notes.spec.js`.

## What changed

A seventh house. Tale Parfums stands in the frame on the contact sheet that was the first
empty one ("placeholder 7", in the owner's words), with the lily off Bad Lily's label as
its picture. Its page carries the owner's introduction and four fragrances, **in
alphabetical order as they asked** — Bad Lily, Fleurt, Rouse, Water Me — each with three
pictures, and it is drawn to look like somebody's notebook: two handwriting faces, boxes
with uneven corners, wavy rules, pictures taped on crooked, and doodles down the margins
that draw themselves in and wobble under the pointer.

## The brief

> Design the page in a simple and very "drawn by hand" way. I want it to be simple and
> almost childish. I want there to be handdrawn designs and such. you can use
> inspirations from the pictures that come with the number 2.

The number-2 pictures are the drawings on the house's four labels, in a linocut style: a
lily with an **eye** where its heart should be, a **heart** pressed into a square sweet on
a stick, a figure holding a **rose**, and a **plant in a pot** with its roots showing.
They are what the page is drawn after.

## Why it is built this way

**Two layers, and only one of them needs a script.** Everything that makes the page read
as drawn by hand *except* the doodles is the stylesheet, so a blocked script loses the
doodles and nothing else:

| | |
|---|---|
| **the hands** | **Gochi Hand**, a thick marker, for every heading; **Patrick Hand**, a neat pen, for the reading. They are loaded by this page alone and fall back to the site's own faces. Gochi's weight was chosen to sit beside the linocut drawings; the other eight faces tried were either too neat or too hard to read at length. |
| **the boxes** | `border-radius` given eight different radii (`--drawn`) — the old trick for a box that looks drawn rather than ruled. The cue, the thumbnails, the pictures, the notes button and the dashed "not written yet" box all use it. |
| **the rules** | A short drawn wave (`--wave`), repeated along an edge, in place of every 1px line: under each fragrance, after each stage heading, under the introduction's heading, over the foot. The name has a heavier double underline of its own (`--under`), and the numbers a loop drawn round them (`--loop`). |
| **the tape** | A strip of it over the top of each fragrance's main picture. |
| **the paper** | The five tokens, redefined on `.tale-page` the way Ataraxia's are: warm paper (`#fbf8f0`) rather than the site's white. |

**The doodles (`tale.js`)** are the four label drawings again — **emblems** — drawn in a
pen line rather than copied, plus the small things a person doodles in a margin: stars, a
crescent moon (Bad Lily "lit up by the moonlight"), drops (its "morning dew", and Water
Me's "after the rain"), a sun, a heart, a swirl, a raining cloud, a sparkle, a flower and
a leaf.

- **A line looks drawn because it is not true.** A doodle is a few strokes through points
  in a 100 × 100 box; each point is nudged a little and the stroke drawn as a smooth curve
  through them. No line is straight, and a circle runs a little past where it began.
- **The same pen at every size.** The stroke width is worked out from the doodle's size.
  `vector-effect: non-scaling-stroke` does the same and was tried first — it threw off the
  dash that draws each stroke in, and the big lily's petals were left open.
- **The colour is coloured in, not filled**: the labels' own pale green (the eye) and
  peach (the heart), each laid a little off the line that holds it, like crayon.
- **They draw themselves in** stroke by stroke the first time they come into view.
- **They boil** under the pointer: redrawn every 140ms, each time slightly differently —
  how a drawing moves in hand-drawn animation, where every frame is drawn again. Away from
  the pointer they hold perfectly still; the owner has asked before for movement that
  read as jitter to be taken out, so it is only ever the hand's doing. A tap does the same
  on a phone.
- **Seeded**, so the page lays out the same way every time it is opened.

**Where they stand.** In the margins, anchored to the page rather than the window — they
are drawn *on the paper* and scroll with it — and laid again as the page grows and shrinks
while fragrances are opened and shut. **Never over the writing**, and there is a test. On
a window with no margins (under about 1100px) there are none, and the lily alone stands at
the head of the page, which is where the house's mark belongs anyway.

**Pictures.** Three to a fragrance, the house's own: the bottle is the full picture, and
the label drawing and the photograph stand in a row under it (the same
`.human-plate-more` Haxan uses). The small square in the list is the **drawing**, so the
list reads as the four emblems. *Lily (dont use).webp* is not used, as it says. The files
are 600 × 600 and small, so none needed a web copy.

**The writing is the owner's** — spelling and all, including *Tale is simple house*,
*Nornstrand*, *it feels the room*. Bad Lily has a **Dry Down** heading with nothing under
it yet, and says so in a dashed box, the way every unwritten paragraph on the site does.

**The reading is ragged, not justified**, which is a deliberate exception on this page
only: set justified, the pen face opened rivers between its words, and a hand does not
justify.

## How to test it

```bash
npm test -- tests/houses.spec.js
```

Six tests are Tale's own, and the two about the drawing were each proved against the
fault they guard:

- **`Tale Parfums carries its four, in alphabetical order`** — compared with the list
  sorted, and Bad Lily's dry down saying it is unwritten.
- **`... shows all twelve of its pictures, and not the one marked don't use`** — every
  picture loads, and the list shows each label's drawing.
- **`the doodles are in the margins, curved, and all four emblems are there`** — with the
  doodles placed in the middle of the window it fails on *no doodle may stand over the
  writing*.
- **`a doodle draws itself in, and boils under the pointer`** — drawn all the way in; still
  away from the pointer, redrawn near it, still again after. With the boil switched off it
  fails on *near the pointer it is drawn again and again*.
- **`on a phone Tale keeps its lily and nothing stands over the writing`**.
- It also joins the shared-shape test (a part opens, the rank has four ticks), the
  no-script test, the phone's no-sideways-scroll test, and the sheet's seven-houses test.

By hand: `npm run serve`, then `http://localhost:8123/houses/tale-parfums.html`. Watch the
lily draw itself at the head, scroll to see the margins fill, and hold the pointer near a
doodle.

## Known issues / TODO

- **No notes yet.** The page is wired for them (`HOUSE_NOTES = "tale"`) and every
  fragrance has its View notes button, which says the notes have not been found yet. The
  owner's rule is the house's own page first, and **taleparfum.com is blocked by the
  network policy of the environment this was built in**, so it could not be read. Entries
  go in `notes-data.js` as `"tale:01"` and so on.
- **The credit names the house's own site, and that is an assumption** — the owner left no
  note of where the pictures came from. The 600 × 600 product shots and the award mark on
  Bad Lily 3 look like the house's; if they came from a retailer, the line at the foot of
  the page is the one to change.
- **Two spellings the owner may want to know about, left as written:** the perfumer's name
  is *Michael Nordstrand* by the house's and the press's spelling, where the writing has
  *Nornstrand*; and the house styles itself *TALE Parfum*, singular, where the owner wrote
  *Tale Parfums*. The page uses the owner's name for the house.
- The lily is the only doodle drawn at the head; the other three emblems appear in the
  margins, so on a phone only the lily is seen.
