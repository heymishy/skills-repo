# Definition of Done: Support `ops/` path prefix for standalone infra changes

**PR:** https://github.com/heymishy/skills-repo/pull/399 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.2-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/shr.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `ops/2026-06-25-secrets-rotation` accepted as a valid feature slug by the integrity check | ✅ | Tests `ops-slug-accepted-by-integrity-check` and `ops-slug-with-date-and-description-accepted` pass; integrity check exits 0 for `ops/`-prefixed slugs | Automated test (8/8 passing) | None |
| AC2 — Artefact paths under `artefacts/ops/[slug]/` resolve within repoRoot (no escape) | ✅ | Tests `ops-artefact-path-resolves-within-repoRoot` and `ops-path-containment-holds-for-nested-subdir` pass; `path.resolve()` confirmed to keep derived paths within repoRoot | Automated test | None |
| AC3 — Traversal sequences in `ops/` slug (e.g. `ops/../../etc/passwd`) do not escape repoRoot | ✅ | Tests `traversal-in-ops-slug-does-not-escape-repoRoot` and `traversal-via-double-dot-in-ops-middle-segment` pass; guard fires for all traversal forms | Automated test (security) | None |
| AC4 — Standard slugs (date-prefixed) continue to pass integrity check unchanged | ✅ | Test `standard-slug-unaffected-by-ops-extension` passes | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| ops-slug-accepted-by-integrity-check | ✅ | ✅ | |
| ops-slug-with-date-and-description-accepted | ✅ | ✅ | |
| ops-artefact-path-resolves-within-repoRoot | ✅ | ✅ | |
| ops-path-containment-holds-for-nested-subdir | ✅ | ✅ | |
| traversal-in-ops-slug-does-not-escape-repoRoot | ✅ | ✅ | Primary security test |
| traversal-via-double-dot-in-ops-middle-segment | ✅ | ✅ | Secondary traversal form |
| standard-slug-unaffected-by-ops-extension | ✅ | ✅ | Regression guard |
| ops-path-traversal-guard-is-mandatory (NFR) | ✅ | ✅ | All traversal-form ops slugs produce C9 guard result |

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — path-traversal guard must not be relaxed for `ops/` prefix | ✅ | NFR test `ops-path-traversal-guard-is-mandatory` passes: all traversal-form ops slugs produce C9 guard result — zero out-of-repoRoot paths produced for any `ops/[traversal-sequence]` input |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| MM2 — No STAGE_SEQUENCE change required | on-track | STAGE_SEQUENCE unchanged — shr.2 adds `ops/` slug acceptance to the integrity check only. No touch to `journey-store.js` or STAGE_SEQUENCE. `git diff` on journey-store.js: zero changes | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 4/4
Scope deviations: None
Test gaps: None
