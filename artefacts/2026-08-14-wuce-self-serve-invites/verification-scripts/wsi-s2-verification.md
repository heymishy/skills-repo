# AC Verification Script: Invitee accepts the invite and joins the tenant with the assigned role

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s2-invitee-accepts-and-joins-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. As an admin, send an invite to a real test email address you control, choosing a specific role (e.g. "Product").

**Reset between scenarios:** Send a fresh invite before each scenario that needs a valid, unused one.

---

## Scenarios

---

### Scenario 1: A brand-new person accepts and lands in the tenant with the right role

**Covers:** AC1, AC2

**Steps:**
1. Open the invite email (using an email address that has never logged into wuce before).
2. Click the invite link.
3. Complete sign-in (GitHub, Google, or email/password — whichever you're offered).

**Expected outcome:**
> You land inside the invited tenant. Your role there matches exactly what the admin chose when creating the invite (e.g. "Product").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Someone who already has a wuce account accepts an invite

**Covers:** AC3

**Steps:**
1. As the admin, invite someone whose email you know already has a wuce login elsewhere.
2. Have them click the link and sign in with their existing account.

**Expected outcome:**
> They join the new tenant with the invited role — no duplicate account is created, their existing login still works everywhere else it did before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Using the same invite link twice

**Covers:** AC4

**Steps:**
1. Accept a valid invite successfully (Scenario 1 or 2).
2. Click the SAME invite link again (or open it in a second browser/incognito window).

**Expected outcome:**
> The second attempt is refused with a clear "this invite has already been used" message (or similar) — it does not create a second membership or silently succeed again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Existing invite/login flows still work

**Covers:** AC5

**Steps:**
1. If you have access to a Client-org invitation flow (from the separate `2026-07-30-agency-client-organisations` feature) or the Client login flow, exercise one of them.

**Expected outcome:**
> Both continue to work exactly as they did before this story shipped — no change in behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC2) | | |
| Scenario 2 (AC3) | | |
| Edge case (AC4) | | |
| Edge case (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
