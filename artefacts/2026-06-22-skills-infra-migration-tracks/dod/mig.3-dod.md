# Definition of Done: Add H-MIG hard block to `/definition-of-ready` SKILL.md for stories with a migration track

**PR:** https://github.com/heymishy/skills-repo/pull/409 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.3-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/mig.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — H-MIG (Migration-review gate check) appears in the DoR checklist output when story has `hasMigrationTrack: true` | ✅ | Tests `dor-skill-contains-h-mig-block` and `h-mig-block-references-hasMigrationTrack-field` pass; "H-MIG" named hard-block check present in DoR SKILL.md, triggered by `hasMigrationTrack` field | Automated test (10/10 passing) | None |
| AC2 — H-MIG shows FAIL when `migrationReviewPath` is absent or the artefact at that path does not contain status PASS | ✅ | Tests `h-mig-fails-when-migrationReviewPath-absent` and `h-mig-fails-when-artefact-does-not-contain-pass` pass | Automated test | None |
| AC3 — H-MIG shows PASS when `migrationReviewPath` points to an artefact with status PASS, classification declared, and forward+rollback fields non-blank; output names the artefact path and fields checked | ✅ | Tests `h-mig-passes-when-artefact-contains-status-pass` and `h-mig-references-artefact-path-in-output` pass | Automated test | None |
| AC4 — H-MIG does not appear when `hasMigrationTrack` is false or absent; existing H1-H9 and H-INF blocks are unaffected | ✅ | Tests `h-mig-absent-when-hasMigrationTrack-false` and `h-mig-absent-when-hasMigrationTrack-missing` pass | Automated test | None |
| AC5 — H-MIG shows FAIL when a breaking migration artefact has status PASS but no CI-tier rollback execution evidence | ✅ | Test `h-mig-fails-when-breaking-lacks-rollback-evidence` passes; gate checks for classification and rollback evidence, not just artefact existence | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| dor-skill-contains-h-mig-block | ✅ | ✅ | |
| h-mig-block-references-hasMigrationTrack-field | ✅ | ✅ | |
| h-mig-fails-when-migrationReviewPath-absent | ✅ | ✅ | |
| h-mig-fails-when-artefact-does-not-contain-pass | ✅ | ✅ | |
| h-mig-passes-when-artefact-contains-status-pass | ✅ | ✅ | |
| h-mig-references-artefact-path-in-output | ✅ | ✅ | |
| h-mig-absent-when-hasMigrationTrack-false | ✅ | ✅ | |
| h-mig-absent-when-hasMigrationTrack-missing | ✅ | ✅ | H-INF and H1-H9 confirmed unaffected |
| h-mig-fails-when-breaking-lacks-rollback-evidence | ✅ | ✅ | AC5 — gate checks more than artefact existence |
| h-mig-finding-text-names-artefact-path-and-fields (NFR) | ✅ | ✅ | FAIL text names path and missing field(s) |

**Test gaps:** 1 — AI instruction-text runtime verification. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — H-MIG finding text names the expected artefact path and lists missing fields so operator knows exactly what is required | ✅ | NFR test `h-mig-finding-text-names-artefact-path-and-fields` passes; FAIL output includes `migrationReviewPath` value and names which field(s) are missing or incorrect |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M2 — DoR gate enforcement correctness (100% of `hasMigrationTrack: true` stories hard-blocked when migration-review artefact absent or non-compliant) | on-track | H-MIG gate verified by automated tests: 10/10 passing including all FAIL conditions (absent path, non-PASS artefact, breaking without rollback evidence), PASS condition, and absent-flag behaviour. Gate is binary — fires correctly on all test scenarios. No real DoR sessions have run yet on migration-track stories, but enforcement mechanism confirmed correct. | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
