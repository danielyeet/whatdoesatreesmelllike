Image files live in here, sorted into a folder each. Point at them from
the img tags in the work and category pages. Most of those tags are
commented out and say which file they want; the ADAR page's are not.

THE FOLDERS

  ADAR/                   the ADAR house — all of its pictures, listed
                          below. These are on the page now.
  Pineward/               the Pineward house — 54 wanted, none yet
  Favorites/              whatever categories/favorites.html comes to
                          show
  Individual Fragrances/  single fragrances that don't belong to one of
                          the houses
  Theories/               the three theory pages

Each of the empty ones has a note inside saying what it is for. That
note is also the only thing keeping the folder itself in the project —
a folder with nothing at all in it doesn't get saved — so leave it
there until there are real pictures alongside it.

A NEW FOLDER is fine: make one, put the pictures in, and point the img
tags at images/<folder>/<file>. Capitals matter (ADAR is not adar), and
a space in a folder name works but turns into "%20" in the address, so
hyphens are the easier choice for anything new.

ADAR'S PICTURES ARE ALL HERE, in ADAR/. Every one of the eleven
fragrances has its photograph, and so does the house's own mark. These
are the names the page asks for — if you replace a picture, keep the
name (or change the one line in works/adar.html that names it):

  adar-sigil.jpg        the house's own mark. It is NOT printed on the
                        page: it is what the VOID shows, and only while
                        the pointer is on it. The file is the mark in
                        white on black, and the page lifts the mark off
                        that black and stands it in the hole on its
                        own, so a different picture wants the same
                        thing — something pale on something dark.

  amber-zero.png        01
  aetherealism.png      02
  incantu.png           03
  against-all-odds.png  04
  alpha11.png           05
  alta-luna.png         06
  adhd-1.png            07 — the one in the list and at the top
  adhd-2.png            07 — only seen once ADHD is opened
  adhd-3.png            07 — the same
  root-code.png         08
  lignum-dei.png        09
  lithos-diaphanes.png  10
  tyrian.png            11

  .png is what the page asks for now. A .jpg or a .webp works just as
  well — change the one line in works/adar.html that names it.

SHAPES. A picture does not have to be square. The small one in the
list is cropped to a square around its subject and the big one keeps
its own shape, so a tall photograph of a bottle stays tall when it is
opened. WHICH PART of the picture the small square keeps is the
`--focus` on that fragrance's thumb in works/adar.html: "50% 38%" means
halfway across and a little above the middle. Each of the eleven has
been set on its own bottle; if you swap a photograph for one framed
differently, nudge that second number — smaller keeps more of the top.

STILL WAITING. The houses on the contact sheet
(categories/scent-descriptions.html) and every plate elsewhere on the
site are still hatched placeholders, with their <img> tags commented
out in the markup, ready for a file and a name.

UNTIL A FILE IS THERE the page takes that picture off itself and shows
the hatched placeholder instead, so nothing looks broken while the
photographs are still coming. The console will say "404" for each one
that is missing; that is the page asking, not a fault.
