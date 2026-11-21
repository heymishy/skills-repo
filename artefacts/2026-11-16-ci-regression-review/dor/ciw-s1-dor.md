## Definition of Ready: Make the scheduled Improvement Agent ("dreaming") workflow succeed without pushing to master

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/ciw-s1-fix-improvement-agent-dreaming.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/ciw-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `scripts/improvement-agent-deliver.js` (new, AC1 to AC4): stages only `workspace/proposals/`, `workspace/state.json` and `workspace/dream-run-result.json`, unstages `workspace/traces/`, refuses any other staged path or more than 25 files, finds an open dreaming pull request through `gh pr list`, otherwise branches, commits, pushes (never to master, never forced) and opens a draft pull request with `gh pr create`. Paths and the `gh` binary are injectable so tests can use a temporary repository and a stand-in.
- `.github/workflows/improvement-agent-schedule.yml` (AC5): the last step calls the script with `GH_TOKEN`; `permissions` gain `pull-requests: write`; the fetch of traces and the earlier steps are unchanged; triggers stay `schedule` and `workflow_dispatch`.
- `tests/check-ciw-s1-improvement-agent-delivery.js` (T1 to T8).
- `decisions.md` (D1 for this story) and a DoD.
- Not built: no ruleset change, no secret, no token, no change to the agent's dimensions or proposals, no tests for `index.js` or `experiment-signals.js` (follow-up), no change to which checks run on the bot's pull request.

## Contract Review
Contract review passed. All six acceptance criteria map to a named test or a recorded manual step. `improvement-agent-schedule.yml` and the new script are required touchpoints (AC1 to AC5) and appear in no exclusion list; `tests/check-bkn-s1-bookkeeping-push-noise.js` already asserts this workflow's triggers and is run unchanged (M1). No assertion targets a file in the exclusion list (`src/improvement-agent/*`, the ruleset).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow and `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who relies on the proposals |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | AC6 is the operator-approved live run |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | fail-closed staging guard stated in AC3 |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | the script's `gh` binary and paths are injectable only for tests; production uses the real `gh` and the real repository by default, which the live run (M3) exercises |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The real `gh pr create` with the default token is only proven by the live run (M3). If it fails (for example the repository setting for Actions-created pull requests is off in practice), the run is red with a clear message and the operator decides; nothing is pushed to master in any case. |
| W2 | Accepted | The draft pull request will not start the pull request checks (default-token events do not start workflows), so its required checks show "expected"; the operator merges it with the admin bypass, as decided on 2026-11-21 (decisions D1). |
| W3 | Accepted | `workspace/state.json` is also edited by the operator's own bookkeeping pushes; a stale dreaming branch may conflict. The script only adds a commit on the existing branch (no force, no rebase), so a conflict is visible on the pull request and the operator closes it; the next run opens a fresh one. |
| W4 | Accepted | The next scheduled run is Monday 2026-11-23 03:00 UTC. If this does not merge before then, that run fails the same way it has five times; recorded in the story. |
| W5 | Accepted | Local git is 2.21: the script and tests use only `reset`, `checkout`, `add`, `commit`, `push`, `fetch` and `diff`, not `restore` or `switch`. |
| W6 | Accepted | The feature is already registered on master (ciw-s1 under `2026-11-16-ci-regression-review`), so the assurance gate finds it on the branch. The agent confirms CI ran on the final commit before asking for the merge, checks master after it, verifies the remote head after every push, and stages exact paths only. |

## Oversight level
**Medium** - a scheduled workflow that writes to the repository. The operator reviews the pull request, merges it, and approves the live run.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/ciw-s1-fix-improvement-agent-dreaming.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/ciw-s1-test-plan.md
Goal: write the node check first and confirm T1 to T8 fail on master; then add scripts/improvement-agent-deliver.js and change the workflow's last step to call it with the permissions it needs; run the new check, check-bkn-s1, the full npm test with the regression script; open a draft pull request; wait for CI on the final commit; after the merge, ask the operator before starting the live manual run (M3).
Constraints: the script, the workflow, the new check and artefacts only; never push to master, never force-push; preserve line endings; stage exact paths; verify the remote head after every push.
```
