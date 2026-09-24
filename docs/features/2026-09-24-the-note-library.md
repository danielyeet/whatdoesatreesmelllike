# The Note Library

Date: 2026-09-24

Files touched: `categories/note-library.html` (new), `note-library.js` (new, ~810
lines), the `lib-*` rules at the foot of `style.css`, `nav.js` (a line in `SITE_LINKS`),
`search.js` (a note is findable, by any of its spellings), `search-page.js` (a line in
`PAGES`), `search.html` (a **Notes** filter), `tests/note-library.spec.js` (new), and the
page lists in `tests/menu.spec.js`, `tests/pages.spec.js` and `tests/mobile.spec.js`.

## What changed

A new page in the menu, **above Photography**: the **Note Library**. It holds every note
named in a fragrance anywhere on the site — 558 spellings, shelved as **346 records** on
**16 shelves** — each with a brief explanation of what it is. It is built as a library at
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

The site's notes are spelled 558 ways, and many are the same material: *Tonka*, *Tonka
Bean* and *Tonka Beans*; *Orris*, *Iris*, *Iris Butter* and *Iris Pallida*; a dozen ouds.
Each record carries the name it is shelved under and, in `data-aka`, every other spelling
the site uses for the same thing. The card lists them as **Also catalogued as**, the
terminal searches them, and so does the site's search ("iris butter" finds Orris). A
spelling may stand in one record only, and matching ignores case.

Where a house names something that is **not a material** — Almost Human's olfactory
landscapes (*Burning Silence*, *Glowing Dust*), Ataraxia's *Spinal Fluid* and *Gold*,
Tombstone's *Dead Water* — it is shelved under **Impressions** and explained as what the
house means by it, naming the house, rather than invented into a material. Where a house
names a material it does not explain (Pineward's *Edelwood Oil*), the explanation says so.

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
  away. It reads the names and every other spelling; and if the word is **in what a note
  is said to be**, that counts too — so "smoky" finds every note described as smoky, and
  "powdery" every powdery one. Near misses count only when nothing answers properly, or
  every short word would light half the room. **Enter** opens the best answer; nothing at
  all hands the question to the site's search.
- **The index** is a tab per shelf, which stands you in front of that shelf alone.
- **A–Z / Most used** reorders every shelf, keeping the call numbers.
- **Pull a random book** does exactly that.
- **The readout** across the top counts records, shelves, spellings and fragrances, and
  ticks up to them as the page arrives.

### The card

Beside the stacks, not over them: pressing another book turns the card over to it, and
the stacks stay in reach. It is ruled like an index card and carries the call number, the
shelf, the explanation (printed out quickly, as a terminal would; the whole sentence is
there for anyone reading it aloud), the other spellings, **Found in** — a bar per house
for how many of its fragrances use the note, then every fragrance by name, linked to where
it stands in its house (`#part-NN`) — and the books either side of it on the shelf. The
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

Twelve tests, each proved against the fault it guards:

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

## Known issues / TODO

- **The explanations are written here, not by the owner.** They are brief and meant to be
  argued with; each is one `<p class="lib-say">` in the page, to be rewritten in place.
- **The shelves are a choice made here**: sixteen families, with tobacco on Gourmand and
  the conceptual notes on Impressions. Moving a record is moving its `<article>`.
- **It is on the menu and not on the node map**, because which pages the map carries is
  the owner's to say.
- **On a wide window the card covers the right-hand end of the shelves** while it is open.
  The stacks are left where they are rather than squeezed aside, which would make every
  book jump.
