# instructions.md

Standing instructions from the repo owner about how Claude should behave and
conduct commands in this repository. This file is rules, not codebase
documentation. The codebase is documented in two other places, and neither is
a place for rules: `CLAUDE.md` carries the architecture, the conventions, the
commands and the glossary, and `docs/features/` carries one report per
feature, indexed newest first in `docs/progress-log.md`.

Append new rules here as they're given, in their own dated section; don't
remove or reword an existing rule without being asked.

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

## Test every requested feature; never assume (2026-09-10)

> Conduct tests for every feature I request to make sure it behaves as
> expected. When unsure about something always double check and never
> assume.

Applies on top of the visual check above: a screenshot confirms it *looks*
right, this rule covers whether it *behaves* right — click through
interactions, check state changes, check the console for errors, re-read the
relevant code rather than guessing at what it does. If something about the
request, the existing code, or the expected behavior is unclear, verify it
(read the code, run it, ask) instead of assuming an answer and proceeding.

## Keep a glossary of unfamiliar terms (2026-09-10)

> When user uses an unfamiliar term, add it to a glossary section inside the
> CLAUDE.md file, and whenever unsure about term usage, refer to the glossary
> or request clarification.

The glossary lives in `CLAUDE.md` under `## Glossary`, seeded with the
project's existing vocabulary (slide, branch, waypoint, wake, ghost,
registration mark, and so on), each definition checked against the code.

- The glossary is **vocabulary**, and that is why it stays in `CLAUDE.md`
  rather than moving to a report: a word is used across the whole site. How
  the thing a word names actually *works* belongs in that feature's report in
  `docs/features/` — a glossary entry is a sentence, not a description.
- When the owner uses a term that isn't in the glossary and isn't obvious
  from the code, **ask** — don't infer a meaning and build on it.
- Once its meaning is settled, add it to the glossary table in the same
  commit as the work that prompted it.
- When a term *is* in the glossary, use it in that sense, and correct the
  entry if the code moves on.
- Definitions are verified against the code, not `README.md`, which has
  drifted in several places.

## Push straight to main; no PRs to approve (2026-09-11)

> Automatically push changes to the repo and don't do any pull requests
> that I have to approve.

Going forward, work merges into `main` without waiting on a review step:
push commits directly to `main` (or open a PR and merge it immediately)
rather than leaving a PR open for the owner to approve. `main` is what
GitHub Pages deploys, so this means changes go live as soon as they're
pushed — which is exactly why the checks above (visual verification, and
testing that a feature actually behaves as expected) matter more, not
less, under this rule: there's no review step left to catch a mistake
before it's live. Still never rewrite `main`'s history (no force-push, no
rebase of already-merged commits) — only ordinary forward commits.

## Don't ask before pushing; just push (2026-09-17)

> Push it, and stop asking.

The rule above said to push straight to `main`, but I had been asking for
a yes before each push anyway. Don't. Verified work goes to `main`
without checking first — no question, no waiting.

"Verified" is the whole of the condition, and it is not loosened by this:
the full test suite still runs before every push, the visual check still
happens, and anything a change could plausibly break is still checked by
hand before it goes. What this removes is the pause for permission, not
the work that earns it.

Two things stay true regardless. **Say what went live** — a short note of
what was pushed, after the fact, so nothing arrives unannounced. And
**still stop and ask when the call is genuinely the owner's**: deleting
their writing, changing content they wrote, or anything whose blast
radius reaches past this repository. Permission to push is not permission
to decide.

## Ask with choices, only about the whole and the look — and once, at the end (2026-09-25)

> i liked the way you proposed the questions. Do that for every time there
> is an uncertainty in my instructions. additionally, make that a rule on the
> repository, so that any other session I open will do the same. BUT DONT ASK
> ME EVERYTHING LIKE YOU DID WITH YOUR PREVIOUS MESSAGE, some code you can do
> on your own, its more so the decisions i need to make for 1) the
> entire/total 2) the stylistic details

and, earlier the same day:

> instead of asking for eevery single thing, just ask me if you can
> push/pull it all at the end. You REALLY dont have to ask me to allow you to
> wait. please dont use permissions excessively. do whatever youre instructed
> to, find the best way to do the thing youre instructed to do, and only at
> the end, ONE QUESTION (or a few depending on whether something needs to be
> clarified)

**How to ask.** When an instruction is genuinely uncertain, ask with the
multiple-choice question tool (`AskUserQuestion`), not in running prose:
- each question has **two to four options**, each a short label and a line in
  plain English saying what it would look like or do;
- the recommended option goes first, marked **"(Recommended)"**;
- related questions go together, in one ask (up to four); and
- the owner can always type an answer of their own, so no option has to be
  "other".

**What to ask about — only two kinds of decision are the owner's:**
1. **The whole**: what the round adds up to and whether it goes out. At the
   end of the work, whether to push it all (see below). Also the overall
   scope, when an instruction could mean two very different amounts of work.
2. **The stylistic details**, when the instruction leaves them open: how
   something should look or feel, which of two readings of a word they meant
   for a drawing, what goes in a space they left open.

**Everything else, decide and do**: how to build it, the code's structure,
names, tests, fixing what turns up on the way, waiting for the suite. Find
the best way to do what was asked, do it, and say what was done. Don't ask
mid-way whether to carry on, whether a plan is right, whether to show
something first, or whether you may wait for something.

**At the end, one question**, or a few if something really needs
clarifying, and it includes **whether to push it all**. This changes the
2026-09-17 rule above on that one point: the push is asked for now, once,
at the end, together with anything else that is the owner's to decide. The
work before it is still verified in full (tests, screenshots) so that the
answer can be a yes. Commit locally as you go if a hook asks; don't push
until the owner says so.

**Keep approvals few.** Every command that needs the owner's permission is
an interruption. Batch shell commands into one call, use the file tools
rather than the shell to read and edit, and never run a command only to
wait or to poll — background work reports back when it finishes.
