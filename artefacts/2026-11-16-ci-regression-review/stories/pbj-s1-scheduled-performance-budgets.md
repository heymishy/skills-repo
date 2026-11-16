## Story: A scheduled performance-budget job, separate from the functional suite

**Status:** DRAFT for operator review.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`: the only performance checks are millisecond asserts inside functional tests (the `cat-s1` 50 ms walk flaked on several PRs until #1120); real performance problems found in production this week (unknown artefact lookup about 6 s, cold product page about 6 s, `/signals` slow under parallel load) are measured by nothing.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, web-ui]

## User Story

As **the operator**,
I want **a short list of key paths measured on a schedule against a stored baseline**,
So that **a slowdown is noticed within a day, without making pull requests flaky**.

## Benefit Linkage

**Metric moved:** None formal. Moves performance from "found by hand in production" to "reported by a scheduled job".

## Architecture Constraints

- **Not a PR gate.** Runs nightly and after each successful staging deploy, never blocks a merge.
- **What is measured (initial list, operator may edit):** cold and warm product page, unknown-artefact lookup (anf-s1's 1 s), `/signals`, `/dashboard`, a mock-model turn round trip, and the artefact trace walk (the `cat-s1` case).
- **Relative, not absolute:** each path is run several times (warm-up discarded), the best-of-N or median is compared with a stored baseline (a checked-in JSON updated by an explicit command) and a regression is reported when it exceeds the baseline by a stated ratio (for example 1.5 times) and an absolute floor (for example 100 ms), so noise on a shared runner does not alert.
- **Where it runs:** against staging (mock model) after deploy, and against the in-process app in CI nightly; production is never loaded by this job.
- **Reporting:** a run summary table and, on regression, a tracking issue (updated, not duplicated). No red PRs.
- **In-suite asserts:** after this exists, millisecond asserts in functional tests (starting with `cat-s1`) can be removed or loosened in a follow-up, one per story.
- Workflow changes merge through a pull request.

## Acceptance Criteria

**AC1:** Given the budget list, When the job runs, Then each path is measured with warm-up and best-of-N and a table of baseline, measured and ratio is written to the run summary.

**AC2:** Given a path slower than baseline by more than the ratio and floor, When the job runs, Then a tracking issue is opened or updated naming the path; otherwise nothing is opened.

**AC3:** Given a noisy runner (one slow sample in N), When the job runs, Then no regression is reported.

**AC4:** Given the baseline file, When updated by the explicit command, Then it records the new values and the change is reviewable in a PR.

**AC5:** Given a pull request, When CI runs, Then the performance job is not part of its gate.

## Out of Scope

- Load or soak testing; production measurement; the in-suite assert removals.

## Complexity Rating

**Rating:** 2. **Scope stability:** Unstable until the path list is confirmed.
