# The image-js demonstration (temporary)

Date: 2026-09-20

Files: `works/theory-04.html` (new), `tools/image-js-demo.js` (new),
`images/Theories/image-js-demo/` (new — twenty pictures and the measurements they
came from), the `demo-*` block at the foot of `style.css`, the fourth row on
`categories/theories.html`, one line in `search-page.js`, one line in
`tests/pages.spec.js`

## What it is

A page showing what an image library — [image-js](https://image-js.github.io/image-js-typescript/) —
can do to the site's own photographs. The owner asked for a blank page demonstrating it,
using pictures from the Pineward gallery, standing in the fourth theory's place
**temporarily**.

It is an ordinary [essay page](2026-09-17-the-essay-pages.md): the same ground, the same
rule down the left, built by the same `essay.js`. Thirteen sections, each one an
operation done to one of three photographs from the gallery — resizing, the histogram,
the palette, the plain transforms, two kinds of softening, edges, a threshold, counting
regions, the photograph redrawn as specks, matching a picture against the set, and a
contact sheet of all twenty-eight.

## Nothing on it is drawn by the browser

This is the whole point of the page and the reason it is built the way it is. `image-js`
runs in Node, not in a browser, so **no page on this site can use it**. Every picture on
theory-04 is a **file**, made by `tools/image-js-demo.js` and committed; the page is
plain `<img>` tags. Every number quoted on it was measured by that same script and
written to `images/Theories/image-js-demo/measurements.json`, so nothing on the page was
typed from memory.

That also means the page has no moving parts: no `prefers-reduced-motion` guard is needed
beyond the one `essay.js` already has for the field behind it.

## It is not in package.json, on purpose

`package.json` says in writing that its dependencies exist only to run the test suite,
and that is worth keeping true: the site has no build step and needs nothing installed to
publish. So the library is **not** a dependency. The script says at the top of itself how
to get it:

```bash
npm install image-js --no-save
node tools/image-js-demo.js
```

**A later `npm install` deletes it again** — that is what `--no-save` means, and it is
the right trade: the test suite installs exactly what it needs and nothing else. If the
script is ever run again, run the install line again first.

## Taking it off the site

Six deletions, and nothing else knows about any of it:

| | |
|---|---|
| `works/theory-04.html` | the page |
| `tools/image-js-demo.js` | the script that made its pictures |
| `images/Theories/image-js-demo/` | the pictures themselves |
| the `demo-*` block at the foot of `style.css` | its styles — nothing else uses a `demo-*` class |
| the fourth row on `categories/theories.html` | put the "Fourth theory" placeholder back |
| the `theory-04` line in `search-page.js`, and in `tests/pages.spec.js` | the search's manifest, and the every-page-loads test |

The comment at the top of the page and of the script both carry this list.

## What the demonstration actually found

Two of the sections came out more interesting than they were meant to, and both are on
the page because a demonstration that only shows the tool winning is not worth reading.

**The web copies are crops, not only resizes.** Section 11 asks which original in
`images/Pineward/The Pinewards Gallery Page/` a given gallery copy was made from —
something nothing in the repository records. Bringing both down to a 64×64 grey
thumbnail and measuring the difference gets the right answer, but only by 37.3 against a
runner-up of 44.1, where the same method finds a picture among its own copies at **0**
against a runner-up of **57**. The reason is visible in the picture on that page: the
original is a wide landscape frame and the gallery copy is an **upright piece cut out of
the middle of it**. More than half of what is being compared is not in both pictures. The
page says so rather than quoting the thin margin as a success.

**Counting found bright regions, not flowers.** Otsu's threshold on picture 3 cut at 74
of 255 and eight regions came back over 400px. The two biggest are one cluster of blooms
that a shadow happened to split in half, and a bloom in deep shade is missed entirely.
That gap — between *bright* and *flower* — is the honest limit of this kind of tool, and
it is written on the page next to the table rather than left for the reader to notice.

**The specks are the one worth keeping.** Reading a photograph's brightness on a
five-pixel grid and drawing a dot at every crossing, sized by what it read, produces the
site's own language — the wood down Pineward's margins, the crowd on Almost Human — out of
the owner's own photographs, and produces it **once, as a file**, rather than drawn in the
page on every visit.

## Two things that were wrong first

**The match was made on a one-step downsample**, straight from 7728px to 64px. That
samples every 120th pixel and throws the rest away, so the same photograph at two sizes
came out as two different thumbnails and the match was no better than a guess. It is
halved repeatedly now, which averages the pixels in between; `toSmall()` says so.

**The masks were written as JPEGs.** A jpeg makes a black-and-white picture *bigger* than
a PNG does and smudges every edge it has: `edges` came out at 205KB and the mask at 34KB.
As PNGs they are 74KB and 10KB, and the lines are exactly one pixel again. `put()` picks
the format off the extension for this reason.

## How to test it

There is no spec file of its own — the page is static pictures, which the existing checks
already cover:

```bash
npm test -- tests/pages.spec.js      # the page loads, is titled, keeps SITE_ROOT and the menu
npm test -- tests/repository.spec.js # every link and every picture on it exists
npm test -- tests/structure.spec.js  # the theories drawing takes the new fourth station
npm test -- tests/essay.spec.js      # the rule down the left is still built from the sections
```

By hand: the thirteen ticks on the rule, the histogram drawn from
`measurements.json`, and the pictures standing in pairs down to a narrow window, where
the pairs drop to one column.

To check any number on the page, run the script again — it prints all of them.

## Known issues / TODO

- **It is temporary.** It stands in the fourth theory's place until the owner says
  otherwise, and the placeholder row it replaced is in the git history.
- The page is about 1.4MB of pictures, all but the first `loading="lazy"`. That is heavy
  for one page and acceptable for one that exists to show pictures.
- `measurements.json` is committed beside them, which is how the page's numbers can be
  checked without re-running anything.
