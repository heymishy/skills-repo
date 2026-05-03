# Contract: Status board HTML view

**Story:** wuce.22
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- Content-type negotiation added to `handleGetStatus()` in `src/web-ui/routes/status.js`
  - `Accept: text/html` → `renderShell` wrapping status board HTML
  - `Accept: application/json` or absent → JSON response unchanged
- `renderStatusBoard(statusData)` — export from `utils/status-board.js` (add export if not already exported; do not rewrite)
- Status board HTML: feature health indicators with both a CSS colour class AND a text label ("Blocked", "At risk", "On track", "In progress")
- Audit log: `{ userId, route: '/status', timestamp }`

## Components NOT built by this story

- `GET /status/export` — MUST remain completely unchanged (regression guard)
- Any change to the JSON response shape of `GET /status`
- Interactive filtering, sorting, or trend charts
- Any change to `src/web-ui/utils/html-shell.js`

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | GET /status with Accept: text/html → 200 HTML with renderShell wrapper | T1: 200 status, T2: Content-Type text/html, T3: <html> present, T4: feature slug in body, T14: status text in body |
| AC2 | Each feature row shows slug, phase, health status | T7: slug visible, T8: phase visible |
| AC3 | Health indicators have both colour class AND text label | T5: colour class present, T6: text label ("Blocked"|"At risk"|"On track"|"In progress") present |
| AC4 | Accept application/json → JSON unchanged | T9: JSON shape unchanged, T10: Content-Type application/json |
| AC5 | Unauthenticated → 302 | T11: no session → 302 |
| AC6 | GET /status/export unchanged (regression) | T12: /status/export returns same response, T13: no 404 or 500 |

## Assumptions

- `renderStatusBoard(statusData)` exists in `utils/status-board.js` — export is added, function not rewritten
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- Text label values map directly from health field: `blocked` → "Blocked", `at-risk` → "At risk", `on-track` → "On track", `in-progress` → "In progress"

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/status.js` | Extend | Add content-type negotiation to handleGetStatus() |
| `src/web-ui/utils/status-board.js` | Extend | Export renderStatusBoard() if not already exported |
| `tests/check-wuce22-status-board-html.js` | Create | 16 tests |

## Out of scope — files that MUST NOT be touched

- `GET /status/export` handler — zero changes
- `src/web-ui/utils/html-shell.js`
- Any other route handler in `src/web-ui/routes/`
- Any test file other than `tests/check-wuce22-status-board-html.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
