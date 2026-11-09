## Test Plan: Deferred-item record mechanism (generalized schema)

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Test plan author:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Schema generalized with `type` field; existing records default to `"incident"`; deferred-item-specific fields added | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `tfhc-s1` registered as a real, correctly-sourced `deferred-item` record | — | 1 test | — | — | — | 🟢 |
| AC3 | C1-vs-Option-C registered as a real, correctly-sourced `deferred-item` record | — | 1 test | — | — | — | 🟢 |
| AC4 | Both seeded records found, correctly typed `deferred-item` | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All four ACs are fully covered by unit/integration tests against real file I/O on `workspace/incidents.json` — no browser, no external service, no CSS layout involved.

---

## Test Data Strategy

**Source:** Mixed — Synthetic (schema/defaulting tests) + real seeded cases (AC2/AC3 use the actual `tfhc-s1` and C1-vs-Option-C content, not invented data)
**PCI/sensitivity in scope:** No
**Availability:** Available now — both seed cases are already documented in this repo (`tfhc-s1`'s own pipeline-state.json entry; the C1-vs-Option-C entry in `workspace/capture-log.md`, 2026-11-08)
**Owner:** Self-contained — test setup constructs a temp copy of `workspace/incidents.json` seeded with `itar-s1`'s pre-existing incident record fixture plus the two real deferred-item cases; never mutates the real file

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture incident record missing `type` (pre-generalization shape) | Synthetic, modeled on `itar-s1`'s real schema | None | Proves backward-compatible defaulting |
| AC2 | `tfhc-s1`'s real failure description (prStatus="merged", testPlan.passing 4 < totalTests 5) | Real — `.github/pipeline-state.json` | None | Exact wording used in `revisitCondition`, not paraphrased |
| AC3 | The real C1-vs-Option-C contradiction text | Real — `workspace/capture-log.md` 2026-11-08 entry | None | `revisitCondition` must match the logged deferral ("deferred to a broader `product/` refresh later") |
| AC4 | Both AC2/AC3 records already written | Produced by AC2/AC3 tests | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### addsTypeFieldDefaultingExistingRecordsToIncident

- **Verifies:** AC1
- **Precondition:** A fixture record object with no `type` key, shaped like an `itar-s1` incident record
- **Action:** Run the schema migration/defaulting function against the fixture
- **Expected result:** Returned record has `type: "incident"`; all original fields (`id`, `trigger`, `summary`, `tags`, `priorIncidentLinks`, `status`, `triageSummary`, `confirmationStatus`) are unchanged
- **Edge case:** No

### validatesDeferredItemRequiredFields

- **Verifies:** AC1
- **Precondition:** A new record object with `type: "deferred-item"` but missing `source`
- **Action:** Run record validation
- **Expected result:** Validation rejects the record with an error naming the missing `source` field; a record with `type: "incident"` is never required to supply `source`/`revisitCondition`/`linkedFeature`/`linkedStory`
- **Edge case:** Yes — type-conditional required fields must not leak onto the other type

---

## Integration Tests

### generalizedSchemaRoundTripsThroughDisk

- **Verifies:** AC1
- **Components involved:** Schema module, `workspace/incidents.json` file I/O
- **Precondition:** Temp copy of `incidents.json` containing one pre-generalization incident record
- **Action:** Write a new `type: "deferred-item"` record alongside it, then read the file back
- **Expected result:** File contains both records; the incident record still reads as `type: "incident"`; the new record reads with all five deferred-item fields intact

### registersTfhcS1AsRealDeferredItemRecord

- **Verifies:** AC2
- **Components involved:** Record-registration function, `workspace/incidents.json`
- **Precondition:** Temp `incidents.json`; the real `tfhc-s1` failure text available as input
- **Action:** Register `tfhc-s1` as a deferred-item record
- **Expected result:** A record exists with `type: "deferred-item"`, `source: "risk-accept"` (or the exact equivalent value the implementation defines), and a `revisitCondition` describing the real C3 condition ("prStatus=merged with testPlan.passing < totalTests") — not a generic placeholder string

### registersC1VsOptionCAsRealDeferredItemRecord

- **Verifies:** AC3
- **Components involved:** Record-registration function, `workspace/incidents.json`
- **Precondition:** Temp `incidents.json`; the real logged contradiction text available as input
- **Action:** Register the C1-vs-Option-C contradiction as a deferred-item record
- **Expected result:** A record exists with `type: "deferred-item"`, `source: "backlog-thread"` (or exact equivalent), and `revisitCondition` text matching the real logged deferral ("deferred to a broader `product/` refresh later") — exact substring match, not a paraphrase

### bothSeededRecordsFoundAndCorrectlyTyped

- **Verifies:** AC4
- **Components involved:** Record-lookup function, `workspace/incidents.json`
- **Precondition:** Both prior tests' records exist in the temp file
- **Action:** Run the direct existence/typing check
- **Expected result:** Both records are found; both report `type: "deferred-item"` (not `"incident"`); check fails loudly (non-zero exit / thrown assertion) if either is missing or mistyped

---

## NFR Tests

### noCredentialOrTokenShapedContentInRecordFields

- **NFR addressed:** Security (MC-SEC-02)
- **Measurement method:** Scan every string field of both seeded records (and the schema's defaulting test fixtures) against a credential-shaped-string pattern (API-key/token/bearer patterns)
- **Pass threshold:** Zero matches
- **Tool:** Node test runner (`node scripts/run-all-tests.js`), plain regex assertion — no external secret-scanning tool needed for this bounded, known-content case

Performance and Accessibility: Not applicable, per the story's own NFR section — no test written for either. Audit: satisfied by the AC2/AC3/AC4 tests themselves (the seeded records *are* the audit trail); no separate NFR test required.

---

## Out of Scope for This Test Plan

- Fixing `tfhc-s1` itself, or resolving the C1-vs-Option-C contradiction — per the story's own Out of Scope
- Backfilling any other historical `decisions.md`/`capture-log.md` entry beyond the two seeded cases
- `ddft-s2`'s scan behaviour, `ddft-s3`'s telemetry enrichment, `ddft-s4`'s auto-registration hooks, and `ddft-s5`'s rendering — each has its own test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All four ACs are fully automatable against real file I/O | — |
