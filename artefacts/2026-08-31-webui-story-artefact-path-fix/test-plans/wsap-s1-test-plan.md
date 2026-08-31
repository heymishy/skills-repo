## Test Plan: Align Web UI test-plan/DoR artefact save paths and Step-1 scanner with the canonical per-story convention

**Story reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s1-align-webui-story-scoped-artefact-paths.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | linkSessionToJourney sets session.currentStoryId | 1 test | — | — | — | — | 🟢 |
| AC2 | test-plan path is per-story (non-streaming) | 1 test | — | — | — | — | 🟢 |
| AC3 | definition-of-ready path is per-story (non-streaming) | 1 test | — | — | — | — | 🟢 |
| AC4 | no currentStoryId -> flat path fallback (regression) | 2 tests | — | — | — | — | 🟢 |
| AC5 | computeStep1Summary finds multiple test-plan entries in test-plans/ | 1 test | — | — | — | — | 🟢 |
| AC6 | computeStep1Summary finds DoR entries in dor/ | 1 test | — | — | — | — | 🟢 |
| AC7 | streaming handler produces identical per-story paths | 2 tests | — | — | — | — | 🟢 |
| AC8 | alrf-s8 suite unmodified, still 4/4 passing | — | 1 full-file run | — | — | — | 🟢 |

---

## Coverage gaps

None. `_setHtmlSession`/`_getHtmlSession` (already used by `alrf-s8`'s own test file) allow setting `currentStoryId` directly on a session without needing to mock the real `journey-store` module for AC2-AC4/AC7. AC1 uses the real `journey-store` module's own `createJourney`/`setJourneyFields` (already exported, already used implicitly elsewhere) to seed a real journey with `stories`/`currentStoryIndex`, avoiding any new mocking infrastructure.

---

## Unit Tests

### linkSessionToJourneySetsCurrentStoryId

- **Verifies:** AC1
- **Precondition:** A real journey created via `journeyStore.createJourney(slug)`, then `journeyStore.setJourneyFields(journeyId, { stories: [{id:'s1'},{id:'s2'}], currentStoryIndex: 1 })`. A registered HTML session with no `currentStoryId` yet.
- **Action:** Call `linkSessionToJourney(sessionId, journeyId)`.
- **Expected result:** `_getHtmlSession(sessionId).currentStoryId === 's2'`.
- **Edge case:** No.

### testPlanArtefactPathIsPerStory

- **Verifies:** AC2
- **Precondition:** `_setHtmlSession` with `skillName: 'test-plan'`, `featureSlug: 'wsap-repro-feature'`, `currentStoryId: 's2'`.
- **Action:** Drive one turn through `htmlSubmitTurn` with a fixture response containing an artefact block (any `---SLUG---` value — must be ignored).
- **Expected result:** `session.artefactPath === 'artefacts/wsap-repro-feature/test-plans/s2-test-plan.md'`.
- **Edge case:** Yes — this is the actual gap the story closes (previously would have been the flat `artefacts/wsap-repro-feature/test-plan.md`, silently shared across every story).

### dorArtefactPathIsPerStory

- **Verifies:** AC3
- **Precondition:** Same as above but `skillName: 'definition-of-ready'`.
- **Action:** Same.
- **Expected result:** `session.artefactPath === 'artefacts/wsap-repro-feature/dor/s2-dor.md'`.
- **Edge case:** Yes.

### noCurrentStoryIdFallsBackToFlatPath (test-plan)

- **Verifies:** AC4 (part 1)
- **Precondition:** `_setHtmlSession` with `skillName: 'test-plan'`, `featureSlug: 'wsap-standalone-feature'`, no `currentStoryId`.
- **Action:** Drive one turn through `htmlSubmitTurn`.
- **Expected result:** `session.artefactPath === 'artefacts/wsap-standalone-feature/test-plan.md'` — unchanged flat path, no regression.
- **Edge case:** No — regression guard.

### noCurrentStoryIdFallsBackToFlatPath (definition-of-ready)

- **Verifies:** AC4 (part 2)
- **Precondition:** Same as above but `skillName: 'definition-of-ready'`.
- **Action:** Same.
- **Expected result:** `session.artefactPath === 'artefacts/wsap-standalone-feature/definition-of-ready.md'` — unchanged.
- **Edge case:** No — regression guard.

### step1SummaryFindsTestPlanEntriesInSubdir

- **Verifies:** AC5
- **Precondition:** A temp repo root with `artefacts/[slug]/test-plans/s1-test-plan.md` and `s2-test-plan.md` written to real files.
- **Action:** Call `computeStep1Summary(slug, 'test-plan', tempRoot)`.
- **Expected result:** Returned string contains both `s1` and `s2`, and does NOT contain "no prior test-plan artefacts found".
- **Edge case:** Yes — this is the actual gap the story closes (previously always reported "no prior artefacts").

### step1SummaryFindsDorEntriesInSubdir

- **Verifies:** AC6
- **Precondition:** A temp repo root with `artefacts/[slug]/dor/s1-dor.md` written to a real file.
- **Action:** Call `computeStep1Summary(slug, 'definition-of-ready', tempRoot)`.
- **Expected result:** Returned string contains `s1` and does NOT contain "no prior DoR artefacts found".
- **Edge case:** Yes.

### step1SummaryPathTraversalGuard

- **Verifies:** Implicit NFR-security carryover from the existing `review` branch's own guard pattern.
- **Precondition:** A `featureSlug` value containing `../` segments.
- **Action:** Call `computeStep1Summary(maliciousSlug, 'test-plan', tempRoot)`.
- **Expected result:** Returns the safe "no prior artefacts" fallback string; never throws; never reads outside `tempRoot/artefacts/`.
- **Edge case:** Yes — security guard.

### streamingHandlerTestPlanPathIsPerStory

- **Verifies:** AC7 (part 1)
- **Precondition:** Same session setup as `testPlanArtefactPathIsPerStory`, driven through `handlePostTurnStreamHtml` instead (via `setSkillTurnExecutorStreamAdapter`, mirroring `alrf-s8`'s own AC3/AC4 pattern).
- **Action:** Drive one streaming turn with an artefact block.
- **Expected result:** Same `artefacts/[slug]/test-plans/s2-test-plan.md` path as the non-streaming case.
- **Edge case:** No.

### streamingHandlerDorPathIsPerStory

- **Verifies:** AC7 (part 2)
- **Precondition:** Same, `skillName: 'definition-of-ready'`.
- **Action:** Same.
- **Expected result:** Same `artefacts/[slug]/dor/s2-dor.md` path as the non-streaming case.
- **Edge case:** No.

### alrfS8SuiteUnaffected

- **Verifies:** AC8
- **Precondition:** None.
- **Action:** `node tests/check-alrf-s8-journey-slug-priority.js`.
- **Expected result:** 4/4 ACs still pass, file unmodified.
- **Edge case:** No — regression guard.

### fullSuiteRegressionUnaffected

- **Verifies:** Implicit regression coverage.
- **Precondition:** None — full suite.
- **Action:** `node scripts/run-all-tests.js`.
- **Expected result:** Same pass count as pre-change baseline plus the new tests above; zero new failures.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — no route/HTTP-layer change, only internal session/path-construction logic.

---

## NFR Tests

- Path-traversal guard test included above (`step1SummaryPathTraversalGuard`).

---

## Out of Scope for This Test Plan

- Live-staging re-verification of a real multi-story journey — deferred to the operator's own post-merge smoke check, since the underlying logic is fully covered by unit tests against the real functions.
- Any test for `dor-contract.md` — never produced by this code path.

---

## Test Gaps and Risks

None.
