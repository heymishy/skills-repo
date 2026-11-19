# vdp-s2 Definition of Done

Date: 2026-11-20. Story: deleting a product also clears its journeys' session history, and a test fails when a new table that references journeys is not cleared. Pull request #1164 merged 2026-11-20 (`6d69f7049`). No issue.

## Result: COMPLETE, with one manual check outstanding (retry the delete on staging)

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | a product whose journey has session turns and artefacts deletes with 200, everything removed, no foreign key error. Evidence: T1 in `tests/check-vdp-s2-delete-product-session-turns.js`, against a fake pool that models both foreign keys with no cascade | automated | none |
| AC2 | ✅ | every child-table delete before journeys, journeys before the product. Evidence: T2 | automated | none |
| AC3 | ✅ | another tenant's product: 404, no delete issued. Evidence: T3 | automated | none |
| AC4 | ✅ | a product with no journeys deletes with 200. Evidence: T4 | automated | none |
| AC5 | ✅ | `deleteJourney` clears the same shared list in the same order, then the journey. Evidence: T5 | automated | none |
| AC6 | ✅ | every table that references journeys in `src/` and `scripts/migrate-schema*.js` is in the frozen `JOURNEY_CHILD_TABLES`. Evidence: T6, T7 (T6 also runs its scanner on a fixture table to prove the guard can fail) | automated | none |
| AC7 | ⚠️ | after the merge is deployed to staging, deleting product `0d47155e-bc8c-4acc-8521-8bbdb5a1ca20` from the UI succeeds. Evidence: operator's step; not done by the agent | manual | outstanding: operator retries the delete on staging after the deploy (see Observations) |

Red first: 7 of 12 assertions failed before the change; T1 failed with the exact staging error (`session_turns_journey_id_fkey`), and T3 and T4 passed by design as regression guards. All 12 pass after. `check-vdp-s1-delete-product-artefacts.js` (5) and `check-djfk-s1-delete-journey-session-turns.js` (4) pass unchanged, as do all 111 test files that mention `handleDeleteProduct`, `deleteJourney`, `journey-store-pg`, `DELETE FROM journeys` or `routes/products`. `node scripts/review-checklist.js --check` exits 0. All checks on the pull request passed.

## Observations and follow-ups

- **Manual check outstanding (AC7).** After the staging deploy of `6d69f7049` finishes, delete `e2e-test-vbr-walkthrough-2026-11-18` from the UI. If it fails, attach the staging log line for the request; the log is the quickest way to see which constraint fired (`flyctl logs -a wuce-staging`). The real data path was not exercised against a database, only against a fake pool that models the foreign keys.
- **Three cleanup scripts have the same gap** and are deliberately unchanged (decision D2): `scripts/clean-e2e-staging-data.js` (lines 52 to 53), `scripts/cleanup-e2e-staging-data.js` (lines 123 to 124 and 182) and `scripts/purge-e2e-tenants.js` (lines 81 to 84 and 116 to 119). The purge script ends the journeys delete with `.catch(() => {})`, which swallows the foreign key error; this probably explains leftover staging test data and may be connected to the 92 s purge step measured in `artefacts/2026-11-20-ci-speed/`. To be taken up with `dgn-s1` (not yet confirmed).
- **The deletes are not in a transaction** (DoR warning W1). A failure part-way leaves a product with some child rows removed; because the order is children, journeys, then product, a retry succeeds.
- **The guard covers `journeys` only.** `REVIEW.md` still relies on a human to check other parent tables when a `DELETE FROM` line is added.
- **`session_turns_archive` has no foreign key to `journeys`**, so archived rows of a deleted journey remain; harmless, not cleaned.

## Scope Deviations

- None.
