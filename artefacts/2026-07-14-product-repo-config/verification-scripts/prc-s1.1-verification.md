# AC Verification Script: Add repo association columns to the products table

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.1.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.1-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to the products database (staging or a local Postgres instance).
2. Note down the current columns on the `products` table (run `\d products` in `psql`, or check the schema another way) so you can compare before/after.

**Reset between scenarios:** No reset needed — these scenarios are read-only checks against the schema.

---

## Scenarios

---

### Scenario 1: New columns appear on the products table

**Covers:** AC1

**Steps:**
1. Start the app (or run the migration step directly) against a database that doesn't yet have the new columns.
2. Check the `products` table's columns.

**Expected outcome:**
> Three new columns exist: `repo_provider`, `repo_owner`, `repo_name`. None of them are required (they can be empty/blank for existing rows).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Existing products aren't affected

**Covers:** AC2

**Steps:**
1. Look up a product that already existed before this change.
2. Check its `repo_provider`, `repo_owner`, `repo_name` values.

**Expected outcome:**
> All three are blank/empty — nothing was auto-filled in for existing products.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Running the setup step twice doesn't break anything

**Covers:** AC3

**Steps:**
1. Restart the app a second time (or re-run the migration step again).

**Expected outcome:**
> No error appears. The `products` table still has exactly the same three new columns — not duplicated, not renamed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

<!-- No edge cases beyond the 3 ACs — this is a narrow schema-only story. -->

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
