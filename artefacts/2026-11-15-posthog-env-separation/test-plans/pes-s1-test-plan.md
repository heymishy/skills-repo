## Test Plan: Give every captured error an environment-specific fingerprint so a production error never joins a staging error group

**Story reference:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; each file is a plain Node assert script. File extended: `tests/check-coha-s5-error-capture.js` (currently 83 tests).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fingerprint is `[environment, code, route]` | 2 (UT1, UT4) | - | - | - | - | 🟢 |
| AC2 | Staging and production fingerprints differ | 1 (UT2) | - | - | - | - | 🟢 |
| AC3 | No canary text reaches the output; an incoming fingerprint is ignored | 1 (UT3) | - | - | - | - | 🟢 |
| AC4 | End to end through the real createApp | - | 1 (IT1) | - | - | - | 🟢 |
| AC5 | Live on staging: events accepted, new issue id, new issue listed | - | - | - | 1 | Live-only | 🟡 |
| AC6 | Live on production: new issue, alert, bridge issue | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed apps and real PostHog | AC5, AC6 | Live-only (not CSS-layout) | Verification scenarios 5 and 6 after merge; AC6 needs the operator's approval to trigger the known login error. Not an accepted risk: required before the story is called complete (AC6 can lag as `production-observed`, like coha-s6 AC9). |

No layout-dependent ACs; no E2E browser tooling needed.

## Test Data Strategy

**Source:** Synthetic. Raw SDK-shaped events from the existing `sdkEvent()` helper plus canaries from the existing `seed`/`hex()` helpers; no files, no mocks of PostHog. **Mock-shape verification (CLAUDE.md rule):** the processed event property list captured from PostHog on 2026-11-15 (fingerprint fields are produced by PostHog; the scrubber only supplies `$exception_fingerprint`) is recorded in the story; no invented consumer shape is asserted beyond "array of three strings". **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (appended to `tests/check-coha-s5-error-capture.js`)

### UT1 - production fingerprint has the fixed shape
- **Verifies:** AC1
- **Action:** `scrubEvent(sdkEvent('m', { code: 'tenant_admin_bootstrap_failed', route: '/auth/callback' }), 'production')`
- **Expected result:** `properties.$exception_fingerprint` deep-equals `['production', 'tenant_admin_bootstrap_failed', '/auth/:p']`; the same call with `'staging'` has first element `staging`. Fails today (no fingerprint).
- **Edge case:** No

### UT2 - two environments never share a fingerprint
- **Verifies:** AC2
- **Action:** scrub the same raw event for `staging` and for `production`
- **Expected result:** the two fingerprints are not deep-equal and differ only in element 0
- **Edge case:** Yes

### UT3 - canaries never reach the fingerprint and an incoming fingerprint is ignored
- **Verifies:** AC3
- **Action:** event with a canary in message, stack function names, route, `tenantId`, and an incoming `$exception_fingerprint: ['hex-' + canary]` (also a non-array value)
- **Expected result:** the serialised output contains no canary; `$exception_fingerprint` equals the fixed-value array built from allow-listed code, route pattern and environment
- **Edge case:** Yes

### UT4 - an unexpected environment value cannot enter the fingerprint
- **Verifies:** AC1
- **Action:** scrub with environment values `'prod uction'`, `'x'.repeat(200)`, `undefined`, `42`, `'Production'` (capital) and a tenant-looking string
- **Expected result:** element 0 is exactly `unknown` for each; for `staging` and `production` it is that value
- **Edge case:** Yes

### UT5 - existing exact-key tests updated, everything else unchanged
- **Verifies:** AC3
- **Action:** `KEPT_KEYS` gains `$exception_fingerprint`; the sorted key list in `scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId` (line ~27) gains it; the two assertions comparing with `ec.KEPT_KEYS` follow automatically
- **Expected result:** all 83 existing tests pass with only those edits; no canary test is changed
- **Edge case:** No

## Integration Tests

### IT1 - end to end through the real createApp in a child process
- **Verifies:** AC4
- **Components involved:** real `createApp()` with the injected throwing router, real `error-capture.js`, the local sink helper
- **Action:** `/boom/<seed>` with production capture wired to the sink
- **Expected result:** exactly one event; `$exception_fingerprint` deep-equals `[p.environment, p.code, p.route]` of the same event (`production`); request returns 500; no canary in the sink payload
- **Edge case:** No

## NFR Tests

### NFR-SEC1 - privacy guarantee unchanged
- **Measurement method:** UT3's canary scan over the whole serialised output
- **Pass threshold:** zero canary matches

Performance: none beyond one array literal per event (the existing 200 ms capture-bound tests cover it). Cost: none, confirmed.

## Out of Scope for This Test Plan
- The reopened trigger, the bridge, any second PostHog project.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| PostHog may not apply the fingerprint as the docs describe | Docs are the only evidence so far | AC5 live check: new staging events must get an issue id different from the resolved issue; if they join it, the story is INCOMPLETE with a follow-up |
| A different grouping may over-split (one issue per route) | Fingerprint includes the route pattern | Acceptable: the route is already a sanitised pattern with few distinct values |

**Total automated tests:** 5 new (UT1, UT2, UT3, UT4, IT1) plus the UT5 edits to existing assertions.