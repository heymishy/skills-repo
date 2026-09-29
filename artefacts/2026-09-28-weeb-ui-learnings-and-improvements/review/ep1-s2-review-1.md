# Review Report: Signals panel route handler — `/api/signals` endpoint — Run 1

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
**Date:** 2026-09-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category C (AC quality) — only 1 acceptance criterion is present (an unlabeled Given/When/Then block), below the required minimum of 3. The mislabeled `review.md` file (see `ep1-s1-review-1.md`'s own 1-L1 finding for the broader pattern) contains a 5-AC version of this exact story (AC1–AC5: JSON array response, required Signal fields, aggregator-exception→500 handling, latency, repeatability) that was never carried back into this story file.
  Fix: restore AC1–AC5 from the mislabeled `review.md`'s own "Signals panel route handler" section into this story's Acceptance Criteria section.

- **[1-H2]** Category C (AC quality), cross-referenced with the test plan — `test-plans/ep1-s2-test-plan.md` is not a test plan at all. It contains 5 "Decision" sections (signal-shape field requirements, error-handling approach, timestamp format, sorting, file-read-adapter wiring) and a "Follow-up actions" section — this is `/clarify`-or-`/design`-shaped decision-record content, not a test plan (no AC Coverage table, no Test Data Strategy, no Unit/Integration Test sections, matching every other real test plan in this repo including this feature's own `ep1-s1-test-plan.md`). AC1's own test coverage cannot be confirmed because no real test plan exists for this story.
  Fix: `/test-plan` must be re-run for this story from scratch, once the story's own ACs are restored (1-H1). The 5 "Decision" entries look like genuine, real design decisions worth preserving — recommend folding them into `design.md` or this story's own Architecture Constraints, not discarding them, since they answer real implementation questions (signal shape, error handling, sorting, adapter wiring) the eventual test plan will need.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category A (Traceability) — same as `ep1-s1-review-1.md`'s 1-M1: Benefit Linkage doesn't cite the specific metric by name from `benefit-metric.md`'s Metric Coverage Matrix (which correctly lists this story under Metric 2). Not blocking.
  To acknowledge: run /decisions, category RISK-ACCEPT, or fix directly when restoring AC content.

---

## LOW findings — note for retrospective

- **[1-L1]** Same systemic-pattern observation as `ep1-s1-review-1.md`'s 1-L1 — this is now the 4th confirmed instance of real content being saved to the wrong artefact path or lost to a later overwrite within this single feature's outer loop.

---

## Summary

2 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL — 2 HIGH findings must be resolved; this story additionally needs a genuine `/test-plan` re-run (its current test-plan file is decision-log content, not a test plan).

**Score summary:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS (1-M1 noted, not blocking) |
| Scope integrity | 5 | PASS |
| AC quality | 1 | FAIL (1-H1, 1-H2) |
| Completeness | 4 | PASS (User Story, persona, NFRs, scope all correctly populated — only the AC count is deficient, already captured under AC quality) |

Category E (Architecture compliance): Architecture Constraints correctly cites ADR-024 (GET response shape contract) — no violation found.
