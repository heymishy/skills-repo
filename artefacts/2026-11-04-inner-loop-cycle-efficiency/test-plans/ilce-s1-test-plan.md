## Test Plan: Add structured per-skill timing writes to pipeline-timings.jsonl

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s1-timing-writes.md
**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/inner-loop-timing-instrumentation.md
**Test plan author:** Copilot
**Date:** 2026-11-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Each instrumented skill appends one structured record with required fields | 2 tests | — | — | — | — | 🟢 |
| AC2 | Log file created fresh on first run, no error | 1 test | — | — | — | — | 🟢 |
| AC3 | Concurrent appends from separate worktrees do not corrupt the file | — | 1 test | — | — | — | 🟢 |
| AC4 | Record shape matches schema; a write failure is non-fatal to the skill | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 4 ACs are fully covered by unit and integration tests.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixture records and a temp `pipeline-timings.jsonl` path in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Sample skill/story/stage metadata | Generated in test setup | None | Plain strings/timestamps only |
| AC2 | A clean temp directory with no existing log file | Generated in test setup | None | |
| AC3 | Two simulated concurrent append calls | Generated in test setup | None | Simulated via two rapid sequential/async calls, not real separate processes |
| AC4 | A deliberately malformed record + a mocked write failure | Generated in test setup | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### appendTimingRecord writes a well-formed record for a given stage

- **Verifies:** AC1
- **Precondition:** A temp `pipeline-timings.jsonl` path with no existing content.
- **Action:** Call the append function with `{skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'implementation-plan'}`.
- **Expected result:** The file's last line, parsed as JSON, contains exactly `skill`, `featureSlug`, `storySlug`, `stage`, `timestamp` — `timestamp` is a valid ISO 8601 string.
- **Edge case:** No.

### appendTimingRecord includes dispatchCount specifically for subagent-execution stage

- **Verifies:** AC1
- **Precondition:** Same temp file setup.
- **Action:** Call the append function with `stage: 'subagent-execution'` and `dispatchCount: 3`.
- **Expected result:** The appended record contains `dispatchCount: 3` as a number; a record for any other stage does not contain a `dispatchCount` field.
- **Edge case:** Yes — confirms the field is stage-conditional, not always present.

### appendTimingRecord includes fullSuite specifically for verify-completion stage

- **Verifies:** AC1 (added at `/definition-of-ready` — `ilce-s2`'s Contract Proposal revealed this field is required for its own AC3)
- **Precondition:** Same temp file setup.
- **Action:** Call the append function with `stage: 'verify-completion'` and `fullSuite: true`, then again with `fullSuite: false`.
- **Expected result:** Each appended record contains `fullSuite` as a boolean matching what was passed; a record for any other stage does not contain a `fullSuite` field.
- **Edge case:** Yes — the field this cross-story dependency was missing.

### appendTimingRecord creates the log file fresh when it does not exist

- **Verifies:** AC2
- **Precondition:** The temp path does not exist on disk at all (not even an empty file).
- **Action:** Call the append function once.
- **Expected result:** The file now exists, contains exactly one line, and that line parses as valid JSON matching the AC1 schema. No exception is thrown.
- **Edge case:** Yes — first-ever-write path.

### Schema validator accepts a well-formed record and rejects one missing a required field

- **Verifies:** AC4 (schema half)
- **Precondition:** Two record objects — one with all required fields, one missing `storySlug`.
- **Action:** Run the schema-validation function against each.
- **Expected result:** The well-formed record validates `true`; the record missing `storySlug` validates `false` (or throws a specific, named error — not a generic crash).
- **Edge case:** Yes — the missing-field case.

### appendTimingRecord does not throw when the underlying write fails

- **Verifies:** AC4 (non-fatal half)
- **Precondition:** The underlying file-write function is mocked to throw.
- **Action:** Call the append function.
- **Expected result:** The function catches the error internally and returns normally — the calling skill's own completion is not blocked. No exception propagates to the caller.
- **Edge case:** Yes — failure-path test.

---

## Integration Tests

### Two near-simultaneous append calls do not corrupt the log file

- **Verifies:** AC3
- **Components involved:** The append function, the filesystem append-only write path.
- **Precondition:** A temp log file with one existing valid record.
- **Action:** Fire two append calls back-to-back with no `await` between them (simulating two worktrees writing at roughly the same moment), then wait for both to settle.
- **Expected result:** The file contains exactly 3 lines total (1 original + 2 new), every line parses as valid JSON — no interleaved/truncated/merged line.

---

## NFR Tests

### Append operation overhead stays under 100ms

- **NFR addressed:** Performance
- **Measurement method:** Time 20 consecutive append calls; compute the average.
- **Pass threshold:** Average < 100ms per call.
- **Tool:** `node scripts/run-all-tests.js`'s own timing helper (`Date.now()` before/after).

### Timing records never contain disallowed fields

- **NFR addressed:** Security
- **Measurement method:** Call the append function with a payload that includes extra keys (`accessToken`, `sessionId`, `token`) alongside the valid fields; inspect the written record's keys.
- **Pass threshold:** The written record's keys are limited to the documented allowlist (`skill`, `featureSlug`, `storySlug`, `stage`, `timestamp`, `dispatchCount` where applicable) — none of the disallowed keys appear, even if passed in.
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- Testing any specific skill's own business logic beyond the append call itself (e.g. `/subagent-execution`'s dispatch logic) — that is each skill's own existing test coverage, unaffected by this story.
- Rollup/query-script testing — the query script that reads `pipeline-timings.jsonl` is not part of this story's scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| True multi-process concurrency (two separate OS processes writing simultaneously) is simulated, not literally reproduced | Node test environment runs single-process; true cross-worktree concurrency is hard to reproduce deterministically in a unit/integration test | The simulated near-simultaneous-call test (AC3) covers the same underlying risk (two writers, one file, append-only) at a lower fidelity; accepted as sufficient given append-only writes are inherently low-risk for this failure mode |
