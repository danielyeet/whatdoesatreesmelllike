# Ataraxia, Grande Parfums and Les Abstraits — and the shape they share

Date: 2026-09-21

Files: `house.js` (~313 lines, new), `ataraxia.js` (~385 lines, rewritten 2026-09-22),
`grande.js` (~265 lines, new 2026-09-22),
`houses/ataraxia.html`, `houses/grande-parfums.html`, `houses/les-abstraits.html` (all new),
the `house-*` and `human-star` rules in `style.css`, `tests/houses.spec.js` (new),
`images/Ataraxia/`, `images/Grande/`, `images/Les-Abstraits/`; and the four places a new
house has to be added — the frame and the Fragrances rows in
`categories/scent-descriptions.html`, the `PAGES` lines in `search-page.js`, and the
footer chain through `houses/almost-human.html`.

## What it is

Three houses arrived in one round, and the site went from three to **six**. The owner
asked for them in one message and gave three quite different amounts to go on, which is
why the three pages are three different states of finished:

| | what was given | what was built |
|---|---|---|
| **04 Ataraxia** | a theme, then the bands that replaced it, then on 2026-09-22 the five fragrances' **names** | the drawing, whole and rebuilt once; five named fragrances with two-part notes. The writing is still the owner's. |
| **05 Grande Parfums** | an introduction, fifteen write-ups, a list of the house's fragrances, and *"Idk the theme to be honest"* — then, a round later, *"subtle designs please"* | the writing, whole, and a ground that claims no theme. |
| **06 Les Abstraits** | *"make the page for four fragrances for now"*, then on 2026-09-22 the four **names**, then on 2026-09-23 the **writing** | four named fragrances, all four with notes off the house's own page, and the owner's writing for the house and every one of them. |

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

## Ataraxia: the bands

**The page is dark gray, and bands of glowing white particles cross it at their own
angles.** The owner asked for exactly that, and for one thing more that decided how the
whole drawing is built: *"I want them to go behind the text. Idk how but make it so that
the readability is good."*

| | |
|---|---|
| **a band** | a spine crossing the window at its own angle, with specks scattered about it — heaped along the middle and thinning to nothing either side, so a band has a bright core and no edge you can point at. |
| **the crest** | a swell of brightness travelling along a band's own length on its own slow clock, eleven to twenty-three seconds a pass. **The specks never move**; what moves is where the light is. That is the whole of the glow. |
| **the kindle** | what answers the hand: the specks within reach of the pointer burn brighter, eased in and out so it arrives rather than switching on. |

Each band leans six to twenty-six degrees off flat, and the sign is rolled with a memory
of the last one, so two can lean the same way but three cannot — rolled freely, a run of
four leaning the same way reads as a pattern rather than as weather.

### What replaced a churchyard

Angels and crosses stood down both margins here for one round, cut out of specks and
perfectly still — *ataraxia* said as a behaviour. The owner asked for them gone: *"Remove
the ataraxia crosses and angels."* Nothing of it is in `ataraxia.js` now: no angel, no
cross, no plinth, no lean, no halo, and no light crossing the window. The glossary keeps
the words, because they are still what the owner will call the thing they remember.

The bug that page was built with, and the two rounds of fixing it, went with it — a
standing that had to be sized to fit the clear part of its margin is not a problem a band
crossing the whole window can have. It is written up in the git history and is not
repeated here, because nothing in the file it was about survives.

### How the reading is kept, which is the whole design

The bands are **not** kept out of the middle of the page. A band that stopped at the
column and started again on the other side would not be a band, and going behind the text
is what was asked for. Two things keep the reading instead:

- **The quiet.** A speck standing over the column is drawn at **`QUIET`** — 0.26 — of its
  strength, easing in over 96px either side so there is no line down the page where it
  begins.
- **The bloom stops before the column.** A speck's core is a pixel or two and costs a
  paragraph almost nothing even at full strength; what would wash out a line of text is
  the **bloom** around it, which is soft and fourteen times as wide. So the bloom is
  scaled by `hush³` and is gone long before the writing.

**The bloom was a hard cutoff first and that was wrong.** Refusing to draw one anywhere
`hush` was under 1 stops it dead at a line you cannot see but can absolutely tell is
there — and on a 1440 window that line is only 154px in from each edge, so the bands
glowed in two narrow strips and were a grey dust everywhere else. Cubed, the glow falls
away as it comes in towards the column.

### How the glow is drawn

Every speck is a core: one `fillRect`, and cheap. Only a speck brighter than `GLOW_FROM`
is **also** given a bloom, which is one pre-drawn sprite scaled to size. That is
deliberate twice over — it keeps the count of expensive draws in the hundreds rather than
the thousands, and because it is the **crest** that pushes a speck over that line, the
bloom travels along the band with it. The whole frame is composited with `lighter`, so
where two bands cross, the crossing is brighter than either.

### The page's colour is five tokens

`.ataraxia-page` redefines `--bg`, `--bg-2`, `--line`, `--ink` and `--muted` on its own
body class, the way the search page and the contact sheet do. Every `human-*` rule
already draws in those, so setting them turns the whole page over at once and touches no
other page.

**Dark gray, not black.** ADAR next door is `#07070a` and means it; this is `#212328`,
which is dark enough for white additive specks to read as light and light enough not to
be a hole.

**One shared token had to be added for it.** A handful of rules spend the ink *at an
alpha* — the hatched placeholder, the dotted leader in a fragrance's row, the rank down
the side — and `rgba()` cannot take a hex, so they were written out as
`rgba(23, 23, 15, …)` by hand. They were the one thing on a house page that did **not**
follow a page turning its tokens over, which is how the rank came out black on dark gray.
`--ink-rgb` on `:root` is the same colour said as three numbers, and `.ataraxia-page`
redefines it with the rest.

**It still spends no accent colour at all**, like Almost Human. The bands are white and
the page is gray.

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

### It has a ground now, and it says nothing about the house

The owner asked for *"some particles and effects for grande parfums. subtle designs
please"*, and the second half of that is the brief. `grande.js` rises a field of fine
specks slowly up the window — a **drift** — each on a clock of its own, fading in as it
starts and out as it goes, so nothing on this page ever appears or disappears. About one
in fourteen is a **mote**: a little larger and a little plainer, so the drift has
something to catch the eye without anything in it being bright. Bring the pointer near
and the specks around it **lean** towards it and draw a shade more plainly — they do not
rush it and they do not stop; they lean.

**It is deliberately not this house said as a behaviour**, which every other drawing on
the site is. Pineward is a wood, ADAR a void, Almost Human a crowd, Ataraxia bands of
light. The owner has still not said what this house is — *"Idk the theme to be honest"* —
and drawing a theme for them would be putting words in their mouth. So this is paper with
something in the air over it. **When they say what the house is, `grande.js` is the file
to replace**, not to extend.

It lives on the **window**, not down the document, which is the opposite of the wood on
Pineward and the bands on Ataraxia and is right for the same reason Almost Human's rain
is: a thing that is rising reads as weather in the room you are in. Anchored to the
document it would slide down as you scrolled and up as it rose, and the two would fight.

#### The one thing that was wrong

**A speck's lifetime is worked out from its speed, not rolled apart from it.** The first
version rolled a speed of 4–17 pixels a second and a life of 9–23 seconds independently,
which meant a slow speck lived and died in **thirty-six pixels**. Every one of them is
born at the foot of the window, so the whole drift was a smudge along the bottom edge of
the page and the other nine-tenths of it was empty. That is exactly what the first
screenshot looked like. A speck now lives exactly as long as it takes to rise the height
of the window, and there is a test that counts how many are in the top half.

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

Fourteen tests. **Six of them were proved against the real fault** before being
trusted, which is the rule here — and the first one was proved twice, once in each
direction:

- **`the bands cross the whole window, and go quiet over the writing`** — the owner's
  readability ask, measured rather than assumed, and it has two halves that fail in
  opposite directions. Sampling three zones down eight screens — the clear margin, the
  column proper, and the easing band in between thrown away — it asks that there **is**
  ink over the writing (bands kept out of the middle: with `QUIET` at 0, it fails) and
  that a lit pixel there is far fainter than one beside it (no damping at all: with
  `QUIET` at 1 it reads **88.1 over the writing against 64.1 beside it**, and fails).
  **The middle zone matters.** Measured against the outer edge of the easing instead, the
  first half passed with the bands kept out of the column entirely, because the easing
  band alone satisfied it.
- **`Ataraxia is dark gray, and its writing is light on it`** — luminance rather than
  hex, because a page turned over by redefining its tokens can be turned **half** over,
  and light-on-light is what that looks like. With the token block cut back to `--bg`
  alone, it fails on the heading.
- **`the specks kindle under the pointer, and go out again`** — it counts one corner
  rather than the whole canvas, because the crest travelling along each band moves the
  total on its own and would swamp the reading. With `HAND_LIFT` at 1 it fails.
- **`Grande Parfums has a drift, and it is a quiet one`** — three failures in one, and
  they pull against each other: there has to **be** a drift, the average speck has to
  weigh under 90 of 255 (subtle was the whole brief), and a fifth of it has to be in the
  top half of the window. With the lifetime rolled apart from the speed it reads
  **28 specks in the top half against 191 in the bottom**, and fails.
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
npm run serve    # then http://localhost:8123/houses/ataraxia.html
```

Put the pointer on a band and watch the specks under it come up, then leave it alone and
watch the crest travel. Then read a paragraph with a band crossing behind it — that is
the thing the whole drawing is arranged around.

```bash
npm run serve    # then http://localhost:8123/houses/grande-parfums.html
```

And this one is meant to be nearly invisible. If you can see it without looking for it,
it is too strong.

## Known issues / TODO

- **Les Abstraits is written now** (2026-09-23) — see the section at the foot. **Ataraxia
  is named and still unwritten.** The owner gave both
  houses their fragrances' names and their notes on 2026-09-22 and kept the writing, which
  is a state this site had not had before: a house that reads as researched and unwritten
  rather than unstarted. Neither page has an *Untitled* on it any more; both still say on
  every part that the writing has not arrived. The notes are in
  [the notes' report](2026-09-21-the-notes.md).
- **Ataraxia's drawing no longer matches the house's stated subject.** The owner said the
  house's theme is angel statues and crosses, and then asked for the churchyard that drew
  it to be replaced by the bands. The standfirst still says the subject is statuary,
  because that is their statement about the house rather than about the page; the two are
  deliberately allowed to differ and are theirs to reconcile.
- **Grande Parfums' ground claims no theme.** It is a drift of specks and deliberately
  says nothing about the house, because the owner still has not said what the house is.
  It is a holding answer to *"subtle designs please"*, not the house drawn — replace it
  when they say.
- **No photographs anywhere.** All three folders in `images/` hold only a README naming
  the files their page is already asking for.
- **Neither Ataraxia nor Les Abstraits is in the Fragrances table**, and that is correct
  rather than outstanding: that table is the **individual** fragrances — the ones with no
  house — and every one of these has a house. They are reached through the contact sheet,
  like the other four.
- **Seventeen against the owner's sixteen** on Grande Parfums — see above.
- **The three older houses still carry their own copies** of what `house.js` now does.
  Moving them over is a clean follow-up and was deliberately not done in the same round
  as adding three houses.

## 2026-09-23 — Les Abstraits, written

The owner sent the whole house: a tagline under the name (*Eugen’s ideas and Antoine
Lie’s execution*, which is also its line on the contact sheet now), an introduction, all
four fragrances, and a paragraph for the very end of the page.

- **The writing is theirs, verbatim.** The only thing taken out was the invisible
  left-to-right marks the paste carried, which are formatting, not writing. Their spellings
  stay in the prose — *Bella Âme*, *La Doulour excuise*, *oppoponax*, *Antoine lee* — and
  the **titles** stay as the house spells them, which is the one correction this site
  makes.
- **One sentence stops half way** — *The vibe I get from Les Abstraits is that it is
  stuff* — and is printed that way on purpose. It is theirs to finish.
- **Stages** where they wrote them (Belle Âme and La Douleur Exquise: Top, Mid, Dry Down);
  plain paragraphs where they did not (Des Cendres, Philosopher's Walk).
- **La Douleur Exquise quotes Fragrantica** on where its materials come from. It is set as a
  quotation (`.human-quote`), set in and muted, with the source under it as a link.
- **The last word opens a new window**, as asked in capitals — *"CLAUDE MAKE THIS OPEN A
  NEW WINDOW"*. It is `.human-after`, after the fragrances and before the credit, linking
  to lesabstraits.com/pages/about with `target="_blank"` and `rel="noopener noreferrer"`.
- **The drawing in Des Cendres.** In the middle of the writing the owner left a note:
  *"(claude, maybe try to generate a picture of this)"*. That was addressed to whoever
  built the page, so it is not printed; a drawing stands where it was
  (`images/Les-Abstraits/des-cendres-road.svg`, `.human-scene`). It is an ink drawing in
  the site's own manner, of their scenario exactly: a two-lane road running away to the
  horizon, a pine forest of Scots pines and ponderosas on the left with weeds and small
  white flowers along the verge, gated front yards with houses on the right, a fire of
  logs lit in the nearest yard, and its smoke billowing across the road into the pines,
  under a low summer-evening sun. It was generated from a seeded script and is about 90KB
  as served. The credit line at the foot says it was drawn for the page.
- **Links inside the writing** are styled on this page only (`.abstraits-page .human-text
  a`): Almost Human already has links in its writing, and a site-wide rule would have
  restyled them.

Tested in `tests/houses.spec.js`: *Les Abstraits ends with Antoine Lie's paragraph, in a
new window* and *Des Cendres carries its drawing, and not the note that asked for it*; and
the *an unwritten fragrance says it is unwritten* test now holds Les Abstraits to having
**no** dashed boxes, beside Grande Parfums.

**Left alone, and worth the owner knowing:** Des Cendres' card on the Favourites page still
says its own description has not been written. That card's writing is a separate thing
(a description and a commentary, matched by name), and copying this into it would be two
copies of the same words.

## 2026-09-23, later — Tombstone and Qimu & Musicians

Two more houses on the same shape (`house.js`), the eighth and the ninth, and the chain on
the Houses view stops at nine for now at the owner's word ("Keep houses only up to 9").

> make house 8 Tombstone. Tombstone has 5 fragrances. I want you to look them up, add
> them and add their notes. Ive added some pictures so you can add them too. Make house 9
> Qimu & Musicians. they have 4 fragrances I want you to look them up, add them and add
> their notes. […] to the two fragrances called Drummer and Guitarist, I want you to
> write: Description coming soon. in the description

- **`houses/tombstone.html`** — five, in alphabetical order: 3 Feet 5, Evergrow, No Need
  to Come By, Sing at My Funeral, Sweet Coffin. **3 Feet 5** is the house's own name (the
  owner's picture is called *3 Foot 5*). Each carries the owner's two pictures, the bottle
  and the house's card for it. **None is written**, so every part and the introduction say
  so in the dashed box, as Ataraxia's do.
- **`houses/qimu-and-musicians.html`** — four, in the order the owner numbered their
  pictures: Guitarist, Vocal, Bassist, Drummer, one picture each. **Guitarist and Drummer
  say "Description coming soon."** — the owner's words, as a paragraph of their writing,
  not as a placeholder box. Vocal and Bassist say in the dashed box that they are the
  owner's to write.
- **Nothing was written for either house.** The owner asked for the fragrances looked up
  and added, and for their notes; the writing on this site is theirs, so the standfirsts
  say only what the house is ("Five fragrances. The writing is still to come."; "Four
  fragrances, one to a player in a band, to be worn alone or together.") and neither page
  has a subtitle under its name.
- **The notes** are in `notes-data.js` under `tombstone:` and `qimu:`, by the rules in
  [the notes' report](2026-09-21-the-notes.md):
  - Tombstone's own site gave **Sweet Coffin** and **No Need to Come By** a divided list.
  - For **Sing at My Funeral** it names the top and heart and only *describes* the base
    ("earthy and woody elements"), so the house's two tiers stand above and Fragrantica's
    full list below — the two halves Haxan and Ataraxia use.
  - **3 Feet 5** and **Evergrow** have no page on the house's site that could be found,
    so theirs are Fragrantica's.
  - Qimu's own page gives **Vocal**. **Guitarist, Bassist and Drummer have none that could
    be checked**, and say *No information as of yet.* while naming the house's page. One
    search came back with a confident list for Drummer, said to be Parfumo's; asked again
    without leading it, the same search said that page carries no notes at all. That is
    the near miss the notes' report warns about — a list nobody can check — so it is not
    in the file.
- **Neither house has a ground of its own on its own page.** The owner has not said what
  either is. Each has **motifs** on the Houses view, though (stones in mist and petals;
  notes, a record and a line of sound) — see [the chain](2026-09-23-the-chain-and-its-motifs.md).
- **The credits** name the houses' own sites, **as an assumption**, as Tale's does: the
  owner left no note of where the pictures came from, and they look like the houses' own.
- **The footer chain** runs Tale → Tombstone → Qimu & Musicians → back to Pineward.
- `images/Tombstone/README.txt` and `images/Qimu and Musicians/README.txt` say what each
  file is. The owner's own names are kept, spaces and all, and none is big enough to need a
  web copy.

Tested in `tests/houses.spec.js`: `all nine houses stand on the contact sheet, in their
own order`, the shared-shape test run on both, the no-script test, the unwritten test on
Tombstone, `Tombstone carries its five, in alphabetical order, with both pictures each`,
`Qimu & Musicians carries its four, and Guitarist and Drummer say description coming
soon`, and `the houses are chained one to the next, and the last wraps round`.

> **Since written** — see the section below. The two houses' writing arrived on 2026-09-24,
> and the tests on it changed with it.

## 2026-09-24 — Tombstone and Qimu & Musicians, written

The owner sent the writing for both houses. It is theirs **verbatim** — including the
double space in Vocal's "Base  Dry down is still sweeter." — with only the invisible
left-to-right marks that came with the paste taken out.

- **Tombstone** has its subtitle, *A house that expanded on death*, its introduction, and
  four of its five fragrances written: Evergrow, No Need to Come By, Sing at My Funeral and
  Sweet Coffin, each in the stages the owner used. Three things were asked for in so many
  words:
  - **selectively linear** in bold (`<strong>`);
  - the house's own site linked — `https://tombstonefragrances.shop`, opening in a new
    window like every other link off the site;
  - "exclusion zone (give the definition if hovered)" in Evergrow. The words in brackets
    are an instruction, not writing, so they are **not printed**; the term is a
    `<span class="human-define">` whose `data-define` is shown in a small ink box above
    it when it is pointed at or focused (a phone gets it by tapping, which focuses it).
    The definition is written here, not the owner's: *An area closed off to people,
    usually after a disaster — the zone round Chernobyl is the best-known — where nobody
    may live and whatever was left behind is taken back by nature.* `.human-define` is in
    `style.css` beside `.human-quote`, and can be used on any house.
- **3 Feet 5** has the owner's one paragraph, and under it the dashed box saying *The rest
  of 3 Feet 5 will be filled in later.* — "add that the rest of the fragrance will be
  filled in later".
- **Qimu & Musicians** has its subtitle, *A house of music and fragrance*, an introduction
  that reads *I will write it later.* (the owner's words, as a paragraph rather than a
  placeholder box, because that is what they asked to be written there), and **Guitarist**
  and **Vocal** written in Top / Mid / Dry Down. Drummer still says *Description coming
  soon.*, and Bassist is still waiting.
- Both subtitles are also the house's **say** on the Houses view, which had none for
  either until now.

Tested in `tests/houses.spec.js`: `Tombstone is written, with its bold, its link and a
definition on hover` — which fails with the definition never shown and with it always
shown — and `Qimu & Musicians carries its four: two written, one coming soon, one
waiting`. The unwritten test now runs on Ataraxia alone.

## 2026-09-24, later — Ataraxia, written

The owner sent Ataraxia's writing: its subtitle, *A gothic avante garde house* (in place of
*light, crossing*, which was never theirs), the introduction, and four of the five —
Amaretto Jazz in the Melting Room, Vestibule, Deity and Spinal Fluid — each in the stages
they used (*Top / Middle / Base*; Deity's *Top 1 / Top 2 / Mid / Dry Down*; Spinal Fluid's
*Top / Mid / Dry down*). It is theirs **verbatim**, *avante*, *oppoponax*, *im*, *0/10,
would smell again.* and the Cyrillic *Басейн Лазурний* included, with only the invisible
left-to-right marks that came with the paste taken out; the colons after the stage names
are the stage labels' own. Amaretto Jazz's closing paragraph, the short of it, stands after
its Base as a paragraph of its own. **My Doll's Makeup** is still theirs to write and says
so in the dashed box. The standfirst is now just *Five fragrances.*, as Tombstone's is.

### The spoiler

> (the following paragraph will be a dropdown paragraph with the button saying "spoiler
> alert". And even when you click it, the paragraph should be blurry, covered with the
> words "are you sure?", which if you click yes, then it will unblur it, and if you click
> no, then it will collapse it)

Spinal Fluid's Attack on Titan paragraphs are a `<details class="human-spoiler">` with
**Spoiler alert** on it. The owner's instruction is not printed. `house.js` makes it ask:
opened, the paragraphs are there but **blurred**, under **Are you sure?** with **Yes** and
**No**; Yes clears them, No shuts it again, and **every time it is opened it asks again**.
While blurred the words are also hidden from anything reading the page aloud and cannot
be tabbed into (`aria-hidden`, `inert`). It is drawn in the page's own tokens, so it
follows the dark ground. **Without JavaScript** it is a plain dropdown that opens onto the
paragraphs, never stuck blurred. Any house can use it: copy the block.

### Vestibule's notes, corrected

The owner gave Vestibule's divided list as it actually stands on the page — *Chocolate Bar,
Carolina Reaper / Chocolate Cake (Amandină), Red Hot Chilli, Wasabi, Pollen, Antique Shop,
Turmeric, Root Beer / Cocoa Pod, Edamame, Pistachio, Old Book, Halva, Potato* — and it
replaces the lower half of its window, which had read *Chocolate*, *Chocolate Truffle* and
*Cake*, *Beer*, *Old House*, *Soybean*. The house's own half is unchanged. The Note Library
gained records for the names it had never seen (Chocolate Cake, Cocoa Pod, Edamame, Root
Beer) and folded the rest into the notes they are.

Tested in `tests/houses.spec.js`: `Ataraxia is written, and Spinal Fluid's spoiler asks
before it shows` (fails with the paragraphs never blurred, and with No not shutting it) and
`Vestibule carries the notes the owner corrected`. The unwritten test now expects exactly
one waiting box on Ataraxia, in My Doll's Makeup.

## 2026-09-24, last — Des Cendres' dry down

The owner added a closing paragraph to Des Cendres on Les Abstraits, verbatim: *On the dry
down, it is quite smoky, with traces of galbanum remaining, The scent profile is more or
less the unchanged.* It stands after "this is a masterpiece" as a paragraph of its own;
Des Cendres has no stage labels, so it was not given one. Tested with Tale's Water Me in
`tests/houses.spec.js`: `Des Cendres ends on its dry down, and Water Me has a Mid and a
Dry Down`.

## 2026-09-24, last — nothing under the subtitle, and the subtitles in title case

> remove the lines that are below the subtitle in the houses, so that lines such as
> 'Replace this line with your own standing first paragraph — the one that says what the
> house is before the introduction begins.' should be removed from all of the houses. and
> the subtitles like 'The house that smells like trees' should have every other word
> capitalized (like the titles of books in the real world)

- **Every house's standfirst is gone** — the line under the name and subtitle — from all
  nine that had one, taken out of the markup rather than hidden. Two were placeholders
  (Pineward's and ADAR's, the "Replace this line…" the owner quoted), but the rest were
  words on the page: **Almost Human's was the owner's own** (*Almost Human is a house
  launched in 2026 …*), Grande Parfums' said the two still to smell would be revisited,
  Tale's repeated its line from the Houses view, Qimu's said *to be worn alone or
  together*, and Ataraxia's and Tombstone's said *Five fragrances.* The owner said all of
  the houses, so all went. `.pine-standfirst` and `.adar-standfirst` went from the
  stylesheet with them; `.human-standfirst` stays, because the individual fragrances'
  page — which is not a house — still carries one.
- **Title case**, as a book's title is set: every word capitalised but the short joining
  ones (a, an, the, and, of, on, at, to, …) after the first — *The House That Smells Like
  Trees*, *A House That Very Deservedly Won the Art and Olfaction Awards in 2025*, *A
  Gothic Avante Garde House*. On each house's page under its name, on the Houses view
  under each picture, and in Pineward's and ADAR's `<title>`s, which carry theirs.
  Grande's page subtitle, *Art Niche Expo 2026*, was already so. The owner's own words
  otherwise unchanged — *avante* stays.

Tested in `tests/houses.spec.js`: `no house has a line under its subtitle, and every
subtitle is in title case` — every house page and every say on the Houses view. Fails with
a subtitle put back in sentence case, and with a standfirst put back.
