## Story: Fix seedTestSession's dead staging bypass and withAuth's staging-incompatible tests

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **the last known causes of the `Staging smoke test (@mocked)` job's failures fixed**,
So that **`promote-to-prod` finally runs cleanly on a fully green smoke test**.

## Background / Investigation

`bslb-s1`'s merge fixed `bri-s3.4`'s rate-limit gap; the next staging-deploy run showed real-staging E2E confirmation passing, but smoke-test still failed with 2 previously-unseen failures now that earlier blockers were cleared:

1. **`bri-s3.5-billing-journey.spec.js`** (4 sub-failures): `seedTenantSession`'s call to `GET /test/session` failed `resp.ok()`. Root cause: the route's own gate (`_isTestEndpointAllowed`) correctly validates the staging-safe bypass secret+header, but the function it calls, `seedTestSession()` (`middleware/session.js`), has its own separate, unconditional `NODE_ENV !== 'test'` check that always threw regardless — the route-level staging bypass was structurally dead on real staging, no matter how correctly it was implemented, because the inner function never learned about it.

2. **`bri-s3.6-auth-journey.spec.js`** (AC3, then AC4 masked by `mode: 'serial'`): both used `withAuth` (`fixtures/auth.js`), a fixture explicitly designed to throw outside `NODE_ENV=test` — staging-incompatible by design. AC1/AC2 in the same file already established the correct staging-safe pattern (real `/auth/github/callback` + `namedIdentityStubHeaders`); AC3/AC4 were simply never converted to it.

## Architecture Constraints

- `seedTestSession`'s fix follows the same shape as `isMockGatewayEnabled()`'s design: the function itself cannot independently re-derive a request-level bypass (it has no access to `req`), so the caller must explicitly assert it has already gated the call — `options.allowOutsideTest`, defaulting to `false` (preserving all existing behaviour for the 2 other call sites, both wrapped in their own outer `NODE_ENV==='test'` blocks and therefore unaffected either way).
- `bri-s3.6`'s AC3/AC4 conversion introduces no new mechanism — reuses the exact pattern already proven by AC1/AC2 in the same file.
- No change to `fixtures/auth.js`/`withAuth` itself — still used correctly by many other, non-`@mocked`-tagged local-only E2E specs.

## Dependencies

- **Upstream:** `bslb-s1` (merged) — this was the next layer visible only once that landed.
- **Downstream:** None. Expected to be the final fix needed to unblock `promote-to-prod`.

## Acceptance Criteria

**AC1:** Given `seedTestSession(id, data, options)` is called with `options.allowOutsideTest` unset or `false`, When `NODE_ENV !== 'test'`, Then it throws the exact same error as before this fix — no behaviour change for existing callers.

**AC2:** Given `seedTestSession(id, data, { allowOutsideTest: true })` is called, When `NODE_ENV !== 'test'`, Then the session is seeded successfully, no throw.

**AC3:** Given `server.js`'s `GET /test/session` route handler (the only call site that has already passed `_isTestEndpointAllowed`), When it calls `seedTestSession`, Then it passes `{ allowOutsideTest: true }`.

**AC4:** Given `bri-s3.6-auth-journey.spec.js`'s AC3 and AC4 tests, When inspected, Then neither uses `withAuth` — both use the same staging-safe pattern (`startGithubLogin` + `namedIdentityStubHeaders` + real `/auth/github/callback`) already established by AC1/AC2 in the same file.

**AC5 (regression guard):** Given these fixes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count (37 files) with zero new regressions.

## Out of Scope

- Any other still-unknown failures in the smoke-test suite not yet observed — if a new, different failure appears on the next staging-deploy run, that is a separate follow-up.
- Auditing every other `seedTestSession` call site or every other `withAuth` usage across the full E2E suite for the same class of issue — the other 2 `seedTestSession` call sites are already gated by an outer `NODE_ENV==='test'` block (never reached on staging either way); every other `withAuth` usage is in a non-`@mocked`-tagged spec never run against staging.

## NFRs

- **Performance:** Not applicable.
- **Security:** `allowOutsideTest` is a narrow, explicit, caller-asserted escape hatch — not a global relaxation of `seedTestSession`'s guard. Only one call site in the entire codebase sets it.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
