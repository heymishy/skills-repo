## Story: Guided question form

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e6-skill-launcher-html-form.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **BA/facilitator or business lead**,
I want to be presented with each skill question one at a time in a browser form and submit my answer to advance to the next question,
So that I can complete an entire guided skill session — answering questions at my own pace — without a terminal, without understanding JSON API semantics, and without losing my progress if I take a pause between questions.

## Benefit Linkage

**Metric moved:** P2 — Unassisted /discovery completion rate
**How:** The guided question form is the core delivery mechanism for P2 — it is the step-by-step browser interaction that allows a non-technical user to drive a full `/discovery` (or other skill) session to completion; without this form, a session started in wuce.23 cannot proceed past the first question, and P2 remains 0%.

## Architecture Constraints

- ADR-012: the question display route `GET /skills/:name/sessions/:id/next` calls `handleGetSessionState()` from `src/web-ui/routes/skills.js` (wuce.14/16) for current session state — that handler is reused; the HTML route renders its JSON response as an HTML form
- ADR-009: the HTML question view handler `handleGetQuestionHtml()` is added in `src/web-ui/routes/skills.js`; the answer submission form POSTs to `POST /api/skills/:name/sessions/:id/answer` (already implemented in wuce.15); that handler returns JSON and the HTML route wraps it with a server-side redirect (303 See Other) back to `GET /skills/:name/sessions/:id/next` after a successful answer
- The question form is a plain `<form method="POST">` — no JavaScript required for the baseline flow; the form has a single `<textarea name="answer">` for the user's answer and a `<button type="submit">` labelled "Submit answer"
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps all pages in this story
- `escHtml()` must be applied to the question text and any session state values (artefact preview, previous answers) before HTML injection — question text comes from the skill and must be treated as untrusted input at the rendering layer
- Session ID comes from the URL path — it must be validated as a known session ID before serving the question page; return 404 (rendered via `renderShell()`) for unknown session IDs
- When the session reaches a terminal state (no further questions), the server must redirect to `GET /skills/:name/sessions/:id/commit-preview` (wuce.25) rather than rendering another empty question form

## Dependencies

- **Upstream:** wuce.13 (session management API), wuce.14 (artefact preview API), wuce.15 (answer submission API), wuce.16 (session persistence), wuce.18 (HTML shell), wuce.23 (session start — user arrives here via redirect from wuce.23)
- **Downstream:** wuce.25 (commit and result view — user arrives there when session is complete)

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `GET /skills/:name/sessions/:id/next`, When the page loads and the session has a pending question, Then the `Content-Type` is `text/html; charset=utf-8`, the page is produced by `renderShell()`, and the `<main>` element contains: the current question text (escaped), a `<form method="POST" action="/api/skills/:name/sessions/:id/answer">`, a `<textarea name="answer">` for the user's response, and a `<button type="submit">Submit answer</button>`.

**AC2:** Given a user submits an answer via the form, When `POST /api/skills/:name/sessions/:id/answer` returns a 2xx success, Then the browser is redirected with HTTP 303 to `GET /skills/:name/sessions/:id/next` (the next question in the sequence).

**AC3:** Given `POST /api/skills/:name/sessions/:id/answer` returns a non-2xx status, When the redirect would be attempted, Then the user sees an HTML error page via `renderShell()` with a human-readable message and a link to return to the current question — the browser does not display a raw JSON body.

**AC4:** Given a user navigates to `GET /skills/:name/sessions/:id/next` and the session has no further questions (terminal state), When the page would render, Then the server redirects with HTTP 303 to `GET /skills/:name/sessions/:id/commit-preview` (wuce.25) rather than rendering an empty question form.

**AC5:** Given a user navigates to `GET /skills/:name/sessions/:id/next` where `:id` is not a known session ID, When the response is returned, Then the status code is 404 and the response body is an HTML page via `renderShell()` with a message indicating the session was not found.

**AC6:** Given the question text returned by the session state API contains HTML-special characters, When the question page renders, Then those characters are escaped by `escHtml()` and do not form tags in the output.

**AC7:** Given an unauthenticated request to `GET /skills/:name/sessions/:id/next`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github`.

## Out of Scope

- Back-navigation to a previous question within the same session — the underlying question-loop API is linear; backtracking is deferred
- JavaScript-enhanced progressive enhancement (e.g. auto-save answer on blur, live character count) — plain form only in this story
- Displaying the partial artefact build alongside the question in real time — the artefact preview endpoint (wuce.14) exists but displaying it incrementally is a separate progressive enhancement; this story renders the question only
- Multi-question forms (presenting several questions on one page) — one question per page matches the underlying API's step-by-step contract
- Any change to the JSON API contract of `POST /api/skills/:name/sessions/:id/answer` — backward-compatibility is a hard constraint

## NFRs

- **Security:** Question text and session state values from the API response must be escaped with `escHtml()` before HTML injection; session ID from the URL path must be validated against known sessions — never reflected raw into HTML attributes or hidden inputs.
- **Performance:** Each question page requires one API call to fetch current session state; no additional round-trips beyond what the JSON path already makes.
- **Accessibility:** The `<textarea>` has an associated `<label>` element referencing the question text; the submit button is a `<button type="submit">` with descriptive text; form fields are keyboard-navigable in logical order.
- **Audit:** Each answer submission is already logged by the existing `POST /api/skills/:name/sessions/:id/answer` handler (wuce.15); the GET question view access is logged (userId, sessionId, route, timestamp).

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
