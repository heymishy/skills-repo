# DoR Contract Proposal: Dashboard-shell UX/CX parity and scope/benefit summary

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md
**Date:** 2026-10-26

---

## What will be built

- `src/web-ui/routes/playback-evidence.js` (modified):
  - Page render wrapped via `renderShellWithNav(pool, req.session.tenantId, opts)` (imported from `routes/products.js`) instead of a bare unstyled fragment (AC1)
  - New Scope/Benefit summary section, fetching `discovery.md`/`benefit-metric.md` via the already-wired `fetchArtefact` adapter, using `/playback`'s own `extractMarkdownSection`/`parseBenefitMetricTargets` (from `src/utils/dod-parsing.js`) plus the same `.sw-card`/`.sw-section-title` classes and `escHtml()`-wrapped render call site `playback.js` already uses (AC2)
  - Coverage line reusing `renderCoverageSummaryHtml`/`computeAcCoverageSummary` unmodified, positioned above the per-AC sections (AC3)
  - "Not available" state naming the specific missing artefact when `fetchArtefact` 404s (AC4)
  - CSS for the Scope/Benefit cards to stack below 768px (AC6)
- `tests/check-ppc-s6-dashboard-shell-parity.js` (new) — 10 unit/integration tests
- `tests/e2e/ppc-s6-responsive-summary.spec.js` (new) — 2 E2E tests (AC6)

No change to the existing form elements themselves (AC5 is a regression guard, not new markup).

## What will NOT be built

- No change to `src/web-ui/utils/html-shell.js` or `src/web-ui/routes/products.js`'s own source — `renderShellWithNav` is called, not modified.
- No change to `/playback`'s own route (`playback.js`) — its exports are reused, its own page is untouched.
- No per-epic/per-story grouping of the AC list — stays flat, matching the existing data model.
- No richer gallery layout for screenshots/video — that's `ppc-s5`'s own scope boundary, unaffected here.
- No real-time/live-updating coverage line — unchanged `_renderCaptureAllProgress` mechanism.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Route test asserting Products-nav sidebar markup present; structural source-scan test guarding against a direct `renderShell(` call | Integration |
| AC2 | Route test with mocked `fetchArtefact`; Unit tests for XSS-injection escaping and empty/null-data handling | Integration + Unit |
| AC3 | Route test asserting the coverage line renders above per-AC sections | Integration |
| AC4 | Two route tests — `discovery.md` missing, `benefit-metric.md` missing, independently | Integration |
| AC5 | Re-run of `ppc-s1`'s/`ppc-s2`'s own existing form-submission tests, unmodified | Integration (regression) |
| AC6 | 2 Playwright E2E tests — desktop multi-column baseline, narrow-viewport single-column stack | E2E |

## Assumptions

- `renderShellWithNav`'s own `getProductsNavSummary` call succeeds for a tenant with at least one product — if a tenant somehow has zero products reaching this page (shouldn't be reachable in practice, since a feature requires a product), that's an existing `renderShellWithNav` edge case this story doesn't newly introduce.
- The Scope/Benefit cards' exact visual arrangement (side-by-side vs. stacked) at desktop width is left to implementation, as long as the 768px override (AC6) holds.

## Estimated touch points

**Files:** `src/web-ui/routes/playback-evidence.js`, `tests/check-ppc-s6-dashboard-shell-parity.js` (new), `tests/e2e/ppc-s6-responsive-summary.spec.js` (new)
**Services:** None
**APIs:** None new — reuses the existing page route, no new endpoint

**Do not modify:** `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/products.js`, `src/web-ui/routes/playback.js`, `src/utils/dod-parsing.js`

**schemaDepends:** `[]` — dependency on `ppc-s1` (the page itself) and `ppc-s4` (the `fetchArtefact` path) is on their shipped code, not a `pipeline-state.schema.json` field.
