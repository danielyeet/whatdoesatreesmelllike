# Almost Human

Date: 2026-09-20

Files: `almost-human.js` (~1,170 lines), `houses/almost-human.html`, the `human-*` block in
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
| Almost Human | a **crowd**, people standing in whatever room the page leaves |

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

## The thing that is not a person

The owner asked for *"other things that are weirdly formed by particles and geometry,
such as a sun, rain that is animated and falling and maybe add something else"*. A sun, an
empty chair and the rain went in; the round after, they asked for **the sun and the chair
gone**, the rain kept, and *"particle rays that blast from here and there"* in their
place; the round after **that**, having seen the rays, they asked for those gone as well.

So there is **one** thing here that is not a person, and it is the rain. It lives in
**window space** rather than down the document — it falls on the screen, it does not stand
in the writing — and it goes quiet over the reading like everything else here. Falling the
whole length of the page, each drop a short string of five specks rather than a line.

It rolls its own numbers from an LCG of its own (`roll`), **not** from the seeded
`random()` the crowd is built from: taking numbers out of that run anywhere else would
move every figure on the page.

### What went with the sun, the chair and the rays

`SUN_*`, `CHAIR`, `PROP_INK`, `PROP_STRAY`, `makeSun`, the whole `props` population and its
drawing loop went with the first two, along with the test that checked the sun was round.
`RAY_COUNT`, `RAY_BEADS`, `RAY_SPEED`, `RAY_LONG`, `RAY_LIVE`, `RAY_WAIT`, `RAY_FAN`,
`RAY_INK`, `armRay`, `buildRays`, `drawRays`, the `rays` array and both of its call sites
went with the rays. `cloud()` stayed — it was a refactor the crowd uses too — and so did
`sample()`, which `makeBody` calls.

**The test turned round rather than going.** A ray was a thing that *went off*, and the
test for it measured exactly that: the amount of ink on the whole canvas swinging by well
over a tenth as one fired and went out. That is now the guard that they are gone —
`nothing blasts out of the margins` asks for a swing of **less** than 6%. It was measured
both ways by putting the rays back and running it: **12.8% with them** (it fails, naming
the number), **1.0% without**. The ceiling sits between the two rather than near either.

Why the rays were built the way they were is worth keeping, since the owner may ask for
something like them again: a ray rolled where each of its 140 specks sat along it, how far
it was thrown off the line and how big it was drawn **once, when it was armed**, and held
all three for that firing — rolled per frame it was static rather than a thing travelling.
It faded over its own life rather than being switched off. And the first go had 18 specks
travelling up to 1100 pixels, which is a thin dotted line nobody would notice; it took 140
specks over 150 to 660 pixels to read as a spray at all.
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

## Going quiet over the reading

`lit()` is what keeps the drawing off the writing where the two share a line of the page.
It asks about the **column** — the head, the introduction and the parts are all one
`COLUMN` (940px) wide, the same number `style.css` keeps — rather than about a share of the
window, so the quiet band is exactly where the reading is however wide the window happens
to be. Below the column there is no room either side to take out, and that used to mean the
quiet band covered the whole page and the entire drawing was rendered at a twentieth: on a
phone this page had no ground at all. There is a floor now, and it is a ternary rather than
a `Math.max` so a wide window is untouched. See [the phone
report](2026-09-21-the-site-on-a-phone.md).

**The rain is asked about it, and so is a figure standing in one of the margins. A figure
standing in a clearing is not** — it is not over the writing to begin with, and fading it
there would be a drawing dimmed for a reason that is not true. Where a figure is allowed to
stand at all is below, under "Where the figures stand, and what they may not stand on".

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

## The house's mark, shown by the hand

**It is not printed anywhere on this page any more.** It stood at the head of the piece
for a round; the owner asked for it to be *"a hover-to-display thing, similarly to adar"*
— ADAR's mark is drawn inside the void under the pointer and nowhere else — and for the
glitch itself to be what shows it: *"when you hover them, they glitch out and the
glitching part of them is replaced or glitched into the logo itself."*

So the only place the logo appears is in the crowd. Hold a figure together, it starts to
fail, and **whatever part of it is faulty stands as the mark for the beat**: a head that
comes apart in slices comes apart into the mark, a torso that slips slips into it, and the
figure whose fault is all of it goes to the mark entire. It is the house's name said one
more way — the thing that is almost a person, and then for a second is a brand.

It used to be **a third of the beats, and only on a figure whose head was the faulty
part**. That was right while the logo also stood at the head of the page: the mark was
already there to be seen, and the glitch was a second sighting of it. It is not right now
that this is the only place it appears — a mark you might see on one figure in six is a
mark nobody finds. It is **every beat, and whatever part is wrong**.

Five things about how it is done:

- **The mark is read off the owner's own file** rather than drawn here from a guess at its
  geometry. The image goes on a small offscreen canvas once, every dark pixel becomes a
  place a speck may stand, and the list is shuffled and capped. It is their logo, so it
  should be their logo. Until the file has arrived the list is empty and a part simply
  glitches the way it always did — which is the whole of the guard this needs.
- **A speck knows which part of a person it is**, and so does the mark. `markBox` takes the
  parts that are faulty, works out the box they stand in from the figure's own specks, and
  the mark is drawn over that. Off the specks rather than out of `BODY`, because by the
  time a figure is built its lean has already swung the arms and legs, and a capsule's
  radius is not in its two end points.
- **How big it is drawn is asked of HOW MANY SPECKS THERE ARE**, not of the part they came
  from. An arm is ninety specks and a whole figure is nine hundred; strung round the same
  ring the first is a scatter and the second is a blot. The ring is sized to keep the
  density about the same — `LOGO_DENSITY` times the square root of the count — and then
  never drawn smaller than the part it replaces, or the mark sits inside a figure instead
  of standing where part of one was.
- **And never wider than the room the figure has.** The mark is square and stands on the
  part, so it is wider than the person is — widest of all on the one whose fault is the
  whole of it. It is widened out from the figure's own box when the crowd is built, until
  it would touch the writing or leave the window, and held to that: a logo half off the
  side of the screen is not a logo.
- The specks **travel to it** on the same `glitch` the rest of the fault uses, so the part
  comes apart into the mark rather than being swapped for it. It is drawn two pixels a
  speck and a little more plainly (`LOGO_INK`), so the ring reads as a ring.

`LOGO_ODDS`, `LOGO_BIG`, `HEAD_AT` and `HEAD_TALL` went with the old behaviour, and so did
the `figure.human-mark` block at the head of the page and its `.human-mark` styles.

## Where the figures stand, and what they may not stand on

**The owner asked for the crowd not to be put over anything on the page.** So a figure
stands in the room the page actually leaves — and the page is ASKED where that is rather
than told. Every block of writing on it is measured (`readContent`), and a figure is only
put somewhere its whole box — its specks, its stray and a little air — misses every one of
them (`clearOf`).

Two kinds of place, and which is tried first is the whole of the difference between a wide
window and a phone:

| | |
|---|---|
| **the margins** | left and right alternately, each a little way in or out of its own margin so the two columns are not a pair of railings. Where the crowd has always stood, and where it still is on a wide window. |
| **the clearing** | out in the page itself. On a window with margins that would be over the writing; on one without, it is the only room there is. |

The first place that misses every block is where the figure goes. If none does it is tried
once more at two thirds the size, and then given up on. **A place is never taken because it
happens to be empty on this scroll** — the whole page is checked at once, in document
space.

**A figure in a margin still goes quiet the nearer it gets to the reading** (`lit`), which
is what it always did. **One standing in a clearing is over nothing at all, so nothing is
taken off it**: faded there it would be a drawing dimmed for a reason that is not true.

### And the page makes a clearing on purpose

The writing here is a 940px column with 64px of padding either side, so below about eleven
hundred across there is **no margin left to stand a person in** — and on a phone there is
nothing like one. The page carries an empty band before the introduction for exactly that
(`.human-gap`), sized in the stylesheet and worth nothing above 1111px, where the margins
are there and an empty band would only push the writing down. It is the answer to the
owner's *"If there are none, make before the introduction"*, and it is where the mark
stood before it went into the hand.

**The crowd is placed against the writing, so it is placed again once the writing has
stopped moving**: a webfont arriving can shift every block on the page without changing its
height enough for `size` to notice on its own, so `document.fonts.ready` rebuilds it.

## The two pictures, and what became of them

**They changed places, and then one of them left the page altogether.** The owner's
photograph, `This one`, stood at the head of this page for a round; they asked for it to be
*"used on the page SD"* instead — it is this house's picture on the contact sheet now, the
third frame in `categories/scent-descriptions.html`, which had been the hatch until then.
The original (5152 × 7728 and 4.2MB) is far too big to send to a browser, so what is loaded
there is the 1600px copy in `house-web/` — the same arrangement Pineward's gallery uses.
That frame is square and the picture is portrait, so it is cropped to its middle, which is
where the bottle stands.

**The house's mark took its place at the head of this page, and has since gone into the
hand.** There is no `figure.human-mark` and no `.human-mark` in the stylesheet any more:
the head of the page is its kicker and its name with the house's line under it, and then
the clearing the crowd stands in. (Its standfirst went on 2026-09-24 with every house's —
see [the newer houses](2026-09-21-the-newer-houses.md).) See "The house's mark, shown by the hand" above.

**The file has no ground of its own**, and that is still the one thing about it worth
knowing, because `almost-human.js` reads it for the glitch. The owner's logo is a JPEG,
black on pure `#ffffff`, and this page's paper is `#fafaf9` — dropped in as it came, the
mark was a white square standing a shade brighter than the page, which is exactly what it
looked like the first time. A `mix-blend-mode: multiply` was tried and **did nothing**: the
header made a stacking context of its own, so there was no backdrop inside it to multiply
against, and the image was drawn unchanged (measured: `#ffffff` inside the box against
`#fafaf9` outside it). So `ah-logo.webp` is black on **transparent**, made from their file.

The sampler wants that anyway: it skips any pixel with an alpha under 40, so the ring's
inside is simply not a place a speck may stand. Read off a 116 grid the transparent file
gives 6,435 places where the opaque original gave 6,012 — the difference is the ring's
anti-aliased edge, and only 900 of them are kept.

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
a title until it is opened; the crowd being drawn and keeping out of the writing's column
(which it now does by never being put there at all, rather than by being faded once it is);
the rank filling from the first pixel and finishing full; no accent colour anywhere; the
crowd standing still under `prefers-reduced-motion`; all of the writing being there with
the script blocked; and the five below.

Five of them are regressions, and every one was **proved against the real fault** before
being trusted:

- **`a photograph that is not there leaves the hatch showing, and the ones that are stay`**
  (it said *not there yet* until the five arrived on 2026-09-25; it now makes Ritual Code's
  answer 404 itself, and checks the other four keep theirs) — the first go added an
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

- **`a figure comes home from the pointer anywhere on it`** is the one test in the suite
  that has been seen to **flake**: it failed once in a full run on 2026-09-21 and passed
  on its own and in the next full run. It measures how far a figure has come home a fixed
  number of milliseconds after the pointer arrives, so a loaded machine near the end of a
  nine-minute suite can miss the window. Worth a re-run before believing it; not worth
  diagnosing twice.
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
- **`nothing blasts out of the margins — the rays are gone`** — the ray test turned round
  when the owner asked for the rays gone, rather than deleted. A ray was a thing that went
  *off*: the ink on the whole canvas swung as one fired and went out. What is left — the
  rain wrapping and the figures drifting their pixel — barely moves. Said as a **share** of
  the ink rather than a count of pixels, because how many there are at all depends on the
  window and on the screen's own scale, and the suite runs at neither of the sizes it was
  measured at. Proved by putting the rays back and running it: **12.8%**, and it fails
  naming that number; with them gone it is **1.0%**. The ceiling is 6%, between the two.
- **`the rain falls`** and **`the rain does not fall when motion is turned off`** —
  measured at the very edge of the window, in a strip no figure reaches even at its
  strayest, so what is counted there is the rain and nothing else. With the falling taken
  out the count is the same twelve times over and it fails.

By hand:

```bash
npm run serve    # then http://localhost:8123/houses/almost-human.html
```

Put the pointer on a figure and take it away again. That is the page.

## Known issues / TODO

- **No photograph per fragrance yet.** The house's own two pictures are in —
  `house-web/ah-logo.webp`, which is now only ever drawn in the glitch, and `this-one.webp`
  on the contact sheet — but `images/Almost-Human/` holds no `burning-bridges.jpg` and none
  of the other four the README names. The page's own answer — take the `<img>` off, leave
  the hatch — is what is showing, and there is a test for it.
- **The crowd is thin on a phone, and that is the honest cost of not standing on anything.**
  A phone has one clearing worth standing in, so what was a column of people down each
  margin is a small group near the top of the page and then weather for the rest of it. If
  the owner wants more of them there, the answer is more clearings — a band between the
  introduction and the fragrances would take another group — rather than putting the crowd
  back over the writing.
- All five are in the Fragrances table, pointing at `#part-01` to `#part-05`. Renumbering
  the house means re-pointing them in the same turn; there is a test.
- **No groups.** ADAR's eleven are in four groups and Pineward's fifty-two in four strata;
  five fragrances did not obviously want dividing, and what the groups would be is the
  owner's to say. The markup takes a group wrapper without anything else changing.
- **The part-opening machinery is now in three files** — `pineward.js`, `adar.js` and this
  one — because each page script here is standalone by design. It is the same treatment in
  all three for the same reason the owner gave ("smooth and gradual, not so sudden"), and
  it is the obvious candidate if a shared module is ever wanted.

## 2026-09-25 — the five bottles, and a credit

The owner uploaded the five fragrance pictures to `images/Almost-Human/perfumes/`
(`Burning_Bridges_Clean.webp` and the rest) and the page now asks for each by that name, in
the small square and the full picture both — it had asked for `burning-bridges.jpg` and so
on, which never arrived, so nothing showed. With pictures on the page, it carries a credit
line like every other house, naming **almosthuman.store** as where they came from — the
owner's word: *"Credit is the Almost Human Website."* See [the images
report](2026-09-17-images-folder-per-house.md).
