# Persistent viewing-as banner, exit flow, and permission-scoped visibility — Implementation Plan

**Goal:** Build the shell-level impersonation banner (AC1), an exit endpoint that reverts the session and closes the audit entry (AC4), and confirm/extend effective-role-based visibility for admin-only nav items and Settings tabs (AC2/AC3), plus a session-expiry regression test (AC5).

**Branch:** `feature/d2-banner-exit-permission-visibility` (fresh from `origin/master` @ `2bdf2439`, which includes D1 merged as PR #534 plus its post-merge bookkeeping commit)
**Test command:** `node tests/check-d2-banner-exit-permission-visibility.js`

---

## Task 0 — Investigation findings (no code)

Read D1's real merged code (`src/web-ui/modules/impersonation.js`, `src/web-ui/routes/impersonation.js`, `src/web-ui/adapters/impersonation-audit-adapter.js`) plus `src/web-ui/middleware/require-admin.js` and `src/web-ui/utils/html-shell.js` before writing any code. Key findings recorded in `decisions.md`:

1. D1 already overwrites `session.tenantId`/`.login`/`.role` to the target's values, and `requireAdmin`'s live role re-check (`getCurrentRole(tenantId) -> getRoleForTenant(tenantId)`, wired in `server.js`) uses only `session.tenantId` — so **every existing `requireAdmin`-gated route already enforces the effective (impersonated) role**, not the real admin's role. Confirmed by enumerating all 7 real `requireAdmin(` call sites in `server.js` (admin/credits GET, api/admin/credits/adjust POST, team/members GET, api/team/members POST, api/team/bulk-add-github-org POST, admin/impersonate GET, api/admin/impersonate/start POST) — all share the same live-role wiring. No route-level gate code changes are needed for the NFR ("every existing admin-gated surface... checks effective role"); this is verified by an NFR test, not re-implemented.
2. The sidebar's `isAdmin` flag (`html-shell.js`'s `renderShell`/`renderSidebar`) is currently computed ad hoc per route as `!!(req.session && req.session.role === 'admin')` in `dashboard.js` and `settings.js` only. Because D1 already swaps `session.role`, this already happens to compute the *effective* role correctly during impersonation — but the check is duplicated, inline, and not consistently wired to every page (e.g. `journey.js`'s `/journey` page never passes `isAdmin` at all, defaulting to `false` even for a genuine, non-impersonating admin). This story extracts a single named, testable helper (`isEffectivelyAdmin(session)` in `modules/impersonation.js`) and wires it into `dashboard.js`, `settings.js`, and `journey.js`'s `/journey` page — the three pages this story's own E2E test navigates (Home, Journeys, Settings). This is the explicit, auditable form of the security property AC2/AC3 name, not a behaviour change (the underlying boolean value is unchanged for the two already-wired pages).
3. The Settings page currently has no "Impersonate" tab at all (D1 only built the standalone `/admin/impersonate` page, reachable only by direct URL). AC2/AC3 both explicitly name an "Impersonate" settings tab that must be effective-role-gated. Per CLAUDE.md's B1/D1 rule (contract vs. AC/test conflict resolves in favour of the AC), this plan adds a minimal "Impersonate" tab-nav entry (a link to `/admin/impersonate`, admin-gated exactly like the existing "Credits" tab) — no new panel content, since the destination page already exists.
4. No exit endpoint exists yet. Per the D1 SEC decisions.md entry (client-submitted identity fields must never be trusted — re-derive from server-side state), the exit endpoint accepts **no identity fields from the client at all**. It is authorized by `req.session.impersonation.active` (a real, only-server-writable session flag), not by `requireAdmin` — using `requireAdmin` here would be a bug, since a live effective-role check would deny the real admin the ability to exit while impersonating a non-admin target (their effective role would be `'user'`, and `requireAdmin` would reject them). Restoration values come from `req.session.impersonation.admin` (the snapshot D1 already captured), never from the request body.
5. `impersonation_audit_log` has no `ended_at` column yet. This story adds it via an idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migration (matching the `journeys.module_id` precedent from a1) and a new `endImpersonationAudit(auditId)` adapter function that `UPDATE`s the *same* row D1 inserted (never a new row), satisfying the story's own Audit NFR.
6. **Judgment call (flagged for operator review):** should a failure writing the `ended_at` audit UPDATE block the actual session exit? Decision: **no** — the exit must always succeed once `session.impersonation.active` is true, even if the audit UPDATE throws (logged, not re-thrown). Blocking exit on an audit-log hiccup would trap the real admin inside the target's identity, which is a worse security/availability outcome than an audit row missing its `ended_at` timestamp. This mirrors the asymmetry already present in D1 (start fails closed on audit failure; exit fails open on audit failure) and is recorded as a SEC decision in `decisions.md`.

---

## File map

```
Create:
  tests/check-d2-banner-exit-permission-visibility.js   — unit + integration tests, AC1-AC5 + NFRs

Modify:
  src/web-ui/modules/impersonation.js         — add getEffectiveRole/isEffectivelyAdmin, exitImpersonationSession
  src/web-ui/adapters/impersonation-audit-adapter.js — add endImpersonationAudit(auditId)
  src/web-ui/routes/impersonation.js           — add handlePostImpersonateExit
  src/web-ui/utils/html-shell.js               — add renderImpersonationBanner + wire into renderShell; SHELL_JS gains swExitImpersonation
  src/web-ui/routes/dashboard.js                — wire isEffectivelyAdmin + impersonation opts into renderShell
  src/web-ui/routes/settings.js                 — wire isEffectivelyAdmin + impersonation opts; add Impersonate tab
  src/web-ui/routes/journey.js                  — wire isEffectivelyAdmin + impersonation opts into handleGetJourney's renderShell call
  src/web-ui/server.js                          — ended_at migration, register POST /api/admin/impersonate/exit (no requireAdmin gate)
```

---

## Task 1 — `getEffectiveRole` / `isEffectivelyAdmin` (AC2/AC3 core helper)

**Files:** Modify `src/web-ui/modules/impersonation.js`; Test: `tests/check-d2-banner-exit-permission-visibility.js` (T1-T3)

- RED: write tests asserting `isEffectivelyAdmin({ role: 'admin' })` → true (no impersonation); `isEffectivelyAdmin({ role: 'user', impersonation: { active: true, admin: { role: 'admin' }, target: { role: 'user' } } })` → **false** (real admin's role must never leak through); `isEffectivelyAdmin({ role: 'admin', impersonation: { active: true, admin: { role: 'admin' }, target: { role: 'admin' } } })` → true (accurate, not a blanket hide).
- GREEN: implement `getEffectiveRole(session)` (prefers `session.impersonation.target.role` when `session.impersonation.active`, else `session.role`) and `isEffectivelyAdmin(session)`. Export both.
- Run test file — new tests pass.

## Task 2 — `exitImpersonationSession` (AC4)

**Files:** Modify `src/web-ui/modules/impersonation.js`, `src/web-ui/adapters/impersonation-audit-adapter.js`; Test (T4-T8)

- RED: tests for: throws `NOT_IMPERSONATING` when not impersonating (no mutation); successful exit restores `tenantId`/`login`/`role`/`userId` to the admin snapshot exactly; `session.impersonation` key is deleted entirely (no residual target data of any kind); a failing audit UPDATE still allows the exit to complete (logged, not thrown); the same audit row gets `ended_at` set (not a new row).
- GREEN: add `endImpersonationAudit(auditId)` to the adapter (UPDATE ... SET ended_at = NOW() WHERE id = $1 RETURNING ...). Add `exitImpersonationSession(session)` to `modules/impersonation.js`.
- Run test file.

## Task 3 — `handlePostImpersonateExit` route handler

**Files:** Modify `src/web-ui/routes/impersonation.js`; Test (T9-T11)

- RED: tests for: CSRF-guarded (bad/missing `_csrf` → non-200, session unchanged); not currently impersonating → 400, no adapter call; valid request while impersonating → 200, session reverted.
- GREEN: implement handler — CSRF guard, then impersonation-active check, then call `exitImpersonationSession`.
- Run test file.

## Task 4 — Banner rendering in `html-shell.js` (AC1)

**Files:** Modify `src/web-ui/utils/html-shell.js`; Test (T12-T14)

- RED: tests for: `renderShell({ impersonation: { active: true, targetLogin, targetTenantId, csrfToken } , ... })` includes banner markup with target login/tenant text, an Exit form posting to `/api/admin/impersonate/exit` with the CSRF token embedded, and the ⚠ icon + explicit text (not colour-only); `renderShell({ ...no impersonation... })` renders no banner markup at all; two different `renderShell`-calling route handlers (dashboard + settings) both surface the same banner markup for the same impersonation opts, proving it comes from the shell, not per-route logic (AC1's own integration test).
- GREEN: add `renderImpersonationBanner(impersonation)`; wire it as the first element inside `<body>` (before `.sw-app`) in `renderShell` when `opts.impersonation && opts.impersonation.active`; add banner CSS (sticky, striped, icon+text); add `swExitImpersonation` to `SHELL_JS`.
- Run test file.

## Task 5 — Wire banner + effective-role visibility into 3 real pages (AC1/AC2/AC3)

**Files:** Modify `src/web-ui/routes/dashboard.js`, `src/web-ui/routes/settings.js`, `src/web-ui/routes/journey.js`; Test (T15-T18)

- RED: integration tests calling the real handlers (`handleDashboard`, `handleGetSettings`, `handleGetJourney`) with a fixture session that has `impersonation.active = true`, asserting the banner appears in all three, and that `isAdmin`-gated markup (Admin credits nav item, Credits/Impersonate settings tabs) is hidden/shown per the target's effective role in each.
- GREEN: replace the inline `!!(req.session && req.session.role === 'admin')` in `dashboard.js`/`settings.js` with `isEffectivelyAdmin(req.session)`; add the same to `journey.js`'s `handleGetJourney` (previously never computed at all); pass `impersonation` opts (`{ active, targetLogin, targetTenantId, csrfToken }`, derived from `req.session.impersonation` + `csrf.generateCsrfToken(req)`) into each `renderShell` call.
- Add the "Impersonate" tab to `settings.js`'s `_renderTabNav` (admin-gated, link to `/admin/impersonate`).
- Run test file.

## Task 6 — server.js wiring (migration + route registration)

**Files:** Modify `src/web-ui/server.js`; Test (T19-T20, grep-based)

- RED: tests asserting server.js contains `ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at` and registers `POST /api/admin/impersonate/exit` **without** a `requireAdmin` gate in that route's own block (verified by asserting the snippet around that route registration does not contain `requireAdmin`).
- GREEN: add the migration near the existing `impersonation_audit_log` CREATE TABLE block; register the route, delegating to `_impersonationHandlers.handlePostImpersonateExit`.
- Run test file.

## Task 7 — AC5 (session-expiry) regression test

**Files:** Test only (T21)

- Test: seed an in-memory session with `impersonation.active = true`, simulate expiry (session ID no longer present in the session store), then run `sessionMiddleware` again for the same cookie and confirm a brand-new, empty session is issued (no `impersonation`, no `accessToken`) — proving a subsequent authenticated-route request is treated as a normal signed-out request, not a half-impersonating state. No production code changes expected — this is an emergent property of impersonation state living only inside the session object itself (no separate cache).

## Task 8 — NFR tests

**Files:** Test only (T22-T23)

- Security: grep this story's own new/modified files for the banned `req.session.token` field (zero matches).
- Security: enumerate every real `requireAdmin(` call site in `server.js` (regex count) and assert it equals 7 — the same 7 confirmed compliant in Task 0's investigation — so a future added route is caught by this test if the count changes without a matching decisions.md re-audit note.

## Task 9 — Full suite regression check + decisions.md entries + PR

- Run `node scripts/run-all-tests.js`, compare the failing-file list against the pre-existing 37-file baseline RISK-ACCEPTed at `/branch-setup` (same baseline reused from a1/d1 — no d2 code touches any of those 37 files).
- Append decisions.md entries for: the "Impersonate" settings tab addition (SCOPE), the exit-audit-failure fail-open judgment call (SEC), and the `isEffectivelyAdmin` helper extraction (ARCH).
- Open a **draft** PR (never mark ready for review — High human-oversight epic).
