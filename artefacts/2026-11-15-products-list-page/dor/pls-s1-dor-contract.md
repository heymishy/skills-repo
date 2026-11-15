# Contract Proposal - Add a products list page so "See all products" shows all products

**What will be built:**
- `src/web-ui/routes/products.js`: a new `_renderProductsList(...)` (body markup using only CSS variables, product names escaped with the file's `_escapeHtml`) and `handleGetProductsList(req, res, _next, pool)` that calls `getProductsNavSummary(pool, tenantId)` and `renderShellWithNav`, with `active: 'products'`; exported.
- `src/web-ui/server.js`: `else if (pathname === '/products' && req.method === 'GET')` registered like `/products/new`: `authGuard(req, res, async () => { await handleGetProductsList(req, res, null, _pshPool); })`, plus the handler import.
- `src/web-ui/utils/html-shell.js`: `renderSeeAllProductsRow(active)` links "See all products" to `/products` (List and Board unchanged), adds an active class when `active === 'products'`; `renderSidebar` passes `active` through. Nothing else in the file changes.
- `tests/check-pls-s1-products-list-page.js` (new, T1 to T8) and two edited assertions in `tests/check-jcn-s1-journey-page-nav-products.js`.

**What will NOT be built:**
- No change to the dashboard, the List/Board toggles' targets, the product page, product creation or plan limits; no search, sort or paging; no new SQL (reuses `getProductsNavSummary`); no repair of pages that call `renderShell` without the products list (logged follow-up).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (handler with a mock pool) |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T5 and the edited jcn-s1 assertions | unit |
| AC5 | T8 | structural wiring |
| AC6 | T6 | unit |
| AC7 | Scenario 7 | live (production-observed) |

**Assumptions:** `_escapeHtml` and `getProductsNavSummary` are in scope in products.js (confirmed); `authGuard` redirects unauthenticated users as for `/products/new`; no `/products` GET route exists today (confirmed by search); the existing tests that mention the link are only bvnd-s1 (still passes) and jcn-s1 (edited); the other callers of `renderSidebar` pass `active` unchanged.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/products.js`, `src/web-ui/server.js`, `src/web-ui/utils/html-shell.js`, `tests/check-pls-s1-products-list-page.js` (new), `tests/check-jcn-s1-journey-page-nav-products.js`. Services: none. APIs: new `GET /products`.