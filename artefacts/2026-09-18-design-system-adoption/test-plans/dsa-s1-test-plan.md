## Test Plan: Restyle the Artefact Viewer to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Artefact/document viewer" pattern and the real mock | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing artefact-viewer behavior | — | — | 6 pre-existing specs re-run | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are covered by real, automatable tests — a real browser (Playwright) reliably computes CSS custom-property values and renders layout, so nothing here is CSS-layout-dependent-but-untestable; it is CSS-layout-dependent-and-E2E-testable (Playwright is already configured, per Step 3a's own gap-only trigger).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real journey/session with an artefact to view (dark mode active) | Synthetic — seeded via this feature's own test-only fixture endpoint, matching this repo's established `/test/seed-*` convention (e.g. `ep2-s3`'s own `/test/seed-approval-journey` precedent) | None | No PII, no real user data |
| AC2 | Same as AC1, with the Settings light-mode toggle applied | Synthetic | None | |
| AC3 | Same seeded artefact-view session | Synthetic | None | |
| AC4 | Pre-existing test fixtures already used by `artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js` | Existing fixtures — no new data needed | None | Reuse, do not duplicate |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's ACs are all computed-style/layout/regression assertions that require a real rendered DOM (real browser), not isolable at the unit level. Confirmed via Step 3a: no unit-testable seam exists for "does this element's computed CSS custom property equal this hex value" outside a real browser context.

---

## Integration Tests

None — same reasoning as Unit Tests. No component/service handoff exists in this story's own scope; it is a pure presentation change.

---

## E2E Tests (Playwright)

### artefact-viewer-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real, seeded artefact-view session exists (dark mode is the default)
- **Action:** Navigate to the real artefact-viewer page; read the computed values of every color custom property (`--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--success`, `--warn`, `--danger`) via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### artefact-viewer-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same seeded session, with the Settings light/dark toggle switched to light
- **Action:** Same computed-style read as above, after toggling light mode
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### artefact-viewer-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Same seeded session
- **Action:** Assert presence and structure of the two-column layout (`minmax(0,1fr) 320px`), the Source Serif 4 doc body on a surface card, and the sidebar's Sign-off card and Comments card
- **Expected result:** All named structural elements are present and positioned per the layout pattern
- **Edge case:** No

### artefact-viewer-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run `tests/e2e/artefact-preview.spec.js`, `tests/e2e/artefact-read.spec.js`, `tests/e2e/artefact-writeback.spec.js`, `tests/e2e/wuce20-artefact-index-html.spec.js` unmodified
- **Expected result:** All 4 pre-existing spec files pass with no changes required to their own assertions
- **Edge case:** No — if any of these 4 fail, that is the regression this AC exists to catch, not an edge case

---

## NFR Tests

### artefact-viewer-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle, same seeded session
- **Pass threshold:** No measurable regression (CSS/markup-only change, no new network calls expected) — informal comparison, not a hard millisecond budget, per the story's own NFR wording
- **Tool:** Manual timing comparison during implementation, not a dedicated automated gate

### artefact-viewer-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after the restyle
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor, per `product/constraints.md` #9)
- **Tool:** Manual comparison during implementation, or an automated contrast-check tool if one becomes available — no existing automated a11y gate found in this repo for this page

---

## Out of Scope for This Test Plan

- Testing the light/dark toggle mechanism itself — already tested by its own existing coverage; this plan only tests that the *new token values* apply correctly once toggled.
- Testing any of the other 3 real screens (dashboard, landing, skill-session chat) — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No dedicated automated accessibility-regression tool | This repo has no existing automated a11y gate for this page | Manual comparison during implementation; matches this repo's own established pattern for other stories' accessibility NFRs |
