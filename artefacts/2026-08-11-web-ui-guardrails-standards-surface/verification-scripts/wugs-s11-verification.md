# AC Verification Script: Remove `smug-s1`'s promote/opt-out routes and old Standards tab rendering

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s11-remove-smug-s1-routes-and-tab.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s11-remove-smug-s1-routes-and-tab-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have the old Standards tab URL handy for a product (e.g. `/products/<id>/standards-tab`).

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: The old Standards page no longer exists

**Covers:** AC1

**Steps:**
1. Visit the old Standards tab URL directly.

**Expected outcome:**
> You get a "not found" page — the old promote/opt-out page is gone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking "Standards" in the nav takes you to the new view

**Covers:** AC2

**Steps:**
1. Open any product and click the "Standards" link in the left nav.

**Expected outcome:**
> You land on the new repo-backed guardrails/standards view (from Epic 1), not a 404 and not the old page. There's only one "Standards" link, not two.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
