# Your portfolio site

## What changed in the latest pass

- **The menu opens and closes more gradually.** Everything moves on
  one shared easing curve now: the backdrop fades over 0.85s, the
  links rise in one after another just behind it, and the word on the
  button fades out and back as it changes from "Menu" to "Close".
  Closing drops the stagger so the links leave together — otherwise
  closing feels slower than opening, which reads as sluggish. This
  also fixes a real bug: the page-dimming transition was defined only
  on the open state, so closing the menu snapped the page back to full
  brightness with no fade at all.
- **The title is lowercase and italic** — "what does a tree smell
  like?". Its weight drops one step to compensate, since italics read
  heavier at the same weight.
- **The node map is now full-bleed**, filling the whole third slide
  edge to edge instead of sitting in a box, and the heading line above
  it is gone.
- **The map was rebuilt around endpoints** — see the section below.
- **It turns roughly three times slower**, and the tilt now drifts
  back to level on its own after you let go.

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

- **Loose dots dissolve.** Pointing at one fades it out and contracts
  it to nothing, taking most of its connecting line with it. It
  re-forms when you move away. There's an invisible pointer-sized
  sphere over each one, because a dot that shrinks as it dissolves
  would otherwise slip out from under the cursor and flicker.
- **Link nodes recolour the whole map.** Hovering or tab-focusing one
  tints every line and dot toward the brass accent, with that node's
  own branch going furthest. Keyboard focus does it too.
- **The centre** is a solid brass core inside two soft shells, and it
  breathes very slightly.

### Tuning

Near the top of the file, under `// --- Tuning`:

| | |
|---|---|
| `IDLE_SPEED` | how fast it drifts on its own |
| `MAX_TILT` | how far it can be tipped up or down |
| `FRAME_V` / `FRAME_H` | how much room the map is given — **smaller numbers make it fill more of the screen** |

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
