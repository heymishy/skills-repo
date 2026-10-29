# Review Report: Extract a shared mockReq/mockRes fixture module for journey.js tests — Run 1

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
**Date:** 2026-10-29
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC1 defines the shared fixture's canonical default shape as "the same default shape... that journey.js's existing tests currently construct by hand." The 17 existing hand-rolled mocks are exactly what diverge from each other today (that divergence is this entire feature's premise) — AC1 as written doesn't say which of the 17 divergent shapes becomes canonical, so a coding agent could reasonably copy any one of them, including a divergent/unsafe field the way `ctpl-s1`'s original two files did. AC3 already fixes this for `tenantId` specifically, but leaves every other field's canonical source unstated.
  Risk if proceeding: The shared module could enshrine one file's idiosyncratic default as "the" canonical shape without it actually being correct, defeating the story's own purpose.
  To acknowledge: run /decisions, category RISK-ACCEPT — or fix AC1 to ground the canonical shape in `journey.js`'s real `req.session` reads (same rigor already used in tsir-s2 AC1), not in what existing tests happen to construct.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. 1 MEDIUM finding (1-M1) will be fixed directly rather than acknowledged as a risk, since the fix is cheap and removes a real ambiguity before implementation.
