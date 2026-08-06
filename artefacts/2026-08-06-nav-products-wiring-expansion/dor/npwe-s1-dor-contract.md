# Contract Proposal: Show the Products sidebar during skill chat sessions

**Story reference:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Date:** 2026-08-06

## What will be built

`skills.js` gains a D37 module-level Postgres pool reference (`setDbPool(pool)`/`getDbPool()`, mirroring `mtrr-s1`'s `export-data-source.js` precedent), wired once in `server.js`'s startup block. The 13 target render functions (Run a Skill list, question pages, live chat page, commit preview, commit complete, draft complete) each gain a call to the existing `getProductsNavSummary(pool, tenantId)` helper and pass `products`/`activeProductId`/`noProductJourneyCount` through to `renderShell`, exactly matching the 3 already-wired call sites' existing pattern.

## What will NOT be built

- The remaining ~50 unwired `renderShell` call sites (journey sub-pages, artefact viewer, `features.js`, admin pages, settings) — explicitly deferred to a follow-on story.
- Any change to `renderProductsSection`/`renderSidebar`'s own rendering logic — reused byte-for-byte.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render each of the 6 in-scope page types with fixture data, assert Products sidebar + active highlight present | Unit (6 tests) |
| AC2 | Render `/journey/:id` then a chat-session page for the same journey, assert identical active-product resolution | Integration |
| AC3 | Render a chat-session page for a no-product journey, assert "No product" row active | Unit |
| AC4 | Snapshot each of the ~50 excluded call sites before/after, assert byte-for-byte identical | Integration (regression guard, mirrors `pan-s1`'s own AC5 technique) |

## Assumptions

- `getProductsNavSummary(pool, tenantId)`'s existing query shape and cost profile (already proven on the 3 wired pages) generalizes cleanly to `skills.js`'s session-derived `tenantId` (from `req.session.tenantId`, same source the 3 wired pages already use) — no new tenant-resolution logic needed.

## Estimated touch points

- **Files:** `src/web-ui/routes/skills.js` (13 render functions + new `setDbPool`/`getDbPool` pair), `src/web-ui/server.js` (startup wiring, one new block matching the existing `if (process.env.DATABASE_URL) { ... }` pattern)
- **Services:** none new
- **APIs:** none new — reuses `getProductsNavSummary` unchanged

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies block names `pan-s1` as upstream (already merged) — this is a code-level reuse dependency, not a pipeline-state.json schema field dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
