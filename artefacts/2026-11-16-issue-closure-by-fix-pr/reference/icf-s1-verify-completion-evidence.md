# icf-s1 verification evidence

Date: 2026-11-16. Branch `feat/icf-s1-fix-pr-closes-issue`, commit `4b14e0435`.

## Red first
Before the implementation, `tests/check-icf-s1-fix-pr-closes-issue.js` gave 0 passed, 6 failed: T1 found no `Fixes #` in `branch-complete`, T2 and T3 and T6 found no script, T4 found no source-issue step or template section, T5 found only one story definition matching the schema probe (the probe was tightened to key on `testPlan` and `dorStatus`, then failed on the missing `sourceIssue`).

## Green
After the implementation: 6 passed, 0 failed.

| AC | Evidence |
|---|---|
| AC1 | T1: `branch-complete` has `Fixes #` in both the bash and the PowerShell PR bodies, a source-issue instruction, and the required `check-source-issue-closure.js --pr` check |
| AC2 | T2: `Fixes #1121`, `closes #1121`, `RESOLVES #1121` and "This PR fixes #1121." pass; the real PR #1127 wording ("the operator can close issue #1121 and incident PR #1122"), `Fixes #11210`, `see #1121`, an empty body and undefined all fail |
| AC3 | T3: over a synthetic state the scan returns exactly the merged-and-open stories, flat and epic-nested (`f1/a`, `f2/e`); an unknown lookup is never reported as open |
| AC4 | T4: `definition-of-done` Step 1 names the source issue, runs the script, records a deviation and offers the operator the closing action; the template has a `Source Issue Closure` section |
| AC5 | T5: both story definitions in the schema have `sourceIssue` as an integer; the integrity check passes a story with `sourceIssue: 5`; `applyAdvance` stores `sourceIssue=1121` as the integer 1121 |
| AC6 | T6: with `GH_BIN` pointing at a missing binary the script exits 0 and prints "skipped"; with no source issues it exits 0 and says none |
| AC7 | Live, after merge: the next real error-issue fix closes its issue with the merge and the DoD shows no deviation |

## Real-world check
`node scripts/check-source-issue-closure.js --pr 1127 --issue 1121` against GitHub: "PR #1127 does NOT list issue #1121 as a closing reference" (exit 1), reproducing the exact miss that left issue #1121 open. The scan against the real state reports no merged story has a source issue.

## Existing tests
The 15 existing test files that reference the edited skills, the DoD template or the schema all pass.

## Full suite (local, Windows)
874 files, 869 passed, 5 not passing: the four known local-only files (no working bash here; they pass in CI): `check-pcr-s1-test-runner`, `check-p4-enf-second-line`, `check-p3.5-validate-trace`, `check-rtvap-s1-archived-test-plan-coverage`; and `check-cat-s1-core-trace-builder`, the known 50 ms timing flake under local load, fixed separately by `tht-s1`. No stray commit; the suite's junk files were discarded.

## Note
`templates/definition-of-done.md` was a touchpoint the first draft of the DoR contract missed; the contract was amended in this PR.
