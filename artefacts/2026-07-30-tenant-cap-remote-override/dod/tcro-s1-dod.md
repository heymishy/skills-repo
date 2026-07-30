# Definition of Done: Replace bri-s3.5's local-file tenant-cap mechanism with a real remote override

**PR:** https://github.com/heymishy/skills-repo/pull/645 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-tenant-cap-remote-override/stories/tcro-s1-tenant-cap-remote-override.md
**Test plan:** artefacts/2026-07-30-tenant-cap-remote-override/test-plans/tcro-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-tenant-cap-remote-override/dor/tcro-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `setTenantCapOverride` takes effect immediately, in-memory | `tests/check-bri-s3.5-usage-gate.js` "fix-forward" block | None |
| AC2 | ✅ | `clearTenantCapOverride` reverts to next-priority resolution | Same file | None |
| AC3 | ✅ | Injected `capReader` still wins over the tenant override | Same file | None |
| AC4 | ✅ | `withTenantCap()` calls the real `POST /test/tenant-cap` route, no local file I/O remains | Code review of merged diff | None |
| AC5 | ✅ | Full local suite: same documented baseline, zero new regressions | `run-all-tests.js` full suite run (443/444 files, exact baseline match) | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (3 new regression tests plus existing coverage)
**Tests passing in CI:** 17 / 17 in `check-bri-s3.5-usage-gate.js`

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| setTenantCapOverride immediate effect | ✅ | ✅ | |
| clearTenantCapOverride reversion | ✅ | ✅ | |
| capReader priority over override | ✅ | ✅ | |

**Gaps (tests not implemented):** AC4's real confirmation against real staging could not be verified locally — this was explicitly flagged in the test plan and resolved by observation: the next staging-deploy run confirmed AC4's specific 402-vs-200 symptom cleared. AC2 (the spec's own AC2, a timeout) was explicitly not claimed as fixed by this story and correctly remained open, root-caused later by a separate story (bcdm-s1).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — reuses existing `_isTestEndpointAllowed` gate, no new bypass surface | ✅ | Code review |
| Performance — negligible, one additional Map lookup | ✅ | Code review |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** None additional — the deviation (AC2's timeout not resolved by this story) was explicitly flagged as an open question in the story itself, not a surprise gap, and was correctly picked up and resolved later by `bcdm-s1` in the same investigation chain.

---

## DoD Observations

1. **Wrong-branch commit incident (self-recorded during delivery):** mid-session, this story's commit was initially made on the wrong branch (`feature/pan-s1-product-aware-navigation`, an old already-merged branch) instead of a fresh branch off master. Caught immediately via the commit output showing the unexpected branch name. Recovered cleanly: preserved the commit via a new branch pointer, reset the polluted branch back to its correct remote-tracked SHA, cherry-picked the commit onto a clean branch off `origin/master`, verified no conflict markers, and opened the PR correctly — no data loss, fully reported to the operator at the time. This directly reinforced the standing practice (already in memory/feedback) of verifying the current branch via `git rev-parse --abbrev-ref HEAD` immediately after every `git checkout -b`, which was then followed correctly for the remaining 5 stories in this chain (btii-s1 through bcdm-s1).
