# AC Verification Script: Start an impersonation session (search, reason-gated, session swap)

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Sign in as an admin. Have access to check the audit log (or database) directly to confirm entries are actually written, not just displayed.

**Reset between scenarios:** Exit any active impersonation session before starting the next scenario.

---

## Scenarios

### Scenario 1 — Search finds the right users (AC1)
1. Go to Settings → Impersonate. Type part of a real user's login or tenant name.

**Expected:** Only matching users appear in the list.

### Scenario 2 — Reason is required (AC2)
1. Pick a user, click "Act as →", and try to confirm without typing a reason.

**Expected:** You cannot proceed — the system tells you a reason is required.

🔴 **Manual scenario — AC3 (atomic swap + audit, high risk):**
1. Pick a user, give a reason, and confirm.
2. Immediately check the audit log (or query the database directly).

**Expected:** Exactly one new audit entry exists for this session, AND you are now viewing the app as the target user — both things are true at the same time, not just one of them.

🔴 **Manual scenario — AC4 (audit-failure safety, high risk):** *(requires deliberately simulating a broken audit write — e.g. temporarily pointing at an unreachable database, or ask engineering to simulate this in a test environment)*
1. With audit-writing broken, attempt to start an impersonation session.

**Expected:** The session does NOT start — you remain your own admin self. There is no state where impersonation is active but nothing was logged.

### Scenario 5 — Can't impersonate two people at once (AC5)
1. Start impersonating user X.
2. Without exiting, try to start impersonating user Y.

**Expected:** This is blocked or has no effect — you're still viewing as X, not Y.

### Scenario 6 — Two sessions produce two real, distinct audit rows (AC6, D37 wiring)
1. Impersonate user X, then exit. Impersonate user Y, then exit.
2. Check the audit log for both sessions.

**Expected:** Two separate entries exist, one correctly naming X and one correctly naming Y — not the same entry duplicated, and not one overwriting the other.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Search | | |
| 2 — Reason required | | |
| 3 — Atomic swap + audit 🔴 | | |
| 4 — Audit-failure safety 🔴 | | |
| 5 — No nested impersonation | | |
| 6 — D37 wiring correctness | | |
