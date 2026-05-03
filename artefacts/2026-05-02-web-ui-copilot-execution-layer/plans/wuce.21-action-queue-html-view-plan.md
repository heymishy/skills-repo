# Implementation Plan: wuce.21 — Action queue HTML view

**Branch:** feature/wuce.21-action-queue-html-view
**Date:** 2026-05-04

---

## Pre-flight observations

- `src/web-ui/utils/html-shell.js` nav "Actions" link already points to `/actions` — NO change needed to html-shell.js
- `src/web-ui/adapters/action-queue.js` already exports `renderActionQueue` — NO new export needed
- `handleGetActions` (JSON, GET /api/actions) returns 401 for unauthenticated (not 302); T16 tests non-200 auth requirement
- Test mock for HTML handler uses `{ title, feature, actionType, artefactPath }` item shape (distinct from wuce.5's `{ featureName, artefactType, artefactUrl, daysPending }` shape)

---

## Task 1 — RED: Create tests/check-wuce21-action-queue-html.js (16 tests, all failing)

**File:** `tests/check-wuce21-action-queue-html.js`

Tests cover:
- T1: GET /actions → 200 + text/html + nav present
- T2: action titles in body
- T3: feature slugs in body
- T4: action types in body
- T5: artefact links with href="/artefact/
- T6: empty queue → empty-state message, no `<ul>`
- T7: GET /api/actions → 200, application/json, valid JSON
- T8: both routes return 200 for authenticated user
- T9: XSS title escaped
- T10: XSS feature escaped
- T11: unauthenticated GET /actions → 302
- T12: GET /dashboard nav "Actions" href="/actions"
- T13: audit log written with { userId, route: '/actions', timestamp }
- T14: descriptive link text (not bare "view")
- T15: ul/li structure in body
- T16: GET /api/actions without auth → non-200

**Expected result:** All 16 FAIL (module loads but handleGetActionsHtml doesn't exist yet)

---

## Task 2 — GREEN: Add handleGetActionsHtml to src/web-ui/routes/dashboard.js

Named export added. Handles:
- Auth check → 302 /auth/github if no session
- Audit log: `{ userId, route: '/actions', timestamp }`
- Call `_getPendingActions(userIdentity, token)`
- Render: if items empty → empty-state `<p>`, else `<ul>/<li>` with title, feature, actionType, link
- Apply `escHtml()` to all title, feature, actionType values
- Links: `href="/artefact/${item.artefactPath}"`
- Wrap with `renderShell({ title: 'Actions', bodyContent, user: { login } })`
- Return 200 text/html; charset=utf-8

---

## Task 3 — Wire in src/web-ui/server.js

Add `handleGetActionsHtml` to the import from `./routes/dashboard`.
Add route: `else if (pathname === '/actions' && req.method === 'GET') { authGuard(req, res, async () => { await handleGetActionsHtml(req, res); }); }`

Note: authGuard handles the 302 redirect before reaching the handler, so unauthenticated → 302 is satisfied at the authGuard level (T11). The handler also has its own auth check for belt-and-suspenders.

---

## Task 4 — Extend package.json test chain

Add `&& node tests/check-wuce21-action-queue-html.js` to the test script.

---

## File touchpoints summary

| File | Action |
|------|--------|
| `tests/check-wuce21-action-queue-html.js` | CREATE |
| `src/web-ui/routes/dashboard.js` | EXTEND (add handleGetActionsHtml export) |
| `src/web-ui/server.js` | EXTEND (wire GET /actions route) |
| `package.json` | EXTEND (add to test chain) |
| `src/web-ui/utils/html-shell.js` | NO CHANGE (already /actions) |
| `src/web-ui/adapters/action-queue.js` | NO CHANGE (renderActionQueue already exported) |
