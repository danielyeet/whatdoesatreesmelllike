# Feature reports

One report per feature. **The index is [`docs/progress-log.md`](../progress-log.md)** —
every report listed newest first, one line each. Go there to find the one you want; this
page only says what a report is and how to add one.

**Read the matching report before editing one of these files.** Each records decisions
that were arrived at by trial and error, and specific bugs the owner reported and that
were fixed — several of them more than once, because the fix was later undone by someone
who didn't know why it was there. A line that says "this used to be X and X was wrong" is
load-bearing, not history.

## What a report carries

- **Date** — when the feature first appeared, and the rounds of work since.
- **Files touched** — what it is made of, including its tests.
- **What changed** — the feature in plain English.
- **Why / key decisions** — what was tried, what was wrong with it, and what must stay
  true. This is the part worth reading before changing anything.
- **How to test it** — the command, and what to look at by hand.
- **Known issues / TODO** — anything unresolved.

## Adding one

A new feature gets a new file, named `YYYY-MM-DD-slug.md` for the day it landed, and a
new row at the **top** of the table in [`docs/progress-log.md`](../progress-log.md). The
template to follow is in `CLAUDE.md` under "Feature reports". Keep the report current in
the same commit as the change it describes.

The reports written before that template was fixed carry the same sections under
slightly different headings — `## What it is` in place of *What changed*, `Files:` in
place of *Files touched* — and the longer ones break the middle into sections of their
own rather than one *Why / key decisions*. That is fine; follow a report's existing shape
when adding to it, and the template when starting a new one.
