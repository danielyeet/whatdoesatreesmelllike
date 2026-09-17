# Feature reports

One report per feature, **most recent first**. Each is named for the date the feature
first appeared in this repository's history, so the folder sorts newest-last by name and
this list is the order to read them in.

`CLAUDE.md` used to hold all of this. It is high-level guidance and a set of links now;
the detail lives here. **Read the matching report before editing one of these files** —
each records decisions that were arrived at by trial and error and specific bugs the
owner reported and that were fixed, several of them more than once, because the fix was
later undone by someone who didn't know why it was there. A line that says "this used to
be X and X was wrong" is load-bearing, not history.

| # | report | what it covers | drawn by |
|---|---|---|---|
| 1 | [A folder of pictures per house and category](2026-09-17-images-folder-per-house.md) | how `images/` is laid out and why | — |
| 2 | [The search](2026-09-17-the-search.md) | one field over the whole site, a field on each page, and no list of the site's contents anywhere | `search.js`, `search-page.js`, `page-search.js` |
| 3 | [ADAR](2026-09-17-adar.md) | the second house, on its void | `adar.js` |
| 4 | [The index pages, and the two views](2026-09-17-the-index-pages-and-views.md) | Researches and the Fragrances view, and the switch between the two views | `index-page.js`, `views.js` |
| 5 | [The essay pages](2026-09-17-the-essay-pages.md) | a long piece of writing on the theories drawing's ground | `essay.js` |
| 6 | [Pineward](2026-09-16-pineward.md) | the first house, its wood and its trunk | `pineward.js` |
| 7 | [The chamber](2026-09-15-the-chamber.md) | Favourites: two injectors, one orbit, and the menu that opens out of the word | `chamber.js` |
| 8 | [The structure](2026-09-14-the-structure.md) | Theories: a technical drawing you travel into | `structure.js` |
| 9 | [The contact sheet](2026-09-13-the-contact-sheet.md) | Scent descriptions, Houses view: pictures scattered and joined by dated lines, all in specks | `contact-sheet.js` |
| 10 | [The 3D node map](2026-09-11-the-node-map.md) | slide 3 of the landing page | `node-scene.js` |
| 11 | [The landing page's slides, and the exit sequence](2026-09-11-the-landing-slides-and-exit.md) | the three slides, and the collapse on the way back up | `landing.js` |
| 12 | [The paper](2026-09-11-the-paper.md) | the wash, the bending grid and the grain behind the landing page | `paper.js` |
| 13 | [The thread](2026-09-11-the-thread.md) | the line down all three slides, and the invisible handover | `thread.js` |
| 14 | [The chromatogram](2026-09-11-the-chromatogram.md) | the trace along the foot of slide 3, and its ranks | `extras.js` |
| 15 | [The page shell, the menu and the cursor](2026-09-11-the-page-shell-and-menu.md) | what every page repeats, `SITE_ROOT`, `SITE_LINKS`, `dark-surface`, the tokens | `nav.js`, `style.css` |

## What a report carries

- **Date** — when the feature first appeared, and the rounds of work since.
- **Files** — what it is made of, including its tests.
- **What it is** — the feature in plain English.
- **Why / key decisions** — what was tried, what was wrong with it, and what must stay
  true. This is the part worth reading before changing anything.
- **How to test it** — the command, and what to look at by hand.
- **Known issues / TODO** — where there are any.

## Adding one

A new feature gets a new file, named `YYYY-MM-DD-slug.md` for the day it landed, and a
new row at the **top** of the table above. Keep the report current in the same commit as
the change, the same way `CLAUDE.md` is kept current.
