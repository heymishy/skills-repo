# AC Verification Script: Add a Distinguishable Durability Signal for Stage-Completion Commits

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s2.md
**Technical test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need access to the server's log output (either a local dev server run with `node --env-file=.env src/web-ui/routes/journey.js` or, post-deploy, `flyctl logs`).
2. You'll need a feature linked to a repo-connected product, to complete stages against.
3. Ask an engineer to help with Scenarios 2 and 3, which require simulating a failure.

**Reset between scenarios:** Complete a fresh stage on a fresh test feature for each scenario.

---

## Scenarios

---

### Scenario 1: Completing a stage for a repo-connected feature logs a "succeeded" signal

**Covers:** AC1

**Steps:**
1. Complete any stage of a feature linked to a repo-connected product.
2. Look at the server log output from around the time you completed the stage.

**Expected outcome:**
> A log line starting with `[cross-channel]` appears, and when you read it, it names the event type `artefact_commit_succeeded`, along with the feature's name, the stage name, and a timestamp close to when you just completed the stage.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A commit failure logs a "failed" signal with a reason

**Covers:** AC2

**Steps:**
1. With an engineer's help, arrange for the artefact commit to fail (same setup as `acdg-s1`'s Scenario 2).
2. Attempt to complete a stage for a repo-connected feature.
3. Look at the server log output.

**Expected outcome:**
> A `[cross-channel]` log line appears naming the event type `artefact_commit_failed`, with the feature name, stage name, timestamp, and a description of what went wrong.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A genuinely repo-less feature logs a "skipped" signal, not silence

**Covers:** AC3

**Steps:**
1. Complete any stage of a feature whose product has NO repository connected.
2. Look at the server log output.

**Expected outcome:**
> A `[cross-channel]` log line appears naming the event type `artefact_commit_skipped`, with the feature name, stage name, timestamp, and the reason `"no connected repo"`. This confirms the skip is now visible, not silent as before this story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The log line is real structured data, not just a readable sentence

**Covers:** AC4

**Steps:**
1. Take any of the `[cross-channel]` log lines from Scenarios 1–3.
2. Ask an engineer to confirm the text after `[cross-channel] ` is valid JSON (they can paste it into a JSON validator or `JSON.parse` it in a console).

**Expected outcome:**
> The engineer confirms it parses without error — the log line is structured data an automated tool could read, not just a human-readable sentence with values mixed in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
