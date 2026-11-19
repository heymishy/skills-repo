## Definition of Ready: The e2e purge and cleanup scripts clear session history before journeys, so the staging backlog clears and the purge step stops costing 92 s

**Story reference:** artefacts/2026-11-20-ci-speed/stories/pts-s1-purge-clears-session-turns.md
**Test plan reference:** artefacts/2026-11-20-ci-speed/test-plans/pts-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `scripts/purge-e2e-tenants.js` (AC1 to AC3, AC7): `purgeTenantsBatch` and `purgeTenant` delete every table in `JOURNEY_CHILD_TABLES` (via `require('../src/web-ui/utils/journey-child-tables')`) before journeys; the `artefacts` statement keeps its text, `session_turns` is the new first statement, and the other nine are untouched.
- `scripts/clean-e2e-staging-data.js` (AC4): the confirmed delete issues the child-table deletes for the matched journey ids before the journeys delete.
- `scripts/cleanup-e2e-staging-data.js` (AC5): `deleteJourneyRow` loops over the list; `deleteProduct` clears each child table for the product's journeys before deleting journeys.
- `tests/check-pts-s1-purge-clears-session-turns.js` (T1 to T9), and deliberate updates to `check-pebd-s1`, `check-alrf-s11`, `check-b3`, `check-tdc-s1` and `check-dgn-s1` where they pin the old statement list.
- `decisions.md` and a DoD.
- Not built: no run of either cleanup script, no change to selection rules, retention, dry-run defaults, the 90 s guard, the exit code, the chunk size, or the workflow steps.

## Contract Review
Contract review passed. All 8 acceptance criteria map to a named test or the manual step. The three scripts are required touchpoints (T1 to T6, T9) and none is excluded. The workflow files are excluded and have zero assertions in the new test. The existing tests that pin the old statement lists are listed and updated on purpose, not worked around.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who waits on staging deploys |
| H2 | At least 3 ACs in Given / When / Then | Pass | 8 ACs |
| H3 | Every AC has a test | Pass | AC8 is a recorded manual step |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass | `setDbConnection` and its throwing default are unchanged; the cleanup script's `setDbConnection` is unchanged |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted by the operator (2026-11-20, "ok 1 yes and 2 yes") | The first successful purge deletes the journeys and session history of about 8,430 `e2e-test-` tenants from the staging database over the next few deploys. They are test data, tagged by the exact prefix, and the script exists to remove them. |
| W2 | Accepted | While the backlog clears, the purge may still hit its 90 s guard on the first one or two deploys (each run reaches about 34 of 43 chunks, and `session_turns` rows may be large). Progress persists because each chunk statement is independent; the DoD records the trend. |
| W3 | Accepted | The size of the `session_turns` rows is unknown; the new delete may be slower per chunk than the others. The dgn-s1 summary will show it. |
| W4 | Accepted | `session_turns_archive` keeps rows for deleted journeys (no foreign key). Harmless; not cleaned here. |
| W5 | Accepted | The agent does not run the two cleanup scripts. If the operator wants the retention-window purge or the `clean-e2e-staging-data.js --confirm` run, that is theirs to start. |

## Oversight level
**Medium** - a change that causes a large staging data delete (operator-approved), checked by a fake that enforces the real foreign keys and by the dgn-s1 report on the first real runs; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-ci-speed/stories/pts-s1-purge-clears-session-turns.md
Test plan: artefacts/2026-11-20-ci-speed/test-plans/pts-s1-test-plan.md
Goal: write tests/check-pts-s1-purge-clears-session-turns.js first and confirm T1 to T7 and T9 fail; then add the child-table deletes to the three scripts and update, deliberately, only the existing assertions that pin the old statement lists.
Constraints:
- Do not connect to staging or production, and never run clean-e2e-staging-data.js or cleanup-e2e-staging-data.js with --confirm or --execute.
- Do not change selection rules, retention, dry-run defaults, the 90 s guard, the exit code, the chunk size or any workflow file.
- The ten unchanged statements in purgeTenantsBatch must stay byte-identical to master.
- Table names come only from the frozen JOURNEY_CHILD_TABLES list; bind every other value.
- Preserve each file's existing line endings.
- Check the absolute path contains .worktrees/pts-s1/ before every edit.
```
