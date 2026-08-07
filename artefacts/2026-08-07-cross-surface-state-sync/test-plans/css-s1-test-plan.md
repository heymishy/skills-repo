## Test Plan: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07 (revised at /definition-of-ready after the CLI→database ARCH decision — see `decisions.md`)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `gate-advance` for `discovery-approved` synchronously updates the connected journey's `completedStages` via the new internal endpoint | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | No connected journey → command completes normally, no sync attempted | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Journey resolves to a repo with no matching feature slug → no modification, mismatch logged | 1 test | — | — | — | — | 🟢 |
| AC4 | Any gate type other than `discovery-approved` → no sync attempted (this story's explicit boundary) | 1 test | — | — | — | — | 🟢 |
| AC5 | New internal endpoint requires a shared service-level credential; rejects requests without it | 2 tests | — | — | — | — | 🟢 |
| AC6 | No `INTERNAL_SYNC_URL`/`SECRET` configured at all → silent no-op, same as AC2 | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 6 ACs are fully covered by unit/integration tests using a mocked HTTP client (for the CLI side) and a mocked handler (for the new internal endpoint), plus a synthetic `pipeline-state.json` fixture. No CSS layout, no real network call, no real Postgres connection in any automated test.

---

## Test Data Strategy

**Source:** Mixed — synthetic + mocked HTTP
**PCI/sensitivity in scope:** No — feature slugs, gate names, and stage values only
**Availability:** Available now — synthetic fixtures generated in test setup
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `pipeline-state.json` fixture with one feature at `discovery-approved`; a mocked HTTP client whose response simulates the internal endpoint returning a matched journey | Synthetic fixture + mocked HTTP client | None | The endpoint handler itself is tested separately against a mocked Postgres client (server-side), matching `das-s1`'s own existing mocking convention |
| AC2 | Same fixture; mocked HTTP client simulates the endpoint returning "no journey found" | Synthetic fixture + mocked HTTP client | None | |
| AC3 | Mocked endpoint response simulating a journey whose `feature_slug` does not exist in the fixture's `pipeline-state.json` | Synthetic fixture + mocked HTTP client | None | |
| AC4 | Same fixture, gate advanced to `test-plan-complete` instead of `discovery-approved` | Synthetic fixture | None | |
| AC5 | A mocked service-level credential (test value only, never a real secret) | Synthetic fixture | Mocked credential value only, never real | Never a real secret in any committed fixture |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### journeySyncClient_callsInternalEndpoint_withServiceCredential

- **Verifies:** AC1, AC5 (correlation lookup + credential wiring)
- **Precondition:** Mocked HTTP client configured to return one matched journey for `feature_slug = 'test-feature'`
- **Action:** Call the new CLI-side client adapter with `'test-feature'`
- **Expected result:** The mocked HTTP client's captured request includes the service-level credential header, and the function returns the journey object with matching `journey_id` and `feature_slug`
- **Edge case:** No

### journeySyncClient_returnsNull_whenEndpointReportsNoJourney

- **Verifies:** AC2
- **Precondition:** Mocked HTTP client configured to return a "no journey found" response for the queried feature slug
- **Action:** Call the client adapter with a feature slug that has no journey
- **Expected result:** Returns `null` — no error thrown
- **Edge case:** Yes — absence-of-record path

### syncGateAdvanceToJourney_updatesCompletedStages_forDiscoveryApprovedGate

- **Verifies:** AC1
- **Precondition:** A resolved journey object exists (from the client adapter); `gate = 'discovery-approved'`
- **Action:** Call the sync function with the resolved journey and gate name
- **Expected result:** The mocked HTTP client receives exactly one write-request call to the internal endpoint, with a payload setting `completedStages` to include `'discovery'`
- **Edge case:** No

### syncGateAdvanceToJourney_doesNotAttemptSync_forNonDiscoveryApprovedGate

- **Verifies:** AC4
- **Precondition:** A resolved journey object exists; `gate = 'test-plan-complete'`
- **Action:** Call the sync function with the resolved journey and a non-`discovery-approved` gate
- **Expected result:** The mocked HTTP client receives zero calls; the function returns without error
- **Edge case:** Yes — boundary condition (this story's explicit scope limit)

### syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug

- **Verifies:** AC3
- **Precondition:** A resolved journey object exists whose `ownerRepoForFeature`-resolved repo's `pipeline-state.json` fixture does not contain the journey's `feature_slug`
- **Action:** Call the sync function
- **Expected result:** The mocked HTTP client receives zero write calls; a mismatch log entry is recorded containing the feature slug and journey ID
- **Edge case:** Yes — inconsistent cross-surface state at read time

### internalEndpoint_rejectsRequest_withMissingOrIncorrectCredential

- **Verifies:** AC5
- **Precondition:** A request to the new internal endpoint (server-side, mocked Postgres) with no credential header, and a second case with an incorrect credential value
- **Action:** Send both requests to the endpoint handler
- **Expected result:** Both requests are rejected (401/403-equivalent) — the endpoint never proceeds to read/write the mocked Postgres client for either case
- **Edge case:** Yes — this is the security boundary the credential wiring exists to enforce

### internalEndpoint_acceptsRequest_withCorrectCredential

- **Verifies:** AC5 (positive counterpart to the rejection test — proves the wiring works, not just that it fails closed)
- **Precondition:** A request to the endpoint with the correct service-level credential
- **Action:** Send the request
- **Expected result:** The endpoint proceeds to the mocked Postgres client and returns the expected journey data — the credential check does not also block legitimate calls
- **Edge case:** No

### journeySyncClient_noOps_whenSyncEnvNotConfigured

- **Verifies:** AC6
- **Precondition:** `INTERNAL_SYNC_URL` and `INTERNAL_SYNC_SECRET` both unset in the test environment
- **Action:** Call `resolveJourneyForFeatureSlug` (or the higher-level sync function)
- **Expected result:** Returns `null`/no-op immediately, with no HTTP call attempted at all — identical observable outcome to AC2's "no connected journey" case
- **Edge case:** Yes — configuration-absent path, distinct from AC2's "configured but no matching journey" path

---

## Integration Tests

### gateAdvanceCommand_completesSynchronously_withJourneyUpdateIncluded

- **Verifies:** AC1
- **Components involved:** `bin/skills gate-advance` CLI entry point, `src/enforcement/gate-map.js`, the new CLI-side HTTP client adapter, mocked internal-endpoint response
- **Precondition:** A feature slug exists in `pipeline-state.json` with a connected journey (mocked via the HTTP client)
- **Action:** Invoke the `gate-advance` command for `discovery-approved` end-to-end (CLI entry point through to the client adapter, with the HTTP call mocked)
- **Expected result:** The command exits 0; the mocked HTTP client's write call for the journey update has already been made by the time the command's promise/process resolves — asserted by checking the mock's call log before asserting on process exit, not via a timeout or `setTimeout` delay

### gateAdvanceCommand_completesNormally_whenNoConnectedJourney

- **Verifies:** AC2
- **Components involved:** Same as above, with the mocked HTTP client returning "no journey found"
- **Precondition:** A feature slug exists in `pipeline-state.json` with no connected journey
- **Action:** Invoke the `gate-advance` command for `discovery-approved`
- **Expected result:** The command exits 0 with no error output; zero write calls recorded

---

## NFR Tests

### gateAdvanceCommand_addsBoundedDelay_whenJourneySyncEnabled

- **NFR addressed:** Performance
- **Measurement method:** Time the `gate-advance` command's execution with the mocked HTTP client simulating a realistic ~50ms round-trip (a network call is slower than a direct Postgres write, which is why the ceiling below is higher than a same-process DB write would need) versus the same command with sync disabled entirely
- **Pass threshold:** Added delay is under 500ms — a generous ceiling pending real network-latency measurement, per the NFR profile's own flagged gap
- **Tool:** `scripts/run-all-tests.js`'s existing timing-assertion pattern (`Date.now()` delta)

### syncLogEntries_containNoCredentialOrTokenFields

- **NFR addressed:** Security
- **Measurement method:** Inspect the mismatch-log entry object produced by `syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug`'s test case, and the request payloads captured in the AC5 tests; assert no field name or value resembles a token/credential outside the one explicitly-tested credential header itself
- **Pass threshold:** Zero unexpected matches for token-like patterns (`accessToken`, `Authorization`, JWT-shaped strings) anywhere except the deliberate AC5 credential-header assertion
- **Tool:** `scripts/run-all-tests.js` assertion

### syncAttempts_areLoggedForBothSuccessAndMismatchCases

- **NFR addressed:** Audit
- **Measurement method:** Assert a log/record call occurs exactly once per sync attempt in both the AC1 success case and the AC3 mismatch case
- **Pass threshold:** Exactly one audit log entry per attempt — zero for AC4's boundary case (no attempt made, so nothing to log)
- **Tool:** `scripts/run-all-tests.js` assertion on a mocked logger

---

## Out of Scope for This Test Plan

- Real network connectivity to a deployed web-UI instance — the internal endpoint call is mocked in all automated tests; a real end-to-end smoke test is deferred to a manual scenario once a staging environment is reachable.
- Real Postgres connectivity on the endpoint's own server-side handler — mocked, matching `das-s1`'s own established convention.
- Any gate type other than `discovery-approved` beyond the AC4 boundary-negative test — full-vocabulary coverage is css-s4's test plan.
- The reverse sync direction (web-UI → pipeline-state.json) — css-s2's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real network-latency measurement for the Performance NFR | Neither `das-s1`'s own real-environment overhead nor this story's own network round-trip has been measured yet — `das-s1`'s PR is still blocked on the GitHub Actions platform outage as of 2026-08-07 | The 500ms ceiling is a generous placeholder; re-verify against real measurements once a staging environment is reachable, before treating this NFR as fully closed at DoD |
