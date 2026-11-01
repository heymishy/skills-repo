# Review Report: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap — Run 1

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Date:** 2026-11-01
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance / F — Journey.js fixture hygiene / G — skills.js fixture hygiene / H — journeys.js fixture hygiene (all 8, A–H)
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC1 references "the story's own new, higher concurrency cap" before AC2 (the AC that actually determines what that value is, based on AC1's own investigation results). These two ACs are iteratively co-dependent rather than strictly sequential — natural for an investigation-heavy story, but worth a one-line note at `/test-plan` time so the test design doesn't assume a fixed cap value exists before the investigation runs.

---

## Scores

**Traceability score (1–5):** 5 — References epic, discovery, and benefit-metric correctly; Benefit Linkage names m1 and m2 with a real mechanism sentence; both metrics appear in the benefit coverage matrix.

**Scope integrity score (1–5):** 5 — Story doesn't implement anything in epic/discovery Out of Scope; its own Out of Scope section names 4 explicit exclusions (no unrelated redesign, no new parallelization mechanism, no absorbing newly-discovered fragile files without a decision, no touching files beyond the 3 named + the runner).

**AC quality score (1–5):** 5 — All 5 ACs in Given/When/Then, independently testable, no "should"/vague language, the one edge case (AC5, deferring an unsafe fix) correctly has its own AC. Minor sequencing note (1-L1), not a defect.

**Completeness score (1–5):** 5 — User story with a named, discovery-matched persona; benefit linkage real; out of scope populated; NFRs populated with concrete targets tied to m1/m2; complexity rated (3, correctly reflecting this story's genuine investigation uncertainty per `/clarify`'s own finding); scope stability declared (Unstable, for the same reason).

---

## Overall score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above.

### Category E: Architecture compliance

Architecture Constraints field populated ("None identified — checked"); confirmed no Active ADR governs test-NFR-budget tuning or `run-all-tests.js`'s own concurrency mechanism (same finding independently reached at `/definition`). **Score: 5.**

### Category F: Journey.js fixture hygiene

N/A — no `journey.js`-touching file in this story's scope (touches `scripts/run-all-tests.js` and 3 unrelated NFR test files). **Score: 5.**

### Category G: skills.js fixture hygiene

N/A — no `skills.js`-touching file in scope. **Score: 5.**

### Category H: journeys.js fixture hygiene

N/A — no `journeys.js`-touching file in scope. **Score: 5.**

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS
