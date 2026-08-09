## Test Plan: Scope the Roadmap tab's early-stage artefact scan to the product actually being viewed

**Story reference:** artefacts/2026-08-09-roadmap-product-scoping/stories/rps-s1-roadmap-product-scoping.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Two products each show only their own roadmap entries | 2 tests | — | — | — | — | 🟢 |
| AC2 | Artefact folder with no matching journey excluded from every product | 1 test | — | — | — | — | 🟢 |
| AC3 | Journeys-lookup query failure fails closed (empty state) | 1 test | — | — | — | — | 🟢 |
| AC4 | Empty-state regression guard | existing suite | — | — | — | — | 🟢 |
| AC5 | Happy-path rendering regression guard | existing suite | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC4/AC5 are covered by re-running the existing `tests/check-a5-roadmap-tab.js` suite unmodified — it already asserts the empty-state and happy-path rendering this story must not regress.

---

## Test Data Strategy

**Source:** Hand-authored artefact fixture directories via `fs.mkdtempSync` (the exact pattern already established in `check-a5-roadmap-tab.js`), plus a mock `pool.query` that responds differently depending on the SQL pattern matched (products lookup vs. journeys lookup) — extending the existing `mockPool` pattern in that same test file.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two artefact folders on disk, two mock journeys rows each with a different `product_id`, two separate `handleGetProductRoadmap` calls with different `productId` route params | Hand-authored, extending `check-a5-roadmap-tab.js`'s existing `mockPool` pattern | None | |
| AC2 | One artefact folder on disk, zero matching rows in the mocked journeys query response | Hand-authored | None | |
| AC3 | Mock `pool.query` throws when the journeys-table SQL pattern is matched | Hand-authored | None | |
| AC4/AC5 | N/A — covered by re-running the existing test file unchanged | `tests/check-a5-roadmap-tab.js` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetProductRoadmap_twoProducts_eachShowsOnlyOwnEntries

- **Verifies:** AC1
- **Precondition:** Two artefact folders on disk (`2026-08-01-product-a-thing`, `2026-08-01-product-b-thing`), both with a `discovery.md` and neither tracked in `pipeline-state.json`. Mock pool: journeys-table query returns `feature_slug: '2026-08-01-product-a-thing'` when queried with `productId: 'p-a'`, and `feature_slug: '2026-08-01-product-b-thing'` when queried with `productId: 'p-b'`.
- **Action:** Call `handleGetProductRoadmap` twice, once with `req.params.id = 'p-a'`, once with `'p-b'`.
- **Expected result:** Product A's rendered roadmap contains "Product A Thing" and does NOT contain "Product B Thing" (and vice versa for Product B).
- **Edge case:** Yes — this is the exact defect being fixed.

### handleGetProductRoadmap_artefactWithNoMatchingJourney_excludedEverywhere

- **Verifies:** AC2
- **Precondition:** One artefact folder on disk (`2026-08-01-orphaned-thing`), not tracked in `pipeline-state.json`. Mock pool: journeys-table query returns zero rows regardless of `productId`.
- **Action:** Call `handleGetProductRoadmap` with `req.params.id = 'p-a'`.
- **Expected result:** "Orphaned Thing" does not appear in the rendered output — the empty-state message renders instead.
- **Edge case:** Yes.

### handleGetProductRoadmap_journeysQueryThrows_failsClosedToEmptyState

- **Verifies:** AC3
- **Precondition:** One artefact folder on disk with a real `discovery.md`. Mock pool: the journeys-table query throws an error (products-table query still succeeds normally).
- **Action:** Call `handleGetProductRoadmap`.
- **Expected result:** The handler does not throw/crash; the rendered response is the existing empty-state message, not an error page and not the old unscoped "show everything" behaviour.
- **Edge case:** Yes — the fail-closed requirement.

---

## Integration Tests

None required beyond re-running the existing `tests/check-a5-roadmap-tab.js` suite, which already exercises `handleGetProductRoadmap` end-to-end via the same `mockPool`/`repoRootAdapter.setRepoRoot` seam this story's new tests use.

---

## NFR Tests

None beyond the ACs above — no new security or accessibility surface; performance impact (one additional indexed query) is negligible and not separately measured.

---

## Out of Scope for This Test Plan

- Any change to `roadmap-scan.js`'s own existing test coverage (`scanRoadmapArtefacts` stays product-agnostic, untested for product-scoping since it doesn't do any).
- Live-database confirmation against the real journeys table — covered by the existing mock-pool pattern, consistent with this file's established test style.

---

## Test Gaps and Risks

None identified as blocking.
