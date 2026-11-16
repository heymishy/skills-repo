# tht-s1 Definition of Done

Date: 2026-11-17. Story: the full test suite leaves the repo clean, and `cat-s1` runs alone. PR #1132, merged to master on 2026-11-16 at 16:57 UTC (`40bdffd50`). The production code change is one function, `_artefactSaveRoot()` in `src/web-ui/routes/skills.js`, which returns the same value as before unless the test-only environment variable `SKILLS_ARTEFACT_SAVE_ROOT` is set, so no production check is needed.

## Result: COMPLETE

AC1 to AC4 (Acceptance Criteria 1 to 4) were verified before merge (see `reference/tht-s1-verify-completion-evidence.md`).

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `check-cat-s1-core-trace-builder.js` is in `SEQUENTIAL_EXCLUSIVE_LIST`; timing budget untouched | automated | none |
| AC2 | ✅ | `_artefactSaveRoot()` honours the override and otherwise equals the previous value | automated | none |
| AC3 | ✅ | each of the five previously-polluting test files leaves `HEAD` and the six watched paths unchanged | automated | none |
| AC4 | ✅ | full suite in a clean worktree: 874 files, 871 passed, 3 known local-only (need working bash) fail; `HEAD` unchanged and `git status` empty afterwards | automated, local Windows | the 3 failures pass in CI |

## Source Issue Closure

No source issue.

## Observations and follow-ups

- The merge's own CI run is the first on master with `cat-s1` in the exclusive phase; if `cat-s1` fails under load again, the cause is something other than concurrency.
- The memory note about junk commits from full-suite runs is out of date: no stray commit exists any more and the file writes are fixed here.

## Scope Deviations

None.
