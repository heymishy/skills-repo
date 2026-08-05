# AC Verification Script: Resolve each product's own repo for SaaS export, tenant-scoped

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Technical test plan:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to two test products, each connected to a different repo, with a DoR-approved feature in each.
2. Have credentials authorized for each product separately (and one authorized for neither).

**Reset between scenarios:** Not needed — scenarios are independent read-only checks.

---

## Scenarios

---

### Scenario 1: Each product's export resolves its own repo

**Covers:** AC1, AC2

**Steps:**
1. Call the export endpoint for product A's feature slug, using product A's credential.
2. Call the export endpoint for product B's feature slug, using product B's credential.

**Expected outcome:**
> Each call returns that product's own artefact content — product A's response never contains product B's content or vice versa.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Wrong credential gets refused without leaking which repo exists

**Covers:** AC3

**Steps:**
1. Call the export endpoint for product A's feature slug, using a credential that isn't authorized for product A.

**Expected outcome:**
> You get a 403 error. The error message does not mention product A's repo name, owner, or any identifying detail — just that access is denied.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A slug that doesn't exist anywhere behaves consistently, without leaking detail either

**Covers:** AC3

**Steps:**
1. Call the export endpoint with a feature slug that doesn't belong to any product.

**Expected outcome:**
> You get an error (may be a different status code than Scenario 2 — that's expected and fine). The error message still doesn't reveal any repo/owner/tenant detail.

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
