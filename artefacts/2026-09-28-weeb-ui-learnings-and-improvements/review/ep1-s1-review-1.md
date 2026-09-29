# Review Report: Signals aggregator module — read all 12 sources and normalize to Signal shape — Run 1

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
**Date:** 2026-09-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category D (Completeness) — the User Story section is scrambled: the "I want" and "So that" clauses are truncated mid-sentence and swapped, with an unmatched parenthesis. Exact current text:
  > I want **learnings, proposals, suite, traces, decisions, DoD, estimation, archived references, pipeline-state), I need a server-side module that reads all 12 signal sources, parses each into a normalized `Signal` object shape, and returns a complete, sorted array of signals ready for dashboard consumption**,
  > So that **I can see improvement opportunities surfaced from across the entire framework (capture-log**.

  This does not describe a coherent want — it reads as two sentence fragments spliced at the wrong boundary. `definition.md`'s own version of this same story (written earlier, in the same session lineage) has the correct, coherent prose — this appears to be a real content regression from a later pass, not a first-draft issue.
  Fix: restore the coherent version from `definition.md` (verified below to be intact and correct).

- **[1-H2]** Category C (AC quality) — only 1 acceptance criterion is present (an unlabeled Given/When/Then block), below the required minimum of 3. This story's own test plan (`test-plans/ep1-s1-test-plan.md`) is written against a 5-AC version (AC1–AC5, each independently testable) that still exists — it was never removed, just never carried back into this story file. The story and its own test plan are currently out of sync.
  Fix: restore AC1–AC5 from the test plan's own AC Coverage table (and the matching content in the mislabeled `review.md`, which independently confirms the same 5 ACs) into this story's Acceptance Criteria section.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category A (Traceability) — Benefit Linkage references "the metric" singular in prose without citing a specific metric by name/number from `benefit-metric.md`'s own Metric Coverage Matrix (which, as of this review, correctly lists this story under Metric 2 — Improvement signal surfacing). Not blocking (the coverage matrix itself is correct and complete), but the story's own prose should name the metric explicitly for a reader who only has the story open.
  Risk if proceeding: low — coverage matrix is authoritative and correct; this is a readability/consistency gap, not a real traceability break.
  To acknowledge: run /decisions, category RISK-ACCEPT, or fix directly when restoring the AC content (1-H2).

---

## LOW findings — note for retrospective

- **[1-L1]** Category E (Architecture) — Architecture Constraints correctly cites ADR-028 (canonical builder pattern) and the D37 injectable-adapter convention; no violation found. Noted only because `benefit-metric.md` and `review.md` were themselves found to be duplicated/mislabeled content during this same review pass — worth a broader `/improve` look at whatever process step produced this feature's outer-loop artefacts, since the pattern (real content saved to the wrong artefact path or overwritten by a later pass) recurred at least 4 times across this one feature (`benefit-metric.md`, `review.md`, this story's own ACs, and `test-plans/ep1-s2-test-plan.md`).

---

## Summary

2 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL — 2 HIGH findings must be resolved before `/test-plan` can be trusted for this story.

**Score summary:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS (1-M1 noted, not blocking) |
| Scope integrity | 5 | PASS |
| AC quality | 1 | FAIL (1-H2) |
| Completeness | 2 | FAIL (1-H1) |

Category E (Architecture compliance): no violations found — ADR-028 and D37 correctly applied.
