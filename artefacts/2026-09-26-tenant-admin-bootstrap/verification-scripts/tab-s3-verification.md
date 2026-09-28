# AC Verification Script: Retire the legacy admin-bootstrap path

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Technical test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story is a pure code-removal — most of it is developer-verified (grep checks, test suite), not something to click through in the product.
2. You'll need access to run a grep search across the codebase, and access to this platform's Fly deployment dashboard/CLI for Scenario 3.

**Reset between scenarios:** Not applicable.

---

## Scenarios

---

### Scenario 1: The legacy admin-granting code is genuinely gone

**Covers:** AC1, AC2, AC5

**Steps:**
1. Ask a developer to search the entire codebase for `ADMIN_GITHUB_LOGINS`, `getUserRole`, `setGetUserRole`, and `_backfillOne`.

**Expected outcome:**
> No real application code mentions any of these anymore — only, at most, a test file that specifically checks they're gone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Nothing else broke

**Covers:** AC4

**Steps:**
1. Ask a developer to run the full automated test suite.

**Expected outcome:**
> Everything passes except the small number of already-known, unrelated flaky checks this repo already lives with — nothing new breaks.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The old admin-granting secret is removed from both real environments

**Covers:** AC3

**Steps:**
1. Check the Fly secrets configured for `wuce-staging`.
2. Check the Fly secrets configured for production (`skills-framework`).

**Expected outcome:**
> `ADMIN_GITHUB_LOGINS` is not set on either one anymore.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Legacy code genuinely gone | | |
| Scenario 2 — Nothing else broke | | |
| Scenario 3 — Legacy secret removed from both environments | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
