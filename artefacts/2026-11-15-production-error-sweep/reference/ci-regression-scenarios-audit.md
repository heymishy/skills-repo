# CI regression scenarios audit: functionality versus performance

Date: 2026-11-16. Method: read-only. The last 1000 GitHub Actions runs (2026-11-12 18:41 to 2026-11-16 05:01 UTC, about 3.5 days) were pulled with `gh run list` and summarised; failed gating runs were opened with `gh run view`; the E2E workflow and staging deploy workflow files were read. Nothing in CI was changed. Limits: a 3.5-day window, run-level data only (no per-test history is kept anywhere, so "which test files have never failed" cannot be answered yet), and manual re-runs I triggered are counted as reruns.

## Short answer

Yes, review it. Most of the cost and noise is not in the functional tests themselves. It is in (1) workflows that fail every time, (2) heavy gates running on bot-made incident PRs, (3) a staging end-to-end job that sits on the critical path of every PR but tests the already-deployed master branch, not the PR's code, and (4) no scenario that boots the real application wiring and exercises it, which is where this session's real bugs lived.

## What the data says

| Finding | Evidence |
|---|---|
| A third of all runs are guaranteed-red | 342 of 1000 runs belong to three workflows that failed every time: "Improvement Agent - Scheduled Dreaming" (151 runs, 150 triggered by every push), "Deploy dashboards to GitHub Pages" (109, every push) and "Fleet Aggregation" (82, scheduled). About 2 runner-hours, but the real cost is trust: red is normal, so a genuinely red run is easy to ignore. |
| Incident bot PRs consume a quarter of PR gating | 42 of 180 pull-request runs of the 7 gating workflows were on `incident/*` branches (markdown-only incident records). 16 of those 42 failed (38%), against 2 of 138 on real feature branches (1.4%). Each incident PR runs the whole 131 s unit chain and the staging E2E. |
| Real PRs almost always pass first time | 2 failures in 138 gating runs on real branches in the window. The known flake (`cat-s1`, fixed in #1120) and a trace-validation config gap account for most of what you saw. |
| The critical path is the staging E2E, not the unit suite | Median PR time to green is 339 s (p90 357 s). The workflow "E2E Tests (Playwright)" has a median of 339 s; "PR Checks" is 168 s, of which the unit test chain is 131 s and lint 8 s. |
| The staging E2E does not test the PR | `e2e.yml` job "Scenario A E2E (staging)" runs against real `wuce-staging` (secret `E2E_STAGING_BASE_URL`), which runs whatever master last deployed, and it shares the `deploy-group` concurrency lock with staging deploys, so it queues behind them. It is a health check of master's staging, serialised into every PR. It cannot catch a regression in the PR's own diff. |
| Staging deploys mostly never finish | Of 60 "Staging Deploy" runs: 11 succeeded, 2 failed (both the `@mocked` smoke suite against staging, a 502 blip, 15% of completed runs), 1 in progress and 46 still "waiting". The waiting ones are production-promotion approval requests that were never approved or cancelled. |
| Cheap, steady jobs are fine | Vulnerability check (19 s), watermark gate (15 s), trace commit (25 s), cross-tenant isolation repeat gate (61 s, zero tolerance) and the assurance gate (100 s) pass reliably. |
| No performance scenario exists outside the unit suite | The only performance checks are wall-clock asserts inside functional tests (for example the `cat-s1` 50 ms walk). Real performance problems found in production this week were not caught by anything in CI: the 6 s unknown-artefact lookup, the 6 s cold product page, `/signals` under parallel load. |
| 5 permanent baseline failures | `check-pipeline-state-integrity.js` (C3, tfhc-s1), `check-pcr-s1-test-runner.js`, `check-p3.5-validate-trace.js`, `check-rtvap-s1-archived-test-plan-coverage.js` and `check-p4-enf-second-line.js` fail in every full local run. CI tolerates them by comparing with a stored baseline, which blocks new failures but lets old ones rot. |

## The gap that matters most: wiring

Every real bug found in this session's sweeps passed a suite of 866 files: the unwired `getCommitResult` (scr-s1), the unwired `submitAnswer` (`sub-s1`, production issue #1121), the 503 on odd artefact URLs, the 500 on broken escapes, commit-preview rendering a commit form for an unknown session, and the turn endpoints running a model turn for garbage (`tvl-s1`). The tests wire their own adapters, so nothing checks what `server.js` actually wires or what the real route table does with hostile input. A single test that boots the real app and sweeps every route shape with bad ids and bodies would have caught all of them in under two minutes. This is the highest-value functional scenario missing from CI.

## Recommendations (nothing done yet)

1. **Stop the guaranteed-red workflows.** Fix or disable the three. Removes 34% of runs and restores "red means something". Smallest change, no risk.
2. **Do not run the heavy gates on incident PRs.** Path-filter `incident/*` PRs that only add `artefacts/incidents/**` (or whatever the record writes) to the cheap checks only. Removes about 23% of PR gating runs and the red incident PRs.
3. **Move the staging E2E (Scenarios A and B) from "every PR" to "after deploy".** It already has a natural home: the staging deploy workflow's post-deploy confirmation. Cuts median PR time to green from about 340 s to about 170 s and removes the 502 and queue-behind-deploy flakes from the PR gate. Replace the lost per-PR signal with item 4.
4. **New story (`pws-s1`): a production-wiring smoke test in the unit chain.** Boot the real app in-process with production wiring (the `WIRE_SKILL_ADAPTERS` path, mock model), run the route-shape fuzz used in sweeps 2 and 3 plus assertions that no route answers 5xx for hostile input and that every injectable adapter is wired. Runs in about a minute on the PR's own code, which is what the staging E2E cannot do.
5. **Separate performance from functionality.** Replace in-suite millisecond asserts with a scheduled job (nightly and after deploy) that measures a short list of paths (cold product page, artefact lookup, `/signals`, turn endpoint with the mock model) and compares against a stored baseline as a ratio, reporting regressions without blocking PRs.
6. **Clean the baseline.** Fix or retire the 5 permanently failing files so a clean run is possible and the "no new failures" diff is not the only protection.
7. **Auto-cancel superseded "waiting" staging promotions** so approvals do not pile up (46 now).
8. **Start recording per-test-file results** (pass/fail/duration as a CI artefact) so the next audit can find tests that have never failed, tests that duplicate each other (about 30 files re-implement the same turn request mocks) and the real slowest files.

## What I would keep per PR

Lint; the unit chain with impacted-file selection once item 8 exists (until then the full chain, 131 s is acceptable); the cross-tenant isolation repeat gate; the vulnerability check; trace validation; the watermark and assurance gates; and the new wiring smoke test.

## Sequencing and risk

Do items 1, 2 and 7 first (low risk, immediate noise reduction). Build item 4 before touching item 3, so no per-PR coverage is removed before its replacement exists. Items 5, 6 and 8 follow. Moving checks off the PR gate widens the window before some regressions are noticed; items 3 and 4 together are designed so the only thing leaving the gate is a check that was not testing the PR anyway.

## Correction (2026-11-16, after reading a real CI log and the first `test-results.json`)

The finding "5 permanent baseline failures" was wrong in two ways.

- **What CI really tolerates is much larger.** `tests/known-baseline-failures.json` lists 70 files (recorded 2026-07-16). In CI run 43806886880 only 3 of them fail (`scripts/check-pipeline-state-integrity.js`, `tests/check-gpa-sc06-source-path-guard.js`, `tests/run-gpa-tests.js`) and 67 now pass. A regression in any of those 67 would be reported as "no new regressions - all failing files are already-documented pre-existing baseline gaps". This is a bigger risk than the five I described. Story `bfl-s1` was rewritten around it (shrink the baseline to the real failures first).
- **The five I saw were local, not CI.** On this Windows machine `check-p4-enf-second-line`, `check-rtvap-s1-archived-test-plan-coverage` and sometimes `check-p3.5-validate-trace` fail with `exit: null` because `bash` and `sh` do not work here; they pass in CI. Only `check-pipeline-state-integrity` and `check-pcr-s1-test-runner` are common to both lists.

First data from the new per-file results (a full local run, 867 files): median file 232 ms, 31 files over 5 s; slowest `check-p3.5-validate-trace` 98.7 s, `check-p4-enf-second-line` 60.1 s, `check-rb-s1-cli-init` 34.0 s, `check-pcr-s1-test-runner` 32.1 s, `check-rb-s5-optional-outer-loop-install` 27.7 s. Local timings are inflated by the broken shell; CI numbers will be the real basis.
