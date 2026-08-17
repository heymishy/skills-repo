# Definition of Done: Compute health per-feature, distinct from test coverage

**PR:** https://github.com/heymishy/skills-repo/pull/519 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/a3-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC5 (per-feature health computation, distinct from coverage %, rollup cache) | ✅ | `check-pr-s2-product-rollup.js` (37/37), `check-pr-s2-products-route.js` (28/28) | Automated test, re-run fresh on current master 2026-08-17 | See note below |

**Note on evidence files:** `a3`'s own PR (#519) touched `check-pr-s2-product-rollup.js` and `check-pr-s2-products-route.js` directly — these are shared infrastructure test files (also exercising `pr-s2` through `pr-s7` product-rollup stories from a separate feature), not `a3`-exclusive files. This is expected: `a3`'s health-computation logic lives inside the same rollup module those stories share. All 65 combined assertions pass fresh.

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 65/65 (37 + 28), re-run fresh 2026-08-17, across the two shared infrastructure files this story's logic lives in.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

**Time to identify the least-healthy area of a large product (Metric 1)**
Signal: not-yet-measured
Evidence note: `a3` is the core health-signal computation this metric depends on, but no dedicated adoption/usage telemetry was traced in this retroactive pass.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live in production, no incidents reported. Shares test infrastructure with the separate `product-repo-config` (`pr-s2` etc.) feature — worth being aware of when touching `check-pr-s2-*.js` files in future work on either feature, since a change to shared rollup logic affects both.
