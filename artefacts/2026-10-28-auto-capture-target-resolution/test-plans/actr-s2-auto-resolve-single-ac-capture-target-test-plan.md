## Test Plan: Auto-resolve the single-AC capture target before falling back to manual entry

**Story reference:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md
**Date:** 2026-10-28
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s `scripts.test`).
**Test data strategy:** Synthetic — fake `fetchArtefact` responses (fixture `test-plan.md` markdown and fixture spec-file text), same `setFetcherModule`/fake-pool/`journey-store` pattern `ppc-s1`–`ppc-s7` already use in this file's own test suite. No real GitHub reads, no real Playwright.

## AC Coverage

| AC | Description | Verification method |
|----|-------------|---------------------|
| AC1 | Auto-detected target shown read-only, no manual form needed | Route test: fake `fetchArtefact` returns a test-plan.md fixture naming a spec file that resolves both url+selector; assert rendered HTML shows the auto-detected block, not the manual `<form>` |
| AC2 | Dispatch uses auto-resolved values | Route test: trigger capture for the AC1 fixture with no manual target set; assert `dispatchCaptureWorkflow` fake receives the auto-resolved `{url, selector}` |
| AC3 | Manual target takes priority over auto-resolved | Route test: same fixture as AC1, but with a manual target also set via `setCaptureTarget`; assert the manual value is used, not the auto-resolved one, in both render and dispatch |
| AC4 | Manual-only AC (no E2E in test-plan) renders existing form unchanged | Route test: fake `fetchArtefact` returns a test-plan.md fixture with no `File:` line for the given AC; assert the existing manual `<form>` renders exactly as today |
| AC5 | Fetch failure falls through safely | Route test (×2): (a) `fetchArtefact` throws/404s for the test-plan.md itself, (b) test-plan.md resolves but the named spec file 404s; assert page still renders 200 with the manual form in both cases — no 500, no uncaught rejection |
| AC6 | Override control reveals manual form, and submission takes priority | Route test: render with an auto-detected target present; simulate the override form POST (`handlePostCaptureTarget`); assert the newly-set manual value is used on next render, per AC3's own priority rule |

## Unit Tests

1. **`resolvesAutoTargetFromTestPlanAndSpec`** (AC1) — Precondition: fake `fetchArtefact` returns a `test-plan.md` fixture containing `**File:** tests/e2e/actr-fixture.spec.js` for `AC1`, and a spec fixture resolving `{url: '/playback/actr-fixture', selector: '.actr-target'}` via `actr-s1`'s function. Action: call the new resolution helper directly. Expected: returns the resolved `{acId, url, selector}` object.
2. **`skipsWhenNoFileLineForAc`** (AC4) — Precondition: test-plan fixture with no `File:` reference for the given AC (manual-only classification). Action: same call. Expected: returns `null` — no attempt to fetch a spec file at all.
3. **`skipsSilentlyOnTestPlanFetchFailure`** (AC5a) — Precondition: fake `fetchArtefact` throws for the test-plan path. Action: same call. Expected: returns `null`, no exception propagates.
4. **`skipsSilentlyOnSpecFetchFailure`** (AC5b) — Precondition: test-plan fetch succeeds and names a spec file; the spec-file fetch throws/404s. Action: same call. Expected: returns `null`, no exception propagates.

## Integration Tests (route-level, `handleGetPlaybackEvidence`/`handlePostCaptureTrigger`)

5. **`rendersAutoDetectedBlockWhenNoManualTarget`** (AC1) — covers the render path end to end with the fixtures from unit test 1.
6. **`dispatchesWithAutoResolvedTargetOnTrigger`** (AC2) — covers `handlePostCaptureTrigger` using the fake `dispatchCaptureWorkflow` from this file's existing test suite, asserting the call args.
7. **`manualTargetWinsOverAutoResolved`** (AC3) — sets a manual target via `setCaptureTarget` alongside a resolvable auto-target fixture; asserts both render and dispatch use the manual value.
8. **`rendersExistingManualFormWhenNoAutoMatch`** (AC4) — covers the render path with unit test 2's fixture, asserting byte-identical form markup to today's existing manual-only snapshot (regression guard).
9. **`rendersSuccessfullyOnTestPlanFetchFailure`** (AC5a) — route-level version of unit test 3; asserts HTTP 200 and manual form present.
10. **`rendersSuccessfullyOnSpecFetchFailure`** (AC5b) — route-level version of unit test 4; asserts HTTP 200 and manual form present.
11. **`overrideSubmissionTakesPriorityOnNextRender`** (AC6) — POSTs to `handlePostCaptureTarget` with a different url/selector than the auto-detected one, then re-renders; asserts the overridden value is now shown and used, per AC3's priority rule.

## NFR Tests

- **NFR-Security:** No separate test — AC5's two fetch-failure tests and `actr-s1`'s own AC3 together cover the relevant security-adjacent behaviour (an auto-resolution path can never silently feed an unsafe value through; it either resolves a validated relative URL or resolves nothing).
- **NFR-Performance:** None — confirmed no SLO; bounded fetch count already asserted structurally (unit tests 2-4 confirm no spec fetch is attempted when the test-plan fetch fails or names no file).

## Gap Table

No gaps. AC5 (the highest-risk AC — failure-safety) has two distinct test cases rather than one, covering both failure points in the two-step fetch chain.
