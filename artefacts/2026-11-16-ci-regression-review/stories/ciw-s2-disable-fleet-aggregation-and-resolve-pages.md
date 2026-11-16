## Story: Deprecate the Fleet Aggregation and GitHub Pages workflows so they stop running

**Status:** Ready for build (DoR signed off 2026-11-16). Operator decisions 2026-11-16: disable Fleet Aggregation; disable the Pages deploy and treat Pages publishing as "fully deprecated".
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md`. Fleet Aggregation (82 scheduled hourly runs, all red): checkout fails with "could not read Username for https://github.com" because the `FLEET_PUSH_TOKEN` secret is missing or empty. Deploy dashboards to GitHub Pages (109 runs on push to master, all red): "Create Pages site failed: Resource not accessible by integration" because GitHub Pages is not enabled for the repository. Pages would also have published the full `pipeline-state.json` publicly if it had ever worked.
**Benefit-metric reference:** None - short-track
**Domain:** [ci]

## User Story

As **the operator reading the Actions tab**,
I want **workflows that cannot succeed and are no longer wanted to stop running and say so**,
So that **a red run means something went wrong today**.

## Benefit Linkage

**Metric moved:** None formal. Removes 191 of the 342 always-red runs in the audit window (82 Fleet, 109 Pages) and about an hour of runner time; removes the risk of the pipeline state being published by someone later enabling Pages.

## Architecture Constraints

- **Deprecate, do not delete (this story).** Both workflow files keep only a `workflow_dispatch` trigger (so a manual run is still possible), lose their `push` and `schedule` triggers, and open with a `DEPRECATED` comment block naming the reason, the date, the operator decision and how to bring them back. The scripts, `fleet/squads/` data, and the `dashboards/` folder are not touched, because other tests and tooling reference them (`check-dviz2-pages-workflow`, `check-dashboard-viz`, `check-cv1-canvas-views`, `check-dr1-dashboard-review`, `check-dviz1-adapter`, `check-me1-dashboard-editor`, `check-p4-obs-archive`, `check-fleet-aggregation`). Removing the dashboards folder altogether is a separate, larger decision (open question 1).
- **Pages specifics:** the deprecated `pages.yml` keeps `workflow_dispatch` only; with Pages not enabled a manual run would still fail, which is acceptable for a deprecated workflow and is stated in its header. Nothing in this story enables Pages or changes any repository setting.
- **Dashboards README:** `dashboards/README.md` gets a top banner: Pages publishing is retired (2026-11-16, operator decision), the dashboards remain runnable locally with any static server, and nothing is published.
- **Existing tests:** `tests/check-dviz2-pages-workflow.js` T3 and T4 asserted the push trigger paths; they are changed to assert the retired state (no `push` trigger, `workflow_dispatch` present, header says DEPRECATED); its other tests (file exists, no tabs, permissions, upload and deploy steps, no secrets) stay. `tests/check-fleet-aggregation.js` tests the aggregation logic only and is unchanged. Each edit is listed in the evidence.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy applies (workflow files merge via pull request, the operator merges); no other Active ADR engaged. Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given `.github/workflows/fleet-aggregation.yml`, When parsed, Then its `on:` block contains `workflow_dispatch` and no `push` or `schedule`, and it opens with a `DEPRECATED` comment block (reason, date, operator decision, how to re-enable).

**AC2:** Given `.github/workflows/pages.yml`, When parsed, Then its `on:` block contains `workflow_dispatch` and no `push`, and it opens with the same kind of `DEPRECATED` block, which also says Pages is not enabled and what enabling it would publish.

**AC3:** Given `dashboards/README.md`, When read, Then its first lines are a DEPRECATED banner saying Pages publishing is retired and the dashboards remain runnable locally.

**AC4:** Given the two workflow files, When checked, Then neither contains tab indentation, both keep their jobs unchanged, and neither adds a new secret reference.

**AC5:** Given the existing tests that reference these files, When run, Then they pass, with only the `check-dviz2-pages-workflow` T3 and T4 assertions changed and listed.

**AC6 (live):** Given a master push and the next hour after merge, When the Actions list is read, Then neither "Fleet Aggregation" nor "Deploy dashboards to GitHub Pages" has a new run. Operator-observed.

## Out of Scope

- Deleting the `dashboards/` folder, `fleet/` data, the fleet scripts or any workflow file; enabling Pages; fixing the fleet token.
- The Improvement Agent workflow (`ciw-s1`).

## Open questions

1. Delete the `dashboards/` folder and its 8 test files later? "Fully deprecated" could mean removal. It is reversible through git history but touches the dashboard logic tests and the viz governance checks, so it needs its own story and your explicit go-ahead. Not done here.

## NFRs

Safety: nothing is deleted and no repository setting changes. Reliability: manual dispatch is preserved.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
