const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:8811/categories/scent-descriptions.html");
  await p.waitForTimeout(4000);
  const btn = p.locator("button, [data-view]").filter({ hasText: /fragrance/i }).first();
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(2500); }
  // open Haxan's row
  const row = p.locator('.index-table tbody tr[data-name]').filter({ hasText: /haxan/i }).first();
  console.log("haxan row found:", await row.count());
  if (await row.count()) { await row.click(); } else { await p.locator('.index-table tbody tr[data-name]').first().click(); }
  await p.waitForTimeout(3500);
  const info = await p.evaluate(() => ({
    reader: !!document.querySelector(".frag-reader:not([hidden]), .frag-in"),
    name: (document.querySelector(".frag-title, .frag-name, h1, h2") || {}).textContent,
    notesHead: (document.querySelector(".frag-notes-head") || {}).textContent,
    inlinePyramids: document.querySelectorAll(".frag-notes .note-pyramid, .frag-notes .note-row").length,
    clickToOpen: document.querySelectorAll(".frag-notes .note-open, .frag-reader .note-open").length,
    notesText: (document.querySelector(".frag-notes") || {}).textContent
      ? document.querySelector(".frag-notes").textContent.replace(/\s+/g," ").slice(0,140) : null,
  }));
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})();
