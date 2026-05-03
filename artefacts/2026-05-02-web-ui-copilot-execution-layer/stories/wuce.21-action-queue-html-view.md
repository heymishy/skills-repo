## Story: Action queue HTML view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e5-html-shell-core-views.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **business lead or BA/facilitator**,
I want to navigate to `/actions` and see my personalised list of pending sign-offs and review requests as an HTML page,
So that I know exactly what pipeline actions are waiting for me and can click directly through to the relevant artefact — without parsing JSON or waiting for an engineer to tell me what needs attention.

## Benefit Linkage

**Metric moved:** P1 — Non-engineer self-service sign-off rate
**How:** The action queue HTML view is the primary discovery mechanism for pending sign-off items; stakeholders who can see "you have 3 pending sign-offs" in a browser and click directly to each are far more likely to act independently, directly increasing the proportion of eligible sign-offs completed via the web UI toward the ≥80% target.

## Architecture Constraints

- ADR-009: the HTML view route for `/actions` is a separate route handler `handleGetActionsHtml()` in `src/web-ui/routes/dashboard.js` — the existing `handleGetActions()` JSON handler must remain unchanged; the two share the underlying data call but return different content types
- ADR-012: `handleGetActionsHtml()` must call the same data adapter as `handleGetActions()` — `getPendingActions(userIdentity, token)` from `src/web-ui/adapters/action-queue.js` — no inline API calls
- `renderActionQueue(actions)` already exists in `src/web-ui/adapters/action-queue.js`; call it for the HTML body — do not duplicate its rendering logic; if the function is not exported, export it as part of this story's scope
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps the rendered action queue
- `escHtml()` from `src/web-ui/utils/html-shell.js` must be applied to all action metadata before HTML injection (feature slugs, action titles, user-provided labels)
- The new route `GET /actions` must be added to `server.js` with `authGuard` applied; `GET /api/actions` JSON endpoint must remain unchanged

## Dependencies

- **Upstream:** wuce.5 (action queue JSON endpoint and data model), wuce.18 (HTML shell)
- **Downstream:** links from this view point to `/artefact/:slug/:type` (wuce.2) and the sign-off route (wuce.3)

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `GET /actions`, When the page loads, Then the `Content-Type` is `text/html; charset=utf-8`, the response is a complete HTML page produced by `renderShell()`, and the page contains a list of the user's pending actions — each showing: a human-readable action title, the feature it belongs to (escaped), the action type (e.g. "Sign-off required", "Review requested"), and a direct link to the relevant artefact.

**AC2:** Given a user with no pending actions navigates to `GET /actions`, When the page renders, Then the `<main>` area displays an empty-state message (e.g. "No pending actions — you're up to date") and no empty list element is rendered.

**AC3:** Given an existing consumer calls `GET /api/actions` (the JSON endpoint), When the response is returned, Then the response is identical to the pre-wuce.21 behaviour — `Content-Type: application/json`, same array shape, same status code. The addition of `GET /actions` must not affect `GET /api/actions`.

**AC4:** Given an action's title or feature slug contains HTML-special characters, When the HTML page is rendered, Then those values are escaped by `escHtml()` and do not form tags or attributes in the output.

**AC5:** Given an unauthenticated request to `GET /actions`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github`.

**AC6:** Given the dashboard navigation shell (wuce.18) renders its `<nav>`, When a user navigates to `/dashboard`, Then the "Actions" nav link points to `/actions` (not `/api/actions`), confirming the HTML route is correctly wired in the nav.

## Out of Scope

- Completing or dismissing an action from this view — the HTML view is read-only; sign-off action is on the artefact view (wuce.3)
- Filtering or sorting actions by type, feature, or age — post-MVP progressive enhancement
- Real-time push notification of new actions — polling or manual refresh only in Phase 1
- Any change to the `GET /api/actions` JSON response shape — backward-compatibility is a hard constraint
- Email or Slack notification of pending actions — separate phase (WS0.4)

## NFRs

- **Security:** Action titles and feature slugs from external API responses must be escaped with `escHtml()` before HTML injection.
- **Performance:** HTML render path must not introduce an additional round-trip; `renderActionQueue()` is synchronous over the already-fetched actions array.
- **Accessibility:** Action list uses `<ul>` / `<li>` with descriptive link text; each item's link text identifies the action and feature, not just "view".
- **Audit:** Action queue HTML view access is logged (userId, route `/actions`, timestamp) consistent with the audit pattern established in wuce.5.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
