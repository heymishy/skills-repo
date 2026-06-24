# DoR Contract: inf.3 — Write `infra-plan` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`.github/skills/infra-plan/SKILL.md` with entry condition (PASS infra-review required), block on unacknowledged DESTRUCTIVE with finding re-surfaced, artefact template (tier execution sequence, per-tier validation checkpoints, operator execution checklist), output path `artefacts/[feature]/infra/[story-id]-infra-plan.md`, status PASS field in produced artefact.

## What will NOT be built

Executing infra changes. Rollback plan derivation. H-INF gate logic.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | PASS infra-review entry condition documented; output path documented | Unit |
| AC2 | Tier execution sequence, per-tier checkpoints, operator checklist all present | Unit |
| AC3 | Unacknowledged DESTRUCTIVE blocks sign-off + finding re-surfaced | Unit |
| AC4 | Produced artefact contains status PASS field | Unit |

## Estimated touch points

Files: `.github/skills/infra-plan/SKILL.md` (new)
Services: None
APIs: None

## schemaDepends

[] — inf.2 is a SKILL.md dependency only.
