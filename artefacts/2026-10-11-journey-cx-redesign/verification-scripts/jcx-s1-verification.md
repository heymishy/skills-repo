# AC Verification Script: Add a placeholder feature to a journey stage, triggering a new seeded discovery

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with at least 1 stage on the Customer experience tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Add a placeholder feature to a stage

**Covers:** AC1, AC5

**Steps:**
1. On a stage with no features mapped, click "Add placeholder feature."
2. Type a name (e.g. "Bulk export") and save.

**Expected outcome:**
> The stage now shows a new row labelled "Placeholder" with the name you typed — visually distinct from a normal mapped feature (not just a plain text line).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Trigger the placeholder, starting a new discovery

**Covers:** AC2

**Steps:**
1. On a stage with a placeholder feature (from Scenario 1), click "Trigger."

**Expected outcome:**
> A new discovery session opens, with the problem statement already filled in from this stage's own context (name, emotion, pain points, opportunities, touchpoints) — you don't start from a blank page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A stage can have both a real feature and a placeholder

**Steps:**
1. On a stage that already has a real feature mapped, add a placeholder feature too.

**Expected outcome:**
> Both the real feature and the placeholder show up on the stage — adding one doesn't remove or replace the other.

**Covers:** AC4

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Edge case: Cross-tenant stage cannot be used

**Covers:** AC3

**Steps:**
1. Using a browser dev tool or a second account, attempt to add or trigger a placeholder feature on a stage that belongs to a different organization.

**Expected outcome:**
> The action fails with a "not found" response — not a "forbidden" response — and nothing is created or changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — add a placeholder | | |
| Scenario 2 — trigger starts a new discovery | | |
| Scenario 3 — real + placeholder coexist | | |
| Edge case — cross-tenant denied 🔴 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
