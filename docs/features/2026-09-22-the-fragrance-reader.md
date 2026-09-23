# The fragrance reader — one fragrance, opened in place

Date: 2026-09-22

Files: `fragrance-reader.js` (~600 lines, new; the way back rewritten 2026-09-23), the `frag-*` rules in `style.css`, the
script list in `categories/scent-descriptions.html`, the renderer `notes.js` now hands
out, `tests/fragrance-reader.spec.js` (new).

## What it is

Pressing a fragrance in the **Fragrances** view of Scent descriptions used to leave the
page for `individual-fragrances/individual-fragrances.html`. The owner asked for it not to:

> i dont want the page for the fragrances in SD to take you to a new page when you click
> a new fragrance. I want the fragrances to open in page and one by one.

So it opens in place. The table and everything round it fades away, the page goes blank,
and that one fragrance comes up on it — its **picture**, its **writing** and its
**notes** — with an arrow at the foot to go back.

**The address does not change**, and that is the test that matters. A version that opened
by navigating would satisfy every other check here and still be exactly the thing that was
asked to go away.

## Where the writing comes from, and why it is fetched

It is **not** copied into this page. `individual-fragrances/individual-fragrances.html` is where a
fragrance's writing lives, and the reader **fetches that page and lifts the part out of
it**.

Two copies of the owner's own words is the one thing this site has a standing rule
against — the index and the houses are "two ways into the same writing rather than two
copies of it" — and a copy here would go stale the first time they edited the other one.

One request for the whole document, kept, not one per fragrance: it is a single page and
asking for it seven times would be seven times the same answer.

**The notes are rendered by `notes.js`**, not by this file. That file now hands its
renderer out as `window.NOTE_PANEL`, and the reader calls it. One renderer, or the two
drift apart and a reader is told different things about the same fragrance depending on
which door they came in by. Handing it out meant moving `notes.js`'s "no house, do
nothing" guard down past the renderer — the Fragrances view has no house of its own and
needs the renderer anyway.

## The way back, which is the whole of the drawing

The owner described it, and it is built exactly as described:

> making everything except the picture fade (make the picture a square) and then making
> it go recede into one of the squares (at random) of the background. If there is more
> than one picture, then they all become squares and then move backwards into the grid.
> After being in the grid, make them fade away at once.

| | |
|---|---|
| **1 — the pictures come out first** | Each is measured where it actually stands and lifted into a **flier** of its own on the window, at exactly the box it occupied. Nothing moves. |
| **2 — the writing goes** | The article fades. Because the pictures are already out of it, fading the whole article *is* "everything except the picture". |
| **3 — they square up and recede** | Each flier travels back to a cell of the grid, squaring as it goes. The square and the travel are **one movement**: a picture that squared up, stopped, and then set off would read as two decisions. |
| **4 — they go at once** | Once they are all home they fade **together**, on one clock rather than each on its own. |

**One cell each, and never twice the same.** The cells are shuffled and dealt out; two
pictures receding into the same square would read as one picture rather than as two.

### The grid is the page's own one

**The contact sheet is already ruled into squares** — `--grid-cell`, 46px, set on
`:root` and spent in `.sheet-page` — and the reader is ruled into the same ones by the
same declaration. So the squares a picture goes home to are the squares that were always
there.

**It had a grid of its own for one round**, at about 90px, built as a lattice of
elements. That was written before anyone noticed the page was already ruled, and it read
as a second grid over the first, which is what it was. The owner said so: *"there already
exists a background grid. Match the grid you will create with that one."*

Two things follow from matching it, and both are improvements rather than costs:

- **The cells are not elements any more.** The grid is painted by a pair of gradients, so
  a cell is a sum rather than a thing — the nth column begins at n × cell. A 1440-wide
  window would otherwise want six hundred spans in the page to be measured and never
  looked at.
- **The size is read off the stylesheet** rather than written into the script again. The
  page's ground and the place a picture lands are then one decision, and there is a test
  whose whole job is that they are still the same number.

The reader's grid is `background-attachment: fixed`, so it is painted against the window
rather than scrolling with the reading: the squares a picture goes home to are the
squares you can see.

### "Does not replay the animation"

The owner asked for the way back not to run the opening again. The way it does not is
that **the list is already back behind the pictures before they fade**. There is nothing
to replay, because the page they are receding onto is the page they came from. What you
see is one continuous movement from the fragrance into the grid, with the list standing
behind it as it goes.

There is a test for that ordering specifically — with the list brought back *after* the
pictures have gone instead, it fails.

## Where the pictures go home to

Every square on the window was fair game for one round, so the pictures went wherever the
shuffle sent them and the same movement read differently every time. The owner asked for
one place: *"i want the grid that the fragrances can go to to be somewhere in the center,
ish and on the right side"*.

`HOME` is that block, given as fractions of the window rather than pixels so it means the
same thing on every screen — from 56% to 94% across, and from 24% to 76% down. The cells
are cut to it before anything is dealt out, and a window too small to hold the block falls
back to the middle square of whatever there is.

**These four numbers are provisional.** The owner said they would send a picture of the
grid they want; until it arrives this is a reading of the sentence, and moving it is
moving four numbers in one place.

There is a test, and it checks **four** fragrances rather than one: one landing in the
right place proves nothing about a shuffle.

## It is slower, and smoother

**Superseded on 2026-09-23** — see the section at the foot. The table below is the round
before.

Asked for in as many words — *"a tad bit slower and smoother"*. Every duration went up by
about a third:

| | was | is |
|---|---|---|
| the page going blank | 420ms | 560ms |
| the fragrance arriving | 520ms | 700ms |
| the writing going | 340ms | 460ms |
| the picture squaring up | 380ms | 560ms |
| receding into the grid | 620ms | 900ms |
| fading together | 420ms | 560ms |

**The arrival is longer than the departure on purpose**: coming to a fragrance should feel
like settling onto it, and leaving should not feel like waiting.

And "smoother" turned out to mean one easing rather than two. The travel and the squaring
ran on different curves — a sharper one for the travel — and at these longer durations
that read as the picture changing its mind half way across. They share a single soft ease
now.

## The one thing that was wrong

**The picture was the full width of the column, so the writing started below the fold.**
The reader stacked its parts: name, then plate, then writing, then notes. A plate is a
square and the column is 940px, so the plate was a 940px square and the notes were two
screens down.

It is a two-column body now — picture beside the writing, the shape a fragrance has on
its own page — collapsing to a stack under 900px.

## How to test it

```bash
npm test -- tests/fragrance-reader.spec.js
```

Six tests, and **every one of the first five was proved against a real fault** before
being trusted:

- **`a fragrance opens in the page, without leaving it`** — the address, before and
  after. With the click's `preventDefault` taken out it navigates, and it fails.
- **`it carries the picture, the writing and the notes`** — the writing's being there at
  all is the fetch, since its text is nowhere in this page's own markup. With the fetched
  writing dropped, it fails.
- **`going back sends the picture into the grid, and the list is behind it`** — five
  assertions that fail in different directions. With the picture shrinking without
  squaring it reads **91 × 271** and fails; with the list brought back late it fails on
  the ordering; with the reader ruled at 90px against the page's 46 it says so
  (*"the sheet is 46px 46px, the reader 90px 90px"*); and with the picture stopped 19px
  short of a square it fails with *"left 203 is not on the grid"*.
- **`the table fades out and stays out, without flashing back`** — the owner's bug, and
  it watches the table every frame rather than asking whether a flag was set. With the
  `[hidden]` rules taken out it reports *"the table climbed back 0.997 at frame 38 of
  120"*; with only the weaker of the two — the fix that looked right — it fails the same
  way.
- **`a picture goes home to the right of centre, every time`** — with the landing block
  opened back up to the whole window it reports *"landing 0 at x=230 of 1280"*.
- **`without the reader the rows are still links to the other page`** — the site's
  standing rule, and the reason the rows were left as anchors rather than turned into
  buttons. The reader changes what a **press** does, not what the page is.

By hand:

```bash
npm run serve   # then http://localhost:8123/categories/scent-descriptions.html
```

Press **Fragrances**, then press one. Then press the arrow and watch the picture go.

## It flashed the table back on the way in

The owner reported it precisely: *"when you click on one of the fragrances, there is a lag
where the thing in the back (the original fragrances text) appear and it looks choppy
(before the perfume specific page fades in, the one that faded away reappears)"*.

The script fades the table out, then sets `hidden` on it and takes the fading class off in
the same breath. **`hidden` did nothing.** It is an attribute, and the browser's own
`[hidden] { display: none }` lives in the user-agent stylesheet, which any author rule
outranks — and `.index-page` is given a display of its own. So the table stayed exactly
where it was, and taking the class off snapped it back to **full strength**, where it sat
until the reader had faded in over it.

**And one `[hidden]` rule was not enough**, which is the part worth remembering because
the first fix looked right and changed nothing. This view sets the page's display a second
time, through `.view[data-view="fragrances"] .index-page` — three class-level parts against
a plain `.index-page[hidden]`'s two. The plain rule lost, and the page went on being a flex
box. Both are written now, and the longer one does the work.

Measured, the table used to climb back **0.997** — from all but gone to fully lit — in one
frame. It now fades to 0.003 and goes.

**The lesson generalises:** anything on this site given a `display` of its own needs an
`[hidden]` rule that outranks *every* rule giving it one, not just the first.

**And the test that should have caught it did not**, which is its own lesson. It asked
whether the `hidden` *attribute* was set, and it was — the page was simply still on the
screen. A test that asks about an attribute is asking about the code's intention; the one
that replaced it watches what the table actually does, frame by frame.

## Known issues / TODO

- **Only Haxan has photographs** among the individual fragrances — three of them, which
  all fly home. The rest recede as their hatched placeholder, and will be pictures the
  moment their files are in `images/Individual Fragrances/`.
- **It needs `fetch`**, which means it needs the page served over HTTP. The site already
  does — `file://` is unsupported for other reasons — but with the fetch refused the
  reader says so and links to the fragrance on its own page.
- **The Houses view still navigates.** Pressing a house on the contact sheet opens that
  house's page, as it always has. The owner asked for this for the Fragrances view only,
  and a house is a long page rather than one fragrance.
- **The landing block is four numbers, waiting on a picture.** The owner said they would
  send the grid they want; `HOME` in `fragrance-reader.js` is where to change it.
- **The picture comes to rest as one 46px square**, which is what "recede into one of the
  squares" means literally. If that reads as too small a thing to end on, the honest fix
  is a bigger `--grid-cell` — and that would move the page's own ground with it, which is
  the owner's call rather than a number to tune here.

## 2026-09-23 — in a straight line, slower, and whatever the wheel does

The owner, in one message:

> make the transition in the individual fragrances from perfume page to the main tab of
> fragrances smoother, and make it a bit slower too. I want it not to do any turning but
> rather a straight path from the place the picture of the fragrance is on the screen to
> the square in which it will fade away. The fading away can be made slower too. Make it
> so that this happens independently of scrolling please, because when you scroll the
> whole page glitches out.

### What was actually wrong — measured, not guessed

Before touching anything, the way back was recorded frame by frame in a browser.

- **The turning.** The picture's *size* ran on a 560ms clock and its *place* on a 900ms
  one, and it shrank towards its own top-left corner. So its middle first went **up and
  away** from the square it was headed for (from y 129 to 118 while the square was at 299)
  and then swung round towards it: **37px off the straight line** on a still page, 59px
  with the wheel going.
- **A stall.** The flier copied the picture from its original — for Haxan, a 5152 × 7728
  photograph — and decoding it mid-movement froze the page for about **700ms**. Only 54
  frames were drawn in 2.6 seconds.
- **The scrolling.** The reader stayed on the page, invisible, until the very end, still
  catching the wheel: scrolling during the way back scrolled the fading article about
  under the picture (its position jumped between 140 and 390), and once the list was back
  the wheel reached the table too. On a phone, hiding the list also shortened the page, so
  the browser pulled the window to the top and the list came back somewhere other than
  where it was left.

### What it does now

- **One clock for everything.** The picture's place, its size and its squaring all read one
  progress, so its middle moves along one line. It travels by **transform alone** — a move
  and a scale on the box, and the picture inside scaled back the other way so it is
  cropped into a square rather than squashed — which the browser can run apart from the
  page. Recorded again: **0.06–0.09px off the line**, no step backwards, about 210 frames.
  The flier has no border any more, because a hairline scaled unevenly into a square
  smears.
- **Slower** — the writing going 460 → **640ms**, the travel (squaring and receding
  together) 900 → **1500ms**, a **220ms** rest in the square, the fade 560 → **1200ms**,
  and the reader's ground going under it over **1000ms**. One soft ease, in and out.
- **Scrolling is held** for the length of any transition — the wheel, a drag and the
  scrolling keys do nothing — and let go the moment it ends. The page is put back exactly
  where it was left, window and table both, under a reader that is still standing.
- **The picture that flies is the one on the screen** — the copy already loaded, never
  the original.
- **The reader's grid follows the page's on a phone.** The page's grid scrolls with the
  page and the reader's is pinned to the window, so on a page scrolled part of a square
  down they disagreed by that part; the reader's grid, and the squares it deals out, are
  now shifted to match.
- **Every picture a fragrance has comes with it.** Haxan now has three, and the reader
  carries all three — one full width, two in a row under it — and on the way back all
  three square up and go home to three different squares, which is the owner's original
  *"If there is more than one picture, then they all become squares"*.

### How to test it

Three new tests, and two were proved against the fault:

- **`every picture goes home in a straight line`** — watches the middle of each of
  Haxan's three pictures every frame. With the old shape put back (shrinking towards its
  corner on a faster clock than it travels) it reports *"picture 0 strayed 68.0px off its
  line"*. Worth knowing: the first fault tried — only a faster size clock — did **not**
  fail it, because the new flier scales about its own middle and cannot be bent that way
  at all.
- **`scrolling during the way back moves nothing, and is let go after`** — turns the wheel
  the whole way through and asks that the reader, the table and the window never moved,
  then that the wheel works again. With the hold switched off it fails on *the reader
  should not scroll under the pictures*.
- **`Haxan carries all three of its pictures, here and on its own page`** — and that they
  are the web copies, never the originals.

The older tests' waits were lengthened to the new timings; that is the deliberate change
the owner asked for, not a loosening.

## 2026-09-23 — the notes open on a click

The owner: *"change the format of the notes of the perfumes in haxan (and other
individual fragrances) so that it is also click to open."* The reader printed a
fragrance's notes out in full under its writing; every house page puts them behind a
**View notes** button that opens a window. The reader now does the same — **the same
button and the same window, from `notes.js`**, which hands its window-builder out as
`NOTE_PANEL.button` beside the renderer it already handed out. One window, or the two
drift apart.

Three things the reader has to look after that a house page does not:

- **It shows one fragrance after another in the same place**, so each one's window is
  taken off the page (`remove`) when the next is opened, and when the reader closes — a
  test checks the windows do not pile up.
- **Escape answers twice.** The window and the reader both listen for it. Pressed with a
  window up, it closes the window and leaves the fragrance; pressed again, it goes back to
  the list. The reader asks, in the capturing phase, whether a window was up before
  `notes.js` had shut it.
- **The way back closes an open window first**, so it never stands over the pictures
  flying home.

Tested by `it carries the picture, the writing and the notes` (now: a button, nothing
printed, and the window with Haxan's two halves once pressed) and `escape shuts the notes
before the fragrance, and windows do not pile up`.
