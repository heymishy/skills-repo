# CI evidence: the core job run twice on one commit (lpw-s2, AC8)

Pull request #1139, workflow `Core browser tests`, run 44027314321, commit `2ab229061`, attempt 1 and attempt 2. The core is the 27 spec files in lane `core` of `tests/e2e/capability-matrix.json`, run with `--workers=1` against the pull request's own mocked test server.

| | Passed | Failed | Skipped | Test time | Job time |
|---|---|---|---|---|---|
| Attempt 1 | 106 | 0 | 3 | 33.7 s | 1 min 42 s |
| Attempt 2 | 106 | 0 | 3 | 28.6 s | 1 min 08 s |

No test differed between the two attempts, so no spec moves to lane `extended`.

## The first core run failed, and why

An earlier commit (`f930b4927`, run 44026517492) ran 110 tests: 105 passed and 5 failed, in `ep2-s2-stage-visibility` (2, "Target page, context or browser has been closed"), `kbsf-s1-shell-wrapping-visual`, `pnfc-s1-new-feature-choice` and `s1.2-not-ready-explanation`. All four spec files fail or are flaky in the whole-suite runs of `lpw-s1` and pass only when run alone, so they must not be in the core. The cause was a defect in the matrix builder (a throwaway script): it read the failed-before list from `ci-runs-1-and-2.md` with a pattern that missed the file's CRLF line endings, so the list was empty and the exclusion never applied. Fixed, the matrix rebuilt, and those four specs are now quarantined with reasons. The core went from 29 to 27 spec files. This is the failure AC8 exists to catch, and it was caught before anything was required.
