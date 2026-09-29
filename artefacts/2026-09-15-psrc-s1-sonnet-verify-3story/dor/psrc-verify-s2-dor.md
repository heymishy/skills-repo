# Definition of Ready: Deploy WUCE_MODEL_OVERRIDE Fly secrets for all 5 governance-critical skills, on both environments

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s2.md
**Test plan reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "the platform owner" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4/4 manual scenarios |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | "Governance-critical skill completion integrity; Manual restart incidents" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Hard dependency on `psrc-verify-s1`'s own go/no-go decision — `schemaDepends: ["dodStatus", "prStatus"]` not applicable (no schema field to depend on; this is a manual go/no-go gate, checked by reading `decisions.md` directly before proceeding, not a pipeline-state field dependency) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 items; review Category E PASS |
| H-ADAPTER | D37 injectable adapter | ✅ N/A | No code shipped by this story |

**All hard blocks passed.**

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1-W3, W5 | Standard checks | ✅ | Clean |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Solo-operator repo |

## Oversight level

**Epic oversight:** Low.

## Coding Agent Instructions

```
Proceed: Yes (CONDITIONAL — do not begin until psrc-verify-s1's
decisions.md entry records a "go" decision)
Story: Deploy Fly secrets — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s2.md

This story ships NO code. Real operational commands only:
  fly secrets set WUCE_MODEL_OVERRIDE_DESIGN=claude-sonnet-4-6 \
    WUCE_MODEL_OVERRIDE_DEFINITION=claude-sonnet-4-6 \
    WUCE_MODEL_OVERRIDE_REVIEW=claude-sonnet-4-6 \
    WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6 \
    WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY=claude-sonnet-4-6 \
    -a wuce-staging
  (repeat with -a skills-framework for production)
Confirm via `fly secrets list` on both, then confirm via a real
$ai_generation PostHog event that the resolved model actually changed.

Oversight level: Low
```

## Sign-off

**Sign-off required:** No — Low oversight.
