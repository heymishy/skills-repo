# AC Verification Script: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a repo-connected feature with both css-s1 and css-s2's sync mechanisms working.
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh test feature for each scenario so conflict history doesn't carry over.

---

## Scenarios

---

### Scenario 1: Advancing both sides independently triggers a conflict, and pipeline-state.json wins

**Covers:** AC1, AC2

**Steps:**
1. Advance a gate on the CLI side for a feature (e.g. run `bin/skills gate-advance` for `test-plan-complete`).
2. Before that syncs, also complete a *different* stage on the same feature's web-UI journey (simulating two people or two surfaces disagreeing).
3. Let the sync mechanism run.
4. Check the web-UI journey's stage record afterward.

**Expected outcome:**
> The journey's stage record now matches whatever `pipeline-state.json` says — not whatever was set on the web UI in step 2.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A resolved conflict leaves a visible trail

**Covers:** AC3

**Steps:**
1. After Scenario 1, check the conflict log (location confirmed at implementation time — likely a maintainer-facing query or admin view).

**Expected outcome:**
> There's a record showing: which feature had the conflict, what each side's value was, which one won, and when it happened.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A normal single-sided advance doesn't show up as a conflict

**Covers:** AC4

**Steps:**
1. Advance a gate on only one side (CLI or web UI) for a feature — don't touch the other side at all.
2. Check the conflict log afterward.

**Expected outcome:**
> Nothing new appears in the conflict log — this was an ordinary sync, not a disagreement, and the log is reserved for genuine conflicts only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
