# Your portfolio site

## What changed in the latest pass

- **Fixed the scroll jank**: the custom slide-to-slide animation was
  fighting with CSS scroll-snap, which is what made it feel broken.
  Snap is now switched off for the moment an animation is running and
  back on once it lands — should feel properly smooth now.
- **Fixed the 3D page not appearing**: it depended on an add-on
  library (OrbitControls) that likely failed to load. Rotation is now
  hand-built with no extra dependency, and there's a plain-list
  fallback if the core 3D library ever fails to load too.
- **Palette flipped to white**: near-white background, near-black
  text, the same brass accent.
- **The "Menu" overlay stays black** on purpose even on the white
  site, and the page now visibly dims behind it when it opens.
- Removed the three dots on the right (wasn't asked for).
- Title is smaller, ends in a question mark, and the corner box is
  tucked closer to the edge.
- The middle slide is now one centered, italic line with placeholder
  text — swap it for whatever you want it to say.

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

Everything about the node map lives in **`node-scene.js`**, in the
`REAL_NODES` list near the top of the file:

```js
{ label: "Scent descriptions", sub: "notes on things...", href: "categories/scent-descriptions.html", pos: [-2.5, 1.1, 0.6] }
```

- `label` / `sub` — the text shown (the sub-line only appears on hover).
- `href` — where it links to.
- `pos` — its position in 3D space, as `[x, y, z]`. Roughly -3 to 3 on
  each axis keeps it comfortably in view; nothing else needs to
  change when you move a node, the connecting line follows it
  automatically.

Two of the seven nodes are labeled "Test node" and link to
`works/test-node-a.html` / `works/test-node-b.html` — plain sandbox
pages you can rewrite freely, or delete along with their entry here.

Further down the same file, `DECORATIVE_POINTS` is a plain list of
`[x, y, z]` positions — small dots that light up on hover but aren't
links, just atmosphere. Add, remove, or reposition freely.

**This one file is genuinely more advanced than the rest of the
site** — it's real 3D graphics code, not just HTML and CSS. If
something about it needs fixing later, the fastest path is telling me
exactly what's wrong (a screenshot helps a lot) rather than trying to
debug the 3D math by hand.

Known trade-off: on a phone, dragging to rotate the scene can make it
harder to swipe past that slide.

## How it's organized

```
index.html                          the landing page (title, intro, 3D node map)
style.css                           every page's look — one shared file
nav.js                               the "Menu" button, on every page
landing.js                           dot navigation + gentle scrolling, index.html only
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
