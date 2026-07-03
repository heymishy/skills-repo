## Definition of Done: arl-s2 — Credits guard admin bypass and requireAdmin middleware

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s2.md
**PR:** #435 — merged 2026-07-03T19:08:57Z (commit 145e45ec)
**Assessed by:** Claude Sonnet 4.6 (/definition-of-done skill)
**Date:** 2026-07-04

---

## Verdict: COMPLETE ✅

ACs satisfied: 6/6
Deviations: None
Test gaps: None

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|---------|
| AC1 | Admin role → `creditsGuard` calls `next()` without querying balance | ✅ | `credits-guard.js`: `if (req.session && req.session.role === 'admin') { return next(); }` is the first branch — before `getBalance` call |
| AC2 (M3 gate) | User role + balance=0 → 402 in CI | ✅ | T3 in `check-arl-s2-admin-middleware.js` asserts 402; included in `npm test` chain → CI gate active |
| AC3 | `req.session.userId` + `role='admin'` → `requireAdmin` calls next() | ✅ | `require-admin.js` passes when both fields are present and role is 'admin' |
| AC4 | `req.session.userId` + `role='user'` → `requireAdmin` returns 403 | ✅ | Guard condition `req.session.role !== 'admin'` fires; res.writeHead(403) |
| AC5 | No `req.session.userId` → `requireAdmin` returns 403 | ✅ | Guard condition `!req.session.userId` fires; same 403 response (no route enumeration) |
| AC6 | All `/admin/*` routes gated by `requireAdmin` in server.js | ✅ | Both `GET /admin/credits` and `POST /api/admin/credits/adjust` call `requireAdmin` before invoking their handlers |

---

## Out-of-Scope Check

Nothing from the exclusion list shipped:
- ❌ Elevated session timeouts for admin — not built
- ❌ Audit log of admin route access — not built
- ❌ Rate limiting on admin routes — not built
- ❌ Sub-role or capability-list checks — not built

✅ Clean

---

## Test Plan Coverage

| Test | AC | Status |
|------|----|--------|
| creditsGuard calls next() when role='admin' | AC1 | ✅ |
| creditsGuard does not call getBalance when role='admin' (unconditional bypass) | AC1 | ✅ |
| creditsGuard returns 402 when role='user' and balance=0 (M3 CI gate) | AC2 | ✅ |
| requireAdmin calls next() when userId+role='admin' | AC3 | ✅ |
| requireAdmin returns 403 when role='user' (authenticated non-admin) | AC4 | ✅ |
| requireAdmin returns 403 when no userId (unauthenticated) | AC5 | ✅ |
| server.js mounts requireAdmin before /admin route handlers (integration) | AC6 | ✅ |
| creditsGuard uses strict equality `=== 'admin'` (NFR) | NFR-correctness | ✅ |
| requireAdmin checks both userId AND role (NFR) | NFR-security | ✅ |

All 8/8 tests passing. No gaps.
CSS-layout-dependent gap: None.

---

## NFR Check

| NFR | Status | Evidence |
|-----|--------|---------|
| Security — `requireAdmin` checks both `userId` AND `role` | ✅ | NFR test T9 reads `require-admin.js` source and asserts both field references present |
| Correctness — strict equality `=== 'admin'` only | ✅ | NFR test T8 reads `credits-guard.js` source and asserts `=== 'admin'` pattern; no truthy or loose equality |
| Testability — AC1+AC2 in npm test chain | ✅ | `package.json` scripts.test includes `&& node tests/check-arl-s2-admin-middleware.js` |

---

## Metric Signal

**M1 — Admin credits-guard bypass operational**
Signal: not-yet-measured
Evidence note: Bypass code merged and CI-verified; measurement requires deploy + admin seed SQL + confirmed admin login attempt
Date measured: null

**M3 — Non-admin credits enforcement not regressed**
Signal: on-track
Evidence: CI gate test (check-arl-s2-admin-middleware.js T3: creditsGuard returns HTTP 402 for role='user' + balance=0) passes in every build as of merge commit 145e45ec. Regression would block CI immediately.
Date measured: 2026-07-03
