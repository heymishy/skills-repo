# AC Verification Script: Remove the `standards`/`standard_product_optouts` DB tables and their references

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s12-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test product you can safely delete.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Deleting a product still works cleanly after the tables are removed

**Covers:** AC2

**Steps:**
1. Create a test product.
2. Delete it.

**Expected outcome:**
> The product is deleted successfully — no error page, no crash. This confirms removing the old standards tables didn't break normal product deletion.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The old tables genuinely no longer exist

**Covers:** AC3

**Steps:**
1. Check the database directly (or via an admin tool) for the `standards` and `standard_product_optouts` tables.

**Expected outcome:**
> Neither table exists anymore.

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
