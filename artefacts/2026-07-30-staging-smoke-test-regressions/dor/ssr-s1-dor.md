# Definition of Ready Checklist

## Definition of Ready: Fix the E2E test gaps blocking every staging-deploy smoke test

**Story reference:** artefacts/2026-07-30-staging-smoke-test-regressions/stories/ssr-s1-fix-staging-smoke-test-failures.md
**Test plan reference:** artefacts/2026-07-30-staging-smoke-test-regressions/test-plans/ssr-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod`; no benefit-metric artefact for this bug fix |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gap explicitly named (no local-harness equivalent for real-staging behaviour) and mitigated |
| H9 | Architecture Constraints field populated | ✅ | No application code touched; reuses existing serlb-s1 bypass mechanism |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Root cause was reconstructed from CI logs, not reproduced locally (no local-harness equivalent) | **Acknowledged — proceed.** Verification is deferred to observing the next real `staging-deploy` run, per the test plan's own stated mitigation |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix the E2E test gaps blocking every staging-deploy smoke test — artefacts/2026-07-30-staging-smoke-test-regressions/stories/ssr-s1-fix-staging-smoke-test-failures.md
Test plan: artefacts/2026-07-30-staging-smoke-test-regressions/test-plans/ssr-s1-test-plan.md

Goal:
The 3 fixes are already implemented (tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js,
tests/e2e/a3-product-feature-ideate-canvas.spec.js). Open a PR, confirm CI passes,
and report back the next real staging-deploy run's outcome once merged -- this
story's actual verification only completes once that run is observed.

Oversight level: Medium (touches CI/staging behaviour, verification is deferred
to a real deploy observation rather than a pre-merge local check)
```

---

## Sign-off

**Oversight level:** Medium — no application-code risk, but verification is inherently deferred to a real post-merge staging-deploy observation rather than a pre-merge local check.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via direct instruction to fix forward, 2026-07-30
