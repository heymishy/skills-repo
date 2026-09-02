## Test Plan: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Epic reference:** artefacts/2026-09-01-artefact-commit-durability-gap/epics/stage-completion-artefact-durability.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `commitArtefact` throws after a successful resolve → blocks completion, returns existing error | 1 | 1 | — | — | — | 🟢 |
| AC2 | `ownerRepoForFeature` throws for a genuinely-linked product → blocks completion, clear error | 1 | 1 | — | — | — | 🟢 |
| AC2a | `ownerRepoForFeature` resolves falsy (no throw) for a genuinely-linked product → blocks completion, clear error | 1 | — | — | — | — | 🟢 |
| AC3 | Genuinely no repo linked → commit skipped, completion proceeds, no error (regression) | 1 | 1 | — | — | — | 🟢 |
| AC4 | A named regression test exists for the confirmed historical failure mode | — | — | — | [DoD cross-reference] | Untestable-by-nature | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's test runner | Handling |
|-----|----|----------|--------------------------|---------|
| Confirming which specific test (AC1, AC2, or AC2a) corresponds to the ACTUAL historical root cause | AC4 | Untestable-by-nature | AC4 is a meta/process assertion ("a regression test exists for the real bug"), not an independently automatable behaviour — its truth depends on which of AC1/AC2/AC2a's own results end up covering the real root cause, determined only during implementation | Verified at DoD by cross-referencing which test(s) genuinely failed on unmodified code (see TDD discipline note below), named explicitly in the story's DoD |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures (scratch directories via `fs.mkdtempSync`, monkey-patched adapter functions) in setup/teardown, matching this repo's established pattern (`tests/check-ep1-s5-error-handling.js`, `tests/check-ep1-s6-instrumentation.js`)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture journey/session with a resolvable owner/repo; a monkey-patched `commitArtefact` that throws | Synthetic, in-test | None | Mirrors ep1-s5's `fs.readFileSync` monkey-patch technique, applied to `artefact-commit-writer.js`'s exported `commitArtefact` |
| AC2 | A fixture journey/session; a monkey-patched `ownerRepoForFeature` that throws | Synthetic, in-test | None | Monkey-patch `export-data-source.js`'s exported `ownerRepoForFeature` |
| AC2a | Same as AC2, but the monkey-patched `ownerRepoForFeature` resolves to `null`/`undefined` without throwing | Synthetic, in-test | None | |
| AC3 | A fixture journey/session with `ownerRepoForFeature` resolving to `null` (real "no repo" behaviour, not mocked-as-error) | Synthetic, in-test | None | Regression-protection — must still pass unchanged |

### PCI / sensitivity constraints

None — synthetic test data throughout; no real GitHub tokens, no real repo content.

### Gaps

None — all data available now via monkey-patching, matching this repo's established adapter-testing convention (no injectable-adapter seam currently exists on `ownerRepoForFeature`/`commitArtefact`, but both are `require()`'d as module exports at call time, making the same monkey-patch technique used for `posthog-server.capture` in `ep1-s5`/`ep1-s6` directly applicable).

---

## Unit Tests

### commitArtefact failure (post-resolve) blocks completion and returns the existing error response
- **Verifies:** AC1
- **Precondition:** Fixture journey with a session at an active stage; `ownerRepoForFeature` monkey-patched to resolve `{owner: 'x', repo: 'y'}`; `commitArtefact` monkey-patched to throw
- **Action:** Call `handlePostGateConfirm` (or the equivalent stage-completion request path) for this session
- **Expected result:** Response status 502, body `{error: 'artefact-commit-failed', ...}`; `journeyStore.completeStage` is NOT called (assert via a spy/wrapped `completeStage`)
- **Edge case:** No
- **TDD note:** This session's own code reading (`journey.js`'s existing try/catch around `commitArtefact`) suggests this path may already be correct on unmodified code — if this test PASSES before any implementation change, that confirms AC1 is a regression-protection test, not new-fix evidence, exactly as flagged in the story's own AC1 revision note. Record the actual pre-implementation result in the DoD.

### ownerRepoForFeature throw (genuinely-linked product) blocks completion and returns a clear error
- **Verifies:** AC2
- **Precondition:** Fixture journey with a session at an active stage, backed by a feature genuinely linked to a repo-connected product; `ownerRepoForFeature` monkey-patched to throw
- **Action:** Call `handlePostGateConfirm` for this session
- **Expected result:** Response is a clear, actionable error (not the existing silent-skip completion); `journeyStore.completeStage` is NOT called
- **Edge case:** No
- **TDD note:** Expected to FAIL on unmodified code — today's `catch (_dasResolveErr) { _dasOwnerRepo = null; }` swallows this and proceeds to complete the stage normally with no error. This is the primary candidate for the real historical root cause.

### ownerRepoForFeature falsy-without-throw (genuinely-linked product) blocks completion and returns a clear error
- **Verifies:** AC2a
- **Precondition:** Same as above, but `ownerRepoForFeature` monkey-patched to resolve `null`/`undefined` directly (no throw) despite the product being genuinely linked
- **Action:** Call `handlePostGateConfirm` for this session
- **Expected result:** Response is a clear, actionable error; `journeyStore.completeStage` is NOT called
- **Edge case:** Yes — this is the failure sub-mode `acdg-s1`'s own review (finding 1-M2) identified as having zero prior AC coverage
- **TDD note:** Expected to FAIL on unmodified code — `if (_dasOwnerRepo)` evaluates false identically to the genuine-no-repo case (AC3), with no way to distinguish today.

### Genuinely-no-repo product still skips cleanly with no error (regression)
- **Verifies:** AC3
- **Precondition:** Fixture journey with a session at an active stage, backed by a feature with no connected repo; `ownerRepoForFeature` resolves `null` (real behaviour, not simulated as an error)
- **Action:** Call `handlePostGateConfirm` for this session
- **Expected result:** No error response; `journeyStore.completeStage` IS called; stage marked complete exactly as before this story
- **Edge case:** No
- **TDD note:** Expected to PASS on unmodified code — this is a regression-protection test for AC4's original, unchanged design.

---

## Integration Tests

### Full gate-confirm request never marks a stage complete when the artefact commit genuinely fails
- **Verifies:** AC1, AC2 (whichever is confirmed as the real root cause)
- **Components involved:** `handlePostGateConfirm`, `journey-store.js`'s `completeStage`, `export-data-source.js`'s `ownerRepoForFeature`, `artefact-commit-writer.js`'s `commitArtefact`
- **Precondition:** A real (in-memory) journey created via `journeyStore.createJourney`, with a real active session
- **Action:** Send a full `handlePostGateConfirm` request with both adapter functions monkey-patched to simulate the confirmed failure mode
- **Expected result:** The journey's `completedStages` array does NOT gain a new entry for this stage; a follow-up call to `journeyStore.getJourney` shows the stage still incomplete

### Full gate-confirm request completes normally for a genuinely repo-less feature
- **Verifies:** AC3
- **Components involved:** Same as above
- **Precondition:** Same as above, but `ownerRepoForFeature` resolves `null`
- **Action:** Send a full `handlePostGateConfirm` request
- **Expected result:** The journey's `completedStages` array DOES gain the new entry — unchanged from pre-story behaviour

---

## NFR Tests

### Stage-completion sequencing is unchanged (resolve-then-commit still runs synchronously before completeStage)
- **NFR addressed:** Performance
- **Measurement method:** Call-order assertion — a test double records the order in which `ownerRepoForFeature`, `commitArtefact`, and `journeyStore.completeStage` are invoked; asserts the existing order is preserved (no new async round-trip inserted between them)
- **Pass threshold:** Call order identical to pre-story behaviour
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

### No new credential or full-artefact-content exposure
- **NFR addressed:** Security
- **Measurement method:** Not independently automated-testable as a negative property beyond code review — verified manually at DoD by diffing the actual PR against `journey.js`'s existing `req.session.accessToken` usage, confirming no new credential parameter or full artefact body is added to any error message or log line
- **Pass threshold:** N/A — manual code-review confirmation, recorded in DoD
- **Tool:** Manual code review

---

## Out of Scope for This Test Plan

- Testing `artefact-commit-writer.js`'s or `export-data-source.js`'s own internal implementation correctness beyond the specific throw/no-throw/resolve-null behaviours this story's ACs need — a full unit-test suite for those adapters (if one doesn't already exist) is a separate concern from this story's own bug fix.
- Testing `acdg-s2`'s durability-signal events — covered by that story's own test plan.
- Live-staging/production verification that a real commit failure now correctly blocks — deferred to DoD's own manual smoke-test step, since forcing a genuine GitHub API failure in production is not something this test plan can safely simulate.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's own truth depends on implementation-time findings | Which of AC1/AC2/AC2a's tests actually fail on unmodified code can only be confirmed once the tests are run against real code, before any fix is applied | Record each test's pre-implementation pass/fail result explicitly in the DoD — this IS the evidence AC4 requires, not a separate test |
