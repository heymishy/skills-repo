# Contract Proposal — No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Date:** 2026-09-10

---

**What will be built:**
`handleGetDashboard`/`_renderProductDashboard` (`src/web-ui/routes/products.js`) gains a new presence-only entry point in the dashboard body (no numeric count, per `decisions.md`), shown whenever either (a) `noProductJourneyCount > 0` (existing Postgres count) or (b) at least one non-terminal `pipeline-state.json` feature has no matching journey-store record — reusing `journey.js`'s existing `_mergeStateFeaturesIntoJourneyList` logic (or a shared extraction of it) per ADR-028, rather than a second independent computation. The entry point links to `/journey`.

**What will NOT be built:**
No new "no-product list" view — links to the existing `/journey` page. No fix to the sidebar's own `noProductJourneyCount` (explicitly out of scope, logged in `decisions.md`). No numeric count on the new entry point.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `entry-point-shown-for-postgres-no-product-journey` | Integration |
| AC2 | `entry-point-shown-for-cli-only-unbackfilled-feature` | Integration |
| AC3 | `entry-point-links-to-existing-journey-no-product-list` | Integration |
| AC4 | `no-entry-point-when-genuinely-empty` | Integration |
| AC5 | `existing-product-cards-unaffected` | Integration |
| AC6 | `sidebar-no-product-link-unaffected` | Integration |

**Assumptions:**
Assumes `_mergeStateFeaturesIntoJourneyList`'s `repoRoot`-based signature can be called or reused from `products.js` (a `pool`/`tenantId`-oriented file) without a significant refactor — the exact integration shape (call directly, or extract a shared "does any no-product work exist" boolean helper both files can call) is an implementation choice, not prescribed by this contract. If reconciling the two signatures proves more involved than expected, that risk is already named in the story's own Complexity Rating (2, not 1) — not a surprise to be renegotiated mid-implementation.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (`handleGetDashboard`, `_renderProductDashboard`, possibly `getProductsNavSummary`), `src/web-ui/routes/journey.js` (read-only reuse of `_mergeStateFeaturesIntoJourneyList`, no modification), `tests/check-wnl-s3-dashboard-no-product-entry.js` (new).
Services: None.
APIs: None — no new route.
