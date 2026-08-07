# Definition of Done: Fix the E2E test gaps blocking every staging-deploy smoke test

**PR:** https://github.com/heymishy/skills-repo/pull/640 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-30-staging-smoke-test-regressions/stories/ssr-s1-fix-staging-smoke-test-failures.md
**Test plan:** artefacts/2026-07-30-staging-smoke-test-regressions/test-plans/ssr-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-staging-smoke-test-regressions/dor/ssr-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `bri-s3.2-signup-onboarding-journey.spec.js`'s `uniqueEmail()` prefixed with `e2e-test-` and the signup POST sends `x-e2e-rate-limit-bypass`; confirmed the next staging-deploy run no longer showed a 429 for this spec | Observed staging-deploy run (PR #641's investigation confirmed this layer resolved, since the next failure was a different, deeper issue) | None |
| AC2 | ✅ | `driveJourneyToDefinitionOfReady` updated to expect the auto-skip-to-review redirect | Code review of merged diff; confirmed no further redirect-mismatch failure observed in any subsequent run | None |
| AC3 | ✅ | `a3-product-feature-ideate-canvas.spec.js`'s locator scoped to `page.locator('main')` | Code review of merged diff; no further duplicate-match failure observed in any subsequent run | None |
| AC4 | ✅ | Full local suite run at merge time: baseline failure count unchanged, zero new regressions | `run-all-tests.js` full suite run (documented in PR #640) | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3 (all test-only fixes, verified via subsequent staging-deploy runs progressing past these specific failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| bri-s3.2 rate-limit bypass | ✅ | ✅ | Confirmed via next run showing a different, unrelated failure (the real-LLM-call leak), i.e. this layer cleared |
| bri-s3.2 redirect expectation | ✅ | ✅ | No recurrence in any of the 8 subsequent staging-deploy runs this session |
| a3-ideate-canvas locator scope | ✅ | ✅ | No recurrence in any subsequent run |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — reuses existing `serlb-s1` bypass, no new surface | ✅ | Code review confirmed no new header/secret/route introduced |

---

## Metric Signal

No benefit-metric artefact — short-track infra/test fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None — this was the first of what turned out to be a 10-story sequential investigation chain (rlld-s1 through bcdm-s1), each layer only visible once the prior one was fixed. All fully resolved as of this DoD batch (2026-07-30).

---

## DoD Observations

1. This story kicked off a long sequential root-cause chain: ssr-s1 → rlld-s1 → rlld-s2 → bslb-s1 → swts-s1 → tcro-s1 → btii-s1 → tpwd-s1 → seic-s1 → bcdm-s1, each fix exposing exactly one new, previously-masked failure on the next staging-deploy run. Worth capturing as a pattern: this repo's single shared `wuce-staging` server had accumulated many independent, small, staging-only bugs that could only be discovered one at a time because each one masked the ones behind it. Candidate `/improve` signal: consider a dedicated "staging E2E health" audit pass rather than relying purely on incremental discovery.
2. None of these 10 stories required a benefit-metric artefact (all short-track infra/test fixes) — consistent with CLAUDE.md's short-track exemption.
