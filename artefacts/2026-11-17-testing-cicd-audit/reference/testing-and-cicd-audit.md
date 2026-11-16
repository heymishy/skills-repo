# Testing and CI/CD audit, 2026-11-17

Scope: is the current testing and CI/CD approach optimal? Read-only. Evidence from the repo, the GitHub Actions run history, merged PRs, the master commit log, the repo ruleset, and the production-error issues. Builds on `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md`, whose findings have mostly been actioned this week (ciw-s2, trr-s1, bfl-s1, bfl-s2, tht-s1, pws-s1, sep-s1).

## Verdict

A strong delivery loop with weaker gates than it appears. The loop is fast and well observed: 118 pull requests merged in 30 days, median 30 minutes from open to merge, no reverts, and production errors become GitHub issues that close in a median of 0.4 hours. But several things that look like gates are not, a lot of CI runs are noise, and the deploy path has no verification after promotion. None of it is urgent; most of it is cheap to fix. The biggest single gap is that most of the browser test suite never runs.

## What works (keep)

- **Speed and cadence.** 118 merged PRs in 30 days (4.7 per active day), median open-to-merge 0.5 hours, p90 8 hours, 0 reverts. The unit chain runs about 876 files in about 3 minutes (758 of them under 1 second).
- **The error chain.** 9 production-error issues, 8 closed, median time to close 0.4 hours, p90 4.7 hours.
- **Per-file test results** are now recorded as a CI artefact, and the baseline of known failures is empty.
- **Newly strong this week:** the wiring smoke test (pws-s1) and the Scenario A and B jobs testing the PR's own build (sep-s1, with a negative control that turned a job red).
- **The staging deploy is correctly path-filtered** (bookkeeping pushes do not deploy).

## Findings

### A. Gates that are weaker than they look

1. **Most of the browser suite never runs on a PR (high).** The check named "Playwright E2E smoke tests" reads `audit.e2e_tests` from `.github/context.yml`; the key is absent (it appears only in comments), so the job logs "E2E skipped (opt-in flag not set)" and reports green in about 15 seconds. That leaves 88 of the 94 Playwright spec files (the local-mocked UI, layout and journey specs) unexercised in CI; only the 6 real-staging specs run. The suite's current health is unknown because it has not been run here for this audit. When enabled it was designed as non-blocking (`continue-on-error`).
2. **"Lint, typecheck, test, build" overstates what it checks (medium).** `lint` is `node --check` (syntax only), `typecheck` only `require`s each file, `build` only checks that `server.js` exports `createApp`. There is no ESLint, no TypeScript and no coverage tool, so unused variables, type errors and untested code are invisible.
3. **The unit chain is not a required check (high).** The ruleset requires `Run assurance gate`, `Scenario A E2E`, `Scenario B E2E` and a pull request, with linear history. The job that runs all 876 test files (including the wiring smoke test) can be red and the PR still merges. Branches need not be up to date (`strict` is false) and there is no merge queue. The operator can also push straight to master (bypass), which accounts for most master commits (see C).
4. **No verification after production promotion (medium).** `fly.toml` has no health checks, nothing runs after `promote-to-prod`, and there is no automated rollback. Production builds its own image from the commit, not the image staging ran. The post-promotion gap is partly mitigated by the error chain, which reports failures within minutes.
5. **Stale promotions are a footgun (medium, to verify).** 131 Staging Deploy runs are sitting in "waiting" for production approval. Each promote job checks out and builds its own run's commit, so approving an old one should deploy an old commit over newer production code. Not tested here; superseded runs should be cancelled automatically.

### B. Noise and waste

6. **Every master push, mostly bookkeeping, triggers workflows that add nothing (high volume, low value).** About 74% of master commits (442 of the newest 600) touch only `artefacts/`, `workspace/` or `pipeline-state.json`. Each push starts Improvement Agent dreaming (149 runs in 40 hours, 149 failures: it has never succeeded), Trace Commit (148), Vulnerability Check (148), and until recently the Pages deploy (76, all failed) and Fleet (28, all failed). In 40 hours that is roughly 440 runs, a red mark on most master commits, and a signal-to-noise problem for anyone looking at the Actions tab. Only the staging deploy has a path filter.
7. **Retry-until-green on the old real-staging design.** In the `E2E Tests (Playwright)` workflow 61 of 213 runs (29%) were re-run, and 50 of those re-runs ended green. That is the baseline to compare against now that the scenarios run on the PR's own build; it should fall sharply, and if it does not, something else is flaky.
8. **Staging Deploy fails 21% of the time** (10 of 47 completed), and 8 of the 10 failures were the `@mocked` smoke test.
9. **28% of test files read repository text, not behaviour (medium).** 246 of 876 files read `artefacts/`, `.github/`, skills, templates or workflows as text. They guard governance rules, but they also act as change-detectors: five such guards had to be reversed for one workflow change this week (cif-s1, cif-s2, fhff-s2, pmec-s1 U3 and U4). That is a real maintenance cost; it is not a defect.

### C. Process overhead

10. Bookkeeping dominates the commit history (442 of 600), pushed straight to master. It buys an audit trail, but each commit has a CI cost (finding 6) and none is reviewed. The cost is fixable by path filters without changing the practice.

### D. Missing coverage

11. **Security tooling is minimal (medium).** `npm audit` only: no Dependabot, no CodeQL or other code scanning, no secret scanning workflow, no SBOM. (Repository-level settings that are not visible in the files may exist; check Settings > Code security.)
12. **Fresh-environment boot is untested and was broken (medium).** This week's PR environment showed an empty database does not boot cleanly (startup migrations race and run out of order; three boots to settle) and the durable chat table needs a manual script (see `artefacts/2026-11-17-scenario-e2e-on-pr-build/decisions.md`). Disaster recovery or a new environment would hit this.
13. **The real model and production configuration are never exercised by tests.** Everything uses the mock gateway; production secrets, the real model and the real database are only seen by users and the error chain.
14. **34 skipped or fixme specs** in the Playwright files (the Stripe hosted checkout among them), and **no coverage measurement**, so there is no way to see which code is untested.

## Recommendations, in order

1. **Find out what the browser suite is worth.** Run the 88 local-mocked specs once in CI (a trial branch with the flag on), record pass, fail and time, then decide: make a fast, stable core of it required, quarantine the rest. Today it is zero value at zero cost, and it may be much better or worse than expected.
2. **Make the unit chain a required check and name it honestly.** Ruleset change (operator): require `Lint, typecheck, test, build`; then rename it to what it does, or add real lint (ESLint) and call it that. Consider `strict` (up to date) once a merge queue is acceptable.
3. **Stop the bookkeeping noise.** Path-filter Trace Commit and Vulnerability Check off bookkeeping paths (run Vulnerability Check on dependency changes and on a schedule), and finish `ciw-s1` (dreaming) so master commits stop going red. About 400 runs per 40 hours disappear.
4. **Harden the deploy path.** Fly health checks; a read-only post-promotion check of `/health` and `/version`; auto-cancel superseded waiting promotions; later, promote the staging image rather than rebuilding.
5. **Fix fresh-environment boot** (one story for migration ordering and the manual `session_turns` script) and add a test that a fresh database settles in one boot; the PR environment now exercises this on every PR.
6. **Security baseline** (operator settings plus a workflow): Dependabot, CodeQL, secret scanning.
7. **Reduce change-detector tests.** Move workflow-text assertions into one contract file per workflow, so a workflow change touches one test, not five.
8. **Add coverage reporting** (non-blocking) to see untested code, before deciding whether to set a threshold.

## Method and limits

- Run history: GitHub returns at most 1,000 runs, which covered only 2026-11-15 to 11-16 for the all-workflow view; per-workflow views for the PR gates covered 2026-10-17 onward (1,241 runs). Durations for rerun runs include waiting, so medians were used.
- Test timings come from one full local Windows run (some bash-dependent files are slow only locally); CI's unit chain takes about 3 minutes.
- Test classification is by static pattern matching on the files, so counts are approximate.
- The 88 local-mocked specs were not run for this audit; their health is unknown.
- Item 5 (stale promotions deploy old commits) is reasoned from the workflow and not tested.
- No costs in minutes or money were computed; the repository's Actions plan was not checked.
