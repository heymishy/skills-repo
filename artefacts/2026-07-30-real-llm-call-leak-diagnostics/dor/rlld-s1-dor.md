# Definition of Ready Checklist

## Definition of Ready: Add temporary diagnostic logging to identify the real-LLM-call leak source

**Story reference:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/stories/rlld-s1-diagnostic-logging.md
**Test plan reference:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/test-plans/rlld-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod` investigation |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Diagnostic-only, no behavioural change, no secrets logged |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W4 | Verification script reviewed by a domain expert | ⚠️ | AC3 cannot be verified pre-merge — inherent to this story's diagnostic purpose | **Acknowledged — proceed.** Explicit, named gap in the test plan, not hidden |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Add temporary diagnostic logging to identify the real-LLM-call leak source — artefacts/2026-07-30-real-llm-call-leak-diagnostics/stories/rlld-s1-diagnostic-logging.md
Test plan: artefacts/2026-07-30-real-llm-call-leak-diagnostics/test-plans/rlld-s1-test-plan.md

Goal:
The logging change is already implemented in src/web-ui/server.js. Open a PR,
confirm CI passes, and report back once merged -- this story's real
verification only completes once the next staging-deploy failure's logs are
captured and reviewed.

Oversight level: Medium (touches src/web-ui/server.js, a shared production
file, even though the change itself is narrowly diagnostic)
```

---

## Sign-off

**Oversight level:** Medium — touches shared production code (`server.js`), though narrowly scoped to a diagnostic log line with no behavioural change.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via direct instruction to dig into the real-LLM-call leak, 2026-07-30
