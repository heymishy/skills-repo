# Test Plan: Ingest workforce roster from per-group xlsx files

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.1.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-data-foundation.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Group file created with standard schema, null for missing fields | 3 tests | 1 test | — | — | — | 🟢 |
| AC2 | roster.json merged from all groups with productGroup; dedup by name+productGroup | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | schema-map column name mapping applied | 1 test | — | — | — | — | 🟢 |
| AC4 | Null endDate for permanent employees (not empty string) | 1 test | — | — | — | — | 🟢 |
| AC5 | cost-model.json seeded with unique roles if absent; not overwritten if exists | 2 tests | 1 test | — | — | — | 🟢 |
| AC6 | Blank-name rows silently skipped | 1 test | — | — | — | — | 🟢 |
| NFR-PERF | 200-row ingestion completes under 10 seconds | 1 test | — | — | — | — | 🟢 |
| NFR-SEC | No person data written to stdout beyond counts | 1 test | — | — | — | — | 🟢 |
| NFR-INT | Partial-write failure preserves previous file | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are fully automatable with synthetic fixture data.

---

## Test Data Strategy

All test data is synthetic. No real PII. Fixtures are generated inline in the test file.

- **Roster fixture:** 5-person array with varied roles, employment types, and a blank-name row.
- **Schema-map fixture:** `{ "Employee Name": "name", "Team": "team", "Role": "role" }` — maps source column names to standard schema field names.
- **Cost-model fixture:** Inline JSON with one role entry and a null rate.
- **Roster file:** Written to a temp directory within the test; cleaned up after each test case.

Input format for the intake module under test: the module exports a pure function `normaliseRecord(row, schemaMap)` and an `ingestGroup(inputRows, schemaMap, groupName)` function. The file-write and CLI wrapper is tested separately via integration tests that call the CLI entry point with a mock xlsx equivalent (a pre-parsed JSON array).

---

## Unit tests

Test file: `tests/check-wfp1-intake.js`
Run command: `node tests/check-wfp1-intake.js`
Source under test: `src/workforce/intake.js` (exports `normaliseRecord`, `ingestGroup`, `seedCostModel`, `mergeRoster`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `normalise-record-maps-column-names` | AC1, AC3 | Row `{ "Employee Name": "Alex", "Team": "Infra" }` + schema-map `{ "Employee Name": "name", "Team": "team" }` | Output `{ name: "Alex", team: "Infra", squad: null, productGroup: null, role: null, title: null, employmentType: null, startDate: null, endDate: null, skills: null }` |
| 2 | `normalise-record-null-for-missing-standard-field` | AC1 | Row maps name only; squad, role, etc. absent from schema-map | All unmapped standard fields are `null` in output — not `undefined`, not omitted |
| 3 | `normalise-record-all-standard-fields-present` | AC1 | Row fully mapped via schema-map | Output object has all 10 standard fields (`name, team, squad, productGroup, role, title, employmentType, startDate, endDate, skills`) |
| 4 | `normalise-record-null-end-date-for-permanent` | AC4 | Row has no end-date column in source and no end-date in schema-map | `endDate` is `null` (not `""`, not `undefined`) |
| 5 | `schema-map-column-override` | AC3 | Column named `"Emp Full Name"` maps to `name` via schema-map | Output `name` is populated from `"Emp Full Name"` source value |
| 6 | `skip-blank-name-row` | AC6 | `ingestGroup` given rows where one row has `name: null` or `name: ""` after normalisation | Output array excludes the blank-name row; length is input length minus blank rows |
| 7 | `dedup-same-name-same-productGroup-last-write-wins` | AC2 | Two rows with identical `name` and `productGroup` in same group | `ingestGroup` returns only the second (last) record |
| 8 | `dedup-same-name-different-productGroup-both-kept` | AC2 | Two rows with identical `name` but different `productGroup` | Both records are kept |
| 9 | `seed-cost-model-creates-with-null-rates` | AC5 | `seedCostModel` called with role list `["Engineer", "QA"]` | Returns object with entries `{ role: "Engineer", quarterlyRateNZD: null, annualRateNZD: null }` etc. |
| 10 | `seed-cost-model-unique-roles-only` | AC5 | Role list has duplicates `["Engineer", "Engineer", "QA"]` | Returns exactly 2 entries — one per unique role |
| 11 | `merge-roster-includes-productGroup-field` | AC2 | `mergeRoster` called with group records from two groups | All merged records have `productGroup` field set to their source group name |
| 12 | `nfr-sec-no-pii-in-stdout-output` | NFR-SEC | `ingestGroup` returns count summary string (e.g. `"Ingested 5 records"`) | Summary string contains only numeric count — no name, team, role, or any person field value |

---

## Integration tests

Test file: `tests/check-wfp1-intake.js` (same file, integration section)
These tests create temp files, invoke the full ingestion flow, and clean up.

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| I1 | `integration-intake-group-creates-group-json` | AC1 | Full `ingestGroup` flow with 3-person fixture + schema-map → write to temp dir | `workforce/[group].json` written with valid JSON; all 3 records present with standard schema fields |
| I2 | `integration-intake-all-creates-roster-json` | AC2 | Run `ingestGroup` for two mock groups then `mergeRoster` → write to temp dir | `workforce/roster.json` written with all person records; each record has `productGroup` field |
| I3 | `integration-cost-model-seed-all-roles` | AC5 | Full ingestion of 4-person fixture with 3 distinct roles → `seedCostModel` | `cost-model.json` created with 3 entries; all have `null` rates |
| I4 | `integration-cost-model-not-overwritten-if-exists` | AC5 | `seedCostModel` called when `cost-model.json` already exists with populated rate | Existing file unchanged — rate not reset to null |

---

## NFR tests

| # | Test ID | NFR | Scenario | Expected |
|---|---------|-----|---------|---------|
| N1 | `nfr-perf-200-rows-under-10s` | Performance | `ingestGroup` called with 200-row synthetic fixture | Wall time from start to return is under 10,000 ms |
| N2 | `nfr-integrity-write-failure-preserves-previous` | Integrity | Integration test: first run writes a valid group JSON; second run is interrupted (simulated via error injection before final rename) | Previously written file is still intact and valid JSON; no partial/truncated file exists at the path |

---

## Total test count

**12 unit + 4 integration + 2 NFR = 18 tests**
All tests are expected to FAIL before implementation (RED phase of TDD).
