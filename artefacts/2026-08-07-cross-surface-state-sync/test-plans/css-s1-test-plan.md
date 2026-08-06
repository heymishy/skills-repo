## Test Plan: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `gate-advance` for `discovery-approved` synchronously updates the connected journey's `completedStages` | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | No connected journey → command completes normally, no sync attempted | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Journey resolves to a repo with no matching feature slug → no modification, mismatch logged | 1 test | — | — | — | — | 🟢 |
| AC4 | Any gate type other than `discovery-approved` → no sync attempted (this story's explicit boundary) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 4 ACs are fully covered by unit/integration tests using mocked Postgres and a synthetic `pipeline-state.json` fixture; no CSS layout, no real external network call.

---

## Test Data Strategy

**Source:** Mixed — synthetic
**PCI/sensitivity in scope:** No — feature slugs, gate names, and stage values only
**Availability:** Available now — synthetic fixtures generated in test setup
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `pipeline-state.json` fixture with one feature at `discovery-approved`; a mocked journey row with matching `feature_slug` | Synthetic fixture + mocked Postgres client | None | Mock returns a resolved journey object |
| AC2 | Same fixture; mocked Postgres query returns zero rows for the feature slug | Synthetic fixture + mocked Postgres client | None | |
| AC3 | A mocked journey row whose `feature_slug` does not exist in the fixture's `pipeline-state.json` | Synthetic fixture + mocked Postgres client | None | |
| AC4 | Same fixture, gate advanced to `test-plan-complete` instead of `discovery-approved` | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### resolveJourneyForFeatureSlug_returnsMatchingJourney_whenOneExists

- **Verifies:** AC1 (correlation lookup)
- **Precondition:** Mocked Postgres client configured to return one journey row with `feature_slug = 'test-feature'`
- **Action:** Call the new lookup adapter with `'test-feature'`
- **Expected result:** Returns the journey object with matching `journey_id` and `feature_slug`
- **Edge case:** No

### resolveJourneyForFeatureSlug_returnsNull_whenNoJourneyExists

- **Verifies:** AC2
- **Precondition:** Mocked Postgres client configured to return zero rows for the queried feature slug
- **Action:** Call the lookup adapter with a feature slug that has no journey
- **Expected result:** Returns `null` — no error thrown
- **Edge case:** Yes — absence-of-record path

### syncGateAdvanceToJourney_updatesCompletedStages_forDiscoveryApprovedGate

- **Verifies:** AC1
- **Precondition:** A resolved journey object exists (from the lookup adapter); `gate = 'discovery-approved'`
- **Action:** Call the sync function with the resolved journey and gate name
- **Expected result:** The mocked Postgres client receives exactly one `UPDATE`/write call setting `journeys.data.completedStages` to include `'discovery'`
- **Edge case:** No

### syncGateAdvanceToJourney_doesNotAttemptSync_forNonDiscoveryApprovedGate

- **Verifies:** AC4
- **Precondition:** A resolved journey object exists; `gate = 'test-plan-complete'`
- **Action:** Call the sync function with the resolved journey and a non-`discovery-approved` gate
- **Expected result:** The mocked Postgres client receives zero write calls; the function returns without error
- **Edge case:** Yes — boundary condition (this story's explicit scope limit)

### syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug

- **Verifies:** AC3
- **Precondition:** A resolved journey object exists whose `ownerRepoForFeature`-resolved repo's `pipeline-state.json` fixture does not contain the journey's `feature_slug`
- **Action:** Call the sync function
- **Expected result:** The mocked Postgres client receives zero write calls to `journeys`; a mismatch log entry is recorded containing the feature slug and journey ID
- **Edge case:** Yes — inconsistent cross-surface state at read time

---

## Integration Tests

### gateAdvanceCommand_completesSynchronously_withJourneyUpdateIncluded

- **Verifies:** AC1
- **Components involved:** `bin/skills gate-advance` CLI entry point, `src/enforcement/gate-map.js`, the new sync adapter, mocked Postgres client
- **Precondition:** A feature slug exists in `pipeline-state.json` with a connected journey (mocked)
- **Action:** Invoke the `gate-advance` command for `discovery-approved` end-to-end (CLI entry point through to the sync adapter, with Postgres mocked)
- **Expected result:** The command exits 0; the mocked Postgres client's write call for the journey update has already been made by the time the command's promise/process resolves — asserted by checking the mock's call log before asserting on process exit, not via a timeout or `setTimeout` delay

### gateAdvanceCommand_completesNormally_whenNoConnectedJourney

- **Verifies:** AC2
- **Components involved:** Same as above, with the mocked Postgres client returning zero journey rows
- **Precondition:** A feature slug exists in `pipeline-state.json` with no connected journey
- **Action:** Invoke the `gate-advance` command for `discovery-approved`
- **Expected result:** The command exits 0 with no error output; zero Postgres write calls recorded

---

## NFR Tests

### gateAdvanceCommand_addsBoundedDelay_whenJourneySyncEnabled

- **NFR addressed:** Performance
- **Measurement method:** Time the `gate-advance` command's execution with the journey-sync mocked adapter enabled (mocked Postgres call latency simulated at a realistic ~20ms) versus the same command with sync disabled entirely; compare the delta
- **Pass threshold:** Added delay is under 500ms (a synchronous single-row Postgres write should not meaningfully slow a CLI command; this is a generous ceiling pending real Postgres measurement, per the NFR profile's own flagged gap)
- **Tool:** `scripts/run-all-tests.js`'s existing timing-assertion pattern (`Date.now()` delta)

### syncLogEntries_containNoCredentialOrTokenFields

- **NFR addressed:** Security
- **Measurement method:** Inspect the mismatch-log entry object produced by `syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug`'s test case; assert no field name or value resembles a token/credential
- **Pass threshold:** Zero matches for token-like patterns (`accessToken`, `Authorization`, JWT-shaped strings) in the logged object
- **Tool:** `scripts/run-all-tests.js` assertion

### syncAttempts_areLoggedForBothSuccessAndMismatchCases

- **NFR addressed:** Audit
- **Measurement method:** Assert a log/record call occurs exactly once per sync attempt in both the AC1 success case and the AC3 mismatch case
- **Pass threshold:** Exactly one audit log entry per attempt — zero for AC4's boundary case (no attempt made, so nothing to log)
- **Tool:** `scripts/run-all-tests.js` assertion on a mocked logger

---

## Out of Scope for This Test Plan

- Real Postgres connectivity — all database interaction is mocked per the Test Data Strategy; a real-database integration test is deferred to a manual smoke test after implementation, once `das-s1`/`das-s2` are merged and a real staging environment exists.
- Any gate type other than `discovery-approved` beyond the AC4 boundary-negative test — full-vocabulary coverage is css-s4's test plan.
- The reverse sync direction (web-UI → pipeline-state.json) — css-s2's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Postgres write-latency measurement for the Performance NFR | `das-s1`'s own real-environment overhead (which this NFR's threshold is set relative to, per `nfr-profile.md`) has not yet been measured — its PR is still blocked on the GitHub Actions platform outage as of 2026-08-07 | The 500ms ceiling is a generous placeholder; re-verify against real Postgres latency once a staging environment is reachable, before treating this NFR as fully closed at DoD |
