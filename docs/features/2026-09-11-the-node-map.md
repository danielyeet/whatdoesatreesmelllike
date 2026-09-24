# The 3D node map

Date: 2026-09-11 (the repository's first commit), with later rounds through 2026-09-17 —
the node's name lifted onto its window in `8d31b8d` and `d3ea09b`, the branches grown out
of the centre in `cc4a1d8`, and two new nodes added in `d7092b2`. Migrated from CLAUDE.md
on 2026-09-17.

Files: `node-scene.js` (~1,470 lines), `index.html`, `style.css`,
`tests/node-map.spec.js`, `tests/leaving-the-map.spec.js`

## What it is

`node-scene.js` draws the third slide of the landing page: a dark hub at the
origin with eight branches growing out of it, each ending at a clickable **link node** — one
per category. It is the only file in the site that uses Three.js (from a CDN, in
`index.html` only) and the only one that uses a WebGL shader. `REAL_NODES` at the top is the
intended edit surface; everything below it is graphics code.

## Why / key decisions

**`REAL_NODES` and what is derived from it.** Each entry carries `label`, `sub`, `href`,
`pos: [x, y, z]` and a `preview: { description }`. All but Contact carry a preview now — the owner
asked for every node to open a window, not only Scent descriptions and Theories — so a click
on any of them opens the window rather than navigating. The field is still optional as far
as the code is concerned: a node without one simply follows its link, and that is the
behaviour to keep working if a new node is added without writing a line for it. Positions
are a Fibonacci sphere, standing 3.05–3.45 from the origin; keep a new one in that range, and
**keep `y` clear of 0** — a node near the equator sweeps across the middle of the screen on
every rotation, dragging its label through the centre. (The closest any of the eight comes is
|y| = 0.4.)

**Everything else is derived, and that is the property to preserve.** Each branch is a
`CatmullRomCurve3` that leaves the hub straight along the line to its own node, then bows
through two waypoints to reach it — the waypoints computed from the node's own position and
a per-branch perpendicular. The straight run exists so the arms leave the centre at the same
even spacing the node positions already have; bowing from the hub itself threw each one off
by a different amount, which read as arms placed at random. The branch **stops** at the node,
so anything clickable reads as a place the map *ends*. Its wake specks are sampled off that
same curve (`curve.getPoint(t)`), which is why they cannot end up lopsided and why they ride
the branch's motion with it. Move a node and the curve, waypoints and wake all follow —
don't hand-place any of it.

**A branch is one object from the centre to its node.** Where it meets the sphere it swells
out to `ROOT_FLARE_RADIUS`, bridging a hair-thin tube and a sphere twenty-odd times its
width, so a branch reads as growing out of the centre rather than as a wire poked into a
ball. That swelling is the *tube being drawn wider there*, made in `branchGeometry()`, not a
collar laid over the end of it. It used to be a separate `LatheGeometry` mesh, and a separate
piece was visibly a separate piece however carefully it was matched: it was straight where
the branch had already begun to bend, and being transparent over the tube it also came out
darker — so the middle of the map read as seven stubs with seven thin lines starting where
they stopped. **That was a reported bug; don't reintroduce a second mesh at the hub end.**
`branchGeometry()` takes a `TubeGeometry` and pushes each ring outward from its own middle
(the average of the ring's vertices, the repeated seam vertex left out), by how far that
middle is from the sphere's surface — so the swelling follows whatever the curve is doing
rather than assuming it is straight. The same pass writes a **colour ramp** per vertex,
carrying the centre's own near-black at the sphere's surface up to the tube's own colour over
the next `ROOT_FLARE_BLEND`, so there is no line to see where a branch enters the sphere.
That ramp is a *multiplier*, because the material's colour is already kept in step with
hover's darkening. Both tubes — resting and emphasised — are built this way, each with its
own ramp; `repen()` rebuilds them at the new pen weight, and `mesh.userData` carries the
radius and colour it needs to.

**Other things that will bite you:**

- Both particle systems are single batched draws with a custom `ShaderMaterial` giving every
  speck its own size and opacity (the stock points material can do neither). That is what
  makes hundreds of specks cheap — and it is why a shader that fails to compile takes the
  whole scene with it, so the map comes up **blank rather than merely wrong**. Blank looks
  like a loading failure, not like a bug you introduced, so open the console after any change
  here. Every other drawing in the site is plain canvas, SVG or DOM and fails visibly.
- A wake speck is `PARTICLES_PER_SPECK` (9) particles stacked on one point, so it reads as a
  single dot at rest and sprays apart when pointed at. Spray directions are fixed at load, so
  a given speck always bursts the same way.
- Hover detection raycasts against `wake.points`, **not** the branches — pointing at a speck
  is what sets `activeBranch`. Emphasis is then by **weight, not colour**: the branch
  thickens and the rest of the map steps back. Branches are tubes rather than lines precisely
  so they *can* thicken, since WebGL ignores line width nearly everywhere.
- Hovering a node, or having a preview open, holds the map still instead of letting it keep
  drifting under the pointer.
- **`viewDepth(worldPos)` is the real per-node depth** (0 near, 1 far), used for label
  opacity, z-index stacking and the chromatogram's peak heights. Raw NDC `projected.z` looked
  plausible but was useless here — every node landed within 0.01 of the far end of its range
  for a scene this small this far from the camera's near/far planes. Don't reach for
  `projected.z` as a stand-in for depth anywhere in this file.
- **The `TUNING` block near the top holds every magic number** — `IDLE_SPEED`,
  `DRAG_SENSITIVITY` / `MAX_SPIN` (how far the map turns for a given movement of the hand,
  and the fastest it will spin however hard that movement is), `FRAME_V` / `FRAME_H` (larger
  values draw the map *smaller*), `BRANCH_RADIUS`, `SPECK_SIZE`, `REF_PX_PER_UNIT`, the
  `ROOT_FLARE_*` group, and the wake / cloud / corrugation groups. Tune there, not inline.
  Several systems are dialled to zero but left wired up (`SWAY = 0`, `CLOUD_COUNT = 0`);
  bring them back by raising the number rather than rebuilding the machinery.
- **The preview.** A node's `preview` intercepts the click and opens a dark modal whose
  connector arm is that node's *own* branch traced out to the window, landing on a **dock** at
  the modal's edge — not a second curve drawn alongside. The node's **name** moves with the
  click: the map's copy of it goes instantly, and the copy above the window comes up gradually
  from that same moment (the registration mark stays; only the lettering moves). The name is a
  child of the modal so it travels with it, positioned outside its top edge on the paper.
  **One name, one place: if you ever make both visible at once, that is the bug.** It eases
  back into the map on close — instant out, eased in.
- **The corrugation** is the sharp zigzag the cursor drags across a nearby branch (`CORR_*`):
  evenly spaced teeth of one size travelling steadily outward along it, so it reads as a
  regular wave excited in a wire. Only its height answers the cursor. It used to re-roll its
  height and spacing several times a second, which read as jitter; the steady pattern replaced
  that deliberately.
- **If `THREE` is undefined the scene replaces itself with a plain list of `REAL_NODES`
  links.** Keep that fallback working when editing the top of the file; there is a test for it.

**Portrait / narrow viewport.** `resize()` works the camera's distance out as
`Math.max(FRAME_V / halfFov, frameH / (halfFov * aspect))`. In portrait `aspect` is below 1,
so dividing by it makes the horizontal term much the larger of the two and pulls the camera
well back — which is what draws the map smaller there and keeps the left and right link nodes
on screen and tappable. `frameH` itself is **4.6** when `aspect < 1` rather than `FRAME_H`'s
4.9, i.e. slightly *smaller*, which takes a little of that back; don't read it as the thing
doing the shrinking. Vertical swipes must keep scrolling the page; only horizontal drags
rotate the map.

## How to test it

```bash
npm test -- tests/node-map.spec.js
npm test -- tests/leaving-the-map.spec.js
```

Between them these cover the map, its labels, hover, the preview window, the ranks receding
behind the trace with their peaks in line, the no-Three.js fallback, and the collapse drawing
every node into the centre. `tests/node-map.spec.js` includes regressions for the clipped
connector SVG and for the flat NDC depth described above.

By hand, after any change here: **open the browser console** — a blank map means a shader
error, not a loading failure. Then check portrait (a narrow window) for the left and right
nodes still being on screen, and check that a vertical swipe scrolls the page while a
horizontal drag turns the map.

## What is on the map is a chosen few of what is in the menu

The owner asked for the two to match, and then, the round after, asked for **Contact** off
the map and **Photography** with it. So the rule is **not** "the map is the menu". It is:

> everything on the map must be in the menu; which of them are on it is the owner's to
> say.

Nothing breaks when a page is only in the menu — it simply is not a branch. There is a
browserless test that every link in either list points at a file that exists, but nothing
checks the two lists against each other, and after this round nothing should.

Five branches now: Scent descriptions, Theories, Favourites, Works, Search. Off the map and
still in the site: **Photography**, **Contact**, and the two **Test node** sandboxes
(`works/test-node-a.html` and `-b.html`, which nothing points at at all now and are safe to
repurpose). Two changed name with their pages on the way here — Researches → Works and
Other → Photography.

**A node with no `preview` navigates instead of opening a modal**, which is worth knowing
if one is added: Search carries a preview, and the removed Contact node did not.

## Every page in the menu is on the map, and they stand evenly

The owner asked for all seven — Scent descriptions, Theories, Explorations & Researches,
Favourites, Photography, Search and Contact — and for them to be evenly distributed. Both
are in `REAL_NODES`.

**`pos` is a Fibonacci sphere**, not seven points placed by hand: each one's height is a
seventh of the way down from the top, and each is turned the golden angle
(π(3−√5) ≈ 137.5°) further round than the last, at a radius of 3.2. That is the arrangement
that leaves no two of them crowded. The closest pair of branches is **71.5°** apart and
every one of them is the same distance from the hub, which is what "equally distributed"
buys: no branch obviously longer than another and no two bunched.

**To add an eighth, recompute the whole list rather than squeezing one more in.** A
hand-placed extra would undo the spacing, and there is a test that would catch it.

**Photography says it is a work in progress.** A node's `preview` may carry a `note`
besides its `description`, set as its own line in the window — it is a state of the page
rather than a line about it, and only a page with something to say gets one. Photography
is the only one at the moment: its frames are in place and most of its pictures are not.

Contact has no `preview` at all, so pressing it simply goes there. That is the difference
the field is for.

## Known issues / TODO

- `SWAY` and `CLOUD_COUNT` are deliberately at zero with their machinery intact — the
  owner's to bring back by raising a number.
- `README.md` documents a `DECORATIVE_POINTS` list and a `MAX_LOOSE_REACH` tuning value for
  loose dots that attach to the nearest waypoint. **Neither exists in the code any more** —
  that system was replaced by the per-branch wake described above.
- `works/test-node-a.html` / `test-node-b.html` are sandbox pages reached from the two "Test
  node" entries in `REAL_NODES`; safe to repurpose or delete together.

## 2026-09-24 — the Note Library, the eighth node

> also add the library as one of the nodes in the main menu.

The Note Library is on the map now, between Favourites and Photography as it is in the menu,
with a `preview` of its own. The list was **recomputed whole**, as the section above says to:
a Fibonacci sphere of eight at a radius of 3.2, the i-th one's height (1 − (2i+1)/8) of the
radius — eight even steps with none on the equator — and each the golden angle further
round than the last. The closest pair of branches is **66.3°** apart (it was 71.5° with
seven), and every branch the same length.

**Then the whole arrangement is turned 80° round the upright axis**, which changes nothing
about the spacing. The plain sphere put Search's label straight on Contact's as the map came
to rest (one in front of the hub, one behind, at the same place on the screen). The turn was
chosen by measuring: the map was loaded with the sphere turned by every ten degrees, held
still, and the gap between the two nearest labels read off the page. At 80°–90° it is
**81px** on a desktop, where the seven left 39px. On a phone, at 390px, two labels graze by a
few pixels at every turn there is — the seven only just touched there too — and the map
turns on its own, so it passes; nothing was changed for it.

Tested in `tests/node-map.spec.js`: the labels now include Note Library, the sphere test
counts eight and its closest pair is still over 60°, and `at rest, no two node labels
overlap` (more than 20px between the nearest two at 1440 × 900; fails with two nodes put in
the same place on the screen). Thirteen tests in the file.
