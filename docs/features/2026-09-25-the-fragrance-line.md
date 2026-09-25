# The Fragrances, along a line — and the stretch from the Houses

Date: 2026-09-25
Files touched: `fragrance-line.js` (new), `views.js`, `style.css` (the `frag-line-*`,
`frag-file*`, `stretch-*` and `.view-stretch` rules), `categories/scent-descriptions.html`
(the script tag; rows 001–007 dated), `archive/fragrances-view-2026-09-24.html` (new),
`tests/fragrance-line.spec.js` (new), `tests/index-pages.spec.js` and
`tests/fragrance-reader.spec.js` (now run against the old view — see below)

What changed: the Fragrances view of Scent descriptions is a **horizontal line** through the
window with a **double pyramid** of specks standing on it, and the fragrances are **files**
along the line — 001 and the name, the house on hover — travelled along by the wheel, a drag,
the keys and a way along at the foot; the one in the middle opens its fragrance in the page.
Twenty stand on it, seven real and thirteen placeholders, because the owner asked the test to
assume twenty. Going there from the Houses, the houses' **axis is stretched** into this line.
The old view is kept, exactly, in the page and in `archive/`.

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

- **The thirteen placeholders are for the test** the owner asked for; set `TEST_COUNT` to 0
  (or take it out) when the real fragrances are in.
- The sheet's own search is hidden on this view, as it was on the old one (which had its own).
- Pressing the middle file of a placeholder does nothing — there is nothing to open.
