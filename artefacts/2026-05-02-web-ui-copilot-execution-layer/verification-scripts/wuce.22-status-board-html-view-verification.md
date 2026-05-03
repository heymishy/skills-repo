# Verification Script: Status board HTML view

**Story:** wuce.22 — Status board HTML view
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- `tests/check-wuce22-status-board-html.js` committed

---

## AC1 — GET /status Accept: text/html returns HTML status board

**Automated check:**
```bash
node tests/check-wuce22-status-board-html.js
```
T1–T4, T14 must pass.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/status` (authenticated, browser)
2. Confirm status board rendered: feature slugs, phases, health indicators visible
3. `Content-Type: text/html; charset=utf-8`

---

## AC2 — Accept: application/json returns JSON unchanged

**Automated check:** T7, T8

**Manual smoke check:**
```bash
curl -s http://localhost:3000/status -H "Accept: application/json" | python3 -m json.tool
```

**Pass criteria:** Valid JSON, unchanged shape

---

## AC3 — Colour indicators also have text labels

**Automated check:** T5, T6

**Manual smoke check:**
1. Load `/status` in browser
2. For a "blocked" / "red" feature: confirm text label "Blocked" or "At risk" visible alongside any colour indicator
3. For a "green" feature: confirm text label "On track" or "In progress" visible
4. Turn off CSS (DevTools → Rendering → Disable CSS) — confirm information still readable via text labels alone

**Pass criteria:** Meaning conveyed by text, not colour alone

---

## AC4 — User-supplied values escaped

**Automated check:** T9, T10

---

## AC5 — Unauthenticated → 302

**Automated check:** T11

---

## AC6 — GET /status/export unchanged

**Automated check:** T12, T13

**Manual smoke check:**
```bash
curl -s http://localhost:3000/status/export -H "Accept: application/json" | python3 -m json.tool
```

**Pass criteria:** Same response as before wuce.22; no regression

---

## NFR checks

| NFR | Check |
|-----|-------|
| `renderStatusBoard()` imported from `utils/status-board.js` (not inlined) | `grep -n "renderStatusBoard" src/web-ui/routes/status.js` shows import, not definition |
| Audit log written | T15 automated |
| `getPipelineStatus()` called once | T16 automated |
