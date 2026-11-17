## Story: A small required core of browser tests, chosen by capability and measured coverage

**Epic reference:** None - short-track (second of two CI-quality stories from the 2026-11-17 audit, recommendation 1, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-local-playwright-suite-trust/evidence/ci-runs-1-and-2.md` (291 tests in 89 spec files; the same 58 tests fail in both runs; coverage baseline 63.3% lines and 40.9% functions of `src/web-ui`), `.../decisions.md`, and the triage in `artefacts/2026-11-17-testing-cicd-audit/spikes/playwright-local-suite-triage.md`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [test]

## User Story

As **the operator**,
I want **a short list of browser specs, chosen so that every product capability and as much server code as possible is exercised, that blocks a merge when it fails, and a written reason for every spec that is not on it**,
So that **a green pull request means the product's main paths still work in a browser, a red one means something real broke, and no capability or coverage quietly disappears when I stop waiting on a 15-minute, 58-failure suite**.

## Benefit Linkage

**Metric moved:** None formal. Today the only browser checks that block a merge are Scenario A and B (six specs); the other 83 files run non-blocking, 58 of their tests fail, and nobody can say which capabilities have a trustworthy test.
**How:** measure each spec's server coverage on its own (one CI run), record a capability matrix that gives every spec file a lane (core, extended, scenario, quarantined) with a reason, pick the core by a stated rule (every capability with a passing spec is represented; then the specs that add the most uncovered server code until the gain is negligible), run it as a new blocking job that the operator can add to the ruleset, and quarantine the rest visibly with an owner and a review date.

## Architecture Constraints

- **The new job blocks, but is not yet required.** `Core browser tests` has no `continue-on-error`. Adding it to the ruleset is the operator's change and happens after it has been green on real pull requests; this story only creates the job.
- **The non-blocking all-specs job stays.** `Playwright E2E smoke tests` keeps running everything (including quarantined specs) so their results and the coverage baseline stay visible; its single `continue-on-error` is unchanged (`tests/check-a5-ci-gate-config.js` and the b2 check require exactly one).
- **Scenario A and B stay as they are.** The six staging-targeted specs keep lane `scenario` and keep running only in their own jobs. Journeys are not folded into them (see Out of Scope).
- **No production behaviour change.** Fixes are in specs, fixtures and the fake test database only. No new npm dependency; `c8` runs through `npx` at the pinned version, in CI only.
- **The matrix is data, read by tests.** One JSON file, `tests/e2e/capability-matrix.json`, is the single source; a guard test and the core job both read it. No YAML parser is added.
- **Measurement is a tool, not a gate.** The per-spec coverage workflow runs only when its own files change on a pull request or when started by hand; it never runs on a push to master and never blocks.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy followed (workflows change by pull request).

## Dependencies

- **Upstream:** `lpw-s1` (merged; the baseline and the fixed shared causes), `sep-s1`, `bkn-s1`.
- **Downstream:** the operator's ruleset change to require `Core browser tests`; a later story for any quarantined capability worth fixing.

## Acceptance Criteria

**AC1:** Given a script `scripts/measure-playwright-spec-coverage.js` and the workflow `.github/workflows/playwright-spec-coverage.yml`, When the workflow runs, Then each spec file runs alone on a fresh test server with its own V8 coverage directory, and the run writes one JSON file and one Markdown table with, per spec: tests passed, failed and skipped; statements covered in `src/web-ui`; statements only that spec covers; and the greedy order by new statements added. The workflow runs only on a pull request that changes the workflow or the script, and on manual start; never on a push to master.

**AC2:** Given the measurement run, When it finishes on this story's pull request, Then its result is recorded in `evidence/per-spec-coverage.md`: the totals, the time taken, the files in `src/web-ui` that no spec touches, and the specs whose results differ from the two `lpw-s1` runs.

**AC3:** Given `tests/e2e/capability-matrix.json`, When it is read, Then every spec file under `tests/e2e/` (95 today, including `.spec.ts` and `tests/e2e/local/`) appears exactly once with a capability name and a lane (`core`, `extended`, `scenario` or `quarantined`); the six staging-targeted specs are lane `scenario`; every `quarantined` entry has a reason, an owner and a review date no more than 45 days after the entry date; and a guard test `tests/check-lpw-s2-capability-matrix.js` fails on a spec file missing from the matrix, an entry for a file that does not exist, a duplicate, a lane or field that is invalid, a quarantined entry without reason, owner or date, and a quarantined entry whose review date is in the past.

**AC4:** Given the measurement, When the core is chosen, Then the rule is applied by `scripts/select-core-specs.js` and is: first one passing spec for every capability that has a passing spec (the one adding the most statements); then more passing specs, greedily by new statements added, until the next one would add less than 0.1 percentage point of `src/web-ui` statements; specs that failed in the measurement or in either `lpw-s1` run are never chosen. The chosen list, the order and the cumulative coverage are recorded.

**AC5:** Given the chosen core, When its coverage is compared, Then `evidence/core-coverage.md` states, as statements and lines in `src/web-ui`: the `lpw-s1` baseline (all specs, whole suite), the union of every passing spec, and the core; names every capability that has no passing spec (a gap, with the quarantined specs that would cover it); and lists the statements covered only by specs not in the core, grouped by spec, so that what a quarantined or extended spec protects is explicit. The core's coverage must be at least 95% of the passing-spec union.

**AC6:** Given a new job `Core browser tests` in `.github/workflows/e2e.yml`, When a pull request runs, Then it installs Chromium, runs exactly the files `scripts/list-core-specs.js` prints (lane `core` in the matrix) against the test server with `NODE_ENV=test`, has a 15-minute limit, has no `continue-on-error`, never sets `E2E_STAGING_BASE_URL`, and uploads the Playwright report; the existing `Playwright E2E smoke tests` job is unchanged except that it still runs everything.

**AC7:** Given the 58 deterministic failures (29 spec files), When this story ends, Then each failing spec file is either fixed (a shared environment cause found in the kanban board, model-session or pod groups, fixed in specs, fixtures or the fake database only, and confirmed in CI) or listed lane `quarantined` with a reason, an owner and a review date; no spec file is deleted and no assertion is weakened to make a test pass. Specs that look superseded are named as retire candidates in `decisions.md` for the operator to decide.

**AC8 (live, on the pull request):** Given the pull request, When its CI runs twice on the same commit, Then `Core browser tests` passes both times, the two run times are recorded with the per-test results, and a test whose result differs between the runs is moved to lane `extended` and the selection repeated (so the required core is never flaky).

## Out of Scope

- Making `Core browser tests` a required check, or any ruleset change (the operator's, after it has run green on real pull requests).
- Folding journey specs into Scenario A or B. Those two run against a stub-authenticated staging-style setup the local specs do not use; the capability matrix names which Scenario or core spec protects each journey, and a journey with neither is a recorded gap.
- The earlier idea of a route-level list from a request log: per-file coverage from AC2 answers the same question ("which server code does no browser spec touch") without any change to the server.
- Retiring or deleting specs; fixing quarantined specs beyond the shared environment causes named in AC7.
- Any change to production behaviour or the real-Postgres code paths.

## NFRs

- **Reliability:** the core must pass twice in a row on one commit before it is offered as a required check (AC8).
- **Runtime:** the core finishes inside its 15-minute limit; the measurement run inside 60 minutes.
- **Security:** no pull request run reaches shared staging; no secret is read or stored by either workflow.
- **Auditability:** every spec file not in the core has a written lane and reason; nothing silently disappears.

## Complexity Rating

**Rating:** 2 - the selection and the guard are well understood; ambiguity remains in whether the kanban, pod and model-session failures share one cause each, and in how long the per-spec run takes.
**Scope stability:** Unstable - the measurement may show some capabilities have no passing spec, which changes what the core can cover.
