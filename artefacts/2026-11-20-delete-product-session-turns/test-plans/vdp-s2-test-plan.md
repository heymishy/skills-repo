## Test Plan: Deleting a product also clears its journeys' session history, and a test fails when a new table that references journeys is not cleared

**Story reference:** artefacts/2026-11-20-delete-product-session-turns/stories/vdp-s2-delete-product-session-turns.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-vdp-s2-delete-product-session-turns.js`, plain Node, fake pools, no database. Modelled on `tests/check-vdp-s1-delete-product-artefacts.js` and `tests/check-djfk-s1-delete-journey-session-turns.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product with session turns and artefacts deletes with 200, everything gone | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Child-table deletes, then journeys, then products | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Other tenant: 404, no delete | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | No journeys: 200, product deleted | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | `deleteJourney` uses the same list and order | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | Every table that references journeys is in the frozen list | 2 (T6, T7) | - | - | - | - | 🟢 |
| AC7 | Staging retry of the real product succeeds | - | - | - | 1 (M1) | Needs staging | 🟡 |

## Red-first plan

T1, T2, T5 (needs the shared module), T6 and T7 fail before the change: the module does not exist and the product delete does not touch `session_turns`. T3 and T4 pass before and after (regression guards). The fake pool models `session_turns.journey_id` and `artefacts.journey_id` as foreign keys with no cascade and throws the exact staging error text if a journey is deleted while either still references it, so T1 fails for the right reason, not just because a function is missing.

T6 is a negative test of its own guard: it runs the scanner on an in-memory schema string that declares a new table referencing journeys and asserts the scanner reports it as missing from the list.

## Manual step (AC7)

After the merge is deployed to staging, the operator deletes product `0d47155e-bc8c-4acc-8521-8bbdb5a1ca20` (`e2e-test-vbr-walkthrough-2026-11-18`) from the UI and records the result in the DoD. If it fails, the staging log line for the request is attached. The agent does not touch staging data.
