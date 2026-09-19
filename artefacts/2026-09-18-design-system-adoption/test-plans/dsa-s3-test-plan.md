## Test Plan: Restyle the Landing Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Marketing/landing" pattern and the real mock | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing landing-page behavior | — | — | 1+ pre-existing specs re-run | — | — | 🟢 |
| AC5 | Real mobile-viewport check: no horizontal overflow, single-column hero/copy, scaling screenshot frames (375px/390px) | — | — | 1 test | — | — | 🟢 |

---

## Coverage gaps

None — same reasoning as `dsa-s1`/`dsa-s2`. AC5 added 2026-09-19 per the FEATURE-WIDE mobile-responsiveness amendment (see `decisions.md`) — covered by a dedicated new E2E test, no gap.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Unauthenticated navigation to `GET /` (dark mode active) | Synthetic — no login needed, this is the public landing page | None | Real route confirmed at `/review`: `routes/public.js`'s `handleRoot`, dispatched at `server.js:3985-3987` |
| AC2 | Same as AC1, with light mode applied | Synthetic | None | |
| AC3 | Same unauthenticated page load | Synthetic | None | |
| AC4 | Pre-existing test fixtures already used by `wuce23-skill-launcher-landing.spec.js` | Existing fixtures | None | |
| AC5 | Same unauthenticated `GET /` page load, real viewport resize via `page.setViewportSize()` | Synthetic | None | Mirrors `dsa-s2`'s own mobile-check pattern (empirically found the dashboard's own overflow this way — see `decisions.md`) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — same reasoning as `dsa-s1`/`dsa-s2`.

---

## Integration Tests

None — pure presentation change.

---

## E2E Tests (Playwright)

### landing-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** Unauthenticated navigation to `GET /` (dark mode default)
- **Action:** Read computed color custom-property values via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### landing-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same page, light mode toggled on
- **Action:** Same computed-style read
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### landing-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Same page
- **Action:** Assert presence of the centered hero (max-width ~900px copy), full-bleed sections below (max-width 1120px), and browser-chrome-framed product screenshots
- **Expected result:** All named structural elements present and positioned per the layout pattern
- **Edge case:** No

### landing-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run `tests/e2e/wuce23-skill-launcher-landing.spec.js` unmodified
- **Expected result:** Passes with no changes required to its own assertions
- **Edge case:** No

### landing-mobile-viewport-no-overflow

- **Verifies:** AC5
- **Precondition:** Unauthenticated navigation to `GET /`
- **Action:** Set real viewport size to 375x667 and 390x844 (`page.setViewportSize()`); measure `document.body.scrollWidth`; assert hero/copy sections remain single-column; assert any product-screenshot browser-chrome frame's own width does not exceed the viewport width
- **Expected result:** `scrollWidth` does not exceed the viewport width at either size; no fixed-width element forces horizontal overflow
- **Edge case:** Also check that the standard shared-shell hamburger/nav pattern (if the landing page reuses any shell chrome) behaves consistently — though the landing page is unauthenticated and does not use `renderShell`'s sidebar, so this is expected to be N/A; confirm during implementation rather than assuming

---

## NFR Tests

### landing-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle — higher consequence here than internal screens, since this is the first page a prospective user loads
- **Pass threshold:** No measurable regression
- **Tool:** Manual timing comparison during implementation

### landing-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor)
- **Tool:** Manual comparison during implementation

---

## Out of Scope for This Test Plan

- Rewriting marketing copy or messaging — visual restyle only.
- Testing any of the other 3 real screens — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

No gaps.
