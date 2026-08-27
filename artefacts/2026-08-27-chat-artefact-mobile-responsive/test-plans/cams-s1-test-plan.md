## Test Plan: Stack the chat/artefact split-panel into a single column on mobile

**Story reference:** artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## Pre-implementation investigation (informs this plan)

Direct source inspection confirmed the exact scope before writing this plan:

- **One shared component, two consuming pages.** `views/chat-view.js`'s `renderChat` function contains the unresponsive `.sw-chat` grid (`grid-template-columns: minmax(0,1fr) minmax(0,1fr)`, no `@media` query in the file at all). It is used by `skills.js` (the live active-session chat page) and `journey.js` (the dsh-3 read-only historical-conversation stage view) — fixing the one shared CSS block fixes both surfaces.
- **An established breakpoint and test pattern already exist in this repo**, just not applied here: `html-shell.js`'s sidebar nav collapses to a drawer at `@media (max-width: 768px)`; `tests/e2e/lphf-s2/s3/s4/s5-responsive.spec.js` establish the exact Playwright pattern (viewport resize, assert no horizontal `scrollWidth` overflow, assert key elements visible) for the landing page — this story reuses both, applied to a different page.
- **The ideate skill's "3-panel" right side is internally structured but still one `.sw-chat-pane`** — no skill-specific CSS branching needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No horizontal overflow at 375px (live chat page) | — | — | 1 test | — | — | 🔴 |
| AC2 | Panes stacked vertically, both visible, real width (live chat page) | — | — | 1 test | — | — | 🔴 |
| AC3 | Same behaviour on the historical-conversation stage view | — | — | 1 test | — | — | 🔴 |
| AC4 | Ideate's 3-panel variant remains readable, no overflow | — | — | 1 test | — | — | 🟡 |
| AC5 | Desktop (1280px) layout unchanged | — | — | 1 test (same parametrized file) | — | — | 🟢 |
| AC6 | Existing chat-page test suite passes unchanged | 3 files re-run | — | — | — | — | 🟢 |

---

## Coverage gaps

**AC1-AC5 are inherently CSS-layout-dependent** (per this repo's own B2 standard: any AC verifiable only by a browser rendering CSS layout must be classified at DoR time as either an automated visual/Playwright test or a RISK-ACCEPT + manual smoke test). This story classifies them as **automated Playwright E2E tests**, following the exact existing `lphf-s2/s3/s4/s5-responsive.spec.js` pattern already established in this repo for the same problem class — no RISK-ACCEPT needed, since real browser-rendered verification is directly achievable and already has repo precedent.

---

## Test Data Strategy

**Source:** Synthetic — runs entirely locally against the mock LLM gateway (`NODE_ENV=test`), no real staging, no real credits, no real LLM cost. Reuses `rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js`'s own `useIsolatedTenant`/`driveJourneyToStage`-style helpers (duplicated per that file's own stated "no cross-file run-order coupling" convention, not imported) — that spec already drives a journey to both a live chat page and, after gate-confirming, its `/journey/:id/stage/:stageName` historical view, which is exactly the two page-types this story needs.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## E2E Tests

New file: `tests/e2e/cams-s1-chat-artefact-responsive.spec.js`, combining two established local patterns: `lphf-s2/s3/s4/s5`'s `for (const width of [...])` viewport-loop structure, and `rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js`'s local mock-gateway journey-driving helpers for reaching an authenticated chat page and its historical stage view.

### AC1/AC2/AC5: live chat page, mobile + desktop

- **Action:** For `width` in `[375, 1280]`: `page.setViewportSize({ width, height: 800 })`, then drive a fresh isolated-tenant journey to a live chat page via the reused `useIsolatedTenant`/`driveJourneyToStage`-style local helpers (mock LLM gateway, no staging).
- **Expected result:** At 375px: `document.body.scrollWidth <= 375`; `.sw-chat-pane` elements (chat thread and artefact/canvas pane) are both visible with `boundingBox().width` close to the viewport width (accounting for page padding), and the chat pane's bounding box `y` position is above (lower `top`) the artefact pane's, confirming vertical stacking in reading order. At 1280px: the two panes' bounding boxes have overlapping `y` ranges and non-overlapping `x` ranges, confirming the existing side-by-side layout is unchanged.

### AC3: historical-conversation stage view

- **Action:** Same viewport-resize technique; after the chat page's turn completes, gate-confirm past it (matching `rdac-s1`'s own pattern) and navigate to `/journey/:journeyId/stage/:skillName`.
- **Expected result:** Same assertions as AC1/AC2 at 375px (no overflow, stacked panes) — this is the direct regression proof that fixing the shared component fixes both consuming pages.

### AC4: ideate's 3-panel variant

- **Action:** Same technique, driving an ideate skill session specifically (`skillName: 'ideate'`).
- **Expected result:** At 375px, no horizontal overflow; the three internal sub-sections (conditions, assumptions, canvas) are all present in the DOM and visible (not clipped/hidden by the stacking change).

---

## Unit Tests

None new — this is a pure CSS change with no new JS logic; existing unit-level chat-page tests (AC6) provide the regression guard for markup/structure.

---

## NFR Tests

None named — story's own NFR section confirms negligible performance impact and an accessibility improvement, neither requiring a dedicated test beyond the E2E specs above.

---

## Out of Scope for This Test Plan

- Unit-testing `chat-view.js`'s CSS string output directly (e.g., asserting the exact media-query text appears in the returned HTML string) — brittle and doesn't prove actual rendered behaviour; the E2E specs are the real proof, matching this repo's own `lphf-s*` precedent of testing rendered layout, not CSS source text.
- Any visual regression / pixel-diff screenshot testing — this repo's existing responsive-test convention (`lphf-s*`) uses layout-assertion (overflow, bounding boxes, ordering), not screenshot diffing; this story matches that convention rather than introducing a new tooling dependency.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-device testing (actual phone hardware/browser) not performed | Playwright's viewport emulation approximates but does not perfectly replicate every mobile browser's rendering quirks | Consistent with this repo's existing `lphf-s*` precedent, which also relies on Playwright viewport emulation alone; if a real-device issue surfaces later, it would be a fast, narrow follow-up fix, not evidence this approach was wrong |
