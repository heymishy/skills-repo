# vdp-s1 Definition of Done

Date: 2026-11-19. Story: deleting a product removes its journeys' artefacts first, so a product with started features can be deleted. Pull request #1157 merged 2026-11-19 (`2d03025fe`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (a product whose journey has artefacts deletes cleanly, answering 200) | ✅ | T1 in `tests/check-vdp-s1-delete-product-artefacts.js` | automated | none |
| AC2 (artefacts are deleted before journeys) | ✅ | T2 | automated | none |
| AC3 (another tenant's product answers 404 and deletes nothing) | ✅ | T3 (baseline) | automated | none |
| AC4 (a product with no journeys still deletes) | ✅ | T4 (baseline) | automated | none |
| AC5 (the review checklist lists the new item and still validates) | ✅ | T5 | automated | none |

Red first: T1, T2 and T5 failed before the change (T1 with the same `artefacts_journey_id_fkey` error staging raised); T3 and T4 passed as baselines. Green after the change.

## Observations and follow-ups

- **The incident record broke three tests and master.** The original incident record in `workspace/incidents.json` (`0c6e75e4d`) failed `check-dsrf-s1-seeded-records.js`, `check-ddft-s5-web-ui-rendering.js` and `check-itar-s3-web-ui-rendering.js`, which pin the real file to deferred-item records. It went to master by the path bypass without running the full suite, so master was red until this PR removed the record. Recorded in `decisions.md`.
- **Real incidents cannot be recorded in `workspace/incidents.json` yet.** Doing so needs those three tests moved to a fixture. Operator decision.
- **Staging errors never become issues or incidents** (`error-bridge.js` ignores staging). Open decision in `decisions.md`.
- **The test models the foreign key; it is not real Postgres,** and the delete is not transactional (accepted).
- **Staging check pending.** After the deploy, delete the test product `e2e-test-vbr-walkthrough-2026-11-18` through the UI to confirm the fix on staging.

## Scope Deviations

- None.
