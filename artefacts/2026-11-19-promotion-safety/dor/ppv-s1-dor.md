## Definition of Ready: After a production promotion, a read-only job confirms production is running the promoted build and answering /health

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/ppv-s1-post-promotion-verification.md
**Test plan reference:** artefacts/2026-11-19-promotion-safety/test-plans/ppv-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Track:** short

## Contract Proposal
- `scripts/verify-production.js` (AC1 to AC6): polls `/version` then `/health`, GET only, `fetch` and `sleep` injected, default `fetch` throws `Adapter not wired`; on failure opens one `production-verification` issue unless one is already open for the sha.
- `.github/workflows/staging-deploy.yml` (AC7): one new job `verify-production` with `needs: promote-to-prod`, no `environment:`, `issues: write` on that job only. No `if:` added to `promote-to-prod`.
- `tests/check-ppv-s1-post-promotion-verification.js` (T1 to T8).
- `decisions.md` and a DoD.
- Not built: no rollback, no approval, no request other than GET, no change to the `production-error` flow, no browser tests.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test. `.github/workflows/staging-deploy.yml` is a required touchpoint (T8) and is not excluded.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who approves promotions |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass | defaults throw; wiring is AC7 and test T8 |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The first promotion after merge that precedes vbr-s1 on production reports no `buildRunId`; the job is only meaningful once the promoted build carries the stamp, which every build from vbr-s1 onward does. |
| W2 | Accepted | No failure drill against production. The job is verified green on the first real promotion by the operator, and its failure path by T2, T3 and T6. |
| W3 | Accepted | The issue label `production-verification` may need creating in the repository; the script creates the issue without the label if the label is missing and says so. |

## Oversight level
**Medium** - a workflow change that talks to production (read-only); the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-19-promotion-safety/stories/ppv-s1-post-promotion-verification.md
Test plan: artefacts/2026-11-19-promotion-safety/test-plans/ppv-s1-test-plan.md
Goal: write tests/check-ppv-s1-post-promotion-verification.js first and confirm T1 to T8 fail; then add the script and the verify-production job.
Constraints:
- Only GET requests, only to the production host; never deploy, restart, roll back or approve.
- Do not add an if: to promote-to-prod (check-bri-s2.6 T6).
- Grant issues: write on the new job only.
- Do not run the script against production during development; use the injected fetch.
- Check the absolute path contains .worktrees/ppv-s1/ before every edit.
```
