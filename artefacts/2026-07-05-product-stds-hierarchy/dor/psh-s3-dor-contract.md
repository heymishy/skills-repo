# DoR Contract — psh-s3: Product creation flow (hybrid form + AI draft + review)

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `GET /products/new` route serving the product creation form with fields: `name` (required), `techStack` (optional), `constraints` (optional).
2. `POST /products/new/draft` route — accepts form fields, calls `generateProductDraft(formData)` injectable adapter, returns JSON with 5 draft file contents: `mission`, `roadmap`, `techStack`, `constraints`, `architectureGuardrails`.
3. Inline review panel rendered server-side with 5 editable textareas, one per draft file, clearly labelled.
4. `POST /products/confirm` route — inserts product row (`products` table, `tenant_id` from `req.session.tenantId`), stores 5 context file contents as product columns (or JSONB), returns HTTP 201 with `{ productId }`, emits `product_created` PostHog event with `productId`, `tenantId`, `hasContextFiles: true`.
5. Solo plan enforcement: before insert, count products for `tenantId`. If count ≥ 1 and `req.session.plan !== 'team' && req.session.plan !== 'enterprise'`, return HTTP 403 with `{ reason: 'plan_limit', upgradeRequired: true }`.
6. Path traversal guard: if any context file is written to disk, `path.resolve(derivedPath).startsWith(repoRoot + path.sep)` — HTTP 400 if check fails.
7. Input sanitisation: product `name` HTML-escaped before any DOM insertion; AI-generated content HTML-escaped before review panel rendering.
8. `src/web-ui/product-draft-adapter.js` — exports `generateProductDraft(formData)` (throws `Error('Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.')` if unwired) and `setGenerateProductDraft(fn)`.
9. **Separate task:** Production wiring — `server.js` calls `setGenerateProductDraft(realAnthropic Fn)` before `app.listen`.

## What will NOT be built

Reference file upload, editing product context files post-creation, product deletion, CSS-layout-dependent dashboard card rendering (psh-s4).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — form submission (name required, others optional) triggers AI draft for 5 files | Unit: `generateProductDraft` mock called with form fields; assert 5-file response returned | unit |
| AC2 — 5 draft panels rendered, editable | Integration: mock adapter; assert response contains 5 labelled editable panels | integration |
| AC3 — product inserted, PostHog fired, HTTP 201 | Integration: mocked pool + PostHog; assert INSERT fields + event properties | integration |
| AC4 — solo plan: HTTP 403 + plan_limit body | Integration: pool returns 1 existing product for tenantId; assert 403 + body | integration |
| AC5 — team plan: no limit, HTTP 201 | Integration: pool returns 2 existing products + plan = 'team'; assert 201 | integration |
| AC6 — XSS name sanitisation | Integration: name with `<script>`; assert no script in rendered output | integration |
| AC7 — path traversal guard | Integration: path containing `../`; assert HTTP 400, no file written | integration |
| AC8 — D37 production wiring | Unit: after server init, `generateProductDraft` call does not throw adapter-not-wired | unit |

## Assumptions

- `req.session.plan` field carries the plan type ('personal', 'team', 'enterprise').
- Product context files stored as individual text columns on `products` table (implementation decision — columns vs JSONB to be resolved during implementation with preference for explicit columns for queryability).
- `generateProductDraft` calls the Anthropic Completions API with a structured prompt.
- Path traversal guard only fires if context files are written to disk; if stored only in Postgres, the guard is a no-op guard check on the resolved path.

## Estimated touch points

- **Files:** `src/web-ui/server.js` (routes + wiring), `src/web-ui/product-draft-adapter.js` (new), `src/web-ui/routes/products.js` (new), product creation view template (new), `tests/check-psh-s3-product-creation.js` (new)
- **Services:** Postgres, Anthropic API (via adapter), PostHog
- **APIs:** `GET /products/new`, `POST /products/new/draft`, `POST /products/confirm`

## schemaDepends

`schemaDepends: []` — depends on psh-s1 and psh-s2 Postgres schema; no pipeline-state.json field dependencies.
