## Test Plan: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 7 gate types sync uniformly (parameterized test, per the css-s4 testability note) | 1 parameterized test (7 cases) | — | — | — | — | 🟢 |
| AC2 | Logged reconciliation gap is re-attempted on a subsequent live request, never a stored credential | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Automatic agreement rate measured and reported honestly against the 90% minimum signal | — | — | — | 1 scenario | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Real 4-week production measurement of the automatic agreement rate | AC3 | External-dependency | Requires real usage over a 4-week window in production — cannot be simulated in an automated test | Manual scenario (below) — a documented, repeatable measurement procedure run against the reconciliation log after 4 weeks of real usage, per `benefit-metric.md`'s own measurement method |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now for the automated parameterized test and reconciliation-retry tests; AC3's real measurement requires production usage time to elapse
**Owner:** Self-contained (automated); Hamish King (AC3's 4-week measurement)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The 7 gate values from `src/enforcement/gate-map.js`, each with a synthetic feature/journey fixture | Synthetic fixture, read directly from `gate-map.js` (not re-typed) | None | Test must import the real `gate-map.js` export, not hardcode a second copy of the 7 values |
| AC2 | A synthetic `sync_log` fixture with a pre-existing `entry_type = 'gap'` row; a mocked live request touching the same feature | Synthetic fixture + mock | None | |
| AC3 | Real `sync_log` production data (post-4-weeks) | Production reconciliation log | None (feature slugs and counts only) | Manual — see verification script |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC3 real-measurement gap already noted above.

---

## Unit Tests

### syncMechanism_appliesUniformly_acrossAllSevenGateValues

- **Verifies:** AC1
- **Precondition:** Import the real `GATE_MAP` export from `src/enforcement/gate-map.js` (not a re-typed copy); for each of its 7 keys, a synthetic fixture with that gate advanced
- **Action:** Run a single parameterized test iterating over all 7 gate keys, invoking the sync mechanism for each
- **Expected result:** For every one of the 7 gate types, the corresponding journey/pipeline-state.json update occurs — asserted generically (loop over gate keys and assert the write call happened), not via 7 separate hand-written test functions
- **Edge case:** No

### reconciliation_reAttemptsLoggedGap_onSubsequentLiveRequest

- **Verifies:** AC2
- **Precondition:** A `sync_log` fixture with one `entry_type = 'gap'` row for a feature; a subsequent mocked authenticated request touching that same feature, with its own live session token
- **Action:** Trigger the reconciliation check as part of that subsequent request's processing
- **Expected result:** The logged gap is identified, and the sync is re-attempted using the *new* request's own session token — the reconciliation code path never references or stores the original failed attempt's token
- **Edge case:** No

### reconciliation_neverReusesOriginalFailedAttemptsToken

- **Verifies:** AC2 (no-credential-storage invariant)
- **Precondition:** Same as above
- **Action:** Inspect the reconciliation function's inputs — it must only accept the current live request's token as a parameter, never read a stored value keyed to the original gap
- **Expected result:** A source-level assertion (or a test that removes the original token from scope entirely) confirms no reference path exists to the original failed attempt's credential
- **Edge case:** Yes — this is a negative/absence assertion, directly testing the RISK-ACCEPT decision's boundary

---

## Integration Tests

### fullVocabularyCoverage_noGateTypeLeftUnsynced

- **Verifies:** AC1
- **Components involved:** css-s1's sync adapter, css-s2's write adapter, `gate-map.js`
- **Precondition:** 7 features, one per gate type, each with a connected journey
- **Action:** Advance each feature's corresponding gate type
- **Expected result:** All 7 journeys reflect their respective gate's completion — a single end-to-end pass confirming no gate type was missed in the parameterization

---

## NFR Tests

### fullVocabularyMechanism_isOneParameterizedImplementation_notSevenCopies

- **NFR addressed:** Performance (maintainability framed as an NFR per this story's own NFR section — "must not scale linearly with maintenance cost")
- **Measurement method:** A source-level check (e.g. a script asserting the sync-mechanism module contains one function definition per concern, not 7 near-duplicate gate-specific functions)
- **Pass threshold:** Exactly one parameterized code path handles all 7 gate types
- **Tool:** A small `scripts/check-*.js`-style source assertion, matching this repo's existing convention for structural invariants (e.g. `check-skill-contracts.js`)

### reconciliationRetry_logsWithSameRigorAsConflictLog

- **NFR addressed:** Audit
- **Measurement method:** Assert the reconciliation re-attempt (successful or not) produces a `sync_log`-shaped entry with the same required fields as css-s3's conflict entries (feature slug, timestamp, outcome)
- **Pass threshold:** All required fields present
- **Tool:** `scripts/run-all-tests.js` assertion

---

## Out of Scope for This Test Plan

- Real-time push notifications for reconciliation gaps — not part of this story per its Out of Scope section; nothing to test.
- Any change to `gate-map.js`'s own 7 values — this story's tests import and consume that list, they do not test its correctness (that's covered by whatever originally shipped `gate-map.js`).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real 4-week automatic-agreement-rate measurement (AC3) | Requires real production usage time to elapse — cannot be simulated | Manual scenario in the verification script below, run against real reconciliation-log data after 4 weeks, per `benefit-metric.md`'s own measurement method; this is explicitly the benefit-metric's own minimum-validation-signal check, not a gap unique to this test plan |
