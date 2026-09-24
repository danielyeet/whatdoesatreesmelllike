# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Two other places to read before changing anything:

- **`instructions.md`** at the repo root — standing behavioural rules the repo owner has
  given (how to conduct changes, verification steps). Not codebase documentation; rules.
- **`docs/features/`** — one report per feature: what each drawing is, why it is built
  the way it is, what was tried and was wrong, and what must stay true. The index is
  [`docs/progress-log.md`](docs/progress-log.md), newest first — start there.

**This file is the map. The reports are the ground.** Anything in here that runs longer
than a paragraph about one feature belongs in that feature's report.

## Communication style

I don't have coding experience. Explain things in plain English, avoid jargon, and if
you have to use a technical term, briefly define it the first time you use it.

## Before merging or pushing

Always run the full test suite before merging or pushing any change, and after
implementing any feature request. Report results simply — what passed, what failed, and
what you did about any failures — not raw test-framework output.

See "Tests" below for how to run them.

## Feature reports (docs/features/)

- Before starting work in an area, check [`docs/progress-log.md`](docs/progress-log.md)
  for related past entries and open the linked file if relevant.
- Whenever you make changes to code that an existing report covers (new files, renamed
  functions, changed behavior, etc.), update that report in the same turn so it stays
  accurate — don't leave it to drift.
- After completing a new feature, add an entry following the template below, and add a
  line to [`docs/progress-log.md`](docs/progress-log.md).
- Never add feature-level descriptions directly to CLAUDE.md — this file is for
  architecture, conventions, and commands only.

A report is `docs/features/YYYY-MM-DD-<short-slug>.md`, dated the day the feature landed:

```markdown
# <Feature name>
Date: <original date if known, otherwise today's date, noted as "migrated">
Files touched: <list>
What changed: <2-4 sentences, plain language>
Why / key decisions: <design choices, trade-offs, anything not obvious from the code>
How to test it: <steps or commands>
Known issues / TODO: <anything unresolved>
```

The reports written before this template was fixed carry the same sections under
slightly different headings, and the longer ones break the middle into several sections
of their own. Follow a report's existing shape when adding to it, and the template above
when starting a new one.

## Project

A static portfolio site — **The Taste of Aldehydes**, "perfumes and my notes about
them" (it was "what does a tree smell like" until the owner named it) — hand-written
HTML, one shared
stylesheet, plain browser JS. No build step, no package manager, no local dependencies:
Three.js r128 comes from a CDN in `index.html` alone, fonts from Google Fonts. Deployed
via GitHub Pages from the repo root, so the default branch is the live site.

## Every page, and what draws it

**Where a page lives says what it is.** There are four folders of pages, and the split is
the owner's: `houses/` holds the nine fragrance houses, `individual-fragrances/` holds the
perfumes that belong to no house, `categories/` holds the category pages, and `works/`
holds everything else — the essays, the researches, the two templates and the two sandbox
pages. The houses were in `works/` with all the rest until 2026-09-22.

**Every old address still works.** Moving the houses changed their public web addresses,
so a **forwarding page** was left at each of the seven old ones (`works/pineward.html` and
the rest). It carries the anchor across — `works/pineward.html#part-37` lands on
`houses/pineward.html#part-37` — which a plain `<meta refresh>` cannot do, so the script
is the one that matters and the meta is the no-JavaScript fallback. Don't delete them, and
**don't link at them**: every link inside the site points at the real page.

Start here. Each page is standalone, loads `nav.js` for the shared menu and cursor, and
then loads whatever draws *that* page — nothing else. No page script knows about any
other, and none of them share state (the one exception is the landing page's six layers,
which talk through five `window` globals; see the landing page's report).

| page | what it is | scripts it loads beyond `nav.js` | report |
|---|---|---|---|
| `index.html` | three scroll-snapped **slides**: the title, the italic line, the 3D **node map** | `landing.js`, `node-scene.js`, `paper.js`, `thread.js`, `extras.js` (and Three.js from a CDN — the only page that uses it) | [node map](docs/features/2026-09-11-the-node-map.md), [slides](docs/features/2026-09-11-the-landing-slides-and-exit.md), [paper](docs/features/2026-09-11-the-paper.md), [thread](docs/features/2026-09-11-the-thread.md), [chromatogram](docs/features/2026-09-11-the-chromatogram.md) |
| `categories/scent-descriptions.html` | two **views** of one category: the **houses** — a **helix** of particles round a central **axis**: one house at the **front**, on the axis, the rest turned away round it above and below, joined to it by **tethers**, travelled along by the wheel, a drag, the keys, the numbers on the axis and **the way round** at the side, with each house's own **motifs** rising over the page when it is rested on — and the **fragrances**, an **index** of the perfumes with no house, each of which opens **in the page** rather than navigating away | `search.js`, `contact-sheet.js`, `motifs.js`, `index-page.js`, `notes-data.js`, `notes.js`, `fragrance-reader.js`, `views.js` | [the axis](docs/features/2026-09-24-the-axis.md), [the old hang](docs/features/2026-09-24-the-hang.md), [the motifs](docs/features/2026-09-23-the-chain-and-its-motifs.md), [the old contact sheet](docs/features/2026-09-13-the-contact-sheet.md), [index and views](docs/features/2026-09-17-the-index-pages-and-views.md), [the reader](docs/features/2026-09-22-the-fragrance-reader.md) |
| `categories/theories.html` | the **structure**: a technical drawing in three dimensions you scroll *into* | `search.js`, `page-search.js`, `structure.js` | [structure](docs/features/2026-09-14-the-structure.md) |
| `categories/favorites.html` | the **chamber**: two injectors firing particle streams into a tilted **orbit** round the word FAVOURITES, which opens into a menu of **chapters** — and opening one **bursts** into that chapter's own page, black and silver, with arrows either side of its name to step to the next, its favourites opening where they stand, **the sun** standing behind Chapter 1 and **the moon** behind Chapter 2 | `search.js`, `page-search.js`, `notes-data.js`, `notes.js`, `sun.js`, `moon.js`, `chamber.js` | [chamber](docs/features/2026-09-15-the-chamber.md) |
| `categories/researches.html` | **Explorations &amp; Researches**: an **index** — readings across the top, plates on the right, and a sortable, searchable table in the bottom left, each row saying whether it is a research or an exploration | `search.js`, `index-page.js` | [index and views](docs/features/2026-09-17-the-index-pages-and-views.md) |
| `categories/note-library.html` | the **Note Library**: every note named in a fragrance on the site, shelved by family and explained — books on **shelves** at night, read through a catalogue **terminal**, each book as thick as the note is used, with a **call number** at its foot, opening into a **catalogue card** that links every fragrance using it | `search.js`, `notes-data.js`, `note-library.js` | [the Note Library](docs/features/2026-09-24-the-note-library.md) |
| `categories/other-2.html` | **Photography**: the frames in sets, a grid a wide one breaks, numbered down the margin | `search.js`, `page-search.js`, `photography.js` | [photography](docs/features/2026-09-18-the-photography-page.md) |
| `houses/pineward.html` | **Pineward**, the first house in Scent descriptions: an introduction and 52 compacted parts — one per fragrance, each with its own photograph — in four forest **strata**, with a **wood** grown down both margins, a ticked **trunk**, a faint pine-green ground, and the **gallery** at the foot of it | `search.js`, `pineward.js`, `pineward-gallery.js` | [Pineward](docs/features/2026-09-16-pineward.md), [gallery](docs/features/2026-09-18-the-pineward-gallery.md) |
| `houses/adar.html` | **ADAR**, the second house: eleven fragrances in four groups, standing on a **void** — a hole in the window that shows the house's mark under the pointer — with a ruled **log** and falling **dust** down the left and a **sounding** down the side | `search.js`, `adar.js` | [ADAR](docs/features/2026-09-17-adar.md) |
| `houses/almost-human.html` | **Almost Human**, the third house: five fragrances standing in a **crowd** — people drawn entirely in specks, standing in whatever room the page leaves and over nothing, each of them nearly a person and never quite one, resolving under the pointer and glitching into the house's **mark** — with a ticked **rank** down the side | `search.js`, `almost-human.js` | [Almost Human](docs/features/2026-09-20-almost-human.md) |
| `houses/ataraxia.html` | **Ataraxia**, the fourth house, *A gothic avante garde house*: five fragrances, four written — with a **spoiler** in Spinal Fluid — on **dark gray**, crossed side to side by **bands** of glowing white particles at their own angles — each with a **crest** of light travelling along it, passing behind the writing and quietened where it does, and **kindling** under the pointer | `search.js`, `house.js`, `ataraxia.js`, `notes-data.js`, `notes.js` | [the newer houses](docs/features/2026-09-21-the-newer-houses.md) |
| `houses/grande-parfums.html` | **Grande Parfums**, the fifth house: seventeen fragrances — fifteen written up alphabetically, two at the foot not smelled yet — over a **drift** of fine specks rising slowly up the window, which claims no theme because the owner has not given one | `search.js`, `house.js`, `grande.js` | [the newer houses](docs/features/2026-09-21-the-newer-houses.md) |
| `houses/les-abstraits.html` | **Les Abstraits**, the sixth house: four fragrances, written, all four with notes off the house's own page — with a **drawing** of Des Cendres' road standing in its writing, and a **last word** at the foot whose link opens a new window | `search.js`, `house.js`, `notes-data.js`, `notes.js` | [the newer houses](docs/features/2026-09-21-the-newer-houses.md) |
| `houses/tale-parfums.html` | **Tale Parfums**, the seventh house: four fragrances in alphabetical order, three pictures each, on a page **drawn by hand** — in the site's own face, with pictures pinned on with tape, straight rules, and **doodles** after the house's label drawings down both margins, drawing themselves in and **boiling** under the pointer | `search.js`, `house.js`, `tale.js`, `notes-data.js`, `notes.js` | [Tale Parfums](docs/features/2026-09-23-tale-parfums.md) |
| `houses/tombstone.html` | **Tombstone**, the eighth house: five fragrances in alphabetical order, two pictures each, written — all but the rest of 3 Feet 5 — with a **definition** shown on hover in Evergrow | `search.js`, `house.js`, `notes-data.js`, `notes.js` | [the newer houses](docs/features/2026-09-21-the-newer-houses.md) |
| `houses/qimu-and-musicians.html` | **Qimu & Musicians**, the ninth house: four fragrances, one to a player in a band — Guitarist and Vocal written, Drummer saying "Description coming soon." at the owner's word, Bassist waiting | `search.js`, `house.js`, `notes-data.js`, `notes.js` | [the newer houses](docs/features/2026-09-21-the-newer-houses.md) |
| `individual-fragrances/individual-fragrances.html` | the **individual fragrances**: the ones that belong to no house, each with the house it did come from. What the Fragrances view of Scent descriptions opens into | `search.js`, `house.js`, `notes-data.js`, `notes.js` | [the notes](docs/features/2026-09-21-the-notes.md) |
| `works/theory-01.html`, `-02`, `works/resins-in-perfumery.html`, `works/cold-vs-warm-incense.html` | the **essay pages**: a long piece of writing on the theories drawing's ground, with a **rule** down the left — one tick per section, filled in as far as you have read | `essay.js` | [essay pages](docs/features/2026-09-17-the-essay-pages.md) |
| `works/my-personal-introduction-to-perfume.html` | **Explorations 000**, the first result on Explorations &amp; Researches: the owner's guide to perfume on an essay page of its own — **gold** in place of the steel blue, a **mist** of drops rising behind the writing and turning to vapour, and the accords table, the two **pyramids**, a dropdown and footnotes drawn in the page | `essay.js`, `primer.js` | [the primer](docs/features/2026-09-23-my-personal-introduction-to-perfume.md) |
| `works/theory-03.html` | the same, and the longest piece on the site: **The Note Dissemination Framework**, which argues in **diagrams** and carries a **calculator** standing in the same page | `essay.js`, `calculator.js` | [the framework](docs/features/2026-09-20-the-note-dissemination-framework.md) |
| `works/*.html` | the other individual pieces — two templates and two sandbox pages — **and seven forwarding pages** standing where the houses used to be | none | — |
| `search.html` | the **search page**: one field over the whole site on a dark ground of drifting specks, the answers as ruled rows carrying the trail that says where each lives, and a row of **filters** narrowing them by kind | `search.js`, `search-page.js`, `find-ground.js` | [search](docs/features/2026-09-17-the-search.md) |
| `contact.html` | one sentence: *Get in touch, send a carrier pigeon.* | none | — |

Three of those page scripts are elaborate: `chamber.js` (~3,450 lines), `structure.js`
(~1,560) and `node-scene.js` (~1,520). The rest are smaller:
`almost-human.js` (~1,170), `pineward.js` (~930), `adar.js` (~890), `note-library.js`
(~870), `calculator.js` (~780), `contact-sheet.js` (~735, down from ~1,570 when
the chain replaced the map, and up again as the hang and then the axis), `motifs.js` (~700), `sun.js` (~640), `paper.js` (~580), `moon.js` (~580),
`notes.js` (~475), `essay.js`
(~430), `ataraxia.js` (~385),
`fragrance-reader.js` (~600), `tale.js` (~590), `primer.js` (~230), `pineward-gallery.js`
(~350), `house.js` (~310), `index-page.js` (~310), `thread.js` (~290), `nav.js` (~290), `grande.js` (~265), `search.js`
(~270), `extras.js` (~250), `views.js` (~240), `landing.js` (~230),
`search-page.js` (~190), `photography.js` (~190), `find-ground.js` (~180) and
`page-search.js` (~110).
These drift with every round; `wc -l *.js` is the answer, not this paragraph.

**Read the matching report in `docs/features/` before editing one of them.**

**Five pages are drawn on a dark ground**: `categories/theories.html`,
`categories/note-library.html`, `houses/adar.html`, `houses/ataraxia.html` and
`search.html`. A page on a dark ground must
also carry `dark-surface`, or the cursor cannot see it — and it should be added to the
dark `--chrome-ground` list in `style.css` so its fixed chrome is readable on a phone.

**A page's colour is five tokens, set on its own body class.** `--bg`, `--bg-2`,
`--line`, `--ink` and `--muted` are redefined under `.find-page`, `.sheet-page`,
`.library-page` and `.ataraxia-page`
rather than a second set of rules being written for everything on those pages: every
rule they use already draws in those tokens, so setting them turns the page over at once
and touches nothing else. This is worth knowing because it has already been used in both
directions — the contact sheet went dark for one round and came back to white the next,
and each time that was a handful of lines rather than a rewrite, and Ataraxia turned dark
gray the same way.

**`--grid-cell` is the size of the squared ground**, 46px, and it is spent in two places
that have to agree: the contact sheet's own background and the fragrance reader that
opens on top of it. A picture on its way back recedes into one of those squares, so if
the two ever differ it lands on nothing. There is a test.

**`hidden` is not enough on its own.** It is an attribute, and the browser's own
`[hidden] { display: none }` lives in the user-agent stylesheet — which ANY author rule
outranks. Anything here given a `display` of its own needs an `[hidden]` rule that
outranks **every** rule giving it one, not just the first: `.index-page` is given one
twice, and a plain `.index-page[hidden]` lost to the second and did nothing at all. That
shipped, as the Fragrances table flashing back to full strength on the way in.

**There is a sixth token, `--ink-rgb`, and it exists only because `rgba()` cannot take a
hex.** A handful of shared rules spend the ink at an alpha — the hatched placeholder, the
dotted leader in a fragrance's row, the rank down the side of a house. Written out by
hand they were the one thing that did NOT follow a page turning its tokens over, which is
how Ataraxia's rank came out black on dark gray. Keep it and `--ink` the same colour.

Four of the pages replace their own markup with a drawing, and all four hold that
markup back on the way in with the **`js-coming`** class so the plain version is never
flashed first — see the glossary entry. All four also leave that plain version working
when the script is blocked, and there is a test for each.

## Running it

Serve over HTTP rather than opening files directly — pages use relative asset paths and
pointer machinery (`document.elementFromPoint`) that misbehaves on `file://`:

```bash
python3 -m http.server 8000    # then open http://localhost:8000/
npm run serve                  # the same thing on port 8123
```

Pick a port that is **not 4321**: that is the one the test suite starts its own server
on, and a stray server sitting on it makes the whole suite fail (see Tests below).

There is no build or lint step, so nothing catches a mistake before the browser does —
open the console after any change to a drawing.

`node-scene.js` is the one to be most careful with, and it is the **only** file here
that uses a WebGL shader (a small program that runs on the graphics card). A shader that
fails to compile takes the whole 3D scene with it, so the map comes up **blank rather
than merely wrong** — and blank looks like a loading failure, not like a bug you
introduced. Every other drawing here is plain canvas, SVG and DOM, so they fail visibly
instead.

## Tests

```bash
npm install     # once
npm test        # the whole suite
npm test -- tests/menu.spec.js        # one file
npm test -- --grep "preview"          # one topic
```

Playwright drives a real browser against the repo served over HTTP (the config starts
`python3 -m http.server` itself, so nothing needs to be running first). `npm run report`
opens the HTML report; failures also leave a screenshot and a trace in `test-results/`.

**A clean run is 317 passed, 0 failed, and takes seven to thirteen minutes.** If you get a
number wildly different from that, check the shape of the failures before believing
them: **a hundred-odd tests all failing in about 300ms each means the web server is
down, not that the site is broken.** The config serves on **port 4321** and reuses a
server already sitting there, so a stray `python3 -m http.server 4321` left over from a
killed run — or anything else holding that port — poisons every browser test while the
four browserless `repository.spec.js` checks still pass. Clear it, confirm the port is
free, and run again. (This has happened; don't spend the time diagnosing it twice.)

Two traps when clearing it: `pkill -f http.server` **matches its own command line** and
kills the shell running it before it kills anything else — write the pattern as
`pkill -f "[h]ttp.server"`. And killing a Playwright run does not always take its server
with it, which is how the stray gets there in the first place, so check with
`pgrep -af "[h]ttp.server"` afterwards rather than assuming.

The suite runs **fully offline**: `tests/helpers.js` intercepts the Three.js and Google
Fonts requests and answers them locally, Three.js from the version pinned in
`package.json` — which must stay matched to the version `index.html` requests, or the
tests stop testing what actually ships. Nothing in `package.json` is needed to view or
publish the site; it exists only for the tests.

**What each spec file covers is written up in that feature's report**, under "How to
test it". Two spec files are the exception and belong to no one feature: the browserless
checks in `repository.spec.js` (no link points at a missing file, no credentials are
committed, the site still needs no build step to publish), and `mobile.spec.js`, which is
about the whole site at a phone's size — see [the phone
report](docs/features/2026-09-21-the-site-on-a-phone.md). `houses.spec.js` covers the
three newest houses **and the shape they share** (`house.js`), so it belongs to one
report but spans three pages.

Several tests are regressions for specific bugs the owner reported and that were fixed.
Each one is named and explained in its own feature's report, under "How to test it", next
to the reasoning it protects. **Keep them passing rather than adjusting them to match new
behaviour**, unless the behaviour change is deliberate.

Visual/aesthetic judgement is still manual — the suite checks that things work, not that
they look right.

### A phone

The site is meant to work on one, and the standing rule is that **nothing above 700px may
change** — the owner asked for the phone "without changing its desktop version", and then,
a round later, for that to be **checked rather than assumed**. It is: every page on the
site is rendered at six sizes against the commit before the change, and every element's
box, opacity, z-index, background and transform compared. How that is done, and the four
faults deliberately left standing between 700px and wherever they stop because the rule
says so, are in [the phone
report](docs/features/2026-09-21-the-site-on-a-phone.md) under "Nothing above 700px moved".

Seven things follow, and they are the ones to keep in mind when adding a drawing:

- **A thing standing over the page is sized against the viewport, not by a media query.**
  The notes window is `min(430px, calc(100vw - 36px))` wide and `min(74vh, 640px)` tall,
  so a phone and a desktop get the same window at the size each has room for. It was a
  column beside the writing with a separate sheet for phones, and one window sized this
  way replaced both.
- **Every canvas draws at a lower ratio below 700px** (1.5 rather than 2), which is a
  little over half the fill. A new drawing should do the same.
- **A rule written against `COLUMN` needs a floor.** The writing's measure is 940px, so on
  a phone "the room either side of the column" is none — and a drawing that takes the
  column out of itself takes the whole page out. Almost Human's `lit()` did exactly that
  and the page had no ground at all.
- **There is no hovering.** A drag sends `pointermove` and a tap sends `pointerdown`; a
  drawing that answers the hand should listen for both.
- **Anything fixed to the window will end up printed over the page.** There is nothing in
  the top corner of a wide window for the Menu to stand over; on a phone the writing
  reaches it. Fixed chrome below 700px gets a box of `--chrome-ground` behind it — the
  Menu, the contact sheet's view buttons and search, and the three houses' readings all
  carry one. A new piece of fixed chrome should too.
- **A z-index worked out from a drawing can outrank the chrome.** A picture on the old
  contact sheet carried one up to 1000, from how far back it stood; the chrome sits at 30,
  so the pictures were drawn over the buttons, and below 700px the chrome was raised above
  them. It also stood over the **cursor**, which is why the cursor now stands at the top
  layer there is. The axis that stands there now keeps its houses at 4 or under, and the motifs at 0, under them.
- **A drawing placed by a window's shorter side gets narrower in portrait.** The theories
  stations are placed against the lens, which is taken off the shorter side, so on a phone
  they were thrown half off the edge; they are drawn in towards the middle by however much
  narrower the view is (`pull`). Anything placed the same way needs the same.
- **A fix keyed to the fault rather than to the width will leak above 700px**, because the
  faults do not stop at 700 — the old sheet overlapped its own pictures up to about 820, Pineward
  has no wood up to about 1036, and a squarish desktop window throws a station off its edge
  at any size. Every one of those is keyed to the width anyway (`tighten`, `ONE_WIDEST`,
  `SIDE_NARROW`), because the rule is a rule. Key a new one the same way and say in the
  comment what it is leaving behind.

`tests/mobile.spec.js` is the guard: no page scrolls sideways at 390px, the crowd is
drawn, and a tap brings a figure home.

Two states are easy to forget when reviewing a change:

- **`prefers-reduced-motion: reduce`** — read by `landing.js`, `paper.js`, `thread.js`,
  `node-scene.js`, `contact-sheet.js`, `motifs.js`, `structure.js`, `chamber.js`, `sun.js`, `moon.js`, `pineward.js`,
  `adar.js`, `almost-human.js`, `ataraxia.js`, `grande.js`, `house.js`, `essay.js`,
  `calculator.js`, `tale.js`, `primer.js`, `note-library.js`,
  `index-page.js`, `fragrance-reader.js` and `style.css` (which also turns off every
  house's way in), each degrading to a still
  version. `nav.js` (the cursor), `extras.js` and `views.js` (which only shortens its
  fade to nothing) do *not* check it beyond that; if you add motion there, add the guard
  too.
- **Portrait / narrow viewport** — the node map draws smaller there on purpose, and
  vertical swipes must keep scrolling the page while only horizontal drags rotate the
  map. The arithmetic is in [the node map's
  report](docs/features/2026-09-11-the-node-map.md).

## Architecture

Every feature has a report of its own, indexed newest first in
[`docs/progress-log.md`](docs/progress-log.md). Each one carries what it is, why it is
built that way, what was tried and was wrong, how to test it, and anything still open.

| feature | file | report |
|---|---|---|
| The Note Library | `categories/note-library.html`, `note-library.js` | [report](docs/features/2026-09-24-the-note-library.md) |
| The Houses view as a helix round a central axis | `contact-sheet.js` | [report](docs/features/2026-09-24-the-axis.md) |
| The Houses view as a gallery hang — **replaced** the same day by the axis; kept for the reasoning | (was `contact-sheet.js`) | [report](docs/features/2026-09-24-the-hang.md) |
| Each house's motifs, and every house's way in (and the chain, replaced by the hang) | `motifs.js` | [report](docs/features/2026-09-23-the-chain-and-its-motifs.md) |
| My Personal Introduction to Perfume | `primer.js` | [report](docs/features/2026-09-23-my-personal-introduction-to-perfume.md) |
| Tale Parfums, drawn by hand | `tale.js` | [report](docs/features/2026-09-23-tale-parfums.md) |
| The fragrance reader | `fragrance-reader.js` | [report](docs/features/2026-09-22-the-fragrance-reader.md) |
| View notes, and the Fragrances page | `notes.js`, `notes-data.js` | [report](docs/features/2026-09-21-the-notes.md) |
| Ataraxia, Grande Parfums and Les Abstraits | `house.js`, `ataraxia.js`, `grande.js` | [report](docs/features/2026-09-21-the-newer-houses.md) |
| The Photography page | `photography.js` | [report](docs/features/2026-09-18-the-photography-page.md) |
| The Pineward gallery | `pineward-gallery.js` | [report](docs/features/2026-09-18-the-pineward-gallery.md) |
| A folder of pictures per house | `images/` | [report](docs/features/2026-09-17-images-folder-per-house.md) |
| The search | `search.js`, `search-page.js`, `page-search.js`, `find-ground.js` | [report](docs/features/2026-09-17-the-search.md) |
| Almost Human | `almost-human.js` | [report](docs/features/2026-09-20-almost-human.md) |
| ADAR | `adar.js` | [report](docs/features/2026-09-17-adar.md) |
| The index pages, and the two views | `index-page.js`, `views.js` | [report](docs/features/2026-09-17-the-index-pages-and-views.md) |
| The Note Dissemination Framework, and its calculator | `works/theory-03.html`, `calculator.js` | [report](docs/features/2026-09-20-the-note-dissemination-framework.md) |
| The essay pages | `essay.js` | [report](docs/features/2026-09-17-the-essay-pages.md) |
| Pineward | `pineward.js` | [report](docs/features/2026-09-16-pineward.md) |
| The chamber | `chamber.js` | [report](docs/features/2026-09-15-the-chamber.md) |
| The structure | `structure.js` | [report](docs/features/2026-09-14-the-structure.md) |
| The contact sheet — **replaced** (by the chain, then the hang, then the axis); kept for the reasoning | (was `contact-sheet.js`) | [report](docs/features/2026-09-13-the-contact-sheet.md) |
| The 3D node map | `node-scene.js` | [report](docs/features/2026-09-11-the-node-map.md) |
| The landing page's slides and exit | `landing.js` | [report](docs/features/2026-09-11-the-landing-slides-and-exit.md) |
| The paper | `paper.js` | [report](docs/features/2026-09-11-the-paper.md) |
| The thread | `thread.js` | [report](docs/features/2026-09-11-the-thread.md) |
| The chromatogram | `extras.js` | [report](docs/features/2026-09-11-the-chromatogram.md) |
| The page shell, menu and cursor | `nav.js`, `style.css` | [report](docs/features/2026-09-11-the-page-shell-and-menu.md) |

The one thing worth repeating here, because it is a contract between files rather than
inside one: **the landing page's six scripts communicate only through five `window`
globals** — `__p23`, `__mapField`, `__mapReadout`, `__exit` and `__reform`. That table is
in the landing page's report. These files deliberately never touch each other's DOM or
internals. (The README says `thread.js` sets `__p23` — it doesn't, `paper.js` does.)

## Content conventions

- **New piece of work**: duplicate a template in `works/` — `example-gallery-work.html`
  for image-and-paragraph sequences, `example-article-work.html` for reference pieces,
  `theory-01.html` for a long essay on the dark ground — then add it to the relevant
  `categories/` page. There are **four kinds of category page** now, and they take a new
  piece differently: the **row list** (`other-2`) takes another `<a class="work-row">`
  block; the **axis** (`scent-descriptions`, Houses view) takes another
  `<a class="sheet-frame">` block, which stands next along the helix — with a
  `data-motif` naming its motifs in `motifs.js`, and `data-open="no"` on it until there is
  a page behind it; the **structure** (`theories`) takes another
  `<a class="work-row">` block, which becomes a station of its own and lengthens the
  road — optionally with a `data-note`, a line about the piece that the station's card
  shows when it is clicked; and the **index** (`researches`, and the Individual
  Fragrances view) takes another `<tr>`. Each page says which in the comment at the top
  of it.
- **A row on an index page** carries what it sorts by on itself: `data-no`, `data-name`,
  `data-date`, and `data-house` where there is one. Change a date and you change it in
  two places on the row — the `data-date` it sorts by and the lettering that is read. A
  row with nothing to open yet gets `data-open="no"` and no link.
- **A fragrance in the Fragrances table** points at that fragrance where it
  stands in its house's own page — `../houses/pineward.html#part-06` — so the index and
  the houses are two ways into the same writing rather than two copies of it.
  **Renumbering a house means re-pointing that table in the same turn**: the anchor is
  the part's number, not its name, so a part removed from the middle of a house silently
  sends every link after it to the wrong fragrance. That happened; there is a test for it
  now in `repository.spec.js`.
- A favourite on the **chamber** page (`favorites`) is an `<a class="gallery-entry">`
  block with a `data-chapter`, a **`data-house`** — the perfume house, which is what its
  card reads and which replaced the `data-date` the cards used to carry, so **there is no
  date anywhere on that page any more** — and optionally a **`data-notes`**, the key its
  notes are filed under in `notes-data.js` (`"abstraits:02"`). Its `href` is wherever that
  fragrance lives on the site, and is what GO TO FRAGRANCE follows. The chapters are the
  different `data-chapter` values in the order they first appear, and the chapters
  standing in the chamber's column are made from them.
- **What a chapter is** is written in its own
  `<section class="gallery-chapter" data-chapter="...">` further down that page, and is
  what its page shows above the cards; a chapter with nothing written for it shows its
  cards and no description. **A chapter written up here exists even with nothing filed
  under it** — Chapter 2 is named, described and empty — and a `<p class="gallery-aside">`
  inside the block is set apart from the writing above it, which is where the owner's
  note about the favourites not being ranked stands. **`data-ground`** on the block is the
  drawing that stands behind that chapter's page; there are two, `"sun"` and `"moon"`, and a chapter
  without the attribute gets plain black.
- **WHAT A FAVOURITE SAYS WHEN ITS CARD IS OPENED** is a
  `<section class="gallery-writing" data-favourite="...">` in the `.gallery-writings`
  block at the foot of that page, matched to the favourite **by name** — so renaming one
  means renaming it in both places in the same turn. The shape is a description and then a
  paragraph of commentary, the second marked `gallery-word`. A favourite with no block
  opens with its two links and nothing else.
- **A NEW HOUSE** is `houses/<house>.html` on `body.human-page`, loading `search.js` and
  **`house.js`** — the shared house shape, which gives it the parts opening on a measured
  height, the rank down the side, and taking a photograph off the page when its file is
  not there. A fragrance is a `<details class="human-part" id="part-NN">`. The six
  newest houses use it; **Pineward, ADAR and Almost Human still carry their own copies**
  and were deliberately left alone. A ground of its own is a `<canvas class="human-field">`
  and a script of its own (`ataraxia.js` and `grande.js` are the two models — one loud,
  one nearly invisible); a house with no theme yet simply has neither. Then: a frame on the Houses view (with a `data-motif`, and motifs for it in `motifs.js`), a line in `PAGES` in `search-page.js`,
  an `images/<House>/` folder with a README, and the **footer chain** — every house's `human-on` link points at the next one
  and the last wraps round to Pineward.
- **NOTES FOR A FRAGRANCE** go in `notes-data.js`, never in the markup, keyed by the
  page's own `window.HOUSE_NOTES` and the part's number — `"pineward:01"`. An entry is
  `{ top, mid, base }` **only when the source actually divides them**, or `{ flat: […] }`
  when it gives one undivided list, and it always carries `source: { name, url }`. **Never
  write a pyramid a source did not state**: a review's prose is not a pyramid, and there
  is a test for every one of those rules.
- **AN ENTRY CAN ALSO SAY IT FOUND NOTHING**, which is not the same as having no entry.
  `{ missing: "…" }` is one sentence and no lists, and it is what a source that was read
  and never named a material gets — ADAR prints prose for two of its fragrances, and those
  say *No information as of yet.* while still naming ADAR's page. A fragrance that could
  not be found online AT ALL says so and names no source; that is the one entry in the
  file without one, and the test that requires a source has that single exemption written
  into it. **No key at all** is a third thing again, and means nobody has looked yet.
- **A FRAGRANCE THAT EXISTS IN MORE THAN ONE VERSION CARRIES `version`**, and the newest
  version's notes. It prints as a boxed line at the very TOP of the window, above the
  notes rather than in the aside under them, because it qualifies all of them — the owner
  asked for it to be "emphasized ... on the website itself". It must name a year; there
  is a test.
- **A SECOND LIST** is `also: { say, flat, source }`, under the first, with its own
  heading and its own source. Only Haxan has one (the perfumer's account above,
  Fragrantica's reading below) and the first list then needs a `say` of its own too.
- **AN OLFACTORY LANDSCAPE** is `landscape: { flat, source }`, and it gives that fragrance
  a SECOND BUTTON AND WINDOW standing before View notes. Only Almost Human has one,
  because it is the only house that publishes a landscape instead of notes. **It can only
  ever be sourced from the house** — a landscape on the fallback's authority would be the
  fallback inventing the one thing it does not have — and there is a test.
- **THE SOURCE IS A HIERARCHY, and the owner set it out in capitals**: the perfume's own
  house page first, and Fragrantica **only** where the house publishes nothing. Where
  Pineward's own `pages/master-scent-list` is what gave the notes, the source is named
  `"Pineward, Master Scent List"` and links to it; a fragrance whose notes are on its own
  product page instead is named `"Pineward"`, because they are two different pages.
  Fragrantica carries a **caution** (see the glossary) and a house's own page does not —
  there are two tests, and the one that matters says a house source has no caution. A fragrance with no entry is fine — it gets the
  button and a panel saying the notes have not been found yet.
- **A NEW HOUSE THAT WANTS NOTES** sets `window.HOUSE_NOTES` beside `SITE_ROOT` and loads
  `notes-data.js` then `notes.js` after its own script. **All nine houses do now** — Tale's with no entries yet, so every one of its windows says the notes have not been found —
  and so does the Fragrances view of the contact sheet, which has no house of its own and
  loads them only for the renderer `notes.js` hands out as `window.NOTE_PANEL`. **Renumbering a house means
  renumbering `notes-data.js` in the same turn**, exactly as it means re-pointing the
  Fragrances table; both ends have a test.
- **A fragrance with no name yet** is `<span class="human-title human-untitled">Untitled</span>`
  and a `<p class="human-waiting">` saying so, in both places the title appears (the
  summary and the figcaption). **Don't invent a name or a write-up** — an unfinished house
  should read as unfinished. There is a test.
- **A fragrance that has not been smelled** is not a part at all: it is a name at the foot
  of the house, in a `<section class="house-waiting">` list (Pineward's own is the older
  `.pine-waiting`, which spends the pine green). A fragrance moves up into the numbered
  parts the moment there is something to say about it.
- **A standout** carries the hand-drawn star — copy the whole `<span class="human-star">`
  block from Grande Parfums' Vintage Memoir into another fragrance's `<summary>`. It is an
  SVG path with bowed edges on purpose; a typed star character is not the same thing and
  there is a test saying so.
- **A part of Pineward** (`houses/pineward.html`) is a `<details class="pine-part">` block:
  a number, a small picture and a title in its `<summary>`, and the full picture and the
  writing inside. Copy a whole block to add one, and renumber the ones after it — the
  numbers are in the markup rather than counted, so they are the owner's. **A fragrance
  of ADAR** (`houses/adar.html`) is the same block by another name
  (`<details class="adar-part">`), with its stages — top, mid, base, a sidenote — written
  as `<p class="adar-stage">` labels inside it, and **a fragrance of Almost Human**
  (`houses/almost-human.html`) is the same block again (`<details class="human-part">`,
  `<p class="human-stage">`). All three number their parts in the markup rather than
  counting them, so the numbers are the owner's — and all three are linked at by
  `#part-NN` from the Fragrances table, so **renumbering one means re-pointing that table
  in the same turn**.
- **A section of an essay page** is one `<section class="essay-section">` with an `<h2>`
  in it, whose number is a `<span class="essay-no">` inside that heading. The rule down
  the left is built from those, so adding a section adds a tick and nothing else needs
  changing.
- **A worked equation** on an essay page is a `<div class="math-block">` of
  `<p class="math-line">` rows, each three cells — `.mlhs`, `.meq`, `.mrhs`. The block is
  a grid, so **every `=` in it stands in one column**; a line that carries on from the one
  above has an empty `.mlhs`. Do not go back to indenting continuation lines by hand.
- **A fraction is written vertically**, as
  `<span class="frac"><span class="frac-n">…</span><span class="frac-d">…</span></span>`
  — never with a slash. The rule is the numerator's own bottom border, and a row holding
  one is centred rather than baselined. Inline mentions inside a running sentence are the
  one exception, because a stacked fraction pushes the lines apart.
- **A station on the theories page may carry a picture**: `data-plate` on its
  `<a class="work-row">` is the image its card shows when the station is set out, with
  `data-plate-alt` for the description. A row without one simply has no picture, and no
  row uses it at the moment — the summary plate came off the Note Dissemination card when
  the owner asked for it. A row may also carry **`data-calc`**, an address its card puts
  an `OPEN CALCULATOR` button at its foot for; only `theory-03.html` has one.
- **A NOTE IN THE NOTE LIBRARY** is one `<article class="lib-record">` in
  `categories/note-library.html`, in the `<section class="lib-shelf">` of its family, with
  its explanation in a `<p class="lib-say">`; every other spelling the site uses for the
  same note goes in its `data-aka`, separated by `|`. **Which fragrances use it is worked
  out from `notes-data.js`**, so adding notes to a fragrance needs nothing here — unless
  the note is new, in which case it lands on the **returns cart** at the end of the page
  and a test fails until it is given a record. A new house wanting its fragrances linked
  from the library's cards needs a line in `HOUSES` in `note-library.js`; there is a test.
- **A SPOILER** in a house's writing is a `<details class="human-spoiler">` with
  `<summary>Spoiler alert</summary>`, its paragraphs in a `.human-spoiler-text` and an
  `.human-spoiler-ask` (*Are you sure?*, Yes, No) beside them — copy Spinal Fluid's whole
  block on Ataraxia. `house.js` blurs the paragraphs every time it is opened until Yes;
  No shuts it. Without the script it opens onto them plainly.
- **A WORD DEFINED ON HOVER** in a house's writing is
  `<span class="human-define" tabindex="0" data-define="…">word</span>` — the definition
  comes up in a small ink box when the word is pointed at or tapped. Evergrow's
  *exclusion zone* is the one there is.
- **A NEW PAGE HAS TO BE ADDED TO THE SEARCH'S MANIFEST** — the `PAGES` list at the top
  of `search-page.js`, one line with the trail that says where things found in it live.
  It is the only list of the site's pages anywhere, and the only thing the search needs
  kept up to date; everything *inside* a page is read off the page itself.
- **New category**: duplicate any `categories/` page, change its `<h1>` and lede, add a
  line to `SITE_LINKS` in `nav.js`, and optionally add a `REAL_NODES` entry. **Everything
  on the map must be in the menu; which menu pages are on the map is the owner's to say** —
  they asked for the two to match and then took Contact and Photography back off. Nothing
  breaks when a page is only in the menu. The first of the two **Other** pages became **Researches** and then
  **Works**: `categories/other-1.html` is gone, and `categories/researches.html` is an
  index page rather than a row list. The second became **Photography**.
- **Renaming a category is five places**: the page's `<h1>` reading and its `<title>`,
  `SITE_LINKS` in `nav.js`, `REAL_NODES` in `node-scene.js`, and the trail in `PAGES` in
  `search-page.js`. The *file* keeps its old name — `researches.html` is Works, and
  `other-2.html` is Photography — because renaming it breaks every link into it for no
  gain.
- **A row on the Explorations & Researches page** also carries `data-kind`: `"Research"` or `"Exploration"`,
  which is what the third column reads and sorts on. A row that is neither yet leaves it
  empty and sorts to the end.
- **A frame on the Photography page** is one `<figure class="photo-frame">` inside a
  set's `.photo-grid`, with its `<img>` commented out until the picture arrives. Adding
  `photo-wide` gives it two columns — one or two a set, or it stops meaning anything.
- **A picture in the Pineward gallery** is one `<a class="pine-shot">` at the foot of
  `houses/pineward.html`, pointing at two web copies in `images/Pineward/gallery-web/`
  (a 1600px long edge and a 520px square thumbnail) made from the original in
  `images/Pineward/The Pinewards Gallery Page/`. The order they stand in is the order
  they are shown and numbered in.
- **A FRAGRANCE WITH MORE THAN ONE PICTURE** puts the first in its plate as usual and the
  rest in a `<span class="human-plate-more">` under it — a `<span>`, because
  `.human-plate:has(img) > div` takes any `<div>` for the placeholder and would hide it.
  Haxan and every Tale fragrance carry three. The fragrance reader carries all of them,
  and on the way back all of them fly home. **A photograph arriving at 5152 × 7728 gets a
  web copy before the page points at it** — Haxan's are in `Haxan/web/`.
- **A PICTURE IS CREDITED WHERE IT IS USED.** The owner asked for it in as many words,
  and it is one `<p class="house-credit">` at the foot of a house, above the way on to the
  next, naming the source the pictures were actually taken from. Eight houses carry one:
  Pineward and ADAR from the houses' own sites, Les Abstraits from its own (and its drawing
  of Des Cendres' road, made for the page), Tale, Tombstone and Qimu & Musicians from
  their own — an assumption for all three, see their reports — Ataraxia from
  its own with the logo credit the house published, and **Grande Parfums from the MEUS
  website and Profumix Luxury Perfumes rather than from the house** — which is exactly why
  the line says where it came from instead of assuming. A favourite may also name a
  picture with `data-image`, and that wants crediting too.
- Images live in `images/`, **one folder per house or category** — `images/ADAR/`,
  `images/Pineward/`, `images/Almost-Human/`, `images/Favorites/`,
  `images/Individual Fragrances/`, `images/Theories/` — referenced from the `<img>` tags left commented out in the
  templates. The folder names are the owner's own and are capitalised as they wrote
  them; paths are case-sensitive on the live site, so `ADAR` is not `adar`. Each empty
  folder holds a `README.txt` saying what it is for, which is also the only thing
  keeping it in the repository — git does not store an empty directory. A new folder is
  fine; prefer hyphens over spaces in any you add, since a space becomes `%20` in the
  address (`Individual Fragrances` predates that advice and is kept because the owner
  named it).
- `works/test-node-a.html` / `test-node-b.html` are sandbox pages. They used to be the
  two "Test node" entries in `REAL_NODES` and are not on the map any more — nothing
  points at them; safe to repurpose or delete together.
- The HTML comments inside each template say which block to copy for another entry —
  they are the site's real documentation for its author. Keep them accurate when
  changing a template's structure.
- Placeholder content is still in place in several spots (`Your Name` and the lorem
  ipsum on slide 2). The contact page's address and links went on 2026-09-24 at the
  owner's word — it says only *Get in touch, send a carrier pigeon.* now. Don't
  "fix" these incidentally; they're the author's decisions to make. **The site's own name
  is not one of them any more** — it is *The Taste of Aldehydes*, on slide 1 and in every
  page's `<title>`. Naming the site was not naming the author.

## Glossary

Project vocabulary, verified against the code. When the owner uses one of these terms,
it means what's below. When they use a term that *isn't* here and its meaning isn't
obvious from the code, ask rather than guessing — then add it to this list.

| term | what it means |
|---|---|
| **slide** | One of the three full-screen sections of `index.html` (`#slide-1` title, `#slide-2` the italic line, `#slide-3` the node map). |
| **the paper** | The three decorative layers behind the landing page, drawn by `paper.js`: the black **wash**, the squared **grid**, and the **static** (grain). |
| **curtain** | The mask that reveals the wash and the grid going 2 → 3 — a wipe from the top of the page downwards whose left and right edges run ahead of its middle, so the sides fill in first and the middle of the page last. Three mask layers **added** (not intersected): one sweep down the page, and a lobe growing out of each top corner. `CURTAIN_*` in `paper.js`, `setCurtain()`. It is set on those two layers directly, not on `.paper`: the grain, the map and the thread are never masked — they come up on their own opacity ramps. |
| **the collapse** / **exit** | Leaving the map going 3 → 2. `landing.js` holds the page still, runs `__exit` 0→1 (a shockwave crosses, the map falls into its centre, everything clears to **white**), then `__reform` 0→1 (an ink line draws from the sphere to the top), and only then scrolls. The reforming line stops below the slide-2 sentence, landing on the same point the downward leg leaves from. The sphere left at the end of it does not fade: `node-scene.js` holds `arrival` while `__exit` is set, so it stays solid black and rides the page off the bottom of the screen, and what fades afterwards does so off screen. |
| **the wake** | Only the specks along a branch now — see **wake / wake speck** below. The paper's arrival going 2 → 3 used to be shaped as a duck's wake (a V trailing back from the middle of the page, `WAKE_HALF_ANGLE`); that was replaced by the top-down wipe described under **curtain**, and neither the V nor `WAKE_HALF_ANGLE` exists in `paper.js` any more. |
| **the shockwave** | The narrow ring that closes on the centre ahead of the collapse, on its own faster clock (`WAVE_*` in `paper.js`). Distinct from the suction, which pulls everywhere at once. A second ring (`OUTWARD_*`) runs the other way at the same time, shoving the grid outward while everything else pulls in. It is **on** — `OUTWARD_STRENGTH` is 58; setting it to 0 is how you would remove it. |
| **the chrome's ground** | The blurred box behind a piece of fixed chrome on a phone, so the page travelling underneath it cannot be read through it. `--chrome-ground` on `:root`, redefined under the six dark page bodies; below 700px it stands behind the **Menu**, the contact sheet's view buttons and search, and the three houses' readings. Nothing above 700px carries one. |
| **the menu** | One menu for the whole site, built by `nav.js`: the same dark overlay, fading in the same way, on every page and on all three slides of the landing page. It briefly opened three different ways on the landing page (`mode-title` / `mode-side` / `mode-map`, in a `menu-modes.js` since deleted); "uniform" is the state the owner asked for and none of that is in the code any more. |
| **rank** / **ridge** | One of the copies of the chromatogram trace standing behind the front line, higher up the page and fainter, so the reading recedes like hills. `RIDGE_*` in `extras.js`. |
| **suction** | The even, proportional inward pull `paper.js` applies to the whole grid during the collapse, on top of the per-node dimples — what makes the grid implode rather than just dimple near the middle. |
| **the thread** | The single line running down all three slides, drawn by `thread.js`. |
| **the map** / **node map** | The 3D scene on slide 3 (`node-scene.js`). |
| **hub** / **the centre** | The origin `(0,0,0)` that every branch grows from; rendered as a dark `core` mesh inside two translucent `shell`s. |
| **link node** / **real node** | A clickable endpoint from `REAL_NODES`. A branch *stops* at one; nothing continues past it. There are **seven**, one per page in the menu, and their positions are a **Fibonacci sphere** rather than seven points placed by hand: every branch the same length and the closest pair 71.5° apart. Adding an eighth means recomputing the whole list. |
| **branch** | The tube from hub to a link node — a `CatmullRomCurve3` that leaves the hub radially, then bows through two waypoints. Tubes, not lines, so they can thicken on hover. |
| **waypoint** | The two small dots along a branch (at t ≈ 0.32 and 0.69), derived from the node's position, not placed by hand. |
| **root flare** | The swelling at a branch's hub end (`ROOT_FLARE_*`): the tube drawn wider where it meets the sphere, and taking the sphere's own colour there, so the branch grows out of the centre instead of being poked into it. It is part of the branch's own geometry, not a separate collar — there is no second object at the hub. (If the owner says **collar**, they mean this.) |
| **wake** / **wake speck** | The specks strung along a branch, sampled off its own curve. Each speck is 9 stacked particles that spray apart when pointed at. |
| **cloud** | The separate drifting background speck system. Currently off (`CLOUD_COUNT = 0`) but still wired up. |
| **registration mark** | The hollow square marker used for node labels, reused for the preview's dock and the scroll cue — not a plain dot. |
| **emerge** | A branch's 0→1 growth out from the centre on arrival, staggered per branch (`EMERGE_STAGGER`). |
| **arrival** | The eased follow of `window.__p23`; drives the scene's opacity and every branch's `emerge`. Held where it is for as long as `__exit` is set — see the sphere riding out under **the collapse**. |
| **corrugation** | The sharp zigzag the cursor drags across a nearby branch (`CORR_*`): evenly spaced teeth of one size travelling steadily outward along it, so it reads as a regular wave excited in a wire. Only its height answers the cursor. It used to re-roll its height and spacing several times a second, which read as jitter — that was replaced, deliberately, by the pattern described here. |
| **sway** | Per-branch independent drift. Currently disabled (`SWAY = 0`), machinery intact. |
| **preview** | The dark modal opened by a node carrying a `preview` field, instead of navigating. A `preview` may also carry a **`note`** — what state the page is in, set as its own line; Photography's says it is a work in progress, and it is the only one that has one.  Its connector **arm** is that node's own branch traced out to the window; it lands on a **dock** at the modal's edge. A beat after it opens, the node's **name** is lifted out of the map and set above it. |
| **the structure** | The way `categories/theories.html` is laid out: a technical drawing in three dimensions — ribs, rails, a ruled spine and a swarm of particles — that you scroll *into*. `structure.js`. It replaced an earlier night-sky treatment ("the starfield"), and none of that is in the code any more. |
| **station** / **stop** / **constellation** | One theory in the structure — an assembly of particles with lines drawn between them, standing at its own depth, bracketed and named. The assembly is the click target. The owner calls these **constellations**; they are `stops` in `structure.js`. |
| **the set-out** | What clicking a station does: it comes out of the frame, turns as it comes, and its parts open out onto a ring on the window, with a scale ruled under it and the frame washed back behind. `OPEN_*` in `structure.js`. |
| **the card** | The preview written beside a set-out station (`.structure-card`) — its number, name, the page's own line about it, an optional `data-note`, the readings, and `OPEN →`. It lives inside the station's own link, so clicking it opens the theory. A row carrying `data-calc` also gets a boxed **OPEN CALCULATOR** at the foot of its card; because the card already stands inside an anchor, that one cannot be an anchor — it is a span with a link's role and a link's keys. |
| **fixture** | An assembly that is only structure: unnamed, unbracketed, fainter, and deliberately not clickable. There to fill the frame and to make being bracketed mean something. |
| **the road** | The depth the stations are laid along, and the page height that scrolls down it (`.structure-road`). The swarm is endless; the road is not. |
| **the swarm** | The particles on the theories page that are not part of any assembly. Their depth is wrapped both ways each frame, so the air is full going forward *and* going back. **How many are drawn, and the shape they are scattered in, both come off the window's own dimensions** — the owner asked for the stars to be related to the page's dimensions. The pool is always built whole; only the number *drawn* varies. Building a different number moves every station on the page, for the reason set out in the structure's report. |
| **rib** / **rail** | The frame you travel through: ribs across the way at fixed depths, rails running the length of it between their corners. |
| **the spine** | The ruler drawn along the floor of the frame to the vanishing point, ticked at every whole depth. It is also the **wheel**: dragging it writes the page's own scroll, and pressing it goes on to the next station. |
| **the opening** / **setting up** | What the theories drawing does when the page loads: the rails shoot out to the vanishing point, the ribs come up out of the depth towards you, the rule writes itself along the floor, the air fills and the corner sights snap in last. `INTRO_*` and `built` in `structure.js`; the chrome arrives with it on the `lit` class. |
| **js-coming** | The class a page puts on `<html>` in its own `<head>` while the script that replaces its contents is on its way, so the plain fallback is never flashed first. Carried by `theories.html`, `scent-descriptions.html`, `favorites.html` and `note-library.html`; each script clears it once it has laid itself out, and `window.load` clears it if the script never arrives. |
| **the breath** | The structure's own slow creep: the eye drifts a little way in and back out again on a fixed cycle (`CREEP`, `CREEP_EVERY`), so the page is never quite still but the scroll is always the whole of where you are. |
| **carriage** | The gantry that runs down the frame towards you on its own clock, lighting each rib as it passes. |
| **traverse** | One of the streaks that run across the frame — the mechanical version of a falling star. |
| **chapter** | One grouping in Favorites — whatever an entry's `data-chapter` says, **plus any chapter written up in a `.gallery-chapter` block with nothing filed under it**. The chapters, their names and their order all come from the page. There are two: Chapter 1, which has three favourites and the sun behind it, and Chapter 2, which is *To be determined...* and empty. Chapter 3 was removed at the owner's word. |
| **the register** | The way the contact sheet page's *Favorites view* was laid out: a page ruled edge to edge with horizontal tracks, a square travelling along each, lines between them, and a glitch. **Removed** with that whole view and its two buttons — there is no `favorites.js` in the site any more. If the owner uses the word, they mean that. |
| **track** / **gauge** / **car** / **square** / **the tear** / **the sig** / **index** / **log** | All of the register's own parts, removed with it. |
| **the field** / **the hatch** | The ruled ground of fine strokes the Favorites view carried before it became the register — its reading was which **way** it lay. Removed, like everything else that view had. |
| **Pineward** | The first house in Scent descriptions: `houses/pineward.html`, "the house that smells like trees". An introduction and **forty-seven** parts, one per fragrance, in alphabetical order within five groups. It was fifty-four; the owner has removed several since, so **count the markup rather than trusting a number written down** — this one was wrong for a while. |
| **part** (Pineward) | One of Pineward's forty-seven: a `<details>` showing its number, a small picture and its title until it is opened, and its full picture and writing inside. The pictures are the owner's own, one per fragrance, matched to the parts **by name**. |
| **ADAR** | The second house in Scent descriptions: `houses/adar.html`, "the house that you have never heard of". Eleven fragrances in four groups, on a **void**. |
| **Almost Human** | The third house in Scent descriptions: `houses/almost-human.html`, "Abstraction done quite well" (it was "the house that nearly gets there" until the owner wrote their own). Five fragrances — Burning Bridges, Dear Future, Desert Hope, Ritual Code, Silent Rain — standing in a **crowd**. **All five are written**, and so are the introduction and the standfirst. |
| **the mark** (Almost Human) | The house's own logo, and it is **shown by the hand and nowhere else** — the owner asked for "a hover-to-display thing, similarly to adar". It is not printed on the page at all; it stood at the head of it for a round and does not now (there is no `figure.human-mark`). What shows it is the **fault**: hold a figure together and whatever part of it is faulty stands as the mark for that beat, every beat. Read off `images/Almost-Human/house-web/ah-logo.webp`, an 800px copy of the owner's `AH_Logo_Black.jpg`, **black on transparent** rather than on the original's white, as places a speck may stand. `LOGO_*` in `almost-human.js`. (Not the contact sheet's **mark**, which is a drawn plate.) |
| **the crowd** | That page's ground: people drawn entirely in specks, built out of capsules rather than traced from an outline. They stand **in whatever room the page leaves and over nothing else** — the margins either side of the writing on a wide window, and the **clearings** on one without margins. |
| **the clearing** (Almost Human) | A band down the page with nothing in it, which is where a figure stands when there are no margins to stand in. The page makes one on purpose before the introduction (`.human-gap`), worth nothing above 1111px; the rest are whatever gaps the writing happens to leave. |
| **the stray** | What makes the crowd *almost* human, and the house's name said as a behaviour: every speck knows exactly where it belongs and stands up to a FIFTH of the figure's height away from it, fixed for the life of that figure. At rest a figure is a cloud that gives no hint of a person; the person is entirely the pointer's doing. Bring the pointer near — **anywhere on the figure** — and the specks come home: the figure resolves under your hand and comes apart again when you leave. It never resolves completely (`STRAY_NEAR`); one that came exactly home would be the wrong drawing. |
| **the fault** | What is wrong with each figure on Almost Human, and it shows **only after the figure has been held formed for a moment**: a head that comes apart in slices, a torso that slips and loses specks, one arm on its own, or every part of it each on a clock of its own. Four of them, running in order down the page. It is a **beat rather than a drone** — one second in every six, easing in and out at each end — and every part of it is about half the size it first was. On every beat the faulty part goes to **the mark**. `FAULTS`, `GLITCH_*` in `almost-human.js`. |
| **the rain** (Almost Human) | The one thing on that page that is not a person, and it is weather: rain falling the length of the page, each drop a short string of specks. It lives on the window rather than down the document. |
| **the sun** / **the chair** / **the rays** (Almost Human) | **All removed.** A sun drawn as a ring with uneven rays and an empty chair stood in those margins for one round; the owner asked for both gone and for **rays** — "particle rays that blast from here and there" — in their place, and then, having seen them, asked for the rays gone as well. Nothing of any of the three is in `almost-human.js`: no `SUN_*`, no `CHAIR`, no `props`, no `RAY_*`, no `armRay`, `buildRays` or `drawRays`. The rain is what is left. |
| **Ataraxia** | The fourth house in Scent descriptions: `houses/ataraxia.html`, *A gothic avante garde house*. Five fragrances — Amaretto Jazz in the Melting Room, Deity, My Doll's Makeup, Spinal Fluid, Vestibule — **four written** (2026-09-24), with the introduction; My Doll's Makeup is still to be written. The owner says the house's subject is statuary; its **page** is dark gray crossed by **bands** of light, which is a different thing and deliberately so. |
| **the bands** (Ataraxia) | That page's ground: long drifts of glowing white specks crossing the window from side to side, each at its own angle six to twenty-six degrees off flat. They pass **behind the writing** rather than round it, which is what the owner asked for. `ataraxia.js`. |
| **the quiet** (Ataraxia) | How the reading is kept while the bands cross it: a speck over the column is drawn at `QUIET` of its strength, and the **bloom** round it — soft and fourteen times as wide — is scaled by `hush³` so it is gone long before the writing. The band still passes behind the words; it just stops glowing while it does. |
| **the crest** | The swell of brightness travelling along a band's own length on its own clock. **The specks never move**; what moves is where the light is, and that is the whole of Ataraxia's glow. |
| **the kindle** | What answers the hand on Ataraxia: the specks within reach of the pointer burn brighter, eased in and out. |
| **the churchyard** / **standing** / **the stillness** / **the light** (Ataraxia) / **the halo** | **All removed.** Angels and crosses stood down both margins of Ataraxia for one round — cut out of specks, on plinths, perfectly still, with a soft light crossing the window and a fine ring coming up over the nearest one under the pointer. The owner asked for them gone (*"Remove the ataraxia crosses and angels"*) and for the bands in their place. Nothing of any of it is in `ataraxia.js`: no `angel`, no `cross`, no plinth, no lean, no `HALO_*`, no `LIGHT_*`. If the owner uses one of these words, they mean that removed drawing. |
| **Grande Parfums** | The fifth house: `houses/grande-parfums.html`, smelled at Art Niche Expo 2026. **Seventeen** fragrances — fifteen written up in alphabetical order, and Genesys and Lounge Leather at the foot, not smelled yet. |
| **the drift** (Grande Parfums) | That page's ground, and the quietest thing on the site: fine specks rising slowly up the window, each fading in and out on a clock of its own, with a few larger **motes** among them; they **lean** towards the pointer rather than being pulled to it. `grande.js`. It is the owner's *"subtle designs please"*. |
| **it says nothing about the house** | Why the drift is what it is. Every other drawing here is its house said as a behaviour — a wood, a void, a crowd, bands of light. The owner still has not said what Grande Parfums is (*"Idk the theme to be honest"*), so its ground is a ground rather than a statement. **When they say, `grande.js` is the file to replace**, not to extend. |
| **mote** | One of the larger, plainer specks in that drift, about one in fourteen. The only thing in it you would call a shape. |
| **the star** (Grande Parfums) | The owner's own standout mark, asked for by hand: a five-pointed star **drawn** rather than typed — an SVG path with every point nudged off true and every edge bowed. On Vintage Memoir, their favourite of the house, and nowhere else yet. `.human-star`. |
| **Les Abstraits** | The sixth house: `houses/les-abstraits.html`, *Eugen’s ideas and Antoine Lie’s execution*. Four fragrances — Belle Âme, Des Cendres, La Douleur Exquise, Philosopher's Walk — **written** since 2026-09-23, with one sentence in the introduction left unfinished on purpose because the owner left it so. |
| **the drawing** (Des Cendres) | The ink drawing standing in Des Cendres' writing — the road, the pines, the gated yards, the fire and its smoke — which the owner asked for in the writing itself (*"claude, maybe try to generate a picture of this"*). `images/Les-Abstraits/des-cendres-road.svg`, `.human-scene`. Generated, not photographed, and credited as drawn for the page. |
| **the last word** | A paragraph at the very foot of a house, after the fragrances and before the credit — `.human-after`. Les Abstraits' is the only one: it sends the reader to Antoine Lie's own paragraph, in a **new window**, as the owner asked in capitals. |
| **Tale Parfums** | The seventh house: `houses/tale-parfums.html`, in the frame on the sheet that was the first empty one — the owner's **placeholder 7**. Four fragrances in alphabetical order: Bad Lily, Fleurt, Rouse, Water Me. The house styles itself *TALE Parfum*; the page uses the owner's name for it. |
| **Tombstone** | The eighth house: `houses/tombstone.html`. Five fragrances in alphabetical order — 3 Feet 5, Evergrow, No Need to Come By, Sing at My Funeral, Sweet Coffin — named, noted, pictured and, since 2026-09-24, **written**, with *A house that expanded on death* under its name; 3 Feet 5 has one paragraph and says the rest will be filled in later. The owner's picture calls the first *3 Foot 5*; the page uses the house's name. |
| **Qimu & Musicians** | The ninth house: `houses/qimu-and-musicians.html`. Four fragrances, one to a player in a band — Guitarist, Vocal, Bassist, Drummer, in the order the owner numbered them. *A house of music and fragrance*. Guitarist and Vocal are written (2026-09-24); Drummer says **Description coming soon.**, the owner's own words; Bassist is still to be written, and the introduction says *I will write it later.* Only Vocal's notes could be checked. |
| **the emblems** (Tale) | The four drawings off Tale's labels — the lily with an **eye**, the heart in a **sweet** on a stick, the **rose**, the **sprout** in its pot — which the owner called *"the pictures that come with the number 2"*. The small squares in that house's list, and what `tale.js` draws again in a pen line. The lily is the house's mark and stands at the head. |
| **the doodles** | Tale's ground: the emblems and the small things a person doodles in a margin (stars, a moon, drops, a sun, a heart, a swirl, a cloud, a sparkle, a flower, a leaf), drawn in a wobbling line down both margins and never over the writing. They **draw themselves in** the first time they are seen. None on a window without margins. `tale.js`. |
| **the boil** | What a doodle does under the pointer: it is redrawn every 140ms, each time slightly differently — how a drawing moves in hand-drawn animation. Away from the pointer it is perfectly still. `BOIL_*` in `tale.js`. |
| **the hands** (Tale) | **Removed.** Gochi Hand (a marker, for headings) and Patrick Hand (a pen, for the reading) set the whole of Tale's page for two rounds; the owner then asked for "the font the same as normal", and the page is in the site's own face now, loading neither. What stayed of the hand-drawn page: the pictures' **drawn corners** (`--drawn`, eight radii), their tilt and a strip of **tape**, a loop round each number, **straight rules**, the doodles, and the page **coming in** piece by piece (`tale-coming`, the entrance in `tale.js`). |
| **the house shape** | What every house page is, and since 2026-09-21 what `house.js` gives the newer ones: the parts opening on a measured height, the rank down the side, and a photograph taken off the page when its file is not there. It uses the `human-*` class names, which were written for Almost Human and are the shape's names now. Pineward, ADAR and Almost Human still carry their own copies of it. |
| **the rank** (Almost Human) | The scale down the side of that page: Pineward's **trunk** and ADAR's **sounding** by a third name, in plain ink. (Not the chromatogram's **rank / ridge**, above.) The fill is how far down the page you are, from its very first pixel; the ticks are how many fragrances you have been past. |
| **the void** | ADAR's ground: a hole standing off to one side of the window with soundings ringing out from it and specks falling round its rim. Drawn by taking the disc back out of the finished drawing, not by painting one over it. |
| **the sounding** | Two things on that page, and they go together: one of the ringed scales drawn out from the void, and the scale down the side of the page with one tick per fragrance — Pineward's **trunk** by another name. |
| **stage** | Top, mid, base, a sidenote: the label above a run of paragraphs about one part of how a fragrance develops. `<p class="adar-stage">`. |
| **the ADAR Effect™** | The owner's own coinage for this house's turpentine quality — the menthol-like trigeminal lift without the dense forest behind it. Written as **ADAR DNA** in exactly three places on purpose (the introduction, and two entries where they said they meant it); leave those. |
| **essay page** | A page for a long piece of writing on the theories drawing's ground: a swarm of particles behind it, sights at the corners, and the **rule** down the left. `essay.js`; the three theories and the resins research. |
| **the calculator** | The theory's own arithmetic, done for you: a screen-wide button at the foot of `works/theory-03.html` opens it, and it stands **in that same page** rather than in one of its own — the owner asked for the field of stars behind it to stay exactly where it is, which a second page could not do. Three models (Default `IBR`, Modified var. 1 and var. 2), each drawing the theory's own diagram from the numbers as you type. It **opens completely blank** — no field carries a starting number — and **no field will take anything above 100**, which is held in the script as well as in the markup. A **reset** by the fields puts it back to that, and goes dim when there is nothing to clear; a **log scale** toggle by the graph draws the same readings on a logarithmic y, where the 0.5 and 2 thresholds are spread across the picture rather than crushed into the bottom of it. Both are a way of looking or a clearing, not inputs: the scale survives a reset and a change of model. **IC and BC are two halves of one hundred** — typing one sets the other — and the sign is a plus-or-minus whose two halves are drawn as their own characters, a `+` set over a `−` with air between them, because the single `±` welds them together in this page's face. `calculator.js`; `calc-*` in `style.css`. |
| **the summary plate** | `images/Theories/note-dissemination-summary.png`: the whole of the theory on one sheet, which stands at the top of the piece and is what its **card** shows on the theories page. Generated rather than drawn, from the same script that made the piece's diagrams. |
| **the zone** | Short for the *zone of indistinguishability* on `works/theory-03.html`: the circle a note has to stand outside of to be told apart from the others. Every diagram on that page is that circle with arrows on its radii, and a diagram says what it says through two numbers only — how much of an arrow's body is inside, and which end the head is on. `zone-*` in `style.css`. |
| **the maths** (theory-03) | The notation on that page, and the **only serif on the site**: the owner asked for it in a face of its own, and setting a variable in the mono would have made it look like one of the site's readings. `--math` on `:root`; `math-*` and `.mv` / `.mrec` in `style.css`. |
| **the rule** (essay) | The scroll indicator down the left of an essay page: a hairline filled in as far as you have read, one tick per section, the section you are in named under it, and a percentage. Every tick is a link. |
| **the gallery** (Pineward) | The owner's own photographs at the foot of `houses/pineward.html`: a strip of small squares that cycles on its own and stops while it is being looked at, and a **viewer** that stands one of them over the darkened page with its number in its own top right corner. `pineward-gallery.js`. The number is **where it stands in the strip**, not what its file is called. |
| **the viewer** | The darkened page with one picture standing in the middle of it and an arrow either side — Pineward's gallery has one and the Photography page has one, and they are separate scripts that behave the same way. |
| **Photography** | What the second **Other** page is now (`categories/other-2.html`): the frames in **sets**, in a grid that a **wide** one breaks, numbered down the margin, each with what a photographer writes on the back of a print. `photography.js`. If the owner says "Other", they mean this page before it was that. |
| **set** (Photography) | One grouping of frames on that page, with its own number, title and line. The unit the page is read in — which is why a frame's arrival is staggered within its set rather than down the whole page. |
| **Explorations & Researches** | What the **Researches** category is called now (`categories/researches.html`, which keeps its filename). It was **Works** for a round, which the owner then made specific. Same index layout, with a third column saying whether each piece is a **research** or an **exploration**. |
| **the primer** | *My Personal Introduction to Perfume*, `works/my-personal-introduction-to-perfume.html` — Explorations **000**, the first row on that page. An essay page in **gold**, with the diagrams the owner asked for: oil + alcohol (the perfume holding exactly the two), the concentrations as overlapping bars from the owner's own table, the accords table, and two pyramids that are one true triangle cut in three. |
| **the mist** | The primer's ground: drops of perfume rising up the window and coming apart into vapour as they climb — its "From liquid to gas" as a drawing. Near the pointer they turn to gas sooner (the hand warms them), and over the writing they are drawn quietly. `primer.js`. |
| **exploration** | One of the two kinds of thing on the Works page: going out after a smell and writing down what is there, as against a **research**, which is a material at a time. A row says which on itself, in `data-kind`. |
| **the ground** (Pineward) | That page's paper, turned very faintly towards `--pine-green`: a 2% wash, two soft pools of it high on each side where the wood stands, and the green gathering towards the foot — which is the Roots stratum. It must stay faint; this page's accent is worth something because it is spent in so few places. |
| **the bark** / **the two colours** | Pineward's wood is drawn in `--pine-bark` (`#4a3422`) and `--pine-green` (`#1a4a2c`) rather than in ink: the trunk is bark the whole way up, a branch runs bark at the trunk to green at its tip, and a needle is mostly green wherever it stands. One `tone()` in `pineward.js` mixes them; `BARK` and `GREEN` there keep the same pair as the stylesheet. |
| **the say** (the sheet) | The line about a house on the Houses view — *The house that smells like trees* — under the house's label, **only while it is pointed at**, the front house's too (it showed on the front one always for one round). Capitalised as a subtitle, at the owner's word, and Ataraxia's is its subtitle. |
| **index** | The way `categories/researches.html` is laid out: readings across the top, plates on the right, and a sortable, searchable table in the bottom left corner. `index-page.js`. The contact sheet's **Fragrances** view is built from the same markup and script but laid out again for itself — one centred column, the table given the room — under `body.view-fragrances`. The copyright line that used to sit under the board is gone from both. |
| **the board** | That table and the search above it, taken together (`.index-board`). It scrolls inside its own box so the page around it does not grow. |
| **the search page** | `search.html`: the one place that looks over the whole site. One field ruled across a dark ground of drifting specks, a row of filters under it, and the answers as rows carrying a number, a name, what kind of thing it is and the **trail**. |
| **the Note Library** | `categories/note-library.html`: every note named in a fragrance on the site — 534 **names as written**, as 330 **records** on 16 **shelves** — each with a brief explanation, stood up as books by `note-library.js`. In the menu above Photography, not on the map. **Almost Human's olfactory landscapes are not in it**: they are impressions, not notes, and were taken out at the owner's word after one round. |
| **names as written** | The Note Library's readout of every different way a note is written in `notes-data.js` — *Tonka* and *Tonka Beans* are two. It was labelled "Spellings" (558, with the landscapes) and the owner asked what it meant. |
| **direct words** | How the Note Library's terminal matches, at the owner's word: every word typed must BE a word in a note's name or its other spellings (a plural counts). No near misses, no starts-with, and nothing found by what a note is said to be. The site's own search is still forgiving. |
| **the data bar** / **the barcode** (library) | What makes a book digital: a lit bar across its head filled by how much the note is used, and a barcode of its own over its call number, drawn off its name. With the glass body, the cut corner, the scanlines and the flicker under the hand, they are the owner's "a little more digitalized". |
| **record** (library) | One note in the Note Library: an `<article class="lib-record">` with its name, the other spellings folded into it (`data-aka`), and what it is (`.lib-say`). Stood up as a **book**. |
| **shelf** (library) | One family of notes in the Note Library — Citrus, Woods, Impressions and so on — with a three-letter **code** (`CIT`, `WOO`, `IMP`), a colour of its own, and its books standing on boards that wrap across the page. |
| **book** / **spine** (library) | A record as it stands on its shelf: as thick as the number of fragrances that use it, as tall as its own (seeded), its name down the spine, and a **call number** at its foot. The last on each shelf **leans**. Pressing one **pulls it out** and opens its card. |
| **call number** | A book's shelf code and its place on the shelf, counted alphabetically — `WOO 007`. Worked out, not written, and unchanged when the books are reordered by use. |
| **the terminal** (library) | The `query>` field over the Note Library: books that answer light up, the rest go dim, empty shelves fold away. It reads names, other spellings, and what a note is said to be ("smoky"). |
| **the catalogue card** | What pressing a book opens beside the stacks: call number, shelf, explanation, other spellings, and **Found in** — the **individual fragrances** first, by name, then **Houses**, each house named and then its fragrances, every one linked to its part. It had a bar per house for one round. (Not the theories page's **card**.) |
| **the returns cart** | The shelf the Note Library puts at its end for any note `notes-data.js` names that no record carries. Empty, and a test keeps it so. |
| **the lamp** / **the dust** (library) | The Note Library's room: a soft light following the pointer over the stacks, and specks in the air brighter near it. |
| **a spoiler** | `.human-spoiler` on a house: a dropdown marked *Spoiler alert* whose paragraphs open blurred under *Are you sure?* — Yes clears them, No shuts it, and it asks again every time. Spinal Fluid's Attack on Titan paragraphs, at the owner's word. `house.js`. |
| **a definition on hover** | `.human-define`: a word in a house's writing whose definition comes up in a small box when it is pointed at or tapped. Evergrow's *exclusion zone*, at the owner's word. |
| **the plan** (search) | **Removed.** The squared ground behind the search page, first in CSS and then drawn. The owner asked for the grid gone and for the specks to carry the page on their own. Nothing of it is in `find-ground.js` now. |
| **the specks** (search) | The field of flecks hung across the whole search page, drifting about their own places, webbed to their near neighbours, gathering towards the field and brightening while something is being typed. They are the whole of that page's ground. |
| **the filters** (search) | The row of words under the search field — All, Houses, Fragrances, Researches, Favourites, Pieces, Sections, Notes — narrowing the answers to one kind, each carrying the number it would give. The kinds are the ones `search.js` already puts on an entry, so there is no second list of the site's categories anywhere. |
| **the trail** | Where a thing lives, said as a path: *Scent descriptions · Houses · Pineward*. Every answer a search gives carries one. |
| **a page's own search** | The small mark in the top right of a page that opens into a field and looks over THAT PAGE only. What it cannot answer it hands to the search page. |
| **the trace** | **Removed** with the contact sheet (2026-09-23). What joined two pictures on it: one straight hairline broken into even dashes, minimal and measured. It replaced the run, the rails, the rungs, the knots and the tufts, all in one round, when the owner asked for the connections to be reworked "minimal, futuristic, and interesting". |
| **the pulse** | **Removed** with the contact sheet. The short lit run of dashes travelling along a trace, each on its own clock. The whole of the movement on that page, and what makes the map read as live rather than printed. |
| **the pull** | **Removed** with the contact sheet. What the pulses did while a picture is pointed at: **every** one of them on the map turns round to run towards that picture — into it on the traces tied to it, towards its end of the line on all the rest — and they run faster, longer and brighter while they do. `PULL_*` in `contact-sheet.js`. |
| **the tie** | **Removed** with the contact sheet. The small open square where a trace meets a picture, with a stub of line into the edge — a registration mark. It does the job the knot and the tuft used to. |
| **the knot** | **Removed.** The crowd of specks where a line met a picture — the rails of a run drawing together to a point. Replaced by the tie. |
| **rail** / **rung** | **Removed.** The two or three parallel lines of specks a run between two pictures was made of, and the ties across them. Replaced by the trace. |
| **hot** (the sheet) | The house being **rested on** (`.hot`), which stays sharp and in front while its motifs come up. On the old contact sheet it was the picture the pointer was on, whose specks came loose and drift, drawn softer and heavier, while the rest of the sheet steps back. The picture itself never moves. |
| **the spotlight** | What the ADAR void does under the pointer: the house's own mark is drawn inside the hole and nowhere else, coming up as the hand nears it. |
| **the log** / **the dust** | The hairline depth scale ruled down the left of the ADAR page, and the slow fall of specks through it. What fills that margin. |
| **the mark** | The one plate on an index page that is drawn rather than photographed: a slow ring of specks with lines between the near ones — the chamber's orbit printed small, on white. |
| **research** | One piece in Researches — a material at a time, where it comes from and what it smells like. The first is `works/resins-in-perfumery.html`. |
| **stratum** | One of the four groups of thirteen parts — Canopy, Understorey, Trunk, Roots — a section through a forest read from the light down into the ground. |
| **the wood** / **the canopy** | The drawing behind Pineward: conifers standing down both margins the whole length of the page, specks strung along their branches, grown from nothing when the page opens and holding their shape afterwards. Kept out of the middle of the page, where the writing stands. It was one canopy behind the title before the owner asked for it extended through the whole piece; they may still call it the canopy. |
| **the one tree** (Pineward) | What the wood comes to where there are no margins to stand it in — a phone. One tree, in the clear band at the top right of the head, where the owner marked it; the same tree as any other, blooming under the hand the same way. `ONE_*` in `pineward.js`. |
| **the bloom** | What Pineward's wood does under the pointer: the specks near the hand are drawn more plainly, **turn towards the house's dark green** (`GREEN_LIFT`), and put out a few short needles, all eased in and out together. Nothing moves — the tree is only drawn fuller, and greener, there. |
| **the idle** | The pixel of drift each speck in that wood keeps about its own place, so the drawing is never quite still without ever going anywhere. |
| **the reading tree** | **Removed.** For one round Pineward's progress bar was the fir off the bottle, drawn empty and inked in from the ground up. The owner asked for it scrapped — "remove the tree on the left, scrap that idea" — so there is no `firPath` and no `FIR_*` in `pineward.js` any more. |
| **the trunk** (Pineward) | The scale down the side of that page: a hairline the length of the piece, filled in **dark green** as far down **the page** as you have scrolled — from the very first pixel of it, not from the first part — with one tick per part inked in as that part is passed and the reading in the corner counting them. The fill and the ticks say two different things on purpose: how far down you are, and how many you have been past. ADAR's **sounding** gained the same fill, in silver. It reaches its full height at the foot of the page, which it did not always — see Pineward's report. |
| **the green** (Pineward) | `--pine-green` (`#1a4a2c`), this page's only accent and spent nowhere else on the site: the scale, the reading, the stratum number, the cue on an open part, and the wood's answer to the hand. `pineward.js` keeps the same value as `GREEN` for the canvas — change one and change the other. |
| **the grain** / **the wave** / **the sweep** / **knot** | All of the hatch's answers to the hand, removed with it — see **the field / the hatch** above. |
| **mound** / **skyline** | The reading the field carried before *that*, when it was a lattice of marks: a rise in its top edge per entry. Nothing of it is in the code either. |
| **the chamber** | The way `categories/favorites.html` is laid out: two injectors at opposite corners of the window — top right and bottom left — firing streams of particles across it on white, which join an orbit standing round the menu of favourites. `chamber.js`. The theories drawing's world turned inside out, and the one page here that spends no accent colour at all. |
| **injector** | One of the chamber's two sources (`S-01`, `S-02` on the drawing), each at its own depth in the volume. They stand at opposite corners — top right and bottom left — and take turns being the quick one. |
| **the orbit** (chamber) | What the chamber's streams join: a tilted circle of particles — a **lens**, pressed flat onto its own plane — standing round the word, with its own path drawn faintly through it. It is the only arrangement the page has: opening the menu widens it, closing the menu narrows it. Not to be confused with **the ring / the orbit** below, which is a removed Favorites treatment. |
| **the entry** | How a stream joins the orbit: aimed not at the middle but along its own **tangent** to the orbit, carried forward along the way the orbit runs (`entryFor`, `ENTRY_GRAZE`), so it comes in at a slant already going the right way. |
| **the word** | `FAVOURITES`, standing in the middle of the chamber's orbit: the whole of that page's chrome when it is closed, and the button that opens the menu. Set wider than the orbit so the orbit's rims cross the ends of the lettering, one in front and one behind — so its size and `RING` are one decision. Bracketed by **crop marks**, which run out towards each other as the hand comes on to it, with the **cue** under it. |
| **the cue** | The small boxed label under the chamber's word saying what pressing it does — `EXPAND`, and `COLLAPSE` once it is open — with a chevron pointing the way it will go. |
| **the hold** / **the frame** | What the chamber used to do when the menu was opened: every particle took a seat on the border of the window and the whole rectangle travelled round it. Removed — the orbit simply widens now. Nothing of it is in the code (no `EDGE`, no seat, no `FLOW`). |
| **the handover** | The end of the burst: the chapter page is laid **under** the mesh while the mesh still has the window (`laid`), and only once the drawing has gone does its writing come in (`here`). Its cards used to start arriving underneath the black, so the end of the burst read as a cut to a page already part built. |
| **the burst** | What opening a chapter in the chamber does, in **one continuous movement**: from the press every piece of chrome fades — the menu being **drawn into it**, distorted and tipped towards the middle while its rows collapse from the outside in rather than rising back into the word — and the chamber closes on the middle as **two populations**: the ring narrows as a ring along its own orbit, **carrying on at exactly the speed it was already turning at**, while everything still crossing the window keeps the heading it had and is **bent in by the middle** on a curve, each on a clock of its own. They meet, and **the mesh** goes out from that point. `BURST_*` and `MESH_*` in `chamber.js`. For the length of it the particle physics is not run at all; the chamber's report says why, and lists the things that were tried and were wrong. |
| **the mesh** | What goes out when the two populations meet, and the whole of the second half of the burst: a **lattice** standing in the ring's own plane — rings crossed by spokes — with a front travelling outward through it, **spinning about its own axis** rather than turning on the window (the ellipse stands where the orbit stands and the pattern turns inside it), and the home page's own two halo shells riding out with it, bending what is behind them rather than painting a colour over it. Nothing in it has a colour. It is the owner's *"more weblike"*; it is called the mesh here only because **the web** was already this page's cursor. |
| **panel** (the mesh) | One cell of that lattice, between two of its rings and two of its spokes. Behind the front every panel darkens on a clock slightly its own until it is the chapter page's own black — which is how the window turns over now. |
| **the black part** | **Removed.** For several rounds a black ellipse was cut open from the same point a beat behind the drawing (`clipTo`, `CLIP_ROUND`, `WAVE_LEAD`, a `clip-path` on `.chapter-page`), and it was catching the drawing up half way across the window. The owner asked for it gone and for the panels to darken in its place. Nothing of it is in the code. |
| **a chapter's page** | What the burst opens into: the chapter named **with an arrow either side of it**, the reading over it, what that chapter is (written in `categories/favorites.html`, one block per chapter), and its favourites as **cards**. Black, with **silver** — no accent anywhere on it, which keeps the chamber's promise of spending none — and whatever **ground** that chapter asks for standing behind all of it. |
| **the arrows** (a chapter) | The two buttons either side of a chapter's name, stepping one chapter along and wrapping round. Nothing of the **burst** is replayed: the sheet fades, the page is rewritten under it, and its entrance is run again. They are taken off the page when there is only one chapter to be on. Between two chapters that each have a drawing, **the morph** runs. `stepChapter` in `chamber.js`. |
| **the morph** | What the arrows do between Chapter 1 and Chapter 2: every speck of the sun, as it stands, is flown into the moon's first frame (and back), on a spiral about the middle, warm tones to cold, on a canvas of its own (`.chapter-morph`), while the writing fades out and back in half way. Both grounds hand their specks over through `capture()`. `morph`, `MORPH_*` in `chamber.js`. It used to be a cut. |
| **the way out** (a chapter) | Pressing "← Favourites", and it is three beats rather than one frame: the writing goes, the chamber is handed back to itself **under a black that is still solid**, and only then does the black clear. It used to be a cut, and what was under it was a white page with no chrome on it — the flash the owner asked to have made "way smoother". `LEAVE_WRITING` and `LEAVE_CLEAR` in `chamber.js`, matched by two numbers in `style.css`. |
| **the house** (a card) | What a favourite's card reads where its **date** used to: the perfume house, off `data-house`. There is no date anywhere on that page now, and `spanOf` — which sorted them into a range over a chapter — went with them. A favourite not yet told its house prints an em dash. |
| **opening a favourite** | What clicking a card does: it takes the whole width of the grid, the favourites after it travel down a row, and it opens on a measured height into what is written about that fragrance and the two ways on from it — **GO TO FRAGRANCE**, which follows the entry's own `href`, and **NOTES**, which opens the site's own notes window in this page's colours. One at a time. The card is a `<button>` and not a link, because what it opens carries links. |
| **the sun** | The ground behind Chapter 1: a sphere far bigger than the window drawn entirely in specks — a Fibonacci surface, three latitude rings and four meridians turning with it, a **registration ring** that does not turn, five **prominences** rising off the limb, and a corona. `sun.js`. Its readability is Ataraxia's, by name and by the same two mechanisms at its own values: a speck over the sheet is drawn at `QUIET` of its strength and its **bloom** is scaled by `hush³`, so the glow is gone long before the writing is. |
| **the moon** | The ground behind Chapter 2, since 2026-09-24: the sun's construction turned to night, on **the sun's own tilt and rate, the same way round** (`TILT`, `SPIN`, the same numbers in both files). Lit on one side with a soft terminator and earthshine, the light swinging from full to a thick crescent and back (**the phases**, never a new moon); **craters** with rims, peaks and rays, dark **maria**, and a tilted **ring of debris** turning faster than it. `moon.js`. |
| **the wind** (Chapter 1) / **the sky** (Chapter 2) | What stands down the left of the two chapter pages, which the owner saw empty: the sun's **solar wind**, strands of warm specks fanning out from its limb to the left edge (`WIND_*` in `sun.js`); and the moon's **sky**, stars at three depths twinkling on their own clocks, dust, and now and then a **shooting star** (`STARS`, `DUST` in `moon.js`). |
| **a chapter ground** | The drawing behind a chapter's page, asked for in the page's own markup (`data-ground` on the chapter's block) and registered by its own script on `window.CHAPTER_GROUNDS`. There are two, `"sun"` and `"moon"`. A chapter without the attribute gets the plain black every chapter used to get. (Not Pineward's **the ground**, which is that page's paper.) |
| **the read** | What pointing at a row of the chamber's menu does: the stretch of orbit level with it swells outward, and the rule under the row draws back from the right. It replaced a **cinch**, where the sides left the orbit and leant in towards the row. |
| **the level** (chamber) | **Removed.** A chapter used to open a second level of rows inside the same menu, listing its favourites. It opens a page of its own now: there is no `.chamber-item` and no back button in the menu head any more. |
| **leader** (chamber) | The line that used to be run from each end of a pointed-at row out to the side of the window, with a tick where it landed — the "selection lines" the owner asked to have taken off the menu. Gone from `chamber.js` entirely; the orbit's swell is the whole of the read now. (Not to be confused with the short leader still drawn at each **injector**, along the way its own stream leaves.) |
| **the disc** | What the chamber's orbit is made of: a band with a width and a thickness rather than a single line of specks. Each particle stands at its own radius within `DISC` of the orbit either way, and a little off its plane (`DISC_LIFT`). |
| **the web** | What the chamber's **cursor** does (not the burst's lattice, which is **the mesh**): the specks near it are joined up with fine lines, each coming and going on its own clock and drawn a hair off the two it joins, so the net is always a slightly different net. `WEB_*` in `chamber.js`. |
| **ranged** | What the chamber briefly did to a particle it was answering with: a fine hollow square drawn round it. Removed with the rest of the reaction-by-emphasis — there is no `MARK_*` in the file. If the owner uses the word, they mean that removed treatment; what is there now is **the web**. |
| **contact sheet** | The strip of every frame on a roll of film, printed together so you can pick one — and the way the Houses view of `categories/scent-descriptions.html` was laid out until 2026-09-23: pictures scattered in depth and joined by dated lines, after a **flick**. **Replaced** — by the chain for a round, the **hang** for half a day, and then the **axis** — and taken out of the code; the owner may still call the page that. `contact-sheet.js` keeps its name and draws the axis. |
| **frame** | One house's picture on the Houses view (`<a class="sheet-frame">`), a link to its page: framed on a white mount, standing on the helix, with its **label** under it — its number, large, and its name. One carrying `data-open="no"` has no page written behind it yet; `data-motif` names its motifs. |
| **the depth** (the sheet) | **Removed** with the contact sheet. It stood in three dimensions: every picture but the middle window is given a depth and then projected, so what is further back is drawn smaller, fainter and nearer the vanishing point, and what is in front is drawn over it. It is done in the SCRIPT rather than with a CSS `perspective`, because the lines between the pictures are drawn from the same numbers — a transform in the stylesheet would move the pictures and leave every line behind. `DEPTH_MAX`, `FOCAL`, `--depth`. |
| **plate** | **Removed** with the contact sheet: the frame the flick settled on and kept at the top. |
| **the flick** | **Removed.** The pictures going past in a middle window on hard cuts, fast then slowing, when the Houses view opened — each shown once in a fresh random order in its last round. The owner asked for "that startup animation" gone completely on 2026-09-23, and the houses coming out of the axis is what the page does instead. There is no `FLIP_*` and no `.flicking` anywhere, and a test says so. |
| **link** / **route** | **Removed** with the contact sheet: a line between two pictures at whatever angle they lay at, carrying a date. What joins two houses now is a **bar**. |
| **the swipe** | How the contact sheet's two views change over **once both have been opened**: the page travels sideways, what you are leaving going off one edge as what you are going to comes in from the other. The first time a view is opened there is no swipe — it is the plain swap, because a swipe says "these two stand side by side", which is only worth saying to somebody who has seen both. The chrome does not travel: the Menu, the category's name, the buttons and the search all live outside the box that slides. `views.js`. |
| **view** | One of the two ways the Scent descriptions page shows its category, behind the two buttons across the top: the **houses** (the axis) and the **individual fragrances** (the index). `views.js` switches them, and only one is ever on the page except during the swipe. It briefly had a different pair — the **map** and **Favorites**, the second of which was the removed **register** — so if the owner says "Description portfolio" or "the Favorites view", they mean those. |
| **houses** | The Houses view: one picture per house, on the **helix**, in order — 01 at the front to begin with. |
| **the axis** (houses) | How the Houses view is laid out since the evening of 2026-09-24 — the owner's "something to do with aprticles ... a central axis ... impressive, and navigatable": a vertical line of specks down the middle of the page, always falling, ruled with ticks that travel as you do, carrying each house's number as a button where that house stands. `contact-sheet.js`. |
| **the helix** | The two strands of specks winding round the axis, and the houses riding on them: `SPAN` of the page apart and `TURN` round the axis from one to the next, nearer and larger the more they face you. A column of **dust** turns round the axis with it. |
| **the front** (houses) | The house on the axis, facing you: the largest — the ones either side about three quarters of it (`SIDE_FALL`) — with a **halo** of specks turning round it. Pressing it opens the house; pressing any other brings that one to the front. |
| **tether** | The line of specks from the axis out to a house, with a pulse running outward along it. A house arriving comes out along its tether. |
| **the way round** | The buttons at the side of the Houses view — up, where you are (*04 / 09* and the name), down — across the foot on a phone. With the wheel, a drag, the keys and the numbers on the axis, the ways of **travelling** along the helix. |
| **the hang** | **Removed** the same day it arrived (2026-09-24): every house hung from a picture **rail** on a **hook**, high and low in turn — a salon hang — hung picture by picture as the page arrived, each **swinging** when brushed. The owner then asked for particles and a central axis. If the owner says the hang, the rail, the wires or the swing, they mean that. |
| **the label** | Under every house: its **number**, large — the owner asked for the numbering kept — and its name. The number is its own element beside the caption, never inside it, or the page's own search reads "02ADAR". |
| **the swing** | **Removed** with the hang: a picture as a pendulum on its hook, swinging when brushed. |
| **the chain** (houses) | **Removed** after one round (2026-09-23 to 09-24): the houses as boxes of different sizes in a snake, joined by **bars**, after the owner's own drawing. The owner then asked for the page "completly differnet" and "a gallery like view", and it was the **hang** for half a day and is the **axis** now. (Not the removed **chain** of specks round a picture, below.) |
| **bar** | **Removed** with the chain: what joined one house to the next — one solid stroke, or two hairlines with the paper between. |
| **motifs** | What comes up over the Houses view while a house is **rested on**: that house's own things, taken from its page — Pineward's trees and needles, ADAR's void and dust, Almost Human's figures and rain, Ataraxia's bands, Grande's drift, Les Abstraits' smoke and embers, Tale's doodles, Tombstone's **epitaphs** (its five names cut into the wall letter by letter and worn away) with **roots** creeping in and red flowers opening, and Qimu & Musicians' **staves** — five lines drawn across the page with notes coming and going on them. They gather one at a time and **fade** when the house is left, never vanishing, and they stand **behind the houses**, over the whole page. Tombstone writes each of its five names **once**, kept off the houses; Qimu's are quiet and hardly move. `motifs.js`, named per frame by `data-motif`. Tombstone's were stones in mist for one round, and Qimu's notes, records and a line of sound. |
| **resting** (on a house) | The pointer staying on one house for a moment (`HOVER_WAIT_MS`, **200ms** — it was 420 and the owner found it "too long"). Only then do the motifs come (`musing`), behind the houses and over the whole page; **nothing is blurred or dimmed** — the rest of the page went out of focus until the owner asked for it not to. Sweeping across the houses sets nothing off. |
| **the way in** (a house) | What every house but Tale does when it opens: its contents come up over nearly a second over a ground that is there from the first frame, the head rising a little — the owner's "It just kinda blinks on the screen" fixed. On the Houses view a press first **steps the page back** (`sheet-leaving`) and only then opens the house. At the foot of `style.css`. |
| **fragrances** (the view) | The index view of the contact sheet page. It **used to list every fragrance on the whole site** and point back into the houses; it does not any more. It is now the way in to `individual-fragrances/individual-fragrances.html` — the perfumes that belong to no house — and carries only those. If the owner remembers it as "every one of them", that is what it was until 2026-09-21. |
| **the glitch on the way out** | What the notes window used to do when you clicked away, and why it is worth knowing: the window is built on the `<body>` (it has to be — a fixed thing inside a transformed box is fixed to that box), which put it in reach of `body > *:not(...)`, the rule that dims the page while the Menu is open. Four `:not()` outrank `.note-panel`, so the window got the menu's `opacity 0.85s` instead of its own `opacity 300ms, transform 300ms` — and the script hid it on a 260ms timer, cutting the window AND the scrim from 0.606 opacity to nothing in one frame. Both selectors now exclude it, and the close waits for `transitionend` rather than a number. **Anything else added as a child of `body` is in the same trap** — and the primer's footnote pop-up (`.primer-tip`) fell into it on 2026-09-23 and is excluded the same way. There is a test for each. |
| **view notes** | The button at the foot of every fragrance's writing, and the **window** it opens over the page carrying the notes and the source. A real dialog: centred, over a scrim, with the page behind held still, closing on the scrim, on escape and on its own close. **It goes with the fragrance**: collapse the part and the window goes too, and opening the part again leaves it shut. It opened BESIDE the writing for a round, as a column in the part's own row — if the owner remembers it that way, that is what it was until they asked for a window. `notes.js`; `note-*` in `style.css`. It is the one thing on a house page that needs JavaScript. |
| **the source hierarchy** | The order a fragrance's notes are taken in, which the owner gave in as many words: **always the house's own page for that perfume, and Fragrantica only if that fails**. 56 of the 108 sources in the file are the house's own, against 52 on the fallback — the houses overtook it on 2026-09-22 and Les Abstraits is the first house where the fallback does not appear at all. Named per entry in `notes-data.js`, with the link the owner can check. |
| **the olfactory landscape** | What Almost Human publishes INSTEAD of notes: five impressions rather than a list of materials. Its five fragrances carry a second button and window of their own, standing **before** View notes, with the house's own landscape in it; the notes beside it are the fallback's. It is never called a list of notes, because it is not one. |
| **the version** (notes) | Which edition a fragrance's notes belong to, printed as a boxed line at the top of its window. Several Pineward fragrances have been reformulated and the note list changes underneath the name, so a list with no year on it is a list you cannot check. Five entries carry one, and four of the five carry the NEWEST version — De Profundis is the 2011 original because the owner asked for that one. |
| **said nothing** | An entry that was looked up and came back with nothing, which is not the same as no entry at all. `{ missing: "…" }` — ADAR's Root Code and Lithos Diaphanes say *No information as of yet.* and still name the house's page; Grande's "Cookie something (?)" says it could not be found online and names nothing. A fragrance with NO key says instead that the notes "have not been found yet", which means nobody has looked. |
| **the two halves** | A window carrying two lists, the house’s own above and Fragrantica’s below, each with its own heading and source. **Haxan** was the first and **all five of Ataraxia** followed, at the owner’s word ("split the exact same way as they were with haxan"). Haxan’s lower list is the only one on the site read off a screenshot the owner sent rather than through a search summary. |
| **not disclosed yet** | What Ataraxia’s My Doll’s Makeup says in the upper half of its window: the house has published no notes for it, and saying so is different from quietly standing on the fallback alone — which is what the owner asked for. It is the only entry whose FIRST half is a `missing` and whose second is a list. |
| **the fragrance reader** | What a fragrance in the **Fragrances** view opens into now: not another page but this one, gone blank, with that fragrance’s picture, writing and a **View notes** button — the same button and window as on every house page (since 2026-09-23; the notes used to be printed out under the writing) — and an arrow back. The writing is FETCHED from `individual-fragrances/individual-fragrances.html` rather than copied, so there is still one copy of the owner’s words. `fragrance-reader.js`, with the window from `notes.js` (`NOTE_PANEL.button`). |
| **the flier** | A picture on its way home, on the way back out of the reader: lifted out of the article onto the window at exactly the box it occupied, squared up, and sent receding into one square of **the grid**, picked at random and never the same one twice — **in a straight line**, its place, size and squaring all on one clock, by transform alone. It used to turn, which the owner asked to have taken out. It comes to rest at exactly one cell's size, on the cell's own corner. They all fade together once they are home. While any of this is running, **scrolling is held** and does nothing. |
| **home** (the reader) | The part of **the grid** a picture may land in — centre-ish and on the right, which is where the owner asked for it. `HOME` in `fragrance-reader.js`, given as fractions of the window so it means the same on every screen. The whole window was fair game for one round and the same movement read differently every time. **The four numbers are provisional**: the owner said they would send a picture of the grid they want. |
| **the grid** (the sheet) | The squared ground the contact sheet page is ruled into: 46px squares, `--grid-cell` on `:root`, painted by a pair of gradients in `.sheet-page`. **The fragrance reader is ruled into the same ones by the same declaration**, because a picture on its way back recedes into ONE OF THESE SQUARES and would otherwise land on nothing. The reader drew a grid of its own for one round, at about 90px, and it read as a second grid over the first. Its cells are arithmetic rather than elements — a cell is n × `--grid-cell`, not a span in the page. |
| **the caution** (notes) | The small box that comes up on hovering **Fragrantica** in a notes window: *Fragrantica's notes are not to be trusted as 100% fact.* — the owner's own sentence. A `CAUTION` table in `notes.js` keyed by source name, so it is **only** on the fallback; put it on a house's own page and it stops meaning anything, and there is a test saying so. It stands above the source line because the source is the last thing in a window that scrolls. |
| **the pyramid** | Top / Mid / Base, and it is only written down **when the source actually divides them**. Never assembled from a review's prose — that has already nearly gone wrong once and the near miss is in the notes' report. |
| **a flat list** | What most houses actually publish: one undivided list of notes. Pineward divides none of its forty-seven, and Almost Human says out loud that it works in "olfactory landscapes" rather than pyramids. An entry is a pyramid or a flat list, never both, and the panel says which. |
| **individual fragrances** | `individual-fragrances/individual-fragrances.html`: the perfumes that belong to no house on the Houses view, each carrying the house it DID come from. Shaped like a house so it gets the parts, the rank and the notes panel. The **Fragrances** view is the index into it. |
| **the chain** (specks) / **the tuft** | **Removed.** The specks round a picture on the old contact sheet, kept only within reach of a point where a line tied on. (Not **the chain** of houses, also removed, above.) |
| **the run** | **Removed.** The line between two pictures drawn as specks rather than as a stroke. Replaced by the trace, which is dashed — a solid stroke is the one thing the line must not be, and there is a test saying so. |
| **the ring** / **the orbit** | A circle of pictures standing in three dimensions round a big square, which is how Favorites was laid out before it became a menu of chapters. Nothing of it is in the code now — no `RING_*`, no `.gallery-face`, no `<button class="gallery-frame">`. If the owner uses the word, they mean that removed treatment. |
| **favourite** | One entry in Favorites (`<a class="gallery-entry">`), carrying a `data-chapter`, a `data-house`, optionally a `data-notes` key into `notes-data.js`, and an `href` pointing at wherever that fragrance lives on the site. It carried a `data-date` until 2026-09-22; if the owner uses the word, that is what it was. |
| **the credit** | The line at the foot of a house saying where its pictures came from — `<p class="house-credit">`: a **Pictures** label and, beside it in a column of its own (`.house-credit-text`), where they came from, with the same space above and below between two rules. The owner asked for pictures to be credited wherever they are used. Six houses carry one; the source is the one the pictures were actually taken from, which for Grande Parfums is **not** the house's own site. |
| **work** | An individual piece, one page in `works/` — the essays, the researches and the templates. A **house** is not one of these any more: since 2026-09-22 the houses live in `houses/` (nine since 2026-09-23) and the individual fragrances in `individual-fragrances/`. |
| **category** / **body of work** | A page in `categories/` listing works; also an entry in `SITE_LINKS`. |

## Where things stand

The site is finished and live in the sense that every page works and is deployed; what
is unfinished is the *look* of the three drawn category pages, and that is what the
owner has been iterating on. The landing page and the row list have not been touched in
several rounds and can be treated as settled; the three drawn pages are live subjects.
What follows is how the owner works and what is still open. **What has moved on any one
feature is in that feature's report** — start at
[`docs/progress-log.md`](docs/progress-log.md).

**How the owner works, and what they expect.** They describe an effect in their own
words rather than in code, often with a photo, and then refine it over several rounds
— the first version of anything is a starting point, not a spec. Three habits follow
from that and are worth matching:

- **When they ask for something gone, it comes out of the code, not switched off.**
  `structure.js` has no `SCAN_*` and `chamber.js` no `FRAG_*`, `MARK_*`, `EDGE` or
  leader, because each was asked for and then removed outright. The **whole register**
  went the same way — `favorites.js`, its markup, its styles and its tests — when the
  owner asked for the contact sheet's Favorites view and its two buttons gone. The
  exceptions are the few things deliberately *dialled to zero with the machinery intact*
  and documented as such (`SWAY = 0`, `CLOUD_COUNT = 0`) — those are the owner's to bring
  back by raising a number. When something is removed, the glossary keeps an entry for
  the word saying it is gone, because the owner still uses the word for the thing they
  remember, and the feature's report keeps the paragraph saying why it went.
- **They report bugs precisely and notice small things.** "There are two different
  objects making up the arms", "it blinks the whole page before it starts", "the
  percentage ticks up while I'm not touching it" — all real, all fixed, all now written
  down in the relevant report as things not to reintroduce. Take a vague-sounding
  complaint seriously; it has been specific every time.
- **A note asks for gentler or more specific, not for something else.** The first full
  pass of notes on the newest pages rejected nothing: every item asked for an effect to
  be softened, slowed, or made to say something more exact. Read a note that way before
  reaching for a rewrite.

**The writing is the owner's.** The site began as drawings with placeholder text in them;
the writing for two houses and the first research has since arrived. Their words are
theirs — spelling, punctuation and all, including the notes to themselves. Never tidy
them. **The one exception is when they ask**: they asked for Pineward's capitalisation
and basic spelling to be fixed, and that was done once, on the rule that a correction
turns a word into *the same word* and never into a better one. `idk`, `ngl`, `lmao`,
`v wet` and the run-on sentences are voice, not spelling, and were left.

**What is still open** is recorded in the report of the feature it belongs to. Two are
worth knowing before touching anything shared:

- **The accent is still spent on the site's shared chrome** — the Menu trigger, the menu
  overlay's links and the global focus ring, on every page including the chamber. Why it
  was left is in [the page shell's
  report](docs/features/2026-09-11-the-page-shell-and-menu.md).
- **There are nine houses now** (Pineward, ADAR, Almost Human, Ataraxia, Grande Parfums,
  Les Abstraits, Tale Parfums, Tombstone, Qimu & Musicians) — the owner said to stop at
  nine for now — and they are in different states of finished: Ataraxia
  has its drawing, its names, its notes and — since 2026-09-24 — its writing, but for My
  Doll's Makeup; Grande Parfums has its
  writing and a drawing that **deliberately says nothing about the house**, because the
  owner has still not said what it is; Les Abstraits has its names, its notes and — since
  2026-09-23 — its writing, and no drawing of its own; Tale Parfums has its writing, its
  pictures and its hand-drawn page and **no notes yet**, because its own site could not be
  read to take them from; Tombstone is written but for the rest of 3 Feet 5, and has no
  ground of its own; and Qimu & Musicians has Guitarist and Vocal written, Drummer saying
  "Description coming soon.", Bassist and the introduction waiting, and notes for only one. **Named is not written**, and since 2026-09-22 the site has
  houses in that state — the test that used to conflate them now keeps them apart. What
  each is waiting for is in [their
  report](docs/features/2026-09-21-the-newer-houses.md).
- **All nine houses now carry a real picture on the Houses view**, and eight of the nine
  have a photograph with every fragrance — see [the images
  report](docs/features/2026-09-17-images-folder-per-house.md). Pineward's
  fragrance pictures and its gallery arrived on 2026-09-18; Almost Human's own two — its
  **mark** and the photograph `This one` — on 2026-09-21; and Ataraxia's, Grande Parfums'
  and Les Abstraits' on 2026-09-22, along with Haxan's in the individual fragrances;
  Tale's twelve and Haxan's other two on 2026-09-23, and Tombstone's ten and Qimu &
  Musicians' four later the same day. The
  mark is not printed on any page at all, and is only ever drawn by the crowd's glitch.
  **What is still waiting** is Almost Human's five fragrance pictures and five of the six
  individual fragrances: each names the file it wants and shows it the moment it is there.

**The placeholders in the new pages are marked as placeholders.** ADAR's introduction,
the standfirsts and most of the site's plates are waiting for the owner, and every
unwritten paragraph says so in a dashed box rather than standing in as prose. **Almost
Human is written**, all five fragrances and its introduction with them, as are the three
theory pages — all in the owner's own words. The dates in the Fragrances table are
rolled from a seed so the sorting has something to work on; they say nothing. The one thing that was not guessed at
is a fragrance's own writing, which is theirs throughout.

**What has never been asked for and should not be invented:** the placeholder content.
`Your Name` and the lorem ipsum on slide 2 are still placeholders on purpose — they are
the author's to write. (The contact page's placeholder address and links were taken off
by the owner and replaced with one sentence.) (The site's
*name* they have now written: see the landing page's report.)

## Maintaining this file

Keep this file current: when the page list, the content workflow, or the glossary
changes, update the matching section in the same commit. Feature detail does not belong
here at all — see "Feature reports" above for where it goes.

`README.md` is a running changelog written for the site's author and has drifted in
several places (`__p23`'s owner, the palette, `DECORATIVE_POINTS`, and a section on
`menu-modes.js` and per-slide menus, which no longer exist). Prefer the code whenever
they disagree, and correct this file rather than trusting either.
