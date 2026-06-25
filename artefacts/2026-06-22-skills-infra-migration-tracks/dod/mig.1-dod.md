# Definition of Done: Write `schema-migration-plan` SKILL.md with additive/breaking classification and mandatory forward+rollback pair

**PR:** https://github.com/heymishy/skills-repo/pull/407 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.1.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.1-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/mig.1-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — SKILL.md exists and produces a migration-plan artefact at `artefacts/[feature]/migrations/[story-id]-migration-plan.md` with all five mandatory sections: classification, forward migration, rollback migration, tier applicability, staging snapshot privacy declaration | ✅ | Tests `migration-plan-skill-file-exists`, `skill-specifies-output-path-convention`, and `skill-artefact-contains-five-mandatory-sections` pass | Automated test (13/13 passing) | None |
| AC2 — Breaking classification requires non-blank rollback migration field; breaking change definition is named (rename, remove, type change, NOT NULL without default) | ✅ | Tests `skill-breaking-classification-requires-rollback` and `skill-breaking-definition-named` pass | Automated test | None |
| AC3 — Additive-only classification still requires a non-blank rollback migration field; additive change definition is named (add nullable column, add table with safe defaults, add index) | ✅ | Tests `skill-additive-classification-still-requires-rollback` and `skill-additive-definition-named` pass | Automated test | None |
| AC4 — Tier-applicability section covers all four tiers (local, ci, staging, production) with a validation-status column | ✅ | Tests `skill-tier-applicability-covers-four-tiers` and `skill-tier-applicability-has-validation-status-column` pass | Automated test | None |
| AC5 — When staging tier is in scope, the staging-snapshot-privacy section must be non-blank and must reference a completed `staging-data-policy.md` approach | ✅ | Tests `skill-staging-scope-requires-privacy-declaration` and `skill-references-staging-data-policy-template` pass; SKILL.md references `.github/templates/staging-data-policy.md` | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| migration-plan-skill-file-exists | ✅ | ✅ | |
| skill-specifies-output-path-convention | ✅ | ✅ | |
| skill-artefact-contains-five-mandatory-sections | ✅ | ✅ | |
| skill-breaking-classification-requires-rollback | ✅ | ✅ | |
| skill-breaking-definition-named | ✅ | ✅ | |
| skill-additive-classification-still-requires-rollback | ✅ | ✅ | |
| skill-additive-definition-named | ✅ | ✅ | |
| skill-tier-applicability-covers-four-tiers | ✅ | ✅ | |
| skill-tier-applicability-has-validation-status-column | ✅ | ✅ | |
| skill-staging-scope-requires-privacy-declaration | ✅ | ✅ | |
| skill-references-staging-data-policy-template | ✅ | ✅ | References .github/templates/staging-data-policy.md |
| skill-no-hardcoded-database-tool-names | ✅ | ✅ | ADR-004 compliance — zero required-tool CLI references |
| skill-warns-against-credentials-in-migration-fields (NFR) | ✅ | ✅ | Credentials warning present in SKILL.md |

**Test gaps:** 1 — AI instruction-text runtime verification. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — skill instructions warn against pasting production credentials or connection strings into migration command fields | ✅ | NFR test `skill-warns-against-credentials-in-migration-fields` passes; credentials/connection-string warning confirmed in SKILL.md |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| T3-M1 — Breaking migration rollback coverage (100% of breaking migrations with CI-tier rollback execution evidence before production sign-off) | not-yet-measured | `schema-migration-plan` SKILL.md mandates non-blank rollback field for all classifications (tests verify). No real migration-plan artefacts have been produced yet — measurement requires real breaking migrations going through the track. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
