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
file, no credentials committed); and the contact sheet — the flick ending on the first
picture and leaving it where it was, the search matching a picture by name, every line
stopping just off the two pictures it joins, no line crossing a picture it is not
pointing at, no picture left with nothing joined to it, the pictures arriving one after
another rather than together, nothing shifting sideways when the page grows, the two
buttons arriving only once it has finished drawing itself, a frame keeping its number
once a real picture is put in it, the whole map being one network with no picture and no
island left out of it and no picture on the end of a single line, pointing at a picture
turning it in three dimensions without moving where it was laid out, nothing answering
the pointer until the sheet has settled, every line carrying a date with none of them
landing on a picture, and a date being written along its line rather than switched on;
and favorites —
switching views taking one away before the other arrives, the flick ending on the first,
the ring standing its pictures on one level line through the middle of the square and
reaching to both edges of the window, every picture having a face on both sides and being
wider than it is tall, pointing at one bringing it forward, the wheel being the only
thing
that turns it (the pointer and a drag both leaving it alone, and no drift of its own),
picking one fading rather than cutting, the whole view fitting on one screen, pointing at
the big square bringing up the name of what is in it, and nothing on it answering the
pointer until the flick has landed; and the survey — the country being grown from the
page's own rows with one mark per theory, each mark still a link to its piece and
reachable from the keyboard, a theory being a mark until it is pointed at and a name only
then, the ground being dark and saying so to the cursor, the list left in the page for a
reader and out of sight for a looker, turning it by hand and by the arrow keys, scrolling
bringing it closer, the whole of it fitting one screen, it standing still under
`prefers-reduced-motion` while still turning when asked, and the plain list coming back
when the script is blocked.

Several are regression tests for specific fixed bugs — the clipped connector SVG, the
flat NDC depth, the cursor's angle snap, arrow keys leaking behind the menu, the paper's
mask being dropped while still feathering, grain arriving along a moving edge, and the
reforming line both running across the slide-2 sentence and being visibly swapped out
for the thread. Keep them passing rather than adjusting them to match new behaviour,
unless the behaviour change is deliberate.

Visual/aesthetic judgement is still manual — the suite checks that things work, not that
they look right.

Two states are easy to forget when reviewing a change:

- **`prefers-reduced-motion: reduce`** — read by `landing.js`, `paper.js`, `thread.js`,
  `node-scene.js`, and `style.css`, each degrading to a still version. `nav.js` (the
  cursor) and `extras.js` do *not* currently check it; if you add motion there, add the
  guard too.
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
- Each branch has a `rootFlare` collar at its hub end, bridging a hair-thin tube and a
  sphere twenty-odd times its width so a branch reads as growing out of the centre
  rather than as a wire poked into a ball. Two things make that join disappear and it
  needs both: a **curved** profile (a `LatheGeometry` revolved from a fillet-shaped
  profile, not a cone — made too wide or too short it stops reading as a swelling and
  starts reading as a thorn), and a **colour ramp** stored per vertex, carrying the
  centre's own near-black at the sphere's surface up to the branch's grey over the next
  `ROOT_FLARE_BLEND`. That ramp is a *multiplier*, because the material's colour is
  already kept in step with the tube's, hover darkening included. The collar is straight,
  so `ROOT_FLARE_LENGTH` must stay inside the straight run each branch begins with
  (0.13 of its length, about 0.45 from the middle). It is pointed by
  `curve.getTangent(0)` and kept in sync with the tube's own emerge/weight/opacity every
  frame — don't hand-place or hand-animate it separately. One geometry is shared by all
  seven; only the material and the direction differ.
- `viewDepth(worldPos)` is the real per-node depth (0 near, 1 far), used for label
  opacity, z-index stacking, and the chromatogram's peak heights. Raw NDC
  `projected.z` looked plausible but was useless here — every node landed within 0.01 of
  the far end of its range for a scene this small this far from the camera's near/far
  planes — so don't reach for `projected.z` as a stand-in for depth anywhere in this file.

### The survey (`topo-map.js`) — categories/theories.html

That category is not a list of rows, and it is not an object standing in the middle of a
page either: the whole page **is** country. You are in it, a little above it, and it runs
out to a haze in every direction. The palette is turned over here and nowhere else — the
ground is nearly black and the contours on it are light.

Nothing about the ground is drawn by hand — it is **grown**, and the order of it is the
property to keep:

1. the sampling point is pushed about by a slow noise field first — the **domain warp**.
   This one step is most of what makes the lines read as country rather than as blobs: it
   bends whole regions sideways, so ridges run and valleys curve instead of every rise
   being a round lump.
2. octaves of noise are summed at wherever the point ended up, each one damped where the
   ground is already steep — a standing-in for **erosion**, which puts clean crests on the
   ridges and leaves the flats broad. `noised()` hands back the slope along with the
   height for exactly this, and it is nearly free because everything it needs has already
   been fetched.
3. every `.work-row` lifts a region into **high country**. It does not lay a cone on top:
   it raises the ground *and* scales the detail already on it, so a theory reads as a
   massif with its own texture rather than as a bump.
4. that is sampled onto a grid once (`SAMPLES`) and contoured once, **in map coordinates**
5. every frame, those contours are put through a camera

Swap that order and it stops being country: lifting the theories before the warp smears
them, warping each octave separately gives fuzz, and smooth cones on top give something
that reads as noise with hills in it.

Only step 5 happens more than once. The country is worked out at load and thereafter only
re-photographed, which is what makes a page this size turn at sixty frames a second.

Things worth knowing before changing it:

- **Add a theory and the country changes shape around it.** A new massif rises, the
  contours re-form round it and the interval in the title block is recalculated. Nothing
  is hand-placed; there is no list of positions to keep in step.
- **Marching squares is turned inside out here.** The squares are walked once and each is
  asked which heights cross it, rather than every height being walked across the whole
  grid. A square of gentle ground is crossed by one contour or none, so this does a
  couple of tests where the other way round does twenty-eight — the difference between a
  page that opens and one that hangs while it thinks.
- **The pieces of line are left loose** rather than joined into loops. Drawn one after
  another they read as the continuous contour they are. Each square's two saddle cases
  (5 and 10, where the corners alternate above and below) give back two pieces, not one.
- **The haze is drawn in bands of distance, not segment by segment.** A stroke can only
  carry one colour and setting a colour is the expensive part, so each contour is stroked
  once per band (`BANDS`) with the whole band's fade. Past `FINE_TO` only the index
  contours are drawn at all: every one of them out there is a grey wash, which is what
  distance does to a map anyway.
- **There is never an edge of the world on the screen.** `REACH` is generous and the haze
  is set to run out well inside it. If you push `HAZE_TO` out, push `REACH` with it.
- **Every z handed to the camera is scaled by `RELIEF`.**
- **`project()` hands back one shared object.** Two points in a row means copying the
  first one's numbers out before asking for the second.
- **A theory is a mark, not a caption.** It is drawn as the same hollow square with a dot
  in it that the site's cursor is, and what it is called is not written until you point at
  it. The marks are real links standing over the drawing, so they can be tabbed to and
  read out; `placeNames` moves each onto its own summit every frame, so nothing in the
  stylesheet may give `.survey-peak` a transform of its own.
- **A mark behind you or gone into the haze is taken off the page** (`.gone`,
  `display: none`) rather than faded to nothing — faded, it would still catch the pointer
  where there is nothing to point at.
- **The survey carries `dark-surface`**, which is how the rest of the site says "the
  cursor has to go light over this". Without it `nav.js` leaves a dark cursor on a dark
  page and it cannot be seen.
- **Anything visually hidden must have its margins taken off too.** The lede is taken out
  of sight with `clip-path`, and left with its own `margin-bottom` it put twenty-five
  pixels below the fold and gave a one-screen page something to scroll.
- The camera is eased towards where it has been asked to go rather than moved there, or
  the map reads as a slideshow of views instead of one place being walked round. Under
  `prefers-reduced-motion` the idle drift is off, but every other way of moving it works.

### The contact sheet (`contact-sheet.js`), and favorites (`favorites.js`)

One category page — `categories/scent-descriptions.html` — is laid out as a **contact
sheet** rather than as a list of rows. It carries **two views of the same category**, and
the two buttons above the middle window switch between them:

| button | view | file |
|---|---|---|
| Description portfolio | the map — every picture scattered, joined by dated lines | `contact-sheet.js` |
| Favorites | one big square with the rest of the pictures on a ring around it in three dimensions | `favorites.js` |

Neither file touches the other's elements. All they share is a class on `<body>`
(`view-favorites`), which `style.css` reads to take one view out of the page and put the
other in — and the switching itself lives in `favorites.js`, because it owns the buttons.
Only one view is ever on the page: the one being left fades away *first*, and the other
arrives after it, so the page never shows two different things at once.

The page opens white with one square window in the middle; every picture in the category
flicks through it on hard cuts, fast at first and slowing to a stop; it lands on the
first one, which stays exactly where it is; the three buttons above it and the category's
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
  inherit it. The Favorites view is left out of that fallback altogether
  (`body:not(.sheet-scripted) .gallery { display: none }`): its pictures are placed in
  three dimensions by `favorites.js` and its buttons do nothing on their own, so all it
  would add is a screen's worth of empty space under the sheet.
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

**Favorites** (`favorites.js`) is the other view, built out of the same pieces:

- **The pictures are the `<button class="gallery-frame">` blocks in the page**, named
  `f1`, `f2`… in the same corner chip the sheet's frames use.
- Arriving, the big square **flicks** through them exactly as the sheet does — the same
  accelerating-hold run, arranged to *end* on the first rather than cut to it — and the
  rest then take their places on the ring.
- **The ring goes round the big square in three dimensions**, so its near side passes in
  front of the square and its far side behind it. One `perspective` on `.gallery-scene`,
  one `transform-style: preserve-3d` on `.gallery-space` inside it, and the browser sorts
  out what is in front of what. Nothing between the space and a picture may flatten that
  — an `overflow`, an `opacity` or a `filter` anywhere down the chain ends the 3D space
  and the ring goes back to being a circle drawn on the page.
- **Nothing turns the space itself; each picture is placed.** It is moved to its own
  point on the ring and then turned about the upright only —
  `translate3d(x, 0, z) rotateY(its angle)` — so every picture stands upright. Turning
  the space instead leans them all over with it, and a leaning square is drawn as a
  sheared parallelogram: it reads as a mistake rather than as a photograph standing in
  space.
- **The ring is level, and the y in that transform is exactly zero.** Every picture then
  lands on one horizontal line across the page however far round it has come. Nearly zero
  is not the same thing: a picture standing even slightly off eye height is thrown further
  from the middle of the page the nearer it is, so the line bows.
- **The ring and the square are concentric**, so that line runs through the middle of the
  picture and the ring reaches the same distance out on either side of it. One
  consequence to know about: the picture at the front of the ring stands over the middle
  of the big square and takes the pointer there, so pointing at the very centre of the
  square is pointing at that picture, not at the square.
- **The view is the whole screen, not a panel on a page.** `.gallery` is full width with
  no gutters and `.gallery-scene` is `100vh` less the strip `.views` reserves for the
  buttons, so the page is exactly one screen tall with nothing to scroll to. The ring is
  then as wide as the page will take (`width / 2` less room for the widest picture), and
  only falls back to a fixed share of the square (`RING_REACH`) when that would put it
  inside the square. The perspective is long (1800px) to match: at a shorter focal length
  a ring this wide draws the nearest picture at twice the size of the far ones, which
  reads as two different sets of pictures rather than as one ring turning.
- **Every picture is a card with a face on each side**, both carrying the same picture
  (`buildFaces`). A picture faces outwards from the middle, so the far half of the ring
  is showing you its back; one-sided panels leave that half blank. The two faces are held
  a fraction apart in depth, or they fight over which is in front and the card flickers.
- **A card is wider than it is tall** (`RING_WIDE`). It is the one place on the site where
  a picture is not square: a card on the ring is nearly always seen at an angle, and
  squared up it reads as narrower than it is.
- **Pointing at one brings it forward**: it grows a little, comes out from under the wash
  that places it in the ring, and takes the darker edge the chosen one carries. No shade
  drawn across it and no name written on it — they are small, there are a lot of them and
  they go past, and anything heavier made the ring twitch rather than read. The growing
  is written on the **face**, not on the card: the card's own transform is rewritten every
  frame by `placeRing`, so anything added to it would be replaced before it could ease
  into place. Nothing rewrites the face's, so `--pick` can be changed from the stylesheet
  and eased. The wash needs a second variable for the same reason — `--dim` is written on
  the element every frame and outranks any rule, so `--veil` is the stylesheet's own hold
  over it and `opacity` is `calc(var(--dim) * var(--veil))`.
- **The far side is washed out** towards the colour of the page (`--dim`, `DIM_FAR`), on
  top of perspective already drawing it smaller. It is a veil laid *over* the picture
  rather than the picture's own `opacity`, because anything transparent in that chain
  would flatten the card and take its far face's hiding with it.
- **The wheel is the only thing that turns it.** Anticlockwise seen from above — which is
  the near side of the ring travelling to the right (`SCROLL_TURN`; positive `rotateY`
  carries the near side to `+x`) — and what is left of a turn runs itself down
  (`SPIN_DRAG`). It has no drift of its own, it does not lean towards the pointer, and
  dragging does nothing: where a picture is standing is something you set, not something
  that keeps changing under your hand. Clicking one turns the ring the short way round
  until that picture is at the front.
- **Picking one fades it into the big square** — the square is two layers, and showing a
  picture paints the one underneath and fades it up. The flick asks for cuts instead and
  gets them by turning that fade off (`.no-fade`). A cut is the film going past; a fade
  is you choosing something; they must not look the same.
- **Pointing at the big square darkens its bottom right corner and brings up what it is
  called** — a wedge kept tight to that corner, so it reads as a shadow under the name
  rather than as the picture being darkened. That is the only place a name is written in
  this view: the description under the ring was taken out so the whole thing fits on one
  screen without scrolling, which is also why the square and the ring are sized against
  the window's *height* as well as its width. And as on the sheet, none of it is live
  until the flick has landed — the square's name and the ring's own answer to the pointer
  alike: every rule is written under `.gallery.landed`.

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
  `<button class="gallery-frame">` block for its Favorites view; and the **survey**
  (`theories`) takes another `<a class="work-row">` block, which raises a hill of its own
  in the country. Each page says which in the comment at the top of it.
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
| **root flare** / **collar** | The short curved swelling at a branch's hub end (`ROOT_FLARE_*`), widening the tube where it meets the sphere and taking the sphere's own colour there, so the branch grows out of the centre instead of being poked into it. |
| **wake** / **wake speck** | The specks strung along a branch, sampled off its own curve. Each speck is 9 stacked particles that spray apart when pointed at. |
| **cloud** | The separate drifting background speck system. Currently off (`CLOUD_COUNT = 0`) but still wired up. |
| **registration mark** | The hollow square marker used for node labels, reused for the preview's dock and the scroll cue — not a plain dot. |
| **emerge** | A branch's 0→1 growth out from the centre on arrival, staggered per branch (`EMERGE_STAGGER`). |
| **arrival** | The eased follow of `window.__p23`; drives the scene's opacity and every branch's `emerge`. Held where it is for as long as `__exit` is set — see the sphere riding out under **the collapse**. |
| **corrugation** | The sharp zigzag the cursor drags across a nearby branch (`CORR_*`): evenly spaced teeth of one size travelling steadily outward along it, so it reads as a regular wave excited in a wire. Only its height answers the cursor. It used to re-roll its height and spacing several times a second, which read as jitter — that was replaced, deliberately, by the pattern described here. |
| **sway** | Per-branch independent drift. Currently disabled (`SWAY = 0`), machinery intact. |
| **preview** | The dark modal opened by a node carrying a `preview` field, instead of navigating. Its connector **arm** is that node's own branch traced out to the window; it lands on a **dock** at the modal's edge. A beat after it opens, the node's **name** is lifted out of the map and set above it. |
| **the survey** / **the country** | The way `categories/theories.html` is laid out: a whole page of contoured ground in three dimensions, dark, running out to a haze, with one mark on it per theory. `topo-map.js`. |
| **mark** | One theory on the survey — a hollow square with a dot in it, standing on the high country grown from that theory's row. It says what it is only while you point at it. |
| **massif** | The high country a theory raises: the ground lifted *and* roughened around its point, rather than a smooth cone laid on top of it. |
| **the haze** | The distance fading the country out before it ever reaches the horizon, so there is never an edge of the world on the screen. `HAZE_FROM` / `HAZE_TO`, drawn a band at a time. |
| **contour** / **index contour** | A line of constant height on the survey. Every fifth one is an index contour: drawn heavier and numbered along its length. |
| **spot height** | A loose reading printed on the open ground between contours, away from the lines that were drawn from them. |
| **title block** | The ruled-off corner of the survey carrying what the sheet is, how many hills are on it, the contour interval and how to read it — a map's cartouche. |
| **contact sheet** | The strip of every frame on a roll of film, printed together so you can pick one — and the way `categories/scent-descriptions.html` is laid out: `contact-sheet.js`. |
| **frame** | One picture on the contact sheet (`<a class="sheet-frame">`), square, and a link to the piece it belongs to. |
| **plate** | The frame the sheet settles on and keeps at the top — the first one in the page. |
| **the flick** | The pictures going past in the middle window, hard cuts, fast then slowing to a stop. It ends on the picture it keeps rather than cutting to it. `FLIP_*` in `contact-sheet.js`. |
| **link** / **route** | A line between two pictures on the sheet, at whatever angle they lie at, carrying a date. Every picture has at least one. |
| **view** | One of the two ways the contact sheet page shows a category: the **map** (Description portfolio) or **Favorites**. One at a time; `favorites.js` switches them. |
| **the ring** / **the orbit** | The circle of pictures going round the big square in Favorites, standing level in three dimensions so all of them sit on one horizontal line, the near side passing in front of the square and the far side behind. Turned by the scroll wheel and by nothing else. `RING_*` in `favorites.js`. |
| **face** | One side of a picture on the ring (`.gallery-face`). Each has two, carrying the same picture, so it is there from either side — and the face, not the card, is what answers the pointer. |
| **favourite** / **f(n)** | One picture in Favorites (`<button class="gallery-frame">`), named f1, f2… in its corner. |
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
