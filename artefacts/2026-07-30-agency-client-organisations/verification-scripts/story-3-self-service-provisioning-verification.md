# AC Verification Script: Self-service Agency-to-Client provisioning

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-3-self-service-provisioning-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an Agency-type test account ready.
2. Have access to a test inbox (or a way to view sent emails, e.g. Resend's dashboard/test mode) to check the invitation email actually arrives.
3. Have a Standalone or Client-type test account ready for the negative scenario.

**Reset between scenarios:** Each scenario creates its own new Client org — no shared state to reset.

---

## Scenarios

---

### Scenario 1: An Agency admin can create a Client organisation

**Covers:** AC1

**Steps:**
1. Sign in as the Agency admin.
2. Click "Create Client" (or the equivalent entry point).
3. Type a name for the new Client organisation and submit.

**Expected outcome:**
> The new Client organisation appears in your list of clients, with the name you entered.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Only Agency accounts can create clients

**Covers:** AC2

**Steps:**
1. Sign in as a Standalone (non-Agency) test account.
2. Try to reach the "Create Client" page directly by typing its web address.

**Expected outcome:**
> You are blocked from reaching this page — you see an error or are redirected away, not the create-client form.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Inviting the first user sends a real invitation email

**Covers:** AC3

**Steps:**
1. As the Agency admin, on the Client org you just created, invite a user by entering an email address you can check.
2. Check that inbox (or the Resend dashboard's test view).
3. Click the link in the email.

**Expected outcome:**
> An email arrives at the address you entered, containing a link. Clicking the link signs you in as a new user of that Client organisation — you land in the app, not on an error page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A blank organisation name is rejected

**Covers:** AC4

**Steps:**
1. As the Agency admin, open "Create Client" again.
2. Leave the name field blank and submit.

**Expected outcome:**
> No new organisation is created. You see a validation message telling you the name is required.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The invited user becomes the client org's own admin

**Covers:** AC3 (role model)

**Steps:**
1. After completing Scenario 3, as the newly-signed-in Client-org user, look for any org-management or "convert to independent account" action (this ties to a later story but confirms the role took effect).

**Expected outcome:**
> The action is available to you (not blocked as "not authorised") — confirming you were set up as this org's privileged first user, not a plain read-only viewer.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
