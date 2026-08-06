## Test Plan: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Both sides changed independently since last sync → detected as a genuine conflict | 2 tests | — | — | — | — | 🟢 |
| AC2 | Conflict resolves to pipeline-state.json's value, journey corrected | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Conflict log entry records slug, both values, winner, timestamp | 1 test | — | — | — | — | 🟢 |
| AC4 | No conflict (single-sided advance) → no log entry created | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A synthetic "last synced" marker plus two independently-changed values (pipeline-state.json gate value, journey stage value) | Synthetic fixture | None | |
| AC2 | Same conflict fixture, plus a mocked journey-write call to assert correction | Synthetic fixture + mock | None | |
| AC3 | Same conflict fixture, plus a mocked `sync_log` write call | Synthetic fixture + mock | None | |
| AC4 | A fixture where only one side changed since the last sync | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### conflictDetector_flagsGenuineConflict_whenBothSidesChangedSinceLastSync

- **Verifies:** AC1
- **Precondition:** A "last synced" marker recorded at T0; `pipeline-state.json`'s gate value changed at T1 (CLI advance); the journey's stage value changed independently at T2 (web-UI advance), both after T0
- **Action:** Run the conflict-detection check for this feature
- **Expected result:** Returns a conflict object (not a simple "apply latest write" result) identifying both divergent values
- **Edge case:** No

### conflictDetector_doesNotFlagConflict_whenOnlyOneSideChangedSinceLastSync

- **Verifies:** AC4 (negative control for AC1's detector)
- **Precondition:** Only the CLI side changed since the last sync; the journey side is unchanged
- **Action:** Run the conflict-detection check
- **Expected result:** Returns no conflict — a normal single-sided propagation
- **Edge case:** Yes — this is the boundary that distinguishes "sync" from "conflict"

### conflictResolver_correctsJourneyToMatchPipelineStateValue

- **Verifies:** AC2
- **Precondition:** A detected conflict where pipeline-state.json's value is `X` and the journey's value is `Y`
- **Action:** Run the resolver
- **Expected result:** The mocked journey-write call sets the journey's value to `X` (pipeline-state.json's value) — never `Y`
- **Edge case:** No

### conflictResolver_logsBothValuesAndWinner

- **Verifies:** AC3
- **Precondition:** Same conflict fixture as above
- **Action:** Run the resolver
- **Expected result:** A `sync_log` entry is written with `entry_type = 'conflict'`, `pipeline_state_value = X`, `journey_value = Y`, `resolved_value = X`, feature slug, and a timestamp
- **Edge case:** No

### conflictLog_hasNoEntry_forOrdinarySingleSidedSync

- **Verifies:** AC4
- **Precondition:** Only the CLI side changed since the last sync (no conflict, per the negative-control test above)
- **Action:** Run the full sync flow for this single-sided advance
- **Expected result:** Zero `sync_log` writes with `entry_type = 'conflict'` — the conflict log is reserved for genuine disagreements only

---

## Integration Tests

### fullSyncFlow_detectsAndResolvesConflict_endToEnd

- **Verifies:** AC1, AC2
- **Components involved:** css-s1's sync adapter, css-s2's write adapter, the new conflict detector and resolver, mocked Postgres and mocked Contents API
- **Precondition:** A feature where both sides have advanced independently since the last sync
- **Action:** Trigger the sync flow from either side's advance
- **Expected result:** The conflict is detected, resolved to pipeline-state.json's value, and the journey record reflects the corrected value at the end of the flow

---

## NFR Tests

### conflictDetection_addsSmallBoundedOverhead

- **NFR addressed:** Performance
- **Measurement method:** Compare the sync flow's execution time with conflict detection enabled versus a stub that always returns "no conflict"
- **Pass threshold:** Added overhead is under 100ms — conflict detection is a comparison of a small number of values, not a scan
- **Tool:** `scripts/run-all-tests.js` timing assertion

### conflictLogEntries_containNoCredentialFields

- **NFR addressed:** Security
- **Measurement method:** Inspect the `sync_log` entry object produced by `conflictResolver_logsBothValuesAndWinner`; assert no token/credential-shaped field or value
- **Pass threshold:** Zero matches
- **Tool:** `scripts/run-all-tests.js` assertion

### everyGenuineConflict_producesExactlyOneLogEntry

- **NFR addressed:** Audit
- **Measurement method:** Assert the conflict-resolution flow writes exactly one `sync_log` entry per detected conflict — not zero, not more than one
- **Pass threshold:** Exactly 1
- **Tool:** `scripts/run-all-tests.js` assertion

---

## Out of Scope for This Test Plan

- Automatic conflict avoidance (locking mechanisms) — this story only detects and resolves after the fact, per its own Out of Scope section.
- A dedicated conflict-log browsing UI — AC3 only requires the log entry be queryable, tested here via a direct data-layer assertion, not a UI test.

---

## Test Gaps and Risks

None identified — this story's mechanism is fully testable with synthetic fixtures and mocks; no external dependency or CSS-layout concern exists.
