# Review: wfp.14 — Temporal coverage risk
**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot / Hamish King
**Story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.14.md

---

## FINDINGS

**1-M1 (MEDIUM) — Epic forward-link gap** *(shared with wfp.12–wfp.16)*
`wfp-planning-dashboard.md` does not list wfp.14. See wfp.12 1-M1 for description and recommended action.

**1-M2 (MEDIUM) — AC4: coverage recomputation should name the pure function contract**
AC4 states the coverage impact recomputes "using the same coverage formula as wfp.12 but against the reduced post-rolloff member set." The `phase2-intelligence-intent.md` now defines `computeHeatMapData(teams, roster, initiativeMap, portfolioFiles)` as the canonical pure function for this computation. AC4 does not reference this contract, leaving a fork risk: a coding agent reading this story in isolation may inline a duplicate formula rather than calling the established pure function.
_Recommended action:_ Append to AC4: "The coverage recomputation must call `computeHeatMapData(...)` (the pure function extracted by wfp.12 per the Phase 2 naming convention in `phase2-intelligence-intent.md`) with the post-rolloff member set — not a duplicate inline formula."

**1-L1 (LOW) — `_nowOverride` test hook in NFRs only; no dedicated AC**
The date injection mechanism (`_nowOverride` query parameter, accepted only in `NODE_ENV === 'test'`) is specified in NFRs but has no corresponding AC. A test for deterministic quarter boundary computation needs this hook — it should be asserted via an AC so it is guaranteed to exist.
_Recommended action:_ Add AC9: "Given `NODE_ENV === 'test'` and `_nowOverride=2026-07-01` is passed as a query parameter, when `GET /api/intelligence/temporal-risk-data?_nowOverride=2026-07-01` is called, then quarter computation treats 2026-07-01 as the current date (Q3 2026 as the first window). In non-test mode, the parameter is ignored."

**1-L2 (LOW) — DoR pre-check boxes unchecked**

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — all three reference fields; M1 explicitly named; benefit mechanism sentence present |
| Scope integrity | 5 | PASS — hiring scenarios and person-level view explicitly excluded |
| AC quality | 4 | PASS — 8 ACs, all Given/When/Then; edge cases (no endDate, retired, missing map) all covered |
| Completeness | 4 | PASS — all fields populated; named persona; complexity rated with rationale |

---

## VERDICT

**PASS ✅ — Run 1**

0 HIGH, 2 MEDIUM (epic gap; pure function cross-reference in AC4), 2 LOW. Ready for /test-plan after MEDIUMs acknowledged. The AC4 MEDIUM is recommended to fix before test-plan to avoid the coding agent forking the coverage formula.
