# Your portfolio site

## What changed in the latest pass

- **The connecting line is straight and simply there.** One vertical
  rule down the middle: title, second slide's sentence, centre of the
  node map. It no longer draws itself as you scroll — it's drawn at
  load and stays drawn.
- **Its last leg belongs to the page it lands on.** As the paper fades
  in for the node map, the segment below the second slide breaks into
  a fine dashed rule on the same 16px rhythm as the grid, and flickers
  and wavers on the same beat as the static. That's the whole of the
  transition now — no travelling spark, no bloom at the centre.
- **The static actually moves.** It was a fixed grain image being
  shifted around, which reads as a moving texture rather than as
  noise. It's now a canvas: nine noise tiles are built once at load,
  and one is painted at a random offset about thirty times a second,
  which is what makes it boil like an untuned television.
- **The grid is tighter and quieter** — 64px squares instead of 110,
  with 16px squares inside them that are close to subliminal.
- **A 9% black wash sits under the node map**, taking the page off
  white for that slide. The map is in the scrolling layer above it, so
  the diagram itself is never dimmed by it.
- **The map is drawn lighter and slightly smaller.** Branches are back
  to hairlines, with more segments around and along each one so they
  stay smooth at that weight, and the centre is smaller to match.
- **The pen weight now compensates for screen size.** A phone draws
  the whole map smaller, which was putting the branches under one
  pixel wide and losing them entirely. The layout still shrinks; only
  the line weight holds, the way a map redrawn at a smaller scale
  keeps the same nib.

## What changed before that

- **Palette**: near-black background, off-white text, one brass accent
  — all still just six values at the top of `style.css`.
- **Fonts**: Archivo (a formal grotesque sans) for headings and body,
  IBM Plex Mono for small technical labels (the title-block, work
  meta, node sub-lines) — no more serif, nothing hand-drawn-looking.
- **Title slide** is now centered, and reads "What does a tree smell
  like" — edit that line directly in `index.html`.
- **The node map is now a real 3D scene** (see below) instead of a
  flat diagram, built with a small graphics library called Three.js.
- **Scrolling between the three landing slides** is now hand-animated
  with a slower, gentler ease, instead of relying on the browser's
  default (which could feel abrupt).
- The persistent border/corner-marks/compass "frame" has been removed
  entirely, on every page.

## The 3D node map — how to edit it

Everything about the map lives in **`node-scene.js`**, in the two
lists at the top of the file.

### The shape of it

Link nodes are **endpoints**. A branch grows out of the centre, passes
through two small waypoint dots, and stops at the link node — nothing
ever continues past one, so anything you can click reads as somewhere
the map ends rather than somewhere it passes through. The loose
atmospheric dots attach to the centre or to a waypoint, never to a
link node. That rule is enforced in the code, not by hand: link nodes
are simply left out of the list of points a loose dot is allowed to
connect to, so you can't accidentally break it by moving one.

### `REAL_NODES` — the clickable endpoints

```js
{ label: "Scent descriptions", sub: "notes on things...", href: "categories/scent-descriptions.html", pos: [-2.9, 1.5, 0.7] }
```

- `label` / `sub` — the text shown (the sub-line only appears on hover).
- `href` — where it links to.
- `pos` — position in 3D space as `[x, y, z]`. Keep these out near the
  edge, roughly 3 to 3.7 from the centre in total, since that's where
  an endpoint belongs. The branch that reaches each one, including its
  curve and its two waypoint dots, is drawn automatically — move a
  node and everything follows.

One thing worth knowing when you reposition them: a node with a small
`y` value will sweep across the centre of the screen as the map turns,
and its label will cross the middle. Giving every node a `y` of at
least about 1 either way avoids that.

### `DECORATIVE_POINTS` — atmosphere

A plain list of `[x, y, z]` positions. Each connects itself to
whichever centre or waypoint is nearest. Keep them within about 2.7 of
the centre so they stay inside the map. If you put one further out
than `MAX_LOOSE_REACH` (1.7) from anything, it just floats
unconnected rather than flinging a long line across the middle.

### How things react

- **Loose specks spray apart.** Each speck is nine particles stacked on
  the same point, so at rest it looks like one dot. Pointing at it
  throws them outward along directions fixed at load — so a speck
  sprays the same way every time — thinning and shrinking as they
  separate. They drift back together about four times slower than they
  scatter, which is what makes it read as a burst rather than
  something breathing in and out. There's an invisible pointer-sized
  sphere over each one, because particles that shrink as they scatter
  would otherwise slip out from under the cursor and flicker.
- **Link nodes emphasise their branch by weight, not colour.** Hover or
  tab-focus one and the branch behind it thickens and darkens, its
  waypoint dots grow, the label goes bold, and everything else on the
  map steps back. Branches are drawn as tubes rather than lines
  specifically so they *can* thicken: WebGL ignores line thickness on
  nearly every browser, so a line-based branch is stuck at one pixel
  forever.
- **The centre** is a dark solid core inside two soft grey shells,
  breathing very slightly. `window.__p23` — the scroll progress
  between slide 2 and 3, set by `thread.js` — is the only thing the
  two files say to each other; the map fades in on it.

### Tuning

Near the top of the file, under `// --- Tuning`:

| | |
|---|---|
| `IDLE_SPEED` | how fast it drifts on its own |
| `MAX_TILT` | how far it can be tipped up or down |
| `FRAME_V` / `FRAME_H` | how much room the map is given — **larger numbers draw it smaller** |
| `BRANCH_RADIUS` / `BRANCH_RADIUS_EMPH` | branch thickness at rest and when its node is hovered |
| `SPECK_SIZE` | how big a loose speck reads |
| `REF_PX_PER_UNIT` | the screen size the weights above are tuned for; other sizes scale against it |

`FRAME_H` has a separate, larger value for portrait screens (in
`resize()`). It has to be larger there: on a tall narrow phone,
filling the height would push the left and right link nodes off the
edges where they can't be tapped. The cost is that the map sits in
the middle of a phone screen with space above and below it. If you'd
rather have it bigger on phones and accept nodes rotating in and out
of view, lower that number.

**This one file is genuinely more advanced than the rest of the
site** — it's real 3D graphics code, not just HTML and CSS. If
something about it needs fixing later, the fastest path is telling me
exactly what's wrong (a screenshot helps a lot) rather than trying to
debug the 3D math by hand.

Two of the seven nodes are labeled "Test node" and link to
`works/test-node-a.html` / `works/test-node-b.html` — plain sandbox
pages you can rewrite freely, or delete along with their entry here.

On a phone, the map no longer blocks scrolling: vertical swipes scroll
past the slide, horizontal drags rotate it.

## How it's organized

```
index.html                          the landing page (title, intro, 3D node map)
style.css                           every page's look — one shared file
nav.js                               the "Menu" button, on every page
landing.js                           gentle scrolling between slides, index.html only
thread.js                            the line through the three slides + the paper fade
node-scene.js                        the 3D node map — see above
contact.html                        the contact page

categories/
  scent-descriptions.html           fully filled in — use as your example
  theories.html / favorites.html / other-1.html / other-2.html    empty, ready for pieces

works/
  example-gallery-work.html         template for a long image+paragraph piece
  example-article-work.html         template for a reference/article piece
  test-node-a.html / test-node-b.html   sandbox pages, see above

images/                             put your photos here
```

## Adding a new piece of work

1. Duplicate whichever template fits in `/works/`, rename it, and
   edit its content — comments inside explain which blocks to copy
   for more entries.
2. Add one line linking to it from the relevant category page, inside
   its `work-list` — copy an existing `<a class="work-row">` block in
   `categories/scent-descriptions.html` as your pattern.

## Adding a whole new category (body of work)

1. Duplicate any file in `/categories/`, rename it, change its `<h1>`
   and lede paragraph.
2. Add one line for it in the `SITE_LINKS` list near the top of
   `nav.js` — the only place the menu is defined.
3. Optional: add a matching entry to `REAL_NODES` in `node-scene.js`
   so it appears in the 3D map too.

## Publishing changes

Once the site is live on GitHub Pages, adding or changing a page later
just means uploading that file (and any new images) to the same
repository — GitHub Pages rebuilds automatically within a minute or
two.
