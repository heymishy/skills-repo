# tvl-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/tvl-s1-turn-validation` (red tests 7b2d5adc1, then the implementation commit).

## Result

7 of 8 acceptance criteria (AC) verified by automated tests that have run. AC8 (live on staging: replay the garbage set, expect 400, 413 and 404; a normal answer still 200) can only be observed after deploy.

## Tests

- `tests/check-tvl-s1-turn-body-validation.js`: 9 passed, 0 failed. Written first and run red: T1, T2, T4 and T5 failed because the answer was 200 (and a model call), T3a, T3b and T8 failed because `_readTurnBody` and `_validateTurnRequest` did not exist or the answer was wrong; T6 (valid turns unchanged) and T7 (no reports, no input in logs) passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3a and T3b AC3, T4 AC4, T5 AC5, T6 AC6, T7 AC7, T8 the never-throws and lock NFR.
- T3a gives the limited reader a source that keeps producing 64 KB chunks for 4 MB; the reader reports too large and the source is paused within a few chunks of the 262144-byte limit, so nothing more is buffered.
- T1 and T2 assert, for every bad input, zero model calls, zero credit adjustments and zero error reports.
- The 30 existing test files named in the DoR contract pass unchanged (30 run, 0 failing). The contract list was incomplete: it was built from a `head -30` of the files that mention the handlers, and the full suite found one more, `tests/check-wsm2-collaborative-sessions.js`, which sent turns with `body: {}` (no answer). Two of its requests (T4b "viewer sees the owner's new turn" and T6 "returns 409 while a turn is in progress") depended on that invalid shape; each now sends `body: { answer: '...' }`. That is the only existing test edited (2 lines); it passes 22 of 22 afterwards.

## Full suite

866 files, 6 failed in the first run: the 5 known baseline failures (`scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone)) plus `tests/check-wsm2-collaborative-sessions.js`, a regression from this change, fixed as described above and re-run alone (22 passed). The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged.

## Open

- AC8: after merge and a staging deploy, from a signed-in staging page replay the garbage set from the 2026-11-16 session: malformed JSON, `{}`, empty answer, a number, 200 KB and 2 MB answers, a wrong skill name; expect 400, 400, 400, 400, 413, 413 and 404, and a normal answer still 200. Staging uses the mock model, so this costs nothing.
- Note for the operator: an empty answer is now refused (the page sends `__init__` to start). If anything legitimate sends an empty answer it will now see 400 INVALID_ANSWER; none was found in a search of the front-end code.
