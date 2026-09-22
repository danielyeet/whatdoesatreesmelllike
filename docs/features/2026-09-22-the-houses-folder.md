# The houses folder, and the individual fragrances folder

Date: 2026-09-22

Files touched: `houses/` (new — six pages moved in), `individual-fragrances/` (new — one
page moved in), the seven forwarding pages left behind in `works/`, `search-page.js`,
`fragrance-reader.js`, `categories/scent-descriptions.html`, `categories/favorites.html`,
`works/theory-03.html`, `works/resins-in-perfumery.html`, the comments at the head of
`notes-data.js` and the six house scripts, `tests/repository.spec.js`, seven other spec
files, `CLAUDE.md` and ten feature reports.

## What changed

Every page used to live in `works/` — the six houses, the individual fragrances, the three
theories, the two researches, the two templates and the two sandbox pages, sixteen files in
one folder. The owner asked for two folders of their own: one for **fragrance houses** and
one for **individual fragrances**, as the places in the repository where those things live.

So `houses/` now holds the six house pages and `individual-fragrances/` holds the one
individual-fragrances page. `works/` keeps the essays, the researches, the templates and the
sandbox pages — everything that is a *piece of writing* rather than a house.

Nothing on the site looks any different. 144 references were repointed.

## Why / key decisions

**The new folders are one level deep, exactly like `works/` was, and that is the whole
reason this was cheap.** Every page in here reaches its assets with `../style.css`,
`../nav.js`, `../images/…` and `window.SITE_ROOT = "../"`. Put the houses one level deeper —
`works/houses/`, or a folder per house — and all four of those break in every one of the
seven pages, including Pineward's 237 image paths. At the same depth, not one asset path
changed.

**The footer chain survived for the same reason.** Every house links on to the next by bare
filename (`adar.html`), and all six moved together, so the chain still walks Pineward → ADAR
→ Almost Human → Ataraxia → Grande Parfums → Les Abstraits → Pineward without a single edit.

**Five links did break, and they are the ones that cross the new boundary:**

| where | was | now |
|---|---|---|
| `houses/adar.html` | `theory-01.html` | `../works/theory-01.html` |
| `houses/almost-human.html` | `theory-02.html` (×2) | `../works/theory-02.html` |
| `individual-fragrances/…` | `pineward.html` | `../houses/pineward.html` |
| `works/theory-03.html` | `adar.html#part-01/02/03` | `../houses/adar.html#…` |
| `works/resins-in-perfumery.html` | `pineward.html` | `../houses/pineward.html` |

**The one real code path was `fragrance-reader.js`.** It fetches the individual fragrances
page to lift a fragrance's writing out of it rather than keeping a second copy, and that
address is written down in one place (`WHERE`). Everything else naming a house page was
either a link, the search manifest, or a comment.

## The forwarding pages

Moving a page changes its public web address, and the owner asked for the old ones to keep
working. So each of the seven old addresses keeps a **signpost**: `works/pineward.html` is
now a page whose only job is to send you to `houses/pineward.html`.

**It forwards three ways and needs all three:**

- **The script**, which goes at once **and carries the anchor with it**. This is the one
  that matters, and it is why a `<meta refresh>` alone is not enough: a meta refresh drops
  everything after the `#`, so `works/pineward.html#part-37` would land at the top of
  Pineward instead of on Murkwood. It uses `location.replace` rather than `assign`, so the
  back button steps over the signpost instead of bouncing back into it.
- **The meta refresh**, the fallback with no JavaScript. It loses the anchor, which is why
  it is second.
- **A plain link**, for anyone who has both turned off.

They also carry `rel="canonical"` at the new address and `robots: noindex`, so a search
engine indexes the real page rather than the signpost.

**Nothing inside the site links at one.** Every internal link points at the real page; the
signposts exist only for links already out in the world. There is a test.

## How to test it

```bash
npm test -- tests/repository.spec.js
```

Two new checks, and one old one that had to be repaired:

- **`every old address still forwards, and carries its anchor`** — all seven signposts
  exist, point at a file that really exists, forward by script with `location.hash`
  appended, and carry the no-JavaScript fallback too. The anchor is the part worth pinning:
  it is the thing a meta refresh cannot do.
- **`nothing inside the site links at a forwarding page`** — walks every page and fails if
  any of them routes a reader through a signpost. A redirect in the middle of a journey is
  one nobody asked for, and it would quietly hide a link that had gone stale.
- **`every link into a fragrance lands on that fragrance` had stopped working, and the move
  is what revealed it.** It finds those links with a regex that names the house pages **by
  path**, and that path had just changed — so it matched nothing at all and passed while
  checking nothing, which is worse than failing. Two repairs: the path, and a guard that
  fails if it ever again finds *nothing* to look at. Widening it also turned up a link it
  had never seen — theory-03 writes "Amber Zero by ADAR" of a part titled "Amber Zero" — so
  the rule now accepts the shorter of link-text and title being a prefix of the longer,
  either way round. A link saying "Murkwood" that lands on "Noki" still fails, which is the
  fault the test exists for.

Browser-checked by hand as well: `houses/pineward.html` draws its wood and all 47 parts with
their notes buttons; `works/pineward.html#part-06` lands on `houses/pineward.html#part-06`;
the Fragrances view still pulls a fragrance's writing out of its new home.

## Known issues / TODO

- **`works/` still has a mixed job.** It holds the essays and researches (real pieces of
  writing) alongside two templates and two sandbox pages, and now seven signposts as well.
  Splitting the writing from the scaffolding would be the next tidy, and the owner has not
  asked for it.
- **The signposts are permanent furniture.** They cost one small file each and they are the
  only thing keeping old links alive, so they should not be deleted — but they will sit in
  `works/` looking like pages forever. A note at the top of each says what it is.
- **The anchor test still only covers Pineward and ADAR**, because it reads their part
  titles out of `pine-part` and `adar-part` blocks. The four newer houses use `human-part`
  and are not checked, so a renumbering there would not be caught. Widening it is a
  contained job and worth doing.
