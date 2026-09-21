const { chromium } = require("playwright");
const OUT = "/tmp/claude-0/-home-user-whatdoesatreesmelllike/b73468ad-8afc-5322-86b6-a8ff1de2a9dd/scratchpad/";
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; const info = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "info") info.push(m.text()); });

  await p.goto("http://localhost:8123/works/individual-fragrances.html");
  await p.waitForTimeout(1200);
  const first = p.locator(".human-part").first();
  await first.locator("summary").click();
  await p.waitForTimeout(1200);
  await first.locator(".note-open").click();
  await p.waitForTimeout(900);
  await first.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + "notes-individual.png" });
  console.log("individual: buttons", await p.locator(".note-open").count(),
              "panels open", await p.locator(".note-panel:not([hidden])").count());
  console.log("console:", info);
  console.log("errors:", errs.length ? errs : "none");
  await b.close();
})();
