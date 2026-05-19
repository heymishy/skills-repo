## Story: Session commit and result view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e6-skill-launcher-html-form.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **BA/facilitator or business lead**,
I want to see the completed artefact content after my skill session is finished and confirm I want to commit it to the repository, then see a clear success confirmation with a link to the artefact view,
So that I know the artefact has been saved under my identity and can navigate directly to it or share a link — without needing a git client or engineer to confirm the write succeeded.

## Benefit Linkage

**Metric moved:** P3 — Non-technical attribution rate
**How:** The commit step in this story writes the artefact to the repository attributed to the authenticated user's GitHub identity — directly adding a non-engineer named contributor to the artefact, advancing the ≥90% attribution target for the P3 metric.

## Architecture Constraints

- ADR-012: the commit preview page `GET /skills/:name/sessions/:id/commit-preview` fetches session state via `handleGetSessionState()` from `src/web-ui/routes/skills.js` (wuce.16); the commit form POSTs to `POST /api/skills/:name/sessions/:id/commit` (already implemented in wuce.15) — no inline API calls
- ADR-009: HTML handlers `handleGetCommitPreviewHtml()` and `handlePostCommitHtml()` are added in `src/web-ui/routes/skills.js`; the POST commit handler wraps `handleCommitArtefact()` and responds with a server-side redirect (303 See Other) to the result page `GET /skills/:name/sessions/:id/result` on success
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps all pages in this story
- `escHtml()` must be applied to all artefact content and session state values before HTML injection — artefact content is user-generated text that must be treated as untrusted at the rendering layer
- The commit is a one-time action: once committed, a second POST to `POST /api/skills/:name/sessions/:id/commit` on the same session must return a 409 Conflict and the HTML handler must render an informative page rather than a double-write
- The result page `GET /skills/:name/sessions/:id/result` must show: the committed artefact's path in the repository, a link to view it via `/artefact/:featureSlug/:type` (wuce.2), and a link back to `/features` to continue working

## Dependencies

- **Upstream:** wuce.15 (artefact write-back API), wuce.16 (session state API), wuce.18 (HTML shell), wuce.24 (guided question form — user arrives here when session is complete)
- **Downstream:** links to wuce.2 (artefact view) and wuce.19 (feature list) from the result page

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `GET /skills/:name/sessions/:id/commit-preview`, When the page loads and the session is in a complete (all questions answered) state, Then the `Content-Type` is `text/html; charset=utf-8`, the page is produced by `renderShell()`, and the `<main>` element shows: a preview of the completed artefact content (escaped via `escHtml()`), a `<form method="POST" action="/api/skills/:name/sessions/:id/commit">`, and a `<button type="submit">Commit artefact</button>`.

**AC2:** Given a user submits the commit form, When `POST /api/skills/:name/sessions/:id/commit` returns 2xx, Then the browser is redirected with HTTP 303 to `GET /skills/:name/sessions/:id/result`.

**AC3:** Given the result page `GET /skills/:name/sessions/:id/result` is loaded, When the page renders, Then it shows: a success message, the path of the committed artefact, a link to view the artefact via the existing artefact view route (`/artefact/:slug/:type`), and a link back to `/features`.

**AC4:** Given a user attempts to commit a session a second time (e.g. by pressing back and resubmitting), When `POST /api/skills/:name/sessions/:id/commit` returns 409 Conflict, Then the user sees an HTML page via `renderShell()` explaining the artefact has already been committed, with a link to view it — the browser does not display a raw JSON error body.

**AC5:** Given the artefact content preview contains HTML-special characters (e.g. code blocks with `<`, `>`), When the commit preview page renders, Then those characters are escaped by `escHtml()` and do not form tags in the output.

**AC6:** Given an unauthenticated request to `GET /skills/:name/sessions/:id/commit-preview`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github`.

**AC7:** Given `GET /skills/:name/sessions/:id/commit-preview` is called with an unknown session ID, When the response is returned, Then the status code is 404 and the response is an HTML page via `renderShell()` with a human-readable not-found message.

## Out of Scope

- Editing the artefact content before committing from the browser — the preview is read-only; artefact editing is a post-MVP feature requiring a full Markdown editor
- Committing to a specific branch or pull request from the UI — the commit target is determined by the server-side write-back handler (wuce.15); branch targeting is not exposed in Phase 1
- Sharing a draft artefact before commit — the preview page is only accessible to the session owner (authenticated user who started the session)
- Scheduling a commit for a later time — immediate commit on form submission only
- Any change to the JSON contract of `POST /api/skills/:name/sessions/:id/commit` — backward-compatibility is a hard constraint

## NFRs

- **Security:** Artefact content is user-generated text — all values must be escaped with `escHtml()` before HTML injection; the commit form does not accept user-controlled inputs beyond the session ID in the URL path; the session ID is validated server-side before processing the commit.
- **Performance:** Commit preview page requires one API call (session state); result page is static (no additional API calls). Commit round-trip latency is dominated by the GitHub API write-back (wuce.15); no additional server-side overhead added by this story.
- **Accessibility:** The commit form has a clearly labelled `<button type="submit">` with descriptive text; the artefact preview uses a `<pre>` block with `role="region"` and an `aria-label`; all links on the result page have descriptive text.
- **Audit:** The commit action is already logged by `handleCommitArtefact()` (wuce.15) with userId, sessionId, artefact path, and timestamp; the result page GET access is logged (userId, route, sessionId, timestamp).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
