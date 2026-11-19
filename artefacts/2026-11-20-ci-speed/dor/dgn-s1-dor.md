## Definition of Ready: The staging purge reports which delete is slow or failing, how many tenants each chunk removed, and where it was when it timed out

**Story reference:** artefacts/2026-11-20-ci-speed/stories/dgn-s1-purge-reports-where-time-goes.md
**Test plan reference:** artefacts/2026-11-20-ci-speed/test-plans/dgn-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `scripts/purge-e2e-tenants.js` (AC1 to AC5): `findE2eTenantIds(db, report)`, `purgeTenantsBatch(db, tenantIds, report, chunkInfo)` and `purgeE2eTenants(db, options)` time each query and call an optional `report(event)` (default no-op; a throwing hook is caught); new exported `createPurgeReport()` returning `{ report, summarize, progress }`; `formatPurgeFailureMessage(err, foundTenantIds, progress)` gains an optional third argument; the CLI entrypoint wires `createPurgeReport()` and prints the summary on success and in the failure path.
- `tests/check-dgn-s1-purge-reports-where-time-goes.js` (T1 to T7).
- `decisions.md` and a DoD.
- Not built: no new, removed or reordered query; no `session_turns` delete; no change to the 90 s guard, the exit code or the workflow steps; no change to the cleanup scripts; no deletion of the backlog.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test or the manual step. `scripts/purge-e2e-tenants.js` is the only source touchpoint and is not excluded. The workflow files are excluded and have zero assertions in the new test (the existing bri-s2.6 check is only required to keep passing).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who waits on staging deploys |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is a recorded manual step |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass | `setDbConnection` and its throwing default are unchanged; `report` is a pure optional hook, not an adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | This story does not fix the purge and does not remove the 92 s; it makes the cause readable. The cost continues (about 3 minutes per deploy) until the follow-up fix. Accepted because the cause is unknown and a guess (for example lowering the guard) could hide the evidence. |
| W2 | Accepted | The summary is only as good as one real run: if the guard fires inside the very first query, the summary names that table with 0 completed calls, which is itself the answer. |
| W3 | Accepted | The log may print database error messages; they contain table and constraint names, not row data. |

## Oversight level
**Low** - logging only, with a regression guard on the exact queries; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-ci-speed/stories/dgn-s1-purge-reports-where-time-goes.md
Test plan: artefacts/2026-11-20-ci-speed/test-plans/dgn-s1-test-plan.md
Goal: write tests/check-dgn-s1-purge-reports-where-time-goes.js first and confirm T1 to T4 and T6 fail; then add the optional report hook, createPurgeReport, the progress argument and the CLI wiring in scripts/purge-e2e-tenants.js.
Constraints:
- Do not add, remove or reorder any query, and do not add a session_turns delete.
- Do not connect to staging or production, and do not run the script against a real DATABASE_URL.
- Keep check-pebd-s1, check-alrf-s11 and check-stcs-s1 passing unchanged.
- Do not change the workflow files or the 90 s default guard; the CLI must still exit 0 in every case.
- Preserve the file's existing line endings.
- Check the absolute path contains .worktrees/dgn-s1/ before every edit.
```
