## Definition of Ready: A week in which the improvement agent finds nothing to review opens no pull request

**Story reference:** artefacts/2026-11-21-dreaming-quiet-weeks/stories/dqw-s1-quiet-weeks-open-no-pull-request.md
**Test plan reference:** artefacts/2026-11-21-dreaming-quiet-weeks/test-plans/dqw-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `scripts/improvement-agent-deliver.js` (AC1 to AC6): after staging and the existing fail-closed checks, if no staged proposal file (added or modified under `workspace/proposals/`) exists, read `workspace/dream-run-result.json`; missing or malformed fails with a message naming the file; `humanAttentionRequired: true` continues to delivery; anything else (including `skipped: true`) logs "Nothing to review this week", unstages everything and returns a quiet status with no branch, commit or pull request. The check runs before the open-pull-request lookup, so an open dreaming pull request is not touched on a quiet week.
- `tests/check-dqw-s1-quiet-weeks.js` (Q1 to Q8).
- `decisions.md` and a DoD.
- Not built: no change to the workflow, to `src/improvement-agent/*`, to what the agent counts as a proposal, or to `lastDreamRun` persistence; no change to the ciw-s1 check.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test or a recorded manual step. `scripts/improvement-agent-deliver.js` is a required touchpoint and appears in no exclusion list; the files in the exclusion list (`.github/workflows/improvement-agent-schedule.yml`, `src/improvement-agent/*`, `tests/check-ciw-s1-improvement-agent-delivery.js`) have no assertion in the new check (the ciw-s1 check is run unchanged as AC7).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who reviews the agent's pull requests |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is the unchanged earlier checks |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | fail-closed behaviour stated in AC3 and AC6 |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter added; the existing test seams (paths, `gh` binary) are unchanged |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | On a quiet week `lastDreamRun` in `state.json` and the new `dream-run-result.json` are not recorded anywhere (the run's own log is the record). The 23-hour interval guard only matters between runs closer than a day; the schedule is weekly, and a manual re-run inside a day of a delivered run is skipped as before. |
| W2 | Accepted | Whether a quiet week should still be recorded somewhere (for example the 69 experiment signals) is a separate decision; the operator chose "pull request only when there are proposals" (decisions D1). |
| W3 | Accepted | Pull request #1179 and its branch exist from the live run; they are the operator's to read and close and are not touched here. |
| W4 | Accepted | Register-before-branch (the assurance gate looks the feature up in the branch's own `pipeline-state.json`), CI on the final commit, remote head verified after every push, master checked after the merge, exact paths staged, worktree removed with the junction first. |

## Oversight level
**Low** - one decision added to a tested script. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-dreaming-quiet-weeks/stories/dqw-s1-quiet-weeks-open-no-pull-request.md
Test plan: artefacts/2026-11-21-dreaming-quiet-weeks/test-plans/dqw-s1-test-plan.md
Goal: write the node check first and confirm Q1, Q2, Q3, Q4 and Q7 fail on master and Q5, Q6, Q8 pass; then add the quiet-week decision to scripts/improvement-agent-deliver.js; mutation-check the new branches; run the new check, check-ciw-s1, check-bkn-s1 and the full npm test with the regression script; open a draft pull request; wait for CI on the final commit.
Constraints: the script, the new check and artefacts only; never push to master, never force-push; preserve line endings; stage exact paths; verify the remote head after every push.
```
