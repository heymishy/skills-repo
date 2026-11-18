## Story: A flake is a tracked, owned, time-limited entry in one ledger, and a rerun that passes is not a result until it is recorded

**Epic reference:** None - short-track (test process, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the repository has no tracked list of flaky tests; the operator's recorded practice is to rerun a flaky job and not investigate it (`workspace/learnings.md`, and the operator's own notes on the bri-s3.3 gateway flake and the cat-s1 timing flake); Playwright's retry setting is zero (`playwright.config.js`), so a flake appears as a failed run, not a flaky one.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [tests] [process]

## User Story

As **the operator who merges on a green core suite**,
I want **every test known to be flaky to appear in one tracked ledger with an owner, an issue and a review date, and a rerun that passes to be recorded there before it counts**,
So that **a flake cannot be quietly rerun into a pass for months, and the list of flakes is something I can read, not something I remember**.

## Benefit Linkage

**Metric moved:** None formal. A flake that is rerun and forgotten gives a green check that means less than it says. The repository has none of the flakes its own history records written down in one place, so nobody can tell which green checks were reruns.
**How:** `tests/e2e/flake-ledger.json` is the one list. An entry needs an owner, an issue and a review date no more than 14 days after it was first seen. `scripts/flake-check.js --check` fails on an incomplete entry or an overdue one, and `--report <playwright-json>` lists the tests a run marked flaky that have no entry. The rule is written in `tests/FLAKE-POLICY.md`.

## Architecture Constraints

- Plain Node, no new dependency. Reads Playwright's JSON report format already used by `scripts/verify.js`.
- The ledger is the only list of flakes. Quarantine stays in `tests/e2e/capability-matrix.json` (lpw-s2, lpw-s3); a quarantined spec does not also need a ledger entry, and the policy says so.
- Advisory where it cannot be enforced: nothing in CI reruns a job on the operator's behalf, so the rerun rule is a written rule plus the ledger check. The story says this plainly and does not claim enforcement it does not have.
- The ledger starts empty. No entry is added without evidence that the flake happened; this story does not reconstruct history.

## Dependencies

- **Upstream:** lpw-s2 and lpw-s3 (quarantine lanes and reasons), vfy-s1 (the report it writes), dfp-s1 (the last step of step 4 before this one).
- **Downstream:** none in this story. A CI step that reads the uploaded report is a follow-up decision.

## Acceptance Criteria

**AC1:** Given `tests/FLAKE-POLICY.md`, When it is read, Then it states what counts as a flake, what a rerun must have on record first, the 14-day review limit, the rule that quarantined specs use the capability matrix, and that the ledger is the only list.
**AC2:** Given a ledger entry, When `--check` runs, Then an entry missing `test`, `owner`, `issue` or `reviewBy`, or with a `reviewBy` more than 14 days after `firstSeen`, is reported by name.
**AC3:** Given an entry whose `reviewBy` is before the check date, When `--check` runs, Then it is reported as overdue, and `--check` exits 1.
**AC4:** Given a Playwright JSON report with tests marked flaky, When `--report` runs, Then each flaky test is listed as `file > title`.
**AC5:** Given `--report --strict` and a flaky test with no ledger entry, When it runs, Then the untracked flake is named and the exit code is 1; a flaky test with a valid entry exits 0.
**AC6:** Given the committed ledger and policy, When `--check` runs on master, Then it exits 0 (the ledger is empty).

## Out of Scope

- Adding retries to `playwright.config.js` (a change to how tests run, decided separately).
- Reconstructing past flakes; reading CI history to fill the ledger.
- A CI step that enforces the rule on pull requests (the operator decides, after seeing the check locally and in CI).
- Quarantine decisions (already in the capability matrix).

## NFRs

- **Reliability:** deterministic output; the check date is injectable so the overdue rule is tested without waiting.
- **Maintainability:** the policy fits on one page.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
