## Definition of Ready: A production promotion refuses any commit that is not the head of master, and superseded waiting promotions are cancelled

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/spg-s1-stale-promotion-guard.md
**Test plan reference:** artefacts/2026-11-19-promotion-safety/test-plans/spg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Track:** short

## Contract Proposal
- `scripts/promotion-guard.js` (AC1 to AC3): compares the run commit with the master head, API call injected, default throws `Adapter not wired`.
- `scripts/cancel-superseded-promotions.js` (AC5): cancels waiting, older Staging Deploy runs; API calls injected; a failed cancel is logged and non-fatal.
- `.github/workflows/staging-deploy.yml` (AC4, AC6): one guard step in `promote-to-prod` after checkout and before every `flyctl` step, and one new job `cancel-superseded` after `deploy-staging` with `actions: write` on that job only. No `if:` added to the promote job.
- `tests/check-spg-s1-stale-promotion-guard.js` (T1 to T10).
- `decisions.md` and a DoD.
- Not built: no rebuild at the head, no change to the ruleset, no approval of any run, no deletion of runs, no change to `smoke-test`, `post-deploy-e2e-confirm` or `deploy-staging`.

## Contract Review
Contract review passed. All 6 acceptance criteria map to a named test. `.github/workflows/staging-deploy.yml` is a required touchpoint (T6, T9) and is not excluded. The existing promote-gate check (`tests/check-bri-s2.6-smoke-test-promote-gate.js`) is run as a baseline (T10).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow changes go through a pull request under the platform change policy.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who approves production promotions |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | metric stated with a measured baseline |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass | defaults throw; wiring is AC6 and test T9 |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI change |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The first run after merge cancels every older waiting run (about 125), including the vbr-s1 run `44270386578`. Recorded in `decisions.md`; nothing is deployed or deleted. |
| W2 | Accepted | Behaviour on real GitHub runs (cancelling a waiting run; the guard reading the head) is verified by the operator on the first run after merge, not in CI. |
| W3 | Accepted | Tests read workflow text, so a later workflow edit may touch them (a known change-detector cost, audit finding 9). |

## Oversight level
**Medium** - a workflow change on the production deploy path; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-19-promotion-safety/stories/spg-s1-stale-promotion-guard.md
Test plan: artefacts/2026-11-19-promotion-safety/test-plans/spg-s1-test-plan.md
Goal: write tests/check-spg-s1-stale-promotion-guard.js first and confirm T1 to T9 fail; then add the two scripts and the workflow changes.
Constraints:
- Do not add an if: to promote-to-prod (check-bri-s2.6 T6), and do not change its needs or environment.
- The guard fails closed and never deploys, rebuilds or approves anything.
- Grant actions: write on the cancel job only.
- Check the absolute path contains .worktrees/spg-s1/ before every edit.
```
