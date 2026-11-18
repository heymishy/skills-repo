## Definition of Ready: Deleting a product removes its journeys' artefacts first, so a product with started features can be deleted

**Story reference:** artefacts/2026-11-18-delete-product-artefacts/stories/vdp-s1-delete-product-with-artefacts.md
**Test plan reference:** artefacts/2026-11-18-delete-product-artefacts/test-plans/vdp-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
- `src/web-ui/routes/products.js` (AC1 to AC4): one added statement in `handleDeleteProduct`, issued before the journeys delete.
- `tests/check-vdp-s1-delete-product-artefacts.js` (T1 to T5).
- `REVIEW.md` (AC5): one new item.
- `decisions.md` and a DoD.
- Not built: no schema change, no transaction, no change to the page script's message, no change to `error-bridge.js`, `authGuard`, or any workflow.

## Contract Review
Contract review passed. All 5 acceptance criteria map to a named test. The exclusion list has no test assertion against it. `src/web-ui/routes/products.js` is a required touchpoint and is not excluded.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | operator who started a feature in a product |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | the pool is already injected |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI change |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The delete is not wrapped in a transaction; a failure part-way leaves the product in place and the delete can be run again. |
| W5 | Accepted | The test uses a fake pool that models the foreign key; it does not run against real Postgres. The fake-db differential does not yet cover journeys or artefacts (dfp-s2). |

## Oversight level
**Low** - one added statement, one test, one checklist item.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-delete-product-artefacts/stories/vdp-s1-delete-product-with-artefacts.md
Test plan: artefacts/2026-11-18-delete-product-artefacts/test-plans/vdp-s1-test-plan.md
Goal: write tests/check-vdp-s1-delete-product-artefacts.js first and confirm T1, T2 and T5 fail; then add the artefacts delete to handleDeleteProduct and the REVIEW.md item.
Constraints:
- Do not change any workflow, error-bridge.js, authGuard, the schema, or the existing tests.
- Do not catch errors inside the handler; they must still reach authGuard.
- Check the absolute path contains .worktrees/vdp-s1/ before every edit.
```
