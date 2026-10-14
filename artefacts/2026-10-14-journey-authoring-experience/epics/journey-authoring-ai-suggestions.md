## Epic: Operators get a real LLM-generated starting suggestion for stage-level fields when the deterministic scan finds nothing

**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Slicing strategy:** User journey

## Goal

When this epic is complete, a field that `jae-s3`'s own deterministic discovery-artefact scan could not suggest anything for (no linked feature, or a linked feature with no discovery.md, or no Problem Statement section) gets a real, LLM-generated starting suggestion instead — same click-to-fill review-before-save UX `jae-s3` already established, same 2 fields (`customer_actions`, `pain_points`), no new field coverage and no change to the deterministic scan itself.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    ROUTE[routes/journeys.js]\n    ADAPTER[adapters/field-suggestion-ai.js]\n    EXEC[modules/skill-turn-executor.js]\n    ROUTE -->|falls back when deterministic scan returns none| ADAPTER\n    ADAPTER -->|reused unmodified, ADR-026| EXEC\n    EXEC -->|real Anthropic Messages API call| EXEC"}}---

## Out of Scope

- **Any change to `jae-s3`'s own deterministic scan** — this epic is a fallback that runs only when the deterministic scan returns nothing for a given field; `getFieldSuggestions`/`extractProblemStatement` are read, not modified.
- **Any field beyond `customer_actions`/`pain_points`** — same 2-field boundary `jae-s3` already established.
- **Streaming the suggestion as it generates** — the suggestion is requested and rendered as a single completed response (reusing `skillTurnExecutor`'s non-streaming form), not `skillTurnExecutorStream`.
- **Caching or reusing a suggestion across sessions/operators** — every request generates fresh; no suggestion-result persistence beyond the field's own eventual saved value once accepted.
- **Rate-limiting or per-tenant cost quotas** — named as a real operational concern in the scoping spike, but building a quota mechanism is a separate, later concern once real usage/cost data exists; this epic ships with a conservative fixed `maxTokens` bound only.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M2 — Fields populated without manual prompting | 3 of 7 stages (42.9%) on wuce-staging, contaminated/tiny-sample (see benefit-metric.md) | ≥40% of new stages reach ≥3 populated fields at first save | Extends `jae-s3`'s own suggestion coverage to the cases the deterministic scan can't reach at all (no linked feature / no discovery.md / no Problem Statement) — a strict coverage increase, not a replacement |

## Stories in This Epic

- [ ] LLM-generated fallback suggestion for `customer_actions`/`pain_points` when the deterministic scan finds nothing — `jae-s4`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Unlike the 3 `journey-authoring-guided-creation` stories, this epic makes a real outbound LLM API call with real per-request cost and content-accuracy risk (the scoping spike's own named risk for empathy-sensitive fields) — reuses already-proven plumbing (`skill-turn-executor.js`'s existing Anthropic call path, D37 adapter convention) but the call itself is new, so Medium rather than Low oversight is warranted for this one story.

## Complexity Rating

**Rating:** 2
**Scope Stability:** Stable
