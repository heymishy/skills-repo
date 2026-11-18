## Test Plan: Deleting a product removes its journeys' artefacts first, so a product with started features can be deleted

**Story reference:** artefacts/2026-11-18-delete-product-artefacts/stories/vdp-s1-delete-product-with-artefacts.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-vdp-s1-delete-product-artefacts.js`, plain Node, with a fake pool that enforces the artefacts-to-journeys foreign key.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product with journey artefacts deletes cleanly, 200 | 1 (T1, foreign-key fake pool) | - | - | - | - | 🟢 |
| AC2 | Artefacts delete issued before journeys delete | 1 (T2, recorded query order) | - | - | - | - | 🟢 |
| AC3 | Other tenant: 404, nothing deleted | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | No journeys: product deleted, 200 | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Review item present, check passes, item listed for an added DELETE FROM journeys line | 1 (T5) | - | - | - | - | 🟢 |

## Red-first plan

T1 and T2 fail on the current handler: the fake pool throws the same foreign key error that staging raised when the journeys delete runs while artefacts remain. T5 fails because `REVIEW.md` has no such item. T3 and T4 pass before the change and guard the existing behaviour.
