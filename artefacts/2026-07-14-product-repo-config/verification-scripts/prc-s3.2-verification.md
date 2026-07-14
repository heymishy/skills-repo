# AC Verification Script: Rebuild the standards DB cache from git content

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.2.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.2-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product connected to a real repo with at least one standard already created.
2. Have direct database access (or an admin tool) to inspect the `standards` table, and direct GitHub access to edit a file in the repo.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Cache stays in sync right after a write

**Covers:** AC1

**Steps:**
1. Create or edit a standard through wuce's UI.
2. Immediately check the `standards` database table for that row.

**Expected outcome:**
> The database row already matches what you just wrote — no delay, no need to refresh or wait.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Cache can be rebuilt from scratch

**Covers:** AC2

**Steps:**
1. (In a test/staging environment only) clear the `standards` table.
2. Trigger whatever mechanism rebuilds the cache (e.g. restart the app, or a rebuild button/command if one exists).
3. Check the table again.

**Expected outcome:**
> The table is repopulated with content matching what's actually in each product's repo — nothing is missing or wrong.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Editing a standard file directly on GitHub shows up in wuce

**Covers:** AC3

**Steps:**
1. On GitHub, directly edit a standard's file content (bypassing wuce's UI entirely).
2. Go back to wuce and view that standard.

**Expected outcome:**
> wuce shows the new content you just typed on GitHub — not the old, stale content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

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
