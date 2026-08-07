# Definition of Ready Checklist

## Definition of Ready: Replace bri-s3.5's local-file tenant-cap mechanism with a real remote override

**Story reference:** artefacts/2026-07-30-tenant-cap-remote-override/stories/tcro-s1-tenant-cap-remote-override.md
**Test plan reference:** artefacts/2026-07-30-tenant-cap-remote-override/test-plans/tcro-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H9 | Architecture Constraints field populated | ✅ | Explicit priority-ordering design, reuses existing staging-safe gate |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Replace bri-s3.5's local-file tenant-cap mechanism with a real remote override — artefacts/2026-07-30-tenant-cap-remote-override/stories/tcro-s1-tenant-cap-remote-override.md
Test plan: artefacts/2026-07-30-tenant-cap-remote-override/test-plans/tcro-s1-test-plan.md

Goal:
The fix is already implemented in src/web-ui/modules/tenant-plan.js,
src/web-ui/server.js, and tests/e2e/bri-s3.5-billing-journey.spec.js, with
3 new regression tests appended to tests/check-bri-s3.5-usage-gate.js. Open
a PR, confirm CI passes, and report back once merged and the next
staging-deploy run confirms AC4 (and ideally AC2) now pass.

Oversight level: Medium (touches src/web-ui/server.js and a shared billing
module, though narrowly scoped)
```

---

## Sign-off

**Oversight level:** Medium — touches shared billing/cap-resolution logic, though the new override is strictly additive and lower-priority than existing mechanisms.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to fix staging/prod deploy blockers, 2026-07-30
