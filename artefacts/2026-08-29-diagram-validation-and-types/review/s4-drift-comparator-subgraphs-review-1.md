# Review Report: Drift-comparator recognizes subgraphs — Run 1

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Date:** 2026-08-29
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Architecture compliance — same gap as S3 (`1-M1` in that story's review): Architecture Constraints does not reference `.github/standards/testing/test-design-patterns.md`'s mutation-testing discipline, despite AC1/AC2's parsing correctness being exactly the kind of claim that discipline exists to verify (a test could pass because a fixture happens to match a loose regex, not because subgraph parsing genuinely works).
  Risk if proceeding: same as S3's 1-M1 — a passing test that doesn't actually prove subgraph-aware parsing.
  To acknowledge: run /decisions, category RISK-ACCEPT, or add the reference before `/test-plan`. Given this is the second story in a row with the same gap, consider fixing it at the epic level (add the reference to both S3 and S4 together) rather than acknowledging twice.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

**Scores:** Traceability 5. Scope integrity 5 — nested subgraphs correctly deferred rather than spread into this story's scope. AC quality 5 — AC3's MATCHED-despite-subgraph-grouping case is a well-chosen, concrete regression scenario. Completeness 5. Architecture compliance 4 — same single gap as S3 (1-M1).
