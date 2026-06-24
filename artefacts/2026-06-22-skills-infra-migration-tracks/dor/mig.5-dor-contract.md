# DoR Contract: mig.5 — Write `staging-data-policy` template

**Approved:** 2026-06-25
**Operator:** Hamish King

---

## What will be built

`.github/templates/staging-data-policy.md` with three named options (synthetic generated data, anonymised snapshot, non-PII production subset), Declared choice field (TBD/blank prohibited), free-form tool/process field, explicit credentials warning, migration-review integration note.

## What will NOT be built

Prescribing which option to choose. Anonymisation tooling. mig.2 SKILL.md.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | All three option labels in template | Unit |
| AC2 | Declared choice field + TBD/blank prohibition | Unit |
| AC3 | Template references migration-review mandatory field check | Unit |
| AC4 | Free-form tool/process field present | Unit |

## Estimated touch points

Files: `.github/templates/staging-data-policy.md` (new)
Services: None
APIs: None

## schemaDepends

None.
