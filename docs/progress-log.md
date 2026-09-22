# Progress log

Every feature report in [`docs/features/`](features/), **newest first**, one line each.
This is the index: start here, find the entry nearest what you are about to touch, and
open it before you change anything.

A report records what a feature is, why it is built the way it is, what was tried and
was wrong, how to test it, and anything still open. A line that says "this used to be X
and X was wrong" is load-bearing, not history — several of them are there because a fix
was undone later by someone who didn't know why it was made.

| date | entry | what it covers |
|---|---|---|
| 2026-09-22 | [The houses folder](features/2026-09-22-the-houses-folder.md) | the six houses moved into `houses/` and the individual fragrances into a folder of their own, the five links that crossed the new boundary, the seven forwarding pages left at the old addresses, and the anchor test that had quietly stopped checking anything |
| 2026-09-22 | [The fragrance reader](features/2026-09-22-the-fragrance-reader.md) | a fragrance from the Fragrances view opening IN the page instead of navigating away, where its writing is fetched from, and the way back — the picture squaring up and receding into a grid |
| 2026-09-21 | [View notes, and the Fragrances page](features/2026-09-21-the-notes.md) | the notes window on every fragrance, where its data lives, the source hierarchy behind it — the house's own page first, Fragrantica only if that fails — Almost Human's olfactory landscape beside its notes, the two-part windows Haxan and all five of Ataraxia carry, which version a reformulated fragrance's notes belong to, and the two that were looked up and came back with nothing |
| 2026-09-21 | [Ataraxia, Grande Parfums and Les Abstraits](features/2026-09-21-the-newer-houses.md) | three houses in one round, the shared house shape they brought with them, Ataraxia's bands of light on dark gray (which replaced a churchyard) and Grande Parfums' drift |
| 2026-09-21 | [The site on a phone](features/2026-09-21-the-site-on-a-phone.md) | what was actually wrong on a phone, in two rounds — first that the drawings would not run, then that everything was printed over everything else — and the rule that nothing above 700px may change |
| 2026-09-20 | [Almost Human](features/2026-09-20-almost-human.md) | the third house: five fragrances standing in a crowd of figures that resolve under the pointer |
| 2026-09-20 | [The Note Dissemination Framework](features/2026-09-20-the-note-dissemination-framework.md) | the third theory: twenty-two inline-SVG diagrams, a graph, and the only serif on the site |
| 2026-09-18 | [The Photography page](features/2026-09-18-the-photography-page.md) | the second Other page, laid out the way a photographer lays out work |
| 2026-09-18 | [The Pineward gallery](features/2026-09-18-the-pineward-gallery.md) | the owner's own photographs at the foot of Pineward, and the viewer they open into |
| 2026-09-17 | [A folder of pictures per house and category](features/2026-09-17-images-folder-per-house.md) | how `images/` is laid out, why the link test won't catch a broken picture path — **and, on 2026-09-22, the pictures arriving for Ataraxia, Grande Parfums, Les Abstraits and Haxan, and the credit line every house that uses pictures now carries** |
| 2026-09-17 | [The search](features/2026-09-17-the-search.md) | one field over the whole site, a field on each page, and the one manifest a new page must be added to |
| 2026-09-17 | [ADAR](features/2026-09-17-adar.md) | the second house, standing on its void, with its log, dust and sounding |
| 2026-09-17 | [The index pages, and the two views](features/2026-09-17-the-index-pages-and-views.md) | Works (was Researches) and the Fragrances view, and the switch between the contact sheet's two views |
| 2026-09-17 | [The essay pages](features/2026-09-17-the-essay-pages.md) | a long piece of writing on the theories drawing's ground, with the rule down the left |
| 2026-09-16 | [Pineward](features/2026-09-16-pineward.md) | the first house, its fifty-four parts, its wood and its trunk |
| 2026-09-15 | [The chamber](features/2026-09-15-the-chamber.md) | Favourites: two injectors, one orbit, and the menu that opens out of the word — **and, on 2026-09-22, the chapter page it bursts into**: arrows either side of the name stepping through the chapters, a chapter that can be named and empty, the house where the date used to be, a favourite opening where it stands with its notes window, a way out that is no longer a cut, and **the sun** behind Chapter 1 |
| 2026-09-14 | [The structure](features/2026-09-14-the-structure.md) | Theories: a technical drawing in three dimensions you scroll into |
| 2026-09-13 | [The contact sheet](features/2026-09-13-the-contact-sheet.md) | Scent descriptions, Houses view: pictures scattered and joined by dated lines, all in specks |
| 2026-09-11 | [The 3D node map](features/2026-09-11-the-node-map.md) | slide 3 of the landing page — the one WebGL shader in the repository |
| 2026-09-11 | [The landing page's slides, and the exit sequence](features/2026-09-11-the-landing-slides-and-exit.md) | the three slides, and the collapse on the way back up |
| 2026-09-11 | [The paper](features/2026-09-11-the-paper.md) | the wash, the bending grid and the grain behind the landing page |
| 2026-09-11 | [The thread](features/2026-09-11-the-thread.md) | the line down all three slides, and the invisible handover |
| 2026-09-11 | [The chromatogram](features/2026-09-11-the-chromatogram.md) | the trace along the foot of slide 3, and its ranks |
| 2026-09-11 | [The page shell, the menu and the cursor](features/2026-09-11-the-page-shell-and-menu.md) | what every page repeats, `SITE_ROOT`, `SITE_LINKS`, `dark-surface`, the tokens |

## Adding a line

A new feature gets a new file in `docs/features/`, named `YYYY-MM-DD-<short-slug>.md`
for the day it landed, and a new row at the **top** of this table. The template is in
`CLAUDE.md` under "Feature reports". Keep both current in the same commit as the change
itself.
