# DoR Contract — psh-s8: Standards definition and management per product

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `GET /products/:productId/standards` route returning all standards with `product_id = current product` (plus org-level standards for the tenant — deferred to psh-s9; this route returns product-level standards only in this story), ordered by `created_at DESC`.
2. `POST /products/:productId/standards` route inserting a new standard with `product_id`, `org_id = req.session.tenantId`, `visibility = 'product'`, name, content. Returns HTTP 201 with `{ standardId }`. Emits `standard_created` PostHog event with `standardId`, `productId`, `tenantId`, `visibility: 'product'`.
3. `PUT /products/:productId/standards/:standardId` route updating name and/or content, refreshing `updated_at`. Returns HTTP 200.
4. Standards list view template rendering name, visibility badge ("Product"), creation date — all HTML-escaped.
5. Input sanitisation: standard name with `<script>` stored and rendered as plain text.
6. Path traversal guard: if any standard content is written to disk at a path derived from name/content, `path.resolve(derivedPath).startsWith(repoRoot + path.sep)` — HTTP 400 if guard fails.
7. `org_id` on all writes sourced solely from `req.session.tenantId` — never from request body.

## What will NOT be built

Org-level promotion (psh-s9), standards injection (psh-s10), versioning, deletion, import from URL.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — standard inserted, org_id from session, visibility='product', HTTP 201 | Integration: mocked pool; assert INSERT with correct field values | integration |
| AC2 — standard_created PostHog event | Integration: mocked PostHog; assert event properties | integration |
| AC3 — list view shows all product standards with name/visibility/date | Integration: pool returns 3 standards; assert all 3 in response with correct fields | integration |
| AC4 — edit: UPDATE + updated_at refresh | Integration: mocked pool captures UPDATE; assert updated_at value changes | integration |
| AC5 — XSS name: stored as plain text, no script execution | Integration: name = `<script>alert(1)</script>`; assert rendered output is escaped text | integration |
| AC6 — path traversal guard | Integration: standard name with `../`; assert HTTP 400, no file written | integration |

## Assumptions

- `standards` table exists (psh-s1 complete).
- `req.session.tenantId` is always set for authenticated routes — never trust `org_id` from request body.
- Standards are append-only in MVP — no DELETE endpoint in this story.
- Path traversal guard is required even if standards content is stored only in Postgres (guard applied to any disk write derived from form input, no-op if no disk write occurs).

## Estimated touch points

- **Files:** `src/web-ui/routes/standards.js` (new), standards list view template (new), `tests/check-psh-s8-standards-management.js` (new)
- **Services:** Postgres, PostHog
- **APIs:** `GET /products/:productId/standards`, `POST /products/:productId/standards`, `PUT /products/:productId/standards/:standardId`

## schemaDepends

`schemaDepends: []`
