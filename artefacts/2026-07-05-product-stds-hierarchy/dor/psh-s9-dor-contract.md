# DoR Contract — psh-s9: Org-level standard promotion and per-product opt-out

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `PUT /standards/:standardId/promote` route — updates `visibility` from `'product'` to `'org'` for a standard owned by `req.session.tenantId`. Idempotent: already-org standard returns HTTP 200, no error.
2. Updated `GET /products/:productId/standards` (from psh-s8) to also return org-level standards: `SELECT ... FROM standards WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2)) AND standard_id NOT IN (SELECT standard_id FROM standard_product_optouts WHERE product_id = $1)`. Org-level standards carry an `orgBadge: true` or `visibility: 'org'` field in the response.
3. `POST /products/:productId/standards/:standardId/optout` route — inserts row into `standard_product_optouts` with `product_id` and `standard_id`. HTTP 200/201.
4. `DELETE /products/:productId/standards/:standardId/optout` route — removes the optout row. HTTP 200.
5. `visibility = 'public'` guard on all standards write endpoints (PUT/promote/PATCH): returns HTTP 400 with `{ reason: 'public_visibility_not_available' }` if `visibility = 'public'` is submitted.
6. `CREATE TABLE IF NOT EXISTS standard_product_optouts` migration block with columns per AC6.

## What will NOT be built

Cross-org sharing (`visibility = 'public'`), bulk opt-out, standards approval workflow.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — promote: visibility changes to 'org', HTTP 200, idempotent | Integration: mocked pool captures UPDATE; assert visibility = 'org' | integration |
| AC2 — org standard appears in all products' lists | Integration: org-level standard in pool; assert in product-B standards list with orgBadge | integration |
| AC3 — opt-out: INSERT into standard_product_optouts | Integration: assert INSERT with product_id/standard_id; standard excluded from active list | integration |
| AC4 — opt-out reversal: DELETE removes row | Integration: assert DELETE on optouts; standard active again | integration |
| AC5 — visibility=public → HTTP 400 | Unit: PUT with visibility='public'; assert 400 + reason body; no UPDATE | unit |
| AC6 — standard_product_optouts table schema | Integration: migration on test DB; assert table + columns + UNIQUE constraint | integration |

## Assumptions

- `req.session.tenantId` is always the authority for `org_id` — promotion only allowed for standards where `org_id = req.session.tenantId`.
- Opt-out: both `product_id` in URL and `standard_id` must belong to the same `tenantId` (security guard on both sides).
- The `standards` table `visibility` CHECK constraint allows 'public' at the DB level (Phase 2 readiness) but the API never sets it.

## Estimated touch points

- **Files:** `src/web-ui/routes/standards.js` (extend), `src/web-ui/server.js` (migration block), `tests/check-psh-s9-standard-promotion.js` (new)
- **Services:** Postgres
- **APIs:** `PUT /standards/:standardId/promote`, `POST /products/:productId/standards/:standardId/optout`, `DELETE /products/:productId/standards/:standardId/optout`

## schemaDepends

`schemaDepends: []`
