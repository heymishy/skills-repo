# Story: CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need

**Slug:** cpco-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-04

---

## Problem

A deep-dive performance analysis of this repo's own CI pipeline (last several `staging-deploy.yml` and PR-check runs) found that `npm ci`/`npm install` dominates almost every job's wall-clock time, far exceeding the job's own actual work. Examples measured directly: `deploy-staging`'s "Install dependencies" step took 7m01s versus 39s for the actual `flyctl deploy`; PR #829's "Cross-tenant isolation spec" job spent 7m01s installing versus 11s running the test itself; the same PR's "Lint, typecheck, test, build" job spent 5m05s installing versus ~2m13s for lint+typecheck+test+build combined.

Root cause: `@playwright/test` is a `package.json` devDependency, and its own `npm install` postinstall hook downloads all three browser engines (Chromium, Firefox, WebKit — 300MB+) by default. Nothing in this repo sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, so every single job that runs `npm ci` pays this cost -- including jobs that never touch Playwright at all (`deploy-staging`, the `Lint, typecheck, test, build` job, `archive-session-turns.yml`), and jobs that only ever need Chromium but separately re-fetch it moments later via an explicit `npx playwright install --with-deps chromium` step, effectively downloading browsers twice.

Separately, no workflow in this repo uses `actions/cache`, so even the jobs that legitimately need Chromium re-download it from scratch on every single run, with zero reuse across runs.

## As a / I want / So that

As the operator running this pipeline
I want CI jobs to skip downloading Playwright browsers they never use, and to cache the Chromium download for jobs that do need it
So that PR checks and staging deploys stop losing minutes per job to redundant, unnecessary, or uncached browser downloads

## Acceptance Criteria

- **AC1:** Every `npm ci` step across `.github/workflows/*.yml` (9 call sites: `staging-deploy.yml` x3 -- `deploy-staging`, `smoke-test`, `post-deploy-e2e-confirm`; `e2e.yml` x3 -- `Playwright E2E smoke tests`, `Scenario A E2E`, `Scenario B E2E`; `bri-s3.4-cross-tenant-repeat-gate.yml` x1; `pr-checks.yml` x1; `archive-session-turns.yml` x1) sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'` in its step `env`, so the postinstall hook never downloads any browser.
- **AC2:** Every job that already runs an explicit `npx playwright install --with-deps chromium` step after `npm ci` (6 call sites: `staging-deploy.yml`'s `smoke-test` and `post-deploy-e2e-confirm`; all 3 jobs in `e2e.yml`; `bri-s3.4-cross-tenant-repeat-gate.yml`) gets an `actions/cache` step immediately before that install step, keyed on `runner.os` plus a hash of the installed Playwright version (read from `package.json`/`package-lock.json`), caching the Playwright browser binary directory (`~/.cache/ms-playwright` on Linux runners) -- so a repeat run with an unchanged Playwright version reuses the cached Chromium instead of re-downloading it.
- **AC3:** `cache: 'npm'` is present on every `actions/setup-node` step across the same set of workflow files where it is currently missing (`e2e.yml` x3, `bri-s3.4-cross-tenant-repeat-gate.yml` x1, `staging-deploy.yml`'s `post-deploy-e2e-confirm`, `archive-session-turns.yml`), matching the pattern already proven in `deploy-staging`, `smoke-test`, and `pr-checks.yml`'s own job.
- **AC4 (regression guard):** Jobs that need Chromium still successfully get a working Chromium install and their own test suites still pass -- confirmed via real CI run (GitHub-native behaviour, cannot be locally simulated; RISK-ACCEPTed with post-merge observation, matching this repo's own established B2/sdsb-s1 precedent).
- **AC5 (regression guard):** `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`, `tests/check-bri-s2.6-smoke-test-promote-gate.js`, and `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` all still pass unmodified -- none of their regex assertions inspect `env:` blocks or steps before/after the `npm ci`/`playwright install` steps they check, but this must be confirmed directly, not assumed.
- **AC6 (observable improvement):** A real, post-merge CI run for a job that never needs Playwright (e.g. `deploy-staging` or `Lint, typecheck, test, build`) shows its "Install dependencies" step duration drop substantially from its pre-fix baseline (7m01s and 5m05s respectively, captured in the performance deep-dive this story is based on).

## Out of scope

- Parallelizing `staging-deploy.yml`'s own `needs:` sequencing (deploy -> smoke-test -> post-deploy-e2e-confirm) -- a separate, deliberately-deferred optimization per the deep-dive's own findings, since it risks reintroducing the `sedf-s1` cold-app/cold-DB race this repo already fixed once.
- The Neon/Fly cold-start correctness gap behind `purge-e2e-tenants.js`'s 60-second timeout -- tracked as a separate story (`stcs-s1`, staging cold-start correctness) since it is a different root cause (a data-hygiene/correctness risk, not an install-time inefficiency) and should not be conflated with this story's narrower install/cache scope.
- Any workflow file that does not run `npm ci` at all (`copilot-setup-steps.yml`, `trace-aggregation.yml`, `assurance-gate.yml`, `watermark-gate.yml`, `attestation-publisher.yml`, `compliance-report.yml`, `approve-dor-github-issue.yml`, `fleet-aggregation.yml`) -- already fast per the deep-dive's own measurements, and out of this story's problem statement.

## Benefit linkage

Directly reduces CI wall-clock time and compute cost across every PR check and every staging deploy, going forward, for as long as this repo exists -- the deep-dive's own estimate is roughly 15-25 minutes of wall-clock/compute saved per PR and several minutes per staging-deploy run. No formal benefit-metric artefact -- short-track story, consistent with every other short-track delivery this session.
