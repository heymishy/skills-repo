# Test Plan Template

## Test Plan: Incident record mechanism

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Test plan author:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Record captures id, trigger, bounded tags/summary, empty priorIncidentLinks, status `open` | 4 tests | — | — | — | — | 🟢 |
| AC2 | Create function appends to `workspace/incidents.json` without truncating | — | 2 tests | — | — | — | 🟢 |
| AC3 | Tags normalized (trimmed, lowercased) at capture time, not assumed inside `_jaccard` | 1 test | — | — | — | — | 🟢 |
| AC4 | Real `productionErrorInvestigation` (`tenant_admin_bootstrap_failed`) migrated as first real, non-synthetic test case | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|----------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Mixed — Synthetic for AC1–AC3; a real-content fixture for AC4
**PCI/sensitivity in scope:** No — no PANs, CVVs, or account numbers. Incident trigger/summary text is operational (e.g. auth/SQL error descriptions), not customer financial data.
**Availability:** Available now
**Owner:** Self-contained — tests generate their own synthetic fixtures; AC4's real fixture is derived directly from `workspace/capture-log.md`'s existing 2026-10-07 `productionErrorInvestigation` entry (the `[auth] tenant_admin_bootstrap_failed` / "inconsistent types deduced for parameter $1" / tenantId `heymishy` finding), transcribed once into the test file as a literal fixture object — no live read of `capture-log.md` at test time.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A minimal incident-creation input (trigger text, tag list) | Synthetic | None | Include one case at the bounded-length limit and one over it |
| AC2 | An existing `workspace/incidents.json` with ≥1 prior record, in a temp/fixture file path, not the real file | Synthetic (seeded fixture file) | None | Never write to the real `workspace/incidents.json` from a test run |
| AC3 | Tag values with leading/trailing whitespace and mixed case (e.g. `" Auth "`, `"SQL-Error"`) | Synthetic | None | — |
| AC4 | The real `tenant_admin_bootstrap_failed` finding's trigger/summary text, transcribed from `capture-log.md` | De-identified real operational text (not customer/PII data) | None — tenantId `heymishy` is this repo's own dogfooded tenant, not a third party | Proves the mechanism against real content, per AC4's own explicit intent |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is available now.

---

## Unit Tests

### createIncidentRecord_generatesUniqueId_whenCalled
- **Verifies:** AC1
- **Precondition:** None
- **Action:** Call `createIncidentRecord({ trigger: 'login attempt', tags: ['auth'] })` twice
- **Expected result:** Each call returns a record with a non-empty `id` field; the two ids are different from each other
- **Edge case:** No

### createIncidentRecord_setsStatusOpenAndEmptyPriorLinks_byDefault
- **Verifies:** AC1
- **Precondition:** None
- **Action:** Call `createIncidentRecord({ trigger: 'login attempt', tags: ['auth'] })`
- **Expected result:** Returned record has `status === 'open'` and `priorIncidentLinks` is an array of length 0
- **Edge case:** No

### createIncidentRecord_capturesTriggerFreeText_verbatim
- **Verifies:** AC1
- **Precondition:** None
- **Action:** Call `createIncidentRecord({ trigger: 'SQL type-inference error on tenant bootstrap', tags: ['auth'] })`
- **Expected result:** Returned record's `trigger` field equals the input string exactly (free text, no truncation)
- **Edge case:** No

### createIncidentRecord_rejectsTagsOverBoundedLength_whenSummaryExceedsLimit
- **Verifies:** AC1
- **Precondition:** The bounded length limit is a named, exported constant (e.g. `MAX_TAG_FIELD_LENGTH`), not a hardcoded literal in the test
- **Action:** Call `createIncidentRecord` with a `tags` value one character longer than `MAX_TAG_FIELD_LENGTH`
- **Expected result:** The call throws a specific, named error (e.g. `IncidentTagFieldTooLongError`) rather than silently truncating or accepting an unbounded field
- **Edge case:** Yes — tests the "bounded length" language in AC1 directly, which otherwise has no enforcement test

### normalizeIncidentTags_trimsWhitespaceAndLowercases_beforeStorage
- **Verifies:** AC3
- **Precondition:** None
- **Action:** Call `createIncidentRecord({ trigger: 'x', tags: [' Auth ', 'SQL-Error'] })`
- **Expected result:** Returned record's `tags` equals `['auth', 'sql-error']` — normalization happened at capture time, not deferred to the matching function
- **Edge case:** No

---

## Integration Tests

### appendIncidentRecord_addsToFile_withoutTruncatingExistingRecords
- **Verifies:** AC2
- **Components involved:** `scripts/lib/incident-store.js`, a fixture `workspace/incidents.json` file (temp path, not the real file)
- **Precondition:** Fixture file seeded with 1 existing record
- **Action:** Call the store's append/create function with a new record
- **Expected result:** The fixture file now contains 2 records; the original record's fields are byte-for-byte unchanged
- **Edge case:** No

### appendIncidentRecord_createsFile_whenIncidentsJsonDoesNotExistYet
- **Verifies:** AC2
- **Components involved:** `scripts/lib/incident-store.js`, filesystem (temp path)
- **Precondition:** No `incidents.json` exists at the fixture path
- **Action:** Call the append/create function
- **Expected result:** The file is created containing exactly 1 record — the one just created; no error thrown for a missing file on first write
- **Edge case:** Yes — first-ever-record case, distinct from the steady-state append case

### migrateProductionErrorInvestigation_createsRealRecord_fromCaptureLogFinding
- **Verifies:** AC4
- **Components involved:** `scripts/lib/incident-store.js`, the real `productionErrorInvestigation` fixture (transcribed from `capture-log.md`, 2026-10-07 entry)
- **Precondition:** Fixture object: `{ trigger: "[auth] tenant_admin_bootstrap_failed -- reason: 'inconsistent types deduced for parameter $1' for tenantId heymishy", tags: ['auth', 'tenant-admin-bootstrap', 'sql-type-inference'] }`
- **Action:** Call `createIncidentRecord` with this real fixture and append it via the store
- **Expected result:** A record is created and persisted with `status: 'open'`, normalized tags `['auth', 'tenant-admin-bootstrap', 'sql-type-inference']`, and the full real trigger text preserved — this is the concrete non-synthetic proof case AC4 requires
- **Edge case:** No

---

## NFR Tests

### NFR-AUDIT-1: createdAt and updatedAt timestamps set on creation
- **NFR addressed:** Audit
- **Measurement method:** Unit assertion on returned record's `createdAt`/`updatedAt` fields
- **Pass threshold:** Both fields are present, ISO 8601 formatted, and equal to each other at creation time
- **Tool:** `node scripts/run-all-tests.js` (project's configured test runner)

**Security (MC-SEC-02) — no automated NFR test written.** The story's Security NFR ("incident summaries must avoid including raw credentials or tokens") is a human-authoring guideline, not a functional AC — no AC in this story defines a programmatic secret-detection or redaction behavior to assert against. Writing a test here would assert behavior the story never specifies. Noted in Test Gaps and Risks below rather than fabricated as a test.

**Performance — not applicable, confirmed with story owner.** The story's own NFR section states this explicitly ("a small, infrequent, append-only file write"). No test written.

**Accessibility — not applicable, confirmed with story owner.** No UI in this story. No test written.

---

## Out of Scope for This Test Plan

- Automated alert-to-record creation (initiative 2's future integration point) — story itself is Out of Scope for this.
- Any UI for creating a record — story itself is Out of Scope for this; itar-s3 only renders existing records.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated secret/credential scanning on `trigger`/`summary` text | MC-SEC-02 is stated as a human-authoring guideline in the story's NFR section; no AC defines a programmatic check | Verification script includes a manual reminder step; flagged as a candidate follow-up AC if this ever becomes a real incident (an incident record itself accidentally containing a token) |
