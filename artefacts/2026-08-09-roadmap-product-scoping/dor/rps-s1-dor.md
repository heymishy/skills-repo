## Definition of Ready: rps-s1 — Scope the Roadmap tab's early-stage artefact scan to the product actually being viewed

**Story:** artefacts/2026-08-09-roadmap-product-scoping/stories/rps-s1-roadmap-product-scoping.md
**Review artefact:** artefacts/2026-08-09-roadmap-product-scoping/review/rps-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-roadmap-product-scoping/test-plans/rps-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/products.js` — `handleGetProductRoadmap` (~line 885-916): add a journeys-table lookup and filter `scanRoadmapArtefacts`'s results to only entries whose `feature_slug` appears in that product's own journeys.
- `tests/check-rps-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/modules/roadmap-scan.js` — stays a pure, product-agnostic filesystem scan.
- `tests/check-a5-roadmap-tab.js` — must pass unmodified (regression baseline for AC4/AC5), not edited.

### Architecture Constraints

No new architectural decision — reuses the existing `journeys` table and `_pool` connection already in scope in the handler being fixed. No ADR required.

### Human oversight

**Low** — a small, additive filter to a precisely identified, code-confirmed scoping gap, reusing existing infrastructure (the `journeys` table's already-correct `product_id` column) rather than building anything new.

### Coding Agent Instructions

1. In `handleGetProductRoadmap` (`src/web-ui/routes/products.js`, ~line 909-911), before calling `scanRoadmapArtefacts`, add:
   ```javascript
   var slugsForThisProduct = {};
   try {
     var journeySlugRows = (await _pool.query(
       'SELECT feature_slug FROM journeys WHERE product_id = $1',
       [productId]
     )).rows;
     journeySlugRows.forEach(function(r) { slugsForThisProduct[r.feature_slug] = true; });
   } catch (_) {
     // rps-s1: fail closed -- on any lookup failure, slugsForThisProduct stays
     // empty, so the roadmap renders its existing empty state rather than
     // falling back to the old unscoped "show everything" behaviour.
   }
   ```
2. Change the existing line:
   ```javascript
   var roadmapEntries = _roadmapScan.scanRoadmapArtefacts(artefactsDir, pipelineState);
   ```
   to:
   ```javascript
   var roadmapEntries = _roadmapScan.scanRoadmapArtefacts(artefactsDir, pipelineState)
     .filter(function(e) { return !!slugsForThisProduct[e.slug]; });
   ```
3. Write the tests per the test plan, extending `tests/check-a5-roadmap-tab.js`'s existing `mockPool`/`repoRootAdapter.setRepoRoot` seam pattern in a new file.
4. Re-run `tests/check-a5-roadmap-tab.js` directly (unmodified) to confirm AC4/AC5 — zero regression to the existing empty-state and happy-path rendering.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — all ACs assert on rendered HTML content, not layout)

**PROCEED: Yes**
