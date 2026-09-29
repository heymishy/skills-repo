# Definition of Ready: Verify Sonnet 4.6 resolves both known Haiku failure modes across all 5 governance-critical skills

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s1.md
**Test plan reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s1-test-plan.md
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
| H5 | Benefit linkage names a metric | ✅ | "Governance-critical skill completion integrity" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ N/A | No upstream dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 items; review Category E PASS |
| H-ADAPTER | D37 injectable adapter | ✅ N/A | No code shipped by this story |
| H-INF / H-MIG / H-DESIGN | Track gates | ✅ N/A | None apply |

**All hard blocks passed.**

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1-W3, W5 | Standard checks | ✅ | Clean |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Solo-operator repo, same pattern accepted throughout this session's other stories |

## Oversight level

**Epic oversight:** Low.

## Coding Agent Instructions

```
Proceed: Yes
Story: Verify Sonnet 4.6 resolves both known Haiku failure modes — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s1.md

This story ships NO code. It is a manual verification exercise:
set each WUCE_MODEL_OVERRIDE_<SKILL> as a temporary Fly secret on
wuce-staging (never production), drive a real session for each of
the 5 skills, inspect the PostHog skill_turn trace and produced
artefact markers, remove the temporary secrets afterward regardless
of outcome, and record a go/no-go decision in decisions.md (AC4)
before psrc-verify-s2 proceeds.

Oversight level: Low
```

## Sign-off

**Sign-off required:** No — Low oversight.
