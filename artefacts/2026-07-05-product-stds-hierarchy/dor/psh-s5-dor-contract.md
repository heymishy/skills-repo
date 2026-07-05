# DoR Contract — psh-s5: Product context injection into skill sessions

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `src/web-ui/product-context-adapter.js` — exports `getProductContext(productId)` (stub-throws `Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.')` if unwired) and `setProductContextAdapter(fn)`.
2. Extension of `buildSystemPrompt(params)` to call `getProductContext(productId)` when `productId` is non-null. Prepends five named sections before SKILL.md content:
   - `## Product Context — Mission`
   - `## Product Context — Tech Stack`
   - `## Product Context — Constraints`
   - `## Product Context — Roadmap`
   - `## Product Context — Architecture Guardrails`
   Each section contains the corresponding content from the Postgres `products` row. If `productId` is null, injection is skipped (no sections, no error).
3. **Separate task:** Production wiring — `server.js` calls `setProductContextAdapter` with a real Postgres function (`SELECT mission, roadmap, tech_stack, constraints, architecture_guardrails FROM products WHERE product_id = $1 AND tenant_id = $2`) before `app.listen`.

## What will NOT be built

Editing product context files via UI, per-skill override of which sections are injected, standards injection (psh-s10).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — 5 sections injected in order before SKILL.md | Unit: mock adapter returns full context object; assert all 5 headers present and before skill content | unit |
| AC2 — content from adapter (DB canonical), not session | Unit: assert adapter called once; session.productContext not read | unit |
| AC3 — NULL product_id: no sections, no error | Unit: productId = null; assert 0 context headers, no throw | unit |
| AC4 — D37 stub throws | Unit: fresh module load, no setProductContextAdapter call; assert throws with exact message | unit |
| AC5 — D37 production wiring | Unit: server init smoke; getProductContext('test') does not throw adapter-not-wired | unit |
| AC6 — concurrent session isolation | Unit: two buildSystemPrompt calls with different productIds and different mock returns; assert no cross-contamination | unit |

## Assumptions

- `buildSystemPrompt(params)` function exists in an importable module; params includes `{ productId, tenantId, skillContent }`.
- `productId` is available on the journey object at session start (set by psh-s4).
- Real Postgres adapter returns null gracefully for unrecognised productId (AC3 fallback).

## Estimated touch points

- **Files:** `src/web-ui/product-context-adapter.js` (new), `src/web-ui/server.js` (wiring), module containing `buildSystemPrompt`, `tests/check-psh-s5-context-injection.js` (new)
- **Services:** Postgres
- **APIs:** None (internal function, no HTTP route)

## schemaDepends

`schemaDepends: []`
