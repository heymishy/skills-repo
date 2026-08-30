# Contract Proposal: Mock-gateway scenario selection and fixture gaps

**Story reference:** artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- Generalize `src/web-ui/routes/journey.js`'s `_mockScenarioForStage(journey, stageName)`: when `journey.e2eMockScenario` is set, return it directly (applies to every stage), taking priority over the existing single-stage `e2eForceFailStage`/`'failure'` check, which is otherwise unchanged.
- Export `_mockScenarioForStage` from `journey.js` (currently module-private) so it is directly unit-testable and so future callers can reuse it without duplicating the priority logic.
- `handlePostJourney`: read `body.e2eMockScenario` (gated by `isMockGatewayEnabled()`, mirroring the existing `e2eForceFailStage` line exactly), thread it into the first stage's `registerHtmlSession(...)` options via `_mockScenarioForStage`, and persist it onto the journey record via `setJourneyFields` so later stage transitions (which already call `_mockScenarioForStage(journey, stageName)` with the real persisted journey object) pick it up automatically with zero further changes to those call sites.
- `handleGetJourney` / `_renderJourneyHome`: read an optional `?mockScenario=<name>` query param and, when present, render one hidden `<input type="hidden" name="e2eMockScenario" value="...">` inside the existing new-feature `<form>` — no visible field, no new UI control.
- Add a `sequence`-type `CANVAS-JSON` marker to `tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json` and `tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json`, alongside their existing marker(s) (both existing markers are kept, unmodified).
- Add `tests/e2e/fixtures/llm-gateway/clarify.success.json` (a 2-turn `responses[]` fixture: a clarifying question, then a completion message) and `tests/e2e/fixtures/llm-gateway/clarify.failure.json` (an entry-condition failure message), matching the file-naming and JSON-shape convention every other stage already uses.

## What will NOT be built

- No change to `routes/products.js`'s `handlePostProductFeature` — see the story's own Out of Scope section.
- No `clarify.diagram-showcase` fixture, and no `sequence` marker added to `ideate.diagram-showcase.json` — see the story's own Out of Scope section.
- No visible "Mock scenario" UI control.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Call the exported `_mockScenarioForStage` directly across stages; integration-test `handlePostJourney`'s threading into both the first session and the persisted journey record | Unit + Integration |
| AC2 | Call `getMockResponse` with an unrecognized scenario name; assert the existing "No fixture found" error still fires | Unit |
| AC3 | Call the body-parsing logic with the mock gateway stubbed disabled; assert `e2eMockScenario` is dropped | Unit |
| AC4 | Call `getMockResponse` for `design`/`definition` `diagram-showcase`; parse markers; assert a `sequence` marker is present alongside the pre-existing one(s) | Unit |
| AC5 | Call `getMockResponse('clarify', 'mock', 'success'|'failure', ...)`; assert well-formed Q&A/completion or failure text | Unit |

## Assumptions

- **Priority ordering (`e2eMockScenario` over `e2eForceFailStage`):** when both are set on the same journey (an unusual, deliberately-contrived combination — normal usage sets only one), `e2eMockScenario` wins. This is the more general override and the newer, more specific operator intent in that combination; `e2eForceFailStage` alone remains fully functional and unchanged for the (far more common) single-stage-failure-only case.
- **`e2eMockScenario` is journey-wide, not per-stage:** unlike `e2eForceFailStage` (which names exactly one stage), `e2eMockScenario` applies uniformly to every stage of the journey that has a matching fixture file, and lets `_loadFixtureFile`'s existing "No fixture found" error surface naturally for any stage that doesn't (AC2) — this matches the story's own stated intent (an operator wants `diagram-showcase` behavior across `design` AND `definition`, not just one).

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (`_mockScenarioForStage`, `handlePostJourney`, `handleGetJourney`/`_renderJourneyHome`, module exports), `tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json`, `tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json`, `tests/e2e/fixtures/llm-gateway/clarify.success.json` (new), `tests/e2e/fixtures/llm-gateway/clarify.failure.json` (new). Services: none. APIs: none — internal test/dev-tooling only.
