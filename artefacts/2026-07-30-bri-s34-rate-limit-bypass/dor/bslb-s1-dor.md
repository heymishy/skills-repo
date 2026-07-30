# Definition of Ready Checklist

## Definition of Ready: Fix bri-s3.4's own rate-limit bypass gap

**Story reference:** artefacts/2026-07-30-bri-s34-rate-limit-bypass/stories/bslb-s1-fix-bri-s3.4-rate-limit-bypass.md
**Test plan reference:** artefacts/2026-07-30-bri-s34-rate-limit-bypass/test-plans/bslb-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Test-only, reuses existing bypass mechanism |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix bri-s3.4's own rate-limit bypass gap — artefacts/2026-07-30-bri-s34-rate-limit-bypass/stories/bslb-s1-fix-bri-s3.4-rate-limit-bypass.md
Test plan: artefacts/2026-07-30-bri-s34-rate-limit-bypass/test-plans/bslb-s1-test-plan.md

Goal:
The fix is already implemented in tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js
(identical shape to ssr-s1's bri-s3.2 fix). Open a PR, confirm CI passes, and
report back once merged and the next staging-deploy run confirms the smoke
test now passes and promote-to-prod becomes available.

Oversight level: Medium (verification deferred to a real deploy observation)
```

---

## Sign-off

**Oversight level:** Medium — no application-code risk, verification deferred to a real staging-deploy observation.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to dig into and fix staging/prod deploy blockers, 2026-07-30
