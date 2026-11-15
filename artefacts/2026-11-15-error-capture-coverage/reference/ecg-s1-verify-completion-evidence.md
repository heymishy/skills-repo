# ecg-s1 verify-completion evidence

Date: 2026-11-15. Branch: `feature/ecg-s1-capture-all-5xx` (commits 90c98bc98 red tests, then the implementation commit). Draft PR: #1106.

## Result

7 of 8 acceptance criteria (AC) verified by automated tests. AC8 (live: one bad URL opens exactly one GitHub issue and one incident-record PR, a repeat opens none) needs the operator's approval because it creates real GitHub items, and can only be observed after deploy; it is left open for the DoD.

## Tests

- `tests/check-ecg-s1-capture-all-5xx.js`: 12 passed, 0 failed. Written first and run red: 8 failed for the right reasons (zero reports for guarded failures and direct 5xx responses, no `handleUnhandledRejection` export, no report fields); T4a, T5, T6a and T6b passed before the change as invariants (no double report on router rejection, nothing reported below 500, unwired or throwing capture changes no response). After the change all 12 pass. Mapping: T1 AC1, T2 AC2, T3a to T3c AC3, T4a and T4b AC4, T5 AC5, T6a and T6b AC6, T7 AC7, T8 the privacy NFR.
- Related: `check-coha-s5-error-capture` 89/89, `check-coha-s7-error-issue-incident` 46/46.

## Full suite

857 files, 5 failed on the one full run. Four are the known baseline (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`). The fifth, `tests/check-p4-enf-second-line.js`, passes alone (21 passed, 1 skipped) and fails only under full-suite load, as seen on the previous story. `check-cat-s1-core-trace-builder.js`, a known timing flake, passed this time.

## Audit that scoped the story

48 explicit `writeHead(500` or `status(500)` sites in 15 files (journey.js 14, products.js 8, server.js 5, sign-off.js 3, auth.js 3, 10 files with 1 or 2), 32 sites answering 502, 503 or 504, 3 capture call sites outside the capture module, `unhandledRejection` logged only. A single entry-point safety net plus the real-error report in `authGuard` covers all of them without editing the sites.

## Open

AC8, after merge, staging deploy and promotion, with the operator's explicit approval: request `/products/not-a-uuid` once on production; expect one new GitHub issue and one incident-record PR within a few minutes; repeat the request and expect no second issue; then close the issue and PR with the operator.
