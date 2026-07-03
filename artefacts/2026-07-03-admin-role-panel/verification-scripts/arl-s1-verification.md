# AC Verification Script: arl-s1 — Create user_roles DB table and load role into session for all auth paths

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s1.md
**Technical test plan:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s1-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This script has two sections: automated tests (run a command and check output) and post-deploy checks (require a deployed server).
2. For automated tests: open a terminal in the repo root.
3. For post-deploy checks: you need access to the deployed Fly.io app and `fly postgres connect`.

**Automated test command:**
```
node tests/check-arl-s1-user-roles.js
```

**Reset between scenarios:** Not needed for automated tests. For post-deploy checks, each scenario is independent.

---

## Scenarios

---

### Scenario 1: DB table created on server start (automated — structure check)

**Covers:** AC1

**Steps:**
1. In the terminal, run: `node tests/check-arl-s1-user-roles.js`
2. Look for the line: `PASS: Migration SQL contains CREATE TABLE IF NOT EXISTS user_roles`

**Expected outcome:**
> The test passes with output showing `PASS` for the migration SQL check. The test confirms `server.js` contains `CREATE TABLE IF NOT EXISTS user_roles` with columns `tenant_id VARCHAR PRIMARY KEY` and `role VARCHAR NOT NULL DEFAULT 'user'`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: GitHub OAuth login sets admin role for 'heymishy' (automated — unit)

**Covers:** AC2

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: handleAuthCallback sets session.role to 'admin' for admin tenantId`

**Expected outcome:**
> The test passes. When the auth callback runs with `tenantId = 'heymishy'` and the user_roles table has an admin row for that tenant, `req.session.role` becomes `'admin'`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: GitHub OAuth login for unknown user gets 'user' role (automated — unit)

**Covers:** AC3

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: handleAuthCallback sets session.role to 'user' when no row in user_roles`

**Expected outcome:**
> The test passes. When no matching row exists in user_roles for the tenantId, `req.session.role` defaults to `'user'`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Email login sets role from DB row (automated — unit)

**Covers:** AC4

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: Email auth callback sets session.role from DB row`

**Expected outcome:**
> The test passes. The email auth path reads role from user_roles using the email as tenantId.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Google OAuth login sets role from DB row (automated — unit)

**Covers:** AC5

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: Google OAuth callback sets session.role from DB row`

**Expected outcome:**
> The test passes. The Google OAuth path reads role from user_roles using the Google sub (userInfo.sub) as tenantId.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Adapter throws when not wired (automated — unit)

**Covers:** AC6

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: getUserRole throws when adapter not wired`

**Expected outcome:**
> The test passes. Calling `getUserRole()` before `setGetUserRole()` throws an error with the message `Adapter not wired: getUserRole`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Production wiring confirmed in server.js (automated — integration)

**Covers:** AC7

**Steps:**
1. Run: `node tests/check-arl-s1-user-roles.js`
2. Look for: `PASS: server.js calls setGetUserRole before starting HTTP server`

**Expected outcome:**
> The test passes. `server.js` calls `setGetUserRole(...)` with the real Postgres query implementation before the server begins accepting connections.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8 🔴 (post-deploy): Admin seed runs and heymishy gets admin role

**Covers:** AC2 (end-to-end confirmation), post-deploy seed requirement

**Steps:**
1. After deploying to Fly.io, connect to the database: `fly postgres connect -a <db-app-name>`
2. Run: `SELECT role FROM user_roles WHERE tenant_id = 'heymishy';`
3. If no row is returned, run the seed command: `INSERT INTO user_roles (tenant_id, role) VALUES ('heymishy', 'admin') ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin';`
4. Run the SELECT again to confirm the row exists with `role = 'admin'`.
5. Log in to the app via GitHub OAuth using the `heymishy` account.
6. After login, start a skill session (e.g. click "Start" on any skill) and submit a turn.

**Expected outcome:**
> No HTTP 402 response is received. The turn completes normally. The session has `role = 'admin'` set correctly via the user_roles lookup.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — DB migration SQL | | |
| Scenario 2 — GitHub OAuth admin role | | |
| Scenario 3 — GitHub OAuth default user role | | |
| Scenario 4 — Email auth role | | |
| Scenario 5 — Google OAuth role | | |
| Scenario 6 — Adapter stub throws | | |
| Scenario 7 — Production wiring in server.js | | |
| Scenario 8 🔴 — Post-deploy seed + login | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
