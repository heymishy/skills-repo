## Definition of Ready: rapp-s2 — Fix the Standards tab's missing sidebar nav and duplicate breadcrumb

**Story:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/stories/rapp-s2-standards-tab-nav-and-breadcrumb.md
**Test plan:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/test-plans/rapp-s2-test-plan.md
**Date:** 2026-08-11

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `src/web-ui/routes/products.js` — `handleGetProductStandardsTab` computes `navSummary` via `getProductsNavSummary(_pool, tenantId)` and threads `navProducts`/`noProductJourneyCount` into `_renderStandardsTab`; `_renderStandardsTab`'s signature extended to accept the two new params and pass them (plus `activeProductId: productId`) to `renderShell`; the manual duplicate breadcrumb `<div>` removed from the body.
- New: `tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js`.

**Files explicitly out of scope (must not be touched):**
- `_renderRoadmapTab` — has the identical duplicate-breadcrumb pattern (found during investigation), but is a separate, not-yet-fixed gap per the story's own Out of Scope section.
- `standards.js`'s promote/opt-out route handlers — unaffected, reused as-is.
- Any standards-creation UI or endpoint — confirmed deliberate MVP scoping in `smug-s1`'s own story, not part of this fix.

### Architecture Constraints

No new architectural decision — mirrors the already-proven `jcn-s1` products-nav wiring pattern for a fourth call site, and removes duplicate markup. No ADR required.

### Human oversight

**Low** — a single, well-understood wiring fix mirroring an already-proven pattern, touching one handler and one render function, with no new client-side behavior.

### Coding Agent Instructions

1. `src/web-ui/routes/products.js` — already implemented per the story's two fixes.
2. `tests/check-rapp-s2-standards-tab-nav-and-breadcrumb.js` — already written and passing (7/7).
3. Full regression sweep already run and green: `check-smug-s1-standards-tab-and-query-fix.js` (6/6), `check-jcn-s1-journey-page-nav-products.js` (5/5), `check-pan-s1-product-aware-navigation.js` (29/29), `check-psh-s4-navigation.js` (6/6), `check-psh-s6-product-kanban.js` (7/7), `check-psh-s7-org-kanban.js` (7/7), `check-prc-s4.1-edit-product.js` (3/3), `check-prc-s4.2-delete-product.js` (4/4) — re-run before merge to confirm no drift.
4. After merge and staging deploy: live-verify via Chrome on `wuce-staging.fly.dev` — open any product's Standards tab, confirm (a) the Products/Journeys/Run-a-Skill sidebar is present and populated, (b) only one breadcrumb bar is visible, (c) the Standards page still functions (promote/opt-out unaffected). This is this story's own completion criterion.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified — all ACs are server-rendered-HTML string assertions (breadcrumb count, nav content, link hrefs), not visual/layout-dependent; the live-Chrome step above is a functional smoke check, not a required CSS-layout AC classification.

**PROCEED: Yes**
