# Definition of Ready Checklist

## Definition of Ready: Give bri-s3.5's billing E2E tenants unique per-run IDs so plan state doesn't leak across staging-deploy runs

**Story reference:** artefacts/2026-07-30-billing-tenant-id-isolation/stories/btii-s1-billing-tenant-id-isolation.md
**Test plan reference:** artefacts/2026-07-30-billing-tenant-id-isolation/test-plans/btii-s1-test-plan.md
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
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Test-fixture-only change, no production code path touched |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Give bri-s3.5's billing E2E tenants unique per-run IDs so plan state doesn't leak across staging-deploy runs — artefacts/2026-07-30-billing-tenant-id-isolation/stories/btii-s1-billing-tenant-id-isolation.md
Test plan: artefacts/2026-07-30-billing-tenant-id-isolation/test-plans/btii-s1-test-plan.md

Goal:
The fix is already implemented in tests/e2e/bri-s3.5-billing-journey.spec.js
(a RUN_SUFFIX token appended to all 4 previously-hardcoded tenant IDs, plus an
updated top-of-file isolation comment). Open a PR, confirm CI passes, and
report back once merged and the next staging-deploy run confirms AC1/AC3/AC4
now pass consistently (AC2's timeout is a separate, still-open question).

Oversight level: Low (test-fixture-only change, no production code path touched)
```

---

## Sign-off

**Oversight level:** Low — confined to a single E2E test spec file, no production code path touched.
**Sign-off required:** No (Low — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to fix staging/prod deploy blockers, 2026-07-30
