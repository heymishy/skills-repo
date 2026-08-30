## Test Plan: Fall back to 'success' per-stage when a journey-wide mock scenario has no fixture for that stage

**Story reference:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | discovery stage falls back to success when e2eMockScenario has no discovery fixture | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | design stage still uses the override where a fixture exists | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | getMockResponse still throws for a genuinely nonexistent scenario | 1 test | — | — | — | — | 🟢 |
| AC4 | e2eForceFailStage behavior unchanged | 1 test | — | — | — | — | 🟢 |

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
| AC1 | A journey object with `e2eMockScenario: 'diagram-showcase'`; `discovery.diagram-showcase.json` (confirmed absent) | Synthetic | None | |
| AC2 | Same journey object; `design.diagram-showcase.json` (confirmed present) | Synthetic | None | |
| AC3 | A scenario name with no fixture for any stage | Synthetic | None | |
| AC4 | A journey object with only `e2eForceFailStage` set | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### hasFixtureReturnsTrueForExistingFixture

- **Verifies:** AC2 (supporting)
- **Precondition:** `design.diagram-showcase.json` exists.
- **Action:** Call `mockGateway.hasFixture('design', 'diagram-showcase')`.
- **Expected result:** Returns `true`.
- **Edge case:** No.

### hasFixtureReturnsFalseForMissingFixture

- **Verifies:** AC1 (supporting)
- **Precondition:** `discovery.diagram-showcase.json` does not exist.
- **Action:** Call `mockGateway.hasFixture('discovery', 'diagram-showcase')`.
- **Expected result:** Returns `false` — does not throw.
- **Edge case:** Yes — proves no throw on a missing file.

### mockScenarioForStageFallsBackToSuccessWhenNoFixtureExistsForThisStage

- **Verifies:** AC1
- **Precondition:** Journey `{ e2eMockScenario: 'diagram-showcase' }`, mock gateway enabled.
- **Action:** Call `journeyRoutes._mockScenarioForStage(journey, 'discovery')`.
- **Expected result:** Returns `undefined` (the caller's own code treats this as `'success'`), not `'diagram-showcase'`.
- **Edge case:** No.

### mockScenarioForStageStillAppliesOverrideWhenFixtureExists

- **Verifies:** AC2
- **Precondition:** Same journey object.
- **Action:** Call `journeyRoutes._mockScenarioForStage(journey, 'design')`.
- **Expected result:** Returns `'diagram-showcase'` — the fallback does not suppress a genuinely applicable override.
- **Edge case:** No.

### unrecognizedScenarioNameStillThrowsWhenCalledDirectly

- **Verifies:** AC3
- **Precondition:** `getMockResponse('design', 'mock', 'nonexistent-scenario-xyz')`.
- **Action:** Call `getMockResponse` directly (bypassing `_mockScenarioForStage` entirely).
- **Expected result:** Still throws "No fixture found" — unchanged from before this story.
- **Edge case:** No.

### e2eForceFailStageBehaviorUnaffectedByThisChange

- **Verifies:** AC4
- **Precondition:** Journey `{ e2eForceFailStage: 'design' }` (no `e2eMockScenario`).
- **Action:** Call `_mockScenarioForStage(journey, 'design')` and `_mockScenarioForStage(journey, 'definition')`.
- **Expected result:** `'design'` → `'failure'`; `'definition'` → `undefined` — identical to pre-existing behavior.
- **Edge case:** No.

---

## Integration Tests

### handlePostJourneyDiscoveryStageUsesSuccessFixtureWhenScenarioOverrideDoesNotApply

- **Verifies:** AC1
- **Components involved:** `handlePostJourney` → `registerHtmlSession` (stubbed) → mock turn resolution
- **Precondition:** POST body with `startSkill: 'discovery'`, `e2eMockScenario: 'diagram-showcase'`; mock gateway enabled.
- **Action:** Call `handlePostJourney`, then simulate the discovery stage's own turn resolution using the captured `mockScenarioName`.
- **Expected result:** The captured `mockScenarioName` is `undefined`, and calling `getMockResponse('discovery', 'mock', mockScenarioName || 'success')` succeeds (does not throw).

### journeyReachingDesignStageAfterDiscoveryStillUsesDiagramShowcase

- **Verifies:** AC2
- **Components involved:** `_mockScenarioForStage` called with the real persisted journey record for a later stage transition
- **Precondition:** A journey record with `e2eMockScenario: 'diagram-showcase'` persisted (as `handlePostJourney` already does).
- **Action:** Call `_mockScenarioForStage(journey, 'design')`.
- **Expected result:** Returns `'diagram-showcase'`.

---

## Out of Scope for This Test Plan

- A live, real-browser walkthrough of the full discovery → benefit-metric → design flow — that is the manual verification this fix exists to unblock, not something this test plan re-performs on itself.

---

## Test Gaps and Risks

None.
