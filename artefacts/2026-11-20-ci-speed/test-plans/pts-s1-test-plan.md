## Test Plan: The e2e purge and cleanup scripts clear session history before journeys, so the staging backlog clears and the purge step stops costing 92 s

**Story reference:** artefacts/2026-11-20-ci-speed/stories/pts-s1-purge-clears-session-turns.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-pts-s1-purge-clears-session-turns.js`, plain Node, fake database objects that enforce the two foreign keys, no network and no staging access. Modelled on `tests/check-vdp-s2-delete-product-session-turns.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Batch purge deletes a chunk whose journey has session turns, no error | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Single-tenant `purgeTenant` clears the same tables in order | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Statement order, and the other ten statements byte-identical to master | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | `clean-e2e-staging-data.js` confirm run: session turns, artefacts, journeys; no delete without confirm | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | `cleanup-e2e-staging-data.js` `deleteJourneyRow` and `deleteProduct` clear children first | 2 (T5, T6) | - | - | - | - | 🟢 |
| AC6 | Guard over every `DELETE FROM journeys` site, plus a fixture that makes it fail | 2 (T7, T8) | - | - | - | - | 🟢 |
| AC7 | Failing child delete is non-fatal; reporting shows 12 tables per chunk | 1 (T9) | - | - | - | - | 🟢 |
| AC8 | The next Staging Deploys' purge summary shows 0 journeys errors and a short step | - | - | - | 1 (M1) | Needs real staging runs | 🟡 |

## Red-first plan

T1, T2, T3, T4, T5, T6, T7 and T9 fail before the change: no script deletes `session_turns`, and the 12-table expectation is new. T1 uses a fake pool that models both foreign keys with no cascade and throws the exact staging error text (`session_turns_journey_id_fkey`) when a journey is deleted while a session turn still references it, so T1 fails for the real reason and passes only if the fix works. T3 holds the master text of the ten unchanged statements as literals and compares them to what the fake receives. T8 (the scanner finds a fixture that deletes journeys without the child tables) tests the guard itself so it cannot go quiet.

**Deliberate updates to existing tests (the behaviour change they pin is the one this story makes):** `check-pebd-s1` (exact query list: one more statement per chunk), `check-alrf-s11` and `check-b3` and `check-tdc-s1` (fake databases and expected statement lists), and `check-dgn-s1` (11 tables per chunk becomes 12; 33 purge events becomes 36, 37 queries becomes 40). Each is changed only where it asserts the old statement list.

## Manual step (AC8)

After the merge, the next one to three Staging Deploys print the purge summary in both purge steps. The DoD records, per deploy: tenants found, `purge journeys` errors, chunk reached, and the step duration, and says plainly if the 90 s guard still fires while the backlog clears. The agent does not run either cleanup script and does not touch staging data directly.
