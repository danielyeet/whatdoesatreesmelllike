# A folder of pictures per house and category

Date: 2026-09-17 (`aa55557`, *Give each house and category its own folder of pictures*)

Files: `images/` (the `ADAR/`, `Pineward/`, `Favorites/`, `Individual Fragrances/` and
`Theories/` folders, each empty one carrying a `README.txt`; `images/README.txt`),
`works/adar.html`, `works/pineward.html`, `works/theory-01.html`, `works/theory-02.html`,
`works/theory-03.html`, `adar.js`

## What it is

`images/` was one flat pile of files. It has a folder per house or category now, and all
fourteen pictures presently on the site live in `images/ADAR/`, since every one of them
is ADAR's — the thirteen its fragrances ask for (the two extra ADHD photographs
included) and the house's own mark. Everything that names a picture points there: the
twenty-four live `<img>` tags on `works/adar.html`, the sigil `adar.js` draws inside the
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
python3 -m http.server 8000       # then open http://localhost:8000/works/adar.html
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
