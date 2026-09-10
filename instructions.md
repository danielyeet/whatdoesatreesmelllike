# instructions.md

Standing instructions from the repo owner about how Claude should behave and
conduct commands in this repository. Unlike `CLAUDE.md` (which documents the
codebase), this file records behavioral rules the owner has asked for. Append
new rules here as they're given, in their own dated section; don't remove or
reword an existing rule without being asked.

## Verify changes visually before calling them done (2026-09-10)

> When conducting any changes: run the site locally, take a screenshot of the
> result, and check it matches what I asked for. Tell me if anything looks
> off before we call this done.

Applies to any change made in this repo, including changes with no expected
visual effect (repo hygiene, docs, config) — run the check anyway and report
that the screenshot is unchanged, rather than skipping it.

How to do this here (static site, no build step):
1. Serve the repo root over HTTP (e.g. `python3 -m http.server`) — the pages
   rely on relative paths and pointer APIs that misbehave on `file://`.
2. Load the relevant page(s) in a browser (headless Chromium via Playwright
   is pre-installed in this environment) and take a screenshot.
3. Compare against what was asked for. Note anything that looks wrong —
   layout, console errors, missing assets — before reporting the task done.
