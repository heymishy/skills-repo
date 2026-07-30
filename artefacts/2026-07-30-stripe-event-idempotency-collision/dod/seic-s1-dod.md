# Definition of Done: Give bri-s3.5's webhook event IDs unique per-run values so the AC5 idempotency guard doesn't silently skip processing

**PR:** https://github.com/heymishy/skills-repo/pull/648 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-stripe-event-idempotency-collision/stories/seic-s1-stripe-event-idempotency-collision.md
**Test plan:** artefacts/2026-07-30-stripe-event-idempotency-collision/test-plans/seic-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-stripe-event-idempotency-collision/dor/seic-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | All 5 webhook event IDs suffixed with `RUN_SUFFIX`, no hardcoded literal remains | Code review of merged diff | None |
| AC2 | ✅ | The next staging-deploy run showed AC1/AC3/AC4 all passing (20/21 tests in the file) — direct evidence the idempotency guard now treats each webhook as new | Direct observation of staging-deploy run 30517803500 | None |
| AC3 | ✅ | `tpwd-s1`'s diagnostic logging fully removed from `tenant-plan.js` | Code review of merged diff | None |
| AC4 | ✅ | Full local suite: 444 files run, 38 failed — identical to documented baseline, zero new regressions | `run-all-tests.js` full suite run | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A (code-review-verified per test plan) + regression suite
**Tests passing in CI:** `tests/check-bri-s3.5-usage-gate.js` 17/17; full suite regression-clean

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Next staging-deploy run: AC1/AC3/AC4 | — | ✅ | 20 of 21 tests passed — only the spec's own AC2 (a separate, distinct bug) remained |

**Gaps (tests not implemented):** As flagged in the test plan, this story did not address AC2 (the spec's own AC2, a `page.fill`/timeout) — correctly scoped out, and subsequently root-caused and fixed by `bcdm-s1` as a genuinely separate bug (a browser cookie domain mismatch), not related to webhook idempotency.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — bounded, ever-growing set of inert orphaned rows in `stripe_events`, explicitly accepted | ✅ | Documented in the story's own NFR section as an accepted tradeoff |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This was the second of two root causes found via `tpwd-s1`'s diagnostic logging (webhook idempotency + tenant-ID pollution, the latter already fixed by `btii-s1`), and its fix was directly confirmed by the very next staging-deploy run.

---

## DoD Observations

1. This story is a clean example of the diagnostic-logging → confirmed-root-cause → targeted-fix pattern used three times in this investigation (rlld-s1→rlld-s2, tpwd-s1→seic-s1). The AC5 idempotency guard itself (`billing.js`) was correctly identified as intentional and correct — the bug was entirely in test-fixture reuse of static IDs, and no production code was touched.
