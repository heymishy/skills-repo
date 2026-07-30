# Definition of Ready Checklist

## Definition of Ready: Fix generateProductDraft bypassing the mock LLM gateway on staging

**Story reference:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/stories/rlld-s2-fix-product-draft-mock-bypass.md
**Test plan reference:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/test-plans/rlld-s2-test-plan.md
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
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Directly unblocks `promote-to-prod`, confirmed root cause from rlld-s1's own diagnostic evidence |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Mirrors existing skill-turn mock-gateway-check pattern |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ | This story fixes the WIRING of an already-existing D37 adapter (`generateProductDraft`) — no new adapter introduced, existing stub-throws-by-default contract unaffected |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix generateProductDraft bypassing the mock LLM gateway on staging — artefacts/2026-07-30-product-draft-mock-gateway-bypass/stories/rlld-s2-fix-product-draft-mock-bypass.md
Test plan: artefacts/2026-07-30-product-draft-mock-gateway-bypass/test-plans/rlld-s2-test-plan.md

Goal:
The fix is already implemented in src/web-ui/server.js (mock-gateway check added
to the psh-s3 wiring, diagnostic logging from rlld-s1 removed) and
tests/check-psh-s3-product-creation.js (new T7 test). Open a PR, confirm CI
passes, and report back once merged and the next staging-deploy run confirms
the smoke test now passes.

Oversight level: Medium (touches src/web-ui/server.js, a shared production
file, in a code path that determines real vs mock LLM calls)
```

---

## Sign-off

**Oversight level:** Medium — touches shared production code determining real-vs-mock LLM call routing, though the fix directly mirrors an already-established, already-reviewed pattern used everywhere else in this codebase.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via direct instruction to dig into and fix the real-LLM-call leak, 2026-07-30
