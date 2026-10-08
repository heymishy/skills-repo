# Contract Proposal: Journey list page: index of all journeys for the tenant (ep4-s1)

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md
**Date:** 2026-10-09

---

## What will be built

- **`handleGetCustomerJourneysList`** — new handler in `src/web-ui/routes/journeys.js`. Queries `customer_journeys` LEFT JOINed to `products` for the product name, scoped by `tenant_id`, ordered `created_at DESC`; a second query aggregates stage counts from `customer_journey_stages` and merges them in by journey id. Renders each journey's name, truncated description, resolved product name (or "No product"), and stage count. Renders the empty-state message + "New journey" CTA when the tenant has zero journeys.
- **"New journey" modal** — client-side markup + script embedded in the same handler's `bodyContent`, reusing `products.js`'s `ep4s1-pods-modal` dialog/focus-restore pattern. Fields: name (required), description (optional), a product `<select>` populated from an embedded JSON list (reusing the existing `SELECT product_id, name FROM products WHERE tenant_id = $1` query already used elsewhere in `products.js`). Submits to the EXISTING `POST /journeys` handler (`ep1-s1`, unchanged) via `fetch`, with a redirect-aware success check (`response.redirected`/`.url`) so the server's real 302-to-canvas response is handled correctly without ever calling `.json()` on a non-JSON body.
- **`server.js`** — one new dispatch entry: `GET /customer-journeys`, wrapped in `authGuard`, matching the read-only convention of every other `GET` route in this file (no `requireNonViewer`, since viewing the list is not a mutation).
- **`tests/check-ep4-s1-journey-list.js`** (new) — 8 unit tests per the test plan.

## What will NOT be built

- `GET /journeys` is left completely untouched — still owned by the pre-existing, unrelated `handleJourneys` (skill-session first-run screen).
- No change to `handlePostJourneys` (`ep1-s1`) — reused exactly as it already exists.
- Journey deletion, search/filter, and cross-org sharing — all explicit story Out of Scope.
- The "Journeys" nav link and the product-detail-page "View journey" link — both `ep4-s2`'s own scope, not this story's.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (list with correct fields) | `handleGetCustomerJourneysList` called directly against a mock pool with 2 journeys (varying product/stage-count); assert all fields render correctly | unit |
| AC2 (empty state) | Same handler, mock pool returns zero journeys; assert exact message + CTA | unit |
| AC3 (modal fields) | Same handler, mock pool returns 2 products; assert modal markup contains name/description/product-select | unit |
| AC4 (shape: redirect-aware submit) | Extract the modal's submit handler function body from the rendered script; assert it checks `response.redirected` before any `.json()` call | unit (shape) |
| AC5 (reinterpreted: tenant isolation) | Mock pool seeded with two tenants' journeys; assert only the requesting tenant's own appear and the SQL param matches | unit |

## Assumptions

- `customer_journeys.created_at` (confirmed present in the boot-wiring `CREATE TABLE`) is the correct, simplest ordering key for "newest first" — the story doesn't specify an order, and no other ordering convention exists yet for this list.
- The product picker's product list is unfiltered beyond tenant scoping (no "already has a journey" exclusion) — the story's own AC3 says "a picker of existing products for my tenant," not a filtered subset, and `Out of Scope` doesn't mention any filtering beyond that.
- No backend change to `handlePostJourneys` is needed — its existing `name`/`description`/`productId` acceptance and 302-redirect-on-success behaviour already satisfy AC4 exactly as drafted.

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`, `tests/check-ep4-s1-journey-list.js` (new)
**Services:** None external.
**APIs:** `GET /customer-journeys` (new). `POST /journeys` (existing, unchanged, reused).
