# Definition of Done: Make clean-local-test-artefacts.js's bare-discovery scan early-exit instead of building a full file list

**PR:** https://github.com/heymishy/skills-repo/pull/690 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-clean-artefacts-scan-perf/stories/cas-s1-early-exit-bare-discovery-scan.md
**Test plan:** artefacts/2026-08-08-clean-artefacts-scan-perf/test-plans/cas-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-08-clean-artefacts-scan-perf/dor/cas-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (genuine bare-discovery dir still detected) | ✅ | `findBareDiscoveryDirs_stillDetectsGenuineBareDiscoveryDir` | automated test | None |
| AC2 (2nd file → correctly excluded) | ✅ | `findBareDiscoveryDirs_earlyExitsOnSecondFile_excludesCorrectly` | automated test | None |
| AC3 (existing tdc-s1 suite unaffected) | ✅ | `tests/check-tdc-s1-clean-local-test-artefacts.js` — 3/3 passing | automated test re-run | None |
| AC4 (bounded filesystem visits on large tree) | ✅ | `findBareDiscoveryDirs_visitsBoundedEntries_onLargeNonCandidateTree` — instrumented `fs.readdirSync` path-tracking proves a 500-file `stories/` subdirectory is never visited once 2 top-level files already disqualify the directory | automated test (instrumented, not timing-based) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. `findTestTmpDirs`, `isTracked`, and `removeDirRecursive` were correctly left untouched, matching the story's explicit out-of-scope declaration. `listFilesRecursive` itself was left in place (unused but harmless) rather than removed, a deliberate conservative choice consistent with how `validate-trace.sh`'s dead `is_hard_fail` was also left alone in `vtp-s1` — not itself a scope violation since the story never required its removal, only that it no longer be *called* by `findBareDiscoveryDirs`.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (test plan enumerated 3 unit tests plus 1 regression check; the regression check ran against the existing suite rather than being a new test file)
**Tests passing in CI:** 3 / 3, plus 3/3 regression

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| findBareDiscoveryDirs_stillDetectsGenuineBareDiscoveryDir | ✅ | ✅ | |
| findBareDiscoveryDirs_earlyExitsOnSecondFile_excludesCorrectly | ✅ | ✅ | |
| findBareDiscoveryDirs_visitsBoundedEntries_onLargeNonCandidateTree | ✅ | ✅ | The first version of this test asserted on `readdirSync` *call count*, which does not actually discriminate early-exit from full-walk (both call `readdirSync` once per directory level regardless of file count within) — caught and corrected to assert on which *paths* were visited instead, before being counted as passing. |
| tdc-s1 regression suite | ✅ | ✅ | 3/3 unchanged |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (this story's own primary NFR) | ✅ | Early-exit confirmed via instrumented path-tracking, not just timing (a stronger proof than wall-clock alone, per the story's own AC4 design) |
| Security | N/A (none identified) | |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding.

---

## DoD Observations

1. **A self-caught test design flaw during implementation, not after.** The first version of AC4's test used `fs.readdirSync` *call-count* as the bounded-visits proxy, which doesn't actually distinguish early-exit from full-walk behaviour (each directory level is one `readdirSync` call regardless of how many files it returns). This was caught before considering the AC satisfied, and the test was redesigned around path-tracking (which directories were visited, not how many calls were made) — a more precise and actually-discriminating assertion. Worth noting as a general pattern: "did the optimization actually change anything measurable" deserves the same scrutiny as "does the output stay correct."
2. **A second, subtler correctness issue was also caught before merge:** the initial `soleFileOrNull` implementation processed directory entries in filesystem-readdir order, meaning on a filesystem that happened to list a disqualifying subdirectory *before* two sibling files, the early-exit would not fire — passing on this specific dev machine (which happens to return entries alphabetically) while being non-portable. Fixed by checking direct file entries first, deterministically, regardless of readdir order, before this was reported as complete.
