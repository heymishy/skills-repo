# Definition of Done: Render aggregate test coverage on the product rollup view

**PR:** https://github.com/heymishy/skills-repo/pull/498 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s5.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s5-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s5 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — one blended aggregate test-coverage percentage (sum of passing / sum of total) | ✅ | `check-pr-s2-product-rollup.js` T15 "blended test coverage is sum-of-passing/sum-of-total, not an average of percentages"; `check-pr-s2-products-route.js` "_renderProductView: renders the blended test-coverage percentage (AC1)" | Automated test | None |
| AC2 — a feature with no `testPlan` data is excluded from numerator and denominator (not counted as 0%) | ✅ | `check-pr-s2-product-rollup.js` T16 "stories with no testPlan field are excluded from the aggregate, not counted as 0%" | Automated test | None |
| AC3 — per-feature test-coverage detail is available alongside the blended number | ✅ | `check-pr-s2-product-rollup.js` T17 "per-story test-coverage detail is retrievable alongside the blended aggregate"; `check-pr-s2-products-route.js` "renders per-story test-coverage detail alongside the blended number (AC3)" | Automated test | None |
| AC4 — zero features with `testPlan` data shows an explicit "No test data yet" state, not 0%/NaN | ✅ | `check-pr-s2-product-rollup.js` T18 "zero stories with testPlan data returns an explicit no-data marker, not 0% or NaN"; `check-pr-s2-products-route.js` "shows explicit 'No test data yet' state, not 0%/NaN (AC4)" | Automated test | None |

---

## Scope Deviations

None. Coverage-trend-over-time and per-test detail were correctly left out, per the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-product-rollup.js` (AC1–AC4, T15–T19 — computation + storage) | ✅ | ✅ (29 passed, 0 failed, combined suite) | T19 additionally confirms `syncProductRollup` writes `test_coverage` alongside the other rollup columns |
| `check-pr-s2-products-route.js` (AC1, AC3, AC4 — rendering) | ✅ | ✅ (22 passed, 0 failed, combined suite) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** none of pr-s5's ACs depend on browser-rendered CSS layout. `hasLayoutDependentGaps: false` is correct; no RISK-ACCEPT required.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — computed from the already-cached rollup record, no additional calls | ✅ | Confirmed — `test_coverage` is computed and stored during pr-s2's single sync, per T19 |
| Accessibility — percentage and per-feature breakdown readable by screen readers, not chart/colour alone | ✅ | Rendered as text percentage + labelled per-story breakdown (AC3 evidence), not a chart |
| Security / Audit — none identified | ✅ | Read-only aggregation, no new data-access surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ | Now — pr-s5 is a contributing story and all six contributing stories are merged | `not-yet-measured` pending operator's manual sync-and-compare check; this story supplies the "aggregate test coverage" field named in Metric 1's minimum validation signal |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Discovery's `[ASSUMPTION]` on the blended-vs-average computation method (named in `nfr-profile.md`'s Gaps and open questions table, due "before DoR sign-off on pr-s5/pr-s6") was resolved in practice by the story's own AC1 (explicitly specifying sum-of-passing/sum-of-total) and confirmed by T15 above, rather than via a standalone `/clarify` pass. No further action required unless the operator wants a formal `/clarify` record for traceability.

---

## DoD Observations

None.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render aggregate test coverage on the product rollup view" (pr-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
