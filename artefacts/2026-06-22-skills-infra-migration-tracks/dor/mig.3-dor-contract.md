# DoR Contract: mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

H-MIG hard block added to `.github/skills/definition-of-ready/SKILL.md`. Triggers when `hasMigrationTrack: true`. Checks: `migrationReviewPath` set; artefact has PASS status; classification declared; forward + rollback both non-blank; breaking classification has CI rollback execution evidence. Finding text names the path and lists missing fields. H-MIG absent when `hasMigrationTrack` absent or false. All existing blocks (H1-H9, H-INF, etc.) unchanged.

## What will NOT be built

H-INF (inf.4). Auto `hasMigrationTrack` detection. Any src/, schema, or UI changes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | SKILL.md contains H-MIG block with hasMigrationTrack trigger | Unit |
| AC2 | Instruction specifies FAIL for absent/no-PASS migrationReviewPath | Unit |
| AC3 | Instruction specifies PASS condition (PASS + classification + rollback) | Unit |
| AC4 | Conditional trigger documented; H-MIG absent when flag false/absent | Unit |
| AC5 | Instruction specifies breaking → CI rollback evidence required | Unit |

## Assumptions

Tests check SKILL.md text. H-MIG follows H-INF format (inf.4 merged before mig.3 to avoid conflicts — scheduling concern only).

## Estimated touch points

Files: `.github/skills/definition-of-ready/SKILL.md`
Services: None
APIs: None

## schemaDepends

[hasMigrationTrack, migrationReviewPath] — BOTH present in `pipeline-state.schema.json` (shr.1 merged ✅)
