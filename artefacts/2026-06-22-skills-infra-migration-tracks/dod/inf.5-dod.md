# Definition of Done: Extend chain-hash trace to emit on infra-plan sign-off

**PR:** https://github.com/heymishy/skills-repo/pull/405 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.5-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.5-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — When an infra-plan sign-off event fires, a trace record is emitted containing the infra-plan artefact path and a SHA-256 hash computed from artefact content on disk (ougl disk-canonicity rule) | ✅ | Tests `trace-module-registers-infra-plan-event`, `trace-emits-artefact-path-on-infra-plan-sign-off`, and `trace-emits-sha256-hash-from-disk-content` pass; `src/web-ui/routes/journey.js` confirmed to use `crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')` for hash computation | Automated test (8/8 passing) | None |
| AC2 — For a feature with both a code story DoR gate-confirm and an infra-plan sign-off, `/trace` output includes both entries; neither is absent | ✅ | Tests `trace-output-includes-infra-plan-entry-alongside-dor` and `trace-infra-plan-entry-has-correct-event-type` pass; infra-plan trace entry has distinct event type `infra-plan-sign-off` | Automated test | None |
| AC3 — For features with `hasInfraTrack` absent or false, no infra trace entries appear and existing code story trace events are unchanged | ✅ | Tests `trace-no-infra-entries-when-hasInfraTrack-false` and `trace-no-infra-entries-when-hasInfraTrack-absent` pass; zero regression on existing trace behaviour | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| trace-module-registers-infra-plan-event | ✅ | ✅ | infra-plan event hook found in src/web-ui/routes/journey.js |
| trace-emits-artefact-path-on-infra-plan-sign-off | ✅ | ✅ | |
| trace-emits-sha256-hash-from-disk-content | ✅ | ✅ | fs.readFileSync confirmed for hash computation |
| trace-output-includes-infra-plan-entry-alongside-dor | ✅ | ✅ | |
| trace-infra-plan-entry-has-correct-event-type | ✅ | ✅ | Event type: infra-plan-sign-off |
| trace-no-infra-entries-when-hasInfraTrack-false | ✅ | ✅ | |
| trace-no-infra-entries-when-hasInfraTrack-absent | ✅ | ✅ | Regression guard — existing events intact |
| trace-record-contains-no-artefact-content (NFR) | ✅ | ✅ | Trace record stores path + hash only; no raw artefact text |

**Test gaps:** None. Trace extension is source code, not SKILL.md instruction text — all behaviour is unit-testable without runtime AI.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — trace record stores artefact path and SHA-256 hash only; never artefact content | ✅ | NFR test `trace-record-contains-no-artefact-content` passes; trace record structure confirmed to contain only path and hash fields — no raw artefact text, no infra plan content |
| Audit — SHA-256 computed from disk content (not in-memory), consistent with ougl disk-canonicity rule | ✅ | Test `trace-emits-sha256-hash-from-disk-content` confirms `fs.readFileSync` pattern used for hash computation |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| MM1 — Trace completeness for new artefact types (infra-plan sign-offs appear in /trace audit chain) | on-track | inf.5 trace extension implemented and verified by automated tests (8/8 passing). Hash computed from disk per ougl disk-canonicity rule. No real infra-plan sign-off has been recorded yet — minimum signal requires first real feature using the infra track. | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 3/3
Scope deviations: None
Test gaps: None
