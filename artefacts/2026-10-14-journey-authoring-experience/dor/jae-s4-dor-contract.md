# DoR Contract: jae-s4

**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s4.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s4-test-plan.md

## What will be built

- `src/web-ui/adapters/field-suggestion-ai.js` (new) — a D37 injectable adapter mirroring `artefact-fetcher.js`'s own `fetchRepoPath`/`setFetchRepoPath`/`getFetchRepoPath` pattern exactly: `generateAiFieldSuggestion(stageContext, field)` / `setGenerateAiFieldSuggestion(impl)` / `getGenerateAiFieldSuggestion()`, unwired default throws `'Adapter not wired: generateAiFieldSuggestion. Call setGenerateAiFieldSuggestion() with a real implementation before use.'`, plus a separately-exported `realGenerateAiFieldSuggestion(stageContext, field)` that builds a tightly-scoped system prompt (field name, stage name, journey name, linked feature context if any) and calls `skillTurnExecutor(systemPrompt, [], 'Begin.', null, {})` from `src/modules/skill-turn-executor.js`, unmodified, with a small fixed `maxTokens` override.
- A new route `GET /journeys/stages/:stageId/ai-suggestion` (query param `field`) in `journeys.js`, calling `generateAiFieldSuggestion` with tenant-scoped stage/journey context already loaded the same way every other stage-scoped route in this file loads it. Returns `{suggestion: string|null}` — `null` on any adapter error/empty result (never a 5xx for "no suggestion available").
- Client-side: when the panel opens, for each of `customer_actions`/`pain_points` that has NEITHER a real value NOR a deterministic (`jae-s3`) suggestion, fetch the new endpoint; if it returns a non-null suggestion, render a suggestion button reusing `sw-field-suggestion-btn`'s own markup/click-delegation with an added `sw-field-suggestion-btn--ai` class and a short "AI suggestion" label prefix to visually distinguish it from a deterministic suggestion (MC-A11Y-02: label text, not colour alone).
- `setGenerateAiFieldSuggestion(realGenerateAiFieldSuggestion)` wired in `server.js`, guarded by `process.env.NODE_ENV !== 'test'`, in the same block/style as the `wugs-s1`/`pr-s2` D37 wiring calls already there.

## What will NOT be built

- No change to `jae-s3`'s own `getFieldSuggestions`/`extractProblemStatement` — read, not modified.
- No change to `handleGetJourneyCanvas` — confirmed by AC1a's own dedicated test.
- No streaming (`skillTurnExecutorStream` is not used).
- No rate-limiting/quota mechanism.
- No suggestion caching/persistence beyond the field's own eventual saved value.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: mocked `fetch` to the new endpoint returning a suggestion; assert button renders with the AI-distinguishing class/label and click-to-fill works | unit |
| AC1a | Unit: call `handleGetJourneyCanvas` with an instrumented `generateAiFieldSuggestion` mock; assert zero calls | unit |
| AC2 | Unit: a field with a deterministic suggestion already present; assert the `ai-suggestion` endpoint is never called for that field | unit |
| AC3 | Unit: click the AI suggestion button; assert field value set, no PATCH until blur | unit |
| AC4 | Integration: route handler called twice with two different stage contexts, underlying `skillTurnExecutor` call mocked as an input-dependent (not constant) function; assert the two results differ and are each traceable to their own input | integration |
| AC5 | Unit: two sub-cases — adapter rejects; adapter resolves to null/empty — assert no button, no error UI, in both | unit |
| AC6 | Unit: call the adapter's unwired default directly; assert it throws the exact D37 message | unit |

## Assumptions

- Stage/journey context (name, linked feature slug if any) needed for prompt-building is already available to `journeys.js`'s own request-handling code at the point the new route would need it — no new query shape beyond what's already loaded for the canvas/panel today, confirmed by reading the existing stage-lookup query `handlePatchJourneyStage` already uses as the template for the new route's own tenant-scoped stage fetch.
- `skillTurnExecutor`'s existing `ANTHROPIC_API_KEY`-unset error (a thrown rejection) is caught by `realGenerateAiFieldSuggestion` and translated into a `null` return (per AC5), not re-thrown to the route handler as a 5xx.

## Estimated touch points

Files: `src/web-ui/adapters/field-suggestion-ai.js` (new), `src/web-ui/routes/journeys.js` (new route handler, new client-side fetch-on-open + render logic, new CSS class), `src/web-ui/server.js` (new D37 wiring block), `tests/check-jae-s4-ai-field-suggestion.js` (new)
Services: none new
APIs: one new route (`GET /journeys/stages/:stageId/ai-suggestion`); `skillTurnExecutor` reused unmodified
