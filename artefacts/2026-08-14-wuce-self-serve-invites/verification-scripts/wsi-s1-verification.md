# AC Verification Script: Admin creates a per-person team invite, which sends the invite email

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s1-admin-creates-invite-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in as a tenant admin.
2. Go to your tenant's team/member management page.

**Reset between scenarios:** No reset needed — each scenario uses a different invitee email.

---

## Scenarios

---

### Scenario 1: Creating an invite sends a real email and records it correctly

**Covers:** AC1, AC2

**Steps:**
1. Enter a teammate's email address and pick a role (e.g. "Engineer").
2. Click "Send invite" (or equivalent).
3. Check the invitee's inbox (or your test email tool).

**Expected outcome:**
> The invitee receives a real email inviting them to join your team, with a link to accept. The invite shows up in your own admin view as "pending."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A role must be chosen — you can't submit without one

**Covers:** AC4

**Steps:**
1. Enter a teammate's email address.
2. Leave the role field unselected/blank.
3. Try to submit.

**Expected outcome:**
> The form does not submit — you're told a role is required. No invite is created.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An invalid role is rejected

**Covers:** AC3

**Steps:**
1. Attempt to submit an invite with a role value that isn't one of the real options (e.g. by tampering with the request directly, since the UI dropdown itself won't normally offer an invalid value).

**Expected outcome:**
> The request is refused with a clear "invalid role" message. No invite is created.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Email sending fails

**Covers:** AC5

**Steps:**
1. Simulate an email-sending failure (e.g. temporarily point the email provider config at an invalid API key, in a test/staging environment only — never production).
2. Try to send an invite.

**Expected outcome:**
> You see a clear error telling you the invite could not be emailed. You are NOT told the invite was sent successfully when it wasn't.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC2) | | |
| Scenario 2 (AC4) | | |
| Scenario 3 (AC3) | | |
| Edge case (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
