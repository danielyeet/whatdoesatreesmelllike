# The landing page's slides, and the exit sequence

Date: 2026-09-11 (the repository's first commit), last worked on in `c3471d1` (*Fade the
Scroll button with the scroll, as the title block does*) the same day. Migrated from
CLAUDE.md on 2026-09-17.

Files: `landing.js` (~270 lines), `index.html`, `style.css`, `tests/landing.spec.js`,
`tests/leaving-the-map.spec.js`

## What it is

`landing.js` drives the three scroll-snapped slides of `index.html` — it hand-animates
`scrollTop` between them for the wheel, the keys and the "Scroll" button, rather than
leaving it to the browser. It also conducts **the collapse**: the sequence that runs when
you leave the 3D map upwards, where the map falls into its own centre, the page clears to
white, an ink line draws itself from the sphere up to the slide-2 sentence, and only then
does the page travel. It fades the two corners of the title slide in and out with the
scroll position as well.

## Why / key decisions

- **Snap has to be turned off for the duration of each animation and restored on landing.**
  `scroll-snap-type: none` while the animation runs; leaving snap on makes the browser
  fight the animation, which is what previously looked broken.
- **The exit sequence's ordering is the whole effect.** `__exit` runs 0→1, then `__reform`
  runs 0→1, then the page scrolls, then both go back to 0. **Nothing scrolls until the
  first two have finished.** `tests/leaving-the-map.spec.js` guards that ordering — it is
  not an implementation detail to be tidied into something concurrent.
- **The sphere left at the end of the collapse does not fade.** `node-scene.js` holds its
  `arrival` value for as long as `__exit` is set, so the sphere stays solid black and rides
  the page off the bottom of the screen; whatever fading happens, happens off screen. A
  sphere that dissolves in place reads as the page giving up rather than as leaving.
- **The reforming line stops below the slide-2 sentence**, landing on the same point the
  thread's downward leg leaves from, rather than running to the top of the window. See the
  thread report for the three rules that make that handover invisible.
- **Both corners of the title slide fade through one shared `fadeOnLeavingSlideOne()`** —
  the block bottom right ("A portfolio / 2026 edition") and the "Scroll" button bottom
  left. For the block that means first clearing the `rise` keyframe animation that
  otherwise outranks the opacity being set, and only once that animation has finished
  playing; the button has no such animation. **Whichever is faded out also stops taking
  pointer events**, so nothing invisible is still clickable.

## How to test it

```bash
npm test -- tests/landing.spec.js
npm test -- tests/leaving-the-map.spec.js
```

By hand: serve the site, scroll slide 1 → 2 → 3 with the wheel, the arrow keys and the
button and check each lands cleanly with no fight between the animation and snap; then
leave the map upwards and watch that nothing moves until the map has collapsed and the
line has drawn. `tests/leaving-the-map.spec.js` contains regression tests for the ordering,
for the collapse drawing every node into the centre, and for the reforming line stopping at
the sentence.

## The site's name

Slide 1 carried `what does a tree smell like?` over `Photography and architecture` — the
second a leftover from the template the site was built out of, and never true of it. The
owner named the site on 2026-09-17:

> **The Taste of Aldehydes** — *Perfumes and my notes about them*

That is the big line and the line under it now, and it is the site's name: every page's
`<title>` carries it after its own name (`Pineward: … — The Taste of Aldehydes`), in place
of the `Your Name` placeholder they all used to end with. `tests/pages.spec.js` checks the
landing page's title and was updated with it.

**`Your Name` is still a placeholder everywhere else** — in `contact.html`, and as the
author's own name — and is still theirs to write. Naming the site was not naming
themselves.

## 2026-09-26 — the long move made smoother

> also try to make the home page smoother when going from 2 to3 and vice versa.

Measured frame by frame, two things were making it rough, neither of them how long it took.

- **The page was moved LAST in every frame.** Everything on this page draws from where the
  page is — the paper's curtain and grid, the map's arrival (through `__p23`, which the paper
  writes), the thread, the chromatogram — each in a frame loop of its own. `landing.js` used to
  start a fresh frame request for every step of a move, which put its step after all of theirs:
  every drawing read where the page had been a frame before (the map two, since it reads what
  the paper wrote), so at full speed they trailed the page by ten pixels or so and caught up in
  lurches whenever a frame ran long. **`landing.js` now keeps one loop (`tick`), started when
  it loads** — before `node-scene.js`, `paper.js`, `thread.js` and `extras.js` start theirs,
  since it is loaded before them — and runs every step of every move (`runPhase`, over a set
  of `phases`) at the head of the frame. With nothing moving it does nothing. The exit's three
  steps — collapse, line, scroll — run through the same loop and still strictly one after
  another, and each hands over on the frame it ends rather than a frame late.
- **The long move eased on a cube**, which over 2.4 seconds all but stood still for the first
  third of a second — a key pressed and nothing seeming to happen — and then had to make up for
  it. It eases on a **sine** now (`easeLong`): off at once, gathering and settling evenly, so the
  curtain, the grid and the map, all keyed to how far down the page is, come in as evenly as it
  moves. The short move between slides 1 and 2 keeps the cube (`ease`).

And in `paper.js`, the grid is redrawn at the full rate **while the page moves** — see [the
paper's report](2026-09-11-the-paper.md).

Headless measurements of this are dominated by the software renderer drawing the map, so the
numbers from the test machine say nothing about a real one; what the tests pin is the order and
the curve, which are what was wrong.

### How to test it

- **`on the long move between the sentence and the map, the page is moved before anything
  draws from it`** (`tests/landing.spec.js`) — every frame callback is wrapped from inside the
  page and records where the page was before and after it ran; going 2 → 3 and back, the page
  moves only in `tick`, and every `animate` and `frame` in that frame runs after it — and both
  are seen drawing while the page moves.
- **`the long move to the map sets off at once and eases evenly`** — read off the frames' own
  clocks: an eighth of the way through its time it has gone well past what the cube would have
  (the sine's nearly four percent, where the cube's was under one), and half way through its
  time it is half way there.

Both fail on the `landing.js` before this change.

## Known issues / TODO

None outstanding.
