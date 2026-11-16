# bfl-s2 verification evidence

Date: 2026-11-16. Branch `feat/bfl-s2-real-ci-failures`, commit `b53fc84e3`.

## Red first
Before the implementation, `tests/check-bfl-s2-real-ci-failures.js` gave 1 passed, 8 failed (T3 passed as an invariant: a shortfall already fails C3). T1 and T2 showed C3 firing on the documented known failure and giving the old message, T4 showed no over-count finding, T5 showed the real integrity check exiting 1, T6 and T7 failed because `isInsideRepo` did not exist, T8 showed a valid in-repo path flagged from another working directory, T9 showed the three-entry baseline. An early run of this test matched the integrity script's own self-test lines (which mention C2 and C3) and gave misleading results; the assertions were tightened to the real finding format (`FAIL [Cn]`) before the implementation.

## Green
After the implementation: 9 passed, 0 failed.

| AC | Evidence |
|---|---|
| AC1 | T1 documented known failure accepted; T2 refused without a written reason (undefined, empty, whitespace); T3 refused on a shortfall (passing 3 + 1 < 5); T4 refused on an over-count (C2) |
| AC2 | T5: `tfhc-s1` keeps `passing` 4 with `knownFailing` 1 and a reason naming `decisions.md` (written on master with `bin/skills advance` before the PR); the real integrity check now reports "817 stories checked, 0 fail" |
| AC3 | T6 (path.posix, repo `/repo`) and T7 (path.win32, repo `C:\repo`): the six adversarial vectors plus a sibling directory with the same prefix are rejected; `README.md`, `scripts/ci-audit-comment.js`, `artefacts/a/b.md` and an absolute in-repo path are accepted |
| AC4 | T8: from another working directory `sourceIntegrity('README.md', null)` returns the em dash and the six vectors return the redacted traversal object |
| AC5 | T9: baseline `files` is `[]`; a log with no failures exits 0 with "0 file(s) currently failing, 0 in known baseline"; a log naming `tests/x.js` exits 1 naming it. `check-gpa-sc06-source-path-guard` 7 of 7, `run-gpa-tests` exit 0, `check-gpa-sc07-inline-js-extraction` 8 of 8 |
| AC6 | The PR's own CI run on Linux (see the PR); Docker Desktop was not running locally, so the Linux evidence is CI |

## Findings during the build
- A blanket drive-letter rejection broke `check-gpa-sc07-inline-js-extraction` T3, which passes an absolute in-repo path. The guard was refined: a path absolute on the current platform is checked as it stands, and only a drive-letter path that is not absolute on this platform is rejected.
- Three existing tests assumed a non-empty baseline and were updated with named reasons: `check-ci-test-regression-check` U3 (empty list is well-formed), `check-tst-s1-baseline-triage` U6 (the two gpa files, formerly "still unconfirmed", are now fixed and out of the baseline), `check-bfl-s1-baseline-tightened` (T1 asserts empty, T2 to T4 use a temporary baseline).

## Full suite (local, Windows)
873 files, 869 passed, 4 not passing, all the known local-environment set (no working bash on this machine, they pass in CI): `check-pcr-s1-test-runner`, `check-p4-enf-second-line`, `check-p3.5-validate-trace`, `check-rtvap-s1-archived-test-plan-coverage`. `scripts/check-pipeline-state-integrity.js`, `check-gpa-sc06-source-path-guard` and `run-gpa-tests`, the three that failed before, now pass. The suite's stray test artefacts were discarded and no stray commit was created.
