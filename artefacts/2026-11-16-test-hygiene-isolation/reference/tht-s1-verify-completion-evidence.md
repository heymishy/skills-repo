# tht-s1 verification evidence

Date: 2026-11-16. Branch `feat/tht-s1-tests-leave-repo-clean`, commit `8e97c6a7c`.

## Red first
Before the implementation, `tests/check-tht-s1-tests-leave-the-repo-clean.js` gave 0 passed, 4 failed: T1 found `cat-s1` not in `SEQUENTIAL_EXCLUSIVE_LIST`, T2 and T3 found `_artefactSaveRoot` not exported, T4 showed the junk: `check-wusl2-progressive-live-draft` created `artefacts/<today>-discovery`, `check-iwu5-lens-complete` changed the tracked `artefacts/test-slug/ideate.md`, and the `stis-s1`, `inf5` and `mig4` tests wrote `artefacts/stis-s1-test-slug`, `workspace/test-tmp-inf5` and `workspace/test-tmp-mig4` into the checkout.

## Green
After the implementation: 4 passed, 0 failed.

| AC | Evidence |
|---|---|
| AC1 | T1: `tests/check-cat-s1-core-trace-builder.js` is in `SEQUENTIAL_EXCLUSIVE_LIST` with its four existing members unchanged; the runner still discovers it; the 50 ms budget and best-of-7 method are untouched |
| AC2 | T2: with `SKILLS_ARTEFACT_SAVE_ROOT` set, `_artefactSaveRoot()` returns it; T3: unset, it equals the previous value (`CLAUDE_REPO_PATH`, else `COPILOT_REPO_PATH`, else the repo root) |
| AC3 | T4: each of the five files, run on its own, leaves `HEAD` and all six watched paths unchanged (existence, size, modified time) |
| AC4 | Full suite in a clean worktree: see below |

## AC4: full suite in a clean worktree (local, Windows)
874 files, 871 passed, 3 not passing: `check-pcr-s1-test-runner`, `check-p3.5-validate-trace`, `check-rtvap-s1-archived-test-plan-coverage` (the known local-only set that needs a working bash; they pass in CI). `check-cat-s1-core-trace-builder` passes (it ran alone in the exclusive phase; it failed in the previous full runs of this session). `git rev-parse HEAD` unchanged, and `git status --short` was empty afterwards: no untracked files, no modified fixtures. Previous full runs left five junk entries every time.

## Findings during the build
- My change broke `check-stis-s1-guard-skill-turn-git-commit` U2, which tests the production default adapter by pointing `CLAUDE_REPO_PATH` at a throwaway git repo; with the new override set at the top of that file the save went elsewhere. Fixed by clearing the override for that one case (its purpose is the unset default) and restoring it afterwards.
- A probe of 26 candidate files and one full suite in a throwaway worktree found no stray commit anywhere: `stis-s1`'s adapter and `server.js`'s test-mode no-op already prevent it. The remaining defect was the file writes this story fixes.
