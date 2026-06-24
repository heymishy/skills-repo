# DoR Contract: mig.2 — Write `schema-migration-review` SKILL.md

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`.github/skills/schema-migration-review/SKILL.md` with CI-tier rollback evidence requirement for breaking migrations (declaration sufficient for additive-only), staging-snapshot-privacy block (conditional on staging scope), coherence check (additive-only + DROP/ALTER → finding), PASS condition on zero unacknowledged findings, output path `artefacts/[feature]/migrations/[story-id]-migration-review.md`, mandatory credentials check, no hardcoded tool CLI commands.

## What will NOT be built

Executing migrations. Automated SQL parsing. H-MIG gate. mig.4 trace extension.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | CI rollback evidence required for breaking; formats described | Unit |
| AC2 | Declaration sufficient for additive-only; distinct from breaking | Unit |
| AC3 | Staging privacy block conditional on staging scope | Unit |
| AC4 | Coherence check: additive-only + DROP/ALTER → finding (not just warning) | Unit |
| AC5 | Zero findings → PASS + output path | Unit |

## Estimated touch points

Files: `.github/skills/schema-migration-review/SKILL.md` (new)
Services: None
APIs: None

## schemaDepends

[] — mig.1 is a SKILL.md dependency only.
