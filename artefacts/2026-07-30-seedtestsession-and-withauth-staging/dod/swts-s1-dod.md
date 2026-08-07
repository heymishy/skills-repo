# Definition of Done: Fix seedTestSession's dead staging bypass and withAuth's staging-incompatible tests

**PR:** https://github.com/heymishy/skills-repo/pull/644 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/stories/swts-s1-fix-seedtestsession-and-withauth.md
**Test plan:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/test-plans/swts-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/dor/swts-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `seedTestSession` throws unchanged when `options.allowOutsideTest` unset/false and `NODE_ENV !== 'test'` | `tests/check-seedtestsession-allow-outside-test.js` T1-T2 | None |
| AC2 | ✅ | Seeds successfully when `{ allowOutsideTest: true }` passed, even outside `NODE_ENV=test` | `tests/check-seedtestsession-allow-outside-test.js` T3-T4 | None |
| AC3 | ✅ | `server.js`'s `GET /test/session` route passes `{ allowOutsideTest: true }` | Code review of merged diff | None |
| AC4 | ✅ | `bri-s3.6-auth-journey.spec.js`'s AC3/AC4 converted to the staging-safe pattern, `withAuth` import removed | Code review of merged diff | None |
| AC5 | ✅ | Full local suite: same documented baseline, zero new regressions | `run-all-tests.js` full suite run | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (`check-seedtestsession-allow-outside-test.js`, new file)
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| check-seedtestsession-allow-outside-test.js (T1-T4) | ✅ | ✅ | Default-unchanged-throw and new escape-hatch behaviour both covered |
| bri-s3.6 AC3/AC4 staging-safe conversion | ✅ | ✅ | Confirmed via next staging-deploy run showing this spec's failures cleared |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — `allowOutsideTest` is a narrow, single-call-site escape hatch | ✅ | Code review confirmed only `server.js`'s `/test/session` route sets it; the other 2 call sites (already `NODE_ENV==='test'`-gated) are untouched |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. The next staging-deploy run showed 19 of 21 `@mocked` tests passing — direct evidence both fixes in this story worked, with only `bri-s3.5`'s (then-unrelated, separately root-caused) issues remaining.

---

## DoD Observations

None beyond what's already captured in the shared investigation-chain narrative (ssr-s1's DoD).
