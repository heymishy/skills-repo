# AC Verification Script: Drift-comparator recognizes subgraphs

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Technical test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s4-drift-comparator-subgraphs-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a completed feature's design (as-designed) diagram that groups some components together visually, and its as-built equivalent.

**Reset between scenarios:** Use a fresh pair of diagrams for each scenario.

---

## Scenarios

### Scenario 1: Grouping components visually doesn't hide them from the drift check

**Covers:** AC1

**Steps:**
1. Author an as-designed diagram that groups two or more components together in a labelled box (a subgraph).
2. Run the drift check against an as-built diagram containing those same components.

**Expected outcome:**
> The grouped components are recognized and compared correctly — none of them are silently ignored just because they were grouped.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A connection in or out of a grouped box is understood correctly

**Covers:** AC2

**Steps:**
1. Author an as-designed diagram where a component inside a group connects to one outside the group.
2. Run the drift check against a matching as-built diagram.

**Expected outcome:**
> The connection is recognized correctly on both ends, regardless of which side of the grouping box each component is on.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Grouping alone doesn't count as a real difference

**Covers:** AC3

**Steps:**
1. Author an as-designed diagram that groups some components together.
2. Author an as-built diagram with the exact same components and connections, but with no grouping at all.
3. Run the drift check.

**Expected outcome:**
> The drift check reports MATCHED — the two diagrams describe the same real structure, and grouping is treated as a visual choice, not a structural one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Diagrams with no grouping still work

**Covers:** AC4

**Steps:**
1. Use a pair of diagrams with no subgraphs at all — the ordinary case.
2. Run the drift check.

**Expected outcome:**
> Behaves exactly as it always has.

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
