# Review Report: Reopen a completed stage's live session from the step-nav — Run 1

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
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

- **[1-L1]** AC quality — AC4 ("a not-yet-reached future stage's link is unaffected by this change") asserts a negative outcome without naming the concrete expected markup/href. It's testable via a before/after comparison, but as worded it leaves the assertion's exact shape to the implementer's interpretation.
  Fix: Reword to name the specific unchanged property, e.g. "Then the not-yet-completed stage's step-nav link href is identical to its pre-change value (still `/journey/:id/stage/:skill` or disabled, per current behaviour)."

- **[1-L2]** Architecture compliance (Category E) — Architecture Constraints cites `kcrs-s1`/`adsr-s1`'s existing-session-first pattern, which only covers the *current active* stage. A closer, more directly applicable precedent already exists and isn't referenced: `frsr-s1` added `sessionId` to every `journey.completedStages` entry specifically "so a later 'resume conversation' link can resolve which `/skills/:skillName/sessions/:sessionId/chat` to point at" (see `journey-store.js` `completeStage()` docstring), and `handleGetJourneyStage` (`journey.js` ~line 3149-3160) already performs exactly the "resolve session by stage name, for any completed stage" lookup this story needs — `journey.completedStages.find(s => s.skillName === stageName)` then `getGetHtmlSession()(stage.sessionId)`. This mechanism already generalises to arbitrary completed stages, not just the active one.
  Fix: Add `frsr-s1`'s `stage.sessionId` field and `handleGetJourneyStage`'s lookup pattern to Architecture Constraints as the primary reference for AC1/AC2's "does a resumable session exist for this specific stage" check; keep `kcrs-s1`/`adsr-s1` as the secondary precedent for the "session missing → fall back and create fresh" half.

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Traceability (5):** All references present (epic, discovery, benefit-metric); "So that" ties directly to the "journey restart" metric language; benefit coverage matrix already lists this story against M1.
**Scope integrity (5):** No epic/discovery out-of-scope items implemented; own out-of-scope section names 2 real exclusions.
**AC quality (4):** 4 ACs, all Given/When/Then, all use "does/lands/is" not "should"; docked one point for 1-L1 (AC4 vagueness).
**Completeness (5):** All template fields populated with real content, named persona, complexity and scope stability both rated.
**Architecture compliance (4):** Architecture Constraints field populated and mostly on-point (ADR-022/023/024/018 all correctly named); docked for 1-L2 (closer precedent not referenced).
