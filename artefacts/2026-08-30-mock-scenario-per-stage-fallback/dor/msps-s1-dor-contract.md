# Contract Proposal: Per-stage fixture-existence fallback

**Story reference:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- Add `hasFixture(stage, scenarioName)` to `src/web-ui/modules/mock-llm-gateway.js`: `fs.existsSync` against the same fixture-file-naming convention `_loadFixtureFile` already uses, exported alongside `getMockResponse`.
- Change `journey.js`'s `_mockScenarioForStage`: when `journey.e2eMockScenario` is set, apply it only if `_mockLlmGateway.hasFixture(stageName, journey.e2eMockScenario)` is true; otherwise fall through exactly as if `e2eMockScenario` were unset for that stage (still checking `e2eForceFailStage` next, then `undefined`).

## What will NOT be built

- No change to `getMockResponse`'s own throw-on-unrecognized-scenario behavior.
- No pass-through `discovery.diagram-showcase.json` / `benefit-metric.diagram-showcase.json` fixture files.
- No change to `routes/products.js`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Call `_mockScenarioForStage` for `discovery` with `e2eMockScenario` set; assert `undefined` returned | Unit + Integration |
| AC2 | Call `_mockScenarioForStage` for `design` with the same journey; assert the override still applies | Unit + Integration |
| AC3 | Call `getMockResponse` directly with a nonexistent scenario name; assert it still throws | Unit |
| AC4 | Call `_mockScenarioForStage` with only `e2eForceFailStage` set; assert unchanged behavior | Unit |

## Assumptions

- `hasFixture`'s file-naming convention must match `_fixtureFileName`'s private helper exactly (`stage + '.' + scenarioName + '.json'`) — reusing that same internal function directly (already private to the module, called from within) rather than duplicating the string-concatenation logic.

## Estimated touch points

Files: `src/web-ui/modules/mock-llm-gateway.js` (new `hasFixture` export), `src/web-ui/routes/journey.js` (`_mockScenarioForStage`). Services: none. APIs: none.
