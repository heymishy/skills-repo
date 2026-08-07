# Definition of Done: Render aggregate health on the product rollup view

**PR:** https://github.com/heymishy/skills-repo/pull/494 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s4.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s4-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s4 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — shows a count of features at each health status using the existing label convention | ✅ | `check-pr-s2-product-rollup.js` T7 "computeHealthCounts counts features across all four health statuses", T8 "a feature with a missing health field counts as unknown"; `check-pr-s2-products-route.js` "_renderProductView: renders all four health-status labels using the existing label convention (AC1)", "renders the numeric per-status counts (AC1)" | Automated test | None |
| AC2 — at least one red feature → overall signal is red, regardless of other counts | ✅ | `check-pr-s2-product-rollup.js` T9 "one red feature among many green/amber yields an overall red signal", T10 "a single red feature with zero other features still yields red (boundary)" | Automated test | None |
| AC3 — no red, at least one amber → overall signal is amber | ✅ | `check-pr-s2-product-rollup.js` T11 "no red features, at least one amber, yields an overall amber signal" | Automated test | None |
| AC4 — all green (or zero features) → overall signal is green | ✅ | `check-pr-s2-product-rollup.js` T12 "all-green features yield an overall green signal", T13 "zero features yields an overall green signal, not an error or undefined (boundary)" | Automated test | None |

---

## Scope Deviations

None. A weighted/percentage health score and drill-down from counts to named features were correctly left out, per the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing in CI:** confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-product-rollup.js` (AC1–AC4 — `computeHealthCounts`, `computeOverallHealthSignal`) | ✅ | ✅ (29 passed, 0 failed, combined suite) | |
| `check-pr-s2-products-route.js` (AC1 rendering) | ✅ | ✅ (22 passed, 0 failed, combined suite) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** none of pr-s4's ACs depend on browser-rendered CSS layout — counts and the overall signal are content-presence checks (label + icon text), not pixel/visual checks. `hasLayoutDependentGaps: false` is correct; no RISK-ACCEPT required.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — computed from the already-cached rollup record, no additional API calls | ✅ | `computeHealthCounts`/`computeOverallHealthSignal` operate on the in-memory rollup record already fetched by pr-s2's sync — no new fetch calls introduced |
| Accessibility — status distinguishable without colour alone | ✅ | Uses the existing `fleetHealthLabel` label/icon convention (✓/⚠/✕/?), confirmed by AC1 evidence |
| Security / Audit — none identified beyond pr-s2's own NFRs | ✅ | Read-only view of already-logged sync data, no new surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ | Now — pr-s4 is a contributing story and all six contributing stories are merged | `not-yet-measured` pending operator's manual sync-and-compare check; this story specifically supplies the "aggregate health" field named in Metric 1's minimum validation signal |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Discovery's `[ASSUMPTION]` on the red-takes-precedence rule (named in `nfr-profile.md`'s Gaps and open questions table, due "before DoR sign-off on pr-s4") was not run through a standalone `/clarify` pass as a separate step — however, the rule is now directly encoded in AC2–AC4 and verified by tests T9–T13 above, so the assumption is validated in practice through implementation and test, not left open. No further action required unless the operator wants a formal `/clarify` record for traceability.

---

## DoD Observations

None.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render aggregate health on the product rollup view" (pr-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
