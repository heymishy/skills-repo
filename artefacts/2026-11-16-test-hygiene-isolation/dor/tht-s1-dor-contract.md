# Contract Proposal - Make the full test suite leave the repository clean, and stop the cat-s1 timing flake

**What will be built:**
- `src/web-ui/routes/skills.js`: a small exported `_artefactSaveRoot()` returning `process.env.SKILLS_ARTEFACT_SAVE_ROOT` when set, else `_getRepoPath()`; the artefact auto-save (`var _autoRepoRoot = _getRepoPath();`, around line 5628) uses it.
- `scripts/run-all-tests.js`: `tests/check-cat-s1-core-trace-builder.js` added to `SEQUENTIAL_EXCLUSIVE_LIST`, with a comment naming the reason.
- Test edits so the five writers stop writing into the checkout: `check-wusl2-progressive-live-draft.js`, `check-iwu5-lens-complete.js` and `check-stis-s1-guard-skill-turn-git-commit.js` set `SKILLS_ARTEFACT_SAVE_ROOT` to a temporary directory before the handler runs; `check-inf5-trace-extension.js` and `check-mig4-trace-extension.js` use a temporary directory under `os.tmpdir()` instead of `workspace/test-tmp-*`.
- `tests/check-tht-s1-tests-leave-the-repo-clean.js` (new, T1 to T4).

**What will NOT be built:**
- No change to the artefact-completion logic, the commit adapter or its test-mode wiring, the path-traversal check, any production default, the 50 ms budget or best-of-7 method in cat-s1, or any dependency. The junk already sitting untracked in the operator's main checkout is not touched.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit |
| AC2 | T2, T3 | unit |
| AC3 | T4 | integration (spawned files, git and file-system comparison) |
| AC4 | one full-suite run in a clean worktree | evidence |

**Assumptions:** `_autoRepoRoot` is the only root used by the auto-save write, the metrics write and the commit working directory (read at `routes/skills.js` lines 5627 to 5700); `_getRepoPath()` reads its environment variables at call time (read at line 272); the runner runs `SEQUENTIAL_EXCLUSIVE_LIST` files one at a time in a separate phase (read at `run-all-tests.js` lines 64 to 93) and exports the list (checked by `check-trr-s1-per-file-test-results.js`); the inf5 and mig4 tests only use `TMP_ROOT` as an absolute directory handed to `journey.setRepoRoot` (read at their lines 31 to 85).

`schemaDepends: []`. **Estimated touch points:** Files: the nine listed above. Services: none. APIs: none.
