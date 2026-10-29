## Test Plan: Tenant-match guard on pipeline-state-derived journey features

**Story reference:** `artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/stories/ctpl-s1-tenant-match-guard-on-merged-pipeline-features.md`
**Test plan author:** Copilot
**Date:** 2026-10-29
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s `scripts.test`, same as every prior story this session).
**Test data strategy:** Synthetic — real temp-directory `pipeline-state.json` fixtures (same convention `tests/check-ep1-s1-journey-feature-merge.js` already uses via `journeyRoutes.setRepoRoot(scratchRoot)`), plus direct `process.env.PLATFORM_TENANT_ID` manipulation (set/delete, restored after each test). No real GitHub/Postgres dependency.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Mismatched tenantId → zero merged features | 1 test | 1 test (`handleGetJourney`) | — | — | — | 🟢 |
| AC2 | Matching tenantId → merged features unchanged (regression guard) | — | 1 test | — | — | — | 🟢 |
| AC3 | `PLATFORM_TENANT_ID` unset → zero merged features for anyone (fail-closed) | 1 test | 1 test | — | — | — | 🟢 |

No gaps. All three ACs are directly observable at the unit level (the guard's own boolean logic) and the integration level (`handleGetJourney`'s real response body), with no CSS/layout or external-dependency component — this is pure server-side logic.

## Unit Tests (the guard's own match logic, isolated)

1. **`guardMatchesTenant_returnsTrueOnlyForExactNonEmptyMatch`** (AC1, AC2, AC3) — Table-driven: `{tenantId: 't1', platformTenantId: 't1'} → true`; `{tenantId: 't1', platformTenantId: 't2'} → false`; `{tenantId: 't1', platformTenantId: undefined} → false`; `{tenantId: undefined, platformTenantId: undefined} → false` (both empty must never match — AC3's own fail-closed requirement); `{tenantId: '', platformTenantId: ''} → false`.
2. **`mergeSkippedEntirely_whenGuardFalse`** — Given `_mergeStateFeaturesIntoJourneyListFn` would otherwise find real pipeline-state.json features (confirmed via the pre-existing `writeState()`/`setRepoRoot()` fixture helper from `check-ep1-s1-journey-feature-merge.js`), When the guard evaluates false for the request's own `req.session.tenantId`, Then the merge function is never invoked at all (not just invoked-and-filtered) — proves the fix is a true skip, not a post-hoc filter that still touches `getRepoRoot()`'s content.

## Integration Tests (`handleGetJourney`, real request/response)

3. **`AC1_mismatchedTenant_journeyPageHasNoMergedFeatures`** — Precondition: a real `pipeline-state.json` fixture (via `setRepoRoot`) containing a genuine non-terminal feature (mirrors `check-ep1-s1-journey-feature-merge.js`'s own `cli-only-feature` fixture); `process.env.PLATFORM_TENANT_ID = 'platform-tenant-x'`; request session `tenantId: 'some-other-tenant'`. Action: `handleGetJourney(req, res, null, pool)`. Expected: response body does NOT contain the fixture feature's slug/name anywhere.
4. **`AC2_matchingTenant_journeyPageStillShowsMergedFeatures`** — Same fixture; `process.env.PLATFORM_TENANT_ID = 'platform-tenant-x'`; request session `tenantId: 'platform-tenant-x'` (exact match). Action: same call. Expected: response body DOES contain the fixture feature — proves the one legitimate case is not regressed by this fix.
5. **`AC3_platformTenantIdUnset_journeyPageHasNoMergedFeatures_evenForWhatWouldHaveBeenAMatchingSession`** — Same fixture; `delete process.env.PLATFORM_TENANT_ID`; request session `tenantId: ''` (empty string — the one case that could accidentally pass a naive `===` on two falsy values if not guarded explicitly). Action: same call. Expected: response body does NOT contain the fixture feature — proves the fail-closed requirement holds even against the specific empty-string/undefined collision risk named in Unit Test 1.

## NFR Tests

- **NFR-Security (the actual point of this story):** Tests 3 and 5 above ARE the NFR-Security verification — they assert the real HTTP response body a real cross-tenant/misconfigured request would receive, not just that an internal function returns the right boolean. This is the direct evidence closing the live-confirmed staging finding.
- **NFR-Performance:** No new I/O — the guard is a single `===` comparison against an already-available `req.session.tenantId` and `process.env.PLATFORM_TENANT_ID`, evaluated before any `getRepoRoot()`/`_readPipelineFeatures()` call. Strictly cheaper than today's unconditional merge, not more expensive — no dedicated perf test needed.

## Gap Table

No gaps.
