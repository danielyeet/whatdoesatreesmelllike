# Your portfolio site

## What changed in this pass

- **Fixed a real bug**: wake specks near a hovered node's branch
  could also get individually raycast-hit and spray apart at the
  same time as converging onto the curve — the two effects fighting
  is what looked like "converging into themselves." A speck on the
  active branch now converges only.
- **Cursor color-over-dark, rebuilt**: `mix-blend-mode: difference`
  wasn't compositing correctly here, so it's gone. The cursor now
  explicitly checks what's under the pointer on every move
  (`document.elementFromPoint`) and switches to a light color over
  anything tagged `.dark-surface` (the menu, the preview window).
  More code, but it can't silently fail to invert the way blend-mode
  apparently was.
- **Popup positioning, hardened**: the side-placement math looked
  correct on review, but it depended on reading the modal's rendered
  width from the DOM at a specific moment — replaced with a plain
  calculation that mirrors the CSS width rule exactly, removing that
  dependency entirely. If it's still opening centered after a hard
  refresh, tell me and we'll dig further.
- **Blur, softened again**: lower radius, much longer transition,
  smaller opacity dip.
- **The hover ripple is far more pronounced** now — taller, denser,
  faster-changing, with a second offset wave riding on the first so
  the spikes come out uneven rather than one clean zigzag, closer to
  the reference image.

## What changed the pass before that

- **Rotation** is slightly faster (`IDLE_SPEED` in `node-scene.js`).
- **Wake specks now converge onto their own branch** when it's
  hovered — they sit offset to the side normally, and gather exactly
  onto the curve while that node is active.
- **The cursor now uses `mix-blend-mode: difference`** — a white ring
  and dot that auto-invert against whatever is behind them, so they
  read correctly over the light page, the dark menu, or the dark
  preview window alike, without needing a manual override for each.
- **The cursor now distorts the grid too**, the same way the centre
  and the nodes do — it's just another "mass" in `paper.js`'s
  displacement field, sized smaller and gentler than the centre.
- **The preview pop-up now opens to whichever side of the screen the
  node was on** (left node → opens left, etc.) rather than dead
  centre.
- **The connector is a real drawn curve now**, not a straight bar:
  an SVG path from the centre, bowed through the node's position, out
  to the window, animating itself in with the classic "draw the
  line on" technique, thickening and darkening to match the branch's
  own hover-bold look. The branch itself also stays bold for as long
  as the window is open, even if your cursor moves elsewhere.
- **The blur behind the pop-up is gentler**: lower blur radius,
  smaller opacity drop, slower transition.

## What changed the pass before that

Working from the files you uploaded (adopted as-is, nothing rebuilt):

- **Sway disabled.** `SWAY` is now `0` in `node-scene.js` — the map
  spins as a whole, nothing moves independently anymore.
- **The zigzag/triangle-wave cursor effect was already there** — the
  `CORR_*` block and the `zigzag()` function already do exactly this
  (a triangle wave, re-rolled a few times a second so it reads as
  noise). Left it untouched.
- **Particles already spread out past the diagram and past the
  screen edges** (`CLOUD_INNER`/`CLOUD_OUTER`) — also left as-is.
- **The bold-on-hover effect is dialed back**: less of a thickness
  jump, lower opacity ceiling, less darkening.
- **Hovering a node now pauses the spin.**
- **Nearby cloud particles now gather onto a hovered node's branch**
  — see `CONVERGE_REACH` near the top of the tuning block.
- **The grid is a touch more low-key** — `MINOR_ALPHA`/`MAJOR_ALPHA`
  in `paper.js`, turned down slightly.
- **Clicking "Scent descriptions" opens a pop-up** instead of
  navigating away: a dark window growing from the node's position, a
  connector that tilts toward the viewer, and the rest of the page
  defocusing behind it. Placeholder image, the description text you
  gave, and an "Enter" button. A trial — see the `preview` field on
  that one node in `REAL_NODES` to extend it to others later.
- While that pop-up is open, the wake and cloud particle systems
  freeze rather than continuing to animate behind the blur.

## What changed in the latest pass

- **The specks became a cloud.** They now run from just outside the
  diagram to well past the edges of the screen, spread along z as well
  as across, so the map sits inside a volume rather than being ringed
  by one — some pass in front of the branches, some behind. They still
  turn with it.
- **Each speck sizes itself by how far out it is**: bigger near the
  centre, down to specks at the frame's edge. A size ceiling stops one
  that drifts close to the camera from ballooning into a blob.
- **They fade in, hold, fade out, and come back somewhere else.**
  Eleven to twenty-seven seconds for a full cycle, each on its own
  clock, so the cloud reshuffles continuously and you shouldn't ever
  catch one doing it.
- **Every branch now sways on its own.** Two slow cycles per branch at
  six to ten seconds, tapering to nothing at the centre, so the tip
  travels about ten pixels and the root doesn't move. Waypoints, wake
  specks, the registration mark and its label all ride along — a
  branch stays one object.
- **The cursor's effect is a corrugation now, not a wave.** A sharp
  zigzag whose height and position are re-rolled about fourteen times
  a second, so it reads as jitter rather than as something travelling
  along a wire. Amplitude is down to about a quarter of what it was —
  roughly one pixel at its strongest.
- **The grid arrives molten.** It comes in heavily warped by a slow
  large-scale wobble that relaxes to nothing as you finish the scroll,
  so the white doesn't switch into ruled paper, it sets into it. Same
  displacement machinery as the refraction around the centre, just
  bigger and going away. The whole paper ramp is flatter at both ends
  too.

### One thing worth knowing about the rewrite

Both particle systems are now single batches drawn in one call each,
with a small shader that gives every speck its own size and its own
opacity — the stock points material can do neither. That's what lets
the count go from twenty-six to nearly seven hundred without the cost
going up with it. The tubes lost a couple of sides each to pay for
every branch bending on every frame rather than only near the cursor.

If the map ever comes up blank, that shader is the first place to
look: a shader that fails to compile takes the whole scene with it,
where the old material would simply have looked wrong.

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
nav.js                               the "Menu" button and the cursor, on every page
landing.js                           gentle scrolling between slides, index.html only
paper.js                             the wash, the bending grid, the static, index.html only
thread.js                            the line through the three slides, index.html only
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
