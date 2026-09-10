## Test Plan: Make the "Continue to next stage" action persistently reachable regardless of scroll position

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Gate stays visible when scrolled up through history | — | — | 1 test | — | — | 🟢 |
| AC2 | Form still submits to `/api/journey/:id/gate-confirm` unchanged | — | 1 test | — | — | — | 🟢 |
| AC3 | Short session — control not visually misplaced when nothing to scroll | — | — | 1 test | — | — | 🟢 |
| AC4 | Sub-step affordance markup unaffected (regression guard) | — | 1 test | — | — | — | 🟢 |
| AC5 | Sticky control doesn't create a dead zone over other interactive elements | — | — | 1 test | — | — | 🟢 |

**Step 3a — E2E detection (real trigger this time):** AC1, AC3, and AC5 all assert real, on-screen position/scroll behaviour (`position: sticky` computed rendering, `window.scrollY`, element bounding-box overlap) — none of this is observable in a DOM-simulation environment (jsdom does not compute CSS layout or `position: sticky` at all). Per the skill's own trigger patterns ("CSS-positioned elements where the test verifies on-screen position," "scroll" behaviour), these three ACs are `CSS-layout-dependent` and require a real browser. This repo already has Playwright configured (`tests/e2e/`, `playwright.config.js`, ADR-018) — used directly, matching the identical situation and pattern already established by `jasb-s1` (a story in the immediately preceding session on this exact repo, also about `/journey`-area scroll behaviour). No E2E tooling gap.

---

## Coverage gaps

None. All 5 ACs have a real automated test — AC1/AC3/AC5 via E2E (Playwright, since tooling is already configured), AC2/AC4 via existing-style integration tests reusing `lsbm-s1`'s own test module conventions.

---

## Test Data Strategy

**Source:** Synthetic — E2E tests seed synthetic journeys via the existing `/test/seed-durable-stage` endpoint (same pattern `jasb-s1` and the pre-existing `ep1-s4-stage-selector.spec.js` both use); integration tests use the existing `makeSession()`/`freshRequire()` fixture helpers already defined in `tests/check-lsbm-s1-live-substep-injection.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Enough seeded chat turns/history that the page is taller than the viewport | Synthetic session with multiple prior turns (loaded via existing session-seeding helpers, or a long synthetic system prompt/response pair) | None | Needed to distinguish "gate stayed visible because sticky" from "gate stayed visible because there's nothing to scroll" — same reasoning `jasb-s1`'s own AC1 test used for its 40-journey seed |
| AC2 | A session with an active journey stage gate | `/test/seed-durable-stage` | None | |
| AC3 | A session with minimal content (shorter than viewport) | Synthetic, minimal turn | None | |
| AC4 | A session for a stage with a known sub-step affordance (e.g. discovery, per `lsbm-s1`'s own existing fixtures) | Reuse `lsbm-s1`'s existing `makeSession()` helper | None | |
| AC5 | A session with other interactive elements below the fold near the sticky control | Synthetic session with a sub-step affordance present (link/button elements to check aren't obscured) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's changes are CSS/markup-structural, not isolable pure-function logic distinct from what the integration and E2E tests below already cover directly.

---

## Integration Tests

New tests appended to (or a new file alongside) `tests/check-lsbm-s1-live-substep-injection.js`'s own style, or a new `tests/check-wnl-s2-journey-gate-sticky.js` reusing its `makeSession()`/`freshRequire()` helpers.

### gate-confirm-form-unchanged

- **Verifies:** AC2
- **Components involved:** `handleGetChatHtml` (or equivalent render path) in `src/web-ui/routes/skills.js`.
- **Precondition:** A session with an active journey gate (`journeyId` set, stage complete).
- **Action:** Render the session HTML; inspect the `<form>` inside `.sw-journey-gate`.
- **Expected result:** `action="/api/journey/:id/gate-confirm"`, CSRF field present, button text `"Continue to [nextStage] →"` — byte-identical to today's output apart from the wrapping div's own style/class attribute.

### substep-affordance-markup-unaffected

- **Verifies:** AC4
- **Components involved:** Same render path; reuses `lsbm-s1`'s own slice-boundary assertion pattern (`sliceBetween(body, '<div class="sw-gate-substeps">', '<div class="sw-journey-gate"')`).
- **Precondition:** A session for a stage with a known sub-step affordance (discovery or definition, per `lsbm-s1`'s existing fixtures).
- **Action:** Render the session HTML; run the same slice-boundary extraction `lsbm-s1` already performs.
- **Expected result:** The extracted `SUBSTEP_HTML` content and wiring (`swLaunchClarify`, `swToggleEstimate`, etc.) is unchanged from `lsbm-s1`'s own existing assertions — confirms the `class="sw-journey-gate"` literal-string anchor those existing tests depend on is still present and findable exactly as before.

---

## E2E Tests

New file: `tests/e2e/wnl-s2-journey-gate-sticky.spec.js`, following the exact pattern `jasb-s1`'s own `tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js` established this session (`withAuth` fixture, `seedStage`/seeding helpers).

### AC1: gate stays visible when scrolled up through history

- **Verifies:** AC1
- **Precondition:** A session seeded with enough prior turns/history that the page exceeds the viewport height.
- **Action:** Load the session; scroll to the top of the page (`page.evaluate(() => window.scrollTo(0, 0))` or `page.mouse.wheel`).
- **Expected result:** `.sw-journey-gate`'s bounding box (`getBoundingClientRect()` via `page.locator('.sw-journey-gate').boundingBox()`) has a `y` position within the viewport height (i.e. `toBeInViewport()`), not scrolled above or below the visible area.

### AC3: short session — control not misplaced

- **Verifies:** AC3
- **Precondition:** A minimal-content session (shorter than the viewport).
- **Action:** Load the session.
- **Expected result:** `.sw-journey-gate` renders at its normal position immediately after the content (not floating mid-page with a large visual gap) — assert its `y`-coordinate is close to the bottom of the actual rendered content, not pinned artificially far down the (short) page.

### AC5: sticky control doesn't create a dead zone

- **Verifies:** AC5
- **Precondition:** A session with a sub-step affordance (e.g. a clarify/estimate button) rendered near the bottom of the content, close to where the sticky gate sits.
- **Action:** Load the session; attempt to click the sub-step affordance's own button/link.
- **Expected result:** The click succeeds (element is not obscured/unclickable due to the sticky control overlapping it) — Playwright's own actionability check (auto-retrying click, which fails if an element is covered by another) is sufficient evidence here; no manual coordinate math needed.

---

## NFR Tests

None — confirmed with story owner. Story's own NFR section states no material performance/security impact; the accessibility requirement (AC5's own dead-zone check) is already covered above as an AC-level test, not a separate NFR test.

---

## Out of Scope for This Test Plan

- Visual/aesthetic review of the sticky control's exact appearance (colour, shadow, border) — this story's ACs describe positioning behaviour, not visual design.
- Cross-browser testing beyond Chromium (this repo's existing Playwright config default) — matches this repo's existing E2E testing scope, not a new gap introduced by this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | — | — |
