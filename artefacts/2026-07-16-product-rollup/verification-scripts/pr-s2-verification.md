# AC Verification Script: Sync a product's connected repo and show aggregate DoD status

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s2.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s2-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product with a connected GitHub repo you can access (skills-framework's own product, or a test product pointing at a repo with a real `.github/pipeline-state.json`).
2. Know how to trigger a sync (a button/action on the product's page — ask the implementer if unsure).
3. For the failure scenarios, have access to a way to point a product at a repo/path that doesn't exist, or temporarily revoke access (ask the implementer for the easiest way to simulate this).

**Reset between scenarios:** Between the failure scenarios (3 and 4) and the earlier success scenarios, make sure you're pointing back at a real, accessible repo before re-testing success paths.

---

## Scenarios

---

### Scenario 1: Triggering a sync fetches real data and stores it

**Covers:** AC1

**Steps:**
1. Go to a product's page whose connected repo has a real `.github/pipeline-state.json`.
2. Click the action that triggers a sync.

**Expected outcome:**
> The sync completes without an error message. (You'll confirm what it actually shows in Scenario 2.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The product page shows real DoD status counts after syncing

**Covers:** AC2

**Steps:**
1. After Scenario 1's sync completes, reload (or stay on) the product's page.

**Expected outcome:**
> The page shows a count of features at each delivery stage (e.g. "3 complete, 2 in progress") — not just a plain feature count like before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A sync against a repo that doesn't exist fails visibly

**Covers:** AC3

**Steps:**
1. Point a test product at a repo (or file path) that doesn't exist, or that you don't have access to.
2. Trigger a sync.

**Expected outcome:**
> A clear error message appears — you can tell the sync failed. The page does not show old data pretending to be current, and does not show an empty/blank rollup as if that were a real result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Syncing two different products fetches each one's own real data, not a shared fixture

**Covers:** AC5

**Steps:**
1. Sync Product A (whose connected repo has its own real `pipeline-state.json`).
2. Note the DoD status counts shown.
3. Sync Product B (a different product, connected to a different repo).
4. Note Product B's DoD status counts.

**Expected outcome:**
> Product A and Product B show different counts, each correctly reflecting their own connected repo's actual data — not the same numbers for both, and not one product accidentally showing the other's data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A product with epic-grouped features counts correctly

**Covers:** AC4

**Steps:**
1. Sync a product whose connected repo's `pipeline-state.json` has features organised into epics (not just a flat list) — skills-framework's own repo is a real example of this.
2. Look at the DoD status counts shown.

**Expected outcome:**
> Features that live inside an epic are included in the counts — the total isn't missing any of them just because they're grouped under an epic rather than listed at the top level.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
