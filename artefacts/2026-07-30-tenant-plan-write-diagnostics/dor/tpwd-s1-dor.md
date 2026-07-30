# Definition of Ready Checklist

## Definition of Ready: Add temporary diagnostic logging to identify why bri-s3.5's paid-plan writes aren't taking effect

**Story reference:** artefacts/2026-07-30-tenant-plan-write-diagnostics/stories/tpwd-s1-tenant-plan-write-diagnostics.md
**Test plan reference:** artefacts/2026-07-30-tenant-plan-write-diagnostics/test-plans/tpwd-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Diagnostic-only, no control-flow change, no secrets logged |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Add temporary diagnostic logging to identify why bri-s3.5's paid-plan writes aren't taking effect — artefacts/2026-07-30-tenant-plan-write-diagnostics/stories/tpwd-s1-tenant-plan-write-diagnostics.md
Test plan: artefacts/2026-07-30-tenant-plan-write-diagnostics/test-plans/tpwd-s1-test-plan.md

Goal:
The diagnostic logging is already implemented in
src/web-ui/modules/tenant-plan.js (setPlanState and getPlanState, scoped to
e2e--prefixed tenant IDs only). Open a PR, confirm CI passes, and report back
once merged and the next staging-deploy run's logs are captured and analysed.

Oversight level: Low (additive logging only, no control-flow change, no
secrets, scoped to non-production test tenant IDs)
```

---

## Sign-off

**Oversight level:** Low — purely additive, log-only change confined to test-tenant-scoped diagnostic output.
**Sign-off required:** No (Low — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to fix staging/prod deploy blockers, 2026-07-30
