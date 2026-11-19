## Definition of Ready: Deleting a product also clears its journeys' session history, and a test fails when a new table that references journeys is not cleared

**Story reference:** artefacts/2026-11-20-delete-product-session-turns/stories/vdp-s2-delete-product-session-turns.md
**Test plan reference:** artefacts/2026-11-20-delete-product-session-turns/test-plans/vdp-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `src/web-ui/utils/journey-child-tables.js` (AC6): exports a frozen `JOURNEY_CHILD_TABLES = ['session_turns', 'artefacts']`.
- `src/web-ui/routes/products.js` `handleDeleteProduct` (AC1 to AC4): for each table in the list, `DELETE FROM <table> WHERE journey_id IN (SELECT journey_id FROM journeys WHERE product_id = $1)`, then the existing journeys and products deletes.
- `src/web-ui/adapters/journey-store-pg.js` `deleteJourney` (AC5): the same list, same order, then the journey.
- `tests/check-vdp-s2-delete-product-session-turns.js` (T1 to T7).
- `decisions.md` and a DoD.
- Not built: no change to the three cleanup scripts, no transaction, no change to `session_turns_archive`, no change to the route's response, tenant check or PostHog event.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test or the manual step. `src/web-ui/routes/products.js` and `src/web-ui/adapters/journey-store-pg.js` are required touchpoints (T1 to T5) and are not excluded. The three scripts are excluded and have zero assertions against them.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Source changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | a product owner using wuce |
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
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no new adapter; existing pool wiring unchanged |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI change |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The deletes are not in a transaction; a failure part-way leaves a product with some child rows removed. The same is true today and the order (children, journeys, product) means a retry succeeds. A transaction is a separate change. |
| W2 | Accepted | `REVIEW.md` item at lines 66 to 67 (every table with a foreign key to the deleted table is cleared first) still applies to new `DELETE FROM journeys` lines; this story adds an automated guard for journeys only, not for other parent tables. |
| W3 | Accepted | The cleanup scripts keep the gap until the follow-up; until then e2e cleanup of journeys that have session turns can still fail (and `purge-e2e-tenants.js` hides it). |

## Oversight level
**Low** - a small data-layer fix with a test that models the real foreign keys; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-delete-product-session-turns/stories/vdp-s2-delete-product-session-turns.md
Test plan: artefacts/2026-11-20-delete-product-session-turns/test-plans/vdp-s2-test-plan.md
Goal: write tests/check-vdp-s2-delete-product-session-turns.js first and confirm T1, T2, T5, T6, T7 fail; then add the shared module and use it in handleDeleteProduct and deleteJourney.
Constraints:
- Do not touch the three cleanup scripts or anything under scripts/ except by reading it.
- Do not connect to staging or production, and do not delete any real data.
- Keep tests/check-vdp-s1-delete-product-artefacts.js and tests/check-djfk-s1-delete-journey-session-turns.js passing unchanged.
- Table names come only from the frozen list; bind every other value as a parameter.
- Check the absolute path contains .worktrees/vdp-s2/ before every edit.
```
