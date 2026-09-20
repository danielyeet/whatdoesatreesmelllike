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
- **It does not move when the name under it changes.** The rule is a fixed column centred
  on its *own* height, and the name under it (`.essay-here`) wraps to a second line when a
  section is called something long — so going from a one-line name to a two-line one used
  to shift the whole ladder, hairline and all, half a line up the window, and back down
  again at the next section. The owner found it on The Architecture of Sweat, between
  *Applying the Framework* and *Every Combination*: a jump of exactly 8px, measured.
  `holdName()` now reserves the room **the tallest name this page actually has** needs,
  measured off the page rather than guessed at, so no heading is ever clipped and the rule
  never moves whatever the piece is called. It is measured again on resize (width is what
  changes the wrapping) and again on `document.fonts.ready`, since the page's own face
  arrives after the page does and wraps differently from the one the browser starts with.

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

## The sweat theory's combination table

Three lists of three, three and two make **eighteen** combinations, and the owner asked
for every one of them written out with a blank beside it to fill in later. So the table on
`works/theory-02.html` is a **form**, not a finding: eighteen rows in the order every
combination is counted off — first letter changing slowest, last fastest — each carrying
its code, the three words that code stands for, and an empty cell.

**The blank is the point of it.** A row with nothing in it draws a dashed **rule** rather
than nothing at all (`.sweat-who:empty::after`), because a rule reads as *waiting* where a
gap reads as broken; the moment anything is typed between the tags the rule goes and the
name stands on its own. And a combination that stays empty is itself worth something — it
says nobody has made that.

**Filling one in is one edit**: find the row by its code and put the name between its
`<td class="sweat-who">` tags. The markup carries that instruction above the table, along
with the one warning that matters — the rows must not be renumbered or reordered, because
the codes are the framework's own and the order is the counting.

On a narrow window the three spelled-out columns are dropped and the code is kept: the
code carries the same information and the page has just finished explaining how to read
it.

Adding this section pushed Notes to 05 and Footnotes to 06, ids and all. The rule down the
left is built from the sections themselves, so it picked the new one up with nothing else
changed — which is the whole reason it is built that way.

## The resin list links into the page

The fourteen resins the research is going to cover are an ordered list at the top of it,
and each is now a link to that resin's own section. The links are **matched to the
headings at build time, not typed**: the section ids are read off the page and each name
is matched against them, falling back to the head of a compound name (`Frankincense` for
`Frankincense/Olibanum`, `Benzoin` for `Benzoin (Resinoid)`). All fourteen found their
section. If a resin is ever added to the list before its section is written, it renders as
plain text rather than as a link to nowhere.

## The third theory has a report of its own

`works/theory-03.html` outgrew this one. It is the longest piece on the site and it
argues in **diagrams** as much as in writing — twenty-two of them, all inline SVG — and it
is the only place on the site set in a serif. See
[The Note Dissemination Framework](2026-09-20-the-note-dissemination-framework.md).

## Known issues / TODO

- **None of the theory pages is a template any more.** `works/theory-01.html`,
  `works/theory-02.html`, `works/theory-03.html` and `works/resins-in-perfumery.html` all
  carry the owner's own writing. The two `example-*` files in `works/` are still the
  templates a new piece is copied from.
- **Only two of the four carry a standfirst** — the resins research and theory-03. The
  first two theories have none at all, which is the owner's to write or to leave.
- **Every plate on all four is still a hatched placeholder**, with its `<img>` commented
  out waiting for a file.
- The rule is built from the sections in the markup, so a page whose writing arrives
  with a different number of sections needs nothing done to it.
