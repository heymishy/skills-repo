## Story: Bookkeeping pushes to master stop starting workflows that add nothing

**Epic reference:** None - short-track (a CI-quality story from the 2026-11-17 audit, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md` finding 6 and recommendation 3. About 74% of master commits (442 of the newest 600) touch only `artefacts/`, `workspace/` or `.github/pipeline-state.json`, and each one is pushed straight to master. In 40 hours, 148 master pushes started 148 runs of Improvement Agent dreaming (149 of 149 failed, it has never succeeded), 148 of Trace Commit and 148 of Vulnerability Check.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci]

## User Story

As **the operator**,
I want **a push of bookkeeping files to master to start no workflow run at all**,
So that **the Actions tab shows real signal, master commits stop carrying a red mark, and Actions minutes are not spent re-running checks on changes that cannot affect them**.

## Benefit Linkage

**Metric moved:** None formal. About 440 runs per 40 hours disappear, the red mark on bookkeeping commits goes away, and Trace Commit stops re-committing the latest pull request's gate trace again for every bookkeeping push.
**How:** path filters on the push triggers of Trace Commit and Vulnerability Check, the push trigger removed from the dreaming workflow, and a guard test so a new push workflow cannot reintroduce the noise.

## Architecture Constraints

- **Same exclusion list as the staging deploy.** `paths-ignore` for Trace Commit copies `staging-deploy.yml`'s: `workspace/**`, `artefacts/**` except `artefacts/*/playback/**`, and `.github/pipeline-state.json`. One list, one meaning of "bookkeeping".
- **Vulnerability Check follows the dependencies, not the pushes.** It runs on `package.json`, `package-lock.json`, its own workflow file and its script (on push to master and on pull requests), weekly on a schedule so new advisories are found without a dependency change, and on manual dispatch. A change that does not touch the dependency tree cannot add a vulnerability.
- **Dreaming loses only its push trigger.** The weekly schedule (Monday 03:00 UTC) and manual dispatch stay. Why it still fails when it runs (its push to master is refused by the repository ruleset) is the second half of `ciw-s1` and is not changed here.
- **No required check is affected.** The required checks are the assurance gate, Scenario A, Scenario B and a pull request; none is among the three workflows changed, and all run on pull requests, not on pushes.
- **Trace Commit still runs for every code merge**, because a merge touches code, tests, skills or workflows. A merge that touches only the excluded paths is not traced; that is accepted, since bookkeeping never had its own gate run.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-004 (single config source) not engaged; no application source changes. Zero new npm dependencies. Platform change policy: workflows change via a pull request, which this is.

## Dependencies

- **Upstream:** `ciw-s2` (merged: Pages and Fleet are manual only), `trr-s1`, `sep-s1`.
- **Downstream:** `ciw-s1` (dreaming fix) still needs the operator's two answers (the fine-grained token, the schedule).

## Acceptance Criteria

**AC1:** Given `trace-commit.yml`, When read, Then its push trigger on master has `paths-ignore` containing `workspace/**`, `artefacts/**` and `.github/pipeline-state.json`, and it still triggers on master pushes that touch other paths.

**AC2:** Given `vulnerability-check.yml`, When read, Then it has no unfiltered push trigger: its push and pull request triggers are limited to `package.json`, `package-lock.json`, the workflow file and `scripts/check-vulnerability-findings.js`, and it also has a weekly `schedule` and a `workflow_dispatch`.

**AC3:** Given `improvement-agent-schedule.yml`, When read, Then it has a `schedule` and a `workflow_dispatch` trigger and no `push` trigger.

**AC4:** Given every workflow file, When scanned, Then each workflow with a push trigger that includes master excludes the bookkeeping paths (by `paths` or `paths-ignore`), with an explicit allow-list that starts empty, so a new push workflow cannot reintroduce the noise.

**AC5:** Given the unit chain, When it runs, Then every other test that reads these workflows passes and every workflow file is valid YAML.

**AC6 (live, after merge):** Given this story's own merge, When its bookkeeping commit (the pipeline-state update after the merge) is pushed to master, Then it starts no workflow run, while the merge commit itself started Trace Commit and the Staging Deploy.

## Out of Scope

- Fixing why dreaming fails when it runs (`ciw-s1`: token, schedule decision).
- Removing the `Trace Commit`, `Vulnerability Check` or dreaming workflows, or changing what they do.
- The `CI Chain Status Notify` and `Deploy Group Auto-Rerun` workflows (they follow other workflows' runs and shrink on their own).
- Required-check and ruleset changes (the operator's).

## NFRs

- **Reliability:** no change to what runs on a pull request or for a code merge.
- **Security:** the vulnerability scan still runs on every dependency change and weekly, so coverage of new advisories does not drop.

## Complexity Rating

**Rating:** 1 - three small workflow edits and one guard. **Scope stability:** Stable.
