## Test Plan: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/shared-infrastructure.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-shr1-schema-harness.js`
**Test runner:** `node tests/check-shr1-schema-harness.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `hasInfraTrack: true` accepted by integrity check | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `hasMigrationTrack: true` + `migrationReviewPath` accepted | 2 tests | — | — | — | — | 🟢 |
| AC3 | `skills advance` writes `hasInfraTrack` + `infraPlanPath` correctly | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Fields absent → no error (fields are optional) | 1 test | — | — | — | — | 🟢 |
| AC5 | Schema and implementation in same commit | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — JSON fixtures constructed in test setup; temp pipeline-state.json written to OS temp dir
**PCI/sensitivity in scope:** No
**Availability:** Available now — self-contained
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | story entry with `hasInfraTrack: true` | Synthetic object | None | |
| AC2 | story entry with `hasMigrationTrack: true`, `migrationReviewPath: "artefacts/feat/migrations/s1-review.md"` | Synthetic object | None | |
| AC3 | feature slug + story ID + field values to advance | Synthetic | None | Writes to temp pipeline-state.json |
| AC4 | story entry with neither flag set | Synthetic object | None | |
| AC5 | Git log for the commit that adds schema fields | `git log` on test run | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### schema-contains-hasInfraTrack-field
- **Verifies:** AC1, AC5
- **Precondition:** `pipeline-state.schema.json` is readable
- **Action:** Read `.github/pipeline-state.schema.json`; locate the story properties definition; assert it contains a property `hasInfraTrack` of type boolean
- **Expected result:** Property `hasInfraTrack` exists with `type: "boolean"` in the story schema
- **Edge case:** No

### schema-contains-hasMigrationTrack-and-path-fields
- **Verifies:** AC2, AC5
- **Precondition:** `pipeline-state.schema.json` is readable
- **Action:** Read the schema; assert it contains `hasMigrationTrack` (boolean), `migrationReviewPath` (string), and `infraPlanPath` (string) in the story properties
- **Expected result:** All four new fields present in story schema with correct types
- **Edge case:** No

### integrity-check-accepts-hasInfraTrack-true
- **Verifies:** AC1
- **Precondition:** `scripts/check-pipeline-state-integrity.js` is readable; synthetic pipeline-state with a story entry containing `hasInfraTrack: true`
- **Action:** Call the integrity check module with the synthetic state; assert exit code 0 / no thrown error
- **Expected result:** Check passes without error
- **Edge case:** No

### integrity-check-accepts-hasMigrationTrack-with-path
- **Verifies:** AC2
- **Precondition:** Synthetic story entry with `hasMigrationTrack: true`, `migrationReviewPath: "artefacts/feat/migrations/s1-review.md"`
- **Action:** Run integrity check on synthetic state
- **Expected result:** Check passes without error
- **Edge case:** No

### integrity-check-accepts-absent-flags
- **Verifies:** AC4
- **Precondition:** Story entry with no `hasInfraTrack` or `hasMigrationTrack` field
- **Action:** Run integrity check on synthetic state
- **Expected result:** Check passes — fields are optional, absence is valid
- **Edge case:** No

### advance-writes-hasInfraTrack-and-path
- **Verifies:** AC3
- **Precondition:** Temp pipeline-state.json with a feature "test-feat" and story "s1"
- **Action:** Run `node bin/skills advance test-feat s1 hasInfraTrack=true infraPlanPath="artefacts/test-feat/infra/s1-infra-plan.md"`
- **Expected result:** Story entry in temp pipeline-state.json has `hasInfraTrack: true` and `infraPlanPath` set to the given path
- **Edge case:** No

### schema-and-harness-in-same-commit
- **Verifies:** AC5
- **Precondition:** Git history available
- **Action:** Find the commit that adds `hasInfraTrack` to `pipeline-state.schema.json`; assert that the same commit also modifies `scripts/check-pipeline-state-integrity.js`
- **Expected result:** Single commit SHA contains both the schema file and the harness file — no intermediate state where schema is updated but harness is not
- **Edge case:** No

---

## Integration Tests

### integrity-check-passes-after-advance-write
- **Verifies:** AC3 (integration: advance + integrity check)
- **Components involved:** `bin/skills advance`, `scripts/check-pipeline-state-integrity.js`, temp pipeline-state.json
- **Precondition:** Temp pipeline-state.json with a story entry
- **Action:** Run `skills advance` to write `hasInfraTrack=true infraPlanPath="artefacts/test/infra/s1-plan.md"` then run the integrity check on the same file
- **Expected result:** Integrity check exits 0 — the fields written by advance are schema-valid and accepted by the checker

### advance-with-false-flag-passes-integrity
- **Verifies:** AC4 (integration: explicit false value is valid)
- **Components involved:** `bin/skills advance`, `scripts/check-pipeline-state-integrity.js`
- **Precondition:** Temp pipeline-state.json with story entry
- **Action:** Advance `hasInfraTrack=false`; run integrity check
- **Expected result:** Integrity check passes — explicit `false` is valid

---

## NFR Tests

### integrity-check-completes-within-5-seconds
- **NFR addressed:** Performance
- **Measurement method:** Build a synthetic pipeline-state.json with 30 feature entries, each having 2 stories; measure elapsed time of `check-pipeline-state-integrity.js` execution
- **Pass threshold:** Total elapsed time < 5000ms
- **Tool:** `Date.now()` timing in test

### new-fields-reject-non-string-path-values
- **NFR addressed:** Security (paths only, no content)
- **Measurement method:** Attempt to write an integer value for `infraPlanPath` via `skills advance`; assert the field is stored as a string or the advance command rejects non-string values
- **Pass threshold:** `infraPlanPath` in pipeline-state.json is always a string type or advance rejects non-string input
- **Tool:** Node.js assertion

---

## Out of Scope for This Test Plan

- H-INF and H-MIG gate logic — tested in inf.4 and mig.3
- UI rendering of infra/migration track state — deferred per story out-of-scope
- Automatic detection of `hasInfraTrack` from story content — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
