# Review Report: Make the signals panel's existing sort order visible and explicit — Run 1

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
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

- **[1-L1]** AC quality — AC3 is phrased as a meta-level "reviewer check" ("A reviewer check: the shipped copy must not contradict the real data shape measured in this story") rather than a clean Given/When/Then behavioural assertion. It's still testable (grep the shipped copy string for an unqualified "sorted by recency" claim), but the phrasing reads as process guidance bolted onto an AC rather than a pure observable-behaviour statement. Consider rewording at `/test-plan` time to something like: "Given the rendered sort-order label, Then it states the sort applies only to signals with a date — it does not claim the full list is sorted by recency."

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

**Traceability (5):** References epic, discovery, and benefit-metric; "So that..." connects explicitly to Metric 1 (removing "what order is this?" uncertainty from the timed triage flow); benefit coverage matrix lists this story.

**Scope integrity (5):** This story's own scope narrowing (presentation-only, no change to `signals-aggregator.js`'s parsers) is itself a documented, approved decision (`decisions.md`, 2026-10-04 "Recency sort scope" entry) rather than an undocumented cut. Out-of-scope section correctly excludes extending timestamp parsing, adding a sort selector, and re-ordering undated signals — all consistent with discovery.md's own corrected MVP scope item 2.

**AC quality (4):** 4 ACs, 3 of 4 cleanly Given/When/Then and independently testable. Minor deduction for 1-L1 (AC3's meta-check phrasing) — addressable without rework.

**Completeness (5):** User story with named persona; benefit linkage populated; out-of-scope populated; NFRs populated (performance, accessibility); complexity rated (1); scope stability declared (Stable); dependencies correctly name `ep2-s1`/`ep1-s1` as external, confirmed dependencies.

### Category E: Architecture compliance

- Architecture Constraints field is exceptionally well-grounded: cites the real commit (`e396e67b`, #932) that introduced `_sortSignals()`, the real measured split (693/5,340 dated vs 4,647/5,340 undated), and an explicit RISK-ACCEPT boundary (no change to `signals-aggregator.js`'s parsers). This is the strongest Category A/E evidence of the four stories in this epic, precisely because it corrects rather than restates discovery's own now-superseded framing.
- No named anti-pattern violated. No applicable Active ADR contradicted.
- AC4 explicitly guards against regressing `_sortSignals`/`paginateSignals` behaviour — a good defensive AC given this story sits directly on top of already-shipped, already-reviewed code.

No Category E findings.
