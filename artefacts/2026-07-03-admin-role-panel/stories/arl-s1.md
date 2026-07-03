## Story: Create user_roles DB table and load role into session for all auth paths

**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Benefit-metric reference:** artefacts/2026-07-03-admin-role-panel/benefit-metric.md

## User Story

As a **Platform operator (Hamish King)**,
I want **my GitHub OAuth login to resolve my role from a database table and set it on my session**,
So that **subsequent middleware can bypass the credits guard for admin sessions without checking credit balance**.

## Benefit Linkage

**Metric moved:** M1 — Admin credits-guard bypass operational; M3 — Non-admin credits enforcement not regressed (baseline established)
**How:** The `user_roles` table and session-loading code are the precondition for the admin bypass in arl-s2 — without `req.session.role` being set on login, the credits guard has no role signal to check. This story seeds the role data and populates the session field that makes M1 measurable and the M3 regression gate meaningful.

## Architecture Constraints

- **D37 (injectable adapter rule):** The `getUserRole(tenantId)` DB lookup must be implemented as an injectable adapter. The stub default must throw (`throw new Error('Adapter not wired: getUserRole. Call setGetUserRole() before use.')`). Production wiring (`setGetUserRole(realFn)`) must be a separate task in the implementation plan and must have an explicit AC (see AC7). This applies to both the role lookup module and any admin-specific DB queries introduced in later stories.
- **ADR-011 (artefact-first):** This story introduces a new module under `src/` (role adapter). The story artefact (this file) and the DoR must exist before any code is written.
- **`req.session.accessToken` canonical:** Any code touching `auth.js` must not introduce `req.session.token`; the GitHub token field remains `req.session.accessToken`.
- **Node.js CommonJS only:** Role adapter module uses `module.exports`, `require()`. No ES modules.
- **No new npm dependencies:** Postgres query uses the existing `pool` (pg) instance wired in `server.js`.

## Dependencies

- **Upstream:** None — this is the foundation story for this epic.
- **Downstream:** arl-s2 (credits bypass) depends on `req.session.role` being set by this story; arl-s3 (admin UI) depends on `requireAdmin` from arl-s2.

## Acceptance Criteria

**AC1:** Given the server starts against a clean database (no prior migration run), When the startup auto-migration block in `server.js` executes, Then a `user_roles` table exists with columns `tenant_id VARCHAR PRIMARY KEY` and `role VARCHAR NOT NULL DEFAULT 'user'`, and re-running the migration (server restart) does not error (`CREATE TABLE IF NOT EXISTS`).

**AC2:** Given a user logs in via GitHub OAuth (`GET /auth/callback`) and their `tenantId` (`user.login`) has an entry in `user_roles` with `role = 'admin'`, When the `handleAuthCallback` function completes and the session is saved, Then `req.session.role` equals `'admin'`.

**AC3:** Given a user logs in via GitHub OAuth and their `tenantId` has no entry in `user_roles`, When the `handleAuthCallback` function completes and the session is saved, Then `req.session.role` equals `'user'` (the role defaults to `'user'` when no row exists).

**AC4:** Given a user logs in via email/password (handled in `auth-email.js`) and their `tenantId` (email) has a matching row in `user_roles`, When the email authentication completes and the session is saved, Then `req.session.role` equals the value stored in that `user_roles` row.

**AC5:** Given a user logs in via Google OAuth (`handleAuthGoogleCallback` in `auth.js`) and their `tenantId` (`userInfo.sub`) has a matching row in `user_roles`, When the Google OAuth callback completes and the session is saved, Then `req.session.role` equals the value stored in that `user_roles` row.

**AC6 (D37 stub-throws):** Given the role adapter module is loaded but `setGetUserRole` has not been called, When `getUserRole(tenantId)` is invoked directly, Then it throws an `Error` with message `'Adapter not wired: getUserRole. Call setGetUserRole() before use.'`.

**AC7 (D37 production wiring):** Given `server.js` calls `setGetUserRole` with a real Postgres implementation before the HTTP server begins accepting connections, When any auth callback calls `getUserRole(tenantId)`, Then the real DB query executes and no stub-throws error is raised. The production wiring call must be present in `server.js` and verified by a test or startup smoke check.

## Out of Scope

- Granting or revoking admin roles from any UI — role assignment in this story is SQL-only (documented seed command).
- Role loading for non-session contexts (e.g. API keys, webhook callbacks) — out of scope for MVP.
- Migration rollback or down migration — `IF NOT EXISTS` idempotency is sufficient; no rollback script is required.
- Loading role for Google OAuth users when the `user_roles` table has no row for `userInfo.sub` — the default `'user'` fallback (AC3 pattern) applies identically; no separate AC needed.

## NFRs

- **Performance:** Role DB query adds at most one round-trip to the auth callback. No caching required in MVP.
- **Security:** Role value loaded from DB must not be accepted from any user-supplied input. `req.session.role` is set only by server-side DB lookup in auth callback — never from request body or query string.
- **Correctness:** If the DB query fails (e.g. connection error), the auth callback must not silently proceed with `role = 'admin'`. The error must propagate and the session must not be saved with a role value.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Three auth paths touched (GitHub OAuth, Google OAuth, email/password). D37 adapter wiring adds a second implementation task. The logic per path is simple, but the cross-file surface area elevates this above complexity 1.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic (Medium — arl-e1)
