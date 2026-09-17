# The essay pages

Date: 2026-09-17 (`d7092b2`, the round that added four page kinds at once; migrated
from CLAUDE.md on 2026-09-17)

Files: `essay.js` (~380 lines), `works/theory-01.html`, `works/theory-02.html`,
`works/theory-03.html`, `works/resins-in-perfumery.html`, the `essay-*` block in
`style.css`, `tests/essay.spec.js`

## What it is

A page for a long piece of writing, drawn in [the structure](2026-09-14-the-structure.md)'s
language rather than [the contact sheet](2026-09-13-the-contact-sheet.md)'s: near-white
on gray-black, a fine swarm of particles standing in the air behind the writing
(`SPECKS`, 220), and sights at the corners (`SIGHT`, `SIGHT_IN`).

Opening a theory from that category should read as going further into the same
instrument rather than as arriving somewhere else, and that is the whole reason for the
ground.

## The rule down the left

- **It is built from the page's own sections** — every `<section class="essay-section">`
  with an `<h2>` in it, in the order they stand. Adding a section to the page adds a tick
  to the rule with no other change.
- A heading carries its number in a `<span class="essay-no">` of its own and **the number
  is not part of the name**: read whole, every tick came out as "01PREMISE".
- **Every tick is a link to its own section**, so the rule is a way of getting about and
  not only a readout.

## Which section the rule says you are in

Three rules in order (`readingAt`), and the order is the point:

1. **One you have just pressed names itself** until you scroll away from where it took
   you (`PIN_FREE`, 60px). Pressing "Myrrh" and being told you are in Camphor because
   Camphor is longer is a readout arguing with you — the owner asked for exactly this.
2. **One you have just reached names itself** while its heading is in the top
   `ARRIVED_BAND` (0.45) of the window. That is what gives a short section a window of
   its own in which it is the subject, rather than never being named at all.
3. **Otherwise the one filling the most of the window wins** — which is the honest
   answer while you are reading through something long.

And at the very bottom of the page the last section wins outright: there is nowhere
further to go, so that is what you are looking at.

## The reading is the scroll

Nothing on the page adds itself up: the drift is written from the clock and the travel
from `scrollY`, so a page left alone reads the same a second later and travelling back
gives exactly the drawing you left. A test checks both — the same two things
[the structure](2026-09-14-the-structure.md) got wrong first.

## The web is short and capped

`WEB_REACH` (58px), `WEB_EACH` (2). At a longer reach the field came out as long lines
striking across the page and closing into triangles: a net thrown over the writing
rather than air standing behind it. [Pineward](2026-09-16-pineward.md)'s canopy made
exactly the same mistake first, which is why the numbers here are small.

## What is written on them

The three theory pages are **templates** — placeholder writing, real structure — and the
resins research is the owner's own writing (sixteen sections against the theory pages'
six). The theories category's first three rows point at the three theory pages.

## How to test it

```bash
npm test -- tests/essay.spec.js
```

Six tests: the rule being built from the piece's own sections and naming them without
their numbers; every tick being a link to its own section; the reading being the scroll
and not drifting while nothing is touched; travelling back giving exactly the drawing you
left; the field standing still under `prefers-reduced-motion`; all of the writing being
there without the script; and the theories and the researches reaching their own pieces.
