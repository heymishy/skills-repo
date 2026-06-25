# Definition of Done: Write `staging-data-policy` template with three named options and declared-choice field

**PR:** https://github.com/heymishy/skills-repo/pull/403 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.5.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.5-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/mig.5-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Template contains exactly three named options: (a) synthetic generated data, (b) anonymised snapshot via named tool/process, (c) non-PII production subset | ✅ | Tests `staging-data-policy-template-file-exists`, `template-contains-synthetic-generated-data-option`, `template-contains-anonymised-snapshot-option`, and `template-contains-non-pii-production-subset-option` pass | Automated test (9/9 passing) | None |
| AC2 — `Declared choice` field present; instructions prohibit leaving it blank or marking "TBD" | ✅ | Tests `template-contains-declared-choice-field` and `declared-choice-instructions-prohibit-tbd` pass | Automated test | None |
| AC3 — A completed template reference satisfies the mandatory staging-snapshot-privacy field check in `schema-migration-review` | ✅ | Test `template-references-migration-review-check` passes; template contains language stating completed declaration satisfies the mandatory field check | Automated test | None |
| AC4 — A free-form tool/process description field accepts text describing the specific implementation (e.g. "anonymised snapshot via pg_dump + scrub script at scripts/anonymise.sh") | ✅ | Test `template-contains-tool-process-free-form-field` passes | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| staging-data-policy-template-file-exists | ✅ | ✅ | |
| template-contains-synthetic-generated-data-option | ✅ | ✅ | |
| template-contains-anonymised-snapshot-option | ✅ | ✅ | |
| template-contains-non-pii-production-subset-option | ✅ | ✅ | |
| template-contains-declared-choice-field | ✅ | ✅ | |
| declared-choice-instructions-prohibit-tbd | ✅ | ✅ | |
| template-references-migration-review-check | ✅ | ✅ | |
| template-contains-tool-process-free-form-field | ✅ | ✅ | |
| template-warns-against-credentials-in-tool-field (NFR) | ✅ | ✅ | Warning against production credentials in tool field |

**Test gaps:** None. Deliverable is a template file — all checks are content assertions testable without runtime AI.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — template warns against committing production credentials or connection strings in the tool/process field | ✅ | NFR test `template-warns-against-credentials-in-tool-field` passes; credentials/connection-string warning confirmed in template near the tool/process field |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| T3-M1 — Breaking migration rollback coverage (100% of breaking migrations with CI-tier rollback execution evidence before production sign-off) | not-yet-measured | `staging-data-policy.md` template eliminates the "see operator judgement" gap for staging privacy declarations in migration plans. Template is delivered and verified by test suite. No real migration-plan artefacts have referenced this template yet — measurement requires real feature usage. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 4/4
Scope deviations: None
Test gaps: None
