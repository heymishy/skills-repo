# AC Verification Script: Admin has a real, reachable form to create a team invite

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s6-invite-creation-ui-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in as a tenant admin.
2. Go to the new team-invite creation page (e.g. `/team/invites/new`).

**Reset between scenarios:** No reset needed — each scenario just inspects the page or a rejected request.

---

## Scenarios

---

### Scenario 1: The invite-creation page has a real, usable form

**Covers:** AC1, AC4

**Steps:**
1. Open the invite-creation page.
2. Look at the email field and the role field.
3. Try clicking into the email field, then pressing Tab to move to the role dropdown, then Tab again to reach the submit button — all using only the keyboard.

**Expected outcome:**
> You see a real text field labelled something like "Email", and a real dropdown labelled "Role" listing the actual roles (admin, engineer, product, viewer) — not a placeholder list. A real, clickable "Send invite" (or similar) button is present. Tabbing through with the keyboard alone reaches every field and the button, in order — nothing requires a mouse click to reach.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Submitting the form actually creates an invite

**Covers:** AC2

**Steps:**
1. Fill in a real email address and pick a role.
2. Click the submit button.

**Expected outcome:**
> The invite is created — you can independently confirm this the same way `wsi-s1`'s own verification already does (the invitee receives a real email, and the invite shows up in the admin view as pending). Note: because this story deliberately does not add any client-side polish (see the story's own Architecture Constraints), you will likely land on a plain page showing raw success/error text after submitting — that is expected, not a bug. Record it as a Note here regardless of Pass/Fail, since it is a known, accepted rough edge (review finding `1-L3`), not something to mark as a failure on its own.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A non-admin can't reach the page

**Covers:** AC3

**Steps:**
1. Log in as someone who is NOT a tenant admin (or log out entirely).
2. Try to open the invite-creation page directly by URL.

**Expected outcome:**
> You are blocked — the same way you're already blocked from any other admin-only page in the product (e.g. the existing "add teammate" page). No form is shown.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC4) | | |
| Scenario 2 (AC2) | | |
| Edge case (AC3) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
