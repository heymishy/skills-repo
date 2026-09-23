# Review Report: Expose the real team roster as a read API — Run 1

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Date:** 2026-09-24
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

- **[1-L1]** C — AC5 ("rejected the same way every other `authGuard`-protected route already is") doesn't state the exact expected status code/behaviour — it's testable only by first knowing what "every other route" does. Tighten to state the concrete expected response (e.g. "returns 401 with `{error: 'NOT_AUTHENTICATED'}`, matching `authGuard`'s own real response shape") so the AC is independently testable without cross-referencing other code.
  Fix: state the literal expected status/body at `/test-plan` time, sourced from reading `authGuard`'s real implementation directly.

- **[1-L2]** C — AC4 ("the response is a JSON array matching the read function's own output") is self-referential rather than stating the actual field shape. Tighten to name the literal expected fields (e.g. `[{identity: string, role: string}, ...]`).
  Fix: state the literal expected JSON shape explicitly at `/test-plan` time.

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome:** PASS

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Clean — epic/discovery/benefit-metric all referenced, benefit linkage names both real metrics with a genuine mechanism sentence, both metrics already appear in the coverage matrix.
**Scope integrity (5):** Nothing in this story touches epic/discovery out-of-scope items; out-of-scope section names 3 real exclusions.
**AC quality (4):** All 5 ACs are Given/When/Then, independently testable, no "should" language, edge cases (AC2 unresolvable identity, AC3 tenant isolation) have their own ACs — minus 1 point for AC4/AC5's self-referential phrasing (see LOW findings).
**Completeness (5):** Every required field populated per `templates/story.md`; persona matches benefit-metric's own named persona exactly; NFRs correctly mark Accessibility/Audit as genuinely Not applicable rather than leaving them blank.
**Architecture compliance (5):** ADR-025 and ADR-026 both correctly referenced and genuinely respected (no new schema, strict tenant scoping). This is a pure read/JSON-response story — no HTML rendering, so MC-SEC-01 (innerHTML sanitisation) does not apply here (it applies to `rtri-s2`/`rtri-s3`, flagged there).
