# Your portfolio site

## How it's organized

```
index.html                          the landing page (title, intro, node map)
style.css                           every page's look — one shared file
nav.js                               the "Menu" button + frame, on every page
landing.js                           dot navigation, only used by index.html
contact.html                        the contact page

categories/
  scent-descriptions.html           fully filled in — use as your example
  theories.html                     currently empty, ready for pieces
  favorites.html                    currently empty
  other-1.html                      currently empty
  other-2.html                      currently empty

works/
  example-gallery-work.html         template for a long image+paragraph piece
  example-article-work.html         template for a reference/article piece

images/                             put your photos here
```

## Adding a new piece of work

1. Duplicate whichever template fits — `works/example-gallery-work.html`
   for something built from repeating image + paragraph blocks, or
   `works/example-article-work.html` for a written, reference-style piece.
2. Rename the file (e.g. `works/coastal-house.html`) and edit its title,
   heading, and body content. Each file has comments explaining exactly
   which blocks to copy for more entries.
3. Add one line linking to it from the relevant category page, inside
   its `work-list` — copy an existing `<a class="work-row">` block in
   `categories/scent-descriptions.html` as your pattern.

## Adding a whole new category (body of work)

1. Duplicate any file in `/categories/`, rename it, and change its
   `<h1>` and lede paragraph.
2. Add one line for it in the `SITE_LINKS` list near the top of `nav.js`
   — that's the only place the menu is defined, so it updates on every
   page automatically.
3. Optional: add a matching node (a dot + line) to the map on slide 3
   of `index.html`, following the pattern of the existing five.

## Changing the look

All colors live at the top of `style.css`:

```css
:root {
  --blueprint: #17222c;
  --paper: #ece7da;
  --brass: #c6924b;
  ...
}
```

The two fonts (Fraunces and Space Grotesk) are loaded from Google Fonts
in the `<head>` of every page — change the link and the `--serif` /
`--sans` variables together if you want different ones.

## Publishing changes

Once the site is live on GitHub Pages, adding a new page later just
means uploading that one new file (and any new images) to the same
repository — GitHub Pages picks it up automatically within a minute
or two, no other steps needed.
