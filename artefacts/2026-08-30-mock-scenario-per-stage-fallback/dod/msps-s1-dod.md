# Definition of Done: Per-stage fixture-existence fallback for e2eMockScenario

**PR:** #798 — "msps-s1: Per-stage fixture-existence fallback for e2eMockScenario" | **Merged:** 2026-08-30 (09:31:55Z)
**Story:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
**Test plan:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/test-plans/msps-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/dor/msps-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `hasFixtureReturnsFalseForMissingFixture`, `mockScenarioForStageFallsBackToSuccessWhenNoFixtureExistsForThisStage` | Unit | None |
| AC2 | ✅ | `hasFixtureReturnsTrueForExistingFixture`, `mockScenarioForStageStillAppliesOverrideWhenFixtureExists` | Unit | None |
| AC3 | ✅ | `unrecognizedScenarioNameStillThrowsWhenCalledDirectly` | Unit | None |
| AC4 | ✅ | `e2eForceFailStageBehaviorUnaffectedByThisChange` | Unit | None |

---

## Scope Deviations

None. Correcting the pre-existing `mgss-s1` test that had encoded the bug (using `ideate` instead of `discovery` in `handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession`) was anticipated by this story's own diagnosis and is not a scope deviation — it's the direct, necessary consequence of fixing the behavior that test was asserting incorrectly.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6

**Full suite:** 575/575 files passing, 0 failures (re-run 2026-08-30 against merged master tip).

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Negligible added cost | ✅ | One `fs.existsSync` call per stage-session creation, only when `e2eMockScenario` is set |
| No weakening of production hard override | ✅ | `hasFixture` is a pure read-only check; `isMockGatewayEnabled()`'s production override is untouched |

---

## Metric Signal

Short-track story — no formal benefit-metric artefact. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This unblocks the live Chrome verification of `s5-sequence-diagram-type`'s deferred AC1/AC2, which is the next action once this deploys to staging.

---

## DoD Observations

1. **This story is a direct product of live verification catching a real defect before it caused wider confusion** — `mgss-s1` merged with a passing test suite, yet the very first real attempt to use it live (via Chrome) failed immediately. The pre-existing unit test that "proved" the broken behavior correct (`handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession`, asserting `discovery` + `diagram-showcase` should thread through) is itself a case worth remembering: a test can be internally consistent and still assert the wrong thing when it never has to reckon with which stages *actually* have which fixtures. Candidate `/improve` signal: for any test asserting fixture-selection logic, prefer parameterizing over the fixture set that genuinely exists (e.g. `mockGateway.inventoryFixtures()`) rather than a single hardcoded example, so a fixture-shape assumption baked into the test can't silently drift from reality.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Per-stage fixture-existence fallback for e2eMockScenario.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
