# Your portfolio site

Three files make this work:

- `index.html` — the content: your name, your intro text, your projects.
- `style.css` — the look: colors, fonts, spacing, the scroll behavior.
- `script.js` — the small interactions: the dots on the right, arrow-key
  navigation, the "plate 02 / 06" counter.

## What to edit first

1. In `index.html`, replace "Your Name" (it appears twice: the title slide
   and the small running label at the top-left of the frame).
2. Replace the intro paragraph on slide 2 with your own text.
3. For each project slide, replace the title, the location/year/role list,
   and the description. There are three example projects — duplicate one
   of those `<section class="slide project-slide">...</section>` blocks
   to add more, and delete any you don't need.
4. Replace the placeholder hatched panels with real photos: add your image
   files into the `images` folder, then inside a `project-media` div,
   uncomment the `<img>` line and point `src` at your file, e.g.
   `<img src="images/project-01.jpg" alt="A short description" class="project-photo">`.
   The hatching and caption disappear automatically once a real image
   is present.
5. Update the email address and links on the last slide.

## Changing the look

All the colors live at the very top of `style.css`, in one place:

```css
:root {
  --blueprint: #17222c;
  --paper: #ece7da;
  --brass: #c6924b;
  ...
}
```

Change those six values and the whole site's palette updates. The two
fonts (Fraunces and Space Grotesk) are loaded from Google Fonts in the
`<head>` of `index.html` — swap the link there and the `--serif` /
`--sans` variables in `style.css` if you want different typefaces.

## Putting it on GitHub Pages

See the numbered steps in the chat where this was generated. In short:
create a repository, upload these files (with the images folder) to it,
then turn on GitHub Pages in the repository's Settings tab under "Pages."
