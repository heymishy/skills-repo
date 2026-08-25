# Contract Proposal — pncg-s1: Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**What will be built:**
1. New function `renderShellWithNav(pool, tenantId, opts)` in `src/web-ui/routes/products.js` (alongside `getProductsNavSummary`, to avoid a circular dependency with `html-shell.js`): calls `getProductsNavSummary(pool, tenantId)`, merges `products`, `activeProductId` (from `opts.activeProductId || null`), and `noProductJourneyCount` into `opts`, then calls the real `renderShell(mergedOpts)`.
2. All 22 confirmed render call sites (19 handler functions across `products.js`, `journey.js`, `settings.js`, `team-management.js`, `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js`) updated to call `renderShellWithNav` instead of raw `renderShell`.
3. `pool` threaded through as a new parameter (function signature + corresponding `server.js` call site) for every handler that doesn't currently receive it: confirmed for `journey.js`'s `handleGetStageReview`, `handleGetReferenceModal`, `handleGetReference`, `handleGetStories`, `handleGetJourneyById`, `handleGetWizard`; to be confirmed and applied per-file for `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js` (none showed a `pool` parameter, module-level pool reference, or factory-closure pattern on inspection — the implementer determines the right mechanism per file, following the existing `handleGetJourney(req, res, _next, pool)` convention as the model).
4. Three new test files: `tests/check-pncg-s1-shared-nav-wrapper.js` (3 unit tests for the new helper), `tests/check-pncg-s1-nav-coverage-structural.js` (1 comprehensive structural test covering all 22 sites via a manifest table), `tests/check-pncg-s1-nav-coverage-functional.js` (4 targeted integration tests).

**What will NOT be built:**
- No change to `renderShell`'s own signature or `html-shell.js`'s Products-section sub-renderer logic — this story only changes which callers reach that existing, correct logic.
- No refactor of `getProductsNavSummary`'s query performance/caching, even though this story increases how often it's called.
- No fix to the 3 already-correct call sites, or to any genuine error/redirect/fragment/API-response render identified during the audit.
- No fix to `dashboard.js`'s inactive/no-DB fallback handler (`handleDashboard`) — low-priority, infra-limited edge case, explicitly out of scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `renderShellWithNavIncludesProductsSection`, `renderShellWithNavPreservesOtherOpts`, `renderShellWithNavRespectsExplicitActiveProductId` | unit |
| AC2 | `everyConfirmedSiteCallsRenderShellWithNav` (structural, all 22 sites) + `orgKanbanNowIncludesProductsSection`, `settingsNowIncludesProductsSection`, `journeyWizardAllThreeViewsIncludeProductsSection`, `teamMembersNowIncludesProductsSection` (integration, targeted subset) | structural + integration |
| AC3 | Same structural test's `poolParamRequired` check (all sites needing it) + `journeyWizardAllThreeViewsIncludeProductsSection` and `settingsNowIncludesProductsSection`/`teamMembersNowIncludesProductsSection` (proving both the direct-parameter and factory-closure pool-access patterns work) | structural + integration |
| AC4 | Re-run of each of the 22 pages' own pre-existing test files (unchanged expected results) + full suite (`node scripts/run-all-tests.js`) | existing suites + full-suite regression |

**Assumptions:**
- No function name elsewhere in the codebase contains `renderShell` as a substring other than `renderShellWithNav` itself — confirmed via a repo-wide grep before finalizing the structural test's regex approach.
- The 5 files with no discoverable existing pool-access mechanism (`admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js`) will use direct-parameter threading (matching `journey.js`'s fix), not a new factory-closure pattern, since none of them already show factory-closure scaffolding the way `settings.js`/`team-management.js` do.
- `getProductsNavSummary`'s existing query shape and cost profile are acceptable at the new call frequency — this story does not attempt to measure or bound that; see NFR section for the explicit deferral.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `journey.js`, `settings.js`, `team-management.js`, `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js`, `server.js` (call-site updates for the newly-threaded `pool` params), plus 3 new test files
Services: None
APIs: None — no new route, no schema change
