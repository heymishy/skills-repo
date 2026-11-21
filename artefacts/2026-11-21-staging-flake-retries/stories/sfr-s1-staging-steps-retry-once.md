## Story: A single transient failure in the staging smoke or post-deploy confirmation steps no longer blocks the promotion to production

**Epic reference:** None - short-track (operator chose option B of the 2026-11-21 deploy-group findings)
**Discovery reference:** None - short-track skips discovery. Evidence, from `artefacts/2026-11-21-coverage-ratchet/spikes/deploy-group-and-staging-reliability-findings.md` and re-checked 2026-11-21: of the 5 `Staging Deploy` runs that ran to completion between 2026-11-19 and 2026-11-21, 4 failed, every one in a test assertion and none in the deploy itself: run 44800060471 (`bri-s3.3` AC1, `GET /admin/credits`, `expect(...).toBe`), run 44583265861 (`bri-s3.3` AC1, `apiRequestContext.get: aborted` after a `200 OK`), run 44583170710 (the smoke job, `expect(received).toBe(expected)`, not attributable to a test from the saved logs) and run 44468809588 (`a1-staging-auth-stub` AC1, "auth stub round-trip must complete in under 5s"). The smoke step runs `npx playwright test --grep "@mocked" --workers=1` and the two post-deploy confirmation steps run the Scenario A spec list and `b1-formed-idea-outer-loop-story-map.spec.js` with `--workers=1`; none has a retry, and `playwright.config.js` has no `retries` setting, so one transient failure fails the whole run and the "Promote to production" step stays blocked until someone re-runs it by hand. `tests/FLAKE-POLICY.md` allows in-run retries provided a test that passes on retry has a ledger entry; `tests/e2e/flake-ledger.json` has none. The operator approved this change ("Go") and the creation of one tracking issue, #1181.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, testing]

## User Story

As **the operator who approves production promotions**,
I want **the staging smoke and post-deploy confirmation steps to retry a failed test once and to name any test that only passed on retry**,
So that **a one-off network or timing blip does not stop a promotion, while the flaky tests stay visible and owned**.

## Benefit Linkage

**Metric moved:** staging deploy runs failed by a single transient test failure: 4 of 5 completed runs to none that a single retry would have cleared; flaky tests with an owner, a tracking issue and a review date: none to two.
**How:** `--retries=1` on exactly the three staging commands, a flaky-test report in each step's summary, two ledger entries, and the policy text updated to say where retries are on.

## Architecture Constraints

- Change confined to `.github/workflows/staging-deploy.yml` (the three commands and their report steps), `tests/FLAKE-POLICY.md`, `tests/e2e/flake-ledger.json`, one new node check, and artefacts. No change to `playwright.config.js` (retries stay off by default everywhere else), to `e2e.yml` or to any spec.
- Retries are on only for these three commands: the staging smoke command, the Scenario A post-deploy command and the Scenario B post-deploy command. The pull request jobs (Scenario A and B in `e2e.yml`, which are required checks) are unchanged.
- **Flaky tests are reported, not enforced:** each of the three steps writes a Playwright JSON report and is followed by an `if: always()` step that appends `node scripts/flake-check.js --report <file>` to the step summary. No `--strict` (a new flaky test that passed on retry must be visible, and must not re-block the promotion).
- Ledger entries use the name format `scripts/flake-check.js --report` prints, `<file> > <test title>`, and the fields the policy requires: `owner` heymishy, `issue` #1181, `firstSeen` 2026-11-21 (the date recorded), `reviewBy` 2026-12-05 (14 days).
- **Known consequence:** `tests/check-flk-s1-flake-policy.js` T6 validates the committed ledger against today's date, so from 2026-12-06 it fails (and with it the unit chain on every pull request) unless the two entries are fixed, removed or re-dated with a reason. That is the policy's own forcing function, recorded here so it is not a surprise.
- Workflow and policy changes go through a pull request. Preserve each file's existing line endings (`staging-deploy.yml` is CRLF).

## Dependencies

- **Upstream:** flk-s1 (the flake policy, ledger and `flake-check` tool), bri-s2.5 and bri-s2.6 (the staging pipeline and smoke gate, whose checks must keep passing), the deploy-group findings (option B).
- **Downstream:** the operator reviews the two ledger entries by 2026-12-05; the cause of each flake is a separate piece of work.

## Acceptance Criteria

**AC1:** Given the staging smoke step, When the workflow is read, Then its command is `npx playwright test --grep "@mocked" --workers=1 --retries=1 --reporter=list,json` with `PLAYWRIGHT_JSON_OUTPUT_NAME` set to a report file, and the step is still the one the promote gate depends on.
**AC2:** Given the two post-deploy confirmation steps, When the workflow is read, Then each command keeps its spec list and `--workers=1` (Scenario A also keeps its five specs) and gains `--retries=1 --reporter=list,json` with its own `PLAYWRIGHT_JSON_OUTPUT_NAME`.
**AC3:** Given every workflow and the Playwright config, When they are read, Then `--retries` appears only on those three commands, and `playwright.config.js` has no `retries` setting.
**AC4:** Given each of the three steps, When the workflow is read, Then it is followed by an `if: always()` step that runs `node scripts/flake-check.js --report` on that step's report file and appends the output to the step summary, with no `--strict` anywhere in the workflow.
**AC5:** Given `tests/e2e/flake-ledger.json`, When it is read, Then it has exactly two entries (`bri-s3.3-multi-user-tenant-journey.spec.js > AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied` and `a1-staging-auth-stub.spec.js > AC1: GitHub OAuth stub creates a real staging user and a valid session`), each with `owner`, `issue` naming #1181, `firstSeen` 2026-11-21, `reviewBy` 2026-12-05 and a `note` with the first failure's message and how often it was seen; `node scripts/flake-check.js --check` passes; and a Playwright-shaped report marking both tests `flaky` makes `flake-check --report --strict` list both as tracked and exit 0.
**AC6:** Given `tests/FLAKE-POLICY.md`, When it is read, Then it says retries are on for the three named staging steps and off everywhere else, still contains the rules `check-flk-s1` asserts, and `check-flk-s1` passes.
**AC7:** Given the existing guard checks (`check-bri-s2.5-ci-pipeline-staging-deploy`, `check-bri-s2.6-smoke-test-promote-gate`, `check-cif-s1-deploy-concurrency-guard`, `check-cif-s2-scenario-sequencing`, `check-cpco-s1-playwright-download-skip-and-cache`, `check-dsn-s1-deploy-config-safety-net`, `check-bkn-s1-bookkeeping-push-noise`, `check-flk-s1-flake-policy`), When they run, Then they pass unchanged, and CI is green on the final commit.

## Out of Scope

- The causes of the flakes (why `GET /admin/credits` is aborted on staging; replacing the fixed 5-second round-trip threshold). The ledger entries and #1181 carry them to the 2026-12-05 review.
- Retries on the pull request jobs (Scenario A and B in `e2e.yml`, required checks) and on any other job.
- `--strict` enforcement of unlisted flakes in CI (a later policy decision).
- The promotion itself: approving production runs stays the operator's.

## NFRs

- **Visibility:** a test that passes only on retry must appear in the run's step summary (flaky list), never be silent.
- **Bounded cost:** at most one extra attempt per failed test; the jobs' existing timeouts are unchanged.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
