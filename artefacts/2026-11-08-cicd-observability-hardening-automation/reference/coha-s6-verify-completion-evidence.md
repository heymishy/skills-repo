# coha-s6 verify-completion evidence (2026-11-14)

**Story:** Alert-to-GitHub-issue bridge for new production error issues (artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md)
**Branch:** `feature/coha-s6-alert-to-github-issue-bridge`, verified at commit `0aa37056c` (18 commits on top of the DoR commit `fdea433e6`; six files changed: the handler, the store, the GitHub adapter, `server.js` (29 lines added, none removed), the test file and the fixture)
**Run on:** Windows 11, Node 22, PowerShell 7, Git Bash first on PATH, throwaway Postgres 16 in Docker bound to 127.0.0.1 only (stopped and removed afterwards)

## Test evidence (all fresh, run in this session on the final code)

| Command | Result |
|---|---|
| `npm test` (full suite) | 852 files run, 2 failed, both on the acknowledged baseline: `scripts/check-pipeline-state-integrity.js` (tfhc-s1, testPlan.passing 4 of 5 because of accepted product bug GitHub issue 1042) and `tests/check-pcr-s1-test-runner.js` (777.6 ms per file against a 749.8 ms machine-specific limit). Every other file passed, including the neighbouring Stripe webhook tests. |
| `node tests/check-coha-s6-error-bridge.js` (no database variable) | 83 passed, 0 failed, 7 skipped (the seven real-database tests print SKIPPED; a skip is not a pass) |
| Same command with `COHA_S6_TEST_DATABASE_URL` set to the throwaway Postgres | 90 passed, 0 failed, 0 skipped. This includes P1 to P7 (integration-real-code: real Postgres, and for P6 and P7 the real `server.js` started as a child process). Full output kept at `scratchpad/verify-coha-s6-realdb.log` of the session. |

Timing check recorded in `decisions.md` (2026-11-14): the new file does not disturb timing-sensitive tests (0 of 6 failures beside it versus 5 of 6 beside coha-s5), so it stays in the normal pool.

## Acceptance criteria

| AC | Evidence | Result |
|---|---|---|
| AC1 issue content | U1, U2, U3, U3b, U3c, U3d, U4, U4b, I1, adapter shape tests | Verified |
| AC2 duplicates, concurrency, restart, stuck pending | U5 to U9b, P2-fake, P3-fake and, against real Postgres, P1 to P4 | Verified (integration-real-code) |
| AC3 secret, method, size, malformed | U10 to U16, U15b, U17, N4, I1, W1 | Verified |
| AC4 staging or missing environment | U17b, U18, U18b, U19, I1, W1 | Verified |
| AC5 GitHub failure | U20 to U22b, U20b, U21b, ambiguous-create, search-phase, bad-number tests, adapter classification tests, I2, I2b, and real Postgres P5 | Verified |
| AC6 live PostHog test run | Needs the deployed bridge, the Fly secrets, the `production-error` label and an enabled PostHog destination; opens a public issue, so it needs the operator's approval immediately before the one run | Not verified: scheduled after merge and deploy to staging |
| AC7 real startup wiring | W1 (always runs, no database) and, against real Postgres, P6 and P7: the fake GitHub API received the right path, bearer token, title, body marker and label; two ids gave two different correct issues | Verified (integration-real-code) |
| AC8 unwired adapter | U23 (exact message), U24, the unwired-adapter-never-releases test, W1 (503 and "Adapter not wired" log) | Verified |
| AC9 first real production error | Cannot be produced on demand | Waiting: RISK-ACCEPT in `decisions.md`; DoD outcome will be COMPLETE WITH DEVIATIONS until seen |

7 of 9 acceptance criteria verified; the other two (AC6, AC9) are manual or post-merge by the DoR's own classification, not failures.

## Other checks

- Route and handler end-to-end coverage: the diff adds a route file and a route in `server.js`. No other test in `tests/` references the new route, handler or modules; the only Playwright specs mentioning a webhook cover `/webhook/stripe`, which this diff does not touch. No `@real-staging` spec is affected.
- Live browser render check: not applicable, no rendered UI output touched.
- Scope: all 18 commits map to a plan task, a review fix or a recorded decision; additions beyond the plan text are logged in `decisions.md` ("coha-s6 verify-completion: additions beyond the plan text").

## Residual risks carried forward

1. AC6 and AC9 as above, plus the operator prerequisites in `workspace/state.json` (create the fine-grained token, set the three Fly secrets typing the values yourself, create the `production-error` label, approve the one live run).
2. A retry arriving while the first attempt is still running gets 200 in-flight and the issue can be lost (RISK-ACCEPT, `decisions.md` 2026-11-14).
3. The takeover marker search lists only the 100 most recent labelled issues (`decisions.md` 2026-11-14).
4. The baseline failures above, and the occasionally failing timing test `tests/check-rb-s3-harness-agnostic-instructions.js` under heavy CPU load (not caused by this story).
