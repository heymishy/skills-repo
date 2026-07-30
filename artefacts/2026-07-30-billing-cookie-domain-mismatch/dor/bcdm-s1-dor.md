# Definition of Ready Checklist

## Definition of Ready: Fix bri-s3.5 AC2's browser session cookie so it actually attaches to real staging requests

**Story reference:** artefacts/2026-07-30-billing-cookie-domain-mismatch/stories/bcdm-s1-billing-cookie-domain-mismatch.md
**Test plan reference:** artefacts/2026-07-30-billing-cookie-domain-mismatch/test-plans/bcdm-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Test-fixture-only change, no production code path touched |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix bri-s3.5 AC2's browser session cookie so it actually attaches to real staging requests — artefacts/2026-07-30-billing-cookie-domain-mismatch/stories/bcdm-s1-billing-cookie-domain-mismatch.md
Test plan: artefacts/2026-07-30-billing-cookie-domain-mismatch/test-plans/bcdm-s1-test-plan.md

Goal:
The fix is already implemented in tests/e2e/bri-s3.5-billing-journey.spec.js
(cookie domain and secure flag now derived from process.env.E2E_BASE_URL
instead of hardcoded 'localhost'). Open a PR, confirm CI passes, and report
back once merged and the next staging-deploy run confirms AC2 -- and all 21
tests in this file -- now pass, and whether promote-to-prod becomes
reachable.

Oversight level: Low (test-fixture-only change, no production code path touched)
```

---

## Sign-off

**Oversight level:** Low — confined to a single E2E test spec file, no production code path touched.
**Sign-off required:** No (Low — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to fix staging/prod deploy blockers, 2026-07-30
