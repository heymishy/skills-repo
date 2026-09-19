## Test Plan: Add the "Product in Action" Demo Section to the Landing Page

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Browser-chrome-framed "Product in action" section present, matching the mock's visual treatment | — | — | 1 test | — | — | 🟢 |
| AC2 | Static, clearly-labeled placeholder shown (no broken image, not blank, not misleading) | — | — | 1 test | — | — | 🟢 |
| AC3 | Swap-in point for a real GIF requires only a single, clearly-commented reference change | — | — | — | code review | — | 🟢 |
| AC4 | Dark/light mode computed token values match `DESIGN.md`'s tables exactly | — | — | 1 test | — | — | 🟢 |
| AC5 | Real mobile-viewport check: no horizontal overflow, frame scales down (375px/390px) | — | — | 1 test | — | — | 🟢 |
| AC6 | No regression to `dsa-s3`'s own existing landing-page functionality | — | — | 1+ pre-existing suites re-run | — | — | 🟢 |

---

## Coverage gaps

None. AC3 is verified by code review rather than an automated test — appropriate for a maintainability/ergonomics requirement about how easy a future change is, not an observable runtime behavior; matches this feature's own established convention of using the right verification type for the claim being made (e.g. `dsa-s1`'s own AC5 reload-behavior code-review note).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Unauthenticated navigation to `GET /` (either theme) | Synthetic — same real route `dsa-s3` already established | None | |
| AC2 | Same page load, no real GIF asset present (the real state at this story's own completion) | Synthetic | None | |
| AC3 | Direct code read of the committed markup/CSS | N/A (code review) | None | |
| AC4 | Same unauthenticated page load, both themes | Synthetic | None | Reuses `dsa-s3`'s own real token-reading pattern |
| AC5 | Same page load, real viewport resize via `page.setViewportSize()` | Synthetic | None | Mirrors `dsa-s3`'s own AC5 mobile-check pattern exactly |
| AC6 | `dsa-s3`'s own full regression suite (9 Node check-scripts + `lphf-s1` through `s5` + `dsa-s3-landing-restyle.spec.js`) | Existing fixtures | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — pure presentation addition, same reasoning as `dsa-s1`/`dsa-s2`/`dsa-s3`.

---

## Integration Tests

None — pure presentation addition.

---

## E2E Tests (Playwright)

### landing-product-demo-section-present

- **Verifies:** AC1
- **Precondition:** Unauthenticated navigation to `GET /`, scrolled below the hero
- **Action:** Assert presence of the "Product in action" heading, the browser-chrome frame (3 traffic-light dots in the real token colors, a URL-bar-style label), and the demo-content area within it
- **Expected result:** Section and all named structural elements present
- **Edge case:** No

### landing-product-demo-placeholder-honest

- **Verifies:** AC2
- **Precondition:** Same page load, real state at this story's own completion (no real GIF asset yet)
- **Action:** Assert the demo-content area shows a real, visible placeholder element (not a broken `<img>`, not empty/blank space) with honest "demo coming soon" (or equivalent) labeling
- **Expected result:** A real placeholder is visible and its text/label does not claim to show real product content
- **Edge case:** No

### landing-product-demo-tokens-match-design-md

- **Verifies:** AC4
- **Precondition:** Same page, both dark and light mode
- **Action:** Read computed color custom-property values for the section's border/background/text via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s token tables, consistent with `dsa-s3`'s own already-verified rest of the page
- **Edge case:** No

### landing-product-demo-mobile-no-overflow

- **Verifies:** AC5
- **Precondition:** Same page, real viewport resize to 375px and 390px
- **Action:** Measure `document.body.scrollWidth`; measure the browser-chrome frame's own real rendered width against the viewport width
- **Expected result:** `scrollWidth` does not exceed the viewport width at either size; the frame's own width does not exceed the viewport width (scales down, does not clip or force overflow)
- **Edge case:** No

### landing-dsa-s3-regression-suite-still-passes

- **Verifies:** AC6
- **Precondition:** This story's changes implemented
- **Action:** Re-run `dsa-s3`'s own full regression suite unmodified: 9 Node check-scripts (`check-lab-s1.2-landing-page.js`, `check-lphf-s1` through `s5`, `check-ccrh-s1-real-instruction-hash.js`, `check-lccf-s1-fail-open-learnings-count.js`, `check-rpiw-s1-real-route-posthog-wiring.js`) + `NODE_ENV=test npx playwright test` on `lphf-s1` through `s5` + `dsa-s3-landing-restyle.spec.js`
- **Expected result:** All pass with no changes required to their own assertions
- **Edge case:** No

---

## NFR Tests

### landing-product-demo-alt-text-present

- **NFR addressed:** Accessibility
- **Measurement method:** Confirm the placeholder element has appropriate `alt` text (if an `<img>`) or equivalent accessible labeling (if a styled `<div>`) — not decorative-only with no text alternative
- **Pass threshold:** A real, non-empty accessible name/description is present
- **Tool:** Manual/code review during implementation, spot-checked via the E2E suite's own DOM assertions where practical

### landing-product-demo-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Confirm the placeholder itself (no real media file) adds no meaningful page-weight — a CSS-only or small inline placeholder, not an unoptimized image
- **Pass threshold:** No measurable regression from this story's own placeholder; real-GIF file-size budgeting is explicitly deferred to the follow-up story that adds the real asset
- **Tool:** Manual comparison during implementation

---

## Out of Scope for This Test Plan

- Testing the real GIF asset once added — that is the follow-up story's own test plan.
- Testing any of the other 3 real screens — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

No gaps. One risk worth naming: the eventual real GIF asset (out of scope for this story) will need its own accessibility check for WCAG's flashing-content guidance (max 3 flashes/second) — flagged in the story's own NFR section as a follow-up concern, not testable against a placeholder that doesn't exist as real media yet.
