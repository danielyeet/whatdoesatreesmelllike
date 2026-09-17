# The page shell, the menu and the cursor

Date: 2026-09-11 (the repository's first commit); `nav.js` last changed in `0e3b8b4`,
which added Search to the menu. Migrated from CLAUDE.md on 2026-09-17.

Files: `nav.js` (~200 lines), every `*.html`, `style.css`, `tests/menu.spec.js`,
`tests/pages.spec.js`, `tests/background-and-cursor.spec.js`

## What it is

Every page on this site is standalone. It repeats the same head block (charset, viewport,
the two Google Fonts, `style.css`), loads `nav.js` for the shared menu and cursor, and
then loads whatever draws *that* page — nothing else. No page script knows about any
other, and none of them share state. The one exception is the landing page's six layers,
which talk through five `window` globals; see
[the landing slides and exit](2026-09-11-the-landing-slides-and-exit.md).

## SITE_ROOT

At the bottom, every page sets `window.SITE_ROOT` before loading `nav.js`:

```html
<script>window.SITE_ROOT = "";</script>      <!-- root pages -->
<script>window.SITE_ROOT = "../";</script>   <!-- categories/ and works/ -->
```

`nav.js` prefixes every menu link with it, so **getting this wrong on a new page breaks
the entire menu rather than one link**. `nav.js` also builds the custom cursor — that's
why it loads on every page, not just the landing page.

A URL ending in `/`, which is how the site root is normally visited, has no filename on
the end of it and the server quietly serves `index.html` for it; `nav.js` treats that
empty case as `index.html`, or the Home link is never marked as the page you are on.

## SITE_LINKS

`SITE_LINKS` at the top of `nav.js` is the only definition of the menu — eight entries:
Home, Scent descriptions, Theories, Favourites, Researches, Other, Search, Contact. Adding
or renaming a page in the menu is an edit to that list and nothing else. The menu itself
is one dark overlay, fading in the same way on every page and on all three slides of the
landing page.

It briefly opened three different ways on the landing page (`mode-title` / `mode-side` /
`mode-map`, in a `menu-modes.js` since deleted); "uniform" is the state the owner asked
for and none of that is in the code any more.

## The cursor, and `dark-surface`

`nav.js` builds a custom cursor — a ring and a dot — and checks what is under the pointer
on every move with `document.elementFromPoint`, switching to a light colour over anything
carrying the `dark-surface` class. It falls back to computing the background luminance of
what it finds (light if below 115), but **the class is the reliable path**: any full-bleed
dark region must carry it, or an untagged dark panel gets an invisible cursor.

The ring and the dot are `pointer-events: none`, which is what lets `elementFromPoint` see
through them to the page.

The ring **stretches** with speed (`STRETCH`, in `nav.js`) and rotates to the direction of
travel. Its angle is only recomputed while the pointer is actually moving — `if (speed > 1)`
— and that guard is a fix, not an optimisation. **Regression: the angle must not snap back
to zero when the pointer stops.** It used to, in a single frame, while the ring was still
visibly stretched, which read as a flick at the exact moment it settled. Holding the last
angle lets the stretch relax away to nothing before the angle stops mattering.
`tests/background-and-cursor.spec.js` samples the angle as it settles and fails if it ever
jumps.

## Styling

`style.css` is the only stylesheet, in commented sections mirroring the page types. Six
design tokens at the top — `--bg`, `--bg-2`, `--line`, `--ink`, `--muted`, `--brass` —
plus `--sans` / `--mono`. The palette is **light**: near-white ground (`#fafaf9`),
near-black ink (`#17170f`), one brass accent (`#9c6f35`). `README.md` still describes an
earlier near-black-background version, so trust the CSS.

**Every direct child of `<body>` is given an opacity transition** by the rule that dims
the page behind the menu, and that rule outranks anything written for a new element — so
anything loose in the page cannot be hidden without being seen fading away first. Wrap new
chrome in something. This has already caught two features on
[the contact sheet](2026-09-13-the-contact-sheet.md).

## Running a page

Serve over HTTP rather than opening files directly — pages use relative asset paths and
pointer machinery (`document.elementFromPoint`) that misbehaves on `file://`:

```bash
python3 -m http.server 8000    # then open http://localhost:8000/
npm run serve                  # the same thing on port 8123
```

Pick a port that is **not 4321**: that is the one the test suite starts its own server on.

There is no build or lint step, so nothing catches a mistake before the browser does —
open the console after any change to a drawing.

## How to test it

```bash
npm test -- tests/menu.spec.js
npm test -- tests/pages.spec.js
npm test -- tests/background-and-cursor.spec.js
```

Between them: every page loading with its stylesheet, menu and correct `SITE_ROOT`; menu
behaviour, current-page marking, and the menu opening identically on all three slides of
the landing page; every menu link on every page pointing at a page that exists; the
cursor. `tests/menu.spec.js` includes the regression for arrow keys leaking behind the
menu.

## Known issues / TODO

- **The accent is still spent on this shared chrome.** The Menu trigger and the menu
  overlay's links go `--brass` on hover, and the global focus ring is brass — on every
  page, including the two the owner asked to have no accent on at all. They asked for
  "the orange accents" gone from the favorites page; the chamber's own block in
  `style.css` was cleared, and this was left because changing it changes the chrome on
  every page of the site. The owner knows, and may come back to it. If they do, it is one
  decision made in one place, not a per-page fix.
- `README.md` still describes an earlier near-black-background palette. The CSS is the
  truth; the README has not been corrected.
