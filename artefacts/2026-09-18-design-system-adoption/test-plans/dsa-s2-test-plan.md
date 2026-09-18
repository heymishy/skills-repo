## Test Plan: Restyle the Dashboard to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Dashboard/app shell" pattern and the real mock | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing dashboard behavior | — | — | 1+ pre-existing specs re-run | — | — | 🟢 |

---

## Coverage gaps

None — same reasoning as `dsa-s1`'s test plan: real browser (Playwright) computed-style/layout assertions are E2E-testable, not a genuine gap.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real authenticated session reaching the dashboard (dark mode active) | Synthetic — existing test-session seeding conventions already used throughout this codebase's E2E suite | None | |
| AC2 | Same as AC1, with light mode applied | Synthetic | None | |
| AC3 | Same authenticated session | Synthetic | None | |
| AC4 | Pre-existing test fixtures already used by `psh-s4-dashboard-layout.spec.js` | Existing fixtures | None | Additional dashboard-touching specs may exist beyond this one named file — `/verify-completion`'s own mandatory route/handler coverage check (per this repo's established `ep2-s3` precedent) will do the exhaustive search at implementation time; this test plan names the one confirmed dedicated spec |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — same reasoning as `dsa-s1`: no unit-testable seam for computed-style/layout assertions outside a real browser.

---

## Integration Tests

None — pure presentation change, no component/service handoff in scope.

---

## E2E Tests (Playwright)

### dashboard-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real, authenticated session reaches the dashboard (dark mode default)
- **Action:** Read computed color custom-property values via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### dashboard-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same session, light mode toggled on
- **Action:** Same computed-style read
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### dashboard-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Same session
- **Action:** Assert presence of the fixed 224px sidebar (products list, main nav, account nav pinned to bottom) and the fluid main column at max-width 1080px
- **Expected result:** All named structural elements present and positioned per the layout pattern
- **Edge case:** No

### dashboard-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run `tests/e2e/psh-s4-dashboard-layout.spec.js` unmodified, plus any additional dashboard-touching specs identified by `/verify-completion`'s own mandatory coverage check at implementation time
- **Expected result:** All pass with no changes required to their own assertions
- **Edge case:** No

---

## NFR Tests

### dashboard-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle
- **Pass threshold:** No measurable regression
- **Tool:** Manual timing comparison during implementation

### dashboard-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor)
- **Tool:** Manual comparison during implementation

---

## Out of Scope for This Test Plan

- Fixing the stale/dead nav links tracked separately in the `web-ui-experience-redesign` feature — that is a different, unrelated IA fix, not this story's scope.
- Testing any of the other 3 real screens — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Full dashboard-touching spec inventory not exhaustively enumerated at test-plan time | The dashboard is the app-shell, likely a starting point for many specs beyond the one dedicated `psh-s4` spec | `/verify-completion`'s own mandatory route/handler coverage check does the exhaustive search before merge, matching this repo's established `ep2-s3` precedent |
