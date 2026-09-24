# My Personal Introduction to Perfume — Explorations 000

Date: 2026-09-23

Files touched: `works/my-personal-introduction-to-perfume.html` (new), `primer.js` (~230
lines, new), the `MY PERSONAL INTRODUCTION TO PERFUME` block at the foot of `style.css`
and one exclusion added to the Menu's dimming rules near the top of it, the first row of
`categories/researches.html`, a line in `PAGES` in `search-page.js`, `tests/primer.spec.js`
(new), and small changes to `tests/index-pages.spec.js`, `tests/essay.spec.js`,
`tests/pages.spec.js` and `tests/mobile.spec.js`.

## What changed

The owner's own guide to perfume — what one is, concentrations, liquid to gas, notes,
accords, the pyramid, performance, seasons, time of day, strip and skin, and two myths —
as a new piece in Explorations & Researches. It is **numbered 000, it is the first
result, and it is an exploration**, all three at the owner's word. The page is an essay
page with a look of its own: a gold accent, a **mist** of perfume drops rising behind the
writing and turning to vapour as they climb, and the diagrams the owner asked for drawn
in the page.

## Why / key decisions

**An essay page, re-accented.** The other explorations are essay pages (the dark ground,
the rule down the left with one tick per section), so this one is too — `essay.js` gives
it the rule unchanged. What is its own is scoped to `.primer-page` so no other essay
moves: the essays' steel blue becomes **gold**, the colour of perfume in a bottle, and the
essays' swarm of specks is replaced by **the mist** (`primer.js`). `essay.js` runs happily
without its own canvas; it simply draws no swarm.

**The mist is the piece's own "From liquid to gas" said as a drawing.** Drops rise slowly
up the window, and as each climbs it shrinks and a little cloud of finer, paler specks
loosens off it and thins to nothing. **The hand warms it**: a drop near the pointer turns
to vapour sooner, the way the piece says perfume evaporates faster on warm skin. Over the
column a drop is drawn at a fraction of its strength (`QUIET`), easing in either side —
Ataraxia's rule for keeping writing readable over a ground. It lives on the window rather
than down the document, like Grande Parfums' drift, because rising things read as weather.

**000 sorts first by itself.** `index-page.js` reads a row's number off `data-no`, and
nought sorts before every other, so nothing in the sorting had to change.

**The diagrams** are inline SVG drawn in a handful of classes (`pd-*`) so the set is
coloured from the stylesheet:

| | |
|---|---|
| **the accords table** | exactly as described — *Notes* over the first column, *Accord* over the second, several rows of notes to one accord (`rowspan`) — filled with the notes that most often make each one: citrus, white floral, woody, warm spicy (which the writing's own clove-and-cumin example leads into), aromatic, green and sweet. **No amber**, at the owner's word, and a test says so. |
| **the two pyramids** | the empty one (Top, Mid, Base) and the citruses / woods / musks one, the second shaded deeper towards the base. |
| **the bleed** | three waves over time, each rising as the one before fades — the writing's point that a perfume "does not SUDDENLY go from top to mid, but rather it bleeds into it". |
| **oil + alcohol**, **liquid to gas**, and **performance** | three small drawings of what the words say: the two liquids making the perfume; the bottle, the skin and the air; and a sphere round a wearer, a life on the skin, and a trail behind someone walking. |
| **concentrations** | see below. |

**The dropdown** is a real `<details>`, so it opens with or without the script. **The
motto** stands in the middle of the column, large, italic and gold, between two short
rules. **The takeaway sentence** is bold. **The footnotes** are raised numbers linking to
the notes at the foot, each with a link back; pointed at or focused, a number also shows
its note beside it.

**The footnote pop-up fell into the site's known trap**, and it is worth writing down
again: it is built on the `<body>`, and the Menu's dimming rule (`body > *:not(…)`) gives
every direct child of the body an 0.85-second opacity transition that outranks the child's
own. The pop-up therefore faded in over 0.85s instead of 0.2s and was read see-through
over the writing. It is excluded from both of those selectors now, as the notes window is.
The first test of it caught the fault (*"the note should be solid, not half faded in —
0.70"*).

### What was changed in the owner's text

They asked for the formatting to be fixed and said *"Feel free to spellcheck"*, so it was,
and only that — the voice is untouched:

- **Formatting:** the stray invisible characters the paste carried were taken out, headings
  were set in one case (*From liquid to gas*, *Time of day*, *Smelling strip and skin*),
  the six skin factors became a numbered list with their names in bold, the two myths got
  headings of their own, the footnotes became numbered links, and the sources became links.
- **The instructions to me were carried out rather than printed**: *(make a table …)*,
  *Draw a note pyramid …*, *Create another note pyramid …*, *(MAKE THIS A DROPDOWN …)*,
  *(make that last sentence in bold)*, *(middle of the page, somehow italics and
  emphasized)*.
- **Spelling and slips:** *all perfume are liquid* → *all perfumes are liquid*; *Only after
  they are sprayed, they start* → *Only after they are sprayed do they start*; *gradually
  turns* → *gradually turn*; *it is will be smelled* → *it will be smelled*; *An accord is
  character* → *An accord is a character*; *has characteristic density* → *has a
  characteristic density*; *repulsed … from people* → *repulsed … by people*; *the vibe a
  fragrance gives off evening-y and other times its day time-y* → *the vibe a fragrance
  gives off is evening-y and other times it's daytime-y*; *In a lot of fragrance* → *In a
  lot of fragrances*; *fragances* → *fragrances*; *men cant* → *men can't*; *mindfull* →
  *mindful*; *the perfumes performance* → *a perfume's performance*; *Eau De Toilette* →
  *Eau de Toilette*; *Parfums de Marley* → *Parfums de Marly* (the house's spelling); and
  in the nuances, *the scent will sit closer to you and in the colder months … (better
  projection)* → *the scent will sit closer to you in the colder months …*, the
  parenthesis repeating what the sentence had just said.
- **One word that was not a spelling:** *there are four words that a person might use to
  describe a perfume's performance* → **three**. The same sentence names three, and the
  piece later calls them *all three aforementioned metrics*. Worth the owner checking,
  in case a fourth was meant.

## How to test it

```bash
npm test -- tests/primer.spec.js
```

Eight tests: it is 000, first (and last when the number column is turned round), and an
exploration; the twelve sections and the rule; the accords table grouped by `rowspan` with
no amber; the empty pyramid and the citrus / woods / musks one in that order down the
drawing; the dropdown shut until opened; the bold takeaway and the motto — italic, more
than twice the size of the writing, and within 8px of the middle of the column (which
caught the first version, centred inside the writing's narrow measure, **85px** off); the
footnotes both ways and the pop-up solid; and the mist present and quieter over the
writing. Two were proved against their faults: with the pop-up's exclusion taken out it
reads **0.70** opacity and fails, and with the mist's `QUIET` at 1 it reads *over the
writing 60.2, beside it 77.5* and fails.

The Explorations & Researches tests that said the first row was *Resins in Perfumery*
now say it is this piece, and that the research is the next row — the deliberate change
the owner asked for.

By hand: `npm run serve`, then `http://localhost:8123/works/my-personal-introduction-to-perfume.html`.
Hold the pointer in a margin and watch the drops near it go to vapour early; open the
nuances; point at a footnote number.

## Known issues / TODO

- **The Concentrations section arrived as a heading with nothing under it** — most likely
  a table that did not survive being pasted. It holds the common rule of thumb for how
  much oil each name means (Extrait 20–40%, Eau de Parfum 15–20%, Eau de Toilette 5–15%,
  Eau de Cologne 2–5%, Eau Fraîche 1–3%), drawn as bars and captioned as usual ranges that
  differ between houses. **It is the one part of the page not written by the owner**, and
  theirs to replace.
- **"this research about skin"** in *Smelling strip and skin* points at a research that
  does not exist on the site yet, so it is not a link. When it is written, link it there.
- The row's date is the day the piece was put on the site, 23.09.2026.

## 2026-09-23, later — the owner's corrections

- **Concentrations is written.** The owner sent the section: a paragraph on what the names
  mean and that they are unregulated, **their own table of ranges** (Extrait de parfum /
  parfum 15–30%, Eau de parfum 10–20%, Eau de toilette 5–15%, Eau de cologne 2–5%, Eau
  fraîche / brume 1–3%) drawn as the bars on a 0–30% scale so the **overlap** the next
  paragraph points at can be seen, the source (Premiere Peau, opening in a new window —
  the address given without the search engine's tracking tag on the end), and three
  paragraphs after it: the overlap, Amouage's Epic 56 Woman at 56%, and *Esprit*. The
  "arrived empty" note above no longer holds. Spellcheck: *Notice that the overlap* →
  *Notice the overlap*, *gague* → *gauge*.
- **The oil + alcohol drawing adds up.** *"make the third diagram's volume be the sum of
  the first two"* — all three are now the same vial, so the levels add as heights: oil 16,
  alcohol 56, perfume 72. The oil is now a small part of it, which is also truer. The
  perfume keeps a spray cap and is captioned *both together*.
- **The liquid-to-gas drawing is gone**, at the owner's word; its words stay.
- **After the accords table**, the owner's paragraph on describing a perfume by its accord.
- **The pyramid is a true triangle.** *"why is it weird"* — its base band flared out at a
  steeper slope than the two above it, so the sides kinked at the second line. Both
  pyramids are now one triangle cut into three bands of equal height.
- **The motto has its full stop**: *Wear what you like.*
- **The rule said "Introduction" near the end.** Past the last section — the motto, the
  footnotes, the sources — no section is on the window, and `essay.js` fell back to the
  first one. It now names the last section passed. That is a fix to the shared essay
  script, and changes nothing on any page while a section is in view.

Tested in `tests/primer.spec.js`: the perfume holds exactly the other two (same width,
heights adding); the ranges are the owner's and each reaches the next; the liquid-to-gas
section has no figure; **the pyramids' sides do not bend** (with the old base band put
back it reports *a side bends by 3.17*); and **past the last section the rule names it**
(with the old fallback it reads *Introduction*). The motto test now asks for the full
stop.

## 2026-09-24 — Footnotes and Citations on the rule

> to this list in the 000 exploration, add citations and footntes

The list was the **rule** down the left, which names every section as you pass it. The
footnotes and the sources stood at the foot of the page under small gold headings, outside
any section, so the rule never reached them. They are **two sections of their own** now,
**13 Footnotes** and **14 Citations** — "Sources" renamed to the owner's word — headed like
every other section, their lists still set small; a wrapper (`.primer-endnotes`) keeps the
rule above them. The count in the head says 14. The footnote links still point at their
notes and back, and `aria-describedby` still names the Footnotes heading.

One test changed with it, deliberately: `past the writing's last section the rule names
where you are, not the introduction`. Reading the motto used to leave no section on the
window, which is the case it was written for; the Footnotes now stand just under the motto,
so there the rule names **Footnotes**. The fallback it guarded is unchanged in `essay.js`.
`the piece opens with its fourteen sections and the rule` now also reads the last three
names on the rule and what each of the two new sections holds; it fails with the Citations
not a section.
