# DoR Contract: inf.2 — Write `infra-review` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`.github/skills/infra-review/SKILL.md` with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale; explicit acknowledgement requirement for DESTRUCTIVE; tier-coherence check (prod-before-CI → ADVISORY); secret pattern check (password=, token=, secret= → REVERSIBLE-HIGH); PASS condition on zero unacknowledged findings; output path `artefacts/[feature]/infra/[story-id]-infra-review.md`.

## What will NOT be built

infra-plan skill. Automated blast-radius calculation. Code review items.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | DESTRUCTIVE severity + explicit ack requirement + unacknowledged blocks sign-off | Unit |
| AC2 | Tier-coherence check + ADVISORY severity for prod-before-CI | Unit |
| AC3 | Secret pattern check + REVERSIBLE-HIGH severity | Unit |
| AC4 | PASS condition + output path documented | Unit |
| AC5 | Unacknowledged DESTRUCTIVE blocks sign-off (explicit block language) | Unit |

## Assumptions

All ACs are SKILL.md content assertions. Infra severity scale (DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY) is distinct from code review severity (HIGH/MEDIUM/LOW).

## Estimated touch points

Files: `.github/skills/infra-review/SKILL.md` (new)
Services: None
APIs: None

## schemaDepends

[] — inf.1 is a SKILL.md dependency, not a schema field dependency.
