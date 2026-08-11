# AC Verification Script: Admin approves or rejects a promotion request

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s9-approve-reject-promotion.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s9-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. As a non-admin user, submit a promotion request (from `wugs-s8`'s setup).
2. Sign in as an admin on the same tenant to review it.

**Reset between scenarios:** Submit a fresh promotion request before each scenario.

---

## Scenarios

---

### Scenario 1: Approving a request opens a real PR against the org repo

**Covers:** AC1

**Steps:**
1. As an admin, find the pending promotion request and click "Approve."
2. Check the tenant's org repo on GitHub.

**Expected outcome:**
> A new PR exists on the org repo containing exactly the content that was requested for promotion.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Rejecting a request does nothing to the org repo

**Covers:** AC2

**Steps:**
1. As an admin, find a different pending request and click "Reject."
2. Check the org repo.

**Expected outcome:**
> No new branch, commit, or PR appears in the org repo. The request no longer shows as pending.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A non-admin cannot approve or reject, even by calling the action directly

**Covers:** AC3

**Steps:**
1. As a non-admin user, attempt to approve or reject a pending request (e.g. via a direct link or browser dev tools, not just checking the button is hidden).

**Expected outcome:**
> The action is refused with a clear "not allowed" response — it does not succeed just because the button happened to be reachable.

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
