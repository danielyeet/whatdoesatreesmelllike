# The site on a phone

Date: 2026-09-21

Files touched: `node-scene.js`, `structure.js`, `chamber.js`, `contact-sheet.js`,
`almost-human.js`, `pineward.js`, `adar.js`, `essay.js`, `index-page.js`, `paper.js`,
`find-ground.js`, `style.css`, `tests/mobile.spec.js` — and in the second round
`works/almost-human.html` as well.

**There are two rounds in this report.** The first made the site *run* on a phone. The
second, below under "The second pass", is the owner going through it on their own phone
and photographing what was actually wrong with how it *looked* — six things, all of them
something printed over something else.

## What changed

The owner asked for the site to work on a phone **"without changing its desktop
version"** — which is the standing rule for everything here. Three things were actually
wrong, and each was measured before and after, both ways:

1. **Two pages were unusably slow.** On a phone's pixels with its processor throttled to a
   quarter, the theories page ran at **12 frames a second** and the landing page's map at
   **19**. They run at 40 and 37 now, and nothing on the site is below 37.
2. **The contact sheet could be dragged sideways.** One line of lettering, hanging off a
   picture near the right-hand edge, made the document 415px wide on a 390px screen.
3. **Almost Human's whole ground was invisible.** The crowd and the rain — and the rays,
   which the owner has since asked to have taken off that page — were all being drawn at a
   twentieth of their ink on any window narrower than the writing's own column, which is
   every phone. The drawing was there, and you could not see it.

And one thing was missing rather than wrong: **a tap did nothing**. Dragging a finger
across a house page worked, because a drag sends `pointermove`; a tap sends `pointerdown`
and the three house drawings were not listening for it.

## A phone draws at a lower ratio

Every canvas on the site was already capped at two device pixels to one CSS pixel, which
on a desktop is right. On a phone at three, two is still a million-odd pixels to fill
sixty times a second on a fraction of the power.

**Narrow windows get 1.5**, which is a little over half the fill and no difference anybody
can see at that size. Eleven files, the same one-line rule in each, and **nothing above
700px changes at all**. The 3D map is the one that needed it most — every fragment there
goes through a shader, so the fill is the whole cost.

That alone took the map from 19 to 37 and the chamber from 31 to 43.

## The theories page: the grain is skipped

The ratio took the structure from 12 to 19, which was still not enough. The rest of it was
one line: **a repeating grain pattern painted over the whole canvas on every frame**. It
is the most expensive thing that drawing does and the one thing nobody can see at a
phone's size. Skipped below 700px, it runs at 41.

The vignette stays. It is a gradient made once in `resize` rather than per frame, and it
is what gives the frame its depth.

## `lit()` had no floor

Almost Human takes the writing's own column out of its drawing, so the crowd stands in the
margins and goes quiet over the reading. It worked that out as *the room left either side
of a 940px column* — and on a 390px window that is none, so the quiet band covered the
whole page and the entire drawing came out at a twentieth.

Below the column the band is **a quarter of each side** now, which is where the figures are
put (`EDGE`) when there is no margin to put them in, and the soft edge comes in with it or
the fade is most of the page.

**It is a ternary rather than a `Math.max`, and that matters.** Taking the wider of the two
would have moved the quiet band on a desktop as well — at 1280 across, a quarter of each
side is 333px where the margin is 170 — and a wide window is not what is being fixed. The
first go used `Math.max` and the desktop test for the crowd coming home caught it.

ADAR was already safe: its own `lit()` is a share of the window rather than a measure
against the column. Pineward has no `lit()` at all.

## A tap counts as the hand arriving

`pointerdown` alongside `pointermove` on the three house pages, same handler, same numbers
— a mouse simply sets the same place twice. Without it a touch on a figure did nothing at
all, which on a phone is the only way anybody would try.

## The line that hung off the page

The say — the line about a house on the contact sheet — is taken out of the flow, but it
still counts towards how wide the **document** is. A line 220px long hanging off a picture
near the right edge pushed the whole page sideways: a horizontal scrollbar on a page with
nothing to the right of it.

Below 700px it is held to the picture's own width and allowed to wrap. On a wide window it
stays one line, which is the whole point of it.

## The second pass

The owner read the site on their own phone and sent four photographs. Every one of them was
the same kind of fault in a different place — **something printed over something else** —
and none of it was anything the first round measured, because the first round measured
whether the drawings ran and whether the page could be dragged sideways. It could not see a
word standing inside a paragraph.

A **fifth photograph** came after the rest of the round had landed, and it is the one fault
here that is not something printed over something else: the theories card's calculator
button standing away from the line it belongs to. It is written up with the others below,
under "The calculator button hung off the right of its card".

**Every fix in this round is held below 700px, and it was checked rather than assumed** —
see "Nothing above 700px moved" at the end of this section, which is the measurement and
the four places where holding to the rule costs something.

### The chrome needed a ground of its own

`Menu` is fixed to the top left of the window and the page travels underneath it. On a wide
window there is nothing up there to travel past; on a phone the writing reaches the top
corner, and the owner photographed the word printed straight through a paragraph,
unreadable.

So below 700px the word gets **a box no bigger than itself, blurring what is behind it**.
Two things about how:

- **The ground is the page's own**, not a colour picked for the box. `--chrome-ground` is
  the paper on a light page and near-black on the five drawn on a dark one, so the box is
  never a patch of the wrong colour on a page it does not belong to.
- **The word itself does not move**: the padding is taken back out of `left`, so the
  lettering stands where it stood. Nothing above 700px has a box at all.

**And it goes when the menu is open**, because the word stands on the overlay's own black
there and is lettered light — a pale box under it would hide it rather than help.

The same box went on three more things that are fixed to the window while the page travels
under them: the contact sheet's two view buttons and its search, and the readings in the
corner of the three house pages (`00 / 47 · INTRODUCTION`, which was printed through the
introduction).

### The sheet was drawn over its own chrome

Giving the buttons a ground was not enough on the contact sheet, because a picture there
carries a `z-index` worked out from how far back it stands — 1000 at the front of the
volume — and the chrome stands at 30. The nearest pictures were being drawn straight over
the buttons, box and all, and `Houses` was printed inside a photograph. Below 700px the
chrome is raised above them. On a wide window the sheet never passes under it and nothing
here applies.

### And the sheet was drawn over itself

The grid the pictures are placed on cannot overlap: each one is inside its own square and
the room its caption needs is counted into the row. **The depth can.** A picture standing
far back is drawn smaller and nearer the vanishing point, and on a sheet two columns wide —
which is what a phone gets — that pull is most of a column, so a deep picture from a low row
lands on top of a shallow one from a high one. Measured: **five pairs of pictures printed
over each other at 390px, none at 1280**.

A picture that would land on one already placed is **stood nearer**, a step at a time, until
it is clear. At depth nought it is back in its own square where nothing can reach it, so it
always finishes. What counts as a clash is a real overlap rather than a touch (`TOUCH`),
so a pair whose edges meet by a pixel is left alone: they are side by side.

**It runs on a phone and nowhere else** (`tighten`), and the reason is in "Nothing above
700px moved" below — the pass is invisible at every ordinary desktop size, but not quite
everywhere, so it is held to the rule rather than to where it happens to be harmless.

### A station wrote its name off the side of the screen

The owner: *"The architecture if sunscreen is not fully on screen on the phone version"*.
Two separate faults, and both are fixed:

- **The lettering.** A station's name hangs off the bottom left corner of its bracket and
  does not wrap, so a station out to the right writes its name off the edge. It is slid back
  along by exactly how far it is over, and never the other way. Its width is measured once
  and thrown away on a resize or when the webfont lands — reading `offsetWidth` in a frame
  forces the browser to lay the page out again, and that runs sixty times a second. It is
  the **name** that is measured, not the whole say: the line under it is only read on a
  hover and is much the longest of the three, and sliding by that put the name off the
  *other* side of the window. That was the first go, and the screenshot of it reads
  "of Sunscreen". Asking the name its width needs each line of the say to be its own width
  rather than the widest of them (`width: max-content`), and **that rule and the shift are
  in the same 700px block on purpose**: apart, the shift would be measured against a number
  the page was not using, which is a worse fault than the one being fixed.
- **The station itself.** It is placed at a fixed distance from the middle of the frame in
  the frame's own units, and how much of the window that is depends on the lens — which is
  taken off the *shorter* side. On a wide window a station comes out where it was drawn to;
  on a window taller than it is wide the same station is thrown half off the edge. They are
  drawn in towards the middle by however much narrower this window's view is than a wide
  one's (`pull`), as a **shift rather than a squeeze**, so a constellation is never drawn
  narrower than it was built. **Below 700px only** (`SIDE_NARROW`): by the measure alone it
  would be worth having on anything squarer than about 3:2, and a 1100 × 1000 window throws
  a station off the edge for exactly the same reason a phone does — but that is a desktop
  window, and desktop windows do not move.

### The calculator button hung off the right of its card

The owner, of the same page: *"move the open calcilator button to be under the other
button on the phone app"*.

A station whose row carries `data-calc` gets a second way in at the foot of its card, boxed
where `OPEN →` is bare, and it is put at the **right-hand end** of the card by
`margin-left: auto`. On a wide window the card is 360px and the box stands under the end of
the line above it, which is what "a second way in, over to the right" is meant to look
like. On a phone the card is 84vw — 327px on a 390px screen — and the same box is
left with 225px of nothing between it and the words above, so it reads as belonging to the
edge of the window rather than to the line it follows.

Below 700px the `auto` goes and the box comes back to the left, so the two ways in stand one
directly under the other. It is `margin-left` on its own rather than the whole shorthand,
so the 18px the box gives the foot of the card is untouched. Measured at 701, 760, 1280,
1440 and 1920: the box is still flush to the card's right edge at every one of them.

### A table wrote one column through the next

On the Explorations & Researches index a cell is `max-width: 0` with an ellipsis, so a long
name is cut rather than allowed to widen the table. The **anchor inside it** is a block of
its own, and a block inside a clipped cell simply overflows it — so the rows that had a page
behind them printed their name straight through the column beside it, and the rows that did
not ellipsised properly. The owner photographed `Resins` written over `RESEARCH`. The link
is clamped the same way the cell is.

And the three readings either side of the name are set to a width each, which on a 390px
screen is three quarters of the table — eighty pixels to name a fragrance in. They are
smaller and tighter below 700px, and the name gets what they give up.

### Pineward had no wood at all

The wood stands in the two strips between the reading gutter and the writing's column. On a
phone the writing takes the whole width, so both strips come out narrower than a tree and
**this page had no wood on it whatever** below about a thousand pixels across.

The owner asked for one of the trees on the phone too and marked where: the top right of
the head, in the clear band above the piece's own kicker. **Below 700px** (`ONE_WIDEST`)
one tree stands there — grown by the same `treeAt`, blooming under the hand like any other
(measured: 2,727 pixels of ink at rest, 4,945 under the pointer, 2,728 when it goes). The
page is asked where its writing starts rather than told, and the tree's lowest branches have
to droop clear of it or it is not drawn.

The strips actually run out at about a thousand pixels across, so between 700 and there this
page still has no wood on it and would be better with one. That is the rule costing
something, knowingly.

Two of the wood's own rules are turned off for it, and for a reason: **quietening across the
middle of the page** exists to keep the wood off the writing, and a tree in an empty band has
no writing beside it; and the **fade at the window's top edge** exists so a tree straddling
the edge is not seen sliced, which at `EDGE_FADE`'s 130px would have half-drawn a tree
standing exactly where it was asked to stand. `ONE_FADE` is 70.

### The chamber jumped when a chapter was opened

*"there is a tiny jump of the page. Asides from that its perfect, so just fix the little
jump."* It was 185 pixels, in one frame, and it was one word of CSS.

`transition` is a single property. `.favorites-page.bursting .chamber-plate` wrote a new one
for the fade, which **replaced** the `transform` transition the plate carries — and the
plate's transform is what `--menu-lift` rides on, how far it stands above the middle so the
word and the menu are centred together. Opening a chapter closes the menu, which writes a new
lift on the same frame that class lands, so with the transform transition gone the plate
snapped down the whole height of the menu, in full view, before any of the burst had begun.
Both transitions are named there now. Measured: the one-frame jump of 185px is gone and the
largest step in the same stretch is 3px, which is the ease.

### Nothing above 700px moved, and here is how that was checked

The owner asked for it directly — *"Make sure that the changes to the mobile site
presentation do not affect the desktop version"* — so it was **measured rather than
reasoned about**. A git worktree of the commit before this round was served on one port and
the working tree on another, and every page on the site was opened on both at
**1280 × 800, 1440 × 900, 1920 × 1080, 1100 × 1000, 760 × 900 and 701 × 900**. For each
page the check compares, element by element in document order: the tag, the classes, the
box, the opacity, the z-index, the background, the backdrop-filter and the transform, plus
the document's own size and any page errors.

**Every page reads `same` at every one of those sizes**, with one exception:
`works/almost-human.html`, which differs by design — the owner asked for the mark off the
head of the page, so the header is 208px shorter and the crowd that is built to fit the
page is a different crowd. That is not a phone change and it is written up in [the Almost
Human report](2026-09-20-almost-human.md).

**A drawing is never still, and the check has to know that.** The theories page creeps on a
clock of its own (the breath) and the landing page's map turns, so two renders sampled a
frame apart put the same element a pixel from itself. A difference of one pixel in x, y,
width or height with every other field equal is counted as drift and named as drift rather
than called a change — proved by running the same comparison twice and watching which
entries move. In the final sweep that was three elements in seventy-eight page-checks, all
of them on the two pages that animate. Without that tolerance the first run reported the
theories page as changed at three sizes and `same` at the same three on the next run, which
is how the noise was identified in the first place.

**The harness is not in the repository** — it needs a second checkout and two servers, which
is not something `npm test` can carry — but it is twenty lines of Playwright and the recipe
above is the whole of it. It is worth rebuilding for any round that touches a shared rule,
because it caught two things that reading the diff had passed over:

- **A transform that resolved to the identity matrix.** `.structure-say` carried
  `transform: translateX(var(--say-shift, 0px))` at every width. The shift is nought on a
  wide window so nothing moved — but `none` became `matrix(1, 0, 0, 1, 0, 0)`, which is a
  containing block and a stacking context where there had been neither. Nothing on that
  page depended on it, and it still should not have been there.
- **`width: max-content` on the say's lines**, which changed `.structure-no` from 500px wide
  to 15 and `.structure-name` from 500 to 211 on a desktop. Left-aligned blocks with no
  background render identically at either width, which is why it looked free; it is a
  different page all the same.

**Four fixes cost something to be held to the rule**, and all four are deliberate:

| | held to 700px | what that leaves |
|---|---|---|
| the clearing before Almost Human's introduction | was 1111px | between 700 and 1111 the crowd has only the gaps the writing happens to leave |
| the contact sheet's overlap pass | was every width | at 701–820px the sheet still prints two or three pictures over each other, as it always did |
| Pineward's one tree | was every width with no strips | between 700 and about 1036 the page still has no wood at all |
| the station's `pull` and its lettering | was every width | a squarish desktop window still throws a station off its edge |

Each of those is a real fault left in place between 700px and wherever it stops, and every
one of them could be lifted by moving one number. The rule won because it is the owner's.

**Two changes in this round are NOT held to 700px, and should not be**, because neither is
about a phone:

- **The chamber's transition fix.** The plate snapped 185px on every window, desktop
  included; the owner reported it from a phone but it was never a phone fault.
- **The index table's clamped link.** A cell is clipped with an ellipsis and the anchor
  inside it was not, which is a plain layout fault at any width. Measured: it changes
  nothing at any size tested, because it only bites where a name is too long for its
  column — which above 700px it never is.

### Almost Human's crowd stopped standing on things

Not a phone fix in origin — the owner asked for the crowd not to be put over anything — but
it is the same fault and it shows on a phone. Written up in [the Almost Human
report](2026-09-20-almost-human.md).

## How to test it

```bash
npm test -- tests/mobile.spec.js
```

Four tests, and they belong to no one feature the way `repository.spec.js` doesn't —
they are about the whole site at a phone's size. Every one was **proved against the real
fault**:

- **`no page can be dragged sideways`** — twelve pages at 390px. With the say's rule taken
  out it reads `415 > 390` and fails.
- **`Almost Human's crowd is drawn on a phone`** — with the column rule back it reads
  **0 pixels of ink** on a whole phone screen.
- **`a tap brings a figure home`** — with `pointerdown` removed the ink width reads
  78 → 78, which is a tap doing nothing.
- **`the calculator button stands under OPEN, not off to the side`** — with the 700px block taken out it reads
  **133px across** from the line it is meant to stand under, on a 390px screen.

  It **opens the station** to read it. The card is built with the mark, but until the
  station is set out it has no box at all: reading it where it stands gives zeros at every
  width, so a test written that way passes on a desktop too and proves nothing. That was
  the first go at it.

**The tap test had to be re-aimed in the second round**, and the reason is worth keeping.
It used to look for the figure down the left margin, because that is where one stood; a
phone has no margins now, so the crowd stands in the clearing the page makes for it and a
figure can be anywhere across the width. It also has to measure in **a box wider than the
figure's cloud** — the old 150px box read its own width whatever the figure did (141 → 138
with the figure plainly coming home inside it), because the cloud is wider than that and
the box was saturated. At 300px it reads **185 → 153 with the tap, and 185 → 187 with no
tap at all**, waiting exactly as long.

By hand, the thing worth doing is the one the tests cannot: open each page at a phone's
size and **drag a finger down it**. The drawings answer a drag the way a desktop answers a
pointer, and that is most of what these pages are.

## Known issues / TODO

- **The hover-only readings are still hover-only in spirit.** The sheet's *say*, the
  structure's card and the crowd's resolving all answer a finger now, but they are
  discovered by dragging rather than by pointing, and nothing on a phone tells you to
  drag.
- **The three drawn category pages are not re-laid-out for a phone**, only made to run on
  one and then made not to overlap. The contact sheet in particular is a tall single file
  of pictures at that width rather than a scatter, which is the honest thing for it to be,
  but it was not designed that way.
- **The chrome's boxes are not on the pages' own searches.** `.page-find` on the theories,
  favourites and photography pages is the same fixed mark in the same corner and has the
  same problem; it stands over a drawing rather than over writing on all three, which is
  why it has not been done.
- 37 frames a second on the map is playable rather than smooth. The next thing to try
  there is fewer wake specks on a narrow window.
