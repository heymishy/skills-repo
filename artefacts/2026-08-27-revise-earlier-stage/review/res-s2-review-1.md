# Review Report: Overwrite a reopened stage's artefact in place on revision — Run 1

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Date:** 2026-08-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Traceability — The User Story's "So that..." clause ("the correction is captured without creating a second, conflicting version of that stage's output") doesn't parallel either linked metric's name, unlike res-s1/res-s3/res-s4's "So that" clauses, which echo their metric's language directly. The separate Benefit Linkage section does correctly name both metrics with a real mechanism sentence, so linkage itself is not broken — this is a consistency nit across the story set.
  Fix: Optionally reword to something like "...so that this progress toward fixing an earlier-stage mistake is captured durably, without which no journey-restart-avoidance is possible."

- **[1-L2]** AC quality — AC1's Given clause embeds the triggering action ("Given an operator in a reopened stage's live session sends a turn that produces a revised artefact") rather than describing only precondition/state; the actual trigger belongs in the When clause. This is a minor Given/When/Then format deviation — the AC remains independently testable as worded.
  Fix: Reword to "Given an operator is in a reopened stage's live session, When they send a turn that produces a revised artefact, Then the file at the stage's existing artefact path is overwritten..."

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (4):** Epic/discovery/benefit-metric references all present, coverage matrix already lists this story; docked one point for 1-L1.
**Scope integrity (5):** Explicitly excludes versioning (matches discovery clarify Q3) and materiality judgment (res-s3's job); no epic/discovery out-of-scope items touched.
**AC quality (4):** 4 ACs, all testable, no "should" language, edge cases (no-revision, write-failure) each get their own AC; docked one point for 1-L2.
**Completeness (5):** All template fields populated, named persona, complexity/scope stability rated.
**Architecture compliance (5):** Architecture Constraints directly names ADR-023's disk canonicity companion rule and CLAUDE.md's exact write-then-read sequence and path-traversal guard — precise and on-point, no gaps found.
