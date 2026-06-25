# Definition of Done: Write `infra-definition` SKILL.md

**PR:** https://github.com/heymishy/skills-repo/pull/400 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.1-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.1-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — SKILL.md exists and contains all five mandatory sections: change description, blast-radius, tier applicability, rollback plan, and plan/preview attachment | ✅ | Tests `infra-definition-skill-file-exists`, `skill-contains-change-description-section`, `skill-contains-blast-radius-section`, `skill-contains-rollback-plan-section`, `skill-contains-tier-applicability-section`, `skill-contains-plan-preview-attachment-section` all pass | Automated test (15/15 passing) | None |
| AC2 — Tier-applicability table contains one row per deployment tier: local, ci, staging, production — each with a validated/not-validated status column | ✅ | Tests `tier-table-references-local-ci-staging-production` and `tier-table-has-validation-status-column` pass | Automated test | None |
| AC3 — Rollback plan section requires discrete numbered steps with estimated time-to-execute — not a free-text field | ✅ | Tests `rollback-plan-requires-discrete-steps-not-single-sentence` and `rollback-plan-requires-time-to-execute` pass | Automated test | None |
| AC4 — Skill accepts `ops/` feature slug prefix and produces artefact at the correct `artefacts/ops/[slug]/infra/` path | ✅ | Test `skill-accepts-ops-prefix-in-path-guidance` passes; path guidance uses generic `[feature]` placeholder that includes `ops/` forms | Automated test | None |
| AC5 — No hardcoded IaC tool names (Terraform, Pulumi, CDK, Ansible, CloudFormation) appear as required instructions; any tool mention is in illustrative example list context only | ✅ | Tests `skill-no-terraform-in-required-context` and `skill-no-pulumi-cdk-ansible-in-required-context` pass; zero required-tool CLI references found | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 15 / 15
**Tests passing in CI:** 15 / 15

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| infra-definition-skill-file-exists | ✅ | ✅ | |
| skill-contains-change-description-section | ✅ | ✅ | |
| skill-contains-blast-radius-section | ✅ | ✅ | |
| skill-contains-rollback-plan-section | ✅ | ✅ | |
| skill-contains-tier-applicability-section | ✅ | ✅ | |
| skill-contains-plan-preview-attachment-section | ✅ | ✅ | |
| tier-table-references-local-ci-staging-production | ✅ | ✅ | |
| tier-table-has-validation-status-column | ✅ | ✅ | |
| rollback-plan-requires-discrete-steps-not-single-sentence | ✅ | ✅ | |
| rollback-plan-requires-time-to-execute | ✅ | ✅ | |
| skill-accepts-ops-prefix-in-path-guidance | ✅ | ✅ | |
| skill-no-terraform-in-required-context | ✅ | ✅ | |
| skill-no-pulumi-cdk-ansible-in-required-context | ✅ | ✅ | |
| skill-contains-credentials-warning | ✅ | ✅ | |
| skill-warns-against-credentials-in-attachment (NFR) | ✅ | ✅ | Warning present near plan/preview attachment section |

**Test gaps:** 1 — AI instruction-text runtime verification. Tests confirm required instruction text is present in SKILL.md; they cannot verify AI model output without a live session. Accepted by design — text-level verification is the established pattern for SKILL.md stories in this pipeline.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — no credentials in plan/preview attachment field | ✅ | NFR test `skill-warns-against-credentials-in-attachment` passes; explicit credentials/secrets/tokens warning found near the plan/preview attachment section in SKILL.md |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M1 — Infra track completion time (under 30 minutes end-to-end) | not-yet-measured | `infra-definition` skill delivered and verified by test suite. Measurement requires self-reported elapsed time from 3 real operator sessions using the full infra track. No real sessions have run yet. | null |
| T3-M2 — Blast-radius declaration coverage (100% of infra-definition artefacts with populated tier-applicability section) | not-yet-measured | `infra-definition` SKILL.md mandates the tier-applicability section (tests verify instruction presence). No real infra-definition artefacts have been produced yet — measurement requires real feature usage. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design; text-level verification standard for SKILL.md stories)
