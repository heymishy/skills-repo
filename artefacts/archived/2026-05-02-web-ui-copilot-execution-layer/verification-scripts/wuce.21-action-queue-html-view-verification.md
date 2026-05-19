# Verification Script: Action queue HTML view

**Story:** wuce.21 — Action queue HTML view
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- `tests/check-wuce21-action-queue-html.js` committed

---

## AC1 — GET /actions returns HTML action list

**Automated check:**
```bash
node tests/check-wuce21-action-queue-html.js
```
T1–T5, T15 must pass.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/actions` (authenticated)
2. Confirm: title visible, list of actions shown, each with title, feature, action type, and link
3. `Content-Type: text/html; charset=utf-8`

---

## AC2 — Empty action queue → empty-state message

**Automated check:** T6

**Manual smoke check (when no pending actions):**
1. Load `/actions`
2. Confirm "No pending actions" (or equivalent) — no empty list

---

## AC3 — GET /api/actions JSON endpoint unchanged

**Automated check:** T7, T8, T16

**Manual smoke check:**
```bash
curl -s http://localhost:3000/api/actions -H "Accept: application/json" | python3 -m json.tool
```

**Pass criteria:** Valid JSON response, Content-Type: application/json, shape unchanged

---

## AC4 — User-supplied values in actions escaped

**Automated check:** T9, T10

---

## AC5 — Unauthenticated /actions → 302

**Automated check:** T11

---

## AC6 — /dashboard nav "Actions" link goes to /actions, not /api/actions

**Automated check:** T12

**Manual smoke check:**
1. Load `/dashboard` (authenticated)
2. Hover/inspect "Actions" link — confirm URL is `/actions` not `/api/actions`
3. Click "Actions" link — confirm you land on the action queue HTML page

**Pass criteria:** Link destination is `/actions`; HTML page loads

---

## NFR checks

| NFR | Check |
|-----|-------|
| `handleGetActionsHtml()` is a separate handler (ADR-009) | `grep -n "handleGetActionsHtml" src/web-ui/routes/dashboard.js` should return one definition |
| `getPendingActions()` called via adapter (ADR-012) | No inline `fetch(` or `https.request` in route handler body |
| Audit log written | T13 automated |
