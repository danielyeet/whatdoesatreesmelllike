// ============================================================
// THE PICTURES ON works/theory-04.html, AND THE SCRIPT THAT MAKES THEM
//
// This is TEMPORARY, and it is the only thing in this repository that
// needs anything installed before it will run. It is here to show what
// an image library can do to the site's own photographs — nothing on
// the site depends on it, and nothing on the site runs it.
//
// TO RUN IT:
//
//     npm install image-js --no-save
//     node tools/image-js-demo.js
//
// It reads the Pineward gallery's web copies, writes every picture on
// theory-04.html into images/Theories/image-js-demo/, and prints the
// measurements that page quotes — so if a number on that page is ever
// in doubt, this is what to run.
//
// TO TAKE THE WHOLE DEMONSTRATION OFF THE SITE: delete this file, the
// images/Theories/image-js-demo/ folder, works/theory-04.html, the
// demo-* block at the foot of style.css, the row on
// categories/theories.html and the line in search-page.js. Nothing
// else knows about any of it.
// ============================================================

const fs = require("fs");
const path = require("path");
const {
  read, write, Image,
  cannyEdgeDetector, fromMask, getRois, computeRmse, computeThreshold,
} = require("image-js");

const ROOT = path.join(__dirname, "..");
const GALLERY = path.join(ROOT, "images/Pineward/gallery-web");
const ORIGINALS = path.join(ROOT, "images/Pineward/The Pinewards Gallery Page");
const OUT = path.join(ROOT, "images/Theories/image-js-demo");

// How wide a picture stands on that page. Everything is written at this
// width so the page stays light: the gallery's own copies are 1600px
// and there are sixteen pictures here.
const WIDE = 760;
const JPEG = { format: "jpeg", encoderOptions: { quality: 74 } };

// The three photographs this page works on, named by where they stand
// in the Pineward gallery — the same reading the gallery itself uses,
// where a picture's number is its position and not its filename.
const SPRUCE = { file: "pineward-13.jpg", at: 5 };   // blue spruce, close
const FLOWERS = { file: "pineward-08.jpg", at: 3 }; // white flowers against dark leaves
const BOTTLE = { file: "pineward-40.jpg", at: 22 };  // a bottle on the forest floor

const measured = {};

/** Write a picture, and remember how big the file came out. A mask is
    written as a PNG: it is black and white, which a jpeg both makes
    bigger and smudges the edges of. */
async function put(name, image) {
  const file = path.join(OUT, name);
  await write(file, image, /\.png$/.test(name) ? { format: "png" } : JPEG);
  const kb = Math.round(fs.statSync(file).size / 1024);
  measured.files = measured.files || {};
  measured.files[name] = { kb, width: image.width, height: image.height };
  console.log(`  ${name.padEnd(22)} ${image.width}x${image.height}  ${kb}KB`);
  return image;
}

/** The long edge brought down to `edge`, whichever way up the picture is. */
function toLongEdge(image, edge) {
  return image.width >= image.height
    ? image.resize({ width: edge })
    : image.resize({ height: edge });
}

/** A square cut from the middle, then brought down to `side`. */
function squareFromMiddle(image, side) {
  const cut = Math.min(image.width, image.height);
  return image
    .crop({
      origin: { column: Math.round((image.width - cut) / 2), row: Math.round((image.height - cut) / 2) },
      width: cut,
      height: cut,
    })
    .resize({ width: side, height: side });
}

/** A mask drawn as a picture, so it can be written as a jpeg. */
function maskAsPicture(mask) {
  return mask.convertColor("RGB");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // ----------------------------------------------------------
  // 02 — THE WEB COPIES. This is the recipe that actually built the
  // Pineward gallery: an original of several megabytes, a viewing copy
  // with its long edge at 1600, and a square thumbnail cut from the
  // middle. Done here on a real original so the numbers are real.
  // ----------------------------------------------------------
  console.log("\nthe web copies");
  const originalName = fs.readdirSync(ORIGINALS).filter((f) => /\.jpe?g$/i.test(f)).sort()[0];
  const originalFile = path.join(ORIGINALS, originalName);
  const original = await read(originalFile);
  measured.original = {
    name: originalName,
    width: original.width,
    height: original.height,
    kb: Math.round(fs.statSync(originalFile).size / 1024),
    megapixels: +(original.width * original.height / 1e6).toFixed(1),
  };
  console.log(`  from ${originalName} — ${original.width}x${original.height}, ${measured.original.kb}KB`);
  await put("copy-1600.jpg", toLongEdge(original, 1600));
  await put("copy-520.jpg", squareFromMiddle(original, 520));
  await put("copy-shown.jpg", toLongEdge(original, WIDE));

  // The three photographs, brought to the page's own width.
  console.log("\nthe three photographs");
  const spruceFull = await read(path.join(GALLERY, SPRUCE.file));
  const flowersFull = await read(path.join(GALLERY, FLOWERS.file));
  const bottleFull = await read(path.join(GALLERY, BOTTLE.file));
  const spruce = toLongEdge(spruceFull, WIDE);
  const flowers = toLongEdge(flowersFull, WIDE);
  const bottle = toLongEdge(bottleFull, WIDE);
  await put("spruce.jpg", spruce);
  await put("flowers.jpg", flowers);
  await put("bottle.jpg", bottle);

  // ----------------------------------------------------------
  // 03 — WHAT A PICTURE MEASURES. Nothing is changed here: the
  // picture is only read. The histogram is 64 slots per channel,
  // which is what theory-04.html draws its own chart from.
  // ----------------------------------------------------------
  console.log("\nmeasurements");
  const SLOTS = 64;
  measured.spruce = reading(spruce, SLOTS);
  measured.flowers = reading(flowers, SLOTS);
  console.log(`  spruce mean RGB ${measured.spruce.mean.join(", ")}`);
  console.log(`  flowers mean RGB ${measured.flowers.mean.join(", ")}`);

  // ----------------------------------------------------------
  // 04 — THE COLOURS IT IS MADE OF. Every pixel is dropped into one of
  // 4x4x4 boxes of colour and the boxes are counted; the eight fullest
  // are the picture's palette, each given the average of what fell in
  // it rather than the box's own middle.
  // ----------------------------------------------------------
  measured.spruce.palette = palette(spruce, 8);
  measured.flowers.palette = palette(flowers, 8);
  console.log(`  spruce palette ${measured.spruce.palette.map((c) => c.hex).join(" ")}`);

  // ----------------------------------------------------------
  // 05 — THE PLAIN TRANSFORMS.
  // ----------------------------------------------------------
  console.log("\nthe plain transforms");
  const grey = spruce.grey();
  await put("grey.jpg", grey.convertColor("RGB"));
  await put("contrast.jpg", spruce.increaseContrast());
  await put("invert.jpg", spruce.invert());
  await put("gamma.jpg", spruce.level({ gamma: 0.45 }));

  // ----------------------------------------------------------
  // 06 — SOFTENING. A gaussian blur is the ordinary one; a median
  // filter takes the middle value of each neighbourhood instead of the
  // average, which takes speckle out while leaving edges where they
  // are.
  // ----------------------------------------------------------
  console.log("\nsoftening");
  await put("blur.jpg", spruce.gaussianBlur({ sigma: 4 }));
  await put("median.jpg", spruce.medianFilter({ cellSize: 7 }));

  // ----------------------------------------------------------
  // 07 — EDGES. The gradient filter is a Sobel pair: how fast the
  // brightness changes across the picture and down it. Canny takes
  // that further and keeps only the thin line along the top of each
  // ridge.
  // ----------------------------------------------------------
  console.log("\nedges");
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  await put("gradient.jpg", grey.gradientFilter({ kernelX: sobelX, kernelY: sobelY }).convertColor("RGB"));
  const edges = cannyEdgeDetector(grey, { lowThreshold: 0.06, highThreshold: 0.14 });
  await put("edges.png", maskAsPicture(edges));
  measured.edges = { lit: edges.getNbNonZeroPixels(), of: edges.width * edges.height };

  // ----------------------------------------------------------
  // 08 / 09 — THRESHOLD, AND COUNTING WHAT IT FINDS. Otsu picks the
  // brightness to cut at by looking at the picture's own histogram
  // rather than being told. What is left is a mask — every pixel
  // either in or out — and the mask is then broken into regions of
  // touching pixels, which are things you can count and measure.
  // ----------------------------------------------------------
  console.log("\nthreshold and regions");
  const bloomGrey = flowers.grey();
  const mask = bloomGrey.threshold({ algorithm: "otsu" });
  await put("mask.png", maskAsPicture(mask));
  measured.mask = {
    threshold: computeThreshold(bloomGrey, "otsu"),
    inside: mask.getNbNonZeroPixels(),
    of: mask.width * mask.height,
  };

  const cleaned = mask.open({ iterations: 2 }).close({ iterations: 1 });
  const rois = getRois(fromMask(cleaned), { kind: "white", minSurface: 400 });
  const biggest = [...rois].sort((a, b) => b.surface - a.surface);
  measured.regions = {
    found: rois.length,
    biggest: biggest.slice(0, 6).map((r, i) => ({
      no: i + 1,
      surface: r.surface,
      width: r.width,
      height: r.height,
      roundness: +r.roundness.toFixed(2),
      solidity: +r.solidity.toFixed(2),
    })),
  };
  console.log(`  ${rois.length} regions over 400px`);

  let boxed = flowers.clone();
  for (const roi of biggest.slice(0, 12)) {
    boxed = boxed.drawRectangle({
      origin: roi.origin,
      width: roi.width,
      height: roi.height,
      strokeColor: [142, 180, 226, 255],
    });
  }
  await put("regions.jpg", boxed);

  // ----------------------------------------------------------
  // 10 — THE PHOTOGRAPH AS SPECKS. The site draws nearly everything in
  // specks, so: read the picture's brightness on a grid and put a dot
  // at every crossing, the brighter the reading the bigger the dot.
  // The picture is never shown — only measured, and then drawn again
  // from the measurements.
  // ----------------------------------------------------------
  console.log("\nspecks");
  await put("specks.jpg", asSpecks(spruce, 5));
  await put("pixelate.jpg", spruce.pixelate({ cellSize: 12 }));

  // ----------------------------------------------------------
  // 11 — FINDING THE SAME PICTURE AGAIN. Bring two pictures down to a
  // 64x64 grey thumbnail and measure the difference pixel by pixel
  // (the root-mean-square error — 0 is identical, 255 is black
  // against white). Done twice, because the two cases are not the
  // same difficulty:
  //
  //   THE EASY ONE. A picture looked for among pictures it is one of.
  //   Its own copy comes back at 0 and everything else is miles away,
  //   which is what a method working looks like.
  //
  //   THE REAL ONE. An original from the owner's own folder, which has
  //   no record anywhere of which gallery copy was made from it. This
  //   is harder than it sounds: the web copies are not only smaller,
  //   several are CROPPED — the one this finds is a portrait crop of a
  //   landscape frame — so more than half of what is being compared is
  //   not in both pictures at all. It still comes back with the right
  //   answer, and the page says plainly how thin the margin is.
  // ----------------------------------------------------------
  console.log("\nmatching");
  const web = {};
  for (const name of fs.readdirSync(GALLERY).filter((f) => /^pineward-\d+\.jpg$/.test(f)).sort()) {
    web[name] = toSmall(await read(path.join(GALLERY, name)));
  }
  const scoreAgainstGallery = (needle) =>
    Object.entries(web)
      .map(([name, thumb]) => ({ name, rmse: +computeRmse(needle, thumb).toFixed(1) }))
      .sort((a, b) => a.rmse - b.rmse);

  const knownName = SPRUCE.file;
  const known = scoreAgainstGallery(web[knownName]);
  measured.matchKnown = { looked: knownName, best: known[0], next: known.slice(1, 4) };
  console.log(`  ${knownName} -> ${known[0].name} (${known[0].rmse}); next ${known[1].name} (${known[1].rmse})`);

  const found = scoreAgainstGallery(toSmall(original));
  measured.match = {
    original: originalName,
    best: found[0],
    next: found.slice(1, 4),
    worst: found[found.length - 1],
  };
  console.log(`  ${originalName} -> ${found[0].name} (${found[0].rmse}); next ${found[1].rmse}`);

  // The two of them side by side, so the page can show that the
  // answer is right whatever the number says.
  const bestCopy = await read(path.join(GALLERY, found[0].name));
  await put("match-pair.jpg", sideBySide(original, bestCopy, WIDE));

  // ----------------------------------------------------------
  // 12 — THE CONTACT SHEET. Every picture in the gallery, brought to
  // one size and laid into a grid — a real contact sheet, made the way
  // the category page's drawing is named after.
  // ----------------------------------------------------------
  console.log("\nthe contact sheet");
  await put("montage.jpg", await contactSheet(150, 7));

  fs.writeFileSync(path.join(OUT, "measurements.json"), JSON.stringify(measured, null, 2));
  console.log("\nmeasurements written to images/Theories/image-js-demo/measurements.json");
}

/** Everything the page quotes about a picture, read and nothing changed. */
function reading(image, slots) {
  const channels = ["red", "green", "blue"];
  const mean = image.mean().slice(0, 3).map((v) => Math.round(v));
  const median = image.median().slice(0, 3).map((v) => Math.round(v));
  const variance = image.variance().slice(0, 3).map((v) => Math.round(v));
  const { min, max } = image.minMax();
  const out = { width: image.width, height: image.height, mean, channels: {}, histogram: {} };
  for (let c = 0; c < 3; c++) {
    out.histogram[channels[c]] = [...image.histogram({ channel: c, slots })];
    out.channels[channels[c]] = {
      min: min[c], max: max[c], mean: mean[c], median: median[c], variance: variance[c],
    };
  }
  const g = image.grey();
  out.grey = {
    mean: Math.round(g.mean()[0]),
    median: Math.round(g.median()[0]),
    variance: Math.round(g.variance()[0]),
    histogram: [...g.histogram({ slots })],
  };
  return out;
}

/** The eight colours the most of the picture falls into. */
function palette(image, want) {
  const STEP = 64;                       // 4 x 4 x 4 boxes of colour
  const boxes = new Map();
  for (let i = 0; i < image.width * image.height; i++) {
    const p = image.getPixelByIndex(i);
    const key = `${Math.floor(p[0] / STEP)},${Math.floor(p[1] / STEP)},${Math.floor(p[2] / STEP)}`;
    const box = boxes.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    box.n++; box.r += p[0]; box.g += p[1]; box.b += p[2];
    boxes.set(key, box);
  }
  const all = image.width * image.height;
  return [...boxes.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, want)
    .map((box) => {
      const rgb = [box.r / box.n, box.g / box.n, box.b / box.n].map((v) => Math.round(v));
      return {
        hex: "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""),
        rgb,
        share: +(100 * box.n / all).toFixed(1),
      };
    });
}

/** The picture read on a grid and drawn again as dots. */
function asSpecks(image, step) {
  const grey = image.grey();
  const sheet = new Image(image.width, image.height, { colorModel: "RGBA" });
  sheet.fill([14, 16, 20, 255]);
  let out = sheet;
  for (let y = step; y < image.height - step; y += step) {
    for (let x = step; x < image.width - step; x += step) {
      const v = grey.getValue(x, y, 0) / 255;
      const r = v * v * (step / 2 + 0.6);   // squared, so the dark stays dark
      if (r < 0.35) continue;
      const ink = Math.round(120 + 135 * v);
      out = out.drawCircle({ column: x, row: y }, Math.max(1, Math.round(r)), {
        fillColor: [ink, ink, Math.min(255, ink + 12), 255],
        strokeColor: [ink, ink, Math.min(255, ink + 12), 255],
        out,
      });
    }
  }
  return out;
}

/** A 64x64 grey thumbnail — small enough that two of them can be
    compared pixel by pixel however big the pictures were.

    IT IS BROUGHT DOWN IN STAGES, halving until it is close, and only
    then squared off. Going from 7728px to 64px in one step samples
    every 120th pixel and throws the rest away, so the same photograph
    at two sizes comes out as two different thumbnails and the match
    is no better than a guess. Halving averages the pixels in between,
    which is what makes the two agree. */
function toSmall(image) {
  let small = image;
  while (small.width > 128) small = small.resize({ xFactor: 0.5, yFactor: 0.5 });
  return small.resize({ width: 64, height: 64, preserveAspectRatio: false }).grey();
}

/** Two pictures on one sheet, each given half the width and set
    against the page's own near-black so an upright picture beside a
    wide one does not read as a mistake. */
function sideBySide(left, right, wide) {
  const half = Math.round(wide / 2);
  const a = left.resize({ width: half }), b = right.resize({ width: half });
  const tall = Math.max(a.height, b.height);
  let sheet = new Image(wide, tall, { colorModel: "RGBA" });
  sheet.fill([14, 16, 20, 255]);
  const place = (img, leftEdge) => {
    sheet = img.copyTo(sheet, {
      origin: {
        column: leftEdge + Math.round((half - img.width) / 2),
        row: Math.round((tall - img.height) / 2),
      },
      out: sheet,
    });
  };
  place(a, 0);
  place(b, half);
  return sheet;
}

/** Every picture in the gallery, one size, laid into a grid. */
async function contactSheet(side, columns) {
  const thumbs = fs.readdirSync(GALLERY).filter((f) => /-thumb\.jpg$/.test(f)).sort();
  const rows = Math.ceil(thumbs.length / columns);
  let sheet = new Image(columns * side, rows * side, { colorModel: "RGBA" });
  sheet.fill([14, 16, 20, 255]);
  for (let i = 0; i < thumbs.length; i++) {
    const one = (await read(path.join(GALLERY, thumbs[i]))).resize({ width: side, height: side });
    one.copyTo(sheet, {
      origin: { column: (i % columns) * side, row: Math.floor(i / columns) * side },
      out: sheet,
    });
  }
  return sheet;
}

main().catch((problem) => {
  console.error("\nit stopped:", problem.message);
  process.exit(1);
});
