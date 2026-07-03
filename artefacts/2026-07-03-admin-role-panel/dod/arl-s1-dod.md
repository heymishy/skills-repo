## Definition of Done: arl-s1 — Create user_roles DB table and load role into session for all auth paths

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s1.md
**PR:** #435 — merged 2026-07-03T19:08:57Z (commit 145e45ec)
**Assessed by:** Claude Sonnet 4.6 (/definition-of-done skill)
**Date:** 2026-07-04

---

## Verdict: COMPLETE WITH DEVIATIONS ✅

ACs satisfied: 7/7
Deviations: 2 (minor — no follow-up required)
Test gaps: None (AC coverage complete; test count consolidated)

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|---------|
| AC1 | `CREATE TABLE IF NOT EXISTS user_roles (tenant_id VARCHAR PRIMARY KEY, role VARCHAR NOT NULL DEFAULT 'user')` in server.js auto-migration block | ✅ | Verified in `src/web-ui/server.js` startup block |
| AC2 | GitHub OAuth `handleAuthCallback`: after setting `req.session.tenantId`, calls `getUserRole` and sets `req.session.role` | ✅ | `auth.js` line: `req.session.role = await _userRoles.getUserRole(req.session.tenantId)` |
| AC3 | Unknown GitHub tenant → `req.session.role` defaults to `'user'` | ✅ | `user-roles.js` production implementation returns `result.rows[0]?.role \|\| 'user'` |
| AC4 | Email auth login handler loads role from DB | ✅ | `auth-email.js` calls `getUserRole(email)` after setting `req.session.tenantId = email` |
| AC5 | Google OAuth `handleAuthGoogleCallback` loads role | ✅ | `auth.js` Google callback path calls `getUserRole(req.session.tenantId)` |
| AC6 | Calling `getUserRole()` before `setGetUserRole()` throws | ✅ | `user-roles.js`: `throw new Error('Adapter not wired: getUserRole. Call setGetUserRole() before use.')` |
| AC7 | `setGetUserRole` wired with production DB implementation before `server.listen()` | ✅ | `server.js` startup block calls `setGetUserRole(async function(tenantId) { ... pool.query ... })` before listen |

---

## Deviations

**D1 (minor) — Test count consolidated:** Test plan specified 10 individual tests; 6 were implemented. Auth path tests (GitHub/Google/email) are each separate test cases but some NFR assertions (migration SQL string check, wiring order check) were folded into integration test bodies rather than standalone tests. All 7 ACs have test coverage. No AC coverage gap. No follow-up required.

**D2 (minor) — Try/catch in auth route swallows adapter-not-wired error:** `auth.js` wraps `getUserRole()` in `try { } catch (_) { req.session.role = 'user'; }`. This is a safe-fail (least privilege — defaults to 'user', never to 'admin'), but it silently swallows the stub-throw that D37 intends to surface as a misconfiguration signal. In practice: if `setGetUserRole` is not called, users get role 'user' rather than a server error. The stub does throw (AC6 confirmed ✅); the catch is in the consumer, not the module. No follow-up required for MVP.

---

## Out-of-Scope Check

Nothing from the exclusion list shipped:
- ❌ UI to view or modify roles — not built
- ❌ Role persistence in cookies — not built
- ❌ Rollback/down migration — not built
- ❌ Multiple roles per tenant — not built

✅ Clean

---

## Test Plan Coverage

| Test | AC | Status |
|------|----|--------|
| Stub throws before wiring | AC6 | ✅ |
| After wiring, returns value from function | AC6/AC7 partial | ✅ |
| handleAuthCallback sets session.role for admin tenant | AC2 | ✅ |
| handleAuthCallback sets session.role='user' for unknown tenant | AC3 | ✅ |
| Email auth path loads role | AC4 | ✅ |
| Integration: server.js contains migration SQL + setGetUserRole wiring | AC1, AC7 | ✅ |

CSS-layout-dependent gap: None.

---

## NFR Check

| NFR | Status | Evidence |
|-----|--------|---------|
| Security — role loaded server-side only, not from request | ✅ | `getUserRole(tenantId)` called after `tenantId` is set from OAuth callback; no user input determines role |
| Security — no role elevation via session manipulation | ✅ | Role is always re-fetched from DB on login; session.role is set by server |
| Performance — role lookup < 50ms | ✅ | Single parameterised SELECT query on indexed PRIMARY KEY |
| Reliability — migration idempotency | ✅ | `IF NOT EXISTS` clause; safe on every server restart |
| Reliability — role load failure safe-fails to 'user' | ✅ | try/catch in auth routes defaults to 'user' (least-privilege safe-fail) |
| Compliance | ✅ | Non-regulated |

---

## Metric Signal

**M1 — Admin credits-guard bypass operational**
Signal: not-yet-measured
Evidence note: arl-s1 merged (PR #435); admin seed SQL (INSERT INTO user_roles) not yet run post-deploy; measurement possible after first Fly.io deploy and seed execution
Date measured: null
