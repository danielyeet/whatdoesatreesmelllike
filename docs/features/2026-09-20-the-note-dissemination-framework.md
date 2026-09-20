# The Note Dissemination Framework

Date: 2026-09-20

Files: `works/theory-03.html` (the whole of it rewritten), `calculator.js` (~600 lines),
`images/Theories/note-dissemination-summary.png`, the `zone-*`, `math-*`, `graph-*`,
`calc-*` and `essay-claim` / `essay-sub` / `essay-check` / `essay-coin` blocks in
`style.css`, the `--math` token on `:root`, `structure.js` (the plate on a station's
card), `tests/calculator.spec.js`

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

Ten sections: Premise, An Introduction to Amber Zero and My Thought Process, Other
Fragrances, Mathematical Reasoning, Complications, Complication Examples, Making Sense of
the Results, Assumptions, Application, Footnotes.

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
| `.math-block` | one worked answer, laid out as a GRID |
| `.math-line` | a row of it — `display: contents`, so its three cells belong to the block's grid |
| `.mlhs` / `.meq` / `.mrhs` | what is left of the equals, the equals, what is right of it |
| `.mv` | a variable, in italic |
| `.mrec` | a recurring digit, with the bar over it |
| `.mabs` | the bars round a reading being put against a threshold |
| `.math-aside` | the owner's parenthetical, back in the sans so it is not mistaken for notation |
| `.math-standalone` | a formula given a line of its own, centred |

### Every `=` stands in one column

A worked answer was a first line and then continuation lines pushed right by a guessed
`3.2em`. That lines nothing up the moment a label is longer than the guess — and on the
three-across examples the longest label (`IBR` with a "Dry Down" subscript) wrapped its
own first line and threw the whole block out with it. The owner asked for the equations
"neat and organised", with the `=` aligned.

So a block is a **grid of three columns** and every line is three cells: the label, the
equals, and the expression. A line that carries on from the one above simply has an empty
first cell, which is what puts it under the one before. `display: contents` on the row is
what lets a `<p>` hold three cells belonging to the block's grid rather than to a grid of
its own.

### The bars, and where they are not

The owner asked for the absolute sign on any `IBR` **being put against a threshold**, and
nowhere else: the sign carries the direction (complication 1), and a threshold does not
care which way anything is going. So the thresholds key, the prose comparisons and the
calculator's results table all read `|IBR|`; the worked answers, which are where the sign
is being established, do not.

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

## The summary plate

`images/Theories/note-dissemination-summary.png` is the whole piece on one sheet: the
legend it is read with, Amber Zero's notes coming out of the zone against most
fragrances going into it, the equation, the thresholds and Amber Zero's own reading
across the three stages. It stands at the top of the theory, and it is what this
theory's **card shows on the theories page** when its station is set out.

It is **generated, not drawn by hand**: the script that makes it is the one in the
scratchpad that made the page's own diagrams, so every circle on it means what the
circles in the piece mean and would say the same thing if the numbers changed. It is
rendered to a PNG at twice its size rather than left as SVG because it is a picture on
this site, not a drawing of it — and a PNG cannot be half-loaded by a font that has not
arrived.

**A station's card takes a picture through `data-plate` on its row**, with
`data-plate-alt` for its description. `structure.js` reads both off the row like it reads
everything else, and a theory with no picture yet simply does not get one. A file that
turns out not to be there is taken off rather than left as a browser's broken-image mark,
the way every other plate on this site behaves.

## The calculator

*"For the people that want to try it out; I have created a calculator that gives you the
outcomes."* It is reached from a screen-wide button at the foot of the Application
section, and it is **in this same page**.

**That is the whole design constraint**: *"the transition should be smooth; fading out of
all the text and whatnot, the stars in the background should remain where they are and on
screen. it doesnt have to be a new page, just as long as it feels like one."* A second
page would throw `essay.js`'s field away and roll a different one. So the reading fades
and is taken off, the calculator fades in, and the canvas behind them is never told
anything at all. There is a test that reads the canvas's own dimensions before and after
and fails if they are not the same object.

**Hiding the reading is a class, not the `hidden` attribute.** `[hidden]` is a
user-agent rule with almost no weight and `.essay-head`, `.essay-body`, `.essay-foot` and
`.essay-rule` each carry a `display` of their own — so setting `hidden` on them did
nothing and the essay's foot and its rule stayed on the window over the calculator.
`.essay-page.calc-on` takes them off.

### The three models

| | |
|---|---|
| **Default `IBR`** | `IBR = IC/BC`. Ten notes, drawn as plain lines: this model has no direction, so they have no heads. |
| **Modified (var. 1)** | `±IBR = IC/BC × 10/n`, worked three times with one `n` for the whole fragrance. |
| **Modified (var. 2)** | `±IBR = IC/BC × x/n`, the same three times, where `n` is the notes at *that* stage and `x` is the whole fragrance's count. The owner's caveat about this one is shown under its button **before** the rest of it arrives. |

Every model draws the theory's own diagram from the numbers as you type — a circle, and
one note for every `n`, standing `IC%` outside it, heads out on `+` and in on `−`. Having
the picture answer the numbers is most of the point of automating them.

**The sign is not part of the arithmetic.** It is written in front of the answer, and
every comparison with a threshold is made on the absolute value. There is a test that
turns the sign over and checks that nothing but the sign moves.

### What is tested, and what it is tested against

```bash
npm test -- tests/calculator.spec.js
```

Eight tests. The one worth keeping is **the arithmetic against the owner's own worked
examples**: put Amber Zero's three stages into var. 1 with `n = 13` and the calculator
has to come back with 0.136, 0.513 and 4.36 — the three numbers the piece works out by
hand. If the two ever disagree, one of them is wrong and it matters which.

The others: the change-over being the same page (above); the default model on the piece's
Xerjoff and Babycat figures; the sign; var. 2 using the stage's own `n`; the review
window carrying complication 3; a term saying what it is when pointed at; and the theory
being unharmed with the script blocked.

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
  Profundis working. Flagged, and confirmed.
- **Babycat's `BC=90%` became `BC=10%`.** The same sentence says ten per cent of the
  arrows are inside, and the next line divides by 0.1. Flagged, and confirmed.
- **Every "xerjoff" is "Xerjoff"**, which they asked for.

All three were flagged to the owner, and all three were confirmed. A fourth was ruled on
at the same time:

- **October Lake's mid reading was `1.66̄` and is `0.1666̄`.** `0.25/0.75 × 10/20` is
  `0.1666̄`, and `0.1666̄` is also the number that makes their own next sentence true
  ("progressively got more difficult... from −0.215 to ... to −0.09"). A decimal place had
  slipped. **Printed as written until they ruled on it**, which is the rule: a result is
  the owner's.

And one was corrected without asking:

- **`IB` where they meant `BC`** in the De Profundis facts. Written as `BC`, since `BC` is
  the term the piece itself defines two sections earlier and `IB` is defined nowhere —
  that is the same word, not a better one.

## How to test it

`tests/calculator.spec.js` covers the calculator (above). `tests/essay.spec.js` covers
the piece as an essay page — the rule, the ticks, the reading, the writing being there
without the script — and `tests/repository.spec.js` covers its links, including the three
into ADAR (`adar.html#part-01`, `-02`, `-03`).

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

- **The plate is generated rather than photographed**, and it is the only plate on the
  site that is. If the piece's numbers ever change, it has to be made again — the script
  is in the scratchpad, not the repository, which is the weak point.
- **Reading time is the owner's own** — 45 min, which they set.
- The diagrams have no `<title>`/`<desc>` beyond their `aria-label`. Each one's label says
  what it shows, which is as much as a screen reader can do with a drawing whose content
  is an angle and a proportion; the captions carry the argument in words.
