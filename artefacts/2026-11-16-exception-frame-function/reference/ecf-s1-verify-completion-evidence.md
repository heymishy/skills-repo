# ecf-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/ecf-s1-frame-function` (commits 39b4e3054 red tests, bcbb6e859 implementation).

## Result

6 of 7 acceptance criteria (AC) verified by automated tests that have run. AC7 (live: the failing commit result route becomes a PostHog issue and a GitHub issue) can only be observed after deploy.

## Tests

- `tests/check-ecf-s1-frame-function.js`: 5 passed, 0 failed. Written first and run red: T1, T3, T4 and T5 failed for the right reason (the `function` key was missing from the scrubbed frame); T2 passed before the change as an invariant (identifier-shaped names kept). Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5.
- A second gap was found by T4 during implementation: `scrubFrame` returned early for a frame that is not an object (null, a string, a number) with only a `filename`; that branch now also sends the placeholder function.
- AC6: `tests/check-coha-s5-error-capture.js` 89 passed (the two assertions in `scrubEvent_function_identifierShapedOnly` now expect `<anonymous>`, the only edit); `tests/check-ecg-s1-capture-all-5xx.js` 12 passed; `tests/check-uid-s1-invalid-id-404.js` 10 passed.

## Full suite

860 files, 6 failed. Five are the known baseline failures: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone, exit 0). The sixth, `tests/check-cat-s1-core-trace-builder.js`, is the known occasional timing flake under full-suite load and passes alone (exit 0). The suite's side effect on `artefacts/test-slug/ideate.md` was reverted.

## Open

- AC7: after merge, staging deploy and promotion, and before `scr-s1` merges, request `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result` once on production while signed in. Expect: PostHog event `stacktrace.type` `resolved`, no `$cymbal_errors`, an issue id; one new GitHub issue and one incident-record draft PR for `/skills/:p/:p/:p/:p`. This opens a real issue and PR (the operator approved live checks of this kind for this work, 2026-11-16).
