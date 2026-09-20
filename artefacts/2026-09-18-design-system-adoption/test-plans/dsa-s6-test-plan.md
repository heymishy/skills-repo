## Test Plan: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-20

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dashboard: no horizontal overflow at 375px/390px | — | — | 1 test | — | — | 🟢 |
| AC2 | Dashboard: skill grid + waiting/recent columns collapse to single column, no illegible cards, no mid-word wrapping | — | — | 1 test | — | — | 🟢 |
| AC3 | Artefact viewer: no horizontal overflow AND main content column not collapsed at 375px/390px | — | — | 1 test | — | — | 🟢 |
| AC4 | Artefact viewer: stacks to single column below 768px, document body before sidebar | — | — | 1 test | — | — | 🟢 |
| AC5 | No regression to either screen's pre-existing functionality/desktop layout | — | — | 1+ pre-existing suites re-run | — | — | 🟢 |

All 5 ACs are CSS-layout-dependent (real viewport-width measurement, real computed column widths, real visual stacking order) — this repo has Playwright already configured and every sibling story in this feature (`dsa-s1` through `dsa-s5`) already established the identical pattern for this exact class of AC. No E2E tooling gap exists; proceeding directly with Playwright per that established precedent, matching this feature's own "don't re-litigate what's already decided" convention.

---

## Coverage gaps

None. Both root-cause CSS locations are already confirmed by direct code read (`decisions.md`, "dsa-s6 created" entry): `dashboard-view.js`'s `.sw-skill-grid`/`.sw-cols`, `artefact.js`'s `.sw-artefact-layout`. The story's own Complexity-2 rating (not 1) reflects that the two screens need genuinely different fixes (a straightforward single-column collapse for the dashboard vs. a reorder-and-stack for the artefact viewer, per `DESIGN.md`'s own document-body-first requirement), not that either fix is untestable.

---

## Test Data Strategy

**Source:** Synthetic (real, already-shipped pages — seeded via this repo's own existing `NODE_ENV=test` auth-bypass fixture, `tests/e2e/fixtures/auth.js`, matching `dsa-s1`/`dsa-s2`'s own established precedent for testing these exact two screens)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Real dashboard page load (any signed-in user with ≥1 product, since the zero-products onboarding path renders different content) | Existing `withAuth` fixture + a real seeded product | None | |
| AC2 | Same page load | Existing fixture | None | |
| AC3 | Real artefact-viewer page load (a real seeded artefact) | Existing fixture, matching `dsa-s1`'s own established seeding pattern | None | |
| AC4 | Same page load | Existing fixture | None | |
| AC5 | `dsa-s1`'s and `dsa-s2`'s own pre-existing E2E specs (already exist, already passing) | Existing fixtures | None | Reuse, do not duplicate |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — pure CSS/layout fix, same reasoning as every prior restyle story in this feature (`dsa-s1` through `dsa-s5`): no unit-testable logic, only rendered layout.

---

## Integration Tests

None — pure CSS/layout fix; no new component handoffs or seams introduced.

---

## E2E Tests (Playwright)

### dashboard-mobile-no-horizontal-overflow

- **Verifies:** AC1
- **Precondition:** Real signed-in session with ≥1 product, dashboard loaded at 375px and 390px viewport
- **Action:** Measure `document.body.scrollWidth` via `page.setViewportSize()` at both widths
- **Expected result:** `scrollWidth` does not exceed the viewport width at either size
- **Edge case:** No

### dashboard-mobile-grid-collapses-legibly

- **Verifies:** AC2
- **Precondition:** Same page/viewports as above
- **Action:** Measure the real rendered width of `.sw-skill-grid`'s cards and `.sw-cols`'s columns; inspect rendered title text for mid-word line breaks
- **Expected result:** Cards/columns render at a legible minimum width (single-column layout, not 3-across/2-across compression); no card title is forced into an awkward mid-word wrap (e.g. "Definition of ready" split as "Definition" / "of ready")
- **Edge case:** No

### artefact-viewer-mobile-no-overflow-no-content-collapse

- **Verifies:** AC3
- **Precondition:** Real signed-in session, a real seeded artefact page loaded at 375px and 390px viewport
- **Action:** Measure `document.body.scrollWidth`; separately measure the real rendered width of the main document-content column (the element carrying `minmax(0,1fr)` in the current desktop-width grid)
- **Expected result:** `scrollWidth` does not exceed the viewport width at either size, AND the main content column's rendered width is not near-zero/illegible (closing the previously-measured 0px at 375px / 14px at 390px collapse)
- **Edge case:** No

### artefact-viewer-mobile-stacks-body-first

- **Verifies:** AC4
- **Precondition:** Same page/viewports as above
- **Action:** Inspect the real DOM/visual order of the document-content element versus the Sign-off/Comments sidebar element at ≤768px
- **Expected result:** The document-content element appears before (above) the sidebar element in visual top-to-bottom order; layout is single-column, not a squeezed 2-column grid
- **Edge case:** No

### dsa-s6-regression-suite-still-passes

- **Verifies:** AC5
- **Precondition:** This story's changes implemented
- **Action:** Re-run `dsa-s1`'s own full regression suite (`tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js` and any other pre-existing specs referencing the artefact-viewer route — confirm the real, current list via the same route/handler E2E coverage check `/verify-completion` already mandates for `routes/artefact.js` changes) and `dsa-s2`'s own full regression suite (`tests/e2e/dsa-s2-dashboard-restyle.spec.js` and any other pre-existing specs referencing `routes/products.js`'s `handleGetDashboard` — confirm via the same coverage-check method) unmodified
- **Expected result:** All pass with no changes required to their own assertions; desktop-width (≥768px) layout is visually unchanged for both screens
- **Edge case:** No

---

## NFR Tests

### dsa-s6-no-page-load-regression

- **NFR addressed:** Performance
- **Measurement method:** This story adds/modifies CSS only (no new network calls, no new data fetches) — confirm no new request is introduced by diffing the network activity before/after on both routes
- **Pass threshold:** Zero new network requests introduced by this story's diff
- **Tool:** Manual comparison during implementation (e.g. Playwright's own network-request capture, or direct code diff confirmation that no new `fetch`/route call was added)

### dsa-s6-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and any existing accessibility properties (ARIA roles/labels already present on both screens) before/after this story's CSS changes
- **Pass threshold:** No regression to any existing accessibility property; additionally, closing the near-invisible-content bug on the artefact viewer is itself a positive accessibility outcome for real mobile users
- **Tool:** Manual comparison during implementation

---

## Out of Scope for This Test Plan

- Testing any of the other 2 real screens (landing page, skill-session chat) — already mobile-responsive as part of their own original delivery, each has its own test plan.
- Testing the shared app shell's own mobile-collapse behavior — already established and tested by `dsa-s1`'s own delivery, not re-tested here.
- Testing the `design.system` DoR governance mechanism — that is `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

No gaps. One risk worth naming: `DESIGN.md`'s own "Artefact/document viewer" pattern text predicts the WRONG column would compress (see `decisions.md`, "dsa-s6 created" entry) — an implementer reading only `DESIGN.md`'s prose (not this story's own Architecture Constraints, which correct this) could misdiagnose the bug. `artefact-viewer-mobile-no-overflow-no-content-collapse`'s own test explicitly measures the main content column's width, not just overall page overflow, specifically to catch this exact failure mode regardless of which diagnosis an implementer starts from.
