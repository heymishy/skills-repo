# AC Verification Script: Suggest whether a stage revision is material to downstream stages

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Technical test plan:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s3-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Complete res-s2's Scenario 1 (send a revision to a reopened stage) — you need a completed revision to trigger this story's behaviour.

**Reset between scenarios:** Reopen the stage and send a fresh revision for each scenario.

---

## Scenarios

### Scenario 1: A revision gets a materiality suggestion right away

**Covers:** AC1

**Steps:**
1. Reopen a completed stage and send a revision (any change).
2. Look at the chat response.

**Expected outcome:**
> Along with confirming your change, the response also tells you whether this looks like a "material" or "minor" change, with one sentence explaining why.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A scope-changing revision is flagged as material

**Covers:** AC2

**Steps:**
1. Reopen a completed stage (e.g. Discovery).
2. Send a revision that changes something substantial — e.g. "actually, let's also affect anyone using the artefact-index View link, not just the step-nav."
3. Look at the materiality suggestion.

**Expected outcome:**
> The suggestion says "material" and the one-sentence explanation mentions that the scope changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A wording-only revision is flagged as minor

**Covers:** AC3

**Steps:**
1. Reopen a completed stage.
2. Send a revision that only rewords a sentence without changing what it means — e.g. "reword the second paragraph to be clearer, don't change the meaning."
3. Look at the materiality suggestion.

**Expected outcome:**
> The suggestion says "minor."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The suggestion is recorded, not just shown once

**Covers:** AC4

**Steps:**
1. After Scenario 1, 2, or 3, ask your engineer/reviewer to check the session's activity log for this journey.

**Expected outcome:**
> The materiality suggestion (material or minor) shows up in the log — this is what lets the team later measure how often people agree with the suggestion.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
