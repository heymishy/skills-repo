# Definition of Done: Give bri-s3.5's billing E2E tenants unique per-run IDs so plan state doesn't leak across staging-deploy runs

**PR:** https://github.com/heymishy/skills-repo/pull/646 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-billing-tenant-id-isolation/stories/btii-s1-billing-tenant-id-isolation.md
**Test plan:** artefacts/2026-07-30-billing-tenant-id-isolation/test-plans/btii-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-billing-tenant-id-isolation/dor/btii-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1's tenant ID suffixed with a per-run `RUN_SUFFIX` token; the next staging-deploy run's AC1 "before" check correctly showed `trial` for a brand-new tenant, confirming no cross-run pollution | Direct observation of staging-deploy run 30514472200's logs | None |
| AC2 | ✅ | All 4 tenant ID literals (AC1/AC2/AC3/AC4) replaced consistently, each reference (session seed, webhook payloads, cap-override calls) using the same unique value within a test | Code review of merged diff | None |
| AC3 | ✅ | Top-of-file comment updated to accurately describe per-run (not just per-scenario) isolation | Code review of merged diff | None |
| AC4 | ✅ | Full local suite: 444 files run, 38 failed — all pre-existing in the documented baseline, zero new regressions | `run-all-tests.js` full suite run | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A (code-review-verified, per test plan) — no new unit tests, this is an E2E test-fixture fix
**Tests passing in CI:** ✅ — confirmed via the next staging-deploy run

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Code review of RUN_SUFFIX application | ✅ | ✅ | |
| Next staging-deploy run's AC1 "before" check | — | ✅ | Correctly showed `trial`, confirming the pollution fix worked |

**Gaps (tests not implemented):** As explicitly flagged in the test plan, AC2 (the spec's own AC2, a `page.fill` timeout) was not claimed as fixed by this story. Confirmed correct: the next run showed a *different* failure mode for AC1/AC3/AC4 (a previously-masked webhook idempotency bug, unrelated to tenant-ID pollution), which this story's own diagnosis correctly anticipated as a possibility and did not overclaim.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — bounded, ever-growing set of inert orphaned rows in `tenant_plan`, explicitly accepted | ✅ | Documented in the story's own NFR section as an accepted tradeoff, not a gap |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This story's fix was independently confirmed correct via direct log evidence (the "before" check behaviour) even though it surfaced a second, previously-masked bug (fixed by `seic-s1`) — the story's own scope was fully and correctly delivered.

---

## DoD Observations

1. This story is a good example of a fix being fully correct within its own scope while still surfacing a next-layer bug — the DoD process should not conflate "this story's AC failed" with "a different bug was found downstream." Both `btii-s1` and `seic-s1`'s DoDs should be read together to understand the full `bri-s3.5` investigation arc.
