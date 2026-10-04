# Review Report: Type/source filter for the signals panel — Run 1

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Date:** 2026-10-04
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

- **[1-L1]** AC quality — AC6 ("Given the operator loads `/signals` with no `hideType`/`hideSource` parameters, Then the page renders identically...") omits an explicit "When" clause. Same pattern already reviewed and accepted as non-blocking in this epic's sibling feature (`ep2-s3`'s own `1-L1` finding: "AC3/AC5 written as Given/Then with no explicit When clause — substantively testable, not blocking"). The Given alone makes the triggering condition unambiguous here too.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

**Traceability (5):** References epic, discovery, and benefit-metric; "So that..." connects explicitly to Metric 2 (Page-1 signal-to-noise ratio) with a specific numeric target cited; benefit coverage matrix already lists this story as the sole mover of Metric 2.

**Scope integrity (5):** Out-of-scope section names 4 genuine exclusions, each traced back to discovery.md's own Out of Scope (full-text search, saved presets) or a deliberate narrower cut (show-only semantics, caching). No epic/discovery out-of-scope item is implemented — confirmed this story does not touch full-text search, saved views, or multi-tenant isolation.

**AC quality (4):** 6 ACs, all Given/When/Then except the minor 1-L1 gap, all observable/testable, no "should" language. AC1/AC2 correctly specify filtering must apply before pagination (not just hiding on the rendered page), closing a realistic implementation shortcut before it could be taken.

**Completeness (5):** User story with named persona; benefit linkage populated with a real mechanism and specific numbers; out-of-scope populated; NFRs populated (performance, accessibility, security); complexity rated (2); scope stability declared (Stable); dependencies correctly name `ep2-s1`/`ep2-s3` as external, confirmed dependencies.

### Category E: Architecture compliance

- Architecture Constraints field is unusually well-grounded: cites the real integration point (filter before `paginateSignals()`, not after), the real query-param convention precedent (`?page=`), and the real, directly-measured type/source value universe (not a guessed or hardcoded list) — this is exactly the kind of evidence this category looks for.
- No named anti-pattern violated.
- No applicable Active ADR contradicted.
- NFRs align with the repo's established `<100ms` performance budget and accessibility posture.

No Category E findings.
