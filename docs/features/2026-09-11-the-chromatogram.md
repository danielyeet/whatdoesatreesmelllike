# The chromatogram trace and its ranks

Date: 2026-09-11 (the repository's first commit), last worked on in `6530c5e` the same
day. Migrated from CLAUDE.md on 2026-09-17.

Files: `extras.js` (~250 lines), `index.html`, `style.css`, `tests/node-map.spec.js`

## What it is

`extras.js` draws a gas-chromatograph trace along the foot of slide 3 — one peak per node,
edge to edge with no labels — reading `window.__mapReadout` for each node's depth (which
sets the peak height) and for `activeIndex` (the hovered node). Behind the front line stand
`RIDGE_COUNT` (6) **ranks** of the same trace, each higher up the page, shorter and fainter than
the one in front, so the reading recedes like hills. The whole thing is toggled by
`SHOW_CHROMATOGRAM`, a single boolean.

## Why / key decisions

- **Every peak keeps its own eased position and height** (`CHROMA_EASE`) rather than being
  drawn from live values. That is what keeps the trace from twitching as the map turns, and
  what makes hovering grow a peak smoothly.
- **The hovered node's peak gets a guaranteed floor height, not just a multiplier**, so
  hovering a node that is currently far away — and therefore has a tiny peak — still
  visibly reacts.
- **The ranks are `<use>` copies of the one path, not traces of their own.** The shape is
  computed once a frame however many ranks there are, so none of them can fall out of step
  with the front line.
- **Each rank's step up the page is `RIDGE_FALLOFF` (below 1) of the last**, so they crowd
  together towards a horizon instead of marching away evenly.

Two things to keep true when retuning them:

- **A rank is only ever scaled vertically, about its own baseline.** Squeezing one sideways
  as well would carry every peak with it, and the same node would then read at a different
  place across the ranks — they have to stand in the same column to be the same reading.
  `tests/node-map.spec.js` checks the transforms have no horizontal part at all.
- **`RIDGE_SPAN` must stay comfortably larger than the tallest peak's shrinkage**, or a rank
  dips through the one in front of it. The tallest a peak gets is
  `CHROMA_PEAK * CHROMA_HOVER_BOOST`.

Two earlier ideas that lived in this file — dimension strings between nodes, and
plan/elevation boxes in the corners — were **removed outright rather than left toggled
off**, which is how the owner prefers removals here.

**Nothing depends on this file.** It and its `<script>` tag can be deleted with no other
change, which is worth knowing before spending time on it.

## How to test it

```bash
npm test -- tests/node-map.spec.js
```

That file covers the ranks receding behind the trace with their peaks in line, and the
no-horizontal-transform rule above.

By hand: on slide 3, hover a node that is currently facing away and check its peak still
grows visibly; turn the map and check the trace glides rather than twitching.

## Known issues / TODO

None outstanding.
