# Definition of Done: Fix generateProductDraft bypassing the mock LLM gateway on staging

**PR:** https://github.com/heymishy/skills-repo/pull/642 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/stories/rlld-s2-fix-product-draft-mock-bypass.md
**Test plan:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/test-plans/rlld-s2-test-plan.md
**DoR artefact:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/dor/rlld-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `isMockGatewayEnabled()` check added before the `ANTHROPIC_API_KEY` check in the wired `generateProductDraft`, returning a deterministic mock draft object | `tests/check-psh-s3-product-creation.js` T7 (source-pattern check); code review | None |
| AC2 | ✅ | Real-provider path unchanged when mock gateway disabled and API key present | Code review of merged diff (no change to that branch) | None |
| AC3 | ✅ | Blank-draft fallback unchanged when mock gateway disabled and no API key | Code review of merged diff (no change to that branch) | None |
| AC4 | ✅ | rlld-s1's diagnostic `console.warn` removed; `_realLlmCallCount` increment logic untouched | Code review of merged diff | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 1 / 1 new test (T7) plus regression verification
**Tests passing in CI:** ✅

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| check-psh-s3-product-creation.js T7 (source-pattern check) | ✅ | ✅ | Verifies `isMockGatewayEnabled()` is checked before `ANTHROPIC_API_KEY` and before `https.request` |
| Full local suite regression | ✅ | ✅ | Same documented baseline, zero new regressions |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — same call shape, just correctly gated | ✅ | Code review |
| Security — mock branch returns static, non-sensitive text | ✅ | Code review |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. The next staging-deploy run after this merge confirmed `Post-deploy real-staging E2E confirmation` passed (previously blocked by this exact leak) — direct evidence the fix worked.

---

## DoD Observations

1. Out-of-scope item flagged in the story ("investigating whether other similar adapters have the same API-key-only gap, never the mock gateway") remains a valid, not-yet-actioned follow-up audit. Tagging as an `/improve` candidate: a repo-wide grep for `ANTHROPIC_API_KEY` checks not paired with `isMockGatewayEnabled()` would surface any sibling instances of this exact bug class before they cause the same kind of staging leak.
