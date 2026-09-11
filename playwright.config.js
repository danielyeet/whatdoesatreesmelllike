// ============================================================
// TEST CONFIGURATION
//
// The tests drive a real browser against a real copy of the site,
// served over HTTP the same way GitHub Pages serves it. Opening the
// files directly off disk instead would give misleading results —
// several things on this site behave differently on a "file://"
// address than on a real web address.
//
// Run them with:   npm test
// See the report:  npm run report
// ============================================================
const { defineConfig, devices } = require("@playwright/test");

const PORT = 4321;

module.exports = defineConfig({
  testDir: "./tests",

  // A failing test should be a real failure, not a slow machine.
  timeout: 30000,
  expect: { timeout: 8000 },

  // Don't let a stray .only() in a test file quietly skip everything
  // else when this runs unattended.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // Keep a trace of anything that fails, so a broken test can be
    // opened and stepped through rather than guessed at.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Serves the repo exactly as it is, with no build step, on the port
  // above. Python's built-in server is used because it needs nothing
  // installed — the same command is in `npm run serve` for poking at
  // the site by hand.
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
    // The server logs every single file it hands over, which buries the
    // actual test results. Errors still come through.
    stdout: "ignore",
    stderr: "pipe",
  },
});
