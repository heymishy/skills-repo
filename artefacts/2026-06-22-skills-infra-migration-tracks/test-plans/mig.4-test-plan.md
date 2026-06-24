## Test Plan: mig.4 — Extend chain-hash trace to emit on migration-review sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-mig4-trace-extension.js`
**Test runner:** `node tests/check-mig4-trace-extension.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Migration-review sign-off emits trace record with path and SHA-256 hash | 3 tests | — | — | — | — | 🟢 |
| AC2 | `/trace` includes migration-review entry alongside code story DoR artefact | 2 tests | — | — | — | — | 🟢 |
| AC3 | No migration trace entries when `hasMigrationTrack` false/absent; existing events unchanged | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests inspect source modules (`src/journey.js`, `src/enforcement/gate-map.js`) for migration-review trace hook; tests exercise trace logic with stub artefact files
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Stub migration-review artefact file on disk; sign-off event trigger | Synthetic + temp file | None | SHA-256 from disk; no SQL content in record |
| AC2 | Feature with both code DoR and migration-review events | Synthetic | None | |
| AC3 | Feature with `hasMigrationTrack: false` or absent | Synthetic | None | |

---

## Unit Tests

### trace-module-registers-migration-review-event
- **Verifies:** AC1
- **Action:** Read `src/journey.js` (or equivalent trace module); assert it contains a handler or hook for a migration-review sign-off event — look for `migration-review`, `migrationReview`, or `migration_review` identifiers
- **Expected result:** Migration-review event registration found in trace module
- **Edge case:** No

### trace-emits-artefact-path-on-migration-review-sign-off
- **Verifies:** AC1
- **Action:** Assert the trace record written on migration-review sign-off includes the `migrationReviewPath` value (or equivalent artefact path field)
- **Expected result:** Artefact path present in emitted trace record
- **Edge case:** No

### trace-emits-sha256-hash-from-disk-content
- **Verifies:** AC1, Audit NFR
- **Action:** Assert the trace module computes the SHA-256 hash by reading the artefact file from disk (`fs.readFileSync` or equivalent) — not from an in-memory string; inspect source for hash computation pattern
- **Expected result:** Hash computed from disk read, not in-memory content
- **Edge case:** No

### trace-output-includes-migration-review-entry-alongside-dor
- **Verifies:** AC2
- **Action:** Run trace logic (or read trace output format) for a synthetic feature with both code DoR and migration-review events; assert both entries appear in the trace output
- **Expected result:** Both entries present; neither absent
- **Edge case:** No

### trace-migration-review-entry-has-correct-event-type
- **Verifies:** AC2
- **Action:** Assert the migration-review trace entry has a distinct event type (e.g. `migration-review-sign-off`) different from the code DoR entry type
- **Expected result:** Distinct event type in migration-review entry
- **Edge case:** No

### trace-no-migration-entries-when-hasMigrationTrack-false
- **Verifies:** AC3
- **Action:** Run trace logic for a feature with `hasMigrationTrack: false`; assert no migration-review trace entry appears
- **Expected result:** Zero migration-review entries in trace output
- **Edge case:** No

### trace-no-migration-entries-when-hasMigrationTrack-absent
- **Verifies:** AC3
- **Action:** Run trace logic for a feature with no `hasMigrationTrack` field; assert existing code story trace events are present and unmodified; assert no migration-review entry appears
- **Expected result:** Existing trace events intact; no migration-review entry — zero regression
- **Edge case:** No

---

## Integration Tests

None — trace logic is in source modules; unit tests cover module-level behaviour.

---

## NFR Tests

### trace-record-contains-no-migration-sql-content
- **NFR addressed:** Security — trace record must store path and hash only; no migration SQL, no forward/rollback commands in the trace record
- **Measurement method:** Inspect the trace record structure written to disk; confirm no field contains raw SQL or migration command text — only path and hash fields
- **Pass threshold:** Zero raw SQL/command fields in trace record
- **Tool:** String assertion on written trace record

---

## Out of Scope for This Test Plan

- Infra trace extension — tested in inf.5
- Retroactive backfill of pre-existing migration-review artefacts — out of scope per story
- `/trace` SKILL.md content checks — covered by trace skill's own test suite

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
