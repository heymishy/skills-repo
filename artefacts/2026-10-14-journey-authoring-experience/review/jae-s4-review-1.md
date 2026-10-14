# Review Report: jae-s4

**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s4.md
**Run:** 1
**Date:** 2026-10-14
**Reviewer:** Claude Sonnet 5 (session continuation)
**Categories run:** A (traceability), B (scope integrity), C (AC quality), D (completeness), E (architecture/NFR consistency) — all categories, all stories in scope (per this repo's own `/review` convention: never ask which category or story, run all).

---

## Findings

### 1-H1 (HIGH) — Trigger point for the LLM call is unspecified, and the obvious default (embedding it in `handleGetJourneyCanvas`'s existing synchronous render, the same place `jae-s3`'s deterministic scan lives) would add real LLM-call latency to every canvas page load

**Category:** Architecture / NFR consistency
**Finding:** The story's Architecture Constraints describe HOW the LLM call is made (reuse `skillTurnExecutor`, D37 adapter) but not WHEN/WHERE it is triggered relative to the existing canvas render. `jae-s3`'s own `getFieldSuggestions` is a fast, synchronous-feeling file-read reused directly inside `handleGetJourneyCanvas`'s existing render path. If this story's `generateAiFieldSuggestion` is called the same way — inline, for every stage, on every canvas page load — a real network round-trip to Anthropic (hundreds of ms to a few seconds) would be added to the initial page load for every stage with an empty, unsuggested field, which is a materially different and worse performance profile than everything else this view does today. The NFR section's "Performance" line ("One additional LLM round-trip only when the deterministic scan found nothing") does not say WHEN that round-trip happens relative to page load, which is the actual risk.
**Required action:** Add an explicit Architecture Constraint (and a corresponding AC) establishing that the AI fallback suggestion is fetched ON-DEMAND — e.g. a new small endpoint (`GET /journeys/stages/:id/ai-suggestion?field=...`) called lazily when the stage-edit panel opens (or on an explicit "Suggest with AI" affordance), not embedded in `handleGetJourneyCanvas`'s own synchronous render. This must be resolved before `/test-plan`, since it changes the shape of what gets tested (a new route handler, not just a render-time helper).

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS — epic/discovery/benefit-metric chain correct, `jae-s3` dependency correctly named |
| Scope integrity | 5 | PASS — Out of Scope section correctly bounds the fast-follow to exactly what the scoping spike named |
| AC quality | 4 | PASS with note — ACs 1/2/3/5/6 are concretely testable; AC4's "two different stages produce different suggestions" is good D37 compliance, but no AC yet covers the trigger-point gap above |
| Completeness | 3 | FAIL — 1-H1 above is a real architectural gap, not yet closed by any AC |

**Verdict:** FAIL — 1 HIGH finding must be resolved before `/test-plan`.
