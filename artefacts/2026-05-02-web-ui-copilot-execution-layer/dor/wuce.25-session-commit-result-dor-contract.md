# Contract: Session commit result

**Story:** wuce.25
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- Added to `src/web-ui/routes/skills.js`:
  - `handleGetCommitPreviewHtml(req, res)` — named export; handles `GET /skills/:name/sessions/:id/commit-preview`
  - `handlePostCommitHtml(req, res)` — named export; handles `POST /api/skills/:name/sessions/:id/commit` → 303 redirect to result page
  - `handleGetResultHtml(req, res)` — named export; handles `GET /skills/:name/sessions/:id/result`
- Commit-preview page HTML:
  - Artefact content in `<pre role="region" aria-label="Artefact preview">` (WCAG — required)
  - Commit form: `<form method="POST" action="/api/skills/:name/sessions/:id/commit">` with submit button
  - Plain HTML — NO JavaScript
- Result page: success message, artefact path, link to `/artefact/:slug/:type`, link to `/features`
- Double-commit (409): 409 HTML page via `renderShell` with informative message — not raw JSON
- Server-side session ID validation before any adapter call — unknown ID → 404 HTML page
- Audit log on POST commit: `{ userId, route: '/api/skills/:name/sessions/:id/commit', skillName, sessionId, artefactPath, timestamp }`

## Components NOT built by this story

- `handleGetQuestionHtml()` or POST answer handler (wuce.24 scope — do not modify)
- `handleGetSkillsHtml()` (wuce.23 scope — do not modify)
- Artefact editing before commit
- Diff view or commit history
- Multi-artefact session support
- Rollback or undo capability
- Any change to `src/web-ui/utils/html-shell.js`

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | GET commit-preview → 200 HTML with artefact preview in <pre> | T1: 200 status, T2: Content-Type text/html, T3: artefact content in <pre> |
| AC2 | Commit form present with correct action and submit button | T4: <form method="POST"> present, T5: action=/api/…/commit, submit button |
| AC3 | <pre> has role="region" and aria-label="Artefact preview" | T6: role attribute, T7: aria-label attribute, T8: escHtml applied to content, T9: no XSS in preview, T10: HTML entities visible not rendered |
| AC4 | Double-commit (409) → 409 HTML page via renderShell | T11: POST twice → 409, response is HTML not JSON |
| AC5 | POST commit → 303 redirect to result page | T15: 303 status, T16: Location header = /skills/:name/sessions/:id/result |
| AC6 | Result page shows success message, artefact path, links | T17: success message visible, T18: artefact path visible, links to /artefact and /features |
| AC7 | Unknown session ID → 404 HTML page | T12: unknown session → 404, T13: response is HTML, T14: Content-Type text/html |

## Assumptions

- `getCommitPreview(skillName, sessionId, token)`, `commitSession(skillName, sessionId, token)`, and `getCommitResult(skillName, sessionId, token)` adapters are created or extended in this story
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- 409 is returned by `commitSession()` adapter when session already committed — handler maps this to 409 HTML response

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/skills.js` | Extend | Add handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml |
| `src/web-ui/adapters/skills.js` | Extend | Add getCommitPreview(), commitSession(), getCommitResult() |
| `src/web-ui/server.js` | Extend | Mount GET /skills/:name/sessions/:id/commit-preview, POST /api/skills/:name/sessions/:id/commit, GET /skills/:name/sessions/:id/result |
| `tests/check-wuce25-session-commit-result.js` | Create | 20 tests |

## Out of scope — files that MUST NOT be touched

- `handleGetQuestionHtml()` and answer POST handler (wuce.24 scope)
- `handleGetSkillsHtml()` (wuce.23 scope)
- `src/web-ui/utils/html-shell.js`
- Any test file other than `tests/check-wuce25-session-commit-result.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
