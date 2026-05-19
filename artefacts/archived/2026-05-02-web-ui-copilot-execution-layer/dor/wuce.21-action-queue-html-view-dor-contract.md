# Contract: Action queue HTML view

**Story:** wuce.21
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- `handleGetActionsHtml()` — new named export added to `src/web-ui/routes/dashboard.js`
  - Handles `GET /actions` → HTML response via `renderShell` wrapping action queue HTML
- `renderActionQueue(actions)` — export from `adapters/action-queue.js` (add export if not already exported; do not rewrite)
- Action list HTML: items rendered with title, feature slug, action type, and link
- Zero actions → empty-state message, no empty `<ul>`
- Nav "Actions" link in `renderShell` updated to point to `/actions` (not `/api/actions`)
- Audit log: `{ userId, route: '/actions', timestamp }`

## Components NOT built by this story

- `GET /api/actions` JSON endpoint — MUST remain completely unchanged
- `getPendingActions` adapter function — already exists; not rewritten
- Any change to `src/web-ui/utils/html-shell.js` beyond the nav link href fix
- Dismiss, assign, or create action capabilities
- Notification emails or push notifications

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | GET /actions returns 200 HTML with renderShell wrapper and action entries | T1: 200 status, T2: Content-Type text/html, T3: <html> present, T4: action title in body, T5: action feature slug in body, T15: action type visible |
| AC2 | Each action shows title, feature, type, link | T6: title, feature, type, link all rendered |
| AC3 | Zero actions → empty state, no empty list | T7: no actions → message, T8: no empty <ul>, T16: empty-state message text |
| AC4 | GET /api/actions returns JSON unchanged (regression) | T9: JSON shape unchanged, T10: Content-Type application/json |
| AC5 | Unauthenticated → 302 on GET /actions | T11: no session → 302 |
| AC6 | renderShell nav "Actions" link points to /actions | T12: nav "Actions" href=/actions |

## Assumptions

- `getPendingActions(userIdentity, token)` already exists in `adapters/action-queue.js`
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- ADR-012 is satisfied by calling the existing adapter — no inline fetch added

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/dashboard.js` | Extend | Add handleGetActionsHtml() named export |
| `src/web-ui/adapters/action-queue.js` | Extend | Export renderActionQueue() if not already exported |
| `src/web-ui/utils/html-shell.js` | Extend | Update nav "Actions" href from /api/actions to /actions |
| `tests/check-wuce21-action-queue-html.js` | Create | 16 tests |

## Out of scope — files that MUST NOT be touched

- `GET /api/actions` handler logic — no behaviour changes
- Any other route handler in `src/web-ui/routes/`
- Any test file other than `tests/check-wuce21-action-queue-html.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
