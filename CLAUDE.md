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

## Every page, and what draws it

Start here. Each page is standalone, loads `nav.js` for the shared menu and cursor, and
then loads whatever draws *that* page — nothing else. No page script knows about any
other, and none of them share state (the one exception is the landing page's six layers,
which talk through five `window` globals; see the table further down).

| page | what it is | scripts it loads beyond `nav.js` |
|---|---|---|
| `index.html` | three scroll-snapped **slides**: the title, the italic line, the 3D **node map** | `landing.js`, `node-scene.js`, `paper.js`, `thread.js`, `extras.js` (and Three.js from a CDN — the only page that uses it) |
| `categories/scent-descriptions.html` | two **views** of one category: the **houses** — a **contact sheet** of pictures scattered and joined by dated lines, all of it drawn in specks — and the **individual fragrances**, an **index** of every fragrance written up on the site | `contact-sheet.js`, `index-page.js`, `views.js` |
| `categories/theories.html` | the **structure**: a technical drawing in three dimensions you scroll *into* | `structure.js` |
| `categories/favorites.html` | the **chamber**: two injectors firing particle streams into a tilted **orbit** round the word FAVOURITES, which opens into a menu | `chamber.js` |
| `categories/researches.html` | the **researches**: an **index** — readings across the top, plates on the right, and a sortable, searchable table in the bottom left | `index-page.js` |
| `categories/other-2.html` | a plain **row list** of works | none |
| `works/pineward.html` | **Pineward**, the first house in Scent descriptions: an introduction and 54 compacted parts — one per fragrance — in four forest **strata**, with a **wood** grown down both margins and a ticked **trunk** | `pineward.js` |
| `works/adar.html` | **ADAR**, the second house: eleven fragrances in four groups, standing on a **void** — a hole in the window with soundings ringing out from it — and counted off by a **sounding** down the side | `adar.js` |
| `works/theory-01.html`, `-02`, `-03`, `works/resins-in-perfumery.html` | the **essay pages**: a long piece of writing on the theories drawing's ground, with a **rule** down the left — one tick per section, filled in as far as you have read | `essay.js` |
| `works/*.html` | the other individual pieces — two templates and two sandbox pages | none |
| `contact.html` | a plain page | none |

Four of those page scripts are elaborate, and there is a long section below for each
drawing: `node-scene.js` (~1,450 lines), `chamber.js` (~1,460), `structure.js` (~1,346)
and `contact-sheet.js` (~1,000). The small ones have short sections of their own:
`pineward.js` (~490), `adar.js` (~370), `essay.js` (~320), `index-page.js` (~240) and
`views.js` (~85). **Read the matching section before editing one of them.** Each records decisions that were arrived at by
trial and error and specific bugs the owner reported and that were fixed — several of
them more than once, because the fix was later undone by someone who didn't know why it
was there. The sections are written to stop that happening again, so a line that says
"this used to be X and X was wrong" is load-bearing, not history.

Three of the pages replace their own markup with a drawing, and all three hold that
markup back on the way in with the **`js-coming`** class so the plain version is never
flashed first — see the glossary entry. All three also leave that plain version working
when the script is blocked, and there is a test for each.

## Running it

Serve over HTTP rather than opening files directly — pages use relative asset paths and
pointer machinery (`document.elementFromPoint`) that misbehaves on `file://`:

```bash
python3 -m http.server 8000    # then open http://localhost:8000/
npm run serve                  # the same thing on port 8123
```

Pick a port that is **not 4321**: that is the one the test suite starts its own server
on, and a stray server sitting on it makes the whole suite fail (see Tests below).

There is no build or lint step, so nothing catches a mistake before the browser does —
open the console after any change to a drawing.

`node-scene.js` is the one to be most careful with, and it is the **only** file here
that uses a WebGL shader (a small program that runs on the graphics card; both of its
particle systems need one, because the stock Three.js points material cannot give each
speck its own size and opacity). A shader that fails to compile takes the whole 3D scene
with it, so the map comes up **blank rather than merely wrong** — and blank looks like a
loading failure, not like a bug you introduced. The other drawings (`paper.js`,
`thread.js`, `structure.js`, `chamber.js`, `contact-sheet.js`, `pineward.js`) are plain
canvas, SVG and DOM with no shader anywhere, so they fail visibly instead.

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

**A clean run is 147 passed, 0 failed, and takes seven to nine minutes.** If you get a
number wildly different from that, check the shape of the failures before believing
them: **a hundred-odd tests all failing in about 300ms each means the web server is
down, not that the site is broken.** The config serves on **port 4321** and reuses a
server already sitting there, so a stray `python3 -m http.server 4321` left over from a
killed run — or anything else holding that port — poisons every browser test while the
four browserless `repository.spec.js` checks still pass. Clear it, confirm the port is free, and run
again. (This has happened; don't spend the time diagnosing it twice.)

Two traps when clearing it: `pkill -f http.server` **matches its own command line** and
kills the shell running it before it kills anything else — write the pattern as
`pkill -f "[h]ttp.server"`. And killing a Playwright run does not always take its server
with it, which is how the stray gets there in the first place, so check with
`pgrep -af "[h]ttp.server"` afterwards rather than assuming.

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
island left out of it and no picture on the end of a single line, a picture being ruled with specks only where the map is tied on to it, a line between
two pictures being a run of specks rather than a stroke, a line arriving slack and being
pulled taut, the page opening on the picture it will land on and holding it, the specks standing still when the page is scrolled and
travelling with the page rather than the window, nothing on the sheet answering the
pointer at all, the category naming itself only once the page has drawn itself, every
line carrying a date with none of them
landing on a picture, and a date being written along its line rather than switched on, the page never
showing its own contents before the sheet takes over and the pictures being placed rather
than slid in, the pictures running in order down the page,
and the plain grid still being there when the script is blocked;
and the two views of that category — the buttons being named Houses and Individual
fragrances, one view being taken away before the other arrives (watched every frame),
the index's headings sorting by their own column and turning round when pressed again,
a row keeping its own number whatever the table is sorted by, the field above searching
it, the headings staying put while the rows scroll under them, the whole index coming
out on one screen however many rows are in it, and the table still being the table with
its script blocked;
and the researches — the table being numbered, titled and dated, and the first research
opening a page that is really there;
and ADAR — the house being eleven fragrances in four groups numbered straight through, a
fragrance being a title until it is opened and the owner's own writing once it is, the
sounding counting them off as they are passed, the void being a hole with nothing at all
drawn inside it, no part of the page being drawn in the site's accent colour, it standing
still under `prefers-reduced-motion`, all of its writing being there without its script,
and the sheet's second picture pointing at it;
and the essay pages — the rule being built from the piece's own sections and naming them
without their numbers, every tick being a link to its own section, the reading being the
scroll and not drifting while nothing is touched, travelling back giving exactly the
drawing you left, the field standing still under `prefers-reduced-motion`, all of the
writing being there without the script, and the theories and the researches reaching
their own pieces;
and Pineward — the piece being an introduction and fifty-two parts in four strata of
thirteen, numbered straight through, a part being a title and a small picture until it is
opened and its picture and writing once it is, the trunk carrying one tick per part with
the reading counting what has been passed and letting go again on the way back up, the wood
running the length of the piece and being grown when the page opens, it idling where it
stands and blooming under the hand, the piece being simply
there with animation turned off, all of its writing being there without its script, and
the sheet's first picture pointing at it;
and the chamber — the menu being grown from that page's own favourites and carrying
what the sheet's Favorites menu carries (number, date, name and link), the word opening
the menu and a chapter opening its own favourites with Escape stepping back out one level
at a time, the two injectors standing at opposite corners with nothing fired from the
other two, the orbit standing round the
word and running on behind it unbroken with its near rim drawn over it, opening the menu
widening that same orbit rather than replacing it and passing in front of the menu, the
menu being a fixed length whatever is in it, the word
travelling to its place on that step rather than jumping there (watched every frame,
through both halves of it), the orbit
turning on open and closed alike, pointing at a row swelling the orbit level with it with
nothing run out across the page and drawing that row's own rule back, the word saying what pressing it does
and saying the
other thing once it is open, the cursor stringing a web between the specks it is near and
letting go again, no part of it ever being drawn in the site's accent colour, it
standing still under `prefers-reduced-motion`, and the plain list coming back when the
script is blocked;
and the structure — the drawing setting itself up when the page opens without ever
showing the plain list it replaces, it being grown from the page's own rows with one
station per theory,
the travel being the page's own scroll down a road several screens long, going further in
bringing new stations up and leaving the ones behind you off the page, travelling *back*
filling the air again as many times as you like, travelling back also coming all the way
back to the beginning after the page has been left alone, the reading holding still
wherever you stop, the spine working as a wheel
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
  `node-scene.js`, `contact-sheet.js`, `structure.js`, `chamber.js`, `pineward.js`,
  `adar.js`, `essay.js`, `index-page.js` (its drawn plate) and `style.css`,
  each degrading to a still version. `nav.js` (the cursor), `extras.js` and `views.js`
  (which only shortens its fade to nothing) do *not* check it beyond that; if you add
  motion there, add the guard too.
- **Portrait / narrow viewport** — `resize()` in `node-scene.js` works the camera's
  distance out as `Math.max(FRAME_V / halfFov, frameH / (halfFov * aspect))`. In portrait
  `aspect` is below 1, so dividing by it makes the horizontal term much the larger of the
  two and pulls the camera well back — which is what draws the map smaller there and
  keeps the left and right link nodes on screen and tappable. `frameH` itself is **4.6**
  when `aspect < 1` rather than `FRAME_H`'s 4.9, i.e. slightly *smaller*, which takes a
  little of that back; don't read it as the thing doing the shrinking. Vertical swipes
  must keep scrolling the page; only horizontal drags rotate the map.

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
| `__mapReadout` | `node-scene.js`, per frame (node positions/depth, `hubX`/`hubY` in viewport coords, `activeIndex`, `previewOpen`, `collapse`) | `extras.js` (the trace), `paper.js` (freezing grain behind a preview; aiming the collapse), `thread.js` (its `collapse`, and the hub to draw the reforming line from) |
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

About 1,450 lines. It was for a long time the only large file here; `chamber.js` (~1,445)
and `structure.js` (~1,346) have since caught up with it, so "the complicated one" is no
longer a useful way to refer to it. `REAL_NODES` at the top is the intended edit surface;
everything below is graphics code.

- **`REAL_NODES`** — the clickable endpoints: `label`, `sub`, `href`, `pos: [x, y, z]`,
  plus `preview: { description }`. **Every one of the seven carries a preview now** — the
  owner asked for all the nodes to open a window and not only Scent descriptions and
  Theories — so a click on any of them opens the window rather than navigating. The
  field is still optional as far as the code is concerned: a node without one simply
  follows its link, which is the behaviour to keep working if a new node is added
  without writing a line for it. Positions are a Fibonacci sphere. There
  are seven of them, standing 3.0–3.5 from the origin; keep a new one in that range, and
  keep `y` clear of 0 — a node near the equator sweeps across the middle of the screen on
  every rotation, dragging its label through the centre. (The closest any of the seven
  comes is |y| = 0.93.)

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
- **The reading is the scroll, not the eye.** The percentage in the corner is worked out
  from `travel` — where the scroll has brought you — and not from `eye`, which also
  carries the breath. A number that ticks up and down on its own while nothing is being
  touched reads as drift however small it is; the drawing may move, the reading may not.
  That was a reported bug too.
- **The page sets itself up when it opens** (`INTRO_*`, `built`): the rails shoot out to
  the vanishing point, the ribs come up out of the depth one after another towards you,
  the rule writes itself along the floor, the air fills, the stations come up, and the
  corner sights snap in last. `built` runs 0→1 off the wall clock (not off frames, so it
  takes the same moment on any machine) and every drawing function reads it. Under
  `prefers-reduced-motion` it starts at 1 — there is nothing to watch being set up. The
  chrome comes with it: `structure.js` adds `lit` to the shell when the opening is over
  and the stylesheet fades the readout, the category mark and the cue in on that.
- **The page's own markup is never shown on the way in.** `theories.html` carries a line
  in its `<head>` that marks the document `js-coming`, which paints the ground dark and
  holds the plain list out of sight; `structure.js` clears it the moment the drawing is on
  the page. Without it the browser paints the light page with its heading and rows first
  and then has it replaced, which is a flash of a different page in front of the opening.
  It clears itself on `window.load` as well, so a blocked or broken script still leaves
  the plain list as the page rather than hiding it for good — which is what
  `tests/structure.spec.js` checks.
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
  passes, and **traverses** streak across it on **random bearings**. Each is given a
  direction anywhere round the circle, started off the frame on the far side of that
  direction and run until both its head and its tail are outside the box; they used to
  go only straight across or straight down, which read as a grid being drawn rather than
  as falling stars, and the owner asked for them in random directions. Under `prefers-reduced-motion` none of it
  moves: the clock stops, so the wobble, the beads, the ranging squares and the traverses
  are all gone and the carriage simply stands where it is — held still rather than
  switched off.
  The carriage makes **one pass every `CARRIAGE_EVERY` seconds** and is not drawn at all
  in between. Its place is worked out from the clock rather than stepped along frame by
  frame, so the rest between passes is one number to change; `CARRIAGE_FIRST` keeps it
  away until the drawing has finished setting itself up. The owner has tuned this twice:
  from the four-and-a-bit seconds it originally ran at, out to ten, and then back in by
  half again to its present rate.
  A faint **scan** used to pass down the whole window every nine seconds. The owner asked
  for it gone; it was removed outright rather than left switched off, so there is no
  `SCAN_*` and no `drawScan()` any more.
- **Glows are stamped, not generated.** One radial gradient is drawn once into a small
  offscreen canvas per colour and then `drawImage`d wherever a glow is needed. Asking for
  a fresh `createRadialGradient` per speck per frame is the one thing that will not hold
  sixty frames a second here.
- **A grain tile is laid over the whole drawing.** It is not texture for its own sake: a
  wide, shallow vignette over a near-black ground comes out in visible steps, and
  something uneven laid over it is what breaks them.

### The chamber (`chamber.js`) — categories/favorites.html

The main menu's **Favorites** category is a **chamber**: two injectors, at opposite
corners of the window — top right and bottom left — firing a fine stream of particles at
a slant across it on white. What the streams join is an **orbit** — tilted well off square to the window, so it
reads as a lens rather than as a circle drawn on the page, and a **disc** rather than a
ring: every particle stands a little way in or out of the orbit's own line (`DISC`), so
what gathers is a band with a thickness to it. It is the theories drawing's
world turned inside out — the same particles and the same instrument marks, printed as ink
on white instead of white on near-black — except that this one spends no accent at all:
it is ink on white and nothing else.

The contact sheet page used to carry the same kind of menu in a different shape — the
**register**, its Favorites view. That has been removed; this is the only place on the
site the chapters and their favourites are now.

**There is only ever one arrangement here, and the whole of the interaction is that one
arrangement changing size.**

- **Closed**, the word **FAVOURITES** stands alone in the middle of the orbit and the orbit
  turns round it. That word is the whole of the page's chrome, and it is the button — so
  it is dressed as one: four **crop marks** bracket it and a small boxed **cue** under it
  says `EXPAND`, with a chevron pointing the way it will go. Without those it read as a
  heading somebody had centred rather than as something to press.
- **Open**, pressing the word **widens the orbit** until it stands clear round the menu,
  which opens out of the word as it goes (the cue now reading `COLLAPSE`, its chevron
  turned over). It never stops turning. The chapters stand in the column first; opening
  one puts its own favourites in the same column in their place, with a way back. Escape
  steps out one level at a time, and a press anywhere off the writing closes it.

The open state **used to be something else entirely**: the particles were thrown out to
the borders of the window and held there as a rectangle. That put two different things on
one page with a costly step between them, and the step was the most awkward moment on it.
One thing that grows is smooth in both directions for the same reason — there is no
`EDGE`, no seat and no border in this file any more. The step itself is a **timed ramp**
eased flat at both ends (`OPEN_MS`, 2.2s), not an exponential chase: a chase starts at its
fastest and creeps at the end. It has been lengthened twice — 1.7s, 1.9s, 2.2s — because
the owner has asked for it smoother twice, and there is nothing uneven left in the drawing
to fix: measured, every frame of the step comes in at 16.7ms and none over 20, so time is
what is left to give it.

Five things make that step one movement rather than several, and each of them was once
the thing that made it read as a lurch:

- **NOTHING THAT ARRIVES MAY CHANGE THE SIZE OF THE PLATE.** The menu hangs out of the
  flow (`position: absolute` on `.chamber-panel`, under the word), and what centres the
  word and the menu together is `--menu-lift` — how far `.chamber-plate` stands above the
  middle of the window, measured by `chamber.js` off the laid-out boxes and eased by the
  stylesheet on the step's own curve. The menu used to be a second thing in the plate's
  own stack, so the frame it went on to the page the box grew by the whole height of it
  and the word was **shoved 143 pixels up the window in that one frame**, before any of
  the easing had begun — and the same in reverse when the menu was taken off the page
  again. That was a reported bug: *"the word expand blinks to a position above it and then
  only is a smooth animation played"*. `tests/chamber.spec.js` now watches the word every
  frame through both halves of the step and fails on any jump.
  Three things about the lift are easy to undo. It is measured off the MENU alone — its
  own height plus the gap under the word — and not off the plate's laid-out box, which
  the menu's own arrival shifts by a few pixels as it fades: a target that keeps moving
  restarts the easing under itself every frame, and the plate was still short of its
  place a second after the step had finished. It is written to the page **once per
  step**, when the menu opens or closes, and never again while that step is running:
  re-measuring mid-step is the same moving target by another route, and on a screen
  whose pixels are not whole numbers it came out a fraction different every frame, so
  the word crept up and down by a pixel the whole way. That was a reported bug — *"the
  word favorites (and its corresponding menu) seems to blink up and down whenever you
  expand and collapse"* — and it is why the reading is taken in fractions of a pixel
  rather than from the whole-number `offsetTop` / `offsetHeight` it used to use. And the
  menu is a **fixed length** (`height` on `.chamber-panel`, with `max-height` in `svh`
  behind it for a short window), so a chapter of three favourites and a chapter of
  thirty stand the word in exactly the same place and the column scrolls inside the
  panel instead. The owner asked for that outright, having more than ten favourites in
  mind; it also means the lift is one number rather than a different one at every level
  of the menu. `tests/chamber.spec.js` clones thirty rows into an open chapter and
  checks the panel's box does not change.

- **The drawing and the writing travel on ONE curve.** `--chamber-step` and
  `--chamber-step-ms` in `style.css` are the whole of it, and `chamber.js` solves that
  same cubic bezier itself (`easing()`, `STEP_EASE`) rather than easing on one of its
  own. They used to share only the *length*: the orbit on a symmetrical S and the word on
  the site's `--menu-ease`, which sets off quicker and has a longer tail, so over the same
  1.7s the two set off at different speeds and arrived at different moments. Change either
  number in the stylesheet and change `OPEN_MS` / `STEP_EASE` with it. The curve is
  deliberately gentle: the steeper standard curves cover half the step in a quarter of its
  length, which on a movement this big is a surge and then a wait.
- **What the orbit is holding is CARRIED out with it, not dragged.** As the orbit widens,
  every particle it has hold of is moved out by however far the orbit itself moved that
  frame (`grew`, `carried` in `move()`), in proportion to how firmly it is held. Leaving
  that to the radial spring instead is what the step used to be, and a spring stiff enough
  to catch a particle arriving at speed is far too stiff to move one gently: measured, the
  in-and-out movement of the specks standing in the orbit peaked at 22 times its resting
  value as the menu opened, and their overall speed — which is what the length of their
  tails is drawn from — rose by a third, so the whole ring combed outward in long streaks
  and then fell back. Carried, the peak is about six times resting and the overall speed
  does not change at all.
- **The near specks pass IN FRONT OF the menu, and nothing is taken out of the drawing
  for it.** The owner asked for the particles to move in front of the table, so
  `.chamber-front` is simply drawn over the writing and left alone: there is no clip and
  no veil in this file any more — no `veil`, no `taken`, no `CLEAR_PAD` — and
  `clearing()` is now only the orbit's fit and the lift. Two earlier answers to the same
  room are worth not going back to. A **clip** switched on in the one frame the panel
  joined the page put a hard-edged rectangle of nothing in the middle of the drawing two
  thirds of a second before the panel began to fade in at all, and the streams stopped
  dead against it with nothing there to stop them — the same **invisible pane** the back
  canvas used to stand in the chamber, except in time rather than in space, and a
  reported bug ("the table appears instantly as an object and obstructs the flow of the
  particles"). A **veil** replaced it — the menu's box taken back out of the finished
  drawing with `destination-out`, by exactly as much as the menu itself had faded in —
  and that is what the page carried until the owner asked for the particles in front.
  The panel keeps its border and its own ground, so the writing is still writing with
  the streams crossing it; `tests/chamber.spec.js` now checks the opposite of what it
  used to, that the drawing does reach inside the menu's box.
- **The line under the word counts the whole category** — `FAVOURITES · 03 CHAPTERS ·
  09 TOTAL ENTRIES`, read off the page's own entries. It said `ENTRIES` before; the
  owner asked for "total entries" in as many words.
- **The menu leaves on the same step it arrives on.** It used to be taken off the page in
  the one frame the word was pressed, leaving the orbit to spend the next two seconds
  coming back in after it — half of the page's only movement was a cut. It fades and rises
  back into the word instead (`shutting` on the plate, `chamber-shut` in the stylesheet)
  and `chamber.js` takes it off the page once the step is over; while it is going it is
  `inert`, so there is nothing to press or tab into in something on its way out.

The menu waits out the first third of the step on the way in, so the lettering has begun
coming down before the panel appears under it.

Worth knowing before changing any of it (the list has outgrown being counted):

- **It is a real fall, not a path.** Every particle is thrown at the orbit and pulled in
  by the middle (`PULL`, softened close in by `SOFT`); within `CATCH_MUL` times the
  orbit's own radius the chamber takes hold and does four things at once, and it needs all
  four. It turns it the way the orbit runs, up to the speed that would carry it round and
  no further; it holds it to **its own radius in the band**, not to one line; it takes the
  *radial* part of its travel out of it and never the going-round part, which is the
  difference between an orbit settling and everything grinding to a halt; and it presses
  it flat onto its own leaf of the plane. Writing the curves by hand instead gives a
  pattern, and a pattern is something you can see repeat.
- **It is a DISC, not a ring** (`DISC`, `DISC_LIFT`). Every particle is given its own
  place across the band when it is sent — a fraction of whatever radius the orbit stands
  at, in and out, plus a little off the plane — so the orbit has a width and a thickness.
  Held to one exact radius instead, everything the chamber caught piled onto the same
  hairline and what gathered was too dense to read as particles at all: a drawn ellipse
  with a crust on it, which is what the owner asked to be given some leeway from. A
  *fraction* and not a flat distance, because the orbit is five units wide closed and a
  dozen open and a band that reads as a band closed is a hairline again open. Each place
  is rolled from **two** throws rather than one, so the band is crowded along the orbit's
  own line and thins towards its edges; spread evenly it has two hard rims and reads as
  two rings. The band is what `fitOrbit` measures with, too — its outer edge is what must
  fit the window and its inner edge what must stand clear of the menu.
- **How firmly it takes hold comes on over the OUTER FRACTION of the capture band**
  (`CATCH_GRIP`), not across the whole of it, and that is what keeps particles from
  going astray. Spread across the whole band the hold came out at about half strength
  *on* the orbit and a fifth of it half a band out, so a particle that arrived a little
  wide was barely pulled in at all and rode round out there for a long time — a couple
  of dozen of them at once, which the owner reported twice. It is a fraction and not a
  flat distance because the band is four units wide closed and nearly ten open.
  Narrowing the band *itself* is the fix that doesn't work: the widening throws
  particles outward hard, and with a narrow band they sail straight out of it and the
  orbit empties. The same pass also takes *excess* going-round speed out (the turn is
  signed now, not just added), because too much of it is an orbit that swings wide and
  comes back — the other half of the same complaint.
- **A stream is aimed AT THE ORBIT, not at the middle** — along the **tangent** from
  where it stands to the orbit (`entryFor`, `ENTRY_GRAZE`), carried forward along the way
  the orbit runs, and carrying most of the orbit's own direction with it as it goes. So it
  comes in at a slant and arrives already going the way the orbit goes. Aimed at the
  middle, every stream dived at the centre and had to be turned through most of a right
  angle to join, which is what read as chaos. The tangent is **worked out, not set**: a
  fixed angle is only right for one place to stand, and with two injectors at opposite
  corners a fixed one pointed the second of them almost straight at the middle — the very
  thing the aim exists to avoid.
- **The two injectors stand at opposite corners**, and that only works *because* of the
  aim above: both come in on a tangent and go round the same way, so they fall in behind
  each other. Four, one to every corner, fired at each other across the middle and read as
  a collision. Each is placed by working back from the point of the window it is meant to
  sit at, *at its own depth*, so both stay put at any window size while standing at two
  different depths — which is what stops the streams reading as a flat line. **They take
  turns being the quick one** (`PACE`, `PACE_EVERY`), so neither is always the fast one.
- **Both stand beyond the middle of the chamber in depth, and that is not decoration.**
  An injector nearer than `MID` is only a short way from the middle *in the volume*,
  however far into the corner of the window it looks — and one inside the distance the
  chamber takes hold at has its stream caught the instant it leaves. That happened: the
  upper injector had no visible stream at all while the lower one had a long one. For the
  same reason the capture distance is **capped** so it can never reach the injectors
  (`CATCH_KEEP` against `nearestSource`): the orbit widens a long way when the menu opens
  and the capture distance with it, and unchecked it swallowed each stream where it left.
- **Both launch speeds are fractions of the speed it would take to go round AT THE
  INJECTOR'S OWN DISTANCE**, not at the orbit's. An injector standing well out is much
  further from the middle than the orbit is, and going round out there is far slower;
  given the orbit's own sideways speed that far out, a stream was thrown off the side of
  the window and never arrived at all. Flat numbers instead had one stream drop straight
  down the hole while the other sailed past it. **And both are kept under the speed it
  would take to leave**, which is root-two times that same going-round speed: taken
  together they used to come to more than it, so a particle the orbit did not catch on its
  way past was not on a long way round — it was gone, and what that looked like was a wide
  band of specks travelling from one corner of the window clean off the far edge of it.
  That was reported ("particles that go sideways and into nowhere"). Under that speed
  there is nowhere else to go: a particle the orbit misses swings round and comes back at
  it. `LIFE` is the other half of the same reading — nearly all of a life is spent going
  round and only the first few seconds of it travelling, so it sets how full the orbit is
  against how much is still out in the streams.
- **Which way the orbit runs is defined once** (`runsAt`), and both the launch and the
  catch ask it. Written out twice they came out pointing opposite ways, and a stream
  entering *against* the orbit is the whole of what "chaotic" looked like.
- **What it catches is pressed flat onto the orbit's own plane** (`FLAT`, `FLAT_V`). The
  radius alone gives a *shell* and not a lens: a particle caught while travelling along
  the axis keeps that travel, and what gathers is a fat doughnut seen obliquely, which is
  a smear and not a ring. So the part of where it stands and the part of how it travels
  that lie **along** the axis are taken out of it, and only those. Measured: without it
  the ring was 1.5–3.3 units thick against a radius of 6.4; with it, under 1.
- **The swirl axis decides how the lens is tipped** (`SWIRL`). A ring turning about an
  axis pointing straight at you is a circle; about an upright one it is a smear seen
  edge-on. This is well off both — a lens with a near side and a far side.
- **The orbit's own path is drawn**, faintly, and ticked round every thirtieth of a turn —
  and the ticks are ruled *across the band* rather than either side of the middle line, so
  they say how wide the disc is as well as where it runs.
  It is what makes the drawing legible *as an orbit* in a still frame and at the moment a
  stream is arriving, which is exactly when it is hardest to see. Like everything else
  here it is split at the middle of the chamber — the near half on `.chamber-front`, over
  the writing, the far half behind — so the path itself says which way round the lens is
  tipped.
- **The word is set about as wide as the orbit is, and that is the whole reason for its
  size** — so `RING` here and the word's `font-size` in `style.css` are one decision and
  neither moves far alone. (Both came down together when the owner asked for a smaller,
  more pressable title; `RING` has since gone back up a little, from 4.7 to 5.0, when the
  owner asked for the orbit expanded, and the word was left where it was because the band
  now straddles the ends of the lettering rather than one line crossing them.)
  The orbit is centred on the word, so no much smaller word could ever be crossed by it —
  an ellipse centred on something only crosses it if one of its semi-axes is shorter than
  the thing is. Set to about the same width, the orbit's left and right rims fall **across
  the ends of the lettering**, and because one of those rims is nearer than the middle of
  the chamber and the other further, one is drawn in front of the word and the other
  passes behind it.
  That is why there are **two canvases**: everything nearer than `MID` on `.chamber-front`,
  over the writing, everything further on `.chamber-field`, under it. The word is sized
  against `vmin` because the orbit is, and capped against `vw` as well, or on a phone the
  lettering runs off the sides.
- **How wide the orbit grows, and where it stands, are measured, not set** (`fitOrbit`).
  It is as wide as the window will hold (`OPEN_FILL`) and never so narrow that the writing
  is not standing inside it (`OPEN_CLEAR`), found by halving the difference through the
  **real projection** — the near half of the orbit stands a long way closer to the eye
  than the far half and comes out much bigger, so a reading taken flat at the middle depth
  is badly wrong at exactly the edge that runs off the bottom of the screen. The same pass
  **moves the middle of the chamber** (`core`) until the drawn ellipse sits on the middle
  of the WINDOW, in both directions: a tilted ring is not drawn symmetrically about its
  own centre, so an orbit centred on the middle of the chamber hangs visibly low and to
  one side of the thing anyone will measure it against. How far it must move depends on
  how wide it is and how wide it can be depends on where it stands, so three passes settle
  the two together. It is worked out again only when the menu or the window changes size,
  and only while the menu actually has a box: the panel is taken off the page the moment
  the menu is closed, and an orbit sized against a box of nothing would snap inward
  halfway through closing.
- **Two things keep the streams steady rather than a procession of waves.** Each particle
  is **held at its injector for a random moment before it sets off again** (`HOLD`):
  without it a particle's cycle is exactly its own life, so whatever spread of phases the
  page starts with it keeps for ever — the ones sent off together come back together, and
  between one wave arriving and the next setting off a stream empties completely for
  seconds at a time. And the **first** of them are held back for anything up to a whole
  life, because a short spread is not enough on its own to undo a start that bunched: with
  a few seconds instead, the page fires everything it has in the first instant and then
  stands empty. The cost is that the drawing takes most of a life to reach full density,
  which on a page like this one is no cost at all.
- **The back canvas is NOT clipped, and that matters.** It used to be clipped to outside
  the writing's own box, and that was a mistake you could see: the word's box is a wide
  flat rectangle, so the far side of the orbit vanished along a straight line nowhere near
  any lettering and came back along another one — an **invisible pane** standing in the
  chamber. It was never needed either. `.chamber-field` is *under* the plate in the page's
  own stacking order, so the word and the menu occlude it by being drawn on top of it —
  letter by letter, not box by box. And `.chamber-front` is not clipped either, nor ever
  is now: it is drawn over the writing, menu and all — see the bullet above about the
  specks passing in front of it.
- **What the cursor does is string a WEB between the specks it is near** (`WEB_*`). It is
  drawn on the front canvas, over everything, and it is meant to be *slightly* wrong:
  each link comes and goes on its own clock and is drawn a hair off the two specks it
  joins, both worked out from the pair itself so the same two always flicker the same way
  and the net never twitches at random. **Each speck carries at most `WEB_EACH` lines, and
  that cap is the whole difference between a net and a scribble** — joining every pair
  within reach is fine where the specks are loose, but the orbit's near rim is a dense
  line of them, every one within reach of a dozen others, and what came out was a solid
  fan of hundreds of strokes converging on a few points.
- **Nothing on this page is ever tinted, and nothing is ever drawn heavier.** The page
  said what it meant in colour twice (the theories drawing's cool blue, which on white
  read as a different site, and then brass) and then in weight, and the owner asked for
  each of them gone in turn: there is no `COOL`, no `WARM` and no `MARK_*` in the file,
  the chamber's own block in `style.css` spends no `--brass` anywhere, and a speck's
  colour and weight say nothing at all. `tests/chamber.spec.js` checks the accent is
  unspent in all four states. What is left to answer with is what the drawing is made of
  — a line drawn, a rule drawn back, an orbit swelling — plus how big a speck is drawn,
  how long a tail it trails, and how fast a stretch of the orbit runs.
- **Pointing at a row READS it off against the orbit** (`READ_SPAN`, `READ_SWELL`), and
  **draws the row's own rule back**. The stretch of orbit level with that row is held a
  little wider, so the orbit swells where the row is, and that is the whole of what the
  drawing does about it. Nothing leaves the orbit — it is a reading, not a reaching.
  **There used to be a leader as well**, run from each end of the row out to the sides of
  the window with a tick where it landed: a pair of full-width horizontal lines drawn
  across the page every time the hand passed over a row. The owner asked for them gone
  ("remove the selection lines … the horizontal line indicating your option") and they
  were removed outright rather than switched off — there is no leader anywhere in this
  file, and `readRow` now reads only the row's height off the page, since where it began
  and ended was wanted by nothing else. On the page's side, the rule under that row draws back
  from the right (to `scaleX(0.3)`, and further while it is pressed); it is a layer of
  the row's own rather than its `border-bottom`, because a border cannot be shortened
  without making the row itself narrower. That replaced an indent, where the whole row
  stepped sideways under the pointer — both say "this one", but a line getting shorter
  moves nothing anybody is reading. (It used to
  **cinch**: the sides left the border and leant in towards the row, which read as the
  drawing being pulled out of shape.) The row's box is read **once a frame**, not once a
  particle: asking an element for its box is a question the browser lays the page out to
  answer, and there are hundreds of them. What is pointed at is also settled on every
  pointer move rather than left to `pointerout`, because the menu grows out from under the
  pointer when it opens — a row can arrive under a hand that never moved, and would then
  never be left.
- **The cursor is a hand in the volume, not a cursor on a picture**: it is put at each
  particle's own depth before it pushes, so what it shoves aside is a real hole in a real
  stream — and the web is strung across whatever is left round it.
- **The step from the word to the menu is ONE property moving, once.** The word's
  `font-size` is the whole of what happens to the word — its letter-spacing, padding, crop
  marks and the gap either side of its registration marks are all written in `em`, so they
  come down with it rather than being animated in their own right. (Where the word
  *stands* is the plate's `--menu-lift`, above, and travels on the same curve over the
  same length, so the two read as one movement.) They used to be, each with its own
  duration and several of them in pixels, and they arrived at slightly different moments
  — the word appeared to settle in stages. The panel fades and rises a few pixels and
  does nothing else; it used to be squashed flat and stretched out, which draws every
  line of writing in it at the wrong height and then corrects it. The one transition to
  watch is the crop marks': a duration on a length written in `em` is also a duration on
  the lettering shrinking, so it is kept short (0.15s) or the brackets are still closing
  half a second after everything else has landed.

Particles used to **break up** near the middle and throw fragments outward (`FRAGILE`,
`FRAG_AT`). The owner asked for that gone — it read as fine particles flying in all
directions after colliding with nothing — and it was removed outright rather than left
switched off, so there is no `FRAG_*` in this file any more. Two things keep it cheap: the
specks are grouped into `BANDS` weights with one `stroke()` and one `fill()` per band, and
there is no gradient anywhere in it.

**Without the script the page is the plain list of favourites**, and the page holds its
own markup back until the script has taken over the same way the other two replaced
pages do — see **js-coming** in the glossary.

### The contact sheet (`contact-sheet.js`) — categories/scent-descriptions.html

That category carries **two views of itself**, and the two buttons fixed across the top
of the page switch between them:

| button | view | what it is | file |
|---|---|---|---|
| Houses | the **houses** | the contact sheet below: one picture per house, scattered and joined by dated lines | `contact-sheet.js` |
| Individual fragrances | the **index** | every fragrance written up anywhere on this site, one to a line, sortable and searchable | `index-page.js` |

`views.js` owns the buttons and nothing else: neither view knows about the other, and
all they share is a class on `<body>` (`view-fragrances`) that the stylesheet reads.
**Only one view is ever on the page** — the one being left fades away *first* and the
other arrives after it has gone, because two things fading through each other in the
same place is the one thing this switch must not look like. `tests/index-pages.spec.js`
watches every frame of a switch and fails if both are ever showing at once.

This page **once carried a different second view**, behind two differently-named
buttons: the **register**, in a `favorites.js` — a page ruled edge to edge with tracks,
squares travelling along them and a glitch that tore it sideways. The owner asked for
that view and its buttons gone and they went outright: there is no `favorites.js`, no
`.gallery` and no `tests/favorites.spec.js` anywhere in the site, and the chapters and
favourites it used to carry live only in the chamber now. What has come back is the
*pair of buttons*, with different names over different views. If the owner says
"Favorites view" or "Description portfolio", they mean the removed one.

The page opens white with one square window in the middle; every picture in the category
flicks through it on hard cuts, fast at first and slowing to a stop; it lands on the
first one, which stays exactly where it is; the category names itself beside the Menu;
then lines reach out across the page at whatever angle they need, each carrying a date,
and each of the other pictures appears as its line lands on it.

**EVERYTHING ON IT IS DRAWN IN SPECKS**, and three rules come with that:

- **A picture is RULED, and specked only where the map is tied on to it** (`edgeChain`,
  `TUFT_REACH`). It was bounded by a chain of specks round its whole edge and nothing
  else for one round, and the owner asked to "revert back to the normal classic bold
  border of the pictures themselves, only embellishing on the areas which are connected
  to the particles" — so `.sheet-frame` carries its own border again, and the specks are
  a **tuft**: small squares joined with fine lines, drawn only within `TUFT_REACH` of a
  point where a line is tied on and fading out along the edge as they go. A picture no
  line reaches carries none at all. The corners are landed on exactly: a square whose
  corners are guessed at reads as a blob.
  Which specks stand off the chain has to be **uneven** — every fourth one pushed out
  came out as a saw-tooth frill round each picture rather than as a net.
- **A line between two pictures is a run of specks, not a stroke** (`routeRun`). The
  `<line class="sheet-route">` elements are still there and still carry `data-from` /
  `data-to` and their own coordinates — they are the MAP, which the dates ride on and
  which anything reading the page (including the tests) uses to know what joins what —
  but they are not stroked. The specks are the drawing; the SVG is what it is drawn from.
  The run is **dense and a little scattered** — `ROUTE_EVERY` apart along the line, and
  wandering up to `ROUTE_WANDER` off it, which is the owner's "denser in particles and
  slightly more dispersed, so that it looks more like geometric connections rather than
  simple lines". Neither end is ever wandered, or a line would stop somewhere other than
  where it points.
- **Nothing moves once it has been drawn, and nothing answers the pointer.** Where a
  speck stands is worked out from what it belongs to and its number along it (`wobble`),
  so the same speck is in the same place on every redraw and a resize moves the map
  rather than re-rolling it into a different pattern. The canvas stands in the sheet's
  own coordinates, so it is carried up and down with the page. The tipping a picture used
  to do towards the cursor is gone with `.peeking`, `--turn-x`, `--turn-y` and `--lift` —
  the owner asked for no reactivity on this page for now.

The map is still watched drawing itself: each line's specks are laid down one after
another from the picture it leaves, and `drawOut()` repaints the whole canvas while any
of them is travelling, then stops. **The sheet says when it has finished** by taking the
class `drawn` — and that is not the same moment as every picture having `landed`, because
a line that closes a loop lands after the picture at the end of it already did. Tests
wait for `drawn`.

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
- **The page's own markup is never shown on the way in.** `scent-descriptions.html`
  carries a line in its `<head>` that marks the document `js-coming`, and the stylesheet
  holds `.views` out of sight while it is set; `contact-sheet.js` clears it the moment it
  has laid the sheet out. Without it the browser paints the page as written — every
  picture in a plain grid with the favourites listed under them — and then has all of it
  swept away, which reads as the page blinking its whole contents at you before it starts.
  That was a reported bug. It clears itself on `window.load` too, so a blocked or broken
  script leaves the plain grid as the page rather than hiding it for good. `visibility`,
  not `display` or `opacity`: the sheet measures its own captions on the first layout, and
  something with no layout box measures nothing.
- **The pictures are placed by the first layout, not slid into it.** `.sheet-frame` carries
  a transform transition (it is what tips a picture towards the pointer), and with it
  running every picture glided in from the corner of the sheet as the page opened. The
  script puts `placing` on the sheet for that one layout, which takes the transition off,
  and removes it on the next frame.
- **The map hangs below the chrome rather than starting under it** (`.sheet`'s top
  margin). The Menu, the two buttons and the Search are fixed across the top and stay
  where they are; the sheet is what sits lower.
- **Room is kept for the scrollbar from the start** (`scrollbar-gutter: stable`, on pages
  carrying a sheet only). The page grows a lot taller the moment the sheet lands, and on
  a browser with ordinary scrollbars that made one appear — which took 15px off the width
  and shifted everything centred on the page sideways at exactly the moment the flick
  stopped, so the whole thing looked like it twitched.
- **The page opens on the picture it will land on, and holds it** (`FLIP_HOLD_MS`). The
  flick used to start in the same frame the script took over. A quarter of a second of
  the first picture before anything moves reads as a projector being started rather than
  as a page loading, which is the delay the owner asked for.
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
  **A picture in a corner with a long caption can have no clear run at all** — everything
  below it is behind its own caption and there is nothing above it — so that search is
  made twice: properly first, and then, only if the first found nothing, again allowing
  the line to pass over *that picture's own* caption. It is the one place on the sheet
  where a caption may be crossed at all, and it is the better of two faults: a stroke
  running out from under a picture's own words still reads as belonging to it, where a
  picture with one line reads as the map having given up. It came up the moment the
  pictures were put in reading order and the second one landed in the top right corner
  with a three-line caption under it.
- **The pictures are filled into their squares in reading order.** Which squares are used
  is the scatter — shuffled, with far more squares than pictures, which is what leaves
  the gaps — and then the squares that were picked are sorted top to bottom and filled in
  the order the pictures stand in the page. The owner asked for the sheet to run 1 to 13
  down the page without the look of the scatter changing, and that is exactly what this
  is: the same squares, filled in a different order.
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
- **A line arrives slack and is then pulled taut** (`SAG`, `TAUT_MS`). While it is
  travelling it hangs between the two pictures like a loose rope — a half-sine bow with a
  smaller third harmonic laid over it, so what hangs is not a perfect arc — and over
  `TAUT_MS` after it lands it is drawn into the straight run. That is the owner's "wiggly
  like loose ropes/connections for a brief moment, and then very shortly after appearing
  they get pulled taut into perfect straight lines". The whole spread was lengthened and
  eased with it (`ROUTE_MS_PER_PX`, and a smootherstep on the travel), since a rope that
  goes taut in a hurry reads as a twitch. `tests/contact-sheet.spec.js` measures the ink
  standing well off the straight line while the map is drawing itself, and none of it
  once the map has settled.
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


### The index pages (`index-page.js`, `views.js`)

Two places on the site are laid out as an **index** rather than as a drawing:
`categories/researches.html`, and the Individual fragrances view above. They share one
block in `style.css` and one script, so a change to either is a change to both — which
is deliberate: they are the same kind of page. The shape is the one the owner sent a
picture of: a few readings across the top, a plate or two on the right, a long table in
the bottom left corner of the window, and the copyright under it.

- **The table scrolls inside its own box** (`.index-scroll`), with its headings stuck to
  the top of it (`position: sticky`). The box's height is set rather than left to the
  content, and that is the whole point of it: the owner has a great many more fragrances
  to add, and the page around the table must not grow when they do. A test checks the
  whole index still comes out on one screen with sixty-odd rows in it.
- **Every heading is a button.** Pressing one sorts by that column; pressing it again
  turns the sort round. What it sorts on is **written on the row** — `data-no`,
  `data-name`, `data-house`, `data-date` — and never read off the lettering, so
  `14.03.2026` sorts as a date rather than as the number fourteen, and a fragrance sorts
  by its name rather than by the markup round it.
- **A row's number is its own**, not its place in the list: sorting by date renumbers
  nothing. The number is what the piece is called; where it stands is what you just
  changed. A test checks the printed number still matches the row's own after a sort.
- **A row with nothing to open is not a link** (`data-open="no"`), and is drawn quieter
  than one that is, so an unwritten research reads as unwritten rather than as broken.
  An empty date sorts to the END rather than the beginning: an empty string is the
  earliest thing there is, and nothing unwritten should head a list ordered by when
  things were written.
- **One plate is DRAWN rather than photographed** (`.index-mark`): a slow ring of specks
  with lines strung between the near ones — the chamber's orbit printed small, on white.
  It is there so an index page still belongs to a site whose other pages are drawings.
  Under `prefers-reduced-motion` it is drawn once and left.
- **The dates in the fragrances table are placeholders.** They are rolled from a seeded
  generator so they are the same on every build and the sorting has something real to
  work on. Changing one means changing it in two places on the row: the `data-date`,
  which is what it sorts by, and the lettering, which is what is read.
- **Without the script the table is the same table**, in the order it is written in the
  page, and every row that is a link still is one. Nothing here is the only way to reach
  anything.

### ADAR (`adar.js`) — works/adar.html

The second house in Scent descriptions, and **the same shape as Pineward on a different
ground**: an introduction and then the fragrances, each compacted to a number, a small
picture and a title until it is opened. Where Pineward has a wood, this has a **void**.
The owner asked for it to be "mysterious … unknown and void-y", and what that means here
is: near-white on near-black, a hole standing off to one side of the window with
soundings ringing out from it, and **no colour at all** — `tests/adar.spec.js` reads the
whole canvas and fails on anything that is not grey, and reads the writing over it for
the site's accent too.

- **The eleven are in the house's own groups** — three trilogies and the two that stand
  outside them — written in the page's markup, not worked out in the script.
- **The void is a hole, not a disc drawn over the drawing.** Everything is drawn, and
  then the disc is taken back out of the finished drawing with `destination-out`. With
  that operation it is the **alpha of the fill** that says how much is taken out, and
  whatever was last used to draw a speck is a few hundredths of one — left as it was, the
  hole came out as a smudge with the drawing still faintly in it. Set the fill solid
  before clearing; a test reads the middle of the void and requires nothing at all there.
- **The hole needs something to be a hole in.** The page's ground and the inside of the
  void are the same near-black, so a **halo** is stamped round it — one radial gradient
  drawn once into a canvas of its own and then `drawImage`d, the way the theories drawing
  stamps its glows rather than asking for a fresh gradient every frame.
- **The rings are carried by the scroll and the specks fall on the clock**, both worked
  out fresh every frame rather than added up, so travelling back gets you back to the
  same drawing. Under `prefers-reduced-motion` the clock stops and the void simply
  stands there.
- **The specks near the rim are drawn as short arcs** along the way they are travelling,
  and as squares further out — what is falling round a hole is not standing still.
- **The middle of the window is kept quiet** (`CLEAR_MID`), where the writing stands, but
  never emptied: a speck there is left at a tenth rather than taken out, because a column
  of nothing down the middle of a drawing is the **invisible pane** the chamber learnt
  not to stand in its own.
- **The sounding** is the scale down the side: one tick per fragrance, inked in as it is
  passed, with the reading in the corner counting them and naming the group. It is
  Pineward's trunk by another name, and it reads the PARTS rather than the scrollbar for
  the same reason.
- A **stage** — top, mid, base, a sidenote — is a `<p class="adar-stage">` label above
  the paragraphs it belongs to, because that is how the owner writes.
- **ADAR Effect™ is the owner's own coinage** for this house's turpentine quality, and
  it is deliberately NOT written that way in three places: the introduction, and the two
  entries where they wrote "ADAR DNA" and said they meant it. Don't tidy those.

### The essay pages (`essay.js`) — works/theory-*.html, works/resins-in-perfumery.html

A page for a long piece of writing, drawn in the theories drawing's language rather than
the contact sheet's: near-white on gray-black, a fine swarm of particles standing in the
air behind the writing, and sights at the corners. Opening a theory from that category
should read as going further into the same instrument rather than as arriving somewhere
else, and that is the whole reason for the ground.

- **The rule down the left is built from the page's own sections** — every
  `<section class="essay-section">` with an `<h2>` in it, in the order they stand. Adding
  a section to the page adds a tick to the rule with no other change. A heading carries
  its number in a span of its own and **the number is not part of the name**: read whole,
  every tick came out as "01PREMISE".
- **Every tick is a link to its own section**, so the rule is a way of getting about and
  not only a readout.
- **The reading is the scroll**, and nothing on the page adds itself up: the drift is
  written from the clock and the travel from `scrollY`, so a page left alone reads the
  same a second later and travelling back gives exactly the drawing you left. A test
  checks both — the same two things the structure drawing got wrong first.
- **The web between the specks is short and capped** (`WEB_REACH`, `WEB_EACH`). At a
  longer reach the field came out as long lines striking across the page and closing into
  triangles: a net thrown over the writing rather than air standing behind it. Pineward's
  canopy made exactly the same mistake first, which is why the numbers here are small.
- The three theory pages are **templates** — placeholder writing, real structure — and
  the resins research is the owner's own writing. The theories category's first three
  rows point at the three theory pages.

### Pineward (`pineward.js`) — works/pineward.html

The first house in Scent descriptions, and the piece with the most in it. It is a long
page — an introduction and **fifty-four parts**, one per fragrance, each a picture and
the owner's own notes — and the layout is the answer to that length:

- **A part is compacted.** Closed it is its number, a small picture and its title on a
  ruled line with a run of dots between the title and the cue; open it is the picture at
  size with the writing beside it. Fifty-four of anything listed straight down a page is a
  wall. It is a real `<details>`, so it opens and closes, takes the keyboard and works
  without the script; `pineward.js` only measures the height so the page does not jump.
- **They are grouped into four strata** — Canopy, Understorey, Trunk, Roots — a section
  through a forest read from the light down into the ground. The first two carry
  **fourteen** each and the last two **thirteen**, which is what fifty-four divides into
  four ways; it was four of thirteen when the page was written and the owner's list came
  to fifty-four. The strata and the numbers are in the page's own markup, not worked out
  in the script.
- **The parts are in alphabetical order by the fragrance's name**, and the writing in
  them is the owner's — their spelling and punctuation are theirs, so don't tidy them.
  The scores they originally carried ("9.5/10" at the end of an entry) were taken out at
  their request; two are left where they are part of a sentence rather than a verdict on
  its own.
- **The wood is grown, and it runs the length of the piece.** Conifers stand down both
  margins of the whole page rather than as one canopy behind the title: each is a
  straight leader carrying whorls of branches that shorten as they rise and droop as they
  reach out, with specks strung along them and only their near neighbours joined
  (`treeAt`, `branchOf`, `growWood`, `paintWood`). The owner asked for the trees
  "extended and go through the entire page" and made "more coniferous". The whole page's
  trees are grown ONCE, in the page's own coordinates, and bucketed into rows so that
  only the rows on screen are drawn — growing them per screenful instead would re-roll
  the wood every time you scrolled. It grows from nothing over `GROW_MS` when the page
  opens and then holds its shape, and it is kept out of the middle of the page
  (`CLEAR_MID`), where the writing stands. Joining every speck within reach — the first
  version — came out as long lines striking across the page and closing into triangles: a
  net thrown over the title rather than something growing behind it.
- **It idles where it stands, and it blooms under the hand** (`IDLE`, `IDLE_RATE`,
  `BLOOM_*`). A speck drifts about a pixel around its own place on its own slow clock, so
  the wood is never quite still while never going anywhere — the owner asked for exactly
  that: "the particles themselves are free to slightly idle, yet the taught character
  should remain the same". Near the pointer a speck is drawn more plainly and puts out a
  few short needles, eased in and out (`BLOOM_EASE`) so the bloom follows the hand rather
  than switching on and off with it. **Nothing about the drawing moves with the pointer**
  — it is the same tree in the same place, drawn fuller where the hand is — which is the
  other half of what they asked for: "this should not be interactive and should not move
  with the mouse".
- **The trunk is the piece's own scale**: one tick per part down the side, inked in as it
  is passed, with the reading in the corner counting them. It reads the PARTS and not the
  scrollbar — a part that runs long should not read as more of the piece than a part that
  runs short — and it is taken off the page below 860px, where the window is the whole of
  the room.
- **Without the script the page is all of its writing.** The trunk and the reading are
  added by it and the wood is drawn by it; none of them carry anything to read.

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
  for image-and-paragraph sequences, `example-article-work.html` for reference pieces,
  `theory-01.html` for a long essay on the dark ground — then add it to the relevant
  `categories/` page. There are **four kinds of category page** now, and they take a new
  piece differently: the **row list** (`other-2`) takes another `<a class="work-row">`
  block; the **contact sheet** (`scent-descriptions`, Houses view) takes another
  `<a class="sheet-frame">` block; the **structure** (`theories`) takes another
  `<a class="work-row">` block, which becomes a station of its own and lengthens the
  road — optionally with a `data-note`, a line about the piece that the station's card
  shows when it is clicked; and the **index** (`researches`, and the Individual
  fragrances view) takes another `<tr>`. Each page says which in the comment at the top
  of it.
- **A row on an index page** carries what it sorts by on itself: `data-no`, `data-name`,
  `data-date`, and `data-house` where there is one. Change a date and you change it in
  two places on the row — the `data-date` it sorts by and the lettering that is read. A
  row with nothing to open yet gets `data-open="no"` and no link.
- **A fragrance in the Individual fragrances table** points at that fragrance where it
  stands in its house's own page — `../works/pineward.html#part-06` — so the index and
  the houses are two ways into the same writing rather than two copies of it.
- A favourite on the **chamber** page (`favorites`) is an `<a class="gallery-entry">`
  block with a `data-chapter` and a `data-date` — the chapters are the different
  `data-chapter` values in the order they first appear, and the chapters standing in the
  chamber's column are made from them.
- **A part of Pineward** (`works/pineward.html`) is a `<details class="pine-part">` block:
  a number, a small picture and a title in its `<summary>`, and the full picture and the
  writing inside. Copy a whole block to add one, and renumber the ones after it — the
  numbers are in the markup rather than counted, so they are the owner's. **A fragrance
  of ADAR** (`works/adar.html`) is the same block by another name
  (`<details class="adar-part">`), with its stages — top, mid, base, a sidenote — written
  as `<p class="adar-stage">` labels inside it.
- **A section of an essay page** is one `<section class="essay-section">` with an `<h2>`
  in it, whose number is a `<span class="essay-no">` inside that heading. The rule down
  the left is built from those, so adding a section adds a tick and nothing else needs
  changing.
- **New category**: duplicate any `categories/` page, change its `<h1>` and lede, add a
  line to `SITE_LINKS` in `nav.js`, and optionally add a `REAL_NODES` entry so it also
  appears in the map. The first of the two **Other** pages became **Researches** at the
  owner's request: `categories/other-1.html` is gone, and `categories/researches.html`
  is an index page rather than a row list.
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
| **the shockwave** | The narrow ring that closes on the centre ahead of the collapse, on its own faster clock (`WAVE_*` in `paper.js`). Distinct from the suction, which pulls everywhere at once. A second ring (`OUTWARD_*`) runs the other way at the same time, shoving the grid outward while everything else pulls in. It is **on** — `OUTWARD_STRENGTH` is 58; setting it to 0 is how you would remove it. |
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
| **the opening** / **setting up** | What the theories drawing does when the page loads: the rails shoot out to the vanishing point, the ribs come up out of the depth towards you, the rule writes itself along the floor, the air fills and the corner sights snap in last. `INTRO_*` and `built` in `structure.js`; the chrome arrives with it on the `lit` class. |
| **js-coming** | The class a page puts on `<html>` in its own `<head>` while the script that replaces its contents is on its way, so the plain fallback is never flashed first. Carried by `theories.html`, `scent-descriptions.html` and `favorites.html`; each script clears it once it has laid itself out, and `window.load` clears it if the script never arrives. |
| **the breath** | The structure's own slow creep: the eye drifts a little way in and back out again on a fixed cycle (`CREEP`, `CREEP_EVERY`), so the page is never quite still but the scroll is always the whole of where you are. |
| **carriage** | The gantry that runs down the frame towards you on its own clock, lighting each rib as it passes. |
| **traverse** | One of the streaks that run across the frame — the mechanical version of a falling star. |
| **chapter** | One grouping in Favorites — whatever an entry's `data-chapter` says. The chapters, their names and their order all come from the page. |
| **the register** | The way the contact sheet page's *Favorites view* was laid out: a page ruled edge to edge with horizontal tracks, a square travelling along each, lines between them, and a glitch. **Removed** with that whole view and its two buttons — there is no `favorites.js` in the site any more. If the owner uses the word, they mean that. |
| **track** / **gauge** / **car** / **square** / **the tear** / **the sig** / **index** / **log** | All of the register's own parts, removed with it. |
| **the field** / **the hatch** | The ruled ground of fine strokes the Favorites view carried before it became the register — its reading was which **way** it lay. Removed, like everything else that view had. |
| **Pineward** | The first house in Scent descriptions: `works/pineward.html`, "the house that smells like trees". An introduction and fifty-four parts, one per fragrance, in alphabetical order. |
| **part** (Pineward) | One of Pineward's fifty-four: a `<details>` showing its number, a small picture and its title until it is opened, and its full picture and writing inside. |
| **ADAR** | The second house in Scent descriptions: `works/adar.html`, "the house that you have never heard of". Eleven fragrances in four groups, on a **void**. |
| **the void** | ADAR's ground: a hole standing off to one side of the window with soundings ringing out from it and specks falling round its rim. Drawn by taking the disc back out of the finished drawing, not by painting one over it. |
| **the sounding** | Two things on that page, and they go together: one of the ringed scales drawn out from the void, and the scale down the side of the page with one tick per fragrance — Pineward's **trunk** by another name. |
| **stage** | Top, mid, base, a sidenote: the label above a run of paragraphs about one part of how a fragrance develops. `<p class="adar-stage">`. |
| **the ADAR Effect™** | The owner's own coinage for this house's turpentine quality — the menthol-like trigeminal lift without the dense forest behind it. Written as **ADAR DNA** in exactly three places on purpose (the introduction, and two entries where they said they meant it); leave those. |
| **essay page** | A page for a long piece of writing on the theories drawing's ground: a swarm of particles behind it, sights at the corners, and the **rule** down the left. `essay.js`; the three theory templates and the resins research. |
| **the rule** (essay) | The scroll indicator down the left of an essay page: a hairline filled in as far as you have read, one tick per section, the section you are in named under it, and a percentage. Every tick is a link. |
| **index** | The way `categories/researches.html` and the contact sheet's Individual fragrances view are laid out: readings across the top, plates on the right, a sortable, searchable table in the bottom left corner, and the copyright under it. `index-page.js`. |
| **the board** | That table and the search above it, taken together (`.index-board`). It scrolls inside its own box so the page around it does not grow. |
| **the mark** | The one plate on an index page that is drawn rather than photographed: a slow ring of specks with lines between the near ones — the chamber's orbit printed small, on white. |
| **research** | One piece in Researches — a material at a time, where it comes from and what it smells like. The first is `works/resins-in-perfumery.html`. |
| **stratum** | One of the four groups of thirteen parts — Canopy, Understorey, Trunk, Roots — a section through a forest read from the light down into the ground. |
| **the wood** / **the canopy** | The drawing behind Pineward: conifers standing down both margins the whole length of the page, specks strung along their branches, grown from nothing when the page opens and holding their shape afterwards. Kept out of the middle of the page, where the writing stands. It was one canopy behind the title before the owner asked for it extended through the whole piece; they may still call it the canopy. |
| **the bloom** | What Pineward's wood does under the pointer: the specks near the hand are drawn more plainly and put out a few short needles, eased in and out. Nothing moves — the tree is only drawn fuller there. |
| **the idle** | The pixel of drift each speck in that wood keeps about its own place, so the drawing is never quite still without ever going anywhere. |
| **the trunk** (Pineward) | The rule down the side of that page with one tick per part, inked in as each is passed, with the reading in the corner counting them. |
| **the grain** / **the wave** / **the sweep** / **knot** | All of the hatch's answers to the hand, removed with it — see **the field / the hatch** above. |
| **mound** / **skyline** | The reading the field carried before *that*, when it was a lattice of marks: a rise in its top edge per entry. Nothing of it is in the code either. |
| **the chamber** | The way `categories/favorites.html` is laid out: two injectors at opposite corners of the window — top right and bottom left — firing streams of particles across it on white, which join an orbit standing round the menu of favourites. `chamber.js`. The theories drawing's world turned inside out, and the one page here that spends no accent colour at all. |
| **injector** | One of the chamber's two sources (`S-01`, `S-02` on the drawing), each at its own depth in the volume. They stand at opposite corners — top right and bottom left — and take turns being the quick one. |
| **the orbit** (chamber) | What the chamber's streams join: a tilted circle of particles — a **lens**, pressed flat onto its own plane — standing round the word, with its own path drawn faintly through it. It is the only arrangement the page has: opening the menu widens it, closing the menu narrows it. Not to be confused with **the ring / the orbit** below, which is a removed Favorites treatment. |
| **the entry** | How a stream joins the orbit: aimed not at the middle but along its own **tangent** to the orbit, carried forward along the way the orbit runs (`entryFor`, `ENTRY_GRAZE`), so it comes in at a slant already going the right way. |
| **the word** | `FAVOURITES`, standing in the middle of the chamber's orbit: the whole of that page's chrome when it is closed, and the button that opens the menu. Set wider than the orbit so the orbit's rims cross the ends of the lettering, one in front and one behind — so its size and `RING` are one decision. Bracketed by **crop marks**, which run out towards each other as the hand comes on to it, with the **cue** under it. |
| **the cue** | The small boxed label under the chamber's word saying what pressing it does — `EXPAND`, and `COLLAPSE` once it is open — with a chevron pointing the way it will go. |
| **the hold** / **the frame** | What the chamber used to do when the menu was opened: every particle took a seat on the border of the window and the whole rectangle travelled round it. Removed — the orbit simply widens now. Nothing of it is in the code (no `EDGE`, no seat, no `FLOW`). |
| **the read** | What pointing at a row of the chamber's menu does: the stretch of orbit level with it swells outward, and the rule under the row draws back from the right. It replaced a **cinch**, where the sides left the orbit and leant in towards the row. |
| **leader** (chamber) | The line that used to be run from each end of a pointed-at row out to the side of the window, with a tick where it landed — the "selection lines" the owner asked to have taken off the menu. Gone from `chamber.js` entirely; the orbit's swell is the whole of the read now. (Not to be confused with the short leader still drawn at each **injector**, along the way its own stream leaves.) |
| **the disc** | What the chamber's orbit is made of: a band with a width and a thickness rather than a single line of specks. Each particle stands at its own radius within `DISC` of the orbit either way, and a little off its plane (`DISC_LIFT`). |
| **the web** | What the chamber's cursor does: the specks near it are joined up with fine lines, each coming and going on its own clock and drawn a hair off the two it joins, so the net is always a slightly different net. `WEB_*` in `chamber.js`. |
| **ranged** | What the chamber briefly did to a particle it was answering with: a fine hollow square drawn round it. Removed with the rest of the reaction-by-emphasis — there is no `MARK_*` in the file. If the owner uses the word, they mean that removed treatment; what is there now is **the web**. |
| **contact sheet** | The strip of every frame on a roll of film, printed together so you can pick one — and the way `categories/scent-descriptions.html` is laid out: `contact-sheet.js`. |
| **frame** | One picture on the contact sheet (`<a class="sheet-frame">`), square, and a link to the piece it belongs to. |
| **plate** | On the contact sheet: the frame it settles on and keeps at the top — the first one in the page. |
| **the flick** | The pictures going past in the middle window, hard cuts, fast then slowing to a stop. It ends on the picture it keeps rather than cutting to it. `FLIP_*` in `contact-sheet.js`. |
| **link** / **route** | A line between two pictures on the sheet, at whatever angle they lie at, carrying a date. Every picture has at least one. |
| **view** | One of the two ways the contact sheet page shows its category, behind the two buttons across the top: the **houses** (the sheet itself) and the **individual fragrances** (the index). `views.js` switches them, and only one is ever on the page. It briefly had a different pair — the **map** and **Favorites**, the second of which was the removed **register** — so if the owner says "Description portfolio" or "the Favorites view", they mean those. |
| **houses** | The contact sheet view: one picture per house, scattered and joined by dated lines. The pictures run in order down the page — 01 at the top, then 02, 03 and so on. |
| **individual fragrances** | The index view: every fragrance written up anywhere on the site, with its number, its name, the house it belongs to and the date it was written about. |
| **the chain** | What bounds a picture on the contact sheet: small squares round its edge joined with fine lines, a few of them standing off it and netted back in. It replaced the ruled border. |
| **the run** | The same thing along a line between two pictures: the line is specks rather than a stroke. |
| **the ring** / **the orbit** | A circle of pictures standing in three dimensions round a big square, which is how Favorites was laid out before it became a menu of chapters. Nothing of it is in the code now — no `RING_*`, no `.gallery-face`, no `<button class="gallery-frame">`. If the owner uses the word, they mean that removed treatment. |
| **favourite** | One entry in Favorites (`<a class="gallery-entry">`), carrying a `data-chapter` and a `data-date`. |
| **work** | An individual piece, one page in `works/`. |
| **category** / **body of work** | A page in `categories/` listing works; also an entry in `SITE_LINKS`. |

## Where things stand

The site is finished and live in the sense that every page works and is deployed; what
is unfinished is the *look* of the three drawn category pages, and that is what the
owner has been iterating on. Everything below is the state of that conversation, so a
fresh reader does not have to infer it.

**How the owner works, and what they expect.** They describe an effect in their own
words rather than in code, often with a photo, and then refine it over several rounds
— the first version of anything is a starting point, not a spec. Two habits follow from
that and are worth matching:

- **When they ask for something gone, it comes out of the code, not switched off.**
  `structure.js` has no `SCAN_*` and `chamber.js` no `FRAG_*`, `MARK_*`, `EDGE` or
  leader, because each was asked for and then removed outright rather than left switched
  off. The **whole register** went the same way — `favorites.js`, its markup, its styles
  and its tests — when the owner asked for the contact sheet's Favorites view and its two
  buttons gone, and so did that page's pointer reactions. The exceptions are the few things
  deliberately *dialled to zero with the machinery intact* and documented as such
  (`SWAY = 0`, `CLOUD_COUNT = 0`) — those are the owner's to bring back by raising a
  number. When something is removed, the glossary keeps an entry for the word saying it
  is gone, because the owner still uses the word for the thing they remember.
- **They report bugs precisely and notice small things.** "There are two different
  objects making up the arms", "it blinks the whole page before it starts", "the
  percentage ticks up while I'm not touching it" — all real, all fixed, all now written
  down in the relevant section as things not to reintroduce. Take a vague-sounding
  complaint seriously; it has been specific every time.

**What the owner has settled and what they are still moving.** The landing page and the
row list have not been touched in several rounds and can be treated as settled. The
drawn pages are live subjects: the **structure** (theories) most recently had its travel
made fully reversible, an opening sequence, a click-to-set-out for each station, its scan
removed and its traverses put on random bearings; the **chamber** (favorites) has had the
most rounds of anything here — four injectors to two, a rectangle-on-the-borders open
state replaced by one widening orbit, its reaction moved from cool blue to brass to
ranging marks to the present web of lines, all accent colour taken off it, and most
recently the word stopped blinking, the menu given a fixed length and the specks put in
front of it; and the **contact sheet** was redrawn in specks, then given its pictures'
borders back with specks only where the map ties on to them, ropes that go taut, a
quarter-second hold before the flick, and its pictures put in order down the page.

**The writing has started arriving.** Up to now the site was a set of drawings with
placeholder text in them; the owner has since sent the writing for two houses — fifty-four
Pineward fragrances and eleven ADAR ones — and the first research. Two things follow.
Their words are theirs: spelling, punctuation and all, including the notes to themselves.
And the site has grown a shape it did not have before — a house has a page, a fragrance
is a part of that page, and the **index** is a way through all of them at once.

**The most recent round added four page kinds at once**: the two views on the contact
sheet page, the **index** those views and Researches share, **ADAR** on its void, and the
**essay pages** for the theories and the researches. None of them has been through a
round of the owner's notes yet — expect them to move.

**That earlier ambiguity is now settled.** "Shrink the horizontal bars that select it"
was read at the time as the ruled lines *between* the chamber menu's rows, and the
**leaders** — the long horizontal lines run out from a pointed-at row across the window —
were noted as the other possible reading. The owner has since asked for "the selection
lines … the horizontal line indicating your option" to be removed, which is the leaders,
and they are gone. The rule under the row still draws back, which they have not
questioned.

**Two things left open, which the owner may come back to:**

- **The accent is still spent on the site's shared chrome.** `nav.js`'s Menu trigger and
  the menu overlay's links go `--brass` on hover, and the global focus ring is brass, on
  every page including the chamber. The owner asked for "the orange accents" gone from
  the favorites page and the chamber's own block was cleared; the shared chrome was left
  because changing it changes the chrome on every page of the site. They know this.
- **The placeholders in the new pages are marked as placeholders.** ADAR's introduction,
  the three theory pages, the standfirsts and every plate on the site are waiting for
  the owner. The dates in the Individual fragrances table are rolled from a seed so the
  sorting has something to work on; they say nothing. The one thing that was not
  guessed at is a fragrance's own writing, which is theirs throughout.

**What has never been asked for and should not be invented:** the placeholder content.
`Your Name`, `you@example.com`, the lorem ipsum on slide 2 and the `contact.html` social
links are all still placeholders on purpose — they are the author's to write.

## Maintaining this file

Keep this file current: when the `window` contract, the landing page's layer list, the
`node-scene.js` data lists, the content workflow, or the glossary changes, update the
matching section in the same commit.

`README.md` is a running changelog written for the site's author and has drifted in
several places (`__p23`'s owner, the palette, `DECORATIVE_POINTS`, and a section on
`menu-modes.js` and per-slide menus, which no longer exist). Prefer the code whenever
they disagree, and correct this file rather than trusting either.
