# AC Verification Script: Reactive-vs-planned load rollup by pod

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
**Technical test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a connected product with at least two pods configured, each with a mix of reactive (short-track or decisions.md-sourced) and planned (standard-track) items.
2. Also have access to this repo's own product row (or another with no pods configured) for the "Unassigned" scenario.

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: Each pod shows its own reactive and planned counts

**Covers:** AC1, AC2

**Steps:**
1. Open the consolidated features view for the multi-pod product.
2. Find the reactive/planned rollup (reached via a tab or chip on the same page).
3. Look at one pod's row.

**Expected outcome:**
> That row shows two separate numbers, for example "3 reactive / 12 planned" — not one combined number.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A product with no pods shows one honest "Unassigned" total

**Covers:** AC3

**Steps:**
1. Open the consolidated features view for a product with no pods configured.
2. Find the reactive/planned rollup.

**Expected outcome:**
> There is exactly one row, labeled "Unassigned", showing the reactive/planned split for the whole product — not an empty rollup, not an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The rollup is one click away, not a separate page

**Covers:** AC4

**Steps:**
1. From the consolidated features view (any product), locate and click the rollup's tab or chip.

**Expected outcome:**
> The rollup appears on the same page, in the same way the existing tabs/chips already behave — the browser's address bar does not navigate to a different page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Counts remain correct when an item has no pod assignment but the product has a default pod

**Covers:** AC1

**Steps:**
1. Find a feature in the test product that has no explicit pod assignment, where the product itself has a default pod set.
2. Check which pod's row that item's count is reflected in.

**Expected outcome:**
> That item is counted under the product's default pod's row, not under "Unassigned" and not silently dropped.

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
