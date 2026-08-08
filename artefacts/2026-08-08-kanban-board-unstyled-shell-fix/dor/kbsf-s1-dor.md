## Definition of Ready: kbsf-s1 — Wrap kanban board HTML in the shared page shell

**Story:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
**Review:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/review/kbsf-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/test-plans/kbsf-s1-test-plan.md
**Date:** 2026-08-08

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/products.js` — `handleGetProductKanban`, `handleGetOrgKanban`, the `?view=board` branch of `handleGetDashboard`, and `_sendKanbanHtml` (or its call sites) to wrap `renderKanban()`'s output via `_htmlShell.renderShell()` before sending.
- `tests/check-kbsf-s1-*.js` (new) — unit tests per the test plan.
- `tests/e2e/kbsf-s1-*.spec.js` (new, if the visual E2E check is added) — per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/views/kanban-view.js` — `renderKanban()`'s markup and CSS are correct as-is; not touched.
- `src/web-ui/utils/html-shell.js` — `renderShell()` is consumed, not modified.
- Any nav/sidebar/breadcrumb wiring beyond what's minimally needed to call `renderShell()` (e.g. `user: { login }`, `active`, `title`) — full nav-parity is out of scope per the story.

### Human oversight

**Low** — single-file fix, well-understood root cause (confirmed via direct source inspection, not speculation), matches an existing proven pattern used elsewhere in the same file, complexity 1, no upstream/downstream dependency. No sign-off required beyond this DoR artefact.

### Coding Agent Instructions

1. In `src/web-ui/routes/products.js`, at each of the three call sites currently calling `_sendKanbanHtml(res, html)` with a raw `renderKanban()` fragment, instead wrap `html` via `_htmlShell.renderShell({ title: 'Kanban board', bodyContent: html, user: { login: req.session && req.session.login }, active: 'dashboard' })` before sending.
2. Confirm `req.session.login` is available at each call site (it is, per direct inspection — `req.session.tenantId` and `req.session.login` are already used elsewhere in the same handlers).
3. Do not modify `renderKanban()` or `renderShell()` themselves.
4. Write the 3 new unit tests per the test plan, asserting the response body contains `<!doctype html>` and the `:root {` token block.
5. Re-run the full existing kanban test suite (unit + E2E) to confirm AC4 — zero regressions.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (AC1's visual check uses the same computed-style-assertion pattern already proven by `csd-s2` — no RISK-ACCEPT needed, it's directly automatable)

**PROCEED: Yes**
