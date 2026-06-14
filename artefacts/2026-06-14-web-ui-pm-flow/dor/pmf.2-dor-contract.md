# DoR Contract: Ideas backlog CRUD

**Story:** pmf.2 — Ideas backlog — workspace/ideas.json and /api/ideas CRUD
**Feature:** 2026-06-14-web-ui-pm-flow
**Approved:** 2026-06-15 (retroactive)

---

## What was built

Three auth-gated API handlers in `src/web-ui/routes/features.js`: `handleGetIdeas`, `handlePostIdea`, `handleDeleteIdea`. Storage in `workspace/ideas.json` (JSON file). Ideas created with `idea-<timestamp>` id, title (≤120 chars), optional notes (≤500 chars), ISO createdAt. Empty title → HTTP 400. Ideas rendered as dashed cards in the Kanban board Ideas lane. Quick-capture form triggers POST. All content XSS-escaped.

## What was NOT built

- Multi-line notes editing in board UI
- External tool syncing
- Idea ordering or prioritisation
- Integration test suite against live HTTP server (deferred to pmf.2b)

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T10b export check + risk-accepted gap | Unit (export) |
| AC2 | T10a export check + risk-accepted gap | Unit (export) |
| AC3 | T10c export check + risk-accepted gap | Unit (export) |
| AC4 | T6a–T6d in check-kanban-view.js | Unit |
| AC5 | T6b (form rendered) + manual smoke test | Unit + Manual |
| AC6 | T7a–T7b in check-kanban-view.js | Unit |
| AC7 | Risk-accepted gap — deferred to pmf.2b | Accepted |

## Assumptions

- `fs.readFileSync` / `fs.writeFileSync` adequate for single-operator concurrency.
- Direct API CRUD tests deferred to pmf.2b follow-on if defects observed.

## schemaDepends

`schemaDepends: ['pmf.1']` — Ideas lane rendering is part of kanban-view.js (pmf.1). Implemented together in commit 7c42380.

## Estimated touch points

`src/web-ui/routes/features.js` (modified), `src/web-ui/server.js` (modified), `workspace/ideas.json` (new). All changes committed in 7c42380.
