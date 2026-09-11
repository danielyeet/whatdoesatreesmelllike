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
file, no credentials committed).

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
  and `tests/leaving-the-map.spec.js` guards it. It also fades the title block ("A
  portfolio / 2026 edition") out and back in with the scroll position between slides 1
  and 2 — which means first clearing the `rise` keyframe animation that otherwise
  outranks it, once that animation has finished playing.
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
- If `THREE` is undefined the scene replaces itself with a plain list of `REAL_NODES`
  links. Keep that fallback working when editing the top of the file.
- The `TUNING` block near the top holds every magic number (`IDLE_SPEED`, `FRAME_V` /
  `FRAME_H` — larger values draw the map *smaller* — `BRANCH_RADIUS`, `SPECK_SIZE`,
  `REF_PX_PER_UNIT`, `ROOT_FLARE_RADIUS`/`ROOT_FLARE_LENGTH`, and the wake / cloud /
  corrugation groups). Tune there, not inline. Several systems are dialled to zero but
  left wired up (`SWAY = 0`, `CLOUD_COUNT = 0`); bring them back by raising the number
  rather than rebuilding the machinery.
- Each branch has a short tapered `rootFlare` mesh bridging its thin tube radius up to
  something the core's halo can absorb, so it reads as growing out of the centre rather
  than as a wire poked into a ball. It's derived from the branch's curve (built off
  `curve.getTangent(0)`) and kept in sync with the tube's own emerge/weight/opacity every
  frame — don't hand-place or hand-animate it separately.
- `viewDepth(worldPos)` is the real per-node depth (0 near, 1 far), used for label
  opacity, z-index stacking, and the chromatogram's peak heights. Raw NDC
  `projected.z` looked plausible but was useless here — every node landed within 0.01 of
  the far end of its range for a scene this small this far from the camera's near/far
  planes — so don't reach for `projected.z` as a stand-in for depth anywhere in this file.

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
  then add an `<a class="work-row">` block to the relevant `categories/` page, copying
  the pattern in `categories/scent-descriptions.html` (the only filled-in category).
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
| **the collapse** / **exit** | Leaving the map going 3 → 2. `landing.js` holds the page still, runs `__exit` 0→1 (a shockwave crosses, the map falls into its centre, everything clears to **white**), then `__reform` 0→1 (an ink line draws from the sphere to the top), and only then scrolls. The reforming line stops below the slide-2 sentence, landing on the same point the downward leg leaves from. |
| **the wake** | Only the specks along a branch now — see **wake / wake speck** below. The paper's arrival going 2 → 3 used to be shaped as a duck's wake (a V trailing back from the middle of the page, `WAKE_HALF_ANGLE`); that was replaced by the top-down wipe described under **curtain**, and neither the V nor `WAKE_HALF_ANGLE` exists in `paper.js` any more. |
| **the shockwave** | The narrow ring that closes on the centre ahead of the collapse, on its own faster clock (`WAVE_*` in `paper.js`). Distinct from the suction, which pulls everywhere at once. |
| **the menu** | One menu for the whole site, built by `nav.js`: the same dark overlay, fading in the same way, on every page and on all three slides of the landing page. It briefly opened three different ways on the landing page (`mode-title` / `mode-side` / `mode-map`, in a `menu-modes.js` since deleted); "uniform" is the state the owner asked for and none of that is in the code any more. |
| **rank** / **ridge** | One of the copies of the chromatogram trace standing behind the front line, higher up the page and fainter, so the reading recedes like hills. `RIDGE_*` in `extras.js`. |
| **suction** | The even, proportional inward pull `paper.js` applies to the whole grid during the collapse, on top of the per-node dimples — what makes the grid implode rather than just dimple near the middle. |
| **the thread** | The single line running down all three slides, drawn by `thread.js`. |
| **the map** / **node map** | The 3D scene on slide 3 (`node-scene.js`). |
| **hub** / **the centre** | The origin `(0,0,0)` that every branch grows from; rendered as a dark `core` mesh inside two translucent `shell`s. |
| **link node** / **real node** | A clickable endpoint from `REAL_NODES`. A branch *stops* at one; nothing continues past it. |
| **branch** | The tube from hub to a link node — a `CatmullRomCurve3` that leaves the hub radially, then bows through two waypoints. Tubes, not lines, so they can thicken on hover. |
| **waypoint** | The two small dots along a branch (at t ≈ 0.32 and 0.69), derived from the node's position, not placed by hand. |
| **root flare** / **collar** | The short tapered mesh at a branch's hub end, blending its thin tube radius into the core's halo instead of poking into it as a wire. |
| **wake** / **wake speck** | The specks strung along a branch, sampled off its own curve. Each speck is 9 stacked particles that spray apart when pointed at. |
| **cloud** | The separate drifting background speck system. Currently off (`CLOUD_COUNT = 0`) but still wired up. |
| **registration mark** | The hollow square marker used for node labels, reused for the preview's dock and the scroll cue — not a plain dot. |
| **emerge** | A branch's 0→1 growth out from the centre on arrival, staggered per branch (`EMERGE_STAGGER`). |
| **arrival** | The eased follow of `window.__p23`; drives the scene's opacity and every branch's `emerge`. |
| **corrugation** | The sharp zigzag the cursor drags across a nearby branch (`CORR_*`), re-rolled several times a second so it reads as jitter, not a travelling wave. |
| **sway** | Per-branch independent drift. Currently disabled (`SWAY = 0`), machinery intact. |
| **preview** | The dark modal opened by a node carrying a `preview` field, instead of navigating. Its connector **arm** is that node's own branch traced out to the window; it lands on a **dock** at the modal's edge. |
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
