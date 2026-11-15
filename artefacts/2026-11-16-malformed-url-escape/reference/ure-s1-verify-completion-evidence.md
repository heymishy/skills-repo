# ure-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/ure-s1-malformed-escape` (commits cf101c547 red tests, 1f909e3eb implementation).

## Result

6 of 7 acceptance criteria (AC) verified by automated tests that have run. AC7 (live: the two reported URLs answer 404 on production with no new issue) can only be observed after deploy.

## Tests

- `tests/check-ure-s1-malformed-escape-404.js`: 10 passed, 0 failed. Written first and run red: T3a, T1, T2 and T6a failed for the right reason (the helper did not recognise `URIError`; the real server answered 500 for `/journey/x/stage/%E0%A4%A`); T3b, T4a, T4b, T5, T6b and T7 passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3a and T3b AC3, T4a and T4b AC4, T5 AC5, T6a and T6b AC6, T7 the never-throws NFR.
- The error is produced by calling `decodeURIComponent('%E0%A4%A')` in the test, not constructed, so the message text comes from the engine.
- One test route was changed during implementation: `/skills/<name>/sessions/<bad>/commit-preview` decodes inside the login guard, so an unsigned test request got a 302 before the decode; T6a now uses `/playback-media/<bad>` (decodes before any guard) with `/journey/x/stage/<bad>` and `/products/x/playback-evidence/<bad>`.
- Related, unchanged and passing: `check-uid-s1-invalid-id-404` 10/10, `check-ecg-s1-capture-all-5xx` 12/12, `check-coha-s5-error-capture` 89/89.

## Full suite

861 files, 6 failed. Five are the known baseline failures (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js`, which passes alone). The sixth, `tests/check-cat-s1-core-trace-builder.js`, is the known occasional timing flake under full-suite load and passes alone. The suite's side effect on `artefacts/test-slug/ideate.md` was reverted.

## Open

- AC7: after merge, staging deploy and promotion, signed in on production request `/journey/00000000-0000-0000-0000-000000000000/stage/%E0%A4%A` and `/products/00000000-0000-0000-0000-000000000000/playback-evidence/%E0%A4%A`; expect 404 for both and no new GitHub issue.
