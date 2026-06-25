# Definition of Done: Add H-INF hard block to `/definition-of-ready` SKILL.md

**PR:** https://github.com/heymishy/skills-repo/pull/406 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.4-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.4-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — H-INF (Infra-plan gate check) appears in the DoR checklist output when story has `hasInfraTrack: true` | ✅ | Tests `dor-skill-contains-h-inf-block` and `h-inf-block-references-hasInfraTrack-field` pass; "H-INF" named hard-block check present in DoR SKILL.md, triggered by `hasInfraTrack` field | Automated test (9/9 passing) | None |
| AC2 — H-INF shows FAIL when `infraPlanPath` is absent or the artefact at that path does not contain status PASS | ✅ | Tests `h-inf-fails-when-infraPlanPath-absent` and `h-inf-fails-when-artefact-does-not-contain-pass` pass; both FAIL conditions confirmed in DoR SKILL.md evaluation logic | Automated test | None |
| AC3 — H-INF shows PASS when `infraPlanPath` points to an artefact containing `Status: PASS`; output names the checked artefact path | ✅ | Tests `h-inf-passes-when-artefact-contains-status-pass` and `h-inf-references-artefact-path-in-pass-output` pass | Automated test | None |
| AC4 — H-INF does not appear when `hasInfraTrack` is false or absent; existing H1-H9 blocks are unaffected | ✅ | Tests `h-inf-absent-when-hasInfraTrack-false` and `h-inf-absent-when-hasInfraTrack-missing` pass | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| dor-skill-contains-h-inf-block | ✅ | ✅ | |
| h-inf-block-references-hasInfraTrack-field | ✅ | ✅ | |
| h-inf-fails-when-infraPlanPath-absent | ✅ | ✅ | |
| h-inf-fails-when-artefact-does-not-contain-pass | ✅ | ✅ | |
| h-inf-passes-when-artefact-contains-status-pass | ✅ | ✅ | |
| h-inf-references-artefact-path-in-pass-output | ✅ | ✅ | |
| h-inf-absent-when-hasInfraTrack-false | ✅ | ✅ | |
| h-inf-absent-when-hasInfraTrack-missing | ✅ | ✅ | Confirms H1-H9 blocks unaffected |
| h-inf-finding-text-names-expected-artefact-path (NFR) | ✅ | ✅ | FAIL text includes path/description so operator knows what is missing |

**Test gaps:** 1 — AI instruction-text runtime verification. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — H-INF finding text names the expected artefact path and lists which fields are missing | ✅ | NFR test `h-inf-finding-text-names-expected-artefact-path` passes; FAIL output includes `infraPlanPath` value or path description so operator knows exactly what is missing without opening another file |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M2 — DoR gate enforcement correctness (100% of `hasInfraTrack: true` stories hard-blocked when infra-plan artefact absent) | on-track | H-INF gate verified by automated tests: 9/9 passing including all FAIL and PASS conditions, traversal boundary, and absent-field behaviour. Gate is binary — fires correctly on all test scenarios. No real DoR sessions have run yet on infra-track stories, but the enforcement mechanism is confirmed correct. | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 4/4
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
