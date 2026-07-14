# AC Verification Script: Automated cross-tenant repo isolation E2E spec

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.3.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.3-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. ⚠️ This scenario needs two separate test tenants, each with their own real (disposable) GitHub repo — not yet provisioned as of this script's writing. Confirm these exist before running.
2. Have access to both repos' GitHub commit history pages.

**Reset between scenarios:** Each scenario needs fresh tenants/products — this test creates real data, don't reuse across runs without cleanup.

---

## Scenarios

---

### Scenario 1: Two tenants working at the same time never cross paths

**Covers:** AC1

**Steps:**
1. As Tenant A, sign off an artefact, add an annotation, run a skill step, and edit a standard — all in Product A.
2. As Tenant B, do the same 4 actions in Product B.
3. Open Repo A's commit history and Repo B's commit history.

**Expected outcome:**
> Repo A only has Tenant A's 4 commits. Repo B only has Tenant B's 4 commits. Neither repo has anything from the other tenant.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Try to trick the system into writing to someone else's repo

**Covers:** AC2

**Steps:**
1. As Tenant A, attempt an action but substitute Tenant B's product ID (this requires a developer to craft the request — not a normal UI action).

**Expected outcome:**
> The request is rejected outright. Repo B's commit history shows no new commit from this attempt.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Confirm this check runs automatically and blocks bad changes

**Covers:** AC3

**Steps:**
1. Check the CI configuration (with a developer) to confirm this test is a required check.

**Expected outcome:**
> If this test fails, the build is blocked — it's not just an informational warning that can be ignored.

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
