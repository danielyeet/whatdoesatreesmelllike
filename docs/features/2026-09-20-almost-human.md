# Almost Human

Date: 2026-09-20

Files: `almost-human.js` (~545 lines), `works/almost-human.html`, the `human-*` block in
`style.css`, `images/Almost-Human/`, `tests/almost-human.spec.js`; and the three places a
new house has to be added — the frame and the Fragrances row in
`categories/scent-descriptions.html`, the `PAGES` line in `search-page.js`, and ADAR's
"continue to 03" link.

## What it is

The third house in Scent descriptions, and **five fragrances**. The owner asked for a
page "themed with humanoid particulates or some theme of that sort", resembling the other
two houses in structure and carrying everything they carry.

The shape is theirs exactly — a head, an introduction, and then the fragrances, each
compacted to a number, a small square and a title until it is opened. What differs is the
ground, and there is now one per house:

| house | its ground |
|---|---|
| [Pineward](2026-09-16-pineward.md) | a **wood**, conifers down both margins |
| [ADAR](2026-09-17-adar.md) | a **void**, a hole with soundings ringing out of it |
| Almost Human | a **crowd**, people standing down both margins |

## The crowd, and why the house's name is the drawing's behaviour

Every figure is a person drawn **entirely in specks** — no outline, no image. It is built
from seven capsules (a head, a neck, a torso, two arms, two legs), each a line with a
thickness, and the specks are scattered *through* them so a figure is a shape a crowd
happens to be making.

And then every one of those specks is put **somewhere else**. Each knows exactly where it
belongs and stands up to `STRAY` — a **fifth** of the figure's own height — away from it,
fixed for the life of the figure.

It was a twentieth at first, and at a twentieth a figure standing on its own still read
as a person. The owner asked for the opposite: the crowd should *"indicate in no way
shape or form that they are going to converge on a humanoid body"* until the hand
arrives. At a fifth it is a cloud, and the person is entirely the pointer's doing.

**Bring the pointer near and the specks come home.** The figure resolves under your hand
and comes apart again when you leave. That is the house's name, said as a behaviour
rather than written on the page, and it is the whole idea: it is what Pineward's
**bloom** and ADAR's **spotlight** are to those pages.

**Anywhere on the figure will do.** The hand used to be answered by a circle drawn round
the figure's own middle, which meant it came all the way home at the navel and only part
of the way at the crown or the soles. The owner asked to be able to *"hover anywhere on
them"*, so the distance is measured to the **box the figure actually stands in** —
inside it is all the way home, and outside it eases off over `HAND` pixels. The box's
half-width is measured off the figure's own specks at build time rather than guessed, so
a figure that leans hard is reached at its elbow like any other. Measured: crown, middle
and soles used to give 69 / 63 / 75 against a width of 95 apart; they give 63 / 63 / 68
now.

**And there are half as many specks again.** `FIG_SPECKS` went from 420—620 to
760—1080, which the owner asked for; each one carries a little less of the ink
(`FIG_INK`) so the figure comes out fuller rather than heavier.

It never resolves *completely* — `STRAY_NEAR` keeps a tenth of the stray whatever
happens. A figure that came exactly home would be the wrong drawing.

## Something is wrong with every one of them

The owner asked for each figure to carry a fault of its own, and for it to show **only
once the figure has been held together for a moment**: *"the glitching will only happen
when hovered and after a short delay of being fully formed."* So it is the HOLDING that
is counted (`HELD_FOR`), and letting go of a figure puts the count straight back to
nothing along with the fault. A thing that had just worked and then fails reads as a
fault; noise does not.

Four of them, running in order down the page so no two neighbours are alike:

| | |
|---|---|
| **head** | the head comes apart and re-forms in slices |
| **torso** | the torso slips *and loses specks outright* — the owner asked for one with particles missing from it |
| **arm** | one arm, left or right, and nothing else on the figure |
| **all** | every part of it, each on a clock of its own, so the head and the legs never go at the same moment |

**A speck knows which part of a person it is**, which is the whole of what this needs: a
head that comes apart is the specks whose part is the head, and nothing else moves.
`makeBody` returns `[x, y, part]` and the fault asks `faulty(part)`.

**The fault is a PATTERN, not a fizz.** A band of the figure a twentieth of its height
tall is pushed sideways, and some bands are not drawn at all; which band does what is a
stable hash of `(band, tick, the figure's own seed)`, so it holds for a frame and then
jumps, the way a broken picture does. A per-frame random number would shimmer, which is
the opposite.

### It is a beat, and it is subtle

Both asked for in the same note, and both are corrections to how it first went in.

**It comes and goes.** It used to arrive once the figure had been held long enough and
then simply stay, for as long as your hand was there. The owner asked for *"1 second
glitched, and 5 seconds not"*: so from the moment it has been held long enough there is a
beat of `GLITCH_FOR` in every `GLITCH_CYCLE` — one second in six — easing in and out
over `GLITCH_EDGE` at each end, and the figure stands whole in between.

**And every part of it is about half what it was.** `GLITCH_PUSH` 0.3 — 0.14 (how far a
slice slips), `GLITCH_DROP` 0.28 — 0.12 (the share that go missing), the torso's extra
loss 0.3 — 0.15, the vertical slip 6px — 3px, and `GLITCH_RATE` 11 — 8 re-rolls a
second. The owner's word was *subtle*.

## The things that are not people

The owner asked for *"other things that are weirdly formed by particles and geometry,
such as a sun, rain that is animated and falling and maybe add something else"*. A sun, an
empty chair and the rain went in; the round after, they asked for **the sun and the chair
gone**, the rain kept, and *"particle rays that blast from here and there"* in their place.

So there are two now, and both are weather. Both live in **window space** rather than down
the document — they fall and fly on the screen, they do not stand in the writing — and
both go quiet over the reading like everything else here.

| | |
|---|---|
| **the rain** | Falling, the whole length of the page, each drop a short string of five specks rather than a line. |
| **the rays** | A spray of specks fired out from a point somewhere in the margins, in a direction of its own, thrown wider the further along the ray they sit, brightest at the head and gone at the tail. One goes off every second or two, from nowhere in particular. Four can be travelling at once. |

Three things about the rays that are not obvious from the code:

- **A ray is a thing travelling, not a fizz.** Where each of its 140 specks sits along it,
  how far it is thrown off the line of it and how big it is drawn are all rolled **once,
  when it is armed**, and held for that firing. Rolling them per frame would be static.
- **It goes out rather than being switched off.** The head travels fast and slows
  (`1 - (1-p)^2.2`), and the whole thing fades over its own life, so it ends by being
  gone rather than by disappearing.
- **Eighteen specks was not a blast.** The first go had `RAY_BEADS` at 18 travelling up to
  1100 pixels, which is a thin dotted line nobody would notice; it is 140 specks over 150
  to 660 pixels now, which reads as a spray.

Both roll their own numbers from an LCG of their own (`roll`), **not** from the seeded
`random()` the crowd is built from: taking numbers out of that run anywhere else would
move every figure on the page.

**What went with the sun and the chair.** `SUN_*`, `CHAIR`, `PROP_INK`, `PROP_STRAY`,
`makeSun`, the whole `props` population and its drawing loop, and the test that checked
the sun was round. `cloud()` stayed — it was a refactor the crowd uses too — and so did
`sample()`, which `makeBody` calls. Why they were there is worth keeping: a figure is
meant to give no hint of what it is until the hand arrives, but a sun that strays that far
is nothing at all, so the props had a stray a tenth of the crowd's. The rays have no stray
to speak of; they are a thing in flight.

## No two of them are the same crowd

Height, pose, how many specks (`FIG_SPECKS`, 420 to 620), how heavily they are drawn
(`FIG_INK`) and how far they stray (`STRAY_VARY`) are all a figure's own, so the margin
reads as a row of different people rather than one person printed over and over.

The resolving is asked of the **figure's own middle**, not of each speck, so a figure
comes together as a person rather than a patch of one sharpening under the pointer. And
it is eased towards rather than set, so it arrives and departs at a pace.

## Three things that were wrong on the way

- **The unit box has to be square.** The first go scaled a figure's x by 0.46 of its
  height and its y by the whole of it, which halved every width in the figure and turned
  the whole thing into a vertical smear. A person drawn in a 1×1 box already has the right
  proportions; the drawn body only spans about 0.37 of the box's width, which is where the
  1:2.6 comes from.
- **The torso reached up through the head.** Its capsule started at y 0.195 with a radius
  of 0.098, so it began at 0.097 — above the head's own bottom edge. Head, neck and chest
  came out as one blob and nothing read as a person. The parts do not overlap now where a
  person's do not.
- **The stray has to be a share of the figure's height, not a number of pixels.** At a
  fixed 26px it was a soft edge on a tall figure and a shapeless cloud on a short one.

## Where the figures stand

In the margins the writing leaves, and the page's own measure decides where that is: the
head, the introduction and the parts are all one column `COLUMN` (940px) wide — the same
number `style.css` keeps — so what is left either side of it is where a figure belongs.
On a window too narrow to have margins they stand near the edges instead and `lit()`
takes them down to a twentieth over the reading.

`lit()` asks about the **column**, not about a share of the window, so the quiet band is
exactly where the reading is however wide the window happens to be.

## The rank

Pineward's **trunk** and ADAR's **sounding** by a third name, and it says the same two
things they do, separately:

- the **fill** is how far down the page you are, **from its very first pixel** — the owner
  asked for that on all three houses;
- the **ticks** are how many fragrances you have been past.

And the same rule at the foot: once the page itself has been passed, so has everything on
it. The last fragrances never reach a line a third of the way down the window because the
page runs out before they can, and all three houses had that fault.

**The reading says "Introduction" only until the first fragrance has been passed.** It
used to name whatever was filling most of the window, which on a page this short meant the
introduction was still on screen at the foot of it — and the corner read "05 / 05 ·
Introduction". It is asked of the count now.

## This page spends no accent colour at all

Pineward has its green and ADAR its silver. This one is ink on the site's own paper,
untinted, and what it spends instead is **density**. It is the second page on the site to
spend none, after the chamber. There is a test.

## The house's mark, in the glitch

The owner sent their logo and asked for it to be part of what goes wrong with a figure:
*"maybe make 1/3 of the glitches of the guys face be replaced with the logo or
something"*. So on about a third of the beats, a figure whose **head** is the faulty part
loses its face and the specks that were the head stand as the mark instead — which is the
house's name said one more way: the thing that is almost a person, and then for a second
is a brand.

Four things about how it is done:

- **The mark is read off the owner's own file** (`images/Almost-Human/AH_Logo_Black.jpg`)
  rather than drawn here from a guess at its geometry. The image goes on a small offscreen
  canvas once, every dark pixel becomes a place a speck may stand, and the list is shuffled
  and capped. It is their logo, so it should be their logo. Until the file has arrived the
  list is empty and a head simply glitches the way it always did — which is the whole of
  the guard this needs.
- **The roll is once per beat**, off the beat's own number and the figure's own seed, so
  the mark holds for the whole of that second instead of flickering in and out of it, and
  so the same figure does not go to the logo every time.
- **It is drawn bigger than the head and two pixels a speck.** A head is about 150 specks;
  at the head's own size, strung round a ring, that is a smudge. At `LOGO_BIG` 2.1 and two
  pixels each they nearly touch and the ring reads.
- The specks **travel to it** on the same `glitch` the rest of the fault uses, so the face
  comes apart into the mark rather than being swapped for it.

## The picture, and the writing

The owner's photograph of the house is at the head of the page. The original
(`This one.webp`, 5152 × 7728 and 4.2MB) is far too big to send to a browser, so what is
loaded is a 1600px copy in `house-web/` beside it — the same arrangement Pineward's
gallery uses.

**All five are written now**, and the introduction and the standfirst with them, in the
owner's own words. The house's second line is theirs as well: *Abstraction done quite
well*, which replaces the placeholder tagline the page carried.

One thing to leave alone: their spelling and punctuation. `celcius`, `Maaaaaaaybe`,
`youre`, `isnt`, `Dry down?` with its question mark, and **amboricinide** in one paragraph
and **ambrocinide** in the next are all as they wrote them.

One fragrance's writing carries a list (`ul.human-list`); the rest are prose. And the
stage labels are theirs too — `Mid 1` and `Mid 2` on Burning Bridges, where the others
have one middle.

## What is the owner's, and what is waiting

**All five are written now.** The owner gave the names, and then the writing:
**Burning Bridges**, **Dear Future**, **Desert Hope**, **Ritual Code**, **Silent Rain**,
in that order — which is alphabetical, as Pineward's are.

The one thing said about any of them is Desert Hope, which the owner placed in
[The Architecture of Sweat](2026-09-17-the-essay-pages.md) (`works/theory-02.html`) as
cumin-y, dark and natural, adding that it could be argued it is carnal. Part 03 says that,
and says it as a quotation of their own page rather than as new prose.

Every unwritten paragraph says so in a dashed box (`p.human-waiting`) rather than standing
in as writing. An unfinished house should read as unfinished, not as thin — and nothing
here has been invented.

## How to test it

```bash
npm test -- tests/almost-human.spec.js
```

Fourteen tests: the five being really five and numbered in the markup; a fragrance being
a title until it is opened; the crowd being drawn and keeping out of the writing's column;
the rank filling from the first pixel and finishing full; no accent colour anywhere; the
crowd standing still under `prefers-reduced-motion`; all of the writing being there with
the script blocked; and the five below.

Five of them are regressions, and every one was **proved against the real fault** before
being trusted:

- **`a photograph that is not there yet leaves the hatch showing`** — the first go added an
  `error` listener and nothing else, which never fired: a missing picture has usually
  failed *before* this script has run at all, and a listener added afterwards is never
  told. Every placeholder stayed hidden behind a broken picture. The fix also asks
  `complete && !naturalWidth` at attach time. With the fix taken out, this test fails.
- **`a figure comes home under the pointer and comes apart again`** — the whole idea of the
  page. Its first version measured the ink's **mean distance from its own middle** and was
  nearly useless: a figure 250px tall has a spread of about 40 whether or not its specks
  have come home, because its own size swamps the few pixels of stray. With the resolving
  switched off entirely it still passed (42.55 → 41.86, under a plain "smaller than").
  It measures the ink's **width** now, between its third and ninety-seventh percentile —
  the figure is narrow, so the stray is most of what decides it — and it asks for a
  measured share rather than merely "smaller". With the resolving off it reads 66 → 67 and
  fails, as it should.

- **`a figure comes home from the pointer anywhere on it`** — the crown, the middle and
  the soles, and all three have to draw the figure together by the same amount. The two
  ends rather than near them, because the old circle was generous enough that a point
  part way up still came most of the way home. With the circle put back it reads
  67 / 63 / 73 against a floor of 8.2 and fails.
- **`a held figure glitches in beats, and stands whole between them`** — it holds a
  figure for fifteen seconds and measures the **longest stretch it stands still for**.
  Between beats a figure moves only its pixel of idle drift, so its ink count barely
  changes from one sample to the next; during a beat the pattern re-rolls eight times a
  second and it changes every time. With the fault running on, that longest run is 4
  samples; with the beat it is 24 to 59 depending on how fast the machine can sample.
  The floor is 14, set between the two rather than near either. The first version of this
  test compared each sample against the ninetieth percentile *of the samples themselves*,
  which is self-referential: with the fault running on it read 30.6% against a ceiling of
  30% and only just failed.
- **`rays go off in the margins, from here and there`** — a ray is a thing that goes
  off, which is what this measures: the ink on the whole canvas swings as one fires and
  goes out. Said as a **share** of the ink rather than a count of pixels, because how many
  there are at all depends on the window and on the screen's own scale, and the suite runs
  at neither of the sizes it was measured at. With the rays it is 14.6%; with them off —
  the rain wrapping and the figures drifting their pixel — it is 1.5%. The floor is 7%.
- **`the rain falls`** and **`the rain does not fall when motion is turned off`** —
  measured at the very edge of the window, in a strip no figure reaches even at its
  strayest, so what is counted there is the rain and nothing else. With the falling taken
  out the count is the same twelve times over and it fails.

By hand:

```bash
npm run serve    # then http://localhost:8123/works/almost-human.html
```

Put the pointer on a figure and take it away again. That is the page.

## Known issues / TODO

- **None of the five has its writing yet.** The introduction and the standfirst are
  waiting too.
- **No photographs.** `images/Almost-Human/` holds only its README. The page's own answer
  — take the `<img>` off, leave the hatch — is what is showing.
- All five are in the Fragrances table, pointing at `#part-01` to `#part-05`. Renumbering
  the house means re-pointing them in the same turn; there is a test.
- **No groups.** ADAR's eleven are in four groups and Pineward's fifty-two in four strata;
  five fragrances did not obviously want dividing, and what the groups would be is the
  owner's to say. The markup takes a group wrapper without anything else changing.
- **The part-opening machinery is now in three files** — `pineward.js`, `adar.js` and this
  one — because each page script here is standalone by design. It is the same treatment in
  all three for the same reason the owner gave ("smooth and gradual, not so sudden"), and
  it is the obvious candidate if a shared module is ever wanted.
