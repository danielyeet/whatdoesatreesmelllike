const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  let worstDup = 0, runs = 0, lens = new Set();
  for (let i = 0; i < 6; i++) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto("http://localhost:8811/categories/scent-descriptions.html");
    // watch which picture is showing, every frame, through the flick
    await p.evaluate(() => {
      window.__seen = [];
      const tick = () => {
        const idx = [...document.querySelectorAll(".sheet-frame")]
          .findIndex(f => getComputedStyle(f).visibility === "visible");
        window.__seen.push(idx);
        requestAnimationFrame(tick);
      };
      tick();
    });
    await p.waitForTimeout(4000);
    const seen = await p.evaluate(() => window.__seen);
    // squash runs of the same value into one entry = the cut order
    const cuts = seen.filter((v, n) => v >= 0 && v !== seen[n - 1]);
    const counts = {};
    cuts.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const dup = Math.max(0, ...Object.entries(counts)
      .filter(([k]) => Number(k) !== 0)          // the landing picture is held then landed on
      .map(([, v]) => v));
    worstDup = Math.max(worstDup, dup);
    lens.add(cuts.length);
    runs++;
    await p.close();
  }
  console.log("runs:", runs, "| most times any non-landing picture appeared in one run:", worstDup);
  console.log("cut counts seen:", [...lens].join(", "));
  await b.close();
})();
