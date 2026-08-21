## Story: Thread the authenticating person's identity through requireAdmin's live role re-check

**Epic reference:** None — short-track, security bug found while implementing `rbg-s1`
**Discovery reference:** None — short-track (bounded fix, root cause and correct fix already identified)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui, security]

## User Story

As a **platform operator responsible for tenant isolation between teammates who share one org-allowlisted tenant**,
I want **`requireAdmin`'s live per-request role re-check (`sec-perf-s2`) to resolve each requester's OWN role, not an arbitrary teammate's**,
So that **a non-admin teammate sharing a `TENANT_ORG_ALLOWLIST` tenant with an admin cannot be silently granted admin access on every request**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track security bug fix) — closes a live privilege-escalation gap found 2026-08-21 while implementing `rbg-s1` (a test-coverage-only story) and running its new AC1 test for the first time against a real admin-gated route.
**How:** Closes an active security defect rather than moving a product metric — the fix restores the intended per-person role boundary between teammates on a shared tenant.

## Problem (found during rbg-s1 implementation, 2026-08-21)

`require-admin.js`'s live role re-check calls `_getCurrentRole(req.session.tenantId)` — passing only the tenant ID, no per-person identity. `server.js`'s wiring (`setGetCurrentRole(function(tenantId) { return getRoleForTenant(tenantId); })`, both the real-`DATABASE_URL` branch and the fake-test-db branch added by `rbg-s1`) forwards no identity key either. `getRoleForTenant(tenantId)` with no second argument falls back to using `tenantId` itself as the identity key (`resolveRoleForPerson(pool, identityKey || tenantId, tenantId)`).

For a solo tenant (`tenantId` already equals that one person's own identity) this is harmless — the existing behaviour `tir-s9` already documented and relied on. But for a `TENANT_ORG_ALLOWLIST` shared-org tenant (2+ people, same `tenant_id`), `tenantId` does not identify any specific person. `resolvePersonForIdentity` then falls through to its own defensive fallback — `SELECT person_id FROM team_memberships WHERE tenant_id = $1` with no `LIMIT`/no person filter, taking the first matching row — returning an **arbitrary** teammate's `person_id` for every request from every person on that tenant, regardless of who is actually asking.

Confirmed live via `rbg-s1`'s own new E2E test (`tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, seeded with `e2e-alice` as admin and `e2e-bob` as engineer in the same `e2e-shared-org` tenant): after fixing the separate, narrower test-harness wiring gap `rbg-s1` found (role adapters never wired to the fake DB locally), alice correctly got `200` on `/admin/credits` — but bob also got `200`, when he should have been denied (`403`). Both resolved to alice's (`admin`) role via the live re-check's tenant-only fallback.

This is the same bug class `tir-s9` already fixed for the **login-time** role resolution path (`routes/auth.js`, which correctly passes `user.login` as the identity key) — but the fix was never applied to this separate **live-recheck** call site added later by `sec-perf-s2`. Since this wiring is unconditional in `server.js` (not gated behind `NODE_ENV=test`), this same code path runs in production for every `requireAdmin`-gated request.

**Not yet confirmed:** whether any real production tenant currently has 2+ people with different roles sharing one `TENANT_ORG_ALLOWLIST`-matched tenant (i.e., whether this is exploitable today, or a live-but-unused surface). Recommend checking `team_memberships` for tenants with more than one distinct `person_id` before treating this as merely theoretical.

## Architecture Constraints

- Fix scope: `src/web-ui/middleware/require-admin.js` (thread an identity key through the `_getCurrentRole` call) and `src/web-ui/server.js` (both `setGetCurrentRole` wiring sites — the real-`DATABASE_URL` branch and the fake-test-db branch `rbg-s1` added — must accept and forward it).
- Mirror the exact pattern `tir-s9` already established for the login path: pass the authenticating person's own identity (`req.session.login` — confirmed already set at login in `routes/auth.js`) as the second argument, falling back to `tenantId` only when no identity is available (preserves existing solo-tenant/email-password behaviour unchanged, per `tir-s9`'s own compatibility contract).
- Do not change `resolveRoleForPerson`/`getRoleForTenant`'s own signatures or logic in `modules/user-roles.js` — they already correctly accept and use an `identityKey` argument; only the call sites are wrong.
- Add regression coverage that would have caught this: a test asserting two DIFFERENT people (one admin, one not) sharing one tenant resolve to two DIFFERENT, individually-correct roles via the LIVE re-check specifically (not just at login) — matching this repo's own D37 "assert an observable, differentiating outcome" convention (CLAUDE.md), since a test that only checks "the adapter got called" would pass even with this exact bug present.

## Dependencies

- **Upstream:** `sec-perf-s2` (live-role-recheck feature, introduced the buggy call site), `tir-s9` (already fixed the identical bug class at the login call site — reference implementation for this fix).
- **Downstream:** `rbg-s1` (`artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/`) is currently blocked by this bug — its AC1 test cannot pass (bob incorrectly resolves to admin) until this ships.

## Acceptance Criteria

**AC1:** Given two distinct people (one admin, one non-admin) sharing one `TENANT_ORG_ALLOWLIST` tenant, When each makes a request to an admin-gated route (e.g. `GET /admin/credits`), Then `requireAdmin`'s live re-check resolves each person's OWN role — the admin succeeds (200), the non-admin is denied (403).

**AC2:** Given a solo tenant (tenant ID already equals the one person's own identity — the existing pre-`sec-perf-s2` common case), When that person makes a request to an admin-gated route, Then behaviour is unchanged from before this fix (no regression to the existing, correct, single-person-per-tenant case).

**AC3:** Given `rbg-s1`'s own AC1 test (`tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`), When this story ships, Then that test passes without needing any further changes to the test itself.

## Out of Scope

- Any change to the login-time role resolution path (`routes/auth.js`) — already correct, already passes `user.login` as the identity key.
- Any change to `modules/user-roles.js`'s `resolveRoleForPerson`/`getRoleForTenant` function bodies — the bug is entirely in call sites omitting the identity key, not in the underlying resolution logic.
- A production tenant audit for whether this has been actively exploited or is merely a live-but-latent surface — flagged as a recommended follow-up, not part of this fix.
- The separate, unrelated `viewer`-role-has-no-enforcement gap (`2026-08-21-viewer-role-no-enforcement/discovery.md`, F11) — that is a missing feature; this is a regression in an existing one.

## NFRs

- **Security:** Core purpose of this story — closes a privilege-escalation path between teammates sharing a tenant.
- **Performance:** None identified — same number of queries as today, just with a correct parameter.
- **Accessibility:** Not applicable.
- **Audit:** `require-admin.js` already logs every denial (`admin_access_denied`) with person ID and tenant ID — no new audit surface needed, but worth confirming post-fix that a previously-incorrect ALLOW (never logged, since it wasn't a denial) doesn't need its own historical audit review. Flagged for the operator, not blocking this fix.

## Complexity Rating

**Rating:** 1 — root cause and correct fix are already fully identified (mirror `tir-s9`'s existing, proven pattern); this is threading one already-available session field through two call sites.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
