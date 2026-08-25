## Test Plan: bvnd-s1 — Fix `/dashboard?view=board` silently dropping the Products nav section

**Story reference:** `artefacts/2026-08-25-board-view-nav-dead-end/stories/bvnd-s1-fix-board-view-missing-products-nav.md`
**Test file:** `tests/check-bvnd-s1-board-view-products-nav.js`

Follows the existing `tests/check-kanban-consolidation.js` pattern for testing `handleGetDashboard` — `makeMockRes()`/`makeMockPool()` helpers, direct function invocation with a fake `pool`, asserting on `res._body` HTML output. Extends the mock pool to also handle `getProductsNavSummary`'s additional queries (per-product journey rows for `journeyCount`/`lastUpdated`, and the tenant-wide no-product-journey count).

### Tests

**T1 — boardViewIncludesProductsNavSection (AC1)**
Given a tenant with 2 existing products, call `handleGetDashboard` with `query: { view: 'board' }`. Assert the response body contains the Products section markers: `sw-product-nav-item` (product rows), `"See all products"` link text/href, and the `+` "New product" link (`/products/new`, `title="New product"`).

**T2 — boardViewProductsMatchNonBoardView (AC1, AC3)**
Given the same tenant/mock pool, call `handleGetDashboard` once with `query: { view: 'board' }` and once with `query: {}` (non-board). Assert both responses' bodies contain the same product names/IDs in the Products nav section — proving the board path surfaces the same live data as the working non-board path, not a stale or divergent set.

**T3 — emptyTenantBoardViewShowsCreateProductCta (AC2)**
Given a tenant with zero products and zero no-product journeys (mock pool returns `[]` for all product/journey queries), call `handleGetDashboard` with `query: { view: 'board' }`. Assert the response body contains an explicit empty-state CTA — text matching "first product" (or equivalent) and a link to `/products/new`.

**T4 — nonEmptyTenantBoardViewDoesNotShowEmptyCta (AC2, non-regression)**
Given the 2-product tenant from T1, assert the response body does NOT contain the empty-state "Create your first product" CTA — it should only appear for genuinely empty tenants, not unconditionally.

**T5 — boardViewReusesGetProductsNavSummary (AC3)**
Static/structural check: read `src/web-ui/routes/products.js` source and assert the `?view=board` branch's code calls `getProductsNavSummary(` — confirming the fix reuses the existing summary function rather than introducing a second, divergent data-fetch path.

**T6 — kanbanColumnsRenderingUnchanged (AC4, non-regression)**
Given the 2-product tenant fixture from `check-kanban-consolidation.js`'s own IT3 test (2 products, 1 journey each in different stages), call `handleGetDashboard` with `query: { view: 'board' }`. Assert the response body still contains both journeys' `feature_slug` values (`feat-a`, `feat-b`) — the underlying kanban board content is unaffected by the sidebar fix.

**T7 — existingKanbanConsolidationSuiteStillPasses (AC4, non-regression, integration)**
Run `tests/check-kanban-consolidation.js` itself (the pre-existing test file covering `buildTenantKanbanColumns`/`handleGetDashboard`) and assert it exits 0 — confirms the fix doesn't break the existing IT3 assertions (which check journey content, not sidebar content, so should be unaffected, but verified directly rather than assumed).
