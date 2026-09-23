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

## The Menu's own ground, on a phone

The trigger is fixed to the top left of the window and the page travels underneath it. On a
wide window there is nothing up there to travel past; on a phone the writing reaches the
top corner, and the owner photographed the word `Menu` printed straight through a
paragraph, unreadable.

Below 700px it gets **a box no bigger than the word, blurring what is behind it**. Three
things about how it is done:

- **The ground is the page's own.** `--chrome-ground` is a token on `:root` — the paper on
  a light page, and near-black under the five bodies drawn on a dark one
  (`theories-page`, `adar-page`, `essay-page`, `find-page`, `chapter-open`). A colour
  picked here instead would be a patch of the wrong one on half the site.
- **The word does not move.** The padding is taken back out of `left`, so the lettering
  stands exactly where it stood. **Nothing above 700px has a box at all.**
- **It goes when the menu is open.** The word stands on the overlay's own black there and
  is lettered light, so a pale box under it would hide it rather than help.

The same token and the same box went on to three more things fixed to the window while the
page travels under them — the contact sheet's view buttons and its search, and the readings
in the corner of the three house pages. Not on a page's own search (`.page-find`), which
stands over a drawing rather than over writing on all three pages that carry it.

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

## The cursor reads the colour under it, and `color()` is a colour

The cursor goes light on a dark ground by reading the actual background underneath rather
than trusting a class: walk up from whatever is under the pointer until something is
painting an opaque background, and go light if that colour is dark.

**It only understood `rgb()`.** Pineward's ground was mixed with `color-mix()` for a
round, which computes to `color(srgb 0.96 0.97 0.96)` — components running **0 to 1**, not
0 to 255. The parser pulled the numbers out and read 0.96 as very nearly black, so the
cursor went white on a white page and could not be seen at all. That shipped.

`colourOf()` handles both forms now: if the string starts with `color(`, its components
are scaled by 255. Anything that computes a background to a modern colour function —
`color-mix()`, `lab()`, `oklch()` — goes through the same door, so this cannot happen
again for a different function.

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

## 2026-09-23 — the cursor over pictures, and over everything

Two faults the owner found, both site-wide:

- **"The cursor disappears when you hover pineward in SD."** The cursor stood at layer
  900, and the old contact sheet put its first picture — Pineward — at 1000, so the
  picture was drawn over the cursor. The cursor now stands at the top layer there is
  (`z-index: 2147483000`), above anything any page can put up.
- **"…and doesnt turn white when hovering something black"**, on the Houses view and on
  Haxan. The cursor worked out whether to go light by walking up from the element under
  the pointer to the first thing painting a background colour. **A photograph paints no
  background**, so over a black bottle it went straight through the picture to the white
  page behind it. It now **reads the picture itself**: a 5 × 5 patch round the point,
  taken at the picture's own resolution and honouring `object-fit`, averaged for
  lightness, with the same threshold as before. A transparent patch says nothing and
  falls through to what is behind; a picture from another site cannot be read by the
  page and falls through the same way. It looks down **everything** under the point
  (`elementsFromPoint`) rather than up from the top element, so a picture behind a
  transparent link or caption is still found.
- Because a picture's colour changes from one point to the next, it is read again whenever
  the pointer has moved six pixels, not only when the element under it changes, and every
  400ms regardless, so a page moving under a still pointer is caught too.

Tested in `tests/background-and-cursor.spec.js`: `stands above everything, including the
pictures on the Houses view` (fails with the cursor at 900 under a picture at 1000), and
`goes light over the dark parts of a photograph, and dark over the light` (fails against
the old background-only reading).
