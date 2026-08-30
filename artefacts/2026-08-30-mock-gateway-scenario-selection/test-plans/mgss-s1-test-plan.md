## Test Plan: Let an operator select any mock-gateway scenario when creating a feature, and close two fixture gaps

**Story reference:** artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `e2eMockScenario` applied across every stage of a journey created via `/journey` | 1 test | 2 tests | — | — | — | 🟢 |
| AC2 | Unrecognized scenario name still throws the existing "No fixture found" error | 1 test | — | — | — | — | 🟢 |
| AC3 | `e2eMockScenario` silently ignored when the mock gateway is off | 1 test | — | — | — | — | 🟢 |
| AC4 | `sequence` marker present in `design.diagram-showcase.json` and `definition.diagram-showcase.json` | 2 tests | — | — | — | — | 🟢 |
| AC5 | `clarify.success.json` / `clarify.failure.json` exist and are well-formed | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey record with `e2eMockScenario` set; `design.diagram-showcase.json` (already exists) as the target fixture | Synthetic | None | |
| AC2 | A journey record with `e2eMockScenario` set to a name with no fixture file for the requested stage | Synthetic | None | |
| AC3 | A `handlePostJourney` POST body with `e2eMockScenario` set while `isMockGatewayEnabled()` is stubbed false | Synthetic | None | |
| AC4 | The two fixture files themselves | Synthetic | None | |
| AC5 | The two new fixture files themselves | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### mockScenarioForStageAppliesAcrossEveryStageWhenSet

- **Verifies:** AC1
- **Precondition:** `_mockScenarioForStage` is called (via its export) with a journey object `{ e2eMockScenario: 'diagram-showcase' }` for two different stage names (`'design'`, `'definition'`), with the mock gateway stubbed enabled.
- **Action:** Call the exported `_mockScenarioForStage` for both stage names.
- **Expected result:** Both calls return `'diagram-showcase'`, regardless of stage name — proving the override is journey-wide, not single-stage like `e2eForceFailStage`.
- **Edge case:** No.

### mockScenarioForStagePrioritizesE2eMockScenarioOverForceFailStage

- **Verifies:** AC1 (priority ordering, from the Architecture Constraints)
- **Precondition:** A journey object with BOTH `e2eMockScenario: 'diagram-showcase'` and `e2eForceFailStage: 'design'` set, mock gateway enabled.
- **Action:** Call `_mockScenarioForStage(journey, 'design')`.
- **Expected result:** Returns `'diagram-showcase'`, not `'failure'` — `e2eMockScenario` takes priority when both are set.
- **Edge case:** Yes — priority-ordering case.

### mockScenarioForStageStillSupportsForceFailStageAlone

- **Verifies:** Regression (existing `e2eForceFailStage` behavior must survive this change unmodified)
- **Precondition:** A journey object with only `e2eForceFailStage: 'design'` set (no `e2eMockScenario`), mock gateway enabled.
- **Action:** Call `_mockScenarioForStage(journey, 'design')` and `_mockScenarioForStage(journey, 'definition')`.
- **Expected result:** `'design'` call returns `'failure'`; `'definition'` call returns `undefined` — identical to pre-change behavior.
- **Edge case:** No.

### unrecognizedScenarioNameStillThrowsNoFixtureFoundError

- **Verifies:** AC2
- **Precondition:** `getMockResponse('design', 'mock', 'nonexistent-scenario-xyz')`.
- **Action:** Call `getMockResponse` directly.
- **Expected result:** Throws an error whose message includes `'No fixture found'` and both the stage and scenario name — identical to today's existing behavior for any other unrecognized `(stage, scenarioName)` pair; no new silent fallback path was added.
- **Edge case:** Yes — proves no silent-fallback regression was introduced.

### e2eMockScenarioIgnoredWhenMockGatewayDisabled

- **Verifies:** AC3
- **Precondition:** `isMockGatewayEnabled` stubbed to return `false`; a `handlePostJourney`-style POST body containing `e2eMockScenario: 'diagram-showcase'`.
- **Action:** Call the body-parsing logic that derives the journey's `e2eMockScenario` field the same way `handlePostJourney` does.
- **Expected result:** The derived value is `null`/falsy — identical to how `e2eForceFailStage` is already silently dropped today when the mock gateway is off.
- **Edge case:** No.

### designDiagramShowcaseIncludesSequenceMarker

- **Verifies:** AC4
- **Precondition:** `design.diagram-showcase.json`.
- **Action:** Call `getMockResponse('design', 'mock', 'diagram-showcase')`, then parse every `---CANVAS-JSON: {...}---` marker out of the response text.
- **Expected result:** At least one parsed marker has `type === 'sequence'` with valid `content.mermaid` (`sequenceDiagram` syntax), in addition to the pre-existing `system-architecture` and `data-model` markers (both still present, unmodified).
- **Edge case:** No.

### definitionDiagramShowcaseIncludesSequenceMarker

- **Verifies:** AC4
- **Precondition:** `definition.diagram-showcase.json`.
- **Action:** Same as above, for `getMockResponse('definition', 'mock', 'diagram-showcase')`.
- **Expected result:** At least one parsed marker has `type === 'sequence'`, in addition to the pre-existing `program-design` and `data-model` markers (both still present, unmodified).
- **Edge case:** No.

### clarifySuccessFixtureIsWellFormed

- **Verifies:** AC5
- **Precondition:** `clarify.success.json`.
- **Action:** Call `getMockResponse('clarify', 'mock', 'success', 0)` and `getMockResponse('clarify', 'mock', 'success', 1)` (two turns, matching the `responses[]` multi-turn convention).
- **Expected result:** Turn 0's text contains a `Q:`-shaped clarifying question (matching `/clarify`'s own SKILL.md "Present questions" format); turn 1's text contains the SKILL.md's own completion phrase ("Clarification complete"). Neither turn contains a `CANVAS-JSON` marker (matches Out of Scope — `/clarify` never emits one for real).
- **Edge case:** No.

### clarifyFailureFixtureIsWellFormed

- **Verifies:** AC5
- **Precondition:** `clarify.failure.json`.
- **Action:** Call `getMockResponse('clarify', 'mock', 'failure')`.
- **Expected result:** Response text matches `/clarify`'s own entry-condition failure message shape ("No discovery artefact found").
- **Edge case:** No.

---

## Integration Tests

### handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession

- **Verifies:** AC1
- **Components involved:** `handlePostJourney` → `registerHtmlSession` (stubbed) → the session's own `mockScenarioName` field
- **Precondition:** A POST body with `featureName`, `startSkill: 'discovery'`, `e2eMockScenario: 'diagram-showcase'`; mock gateway stubbed enabled; `registerHtmlSession` stubbed to capture its `options` argument.
- **Action:** Call `handlePostJourney(req, res)`.
- **Expected result:** The captured `options.mockScenarioName` for the first (discovery) stage session is `'diagram-showcase'` (note: `discovery.diagram-showcase.json` does not exist, so this specific combination would throw at actual-turn time — this integration test asserts only that the value was correctly threaded through session creation, matching the unit-level scope of "wiring," not a live turn).

### handlePostJourneyPersistsE2eMockScenarioOnTheJourneyRecordForLaterStages

- **Verifies:** AC1
- **Components involved:** `handlePostJourney` → `_journeyStore.setJourneyFields`
- **Precondition:** Same POST body as above.
- **Action:** Call `handlePostJourney(req, res)`, then read the journey record back via `_journeyStore.getJourney(journeyId)`.
- **Expected result:** `journey.e2eMockScenario === 'diagram-showcase'` — confirming a later stage transition (e.g. reaching `design`) will resolve via `_mockScenarioForStage(journey, 'design')` returning `'diagram-showcase'`, and therefore reach `design.diagram-showcase.json` (which DOES exist and DOES now include a `sequence` marker, per AC4).

---

## NFR Tests

### e2eMockScenarioNeverActivatesInProduction

- **NFR addressed:** Security
- **Measurement method:** With `NODE_ENV=production` and `e2eMockScenario` present in the POST body, confirm `isMockGatewayEnabled()` returns `false` (existing hard override, unmodified) and therefore the derived `e2eMockScenario` value is `null`.
- **Pass threshold:** Never active in production, regardless of any other flag.
- **Tool:** Node test runner.

---

## Out of Scope for This Test Plan

- `handlePostProductFeature` (routes/products.js) — not touched by this story, per its own Out of Scope section.
- A live, real-model verification that a `sequence` marker actually renders correctly end-to-end through a real browser session using this new scenario-selection mechanism — that is exactly the kind of manual/Chrome verification this story exists to newly *enable*, not something this story's own test plan needs to perform on itself.

---

## Test Gaps and Risks

None.
