# pws-s1 verification evidence

Date: 2026-11-17. Branch `feat/pws-s1-production-wiring-smoke-test`.

## Result
6 of 6 tests pass (`node tests/check-pws-s1-production-wiring-smoke.js`, about 4 to 6 seconds including the boot). The boot probe boots the real `server.js` once in a child process and makes 1,100 or so real requests; the whole file stays well under the 60-second budget (AC6).

## Proof the check can fail (mutation run)
With the wiring line `skillsAdapter.setGetCommitResult(...)` removed from `server.js` (the original scr-s1 defect), the file failed on three independent assertions: T1 named `setGetCommitResult` as neither wired nor allow-listed; T3 saw `GET /skills/discovery/sessions/<id>/result` answer 500 with "Adapter not wired"; T4 reported the same 500 for six hostile ids. `server.js` was then restored with `git checkout` and the file went green again. (The empty-allow-list red run the test plan named was replaced by this stronger run on a real defect.)

## AC evidence
| AC | Evidence |
|---|---|
| AC1 | T1: 7 reasoned allow-list entries, every other stub setter is called at boot; mutation run above |
| AC2 | T2: no stale entry in either list; synthetic input shows both stale shapes are reported |
| AC3 | T3: 7 skill-session probes answer 404 (commit preview, result, chat, commit), 410 (answer), 200/303 (complete, next); none 5xx, none "Adapter not wired" |
| AC4 | T4: 99 route patterns, more than 400 requests made, 0 unexplained 5xx; 1 route skipped with a reason, 3 on the sweep allow-list with reasons |
| AC5 | T5: synthetic stub reported; scan and route extractor tested on made-up input |
| AC6 | T6: discovered by `run-all-tests.js`; boot under 60 s; `HEAD` and `git status` unchanged around the run |

## Full suite (local Windows, clean worktree)
876 files, 872 passed, 4 failed: `check-pcr-s1-test-runner`, `check-p3.5-validate-trace`, `check-rtvap-s1-archived-test-plan-coverage` (the known local-only set that needs a working bash) and `check-p4-enf-second-line` (T6 runs `validate-trace.sh` through bash and timed out at 60 s with `exit: null`; it passes when run alone, 21 passed and 1 skipped for bash). All four are bash-dependent; none touches code changed here. The new test passed in the full run (5.6 s). `HEAD` unchanged; the only untracked files were this story's four new files. CI on Linux is the authority for the four.

## Findings
See `decisions.md`: the 7 allow-listed stubs and why, the 21 explained 5xx answers, three follow-up observations, and what the check does not cover.
