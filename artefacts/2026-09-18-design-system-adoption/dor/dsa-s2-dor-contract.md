# Contract Proposal: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Date:** 2026-09-18 (re-signed 2026-09-19 for the full live-data-wiring amendment; re-signed again 2026-09-19 for the CRITICAL re-target — see `decisions.md`)
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Restyle the REAL, live `GET /dashboard` route — `src/web-ui/routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard` (confirmed by direct routing trace and an independent, empirical real-server/real-request re-verification: `server.js:2743-2748` dispatches here whenever `_pshPool` is set, true in every real configuration including `NODE_ENV=test`) — to match `DESIGN.md`'s "Dashboard/app shell" layout pattern, using the token values `dsa-s1` already added to `html-shell.js`. Add a greeting, "Run a skill" grid, "Waiting on you", and "Recent sessions" sections to `_renderProductDashboard`'s body content (currently a simple Products-list). Reuse, not rebuild, Tasks 1-3's already-committed, already-reviewed data-wiring functions (`_mapPendingActionsForDashboard`, `_deriveDashboardJourneyData`, `_formatCompletedAgo`, currently in `routes/dashboard.js`) — relocate them (mechanism decided at `/implementation-plan`) rather than duplicate the logic.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B. No change to `getPendingActions`/`listJourneys`/`completeStage`'s own internal logic. No rebuild of `renderShell`'s sidebar. No change to `products.js`'s OTHER functions or the `?view=board` branch. No deletion/cleanup of `routes/dashboard.js`'s now-confirmed-dead route-wiring — only its 3 reusable data-wiring functions are relocated/exported. The existing "no products yet" onboarding CTA is preserved unchanged in behavior.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read on the real `/dashboard` route | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column/greeting/skill-grid/columns layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + every other pre-existing spec touching `handleGetDashboard`/`_renderProductDashboard` + explicit `?view=board` unaffected check | E2E |
| AC5 (real pending actions) | Unit (already passing) + Playwright (on the real route) | Unit, E2E |
| AC6 (real skills catalog) | Unit (already passing) + Playwright (on the real route) | Unit, E2E |
| AC7 (real in-progress count / recent sessions) | Unit (already passing, includes the tenant-filter fix) + Playwright (on the real route) | Unit, E2E |
| AC8 (zero-products onboarding preserved) | Playwright: real session, zero products, confirm the CTA still renders and functions | E2E |

**Assumptions:**
`handleGetDashboard`/`_renderProductDashboard` are the REAL, live target functions — confirmed by tracing the real router dispatch AND an independent real-server/real-request re-verification (`decisions.md`'s CRITICAL finding entry). `dsa-s1`'s token work has already merged. Tasks 1-3's data-wiring functions are correct and reusable as-is. **Open, deliberately-deferred assumption:** the exact relocation mechanism (shared module vs. direct import) — review finding [3-L1], RISK-ACCEPTed. `listJourneys()`'s real production wiring status must still be independently confirmed.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `src/web-ui/routes/dashboard.js` (3 functions relocated/exported, not deleted), possibly a new small shared module. Services: `adapters/action-queue.js`, `modules/journey-store.js` (both consumed, not modified). APIs: none new.
