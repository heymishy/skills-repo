# Review Report: Dynamic next-question generation (dsq.1) — Run 1

**Story reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1-dynamic-next-question.md
**Date:** 2026-05-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **1-M1** Category C (AC quality) — AC1 states "a second model call is made to `_nextQuestionExecutor`" without specifying that the executor adapter must have been replaced with a test spy to make this observable. The internal adapter call is not directly observable without an injected spy.
  Risk if proceeding: Test author must infer the spy pattern from the injectable adapter architecture; if they do not, the test may assert indirectly (e.g. via side effects) rather than on the adapter call itself.
  To acknowledge: run /decisions, category RISK-ACCEPT. Or revise AC1 to add the precondition: "Given `setNextQuestionExecutorAdapter` has been called with a spy function..."

- **1-M2** Category C (AC quality) — AC5 references "src/web-ui/server.js (or equivalent wiring module)" — the hedge makes the wiring location ambiguous and the test is not independently locatable without knowing which file to inspect.
  Risk if proceeding: Test for production wiring verification may be written against the wrong module, or omitted because the location is unclear.
  To acknowledge: run /decisions, category RISK-ACCEPT. Or name the specific file `src/web-ui/server.js` and remove the hedge before /test-plan.

---

## LOW findings — note for retrospective

- **1-L1** Category E (Architecture) — dsq.1 references D37/ADR-009 in Architecture Constraints. ADR-009 does not appear in the `.github/architecture-guardrails.md` Active ADRs table (ADRs listed: 005–013 + phase4-enforcement). D37 is a `copilot-instructions.md` coding standard, not a promoted guardrails ADR. The constraint is correctly stated and will be enforced — this is a taxonomy gap, not a functional issue. Add ADR-009 to the guardrails Active ADRs table at the next platform evolution cycle.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS — no HIGH findings. MEDIUM findings are testability precision issues addressable at test-plan time without story rework.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 4 | PASS |
