# The Pineward gallery

Date: 2026-09-18

Files: `works/pineward.html` (the markup at the foot of it),
`pineward-gallery.js` (new), the `pine-gallery` / `pine-viewer` block in
`style.css`, `images/Pineward/The Pinewards Gallery Page/` (the owner's own
photographs), `images/Pineward/gallery-web/` (the web copies)

## What it is

The pictures the owner took for the Pineward page, standing at the foot of it below
White fir — the last of the fifty-four. A strip of small squares that cycles on its own,
with an arrow either side, and under it the line they asked for word for word: *These are
some pictures I took for the purpose of this page. All rights reserved.*

Pressing one darkens the whole page and stands that picture in the middle of it, with its
number in its own top right corner and an arrow either side. The arrow keys work, and
Escape closes it.

## The number is the position, not the file

`pineward-40.jpg` is the twenty-fourth picture in the strip and is shown as **24**. That
is what the owner's *"the number of this image in the presentation chronologically"*
means — where it stands in the presentation — and it is why nothing anywhere reads a
number out of a filename. Reorder the markup and the numbering follows.

## It stops while it is being looked at

*"automatically cycling on the page (unless hovered)"* is the rule, and three more things
count as being looked at for the same reason: the keyboard being in the strip, the viewer
being open over it, and the tab not being the one in front. A carousel that advances
while you are reading one of its pictures — or while you are not in the room — is the
thing this is avoiding. Pressing an arrow also puts the clock back to the top, so you get
the full stand on the picture you asked for rather than whatever was left of the one
before it.

## Measured, not told

How many pictures are on the window at once is whatever fits, and the strip travels by
whole pictures rather than by pixels. Both come off the page itself: one step is the
distance between two real neighbours' left edges, read live. Writing the width and the
gap into the script as numbers would mean two copies of them, and the gap is a `clamp()`.

## The swap is a wipe, not a cross-fade

The owner asked for *"a smooth and fast animation between the pictures"*. The picture
leaves the way it is going and the next comes in from the other side — 150ms out, 240ms
back. A cross-fade between two photographs is neither smooth nor fast: it is a moment of
mud where both are half there.

## The pictures themselves

The originals are ~3MB each and there are thirty of them, so they are kept as they are
and two web copies are made beside them, the same way ADAR's and Pineward's plates
already were:

| | |
|---|---|
| `pineward-NN.jpg` | long edge 1600px, quality 82 — what the viewer shows |
| `pineward-NN-thumb.jpg` | square 520px, cropped from the middle — what the strip shows |

The strip is squares, so the crop is made once here rather than by the browser thirty
times. Largest web copy 494KB, largest thumbnail 86KB, and every thumbnail is
`loading="lazy"`.

Four of the photographs were sitting loose in the repository **root** rather than in the
gallery folder; they were moved in with the rest, which is why the set is thirty and not
twenty-six.

## Without the script

The strip is a plain row of pictures and each one is a link to its own full-size copy.
Everything the script does is added to that rather than replacing it: the links keep
their `href`, the viewer only opens because the press is caught first, and a press with a
modifier held is let through so that asking for a new tab still gets you the picture's
own file.

## How to test it

```bash
npm test -- tests/pineward.spec.js
```

Driven by hand for this round rather than pinned by a test of its own: the strip cycling
(one step of 146px inside 3.2s), holding while hovered, the viewer opening on the right
picture with the right number, `→` stepping to the next one and Escape closing it. No
console errors.

## Known issues / TODO

- The gallery has no test of its own yet. The behaviour worth pinning is the number being
  the position rather than the filename, and the strip holding while hovered.
- The owner said the strip should be *"slightly thicker"*; the squares are 150px, up from
  the 132px first drawn. If that is still not what they meant, `.pine-shot`'s width and
  height are the one place to change it.
