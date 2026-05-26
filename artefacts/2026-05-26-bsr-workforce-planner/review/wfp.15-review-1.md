# Review: wfp.15 — Scenario modelling — intelligence server
**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot / Hamish King
**Story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.15.md

---

## FINDINGS

**1-H1 (HIGH) — Prerequisite gate does not enforce pure-function export contract**
The story states "wfp.12 DoD-complete, wfp.13 DoD-complete, wfp.14 DoD-complete" as prerequisites, and the dependencies section says the scenario handler "reuses the same data-loading and computation logic." The Complexity Rationale acknowledges that "the refactor of existing route handlers into pure functions is the structural risk." However, if wfp.12/13/14 are implemented with computation logic embedded in route handlers (not exported), wfp.15 will fail at implementation. The prerequisite statement does not bind the upstream stories to exporting named pure functions — meaning a compliant wfp.12 implementation could still block wfp.15.
_Recommended action:_ Add explicit export requirements to the Prerequisite section:
- "wfp.12 DoD-complete must include `computeHeatMapData(teams, roster, initiativeMap, portfolioFiles)` exported from a shared module (per `phase2-intelligence-intent.md`)."
- "wfp.13 DoD-complete must include `computeBottlenecksData(teams, roster, initiativeMap)` exported."
- "wfp.14 DoD-complete must include `computeTemporalRiskData(teams, roster, initiativeMap, nowDate)` exported."
These are DoD entry conditions, not implementation suggestions.

**1-M1 (MEDIUM) — Epic forward-link gap** *(shared with wfp.12–wfp.16)*
`wfp-planning-dashboard.md` does not list wfp.15. See wfp.12 1-M1.

**1-M2 (MEDIUM) — AC7 semantics statement contradicts Complexity Rationale wording**
AC7 states scenarios are "applied independently against the same unmodified on-disk baseline." The Complexity Rationale says "all scenario overlays are applied in array order to the same in-memory data copy" — which implies chaining. The Out of Scope section correctly states the independent semantics, but the Rationale sentence creates an ambiguity that a coding agent may resolve incorrectly.
_Recommended action:_ Amend the Complexity Rationale sentence to: "Multiple scenarios are each applied independently against a fresh copy of the on-disk baseline — not chained sequentially against a single accumulated in-memory state."

**1-L1 (LOW) — AC6 person/team count rule for banner not stated**
AC6 shows "[N] person(s) and [N] team(s) affected" but does not define how N is computed for each scenario type (e.g. reallocation affects 0 persons, 1 team; hire affects 1 person, 0 teams). Low risk — tests can verify banner presence without exact numbers — but test-plan author will need to infer the counting rule.
_Recommended action:_ Add: "Person count = total hire + departure persons across all scenarios; team count = total new-team + reallocation scenarios."

**1-L2 (LOW) — DoR pre-check boxes unchecked**

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — all references present; M1 and M2 named; benefit mechanism describes predictive vs observational distinction |
| Scope integrity | 5 | PASS — no disk writes; no persistence; chaining explicitly OOS with rationale |
| AC quality | 3 | PASS — 8 ACs, Given/When/Then; AC7 semantics clarified in OOS; HIGH finding is a prerequisite gap |
| Completeness | 4 | PASS — all template fields; complexity 3 rated; structural risk explicitly surfaced in rationale |

---

## VERDICT

**PASS with mandatory fix ✅⚠ — Run 1**

1 HIGH (pure-function export contract must be named as an entry condition on the prerequisite gate — must fix before /definition-of-ready), 2 MEDIUM, 2 LOW. Address 1-H1 by amending the Prerequisite section before DoR.
