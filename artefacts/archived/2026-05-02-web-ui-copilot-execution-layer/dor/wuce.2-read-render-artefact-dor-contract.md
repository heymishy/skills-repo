# Contract Proposal: Read and render artefact from GitHub repository

**Story:** wuce.2
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /artefact` — accepts `?repo=&path=` query params, fetches markdown from GitHub Contents API, renders as sanitised HTML
- Artefact-fetching adapter module: `src/adapters/artefact-fetcher.js` — `fetchArtefact(repoPath, path, token)` — no inline GitHub API calls in route handler
- Markdown-to-HTML renderer with server-side sanitisation (DOMPurify server-side or equivalent)
- Metadata bar rendering: `Status`, `Approved by`, `Created` fields extracted from artefact front matter or heading block
- Markdown table → HTML table conversion
- Error states: non-existent feature returns "not found" message; rate-limit/network error returns human-readable message

## Components NOT built by this story

- Sign-off UI or write operations (wuce.3)
- Action queue (wuce.5)
- Feature navigation (wuce.6)
- Programme status view (wuce.7)
- Annotation overlay (wuce.8)
- Any edit capability — read-only

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Fetch + render via GitHub Contents API | `GET /artefact fetches from adapter not inline API`, `rendered HTML contains artefact headings`, `adapter called with correct repo and path` |
| AC2 | Markdown table → HTML table | `markdown table in source → <table> in rendered output`, `no raw markdown pipe chars in browser-rendered output` |
| AC3 | Non-existent feature → "not found" | `404 from GitHub Contents API → "not found" page`, `no stack trace in response` |
| AC4 | Rate-limit/network error → human-readable | `rate-limit 429 from GitHub → user-friendly error message`, `network timeout → human-readable error` |
| AC5 | Metadata bar with Status/Approved by/Created | `metadata bar renders Status field`, `metadata bar renders Approved by`, `metadata bar renders Created date` |

## Assumptions

- The authenticated user's GitHub OAuth token (from wuce.1) is available in the session for the artefact-fetching adapter
- Sanitisation library is installed as a server-side dependency (not a browser CDN import)
- The `repo` and `path` query parameters identify the target artefact; both are validated server-side before the adapter is called

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/artefact.js` | Create | Route handler for artefact fetch + render |
| `src/adapters/artefact-fetcher.js` | Create | GitHub Contents API adapter |
| `src/utils/markdown-renderer.js` | Create | Markdown → sanitised HTML converter |
| `src/app.js` | Extend | Mount artefact routes |
| `tests/artefact.test.js` | Create | 18 Jest tests for wuce.2 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
