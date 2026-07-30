## Story: Replace bri-s3.5's local-file tenant-cap mechanism with a real remote override

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **`bri-s3.5-billing-journey.spec.js`'s tenant-cap simulation to actually take effect on whichever server it's testing against**,
So that **the last known cause of `promote-to-prod` staying blocked is resolved**.

## Background / Investigation

`swts-s1`'s merge fixed `seedTestSession`'s dead staging bypass; the next staging-deploy run showed 19 of 21 `@mocked` tests passing (up from a handful earlier in this investigation), with only `bri-s3.5-billing-journey.spec.js` AC2 (timeout) and AC4 (`Expected: 402, Received: 200`) still failing.

Root cause for AC4 (confirmed): `withTenantCap()`, this spec's own helper for simulating a tenant at their usage limit, wrote directly to a `tenant-caps.json` file on the **test runner's own filesystem** (`path.join(__dirname, '..', '..', 'tenant-caps.json')`). Against the local Playwright harness, the test runner and the server share the same process/filesystem, so this worked. Against a real deployed server (`wuce-staging`, a separate Fly.io container), the write has zero effect — the server never sees it, so the "tenant is at cap" premise this test is built on was never actually true on staging, and the "third journey should be blocked with 402" assertion at the end of AC4 correctly reflects that (nothing was ever capped).

AC2 shares the same `withTenantCap(tenantId, 0, ...)` setup call; its specific `page.fill` timeout may or may not be the same root cause — this is not yet fully confirmed, and is called out explicitly below rather than assumed.

## Architecture Constraints

- Reuses `tenant-plan.js`'s existing `_capReader` injection point's *priority ordering*, adding a new, lower-priority in-memory override tier (`setTenantCapOverride`/`clearTenantCapOverride`) rather than replacing or complicating the existing mechanism. Order: injected `capReader` > new in-memory override > `tenant-caps.json` file > `MAX_JOURNEYS_PER_TENANT` env var > unlimited.
- New server-side route `POST /test/tenant-cap`, gated by the same `_isTestEndpointAllowed` staging-safe mechanism already used by `/test/session` and other test-only routes — no new bypass surface introduced.
- `withTenantCap()` unified to a single implementation for both local and staging runs (calls the real route either way) — no dual-path local-vs-staging branching, since the new route works correctly in both environments.

## Dependencies

- **Upstream:** `swts-s1` (merged) — this was the next layer visible only once that landed.
- **Downstream:** None. Expected to be the final fix needed to unblock `promote-to-prod`, pending confirmation of AC2 on the next run.

## Acceptance Criteria

**AC1:** Given `POST /test/tenant-cap` with `{tenantId, cap}` in the body, When the request passes `_isTestEndpointAllowed`, Then `tenant-plan.js`'s in-memory override for that `tenantId` is set to `cap`, effective on the very next `getJourneyCap`/`checkJourneyCap` call — no restart needed.

**AC2:** Given the same route called with `{tenantId, cap: null}`, When processed, Then the tenant's override is cleared, reverting to the next-priority cap resolution (file, env var, or unlimited).

**AC3:** Given an injected `capReader` is set (via `setCapReader`), When a tenant also has an in-memory override set, Then the injected `capReader`'s value wins — the override is strictly lower priority, preserving all existing unit-test behaviour that relies on `setCapReader`.

**AC4:** Given `bri-s3.5-billing-journey.spec.js`'s `withTenantCap()`, When called, Then it calls the real `POST /test/tenant-cap` route (via the existing `testEndpointBypassHeaders()` pattern) instead of writing to a local file — no local file I/O remains in this helper.

**AC5 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count (37 files) with zero new regressions.

## Out of Scope

- Root-causing AC2's `page.fill` timeout with full certainty before this merges — the fix addresses the confirmed AC4 cause; AC2 is explicitly flagged as "may or may not resolve as a side effect" rather than assumed fixed. If it persists on the next staging-deploy run, that is a distinct follow-up investigation.
- Migrating any other spec file's own local-file-based test setup to a remote mechanism — scoped strictly to `bri-s3.5`'s `tenant-caps.json` usage, the only confirmed instance of this pattern found so far.

## NFRs

- **Performance:** Negligible — one additional `Map` lookup per cap resolution, only reached when no `capReader` is injected.
- **Security:** New route reuses the existing, already-reviewed `_isTestEndpointAllowed` gate (staging-only secret + header, or `NODE_ENV=test`) — no new bypass surface. Tenant ID is validated to start with `e2e-`, matching the existing convention on `/test/session`.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — test-only infrastructure.

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
