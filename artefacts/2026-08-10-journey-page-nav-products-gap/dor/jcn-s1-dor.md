## Definition of Ready: jcn-s1 — Resuming a stage's history and viewing a completed journey both strand the operator with no way back to the dashboard

**Story:** artefacts/2026-08-10-journey-page-nav-products-gap/stories/jcn-s1-thread-products-nav-to-journey-pages.md
**Review artefact:** artefacts/2026-08-10-journey-page-nav-products-gap/review/jcn-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-journey-page-nav-products-gap/test-plans/jcn-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/journey.js` — `handleGetJourneyStageView`: add `pool` as a 3rd parameter (after `res`, matching the `(req, res, pool)` shape, since this handler has no existing `_next` parameter to preserve position for); add the `_getProductsNavSummary` block (mirroring `handleGetJourney`'s exact pattern); thread `products`/`activeProductId`/`noProductJourneyCount` into its `renderShell` call.
- `src/web-ui/routes/journey.js` — `handleGetJourneyComplete`: same treatment.
- `src/web-ui/server.js` — both call sites: pass `_pshPool` as the new argument, matching `handleGetJourney(req, res, null, _pshPool)`'s wiring.
- New test file: `tests/check-jcn-s1-journey-page-nav-products.js`.

**Files explicitly out of scope (must not be touched):**
- `_getProductsNavSummary` (`products.js`) — reused exactly as-is.
- `renderShell`/`renderSidebar`/`renderProductsSection` (`html-shell.js`) — reused exactly as-is.
- Any other `renderShell` call site in `journey.js` or elsewhere — not audited or touched by this story.

### Architecture Constraints

No new architectural decision — reuses `handleGetJourney`'s already-proven wiring pattern exactly. No ADR required.

### Human oversight

**Low** — a small, mechanical parameter-threading change reusing an existing, already-tested pattern; no new logic.

### Coding Agent Instructions

1. In `handleGetJourneyStageView` (`journey.js`), add `pool` as a new parameter. Immediately before the final `renderShell` call, add:
   ```javascript
   var navProducts, noProductJourneyCount;
   if (pool) {
     var navSummary = await _getProductsNavSummary(pool, journey && journey.tenantId);
     navProducts = navSummary.products;
     noProductJourneyCount = navSummary.noProductJourneyCount;
   }
   ```
   Thread `products: navProducts, activeProductId: null, noProductJourneyCount: noProductJourneyCount` into the `renderShell({...})` call. Use whatever tenantId variable is already in scope at that point in the function (check the existing `journey`/session variables — do not introduce a new tenantId lookup).
2. Apply the identical treatment to `handleGetJourneyComplete`.
3. In `server.js`, update both call sites (`await handleGetJourneyStageView(req, res)` → `await handleGetJourneyStageView(req, res, _pshPool)`; same for `handleGetJourneyComplete`).
4. Write the 5 tests per the test plan.
5. Run the new test file plus every existing test file that calls either handler (`check-das-s1-commit-artefact-git-fallback.js`, `check-drh-s1-resume-history-diagram-rendering.js`, `check-dsh-s3-breadcrumb-split-view.js`, `check-dsh-s4-fix-resume-conversation-link.js`, `check-jsvr-s1-wire-stage-view-route.js`, `check-mds-s1-diagram-showcase-fixtures.js`, `check-ougl7-dor-and-journey-complete.js`, `check-p0.2-journey-guard-wiring.js`, `check-p2.2-tenant-isolation.js`, `check-rht-s1-trailing-assistant-turn.js`) unmodified — zero regression, confirming AC5's no-pool-argument case holds for every existing caller.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — server-rendered HTML assertions only)

**PROCEED: Yes**
