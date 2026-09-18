# Contract Proposal: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Date:** 2026-09-18 (re-signed 2026-09-19 — full live-data-wiring amendment)
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Restyle `src/web-ui/views/dashboard-view.js`'s `renderDashboard` function and `src/web-ui/routes/dashboard.js`'s `handleDashboard` handler to match `DESIGN.md`'s "Dashboard/app shell" layout pattern, using the token values `dsa-s1` already added to `html-shell.js`. **Amended scope:** wire `renderDashboard` into `handleDashboard`'s response (replacing the current placeholder `<h1>Dashboard</h1>` body — `renderDashboard` is otherwise dead code, never called by any live route). Supply real data via: (1) a new mapping function translating `getPendingActions`'s real return shape into `renderDashboard`'s expected `actions`/`pendingActionsCount` shape; (2) a new static skills-catalog array for the `skills` prop; (3) a new derivation function producing `inProgressCount`/`recent` from `journey-store.js`'s `listJourneys()`/`completedStages[]`.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B — that is IA work, not visual restyle. No change to `getPendingActions`'s/`listJourneys`'s/`completeStage`'s own internal logic — all reused exactly as they already work; only `getPendingActions`'s already-existing `setGetPendingActions` test-injection seam is newly exercised inside `handleDashboard` (not modified). No rebuild of `renderShell`'s sidebar.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + any additional specs found by `/verify-completion`'s own coverage check | E2E |
| AC5 (real pending actions) | Unit (mapping-function shape) + Playwright (rendered content with a seeded adapter result) | Unit, E2E |
| AC6 (real skills catalog) | Unit (catalog shape) + Playwright (rendered cards + real session-start link) | Unit, E2E |
| AC7 (real in-progress count / recent sessions) | Unit (derivation-function shape) + Playwright (populated + empty-state cases) | Unit, E2E |

**Assumptions:**
`handleDashboard`/`renderDashboard` are the real target functions (confirmed via direct code read). `dsa-s1`'s token work has already merged (confirmed). `getPendingActions`'s `setGetPendingActions` test-injection seam is real and already exercised by `handleGetActions`'s own existing test coverage. **Open assumption for `/implementation-plan`:** `listJourneys()`'s real production wiring status has not been independently re-confirmed (only `NODE_ENV=test` wiring is confirmed, per `dsa-s1`'s own Task 6 finding) — must be checked before implementing AC7 as designed.

**Estimated touch points:**
Files: `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`, a new small skills-catalog config (exact location TBD at `/implementation-plan`). Services: `adapters/action-queue.js` (consumed, not modified), `modules/journey-store.js` (consumed, not modified). APIs: none new.
