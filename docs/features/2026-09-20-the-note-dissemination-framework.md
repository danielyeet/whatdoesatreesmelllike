# The Note Dissemination Framework

Date: 2026-09-20

Files: `works/theory-03.html` (the whole of it rewritten), the `zone-*`, `math-*`,
`graph-*` and `essay-claim` / `essay-sub` / `essay-check` blocks in `style.css`, the
`--math` token on `:root`

## What it is

The third theory, and the longest piece on the site: the owner's own account of how a
fragrance develops read as *how distinguishable its notes are*, worked out from Amber
Zero by ADAR. They call it their magnum opus in the standfirst, and it is the only piece
here that **argues in diagrams as much as in writing** — twenty-two of them, plus a
graph — and the only one with arithmetic in it.

It stands on the same ground as the other two theories, so
[the essay pages](2026-09-17-the-essay-pages.md) is the report for everything about the
page *as* an essay page: the field behind it, the rule down the left, how a section
becomes a tick. This report is only the things this piece needed that no other page has.

Nine sections: Premise, An Introduction to Amber Zero and My Thought Process, Other
Fragrances, Mathematical Reasoning, Complications, Complication Examples, Making Sense of
the Results, Assumptions, Footnotes.

## Every diagram is inline SVG in the page

Not a script, and not a picture. Three reasons, in the order they mattered:

1. **They are the argument.** A reader with JavaScript blocked still gets the whole piece
   on the other theory pages, and it would be a strange exception for the one page whose
   reasoning is half pictures to lose half of itself. They are in the markup, so they are
   always there.
2. **They are drawn in the page's own ink.** Every part of them takes its colour from the
   same tokens the essay does, so the page stays one thing. The triangles on
   `works/theory-01.html` were done this way first and this follows them.
3. **They scale with the reading** rather than being pictures of themselves at one size.

## How to read a diagram, and how to change one

The circle is the **zone of indistinguishability** and each arrow is one note. What a
diagram says is set by exactly two numbers, and nothing else:

| | |
|---|---|
| **how far in** | the share of the arrow's *body* that lies inside the circle |
| **which end** | whether the head is on the outer end (leaving the zone) or the inner one (going into it) |

Everything else — where a corner falls, how long a shaft is, where the head's base sits —
is worked out from those. An arrow on the radius at angle θ spans radius
`R − inside·L` to `R + (1−inside)·L`, the head is a triangle `HEAD_L` long at whichever
end it belongs on, and the shaft stops at the head's base.

**They were generated, not typed.** Thirteen arrows at 85% on three circles is the kind
of thing that is wrong by hand and stays wrong. If several need changing, work them out
the same way rather than nudging coordinates: the numbers in the file are plain
coordinates and they will not tell you what share they were meant to be.

The classes are `zone-ring`, `zone-arrow`, `zone-head`, `zone-lead` (a legend's leader
line), `zone-name` (Top / Mid / Dry Down under a diagram) and `zone-link` /
`zone-link-head` — **the connector between two diagrams, and it is deliberately not the
arrow a note is drawn with.** It is an open chevron on a plain line, in brass, so a reader
never takes the passage of time for another note. The owner asked for that specifically:
*"it should be a different arrow than the ones in the circle."*

`.zone-row` is the three-across grid the complication examples use — a diagram, its name,
and its own working underneath, one column per stage. On a phone it goes to one column,
each still carrying its own working.

## The maths is set in a serif, and that is the only one on the site

*"use a different font for the mathematical notation and symbols."* The site has two
faces: Archivo for the reading and IBM Plex Mono for its readings, numbers and labels.
Setting a variable in the mono would make it look like one of those readings — the very
thing it must not look like — so the maths takes a **serif**, which is what maths is set
in anyway.

`--math` on `:root` is `Georgia, "Iowan Old Style", "Times New Roman", Times, serif` — a
face the machine already has, rather than a third family fetched over the network for one
page.

| class | what it is |
|---|---|
| `.math-block` | one worked answer |
| `.math-line` | a line of it |
| `.math-cont` | a line that carries on under the first, indented to stand under its own equals sign |
| `.mv` | a variable, in italic |
| `.mrec` | a recurring digit, with the bar over it |
| `.math-aside` | the owner's parenthetical, back in the sans so it is not mistaken for notation |
| `.math-standalone` | a formula given a line of its own, centred |

**Two things about `.essay-section p` bit here and are worth knowing.** It sets the
paragraph spacing *and* justifies with hyphens, and it outranks a plain class — so every
line of a worked answer stood a paragraph apart, and each one was stretched to the
measure, which puts gaps between a formula's own symbols. Both are undone under
`.essay-section .math-line`.

**The recurring bar is a CSS `overline` on a span**, not the combining character U+0305,
which not every face carries and which sits at a different height in the ones that do.

## The graph

`.graph`: modified IBR up the side in whole numbers, the three stages along the bottom as
three discrete points, the two thresholds (0.5 and 2) ruled across as brass dashes, and
Amber Zero's three readings joined point to point — not a fit through them, which the
owner was explicit about. The last reading's label is set to the **left** of its point;
at the right edge of the frame there is nowhere else for it to go.

## What is the owner's, and what I changed

The writing is theirs throughout, spelling and all — `dont`, `compelxity`, `chracter`,
`peaking its head out` and the rest are voice and were left. So was the note to
themselves, `*************CHECK***************`, which they asked to have kept; it is
`.essay-check`, in brass.

Three things in the arithmetic did not agree with themselves, and they are worth listing
because two of them are still open:

- **`~~` became `≈`** throughout. They asked for it: *"ill just use ~~ for the rest of the
  document, you should replace it properly."*
- **`/` became `×` in three lines** where the printed answer is the *product* — October
  Lake's `0.43/0.5 = 0.215` and `0.176/0.5 = 0.09`, and Amber Zero's `0.176/0.769 =
  0.136`. As written those lines are false by a factor of four; as products they are
  exactly the stated answers, and the owner themselves wrote `4*1.666` in the parallel De
  Profundis working. **Flagged to them.**
- **Babycat's `BC=90%` became `BC=10%`.** The same sentence says ten per cent of the
  arrows are inside, and the next line divides by 0.1. **Flagged to them.**

And two were left exactly as written, because they are *results* rather than notation,
and a result is the owner's:

- **October Lake's mid reading, `1.66̄`.** `0.25/0.75 × 10/20` is `0.1666̄`, and `0.1666̄`
  is also the number that makes their own next sentence true ("progressively got more
  difficult... from −0.215 to ... to −0.09"). It looks like a decimal place slipped. It
  is printed as they wrote it and **flagged to them**; it is not mine to correct.
- **`IB` where they meant `BC`** in the De Profundis facts. Written as `BC`, since `BC` is
  the term the piece itself defines two sections earlier and `IB` is defined nowhere —
  that is the same word, not a better one.

## How to test it

There is no spec of its own. `tests/essay.spec.js` covers it as an essay page — the rule,
the ticks, the reading, the writing being there without the script — and
`tests/repository.spec.js` covers its links, including the three into ADAR
(`adar.html#part-01`, `-02`, `-03`).

By hand, the things worth looking at:

```bash
npm run serve    # then http://localhost:8123/works/theory-03.html
```

- **The rule must not jump** anywhere down the page. It is nine sections and one of them
  is long enough to wrap; see [the essay pages](2026-09-17-the-essay-pages.md).
- **The three-across rows at phone width.** They go to one column; the workings must not
  run out of their cells.
- **The diagrams say what their captions say.** Count the arrows and look at which way the
  heads point — that is the whole content of them.

## Known issues / TODO

- **The two flagged results above.** Until the owner rules on them, October Lake's mid
  reading contradicts the paragraph under it.
- **The plate at the top is still a hatched placeholder**, like every other on the site
  but ADAR's and Pineward's.
- **Reading time is a guess** — 20 min, against the 15 of the other two theories, which
  the owner set themselves.
- The diagrams have no `<title>`/`<desc>` beyond their `aria-label`. Each one's label says
  what it shows, which is as much as a screen reader can do with a drawing whose content
  is an angle and a proportion; the captions carry the argument in words.
