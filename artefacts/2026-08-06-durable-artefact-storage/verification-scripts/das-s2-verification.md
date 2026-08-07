# AC Verification Script: Require a connected repo before a new product can start its first journey

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Technical test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Create a brand-new test product with no journeys yet and no repo connected.
2. Have an existing product on hand that already has at least one journey but no connected repo (for the regression check).

**Reset between scenarios:** Use a fresh product per scenario where possible.

---

## Scenarios

---

### Scenario 1: A brand-new product is asked to connect a repo first

**Covers:** AC1

**Steps:**
1. On the brand-new product, try to start your first journey.

**Expected outcome:**
> You're stopped and directed to connect a repo first — not a confusing generic error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Connecting a repo unblocks you immediately

**Covers:** AC2

**Steps:**
1. From the block in Scenario 1, connect a repo using the picker.
2. Try starting the journey again.

**Expected outcome:**
> It works this time, with no further friction.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An existing product isn't suddenly blocked

**Covers:** AC3

**Steps:**
1. On the existing product that already has a journey but no connected repo, try to start a new journey.

**Expected outcome:**
> It's not blocked — this gate only applies to brand-new products, never retroactively to ones you were already using.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A product created with a repo already connected has no friction at all

**Covers:** AC4

**Steps:**
1. Create another new product, connecting a repo during setup.
2. Start its first journey.

**Expected outcome:**
> No prompt or block at all — it just works, since the requirement was already satisfied.

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
