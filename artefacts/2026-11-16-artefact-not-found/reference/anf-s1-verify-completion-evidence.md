# anf-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/anf-s1-artefact-not-found` (red tests 716c90a0e, then the implementation commit).

## Result

7 of 8 acceptance criteria (AC) verified by automated tests that have run. AC8 (live: `/artefact/%00/%00` answers 404 with no issue, and an unknown artefact answers 404 well under the old ~6 s) can only be observed after deploy.

## Tests

- `tests/check-anf-s1-artefact-not-found.js`: 9 passed, 0 failed. Written first and run red: T1, T2 and T4 failed because the answer was 503, T5 took 3875 ms for 24 requests, T3b and T8 failed because the validator did not exist; T3a, T6 and T7 passed before the change as invariants (well-formed references reach the fetcher; probe priority and an earlier failure are as before; a real upstream failure is 503). Mapping: T1 AC1, T2 AC2, T3a and T3b AC3, T4 AC4, T5 AC5, T6 AC6 (three cases), T7 AC7, T8 the never-throws NFR.
- T3b reads the real `artefacts/` directory (and `artefacts/archived/` children) and asserts every name passes the slug check.
- T4 uses the real `createApp()` route table with a seeded signed-in session and a recording `global.fetch`: both reported urls answer 404 and GitHub is never called; an unsigned request still answers 302 to `/`.
- Related, passing unchanged: `check-adlr-s1-artefact-link-resolution` 15, `check-cat-s5-artefact-fetch-integration` 25, `check-avpf-s1-postgres-fallback` 15, `check-dsa-s1-artefact-body-content-escaping`, `check-ure-s1-malformed-escape-404` 10.
- Test plan said 10 tests; the file has 9 test functions (T6 has three cases inside one), so the state records 9.

## Full suite

864 files, 5 failed, all known baseline failures: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone). The suite side effect on `artefacts/test-slug/ideate.md` was reverted.

## Open

- AC8: after merge, staging deploy and promotion (and with the operator signed in), request `/artefact/%00/%00` (expect 404, no new GitHub issue) and `/artefact/some-unknown-slug/not-a-real-artefact` (expect 404; note the time against the old ~6 s). Read-only.
