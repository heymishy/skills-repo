## Story: Ideas backlog — workspace/ideas.json and /api/ideas CRUD

**Epic reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md (pmf-epic-1)
**Discovery reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md
**Benefit-metric reference:** artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md

> **Process note:** This story was implemented in commit `7c42380` before formal artefacts
> were written. Artefacts are created retroactively. Implementation is retained.

## User Story

As a **platform operator**,
I want to capture feature ideas in a lightweight backlog before they are ready for a formal discovery session,
So that ideas surfaced in conversation are not lost before they can be turned into discovery artefacts (M2).

## Benefit Linkage

**Metric moved:** M2 — Idea capture rate
**How:** Ideas that would previously be lost in conversation history are captured in `workspace/ideas.json` via the quick-capture form in the Ideas lane, and can be promoted directly to Discovery via the "Start Discovery →" link.

## Architecture Constraints

- Storage: `workspace/ideas.json` — local file, committed to repo, JSON array. No external service.
- Three API endpoints auth-gated via `authGuard`: `GET /api/ideas`, `POST /api/ideas`, `DELETE /api/ideas/:id`.
- Ideas stored as `{ id: 'idea-<timestamp>', title: string (≤120 chars), notes: string (≤500 chars), createdAt: ISO string }`.
- All rendered content HTML-escaped via `escHtml`.
- No new npm dependencies. Handlers in `src/web-ui/routes/features.js`.
- ADR-011 artefact-first rule: process exception (see note above).

## Dependencies

- **Upstream:** pmf.1 (Kanban board) — Ideas column rendering is part of `kanban-view.js`; pmf.1 and pmf.2 were implemented together.
- **Downstream:** pmf.3 — the "Start from an idea" option in the orientation wizard reads from `workspace/ideas.json`.

## Acceptance Criteria

**AC1:** Given an authenticated user sends `POST /api/ideas` with body `{ "title": "My idea" }`, when the request is processed, then a new idea object is persisted to `workspace/ideas.json` with a unique `id` (prefix `idea-`), the provided `title`, empty `notes`, and an ISO `createdAt` timestamp; HTTP 201 is returned with the created idea.

**AC2:** Given ideas exist in `workspace/ideas.json`, when an authenticated user sends `GET /api/ideas`, then HTTP 200 is returned with `{ "ideas": [...] }` containing all stored ideas.

**AC3:** Given an idea exists with a known `id`, when an authenticated user sends `DELETE /api/ideas/<id>`, then the idea is removed from `workspace/ideas.json` and HTTP 204 is returned.

**AC4:** Given ideas in `workspace/ideas.json`, when the Kanban board renders, then the Ideas lane shows each idea as a dashed card with its title, age since `createdAt`, a delete button (✕), and a "Start Discovery →" link pointing to `/skills/discovery/sessions?idea=<id>`.

**AC5:** Given the Ideas lane, when the quick-capture form is submitted with a title, then a `POST /api/ideas` request is made and — on success — the page reloads showing the new idea card.

**AC6:** Given a title containing `<script>alert(1)</script>`, when the idea is stored and the board renders, then the title is HTML-escaped (`&lt;script&gt;`) and no script injection occurs.

**AC7:** Given a `POST /api/ideas` request with a missing or empty `title`, when the request is processed, then HTTP 400 is returned with `{ "error": "title is required" }` and no idea is written to `workspace/ideas.json`.

## Out of Scope

- Multi-line notes editing via the board UI — capture title only; use Discovery for elaboration
- Syncing ideas to external tools (Linear, Jira, GitHub Issues)
- Idea ordering / prioritisation on the board
- Team / assignee fields

## NFRs

- **Security:** Idea title and notes HTML-escaped before DOM injection. `handleDeleteIdea` matches by id string only — no path traversal risk.
- **Data integrity:** Concurrent write race is a known accepted risk for the current single-operator deployment.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
