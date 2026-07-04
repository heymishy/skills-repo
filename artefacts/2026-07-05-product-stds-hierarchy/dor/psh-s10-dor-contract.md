# DoR Contract — psh-s10: Standards injection into skill sessions

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `src/web-ui/standards-adapter.js` — exports `getActiveStandards(productId, tenantId)` (stub-throws `Error('Adapter not wired: standards. Call setStandardsAdapter() before use.')` if unwired) and `setStandardsAdapter(fn)`.
2. Extension of `buildSystemPrompt(params)` to call `getActiveStandards(productId, tenantId)` after the product context sections (psh-s5) and before SKILL.md content. For each standard in the result: appends `## Standards and Patterns` section containing `### [standard.name]` subsection with `standard.content`. Section is omitted entirely if result is empty array.
3. **Separate task:** Production wiring — `server.js` calls `setStandardsAdapter` with a real Postgres function implementing: `SELECT name, content FROM standards WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2)) AND standard_id NOT IN (SELECT standard_id FROM standard_product_optouts WHERE product_id = $1)` before `app.listen`.

## What will NOT be built

Per-skill override of injected standards, standards ordering/prioritisation beyond insertion order, standards content truncation.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Standards section with named subsections injected after product context | Unit: mock returns 2 standards; assert `## Standards and Patterns`, `### Coding Guide`, `### API Patterns` present and after product context sections | unit |
| AC2 — opted-out standard absent | Unit: adapter returns only non-opted-out standards; assert opted-out name absent from prompt | unit |
| AC3 — no section when no active standards | Unit: adapter returns []; assert `## Standards and Patterns` absent from prompt | unit |
| AC4 — D37 stub throws | Unit: fresh module load, no setStandardsAdapter; assert throws with exact message | unit |
| AC5 — D37 production wiring | Unit: server init smoke; getActiveStandards call does not throw adapter-not-wired | unit |
| AC6 — ordering: Product Context → Standards → SKILL.md | Unit: assert indexOf(Product Context section) < indexOf(Standards section) < indexOf(SKILL.md content) | unit |

## Assumptions

- `buildSystemPrompt` already extended in psh-s5 to inject product context sections; this story appends the Standards section after the last product context section.
- The real Postgres adapter's opt-out query is correct when psh-s9 schema is deployed (standard_product_optouts table exists).
- `getActiveStandards` returns `[]` (not throws) when productId has no active standards — adapter responsibility.
- Error propagation (T-NFR2): if adapter throws (DB connection error), `buildSystemPrompt` propagates the error; no silent empty-section fallback.

## Estimated touch points

- **Files:** `src/web-ui/standards-adapter.js` (new), `src/web-ui/server.js` (wiring), `buildSystemPrompt` module (extend), `tests/check-psh-s10-standards-injection.js` (new)
- **Services:** Postgres

## schemaDepends

`schemaDepends: []`
