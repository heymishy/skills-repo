# AC Verification Script: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have css-s1, css-s2, and css-s3's mechanisms already working.
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh test feature per gate type tested.

---

## Scenarios

---

### Scenario 1: Every gate type syncs, not just discovery-approved

**Covers:** AC1

**Steps:**
1. For each of the 7 pipeline stages (discovery, benefit-metric, definition, test-plan, DoR, branch-complete, definition-of-done), advance that gate on the CLI for a feature with a connected journey.

**Expected outcome:**
> Each time, the connected journey reflects that specific stage's completion — not just the first one you tried.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A gap that failed to sync gets picked up the next time you touch that feature

**Covers:** AC2

**Steps:**
1. (Requires a test setup where the `pipeline-state.json` write is deliberately made to fail once, logging a gap.)
2. Later, do any other authenticated action on that same feature's journey in the web UI.

**Expected outcome:**
> The earlier gap gets resolved as part of that later action — you don't have to do anything special to trigger it, and you never had to re-enter any credentials for it to happen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Measuring the real automatic-agreement rate after 4 weeks

**Covers:** AC3

**Steps:**
1. After this feature has been live for 4 weeks, count the total number of phase-boundary advances (from the reconciliation/sync log) and how many of them required a manual intervention (a logged gap that a human had to resolve directly, rather than the reconciliation mechanism catching it).
2. Calculate the percentage that propagated automatically.

**Expected outcome:**
> The reported percentage is stated honestly — whether it's above or below the 90% minimum signal from `benefit-metric.md`. If it's below, that's a real finding to act on, not something to round up or gloss over.

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
