# The site on a phone

Date: 2026-09-21

Files touched: `node-scene.js`, `structure.js`, `chamber.js`, `contact-sheet.js`,
`almost-human.js`, `pineward.js`, `adar.js`, `essay.js`, `index-page.js`, `paper.js`,
`find-ground.js`, `style.css`, `tests/mobile.spec.js`.

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

## How to test it

```bash
npm test -- tests/mobile.spec.js
```

Three tests, and they belong to no one feature the way `repository.spec.js` doesn't —
they are about the whole site at a phone's size. Every one was **proved against the real
fault**:

- **`no page can be dragged sideways`** — twelve pages at 390px. With the say's rule taken
  out it reads `415 > 390` and fails.
- **`Almost Human's crowd is drawn on a phone`** — with the column rule back it reads
  **0 pixels of ink** on a whole phone screen.
- **`a tap brings a figure home`** — with `pointerdown` removed the ink width reads
  78 → 78, which is a tap doing nothing.

By hand, the thing worth doing is the one the tests cannot: open each page at a phone's
size and **drag a finger down it**. The drawings answer a drag the way a desktop answers a
pointer, and that is most of what these pages are.

## Known issues / TODO

- **The hover-only readings are still hover-only in spirit.** The sheet's *say*, the
  structure's card and the crowd's resolving all answer a finger now, but they are
  discovered by dragging rather than by pointing, and nothing on a phone tells you to
  drag.
- **The reading in the corner of a house page can overlap the picture** at the head of it
  on a narrow window. It is fixed to the window and the picture is in the flow.
- **The three drawn category pages are not re-laid-out for a phone**, only made to run on
  one. The contact sheet in particular is a tall single file of pictures at that width
  rather than a scatter, which is the honest thing for it to be, but it was not designed
  that way.
- 37 frames a second on the map is playable rather than smooth. The next thing to try
  there is fewer wake specks on a narrow window.
