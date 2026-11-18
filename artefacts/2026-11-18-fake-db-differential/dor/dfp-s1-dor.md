## Definition of Ready: The in-memory test database and real Postgres give the same answers for the users and products queries the browser suite relies on

**Story reference:** artefacts/2026-11-18-fake-db-differential/stories/dfp-s1-fake-db-agrees-with-postgres-users-products.md
**Test plan reference:** artefacts/2026-11-18-fake-db-differential/test-plans/dfp-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-fake-db-differential/dor/dfp-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 6 acceptance criteria (AC) map to a named test, a CI run, or a DoD record. The exclusion list (fake database behaviour, app schema) has no test assertion against it beyond the differential itself (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the developer whose browser suite runs against the in-memory test database" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | The fake's answers are checked against the real engine |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | schema copy guarded by a drift check |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | reliability, security (throwaway service only) |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | new workflow file; no gate file changed |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The schema is copied, not imported (importing the app's module re-boots the server, which is known to hang); the drift check is the guard |
| W5 | Accepted | AC1's coverage is the scenario list as reviewed, not a measured share of the statements the suite issues |

## Standards injection
Domain tags `[tests] [web-ui] [data]`: read `src/web-ui/adapters/fake-test-db.js` (the `query` branches for users and products), the `CREATE TABLE`/`ALTER TABLE` sources cited in the story, `.github/workflows/e2e.yml` (the Postgres service pattern) and `.github/workflows/core-browser-tests.yml` (conventions).

## Oversight level
**Low** - test code and one workflow; the operator reads the diff and the first CI run.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-fake-db-differential/stories/dfp-s1-fake-db-agrees-with-postgres-users-products.md
Test plan: artefacts/2026-11-18-fake-db-differential/test-plans/dfp-s1-test-plan.md
Contract: artefacts/2026-11-18-fake-db-differential/dor/dfp-s1-dor-contract.md
Goal: write tests/check-dfp-s1-fake-db-differential.js first and confirm it fails at require; then write the schema copy, the scenarios, the harness and the normaliser; run the local leg (expect a skip line); add the workflow; push and confirm the CI leg runs and passes; then run once with a deliberately wrong expectation to confirm it fails, revert, and record both runs in the DoD.
Constraints:
- Do not change src/ (the fake database and the app's schema sources are read only).
- The harness drops only the schema fake_diff.
- Check the absolute path contains .worktrees/dfp-s1/ before every edit.
