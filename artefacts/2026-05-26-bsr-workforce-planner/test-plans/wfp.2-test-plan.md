# Test Plan: Update individual roster records without full re-ingestion

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.2.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-data-foundation.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `--action add` appends record to both group and roster JSON; both remain valid | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `--action edit` updates fields atomically in both files; rolls back if either write fails | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | `--action retire` sets endDate + retired:true in both files; no endDate → non-zero exit | 3 tests | — | — | — | — | 🟢 |
| AC4 | Unmatched --name → non-zero exit + error message; no file modified | 2 tests | — | — | — | — | 🟢 |
| AC5 | Duplicate add (same name+productGroup) → non-zero exit + conflict message | 1 test | — | — | — | — | 🟢 |
| NFR-INT | Atomic write (temp rename); interruption does not produce truncated file | 1 test | — | — | — | — | 🟢 |
| NFR-SEC | No PII written to stdout beyond confirmation message | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are fully automatable with synthetic fixture data.

---

## Test Data Strategy

All test data is synthetic. No real PII. Fixtures generated inline.

- **Roster fixtures:** Temp-dir JSON files containing 2–3 persons; each test creates and cleans up its own temp files.
- **Person record fixture:** `{ name: "Alex Rahi", team: "Platform", squad: "Infra", productGroup: "Platforms", role: "Engineer", title: "SWE", employmentType: "permanent", startDate: "2023-01-01", endDate: null, skills: ["node", "docker"] }`
- The module under test exports functions `addRecord`, `editRecord`, `retireRecord`, each taking (groupJson, rosterJson, args) and returning updated copies — no direct file I/O in unit tests. Integration tests handle file I/O.

---

## Unit tests

Test file: `tests/check-wfp2-update.js`
Run command: `node tests/check-wfp2-update.js`
Source under test: `src/workforce/update.js` (exports `addRecord`, `editRecord`, `retireRecord`, `findRecord`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `add-record-appended-to-group` | AC1 | `addRecord` on group with 2 existing records + new record | Returned group array length is 3; new record at end |
| 2 | `add-record-appended-to-roster` | AC1 | `addRecord` on roster with 5 records + new record | Returned roster array length is 6; record includes `productGroup` |
| 3 | `edit-updates-specified-fields-only` | AC2 | `editRecord` with `fields: { endDate: "2026-09-30" }` on a person record | `endDate` updated; all other fields unchanged |
| 4 | `edit-updates-in-both-group-and-roster` | AC2 | `editRecord` applied to both group array and roster array | Both returned arrays have updated record; unrelated records unchanged |
| 5 | `retire-sets-retired-true` | AC3 | `retireRecord` on person record | Returned record has `retired: true` |
| 6 | `retire-sets-end-date-from-arg` | AC3 | `retireRecord` with endDate `"2026-08-31"` | Returned record has `endDate: "2026-08-31"` |
| 7 | `retire-record-remains-in-array` | AC3 | `retireRecord` result length | Array length unchanged — record is updated in place, not deleted |
| 8 | `retire-no-end-date-throws-validation-error` | AC3 | `retireRecord` called without endDate argument | Function throws with message containing `"--endDate is required for retire action"` |
| 9 | `unmatched-name-returns-error` | AC4 | `findRecord` called with name that does not match any record | Returns `null`; caller check results in non-zero exit + error message |
| 10 | `unmatched-name-no-file-write-occurs` | AC4 | Full action pipeline with unmatched name | Neither group file nor roster file is modified |
| 11 | `duplicate-add-throws-conflict-error` | AC5 | `addRecord` with record having same name+productGroup as existing | Throws error with message containing `"conflict"` or `"already exists"` |
| 12 | `nfr-sec-confirmation-message-no-pii` | NFR-SEC | Confirmation output string from `editRecord` | String contains updated name (permitted by NFR) but no other person field values (no role, endDate, squad, etc.) |

---

## Integration tests

Test file: `tests/check-wfp2-update.js` (same file, integration section)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| I1 | `integration-add-both-files-updated` | AC1 | Write temp group + roster JSON; call full add flow; read files back | Both files contain the new record; both are valid JSON |
| I2 | `integration-edit-atomic-both-files` | AC2 | Write temp group + roster JSON; edit a field; read both files | Field updated in both; no partial state (both files updated before either confirms) |

---

## NFR tests

| # | Test ID | NFR | Scenario | Expected |
|---|---------|-----|---------|---------|
| N1 | `nfr-integrity-atomic-no-truncated-file` | Integrity | Simulate write failure during rename (by passing an unwritable path); check existing file | Original file still intact and valid JSON; no partial file at expected path |

---

## Total test count

**12 unit + 2 integration + 1 NFR = 15 tests**
All tests are expected to FAIL before implementation (RED phase of TDD).
