## Test Plan: Add a products list page so "See all products" shows all products

**Story reference:** artefacts/2026-11-15-products-list-page/stories/pls-s1-products-list-page.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-pls-s1-products-list-page.js`, using the harness style of `tests/check-bvnd-s1-board-view-products-nav.js` (mock `res`, mock `pool` that filters by tenant). Existing file changed: `tests/check-jcn-s1-journey-page-nav-products.js` (lines 122 to 153 assert the old target).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/products` lists the tenant's products with links | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Empty state with create link | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Tenant isolation | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | "See all products" links to `/products`; List and Board unchanged | 1 (T5) | - | - | - | - | 🟢 |
| AC5 | Unauthenticated request not served | - | 1 (T8, static route wiring) | - | - | - | 🟢 |
| AC6 | Sidebar present on the page, See all products active | 1 (T6) | - | - | - | - | 🟢 |
| AC7 | Live: the operator's click shows their products | - | - | - | 1 | Live-only | 🟡 |
| NFR | Names HTML-escaped; no hex colours in the new fragment | 2 (T4, T7) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed production app and the operator's login | AC7 | Live-only (not CSS-layout) | Verification scenario 7; `production-observed` |
| Real route authentication is covered by `authGuard`'s own tests; this story proves only that the route is wrapped in it | AC5 | Structural | T8 asserts the wiring; not an accepted risk |

No AC depends on CSS layout (the page reuses inline patterns already used by the dashboard); visual quality is looked at in AC7 but is not an acceptance claim, so no B2 classification is needed.

## Test Data Strategy

**Source:** Synthetic. A mock pool (as in bvnd-s1) that returns product rows only for the tenant in the query parameter, so isolation is proven by the data, not by the test setup; product names include HTML metacharacters and a unique canary per tenant. **Mock-shape verification (CLAUDE.md rule):** the mock mirrors the real queries read from `getProductsNavSummary` (products by `tenant_id`, journeys by `product_id`, no-product journeys by tenant), not invented shapes. **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (new file `tests/check-pls-s1-products-list-page.js`)

- **T1 - lists products with links (AC1).** `handleGetProductsList` for tenant A with three products: status 200; the body holds each name, feature count and a link `href="/products/<id>"`; exactly three product links. Fails today (handler does not exist).
- **T2 - empty state (AC2).** Tenant with no products: body contains "No products yet" and a link to `/products/new` with the text "Create your first product".
- **T3 - tenant isolation (AC3).** Two tenants; request as A: no name, id or canary of B appears anywhere in the body, including the sidebar.
- **T4 - names are HTML-escaped (NFR).** A product named `<img src=x onerror=1>` appears as `&lt;img ...` and never as a tag.
- **T5 - link target (AC4).** `renderSidebar` output contains `href="/products"` on the "See all products" link and no `href="/dashboard"` on that link; the List and Board sub-links still contain `/dashboard` and `/dashboard?view=board`. Fails today.
- **T6 - shell and active state (AC6).** The page includes the Products sidebar section (a product name from the nav) and the See-all link carries the active class when `active: 'products'`. Fails today.
- **T7 - no hex colours in the new fragment (NFR).** The body fragment the new renderer returns matches no `#[0-9A-Fa-f]{3,8}` pattern.

## Integration Tests

- **T8 - the route is registered behind authGuard (AC5).** Static check of `src/web-ui/server.js` (line endings normalised): a branch `pathname === '/products' && req.method === 'GET'` whose body calls `authGuard(` and `handleGetProductsList(`; and that the branch appears BEFORE no regex route that could capture `/products` (the existing `/products/...` regexes require a trailing segment).

## Edited existing tests
- `tests/check-jcn-s1-journey-page-nav-products.js` lines 122 to 153 ("AC2: See all products link points at /dashboard"): change `href="/dashboard"` to `href="/products"` (both assertions) and rename the label. No other assertion changes. `check-bvnd-s1` asserts `'See all products' || '/dashboard'`, still passes.

## NFR Tests
- Security and isolation: T3. Output escaping: T4. Design tokens: T7. Performance: none new (same helper the sidebar already uses), confirmed.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The mock pool cannot prove the real SQL | Existing helper, already exercised on every page | AC7 live check; the helper is unchanged |
| Other pages that call renderShell without products still hide the Products section | Out of scope here | Logged as a separate follow-up in decisions.md |

**Total automated tests:** 8 new (T1 to T8) plus 2 edited assertions.