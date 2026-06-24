# DoR Contract: mig.1 — Write `schema-migration-plan` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

New `.github/skills/schema-migration-plan/SKILL.md`. When invoked, it produces `artefacts/[feature]/migrations/[story-id]-migration-plan.md` with 5 mandatory sections: classification (additive-only / breaking), forward migration, rollback migration (mandatory for all classifications), tier applicability (4 tiers: local, ci, staging, production + validation-status column), staging snapshot privacy (non-blank; references staging-data-policy.md). Breaking + blank rollback → operator must be prompted. No hardcoded tool names.

## What will NOT be built

Migration execution tooling. Auto SQL diff detection. Concurrency guidance. Any src/ changes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | SKILL.md text contains all 5 section headers | Unit |
| AC2 | Instruction specifies breaking+blank-rollback → prompt | Unit |
| AC3 | Instruction specifies rollback mandatory for additive-only | Unit |
| AC4 | Instruction covers 4 tiers with validation-status column | Unit |
| AC5 | Instruction requires non-blank staging privacy referencing template | Unit |

## Assumptions

Tests check SKILL.md text content. `staging-data-policy.md` template exists (mig.5 signed off and in delivery queue).

## Estimated touch points

Files: `.github/skills/schema-migration-plan/SKILL.md` (new)
Services: None
APIs: None

## schemaDepends

[hasMigrationTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)
