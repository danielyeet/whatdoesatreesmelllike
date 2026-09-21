# Ataraxia, Grande Parfums and Les Abstraits — and the shape they share

Date: 2026-09-21

Files: `house.js` (~313 lines, new), `ataraxia.js` (~380 lines, new),
`works/ataraxia.html`, `works/grande-parfums.html`, `works/les-abstraits.html` (all new),
the `house-*` and `human-star` rules in `style.css`, `tests/houses.spec.js` (new),
`images/Ataraxia/`, `images/Grande/`, `images/Les-Abstraits/`; and the four places a new
house has to be added — the frame and the Fragrances rows in
`categories/scent-descriptions.html`, the `PAGES` lines in `search-page.js`, and the
footer chain through `works/almost-human.html`.

## What it is

Three houses arrived in one round, and the site went from three to **six**. The owner
asked for them in one message and gave three quite different amounts to go on, which is
why the three pages are three different states of finished:

| | what was given | what was built |
|---|---|---|
| **04 Ataraxia** | a theme — *"Their whole theme is angel statues and crosses; so accomodate that theme"* — and a count of five | the drawing, whole. No names and no writing. |
| **05 Grande Parfums** | an introduction, fifteen write-ups, a list of the house's fragrances, and *"Idk the theme to be honest"* | the writing, whole. No drawing. |
| **06 Les Abstraits** | *"make the page for four fragrances for now"* | the shape, four parts, and nothing else. |

## The shared shape, and why house.js exists at all

Pineward, ADAR and Almost Human each carry **their own copy** of the same two hundred
lines: the part-opening on a measured height, the rank down the side, and taking a
photograph off the page when its file is not there. That was the honest price of keeping
page scripts standalone while there were three of them, and it is written up as such in
Almost Human's report — *"the obvious candidate if a shared module is ever wanted"*.

Three more copies would have made **six**, and six places to fix one bug is not a
convention, it is a liability. So `house.js` is that module. The three new pages load it;
the three older pages were **left alone**, because refactoring three working pages and
their tests in the same round as adding three houses is how you break all six at once.

**It uses the `human-*` class names.** They were written for Almost Human and are the
house shape's names now — `.human-page`, `.human-part`, `.human-body`, `.human-rank`. The
prefix is where they were born, not what they mean, and renaming them would touch three
working pages and their tests to no end.

`house.js` draws nothing. A house's ground is its own script and its own canvas, and the
two never speak to each other — they simply stand on the same page.

## Ataraxia: the churchyard

The owner's theme, done as the page's ground. Down both margins the whole length of the
page stand **angels and crosses**, every one of them cut out of specks, each on a plinth
of its own.

| | |
|---|---|
| **an angel** | a plinth, a robe falling from the shoulders and widening to the hem, a head, and two wings sweeping up and back. There are no arms and no legs, because a statue in robes has neither. |
| **a cross** | a plinth, an upright and a crossbar — and a **lean** of a degree or two, its own, about the top of its own plinth, the way a settling stone leans. No two lean alike. |

**Nothing in it moves, and that is the drawing.** *Ataraxia* is the old word for a mind
with nothing troubling it, and this page is the exact opposite of Almost Human next door:
there every speck knows where it belongs and stands somewhere else, and the figure is
never quite a person. Here every speck stands **exactly** where it belongs and never
leaves — no stray, no drift, no idle. The margins are as still as stone, because stone is
what they are. There is a test for it.

Two things happen anyway, and both come from outside the statues:

- **The light** — a soft band crossing slowly down the window, one pass every 31 seconds.
  What it falls on is drawn more plainly. It is the only clock on the page.
- **The halo** — bring the pointer near a standing and a fine ring comes up over it: over
  the head of an angel, at the crossing of a cross. Pressed flat onto its own plane, so
  it reads as a ring seen a little from below rather than a circle drawn on the window.
  Eased in and out, so it arrives rather than switching on.

**It spends no accent colour at all**, like Almost Human. Pineward has its green and ADAR
its silver; this one is ink on the site's own paper, drawn paler than the crowd next door
because it is stone.

### The one thing that was wrong, and it was wrong twice

**A standing has to fit the margin, and that is what decides how big it is** — not the
other way round.

The first version picked a height and let the width fall out of it (`wide = tall * 0.62`,
118 to 205px). On a 1280 window the margin either side of the writing is 170px, so a
statue overlapped the column rule's quiet band — where everything is drawn at a twentieth
— by up to a third of itself. **Half of every angel was not drawn**, and what was left
read as a smear rather than as a figure. The first screenshot of this page is one thin
robe and one wing.

The fix is to hand a standing the room first and size it to fit. And then it was still
half wrong: the room was taken as the whole margin, while the quiet band starts
`EASED_IN` *inside* it. So `EASED_IN` came down from Almost Human's 80 to **34** and the
room is the margin less that. Those two numbers are one decision and have to move
together — the comment in `ataraxia.js` says so.

Why the difference from Almost Human: a wide soft edge is right for a crowd of figures,
where the point is that they fade off rather than stop. A churchyard is different. A
standing is a single object with a shape you are meant to read, and half an angel drawn
at a twentieth is not a soft edge, it is a missing wing.

## Grande Parfums: fifteen written, two waiting

All of this house is the owner's writing, from an expo. **Seventeen fragrances**: fifteen
written up, and **Genesys** and **Lounge Leather**, which they have not smelled, as names
at the foot with nothing behind them — the arrangement Pineward's eight have.

**The order is alphabetical, which they asked for in as many words**: *"Ill ask that you
arrange them alphabetically, as I will input them non-alphabetically"*. They sent the
fifteen in no order at all, so this is the one thing about the house that could quietly
be wrong and look completely fine. There is a test, and it compares the list against
**itself sorted** rather than against a list written out again — a list written out again
is the same mistake twice if it was made once. A number sorts before a letter, so
*5 Years Anniversary* is 01.

**Four names are spelled as the house spells them, not as the owner typed them.** They
sent a screenshot of the house's own list precisely so the names would be right, so:
*Dreaming Maldives* (they wrote Maldieves), *Giardino di Sorrento* (Di), *Karak & Shisha*
(Shisha and Karak), *5 Years Anniversary* (5 Year). That is the sanctioned kind of
correction — it turns a word into *the same word*. **Their prose is untouched**: `coffe`,
`wont`, `cant`, `IMO`, and `Cookie something (?)`, which is a title because they flagged
their own uncertainty about the name and that is theirs to resolve.

### The star

*"make a handdrawn star next to this one"* — on Vintage Memoir, which they called their
favourite from the house. It is an **SVG path with every point nudged off true and every
edge bowed**, so it is a star somebody drew rather than one a computer worked out, and it
is stroked rather than filled for the same reason.

The test asks that it is a drawn path with curves in it and no straight lines. That looks
pedantic and is not: a typed `☆` is indistinguishable from this in a screenshot and is
exactly the thing the owner did not ask for. Proved by typing one — the test fails.

### It has no ground of its own

The owner said *"Idk the theme to be honest"*, so none was invented. The page is the house
shape on the site's own paper. It is **waiting**, not finished; giving it a ground means
adding a canvas and a script of its own, the way `ataraxia.js` was added.

### The count is seventeen, not sixteen

The owner said sixteen. Counting what they actually sent gives seventeen: the fifteen in
the screenshot, plus **White Label**, which they wrote up and which is not in the visible
part of that list, plus **Cookie something (?)**, which is in neither. The screenshot
looks cut off after *Vintage Memoir* — alphabetically that is exactly where White Label
would be. **Left at seventeen and raised with the owner**, rather than quietly dropping
one to make the number they said.

## Les Abstraits: four, and nothing else

*"make the page for four fragrances for now"*. Four parts, no names, no writing, no
ground.

**One name is known and is deliberately not used.** The owner mentions *"Belle Ame by Les
Abstraits"* in Grande Parfums' Vintage Memoir. Which of these four it is, and how they
want it spelled, is theirs to say.

## Nothing here was guessed at

Two houses arrived with no writing at all, and the standing temptation was to invent some.
Nothing was. No fragrance has a made-up name, no house has an invented theme, and every
unwritten paragraph says it is unwritten in a dashed box (`p.human-waiting`) rather than
standing in as prose. An unnamed fragrance is *Untitled*, set in italic muted type
(`.human-untitled`) so a list of them reads as work still to come rather than as a house
full of things called Untitled. There is a test that the two unwritten houses say so and
that the written one does not.

## How to test it

```bash
npm test -- tests/houses.spec.js
```

Thirteen tests. Five of them were **proved against the real fault** before being trusted:

- **`the churchyard is drawn, and every standing fits its margin`** — the bug above. It
  samples down **eight screens** rather than the first one, and that is the whole reason
  it works: only two standings are on screen at once and how wide those two happen to be
  is the seed's business, so measured on the first screen alone the fault shows **nothing
  at all** (0 pixels in the quiet band either way). Over the whole page it is unmissable:
  **532 pixels with the fault, 0 with it fixed.** The ceiling is 60.
- **`nothing in the churchyard drifts`** — the house's name said as a behaviour. It
  measures how much of the ink is the *same pixels* a second later; the light changes how
  darkly a speck is drawn but not where it is. With a pixel of drift put in, it fails.
- **`a halo comes up under the pointer, and goes again`** — the one thing on that page
  that answers the hand. With `HALO_SPECKS` at 0 and the lift at 1, it fails.
- **`Grande Parfums is in alphabetical order`** — with one fragrance moved out of order,
  it fails.
- **`the standout star is a drawn path`** — with a typed `☆` in place of the SVG, it
  fails.

The rest: all six houses on the sheet in their own order; the two unsmelled fragrances
being names at the foot rather than parts; the shared shape working on **all three**
houses (a part opens on a measured height, and the rank has one tick per fragrance);
the rank filling from the first pixel of scroll and finishing full; the pages being all
of their writing with the scripts blocked; and an unwritten fragrance saying so.

The missing-photograph 404s are allowed for, the way Almost Human's spec allows them:
not one of these houses has its pictures yet, and every part asks for the file it wants
by name so it shows the moment that file is there.

By hand:

```bash
npm run serve    # then http://localhost:8123/works/ataraxia.html
```

Put the pointer on a statue. That is the page.

## Known issues / TODO

- **Ataraxia has no names and no writing**, and neither has Les Abstraits. Both are
  waiting on the owner, and both say so on every part.
- **Grande Parfums has no ground.** Waiting on the owner to say what the house is.
- **No photographs anywhere.** All three folders in `images/` hold only a README naming
  the files their page is already asking for.
- **Neither Ataraxia nor Les Abstraits is in the Fragrances table**, because a row needs
  a name. Adding one is a row per fragrance pointing at `#part-NN`, and
  `repository.spec.js` checks that end of it.
- **Seventeen against the owner's sixteen** on Grande Parfums — see above.
- **The three older houses still carry their own copies** of what `house.js` now does.
  Moving them over is a clean follow-up and was deliberately not done in the same round
  as adding three houses.
