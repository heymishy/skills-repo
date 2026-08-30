# Definition of Done: Mock-gateway scenario selection and fixture gaps

**PR:** #797 — "mgss-s1: Mock-gateway scenario selection and fixture gaps" | **Merged:** 2026-08-30 (08:40:09Z)
**Story:** artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
**Test plan:** artefacts/2026-08-30-mock-gateway-scenario-selection/test-plans/mgss-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-30-mock-gateway-scenario-selection/dor/mgss-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `mockScenarioForStageAppliesAcrossEveryStageWhenSet`, `handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession`, `handlePostJourneyPersistsE2eMockScenarioOnTheJourneyRecordForLaterStages`, `handleGetJourneyRendersHiddenMockScenarioFieldWhenQueryParamPresent` — all passing | `tests/check-mgss-s1-mock-gateway-scenario-selection.js` (unit + integration) | None |
| AC2 | ✅ | `unrecognizedScenarioNameStillThrowsNoFixtureFoundError` | Same file (unit) | None |
| AC3 | ✅ | `e2eMockScenarioIgnoredWhenMockGatewayDisabled`, `e2eMockScenarioNeverActivatesInProduction` | Same file (unit + NFR) | None |
| AC4 | ✅ | `designDiagramShowcaseIncludesSequenceMarker`, `definitionDiagramShowcaseIncludesSequenceMarker` | Same file (unit) | None |
| AC5 | ✅ | `clarifySuccessFixtureIsWellFormed`, `clarifyFailureFixtureIsWellFormed` | Same file (unit) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The story's own Out of Scope items (`routes/products.js`'s separate creation path, a `clarify.diagram-showcase` fixture, a `sequence` example in `ideate.diagram-showcase.json`) were not touched, as intended.

**Notable, but not a scope deviation:** implementing this story required updating a *pre-existing* test file (`tests/check-mds-s1-diagram-showcase-fixtures.js`) — its own AC2/AC3/AC6 assertions hard-asserted exactly 2 markers per fixture, which this story's AC4 (adding a 3rd `sequence` marker) necessarily changed. This was anticipated in the implementation plan's own Task 5 note and is a mechanical, expected consequence of AC4, not scope creep.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10 (test plan named 10 tests; 4 additional tests were added during implementation for full coverage — see DoD Observations)
**Tests passing in CI:** 14 / 14

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| mockScenarioForStageAppliesAcrossEveryStageWhenSet | ✅ | ✅ | |
| mockScenarioForStagePrioritizesE2eMockScenarioOverForceFailStage | ✅ | ✅ | |
| mockScenarioForStageStillSupportsForceFailStageAlone | ✅ | ✅ | Regression test, not in original test plan |
| unrecognizedScenarioNameStillThrowsNoFixtureFoundError | ✅ | ✅ | |
| e2eMockScenarioIgnoredWhenMockGatewayDisabled | ✅ | ✅ | |
| designDiagramShowcaseIncludesSequenceMarker | ✅ | ✅ | |
| definitionDiagramShowcaseIncludesSequenceMarker | ✅ | ✅ | |
| clarifySuccessFixtureIsWellFormed | ✅ | ✅ | |
| clarifyFailureFixtureIsWellFormed | ✅ | ✅ | |
| e2eMockScenarioNeverActivatesInProduction | ✅ | ✅ | |
| handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession | ✅ | ✅ | Integration test from test plan |
| handlePostJourneyPersistsE2eMockScenarioOnTheJourneyRecordForLaterStages | ✅ | ✅ | Integration test from test plan |
| handleGetJourneyRendersHiddenMockScenarioFieldWhenQueryParamPresent | ✅ | ✅ | Added during implementation (Task 3) — not named in the original test plan, which described this behavior only implicitly under AC1 |
| handleGetJourneyRendersNoHiddenFieldWhenQueryParamAbsent | ✅ | ✅ | Added during implementation (Task 3), negative-case companion to the above |

**Full suite:** 574/574 files passing, 0 failures (`node scripts/run-all-tests.js`, re-run 2026-08-30 against merged master tip).

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new latency/model calls | ✅ | Fixture-selection logic only; no new async call sites introduced |
| `e2eMockScenario` never activates in production | ✅ | `e2eMockScenarioNeverActivatesInProduction` confirms `isMockGatewayEnabled()` returns `false` under `NODE_ENV=production` and the derived value is dropped |
| Data classification: Internal | ✅ | Test/dev tooling flag only, no new data category |

---

## Metric Signal

Short-track story — no formal benefit-metric artefact exists (per H5 in the DoR). No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. A natural, bounded follow-up (extending `routes/products.js`'s `handlePostProductFeature` to also support `e2eMockScenario`) was explicitly scoped out — see the story's own Out of Scope section — and is not tracked as a blocking gap.

---

## DoD Observations

1. **Pre-existing E2E failures found during route-coverage checking, confirmed unrelated:** `/verify-completion`'s mandatory route/handler E2E check (this story touches `src/web-ui/routes/journey.js`) surfaced 8 failing tests (`reference-upload.spec.js` T9–T15, `dsda-s1-default-all-stories.spec.js` AC3). Root-caused via baseline comparison (`git stash` + re-run): both failures reproduce identically on unmodified `master`, confirming they predate this story and are unrelated to its diff. Not fixed here (out of scope for this story) — worth a separate investigation if these E2E specs are relied upon elsewhere, since they appear to have been silently broken for some time.
2. **Test-plan estimate undercounted the actual implementation by 4 tests** (10 planned vs. 14 shipped) — all 4 additions are legitimate (1 regression-safety test for the pre-existing `e2eForceFailStage` path, 1 hidden-field-rendering test pair, 1 already covered by the plan but split into positive/negative cases). Not a quality problem, but worth noting for `/estimate`'s E3 pass if this repo tracks test-count-vs-plan variance.
3. **This story exists because of a real gap found during S5's own DoD verification attempt**: the mock LLM gateway was found to be globally enabled on staging, and no live mechanism existed to trigger anything but the default `'success'` fixture — blocking genuine live-model AC1/AC2 verification for `s5-sequence-diagram-type`. This story's completion is what unblocks that follow-up verification, now that `?mockScenario=diagram-showcase` is live on `/journey?new=1`. Candidate `/improve` signal: consider whether other stories with a similar "live-model judgment call, RISK-ACCEPTed to post-merge manual verification" AC shape would also benefit from this mechanism being documented in the standard DoR/verification-script templates, rather than being discovered ad hoc each time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Mock-gateway scenario selection and fixture gaps.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
