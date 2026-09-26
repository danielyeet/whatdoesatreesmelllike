# The Fragrances, a whole-page table — and the crossing from the Houses

Date: 2026-09-25
Files touched: `fragrance-line.js` (new; rewritten twice the same day), `views.js`,
`style.css` (the `frag-*` rules, and `views-thread` and `.view.crossing` — the `stretch-*`
and `.view-stretch` rules are gone), `contact-sheet.js` (*The fragrances →* under the way
round),
`categories/scent-descriptions.html` (the script tag; rows 001–007 dated),
`archive/fragrances-view-2026-09-24.html` (new), `tests/fragrance-line.spec.js` (new),
`tests/index-pages.spec.js` and `tests/fragrance-reader.spec.js` (now run against the old
view — see below)

What changed: the Fragrances view of Scent descriptions is **a table that is nearly the whole
page** — number, name, house, date — with an **aside** on its left (the count, a few
readings, a scale and a small ring of specks) and, on its right, **three ways of showing it**:
a list, small boxes, or cards with each fragrance's picture. Nothing is drawn behind it.
Going there from the Houses is **the crossing**: the two views fade through each other a
little way to either side, a press while it runs turns it round at once, and the houses'
**axis travels across to become the table's divider**; each view carries a way to the other.
(For most of a day the axis was **stretched** into pixel streaks that gathered into the table's
rules; the owner asked for that gone.) The old view is kept, exactly, in the page and in `archive/`. **It was three
things in one day**: files travelling along a line through a double pyramid of specks (the
sections below), then a table standing over that line and pyramid (*evening*), then this
(*night*, the last section, which is what the page is now).

## The brief

> for SD fragrances, I want you to keep the current copy exactly as it is; and save it
> somewhere in the code. Do not overwrite it. At least not for now. And, i want you to create
> a new design for tha page; which takes inspiration from the houses page. I want there to be
> a central horizental line, which will go through the page, and there should be particles
> around this line, like a double pyramid attatched at the base (the two apices being at the
> top and bottom). this should have a dimension, so when you scroll, it changes in a given
> way. I want this to display the files of 001 and the name of the fragrance; and the house it
> came from when you hover it. I want the paage to react to scrolling, so new ones would
> appear. For this test, assume there are 20 fragrances. Additionally, add yesterdays date for
> the fragrances 001 to 007. I also want you to create a transition from the SD house page to
> the fragrances page. the transition should be that the line from houses will have a pixel
> stretch effect to theright side of the page, while everything else fades (except the
> particles). and then the page will scroll (so that the left side of the fragrances page has
> the same pixel stretch effect until the middle of the screen), which will then unstretch in
> the middle to form the new center line. Any stylistic changes that make the houses line
> different from the fragrances line should be made here, and then the rest of the page
> should load in to completion. It should be minimal and geometric.

## Why it is built this way

### The Houses view turned on its side

The Houses view is a vertical axis with a helix round it and the houses riding on it; this is
the same vocabulary laid across: **the line** is the axis's twin — a soft band of light, a
firm line, pulses running along it (rightwards), ticks every quarter of a file that travel as
you do, specks drifting along it — but drawn as **two hairlines** where the axis is one firm
line, and with a narrower light (16px against 22px). That difference is the "stylistic
change" the stretch turns one into the other through.

### The pyramid has dimension

A double pyramid in three dimensions: a square base lying in the line, one apex straight above
and one straight below, **tipped towards you** (`PY_PITCH`) so its base reads as a diamond. Its
twelve edges are drawn close in specks and its eight faces loosely (`EDGE_SPECKS`,
`FACE_SPECKS`), with a cloud of dust round it; a speck behind is drawn smaller and fainter. It
**turns a quarter turn for every file travelled** (`PY_TURN`) — "when you scroll, it changes in
a given way" — and very slowly on its own (`PY_SPIN`). Its current angle is on the stage as
`data-turn`, which is how the test reads it.

### Files, travelled along

Every fragrance is a `<button class="frag-file">`: its number large in the mono, its name
under it, and **the house it came from only while it is pointed at or focused**
(`.frag-file-house`). A sheet with one corner turned down, on the page's own ground. The one in
the middle (`is-front`) is the largest and stands inside the pyramid; the others go off along
the line either side, smaller (`SMALLER` a file) and fainter, and are gone past `SEEN`. As you
travel, files come in from the edge of the window on a small burst of specks — the owner's
"new ones would appear". Travelling is the wheel (`WHEEL`, snapping to a file when it stops),
a drag across (or down, on a phone), the arrow keys, Home and End, and the way along at the
foot (`← 004 / 020 →` with the name).

**Pressing the middle file opens its fragrance** — by pressing its row's link in the old
table, so `fragrance-reader.js` opens it exactly as it always has, in the page. Pressing any
other brings it to the middle. The line fades while the reader is up (`body.frag-open`) and
comes back after.

### Twenty, and which are real

The seven written are read off the old table, in its order (`data-no`). The thirteen after are
**placeholders** — numbered 008 to 020, *Untitled*, "Placeholder" where a house would be,
drawn dashed, opening nothing. `TEST_COUNT` is the one number to take out when real ones
arrive: new rows in the table become new files on their own.

### The old view is kept, and is still the page's

The owner asked for it kept "exactly as it is" and not overwritten. So nothing in the old
view was changed except what they asked for in the same breath (the dates): the table, its
header and search are all still in the page, and they are **what the line reads and what a
file presses**. The line is laid in front of it and the table hidden while it is
(`.view.line-on .index-page`). **Block `fragrance-line.js` and the page is the old view** —
its sorting, its search, the reader, and the old fade and swipe between the views. A copy of
that view's markup as it stood before any of this, character for character, is in
`archive/fragrances-view-2026-09-24.html`, with a note on what it needs to run.

### The dates

Rows 001 to 007 are dated **24.09.2026** (`data-date="2026-09-24"`), "yesterday's date" on the
day it was asked. The old view's archive copy carries the rolled dates it had.

## The stretch (views.js)

Four beats, each a number (`STRETCH_OUT_MS`, `STRETCH_TRAVEL_MS`, `STRETCH_GATHER_MS`,
`STRETCH_HAND_MS`), drawn on a canvas of its own over both views (`.view-stretch`):

1. **Stretch.** Everything on the Houses view but its particles fades (`.stretch-hide` —
   the houses, their labels, the numbers, the way round and the motifs; the canvas with the
   axis, the helix and the dust stays). The axis is smeared to the right as a column of pixels
   is when it is stretched: **a streak for every three pixels down it**, each with its own
   weight (mostly the axis's faint light, one in six one of its darker specks) and its own
   reach (a few well short), fading along its length.
2. **Travel.** The page travels a whole window left — the houses off one edge, the (still
   empty) fragrances in from the other, both pinned to the window as the swipe pins them — and
   the streaks travel with it, so they now run from the left edge to the middle of the window.
   The streaks reach exactly a window's width from the axis, which is the middle of the
   Fragrances view: "the left side of the fragrances page has the same pixel stretch effect
   until the middle of the screen".
3. **Gather.** There they unstretch: every streak comes in to the line's height and runs on
   to the right edge, thinning and fading, while the line in its own style (two hairlines, the
   narrower light) comes up where they meet.
4. **Arrive.** The streaks' last frame is the line; they fade over it as the line's own is
   drawn under them, and the rest of the view comes in: the pyramid, then the files from the
   middle out.

Going back is the same run backwards: the files and the way along fade (the pyramid and the
line stay — they are particles, and travel off with their view), the line spreads into its
streaks, the page travels right, the streaks draw back into the axis, and the houses come in
on it (`.stretch-in`).

**The views talk through the view's own attributes, not each other.** views.js puts
`data-arrive="wait"` on the Fragrances view while it stretches, which holds everything in
`fragrance-line.js` back; then `data-arrive="line"`, which says the line is already there so
only the pyramid and the files come in. It reads where the line is off the stage
(`data-line-y`) and where the axis is off the sheet's own box. Neither script knows the other.

**When it runs.** Every switch, both ways, the first included, whenever the Fragrances view
is the line — it replaces the first-time fade and the later swipe, which are still what the
page does when the view is the old table. **Not at all with motion turned off**: the views
simply change over, and the line is there whole.

## How to test it

```bash
npm test -- tests/fragrance-line.spec.js
```

- **`the Fragrances view is a line of twenty files, the first seven the owner's`** — twenty,
  numbered 001–020, the seven names in order, thirteen *Untitled* placeholders, the first in
  the middle of the window, the old table not on it.
- **`a file says the house it came from only while it is pointed at`**.
- **`the wheel travels along the line, new files come in, and the pyramid turns with it`** —
  009 is not on the window, and after the wheel it is; the pyramid turned a quarter turn a
  file; the way along says where you are.
- **`a double pyramid of specks stands on the line, its apices above and below`**.
- **`pressing a file brings it to the middle, and the middle one opens in the page`** — Haxan,
  in the reader, the address unchanged, the line gone while it is read and back after.
- **`the old Fragrances view is kept, in the archive and in the page`** — the archived
  section and the page's own are the same but for the dates; with the line's script blocked,
  the table is on the window.
- **`going to the Fragrances stretches the axis right, travels, and gathers into the line`** —
  read off the stretch's canvas every frame, in order: ink right of the middle and none left;
  then left and none right; then gathered into a few rows; the houses faded and their
  particles not; the files not in before the line; nothing left over the page; and back again.
- **`with motion turned off the views change over at once, the line whole`**.
- **`on a phone the line fits, and a drag travels along it`**.

`tests/index-pages.spec.js` and `tests/fragrance-reader.spec.js` block `fragrance-line.js`, so
they go on checking the old view — the table, its sorting and search, the fade and the swipe,
and the reader opened from a row — which is still in the page and still what the line uses.
The swipe tests there are unchanged and still pass on the old view.

## Known issues / TODO

(Of the first version. The placeholders and `TEST_COUNT` went in the evening; see the last
section for what is open now.)

- The sheet's own search is hidden on this view, as it was on the old one (which had its own).

## 2026-09-25, evening — a table on the line

> the design for the SD fragrances page is cool, but i want more particles, and make it
> more of a stylistic element than something that controls the page. it needs to fit more
> on the screen at once. I do essentially need it to be a list or a table or soemthing,
> because it will contain a large amount of fragrances. The pixel stretch should. the
> content of the table should be the same as before: 3 digit number, then name, then house,
> then date of writing (all of the fragrances at the moment should be yesterdays)

The files travelling along the line are gone (no `.frag-file`, no way along, no `TEST_COUNT`,
no wheel travelling the drawing), and so are the thirteen placeholders — the owner asked for
placeholders removed in the same message, and "the content of the table should be the same
as before". What the view is now:

- **A table** in a column in the middle of the window (`.frag-list`, 780px at most): the
  name *Fragrances* and the old view's line *The ones with no house here*, a search field
  with a count, and the rows — **number in three digits, name, house, date** — 34px each, so
  an ordinary window shows a dozen and more at once, scrolling in their own box so the page
  never does. The headings sort (pressed again, turned round; an empty value sorts last), the
  field searches number, name, house and date. The rows are built from the old table, and a
  row (anywhere on it) **opens its fragrance in the page** by pressing the old row's link, as
  before. Its cells are `frag-t-*`, because the reader already uses `frag-no`, `frag-name`
  and `frag-house` for its own heading — sharing them made every name 60px tall.
- **The line and the pyramid behind it, as decoration.** The pyramid is far wider than the
  table (`PY_WIDE` 0.42 of the window, up to 580px either side), so its base reaches out
  along the line past the table and it frames it; with **more particles** — 170 specks an
  edge, 260 a face, a cloud of 2,000 round it, 1,000 across the whole window drifting and
  twinkling, 600 along the line — thousands a frame, a little stronger than before. Where
  the table stands, all of it is drawn at `QUIET` (and eased in over `SOFT`), so the rows are
  never read through a drawing.
- **It takes nothing.** The wheel scrolls the table from anywhere on the view, over the
  drawing too. The pyramid still **has dimension**: it turns a quarter turn for every six
  rows the table is scrolled (`PY_TURN_ROWS`), and slowly on its own; the ticks on the line
  travel with the scroll; and pointing at a row sends a pulse out along the line either way.
- **The dates**: all seven are 24.09.2026, yesterday, as they were made this morning.
- **The stretch is unchanged** — it still gathers into the line, and then the pyramid and the
  table come in (`rows-in`, the rows one after another).

Tested in `tests/fragrance-line.spec.js`, which was rewritten for the table:

- `the Fragrances view is a table: number, name, house and date, all seven dated yesterday`
  — the headings, the seven rows exactly, the count, the old table not on the window.
- `a screen holds a good many rows, and the table scrolls in its own box` — with sixty more
  rows written into the page for the test (`withMany`, a rewritten response): a row 38px or
  less, twelve or more whole rows in the box at 1280 × 720, the box scrolling and the page
  not.
- `the wheel scrolls the table from anywhere, and the pyramid turns with it` — the wheel over
  the drawing, well to the side of the table, scrolls the table, and the pyramid turns about
  as far as the rows scrolled say.
- `the headings sort the table and the field searches it`.
- `a double pyramid of specks stands on the line either side of the table` — thousands lit,
  and the base reaching out along the line past the table's column.
- `pressing a row opens its fragrance in the page`.
- The old view kept, the stretch (now waiting for the table rather than the files), motion
  turned off, and a phone (all four columns on the window, nothing sideways) — kept.

## 2026-09-25, night — a whole-page table, three views

> okay, the thing in the back is downright ugly; lets change tht entirely. I want you to
> remove the horizontal line, remove the pyramid thing, and make it an almost whole page
> table, with some space and stylisting elements on the left. I want you to be able to
> scroll, and change the view of the table so it is either as currently, or into small boxes
> or into cards. These options should be on the right of the table.

Asked what the left should carry, the owner chose **readings, a scale and a small mark**.

### What was taken out

**The line and the pyramid, and every speck of both**: the canvas behind the table
(`.frag-line-field`), the band, the hairlines, the pulses, the ticks, the drift, the field,
the pyramid's edges, faces and dust, `quiet()`, `project()`, the turn with the scroll and
`data-turn`, and `data-line-y`. Not dialled down — gone, as the owner's removals always are.
The page's own squared paper is the whole of the ground. The class names went with them:
`.frag-line` is **`.frag-stage`**, `.view.line-on` is **`.view.table-on`**, and
`data-arrive="line"` is **`"ruled"`**. The file keeps its name, as `contact-sheet.js` keeps
its own.

### Three columns

A fixed stage below the chrome, `232px | 1fr | 64px` with a gap that grows with the window,
so at 1440 the table is about 960px wide — two thirds of the window:

- **The aside** (`.frag-aside`), on the left: *Fragrances* and the old view's line under it;
  **the count** large in the mono (`007`, *written up*); **the readings** (`.frag-readings`) —
  how many houses the fragrances came from, the date last written, what the table is sorted
  by and which way, and how it is shown — all worked out from the rows, never written;
  **the scale** (`.frag-scale`), a hairline with one tick for every fragrance shown, in the
  order shown, filled as far down the table as has been seen and the ticks of the rows in
  view inked (the rank of the house pages, in plain ink), the first and last numbers at its
  ends; and **the mark** (`.frag-mark`), a small ring of specks turning slowly with lines
  strung between the near ones — the index page's mark — and **one larger speck for every
  fragrance** round it, of which the one being pointed at is boxed and joined to the centre.
  The mark is the only thing on the view that moves, and it runs only while the view is on
  the page; it is hidden on a window under 720px tall, where the aside has no room.
- **The table** (`.frag-main`): the search and its count over it, then a box
  (`.frag-list-scroll`) that runs to the foot of the window, fading out into it, in which the
  sort bar sticks to the top and the items scroll. **The wheel scrolls it from anywhere on the
  view** (the aside and the options too); the page itself never scrolls.
- **The options** (`.frag-options`), on the right: *View*, and three square buttons — **List**
  (three rules), **Boxes** (four small squares), **Cards** (two tall cards) — drawn in CSS,
  with `aria-pressed`, the one in use inked solid.

### One set of items, three layouts

Every fragrance is one `<li class="frag-item">` with its number, name (a real link, so a
press meant for a new tab still works), house, date and a picture slot; **the layout is a
class on the stage** and the stylesheet does the rest:

- **`is-list`** — as it was: a ruled row each, 34px, the four columns under the sort bar's.
- **`is-boxes`** — squares, `minmax(148px, 1fr)` to a row: the number top left, the house small
  top right, the name at the foot and the date under it.
- **`is-cards`** — `minmax(230px, 1fr)`: the fragrance's **picture** over its number, date,
  name and house. The pictures are fetched from the page the fragrances live on
  (`individual-fragrances.html`) the first time Cards is chosen, so the list never pays for
  them: each part's first `.human-plate img`. A picture that is not there yet leaves the
  hatching with the number large on it, as every house page does — which is six of the seven
  today; Haxan's is the one that shows.

The sort bar is the same four buttons in all three: columns in the list, and a line of words
(*Sort — No. · Fragrance · House · Date*) over the boxes and cards. Sorting and searching are
as before and move the same items, whatever they look like. **Changing layout** fades the items
out, lays them out again, and brings them back one after another (`switching`, `--i`); with
motion turned off it simply changes. **The choice is kept** for the next visit, in this browser
only (`localStorage`, `taste-of-aldehydes:fragrances-view`, wrapped so that a browser without
storage just gets the list).

### The stretch lands on the table's rules

The stretch from the Houses used to gather into the line. With the line gone it gathers into
**the table's ruling**: the stage publishes `data-rules` — the rule under the sort bar and the
line under every row in the window (a box's or a card's top and foot, in the other two), and
the box's left and right (`data-rule-l`, `data-rule-r`), measured against the stage itself so
the view's travel does not move them — and views.js takes the streaks **in order** to those
heights, pulling them in to the table's width, so the top of the stretched column becomes the
top rule and its foot the last. The rules are measured when the view is shown, on a change of
layout, a sort, a search and a resize; views.js reads them the first time its streaks gather.
Then `data-arrive="ruled"`: **the rows' own rules stand at once** (`.ruled`) and only what is
written in them comes in, one after another. Opened any other way, the aside and the sort bar's
rule come in first (`.here`), and then the items.

**One thing this found**: the stretch's canvas was drawn at the window's width but stands in a
box a scrollbar's width narrower (the page keeps `scrollbar-gutter: stable`), so everything on
it was squeezed by about 1%. It never showed while the streaks became a line across the whole
window; landing on the table's own rules it put them 13px short. The canvas is sized by its own
box now.

### How to test it

```bash
npm test -- tests/fragrance-line.spec.js
```

- `the Fragrances view is a table: number, name, house and date, all seven dated yesterday`.
- `nothing is drawn behind the table: no line, no pyramid` — no `.frag-line`, no `data-turn`
  or `data-line-y`, and the only canvas on the view is the mark, small, in the aside.
- `the table is nearly the page, with the aside on its left and the options on its right` — at
  1440 × 900: the table over 55% of the window, the aside wholly left of it, the options wholly
  right; the count, the houses and the last date; seven ticks; the mark; the three options,
  List pressed.
- `a screen holds a good many rows, and the table scrolls in its own box` — 67 rows (sixty
  written into the page for the test), fourteen or more whole ones on a 1280 × 720 window.
- `the wheel scrolls the table from anywhere, and the scale fills with it` — the wheel over the
  aside.
- `the options show the table as a list, as small boxes or as cards` — four or more square boxes
  to a row; fewer cards; Haxan's photograph loaded and CV99's hatching with `001`; back to
  rows of 38px or less.
- `the way of showing the table is kept for the next visit`.
- `the headings sort the table and the field searches it, in any of the three` — the reading
  says *Fragrance ↑*, and a search leaves one tick on the scale.
- `pressing a row or a card opens its fragrance in the page`.
- `the old Fragrances view is kept, in the archive and in the page`.
- `going to the Fragrances stretches the axis right, travels, and gathers into the table's
  rules` — read off the stretch's canvas every frame: right, then left, then more than 90% of
  its ink within 3px of a published rule and inside the table's width; the table held back
  until it has gathered; eight rules (the sort bar and seven rows); and back again.
- `with motion turned off the views change over at once, the table whole` — and a layout
  changes at once too.
- `on a phone the table fits the window, with the options beside its name` — below 700px the
  aside is only the name and its line, the three options stand at the right of it as icons,
  a row's four cells are on the window, and the boxes still come several to a row.

### Known issues / TODO

- ~~Six of the seven cards show the hatching~~ — every fragrance has its picture since the
  owner's upload of 2026-09-25, and the boxes carry them too since 2026-09-26 (below).
- The mark is hidden on windows under 720px tall rather than squeezed.

## 2026-09-25, later that night — the crossing

The owner: *"change the transition too please, so that the pixel stretch is not used. I want
something simple, so that you can freely change between the houses and fragrances page. Make
the two pages connected somehow too."* Three words in that, and each is one thing in the code.

**Simple.** `stretch()` is gone from `views.js`, with its canvas (`.view-stretch`), its streaks,
the page travelling a window, and every rule it hung off in the stylesheet — and from
`fragrance-line.js`, the table's side of it: `data-rules`, `data-rule-l`/`-r`, the `waiting`
and `ruled` states. What is there instead is `cross()`: the view being left fades out while
drifting `CROSS_SHIFT` (26px) the way it is going, and the one coming fades in from the other
side, **both at once**, in `CROSS_MS` (380ms). Nothing is held back, nothing waits a beat. The
table is there whole the moment it is shown (`data-arrive="now"` → `arrive(true)`, which puts
`.instant` on the stage for two frames so none of its own arrivals run a second time) — the
crossing *is* its arrival.

**Free.** A press while the crossing is running is **taken at once**: the crossing turns round
from wherever it has got to (both views are still pinned, and their transitions simply reverse),
where the old fade and swipe remembered the press and took it afterwards. Press as fast as you
like and it lands where the last press was, with nothing left half done. The first time you go
to a view is the same as every other time — the rule that the swipe waited until both had been
opened belonged to the swipe, and the swipe is only used now when `fragrance-line.js` is not
there (the old table, which two spec files run against on purpose).

**Connected**, in two ways:

- **The line.** `views.js` puts one hairline on the page (`.views-thread`, the height of the
  window) where the houses' axis stands, and as the views cross it **travels to where the
  table's divider stands** — a hairline between the aside and the table (`.frag-divider`, placed
  by `measure()`, its x published as `data-divider` on the stage) — and back. The axis becomes
  the divider: the two pages are one line apart. On a phone, where the aside is a head over the
  table and there is no divider, the line goes as it travels. It is **set down on the axis at once**
  (it stands over the axis, so nothing shows) and only then travels: it used to fade up as it
  set off, and the first full run caught it being first seen 89px across on a loaded machine.
- **A way to the other from inside each.** `← The houses` at the foot of the aside, and
  `The fragrances →` under the way round on the Houses view. Anything carrying
  `data-view-go="houses"` or `"fragrances"` is taken by `views.js` as a press of that button;
  both are hidden below 700px, where the two words across the top are right there.

**One trap it walked into**: the line was first put on the `<body>`, which put it under the
Menu's dimming rule (`body > *:not(...)` — the one the notes window fell into), whose `opacity
0.85s` outranked its own transitions; it never showed at all. It lives in the views' box instead
(`.views`), which never moves itself, so it is still fixed to the window.

### How to test it

```bash
npm test -- tests/fragrance-line.spec.js
```

- `going to the Fragrances is a quick crossing, and the axis travels across to be the table's
  divider` — no stretch canvas is ever made; the two views are both partly there for several
  frames; the Houses view is gone inside 700ms; the line is seen leaving from within 80px of the
  axis and landing within 3px of the published divider, which stands between the aside and the
  table.
- `the views can be gone between freely, and each carries the way to the other` — four presses
  in 300ms land on the last one, inside 900ms, with nothing left pinned; then *The fragrances →*
  and *← The houses* each go over.
- The stretch's own test is gone with it.

### Known issues / TODO

- The line is ink at 30% on the Houses view's white; if the Houses view ever turns dark, it
  wants its token.


## 2026-09-25, last — the line goes all the way home, and the aside is headed Individual

> Also, when going in SD from fragrances to houses, i want the line that moves to go
> completely where the center line is in houses (and then disappears exactly in the middle
> of the page) remove the text "The ones with no house here" and add "Individual" above the
> word fragrances (make it smaller than the actual word "fragrances")

**All the way to the axis.** Coming back from the table, the line was landing some twenty-six
pixels short of the axis. `anchorOf("houses")` read where the axis stood at the moment of the
press — and at that moment the Houses view is itself still drifting in from the side
(`CROSS_SHIFT`), so what it read was the axis displaced by the view's own transform. It now
takes that transform off (the view's `m41`) and so aims at where the axis will stand at rest,
which is the middle of the page — the middle of the body, which on a window that keeps room
for a scrollbar is a few pixels left of the window's own. The line lands there and fades where
it lands, so it goes exactly where the axis is.

**Individual / Fragrances.** The line under the aside's name, *The ones with no house here* —
read off the old view's head (`.index-col`) — is gone from the aside (`.frag-aside-say` and the
code that filled it), and over the name there is now a smaller word, **Individual**
(`.frag-aside-kicker`: 14–17px against the name's 30-odd, in `--muted`, 13px on a phone), so it
reads *Individual Fragrances* as the page it opens into is called. The old view underneath is
untouched and still says *The ones with no house here* in its own head — the archive test holds
it to the copy in `archive/`.

### How to test it

- **`coming back, the line travels all the way to the axis in the middle of the page, and goes
  there`** — from the table, the Houses pressed; the last place the line is seen within 3px of
  the axis as it stands once the houses have settled, the axis within 3px of the middle of the
  body, and the line gone afterwards. Fails against the old aim by about 26px.
- **`the aside is headed Individual, smaller, over Fragrances, and says nothing else under
  them`** — *Individual* above *Fragrances* and under 0.6 of its size; no `.frag-aside-say`, and
  the aside nowhere saying *The ones with no house here*.


## 2026-09-26 — the whole bottle, over a blur of itself, in the boxes and the cards

(**Replaced the same night** — the owner wanted no blur and no ground at all; see *2026-09-26,
later* below. This section is kept for the reasoning.)

> add a blurred version of the pictures in the boxes view of teh SD houses ... ALSO FOR THE SD
> FRAGRANCES PAGE, MAKE IT SO THAT THE PICTURES IN THE CARDS AND IN THE BOXES MENU ARE ZOOMED
> OUT AND YOU CAN SEE THE ENTIRE FRAGRANCE! i want the aeshtetic to be good, not just
> something thats random.

"The boxes view of the SD houses" is read as the **Boxes** layout of this view — the Houses view
has no boxes — and both notes as one: the boxes and the cards each show their fragrance's
picture **whole**, over a **blurred copy of the same picture** filling the rest of the frame.

**The boxes carry pictures now.** `pictures()` runs the first time Boxes *or* Cards is chosen
(it was Cards only), and each picture is two images of the one file: `.frag-t-haze` —
`object-fit: cover`, scaled 1.4, blurred 18px and a touch more saturated — and over it
`.frag-t-shot`, **`object-fit: contain`**, so the bottle is never cropped. In a box the picture
fills the whole square behind the lettering (`inset: 0`), the bottle standing between the
number at the top and the name at the foot (the shot's inset is `31px 14px 66px`), with a white
veil at the head and the foot (`::after`) so the lettering is read on paper; the large number
the hatching carries is hidden in the boxes, where the box's own number already stands. In a
card the bottle stands in 84% × 86% of the picture's frame, on white.

**Two kinds of picture, so it does not look random.** Most of these are studio shots — a bottle
on white — and a sharp white rectangle floating on its own blur is exactly the random look to
avoid. So each picture is read once it has loaded (`seat` in `fragrance-line.js`): drawn to a
24 × 24 canvas and its corners and edge midpoints read, and six of the eight near white and
colourless makes it **a studio shot** (`.is-studio`): its blur is hidden and the picture is
**multiplied** onto the frame's own white, so the white ground disappears and the bottle stands
on the paper by itself. **A scene** (`.is-scene`) — Haxan on bark, a bottle on flowers — keeps
its blur, and the picture is sized to its own shape (`--shape`, width over height, used through
container units, `container-type: size` on the frame) and **feathered** into the blur at its
edges with a mask, so no hard edge is left either. The favourites' circles on the Favourites
page are read the same way ([the chamber](2026-09-15-the-chamber.md)).

**On a phone** the boxes come two to a row (`minmax(150px, 1fr)`), so the bottle in each is
still a bottle and not a speck.

### How to test it

- **`boxes and cards show each fragrance whole, over a blurred copy of its picture`** — in the
  boxes and then the cards: five or more pictures arrive and are read as studio or scene; each
  one's blur is the same file and blurred; the picture is `contain` and stands inside its own
  box; a scene has its blur showing round it; Haxan is a scene.
- `the options show the table as a list, as small boxes or as cards` looks for Haxan's picture
  as `.frag-t-shot` now that each frame holds two images.


## 2026-09-26, later — the picture itself, filling its frame, placed on the bottle

> So, for the SD PAGE for fragrances, i dont want any background ti be visible, just make the
> image itself fit into the box. Ideally make the fragrance fit, but with stuff like flamenco or
> haxan, no need. The point is simply for the fragrance to be visible.

**Nothing behind a picture any more.** The blurred copy (`.frag-t-haze`), the studio shot
multiplied onto white, the scene feathered into its blur, the container units and `--shape` —
all of it is out of the code. Each frame holds one picture, `.frag-t-shot`, which **fills the
frame edge to edge** — or, on a clean white or black ground, runs on into a frame of that same
colour (below).

**Placed on the bottle** (`seat`, `readPicture`, `placeIn` in `fragrance-line.js`). Each picture
is read once it has loaded, off a copy 72 pixels on its longer side:

- **Its ground** — the middle colour of its own edge — and whether that ground is **clean**:
  nearly every speck of the edge within a hair of it, as with a bottle on pure white or pure
  black.
- **Any border printed into it** — a strip of pure white or black down an edge, a mat round a
  photograph whose own ground is another colour. It is trimmed off before anything else, with one
  speck more, since a small copy blurs its edge (`inner`). Velvet Fog carries one down each side:
  255 against its own 245, and it showed as a white mat in its box until it was trimmed. A clean
  ground is never mistaken for a border, because clean is judged first.
- **Where its bottle is** — only **on a plain ground**, where its edge is nearly all one colour.
  There the bottle's *extent* is every speck that is not the ground, faint glass included on a
  clean ground. The *middle of its weight* is weighed by the square of each speck's distance from
  the ground, so a black cap and amber glass count for far more than Tobacolor's pale marble
  stand. **A scene** (Haxan in its bark, De Profundis in its flowers, Flamenco among its
  raspberries, French Riviera on its rocks) has no bottle found in it. Looking for where it is
  sharpest was tried and followed the bark and the petals, so a scene is simply filled and
  centred, which is where its photographer put the bottle.

Then **the picture, inside any border, is made just large enough to cover the frame**, **brought
closer** where the bottle is small in a large ground until its larger side fills `FILL` (80%) of
the frame (never more than `CLOSEST`, 2.4, times closer), and **moved so the bottle is in the
middle** as far as the picture's own edges allow. It centres on the middle of the whole bottle
where all of it fits, and on the middle of its weight where it does not, so the cap and the glass
stay in rather than the stand.

**On a clean ground it may also be drawn back** until the whole bottle fits, never further than
the whole picture. **The frame then takes the ground's own colour**, so the picture's white runs
on into the frame's white with no edge to see. That is how CV99, whose bottle fills its picture
from top to bottom and could not fit an upright card otherwise, now stands whole, and House of
Ellixirz with it. A bottle small on black (the favourites' Tombstone pair) is brought closer
instead. This is the owner's *"Ideally make the fragrance fit, but with stuff like flamenco or
haxan, no need"*: the ones on a plain ground fit, and the scenes are filled.

The place is written for **both** layouts at once as custom properties (`--b-w/h/x/y` for the
boxes' square, `--c-*` for the cards' upright frame), so changing layout needs nothing reworked.
The bottle found stays on the frame as `data-subject`; a clean ground as its inline
`background-color`.

**The boxes and the cards took new shapes for it.** A **box** is now its picture, square, over a
small label on the paper — number and house, name, date — where it was a square with the
picture blurred behind the lettering; a picture behind lettering is a picture half covered. A
**card**'s picture is **upright** (4 : 5, from 4 : 3), because nearly all of these bottles are
photographed standing, and an upright frame keeps the most of each one in it. Until a picture
arrives each frame is the hatching with the number on it, in the boxes too now. **On a phone**
the boxes come three to a row again, since a square picture still shows its bottle small.

### How to test it

- **`boxes and cards fill each frame with the picture itself, placed on the bottle`** — in the
  boxes and then the cards, every picture arrives and is placed; each frame holds exactly one
  picture with no filter, blend or mask; it covers its frame, or its clean ground is the frame's
  colour; the frame is the layout's shape (square, or 4 : 5); where a bottle was found its middle
  is in the frame and towards the middle of it. Tobacolor's bottle is found, and all of it, cap to
  base, is in its frame in both layouts. That is measured against where the bottle stands in the
  picture as read by eye, not by the script under test, and it fits the square only if the bottle
  is placed on its weight rather than its stand. CV99's frame is its picture's own white.
- `the options show the table as a list, as small boxes or as cards` asks for a box's picture to
  be square now, rather than the box.
