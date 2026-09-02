# AC Verification Script: De-emphasize Unknown Health Visually

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s3.md
**Technical test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `skills-framework` on staging (or any product with a mix of Healthy, Warning, and Unknown items) and expand a group.

**Reset between scenarios:** No reset needed — all scenarios use the same loaded page.

---

## Scenarios

---

### Scenario 1: Unknown items no longer shout for attention

**Covers:** AC1

**Steps:**
1. Look at an item showing "? Unknown" health.

**Expected outcome:**
> The Unknown label appears in quiet grey text — not inside a colored badge the way Blocked or Warning items are.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Real health states still stand out

**Covers:** AC2

**Steps:**
1. Look at a Healthy, a Warning, and a Blocked item on the same page.

**Expected outcome:**
> All three still show their familiar colored badges (green/amber/red), exactly as before — nothing about how real health states look has changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The overall product summary itself has no health data

**Covers:** AC3

**Steps:**
1. Find (or create) a product that has never synced any health data at all.
2. Look at its "Overall:" summary line at the top.

**Expected outcome:**
> The Overall line also shows the quiet, de-emphasized treatment — not a colored badge claiming a health state that isn't real.

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
