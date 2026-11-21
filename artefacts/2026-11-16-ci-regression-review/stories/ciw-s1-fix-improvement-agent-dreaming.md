## Story: Make the scheduled Improvement Agent ("dreaming") workflow succeed without pushing to master

**Status:** READY (updated 2026-11-21). The two open questions are answered: the trigger question by `bkn-s1` (merged 2026-11-16, push trigger removed), the pull-request-checks question by the operator on 2026-11-21 (draft pull request, operator merges with admin override). The operator has asked for this to be fixed (not disabled).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`; run 43807520621 (and 150 others since 2026-11-12): the workflow runs the dreaming cycle, commits, then `git push` to `master`, which the repository ruleset rejects: "Changes must be made through a pull request" and "3 of 3 required status checks are expected". The commit also contains about 3000 files because the traces fetched into `workspace/traces/` end up staged. **Re-measured 2026-11-21:** every scheduled (Monday 03:00 UTC) run has failed: 2026-10-19, 10-26, 11-02, 11-09 and 11-16 (runs 39194521342, 40264029147, 41382104821, 42555418582, 43797158902), five of five; the next is 2026-11-23. The ruleset's only bypass actor is the repository Admin role (`bypass_actors`: RepositoryRole 5, always), so the Actions bot cannot push to master; the repository setting that lets Actions create pull requests is already on (`can_approve_pull_request_reviews: true`); the default workflow token is read-only, so the workflow's own `permissions:` block must grant what it needs. `src/improvement-agent/index.js` and `experiment-signals.js` (473 statements) are run only by this workflow and are executed by no test (0% in both coverage suites).
**Benefit-metric reference:** None - short-track
**Domain:** [ci, improvement-agent]

## User Story

As **the operator who relies on the improvement agent's proposals**,
I want **the dreaming run to deliver its output as a draft pull request I can review and merge**,
So that **the agent's work stops being thrown away every run and the scheduled run stops being red by default**.

## Benefit Linkage

**Metric moved:** scheduled runs that succeed: 0 of 5 recorded Mondays (and 0 of 151 runs in the earlier window) to green every week; proposals that reach the operator: none to a draft pull request each week there is something to review.
**How:** the final step stops pushing to master. A delivery script stages only the three intended paths, refuses anything else, pushes a bot branch and opens a draft pull request, or updates the open dreaming pull request's branch.

## Architecture Constraints

- **Output goes through a pull request.** The delivery logic lives in `scripts/improvement-agent-deliver.js` (testable with a temporary git repository and a stand-in `gh`), and the workflow's last step calls it. No push to master; no ruleset change; no secret.
- **Only the intended files are committed:** `workspace/proposals/`, `workspace/state.json` and `workspace/dream-run-result.json`. The traces fetched into `workspace/traces/` are unstaged before anything is added (a checkout from a ref stages what it writes), and the script fails closed when any staged path is outside those three, or when more than 25 files are staged.
- **Idempotent and quiet:** no changes means no branch and no pull request. At most one open dreaming pull request at a time: when one exists (head branch starting `improvement-agent/dream-`), the next run adds a commit to that branch with an ordinary fast-forward push, never a force-push.
- **Trigger:** `schedule` and `workflow_dispatch` only (already so since `bkn-s1`; `check-bkn-s1-bookkeeping-push-noise` guards it). A merged dreaming pull request must not trigger another run.
- **Permissions:** `contents: write` and `pull-requests: write`. Pull requests opened with the default token do not start the pull request workflows, so the required checks stay "expected" on this pull request and the operator merges it with the admin bypass; the delivery script's pull request body says so.
- Workflow and `scripts/` changes merge through a pull request (platform change policy); the operator merges.

## Acceptance Criteria

**AC1:** Given outputs to deliver, When the delivery script runs, Then it pushes a branch `improvement-agent/dream-<UTC date and time>` created from the checked-out base, containing exactly one commit that changes only files under `workspace/proposals/`, `workspace/state.json` and `workspace/dream-run-result.json`, and opens a draft pull request against `master` from it (stand-in `gh` receives `pr create --draft --base master --head <branch>`).
**AC2:** Given no staged or modified file among the three paths, When the script runs, Then it creates no branch and no pull request, prints "No changes to commit" and exits 0.
**AC3:** Given traces under `workspace/traces/` staged by the fetch step (and a few other stray staged paths), When the script runs, Then the traces are unstaged and never committed; and when a path outside the three is staged by anything else, or more than 25 files would be committed, the script exits non-zero with a message naming the problem and pushes nothing.
**AC4:** Given an open dreaming pull request (head branch starting `improvement-agent/dream-`), When the script runs with new outputs, Then it adds one commit to that branch with a fast-forward push (no force), updates the three paths' content, and opens no second pull request.
**AC5:** Given the workflow file, When it is read and linted by the repo's checks, Then its last step calls the delivery script, no step pushes to `master` (or to `HEAD:master`, `origin master`), permissions include `contents: write` and `pull-requests: write`, the triggers are still only `schedule` and `workflow_dispatch`, and `check-bkn-s1-bookkeeping-push-noise` still passes.
**AC6 (live):** Given a manual `workflow_dispatch` after merge, When it completes, Then it is green and a draft pull request appears (or "No changes to commit" is logged). Operator-approved run, recorded in the DoD. The next scheduled run is Monday 2026-11-23 03:00 UTC.

## Out of Scope

- The content or quality of the proposals the agent produces.
- Changing the ruleset, adding a bypass actor, creating a token or secret, or the checks running on the bot's pull request.
- Unit tests for the dimensions the agent runs (`failure-detector`, `calibration`, `compliance-report` already have them) beyond what the delivery script needs; coverage of `index.js` and `experiment-signals.js` is a follow-up.

## Complexity Rating

**Rating:** 2 (workflow permissions, a script that drives git and `gh`). **Scope stability:** Stable.
