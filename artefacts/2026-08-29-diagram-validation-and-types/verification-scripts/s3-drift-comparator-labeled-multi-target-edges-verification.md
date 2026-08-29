# AC Verification Script: Drift-comparator recognizes labeled and multi-target edges

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s3-drift-comparator-labeled-multi-target-edges.md
**Technical test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s3-drift-comparator-labeled-multi-target-edges-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a completed feature's design (as-designed) System Architecture diagram and its as-built equivalent.
2. Ask your engineer/reviewer to run the drift-check comparison, or trigger it via the platform's own drift-check mechanism.

**Reset between scenarios:** Use a fresh pair of diagrams for each scenario.

---

## Scenarios

### Scenario 1: A labeled connection between two components doesn't cause a false alarm

**Covers:** AC1

**Steps:**
1. Author an as-designed System Architecture diagram where one connection has a label (e.g. "creates").
2. Author (or use a real) as-built diagram with the same connection, unlabeled.
3. Run the drift check.

**Expected outcome:**
> The drift check reports MATCHED — a label on a connection line doesn't count as a real structural difference.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: One component connecting to two others in a single line is understood correctly

**Covers:** AC2, AC3

**Steps:**
1. Author an as-designed diagram where one component connects to two others written on a single line (e.g. "Service A connects to Service B and Service C").
2. Author an as-built diagram expressing the same two connections as two separate lines.
3. Run the drift check.

**Expected outcome:**
> The drift check reports MATCHED — both ways of writing the same two connections are recognized as equivalent.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Ordinary single connections still work

**Covers:** AC4

**Steps:**
1. Use a pair of diagrams with only ordinary, single-line, single-target connections (no labels, no multi-target lines).
2. Run the drift check.

**Expected outcome:**
> Behaves exactly as it always has — MATCHED or DIVERGED results are unchanged from before this change.

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
