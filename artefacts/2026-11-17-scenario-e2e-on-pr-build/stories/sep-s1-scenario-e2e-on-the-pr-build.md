## Story: Scenario A and B end-to-end tests run against the pull request's own build before merge, and against the deployed staging before production

**Epic reference:** None - short-track (a CI-quality story from the CI audit, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` item 3, and the operator's decisions of 2026-11-17: gate promotion on the post-deploy run, and "I want the scenario a and b tests to actually pass new builds before they are merged onto staging and again prod".
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci]

## User Story

As **the operator**,
I want **Scenarios A and B to run against the code in the pull request and to pass before it can merge, and to run again against the deployed staging before anything is promoted to production**,
So that **a build is proven by the real end-to-end journeys twice, on its own code, and the PR-time run stops being a test of whatever was last deployed to the shared staging app**.

## Benefit Linkage

**Metric moved:** None formal. Today the two required PR checks run the PR's spec files against the shared `wuce-staging` app, which is running the previously merged master: the PR's code is never exercised, the jobs queue behind staging deploys, and they flake on staging load (502s). After this story the same required checks, with the same names, test the PR's own build in a throwaway environment, and promotion to production additionally waits for the real-staging run.
**How:** the two jobs in `.github/workflows/e2e.yml` boot the PR's server inside the runner against a Postgres service container with the mock model gateway on, and run the same spec files against it; `promote-to-prod` in `staging-deploy.yml` also needs the existing post-deploy real-staging confirmation.

## Architecture Constraints

- **Same check names, so nothing changes in the ruleset.** The jobs keep their display names `Scenario A E2E (staging)` and `Scenario B E2E (staging)` (the ruleset requires those exact names; renaming is a separate operator settings change, offered as a later cleanup). No merge can be blocked by a check that never reports.
- **Hermetic and secret-free.** The PR job generates its own random `E2E_STAGING_AUTH_STUB_SECRET` per run, starts `node src/web-ui/server.js` in the runner (production mode, not `NODE_ENV=test`, because the specs target a "real deployed environment") with `MOCK_LLM_GATEWAY=true`, a Postgres service container as `DATABASE_URL`, and the three required variables set to dummy values, and points `E2E_STAGING_BASE_URL` at `http://127.0.0.1:<port>`. It uses no staging URL, staging database, staging secret or staging admin password, and it does not join the `deploy-group` concurrency group (nothing shared is touched).
- **Same specs, same flags.** The spec file lists and the `context.yml` opt-in flags (`audit.staging_e2e_scenario_a`, `audit.staging_e2e_scenario_b`) are unchanged; no spec is edited to make it pass except where it reads a staging-only value that the throwaway environment legitimately lacks (any such edit is listed in the decisions file). The specs that are `test.skip()` in CI today (Stripe hosted checkout) stay skipped.
- **Independent jobs.** Scenario B no longer `needs` Scenario A (each job boots its own environment), so they run in parallel.
- **Promotion also waits for real staging.** `promote-to-prod` gains `needs: [smoke-test, post-deploy-e2e-confirm]`. `post-deploy-e2e-confirm` runs `if: always() && deploy-staging succeeded`, so a skipped or failed confirmation blocks promotion (a job whose `needs` did not succeed does not run). The existing guards that read this file (`scripts/check-no-prod-deploy-on-push.js`, `check-bri-s2.6-smoke-test-promote-gate.js`) are updated, not bypassed.
- **Failure is visible.** Server log is uploaded with the traces on failure.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-004 (single config source) kept, because the flags stay in `context.yml`; ADR-018 addendum (these specs are never run from `npm test`) kept. Zero new npm dependencies. No application source is changed.

## Dependencies

- **Upstream:** pws-s1 (merged: the in-process wiring smoke test), the mock gateway (`MOCK_LLM_GATEWAY`), the staging-safe auth stub (a1).
- **Decision log:** `artefacts/2026-11-16-ci-regression-review/decisions.md` (sequencing: sep-s1 after pws-s1; the ruleset constraint).

## Acceptance Criteria

**AC1:** Given `e2e.yml`, When it is read, Then the jobs named `Scenario A E2E (staging)` and `Scenario B E2E (staging)` still exist and each one boots the PR's own server in the runner (`node src/web-ui/server.js` with `MOCK_LLM_GATEWAY=true`, a `postgres` service container, a per-run random auth-stub secret and `E2E_STAGING_BASE_URL` set to a local address) before running its spec files.

**AC2:** Given those two jobs, When their text is scanned, Then neither references `secrets.E2E_STAGING_BASE_URL`, `secrets.STAGING_DATABASE_URL`, `secrets.E2E_STAGING_AUTH_STUB_SECRET`, `secrets.E2E_STAGING_ADMIN_PASSWORD` or the `deploy-group` concurrency group, and Scenario B has no `needs` on Scenario A.

**AC3:** Given the spec lists, When compared with those before this story, Then the Scenario A spec files (a1, a2, a3, a4, dsh-s4) and the Scenario B spec file (b1) are unchanged in both jobs, and both jobs are still gated by the same `context.yml` flags.

**AC4:** Given `staging-deploy.yml`, When it is read, Then `promote-to-prod` needs both `smoke-test` and `post-deploy-e2e-confirm`, no `if:` on it can bypass them, and the guards that read the file (`check-no-prod-deploy-on-push.js`, `check-bri-s2.6-smoke-test-promote-gate.js`) pass.

**AC5 (CI evidence, on this PR):** Given this PR's own CI run, When it finishes, Then both jobs pass against the PR's build, three reruns in a row are green, and each job takes under 8 minutes.

**AC6 (negative control, on this PR):** Given a deliberately broken route pushed to this PR temporarily, When CI runs, Then at least one of the two jobs fails (proving they test the PR's code); the break is then removed and the jobs go green again. The failing run's link is recorded in the evidence.

**AC7 (live, after merge):** Given the next real master deploy, When it finishes, Then the post-deploy confirmation runs against `wuce-staging` and `promote-to-prod` waits for it.

## Out of Scope

- Renaming the two required checks (it needs the operator to change the ruleset; offered as a later cleanup because the name "(staging)" will then be a misnomer).
- Making "Lint, typecheck, test, build" a required check, and any other ruleset change (the operator decides separately).
- Editing specs for any reason other than a staging-only value the throwaway environment lacks; fixing any spec the new environment shows to be genuinely broken (each is recorded and decided, not hidden).
- Stripe hosted-checkout coverage (skipped in CI today because of the captcha).

## NFRs

- **Security:** no secret is read by the PR jobs; the generated stub secret exists only for that run; the throwaway database is destroyed with the runner.
- **Reliability:** removes the dependence on shared staging load and on the deploy queue; no job writes to shared state.
- **Performance:** each job under 8 minutes on a standard runner.

## Complexity Rating

**Rating:** 3 - a new environment for two suites that have only ever run against real staging; the first CI runs may expose staging-only assumptions in the specs. **Scope stability:** Unstable until the first green run.
