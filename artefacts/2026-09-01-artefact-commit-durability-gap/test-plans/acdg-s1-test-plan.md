## Test Plan: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Epic reference:** artefacts/2026-09-01-artefact-commit-durability-gap/epics/stage-completion-artefact-durability.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02 — **Revision 2**, rewritten after `/branch-setup`'s root-cause investigation confirmed the real mechanism (`journey.productId` cross-check) and invalidated Revision 1's AC2/AC2a split. See `decisions.md` for the full investigation trail.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `commitArtefact` throws after a successful resolve → blocks completion, returns existing error (regression-protection) | 1 | 1 | — | — | — | 🟢 |
| AC2-revised | `journey.productId` set but `ownerRepoForFeature` throws → blocks completion, clear error (the real fix) | 1 | 1 | — | — | — | 🟢 |
| AC3-revised | `journey.productId` unset, `ownerRepoForFeature` throws → commit skipped, completion proceeds, no error (regression-protection) | 1 | 1 | — | — | — | 🟢 |
| AC4 | A named regression test reproduces the shape of the historical incident | — | — | — | [DoD cross-reference] | Untestable-by-nature | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's test runner | Handling |
|-----|----|----------|--------------------------|---------|
| AC4 itself is a meta/process assertion, not an independently automatable behaviour | AC4 | Untestable-by-nature | Its truth is that AC2-revised's own test demonstrates the fix — there is no separate, additional test to write | Satisfied directly by AC2-revised's own test; named explicitly in the story's DoD as the evidence for AC4 |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures (scratch directories via `fs.mkdtempSync`, monkey-patched adapter functions) in setup/teardown, matching this repo's established pattern (`tests/check-ep1-s5-error-handling.js`, `tests/check-ep1-s6-instrumentation.js`)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture journey/session with a resolvable owner/repo; a monkey-patched `commitArtefact` that throws | Synthetic, in-test | None | Monkey-patch `artefact-commit-writer.js`'s exported `commitArtefact` |
| AC2-revised | A fixture journey created with `productId` set (via `journeyStore.setJourneyFields`); a monkey-patched `ownerRepoForFeature` that throws | Synthetic, in-test | None | Monkey-patch `export-data-source.js`'s exported `ownerRepoForFeature` |
| AC3-revised | A fixture journey with NO `productId` set; a monkey-patched `ownerRepoForFeature` that throws | Synthetic, in-test | None | Regression-protection — must still pass unchanged |

### PCI / sensitivity constraints

None — synthetic test data throughout; no real GitHub tokens, no real repo content.

### Gaps

None — all data available now via monkey-patching, matching this repo's established adapter-testing convention.

---

## Unit Tests

### commitArtefact failure (post-resolve) blocks completion and returns the existing error response
- **Verifies:** AC1
- **Precondition:** Fixture journey with a session at an active stage; `ownerRepoForFeature` monkey-patched to resolve `{owner: 'x', repo: 'y'}`; `commitArtefact` monkey-patched to throw
- **Action:** Call `handlePostGateConfirm` (or the equivalent stage-completion request path) for this session
- **Expected result:** Response status 502, body `{error: 'artefact-commit-failed', ...}`; `journeyStore.completeStage` is NOT called
- **Edge case:** No
- **TDD note:** Confirmed via full code read of `artefact-commit-writer.js` that this path is already correct on unmodified code — `commitArtefact` is a proper injectable adapter that throws on any real failure, and `journey.js`'s existing try/catch already handles it. This test is expected to PASS on unmodified code — it is a regression-protection test, not new-fix evidence. Record this explicitly in the DoD.

### journey.productId set, ownerRepoForFeature throws → blocks completion and returns a clear error (the real fix)
- **Verifies:** AC2-revised
- **Precondition:** Fixture journey created via `journeyStore.createJourney` then `journeyStore.setJourneyFields(journeyId, {productId: 'some-product-id'})`; `ownerRepoForFeature` monkey-patched to throw `ExportNotFoundError`
- **Action:** Call `handlePostGateConfirm` for this session
- **Expected result:** Response is a clear, actionable error (not the existing silent-skip completion); `journeyStore.completeStage` is NOT called
- **Edge case:** No
- **TDD note:** Expected to FAIL on unmodified code — today's `catch (_dasResolveErr) { _dasOwnerRepo = null; }` swallows this regardless of `journey.productId`, and proceeds to complete the stage normally with no error. This is the confirmed real historical root cause — directly reproduces the shape of `new-feature-af17f555`'s own incident (created via `handlePostProductFeature`, which sets `productId` at creation time).

### journey.productId unset, ownerRepoForFeature throws → commit skipped, no error (regression)
- **Verifies:** AC3-revised
- **Precondition:** Fixture journey created via `journeyStore.createJourney` WITHOUT setting `productId` (the default state for any journey never linked to a product); `ownerRepoForFeature` monkey-patched to throw
- **Action:** Call `handlePostGateConfirm` for this session
- **Expected result:** No error response; `journeyStore.completeStage` IS called; stage marked complete exactly as before this story
- **Edge case:** No
- **TDD note:** Expected to PASS on unmodified code — this is a regression-protection test for the original, unchanged AC4 design (this story's fix only adds a NEW blocking branch when `productId` is set; the unset case is untouched).

---

## Integration Tests

### Full gate-confirm request never marks a stage complete when a linked feature's commit resolution fails
- **Verifies:** AC2-revised
- **Components involved:** `handlePostGateConfirm`, `journey-store.js`'s `completeStage`, `export-data-source.js`'s `ownerRepoForFeature`
- **Precondition:** A real (in-memory) journey created via `journeyStore.createJourney` with `productId` set, with a real active session
- **Action:** Send a full `handlePostGateConfirm` request with `ownerRepoForFeature` monkey-patched to throw
- **Expected result:** The journey's `completedStages` array does NOT gain a new entry for this stage; a follow-up call to `journeyStore.getJourney` shows the stage still incomplete

### Full gate-confirm request completes normally for a genuinely unlinked feature
- **Verifies:** AC3-revised
- **Components involved:** Same as above
- **Precondition:** Same as above, but `productId` is never set on the journey
- **Action:** Send a full `handlePostGateConfirm` request with `ownerRepoForFeature` monkey-patched to throw
- **Expected result:** The journey's `completedStages` array DOES gain the new entry — unchanged from pre-story behaviour

---

## NFR Tests

### Stage-completion sequencing is unchanged (resolve-then-commit still runs synchronously before completeStage)
- **NFR addressed:** Performance
- **Measurement method:** Call-order assertion — a test double records the order in which `ownerRepoForFeature`, `commitArtefact`, and `journeyStore.completeStage` are invoked; asserts the existing order is preserved
- **Pass threshold:** Call order identical to pre-story behaviour
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

### No new credential or full-artefact-content exposure
- **NFR addressed:** Security
- **Measurement method:** Not independently automated-testable as a negative property beyond code review — verified manually at DoD by diffing the PR against `journey.js`'s existing `req.session.accessToken` usage, confirming no new credential parameter or full artefact body is added to any error message
- **Pass threshold:** N/A — manual code-review confirmation, recorded in DoD
- **Tool:** Manual code review

---

## Out of Scope for This Test Plan

- Testing `artefact-commit-writer.js`'s or `export-data-source.js`'s own internal implementation correctness beyond the specific throw behaviours this story's ACs need — this story does not modify either file.
- Testing `acdg-s2`'s durability-signal events — covered by that story's own test plan.
- Live-staging/production verification that a real commit failure now correctly blocks — deferred to DoD's own manual smoke-test step.

---

## Test Gaps and Risks

None — the mechanism is fully confirmed via direct code reading (`handlePostProductFeature`, `saveJourney`/`listJourneys`, `dfr-s1`'s own prior fix), not inference. See `decisions.md` for the full investigation trail.
