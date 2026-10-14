## Story: LLM-generated fallback suggestion for `customer_actions`/`pain_points` when the deterministic scan finds nothing

**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-ai-suggestions.md
**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **a real, LLM-generated starting suggestion for `customer_actions`/`pain_points` when `jae-s3`'s own deterministic scan has nothing to offer (no linked feature, or a linked feature with no discovery.md, or no Problem Statement section)**,
So that **I still get a reviewable starting point instead of a blank textarea in the majority of real cases, where a new journey isn't yet linked to a feature with its own discovery artefact — directly closing the coverage gap `jae-s3`'s own DoD named as the trigger for this fast-follow**.

## Benefit Linkage

**Metric moved:** M2 — Fields populated without manual prompting
**How:** `jae-s3` only suggests when a linked feature's discovery.md has a usable Problem Statement — a real but narrow slice of cases. This story adds a fallback suggestion path for every other case, using a real LLM call grounded in the stage's own name and any available context (linked feature slug, journey name), so the suggestion mechanism's total coverage is no longer capped by how many journeys happen to be linked to a feature with existing discovery artefacts.

## Architecture Constraints

- **Reuse over invention (ADR-026).** The real LLM call reuses `src/modules/skill-turn-executor.js`'s own already-wired, already-production-proven `skillTurnExecutor(systemPrompt, history, currentInput, token, meta)` function unmodified — same Anthropic Messages API call path, same `ANTHROPIC_API_KEY`/model-selection/timeout handling already used by every skill-pipeline turn today. No new HTTP client, no new npm dependency, no new provider-routing logic.
- **Not the mock-llm-gateway's fixture system.** Per the `ai-generation-fast-follow-scoping-outcome.md` spike's own explicit finding, `src/web-ui/modules/mock-llm-gateway.js` is purpose-built fixture infrastructure for pipeline-SKILL turn execution (keyed by `stage`/`scenarioName`, fixture files on disk) — the right shape for `/discovery`-style skill turns, not for a one-off customer-facing completion call. This story does not route through it; `skillTurnExecutor`'s own `meta.stage` mock-gateway hook is simply never set by this story's caller, so real calls always fire when the new adapter is wired (same as every other non-pipeline caller of `skillTurnExecutor` today — there are none yet, this is the first, which is exactly why a dedicated adapter and its own test seam are needed, not a borrowed one).
- **D37 injectable adapter — new seam, following `artefact-fetcher.js`'s own `fetchRepoPath`/`setFetchRepoPath`/`getFetchRepoPath` pattern exactly.** A new `src/web-ui/adapters/field-suggestion-ai.js` exports `generateAiFieldSuggestion(stageContext, field)` / `setGenerateAiFieldSuggestion(impl)` / `getGenerateAiFieldSuggestion()`, with the unwired default throwing (`'Adapter not wired: generateAiFieldSuggestion. Call setGenerateAiFieldSuggestion() with a real implementation before use.'`), and a separately-exported `realGenerateAiFieldSuggestion` wired in `server.js` only when `NODE_ENV !== 'test'`, matching every existing D37 adapter in this codebase (`fetchRepoPath`, `pipelineStateFetchAdapter`, etc.) — not a bespoke shape.
- **Prompt scope is tight, per the scoping spike's own named guardrail.** The system prompt is scoped specifically to generating ONE short, empathetic suggestion for a named journey-stage field (`customer_actions` or `pain_points`), seeded with the stage's own name and the journey's own name/product context — not a general-purpose "write anything" prompt. `maxTokens` is a small, fixed, conservative bound (not configurable per-request) to cap per-call cost.
- **Security:** No new database query shape — stage/journey context is read via the SAME tenant-scoped query path `handleGetJourneyCanvas` already uses to load stage data; the new adapter receives already-tenant-scoped data as plain arguments, it does not query the database itself.
- **On-demand trigger, not embedded in the canvas render (review 1-H1).** Unlike `jae-s3`'s deterministic scan (a fast file read, safe to run synchronously for every stage inside `handleGetJourneyCanvas`'s existing render), this story's LLM call is a real network round-trip with real latency. It MUST NOT be called inline during `handleGetJourneyCanvas`. Instead, a new route `GET /journeys/stages/:stageId/ai-suggestion?field=<customer_actions|pain_points>` calls `generateAiFieldSuggestion` lazily, triggered client-side only when the stage-edit panel opens AND the deterministic scan already returned nothing for that field — so a canvas page load's own latency profile is completely unchanged, and the LLM call only ever fires for the specific fields that actually need it, on the specific stage the operator is actively editing.

## Dependencies

- **Upstream:** `jae-s3` (the deterministic scan this falls back from) — merged. This story's fallback only triggers when `getFieldSuggestions` already returned no suggestion for a given field.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a stage whose `customer_actions` or `pain_points` field is currently empty, AND `jae-s3`'s own deterministic scan (`getFieldSuggestions`) returned no suggestion for that specific field, When the stage-edit panel opens, Then the client calls the new `GET /journeys/stages/:stageId/ai-suggestion?field=<field>` endpoint for that field, and if it returns a suggestion, a button appears for that field, visually consistent with `jae-s3`'s own `sw-field-suggestion-btn` styling (same click-to-fill behaviour), labelled distinctly enough that the operator can tell it's AI-generated rather than drawn from a linked feature's own discovery artefact (e.g. a distinguishing prefix/badge, not identical unlabelled text to a deterministic suggestion).

**AC1a (review 1-H1):** Given a canvas page load (`GET /journeys/:id/canvas`), When the page renders, Then no call to `generateAiFieldSuggestion` or the new `ai-suggestion` endpoint occurs as part of that render — the canvas route's own response time is unaffected by this story, confirmed by the fact that `handleGetJourneyCanvas` itself is not modified by this story at all (only `getFieldSuggestions`'s existing no-match result is read client-side to decide whether to call the new endpoint).

**AC2:** Given a field that already has a deterministic suggestion available from `jae-s3`'s own scan, When the panel opens, Then the LLM fallback does NOT also generate or show a suggestion for that same field — the deterministic scan always takes priority; the LLM path only runs for a field the deterministic scan left with nothing.

**AC3:** Given the operator clicks the LLM-generated suggestion button, When clicked, Then the field's own textarea is filled with the exact suggested text (not auto-saved) — same review-before-save behaviour as every other suggestion/field in this panel; the operator must still blur the field for it to save.

**AC4:** Given the real `generateAiFieldSuggestion` adapter is wired (production), When two different stages with two different names/contexts each trigger the fallback for the same field, Then the generated suggestion text is observably different between the two stages (not a static/templated string) — the wiring test must assert this behavioural difference, not merely that a function reference was assigned (per `CLAUDE.md`'s own D37 injectable-adapter rule and the `tir-s1`/`tir-s7` precedent it documents).

**AC5:** Given the LLM call fails (network error, timeout, missing `ANTHROPIC_API_KEY`) or returns an empty/unusable response, When the panel opens, Then no suggestion button appears for that field and no error is shown to the operator — this degrades silently to "no suggestion," exactly as `jae-s3`'s own AC3 already established for the deterministic scan's own no-match case, not a new error-handling UX.

**AC6:** Given the adapter is NOT wired (test/unwired state), When `generateAiFieldSuggestion` is called directly, Then it throws the exact D37-mandated error message, confirming the stub-throws-not-silently-empty rule holds for this new adapter.

## Out of Scope

- **Any change to `jae-s3`'s own deterministic scan, its priority, or its markup/CSS** — reused and read-only.
- **Streaming the suggestion** — a single non-streaming `skillTurnExecutor` call only.
- **Suggestions for fields other than `customer_actions`/`pain_points`.**
- **Rate-limiting / per-tenant cost quotas** — named as a real follow-on concern, not built here.
- **Caching a generated suggestion for reuse across sessions or operators.**

## NFRs

- **Performance:** One additional LLM round-trip only when the deterministic scan found nothing for a field — bounded by the existing `WUCE_TURN_TIMEOUT_MS`/`maxTokens` conventions `skillTurnExecutor` already enforces; no new timeout mechanism.
- **Security:** No new database query shape; context passed into the adapter is already tenant-scoped by the caller. `ANTHROPIC_API_KEY` reuse only — no new secret.
- **Accessibility:** WCAG 2.1 AA — reuses `jae-s3`'s own already-accessible native-`<button>` suggestion pattern; the AI-vs-deterministic distinguishing label must not rely on colour alone (MC-A11Y-02).
- **Audit:** None — no new mutating action; accepting a suggestion still goes through the existing per-field PATCH/autosave path.
- **Cost:** Fixed, conservative `maxTokens` bound per call; no per-request cost configurability.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
