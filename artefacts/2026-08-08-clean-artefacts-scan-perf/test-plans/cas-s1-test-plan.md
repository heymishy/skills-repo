## Test Plan: Make clean-local-test-artefacts.js's bare-discovery scan early-exit instead of building a full file list per directory

**Story reference:** artefacts/2026-08-08-clean-artefacts-scan-perf/stories/cas-s1-early-exit-bare-discovery-scan.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Bare-discovery.md directory still correctly classified | 1 test | — | — | — | — | 🟢 |
| AC2 | Multi-file directory: early-exit at 2nd file, correctly excluded | 1 test | — | — | — | — | 🟢 |
| AC3 | Existing test suite passes unchanged | — | 1 full re-run | — | — | — | 🟢 |
| AC4 | Instrumented proof of bounded filesystem visits on a large synthetic tree | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — temp directories created/removed per test via `fs.mkdtempSync`, avoiding any dependency on this repo's real `artefacts/` content.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### findBareDiscoveryDirs_stillDetectsGenuineBareDiscoveryDir

- **Verifies:** AC1
- **Precondition:** A temp `artefacts/<slug>/discovery.md` directory with exactly one file, untracked in git
- **Action:** Call `findBareDiscoveryDirs(tempRepoRoot)`
- **Expected result:** The directory is returned as a candidate — same as before this fix

### findBareDiscoveryDirs_earlyExitsOnSecondFile_excludesCorrectly

- **Verifies:** AC2
- **Precondition:** A temp `artefacts/<slug>/` directory with `discovery.md` plus a second file (`benefit-metric.md`)
- **Action:** Call `findBareDiscoveryDirs(tempRepoRoot)`
- **Expected result:** The directory is NOT returned as a candidate — same as before this fix

### findBareDiscoveryDirs_visitsBoundedEntries_onLargeNonCandidateTree

- **Verifies:** AC4
- **Precondition:** A temp directory tree with 500+ files nested 3 levels deep, NOT a bare-discovery candidate (multiple files at the top level)
- **Action:** Instrument `fs.readdirSync` (via a wrapping spy or a call counter) while calling `findBareDiscoveryDirs`
- **Expected result:** The number of `readdirSync` calls and total directory entries visited is small and bounded (does not scale with the full 500+ file count) — proving early-exit actually fires, not just that the end result is correct

## Regression

### existingTdcS1Suite_passesUnchanged

- **Verifies:** AC3
- **Action:** Re-run `tests/check-tdc-s1-clean-local-test-artefacts.js`
- **Expected result:** All existing tests pass, same as before this fix
