# Add a products list page so "See all products" shows all products - Implementation Plan

> Executed in this session with /tdd (small; two tasks).

**Goal:** `GET /products` lists the tenant's products; "See all products" links to it.
**Branch:** `feature/pls-s1-products-list-page`
**Worktree:** `.worktrees/pls-s1-products-list-page` (verify this prefix before every edit)
**Test command:** `node tests/check-pls-s1-products-list-page.js`, plus `node tests/check-jcn-s1-journey-page-nav-products.js`

## File map
```
Create:
  tests/check-pls-s1-products-list-page.js        - T1 to T8
Modify:
  tests/check-jcn-s1-journey-page-nav-products.js - the two assertions that expect href="/dashboard" (lines ~122-153)
  src/web-ui/routes/products.js                   - _renderProductsList, handleGetProductsList, export
  src/web-ui/server.js                            - import and the GET /products branch (next to /products/new)
  src/web-ui/utils/html-shell.js                  - renderSeeAllProductsRow(active) and its caller
```

## Task 1: Tests and edited assertions (red)
- [ ] Write `tests/check-pls-s1-products-list-page.js` (harness as in check-bvnd-s1; a mock pool that returns product rows only for the tenant in the query) with T1 to T8; edit the jcn-s1 assertions to expect `/products` for the See-all link.
- [ ] Run both files: expect T1 to T8 and the edited jcn-s1 assertions to FAIL (the handler, the route and the new link do not exist). Commit `test: pls-s1 products list page tests (red)`.

## Task 2: The page, the route and the link (green)
- [ ] `products.js`: add `_renderProductsList` (body markup with CSS variables only, escaped names, links `/products/<id>`, empty state copy as the dashboard's) and `handleGetProductsList(req, res, _next, pool)` using `getProductsNavSummary` and `renderShellWithNav` with `active: 'products'`; export it.
- [ ] `server.js`: import it and add `else if (pathname === '/products' && req.method === 'GET')` wrapped in `authGuard`, beside `/products/new`.
- [ ] `html-shell.js`: `renderSeeAllProductsRow(active)` -> See all products href `/products` (+ active class when `active === 'products'`); pass `active` from `renderSidebar`. Nothing else.
- [ ] Run both test files green; run the neighbouring nav tests (bvnd-s1, pan-s1, jcn-s1, dsa-s2) and confirm no new failure; ASCII and diff check. Commit `feat: products list page at /products and See all products link points to it`.