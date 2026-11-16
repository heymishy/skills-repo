## Story: Stop opening an incident PR per production error issue; record the incident in the fix PR instead

**Status:** Ready for build (DoR signed off 2026-11-16). Supersedes `inc-s1` (lighter CI gates for incident PRs), which is no longer needed. Operator decision 2026-11-16: "Yes for inc-s2 work and close 5 open incident PRs"; the five open incident PRs (#1102, #1111, #1112, #1113, #1122) were closed the same day.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` and the operator's question "Do we need incident PRs as well as GitHub issues? I don't seem to ever see them". Facts: each bridge-opened issue also opened a bot PR that adds one record to `workspace/incidents.json`; 10 such PRs were ever opened (3 merged, 2 closed, 5 left open and unreviewed); they were 23% of PR gating runs (42 of 180) with a 38% failure rate; the incident log on master has 2 records, neither from the error chain; the record "exists only on this pull request until it is merged", so unmerged PRs mean the record never exists.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, incident-handling]

## User Story

As **the operator**,
I want **the GitHub issue to be the thing I triage, and the structured incident record to be created when someone acts on the issue**,
So that **no bot PRs pile up unseen, CI is not spent on markdown records nobody merges, and every record that exists belongs to an incident someone worked on**.

## Benefit Linkage

**Metric moved:** None formal. Removes about 23% of PR gating runs and a stream of unreviewed red PRs; makes the incident log reflect real work. The record still reaches `workspace/incidents.json`, through the fix PR the repo already reviews (consistent with CLAUDE.md: bookkeeping is bundled with the implementation it records).
**How:** (1) `.github/workflows/error-issue-incident-record.yml` stops reacting to `issues: opened` and keeps only its manual `workflow_dispatch` start (issue number, dry run, rebuild) for the rare case a PR is wanted. (2) A small script, `scripts/record-incident-from-issue.js`, runs the same recogniser and the same real recorder locally for one issue number and writes the record into the working copy's `workspace/incidents.json`, so the author commits it in the fix PR.

## Architecture Constraints

- **Reuse, do not duplicate:** the wrapper calls the existing CLI `scripts/error-issue-incident.js` (`plan` then `build`) as child processes, so every existing validation applies unchanged: bridge-author check, label check, PostHog id marker, code length and control-character checks, idempotency by `posthog:<id>` tag, the real `incident-recorder`.
- **Same trust rules:** untrusted issue text reaches only the existing recogniser; the bridge author comes from `--author` or the `ERROR_BRIDGE_AUTHOR` environment variable and is never defaulted to the issue's own author; with no author configured the script refuses with a clear message. The issue is fetched with a plain read (`gh api repos/{owner}/{repo}/issues/<n>`) or taken from `--event <file>` (used by tests and offline runs).
- **Local only:** the script writes only the incident file it was given (default `workspace/incidents.json`); it creates no branch, runs no `git` command, opens no PR and calls no write API.
- **Workflow change is trigger-only:** the `issues` trigger and nothing else is removed; jobs, permissions, the concurrency group, the safety pins and the `workflow_dispatch` inputs stay, so `tests/check-coha-s7-error-issue-incident.js` keeps all its tests except W1 (the trigger list), which is edited to assert the retired state.
- **`inc-s1` is superseded** (its blocker note says so); no other story depends on it.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-009 deviation recorded for this workflow in coha-s7's decisions remains accepted and is narrowed, not widened; platform change policy applies (workflow and `scripts/` changes merge via pull request, the operator merges). Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given `.github/workflows/error-issue-incident-record.yml`, When parsed, Then its `on:` block contains only `workflow_dispatch` (with the existing three inputs), and no `issues` trigger.

**AC2:** Given the same file, When read, Then its header comment says the automatic trigger was retired on 2026-11-16 (story inc-s2, operator decision), why, how to start it by hand, and how to record an incident locally instead.

**AC3:** Given a recognised bridge issue (fixture) and an empty incident file, When `node scripts/record-incident-from-issue.js --event <file> --author <bridge login> --incidents <file>` runs, Then the incident file gains exactly one record tagged `production-error` and `posthog:<id>`, the process exits 0, and it prints which file to include in the fix PR.

**AC4:** Given the same issue run a second time, When it runs, Then nothing is added, it says the incident is already recorded, and it exits 0.

**AC5:** Given an issue that is not recognised (wrong author, no `production-error` label, no PostHog id marker, a bad code), or no author configured, When it runs, Then the incident file is unchanged, the reason is printed, and it exits 1.

**AC6:** Given the script's source and a run in a temporary directory, When inspected and executed, Then it contains no `git` or `gh pr` command, calls `gh` only for the read `api repos/{owner}/{repo}/issues/<n>`, and changes no file other than the incident file.

**AC7:** Given the existing `tests/check-coha-s7-error-issue-incident.js`, When run, Then all its tests pass, with only W1 changed and listed.

**AC8 (live, the next natural production error):** Given the next production error that opens a `production-error` issue, When the bridge creates it, Then no incident PR appears. Evidence class `production-observed`; operator-observed, no deliberate error is created for it.

## Out of Scope

- Changing the bridge (issue creation), the incident recorder, or the record contents.
- Deleting the workflow, its script or tests; retiring the manual start.
- Creating records for past issues (the five closed PRs' issues #1101, #1108 to #1110 and #1121 can be recorded with the new script if wanted).
- `inc-s1` (superseded).

## NFRs

- **Security:** the same trust rules as the workflow (fixed author, label, marker, id and code validation; untrusted text never reaches a shell); no secret is read or written.
- **Reliability:** the script never leaves a half-written incident file (the existing recorder and a fail-before-write check).
- **Performance:** one API read and two local steps.

## Complexity Rating

**Rating:** 2 - a trigger removal plus a small wrapper over an existing, heavily tested CLI. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
