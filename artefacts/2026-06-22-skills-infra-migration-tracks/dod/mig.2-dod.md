# Definition of Done: Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation

**PR:** https://github.com/heymishy/skills-repo/pull/404 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.2.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.2-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/mig.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — For breaking migrations, review requires CI-tier rollback execution evidence (log snippet, test result, or operator attestation) before PASS can be issued | ✅ | Tests `migration-review-skill-file-exists`, `skill-requires-ci-rollback-evidence-for-breaking`, and `skill-defines-acceptable-rollback-evidence-formats` pass | Automated test (13/13 passing) | None |
| AC2 — For additive-only migrations, a declaration ("rollback command declared and reviewed — not yet executed") is sufficient rollback evidence; CI-tier execution is not required | ✅ | Tests `skill-accepts-declaration-for-additive-rollback` and `skill-distinguishes-evidence-requirements-by-classification` pass | Automated test | None |
| AC3 — When staging tier is in scope and the staging-snapshot-privacy field is blank or missing, the review cannot reach PASS | ✅ | Tests `skill-blocks-pass-on-blank-staging-privacy` and `skill-staging-privacy-check-tied-to-staging-scope` pass; check is conditional (skipped when staging is not in scope) | Automated test | None |
| AC4 — Classification coherence check flags additive-only artefacts containing `DROP COLUMN` or `ALTER COLUMN TYPE` statements as a finding | ✅ | Tests `skill-coherence-check-flags-breaking-in-additive` and `skill-coherence-check-produces-finding` pass; coherence mismatch produces a finding that must be resolved before review proceeds | Automated test | None |
| AC5 — Zero unresolved findings → PASS artefact saved at `artefacts/[feature]/migrations/[story-id]-migration-review.md` | ✅ | Tests `skill-specifies-pass-artefact-path` and `skill-pass-requires-zero-unresolved-findings` pass | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| migration-review-skill-file-exists | ✅ | ✅ | |
| skill-requires-ci-rollback-evidence-for-breaking | ✅ | ✅ | |
| skill-defines-acceptable-rollback-evidence-formats | ✅ | ✅ | log snippet / test result / operator attestation |
| skill-accepts-declaration-for-additive-rollback | ✅ | ✅ | |
| skill-distinguishes-evidence-requirements-by-classification | ✅ | ✅ | |
| skill-blocks-pass-on-blank-staging-privacy | ✅ | ✅ | |
| skill-staging-privacy-check-tied-to-staging-scope | ✅ | ✅ | Conditional — skipped when staging not in scope |
| skill-coherence-check-flags-breaking-in-additive | ✅ | ✅ | |
| skill-coherence-check-produces-finding | ✅ | ✅ | Mismatch is a finding, not silent acceptance |
| skill-specifies-pass-artefact-path | ✅ | ✅ | |
| skill-pass-requires-zero-unresolved-findings | ✅ | ✅ | |
| skill-no-hardcoded-tool-cli-references | ✅ | ✅ | ADR-004 compliance |
| skill-checklist-includes-credentials-check (NFR) | ✅ | ✅ | Mandatory credentials check in review checklist |

**Test gaps:** 1 — AI instruction-text runtime verification. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — review checklist includes step confirming no production credentials appear in migration command fields | ✅ | NFR test `skill-checklist-includes-credentials-check` passes; mandatory credentials check confirmed in review checklist (not optional) |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| T3-M1 — Breaking migration rollback coverage (100% of breaking migrations with CI-tier rollback execution evidence before production sign-off) | not-yet-measured | `schema-migration-review` SKILL.md is the enforcement point for CI-tier rollback evidence on breaking migrations (tests verify). No real migration-review sessions have run yet — measurement requires real breaking migrations being reviewed. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
