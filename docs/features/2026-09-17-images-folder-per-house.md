# A folder of pictures per house and category

Date: 2026-09-17 (`aa55557`, *Give each house and category its own folder of pictures*)

Files: `images/` (the `ADAR/`, `Pineward/`, `Favorites/`, `Individual Fragrances/` and
`Theories/` folders, each empty one carrying a `README.txt`; `images/README.txt`),
`houses/adar.html`, `houses/pineward.html`, `works/theory-01.html`, `works/theory-02.html`,
`works/theory-03.html`, `adar.js`

## What it is

`images/` was one flat pile of files. It has a folder per house or category now, and all
fourteen pictures presently on the site live in `images/ADAR/`, since every one of them
is ADAR's — the thirteen its fragrances ask for (the two extra ADHD photographs
included) and the house's own mark. Everything that names a picture points there: the
twenty-four live `<img>` tags on `houses/adar.html`, the sigil `adar.js` draws inside the
void, and the commented-out placeholder tags on the Pineward and theory pages. The four
folders with no pictures in them yet each carry a `README.txt` saying what belongs
there.

## Why / key decisions

- **One folder per house, not per kind of picture.** The site's shape is house →
  fragrance, so the pictures follow the writing. Adding a house means adding a folder,
  and nothing has to be renamed to avoid a clash with another house's `01.png`.
- **The empty folders carry a `README.txt` because git does not store an empty
  directory.** Without a file in it the folder would simply not exist on a fresh clone,
  and the first person to add a picture would have to recreate it with exactly the right
  capitalisation. The README is doing two jobs: saying what belongs there, and holding
  the folder open.
- **Placeholders were repointed too, even though they are commented out.** Uncommenting
  one later should find its picture where it should be rather than in the old flat pile
  — a broken path discovered months later reads as a missing photograph, not as a stale
  comment.
- **Folder names are the owner's own capitalisation** (`ADAR`, not `adar`). Paths are
  case-sensitive on GitHub Pages, so a case mismatch works locally on a
  case-insensitive filesystem and 404s on the live site.
- **Prefer hyphens over spaces in any new folder**, because a space becomes `%20` in the
  address. `Individual Fragrances` predates that advice and is kept because the owner
  named it.

## How to test it

The repository link test **will not catch a broken picture path** — it deliberately
tolerates a picture that is not there yet, because most of the site's plates are still
placeholders waiting for a file. So check the page itself rather than trusting the
suite:

```bash
npm test -- tests/adar.spec.js    # the mark in the void, and every fragrance's photograph
python3 -m http.server 8000       # then open http://localhost:8000/houses/adar.html
```

With the page open, confirm the pictures are served from their new place with nothing
404ing (devtools → Network, filter images), and that the house's mark still stands in
the void when the pointer comes near it.

## Web copies, and why a picture is not used as it arrives

The first photographs outside ADAR arrived on 2026-09-17: a Pineward bottle and ADAR's
title page, both for the contact sheet. Neither is served as uploaded.

| | as uploaded | as served |
|---|---|---|
| `Pineward/Batch 1 Photograph (40).JPG` | 19MB, 5152×7728 | `batch-1-photograph-40-web.jpg`, 0.21MB, 1067×1600 |
| `ADAR/Adar Title page.png` | 6.3MB, 3873×3873 | `adar-title-page-web.jpg`, 0.16MB, 1600×1600 |
| `Almost-Human/This one.webp` | 4.2MB, 5152×7728 | `house-web/this-one.webp`, 0.015MB, 1067×1600 |
| `Almost-Human/AH_Logo_Black.jpg` | 0.17MB, 3125×3125 | `house-web/ah-logo.webp`, 0.02MB, 800×800 |

Almost Human's two are in a `house-web/` folder inside the house's own rather than beside
the original — the same arrangement Pineward's gallery uses, and the better one now there
is more than one copy to keep. **The mark is the one picture on the site that is not
served as it was given**: the owner's file is black on pure white and the copy is black on
**transparent**, because the page it was printed on is `#fafaf9` and a white square shows
against that. It is not printed on any page now — it is only ever drawn by the crowd's
glitch, which reads the same file, and the transparency is what makes the ring's inside
not a place a speck may stand. The reasoning, and what was tried first, is in [Almost
Human's report](2026-09-20-almost-human.md).

**The originals are kept and nothing points at them.** The copies exist because the full
files did measurable harm: together they starved the contact sheet's opening animation of
frames, and the test that watches the flick being held on its first picture failed
consistently until the page pointed at scaled copies instead. That is the whole reason,
and it is worth keeping in mind for every picture that arrives from here on — a frame on
the sheet is a few hundred pixels square, and a plate on an index page is smaller still.

The rule, written into `images/README.txt` where the owner will find it: keep the
original, and point the page at a copy no more than about 1600px on its long side.

There is no build step on this site and there is not going to be one, so these copies are
made by hand when a picture arrives. Pillow will do it in a few lines; ADAR's existing
photographs are small enough already and were left alone.

## Known issues / TODO

- **Three more folders arrived on 2026-09-21** with the three new houses —
  `Ataraxia/`, `Grande/` and `Les-Abstraits/` — and all three hold only a README. Each
  README names the files its page is already asking for, so a picture shows the moment it
  is dropped in. Ataraxia's and Les Abstraits' are named by NUMBER rather than by
  fragrance, because those fragrances are not named yet.
- `Favorites/` and `Individual Fragrances/` are still empty but for their READMEs.
  ADAR's folder is complete; `Pineward/` has its fifty-two fragrance pictures and its
  gallery; `Almost-Human/` has the house's two — the mark and `This one` — and none of
  the five its fragrances name. **All three houses carry a real picture on the contact
  sheet now**; every other plate on the site is still a hatched placeholder with its
  `<img>` tag commented out.
- The link test's tolerance of missing images is deliberate, but it means path breakage
  in this area has to be caught by eye. If the placeholders are ever all filled in, that
  tolerance is worth revisiting.

## 2026-09-22 — three houses' pictures, Haxan's, and crediting all of it

The owner uploaded pictures for **Ataraxia**, **Grande Parfums** and **Les Abstraits**, a
folder of three for **Haxan** in the individual fragrances, and a house picture for each of
the three houses. Every one of them is now on the page.

**The pages were already asking for files that did not exist**, by the names this report
set out (`ataraxia-01.jpg`, `grande-01.jpg` and so on), and `house.js` was quietly taking
each photograph off the page because the file was not there. What the owner uploaded is
named quite differently — their own names, in sub-folders of their own — so the `<img>`
tags were repointed at the real files rather than the files being renamed to match. **The
names are the owner's**, which is this repository's standing rule for anything in
`images/`.

Three things about those names are worth knowing, because they all work and all look like
they should not:

- **Spaces survive.** `images/Grande/Pictures for the fragrances/Hot Stuff.webp` is written
  into the `src` with its spaces intact and the browser encodes them. This is the same
  thing `images/Individual Fragrances/` has always done.
- **So do brackets, and so does a trailing space before the extension.**
  `My Dolls Makeup (Fragrantica) .jpg` has a space between the `)` and the `.jpg`. It
  loads. It was checked in a browser rather than assumed, because it is exactly the kind of
  name that quietly 404s on a case-sensitive server.
- **`House Picture.webp` and `5 Year anniversary.webp` are the same file**, byte for byte.
  Grande's frame on the contact sheet and its first fragrance therefore show the same
  photograph. That is what was uploaded; it is not a mistake in the markup.

**What is used, and what is spare.** Three fragrances came with more pictures than there is
room for — Ataraxia's Deity has three (`Deity 0`, `Deity 1`, `deity 2`), Les Abstraits' Des
Cendres has three, and Haxan has three. A house page shows **one photograph per fragrance**,
so the first of each is on the page and the rest are sitting in the folder unused. If the
owner wants them shown, the shape to copy is Pineward's **gallery**, which is a feature of
its own rather than something the house shape does.

### Crediting them

The owner: *"I also want you to give credits when pictures are used."* So each house that
uses pictures carries one line at its foot, above the way on to the next house —
`<p class="house-credit">`, in the site's mono, at the same 940px measure and 64px gutter
as the foot below it.

| house | where its pictures came from |
|---|---|
| Pineward | the house's own site; the gallery at the foot is the owner's own photography |
| ADAR | the house's own site |
| Ataraxia | the house's own site, plus the logo credit the house published: logos created by **avramgo** for Ataraxia™, the fragrance brand by **tudoristea**, ©2024 ataraxia_perfumes |
| Grande Parfums | **the MEUS website and Profumix Luxury Perfumes** — not the house |
| Les Abstraits | the house's own site |

**Grande Parfums is the reason the line names a source rather than saying "the house".**
Its pictures came from two retailers, which the owner recorded in a `Source.txt` beside the
files. Assuming a house photographs its own bottles would have been wrong for exactly one
of the five.

**Two of the three source documents were readable and one was not.** Grande's `Source.txt`
carries two lines of plain text. Ataraxia's is `credits.jpg`, a screenshot of an Instagram
comment, which is where the avramgo / tudoristea credit comes from. Les Abstraits'
`Source Les Abstraits Website.txt` is **zero bytes** — the credit there is taken from the
file's own name, and is worth the owner confirming.

### A favourite can carry a picture too

The owner: *"Feel free to use the image for des cendres also in favorites."* A
`<a class="gallery-entry">` may now name a `data-image`, and it stands beside the writing
when that favourite's card is opened on a chapter page.

**Every block beside it is given its own formatting context** (`display: flow-root`), and
that is not decoration. A float narrows the *lines* of a block, not the block itself — so
the two dashed placeholder boxes beside Des Cendres kept their full width and ran their
borders underneath the picture while their words wrapped politely around it. A block that
establishes a formatting context may not overlap a float at all, so the box narrows with
its text.

### How this was checked

Every page of the site was walked in a browser at 1440×900 and again at 390×844 with touch,
counting images, broken images, HTTP failures, console errors and sideways scroll. Results:
**203 image paths resolve to a real file**; the three new houses have no 404 at all
(Ataraxia 10 tags, Grande 30, Les Abstraits 8); the contact sheet carries all six houses;
and no page scrolls sideways at 390px.

The 20 paths with no file behind them are the pre-existing placeholders — Almost Human's
five fragrances and five of the six individual fragrances — which is the behaviour this
report describes: the page names the file it wants and shows it the moment it arrives.

One thing the walk found and fixed: `.house-credit` was written with the footer's 940px
measure but **without its 64px gutter**, so the credit ran wider than the writing above it
on a desktop and hard into both edges of a phone. It now carries the same padding as the
foot, and drops to 24px below 720px exactly as the three house feet do.

## 2026-09-23 — Haxan's other two, Tale's folder, and a drawing

- **Haxan's three photographs are all on the page now**, one full width with two in a row
  under it (`.human-plate-more`). They are the owner's own photographs at **5152 × 7728 and
  about 2MB each** — and the page had been loading the first of them as it came, for a
  56px square and a 320px plate. Web copies are in `Individual Fragrances/Haxan/web/`
  (1067 × 1600 at about 120KB, and 320 × 480 thumbs), and the originals are kept with
  nothing pointing at them, as this report's rule says. The full-size original was also
  what stalled the fragrance reader's way back for most of a second.
- **`images/Tale/`** arrived with twelve 600 × 600 pictures — three per fragrance — the
  house picture (byte for byte Bad Lily 2) and one marked *dont use*, which is not used.
  Nothing needed a web copy. Its README says which number is which.
- **`images/Les-Abstraits/des-cendres-road.svg`** is the first picture on the site that is
  neither a photograph nor the house's: a drawing made for the page, at the owner's
  request, from their own description of Des Cendres. The credit at the foot of Les
  Abstraits says so.
- **Tale's credit names the house's own site, taleparfum.com, and that is an assumption**:
  no source note came with the files, and the site could not be reached to check. Written
  down in [Tale Parfums' report](2026-09-23-tale-parfums.md).

## 2026-09-23 — the credit line, set straight

The owner pointed at Les Abstraits' credit: *"have the text in the middle format it
correctly"*. It had space above the words and none below, so they sat on the foot's rule,
and a second line wrapped back under the **Pictures** label. It now has the same space
above and below, and the words stand in a column of their own beside the label
(`.house-credit-text`, a two-column grid), so a second line starts under the first. The
line is the same component on all six houses that carry one, so it was fixed there once
rather than on one page.

## 2026-09-23, later — Tombstone and Qimu & Musicians

Two new folders, both the owner's, both named as they uploaded them:
`images/Tombstone/` (the house picture, and in `Fragrances/` two to a fragrance — the
bottle and the house's card for it) and `images/Qimu and Musicians/` (the record sleeve
that stands on the Houses view, and in `Perfumes/` the four bottles, numbered). Each has a
README saying what every file is. The owner's filenames are irregular in case and in
extension ("3 foot 5 2.webp", "No need to come by 2.jpg"), so the pages ask for each
exactly as it is. None is large enough to need a web copy. See [the newer
houses](2026-09-21-the-newer-houses.md).

## 2026-09-25 — Almost Human's five and the individual fragrances' six, wired up

The owner uploaded two sets of pictures straight to the live site (two "Add files via
upload" commits on `main`): Almost Human's five bottles in `images/Almost-Human/perfumes/`
(`Burning_Bridges_Clean.webp` and the rest), and six of the individual fragrances in
`images/Individual Fragrances/`, numbered as the page numbers them (`001 CV99.jpg`,
`002 De Profundis.jpg`, `004 Tobacolour.webp`, `005 Flamenco.webp`,
`006 French Riviera.webp`, `007 Velvet Fog.jpg`). **None of them showed**: the pages asked
for the names written into them before the pictures existed (`burning-bridges.jpg`,
`cv99.jpg`, …), and a page shows the hatched placeholder until the file it names is there.
So the pages now ask for each file **exactly as it was uploaded** — the owner's names, as
with Tombstone and Qimu — in both places a fragrance names its picture (the small square
and the full picture). Every one is web-sized already (the largest is 1500 × 1000), so none
needed a web copy. Both folders' READMEs list what is there.

That completes the photographs: **every fragrance on every page now has one**, and the
Fragrances view's cards, which read their pictures off the individual fragrances' page,
all carry theirs.

**`008 House of Ellixirz.webp` came with them** — and the same day the owner sent the
fragrance it belongs to, which is part 08 now (see the next section).

**The credit.** Almost Human now shows photographs, so it carries a `house-credit` line
like the other eight — and `repository.spec.js` requires one of any house whose pictures
are on disk. It names **almosthuman.store**, at the owner's word (*"Credit is the Almost
Human Website"*). The individual fragrances are credited one picture at a time — see the
next section.

**Three tests had been written against the pictures being missing**, and each was changed
to take a picture away itself rather than rely on one being absent:

- `almost-human.spec.js` — **`a photograph that is not there leaves the hatch showing, and
  the ones that are stay`** (was *a photograph that is not there yet…*): Ritual Code's
  picture answers 404 in the test; its two `<img>` are off the page with the hatch under
  them, and the other four fragrances keep both of theirs.
- `fragrance-line.spec.js` — the cards test makes CV99's answer 404 to see the hatching and
  the number still come, and now also checks De Profundis' card carries its picture.
- `fragrance-reader.spec.js` — *going back sends the picture into the grid* measured the
  first of the picture and its hatched square, which was the picture when the picture had
  been taken off; now there is one, the square comes first, hidden, at width 0. It measures
  whichever is showing.

## 2026-09-25, last — every individual fragrance's picture credited, under itself

> Also add the missing pictures for individual perfumes. De profundis source is: … The source
> for CV99 is fragrantica … Matca house of Ellixirz: …

The owner gave a source for seven of the eight individual fragrances' pictures. They come
from **seven different places**, so rather than one long line at the foot of the page each
is credited **under its own picture**, in its caption — `<span class="human-plate-credit">`,
*Picture: Fragrantica* and a link, in the mono at 10px, under the name. A credit under the
picture also **travels with it into the fragrance reader**, which copies the pictures out of
this page but not its foot: `fragrance-reader.js` copies the credit into the reader's own
plate as a `figcaption.frag-plate-credit` under the picture.

| fragrance | picture from |
|---|---|
| 01 CV99 | Fragrantica (fragrantica.hu) |
| 02 De Profundis | Sillyage (sillyage.wordpress.com) |
| 03 Haxan | **not given** — no credit yet |
| 04 Tobacolor | Dior (dior.com) |
| 05 Flamenco EDP | Aromak (aromak.no) |
| 06 French Riviera | Vivantis (vivantis.hu) |
| 07 Velvet Fog | Fragrantica |
| 08 House of Ellixirz | Matca (matcanaturals.com) |

Matca's link is the product page the owner gave **without** the tracking tag a search
engine had put on the end of it (`?srsltid=…`), which identifies a search rather than the
page.

Tested in `tests/notes.spec.js`: **`every individual fragrance's picture is credited under
itself, but Haxan's`** — the eight parts' credits, in order, each with a link. And in
`tests/fragrance-reader.spec.js`: **`the reader carries the picture's credit under it`** —
House of Ellixirz opened from the list shows *Picture: Matca* under its picture, linked, and
Haxan opened next shows none (the first's does not stay behind).
