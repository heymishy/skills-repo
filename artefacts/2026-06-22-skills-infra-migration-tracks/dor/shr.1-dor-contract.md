# DoR Contract: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

Four new optional fields (`hasInfraTrack: boolean`, `hasMigrationTrack: boolean`, `infraPlanPath: string`, `migrationReviewPath: string`) added to the story entry definition in `pipeline-state.schema.json`. The `scripts/check-pipeline-state-integrity.js` validator extended to accept these fields without error when present, and to treat their absence as valid. The `bin/skills advance` command extended to accept these field names as valid write targets.

## What will NOT be built

H-INF and H-MIG DoR hard-block logic (that is inf.4 and mig.3). Any UI rendering of hasInfraTrack or hasMigrationTrack in pipeline-viz.html. Automatic setting of hasInfraTrack when an infra-definition artefact is detected.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Write story entry with hasInfraTrack: true to temp pipeline-state; run integrity check; assert exit 0 | Unit |
| AC2 | Write story entry with hasMigrationTrack: true + migrationReviewPath; assert exit 0 | Unit |
| AC3 | Run `skills advance` with all 4 fields; assert written correctly + integrity check passes | Integration |
| AC4 | Story entry without any of the 4 fields; integrity check exits 0 | Unit |
| AC5 | git log shows schema.json and integrity check in same commit | Unit |

## Assumptions

`pipeline-state.schema.json` uses JSON Schema and the story entry definition can be extended by adding to its `properties` block. Advance command handles string-to-boolean coercion for boolean fields.

## Estimated touch points

Files: `.github/pipeline-state.schema.json`, `scripts/check-pipeline-state-integrity.js`, `bin/skills`
Services: None
APIs: None

## schemaDepends

None — this story creates the schema foundation.
