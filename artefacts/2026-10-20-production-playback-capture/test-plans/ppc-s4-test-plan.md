# Test Plan: Recognise pipeline-state.json DoD-complete features in self-service playback capture

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s4-pipeline-state-dod-fallback.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No journey, but pipeline-state.json shows all stories dodStatus:complete → 200 with non-empty acs | — | 3 tests | — | — | — | 🟢 |
| AC2 | Second request reuses the auto-provisioned journey, no second GitHub fetch | — | 2 tests | — | — | — | 🟢 |
| AC3 | One story not dodStatus:complete → still 404 | — | 2 tests | — | — | — | 🟢 |
| AC4 | No connected repo, no journey → 404, no leak | — | 2 tests | — | — | — | 🟢 |
| AC5 | Cross-tenant/product isolation holds for the fallback path | — | 2 tests | — | — | — | 🟢 |
| AC6 | AC rows fetched from real GitHub DoD content, aggregated across every complete story | 2 tests | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is fully coverable with mocked GitHub Contents API responses and a fake Postgres pool/journey-store — the same pattern `ppc-s1`'s own existing test file (`tests/check-ppc-s1-playback-evidence-route.js`) already established, and the same pattern css-s2/css-s3/css-s4 used for their own GitHub-write/fetch mocking.

---

## Test Data Strategy

**Source:** Mocked (fake GitHub Contents API responses via a stubbed `fetch`/adapter, fake Postgres pool, in-memory `journey-store._clearForTesting()`)
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external dependency
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fake `pipeline-state.json` fixture with a feature whose stories (flat and epic-nested variants) are all `dodStatus: "complete"`; a fake DoD markdown fixture for `fetchArtefact` to return | Fixture | None | Mirrors `product-rollup.js`'s own existing test fixtures |
| AC2 | Same fixture, called twice; assert `fetchPipelineState`/`fetchArtefact` mocks are called exactly once across both requests | Fixture + call-count assertion | None | |
| AC3 | Same fixture with one story's `dodStatus` set to `"in-progress"` | Fixture | None | |
| AC4 | Fake pool returning no `products` row (or `repo_owner`/`repo_name` null) | Fixture | None | |
| AC5 | Two fake tenant/product pairs, one fixture feature | Fixture | None | |
| AC6 | A fixture with 2+ `dodStatus: "complete"` stories, each with its own DoD markdown fixture | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### featureDodStatus_returnsAllComplete_whenEveryFlatStoryIsComplete

- **Verifies:** AC1, AC6 (the pure feature-lookup helper)
- **Precondition:** A parsed pipeline-state.json fixture with a flat `feature.stories[]`, all `dodStatus: "complete"`
- **Action:** Call the new `_featureDodStatus(pipelineState, featureSlug)` helper
- **Expected result:** Returns `{ allComplete: true, storySlugs: [...] }` listing every story slug
- **Edge case:** Also covers the epic-nested (`feature.epics[].stories[]`) shape in a second case within the same test file

### featureDodStatus_returnsAllCompleteFalse_whenOneStoryIncomplete

- **Verifies:** AC3
- **Precondition:** Same fixture, one story's `dodStatus` changed to `"in-progress"`
- **Action:** Call `_featureDodStatus`
- **Expected result:** Returns `{ allComplete: false, ... }`
- **Edge case:** No

---

## Integration Tests

### resolveJourney_autoProvisions_whenPipelineStateShowsFeatureComplete

- **Verifies:** AC1
- **Components involved:** `playback-evidence.js`'s `_resolveJourney`, fake `pool`, `journey-store` (real, cleared via `_clearForTesting`), stubbed `pipelineStateFetchAdapter`
- **Precondition:** No existing journey for tenant/product/featureSlug; fake pool resolves `repo_owner`/`repo_name`; stubbed adapter returns the AC1 fixture
- **Action:** Call `handleGetPlaybackEvidence` (JSON path)
- **Expected result:** 200, `acs` array length > 0

### resolveJourney_autoProvisions_forEpicNestedFeatureShape

- **Verifies:** AC1 (epic-nested variant)
- **Components involved:** same as above, fixture uses `feature.epics[].stories[]`
- **Precondition:** same
- **Action:** same
- **Expected result:** 200, `acs` array length > 0

### resolveJourney_handlesGithubFetchFailure_as404

- **Verifies:** AC1 (negative path — the adapter throws, e.g. network error)
- **Components involved:** same, stubbed adapter rejects
- **Precondition:** No existing journey
- **Action:** Call `handleGetPlaybackEvidence`
- **Expected result:** 404, no unhandled rejection/500

### resolveJourney_secondRequest_reusesProvisionedJourney_noSecondFetch

- **Verifies:** AC2
- **Components involved:** same, adapter mock has a call-count spy
- **Precondition:** First request already ran and provisioned a journey
- **Action:** Call `handleGetPlaybackEvidence` a second time for the same productId/featureSlug
- **Expected result:** 200; adapter mock's call count is still 1 (not 2)

### resolveJourney_provisionedJourney_hasDodCompleteEntry_andIsTenantProductScoped

- **Verifies:** AC2
- **Components involved:** `journey-store.getJourneyByTenantProductSlug`, `journey-store.isDodComplete`
- **Precondition:** After AC1's first request
- **Action:** Call `getJourneyByTenantProductSlug(tenantId, productId, featureSlug)` directly
- **Expected result:** Returns the provisioned journey; `isDodComplete(journey)` is true

### resolveJourney_returns404_whenOneStoryNotComplete_flatShape

- **Verifies:** AC3
- **Components involved:** same, fixture has one incomplete story
- **Precondition:** No existing journey
- **Action:** Call `handleGetPlaybackEvidence`
- **Expected result:** 404

### resolveJourney_returns404_whenOneStoryNotComplete_epicNestedShape

- **Verifies:** AC3 (epic-nested variant)
- **Components involved:** same
- **Precondition:** same
- **Action:** same
- **Expected result:** 404

### resolveJourney_returns404_whenProductHasNoConnectedRepo

- **Verifies:** AC4
- **Components involved:** fake pool returns a row with null `repo_owner`/`repo_name`
- **Precondition:** No existing journey
- **Action:** Call `handleGetPlaybackEvidence`
- **Expected result:** 404, response body is the existing constant `{ error: 'not found' }` (no detail field)

### resolveJourney_returns404_whenProductsQueryFails

- **Verifies:** AC4
- **Components involved:** fake pool's query rejects
- **Precondition:** No existing journey
- **Action:** Call `handleGetPlaybackEvidence`
- **Expected result:** 404, no unhandled rejection

### resolveJourney_tenantIsolation_fallbackNeverCrossesProductOrTenant

- **Verifies:** AC5
- **Components involved:** two fake tenant/product pairs, one feature fixture scoped to only one pair's repo
- **Precondition:** Tenant A/Product A's repo has the DoD-complete feature; Tenant B/Product B's repo does not
- **Action:** Tenant B requests the same featureSlug under Product B
- **Expected result:** 404 for Tenant B; a subsequent Tenant A request under Product A still succeeds independently (separate journeys, no shared state)

### resolveJourney_tenantIsolation_sameFeatureSlugTwoProducts_doesNotCrossMatch

- **Verifies:** AC5 (direct mirror of `ppc-s1`'s own AC6 regression shape)
- **Components involved:** same
- **Precondition:** Both Product A and Product B's repos independently report the SAME featureSlug as DoD-complete
- **Action:** Both tenants request it
- **Expected result:** Two separate journeys are created, each correctly scoped to its own tenantId/productId — `getJourneyByTenantProductSlug` for A never returns B's journey and vice versa

### getDodAcList_fallsBackToGithub_whenNoPostgresArtefactRows

- **Verifies:** AC6
- **Components involved:** `_getDodAcList`, stubbed `fetchArtefact`
- **Precondition:** Auto-provisioned journey (AC1), `getArtefactsForJourney` returns `[]`
- **Action:** Call `_getDodAcList(journey, req, pool)`
- **Expected result:** Returns AC rows parsed from the stubbed DoD markdown content, not an empty array

### getDodAcList_aggregatesAcrossEveryCompleteStory_notJustFirst

- **Verifies:** AC6
- **Components involved:** same, fixture has 2 complete stories each with distinct AC ids in their own DoD markdown
- **Precondition:** same
- **Action:** same
- **Expected result:** Returned AC list contains AC rows from BOTH stories' DoD content, not only the first story fetched

---

## NFR Tests

### pipelineStateFetch_onlyCalledOnce_acrossRepeatedRequests

- **NFR addressed:** Performance
- **Measurement method:** Spy call-count assertion (same as AC2's integration test — listed here too since it's also the NFR evidence)
- **Pass threshold:** Exactly 1 call to the pipeline-state fetch adapter across 2 identical requests
- **Tool:** Jest (this repo's test runner, per `npm test`)

### fallbackPath_neverResolvesByFeatureSlugAlone

- **NFR addressed:** Security (ADR-025)
- **Measurement method:** Code-level assertion — the new `_resolveViaPipelineState` helper's signature requires both `tenantId` and `productId` as parameters, mirroring `getJourneyByTenantProductSlug`'s own existing fail-closed guard; a direct unit test calls it with one missing and asserts `null`
- **Pass threshold:** Returns `null` (never throws, never looks up cross-tenant) when either is missing
- **Tool:** Jest

---

## Out of Scope for This Test Plan

- End-to-end live verification against a real staging/production tenant with a real connected repo (same class of gap `ppc-s1`'s/`ppc-s2`'s own DoDs already recorded as a Follow-up Action, not newly introduced here) — tracked as this story's own Follow-up Action at DoD time.
- Load/concurrency testing of the auto-provisioning race (two simultaneous first-requests for the same feature/product) — `createJourney` always creates a new row; a true double-provision race is a pre-existing, structurally unrelated risk shared by every `createJourney` call site in this codebase, not unique to this story's fallback path.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub Contents/Blobs API truncation-fallback behaviour for a >1MB pipeline-state.json is not re-tested here | This story reuses `product-rollup.js`'s already-tested `fetchPipelineState` extraction rather than re-implementing it — its own existing test coverage (`psbf-s1`) already covers the truncation path | No new mitigation needed; flagged so a reviewer does not expect duplicate truncation tests in this story's own new test file |
| No live staging/production verification yet | No test tenant with a connected repo was available this session | Follow-up Action at DoD, matching `ppc-s1`/`ppc-s2`'s own precedent |
