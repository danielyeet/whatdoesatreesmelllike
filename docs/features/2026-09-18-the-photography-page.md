# The Photography page

Date: 2026-09-18

Files: `categories/other-2.html` (rewritten), `photography.js` (new), the
`photography` block in `style.css`, `images/Photography/README.txt`, `nav.js`
(`SITE_LINKS`), `node-scene.js` (`REAL_NODES`), `search-page.js` (`PAGES`)

## What it is

The second **Other** page is the photographs now. The owner asked for *"a page that
borrows elements from photography porfolios"*, so the borrowings are the design and each
one is deliberate:

| borrowed | what it does here |
|---|---|
| **the sheet** | the frames run in a grid that a wide one breaks — the frame you have ringed on a contact sheet and then printed |
| **the edge** | every frame is numbered down its own margin, where a roll carries its numbers |
| **the set** | the work is in sets rather than one long run, each with a number, a title and a line |
| **the reading** | a caption carries what a photographer writes on the back of a print: where, when |

It spends no accent and draws nothing on a canvas. What carries it is the hairline, the
mono reading and the registration mark the rest of the site is already made of — which is
the point: a new page that needed a new visual language would say the rest of the site
had the wrong one.

## Why it is placeholders

Every plate is the hatch, with its `<img>` commented out. That is the site's own
convention for a picture that has not arrived (see [the images
report](2026-09-17-images-folder-per-house.md)), and the owner has not sent photographs
for this page — the ones they have sent are Pineward's, and those are in Pineward's
gallery. The page is built to be usable while it is still mostly placeholders: a frame
with no picture comes up with its set and does nothing when pressed, so an unfinished set
still reads as a set.

## What the script adds, and what works without it

The page is complete in its own markup. `photography.js` adds two things a stylesheet
cannot do alone:

- **The frames arrive as you reach them**, a set at a time, each a beat behind the one
  before it. A photographer's sheet is read down rather than taken in at once. Staggered
  **within a set** rather than down the page: a set is the unit that is read, so a
  frame's wait should be its place in its own set, not its place in a page that may be
  three sets long by then.
- **A frame opens** into a plate over the darkened page, with its reading under it and an
  arrow either side. Same manners as Pineward's viewer — arrow keys, Escape, press the
  ground to close, a modified press let through to the file itself.

Without it every frame is simply there and each is a link. The class that hides them
(`photo-waiting`) is put on by the script and by nothing else, so a blocked script cannot
leave the page blank.

## The two names it changed

The menu entry and the map node both said **Other**; they say **Photography** now, and
the search's trail with them. The owner asked separately for the map to match the menu —
see [the node map's report](2026-09-11-the-node-map.md).

## How to test it

```bash
npm test -- tests/pages.spec.js
```

It is covered by the page-level checks: it loads with no console errors, its title is
right, every link on it points at a file that exists, and the menu on it works. Driven by
hand for the layout: the set head's number in the margin and its writing in the column
beside it, the wide frame taking two columns, the frames arriving as they are scrolled to.

## Known issues / TODO

- **No photographs yet.** Twelve placeholder frames in three sets, all waiting for files
  and names in `images/Photography/`.
- No test of its own. Worth pinning once there are real pictures: that a frame with no
  `<img>` does not open, and that the viewer's reading comes off the frame's own caption.
- The readings in the head (`Sets 03`, `Frames 12`) are written in the markup and do not
  count themselves. If the page grows, they are a second place to change.
