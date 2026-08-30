# Per-stage fixture-existence fallback — Implementation Plan

> **For agent execution:** Single session — /tdd per task.

**Goal:** Fall back to `undefined` (→ `'success'`) when `journey.e2eMockScenario` has no fixture for the current stage, instead of applying it unconditionally.
**Branch:** `feature/msps-s1`
**Worktree:** `.worktrees/msps-s1`
**Test command:** `node tests/check-msps-s1-per-stage-fixture-fallback.js` / `node scripts/run-all-tests.js`

---

## File map

```
Create:
  tests/check-msps-s1-per-stage-fixture-fallback.js — story test suite (AC1-AC4)

Modify:
  src/web-ui/modules/mock-llm-gateway.js — add hasFixture(stage, scenarioName)
  src/web-ui/routes/journey.js          — _mockScenarioForStage consults hasFixture
```

---

## Task 1: Add `hasFixture` and wire it into `_mockScenarioForStage`

- [ ] Write failing tests (all 6 from the test plan) in `tests/check-msps-s1-per-stage-fixture-fallback.js`.
- [ ] Implement `hasFixture` in `mock-llm-gateway.js`:
  ```js
  function hasFixture(stage, scenarioName) {
    var fileName = _fixtureFileName(stage, scenarioName);
    return fs.existsSync(path.join(FIXTURE_DIR, fileName));
  }
  ```
  Export it alongside `getMockResponse`.
- [ ] Update `_mockScenarioForStage` in `journey.js`:
  ```js
  function _mockScenarioForStage(journey, stageName) {
    if (!_mockLlmGateway.isMockGatewayEnabled()) return undefined;
    if (journey && journey.e2eMockScenario && _mockLlmGateway.hasFixture(stageName, journey.e2eMockScenario)) {
      return journey.e2eMockScenario;
    }
    if (journey && journey.e2eForceFailStage === stageName) return 'failure';
    return undefined;
  }
  ```
- [ ] Run story suite — all pass.
- [ ] Run full suite — 0 regressions.
- [ ] Commit: `fix(msps-s1): fall back to success per-stage when e2eMockScenario has no fixture (AC1-AC4)`
- [ ] Open draft PR.
