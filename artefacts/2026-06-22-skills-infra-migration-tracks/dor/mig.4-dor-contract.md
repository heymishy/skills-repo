# DoR Contract: mig.4 — Extend chain-hash trace to emit on migration-review sign-off

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`_writeTrace` extended (not replaced) to fire a trace record on migration-review sign-off. Record: artefact path + SHA-256 hash from `fs.readFileSync` (disk content). No SQL content. Zero migration entries when `hasMigrationTrack` absent or false. `/trace` SKILL.md updated.

## What will NOT be built

Infra-plan trace extension (inf.5). Retroactive emission. Schema or pipeline-state.json changes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock sign-off; assert trace record has migrationReviewPath + SHA-256 | Unit |
| AC2 | Feature with code + migration sign-off; assert both appear in trace | Integration |
| AC3 | No hasMigrationTrack; assert zero migration trace records; existing unchanged | Unit |

## Assumptions

SHA-256 via `crypto` + `fs.readFileSync`. Same `_writeTrace` pattern as inf.5.

## Estimated touch points

Files: trace module in `src/` (same file as inf.5), `.github/skills/trace/SKILL.md`
Services: None
APIs: None

## schemaDepends

[hasMigrationTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)
