# eit-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/eit-s1-issue-title` (commits 480d13676 red tests, 54845ea0d implementation).

## Result

6 of 7 acceptance criteria (AC) verified by automated tests that have run. AC7 (live: the ecf-s1 request's issue has the new title) can only be observed after deploy.

## Tests

- `tests/check-eit-s1-issue-title.js`: 6 passed, 0 failed. Written first and run red: T1, T3, T5 and T6 failed for the right reason (the value was the bare code; `http_5xx` and `unhandled_rejection` were rewritten to `unhandled_exception`); T2 and T4 passed before the change as invariants (the allow-listed message is unchanged; no canary text leaks). Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4 and the privacy NFR, T5 AC5, T6 AC6.
- T5 posts the longest possible title (`unhandled_rejection: AggregateError at /organisations/:p/:p/:p/:p/:p/:p/:p/...`) through the real `handlePostErrorBridge` with the payload shape from `tests/fixtures/coha-s6-bridge-payload.json`; the bridge answers 200 and creates one issue with exactly that title, and `codeProblem` accepts it. The test plan also named `normaliseEvent`; only `codeProblem` is asserted (it is the validator for the title/code).
- Existing assertions edited (as the contract and test plan said): in `tests/check-coha-s5-error-capture.js` the two sink assertions `p.$exception_list[0].value === 'unhandled_exception'` (uncaught-exception and unhandled-rejection tests) now expect `'unhandled_exception: Error at /process'`. No other assertion changed.
- Related, passing: `check-coha-s5-error-capture` 89/89, `check-coha-s6-error-bridge` 83 passed (7 real-Postgres skipped as designed), `check-ecg-s1-capture-all-5xx` 12/12, `check-ecf-s1-frame-function` 5/5, `check-uid-s1-invalid-id-404` 10/10, `check-ure-s1-malformed-escape-404` 10/10.

## Full suite

863 files, 5 failed, all known baseline failures: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone, exit 0). `tests/check-cat-s1-core-trace-builder.js` passed in this run (and alone). The suite's side effect on `artefacts/test-slug/ideate.md` was reverted.

## Open

- AC7: after merge, staging deploy and promotion (and with the operator signed in), request `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result` once; expect one GitHub issue titled `http_5xx: Error at /skills/:p/:p/:p/:p` and one incident-record draft PR. This opens a real issue and PR (approved by the operator for this work); run it together with the ecf-s1 live check if both are deployed. Existing issues are not retitled.
