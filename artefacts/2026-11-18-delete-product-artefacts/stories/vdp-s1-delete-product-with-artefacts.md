## Story: Deleting a product removes its journeys' artefacts first, so a product with started features can be deleted

**Epic reference:** None - short-track (bug fix)
**Discovery reference:** None - short-track skips discovery. Evidence: incident `cb7c5cc2-b6c8-4cd2-bedf-476173621b64` in `workspace/incidents.json`. On wuce-staging, 2026-11-18, `DELETE /products/:id` threw `update or delete on table "journeys" violates foreign key constraint "artefacts_journey_id_fkey" on table "artefacts"` at `handleDeleteProduct` (`src/web-ui/routes/products.js`, the `DELETE FROM journeys WHERE product_id` statement). The page showed only "Failed to delete product". `scripts/cleanup-e2e-staging-data.js` already records the rule ("artefacts must be deleted first"); the product handler never followed it.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [data]

## User Story

As **an operator who created a product and started a feature in it**,
I want **to delete the product and have its journeys and their artefacts removed with it**,
So that **a product I no longer want can be removed instead of failing with an unexplained error**.

## Benefit Linkage

**Metric moved:** None formal. Any product with a started feature that has an artefact cannot be deleted today; the operator has no way to remove it from the UI.
**How:** `handleDeleteProduct` deletes `artefacts` rows for the product's journeys before it deletes the journeys, then the product. A review-checklist item records the pattern so a later change that hard-deletes a parent row is prompted to check every dependent table.

## Architecture Constraints

- Change confined to `handleDeleteProduct` in `src/web-ui/routes/products.js`, a new test, a `REVIEW.md` item and artefacts. No schema change, no workflow change.
- `artefacts` is the only table with a foreign key to `journeys` (`REFERENCES journeys(journey_id)`, no cascade). `journeys.product_id` is `ON DELETE SET NULL`, so the explicit journeys delete stays.
- Errors still propagate to `authGuard`, which reports them to the error chain (ecg-s1) and answers 500. This story does not catch them in the handler.
- The tenant check and the 404-not-403 policy are unchanged. The handler never calls GitHub.
- The test models the foreign key: a fake pool that throws if a journey is deleted while artefacts remain, so the test fails on the current code for the real reason.

## Dependencies

- **Upstream:** prc-s4.2 (the handler), ecg-s1 (error capture), rvc-s1 (the review checklist).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a product whose journey has artefacts, When `handleDeleteProduct` runs, Then the artefacts, the journeys and the product are deleted and it answers 200 with no foreign key error.
**AC2:** Given the same product, When the queries are recorded, Then the artefacts delete is issued before the journeys delete.
**AC3:** Given a product owned by another tenant, When `handleDeleteProduct` runs, Then it answers 404 and deletes nothing.
**AC4:** Given a product with no journeys, When `handleDeleteProduct` runs, Then the product is deleted and it answers 200.
**AC5:** Given `REVIEW.md`, When `node scripts/review-checklist.js --check` runs, Then it exits 0, and an added `DELETE FROM journeys` line in a route file lists the new item.

## Out of Scope

- Making the delete atomic with a transaction (the delete is safe to retry; the operator can run it again).
- Changing the "Failed to delete product" message in the page script.
- Turning staging errors into issues or incidents (a separate decision: `error-bridge.js` ignores staging by design).
- Deleting the test product on staging; that is done in the UI after this fix is deployed.

## NFRs

- **Data safety:** the handler deletes only rows belonging to the caller's tenant's product; it never deletes by anything but `product_id`.
- **Reliability:** deterministic tests; no network, no real database.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
