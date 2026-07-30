# Definition of Ready Checklist

## Definition of Ready: Close the usage-cap bypass in the "add feature from within a product" flow

**Story reference:** artefacts/2026-07-30-product-feature-cap-bypass/stories/pfcb-s1-product-feature-cap-bypass.md
**Test plan reference:** artefacts/2026-07-30-product-feature-cap-bypass/test-plans/pfcb-s1-test-plan.md
**Assessed by:** Claude (agent), short-track
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Closes a real business-logic bypass found via direct operator testing |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H9 | Architecture Constraints field populated | ✅ | Ports the exact existing gate, no new mechanism |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Close the usage-cap bypass in the "add feature from within a product" flow — artefacts/2026-07-30-product-feature-cap-bypass/stories/pfcb-s1-product-feature-cap-bypass.md
Test plan: artefacts/2026-07-30-product-feature-cap-bypass/test-plans/pfcb-s1-test-plan.md

Goal:
The fix is already implemented in src/web-ui/routes/products.js
(handlePostProductFeature now runs the same pre-flight checkJourneyCap gate
handlePostJourney already uses). New test file
tests/check-product-feature-cap-bypass.js (5 tests, all passing). All 6
existing tests touching this handler re-run and passing unchanged. Open a
PR, confirm CI passes, and report back once merged.

Oversight level: Low (ports an existing, already-reviewed gate to a second
call site; no new mechanism, full regression suite re-run)
```

---

## Sign-off

**Oversight level:** Low — reuses an existing, already-shipped and reviewed gate mechanism at a second call site.
**Sign-off required:** No (Low — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — confirmed intended trial policy ("some free usage, then capped") directly, 2026-07-30
