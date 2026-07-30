# Definition of Ready Checklist

## Definition of Ready: Fix seedTestSession's dead staging bypass and withAuth's staging-incompatible tests

**Story reference:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/stories/swts-s1-fix-seedtestsession-and-withauth.md
**Test plan reference:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/test-plans/swts-s1-test-plan.md
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
| H9 | Architecture Constraints field populated | ✅ | Explicit escape-hatch design, no global relaxation |
| H-GOV | Governance approval | ✅ N/A | Short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | `seedTestSession` is not a D37 injectable adapter — a plain function with an added optional parameter |

**All hard blocks pass.**

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix seedTestSession's dead staging bypass and withAuth's staging-incompatible tests — artefacts/2026-07-30-seedtestsession-and-withauth-staging/stories/swts-s1-fix-seedtestsession-and-withauth.md
Test plan: artefacts/2026-07-30-seedtestsession-and-withauth-staging/test-plans/swts-s1-test-plan.md

Goal:
The fix is already implemented in src/web-ui/middleware/session.js,
src/web-ui/server.js, and tests/e2e/bri-s3.6-auth-journey.spec.js, with a
new regression test (tests/check-seedtestsession-allow-outside-test.js).
Open a PR, confirm CI passes, and report back once merged and the next
staging-deploy run confirms the smoke test job is fully green.

Oversight level: Medium (touches src/web-ui/middleware/session.js and
server.js, shared production files)
```

---

## Sign-off

**Oversight level:** Medium — touches shared session middleware, though the change is a narrow, explicit, single-call-site opt-in with no change to default behaviour.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Product/Platform Owner — approved via ongoing instruction to fix staging/prod deploy blockers, 2026-07-30
