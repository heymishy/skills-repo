## Story: The local Playwright suite becomes a trustworthy, measured, non-blocking signal

**Epic reference:** None - short-track (a CI-quality story from the 2026-11-17 audit, recommendation 1, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md` finding 1, `artefacts/2026-11-17-testing-cicd-audit/spikes/playwright-local-suite-trial.md` (308 tests, 186 passed, 90 failed, 32 skipped in one CI run) and `.../playwright-local-suite-triage.md` (every failure placed in a group; three suspected product defects checked and all test-side).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [test]

## User Story

As **the operator**,
I want **the 88 browser spec files that never run on a pull request to run in CI as a non-blocking signal whose failures are real, with a per-test report and a code-coverage baseline**,
So that **I can choose a stable required core from evidence, and so that a red mark in that job means a broken product rather than a drifted test double**.

## Benefit Linkage

**Metric moved:** None formal. Today the suite is switched off (`audit.e2e_tests` is unset); a one-off run showed 90 of 276 executed tests failing, mostly for test-environment reasons.
**How:** fix the shared test-environment causes (stale CSRF-token source and default-stage seeding in the journey specs, the fake database's missing journey tables, stale spec text, a missing repository fixture), stop the local suite reaching the shared staging environment (the six staging-targeted specs are the Scenario A and B specs and are excluded from it), switch the job on as non-blocking, upload a per-test JSON report and a server code-coverage report, and record two consecutive runs. This is the first of two stories; the second picks the required core by capability.

## Architecture Constraints

- **Non-blocking.** The `Playwright E2E smoke tests` job keeps `continue-on-error` and its name; it is not made a required check here (the ruleset is the operator's, and requiring it is the second story's decision).
- **The fake database stays a test adapter.** The additions live in `src/web-ui/adapters/fake-test-db.js` only (narrow, explicit query branches in the file's own style, plus a `connect()` stand-in). Production wiring and the real Postgres code paths are not changed.
- **No production behaviour change.** The product gates found by the triage (the "connect a repo" gate, the first-login redirect) are intentional and stay; the tests are updated to satisfy them.
- **Never the shared staging environment.** The six specs that target "a real deployed environment" (`a1`, `a2`, `a3`, `a4`, `dsh-s4`, `b1`) default to `https://wuce-staging.fly.dev` through `fixtures/staging-auth.js`. They are exactly the Scenario A and B specs, which already run against the pull request's own server. The local-suite job sets `E2E_LOCAL_SUITE=true` and `playwright.config.js` ignores those six files then; the Scenario jobs do not set it and still name the files explicitly. A pull request run must never create tenants or products on shared staging.
- **Coverage tooling.** Server code coverage uses Node's built-in `NODE_V8_COVERAGE` and a pinned `c8` run through `npx` in the job only. It is not added to `package.json`, so the repo gains no dependency.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy followed (workflows change by pull request, which this is).

## Dependencies

- **Upstream:** the 2026-11-17 audit and trial, `sep-s1` (the Scenario jobs that own the six excluded specs), `bkn-s1`.
- **Downstream:** `lpw-s2` (capability matrix, the required `@core` set, folding journeys into Scenarios A and B, the quarantine list and coverage comparison).

## Acceptance Criteria

**AC1:** Given the eight journey-seeding specs (`ep1-s4-stage-reorder`, `ic-s2-canvas-drag-position`, `ic-s4-keyboard-node-movement`, `jae-s5-delivery-swimlane-grid`, `jcx-s3-emotion-curve`, `jcx-s6-swimlane-grid`, `jcx-s7-panel-entry-and-save-feedback`, `ep1-s3-stage-panel-focus-management`), When they seed a journey (`POST /journeys`), Then each takes its CSRF token from a page that embeds one (`/customer-journeys`, because `/` now redirects to the dashboard, which embeds none), opts out of the five default stages (`seedDefaultStages: false`), and the fake test database answers every query the journey handlers issue (so `POST /journeys` redirects to `/journeys/<id>`); and each of the 17 tests passes or is recorded with a new named cause.

**AC2 (changed after the triage was checked in code):** Given `bri-s3.6` AC1, When it runs, Then its result and cause are recorded: it passes alone and fails only after the other `bri-s3.x` specs have run on the same server (reproduced locally with five specs in CI order), because the test server sets `TENANT_ORG_ALLOWLIST: 'e2e-shared-org'` for every spec and an earlier spec already made an admin in that shared tenant. No product code changes; the first-login adapter was already wired in test mode (`server.js`, bri-s3.6), which the triage had wrongly suspected.

**AC3 (changed after finding the real cause of the 429s):** Given the Playwright E2E job, When it runs, Then the six staging-targeted specs (`a1-staging-auth-stub`, `a2-stripe-test-mode-plan-selection`, `a3-product-feature-ideate-canvas`, `a4-ideate-session-resume`, `dsh-s4-resume-conversation-survives-restart`, `b1-formed-idea-outer-loop-story-map`) are not run by it, no spec in it can reach `wuce-staging.fly.dev`, and the 291 remaining tests run; the Scenario A and B jobs still run those six unchanged. (The `429 Too many attempts` in the trial came from the real staging server's limiter, not the local one.)

**AC4:** Given the specs with stale text, When they run, Then none hard-codes `localhost:3000` (the server runs on the configured base URL), the `nav` locator in `wuce23`, `wuce24` and `wuce25` matches exactly one element, and the keyboard focus-trap check in `csd-s2` compares element identity instead of tag, id and class, so the 9 tests that fail today for these reasons pass.

**AC5:** Given a product, When a spec needs it to be able to start a feature, Then a shared fixture (`tests/e2e/fixtures/product-repo.js`, over the existing `/test/seed-product-repo` endpoint) connects a repository to the product, satisfying the "connect a repo" gate; `pnfc-s1-new-feature-choice` and `frsr-s1-feature-row-session-resume` use it, and the outcome of each of the five feature-flow specs (`pnfc-s1`, `frsr-s1`, `ep3-s1`, `reference-upload`, `dsda-s1`) is recorded as passing, failing with a named new cause, or stale.

**AC6:** Given `.github/context.yml` and the `e2e` job, When a pull request runs, Then `audit.e2e_tests` is true, the `Playwright E2E smoke tests` job runs the whole local suite non-blocking with a 30-minute limit, uploads the Playwright JSON report, and writes a per-spec table (passed, failed, skipped, seconds) to the job summary.

**AC7:** Given the same job, When it runs, Then it collects server code coverage for `src/web-ui` from the browser run, uploads the report, and writes the total line and function percentages and the 15 least-covered files to the job summary (and says plainly when no coverage was recorded); none of it affects pass or fail. The list of `server.js` routes no browser test requested needs a request log and moves to `lpw-s2`.

**AC8 (live, on the pull request):** Given the pull request, When its CI runs twice in a row on the same commit, Then both runs' results (pass, fail, flaky per test), the run times and the coverage baseline are recorded in `decisions.md`, with tests that differ between the two runs listed as flaky.

## Out of Scope

- Choosing the required core, folding journeys into Scenarios A and B, quarantining failing specs, and the capability matrix (`lpw-s2`).
- Making the job a required check, or changing the ruleset.
- The kanban board group (12 tests), the model-session group (8) and the pod group (9) from the triage: they are measured in AC8 and handled in `lpw-s2` or their own story if they are test-environment causes.
- Retiring or rewriting stale features' specs (`iwu2-right-panel-layout`, `reference-upload` if stale).
- Any change to production behaviour or to the real-Postgres code paths.

## NFRs

- **Reliability:** the job is non-blocking; a failing suite never blocks a merge.
- **Runtime:** the job finishes inside its 30-minute limit (the trial took 15.7 minutes).
- **Security:** no pull request run reaches shared staging; the fake database is only wired when no database URL is set; no secret is read or stored by the job.

## Complexity Rating

**Rating:** 2 - ambiguity remains in groups only measured, not fixed here, and the coverage step is new to this repo.
**Scope stability:** Unstable - the second CI run may expose causes hidden behind the first failures (knock-on timeouts).
