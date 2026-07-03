# AC Verification Script: arl-s2 — Credits guard admin bypass and requireAdmin middleware

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s2.md
**Technical test plan:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s2-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. All scenarios in this script run as automated tests — no browser required.
3. arl-s1 must be deployed before the post-deploy edge case in Scenario 7 can be verified.

**Automated test command:**
```
node tests/check-arl-s2-admin-middleware.js
```

**Reset between scenarios:** Not needed — each test is isolated.

---

## Scenarios

---

### Scenario 1: Admin bypasses the credits guard (automated)

**Covers:** AC1

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: creditsGuard calls next() immediately when session.role is 'admin'`
3. Also look for: `PASS: creditsGuard does not call next() when session.role is 'admin' even if balance spy would return 0`

**Expected outcome:**
> Both tests pass. When the session has `role = 'admin'`, the credits guard lets the request through without checking the balance — even when the balance would be 0.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Non-admin with zero balance is still blocked (automated — M3 regression gate)

**Covers:** AC2

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: creditsGuard returns 402 when session.role is 'user' and balance is 0`

**Expected outcome:**
> The test passes. A regular user with a zero credit balance gets HTTP 402 (payment required) — the enforcement has not regressed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Admin role passes requireAdmin gate (automated)

**Covers:** AC3

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: requireAdmin calls next() when userId and role are both admin`

**Expected outcome:**
> The test passes. A logged-in user with `role = 'admin'` is allowed through the requireAdmin middleware.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Logged-in non-admin gets 403 from requireAdmin (automated)

**Covers:** AC4

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: requireAdmin returns 403 when role is 'user' (authenticated but non-admin)`

**Expected outcome:**
> The test passes. A logged-in user with `role = 'user'` receives HTTP 403 and cannot access admin routes.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Unauthenticated request gets 403 from requireAdmin (automated)

**Covers:** AC5

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: requireAdmin returns 403 when no userId (unauthenticated)`

**Expected outcome:**
> The test passes. A request with no session userId (not logged in) also gets HTTP 403. Admin routes give the same response to unauthenticated and non-admin requests — no information about the existence of the admin route is leaked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: requireAdmin gates all /admin/* routes in server.js (automated — integration)

**Covers:** AC6

**Steps:**
1. Run: `node tests/check-arl-s2-admin-middleware.js`
2. Look for: `PASS: server.js mounts requireAdmin before /admin route handlers`

**Expected outcome:**
> The test passes. The `requireAdmin` middleware is registered in `server.js` for all `/admin` paths, appearing before any handler that reads the database or renders a page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7 🔴 (post-deploy): Admin user has unrestricted access; non-admin is still blocked

**Covers:** AC1, AC2 (end-to-end confirmation)

**Steps:**
1. Log in to the deployed Fly.io app as `heymishy` (GitHub OAuth).
2. Navigate to a skill and submit a turn (any turn — "hello" is fine).
3. Confirm: no HTTP 402 error page is shown. The turn completes.
4. Log out. Log back in as any non-admin test account (one with 0 balance).
5. Navigate to the same skill and try to submit a turn.

**Expected outcome:**
> Step 3: The turn completes with no payment required message. The admin account is not blocked by the credits guard.
> Step 5: The turn is blocked with a "Insufficient credits" message (HTTP 402). Non-admin enforcement has not regressed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Admin credits bypass | | |
| Scenario 2 — Non-admin still blocked (M3) | | |
| Scenario 3 — Admin passes requireAdmin | | |
| Scenario 4 — Non-admin gets 403 | | |
| Scenario 5 — Unauthenticated gets 403 | | |
| Scenario 6 — requireAdmin gating in server.js | | |
| Scenario 7 🔴 — Post-deploy end-to-end | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
