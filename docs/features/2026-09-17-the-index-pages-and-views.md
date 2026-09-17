# The index pages, and the two views

Date: 2026-09-17 (`d7092b2`, *Two views for the houses, an index to sort them by, and
two new houses on the map*; migrated from CLAUDE.md on 2026-09-17)

Files: `index-page.js` (~290 lines), `views.js` (~85), `categories/researches.html`,
the Fragrances view of `categories/scent-descriptions.html`, the `index-*` block in
`style.css`, `tests/index-pages.spec.js`

## What it is

Two places on the site are laid out as an **index** rather than as a drawing:
`categories/researches.html`, and the Fragrances view of the contact sheet page. They
share one block in `style.css` and one script, so a change to either is a change to both
— which is deliberate: they are the same kind of page.

The shape is the one the owner sent a picture of: a few readings across the top, a plate
or two on the right, a long table in the bottom left corner of the window, and the
copyright under it.

## The two views

`categories/scent-descriptions.html` carries two views of itself, and the two buttons
fixed across the top of the page switch between them:

| button | view | what it is | file |
|---|---|---|---|
| Houses | the **houses** | [the contact sheet](2026-09-13-the-contact-sheet.md): one picture per house, scattered and joined by dated lines | `contact-sheet.js` |
| Fragrances | the **index** | every fragrance written up anywhere on this site, one to a line, sortable and searchable | `index-page.js` |

`views.js` owns the buttons and nothing else: neither view knows about the other, and
all they share is a class on `<body>` (`view-fragrances`) that the stylesheet reads.

**Only one view is ever on the page** — the one being left fades away *first* (`FADE_MS`,
340ms, which is as long as the fade written on `.view` in the stylesheet) and the other
arrives after it has gone, because two things fading through each other in the same
place is the one thing this switch must not look like. The leaving view is then taken
off the page altogether (`hidden`), so nothing behind it is still tabbable.
`tests/index-pages.spec.js` watches every frame of a switch and fails if both are ever
showing at once.

The Fragrances view was called *Individual fragrances* for one round; the buttons read
**Houses** and **Fragrances** now.

## Key decisions

- **The table scrolls inside its own box** (`.index-scroll`), with its headings stuck to
  the top of it (`position: sticky`). The box's height is set rather than left to the
  content, and that is the whole point of it: the owner has a great many more fragrances
  to add, and the page around the table must not grow when they do. A test checks the
  whole index still comes out on one screen with sixty-odd rows in it — the fragrances
  table currently carries sixty-five.
- **Every heading is a button.** Pressing one sorts by that column; pressing it again
  turns the sort round. What it sorts on is **written on the row** — `data-no`,
  `data-name`, `data-house`, `data-date` — and never read off the lettering, so
  `14.03.2026` sorts as a date rather than as the number fourteen, and a fragrance sorts
  by its name rather than by the markup round it.
- **A row's number is its own**, not its place in the list: sorting by date renumbers
  nothing. The number is what the piece is called; where it stands is what you just
  changed. A test checks the printed number still matches the row's own after a sort.
- **A row with nothing to open is not a link** (`data-open="no"`), and is drawn quieter
  than one that is, so an unwritten research reads as unwritten rather than as broken.
  An empty date sorts to the END rather than the beginning: an empty string is the
  earliest thing there is, and nothing unwritten should head a list ordered by when
  things were written.
- **One plate is DRAWN rather than photographed** (`.index-mark`): a slow ring of specks
  (`SPECKS` 150, `TILT`, `BAND`, `TURN`) with lines strung between the near ones
  (`WEB_REACH`, `WEB_EACH`) — [the chamber](2026-09-15-the-chamber.md)'s orbit printed
  small, on white. It is there so an index page still belongs to a site whose other
  pages are drawings. Under `prefers-reduced-motion` it is drawn once and left.
- **It arrives.** Switched to, the index does not simply appear: the readings come up,
  the plates fade in and the rows land one after another (`index-arriving`, put on by
  `index-page.js` when the view is unhidden and taken off again 1.8s later). A table that
  snaps into place reads as a document being swapped; this reads as one being laid out.
  Only the **first eighteen rows** are staggered (`tbody tr:nth-child(-n+18)` in
  `style.css`) — the sixty-fifth would otherwise arrive two seconds after the first.
- **Without the script the table is the same table**, in the order it is written in the
  page, and every row that is a link still is one. Nothing here is the only way to reach
  anything. Without `views.js` both views are simply on the page, one under the other.

## The dates are placeholders

The dates in the fragrances table are rolled from a seeded generator so they are the
same on every build and the sorting has something real to work on. They say nothing.
Changing one means changing it in two places on the row: the `data-date`, which is what
it sorts by, and the lettering, which is what is read.

## How to test it

```bash
npm test -- tests/index-pages.spec.js
```

Seven tests: the buttons being named Houses and Fragrances; one view being taken away
before the other arrives, watched every frame; the index's headings sorting by their own
column and turning round when pressed again; a row keeping its own number whatever the
table is sorted by; the field above searching it; the headings staying put while the
rows scroll under them; the whole index coming out on one screen however many rows are
in it; the table still being the table with its script blocked; and the researches —
the table being numbered, titled and dated, and the first research opening a page that
is really there.

## The Fragrances view, reworked

The owner asked for this view — and only this one — to be reworked: "minimalist, include
a table, and be stylized in accordance with the website". It shares `index-page.js` and
all of its markup with Researches, which is still the four-column drawing-office layout
it was written for, so **the rework is CSS scoped to `body.view-fragrances`** — the class
`views.js` already puts on the body. Nothing in it reaches Researches.

The shape: one centred column, one screen tall. A quiet band naming what you are looking
at, the field ruled across under it, and then the table, which is the whole point of the
view and is given the room to say so. The two plates and their line stand down here (they
are drawing-office furniture for the Researches layout, and both are placeholders); the
sorting note goes, because a heading says what it does by being pressed; the headings are
sticky, so what a column is never scrolls away.

**The page is still exactly one screen**, and that is a test. The column is a flex column
of `100svh` with the board and the scroll box each `flex: 1; min-height: 0`, so the table
takes up whatever is left over and the *page* never grows however many fragrances are
added. `min-height: 0` is the part that is easy to leave out and the reason a flex child
otherwise keeps its content's full height. Below 820px the page is allowed to grow and the
table comes out in full instead.

This view now stands on the contact sheet page's **dark** ground — see
[the contact sheet](2026-09-13-the-contact-sheet.md) — which it picks up for free, since
everything here is drawn in the page's own tokens.

The copyright line that stood under the board (*2026 © Your Name, All rights reserved*)
is gone, from this view and from Researches both: the owner asked for it off the site.

## The swipe between the two views

The owner asked for the change from one view to the other to be a swipe — *"all elements
apart from the top left menu — scent descriptions will move to the left, and be replaced
by the fragrances tab"* — and for it to happen **only after both views have been opened**.

So there are two ways across now, and which is used depends on where you have been:

| | |
|---|---|
| **the swap** | The first time a view is opened. The one being left fades away first and the other arrives after it has gone. Two things fading through each other in the same place is the one thing this must never look like. |
| **the swipe** | Once both have been opened at least once. Both are stood on top of one another, the one being left travels off one edge while the one arriving comes in from the other, exactly adjacent — never overlapping. |

**Why the wait is worth keeping**: a swipe says *these two things are side by side*, which
is only worth saying to somebody who knows what is on both sides. The first time, it would
be a flourish over a page you have not seen yet.

**The chrome does not travel**, and it is not a list of exceptions that does it. The Menu,
the category's name beside it, the two buttons and the search all live **outside**
`.views`, so sliding what is inside that box leaves every one of them where it is. If
something new ought to stay put during a swipe, put it outside the box.

Two things `swipe()` has to do and both are easy to miss: **hold the box's height** while
the two views are out of the flow (they are absolutely positioned, so the box would
otherwise collapse to nothing and the page would jump under the pointer), and **wait a
frame** after placing them before putting the travel on, or the browser has nothing to
transition from and both simply appear in their finished places.

`overflow: hidden` is on the box rather than the page: the arriving view starts a full
width off to one side, and without it that is a horizontal scrollbar for half a second.

Direction comes from the order of the buttons, not from a hard-coded side, so a third
view would slot in without touching it.

**The test for this was rewritten rather than dropped.** It used to say the two views may
never be on the page together; it now says the first switch swaps them one at a time, and
the second swipes with both on the page *but never overlapping* — measured as the overlap
between their two boxes, which is zero all the way across. That is a stronger statement of
the original rule, not a weaker one.

## Known issues / TODO

- **The dates in the Fragrances table are rolled from a seed** so that sorting has
  something to work on. They say nothing, and they are the owner's to replace — see "The
  dates are placeholders" above.
- The plates on both index pages are hatched placeholders; `images/Individual Fragrances/`
  and `images/Theories/` are empty but for their READMEs.
