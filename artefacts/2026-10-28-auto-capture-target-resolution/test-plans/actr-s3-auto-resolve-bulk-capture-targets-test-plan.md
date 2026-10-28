## Test Plan: Extend bulk "Capture all" to include auto-resolved targets

**Story reference:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s3-auto-resolve-bulk-capture-targets.md
**Date:** 2026-10-28
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s `scripts.test`).
**Test data strategy:** Synthetic — fixture AC lists + fixture manual/auto-resolved target maps, same convention `tests/check-capture-all.js` (existing `buildCaptureAllList` suite) already uses. No real GitHub reads, no real Playwright.

## AC Coverage

| AC | Description | Verification method |
|----|-------------|---------------------|
| AC1 | Correct 2-included/1-skipped split across manual/auto/neither | Unit test: `buildCaptureAllList` called with 3 ACs and the described manual/auto-resolved inputs; assert `toCapture.length === 2`, `skipped.length === 1` |
| AC2 | Manual wins over auto-resolved for an AC with both | Unit test: same fixture, assert the included entry for that AC carries the manual url/selector, not the auto-resolved one |
| AC3 | Dispatch `targets` array carries correct per-AC values | Integration test (`handlePostCaptureAll`): assert the fake `dispatchCaptureWorkflow`'s `targets` argument matches the expected per-AC source for each of the 2 included ACs |
| AC4 | Auto-resolution failure for an AC lands it in `skipped`, no new error | Integration test: one AC's auto-resolution helper (from `actr-s2`) returns `null` (simulated test-plan/spec fetch failure); assert that AC appears in `skipped`, response is still 200 |
| AC5 | `captureAllLock.setTotal` reflects the full includable count | Integration test: assert `setTotal` is called with `toCapture.length` from the merged (manual + auto) list, not just the manual-only count |

## Unit Tests (`buildCaptureAllList`)

1. **`includesBothManualAndAutoResolvedTargets`** (AC1) — Precondition: 3 ACs — `AC1` has a manual target, `AC2` has only an auto-resolved target, `AC3` has neither. Action: call `buildCaptureAllList({ acs, captureTargets, autoResolvedTargets })`. Expected: `toCapture` contains `AC1` and `AC2`; `skipped` contains `AC3`.
2. **`manualTargetTakesPriorityOverAutoResolved`** (AC2) — Precondition: one AC with both a manual target (`url: '/manual'`) and an auto-resolved one (`url: '/auto'`). Action: same call. Expected: the `toCapture` entry for that AC carries `/manual`, not `/auto`.
3. **`autoResolvedOnlyAcStillIncludedWhenManualMapEmpty`** (AC1, edge case) — Precondition: `captureTargets` is `[]`/empty, `autoResolvedTargets` has one entry. Action: same call. Expected: that AC is included — confirms the merge doesn't accidentally require a non-empty manual map to function.
4. **`missingAutoResolutionForAcKeepsItSkipped`** (AC4) — Precondition: an AC present in `acs` with no entry in either `captureTargets` or `autoResolvedTargets`. Action: same call. Expected: that AC is in `skipped`, same as today's existing (pre-this-story) behaviour — regression guard.

## Integration Tests (`handlePostCaptureAll`)

5. **`computesAutoResolutionPerAcBeforeBuildingList`** (AC3) — Precondition: fake `fetchArtefact` resolves a test-plan+spec fixture for one AC in the group, nothing for another (manual target already set), nothing resolvable for a third. Action: POST to `handlePostCaptureAll`. Expected: `dispatchCaptureWorkflow`'s fake receives a `targets` array with the correct per-AC `{url, selector}` for the 2 included ACs.
6. **`skipsAcOnAutoResolutionFailureWithoutErroring`** (AC4) — Precondition: the auto-resolution helper throws/returns `null` for one AC in the group (simulated fetch failure). Action: same POST. Expected: HTTP 200, that AC is reflected in the response's `skipped` list (or omitted from the dispatched group, per the existing `captured`/`skipped`/`failed` response shape), and the request does not 500.
7. **`setTotalReflectsMergedCount`** (AC5) — Precondition: 2 manual-target ACs + 1 auto-resolved-only AC in the group, all resolvable. Action: same POST. Expected: `captureAllLock.setTotal` is called with `3`, not `2`.

## NFR Tests

- **NFR-Performance:** covered structurally by test 5/6/7's fixture shape — the auto-resolution helper fake is called at most once per AC per request; no test asserts a stricter bound than this, matching the story's own stated NFR (resolve once per request, repeat calls within the same request are not required to be prevented beyond that).
- **NFR-Security:** None beyond what `actr-s2`'s own NFR tests already cover — this story does not introduce a new read path, only a new consumer of `actr-s2`'s existing one.

## Gap Table

No gaps. AC1's 3-AC fixture (test 1) and AC4's regression-guard test (test 4) together ensure the merge logic cannot regress either the new auto-resolved inclusion or the pre-existing manual-or-nothing behaviour.
