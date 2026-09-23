const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [name, url] of [["individual", "/individual-fragrances/individual-fragrances.html"],
                             ["pineward", "/houses/pineward.html"]]) {
    await p.goto("http://localhost:8811" + url);
    await p.waitForTimeout(2000);
    const info = await p.evaluate(() => ({
      parts: document.querySelectorAll(".human-part, .pine-part").length,
      noteButtons: document.querySelectorAll(".note-open").length,
      noteButtonText: [...document.querySelectorAll(".note-open")].slice(0,2)
        .map(b => b.textContent.trim()),
      panels: document.querySelectorAll(".note-panel").length,
      inlineNotes: document.querySelectorAll(".note-pyramid").length,
      HOUSE_NOTES: window.HOUSE_NOTES,
    }));
    console.log(name, JSON.stringify(info));
  }
  await b.close();
})();
