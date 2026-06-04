# Review Report: Confirm or flag assumption cards via POST endpoint with in-session state persistence — Run 1

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
**Date:** 2026-06-04
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC2 and the Out of Scope section are internally inconsistent regarding card state machine transitions. AC2 states the flag button can be activated "in default or confirmed state", but the Out of Scope section says "confirm and flag are terminal states in MVP". If confirmed is a terminal state, it should not be possible to transition from confirmed → flagged. If the intent is that only the default state is truly terminal (meaning you can never un-confirm or un-flag back to default, but you can move between confirmed and flagged), then the Out of Scope wording is ambiguous. An implementer following the Out of Scope text would block flagging a confirmed card; an implementer following AC2 would permit it.
  Fix: Either (a) remove "or confirmed" from AC2 so flag is only applicable from default state, OR (b) replace "confirm and flag are terminal states" in Out of Scope with "cards cannot return to default state once confirmed or flagged — however, a confirmed card may be re-classified to flagged". The chosen interpretation must be consistent in both places before /test-plan writes tests against this state machine.
  Risk if proceeding: Tests written against one interpretation will fail if the implementation uses the other. Root cause is in the story artefact, not in the implementation — this needs to be resolved at the story level.
  To acknowledge: run /decisions, category RISK-ACCEPT (only if deliberately deferring to the implementer to decide).

---

## LOW findings — note for retrospective

None.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 1 MEDIUM, 0 LOW.

**Verdict:** PASS — all criteria scored 3 or above. The MEDIUM finding must be resolved or acknowledged in /decisions before /test-plan runs, as it governs the card state machine that the test plan will write assertions against.

---

### Category A: Traceability — notes

- Epic ref ✓ (iwu-web-session-surface.md)
- Discovery ref ✓
- Benefit-metric ref ✓
- "So that" names both M1 and M2 ✓
- Benefit linkage explains both M1 (terminal state completion) and M2 (closes the card interaction loop) ✓
- iwu.4 present in M1 and M2 rows of benefit-metric coverage matrix ✓

### Category B: Scope integrity — notes

- Story implements confirm/flag endpoint and DOM state transitions only ✓
- Out-of-scope section explicitly excludes disk persistence, bulk confirm, un-confirming, and state surviving session expiry ✓
- No epic out-of-scope violations ✓

### Category C: AC quality — notes

- 7 ACs, all in Given/When/Then format ✓
- HTTP status codes specified per AC (200, 404, 404, 400) ✓
- AC6 specifies cardId validation as 8-character hex — independently testable ✓
- AC7 covers keyboard activation + ARIA announcement ✓
- MEDIUM finding 1-M1: AC2 and Out of Scope inconsistent on whether confirmed is a terminal state ✓

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona "platform operator (primary)" ✓
- Benefit linkage populated with mechanism for both M1 and M2 ✓
- Out of scope populated ✓
- NFRs: Security (cardId validation, session state not in error response bodies), Accessibility (WCAG 2.1 AA) ✓
- Complexity 1, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- ADR-018 endpoint format referenced and specified exactly ✓
- ADR-019 session TTL — HTTP 404 on expired session (not HTTP 500) explicitly required ✓
- "cardId validated server-side as 8-character hex string before session lookup — path traversal guard per architecture-guardrails.md" — aligns with mandatory security guardrail ✓
- "Session state must not be returned in error response bodies" — aligns with mandatory security guardrail ✓
- No anti-patterns ✓
