# Definition of Done: The mock LLM gateway returns the identical response on every turn, blocking multi-turn skill progression in mock mode

**PR:** #707 (`d13589b0`, "mgtc-s1: Give the mock LLM gateway turn-index-aware responses") | **Merged:** 2026-08-10 (commit timestamp `2026-08-10 14:54:02 +1200`)
**Story:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/stories/mgtc-s1-turn-index-aware-mock-responses.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — `responses[K]` returned for turn K < N | Yes | `AC1: getMockResponse_turnIndexWithinScriptedSequence_returnsThatIndexEntry` — asserts `getMockResponse(stage, model, scenario, 1)` returns the index-1 entry (`'B'`) from a 3-entry scratch fixture | Unit test, `tests/check-mgtc-s1-turn-index-cycling.js` | None |
| AC2 — turn index ≥ N returns last entry, no throw/undefined | Yes | `AC2: getMockResponse_turnIndexBeyondScriptedSequence_returnsLastEntry` — asserts `getMockResponse(..., 7)` against a 3-entry fixture returns `'C'` (last entry) | Unit test, same file | None |
| AC3 — existing single-`response` fixtures byte-identical, zero regression | Yes | `AC3: getMockResponse_singleResponseFixture_unchangedRegardlessOfTurnIndex` — asserts `turnIndex=0` and `turnIndex=5` calls against a real fixture (`discovery.success`) are `deepStrictEqual` to a baseline call with no `turnIndex` argument | Unit test, same file | None |
| AC4 — turn index reflects `history.length` across a 3-turn sequence, both executors | Yes | `AC4: skillTurnExecutor_threeTurnHistory_passesCorrectTurnIndexEachCall` and `AC4: skillTurnExecutorStream_threeTurnHistory_passesCorrectTurnIndexEachCall` — spy on `getMockResponse` across 3 simulated histories (lengths 0/1/2) asserts recorded turn indexes `[0, 1, 2]` for both `skillTurnExecutor` and `skillTurnExecutorStream` | Integration test, same file | None |
| AC5 — mock-disabled path completely unchanged | Yes | `AC5: skillTurnExecutor_mockDisabled_behaviourUnchanged` — asserts `getMockResponse` is never called when `isMockGatewayEnabled()` is false | Unit test, same file | None |

## Scope Deviations

None found against this story's own text. The story explicitly named two items as out of scope, both honored:
- **Writing the actual multi-turn `responses` fixture content** for `/ideate` or any stage — correctly deferred; picked up downstream by `isc-s1` ("Make the default mock-gateway /ideate scenario actually cycle through lenses...", commit `5dfc603a`), not this story.
- **The `clarify`/`estimate` side-trip unreachability hypothesis** — explicitly flagged as unconfirmed, not independently investigated here, consistent with the story text.

A downstream bug was found and fixed after this story merged: `isc-s2` ("Fix off-by-one in isc-s1's turnIndex mapping", commit `53cf4101`) corrected an off-by-one in **`isc-s1`'s fixture `responses` array content** (its assumption that real turns land on even `turnIndex` values), not in mgtc-s1's mechanism. mgtc-s1's own array-indexing-with-clamp logic (AC1/AC2) is untouched by that fix and its tests still pass — this is a content-authoring bug in the downstream story, not a defect in the mechanism this story shipped.

## Test Plan Coverage

`check-mgtc-s1-turn-index-cycling.js`: **6 passed, 0 failed** (freshly re-run this session — the pre-supplied "null passed, null failed" figure looked like an unparsed/failed harness run rather than a real result, so the suite was re-executed directly: `node tests/check-mgtc-s1-turn-index-cycling.js`). All 5 ACs covered per the test plan's AC-coverage table (AC1–AC3, AC5 unit; AC4 integration ×2, one per executor function) — 6 test cases total matches the plan's count exactly (1+1+1+1+2).

## NFR Status

| NFR | Status |
|-----|--------|
| Correctness | Met — closes the operator-confirmed gap; verified via AC1/AC2/AC4 turn-cycling tests |
| Backward compatibility | Met — AC3 asserts byte-identical output for every existing single-`response` fixture; AC5 asserts the real-provider branch is untouched when mock is disabled |

## Metric Signal

No formal benefit-metric artefact — this is a short-track story and the story text states benefit linkage directly rather than through `/benefit-metric`. The stated benefit (operators/E2E specs can progress past turn 1 in mock-mode multi-turn skill flows) is corroborated downstream: `isc-s1` and `isc-s2` (merged the following day, commits `5dfc603a`/`53cf4101`) both build on and live-verify this story's mechanism on staging, confirming the turn-cycling capability is real and in active use, not just unit-tested in isolation.

## Outcome

**COMPLETE**
**Follow-up actions:** None. The two items the story named as out of scope (fixture content, clarify/estimate reachability) were correctly deferred and have since been substantially picked up by `isc-s1`/`isc-s2`.

## DoD Observations

Confirmed in production use one day after merge: `isc-s1` and `isc-s2` both depend on and exercise this story's mechanism on staging, and the one bug found (`isc-s2`) was isolated to the downstream fixture-content story, not this one — a clean signal that the mechanism itself shipped correctly.
