# Implementation Plan: Status board HTML view (wuce.22)

**Branch:** feature/wuce.22-status-board-html-view
**Date:** 2026-05-04

---

## Task 1 — Extend renderStatusBoard in status-board.js

**File:** `src/web-ui/utils/status-board.js`
**Action:** Extend (no rewrite) — renderStatusBoard already exported

Add health indicator support to renderStatusBoard:
- Add `HEALTH_MAP` and `renderHealthSpan(health)` helper
- In the status cell of each row, prepend `renderHealthSpan(f.health)` before the derived indicator
- If `f.blockers` is a non-empty array, render blockers list in the status cell
- These are additive only — features without `health` or `blockers` render identically to before

AC3 text labels:
- `health: 'red'` or `'blocked'` → class `health-blocked` + text "Blocked"
- `health: 'amber'` or `'at-risk'` → class `health-at-risk` + text "At risk"
- `health: 'green'` or `'on-track'` → class `health-on-track` + text "On track"
- `health: 'in-progress'` → class `health-in-progress` + text "In progress"

---

## Task 2 — Extend handleGetStatus in routes/status.js

**File:** `src/web-ui/routes/status.js`
**Action:** Extend — add content-type negotiation

Changes:
1. Import `renderShell` from `../utils/html-shell`
2. Store `require('../utils/status-board')` as module reference (to allow T14 spy)
3. Read `accept` header at the top of the handler
4. Differentiate auth failure response by content-type:
   - text/html + unauthenticated → 302 to `/auth/github`
   - other + unauthenticated → 401 JSON (existing behavior — wuce.7 tests pass)
5. Add `route: '/status'` to audit log (keep `featureCount` for wuce.7 NFR1c)
6. After fetching features, branch by Accept:
   - `text/html` → `renderStatusBoard(features)` + `renderShell` → HTML response
   - otherwise → existing JSON mapping + JSON response

---

## Task 3 — Create test file

**File:** `tests/check-wuce22-status-board-html.js`
**Action:** Create — 16 tests

Test data:
- `FEAT_GREEN` — `{ slug: '2026-04-01-my-feature', stage: 'definition', health: 'green', stories: [] }`
- `FEAT_RED` — `{ slug: '2026-04-02-blocked', stage: 'test-plan', health: 'red', blockers: ['Missing test plan'], stories: [] }`
- `FEAT_XSS_SLUG` — slug contains `<script>alert(1)</script>`
- `FEAT_XSS_PHASE` — stage contains `<b>phase</b>`

Tests T1-T16 as per test plan.

---

## Task 4 — Extend package.json test chain

**File:** `package.json`
**Action:** Append `&& node tests/check-wuce22-status-board-html.js` to test script
