# DoR Contract: inf.1 — Write `infra-definition` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`.github/skills/infra-definition/SKILL.md` — new file with five mandatory artefact sections (change description, blast-radius statement, rollback plan with discrete steps + time estimate, tier applicability table with 4 tiers + validation-status column, plan/preview attachment with credentials warning). Tool-agnostic instruction text. ops/ prefix accepted as valid feature slug. Output path documented as `artefacts/[feature]/infra/[story-id]-infra-def.md`.

## What will NOT be built

infra-review checklist. Execution of infra changes. Automatic change detection.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | SKILL.md exists; 5 section headings present; output path documented | Unit |
| AC2 | All four tier names + validation-status column in tier table | Unit |
| AC3 | Discrete rollback steps + time estimate in rollback section | Unit |
| AC4 | ops/ prefix documented as valid | Unit |
| AC5 | grep for tool names in required-step contexts → 0 matches | Unit |

## Assumptions

All ACs are SKILL.md content assertions. No programmatic execution.

## Estimated touch points

Files: `.github/skills/infra-definition/SKILL.md` (new)
Services: None
APIs: None

## schemaDepends

None.
