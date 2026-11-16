## Test Plan: Make the full test suite leave the repository clean, and stop the cat-s1 timing flake

**Story reference:** artefacts/2026-11-16-test-hygiene-isolation/stories/tht-s1-tests-leave-the-repo-clean.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-tht-s1-tests-leave-the-repo-clean.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | cat-s1 is in the runner's sequential-exclusive list, out of the pool | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | The save root is the override when set, and the old path when not | 2 (T2, T3) | - | - | - | - | 🟢 |
| AC3 | The five formerly junk-writing files leave HEAD and the watched paths untouched | - | 1 (T4) | - | - | - | 🟢 |
| AC4 | The full suite leaves a clean tree | - | - | - | 1 | Evidence | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| A full-suite run takes several minutes and cannot run inside a test of the suite | AC4 | Evidence | Run once in a clean worktree and recorded in the verification evidence; AC3 covers the five known writers automatically |

## Tests (new file `tests/check-tht-s1-tests-leave-the-repo-clean.js`)

- **T1 (AC1).** Requires `scripts/run-all-tests.js`: `SEQUENTIAL_EXCLUSIVE_LIST` includes `tests/check-cat-s1-core-trace-builder.js` and still includes its four existing members; `getAllTestFiles()` (or the pool-selection the runner uses) does not place that file in the concurrent set. Fails today.
- **T2 (AC2).** `routes/skills.js` exports `_artefactSaveRoot`; with `SKILLS_ARTEFACT_SAVE_ROOT` set to a temporary directory it returns that directory. Fails today (not exported).
- **T3 (AC2).** With the variable unset, `_artefactSaveRoot()` equals the repository path the module resolved before this change (`CLAUDE_REPO_PATH`, else `COPILOT_REPO_PATH`, else three levels above `routes/`). Passes once exported; guards the default.
- **T4 (AC3).** For each of the five files, spawn it with `node`, and compare before and after: `git rev-parse HEAD`, and for each watched path its existence, size and modified time. Fails today (junk appears; the runs of wusl2 and iwu5 create or change files).
  - Watched paths: `artefacts/<today>-discovery`, `artefacts/test-slug/ideate.md`, `artefacts/stis-s1-test-slug`, `workspace/test-tmp-inf5`, `workspace/test-tmp-mig4`, `workspace/strategy-metrics.json`.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The guard only knows the five writers | New junk-writing tests can appear later | AC4's full-suite check and the story's evidence; a general guard is out of scope |

**Total automated tests:** 4 (T1 to T4) plus AC4 evidence.
