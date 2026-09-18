# Contract Proposal: Restyle the Dashboard to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Date:** 2026-09-18
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Restyle `src/web-ui/views/dashboard-view.js`'s `renderDashboard` function and `src/web-ui/routes/dashboard.js`'s `handleDashboard` handler to match `DESIGN.md`'s "Dashboard/app shell" layout pattern (fixed 224px sidebar, fluid main column, max-width 1080px content), applying the token values already renamed/updated by `dsa-s1`'s change to `html-shell.js`.

**What will NOT be built:**
Fixing the stale/dead nav links tracked separately in `web-ui-experience-redesign`'s Epic B — that is IA work, not visual restyle. No change to `handleDashboard`'s existing adapters (`setLogger`, `setGetPendingActions`) or `handleGetActions`.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on sidebar/main-column layout | E2E |
| AC4 (no regression) | Playwright: re-run `psh-s4-dashboard-layout.spec.js` + any additional specs found by `/verify-completion`'s own coverage check | E2E |

**Assumptions:**
`handleDashboard`/`renderDashboard` are the real target functions (confirmed via direct code read). `dsa-s1`'s token rename lands first, per Dependencies.

**Estimated touch points:**
Files: `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`. Services: none. APIs: none.
