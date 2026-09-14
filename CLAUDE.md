# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also read `instructions.md` at the repo root — it holds standing behavioral rules
the repo owner has given (how to conduct changes, verification steps, etc.),
separate from this file's codebase documentation.

## Communication style

I don't have coding experience. Explain things in plain English, avoid jargon, and if
you have to use a technical term, briefly define it the first time you use it.

## Before merging or pushing

Always run the full test suite before merging or pushing any change, and after
implementing any feature request. Report results simply — what passed, what failed, and
what you did about any failures — not raw test-framework output.

See "Tests" below for how to run them.

## Keeping this file correct

Whenever a code change makes something in this file out of date or incorrect, update it
as part of that same change. Don't leave stale or wrong information in here.

## Project

A static portfolio site ("what does a tree smell like") — hand-written HTML, one shared
stylesheet, plain browser JS. No build step, no package manager, no local dependencies:
Three.js r128 comes from a CDN in `index.html` alone, fonts from Google Fonts. Deployed
via GitHub Pages from the repo root, so the default branch is the live site.

## Running it

Serve over HTTP rather than opening files directly — pages use relative asset paths and
pointer machinery (`document.elementFromPoint`) that misbehaves on `file://`:

```bash
python3 -m http.server 8000    # then open http://localhost:8000/
```

There is no build or lint step. When changing `node-scene.js`, `paper.js`, or
`thread.js`, check the browser console first — the particle systems use a custom shader,
and a shader that fails to compile takes the whole 3D scene with it, so the map comes up
blank rather than merely wrong.

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

The suite runs **fully offline**: `tests/helpers.js` intercepts the Three.js and Google
Fonts requests and answers them locally, Three.js from the version pinned in
`package.json` — which must stay matched to the version `index.html` requests, or the
tests stop testing what actually ships. Nothing in `package.json` is needed to view or
publish the site; it exists only for the tests.

What's covered: every page loads with its stylesheet, menu and correct `SITE_ROOT`; menu
behaviour, current-page marking, and the menu opening identically on all three slides of
the landing page; the three slides and their keyboard/button navigation; the 3D map, its
labels, hover, preview window, the ranks receding behind the trace with their peaks in
line, and the no-Three.js fallback; the paper's arrival — top-down, sides ahead of the
middle, completely covering the page before its mask comes off, and the grain never cut
by that mask — and the cursor; the exit sequence's ordering, the collapse drawing every
node into the centre, and the reforming line stopping at the sentence and handing over
to the thread without a seam; plus browserless file checks (no link points at a missing
file, no credentials committed, and the site still needs no build step to publish); and
the contact sheet — the flick ending on the first picture and leaving it where it was,
the search matching a picture by name, every line
stopping just off the two pictures it joins, no line crossing a picture it is not
pointing at, no picture left with nothing joined to it, the pictures arriving one after
another rather than together, nothing shifting sideways when the page grows, the two
buttons arriving only once it has finished drawing itself, a frame keeping its number
once a real picture is put in it, the whole map being one network with no picture and no
island left out of it and no picture on the end of a single line, pointing at a picture
turning it in three dimensions without moving where it was laid out, nothing answering
the pointer until the sheet has settled, every line carrying a date with none of them
landing on a picture, and a date being written along its line rather than switched on;
and favorites — switching views taking one away before the other arrives, the
screen flickering once and only once as the chapters come up, the chapters and their dates
being read off the page's own entries, one chapter open at a time with the strip working
from the keyboard, every favourite still a link to its piece, the field answering the
cursor and settling again afterwards, its skyline being a reading of the chapter you have
open and rising under the entry you point at, and the whole view fitting one screen;
and the structure — it being grown from the page's own rows with one station per theory,
the travel being the page's own scroll down a road several screens long, going further in
bringing new stations up and leaving the ones behind you off the page, travelling *back*
filling the air again as many times as you like, travelling back also coming all the way
back to the beginning after the page has been left alone, the spine working as a wheel
both dragged and pressed, a station being the thing you click and the only thing on the
drawing that is one, clicking one setting it out on the window and writing its card while
pointing at one does nothing, the click after that being the one that opens the theory,
and escape or travelling putting it back, it being drawn mostly white on near-black with
the cool accent kept for the marks that say a station can be opened, it saying
`dark-surface` to the cursor, it not creeping on its own under `prefers-reduced-motion`,
and the plain list coming back when the script is blocked.

Several are regression tests for specific fixed bugs — the clipped connector SVG, the
flat NDC depth, the cursor's angle snap, arrow keys leaking behind the menu, the paper's
mask being dropped while still feathering, grain arriving along a moving edge, the
reforming line both running across the slide-2 sentence and being visibly swapped out
for the thread, and the structure's travel creeping away from the scrollbar so that the
beginning of the road could not be got back to. Keep them passing rather than adjusting them to match new behaviour,
unless the behaviour change is deliberate.

Visual/aesthetic judgement is still manual — the suite checks that things work, not that
they look right.

Two states are easy to forget when reviewing a change:

- **`prefers-reduced-motion: reduce`** — read by `landing.js`, `paper.js`, `thread.js`,
  `node-scene.js`, `contact-sheet.js`, `favorites.js`, `structure.js` and `style.css`,
  each degrading to a still version. `nav.js` (the cursor) and `extras.js` do *not*
  currently check it; if you add motion there, add the guard too.
- **Portrait / narrow viewport** — `resize()` in `node-scene.js` uses a larger `frameH`
  when `aspect < 1`, deliberately drawing the map smaller so the left and right link
  nodes stay on screen and tappable. Vertical swipes must keep scrolling the page;
  only horizontal drags rotate the map.

## Architecture

### Page shell (every page)

Each HTML page is standalone and repeats the same head block (charset, viewport, the two
Google Fonts, `style.css`). At the bottom, every page sets `window.SITE_ROOT` before
loading `nav.js`:

```html
<script>window.SITE_ROOT = "";</script>      <!-- root pages -->
<script>window.SITE_ROOT = "../";</script>   <!-- categories/ and works/ -->
```

`nav.js` prefixes every menu link with it, so getting this wrong on a new page breaks
the entire menu rather than one link. `nav.js` also builds the custom cursor — that's
why it loads on every page, not just the landing page.

`SITE_LINKS` at the top of `nav.js` is the only definition of the menu.

### The landing page's layers

`index.html` is three scroll-snapped slides with six scripts over them, loaded in
dependency order: `nav.js`, `landing.js`, `node-scene.js`, `paper.js`, `thread.js`,
`extras.js`. Each owns one visual system, and they communicate *only* through these
globals on `window`:

| global | written by | read by |
|---|---|---|
| `__p23` | `paper.js` (0–1 scroll progress, slide 2 → 3) | `node-scene.js` (map fade-in), `thread.js` |
| `__mapField` | `node-scene.js`, per frame (screen position + mass of centre and nodes) | `paper.js`, to bend the grid around the diagram |
| `__mapReadout` | `node-scene.js`, per frame (node positions/depth, `hubX`/`hubY` in viewport coords, `activeIndex`, `previewOpen`, `collapse`) | `extras.js` (the trace), `paper.js` (freezing grain behind a preview; aiming the collapse) |
| `__exit` | `landing.js`, 0→1, only while leaving the map upwards | `node-scene.js`, `paper.js`, `extras.js`, `thread.js` |
| `__reform` | `landing.js`, 0→1, straight after `__exit` completes | `thread.js` |

That table is the whole contract; these files deliberately never touch each other's DOM
or internals. (The README says `thread.js` sets `__p23` — it doesn't, `paper.js` does.)

- **`landing.js`** — hand-animates `scrollTop` between slides (wheel, keys, the "Scroll"
  button). It must set `scroll-snap-type: none` for the duration of each animation and
  restore it on landing; leaving snap on makes the browser fight the animation, which is
  what previously looked broken. It also **conducts the exit sequence** when leaving the
  map upwards: `__exit` 0→1, then `__reform` 0→1, then the scroll, then both back to 0.
  Nothing scrolls until the first two have finished — that ordering is the whole effect,
  and `tests/leaving-the-map.spec.js` guards it. It also fades both corners of the title
  slide — the block bottom right ("A portfolio / 2026 edition") and the "Scroll" button
  bottom left — out and back in with the scroll position between slides 1 and 2, through
  one shared `fadeOnLeavingSlideOne()`. For the block that means first clearing the
  `rise` keyframe animation that otherwise outranks it, once that animation has finished
  playing; the button has no such animation. Whichever is faded out also stops taking
  pointer events, so nothing invisible is still clickable.
- **`paper.js`** — the wash, the bending squared-paper grid, and the static, drawn on
  canvases at throttled rates (`GRID_MS`, `NOISE_MS`) rather than every frame.

  Going 2 → 3 the paper has to *gather* rather than appear, so nothing about its arrival
  may be a step. Three things had to be true for that, and each is easy to undo:

  - **The mask must be completely solid before it is taken off.** `setCurtain()` drops
    the mask altogether once it has served its purpose; if any part of the page is still
    feathering at that moment, that part fills in one frame. `CURTAIN_REACH` is sized so
    the sweep has run past the bottom of the page well before then.
  - **`paperIn` is eased flat at both ends** (`smoother`), so there is no moment you can
    point at where the paper starts or finishes arriving. An exponent below 1 was
    quicker off the mark but began with a step.
  - **The finest grid tier fades in rather than switching on.** It is skipped while the
    grid is still molten — four times the line count for something the warp hides
    anyway — but as a threshold that put a whole tier on screen in one frame.
  - **The grain is never cut by the wipe.** The mask is set on `.paper-wash` and
    `.paper-grid` themselves, not on `.paper` around them, so `.paper-noise` is left
    out of it: texture arriving along a moving edge is about the most noticeable thing
    a page can do, and no amount of feathering hides it. The grain comes up evenly over
    the whole window on its own later, gentler ramp (`NOISE_START` / `NOISE_SPAN`) and
    is the last of the paper to settle.
- **`thread.js`** — the line running down all three slides. `TRANSITION` at the top
  selects between two finished treatments of its final leg (`"dissolve"` / `"fork"`);
  both are maintained, so keep both working.

  Coming back up, the reforming line and the thread's own leg below the sentence are the
  same line in the same place, and the whole point is that you cannot see one become the
  other. Three things make that true, and each was a visible seam before:

  - **Never set `style.opacity` on a leg of the thread — it does nothing.** Every leg
    carries the `thread-in` arrival animation, whose fill is `both`, so it keeps hold of
    `opacity` for the life of the element and outranks anything set on the element
    directly. Fade a leg through `stroke-opacity` (`legFade`) instead. This is why the
    dissolving leg used to stay on screen right through the collapse, reading as a
    dotted line competing with the solid one being drawn out.
  - **The reforming line comes back to the thread's own weight and column as the page
    travels**, keyed off how much of the map is still on screen. It is drawn heavier
    (`REFORM_INK`) and anchored to the sphere while it is alone on the page, and is
    already `THREAD_INK` in the thread's own column by the time the two swap — so the
    swap itself is not something you can see.
  - **It stops at `top0`**, the same point below the slide-2 sentence that the downward
    leg starts from, rather than running to the top of the window the whole way. And the
    leg *above* the sentence is left alone entirely: it is off screen for the whole
    collapse, so fading it bought nothing and only made it snap back on arrival.
- **`extras.js`** — a gas-chromatograph trace along the foot of the slide, one peak per
  node, reading `window.__mapReadout` for depth (peak height) and `activeIndex` (the
  hovered node's peak gets a guaranteed floor height, not just a multiplier, so hovering
  a currently-distant node still visibly reacts). Runs edge to edge with no labels. Every
  peak keeps its own eased position and height (`CHROMA_EASE`) rather than being drawn
  from live values, which is what keeps it from twitching as the map turns and makes
  hovering grow a peak smoothly. Toggled by `SHOW_CHROMATOGRAM`, a
  single boolean. Two earlier ideas that lived here — dimension strings between nodes,
  and plan/elevation boxes in the corners — were removed outright rather than left
  toggled off. Nothing depends on this file; it and its `<script>` tag can be deleted
  with no other change.

  Behind the front line stand `RIDGE_COUNT` **ranks** of it, each higher up the page,
  shorter and fainter than the one in front, so the reading recedes like hills. They are
  `<use>` copies of the one path, not traces of their own: the shape is computed once a
  frame however many ranks there are, and none of them can fall out of step with it.
  Each rank's step up the page is `RIDGE_FALLOFF` (below 1) of the last, so they crowd
  together towards a horizon instead of marching away evenly.

  Two things to keep true when retuning them:

  - **A rank is only ever scaled vertically, about its own baseline.** Squeezing one
    sideways as well would carry every peak with it, and the same node would then read
    at a different place across the ranks — they have to stand in the same column to be
    the same reading. `tests/node-map.spec.js` checks the transforms have no horizontal
    part at all.
  - **`RIDGE_SPAN` must stay comfortably larger than the tallest peak's shrinkage**, or
    a rank dips through the one in front of it. The tallest a peak gets is
    `CHROMA_PEAK * CHROMA_HOVER_BOOST`.

### `node-scene.js` — the 3D map

The one genuinely complex file (~1200 lines). `REAL_NODES` at the top is the intended
edit surface; everything below is graphics code.

- **`REAL_NODES`** — the clickable endpoints: `label`, `sub`, `href`, `pos: [x, y, z]`,
  plus an optional `preview: { description }`. Positions are a Fibonacci sphere. Keep
  `pos` roughly 3.2–3.7 from the origin, and keep `y` clear of 0 — a node near the
  equator sweeps across the middle of the screen on every rotation, dragging its label
  through the centre.

Everything else is derived, and that is the property to preserve. Each branch is a
`CatmullRomCurve3` that leaves the hub straight along the line to its own node, then
bows through two waypoints to reach it — the waypoints computed from the node's own
position and a per-branch perpendicular, the straight run so that the arms leave the
centre at the same even spacing the node positions already have (bowing from the hub
itself threw each one off by a different amount, which read as arms placed at random). The branch stops
at the node — nothing continues past a link node, so anything clickable reads as a place
the map *ends*. Its wake specks are sampled off that same curve (`curve.getPoint(t)`),
which is why they can't end up lopsided and why they ride the branch's motion with it.
Move a node and the curve, waypoints, and wake all follow; don't hand-place any of it.

Note the README documents a `DECORATIVE_POINTS` list and a `MAX_LOOSE_REACH` tuning
value for loose dots that attach to the nearest waypoint. **Neither exists in the code
any more** — that system was replaced by the per-branch wake described above.

Other things that will bite you:

- Both particle systems are single batched draws with a custom `ShaderMaterial` giving
  every speck its own size and opacity (the stock points material can do neither). This
  is what makes hundreds of specks cheap, and it's why a shader error blanks the scene.
- A wake speck is `PARTICLES_PER_SPECK` (9) particles stacked on one point, so it reads
  as a single dot at rest and sprays apart when pointed at. Spray directions are fixed
  at load, so a given speck always bursts the same way.
- Hover detection raycasts against `wake.points`, not the branches — pointing at a
  speck is what sets `activeBranch`. Emphasis is then by **weight, not colour**: the
  branch thickens, the rest of the map steps back. Branches are tubes rather than lines
  precisely so they *can* thicken, since WebGL ignores line width nearly everywhere.
- Hovering a node, or having a preview open, holds the map still instead of letting it
  keep drifting under the pointer.
- A node's `preview` intercepts the click and opens a dark modal whose connector arm is
  that node's *own* branch traced out to the window, not a second curve drawn alongside.
  The node's **name** moves with the click: the map's copy of it goes instantly, and the
  copy above the window comes up gradually from that same moment (the registration mark
  stays; only the lettering moves). The name is a child of the modal so it travels with
  it, positioned outside its top edge on the paper. One name, one place: if you ever make
  both visible at once, that is the bug. It eases back into the map on close — instant
  out, eased in.
- If `THREE` is undefined the scene replaces itself with a plain list of `REAL_NODES`
  links. Keep that fallback working when editing the top of the file.
- The `TUNING` block near the top holds every magic number (`IDLE_SPEED`,
  `DRAG_SENSITIVITY` / `MAX_SPIN` — how far the map turns for a given movement of the
  hand, and the fastest it will spin however hard that movement is — `FRAME_V` /
  `FRAME_H` — larger values draw the map *smaller* — `BRANCH_RADIUS`, `SPECK_SIZE`,
  `REF_PX_PER_UNIT`, the `ROOT_FLARE_*` group, and the wake / cloud /
  corrugation groups). Tune there, not inline. Several systems are dialled to zero but
  left wired up (`SWAY = 0`, `CLOUD_COUNT = 0`); bring them back by raising the number
  rather than rebuilding the machinery.
- **A branch is one object from the centre to its node.** Where it meets the sphere it
  swells out to `ROOT_FLARE_RADIUS`, bridging a hair-thin tube and a sphere twenty-odd
  times its width so a branch reads as growing out of the centre rather than as a wire
  poked into a ball — but that swelling is the *tube being drawn wider there*, made in
  `branchGeometry()`, not a collar laid over the end of it. It used to be a separate
  `LatheGeometry` mesh, and a separate piece was visibly a separate piece however
  carefully it was matched: it was straight where the branch had already begun to bend,
  and being transparent over the tube it also came out darker — so the middle of the map
  read as seven stubs with seven thin lines starting where they stopped. That was a
  reported bug; don't reintroduce a second mesh at the hub end.
  `branchGeometry()` takes a `TubeGeometry` and pushes each ring outward from its own
  middle (the average of the ring's vertices, the repeated seam vertex left out), by how
  far that middle is from the sphere's surface — so the swelling follows whatever the
  curve is doing rather than assuming it is straight. The same pass writes a **colour
  ramp** per vertex, carrying the centre's own near-black at the sphere's surface up to
  the tube's own colour over the next `ROOT_FLARE_BLEND`, so there is no line to see
  where a branch enters the sphere. That ramp is a *multiplier*, because the material's
  colour is already kept in step with hover's darkening. Both tubes — resting and
  emphasised — are built this way, each with its own ramp; `repen()` rebuilds them at
  the new pen weight, and `mesh.userData` carries the radius and colour it needs to.
- `viewDepth(worldPos)` is the real per-node depth (0 near, 1 far), used for label
  opacity, z-index stacking, and the chromatogram's peak heights. Raw NDC
  `projected.z` looked plausible but was useless here — every node landed within 0.01 of
  the far end of its range for a scene this small this far from the camera's near/far
  planes — so don't reach for `projected.z` as a stand-in for depth anywhere in this file.

### The structure (`structure.js`) — categories/theories.html

That category is a **technical drawing in three dimensions that you travel into**, not a
night sky — a frame of ribs and rails running away into the depth on near-black, a ruled
**spine** along the floor of it, and a fine **swarm** of particles hanging in the air.
Scrolling carries you *into* the screen, the near work sweeping past and new work coming
up out of the dark. You cannot turn it or drag it sideways — going further in is the whole
of the gesture.

Two kinds of assembly stand in that frame, and the difference is the point:

- a **station** is one theory: bracketed, crosshaired, numbered, named, and clickable;
- a **fixture** is structure only: the same kind of figure, unnamed, unbracketed, fainter,
  and **not** clickable. They are there so the frame is full of work rather than holding
  nine lit things in an empty volume — and so that being bracketed *means* something.

- **The travel is the page's own scroll.** The canvas is `position: fixed` and a spacer
  (`.structure-road`) gives the page a height, so the scrollbar, the trackpad, the arrow
  keys, Page Down and a finger on a phone all drive it without a line of code. Catching
  the wheel and turning it into movement breaks every one of those.
- **Every bit of the travel is reversible.** The page is never quite still — it creeps —
  but that creep is a **breath** in and out of a fixed place (`CREEP`, `CREEP_EVERY`),
  written from the clock rather than added up. It used to be added up frame after frame,
  so where you were was the scroll *plus* however long the page had been open: leave it a
  minute and the start of the road was a minute behind you, and scrolling back to the top
  of the page no longer got you to the beginning of it. That was a reported bug. Anything
  new that moves the eye has to be something a scroll can undo.
- **The swarm wraps in BOTH directions.** A speck keeps no position along the road at all:
  its depth is taken modulo `DEEP` each frame and *which lap* it is on decides where it
  stands across the frame, so it is somewhere new each time round and the air is full
  whichever way you are going. It used to be carried along — a speck that went behind you
  was moved out to the far end — which is invisible going forward and empties the air
  completely going back. That was a reported bug; it cannot come back in this shape, and
  `tests/structure.spec.js` travels back and forth and counts what is drawn.
- **Both wraps are hidden by a fade at each end of a lap**, near and far. Without the near
  one a speck about to wrap is hugely magnified and pops in the middle of the screen.
- **The frame does not wrap.** Ribs, rails, stations and fixtures stand at fixed depths
  along a road with a beginning and an end, so there is always somewhere to have got to.
  Ribs alternate: a full rectangle, then a narrower set of corner brackets between.
- **The spine is a second way to drive the same scroll.** It is drawn on the canvas as a
  ruler running along the floor to the vanishing point, ticked at every whole depth and
  numbered every ten, so the ticks stream towards you as you travel — the detents of a
  wheel. `.structure-spine` is the piece of screen that answers the hand, and dragging it
  **writes `window.scrollY`** rather than keeping a travel of its own, so it and the
  scrollbar can never disagree. It is a real `<button>`: pressed rather than dragged — the
  only way it can be used from a keyboard — it goes on to the next station.
- **An assembly's figure is nearest-neighbour**, not a shape written by hand. Some of its
  lines are *provisional* and come and go on their own clock; the rest are always there.
- **The station is what you click.** The link is sized to that station's own box on the
  screen every frame and laid over it, with the name below — so nothing in the stylesheet
  may give `.structure-stop` a size or a transform of its own. The box is **capped** at
  about half the window and taken off the page once it is carried clear of the window: a
  station you are nearly inside would otherwise be an invisible link the size of the
  screen, where clicking anywhere at all goes somewhere.
- **Clicking one sets it out; the click after that opens the theory.** The first click
  takes the station out of the frame: it comes forward, turns as it comes, and its parts
  go out to arm's length on a **ring** — the same figure with the same lines between the
  same parts, opened out and squared up the way a drawing of a part is set out to be
  read, with a scale ruled under it. The rest of the frame goes back behind one wash
  (`OPEN_VEIL`), and a **card** writes itself in beside it once the figure has landed.
  Five things about it:
  - It is a **click**, not a hover. Travelling past nine stations should not keep taking
    the page apart, so nothing here answers the pointer merely passing over one.
  - The card lives **inside the station's own `<a>`**, which is what keeps "a station is
    the only thing on this drawing you can click" true: the card is more of the station
    rather than a second thing to aim at, and clicking either follows the link. It also
    means the same two steps work from the keyboard, where Enter is a click.
  - Which place each part takes on the ring is worked out **once, at load** (`order`),
    read off round the figure as it already stands — so opening it is the parts moving
    out to arm's length, and nothing crosses anything.
  - Where the parts go is worked out in **screen** space, so an opened station stands
    perfectly still even though the drawing behind it does not.
  - Escape, a click anywhere else, and **travelling** all put it back. Going further in
    is the whole of this page's gesture and is never the thing that is blocked, so the
    travel is not held, locked or frozen while one is open.
  - The card carries the station's name, so the copy under the figure goes while it is
    open — one name, one place, the same rule the node map's preview follows. An
    optional `data-note` on the row is shown as a line of the owner's own; without one
    the card carries what the page already says plus the readings the drawing has.
- **A station behind you or still out in the dark is `display: none`**, not faded to
  nothing — faded, it would still catch the pointer where there is nothing to point at.
  The window one is shown for (`SHOW_FROM`…`SHOW_TO`) is deliberately wider than
  `STOP_EVERY`, so the next is coming up before the last has gone.
- **Blue means "you can open this", and nothing else.** The palette is white and near-white
  on gray-black; the cool accent is spent only on a station's brackets, crosshair, node
  rings and ranging squares. The figure itself, the frame, the spine and the travelling
  carriage are all white or steel. Drawing a whole station in blue filled the screen with
  it as you came up on one, and then blue stopped meaning anything.
- **The drawing carries `dark-surface`**, which is how the rest of the site says "the
  cursor has to go light over this". Without it `nav.js` leaves a dark cursor on a dark
  page.
- **The moving parts are on their own clocks, not on the travel**, so the page has
  something happening in it while you are standing still: the specks wobble about their
  own places, provisional lines come and go, beads run along the lines of whatever station
  you are among, a **carriage** runs down the frame at you and lights each rib as it
  passes, **traverses** streak across it, and a faint scan passes down the window every
  nine seconds. Under `prefers-reduced-motion` none of it moves: the clock stops, so the
  wobble, the beads, the ranging squares, the traverses and the scan are all gone and the
  carriage simply stands where it is — held still rather than switched off.
- **Glows are stamped, not generated.** One radial gradient is drawn once into a small
  offscreen canvas per colour and then `drawImage`d wherever a glow is needed. Asking for
  a fresh `createRadialGradient` per speck per frame is the one thing that will not hold
  sixty frames a second here.
- **A grain tile is laid over the whole drawing.** It is not texture for its own sake: a
  wide, shallow vignette over a near-black ground comes out in visible steps, and
  something uneven laid over it is what breaks them.

### The contact sheet (`contact-sheet.js`), and favorites (`favorites.js`)

One category page — `categories/scent-descriptions.html` — is laid out as a **contact
sheet** rather than as a list of rows. It carries **two views of the same category**, and
the two buttons above the middle window switch between them:

| button | view | file |
|---|---|---|
| Description portfolio | the map — every picture scattered, joined by dated lines | `contact-sheet.js` |
| Favorites | a menu of chapters, over a field of marks that reads the chapter you have open | `favorites.js` |

Neither file touches the other's elements. All they share is a class on `<body>`
(`view-favorites`), which `style.css` reads to take one view out of the page and put the
other in — and the switching itself lives in `favorites.js`, because it owns the buttons.
Only one view is ever on the page: the one being left fades away *first*, and the other
arrives after it, so the page never shows two different things at once.

The page opens white with one square window in the middle; every picture in the category
flicks through it on hard cuts, fast at first and slowing to a stop; it lands on the
first one, which stays exactly where it is; the two buttons above it and the category's
name arrive; then lines reach out across the page at whatever angle they need, each
carrying a date, and each of the other pictures appears as its line lands on it.

- **The pictures are the `<a class="sheet-frame">` blocks in the page.** Adding one is an
  HTML edit; nothing in the script changes. The first block is the one it lands on.
- **The page carries no title.** The two buttons are the whole of its chrome: fixed
  across the top between the Menu on the left and the Search on the right, and they
  arrive only once the page has finished drawing itself — the page puts itself together,
  and then hands you the controls. The `<h1>` stays in the markup, out of sight, because
  a page with no heading at all is a page nothing can announce.
- **Anything that hides an un-landed picture must be written under `.settled`.** Every
  picture takes its turn in the middle window during the flick, so a rule aimed at the
  pictures' arrival (`opacity: 0` until `.landed`) hides the flick itself — the window
  goes blank for three seconds. That is a bug this page has actually had. The test that
  should have caught it was asking whether the frame was `visibility: visible`, which it
  was; it now asks whether you could actually see it.
- **The number in the corner is not part of the placeholder.** It is the frame's number
  on the sheet, printed on its own white chip, and it stays once a real picture is in the
  frame — only the hatching goes. `tests/contact-sheet.spec.js` puts a picture into a
  frame and checks the number survives it.
- **Without JavaScript the page is a plain CSS grid of those same frames**, captions and
  all — a working page. The script puts `.scripted` on the sheet and takes over, and
  every rule that hides something is written under that class so the fallback can't
  inherit it. Favorites is in that fallback too (`body:not(.sheet-scripted) .gallery
  { display: block }`): it is a list of links now rather than pictures placed in three
  dimensions, so it is worth having on the page without the script — both views end up
  one under the other, and everything is reachable.
- **Room is kept for the scrollbar from the start** (`scrollbar-gutter: stable`, on pages
  carrying a sheet only). The page grows a lot taller the moment the sheet lands, and on
  a browser with ordinary scrollbars that made one appear — which took 15px off the width
  and shifted everything centred on the page sideways at exactly the moment the flick
  stopped, so the whole thing looked like it twitched.
- **The flick is set up to END on the first picture** rather than cutting to it when the
  flicking is over. It counts its own cuts before it starts and begins at whichever
  picture makes the last one land there. Cutting at the end is one blink too many: the
  run has to simply stop.
- **The scatter never overlaps.** Each picture is given a square of its own on a grid
  with far more squares than there are pictures, and wanders only inside that square, so
  the arrangement is irregular but nothing can ever land on anything else. The room a
  picture's caption needs is part of its square, so nothing is printed over anything
  either. Each row is given a little more room than the one above it (`ROW_OPEN`), so the
  sheet opens out as it goes down rather than bunching up — gently: at 0.16 a third of
  the map was empty space.
- **A line is only drawn where nothing is in the way.** Lines go at any angle now, so the
  layout no longer keeps them clear of anything — instead a link that would cut across
  another picture, or across any caption (including the captions of the two pictures it
  joins), is not made at all, and the picture it would have reached is left unlinked. A
  caption is printed on white, so a line behind one is knocked out where it crosses and
  pokes out beside the word as a stray stroke, which reads as a mistake in the lettering.
  `tests/contact-sheet.spec.js` checks both, segment against rectangle.
- **Not everything is joined up — but nothing is left out, and there are no islands.**
  Each picture links to one of its nearer neighbours, some links are dropped on purpose,
  and a few extra ones are added across the map so it closes loops: a network rather than
  a family tree. Dropping links leaves two kinds of orphan behind, though, and both read
  as forgotten rather than as loosely joined: a picture with no line at all, and — less
  obvious and just as wrong — a pair or a huddle joined only to each other with no way
  back to the rest of the sheet. So the parts are counted (which picture can already
  reach which) and then sewn together: every possible line is tried shortest first, and
  any that joins two parts that could not reach each other and has a clear run is taken.
  A test checks the sheet comes out as one network.
- **And no picture is left on the end of a single line.** One line is a dead end — the
  map stops there rather than carrying on — and with four of the thirteen like that it
  read as a handful of stubs rather than as a route you could follow. A picture with only
  one line is given a second, to the nearest picture it has a clear run to and is not
  already joined to. Those are not tree links: both ends are already on the map by then,
  so they close loops rather than carrying the spread, and the map still arrives outwards
  in order.
- **A line that has been sewn on has to be turned to face outwards.** The spread travels
  from the middle along the tree links and each has to name the end nearer the middle
  first, so after the sewing the links are walked out from the middle and any that was
  made the other way round is swapped. Miss this and a whole limb of the map never
  arrives.
- **How much room a caption takes up is measured, not guessed** — and measured *after*
  the frame has been given its width. A frame with no width yet shrinks to nothing, its
  caption's `max-width: 150%` with it, and every caption on the page then measures five
  pixels across; links are planned on the first layout, so reading it a moment too early
  plans the whole map against captions that are not there. Guessing instead had to allow
  for the longest caption there might be, and "Untitled" prints a third of that — on a
  crowded page that is the difference between a map that joins up and one that falls into
  islands. On a very narrow window the pictures end up in a column and there may be no
  clear run left between two parts of the map; a line through a picture is worse than an
  island, so there it stays in parts.
- **Every line carries a date.** A line without one reads as unfinished beside the ones
  that have them. A short line cannot hold ten characters at the ordinary size without
  the lettering reaching past the end of its own line and onto the picture there, so a
  short line is written *smaller* rather than left bare — and how wide the words actually
  come out is measured with `getComputedTextLength()` rather than guessed at, because
  that depends on the font and the font is not ours to predict. The white halo that
  knocks the line out behind the lettering is scaled with the size.
- Dates sit at a different fraction along each line rather than always at the halfway
  point, because two lines crossing near their middles would otherwise print their dates
  on top of each other; a line with barely room for its date is the exception, since
  there is nowhere to slide it to. Each one is **written** rather than switched on: the
  lettering is uncovered from its left end by a `clip-path` that opens as the line lands
  (`clip-path` does clip SVG text, which is what makes this possible without drawing the
  word twice).
- **Testing whether a date is clear of a picture means testing its own turned rectangle**,
  not the upright box around it. A date written along a diagonal fills a fraction of that
  box, and testing the box calls a perfectly clear date a collision — which is what the
  first version of that check did.
- **A date label is moved on a later layout, never made again.** Every layout used to
  append a fresh `<text>`, which left the old one in the drawing — covered over by its
  own clip-path and so invisible, but piling up one per link on every resize, and
  restarting the writing from nothing when the window was only resized.
- **Pointing at a picture takes it out of the page, barely.** The rest of the sheet dims
  a little (`.peeking` on the sheet), and the one under the pointer tips in three
  dimensions towards it — `perspective()` and a pair of rotations written as custom
  properties (`--turn-x` / `--turn-y` / `--lift`), which is why the frame's *position* is
  a `translate()` of `--x` / `--y` in the same transform rather than `left` / `top`: the
  two have to live in one declaration. It turns about its own middle, so the picture
  stays exactly where the layout put it. `TIP` and `LIFT` are deliberately small — it is
  a picture answering the hand, not a picture jumping.
- **None of that is live until the sheet has settled.** Both the script (`ready()`) and
  the stylesheet (every peeking rule is written under `.settled`) refuse it while the
  page is still drawing itself, and a frame only answers once it has `landed`. During the
  flick every picture in turn is the one in the middle window, so tipping whatever the
  cursor happens to be over is nonsense. The same rule holds in Favorites.
- **The map draws itself outwards and is meant to be watched doing it.** A line travels
  to a picture, the picture comes up *over a moment* rather than in one frame, and only
  after a pause do that picture's own lines set off — and they set off one at a time
  (`OUT_STAGGER_MS`), or the five leaving the middle would all go at once and five
  pictures would appear in the same instant, which is the one thing the spread must not
  do. `ROUTE_AFTER_MS`, `ROUTE_MS_PER_PX`, `LINK_DELAY_MS` and `OUT_STAGGER_MS` are the
  whole of its pace; it takes about four seconds to reach the bottom of the page. The
  flick is the exception and keeps its hard cuts: that is the film going past, not the
  map being drawn.
- **When each line sets off is worked out by going over the links until nothing changes**,
  not in one pass — a link's start depends on when the picture it leaves from was
  reached, and the links are not necessarily in an order where that is already known.
- **Links are planned once**, on the first layout, and later layouts (a resize, the fonts
  arriving) only move the lines that already exist. Rebuilding them throws away the
  elements that are mid-draw, which is what stopped any line at all from appearing the
  first time this was written.
- The scattered look comes from a **seeded** generator (`SEED`), reset at the top of
  every layout — so the arrangement is the same on every visit and doesn't rearrange
  itself when the window is resized, which would read as a fault rather than a design.
- **The buttons live inside `.sheet-head`, and the two views inside `.views`, and they
  have to.** Every direct child of `<body>` is given an opacity transition by the rule
  that dims the page behind the menu, and that rule outranks anything written for a new
  element — so anything loose in the page cannot be hidden without being seen fading
  away first, and its fades would be that rule's rather than its own. Wrapped, they are
  their own. This has now caught two features; expect it to catch the next one.
- The **search** at the top right is a placeholder, but a working one: it matches what a
  picture is called and dims everything that doesn't. The **dates** on the lines are
  random, generated from the same seed.
- **The category names itself small beside the Menu** (`.page-where`), since the page
  carries no title any more: a hairline rule and then the name, in the same mono as the
  rest of the chrome, arriving with it. The theories page carries the same mark
  (`.page-where`, written by `structure.js`). Both are hidden below 720px, where the
  buttons in the middle of the chrome reach back far enough to print over them.

**Favorites** (`favorites.js`) is the other view, and the other half of that file's job is
switching between the two — it owns the buttons, so it owns the switch.

- **The pictures are gone; it is a menu now.** The entries are the
  `<a class="gallery-entry">` blocks in the page, each carrying a `data-chapter` and a
  `data-date`. The chapters are the different `data-chapter` values **in the order they
  first appear**, so naming them and ordering them is an HTML edit.
- **The screen flickers once, and only once.** A panel being switched on catches, drops and
  settles; it is not the view arriving, it is the thing being turned on, so going away and
  coming back does not do it again. Two flickers is enough to read as one — more reads as a
  fault.
- **The date is what a favourite is filed under**, so it is set first in each row (after
  its number) and in the mono the rest of the site keeps for readings. It is also what the
  field's skyline is a reading of — see below.
- **Only the open chapter's tab is in the tab order**, and the arrow keys, Home and End move
  along the strip. The chapters you are not reading are `hidden`, not faded.
- **The two columns are set high and given room.** The plate on the left carries the open
  chapter large and then a small spec list under it (entries, first, last); the menu on the
  right is wide, with the tabs above and generous numbered rows below. The page is read
  from the top down and there is nothing above either of them, so neither is set low.
- **The field is a lattice over the whole page, and two things disturb it.** It is fine
  and close-set (`PITCH`, `MARK`) rather than large and far apart — it is a ruled ground
  for the writing to stand on, and the reading it carries is its top edge, which a coarse
  lattice can only step through. Every fifth mark each way (`EVERY`) is the site's own
  hollow registration square instead of a tick, so the grid counts itself the way a
  drawing's does.
  - **The writing keeps its own room.** The field is not drawn where the plate or the
    menu stands: both boxes are *measured* off the page (`clearing()`, re-read whenever a
    chapter is opened, since both change size with it) and marks inside them are dropped,
    fading back in over `CLEAR_SOFT` so the field thins towards the words rather than
    stopping at a line. It is read off where a mark actually *is*, so one shoved towards
    the words by the cursor is taken out too. A ground printed through the words on top
    of it is neither a ground nor words.
  - **The cursor**, which shoves the marks near it out of place and draws them larger; they
    find their way back when it goes. Make the lattice itself uneven and there is nothing
    left for the cursor to disturb.
  - **The open chapter**, which stands one **mound** in it per entry. What a mound changes
    is not where the marks are but **how many of them you can see**: the field's top edge
    is lifted, everything under it stays exactly where the lattice put it. Marks are not
    slid about by the reading, which leaves being slid about to the cursor alone. Pointing
    at an entry (or tabbing to it) raises the mound that is its and turns it brass.
  - A mound's height comes from the **day in its entry's own date**, so the skyline is a
    reading of what the chapter is filed under and no two chapters come out the same shape.
    Three mounds of one height is a pattern, not a reading.
- **The mounds stand in the clear column between the two pieces of writing**, and that
  column is *measured* off the page (`plate.right` → `menu.left`) rather than taken as a
  fraction of the width — that fraction is right at one window size and wrong at every
  other. The stylesheet keeps both columns narrow enough that there is always daylight
  between them to measure. Letting the mounds under the plate instead, each cut off at the
  writing above it, made every one of them the same capped height: a step across the page
  rather than a reading, and identical for every chapter.
- **`hotItem`, `drawing` and `remeasure` are declared above the part of the file that
  opens a chapter, not with the rest of the field's state.** A chapter is opened while the
  page is still being built, and opening one touches all three; left where they belong
  they do not exist yet at that moment and the whole view falls over before it has drawn
  anything. This has now bitten three times in this repository — most recently reaching
  for `width` from `show()` to re-measure the room the writing keeps, which is why that
  is a flag the next frame acts on rather than work done on the spot.
- **Without the script both views are simply on the page**, one under the other, and the
  entries are a plain list of links — everything reachable.

### Styling

`style.css` is the only stylesheet, in commented sections mirroring the page types. Six
design tokens at the top (`--bg`, `--bg-2`, `--line`, `--ink`, `--muted`, `--brass`) plus
`--sans` / `--mono`. The palette is **light** — near-white ground, near-black ink, one
brass accent; the README still describes an earlier near-black-background version, so
trust the CSS.

Any full-bleed dark region must carry the `dark-surface` class. `nav.js`'s cursor checks
what is under the pointer on every move and switches to a light colour over anything so
tagged; an untagged dark panel gets an invisible cursor. It falls back to computing
background luminance, but the class is the reliable path.

## Content conventions

- **New piece of work**: duplicate a template in `works/` — `example-gallery-work.html`
  for image-and-paragraph sequences, `example-article-work.html` for reference pieces —
  then add it to the relevant `categories/` page. There are three kinds of category page,
  and they take a new piece differently: the **row list** (`favorites`, the two `other`
  pages) takes another `<a class="work-row">` block; the **contact sheet**
  (`scent-descriptions`) takes another `<a class="sheet-frame">` block for the map, or a
  `<a class="gallery-entry">` block with a `data-chapter` and a `data-date` for its
  Favorites view; and the **structure** (`theories`) takes another `<a class="work-row">`
  block, which becomes a station of its own and lengthens the road — optionally with a
  `data-note`, a line about the piece that the station's card shows when it is clicked.
  Each page says which in the comment at the top of it.
- **New category**: duplicate any `categories/` page, change its `<h1>` and lede, add a
  line to `SITE_LINKS` in `nav.js`, and optionally add a `REAL_NODES` entry so it also
  appears in the map.
- Images live in `images/`, referenced from the `<img>` tags left commented out in the
  templates.
- `works/test-node-a.html` / `test-node-b.html` are sandbox pages reached from the two
  "Test node" entries in `REAL_NODES`; safe to repurpose or delete together.
- The HTML comments inside each template say which block to copy for another entry —
  they are the site's real documentation for its author. Keep them accurate when
  changing a template's structure.
- Placeholder content is still in place in several spots (`Your Name`,
  `you@example.com`, the lorem ipsum on slide 2, the `contact.html` social links). Don't
  "fix" these incidentally; they're the author's decisions to make.

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
| **the shockwave** | The narrow ring that closes on the centre ahead of the collapse, on its own faster clock (`WAVE_*` in `paper.js`). Distinct from the suction, which pulls everywhere at once. A second ring (`OUTWARD_*`) runs the other way at the same time, shoving the grid outward while everything else pulls in; `OUTWARD_STRENGTH = 0` removes it. |
| **the menu** | One menu for the whole site, built by `nav.js`: the same dark overlay, fading in the same way, on every page and on all three slides of the landing page. It briefly opened three different ways on the landing page (`mode-title` / `mode-side` / `mode-map`, in a `menu-modes.js` since deleted); "uniform" is the state the owner asked for and none of that is in the code any more. |
| **rank** / **ridge** | One of the copies of the chromatogram trace standing behind the front line, higher up the page and fainter, so the reading recedes like hills. `RIDGE_*` in `extras.js`. |
| **suction** | The even, proportional inward pull `paper.js` applies to the whole grid during the collapse, on top of the per-node dimples — what makes the grid implode rather than just dimple near the middle. |
| **the thread** | The single line running down all three slides, drawn by `thread.js`. |
| **the map** / **node map** | The 3D scene on slide 3 (`node-scene.js`). |
| **hub** / **the centre** | The origin `(0,0,0)` that every branch grows from; rendered as a dark `core` mesh inside two translucent `shell`s. |
| **link node** / **real node** | A clickable endpoint from `REAL_NODES`. A branch *stops* at one; nothing continues past it. |
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
| **preview** | The dark modal opened by a node carrying a `preview` field, instead of navigating. Its connector **arm** is that node's own branch traced out to the window; it lands on a **dock** at the modal's edge. A beat after it opens, the node's **name** is lifted out of the map and set above it. |
| **the structure** | The way `categories/theories.html` is laid out: a technical drawing in three dimensions — ribs, rails, a ruled spine and a swarm of particles — that you scroll *into*. `structure.js`. It replaced an earlier night-sky treatment ("the starfield"), and none of that is in the code any more. |
| **station** / **stop** / **constellation** | One theory in the structure — an assembly of particles with lines drawn between them, standing at its own depth, bracketed and named. The assembly is the click target. The owner calls these **constellations**; they are `stops` in `structure.js`. |
| **the set-out** | What clicking a station does: it comes out of the frame, turns as it comes, and its parts open out onto a ring on the window, with a scale ruled under it and the frame washed back behind. `OPEN_*` in `structure.js`. |
| **the card** | The preview written beside a set-out station (`.structure-card`) — its number, name, the page's own line about it, an optional `data-note`, the readings, and `OPEN →`. It lives inside the station's own link, so clicking it opens the theory. |
| **fixture** | An assembly that is only structure: unnamed, unbracketed, fainter, and deliberately not clickable. There to fill the frame and to make being bracketed mean something. |
| **the road** | The depth the stations are laid along, and the page height that scrolls down it (`.structure-road`). The swarm is endless; the road is not. |
| **the swarm** | The particles that are not part of any assembly. Their depth is wrapped both ways each frame, so the air is full going forward *and* going back. |
| **rib** / **rail** | The frame you travel through: ribs across the way at fixed depths, rails running the length of it between their corners. |
| **the spine** | The ruler drawn along the floor of the frame to the vanishing point, ticked at every whole depth. It is also the **wheel**: dragging it writes the page's own scroll, and pressing it goes on to the next station. |
| **the breath** | The structure's own slow creep: the eye drifts a little way in and back out again on a fixed cycle (`CREEP`, `CREEP_EVERY`), so the page is never quite still but the scroll is always the whole of where you are. |
| **carriage** | The gantry that runs down the frame towards you on its own clock, lighting each rib as it passes. |
| **traverse** | One of the streaks that run across the frame — the mechanical version of a falling star. |
| **chapter** | One grouping in Favorites — whatever an entry's `data-chapter` says. The chapters, their names and their order all come from the page. |
| **the field** | The lattice of marks behind the Favorites view. Regular on its own; disturbed by the cursor, and uncovered by the open chapter. |
| **mound** | One entry's share of the field's skyline — a soft rise in the field's top edge, as tall as the day in that entry's date. Pointing at the entry raises its mound. |
| **contact sheet** | The strip of every frame on a roll of film, printed together so you can pick one — and the way `categories/scent-descriptions.html` is laid out: `contact-sheet.js`. |
| **frame** | One picture on the contact sheet (`<a class="sheet-frame">`), square, and a link to the piece it belongs to. |
| **plate** | On the contact sheet: the frame it settles on and keeps at the top — the first one in the page. In Favorites it is also the name of the block on the left carrying the open chapter (`.chapters-plate`). Which one is meant follows from the view being talked about. |
| **the flick** | The pictures going past in the middle window, hard cuts, fast then slowing to a stop. It ends on the picture it keeps rather than cutting to it. `FLIP_*` in `contact-sheet.js`. |
| **link** / **route** | A line between two pictures on the sheet, at whatever angle they lie at, carrying a date. Every picture has at least one. |
| **view** | One of the two ways the contact sheet page shows a category: the **map** (Description portfolio) or **Favorites**. One at a time; `favorites.js` switches them. |
| **the ring** / **the orbit** | A circle of pictures standing in three dimensions round a big square, which is how Favorites was laid out before it became a menu of chapters. Nothing of it is in the code now — no `RING_*`, no `.gallery-face`, no `<button class="gallery-frame">`. If the owner uses the word, they mean that removed treatment. |
| **favourite** | One entry in Favorites (`<a class="gallery-entry">`), carrying a `data-chapter` and a `data-date`. |
| **work** | An individual piece, one page in `works/`. |
| **category** / **body of work** | A page in `categories/` listing works; also an entry in `SITE_LINKS`. |

## Maintaining this file

Keep this file current: when the `window` contract, the landing page's layer list, the
`node-scene.js` data lists, the content workflow, or the glossary changes, update the
matching section in the same commit.

`README.md` is a running changelog written for the site's author and has drifted in
several places (`__p23`'s owner, the palette, `DECORATIVE_POINTS`, and a section on
`menu-modes.js` and per-slide menus, which no longer exist). Prefer the code whenever
they disagree, and correct this file rather than trusting either.
