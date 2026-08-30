# Mock-gateway scenario selection and fixture gaps — Implementation Plan

> **For agent execution:** Single session — /tdd per task.

**Goal:** Generalize `_mockScenarioForStage` to support a journey-wide `e2eMockScenario` override, thread it through `handlePostJourney`/`handleGetJourney`, add a `sequence` marker to the design/definition diagram-showcase fixtures, and add missing `clarify` fixtures.
**Branch:** `feature/mgss-s1`
**Worktree:** `.worktrees/mgss-s1`
**Test command:** `node tests/check-mgss-s1-mock-gateway-scenario-selection.js` (story suite) / `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  tests/check-mgss-s1-mock-gateway-scenario-selection.js — story test suite (AC1-AC3)
  tests/e2e/fixtures/llm-gateway/clarify.success.json     — new fixture (AC5)
  tests/e2e/fixtures/llm-gateway/clarify.failure.json     — new fixture (AC5)

Modify:
  src/web-ui/routes/journey.js                            — _mockScenarioForStage, handlePostJourney, handleGetJourney/_renderJourneyHome, exports
  tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json     — add sequence marker (AC4)
  tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json — add sequence marker (AC4)
```

---

## Task 1: Generalize `_mockScenarioForStage` and export it (AC1 unit-level, regression)

**Files:** `src/web-ui/routes/journey.js`, `tests/check-mgss-s1-mock-gateway-scenario-selection.js` (new)

- [ ] Write failing tests: `mockScenarioForStageAppliesAcrossEveryStageWhenSet`, `mockScenarioForStagePrioritizesE2eMockScenarioOverForceFailStage`, `mockScenarioForStageStillSupportsForceFailStageAlone` — all call `journeyRoutes._mockScenarioForStage(...)`, which does not exist yet (not exported) — expect `TypeError: ... is not a function`.
- [ ] Implement: change the function body to check `journey.e2eMockScenario` first; add `_mockScenarioForStage` to `module.exports`.
- [ ] Run — all 3 pass.
- [ ] Commit: `feat(mgss-s1): generalize _mockScenarioForStage for a journey-wide e2eMockScenario override (AC1)`

## Task 2: Thread `e2eMockScenario` through `handlePostJourney` (AC1 integration, AC3)

**Files:** `src/web-ui/routes/journey.js`, story test file

- [ ] Write failing tests: `handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession`, `handlePostJourneyPersistsE2eMockScenarioOnTheJourneyRecordForLaterStages`, `e2eMockScenarioIgnoredWhenMockGatewayDisabled`.
- [ ] Implement: mirror the existing `e2eForceFailStage` line exactly — read `body.e2eMockScenario`, gate on `isMockGatewayEnabled()`, pass into the first-stage `_mockScenarioForStage({ e2eForceFailStage, e2eMockScenario }, startSkill)` call and into `setJourneyFields`.
- [ ] Run — all pass.
- [ ] Commit: `feat(mgss-s1): thread e2eMockScenario through handlePostJourney (AC1, AC3)`

## Task 3: Query-param → hidden field on the New Feature page (AC1, manual-reachability)

**Files:** `src/web-ui/routes/journey.js`

- [ ] No new automated test beyond what Task 2 already covers at the handler level (the hidden-field rendering itself is a thin HTML-string change; verified by direct string inspection in the same story test file: `handleGetJourneyRendersHiddenMockScenarioFieldWhenQueryParamPresent`).
- [ ] Write that one failing test first, then implement: read `req.query.mockScenario`, pass to `_renderJourneyHome`, render the hidden input inside the existing `<form>` when non-empty.
- [ ] Run — passes.
- [ ] Commit: `feat(mgss-s1): render hidden e2eMockScenario field from ?mockScenario= query param (AC1)`

## Task 4: `getMockResponse` unrecognized-scenario regression (AC2)

**Files:** story test file only (no production code change expected — this is a regression-proof test)

- [ ] Write `unrecognizedScenarioNameStillThrowsNoFixtureFoundError` — expect it to already pass (proves no accidental fallback was introduced by Tasks 1-3).
- [ ] Run — confirm pass with zero production code changes in this task.
- [ ] Commit: `test(mgss-s1): regression test confirming no silent fixture fallback was introduced (AC2)`

## Task 5: Add `sequence` marker to design/definition diagram-showcase fixtures (AC4)

**Files:** `tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json`, `tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json`

- [ ] Write failing tests: `designDiagramShowcaseIncludesSequenceMarker`, `definitionDiagramShowcaseIncludesSequenceMarker`.
- [ ] Implement: append a `sequence`-type CANVAS-JSON marker with valid `sequenceDiagram` mermaid content to each fixture's `response` string, after the existing marker(s), keeping those unmodified.
- [ ] Run — both pass. Also re-run `tests/check-mds-s1-diagram-showcase-fixtures.js` in full to confirm the pre-existing mds-s1 tests (which assert exact marker counts per fixture) still pass or are updated if they assert an exact count — check that file's AC2/AC3 assertions before assuming no update needed.
- [ ] Commit: `feat(mgss-s1): add sequence marker to design/definition diagram-showcase fixtures (AC4)`

## Task 6: Add `clarify.success.json` / `clarify.failure.json` (AC5)

**Files:** `tests/e2e/fixtures/llm-gateway/clarify.success.json` (new), `tests/e2e/fixtures/llm-gateway/clarify.failure.json` (new)

- [ ] Write failing tests: `clarifySuccessFixtureIsWellFormed`, `clarifyFailureFixtureIsWellFormed`.
- [ ] Implement: write both fixture files per the test-plan's specified shape.
- [ ] Run — both pass.
- [ ] Commit: `feat(mgss-s1): add missing clarify.success/failure mock-gateway fixtures (AC5)`

## Task 7: NFR test, full-suite regression, draft PR

- [ ] Write `e2eMockScenarioNeverActivatesInProduction`.
- [ ] Run full story suite — all pass.
- [ ] Run `node scripts/run-all-tests.js` — 0 failures.
- [ ] Open draft PR.
