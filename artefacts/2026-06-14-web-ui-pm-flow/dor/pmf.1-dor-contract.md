# DoR Contract: Kanban board view

**Story:** pmf.1 — Kanban board view at /features?view=board
**Feature:** 2026-06-14-web-ui-pm-flow
**Approved:** 2026-06-15 (retroactive)

---

## What was built

`src/web-ui/views/kanban-view.js` — server-side renderer for six-lane Kanban board. `renderKanban` returns HTML string with `data-lane` attributes for six lanes (idea, discovery, definition, review, delivery, done). Feature cards show health-dot, title, slug, age. Ideas lane shows quick-capture form and idea cards. View toggle links on /features page. All content XSS-escaped via `escHtml`.

## What was NOT built

- Drag-and-drop between lanes
- WIP limit enforcement blocking new work
- E2E browser tests for CSS colour rendering
- External database or session storage

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T4a–T4f in check-kanban-view.js | Unit |
| AC2 | T5a–T5c in check-kanban-view.js | Unit |
| AC3 | Structural badge check + manual CSS | Unit + Manual |
| AC4 | T8a–T8c in check-kanban-view.js | Unit |
| AC5 | T7a–T7b in check-kanban-view.js | Unit |

## Assumptions

- `escHtml` from `src/web-ui/utils/html-shell.js` is the canonical XSS escape function.
- WIP badge CSS colour is manual-only.

## schemaDepends

`schemaDepends: []` — no upstream story dependencies. No pipeline-state.json schema changes.

## Estimated touch points

`src/web-ui/views/kanban-view.js` (new), `src/web-ui/routes/features.js` (modified), `src/web-ui/server.js` (modified), `workspace/ideas.json` (new), `tests/check-kanban-view.js` (new), `package.json` (modified).
