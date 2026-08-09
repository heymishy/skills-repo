# Definition of Done: Compute the learnings count at build/deploy time instead of reading a file absent from the deployed image

**PR:** https://github.com/heymishy/skills-repo/pull/695 | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-learnings-count-deploy-fix/stories/lcdf-s1-build-time-learnings-count.md
**Test plan:** artefacts/2026-08-09-learnings-count-deploy-fix/test-plans/lcdf-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-learnings-count-deploy-fix/dor/lcdf-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (build-time script computes and captures the real count) | ✅ | `writeLearningsCountFile_computesRealCountFromWorkspaceLearnings` — cross-checked against `getLearningsCount()`'s own existing logic, not duplicated independently | automated test | None |
| AC2 (deployed app displays the build-time value) | ✅ | `getLearningsCount_deployedEnvironment_usesBakedFileWhenWorkspaceAbsent` — simulated deployed environment (workspace/ absent, baked file present) | automated test | None |
| AC3 (local/CI behaviour unregressed) | ✅ | `getLearningsCount_localEnvironment_stillReadsRealFileDirectly` — real file present takes precedence over a stale baked value | automated test | None |
| AC4 (fail-open safety net still holds) | ✅ | `getLearningsCount_bothSourcesAbsent_failsOpenToZero` + an additional `getLearningsCount_malformedBakedFile_failsOpenToZero` edge case beyond the test plan's own minimum | automated test | None — exceeded plan |
| AC5 (real deployed page shows the real count) | ✅ | Confirmed 2026-08-09 via `curl https://wuce-staging.fly.dev/` — the "Learnings captured" hero card shows `140 and counting`, matching `workspace/learnings.md`'s real local count (`140`) exactly, cross-checked with the same `^## /gm` counting logic `getLearningsCount()` uses | manual live check (post-deploy) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. AC5's manual verification is the one open item.

---

## Scope Deviations

None. `scripts/write-version-file.js` and `version-info.js` were used as a reference pattern only, not modified; `workspace/learnings.md`'s own format/counting logic was reused as-is; `Dockerfile`'s other `COPY` lines were untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 planned, plus 1 additional edge case (malformed baked file)
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| writeLearningsCountFile_computesRealCountFromWorkspaceLearnings | ✅ | ✅ | |
| getLearningsCount_deployedEnvironment_usesBakedFileWhenWorkspaceAbsent | ✅ | ✅ | |
| getLearningsCount_localEnvironment_stillReadsRealFileDirectly | ✅ | ✅ | |
| getLearningsCount_bothSourcesAbsent_failsOpenToZero | ✅ | ✅ | |
| getLearningsCount_malformedBakedFile_failsOpenToZero | ✅ | ✅ | Beyond the test plan's own minimum — a corrupt (not just absent) baked file also fails open |
| Real deploy confirms the real count (manual) | ✅ **executed 2026-08-09** | `curl https://wuce-staging.fly.dev/` — `140 and counting` | manual live check | None |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ (negligible, as stated) | Build-time computation replaces a runtime file read that always failed in production anyway |
| Security | ✅ | None identified — no new input handling, no secrets |
| Accessibility | N/A | No markup change |
| Availability | ✅ (this IS the availability/correctness fix) | Closes the gap between `lccf-s1`'s crash-safety fix and the feature actually working as designed |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This is the second half of a two-part incident.** `lccf-s1` (same session, 2026-08-08) was the emergency fail-open fix for the crash this same root cause originally produced; `lcdf-s1` is the permanent fix `lccf-s1`'s own DoD explicitly flagged as still owed. Both are now closed.
2. **Followed the established `version.json` precedent exactly**, deliberately not inventing a new build-time-injection mechanism — reduces the audit surface for anyone reviewing how this codebase bakes build-time values into a deployed image.
3. **This PR's own `staging-deploy.yml` run showed a "Staging smoke test (@mocked)" failure** (`bri-s3.2-signup-onboarding-journey.spec.js` AC4: gate-confirm after an incomplete DoR run expected a 303 redirect, got 302). Investigated and ruled unrelated: the deploy step itself succeeded, and the failing assertion is in journey gate-confirm redirect logic — no file this story touched (`learnings-count.js`, `write-learnings-count-file.js`, `Dockerfile`, `staging-deploy.yml`) has any code path in common with it. Not re-run or further investigated as part of this DoD since it's out of this story's scope; flagged here as a signal in case it recurs on unrelated PRs.
