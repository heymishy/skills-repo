# AC Verification Script: Bootstrap a brand-new tenant's first admin automatically on login

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Technical test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a way to sign up fresh via GitHub, Google, or email/password with an account and tenant that has never been used on this platform before.
2. Have a second real account available that can join the same tenant right after the first (for Scenario 2) — this may need a developer's help to set up, since it requires two accounts sharing one tenant.
3. Access to the Team members page (`/team/members`) to check who has admin.

**Reset between scenarios:** Each scenario needs its own genuinely fresh, never-before-used tenant — reusing a tenant from an earlier scenario will not show a fresh-signup result.

---

## Scenarios

---

### Scenario 1: A brand-new person signing up gets admin immediately

**Covers:** AC1

**Steps:**
1. Sign up fresh — any of GitHub, Google, or email/password — with an account and tenant that has never been used on this platform before.
2. Immediately after signing in, go to Team members (`/team/members`).

**Expected outcome:**
> You can see the Team members page with no "Forbidden" error. You're already the admin — no extra steps, no waiting, nobody had to add you.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A second, different person joining the same brand-new tenant right after does NOT automatically become admin

**Covers:** AC2

**Steps:**
1. Right after Scenario 1, have a second, different real account sign in for the first time into the SAME tenant Scenario 1's account just claimed.
2. Try to view Team members as this second account.

**Expected outcome:**
> The second account is denied ("Forbidden") on Team members — only the very first person to sign up into that tenant got admin automatically.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Two people signing up into the same brand-new tenant at the exact same instant — exactly one becomes admin

**Covers:** AC3

**Steps:**
1. This scenario requires a developer to run the automated concurrent-bootstrap test directly (`node scripts/run-all-tests.js` or the specific test file for this story), since verifying two truly simultaneous sign-ups by hand isn't practically possible for a human tester.

**Expected outcome:**
> The test passes — confirming that when two sign-ups race for the same brand-new tenant, exactly one becomes admin. Never zero admins, never two.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Signing up via GitHub, Google, or email all grant admin the same way

**Covers:** AC4

**Steps:**
1. Repeat Scenario 1's sign-up flow three separate times, each with a genuinely fresh tenant — once via GitHub, once via Google, once via email/password.
2. Check Team members after each.

**Expected outcome:**
> All three show you as admin immediately, with no difference in behaviour between the three sign-up methods.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Joining a tenant that already has an admin does not create a second admin

**Covers:** AC5

**Steps:**
1. Have someone who is not already an admin get added to a tenant that already has a real admin — via the existing "Add teammate" form.
2. Have that new person sign in for the first time.

**Expected outcome:**
> The new person does NOT get admin access — Team members still shows "Forbidden" for them, and the original admin remains the only admin.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A mid-process failure never leaves a tenant permanently stuck

**Covers:** AC6

**Steps:**
1. This scenario requires a developer to run the automated rollback test directly, since it depends on deliberately forcing a write to fail partway through — not something reproducible by hand.

**Expected outcome:**
> The test passes — confirming that if something goes wrong partway through granting the first admin, the tenant is left with NO admin (a clean, recoverable state), not a broken half-state. Importantly, this also means a later sign-up attempt into that same tenant can still succeed normally — nobody gets permanently locked out by a one-off failure.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Brand-new signup gets admin | | |
| Scenario 2 — Second person doesn't auto-become admin | | |
| Scenario 3 — Concurrent signup race (developer-run) | | |
| Scenario 4 — All 3 providers consistent | | |
| Scenario 5 — No second admin when one exists | | |
| Edge case — Recoverable after a mid-process failure (developer-run) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
