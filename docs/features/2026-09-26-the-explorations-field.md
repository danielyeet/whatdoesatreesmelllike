# Explorations & Researches, laid out again, and the field

(The figures below — one for each work — were **replaced the same day** by abstract forms; see
*2026-09-26, later — abstract forms, not figures* at the foot. The layout stands as written.)

Date: 2026-09-26

Files touched: `categories/researches.html`, `explorations.js` (new), the `EXPLORATIONS &
RESEARCHES` block in `style.css` (all of it under `.researches-page`), `tests/index-pages.spec.js`

## What changed

The owner:

> in the Researches and Explorations (RE for short), i want you to put this paragraph "Here
> you will find my researches and my explorations. ..." under the title RE, not under
> introduction. the introductiont hing delete it. Delete the right side of the page, and move
> the table upwards, so that it takes up abour 3/5ths of the page on the left (an estimate, but
> make it look good). On the right side, I want you to make something extravagant with the
> particles that reacts ot the thing being hovered on the left (in the table). Make it reactive
> and on theme.

The page is two columns now, three fifths and two. On the left, the name — set as a heading, in
ink, where it was a small grey label — the owner's paragraph directly under it, and the table
directly under that, filling the window to its foot and scrolling in its own box. The
**Information** heading the paragraph stood under, the line *Currently reading round and writing
these up one at a time.*, and the two plates (the drawn ring and a hatched placeholder) are gone
from the page. On the right, **the field**: one drawing in specks the full height of the window,
bracketed at its corners and captioned at its foot, which the table conducts.

## The field

With nothing pointed at, the specks turn in **the ring** — a tilted orbit with dust inside it, the
drawn plate this page used to carry, made large. Point at a row and every speck is thrown out
from the middle (`KICK`) and gathers into **that work's figure**, each on a clock of its own
(`SPREAD`, 520ms), so the change sweeps through the field rather than snapping; the figure's
hairlines — its outline, its tiers, its labels — come up once the specks have gathered
(`LINES_IN`) and the last figure's go as they leave. Under it the **caption**: the number, the
name, and the kind (or *not written yet*).

| row | `data-figure` | the figure |
|---|---|---|
| 000 My Personal Introduction to Perfume | `pyramid` | the primer's own pyramid, a triangle cut into TOP, HEART and BASE, labelled; the top lifting off and thinning as a top note does, the heart swaying, the base still |
| 001 Resins in Perfumery | `resin` | a tear of resin, full, turning slowly inside, with four bubbles caught in it |
| 002 Buying A Perfume | `bottle` | a bottle, its label panel, the liquid in it moving, a mist rising from its cap |
| 003 Cold vs Warm Incense | `smoke` | two sticks, COLD and WARM: a plume that stands straight and thin, and one that billows |
| 004 Exploring the smell of a forest | `forest` | three firs, in tiers, filled |
| 005 Exploring the smell of rain | `rain` | rain falling in strokes, ringing where it lands |
| 006–009 Untitled | (none) | the **cloud**: specks with nowhere to be yet |

**A row that names no figure is given one by its kind**, so a new row needs nothing: a Research
is a **molecule** — two to four six-sided rings fused in a chain and a side chain or two, its
atoms gathered specks and its bonds hairlines, some doubled — and an Exploration a **terrain** —
two or three rises in rings of contour, and a dashed route across them from a tick to a cross.
Both are worked out from the row's own name (seeded), so no two are alike and each is the same
every visit. A row that is neither yet is the cloud. A row with nothing behind it
(`data-open="no"`) is drawn at half strength.

**The pointer answers over the field as well**: the specks within `PART` (74px) of it are pushed
aside and drawn darker.

**Leaving the table** brings the ring back `IDLE_AFTER` (650ms) later, so passing from one row
to the next never does. **From the keyboard**, a row's link focused is pointed at, and the row
carries `is-shown` so it reads as the one being shown. **Without hovering** (a phone), the
written works take turns every `TURNS` (5.2s); a tap on a row shows that one, and a lifted
finger is not taken for the pointer leaving. **With reduced motion** there is no flight and
nothing moves: each figure is simply there, drawn once, always at the same moment of itself.

It draws only while it is on the window (`IntersectionObserver`), at 2400 specks (1300 below
700px), at a ratio of 2 (1.5 below 700px); each speck's place is asked of its figure once a
frame and kept (`A`, `Z`, `K`) for the drawing.

## Why / key decisions

- **Scoped to the page.** `.index-page` and its whole block are shared with the old Fragrances
  index kept underneath the Fragrances view of Scent descriptions, which still has its plates
  and the drawn mark (`index-page.js` still draws `.index-mark` there). Everything new is under
  `.researches-page`, and nothing of the shared block was removed.
- **Figures named in the page, not in the script.** The owner adds rows; a row says which figure
  it wants (`data-figure`), and one that says nothing still gets one of its own, by its kind and
  its name. The seven named figures are the ones this page's works actually are.
- **On theme** is the works themselves: the primer's pyramid, the resin's tear, the bottle a
  purchase is about, the incense's two smokes, the forest and the rain the two unwritten
  explorations are after — and for what comes later, a material's molecule and an
  exploration's map.
- **The ring when idle** keeps the page's old drawn plate — the chamber's orbit printed small —
  as the thing the field returns to.

## How to test it

In `tests/index-pages.spec.js`:

- **`Explorations & Researches: the paragraph under the name, the table on the left three fifths,
  the field on the right`** — no Information heading, line or plates; the owner's paragraph,
  exactly, under the name and lined up with it; the table below it and in the top 45% of the
  window, between half and two thirds of its width; the field to its right and most of the
  window's height; no sideways scroll; and at 390px the field a band above the table.
- **`pointing at a row gathers the field into that work's figure, and leaving the table brings
  the ring back`** — the ring drawn with its caption; pointing at 000–003 gives the pyramid, the
  resin, the bottle and the smoke, each captioned with its row's name and each a different
  drawing from every one before it (read as a coarse grid of where the ink is); off the table the
  ring comes back, not at once but within three seconds; a row's link focused shows its figure
  and marks the row; and a row with no `data-figure` whose kind is Research is a molecule.
- **`the field answers the pointer over it`** — with the pointer held on the ring's band, the ink
  under it drops by more than 40%.
- **`the field with animation turned off › each figure is simply there, and nothing moves`** —
  the ring drawn at once and identical 0.7s later; a row pointed at is drawn at once.

`mobile.spec.js` already lists the page (no sideways scroll at 390px).

## Known issues / TODO

- The figures for 004 and 005 stand for explorations not written yet; when they are, nothing
  needs changing, but the owner may want other figures for them.
- On a phone the field takes turns only among the written works; the unwritten ones show only
  when tapped.

## 2026-09-26, later — abstract forms, not figures

> REmove the research specific stuff; and make it more so a general abstract geometric
> particulate thing. The closest thing to waht i like is the cloud when you hover the untitled
> researches/Explorations (and when you hover nothing). re-interpret it and do that please.

**The figures are gone** — the pyramid, the tear of resin, the bottle, the smokes, the firs, the
rain, the molecule and the terrain — and with them their hairline outlines, the words drawn into
the field (TOP, HEART, BASE, COLD, WARM) and every `data-figure` on the rows. Nothing on a row
says what the field draws for it any more.

**Everything the field draws is a cloud now**, the thing the owner liked, re-interpreted: a soft
haze of specks gathered round a **geometric form**, standing in **three dimensions** and turning
slowly about an axis leaning towards you (`SPIN`, `TILT`) — seen in perspective (`FOCAL`), the
nearer specks larger and darker, the further ones fainter. Every place in a form is blurred a
little (`fuzz`) and an eighth of every form's specks (`HAZE`) are left loose round it as a wider
cloud, so no form is ever a hard figure. A faint **web** of hairlines is strung between ninety
specks picked at random from the whole cloud (`WEB`, `WEB_REACH`) wherever two of them come near
each other — picked at random because a form places its specks in order, and the first ninety of
a sphere all stood at one pole, which drew a dark knot there.

- **Nothing pointed at: the ring**, a band of specks round the middle with dust inside it, as
  before but in depth, drifting a little about their places.
- **An Untitled row: the cloud**, the one form with no shape in it, drifting.
- **Every other row: a form by its number**, round a list of ten, so every row keeps its own and
  the rows next to each other differ: `sphere`, `knot` (a trefoil), `torus` (tipped at an angle,
  so it is neither the ring lying down nor, turned edge on, a band like the helix), `helix` (two
  strands, with rungs now and then), `disc` (a spiral of three arms round a core), `lattice` (the
  edges of a cube), `gyre` (three rings crossed), `saddle`, `shells` (three, nested) and
  `hourglass` (two cones, point to point). So 000 is the sphere, 001 the knot, 002 the torus, 003
  the helix, 004 the disc and 005 the lattice; a row added as 010 comes round to the sphere again.

A form's places are worked out once, the first time it is asked for, and kept (`formOf`). The
change between two is as it was: thrown out from the middle and gathered, each speck on a clock
of its own. The caption, the pointer parting the specks, the keyboard, the turns on a phone and
the layout are unchanged. With reduced motion every form is drawn once, turned to the same angle.

### What was tried and was wrong

- **A figure for each work** — see above. The owner found the literal figures wrong and liked
  only the cloud and the ring; the forms are those two, re-interpreted.
- **The torus standing upright**, like a wheel: turned edge on it was a tall band of specks, and
  the test found it hard to tell from the helix — as a person would. Tipped, it never is.
- **The web between the first ninety specks**: on the sphere those all stand at one pole.

### How to test it

In `tests/index-pages.spec.js`, **`pointing at a row gathers the field into an abstract form,
and leaving the table brings the ring back`** (replaces *…into that work's figure…*): no row
carries `data-figure`; the ring and its caption; rows 000–005 give the sphere, the knot, the
torus, the helix, the disc and the lattice, each captioned, and the first four each a different
drawing from every one before it; an Untitled row gives the cloud; off the table the ring comes
back, not at once; a row's link focused shows its form; a row renumbered 010 comes round to the
sphere; and **nothing is written into the drawing** (no `fillText` on the field's canvas).

*A different drawing* is now read as how differently the two spread their ink over a 24-by-24
grid, 0 to 100: measured, one form against itself a moment later, turned, is 14–25, and one form
against another 37 and up; the test asks for more than 30. (It was a count of cells with any ink
in them, which two tall forms of the same size could not be told apart by.) The other three tests
of the field are unchanged.

