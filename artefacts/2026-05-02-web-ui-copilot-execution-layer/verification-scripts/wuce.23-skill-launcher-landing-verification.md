# Verification Script: Skill launcher landing

**Story:** wuce.23 — Skill launcher landing
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- `tests/check-wuce23-skill-launcher-landing.js` committed

---

## AC1 — GET /skills renders HTML skill list with Start button per skill

**Automated check:**
```bash
node tests/check-wuce23-skill-launcher-landing.js
```
T1–T4 must pass.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/skills` (authenticated)
2. Confirm a list of skills is rendered, each with name, description, and a "Start" button
3. `Content-Type: text/html; charset=utf-8`

---

## AC2 — Forms use POST method and correct action URLs; work without JavaScript

**Automated check:** T5, T6, T14

**Manual smoke check:**
1. Load `/skills` in browser
2. Disable JavaScript in DevTools
3. Click "Start" on a skill — confirm POST is submitted and you are redirected to the session URL (303)

**Pass criteria:** Works without JavaScript; 303 redirect fires

---

## AC3 — Non-2xx POST → HTML error page, not raw JSON

**Automated check:** T8

**Manual smoke check (if testable):**
1. Trigger a POST to `/api/skills/invalid-skill/sessions`
2. Confirm HTML error page with nav shell rendered (not raw JSON)

---

## AC4 — User-supplied values escaped

**Automated check:** T9, T10

---

## AC5 — Unauthenticated → 302

**Automated check:** T11, T12

---

## AC6 — /dashboard "Run a Skill" link points to /skills

**Automated check:** T13

**Manual smoke check:**
1. Load `/dashboard` (authenticated)
2. Click "Run a Skill" in nav
3. Confirm you land on `/skills` HTML page

---

## NFR checks

| NFR | Check |
|-----|-------|
| `handleGetSkillsHtml()` is a separate export from JSON handler (ADR-009) | T16 automated / grep check |
| No inline GitHub API fetch in route handler (ADR-012) | `grep -n "https\.\|fetch(" src/web-ui/routes/skills.js` should show no inline calls |
| Audit log written | T15 automated |
