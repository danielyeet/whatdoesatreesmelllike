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

Start here. Each page is standalone, loads `nav.js` for the shared menu and cursor, and
then loads whatever draws *that* page — nothing else. No page script knows about any
other, and none of them share state (the one exception is the landing page's six layers,
which talk through five `window` globals; see the landing page's report).

| page | what it is | scripts it loads beyond `nav.js` | report |
|---|---|---|---|
| `index.html` | three scroll-snapped **slides**: the title, the italic line, the 3D **node map** | `landing.js`, `node-scene.js`, `paper.js`, `thread.js`, `extras.js` (and Three.js from a CDN — the only page that uses it) | [node map](docs/features/2026-09-11-the-node-map.md), [slides](docs/features/2026-09-11-the-landing-slides-and-exit.md), [paper](docs/features/2026-09-11-the-paper.md), [thread](docs/features/2026-09-11-the-thread.md), [chromatogram](docs/features/2026-09-11-the-chromatogram.md) |
| `categories/scent-descriptions.html` | two **views** of one category: the **houses** — a **contact sheet** of pictures scattered and joined by dated lines, all of it drawn in specks — and the **fragrances**, an **index** of every fragrance written up on the site | `search.js`, `contact-sheet.js`, `index-page.js`, `views.js` | [contact sheet](docs/features/2026-09-13-the-contact-sheet.md), [index and views](docs/features/2026-09-17-the-index-pages-and-views.md) |
| `categories/theories.html` | the **structure**: a technical drawing in three dimensions you scroll *into* | `search.js`, `page-search.js`, `structure.js` | [structure](docs/features/2026-09-14-the-structure.md) |
| `categories/favorites.html` | the **chamber**: two injectors firing particle streams into a tilted **orbit** round the word FAVOURITES, which opens into a menu of **chapters** — and opening one **bursts** into that chapter's own page, black and silver | `search.js`, `page-search.js`, `chamber.js` | [chamber](docs/features/2026-09-15-the-chamber.md) |
| `categories/researches.html` | **Explorations &amp; Researches**: an **index** — readings across the top, plates on the right, and a sortable, searchable table in the bottom left, each row saying whether it is a research or an exploration | `search.js`, `index-page.js` | [index and views](docs/features/2026-09-17-the-index-pages-and-views.md) |
| `categories/other-2.html` | **Photography**: the frames in sets, a grid a wide one breaks, numbered down the margin | `search.js`, `page-search.js`, `photography.js` | [photography](docs/features/2026-09-18-the-photography-page.md) |
| `works/pineward.html` | **Pineward**, the first house in Scent descriptions: an introduction and 52 compacted parts — one per fragrance, each with its own photograph — in four forest **strata**, with a **wood** grown down both margins, a ticked **trunk**, a faint pine-green ground, and the **gallery** at the foot of it | `search.js`, `pineward.js`, `pineward-gallery.js` | [Pineward](docs/features/2026-09-16-pineward.md), [gallery](docs/features/2026-09-18-the-pineward-gallery.md) |
| `works/adar.html` | **ADAR**, the second house: eleven fragrances in four groups, standing on a **void** — a hole in the window that shows the house's mark under the pointer — with a ruled **log** and falling **dust** down the left and a **sounding** down the side | `search.js`, `adar.js` | [ADAR](docs/features/2026-09-17-adar.md) |
| `works/almost-human.html` | **Almost Human**, the third house: five fragrances standing in a **crowd** — people down both margins drawn entirely in specks, each of them nearly a person and never quite one, resolving under the pointer — with a ticked **rank** down the side | `search.js`, `almost-human.js` | [Almost Human](docs/features/2026-09-20-almost-human.md) |
| `works/theory-01.html`, `-02`, `works/resins-in-perfumery.html` | the **essay pages**: a long piece of writing on the theories drawing's ground, with a **rule** down the left — one tick per section, filled in as far as you have read | `essay.js` | [essay pages](docs/features/2026-09-17-the-essay-pages.md) |
| `works/theory-03.html` | the same, and the longest piece on the site: **The Note Dissemination Framework**, which argues in **diagrams** and carries a **calculator** standing in the same page | `essay.js`, `calculator.js` | [the framework](docs/features/2026-09-20-the-note-dissemination-framework.md) |
| `works/*.html` | the other individual pieces — two templates and two sandbox pages | none | — |
| `search.html` | the **search page**: one field over the whole site on a dark ground of drifting specks, the answers as ruled rows carrying the trail that says where each lives, and a row of **filters** narrowing them by kind | `search.js`, `search-page.js`, `find-ground.js` | [search](docs/features/2026-09-17-the-search.md) |
| `contact.html` | a plain page | none | — |

Four of those page scripts are elaborate: `chamber.js` (~1,740 lines), `node-scene.js`
(~1,470), `structure.js` (~1,360) and `contact-sheet.js` (~1,360). The rest are smaller:
`adar.js` (~820), `calculator.js` (~600), `pineward.js` (~690), `paper.js` (~570),
`almost-human.js` (~990), `essay.js` (~400),
`index-page.js` (~290), `thread.js` (~290), `search.js` (~270), `pineward-gallery.js`
(~260), `extras.js` (~250), `landing.js` (~230), `nav.js` (~200), `find-ground.js`
(~200), `photography.js` (~180), `search-page.js` (~130), `page-search.js` (~110) and
`views.js` (~85).

**Read the matching report in `docs/features/` before editing one of them.**

**Three pages are drawn on a dark ground**: `categories/theories.html`,
`works/adar.html` and `search.html`. A page on a dark ground must also carry
`dark-surface`, or the cursor cannot see it.

**A page's colour is four tokens, set on its own body class.** `--bg`, `--bg-2`,
`--line`, `--ink` and `--muted` are redefined under `.find-page` and `.sheet-page`
rather than a second set of rules being written for everything on those pages: every
rule they use already draws in those tokens, so setting them turns the page over at once
and touches nothing else. This is worth knowing because it has already been used in both
directions — the contact sheet went dark for one round and came back to white the next,
and each time that was a handful of lines rather than a rewrite.

Three of the pages replace their own markup with a drawing, and all three hold that
markup back on the way in with the **`js-coming`** class so the plain version is never
flashed first — see the glossary entry. All three also leave that plain version working
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

**A clean run is 199 passed, 0 failed, and takes seven to ten minutes.** If you get a
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
report](docs/features/2026-09-21-the-site-on-a-phone.md).

Several tests are regressions for specific bugs the owner reported and that were fixed.
Each one is named and explained in its own feature's report, under "How to test it", next
to the reasoning it protects. **Keep them passing rather than adjusting them to match new
behaviour**, unless the behaviour change is deliberate.

Visual/aesthetic judgement is still manual — the suite checks that things work, not that
they look right.

### A phone

The site is meant to work on one, and the standing rule is that **nothing above 700px may
change** — the owner asked for the phone "without changing its desktop version". Three
things follow, and they are the ones to keep in mind when adding a drawing:

- **Every canvas draws at a lower ratio below 700px** (1.5 rather than 2), which is a
  little over half the fill. A new drawing should do the same.
- **A rule written against `COLUMN` needs a floor.** The writing's measure is 940px, so on
  a phone "the room either side of the column" is none — and a drawing that takes the
  column out of itself takes the whole page out. Almost Human's `lit()` did exactly that
  and the page had no ground at all.
- **There is no hovering.** A drag sends `pointermove` and a tap sends `pointerdown`; a
  drawing that answers the hand should listen for both.

`tests/mobile.spec.js` is the guard: no page scrolls sideways at 390px, the crowd is
drawn, and a tap brings a figure home.

Two states are easy to forget when reviewing a change:

- **`prefers-reduced-motion: reduce`** — read by `landing.js`, `paper.js`, `thread.js`,
  `node-scene.js`, `contact-sheet.js`, `structure.js`, `chamber.js`, `pineward.js`,
  `adar.js`, `almost-human.js`, `essay.js`, `calculator.js`, `index-page.js` and
  `style.css`, each degrading to a still
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
| The contact sheet | `contact-sheet.js` | [report](docs/features/2026-09-13-the-contact-sheet.md) |
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
  block; the **contact sheet** (`scent-descriptions`, Houses view) takes another
  `<a class="sheet-frame">` block — with `data-open="no"` on it until there is a page
  behind it, which is what makes the dates on the lines reaching it print as
  `xxxxxxxxxxxxx` rather than as a date that says nothing; the **structure** (`theories`) takes another
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
  stands in its house's own page — `../works/pineward.html#part-06` — so the index and
  the houses are two ways into the same writing rather than two copies of it.
  **Renumbering a house means re-pointing that table in the same turn**: the anchor is
  the part's number, not its name, so a part removed from the middle of a house silently
  sends every link after it to the wrong fragrance. That happened; there is a test for it
  now in `repository.spec.js`.
- A favourite on the **chamber** page (`favorites`) is an `<a class="gallery-entry">`
  block with a `data-chapter` and a `data-date` — the chapters are the different
  `data-chapter` values in the order they first appear, and the chapters standing in the
  chamber's column are made from them. **What a chapter is** is written in its own
  `<section class="gallery-chapter" data-chapter="...">` further down that page, and is
  what its page shows above the cards; a chapter with nothing written for it shows its
  cards and no description.
- **A part of Pineward** (`works/pineward.html`) is a `<details class="pine-part">` block:
  a number, a small picture and a title in its `<summary>`, and the full picture and the
  writing inside. Copy a whole block to add one, and renumber the ones after it — the
  numbers are in the markup rather than counted, so they are the owner's. **A fragrance
  of ADAR** (`works/adar.html`) is the same block by another name
  (`<details class="adar-part">`), with its stages — top, mid, base, a sidenote — written
  as `<p class="adar-stage">` labels inside it, and **a fragrance of Almost Human**
  (`works/almost-human.html`) is the same block again (`<details class="human-part">`,
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
  `works/pineward.html`, pointing at two web copies in `images/Pineward/gallery-web/`
  (a 1600px long edge and a 520px square thumbnail) made from the original in
  `images/Pineward/The Pinewards Gallery Page/`. The order they stand in is the order
  they are shown and numbered in.
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
- Placeholder content is still in place in several spots (`Your Name`,
  `you@example.com`, the lorem ipsum on slide 2, the `contact.html` social links). Don't
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
| **js-coming** | The class a page puts on `<html>` in its own `<head>` while the script that replaces its contents is on its way, so the plain fallback is never flashed first. Carried by `theories.html`, `scent-descriptions.html` and `favorites.html`; each script clears it once it has laid itself out, and `window.load` clears it if the script never arrives. |
| **the breath** | The structure's own slow creep: the eye drifts a little way in and back out again on a fixed cycle (`CREEP`, `CREEP_EVERY`), so the page is never quite still but the scroll is always the whole of where you are. |
| **carriage** | The gantry that runs down the frame towards you on its own clock, lighting each rib as it passes. |
| **traverse** | One of the streaks that run across the frame — the mechanical version of a falling star. |
| **chapter** | One grouping in Favorites — whatever an entry's `data-chapter` says. The chapters, their names and their order all come from the page. |
| **the register** | The way the contact sheet page's *Favorites view* was laid out: a page ruled edge to edge with horizontal tracks, a square travelling along each, lines between them, and a glitch. **Removed** with that whole view and its two buttons — there is no `favorites.js` in the site any more. If the owner uses the word, they mean that. |
| **track** / **gauge** / **car** / **square** / **the tear** / **the sig** / **index** / **log** | All of the register's own parts, removed with it. |
| **the field** / **the hatch** | The ruled ground of fine strokes the Favorites view carried before it became the register — its reading was which **way** it lay. Removed, like everything else that view had. |
| **Pineward** | The first house in Scent descriptions: `works/pineward.html`, "the house that smells like trees". An introduction and fifty-two parts, one per fragrance, in alphabetical order. It was fifty-four until the owner removed Fanghorn I and Gelatto. |
| **part** (Pineward) | One of Pineward's fifty-two: a `<details>` showing its number, a small picture and its title until it is opened, and its full picture and writing inside. The pictures are the owner's own, one per fragrance, matched to the parts **by name**. |
| **ADAR** | The second house in Scent descriptions: `works/adar.html`, "the house that you have never heard of". Eleven fragrances in four groups, on a **void**. |
| **Almost Human** | The third house in Scent descriptions: `works/almost-human.html`, "Abstraction done quite well" (it was "the house that nearly gets there" until the owner wrote their own). Five fragrances — Burning Bridges, Dear Future, Desert Hope, Ritual Code, Silent Rain — standing in a **crowd**. **All five are written**, and so are the introduction and the standfirst. |
| **the mark** (Almost Human) | The house's own logo. It stands at the **head of that page** (`figure.human-mark`), and it is read off the same file as places a speck may stand: on about a third of the beats a figure whose HEAD is the faulty part loses its face and stands as the mark instead. One file for both — `images/Almost-Human/house-web/ah-logo.webp`, an 800px copy of the owner's `AH_Logo_Black.jpg`, **black on transparent** rather than on the original's white, because this page's paper is `#fafaf9` and a white square shows against it. `LOGO_*` in `almost-human.js`. (Not the contact sheet's **mark**, which is a drawn plate.) |
| **the crowd** | That page's ground: people standing down both margins the whole length of it, every one of them drawn entirely in specks, built out of capsules rather than traced from an outline. |
| **the stray** | What makes the crowd *almost* human, and the house's name said as a behaviour: every speck knows exactly where it belongs and stands up to a FIFTH of the figure's height away from it, fixed for the life of that figure. At rest a figure is a cloud that gives no hint of a person; the person is entirely the pointer's doing. Bring the pointer near — **anywhere on the figure** — and the specks come home: the figure resolves under your hand and comes apart again when you leave. It never resolves completely (`STRAY_NEAR`); one that came exactly home would be the wrong drawing. |
| **the fault** | What is wrong with each figure on Almost Human, and it shows **only after the figure has been held formed for a moment**: a head that comes apart in slices, a torso that slips and loses specks, one arm on its own, or every part of it each on a clock of its own. Four of them, running in order down the page. It is a **beat rather than a drone** — one second in every six, easing in and out at each end — and every part of it is about half the size it first was. `FAULTS`, `GLITCH_*` in `almost-human.js`. |
| **the rain** (Almost Human) | The one thing on that page that is not a person, and it is weather: rain falling the length of the page, each drop a short string of specks. It lives on the window rather than down the document. |
| **the sun** / **the chair** / **the rays** (Almost Human) | **All removed.** A sun drawn as a ring with uneven rays and an empty chair stood in those margins for one round; the owner asked for both gone and for **rays** — "particle rays that blast from here and there" — in their place, and then, having seen them, asked for the rays gone as well. Nothing of any of the three is in `almost-human.js`: no `SUN_*`, no `CHAIR`, no `props`, no `RAY_*`, no `armRay`, `buildRays` or `drawRays`. The rain is what is left. |
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
| **the gallery** (Pineward) | The owner's own photographs at the foot of `works/pineward.html`: a strip of small squares that cycles on its own and stops while it is being looked at, and a **viewer** that stands one of them over the darkened page with its number in its own top right corner. `pineward-gallery.js`. The number is **where it stands in the strip**, not what its file is called. |
| **the viewer** | The darkened page with one picture standing in the middle of it and an arrow either side — Pineward's gallery has one and the Photography page has one, and they are separate scripts that behave the same way. |
| **Photography** | What the second **Other** page is now (`categories/other-2.html`): the frames in **sets**, in a grid that a **wide** one breaks, numbered down the margin, each with what a photographer writes on the back of a print. `photography.js`. If the owner says "Other", they mean this page before it was that. |
| **set** (Photography) | One grouping of frames on that page, with its own number, title and line. The unit the page is read in — which is why a frame's arrival is staggered within its set rather than down the whole page. |
| **Explorations & Researches** | What the **Researches** category is called now (`categories/researches.html`, which keeps its filename). It was **Works** for a round, which the owner then made specific. Same index layout, with a third column saying whether each piece is a **research** or an **exploration**. |
| **exploration** | One of the two kinds of thing on the Works page: going out after a smell and writing down what is there, as against a **research**, which is a material at a time. A row says which on itself, in `data-kind`. |
| **the ground** (Pineward) | That page's paper, turned very faintly towards `--pine-green`: a 2% wash, two soft pools of it high on each side where the wood stands, and the green gathering towards the foot — which is the Roots stratum. It must stay faint; this page's accent is worth something because it is spent in so few places. |
| **the bark** / **the two colours** | Pineward's wood is drawn in `--pine-bark` (`#4a3422`) and `--pine-green` (`#1a4a2c`) rather than in ink: the trunk is bark the whole way up, a branch runs bark at the trunk to green at its tip, and a needle is mostly green wherever it stands. One `tone()` in `pineward.js` mixes them; `BARK` and `GREEN` there keep the same pair as the stylesheet. |
| **the say** (the sheet) | The line about a house on the contact sheet — "the house that smells like trees" — shown only while its picture is pointed at. Taken out of the flow, so the room every line on the map is routed around is the **name's** alone. |
| **index** | The way `categories/researches.html` is laid out: readings across the top, plates on the right, and a sortable, searchable table in the bottom left corner. `index-page.js`. The contact sheet's **Fragrances** view is built from the same markup and script but laid out again for itself — one centred column, the table given the room — under `body.view-fragrances`. The copyright line that used to sit under the board is gone from both. |
| **the board** | That table and the search above it, taken together (`.index-board`). It scrolls inside its own box so the page around it does not grow. |
| **the search page** | `search.html`: the one place that looks over the whole site. One field ruled across a dark ground of drifting specks, a row of filters under it, and the answers as rows carrying a number, a name, what kind of thing it is and the **trail**. |
| **the plan** (search) | **Removed.** The squared ground behind the search page, first in CSS and then drawn. The owner asked for the grid gone and for the specks to carry the page on their own. Nothing of it is in `find-ground.js` now. |
| **the specks** (search) | The field of flecks hung across the whole search page, drifting about their own places, webbed to their near neighbours, gathering towards the field and brightening while something is being typed. They are the whole of that page's ground. |
| **the filters** (search) | The row of words under the search field — All, Houses, Fragrances, Researches, Favourites, Pieces, Sections — narrowing the answers to one kind, each carrying the number it would give. The kinds are the ones `search.js` already puts on an entry, so there is no second list of the site's categories anywhere. |
| **the trail** | Where a thing lives, said as a path: *Scent descriptions · Houses · Pineward*. Every answer a search gives carries one. |
| **a page's own search** | The small mark in the top right of a page that opens into a field and looks over THAT PAGE only. What it cannot answer it hands to the search page. |
| **the trace** | What joins two pictures on the contact sheet now: one straight hairline broken into even dashes, minimal and measured. It replaced the run, the rails, the rungs, the knots and the tufts, all in one round, when the owner asked for the connections to be reworked "minimal, futuristic, and interesting". |
| **the pulse** | The short lit run of dashes travelling along a trace, each on its own clock. The whole of the movement on that page, and what makes the map read as live rather than printed. |
| **the pull** | What the pulses do while a picture is pointed at: **every** one of them on the map turns round to run towards that picture — into it on the traces tied to it, towards its end of the line on all the rest — and they run faster, longer and brighter while they do. `PULL_*` in `contact-sheet.js`. |
| **the tie** | The small open square where a trace meets a picture, with a stub of line into the edge — a registration mark. It does the job the knot and the tuft used to. |
| **the knot** | **Removed.** The crowd of specks where a line met a picture — the rails of a run drawing together to a point. Replaced by the tie. |
| **rail** / **rung** | **Removed.** The two or three parallel lines of specks a run between two pictures was made of, and the ties across them. Replaced by the trace. |
| **hot** (the sheet) | The picture the pointer is on: its specks come loose and drift, drawn softer and heavier, while the rest of the sheet steps back. The picture itself never moves. |
| **the spotlight** | What the ADAR void does under the pointer: the house's own mark is drawn inside the hole and nowhere else, coming up as the hand nears it. |
| **the log** / **the dust** | The hairline depth scale ruled down the left of the ADAR page, and the slow fall of specks through it. What fills that margin. |
| **the mark** | The one plate on an index page that is drawn rather than photographed: a slow ring of specks with lines between the near ones — the chamber's orbit printed small, on white. |
| **research** | One piece in Researches — a material at a time, where it comes from and what it smells like. The first is `works/resins-in-perfumery.html`. |
| **stratum** | One of the four groups of thirteen parts — Canopy, Understorey, Trunk, Roots — a section through a forest read from the light down into the ground. |
| **the wood** / **the canopy** | The drawing behind Pineward: conifers standing down both margins the whole length of the page, specks strung along their branches, grown from nothing when the page opens and holding their shape afterwards. Kept out of the middle of the page, where the writing stands. It was one canopy behind the title before the owner asked for it extended through the whole piece; they may still call it the canopy. |
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
| **a chapter's page** | What the burst opens into: the chapter named, the reading over it, what that chapter is (written in `categories/favorites.html`, one block per chapter), and its favourites as **cards**. Black, with **silver** — no accent anywhere on it, which keeps the chamber's promise of spending none. |
| **the read** | What pointing at a row of the chamber's menu does: the stretch of orbit level with it swells outward, and the rule under the row draws back from the right. It replaced a **cinch**, where the sides left the orbit and leant in towards the row. |
| **the level** (chamber) | **Removed.** A chapter used to open a second level of rows inside the same menu, listing its favourites. It opens a page of its own now: there is no `.chamber-item` and no back button in the menu head any more. |
| **leader** (chamber) | The line that used to be run from each end of a pointed-at row out to the side of the window, with a tick where it landed — the "selection lines" the owner asked to have taken off the menu. Gone from `chamber.js` entirely; the orbit's swell is the whole of the read now. (Not to be confused with the short leader still drawn at each **injector**, along the way its own stream leaves.) |
| **the disc** | What the chamber's orbit is made of: a band with a width and a thickness rather than a single line of specks. Each particle stands at its own radius within `DISC` of the orbit either way, and a little off its plane (`DISC_LIFT`). |
| **the web** | What the chamber's **cursor** does (not the burst's lattice, which is **the mesh**): the specks near it are joined up with fine lines, each coming and going on its own clock and drawn a hair off the two it joins, so the net is always a slightly different net. `WEB_*` in `chamber.js`. |
| **ranged** | What the chamber briefly did to a particle it was answering with: a fine hollow square drawn round it. Removed with the rest of the reaction-by-emphasis — there is no `MARK_*` in the file. If the owner uses the word, they mean that removed treatment; what is there now is **the web**. |
| **contact sheet** | The strip of every frame on a roll of film, printed together so you can pick one — and the way `categories/scent-descriptions.html` is laid out: `contact-sheet.js`. |
| **frame** | One picture on the contact sheet (`<a class="sheet-frame">`), square, and a link to the piece it belongs to. It stands at a **depth** of its own, and one carrying `data-open="no"` has no page written behind it yet. |
| **the depth** (the sheet) | The contact sheet stands in three dimensions: every picture but the middle window is given a depth and then projected, so what is further back is drawn smaller, fainter and nearer the vanishing point, and what is in front is drawn over it. It is done in the SCRIPT rather than with a CSS `perspective`, because the lines between the pictures are drawn from the same numbers — a transform in the stylesheet would move the pictures and leave every line behind. `DEPTH_MAX`, `FOCAL`, `--depth`. |
| **plate** | On the contact sheet: the frame it settles on and keeps at the top — the first one in the page. |
| **the flick** | The pictures going past in the middle window, hard cuts, fast then slowing to a stop. It ends on the picture it keeps rather than cutting to it. Nine cuts over about a second and a half, **in no order** (a random pick, never twice running), and **nothing on the sheet can be pressed while it runs**. The beat before it starts (`FLIP_HOLD_MS`) is not part of that. `FLIP_*` in `contact-sheet.js`. |
| **link** / **route** | A line between two pictures on the sheet, at whatever angle they lie at, carrying a date. Every picture has at least one. |
| **the swipe** | How the contact sheet's two views change over **once both have been opened**: the page travels sideways, what you are leaving going off one edge as what you are going to comes in from the other. The first time a view is opened there is no swipe — it is the plain swap, because a swipe says "these two stand side by side", which is only worth saying to somebody who has seen both. The chrome does not travel: the Menu, the category's name, the buttons and the search all live outside the box that slides. `views.js`. |
| **view** | One of the two ways the contact sheet page shows its category, behind the two buttons across the top: the **houses** (the sheet itself) and the **individual fragrances** (the index). `views.js` switches them, and only one is ever on the page except during the swipe. It briefly had a different pair — the **map** and **Favorites**, the second of which was the removed **register** — so if the owner says "Description portfolio" or "the Favorites view", they mean those. |
| **houses** | The contact sheet view: one picture per house, scattered and joined by dated lines. The pictures run in order down the page — 01 at the top, then 02, 03 and so on. |
| **fragrances** (the view) | The index view of the contact sheet page: every fragrance written up anywhere on the site, with its number, its name, the house it belongs to and the date it was written about. It was called *Individual fragrances* for one round. |
| **the chain** / **the tuft** | **Removed.** The specks round a picture on the contact sheet, kept only within reach of a point where a line tied on. The pictures keep their ruled border; what stands where a line meets one is the tie. |
| **the run** | **Removed.** The line between two pictures drawn as specks rather than as a stroke. Replaced by the trace, which is dashed — a solid stroke is the one thing the line must not be, and there is a test saying so. |
| **the ring** / **the orbit** | A circle of pictures standing in three dimensions round a big square, which is how Favorites was laid out before it became a menu of chapters. Nothing of it is in the code now — no `RING_*`, no `.gallery-face`, no `<button class="gallery-frame">`. If the owner uses the word, they mean that removed treatment. |
| **favourite** | One entry in Favorites (`<a class="gallery-entry">`), carrying a `data-chapter` and a `data-date`. |
| **work** | An individual piece, one page in `works/`. |
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
- **All three houses carry a real picture on the contact sheet now**, and every other
  plate on the site is still a hatched placeholder with its `<img>` tag commented out
  waiting for a file and a name — see [the images
  report](docs/features/2026-09-17-images-folder-per-house.md). Pineward's fifty-two
  fragrance pictures and its gallery arrived on 2026-09-18; Almost Human's own two — the
  **mark** at the head of its page and the photograph `This one` on the sheet — on
  2026-09-21. Almost Human's five fragrance pictures name the files they want in
  `images/Almost-Human/` and show them the moment they are there.

**The placeholders in the new pages are marked as placeholders.** ADAR's introduction,
the standfirsts and most of the site's plates are waiting for the owner, and every
unwritten paragraph says so in a dashed box rather than standing in as prose. **Almost
Human is written**, all five fragrances and its introduction with them, as are the three
theory pages — all in the owner's own words. The dates in the Fragrances table are
rolled from a seed so the sorting has something to work on; they say nothing. The one thing that was not guessed at
is a fragrance's own writing, which is theirs throughout.

**What has never been asked for and should not be invented:** the placeholder content.
`Your Name`, `you@example.com`, the lorem ipsum on slide 2 and the `contact.html` social
links are all still placeholders on purpose — they are the author's to write. (The site's
*name* they have now written: see the landing page's report.)

## Maintaining this file

Keep this file current: when the page list, the content workflow, or the glossary
changes, update the matching section in the same commit. Feature detail does not belong
here at all — see "Feature reports" above for where it goes.

`README.md` is a running changelog written for the site's author and has drifted in
several places (`__p23`'s owner, the palette, `DECORATIVE_POINTS`, and a section on
`menu-modes.js` and per-slide menus, which no longer exist). Prefer the code whenever
they disagree, and correct this file rather than trusting either.
