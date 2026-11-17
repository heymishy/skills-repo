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
**How:** fix the shared test-environment causes (the fake database's missing journey tables and first-login flag, no stub secret for the signup limiter, stale spec text, a missing repository fixture), switch the job on as non-blocking, upload a per-test JSON report and a server code-coverage report, and record two consecutive runs. This is the first of two stories; the second picks the required core by capability.

## Architecture Constraints

- **Non-blocking.** The `Playwright E2E smoke tests` job keeps `continue-on-error` and its name; it is not made a required check here (the ruleset is the operator's, and requiring it is the second story's decision).
- **The fake database stays a test adapter.** The additions live in `src/web-ui/adapters/fake-test-db.js` and the test-mode wiring in `src/web-ui/server.js` (the `!process.env.DATABASE_URL` branch). Production wiring and the real Postgres code paths are not changed. The wiring is verified by behaviour, not by assignment (CLAUDE.md D37 point 4): the first sign-in for a new identity goes to `/welcome` and a second to `/dashboard`.
- **First-login adapter (D37).** The first-login adapter is wired to the fake database in test mode as its own task; its stub default already throws or is wired, and the test asserts both outcomes.
- **No production behaviour change.** The product gates found by the triage (the "connect a repo" gate, the first-login redirect) are intentional and stay; the tests are updated to satisfy them.
- **Stub secret.** The job generates a per-run random secret (the Scenario jobs already do this) and passes it to the server and the tests so the signup limiter's bypass works; no stored secret.
- **Coverage tooling.** Server code coverage uses Node's built-in `NODE_V8_COVERAGE` and a pinned `c8` run through `npx` in the job only. It is not added to `package.json`, so the repo gains no dependency.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy followed (workflows change by pull request, which this is).

## Dependencies

- **Upstream:** the 2026-11-17 audit and trial, `sep-s1` (stub secret pattern), `bkn-s1`.
- **Downstream:** `lpw-s2` (capability matrix, the required `@core` set, folding journeys into Scenarios A and B, the quarantine list and coverage comparison).

## Acceptance Criteria

**AC1:** Given the fake test database, When a spec creates a journey (`POST /journeys`), adds, reorders, renames and positions its stages, and opens the canvas, Then every query those handlers issue is answered with correct rows, `POST /journeys` redirects to `/journeys/<id>`, and the 8 specs that fail today for this reason pass (`ep1-s4-stage-reorder`, `ic-s2-canvas-drag-position`, `ic-s4-keyboard-node-movement`, `jae-s5-delivery-swimlane-grid`, `jcx-s3-emotion-curve`, `jcx-s6-swimlane-grid`, `jcx-s7-panel-entry-and-save-feedback`, `ep1-s3-stage-panel-focus-management`).

**AC2:** Given the test server (no database URL), When a new identity signs in for the first time and then again, Then the first sign-in lands on `/welcome` and the second on `/dashboard`, and `bri-s3.6` AC1 passes.

**AC3:** Given the Playwright E2E job, When it runs, Then it generates a per-run stub secret and passes it to both the server and the tests, so a spec that signs up repeatedly is not answered `429`, and `b1-formed-idea-outer-loop-story-map` and `dsh-s4-resume-conversation-survives-restart` no longer fail with `HTTP 429`.

**AC4:** Given the specs with stale text, When they run, Then none hard-codes `localhost:3000` (the server runs on the configured base URL), the `nav` locator in `wuce23`, `wuce24` and `wuce25` matches exactly one element, and the keyboard focus-trap check in `csd-s2` compares element identity instead of tag, id and class, so the 9 tests that fail today for these reasons pass.

**AC5:** Given a product, When a spec needs it to be able to start a feature, Then a shared fixture connects a repository to the product (satisfying the "connect a repo" gate), and `frsr-s1-feature-row-session-resume` passes; the other four specs that create a product and start a feature (`pnfc-s1`, `ep3-s1`, `reference-upload`, `dsda-s1`) are run with the fixture and each is recorded as passing, failing with a named new cause, or stale.

**AC6:** Given `.github/context.yml` and the `e2e` job, When a pull request runs, Then `audit.e2e_tests` is true, the `Playwright E2E smoke tests` job runs the whole local suite non-blocking with a 30-minute limit, uploads the Playwright JSON report, and writes a per-spec table (passed, failed, skipped, seconds) to the job summary.

**AC7:** Given the same job, When it runs, Then it collects server code coverage for `src/web-ui` from the browser run, uploads the report, and writes the total line and function percentages and the list of `server.js` routes no browser test requested to the job summary; none of it affects pass or fail.

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
- **Security:** the stub secret is per-run, masked in logs and never stored; the fake database is only wired when no database URL is set.

## Complexity Rating

**Rating:** 2 - ambiguity remains in groups only measured, not fixed here, and the coverage step is new to this repo.
**Scope stability:** Unstable - the second CI run may expose causes hidden behind the first failures (knock-on timeouts).
