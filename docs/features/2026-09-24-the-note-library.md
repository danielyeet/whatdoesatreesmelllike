# The Note Library

Date: 2026-09-24

Files touched: `categories/note-library.html` (new), `note-library.js` (new, ~870
lines; ~990 by the last section), the `lib-*` rules at the foot of `style.css`, `nav.js` (a line in `SITE_LINKS`),
`search.js` (a note is findable, by any of its spellings), `search-page.js` (a line in
`PAGES`), `search.html` (a **Notes** filter), `tests/note-library.spec.js` (new), and the
page lists in `tests/menu.spec.js`, `tests/pages.spec.js` and `tests/mobile.spec.js`.

## What changed

A new page in the menu, **above Photography**: the **Note Library**. It holds every note
named in a fragrance anywhere on the site — 534 names as written, shelved as **330 records**
on **16 shelves** — each with a brief explanation of what it is. It is built as a library at
night read through a catalogue terminal: every note is a **book** standing on its
**shelf**, with its name down the spine and a **call number** on a label at its foot, and
pressing a book pulls it off the shelf and opens its **catalogue card**.

## The brief

> make an additional page on the menu, above photography called Note Library, where I
> want you to add all the notes that I have used so far, and give each a brief
> explanation. I want this to be a very creative page, with a design akin to a digital
> library. make sure its cool :)

## Why it is built this way

### The catalogue is the page's own markup

Every note is one `<article class="lib-record">` in the `<section class="lib-shelf">` of its
family, written into `categories/note-library.html` itself — not a data file the page
draws from. Three things follow, and they are the reason:

- **The site's search reads it for free.** `search.js` reads every page's contents off its
  markup; a library made by a script would be invisible to it.
- **It works without the script**, as a plain list of every shelf and record.
- **The owner can edit an explanation where it stands**, like every other piece of writing
  on the site, and the comment at the top of the page says how.

### One record, many spellings

The site's notes are written 534 different ways — the **names as written** in the
readout, which is what the owner asked about ("whats the 558": it was 558 before the
landscapes came out) — and many are the same material: *Tonka*, *Tonka
Bean* and *Tonka Beans*; *Orris*, *Iris*, *Iris Butter* and *Iris Pallida*; a dozen ouds.
Each record carries the name it is shelved under and, in `data-aka`, every other spelling
the site uses for the same thing. The card lists them as **Also catalogued as**, the
terminal searches them, and so does the site's search ("iris butter" finds Orris). A
spelling may stand in one record only, and matching ignores case.

Where a house names something that is **not a material** — Ataraxia's *Spinal Fluid* and
*Gold*, Tombstone's *Dead Water* — it is shelved under **Impressions** and explained as what the
house means by it, naming the house, rather than invented into a material. Where a house
names a material it does not explain (Pineward's *Edelwood Oil*), the explanation says so.

### Almost Human's olfactory landscapes are not in it

For one round they were: *Burning Silence*, *Glowing Dust*, *Digital Warmth* and the rest
stood on the Impressions shelf, explained in a line each. The owner asked for them to be
reconsidered, and the answer is that they are not notes at all. Almost Human publishes
five **impressions** per fragrance *instead of* a list of materials, and the rest of the
site already refuses to call them notes (see **the olfactory landscape** in CLAUDE.md).
So the library leaves the `landscape` lists out entirely: sixteen records went, and nine
spellings folded into real notes went with them (*Fading Ash* from Ash, *Warm Resins* from
Resins and so on). Almost Human's actual notes — the ones in its View notes window — are
counted as usual. A test says nothing that is only ever named in a landscape stands in the
library.

### Which fragrances use a note is worked out, not written

The page reads `notes-data.js` each time it opens and counts, for every record, the
fragrances whose notes name any of its spellings — top, heart, base, a flat list, the
second half of a two-part window, and a landscape. So a note added to a fragrance there is
counted here at once, with nothing to keep in step. A note named there that **no record
carries** is put on a shelf of its own at the end, the **returns cart**, until it is given
one — and the first test says that cart is empty. The fragrances' **names** are read off
their houses' own pages the first time a card asks for them, so they are never written
twice either. The one list kept in the script is `HOUSES`, which says where each house's
fragrances live; a test says every house in `notes-data.js` has a line in it.

### The books

*Folders since the end of 2026-09-24, quiet and coloured only on their tabs — see the last
section. What follows is the digital book they were for one round.*

**They are digital now** — the owner's "a little more digitalized version of themselves".
A book is dark glass lit from inside in its shelf's colour, with a hairline edge and its
top right corner cut off, fine scanlines across it, its name in the mono down the spine
with a glow on it, a **data bar** across its head filled by how much the note is used
(`--fill`, `FULL`), and at its foot a **barcode** of its own over its glowing call number,
where a paper label stood. A book flickers once as it comes under the hand, as a screen
does. The shelf is a lit rail rather than a board. The barcode is drawn off the name by a
small seeded generator: the name's hash alone gave near-identical patterns for names that
differ only at their end — half the books shared one — which the test caught.

- **A book's thickness is how many fragrances use it** (`THICK_*`): Bergamot and Musk are
  fat volumes, a note used once is a slim one, with a few pixels of seeded jitter so that
  books used equally are not all one width. The shelves read at a glance as which notes
  the site leans on.
- **Its height is its own** (`TALL_*`), seeded from its name so the stacks stand the same
  way every visit — and never shorter than its name needs.
- **The call number** is the shelf's code and the book's place on it, counted
  alphabetically — `WOO 007`. It is worked out, not written, and **it does not change when
  the books are reordered**: it is where a book belongs, not where it is standing.
- **Every shelf ends on a book leaning against the one before it**, as real shelves do.
- **Each shelf has a colour**, as a hue (`HUE`), and the books are only tinted by it: the
  room is a library at night, and sixteen loud colours would be a sweet shop.
- **Every row of books stands exactly `--row` high**, each book pushed down by what it is
  short of that, so the boards can be ruled under the rows by a background alone, however
  many rows the width makes. That is what lets the shelves wrap on any window.

### The terminal, the tabs and the order

- **The terminal** (`query>`) searches the whole catalogue as you type. Books that answer
  light up with a mark over them, the rest go dim, and a shelf with nothing on it folds
  away. **It matches direct words only** — the owner's rule: every word typed must BE a
  word in a note's name or one of its other spellings (a plural counts as the word).
  "cedar" finds Cedar Leaf, and Cedarwood, which is also spelled Cedar; half a word finds
  nothing yet. The first version was forgiving the way the site's search is — near misses
  counted, and a word in what a note was **said** to be counted too — so "smoky" lit every
  note described as smoky and "iris" lit Seaweed, by *Irish* Sea Moss. The owner asked for
  direct words, and a starts-with match would still have lit *Irish*, so it is whole
  words. **Enter** opens the best answer; nothing at all hands the question to the site's
  search, which is still forgiving.
- **The index** is a tab per shelf, which stands you in front of that shelf alone.
- **A–Z / Most used** reorders every shelf, keeping the call numbers.
- **Pull a random book** does exactly that.
- **The readout** across the top counts records, shelves, **names as written** (every
  different way a note is written in the site's notes — *Tonka* and *Tonka Beans* are two;
  it was labelled "Spellings", which the owner asked about) and fragrances, and ticks up to
  them as the page arrives.

### The card

Beside the stacks, not over them: pressing another book turns the card over to it, and
the stacks stay in reach. It is ruled like an index card and carries the call number, the
shelf, the explanation (printed out quickly, as a terminal would; the whole sentence is
there for anyone reading it aloud), the other spellings, **Found in** — set out as the
owner drew it: the **individual fragrances** first, by name; then **Houses**, and under it
each house named and only then its fragrances, every one linked to where it stands
(`#part-NN`) — and the books either side of it on the shelf. There was a bar per house
above the list for the first round, which the owner's drawing left out. The
address carries the book (`#note-cedarwood`), which is how the site's search sends people
straight to one. Escape or the × puts the book back. On a phone the card stands at the
foot of the window.

### The room

A **lamp** follows the pointer over the stacks (a soft light blended on top of them);
**dust** hangs in the air, drifting up and showing brighter near the lamp (`lib-ground`,
at the lower canvas ratio below 700px); and every thirteen seconds a faint **scan** passes
down the window. A book pulled out has a scan passing over it too. The page's accent is
the terminal's phosphor, `--lib-glow`, and is spent on the terminal, the tabs, a book that
answers and the card — nowhere else.

### The keyboard

One book in the whole stacks takes the tab; the arrow keys walk along the shelves, Home
and End go to the ends, and Enter opens the card, focused on its name.

### With animation turned off

The stacks are simply there, the readout is at its figures, there is no scan, and the
card and its explanation arrive at once. The dust is drawn once and stays still.

## How to test it

```bash
npm test -- tests/note-library.spec.js
```

Fourteen tests, each proved against the fault it guards:

- **`every note named in a fragrance has a record, and none is shelved twice`** — fails
  with a record renamed. Also that every explanation is more than a word or two.
- **`every fragrance a card lists links to where it stands in its house`** — fails with a
  house taken out of `HOUSES`.
- **`a card names the fragrances that use its note, read off their houses' pages`** — and
  arriving with a note in the address opens it, and Escape puts it back.
- **`the books stand on their shelves without running into each other`**, at three widths
  down to a phone, and the page never scrolling sideways — fails with the shelves not
  wrapping.
- **`a note used often is a thicker book than a note used once`** — fails with the
  thickness ignoring use.
- **`the terminal lights the books that answer and folds away the rest`** — another
  spelling (Blood Cedar, which is only in Cedarwood's spellings), a word in the
  explanations, Enter, and handing over to the site's search. Fails with the other
  spellings ignored. (It first tried "iris", which is also in Orris's explanation and so
  passed with the fault in place — hence Blood Cedar.)
- **`a shelf tab stands you in front of that shelf alone`**, **`ordering by use moves the
  books and keeps their call numbers`**, **`the shelves can be walked and opened with the
  keyboard`** (fails with Enter doing nothing).
- **`the site's search finds a note, by any of its spellings`** — fails with the search
  ignoring the other spellings.
- **`the library is there at once`** with reduced motion (fails with it ignored), and
  **`the catalogue is a plain list`** without JavaScript.

The menu test lists Note Library above Photography, the page is in the every-page and
phone lists, and by hand: `npm run serve`, open
`http://localhost:8123/categories/note-library.html`, search, press a book, try the tabs.

Added the same day, after the owner's first look:

- **`a card lists the individual fragrances first, then the houses, each house named`** —
  fails with the houses put first.
- **`every book carries a data bar and a barcode of its own`** — fails with every book
  given the same barcode.
- The terminal test now holds that "smoky" lights only notes CALLED smoky, that half a
  word finds nothing and "iris" does not light Seaweed — it fails with a starts-with match
  and with a match on the explanations — and the first test that no landscape impression
  is shelved, which fails with one put back.

Vestibule's notes were corrected by the owner later the same day (see [the newer
houses](2026-09-21-the-newer-houses.md)); four records came with them — Chocolate Cake
(with *Amandină* folded in), Cocoa Pod, Edamame and Root Beer — the other new spellings
were folded into the notes they are (*Chocolate Bar* into Chocolate, *Red Hot Chilli* into
Chilli, *Antique Shop* into Dusty Antiques, *Old Book* into Old Books), and four records
nothing uses any more went (Cake, Soybean, Beer, Old House).

## Known issues / TODO

- **The explanations are written here, not by the owner.** They are brief and meant to be
  argued with; each is one `<p class="lib-say">` in the page, to be rewritten in place.
- **The shelves are a choice made here**: sixteen families, with tobacco on Gourmand and
  the conceptual notes on Impressions. Moving a record is moving its `<article>`.
- ~~It is on the menu and not on the node map~~ — the owner asked for it on the map on
  2026-09-24, and it is the eighth node; see [the node map](2026-09-11-the-node-map.md).
- **On a wide window the card covers the right-hand end of the shelves** while it is open.
  The stacks are left where they are rather than squeezed aside, which would make every
  book jump.

## 2026-09-24, last — folders, and a lamp that lags

> fix the library. the books are too bright, and too annoyingly neony. so fix that. I also
> want you to make the light that follows the cursor have a slight delay like the cursor's
> square, so that it is smoother and not so mechanical. Maybe make them folders instaed of
> books; and make it so that the entire folder isnt coloured but a part of it? work with
> whatever is least tacky. Give me options if you dont have a specific answer. If you give
> me otions, provide pictures of what it would look like.

- **The books are folders now**, and only one part of each is coloured. The folder is a
  quiet graphite (`hsl(220 7% 13%)`, a shade either way per note) with a hairline edge;
  nothing on it glows — no inner light, no glowing lettering, no glowing call number — and
  the cut corner and the scanlines are gone. **The shelf's colour is spent on the tab**
  (`.lib-folder-tab`, made by the script) standing up off the folder's top edge, at one of
  three places along it in turn (`--tab-k`), as the tabs in a drawer of files are
  staggered. The data bar and the barcode are kept, in grey; the call number is grey; the
  shelf's rail is a plain light line; the shelf's code keeps its colour without its glow.
  A folder no longer flickers under the hand — it lifts, with a shadow. What answers the
  terminal still takes the phosphor, as a hairline rather than a glow.
- **Three were drawn, one shipped.** The owner asked for pictures of options: **A** quiet
  books with the colour only in a band at the head and foot, **B** folders with the colour
  only on the tab, **C** folders with the colour only down one edge. **B is what is on the
  page** — the tab is the one part of a folder that is made to carry a colour, and it reads
  as filing rather than decoration. A and C were rendered from B by a few lines of style
  each and were not kept; either is a small change to `body.lib-built .lib-record` and
  `.lib-folder-tab` if the owner prefers it.
- The wording follows: *Pull a random folder*, *Put the folder back*, and the comments at
  the head of the page.
- **The lamp runs a beat behind the hand**: each frame it closes `LAMP_LAG` (0.16, the
  cursor's own `LAG` in `nav.js`) of the way to the pointer, rather than being set to the
  pointer on every move. With reduced motion it stands where the pointer is.

Tested in `tests/note-library.spec.js`: `the records are quiet folders, coloured only on
their tabs` (reads every record's drawn colours: the folder near-grey with nothing glowing,
the tab coloured and different from shelf to shelf; fails against the old books) and `the
lamp follows the pointer a beat behind it` (fails against the old lamp). Sixteen tests in
the file.


## 2026-09-24, night — accords, a new figure, and digital files

> make the files still more digital in the notes library. Replace the word shelves with
> "accords". removes names as written. If you want give me other statistics that you can
> use here.

- **"Shelves" is "Accords"** wherever a reader sees it: the readout, the index's label
  (*Accords*, and *Every accord* on the All tab), the order buttons' label, the card
  (*Accord WOO — Woods*), the lede (*filed by accord*) and the comments at the head of the
  page that tell the owner how to add a note. **The code still says shelf** —
  `.lib-shelf`, `data-shelf`, `#shelf-woo`, `onShelf` — because those are names nobody
  reads and every test and link into the page uses them; *Old Books*' explanation keeps its
  *library shelves*, which are real shelves.
- **"Names as written" is gone** from the readout. In its place, **Most used**: the note
  the most fragrances name, worked out like everything else here — *Cedarwood, in 28
  fragrances* when it was written — set as a word rather than ticked up to, with what it
  counts under it (`.lib-readout-word`). Other figures that could stand here, offered to
  the owner rather than put up: notes named by only one fragrance; how many houses a note
  is found across; the average number of notes a fragrance names; how many notes come
  from a house's own page against Fragrantica.
- **The folders are digital files now** — and still nothing glows or takes a colour but
  the tab, because the last round's note was "too annoyingly neony":
  - a **pixel glyph** of each folder's own at its head (`.lib-glyph`): five pixels by five,
    drawn off the name by the same kind of seeded generator as the barcode and mirrored down
    its middle, as a file's icon is. Every lit pixel is a `box-shadow` of one 3px square, so
    a glyph is one element; the top left pixel is the square itself (a shadow is never
    drawn under its own box). `data-cells` carries which are lit.
  - the **meter** under the tab **segmented**, like a level meter (a repeating mask), and
    a pixel taller;
  - a fine **dot screen** over the folder's face;
  - the tab's corners **stepped** a pixel at a time rather than rounded (`clip-path`);
  - and the name **decoding** under the hand (`decode()`): for 420ms it is a run of stray
    characters settling, left to right, into the name. It is drawn **over** the name — the
    name is set transparent and `data-code` shown by a `::after` — so the name itself, which
    the search and a screen reader read, never changes. Nothing with reduced motion.
  To make room for the glyph the name starts 34px down rather than 16, and the folders and
  the rows are 18px taller (`TALL_MIN` 140, `TALL_MAX` 204, `--row` 214px).

Tested in `tests/note-library.spec.js`, both failing against the page before:
**`the page says accords rather than shelves, and no longer counts names as written`** (the
four figures by name, Most used checked against the folders' own counts, no *shel* in
anything a reader sees, and the card's *Accord WOO*) and **`every folder is a digital file:
a pixel glyph of its own, a segmented meter, a name that decodes`** (a glyph on every
folder and over 80% of them different, the meter masked, and Vetiver decoding under the
pointer with its own text untouched and back once it has finished). Eighteen tests in the
file.


## 2026-09-24, late night — the card's lists as dropdowns

> Something I want you to do is also add the ability to make everything a dropdown list in
> the library of notes. I want you to be able to do a dropdown list of houses, then of
> pineward and then only see the individual fragrances. I think that way it would be a lot
> less chaotic.

The catalogue card's **Found in** is dropdowns now, all shut when the card opens: **Individual
fragrances** and **Houses**, each with how many are inside at the far end of its line;
Houses opens onto the houses, each with its own count; and a house opens onto its own
fragrances. **Also catalogued as** is one too. They are real `<details>`, so they open by
keyboard, and a small triangle turns as each opens (`.lib-drop`). **What was left open
stays open when the card turns over to another note** (`opened`, keyed by group and house),
so going along the stacks does not mean opening Pineward every time. The class names the
earlier tests read — `.lib-found-head`, `.lib-found-housename` — are kept, on the names in
the summaries, with the counts beside them rather than in them.

Tested in `tests/note-library.spec.js`: **`the card's lists are dropdowns: houses, then a
house, then its fragrances`** — Cedarwood's card opens with nothing open and no fragrance
showing; Houses shows the houses and still no fragrance; Pineward shows exactly Pineward's,
and its count says how many; and turned over to Vetiver, Houses and Pineward are still
open. Fails against the card before. Nineteen tests in the file.

## 2026-09-25 — books drawn in specks, more air, and a card of lines

> As of now, the library feels crowded, I want you to stylistically make it more
> breathable. Im not sure how, but for the logos on the books I feel are unneccessary. I
> would also like you to make it feel less 3-bit. The popup windows on the left also feel
> too futuristic. fix that, make it like the rest of the site: themed with particles and
> geometry. The books should follow the same pattern. if you can somehow make them out of
> particles but actually look like books, with appropriate colours, might be pretty nice.
> If it doesnt look good (you can send screenshots and i can decide for myself), then we
> can redesign the books themselves.

**Everything "digital" is out of the code**: the pixel glyph (`.lib-glyph`), the segmented
meter (`.lib-bands`, `FULL`), the barcode (`.lib-code`), the dot screen, the folder's tab
(`.lib-folder-tab`), the name decoding under the hand (`decode`, `NOISE`, `is-decoding`),
the scan passing down the window (`.lib-scan`) and the scan over a pulled-out record. The
records are **books** again.

- **A spine drawn in specks** (`drawSpine`, a `canvas.lib-spine` in every book), in the
  cloth its accord is bound in (`CLOTH`: citrus an ochre, the herbs a sage, the greens a
  green, the flowers a faded rose, the woods a walnut, the airs a slate blue, and so on),
  each book a shade off its neighbours. Rounded by a light from the left and shadowed at
  the far edge, a lighter head-cap, the tail darker where it stands, two **raised bands**
  (a lit ridge with a shadow under it) at head and foot, and on about half a **gilt rule**
  inside each band. At the foot a **library label** — a small square of cream specks — with
  the call number printed on it in dark ink, as a library's own books carry one. Seeded by
  the note's name, so every book is its own and the same every visit; drawn as each comes
  within 700px of the window (`IntersectionObserver`), so three hundred canvases do not
  hold up the arrival; specks of one shade drawn together.
- **More air.** The accords further apart (`padding` 60/42px, a 210px plate, 48px between
  the plate and the stacks), the rows of a shelf 52px apart, and 6px between books.
- **The card, in lines and specks** rather than glass: a hairline edge with a registration
  tick at each corner (in the card's own background, so they stay put while it scrolls),
  no lit bar along its top, no glow, no blur behind, the call number plain with a rule
  under it — and at its head **the mark** (`canvas.lib-card-mark`): a ring of specks, one
  for every fragrance on the site that uses the note, joined one to the next by hairlines,
  turning slowly in a cloud of its accord's dust, a registration cross at its centre and
  a ticked rule run in to it from either side. Still with reduced motion.
- **The slip** naming a book is a hairline box with a tick at two corners and a leader run
  down to the book, with no colour on its edge.
- "Pull a random folder" says **book**, and so does the card's close.

Tested in `tests/note-library.spec.js`, three tests replacing the three about the folders:

- **`the books are drawn in specks, in their accords' colours, and carry nothing
  pixelated`** — none of the digital parts anywhere; with two accords in the window, every
  book near it has its spine drawn, in more than forty shades (specks, not a fill), and the
  two accords' mean colours well apart.
- **`the card is hairlines and specks rather than glass`** — no backdrop blur, no inset
  glow, no top border over 1px, no glow on the call number, and the mark drawn.
- **`the shelves breathe`** — rows 48px or more apart, books 5px or more, 56px or more
  above every accord.

Nineteen tests in the file. The screenshots were sent to the owner to decide on the books,
as they asked.
