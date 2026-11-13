# Test Plan: Alert-to-GitHub-issue bridge for new production error issues

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Review reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s6-review-5.md (PASS, run 5)
**Fixture:** artefacts/2026-11-08-cicd-observability-hardening-automation/reference/coha-s6-bridge-payload-fixture.md
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-13
**Test runner (read from `package.json`):** `npm test` runs `node scripts/run-all-tests.js`, discovering `tests/check-*.js`. Each check is a plain Node script that prints pass and fail counts and exits non-zero on failure. The new file is `tests/check-coha-s6-error-bridge.js`, run with `node tests/check-coha-s6-error-bridge.js`. Because coha-s5's test file had to join `SEQUENTIAL_EXCLUSIVE_LIST` in `scripts/run-all-tests.js` after it starved a timing-sensitive test on the 2-slot CI pool, this file's own slot is decided at implementation by running the full suite on 2 CPUs.

## Component names used below (final file names are the implementation plan's call)

- **Route handler:** `handlePostErrorBridge(req, res, deps)`, registered in `server.js` next to `/webhook/stripe`.
- **Store:** the `production_error_issues` table logic (insert, claim, mark created, take over).
- **GitHub adapter:** `createIssue` and `findIssueByMarker`, injectable, stub throws `Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.`
- **Wiring:** the real adapter and pool wired in `server.js`.

---

## Test data strategy

- **Source:** fixtures plus synthetic. The request body is the fixture rendered by PostHog's simulation (`reference/coha-s6-bridge-payload-fixture.md`), copied to `tests/fixtures/coha-s6-bridge-payload.json` by the implementation, with variants generated in setup (staging, missing environment, wrong schema, oversized, malformed). Issue ids are generated UUIDs per test so rows never collide.
- **GitHub:** a local fake GitHub API (a small HTTP server in the test) that records method, path, `Authorization` header and body. Real GitHub is never called by a test.
- **Database:** two layers. (1) A fake pool implementing the few SQL shapes the store uses, for call-shape and branching tests. (2) The same store tests re-run against a real Postgres, because "two deliveries at the same moment cannot both create an issue" is an atomicity claim a fake cannot prove. The real-Postgres layer runs when `COHA_S6_TEST_DATABASE_URL` is set (a throwaway local container, for example `postgres:16`), and the file prints `SKIPPED (no COHA_S6_TEST_DATABASE_URL)` for each real-database test otherwise. See the gap table: CI has no Postgres service today, so these tests are evidence at `/verify-completion`, run locally and recorded in the DoD, not a CI gate. Their count is reported separately from the always-run count so a skip cannot hide as a pass.
- **Sensitivity:** no real secret, token or tenant data. The shared secret and token in tests are generated strings; every log-capture test asserts those strings never appear in any log line.
- **Gaps:** none in the data itself.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual (live) | Gap type | Risk |
|----|-------------|------|-------------|-----|---------------|----------|------|
| AC1 | Valid production payload with the secret opens exactly one issue with label, code title and fixed-field body | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | Duplicate, simultaneous, restart and stuck-pending deliveries open no second issue | 5 tests (U5 to U9, fake pool) | 4 tests (P1 to P4, real Postgres, gated) | — | — | CI cannot run real Postgres | 🟡 |
| AC3 | Missing or wrong secret 401; non-POST 405; over 16 KB 413 unparsed; malformed 400 | 7 tests (U10 to U16) | 1 test (I1) | — | — | — | 🟢 |
| AC4 | Staging or missing environment: 200, no issue, no row, distinct log lines | 3 tests (U17 to U19) | 1 test (I1) | — | — | — | 🟢 |
| AC5 | GitHub failure or timeout: 503, row not `created`, later delivery opens one | 3 tests (U20 to U22) | 2 tests (I2, and P5 real Postgres, gated) | — | — | — | 🟢 |
| AC6 | Live destination test run reaches the deployed bridge with the secret header intact and the bridge acts | — | — | — | 1 scenario | External service | 🔴 outward-facing |
| AC7 | Real startup path posts a valid payload and a fake GitHub API receives path, token and title, body, label | — | 2 tests (P6, P7, real Postgres, gated) | — | — | CI cannot run real Postgres | 🟡 |
| AC8 | Unwired adapter: 503 and a "not wired" log, no row marked `created` | 2 tests | — | — | — | — | 🟢 |
| AC9 | First real production error opens one issue, repeats open none; real event fills every field | — | — | — | 1 scenario | Production-observed, may not occur before merge | 🔴 |

NFR tests: 4 (N1 to N4, see below). Total planned tests: 30 always-run (24 unit U1 to U24, 2 integration I1 and I2, 4 NFR N1 to N4) + 7 real-Postgres gated (P1 to P7) = 37 automated, plus 2 manual live scenarios (AC6, AC9).

## Gap table

| Gap | AC | Gap type | Handling |
|-----|----|----------|----------|
| No Postgres service in CI, so atomicity tests cannot gate the PR | AC2, AC5, AC7 | Infrastructure | Real-Postgres tests run locally against a throwaway container at `/verify-completion` and the output is recorded in the DoD as integration-real-code. Per the repo's rule on Docker-infrastructure evidence, this is real evidence, not a RISK-ACCEPT, but a CI service for it is a possible follow-up. The always-run suite still covers every branch through the fake pool. If Docker is unavailable on the machine at verify time, that is a stated blocker, not a pass. |
| AC6 needs a deployed bridge, both Fly secrets, and an enabled PostHog destination | AC6 | External service | Manual scenario after merge and deploy to staging; operator approval immediately before the one live run, which opens a real issue in the public repo (closed afterwards). |
| AC9 cannot be produced on demand | AC9 | Production-observed | DoR classifies it with a RISK-ACCEPT in `decisions.md` and a post-merge action in `workspace/state.json`; DoD outcome COMPLETE WITH DEVIATIONS until seen. |
| Real event may not fill the body template as the sample does | AC1, AC4, AC9 | Mock-shape | The bridge logs names of empty fields (NFR test N4); the first real production error is the check. |
| `production-error` label does not exist in the repo and GitHub's behaviour when an issues-only token creates an issue with a missing label is unverified | AC1, AC6 | Assumption | The operator creates the label before AC6 (verification scenario setup); the adapter test asserts the label is sent by name; AC6 confirms it lands. |
| No CSS-layout-dependent ACs | — | — | None |

---

## Unit tests

Fake pool, fake adapter, captured logger. Each test starts from a clean store.

**U1 (AC1): a valid production body creates one issue through the adapter.** Precondition: shared secret set, adapter fake records calls. Action: call the handler with the fixture body and the correct secret header. Expected: status 200; adapter `createIssue` called exactly once with title equal to `code`, labels exactly `["production-error"]`.

**U2 (AC1): the issue body contains only the fixed fields.** Action: as U1. Expected: the body passed to the adapter contains the first-seen time, `environment`, the PostHog link and the marker line carrying the PostHog issue id, and no other text; a generated canary placed in an unexpected body field (`extra`) never appears in the issue title or body.

**U3 (AC1): the issue title is the code and nothing else; an over-long or multiline code is rejected or cut.** Action: bodies with a 500-character code and a code with a newline. Expected: title never exceeds a stated limit (120 characters) and never contains a newline; behaviour is 200 with the cut title or 400, whichever the plan fixes, asserted explicitly.

**U4 (AC1): the PostHog link is checked.** Action: body whose `posthog_issue_url` does not start with `https://us.posthog.com/project/`. Expected: 400, no issue, no row.

**U5 (AC2): created duplicate.** Precondition: row for the id with status `created`. Action: deliver the same body. Expected: 200, adapter not called, row unchanged.

**U6 (AC2): in-flight duplicate.** Precondition: row `pending`, claim time 30 seconds ago. Expected: 200, adapter not called.

**U7 (AC2): stuck pending taken over, issue not on GitHub.** Precondition: row `pending`, claim time 3 minutes ago, `findIssueByMarker` returns none. Expected: one conditional update wins, `createIssue` called once, row becomes `created` with the issue number.

**U8 (AC2): stuck pending taken over, issue already on GitHub.** Precondition: as U7 but `findIssueByMarker` returns issue number 42. Expected: `createIssue` not called, row becomes `created` with number 42.

**U9 (AC2): two concurrent takeovers, one winner.** Action: two handler calls on the same stuck row at once with a fake pool that serialises the conditional update. Expected: exactly one `createIssue` call.

**U10 (AC3): missing secret header gives 401.** Expected: nothing inserted, adapter not called, response body contains no hint about which part was wrong.

**U11 (AC3): wrong secret of the same length gives 401.** Expected as U10.

**U12 (AC3): wrong secret of a different length gives 401 without throwing.** Expected: 401 (guards `timingSafeEqual`'s length requirement).

**U13 (AC3): the comparison is `crypto.timingSafeEqual`.** Action: spy on `crypto.timingSafeEqual`. Expected: called when a header is present.

**U14 (AC3): non-POST gives 405 with an `Allow: POST` header.**

**U15 (AC3): body over 16 KB gives 413 before parsing.** Action: send 20 KB. Expected: 413; a spy on `JSON.parse` shows it was not called on the body.

**U16 (AC3): unparseable body and wrongly shaped bodies give 400.** Cases: not JSON, JSON array, missing `schema`, `schema` not `coha-s6/v1`, a field that is not a string. Expected: 400 each, nothing inserted. One assertion per case with the case named in the output.

**U17 (AC4): `environment` is `staging`.** Expected: 200, adapter not called, no row, log line `error-bridge: ignored staging`.

**U18 (AC4): `environment` is empty.** Expected: 200, adapter not called, no row, log line `error-bridge: ignored environment missing`, which differs from U17's line.

**U19 (AC4): `environment` has an unexpected value (`Production`, `prod`).** Expected: treated as not production: 200, ignored, logged as an unexpected value without echoing it back at full length.

**U20 (AC5): GitHub returns 500.** Expected: 503, row not `created`.

**U21 (AC5): GitHub does not answer within the adapter's timeout.** Expected: 503 within the timeout plus a margin, row not `created`.

**U22 (AC5): after U20, a later delivery of the same body opens exactly one issue.** Expected: second delivery after the claim window creates one issue; no second `createIssue` success.

**U23 (AC8): the unwired adapter stub throws the exact message.** Expected: the stub's error message equals the string above.

**U24 (AC8): the handler with the stub returns 503 and logs `not wired`.** Expected: 503, a log line containing `Adapter not wired: error-bridge-github`, process alive, no row `created`.

## Integration tests (always run)

**I1 (AC1, AC3, AC4): the real handler behind a real local HTTP server.** Action: start the handler on an ephemeral port with the fake pool and fake GitHub API, send real HTTP requests for the fixture, a wrong secret, a GET, an oversized body and a staging body. Expected: statuses 200, 401, 405, 413, 200, and exactly one request recorded by the fake GitHub API (path `/repos/<owner>/<repo>/issues`, `Authorization: Bearer <generated token>`, JSON body with the right title and labels).

**I2 (AC5): the real handler with a fake GitHub API that fails then succeeds.** Expected: first request 503, a later request opens one issue.

## Integration tests (real Postgres, gated by `COHA_S6_TEST_DATABASE_URL`)

**P1 (AC2): table creation is idempotent and has the unique key.** Action: run the boot migration twice. Expected: no error, one table, the PostHog issue id column unique.

**P2 (AC2): two simultaneous deliveries open one issue.** Action: fire two requests for a new id at once through the real handler and real pool. Expected: exactly one `createIssue` call across both, one row `created`.

**P3 (AC2): restart between deliveries.** Action: deliver, build a fresh handler and pool, deliver again. Expected: the second delivery is a duplicate, no second issue.

**P4 (AC2): stuck pending older than the window is taken over once.** Action: insert a `pending` row aged 3 minutes, send two simultaneous deliveries. Expected: one winner, one `createIssue` or one marker hit, never two issues.

**P5 (AC5): a failed GitHub call leaves the row recoverable.** Action: fail the first call, then deliver after the window. Expected: exactly one issue.

**P6 (AC7): the real startup path.** Action: start `server.js` in a child process with test environment variables (the shared secret, the target repo, a token, `DATABASE_URL` set to the test database, and the GitHub API base pointed at the fake). Post the fixture. Expected: the fake GitHub API receives one request with the right path, the token in `Authorization`, and the expected title, body and label. Per the repo rule, `server.js` is never re-required in-process.

**P7 (AC7): the wired behaviour is correct, not just assigned.** Action: post two different PostHog issue ids through the real startup path. Expected: two different issues with their own correct titles and marker lines.

## NFR tests

**N1 (Performance): the route answers within 2 seconds with fake adapters.** Assert only the elapsed time for a valid delivery.

**N2 (Security): no secret, token or payload content in any log line.** Action: run all handler cases with a log-capturing logger. Expected: the generated shared secret, the generated token and a payload canary never appear in any captured line.

**N3 (Audit): each outcome logs once.** Action: run created, duplicate, staging, environment missing, rejected and failed cases. Expected: one distinct, stable log line per outcome, carrying the PostHog issue id when known and nothing else from the payload.

**N4 (Audit, mock-shape): empty fields are named.** Action: a body whose `first_seen` and `code` are empty strings. Expected: the log names `first_seen` and `code` as empty without their values, and the response is 400.

## Verification commands

- Always-run: `node tests/check-coha-s6-error-bridge.js`.
- With the real database: start a throwaway Postgres container, set `COHA_S6_TEST_DATABASE_URL` to its connection string for that shell only, run the same command, and expect the seven P tests to run instead of print SKIPPED.
- Full suite: `npm test`, then compare with the baseline as `scripts/ci-test-regression-check.js` does in CI.

## Wiring (D37)

The adapter rule requires a separate wiring test. P6 and P7 are that test and assert behavioural correctness (an observable request with the right token and body; two different ids give two different issues), not that a function was assigned.
