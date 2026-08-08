## Test Plan: Wrap kanban board HTML in the shared page shell

**Story reference:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product-scope kanban response is shell-wrapped, tokens resolve | 1 test | — | 1 test (visual) | — | — | 🟢 |
| AC2 | Org-scope kanban response is shell-wrapped identically | 1 test | — | — | — | — | 🟢 |
| AC3 | Tenant-scope (`?view=board`) kanban response is shell-wrapped identically | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing kanban E2E/unit suites pass unchanged | — | — | Full re-run | — | — | 🟢 |

---

## Coverage gaps

None. The unit tests are new (this is the first test asserting on the *wrapping* of `_sendKanbanHtml`'s output, as opposed to the board content itself, which existing tests already cover).

---

## Test Data Strategy

**Source:** Synthetic — existing product/journey fixtures already used by `psh-s6`/`psh-s7`/`s3.1` E2E specs, plus a direct unit-level assertion on the response body's presence of `DESIGN_SYSTEM_CSS` markers (`:root {`) and absence of a bare, unwrapped fragment.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### sendKanbanHtml_wrapsResponseInSharedShell_forProductScope

- **Verifies:** AC1
- **Precondition:** Mock request/response for `GET /products/:id/kanban`, mock pool returning a valid owned product and empty journey list
- **Action:** Call `handleGetProductKanban`
- **Expected result:** Response body contains `<!doctype html>` and the `:root {` token-definition block from `DESIGN_SYSTEM_CSS` — confirming the response is the full shell, not a bare `renderKanban()` fragment
- **Edge case:** No

### sendKanbanHtml_wrapsResponseInSharedShell_forOrgScope

- **Verifies:** AC2
- **Precondition:** Same pattern as above, for `handleGetOrgKanban`
- **Action:** Call `handleGetOrgKanban`
- **Expected result:** Same shell markers present in the response body
- **Edge case:** No

### sendKanbanHtml_wrapsResponseInSharedShell_forTenantScope

- **Verifies:** AC3
- **Precondition:** Same pattern as above, for the `?view=board` branch of `handleGetDashboard`
- **Action:** Call `handleGetDashboard` with `req.query.view = 'board'`
- **Expected result:** Same shell markers present in the response body
- **Edge case:** No

---

## E2E Tests

### Visual: product kanban board renders with real (non-default) card styling

- **Verifies:** AC1 (visual confirmation beyond the unit-level marker check)
- **Action:** Seed a real product + journey (reusing `s3.1`'s existing `/test/seed-board-journey` fixture), navigate to `/products/:id/kanban`, screenshot
- **Expected result:** `.kb-card` has a non-transparent, non-initial `border-left-color` (computed style check) — the same class of real-CSS-layout assertion `csd-s2`'s spec already uses for its own diagram legibility checks

---

## Regression Suite

### Full re-run: existing kanban test files

- **Verifies:** AC4
- **Files:** `tests/e2e/psh-s6-product-kanban.spec.js`, `tests/e2e/psh-s7-org-kanban.spec.js`, `tests/e2e/s3.1-drag-to-advance.spec.js`, `tests/e2e/s3.2-*.spec.js` (if present), `tests/check-kbc-s1-*.js`, `tests/check-s3.1-*.js`, `tests/check-s3.2-*.js`, `tests/check-s3.3-*.js`, `tests/check-s3.4-*.js`
- **Expected result:** All pass unchanged. In particular, `psh-s6`'s `[data-stage]` column-count assertion and `s3.1`'s `.kb-card[data-journey-id="..."]` drag-and-drop flow must continue to resolve identically once the fragment is embedded inside the shell's `<main>` rather than sent standalone.

---

## Out of Scope for This Test Plan

- Any new visual-regression baseline/snapshot tooling — the existing computed-style-assertion pattern (`csd-s2`) is sufficient and already proven in this codebase.
- Sidebar/breadcrumb nav-parity testing — out of scope per the story itself.

---

## Test Gaps and Risks

None identified.
