## Story: Fix currentStoryId field mismatch — linkSessionToJourney must read journey.storyList, not journey.stories

**Track:** Short-track (severe live production bug found via session/log investigation)
**Epic reference:** (none — direct continuation of `wsap-s1` in the same feature folder)
**Domain:** web-ui

## User Story

As **an operator running any multi-story feature through the web UI's per-story review → test-plan → definition-of-ready cycle**,
I want **each story's review, test-plan, and definition-of-ready artefacts saved to their own distinct file**,
So that **completing story 2 doesn't silently destroy story 1's work, and the journey visibly progresses instead of looking like an infinite loop**.

## Problem (found via live session/log investigation, not a written AC beforehand)

The operator reported: "the current stage button is stuck in a loop... can't get to feature summary page even though we seemed to have completed to DoR stage," on `new-feature-2b74a292` (a real, 13-story feature). Fly logs showed a genuine cycle: `test-plan → definition-of-ready → review → test-plan → definition-of-ready → review → ...`, with `storyId: null` on every single `pipeline_state_updated` event, and — critically — every `artefact_auto_saved`/`artefact_auto_amended` event pointing at the exact same three flat file paths (`artefacts/new-feature-2b74a292/review.md`, `test-plan.md`, `definition-of-ready.md`) across every cycle.

Root cause, traced to `src/web-ui/routes/skills.js`'s `linkSessionToJourney()`:
```js
if (journey && Array.isArray(journey.stories) && typeof journey.currentStoryIndex === 'number') {
  var currentStory = journey.stories[journey.currentStoryIndex];
  if (currentStory) session.currentStoryId = currentStory.id || currentStory.slug || null;
}
```
This was `wsap-s1`'s own fix (2026-08-31) for exactly this class of bug — but it checks `journey.stories`, a field that is **never populated anywhere in this codebase** (confirmed by grep: only ever initialized to `[]`). The actual per-story routing machinery (`setStoryList`/`advanceToNextStory`/`getCurrentStory` in `journey-store.js`) populates a *different* field, `journey.storyList`. So the `if` above always evaluated `currentStory` as `undefined`, and `session.currentStoryId` was **never set, for any per-story feature, ever** — a systemic bug affecting every multi-story feature run through the web UI since `wsap-s1` shipped, not just this one.

`wsap-s1`'s own test (`check-wsap-s1-story-scoped-artefact-paths.js`, AC1) never caught this because it set `journey.stories` directly via a test-only helper (`setJourneyFields`) — a mock shape production code never actually produces — rather than going through the real `setStoryList()` entry point. Exactly the "mock-shape verification" anti-pattern this repo's own CLAUDE.md warns about (citing `tir-s5`).

**Practical impact confirmed on `new-feature-2b74a292`:** all 13 stories' review/test-plan/DoR artefacts collapsed onto the same 3 flat files — only the last story's (`ep4-s3`) content survives on disk; the other 12 stories' work was silently overwritten. The operator had to click through all 13 full review→test-plan→DoR cycles (39 stage completions) before the journey would naturally terminate, with no visible per-story progress indicator distinguishing one cycle from the next — indistinguishable from an infinite loop.

## Fix

`src/web-ui/routes/skills.js`'s `linkSessionToJourney()`: check `journey.storyList` (an array of story ID strings) instead of `journey.stories`, and index it directly (no `.id`/`.slug` unwrapping needed — `storyList` entries are already plain ID strings).

## Acceptance Criteria

**AC1:** Given the existing `wsap-s1` test suite, corrected to exercise the real `setStoryList()` entry point instead of the mock-shape `journey.stories` field, When this fix is applied, Then `session.currentStoryId` is correctly set from `journey.storyList[currentStoryIndex]`.

**AC2:** Given a new end-to-end test driving the full multi-story cycle through the real production entry points (`setStoryList`, `advanceToNextStory`, `linkSessionToJourney`) across 3 stories, When each story's session is linked, Then each gets a distinct `currentStoryId` matching `storyList` in order, and `advanceToNextStory` correctly returns `null` once exhausted — proving the cycle terminates and does not loop.

**AC3:** Given the full existing regression suite touching journey/story routing (17 files: `alrf-s8`, `cat-s6`, `cdg4`, `cdg5`, `csgc-s1`, `das-s1`, `dtra-s1`, `inf5`, `mig4`, `ntpg-s1`, `ougl2`, `ougl3`, `ougl5`, `ougl6`, `ougl7`, `s1.1`, `s3.3`), When this fix is applied, Then all pass unchanged.

**AC4:** Given a real production deploy of this fix, When the operator resumes `new-feature-2b74a292`'s stuck journey and completes another per-story cycle, Then the artefact saved lands at a distinct, per-story path (e.g. `artefacts/new-feature-2b74a292/review/<story-id>-review-N.md` or equivalent per-story convention), not the shared flat file — confirmed via a real stage completion and a `git show` of the resulting commit. (Live-verified post-deploy, not automatable.)

## Out of Scope

- Recovering the 12 stories' worth of review/test-plan/DoR content already lost to the flat-file collapse on `new-feature-2b74a292` before this fix — those stages will need to be manually re-run once the fix is live; not a code-level recovery task.
- Any change to `journey.stories`'s own (permanently empty) field — left as-is; a future cleanup could remove the dead field entirely, but that's not required to close this bug.

## NFRs

- **None new** — single-field correction, same read pattern as before.

## Complexity Rating

**Rating:** 1 — a one-line field-name correction, but required deep tracing (Fly logs → code → a prior story's own test using a mock shape production never produces) to isolate precisely.
**Scope stability:** Stable.
