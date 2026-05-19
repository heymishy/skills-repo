# Contract Proposal: Incremental artefact preview as skill session progresses

**Story:** wuce.14
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /skills/:sessionId/preview` — returns current partial artefact content for a session as sanitised HTML
- Preview rendering: markdown → HTML via the same renderer as wuce.2; tables → `<table>`, code blocks → `<pre><code>`
- Preview sanitisation: raw markdown from `executeSkill` output sanitised before returning as HTML; reuses `src/utils/html-sanitiser.js` from wuce.2 (no new sanitisation path)
- "Commit artefact" button activation: only enabled when session state indicates `executeSkill` has completed (not during preview polling)
- Frontend polling: client polls `GET /skills/:sessionId/preview` at ≤2s interval while session is in-progress; stops polling when session complete
- `aria-live="polite"` attribute on preview panel element — required for accessibility

## Components NOT built by this story

- WebSocket or Server-Sent Events for streaming preview updates — v1 is polling only
- Inline editing of preview content — read-only
- Diff view comparing current vs previous preview state
- Non-markdown preview formats (HTML, PDF, DOCX)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Preview panel alongside form shows partial artefact after each answer | `GET /preview returns partial artefact content`, `preview updates after each answer submitted`, `preview panel rendered alongside question form` |
| AC2 | Preview updated without full page reload via polling | `client polls preview endpoint while session in-progress`, `polling stops on session completion`, `no full page reload between updates` |
| AC3 | Markdown tables → HTML tables, code blocks → monospace | `markdown table in output → rendered as HTML table`, `fenced code block → rendered as pre/code element` |
| AC4 | Preview content sanitised before browser | `script tag in preview content → stripped`, `sanitiser applied before sending HTML response`, `raw markdown not rendered as innerHTML` |
| AC5 | Final artefact generated → "Commit artefact" button active | `session state = complete → commit button active`, `session state = in-progress → commit button disabled`, `button activation uses session state not preview length` |

## Assumptions

- Session state (in-progress vs complete) is managed by the session manager (wuce.10) and accessible to this route handler
- The `executeSkill` module (wuce.9) writes partial output to a session-scoped location readable by the preview endpoint
- Polling interval is client-side; server-side preview endpoint is stateless

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/preview.js` | Create | Preview polling route handler |
| `src/app.js` | Extend | Mount preview route |
| `tests/artefact-preview.test.js` | Create | 18 Jest tests for wuce.14 |
| `tests/fixtures/cli/copilot-cli-success.jsonl` | Reuse | Already created by wuce.9 |
| `src/utils/html-sanitiser.js` | Reuse | Already created by wuce.2 |

## Contract review

**APPROVED** — all components are within story scope, preview sanitisation reuses wuce.2 path (no duplication), polling mechanism confirmed (no WebSocket), aria-live requirement explicit, no scope boundary violations identified.
