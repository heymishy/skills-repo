# uid-s1 verify-completion evidence

Date: 2026-11-15. Branch: `feature/uid-s1-invalid-id-404` (commits 2e30f466a red tests, then the implementation commit). Draft PR: #1107.

## Result

6 of 8 acceptance criteria (AC) verified by automated tests that have run. AC7 (the real-Postgres error shape, test P1) is written and gated and has not been run because Docker was not running; it is left open until it is run once against a throwaway local Postgres. AC8 (live) can only be observed after deploy.

## Tests

- `tests/check-uid-s1-invalid-id-404.js`: 10 passed, 0 failed. Written first and run red: 6 failed for the right reasons (classifier module missing; guarded and unguarded routes answering 500; the real product page and journey page handlers answering 500 for `not-a-uuid`, which also shows the handlers do not swallow the error themselves); T3b, T4a, T4b and T5 passed before the change as invariants (a uuid error whose value is not in the url stays a reported 500, other errors unchanged, a sent response is not written twice). Mapping: T1 AC1, T2 AC2, T3a and T3b AC3, T4a and T4b AC4, T5 AC5, T6a and T6b AC6, T7 the never-throws NFR.
- `tests/check-uid-s1-real-postgres.js` (P1, AC7): gated by `UID_TEST_DATABASE_URL`, refuses non-local hosts, prints SKIPPED without it. NOT YET RUN.
- Related: `check-ecg-s1-capture-all-5xx` 12/12, `check-coha-s5-error-capture` 89/89.
- A test mistake found and fixed on the way: T5 first let a handler write part of a response and throw without ending it; the existing guard (correctly) writes nothing more, which left the request open and hung the test. The test now ends the response before the error.

## Full suite

859 files, 5 failed, all known: `scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone, fails only under full-suite load).

## Open

- AC7: start Docker, run a throwaway Postgres on port 25432, then `UID_TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:25432/postgres node tests/check-uid-s1-real-postgres.js`; expect 4 passed (the error is `22P02` with the message form the classifier parses). If the real message differs, the classifier fails safe (500 and a report) and must be corrected.
- AC8: after merge, staging deploy and promotion, request `/products/not-a-uuid` and `/journeys/not-a-uuid` on production; expect 404 for both and no new GitHub issue.
