## Definition of Ready: A production promotion is not refused because of bookkeeping commits that landed after the deployed commit

**Story reference:** artefacts/2026-11-21-promotion-guard-bookkeeping/stories/pgb-s1-promotion-guard-bookkeeping-commits.md
**Test plan reference:** artefacts/2026-11-21-promotion-guard-bookkeeping/test-plans/pgb-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `scripts/promotion-guard.js` (AC1 to AC4, AC6): when the run commit differs from the head, call a new injectable `fetchCompare` (default throws, wired in `main()` to `GET /repos/<repo>/compare/<run>...<head>` with the existing `githubRequest`), and accept only if the status is `ahead`, the commit and file lists are complete and every changed path (and every `previous_filename`) is a bookkeeping path.
- `scripts/lib/bookkeeping-paths.js` (new, AC5): `isBookkeepingPath`, mirroring the workflow's `paths-ignore`.
- `tests/check-pgb-s1-promotion-bookkeeping.js` (P1 to P11), `decisions.md`, and the feature registered in `.github/pipeline-state.json` on this branch (bundled, so nothing is pushed to master for this story).
- Not built: no change to `.github/workflows/staging-deploy.yml`, `cancel-superseded-promotions.js`, or what the promote job builds; no approval or promotion of anything.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test or the CI read. `scripts/promotion-guard.js` is a required touchpoint (AC1 to AC4, AC6) and appears in no exclusion list; `staging-deploy.yml` is excluded and P9 only reads it. The existing `check-spg-s1-stale-promotion-guard` is run unchanged (AC6).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who approves promotions |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is the CI read |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | safety and visibility stated |
| H-ADAPTER | Injectable adapter (D37) | Pass | `fetchCompare` default throws (P10); wired in `main()`; the wiring is asserted by behaviour: P1 runs the real script against a fake GitHub API and checks the compare request it makes and the exit code, not that a function was assigned |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | **This weakens a production safety guard in one precise way** (a promotion may now be behind the head by bookkeeping-only commits). It is compensated by failing closed on every doubt, by the drift test against the workflow's own ignore list and by eleven mutation checks; it is the operator's decision (2026-11-21, "Fix the guard, and I hold bookkeeping meanwhile"). |
| W2 | Accepted | The promote job deploys its own run's older commit; it is identical to the head in every non-bookkeeping path by construction of the check. |
| W3 | Accepted | The real compare API answer is only exercised by a real promotion after the merge; a differing answer makes the guard refuse (safe direction). |
| W4 | Accepted | No push to master during this story: artefacts and state are bundled in the pull request branch. The `sfr-s1` DoD and this story's DoD wait until the promotion that follows each merge has been approved by the operator. |
| W5 | Accepted | Register-in-branch (the assurance gate looks the feature up in the branch's own `pipeline-state.json`), CI on the final commit, remote head verified after every push, exact paths staged, worktree removed junction-first. |

## Oversight level
**High** - a production-promotion safety guard. The operator reviews the pull request closely and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-promotion-guard-bookkeeping/stories/pgb-s1-promotion-guard-bookkeeping-commits.md
Test plan: artefacts/2026-11-21-promotion-guard-bookkeeping/test-plans/pgb-s1-test-plan.md
Goal: write the node check first and confirm the new behaviours fail on the unchanged guard; add scripts/lib/bookkeeping-paths.js and the compare step to scripts/promotion-guard.js; mutation-check every way the guard could be weakened; run the new check, check-spg-s1 and the full npm test with the regression script; register the feature in the branch's pipeline-state; open a draft pull request whose body names artefacts/2026-11-21-promotion-guard-bookkeeping/; wait for CI on the final commit.
Constraints: the guard, the new module, the new check and artefacts only; fail closed; no push to master; do not approve or promote anything; preserve CRLF in promotion-guard.js; stage exact paths; verify the remote head after every push.
```
