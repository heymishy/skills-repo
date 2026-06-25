# Definition of Done: Extend chain-hash trace to emit on migration-review sign-off

**PR:** https://github.com/heymishy/skills-repo/pull/408 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.4-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/mig.4-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — When a migration-review sign-off event fires, a trace record is emitted containing the migration-review artefact path and a SHA-256 hash computed from artefact content on disk (ougl disk-canonicity rule) | ✅ | Tests `trace-module-registers-migration-review-event`, `trace-emits-artefact-path-on-migration-review-sign-off`, and `trace-emits-sha256-hash-from-disk-content` pass; `src/web-ui/routes/journey.js` confirmed to use `crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')` for hash computation | Automated test (8/8 passing) | None |
| AC2 — For a feature with both a code story DoR gate-confirm and a migration-review sign-off, `/trace` output includes both entries; neither is absent; migration-review entry has distinct event type `migration-review-sign-off` | ✅ | Tests `trace-output-includes-migration-review-entry-alongside-dor` and `trace-migration-review-entry-has-correct-event-type` pass | Automated test | None |
| AC3 — For features with `hasMigrationTrack` absent or false, no migration trace entries appear and existing code story trace events are unchanged | ✅ | Tests `trace-no-migration-entries-when-hasMigrationTrack-false` and `trace-no-migration-entries-when-hasMigrationTrack-absent` pass; zero regression | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| trace-module-registers-migration-review-event | ✅ | ✅ | migration-review event hook found in src/web-ui/routes/journey.js |
| trace-emits-artefact-path-on-migration-review-sign-off | ✅ | ✅ | |
| trace-emits-sha256-hash-from-disk-content | ✅ | ✅ | fs.readFileSync confirmed |
| trace-output-includes-migration-review-entry-alongside-dor | ✅ | ✅ | |
| trace-migration-review-entry-has-correct-event-type | ✅ | ✅ | Event type: migration-review-sign-off |
| trace-no-migration-entries-when-hasMigrationTrack-false | ✅ | ✅ | |
| trace-no-migration-entries-when-hasMigrationTrack-absent | ✅ | ✅ | Regression guard — existing events intact |
| trace-record-contains-no-migration-sql-content (NFR) | ✅ | ✅ | Trace record stores path + hash only; no SQL or command text |

**Test gaps:** None. Trace extension is source code — all behaviour is unit-testable without runtime AI.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — trace record stores path and SHA-256 hash only; no migration SQL content, no forward/rollback commands | ✅ | NFR test `trace-record-contains-no-migration-sql-content` passes; trace record structure confirmed to contain only path and hash fields — no raw SQL or migration command text |
| Audit — SHA-256 computed from disk content (not in-memory), consistent with ougl disk-canonicity rule | ✅ | Test `trace-emits-sha256-hash-from-disk-content` confirms `fs.readFileSync` pattern used for hash computation |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| MM1 — Trace completeness for new artefact types (migration-review sign-offs appear in /trace audit chain) | on-track | mig.4 trace extension implemented and verified by automated tests (8/8 passing). Hash computed from disk per ougl disk-canonicity rule. No real migration-review sign-off has been recorded yet — minimum signal requires first real feature using the migration track. | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 3/3
Scope deviations: None
Test gaps: None
