# The search

Date: 2026-09-17 (`0e3b8b4`, *Give the site a search, and answer the hand on the
sheet*; migrated from CLAUDE.md on 2026-09-17)

Files: `search.js` (~270 lines), `search-page.js` (~130), `page-search.js` (~110),
`search.html`, the per-page searches in `contact-sheet.js` and `index-page.js`,
`tests/search.spec.js`

It is the newest thing on the site and the first that is not a drawing.

## What it is

One way of looking things up, in three places, with **no list of the site's contents
anywhere**. That is the whole design.

`SiteSearch.collect(doc, base, trail)` reads a document for the things this site is
made of, by the classes the site already uses for its content:

| what it finds | read from | called |
|---|---|---|
| a house | `.sheet-frame` and its `.sheet-caption` | House |
| a fragrance, or a research | a `tr[data-name]` in an `.index-table` | Fragrance / Research |
| a fragrance written up | a `.pine-part` or an `.adar-part` | Fragrance |
| a favourite | a `.gallery-entry` | Favourite |
| a piece | a `.work-row` | Piece |
| a section of an essay | an `.essay-section` | Section |

So anything added to a page is findable the moment it is added — nothing is written
down twice. A frame or a part called "Untitled" is skipped rather than listed.

## The three places

- **The search page** (`search.html`, `search-page.js`) looks over the whole site. It
  FETCHES the pages named in its own manifest — the `PAGES` list at the top of that
  file, eleven lines at the time of writing — and reads each of them with that same
  collector, in the browser's own parser. **The manifest is the only thing to keep up
  to date**: one line per page, with the trail that says where a thing found in it
  lives. Everything is fetched once, on the first search, and kept; a page that cannot
  be reached is skipped rather than fatal.
- **A page's own search** looks over that page only. The contact sheet's is in
  `contact-sheet.js` — it can answer for the whole category, since the Fragrances view
  carries every fragrance in the page — the index pages' is in `index-page.js`, and
  `page-search.js` builds one for the two pages that had none, theories and favourites,
  from `data-find` on the `<body>`, which is the trail it hangs its answers under.
- **What a page cannot answer it HANDS ON** to the search page, with the question in
  the address (`?q=`, via `siteSearchHref`). Arriving there with nothing found is a
  state that page has rather than an error.

## It is forgiving

`score(query, text)` ranks rather than tests, and the order of its tests *is* the
ranking: an exact name (1000) beats a name that starts with what you typed (900 less a
little for length), which beats one that contains it (800 less its position), which
beats a near miss.

A near miss is a Levenshtein distance computed by `apart()`, which gives up early to
stay cheap over a few hundred entries. The slips allowed go by the length of the word:
**one** for a word of four letters or fewer, **two** up to seven, **three** beyond
that — so "murkwod" finds Murkwood. Every word of the query has to be found in the
text, exactly or nearly, so "pine murk" does not find Murkwood on its own.

What a thing is CALLED is what is searched; where it lives counts too, at a discount
(0.45), so "chapter 2" finds the favourites in Chapter 2 but never above something
actually called that.

## An answer opens the thing itself

`openFromHash(selector)`. A result links at one fragrance —
`works/pineward.html#part-39` — and the page it lands on opens that part through its
own summary, so it opens gently like everything else, brings it to the middle of the
window and marks it for a moment. Both houses call it on arrival (`pineward.js` with
`.pine-part`, `adar.js` with `.adar-part`). Being taken to a page with the thing you
asked for closed somewhere inside it is not an answer.

## Without it

Nothing stops working: every field is a plain field, and everything a search would have
found is still reachable by hand.

## Adding a page

**A new page has to be added to the search's manifest** — the `PAGES` list at the top
of `search-page.js`, one line with the trail that says where things found in it live.
It is the only list of the site's pages anywhere, and the only thing the search needs
kept up to date; everything *inside* a page is read off the page itself.

## How to test it

`tests/search.spec.js`: a fragrance being found by a misspelt name with the trail that
says where it lives; following an answer opening that fragrance rather than only
scrolling to it; a search with no answers saying so; a page's own search looking over
that page only and handing on what it cannot answer; and the menu carrying Search above
Contact (`SITE_LINKS` in `nav.js`).
