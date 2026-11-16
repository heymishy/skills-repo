## Story: Stop the incident-record pull request: the GitHub issue is the record, and the fix is a short-track story and PR

**Status:** Ready for build (DoR re-signed 2026-11-16). **Rescoped the same day** after the operator's correction: no incident PR, no manual workflow either, no local recording script. Supersedes `inc-s1` (lighter CI gates for incident PRs). The five open incident PRs (#1102, #1111, #1112, #1113, #1122) were closed on 2026-11-16 with an explanatory comment.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` and the operator's words: "I still want errors to generate a real GitHub issue, I just don't want a PR also generated with redundant or unhelpful info which I'm not actioning. It should all be in the issue and then resolved as a short track and a PR". Facts: each bridge-opened issue also opened a bot PR adding one record to `workspace/incidents.json`; 10 were ever opened (3 merged, 2 closed, 5 left open and unreviewed); they were 23% of PR gating runs (42 of 180) with a 38% failure rate; the PR body carried nothing the issue lacks (code, route label, time, PostHog link).
**Benefit-metric reference:** None - short-track
**Domain:** [ci, incident-handling]

## User Story

As **the operator**,
I want **a production error to produce one GitHub issue holding everything needed, and nothing else**,
So that **I triage one thing, and when I act on it I resolve it as a short-track story and a normal fix PR that refers to the issue**.

## Benefit Linkage

**Metric moved:** None formal. Removes about 23% of PR gating runs, a stream of unreviewed red bot PRs, and a workflow and tests that kept a mechanism nobody used.
**How:** delete the workflow `.github/workflows/error-issue-incident-record.yml` (the only thing that opened the PRs), delete the tests that exist only to guard that workflow, and leave everything else exactly as it is: the error bridge still opens the issue, and the recogniser script and library (still used by the issue-title length check in `eit-s1`) stay.

## How an error issue is resolved (process, recorded in decisions.md)

1. The bridge opens the issue with the code, route label, first-seen time, environment and PostHog link. That is the record.
2. When the operator or an agent acts on it, the work is a short-track story (test plan, definition of ready, fix, draft PR). The story names the issue number; the fix PR says `Fixes #<issue>` so merging closes it. No separate incident record is created.

## Architecture Constraints

- **The bridge is untouched.** `src/web-ui/routes/error-bridge.js`, its tests (`check-coha-s6-error-bridge`, 83 passed and 7 skipped without a database), the PostHog destination and the issue format do not change.
- **Delete only what the removed workflow owned.** The workflow file; and in `tests/check-coha-s7-error-issue-incident.js` the section that reads the workflow (`cwt_UT1`, `cwt_UT2`, `W1` to `W13`, with `W12`'s credential scan kept for the script, library and test file) plus its now-unused helpers and the `WORKFLOW` constant. Every other test in that file (recogniser, planner, CLI, product-page rendering, conflict behaviour) is unchanged.
- **Left in place on purpose:** `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js` and the remaining coha-s7 tests. `tests/check-eit-s1-issue-title.js` uses the library's `codeProblem` for the 120-character title limit, and `scripts/run-all-tests.js` lists the coha-s7 test. Removing them is a separate cleanup that needs the operator's go-ahead.
- **`workspace/incidents.json` and the incident-handling skills** (deferrals, handoff, confirm-fix) are untouched; they work from their own sources.
- **Required checks:** removing a workflow whose triggers were `issues` and `workflow_dispatch` cannot leave a required status check unreported (it never ran on pull requests).
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; the ADR-009 deviation accepted for this workflow in coha-s7 becomes moot (recorded); platform change policy applies (workflow and test changes merge via pull request, the operator merges). Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given the repository, When `.github/workflows/` is read, Then `error-issue-incident-record.yml` does not exist and no workflow has an `issues` trigger.

**AC2:** Given `tests/check-coha-s7-error-issue-incident.js`, When run, Then it no longer reads or names the workflow, its recogniser, planner, CLI and product-page tests pass unchanged, and its credential scan still covers the script, library and test file.

**AC3:** Given the error bridge, When its tests run, Then they pass unchanged (a production error still opens a GitHub issue), and the bridge code is not modified by this story.

**AC4:** Given the repository outside `artefacts/`, `workspace/` and `.worktrees/`, When searched for `error-issue-incident-record`, Then no file refers to the removed workflow.

**AC5:** Given the recogniser library and `tests/check-eit-s1-issue-title.js`, When run, Then both still work (the library stays; the title-length check still passes).

**AC6 (live, the next natural production error):** Given the next production error that opens a `production-error` issue, When the bridge creates it, Then no incident PR appears. Evidence class `production-observed`; operator-observed, no deliberate error is created for it.

## Out of Scope

- Any change to the bridge, the issue content or the PostHog destination.
- Deleting the recogniser script, library or the remaining coha-s7 tests (follow-up needing approval).
- Back-filling records for past issues.
- Changing CLAUDE.md or any skill to describe the short-track flow (it already is the repo's process).

## NFRs

- **Safety:** the only deletions are one workflow file and the tests that guard it; both are in git history.
- **Reliability:** no other workflow or required check is affected.

## Complexity Rating

**Rating:** 1 - one file removed and the tests that guard it edited out. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
