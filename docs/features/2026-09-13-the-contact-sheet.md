# The contact sheet

Date: 2026-09-13 (`ae98c28`, *Lay the scent descriptions category out as a contact
sheet*), redrawn in specks in `52d6f76` on 2026-09-16 and last worked on in `69f96ee`
and `0e3b8b4` on 2026-09-17. Migrated from CLAUDE.md on 2026-09-17.

Files: `categories/scent-descriptions.html`, `contact-sheet.js` (~1,360 lines), the
`sheet-*` block in `style.css`, `tests/contact-sheet.spec.js`

## What it is

The **houses** view of `categories/scent-descriptions.html`: one picture per house —
thirteen of them at the time of writing, of which two are written up — scattered across
the page and joined by dated lines, all of it drawn in specks.

The page opens white with one square window in the middle; every picture in the
category flicks through it on hard cuts, fast at first and slowing to a stop; it lands
on the first one, which stays exactly where it is; the category names itself beside the
Menu; then lines reach out across the page at whatever angle they need, each carrying a
date, and each of the other pictures appears as its line lands on it.

It is one of the two views of that page — see
[the index pages and the two views](2026-09-17-the-index-pages-and-views.md) for the
switch between them.

## Everything on it is drawn in specks

Three rules come with that.

- **A picture is RULED, and specked only where the map is tied on to it** (`edgeChain`,
  `TUFT_REACH`). It was bounded by a chain of specks round its whole edge and nothing
  else for one round, and the owner asked to "revert back to the normal classic bold
  border of the pictures themselves, only embellishing on the areas which are connected
  to the particles" — so `.sheet-frame` carries its own border again, and the specks are
  a **tuft**: small squares joined with fine lines, drawn only within `TUFT_REACH` (42px)
  of a point where a line is tied on and fading out along the edge as they go. A picture
  no line reaches carries none at all. The corners are landed on exactly: a square whose
  corners are guessed at reads as a blob. Which specks stand off the chain has to be
  **uneven** (`LOOSE_ODDS`) — every fourth one pushed out came out as a saw-tooth frill
  round each picture rather than as a net.
- **A line between two pictures is a STRUCTURE, not a scatter** (`routeRun`): two or
  three parallel rails of specks (`RAILS`), evenly spaced along their length
  (`ROUTE_EVERY`), with rungs across them every `RUNG_EVERY` specks, drawing together
  into a **knot** of specks at each end where the line is tied to a picture (`KNOT`,
  `KNOT_SPREAD`). The rails PINCH — furthest apart in the middle (`RAIL_GAP`), meeting
  at the two tie points — so a line leaves a picture from one place rather than from a
  smear along its edge, and the knots are what the owner asked for when they said to
  "emphasize and compact the areas of where the lines connect to the boxes". Evenly
  spaced on purpose: scattered about the line a run reads as a smudge; ruled like this
  it reads as something built. A speck may stand up to `RAIL_OFF` off its own rail, and
  no more — that little unevenness is the owner's "slightly more dispersed", and neither
  end is ever wandered, or a line would stop somewhere other than where it points.
- **A line between two pictures is a run of specks, not a stroke.** The
  `<line class="sheet-route">` elements are still there and still carry `data-from` /
  `data-to` and their own coordinates — they are the MAP, which the dates ride on and
  which anything reading the page (including the tests) uses to know what joins what —
  but they are not stroked. The specks are the drawing; the SVG is what it is drawn
  from.

**Nothing moves until something is pointed at.** Where a speck stands is worked out
from what it belongs to and its number along it (`wobble`), so the same speck is in the
same place on every redraw and a resize moves the map rather than re-rolling it into a
different pattern. The canvas stands in the sheet's own coordinates, so it is carried up
and down with the page.

## Pointing at a picture isolates it

`HOT_*`, `COLD_INK`. The specks belonging to a picture — its own tufts and the runs tied
to it — come loose and drift about their own places, drawn a little softer (`HOT_BLUR`)
and a little heavier (`HOT_LIFT`), while every other speck and every other picture steps
back to `COLD_INK`. **The picture itself does not move by a pixel**, and
`tests/contact-sheet.spec.js` compares every frame's transform and box before and during
to make sure of it. The drawing is still still: the loop runs only while something is
hot or cooling, and stops again.

**A picture used to tip in three dimensions towards the pointer instead**
(`perspective()`, `--turn-x`, `--turn-y`, `--lift`, and `.peeking` on the sheet). The
owner asked for no reactivity at all and that came out outright; the page then answered
nothing for two rounds, and this isolation is what they asked for in its place. The
frame's own transform is now only the `translate()` that places it. Don't put the tip
back.

## The spread, and watching it draw itself

- **The map draws itself outwards and is meant to be watched doing it.** A line travels
  to a picture, the picture comes up over a moment rather than in one frame, and only
  after a pause do that picture's own lines set off — one at a time
  (`OUT_STAGGER_MS`), or the five leaving the middle would all go at once and five
  pictures would appear in the same instant, which is the one thing the spread must not
  do. `ROUTE_AFTER_MS`, `ROUTE_MS_PER_PX`, `LINK_DELAY_MS` and `OUT_STAGGER_MS` are the
  whole of its pace; it takes about four seconds to reach the bottom of the page. The
  flick is the exception and keeps its hard cuts: that is the film going past, not the
  map being drawn.
- **The sheet says when it has finished** by taking the class `drawn` — and that is not
  the same moment as every picture having `landed`, because a line that closes a loop
  lands after the picture at the end of it already did. Tests wait for `drawn`.
- **When each line sets off is worked out by going over the links until nothing
  changes**, not in one pass — a link's start depends on when the picture it leaves from
  was reached, and the links are not necessarily in an order where that is already
  known.
- **Links are planned once**, on the first layout, and later layouts (a resize, the
  fonts arriving) only move the lines that already exist. Rebuilding them throws away
  the elements that are mid-draw, which is what stopped any line at all from appearing
  the first time this was written.
- **A line used to arrive slack and be pulled taut**, hanging between its two pictures
  like a rope. The owner asked for that gone and it came out outright: there is no
  `SAG`, no `TAUT_MS` and no slack anywhere in the file, and the test that watched it
  went with it. The spread is still the longer, smoother one it was lengthened to.

## The flick

- **The page opens on the picture it will land on, and holds it** (`FLIP_HOLD_MS`,
  250ms). The flick used to start in the same frame the script took over. A quarter of a
  second of the first picture before anything moves reads as a projector being started
  rather than as a page loading, which is the delay the owner asked for.
- **And that quarter second is that picture and NOTHING ELSE.** Everything the page
  carries — the other pictures, the two buttons, the category's name, the Search, even
  the Menu — is held back under `js-coming` until the sheet has been laid out, and the
  chrome arrives only when the sheet has finished drawing itself. Two things used to
  leak through and both are worth knowing about:
  - **The Search was a direct child of `<body>`**, which the rule that dims the page
    behind the menu outranks anything written for. It is inside `.sheet-head` now, with
    the buttons, for exactly that reason.
  - **The second view was painted while the browser waited for the script that hides
    it.** A script at the foot of the page is a fetch, and the parser is free to paint
    what it has while it waits — so for one frame, every time, the whole index was on
    screen. What a page opens as has to be true in the MARKUP: that view carries
    `hidden` in the HTML, and `views.js` only takes over from there.
- **The flick is set up to END on the first picture** rather than cutting to it when the
  flicking is over. It counts its own cuts before it starts and begins at whichever
  picture makes the last one land there. Cutting at the end is one blink too many: the
  run has to simply stop.
- **Anything that hides an un-landed picture must be written under `.settled`.** Every
  picture takes its turn in the middle window during the flick, so a rule aimed at the
  pictures' arrival (`opacity: 0` until `.landed`) hides the flick itself — the window
  goes blank for three seconds. That is a bug this page has actually had. The test that
  should have caught it was asking whether the frame was `visibility: visible`, which it
  was; it now asks whether you could actually see it.

## The scatter, and which pictures are joined

- **The scatter never overlaps.** Each picture is given a square of its own on a grid
  with far more squares than there are pictures, and wanders only inside that square
  (`CELL_JITTER`), so the arrangement is irregular but nothing can ever land on anything
  else. The room a picture's caption needs is part of its square, so nothing is printed
  over anything either. Each row is given a little more room than the one above it
  (`ROW_OPEN`, 0.07), so the sheet opens out as it goes down rather than bunching up —
  gently: at 0.16 a third of the map was empty space.
- **The pictures are filled into their squares in reading order.** Which squares are
  used is the scatter — shuffled, with far more squares than pictures, which is what
  leaves the gaps — and then the squares that were picked are sorted top to bottom and
  filled in the order the pictures stand in the page. The owner asked for the sheet to
  run 1 to 13 down the page without the look of the scatter changing, and that is
  exactly what this is: the same squares, filled in a different order.
- **A line is only drawn where nothing is in the way.** Lines go at any angle, so the
  layout no longer keeps them clear of anything — instead a link that would cut across
  another picture, or across any caption (including the captions of the two pictures it
  joins), is not made at all, and the picture it would have reached is left unlinked. A
  caption is printed on white, so a line behind one is knocked out where it crosses and
  pokes out beside the word as a stray stroke, which reads as a mistake in the
  lettering. `tests/contact-sheet.spec.js` checks both, segment against rectangle.
- **Not everything is joined up — but nothing is left out, and there are no islands.**
  Each picture links to one of its nearer neighbours (`LINK_NEAREST`), some links are
  dropped on purpose (`LINK_DROP`), and a few extra ones are added across the map
  (`LINK_EXTRA`) so it closes loops: a network rather than a family tree. Dropping links
  leaves two kinds of orphan behind, though, and both read as forgotten rather than as
  loosely joined: a picture with no line at all, and — less obvious and just as wrong —
  a pair or a huddle joined only to each other with no way back to the rest of the
  sheet. So the parts are counted (which picture can already reach which) and then sewn
  together: every possible line is tried shortest first, and any that joins two parts
  that could not reach each other and has a clear run is taken. A test checks the sheet
  comes out as one network.
- **And no picture is left on the end of a single line.** One line is a dead end — the
  map stops there rather than carrying on — and with four of the thirteen like that it
  read as a handful of stubs rather than as a route you could follow. A picture with
  only one line is given a second, to the nearest picture it has a clear run to and is
  not already joined to. Those are not tree links: both ends are already on the map by
  then, so they close loops rather than carrying the spread, and the map still arrives
  outwards in order.
- **A picture in a corner with a long caption can have no clear run at all** —
  everything below it is behind its own caption and there is nothing above it — so that
  search is made twice: properly first, and then, only if the first found nothing, again
  allowing the line to pass over *that picture's own* caption. It is the one place on
  the sheet where a caption may be crossed at all, and it is the better of two faults: a
  stroke running out from under a picture's own words still reads as belonging to it,
  where a picture with one line reads as the map having given up. It came up the moment
  the pictures were put in reading order and the second one landed in the top right
  corner with a three-line caption under it.
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
  crowded page that is the difference between a map that joins up and one that falls
  into islands. On a very narrow window the pictures end up in a column and there may be
  no clear run left between two parts of the map; a line through a picture is worse than
  an island, so there it stays in parts.
- The scattered look comes from a **seeded** generator (`SEED`), reset at the top of
  every layout — so the arrangement is the same on every visit and doesn't rearrange
  itself when the window is resized, which would read as a fault rather than a design.

## The dates on the lines

- **Every line carries a date.** A line without one reads as unfinished beside the ones
  that have them. A short line cannot hold ten characters at the ordinary size
  (`DATE_SIZE`) without the lettering reaching past the end of its own line and onto the
  picture there, so a short line is written *smaller* rather than left bare — and how
  wide the words actually come out is measured with `getComputedTextLength()` rather
  than guessed at, because that depends on the font and the font is not ours to predict.
  The white halo that knocks the line out behind the lettering is scaled with the size.
  A line shorter than `LABEL_MIN` carries none at all.
- Dates sit at a different fraction along each line rather than always at the halfway
  point, because two lines crossing near their middles would otherwise print their dates
  on top of each other; a line with barely room for its date is the exception, since
  there is nowhere to slide it to. Each one is **written** rather than switched on: the
  lettering is uncovered from its left end by a `clip-path` that opens as the line lands
  (`clip-path` does clip SVG text, which is what makes this possible without drawing the
  word twice).
- **Testing whether a date is clear of a picture means testing its own turned
  rectangle**, not the upright box around it. A date written along a diagonal fills a
  fraction of that box, and testing the box calls a perfectly clear date a collision —
  which is what the first version of that check did.
- **A date label is moved on a later layout, never made again.** Every layout used to
  append a fresh `<text>`, which left the old one in the drawing — covered over by its
  own clip-path and so invisible, but piling up one per link on every resize, and
  restarting the writing from nothing when the window was only resized.
- The dates themselves are random, generated from the same seed.

## The page around it

- **The pictures are the `<a class="sheet-frame">` blocks in the page.** Adding one is
  an HTML edit; nothing in the script changes. The first block is the one it lands on.
- **The page carries no title.** The two buttons are the whole of its chrome: fixed
  across the top between the Menu on the left and the Search on the right, and they
  arrive only once the page has finished drawing itself — the page puts itself together,
  and then hands you the controls. The `<h1>` stays in the markup, out of sight, because
  a page with no heading at all is a page nothing can announce.
- **The number in the corner is not part of the placeholder.** It is the frame's number
  on the sheet, printed on its own white chip, and it stays once a real picture is in
  the frame — only the hatching goes. A test puts a picture into a frame and checks the
  number survives it.
- **The category names itself small beside the Menu** (`.page-where`), since the page
  carries no title: a hairline rule and then the name, in the same mono as the rest of
  the chrome, arriving with it. The theories page carries the same mark, written by
  `structure.js`. Both are hidden below 720px, where the buttons in the middle of the
  chrome reach back far enough to print over them.
- **The pictures are placed by the first layout, not slid into it.** `.sheet-frame`
  carries a transform transition, and with it running every picture glided in from the
  corner of the sheet as the page opened. The script puts `placing` on the sheet for
  that one layout, which takes the transition off, and removes it on the next frame.
- **The map hangs below the chrome rather than starting under it** (`.sheet`'s top
  margin). The Menu, the two buttons and the Search are fixed across the top and stay
  where they are; the sheet is what sits lower.
- **Room is kept for the scrollbar from the start** — `scrollbar-gutter: stable`, on
  pages carrying a sheet only. The page grows a lot taller the moment the sheet lands,
  and on a browser with ordinary scrollbars that made one appear, which took 15px off
  the width and shifted everything centred on the page sideways at exactly the moment
  the flick stopped, so the whole thing looked like it twitched.
- **The buttons live inside `.sheet-head`, and the two views inside `.views`, and they
  have to.** Every direct child of `<body>` is given an opacity transition by the rule
  that dims the page behind the menu, and that rule outranks anything written for a new
  element — so anything loose in the page cannot be hidden without being seen fading
  away first, and its fades would be that rule's rather than its own. Wrapped, they are
  their own. This has now caught two features; expect it to catch the next one.
- **The page's own markup is never shown on the way in.** `scent-descriptions.html`
  carries a line in its `<head>` that marks the document `js-coming`, and the stylesheet
  holds `.views` out of sight while it is set; `contact-sheet.js` clears it the moment it
  has laid the sheet out. Without it the browser paints the page as written — every
  picture in a plain grid — and then has all of it swept away, which reads as the page
  blinking its whole contents at you before it starts. That was a reported bug. It
  clears itself on `window.load` too, so a blocked or broken script leaves the plain grid
  as the page rather than hiding it for good. `visibility`, not `display` or `opacity`:
  the sheet measures its own captions on the first layout, and something with no layout
  box measures nothing.
- **Without JavaScript the page is a plain CSS grid of those same frames**, captions and
  all — a working page. The script puts `.scripted` on the sheet and takes over, and
  every rule that hides something is written under that class so the fallback can't
  inherit it.

## This page's own search

The field at the top right matches what a picture is called and dims everything that
doesn't. It can answer for the whole category, since the Fragrances view carries every
fragrance in the page; what it cannot answer it hands to the search page. See
[the search](2026-09-17-the-search.md).

## The removed second view

This page **once carried a different second view**, behind two differently-named
buttons: the **register**, in a `favorites.js` — a page ruled edge to edge with tracks,
squares travelling along them and a glitch that tore it sideways. The owner asked for
that view and its buttons gone and they went outright: there is no `favorites.js`, no
`.gallery` and no `tests/favorites.spec.js` anywhere in the site, and the chapters and
favourites it used to carry live only in [the chamber](2026-09-15-the-chamber.md) now.
What has come back is the *pair of buttons*, with different names over different views.
If the owner says "Favorites view" or "Description portfolio", they mean the removed
one.

## How to test it

```bash
npm test -- tests/contact-sheet.spec.js
```

Twenty-five tests, and they are the closest thing this page has to a specification: the
flick ending on the first picture and leaving it where it was; the search matching a
picture by name; every line stopping just off the two pictures it joins; no line
crossing a picture it is not pointing at; no picture left with nothing joined to it; the
pictures arriving one after another rather than together; nothing shifting sideways when
the page grows; the two buttons arriving only once it has finished drawing itself; a
frame keeping its number once a real picture is put in it; the whole map being one
network with no picture and no island left out of it and no picture on the end of a
single line; a picture being ruled with specks only where the map is tied on to it; a
line between two pictures being a run of specks rather than a stroke; the page opening on
the picture it will land on and holding it; pointing at a picture isolating it without
moving it; the specks standing still when the page is scrolled and travelling with the
page rather than the window; nothing on the sheet answering the pointer at all; the
category naming itself only once the page has drawn itself; every line carrying a date
with none of them landing on a picture; a date being written along its line rather than
switched on; the page never showing its own contents before the sheet takes over; the
pictures being placed rather than slid in; the pictures running in order down the page;
and the plain grid still being there when the script is blocked.

## The trace, and the dark ground

A later round, on the owner's notes: *"completely rework the connections between the
different houses. I want the actual squares to keep their place... minimal, futuristic,
and interesting"*, *"model the page in a more interesting way rather than just blocks on
white"*, and *"hovering these... the page lags out a lot. Fix that."* The pictures are
where they were; everything between and behind them is new.

### What a connection is now

A line between two pictures used to be a **truss**: two or three ragged rails of specks
with rungs across them and a knot of specks crowded at each end, and a tuft of the same
round every picture where a line tied on. In its place:

| | |
|---|---|
| **the trace** | One hairline from picture to picture, broken into even dashes (`DASH`, `DASH_GAP`) — a measured line off a technical drawing rather than a drawn one. **Straight**, because the geometry of the map is the interesting part and an elbow would only hide it. |
| **the pulse** | A short run of those dashes lit and travelling the length of the trace (`PULSE_*`), each on its own clock off `wobble`, so fourteen of them never fall into step. |
| **the tie** | A small open square where a trace meets a picture, with a stub of line into the edge — the registration mark the rest of the site uses, doing the job the knot and the tuft used to. |

Pointing at a picture still isolates it, and still without moving it: the traces tied to
it are drawn more plainly and their pulses run faster (`HOT_LIFT`, `PULSE_HOT`), and
everything else steps back (`COLD_INK`).

### A date is slid to somewhere clear, not just along

Every trace carries a date, written along the line and knocked out of it. Where on the
line was a **random slide** between 0.38 and 0.64, and the reason was dates colliding with
each other: two lines crossing near their middles would print their dates on top of one
another, and sliding each along its own line by a different amount is enough to keep them
apart without working out where they all are.

**That was not enough once a third house went on the sheet.** A line never crosses a
caption — `clearBetween` refuses it — but the lettering is set *above* its line (`dy`) and
has a height of its own, so a date can poke into a caption the line itself cleared by a
hair. Adding Almost Human changed the scatter and one date landed on a caption; the test
caught it.

So the slide is **searched** rather than taken: the random one first, then a spread of
others along the same line, and the first that stands clear of **every** caption on the
sheet wins. If none is clear the random one is kept, because a line without a date reads
as unfinished beside the ones that have them.

Two things about it worth not undoing:

- **`random()` is called exactly once**, whatever the search does. It is the sheet's own
  seeded roll, and taking a different number of turns of it would lay the whole sheet out
  differently.
- **The band tested is wider than the lettering on both sides**, rather than worked out
  from the baseline. Erring outwards only moves a date along its own line; erring inwards
  prints it on somebody's caption.

### Why the page used to lag, and what must not come back

Two things, and the first is the one that mattered:

- **`ctx.filter = "blur(...)"` on the canvas.** The hot picture and its lines were drawn
  through a canvas blur to soften them. A canvas filter is a full offscreen pass *per
  call*, and there was one call per picture and one per line, every frame — so pointing
  at a picture dropped the page to a crawl. **There is no `ctx.filter` in this file any
  more.** If softness is ever wanted again it has to come out of what is drawn, not out
  of a filter.
- **Every speck of every rail was rebuilt every frame.** `routeRun` and `edgeChain`
  generated their arrays inside the paint loop. A trace is a straight line and a phase
  now, and drawing one is arithmetic — nothing is allocated per frame.

Measured after: **61fps while hovering a picture**, on the same machine that produced the
complaint.

### The ground

The sheet was white. It is a dark drawing board now, with the squared plan the site's
other technical pages use laid faintly over it. It is done by **redefining `--bg`,
`--bg-2`, `--line` and `--muted` on `.sheet-page` alone**: every rule for this page
already draws in those tokens, so flipping the four turns the whole page over at once and
changes nothing anywhere else on the site. The menu overlay sets its own colours outright
and is not touched by it. The canvas's own `INK` had to be flipped to match, and the
knock-out behind a number, a caption and a date is `var(--bg)` rather than `#fff` — which
is what keeps a date readable where it crosses its own line.

The page carries `dark-surface` so the cursor can see it.

### What the tests hold to

The two that pin this down are worth reading before touching it again: **a line between
two pictures is still a run of ink with page showing between** (the dashes satisfy it,
where a solid stroke would not, which is one reason the trace is dashed rather than
drawn), and **a picture carries ink only where the map is tied to it** — the tie mark is
what that measures now, and it was sized up once because the first version of it sat a
hair under the threshold.

## White again

The dark ground lasted one round. The owner's note was exact about what to keep:
*"flip the colours, make it white. Otherwise, the page itself looks really good. Keep the
format and the locations and so on."*

So everything the dark round brought — the traces, the pulses, the ties, the scatter, the
flick, the plan laid faintly over the ground — is untouched, and only the tone turned
over. It was a five-line change: the five tokens on `.sheet-page`, the canvas's `INK`
back to near-black, and `dark-surface` off the body. **That is the argument for setting a
page's colour as tokens on its own body class** rather than writing the colours into the
rules — it made a change of mind cheap in both directions.

## The first two photographs

Frames 01 and 02 carry real pictures now — Pineward's bottle on moss, and ADAR's title
page — in place of the hatched placeholders.

**They are served from scaled copies, and this matters.** The files as uploaded are
19MB (5152×7728) and 6MB (3873×3873). A frame on this sheet is a few hundred pixels
square, so those are roughly twenty-five times more picture than the page can show — and
at full size the two of them together **starved this page's opening of frames**: the test
that watches the flick being held on its first picture began failing consistently, because
fewer than five frames were rendered in the first 200ms while the browser decoded them.

The originals are kept exactly as they arrived and nothing points at them; the page loads
`-web` copies at 1600px on the long side (0.2MB each, a 99% saving). `images/README.txt`
says so, and says to do the same for the next one. **If that test ever starts failing
after a picture is added, this is the first thing to check.**

## The reel, and the picture that was shown three times

The owner, after the photographs went in: *"when I restart the page, the Pineward
fragrance flashes twice."* They were right, and it had been true since the flick was
written — it only became visible when a frame stopped being a hatch.

The flick used to walk the pictures by index, wrapping with a modulo, starting at
whichever index made the arithmetic come out. So the first picture was shown **three
times** on every load, which a frame-by-frame recording of the opening makes plain:

| | |
|---|---|
| ~850–1100ms | held at the start, on purpose (`FLIP_HOLD_MS`) |
| ~1383–1449ms | **66 milliseconds in the middle of the run** — the bug |
| ~3980ms on | landed on |

With a hatch in all fourteen frames nobody could tell one from another. With a photograph
in the first one, that 66ms appearance reads as the page flashing it.

**The reel is now worked out in full before the first cut**: every picture *but* the one
it will land on, cycling, and then that one last. Two things fall out of it, and both
are the point — the landing picture is seen at the start and at the end and never in
between, and because the reel *ends* on it, `settle` showing it is not a cut, so there is
no last blink either. That second property used to depend on modular arithmetic that did
not quite hold: the run actually ended on the last picture and settling cut to the first.

The opening hold stays, and should. It is 250ms of the picture it will land on before
anything moves, and it is **the owner's own request** — "a quarter of a second of the
first picture before anything moves reads as a projector being started rather than as a
page loading". If they ever ask for the reel to start cold, that is the constant to
change, and `tests/contact-sheet.spec.js` guards it.

## A caption is a name, and the rest only when pointed at

The owner: *"I want it to only display the house name, and only when hovered, it would
display the rest, such that without hobering it would display 'Pineward', with hovering
'the house that smells like trees'"* — and, in the same note, that the writing must stop
getting in the way: *"currently, the ADAR page description overlaps with the line
connecting ADAR and 05"*.

Both come out of one arrangement. A caption is now two spans:

```html
<span class="sheet-caption"><span class="sheet-name">Pineward</span><span
  class="sheet-say">the house that smells like trees</span></span>
```

and **the say is taken out of the flow**. That is the whole of it. `.sheet-say` is
`position: absolute`, so `getBoundingClientRect()` on the caption measures the **name**
alone — and that rect is what `captionBox()` reserves and what every line on the map is
routed around. A long say used to cost the map a line; now it costs it nothing, because
as far as the layout is concerned it is not there until it is wanted.

Three details that make it work rather than merely look right:

- **It answers `hot` as well as `:hover`.** `hot` is the drawing's own word for the
  picture under the pointer; `:hover` and `:focus-within` are what answer when the script
  is not running, so the say still works on the plain page.
- **It prints on the page's own ground**, like the caption above it, so a line passing
  behind it is knocked out the way a name on a map knocks out what it crosses. While a
  picture is being pointed at the sheet is `holding` anyway, which already takes the
  lines back to 0.4.
- **On the settled picture the say goes above the name, not below.** That caption is
  printed inside the print's own bottom corner, and below it is off the bottom of the
  picture.

A caption written as plain text with no spans inside it — which is what the empty frames
have — is simply always printed.

**Keep the space between the two spans.** `contact-sheet.js` searches on the caption's
own `textContent`, and butted together they read `Pinewardthe house that smells like
trees` — which no search for "Pineward the" can match. Three tests caught this, which is
the only reason it is written down here rather than shipped.

## Known issues / TODO

- **Frames 01 and 02 carry photographs; the other twelve are still hatched
  placeholders**, each with a commented-out `<img>` pointing at the generic
  `../images/your-picture.jpg`. Uncommenting one means writing its own folder in (e.g.
  `../images/ADAR/`) and pointing it at a scaled copy, per "The first two photographs"
  above. A frame keeps its number once a real picture is put in it — there is a test for
  that.
- The look of this page is a live subject; the owner has asked for several rounds on it
  and may ask for more.
