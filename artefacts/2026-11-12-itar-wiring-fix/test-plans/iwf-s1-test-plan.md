## Test Plan: Wire triage drafting to incident creation, so a created incident gets a triage summary

**Story reference:** artefacts/2026-11-12-itar-wiring-fix/stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-12

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `recordIncident` appends an incident, drafts its summary, persists both | 2 (UT1, UT2) | — | — | — | — | 🟢 |
| AC2 | The command records via `recordIncident`, prints id and summary, rejects bad input | 1 (UT6) | 3 (IT1, IT2, IT3) | — | — | — | 🟢 |
| AC3 | Only `incident` records are candidates; `deferred-item` never linked | 2 (UT3, UT4) | — | — | — | — | 🟢 |
| AC4 | A draft failure never loses the stored incident | 1 (UT5) | — | — | — | — | 🟢 |
| AC5 | Two real command runs link the second to the first, real file untouched | — | 1 (IT4) + 1 NFR (NFR-CORR1) | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. The one thing not tested, tuning the Jaccard threshold on real data, is declared out of scope in the story because no real incident data exists.

---

## Test Data Strategy

**Source:** Synthetic. Every test builds its own temporary file in `os.tmpdir()` and seeds it in setup. This is deliberate and different from dsrf-s1: here the behaviour under test is the creation path, so a temp file is the correct target. The real `workspace/incidents.json` is only ever hashed (NFR-CORR1), never written.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC3, AC4 | A temp file seeded with one `incident` record, one `deferred-item` record and one legacy record with no `type`, built with the real `createIncidentRecord` and `createDeferredItemRecord` | Generated in test setup | None | Overlapping tags are chosen so the filter in AC3 is what decides the outcome |
| AC2, AC5 | A temp file path passed to the real command with `--file` | Generated in test setup | None | The command is run as a child process (`node scripts/create-incident.js`) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All in `tests/check-iwf-s1-incident-recording.js`, using this repo's assert-based harness (picked up by the `tests/check-*.js` glob).

### UT1 — recordIncident stores the incident and drafts its summary

- **Verifies:** AC1
- **Precondition:** Temp file seeded with one earlier incident tagged `db, timeout`
- **Action:** `recordIncident({ trigger, summary, tags: ['db','timeout'] }, file)`
- **Expected result:** The file now holds the earlier record plus one new record with `type: 'incident'`; the returned record and the record read back from disk both have a non-null `triageSummary` and `priorIncidentLinks` containing the earlier incident's id
- **Edge case:** No

### UT2 — existing records are untouched

- **Verifies:** AC1
- **Precondition:** Same seeded file; snapshot every seeded record before the call
- **Action:** Call `recordIncident`
- **Expected result:** Each seeded record is deep-equal to its snapshot afterwards (including the `deferred-item` and the legacy record); the file length grew by exactly 1
- **Edge case:** Yes. Guards the append-only rule.

### UT3 — a deferred-item is never a prior incident

- **Verifies:** AC3
- **Precondition:** Seeded file whose only record is a `deferred-item` with tags identical to the new incident's
- **Action:** `recordIncident` with those tags
- **Expected result:** `priorIncidentLinks` is empty; `triageSummary` is the "No relevant prior incident" text and does not contain the deferred-item's id or text
- **Edge case:** Yes

### UT4 — a record with no type still counts as an incident

- **Verifies:** AC3
- **Precondition:** Seeded file whose only record has no `type` key (a pre-generalisation record) and overlapping tags
- **Action:** `recordIncident`
- **Expected result:** `priorIncidentLinks` contains that record's id
- **Edge case:** Yes. Backward compatibility with itar-s1 data.

### UT5 — a draft failure keeps the incident and reports the error

- **Verifies:** AC4
- **Precondition:** `recordIncident` called with its optional `draft` option set to a function that throws `new Error('boom')`. The option defaults to the real `draftTriageSummary`, so this is a test seam, not a stub default.
- **Action:** Call `recordIncident`
- **Expected result:** The call rejects or throws with a message containing `boom`; the file on disk still contains the new record with its trigger, summary and tags intact and `triageSummary: null`
- **Edge case:** Yes

### UT6 — the default target is the real data file

- **Verifies:** AC2
- **Precondition:** None
- **Action:** Read the module's exported `DEFAULT_INCIDENTS_FILE`
- **Expected result:** It resolves to `<repo>/workspace/incidents.json`. This only reads a constant; nothing is written.
- **Edge case:** No

---

## Integration Tests

### IT1 — the command records an incident and prints id and summary

- **Verifies:** AC2
- **Components involved:** `scripts/create-incident.js` (real child process), `src/modules/incident-recorder.js`, `incident-store.js`, `triage-drafter.js`
- **Precondition:** Seeded temp file
- **Action:** `node scripts/create-incident.js --trigger "t" --summary "s" --tags db,timeout --file <tmp>`
- **Expected result:** Exit 0; stdout contains the new record's id (read back from the file) and its triage summary text; the file holds the new record

### IT2 — missing required input is rejected without writing

- **Verifies:** AC2
- **Precondition:** A temp file path that does not exist yet
- **Action:** Run the command with no `--trigger`
- **Expected result:** Non-zero exit; stderr names the missing option; the temp file was not created
- **Edge case:** Yes

### IT3 — over-long tags are rejected without writing

- **Verifies:** AC2
- **Precondition:** Seeded temp file; snapshot its bytes
- **Action:** Run the command with a `--tags` list whose joined length exceeds `MAX_TAG_FIELD_LENGTH`
- **Expected result:** Non-zero exit; stderr mentions the tag length limit; the file bytes are unchanged
- **Edge case:** Yes

### IT4 — two real runs link the second incident to the first

- **Verifies:** AC5
- **Precondition:** A temp file path that does not exist yet
- **Action:** Run the command twice with overlapping tags (`db,timeout` then `db,timeout,retry`)
- **Expected result:** The file holds two records; the second record's `priorIncidentLinks` equals `[<first id>]` and its `triageSummary` contains the first id
- **Edge case:** No. This is the end-to-end proof that the entry point is wired, since a command that does not call the drafter cannot pass it.

---

## NFR Tests

### NFR-CORR1 — the real data file is never written by the tests

- **NFR addressed:** Security and correctness
- **Measurement method:** SHA-256 and mtime of `workspace/incidents.json` taken at the start and end of the whole test run
- **Pass threshold:** Both unchanged
- **Tool:** Same assert-based harness

Performance: None — a read-modify-write of a small JSON file, confirmed.

---

## Out of Scope for This Test Plan

- Whether the `INCIDENT_JACCARD_THRESHOLD` value of 0.3 is right. No real incident data exists to test against.
- The quality or usefulness of the summary wording.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Concurrent runs of the command could interleave their read-modify-write on the same file | `appendIncidentRecord` and `saveIncidentRecords` already share this single-writer assumption | Accepted: one engineer at a terminal. Matches the existing risk profile of every `workspace/` log. |
