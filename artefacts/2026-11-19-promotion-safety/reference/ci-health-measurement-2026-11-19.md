# CI health measurement, 2026-11-19

Purpose: score the recent CI and test improvement work against the findings of `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md`, and measure the items that audit left unmeasured. One-off query of GitHub Actions history and repository settings; nothing was changed.

## Re-run rate (audit finding 7)

Window: the newest 1,000 workflow runs, 2026-11-15 21:03 to 2026-11-18 18:52 (about 3 days; GitHub returns at most 1,000 runs, so this is a short sample).

| Workflow | Runs | Re-run | Green after re-run |
|---|---|---|---|
| E2E Tests (Playwright) | 64 | 3 (5%) | 3 |
| Core browser tests | 29 | 3 (10%) | 3 |
| Staging Deploy | 35 | 1 (3%) | 0 |
| Watermark Gate, PR Checks, Cross-Tenant Isolation Repeat, Assurance Gate, Trace Validation, Vulnerability Check | 31 to 64 each | 0 | n/a |

The audit's baseline was 61 of 213 runs re-run (29%) for the old real-staging design. The E2E re-run rate is now 5% on a sample of 64. The Core browser tests job has a 10% re-run rate, every re-run ended green, so it flakes occasionally and has not yet been given a flake owner.

## Repository settings (audit finding 11)

`security_and_analysis` for `heymishy/skills-repo`: Dependabot security updates disabled; secret scanning, push protection, non-provider patterns and validity checks all disabled. Code scanning alerts and vulnerability alerts endpoints answered 404 (not enabled). No `.github/dependabot.yml`. The only security workflow is `vulnerability-check.yml` (`npm audit`). This needs repository Settings changes by the operator, not a story.

## Other audit scores

| Finding | Then | Now |
|---|---|---|
| Browser suite never runs in CI | 88 of 94 specs skipped; trial 186 passed, 90 failed of 308 | Core browser job: 147 tests, 144 passed, 3 skipped, 54.6 s of test time (5.8 min job). Smoke job: 13 tests, 10 passed, 3 skipped. 13 specs quarantined until 2026-12-15. |
| Known baseline failures | 70 entries | none; PR 1157 was blocked by 3 new regressions |
| Bookkeeping pushes trigger noise workflows | about 440 runs in 40 hours | commit `16f90eedd` (bookkeeping only) triggered 0 runs |
| Unit chain required | no | no; ruleset requires only the assurance gate and Scenarios A and B |
| Stale promotions waiting | 131 | 125 |
| Staging Deploy failure rate | 21% | 4 failures of 16 completed (25%), mostly the bri-s3.3 flake |
| Coverage measurement | none | none for the unit chain; informational `c8` on the browser suite only |

## Production state at the time of measurement

`https://skills-framework.fly.dev/version` reported sha `c0c9a46` (lpw-s3, PR 1142, deployed 2026-11-17), with no `buildRunId` field; `/health` answered `{"status":"ok"}`. `fly.toml` declares no health check.

## Limits

- 3-day sample; run history is capped at 1,000 runs.
- Counts of re-runs use the `attempt` field; a re-run that was cancelled is counted as a re-run.
- Fresh-database boot and the change-detector tests were not measured.
