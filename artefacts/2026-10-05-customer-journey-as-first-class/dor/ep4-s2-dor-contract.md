# Contract Proposal: Navigation and entry points: "Journeys" nav link and product page link (ep4-s2)

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md
**Date:** 2026-10-09

---

## What will be built

- **One new `NAV_ITEMS` entry** in `src/web-ui/utils/html-shell.js`: `{ id: 'journeys', label: 'Journeys', href: '/customer-journeys', icon: '<single-glyph, matching sibling entries> }`, placed in the main (non-account) section alongside `'org-kanban'`/`'pod-manager'`/`'signals'`. This single array change surfaces it on every page automatically (every route already goes through `renderShell`/`renderSidebar`).
- **`handleGetProductView`** (`src/web-ui/routes/products.js`): one new query, `SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, result passed as a new trailing argument to `_renderProductView`.
- **`_renderProductView`**: one new trailing parameter, `firstJourneyId` (nullable). When truthy, renders a "View journey" link in the existing header button row (alongside Kanban/Roadmap/Standards), targeting `/journeys/<firstJourneyId>`. When falsy, renders nothing in its place.
- **`tests/check-ep4-s2-nav-and-product-link.js`** (new) — 6 unit tests per the test plan.

## What will NOT be built

- No change to any of the 18 existing call sites of `_renderProductView` beyond the one real call in `handleGetProductView` — the new parameter is appended at the end specifically so none of those 18 test files' positional arguments shift.
- No change to the old, unrelated `/journey`/`/journeys` (singular/plural) platform routes or their own nav entries.
- No "multiple journey links" UI for a product with more than one journey — explicit story Out of Scope (only the first, by `created_at`, is linked).
- No journey-creation entry point from the product detail page — explicit story Out of Scope.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (nav link, every page) | `renderSidebar` called with an unrelated `active` value; assert the Journeys link is present regardless | unit |
| AC2 (product-page link, has journey) | `_renderProductView` called directly with a mock `firstJourneyId`; assert the rendered link's `href` | unit |
| AC2 (ordering) | Source-text assertion on the new query's `ORDER BY created_at ASC LIMIT 1` | unit (shape) |
| AC3 (no journey → no link) | `_renderProductView` called with `firstJourneyId: null`; assert no link/placeholder | unit |
| AC4 (keyboard reachable) | Regex assertion that the rendered element is a real `<a href>`, not a JS-only control | unit |

## Assumptions

- The "View journey" link belongs in the existing header button row (Kanban/Roadmap/Standards), not a separate new UI section — matches the story's own "natural points in the product UI" framing and the existing page's own established link-grouping convention.
- The new nav icon is a single unicode glyph, matching every existing `NAV_ITEMS` sibling entry's own convention, not an SVG (which would be inconsistent within this one array, even though it's the more current `DESIGN.md`-preferred convention for genuinely new UI elsewhere).
- `handleGetProductView`'s existing tenant-ownership check on the product itself (already present, unrelated to this story) is sufficient to keep the new `customer_journeys` lookup tenant-safe by construction — the lookup is scoped by `product_id`, and that `product_id` has already been verified to belong to the requesting tenant before this new query ever runs.

## Estimated touch points

**Files:** `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/products.js`, `tests/check-ep4-s2-nav-and-product-link.js` (new)
**Services:** None external.
**APIs:** None new — `/customer-journeys` already exists (`ep4-s1`); `/journeys/:id` already exists (`ep1-s1`).
