## Story: Extend pipeline-state schema and harness for infra and migration track flags

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/shared-infrastructure.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want `hasInfraTrack`, `hasMigrationTrack`, `infraPlanPath`, and `migrationReviewPath` to be recognised fields on story entries in `pipeline-state.json`,
So that the DoR hard-blocks (H-INF, H-MIG) and the trace extension can read these fields without validation errors, and `node bin/skills advance` can write them without rejection.

## Benefit Linkage

**Metric moved:** M2 — DoR gate enforcement correctness
**How:** H-INF and H-MIG read `hasInfraTrack` and `hasMigrationTrack` from pipeline-state.json; without schema recognition those fields fail integrity checks, making the gates inoperable.

## Architecture Constraints

- ADR-003 (schema-first): `hasInfraTrack`, `hasMigrationTrack`, `infraPlanPath`, `migrationReviewPath` must be added to `pipeline-state.schema.json` in the same commit as adding harness support — schema and implementation must not diverge
- MC-CORRECT-02: fields written to pipeline-state.json must exist in schema before any skill reads or writes them
- Script style guide: extension to `check-pipeline-state-integrity.js` must be plain Node.js, CommonJS (`require`), no external npm dependencies

## Dependencies

- **Upstream:** None — this is the first story; it creates the schema foundation both tracks depend on
- **Downstream:** inf.1, inf.2, inf.3, inf.4, inf.5, mig.1, mig.2, mig.3, mig.4 all depend on these schema fields existing

## Acceptance Criteria

**AC1:** Given a story entry in `pipeline-state.json` with `hasInfraTrack: true`, when `node scripts/check-pipeline-state-integrity.js` runs, then the script exits 0 without error.

**AC2:** Given a story entry with `hasMigrationTrack: true` and `migrationReviewPath: "artefacts/feat/migrations/s1-migration-review.md"`, when the integrity check runs, then both fields are accepted without error.

**AC3:** Given `node bin/skills advance "my-feature" "s1" hasInfraTrack=true infraPlanPath="artefacts/my-feature/infra/s1-infra-plan.md"`, when advance runs, then the fields are written correctly on the story entry in `pipeline-state.json` and a subsequent integrity check passes.

**AC4:** Given a story entry with `hasInfraTrack: false` (or absent), when the integrity check runs, then no error is produced — both fields are optional.

**AC5:** Given the four new fields are added to `pipeline-state.schema.json`, when the schema and the harness extension are committed, then they are in the same commit — schema and implementation do not diverge.

## Out of Scope

- The H-INF and H-MIG DoR hard-block logic — those are implemented in inf.4 and mig.3
- Any UI rendering of infra or migration track state in `pipeline-viz.html`
- Automatic setting of `hasInfraTrack` when an infra-definition artefact is detected — the flag is operator-set via `skills advance`

## NFRs

- **Performance:** `check-pipeline-state-integrity.js` must complete in under 5 seconds on a pipeline-state.json with 30 features
- **Security:** No credentials or artefact content in the new schema fields — paths only
- **Audit:** None additional beyond existing pipeline-state.json commit history

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
