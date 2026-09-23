const { chromium } = require("playwright");
const OUT = process.env.OUT + "/";
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://localhost:8811/categories/scent-descriptions.html");
  await p.waitForTimeout(4000);
  await p.locator("button, [data-view]").filter({ hasText: /fragrance/i }).first().click();
  await p.waitForTimeout(2500);
  await p.locator('.index-table tbody tr[data-name]').filter({ hasText: /haxan/i }).first().click();
  await p.waitForTimeout(3500);

  await p.locator(".frag-notes .note-open").click();
  await p.waitForTimeout(900);
  const up = await p.evaluate(() => {
    const w = document.querySelector("#frag-note");
    const notes = w.querySelector(".note-in").textContent.replace(/\s+/g, " ");
    return { shown: !w.hidden && w.classList.contains("is-up"),
      of: w.querySelector(".note-head-of").textContent,
      halves: w.querySelectorAll(".note-half").length,
      sources: w.querySelectorAll(".note-source").length,
      caution: w.querySelectorAll(".note-warn").length,
      scrim: !document.querySelector(".note-scrim").hidden,
      bg: getComputedStyle(w).backgroundColor,
      snippet: notes.slice(0, 90) };
  });
  console.log("window:", JSON.stringify(up, null, 1));
  await p.screenshot({ path: OUT + "r-notes.png" });

  await p.keyboard.press("Escape"); await p.waitForTimeout(900);
  const afterEsc = await p.evaluate(() => ({
    note: document.querySelector("#frag-note").hidden,
    readerStillOpen: !document.querySelector(".frag-reader").hidden,
  }));
  console.log("escape closes the window, keeps the reader:", JSON.stringify(afterEsc));

  // and the way back still works
  await p.locator(".frag-back").click();
  await p.waitForTimeout(3000);
  const back = await p.evaluate(() => ({
    reader: document.querySelector(".frag-reader").hidden,
    note: document.querySelector("#frag-note").hidden,
    tableBack: !!document.querySelector(".index-table tbody tr"),
  }));
  console.log("back to the list:", JSON.stringify(back));
  console.log("errors:", errs.length ? errs : "none");
  await b.close();
})();
