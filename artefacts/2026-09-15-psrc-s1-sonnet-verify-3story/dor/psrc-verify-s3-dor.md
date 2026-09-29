# Definition of Ready: Startup drift guard — warn loudly if a governance-critical skill silently resolves to Haiku

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md
**Test plan reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "the platform owner" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6/6 tests (4 unit, 2 integration), 0 gaps |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Model-routing intent matches deployed reality" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH (1-H1 resolved) |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Soft dependency on `psrc-verify-s2` (not schema-blocking — code is correct regardless, real-world value provable once secrets exist) — no `schemaDepends` needed since it's soft, not hard |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 items; review Category E PASS |
| H-ADAPTER | D37 injectable adapter | ✅ N/A | `checkModelRoutingDrift(envVars)` mirrors `getModelForSkill`'s own existing plain-parameter injectable-testability pattern — not a D37 `setX()` adapter |

**All hard blocks passed.**

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1-W3, W5 | Standard checks | ✅ | Clean |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Solo-operator repo |

## Standards injection

**Domain tags:** `platform`, `ai-infra`
No specific standards file matched these tags; general code-quality conventions apply (this repo's own established `var`/`const` style per file, hand-rolled `test()`/`assert` test convention).

## Oversight level

**Epic oversight:** Low.

## Coding Agent Instructions

```
Proceed: Yes
Story: Startup drift guard — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md
Test plan: artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add `DRIFT_GUARD_SONNET_SKILLS = ['design', 'definition', 'review',
  'test-plan', 'definition-of-ready']` and a new exported function
  `checkModelRoutingDrift(envVars)` to
  `src/web-ui/config/model-routing.js` -- purely additive, do not
  modify any existing export's behaviour.
- `checkModelRoutingDrift(envVars)` calls the EXISTING
  `getModelForSkill(skillName, envVars)` for each skill in
  `DRIFT_GUARD_SONNET_SKILLS` and returns an array of
  `{skill, resolvedModel}` for any skill whose resolved model
  contains the substring "haiku". Returns `[]` when none drift.
- In `server.js`, at startup, call `checkModelRoutingDrift(process.env)`
  once and, for each returned entry, log
  `console.warn('[model-routing-drift] ' + entry.skill + ' resolved to '
  + entry.resolvedModel + ', expected a Sonnet model')`. Log nothing
  when the array is empty.
- Do NOT touch `discovery`/`ideate`/`DEFAULT_SONNET_SKILLS`/
  `HAIKU_BLOCKED_SKILLS` at all.
- Test file: `tests/check-psrc-verify-s3-model-routing-drift.js`,
  matching this repo's hand-rolled test()/assert convention (no
  Jest/Mocha) -- see tests/check-*.js for the established pattern.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Low
```

## Sign-off

**Sign-off required:** No — Low oversight.
