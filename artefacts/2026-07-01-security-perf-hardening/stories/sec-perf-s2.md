## Story: Re-validate admin role on every gated request so a mid-session demotion takes effect immediately

**Feature reference:** artefacts/2026-07-01-security-perf-hardening (short-track — no epic; see feature's `dor/sec-perf.md` for the sibling sec-perf story)
**Discovery reference:** None — short-track (`/test-plan → /definition-of-ready → coding agent`, per CLAUDE.md). This feature skipped discovery/benefit-metric by design.
**Benefit-metric reference:** None — short-track. This story reduces the window of unauthorised privilege after a role change, the same security-hardening goal the sibling `sec-perf` story (AC5, session-fixation rotation) already serves for this feature.

## User Story

As a **platform operator responsible for the security of the admin-gated surfaces** (`/admin/credits`, `/team/members`, `/api/team/members`, `/api/team/bulk-add-github-org`),
I want **a person's role to be re-checked against the live `team_memberships` record on every `requireAdmin`-gated request, not trusted from a value cached once at login**,
So that **an admin who is demoted mid-session by another admin loses admin access on their very next request, instead of retaining it for the rest of their session cookie's lifetime**.

## Benefit Linkage

**Metric moved:** No named benefit-metric artefact exists for this short-track feature (CLAUDE.md: short-track skips `/discovery`/`/benefit-metric`). This story serves the same "platform is resistant to abuse and credential-fixation-style attacks" goal stated in the sibling `sec-perf` story's own User Story, extended to cover privilege staleness rather than session-ID staleness.
**How:** `req.session.role` is currently set once at login (`routes/auth.js`, `routes/auth-email.js`) and never re-checked or invalidated for the life of the session. `team-management.js`'s `addOrUpdateTeammate` (tir-s3) lets an admin change another team member's role in `team_memberships`, but that write never touches the target person's live session — so a demoted admin keeps their stale, now-incorrect `admin` role in `req.session.role` until they log out and back in. This story closes that window by re-validating the role live on every `requireAdmin`-gated request.

## Architecture Constraints

- **D37 (adapter, precedented deviation):** introduces a new injectable adapter pair, `setGetCurrentRole`/internal `_getCurrentRole`, in `src/web-ui/middleware/require-admin.js`. Per this codebase's own existing precedent for backward-compatible adapter extension (`user-roles.js`'s `getRoleForTenant`, which falls back to the legacy `getUserRole` adapter when unwired instead of throwing; and `tir-s9`'s optional second parameter that defaults to preserve unmodified call sites), the default when `setGetCurrentRole` is **not** wired is an explicit, documented delegation to this story's pre-existing behaviour — trust the cached `req.session.role` exactly as `requireAdmin` did before this story — rather than a hard `throw`. This is a deliberate, logged deviation from CLAUDE.md's "stub defaults MUST throw" default (see `decisions.md`), required because three existing, unrelated test suites (`tests/check-arl-s2-admin-middleware.js`, `tests/check-tir-s4-role-gated-credits-panel.js`, `tests/check-tir-s5-github-org-bulk-add.js`) call `requireAdmin` directly without wiring any adapter and must continue to pass completely unmodified. In production, `server.js` always wires the adapter (AC5) — the fallback branch is dead in production.
- Reuses the existing `getRoleForTenant(tenantId)` adapter (`src/web-ui/modules/user-roles.js`, already wired in `server.js` to `resolveRoleForPerson`) as the live-check's data source, rather than introducing a second, parallel role-resolution code path. This guarantees the live re-check and the login-time role computation always agree on how a role is derived — including automatically inheriting any future fix to that shared resolver (e.g. `tir-s9`, in flight on a separate branch) without this story needing to duplicate or diverge from its logic.
- ADR-025 (tenant-scoped authorization, `team-identity-roles` epic): unaffected. The live lookup uses the exact same `tenantId` scoping already in production; this story does not introduce a new tenant boundary or change which tenant is queried.
- `req.session.accessToken` / `req.session.role` field-naming conventions (CLAUDE.md canonical fields) are unchanged.

## Dependencies

- **Upstream:** None — this story only touches `requireAdmin` and its production wiring in `server.js`. It does not depend on `tir-s9` (in-flight, unmerged, unrelated fix to which `identityKey` argument is passed at login) — it calls `getRoleForTenant(tenantId)` with the same single-argument shape every existing call site already uses.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an authenticated session with `req.session.role = 'admin'` cached from login, and that person's `team_memberships` row for the same tenant has since been changed to `'engineer'` by another admin via `addOrUpdateTeammate`, When the demoted person's very next request hits a `requireAdmin`-gated route (e.g. `GET /admin/credits`), Then the request is denied with HTTP 403 and body `{"error":"Forbidden"}` — without the person needing to log out and back in.

**AC2:** Given the same demotion scenario as AC1, When the demoted person's request is denied, Then `req.session.role` is corrected in place to the live value (`'engineer'`) so that the session's cached role no longer disagrees with the database for any subsequent read of `req.session.role` elsewhere in the app (self-healing, not just a one-off denial).

**AC3:** Given a person who is promoted mid-session (cached role `'user'`, live `team_memberships` role now `'admin'`), When their next request hits a `requireAdmin`-gated route, Then access is granted. This proves the check is a genuine live comparison in both directions, not a one-directional "downgrade only" patch.

**AC4:** Given `setGetCurrentRole` has not been wired (the adapter's default, unwired state — e.g. any test or context that predates this story and does not call it), When `requireAdmin` runs, Then it falls back to trusting the cached `req.session.role` exactly as `requireAdmin` behaved before this story shipped — zero regression, and the existing `arl-s2`, `tir-s4`, and `tir-s5` test suites pass unmodified.

**AC5 (D37 wiring):** Given `server.js`'s production bootstrap, When the server starts, Then `setGetCurrentRole` is wired to call the same, already-wired `getRoleForTenant(tenantId)` adapter used at login time (`src/web-ui/modules/user-roles.js`) — verified by a test that asserts a role change made between two calls (not a value snapshotted at login) is reflected on the second call through the actual wired function, not merely that a function reference was assigned (per CLAUDE.md's injectable-adapter wiring-test correctness rule).

**AC6:** Given the live-role-lookup adapter throws or its returned promise rejects (e.g. a database error), When `requireAdmin` runs, Then the request is denied (fail-closed, HTTP 403) rather than falling back to the possibly-stale cached `req.session.role`.

## Out of Scope

- `credits-guard.js`'s own, separate `req.session.role === 'admin'` bypass check (used to skip the credit-balance check) is a related, structurally identical stale-role surface, but is not touched by this story — flagged in `decisions.md` as a candidate follow-up, not silently expanded into.
- Session invalidation or forced logout of the demoted person's other active sessions/devices — this story achieves the practically-equivalent outcome (denial on the very next request) via live re-validation instead, per the dispatch brief's explicit "OR" alternative; invalidation was not chosen because there is no existing person→session-ID index in `middleware/session.js` to support it without a larger, separate change.
- Any change to `addOrUpdateTeammate`, the `team_memberships` schema, or the role-write path — this story only changes how `requireAdmin` (a read path) consumes the existing data.
- Re-validation for non-`requireAdmin` role-gated logic (e.g. general `authGuard`, which only checks for a present `accessToken`, not a role) — scoped only to `requireAdmin`, the specific gate named in the dispatch brief's concrete example (`/admin/credits`).
- Caching or a TTL for the live lookup to reduce added DB load — every `requireAdmin`-gated request now incurs one extra DB query; accepted as-is given current admin-route volume (see NFRs), not optimised here.

## NFRs

- **Performance:** Each `requireAdmin`-gated request now issues one additional DB query (`SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2`, via the already-existing `resolveRoleForPerson`), an indexed lookup on `team_memberships`'s existing composite primary key. Accepted given current admin-route volume (5 route call sites, human-driven admin actions — not a hot path); no caching/TTL introduced (Out of Scope).
- **Security:** This is the story's core purpose — closes the "stale privilege survives a demotion" gap. Fails closed on adapter error (AC6). The unwired-fallback path (AC4) is a backward-compatibility measure for pre-existing tests only; production always wires the adapter (AC5), so the fallback branch never executes in production.
- **Accessibility:** Not applicable — no UI change.
- **Audit:** The existing `admin_access_denied` audit log call in `require-admin.js` (personId, tenantId, timestamp) continues to fire unchanged on every denial, including the new live-demotion-denial case. No new audit requirement.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
