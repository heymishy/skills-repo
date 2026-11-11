## Test Plan: Persist the two seeded deferred-item records that ddft-s1 promised but never shipped

**Story reference:** artefacts/2026-11-12-ddft-seed-records-fix/stories/dsrf-s1-persist-seeded-deferred-item-records.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-12

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `workspace/incidents.json` exists, is tracked in git, parses as a JSON array | 2 (UT1, UT2) | — | — | — | — | 🟢 |
| AC2 | Exactly one `tfhc-s1` deferred-item record with the specified fields | 1 (UT3) | — | — | — | — | 🟢 |
| AC3 | Exactly one C1-versus-Option-C deferred-item record with the specified fields | 1 (UT4) | — | — | — | — | 🟢 |
| AC4 | The check reads the real committed file and fails if a record is missing, duplicated or mistyped | 1 (UT5) | 1 (IT1) | — | — | — | 🟢 |
| AC5 | Existing loaders read both records without error; no `type: "incident"` record introduced | — | 1 (IT2) | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. Every AC is verifiable by reading the real committed file, which is the whole point of the story.

---

## Test Data Strategy

**Source:** Fixtures. The "fixture" is the real committed `workspace/incidents.json`, read-only. No temp files, no mocks. This is a deliberate reversal of ddft-s1's temp-file approach, which is what let that story pass its tests with no persisted data.
**PCI/sensitivity in scope:** No. The records hold pipeline-tooling facts only.
**Availability:** The file does not exist yet. That is why every test fails right now, which is the intended RED state.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC5 | `workspace/incidents.json` on disk, resolved relative to the test file with `path.join(__dirname, '..', 'workspace', 'incidents.json')` | Real committed file | None | Never written to by any test |
| AC1 (tracked) | `git ls-files --error-unmatch workspace/incidents.json` | Real git index | None | Skipped with a clear message when run outside a git work tree |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All in `tests/check-dsrf-s1-seeded-records.js`, using this repo's assert-based harness (`node scripts/run-all-tests.js` globs `tests/check-*.js`, so no registration is needed).

### UT1 — the file exists and parses as a JSON array

- **Verifies:** AC1
- **Precondition:** None
- **Action:** Read `workspace/incidents.json` and `JSON.parse` it
- **Expected result:** File exists; the parsed value is an array with `length >= 2`
- **Edge case:** Yes. An empty array or a missing file must fail, not pass silently.

### UT2 — the file is tracked in git

- **Verifies:** AC1
- **Precondition:** Running inside a git work tree
- **Action:** `git ls-files --error-unmatch workspace/incidents.json`
- **Expected result:** Exit code 0. An untracked file (the exact ddft-s1 failure) fails here.
- **Edge case:** Yes

### UT3 — exactly one tfhc-s1 deferred-item record, correctly shaped

- **Verifies:** AC2
- **Precondition:** File parsed
- **Action:** Filter records where `linkedStory === 'tfhc-s1'`
- **Expected result:** Exactly one match with `type: 'deferred-item'`, `source: 'risk-accept'`, `linkedFeature: '2026-10-30-test-fixture-hardening-continuation'`, a `summary` matching `/C3/` and `/passing/`, and a non-empty `revisitCondition`
- **Edge case:** Yes. Zero or two matches both fail.

### UT4 — exactly one C1-versus-Option-C deferred-item record, correctly shaped

- **Verifies:** AC3
- **Precondition:** File parsed
- **Action:** Filter records where `source === 'backlog-thread'`
- **Expected result:** Exactly one match with `type: 'deferred-item'`, a `summary` matching `/C1/` and `/Option C/`, and a `revisitCondition` matching `/product\/.*refresh/`
- **Edge case:** Yes

### UT5 — the check rejects bad file contents (negative control)

- **Verifies:** AC4
- **Precondition:** The check's assertion logic is exported from, or duplicated inside, the test as a pure function over an array of records
- **Action:** Feed it three in-memory arrays: one record missing, one record duplicated, one record typed `incident`
- **Expected result:** The function throws for each. This proves the guard can fail. The input here is in-memory only, and the real file is never touched.
- **Edge case:** Yes

---

## Integration Tests

### IT1 — every record in the real file passes the shipped validator

- **Verifies:** AC4
- **Components involved:** `scripts/lib/incident-store.js` (`validateRecord`), the real `workspace/incidents.json`
- **Precondition:** File parsed
- **Action:** Call `validateRecord` on every record
- **Expected result:** No throw. A record built by hand without `source` would fail here, so the records cannot bypass the mechanism's own rules.

### IT2 — existing loaders read the real file

- **Verifies:** AC5
- **Components involved:** `loadRecords` and `loadIncidentRecords` from `scripts/lib/incident-store.js`, the real file
- **Precondition:** None
- **Action:** Call both loaders with the real file path
- **Expected result:** Both return the same array, containing both records. No record has `type: 'incident'`. Neither loader throws.

---

## NFR Tests

### NFR-SEC1 — no secrets, tenant identifiers or personal data in the records

- **NFR addressed:** Security
- **Measurement method:** Scan the serialised file for `token`, `secret`, `password`, `tenant_id` and an email-address pattern
- **Pass threshold:** Zero matches
- **Tool:** Same assert-based harness

### NFR-CORR1 — the check never writes to the real file

- **NFR addressed:** Correctness
- **Measurement method:** Record the file's SHA-256 and mtime before and after the whole test run
- **Pass threshold:** Both unchanged
- **Tool:** Same assert-based harness

Performance: None — two records in a small JSON file, confirmed.

---

## Out of Scope for This Test Plan

- Whether the `tfhc-s1` failure or the contradiction are themselves fixed. The tests assert the records exist, not that the underlying problems are resolved.
- `draftTriageSummary` wiring and the Jaccard threshold. Separate story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| A future story could legitimately resolve `tfhc-s1` and want to remove its record, which would make UT3 fail | The test pins today's state on purpose | When that happens the resolving story edits UT3 in the same PR. Marking a record resolved rather than deleting it is preferred, and UT3 should be written to allow `status: 'resolved'` at that point. |
