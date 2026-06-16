## Story: Kanban board view at /features?view=board

**Epic reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md (pmf-epic-1)
**Discovery reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md
**Benefit-metric reference:** artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md

> **Process note:** This story was implemented in commit `7c42380` before formal artefacts
> were written. Artefacts are created retroactively. Implementation is retained.

## User Story

As a **platform operator**,
I want to view all in-flight features arranged in a Kanban board at `/features?view=board`,
So that I can see WIP distribution across pipeline stages at a glance and identify pile-ups before they embed (M1).

## Benefit Linkage

**Metric moved:** M1 — WIP visibility
**How:** The board makes stage distribution immediately legible — the operator no longer needs to scan a flat table to detect that multiple features are stuck in the same stage.

## Architecture Constraints

- Render-only: no pipeline-state.json writes. The board is read-only — stage transitions must go through `skills advance` / CDG.4 gate-confirm, not drag-and-drop.
- No new npm dependencies. CSS flex layout only.
- All rendered content HTML-escaped via `escHtml` from `src/web-ui/utils/html-shell.js`.
- Implemented as `src/web-ui/views/kanban-view.js` exporting `renderKanban({features, ideas})`. Route integration in `src/web-ui/routes/features.js` `handleGetFeatures` via `?view=board` branch.
- ADR-011 artefact-first rule: this story artefact is created alongside the implementation (process exception noted above).

## Dependencies

- **Upstream:** pmf.2 (Ideas backlog) — the Ideas column requires `workspace/ideas.json` and the ideas API to exist. pmf.1 and pmf.2 were implemented together.
- **Downstream:** pmf.3 reuses the feature card component from this story for the feature picker in Step 2.

## Acceptance Criteria

**AC1:** Given a user visits `/features?view=board`, when the page loads, then a Kanban board is rendered containing exactly six labelled columns: Ideas, Discovery, Definition, In Review, In Delivery, Done.

**AC2:** Given features registered in `pipeline-state.json`, when the board renders, then each feature card appears in the column corresponding to its `stage` field, displaying a health-dot in the correct colour (green/amber/red), the feature title, slug in monospace, and age-in-stage derived from `updated`/`lastUpdated`.

**AC3:** Given the In Review column contains more than 4 features, when the board renders, then the column header displays a WIP limit badge with red styling and shows the count vs. limit (e.g. "5/4").

**AC4:** Given a user is on the Features page, when they view the page header, then they see List and Board toggle links; the active view's toggle link carries the `kb-toggle-btn--active` class.

**AC5:** Given any feature title or slug containing HTML special characters (e.g. `<script>`, `"`), when the board renders, then all content is HTML-escaped and no script injection is possible.

## Out of Scope

- Drag-and-drop stage transitions — CDG.4 enforcement; must use `skills advance`
- Mobile / responsive layout
- Sorting, filtering, or grouping cards within a lane
- Inline stage editing from the board

## NFRs

- **Security:** All card content HTML-escaped via `escHtml` — no XSS via crafted slugs or titles
- **Performance:** No perceptible regression from `/features` list render baseline

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
