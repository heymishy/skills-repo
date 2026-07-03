## Story: Credits guard admin bypass and requireAdmin middleware

**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Benefit-metric reference:** artefacts/2026-07-03-admin-role-panel/benefit-metric.md

## User Story

As a **Platform operator (Hamish King)**,
I want **my admin session to bypass the credits guard and access admin-only routes without being blocked**,
So that **I can use the platform indefinitely regardless of my credit balance and access admin management pages**.

## Benefit Linkage

**Metric moved:** M1 — Admin credits-guard bypass operational; M3 — Non-admin credits enforcement not regressed
**How:** This story adds the conditional bypass in `creditsGuard` (`if req.session.role === 'admin'`) and creates `requireAdmin` middleware that gates all `/admin/*` routes. M1 becomes measurable once the bypass is deployed and the admin seed is in place. M3 is enforced by the CI test introduced in this story: any regression in the `req.session.role === 'user'` + balance-0 path causes a build failure before deployment.

## Architecture Constraints

- **D37 (injectable adapter rule):** No new injectable adapter is introduced in this story — the credits balance lookup is handled by the existing credits guard. The `requireAdmin` middleware reads `req.session.role` directly from session (set by arl-s1 role loading); no DB call is needed. D37 does not apply to session field reads. If the implementation requires any new DB-backed call, D37 applies immediately.
- **ADR-011 (artefact-first):** `requireAdmin` is a new module under `src/web-ui/middleware/`. This story artefact and DoR must exist before code is written.
- **Node.js CommonJS only:** `require-admin.js` uses `module.exports`. No ES modules.
- **No Express:** `requireAdmin` receives `(req, res, next)` following the existing middleware pattern; `res.writeHead` / `res.end` for HTTP 403 responses (not `res.status().json()`).
- **M3 CI gate:** The regression test for non-admin enforcement (AC2) must be in the `npm test` chain. A failing test must block deployment — this is not a soft assertion.

## Dependencies

- **Upstream:** arl-s1 must be DoD-complete. `req.session.role` must be populated on login before the bypass check has any effect.
- **Downstream:** arl-s3 (admin credits UI) depends on `requireAdmin` middleware from this story.

## Acceptance Criteria

**AC1:** Given a session has `req.session.role === 'admin'` (set by arl-s1 after GitHub OAuth login as `heymishy`), When a request passes through `creditsGuard`, Then `next()` is called immediately without querying or checking the credit balance, and no HTTP 402 response is returned.

**AC2 (M3 regression gate):** Given a session has `req.session.role === 'user'` (or role is absent) and the tenant's credit balance is 0, When a request passes through `creditsGuard`, Then HTTP 402 is returned and the turn is not processed. This assertion must pass in CI on every build.

**AC3:** Given a request has `req.session.userId` set AND `req.session.role === 'admin'`, When the request passes through `requireAdmin`, Then `next()` is called and the handler proceeds.

**AC4:** Given a request has `req.session.userId` set but `req.session.role` is `'user'` (or any non-admin value), When the request passes through `requireAdmin`, Then HTTP 403 is returned and `next()` is not called.

**AC5:** Given a request has no `req.session.userId` (unauthenticated session), When the request passes through `requireAdmin`, Then HTTP 403 is returned and `next()` is not called. (Admin routes return 403 for all non-admin states — unauthenticated and insufficient-role are treated identically to avoid user enumeration.)

**AC6:** Given `server.js` registers routes, When the incoming request pathname starts with `/admin`, Then `requireAdmin` middleware runs before any `/admin/*` route handler. No `/admin/*` route is reachable without passing `requireAdmin`.

## Out of Scope

- Admin-specific session expiry or elevated session timeouts — standard session TTL applies to admin sessions in MVP.
- Logging or audit trail of admin route access — deferred to a future story.
- Any rate-limiting or brute-force protection on admin routes — out of scope for this MVP story.
- Role-based permission checks within admin routes (admin-only sub-roles, capability lists) — the binary `admin/user` check in `requireAdmin` is the full access control model for this epic.

## NFRs

- **Security:** `requireAdmin` must check both `req.session.userId` (authenticated) AND `req.session.role === 'admin'`. Checking only role (not userId) creates a bypass where a crafted session with role set but no userId could access admin routes.
- **Correctness:** `creditsGuard` bypass must be a strict equality check (`=== 'admin'`). Truthy or prefix checks are not acceptable.
- **Testability:** AC1 and AC2 must be covered by automated unit tests for `creditsGuard`. AC3–AC5 must be covered by automated unit tests for `requireAdmin`. These tests must run in the `npm test` chain.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

The logic in this story is simple conditional checks. No new DB calls, no external integrations, no multi-path edge cases. The main risk is correctness of the condition (strict equality, both fields checked) — covered by AC5 and AC2.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic (Medium — arl-e1)
