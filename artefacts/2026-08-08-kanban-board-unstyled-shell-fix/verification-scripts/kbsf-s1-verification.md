# AC Verification Script: Wrap kanban board HTML in the shared page shell

**Story reference:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
**Technical test plan:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/test-plans/kbsf-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent) | **Date:** 2026-08-08 | **Context:** [x] Post-merge (verified pre-merge, before opening PR)

---

## Automated verification performed

1. **New unit tests** (`tests/check-kbsf-s1-kanban-shell-wrapping.js`) — 3/3 passed. Confirms all three response paths (`handleGetProductKanban`, `handleGetOrgKanban`, `handleGetDashboard`'s `?view=board` branch) now return a full shell document (`<!doctype html>` + `:root {` token block) rather than a bare `renderKanban()` fragment.
2. **New E2E visual test** (`tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js`) — 1/1 passed. Confirms a real `.kb-card`'s `border-left-color` computed style resolves to a real, non-transparent colour (previously would have been unset/transparent since the `var(--green)` token had nothing to resolve against). Screenshot captured (`test-results/kbsf-s1-styled-kanban-board.png`) and visually confirmed: styled card, colour health border, shared nav sidebar, and theme toggle all present.
3. **Full existing kanban regression suite** — all pre-existing unit tests re-run with zero regressions: `check-s1.1-board-advance-action` (6/6), `check-s1.2-not-ready-explanation` (4/4), `check-s2.1-shared-token-redesign` (9/9), `check-s2.2-title-truncation-artefact-badge` (7/7), `check-s3.1-drag-to-advance` (7/7), `check-s3.2-within-column-reorder` (9/9), `check-s3.3-advisory-wip-limits` (5/5), `check-s3.4-item-detail-view` (8/8), `check-psh-s6-product-kanban` (7/7), `check-psh-s7-org-kanban` (7/7), `check-kfd1-kanban-card-and-detail-page-cx` (42/42), `check-kanban-consolidation` (51/51), `check-kanban-view` (30/30).
4. **Full existing kanban E2E regression suite** re-run: `psh-s7-org-kanban.spec.js`, `s3.1-drag-to-advance.spec.js`, `s3.2-within-column-reorder.spec.js` all passed (7 of 8 total; see note below for the 8th).
5. **Pre-existing failure isolated, not a regression**: `psh-s6-product-kanban.spec.js`'s one test navigates directly to a hardcoded `/products/test-product-id/kanban` with no seeding step anywhere in the codebase for that exact product ID — confirmed via `git stash` that this test fails identically on unmodified master, before this fix. Not caused by this change.

---

## Manual verification

Not required — AC1's visual claim is covered by the automated computed-style E2E assertion above (same class of real-CSS-layout check `csd-s2`'s own spec already uses), and a real screenshot was visually reviewed confirming styled cards, health-colour borders, and the shared nav shell all render correctly.

---

## Summary

| AC | Result | Notes |
|----|--------|-------|
| AC1 (product scope) | Pass | Unit + E2E visual confirmed |
| AC2 (org scope) | Pass | Unit confirmed |
| AC3 (tenant scope) | Pass | Unit confirmed |
| AC4 (no regressions) | Pass | Full existing kanban unit + E2E suite re-run, zero regressions; one pre-existing unrelated failure isolated and confirmed pre-existing |

**Overall verdict:** [x] All pass — ready to proceed
