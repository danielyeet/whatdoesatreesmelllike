# The fragrance reader — one fragrance, opened in place

Date: 2026-09-22

Files: `fragrance-reader.js` (~380 lines, new), the `frag-*` rules in `style.css`, the
script list in `categories/scent-descriptions.html`, the renderer `notes.js` now hands
out, `tests/fragrance-reader.spec.js` (new).

## What it is

Pressing a fragrance in the **Fragrances** view of Scent descriptions used to leave the
page for `works/individual-fragrances.html`. The owner asked for it not to:

> i dont want the page for the fragrances in SD to take you to a new page when you click
> a new fragrance. I want the fragrances to open in page and one by one.

So it opens in place. The table and everything round it fades away, the page goes blank,
and that one fragrance comes up on it — its **picture**, its **writing** and its
**notes** — with an arrow at the foot to go back.

**The address does not change**, and that is the test that matters. A version that opened
by navigating would satisfy every other check here and still be exactly the thing that was
asked to go away.

## Where the writing comes from, and why it is fetched

It is **not** copied into this page. `works/individual-fragrances.html` is where a
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

Four tests, and **each of the first three was proved against a real fault** before being
trusted:

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
- **`without the reader the rows are still links to the other page`** — the site's
  standing rule, and the reason the rows were left as anchors rather than turned into
  buttons. The reader changes what a **press** does, not what the page is.

By hand:

```bash
npm run serve   # then http://localhost:8123/categories/scent-descriptions.html
```

Press **Fragrances**, then press one. Then press the arrow and watch the picture go.

## Known issues / TODO

- **None of the individual fragrances has a photograph yet**, so what recedes into the
  grid is the hatched placeholder rather than a picture. It will be a picture the moment
  the files are in `images/Individual Fragrances/`, and the transition does not care
  which it is.
- **It needs `fetch`**, which means it needs the page served over HTTP. The site already
  does — `file://` is unsupported for other reasons — but with the fetch refused the
  reader says so and links to the fragrance on its own page.
- **The Houses view still navigates.** Pressing a house on the contact sheet opens that
  house's page, as it always has. The owner asked for this for the Fragrances view only,
  and a house is a long page rather than one fragrance.
- **The picture comes to rest as one 46px square**, which is what "recede into one of the
  squares" means literally. If that reads as too small a thing to end on, the honest fix
  is a bigger `--grid-cell` — and that would move the page's own ground with it, which is
  the owner's call rather than a number to tune here.
