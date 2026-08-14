# AC Verification Script: Expired invites (past 24 hours) are rejected cleanly

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s3-invite-expiry-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Note: this script requires waiting 24+ hours after creating an invite, or a way to fast-forward the invite's `expires_at` in a test/staging database. If neither is practical, treat Scenario 1 as a code-review-only check rather than a live manual walkthrough.

**Reset between scenarios:** Send a fresh invite before Scenario 2.

---

## Scenarios

---

### Scenario 1: An expired invite is rejected with a clear message

**Covers:** AC1, AC2

**Steps:**
1. Create an invite, then wait 24+ hours (or adjust its expiry in a test database to be in the past).
2. Click the invite link.

**Expected outcome:**
> You see a clear message saying the invite has expired — not a generic error, not a blank/broken page. You do NOT get added to the tenant.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A fresh invite still works normally

**Covers:** AC3

**Steps:**
1. Create a brand-new invite and accept it right away.

**Expected outcome:**
> Works exactly as before — you join the tenant with the assigned role, no expiry-related error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC2) | | |
| Scenario 2 (AC3) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
