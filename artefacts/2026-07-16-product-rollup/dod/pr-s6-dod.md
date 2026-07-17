# Definition of Done: Render aggregate AC coverage on the product rollup view

**PR:** https://github.com/heymishy/skills-repo/pull/499 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s6.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s6-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s6 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — one blended aggregate Acceptance Criterion (AC)-coverage percentage (sum of verified / sum of total) | ✅ | `check-pr-s2-product-rollup.js` T20 "blended AC coverage is sum-of-verified/sum-of-total, not an average of percentages"; `check-pr-s2-products-route.js` "_renderProductView: renders AC-coverage percentage under clear label (AC1, AC3)" | Automated test | None |
| AC2 — a feature with no `acTotal`/`acVerified` data is excluded from numerator and denominator | ✅ | `check-pr-s2-product-rollup.js` T21 "stories with no acTotal/acVerified are excluded from the aggregate" | Automated test | None |
| AC3 — AC-coverage and test-coverage percentages are visually distinguished with clear labels | ✅ | `check-pr-s2-products-route.js` "renders AC-coverage percentage under clear label (AC1, AC3)" | Automated test | None |
| AC4 — zero features with AC data shows explicit "No AC data yet" state, not 0%/NaN | ✅ | `check-pr-s2-product-rollup.js` — no-data marker test consistent with pr-s5's T18 pattern; `check-pr-s2-products-route.js` "shows explicit 'No AC data yet' state, not 0%/NaN (AC4)" | Automated test | None |

---

## Scope Deviations

None. AC-coverage trend-over-time and per-AC detail (which specific ACs are unverified) were correctly left out, per the story's Out of Scope section, matching pr-s5's own equivalent scope decisions.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-product-rollup.js` (AC1, AC2, AC4 — computation + storage) | ✅ | ✅ (29 passed, 0 failed, combined suite) | |
| `check-pr-s2-products-route.js` (AC1, AC3, AC4 — rendering) | ✅ | ✅ (22 passed, 0 failed, combined suite) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** none of pr-s6's ACs depend on browser-rendered CSS layout — AC3's "visually distinguished with clear labels" is verified as a distinct-label content check, not a pixel/visual-separation check. `hasLayoutDependentGaps: false` is correct; no RISK-ACCEPT required.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — computed from the already-cached rollup record, no additional calls | ✅ | Confirmed — reads `acTotal`/`acVerified` fields already present in pr-s2's cache |
| Accessibility — same requirement as pr-s5, readable without colour/chart alone | ✅ | Rendered as labelled text percentage, matching pr-s5's approach |
| Security / Audit — none identified | ✅ | Read-only aggregation, no new data-access surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ | Now — pr-s6 is a contributing story and all six contributing stories are merged | `not-yet-measured` pending operator's manual sync-and-compare check; this story supplies the "aggregate AC coverage" field named in Metric 1's minimum validation signal |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Discovery's `[ASSUMPTION]` on the blended computation method (`nfr-profile.md` Gaps table, shared with pr-s5) was resolved in practice by AC1 (explicitly sum-of-verified/sum-of-total, matching pr-s5's method for consistency) and confirmed by T20 above. No further action required unless the operator wants a formal `/clarify` record.

---

## DoD Observations

None.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render aggregate AC coverage on the product rollup view" (pr-s6).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
